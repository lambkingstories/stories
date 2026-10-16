<script setup lang="ts">
/**
 * The colour box at the bottom edge of the coloring screen: pencils, markers,
 * brushes or chalks stand in a row and only their tips look out over the screen
 * edge, like in a box from the shop. The chosen one is pushed a little higher.
 * Swiping sideways brings more colours. The little arrow tab above the box folds
 * it away and, while it is folded, stays at the bottom edge to pull it out again
 * (the colour button in the top bar does the same).
 */
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KitItem, KitVariant } from '@/data/coloringKits'
import { colorName } from '@/utils/colorNames'

interface Props {
  /** Look of the items: sets their width and how much of each one shows. */
  variant: KitVariant
  items: KitItem[]
  /** Items after these are the "big box" colours; dimmed while locked. */
  extra: KitItem[]
  extraLocked: boolean
  /** The picture that opens the free colour picker, if the box has one. */
  rainbow: KitItem | null
  color: string
  customActive: boolean
  open: boolean
  /** Arrow picture for the fold tab (points left, turned by CSS). */
  arrowIcon: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'pick-color': [color: string]
  'pick-locked': []
  custom: []
  toggle: []
}>()

const { t, locale } = useI18n({ useScope: 'global' })

/** What the screen reader says for a pencil: its colour in words (the pencils are only pictures). */
const labelOf = (it: KitItem) => t('app.coloring.colorNamed', { color: colorName(it.color, locale.value === 'en' ? 'en' : 'de') })

/** One stop on the tab key (the chosen pencil, or the first one); the arrow keys walk along the row. */
const stopIndex = () => {
  const all = [...props.items, ...props.extra]
  const i = all.findIndex((it) => isChosen(it.color))
  return i < 0 ? 0 : i
}

function onKeydown(e: KeyboardEvent) {
  const row = scroller.value
  if (!row) return
  const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
  if (!keys.includes(e.key)) return
  const items = [...row.querySelectorAll<HTMLElement>('.sh-item')]
  const at = items.findIndex((el) => el === document.activeElement)
  let next = at
  if (e.key === 'ArrowRight') next = Math.min(items.length - 1, at + 1)
  else if (e.key === 'ArrowLeft') next = Math.max(0, at - 1)
  else if (e.key === 'Home') next = 0
  else next = items.length - 1
  e.preventDefault()
  items[next]?.focus()
  items[next]?.scrollIntoView({ inline: 'center', block: 'nearest' })
}

const root = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)

defineExpose({
  /** Height the box takes at the bottom edge, for the picture's room. */
  height: () => root.value?.offsetHeight ?? 0
})

function isChosen(c: string) {
  return !props.customActive && props.color.toLowerCase() === c.toLowerCase()
}

// ── Sideways scrolling ---------------------------------------------------------
// Touch scrolls natively. With a mouse, the wheel and dragging scroll as well.

function onWheel(e: WheelEvent) {
  const el = scroller.value
  if (!el || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  el.scrollLeft += e.deltaY
  e.preventDefault()
}

let dragFrom: { x: number; left: number; id: number } | null = null
let dragged = false

let penFrom: { x: number; y: number; id: number } | null = null
let penChoseAt = 0

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'pen') penFrom = { x: e.clientX, y: e.clientY, id: e.pointerId }
  if (e.pointerType !== 'mouse' || !scroller.value) return
  dragFrom = { x: e.clientX, left: scroller.value.scrollLeft, id: e.pointerId }
  dragged = false
}

function onPointerMove(e: PointerEvent) {
  const el = scroller.value
  if (!dragFrom || !el) return
  const dx = e.clientX - dragFrom.x
  if (!dragged && Math.abs(dx) > 6) {
    dragged = true
    el.setPointerCapture(dragFrom.id)
  }
  if (dragged) el.scrollLeft = dragFrom.left - dx
}

function onPointerUp(e: PointerEvent) {
  dragFrom = null
  const from = penFrom
  penFrom = null
  // A tap with the pencil is often a tiny drag, which the browser does not count as a click: a short touch chooses at once.
  if (e.type === 'pointerup' && e.pointerType === 'pen' && from && from.id === e.pointerId && Math.hypot(e.clientX - from.x, e.clientY - from.y) < 14) {
    const hit = document.elementFromPoint(e.clientX, e.clientY)
    const item = hit instanceof Element ? hit.closest('.sh-item') : null
    if (item instanceof HTMLElement) {
      item.click()
      penChoseAt = Date.now()
    }
  }
}

/** A drag must not choose the pencil it ended on. */
function onClickCapture(e: MouseEvent) {
  // the click the browser sends after the pencil tap that already chose
  if (Date.now() - penChoseAt < 400 && penChoseAt > 0 && e.isTrusted) {
    penChoseAt = 0
    e.stopPropagation()
    e.preventDefault()
    return
  }
  if (dragged) {
    e.stopPropagation()
    e.preventDefault()
    dragged = false
  }
}

function choose(it: KitItem) {
  emit('pick-color', it.color)
}

function chooseExtra(it: KitItem) {
  if (props.extraLocked) emit('pick-locked')
  else emit('pick-color', it.color)
}

/** Bring the chosen item to the middle when the box or the colour changes from outside. */
function showChosen() {
  void nextTick(() => {
    const el = scroller.value
    const chosen = el?.querySelector<HTMLElement>('.sh-item.chosen')
    if (!el || !chosen) return
    const target = chosen.offsetLeft - (el.clientWidth - chosen.offsetWidth) / 2
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  })
}

watch(() => props.variant, () => {
  if (scroller.value) scroller.value.scrollLeft = 0
  showChosen()
})
watch(() => props.open, (o) => {
  if (o) showChosen()
})
</script>

