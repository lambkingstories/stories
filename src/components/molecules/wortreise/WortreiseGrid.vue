<script setup lang="ts">
/**
 * The crossword of the Wortreise in the light look of "Familien-Spiele v2": the squares of the words are light fields with a thin line; a square that is
 * filled becomes a white tile with a frame in the colour of the game and its letter, and the tiles of a new word drop in one after the other. A letter
 * that a help showed has a gold tint.
 * The size of a square follows the room the grid has (it is measured), so that the whole grid is always seen.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
        :style="{ left: s.c * (cell + 4) + 'px', top: s.r * (cell + 4) + 'px', width: cell + 'px', height: cell + 'px', animationDelay: delay(s.id) }"
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

// an empty square: a light field with a thin line
.wg-sq
  position: absolute
  display: grid
  place-items: center
  box-sizing: border-box
  border: 1.5px solid var(--fam-line-strong)
  border-radius: 22%
  background: color-mix(in srgb, var(--fam-accent) 8%, var(--fam-field))
  transition: background-color 0.3s, border-color 0.3s

  // a filled square: a white tile with a frame in the colour of the game
  &.is-on
    border-color: var(--fam-accent)
    background: var(--fam-card)
    box-shadow: 0 2px 0 color-mix(in srgb, var(--fam-accent) 60%, transparent)

  // a letter that a help showed
  &.is-shown.is-on
    border-color: var(--fam-gold-deep)
    background: color-mix(in srgb, var(--fam-gold) 34%, var(--fam-card))
    box-shadow: 0 2px 0 var(--fam-gold-deep)

.wg-ch
  color: var(--fam-ink)
  font-size: calc(var(--cell) * 0.58)
  font-weight: 800
  line-height: 1
  transform: translateY(-2%)

.is-shown .wg-ch
  font-style: italic

// the tiles of a new word drop in one after the other; a word that was found already pulses twice (both only when motion is welcome)
@media (prefers-reduced-motion: no-preference)
  .wg-sq.is-fresh
    animation: wg-drop 0.5s cubic-bezier(0.3, 1.5, 0.5, 1) both

  .wg-sq.is-pulse
    animation: wg-pulse 0.7s ease-in-out 2

@keyframes wg-drop
  0%
    opacity: 0
    transform: translateY(-26px) scale(1.4) rotate(-6deg)

  60%
    opacity: 1
    transform: translateY(2px) scale(0.97)

  100%
    opacity: 1
    transform: none

@keyframes wg-pulse
  0%, 100%
    transform: scale(1)

  50%
    transform: scale(1.12)
    border-color: var(--fam-gold-deep)
</style>
