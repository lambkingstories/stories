<script setup lang="ts">
/**
 * The memory: every picture is on two cards, which lie face down. Two turned cards with the same picture stay open and tell what
 * the picture is in the story; two different ones turn back. Turning cards that do not match is the game itself, not a mistake. The game has a time limit
 * instead: every full minute takes one star away (three stars at first, one at least once all pairs are found; a skipped game earns one).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useTimers from '@/use/useTimers'
import GameDone from '@/components/molecules/games/GameDone.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { MemoryGame } from '@/types/adventure'

const props = defineProps<{ game: MemoryGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

interface Card {
  id: number
  pair: number
  src: string
}

/** The cards in a fixed mixed order (a small deterministic shuffle). */
const cards = computed<Card[]>(() => {
  const list: Card[] = []
  props.game.pairs.forEach((p, i) => {
    list.push({ id: i * 2, pair: i, src: prependBaseUrl(p.image) })
    list.push({ id: i * 2 + 1, pair: i, src: prependBaseUrl(p.image) })
  })
  let seed = list.length * 6151 + 29
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  return list
})

const back = computed(() => prependBaseUrl(props.game.back))
const open = ref<number[]>([])
const matched = ref<number[]>([])
const locked = ref(false)
const text = ref('')
const finished = computed(() => matched.value.length >= props.game.pairs.length)
/** The seconds since the game began; they stop when the last pair is found. */
const seconds = ref(0)
let ticker: number | null = null
onMounted(() => {
  ticker = window.setInterval(() => {
    if (!finished.value) seconds.value++
  }, 1000)
})
onBeforeUnmount(() => {
  if (ticker != null) clearInterval(ticker)
})
/** Every full minute takes a star away, one star stays. */
const stars = computed(() => Math.max(1, 3 - Math.floor(seconds.value / 60)))
const clock = computed(() => `${Math.floor(seconds.value / 60)}:${String(seconds.value % 60).padStart(2, '0')}`)
const faceUp = (c: Card) => open.value.includes(c.id) || matched.value.includes(c.pair)

function turn(c: Card) {
  if (locked.value || faceUp(c)) return
  play('flip')
  open.value = [...open.value, c.id]
  if (open.value.length < 2) return
  const a = cards.value.find((x) => x.id === open.value[0])
  const b = cards.value.find((x) => x.id === open.value[1])
  if (a && b && a.pair === b.pair) {
    matched.value = [...matched.value, a.pair]
    progress.mark()
    later(() => play('right'), 250)
    text.value = props.game.pairs[a.pair]?.text ?? ''
    open.value = []
    return
  }
  locked.value = true
  later(() => {
    open.value = []
    locked.value = false
  }, 950)
}
</script>

<template lang="pug">
  div(class="mem")
    //- the time: every full minute takes one star away
    div(class="mem-bar")
      AdventureStars(:stars="stars" :size="26")
      span(class="mem-clock") {{ clock }}
      span(class="mem-rule") {{ t('app.adventure.memoryTime') }}
    div(class="mem-grid" :class="{ done: finished }")
      button(
        v-for="c in cards"
        :key="c.id"
        type="button"
        class="mem-card"
        :class="{ up: faceUp(c), found: matched.includes(c.pair) }"
        :aria-label="faceUp(c) ? t('app.adventure.memoryCard') : t('app.adventure.memoryHidden')"
        :aria-pressed="faceUp(c)"
        @click="turn(c)"
      )
        span(class="mem-in")
          img(class="mem-face mem-back" :src="back" alt="" draggable="false")
          img(class="mem-face mem-front" :src="c.src" alt="" draggable="false")
    p(v-if="text" class="mem-text" role="status") {{ text }}
    p(v-else class="mem-text mem-quiet") {{ t('app.adventure.memoryHint') }}
    GameDone(v-if="finished" :stars="stars" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.mem
  display: flex
  flex-direction: column
  gap: 12px

.mem-grid
  display: grid
  grid-template-columns: repeat(4, 1fr)
  gap: 8px

.mem-card
  position: relative
  aspect-ratio: 1
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  perspective: 600px
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

.mem-in
  position: absolute
  inset: 0
  transform-style: preserve-3d
  transition: transform 420ms cubic-bezier(0.3, 1.2, 0.5, 1)

.mem-card.up .mem-in
  transform: rotateY(180deg)

.mem-face
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: contain
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  filter: drop-shadow(0 3px 4px rgba(60, 40, 10, 0.4))

.mem-front
  transform: rotateY(180deg)

.mem-card.found .mem-front
  filter: drop-shadow(0 0 4px #2fae54) drop-shadow(0 0 10px #2fae54)

.mem-bar
  display: flex
  align-items: center
  gap: 10px
  flex-wrap: wrap
  margin-bottom: 8px

.mem-clock
  font-weight: 800
  font-size: 1.15rem
  font-variant-numeric: tabular-nums
  color: #5f4f35

.mem-rule
  flex: 1
  min-width: 140px
  font-size: 1rem
  color: #7a6a4d

.mem-text
  margin: 0
  min-height: 3.2em
  text-align: center
  font-size: 1.02rem
  font-weight: 700
  line-height: 1.4
  color: #2f6b3f

.mem-quiet
  color: #5f4f35

@media (prefers-reduced-motion: reduce)
  .mem-in
    transition-duration: 1ms
</style>
