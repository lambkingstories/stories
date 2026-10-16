/**
 * How each tool of the coloring app looks on the paper. Everything is drawn
 * with the 2D canvas, no pictures: the look comes from a paper grain ("tooth")
 * that dry media (coloured pencil, graphite, chalk) only catch the peaks of,
 * from a wet edge and uneven pigment for watercolour, a hard-edged felt tip,
 * and bristle ridges for oil paint.
 *
 * Most tools paint into a separate *stroke layer* first (so one stroke never
 * darkens itself). The layer is laid onto the picture after every piece of the
 * stroke, with the tool's own blend (`BRUSH_LOOK`), so what is seen while
 * painting is exactly what stays. Oil paint and the eraser paint straight onto
 * the picture.
 */

import { ROUND_TIP, tipPath, type Tip } from '@/utils/brushTips'

type RGB = [number, number, number]

function hexToRgb(hex: string): RGB {
  const c = hex.replace('#', '')
  const n = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.padEnd(6, '0')
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0]
}

export { TIP_SHAPES, ROUND_TIP, isTipShape, renderTipShape, tipOf, type Tip, type TipShape } from '@/utils/brushTips'

export type LayeredTool = 'pencil' | 'graphite' | 'felt' | 'watercolor' | 'chalk'

/** One way a finished stroke is laid on the picture. */
export interface BrushPass {
  blend: 'multiply' | 'source-over'
  /** Strength of the pass, 0–1 (the child's "strength" slider scales it). */
  alpha: number
}

export interface BrushLook {
  passes: BrushPass[]
}

export const BRUSH_LOOK: Record<LayeredTool, BrushLook> = {
  // Coloured pencil is see-through wax: colours laid over each other mix, and every pass makes the colour deeper.
  pencil: { passes: [{ blend: 'multiply', alpha: 0.92 }] },
  graphite: { passes: [{ blend: 'multiply', alpha: 0.88 }] },
  felt: { passes: [{ blend: 'multiply', alpha: 0.74 }] },
  // Watercolour covers what is under it, as paint that has dried; going over the same place again makes it denser,
  // and the small second pass makes the layers a little darker.
  watercolor: { passes: [{ blend: 'source-over', alpha: 0.8 }, { blend: 'multiply', alpha: 0.14 }] },
  chalk: { passes: [{ blend: 'source-over', alpha: 0.96 }] }
}

/**
 * How wide a stroke is at a given pen pressure (0–1), as a factor of the brush size: a light touch draws a thin line,
 * pressing harder makes it thicker. A mouse or finger is a steady 0.7, which is exactly the brush size.
 */
export function widthFactor(pressure: number): number {
  return 0.2 + 1.15 * Math.max(0, Math.min(1, pressure))
}

/** How far from the path of a stroke a tool can leave paint, in canvas pixels, at the firmest pressure. */
export function strokeReach(tool: LayeredTool, size: number): number {
  const widest = size * widthFactor(1)
  switch (tool) {
    case 'pencil':
      return widest * 0.35 + 2
    case 'graphite':
      return widest * 0.6 + 2
    case 'felt':
      return widest * 0.6 + 3
    case 'watercolor':
      return widest * 1.9 + 4
    default:
      return widest * 1.1 + 4
  }
}

export function isLayeredTool(tool: string): tool is LayeredTool {
  return tool in BRUSH_LOOK
}

// ── Paper grain ---------------------------------------------------------------

const N = 256

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Smooth noise that repeats every N pixels, `res` cells across. */
function periodicNoise(res: number, rand: () => number): Float32Array {
  const grid = new Float32Array(res * res)
  for (let i = 0; i < grid.length; i++) grid[i] = rand()
  const out = new Float32Array(N * N)
  const s = res / N
  const smooth = (t: number) => t * t * (3 - 2 * t)
  for (let y = 0; y < N; y++) {
    const fy = y * s
    const y0 = Math.floor(fy)
    const ty = smooth(fy - y0)
    const y1 = (y0 + 1) % res
    for (let x = 0; x < N; x++) {
      const fx = x * s
      const x0 = Math.floor(fx)
      const tx = smooth(fx - x0)
      const x1 = (x0 + 1) % res
      const a = grid[y0 * res + x0]! * (1 - tx) + grid[y0 * res + x1]! * tx
      const b = grid[y1 * res + x0]! * (1 - tx) + grid[y1 * res + x1]! * tx
      out[y * N + x] = a * (1 - ty) + b * ty
    }
  }
  return out
}

