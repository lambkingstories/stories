<script setup lang="ts">
/**
 * "Nehemias Mauer": the second big game, a block puzzle (rules in `utils/mauerGame.ts`, this file draws it and takes the finger).
 * Three stones lie at the bottom; the child drags one onto the grid of 8 x 8. A full row or column becomes a finished layer of the wall.
 * Five sections (the gates of Nehemia 3 and the finished wall of Nehemia 6) and free building after the third. No clock, no enemy: when
 * nothing fits, the builders help. The pictures are in `public/images/spiele-gross/mauer/` and are simply missing until they are painted
 * (a flat colour stands in), so the game can be played and measured before they exist.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import useBigGames from '@/use/useBigGames'
import useSfx from '@/use/useSfx'
import useMusic from '@/use/useMusic'
import { prependBaseUrl } from '@/utils/function'
import {
  FREE_AFTER,
  FREE_LEVEL,
  HELPS,
  HINT_AFTER,
  LEVELS,
  SIZE,
  TINTS,
  canPlace,
  extent,
  findHint,
  help,
  idx,
  needsHelp,
  newGame,
  place,
  starsFor,
  type Game,
  type Hint,
  type Piece
} from '@/utils/mauerGame'

const emit = defineEmits<{ leave: [] }>()
const { t, tm, rt } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'mauer'
const BEST_KEY = 'lk-mauer-best-v1'

const pic = (name: string) => prependBaseUrl(`images/spiele-gross/mauer/${name}.webp`)
const rootStyle = computed(() => {
  const s: Record<string, string> = { '--mg-bg': `url(${pic('hintergrund')})` }
  for (let i = 1; i <= TINTS; i++) s[`--mg-stone-${i}`] = `url(${pic(`stein-${i}`)})`
  return s
})

// ── the screens ───────────────────────────────────────────────────────────
type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const level = ref(0)
const paused = ref(false)
const levelNames = computed(() => ((tm('app.bigGames.mauer.levels') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const levelRefs = computed(() => ((tm('app.bigGames.mauer.refs') as unknown as Parameters<typeof rt>[0][]) ?? []).map((m) => rt(m)))
const levelStars = computed(() => progress.levels(ID))
const unlocked = (i: number) => i === 0 || (levelStars.value[i - 1] ?? 0) >= 1
const freeOpen = computed(() => (levelStars.value[FREE_AFTER - 1] ?? 0) >= 1)
const isFree = computed(() => level.value === FREE_LEVEL)
const levelTitle = (i: number) => (i === FREE_LEVEL ? t('app.bigGames.mauer.free') : (levelNames.value[i] ?? String(i + 1)))

function bestFree(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}
const best = ref(bestFree())

// ── the game ──────────────────────────────────────────────────────────────
const g = ref<Game>(newGame(0))
const outcome = reactive({ kind: 'won' as 'won' | 'ended', stars: 0, layers: 0, newBest: false })
const helping = ref(false)
const helpedRows = ref<number[]>([])
const flash = ref<{ rows: number[]; cols: number[]; key: number }>({ rows: [], cols: [], key: 0 })
const hint = ref<Hint | null>(null)
const boardEl = ref<HTMLElement | null>(null)

let timers: number[] = []
function later(fn: () => void, ms: number) {
  const id = window.setTimeout(fn, ms)
  timers.push(id)
}
function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id))
  timers = []
}

function start(i: number) {
  clearTimers()
  level.value = i
  g.value = newGame(i)
  helping.value = false
  helpedRows.value = []
  flash.value = { rows: [], cols: [], key: flash.value.key }
  hint.value = null
  paused.value = false
  drag.active = false
  screen.value = 'play'
  armHint()
}

function toMenu() {
  clearTimers()
  drag.active = false
  screen.value = 'menu'
}

function leave() {
  clearTimers()
  emit('leave')
}

// ── the hint: after a while without a move, a place that fits glows ─────────
function armHint() {
  hint.value = null
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => {
    if (screen.value === 'play' && !paused.value && !drag.active && !helping.value && g.value.phase === 'play') hint.value = findHint(g.value.board, g.value.pieces)
  }, HINT_AFTER * 1000)
}
let hintTimer = 0

// ── dragging a stone ──────────────────────────────────────────────────────
const drag = reactive({ active: false, slot: -1, x: 0, y: 0, row: 0, col: 0, valid: false, over: false })
let cell = 40

const dragPiece = computed<Piece | null>(() => (drag.active ? (g.value.pieces[drag.slot] ?? null) : null))
const dragSize = computed(() => (dragPiece.value ? extent(dragPiece.value.shape) : { rows: 1, cols: 1 }))
/** The stone floats above the finger, so the finger does not cover the place. */
const ghostStyle = computed(() => {
  const { rows, cols } = dragSize.value
  return {
    width: `${cols * cell}px`,
    height: `${rows * cell}px`,
    left: `${drag.x - (cols * cell) / 2}px`,
    top: `${drag.y - rows * cell - cell * 1.3}px`,
    '--mg-gcell': `${cell}px`
  }
})
/** The squares the stone would cover (lit green when it fits, red when it does not). */
const previewCells = computed(() => {
  const p = dragPiece.value
  const out = new Set<number>()
  if (!p || !drag.over) return out
  for (const [dr, dc] of p.shape) {
    const r = drag.row + dr
    const c = drag.col + dc
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) out.add(idx(r, c))
  }
  return out
})
const hintCells = computed(() => {
  const out = new Set<number>()
  const h = hint.value
  const p = h ? g.value.pieces[h.slot] : null
  if (!h || !p) return out
  for (const [dr, dc] of p.shape) out.add(idx(h.row + dr, h.col + dc))
  return out
})

