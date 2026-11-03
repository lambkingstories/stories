/**
 * The thank-you sheet: an entry of the thank-you book (the child's words and, when there is one, the drawing) made into a nice sheet that can
 * be sent to grandma and grandpa. The sheet is as long as its content: a heading, who it is for, the date, the words, the drawing and
 * the signature. The breaking of the words into lines is pure (testable); `drawThanksCard` paints the sheet on a canvas.
 */

export interface ThanksTexts {
  /** "Danke!" */
  heading: string
  /** "Ein Dankeschön für Oma"; empty: no such line. */
  forLine: string
  /** The date of the entry, already written out. */
  date: string
  /** The words of the child; may be empty when there is only a drawing. */
  text: string
  /** "Aus dem Dankbuch von Leonas" or the signature of the app. */
  sign: string
}

/** The words broken into lines that are at most `maxWidth` wide (measured by `measure`); a paragraph break stays; a word that is too long is cut. */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const out: string[] = []
  for (const para of text.replace(/\r/g, '').split('\n')) {
    if (!para.trim()) {
      out.push('')
      continue
    }
    let line = ''
    for (const word of para.split(/\s+/).filter(Boolean)) {
      let w = word
      // a word wider than a line is cut where it no longer fits
      while (measure(w) > maxWidth && w.length > 1) {
        let cut = w.length - 1
        while (cut > 1 && measure(w.slice(0, cut)) > maxWidth) cut--
        if (line) {
          out.push(line)
          line = ''
        }
        out.push(w.slice(0, cut))
        w = w.slice(cut)
      }
      const next = line ? `${line} ${w}` : w
      if (line && measure(next) > maxWidth) {
        out.push(line)
        line = w
      } else {
        line = next
      }
    }
    if (line) out.push(line)
  }
  return out
}

export const THANKS_WIDTH = 1080
const MARGIN = 84
const MAX_TEXT_LINES = 14
const MAX_PICTURE_H = 1150

/** Paints the sheet; `drawing` is the picture of the entry (or `null`), `logo` the little lamb of the app. */
export function drawThanksCard(
  texts: ThanksTexts,
  drawing: CanvasImageSource | null,
  drawingSize: { w: number; h: number } | null,
  logo?: CanvasImageSource | null
): HTMLCanvasElement {
  const W = THANKS_WIDTH
  const inner = W - MARGIN * 2
  const font = (size: number, weight: number) => `${weight} ${size}px Nunito, "Segoe UI", system-ui, sans-serif`

  // measuring first, so that the sheet is as high as its content
  const probe = document.createElement('canvas').getContext('2d')!
  const measure = (size: number, weight: number) => (s: string) => {
    probe.font = font(size, weight)
    return probe.measureText(s).width
  }
  let lines = texts.text.trim() ? wrapLines(texts.text.trim(), inner, measure(48, 600)) : []
  if (lines.length > MAX_TEXT_LINES) {
    lines = lines.slice(0, MAX_TEXT_LINES)
    lines[MAX_TEXT_LINES - 1] = `${lines[MAX_TEXT_LINES - 1]!.replace(/\s+$/, '')}…`
  }
  const pictureW = inner
  const pictureH = drawing && drawingSize ? Math.min(MAX_PICTURE_H, Math.round((pictureW * drawingSize.h) / Math.max(1, drawingSize.w))) : 0
  const drawW = drawing && drawingSize ? Math.round((pictureH * drawingSize.w) / Math.max(1, drawingSize.h)) : 0

  let y = MARGIN + 110
  const headingY = y
  y += texts.forLine ? 78 : 20
  const forY = y - 20
  y += 56
  const dateY = y - 16
  y += 36
  const textTop = y
  y += lines.length ? lines.length * 68 + 30 : 0
  const pictureTop = y
  y += pictureH ? pictureH + 40 : 0
  const signY = y + 56
  const H = signY + MARGIN

  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')!
  ctx.fillStyle = '#fbf5e6'
  ctx.fillRect(0, 0, W, H)
  const edge = Math.round(MARGIN * 0.35)
  ctx.strokeStyle = '#d3a93f'
  ctx.lineWidth = 5
  ctx.strokeRect(edge, edge, W - edge * 2, H - edge * 2)

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'
  const mid = W / 2
  ctx.font = font(112, 800)
  ctx.fillStyle = '#1d4a4f'
  ctx.fillText(texts.heading, mid, headingY)
  if (texts.forLine) {
    ctx.font = font(50, 800)
    ctx.fillStyle = '#b8862a'
    ctx.fillText(fitOne(ctx, texts.forLine, inner), mid, forY + 6)
  }
  ctx.font = font(34, 700)
  ctx.fillStyle = '#8a7a55'
  ctx.fillText(texts.date, mid, dateY + 30)

  ctx.textAlign = 'left'
  ctx.font = font(48, 600)
  ctx.fillStyle = '#3a3226'
  lines.forEach((l, i) => ctx.fillText(l, MARGIN, textTop + 52 + i * 68))

  if (drawing && pictureH) {
    const x = Math.round((W - drawW) / 2)
    ctx.save()
    ctx.shadowColor = 'rgba(60, 40, 10, 0.28)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 8
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, pictureTop, drawW, pictureH)
    ctx.restore()
    ctx.drawImage(drawing, x, pictureTop, drawW, pictureH)
  }

  ctx.textAlign = 'center'
  ctx.font = font(32, 700)
  ctx.fillStyle = '#8a7a55'
  ctx.fillText(fitOne(ctx, texts.sign, inner - 140), mid, signY)
  if (logo) {
    const h = 64
    const lw = Number((logo as HTMLImageElement).naturalWidth) || 1
    const lh = Math.max(1, Number((logo as HTMLImageElement).naturalHeight))
    ctx.drawImage(logo, W - MARGIN - (h * lw) / lh, signY - 44, (h * lw) / lh, h)
  }
  return out
}

/** One line shortened with "…" so that it fits (the font of the context is already set). */
function fitOne(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let s = text
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) s = s.slice(0, -1)
  return `${s.trimEnd()}…`
}
