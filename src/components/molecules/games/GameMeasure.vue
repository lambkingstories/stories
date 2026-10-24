<script setup lang="ts">
/**
 * Fill the measure: at the edge of the field lies a heap of barley and an empty measure stands next to it. The child holds a finger on the heap (or holds the space key on it): the grain runs into the measure, evenly, in
 * about four seconds from empty to the brim. A golden mark shows how full the measure shall be. The child lets go at the mark (eight percent too little or too much is allowed): that round is done. Letting go earlier changes
 * nothing, the grain stays and the child may go on holding. If the grain runs on past the mark (more than eight percent too much) it spills over the rim: a cross, one mistake, and the measure is empty again.
 * Round 1: to the brim (a whole ephah), round 2: half full (what is left for Naomi). The five pictures of the measure fade into each other (`stateBlend`). The arithmetic is in `utils/rutGames.ts`.
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { judgeLevel, levelAt, stateBlend } from '@/utils/rutGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { MeasureGame } from '@/types/adventure'

const props = defineProps<{ game: MeasureGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: one measure for each round
progress.setGoal(props.game.rounds.length)

const TICK = 40
const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const round = ref(0)
/** How long the finger has been on the heap in this round (ms): the level of the measure follows it. */
const heldMs = ref(0)
const holding = ref(false)
/** After a spill the finger must lift before the heap answers again. */
const blocked = ref(false)
const spilling = ref(false)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const fieldEl = ref<HTMLElement | null>(null)
const heapEl = ref<HTMLElement | null>(null)
const measureEl = ref<HTMLElement | null>(null)
const grains = reactive<Record<number, { x: number; y: number; go: boolean }>>({})
let grainKey = 0
let sinceGrain = 0
const src = (p: string) => prependBaseUrl(p)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const level = computed(() => levelAt(heldMs.value))
const stars = computed(() => mistakeStars(misses.value, 1, 3))
/** The opacity of each of the five pictures: only the two nearest ones show. */
const opacities = computed(() => {
  const b = stateBlend(level.value, props.game.states.length)
  return props.game.states.map((_, i) => (i === b.lo ? 1 - b.t : i === b.hi ? b.t : 0))
})
/** The place of the golden mark beside the measure: height from the top of the measure picture (percent). */
const markTop = computed(() => {
  const m = props.game.measure
  return m.bottom - (m.bottom - m.top) * current.value.mark
})
const markStyle = computed(() => ({ top: `${markTop.value}%`, width: `${(props.game.markW / props.game.measure.w) * 100}%` }))

const timer = window.setInterval(tick, TICK)
onBeforeUnmount(() => window.clearInterval(timer))
function tick() {
  if (between.value || finished.value || !holding.value || blocked.value) return
  heldMs.value += TICK
  sinceGrain += TICK
  if (sinceGrain >= (reduced ? 260 : 120)) {
    sinceGrain = 0
    dropGrain()
  }
  if (judgeLevel(level.value, current.value.mark) === 'high') spill()
}

/** A little group of grains flies from the heap to the opening of the measure. */
function dropGrain() {
  const field = fieldEl.value?.getBoundingClientRect()
  const heap = heapEl.value?.getBoundingClientRect()
  const meas = measureEl.value?.getBoundingClientRect()
  if (!field || !heap || !meas || field.width <= 0) return
  const k = ++grainKey
  const m = props.game.measure
  const x0 = ((heap.left + heap.width * 0.5 - field.left) / field.width) * 100
  const y0 = ((heap.top + heap.height * 0.4 - field.top) / field.height) * 100
  const x1 = ((meas.left + meas.width * 0.5 - field.left) / field.width) * 100
  const y1 = ((meas.top + (meas.height * (m.top + 6)) / 100 - field.top) / field.height) * 100
  grains[k] = { x: x0, y: y0, go: false }
  nextTick(() => {
    if (grains[k]) grains[k] = { x: x1, y: y1, go: true }
  })
  later(() => {
    delete grains[k]
  }, 520)
}

function press() {
  if (between.value || finished.value || blocked.value || spilling.value) return
  holding.value = true
  message.value = ''
}

function lift() {
  if (!holding.value) {
    blocked.value = false
    return
  }
  holding.value = false
  blocked.value = false
  if (between.value || finished.value || spilling.value) return
  const verdict = judgeLevel(level.value, current.value.mark)
  if (verdict === 'ok') {
    roundDone()
  } else if (heldMs.value > 0) {
    message.value = t('app.adventure.measureMore')
  }
}

