<script setup lang="ts">
/**
 * The hidden-picture game: people stand in a busy painted scene, some of them half behind a bush, a barrel or a rock. Tapping
 * one finds it: it steps out in front of what hid it, with a golden glow and a little light. All found means won.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useTimers from '@/use/useTimers'
import GameDone from '@/components/molecules/games/GameDone.vue'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { FindGame } from '@/types/adventure'

const props = defineProps<{ game: FindGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

const found = reactive<Record<number, boolean>>({})
const count = computed(() => Object.keys(found).length)
const total = computed(() => props.game.finds.length)
const finished = computed(() => count.value >= total.value)
/** Taps on the empty scene are misses; a few are fine, looking around is the game. */
const misses = ref(0)
const stars = computed(() => mistakeStars(misses.value, 4, 10))
const sceneSrc = computed(() => prependBaseUrl(props.game.scene))
const burst = prependBaseUrl('images/abenteuer/ui/sternglanz.webp')

const style = (f: { x: number; y: number; w: number }, z: number) => ({
  left: `${f.x}%`,
  top: `${f.y}%`,
  width: `${f.w}%`,
  zIndex: String(z)
})

function find(i: number) {
  if (found[i]) return
  found[i] = true
  progress.mark()
  play('found')
}

/** Where the last tap on the empty scene was (a red ring shows it for a moment). */
const miss = ref<{ x: number; y: number; k: number } | null>(null)
let missKey = 0

function sceneTap(e: MouseEvent) {
  if (e.target instanceof Element && e.target.closest('.fd-thing')) return
  misses.value++
  play('wrong')
  const box = e.currentTarget instanceof HTMLElement ? e.currentTarget.getBoundingClientRect() : null
  if (!box) return
  miss.value = { x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100, k: ++missKey }
  const k = missKey
  later(() => {
    if (miss.value?.k === k) miss.value = null
  }, 700)
}
</script>

<template lang="pug">
  div(class="fd")
    div(v-if="!finished" class="fd-scene" @click="sceneTap")
      img(:src="sceneSrc" alt="" class="fd-bg" draggable="false")
      button(
        v-for="(f, i) in game.finds"
        :key="`f-${i}`"
        type="button"
        class="fd-thing"
        :class="{ found: found[i] }"
        :style="style(f, found[i] ? 40 : 10)"
        :aria-label="game.labels?.[i] ?? t('app.adventure.findOne')"
        @click="find(i)"
      )
        img(:src="prependBaseUrl(f.image)" alt="" draggable="false")
        img(v-if="found[i]" :src="burst" alt="" class="fd-spark" draggable="false")
      span(v-if="miss" :key="miss.k" class="fd-miss" :style="{ left: `${miss.x}%`, top: `${miss.y}%` }")
      img(
        v-for="(c, i) in game.covers"
        :key="`c-${i}`"
        :src="prependBaseUrl(c.image)"
        alt=""
        class="fd-cover"
        :style="style(c, 20)"
        draggable="false"
      )
    p(v-if="!finished" class="fd-count" role="status") {{ t('app.adventure.findCount', { n: count, total }) }}
    GameDone(v-else :stars="stars" :text="game.doneText ?? t('app.adventure.findDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.fd-scene
  position: relative
  width: min(100%, 360px)
  aspect-ratio: 3 / 4
  margin: 0 auto
  border-radius: 18px
  overflow: hidden
  border: 3px solid #d4a83e
  box-shadow: 0 10px 24px -12px rgba(60, 40, 10, 0.6)

.fd-bg
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover

// the things are anchored by the middle of their bottom edge
.fd-thing
  position: absolute
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  // a small figure (a man 27 px wide) still has a finger-sized hit area: an invisible box of at least 44 x 44 px around its middle
  &::before
    content: ''
    position: absolute
    left: 50%
    top: 50%
    width: max(100%, 44px)
    height: max(100%, 44px)
    transform: translate(-50%, -50%)

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.found
    animation: fd-found 600ms cubic-bezier(0.2, 1.5, 0.4, 1)
    cursor: default

    img:first-child
      filter: drop-shadow(0 0 4px #2fae54) drop-shadow(0 0 10px #2fae54) drop-shadow(0 0 14px rgba(255, 220, 90, 0.9))

.fd-spark
  position: absolute !important
  left: 50%
  top: 8%
  width: 70% !important
  transform: translate(-50%, -50%)
  animation: fd-spark 1400ms ease-out both

// a tap on nothing: a red ring grows and fades where it was
.fd-miss
  position: absolute
  z-index: 50
  width: 46px
  height: 46px
  margin: -23px 0 0 -23px
  border: 4px solid #d63031
  border-radius: 50%
  box-shadow: 0 0 12px rgba(214, 48, 49, 0.8)
  pointer-events: none
  animation: fd-miss 700ms ease-out both

@keyframes fd-miss
  from
    opacity: 1
    transform: scale(0.4)
  to
    opacity: 0
    transform: scale(1.4)

.fd-cover
  position: absolute
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none

.fd-count
  margin: 10px 0 0
  text-align: center
  font-family: 'Fraunces', serif
  font-weight: 700
  font-size: 1.2rem
  color: #3b2a12

@keyframes fd-found
  0%
    transform: translate(-50%, -100%) scale(1)
  40%
    transform: translate(-50%, -104%) scale(1.25)
  100%
    transform: translate(-50%, -100%) scale(1)

@keyframes fd-spark
  0%
    opacity: 0
    scale: 0.2
    rotate: 0deg
  30%
    opacity: 1
    scale: 1
  100%
    opacity: 0
    scale: 1.6
    rotate: 90deg

@media (prefers-reduced-motion: reduce)
  .fd-thing.found
    animation: none
</style>
