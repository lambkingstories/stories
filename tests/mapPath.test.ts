import { describe, expect, it } from 'vitest'
import { josef } from '../src/data/adventures/josef'
import { noah } from '../src/data/adventures/noah'
import type { Journey } from '../src/types/adventure'

/** Rules for the dotted way on the maps (Anton, 19.10.2026): into every medal from the left, out of it on the right, always curved, 10 beads between two medals. */
const MIN_BEADS = 10

describe.each([
  ['Josef', josef],
  ['Noah', noah]
] as [string, Journey][])('the dotted way of %s', (_name, j) => {
  const m = j.map
  const spots = [...m.stages, m.exam]
  // everything in units of the map height (the map is `aspect` times as wide as high)
  const P = (p: [number, number]) => ({ x: p[0] * m.aspect, y: p[1] })
  const S = spots.map((s) => ({ x: s.x * m.aspect, y: s.y, r: (s.d * m.aspect) / 2 }))

  it('has one stretch from every station to the next one (the last leads to the exam)', () => {
    expect(m.path).toHaveLength(j.stages.length)
  })

  it('has at least ten beads between two medals', () => {
    m.path.forEach((seg, k) => expect(seg.length, `stretch ${k + 1}`).toBeGreaterThanOrEqual(MIN_BEADS))
  })

  it('comes into a medal from the left and leaves it on the right, at the height of its middle', () => {
    m.path.forEach((seg, k) => {
      const a = S[k]!
      const b = S[k + 1]!
      const first = P(seg[0]!)
      const last = P(seg[seg.length - 1]!)
      expect(first.x, `stretch ${k + 1} leaves station ${k + 1} on its right`).toBeGreaterThan(a.x + a.r * 0.9)
      expect(Math.abs(first.y - a.y), `stretch ${k + 1} starts at the middle height`).toBeLessThan(a.r * 0.9)
      expect(last.x, `stretch ${k + 1} enters station ${k + 2} from the left`).toBeLessThan(b.x - b.r * 0.9)
      expect(Math.abs(last.y - b.y), `stretch ${k + 1} ends at the middle height`).toBeLessThan(b.r * 0.9)
    })
  })

  it('never lies inside a medal, and keeps clear of the name plate under every medal', () => {
    for (const [k, seg] of m.path.entries()) {
      for (const b of seg) {
        const p = P(b)
        S.forEach((s, i) => {
          expect(Math.hypot(p.x - s.x, p.y - s.y), `bead of stretch ${k + 1} in medal ${i + 1}`).toBeGreaterThan(s.r * 1.02)
          // the plate: from the lower rim of the ring, about 1.2 rings wide
          const inPlate = Math.abs(p.x - s.x) < s.r * 1.1 && p.y > s.y + s.r * 0.9 && p.y < s.y + s.r * 1.55
          expect(inPlate, `bead of stretch ${k + 1} over the name under medal ${i + 1}`).toBe(false)
        })
      }
    }
  })

  it('is curved: no stretch is a straight line', () => {
    m.path.forEach((seg, k) => {
      const a = P(seg[0]!)
      const b = P(seg[seg.length - 1]!)
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const nx = -(b.y - a.y) / len
      const ny = (b.x - a.x) / len
      const dev = Math.max(...seg.map((q) => Math.abs((P(q).x - a.x) * nx + (P(q).y - a.y) * ny)))
      // the way swings away from the chord by at least a twentieth of the chord and at least 2 % of the map height
      expect(dev, `stretch ${k + 1}`).toBeGreaterThan(Math.max(0.02, len * 0.04))
    })
  })

  it('has beads at an even distance, in the order along the way, nothing in the lowest 20 %', () => {
    m.path.forEach((seg, k) => {
      const d = seg.slice(1).map((q, i) => Math.hypot(P(q).x - P(seg[i]!).x, P(q).y - P(seg[i]!).y))
      const mean = d.reduce((s, v) => s + v, 0) / d.length
      for (const v of d) {
        expect(v, `distance of two beads in stretch ${k + 1}`).toBeLessThan(mean * 1.6)
        expect(v).toBeGreaterThan(mean * 0.4)
      }
      for (const [, y] of seg) expect(y, `stretch ${k + 1} not behind the navigation bar`).toBeLessThanOrEqual(0.8)
    })
  })
})

describe('the stations that were moved by hand', () => {
  it('Noah, station 8 sits high above the hands of Noah, so that his face stays free', () => {
    expect(noah.map.stages[7]!.y).toBeLessThan(0.25)
  })
  it('Josef, station 6 sits on the left tower of the prison', () => {
    expect(josef.map.stages[5]!.x).toBeCloseTo(0.468, 2)
    expect(josef.map.stages[5]!.y).toBeCloseTo(0.3738, 2)
  })
})
