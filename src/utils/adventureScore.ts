// The scoring of an adventure (see `types/adventure.ts`): stars per stage, points of a journey, the cup.
import type { JourneyProgress, Journey, Medal } from '@/types/adventure'

export const MAX_STARS = 3

/** Stars for a quiz: all right 3, at least half right 2, otherwise 1 (taking part is worth a star). */
export function quizStars(correct: number, total: number): number {
  if (total <= 0) return 0
  if (correct >= total) return 3
  if (correct * 2 >= total) return 2
  return 1
}

/** Stars for painting: 70 % of the picture painted 3, 40 % 2, otherwise 1 (whoever took part and painted something gets a star; nothing painted, no star). */
export function paintStars(share: number, painted = true): number {
  if (share >= 0.7) return 3
  if (share >= 0.4) return 2
  return painted ? 1 : 0
}

/** Stars for counting: right the first time 3, the second time 2, later 1. */
export function attemptStars(attempt: number): number {
  return attempt <= 1 ? 3 : attempt === 2 ? 2 : 1
}

/** Stars for a game where mistakes are possible: up to `soft` mistakes 3 stars, up to `hard` 2 stars, then 1. */
export function mistakeStars(mistakes: number, soft = 1, hard = 4): number {
  return mistakes <= soft ? 3 : mistakes <= hard ? 2 : 1
}

/**
 * The stars of a stage after the questions (the same for all games): every right answer brings one star back, up to three; then every wrong
 * answer takes one away, so a wrong answer always shows (three stars from the game, one right and one wrong answer make two).
 * Whoever took part in the game keeps at least one star.
 */
export function finalStars(gameStars: number, correct: number, wrong: number): number {
  const net = Math.min(MAX_STARS, gameStars + Math.max(0, correct)) - Math.max(0, wrong)
  const floor = gameStars > 0 ? 1 : 0
  return Math.min(MAX_STARS, Math.max(floor, net))
}

/** The stars that count for a stage: the final ones once the questions are done, otherwise those of the game. */
export function stageStarsOf(s: { stars: number; gameStars?: number; finalStars?: number } | undefined): number {
  if (!s) return 0
  return Math.min(MAX_STARS, Math.max(0, s.finalStars ?? s.gameStars ?? s.stars))
}

/** The stage `index` (0-based) is open when it is the first one or the one before it was gone through. */
export function isStageOpen(journey: Journey, progress: JourneyProgress | undefined, index: number): boolean {
  if (index <= 0) return true
  const before = journey.stages[index - 1]
  return !!before && !!progress?.stages[before.id]?.done
}

/** All stages gone through: the exam opens. */
export function isExamOpen(journey: Journey, progress: JourneyProgress | undefined): boolean {
  return journey.stages.every((s) => progress?.stages[s.id]?.done)
}

export function starsOf(progress: JourneyProgress | undefined): number {
  return Object.values(progress?.stages ?? {}).reduce((n, s) => n + stageStarsOf(s), 0)
}

/** What a journey can give at most: three stars per stage and a point for every question of the exam. */
export function maxPoints(journey: Journey): number {
  return journey.stages.length * MAX_STARS + journey.exam.length
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
  const i = journey.stages.findIndex((s) => !progress?.stages[s.id]?.done)
  return i < 0 ? null : i
}
