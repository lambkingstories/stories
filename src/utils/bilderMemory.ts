/**
 * "Bilder-Memory" (big game `memory`): a quiet game for one person, a reward and nothing more. Every adventure has ONE board; the cards show the
 * pictures of its stages (every picture twice). Whoever has found all the pairs sees the whole card of the adventure and earns one to three stars
 * by the number of tries. There is no clock, nothing can be lost, nothing is counted against the child, and when every board is done the game is done.
 *
 * The rules live here without Vue (shuffling with a seed, pairs, tries, stars, a hint, the layout of the cards); `BigGameMemory.vue` only draws them.
 * (The memory of the family games has its own rules in `utils/memoryGame.ts`; this one is different on purpose.)
 */
import { TIMELINE } from '@/data/adventures/timeline'
import { CARD_ART } from '@/data/cardArt'

/** The least and the most pairs on a board; boards later in the Bible have more pairs. */
export const MIN_PAIRS = 6
export const MAX_PAIRS = 10
/** The numbers of pairs, from the first quarter of the Bible to the last (a board of 14 cards is never made: it would not be a full rectangle). */
export const PAIR_STEPS = [6, 8, 9, 10] as const

/** The number of pairs of the board at a place on the time line (0-based): the boards grow with the Bible. */
export function pairsForIndex(index: number, total = TIMELINE.length): number {
  const step = Math.min(PAIR_STEPS.length - 1, Math.max(0, Math.floor((index * PAIR_STEPS.length) / Math.max(1, total))))
  return PAIR_STEPS[step]!
}

export interface BoardStage {
  /** The id of the stage in its adventure (the number shown as "Stage 3"). */
  id: number
  title: string
  ref: string
  /** The picture below `public/`. */
  image: string
}

export interface Board {
  /** The id of the adventure. */
  id: string
  /** Its place on the time line, 0-based: the level number the stars are saved under, so it never moves when more adventures come. */
  index: number
  title: string
  pairs: number
  stages: BoardStage[]
  /** The card of the adventure, shown whole when the board is done (below `public/`). */
  front: string
}

interface JourneyLike {
  id: string
  title: string
  medal: string
  stages: { id: number; title: string; ref: string; image?: string; soon?: boolean }[]
}

/** The stages of an adventure that have a picture and are ready. */
export function usableStages(j: JourneyLike): BoardStage[] {
  return j.stages.filter((s) => !s.soon && !!s.image).map((s) => ({ id: s.id, title: s.title, ref: s.ref, image: s.image! }))
}

/** `n` of the stages, spread evenly over the whole story (the first and the last are always there). */
export function pickStages<T>(all: T[], n: number): T[] {
  if (n >= all.length) return [...all]
  if (n <= 1) return all.slice(0, 1)
  const out: T[] = []
  for (let k = 0; k < n; k++) out.push(all[Math.round((k * (all.length - 1)) / (n - 1))]!)
  return out
}

/**
 * The boards of the adventures that are in this build, in the order of the Bible (an adventure that is not in the app has no board; one with too
 * few pictures gets fewer pairs, and none at all when there are fewer than four).
 */
export function boardsOf(journeys: readonly JourneyLike[]): Board[] {
  const out: Board[] = []
  TIMELINE.forEach((entry, index) => {
    const j = journeys.find((x) => x.id === entry.id)
    if (!j) return
    const usable = usableStages(j)
    if (usable.length < 4) return
    const pairs = Math.min(pairsForIndex(index), usable.length)
    out.push({ id: j.id, index, title: j.title, pairs, stages: pickStages(usable, pairs), front: CARD_ART[j.id]?.front ?? j.medal })
  })
  return out
}

// ── the cards ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A small seeded random generator (so that a board can be mixed the same way again in the tests). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Card {
  /** Unique on the board. */
  id: number
  /** The pair (the index into `Board.stages`). */
  pair: number
}

/** The cards of a board in a mixed order: two of every pair. */
export function dealCards(pairs: number, seed: number): Card[] {
  const rnd = seeded(seed)
  const list: Card[] = []
  for (let p = 0; p < pairs; p++) list.push({ id: p * 2, pair: p }, { id: p * 2 + 1, pair: p })
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  return list
}

export interface Game {
  cards: Card[]
  pairs: number
  /** The cards that lie turned up right now and are not yet a pair (0 to 2). */
  up: number[]
  /** The pairs found (indices). */
  found: number[]
  /** Two turned cards are one try. */
  tries: number
  /** The cards the child has seen at least once. */
  seen: Set<number>
  /** Tries in a row without a pair (for the friendly hint). */
  misses: number
  done: boolean
}

export function newGame(pairs: number, seed: number): Game {
  return { cards: dealCards(pairs, seed), pairs, up: [], found: [], tries: 0, seen: new Set(), misses: 0, done: false }
}

export type FlipResult = 'ignored' | 'first' | 'match' | 'miss'

const cardOf = (g: Game, id: number) => g.cards.find((c) => c.id === id)

