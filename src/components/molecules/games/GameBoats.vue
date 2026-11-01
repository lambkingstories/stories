<script setup lang="ts">
/**
 * Fill both boats (Luke 5,6-7): Simon's net is so full that it begins to break; his partners come in the other boat, and together they fill both boats so full that they almost sink. A heap of fish hangs above the lake;
 * two boats lie on the water, each with as many empty places for fish as it can hold (dashed rings). A tap on a boat sends one fish from the heap into the next free place, and the boat sinks a little deeper. Both boats are
 * done when every place is filled. A tap on a boat that is already full is a mistake (the boat rocks, a cross, a word); the fish stays in the heap. The arithmetic is in `utils/freundeGames.ts`.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { boatSink, boatSlots, boatStep, boatsFull } from '@/utils/freundeGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BoatsGame } from '@/types/adventure'

const props = defineProps<{ game: BoatsGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every fish of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.capacity.reduce((a, b) => a + b, 0), 0))

/** How deep a full boat lies in the water (percent of the picture height). */
const MAX_SINK = 2.4
const FLY_MS = 520

interface Landed {
  kind: string
  /** false while the fish is still at the heap and flies in. */
  landed: boolean
}

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const fishIn = reactive<Landed[][]>(props.game.boats.map(() => []))
const wobble = ref<number | null>(null)
const crossAt = ref<number | null>(null)
const misses = ref(0)
const between = ref(false)
const finished = ref(false)
const message = ref('')
const given = ref(0)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 5))
const doneCount = computed(() => progress.parts.value)
const total = computed(() => progress.goal.value)
const capacityOf = (i: number) => current.value.capacity[i] ?? 0
const countOf = (i: number) => fishIn[i]?.length ?? 0
const fishOf = (id: string) => props.game.fish.find((f) => f.id === id)
/** The height of a boat in percent of the picture (the picture is 4:3). */
const heightOf = (i: number) => {
  const b = props.game.boats[i]!
  return (b.w / b.ratio) * (4 / 3)
}
const slotsOf = (i: number) => boatSlots(capacityOf(i), props.game.boats[i]!.deck)
/** The heap's middle in percent of the boat's picture (where a fish starts to fly). */
function heapInBoat(i: number) {
  const b = props.game.boats[i]!
  const h = heightOf(i)
  const p = props.game.pileAt
  return { x: ((p.x - (b.x - b.w / 2)) / b.w) * 100, y: ((p.y - 5 - (b.y - h)) / h) * 100 }
}
/** The width of an empty place (a ring as wide as a fish) in percent of the boat. */
const slotWidth = (boatWidth: number) => ((props.game.fish[0]?.w ?? 8) / boatWidth) * 100
const sinkOf = (i: number) => boatSink(countOf(i), capacityOf(i), MAX_SINK)

function place(i: number, k: number) {
  const f = fishIn[i]![k]
  const slot = slotsOf(i)[k]
  if (!f || !slot) return { left: '50%', top: '50%' }
  if (!f.landed) {
    const h = heapInBoat(i)
    return { left: `${h.x}%`, top: `${h.y}%` }
  }
  return { left: `${slot.x}%`, top: `${slot.y}%` }
}

