import { describe, expect, it } from 'vitest'
import { PatchHistory, type PixelContext } from '@/utils/patchHistory'

/** A tiny canvas: one byte per pixel (grey value) kept in an array, with the same two calls the history needs. */
function fakeCanvas(w: number, h: number) {
  const px = new Uint8ClampedArray(w * h * 4)
  const ctx: PixelContext = {
    getImageData(x, y, rw, rh) {
      const out = new Uint8ClampedArray(rw * rh * 4)
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) for (let c = 0; c < 4; c++) out[(j * rw + i) * 4 + c] = px[((y + j) * w + x + i) * 4 + c]!
      return { data: out, width: rw, height: rh } as unknown as ImageData
    },
    putImageData(d, x, y) {
      for (let j = 0; j < d.height; j++) for (let i = 0; i < d.width; i++) for (let c = 0; c < 4; c++) px[((y + j) * w + x + i) * 4 + c] = d.data[(j * d.width + i) * 4 + c]!
    }
  }
  /** Paints a rectangle (the change) and records it. */
  const paint = (h2: PatchHistory, x: number, y: number, rw: number, rh: number, value: number) => {
    const before = ctx.getImageData(x, y, rw, rh)
    for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) for (let c = 0; c < 4; c++) px[((y + j) * w + x + i) * 4 + c] = value
    h2.record(ctx, x, y, rw, rh, before)
  }
  const at = (x: number, y: number) => px[(y * w + x) * 4]!
  return { ctx, paint, at }
}

describe('patch history', () => {
  it('starts with nothing to undo or redo', () => {
    const h = new PatchHistory()
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })

  it('undoes and redoes a change, only in its own area', () => {
    const c = fakeCanvas(10, 10)
    const h = new PatchHistory()
    c.paint(h, 2, 2, 3, 3, 200)
    expect(c.at(3, 3)).toBe(200)
    expect(h.undo(c.ctx)).toBe(true)
    expect(c.at(3, 3)).toBe(0)
    expect(h.canRedo).toBe(true)
    expect(h.redo(c.ctx)).toBe(true)
    expect(c.at(3, 3)).toBe(200)
  })

  it('undoes changes in the opposite order, also when they overlap', () => {
    const c = fakeCanvas(10, 10)
    const h = new PatchHistory()
    c.paint(h, 0, 0, 6, 6, 50)
    c.paint(h, 3, 3, 6, 6, 120)
    expect(c.at(4, 4)).toBe(120)
    h.undo(c.ctx)
    expect(c.at(4, 4)).toBe(50)
    expect(c.at(8, 8)).toBe(0)
    h.undo(c.ctx)
    expect(c.at(4, 4)).toBe(0)
    expect(h.undo(c.ctx)).toBe(false)
  })

  it('forgets the redo line when something new is painted after an undo', () => {
    const c = fakeCanvas(8, 8)
    const h = new PatchHistory()
    c.paint(h, 0, 0, 2, 2, 10)
    c.paint(h, 2, 2, 2, 2, 20)
    h.undo(c.ctx)
    expect(h.canRedo).toBe(true)
    c.paint(h, 5, 5, 2, 2, 30)
    expect(h.canRedo).toBe(false)
    expect(h.depth).toBe(2)
  })

  it('keeps only the newest changes when there are more than the limit', () => {
    const c = fakeCanvas(8, 8)
    const h = new PatchHistory(3)
    for (let i = 0; i < 5; i++) c.paint(h, i, 0, 1, 1, 40 + i)
    expect(h.depth).toBe(3)
    h.undo(c.ctx)
    h.undo(c.ctx)
    h.undo(c.ctx)
    expect(h.canUndo).toBe(false)
    // the two oldest changes stay in the picture, they can no longer be undone
    expect(c.at(0, 0)).toBe(40)
    expect(c.at(1, 0)).toBe(41)
    expect(c.at(2, 0)).toBe(0)
  })

  it('ignores an empty area and can be cleared', () => {
    const c = fakeCanvas(4, 4)
    const h = new PatchHistory()
    h.record(c.ctx, 0, 0, 0, 3, c.ctx.getImageData(0, 0, 1, 1))
    expect(h.canUndo).toBe(false)
    c.paint(h, 0, 0, 2, 2, 9)
    h.clear()
    expect(h.canUndo).toBe(false)
    expect(h.canRedo).toBe(false)
  })
})
