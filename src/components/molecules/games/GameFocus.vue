<script setup lang="ts">
/**
 * Look into the distance: a picture lies blurred under a wide slider. The child moves the slider (a finger, the mouse or the arrow keys) and the picture gets sharper the nearer the slider comes to the
 * right place; within eight percent of the length of the slider it clicks into place, a tick shines and the round is done. There is no mistake, no clock and no tip button (the picture shows the sharpness
 * by itself). Round 1: the far-off caravan in the evening field (sharp at 70 %), round 2: Rebekah on the camel, close up (sharp at 30 %); the places are not the same, so that round 2 cannot be played by
 * heart. The blur and the click are `blurAt` and `isSharp` in `utils/abrahamGames.ts`. With reduced motion the picture changes in three steps (blurred, half, sharp) instead of smoothly.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { blurAt, isSharp, sharpness } from '@/utils/abrahamGames'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import type { FocusGame } from '@/types/adventure'

const props = defineProps<{ game: FocusGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every picture of every round
progress.setGoal(props.game.rounds.length)

/** The strongest blur (pixels), how near the slider has to be (percent) and where it starts: far from the right place. */
const MAX_BLUR = 16
const TOLERANCE = 8
const startFor = (sharpAt: number) => (sharpAt >= 50 ? 8 : 92)
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const value = ref(startFor(current.value.sharpAt))
const locked = ref(false)
const between = ref(false)
const finished = ref(false)
const message = ref('')

const blur = computed(() => {
  const b = blurAt(value.value, current.value.sharpAt, MAX_BLUR)
  if (!still) return b
  // three steps: blurred, half, sharp
  return b >= MAX_BLUR * 0.7 ? MAX_BLUR : b > 0.5 ? MAX_BLUR / 2 : 0
})
const percent = computed(() => Math.round(sharpness(value.value, current.value.sharpAt) * 100))

function change(e: Event) {
  if (locked.value || between.value || finished.value) return
  value.value = Number((e.target as HTMLInputElement).value)
  if (!isSharp(value.value, current.value.sharpAt, TOLERANCE)) return
  // it clicks into place
  value.value = current.value.sharpAt
  locked.value = true
  progress.mark()
  play('found')
  message.value = t('app.adventure.focusRight')
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 1500)
    return
  }
  later(() => {
    between.value = true
    message.value = t('app.adventure.gameNext')
    later(() => {
      round.value++
      value.value = startFor(current.value.sharpAt)
      locked.value = false
      between.value = false
      message.value = ''
    }, 1200)
  }, 1500)
}
</script>

<template lang="pug">
  div(class="fc")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="fc-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="fc-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="fc-field" role="img" :aria-label="t('app.adventure.focusField', { percent })")
        span(class="fc-pic" :style="{ filter: `blur(${blur}px)` }")
          GameImage(:src="current.image" :ratio="3 / 2" colour="#c9b98a")
        GameMark(v-if="locked" kind="good" class="fc-mark")
      input(
        class="fc-slider"
        type="range"
        min="0"
        max="100"
        step="1"
        :value="value"
        :disabled="locked || between"
        :aria-label="t('app.adventure.focusSlider')"
        @input="change"
      )
      p(class="fc-fb" role="status") {{ message }}
      p(class="fc-count") {{ t('app.adventure.focusCount', { n: round + (locked ? 1 : 0), total: rounds.length }) }}
    GameDone(v-else :stars="3" :text="t('app.adventure.focusDone')" @next="emit('done', 3)")
</template>

<style scoped lang="sass">
.fc
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e6dcb4
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.fc-round
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

.fc-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

// the picture is cut off at the frame, so that the blur does not show a soft edge
.fc-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 2
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #c9b98a

.fc-pic
  display: block
  width: 100%
  height: 100%
  transform: scale(1.06)
  transition: filter 120ms linear

.fc-mark
  position: absolute
  top: 8px
  right: 8px
  z-index: 4

// a wide slider with a big thumb for a thumb
.fc-slider
  -webkit-appearance: none
  appearance: none
  width: 100%
  height: 44px
  margin: 0
  background: transparent
  cursor: pointer
  touch-action: pan-y

  &:disabled
    cursor: default

  &::-webkit-slider-runnable-track
    height: 12px
    border-radius: 999px
    background: linear-gradient(90deg, #c9b98a, #d4a83e)

  &::-moz-range-track
    height: 12px
    border-radius: 999px
    background: linear-gradient(90deg, #c9b98a, #d4a83e)

  &::-webkit-slider-thumb
    -webkit-appearance: none
    width: 40px
    height: 40px
    margin-top: -14px
    border-radius: 50%
    border: 3px solid #fff6dc
    background: #d4a83e
    box-shadow: 0 2px 6px rgba(60, 40, 10, 0.4)

  &::-moz-range-thumb
    width: 34px
    height: 34px
    border-radius: 50%
    border: 3px solid #fff6dc
    background: #d4a83e
    box-shadow: 0 2px 6px rgba(60, 40, 10, 0.4)

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 2px

.fc-fb
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

.fc-count
  margin: 0
  text-align: center
  font-weight: 800
  color: #5f4f35

@media (prefers-reduced-motion: reduce)
  .fc-pic
    transition: none
</style>
