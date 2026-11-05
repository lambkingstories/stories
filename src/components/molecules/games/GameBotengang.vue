<script setup lang="ts">
/**
 * The errand (John 20,18). The lanes of Jerusalem seen from above, a grid of painted tiles: lanes, corners, branchings, flat roofs, wells at the dead ends, the garden gate (start) and the house
 * of the disciples with its open door (goal). Mary stands at the gate. A tap on a lane in a straight line from her (no roof between) sends her there; a swipe (or an arrow key) lets her run
 * along the lane round its corners to the next branching. A dead end with a well is a mistake: a cross and "Here the way ends", she goes one step back. At the house the round is done.
 * Round 1: 5 x 5 with one dead end; round 2: 6 x 7 with three. Whoever does not go on gets the button "Help me" after fifteen seconds: the next stop on a shortest way is marked.
 * The tiles are pictures that the app turns (CSS), nothing is drawn. Nothing is shown by colour alone (tick, cross, words). Stars: `osterStars(mistakes)` in `utils/osternGames.ts`.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import GameImage from '@/components/atoms/GameImage.vue'
import GameMark from '@/components/atoms/GameMark.vue'
import GameDone from '@/components/molecules/games/GameDone.vue'
import useTimers from '@/use/useTimers'
import useSfx from '@/use/useSfx'
import useTaskProgress from '@/use/useTaskProgress'
import { osterStars } from '@/utils/osternGames'
import {
  errandAt,
  errandDirTo,
  errandDistances,
  errandGoal,
  errandLine,
  errandNextStop,
  errandOpen,
  errandPicture,
  errandSame,
  errandSize,
  errandSlide,
  errandStart
} from '@/utils/osternNeuA'
import type { Cell, Dir, ErrandGame } from '@/utils/osternNeuA'

const props = defineProps<{ game: ErrandGame }>()
const emit = defineEmits<{ done: [stars: number] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const { later } = useTimers()
const progress = useTaskProgress()

/** How many steps a map takes from the start to the goal (0 when the data are broken). */
function stepsOf(rows: readonly string[]): number {
  const s = errandStart(rows)
  const g = errandGoal(rows)
  if (!s || !g) return 0
  const d = errandDistances(rows, g)[s.r]?.[s.c] ?? Infinity
  return Number.isFinite(d) ? d : 0
}
// the whole task: every step of the shortest way of every round
progress.setGoal(props.game.rounds.reduce((n, r) => n + stepsOf(r.rows), 0))

const TICK_MS = 250
const IDLE_SECONDS = 15
const SWIPE_PX = 24
const still = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** How long Mary takes for one cell (milliseconds); with less motion she is there at once. */
const STEP_MS = still ? 0 : 220
const BACK_MS = 900

const round = ref(0)
const current = computed(() => props.game.rounds[Math.min(round.value, props.game.rounds.length - 1)]!)
const lastRound = computed(() => round.value >= props.game.rounds.length - 1)
const rows = computed(() => current.value.rows)
const size = computed(() => errandSize(rows.value))
const goal = computed(() => errandGoal(rows.value))
const dist = computed(() => (goal.value ? errandDistances(rows.value, goal.value) : []))
const maria = ref<Cell>({ r: 0, c: 0 })
/** 1 looks to the right, -1 to the left. */
const face = ref<1 | -1>(1)
const walking = ref(false)
const busy = ref(false)
const between = ref(false)
const finished = ref(false)
const arrived = ref(false)
const stuck = ref(false)
const helpCell = ref<Cell | null>(null)
const mistakes = ref(0)
const idle = ref(0)
const message = ref('')
let messageSeq = 0
/** The fewest steps to the goal Mary has reached in this round (for "Go on"). */
let nearest = 0
let credited = 0
let startDist = 0
const field = ref<HTMLElement | null>(null)
const stars = computed(() => osterStars(mistakes.value))

