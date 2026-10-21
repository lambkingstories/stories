/**
 * The small pure functions of the new games of "Josua" (`utils/josuaGames.ts`): packing things into a basket (fits, turning, solvable, the tip), the flax over the men on the
 * roof (what is covered and what still looks out), the red rope and the guard, the beats of the bearers, the state of a flatbread and the clouds of noise over the animals. The games
 * draw and time only what these say; the tests use them directly.
 */
import { seeded } from '@/utils/jakobGames'

// ------------------------------------------------------------------ the supplies in the basket

export interface PackShape {
  id: string
  w: number
  h: number
}
export interface PackPlace {
  id: string
  col: number
  row: number
  /** turned a quarter: width and height change places */
  rot: boolean
}

/** The size of a thing in cells, turned or not. */
export const packSize = (item: { w: number; h: number }, rot: boolean): { w: number; h: number } => (rot ? { w: item.h, h: item.w } : { w: item.w, h: item.h })

/** The grid of the basket: the id of the thing in each cell (row by row), an empty text for a free cell. */
export function gridOf(cols: number, rows: number, placed: PackPlace[], items: PackShape[]): string[] {
  const grid: string[] = Array.from({ length: cols * rows }, () => '')
  for (const p of placed) {
    const item = items.find((i) => i.id === p.id)
    if (!item) continue
    const s = packSize(item, p.rot)
    for (let r = p.row; r < p.row + s.h; r++) for (let c = p.col; c < p.col + s.w; c++) if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r * cols + c] = p.id
  }
  return grid
}

/** Does the thing fit with its top left cell at (col, row): inside the grid and on free cells only? */
export function fits(grid: string[], cols: number, rows: number, item: { w: number; h: number }, col: number, row: number, rot: boolean): boolean {
  const s = packSize(item, rot)
  if (col < 0 || row < 0 || col + s.w > cols || row + s.h > rows) return false
  for (let r = row; r < row + s.h; r++) for (let c = col; c < col + s.w; c++) if (grid[r * cols + c] !== '') return false
  return true
}

/** Can all the things be packed into the grid (in any place, turned or not)? Searches every way. */
export function solvable(cols: number, rows: number, items: PackShape[]): boolean {
  return solve(Array.from({ length: cols * rows }, () => ''), cols, rows, [...items].sort((a, b) => b.w * b.h - a.w * a.h)) !== null
}

function solve(grid: string[], cols: number, rows: number, rest: PackShape[]): PackPlace[] | null {
  if (!rest.length) return []
  const [item, ...others] = rest as [PackShape, ...PackShape[]]
  if (rest.reduce((n, i) => n + i.w * i.h, 0) > grid.filter((g) => g === '').length) return null
  for (const rot of item.w === item.h ? [false] : [false, true]) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!fits(grid, cols, rows, item, col, row, rot)) continue
        const next = gridOf(cols, rows, [{ id: item.id, col, row, rot }], [item]).map((g, i) => g || grid[i]!)
        const way = solve(next, cols, rows, others)
        if (way) return [{ id: item.id, col, row, rot }, ...way]
      }
    }
  }
  return null
}

/**
 * The tip: a place for one of the things that are still to pack, such that all the others can still be packed afterwards (the things that lie in the basket stay where they are).
 * `null` when nothing is left or the basket cannot be finished any more.
 */
export function tipSpot(grid: string[], cols: number, rows: number, remaining: PackShape[]): PackPlace | null {
  for (const item of remaining) {
    for (const rot of item.w === item.h ? [false] : [false, true]) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (!fits(grid, cols, rows, item, col, row, rot)) continue
          const next = gridOf(cols, rows, [{ id: item.id, col, row, rot }], [item]).map((g, i) => g || grid[i]!)
          if (solve(next, cols, rows, remaining.filter((r) => r.id !== item.id))) return { id: item.id, col, row, rot }
        }
      }
    }
  }
  return null
}

// ------------------------------------------------------------------ the flax over the men

/** A rectangle in the units of the roof: percent of its width, in both directions. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
/** The size of a cell of the check, in the same units. */
export const CELL = 2.5

/** A bundle turned a quarter lies across: it keeps its middle and swaps width and height. */
export const turnRect = (r: Rect): Rect => ({ x: r.x + r.w / 2 - r.h / 2, y: r.y + r.h / 2 - r.w / 2, w: r.h, h: r.w })

const inside = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h

