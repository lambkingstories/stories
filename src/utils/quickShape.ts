/**
 * Quick shapes of the painting app. A stroke that is drawn and then held still for a moment turns into the clean figure it was meant to be:
 * an open stroke becomes a straight line, a closed one a circle, an oval, a rectangle, a triangle or another corner figure. Lines
 * click ("like a magnet") onto the ends of the lines that are already there, so a child can close a figure by drawing the last side
 * to the first. All of this is arithmetic in picture pixels, so it can be tested; the painting program only draws the result.
 */

export interface Pt {
  x: number
  y: number
}

export type QuickShape =
  | { kind: 'line'; a: Pt; b: Pt }
  | { kind: 'polygon'; pts: Pt[]; rect: boolean }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; angle: number; round: boolean }

/** A stroke is closed when its two ends are closer than this share of its length. */
const CLOSED_SHARE = 0.22
/** A line that is within this many degrees of flat or upright is made exactly flat or upright. */
export const LINE_SNAP_DEG = 4
/** Right angles and flat sides are caught when they are this close (degrees). */
const AXIS_SNAP_DEG = 7

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)

/** The length of a path. */
export function pathLength(pts: Pt[]): number {
  let n = 0
  for (let i = 1; i < pts.length; i++) n += dist(pts[i - 1]!, pts[i]!)
  return n
}

/** `count` points at equal steps along the path (the first and the last point of the path included). */
export function resample(pts: Pt[], count: number): Pt[] {
  const total = pathLength(pts)
  if (pts.length < 2 || total === 0) return pts.slice()
  const step = total / (count - 1)
  const out: Pt[] = [pts[0]!]
  let acc = 0
  let want = step
  for (let i = 1; i < pts.length && out.length < count; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    const seg = dist(a, b)
    while (seg > 0 && acc + seg >= want && out.length < count) {
      const t = (want - acc) / seg
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      want += step
    }
    acc += seg
  }
  while (out.length < count) out.push(pts[pts.length - 1]!)
  return out
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return dist(p, a)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return dist(p, { x: a.x + dx * t, y: a.y + dy * t })
}

/** Ramer–Douglas–Peucker: the corners of an open path (the first and the last point are always kept). */
export function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts.slice()
  let far = 0
  let at = -1
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distToSegment(pts[i]!, pts[0]!, pts[pts.length - 1]!)
    if (d > far) {
      far = d
      at = i
    }
  }
  if (far <= eps || at < 0) return [pts[0]!, pts[pts.length - 1]!]
  const left = simplify(pts.slice(0, at + 1), eps)
  const right = simplify(pts.slice(at), eps)
  return [...left.slice(0, -1), ...right]
}

/** The corners of a closed stroke: the loop is cut at the point farthest from its start, so that both halves have a long baseline. */
function corners(loop: Pt[], eps: number): Pt[] {
  const first = loop[0]!
  let at = 0
  let far = -1
  loop.forEach((p, i) => {
    const d = dist(p, first)
    if (d > far) {
      far = d
      at = i
    }
  })
  const a = simplify(loop.slice(0, at + 1), eps)
  const b = simplify([...loop.slice(at), first], eps)
  const out = [...a.slice(0, -1), ...b.slice(0, -1)]
  // corners that lie closer together than the tolerance are one corner
  const merged: Pt[] = []
  for (const p of out) {
    const last = merged[merged.length - 1]
    if (last && dist(last, p) < eps * 1.5) continue
    merged.push(p)
  }
  if (merged.length > 1 && dist(merged[0]!, merged[merged.length - 1]!) < eps * 1.5) merged.pop()
  return merged
}

const toDeg = (r: number) => (r * 180) / Math.PI

/** The angle between two directions in degrees (0 – 180). */
function angleAt(prev: Pt, at: Pt, next: Pt): number {
  const a1 = Math.atan2(prev.y - at.y, prev.x - at.x)
  const a2 = Math.atan2(next.y - at.y, next.x - at.x)
  let d = Math.abs(toDeg(a1 - a2)) % 360
  if (d > 180) d = 360 - d
  return d
}

/** An angle (degrees) taken to the nearest multiple of `step` when it is within `window` of it. */
function catchAngle(deg: number, step: number, window: number): number {
  const near = Math.round(deg / step) * step
  return Math.abs(deg - near) <= window ? near : deg
}

