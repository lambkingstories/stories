<script setup lang="ts">
/**
 * A coloring book lying open like a real book: on the left page the words that belong to the picture, on the right page the picture
 * itself. A turn of the page lifts the right page and lays it over to the left (or back), with the next words on its back. A tap on
 * the picture goes on to painting. On a tall, narrow screen (a phone held upright) the two pages lie one above the other and the
 * page changes without the turn.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ColoringBookPage } from '@/utils/coloringBook'
import ColoringSpreadText from '@/components/molecules/ColoringSpreadText.vue'
import ColoringSpreadArt from '@/components/molecules/ColoringSpreadArt.vue'
import PlusBadge from '@/components/atoms/PlusBadge.vue'

const props = defineProps<{
  pages: ColoringBookPage[]
  index: number
  /** The line art to show for a page (from the device when it is there). */
  lineOf: (p: ColoringBookPage) => string
  /** The child's paint of a page (object URL) or ''. */
  layerOf: (i: number) => string
  isLocked: (i: number) => boolean
  /** Has the pictures of a page ready (loaded) before it is shown. */
  prepare: (i: number) => Promise<void>
  /** The arrows beside the book (on by default; a screen with its own page buttons turns them off). */
  arrows?: boolean
}>()

const emit = defineEmits<{ go: [i: number]; paint: [] }>()

const { t } = useI18n({ useScope: 'global' })

const TURN_MS = 760

/** A tall, narrow screen (a phone held upright): the two pages lie one above the other. */
const stacked = ref(false)
const measure = () => {
  stacked.value = window.innerWidth < window.innerHeight * 1.25
}
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))

const reduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Turn {
  dir: 1 | -1
  from: number
  to: number
  /** The transition has been started (the class that turns the leaf is on). */
  run: boolean
}
const turn = ref<Turn | null>(null)

/** The page that is seen as a whole while a leaf turns: forward the words of the old page stay on the left, backward the picture of the old page on the right. */
const leftIndex = computed(() => (turn.value ? (turn.value.dir === 1 ? turn.value.from : turn.value.to) : props.index))
const rightIndex = computed(() => (turn.value ? (turn.value.dir === 1 ? turn.value.to : turn.value.from) : props.index))

/** Turns to the page with this number; ignored while a leaf is turning. */
async function flip(to: number) {
  if (turn.value || to < 0 || to >= props.pages.length || to === props.index) return
  await props.prepare(to)
  if (stacked.value || reduced()) {
    emit('go', to)
    return
  }
  turn.value = { dir: to > props.index ? 1 : -1, from: props.index, to, run: false }
  // one frame with the leaf at rest, then the turn starts
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  if (turn.value) turn.value.run = true
  window.setTimeout(() => {
    const target = turn.value?.to
    turn.value = null
    if (target !== undefined) emit('go', target)
  }, TURN_MS + 40)
}

defineExpose({ flip })

// swipe over the book
let startX: number | null = null
let startY = 0
function onDown(e: PointerEvent) {
  startX = e.clientX
  startY = e.clientY
}
function onUp(e: PointerEvent) {
  if (startX === null) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  startX = null
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) void flip(props.index + (dx < 0 ? 1 : -1))
}

const pageAt = (i: number) => props.pages[i]!
</script>

<template lang="pug">
  div(class="sp-wrap")
    button(v-if="arrows !== false" type="button" class="sp-arrow sp-prev" :disabled="index <= 0" :aria-label="t('app.coloring.prevPage')" @click="flip(index - 1)") ‹

    div(class="sp-book" :class="{ 'is-stacked': stacked, 'is-turning': !!turn }" @pointerdown="onDown" @pointerup="onUp" @pointercancel="startX = null")
      //- the two pages that lie there
      div(class="sp-page sp-left")
        ColoringSpreadText(
          :key="`t-${leftIndex}`"
          :no="leftIndex + 1"
          :total="pages.length"
          :title="pageAt(leftIndex).title"
          :reference="pageAt(leftIndex).reference"
          :text="pageAt(leftIndex).text"
        )
      div(class="sp-page sp-right" role="button" tabindex="0" :aria-label="t('app.coloring.startPaint')" @click="emit('paint')" @keydown.enter="emit('paint')")
        ColoringSpreadArt(
          :key="`a-${rightIndex}`"
          :line="lineOf(pageAt(rightIndex))"
          :layer="layerOf(rightIndex)"
          :alt="pageAt(rightIndex).title"
          :faded="isLocked(rightIndex)"
        )
        span(v-if="isLocked(rightIndex)" class="sp-lock")
          PlusBadge
      span(class="sp-spine" aria-hidden="true")

      //- the page that is being turned: the old picture on its front, the next words on its back
      div(v-if="turn" class="sp-leaf" :class="[turn.dir === 1 ? 'is-fwd' : 'is-back', { run: turn.run }]" aria-hidden="true")
        div(class="sp-face sp-front")
          template(v-if="turn.dir === 1")
            ColoringSpreadArt(:line="lineOf(pageAt(turn.from))" :layer="layerOf(turn.from)" alt="" :faded="isLocked(turn.from)")
          template(v-else)
            ColoringSpreadText(:no="turn.from + 1" :total="pages.length" :title="pageAt(turn.from).title" :reference="pageAt(turn.from).reference" :text="pageAt(turn.from).text")
        div(class="sp-face sp-reverse")
          template(v-if="turn.dir === 1")
            ColoringSpreadText(:no="turn.to + 1" :total="pages.length" :title="pageAt(turn.to).title" :reference="pageAt(turn.to).reference" :text="pageAt(turn.to).text")
          template(v-else)
            ColoringSpreadArt(:line="lineOf(pageAt(turn.to))" :layer="layerOf(turn.to)" alt="" :faded="isLocked(turn.to)")

    button(v-if="arrows !== false" type="button" class="sp-arrow sp-next" :disabled="index >= pages.length - 1" :aria-label="t('app.coloring.nextPage')" @click="flip(index + 1)") ›
