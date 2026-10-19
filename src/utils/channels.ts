/**
 * The water channels of the channel game: a grid of tiles seen from above, each with openings on some of its four sides (0 up, 1 right,
 * 2 down, 3 left). A tile is turned a quarter at a time (clockwise). Water runs from the source tiles through the openings that meet; the
 * goal tiles (a tree or a bed) that it reaches bloom. These are plain functions: the game only draws what they say.
 */
import type { ChannelKind, ChannelTile } from '@/types/adventure'

/** The sides a tile has open at rotation 0 (0 up, 1 right, 2 down, 3 left). */
const BASE: Record<ChannelKind, number[]> = {
  straight: [1, 3],
  corner: [0, 1],
  tee: [0, 1, 3],
  cross: [0, 1, 2, 3],
  empty: [],
  source: [1],
  goal: [3]
}

/** Only these can be turned by the child: the source and the goals sit fixed, a cross and an empty tile look the same in every turn. */
export const isTurnable = (kind: ChannelKind): boolean => kind === 'straight' || kind === 'corner' || kind === 'tee'

/** How many different positions a tile has (a straight piece only two). */
export const turnsOf = (kind: ChannelKind): number => (kind === 'straight' ? 2 : isTurnable(kind) ? 4 : 1)

/** The open sides of a tile at a rotation (0 to 3, clockwise quarter turns). */
export function openings(kind: ChannelKind, rot: number): number[] {
  const r = ((rot % 4) + 4) % 4
  return BASE[kind].map((d) => (d + r) % 4)
}

const STEP: [number, number][] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1]
]

export interface Flow {
  /** Which tiles have water in them. */
  wet: boolean[][]
  /** The goals (their `goal` ids) that the water has reached. */
  reached: string[]
}

/** Where the water goes: a breadth-first search from every source along the openings that meet. */
export function flow(grid: ChannelTile[][]): Flow {
  const rows = grid.length
  const cols = rows ? grid[0]!.length : 0
  const wet: boolean[][] = grid.map((row) => row.map(() => false))
  const queue: [number, number][] = []
  grid.forEach((row, r) => row.forEach((t, c) => {
    if (t.kind === 'source') {
      wet[r]![c] = true
      queue.push([r, c])
    }
  }))
  while (queue.length) {
    const [r, c] = queue.shift()!
    const tile = grid[r]![c]!
    for (const d of openings(tile.kind, tile.rot)) {
      const nr = r + STEP[d]![0]
      const nc = c + STEP[d]![1]
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || wet[nr]![nc]) continue
      const next = grid[nr]![nc]!
      // the neighbour has to be open towards us
      if (openings(next.kind, next.rot).includes((d + 2) % 4)) {
        wet[nr]![nc] = true
        queue.push([nr, nc])
      }
    }
  }
  const reached: string[] = []
  grid.forEach((row, r) => row.forEach((t, c) => {
    if (t.kind === 'goal' && wet[r]![c] && t.goal) reached.push(t.goal)
  }))
  return { wet, reached }
}

/** How many goals a grid has. */
export const goalsOf = (grid: ChannelTile[][]): number => grid.flat().filter((t) => t.kind === 'goal').length

/**
 * A way to turn the tiles so that the water reaches every goal (the rotation of every tile; a tile the water does not need keeps the turn it
 * has), or null when there is none. The search follows the water: the tiles that are not decided yet count as closed; wherever a wet tile
 * opens towards such a tile, either that tile is turned so that it opens back (every turn that does is tried), or the opening is left unused.
 * That is quick for the small grids of the game (a search over all turns of all tiles would not be).
 */
export function solve(grid: ChannelTile[][]): number[][] | null {
  const work: ChannelTile[][] = grid.map((row) => row.map((t) => ({ ...t })))
  const rows = work.length
  const cols = rows ? work[0]!.length : 0
  const want = goalsOf(grid)
  const decided = new Set<string>()
  const skipped = new Set<string>()
  const id = (r: number, c: number) => `${r},${c}`

  /** The grid with the tiles that are not decided yet taken out (as empty tiles). */
  const decidedGrid = (): ChannelTile[][] => work.map((row, r) => row.map((t, c) => (isTurnable(t.kind) && !decided.has(id(r, c)) ? { kind: 'empty' as const, rot: 0 } : t)))

  const go = (): boolean => {
    const view = decidedGrid()
    const state = flow(view)
    if (state.reached.length === want) return true
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!state.wet[r]![c]) continue
        const tile = view[r]![c]!
        for (const d of openings(tile.kind, tile.rot)) {
          const nr = r + STEP[d]![0]
          const nc = c + STEP[d]![1]
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
          const next = work[nr]![nc]!
          const key = `${id(r, c)}>${d}`
          if (!isTurnable(next.kind) || decided.has(id(nr, nc)) || skipped.has(key)) continue
          // this opening leads to a tile that is not decided: turn it so that it opens back, or leave the opening unused
          for (let k = 0; k < turnsOf(next.kind); k++) {
            if (!openings(next.kind, k).includes((d + 2) % 4)) continue
            const before = next.rot
            next.rot = k
            decided.add(id(nr, nc))
            if (go()) return true
            decided.delete(id(nr, nc))
            next.rot = before
          }
          skipped.add(key)
          if (go()) return true
          skipped.delete(key)
          return false
        }
      }
    }
    return false
  }
  return go() ? work.map((row) => row.map((t) => t.rot)) : null
}
