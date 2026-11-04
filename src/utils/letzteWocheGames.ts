/**
 * The pure parts of the three new games of "The last week" (the components only draw and listen):
 * "Prepare the way" (`bereiten`, Matthew 21,7-8: cloaks and branches on the road, no stones),
 * "Fill the lamps" (`lampen`, Matthew 25,1-13: pour oil up to the golden mark) and
 * "Who needs what?" (`helfen`, Matthew 25,35-36: bring each person what he or she needs).
 * Places are percent of the picture. The arithmetic has no clock and no dice of its own.
 */
import { mistakeStars } from '@/utils/adventureScore'
import type { HelpGame, HelpNeed, HelpPerson, OilLampGame, OilLampRound, PrepareGame, PrepareRound } from '@/types/adventure'

/**
 * Stars at the end of the three games: the mistakes of all rounds against the number of rounds (the same steps as the games of "Zacchaeus and Lazarus"):
 * two rounds: up to 2 mistakes three stars, up to 5 two stars, then one.
 */
export function weekStars(mistakes: number, rounds: number): number {
  const r = Math.max(1, rounds)
  return mistakeStars(mistakes, r, r * 2 + 1)
}

/** A point lies inside a rectangle (with a margin around it); the rectangles are those of the browser (`getBoundingClientRect`). */
export function pointIn(rect: { left: number; top: number; right: number; bottom: number }, x: number, y: number, pad = 0): boolean {
  return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad
}

// ---------------------------------------------------------------- 1. prepare the way (`bereiten`)

export type PileKind = 'cloak' | 'branch' | 'stone'

/** The indices of the bare places (in `spots`) that a round uses, from the left: named in `use`, otherwise spread evenly (three of five: the first, the middle and the last). */
export function prepareUsed(game: Pick<PrepareGame, 'spots'>, round: Pick<PrepareRound, 'fields' | 'use'>): number[] {
  const m = game.spots.length
  if (round.use && round.use.length) return [...round.use].sort((a, b) => a - b)
  const n = Math.max(1, Math.min(round.fields, m))
  if (n === 1) return [Math.floor((m - 1) / 2)]
  return Array.from({ length: n }, (_, i) => Math.round((i * (m - 1)) / (n - 1)))
}

/** How many places are covered one after the other from the left (the donkey can walk over them). */
export function prepareReach(covered: readonly boolean[]): number {
  let c = 0
  while (c < covered.length && covered[c]) c++
  return c
}

/**
 * Where the donkey stands (the middle of its lower edge). At the start at its place, then on the last place that is laid one after the other from the left; in a slow round it walks up to the edge of the next bare place
 * and waits there; when the road is covered it goes on to the city gate.
 */
export function prepareDonkeyAt(game: PrepareGame, round: Pick<PrepareRound, 'fields' | 'use' | 'slow'>, covered: readonly boolean[]): { x: number; y: number } {
  const used = prepareUsed(game, round)
  const c = prepareReach(covered)
  if (c >= used.length) return { x: game.gate.x - game.gate.w * 0.7, y: game.gate.y }
  if (round.slow) {
    const next = game.spots[used[c]!]!
    return { x: Math.max(game.donkey.x, next.x - game.field * 0.7), y: next.y }
  }
  if (c === 0) return { x: game.donkey.x, y: game.donkey.y }
  const last = game.spots[used[c - 1]!]!
  return { x: last.x, y: last.y }
}

/** The picture of the next thing that is laid: the cloaks and the branches take turns through their pictures (a count of what was laid already). */
export function prepareSprite(game: Pick<PrepareGame, 'cloaks' | 'branches' | 'stone'>, kind: PileKind, laid: number) {
  if (kind === 'stone') return game.stone
  const list = kind === 'cloak' ? game.cloaks : game.branches
  return list[laid % Math.max(1, list.length)]!
}

/** What a drop does: a cloak or branches on a bare place are laid; on a covered place nothing happens (no mistake); a stone on a bare place is a mistake; on a covered place nothing happens. */
export function prepareDrop(kind: PileKind, coveredAlready: boolean): 'lay' | 'full' | 'stone' {
  if (coveredAlready) return 'full'
  return kind === 'stone' ? 'stone' : 'lay'
}