export type GrainKind = 'fine' | 'coarse'

const OCTAVES: Record<GrainKind, [number, number][]> = {
  // fine: the tooth of drawing paper; coarse: bigger grains for chalk
  fine: [[256, 0.4], [128, 0.3], [64, 0.2], [32, 0.1]],
  coarse: [[64, 0.4], [32, 0.3], [16, 0.2], [8, 0.1]]
}

const fields: Partial<Record<GrainKind, Float32Array>> = {}

/**
 * The grain as percentiles: every value 0–1, and exactly `p` of the pixels are
 * above `1 - p`, so a coverage of 0.4 paints 40 % of the paper's peaks.
 */
export function grainField(kind: GrainKind): Float32Array {
  const cached = fields[kind]
  if (cached) return cached
  const rand = mulberry32(kind === 'fine' ? 1337 : 4242)
  const sum = new Float32Array(N * N)
  for (const [res, weight] of OCTAVES[kind]) {
    const n = periodicNoise(res, rand)
    for (let i = 0; i < sum.length; i++) sum[i]! += n[i]! * weight
  }
  const order = Array.from(sum.keys()).sort((a, b) => sum[a]! - sum[b]!)
  const out = new Float32Array(N * N)
  for (let rank = 0; rank < order.length; rank++) out[order[rank]!] = rank / (order.length - 1)
  fields[kind] = out
  return out
}

const patterns = new Map<string, CanvasPattern>()
const patternHost = (() => {
  let c: CanvasRenderingContext2D | null = null
  return () => (c ??= document.createElement('canvas').getContext('2d')!)
})()

/** A repeating alpha pattern that lets `coverage` (0–1) of the paper's grain through. */
function grainPattern(kind: GrainKind, coverage: number): CanvasPattern {
  const q = Math.max(0.04, Math.min(1, Math.round(coverage * 20) / 20))
  const key = `${kind}:${q}`
  const hit = patterns.get(key)
  if (hit) return hit
  const field = grainField(kind)
  const c = document.createElement('canvas')
  c.width = c.height = N
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(N, N)
  const thr = 1 - q
  const soft = 0.07
  for (let i = 0; i < field.length; i++) {
    const t = Math.max(0, Math.min(1, (field[i]! - thr) / soft + 0.5))
    img.data[i * 4 + 3] = Math.round(t * t * (3 - 2 * t) * 255)
  }
  ctx.putImageData(img, 0, 0)
  const pattern = patternHost().createPattern(c, 'repeat')!
  patterns.set(key, pattern)
  return pattern
}

// ── Dry media: coloured pencil, graphite, chalk -----------------------------------

let tmp: HTMLCanvasElement | null = null
function scratch(w: number, h: number): HTMLCanvasElement {
  tmp ??= document.createElement('canvas')
  if (tmp.width < w) tmp.width = w
  if (tmp.height < h) tmp.height = h
  return tmp
}

export interface DryOptions {
  width: number
  color: string
  /** Share of the paper's grain that takes colour, 0–1: light pressure is low, heavy pressure high. */
  coverage: number
  kind: GrainKind
  /** Shape of the tip; the plain round tip is a round line. */
  tip?: Tip
  /** Where this stroke's grain lies on the paper: each stroke catches other peaks, so going over a place again fills it. */
  shift?: [number, number]
}

