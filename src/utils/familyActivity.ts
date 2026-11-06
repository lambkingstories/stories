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

export const ACTIVITY_KINDS: readonly ActivityKind[] = ['all', 'person', 'thing']

/**
 * The round that can be taken up again ("keep playing"): plain data only. It is always kept at the hand-over of a card (before the
 * word is shown): the word of a card that was running stays the same, the time starts full again, and a point that was given is
 * already in `scores` (the index has moved on), so nothing is counted twice.
 */
export interface ActivitySnap {
  teamCount: number
  cardsEach: number
  seconds: number
  kind: ActivityKind
  modes: ActivityMode[]
  teamNames: string[]
  deck: ActivityCard[]
  index: number
  scores: number[]
}

const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0

/** Checks a kept round from the device: a state of the wrong shape (another app version, a broken entry) gives `null`. */
export function readActivitySnap(raw: unknown): ActivitySnap | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const { teamCount, cardsEach, seconds, kind, modes, teamNames, deck, index, scores } = s
  if (!isCount(teamCount) || teamCount < 2 || teamCount > 4) return null
  if (!isCount(cardsEach) || !(CARD_CHOICES as readonly number[]).includes(cardsEach)) return null
  if (!isCount(seconds) || !(SECOND_CHOICES as readonly number[]).includes(seconds)) return null
  if (typeof kind !== 'string' || !ACTIVITY_KINDS.includes(kind as ActivityKind)) return null
  if (!Array.isArray(modes) || !modes.every((m) => typeof m === 'string' && ACTIVITY_MODES.includes(m as ActivityMode))) return null
  if (!Array.isArray(teamNames) || teamNames.length > 8 || !teamNames.every((n) => typeof n === 'string')) return null
  if (!Array.isArray(deck) || deck.length < 1 || deck.length > 500) return null
  const cards: ActivityCard[] = []
  for (const c of deck as unknown[]) {
    if (!c || typeof c !== 'object') return null
    const { word, mode } = c as Record<string, unknown>
    if (typeof word !== 'string' || !word.trim() || typeof mode !== 'string' || !ACTIVITY_MODES.includes(mode as ActivityMode)) return null
    cards.push({ word, mode: mode as ActivityMode })
  }
  if (!isCount(index) || index >= cards.length) return null
  if (!Array.isArray(scores) || scores.length !== teamCount || !scores.every((n) => isCount(n) && n <= 1000)) return null
  return {
    teamCount,
    cardsEach,
    seconds,
    kind: kind as ActivityKind,
    modes: [...new Set(modes as ActivityMode[])],
    teamNames: Array.from({ length: 4 }, (_, i) => (teamNames[i] as string | undefined) ?? ''),
    deck: cards,
    index,
    scores: [...(scores as number[])]
  }
}

// ── Painting a word in the painting program ─────────────────────────────────────────────────────────────────────
// A card whose way is "paint" does not show the word on the medallion: the game opens the painting program on a blank sheet
// (`/app/coloring?activity=1`) with a band on top (the word, the sand, "Done"). The few things that program needs travel in
// `sessionStorage` (not in the address): the word, the seconds and when it began. The time is always counted from that start, so it
// stays right when the screen sleeps. Nothing of the picture is kept.

export const PAINT_HANDOFF_KEY = 'lk-activity-paint'
/** How long a hand-over may wait after the time has run out (the game was left, the app slept) before it is forgotten. */
const PAINT_GRACE_MS = 10 * 60 * 1000

export interface PaintHandoff {
  word: string
  seconds: number
  /** `Date.now()` at the moment the word was opened. */
  startedAt: number
  /** The card of the round it belongs to (so a hand-over of another round is never taken for this one). */
  index: number
}

/** Checks a hand-over: the wrong shape, an odd number of seconds or a hand-over that has long expired gives `null`. */
export function readPaintHandoff(raw: unknown, now: number = Date.now()): PaintHandoff | null {
  let v: unknown = raw
  if (typeof raw === 'string') {
    try {
      v = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!v || typeof v !== 'object') return null
  const { word, seconds, startedAt, index } = v as Record<string, unknown>
  if (typeof word !== 'string' || !word.trim() || word.length > 120) return null
  if (typeof seconds !== 'number' || !(SECOND_CHOICES as readonly number[]).includes(seconds)) return null
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) return null
  if (!isCount(index)) return null
  if (now - startedAt > seconds * 1000 + PAINT_GRACE_MS) return null
  return { word, seconds, startedAt, index }
}

/** Whole seconds that are left (rounded up, like the sand of the game), from 0 to all of them; a clock set back never gives more than the full time. */
export function paintSecondsLeft(h: Pick<PaintHandoff, 'seconds' | 'startedAt'>, now: number = Date.now()): number {
  const left = Math.ceil((h.startedAt + h.seconds * 1000 - now) / 1000)
  return Math.max(0, Math.min(h.seconds, left))
}

/** True when the hand-over belongs to the card that the kept round is on. */
export function paintFitsSnap(h: PaintHandoff, snap: ActivitySnap): boolean {
  return snap.index === h.index && snap.deck[snap.index]?.word === h.word
}

/** Keeps the hand-over; `false` when the device gives no room (then the game shows the word on the medallion instead). */
export function writePaintHandoff(h: PaintHandoff): boolean {
  try {
    sessionStorage.setItem(PAINT_HANDOFF_KEY, JSON.stringify(h))
    return !!loadPaintHandoff(h.startedAt)
  } catch {
    return false
  }
}

export function loadPaintHandoff(now: number = Date.now()): PaintHandoff | null {
  try {
    return readPaintHandoff(sessionStorage.getItem(PAINT_HANDOFF_KEY), now)
  } catch {
    return null
  }
}

export function clearPaintHandoff(): void {
  try {
    sessionStorage.removeItem(PAINT_HANDOFF_KEY)
  } catch {
    // nothing to forget
  }
}
