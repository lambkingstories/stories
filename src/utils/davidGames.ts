/**
 * The pure parts of the new games of "David" (the components only draw and listen): how fast the strings may be plucked to calm Saul (calm Saul), where a beast walks and whether David guards a lamb (protect the flock),
 * which stones are smooth (smooth stones), where the stone of the sling points and whether that is a hit (the sling), how far an arrow flies and whether it lands in its zone (the sign of the arrows), and how far a finger has
 * followed a seam (the hem). All times are in milliseconds, all places are percent of the picture; where a height is mixed with a width the heights are first turned into units of the picture width (the pictures are 4:3).
 */

/** The pictures of the games are 4:3: one percent of the height is three quarters of one percent of the width. */
export const ASPECT = 3 / 4

/** The distance between two places (percent of the picture, the height counted in units of the width). */
export function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) * ASPECT)
}

/* ------------------------------------------------------------------ Calm Saul */

/** A note plucked faster than this after the last one is a jangle in every round (ms). */
export const HARP_JANGLE_MS = 200

/** Whether a plucked string is calm or a jangle: `gap` is the time since the last note (null for the first note or after a long pause), `minGap` the least pause of the round. */
export function pluckKind(gap: number | null, minGap: number): 'calm' | 'jangle' {
  if (gap === null) return 'calm'
  return gap < Math.max(minGap, HARP_JANGLE_MS) ? 'jangle' : 'calm'
}

/** How much calm Saul has after a note: a calm note adds one (never more than `need`), a jangle takes two away (never below zero). */
export function harpCalm(calm: number, kind: 'calm' | 'jangle', need: number): number {
  if (kind === 'calm') return Math.min(need, calm + 1)
  return Math.max(0, calm - 2)
}

/** Which of the three pictures of Saul is shown (0 restless, 1 tired, 2 calm): the third of the need decides, a full need is always calm. */
export function saulState(calm: number, need: number): 0 | 1 | 2 {
  if (calm >= need) return 2
  const third = need / 3
  return calm < third ? 0 : calm < 2 * third ? 1 : 2
}

/** The string under a finger: the strings stand at the equal distances `x0`, `x0 + step` … `x1` (fractions of the harp's width); the nearest one within half a step is hit, else -1. */
export function stringAt(frac: number, n: number, x0: number, x1: number): number {
  if (n < 2 || x1 <= x0) return -1
  const step = (x1 - x0) / (n - 1)
  const i = Math.round((frac - x0) / step)
  if (i < 0 || i >= n) return -1
  return Math.abs(frac - (x0 + i * step)) <= step * 0.5 ? i : -1
}

/** The tone of a string: the pitch rate of the sound, from the low string (0.75) upward in the steps of a pentatonic scale (so that any stroke sounds friendly). */
export function stringRate(i: number): number {
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]
  const semis = scale[Math.max(0, Math.min(i, scale.length - 1))]!
  return Number((0.75 * Math.pow(2, semis / 12)).toFixed(3))
}

/* ------------------------------------------------------------------ Protect the flock */

/** How far along its way a beast is at the time `elapsed` (0 = at the edge, 1 = at the lamb); it starts after `delay` and needs `dur`. */
export function threatProgress(elapsed: number, delay: number, dur: number): number {
  if (dur <= 0) return 1
  return Math.max(0, Math.min(1, (elapsed - delay) / dur))
}

/** The place of a beast on its way from `from` to `to` (a straight walk). */
export function threatPos(from: { x: number; y: number }, to: { x: number; y: number }, progress: number): { x: number; y: number } {
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress }
}

/** Whether David stands near enough to a lamb to guard it. */
export function guards(david: { x: number; y: number }, lamb: { x: number; y: number }, radius: number): boolean {
  return dist(david, lamb) <= radius
}

/** How long a beast hesitates and trots away after it was stopped or has reached its lamb (ms). */
export const RETREAT_MS = 1800

/* ------------------------------------------------------------------ Smooth stones */

/** A smooth stone is right, a rough one is a mistake. */
export function pebbleOk(kind: 'smooth' | 'rough'): boolean {
  return kind === 'smooth'
}

/* ------------------------------------------------------------------ The sling */

/** The place of the stone on its circle (percent of the picture width, the height counted in units of the width): `angle` in radians, 0 at the right of the hand, growing clockwise on the screen. */
export function slingPos(angle: number, centre: { x: number; y: number }, radius: number): { x: number; y: number } {
  return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) }
}

/** The angle of the stone at the time `elapsed` when one turn takes `period` ms. */
export function slingAngle(elapsed: number, period: number, start = 0): number {
  return start + (2 * Math.PI * Math.max(0, elapsed)) / Math.max(1, period)
}