<template lang="pug">
  section(
    ref="root"
    class="sh"
    :class="[`is-${variant}`, { collapsed: !open }]"
    :aria-label="t('app.coloring.colorBox')"
  )
    button(
      type="button"
      class="sh-tab"
      :aria-label="open ? t('app.coloring.hideBox') : t('app.coloring.showBox')"
      :aria-expanded="open"
      @click="emit('toggle')"
    )
      img(:src="arrowIcon" alt="" draggable="false")

    div(
      ref="scroller"
      class="sh-row"
      @wheel="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click.capture="onClickCapture"
      @keydown="onKeydown"
    )
      button(
        v-for="(it, i) in items"
        :key="`b-${i}`"
        type="button"
        class="sh-item"
        :class="{ chosen: isChosen(it.color) }"
        :style="{ '--i': i }"
        :aria-label="labelOf(it)"
        :tabindex="i === stopIndex() ? 0 : -1"
        :aria-pressed="isChosen(it.color)"
        @click="choose(it)"
      )
        img(:src="it.src" alt="" draggable="false" decoding="async")

      button(
        v-for="(it, i) in extra"
        :key="`x-${i}`"
        type="button"
        class="sh-item"
        :class="{ chosen: !extraLocked && isChosen(it.color), locked: extraLocked }"
        :style="{ '--i': items.length + i }"
        :aria-label="labelOf(it)"
        :tabindex="items.length + i === stopIndex() ? 0 : -1"
        @click="chooseExtra(it)"
      )
        img(:src="it.src" alt="" draggable="false" decoding="async")

      button(
        v-if="rainbow"
        type="button"
        class="sh-item sh-rainbow"
        :class="{ chosen: customActive }"
        :aria-label="t('app.coloring.customColor')"
        @click="emit('custom')"
      )
        img(:src="rainbow.src" alt="" draggable="false" decoding="async")
</template>

<style scoped lang="sass">
.sh
  // How much of each item looks out, and how far the chosen one is pushed up.
  --vis: 108px
  --lift: 22px
  --w: 42px
  position: fixed
  left: 0
  right: 0
  bottom: 0
  z-index: 60
  height: calc(var(--vis) + var(--lift) + env(safe-area-inset-bottom, 0px))
  transition: transform 460ms cubic-bezier(0.22, 1, 0.36, 1)
  will-change: transform

  &.is-pencil
    --w: 42px
  &.is-marker
    --w: 44px
  &.is-chalk
    --w: 52px
    --vis: 92px
  &.is-brushW
    --w: 36px
    --vis: 128px
  &.is-brushO
    --w: 44px
    --vis: 120px
  // whole buckets stand on the edge: nothing of them is cut off
  &.is-bucket
    --w: 62px
    --vis: 90px
    --lift: 16px

  &.collapsed
    transform: translateY(100%)

@media (max-height: 560px)
  .sh
    --vis: 72px
    --lift: 16px
  .sh.is-brushW
    --vis: 92px
  .sh.is-brushO
    --vis: 84px
  .sh.is-bucket
    --w: 50px
    --vis: 70px
    --lift: 12px

@media (prefers-reduced-motion: reduce)
  .sh
    transition-duration: 1ms

// the pencils rise one after the other when the box opens
.sh:not(.collapsed) .sh-item img
  animation: sh-rise 460ms cubic-bezier(0.34, 1.3, 0.5, 1) backwards
  animation-delay: calc(min(var(--i, 0), 16) * 18ms + 80ms)

@keyframes sh-rise
  from
    transform: translateY(calc(var(--lift) + 90px))

// folded away: the pencils wait below the edge, ready to rise
.sh.collapsed .sh-item img
  transform: translateY(calc(var(--lift) + 80px))
  transition-delay: 0ms
  transition-duration: 220ms

.sh-tab
  position: absolute
  left: 50%
  top: -26px
  width: 56px
  height: 26px
  margin-left: -28px
  display: grid
  place-items: center
  border: 1px solid rgba(20, 24, 32, 0.1)
  border-bottom: 0
  border-radius: 12px 12px 0 0
  background: rgba(252, 251, 248, 0.92)
  backdrop-filter: blur(12px)
  -webkit-backdrop-filter: blur(12px)
  box-shadow: 0 -2px 10px rgba(20, 24, 32, 0.14)
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    width: 16px
    height: 16px
    object-fit: contain
    opacity: 0.8
    // the arrow points left: turned to point down while the box is out
    transform: rotate(-90deg)
    transition: transform 200ms ease-out

.sh.collapsed .sh-tab img
  // the arrow now points up: the same tab pulls the box out again
  transform: rotate(90deg)

.sh-row
  height: 100%
  display: flex
  align-items: flex-start
  gap: 3px
  padding: 0 max(16px, env(safe-area-inset-left, 0px))
  overflow-x: auto
  overflow-y: hidden
  overscroll-behavior-x: contain
  -webkit-overflow-scrolling: touch
  scrollbar-width: none
  touch-action: pan-x
  user-select: none
  // the row slides under the screen edge like a box on a shelf
  &::-webkit-scrollbar
    display: none

.sh-item
  position: relative
  flex: 0 0 auto
  width: var(--w)
  height: calc(var(--vis) + var(--lift))
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  img
    position: absolute
    left: 0
    top: 0
    width: 100%
    height: auto
    display: block
    pointer-events: none
    transform: translateY(var(--lift))
    // choosing is instant: the pencil is pushed up at once
    transition: transform 140ms ease-out

  &.chosen img
    transform: translateY(0)
    transition-delay: 0ms

  &.locked img
    opacity: 0.5

  &:focus-visible
    outline: 2px solid #1f3a5f
    outline-offset: -2px
</style>
