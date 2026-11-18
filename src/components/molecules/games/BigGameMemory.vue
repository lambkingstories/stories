<script setup lang="ts">
/**
 * "Bilder-Memory": the big game with the pictures of the adventures (rules in `utils/bilderMemory.ts`; this file only shows them). Every adventure has one
 * board; the cards show the pictures of its stages, every picture twice. A pair that is found stays open and the name of its stage appears below.
 * With the last pair the card of the adventure puts itself together from pieces (the reward) and gets one to three stars by the number of tries.
 * A quiet game: no clock, nothing to lose, no endless play: when every board is done, the game is finished (a board may be played again for fun).
 * The boxes are measured again whenever the window changes (a tablet's browser bar slides in and out; a phone is turned).
 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdvButton from '@/components/atoms/AdvButton.vue'
import AdventureStars from '@/components/molecules/AdventureStars.vue'
import GameIntroBox from '@/components/molecules/games/GameIntroBox.vue'
import { journeys } from '@/data/adventures'
import { EPOCHS, TIMELINE } from '@/data/adventures/timeline'
import { adventureLanguage } from '@/use/adventureLanguage'
import useBigGames, { howSeen, markHowSeen } from '@/use/useBigGames'
import useMusic from '@/use/useMusic'
import useSfx from '@/use/useSfx'
import { prependBaseUrl } from '@/utils/function'
import {
  allBoardsDone,
  boardDone,
  boardsOf,
  cardLayout,
  flip,
  hint as hintOf,
  isUp,
  newGame,
  nextBoard,
  settle,
  starsFor,
  starsOfBoard,
  triesFor,
  type Board,
  type Game
} from '@/utils/bilderMemory'

const emit = defineEmits<{ leave: [] }>()
const { t } = useI18n({ useScope: 'global' })
const { play } = useSfx()
const music = useMusic()
const progress = useBigGames()
const ID = 'memory'

type Screen = 'menu' | 'play' | 'result'
const screen = ref<Screen>('menu')
const how = ref(false)

// ── the boards ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const boards = computed(() => boardsOf(journeys))
const levels = computed(() => progress.levels(ID))
const doneCount = computed(() => boards.value.filter((b) => boardDone(levels.value, b)).length)
const everyDone = computed(() => allBoardsDone(levels.value, boards.value))
const groups = computed(() => {
  const en = adventureLanguage.value === 'en'
  return EPOCHS.map((e) => ({ id: e.id, title: en ? e.en : e.de, sub: en ? e.subEn : e.subDe, boards: boards.value.filter((b) => TIMELINE[b.index]?.epoch === e.id) })).filter((g) => g.boards.length > 0)
})
const pic = (p: string) => prependBaseUrl(p)
/** The back of the cards: the lamb card of the app in a light, friendly cream (made from the dark one, see `rueckseite_bauen.py`). */
const BACK = pic('images/spiele-gross/memory/rueckseite.webp')
const mini = (b: Board) => pic(`images/spiele-gross/memory/mini-${b.id}.webp`)

// ── memory of the device (the end of the game was celebrated) ───────────────────────────────────────────────────────────────
const MEM_KEY = 'lk-memory-v1'
function loadMem(): { finale: boolean } {
  try {
    const m = JSON.parse(localStorage.getItem(MEM_KEY) ?? 'null') as { finale?: boolean } | null
    return { finale: !!m?.finale }
  } catch {
    return { finale: false }
  }
}
const mem = reactive(loadMem())
function saveMem() {
  try {
    localStorage.setItem(MEM_KEY, JSON.stringify(mem))
  } catch {
    // a private window: not remembered
  }
}

// ── the board in play ───────────────────────────────────────────────────────────────────────────────────────────────────────
const board = ref<Board | null>(null)
const game = ref<Game | null>(null)
const caption = reactive({ kind: 'quiet' as 'quiet' | 'first' | 'miss' | 'found' | 'tip', text: '', ref: '' })
const hinted = ref<number | null>(null)
/** The pair that was found last (its two cards glow once). */
const justFound = ref<number | null>(null)
const missing = reactive(new Set<string>())
let settleTimer = 0
let hintTimer = 0
let doneTimer = 0
let started = 0
/** Changes with every deal, so that the cards are new elements (they fly in again, nothing turns back with a new picture). */
const dealKey = ref(0)

/** The pictures of the board are fetched at once, so that no card shows a gap when it turns. */
function preload(b: Board) {
  for (const src of [b.front, ...b.stages.map((s) => s.image)]) {
    const im = new Image()
    im.decoding = 'async'
    im.src = pic(src)
  }
}

