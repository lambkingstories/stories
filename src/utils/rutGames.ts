/**
 * The pure parts of the new games of "Rut" (the components only draw and listen): where a reaper is and which clump has fallen (gleaning), how full the measure is and whether the child let go at the mark (filling the measure),
 * where a walker is and where a called elder stops (calling the elders) and whether a rock of the cradle was calm (cradle). All times are in milliseconds.
 */
import type { EldersWalker, GleanReaper } from '@/types/adventure'

/* ------------------------------------------------------------------ Ears behind the reapers */

/** The middle of a reaper (percent of the picture width) at the time `elapsed` of the round: he enters at the left edge (-8) and has left at the right edge (108); before his start he is not there (null). */
export function reaperX(elapsed: number, r: Pick<GleanReaper, 'at' | 'dur'>): number | null {
  const p = (elapsed - r.at) / r.dur
  if (p < 0) return null
  return -8 + 116 * Math.min(1, p)
}

/** Whether the reaper has crossed the whole picture. */
export function reaperOver(elapsed: number, r: Pick<GleanReaper, 'at' | 'dur'>): boolean {
  return elapsed >= r.at + r.dur
}

/** Whether a clump at `clumpX` is already cut: the reaper has come to it (the reaper walks to the right). */
export function isCut(clumpX: number, reaper: number | null): boolean {
  return reaper !== null && reaper >= clumpX
}

/** How many ears a round leaves lying (one for every clump). */
export function earCount(reapers: Pick<GleanReaper, 'clumps'>[]): number {
  return reapers.reduce((n, r) => n + r.clumps.length, 0)
}

/** How long the ears lie in peace after the last reaper has left, before the round ends if some are still lying. */
export const GLEAN_GRACE_MS = 4500

/** The end of the round: all reapers are over and every ear is picked up, or the grace time after the last reaper has run out. */
export function gleanRoundOver(elapsed: number, reapers: Pick<GleanReaper, 'at' | 'dur' | 'clumps'>[], picked: number): boolean {
  if (!reapers.every((r) => reaperOver(elapsed, r))) return false
  if (picked >= earCount(reapers)) return true
  const end = Math.max(...reapers.map((r) => r.at + r.dur))
  return elapsed >= end + GLEAN_GRACE_MS
}

/* ------------------------------------------------------------------ Fill the measure */

/** How long the grain needs to fill the measure from empty to the brim (ms). */
export const FILL_MS = 4200
/** How far from the mark the child may let go (a share of the full measure). */
export const FILL_TOLERANCE = 0.08

/** The level of the measure (0 = empty, 1 = to the brim, more = spilling) after the finger has been held for `heldMs`. */
export function levelAt(heldMs: number): number {
  return Math.max(0, heldMs) / FILL_MS
}

/** How the level stands to the mark: `low` (keep holding), `ok` (let go now) or `high` (too much, it spills). */
export function judgeLevel(level: number, mark: number, tolerance = FILL_TOLERANCE): 'low' | 'ok' | 'high' {
  if (level > mark + tolerance) return 'high'
  if (level >= mark - tolerance) return 'ok'
  return 'low'
}

/** The two pictures of the five states (0 empty, 1 a quarter, 2 half, 3 three quarters, 4 full) that a level lies between, and how far it is on the way to the upper one (0 to 1). */
export function stateBlend(level: number, states = 5): { lo: number; hi: number; t: number } {
  const x = Math.min(1, Math.max(0, level)) * (states - 1)
  const lo = Math.min(states - 1, Math.floor(x))
  const hi = Math.min(states - 1, lo + 1)
  return { lo, hi, t: x - lo }
}

/* ------------------------------------------------------------------ Call the elders to the gate */

/** The middle of a walker (percent of the picture width) at the time `elapsed`: he enters at the left edge (-8) and has left at the right edge (108); before his start he is not there (null). */
export function walkerX(elapsed: number, w: Pick<EldersWalker, 'at' | 'dur'>): number | null {
  const p = (elapsed - w.at) / w.dur
  if (p < 0) return null
  return -8 + 116 * Math.min(1, p)
}

/** Whether the walker has crossed the whole picture. */
export function walkerOver(elapsed: number, w: Pick<EldersWalker, 'at' | 'dur'>): boolean {
  return elapsed >= w.at + w.dur
}

/** The round is over for good when every elder of it has been called; it begins again (the people walk past once more) when the walkers are all over and an elder is still missing. */
export function eldersCalled(walkers: Pick<EldersWalker, 'kind'>[], called: number): boolean {
  return called >= walkers.filter((w) => w.kind === 'elder').length
}

export function allWalkersOver(elapsed: number, walkers: Pick<EldersWalker, 'at' | 'dur'>[], taken: ReadonlySet<number>): boolean {
  return walkers.every((w, i) => taken.has(i) || walkerOver(elapsed, w))
}

/** The place of the n-th called elder (0-based) in the half circle, or the last place if there are more calls than places. */
export function seatFor<T>(n: number, seats: T[]): T {
  return seats[Math.min(seats.length - 1, Math.max(0, n))]!
}

/* ------------------------------------------------------------------ Rock the cradle */

export type Side = 'left' | 'right'
export type RockVerdict = 'first' | 'calm' | 'fast' | 'same' | 'slow'

/** The shortest and the longest calm gap between two rocks (ms); a longer break is simply a new start. */
export const CALM_MIN_MS = 600
export const CALM_MAX_MS = 1800

/**
 * How a rock is judged: the first one (or one after a long break) is only a start (`first`, no point, no mistake); then the other side after a calm gap is `calm` (one point),
 * the same side again is `same`, a gap that is too short is `fast` (both restless: a mistake); a gap that is too long is `slow` (a new start, no mistake).
 */
export function rockVerdict(prevSide: Side | null, side: Side, gapMs: number | null): RockVerdict {
  if (prevSide === null || gapMs === null) return 'first'
  if (gapMs > CALM_MAX_MS) return 'slow'
  if (side === prevSide) return 'same'
  if (gapMs < CALM_MIN_MS) return 'fast'
  return 'calm'
}

/** The state of the baby after `calm` calm rocks of all rounds together: 0 awake, 1 sleepy, 2 asleep (only at the very end, `total` calm rocks). */
export function cradleState(calm: number, total: number): 0 | 1 | 2 {
  if (calm >= total) return 2
  if (calm >= Math.min(8, Math.floor(total / 3))) return 1
  return 0
}

/** The angle of the cradle (degrees) while it rocks: it swings to the side that was tapped. */
export function rockAngle(side: Side | null, reduced: boolean): number {
  if (side === null) return 0
  const a = reduced ? 2 : 7
  return side === 'left' ? -a : a
}
