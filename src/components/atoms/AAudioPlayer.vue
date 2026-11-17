<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  isPlaying?: boolean
  currentTime?: number
  duration?: number
  skipSeconds?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  skipSeconds: 15,
  loading: false
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'rewind', seconds: number): void
  (e: 'forward', seconds: number): void
  (e: 'seek', value: number): void
}>()

const SMALL_SKIP = 5

const trackRef = ref<HTMLDivElement | null>(null)
const dragging = ref(false)

const progress = computed(() => {
  if (!props.duration) return 0
  return Math.min(100, Math.max(0, (props.currentTime / props.duration) * 100))
})

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function seekFromEvent(event: PointerEvent) {
  const el = trackRef.value
  if (!el || !props.duration) return
  const rect = el.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  emit('seek', ratio * props.duration)
}

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  seekFromEvent(event)
  event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  seekFromEvent(event)
}

function onPointerUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  try {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  } catch { /* already released */
  }
}
</script>

<template lang="pug">
  div(class="a-audio-player relative w-full rounded-3xl px-5 py-4 md:px-6 md:py-5 select-none")
    //- Progress bar — fat hit area (20px) with a 6px visual track inside
    div(class="a-audio-progress-wrap")
      div(
        ref="trackRef"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        class="a-audio-hit relative w-full h-5 flex items-center cursor-pointer touch-none select-none"
      )
        div(class="a-audio-track relative w-full h-[6px] rounded-full pointer-events-none")
          div(
            class="a-audio-fill absolute inset-y-0 left-0 rounded-full"
            :style="{ width: `${progress}%` }"
          )
          div(
            class="a-audio-handle absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
            :style="{ left: `${progress}%` }"
            :class="{ 'is-dragging': dragging }"
          )

      div(class="mt-2 flex items-center justify-between text-xs font-extrabold tabular-nums a-audio-time")
        span {{ formatTime(currentTime) }}
        span {{ formatTime(duration) }}

    //- Controls
    div(class="mt-3 md:mt-4 flex items-center justify-center gap-3 md:gap-4")
      button(
        type="button"
        @click="emit('rewind', SMALL_SKIP)"
        :aria-label="`Rewind ${SMALL_SKIP}s`"
        class="a-audio-side-btn a-audio-side-btn--sm group relative inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4")
          path(d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z")
        span(class="a-audio-skip-num absolute bottom-[2px] text-[7px] font-black") {{ SMALL_SKIP }}
      button(
        type="button"
        @click="emit('rewind', skipSeconds)"
        :aria-label="`Rewind ${skipSeconds}s`"
        class="a-audio-side-btn group relative inline-flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5")
          path(d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z")
        span(class="a-audio-skip-num absolute bottom-1 text-[8px] font-black") {{ skipSeconds }}


      button(
        type="button"
        @click="emit('toggle')"
        :disabled="loading"
        :aria-label="loading ? 'Loading' : (isPlaying ? 'Pause' : 'Play')"
        :aria-busy="loading || undefined"
        class="a-audio-play group relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full cursor-pointer transition-transform duration-150 ease-out hover:scale-[104%] active:scale-[96%]"
        :class="{ 'is-loading': loading }"
      )
        //- 3-dot "merging/splitting" indicator while audio buffers.
        div(v-if="loading" class="a-audio-dots" aria-hidden="true")
          span(class="a-audio-dot a-audio-dot--1")
          span(class="a-audio-dot a-audio-dot--2")
          span(class="a-audio-dot a-audio-dot--3")
        svg(v-else-if="isPlaying" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8")
          rect(x="6" y="5" width="4" height="14" rx="1.2")
          rect(x="14" y="5" width="4" height="14" rx="1.2")
        svg(v-else viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 translate-x-[2px]")
          path(d="M8 5v14l11-7z")

      button(
        type="button"
        @click="emit('forward', skipSeconds)"
        :aria-label="`Forward ${skipSeconds}s`"
        class="a-audio-side-btn group relative inline-flex items-center justify-center w-11 h-11 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5")
          path(d="M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z")
        span(class="a-audio-skip-num absolute bottom-1 text-[8px] font-black") {{ skipSeconds }}

      //5 sec button
      button(
        type="button"
        @click="emit('forward', SMALL_SKIP)"
        :aria-label="`Forward ${SMALL_SKIP}s`"
        class="a-audio-side-btn a-audio-side-btn--sm group relative inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer"
      )
        svg(viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4")
          path(d="M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z")
        span(class="a-audio-skip-num absolute bottom-[2px] text-[7px] font-black") {{ SMALL_SKIP }}
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent
  background: transparent
  border: none
  padding: 0

// LambKing parchment palette — navy panel, gold progress, cream play
// with a gold ring. Echoes the primary "Lesen" button and ZPlayButton
// so the player reads as a continuation of the rest of the app instead
// of its own theme.
.a-audio-player
  background: linear-gradient(160deg, #21406a 0%, #1c3559 60%, #142a47 100%)
  border: 1px solid rgba(255, 255, 255, 0.18)
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 24px 60px -20px rgba(10, 26, 48, 0.55)
  color: #fdf8ed

.a-audio-track
  background-color: rgba(255, 255, 255, 0.2)

.a-audio-fill
  background: linear-gradient(90deg, #c89030 0%, #d4a83e 60%, #f3d167 100%)
  box-shadow: 0 0 10px rgba(212, 168, 62, 0.7)

.a-audio-handle
  background: radial-gradient(120% 120% at 30% 25%, #ffffff 0%, #fbf1d6 60%, #e0c082 100%)
  box-shadow: 0 0 0 4px rgba(212, 168, 62, 0.18), 0 0 16px 2px rgba(212, 168, 62, 0.7)
  transition: transform 120ms ease-out

  &.is-dragging
    transform: translate(-50%, -50%) scale(1.25)

.a-audio-time
  color: rgba(253, 248, 237, 0.85)

.a-audio-side-btn
  color: rgba(253, 248, 237, 0.92)
  background-color: rgba(255, 255, 255, 0.1)
  border: 1px solid rgba(255, 255, 255, 0.18)
  border-radius: 9999px
  aspect-ratio: 1 / 1
  flex-shrink: 0
  transition: transform 150ms ease-out, background-color 150ms ease-out, color 150ms ease-out

  &:hover
    background-color: rgba(212, 168, 62, 0.25)
    color: #f3d167
    transform: translateY(-1px)

  &:active
    transform: scale(0.96)

.a-audio-side-btn--sm
  background-color: rgba(255, 255, 255, 0.06)

.a-audio-skip-num
  color: rgba(253, 248, 237, 0.85)

// Play button — wine-red 3D gradient identical to ZPlayButton, with a
// gold ring so it reads as the primary CTA inside the navy panel.
.a-audio-play
  background: radial-gradient(120% 120% at 30% 25%, #cc5142 0%, #a93d2e 45%, #7a2a1f 100%)
  color: #ffffff
  border: 3px solid #d4a83e
  border-radius: 9999px
  aspect-ratio: 1 / 1
  flex-shrink: 0
  box-shadow: 0 0 0 1px rgba(212, 168, 62, 0.4), 0 0 28px -2px rgba(212, 168, 62, 0.45), 0 12px 32px -8px rgba(10, 26, 48, 0.6), inset 0 3px 0 rgba(255, 255, 255, 0.28), inset 0 -4px 0 rgba(0, 0, 0, 0.22)

  &:hover
    background: radial-gradient(120% 120% at 30% 25%, #d96354 0%, #bd4435 45%, #8a3022 100%)

  &.is-loading
    cursor: progress

// Three dots that slide along a horizontal line, merging into one and
// splitting back out — same vibe as Google Voice / Assistant "thinking".
.a-audio-dots
  position: relative
  width: 44px
  height: 10px
  display: flex
  align-items: center
  justify-content: center

.a-audio-dot
  position: absolute
  top: 50%
  width: 10px
  height: 10px
  border-radius: 999px
  background-color: #fdf8ed
  transform: translate(-50%, -50%)
  will-change: left, transform, opacity

.a-audio-dot--1
  animation: a-audio-dot-1 1300ms ease-in-out infinite

.a-audio-dot--2
  animation: a-audio-dot-2 1300ms ease-in-out infinite

.a-audio-dot--3
  animation: a-audio-dot-3 1300ms ease-in-out infinite

@keyframes a-audio-dot-1
  0%
    left: 14%
  45%, 55%
    left: 50%
  100%
    left: 14%

@keyframes a-audio-dot-2
  0%, 100%
    left: 50%
    transform: translate(-50%, -50%) scale(1)
  45%, 55%
    transform: translate(-50%, -50%) scale(1.25)

@keyframes a-audio-dot-3
  0%
    left: 86%
  45%, 55%
    left: 50%
  100%
    left: 86%
</style>
