import { describe, expect, it } from 'vitest'
import { floodFillPaint } from '@/utils/coloringFill'

const W = 12
const H = 9

/** White paper with a black frame around the field x 3–8, y 2–6. */
function picture() {
  const merged = new Uint8ClampedArray(W * H * 4)
  for (let i = 0; i < W * H; i++) {
    merged[i * 4] = merged[i * 4 + 1] = merged[i * 4 + 2] = 255
    merged[i * 4 + 3] = 255
  }
  const black = (x: number, y: number) => {
    const i = (y * W + x) * 4
    merged[i] = merged[i + 1] = merged[i + 2] = 0
  }
  for (let x = 2; x <= 9; x++) {
    black(x, 1)
    black(x, 7)
  }
  for (let y = 1; y <= 7; y++) {
    black(2, y)
    black(9, y)
  }
  return merged
}

const alphaAt = (paint: Uint8ClampedArray, x: number, y: number) => paint[(y * W + x) * 4 + 3]!

describe('paint bucket', () => {
  it('fills the field that was touched, up to the outline (and one pixel under it)', () => {
    const merged = picture()
    const paint = new Uint8ClampedArray(W * H * 4)
    const did = floodFillPaint({ merged, paint, w: W, h: H, x: 5, y: 4, r: 200, g: 30, b: 30, a: 255 })
    expect(did).toBe(true)
    for (let y = 2; y <= 6; y++) for (let x = 3; x <= 8; x++) expect(alphaAt(paint, x, y), `${x},${y}`).toBe(255)
    // the paper outside the frame stays free
    expect(alphaAt(paint, 0, 0)).toBe(0)
    expect(alphaAt(paint, 11, 8)).toBe(0)
    expect(alphaAt(paint, 5, 8)).toBe(0)
    expect(paint[(4 * W + 5) * 4]).toBe(200)
  })

  it('fills the outside field when the touch is outside the frame, and leaves the inside', () => {
    const merged = picture()
    const paint = new Uint8ClampedArray(W * H * 4)
    floodFillPaint({ merged, paint, w: W, h: H, x: 0, y: 0, r: 10, g: 120, b: 220, a: 255 })
    expect(alphaAt(paint, 11, 8)).toBe(255)
    expect(alphaAt(paint, 5, 4)).toBe(0)
  })

  it('does nothing when the field already has the colour', () => {
    const merged = picture()
    const paint = new Uint8ClampedArray(W * H * 4)
    expect(floodFillPaint({ merged, paint, w: W, h: H, x: 5, y: 4, r: 255, g: 255, b: 255, a: 255 })).toBe(false)
  })

  it('ignores a touch outside the picture and a touch on a line with no free pixel near', () => {
    const merged = picture()
    const paint = new Uint8ClampedArray(W * H * 4)
    expect(floodFillPaint({ merged, paint, w: W, h: H, x: -1, y: 2, r: 1, g: 2, b: 3, a: 255 })).toBe(false)
    expect(floodFillPaint({ merged, paint, w: W, h: H, x: 40, y: 2, r: 1, g: 2, b: 3, a: 255 })).toBe(false)
  })

  it('paints with the strength that was chosen', () => {
    const merged = picture()
    const paint = new Uint8ClampedArray(W * H * 4)
    floodFillPaint({ merged, paint, w: W, h: H, x: 5, y: 4, r: 0, g: 0, b: 255, a: 128 })
    expect(alphaAt(paint, 5, 4)).toBe(128)
  })
})
