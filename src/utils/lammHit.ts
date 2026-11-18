/**
 * "Das verlorene Lamm": where a finger may touch (no Vue). The streets (floor tiles), the shepherd and the cranks/levers have touch areas that never lie on each other:
 * the building is fitted into the screen first, then every crank gets a round touch area of its own in the free room beside the building (as near to the place where it was
 * put in the level as possible), at least 44 px wide, with a gap to every street (in every position the parts can have, also while they turn or slide), to the lamb, to the
 * shepherd, to the other cranks and to the buttons at the top of the screen. If a building leaves no room, it is shown a little smaller.
 * The game and the tests use the same functions, so the tests prove what the game does.
 */
import { NO_POSE, placeOf, poseOf, type Cell, type ControlRT, type Model, type Pose } from '@/utils/lammGame'
import { fitView, levelBounds, project, type View } from '@/utils/lammView'

/** The smallest touch target in pixels (width and height). */
export const MIN_TARGET = 44
/** The free gap between the touch area of a crank and everything else, in pixels. */
export const GAP = 6
/** The half size of a floor tile for taps (in cells): the lamb walks to the tile whose area is touched. */
export const CELL_EXT = 0.55
export const STAIR_EXT = 0.62

export const cellExt = (c: Cell): number => (c.stair >= 0 ? STAIR_EXT : CELL_EXT)
/** How far from the middle of a tile a touch still counts for it (when no tile is hit exactly): never less than half the smallest target. */
export const cellReach = (s: number): number => Math.max(s * 0.75, MIN_TARGET / 2)
/** The round touch area of the shepherd (and the goal tile). */
export const goalReach = (s: number): number => Math.max(s, MIN_TARGET / 2)
/** The three kinds of devices: a crank (turns or moves several parts), a slider (slides sideways) and a lever (lifts). */
export type HandleKind = 'kurbel' | 'schieber' | 'hebel'
export function handleKind(m: Model, ctl: ControlRT): HandleKind {
  const gs = ctl.groups.map((i) => m.groups[i]!.def)
  const first = gs[0]!
  if (first.kind === 'turn' || first.kind === 'swing' || gs.length > 1) return 'kurbel'
  return first.kind === 'slide' && first.step && first.step[2] === 0 ? 'schieber' : 'hebel'
}
/** The size of the picture of a crank (px, the height it is drawn at when it is as wide as high) and the radius of its round touch area (px): the picture lies inside the circle. */
export const handleSize = (s: number): number => Math.min(52, Math.max(38, s * 1.05))
export const handleRadius = (s: number, kind: HandleKind = 'kurbel'): number => Math.max(MIN_TARGET / 2 + 0.5, handleSize(s) * 0.62 + 1) * (kind === 'schieber' ? 1.2 : 1)
/** The width and height of a picture with the aspect `a` (width / height) that fits into the circle of a touch area of radius r. */
export function pictureSize(r: number, a: number): [number, number] {
  const h = (2 * (r - 1)) / Math.hypot(1, a)
  return [h * a, h]
}

export interface Spot {
  /** The middle of the touch area on the screen. */
  x: number
  y: number
  /** Radius of the round touch area. */
  r: number
}

export interface Plan {
  view: View
  /** One spot for each crank (same order as `Model.controls`). */
  spots: Spot[]
  /** Every crank found a free place with the full size. */
  ok: boolean
  w: number
  h: number
}

/** The rectangles of the buttons at the top of the screen (they lie above the picture and take the touch first): left, right, top, bottom. */
export function hudRects(w: number, h: number): [number, number, number, number][] {
  const land = w > h
  const bottom = land ? 56 : 62
  return [
    [0, 0, 222, bottom],
    [w / 2 - 0.17 * w - 4, 0, w / 2 + 0.17 * w + 4, bottom - 6],
    [w - 112, 0, w, 46]
  ]
}

// ── the places everything can be ────────────────────────────────────────────────────────────────────────────────────────────
/** All poses a group can be in (the turn and the slide also in between, as they move). */
export function posesOfGroup(m: Model, gi: number): Pose[] {
  const g = m.groups[gi]!
  const gd = g.def
  const out: Pose[] = []
  if (gd.kind === 'turn' || gd.kind === 'swing') {
    for (let q = 0; q <= (gd.kind === 'turn' ? 4 : 1); q += 0.25) out.push({ rot: q, dx: 0, dy: 0, dz: 0, on: true, open: true })
  } else if (gd.kind === 'slide') {
    const n = gd.n ?? 1
    const st = gd.step ?? [1, 0, 0]
    for (let t = 0; t <= n + 1e-9; t += 0.25) out.push({ rot: 0, dx: st[0] * t, dy: st[1] * t, dz: st[2] * t, on: true, open: true })
  } else {
    for (let s = 0; s < g.states; s++) out.push(poseOf(g, s))
  }
  return out
}