const cells = computed(() => {
  const out: { key: string; r: number; c: number; src: string; turn: number; kind: string }[] = []
  for (let r = 0; r < size.value.rows; r++)
    for (let c = 0; c < size.value.cols; c++) {
      const p = errandPicture(props.game, rows.value, { r, c })
      out.push({ key: `${round.value}-${r}-${c}`, r, c, ...p })
    }
  return out
})

function say(text: string, ms = 2600) {
  const id = ++messageSeq
  message.value = text
  if (ms > 0)
    later(() => {
      if (messageSeq === id) message.value = ''
    }, ms)
}

function startRound() {
  const s = errandStart(rows.value) ?? { r: 0, c: 0 }
  maria.value = { ...s }
  face.value = 1
  walking.value = false
  busy.value = false
  between.value = false
  arrived.value = false
  stuck.value = false
  helpCell.value = null
  idle.value = 0
  startDist = stepsOf(rows.value)
  nearest = startDist
  credited = 0
}
startRound()

function loop() {
  if (!busy.value && !between.value && !finished.value) idle.value += TICK_MS / 1000
  later(loop, TICK_MS)
}
later(loop, TICK_MS)

/** Mary came nearer to the goal: the steps she gained count for "Go on" (once each). */
function credit(p: Cell) {
  const d = dist.value[p.r]?.[p.c] ?? Infinity
  if (!Number.isFinite(d)) return
  nearest = Math.min(nearest, d)
  while (credited < startDist - nearest) {
    progress.mark()
    credited++
  }
}

/** Mary runs along the cells of `path`, one after the other, and then arrives. */
function walk(path: Cell[]) {
  if (!path.length || busy.value || between.value || finished.value) return
  busy.value = true
  idle.value = 0
  helpCell.value = null
  message.value = ''
  play('tap')
  const before = { ...maria.value }
  const stepTo = (p: Cell) => {
    const d = errandDirTo(maria.value, p)
    if (d === 1) face.value = 1
    else if (d === 3) face.value = -1
    maria.value = { ...p }
    credit(p)
  }
  if (STEP_MS === 0) {
    stepTo(path[path.length - 1]!)
    arrive(path, before)
    return
  }
  walking.value = true
  path.forEach((p, k) => later(() => stepTo(p), k * STEP_MS))
  later(() => {
    walking.value = false
    arrive(path, before)
  }, path.length * STEP_MS)
}

function arrive(path: Cell[], before: Cell) {
  const here = maria.value
  const sign = errandAt(rows.value, here)
  if (sign === 'B') {
    mistakes.value++
    stuck.value = true
    play('wrong')
    say(t('app.adventure.errandDead'), 0)
    const back = path.length >= 2 ? path[path.length - 2]! : before
    later(() => {
      stuck.value = false
      const d = errandDirTo(here, back)
      if (d === 1) face.value = 1
      else if (d === 3) face.value = -1
      maria.value = { ...back }
      busy.value = false
      idle.value = 0
      later(() => {
        if (!busy.value) message.value = ''
      }, 1600)
    }, BACK_MS)
    return
  }
  if (sign === 'Z') {
    arrived.value = true
    between.value = true
    busy.value = false
    while (credited < startDist) {
      progress.mark()
      credited++
    }
    play('right')
    say(t('app.adventure.errandArrived'), 0)
    if (lastRound.value) {
      later(() => {
        play('star')
        finished.value = true
      }, 1800)
      return
    }
    later(() => say(t('app.adventure.gameNext'), 0), 1200)
    later(() => {
      round.value++
      startRound()
      message.value = ''
    }, 2600)
    return
  }
  busy.value = false
  idle.value = 0
}

/** A tap on a cell: in a straight line without a roof between Mary walks there, otherwise a word says why not (no mistake). */
function tapCell(p: Cell) {
  if (busy.value || between.value || finished.value) return
  if (errandSame(p, maria.value)) return
  if (!errandOpen(rows.value, p)) {
    say(t('app.adventure.errandRoof'))
    return
  }
  const path = errandLine(rows.value, maria.value, p)
  if (!path) {
    say(t('app.adventure.errandStraight'))
    return
  }
  walk(path)
}

