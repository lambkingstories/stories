<script setup lang="ts">
/**
 * The crossword of the Wortreise: the squares of the words lie on the map as small dark hollows; a square that is filled becomes an ivory
 * tile with its letter, and the tiles of a new word drop in one after the other. A letter that a help showed is brass colored.
 * The size of a square follows the room the grid has (it is measured), so that the whole grid is always seen.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { prependBaseUrl } from '@/utils/function'
import { gridLetters, type WrPuzzle } from '@/utils/wortreise'

const props = withDefaults(
  defineProps<{
    puzzle: WrPuzzle
    /** The filled squares ("row,col"). */
    filled: Set<string>
    /** The squares that came in just now (they drop in one after the other, in this order). */
    fresh?: string[]
    /** The squares that were shown by a help. */
    shown?: string[]
    /** The squares of a word that is pointed at (they pulse for a moment). */
    pulse?: string[]
    /** Shows all the letters (the stage is done). */
    all?: boolean
    max?: number
  }>(),
  { fresh: () => [], shown: () => [], pulse: () => [], all: false, max: 56 }
)

const tile = `url(${prependBaseUrl('images/familie/wortreise/stein.webp')})`
const letters = computed(() => gridLetters(props.puzzle))
const wrap = ref<HTMLElement | null>(null)
const room = ref({ w: 320, h: 260 })
let ro: ResizeObserver | null = null

onMounted(() => {
  const el = wrap.value
  if (!el) return
  const read = () => {
    const r = el.getBoundingClientRect()
    if (r.width > 20 && r.height > 20) room.value = { w: r.width, h: r.height }
  }
  read()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(read)
    ro.observe(el)
  }
})
onBeforeUnmount(() => ro?.disconnect())

const GAP = 4
const cell = computed(() => {
  const c = Math.floor((room.value.w - GAP * (props.puzzle.cols - 1)) / props.puzzle.cols)
  const r = Math.floor((room.value.h - GAP * (props.puzzle.rows - 1)) / props.puzzle.rows)
  return Math.max(22, Math.min(props.max, c, r))
})

interface Sq {
  id: string
  r: number
  c: number
  ch: string
  on: boolean
}
const squares = computed<Sq[]>(() => {
  const out: Sq[] = []
  for (const [id, ch] of letters.value) {
    const [r, c] = id.split(',').map(Number) as [number, number]
    out.push({ id, r, c, ch, on: props.all || props.filled.has(id) })
  }
  return out
})
const delay = (id: string) => {
  const i = props.fresh.indexOf(id)
  return i < 0 ? '0s' : `${i * 0.11}s`
}
</script>

<template lang="pug">
  div(ref="wrap" class="wg")
    div(class="wg-grid" :style="{ width: puzzle.cols * cell + (puzzle.cols - 1) * 4 + 'px', height: puzzle.rows * cell + (puzzle.rows - 1) * 4 + 'px', '--cell': cell + 'px' }")
      div(
        v-for="s in squares"
        :key="s.id"
        :class="['wg-sq', { 'is-on': s.on, 'is-fresh': fresh.includes(s.id), 'is-shown': shown.includes(s.id), 'is-pulse': pulse.includes(s.id) }]"
        :style="{ left: s.c * (cell + 4) + 'px', top: s.r * (cell + 4) + 'px', width: cell + 'px', height: cell + 'px', animationDelay: delay(s.id), backgroundImage: s.on ? tile : 'none' }"
        :aria-label="s.on ? s.ch : ''"
      )
        span(v-if="s.on" class="wg-ch") {{ s.ch }}
</template>

<style scoped lang="sass">
.wg
  display: grid
  place-items: center
  width: 100%
  height: 100%
  min-height: 0

.wg-grid
  position: relative
  flex: none

// an empty square: a hollow in the map
.wg-sq
  position: absolute
  display: grid
  place-items: center
  box-sizing: border-box
  border-radius: 22%
  background-color: rgba(28, 19, 10, 0.55)
  background-size: 100% 100%
  background-repeat: no-repeat
  border: 1px solid rgba(226, 189, 102, 0.35)
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.65)
  transition: background-color 0.3s

  &.is-on
    border-color: transparent
    background-color: #f0e2bd
    box-shadow: none
    filter: drop-shadow(0 3px 3px rgba(10, 5, 0, 0.6))

  &.is-fresh
    animation: wg-drop 0.5s cubic-bezier(0.3, 1.5, 0.5, 1) both

  &.is-pulse
    animation: wg-pulse 0.7s ease-in-out 2

.wg-ch
  color: #3a2812
  font-family: var(--mp-serif, Georgia, serif)
  font-size: calc(var(--cell) * 0.6)
  font-weight: 800
  line-height: 1
  transform: translateY(-2%)

.is-shown .wg-ch
  color: #8a5a10
  font-style: italic

.is-shown.is-on
  filter: sepia(0.55) saturate(1.3) drop-shadow(0 3px 3px rgba(10, 5, 0, 0.6))

@keyframes wg-drop
  0%
    opacity: 0
    transform: translateY(-34px) scale(1.5) rotate(-8deg)
    filter: drop-shadow(0 0 14px rgba(255, 210, 110, 0.95))

  60%
    opacity: 1
    transform: translateY(2px) scale(0.96) rotate(1deg)

  100%
    opacity: 1
    transform: none

@keyframes wg-pulse
  0%, 100%
    transform: scale(1)
    filter: drop-shadow(0 3px 3px rgba(10, 5, 0, 0.6))

  50%
    transform: scale(1.12)
    filter: drop-shadow(0 0 12px rgba(255, 205, 100, 0.95))

@media (prefers-reduced-motion: reduce)
  .wg-sq.is-fresh, .wg-sq.is-pulse
    animation: none
</style>
