/**
 * The family quiz: two to eight people pass one device around and answer questions from the adventures, one after the other. These are the
 * pure parts (the pool of questions, drawing and shuffling them, the ranking), so they can be tested.
 */
import type { AdventureQuestion, Journey } from '@/types/adventure'

export interface FamilyQuestion {
  q: string
  options: string[]
  /** Index of the right option (after the options were shuffled). */
  answer: number
  /** Where the question comes from ("Josef: Der Lieblingssohn"). */
  from: string
  /** The adventure it comes from ("Josef") and its stage (empty for a question of the exam); both are shown with the question. */
  journey: string
  stage: string
  /** A question of the Bible quiz: its level (1 easy, 2 medium, 3 hard) and the Bible passage that holds the answer ("1. Mose 7,12"). */
  level?: 1 | 2 | 3
  ref?: string
}

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 8
export const ROUND_CHOICES = [3, 5, 8] as const

/** What the child has been through: the questions of a stage open with the stage, the questions of the exam with the exam. */
export interface QuizProgress {
  stageDone: (journeyId: string, stageId: number) => boolean
  examDone: (journeyId: string) => boolean
}

/**
 * Every question of the stages and of the exams of the given journeys. A question that has no right answer in its options is left out.
 * With `progress` only the questions of the stages that were gone through and of the exams that were taken are in it (the questions grow
 * with the adventures; nobody is asked about a story not yet read).
 */
export function buildPool(journeys: Journey[], progress?: QuizProgress): FamilyQuestion[] {
  const out: FamilyQuestion[] = []
  const add = (list: AdventureQuestion[], journey: string, stage: string) => {
    for (const x of list) {
      if (!x?.q || !Array.isArray(x.options) || x.options.length < 2 || !x.options[x.answer]) continue
      out.push({ q: x.q, options: [...x.options], answer: x.answer, from: stage ? `${journey}: ${stage}` : journey, journey, stage })
    }
  }
  for (const j of journeys) {
    for (const s of j.stages) if (!s.soon && (!progress || progress.stageDone(j.id, s.id))) add(s.questions ?? [], j.title, s.title)
    if (!progress || progress.examDone(j.id)) add(j.exam ?? [], j.title, '')
  }
  return out
}

/** A new array in random order (Fisher-Yates); `rand` is injectable for the tests. */
export function shuffle<T>(list: readonly T[], rand: () => number = Math.random): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** `count` different questions (the same wording is used once), with the options in a new order and the right answer found again. */
export function pickQuestions(pool: FamilyQuestion[], count: number, rand: () => number = Math.random): FamilyQuestion[] {
  const seen = new Set<string>()
  const picked: FamilyQuestion[] = []
  for (const item of shuffle(pool, rand)) {
    if (picked.length >= count) break
    if (seen.has(item.q)) continue
    seen.add(item.q)
    const right = item.options[item.answer]!
    const options = shuffle(item.options, rand)
    picked.push({ ...item, options, answer: options.indexOf(right) })
  }
  return picked
}

/** How many questions every person gets: what was asked for, but never more than the pool can serve. */
export function roundsFor(requested: number, players: number, poolSize: number): number {
  if (players <= 0) return 0
  return Math.max(0, Math.min(requested, Math.floor(poolSize / players)))
}

/** Who answers question number `index` (0-based): the people take turns. */
export const playerOf = (index: number, players: number): number => (players > 0 ? index % players : 0)

export interface Placing {
  name: string
  score: number
  /** 1 for the best; people with the same score share a rank. */
  rank: number
}

/** The people by score, best first; the same score gives the same rank. */
export function ranking(names: string[], scores: number[]): Placing[] {
  const list = names.map((name, i) => ({ name, score: scores[i] ?? 0 }))
  list.sort((a, b) => b.score - a.score)
  return list.map((p, i) => ({ ...p, rank: i > 0 && p.score === list[i - 1]!.score ? 0 : i + 1 })).reduce<Placing[]>((acc, p, i) => {
    acc.push({ ...p, rank: p.rank || acc[i - 1]!.rank })
    return acc
  }, [])
}

/** Two teams: the people sit alternately (1st, 3rd, 5th … against 2nd, 4th, 6th …). The score of a team is the sum of its people. */
export const teamOf = (player: number): 0 | 1 => (player % 2 === 0 ? 0 : 1)

export function teamScores(scores: number[]): [number, number] {
  const sum: [number, number] = [0, 0]
  scores.forEach((s, i) => (sum[teamOf(i)] += s))
  return sum
}
