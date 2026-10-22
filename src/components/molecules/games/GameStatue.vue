<script setup lang="ts">
/**
 * The statue: in the dream sky a stone base stands; above it five pale places are drawn one above the other (head, chest and arms, belly and hips, legs, feet). The five discs of the statue wait at the sides, in their
 * real size. The child drags a disc to its place (or taps the disc and then the place); the right one clicks in with a tone, a wrong one is a cross and goes back (a mistake). Round 1: the discs carry small labels
 * with the names of the metals ("gold", "silver", "bronze", "iron", "iron and clay"); round 2: the same five without labels and in another order (from the story and by their looks). At the end the stone rolls (one
 * tap on the stone): it hits the feet, the statue falls softly to dust (the discs tip and fade) and the stone becomes a great mountain. Nothing frightening. Which disc belongs where is `isRightSlot` in `utils/danielGames.ts`.
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { isRightSlot } from '@/utils/danielGames'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { StatueGame } from '@/types/adventure'

const props = defineProps<{ game: StatueGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()
// the whole task: every disc of every round
progress.setGoal(props.game.pieces.length * props.game.rounds.length)

const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const lastRound = computed(() => round.value >= rounds.value.length - 1)
const placed = reactive<Record<number, boolean>>({})
const misses = ref(0)
const selected = ref<number | null>(null)
const dragging = ref<{ i: number; x: number; y: number } | null>(null)
const bad = ref<{ slot: number; k: number } | null>(null)
let badKey = 0
const between = ref(false)
/** After the last round: the stone waits for a tap, then it rolls, then the statue falls and the mountain grows. */
const phase = ref<'build' | 'stone' | 'roll' | 'fall' | 'mountain'>('build')
const finished = ref(false)
const message = ref('')
const field = ref<HTMLElement | null>(null)
const src = (p: string) => prependBaseUrl(p)
const stars = computed(() => mistakeStars(misses.value, 2, 6))
const count = computed(() => Object.keys(placed).length)

