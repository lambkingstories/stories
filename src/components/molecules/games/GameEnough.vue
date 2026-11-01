<script setup lang="ts">
/**
 * Enough! (Exodus 36,5-7): the people bring so many gifts for the Tent of God that the craftsmen say, "The people bring more than enough." One after the other they walk in from the left and lay their gift on the heap;
 * a dashed line marks what the work needs. The child taps Moses to call "Enough!" when the heap has reached the line. Too early is a mistake (the people go on); if the child waits until far too many gifts lie there,
 * Moses calls by himself (also a mistake). The rules are in `utils/wuesteGames2.ts`.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import GameMark from '@/components/atoms/GameMark.vue'
import WuesteFrame from '@/components/molecules/games/WuesteFrame.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { mistakeStars } from '@/utils/adventureScore'
import { prependBaseUrl } from '@/utils/function'
import { enoughVerdict, heapMarkY, heapSlots } from '@/utils/wuesteGames2'
import type { EnoughGame } from '@/types/wuesteGames2'

const props = defineProps<{ game: EnoughGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
progress.setGoal(props.game.rounds.length)

const WALK_MS = 1500
const src = (p: string) => prependBaseUrl(p)
const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const heap = reactive<string[]>([])
const walkers = reactive<{ key: number; kind: string; going: boolean }[]>([])
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const calling = ref(false)
const crossAt = ref(false)
const stars = computed(() => mistakeStars(misses.value, 1, 3))
const t = computed(() => props.game.texts)
const count = computed(() => t.value.count.replace('{n}', String(heap.length)))
const gw = computed(() => props.game.gifts[0]?.w ?? 8)
const slots = computed(() => heapSlots(heap.length, props.game.heap, gw.value))
const markY = computed(() => heapMarkY(current.value.need, props.game.heap, gw.value))
let key = 0
let given = 0
let roundId = 0

function spawn(id: number) {
  if (id !== roundId || between.value || finished.value) return
  const w = reactive({ key: key++, kind: props.game.walkers[given % props.game.walkers.length]!.id, going: false })
  const gift = props.game.gifts[given % props.game.gifts.length]!.id
  given++
  walkers.push(w)
  later(() => {
    w.going = true
  }, 40)
  later(() => {
    const at = walkers.indexOf(w)
    if (at >= 0) walkers.splice(at, 1)
    if (id !== roundId || between.value) return
    heap.push(gift)
    play('snap')
    if (heap.length > current.value.need + current.value.over) call(true)
  }, WALK_MS + 60)
  later(() => spawn(id), current.value.every)
}

function startRound() {
  roundId++
  heap.length = 0
  walkers.length = 0
  between.value = false
  calling.value = false
  message.value = ''
  spawn(roundId)
}

function call(byHimself: boolean) {
  if (between.value || finished.value) return
  const v = byHimself ? 'late' : enoughVerdict(heap.length, current.value.need, current.value.over)
  if (v === 'early') {
    misses.value++
    play('wrong')
    message.value = t.value.early
    crossAt.value = true
    later(() => {
      crossAt.value = false
    }, 900)
    return
  }
  between.value = true
  calling.value = true
  if (v === 'late') {
    misses.value++
    play('wrong')
    message.value = t.value.late
  } else {
    play('right')
    message.value = t.value.ok
  }
  progress.mark()
  walkers.length = 0
  later(() => {
    if (round.value >= props.game.rounds.length - 1) {
      play('star')
      finished.value = true
      return
    }
    round.value++
    startRound()
  }, 1900)
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
    div(
      class="ge-mark"
      aria-hidden="true"
      :style="{ left: `${game.heap.x - game.heap.w / 2}%`, width: `${game.heap.w}%`, top: `${markY}%` }"
    )
    img(
      v-for="(g, i) in heap"
      :key="`g${round}-${i}`"
      class="ge-gift"
      :src="src(game.gifts.find((x) => x.id === g)?.image ?? '')"
      alt=""
      draggable="false"
      :style="{ left: `${slots[i]?.x}%`, top: `${slots[i]?.y}%`, width: `${gw}%` }"
    )
    img(
      v-for="w in walkers"
      :key="`w${w.key}`"
      class="ge-walker"
      :class="{ going: w.going }"
      :src="src(game.walkers.find((x) => x.id === w.kind)?.image ?? '')"
      alt=""
      draggable="false"
      :style="{ left: w.going ? `${game.path.toX}%` : '-14%', top: `${game.path.y}%`, width: `${game.walkers.find((x) => x.id === w.kind)?.w ?? 14}%` }"
    )
    button(
      type="button"
      class="ge-mose"
      :class="{ calling }"
      :style="{ left: `${game.mose.x}%`, top: `${game.mose.y}%`, width: `${game.mose.w}%` }"
      :aria-label="t.moses"
      :disabled="between"
      @click="call(false)"
    )
      img(:src="src(game.mose.image)" alt="" draggable="false")
      span(v-if="crossAt" class="ge-cross" aria-hidden="true")
        GameMark(kind="bad")
</template>

<style scoped lang="sass">
.ge-mark
  position: absolute
  height: 0
  border-top: 4px dashed rgba(255, 246, 220, 0.95)
  filter: drop-shadow(0 0 3px rgba(60, 40, 10, 0.8))
  pointer-events: none
  z-index: 1

.ge-gift
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 2
  filter: drop-shadow(0 3px 2px rgba(40, 25, 5, 0.35))
  animation: ge-drop 260ms ease-out

.ge-walker
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  z-index: 3
  transition: left 1500ms linear

.ge-mose
  position: absolute
  display: block
  min-width: 70px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 5
  touch-action: manipulation
  -webkit-tap-highlight-color: transparent
  filter: drop-shadow(0 4px 3px rgba(40, 25, 5, 0.4))

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none

  &.calling
    animation: ge-call 600ms ease-in-out

  &:focus-visible
    outline: 3px solid #fff6dc
    border-radius: 12px

.ge-cross
  position: absolute
  left: 50%
  top: 10%
  margin-left: -15px
  pointer-events: none

@keyframes ge-drop
  from
    opacity: 0
    translate: 0 -30px
  to
    opacity: 1
    translate: 0 0

@keyframes ge-call
  0%, 100%
    scale: 1
  50%
    scale: 1.08

@media (prefers-reduced-motion: reduce)
  .ge-gift, .ge-mose.calling
    animation: none

  .ge-walker
    transition: none
</style>