/** A shape that must stay free of the touch area of a crank: a circle, a capsule (a line with a radius) or a convex polygon. */
export type Shape =
  | { k: 'c'; x: number; y: number; r: number; what: string }
  | { k: 'l'; x: number; y: number; x2: number; y2: number; r: number; what: string }
  | { k: 'p'; pts: number[]; what: string }

const SIDE_THICK = 0.62
const WOOD_THICK = 0.3

/** All shapes of the building on the screen: the tile (top and sides), its touch reach, the lamb or flower that stands on it, a gate, the shepherd and his flock. */
export function streetShapes(m: Model, view: View): Shape[] {
  const s = view.s
  const out: Shape[] = []
  const seen = new Set<string>()
  const add = (key: string, sh: Shape) => {
    if (seen.has(key)) return
    seen.add(key)
    out.push(sh)
  }
  for (const c of m.cells) {
    const poses = c.g < 0 ? [NO_POSE] : posesOfGroup(m, c.g)
    const gate = c.g >= 0 && m.groups[c.g]!.def.kind === 'gate'
    const ext = cellExt(c)
    const thick = (c.wood ? WOOD_THICK : SIDE_THICK) * s
    for (const p of poses) {
      if (!p.on) continue
      const [x, y, z] = placeOf(m, c, p)
      const [cx, cy] = project(view, x, y, z + (c.stair >= 0 ? 0.5 : 0))
      const a = 2 * ext * s
      const b = ext * s
      const k = `${Math.round(cx)}|${Math.round(cy)}`
      // the tile: its top and its sides
      add(`h${k}${c.wood ? 'w' : ''}`, { k: 'p', pts: [cx - a, cy, cx, cy - b, cx + a, cy, cx + a, cy + thick, cx, cy + b + thick, cx - a, cy + thick], what: 'street' })
      // the touch reach around the middle of the tile
      add(`r${k}`, { k: 'c', x: cx, y: cy, r: cellReach(s), what: 'street-reach' })
      // the lamb (or a flower) standing on it
      add(`l${k}`, { k: 'l', x: cx, y: cy, x2: cx, y2: cy - s * 1.0, r: s * 0.42, what: 'lamb' })
      if (gate) add(`g${k}`, { k: 'l', x: cx, y: cy, x2: cx, y2: cy - s * 1.5, r: s * 0.55, what: 'gate' })
    }
  }
  const goal = m.cells[m.goal]!
  const [gx, gy] = project(view, goal.x, goal.y, goal.z)
  out.push({ k: 'c', x: gx, y: gy - s * 0.9, r: goalReach(s), what: 'shepherd' })
  out.push({ k: 'c', x: gx + s * 0.45, y: gy - s * 0.25, r: s * 0.8, what: 'flock' })
  return out
}

/** The distance of a point to a shape (0 inside). */
export function shapeDistance(sh: Shape, px: number, py: number): number {
  if (sh.k === 'c') return Math.max(0, Math.hypot(px - sh.x, py - sh.y) - sh.r)
  if (sh.k === 'l') {
    const dx = sh.x2 - sh.x
    const dy = sh.y2 - sh.y
    const len = dx * dx + dy * dy
    const t = len > 0 ? Math.max(0, Math.min(1, ((px - sh.x) * dx + (py - sh.y) * dy) / len)) : 0
    return Math.max(0, Math.hypot(px - (sh.x + t * dx), py - (sh.y + t * dy)) - sh.r)
  }
  const n = sh.pts.length / 2
  let inside = true
  let best = Infinity
  for (let i = 0; i < n; i++) {
    const ax = sh.pts[2 * i]!
    const ay = sh.pts[2 * i + 1]!
    const bx = sh.pts[2 * ((i + 1) % n)]!
    const by = sh.pts[2 * ((i + 1) % n) + 1]!
    const cr = (bx - ax) * (py - ay) - (by - ay) * (px - ax)
    if (cr < 0) inside = false
    const dx = bx - ax
    const dy = by - ay
    const len = dx * dx + dy * dy
    const t = len > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)))
  }
  return inside ? 0 : best
}

/** The smallest distance of a point to all shapes, and what it is nearest to. */
export function clearanceAt(shapes: Shape[], px: number, py: number): { d: number; what: string } {
  let d = Infinity
  let what = ''
  for (const sh of shapes) {
    const v = shapeDistance(sh, px, py)
    if (v < d) {
      d = v
      what = sh.what
    }
  }
  return { d, what }
}

function boundsOf(sh: Shape): [number, number, number, number] {
  if (sh.k === 'c') return [sh.x - sh.r, sh.y - sh.r, sh.x + sh.r, sh.y + sh.r]
  if (sh.k === 'l') return [Math.min(sh.x, sh.x2) - sh.r, Math.min(sh.y, sh.y2) - sh.r, Math.max(sh.x, sh.x2) + sh.r, Math.max(sh.y, sh.y2) + sh.r]
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (let i = 0; i < sh.pts.length; i += 2) {
    x0 = Math.min(x0, sh.pts[i]!)
    x1 = Math.max(x1, sh.pts[i]!)
    y0 = Math.min(y0, sh.pts[i + 1]!)
    y1 = Math.max(y1, sh.pts[i + 1]!)
  }
  return [x0, y0, x1, y1]
}