function begin(b: Board) {
  window.clearTimeout(settleTimer)
  window.clearTimeout(hintTimer)
  window.clearTimeout(doneTimer)
  clearAssemble()
  board.value = b
  preload(b)
  started++
  dealKey.value = started
  game.value = newGame(b.pairs, (Date.now() + started * 7919) >>> 0)
  caption.kind = 'quiet'
  caption.text = ''
  caption.ref = ''
  hinted.value = null
  justFound.value = null
  screen.value = 'play'
  void nextTick(measure)
}

const stageOfCard = (id: number) => {
  const c = game.value?.cards.find((x) => x.id === id)
  return c && board.value ? board.value.stages[c.pair] : undefined
}

function onCard(id: number) {
  const g = game.value
  if (!g || screen.value !== 'play') return
  // two cards that did not fit are still open: a touch on another card turns them back at once
  if (g.up.length === 2) {
    window.clearTimeout(settleTimer)
    settle(g)
  }
  hinted.value = null
  const r = flip(g, id)
  if (r === 'ignored') return
  play('cardTurn', 0.8)
  if (r === 'first') {
    caption.kind = 'first'
    return
  }
  if (r === 'match') {
    const s = stageOfCard(id)
    justFound.value = g.cards.find((x) => x.id === id)?.pair ?? null
    caption.kind = 'found'
    caption.text = s ? t('app.bigGames.memory.stageLine', { n: s.id, title: s.title }) : ''
    caption.ref = s?.ref ?? ''
    window.setTimeout(() => play('right', 0.9), 300)
    if (g.done) finish()
    return
  }
  // a miss: the two cards stay open for a moment, then they turn back
  caption.kind = 'miss'
  settleTimer = window.setTimeout(() => {
    settle(g)
    play('flip', 0.35)
  }, 1150)
}

function giveHint() {
  const g = game.value
  // while two cards that did not fit are still open there is nothing to show yet
  if (!g || screen.value !== 'play' || g.done || g.up.length >= 2) return
  const id = hintOf(g)
  window.clearTimeout(hintTimer)
  if (id === null) {
    caption.kind = 'tip'
    caption.text = t('app.bigGames.memory.tipNone')
    caption.ref = ''
    hinted.value = null
    return
  }
  hinted.value = id
  caption.kind = 'tip'
  caption.text = g.up.length === 1 ? t('app.bigGames.memory.tipPartner') : t('app.bigGames.memory.tipKnown')
  caption.ref = ''
  play('tap', 0.6)
  hintTimer = window.setTimeout(() => {
    hinted.value = null
  }, 3200)
}

