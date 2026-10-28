<template lang="pug">
  div(
    v-if="visible"
    class="swipe-hint"
    aria-hidden="true"
  )
    //- A round button at the right edge with the "forward" arrow of the app: it nudges to the left, the way a page is turned.
    div(class="hint-pill" :class="{ 'is-active': active }")
      ZIconography(name="chevron-right" :size="38")
      ZIconography(class="hint-second" name="chevron-right" :size="38")
</template>

<script lang="ts">
export function hasSeenSwipeHint(bookId: string): boolean {
  try {
    return localStorage.getItem(`kanaan.swipeHintSeen.${bookId}`) === '1'
  } catch {
    return false
  }
}

export function markSwipeHintSeen(bookId: string): void {
  try {
    localStorage.setItem(`kanaan.swipeHintSeen.${bookId}`, '1')
  } catch {
    // ignore
  }
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import ZIconography from '@/components/atoms/ZIconography.vue'

const props = defineProps<{
  bookId: string
  /** Gate externally — parent may force-hide on user swipe. */
  enabled: boolean
  /** How many swipe reps before hiding (caller controls total run count). */
  repeats?: number
}>()

const emit = defineEmits<{
  (e: 'finished'): void
}>()

const visible = ref(true)
const active = ref(false)
let runTimer: ReturnType<typeof setTimeout> | null = null
let finishedEmitted = false

const REPEATS = props.repeats ?? 2
// One full press + swipe + reset cycle. Keep it calm — young readers get
// motion-sick from fast gestures.
const CYCLE_MS = 2200

function finish() {
  if (finishedEmitted) return
  finishedEmitted = true
  visible.value = false
  active.value = false
  if (runTimer) clearTimeout(runTimer)
  runTimer = null
  markSwipeHintSeen(props.bookId)
  emit('finished')
}

function startCycle(remaining: number) {
  if (!props.enabled) return
  if (remaining <= 0) {
    finish()
    return
  }
  active.value = false
  runTimer = setTimeout(() => {
    active.value = true
    runTimer = setTimeout(() => {
      startCycle(remaining - 1)
    }, CYCLE_MS)
  }, 250)
}

watch(
  () => props.enabled,
  (on) => {
    if (on) {
      visible.value = true
      finishedEmitted = false
      startCycle(REPEATS)
    } else {
      if (runTimer) clearTimeout(runTimer)
      runTimer = null
      visible.value = false
      active.value = false
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (runTimer) clearTimeout(runTimer)
})
</script>

<style scoped lang="sass">
.swipe-hint
  position: absolute
  inset: 0
  pointer-events: none
  z-index: 12
  overflow: hidden

// a soft round button in the colour of the app, vertically in the middle, at the right edge
.hint-pill
  position: absolute
  top: 50%
  right: 14px
  display: flex
  align-items: center
  justify-content: center
  width: 64px
  height: 64px
  margin-top: -32px
  border-radius: 50%
  background: var(--lk-accent, #1f6f6b)
  color: var(--lk-on-accent, #fff)
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28)
  opacity: 0
  transform: translateX(14px)
  transition: opacity 260ms ease, transform 260ms ease

  &.is-active
    opacity: 0.94
    animation: hint-nudge 1100ms ease-in-out 2 both

// the second arrow follows the first one, a little paler: "on and on"
.hint-second
  margin-left: -20px
  opacity: 0.55

@keyframes hint-nudge
  0%
    transform: translateX(0)
  50%
    transform: translateX(-26px)
  100%
    transform: translateX(0)

@media (prefers-reduced-motion: reduce)
  .hint-pill.is-active
    animation: none
    transform: translateX(0)
</style>