function aim(e: PointerEvent) {
  const rect = boardEl.value?.getBoundingClientRect()
  const p = dragPiece.value
  if (!rect || !p) return
  cell = rect.width / SIZE
  drag.x = e.clientX
  drag.y = e.clientY
  const { rows, cols } = extent(p.shape)
  const left = drag.x - (cols * cell) / 2
  const top = drag.y - rows * cell - cell * 1.3
  drag.col = Math.round((left - rect.left) / cell)
  drag.row = Math.round((top - rect.top) / cell)
  // the stone is "over" the board when its middle is inside of it
  const mx = left + (cols * cell) / 2
  const my = top + (rows * cell) / 2
  drag.over = mx > rect.left - cell && mx < rect.right + cell && my > rect.top - cell && my < rect.bottom + cell
  drag.valid = drag.over && canPlace(g.value.board, p.shape, drag.row, drag.col)
}

function onPieceDown(slot: number, e: PointerEvent) {
  if (screen.value !== 'play' || paused.value || helping.value || g.value.phase !== 'play' || !g.value.pieces[slot]) return
  e.preventDefault()
  const rect = boardEl.value?.getBoundingClientRect()
  if (rect) cell = rect.width / SIZE
  drag.active = true
  drag.slot = slot
  hint.value = null
  aim(e)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
  play('tap')
}

function onMove(e: PointerEvent) {
  if (!drag.active) return
  e.preventDefault()
  aim(e)
}

function stopDrag() {
  drag.active = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onCancel)
}

function onCancel() {
  stopDrag()
  armHint()
}

function onUp(e: PointerEvent) {
  if (!drag.active) return
  aim(e)
  const { slot, row, col, valid, over } = drag
  stopDrag()
  if (valid) doPlace(slot, row, col)
  else {
    if (over) play('clunk')
    armHint()
  }
}

// ── a move ────────────────────────────────────────────────────────────────
function doPlace(slot: number, r: number, c: number) {
  if (!place(g.value, slot, r, c)) return
  play('snap')
  const cl = g.value.cleared
  if (cl.rows.length + cl.cols.length > 0) {
    flash.value = { rows: [...cl.rows], cols: [...cl.cols], key: flash.value.key + 1 }
    play('right')
    later(() => (flash.value = { rows: [], cols: [], key: flash.value.key }), 650)
  }
  afterMove()
}

function afterMove() {
  const game = g.value
  if (game.phase === 'won') return finish('won')
  if (game.phase === 'ended') return finish('ended')
  if (needsHelp(game)) return startHelp()
  armHint()
}

function startHelp() {
  helping.value = true
  hint.value = null
  later(() => {
    help(g.value)
    helpedRows.value = [...g.value.helped]
    play('found')
    later(() => {
      helping.value = false
      helpedRows.value = []
      afterMove()
    }, 1300)
  }, 1100)
}

