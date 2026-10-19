<script setup lang="ts">
/**
 * The puzzle: one painted picture is cut into pieces that lie shuffled below an empty frame. A piece is dragged to its place (or
 * tapped, then its place is tapped). A wrong place lets the piece spring back and counts as a mistake.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useTimers from '@/use/useTimers'
import GameDone from '@/components/molecules/games/GameDone.vue'
import { useDragDrop } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { PuzzleGame } from '@/types/adventure'

const props = defineProps<{ game: PuzzleGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

const total = computed(() => props.game.cols * props.game.rows)
progress.setGoal(total.value)
const src = computed(() => prependBaseUrl(props.game.image))

/** The same shuffle every time (a small deterministic one), never in the right order. */
const order = computed(() => {
  const list = Array.from({ length: total.value }, (_, i) => i)
  let seed = total.value * 7919 + 13
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  if (list.every((v, i) => v === i)) list.reverse()
  return list
})

const placed = reactive<boolean[]>(Array.from({ length: total.value }, () => false))
const mistakes = ref(0)
const wobble = ref<number | null>(null)
/** The place that flashes green (right piece) or red (wrong place) for a moment. */
const flash = ref<{ slot: number; kind: 'good' | 'bad' } | null>(null)

function flashSlot(slot: number, kind: 'good' | 'bad') {
  flash.value = { slot, kind }
  later(() => {
    if (flash.value?.slot === slot) flash.value = null
  }, 800)
}
const finished = computed(() => placed.every(Boolean))
const stars = computed(() => mistakeStars(mistakes.value))
const trayLeft = computed(() => order.value.filter((p) => !placed[p]))

const pieceStyle = (p: number) => {
  const { cols, rows } = props.game
  const c = p % cols
  const r = Math.floor(p / cols)
  return {
    backgroundImage: `url(${src.value})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${cols > 1 ? (c / (cols - 1)) * 100 : 0}% ${rows > 1 ? (r / (rows - 1)) * 100 : 0}%`
  }
}

const { dragging, selected, down, tapPlace, toggleSelect, dragStyle } = useDragDrop((id, target) => {
  const piece = Number(id)
  if (placed[piece]) return
  if (Number(target) === piece) {
    placed[piece] = true
    progress.mark()
    play('snap')
    flashSlot(piece, 'good')
  } else {
    mistakes.value++
    play('wrong')
    flashSlot(Number(target), 'bad')
    wobble.value = piece
    later(() => {
      if (wobble.value === piece) wobble.value = null
    }, 500)
  }
})

const boardStyle = computed(() => ({
  '--cols': String(props.game.cols),
  '--rows': String(props.game.rows),
  // the proportion of one piece: the whole picture is 3 : 4
  '--cell': String((3 * props.game.rows) / (4 * props.game.cols))
}))
</script>

<template lang="pug">
  div(class="pz" :style="boardStyle")
    div(class="pz-board")
      div(
        v-for="p in total"
        :key="p"
        class="pz-slot"
        :class="{ ready: selected !== null && !placed[p - 1], done: placed[p - 1], 'flash-good': flash?.slot === p - 1 && flash.kind === 'good', 'flash-bad': flash?.slot === p - 1 && flash.kind === 'bad' }"
        :data-drop="String(p - 1)"
        :style="placed[p - 1] ? pieceStyle(p - 1) : undefined"
        :role="selected !== null && !placed[p - 1] ? 'button' : undefined"
        :tabindex="selected !== null && !placed[p - 1] ? 0 : undefined"
        @click="tapPlace(String(p - 1))"
        @keydown.enter.space.prevent="tapPlace(String(p - 1))"
      )
    p(v-if="!finished" class="pz-hint") {{ t('app.adventure.puzzleHint') }}
    div(v-if="!finished" class="pz-tray")
      div(
        v-for="p in trayLeft"
        :key="p"
        class="pz-piece"
        :class="{ chosen: selected === String(p), wobble: wobble === p, lifted: dragging === String(p) }"
        :style="{ ...pieceStyle(p), ...dragStyle(String(p)) }"
        role="button"
        tabindex="0"
        :aria-label="t('app.adventure.puzzlePiece', { n: p + 1 })"
        @pointerdown="down($event, String(p))"
        @keydown.enter.space.prevent="toggleSelect(String(p))"
      )
    GameDone(v-else :stars="stars" :text="t('app.adventure.puzzleDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.pz
  --w: 250px
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px

.pz-board
  display: grid
  grid-template-columns: repeat(var(--cols), 1fr)
  grid-template-rows: repeat(var(--rows), 1fr)
  gap: 3px
  width: var(--w)
  aspect-ratio: 3 / 4
  padding: 5px
  border-radius: 14px
  background: rgba(120, 80, 30, 0.35)
  border: 3px solid #b98a2e
  box-shadow: inset 0 3px 10px rgba(60, 35, 5, 0.45), 0 6px 14px -6px rgba(60, 40, 10, 0.5)

.pz-slot
  border-radius: 6px
  background-color: rgba(255, 246, 215, 0.3)
  outline: 2px dashed rgba(255, 240, 190, 0.7)
  outline-offset: -3px

  &.ready
    background-color: rgba(255, 233, 150, 0.55)
    outline-color: #fff3b0

  &.done
    outline: 0
    animation: pz-pop 380ms cubic-bezier(0.2, 1.5, 0.4, 1)

  &.flash-good
    animation: pz-pop 380ms cubic-bezier(0.2, 1.5, 0.4, 1), flash-good 800ms ease-out

  &.flash-bad
    animation: flash-bad 800ms ease-out

.pz-hint
  margin: 0
  font-weight: 700
  color: #5f4f35
  text-align: center

.pz-tray
  display: flex
  flex-wrap: wrap
  justify-content: center
  gap: 10px
  min-height: 96px

.pz-piece
  width: calc(var(--w) / var(--cols) * 0.74)
  aspect-ratio: var(--cell)
  border-radius: 7px
  border: 3px solid #d4a83e
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none
  box-shadow: 0 5px 10px -3px rgba(40, 25, 5, 0.55)
  transition: transform 160ms ease-out

  &.chosen
    transform: translateY(-6px) scale(1.06)
    border-color: #fff3b0
    box-shadow: 0 0 0 3px rgba(255, 230, 120, 0.8), 0 9px 14px -4px rgba(40, 25, 5, 0.6)

  &.wobble
    animation: pz-shake 420ms ease-in-out

  &.lifted
    cursor: grabbing

// right is shown with a green glow, wrong with a red one
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

@keyframes pz-pop
  from
    transform: scale(0.85)

@keyframes pz-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-7px) rotate(-3deg)
  75%
    transform: translateX(7px) rotate(3deg)

@media (prefers-reduced-motion: reduce)
  .pz-slot,
  .pz-slot.done,
  .pz-slot.flash-good,
  .pz-slot.flash-bad,
  .pz-piece,
  .pz-piece.wobble
    animation: none
    transition: none
</style>
