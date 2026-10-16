<script setup lang="ts">
/**
 * The time-lapse of a painting: the finished picture is built up again on the line art, step by step, and can be saved or
 * shared as a short video. The film is drawn from the small pictures that were kept while the child painted (see
 * `utils/timelapse.ts`); the video is only made when it is asked for, on the device, and nothing is sent anywhere. Sharing
 * leaves the app, so it sits behind the parental gate.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FPS, frameSchedule, pickVideoType, videoExtension, type TimelapseData } from '@/utils/timelapse'

interface Props {
  open: boolean
  data: TimelapseData | null
  /** The line art of the picture. */
  lineArt: HTMLCanvasElement | null
  /** Asks the parent (the parental gate); true when sharing may go on. */
  gate: () => Promise<boolean>
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n({ useScope: 'global' })

const stage = ref<HTMLCanvasElement | null>(null)
const phase = ref<'loading' | 'playing' | 'paused' | 'done' | 'recording'>('loading')
const progress = ref(0)
const note = ref('')
const canRecord = typeof MediaRecorder !== 'undefined' && !!pickVideoType((ty) => MediaRecorder.isTypeSupported(ty))

// the film
let paint: HTMLCanvasElement | null = null
let line: HTMLCanvasElement | null = null
let bitmaps: ImageBitmap[] = []
let base: ImageBitmap | null = null
let scale = 1
let schedule = frameSchedule(0)
let nextStep = 0
let startedAt = 0
let pausedAt = 0
let raf = 0
let onEnd: (() => void) | null = null

const aspect = computed(() => (props.data ? `${props.data.w} / ${props.data.h}` : '3 / 4'))

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** Draws the empty line art and gets the pictures ready. */
async function prepare() {
  const d = props.data
  const st = stage.value
  if (!d || !st || !props.lineArt) return
  phase.value = 'loading'
  note.value = ''
  // the film is at most 720 pixels wide (a small, sharp video)
  const outW = Math.min(720, d.w * 2) & ~1
  scale = outW / d.w
  const outH = Math.round(d.h * scale) & ~1
  st.width = outW
  st.height = outH
  paint = makeCanvas(outW, outH)
  line = makeCanvas(outW, outH)
  const lctx = line.getContext('2d')!
  lctx.imageSmoothingQuality = 'high'
  lctx.drawImage(props.lineArt, 0, 0, outW, outH)
  for (const b of bitmaps) b.close?.()
  base?.close?.()
  bitmaps = await Promise.all(d.steps.map((s) => createImageBitmap(s.blob)))
  base = d.base ? await createImageBitmap(d.base) : null
  schedule = frameSchedule(d.steps.length)
  rewind()
  draw()
  play()
}

/** Back to the beginning: the base picture only. */
function rewind() {
  nextStep = 0
  if (!paint) return
  const ctx = paint.getContext('2d')!
  ctx.clearRect(0, 0, paint.width, paint.height)
  if (base) ctx.drawImage(base, 0, 0, paint.width, paint.height)
}

/** Puts the steps that are due at `frame` into the picture. */
function advance(frame: number) {
  const d = props.data
  if (!d || !paint) return
  const ctx = paint.getContext('2d')!
  while (nextStep < d.steps.length && schedule.stepAt[nextStep]! <= frame) {
    const s = d.steps[nextStep]!
    const x = Math.floor(s.x * scale)
    const y = Math.floor(s.y * scale)
    const w = Math.ceil((s.x + s.w) * scale) - x
    const h = Math.ceil((s.y + s.h) * scale) - y
    ctx.clearRect(x, y, w, h)
    ctx.drawImage(bitmaps[nextStep]!, x, y, w, h)
    nextStep++
  }
}

/** The picture as it shows in the app: white paper, the paint, the line art multiplied on top. */
function draw() {
  const st = stage.value
  if (!st || !paint || !line) return
  const ctx = st.getContext('2d')!
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, st.width, st.height)
  ctx.drawImage(paint, 0, 0)
  ctx.globalCompositeOperation = 'multiply'
  ctx.drawImage(line, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
}

function tick(now: number) {
  const frame = Math.floor(((now - startedAt) * FPS) / 1000)
  advance(frame)
  draw()
  progress.value = Math.min(1, frame / schedule.frames)
  if (frame >= schedule.frames) {
    phase.value = onEnd ? phase.value : 'done'
    raf = 0
    onEnd?.()
    return
  }
  raf = requestAnimationFrame(tick)
}

function play() {
  cancelAnimationFrame(raf)
  startedAt = performance.now()
  phase.value = 'playing'
  raf = requestAnimationFrame(tick)
}

function replay() {
  cancelAnimationFrame(raf)
  rewind()
  draw()
  play()
}

function togglePause() {
  if (phase.value === 'playing') {
    cancelAnimationFrame(raf)
    pausedAt = performance.now()
    phase.value = 'paused'
  } else if (phase.value === 'paused') {
    startedAt += performance.now() - pausedAt
    phase.value = 'playing'
    raf = requestAnimationFrame(tick)
  } else if (phase.value === 'done') {
    replay()
  }
}

// ── The video ------------------------------------------------------------------------------------------------------