function finish(kind: 'won' | 'ended') {
  clearTimers()
  const game = g.value
  outcome.kind = kind
  outcome.layers = game.layers
  outcome.stars = starsFor(game)
  outcome.newBest = false
  if (isFree.value) {
    if (game.layers > best.value) {
      best.value = game.layers
      outcome.newBest = game.layers > 0
      try {
        localStorage.setItem(BEST_KEY, String(game.layers))
      } catch {
        // not remembered
      }
    }
    progress.record(ID, FREE_LEVEL, 0)
  } else {
    progress.record(ID, level.value, outcome.stars)
  }
  later(() => {
    screen.value = 'result'
    play(kind === 'won' ? 'result' : 'tap')
  }, 800)
}

// ── what the page shows ───────────────────────────────────────────────────
const goal = computed(() => g.value.goal)
const segments = computed(() => Array.from({ length: g.value.goal }, (_, i) => i < g.value.layers))
/** The picture of the growing wall: 1 (ruins) to 6 (finished). */
const wallStage = computed(() => (g.value.goal > 0 ? (g.value.phase === 'won' ? 6 : 1 + Math.min(4, Math.floor((g.value.layers / g.value.goal) * 5))) : 1 + Math.min(5, Math.floor(g.value.layers / 6))))
const helpsLeft = computed(() => HELPS - g.value.helps)
const resultText = computed(() => {
  if (outcome.kind === 'won') return level.value === LEVELS.length - 1 ? t('app.bigGames.mauer.wonLast') : t('app.bigGames.mauer.won')
  return isFree.value ? t('app.bigGames.mauer.endedFree', { n: outcome.layers }) : t('app.bigGames.mauer.ended')
})
const hideBroken = (e: Event) => {
  const el = e.target
  if (el instanceof HTMLElement) el.style.display = 'none'
}
function pieceStyle(p: Piece) {
  const { rows, cols } = extent(p.shape)
  return { '--mg-rows': rows, '--mg-cols': cols }
}
/** The squares of a stone in its box (for the tray and the floating stone). */
function pieceCells(p: Piece) {
  const { rows, cols } = extent(p.shape)
  const on = new Set(p.shape.map(([r, c]) => r * cols + c))
  return Array.from({ length: rows * cols }, (_, i) => on.has(i))
}
const rowOf = (i: number) => Math.floor(i / SIZE)
const colOf = (i: number) => i % SIZE

let bodyOverflow = ''
onMounted(() => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  music.playGame('puzzle')
})
onBeforeUnmount(() => {
  clearTimers()
  window.clearTimeout(hintTimer)
  stopDrag()
  music.stop('game')
  document.body.style.overflow = bodyOverflow
})
</script>

