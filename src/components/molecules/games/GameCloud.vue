<script setup lang="ts">
/**
 * Follow the cloud: at the tent of meeting stands a pillar of cloud (by day) or a pillar of light (by night). When the pillar rises, the people break up; when it does not rise, they stay. The scene
 * repeats itself until the child answers: the pillar rises slowly and comes down again, or it stays; round it, things drift that have nothing to do with it (smoke, birds, flags, sparks). The child taps
 * "Break up" or "Stay" when sure (or the arrow keys up and down). A right answer is a tick; a wrong one a cross and a mistake, the right way is shown, and that trial comes once more at the end of
 * the round. Nothing runs out. Round 1 is five questions by day, round 2 five by night. The answer is `answerOk` in `utils/moseGames.ts`. With reduced motion the pillar moves more slowly and the
 * distractions stand still.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { answerOk, type Answer } from '@/utils/moseGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CloudGame, CloudTrial } from '@/types/adventure'

const props = defineProps<{ game: CloudGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every right answer of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.trials.length, 0))

/** Where the distractions drift (percent of the picture) and stand-in colours for them. */
const SPOTS: Record<string, { x: number; y: number; w: number; colour: string }[]> = {
  smoke: [{ x: 20, y: 52, w: 8, colour: '#d6d3cc' }, { x: 80, y: 56, w: 8, colour: '#d6d3cc' }],
  birds: [{ x: 30, y: 18, w: 7, colour: '#4a4252' }, { x: 66, y: 12, w: 6, colour: '#4a4252' }],
  banner: [{ x: 14, y: 40, w: 7, colour: '#c9483c' }, { x: 88, y: 40, w: 7, colour: '#4f7fb5' }],
  sparks: [{ x: 38, y: 40, w: 7, colour: '#ffd36a' }, { x: 62, y: 30, w: 6, colour: '#ffd36a' }]
}

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const queue = ref<CloudTrial[]>(current.value.trials.slice())
const trial = computed(() => queue.value[0])
const answered = ref(0)
const mistakes = ref(0)
const between = ref(false)
const finished = ref(false)
const locked = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 1, 3))
const night = computed(() => current.value.mode === 'night')

function answer(a: Answer) {
  const tr = trial.value
  if (!tr || locked.value || between.value || finished.value) return
  locked.value = true
  if (answerOk(tr, a)) {
    answered.value++
    progress.mark()
    play('snap')
    flash.value = 'good'
    message.value = t('app.adventure.cloudRight')
    later(next, 1000)
    return
  }
  mistakes.value++
  play('wrong')
  flash.value = 'bad'
  message.value = t(tr.pillar === 'rises' ? 'app.adventure.cloudShowRises' : 'app.adventure.cloudShowStays')
  // the trial comes once more at the end of the round
  later(() => {
    queue.value = [...queue.value.slice(1), tr]
    flash.value = null
    message.value = ''
    locked.value = false
  }, 2200)
}

function next() {
  flash.value = null
  message.value = ''
  queue.value = queue.value.slice(1)
  if (queue.value.length) {
    locked.value = false
    return
  }
  if (lastRound.value) {
    finished.value = true
    play('star')
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    queue.value = current.value.trials.slice()
    answered.value = 0
    between.value = false
    locked.value = false
    message.value = ''
  }, 1500)
}

function key(e: KeyboardEvent) {
  if (e.key === 'ArrowUp') answer('go')
  else if (e.key === 'ArrowDown') answer('stay')
  else return
  e.preventDefault()
}

const total = computed(() => current.value.trials.length)
const sceneImage = computed(() => (night.value ? props.game.nightScene : props.game.dayScene))
const pillarImage = computed(() => (night.value ? props.game.pillarNight : props.game.pillarDay))
const trialKey = computed(() => `${round.value}-${answered.value}-${mistakes.value}-${queue.value.length}`)
</script>

