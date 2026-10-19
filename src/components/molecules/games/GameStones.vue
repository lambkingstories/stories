<script setup lang="ts">
/**
 * The building game with stones (the altar of stage 8; `BuildGame` with `ordered` and `rotate`): one painted altar is cut into twelve stones
 * along the outlines (`polygon`) of its pieces. Exactly one stone is on turn, from the bottom stone up to the top one; it lies in the tray
 * turned and is turned by a tap (always a quarter turn clockwise, never anticlockwise, never a mistake; the angle only grows, so the
 * stone never swings back). It is set by dragging it onto the altar or by tapping the place on the
 * altar. Right is the right place with the right turn: the stone snaps in. Wrong springs back, and the stone stays on turn.
 * One round with the outline of the stone on the altar (a round without outline is possible in the data: after two wrong tries at a
 * stone its place glows).
 */
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import { useDragDrop, type DropPoint } from '@/use/useDragDrop'
import { mistakeStars } from '@/utils/adventureScore'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { prependBaseUrl } from '@/utils/function'
import type { BuildGame, BuildPiece } from '@/types/adventure'

const props = defineProps<{ game: BuildGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

/** The place of a stone is hit when the finger is within its box made at least this big (px). */
const MIN_HIT = 56

const pieces = computed(() => props.game.pieces)
const rounds = computed(() => props.game.rounds)
const round = ref(0)
const current = computed(() => rounds.value[Math.min(round.value, rounds.value.length - 1)]!)
const index = ref(0)
const piece = computed<BuildPiece | undefined>(() => pieces.value[index.value])
const placed = computed(() => pieces.value.slice(0, index.value))
const between = ref(false)
const finished = ref(false)
const mistakes = ref(0)
const message = ref('')
const missed = reactive<Record<string, number>>({})
const wobble = ref(false)
const flash = ref<{ x: number; y: number; kind: 'good' | 'bad' } | null>(null)
const boardEl = ref<HTMLElement | null>(null)
const stars = computed(() => mistakeStars(mistakes.value, 2, 5))
const total = computed(() => pieces.value.length)

/** Quarter turns clockwise, counted up for ever: the stone lies right when it is a multiple of 4. Every stone starts turned, never right. */
const turns = ref(0)
const startTurn = (i: number, r: number) => ((i * 5 + r * 3) % 3) + 1
turns.value = startTurn(0, 0)

/** The box around the outline of a piece, in percent of the picture. */
function boxOf(p: BuildPiece) {
  const poly = p.polygon
  if (!poly?.length) return { x: p.x, y: p.y, w: p.w, h: p.h }
  const xs = poly.map((q) => q[0])
  const ys = poly.map((q) => q[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}
const polyPath = (p: BuildPiece, box = { x: 0, y: 0, w: 100, h: 100 }) =>
  `polygon(${(p.polygon ?? []).map((q) => `${(((q[0] - box.x) / box.w) * 100).toFixed(2)}% ${(((q[1] - box.y) / box.h) * 100).toFixed(2)}%`).join(', ')})`

const aspect = computed(() => props.game.aspect)
const picture = computed(() => prependBaseUrl(props.game.image ?? ''))
const maxDim = computed(() => Math.max(...pieces.value.map((p) => Math.max(boxOf(p).w, boxOf(p).h))) + 4)

/** A stone cut out of the picture: the picture, cut to the box of the stone and clipped to its outline. */
function stoneStyle(p: BuildPiece) {
  const b = boxOf(p)
  return {
    width: `${b.w}%`,
    aspectRatio: `${b.w * aspect.value} / ${b.h}`,
    backgroundImage: `url(${picture.value})`,
    backgroundSize: `${(100 / b.w) * 100}% ${(100 / b.h) * 100}%`,
    backgroundPosition: `${b.w >= 100 ? 0 : (b.x / (100 - b.w)) * 100}% ${b.h >= 100 ? 0 : (b.y / (100 - b.h)) * 100}%`,
    clipPath: polyPath(p, b)
  }
}
/** A stone on the altar: the whole picture, clipped to the outline of the stone. */
const placedStyle = (p: BuildPiece) => ({ backgroundImage: `url(${picture.value})`, clipPath: polyPath(p) })
const zoneStyle = (p: BuildPiece) => {
  const b = boxOf(p)
  return { left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }
}
const glowing = computed(() => !current.value.outline && !!piece.value && (missed[piece.value.id] ?? 0) >= 2)

function showFlash(x: number, y: number, kind: 'good' | 'bad') {
  flash.value = { x, y, kind }
  later(() => {
    flash.value = null
  }, 900)
}

function stoneDone() {
  if (index.value < total.value) {
    // the stone is right (a multiple of 4) when it snaps in; the next one starts 1 to 3 quarters further on
    turns.value += startTurn(index.value, round.value)
    return
  }
  if (round.value >= rounds.value.length - 1) {
    finished.value = true
    play('star')
    return
  }
  between.value = true
  message.value = ''
  later(() => {
    between.value = false
    round.value++
    index.value = 0
    for (const k of Object.keys(missed)) delete missed[k]
    turns.value += startTurn(0, round.value)
  }, 1500)
}

/** Is the point (page pixels) on the place of the stone? The box is made big enough for a finger; null when the altar has no size (no screen). */
function pointHits(p: BuildPiece, at: DropPoint): boolean | null {
  const el = boardEl.value
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return null
  const b = boxOf(p)
  const cx = ((b.x + b.w / 2) / 100) * r.width
  const cy = ((b.y + b.h / 2) / 100) * r.height
  return Math.abs(at.x - r.left - cx) <= Math.max((b.w / 100) * r.width, MIN_HIT) / 2 && Math.abs(at.y - r.top - cy) <= Math.max((b.h / 100) * r.height, MIN_HIT) / 2
}

/** The child sets the stone that is on turn: by a point on the screen, or (keyboard) by its place. */
function setStone(target: string, at?: DropPoint) {
  const p = piece.value
  if (!p || between.value || finished.value) return
  const hit = at ? pointHits(p, at) : null
  const inPlace = hit === null ? target === p.id : hit
  const b = boxOf(p)
  const center = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
  if (inPlace && turns.value % 4 === 0) {
    index.value++
    progress.mark()
    play('snap')
    showFlash(center.x, center.y, 'good')
    message.value = t('app.adventure.fbRight')
    stoneDone()
    return
  }
  mistakes.value++
  missed[p.id] = (missed[p.id] ?? 0) + 1
  play('wrong')
  const r = boardEl.value?.getBoundingClientRect()
  const spot = at && r && r.width > 0 ? { x: ((at.x - r.left) / r.width) * 100, y: ((at.y - r.top) / r.height) * 100 } : center
  showFlash(Math.min(100, Math.max(0, spot.x)), Math.min(100, Math.max(0, spot.y)), 'bad')
  message.value = inPlace ? t('app.adventure.stonesTurn') : t('app.adventure.fbWrong')
  wobble.value = true
  later(() => (wobble.value = false), 450)
}

const { dragging, selected, down, toggleSelect, dragStyle } = useDragDrop((_id, target, at) => setStone(target, at))
// a tap on the stone turns it (never a mistake)
watch(selected, (id) => {
  if (id !== null) {
    selected.value = null
    // always one quarter clockwise; the angle grows, so the stone never turns back
    turns.value++
  }
})

function onBoardClick(e: MouseEvent) {
  const el = e.target instanceof Element ? e.target.closest('[data-drop]') : null
  const target = el instanceof HTMLElement ? el.dataset.drop ?? 'board' : 'board'
  const hasPoint = e.clientX !== 0 || e.clientY !== 0
  setStone(target, hasPoint ? { x: e.clientX, y: e.clientY } : undefined)
}
</script>

<template lang="pug">
  div(class="st")
    template(v-if="!finished")
      p(v-if="rounds.length > 1" class="st-round") {{ t('app.adventure.gameRound', { n: round + 1, total: rounds.length }) }}
      p(class="st-hint") {{ between ? t('app.adventure.gameNext') : current.hint }}
      div(
        ref="boardEl"
        class="st-board"
        :style="{ aspectRatio: String(aspect), backgroundImage: game.background ? `url(${prependBaseUrl(game.background)})` : undefined }"
        data-drop="board"
        role="group"
        :aria-label="t('app.adventure.stonesAltar')"
        @click="onBoardClick"
      )
        div(v-if="piece && !between && (current.outline || glowing)" class="st-shadow" :class="{ glow: glowing }" :style="{ clipPath: polyPath(piece) }")
        div(v-for="p in placed" :key="p.id" class="st-placed" :style="placedStyle(p)")
        div(
          v-if="piece && !between"
          class="st-zone"
          :style="zoneStyle(piece)"
          :data-drop="piece.id"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.stonesPlace', { n: index + 1 })"
          @keydown.enter.space.prevent="setStone(piece.id)"
        )
        GameMark(v-if="flash" :kind="flash.kind" class="st-mark" :style="{ left: `${flash.x}%`, top: `${flash.y}%` }")
      p(class="st-fb" role="status") {{ message }}
      div(v-if="piece && !between" class="st-tray" :style="{ paddingTop: `${maxDim}%` }")
        div(
          class="st-grab"
          :class="{ wobble, lifted: dragging === piece.id }"
          :style="dragStyle(piece.id)"
          role="button"
          tabindex="0"
          :aria-label="t('app.adventure.stonesStone', { n: index + 1, total })"
          @pointerdown="down($event, piece.id)"
          @keydown.enter.space.prevent="toggleSelect(piece.id)"
        )
          div(class="st-stone" :style="{ ...stoneStyle(piece), transform: `rotate(${turns * 90}deg)` }")
      p(class="st-count") {{ t('app.adventure.stonesCount', { n: index, total }) }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.stonesDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.st
  display: flex
  flex-direction: column
  gap: 10px

.st-round
  margin: 0
  text-align: center
  font-weight: 800
  font-size: 1rem
  letter-spacing: 0.06em
  text-transform: uppercase
  color: #8a6a1f

.st-hint
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

.st-board
  position: relative
  width: 100%
  border-radius: 14px
  border: 3px solid #d4a83e
  background-color: #d9c79a
  background-size: cover
  background-position: center
  overflow: hidden
  touch-action: manipulation

.st-shadow
  position: absolute
  inset: 0
  background: rgba(40, 80, 160, 0.6)
  pointer-events: none

  &.glow
    background: rgba(47, 174, 84, 0.5)
    animation: st-glow 1200ms ease-in-out infinite

.st-placed
  position: absolute
  inset: 0
  background-size: 100% 100%
  pointer-events: none
  animation: st-pop 380ms cubic-bezier(0.2, 1.5, 0.4, 1)

.st-zone
  position: absolute
  border-radius: 8px

  &:focus-visible
    outline: 3px dashed #fff3b0

.st-mark
  position: absolute
  transform: translate(-50%, -50%)
  z-index: 20

.st-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  color: #5f4f35

.st-tray
  position: relative
  width: 100%
  border-radius: 14px
  background: rgba(95, 65, 25, 0.18)
  border: 2px dashed rgba(185, 138, 46, 0.6)

.st-grab
  position: absolute
  inset: 0
  display: flex
  align-items: center
  justify-content: center
  cursor: grab
  touch-action: none
  user-select: none
  -webkit-user-select: none

  &.lifted
    cursor: grabbing

  &.wobble
    animation: st-shake 420ms ease-in-out

  &:focus-visible
    outline: 3px solid #fff3b0
    border-radius: 12px

.st-stone
  background-repeat: no-repeat
  pointer-events: none
  transition: transform 220ms ease-out

.st-count
  margin: 0
  text-align: center
  font-weight: 700
  color: #5f4f35

@keyframes st-pop
  from
    transform: scale(0.97)
    opacity: 0.4

@keyframes st-glow
  0%, 100%
    opacity: 0.4
  50%
    opacity: 1

@keyframes st-shake
  0%, 100%
    transform: translateX(0)
  25%
    transform: translateX(-7px)
  75%
    transform: translateX(7px)

@media (prefers-reduced-motion: reduce)
  .st-shadow.glow,
  .st-placed,
  .st-grab.wobble
    animation: none
  .st-stone
    transition: none
</style>
