// Distances in the steering game (the sky is 3 : 4): positions are percentages of the width (x) and of the height (y).

/** A height of 1 % is 4/3 of a width of 1 %: all distances are measured in widths. */
export const SKY_ASPECT = 4 / 3

export interface SkyPoint {
  x: number
  y: number
}

/** Does the path from `a` to `b` touch the circle of radius `r` (percent of the width) around `c`? A fast swipe cannot skip a thing on its way. */
export function pathTouches(a: SkyPoint, b: SkyPoint, c: SkyPoint, r: number): boolean {
  const ax = a.x
  const ay = a.y * SKY_ASPECT
  const dx = b.x - ax
  const dy = b.y * SKY_ASPECT - ay
  const cx = c.x
  const cy = c.y * SKY_ASPECT
  const len2 = dx * dx + dy * dy
  const k = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / len2))
  return Math.hypot(ax + k * dx - cx, ay + k * dy - cy) <= r
}

/** Distance between two points, in widths. */
export const skyDistance = (a: SkyPoint, b: SkyPoint): number => Math.hypot(a.x - b.x, (a.y - b.y) * SKY_ASPECT)