/** Four corners that are nearly a rectangle: the rectangle itself, flat when it is nearly flat. */
function asRectangle(c: Pt[]): Pt[] | null {
  for (let i = 0; i < 4; i++) {
    if (Math.abs(angleAt(c[(i + 3) % 4]!, c[i]!, c[(i + 1) % 4]!) - 90) > 24) return null
  }
  const side = (i: number) => dist(c[i]!, c[(i + 1) % 4]!)
  const w = (side(0) + side(2)) / 2
  const h = (side(1) + side(3)) / 2
  if (w < 1 || h < 1) return null
  if (Math.abs(side(0) - side(2)) > 0.35 * w || Math.abs(side(1) - side(3)) > 0.35 * h) return null
  const cx = (c[0]!.x + c[1]!.x + c[2]!.x + c[3]!.x) / 4
  const cy = (c[0]!.y + c[1]!.y + c[2]!.y + c[3]!.y) / 4
  // the direction of the first side and of the third (reversed), averaged
  const d0 = Math.atan2(c[1]!.y - c[0]!.y, c[1]!.x - c[0]!.x)
  const d2 = Math.atan2(c[2]!.y - c[3]!.y, c[2]!.x - c[3]!.x)
  let theta = toDeg(Math.atan2(Math.sin(d0) + Math.sin(d2), Math.cos(d0) + Math.cos(d2)))
  theta = catchAngle(theta, 90, AXIS_SNAP_DEG)
  // a rectangle that is nearly a square becomes one
  let rw = w
  let rh = h
  if (Math.abs(w - h) < 0.12 * Math.max(w, h)) {
    rw = (w + h) / 2
    rh = rw
  }
  const t = (theta * Math.PI) / 180
  const ux = Math.cos(t)
  const uy = Math.sin(t)
  // walk the corners in the direction they were drawn
  const turn = (c[1]!.x - c[0]!.x) * (c[2]!.y - c[1]!.y) - (c[1]!.y - c[0]!.y) * (c[2]!.x - c[1]!.x) >= 0 ? 1 : -1
  const vx = -uy * turn
  const vy = ux * turn
  const hw = rw / 2
  const hh = rh / 2
  return [
    { x: cx - ux * hw - vx * hh, y: cy - uy * hw - vy * hh },
    { x: cx + ux * hw - vx * hh, y: cy + uy * hw - vy * hh },
    { x: cx + ux * hw + vx * hh, y: cy + uy * hw + vy * hh },
    { x: cx - ux * hw + vx * hh, y: cy - uy * hw + vy * hh }
  ]
}

/** A circle or an oval that fits the loop, or `null` when the loop is not round. */
function fitEllipse(loop: Pt[]): QuickShape | null {
  const n = loop.length
  let mx = 0
  let my = 0
  for (const p of loop) {
    mx += p.x
    my += p.y
  }
  mx /= n
  my /= n
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const p of loop) {
    sxx += (p.x - mx) ** 2
    syy += (p.y - my) ** 2
    sxy += (p.x - mx) * (p.y - my)
  }
  sxx /= n
  syy /= n
  sxy /= n
  const tr = sxx + syy
  const det = sxx * syy - sxy * sxy
  const gap = Math.sqrt(Math.max(0, (tr * tr) / 4 - det))
  const l1 = tr / 2 + gap
  const l2 = Math.max(tr / 2 - gap, 1e-9)
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  // for points spread evenly round an ellipse the variance along an axis is half the square of its radius
  const a = Math.sqrt(2 * l1)
  const b = Math.sqrt(2 * l2)
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  let err = 0
  let worst = 0
  for (const p of loop) {
    const u = (p.x - mx) * cos + (p.y - my) * sin
    const v = -(p.x - mx) * sin + (p.y - my) * cos
    const rho = Math.sqrt((u / a) ** 2 + (v / b) ** 2)
    err += Math.abs(rho - 1)
    worst = Math.max(worst, Math.abs(rho - 1))
  }
  err /= n
  if (err > 0.1 || worst > 0.4) return null
  if (b / a > 0.82) {
    const r = (a + b) / 2
    return { kind: 'ellipse', cx: mx, cy: my, rx: r, ry: r, angle: 0, round: true }
  }
  let angle = toDeg(theta)
  angle = catchAngle(angle, 90, AXIS_SNAP_DEG)
  return { kind: 'ellipse', cx: mx, cy: my, rx: a, ry: b, angle, round: false }
}