</template>

<style scoped lang="sass">
$paper: #fffaf0
$cover: #8a5a2c

.sp-wrap
  width: 100%
  max-width: 1040px
  flex: 1 1 auto
  min-height: 260px
  display: flex
  align-items: center
  justify-content: center
  gap: 8px

.sp-arrow
  flex: 0 0 auto
  width: 44px
  height: 64px
  border: 1px solid rgba(20, 24, 32, 0.1)
  border-radius: 14px
  background: rgba(252, 251, 248, 0.88)
  color: #22262e
  font-size: 1.8rem
  font-weight: 800
  line-height: 1
  cursor: pointer
  box-shadow: 0 2px 10px rgba(20, 24, 32, 0.15)

  &:disabled
    opacity: 0.35
    cursor: default

// the book: a cover of brown cloth, the pages in it
.sp-book
  position: relative
  flex: 1 1 auto
  align-self: stretch
  max-height: 640px
  min-width: 0
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 0
  padding: clamp(6px, 1.6vw, 14px)
  border-radius: 16px
  background: linear-gradient(160deg, #2b7a78, #1d666a 55%, #154e53)
  box-shadow: 0 18px 38px -14px rgba(12, 50, 55, 0.6), inset 0 0 0 2px rgba(215, 186, 126, 0.45)
  perspective: 1800px
  touch-action: pan-y
  user-select: none

  &.is-stacked
    grid-template-columns: 1fr
    grid-template-rows: auto minmax(0, 1fr)

.sp-page
  position: relative
  min-height: 0
  min-width: 0
  padding: 0
  border: 0
  background: $paper
  overflow: hidden

.sp-left
  border-radius: 8px 0 0 8px
  background: linear-gradient(90deg, #fffaf0 0%, #fffaf0 88%, #efe3cb 100%)

.sp-right
  border-radius: 0 8px 8px 0
  background: #ffffff
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #1f3a5f
    outline-offset: -3px

.is-stacked .sp-left
  border-radius: 8px 8px 0 0
  max-height: 34vh
  min-height: 96px
  background: #fffaf0

.is-stacked .sp-right
  border-radius: 0 0 8px 8px

// the shadow of the fold in the middle
.sp-spine
  position: absolute
  top: clamp(6px, 1.6vw, 14px)
  bottom: clamp(6px, 1.6vw, 14px)
  left: 50%
  width: 34px
  margin-left: -17px
  pointer-events: none
  background: radial-gradient(ellipse at center, rgba(70, 45, 15, 0.3), transparent 70%)

.is-stacked .sp-spine
  display: none

.sp-lock
  position: absolute
  right: 10px
  top: 10px

// ── the turning page ──
.sp-leaf
  position: absolute
  top: clamp(6px, 1.6vw, 14px)
  bottom: clamp(6px, 1.6vw, 14px)
  width: calc(50% - clamp(6px, 1.6vw, 14px))
  transform-style: preserve-3d
  transition: transform 760ms cubic-bezier(0.45, 0.05, 0.25, 1)
  z-index: 4
  pointer-events: none

  &.is-fwd
    left: 50%
    transform-origin: left center
    &.run
      transform: rotateY(-180deg)

  &.is-back
    left: clamp(6px, 1.6vw, 14px)
    transform-origin: right center
    &.run
      transform: rotateY(180deg)

.sp-face
  position: absolute
  inset: 0
  overflow: hidden
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  background: $paper

.sp-reverse
  transform: rotateY(180deg)

.is-fwd .sp-front
  border-radius: 0 8px 8px 0
.is-fwd .sp-reverse
  border-radius: 8px 0 0 8px
.is-back .sp-front
  border-radius: 8px 0 0 8px
.is-back .sp-reverse
  border-radius: 0 8px 8px 0

// a soft shade goes over the leaf while it moves
.sp-leaf::after
  content: ''
  position: absolute
  inset: 0
  pointer-events: none
  background: linear-gradient(90deg, rgba(60, 40, 10, 0.18), transparent 40%)
  opacity: 0
  transition: opacity 760ms ease-in-out

.sp-leaf.run::after
  opacity: 1

@media (max-width: 640px)
  .sp-arrow
    width: 32px
    height: 52px

@media (prefers-reduced-motion: reduce)
  .sp-leaf
    transition-duration: 1ms
</style>
