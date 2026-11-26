<script setup lang="ts">
/**
 * The whole digital picture book, read like a real booklet: it fills the whole screen (nothing but a round back button on top of it), the pages
 * turn like paper (a leaf that swings round the spine), and the background is the current page, blurred and dark.
 *
 * Lying on its side the phone shows two pages at a time (a spread: the cover alone on the right, then 2/3, 4/5 …); standing upright it shows
 * one page as large as the screen allows. A tap on the left or right edge, a swipe or the arrow keys turn the page. Turning the phone keeps
 * the page. Two fingers enlarge and shrink the page (a double tap in the middle does it too); enlarged, one finger moves it and the pages do not turn.
 * Where the person wants less movement the page changes at once. The pages are pictures of one shape (`pages`, in reading order): square as
 * default, or the shape given with `ratio` (width divided by height; a coloring book has upright pages, for example 0.75).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ZIconography from '@/components/atoms/ZIconography.vue'
import BookFlipPage, { type BookFlipPage as Page } from '@/components/atoms/BookFlipPage.vue'
import { ZOOM_TAP, clampZoom, zoomAround, type Zoom, type ZoomRoom } from '@/utils/bookZoom'

const props = withDefaults(defineProps<{ pages: Page[]; ratio?: number }>(), { ratio: 1 })
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n({ useScope: 'global' })

/** The time a page takes to turn. */
const TURN_MS = 720

const w = ref(typeof window === 'undefined' ? 800 : window.innerWidth)
const h = ref(typeof window === 'undefined' ? 600 : window.innerHeight)
/** Lying on its side: two pages at a time. */
const double = computed(() => w.value > h.value * 1.15)
/** The shape of a page: width divided by height. */
const shape = computed(() => (props.ratio > 0.2 && props.ratio < 5 ? props.ratio : 1))
/** The height of one page in pixels: as large as the screen allows (two pages side by side lying on the side, else one page). */
const ph = computed(() => Math.max(1, Math.floor(double.value ? Math.min(h.value, w.value / (2 * shape.value)) : Math.min(h.value, w.value / shape.value))))
/** The width of one page. */
const pw = computed(() => Math.max(1, Math.floor(ph.value * shape.value)))

const count = computed(() => props.pages.length)
/** The page (0 = the cover) that is at the left of what is shown, kept while the phone is turned. */
const page = ref(0)
const views = computed(() => (double.value ? Math.floor(count.value / 2) + 1 : count.value))
const viewOf = (p: number) => (double.value ? Math.floor((p + 1) / 2) : p)
const pageOf = (v: number) => (double.value ? (v === 0 ? 0 : 2 * v - 1) : v)
const view = computed(() => Math.min(views.value - 1, viewOf(page.value)))

interface Slots {
  l: Page | null
  r: Page | null
  s: Page | null
}
/** The pictures of a view: left and right page of a spread (the cover is alone on the right), or the one page. */
function slots(v: number): Slots {
  const p = props.pages
  if (!double.value) return { l: null, r: null, s: p[v] ?? null }
  return v === 0 ? { l: null, r: p[0] ?? null, s: null } : { l: p[2 * v - 1] ?? null, r: p[2 * v] ?? null, s: null }
}

interface Flip {
  /** 1 = forwards, -1 = back */
  dir: 1 | -1
  to: number
  /** what lies under the leaf */
  base: Slots
  front: Page | null
  back: Page | null
  /** the angle of the leaf; it is set a moment after the leaf is shown, so that it moves */
  angle: number
  from: number
  /** the leaf is on its way (the paper gets its light and shade) */
  turning: boolean
}
const flip = ref<Flip | null>(null)
const baseSlots = computed(() => flip.value?.base ?? slots(view.value))

/**
 * The fold in the middle is there whenever the view the book turns to has two pages. It lies above the turning leaf and stays in its place
 * the whole time (it used to lie under the leaf, so it only showed up when the leaf was taken away at the end of the turn: a second late).
 */
const spineOn = computed(() => {
  if (!double.value) return false
  const s = slots(flip.value ? flip.value.to : view.value)
  return !!(s.l && s.r)
})

