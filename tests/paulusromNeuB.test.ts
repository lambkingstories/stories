/**
 * The pure logic of two games of "Bis nach Rom": "Gather the sticks" (`reisig`) and "Welcome everyone" (`besuch`), with their checks of the data (`brushwoodProblems`, `visitorsProblems`).
 */
import { describe, expect, it } from 'vitest'
import {
  brushFireLevel,
  brushHelp,
  brushInside,
  brushJudge,
  brushLoopClosed,
  brushPairFree,
  brushSolvable,
  brushwoodProblems,
  visitorsEnd,
  visitorsHelp,
  visitorsReaches,
  visitorsReachesAll,
  visitorsProblems,
  visitorsStand
} from '@/utils/paulusromNeuB'
import { prDist } from '@/utils/paulusromNeuA'
import { BRUSH, VISIT } from './paulusromSamples'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
/** A round loop of `n` points around (cx, cy) with radius r (units of the width; the vertical radius is r * 1.5 percent of the height), closed. */
const circle = (cx: number, cy: number, r: number, n = 16) => {
  const pts = Array.from({ length: n }, (_, i) => ({ x: cx + r * Math.cos((i / n) * 2 * Math.PI), y: cy + r * 1.5 * Math.sin((i / n) * 2 * Math.PI) }))
  return pts
}

describe('reisig: gather the sticks', () => {
  const r1 = BRUSH.rounds[0]!
  const r2 = BRUSH.rounds[1]!

  it('the sample data can be played', () => {
    expect(brushwoodProblems(BRUSH)).toEqual([])
  })

  it('a loop is closed when it has enough points and its end is near its beginning (8 units)', () => {
    expect(brushLoopClosed(circle(50, 50, 10), 1.5, 8)).toBe(true)
    expect(brushLoopClosed(circle(50, 50, 10).slice(0, 9), 1.5, 8)).toBe(false)
    expect(brushLoopClosed(circle(50, 50, 10).slice(0, 5), 1.5, 8)).toBe(false)
    expect(brushLoopClosed([], 1.5, 8)).toBe(false)
  })

  it('a thing is inside when its middle lies inside the loop', () => {
    const loop = circle(36, 31, 12)
    expect(brushInside(loop, { x: 30, y: 30 })).toBe(true)
    expect(brushInside(loop, { x: 42, y: 32 })).toBe(true)
    expect(brushInside(loop, { x: 30, y: 62 })).toBe(false)
    expect(brushInside(loop, { x: 80, y: 80 })).toBe(false)
  })

  it('the verdict: something that does not burn is bad, fewer than two heaps is few, two heaps are a bundle', () => {
    expect(brushJudge(r1, [0, 1])).toBe('bundle')
    expect(brushJudge(r1, [0, 1, 2])).toBe('bundle')
    expect(brushJudge(r1, [0])).toBe('few')
    expect(brushJudge(r1, [])).toBe('few')
    expect(brushJudge(r1, [0, 1, 4])).toBe('bad')
    expect(brushJudge(r1, [4])).toBe('bad')
  })

  it('the fire grows from its start to the biggest evenly over the bundles', () => {
    expect([0, 1, 2].map((d) => brushFireLevel(r1, d))).toEqual([1, 2, 4])
    expect([0, 1, 2, 3].map((d) => brushFireLevel({ fireStart: 1, bundles: 3 }, d))).toEqual([1, 2, 3, 4])
    expect([0, 1, 2, 3].map((d) => brushFireLevel(r2, d))).toEqual([2, 2, 3, 4])
    expect(brushFireLevel({ fireStart: 2, bundles: 4 }, 4)).toBe(4)
    expect(brushFireLevel({ fireStart: 1, bundles: 3 }, 3)).toBe(4)
  })

  it('a pair can be gathered when nothing that does not burn lies near the line between the heaps', () => {
    expect(brushPairFree(r1, 0, 1)).toBe(true)
    expect(brushPairFree(r2, 0, 1)).toBe(true) // the stone at (50, 36) lies near, but not on the line between (30, 24) and (42, 24)
    expect(brushPairFree(r2, 0, 2)).toBe(true)
    expect(brushPairFree(r2, 1, 3)).toBe(false) // the stone at (50, 36) lies only 8 units from the line x = 42
    const near = clone(r2)
    near.things[6]!.x = 36
    near.things[6]!.y = 26
    expect(brushPairFree(near, 0, 1)).toBe(false)
  })

  it('the rounds can be solved; "Help me" names a pair that keeps the round solvable', () => {
    expect(brushSolvable(r1, [], 2)).toBe(true)
    expect(brushSolvable(r1, [0, 1], 1)).toBe(true)
    expect(brushSolvable(r1, [0, 1, 2], 1)).toBe(false) // only one heap left
    expect(brushSolvable(r2, [], 3)).toBe(true)
    const h = brushHelp(r1, [], 0)!
    expect(h).not.toBeNull()
    expect(r1.things[h[0]]!.dry && r1.things[h[1]]!.dry).toBe(true)
    expect(brushHelp(r1, [0, 1, 2, 3], 2)).toBeNull()
  })

  it('the checks find the faults of the data', () => {
    const g = clone(BRUSH)
    g.rounds[0]!.things.forEach((t) => (t.dry = true))
    expect(brushwoodProblems(g).join(' ')).toContain('nothing that must stay outside')
    const h = clone(BRUSH)
    h.rounds[0]!.bundles = 3
    expect(brushwoodProblems(h).join(' ')).toContain('too few for 3 bundles')
    const k = clone(BRUSH)
    k.rounds[0]!.things[1]!.x = 31
    expect(brushwoodProblems(k).join(' ')).toContain('lie too near each other')
    const l = clone(BRUSH)
    l.rounds[0]!.things[4]!.w = 6
    expect(brushwoodProblems(l).join(' ')).toContain('too small for a phone')
    const m = clone(BRUSH)
    m.rounds[0]!.things[4]!.x = 36
    m.rounds[0]!.things[4]!.y = 31
    m.rounds[0]!.things[0]!.x = 28
    expect(brushwoodProblems(m).join(' ')).toContain('cannot be solved')
    const o = clone(BRUSH)
    o.fire.pop()
    expect(brushwoodProblems(o).join(' ')).toContain('four pictures of the fire')
    const r = clone(BRUSH)
    r.rounds[1]!.things = r.rounds[1]!.things.slice(0, 5)
    expect(brushwoodProblems(r).join(' ')).toContain('more things')
  })
})

