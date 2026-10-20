/**
 * The small pure functions of the new games of "Mose" (`utils/moseGames.ts`): the plaiting of the little basket (which cells the reed runs in front of), the glow of the bush, the
 * differences between two pictures, the beat of Miriam's drum, the days of the manna, the words of a sentence and the answers to the pillar of cloud. The games draw and time only what these
 * say; the tests use them directly.
 */
import { seeded } from '@/utils/jakobGames'

// ------------------------------------------------------------------ the little basket

export type WeavePattern = 'same' | 'alternate'

/**
 * The cells where the reed runs in front of the stake: `rows` rows of `stakes` cells; in the pattern `same` every row begins in front of the first stake (front, behind, front, ...), in the
 * pattern `alternate` every row begins the other way round than the row before (the first row begins in front).
 */
export function frontCells(rows: number, stakes: number, pattern: WeavePattern): boolean[][] {
  return Array.from({ length: rows }, (_, r) => Array.from({ length: stakes }, (_, s) => (pattern === 'same' ? s % 2 === 0 : (s + r) % 2 === 0)))
}

/** How many cells have to be tapped in all (the reed in front). */
export const frontCount = (cells: boolean[][]): number => cells.reduce((n, row) => n + row.filter(Boolean).length, 0)

// ------------------------------------------------------------------ the glow

/** How strong the glow is at a distance (percent of the width) when it shines over `radius`: 1 close to the bush, 0 far away, soft in between. */
export function glow(distance: number, radius: number): number {
  if (radius <= 0) return 0
  const x = Math.min(1, Math.max(0, 1 - distance / radius))
  return x * x * (3 - 2 * x)
}

/** Moses is at the bush when he is closer than the threshold. */
export const found = (distance: number, threshold: number): boolean => distance <= threshold

/** The distance of two places (percent of the picture, which is 4 : 3: a percent of the height counts three quarters of a percent of the width). */
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, (a.y - b.y) * 0.75)

// ------------------------------------------------------------------ the differences

export interface DiffThing {
  x: number
  y: number
  w: number
}
/** A tap hits the extra thing when it lies within half its width (at least `min` percent) of its middle (4 : 3 picture). */
export const diffHit = (item: DiffThing, tap: { x: number; y: number }, min = 5): boolean => distance(item, tap) <= Math.max(item.w / 2, min)

/** The extra thing that a tap hits, nearest first; `-1` when none. Things that are found already do not count. */
export function diffAt(items: DiffThing[], tap: { x: number; y: number }, taken: boolean[], min = 5): number {
  let best = -1
  let bestD = Infinity
  items.forEach((it, i) => {
    if (taken[i] || !diffHit(it, tap, min)) return
    const d = distance(it, tap)
    if (d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

// ------------------------------------------------------------------ the drum

/** A tap is in time when it is within `window` seconds of the moment the ring reaches the drum. */
export const judge = (tapTime: number, beatTime: number, window = 0.25): boolean => Math.abs(tapTime - beatTime) <= window

/** The moments (seconds from the start) at which the rings reach the drum: one slot for every entry of the pattern, a `1` is a ring, a `0` a pause. */
export function ringTimes(bpm: number, pattern: (0 | 1)[], lead = 0): number[] {
  const gap = 60 / bpm
  const out: number[] = []
  pattern.forEach((p, i) => {
    if (p === 1) out.push(lead + i * gap)
  })
  return out
}

/** The ring that a tap belongs to: the nearest one that is not hit yet, within the window; `-1` when none. */
export function ringFor(times: number[], hit: boolean[], tapTime: number, window = 0.25): number {
  let best = -1
  let bestD = Infinity
  times.forEach((t, i) => {
    const d = Math.abs(tapTime - t)
    if (!hit[i] && d <= window && d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

// ------------------------------------------------------------------ the manna

/** The day is right when the jars that are full are as many as the day needs (`0` jars is the day of rest). */
export function dayOk(day: { jars: number }, collected: number, perJar: number): boolean {
  if (perJar <= 0) return false
  return collected === day.jars * perJar
}

// ------------------------------------------------------------------ the words

/** The words of a sentence (cut at the blanks). */
export const wordsOf = (sentence: string): string[] => sentence.split(' ').filter(Boolean)

/** The word that comes next after the words that are placed already; `undefined` when the sentence is whole. */
export const nextWord = (sentence: string, placed: string[]): string | undefined => wordsOf(sentence)[placed.length]

/** The words in a mixed order that is always the same for the same seed and never the right order (when there is more than one different word). */
export function shuffle(words: string[], seed: number): string[] {
  const r = seeded(seed)
  const mix = () => {
    const a = words.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      ;[a[i], a[j]] = [a[j]!, a[i]!]
    }
    return a
  }
  let out = mix()
  const different = new Set(words).size > 1
  for (let k = 0; k < 20 && different && out.join(' ') === words.join(' '); k++) out = mix()
  return out
}

// ------------------------------------------------------------------ the pillar of cloud

export type Pillar = 'rises' | 'stays'
export type Answer = 'go' | 'stay'
/** The right answer to the pillar: when it rises the people break up, when it stays they stay. */
export const answerOk = (trial: { pillar: Pillar }, answer: Answer): boolean => (trial.pillar === 'rises') === (answer === 'go')

/** Never three times the same in a row. */
export function noTriple(trials: { pillar: Pillar }[]): boolean {
  for (let i = 2; i < trials.length; i++) if (trials[i]!.pillar === trials[i - 1]!.pillar && trials[i]!.pillar === trials[i - 2]!.pillar) return false
  return true
}