function spill() {
  holding.value = false
  blocked.value = true
  spilling.value = true
  misses.value++
  play('wrong')
  message.value = t('app.adventure.measureSpill')
  later(() => {
    heldMs.value = 0
    spilling.value = false
  }, 1100)
}

function roundDone() {
  between.value = true
  progress.mark()
  play('star')
  message.value = t('app.adventure.measureRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
    }, 1500)
    return
  }
  later(() => {
    round.value++
    heldMs.value = 0
    between.value = false
    message.value = ''
  }, 1600)
}

function keydown(e: KeyboardEvent) {
  if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
    e.preventDefault()
    press()
  }
}
function keyup(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    lift()
  }
}
</script>

<template lang="pug">
  div(class="ms")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="ms-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="ms-hint") {{ current.hint }}
      div(ref="fieldEl" class="ms-field" :style="{ backgroundImage: `url(${src(game.background)})` }")
        //- the measure with its five pictures and the golden mark
        div(
          ref="measureEl"
          class="ms-measure"
          :class="{ spill: spilling }"
          :style="{ left: `${game.measure.x}%`, top: `${game.measure.y}%`, width: `${game.measure.w}%` }"
          role="img"
          :aria-label="t('app.adventure.measureLevel', { n: Math.round(Math.min(1, level) * 100) })"
        )
          span(v-for="(s, i) in game.states" :key="`state-${i}`" class="ms-state" :class="{ first: i === 0 }" :style="{ opacity: String(opacities[i]) }")
            GameImage(:src="s" colour="#a98f5a")
          span(class="ms-mark" :style="markStyle" aria-hidden="true")
            GameImage(:src="game.markImage" colour="#d4a83e")
          span(v-if="spilling" class="ms-cross" aria-hidden="true")
            GameMark(kind="bad")
        //- the grains that fly from the heap into the measure
        span(
          v-for="(g, k) in grains"
          :key="`grain-${k}`"
          class="ms-grain"
          :class="{ go: g.go }"
          :style="{ left: `${g.x}%`, top: `${g.y}%`, width: `${game.grainW}%` }"
          aria-hidden="true"
        )
          GameImage(:src="game.grain" colour="#e0b84a")
        //- the heap: hold it
        button(
          ref="heapEl"
          type="button"
          class="ms-heap"
          :class="{ held: holding }"
          :style="{ left: `${game.heap.x}%`, top: `${game.heap.y}%`, width: `${game.heap.w}%`, height: `${game.heap.h}%` }"
          :aria-label="t('app.adventure.measureHeap')"
          :disabled="between"
          @pointerdown.prevent="press"
          @pointerup="lift"
          @pointercancel="lift"
          @pointerleave="lift"
          @keydown="keydown"
          @keyup="keyup"
          @contextmenu.prevent
        )
          span(class="ms-heap-ring" aria-hidden="true")
      p(class="ms-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.measureDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.ms
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none
  touch-action: none

.ms-round
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

.ms-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.ms-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #cfae6a
  background-size: cover
  background-position: center

// the measure stands with its foot at left/top (the middle of the foot)
.ms-measure
  position: absolute
  display: block
  transform: translate(-50%, -100%)
  pointer-events: none

  &.spill
    animation: ms-shake 360ms ease

.ms-state
  display: block
  width: 100%

  &:not(.first)
    position: absolute
    left: 0
    top: 0

.ms-mark
  position: absolute
  left: 102%
  display: block
  transform: translateY(-50%)

.ms-cross
  position: absolute
  left: 50%
  top: 10%
  display: block
  margin: -15px 0 0 -15px

.ms-grain
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 20

  &.go
    transition: left 480ms ease-in, top 480ms ease-in

// the heap is the one big area to hold
.ms-heap
  position: absolute
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -50%)
  -webkit-tap-highlight-color: transparent
  touch-action: none

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 14px

.ms-heap-ring
  position: absolute
  inset: 0
  border-radius: 50%
  border: 3px dashed rgba(255, 246, 220, 0.85)
  transition: background 200ms ease, transform 200ms ease

.ms-heap.held .ms-heap-ring
  background: rgba(255, 220, 120, 0.3)
  transform: scale(1.04)

.ms-fb
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

@keyframes ms-shake
  0%, 100%
    transform: translate(-50%, -100%)
  25%
    transform: translate(calc(-50% - 6px), -100%)
  75%
    transform: translate(calc(-50% + 6px), -100%)

@media (prefers-reduced-motion: reduce)
  .ms-measure.spill
    animation: none
  .ms-grain.go
    transition: none
</style>
