<script setup lang="ts">
/**
 * Rock the cradle: a warm room with a small wicker cradle and the baby in it. The child taps the left side and the right side of the cradle one after the other, calmly: the cradle swings to the side that was tapped.
 * A rock that comes after a calm pause (not too fast, not too slow) on the other side is one calm rock; the baby gets sleepy after a few and falls asleep after the last. The same side twice or a rock that comes too fast
 * makes the baby restless (a cross, one mistake, the baby opens its eyes for a moment); a long break is only a new start. Round 1 shows with a soft glow which side comes next, round 2 does not. There is no clock.
 * The arithmetic is in `utils/rutGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { cradleState, rockAngle, rockVerdict, type Side } from '@/utils/rutGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { CradleGame } from '@/types/adventure'

const props = defineProps<{ game: CradleGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const total = props.game.rounds.reduce((n, r) => n + r.calm, 0)
// the whole task: every calm rock of every round
progress.setGoal(total)

const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
const calmRound = ref(0)
const calmTotal = ref(0)
const lastSide = ref<Side | null>(null)
let lastAt: number | null = null
const swing = ref<Side | null>(null)
const restless = ref(false)
let restlessKey = 0
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[round.value]!)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const state = computed(() => (restless.value ? 0 : cradleState(calmTotal.value, total)))
const angle = computed(() => rockAngle(swing.value, reduced))
const nextSide = computed<Side>(() => (lastSide.value === 'left' ? 'right' : 'left'))
const cradleStyle = computed(() => ({ left: `${props.game.cradle.x}%`, top: `${props.game.cradle.y}%`, width: `${props.game.cradle.w}%`, transform: `translate(-50%, -100%) rotate(${angle.value}deg)` }))
const mistakeAt = ref<Side | null>(null)

let swingTimer = 0
onBeforeUnmount(() => window.clearTimeout(swingTimer))

function rock(side: Side) {
  if (between.value || finished.value) return
  const now = Date.now()
  const verdict = rockVerdict(lastSide.value, side, lastAt === null ? null : now - lastAt)
  lastSide.value = side
  lastAt = now
  swing.value = side
  window.clearTimeout(swingTimer)
  swingTimer = window.setTimeout(() => (swing.value = null), reduced ? 250 : 700)
  if (verdict === 'first' || verdict === 'slow') {
    play('tap')
    message.value = verdict === 'slow' ? t('app.adventure.cradleSlow') : ''
    return
  }
  if (verdict === 'fast' || verdict === 'same') {
    misses.value++
    play('wrong')
    message.value = t(verdict === 'fast' ? 'app.adventure.cradleFast' : 'app.adventure.cradleSame')
    mistakeAt.value = side
    restless.value = true
    const k = ++restlessKey
    later(() => {
      if (restlessKey === k) {
        restless.value = false
        mistakeAt.value = null
      }
    }, 1100)
    return
  }
  // calm
  calmRound.value++
  calmTotal.value++
  progress.mark()
  play('bead')
  message.value = ''
  if (calmRound.value >= current.value.calm) roundOver()
}

function roundOver() {
  between.value = true
  if (round.value + 1 >= props.game.rounds.length) {
    message.value = t('app.adventure.cradleAsleep')
    play('star')
    later(() => {
      finished.value = true
    }, 2200)
    return
  }
  message.value = t('app.adventure.cradleSleepy')
  later(() => {
    round.value++
    calmRound.value = 0
    lastSide.value = null
    lastAt = null
    between.value = false
    message.value = ''
  }, 1900)
}

function keydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    rock('left')
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    rock('right')
  }
}
</script>

<template lang="pug">
  div(class="cr")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="cr-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="cr-hint") {{ current.hint }}
      div(class="cr-field" :style="{ backgroundImage: `url(${src(game.background)})` }" tabindex="0" @keydown="keydown")
        span(class="cr-cradle" :style="cradleStyle" role="img" :aria-label="t(`app.adventure.cradleState${state}`)")
          span(v-for="(s, i) in game.states" :key="`state-${i}`" class="cr-state" :class="{ first: i === 0, on: i === state }")
            GameImage(:src="s" colour="#b99a5a")
        button(
          type="button"
          class="cr-side left"
          :class="{ guide: current.guide && nextSide === 'left' && !between }"
          :disabled="between"
          :aria-label="t('app.adventure.cradleLeft')"
          @click="rock('left')"
        )
          span(class="cr-ring" aria-hidden="true")
          span(v-if="mistakeAt === 'left'" class="cr-miss" aria-hidden="true")
            GameMark(kind="bad")
        button(
          type="button"
          class="cr-side right"
          :class="{ guide: current.guide && nextSide === 'right' && !between }"
          :disabled="between"
          :aria-label="t('app.adventure.cradleRight')"
          @click="rock('right')"
        )
          span(class="cr-ring" aria-hidden="true")
          span(v-if="mistakeAt === 'right'" class="cr-miss" aria-hidden="true")
            GameMark(kind="bad")
      p(class="cr-count" aria-live="polite") {{ t('app.adventure.cradleCount', { n: calmTotal, total }) }}
      p(class="cr-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.cradleDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.cr
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)

.cr-round
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

.cr-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.cr-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center
  outline: none

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px

// the cradle swings around the middle of its foot
.cr-cradle
  position: absolute
  display: block
  transform-origin: 50% 100%
  transition: transform 480ms ease-in-out
  pointer-events: none

.cr-state
  display: block
  width: 100%
  opacity: 0
  transition: opacity 600ms ease

  &:not(.first)
    position: absolute
    left: 0
    top: 0

  &.on
    opacity: 1

// the two sides of the cradle to tap: big areas on the left and on the right
.cr-side
  position: absolute
  bottom: 4%
  width: 36%
  height: 56%
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.left
    left: 4%

  &.right
    right: 4%

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 18px

.cr-ring
  position: absolute
  inset: 18% 14%
  border-radius: 50%
  border: 3px solid rgba(255, 246, 220, 0.55)
  background: rgba(255, 246, 220, 0.12)
  transition: background 300ms ease, border-color 300ms ease

.cr-side:active .cr-ring
  background: rgba(255, 220, 120, 0.35)

// the soft glow of the side that comes next (first round)
.cr-side.guide .cr-ring
  border-color: rgba(255, 214, 100, 0.95)
  background: rgba(255, 214, 100, 0.28)
  animation: cr-glow 1400ms ease-in-out infinite

.cr-miss
  position: absolute
  left: 50%
  top: 40%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.cr-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

.cr-fb
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

@keyframes cr-glow
  0%, 100%
    opacity: 0.55
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .cr-cradle
    transition: none
  .cr-side.guide .cr-ring
    animation: none
</style>
