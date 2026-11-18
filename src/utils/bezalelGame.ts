/**
 * "Bezalels Werkstatt": the rules of the game, without Vue (the view takes the touch and draws; see `BigGameBezalel.vue`).
 * The pieces lie in a tray or on the board. Moving, turning and mirroring never fail; a piece that is dropped nearly right clicks into place
 * (see `snapXf`). The figure is finished when 97 percent of it is covered (`DONE_AT`). Hints show a piece at its place and cost a star
 * (3 stars without a hint, 2 with one, 1 with more). There is no time and nothing is lost.
 */
import { solveWith } from './bezalelSolve'
import {
  AREA, DONE_AT, coverage, edgeTargets, kindOf, normAngle, placementPoly, samplePoints, snapXf, xfPoly,
  type Kind, type PieceId, type Pt, type SnapTargets, type Xf
} from './bezalelTangram'
import type { Level } from './bezalelLevels'

/** How far a piece may be from a corner or an edge and still click into place (units of the lattice: a small triangle's leg is 1). */
export const SNAP_TOL = 0.36

export interface Piece {
  id: PieceId
  kind: Kind
  angle: number
  flip: boolean
  /** The middle of the piece in the world of the figure (only used while it lies on the board). */
  cx: number
  cy: number
  onBoard: boolean
  z: number
}

export interface Game {
  level: Level
  pieces: Piece[]
  samples: Pt[]
  hints: number
  /** The hint on show: the piece and the polygon where it belongs. */
  hint: { id: PieceId; poly: Pt[] } | null
  selected: PieceId | null
  done: boolean
  covered: number
  history: string[]
  zTop: number
}

