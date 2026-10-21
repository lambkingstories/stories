/**
 * The small pure functions of the new games of "Josua" (`utils/josuaGames.ts`): packing things into a basket (fits, turning, solvable, the tip), the flax over the men on the
 * roof (what is covered and what still looks out), the swing of the rope, the beats of the bearers, the state of a flatbread and the clouds of noise over the animals. The games
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

// ------------------------------------------------------------------ the rope

/** The swing of the rope in degrees at the time t (seconds): positive is away from the wall. */
export const angle = (t: number, amplitude: number, period: number): number => amplitude * Math.sin((2 * Math.PI * t) / period)

/** The rope swings away from the wall far enough: this is the moment to let the man down. */
export const isFree = (a: number, threshold: number): boolean => a > threshold

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
