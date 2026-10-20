<script setup lang="ts">
/**
 * Put in order: picture cards of a story lie mixed in a tray, and the child lays them in the order of the story. A card is dragged to a
 * place (or the card is tapped and then the place). A card stays only on its right place; a wrong place gives a red cross and the card
 * slides back (a mistake). In the first round the places carry dots (one, two, three ...) so that it is clear where the cards go, in the
 * second round the places are empty and the child remembers the story. After two wrong tries with a card its right place glows softly.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { OrderGame } from '@/types/adventure'

const props = defineProps<{ game: OrderGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every card of every round
progress.setGoal(props.game.rounds.reduce((sum, r) => sum + r.cards.length, 0))

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)

/** The card of this round that belongs on place `i` (the places are numbered from the left). */
const rightCard = (i: number): string | undefined => current.value.cards[i]
const cardOf = (id: string) => props.game.cards.find((c) => c.id === id)
const src = (id: string) => prependBaseUrl(cardOf(id)?.image ?? '')
const labelOf = (id: string) => cardOf(id)?.label ?? ''

/** Which card lies on which place (by the number of the place). */
const placed = reactive<Record<number, string>>({})
const mistakes = ref(0)
/** How often a card was put on a wrong place in this round (after two the right place glows). */
const missed = reactive<Record<string, number>>({})
const between = ref(false)
const finished = ref(false)
const message = ref('')
const wobble = ref<string | null>(null)
const flash = ref<{ slot: number; kind: 'good' | 'bad' } | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))

/** The cards of the round in a mixed order that is never the right one (a small fixed shuffle, so that the same card is not always first). */
const tray = computed(() => {
  const ids = [...current.value.cards]
  let seed = ids.length * 4259 + 31 + round.value * 17
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
  }
  if (ids.length > 1 && ids.every((v, i) => v === current.value.cards[i])) ids.reverse()
  return ids
})
const isPlaced = (id: string) => Object.values(placed).includes(id)
const left = computed(() => tray.value.filter((id) => !isPlaced(id)))
/** The place that glows: the right one for a card that was put wrong twice. */
const glowing = (slot: number) => {
  const id = rightCard(slot)
  return !!id && !placed[slot] && (missed[id] ?? 0) >= 2
}

function flashSlot(slot: number, kind: 'good' | 'bad') {
  flash.value = { slot, kind }
  later(() => {
    if (flash.value?.slot === slot) flash.value = null
  }, 900)
}

function roundOver() {
  if (lastRound.value) {
    later(() => {
      finished.value = true
      play('star')
    }, 500)
    return
  }
  between.value = true
  message.value = ''
  later(() => {
    between.value = false
    round.value++
    for (const k of Object.keys(placed)) delete placed[Number(k)]
    for (const k of Object.keys(missed)) delete missed[k]
    message.value = ''
  }, 1400)
}

function drop(cardId: string, target: string) {
  if (between.value || finished.value || isPlaced(cardId)) return
  const slot = Number(target.replace('slot-', ''))
  if (!Number.isInteger(slot) || slot < 0 || slot >= current.value.cards.length) return
  if (placed[slot]) {
    // the place is taken: nothing happens (a card never pushes another one away)
    return
  }
  if (rightCard(slot) === cardId) {
    placed[slot] = cardId
    progress.mark()
    play('snap')
    flashSlot(slot, 'good')
    message.value = t('app.adventure.fbRight')
    if (current.value.cards.every((_, i) => placed[i])) roundOver()
    return
  }
  mistakes.value++
  missed[cardId] = (missed[cardId] ?? 0) + 1
  play('wrong')
  flashSlot(slot, 'bad')
  message.value = t('app.adventure.orderWrong')
  wobble.value = cardId
  later(() => {
    if (wobble.value === cardId) wobble.value = null
  }, 450)
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => drop(id, target))
</script>