/** The problems of the data of `prepare` (an empty list is good). */
export function prepareProblems(game: PrepareGame): string[] {
  const out: string[] = []
  if (game.spots.length !== 5) out.push('five bare places are needed')
  game.spots.forEach((s, i) => {
    if (s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100) out.push(`place ${i + 1} lies outside the picture`)
    if (i > 0 && s.x <= game.spots[i - 1]!.x) out.push(`place ${i + 1} must lie to the right of the one before`)
    if (i > 0 && s.x - game.spots[i - 1]!.x < game.field) out.push(`the places ${i} and ${i + 1} overlap`)
  })
  if (game.field <= 0) out.push('the width of a place is missing')
  if (game.cloaks.length < 3) out.push('three cloaks are needed')
  if (game.branches.length < 2) out.push('two kinds of branches are needed')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    if (r.fields < 1 || r.fields > game.spots.length) out.push(`round ${i + 1}: between one and ${game.spots.length} places`)
    const used = prepareUsed(game, r)
    if (r.use && (r.use.length !== r.fields || new Set(r.use).size !== r.use.length || r.use.some((u) => u < 0 || u >= game.spots.length))) out.push(`round ${i + 1}: the named places do not fit`)
    if (used.length && game.spots[used[0]!] && game.donkey.x >= game.spots[used[0]!]!.x) out.push(`round ${i + 1}: the donkey must start left of the first place`)
    if (used.length && game.spots[used[used.length - 1]!] && game.gate.x <= game.spots[used[used.length - 1]!]!.x) out.push(`round ${i + 1}: the gate must lie right of the last place`)
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.fields <= game.rounds[0]!.fields) out.push('round 2 should have more places than round 1')
  return out
}

// ---------------------------------------------------------------- 2. fill the lamps (`lampen`)

/** How fast the oil rises while the jug is held: percent of the glass opening per second (a full lamp in about four and a half seconds). */
export const LAMP_RATE = 22
/** How much one tap pours (percent of the glass opening); a tap never jumps over the window of the mark. */
export const LAMP_STEP = 7.5
/** The tolerance of the rounds when the data do not name one: round 1 ten percent, later rounds seven. */
export const LAMP_TOLERANCES = [10, 7]

/** The tolerance of a round (percent of the glass opening, up and down from the mark). */
export function lampTolerance(round: Pick<OilLampRound, 'tolerance'>, roundIndex: number): number {
  return round.tolerance ?? LAMP_TOLERANCES[Math.min(Math.max(0, roundIndex), LAMP_TOLERANCES.length - 1)]!
}

/** The level after pouring for `ms` milliseconds (never above the top). */
export const lampPour = (level: number, ms: number): number => Math.min(100, Math.max(0, level + (LAMP_RATE * Math.max(0, ms)) / 1000))

/** The level after one tap. */
export const lampTap = (level: number): number => Math.min(100, level + LAMP_STEP)

/** The oil at the mark (within the tolerance) is right; below it is too little, above it too much. */
export function lampJudge(level: number, mark: number, tolerance: number): 'low' | 'ok' | 'high' {
  if (level < mark - tolerance - 1e-9) return 'low'
  if (level > mark + tolerance + 1e-9) return 'high'
  return 'ok'
}

/** The oil has reached the window of the mark from below (used when pouring by taps: the lamp lights as soon as the oil stands in the window). */
export const lampInWindow = (level: number, mark: number, tolerance: number): boolean => lampJudge(level, mark, tolerance) === 'ok'

/** Where the golden ring lies in the lamp picture: top in percent of the lamp picture, from the top (the mark is counted from the bottom of the glass opening). */
export const lampMarkTop = (mark: number, glass: OilLampGame['glass']): number => glass.y + glass.h * (1 - mark / 100)