/** The waiting place of a piece in this round (percent of the picture). */
function homeOf(i: number) {
  return current.value.homes[i]!
}
function pos(i: number) {
  if (dragging.value?.i === i) return { x: dragging.value.x, y: dragging.value.y }
  if (placed[i]) return props.game.pieces[i]!.at
  return homeOf(i)
}
/** A disc has its real size when it stands in the statue and is bigger while it waits (a finger needs more than a head). */
const pieceStyle = (i: number) => {
  const p = pos(i)
  const piece = props.game.pieces[i]!
  return { left: `${p.x}%`, top: `${p.y}%`, width: `${piece.w * (placed[i] ? 1 : piece.wait)}%` }
}
/** The shape of a disc (width to height) for the stand-in of a picture that is not there. */
const ratioOf = (i: number) => (props.game.pieces[i]!.w / props.game.slots[i]!.h) * 1.33
const slotStyle = (i: number) => {
  const s = props.game.slots[i]!
  return { left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%` }
}

function toPct(e: { clientX: number; clientY: number }) {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}
/** The place nearest to a point (percent), within a generous reach (the statue is slim, a finger is not): -1 when the point is far from the statue. */
function slotAt(p: { x: number; y: number }): number {
  let best = -1
  let bestD = 18
  props.game.slots.forEach((s, i) => {
    const d = Math.hypot(p.x - s.x, (p.y - s.y) * 0.75)
    if (d <= bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

function tryPlace(piece: number, slot: number) {
  if (phase.value !== 'build' || between.value || placed[piece]) return
  if (isRightSlot(piece, slot)) {
    placed[piece] = true
    selected.value = null
    progress.mark()
    play('basket')
    message.value = ''
    if (count.value >= props.game.pieces.length) roundOver()
  } else {
    misses.value++
    selected.value = null
    play('wrong')
    message.value = t('app.adventure.statueWrong')
    const k = ++badKey
    bad.value = { slot, k }
    later(() => {
      if (bad.value?.k === k) bad.value = null
    }, 800)
  }
}

function roundOver() {
  play('star')
  message.value = t('app.adventure.statueRight')
  if (lastRound.value) {
    between.value = true
    later(() => {
      phase.value = 'stone'
      between.value = false
      message.value = t('app.adventure.statueStone')
    }, 1400)
    return
  }
  between.value = true
  later(() => {
    round.value++
    for (const k of Object.keys(placed)) delete placed[Number(k)]
    between.value = false
    message.value = ''
  }, 2200)
}

// dragging a disc
let moved = false
let startAt = { x: 0, y: 0 }
let dragIndex = -1
function onMove(e: PointerEvent) {
  const p = toPct(e)
  if (!p || dragIndex < 0) return
  if (Math.hypot(e.clientX - startAt.x, e.clientY - startAt.y) > 6) moved = true
  if (moved) dragging.value = { i: dragIndex, x: p.x, y: p.y }
}
function onUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  const i = dragIndex
  dragIndex = -1
  dragging.value = null
  if (i < 0) return
  const p = toPct(e)
  if (!moved || !p) {
    selected.value = selected.value === i ? null : i
    return
  }
  const slot = slotAt(p)
  if (slot >= 0) tryPlace(i, slot)
}
function startDrag(i: number, e: PointerEvent) {
  if (e.button > 0 || placed[i] || between.value || phase.value !== 'build') return
  e.preventDefault()
  moved = false
  dragIndex = i
  startAt = { x: e.clientX, y: e.clientY }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
})
function key(i: number, e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    selected.value = selected.value === i ? null : i
  }
}
function slotTap(slot: number) {
  if (selected.value !== null) tryPlace(selected.value, slot)
}

function rollStone() {
  if (phase.value !== 'stone') return
  phase.value = 'roll'
  play('basket')
  message.value = ''
  later(() => {
    phase.value = 'fall'
    play('star')
  }, 1100)
  later(() => {
    phase.value = 'mountain'
    message.value = t('app.adventure.statueMountain')
  }, 2500)
  later(() => {
    finished.value = true
  }, 4600)
}
</script>

<template lang="pug">
  div(class="st")
    template(v-if="!finished")
      p(v-if="rounds.length > 1 && phase === 'build'" class="st-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="st-hint") {{ phase === 'build' ? (between ? t('app.adventure.gameNext') : current.hint) : t('app.adventure.statueStoneHint') }}
      div(ref="field" class="st-field" :class="phase" :style="{ backgroundImage: `url(${src(game.background)})` }")
        img(v-if="phase === 'mountain'" :src="src(game.mountain)" alt="" class="st-mountain" draggable="false")
        template(v-else)
          button(
            v-for="(s, i) in game.slots"
            :key="`slot-${i}`"
            type="button"
            class="st-slot"
            :class="{ filled: placed[i], ready: selected !== null && !placed[i] }"
            :style="slotStyle(i)"
            :aria-label="t('app.adventure.statueSlot', { n: i + 1 })"
            :tabindex="placed[i] || phase !== 'build' ? -1 : 0"
            @click="slotTap(i)"
          )
            span(v-if="bad && bad.slot === i" :key="bad.k" class="st-miss" aria-hidden="true")
              GameMark(kind="bad")
          span(
            v-for="(p, i) in game.pieces"
            :key="`piece-${round}-${i}`"
            class="st-piece"
            :class="{ placed: placed[i], sel: selected === i, drag: dragging && dragging.i === i, fall: phase === 'fall' }"
            :style="pieceStyle(i)"
          )
            button(
              type="button"
              class="st-disc"
              :disabled="placed[i] || between || phase !== 'build'"
              :aria-label="p.label"
              @pointerdown="startDrag(i, $event)"
              @keydown="key(i, $event)"
            )
              GameImage(:src="p.image" :ratio="ratioOf(i)" colour="#c9a45c")
            span(v-if="current.labels && !placed[i] && phase === 'build'" class="st-label" aria-hidden="true") {{ p.label }}
          button(
            v-if="phase !== 'build' && phase !== 'mountain'"
            type="button"
            class="st-stone"
            :class="{ roll: phase !== 'stone' }"
            :disabled="phase !== 'stone'"
            :aria-label="t('app.adventure.statueStoneButton')"
            @click="rollStone"
          )
            GameImage(:src="game.stone" colour="#8a8f96" round)
      p(class="st-fb" role="status") {{ message || t('app.adventure.statueCount', { n: count, total: game.pieces.length }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.statueDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.st
  display: flex
  flex-direction: column
  gap: 10px
  padding: 12px 10px 16px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #2b3358
  box-shadow: inset 0 0 18px rgba(0, 0, 30, 0.45)

.st-round
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

.st-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #3f321b
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.92)

.st-field
  position: relative
  width: 100%
  aspect-ratio: 4 / 3
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #1d2347
  background-size: cover
  background-position: center
  touch-action: none

.st-mountain
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover
  animation: st-grow 1800ms ease-out both

// a place of the statue: a pale outline
.st-slot
  position: absolute
  padding: 0
  border: 2px dashed rgba(255, 246, 220, 0.75)
  border-radius: 10px
  background: rgba(255, 246, 220, 0.08)
  transform: translate(-50%, -50%)
  cursor: pointer

  &.ready
    background: rgba(255, 246, 220, 0.22)

  &.filled
    border-color: transparent
    background: transparent
    pointer-events: none

  // the tap area is bigger than the outline (the places are small)
  &::after
    content: ''
    position: absolute
    inset: -8px

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px

.st-miss
  position: absolute
  left: 50%
  top: 50%
  display: block
  margin: -15px 0 0 -15px
  pointer-events: none

.st-piece
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  transition: left 250ms ease, top 250ms ease, transform 900ms ease-in, opacity 900ms ease-in

  &.drag
    transition: none
    z-index: 3

  &.sel .st-disc
    filter: drop-shadow(0 0 8px #fff3b0)

  &.placed
    pointer-events: none

  &.fall
    opacity: 0
    transform: translate(-50%, 30%) rotate(8deg) scale(0.9)

.st-disc
  display: block
  width: 100%
  padding: 0
  border: 0
  background: transparent
  cursor: grab
  touch-action: none
  -webkit-tap-highlight-color: transparent

  &:focus-visible
    outline: 3px solid #fff
    outline-offset: 2px
    border-radius: 8px

.st-label
  position: absolute
  left: 50%
  bottom: -4px
  transform: translate(-50%, 100%)
  padding: 0 8px
  border-radius: 999px
  background: rgba(255, 246, 220, 0.94)
  font-weight: 800
  font-size: 0.8rem
  white-space: nowrap
  color: #3f321b
  pointer-events: none

.st-stone
  position: absolute
  left: 80%
  top: 18%
  width: 12%
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  transform: translate(-50%, -50%)
  transition: left 1000ms ease-in, top 1000ms ease-in, transform 1000ms ease-in
  -webkit-tap-highlight-color: transparent

  &::after
    content: ''
    position: absolute
    inset: -14px

  &.roll
    left: 53%
    top: 80%
    transform: translate(-50%, -50%) rotate(540deg)

.st-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #3f321b
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

@keyframes st-grow
  from
    transform: scale(0.6)
    opacity: 0
  to
    transform: scale(1)
    opacity: 1

@media (prefers-reduced-motion: reduce)
  .st-piece,
  .st-stone
    transition: none

  .st-mountain
    animation: none
</style>
