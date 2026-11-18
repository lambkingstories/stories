/**
 * "Bezalels Werkstatt" (the tangram game): the geometry. Pure TypeScript without Vue, deterministic, tested in `tests/bezalel*.test.ts`.
 *
 * The seven classic pieces live on a lattice with the unit q = the leg of a small triangle (the side of the square):
 *   S small triangle (legs 1), Q square (side 1), M medium triangle (legs sqrt2, long side 2), L large triangle (legs 2),
 *   P parallelogram (sides 1 and sqrt2). The whole set has the area 8. Coordinates have y pointing DOWN (like the screen).
 * A piece is placed by a rotation in steps of 45 degrees, a mirror image (only the parallelogram needs it) and a position.
 */

export type Pt = [number, number]
export type Kind = 'L' | 'M' | 'S' | 'Q' | 'P'
export type PieceId = 'L1' | 'L2' | 'M' | 'S1' | 'S2' | 'Q' | 'P'

export const PIECE_IDS: PieceId[] = ['L1', 'L2', 'M', 'S1', 'S2', 'Q', 'P']
export const kindOf = (id: PieceId): Kind => id[0] as Kind

/** The pieces as polygons in their basic position (corners on whole numbers). */
export const BASE: Record<Kind, Pt[]> = {
  S: [[0, 0], [1, 0], [0, 1]],
  Q: [[0, 0], [1, 0], [1, 1], [0, 1]],
  M: [[0, 0], [2, 0], [1, 1]],
  L: [[0, 0], [2, 0], [0, 2]],
  P: [[0, 0], [1, 1], [1, 2], [0, 1]]
}

export const AREA: Record<Kind, number> = { S: 0.5, Q: 1, M: 1, L: 2, P: 1 }
export const EPS = 1e-6

export function centroidOf(kind: Kind): Pt {
  const b = BASE[kind]
  let x = 0
  let y = 0
  for (const p of b) {
    x += p[0]
    y += p[1]
  }
  return [x / b.length, y / b.length]
}

/** The longest distance from the middle to a corner: a piece fits into a circle of this radius however it is turned. */
export function radiusOf(kind: Kind): number {
  const c = centroidOf(kind)
  return Math.max(...BASE[kind].map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])))
}

export function area(poly: Pt[]): number {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!
    const q = poly[(i + 1) % poly.length]!
    a += p[0] * q[1] - q[0] * p[1]
  }
  return a / 2
}

/** The same polygon with a positive area (all polygons run the same way round, whatever the mirror image did). */
export function orient(poly: Pt[]): Pt[] {
  return area(poly) < 0 ? [...poly].reverse() : poly
}

// ── placements (the lattice form: used for the solutions) ───────────────────────────────────────────────────────────────────────

/** A piece on the lattice: p' = rotate(rot * 45 degrees)(mirror(p)) + (x, y), mirror = x -> -x (applied first). */
export interface Placement {
  id: PieceId
  rot: number
  flip: boolean
  x: number
  y: number
}

const rotP = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]
}
const roundP = (p: Pt): Pt => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6]

export function placementPoly(pl: Placement): Pt[] {
  const kind = kindOf(pl.id)
  return orient(BASE[kind].map((p) => {
    const m: Pt = pl.flip ? [-p[0], p[1]] : p
    const r = rotP(m, pl.rot * 45)
    return roundP([r[0] + pl.x, r[1] + pl.y])
  }))
}

// ── live transforms (the form of a piece in the game: turn about its middle) ────────────────────────────────────────────────────

/** A piece in the game: its middle (cx, cy), the angle in degrees (clockwise on the screen), and whether it is mirrored. */
export interface Xf {
  kind: Kind
  angle: number
  flip: boolean
  cx: number
  cy: number
}

export function xfPoly(xf: Xf): Pt[] {
  const c = centroidOf(xf.kind)
  return orient(BASE[xf.kind].map((p) => {
    const q: Pt = [xf.flip ? -(p[0] - c[0]) : p[0] - c[0], p[1] - c[1]]
    const r = rotP(q, xf.angle)
    return [xf.cx + r[0], xf.cy + r[1]] as Pt
  }))
}

export function placementToXf(pl: Placement): Xf {
  const kind = kindOf(pl.id)
  const c = centroidOf(kind)
  const m: Pt = pl.flip ? [-c[0], c[1]] : c
  const r = rotP(m, pl.rot * 45)
  return { kind, angle: pl.rot * 45, flip: pl.flip, cx: r[0] + pl.x, cy: r[1] + pl.y }
}

export const normAngle = (a: number): number => ((a % 360) + 360) % 360

// ── polygons: tests and measures ────────────────────────────────────────────────────────────────────────────────────────────────

