<script setup lang="ts">
/**
 * In step: the priests carry the ark through the dry bed of the Jordan, calm and together. On the gravel path footprints lie, and at every beat the next one glows. The child taps when the
 * foot comes down (the big "Step" button, or anywhere on the picture, or the space key); the bearers then go one step on. A tap in time is green with a tick and a soft tone, a tap
 * beside the beat makes the ark wobble a little with a cross (a mistake). Beats that nobody taps cost nothing, they just go on. After five wrong taps in a round the beat gets a little more
 * room ("quiet beat"). "Show the beat" shows a bar that fills up to the next beat. Round 1: eight steps at 70 beats a minute, round 2: twelve steps at 90. There is no clock to lose. The
 * beats and the judging are `nearestBeat` and `judge` in `utils/josuaGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { judge, nearestBeat } from '@/utils/josuaGames'
import { positionAt } from '@/utils/jakobGames2'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { StepGame } from '@/types/adventure'

const props = defineProps<{ game: StepGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every step of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.steps, 0))

/** The seconds between pressing "Start" and the first beat, how long a footprint glows round its beat, the room that "quiet beat" adds, and the wrong taps after which it comes. */
const LEAD = 1.5
const GLOW = 0.14
const ROOM = 0.15
const AFTER = 5

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const hits = ref(0)
const wrongHere = ref(0)
const mistakes = ref(0)
const roomy = ref(false)
const started = ref(false)
const startAt = ref(0)
const lastHit = ref(-1)
const between = ref(false)
const finished = ref(false)
const showBar = ref(false)
const message = ref('')
const flash = ref<'good' | 'bad' | null>(null)
const wobble = ref(false)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(mistakes.value, 3, 8))
const tolerance = computed(() => current.value.tolerance + (roomy.value ? ROOM : 0))

const nowS = () => Date.now() / 1000
const now = ref(nowS())
const gap = computed(() => 60 / current.value.bpm)
let lastBeatNo = -1
const timer = window.setInterval(() => {
  now.value = nowS()
  if (!started.value || between.value || finished.value) return
  const no = Math.floor((now.value - startAt.value) / gap.value)
  if (now.value >= startAt.value && no !== lastBeatNo) {
    lastBeatNo = no
    play('tap', 0.3)
  }
}, 40)
onBeforeUnmount(() => window.clearInterval(timer))

/** The beat that is nearest now, and how far the clock is from it. */
const beat = computed(() => nearestBeat(now.value, current.value.bpm, startAt.value))
const lit = computed(() => started.value && !between.value && Math.abs(now.value - beat.value) <= GLOW && now.value >= startAt.value - GLOW)
/** From the last beat to the next one, in whole percent (for the bar). */
const phase = computed(() => (started.value && now.value >= startAt.value ? Math.round((((now.value - startAt.value) % gap.value) / gap.value) * 100) : 0))

function start() {
  if (started.value || between.value || finished.value) return
  started.value = true
  startAt.value = nowS() + LEAD
  lastBeatNo = -1
  lastHit.value = -1
  message.value = ''
}

function flashOn(kind: 'good' | 'bad') {
  flash.value = kind
  later(() => {
    flash.value = null
  }, 600)
}

/** A step: judged against the nearest beat. */
function step() {
  if (!started.value || between.value || finished.value) return
  const t0 = nowS()
  // before the first beat nothing counts (the child may tap too early, that is no mistake)
  if (t0 < startAt.value - tolerance.value) return
  const b = nearestBeat(t0, current.value.bpm, startAt.value)
  if (judge(t0, b, tolerance.value) && lastHit.value !== b) {
    lastHit.value = b
    hits.value++
    progress.mark()
    play('right')
    message.value = ''
    flashOn('good')
    if (hits.value >= current.value.steps) roundOver()
    return
  }
  mistakes.value++
  wrongHere.value++
  play('wrong')
  flashOn('bad')
  wobble.value = true
  later(() => {
    wobble.value = false
  }, 450)
  message.value = t('app.adventure.stepMiss')
  if (wrongHere.value >= AFTER && !roomy.value) {
    roomy.value = true
    message.value = t('app.adventure.stepQuiet')
  }
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 900)
    return
  }
  between.value = true
  message.value = t('app.adventure.gameNext')
  later(() => {
    round.value++
    hits.value = 0
    wrongHere.value = 0
    roomy.value = false
    started.value = false
    between.value = false
    message.value = ''
  }, 1700)
}

