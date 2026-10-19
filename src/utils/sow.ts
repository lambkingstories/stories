/**
 * The throw of the sowing game: the child pulls the seed bag back (like a gentle sling) and lets go; the seed flies the other way and lands
 * on the field. Everything is in percent of the field (x from the left, y from the top). Plain functions, so that the game and the tests use the
 * same arithmetic.
 */
export interface Pt {
  x: number
  y: number
}

/** How far the seed flies for every unit the bag is pulled back. */
export const GAIN = 1.7
/** The longest pull (percent of the field) and the shortest one that counts as a throw. */
export const MAX_PULL = 52
export const MIN_PULL = 6
/** How far a full wind (1) drives the seed sideways per unit of flight (percent). */
export const WIND_DRIFT = 0.16

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The pull as a vector: the way from the bag to the finger, shortened to the longest pull. */
export function pullOf(drag: Pt): Pt {
  const len = Math.hypot(drag.x, drag.y)
  if (len <= MAX_PULL || len === 0) return { ...drag }
  return { x: (drag.x / len) * MAX_PULL, y: (drag.y / len) * MAX_PULL }
}

/** Is the pull long enough to be a throw? */
export const isThrow = (drag: Pt): boolean => Math.hypot(drag.x, drag.y) >= MIN_PULL

/**
 * Where the seed lands: from the bag, the other way than the pull, `GAIN` times as far, and driven sideways by the wind (the farther it
 * flies, the more). `wind` goes from -1 (to the left) to 1 (to the right), 0 is calm. The point stays on the field.
 */
export function landing(origin: Pt, drag: Pt, wind = 0): Pt {
  const pull = pullOf(drag)
  const fly = { x: -pull.x * GAIN, y: -pull.y * GAIN }
  const length = Math.hypot(fly.x, fly.y)
  return {
    x: clamp(origin.x + fly.x + wind * WIND_DRIFT * length, 2, 98),
    y: clamp(origin.y + fly.y, 2, 98)
  }
}

/** A furrow: its middle and its size, in percent of the field. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Does the seed land in the furrow? The furrow counts a little bigger than it looks (a generous hit); `slack` 1.25 is a quarter more on every side. */
export function hits(point: Pt, furrow: Rect, slack = 1.25): boolean {
  return Math.abs(point.x - furrow.x) <= (furrow.w / 2) * slack && Math.abs(point.y - furrow.y) <= (furrow.h / 2) * slack
}

/** The pull that makes the seed land on a point (for the tests and for a hint): the opposite of the throw, without the wind. */
export function pullFor(origin: Pt, target: Pt): Pt {
  return { x: -(target.x - origin.x) / GAIN, y: -(target.y - origin.y) / GAIN }
}