/** The middles of the cells of the man that no bundle covers (those are the places that still look out). */
export function peeks(man: Rect, bundles: Rect[], cell = CELL): { x: number; y: number }[] {
  const nx = Math.max(1, Math.ceil(man.w / cell))
  const ny = Math.max(1, Math.ceil(man.h / cell))
  const out: { x: number; y: number }[] = []
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = man.x + ((i + 0.5) * man.w) / nx
      const y = man.y + ((j + 0.5) * man.h) / ny
      if (!bundles.some((b) => inside(b, x, y))) out.push({ x, y })
    }
  }
  return out
}

/** How much of the man is under the bundles (0 to 1). */
export function coveredFraction(man: Rect, bundles: Rect[], cell = CELL): number {
  const nx = Math.max(1, Math.ceil(man.w / cell))
  const ny = Math.max(1, Math.ceil(man.h / cell))
  return 1 - peeks(man, bundles, cell).length / (nx * ny)
}

/** The man is hidden when at least 96 % of him is covered. */
export const covered = (man: Rect, bundles: Rect[], need = 0.96, cell = CELL): boolean => coveredFraction(man, bundles, cell) >= need

// ------------------------------------------------------------------ the red rope and the guard

/** What the game needs to know of the rope and the guard (a part of `LowerGame` and `LowerRound`; the tests use plain numbers). */
export interface RopeRules {
  /** where the rope hangs (percent of the width) */
  windowX: number
  /** how fast the guard walks (percent of the width a second) */
  guardSpeed: number
  /** the radius of the circle of light round the torch (percent of the width) */
  lightRadius: number
  /** how far before the light the sign says "wait" (percent of the width) */
  warnLead: number
  /** the red knots on the rope, where the man is pulled back to */
  knots: number
  /** how long the man needs to go down while he is held (ms), how often the guard comes, and the pause between two passes (ms) */
  descentMs: number
  passes: number
  gapMs: number
}

/** The guard walks from this far right of the picture to this far left of it (percent of the width). */
export const GUARD_FROM = 118
export const GUARD_TO = -18
/** After the man was seen, holding counts for nothing for this long (ms). */
export const SEEN_LOCK_MS = 800

/** How long one pass of the guard takes (ms). */
export const passMs = (r: Pick<RopeRules, 'guardSpeed'>): number => ((GUARD_FROM - GUARD_TO) / r.guardSpeed) * 1000

/** Where the guard walks at the time t (ms since the first hold): `null` when no pass is on (between two passes, and after the last one). The first pass starts at once. */
export function guardX(t: number, r: RopeRules): number | null {
  if (t < 0) return null
  const one = passMs(r)
  const k = Math.floor(t / (one + r.gapMs))
  if (k >= r.passes) return null
  const inPass = t - k * (one + r.gapMs)
  if (inPass > one) return null
  return GUARD_FROM - (r.guardSpeed * inPass) / 1000
}

export type GuardState = 'far' | 'warn' | 'danger'

/** `danger`: the guard is in the light on the rope (the man must not move); `warn`: he comes, let go now (the lead gives about two seconds); `far`: all is free. */
export function guardState(x: number | null, r: RopeRules): GuardState {
  if (x === null) return 'far'
  if (Math.abs(x - r.windowX) <= r.lightRadius) return 'danger'
  if (x > r.windowX + r.lightRadius && x <= r.windowX + r.lightRadius + r.warnLead) return 'warn'
  return 'far'
}

/** The last red knot at or above the place `y` (0 to 1 of the way down): the man is pulled back to it. */
export const lastKnot = (y: number, knots: number): number => (knots > 0 ? Math.floor(y * knots + 1e-9) / knots : 0)

export interface LowerState {
  /** ms since the first hold */
  t: number
  /** the way down, 0 (at the window) to 1 (on the ground) */
  y: number
  /** ms that holding counts for nothing (after the man was seen) */
  lock: number
}

export type LowerEvent = 'gesehen' | 'unten' | null

export const lowerStart = (): LowerState => ({ t: 0, y: 0, lock: 0 })

/**
 * One step of the game: time goes on by `dt` ms; when the rope is held (and not locked) the man goes down; when it is held while the guard is in the light he is seen and falls back to the
 * last knot (with a lock of 0.8 s); at the ground he is down. Waiting is never a mistake.
 */