<template lang="pug">
  div(class="od")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="od-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="od-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(class="od-slots")
        div(
          v-for="(_, i) in current.cards"
          :key="`${round}-${i}`"
          class="od-slot"
          :class="{ filled: !!placed[i], ready: selected !== null && !placed[i], glow: glowing(i), 'flash-good': flash?.slot === i && flash.kind === 'good', 'flash-bad': flash?.slot === i && flash.kind === 'bad' }"
          :data-drop="`slot-${i}`"
          role="button"
          tabindex="0"
          :aria-label="placed[i] ? t('app.adventure.orderSlotFilled', { n: i + 1, name: labelOf(placed[i]) }) : t('app.adventure.orderSlot', { n: i + 1 })"
          @click="tapPlace(`slot-${i}`)"
          @keydown.enter.space.prevent="tapPlace(`slot-${i}`)"
        )
          img(v-if="placed[i]" :src="src(placed[i])" alt="" draggable="false" class="od-card-img")
          span(v-else-if="current.numbered" class="od-dots" aria-hidden="true")
            span(v-for="d in i + 1" :key="d" class="od-dot")
          GameMark(v-if="flash?.slot === i" :kind="flash.kind" class="od-mark")
      p(class="od-fb" role="status") {{ message }}
      div(class="od-tray")
        div(
          v-for="id in left"
          :key="id"
          class="od-card"
          :class="{ chosen: selected === id, wobble: wobble === id, lifted: dragging === id }"
          :style="dragStyle(id)"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.orderCard', { name: labelOf(id) })"
          @pointerdown="down($event, id)"
          @keydown.enter.space.prevent="toggleSelect(id)"
        )
          img(:src="src(id)" alt="" draggable="false")
    GameDone(v-else :stars="stars" :text="t('app.adventure.orderDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.od
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: linear-gradient(180deg, #f5ead2 0%, #ead7b0 100%)
  box-shadow: inset 0 0 18px rgba(80, 50, 10, 0.25)

.od-round
  margin: 0
  align-self: center
  padding: 1px 12px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.88)
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #5f4f35

.od-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.88)

.od-slots
  display: grid
  grid-auto-flow: column
  // minmax(0, 1fr): the boxes share the width and never push past the frame (the min-height below would widen them through the aspect ratio)
  grid-auto-columns: minmax(0, 1fr)
  gap: 6px

.od-slot
  position: relative
  display: flex
  align-items: center
  justify-content: center
  aspect-ratio: 4 / 3
  min-width: 0
  border-radius: 10px
  border: 2px dashed rgba(150, 100, 30, 0.8)
  background: rgba(255, 246, 220, 0.6)
  cursor: pointer

  &.filled
    border-style: solid
    background: #fff

  &.ready
    animation: od-ready 900ms ease-in-out infinite

  &.glow
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95), 0 0 16px 4px rgba(255, 214, 90, 0.7)

  &.flash-good
    animation: flash-good 900ms ease-out

  &.flash-bad
    animation: flash-bad 900ms ease-out

.od-card-img
  display: block
  width: 100%
  height: 100%
  object-fit: cover
  border-radius: 8px
  pointer-events: none

.od-dots
  display: inline-flex
  flex-wrap: wrap
  justify-content: center
  gap: 3px
  max-width: 80%

.od-dot
  width: 10px
  height: 10px
  border-radius: 50%
  background: #8a6a2a

.od-mark
  position: absolute
  top: -8px
  right: -6px

.od-fb
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

.od-tray
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  padding: 8px
  border-radius: 14px
  background: rgba(95, 65, 25, 0.22)

.od-card
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  border-radius: 12px
  overflow: hidden
  border: 3px solid #fff
  box-shadow: 0 5px 10px rgba(60, 40, 10, 0.45)
  transition: transform 160ms ease-out

  img
    display: block
    width: 100%
    aspect-ratio: 4 / 3
    object-fit: cover
    pointer-events: none

  &.chosen
    transform: translateY(-4px) scale(1.04)
    box-shadow: 0 0 0 3px rgba(255, 214, 90, 0.95), 0 8px 14px rgba(60, 40, 10, 0.45)

  &.wobble
    animation: od-shake 420ms ease-in-out

  &.lifted
    cursor: grabbing

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

@keyframes od-ready
  0%, 100%
    transform: scale(1)
  50%
    transform: scale(1.04)

@keyframes od-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-7px) rotate(-3deg)
  75%
    transform: translateX(7px) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .od-slot.ready,
  .od-card.wobble
    animation: none
</style>