// ── the layout of the cards ─────────────────────────────────────────────────────────────────────────────────────────────────
const boardBox = ref<HTMLElement | null>(null)
const box = reactive({ w: 320, h: 400 })
let ro: ResizeObserver | null = null
function measure() {
  const el = boardBox.value
  if (!el) return
  const r = el.getBoundingClientRect()
  if (r.width > 0 && r.height > 0) {
    box.w = r.width
    box.h = r.height
  }
}
const gap = computed(() => Math.max(6, Math.min(14, Math.round(Math.min(box.w, box.h) * 0.022))))
const layout = computed(() => cardLayout(game.value?.cards.length ?? 12, box.w, box.h, gap.value))
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${layout.value.cols}, ${layout.value.w}px)`, gridAutoRows: `${layout.value.h}px`, gap: `${gap.value}px` }))

// ── the end of a board: the card puts itself together ───────────────────────────────────────────────────────────────────────
const outcome = reactive({ stars: 0, tries: 0, pairs: 0, first: false })
const PIECE_COLS = 3
const PIECE_ROWS = 4
const pieces = computed(() => {
  // every piece starts somewhere else around the card and flies in
  const list: { i: number; col: number; row: number; dx: number; dy: number; rot: number }[] = []
  for (let i = 0; i < PIECE_COLS * PIECE_ROWS; i++) {
    const col = i % PIECE_COLS
    const row = Math.floor(i / PIECE_COLS)
    const a = (i * 2.399963) % (Math.PI * 2)
    list.push({ i, col, row, dx: Math.round(Math.cos(a) * 190), dy: Math.round(Math.sin(a) * 230), rot: ((i * 53) % 41) - 20 })
  }
  return list
})
const assembling = ref(false)
const whole = ref(false)
const finale = ref(false)
let assembleTimers: number[] = []
function clearAssemble() {
  assembleTimers.forEach((x) => window.clearTimeout(x))
  assembleTimers = []
  assembling.value = false
  whole.value = false
  finale.value = false
}

function finish() {
  const g = game.value
  const b = board.value
  if (!g || !b) return
  const stars = starsFor(g.tries, g.pairs)
  outcome.stars = stars
  outcome.tries = g.tries
  outcome.pairs = g.pairs
  const before = starsOfBoard(progress.levels(ID), b)
  outcome.first = before === 0
  progress.record(ID, b.index, stars)
  // the child may look at the last pair for a moment before the card comes together
  doneTimer = window.setTimeout(() => {
    screen.value = 'result'
    clearAssemble()
    void nextTick(() => {
      assembleTimers.push(window.setTimeout(() => (assembling.value = true), 80))
      pieces.value.forEach((p, k) => assembleTimers.push(window.setTimeout(() => play('bead', 0.5, 0.85 + k * 0.055), 380 + k * 95)))
      assembleTimers.push(
        window.setTimeout(() => {
          whole.value = true
          if (everyDone.value && !mem.finale) {
            mem.finale = true
            saveMem()
            finale.value = true
          }
        }, 380 + pieces.value.length * 95 + 650)
      )
    })
  }, 1500)
}

const followUp = computed(() => (board.value ? nextBoard(progress.levels(ID), boards.value, board.value.index) : null))
const resultText = computed(() => t(`app.bigGames.memory.won${outcome.stars}`))
const rules = computed(() => triesFor(outcome.pairs || board.value?.pairs || 6))

function toMenu() {
  window.clearTimeout(settleTimer)
  window.clearTimeout(hintTimer)
  window.clearTimeout(doneTimer)
  clearAssemble()
  screen.value = 'menu'
}
function leave() {
  emit('leave')
}
function closeHow() {
  how.value = false
  markHowSeen(ID)
}

// ── caption and pips ────────────────────────────────────────────────────────────────────────────────────────────────────────
const captionText = computed(() => {
  switch (caption.kind) {
    case 'quiet':
      return t('app.bigGames.memory.quiet')
    case 'first':
      return t('app.bigGames.memory.first')
    case 'miss':
      return t('app.bigGames.memory.miss')
    default:
      return caption.text
  }
})
const foundCount = computed(() => game.value?.found.length ?? 0)

const frontOf = (pair: number) => pic(board.value?.stages[pair]?.image ?? '')

function cardLabel(id: number): string {
  const g = game.value
  if (!g) return ''
  if (!isUp(g, id)) return t('app.bigGames.memory.cardHidden')
  return stageOfCard(id)?.title ?? t('app.bigGames.memory.cardOpen')
}

// ── keyboard ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (how.value) closeHow()
  else if (screen.value === 'menu') leave()
  else toMenu()
}

function setProbe() {
  if (!window.location.hash.includes('probe=1')) return
  ;(window as unknown as { __memory?: unknown }).__memory = {
    get game() {
      return game.value
    },
    get board() {
      return board.value
    },
    boards: () => boards.value,
    begin: (index: number) => {
      const b = boards.value.find((x) => x.index === index) ?? boards.value[0]
      if (b) begin(b)
    },
    /** Plays the whole board without a single miss. */
    solve: () => {
      const g = game.value
      if (!g) return
      for (let p = 0; p < g.pairs; p++) {
        const ids = g.cards.filter((c) => c.pair === p).map((c) => c.id)
        onCard(ids[0]!)
        onCard(ids[1]!)
      }
    }
  }
}

let bodyOverflow = ''
onMounted(() => {
  bodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('resize', measure)
  window.visualViewport?.addEventListener('resize', measure)
  window.addEventListener('orientationchange', measure)
  window.addEventListener('keydown', onKey)
  if (typeof ResizeObserver !== 'undefined') ro = new ResizeObserver(() => measure())
  music.playGame('memory')
  how.value = !howSeen(ID)
  setProbe()
})
onBeforeUnmount(() => {
  window.clearTimeout(settleTimer)
  window.clearTimeout(hintTimer)
  window.clearTimeout(doneTimer)
  clearAssemble()
  ro?.disconnect()
  music.stop('game')
  window.removeEventListener('resize', measure)
  window.visualViewport?.removeEventListener('resize', measure)
  window.removeEventListener('orientationchange', measure)
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = bodyOverflow
})

/** The box of the cards is watched as soon as it is on the page. */
function bindBox(el: unknown) {
  const next = (el as HTMLElement | null) ?? null
  if (next === boardBox.value) return
  if (boardBox.value) ro?.unobserve(boardBox.value)
  boardBox.value = next
  if (next) {
    ro?.observe(next)
    measure()
  }
}

const bgStyle = computed(() => {
  const src = screen.value === 'menu' || !board.value ? pic('images/spiele-gross/memory/kachel-2.webp') : mini(board.value)
  return { backgroundImage: `url("${src}")` }
})
function hideBroken(e: Event) {
  const img = e.target as HTMLImageElement
  missing.add(img.currentSrc || img.src)
  img.style.visibility = 'hidden'
}
const STAND = ['#c98a52', '#6f9fc2', '#7fb069', '#e0c25a', '#b58ac4', '#7fc4b8', '#c98a8a', '#9aa5b5', '#d98b5f', '#8fa86a']
</script>

<template lang="pug">
  div(class="mm" :class="'mm--' + screen")
    div(class="mm-bg" :style="bgStyle")
    div(class="mm-veil")

    //- the overview: the story and one card for every adventure, in the order of the Bible
    div(v-if="screen === 'menu'" class="mm-menu" data-test="memory-menu")
      div(class="mm-sheet")
        GameIntroBox(
          :title="t('app.bigGames.memory.title')"
          :label="t('app.bigGames.common.intro')"
          :story="t('app.bigGames.memory.story')"
          :task="t('app.bigGames.memory.task')"
        )
        p(class="mm-progress" data-test="memory-progress") {{ t('app.bigGames.memory.progress', { n: doneCount, all: boards.length }) }}
        div(v-if="everyDone" class="mm-allDone" data-test="memory-alldone")
          h2(class="mm-allDone-title") ★ {{ t('app.bigGames.memory.allDoneTitle') }}
          p(class="mm-text") {{ t('app.bigGames.memory.allDone') }}
        section(v-for="g in groups" :key="g.id" class="mm-epoch")
          h2(class="mm-epoch-title") {{ g.title }}
          div(class="mm-tiles")
            button(
              v-for="b in g.boards"
              :key="b.id"
              type="button"
              class="mm-tile"
              :class="{ 'is-done': boardDone(levels, b) }"
              :data-test="'memory-board-' + b.id"
              :aria-label="b.title + ', ' + t('app.bigGames.memory.pairs', { n: b.pairs })"
              @click="begin(b)"
            )
              span(class="mm-tile-card")
                img(:src="boardDone(levels, b) ? mini(b) : BACK" alt="" draggable="false" loading="lazy" @error="hideBroken")
              span(class="mm-tile-name") {{ b.title }}
              span(class="mm-tile-info")
                AdventureStars(v-if="boardDone(levels, b)" :stars="starsOfBoard(levels, b)" :size="15")
                span(v-else class="mm-tile-pairs") {{ t('app.bigGames.memory.pairs', { n: b.pairs }) }}
        p(class="mm-rules") {{ t('app.bigGames.memory.starRules') }}
        div(class="mm-menu-buttons")
          AdvButton(tone="blau" small data-test="memory-how" @click="how = true") {{ t('app.bigGames.memory.howTitle') }}
          AdvButton(tone="blau" data-test="memory-leave" @click="leave") {{ t('app.bigGames.common.leave') }}

    //- the board
    template(v-else-if="screen === 'play' && board && game")
      header(class="mm-top")
        button(type="button" class="mm-btn" :aria-label="t('app.bigGames.memory.menu')" data-test="memory-back" @click="toMenu") ←
        div(class="mm-info")
          span(class="mm-board-name") {{ board.title }}
          span(class="mm-pips" aria-hidden="true")
            span(v-for="p in game.pairs" :key="p" :class="['mm-pip', { 'is-on': game.found.includes(p - 1) }]")
        button(type="button" class="mm-btn" :aria-label="t('app.bigGames.memory.hint')" data-test="memory-hint" @click="giveHint")
          span(class="mm-bulb") ✦
          span(class="mm-btn-text") {{ t('app.bigGames.memory.hint') }}
        button(type="button" class="mm-btn" :aria-label="t('app.bigGames.memory.again')" data-test="memory-restart" @click="begin(board)") ↻
      div(class="mm-field" :ref="bindBox")
        div(class="mm-grid" :style="gridStyle" data-test="memory-grid")
          button(
            v-for="(c, i) in game.cards"
            :key="dealKey + '-' + c.id"
            type="button"
            class="mm-card"
            :class="{ 'is-up': isUp(game, c.id), 'is-found': game.found.includes(c.pair), 'is-hint': hinted === c.id }"
            :style="{ '--i': i }"
            :data-test="'memory-card-' + c.id"
            :data-pair="c.pair"
            :aria-label="cardLabel(c.id)"
            :aria-pressed="isUp(game, c.id)"
            @click="onCard(c.id)"
          )
            span(class="mm-flip")
              span(class="mm-face mm-back")
                img(:src="BACK" alt="" draggable="false" @error="hideBroken")
              span(:class="['mm-face', 'mm-front', { 'is-just': justFound === c.pair }]" :style="{ background: STAND[c.pair % STAND.length] }")
                img(:src="frontOf(c.pair)" alt="" draggable="false" @error="hideBroken")
      p(:class="['mm-caption', 'is-' + caption.kind]" role="status" data-test="memory-caption")
        span(class="mm-caption-text") {{ captionText }}
        span(v-if="caption.kind === 'found' && caption.ref" class="mm-caption-ref") {{ caption.ref }}

    //- the end of a board: the card comes together, the stars
    div(v-else-if="screen === 'result' && board" class="mm-result" data-test="memory-result")
      div(class="mm-result-inner")
        div(class="mm-result-card")
          h2(class="mm-title mm-title--small") {{ t('app.bigGames.memory.cardOf', { title: board.title }) }}
          div(:class="['mm-assemble', { 'is-in': assembling, 'is-whole': whole }]" :style="whole ? { backgroundImage: 'url(' + pic(board.front) + ')', backgroundSize: 'cover' } : null")
            span(
              v-for="p in pieces"
              :key="p.i"
              class="mm-piece"
              :style="{ '--dx': p.dx + 'px', '--dy': p.dy + 'px', '--r': p.rot + 'deg', '--k': p.i, backgroundImage: 'url(' + pic(board.front) + ')', backgroundSize: PIECE_COLS * 100 + '% ' + PIECE_ROWS * 100 + '%', backgroundPosition: (p.col * 100) / (PIECE_COLS - 1) + '% ' + (p.row * 100) / (PIECE_ROWS - 1) + '%' }"
            )
            span(class="mm-glow")
        div(class="mm-result-side")
          div(class="mm-stars-slot")
            AdventureStars(v-if="whole" :stars="outcome.stars" :size="48" celebrate)
          div(:class="['mm-after', { 'is-on': whole }]")
            p(class="mm-text") {{ resultText }}
            p(class="mm-text mm-tries") {{ t('app.bigGames.memory.triesUsed', { n: outcome.tries }) }}
            div(class="mm-lines")
              p(:class="['mm-line', { 'is-on': outcome.stars >= 3 }]") {{ outcome.stars >= 3 ? '✓' : '○' }} {{ t('app.bigGames.memory.lineThree', { n: rules.three }) }}
              p(:class="['mm-line', { 'is-on': outcome.stars >= 2 }]") {{ outcome.stars >= 2 ? '✓' : '○' }} {{ t('app.bigGames.memory.lineTwo', { n: rules.two }) }}
              p(class="mm-line is-on") ✓ {{ t('app.bigGames.memory.lineOne') }}
            div(v-if="finale" class="mm-allDone" data-test="memory-finale")
              h2(class="mm-allDone-title") ★ {{ t('app.bigGames.memory.allDoneTitle') }}
              p(class="mm-text") {{ t('app.bigGames.memory.allDone') }}
            div(class="mm-buttons")
              AdvButton(v-if="followUp" data-test="memory-next" @click="begin(followUp)") {{ t('app.bigGames.memory.next') }}
              AdvButton(:tone="followUp ? 'blau' : 'gold'" data-test="memory-again" @click="begin(board)") {{ t('app.bigGames.memory.again') }}
              AdvButton(tone="blau" data-test="memory-menu-btn" @click="toMenu") {{ t('app.bigGames.memory.menu') }}

    //- the explanation: once at the very first start, the question mark of the menu brings it back
    div(v-if="how" class="mm-dim" data-test="memory-howcard")
      div(class="mm-sheet mm-how")
        h2(class="mm-title") {{ t('app.bigGames.memory.howTitle') }}
        div(class="mm-how-row")
          span(class="mm-how-sign") 👆
          p(class="mm-how-line") {{ t('app.bigGames.memory.howTurn') }}
        div(class="mm-how-row")
          span(class="mm-how-sign") ✓
          p(class="mm-how-line") {{ t('app.bigGames.memory.howPair') }}
        div(class="mm-how-row")
          span(class="mm-how-sign") ↺
          p(class="mm-how-line") {{ t('app.bigGames.memory.howMiss') }}
        AdvButton(data-test="memory-go" @click="closeHow") {{ t('app.bigGames.memory.go') }}
</template>

<style scoped lang="sass">
.mm
  position: fixed
  inset: 0
  z-index: 60
  background: #14183a
  overflow: hidden
  user-select: none
  -webkit-user-select: none
  color: #fff8e8

// the backdrop: the little card of the adventure, drawn big (so it is soft without a costly blur filter) under a dark veil: every board has the mood of its own adventure
.mm-bg
  position: absolute
  inset: 0
  background-size: cover
  background-position: center

.mm-veil
  position: absolute
  inset: 0
  background: radial-gradient(ellipse at 50% 40%, rgba(12, 14, 40, 0.42), rgba(8, 9, 28, 0.78))
  pointer-events: none

// ── overview ───────────────────────────────────────────────────────────────────────────────────────────
.mm-menu
  position: absolute
  inset: 0
  display: grid
  place-items: start center
  padding: 16px
  overflow-y: auto
  -webkit-overflow-scrolling: touch

.mm-sheet
  position: relative
  width: min(720px, 100%)
  padding: 22px 18px 20px
  border-radius: 24px
  background: var(--lk-surface, #fffaf0)
  color: var(--lk-text, #2a2418)
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45)
  display: flex
  flex-direction: column
  gap: 12px

.mm-title
  margin: 0
  font-size: 1.7rem
  line-height: 1.15
  text-align: center
  color: var(--lk-text, #2a2418)

  &--small
    font-size: 1.2rem
    color: #fff8e8

.mm-text
  margin: 0
  font-size: 1.15rem
  line-height: 1.45
  text-align: center

  &--task
    font-weight: 700

.mm-progress
  margin: 0
  text-align: center
  font-weight: 700
  color: var(--lk-muted, #6b5f4a)

.mm-allDone
  padding: 12px 14px
  border-radius: 18px
  background: rgba(232, 194, 106, 0.22)
  border: 2px solid #e8c26a
  text-align: center

  &-title
    margin: 0 0 4px
    font-size: 1.25rem

.mm-epoch
  display: flex
  flex-direction: column
  gap: 8px

  &-title
    margin: 8px 0 0
    font-size: 1.05rem
    color: var(--lk-muted, #6b5f4a)
    letter-spacing: 0.02em

.mm-tiles
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr))
  gap: 12px 10px

.mm-tile
  display: flex
  flex-direction: column
  align-items: center
  gap: 5px
  padding: 0
  border: 0
  background: transparent
  color: inherit
  cursor: pointer
  min-height: 48px
  font: inherit
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation

  &:active .mm-tile-card
    transform: scale(0.96)

.mm-tile-card
  display: block
  width: 100%
  aspect-ratio: 2 / 3
  border-radius: 9px
  overflow: hidden
  background: #f3e7c8
  box-shadow: 0 4px 10px rgba(40, 28, 8, 0.35)
  transition: transform 160ms ease

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover

.mm-tile.is-done .mm-tile-card
  box-shadow: 0 0 0 2px #e8c26a, 0 4px 12px rgba(40, 28, 8, 0.4)

.mm-tile-name
  font-size: 0.8rem
  line-height: 1.2
  text-align: center
  font-weight: 700
  display: -webkit-box
  -webkit-line-clamp: 2
  -webkit-box-orient: vertical
  overflow: hidden

.mm-tile-info
  min-height: 16px
  display: flex
  align-items: center
  justify-content: center

.mm-tile-pairs
  font-size: 0.72rem
  color: var(--lk-muted, #6b5f4a)

.mm-rules
  margin: 6px 0 0
  font-size: 0.9rem
  line-height: 1.4
  text-align: center
  color: var(--lk-muted, #6b5f4a)

.mm-menu-buttons
  display: flex
  justify-content: center
  gap: 10px
  flex-wrap: wrap

// ── the board ──────────────────────────────────────────────────────────────────────────────────────────
.mm-top
  position: absolute
  top: 0
  left: 0
  right: 0
  display: flex
  align-items: center
  gap: 10px
  padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 6px
  z-index: 2

.mm-btn
  flex: none
  min-width: 48px
  height: 48px
  padding: 0 14px
  border-radius: 999px
  border: 1px solid rgba(255, 248, 232, 0.45)
  background: rgba(20, 22, 52, 0.62)
  color: #fff8e8
  font-size: 1.35rem
  line-height: 1
  cursor: pointer
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 6px
  -webkit-tap-highlight-color: transparent

  &:active
    transform: scale(0.95)

.mm-bulb
  color: #f5c84a

.mm-btn-text
  font-size: 0.95rem
  font-weight: 700

.mm-info
  flex: 1
  min-width: 0
  display: flex
  flex-direction: column
  align-items: center
  gap: 5px

.mm-board-name
  max-width: 100%
  font-size: 1.05rem
  font-weight: 700
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6)

.mm-pips
  display: flex
  gap: 5px

.mm-pip
  width: 9px
  height: 9px
  border-radius: 50%
  background: rgba(255, 248, 232, 0.25)
  transition: background 300ms ease, transform 300ms ease

  &.is-on
    background: #f5c84a
    transform: scale(1.25)

.mm-field
  position: absolute
  left: 12px
  right: 12px
  top: calc(72px + env(safe-area-inset-top, 0px))
  bottom: calc(66px + env(safe-area-inset-bottom, 0px))
  display: grid
  place-items: center

.mm-grid
  display: grid
  justify-content: center
  align-content: center

.mm-card
  position: relative
  padding: 0
  border: 0
  background: transparent
  cursor: pointer
  perspective: 800px
  min-width: 0
  -webkit-tap-highlight-color: transparent
  touch-action: manipulation
  animation: mm-deal 480ms cubic-bezier(0.2, 0.8, 0.3, 1) both
  animation-delay: calc(var(--i) * 32ms)

.mm-flip
  position: absolute
  inset: 0
  transform-style: preserve-3d
  transition: transform 480ms cubic-bezier(0.3, 0.9, 0.4, 1.08)

.mm-card.is-up .mm-flip
  transform: rotateY(180deg)

.mm-face
  position: absolute
  inset: 0
  border-radius: 10px
  overflow: hidden
  backface-visibility: hidden
  -webkit-backface-visibility: hidden
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.45)

  img
    display: block
    width: 100%
    height: 100%
    object-fit: cover
    pointer-events: none

.mm-back
  background: #f3e7c8

.mm-front
  transform: rotateY(180deg)

  &::after
    content: ''
    position: absolute
    inset: 0
    border-radius: inherit
    box-shadow: inset 0 0 0 2px rgba(255, 248, 232, 0.6)
    pointer-events: none

.mm-card.is-found .mm-front
  box-shadow: 0 0 0 3px #f5c84a, 0 0 16px rgba(245, 200, 74, 0.75)

// the glow of a pair that was just found runs on the picture only; the card itself never changes its animation (a card that changed it would fly in again and flicker)
.mm-front.is-just
  animation: mm-pop 700ms ease-out both

.mm-card.is-hint .mm-face
  animation: mm-hint 900ms ease-in-out 4

.mm-caption
  position: absolute
  left: 14px
  right: 14px
  bottom: calc(10px + env(safe-area-inset-bottom, 0px))
  min-height: 48px
  margin: 0
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  text-align: center
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7)

  &.is-found .mm-caption-text
    font-size: 1.15rem
    font-weight: 700
    color: #ffe9a6

.mm-caption-text
  font-size: 1rem
  line-height: 1.3

.mm-caption-ref
  font-size: 0.85rem
  opacity: 0.85

// ── the end ────────────────────────────────────────────────────────────────────────────────────────────
.mm-result
  position: absolute
  inset: 0
  overflow-y: auto
  display: grid
  place-items: center
  padding: calc(14px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))

.mm-result-inner
  display: flex
  flex-direction: column
  align-items: center
  gap: 14px
  width: min(760px, 100%)
  margin: auto

.mm-result-card
  display: flex
  flex-direction: column
  align-items: center
  gap: 10px

.mm-assemble
  position: relative
  width: min(54vw, 36vh, 300px)
  min-width: 150px
  aspect-ratio: 2 / 3
  display: grid
  grid-template-columns: repeat(3, 1fr)
  grid-template-rows: repeat(4, 1fr)
  gap: 4px
  border-radius: 12px
  transition: gap 700ms ease, box-shadow 900ms ease, border-radius 700ms ease

  &.is-whole
    gap: 0
    box-shadow: 0 0 0 3px #f5c84a, 0 0 34px rgba(245, 200, 74, 0.7)

.mm-piece
  display: block
  border-radius: 6px
  opacity: 0
  transform: translate(var(--dx), var(--dy)) rotate(var(--r)) scale(0.5)
  transition: transform 900ms cubic-bezier(0.2, 0.9, 0.3, 1.05), opacity 500ms ease, border-radius 700ms ease
  transition-delay: calc(var(--k) * 95ms)
  background-repeat: no-repeat
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35)

.mm-assemble.is-in .mm-piece
  opacity: 1
  transform: none

.mm-assemble.is-whole .mm-piece
  border-radius: 0
  box-shadow: none
  transition-delay: 0ms

.mm-assemble.is-whole
  overflow: hidden

.mm-glow
  position: absolute
  inset: 0
  border-radius: inherit
  pointer-events: none
  background: linear-gradient(115deg, transparent 35%, rgba(255, 244, 200, 0.55) 50%, transparent 65%)
  background-size: 250% 100%
  background-position: 160% 0
  opacity: 0

.mm-assemble.is-whole .mm-glow
  animation: mm-shine 1400ms ease-out 300ms 1 both

.mm-result-side
  width: 100%
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px

.mm-stars-slot
  min-height: 52px
  display: flex
  align-items: center
  justify-content: center

.mm-after
  width: 100%
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  opacity: 0
  transform: translateY(8px)
  transition: opacity 600ms ease, transform 600ms ease
  pointer-events: none

  &.is-on
    opacity: 1
    transform: none
    pointer-events: auto

  .mm-text
    color: #fff8e8
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6)

  .mm-allDone
    color: #fff8e8
    background: rgba(20, 22, 52, 0.7)

.mm-tries
  font-weight: 700

.mm-buttons
  display: flex
  flex-direction: column
  align-items: center
  gap: 8px
  width: 100%

.mm-lines
  display: flex
  flex-direction: column
  gap: 2px

.mm-line
  margin: 0
  font-size: 0.9rem
  opacity: 0.7
  text-align: center

  &.is-on
    opacity: 1
    color: #ffe9a6
    font-weight: 700

// ── the explanation ────────────────────────────────────────────────────────────────────────────────────
.mm-dim
  position: absolute
  inset: 0
  z-index: 5
  display: grid
  place-items: center
  padding: 14px
  overflow-y: auto
  background: rgba(14, 12, 30, 0.66)

.mm-how
  align-items: stretch
  max-height: 100%
  overflow-y: auto
  gap: 20px

.mm-how-row
  display: flex
  align-items: center
  gap: 16px
  width: 100%

.mm-how-sign
  flex: none
  width: 56px
  height: 56px
  border-radius: 50%
  display: grid
  place-items: center
  background: rgba(232, 194, 106, 0.3)
  font-size: 1.7rem

.mm-how-line
  margin: 0
  text-align: left
  font-size: 1.2rem
  font-weight: 700
  line-height: 1.3

// the buttons of a sheet are centred
.mm-sheet :deep(.adv-btn)
  align-self: center

// ── landscape and small screens ───────────────────────────────────────────────────────────────────────
@media (orientation: landscape) and (max-height: 560px)
  .mm-top
    padding-top: calc(6px + env(safe-area-inset-top, 0px))
  .mm-btn
    height: 44px
    min-width: 44px
  .mm-field
    top: calc(56px + env(safe-area-inset-top, 0px))
    bottom: calc(50px + env(safe-area-inset-bottom, 0px))
  .mm-caption
    min-height: 40px
    bottom: calc(4px + env(safe-area-inset-bottom, 0px))
  .mm-caption-text
    font-size: 0.92rem
  .mm-result-inner
    flex-direction: row
    align-items: center
    justify-content: center
    gap: 26px
  .mm-result-side
    width: auto
    max-width: 420px
  .mm-lines
    display: none
  .mm-buttons
    flex-direction: row
    flex-wrap: wrap
    justify-content: center
    gap: 8px
    :deep(.adv-btn)
      min-width: 0
  .mm-assemble
    width: min(30vw, 40vh, 260px)
    min-width: 110px
  .mm-sheet
    padding: 16px 16px 16px

@media (max-width: 380px)
  .mm-btn-text
    display: none

// ── motion ─────────────────────────────────────────────────────────────────────────────────────────────
@keyframes mm-deal
  from
    opacity: 0
    transform: translateY(18px) scale(0.9)
  to
    opacity: 1
    transform: none

@keyframes mm-pop
  0%
    box-shadow: 0 0 0 3px #f5c84a, 0 0 16px rgba(245, 200, 74, 0.75)
  35%
    box-shadow: 0 0 0 5px #fff1b8, 0 0 38px rgba(255, 232, 150, 1)
  100%
    box-shadow: 0 0 0 3px #f5c84a, 0 0 16px rgba(245, 200, 74, 0.75)

@keyframes mm-hint
  0%, 100%
    box-shadow: 0 0 0 3px rgba(245, 200, 74, 0.2), 0 0 8px rgba(245, 200, 74, 0.3)
  50%
    box-shadow: 0 0 0 4px #f5c84a, 0 0 22px rgba(245, 200, 74, 0.95)

@keyframes mm-shine
  0%
    opacity: 1
    background-position: 160% 0
  100%
    opacity: 0
    background-position: -60% 0

@media (prefers-reduced-motion: reduce)
  .mm-flip
    transition-duration: 160ms
  .mm-card
    animation: none
  .mm-front.is-just
    animation: none
  .mm-piece
    transition-duration: 200ms
    transition-delay: 0ms
  .mm-card.is-hint .mm-face
    animation: none
    box-shadow: 0 0 0 4px #f5c84a

// short screens: the explanation card closer together
@media (max-height: 520px)
  .mm-how
    gap: 8px
  .mm-how-row
    gap: 12px
  .mm-how-sign
    width: 40px
    font-size: 1.5rem
    height: 40px
  .mm-how-line
    font-size: 1.05rem
</style>
