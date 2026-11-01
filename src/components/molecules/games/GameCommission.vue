<script setup lang="ts">
/**
 * Joshua is set apart (Numbers 27,18-23): Moses is to take Joshua, put him before the priest Eleazar and before the whole community, and lay his hands on him. Round 1: the child leads Joshua to the marked place between
 * Eleazar and the community (a finger drags him there, or a tap on Joshua and a tap on the place); a place that is too far away sends him back (a mistake). Round 2: the finger rests on Joshua until the ring is full:
 * then Moses lays his hands on him. The places are measured in `utils/wuesteGames2.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import GameMark from '@/components/atoms/GameMark.vue'
import WuesteFrame from '@/components/molecules/games/WuesteFrame.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { mistakeStars } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import { dropOk, holdShare } from '@/utils/wuesteGames2'
import type { CommissionGame } from '@/types/wuesteGames2'

const props = defineProps<{ game: CommissionGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(2)

const src = (p: string) => prependBaseUrl(p)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const at = reactive({ x: props.game.joshua.start.x, y: props.game.joshua.start.y })
const selected = ref(false)
const placed = ref(false)
const holdMs = ref(0)
const holding = ref(false)
const laid = ref(false)
const misses = ref(0)
const crossAt = ref(false)
const finished = ref(false)
const message = ref('')
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const t = computed(() => props.game.texts)
const count = computed(() => t.value.count.replace('{n}', String(progress.parts.value)).replace('{total}', String(progress.goal.value)))
const share = computed(() => holdShare(holdMs.value, props.game.holdMs))

const layer = ref<HTMLElement | null>(null)
const drag = reactive({ on: false, moved: false, sx: 0, sy: 0 })
const pct = (e: PointerEvent) => {
  const r = layer.value?.getBoundingClientRect()
  if (!r || !r.width) return { x: 0, y: 0 }
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

function place(x: number, y: number) {
  if (dropOk(x, y, props.game.joshua.spot, props.game.radius)) {
    at.x = props.game.joshua.spot.x
    at.y = props.game.joshua.spot.y
    placed.value = true
    selected.value = false
    progress.mark()
    play('snap')
    message.value = t.value.placed
    later(() => {
      round.value = 1
      message.value = ''
    }, 1700)
    return
  }
  misses.value++
  play('wrong')
  message.value = t.value.wrong
  crossAt.value = true
  at.x = props.game.joshua.start.x
  at.y = props.game.joshua.start.y
  selected.value = false
  later(() => {
    crossAt.value = false
  }, 900)
}

let holdTimer = 0
onBeforeUnmount(() => window.clearTimeout(holdTimer))
function startHold() {
  if (laid.value || holding.value) return
  holding.value = true
  message.value = ''
  const tick = () => {
    if (!holding.value) return
    holdMs.value += 50
    if (holdMs.value >= props.game.holdMs) {
      holding.value = false
      laid.value = true
      progress.mark()
      play('right')
      message.value = t.value.laid
      later(() => {
        play('star')
        finished.value = true
      }, 2000)
      return
    }
    holdTimer = window.setTimeout(tick, 50)
  }
  holdTimer = window.setTimeout(tick, 50)
}
function stopHold() {
  if (!holding.value) return
  holding.value = false
  window.clearTimeout(holdTimer)
  if (!laid.value) {
    holdMs.value = 0
    message.value = t.value.hold
  }
}

function down(e: PointerEvent) {
  if (finished.value) return
  if (round.value === 1) {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    startHold()
    return
  }
  if (placed.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  const p = pct(e)
  Object.assign(drag, { on: true, moved: false, sx: p.x, sy: p.y })
}
function move(e: PointerEvent) {
  if (!drag.on) return
  const p = pct(e)
  if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 1.5) drag.moved = true
  if (drag.moved) {
    at.x = p.x
    at.y = p.y
  }
}
function up() {
  if (round.value === 1) {
    stopHold()
    return
  }
  if (!drag.on) return
  drag.on = false
  if (!drag.moved) {
    selected.value = !selected.value
    return
  }
  place(at.x, at.y)
}
function spotTap() {
  if (round.value === 0 && selected.value && !placed.value) place(props.game.joshua.spot.x, props.game.joshua.spot.y)
}
function key(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  if (round.value === 1) {
    if (e.type === 'keydown') startHold()
    else stopHold()
    return
  }
  if (e.type === 'keydown') selected.value = !selected.value
}

const joshuaStyle = computed(() => ({ left: `${at.x}%`, top: `${at.y}%`, width: `${props.game.joshua.w}%` }))
const spotStyle = computed(() => {
  const s = props.game.joshua.spot
  const r = props.game.radius
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${r * 2}%` }
})
</script>

<template lang="pug">
  WuesteFrame(
    :background="game.background"
    :hint="current.hint"
    :round="round"
    :rounds="game.rounds.length"
    :label="t.field"
    :count="count"
    :message="message"
    :finished="finished"
    :stars="stars"
    :done-text="t.done"
    @next="emit('done', stars)"
  )
    div(ref="layer" class="gc-layer")
      img(
        class="gc-fig"
        :src="src(game.community.image)"
        alt=""
        draggable="false"
        :style="{ left: `${game.community.x}%`, top: `${game.community.y}%`, width: `${game.community.w}%` }"
      )
      img(
        class="gc-fig"
        :src="src(game.eleasar.image)"
        alt=""
        draggable="false"
        :style="{ left: `${game.eleasar.x}%`, top: `${game.eleasar.y}%`, width: `${game.eleasar.w}%` }"
      )
      img(
        class="gc-fig"
        :class="{ laid }"
        :src="src(laid ? game.mose.blessing : game.mose.image)"
        alt=""
        draggable="false"
        :style="{ left: `${game.mose.x}%`, top: `${game.mose.y}%`, width: `${game.mose.w}%` }"
      )
      button(
        v-if="round === 0"
        type="button"
        class="gc-spot"
        :class="{ ready: selected }"
        :style="spotStyle"
        :aria-label="t.spot"
        :disabled="!selected"
        @click="spotTap"
      )
      button(
        type="button"
        class="gc-josh"
        :class="{ selected, holding, laid }"
        :style="joshuaStyle"
        :aria-label="t.joshua"
        @pointerdown="down"
        @pointermove="move"
        @pointerup="up"
        @pointercancel="up"
        @keydown="key"
        @keyup="key"
      )
        img(:src="src(game.joshua.image)" alt="" draggable="false")
        span(v-if="round === 1" class="gc-bar" aria-hidden="true")
          span(class="gc-fill" :style="{ width: `${share * 100}%` }")
        span(v-if="crossAt" class="gc-cross" aria-hidden="true")
          GameMark(kind="bad")
</template>

<style scoped lang="sass">
.gc-layer
  position: absolute
  inset: 0

.gc-fig
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 2
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.35))

.gc-spot
  position: absolute
  display: block
  padding: 0
  border: 3px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  aspect-ratio: 2.4 / 1
  background: rgba(255, 240, 180, 0.22)
  transform: translate(-50%, -60%)
  z-index: 1
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.ready
    animation: gc-pulse 900ms ease-in-out infinite

  &:focus-visible
    outline: 3px solid #fff6dc

.gc-josh
  position: absolute
  display: block
  min-width: 60px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: grab
  z-index: 5
  touch-action: none
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.4))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.selected
    filter: drop-shadow(0 0 10px rgba(255, 230, 140, 0.95))

  &.holding
    filter: drop-shadow(0 0 14px rgba(255, 230, 140, 1))

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.gc-bar
  position: absolute
  left: 10%
  right: 10%
  bottom: -14px
  height: 10px
  border-radius: 6px
  background: rgba(60, 40, 10, 0.45)
  overflow: hidden

.gc-fill
  display: block
  height: 100%
  background: #f2c744

.gc-cross
  position: absolute
  left: 50%
  top: 8%
  margin-left: -15px
  pointer-events: none

@keyframes gc-pulse
  0%, 100%
    opacity: 0.6
  50%
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .gc-spot.ready
    animation: none
</style>
