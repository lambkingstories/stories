<script setup lang="ts">
/**
 * The sharing game: baskets from the barn are brought to Noah's family and to groups of animals until everybody has enough. A basket
 * is dragged to a receiver (or tapped, then the receiver is tapped). Round 1: the place marks say how many baskets each one gets.
 * Round 2: the food in the basket decides who gets it. Round 3: the child shares freely and taps "Done"; nobody may be left with nothing.
 * Nothing can be lost: a wrong basket springs back and counts as a mistake.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { ShareGame } from '@/types/adventure'

const props = defineProps<{ game: ShareGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

interface Basket {
  id: number
  kind: string
}

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
// the whole task: every basket that somebody needs, in every round
progress.setGoal(
  rounds.value.reduce((sum, r) => sum + r.baskets.filter((k) => !props.game.baskets.find((b) => b.id === k)?.nobody).length, 0)
)

/** The baskets of this round: the tray, in the order of the data. */
/** Who is there in this round: the family and the animals of the round. */
const present = computed(() => {
  const ids = current.value.receivers
  return ids ? props.game.receivers.filter((r) => ids.includes(r.id)) : props.game.receivers
})

const baskets = computed<Basket[]>(() => current.value.baskets.map((kind, i) => ({ id: round.value * 100 + i, kind })))
const used = reactive<Record<number, boolean>>({})
/** What each receiver has got in this round: the kinds of its baskets. */
const placed = reactive<Record<string, string[]>>({})
const mistakes = ref(0)
const finishTries = ref(0)
const between = ref(false)
const wobble = ref<number | null>(null)
const wobbleEmpty = ref<string[]>([])
/** The receiver that shows the green tick (right) or the red cross (wrong) for a moment. */
const flash = ref<{ receiver: string; kind: 'good' | 'bad' } | null>(null)
const message = ref('')

const left = computed(() => baskets.value.filter((b) => !used[b.id]))
const isNobody = (kind: string): boolean => !!props.game.baskets.find((b) => b.id === kind)?.nobody
/** What the round still waits for: the distractors can stay in the tray. */
const needed = computed(() => left.value.filter((b) => !isNobody(b.kind)))
const placedOf = (id: string): string[] => placed[id] ?? []
const marksOf = (id: string): number => current.value.marks?.[id] ?? 0
const hasMarks = computed(() => !!current.value.marks)
const finished = ref(false)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

const basketImage = (kind: string) => prependBaseUrl(props.game.baskets.find((b) => b.id === kind)?.image ?? '')
const basketLabel = (kind: string) => props.game.baskets.find((b) => b.id === kind)?.label ?? ''

/** The slots under a receiver: the place marks (empty baskets) with the baskets that already lie on them. */
function slotsOf(id: string): (string | null)[] {
  const have = placedOf(id)
  const n = hasMarks.value ? Math.max(marksOf(id), have.length) : have.length
  const list: (string | null)[] = []
  for (let i = 0; i < n; i++) list.push(have[i] ?? null)
  // no empty target baskets: the child finds out by himself who needs what
  return list
}

function flashReceiver(receiver: string, kind: 'good' | 'bad') {
  flash.value = { receiver, kind }
  later(() => {
    if (flash.value?.receiver === receiver) flash.value = null
  }, 900)
}

function endRound() {
  if (lastRound.value) {
    finished.value = true
    play('star')
    return
  }
  between.value = true
  message.value = ''
  later(nextRound, 1400)
}

function nextRound() {
  between.value = false
  round.value++
  for (const k of Object.keys(placed)) delete placed[k]
  finishTries.value = 0
  message.value = ''
}

function drop(basketId: number, receiverId: number | string) {
  const b = baskets.value.find((x) => x.id === basketId)
  const r = props.game.receivers.find((x) => x.id === receiverId)
  if (!b || !r || used[b.id]) return
  const rd = current.value
  let reason: 'full' | 'food' | null = null
  if (rd.marks && placedOf(r.id).length >= marksOf(r.id)) reason = 'full'
  else if (r.single && placedOf(r.id).length >= 1 && !isNobody(b.kind) && r.accepts.includes(b.kind)) reason = 'full'
  else if (rd.checkContent && !r.accepts.includes(b.kind)) reason = 'food'
  if (reason) {
    mistakes.value++
    play('wrong')
    flashReceiver(r.id, 'bad')
    message.value = reason === 'full' ? t('app.adventure.shareFull') : isNobody(b.kind) ? t('app.adventure.shareNobody') : (r.rejects?.[b.kind] ?? r.rejects?.['*'] ?? t('app.adventure.shareWrongFood'))
    wobble.value = b.id
    later(() => {
      if (wobble.value === b.id) wobble.value = null
    }, 450)
    return
  }
  used[b.id] = true
  const list = placed[r.id] ?? []
  list.push(b.kind)
  placed[r.id] = list
  progress.mark()
  play('right')
  flashReceiver(r.id, 'good')
  message.value = t('app.adventure.fbRight')
  if (needed.value.length === 0 && !rd.free) endRoundSoon()
}

/** The last basket has landed: a short moment to see the tick before the round ends. */
function endRoundSoon() {
  later(() => {
    if (!between.value && !finished.value) endRound()
  }, 600)
}

/** Round 3: "Done". Somebody is empty: his place wiggles (the first time it is only a hint, afterwards a mistake). */
function finish() {
  const empty = present.value.filter((r) => placedOf(r.id).length === 0).map((r) => r.id)
  if (empty.length === 0) {
    endRound()
    return
  }
  finishTries.value++
  message.value = t('app.adventure.shareEmpty')
  if (finishTries.value > 1) {
    mistakes.value++
    play('wrong')
  } else {
    play('tap')
  }
  wobbleEmpty.value = empty
  later(() => (wobbleEmpty.value = []), 900)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => drop(Number(id), target))
