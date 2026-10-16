import { describe, expect, it } from 'vitest'
import { buildRegionMap, dilate, gapFor, labelAt, paintedShare, regionMaskAlpha } from '@/utils/coloringRegions'
import { paintStars } from '@/utils/adventureScore'

/** White picture with black rectangles drawn from the given [x0,y0,x1,y1] boxes (inclusive). */
function picture(w: number, h: number, ink: [number, number, number, number][]) {
  const data = new Uint8ClampedArray(w * h * 4).fill(255)
  for (const [x0, y0, x1, y1] of ink) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const o = (y * w + x) * 4
        data[o] = data[o + 1] = data[o + 2] = 0
      }
    }
  }
  return { data, width: w, height: h }
}

// a square frame (outline 3 px thick) with a wall in the middle: two rooms
const frame: [number, number, number, number][] = [
  [10, 10, 69, 12],
  [10, 67, 69, 69],
  [10, 10, 12, 69],
  [67, 10, 69, 69]
]

describe('fields of a line drawing', () => {
  it('tells the rooms apart and keeps the outline out of every room', () => {
    const wall: [number, number, number, number][] = [[39, 10, 41, 69]]
    const map = buildRegionMap(picture(80, 80, [...frame, ...wall]), 1, 1)
    const left = labelAt(map, 25, 40)
    const right = labelAt(map, 55, 40)
    expect(left).toBeGreaterThan(0)
    expect(right).toBeGreaterThan(0)
    expect(left).not.toBe(right)
    // outside the frame is a third field, outline pixels belong to none
    expect(labelAt(map, 2, 2)).not.toBe(left)
    expect(map.labels[40 * 80 + 40]).toBe(0)
  })

  it('does not let paint run through a small gap in the outline, but does through a big one', () => {
    // wall with a 3 px gap
    const small: [number, number, number, number][] = [[39, 10, 41, 36], [39, 40, 41, 69]]
    const closed = buildRegionMap(picture(80, 80, [...frame, ...small]), 1, 2)
    expect(labelAt(closed, 25, 40)).not.toBe(labelAt(closed, 55, 40))
    // wall with a 12 px gap
    const big: [number, number, number, number][] = [[39, 10, 41, 30], [39, 44, 41, 69]]
    const open = buildRegionMap(picture(80, 80, [...frame, ...big]), 1, 2)
    expect(labelAt(open, 25, 40)).toBe(labelAt(open, 55, 40))
  })

  it('finds the closest field for a touch right on an outline', () => {
    const map = buildRegionMap(picture(80, 80, frame), 1, 1)
    const inside = labelAt(map, 40, 40)
    expect(labelAt(map, 11, 40)).toBeGreaterThan(0) // on the left outline
    expect([inside, labelAt(map, 2, 40)]).toContain(labelAt(map, 11, 40))
    expect(labelAt(map, -5, 3)).toBe(0)
  })

  it('lets the paint of a field reach under the outline but not into the next field', () => {
    const wall: [number, number, number, number][] = [[39, 10, 41, 69]]
    const map = buildRegionMap(picture(80, 80, [...frame, ...wall]), 1, 1)
    const left = labelAt(map, 25, 40)
    const mask = regionMaskAlpha(map, left, 2)
    expect(mask[40 * 80 + 25]).toBe(255)
    expect(mask[40 * 80 + 39]).toBe(255) // reaches the edge of the wall, so no pale gap is left
    expect(mask[40 * 80 + 55]).toBe(0) // the other room
  })

  it('thickens in both directions', () => {
    const src = new Uint8Array(5 * 5)
    src[2 * 5 + 2] = 1
    const out = dilate(src, 5, 5, 1)
    expect(out.reduce((a, b) => a + b, 0)).toBe(9)
  })

  it('closes wider gaps for bigger pictures', () => {
    expect(gapFor(1024)).toBe(2)
    expect(gapFor(1600)).toBe(3)
    expect(gapFor(300)).toBe(1)
  })
})

describe('how much of a picture is painted', () => {
  const map = buildRegionMap(picture(80, 80, frame), 1, 1)
  const paint = (x0: number, y0: number, x1: number, y1: number) => {
    const a = new Uint8Array(80 * 80)
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) a[y * 80 + x] = 255
    return a
  }

  it('is nothing for a clean sheet and everything for a fully painted one', () => {
    expect(paintedShare(map, new Uint8Array(80 * 80))).toBe(0)
    expect(paintedShare(map, paint(0, 0, 79, 79))).toBeCloseTo(1, 1)
  })

  it('grows with the painted area', () => {
    const half = paintedShare(map, paint(0, 0, 79, 39))
    expect(half).toBeGreaterThan(0.35)
    expect(half).toBeLessThan(0.65)
  })

  it('gives the stars: taking part one, 40 % two, 70 % three', () => {
    expect([0.1, 0.29, 0.3, 0.39, 0.4, 0.69, 0.7, 1].map((x) => paintStars(x))).toEqual([1, 1, 1, 1, 2, 2, 3, 3])
    expect(paintStars(0, false)).toBe(0)
  })
})
