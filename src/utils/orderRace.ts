/**
 * The order race: a few stages of one adventure are shown mixed up (only their titles), and the person has to tap them in the order in
 * which they happen in the story. The right order is the order of the stages of the adventure, so nothing is made up. These are the pure
 * parts (the round, the mixing, the points), so they can be tested.
 */
import type { Journey } from '@/types/adventure'
import { MAX_PLAYERS, shuffle } from '@/utils/familyQuiz'

export const ORDER_COUNTS = [4, 5, 6] as const
export const ORDER_ROUND_CHOICES = [1, 2, 3] as const
/** Extra points for a row that is right all the way. */
export const ORDER_BONUS = 2

export interface OrderRound {
  /** The adventure the stages come from. */
  journey: string
  /** The titles in the right order. */
  titles: string[]
}

/** The stages of a journey that can be asked: ready ones with a title, in the order of the story, without a title that appears twice. */
function askable(j: Journey): string[] {
  const titles = j.stages.filter((s) => !s.soon && s.title?.trim()).map((s) => s.title.trim())
  const seen = new Set<string>()
  return titles.every((t) => !seen.has(t) && !!seen.add(t)) ? titles : titles.filter((t, i) => titles.indexOf(t) === i && titles.lastIndexOf(t) === i)
}

/** The titles of the adventures that have enough stages for a round of `count` (what the person can pick from). */
export const orderJourneys = (journeys: Journey[], count: number): string[] => journeys.filter((j) => askable(j).length >= count).map((j) => j.title)

/**
 * One round: `count` stages in a row from a random adventure (or from the one called `only`), at a random place in it. `null` when no
 * adventure has enough stages.
 */
export function buildOrderRound(journeys: Journey[], count: number, rand: () => number = Math.random, only = ''): OrderRound | null {
  const pool = journeys.filter((j) => askable(j).length >= count && (!only || j.title === only))
  if (!pool.length || count < 2) return null
  const j = pool[Math.floor(rand() * pool.length)]!
  const all = askable(j)
  const start = Math.floor(rand() * (all.length - count + 1))
  return { journey: j.title, titles: all.slice(start, start + count) }
}

/** The titles mixed up, never in the right order already. */
export function mixUp(titles: readonly string[], rand: () => number = Math.random): string[] {
  if (titles.length < 2) return [...titles]
  for (let i = 0; i < 20; i++) {
    const mixed = shuffle(titles, rand)
    if (mixed.some((t, k) => t !== titles[k])) return mixed
  }
  return [...titles].reverse()
}

export interface OrderScore {
  /** How many are on the right place. */
  right: number
  /** True when the whole row is right. */
  all: boolean
  /** One point for every right place, and the bonus for the whole row. */
  points: number
}

export function scoreOrder(correct: readonly string[], answer: readonly string[]): OrderScore {
  const right = correct.reduce((n, t, i) => n + (answer[i] === t ? 1 : 0), 0)
  const all = correct.length > 0 && right === correct.length
  return { right, all, points: right + (all ? ORDER_BONUS : 0) }
}

/** The points of a finished row: a place that was missed at the first try counts as a wrong one. */
export function scoreFromMissed(titles: readonly string[], missed: readonly boolean[]): OrderScore {
  const answer = titles.map((title, i) => (missed[i] ? titles[(i + 1) % titles.length]! : title))
  return scoreOrder(titles, answer)
}

// ── "keep playing": the round on the device ────────────────────────────────────────────────────────────────────────
/** Everything that is needed to take up an order race again (plain data). The points of a finished row are in `scores` already. */
export interface OrderSnap {
  /** Between two turns ('handover', no row yet) or in a row ('play'). */
  phase: 'handover' | 'play'
  playerCount: number
  rounds: number
  count: number
  only: string
  names: string[]
  turn: number
  scores: number[]
  round: OrderRound | null
  mixed: string[]
  picked: string[]
  missed: boolean[]
  tried: string[]
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const isTexts = (v: unknown, max: number): v is string[] => Array.isArray(v) && v.length <= max && v.every((x) => typeof x === 'string' && x.length <= 200)

/** The kept round if it has the expected shape (and makes sense), else `null`. A broken or old state never reaches the game. */
export function parseOrderSnap(raw: unknown): OrderSnap | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (s.phase !== 'handover' && s.phase !== 'play') return null
  if (!isInt(s.playerCount, 1, MAX_PLAYERS) || !isInt(s.rounds, 1, 99) || !(ORDER_ROUND_CHOICES as readonly number[]).includes(s.rounds)) return null
  if (!isInt(s.count, 1, 99) || !(ORDER_COUNTS as readonly number[]).includes(s.count)) return null
  if (typeof s.only !== 'string' || !isTexts(s.names, MAX_PLAYERS) || !isInt(s.turn, 0, s.playerCount * s.rounds - 1)) return null
  if (!Array.isArray(s.scores) || s.scores.length !== s.playerCount || !s.scores.every((x) => isInt(x, 0, 100000))) return null
  const base = { phase: s.phase, playerCount: s.playerCount, rounds: s.rounds, count: s.count, only: s.only, names: s.names, turn: s.turn, scores: s.scores as number[] }

  const r = s.round as Record<string, unknown> | null | undefined
  if (s.phase === 'handover') return { ...base, round: null, mixed: [], picked: [], missed: [], tried: [] }
  if (!r || typeof r !== 'object' || typeof r.journey !== 'string' || !isTexts(r.titles, 99)) return null
  const titles = r.titles
  if (titles.length !== s.count || new Set(titles).size !== titles.length) return null
  if (!isTexts(s.mixed, 99) || s.mixed.length !== titles.length || !titles.every((x) => (s.mixed as string[]).includes(x))) return null
  if (!isTexts(s.picked, 99) || s.picked.length > titles.length || !s.picked.every((x, i) => x === titles[i])) return null
  if (!Array.isArray(s.missed) || s.missed.length !== titles.length || !s.missed.every((x) => typeof x === 'boolean')) return null
  if (!isTexts(s.tried, 99) || !s.tried.every((x) => titles.includes(x) && !(s.picked as string[]).includes(x))) return null
  return { ...base, round: { journey: r.journey, titles: [...titles] }, mixed: s.mixed, picked: s.picked, missed: s.missed as boolean[], tried: s.tried }
}
