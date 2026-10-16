import { describe, expect, it } from 'vitest'
import { screenToSheet, type ScreenBox } from '@/utils/sheetMath'

/** The box around a sheet of `w` x `h` screen pixels, centred on (cx, cy), turned by `deg`. */
function boxOf(cx: number, cy: number, w: number, h: number, deg: number): ScreenBox {
  const a = (deg * Math.PI) / 180
  const bw = w * Math.abs(Math.cos(a)) + h * Math.abs(Math.sin(a))
  const bh = w * Math.abs(Math.sin(a)) + h * Math.abs(Math.cos(a))
  return { left: cx - bw / 2, top: cy - bh / 2, width: bw, height: bh }
}

/** Where a point of the sheet (in the sheet's own screen pixels from its middle) lies on the screen. */
function forward(cx: number, cy: number, u: number, v: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: cx + u * Math.cos(a) - v * Math.sin(a), y: cy + u * Math.sin(a) + v * Math.cos(a) }
}

describe('touch on a turned sheet', () => {
  it('is the plain scaling when the sheet is not turned', () => {
    const box = { left: 100, top: 50, width: 400, height: 600 }
    expect(screenToSheet(300, 350, box, 0, 800, 1200)).toEqual({ x: 400, y: 600 })
    expect(screenToSheet(100, 50, box, 0, 800, 1200)).toEqual({ x: 0, y: 0 })
  })

  it('finds the point of the picture that was drawn at that place, at any angle', () => {
    const sheetW = 1200
    const sheetH = 1600
    const scale = 0.4 // screen pixels per picture pixel
    const w = sheetW * scale
    const h = sheetH * scale
    for (const deg of [-90, -45, -17, 3, 30, 61, 90]) {
      const box = boxOf(500, 420, w, h, deg)
      for (const [px, py] of [[0, 0], [300, -200], [-500, 700], [599, 799]] as const) {
        // picture point (px, py) from the sheet's middle, in picture pixels
        const screen = forward(500, 420, px * scale, py * scale, deg)
        const back = screenToSheet(screen.x, screen.y, box, deg, sheetW, sheetH)
        expect(back.x, `x at ${deg}°`).toBeCloseTo(sheetW / 2 + px, 5)
        expect(back.y, `y at ${deg}°`).toBeCloseTo(sheetH / 2 + py, 5)
      }
    }
  })

  it('maps the middle of the sheet to the middle of the picture', () => {
    const box = boxOf(300, 300, 200, 300, 40)
    const p = screenToSheet(300, 300, box, 40, 1000, 1500)
    expect(p.x).toBeCloseTo(500, 8)
    expect(p.y).toBeCloseTo(750, 8)
  })
})
