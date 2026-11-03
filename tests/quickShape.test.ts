import { describe, expect, it } from 'vitest'
import { anchorsOf, nearestAnchor, pathLength, recognize, resample, shapePath, tidyLine, type Pt } from '../src/utils/quickShape'

/** A small deterministic wobble, so that "drawn by hand" lines are not perfect. */
const wobble = (i: number, amount: number) => Math.sin(i * 12.9898) * amount

function circle(cx: number, cy: number, r: number, n = 90, wob = 0, squash = 1): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.4
    const rr = r + wobble(i, wob)
    out.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * squash })
  }
  return out
}

function polyline(corners: Pt[], per = 25, wob = 0): Pt[] {
  const out: Pt[] = []
  let k = 0
  for (let c = 0; c < corners.length; c++) {
    const a = corners[c]!
    const b = corners[(c + 1) % corners.length]!
    for (let i = 0; i < per; i++) {
      const t = i / per
      out.push({ x: a.x + (b.x - a.x) * t + wobble(k, wob), y: a.y + (b.y - a.y) * t + wobble(k + 7, wob) })
      k++
    }
  }
  out.push({ ...corners[0]!, x: corners[0]!.x + 3, y: corners[0]!.y + 4 })
  return out
}

describe('quickShape: lines', () => {
  it('turns an open wobbly stroke into the straight line between its ends', () => {
    const pts: Pt[] = Array.from({ length: 40 }, (_, i) => ({ x: 100 + i * 10, y: 100 + i * 5 + wobble(i, 6) }))
    const s = recognize(pts)
    expect(s?.kind).toBe('line')
    if (s?.kind === 'line') {
      expect(s.a).toEqual(pts[0])
      expect(s.b).toEqual(pts[39])
    }
  })

  it('ignores a stroke that is only a dot', () => {
    expect(recognize([{ x: 1, y: 1 }, { x: 3, y: 2 }])).toBeNull()
    expect(recognize([{ x: 1, y: 1 }])).toBeNull()
  })

  it('makes a nearly flat or upright line exactly flat or upright', () => {
    const flat = tidyLine({ x: 100, y: 100 }, { x: 400, y: 112 }, [], 20)
    expect(flat.b.y).toBeCloseTo(100)
    expect(flat.b.x).toBeCloseTo(100 + Math.hypot(300, 12), 3)
    const upright = tidyLine({ x: 100, y: 100 }, { x: 108, y: 500 }, [], 20)
    expect(upright.b.x).toBeCloseTo(100)
    // a slanting line stays as it is
    const slant = tidyLine({ x: 100, y: 100 }, { x: 400, y: 300 }, [], 20)
    expect(slant.b).toEqual({ x: 400, y: 300 })
  })
})

describe('quickShape: the magnet', () => {
  it('clicks the ends of a line onto the ends of lines that are there', () => {
    const anchors = [{ x: 500, y: 500 }, { x: 100, y: 100 }]
    const t = tidyLine({ x: 108, y: 94 }, { x: 495, y: 507 }, anchors, 24)
    expect(t.a).toEqual({ x: 100, y: 100 })
    expect(t.b).toEqual({ x: 500, y: 500 })
    expect(t.snappedA && t.snappedB).toBe(true)
  })

  it('leaves an end alone that is farther than the reach', () => {
    const t = tidyLine({ x: 300, y: 300 }, { x: 560, y: 500 }, [{ x: 500, y: 500 }], 24)
    expect(t.snappedB).toBe(false)
    expect(t.b).toEqual({ x: 560, y: 500 })
  })

  it('does not move the start of a line whose start is fixed (the line that is held)', () => {
    const t = tidyLine({ x: 108, y: 94 }, { x: 300, y: 300 }, [{ x: 100, y: 100 }], 24, true)
    expect(t.a).toEqual({ x: 108, y: 94 })
  })

  it('finds the nearest anchor', () => {
    expect(nearestAnchor({ x: 0, y: 0 }, [{ x: 30, y: 0 }, { x: 10, y: 0 }], 20)).toEqual({ x: 10, y: 0 })
    expect(nearestAnchor({ x: 0, y: 0 }, [{ x: 30, y: 0 }], 20)).toBeNull()
  })
})

