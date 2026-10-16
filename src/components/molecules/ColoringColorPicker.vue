<script setup lang="ts">
/**
 * The free colour picker of the coloring screen (the rainbow pencil, brush or marker of a colour box opens it): a square
 * for how bright and how strong a colour is, a bar for the colour itself, and what was chosen. The colour is handed on
 * while the finger moves, so the tools and the pictures of the pencils change at once. It is our own control because the
 * browser's colour dialog does not open reliably from a button on every tablet.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  open: boolean
  color: string
  /** Room the colour box takes at the bottom edge. */
  lift?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  pick: [hex: string]
  close: []
}>()

const { t } = useI18n({ useScope: 'global' })

// hue 0–360, saturation and value 0–1
const hue = ref(0)
const sat = ref(1)
const val = ref(1)

const SQUARE_W = 240
const SQUARE_H = 150

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${hex(f(5))}${hex(f(3))}${hex(f(1))}`.toUpperCase()
}

function hexToHsv(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  const n = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.padEnd(6, '0')
  const r = (parseInt(n.slice(0, 2), 16) || 0) / 255
  const g = (parseInt(n.slice(2, 4), 16) || 0) / 255
  const b = (parseInt(n.slice(4, 6), 16) || 0) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  return [(h * 60 + 360) % 360, max === 0 ? 0 : d / max, max]
}

const current = computed(() => hsvToHex(hue.value, sat.value, val.value))
const hueColor = computed(() => hsvToHex(hue.value, 1, 1))

const square = ref<HTMLCanvasElement | null>(null)

function drawSquare() {
  const c = square.value
  const ctx = c?.getContext('2d')
  if (!c || !ctx) return
  ctx.fillStyle = hueColor.value
  ctx.fillRect(0, 0, c.width, c.height)
  const white = ctx.createLinearGradient(0, 0, c.width, 0)
  white.addColorStop(0, '#ffffff')
  white.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = white
  ctx.fillRect(0, 0, c.width, c.height)
  const black = ctx.createLinearGradient(0, 0, 0, c.height)
  black.addColorStop(0, 'rgba(0, 0, 0, 0)')
  black.addColorStop(1, '#000000')
  ctx.fillStyle = black
  ctx.fillRect(0, 0, c.width, c.height)
}

// When the picker opens, it shows the colour that is chosen now.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    ;[hue.value, sat.value, val.value] = hexToHsv(props.color)
    void nextTick(drawSquare)
  },
  { immediate: true }
)
watch(hueColor, () => void nextTick(drawSquare))

function hand() {
  emit('pick', current.value)
}

let dragging: number | null = null

function fromPointer(e: PointerEvent) {
  const c = square.value
  if (!c) return
  const r = c.getBoundingClientRect()
  sat.value = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
  val.value = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))
  hand()
}

function onDown(e: PointerEvent) {
  dragging = e.pointerId
  ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  fromPointer(e)
}

function onMove(e: PointerEvent) {
  if (dragging === e.pointerId) fromPointer(e)
}

function onUp() {
  dragging = null
}

function onHue(e: Event) {
  hue.value = Number((e.target as HTMLInputElement).value)
  hand()
}

onBeforeUnmount(() => {
  dragging = null
})
</script>

<template lang="pug">
  transition(name="cp")
    div(
      v-if="open"
      class="cp"
      role="dialog"
      :aria-label="t('app.coloring.customColor')"
      :style="{ '--lift': `${lift ?? 0}px` }"
    )
      div(class="cp-body")
        div(class="cp-sq-wrap")
          canvas(
            ref="square"
            class="cp-sq"
            :width="SQUARE_W"
            :height="SQUARE_H"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
          )
          span(class="cp-knob" :style="{ left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, background: current }")
        div(class="cp-side")
          span(class="cp-now" :style="{ background: current }")
          span(class="cp-hex") {{ current }}
          button(type="button" class="cp-ok" @click="emit('close')") {{ t('app.coloring.done') }}
      input(
        class="cp-hue"
        type="range"
        min="0"
        max="360"
        step="1"
        :value="hue"
        :aria-label="t('app.coloring.hue')"
        @input="onHue"
      )
</template>

<style scoped lang="sass">
$ink: #22262e
$line: rgba(20, 24, 32, 0.12)

.cp
  position: fixed
  left: 50%
  bottom: calc(var(--lift, 0px) + 16px + env(safe-area-inset-bottom, 0px))
  z-index: 85
  width: min(380px, calc(100vw - 24px))
  padding: 14px
  border: 1px solid $line
  border-radius: 20px
  background: rgba(252, 251, 248, 0.97)
  backdrop-filter: blur(18px)
  -webkit-backdrop-filter: blur(18px)
  box-shadow: 0 18px 50px rgba(20, 24, 32, 0.4)
  transform: translateX(-50%)
  color: $ink

.cp-enter-active,
.cp-leave-active
  transition: opacity 220ms ease-out, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)

.cp-enter-from,
.cp-leave-to
  opacity: 0
  transform: translate(-50%, 18px)

.cp-body
  display: flex
  gap: 14px
  align-items: stretch

.cp-sq-wrap
  position: relative
  flex: 1 1 auto
  min-width: 0

.cp-sq
  display: block
  width: 100%
  height: 150px
  border-radius: 12px
  box-shadow: inset 0 0 0 1px $line
  touch-action: none
  cursor: crosshair

.cp-knob
  position: absolute
  width: 22px
  height: 22px
  margin: -11px 0 0 -11px
  border: 3px solid #ffffff
  border-radius: 50%
  box-shadow: 0 0 0 1px rgba(20, 24, 32, 0.4), 0 2px 6px rgba(20, 24, 32, 0.4)
  pointer-events: none

.cp-side
  flex: 0 0 96px
  display: flex
  flex-direction: column
  align-items: center
  justify-content: space-between
  gap: 8px

.cp-now
  display: block
  width: 100%
  height: 70px
  border-radius: 12px
  box-shadow: inset 0 0 0 1px rgba(20, 24, 32, 0.2)

.cp-hex
  font-size: 0.8rem
  font-weight: 800
  letter-spacing: 0.04em

.cp-ok
  width: 100%
  min-height: 44px
  border: 0
  border-radius: 14px
  background: #1f3a5f
  color: #ffffff
  font-size: 0.95rem
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.97)

// the colour bar
.cp-hue
  display: block
  width: 100%
  height: 30px
  margin: 14px 0 0
  appearance: none
  -webkit-appearance: none
  border-radius: 15px
  background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)
  box-shadow: inset 0 0 0 1px $line
  touch-action: none

  &::-webkit-slider-thumb
    -webkit-appearance: none
    width: 30px
    height: 30px
    border: 4px solid #ffffff
    border-radius: 50%
    background: transparent
    box-shadow: 0 0 0 1px rgba(20, 24, 32, 0.4), 0 2px 6px rgba(20, 24, 32, 0.4)

  &::-moz-range-thumb
    width: 22px
    height: 22px
    border: 4px solid #ffffff
    border-radius: 50%
    background: transparent
    box-shadow: 0 0 0 1px rgba(20, 24, 32, 0.4)
</style>