<template lang="pug">
  div(class="mg" :style="rootStyle")
    //- the sections
    div(v-if="screen === 'menu'" class="mg-menu")
      div(class="mg-card")
        h1(class="mg-title") {{ t('app.bigGames.mauer.title') }}
        p(class="mg-ref") {{ t('app.bigGames.mauer.ref') }}
        p(class="mg-text") {{ t('app.bigGames.mauer.intro') }}
        div(class="mg-levels")
          button(
            v-for="(l, i) in LEVELS"
            :key="l.id"
            type="button"
            :class="['mg-level', { 'is-locked': !unlocked(i) }]"
            :disabled="!unlocked(i)"
            :title="unlocked(i) ? '' : t('app.bigGames.mauer.levelLocked')"
            @click="start(i)"
          )
            span(class="mg-level-no") {{ i + 1 }}
            span(class="mg-level-name")
              span {{ levelTitle(i) }}
              span(class="mg-level-ref") {{ levelRefs[i] }} · {{ t('app.bigGames.mauer.goal', { n: l.goal }) }}
            AdventureStars(:stars="levelStars[i] ?? 0" :size="20")
          button(
            type="button"
            :class="['mg-level', 'mg-level--free', { 'is-locked': !freeOpen }]"
            :disabled="!freeOpen"
            :title="freeOpen ? '' : t('app.bigGames.mauer.freeLocked')"
            @click="start(FREE_LEVEL)"
          )
            span(class="mg-level-no") ∞
            span(class="mg-level-name")
              span {{ t('app.bigGames.mauer.free') }}
              span(class="mg-level-ref") {{ freeOpen ? t('app.bigGames.mauer.best', { n: best }) : t('app.bigGames.mauer.freeLocked') }}
        p(class="mg-rules") {{ t('app.bigGames.mauer.starRules') }}
        AdvButton(tone="blau" small @click="leave") {{ t('app.bigGames.mauer.leave') }}

    //- the game
    template(v-else-if="screen === 'play'")
      div(class="mg-play")
        div(class="mg-top")
          button(type="button" class="mg-pause" :aria-label="t('app.bigGames.mauer.pause')" @click="paused = true") ❚❚
          div(class="mg-hud")
            span(class="mg-hud-title") {{ levelTitle(level) }}
            span(class="mg-hud-count") {{ goal > 0 ? t('app.bigGames.mauer.layers', { n: g.layers, goal }) : t('app.bigGames.mauer.layersFree', { n: g.layers }) }}
          span(class="mg-builders" :title="t('app.bigGames.mauer.builders')") {{ t('app.bigGames.mauer.builders') }} {{ helpsLeft }}

        div(class="mg-wall")
          img(:key="wallStage" :src="pic(`mauer-${wallStage}`)" alt="" class="mg-wall-img" draggable="false" @error="hideBroken")
          div(v-if="goal > 0" class="mg-segs")
            span(v-for="(on, i) in segments" :key="i" :class="['mg-seg', { 'is-on': on }]")

        div(class="mg-field")
          div(ref="boardEl" class="mg-board")
            div(
              v-for="n in SIZE * SIZE"
              :key="n"
              :class="['mg-cell', g.board[n - 1] ? `t${g.board[n - 1]}` : 'is-empty', { 'is-preview-ok': previewCells.has(n - 1) && drag.valid, 'is-preview-bad': previewCells.has(n - 1) && !drag.valid, 'is-hint': hintCells.has(n - 1), 'is-helped': helpedRows.includes(rowOf(n - 1)) }]"
            )
            //- the layers that were just finished glow once
            template(v-if="flash.rows.length || flash.cols.length")
              span(v-for="r in flash.rows" :key="`r${r}-${flash.key}`" class="mg-flash mg-flash--row" :style="{ top: `${(r / SIZE) * 100}%` }")
              span(v-for="c in flash.cols" :key="`c${c}-${flash.key}`" class="mg-flash mg-flash--col" :style="{ left: `${(c / SIZE) * 100}%` }")
            div(v-if="helping" class="mg-help") {{ t('app.bigGames.mauer.helpText') }}

        div(class="mg-tray")
          div(v-for="(p, slot) in g.pieces" :key="slot" class="mg-slot")
            div(
              v-if="p"
              :class="['mg-piece', { 'is-lifted': drag.active && drag.slot === slot }]"
              :style="pieceStyle(p)"
              @pointerdown="onPieceDown(slot, $event)"
            )
              span(v-for="(on, i) in pieceCells(p)" :key="i" :class="['mg-pcell', on ? `t${p.tint}` : 'is-gap']")

        //- the stone that floats under the finger
        div(v-if="dragPiece" class="mg-ghost" :style="ghostStyle")
          div(class="mg-ghost-grid" :style="pieceStyle(dragPiece)")
            span(v-for="(on, i) in pieceCells(dragPiece)" :key="i" :class="['mg-pcell', on ? `t${dragPiece.tint}` : 'is-gap']")

      div(v-if="paused" class="mg-menu mg-menu--dim")
        div(class="mg-card mg-card--small")
          h2(class="mg-title") {{ t('app.bigGames.mauer.pause') }}
          AdvButton(@click="paused = false; armHint()") {{ t('app.bigGames.mauer.resume') }}
          AdvButton(tone="blau" @click="start(level)") {{ t('app.bigGames.mauer.again') }}
          AdvButton(tone="blau" @click="toMenu") {{ t('app.bigGames.mauer.menu') }}

    //- the end of a round
    div(v-else class="mg-menu mg-menu--dim")
      div(class="mg-card mg-card--small")
        h2(class="mg-title") {{ levelTitle(level) }}
        AdventureStars(v-if="!isFree && outcome.kind === 'won'" :stars="outcome.stars" :size="56" celebrate)
        p(class="mg-text") {{ resultText }}
        p(v-if="isFree && outcome.newBest" class="mg-best") {{ t('app.bigGames.mauer.newBest') }}
        AdvButton(v-if="!isFree && outcome.kind === 'won' && level < LEVELS.length - 1" @click="start(level + 1)") {{ t('app.bigGames.mauer.next') }}
        AdvButton(:tone="!isFree && outcome.kind === 'won' && level < LEVELS.length - 1 ? 'blau' : 'gold'" @click="start(level)") {{ t('app.bigGames.mauer.again') }}
        AdvButton(tone="blau" @click="toMenu") {{ t('app.bigGames.mauer.menu') }}
</template>