<template lang="pug">
  div(class="cd" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="cd-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="cd-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="cd-field" :class="{ night }" role="group" :aria-label="t(night ? 'app.adventure.cloudFieldNight' : 'app.adventure.cloudFieldDay')" :style="{ backgroundImage: `url(${src(sceneImage)})` }")
        template(v-if="!between && trial")
          span(
            :key="`p-${trialKey}`"
            class="cd-pillar"
            :class="trial.pillar"
            role="img"
            :aria-label="t(night ? 'app.adventure.cloudPillarNight' : 'app.adventure.cloudPillarDay')"
          )
            GameImage(:src="pillarImage" :ratio="220 / 640" :colour="night ? '#ffcf70' : '#f1f1f4'")
          template(v-for="kind in trial.distractors" :key="`d-${trialKey}-${kind}`")
            span(v-for="(s, i) in SPOTS[kind] ?? []" :key="`${kind}-${i}`" class="cd-extra" :class="kind" :style="{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }" aria-hidden="true")
              GameImage(:src="game.extras[kind] ?? ''" :colour="s.colour" round)
        GameMark(v-if="flash" :kind="flash" class="cd-mark")
      p(class="cd-fb" role="status") {{ message }}
      div(class="cd-answers")
        AdvButton(tone="gold" :disabled="between || locked" @click="answer('go')") {{ t('app.adventure.cloudGo') }}
        AdvButton(tone="gold" :disabled="between || locked" @click="answer('stay')") {{ t('app.adventure.cloudStay') }}
      p(class="cd-count") {{ t('app.adventure.cloudCount', { n: answered, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cloudDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cd
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.cd-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.92)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.cd-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.cd-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #b6c6d8
  background-size: cover
  background-position: center

  &.night
    background-color: #1e2238

// the pillar stands behind the tent; it rises slowly and comes down again, or it stays and only sways a little
.cd-pillar
  position: absolute
  left: 50%
  bottom: 24%
  display: block
  width: 14%
  transform: translateX(-50%)
  transform-origin: 50% 100%
  pointer-events: none

  &.rises
    animation: cd-rise 5s ease-in-out infinite

  &.stays
    animation: cd-stay 5s ease-in-out infinite

.cd-extra
  position: absolute
  display: block
  pointer-events: none

  &.smoke
    animation: cd-smoke 6s ease-in infinite

  &.birds
    animation: cd-birds 7s linear infinite

  &.banner
    animation: cd-wave 2.4s ease-in-out infinite

  &.sparks
    animation: cd-spark 2.8s ease-in-out infinite

.cd-mark
  position: absolute
  top: 8px
  right: 8px
  z-index: 8

.cd-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

.cd-answers
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 12px

.cd-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes cd-rise
  0%, 25%
    transform: translateX(-50%) translateY(0)
    opacity: 1
  55%, 75%
    transform: translateX(-50%) translateY(-55%)
    opacity: 0.85
  100%
    transform: translateX(-50%) translateY(0)
    opacity: 1

@keyframes cd-stay
  0%, 100%
    transform: translateX(-50%) rotate(0deg)
  50%
    transform: translateX(-50%) rotate(1.2deg)

@keyframes cd-smoke
  0%
    transform: translateY(0) scale(0.8)
    opacity: 0
  30%
    opacity: 0.8
  100%
    transform: translateY(-120%) scale(1.3)
    opacity: 0

@keyframes cd-birds
  0%
    transform: translateX(-60%)
  100%
    transform: translateX(160%)

@keyframes cd-wave
  0%, 100%
    transform: rotate(-6deg)
  50%
    transform: rotate(6deg)

@keyframes cd-spark
  0%, 100%
    opacity: 0.2
    transform: translateY(0)
  50%
    opacity: 1
    transform: translateY(-30%)

@media (prefers-reduced-motion: reduce)
  .cd-pillar.rises
    animation-duration: 9s

  .cd-pillar.stays, .cd-extra
    animation: none
</style>
