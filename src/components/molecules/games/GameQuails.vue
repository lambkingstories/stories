<script setup lang="ts">
/**
 * The wind brings quails (Numbers 11,31): a wind comes and quails fall around the camp. They come down one after the other onto the ground; the child taps each quail and it hops into the basket.
 * A quail that is not taken in time walks on and is gone (nothing is lost for the game, only the stars count the ones that were caught). The places are repeatable (`quailSpot` in `utils/wuesteGames2.ts`).
 */
import { computed, onMounted, reactive, ref } from 'vue'
import WuesteFrame from '@/components/molecules/games/WuesteFrame.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { catchStars } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import { quailSpot } from '@/utils/wuesteGames2'
import type { QuailsGame } from '@/types/wuesteGames2'

const props = defineProps<{ game: QuailsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
const grand = props.game.rounds.reduce((sum, r) => sum + r.total, 0)
progress.setGoal(grand)

interface Quail {
  id: number
  kind: string
  x: number
  y: number
  landed: boolean
  state: 'ground' | 'caught' | 'gone'
}

const src = (p: string) => prependBaseUrl(p)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const quails = reactive<Quail[]>([])
const caught = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const stars = computed(() => catchStars(caught.value, grand))
const t = computed(() => props.game.texts)
const count = computed(() => t.value.count.replace('{n}', String(caught.value)).replace('{total}', String(grand)))
let resolved = 0
let nextId = 0
let roundId = 0

function widthOf(kind: string) {
  return props.game.quails.find((q) => q.id === kind)?.w ?? 9
}

function resolve(id: number) {
  if (id !== roundId) return
  resolved++
  if (resolved < current.value.total) return
  between.value = true
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      play('star')
      finished.value = true
      return
    }
    round.value++
    startRound()
  }, 900)
}

function drop(i: number, id: number) {
  if (id !== roundId) return
  const spot = quailSpot(i, props.game.ground, round.value)
  const q = reactive<Quail>({ id: nextId++, kind: props.game.quails[i % props.game.quails.length]!.id, x: spot.x, y: spot.y, landed: false, state: 'ground' })
  quails.push(q)
  later(() => {
    q.landed = true
  }, 40)
  later(() => {
    if (q.state !== 'ground') return
    q.state = 'gone'
    message.value = t.value.gone
    later(() => {
      const at = quails.indexOf(q)
      if (at >= 0) quails.splice(at, 1)
    }, 700)
    resolve(id)
  }, 700 + current.value.stay)
  if (i + 1 < current.value.total) later(() => drop(i + 1, id), current.value.every)
}

function startRound() {
  roundId++
  quails.length = 0
  resolved = 0
  between.value = false
  message.value = ''
  drop(0, roundId)
}

function take(q: Quail) {
  if (q.state !== 'ground' || !q.landed || finished.value) return
  q.state = 'caught'
  caught.value++
  progress.mark()
  play('basket')
  message.value = t.value.caught
  const id = roundId
  later(() => {
    const at = quails.indexOf(q)
    if (at >= 0) quails.splice(at, 1)
  }, 600)
  resolve(id)
}

function style(q: Quail) {
  if (q.state === 'caught') return { left: `${props.game.basket.x}%`, top: `${props.game.basket.y - 4}%`, width: `${widthOf(q.kind) * 0.6}%` }
  if (!q.landed) return { left: `${q.x}%`, top: '-12%', width: `${widthOf(q.kind)}%` }
  return { left: `${q.x}%`, top: `${q.y}%`, width: `${widthOf(q.kind)}%` }
}

onMounted(startRound)
</script>

<template lang="pug">
  WuesteFrame(
    :background="game.background"
    :hint="current.hint"
    :round="round"
    :rounds="game.rounds.length"
    :label="t.field"
    :count="count"
    :message="message"
    :finished="finished"
    :stars="stars"
    :done-text="t.done"
    @next="emit('done', stars)"
  )
    img(
      class="gq-basket"
      :src="src(game.basket.image)"
      alt=""
      draggable="false"
      :style="{ left: `${game.basket.x}%`, top: `${game.basket.y}%`, width: `${game.basket.w}%` }"
    )
    button(
      v-for="q in quails"
      :key="`q${q.id}`"
      type="button"
      class="gq-quail"
      :class="{ landed: q.landed, caught: q.state === 'caught', gone: q.state === 'gone' }"
      :style="style(q)"
      :aria-label="t.quail"
      :disabled="q.state !== 'ground'"
      @click="take(q)"
    )
      img(:src="src(game.quails.find((x) => x.id === q.kind)?.image ?? '')" alt="" draggable="false")
</template>

<style scoped lang="sass">
.gq-basket
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 1
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.4))

.gq-quail
  position: absolute
  display: block
  min-width: 52px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 3
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  transition: top 650ms cubic-bezier(0.3, 0, 0.5, 1), left 500ms ease-in, width 500ms ease-in, opacity 600ms
  filter: drop-shadow(0 3px 2px rgba(40, 25, 5, 0.35))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.caught
    z-index: 4
    opacity: 0.4

  &.gone
    opacity: 0
    translate: 60px -40px

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

@media (prefers-reduced-motion: reduce)
  .gq-quail
    transition: none
</style>