<style scoped lang="sass">
.mg
  position: fixed
  inset: 0
  z-index: 60
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  touch-action: none
  color: #3a2a14
  // the painted background is added when it exists; until then a warm morning sky over sand
  background: var(--mg-bg) center / cover no-repeat, linear-gradient(180deg, #f6d9a0 0%, #e8b873 55%, #c98f52 100%)

.mg-menu
  position: absolute
  inset: 0
  display: grid
  place-items: center
  padding: 16px
  overflow-y: auto
  background: rgba(40, 24, 8, 0.18)

  &--dim
    background: rgba(24, 14, 4, 0.6)

.mg-card
  width: min(620px, 100%)
  padding: 22px 22px 18px
  border-radius: 24px
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45)
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px
  text-align: center

  &--small
    width: min(420px, 100%)

.mg-title
  margin: 0
  font-size: 1.5rem
  font-weight: 800

.mg-ref
  margin: 0
  font-size: 0.9rem
  opacity: 0.7

.mg-text
  margin: 0
  line-height: 1.45

.mg-best
  margin: 0
  font-weight: 800
  color: #b8860b

.mg-rules
  margin: 0
  font-size: 0.85rem
  opacity: 0.75

.mg-levels
  width: 100%
  display: grid
  gap: 8px

.mg-level
  display: grid
  grid-template-columns: 34px 1fr auto
  align-items: center
  gap: 12px
  padding: 10px 14px
  border-radius: 16px
  border: 1px solid var(--lk-line, #e6d6b5)
  background: var(--lk-surface, #fff)
  color: inherit
  font: inherit
  text-align: left
  cursor: pointer

  &.is-locked
    opacity: 0.5
    cursor: default

  &--free
    grid-template-columns: 34px 1fr

.mg-level-no
  display: grid
  place-items: center
  width: 34px
  height: 34px
  border-radius: 50%
  background: #e0bd62
  font-weight: 800

.mg-level-name
  display: flex
  flex-direction: column
  font-weight: 800

.mg-level-ref
  font-size: 0.78rem
  font-weight: 600
  opacity: 0.7

// ── the game ──
.mg-play
  position: absolute
  inset: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  padding: calc(8px + env(safe-area-inset-top, 0px)) 10px calc(8px + env(safe-area-inset-bottom, 0px))
  // the board is as big as the height allows, but never wider than the screen
  --mg-board: min(94vw, calc((100dvh - 215px) / 1.34))

.mg-top
  width: min(var(--mg-board), 100%)
  display: flex
  align-items: center
  gap: 10px

.mg-pause
  flex: none
  width: 44px
  height: 44px
  border-radius: 50%
  border: 1px solid rgba(58, 42, 20, 0.3)
  background: rgba(255, 250, 240, 0.85)
  color: inherit
  font-size: 0.9rem
  cursor: pointer

.mg-hud
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  line-height: 1.15

.mg-hud-title
  font-weight: 800
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap

.mg-hud-count
  font-size: 0.85rem
  font-weight: 700
  opacity: 0.8

.mg-builders
  flex: none
  padding: 4px 10px
  border-radius: 999px
  background: rgba(255, 250, 240, 0.85)
  font-size: 0.78rem
  font-weight: 800

.mg-wall
  position: relative
  width: min(var(--mg-board), 100%)
  height: 44px
  border-radius: 12px
  overflow: hidden
  background: rgba(255, 250, 240, 0.55)

.mg-wall-img
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  object-fit: cover

.mg-segs
  position: absolute
  inset: auto 6px 5px 6px
  display: flex
  gap: 3px

.mg-seg
  flex: 1
  height: 8px
  border-radius: 4px
  background: rgba(58, 42, 20, 0.25)

  &.is-on
    background: linear-gradient(180deg, #ffe08a, #e0a030)
    box-shadow: 0 0 6px rgba(255, 210, 90, 0.9)

.mg-field
  position: relative

.mg-board
  position: relative
  width: var(--mg-board)
  height: var(--mg-board)
  display: grid
  grid-template-columns: repeat(8, 1fr)
  grid-template-rows: repeat(8, 1fr)
  gap: 2px
  padding: 4px
  border-radius: 14px
  background: rgba(70, 44, 18, 0.55)
  box-shadow: 0 10px 30px rgba(40, 24, 8, 0.45)
  box-sizing: border-box

.mg-cell
  position: relative
  border-radius: 4px
  background-size: cover
  background-position: center

  &.is-empty
    background: rgba(255, 238, 205, 0.28)
    background-image: var(--mg-empty, none)

  &.is-preview-ok
    background: rgba(120, 200, 110, 0.65)
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.8)

  &.is-preview-bad
    background: rgba(220, 90, 80, 0.55)

  &.is-hint
    animation: mg-hint 1s ease-in-out infinite

  &.is-helped
    animation: mg-help 0.9s ease-out

// the stone colours (the painted stones lie above the colour when they exist)
.t1
  background: var(--mg-stone-1) center / cover, #e3c48f
.t2
  background: var(--mg-stone-2) center / cover, #d9a877
.t3
  background: var(--mg-stone-3) center / cover, #cf8f6a
.t4
  background: var(--mg-stone-4) center / cover, #b9aa96
.t5
  background: var(--mg-stone-5) center / cover, #d2b25f

.mg-cell:not(.is-empty)
  box-shadow: inset 0 0 0 1px rgba(60, 40, 15, 0.35), inset 0 -3px 0 rgba(60, 40, 15, 0.2)

.mg-flash
  position: absolute
  pointer-events: none
  background: linear-gradient(90deg, transparent, rgba(255, 224, 120, 0.9), transparent)
  animation: mg-flash 0.65s ease-out forwards

  &--row
    left: 0
    right: 0
    height: calc(100% / 8)

  &--col
    top: 0
    bottom: 0
    width: calc(100% / 8)
    background: linear-gradient(180deg, transparent, rgba(255, 224, 120, 0.9), transparent)

.mg-help
  position: absolute
  inset: 0
  display: grid
  place-items: center
  padding: 18px
  border-radius: 14px
  background: rgba(40, 24, 8, 0.55)
  color: #fff6e0
  font-weight: 800
  font-size: 1.1rem
  text-align: center

.mg-tray
  width: min(var(--mg-board), 100%)
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 8px
  align-items: center
  padding: 8px 4px
  border-radius: 14px
  background: rgba(255, 250, 240, 0.4)
  // a square of a stone in the tray is a bit smaller than on the board
  --mg-tc: calc(var(--mg-board) / 8 * 0.62)

.mg-slot
  min-height: calc(var(--mg-tc) * 4 + 8px)
  display: grid
  place-items: center

.mg-piece
  display: grid
  grid-template-columns: repeat(var(--mg-cols), var(--mg-tc))
  grid-template-rows: repeat(var(--mg-rows), var(--mg-tc))
  gap: 2px
  padding: 8px
  touch-action: none
  cursor: grab

  &.is-lifted
    opacity: 0.25

.mg-pcell
  border-radius: 4px

  &:not(.is-gap)
    box-shadow: inset 0 0 0 1px rgba(60, 40, 15, 0.35), inset 0 -3px 0 rgba(60, 40, 15, 0.2)

.mg-ghost
  position: fixed
  z-index: 70
  pointer-events: none
  opacity: 0.88
  filter: drop-shadow(0 8px 10px rgba(40, 24, 8, 0.5))

.mg-ghost-grid
  display: grid
  grid-template-columns: repeat(var(--mg-cols), var(--mg-gcell))
  grid-template-rows: repeat(var(--mg-rows), var(--mg-gcell))
  gap: 2px
  width: 100%
  height: 100%

@keyframes mg-hint
  0%, 100%
    background: rgba(255, 224, 120, 0.25)
  50%
    background: rgba(255, 224, 120, 0.75)

@keyframes mg-help
  from
    background: rgba(255, 224, 120, 0.9)

@keyframes mg-flash
  from
    opacity: 1
  to
    opacity: 0

// the phone lies on its side: the board on the left as big as the height allows, the stones on the right
@media (orientation: landscape) and (max-height: 600px)
  .mg-play
    display: grid
    grid-template-columns: auto minmax(120px, 1fr)
    grid-template-rows: auto auto 1fr
    align-content: start
    align-items: start
    justify-content: center
    column-gap: 18px
    --mg-board: min(calc(100dvh - 24px), 52vw)

  .mg-top
    grid-column: 2
    grid-row: 1
    width: auto

  .mg-wall
    grid-column: 2
    grid-row: 2
    width: auto

  .mg-field
    grid-column: 1
    grid-row: 1 / span 3

  .mg-tray
    grid-column: 2
    grid-row: 3
    width: auto
    align-self: start
    --mg-tc: calc(var(--mg-board) / 8 * 0.7)
</style>
