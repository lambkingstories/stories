<script setup lang="ts">
/**
 * Up to three plain stars in a row (painted by the image model): the earned ones shine, the others are switched off.
 * With `celebrate` the earned stars appear one after the other with a pop and a glow, and throw sparks: a little for one star,
 * more for two and the most for three. The sparks are the painted "star burst" picture.
 */
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { MAX_STARS } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import { prependBaseUrl } from '@/utils/function'

const props = withDefaults(defineProps<{ stars: number; size?: number; celebrate?: boolean }>(), { size: 22, celebrate: false })
const star = (on: boolean, i: number) => prependBaseUrl(`images/abenteuer/ui/stern-${on ? 'gold' : 'aus'}-${i}.webp`)
const burst = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')

// every earned star pops with a little sound, three stars end with a fanfare
const { play } = useSfx()
const timers: number[] = []
onMounted(() => {
  if (!props.celebrate || props.stars <= 0) return
  for (let i = 0; i < Math.min(props.stars, MAX_STARS); i++) timers.push(window.setTimeout(() => play('star'), i * 380 + 250))
  if (props.stars >= MAX_STARS) timers.push(window.setTimeout(() => play('fanfare'), (MAX_STARS - 1) * 380 + 600))
})
onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))

/** Sparks around every earned star: the more stars, the more sparks. */
const sparkCount = computed(() => (props.stars >= 3 ? 8 : props.stars === 2 ? 5 : 3))
const sparks = computed(() =>
  Array.from({ length: sparkCount.value }, (_, k) => {
    const a = (k / sparkCount.value) * Math.PI * 2 + 0.4
    const r = props.size * (0.9 + (k % 3) * 0.35)
    return {
      '--dx': `${Math.cos(a) * r}px`,
      '--dy': `${Math.sin(a) * r}px`,
      '--s': String(0.28 + (k % 3) * 0.12),
      '--rot': `${(k % 2 ? 1 : -1) * (40 + k * 20)}deg`,
      width: `${props.size * 0.7}px`
    }
  })
)
</script>

<template lang="pug">
  span(class="stars" :class="{ celebrate }" :aria-label="`${stars} / ${MAX_STARS}`" :style="{ '--size': `${size}px` }")
    span(v-for="i in MAX_STARS" :key="i" class="slot" :style="{ width: `${size}px`, height: `${size}px`, '--i': i - 1 }")
      img(:src="star(i <= stars, i)" alt="" draggable="false" class="star" :class="{ lit: i <= stars }")
      template(v-if="celebrate && i <= stars")
        img(v-for="(sp, k) in sparks" :key="k" :src="burst" alt="" class="spark" draggable="false" :style="sp")
</template>

<style scoped lang="sass">
.stars
  position: relative
  display: inline-flex
  align-items: center
  gap: 2px
  vertical-align: middle

.slot
  position: relative
  display: inline-block

.star
  display: block
  width: 100%
  height: 100%
  object-fit: contain

// the stars appear one after the other: a pop, then a gentle glow that goes on
.celebrate
  .star.lit
    opacity: 0
    animation: star-pop 700ms cubic-bezier(0.2, 1.6, 0.4, 1) both, star-glow 2.2s ease-in-out infinite
    animation-delay: calc(var(--i) * 380ms + 150ms), calc(var(--i) * 380ms + 900ms)
    filter: drop-shadow(0 0 6px rgba(255, 210, 80, 0.9))

  .star:not(.lit)
    opacity: 0
    animation: star-fade 500ms ease-out both
    animation-delay: 1100ms

.spark
  position: absolute
  left: 50%
  top: 50%
  height: auto
  margin: calc(var(--size) * -0.35) 0 0 calc(var(--size) * -0.35)
  pointer-events: none
  opacity: 0
  animation: spark-fly 1000ms ease-out both
  animation-delay: calc(var(--i, 0) * 380ms + 330ms)

.slot .spark
  animation-delay: calc(var(--i) * 380ms + 330ms)

.slot
  z-index: 1

@keyframes star-pop
  0%
    opacity: 0
    transform: scale(0.2) rotate(-40deg)
  60%
    opacity: 1
    transform: scale(1.45) rotate(8deg)
  100%
    opacity: 1
    transform: scale(1) rotate(0)

@keyframes star-glow
  0%, 100%
    transform: scale(1)
    filter: drop-shadow(0 0 5px rgba(255, 210, 80, 0.8))
  50%
    transform: scale(1.1)
    filter: drop-shadow(0 0 12px rgba(255, 225, 120, 1))

@keyframes star-fade
  to
    opacity: 1

@keyframes spark-fly
  0%
    opacity: 0
    transform: translate(0, 0) scale(0.1) rotate(0)
  25%
    opacity: 1
  100%
    opacity: 0
    transform: translate(var(--dx), var(--dy)) scale(var(--s)) rotate(var(--rot))

@media (prefers-reduced-motion: reduce)
  .celebrate
    .star.lit, .star:not(.lit)
      animation: none
      opacity: 1

  .spark
    display: none
</style>