const rngOf = (seed: number) => {
  let s = (seed * 2654435761 + 12345) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** The angles the pieces start with in the tray: turned about, never the way they lie in the figure when that can be avoided. */
function scatter(g: Game, seed: number) {
  const rand = rngOf(seed)
  for (const p of g.pieces) {
    const sol = g.level.solution.find((s) => s.id === p.id)
    const want = sol ? sol.rot * 45 : 0
    let a = Math.floor(rand() * 8) * 45
    if (a === want) a = normAngle(a + 90 + Math.floor(rand() * 3) * 45)
    p.angle = a
    p.flip = false
    p.onBoard = false
  }
}

export function newGame(level: Level): Game {
  const g: Game = {
    level,
    pieces: level.pieces.map((id, i) => ({ id, kind: kindOf(id), angle: 0, flip: false, cx: 0, cy: 0, onBoard: false, z: i })),
    samples: samplePoints(level.polys),
    hints: 0,
    hint: null,
    selected: null,
    done: false,
    covered: 0,
    history: [],
    zTop: level.pieces.length
  }
  scatter(g, level.index + 1)
  return g
}

export const xfOf = (p: Piece): Xf => ({ kind: p.kind, angle: p.angle, flip: p.flip, cx: p.cx, cy: p.cy })
export const polyOf = (p: Piece): Pt[] => xfPoly(xfOf(p))
export const pieceById = (g: Game, id: PieceId): Piece => g.pieces.find((p) => p.id === id)!

export function starsOf(g: Game): number {
  return g.hints === 0 ? 3 : g.hints === 1 ? 2 : 1
}

function snapshot(g: Game) {
  g.history.push(JSON.stringify(g.pieces))
  if (g.history.length > 60) g.history.shift()
}

export function undo(g: Game): boolean {
  if (g.done) return false
  const s = g.history.pop()
  if (!s) return false
  g.pieces = JSON.parse(s) as Piece[]
  g.hint = null
  evaluate(g)
  return true
}

/** All pieces back into the tray, turned about again (the hints used stay counted). */
export function resetPieces(g: Game): void {
  if (g.done) return
  snapshot(g)
  scatter(g, g.level.index + 1 + g.history.length)
  g.hint = null
  g.selected = null
  evaluate(g)
}

export function evaluate(g: Game): void {
  const board = g.pieces.filter((p) => p.onBoard).map(polyOf)
  const c = coverage(g.samples, board)
  g.covered = c.covered
  if (!g.done && board.length === g.pieces.length && c.covered >= DONE_AT && c.overlap <= 1 - DONE_AT) g.done = true
}

/** The corners and edges that a piece clicks on: those of the figure's outline and those of the other pieces lying on the board. */
export function targetsFor(g: Game, exceptId: PieceId): SnapTargets {
  const others = g.pieces.filter((p) => p.onBoard && p.id !== exceptId).map(polyOf)
  return {
    corners: [...g.level.corners, ...others.flat()],
    edges: [...g.level.edges.map((seg) => ({ seg, same: true })), ...edgeTargets(others, false)],
    lattice: true
  }
}

/** Starts moving a piece: the state is kept for "undo", the piece is selected and put on top. */
export function beginMove(g: Game, id: PieceId): void {
  if (g.done) return
  snapshot(g)
  const p = pieceById(g, id)
  p.z = ++g.zTop
  g.selected = id
  if (g.hint && g.hint.id === id) g.hint = null
}

export function moveTo(g: Game, id: PieceId, cx: number, cy: number): void {
  const p = pieceById(g, id)
  p.cx = cx
  p.cy = cy
  p.onBoard = true
}

/** The piece is let go: back into the tray (`toTray`) or clicked into place on the board. */
export function endMove(g: Game, id: PieceId, toTray: boolean): void {
  const p = pieceById(g, id)
  if (toTray) p.onBoard = false
  else settle(g, id)
  evaluate(g)
}

export function settle(g: Game, id: PieceId): void {
  const p = pieceById(g, id)
  const s = snapXf(xfOf(p), targetsFor(g, id), SNAP_TOL)
  p.angle = s.angle
  p.cx = s.cx
  p.cy = s.cy
}

/** Turns a piece by steps of 45 degrees (clockwise); on the board it clicks into place again. */
export function rotate(g: Game, id: PieceId, steps = 1): void {
  if (g.done) return
  snapshot(g)
  const p = pieceById(g, id)
  p.angle = normAngle(Math.round(p.angle / 45) * 45 + steps * 45)
  p.z = ++g.zTop
  g.selected = id
  if (p.onBoard) settle(g, id)
  evaluate(g)
}

/** Free turning with the handle: the angle follows the finger and rests at every 45 degrees (a detent of 9 degrees). */
export function setAngle(g: Game, id: PieceId, angle: number): void {
  const p = pieceById(g, id)
  const a = normAngle(angle)
  const near = Math.round(a / 45) * 45
  p.angle = Math.abs(a - near) <= 9 ? normAngle(near) : a
}

/** Only the parallelogram has a mirror image of its own (for the other pieces a turn does the same). */
export const canFlip = (id: PieceId): boolean => kindOf(id) === 'P'

export function flip(g: Game, id: PieceId): void {
  if (g.done || !canFlip(id)) return
  snapshot(g)
  const p = pieceById(g, id)
  p.flip = !p.flip
  g.selected = id
  if (p.onBoard) settle(g, id)
  evaluate(g)
}

const onLattice = (poly: Pt[]): boolean => poly.every((q) => Math.abs(q[0] - Math.round(q[0])) < 1e-3 && Math.abs(q[1] - Math.round(q[1])) < 1e-3)

const samePoly = (a: Pt[], b: Pt[]): boolean => a.length === b.length && a.every((p) => b.some((q) => Math.abs(p[0] - q[0]) < 1e-3 && Math.abs(p[1] - q[1]) < 1e-3))

/** Whether a piece lies exactly where a piece of its kind lies in the figure of the level. */
export function pieceInPlace(g: Game, p: Piece): boolean {
  if (!p.onBoard) return false
  const poly = polyOf(p)
  return g.level.solution.some((s) => kindOf(s.id) === p.kind && samePoly(placementPoly(s), poly))
}

/**
 * The hint: shows a piece where it belongs. It looks for a way to fill the figure that keeps the pieces already lying right (the solver),
 * and falls back on the way of the level. Takes the biggest piece that is not in its place yet. Every new hint takes a star (see `starsOf`).
 */
export function hint(g: Game): { id: PieceId; poly: Pt[] } | null {
  if (g.done) return null
  // the pieces that lie on the lattice, inside the figure and not on each other: the solver keeps them where they are
  const lying: { id: PieceId; poly: Pt[] }[] = []
  const taken: Pt[][] = []
  for (const p of g.pieces) {
    if (!p.onBoard) continue
    const poly = polyOf(p)
    if (!onLattice(poly) || !g.level.polys.some((q) => q.length) || !insideFigure(g, poly)) continue
    if (taken.some((t) => overlaps(t, poly))) continue
    taken.push(poly)
    lying.push({ id: p.id, poly })
  }
  const ways = solveWith(g.level.polys, g.level.pieces, lying, 1)
  const plan = (ways.length ? ways[0]! : g.level.solution).map((pl) => ({ id: pl.id, poly: placementPoly(pl) }))
  const open = plan.filter((t) => {
    const p = pieceById(g, t.id)
    return !(p.onBoard && samePoly(polyOf(p), t.poly))
  })
  const pool = open.length ? open : plan
  const best = [...pool].sort((a, b) => AREA[kindOf(b.id)] - AREA[kindOf(a.id)])[0]
  if (!best) return null
  if (!g.hint || g.hint.id !== best.id) g.hints++
  g.hint = best
  return best
}

function insideFigure(g: Game, poly: Pt[]): boolean {
  // the middle of every edge and the corners nudged inwards lie in the figure: a quick test with the sample points of the polygon's own middle
  const c: Pt = [poly.reduce((s, q) => s + q[0], 0) / poly.length, poly.reduce((s, q) => s + q[1], 0) / poly.length]
  const pts: Pt[] = poly.map((q) => [q[0] + (c[0] - q[0]) * 0.1, q[1] + (c[1] - q[1]) * 0.1])
  pts.push(c)
  return pts.every((q) => g.level.polys.some((fp) => pointIn(fp, q)))
}

function pointIn(poly: Pt[], q: Pt): boolean {
  let sign = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const cr = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])
    if (cr < -1e-9) {
      if (sign > 0) return false
      sign = -1
    } else if (cr > 1e-9) {
      if (sign < 0) return false
      sign = 1
    }
  }
  return true
}

function overlaps(a: Pt[], b: Pt[]): boolean {
  const c: Pt = [b.reduce((s, q) => s + q[0], 0) / b.length, b.reduce((s, q) => s + q[1], 0) / b.length]
  const d: Pt = [a.reduce((s, q) => s + q[0], 0) / a.length, a.reduce((s, q) => s + q[1], 0) / a.length]
  const inner = (poly: Pt[], m: Pt): Pt[] => poly.map((q) => [q[0] + (m[0] - q[0]) * 0.1, q[1] + (m[1] - q[1]) * 0.1] as Pt)
  return [...inner(b, c), c].some((q) => pointIn(a, q)) || [...inner(a, d), d].some((q) => pointIn(b, q))
}