/** Whether a point lies inside a convex polygon (the border counts as inside, `slack` grows the polygon a little). */
export function inConvex(poly: Pt[], x: number, y: number, slack = 1e-9): boolean {
  let sign = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const d = cr / len
    if (d < -slack) {
      if (sign > 0) return false
      sign = -1
    } else if (d > slack) {
      if (sign < 0) return false
      sign = 1
    }
  }
  return true
}

/** The shortest distance from a point to the border of a polygon. */
export function distToPoly(poly: Pt[], x: number, y: number): number {
  let best = Infinity
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l2 = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2))
    best = Math.min(best, Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy)))
  }
  return best
}

export function bbox(polys: Pt[][]): { x0: number; y0: number; x1: number; y1: number } {
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
  return { x0, y0, x1, y1 }
}

// ── the outline of the silhouette ───────────────────────────────────────────────────────────────────────────────────────────────

export type Seg = [Pt, Pt]
const key = (p: Pt) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`

/**
 * The outline of the union of polygons that do not overlap: the edges that belong to one polygon only (the edges inside are shared and cancel),
 * and the corners where the outline really turns. The inner corners of the pieces (where a piece touches another one) are not part of it.
 * Every edge runs with the inside on the same side (the polygons are all oriented the same way).
 */
export function outlineOf(polys: Pt[][]): { edges: Seg[]; corners: Pt[] } {
  const oriented = polys.map(orient)
  const verts = new Map<string, Pt>()
  for (const poly of oriented) for (const p of poly) verts.set(key(p), p)
  const all = [...verts.values()]
  const directed = new Map<string, Seg>()
  for (const poly of oriented) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]!
      const b = poly[(i + 1) % poly.length]!
      const through = all.filter((v) => {
        if (key(v) === key(a) || key(v) === key(b)) return false
        const dx = b[0] - a[0]
        const dy = b[1] - a[1]
        const l2 = dx * dx + dy * dy
        const t = ((v[0] - a[0]) * dx + (v[1] - a[1]) * dy) / l2
        if (t <= 1e-6 || t >= 1 - 1e-6) return false
        return Math.hypot(v[0] - (a[0] + t * dx), v[1] - (a[1] + t * dy)) < 1e-5
      })
      const chain = [a, ...through.sort((p, q) => Math.hypot(p[0] - a[0], p[1] - a[1]) - Math.hypot(q[0] - a[0], q[1] - a[1])), b]
      for (let k = 0; k + 1 < chain.length; k++) directed.set(`${key(chain[k]!)}>${key(chain[k + 1]!)}`, [chain[k]!, chain[k + 1]!])
    }
  }
  const edges: Seg[] = []
  for (const [k, seg] of directed) {
    const [from, to] = k.split('>')
    if (!directed.has(`${to}>${from}`)) edges.push(seg)
  }
  const out = new Map<string, Seg[]>()
  const inn = new Map<string, Seg[]>()
  for (const e of edges) {
    const a = key(e[0])
    const b = key(e[1])
    out.set(a, [...(out.get(a) ?? []), e])
    inn.set(b, [...(inn.get(b) ?? []), e])
  }
  const corners: Pt[] = []
  for (const [k, outs] of out) {
    const ins = inn.get(k) ?? []
    if (!outs.length || !ins.length) continue
    // a corner where the way in and the way out are not in one line (or where the outline touches itself)
    const turns = outs.length > 1 || ins.length > 1 || outs.some((o) => ins.some((i) => {
      const d1: Pt = [i[1][0] - i[0][0], i[1][1] - i[0][1]]
      const d2: Pt = [o[1][0] - o[0][0], o[1][1] - o[0][1]]
      return Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) > 1e-6 * Math.hypot(...d1) * Math.hypot(...d2)
    }))
    if (turns) corners.push(outs[0]![0])
  }
  return { edges, corners }
}

// ── covering: how much of the silhouette the pieces fill ────────────────────────────────────────────────────────────────────────

/** Sample points inside the union of polygons (a fine grid, shifted so that it does not meet the lattice lines). */
export function samplePoints(polys: Pt[][], step = 0.06): Pt[] {
  const b = bbox(polys)
  const pts: Pt[] = []
  for (let y = b.y0 + 0.0213; y < b.y1; y += step) {
    for (let x = b.x0 + 0.0317; x < b.x1; x += step) {
      if (polys.some((p) => inConvex(p, x, y))) pts.push([x, y])
    }
  }
  return pts
}

/** The share of the silhouette that is covered, and the share that is covered twice (the pieces lie on top of each other). */
export function coverage(samples: Pt[], placed: Pt[][]): { covered: number; overlap: number } {
  if (!samples.length) return { covered: 0, overlap: 0 }
  let once = 0
  let twice = 0
  for (const s of samples) {
    let n = 0
    for (const poly of placed) {
      if (inConvex(poly, s[0], s[1])) {
        n++
        if (n > 1) break
      }
    }
    if (n >= 1) once++
    if (n >= 2) twice++
  }
  return { covered: once / samples.length, overlap: twice / samples.length }
}

/** The silhouette counts as filled from this share of covering on (Anton: about 97 percent). */
export const DONE_AT = 0.97

// ── snapping: a piece clicks into place when it lies nearly right ─────────────────────────────────────────────────────────────

export interface SnapTargets {
  /** Corners to click on (the corners of the silhouette and the corners of the pieces already lying there). */
  corners: Pt[]
  /** Edges to lie against: `same` = the piece lies on the inside of the edge (the silhouette), otherwise on the other side of it (a piece). */
  edges: { seg: Seg; same: boolean }[]
  /** Also click onto the whole-number lattice when no corner is near (a piece lying in the middle of the figure touches nothing to click on). */
  lattice?: boolean
}

const unit = (a: Pt, b: Pt): Pt => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
}

/** The angle snaps to a multiple of 45 degrees when it is near one. */
export function snapAngle(angle: number, tol = 14): number {
  const a = normAngle(angle)
  const near = Math.round(a / 45) * 45
  return Math.abs(a - near) <= tol ? normAngle(near) : a
}

/**
 * Moves a piece (its angle is snapped to a multiple of 45 degrees when it is near) so that its corner lies on a nearby target corner;
 * when no corner is near, so that its edge lies against a nearby parallel edge, and then once more by corner (sliding along the edge).
 * `tol` is in the units of the lattice (the leg of a small triangle is 1).
 */
export function snapXf(xf: Xf, targets: SnapTargets, tol: number): Xf {
  let cur: Xf = { ...xf, angle: snapAngle(xf.angle) }
  const byCorner = (t: number): boolean => {
    const poly = xfPoly(cur)
    let best = t
    let move: Pt | null = null
    for (const v of poly) {
      for (const c of targets.corners) {
        const d = Math.hypot(c[0] - v[0], c[1] - v[1])
        if (d < best - 1e-9) {
          best = d
          move = [c[0] - v[0], c[1] - v[1]]
        }
      }
    }
    if (!move) return false
    cur = { ...cur, cx: cur.cx + move[0], cy: cur.cy + move[1] }
    return true
  }
  if (byCorner(tol)) return cur
  const byLattice = (): void => {
    if (!targets.lattice || Math.abs(cur.angle % 90) > 1e-6) return
    const v = xfPoly(cur)[0]!
    const mx = Math.round(v[0]) - v[0]
    const my = Math.round(v[1]) - v[1]
    if (Math.hypot(mx, my) <= tol * 0.85) cur = { ...cur, cx: cur.cx + mx, cy: cur.cy + my }
  }
  // along an edge: the piece's own edge (run the same way as its polygon) against a parallel target edge
  const poly = xfPoly(cur)
  let best = tol
  let move: Pt | null = null
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const d = unit(a, b)
    for (const e of targets.edges) {
      const u = unit(e.seg[0], e.seg[1])
      const cross = d[0] * u[1] - d[1] * u[0]
      const dot = d[0] * u[0] + d[1] * u[1]
      if (Math.abs(cross) > 0.03) continue
      // the piece's edge runs with the silhouette edge (the inside on the same side) or against the edge of another piece
      if (e.same ? dot < 0 : dot > 0) continue
      // the distance of the piece's corner from the line of the edge (positive on the side of the normal (-u.y, u.x))
      const sd = u[0] * (a[1] - e.seg[0][1]) - u[1] * (a[0] - e.seg[0][0])
      if (Math.abs(sd) >= best) continue
      // the two edges must lie beside each other, not just on one line
      const ta = (a[0] - e.seg[0][0]) * u[0] + (a[1] - e.seg[0][1]) * u[1]
      const tb = (b[0] - e.seg[0][0]) * u[0] + (b[1] - e.seg[0][1]) * u[1]
      const len = Math.hypot(e.seg[1][0] - e.seg[0][0], e.seg[1][1] - e.seg[0][1])
      const lo = Math.max(Math.min(ta, tb), 0)
      const hi = Math.min(Math.max(ta, tb), len)
      if (hi - lo < 0.2) continue
      best = Math.abs(sd)
      move = [sd * u[1], -sd * u[0]]
    }
  }
  if (move) {
    cur = { ...cur, cx: cur.cx + move[0], cy: cur.cy + move[1] }
    if (byCorner(tol * 0.7)) return cur
  }
  byLattice()
  return cur
}

/** The edges of polygons as targets to lie against (`same`: see `SnapTargets`). */
export function edgeTargets(polys: Pt[][], same: boolean): SnapTargets['edges'] {
  const out: SnapTargets['edges'] = []
  for (const poly of polys) {
    const o = orient(poly)
    for (let i = 0; i < o.length; i++) out.push({ seg: [o[i]!, o[(i + 1) % o.length]!], same })
  }
  return out
}
