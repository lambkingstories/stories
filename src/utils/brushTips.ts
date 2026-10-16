/**
 * The shape of a brush's tip: round, oval, flat or calligraphy.
 *
 * A tip is an oval or a rectangle with a long half axis `a` and a short half axis `a * ratio`, turned by
 * `angle` (canvas radians, the y axis points down). It keeps its angle while it is pulled along, so a flat brush
 * paints thick across its length and thin along its edge, like a real one.
 */

export type TipShape = 'round' | 'oval-left' | 'oval-right' | 'flat' | 'tall' | 'calligraphy'

/** All shapes, in the order they are offered. */
export const TIP_SHAPES: TipShape[] = ['round', 'oval-left', 'oval-right', 'flat', 'tall', 'calligraphy']

export interface Tip {
  kind: 'ellipse' | 'rect'
  ratio: number
  angle: number
  /** The plain round tip: tools keep the look they always had. */
  round: boolean
}

const deg = (d: number) => (d * Math.PI) / 180

export function tipOf(shape: TipShape): Tip {
  switch (shape) {
    case 'oval-left':
      return { kind: 'ellipse', ratio: 0.45, angle: deg(35), round: false }
    case 'oval-right':
      return { kind: 'ellipse', ratio: 0.45, angle: deg(-35), round: false }
    case 'flat':
      return { kind: 'rect', ratio: 0.22, angle: 0, round: false }
    case 'tall':
      return { kind: 'rect', ratio: 0.22, angle: deg(90), round: false }
    case 'calligraphy':
      return { kind: 'rect', ratio: 0.2, angle: deg(-45), round: false }
    default:
      return { kind: 'ellipse', ratio: 1, angle: 0, round: true }
  }
}

export const ROUND_TIP: Tip = tipOf('round')

export function isTipShape(v: unknown): v is TipShape {
  return typeof v === 'string' && (TIP_SHAPES as string[]).includes(v)
}

// ── The area a tip covers ---------------------------------------------------------------------

/** The area covered by a tip (long half axis `a`) pulled from one point to the next. */
export function tipPath(x1: number, y1: number, x2: number, y2: number, a: number, tip: Tip): Path2D {
  const path = new Path2D()
  const b = a * tip.ratio
  const len = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(1, Math.ceil(len / Math.max(1, Math.min(a, b) * 0.5)))
  const ca = Math.cos(tip.angle)
  const sa = Math.sin(tip.angle)
  for (let i = 0; i <= steps; i++) {
    const x = x1 + ((x2 - x1) * i) / steps
    const y = y1 + ((y2 - y1) * i) / steps
    if (tip.kind === 'ellipse') {
      path.moveTo(x + a * ca, y + a * sa)
      path.ellipse(x, y, a, b, tip.angle, 0, Math.PI * 2)
    } else {
      // corners of the rotated rectangle, all in the same direction so the pieces join into one area
      path.moveTo(x + a * ca - b * sa, y + a * sa + b * ca)
      path.lineTo(x - a * ca - b * sa, y - a * sa + b * ca)
      path.lineTo(x - a * ca + b * sa, y - a * sa - b * ca)
      path.lineTo(x + a * ca + b * sa, y + a * sa - b * ca)
      path.closePath()
    }
  }
  return path
}

// ── The picture of a tip in the shape list --------------------------------------------------------

/** Draws the tip itself (not a stroke) so the list shows what each shape is. */
export function renderTipShape(canvas: HTMLCanvasElement, tip: Tip, color: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  const a = Math.min(w, h) * 0.38
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(20, 24, 32, 0.45)'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  const path = tipPath(w / 2, h / 2, w / 2, h / 2, a, tip)
  ctx.fill(path)
  ctx.stroke(path)
}
