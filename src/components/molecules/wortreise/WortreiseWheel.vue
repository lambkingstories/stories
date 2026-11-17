<script setup lang="ts">
/**
 * The letter circle of the Wortreise: the letters lie on a round board of dark wood, each on an ivory tile. A word is drawn with one finger from
 * letter to letter (a brass line follows it), the finger lifts and the word is handed over (`submit`). Going back to the letter before takes the
 * last one away. A single tap on a letter starts a word that is built tap by tap (`taps` tells the page, which then shows the buttons to take
 * the last letter away and to hand the word over: `undo`, `send`); the keys of a keyboard work too (letters, Enter, Backspace, Escape, Space for
 * mixing). The button in the middle mixes the letters. The letters that are drawn are told to the page (`word`), which shows them above the circle.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { prependBaseUrl } from '@/utils/function'

const props = withDefaults(defineProps<{ letters: string[]; disabled?: boolean; bad?: boolean }>(), { disabled: false, bad: false })
const emit = defineEmits<{ submit: [word: string]; mix: []; tick: [n: number]; word: [word: string]; taps: [on: boolean] }>()
const { t } = useI18n({ useScope: 'global' })

const plate = `url(${prependBaseUrl('images/familie/wortreise/scheibe.webp')})`
const tile = `url(${prependBaseUrl('images/familie/wortreise/stein.webp')})`

/** Where the letters lie, in parts of the side of the board (0 to 1). */
const RADIUS = 0.35
const NODE = 0.205
const HIT = 0.115
const nodes = computed(() =>
  props.letters.map((ch, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / props.letters.length
    return { ch, x: 0.5 + RADIUS * Math.cos(a), y: 0.5 + RADIUS * Math.sin(a) }
  })
)

const board = ref<HTMLElement | null>(null)
const sel = ref<number[]>([])
const pointer = ref<{ x: number; y: number } | null>(null)
const dragging = ref(false)
/** A word that is built by single taps (it stays after the finger is lifted). */
const tapMode = ref(false)
let moved = false

const word = computed(() => sel.value.map((i) => props.letters[i]).join(''))
const path = computed(() => {
  const pts = sel.value.map((i) => `${nodes.value[i]!.x * 100},${nodes.value[i]!.y * 100}`)
  if (dragging.value && pointer.value && sel.value.length) pts.push(`${pointer.value.x * 100},${pointer.value.y * 100}`)
  return pts.join(' ')
})

function local(e: PointerEvent): { x: number; y: number } {
  const r = board.value!.getBoundingClientRect()
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
}

function nodeAt(p: { x: number; y: number }): number {
  let best = -1
  let bd = HIT
  nodes.value.forEach((n, i) => {
    const d = Math.hypot(n.x - p.x, n.y - p.y)
    if (d < bd) {
      bd = d
      best = i
    }
  })
  return best
}

function buzz() {
  try {
    navigator.vibrate?.(6)
  } catch {
    // no vibration on this device
  }
}

function add(i: number) {
  sel.value = [...sel.value, i]
  emit('tick', sel.value.length)
  buzz()
}

function clear() {
  sel.value = []
  tapMode.value = false
  dragging.value = false
  pointer.value = null
}

function send() {
  const w = word.value
  const keep = tapMode.value
  clear()
  if (w.length >= 3) emit('submit', w)
  else if (keep && w.length > 0) emit('tick', 0)
}

function undo() {
  sel.value = sel.value.slice(0, -1)
  if (!sel.value.length) tapMode.value = false
}

function down(e: PointerEvent) {
  if (props.disabled) return
  const p = local(e)
  const i = nodeAt(p)
  if (i < 0) return
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    // a pointer that is not active any more cannot be captured: the move events then come from the board itself
  }
  moved = false
  if (tapMode.value) {
    // the next letter of a word built by taps; a tap on the last letter takes it away again
    if (sel.value[sel.value.length - 1] === i) sel.value = sel.value.slice(0, -1)
    else if (!sel.value.includes(i)) add(i)
    if (sel.value.length === 0) tapMode.value = false
    dragging.value = false
    return
  }
  sel.value = []
  dragging.value = true
  pointer.value = p
  add(i)
}

function move(e: PointerEvent) {
  if (!dragging.value) return
  const p = local(e)
  pointer.value = p
  const i = nodeAt(p)
  if (i < 0) return
  const last = sel.value[sel.value.length - 1]
  if (i === last) return
  if (sel.value.length > 1 && sel.value[sel.value.length - 2] === i) {
    // back to the letter before: the last one is taken away
    sel.value = sel.value.slice(0, -1)
    moved = true
    emit('tick', sel.value.length)
    return
  }
  if (!sel.value.includes(i)) {
    moved = true
    add(i)
  }
}

function up() {
  if (!dragging.value) return
  dragging.value = false
  pointer.value = null
  // one tap on one letter: a word that is built by taps
  if (!moved && sel.value.length === 1) {
    tapMode.value = true
    return
  }
  send()
}