function dryChunk(layer: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, o: DryOptions) {
  const pad = o.width / 2 + 2
  const x0 = Math.floor(Math.min(ax, bx) - pad)
  const y0 = Math.floor(Math.min(ay, by) - pad)
  const w = Math.ceil(Math.abs(bx - ax) + pad * 2) + 1
  const h = Math.ceil(Math.abs(by - ay) + pad * 2) + 1
  const t = scratch(w, h)
  const c = t.getContext('2d')!
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.globalCompositeOperation = 'source-over'
  c.clearRect(0, 0, t.width, t.height)
  c.translate(-x0, -y0)
  if (o.tip && !o.tip.round) {
    c.fillStyle = o.color
    c.fill(tipPath(ax, ay, bx, by, o.width / 2, o.tip))
  } else {
    c.strokeStyle = o.color
    c.lineWidth = o.width
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(ax, ay)
    c.lineTo(bx, by)
    c.stroke()
  }
  // Only the peaks of the paper take colour; the pattern is anchored to the picture, not the stroke.
  c.globalCompositeOperation = 'destination-in'
  const pattern = grainPattern(o.kind, o.coverage)
  try {
    pattern.setTransform(new DOMMatrix().translate(o.shift?.[0] ?? 0, o.shift?.[1] ?? 0))
  } catch {
    // an old browser keeps the grain where it is
  }
  c.fillStyle = pattern
  c.fillRect(x0, y0, w, h)
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.globalCompositeOperation = 'source-over'
  layer.drawImage(t, 0, 0, w, h, x0, y0, w, h)
}

export function drawDrySegment(layer: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, o: DryOptions) {
  const dist = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(1, Math.ceil(dist / 120))
  for (let i = 0; i < steps; i++) {
    const a = i / steps
    const b = (i + 1) / steps
    dryChunk(layer, x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b, o)
  }
}

/** Loose chalk dust around a point. */
export function chalkDust(layer: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, count: number) {
  layer.fillStyle = color
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const d = Math.sqrt(Math.random()) * radius
    layer.globalAlpha = 0.25 + Math.random() * 0.5
    const s = 0.7 + Math.random() * 1.6
    layer.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s)
  }
  layer.globalAlpha = 1
}

// ── Felt tip ------------------------------------------------------------------------

export function drawSolidSegment(layer: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, color: string) {
  layer.globalCompositeOperation = 'source-over'
  layer.strokeStyle = color
  layer.fillStyle = color
  layer.lineWidth = width
  layer.lineCap = layer.lineJoin = 'round'
  layer.beginPath()
  layer.moveTo(x1, y1)
  layer.lineTo(x2, y2)
  layer.stroke()
}

export function drawNibSegment(layer: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, a: number, tip: Tip, color: string) {
  layer.globalCompositeOperation = 'source-over'
  layer.fillStyle = color
  layer.fill(tipPath(x1, y1, x2, y2, a, tip))
}

// ── Watercolour -----------------------------------------------------------------------

export interface Bounds {
  x0: number
  y0: number
  x1: number
  y1: number
}