/** A swipe or an arrow key: Mary runs to the next branching. */
function slide(d: Dir) {
  if (busy.value || between.value || finished.value) return
  const path = errandSlide(rows.value, maria.value, d)
  if (!path.length) {
    idle.value = 0
    say(t('app.adventure.errandWall'))
    return
  }
  walk(path)
}

// ---- the finger: a short touch is a tap on a cell, a longer move is a swipe
let downAt: { x: number; y: number } | null = null

function cellAt(x: number, y: number): Cell | null {
  const r = field.value?.getBoundingClientRect()
  if (!r || !r.width || !r.height) return null
  const c = Math.floor(((x - r.left) / r.width) * size.value.cols)
  const row = Math.floor(((y - r.top) / r.height) * size.value.rows)
  if (c < 0 || row < 0 || c >= size.value.cols || row >= size.value.rows) return null
  return { r: row, c }
}
function stopListening() {
  window.removeEventListener('pointerup', up)
  window.removeEventListener('pointercancel', cancel)
}
function cancel() {
  downAt = null
  stopListening()
}
function up(e: PointerEvent) {
  const from = downAt
  downAt = null
  stopListening()
  if (!from) return
  const dx = e.clientX - from.x
  const dy = e.clientY - from.y
  if (Math.hypot(dx, dy) >= SWIPE_PX) {
    slide(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0)
    return
  }
  const p = cellAt(from.x, from.y)
  if (p) tapCell(p)
}
function down(e: PointerEvent) {
  if (e.button > 0 || busy.value || between.value || finished.value) return
  e.preventDefault()
  field.value?.focus({ preventScroll: true })
  idle.value = 0
  downAt = { x: e.clientX, y: e.clientY }
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', cancel)
}
// the unmount: nothing may be left listening
onBeforeUnmount(stopListening)

function onKey(e: KeyboardEvent) {
  const arrows: Record<string, Dir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }
  const d = arrows[e.key]
  if (d !== undefined) {
    e.preventDefault()
    slide(d)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (helpCell.value) tapCell(helpCell.value)
    else say(t('app.adventure.errandKeys'), 3600)
  }
}

/** The button "Help me": the next stop on a shortest way is marked (a tap there, or Enter, sends Mary). */
function helpMe() {
  idle.value = 0
  helpCell.value = errandNextStop(rows.value, maria.value)
  if (helpCell.value) say(t('app.adventure.errandHelpSay'), 4000)
}

