import type { Journey, JourneyProgress } from '@/types/adventure'
import { starsOf } from '@/utils/adventureScore'
import type { BigGame } from '@/data/bigGames'

/** The stars of all stages of all journeys together (the best try of every stage; the answers of the exam are not stars). */
export function totalStars(journeys: Journey[], progressOf: (id: string) => JourneyProgress | undefined): number {
  return journeys.reduce((n, j) => n + starsOf(progressOf(j.id)), 0)
}

export interface BigGameState {
  game: BigGame
  open: boolean
  /** Stars still missing (0 when open). */
  missing: number
  /** How far the child is to the game, 0 to 1. */
  share: number
}

export function bigGameStates(games: BigGame[], total: number): BigGameState[] {
  return games.map((game) => ({ game, open: total >= game.at, missing: Math.max(0, game.at - total), share: Math.min(1, game.at > 0 ? total / game.at : 1) }))
}

/** The next game that is still closed (the nearest one), or null. */
export function nextBigGame(games: BigGame[], total: number): BigGameState | null {
  return bigGameStates(games, total).filter((s) => !s.open).sort((a, b) => a.game.at - b.game.at)[0] ?? null
}
