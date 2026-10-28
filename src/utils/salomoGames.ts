/**
 * The pure parts of the new games of "Solomon" (the components only draw and listen): how fast a stone is pulled across the building site (lay the stones quietly) and whether it lies over its gap, and which side
 * of the throne a lion belongs to and whether a step is full (build the throne). Places are percent of the picture; where a height is mixed with a width the heights are first turned into units of the picture width
 * (the pictures are 4:3). Times are in milliseconds, speeds in percent of the picture width per second.
 */

/** The pictures of the games are 4:3: one percent of the height is three quarters of one percent of the width. */
export const ASPECT = 3 / 4

/** The distance between two places (percent of the picture, the height counted in units of the width). */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) * ASPECT)
}

/* ------------------------------------------------------------------ Lay the stones quietly */

/** One place of the finger while a stone is pulled: percent of the picture and the time (ms). */
export interface QuietSample {
  x: number
  y: number
  t: number
}

/** How far back the speed is looked at (ms): a short stretch, so that one fast jerk is heard and one slow pull is not. */
export const QUIET_WINDOW_MS = 160
/** A stretch shorter than this (ms) is too short to judge. */
export const QUIET_MIN_MS = 40

/** The speed of the stone in percent of the picture width per second, measured over the last `windowMs` of the samples (0 when there are too few). */
export function quietSpeed(samples: QuietSample[], windowMs = QUIET_WINDOW_MS): number {
  if (samples.length < 2) return 0
  const last = samples[samples.length - 1]!
  let first = last
  for (let i = samples.length - 2; i >= 0; i--) {
    const s = samples[i]!
    if (last.t - s.t > windowMs) break
    first = s
  }
  const dt = last.t - first.t
  if (dt < QUIET_MIN_MS) return 0
  return (dist(first, last) / dt) * 1000
}

/** Whether the stone is pulled too fast (a "klack"): faster than the limit of the round. */
export function isLoud(speed: number, max: number): boolean {
  return speed > max
}

/** How loud the meter shows it: 0 quiet, 1 louder, 2 loud (the share of the limit: below 55 percent, below the limit, above it). */
export function loudness(speed: number, max: number): 0 | 1 | 2 {
  if (speed > max) return 2
  return speed > max * 0.55 ? 1 : 0
}

/** Whether the stone, put down with its middle at `p`, lies over the gap (middle `x`/`y`, width `w`): within about two thirds of the width of the gap. */
export function overGap(p: { x: number; y: number }, gap: { x: number; y: number; w: number }): boolean {
  return dist(p, gap) <= gap.w * 0.7
}

/** The nearest gap that is still open and under the stone, or -1. */
export function gapAt(p: { x: number; y: number }, gaps: { x: number; y: number; w: number }[], filled: boolean[]): number {
  let best = -1
  let bestDist = Infinity
  gaps.forEach((g, i) => {
    if (filled[i]) return
    const d = dist(p, g)
    if (d <= g.w * 0.7 && d < bestDist) {
      best = i
      bestDist = d
    }
  })
  return best
}

/* ------------------------------------------------------------------ Build the throne */

export type ThroneSide = 'left' | 'right'

/** The side of the throne a lion belongs to: a lion that looks to the right stands on the left of the throne and looks toward the middle, and the other way round. */
export function lionSide(facing: ThroneSide): ThroneSide {
  return facing === 'right' ? 'left' : 'right'
}

export type PlaceResult = 'ok' | 'wrongSide' | 'full' | 'noSlot'

/** What happens when a lion is put on a slot: right side and free = ok; the wrong side; a slot that already has a lion. */
export function placeLion(facing: ThroneSide, slotSide: ThroneSide | 'arm-left' | 'arm-right', taken: boolean): PlaceResult {
  if (taken) return 'full'
  const side: ThroneSide = slotSide === 'arm-left' ? 'left' : slotSide === 'arm-right' ? 'right' : slotSide
  return lionSide(facing) === side ? 'ok' : 'wrongSide'
}

/** The slot under a place in the picture (middle `x`/`y`, width `w`), or -1: the nearest one within its width. */
export function slotAt(p: { x: number; y: number }, slots: { x: number; y: number; w: number }[]): number {
  let best = -1
  let bestDist = Infinity
  slots.forEach((s, i) => {
    const d = dist(p, s)
    if (d <= s.w && d < bestDist) {
      best = i
      bestDist = d
    }
  })
  return best
}
