/**
 * Stickers cover the black lines of the picture, like a real sticker. The stamps themselves stay in the painted layer (so undo,
 * the eraser, the time-lapse and the glitter work as before). What is new is a mask of the places where a sticker was put on, and
 * a cover canvas lying over the line art that shows the painted layer only inside that mask.
 *
 * The mask has its own history, kept in step with the history of the paint (one patch for each step of the paint).
 * A stroke that changes the paint inside the mask takes the mask away there: the paint has been touched, the lines show again.
 */
import { PatchHistory } from './patchHistory'

/** A rectangle of the picture. */
export interface CoverRect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** The pixels of a sprite that count as sticker: a hard mask (alpha 255 where the sprite has colour at all). */
export function coverMaskPixels(alpha: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(alpha.length)
  for (let i = 3; i < alpha.length; i += 4) {
    if ((alpha[i] ?? 0) > 8) out[i] = 255
  }
  return out
}

/** Takes the mask away (alpha 0) wherever the paint changed between `before` and `after`. Returns true when something was taken away. */
export function clearWhereChanged(mask: Uint8ClampedArray, before: Uint8ClampedArray, after: Uint8ClampedArray): boolean {
  let any = false
  for (let i = 0; i < mask.length; i += 4) {
    if ((mask[i + 3] ?? 0) === 0) continue
    if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2] || before[i + 3] !== after[i + 3]) {
      mask[i + 3] = 0
      any = true
    }
  }
  return any
}

/** What the cover needs to know of a stamp picture. */
export interface CoverSprite {
  canvas: HTMLCanvasElement
  px: number
  alpha: Uint8ClampedArray
}

export class StickerCover {
  private readonly mask = document.createElement('canvas')
  private readonly mctx = this.mask.getContext('2d', { willReadFrequently: true })!
  private base: HTMLCanvasElement | null = null
  private readonly sprites = new WeakMap<object, HTMLCanvasElement>()
  /** The mask changes in step with the paint. */
  readonly history = new PatchHistory(40)
  /** The mask may hold something (false: nothing has to be drawn or saved). */
  any = false

  constructor(
    private readonly paint: () => HTMLCanvasElement | null,
    private readonly view: () => HTMLCanvasElement | null
  ) {}

  /** A new picture size: everything is empty. */
  size(w: number, h: number) {
    this.mask.width = w
    this.mask.height = h
    const v = this.view()
    if (v) {
      v.width = w
      v.height = h
    }
    this.any = false
    this.history.clear()
  }

  /** Before a stamp is put on: keeps the mask as it is now. */
  begin() {
    this.base = this.base ?? document.createElement('canvas')
    this.base.width = this.mask.width
    this.base.height = this.mask.height
    this.base.getContext('2d')!.drawImage(this.mask, 0, 0)
  }