// ---- looks
const pct = (n: number, of: number) => `${((n + 0.5) / of) * 100}%`
const mariaStyle = computed(() => ({ left: pct(maria.value.c, size.value.cols), top: pct(maria.value.r, size.value.rows), width: `${(100 / size.value.cols) * 0.92}%` }))
const fieldStyle = computed(() => ({ aspectRatio: `${size.value.cols} / ${size.value.rows}` }))
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${size.value.cols}, 1fr)`, gridTemplateRows: `repeat(${size.value.rows}, 1fr)` }))
const isHelp = (r: number, c: number) => !!helpCell.value && helpCell.value.r === r && helpCell.value.c === c
const mariaLabel = computed(() => t('app.adventure.errandMaria', { r: maria.value.r + 1, c: maria.value.c + 1 }))
</script>

<template lang="pug">
  div(class="gm")
    template(v-if="!finished")
      p(v-if="game.rounds.length > 1" class="gm-round") {{ t('app.adventure.gameRound', { n: round + 1, total: game.rounds.length }) }}
      p(class="gm-hint") {{ current.hint }}
      div(
        ref="field"
        class="gm-field"
        :style="fieldStyle"
        role="group"
        tabindex="0"
        :aria-label="t('app.adventure.errandField')"
        @pointerdown="down"
        @keydown="onKey"
      )
        div(class="gm-grid" :style="gridStyle" aria-hidden="true")
          div(
            v-for="cell in cells"
            :key="cell.key"
            class="gm-cell"
            :class="[cell.kind, { hint: isHelp(cell.r, cell.c) }]"
            :data-cell="`${cell.r}-${cell.c}`"
          )
            span(class="gm-turn" :style="{ transform: `rotate(${cell.turn}deg)` }")
              GameImage(:src="cell.src" :ratio="1" :colour="cell.kind === 'roof' ? '#b98a5a' : '#e4d2a8'" :label="cell.kind")
        div(class="gm-maria" :class="{ walking }" :style="mariaStyle" role="img" :aria-label="mariaLabel")
          span(class="gm-flip" :style="{ transform: `scaleX(${face})` }")
            GameImage(:src="game.walker" :ratio="1" colour="#6d4f7a" label="maria")
          span(v-if="stuck" class="gm-mark")
            GameMark(kind="bad")
          span(v-else-if="arrived" class="gm-mark")
            GameMark(kind="good")
      AdvButton(v-if="idle > IDLE_SECONDS && !busy && !between" tone="gold" @click="helpMe") {{ t('app.adventure.errandHelp') }}
      p(class="gm-fb" role="status") {{ message }}
    GameDone(v-else :stars="stars" :text="t('app.adventure.errandDone')" @next="emit('done', stars)")
</template>

<style scoped lang="sass">
.gm
  display: flex
  flex-direction: column
  gap: 10px
  padding: 8px 4px 12px
  border-radius: 18px
  border: 3px solid #d4a83e
  background: #efe2c4
  box-shadow: inset 0 0 18px rgba(90, 60, 20, 0.22)
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
  color: #5a4630

.gm-hint
  margin: 0
  text-align: center
  font-weight: 700
  font-size: 1rem
  color: #5a4630

.gm-field
  position: relative
  width: 100%
  overflow: hidden
  border-radius: 14px
  border: 3px solid #d4a83e
  background: #c9a877
  touch-action: none
  cursor: pointer

  &:focus-visible
    outline: 3px solid #fff6dc
    outline-offset: 3px

.gm-grid
  position: absolute
  inset: 0
  display: grid

.gm-cell
  position: relative
  overflow: hidden
  pointer-events: none

  &.hint
    outline: 4px dashed #fff6dc
    outline-offset: -4px
    z-index: 2

.gm-turn
  display: block
  width: 100%
  height: 100%

  :deep(.gi), :deep(img), :deep(.gi-stand)
    width: 100%
    height: 100%

  :deep(img)
    object-fit: cover

  :deep(.gi-stand)
    border-radius: 0

.gm-maria
  position: absolute
  display: block
  transform: translate(-50%, -50%)
  pointer-events: none
  z-index: 4
  filter: drop-shadow(0 3px 3px rgba(40, 25, 5, 0.45))
  transition: left 220ms linear, top 220ms linear

  &.walking .gm-flip
    animation: gm-step 220ms ease-in-out infinite alternate

.gm-flip
  display: block

.gm-mark
  position: absolute
  right: -6px
  top: -8px
  display: block
  pointer-events: none
  z-index: 5

.gm-fb
  margin: 0
  min-height: 1.4em
  text-align: center
  font-weight: 800
  font-size: 1rem
  color: #3e2f1c
  align-self: center
  padding: 4px 14px
  border-radius: 12px
  background: rgba(255, 246, 220, 0.94)

  &:empty
    display: none

@keyframes gm-step
  from
    translate: 0 0
  to
    translate: 0 -6%

// less motion: Mary does not glide and does not bob
@media (prefers-reduced-motion: reduce)
  .gm-maria
    transition: none

  .gm-maria.walking .gm-flip
    animation: none
</style>
