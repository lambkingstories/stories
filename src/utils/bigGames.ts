import type { Journey, JourneyProgress } from '@/types/adventure'
import { starsOf } from '@/utils/adventureScore'
import { STEP, type BigGame } from '@/data/bigGames'

/** The stars of all stages of all journeys together (the best try of every stage; the answers of the exam are not stars). */
export function totalStars(journeys: Journey[], progressOf: (id: string) => JourneyProgress | undefined): number {
  return journeys.reduce((n, j) => n + starsOf(progressOf(j.id)), 0)
}

/** The wishes for a game the stars have earned: one for every full `step` stars. */
export function wishesEarned(total: number, step: number = STEP): number {
  return Math.floor(Math.max(0, total) / step)
}

/** The ids that count as picked: only games of the list, every one once. */
export function pickedIds(games: BigGame[], picked: readonly string[]): string[] {
  const known = new Set(games.map((g) => g.id as string))
  return [...new Set(picked)].filter((id) => known.has(id))
}

/** The wishes still free: earned minus the games already picked (never below 0, and never more than there are games left). */
export function wishesFree(games: BigGame[], total: number, picked: readonly string[], step: number = STEP): number {
  const used = pickedIds(games, picked).length
  return Math.max(0, Math.min(wishesEarned(total, step) - used, games.length - used))
}

/** A game can be picked when it is still closed and a wish is free. */
export function canPick(games: BigGame[], total: number, picked: readonly string[], id: string, step: number = STEP): boolean {
  return games.some((g) => g.id === id) && !pickedIds(games, picked).includes(id) && wishesFree(games, total, picked, step) > 0
}

export interface BigGameState {
  game: BigGame
  /** The child has picked this game. */
  open: boolean
}

export function bigGameStates(games: BigGame[], picked: readonly string[]): BigGameState[] {
  const ids = pickedIds(games, picked)
  return games.map((game) => ({ game, open: ids.includes(game.id) }))
}

export interface WishState {
  /** Wishes earned so far, and the games already picked. */
  earned: number
  used: number
  /** Wishes free now: the child may pick this many games. */
  free: number
  /** Every game is open: no wish is needed any more. */
  allOpen: boolean
  /** Stars still missing for the next wish (STEP when the last wish was just earned). */
  missing: number
  /** How far the child is to the next wish, 0 to 1. */
  share: number
}

export function wishState(games: BigGame[], total: number, picked: readonly string[], step: number = STEP): WishState {
  const t = Math.max(0, total)
  const used = pickedIds(games, picked).length
  const into = t % step
  return {
    earned: wishesEarned(t, step),
    used,
    free: wishesFree(games, t, picked, step),
    allOpen: used >= games.length,
    missing: step - into,
    share: into / step
  }
}

/**
 * The first sentence of a text of a game (for the little window of its tile): the text must already be there, nothing is written anew.
 * A point after a number ("2. Mose", "1. Samuel") does not end a sentence. A reference in brackets at the end ("(2. Mose 2,1–10)") is left out:
 * the little window is for a child, the reference is in the game itself.
 */
export function firstSentence(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim()
  const m = /^(.+?[.!?…])(?=\s+[A-ZÄÖÜÁÉÍÓÚ¡¿]|$)/su.exec(t)
  if (!m) return t
  // "(2. Mose 2,1–10)." : a stop that follows a digit does not end the sentence, so look further
  let end = m[1]!.length
  while (/\d[.]$/.test(t.slice(0, end)) && end < t.length) {
    const rest = /^.*?[.!?…](?=\s+[A-ZÄÖÜÁÉÍÓÚ¡¿]|$)/su.exec(t.slice(end))
    if (!rest) return t
    end += rest[0].length
  }
  return t
    .slice(0, end)
    .replace(/\s*\([^()]*\d[^()]*\)(?=[.!?…]?$)/u, '')
    .trim()
}