describe('besuch: welcome everyone', () => {
  const r1 = VISIT.rounds[0]!
  const r2 = VISIT.rounds[1]!

  it('the sample data can be played', () => {
    expect(visitorsProblems(VISIT)).toEqual([])
  })

  it('the chain reaches a place when it is not further away than it is long', () => {
    expect(visitorsReaches(VISIT, 0, { x: 16, y: 44 })).toBe(true)
    expect(visitorsReaches(VISIT, 1, { x: 16, y: 44 })).toBe(false)
    expect(visitorsReaches(VISIT, 0, { x: 22 + 28, y: 72 })).toBe(true)
    expect(visitorsReaches(VISIT, 0, { x: 22 + 28.5, y: 72 })).toBe(false)
  })

  it('a visit with two guests needs a place that reaches both', () => {
    const v = r2.visits[1]!
    expect(visitorsReachesAll(VISIT, 3, v)).toBe(true)
    expect(visitorsReachesAll(VISIT, 0, v)).toBe(false)
    expect(visitorsReachesAll(VISIT, 2, v)).toBe(false)
    expect(visitorsHelp(VISIT, r2, v)).toBe(3)
    expect(visitorsHelp(VISIT, r1, r1.visits[0]!)).toBe(0)
    expect(visitorsHelp(VISIT, { stools: [1, 2] }, r1.visits[0]!)).toBeNull()
  })

  it('Paulus stops 8 units in front of the guest on the line to the stool, or at the end of the chain when it is too short', () => {
    const at = { x: 16, y: 44 }
    const stand = visitorsStand(VISIT, 0, at)
    expect(prDist(stand, at, 4 / 3)).toBeCloseTo(8, 4)
    expect(prDist(stand, VISIT.stools[0]!, 4 / 3)).toBeLessThan(prDist(at, VISIT.stools[0]!, 4 / 3))
    expect(visitorsStand(VISIT, 0, { x: 24, y: 72 })).toEqual(VISIT.stools[0])
    const far = { x: 80, y: 90 }
    const end = visitorsEnd(VISIT, 0, far)
    expect(prDist(end, VISIT.stools[0]!, 4 / 3)).toBeCloseTo(28 * 0.96, 3)
    expect(visitorsEnd(VISIT, 0, at)).toEqual(at)
  })

  it('the checks find the faults of the data', () => {
    const g = clone(VISIT)
    g.rounds[0]!.visits[0]!.arrivals[0]!.at = { x: 90, y: 20 }
    expect(visitorsProblems(g).join(' ')).toContain('no place of the stool reaches')
    const h = clone(VISIT)
    h.rounds[1]!.visits[1]!.arrivals = [{ guest: 3, at: { x: 36, y: 58 } }, { guest: 4, at: { x: 40, y: 60 } }]
    expect(visitorsProblems(h).join(' ')).toContain('exactly one place must reach both')
    const k = clone(VISIT)
    k.chainLen = 90
    expect(visitorsProblems(k).join(' ')).toContain('should be 14 to 45 units long')
    const l = clone(VISIT)
    l.rounds[1]!.showReach = true
    expect(visitorsProblems(l).join(' ')).toContain('round 2 is played without the circle')
    const m = clone(VISIT)
    m.rounds[1]!.visits = [m.rounds[1]!.visits[0]!, m.rounds[1]!.visits[1]!]
    expect(visitorsProblems(m).join(' ')).toContain('two visits with two guests')
    const o = clone(VISIT)
    o.guestW = 9
    expect(visitorsProblems(o).join(' ')).toContain('too small for a phone')
    const r = clone(VISIT)
    r.rounds[0]!.visits[0]!.arrivals[0]!.at = { x: 22 + 27, y: 72 }
    expect(visitorsProblems(r).join(' ')).toContain('too close to call')
  })
})