// ── the layout ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const STEP = 4
const MARGIN = 5

/** The top and bottom room that the game leaves for the buttons (as before: fitting the building into the screen). */
export function fitRect(w: number, h: number): { left: number; top: number; width: number; height: number } {
  const top = w > h ? 44 : 66
  const bottom = w > h ? 10 : 22
  return { left: 6, top, width: w - 12, height: h - top - bottom }
}

/** The places of the cranks for one view, or null when some crank finds none. */
function placeSpots(m: Model, view: View, w: number, h: number): Spot[] | null {
  const radii = m.controls.map((c) => handleRadius(view.s, handleKind(m, c)))
  const rMax = Math.max(...radii)
  const need = rMax + GAP
  const cols = Math.floor((w - 2 * (rMax + MARGIN)) / STEP) + 1
  const rows = Math.floor((h - 2 * (rMax + MARGIN)) / STEP) + 1
  if (cols < 1 || rows < 1) return null
  const x0 = rMax + MARGIN
  const y0 = rMax + MARGIN
  const blocked = new Uint8Array(cols * rows)
  const mark = (bx0: number, by0: number, bx1: number, by1: number, test: (px: number, py: number) => boolean) => {
    const i0 = Math.max(0, Math.floor((bx0 - x0) / STEP))
    const i1 = Math.min(cols - 1, Math.ceil((bx1 - x0) / STEP))
    const j0 = Math.max(0, Math.floor((by0 - y0) / STEP))
    const j1 = Math.min(rows - 1, Math.ceil((by1 - y0) / STEP))
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (blocked[j * cols + i]) continue
        if (test(x0 + i * STEP, y0 + j * STEP)) blocked[j * cols + i] = 1
      }
    }
  }
  for (const sh of streetShapes(m, view)) {
    const [a, b, c, d] = boundsOf(sh)
    mark(a - need, b - need, c + need, d + need, (px, py) => shapeDistance(sh, px, py) < need)
  }
  for (const [a, b, c, d] of hudRects(w, h)) mark(a - need, b - need, c + need, d + need, (px, py) => px > a - need && px < c + need && py > b - need && py < d + need)
  const spots: Spot[] = []
  for (const ctl of m.controls) {
    const r = radii[ctl.index]!
    const [hx, hy, hz] = ctl.def.h
    const [ax, ay] = project(view, hx, hy, hz)
    const wantX = ax
    const wantY = ay - view.s * 0.55
    let best = -1
    let bestD = Infinity
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (blocked[j * cols + i]) continue
        const d = Math.hypot(x0 + i * STEP - wantX, y0 + j * STEP - wantY)
        if (d < bestD) {
          bestD = d
          best = j * cols + i
        }
      }
    }
    if (best < 0) return null
    const sx = x0 + (best % cols) * STEP
    const sy = y0 + Math.floor(best / cols) * STEP
    spots.push({ x: sx, y: sy, r })
    const reach = r + rMax + GAP
    mark(sx - reach, sy - reach, sx + reach, sy + reach, (px, py) => Math.hypot(px - sx, py - sy) < reach)
  }
  return spots
}

/** Fits a level into a screen of w x h pixels and finds the touch areas of its cranks (the building gets a little smaller until all fit). */
export function planLevel(m: Model, w: number, h: number): Plan {
  const fr = fitRect(w, h)
  const bounds = levelBounds(m, false)
  const first = fitView(bounds, fr.left, fr.top, fr.width, fr.height)
  let s = first.s
  let last: View = first
  for (let tries = 0; tries < 40; tries++) {
    const view = fitView(bounds, fr.left, fr.top, fr.width, fr.height, s)
    last = view
    if (!m.controls.length) return { view, spots: [], ok: true, w, h }
    const spots = placeSpots(m, view, w, h)
    if (spots) return { view, spots, ok: true, w, h }
    s *= 0.94
    if (s < 10) break
  }
  // no room at all: the cranks stay where the level has put them (only seen by the tests)
  const spots = m.controls.map((c) => {
    const [ax, ay] = project(last, ...c.def.h)
    return { x: ax, y: ay - last.s * 0.55, r: handleRadius(last.s, handleKind(m, c)) }
  })
  return { view: last, spots, ok: false, w, h }
}

/** The crank (its number) whose touch area holds a point, or -1. */
export function spotAt(spots: readonly Spot[], px: number, py: number): number {
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < spots.length; i++) {
    const sp = spots[i]!
    const d = Math.hypot(px - sp.x, py - sp.y)
    if (d <= sp.r && d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}
