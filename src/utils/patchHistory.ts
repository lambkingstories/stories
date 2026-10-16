/**
 * Undo and redo for a painting: each change keeps only the area that changed (the pixels before and after), not the whole
 * picture. A stroke on a large page then costs a few hundred kilobytes instead of 14 MB, and no copy of the whole canvas has
 * to be read after every stroke.
 */

/** What the history needs from a canvas context (the real 2D context has both). */
export interface PixelContext {
  getImageData(x: number, y: number, w: number, h: number): ImageData
  putImageData(data: ImageData, x: number, y: number): void
}

interface Patch {
  x: number
  y: number
  before: ImageData
  after: ImageData
}

export class PatchHistory {
  private stack: Patch[] = []
  /** How many patches of the stack are applied. */
  private applied = 0

  constructor(private readonly max = 40) {}

  clear() {
    this.stack = []
    this.applied = 0
  }

  get canUndo(): boolean {
    return this.applied > 0
  }

  get canRedo(): boolean {
    return this.applied < this.stack.length
  }

  /** The number of changes that can be undone. */
  get depth(): number {
    return this.applied
  }

  /** Records a change of the area `x, y, w, h`; `before` holds its pixels from before the change, the pixels after are read now. */
  record(ctx: PixelContext, x: number, y: number, w: number, h: number, before: ImageData) {
    if (w < 1 || h < 1) return
    // a new change ends the redo line
    this.stack = this.stack.slice(0, this.applied)
    this.stack.push({ x, y, before, after: ctx.getImageData(x, y, w, h) })
    if (this.stack.length > this.max) this.stack.shift()
    this.applied = this.stack.length
  }

  undo(ctx: PixelContext): boolean {
    if (!this.canUndo) return false
    const p = this.stack[--this.applied]!
    ctx.putImageData(p.before, p.x, p.y)
    return true
  }

  redo(ctx: PixelContext): boolean {
    if (!this.canRedo) return false
    const p = this.stack[this.applied++]!
    ctx.putImageData(p.after, p.x, p.y)
    return true
  }
}
