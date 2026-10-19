/**
 * The fog of the wiping game: the picture is covered by soft fog and the finger wipes it away. The share that is free is worked out on a coarse grid
 * (24 x 16 cells over the picture), kept next to the drawing, so that the arithmetic needs no canvas and can be tested. Positions are percents of the
 * picture (x of the width, y of the height); a brush radius is in percent of the width.
 */
export const COLS = 24
export const ROWS = 16
/** Height divided by width of the picture (3 : 2). */
export const ASPECT = 2 / 3

export interface Region {
  x: number
  y: number
  w: number
  h: number
}

/** An empty grid: nothing is wiped. */
export const makeGrid = (): boolean[][] => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false))

/** The middle of a cell, in percent of the picture. */
const cellCentre = (r: number, c: number) => ({ x: ((c + 0.5) * 100) / COLS, y: ((r + 0.5) * 100) / ROWS })

/** Wipes a round brush at (x, y) with radius `radius` (percent of the width): every cell whose middle lies inside is free. Returns how many cells were new. */
export function wipeAt(grid: boolean[][], x: number, y: number, radius: number): number {
  let fresh = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r]![c]) continue
      const m = cellCentre(r, c)
      // the picture is wider than high: a percent of the height is shorter than a percent of the width
      if (Math.hypot(m.x - x, (m.y - y) * ASPECT) <= radius) {
        grid[r]![c] = true
        fresh++
      }
    }
  }
  return fresh
}

/** Wipes along a line from one point to the next (a finger moves fast): the brush is put down every half radius. */
export function wipeLine(grid: boolean[][], from: { x: number; y: number }, to: { x: number; y: number }, radius: number): number {
  const length = Math.hypot(to.x - from.x, (to.y - from.y) * ASPECT)
  const steps = Math.max(1, Math.ceil(length / Math.max(0.5, radius / 2)))
  let fresh = 0
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    fresh += wipeAt(grid, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, radius)
  }
  return fresh
}

/** The share (0 to 1) of the cells inside a region (percent of the picture) that are free. A region with no cell in it counts as nothing. */
export function coverage(grid: boolean[][], region: Region): number {
  let inside = 0
  let free = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const m = cellCentre(r, c)
      if (m.x < region.x || m.x > region.x + region.w || m.y < region.y || m.y > region.y + region.h) continue
      inside++
      if (grid[r]![c]) free++
    }
  }
  return inside ? free / inside : 0
}