/** The direction in which the stone flies when it is let go at `angle` (a unit vector, on the tangent of the circle in the sense of the turning). */
export function slingDirection(angle: number): { x: number; y: number } {
  return { x: -Math.sin(angle), y: Math.cos(angle) }
}

/** How many degrees the flight direction of the stone differs from the direction to the target (both in units of the picture width). */
export function slingAimError(angle: number, centre: { x: number; y: number }, radius: number, target: { x: number; y: number }): number {
  const p = slingPos(angle, centre, radius)
  const v = slingDirection(angle)
  const dx = target.x - p.x
  const dy = target.y - p.y
  const len = Math.hypot(dx, dy)
  if (len === 0) return 0
  const cos = Math.max(-1, Math.min(1, (v.x * dx + v.y * dy) / len))
  return (Math.acos(cos) * 180) / Math.PI
}

/** A hit: the aim is off by no more than `tol` degrees. */
export function slingHit(error: number, tol: number): boolean {
  return error <= tol
}

/** Where the stone ends: at the target after a hit, else on the straight line it flies along, stretched `reach` units beyond the place where it was let go. */
export function slingLanding(angle: number, centre: { x: number; y: number }, radius: number, target: { x: number; y: number }, hit: boolean, reach = 120): { x: number; y: number } {
  if (hit) return target
  const p = slingPos(angle, centre, radius)
  const v = slingDirection(angle)
  return { x: p.x + v.x * reach, y: p.y + v.y * reach }
}

/* ------------------------------------------------------------------ The sign of the arrows */

/** Where an arrow lands (percent of the picture width) when the string is pulled back by `pull` (0 to 1): linear from `min` to `max`. */
export function arrowLanding(pull: number, min: number, max: number): number {
  const p = Math.max(0, Math.min(1, pull))
  return min + (max - min) * p
}

/** The pull (0 to 1) of a drag of `dragPx` pixels when the longest drag is `fullPx`. */
export function arrowPull(dragPx: number, fullPx: number): number {
  if (fullPx <= 0) return 0
  return Math.max(0, Math.min(1, dragPx / fullPx))
}

/** Whether the arrow landed in the zone of the sign. */
export function arrowZoneHit(x: number, zone: { from: number; to: number }): boolean {
  return x >= zone.from && x <= zone.to
}

/** Whether the arrow was too short or too far for the zone (for the words of the answer). */
export function arrowMiss(x: number, zone: { from: number; to: number }): 'short' | 'far' | 'hit' {
  if (arrowZoneHit(x, zone)) return 'hit'
  return x < zone.from ? 'short' : 'far'
}

/* ------------------------------------------------------------------ The hem */

/** How far along the seam the finger may be ahead of what it has already followed (a share of the seam's length): a jump ahead does not count. */
export const HEM_REACH = 0.1
/** The seam counts as done at this share of its length. */
export const HEM_DONE = 0.97

/** The length of a polyline (in the units of the picture width, the height counted in units of the width). */
export function pathLength(points: { x: number; y: number }[]): number {
  let sum = 0
  for (let i = 1; i < points.length; i++) sum += dist(points[i - 1]!, points[i]!)
  return sum
}

/** The nearest place of a polyline to the point `p`: how far away it is (`off`, percent of the picture width) and how far along the polyline it lies (`along`, 0 to 1). */
export function nearestOnPath(points: { x: number; y: number }[], p: { x: number; y: number }): { off: number; along: number } {
  const total = pathLength(points)
  if (points.length < 2 || total === 0) return { off: dist(points[0] ?? p, p), along: 0 }
  let best = { off: Infinity, along: 0 }
  let walked = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const ax = a.x
    const ay = a.y * ASPECT
    const bx = b.x
    const by = b.y * ASPECT
    const px = p.x
    const py = p.y * ASPECT
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
    const off = Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
    const seg = Math.sqrt(len2)
    if (off < best.off) best = { off, along: (walked + seg * t) / total }
    walked += seg
  }
  return best
}

/** One step of following the seam: `progress` is how far (0 to 1) the finger has followed it; a point beyond `tol` from the seam is `off` (the stroke begins again), a point on the seam moves the progress on when it is not more than `HEM_REACH` ahead. */
export function hemStep(points: { x: number; y: number }[], progress: number, p: { x: number; y: number }, tol: number): { progress: number; off: boolean } {
  const near = nearestOnPath(points, p)
  if (near.off > tol) return { progress, off: true }
  if (near.along > progress + HEM_REACH) return { progress, off: false }
  return { progress: Math.max(progress, near.along), off: false }
}

/** Whether the seam is followed to its end. */
export function hemDone(progress: number): boolean {
  return progress >= HEM_DONE
}
