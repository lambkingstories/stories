/**
 * "Wer bin ich?": one person of the family does not look at the screen and guesses who a card shows by asking questions that can be
 * answered with yes or no. Another person holds the device, sees the card and its facts and answers. The fewer questions, the more points.
 * These are the pure parts (the cards, the points, the turns), so they can be tested.
 */
import { WHO_PEOPLE, type WhoPerson } from '@/data/whoAmI'
import { shuffle } from '@/utils/familyQuiz'

/** The most questions a person may ask (a wrong guess counts as a question). */
export const MAX_QUESTIONS = 20
export const WHO_ROUND_CHOICES = [1, 2, 3] as const

/** 3 points up to 5 questions, 2 points up to 10, 1 point up to 20 and nothing after that. */
export function pointsFor(questions: number): number {
  if (questions < 0 || questions > MAX_QUESTIONS) return 0
  if (questions <= 5) return 3
  if (questions <= 10) return 2
  return 1
}

/** As many different cards as asked for (never more than there are people), in random order. */
export function buildWhoDeck(count: number, rand: () => number = Math.random, list: readonly WhoPerson[] = WHO_PEOPLE): WhoPerson[] {
  return shuffle(list, rand).slice(0, Math.max(0, count))
}

/** Who guesses card number `index` (0-based): the people take turns, round after round. */
export const guesserOf = (index: number, players: number): number => (players > 0 ? index % players : 0)

/** How many cards a game has: every person guesses `rounds` times, but there are never more cards than people on the cards. */
export function cardsFor(players: number, rounds: number, available: number = WHO_PEOPLE.length): number {
  if (players <= 0 || rounds <= 0) return 0
  return Math.min(players * rounds, available)
}
