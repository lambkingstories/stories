/**
 * "Bezalels Werkstatt": the solver. A silhouette is a union of polygons on the lattice (corners on whole numbers, edges along the grid lines
 * and the diagonals). Every unit square of the lattice is cut into four small triangles ("atoms"), and every piece lying on the lattice
 * (turned by multiples of 90 degrees, the parallelogram also mirrored) covers a set of atoms. The solver covers the atoms of the silhouette
 * exactly, with each piece once (an exact cover, depth first). It is used by the tests (every level can be solved, how many ways) and by the
 * hint (it finds a way that keeps the pieces already lying right).
 */
import { inConvex, kindOf, placementPoly, type Kind, type Placement, type PieceId, type Pt } from './bezalelTangram'

export interface Grid {
  w: number
  h: number
}

/** The atoms of a cell: 0 top, 1 right, 2 bottom, 3 left (the four triangles around the middle of the cell). */
export const atomIndex = (g: Grid, cx: number, cy: number, k: number): number => (cy * g.w + cx) * 4 + k

/** The middle of the triangle of an atom: inside the atom, never on a line of the lattice. */
export function atomCenter(g: Grid, a: number): Pt {
  const k = a % 4
  const cell = (a - k) / 4
  const cx = cell % g.w
  const cy = (cell - cx) / g.w
  const off: Pt[] = [[0.5, 1 / 6], [5 / 6, 0.5], [0.5, 5 / 6], [1 / 6, 0.5]]
  return [cx + off[k]![0], cy + off[k]![1]]
}

/** The atoms that lie inside a polygon. */
export function atomsInPoly(g: Grid, poly: Pt[]): number[] {
  const out: number[] = []
  for (let a = 0; a < g.w * g.h * 4; a++) {
    const c = atomCenter(g, a)
    if (inConvex(poly, c[0], c[1], -1e-9)) out.push(a)
  }
  return out
}

/** The four atoms next to an atom (inside the cell: the two beside it; across the cell border: the one that touches it). */
export function atomNeighbours(g: Grid, a: number): number[] {
  const k = a % 4
  const cell = (a - k) / 4
  const cx = cell % g.w
  const cy = (cell - cx) / g.w
  const out = [atomIndex(g, cx, cy, (k + 1) % 4), atomIndex(g, cx, cy, (k + 3) % 4)]
  const across: [number, number, number][] = [[0, -1, 2], [1, 0, 3], [0, 1, 0], [-1, 0, 1]]
  const [dx, dy, kk] = across[k]!
  const nx = cx + dx
  const ny = cy + dy
  if (nx >= 0 && ny >= 0 && nx < g.w && ny < g.h) out.push(atomIndex(g, nx, ny, kk))
  return out
}

export interface LatticePlacement extends Placement {
  atoms: number[]
}

const KIND_ID: Record<Kind, PieceId> = { L: 'L1', M: 'M', S: 'S1', Q: 'Q', P: 'P' }

/** Every way a kind of piece can lie on the lattice of a grid (turned by 0, 90, 180, 270 degrees, mirrored or not, shifted). */
export function latticePlacements(g: Grid, kind: Kind): LatticePlacement[] {
  const out: LatticePlacement[] = []
  const seen = new Set<string>()
  for (const flip of [false, true]) {
    for (const rot of [0, 2, 4, 6]) {
      const base = placementPoly({ id: KIND_ID[kind], rot, flip, x: 0, y: 0 })
      const xs = base.map((p) => p[0])
      const ys = base.map((p) => p[1])
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      for (let x = Math.ceil(-minX - 1e-9); x + maxX <= g.w + 1e-9; x++) {
        for (let y = Math.ceil(-minY - 1e-9); y + maxY <= g.h + 1e-9; y++) {
          const pl: Placement = { id: KIND_ID[kind], rot, flip, x, y }
          const poly = placementPoly(pl)
          const id = poly.map((p) => `${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`).sort().join(';')
          if (seen.has(id)) continue
          seen.add(id)
          out.push({ ...pl, atoms: atomsInPoly(g, poly) })
        }
      }
    }
  }
  return out
}

const cache = new Map<string, Record<Kind, LatticePlacement[]>>()
export function placementsFor(g: Grid): Record<Kind, LatticePlacement[]> {
  const k = `${g.w}x${g.h}`
  let v = cache.get(k)
  if (!v) {
    v = { L: latticePlacements(g, 'L'), M: latticePlacements(g, 'M'), S: latticePlacements(g, 'S'), Q: latticePlacements(g, 'Q'), P: latticePlacements(g, 'P') }
    cache.set(k, v)
  }
  return v
}

/** The grid that holds a union of polygons, and the shift that puts its corner on (0, 0). */
export function gridOf(polys: Pt[][]): { grid: Grid; dx: number; dy: number } {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const poly of polys) {
    for (const p of poly) {
      x0 = Math.min(x0, p[0])
      y0 = Math.min(y0, p[1])
      x1 = Math.max(x1, p[0])
      y1 = Math.max(y1, p[1])
    }
  }
  const dx = Math.round(x0)
  const dy = Math.round(y0)
  return { grid: { w: Math.ceil(x1 - dx - 1e-9), h: Math.ceil(y1 - dy - 1e-9) }, dx, dy }
}

