/**
 * The family activity: one device in the middle, teams take turns. One person sees a word and explains, draws (on paper) or acts it
 * out; the team guesses until the time is up. These are the pure parts (the cards, the ways to show a word, the turns), so they can be
 * tested.
 */
import { ACTIVITY_WORDS, type ActivityLocale, type ActivityWord } from '@/data/activityWords'
import { shuffle } from '@/utils/familyQuiz'

export type ActivityMode = 'explain' | 'draw' | 'act'
export type ActivityKind = 'all' | 'person' | 'thing'

export const ACTIVITY_MODES: readonly ActivityMode[] = ['explain', 'draw', 'act']
export const TEAM_CHOICES = [2, 3, 4] as const
export const CARD_CHOICES = [3, 5, 8] as const
export const SECOND_CHOICES = [60, 90, 120] as const

export interface ActivityCard {
  word: string
  mode: ActivityMode
}

/** The words of one kind (or all), in the language of the app. */
export function wordsFor(kind: ActivityKind, locale: ActivityLocale, list: readonly ActivityWord[] = ACTIVITY_WORDS): string[] {
  return list.filter((w) => kind === 'all' || w.kind === kind).map((w) => w[locale])
}

/**
 * `count` different cards, each with one of the allowed ways to show it (they change from card to card so nobody draws all evening).
 * With fewer words than cards asked for, there are as many cards as words; with no way allowed, all three are used.
 */
export function buildDeck(words: readonly string[], count: number, modes: readonly ActivityMode[], rand: () => number = Math.random): ActivityCard[] {
  const usable = modes.length ? modes : ACTIVITY_MODES
  return shuffle(words, rand)
    .slice(0, Math.max(0, count))
    .map((word, i) => ({ word, mode: usable[Math.floor(rand() * usable.length)] ?? usable[i % usable.length]! }))
}

/** Which team is on turn: the teams take turns, card after card. */
export const teamOnTurn = (cardIndex: number, teams: number): number => (teams > 0 ? cardIndex % teams : 0)
