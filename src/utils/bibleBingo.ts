/**
 * Bible bingo: a person of the Bible is called (by name, or by three hints), and whoever has the person on the card ticks it. Whoever has a
 * whole row, column or diagonal calls "Bingo". The card has sixteen of the people in four rows. Nothing is shared between the devices: at
 * the table one person reads aloud (and may play, too), or with a round code every phone calls the people by itself. These are the pure
 * parts (the cards, the draw order, the lines), so they can be tested.
 */
import { WHO_PEOPLE } from '@/data/whoAmI'
import { shuffle } from '@/utils/familyQuiz'

export const BINGO_SIZE = 4
export const BINGO_CELLS = BINGO_SIZE * BINGO_SIZE

/** The lines that win: every row, every column and the two diagonals (positions 0 to 15, row by row). */
export const BINGO_LINES: readonly (readonly number[])[] = (() => {
  const n = BINGO_SIZE
  const at = (r: number, c: number) => r * n + c
  const lines: number[][] = []
  for (let r = 0; r < n; r++) lines.push(Array.from({ length: n }, (_, c) => at(r, c)))
  for (let c = 0; c < n; c++) lines.push(Array.from({ length: n }, (_, r) => at(r, c)))
  lines.push(Array.from({ length: n }, (_, i) => at(i, i)))
  lines.push(Array.from({ length: n }, (_, i) => at(i, n - 1 - i)))
  return lines
})()

/** A card: sixteen different people (their numbers in `WHO_PEOPLE`) in random places. */
export function makeCard(rand: () => number = Math.random, people: number = WHO_PEOPLE.length): number[] {
  return shuffle(Array.from({ length: people }, (_, i) => i), rand).slice(0, BINGO_CELLS)
}

/** The order in which the people are called. */
export function drawOrder(rand: () => number = Math.random, people: number = WHO_PEOPLE.length): number[] {
  return shuffle(Array.from({ length: people }, (_, i) => i), rand)
}

/** True when the ticked fields hold a whole line. */
export function hasBingo(marked: readonly boolean[]): boolean {
  return BINGO_LINES.some((line) => line.every((p) => marked[p]))
}

// ── "keep playing": the round on this phone ───────────────────────────────────────────────────────────────────────
/**
 * What this phone keeps of a bingo round (plain data): the way and level, the card with its seals, and what belongs to the way:
 *  - `host` (at the table, this phone reads aloud): the order of the people, where it stands, the hint and whether the name is shown;
 *  - `card` (at the table, only a card): nothing more;
 *  - `ready` / `live` (round code): the code (it gives every phone the same order) and, once "Go" was tapped, the moment of the start.
 *    The clock of the round is the clock on the wall, so a phone that comes back finds the round where the other phones are.
 */
export interface BingoSnap {
  way: 'table' | 'code'
  level: 'name' | 'hints'
  phase: 'host' | 'card' | 'ready' | 'live'
  card: number[]
  marked: boolean[]
  order: number[]
  step: number
  hintN: number
  revealed: boolean
  code: string
  startedAt: number
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

/** The kept round if it has the expected shape and makes sense, else `null`. A broken or old state never reaches the game. */
export function parseBingoSnap(raw: unknown, people: number = WHO_PEOPLE.length): BingoSnap | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (s.way !== 'table' && s.way !== 'code') return null
  if (s.level !== 'name' && s.level !== 'hints') return null
  if (s.phase !== 'host' && s.phase !== 'card' && s.phase !== 'ready' && s.phase !== 'live') return null
  if ((s.phase === 'host' || s.phase === 'card') !== (s.way === 'table')) return null
  const card = s.card
  if (!Array.isArray(card) || card.length !== BINGO_CELLS || !card.every((x) => isInt(x, 0, people - 1)) || new Set(card).size !== BINGO_CELLS) return null
  if (!Array.isArray(s.marked) || s.marked.length !== BINGO_CELLS || !s.marked.every((x) => typeof x === 'boolean')) return null
  let order: number[] = []
  let step = 0
  let hintN = 1
  let revealed = false
  if (s.phase === 'host') {
    if (!Array.isArray(s.order) || s.order.length !== people || !s.order.every((x) => isInt(x, 0, people - 1)) || new Set(s.order).size !== people) return null
    order = s.order
    if (!isInt(s.step, 0, people - 1) || !isInt(s.hintN, 1, 3) || typeof s.revealed !== 'boolean') return null
    step = s.step
    hintN = s.hintN
    revealed = s.revealed
  }
  let code = ''
  let startedAt = 0
  if (s.phase === 'ready' || s.phase === 'live') {
    if (typeof s.code !== 'string' || !/^[A-Z0-9]{6}$/.test(s.code)) return null
    code = s.code
    if (s.phase === 'live') {
      if (typeof s.startedAt !== 'number' || !Number.isFinite(s.startedAt) || s.startedAt <= 0) return null
      startedAt = s.startedAt
    }
  }
  return { way: s.way, level: s.level, phase: s.phase, card, marked: s.marked, order, step, hintN, revealed, code, startedAt }
}

/** True when the people of a round with a code have all been called by `now` (the round is over; nothing to take up). */
export function liveIsOver(startedAt: number, now: number, period: number, people: number = WHO_PEOPLE.length): boolean {
  return Math.max(0, now - startedAt) >= period * people
}

/** True when the card is really a bingo: a whole line of ticks, and every tick is a person that was called. */
export function isTrueBingo(card: readonly number[], marked: readonly boolean[], drawn: readonly number[]): boolean {
  const real = marked.map((m, p) => !!m && drawn.includes(card[p]!))
  return hasBingo(real)
}