export function emptyBounds(): Bounds {
  return { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
}

export function growBounds(b: Bounds, x: number, y: number, pad: number) {
  b.x0 = Math.min(b.x0, x - pad)
  b.y0 = Math.min(b.y0, y - pad)
  b.x1 = Math.max(b.x1, x + pad)
  b.y1 = Math.max(b.y1, y + pad)
}

function rgba(hex: string, a: number): string {
  const c = hex.replace('#', '')
  const n = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.padEnd(6, '0')
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`
}

/** A faint, soft-edged bloom of pigment that seeps past the stroke, called along the path while painting. */
export function waterBloom(layer: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  layer.globalCompositeOperation = 'source-over'
  const a = Math.random() * Math.PI * 2
  const d = size * (0.2 + Math.random() * 0.25)
  const cx = x + Math.cos(a) * d
  const cy = y + Math.sin(a) * d
  const r = size * (0.45 + Math.random() * 0.25)
  const g = layer.createRadialGradient(cx, cy, 0, cx, cy, r)
  g.addColorStop(0, rgba(color, 0.16))
  g.addColorStop(0.6, rgba(color, 0.07))
  g.addColorStop(1, rgba(color, 0))
  layer.fillStyle = g
  layer.beginPath()
  layer.arc(cx, cy, r, 0, Math.PI * 2)
  layer.fill()
}

function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmpA = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const k = r * 2 + 1
  for (let y = 0; y < h; y++) {
    let sum = 0
    for (let x = -r; x <= r; x++) sum += src[y * w + Math.min(w - 1, Math.max(0, x))]!
    for (let x = 0; x < w; x++) {
      tmpA[y * w + x] = sum / k
      sum += src[y * w + Math.min(w - 1, x + r + 1)]! - src[y * w + Math.max(0, x - r)]!
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0
    for (let y = -r; y <= r; y++) sum += tmpA[Math.min(h - 1, Math.max(0, y)) * w + x]!
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / k
      sum += tmpA[Math.min(h - 1, y + r + 1) * w + x]! - tmpA[Math.max(0, y - r) * w + x]!
    }
  }
  return out
}

export interface ShapeOptions {
  /** Blur radius that defines the "edge" (bigger = wider wet rim). */
  rim: number
  /** How much darker the rim gets, 0–2. */
  rimStrength: number
  /** Overall strength of the body of the stroke, 0–1. */
  body: number
  /** Uneven pigment (blotches and paper tooth), 0–1; 0 = perfectly even like a marker. */
  uneven: number
}

/**
 * Turns the plain shape of a stroke (in `src`) into paint, into `dst`: a darker wet rim where the pigment gathers,
 * blotchy pigment inside, and the paper's tooth showing through. Only the area `x0, y0, w, h` is worked on, so it can be
 * called for each new piece of a stroke while it is drawn; the result of a place only depends on `src`, never on `dst`.
 */
export function shapeRegion(
  src: CanvasRenderingContext2D,
  dst: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  canvasW: number,
  canvasH: number,
  o: ShapeOptions
) {
  x0 = Math.max(0, Math.floor(x0))
  y0 = Math.max(0, Math.floor(y0))
  w = Math.min(canvasW, Math.ceil(x0 + w)) - x0
  h = Math.min(canvasH, Math.ceil(y0 + h)) - y0
  if (w < 2 || h < 2) return
  // the rim needs the neighbours: read a little more than is written
  const pad = o.rim + 1
  const rx0 = Math.max(0, x0 - pad)
  const ry0 = Math.max(0, y0 - pad)
  const rw = Math.min(canvasW, x0 + w + pad) - rx0
  const rh = Math.min(canvasH, y0 + h + pad) - ry0
  const read = src.getImageData(rx0, ry0, rw, rh)
  const rd = read.data
  const alpha = new Float32Array(rw * rh)
  for (let i = 0; i < alpha.length; i++) alpha[i] = rd[i * 4 + 3]! / 255
  const blurred = boxBlur(alpha, rw, rh, o.rim)
  const coarse = grainField('coarse')
  const fine = grainField('fine')
  const out = dst.createImageData(w, h)
  const od = out.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (y0 - ry0 + y) * rw + (x0 - rx0 + x)
      const oi = (y * w + x) * 4
      od[oi] = rd[si * 4]!
      od[oi + 1] = rd[si * 4 + 1]!
      od[oi + 2] = rd[si * 4 + 2]!
      const a = alpha[si]!
      if (a <= 0.003) continue
      const gx = (x0 + x) % N
      const gy = (y0 + y) % N
      // Blotches follow the coarse grain, the tooth the fine one.
      const blotch = 1 - o.uneven * 0.55 * (1 - coarse[gy * N + gx]!)
      const tooth = 1 - o.uneven * 0.3 * (1 - fine[gy * N + gx]!)
      const rim = Math.max(0, a - blurred[si]!) * o.rimStrength
      const v = a * o.body * blotch * tooth + rim
      od[oi + 3] = Math.max(0, Math.min(255, Math.round(v * 255)))
    }
  }
  dst.putImageData(out, x0, y0)
}

/** The look of a tool's finished paint, if it has one that has to be made from the plain shape (`null` = the shape as it is). */
export function shapeOptionsOf(tool: LayeredTool, size: number): ShapeOptions | null {
  if (tool === 'watercolor') return { rim: Math.max(3, Math.round(size * 0.17)), rimStrength: 1.0, body: 0.85, uneven: 0.45 }
  if (tool === 'felt') return { rim: Math.max(2, Math.round(size * 0.07)), rimStrength: 0.9, body: 0.88, uneven: 0 }
  return null
}

// ── Oil paint -------------------------------------------------------------------------------

/** Lighter (amount > 0) or darker (< 0) version of a colour, as an rgb() string. */
export function shade(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  const n = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.padEnd(6, '0')
  const ch = [0, 2, 4].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(n.slice(i, i + 2), 16) + amount))))
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`
}

export interface OilState {
  /** Paint on the brush, 1 at the start of a stroke and running out over long strokes. */
  load: number
  travelled: number
  /** The paint on the brush (0–255): the colour the child chose, which stays the same for the whole stroke. */
  color: RGB
  /** The bristles across the brush: how much paint each carries and how light or dark it shows. */
  bristles: { amp: number; tone: number }[]
  /** Where the next dab goes down (`rest`: distance since the last dab, -1 before the first one). */
  place: { rest: number }
  /** The way the brush moves, for a round brush whose bristles stand across it. */
  dir: [number, number]
}

export function newOilState(hex: string): OilState {
  return {
    load: 1,
    travelled: 0,
    color: hexToRgb(hex),
    bristles: Array.from({ length: 34 }, () => ({ amp: 0.55 + Math.random() * 0.45, tone: Math.random() - 0.5 })),
    place: { rest: -1 },
    dir: [1, 0]
  }
}

/** How much of the new paint a place accepts, 0–1 (the "stay inside the lines" help). */
export type AllowFn = (x: number, y: number) => number

/** The places where a dab goes down along a piece of a stroke; `st.rest` is the distance from the last dab to the piece's start. */
function dabsAlong(x1: number, y1: number, x2: number, y2: number, spacing: number, st: { rest: number }): { x: number; y: number }[] {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const out: { x: number; y: number }[] = []
  let s = spacing - st.rest
  while (s <= len + 1e-6) {
    const t = len > 0 ? s / len : 0
    out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t })
    s += spacing
  }
  st.rest = len - (s - spacing)
  return out
}