/** The problems of the data of `lamps` (an empty list is good). */
export function lampProblems(game: OilLampGame): string[] {
  const out: string[] = []
  const g = game.glass
  if (g.x < 0 || g.y < 0 || g.w <= 0 || g.h <= 0 || g.x + g.w > 100 || g.y + g.h > 100) out.push('the glass opening lies outside the lamp picture')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const tol = lampTolerance(r, i)
    if (r.marks.length < 1 || r.marks.length > 4) out.push(`round ${i + 1}: one to four lamps`)
    if (tol < 3 || tol > 15) out.push(`round ${i + 1}: the tolerance must lie between 3 and 15`)
    if (tol * 2 < LAMP_STEP) out.push(`round ${i + 1}: the tolerance is smaller than one tap`)
    r.marks.forEach((m, k) => {
      if (m - tol < 15 || m + tol > 97) out.push(`round ${i + 1}, lamp ${k + 1}: the mark is too low or too high`)
      if (k > 0 && Math.abs(m - r.marks[k - 1]!) < 10) out.push(`round ${i + 1}, lamp ${k + 1}: the mark is too close to the one before`)
    })
  })
  if (game.rounds.length >= 2) {
    const a = lampTolerance(game.rounds[0]!, 0)
    const b = lampTolerance(game.rounds[1]!, 1)
    if (b >= a) out.push('round 2 needs a narrower tolerance than round 1')
  }
  return out
}

// ---------------------------------------------------------------- 3. who needs what (`helfen`)

/** The card that fits a person: the card of the same need. */
export const helpFits = (card: HelpNeed, person: HelpNeed): boolean => card === person

/** The people of a round, in the order of the round. */
export function helpActive(game: Pick<HelpGame, 'people' | 'rounds'>, roundIndex: number): HelpPerson[] {
  const r = game.rounds[Math.min(roundIndex, game.rounds.length - 1)]
  return (r?.people ?? []).map((id) => game.people.find((p) => p.id === id)).filter((p): p is HelpPerson => !!p)
}

/** The people of the rounds before: they stand glad in the village. */
export function helpBefore(game: Pick<HelpGame, 'people' | 'rounds'>, roundIndex: number): HelpPerson[] {
  const ids = game.rounds.slice(0, Math.max(0, roundIndex)).flatMap((r) => r.people)
  return ids.map((id) => game.people.find((p) => p.id === id)).filter((p): p is HelpPerson => !!p)
}

/** The box of a person (percent of the picture): from the left, the top and the width/height; the height follows the ratio and the 3:2 picture. */
export function helpBox(p: Pick<HelpPerson, 'x' | 'y' | 'w'>, ratio: number): { left: number; top: number; right: number; bottom: number } {
  const h = (p.w / Math.max(0.1, ratio)) * 1.5
  return { left: p.x - p.w / 2, right: p.x + p.w / 2, top: p.y - h, bottom: p.y }
}

/** The problems of the data of `help` (an empty list is good). */
export function helpProblems(game: HelpGame): string[] {
  const out: string[] = []
  const all: HelpNeed[] = ['hunger', 'durst', 'fremd', 'frieren', 'krank', 'gefangen']
  if (game.people.length !== 6) out.push('six people are needed')
  for (const id of all) if (game.people.filter((p) => p.id === id).length !== 1) out.push(`exactly one person "${id}" is needed`)
  const ids = game.rounds.flatMap((r) => r.people)
  if (new Set(ids).size !== ids.length) out.push('a person is asked for in two rounds')
  for (const id of all) if (!ids.includes(id)) out.push(`the person "${id}" is in no round`)
  game.rounds.forEach((r, i) => {
    if (r.people.length !== 3) out.push(`round ${i + 1}: three people`)
  })
  if (game.ratio <= 0) out.push('the ratio of the sprites is missing')
  for (const p of game.people) {
    const b = helpBox(p, game.ratio || 1)
    if (b.left < 0 || b.right > 100 || b.top < 0 || b.bottom > 100) out.push(`${p.id} lies outside the picture`)
  }
  for (let i = 0; i < game.people.length; i++)
    for (let k = i + 1; k < game.people.length; k++) {
      const a = helpBox(game.people[i]!, game.ratio || 1)
      const b = helpBox(game.people[k]!, game.ratio || 1)
      const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      if (dx > game.people[i]!.w * 0.3 && dy > 0) out.push(`${game.people[i]!.id} and ${game.people[k]!.id} overlap`)
    }
  return out
}