function tap(i: number) {
  if (between.value || finished.value) return
  if (boatStep(countOf(i), capacityOf(i)) === 'full') {
    misses.value++
    play('wrong')
    message.value = t('app.adventure.boatsFull')
    wobble.value = i
    crossAt.value = i
    later(() => {
      if (wobble.value === i) wobble.value = null
      if (crossAt.value === i) crossAt.value = null
    }, 900)
    return
  }
  const kinds = props.game.fish
  const entry = reactive<Landed>({ kind: kinds[given.value % kinds.length]!.id, landed: false })
  given.value++
  fishIn[i]!.push(entry)
  message.value = ''
  progress.mark()
  play('snap')
  later(() => {
    entry.landed = true
  }, 40)
  if (!boatsFull(fishIn.map((f) => f.length), current.value.capacity)) return
  between.value = true
  later(() => {
    message.value = t('app.adventure.boatsBoth')
  }, FLY_MS)
  if (lastRound.value) {
    later(() => {
      play('star')
      finished.value = true
    }, 2400)
    return
  }
  later(() => {
    round.value++
    for (const f of fishIn) f.length = 0
    between.value = false
    message.value = ''
  }, 2600)
}
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        class="gm-field"
        :style="{ backgroundImage: `url(${src(game.background)})` }"
        role="group"
        :aria-label="t('app.adventure.boatsField')"
      )
        img(
          class="gm-heap"
          :src="src(game.pile)"
          alt=""
          draggable="false"
          :style="{ left: `${game.pileAt.x}%`, top: `${game.pileAt.y}%`, width: `${game.pileAt.w}%` }"
        )
        button(
          v-for="(boat, i) in game.boats"
          :key="`${round}-${boat.id}`"
          type="button"
          class="gm-boat"
          :class="{ wobble: wobble === i, full: countOf(i) >= capacityOf(i) }"
          :style="{ left: `${boat.x}%`, top: `${boat.y + sinkOf(i)}%`, width: `${boat.w}%` }"
          :aria-label="t('app.adventure.boatsLabel', { name: boat.label, n: countOf(i), total: capacityOf(i) })"
          :disabled="between"
          @click="tap(i)"
        )
          img(class="gm-boat-img" :src="src(boat.image)" alt="" draggable="false")
          span(
            v-for="(slot, k) in slotsOf(i)"
            :key="`s${k}`"
            class="gm-slot"
            :class="{ filled: k < countOf(i) }"
            :style="{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slotWidth(boat.w)}%` }"
            aria-hidden="true"
          )
          img(
            v-for="(f, k) in fishIn[i]"
            :key="`f${k}`"
            class="gm-fish"
            :class="{ flying: !f.landed }"
            :src="src(fishOf(f.kind)?.image ?? '')"
            alt=""
            draggable="false"
            :style="{ ...place(i, k), width: `${(fishOf(f.kind)?.w ?? 8) / boat.w * 100}%` }"
          )
          span(v-if="crossAt === i" class="gm-cross" aria-hidden="true")
            GameMark(kind="bad")
      p(class="gm-count" aria-live="polite") {{ t('app.adventure.boatsCount', { n: doneCount, total }) }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.boatsDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #e7d9b4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.25)
  user-select: none
  -webkit-user-select: none

.gm-round
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

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.gm-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #6fa7b3
  background-size: cover
  background-position: center

.gm-heap
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -100%)
  pointer-events: none
  filter: drop-shadow(0 4px 4px rgba(40, 25, 5, 0.35))

.gm-boat
  position: absolute
  display: block
  min-width: 88px
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -100%)
  cursor: pointer
  z-index: 3
  transition: top 520ms ease-in-out
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  filter: drop-shadow(0 5px 4px rgba(20, 40, 50, 0.4))

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px
    border-radius: 12px

  &.wobble
    animation: gm-rock 500ms ease-in-out

.gm-boat-img
  display: block
  width: 100%
  height: auto
  pointer-events: none

// an empty place for a fish: a dashed ring that turns solid gold when it is filled
.gm-slot
  position: absolute
  display: block
  aspect-ratio: 1.7 / 1
  transform: translate(-50%, -50%)
  border: 2px dashed rgba(255, 246, 220, 0.95)
  border-radius: 50%
  background: rgba(40, 60, 70, 0.28)
  pointer-events: none

  &.filled
    opacity: 0

.gm-fish
  position: absolute
  display: block
  height: auto
  transform: translate(-50%, -50%)
  pointer-events: none
  transition: left 500ms ease-in, top 500ms cubic-bezier(0.3, 0, 0.7, 1)

.gm-cross
  position: absolute
  left: 50%
  top: 30%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none
  z-index: 5

.gm-count
  margin: 0
  align-self: center
  padding: 2px 14px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  color: #5f4f35

.gm-fb
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

@keyframes gm-rock
  0%, 100%
    rotate: 0deg
  25%
    rotate: -3deg
  75%
    rotate: 3deg

@media (prefers-reduced-motion: reduce)
  .gm-boat, .gm-fish
    transition: none

  .gm-boat.wobble
    animation: none
</style>