/**
 * Oil paint: thick and opaque, with bristle ridges. The paint is dry the moment it is on: the new colour covers what is
 * under it, and the brush never changes colour. Going over a place again fills the gaps between the bristles and makes
 * the colour a little denser and darker. A brush that runs dry leaves streaks where the bristles skip and the canvas shows.
 * The paint is put straight into the picture's pixels, dab by dab along the stroke.
 */
export function drawOilSegment(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, size: number, state: OilState, strength = 1, tip: Tip = ROUND_TIP, allow?: AllowFn) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  state.travelled += len
  state.load = Math.max(0.28, 1 - Math.max(0, state.travelled - 260) / 1500)
  if (len > 0.01) state.dir = [(x2 - x1) / len, (y2 - y1) / len]

  const a = tip.round ? size * 0.4 : size * 0.5
  const b = a * tip.ratio
  const spacing = Math.max(1.5, Math.min(a, b) * 0.55)
  if (state.place.rest < 0) state.place.rest = spacing
  const dabs = dabsAlong(x1, y1, x2, y2, spacing, state.place)
  if (!dabs.length) return

  const cw = ctx.canvas.width
  const ch = ctx.canvas.height
  const reach = Math.hypot(a, b) + 2
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const d of dabs) {
    minX = Math.min(minX, d.x)
    maxX = Math.max(maxX, d.x)
    minY = Math.min(minY, d.y)
    maxY = Math.max(maxY, d.y)
  }
  const x0 = Math.max(0, Math.floor(minX - reach))
  const y0 = Math.max(0, Math.floor(minY - reach))
  const x1c = Math.min(cw, Math.ceil(maxX + reach))
  const y1c = Math.min(ch, Math.ceil(maxY + reach))
  const w = x1c - x0
  const h = y1c - y0
  if (w < 1 || h < 1) return
  const img = ctx.getImageData(x0, y0, w, h)
  const px = img.data
  const grain = grainField('coarse')
  const ca = Math.cos(tip.angle)
  const sa = Math.sin(tip.angle)
  const n = state.bristles.length
  const minAB = Math.min(a, b)
  const [tx, ty] = state.dir
  const load = state.load
  // how many dabs go over one spot as the brush passes
  const dabsPerSpot = Math.max(1, (2 * a) / spacing)

  for (const d of dabs) {
    const ya = Math.max(y0, Math.floor(d.y - reach))
    const yb = Math.min(y0 + h - 1, Math.ceil(d.y + reach))
    const xa = Math.max(x0, Math.floor(d.x - reach))
    const xb = Math.min(x0 + w - 1, Math.ceil(d.x + reach))
    for (let py = ya; py <= yb; py++) {
      for (let pxl = xa; pxl <= xb; pxl++) {
        const ddx = pxl + 0.5 - d.x
        const ddy = py + 0.5 - d.y
        const u = (ddx * ca + ddy * sa) / a
        const v = (-ddx * sa + ddy * ca) / b
        const m = tip.kind === 'ellipse' ? Math.hypot(u, v) : Math.max(Math.abs(u), Math.abs(v))
        const cover = Math.max(0, Math.min(1, (1 - m) * minAB + 0.5))
        if (cover <= 0.01) continue
        const s = tip.round ? (-ty * ddx + tx * ddy) / a : u
        const bi = Math.min(n - 1, Math.max(0, Math.floor((s * 0.5 + 0.5) * n)))
        const br = state.bristles[bi]!
        // a loaded brush paints with all bristles; a dry one skips some and only catches the peaks of the canvas
        let f = br.amp * (0.55 + 0.45 * load)
        if (load < 0.7 && br.amp < 0.95 - load * 0.5) f *= 0.2
        if (load < 0.85) f *= 0.35 + 0.65 * grain[((py & 255) << 8) | (pxl & 255)]!
        let flow = cover * f * strength
        if (allow) flow *= allow(pxl, py)
        if (flow < 0.02) continue
        const i = ((py - y0) * w + (pxl - x0)) * 4
        const alpha = px[i + 3]! / 255
        const tone = 1 + br.tone * 0.1
        const bc: RGB = [Math.min(255, state.color[0] * tone), Math.min(255, state.color[1] * tone), Math.min(255, state.color[2] * tone)]
        if (alpha < 0.03) {
          px[i] = bc[0]
          px[i + 1] = bc[1]
          px[i + 2] = bc[2]
          px[i + 3] = Math.min(1, flow) * 255
        } else {
          // Paint covers: the new colour replaces the old one where the bristles reach. Every spot is gone over by
          // several dabs, each takes its share, so the whole of the stroke ends up with about `flow` of the new colour.
          const kTotal = Math.min(1, flow * 1.1)
          const k = 1 - Math.pow(1 - kTotal, 1 / dabsPerSpot)
          // thick paint gets a little deeper where it is laid on paint again
          const deep = 1 - 0.04 * k * Math.min(1, alpha + 0.3)
          px[i] = (px[i]! + (bc[0] - px[i]!) * k) * deep
          px[i + 1] = (px[i + 1]! + (bc[1] - px[i + 1]!) * k) * deep
          px[i + 2] = (px[i + 2]! + (bc[2] - px[i + 2]!) * k) * deep
          px[i + 3] = (alpha + (1 - alpha) * Math.min(1, flow)) * 255
        }
      }
    }
  }
  ctx.putImageData(img, x0, y0)
}

