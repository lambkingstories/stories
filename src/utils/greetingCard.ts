/**
 * The greeting card: a finished painting in a cream frame with a few words underneath ("Für Oma", the message and who painted it),
 * ready to be sent to grandma and grandpa. The layout is pure arithmetic (testable); `drawGreetingCard` paints it on a canvas.
 */

export interface CardTexts {
  /** Who the card is for ("Oma"); empty: no "for" line. */
  to: string
  /** The message ("Liebe Grüße"); empty: none. */
  line: string
  /** The name of the child; empty: only the signature of the app. */
  from: string
}

export interface CardLayout {
  width: number
  height: number
  /** Where the picture sits on the card. */
  picX: number
  picY: number
  picW: number
  picH: number
  /** Font sizes and the baselines of the lines under the picture. */
  titleSize: number
  lineSize: number
  smallSize: number
  titleY: number
  lineY: number
  signY: number
}

/** The card is as wide as the picture plus a frame of 6 % on each side; underneath is room for three lines. */
export function cardLayout(picW: number, picH: number): CardLayout {
  const margin = Math.round(picW * 0.06)
  const caption = Math.round(picW * 0.3)
  const width = picW + margin * 2
  const height = picH + margin + caption
  const unit = picW / 100
  const base = margin + picH
  return {
    width,
    height,
    picX: margin,
    picY: margin,
    picW,
    picH,
    titleSize: Math.round(unit * 7.4),
    lineSize: Math.round(unit * 5.2),
    smallSize: Math.round(unit * 3.6),
    titleY: Math.round(base + unit * 11.5),
    lineY: Math.round(base + unit * 19),
    signY: Math.round(base + unit * 26.5)
  }
}

/** The words of the lines: "Für Oma", the message and "Gemalt von Leonas mit LambKing". Nothing is invented for an empty field. */
export function cardLines(texts: CardTexts, labels: { for: string; paintedBy: string; paintedWith: string }): { title: string; line: string; sign: string } {
  const to = texts.to.trim()
  const from = texts.from.trim()
  return {
    title: to ? `${labels.for} ${to}` : '',
    line: texts.line.trim(),
    sign: from ? labels.paintedBy.replace('{name}', from) : labels.paintedWith
  }
}

/** Shortens a line with "…" until it fits `maxWidth` (measured by `measure`). */
export function fitText(text: string, maxWidth: number, measure: (s: string) => number): string {
  if (measure(text) <= maxWidth) return text
  let s = text
  while (s.length > 1 && measure(`${s}…`) > maxWidth) s = s.slice(0, -1)
  return `${s.trimEnd()}…`
}

/** Paints the card: `source` is the finished painting (line art and colours together). */
export function drawGreetingCard(
  source: HTMLCanvasElement,
  texts: CardTexts,
  labels: { for: string; paintedBy: string; paintedWith: string },
  logo?: CanvasImageSource | null
): HTMLCanvasElement {
  const L = cardLayout(source.width, source.height)
  const out = document.createElement('canvas')
  out.width = L.width
  out.height = L.height
  const ctx = out.getContext('2d')!

  // the paper
  ctx.fillStyle = '#fbf5e6'
  ctx.fillRect(0, 0, L.width, L.height)
  // a thin golden line inside the edge
  const edge = Math.round(L.picX * 0.35)
  ctx.strokeStyle = '#d3a93f'
  ctx.lineWidth = Math.max(2, Math.round(L.picW * 0.006))
  ctx.strokeRect(edge, edge, L.width - edge * 2, L.height - edge * 2)
  // the picture with a soft shadow
  ctx.save()
  ctx.shadowColor = 'rgba(60, 40, 10, 0.28)'
  ctx.shadowBlur = L.picW * 0.02
  ctx.shadowOffsetY = L.picW * 0.008
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(L.picX, L.picY, L.picW, L.picH)
  ctx.restore()
  ctx.drawImage(source, L.picX, L.picY, L.picW, L.picH)

  // the words
  const words = cardLines(texts, labels)
  const font = (size: number, weight: number) => `${weight} ${size}px Nunito, "Segoe UI", system-ui, sans-serif`
  const maxW = L.width - L.picX * 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const centre = L.width / 2
  const write = (text: string, y: number, size: number, weight: number, color: string) => {
    if (!text) return
    ctx.font = font(size, weight)
    ctx.fillStyle = color
    ctx.fillText(fitText(text, maxW, (s) => ctx.measureText(s).width), centre, y)
  }
  write(words.title, L.titleY, L.titleSize, 800, '#1d4a4f')
  write(words.line, L.lineY, L.lineSize, 600, '#4a3f2c')
  write(words.sign, L.signY, L.smallSize, 700, '#8a7a55')

  // the little lamb in the corner
  if (logo) {
    const h = L.smallSize * 2.6
    const w = h * (Number((logo as HTMLImageElement).naturalWidth) / Math.max(1, Number((logo as HTMLImageElement).naturalHeight)) || 1)
    ctx.drawImage(logo, L.width - L.picX - w, L.height - L.picX * 0.55 - h, w, h)
  }
  return out
}
