/**
 * The order race: a few stages of one adventure are shown mixed up (only their titles), and the person has to tap them in the order in
 * which they happen in the story. The right order is the order of the stages of the adventure, so nothing is made up. These are the pure
 * parts (the round, the mixing, the points), so they can be tested.
 */
import type { Journey } from '@/types/adventure'
import { shuffle } from '@/utils/familyQuiz'

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