function onKey(e: KeyboardEvent) {
  if (props.disabled || e.ctrlKey || e.metaKey || e.altKey) return
  const tag = (e.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (e.key === 'Enter') {
    if (sel.value.length) {
      e.preventDefault()
      send()
    }
  } else if (e.key === 'Backspace') {
    if (sel.value.length) {
      e.preventDefault()
      sel.value = sel.value.slice(0, -1)
      if (!sel.value.length) tapMode.value = false
    }
  } else if (e.key === 'Escape') {
    clear()
  } else if (e.key === ' ') {
    e.preventDefault()
    clear()
    emit('mix')
  } else if (e.key.length === 1) {
    const ch = e.key.toUpperCase()
    const i = props.letters.findIndex((c, k) => c === ch && !sel.value.includes(k))
    if (i >= 0) {
      tapMode.value = true
      add(i)
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
// a new puzzle or a mixed circle: nothing stays selected
watch(
  () => props.letters.join(''),
  () => clear()
)
watch(
  () => props.disabled,
  (d) => d && clear()
)

// the strip above the circle (in the page that uses this) shows the letters that are drawn
watch(word, (w) => emit('word', w))
watch(tapMode, (on) => emit('taps', on))

defineExpose({ clear, undo, send })
</script>

<template lang="pug">
  div(class="ww")
    div(
      ref="board"
      :class="['ww-board', { 'is-off': disabled, 'is-bad': bad }]"
      :style="{ backgroundImage: plate }"
      @pointerdown.prevent="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
    )
      svg(class="ww-line" viewBox="0 0 100 100" aria-hidden="true")
        polyline(v-if="sel.length > 1 || (dragging && sel.length)" :points="path" class="ww-path-shade")
        polyline(v-if="sel.length > 1 || (dragging && sel.length)" :points="path" class="ww-path")
      div(
        v-for="(n, i) in nodes"
        :key="i"
        :class="['ww-node', { 'is-on': sel.includes(i) }]"
        :style="{ left: n.x * 100 + '%', top: n.y * 100 + '%', backgroundImage: tile }"
      )
        span {{ n.ch }}
      button(type="button" class="ww-mix" :disabled="disabled" :aria-label="t('app.bigGames.wortreise.mix')" @pointerdown.stop @click="clear(); emit('mix')")
        svg(viewBox="0 0 24 24" width="26" height="26" aria-hidden="true")
          path(d="M4 8h3.2c2.6 0 3.7 1.4 5.2 3.6 1.6 2.3 2.8 3.9 5.6 3.9H20m0 0-2.6-2.6M20 15.5l-2.6 2.6M4 16h3.2c1.3 0 2.2-.4 3-1.1M20 8h-3c-1.4 0-2.4.5-3.2 1.2m6.2-1.2-2.6-2.6M20 8l-2.6 2.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round")
</template>

<style scoped lang="sass">
.ww
  --wheel: var(--wr-wheel, 280px)
  display: flex
  justify-content: center
  width: 100%
  user-select: none
  -webkit-user-select: none

// the round board: dark walnut with a brass ring; the letters lie on it
.ww-board
  position: relative
  width: var(--wheel)
  height: var(--wheel)
  border-radius: 50%
  background-color: #4a3018
  background-size: 100% 100%
  background-repeat: no-repeat
  box-shadow: 0 10px 18px rgba(10, 5, 0, 0.55)
  touch-action: none
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &.is-off
    filter: saturate(0.6) brightness(0.85)
    cursor: default

  &.is-bad
    animation: ww-shake 0.4s

.ww-line
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none
  overflow: visible

.ww-path, .ww-path-shade
  fill: none
  stroke-linecap: round
  stroke-linejoin: round

.ww-path-shade
  stroke: rgba(30, 14, 2, 0.55)
  stroke-width: 4.6

.ww-path
  stroke: #f2cf72
  stroke-width: 2.6

.ww-node
  position: absolute
  display: grid
  place-items: center
  width: 20.5%
  height: 20.5%
  transform: translate(-50%, -50%)
  border-radius: 22%
  background-color: #f0e2bd
  background-size: 100% 100%
  background-repeat: no-repeat
  color: #3a2812
  font-family: var(--mp-serif, Georgia, serif)
  font-size: calc(var(--wheel) * 0.115)
  font-weight: 800
  line-height: 1
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(10, 5, 0, 0.6))
  transition: transform 0.14s, filter 0.14s

  span
    transform: translateY(-2%)

  &.is-on
    transform: translate(-50%, -50%) scale(1.12)
    filter: drop-shadow(0 0 10px rgba(255, 205, 100, 0.95)) drop-shadow(0 3px 3px rgba(10, 5, 0, 0.6)) brightness(1.06)

.ww-mix
  position: absolute
  left: 50%
  top: 50%
  display: grid
  place-items: center
  width: 17%
  height: 17%
  min-width: 44px
  min-height: 44px
  transform: translate(-50%, -50%)
  padding: 0
  border-radius: 50%
  border: 2px solid #f3d98a
  background: radial-gradient(circle at 35% 30%, #c79a45, #7d5a22 70%, #4d3513)
  box-shadow: 0 0 0 2px rgba(28, 18, 6, 0.9), 0 3px 8px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 240, 190, 0.7)
  color: #fff3cf
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active:not(:disabled)
    transform: translate(-50%, -50%) scale(0.94)

@keyframes ww-shake
  0%, 100%
    transform: translateX(0)
  20%
    transform: translateX(-7px)
  40%
    transform: translateX(6px)
  60%
    transform: translateX(-4px)
  80%
    transform: translateX(3px)

@media (prefers-reduced-motion: reduce)
  .ww-board.is-bad
    animation: none
</style>
