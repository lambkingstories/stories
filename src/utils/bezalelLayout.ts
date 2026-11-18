/**
 * "Bezalels Werkstatt": where things lie on the screen. Pure functions (tested in `tests/bezalelLayout.test.ts`).
 * Upright (a phone held up): the figure on top, the toolbar in a row, the tray (the work table) at the bottom.
 * Landscape: the toolbar in a column on the left, the figure in the middle, the tray on the right. Both sizes are measured again at every touch.
 */
import { kindOf, radiusOf, xfPoly, distToPoly, inConvex, type PieceId, type Pt } from './bezalelTangram'
import type { Game, Piece } from './bezalelGame'
import { polyOf } from './bezalelGame'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Layout {
  W: number
  H: number
  portrait: boolean
  top: number
  board: Rect
  tray: Rect
  toolbar: Rect
  /** Pixels per unit of the lattice on the board and in the tray (the tray is never bigger than the board). */
  s: number
  ts: number
  /** The world to the screen: x = ox + wx * s. */
  ox: number
  oy: number
  slots: Record<string, { x: number; y: number }>
}

export const TOP_BAR = 56
export const TOOL = 60

const inside = (r: Rect, x: number, y: number) => x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h

export function computeLayout(W: number, H0: number, box: { x0: number; y0: number; x1: number; y1: number }, ids: PieceId[], inset = { top: 0, bottom: 0 }): Layout {
  // the strip below the screen's safe area (a phone's home bar) is left empty
  const H = H0 - inset.bottom
  const portrait = H >= W * 0.95
  let board: Rect
  let tray: Rect
  let toolbar: Rect
  const top = TOP_BAR + inset.top
  if (portrait) {
    const trayH = Math.max(170, Math.min(300, Math.round(H * 0.3)))
    toolbar = { x: 0, y: H - trayH - TOOL, w: W, h: TOOL }
    tray = { x: 0, y: H - trayH, w: W, h: trayH }
    board = { x: 0, y: top, w: W, h: toolbar.y - top }
  } else {
    toolbar = { x: 0, y: top, w: TOOL, h: H - top }
    const rest = W - TOOL
    const bw = Math.round(rest * 0.56)
    board = { x: TOOL, y: top, w: bw, h: H - top }
    tray = { x: TOOL + bw, y: top, w: rest - bw, h: H - top }
  }
  const bw = box.x1 - box.x0
  const bh = box.y1 - box.y0
  const pad = 22
  const s = Math.max(16, Math.min((board.w - pad * 2) / bw, (board.h - pad * 2) / bh, 96))
  const ox = board.x + board.w / 2 - ((box.x0 + box.x1) / 2) * s
  const oy = board.y + board.h / 2 - ((box.y0 + box.y1) / 2) * s
  // the tray: every piece gets a square cell that fits it however it is turned; the biggest scale at which all cells fit in rows
  const gap = 14
  const inner: Rect = { x: tray.x + 8, y: tray.y + 8, w: tray.w - 16, h: tray.h - 16 }
  const pack = (ts: number): Record<string, { x: number; y: number }> | null => {
    const cells = ids.map((id) => ({ id, c: 2 * radiusOf(kindOf(id)) * ts + gap })).sort((p, q) => q.c - p.c)
    // fill rows from left to right
    const rows: { items: { id: PieceId; c: number }[]; w: number; h: number }[] = []
    for (const cell of cells) {
      let row = rows[rows.length - 1]
      if (!row || row.w + cell.c > inner.w + 0.5) {
        row = { items: [], w: 0, h: 0 }
        rows.push(row)
      }
      row.items.push(cell)
      row.w += cell.c
      row.h = Math.max(row.h, cell.c)
    }
    const total = rows.reduce((n, r) => n + r.h, 0)
    if (total > inner.h + 0.5) return null
    // every row centred in the tray, the rows together centred as well; the pieces in a row on the line of their middles
    const out: Record<string, { x: number; y: number }> = {}
    let y = inner.y + (inner.h - total) / 2
    for (const row of rows) {
      let x = inner.x + (inner.w - row.w) / 2
      for (const it of row.items) {
        out[it.id] = { x: x + it.c / 2, y: y + row.h / 2 }
        x += it.c
      }
      y += row.h
    }
    return out
  }
  let ts = s
  let slots = pack(ts)
  while (!slots && ts > 12) {
    ts -= 1
    slots = pack(ts)
  }
  return { W, H: H0, portrait, top, board, tray, toolbar, s, ts, ox, oy, slots: slots ?? {} }
}

export const toScreen = (l: Layout, p: Pt): Pt => [l.ox + p[0] * l.s, l.oy + p[1] * l.s]
export const toWorld = (l: Layout, x: number, y: number): Pt => [(x - l.ox) / l.s, (y - l.oy) / l.s]

/** The corners of a piece on the screen: on the board at the scale of the board, in the tray at its slot at the scale of the tray. */
export function screenPoly(l: Layout, p: Piece): Pt[] {
  if (p.onBoard) return polyOf(p).map((q) => toScreen(l, q))
  const slot = l.slots[p.id] ?? { x: l.tray.x + l.tray.w / 2, y: l.tray.y + l.tray.h / 2 }
  return xfPoly({ kind: p.kind, angle: p.angle, flip: p.flip, cx: 0, cy: 0 }).map((q) => [slot.x + q[0] * l.ts, slot.y + q[1] * l.ts] as Pt)
}

/** The middle of a piece on the screen. */
export function screenCentre(l: Layout, p: Piece): Pt {
  if (p.onBoard) return toScreen(l, [p.cx, p.cy])
  const slot = l.slots[p.id] ?? { x: l.tray.x + l.tray.w / 2, y: l.tray.y + l.tray.h / 2 }
  return [slot.x, slot.y]
}

/**
 * The piece under a touch: inside a piece (the one on top), or else the nearest one within `pad` pixels of its edge, so that even the small
 * triangles are easy to take (the touch area is at least 44 pixels across).
 */
export function hitTest(g: Game, l: Layout, x: number, y: number, pad = 16): Piece | null {
  const sorted = [...g.pieces].sort((a, b) => b.z - a.z)
  let near: Piece | null = null
  let nearD = pad
  for (const p of sorted) {
    const poly = screenPoly(l, p)
    if (inConvex(poly, x, y)) return p
    const d = distToPoly(poly, x, y)
    if (d < nearD) {
      nearD = d
      near = p
    }
  }
  return near
}

export const inTray = (l: Layout, x: number, y: number): boolean => inside(l.tray, x, y)

/** Keeps the middle of a piece on the board area (so that a piece can never be lost off the screen); the board area is the whole screen but the bars. */
export function clampCentre(l: Layout, x: number, y: number): Pt {
  const m = 24
  const minX = l.portrait ? m : l.toolbar.x + l.toolbar.w + m
  const minY = l.top + m
  return [Math.max(minX, Math.min(l.W - m, x)), Math.max(minY, Math.min(l.H - m, y))]
}
