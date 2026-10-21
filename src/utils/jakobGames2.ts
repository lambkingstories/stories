/**
 * The small pure functions of the six new games of "Jakob" (stages 5 to 9 and 12): the cycle of seasons, the children on the meadow, the herds that are guessed, the two stones
 * of the cairn, the herds on the road and the ring of the twelve sons. The games only draw what these say; the tests use them directly.
 * A picture of the adventures is 3 : 2, so a percent of its height is two thirds of a percent of its width (`PIC`); distances are counted in widths of the picture.
 */
import { seeded } from '@/utils/jakobGames'

export const PIC = 2 / 3

export interface Pt {
  x: number
  y: number
}
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

// ------------------------------------------------------------------ the cycle of seasons

/** The sign that belongs at a place of the row: the cycle repeats again and again. */
export function expected(cycle: string[], index: number): string {
  return cycle[((index % cycle.length) + cycle.length) % cycle.length]!
}

/** The year a place belongs to (the first `cycle.length` places are year 1). */
export const yearOf = (cycleLength: number, index: number): number => Math.floor(index / cycleLength) + 1

/** The row of a round: for every place the sign that belongs there and whether it is a gap. */
export function cycleRow(cycle: string[], length: number, gaps: number[]): { index: number; id: string; gap: boolean }[] {
  return Array.from({ length }, (_, index) => ({ index, id: expected(cycle, index), gap: gaps.includes(index) }))
}

// ------------------------------------------------------------------ the children on the meadow

export interface Kid {
  x: number
  y: number
  /** The way the child walks, in percent of the width a second. */
  vx: number
  vy: number
}

/** The children at the start: spread over the meadow, each walking in some direction (always the same for the same seed). */
export function startKids(count: number, field: Rect, speed: number, seed: number): Kid[] {
  const r = seeded(seed)
  return Array.from({ length: count }, () => {
    const a = r() * Math.PI * 2
    return { x: field.x + r() * field.w, y: field.y + r() * field.h, vx: Math.cos(a) * speed * 100, vy: Math.sin(a) * speed * 100 * (1 / PIC) }
  })
}

/**
 * The children walk on: they go straight on, turn round gently at the edge of the meadow (never out of it) and now and then change their way a little. `speed` is in picture
 * widths a second; `rand` gives numbers from 0 to 1 (the game takes the one of its seed, the tests their own).
 */
export function stepKids(kids: Kid[], dt: number, speed: number, field: Rect, rand: () => number): Kid[] {
  return kids.map((k) => {
    let { vx, vy } = k
    // now and then a gentle turn (about once in four seconds)
    if (rand() < dt / 4) {
      const a = Math.atan2(vy * PIC, vx) + (rand() - 0.5) * 1.2
      vx = Math.cos(a) * speed * 100
      vy = (Math.sin(a) * speed * 100) / PIC
    }
    let x = k.x + vx * dt
    let y = k.y + vy * dt
    if (x < field.x) {
      x = field.x
      vx = Math.abs(vx)
    } else if (x > field.x + field.w) {
      x = field.x + field.w
      vx = -Math.abs(vx)
    }
    if (y < field.y) {
      y = field.y
      vy = Math.abs(vy)
    } else if (y > field.y + field.h) {
      y = field.y + field.h
      vy = -Math.abs(vy)
    }
    return { x, y, vx, vy }
  })
}

/** Is a tap on a child? The circle is generous (`radius` in percent of the width of the picture). */
export const hit = (kid: Pt, tap: Pt, radius: number): boolean => Math.hypot(kid.x - tap.x, (kid.y - tap.y) * PIC) <= radius

// ------------------------------------------------------------------ the herds that are guessed

/**
 * Where the animals of a herd stand on a meadow: inside the region, spread out (every animal is put where it is farthest from the ones before, out of a few tries);
 * always the same for the same seed. The points are the feet of the animals, in percent of the picture.
 */
export function scatter(count: number, seed: number, region: Rect): Pt[] {
  const r = seeded(seed)
  const out: Pt[] = []
  for (let i = 0; i < count; i++) {
    let best: Pt = { x: region.x + r() * region.w, y: region.y + r() * region.h }
    let bestD = out.length ? Math.min(...out.map((p) => Math.hypot(p.x - best.x, (p.y - best.y) * PIC))) : Infinity
    for (let t = 0; t < 12; t++) {
      const c = { x: region.x + r() * region.w, y: region.y + r() * region.h }
      const d = out.length ? Math.min(...out.map((p) => Math.hypot(p.x - c.x, (p.y - c.y) * PIC))) : Infinity
      if (d > bestD) {
        best = c
        bestD = d
      }
    }
    out.push(best)
  }
  return out
}

/** Which of the ranges contains the number (the right answer), or -1. */
export const rightRange = (count: number, ranges: [number, number][]): number => ranges.findIndex(([lo, hi]) => count >= lo && count <= hi)

/** What a range is called for the child: "about" the middle of it, rounded to five. */
export const rangeAbout = ([lo, hi]: [number, number]): number => Math.max(5, Math.round((lo + hi) / 2 / 5) * 5)

// ------------------------------------------------------------------ the two stones of the cairn

export interface Pair {
  left: number
  right: number
}
export type Side = 'left' | 'right'

/**
 * A step on one side. A side may be at most one step ahead of the other one: when it already is, it waits (nothing is lost, nothing is a mistake). A side never goes
 * further than `steps`.
 */
export function advance(state: Pair, side: Side, steps: number): { state: Pair; moved: boolean } {
  const other = side === 'left' ? 'right' : 'left'
  if (state[side] >= steps || state[side] - state[other] >= 1) return { state, moved: false }
  return { state: { ...state, [side]: state[side] + 1 }, moved: true }
}

