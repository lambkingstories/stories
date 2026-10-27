<script setup lang="ts">
/**
 * The hem: in the cave Saul stands with his back to David, the long mantle with its embroidered border hangs down (a painted picture). A soft dashed seam runs along the hem (a guide of the app, drawn over the picture).
 * The child puts a finger at the beginning of the seam and follows it to the end, slowly and quietly (the part that is done lights up). A finger that wanders too far from the seam is a mistake (Saul looks around, a cross)
 * and the stroke begins again; lifting the finger early also begins again, without a mistake. When the seam is done the corner of the cloth is cut off; after the last seam the picture changes to David with the corner in
 * his hand (no knife). Round 1: a straight seam and a wide track, round 2: a curved seam and a narrower track. The arithmetic is in `utils/davidGames.ts` (the seam points are percent of the picture).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { ASPECT, HEM_REACH, hemDone, hemStep, nearestOnPath } from '@/utils/davidGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { HemGame } from '@/types/adventure'

const props = defineProps<{ game: HemGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every seam
progress.setGoal(props.game.rounds.length)

const round = ref(0)
const fieldEl = ref<HTMLElement | null>(null)
const followed = ref(0)
const active = ref(false)
const finger = ref<{ x: number; y: number } | null>(null)
const crossAt = ref<{ x: number; y: number } | null>(null)
const shake = ref(false)
const cutDone = ref(false)
const showReward = ref(false)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
/** The seam as an SVG path in a picture of 100 × 75 units (the pictures are 4:3). */
const seamPath = computed(() => current.value.path.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${(p.y * ASPECT).toFixed(2)}`).join(' '))

function toPercent(e: PointerEvent): { x: number; y: number } | null {
  const r = fieldEl.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function down(e: PointerEvent) {
  if (between.value || finished.value) return
  const p = toPercent(e)
  if (!p) return
  const near = nearestOnPath(current.value.path, p)
  if (near.off > current.value.tol * 2.2 || near.along > HEM_REACH) {
    message.value = t('app.adventure.hemStart')
    return
  }
  message.value = ''
  active.value = true
  followed.value = 0
  finger.value = p
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
  step(p)
}
function move(e: PointerEvent) {
  if (!active.value) return
  const p = toPercent(e)
  if (!p) return
  finger.value = p
  step(p)
}
function up() {
  if (!active.value) return
  active.value = false
  finger.value = null
  if (!hemDone(followed.value)) followed.value = 0
}

function step(p: { x: number; y: number }) {
  const r = hemStep(current.value.path, followed.value, p, current.value.tol)
  if (r.off) {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.hemOff')
    crossAt.value = p
    shake.value = true
    active.value = false
    finger.value = null
    followed.value = 0
    later(() => {
      crossAt.value = null
      shake.value = false
    }, 900)
    return
  }
  followed.value = r.progress
  if (hemDone(followed.value)) cutOff()
}

function cutOff() {
  active.value = false
  finger.value = null
  between.value = true
  cutDone.value = true
  progress.mark()
  play('snap')
  message.value = t('app.adventure.hemCut')
  if (lastRound.value) {
    later(() => {
      showReward.value = true
      play('star')
    }, 1100)
    later(() => {
      finished.value = true
    }, 3600)
    return
  }
  later(() => {
    round.value++
    followed.value = 0
    cutDone.value = false
    between.value = false
    message.value = ''
  }, 1900)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="fieldEl"
        class="gm-field"
        :class="{ shake }"
        :style="{ backgroundImage: `url(${src(showReward ? game.reward : game.background)})` }"
        role="img"
        :aria-label="t('app.adventure.hemSeam')"
        @pointerdown.prevent="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @contextmenu.prevent
      )
        //- the seam and the part that is done
        svg(v-if="!showReward" class="gm-seam" viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true")
          path(class="gm-line" :d="seamPath" pathLength="100")
          path(class="gm-done" :d="seamPath" pathLength="100" :stroke-dasharray="`${followed * 100} 100`")
        span(v-if="finger" class="gm-finger" :style="{ left: `${finger.x}%`, top: `${finger.y}%` }" aria-hidden="true")
        span(v-if="crossAt" class="gm-cross" :style="{ left: `${crossAt.x}%`, top: `${crossAt.y}%` }" aria-hidden="true")
          GameMark(kind="bad")
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.hemDone')" @next="emit('done', stars)")
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
  touch-action: none

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
  background-color: #6a5a48
  background-size: cover
  background-position: center
  cursor: crosshair
  touch-action: none
  transition: background-image 600ms ease

  &.shake
    animation: gm-shake 400ms ease

.gm-seam
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

.gm-line
  fill: none
  stroke: rgba(255, 246, 220, 0.92)
  stroke-width: 1.2
  stroke-linecap: round
  stroke-dasharray: 2.4 1.8
  filter: drop-shadow(0 0 0.6px rgba(30, 20, 5, 0.9))

.gm-done
  fill: none
  stroke: #f2c94c
  stroke-width: 1.5
  stroke-linecap: round
  filter: drop-shadow(0 0 1.2px rgba(255, 215, 90, 0.95))

.gm-finger
  position: absolute
  display: block
  width: 22px
  height: 22px
  margin: -11px 0 0 -11px
  border-radius: 50%
  background: rgba(255, 240, 180, 0.85)
  box-shadow: 0 0 12px 4px rgba(255, 220, 110, 0.8)
  pointer-events: none
  z-index: 5

.gm-cross
  position: absolute
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 8

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

@keyframes gm-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-5px)
  75%
    transform: translateX(5px)

@media (prefers-reduced-motion: reduce)
  .gm-field
    transition: none
    &.shake
      animation: none
</style>