// ── Eraser ---------------------------------------------------------------------------------------

export function eraseSegment(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.globalAlpha = 1
  ctx.strokeStyle = ctx.fillStyle = '#000'
  ctx.lineWidth = width
  ctx.lineCap = ctx.lineJoin = 'round'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = Math.min(6, width * 0.25)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2 + 0.01, y2)
  ctx.stroke()
  ctx.restore()
}

// ── One stroke, tool by tool -----------------------------------------------------------------------

export interface SegmentOptions {
  /** Brush size in canvas pixels, at the standard pressure. */
  size: number
  color: string
  /** 0.1–1, already smoothed. A mouse or finger is a steady 0.7, a pen reports its real pressure. */
  pressure: number
  /** The shape of the tip (round when missing). */
  tip?: Tip
}

export interface StrokeState {
  bloomAcc: number
  travel: number
  /** Where this stroke's grain lies on the paper. */
  shift: [number, number]
}

export function newStrokeState(): StrokeState {
  return { bloomAcc: 0, travel: 0, shift: [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)] }
}

/** Paints one piece of a stroke of a layered tool into its stroke layer. */
export function paintLayerSegment(
  tool: LayeredTool,
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  o: SegmentOptions,
  st: StrokeState
) {
  // the width follows the pressure: a light touch is thin, a firm one is thick
  const sz = o.size * widthFactor(o.pressure)
  const pe = o.pressure
  switch (tool) {
    case 'pencil':
      // Light pressure only catches the peaks of the paper, heavy pressure fills the valleys too.
      drawDrySegment(ctx, x1, y1, x2, y2, {
        width: Math.max(1.2, sz * 0.6),
        color: o.color,
        coverage: 0.22 + 0.7 * pe,
        kind: 'fine',
        tip: o.tip,
        shift: st.shift
      })
      break
    case 'graphite': {
      const width = Math.max(1, sz * 0.42)
      drawDrySegment(ctx, x1, y1, x2, y2, { width, color: o.color, coverage: 0.4 + 0.5 * pe, kind: 'fine', tip: o.tip, shift: st.shift })
      // soft grey smear around the line
      drawDrySegment(ctx, x1, y1, x2, y2, { width: width * 2.4, color: o.color, coverage: 0.07 + 0.1 * pe, kind: 'fine', tip: o.tip, shift: st.shift })
      break
    }
    case 'felt': {
      const width = Math.max(2, sz * 1.05)
      if (o.tip && !o.tip.round) drawNibSegment(ctx, x1, y1, x2, y2, width / 2, o.tip, o.color)
      else drawSolidSegment(ctx, x1, y1, x2, y2, width, o.color)
      // The felt dries in faint streaks along the stroke.
      const dx = x2 - x1
      const dy = y2 - y1
      const len = Math.hypot(dx, dy)
      if (len > 0.5) {
        const nx = -dy / len
        const ny = dx / len
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineCap = 'butt'
        for (let i = 0; i < 3; i++) {
          const off = (Math.random() - 0.5) * width * 0.7
          ctx.globalAlpha = 0.07 + Math.random() * 0.07
          ctx.lineWidth = Math.max(0.6, width * 0.05)
          ctx.beginPath()
          ctx.moveTo(x1 + nx * off, y1 + ny * off)
          ctx.lineTo(x2 + nx * off, y2 + ny * off)
          ctx.stroke()
        }
        ctx.restore()
      }
      break
    }
    case 'watercolor': {
      const dist = Math.hypot(x2 - x1, y2 - y1)
      st.travel += dist
      const w = Math.max(3, sz * 1.5)
      // The wash breathes: its width drifts a little, so the edge is never a perfect tube.
      const wob = 0.82 + 0.2 * Math.sin(st.travel / (sz * 2.6)) + 0.1 * Math.sin(st.travel / (sz * 0.9 + 1))
      // the tip keeps its angle while it is pulled along the path
      const tip = o.tip ?? ROUND_TIP
      const reach = w * 0.37 * wob * (tip.round ? 0.8 : 1)
      drawNibSegment(ctx, x1, y1, x2, y2, reach, tip, o.color)
      st.bloomAcc += dist
      while (st.bloomAcc > Math.max(8, sz * 0.7)) {
        st.bloomAcc -= Math.max(8, sz * 0.7)
        waterBloom(ctx, x2, y2, w, o.color)
      }
      break
    }
    case 'chalk':
      drawDrySegment(ctx, x1, y1, x2, y2, {
        width: Math.max(3, sz * 1.1),
        color: o.color,
        coverage: 0.52 + 0.38 * pe,
        kind: 'coarse',
        tip: o.tip,
        shift: st.shift
      })
      chalkDust(ctx, x2, y2, sz * 0.75, o.color, 3)
      break
  }
}