/** Is this card face up (turned by the child, or part of a pair that is found)? */
export function isUp(g: Game, id: number): boolean {
  const c = cardOf(g, id)
  return !!c && (g.up.includes(id) || g.found.includes(c.pair))
}

/**
 * The child turns a card. The first card of a try just turns; the second one makes the try: the same pair stays open, a different one stays open
 * until `settle` turns both back (the screen waits a moment so that the child can look). While two cards are open nothing else can be turned.
 */
export function flip(g: Game, id: number): FlipResult {
  const c = cardOf(g, id)
  if (!c || g.done || g.up.length >= 2 || isUp(g, id)) return 'ignored'
  g.up.push(id)
  g.seen.add(id)
  if (g.up.length === 1) return 'first'
  g.tries++
  const a = cardOf(g, g.up[0]!)!
  if (a.pair === c.pair) {
    g.found.push(c.pair)
    g.up = []
    g.misses = 0
    if (g.found.length >= g.pairs) g.done = true
    return 'match'
  }
  g.misses++
  return 'miss'
}

/** After a miss: the two cards turn back. */
export function settle(g: Game): void {
  if (g.up.length === 2) g.up = []
}

/**
 * A friendly hint: a card the child already knows. When one card is turned and its partner was seen before, that is the partner; otherwise a card
 * whose partner was seen as well (so there is a pair to find). Nothing is taken away for a hint. Returns null when there is nothing known yet.
 */
export function hint(g: Game): number | null {
  if (g.up.length === 1) {
    const a = cardOf(g, g.up[0]!)!
    const partner = g.cards.find((c) => c.pair === a.pair && c.id !== a.id)
    return partner && g.seen.has(partner.id) ? partner.id : null
  }
  if (g.up.length >= 2) return null
  for (let p = 0; p < g.pairs; p++) {
    if (g.found.includes(p)) continue
    const both = g.cards.filter((c) => c.pair === p)
    if (both.length === 2 && both.every((c) => g.seen.has(c.id))) return both[0]!.id
  }
  return null
}

// ── stars ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Three stars up to two tries per pair, two stars up to three tries per pair, otherwise one star (a finished board is always worth a star). */
export function starsFor(tries: number, pairs: number): 1 | 2 | 3 {
  if (tries <= pairs * 2) return 3
  if (tries <= pairs * 3) return 2
  return 1
}

/** The tries that still give the stars (for the line that explains it). */
export const triesFor = (pairs: number): { three: number; two: number } => ({ three: pairs * 2, two: pairs * 3 })

// ── the whole game ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The stars of the boards, by place on the time line (`useBigGames().levels('memory')`). */
export const starsOfBoard = (levels: readonly number[], b: Board): number => levels[b.index] ?? 0
export const boardDone = (levels: readonly number[], b: Board): boolean => starsOfBoard(levels, b) >= 1
export const allBoardsDone = (levels: readonly number[], boards: readonly Board[]): boolean => boards.length > 0 && boards.every((b) => boardDone(levels, b))

/** The board to go on with after `current`: the next one in the Bible that is not done, going round once; null when all are done. */
export function nextBoard(levels: readonly number[], boards: readonly Board[], current: number): Board | null {
  const at = boards.findIndex((b) => b.index === current)
  for (let k = 1; k <= boards.length; k++) {
    const b = boards[(at + k + boards.length) % boards.length]!
    if (!boardDone(levels, b)) return b
  }
  return null
}

// ── the layout ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CardLayout {
  cols: number
  rows: number
  /** The size of one card in pixels. */
  w: number
  h: number
  /** Places in the last row that stay empty (0 when the rectangle is full). */
  empty: number
}

/** The shape of a card may be a little tall or a little wide, never more: the picture shows enough of the painting. */
export const CARD_ASPECT_MIN = 0.78
export const CARD_ASPECT_MAX = 1.3

/**
 * The columns and the card size that make the cards the biggest in a box of `w` x `h` pixels. A full rectangle is better than a last row that is
 * half empty (a small penalty), and the cards are never tiny.
 */
export function cardLayout(count: number, w: number, h: number, gap: number): CardLayout {
  let best: CardLayout = { cols: 1, rows: Math.max(1, count), w: 1, h: 1, empty: 0 }
  let bestScore = -1
  for (let cols = 2; cols <= Math.max(2, count); cols++) {
    const rows = Math.ceil(count / cols)
    const cellW = (w - gap * (cols - 1)) / cols
    const cellH = (h - gap * (rows - 1)) / rows
    if (cellW <= 0 || cellH <= 0) continue
    let cw = cellW
    let ch = cellH
    // keep the shape of the card inside its limits and as big as possible
    if (cw / ch > CARD_ASPECT_MAX) cw = ch * CARD_ASPECT_MAX
    else if (cw / ch < CARD_ASPECT_MIN) ch = cw / CARD_ASPECT_MIN
    const empty = rows * cols - count
    const score = cw * ch * (empty === 0 ? 1 : 0.8)
    if (score > bestScore) {
      bestScore = score
      best = { cols, rows, w: Math.floor(cw), h: Math.floor(ch), empty }
    }
  }
  return best
}