/**
 * What the stroke was meant to be: a straight line (open strokes), or the clean figure of a closed one. `null`: too short, or a closed
 * stroke that is no figure (a scribble), which stays as it was drawn.
 */
export function recognize(points: Pt[], minLength = 12): QuickShape | null {
  if (points.length < 2) return null
  const length = pathLength(points)
  if (length < minLength) return null
  const first = points[0]!
  const last = points[points.length - 1]!
  const chord = dist(first, last)
  if (chord >= CLOSED_SHARE * length) return { kind: 'line', a: first, b: last }

  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of points) {
    x0 = Math.min(x0, p.x)
    y0 = Math.min(y0, p.y)
    x1 = Math.max(x1, p.x)
    y1 = Math.max(y1, p.y)
  }
  const diag = Math.hypot(x1 - x0, y1 - y0)
  // a scribble that goes back and forth is no figure: its box is small against its length
  if (diag < 0.3 * length) return null

  const loop = resample([...points, first], 72).slice(0, -1)
  const c = corners(loop, diag * 0.07)
  if (c.length >= 3 && c.length <= 4) {
    if (c.length === 4) {
      const rect = asRectangle(c)
      if (rect) return { kind: 'polygon', pts: rect, rect: true }
    }
    return { kind: 'polygon', pts: c, rect: false }
  }
  const round = fitEllipse(loop)
  if (round) return round
  if (c.length >= 5 && c.length <= 8) return { kind: 'polygon', pts: c, rect: false }
  return null
}

/** The points to draw for a shape (a closed figure ends where it starts). */
export function shapePath(s: QuickShape): Pt[] {
  if (s.kind === 'line') return [s.a, s.b]
  if (s.kind === 'polygon') return [...s.pts, s.pts[0]!]
  const t = (s.angle * Math.PI) / 180
  const cos = Math.cos(t)
  const sin = Math.sin(t)
  const out: Pt[] = []
  const steps = 96
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const u = Math.cos(a) * s.rx
    const v = Math.sin(a) * s.ry
    out.push({ x: s.cx + u * cos - v * sin, y: s.cy + u * sin + v * cos })
  }
  return out
}

/** The places a line can click onto: the ends of a line, the corners of a figure. */
export function anchorsOf(s: QuickShape): Pt[] {
  if (s.kind === 'line') return [s.a, s.b]
  if (s.kind === 'polygon') return s.pts.slice()
  const t = (s.angle * Math.PI) / 180
  const cos = Math.cos(t)
  const sin = Math.sin(t)
  return [
    { x: s.cx + s.rx * cos, y: s.cy + s.rx * sin },
    { x: s.cx - s.rx * cos, y: s.cy - s.rx * sin },
    { x: s.cx - s.ry * sin, y: s.cy + s.ry * cos },
    { x: s.cx + s.ry * sin, y: s.cy - s.ry * cos }
  ]
}

/** The nearest anchor within `radius`, or `null`. */
export function nearestAnchor(p: Pt, anchors: Pt[], radius: number): Pt | null {
  let best: Pt | null = null
  let bd = radius
  for (const a of anchors) {
    const d = dist(p, a)
    if (d <= bd) {
      bd = d
      best = a
    }
  }
  return best
}

/**
 * A line from `a` to `b` made clean: each end clicks onto an anchor that is close, and a line that is nearly flat or upright becomes
 * exactly flat or upright (not when an end has just clicked onto an anchor, because then the anchor decides).
 * Returns the line and which ends clicked.
 */
export function tidyLine(a: Pt, b: Pt, anchors: Pt[], radius: number, fixA = false): { a: Pt; b: Pt; snappedA: boolean; snappedB: boolean } {
  const sa = fixA ? null : nearestAnchor(a, anchors, radius)
  const sb = nearestAnchor(b, anchors, radius)
  let A = sa ?? a
  let B = sb ?? b
  if (!sa && !sb) {
    const d = dist(A, B)
    if (d > 0) {
      const deg = toDeg(Math.atan2(B.y - A.y, B.x - A.x))
      const c = catchAngle(deg, 90, LINE_SNAP_DEG)
      if (c !== deg) {
        const r = (c * Math.PI) / 180
        B = { x: A.x + Math.cos(r) * d, y: A.y + Math.sin(r) * d }
      }
    }
  } else if (sa && !sb) {
    // the start clicked; the end is free
    B = b
  }
  return { a: A, b: B, snappedA: !!sa, snappedB: !!sb }
}