function key(e: KeyboardEvent) {
  if (e.key !== ' ' || (e.target as HTMLElement | null)?.tagName === 'BUTTON') return
  e.preventDefault()
  step()
}

const at = (frac: number) => positionAt(props.game.path, frac)
const prints = computed(() =>
  Array.from({ length: current.value.steps }, (_, i) => {
    const p = at((i + 0.5) / current.value.steps)
    return { i, style: { left: `${p.x}%`, top: `${p.y}%` }, mirror: i % 2 === 1, done: i < hits.value, next: i === hits.value }
  })
)
const bearerStyle = computed(() => {
  const p = at(current.value.steps ? hits.value / current.value.steps : 0)
  return { left: `${p.x}%`, top: `${p.y}%` }
})
</script>

<template lang="pug">
  div(class="st" tabindex="-1" @keydown="key")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="st-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="st-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="st-field" role="group" :aria-label="t('app.adventure.stepField', { n: hits, total: current.steps })" :style="{ backgroundImage: `url(${src(game.background)})` }" @pointerdown="step")
        span(
          v-for="p in prints"
          :key="`${round}-${p.i}`"
          class="st-print"
          :class="{ done: p.done, next: p.next, lit: p.next && lit, mirror: p.mirror }"
          :style="p.style"
          aria-hidden="true"
        )
          GameImage(:src="game.print" :ratio="80 / 120" colour="#e3d3a4")
        span(class="st-bearers" :class="{ wobble }" :style="bearerStyle" aria-hidden="true")
          GameImage(:src="game.bearers" :ratio="480 / 320" colour="#d9b45a")
        GameMark(v-if="flash" :kind="flash" class="st-mark")
      div(v-if="showBar" class="st-bar" role="presentation")
        span(class="st-bar-fill" :style="{ width: `${phase}%` }")
      p(class="st-fb" role="status") {{ message }}
      div(class="st-actions")
        AdvButton(v-if="!started" tone="gold" class="st-go" :disabled="between" @click.stop="start") {{ t('app.adventure.stepStart') }}
        AdvButton(v-else tone="gold" class="st-go" :disabled="between" @click.stop="step") {{ t('app.adventure.stepButton') }}
        AdvButton(tone="blau" @click.stop="showBar = !showBar") {{ t('app.adventure.stepSeeBeat') }}
      p(class="st-count") {{ t('app.adventure.stepCount', { n: hits, total: current.steps }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.stepDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.st
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)
  outline: none

.st-round
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

.st-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.st-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #9fb6c9
  background-size: cover
  background-position: center
  touch-action: manipulation

// a footprint lies on the path; the next one glows at the beat
.st-print
  position: absolute
  display: block
  width: 5%
  transform: translate(-50%, -50%)
  opacity: 0.55
  pointer-events: none

  &.mirror
    transform: translate(-50%, -50%) scaleX(-1)

  &.done
    opacity: 0.25

  &.next
    opacity: 0.8

  &.lit
    opacity: 1
    filter: drop-shadow(0 0 6px rgba(255, 230, 120, 1))

.st-bearers
  position: absolute
  display: block
  width: 22%
  transform: translate(-50%, -85%)
  transition: left 350ms ease, top 350ms ease
  pointer-events: none
  z-index: 5

  &.wobble
    animation: st-wobble 420ms ease-in-out

.st-mark
  position: absolute
  top: 8px
  left: 50%
  transform: translateX(-50%)
  z-index: 10

.st-bar
  height: 14px
  border-radius: 999px
  background: rgba(95, 65, 25, 0.25)
  overflow: hidden

.st-bar-fill
  display: block
  height: 100%
  background: #d4a83e

.st-fb
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

.st-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px

.st-go
  min-height: 60px
  min-width: 180px

.st-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@keyframes st-wobble
  0%, 100%
    transform: translate(-50%, -85%) rotate(0)
  30%
    transform: translate(-50%, -85%) rotate(-3deg)
  70%
    transform: translate(-50%, -85%) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .st-bearers
    transition: none

    &.wobble
      animation: none
</style>
