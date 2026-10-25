/**
 * The pure parts of the new games of "Samuel und Saul" (the components only draw and listen): which robe fits (the little robe), where the cart drifts and whether it is still on the road (two cows pull home),
 * whether a stone stands in the middle between two landmarks (the stone of help), which place comes next (follow the donkeys), which piles can hide a tall man (where is Saul) and how far a man has walked away
 * (hold the people together). All times are in milliseconds.
 */
import type { GatherLeave } from '@/types/adventure'

/* ------------------------------------------------------------------ The little robe */

/** How far (a share) the width of a robe may differ from the width that fits and still be taken as the right one. */
export const COAT_TOLERANCE = 0.12

/** Whether a robe of the width `coatW` fits a boy of the width `boyW`: it is `ratio` times as wide as the boy (a little narrower than the boy with his arms out), with a little room. */
export function coatFits(coatW: number, boyW: number, ratio: number, tolerance = COAT_TOLERANCE): boolean {
  const want = boyW * ratio
  return Math.abs(coatW - want) <= want * tolerance
}

/** The index of the one robe that fits, or -1 when none or more than one fits (a round must have exactly one). */
export function fittingCoat(coats: number[], boyW: number, ratio: number): number {
  const hits = coats.map((c, i) => (coatFits(c, boyW, ratio) ? i : -1)).filter((i) => i >= 0)
  return hits.length === 1 ? hits[0]! : -1
}

/** Whether a wrong robe is too small or too big (for the words of the answer). */
export function coatMiss(coatW: number, boyW: number, ratio: number): 'small' | 'big' | 'fits' {
  if (coatFits(coatW, boyW, ratio)) return 'fits'
  return coatW < boyW * ratio ? 'small' : 'big'
}

/* ------------------------------------------------------------------ Two cows pull home */

/** The cart moves sideways in the unit "half the road" (0 = the middle, -100 = the left edge, 100 = the right edge). */
export const ROAD_HALF = 100
/** How far one tap nudges the cart back (half roads). */
export const NUDGE = 52
/** How long a segment of the drifting lasts: the cows are drawn to the same side for this long. */
export const DRIFT_SEGMENT_MS = 2300
/** The sides the cows are drawn to, segment after segment (the same in every game, so that the rounds can be tested). */
export const DRIFT_PATTERN = [1, 1, -1, 1, -1, -1, 1, -1, 1, 1, -1, -1, 1, -1, 1, -1] as const
/** How long the cows graze after they have stepped on the grass (the way does not go on meanwhile). */
export const GRAZE_MS = 1300

/** The sideways speed (half roads per second) of the drifting at the time `elapsed` of the way; `drift` is the strength of the round. */
export function driftVelocity(elapsed: number, drift: number): number {
  const seg = Math.floor(Math.max(0, elapsed) / DRIFT_SEGMENT_MS) % DRIFT_PATTERN.length
  return drift * DRIFT_PATTERN[seg]!
}

/** The place of the cart after `dt` ms of drifting. */
export function driftStep(x: number, dt: number, elapsed: number, drift: number): number {
  return x + (driftVelocity(elapsed, drift) * dt) / 1000
}

/** A tap on the left half of the picture nudges the cart to the left, on the right half to the right. */
export function nudge(x: number, side: 'left' | 'right'): number {
  return side === 'left' ? x - NUDGE : x + NUDGE
}

/** Whether the cart is still on the road (its wheels do not touch the grass). */
export function onRoad(x: number, margin = 0): boolean {
  return Math.abs(x) <= ROAD_HALF - margin
}

/** How far the cart has come (0 to 1) after `elapsed` ms of a way that takes `dur` ms. */
export function wayProgress(elapsed: number, dur: number): number {
  return dur <= 0 ? 1 : Math.min(1, Math.max(0, elapsed / dur))
}