async function shareVideo() {
  const st = stage.value
  if (!st || !canRecord || phase.value === 'recording') return
  if (!(await props.gate())) return
  const type = pickVideoType((ty) => MediaRecorder.isTypeSupported(ty))
  if (!type) return
  note.value = ''
  try {
    const stream = st.captureStream(FPS)
    const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 1_800_000 })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    const finished = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
    })
    cancelAnimationFrame(raf)
    rewind()
    draw()
    phase.value = 'recording'
    recorder.start()
    // the film runs once in real time while it is recorded
    await new Promise<void>((resolve) => {
      onEnd = resolve
      startedAt = performance.now()
      raf = requestAnimationFrame(tick)
    })
    onEnd = null
    // let the last picture be taken
    await new Promise((r) => setTimeout(r, 250))
    recorder.stop()
    await finished
    for (const tr of stream.getTracks()) tr.stop()
    phase.value = 'done'
    await deliver(new Blob(chunks, { type }), type)
  } catch (err) {
    console.warn('video failed', err)
    onEnd = null
    phase.value = 'done'
    note.value = t('app.coloring.videoFailed')
  }
}

async function deliver(blob: Blob, type: string) {
  const name = `LambKing-Zeitraffer-${new Date().toISOString().slice(0, 10)}.${videoExtension(type)}`
  const file = new File([blob], name, { type: type.split(';')[0] })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t('app.coloring.timelapse') })
      return
    } catch (err) {
      // the child closed the share sheet
      if ((err as Error).name === 'AbortError') return
    }
  }
  // a plain download where files cannot be shared
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function close() {
  cancelAnimationFrame(raf)
  onEnd = null
  emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) void prepare()
    else cancelAnimationFrame(raf)
  },
  { flush: 'post' }
)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  for (const b of bitmaps) b.close?.()
  base?.close?.()
})
</script>

<template lang="pug">
  transition(name="tl")
    div(v-if="open" class="tl" role="dialog" aria-modal="true" :aria-label="t('app.coloring.timelapse')")
      div(class="tl-card")
        h2(class="tl-title") {{ t('app.coloring.timelapse') }}
        div(class="tl-stage" :style="{ aspectRatio: aspect }")
          canvas(ref="stage" class="tl-canvas")
          div(v-if="phase === 'loading'" class="tl-wait") {{ t('app.coloring.loading') }}
        div(class="tl-bar" aria-hidden="true")
          span(class="tl-fill" :style="{ width: `${progress * 100}%` }")
        p(v-if="phase === 'recording'" class="tl-note" role="status") {{ t('app.coloring.videoRecording') }}
        p(v-else-if="note" class="tl-note" role="alert") {{ note }}
        div(class="tl-actions")
          button(type="button" class="tl-btn" :disabled="phase === 'loading' || phase === 'recording'" @click="togglePause")
            | {{ phase === 'playing' ? t('app.coloring.timelapsePause') : phase === 'paused' ? t('app.coloring.timelapsePlay') : t('app.coloring.timelapseAgain') }}
          button(v-if="canRecord" type="button" class="tl-btn tl-main" :disabled="phase === 'loading' || phase === 'recording'" @click="shareVideo") {{ t('app.coloring.shareVideo') }}
          button(type="button" class="tl-btn" :disabled="phase === 'recording'" @click="close") {{ t('app.coloring.close') }}
</template>

<style scoped lang="sass">
$ink: #22262e
$accent: #1f3a5f

.tl
  position: fixed
  inset: 0
  z-index: 1100
  display: grid
  place-items: center
  padding: 16px
  background: rgba(14, 12, 8, 0.78)
  backdrop-filter: blur(4px)
  -webkit-backdrop-filter: blur(4px)

.tl-enter-active,
.tl-leave-active
  transition: opacity 240ms ease-out

.tl-enter-from,
.tl-leave-to
  opacity: 0

.tl-card
  width: min(560px, 100%)
  max-height: 100%
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px
  padding: 18px 18px 16px
  border-radius: 22px
  background: linear-gradient(180deg, #fffaf0 0%, #f6e9c8 100%)
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5)
  color: $ink

.tl-title
  margin: 0
  font-size: 1.1rem
  font-weight: 800

.tl-stage
  position: relative
  width: auto
  max-width: 100%
  max-height: min(64vh, 640px)
  border-radius: 10px
  overflow: hidden
  background: #ffffff
  box-shadow: 0 8px 26px rgba(60, 40, 10, 0.4)

.tl-canvas
  display: block
  width: 100%
  height: 100%
  object-fit: contain

.tl-wait
  position: absolute
  inset: 0
  display: grid
  place-items: center
  background: rgba(255, 255, 255, 0.85)
  font-weight: 700

.tl-bar
  width: 100%
  height: 5px
  border-radius: 3px
  background: rgba(34, 38, 46, 0.14)
  overflow: hidden

.tl-fill
  display: block
  height: 100%
  background: $accent

.tl-note
  margin: 0
  font-size: 0.85rem
  font-weight: 700

.tl-actions
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px

.tl-btn
  min-height: 46px
  padding: 0 18px
  border: 2px solid #e6d3a8
  border-radius: 999px
  background: #fffaf0
  color: $ink
  font: inherit
  font-size: 0.92rem
  font-weight: 800
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:disabled
    opacity: 0.45

  &:active:not(:disabled)
    transform: scale(0.97)

.tl-main
  border-color: $accent
  background: $accent
  color: #ffffff
</style>
