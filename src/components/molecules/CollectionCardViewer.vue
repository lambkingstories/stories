<script setup lang="ts">
/**
 * One card, big, over the page. A finger on the card holds it like a real card: it tilts with the finger and the light glints over it.
 * Swiping to the side turns it round (it follows the finger, and turns on when the swipe is wide enough or quick); a tap does nothing.
 * A card that is new is revealed: it starts on its back and turns over by itself with a small fanfare.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import confetti from 'canvas-confetti'
import CollectionCard from '@/components/molecules/CollectionCard.vue'
import useSfx from '@/use/useSfx'

const props = defineProps<{
  title: string
  image?: string
  reference?: string
  journeyTitle?: string
  stars?: number
  special?: boolean
  art?: boolean
  backImage?: string
  /** The card is new: reveal it. */
  reveal?: boolean
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()

const flipped = ref(!!props.reveal)
// the tilt (degrees), the glint (percent) and the turn that a finger adds while it drags (degrees)
const tilt = ref({ rx: 0, ry: 0, mx: 50, my: 40 })
const drag = ref(0)
const dragging = ref(false)
const root = ref<HTMLElement | null>(null)

let down: { x: number; y: number; t: number; w: number; horizontal: boolean | null } | null = null
let revealTimer: number | undefined
let idle = 0
let raf = 0

/** The turn of the card in degrees: the side it shows plus what a finger drags. */
const turn = () => (flipped.value ? 180 : 0) + drag.value

function glint(cx: number, cy: number, el: HTMLElement) {
  const r = el.getBoundingClientRect()
  tilt.value.mx = Math.min(100, Math.max(0, ((cx - r.left) / r.width) * 100))
  tilt.value.my = Math.min(100, Math.max(0, ((cy - r.top) / r.height) * 100))
}

function onDown(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  down = { x: e.clientX, y: e.clientY, t: performance.now(), w: el.getBoundingClientRect().width, horizontal: null }
  dragging.value = true
  el.setPointerCapture?.(e.pointerId)
  glint(e.clientX, e.clientY, el)
}
function onMove(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  if (!down) {
    // a mouse only has to hover: the light runs over the card
    if (e.pointerType === 'mouse') {
      glint(e.clientX, e.clientY, el)
      tilt.value.rx = (0.5 - tilt.value.my / 100) * 22
      tilt.value.ry = (tilt.value.mx / 100 - 0.5) * 26
    }
    return
  }
  const dx = e.clientX - down.x
  const dy = e.clientY - down.y
  if (down.horizontal === null && Math.hypot(dx, dy) > 10) down.horizontal = Math.abs(dx) > Math.abs(dy) * 0.8
  glint(e.clientX, e.clientY, el)
  // sideways: the card turns (a whole card width of swipe is a half turn); up and down: it tips
  drag.value = Math.max(-175, Math.min(175, (dx / down.w) * 190))
  tilt.value.rx = Math.max(-18, Math.min(18, -dy * 0.14))
  tilt.value.ry = 0
}
function onUp() {
  if (!down) return
  const quick = performance.now() - down.t < 320 && Math.abs(drag.value) > 28
  const wide = Math.abs(drag.value) > 50
  dragging.value = false
  if (wide || quick) {
    flipped.value = !flipped.value
    play('cardTurn')
  }
  drag.value = 0
  tilt.value = { rx: 0, ry: 0, mx: 50, my: 40 }
  down = null
}

// tilting the phone moves the light too
function onOrient(e: DeviceOrientationEvent) {
  if (down || e.gamma == null || e.beta == null) return
  const ry = Math.max(-18, Math.min(18, e.gamma * 0.6))
  const rx = Math.max(-14, Math.min(14, (e.beta - 50) * -0.4))
  tilt.value = { rx, ry, mx: 50 + ry * 2.4, my: 40 - rx * 2.4 }
}

// without a finger or a tilt the light still drifts slowly over the card, so it always shimmers a little
function drift(ts: number) {
  if (!down && !dragging.value) {
    idle = ts / 1000
    const k = (Math.sin(idle * 0.7) + 1) / 2
    if (Math.abs(tilt.value.ry) < 0.5 && Math.abs(tilt.value.rx) < 0.5) {
      tilt.value.mx = 18 + k * 64
      tilt.value.my = 30 + Math.sin(idle * 0.5) * 16
    }
  }
  raf = requestAnimationFrame(drift)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    flipped.value = !flipped.value
    play('cardTurn')
  }
}

onMounted(() => {
  window.addEventListener('deviceorientation', onOrient)
  window.addEventListener('keydown', onKey)
  root.value?.focus()
  play('cardOpen')
  raf = requestAnimationFrame(drift)
  if (props.reveal) {
    revealTimer = window.setTimeout(() => {
      flipped.value = false
      play('fanfare')
      confetti({ particleCount: 70, spread: 80, startVelocity: 32, origin: { x: 0.5, y: 0.55 }, ticks: 140, scalar: 0.9, disableForReducedMotion: true })
    }, 650)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('deviceorientation', onOrient)
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(revealTimer)
  cancelAnimationFrame(raf)
})
</script>

<template lang="pug">
  Teleport(to="body")
    div(ref="root" class="cv" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1" @click.self="emit('close')")
      button(type="button" class="cv-close" :aria-label="t('app.collection.close')" @click="emit('close')") ×
      div(
        class="cv-card"
        :style="{ '--rx': `${tilt.rx}deg`, '--ry': `${turn() + tilt.ry}deg`, '--mx': tilt.mx, '--my': tilt.my }"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      )
        CollectionCard(
          :title="title"
          :image="image"
          :reference="reference"
          :journey-title="journeyTitle"
          :stars="stars"
          :special="special"
          :art="art"
          :back-image="backImage"
          :flipped="flipped"
          :dragging="dragging"
        )
      p(class="cv-hint") {{ t('app.collection.flipHint') }}
</template>

<style scoped lang="sass">
.cv
  position: fixed
  inset: 0
  z-index: 200
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 14px
  background: radial-gradient(circle at 50% 40%, rgba(40, 52, 90, 0.92), rgba(8, 12, 26, 0.96))
  animation: cv-in 0.25s ease-out
  outline: none

// the card is as big as the screen allows: nearly the whole width, or the height minus the hint and the close button
.cv-card
  width: min(94vw, 600px, calc((100dvh - 120px) * 2 / 3))
  touch-action: none
  cursor: grab
  -webkit-tap-highlight-color: transparent
  user-select: none

.cv-hint
  margin: 0
  max-width: min(90vw, 420px)
  text-align: center
  line-height: 1.3
  color: rgba(255, 244, 214, 0.8)
  font-size: 0.9rem
  font-weight: 700

.cv-close
  position: absolute
  top: max(14px, env(safe-area-inset-top))
  right: 16px
  width: 44px
  height: 44px
  border: none
  border-radius: 50%
  background: rgba(255, 255, 255, 0.16)
  color: #fff
  font-size: 1.8rem
  line-height: 1
  cursor: pointer
  z-index: 1

@keyframes cv-in
  from
    opacity: 0

@media (prefers-reduced-motion: reduce)
  .cv
    animation: none
</style>
