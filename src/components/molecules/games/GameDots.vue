<script setup lang="ts">
/**
 * Connect the dots: numbered dots lie along the line of the mountain tops in a dimmed picture, and the child taps them in order. A right
 * dot shows more of the picture in colour (the picture is only faded in; nothing is drawn). Three parts: in the first the next dot
 * pulses, in the second only after a wrong tap, in the third it pulses only after three wrong taps in a row (so nobody gets stuck).
 * A wrong dot gets a red cross and counts as a mistake; nothing can be lost.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { DotsGame } from '@/types/adventure'

const props = defineProps<{ game: DotsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.points.length)

const total = computed(() => props.game.points.length)
/** How many dots are found: the next one to tap has this index. */
const found = ref(0)
const mistakes = ref(0)
/** Wrong taps since the last right one. */
const wrongStreak = ref(0)
const flash = ref<{ index: number; kind: 'good' | 'bad' } | null>(null)
const message = ref('')
const finished = computed(() => total.value > 0 && found.value >= total.value)
const stars = computed(() => mistakeStars(mistakes.value, 3, 8))

const section = computed(() => Math.min(2, Math.floor(found.value / Math.max(1, Math.ceil(total.value / 3)))))
/** The next dot pulses: always at first, then only after a wrong tap, in the last part only after three of them. */
const pulses = (i: number) => i === found.value && (section.value === 0 || (section.value === 1 && wrongStreak.value > 0) || (section.value === 2 && wrongStreak.value >= 3))

/** How much of the picture shows in colour (percent from the left): up to the middle between the last found dot and the next one. */
const reveal = computed(() => {
  if (finished.value) return 100
  if (found.value === 0) return 0
  const pts = props.game.points
  const last = pts[found.value - 1]![0]
  const next = pts[found.value]![0]
  return Math.min(100, Math.max(last, (last + next) / 2))
})
const colorStyle = computed(() => ({ clipPath: `inset(0 ${100 - reveal.value}% 0 0)` }))

function flashDot(index: number, kind: 'good' | 'bad') {
  flash.value = { index, kind }
  later(() => {
    if (flash.value?.index === index) flash.value = null
  }, 900)
}

function tap(i: number) {
  if (finished.value || i < found.value) return
  if (i === found.value) {
    found.value++
    wrongStreak.value = 0
    progress.mark()
    play('bead')
    flashDot(i, 'good')
    message.value = ''
    if (found.value >= total.value) later(() => play('star'), 300)
    return
  }
  mistakes.value++
  wrongStreak.value++
  play('wrong')
  flashDot(i, 'bad')
  message.value = t('app.adventure.fbWrong')
}

/**
 * The tap area of a dot: 44 px, or less where the next dot is closer (the area then ends halfway to it, so the nearest dot wins and no two areas
 * overlap). The distance is in widths of the picture (`cqw`; the picture is 3 : 4). A dot at the edge keeps its whole area inside the picture.
 */
const hitSizes = computed(() =>
  props.game.points.map((p, i) => {
    let near = Infinity
    props.game.points.forEach((q, j) => {
      if (j !== i) near = Math.min(near, Math.hypot(p[0] - q[0], (p[1] - q[1]) * (4 / 3)))
    })
    return Number.isFinite(near) ? `min(44px, ${(near * 0.96).toFixed(2)}cqw)` : '44px'
  })
)
const dotStyle = (p: [number, number], i: number) => ({
  '--s': hitSizes.value[i],
  left: `clamp(calc(var(--s) / 2), ${p[0]}%, calc(100% - var(--s) / 2))`,
  top: `clamp(calc(var(--s) / 2), ${p[1]}%, calc(100% - var(--s) / 2))`,
  zIndex: i === found.value ? 10 : 1
})
const src = computed(() => prependBaseUrl(props.game.image))
</script>

<template lang="pug">
  div(class="dt")
    p(class="dt-hint" role="status") {{ message || (finished ? t('app.adventure.dotsDone') : t('app.adventure.dotsNext')) }}
    div(class="dt-field" role="group" :aria-label="t('app.adventure.dotsCount', { n: found, total })")
      img(:src="src" alt="" draggable="false" class="dt-base")
      img(:src="src" alt="" draggable="false" class="dt-color" :style="colorStyle")
      button(
        v-for="(p, i) in game.points"
        :key="i"
        type="button"
        class="dt-dot"
        :class="{ done: i < found, next: i === found, pulse: pulses(i), 'flash-bad': flash?.index === i && flash.kind === 'bad' }"
        :style="dotStyle(p, i)"
        :disabled="i < found"
        :aria-label="t('app.adventure.dotsDot', { n: i + 1 })"
        @click="tap(i)"
      )
        span(class="dt-n") {{ i + 1 }}
        GameMark(v-if="flash?.index === i" :kind="flash.kind" class="dt-mark")
    p(class="dt-count") {{ t('app.adventure.dotsCount', { n: found, total }) }}
    GameDone(v-if="finished" :stars="stars" :text="t('app.adventure.dotsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.dt
  display: flex
  flex-direction: column
  gap: 10px

.dt-hint
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 700
  color: #5f4f35

.dt-field
  position: relative
  width: 100%
  aspect-ratio: 3 / 4
  container-type: inline-size
  overflow: hidden
  border-radius: 16px
  border: 3px solid #d4a83e
  background: #cfe3ee
  box-shadow: 0 6px 14px -6px rgba(60, 40, 10, 0.5)
  touch-action: manipulation

.dt-base,
.dt-color
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  pointer-events: none
  user-select: none

// the picture before the dots are found: dim and almost without colour
.dt-base
  filter: grayscale(0.85) brightness(0.62) contrast(0.9)

.dt-color
  transition: clip-path 600ms ease-out

.dt-dot
  position: absolute
  display: flex
  align-items: center
  justify-content: center
  width: var(--s, 44px)
  height: var(--s, 44px)
  // round: two tap areas of neighbours never overlap, not even diagonally
  border-radius: 50%
  padding: 0
  transform: translate(-50%, -50%)
  border: 0
  background: transparent
  cursor: pointer
  -webkit-tap-highlight-color: transparent

  // the visible bead is smaller than the tap area
  &::before
    content: ''
    position: absolute
    width: 30px
    height: 30px
    border-radius: 50%
    background: #fff3cf
    border: 3px solid #b98a2e
    box-shadow: 0 2px 5px rgba(40, 25, 5, 0.55)

  &.done::before
    background: #2fae54
    border-color: #fff
    opacity: 0.9

  &.done
    cursor: default

  &.pulse::before
    animation: dt-pulse 1000ms ease-in-out infinite

  &.flash-bad::before
    border-color: #d63031
    background: #ffd9d9

  &:focus-visible::before
    outline: 3px solid #fff3b0
    outline-offset: 2px

.dt-n
  position: relative
  font-family: 'Fraunces', serif
  font-weight: 800
  font-size: 1rem
  color: #4a3208

.done .dt-n
  color: #fff

.dt-mark
  position: absolute
  top: -6px
  right: -6px
  width: 24px
  height: 24px
  font-size: 0.9rem

.dt-count
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

@keyframes dt-pulse
  0%, 100%
    transform: scale(1)
    box-shadow: 0 0 0 0 rgba(255, 230, 120, 0.9)
  50%
    transform: scale(1.18)
    box-shadow: 0 0 0 8px rgba(255, 230, 120, 0)

@media (prefers-reduced-motion: reduce)
  .dt-dot.pulse::before
    animation: none
    outline: 3px dashed #fff3b0
    outline-offset: 2px
  .dt-color
    transition: none
</style>