describe('quickShape: closed figures', () => {
  it('turns a wobbly circle into a perfect circle', () => {
    const s = recognize(circle(300, 300, 120, 90, 6))
    expect(s?.kind).toBe('ellipse')
    if (s?.kind === 'ellipse') {
      expect(s.round).toBe(true)
      expect(s.rx).toBeCloseTo(120, -1)
      expect(s.rx).toBe(s.ry)
      expect(s.cx).toBeCloseTo(300, -1)
    }
  })

  it('keeps an oval an oval, flat when it is nearly flat', () => {
    const s = recognize(circle(300, 300, 150, 90, 3, 0.5))
    expect(s?.kind).toBe('ellipse')
    if (s?.kind === 'ellipse') {
      expect(s.round).toBe(false)
      expect(s.rx).toBeGreaterThan(s.ry * 1.5)
      expect(Math.abs(s.angle) % 90).toBeLessThan(0.001)
    }
  })

  it('turns a wobbly square into a clean square, flat on the sheet', () => {
    const s = recognize(polyline([{ x: 200, y: 200 }, { x: 400, y: 205 }, { x: 396, y: 410 }, { x: 204, y: 398 }], 25, 3))
    expect(s?.kind).toBe('polygon')
    if (s?.kind === 'polygon') {
      expect(s.rect).toBe(true)
      expect(s.pts).toHaveLength(4)
      const xs = s.pts.map((p) => p.x)
      const ys = s.pts.map((p) => p.y)
      // flat: two different x and two different y
      expect(new Set(xs.map((x) => Math.round(x))).size).toBe(2)
      expect(new Set(ys.map((y) => Math.round(y))).size).toBe(2)
      // a square
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(Math.max(...ys) - Math.min(...ys), 0)
    }
  })

  it('keeps a long rectangle a rectangle, not a square', () => {
    const s = recognize(polyline([{ x: 100, y: 100 }, { x: 500, y: 104 }, { x: 502, y: 250 }, { x: 98, y: 246 }], 30, 2))
    expect(s?.kind).toBe('polygon')
    if (s?.kind === 'polygon') {
      expect(s.rect).toBe(true)
      const xs = s.pts.map((p) => p.x)
      const ys = s.pts.map((p) => p.y)
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(2 * (Math.max(...ys) - Math.min(...ys)))
    }
  })

  it('turns a triangle into a triangle', () => {
    const s = recognize(polyline([{ x: 300, y: 100 }, { x: 460, y: 400 }, { x: 140, y: 390 }], 30, 3))
    expect(s?.kind).toBe('polygon')
    if (s?.kind === 'polygon') {
      expect(s.rect).toBe(false)
      expect(s.pts).toHaveLength(3)
    }
  })

  it('leaves a scribble alone', () => {
    const pts: Pt[] = []
    for (let i = 0; i < 60; i++) pts.push({ x: 200 + (i % 2) * 6, y: 200 + (i % 7) * 40 * (i % 2 ? 1 : -1) * 0.1 })
    expect(recognize(pts)).toBeNull()
  })

  it('draws a closed shape back to where it starts', () => {
    const s = recognize(circle(300, 300, 120, 90, 4))!
    const path = shapePath(s)
    expect(path[0]!.x).toBeCloseTo(path[path.length - 1]!.x, 3)
    expect(path[0]!.y).toBeCloseTo(path[path.length - 1]!.y, 3)
    const r = Math.hypot(path[10]!.x - 300, path[10]!.y - 300)
    expect(r).toBeCloseTo(120, -1)
  })

  it('offers the corners of a figure as places to click onto', () => {
    const s = recognize(polyline([{ x: 200, y: 200 }, { x: 400, y: 200 }, { x: 400, y: 400 }, { x: 200, y: 400 }], 25, 2))!
    expect(anchorsOf(s)).toHaveLength(4)
  })
})

describe('quickShape: helpers', () => {
  it('measures and resamples a path', () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }]
    expect(pathLength(pts)).toBe(100)
    const r = resample(pts, 5)
    expect(r).toHaveLength(5)
    expect(r[2]!.x).toBeCloseTo(50)
  })
})
