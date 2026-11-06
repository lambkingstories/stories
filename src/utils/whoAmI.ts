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

/**
 * The round that can be taken up again ("keep playing"): plain data only. The cards are kept by the German name of the person (it is
 * unique, and survives a change of the order of the list); what was asked and answered on this card, the points and the verdict belong
 * to it.
 */
export interface WhoSnap {
  /** Where the round stands: the device goes to the other person, the card is open, or the verdict of the card is shown. */
  phase: 'handover' | 'card' | 'verdict'
  playerCount: number
  rounds: number
  names: string[]
  deck: string[]
  index: number
  scores: number[]
  asked: number
  trail: ('yes' | 'no' | 'maybe')[]
  lastPoints: number
}

const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0

export function whoSnapDeck(deck: readonly WhoPerson[]): string[] {
  return deck.map((p) => p.name.de)
}

/** Checks a kept round from the device and gives back the state with the people of the cards, or `null` when it has the wrong shape. */
export function readWhoSnap(raw: unknown, list: readonly WhoPerson[] = WHO_PEOPLE): { snap: WhoSnap; deck: WhoPerson[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const { phase, playerCount, rounds, names, deck, index, scores, asked, trail, lastPoints } = s
  if (phase !== 'handover' && phase !== 'card' && phase !== 'verdict') return null
  if (!isCount(playerCount) || playerCount < 2 || playerCount > 8) return null
  if (!isCount(rounds) || !(WHO_ROUND_CHOICES as readonly number[]).includes(rounds)) return null
  if (!Array.isArray(names) || names.length > 8 || !names.every((n) => typeof n === 'string')) return null
  if (!Array.isArray(deck) || deck.length < 1 || deck.length > list.length) return null
  const people: WhoPerson[] = []
  for (const d of deck as unknown[]) {
    const person = typeof d === 'string' ? list.find((p) => p.name.de === d) : undefined
    if (!person || people.includes(person)) return null
    people.push(person)
  }
  if (!isCount(index) || index >= people.length) return null
  if (!Array.isArray(scores) || scores.length !== playerCount || !scores.every((n) => isCount(n) && n <= 1000)) return null
  if (!isCount(asked) || asked > MAX_QUESTIONS) return null
  if (!Array.isArray(trail) || trail.length !== asked || !trail.every((a) => a === 'yes' || a === 'no' || a === 'maybe')) return null
  if (!isCount(lastPoints) || lastPoints > 3) return null
  return {
    snap: {
      phase,
      playerCount,
      rounds,
      names: Array.from({ length: 8 }, (_, i) => (names[i] as string | undefined) ?? ''),
      deck: deck as string[],
      index,
      scores: [...(scores as number[])],
      asked,
      trail: [...(trail as WhoSnap['trail'])],
      lastPoints
    },
    deck: people
  }
}

/** Who guesses card number `index` (0-based): the people take turns, round after round. */
export const guesserOf = (index: number, players: number): number => (players > 0 ? index % players : 0)

/** How many cards a game has: every person guesses `rounds` times, but there are never more cards than people on the cards. */
export function cardsFor(players: number, rounds: number, available: number = WHO_PEOPLE.length): number {
  if (players <= 0 || rounds <= 0) return 0
  return Math.min(players * rounds, available)
}