// the current page, blurred and dark, behind the book
const picture = (p: Page | null | undefined): string => (typeof p === 'string' ? p : '')
const backdrop = computed(() => {
  const s = slots(flip.value ? flip.value.to : view.value)
  const own = picture(s.s) || picture(s.r) || picture(s.l)
  if (own) return own
  // only words are on show: the nearest picture of the book lies behind them, blurred
  const here = pageOf(flip.value ? flip.value.to : view.value)
  for (let d = 0; d < props.pages.length; d++) {
    const near = picture(props.pages[here + d]) || picture(props.pages[here - d])
    if (near) return near
  }
  return ''
})

/** The cover stands alone on the right: the book moves to the left so that it is in the middle. */
const shifted = computed(() => double.value && (flip.value ? flip.value.to : view.value) === 0)
const bookStyle = computed(() => ({
  width: `${double.value ? pw.value * 2 : pw.value}px`,
  height: `${ph.value}px`,
  transform: `translateX(${shifted.value ? -pw.value / 2 : 0}px)`
}))

const reducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let timer: ReturnType<typeof setTimeout> | undefined

// ── the magnifier ───────────────────────────────────────────────────
const zoom = reactive<Zoom>({ s: 1, x: 0, y: 0 })
const zoomed = computed(() => zoom.s > 1.01)
/** Two fingers or one finger are moving the page: no easing then. */
const gesturing = ref(false)
const room = (): ZoomRoom => ({ w: w.value, h: h.value, bw: double.value ? pw.value * 2 : pw.value, bh: ph.value })
const setZoom = (z: Zoom) => Object.assign(zoom, z)
const resetZoom = () => setZoom({ s: 1, x: 0, y: 0 })
/** Enlarges around a place on the screen (the middle without one), or goes back to the whole page. */
function toggleZoom(clientX = w.value / 2, clientY = h.value / 2) {
  if (zoomed.value) resetZoom()
  else setZoom(zoomAround(zoom, ZOOM_TAP, clientX - w.value / 2, clientY - h.value / 2, room()))
}
// turning the phone: the page that was enlarged is another size now
watch([w, h], resetZoom)
const zoomStyle = computed(() => (zoomed.value ? { transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})` } : {}))

function settle(to: number) {
  clearTimeout(timer)
  page.value = pageOf(to)
  flip.value = null
  preload()
}

function go(dir: 1 | -1) {
  if (flip.value) return
  resetZoom()
  const from = view.value
  const to = from + dir
  if (to < 0 || to >= views.value) return
  if (reducedMotion()) {
    settle(to)
    return
  }
  const a = slots(from)
  const b = slots(to)
  let next: Flip
  if (double.value) {
    next =
      dir > 0
        ? { dir, from, to, base: { l: a.l, r: b.r, s: null }, front: a.r, back: b.l, angle: 0, turning: false }
        : { dir, from, to, base: { l: b.l, r: a.r, s: null }, front: a.l, back: b.r, angle: 0, turning: false }
  } else {
    // one page: it swings away to the left (forwards) or comes back from there (back)
    next =
      dir > 0
        ? { dir, from, to, base: { l: null, r: null, s: b.s }, front: a.s, back: null, angle: 0, turning: false }
        : { dir, from, to, base: { l: null, r: null, s: a.s }, front: b.s, back: null, angle: -180, turning: false }
  }
  flip.value = next
  void nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const f = flip.value
        if (!f) return
        f.angle = double.value ? (f.dir > 0 ? -180 : 180) : f.dir > 0 ? -180 : 0
        f.turning = true
      })
    })
  })
  timer = setTimeout(() => settle(to), TURN_MS + 120)
}

const leafStyle = computed(() => {
  const f = flip.value
  if (!f) return {}
  return { transform: `rotateY(${f.angle}deg)`, transitionDuration: `${TURN_MS}ms` }
})
const leafClass = computed(() => {
  const f = flip.value
  if (!f) return ''
  return [double.value ? (f.dir > 0 ? 'is-right' : 'is-left') : 'is-single', f.turning ? 'is-turning' : '']
})

function preload() {
  for (const v of [view.value - 1, view.value + 1, view.value + 2]) {
    if (v < 0 || v >= views.value) continue
    const s = slots(v)
    for (const src of [s.l, s.r, s.s]) {
      if (typeof src === 'string' && src) new Image().src = src
    }
  }
}

function measure() {
  w.value = window.innerWidth
  h.value = window.innerHeight
}

// a swipe to the side turns the page; two fingers enlarge it; one finger moves an enlarged page
let startX = 0
let startY = 0
let swiped = 0
let pinch: { d: number; s: number } | null = null
let drag: { x: number; y: number } | null = null
const distance = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
function onTouchStart(e: TouchEvent) {
  const p = e.touches[0]
  if (!p) return
  const q = e.touches[1]
  if (q) {
    pinch = { d: Math.max(1, distance(p, q)), s: zoom.s }
    drag = null
    gesturing.value = true
    swiped = Date.now()
    return
  }
  startX = p.clientX
  startY = p.clientY
  drag = zoomed.value ? { x: p.clientX, y: p.clientY } : null
}
function onTouchMove(e: TouchEvent) {
  const p = e.touches[0]
  if (!p) return
  const q = e.touches[1]
  if (pinch && q) {
    const mx = (p.clientX + q.clientX) / 2 - w.value / 2
    const my = (p.clientY + q.clientY) / 2 - h.value / 2
    setZoom(zoomAround(zoom, (pinch.s * distance(p, q)) / pinch.d, mx, my, room()))
    swiped = Date.now()
    return
  }
  if (drag && zoomed.value) {
    // a finger that only trembles is still a tap
    if (Math.hypot(p.clientX - startX, p.clientY - startY) > 8) {
      gesturing.value = true
      swiped = Date.now()
    }
    setZoom(clampZoom({ s: zoom.s, x: zoom.x + p.clientX - drag.x, y: zoom.y + p.clientY - drag.y }, room()))
    drag = { x: p.clientX, y: p.clientY }
  }
}
function onTouchEnd(e: TouchEvent) {
  const p = e.changedTouches[0]
  if (!p) return
  if (pinch) {
    // one of the two fingers is up: the rest of this gesture does nothing
    if ((e.touches?.length ?? 0) === 0) {
      pinch = null
      gesturing.value = false
    }
    swiped = Date.now()
    return
  }
  drag = null
  gesturing.value = false
  if (zoomed.value) return
  const dx = p.clientX - startX
  const dy = p.clientY - startY
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    swiped = Date.now()
    go(dx < 0 ? 1 : -1)
  }
}
/**
 * A tap on the left or right third turns the page (not the one that ended a swipe). A double tap in the middle enlarges the page; an enlarged page only
 * answers to a double tap (back to the whole page), so that a finger that rests on it does not turn it away.
 */
let lastTap = 0
function onTap(e: MouseEvent) {
  if (Date.now() - swiped < 450) return
  const x = e.clientX / Math.max(1, w.value)
  if (!zoomed.value && (x < 0.3 || x > 0.7)) {
    lastTap = 0
    go(x < 0.3 ? -1 : 1)
    return
  }
  if (Date.now() - lastTap < 350) {
    lastTap = 0
    toggleZoom(e.clientX, e.clientY)
  } else lastTap = Date.now()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1)
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1)
  else if (e.key === '+') setZoom(zoomAround(zoom, zoom.s * 1.5, 0, 0, room()))
  else if (e.key === '-') setZoom(zoomAround(zoom, zoom.s / 1.5, 0, 0, room()))
  else if (e.key === 'Escape') {
    if (zoomed.value) resetZoom()
    else emit('close')
  }
}

onMounted(() => {
  window.addEventListener('resize', measure)
  window.addEventListener('orientationchange', measure)
  window.addEventListener('keydown', onKeydown)
  measure()
  preload()
  // the whole screen: where the browser allows it the bars go away (it only works after a tap, and not everywhere)
  try {
    void document.documentElement.requestFullscreen?.().catch(() => undefined)
  } catch {
    // not allowed here: the book still fills the window
  }
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('resize', measure)
  window.removeEventListener('orientationchange', measure)
  window.removeEventListener('keydown', onKeydown)
  try {
    if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined)
  } catch {
    // nothing to leave
  }
})

defineExpose({ go, page, double, zoom, toggleZoom })
</script>

<template lang="pug">
  div(class="bf-root" role="group" :aria-label="t('app.read.digitalReading')" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd" @touchcancel.passive="onTouchEnd" @click="onTap")
    div(class="bf-bg" :style="{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }")
    button(type="button" class="bf-back" :aria-label="t('app.read.back')" @click.stop="emit('close')")
      ZIconography(name="chevron-left" :size="26")

    div(class="bf-zoom" :class="{ 'is-gesturing': gesturing }" :style="zoomStyle")
      div(class="bf-book" :class="{ 'is-double': double }" :style="bookStyle")
        template(v-if="double")
          div(v-if="baseSlots.l" class="bf-half bf-left")
            BookFlipPage(:page="baseSlots.l")
          div(v-if="baseSlots.r" class="bf-half bf-right")
            BookFlipPage(:page="baseSlots.r")
        div(v-else class="bf-single")
          BookFlipPage(v-if="baseSlots.s" :page="baseSlots.s")

        div(v-if="double" class="bf-spine" :class="{ 'is-on': spineOn, 'is-flipping': !!flip }")

        //- the page that is turning: its front, and its back (the other side of the leaf)
        div(v-if="flip" class="bf-leaf" :class="leafClass" :style="leafStyle")
          div(class="bf-face bf-front")
            BookFlipPage(v-if="flip.front" :page="flip.front")
          div(class="bf-face bf-rear")
            BookFlipPage(v-if="flip.back" :page="flip.back")
</template>

<style scoped lang="sass">
.bf-root
  position: fixed
  inset: 0
  z-index: 2000
  display: flex
  align-items: center
  justify-content: center
  overflow: hidden
  background: #0b0c12
  touch-action: none
  user-select: none
  -webkit-user-select: none
  -webkit-tap-highlight-color: transparent

// the current page, blurred and dark, as the ground the book lies on
.bf-bg
  position: absolute
  inset: -8%
  background-size: cover
  background-position: center
  filter: blur(34px) brightness(0.42) saturate(1.15)
  transition: background-image 300ms

// the layer that is enlarged and moved by the magnifier (the book itself keeps its own place and turns inside it)
.bf-zoom
  position: relative
  z-index: 1
  flex: none
  transition: transform 220ms ease-out

  &.is-gesturing
    transition: none

.bf-back
  position: absolute
  z-index: 5
  top: calc(env(safe-area-inset-top, 0px) + 10px)
  width: 46px
  height: 46px
  display: flex
  align-items: center
  justify-content: center
  padding: 0
  border: 1px solid rgba(255, 255, 255, 0.35)
  border-radius: 50%
  background: rgba(15, 16, 24, 0.55)
  color: #fff
  cursor: pointer
  backdrop-filter: blur(6px)

  :deep(.z-icon-outline)
    color: currentColor

.bf-back
  left: calc(env(safe-area-inset-left, 0px) + 10px)

.bf-book
  position: relative
  z-index: 1
  flex: none
  perspective: 2400px
  transition: transform 720ms cubic-bezier(0.45, 0.05, 0.25, 1)

.bf-half
  position: absolute
  top: 0
  width: 50%
  height: 100%
  overflow: hidden
  background: #f6f0e1

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover

.bf-left
  left: 0
  border-radius: 6px 0 0 6px
  box-shadow: -6px 10px 30px rgba(0, 0, 0, 0.5)

.bf-right
  right: 0
  border-radius: 0 6px 6px 0
  box-shadow: 6px 10px 30px rgba(0, 0, 0, 0.5)

// the fold in the middle: a soft shadow on both sides of the spine
.bf-spine
  position: absolute
  z-index: 4
  opacity: 0
  top: 0
  left: calc(50% - 22px)
  width: 44px
  height: 100%
  pointer-events: none
  background: linear-gradient(90deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.28) 46%, rgba(0, 0, 0, 0.34) 50%, rgba(0, 0, 0, 0.18) 56%, rgba(0, 0, 0, 0))

  // no fading at all: a shadow that fades in and out next to the turning leaf flickered on some phones (Anton 21.11.2026)
  &.is-on
    opacity: 1

.bf-single
  position: absolute
  inset: 0
  overflow: hidden
  border-radius: 6px
  background: #f6f0e1
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.55)

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover

// the leaf that turns round the spine (or round the left edge of a single page)
.bf-leaf
  position: absolute
  z-index: 3
  top: 0
  height: 100%
  transform-style: preserve-3d
  transition-property: transform
  transition-timing-function: cubic-bezier(0.45, 0.05, 0.25, 1)

  &.is-right
    left: 50%
    width: 50%
    transform-origin: left center

  &.is-left
    left: 0
    width: 50%
    transform-origin: right center

  &.is-single
    left: 0
    width: 100%
    transform-origin: left center

.bf-face
  position: absolute
  inset: 0
  overflow: hidden
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  background: #f6f0e1

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover

.bf-rear
  transform: rotateY(180deg)
</style>
