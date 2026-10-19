// The scoring of an adventure (see `types/adventure.ts`): stars per stage, points of a journey, the cup.
import type { JourneyProgress, Journey, Medal } from '@/types/adventure'

export const MAX_STARS = 3

/** Stars for a quiz: all right 3, at least half right 2, some right 1, none right 0 (answering alone earns no star; Anton, 19.10.2026). */
export function quizStars(correct: number, total: number): number {
  if (total <= 0 || correct <= 0) return 0
  if (correct >= total) return 3
  if (correct * 2 >= total) return 2
  return 1
}

/**
 * Stars for a game that is left unfinished ("Weiter") and for the tasks of a painting: by the share of the task that was done, the same
 * for every game. At least two thirds 2 stars, at least 30 % one star, below that none (skipping earns no star). Three stars need the whole task.
 */
export function partialStars(done: number, goal: number): number {
  if (goal <= 0 || done <= 0) return 0
  const d = Math.min(done, goal)
  if (d >= goal) return 3
  if (d * 3 >= goal * 2) return 2
  if (d * 10 >= goal * 3) return 1
  return 0
}

/** Stars for painting a picture that has no tasks: 70 % of it painted 3, 40 % 2, 30 % one star, less than that none. */
export function paintStars(share: number, painted = true): number {
  if (!painted) return 0
  if (share >= 0.7) return 3
  if (share >= 0.4) return 2
  return share >= 0.3 ? 1 : 0
}

/** Stars for counting: right the first time 3, the second time 2, later 1. */
export function attemptStars(attempt: number): number {
  return attempt <= 1 ? 3 : attempt === 2 ? 2 : 1
}

/** Stars for a game where mistakes are possible: up to `soft` mistakes 3 stars, up to `hard` 2 stars, then 1. */
export function mistakeStars(mistakes: number, soft = 1, hard = 4): number {
  return mistakes <= soft ? 3 : mistakes <= hard ? 2 : 1
}

/** Stars for a game where things are caught on the way (the dove's lights): all but one 3 stars, more than half 2, otherwise 1. */
export function catchStars(caught: number, total: number): number {
  if (total <= 0) return 0
  if (total - caught <= 1) return 3
  return caught * 2 > total ? 2 : 1
}

/**
 * The stars of a stage after the questions (the same for all games): every right answer brings one star back, up to three; then every wrong
 * answer takes one away, so a wrong answer always shows (three stars from the game, one right and one wrong answer make two).
 * There is no minimum: nothing right and nothing from the game is 0 stars, and never below 0 (Anton, 19.10.2026).
 */
export function finalStars(gameStars: number, correct: number, wrong: number): number {
  const net = Math.min(MAX_STARS, gameStars + Math.max(0, correct)) - Math.max(0, wrong)
  return Math.min(MAX_STARS, Math.max(0, net))
}

/** The stars that count for a stage: the final ones once the questions are done, otherwise those of the game. */
export function stageStarsOf(s: { stars: number; gameStars?: number; finalStars?: number } | undefined): number {
  if (!s) return 0
  return Math.min(MAX_STARS, Math.max(0, s.finalStars ?? s.gameStars ?? s.stars))
}

/**
 * The stage `index` (0-based) is open when it is the first one or the one before it was gone through. A stage that is not ready (`soon`)
 * is never open; in a journey that is still being made (it has such stages) every ready stage can be opened at once, because
 * the way through the stages that are missing cannot be walked.
 */
export function isStageOpen(journey: Journey, progress: JourneyProgress | undefined, index: number): boolean {
  if (journey.stages[index]?.soon) return false
  if (journey.stages.some((s) => s.soon)) return true
  if (index <= 0) return true
  const before = journey.stages[index - 1]
  return !!before && !!progress?.stages[before.id]?.done
}

/** All stages gone through: the exam opens. */
export function isExamOpen(journey: Journey, progress: JourneyProgress | undefined): boolean {
  // stages that are not ready (`soon`) cannot be gone through, so they do not hold the exam back
  return journey.stages.filter((s) => !s.soon).every((s) => progress?.stages[s.id]?.done)
}

export function starsOf(progress: JourneyProgress | undefined): number {
  return Object.values(progress?.stages ?? {}).reduce((n, s) => n + stageStarsOf(s), 0)
}

/** What a journey can give at most: three stars per stage and a point for every question of the exam. */
export function maxPoints(journey: Journey): number {
  // stages that are not ready (`soon`) cannot give stars yet
  return journey.stages.filter((st) => !st.soon).length * MAX_STARS + journey.exam.length
}

/** Stars of all stages plus the right answers of the exam. */
export function pointsOf(progress: JourneyProgress | undefined): number {
  return starsOf(progress) + (progress?.exam?.correct ?? 0)
}

/** The cup: gold from 90 %, silver from 75 %, bronze from 50 % of the possible points; below that none. */
export function medalFor(points: number, max: number): Medal | null {
  if (max <= 0) return null
  const share = points / max
  if (share >= 0.9) return 'gold'
  if (share >= 0.75) return 'silver'
  if (share >= 0.5) return 'bronze'
  return null
}

/** The first stage that is open but not yet gone through (where the child goes on), or null when all are done. */
export function nextStageIndex(journey: Journey, progress: JourneyProgress | undefined): number | null {
  const i = journey.stages.findIndex((s) => !s.soon && !progress?.stages[s.id]?.done)
  return i < 0 ? null : i
}
