<script setup lang="ts">
/**
 * Hold the arms (Exodus 17,11-12): while Moses holds his hands up on the hill, Israel wins; when he lets them sink, the other side wins. Moses sits on his stone, and his arms sink slowly. Round 1: the child holds a
 * finger on Moses (or on the big button below the picture) and the arms rise and stay up as long as the finger stays; the sun sinks while the arms are up (a bar), and the round is done when the sun has gone down
 * (the seconds the arms were up). Round 2: Aaron and Hur kneel at Moses' sides: the child taps them one after the other (the same man twice in a row is too tired, a cross) and every good tap lifts the arms.
 * Nobody loses: when the arms have sunk the child lifts them again; the stars come from how often they sank. The arithmetic is in `utils/wuesteGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { armsAreUp, armsPose, armsStep, armsUpTime, helperLift, helperTap } from '@/utils/wuesteGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ArmsGame } from '@/types/adventure'

const props = defineProps<{ game: ArmsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every second the arms stay up, in every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.goal, 0))

const TICK = 50
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const level = ref(0.3)
const upTime = ref(0)
const holding = ref(false)
const lastHelper = ref<string | null>(null)
const crossAt = ref<string | null>(null)
const drops = ref(0)
const sank = ref(true)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const marked = ref(0)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(drops.value, 2, 5))
const pose = computed(() => armsPose(level.value))
const left = computed(() => Math.max(0, Math.ceil(current.value.goal - upTime.value)))
const share = computed(() => Math.min(100, (upTime.value / current.value.goal) * 100))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)

function endRound() {
  between.value = true
  holding.value = false
  message.value = t('app.adventure.armsRoundDone')
  play('right')
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2000)
    return
  }
  later(() => {
    round.value++
    level.value = 0.3
    upTime.value = 0
    marked.value = 0
    lastHelper.value = null
    sank.value = true
    between.value = false
    message.value = ''
  }, 2400)
}

const timer = window.setInterval(() => {
  if (between.value || finished.value) return
  const dt = TICK / 1000
  level.value = armsStep(level.value, dt, holding.value, current.value.sink)
  upTime.value = armsUpTime(upTime.value, dt, level.value)
  // every full second with the arms up counts a part of the task
  const whole = Math.min(current.value.goal, Math.floor(upTime.value))
  while (marked.value < whole) {
    progress.mark()
    marked.value++
  }
  if (armsPose(level.value) === 0 && !sank.value) {
    sank.value = true
    drops.value++
    message.value = t('app.adventure.armsDown')
  } else if (armsAreUp(level.value)) {
    sank.value = false
    message.value = ''
  }
  if (upTime.value >= current.value.goal) endRound()
}, TICK)
onBeforeUnmount(() => window.clearInterval(timer))

function hold(on: boolean) {
  if (between.value || finished.value) return
  holding.value = on
}

function tapHelper(id: string) {
  if (between.value || finished.value) return
  if (helperTap(lastHelper.value, id) === 'again') {
    play('wrong')
    message.value = t('app.adventure.armsAgain')
    crossAt.value = id
    later(() => {
      if (crossAt.value === id) crossAt.value = null
    }, 900)
    return
  }
  lastHelper.value = id
  level.value = helperLift(level.value)
  play('snap')
  message.value = ''
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.armsField')"
      )
        button(
          type="button"
          class="gm-moses"
          :class="{ up: armsAreUp(level) }"
          :style="{ left: `${game.moses.x}%`, top: `${game.moses.y}%`, width: `${game.moses.w}%` }"
          :aria-label="game.moses.label"
          :disabled="between || current.helpers"
          @pointerdown.prevent="hold(true)"
          @pointerup="hold(false)"
          @pointerleave="hold(false)"
          @pointercancel="hold(false)"
        )
          img(v-for="(p, i) in game.poses" :key="i" class="gm-pose" :class="{ on: pose === i }" :src="src(p)" alt="" draggable="false")
        template(v-if="current.helpers")
          button(
            v-for="h in game.helpers"
            :key="h.id"
            type="button"
            class="gm-helper"
            :class="{ last: lastHelper === h.id }"
            :style="{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%` }"
            :aria-label="h.label"
            :disabled="between"
            @click="tapHelper(h.id)"
          )
            img(:src="src(h.image)" alt="" draggable="false")
            span(v-if="crossAt === h.id" class="gm-cross" aria-hidden="true")
              GameMark(kind="bad")
      div(class="gm-sun" role="progressbar" :aria-valuenow="Math.round(share)" aria-valuemin="0" aria-valuemax="100" :aria-label="t('app.adventure.armsSun')")
        span(class="gm-sun-fill" :style="{ width: `${share}%` }")
      button(
        v-if="!current.helpers"
        type="button"
        class="gm-hold"
        :class="{ on: holding }"
        :disabled="between"
        @pointerdown.prevent="hold(true)"
        @pointerup="hold(false)"
        @pointerleave="hold(false)"
        @pointercancel="hold(false)"
        @keydown.space.prevent="hold(true)"
        @keyup.space.prevent="hold(false)"
        @keydown.enter.prevent="hold(true)"
        @keyup.enter.prevent="hold(false)"
      ) {{ t('app.adventure.armsHold') }}
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.armsCount', { n: left }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.armsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
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

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #c79a63
  background-size: cover
  background-position: center

// Moses: three pictures lie on top of each other, the one of the level shows
.gm-moses
  position: absolute
  display: block
  min-width: 88px
  aspect-ratio: 1 / 1
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  touch-action: none
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 5px 4px rgba(40, 25, 5, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

.gm-pose
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: contain
  object-position: bottom center
  opacity: 0
  pointer-events: none

  &.on
    opacity: 1

.gm-helper
  position: absolute
  display: block
  min-width: 88px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 5px 4px rgba(40, 25, 5, 0.4))

  &.last img
    filter: brightness(0.86)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

.gm-cross
  position: absolute
  left: 50%
  top: 20%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 5

// the sinking sun: a bar that fills while the arms are up
.gm-sun
  align-self: center
  width: 86%
  height: 16px
  border-radius: 999px
  overflow: hidden
  border: 2px solid #d4a83e
  background: rgba(255, 246, 220, 0.9)

.gm-sun-fill
  display: block
  height: 100%
  border-radius: 999px
  background: linear-gradient(90deg, #f6c453, #e58f3a)
  transition: width 120ms linear

.gm-hold
  align-self: center
  min-width: 70%
  min-height: 64px
  padding: 10px 22px
  border-radius: 999px
  border: 3px solid #b8892b
  background: linear-gradient(180deg, #ffe08a, #f0b43a)
  font-weight: 800
  font-size: 1.1rem
  color: #4b3512
  cursor: pointer
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &.on
    background: linear-gradient(180deg, #f0b43a, #d99a22)
    transform: scale(0.98)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
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

@media (prefers-reduced-motion: reduce)
  .gm-sun-fill
    transition: none
</style>