/** The longest the cart can go without a tap before it reaches the grass (ms); a round is fair when this is shorter than the way, so the child has to tap, and longer than one segment, so a single tap is enough. */
export function untouchedMs(drift: number): number {
  let x = 0
  let t = 0
  for (; t < 120000; t += 20) {
    x = driftStep(x, 20, t, drift)
    if (!onRoad(x)) return t
  }
  return Infinity
}

/* ------------------------------------------------------------------ The stone of help */

/** How far from the middle (a share of the distance between the landmarks) the stone may stand. */
export const STONE_TOLERANCE = 0.08

/** The middle between two landmarks. */
export function midpoint(a: number, b: number): number {
  return (a + b) / 2
}

/** Whether a stone at `x` stands in the middle between the landmarks at `a` and `b` (eight percent of their distance too far to one side is still right). */
export function stoneOk(x: number, a: number, b: number, tolerance = STONE_TOLERANCE): boolean {
  return Math.abs(x - midpoint(a, b)) <= Math.abs(b - a) * tolerance
}

/** Which landmark the stone stands too near to (for the words of the answer), or `outside` when it is not between them at all. */
export function stoneSide(x: number, a: number, b: number): 'ok' | 'a' | 'b' | 'outside' {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (x < lo || x > hi) return 'outside'
  if (stoneOk(x, a, b)) return 'ok'
  return Math.abs(x - a) < Math.abs(x - b) ? 'a' : 'b'
}

/* ------------------------------------------------------------------ Follow the donkeys */

/** The place that must be visited next (the index into the places), or -1 when the way is done. */
export function nextPlace(order: number[], done: number): number {
  return done >= 0 && done < order.length ? order[done]! : -1
}

/* ------------------------------------------------------------------ Where is Saul */

/** Whether a pile of the height `pileH` can hide a man of the height `saulH` (he must not stick out). */
export function canHide(pileH: number, saulH: number): boolean {
  return pileH >= saulH
}

/** The indexes of the piles that can hide Saul. */
export function hidingSpots(heights: number[], saulH: number): number[] {
  return heights.map((h, i) => (canHide(h, saulH) ? i : -1)).filter((i) => i >= 0)
}

/* ------------------------------------------------------------------ Hold the people together */

/** How long a man needs to walk from his place to the edge of the picture (ms). */
export const WALK_MS = 3800
/** How long a man who has been lost stays away before he comes back, ashamed (ms). */
export const SHAME_MS = 1800

/** How many days have passed after `elapsed` ms (a day is `dayMs` long). */
export function daysPassed(elapsed: number, dayMs: number): number {
  return dayMs <= 0 ? 0 : Math.floor(Math.max(0, elapsed) / dayMs)
}

/** How far a man who began to leave at `leftAt` has walked at `elapsed` (0 = still at home, 1 = at the edge). */
export function walkProgress(elapsed: number, leftAt: number | null): number {
  if (leftAt === null) return 0
  return Math.min(1, Math.max(0, (elapsed - leftAt) / WALK_MS))
}

/** Whether a man has reached the edge of the picture. */
export function atEdge(progress: number): boolean {
  return progress >= 1
}

/** The place of a man (percent of the picture width) who has walked `progress` of the way from his home to the edge (left edge -8, right edge 108). */
export function walkX(home: number, dir: -1 | 1, progress: number): number {
  const edge = dir < 0 ? -8 : 108
  return home + (edge - home) * Math.min(1, Math.max(0, progress))
}

/** The waiting is over after `days` days of `dayMs`. */
export function waitOver(elapsed: number, days: number, dayMs: number): boolean {
  return elapsed >= days * dayMs
}

/** The indexes of the leaves of the round that are due at the time `elapsed` and have not begun yet. */
export function dueLeaves(leaves: GatherLeave[], elapsed: number, started: ReadonlySet<number>): number[] {
  return leaves.map((l, i) => (!started.has(i) && elapsed >= l.at ? i : -1)).filter((i) => i >= 0)
}