export interface Solution {
  /** The placements in the lattice of the grid (shift by the grid's corner to get the coordinates of the level). */
  placements: Placement[]
}

/** The kinds of the pieces of a level and how many of each. */
export function countKinds(ids: PieceId[]): Record<Kind, number> {
  const c: Record<Kind, number> = { L: 0, M: 0, S: 0, Q: 0, P: 0 }
  for (const id of ids) c[kindOf(id)]++
  return c
}

/**
 * All the ways to fill the atoms of the target exactly with the given pieces (equal pieces are not told apart: two small triangles that swap
 * their places are one way). `fixed` atoms are already taken. `limit` stops the search after that many ways.
 */
export function solve(g: Grid, target: Set<number>, counts: Record<Kind, number>, limit = 500, taken: Set<number> = new Set()): LatticePlacement[][] {
  const pl = placementsFor(g)
  const byAtom: Record<Kind, Map<number, LatticePlacement[]>> = { L: new Map(), M: new Map(), S: new Map(), Q: new Map(), P: new Map() }
  for (const kind of Object.keys(pl) as Kind[]) {
    for (const p of pl[kind]) {
      if (!p.atoms.every((a) => target.has(a))) continue
      for (const a of p.atoms) {
        const l = byAtom[kind].get(a)
        if (l) l.push(p)
        else byAtom[kind].set(a, [p])
      }
    }
  }
  const order = [...target].filter((a) => !taken.has(a)).sort((a, b) => a - b)
  const covered = new Set<number>(taken)
  const left = { ...counts }
  const chosen: LatticePlacement[] = []
  const found: LatticePlacement[][] = []
  const total = order.length
  const go = (from: number, filled: number): void => {
    if (found.length >= limit) return
    let i = from
    while (i < total && covered.has(order[i]!)) i++
    if (i >= total) {
      if (filled === total) found.push([...chosen])
      return
    }
    const a = order[i]!
    for (const kind of ['L', 'M', 'P', 'Q', 'S'] as Kind[]) {
      if (left[kind] <= 0) continue
      for (const p of byAtom[kind].get(a) ?? []) {
        if (p.atoms.some((x) => covered.has(x))) continue
        for (const x of p.atoms) covered.add(x)
        left[kind]--
        chosen.push(p)
        go(i + 1, filled + p.atoms.length)
        chosen.pop()
        left[kind]++
        for (const x of p.atoms) covered.delete(x)
      }
    }
  }
  go(0, 0)
  return found
}

/** The ways to fill a silhouette (polygons of the level) with the pieces of the level: placements shifted back into the coordinates of the level. */
export function solveSilhouette(polys: Pt[][], ids: PieceId[], limit = 500): Placement[][] {
  const { grid, dx, dy } = gridOf(polys)
  const shifted = polys.map((poly) => poly.map((p) => [p[0] - dx, p[1] - dy] as Pt))
  const target = new Set<number>()
  for (const poly of shifted) for (const a of atomsInPoly(grid, poly)) target.add(a)
  const sols = solve(grid, target, countKinds(ids), limit)
  return sols.map((s) => assign(s, ids, dx, dy))
}

/** Gives the placements their piece ids (equal pieces by turns: L1 then L2, S1 then S2) and shifts them back. */
export function assign(sol: LatticePlacement[], ids: PieceId[], dx: number, dy: number): Placement[] {
  const free = new Map<Kind, PieceId[]>()
  for (const id of ids) free.set(kindOf(id), [...(free.get(kindOf(id)) ?? []), id])
  return sol.map((p) => {
    const id = free.get(kindOf(p.id))!.shift()!
    return { id, rot: p.rot, flip: p.flip, x: p.x + dx, y: p.y + dy }
  })
}

/** For the hint: the ways to complete a silhouette when some pieces already lie right (their polygons). Falls back to nothing when none fits. */
export function solveWith(polys: Pt[][], ids: PieceId[], lying: { id: PieceId; poly: Pt[] }[], limit = 1): Placement[][] {
  const { grid, dx, dy } = gridOf(polys)
  const shift = (poly: Pt[]) => poly.map((p) => [p[0] - dx, p[1] - dy] as Pt)
  const target = new Set<number>()
  for (const poly of polys) for (const a of atomsInPoly(grid, shift(poly))) target.add(a)
  const taken = new Set<number>()
  const rest = [...ids]
  for (const l of lying) {
    for (const a of atomsInPoly(grid, shift(l.poly))) taken.add(a)
    const i = rest.indexOf(l.id)
    if (i >= 0) rest.splice(i, 1)
  }
  const sols = solve(grid, target, countKinds(rest), limit, taken)
  return sols.map((s) => assign(s, rest, dx, dy))
}