</script>

<template lang="pug">
  div(class="sh" :style="{ backgroundImage: `url(${prependBaseUrl(game.scene)})` }")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="sh-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="sh-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="sh-receivers")
        div(
          v-for="(r, i) in present"
          :key="r.id"
          class="sh-card"
          :class="{ family: i === 0, ready: selected !== null, wobble: wobbleEmpty.includes(r.id), 'flash-good': flash?.receiver === r.id && flash.kind === 'good', 'flash-bad': flash?.receiver === r.id && flash.kind === 'bad' }"
          :data-drop="r.id"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.shareReceiver', { name: r.label, n: placedOf(r.id).length })"
          @click="tapPlace(r.id)"
          @keydown.enter.space.prevent="tapPlace(r.id)"
        )
          img(:src="prependBaseUrl(r.image)" alt="" draggable="false" class="sh-pic")
          div(class="sh-slots")
            span(v-for="(kind, k) in slotsOf(r.id)" :key="k" class="sh-slot" :class="{ filled: kind !== null }")
              img(v-if="kind !== null" :src="basketImage(kind)" alt="" draggable="false")
              img(v-else :src="prependBaseUrl(game.empty)" alt="" draggable="false" class="ghost")
          GameMark(v-if="flash?.receiver === r.id" :kind="flash.kind" class="sh-mark")
      p(class="sh-fb" role="status") {{ message }}
      div(class="sh-tray")
        div(
          v-for="b in left"
          :key="b.id"
          class="sh-basket"
          :class="{ chosen: selected === String(b.id), wobble: wobble === b.id, lifted: dragging === String(b.id) }"
          :style="dragStyle(String(b.id))"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.shareBasket', { name: basketLabel(b.kind) })"
          @pointerdown="down($event, String(b.id))"
          @keydown.enter.space.prevent="toggleSelect(String(b.id))"
        )
          img(:src="basketImage(b.kind)" alt="" draggable="false")
      div(v-if="current.free && !between" class="sh-finish")
        p(class="sh-finish-hint") {{ t('app.adventure.shareFinishHint') }}
        AdvButton(tone="gold" @click="finish") {{ t('app.adventure.shareFinish') }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.shareDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.sh
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background-color: #e8c98a
  background-size: cover
  background-position: center
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.4)

.sh-round
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.88)

.sh-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.88)

.sh-receivers
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 8px

.sh-card
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  justify-content: flex-end
  gap: 4px
  min-height: 112px
  padding: 8px 4px 6px
  border-radius: 14px
  background: rgba(214, 170, 96, 0.82)
  border: 2px solid rgba(150, 100, 30, 0.8)
  cursor: pointer
  transition: transform 160ms ease-out

  &.family
    grid-column: 1 / -1
    min-height: 140px

  &.ready
    animation: sh-ready 900ms ease-in-out infinite

  &.wobble
    animation: sh-shake 460ms ease-in-out 2

  &.flash-good
    animation: flash-good 900ms ease-out

  &.flash-bad
    animation: flash-bad 900ms ease-out

.sh-pic
  display: block
  width: auto
  max-width: 90%
  max-height: 84px
  pointer-events: none
  filter: drop-shadow(0 3px 3px rgba(60, 40, 10, 0.55))

.family .sh-pic
  max-height: 104px

.sh-slots
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 4px
  min-height: 34px

.sh-slot
  display: inline-flex
  align-items: center
  justify-content: center
  width: 40px
  height: 34px

  img
    display: block
    max-width: 100%
    max-height: 100%
    pointer-events: none

  .ghost
    opacity: 0.4
    filter: grayscale(1)

.sh-mark
  position: absolute
  top: -8px
  right: -6px

.sh-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  // a solid pill: the words must be readable over the picture of the barn
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

.sh-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 8px
  min-height: 70px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.35)

.sh-basket
  width: 22%
  min-width: 56px
  max-width: 84px
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  transition: transform 160ms ease-out

  img
    display: block
    width: 100%
    height: auto
    pointer-events: none
    filter: drop-shadow(0 5px 5px rgba(60, 40, 10, 0.5))

  &.chosen
    transform: translateY(-6px) scale(1.08)
    filter: drop-shadow(0 0 8px rgba(255, 230, 120, 0.95))

  &.wobble
    animation: sh-shake 420ms ease-in-out

  &.lifted
    cursor: grabbing

.sh-finish
  display: flex
  flex-direction: column
  align-items: center
  gap: 6px

.sh-finish-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #3f321b
  padding: 2px 10px
  border-radius: 10px
  background: rgba(255, 246, 220, 0.88)

// right is shown with a green glow, wrong with a red one (and always with a tick or a cross)
@keyframes flash-bad
  0%, 45%
    box-shadow: 0 0 0 4px rgba(214, 48, 49, 0.95), 0 0 22px 6px rgba(214, 48, 49, 0.75)
  100%
    box-shadow: 0 0 0 0 rgba(214, 48, 49, 0), 0 0 0 0 rgba(214, 48, 49, 0)

@keyframes flash-good
  0%, 45%
    box-shadow: 0 0 0 4px rgba(47, 174, 84, 0.95), 0 0 22px 6px rgba(47, 174, 84, 0.75)
  100%
    box-shadow: 0 0 0 0 rgba(47, 174, 84, 0), 0 0 0 0 rgba(47, 174, 84, 0)

@keyframes sh-ready
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.03)

@keyframes sh-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-7px) rotate(-3deg)
  75%
    transform: translateX(7px) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .sh-card.ready,
  .sh-card.wobble,
  .sh-basket.wobble
    animation: none
</style>