export function lowerStep(s: LowerState, dt: number, holding: boolean, r: RopeRules): { state: LowerState; event: LowerEvent } {
  const t = s.t + dt
  const lock = Math.max(0, s.lock - dt)
  if (!holding || s.lock > 0) return { state: { t, y: s.y, lock }, event: null }
  if (guardState(guardX(t, r), r) === 'danger') return { state: { t, y: lastKnot(s.y, r.knots), lock: SEEN_LOCK_MS }, event: 'gesehen' }
  const y = Math.min(1, s.y + dt / r.descentMs)
  return { state: { t, y, lock }, event: y >= 1 ? 'unten' : null }
}

/** The shortest time (ms) in which a player who holds whenever the guard is not coming (never in "warn" or "danger") brings the man down; `null` when he never gets there. */
export function fastestFinishMs(r: RopeRules, step = 10, limit = 120000): number | null {
  let s = lowerStart()
  for (let i = 0; i < limit / step; i++) {
    const hold = guardState(guardX(s.t + step, r), r) === 'far'
    const next = lowerStep(s, step, hold, r)
    if (next.event === 'gesehen') return null
    s = next.state
    if (next.event === 'unten') return s.t
  }
  return null
}

/** A player who never lets go: the time (ms) at which he is seen for the first time, or `null` when he gets down (and so is not seen). */
export function firstSeenMs(r: RopeRules, step = 10, limit = 120000): number | null {
  let s = lowerStart()
  for (let i = 0; i < limit / step; i++) {
    const next = lowerStep(s, step, true, r)
    s = next.state
    if (next.event === 'gesehen') return s.t
    if (next.event === 'unten') return null
  }
  return null
}

// ------------------------------------------------------------------ the beats

/** The times (seconds) of the beats: `count` beats at `bpm` beats a minute, the first at `start`. */
export const schedule = (bpm: number, count: number, start: number): number[] => Array.from({ length: count }, (_, i) => start + (i * 60) / bpm)

/** A tap is in time when it is within `tol` seconds of the beat. */
export const judge = (tap: number, beat: number, tol: number): boolean => Math.abs(tap - beat) <= tol

/** The beat that is nearest to the time t (the first one is the earliest). */
export function nearestBeat(t: number, bpm: number, start: number): number {
  const gap = 60 / bpm
  return start + Math.max(0, Math.round((t - start) / gap)) * gap
}

// ------------------------------------------------------------------ the flatbread

export type BakeState = 'roh' | 'golden' | 'dunkel'

/** The state of a flatbread that has lain on the stone for `age` seconds: raw, golden between the two times, too dark after. */
export const bakeState = (age: number, goldenFrom: number, goldenTo: number): BakeState => (age < goldenFrom ? 'roh' : age <= goldenTo ? 'golden' : 'dunkel')

// ------------------------------------------------------------------ the clouds of noise

/** The next cloud: at which of the places it comes up and how many seconds after the one before (always the same for the same seed and number). */
export function nextSpawn(seed: number, n: number, spots: number): { spot: number; wait: number } {
  const r = seeded(seed * 1009 + n * 31 + 7)
  return { spot: Math.min(spots - 1, Math.floor(r() * spots)), wait: 0.8 + r() * 1.6 }
}

/** The size of a cloud of the age `age` (seconds) that grows to loud in `grow` seconds: 1 small, 2 middle, 3 big. */
export const cloudLevel = (age: number, grow: number): 1 | 2 | 3 => (age >= (grow * 2) / 3 ? 3 : age >= grow / 3 ? 2 : 1)

/** The cloud is loud: it has grown for the whole time. */
export const isLoud = (age: number, grow: number): boolean => age >= grow

// ------------------------------------------------------------------ through the Jordan

/** Where the chest is when `share` (0 to 1) of the way from the bank to the middle of the river is done (percent of the picture). */
export function crossAt(start: [number, number], middle: [number, number], share: number): { x: number; y: number } {
  const f = Math.min(1, Math.max(0, share))
  return { x: start[0] + (middle[0] - start[0]) * f, y: start[1] + (middle[1] - start[1]) * f }
}

/** The share of the way that a finger at `x` (percent of the width) means: the left bank is 0, the middle of the river 1; outside the way it stops at the ends. */
export function crossShare(start: [number, number], middle: [number, number], x: number): number {
  const span = middle[0] - start[0]
  if (span === 0) return 0
  return Math.min(1, Math.max(0, (x - start[0]) / span))
}

/** Where group `i` stands on the far bank: the groups stand side by side, a little apart in depth (percent of the picture). */
export function groupLanding(farBank: [number, number], i: number): { x: number; y: number } {
  return { x: farBank[0] - i * 7, y: farBank[1] + (i - 1) * 5 }
}