/** Both stones have come to the middle. */
export const arrived = (state: Pair, steps: number): boolean => state.left >= steps && state.right >= steps

/**
 * Where the small stone number `index` (0-based) of a heap of `total` stones lies, in stone sizes from the middle of the foot of the heap: the lowest row is the widest and
 * is filled first, every row above is one stone narrower and lies in the gaps of the row below (`x` to the right, `y` upwards).
 */
export function heapSpot(index: number, total: number): { x: number; y: number } {
  let base = 1
  while ((base * (base + 1)) / 2 < total) base++
  let row = 0
  let left = index
  let width = base
  while (left >= width && width > 1) {
    left -= width
    width--
    row++
  }
  return { x: left - (width - 1) / 2, y: row * 0.8 }
}

// ------------------------------------------------------------------ the herds on the road

/** The length of a line of points (percent of the picture), counted in widths of the picture. */
export function roadLength(path: [number, number][]): number {
  let sum = 0
  for (let i = 1; i < path.length; i++) sum += Math.hypot(path[i]![0] - path[i - 1]![0], (path[i]![1] - path[i - 1]![1]) * PIC)
  return sum
}

/** Where a herd stands when `t` (0 to 1) of the road is done; the point is on the line. */
export function positionAt(path: [number, number][], t: number): Pt {
  if (path.length === 0) return { x: 50, y: 50 }
  if (path.length === 1) return { x: path[0]![0], y: path[0]![1] }
  let left = Math.min(1, Math.max(0, t)) * roadLength(path)
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    const len = Math.hypot(b[0] - a[0], (b[1] - a[1]) * PIC)
    if (left <= len || i === path.length - 1) {
      const f = len === 0 ? 0 : Math.min(1, left / len)
      return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f }
    }
    left -= len
  }
  return { x: path[path.length - 1]![0], y: path[path.length - 1]![1] }
}

/** Is there room enough between the herd in front and the one that is sent now? Positions in percent of the road (0 to 100), `minGap` in percent of the road. */
export const gapOk = (prevPos: number, nextPos: number, minGap: number): boolean => prevPos - nextPos >= minGap

// ------------------------------------------------------------------ the ring of the twelve sons

const norm = (deg: number) => ((deg % 360) + 360) % 360
/** The smallest difference of two angles, in degrees (-180 to 180). */
const diff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180

/** The place on the ring that is nearest to a point (percent of the picture): its angle in degrees, the point itself, and how far the point is from the ring (in percent of the width). */
export function snapToRing(point: Pt, centre: Pt, radius: number): { angle: number; x: number; y: number; distance: number } {
  const dx = point.x - centre.x
  const dy = (point.y - centre.y) * PIC
  const angle = norm((Math.atan2(dy, dx) * 180) / Math.PI)
  const rad = (angle * Math.PI) / 180
  return {
    angle,
    x: centre.x + radius * Math.cos(rad),
    y: centre.y + (radius * Math.sin(rad)) / PIC,
    distance: Math.abs(Math.hypot(dx, dy) - radius)
  }
}

/**
 * Can these angles (degrees) belong to a ring of `count` equal gaps, after the best turn of the ring? The gap between two neighbours may differ from the ideal one by `tolerance`
 * degrees at most; that is the case when every angle lies within half of it of its own place of the ring. No two on the same place.
 */
/** The best turn of a ring of `count` places for these angles: the middle of the leftovers when every angle is taken modulo one step (circular mean). */
function ringTurn(angles: number[], count: number): number {
  const step = 360 / count
  let sx = 0
  let sy = 0
  for (const a of angles) {
    const r = ((norm(a) % step) / step) * 2 * Math.PI
    sx += Math.cos(r)
    sy += Math.sin(r)
  }
  return ((Math.atan2(sy, sx) / (2 * Math.PI)) * step + step) % step
}

/** The places (angles) of a ring of `count` that fits the figures that stand already; with none, the ring starts at the top (270 degrees, y goes down). */
export function ringSlots(angles: number[], count: number): number[] {
  const step = 360 / count
  const turn = angles.length ? ringTurn(angles, count) : 270 % step
  return Array.from({ length: count }, (_, i) => norm(turn + i * step))
}

/** The places of the sons round the altar: `count` places like the hours of a clock, the first one at the top (270 degrees, y goes down). */
export function ringPlaces(count: number): number[] {
  const step = 360 / count
  return Array.from({ length: count }, (_, i) => norm(270 + i * step))
}

/** The free place that is nearest to an angle (degrees); `undefined` when no place is free. */
export function nearestFree(free: number[], angle: number): number | undefined {
  let best: number | undefined
  let bestD = Infinity
  for (const a of free) {
    const d = Math.abs(diff(a, angle))
    if (d < bestD) {
      best = a
      bestD = d
    }
  }
  return best
}

export function fitsRing(angles: number[], count: number, tolerance: number): boolean {
  if (angles.length === 0) return true
  if (angles.length > count) return false
  const step = 360 / count
  const turn = ringTurn(angles, count)
  const used = new Set<number>()
  for (const a of angles) {
    const place = Math.round(norm(a - turn) / step) % count
    if (Math.abs(diff(a, turn + place * step)) > tolerance / 2 || used.has(place)) return false
    used.add(place)
  }
  return true
}

/** All the figures stand evenly round the altar (the gaps between neighbours are the same, within `tolerance` degrees). */
export const isEven = (angles: number[], tolerance: number): boolean => angles.length >= 2 && fitsRing(angles, angles.length, tolerance)