  /** The mask of a sprite: hard edged, one pixel wider all round (so the soft edge of the sticker covers the line too). */
  private spriteMask(s: CoverSprite): HTMLCanvasElement {
    const hit = this.sprites.get(s.canvas)
    if (hit) return hit
    const c = document.createElement('canvas')
    c.width = s.px
    c.height = s.px
    const g = c.getContext('2d')!
    const hard = document.createElement('canvas')
    hard.width = s.px
    hard.height = s.px
    hard.getContext('2d')!.putImageData(new ImageData(coverMaskPixels(s.alpha), s.px, s.px), 0, 0)
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) g.drawImage(hard, dx, dy)
    this.sprites.set(s.canvas, c)
    return c
  }

  /** Puts a sticker on the mask. With `rect` the rectangle is first set back to the mask from `begin` (a sticker that is still moved). */
  put(s: CoverSprite, x: number, y: number, size: number, angle: number, rect?: CoverRect) {
    const m = this.mctx
    if (rect && this.base) {
      const w = rect.x1 - rect.x0
      const h = rect.y1 - rect.y0
      if (w > 0 && h > 0) {
        m.clearRect(rect.x0, rect.y0, w, h)
        m.drawImage(this.base, rect.x0, rect.y0, w, h, rect.x0, rect.y0, w, h)
      }
    }
    m.save()
    m.translate(x, y)
    m.rotate(angle)
    m.drawImage(this.spriteMask(s), -size / 2, -size / 2, size, size)
    m.restore()
    this.any = true
    this.refresh(rect ?? { x0: x - size, y0: y - size, x1: x + size, y1: y + size })
  }

  /** The cover shows the paint inside the mask. */
  refresh(r?: CoverRect) {
    const v = this.view()
    const p = this.paint()
    if (!v || !p) return
    const x0 = Math.max(0, Math.floor(r?.x0 ?? 0))
    const y0 = Math.max(0, Math.floor(r?.y0 ?? 0))
    const x1 = Math.min(v.width, Math.ceil(r?.x1 ?? v.width))
    const y1 = Math.min(v.height, Math.ceil(r?.y1 ?? v.height))
    if (x1 <= x0 || y1 <= y0) return
    const g = v.getContext('2d')!
    g.save()
    // `destination-in` works on the whole canvas: only this rectangle may change
    g.beginPath()
    g.rect(x0, y0, x1 - x0, y1 - y0)
    g.clip()
    g.globalCompositeOperation = 'source-over'
    g.clearRect(x0, y0, x1 - x0, y1 - y0)
    if (this.any) {
      g.drawImage(p, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0)
      g.globalCompositeOperation = 'destination-in'
      g.drawImage(this.mask, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0)
    }
    g.restore()
  }

  /**
   * One step of the paint is final: the mask gets its step too.
   * `rect` is the changed area, `kind` what was done (`clear`: all paint taken away), `before` the paint of the area before the step.
   */
  commit(rect: CoverRect, kind: 'stamp' | 'clear' | 'other', before: ImageData | null, paintCtx: CanvasRenderingContext2D) {
    const w = this.mask.width
    const h = this.mask.height
    const m = this.mctx
    if (kind === 'clear') {
      if (!this.any) return this.dummy()
      const was = m.getImageData(0, 0, w, h)
      m.clearRect(0, 0, w, h)
      this.history.record(m, 0, 0, w, h, was)
      this.any = false
      this.refresh()
      return
    }
    const x = Math.max(0, Math.floor(rect.x0))
    const y = Math.max(0, Math.floor(rect.y0))
    const rw = Math.min(w, Math.ceil(rect.x1)) - x
    const rh = Math.min(h, Math.ceil(rect.y1)) - y
    if (rw < 1 || rh < 1) return this.dummy()
    if (kind === 'stamp') {
      const was = this.base
        ? this.base.getContext('2d', { willReadFrequently: true })!.getImageData(x, y, rw, rh)
        : m.getImageData(x, y, rw, rh)
      this.history.record(m, x, y, rw, rh, was)
      return
    }
    if (!this.any || !before) return this.dummy()
    const was = m.getImageData(x, y, rw, rh)
    const now = new ImageData(new Uint8ClampedArray(was.data), rw, rh)
    if (clearWhereChanged(now.data, before.data, paintCtx.getImageData(x, y, rw, rh).data)) m.putImageData(now, x, y)
    this.history.record(m, x, y, rw, rh, was)
    this.refresh({ x0: x, y0: y, x1: x + rw, y1: y + rh })
  }

  /** A step of the paint that did nothing to the mask. */
  private dummy() {
    this.history.record(this.mctx, 0, 0, 1, 1, this.mctx.getImageData(0, 0, 1, 1))
  }

  undo() {
    if (!this.history.undo(this.mctx)) return
    this.any = true
    this.refresh(this.history.lastRect ?? undefined)
  }

  redo() {
    if (!this.history.redo(this.mctx)) return
    this.any = true
    this.refresh(this.history.lastRect ?? undefined)
  }

  /** The mask as a PNG for saving (none when there is no sticker). */
  async toBlob(): Promise<Blob | null> {
    if (!this.any) return null
    return new Promise((resolve) => this.mask.toBlob((b) => resolve(b), 'image/png'))
  }

  /** The cover as it is on screen, for the export and the thumbnail (laid over the line art). */
  drawOver(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const v = this.view()
    if (!this.any || !v) return
    ctx.drawImage(v, 0, 0, w, h)
  }

  /** The saved mask of a picture is put back. */
  async load(saved: Blob | null | undefined) {
    this.mctx.clearRect(0, 0, this.mask.width, this.mask.height)
    this.any = false
    if (saved) {
      try {
        const bmp = await createImageBitmap(saved)
        this.mctx.drawImage(bmp, 0, 0, this.mask.width, this.mask.height)
        bmp.close?.()
        this.any = true
      } catch {
        // an unreadable mask: the lines simply show through the stickers, as they did before
      }
    }
    this.refresh()
  }
}
