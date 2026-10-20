/**
 * The pure functions of the six new games of "Jakob" (`utils/jakobGames2.ts`): the cycle of seasons, the children on the meadow, the guessed herds, the cairn of two stones,
 * the herds on the road and the ring of the twelve sons.
 */
import { describe, expect, it } from 'vitest'
import { seeded } from '@/utils/jakobGames'
import {
  advance,
  arrived,
  cycleRow,
  expected,
  fitsRing,
  gapOk,
  hit,
  isEven,
  positionAt,
  rangeAbout,
  rightRange,
  roadLength,
  scatter,
  snapToRing,
  startKids,
  stepKids,
  yearOf
} from '@/utils/jakobGames2'

describe('cycle of seasons', () => {
  const cycle = ['fruehling', 'sommer', 'herbst', 'winter']

  it('the sign that belongs at a place: the cycle repeats again and again', () => {
    expect([0, 1, 2, 3, 4, 5, 7, 8, 27].map((i) => expected(cycle, i))).toEqual(['fruehling', 'sommer', 'herbst', 'winter', 'fruehling', 'sommer', 'winter', 'fruehling', 'winter'])
    expect(expected(cycle, -1)).toBe('winter')
  })

  it('the year of a place counts the whole turns (28 places are seven years)', () => {
    expect(yearOf(4, 0)).toBe(1)
    expect(yearOf(4, 3)).toBe(1)
    expect(yearOf(4, 4)).toBe(2)
    expect(yearOf(4, 27)).toBe(7)
  })

  it('a row knows its gaps and what belongs in them', () => {
    const row = cycleRow(cycle, 8, [2, 5])
    expect(row).toHaveLength(8)
    expect(row.filter((p) => p.gap).map((p) => [p.index, p.id])).toEqual([[2, 'herbst'], [5, 'sommer']])
  })
})

describe('children on the meadow', () => {
  const field = { x: 10, y: 50, w: 80, h: 40 }
  const inside = (k: { x: number; y: number }) => k.x >= field.x && k.x <= field.x + field.w && k.y >= field.y && k.y <= field.y + field.h

  it('start inside the meadow and the same for the same seed', () => {
    const a = startKids(7, field, 0.05, 3)
    expect(a).toHaveLength(7)
    expect(a.every(inside)).toBe(true)
    expect(startKids(7, field, 0.05, 3)).toEqual(a)
    expect(startKids(7, field, 0.05, 4)).not.toEqual(a)
  })

  it('walk about for a long time without ever leaving the meadow, and really move', () => {
    let kids = startKids(11, field, 0.09, 9)
    const start = kids.map((k) => ({ ...k }))
    const rand = seeded(5)
    for (let i = 0; i < 2000; i++) {
      kids = stepKids(kids, 0.1, 0.09, field, rand)
      expect(kids.every(inside)).toBe(true)
    }
    expect(kids.some((k, i) => Math.hypot(k.x - start[i]!.x, k.y - start[i]!.y) > 1)).toBe(true)
  })

  it('a slow round walks slower than a quick one (the speed is in picture widths a second)', () => {
    const slow = stepKids([{ x: 50, y: 70, vx: 4, vy: 0 }], 1, 0.04, field, () => 1)[0]!
    expect(slow.x).toBeCloseTo(54, 6)
  })

  it('a tap on a child counts within a generous circle (the height counts for two thirds of the width)', () => {
    expect(hit({ x: 50, y: 70 }, { x: 53, y: 70 }, 4)).toBe(true)
    expect(hit({ x: 50, y: 70 }, { x: 56, y: 70 }, 4)).toBe(false)
    expect(hit({ x: 50, y: 70 }, { x: 50, y: 75 }, 4)).toBe(true)
    expect(hit({ x: 50, y: 70 }, { x: 50, y: 78 }, 4)).toBe(false)
  })
})

describe('guessed herds', () => {
  const region = { x: 10, y: 55, w: 80, h: 35 }

  it('the animals stand inside the region, as many as asked for, the same for the same seed', () => {
    const a = scatter(40, 7, region)
    expect(a).toHaveLength(40)
    for (const p of a) {
      expect(p.x >= region.x && p.x <= region.x + region.w).toBe(true)
      expect(p.y >= region.y && p.y <= region.y + region.h).toBe(true)
    }
    expect(scatter(40, 7, region)).toEqual(a)
    expect(scatter(40, 8, region)).not.toEqual(a)
    expect(scatter(0, 1, region)).toEqual([])
  })

  it('the animals are spread out: no two stand on top of each other', () => {
    const a = scatter(30, 2, region)
    let nearest = Infinity
    for (let i = 0; i < a.length; i++) for (let k = i + 1; k < a.length; k++) nearest = Math.min(nearest, Math.hypot(a[i]!.x - a[k]!.x, (a[i]!.y - a[k]!.y) * (2 / 3)))
    expect(nearest).toBeGreaterThan(0.8)
  })

  it('the right range is the one that contains the number; about is the middle rounded to five', () => {
    const ranges: [number, number][] = [[5, 15], [20, 40], [50, 70]]
    expect(rightRange(12, ranges)).toBe(0)
    expect(rightRange(30, ranges)).toBe(1)
    expect(rightRange(64, ranges)).toBe(2)
    expect(rightRange(17, ranges)).toBe(-1)
    expect(ranges.map(rangeAbout)).toEqual([10, 30, 60])
  })
})

describe('cairn of two stones', () => {
  it('a side goes one step; at most one step ahead of the other, then it waits (no mistake)', () => {
    let s = { left: 0, right: 0 }
    let r = advance(s, 'left', 3)
    expect(r).toEqual({ state: { left: 1, right: 0 }, moved: true })
    s = r.state
    r = advance(s, 'left', 3)
    expect(r.moved).toBe(false)
    expect(r.state).toEqual({ left: 1, right: 0 })
    r = advance(s, 'right', 3)
    expect(r.state).toEqual({ left: 1, right: 1 })
  })

  it('tapping left and right in turn brings both to the middle together; a side never goes past the end', () => {
    let s = { left: 0, right: 0 }
    for (let i = 0; i < 3; i++) {
      s = advance(s, 'left', 3).state
      s = advance(s, 'right', 3).state
    }
    expect(s).toEqual({ left: 3, right: 3 })
    expect(arrived(s, 3)).toBe(true)
    expect(advance(s, 'left', 3).moved).toBe(false)
    expect(arrived({ left: 3, right: 2 }, 3)).toBe(false)
  })

  it('only one side tapped again and again goes one step and stops', () => {
    let s = { left: 0, right: 0 }
    for (let i = 0; i < 10; i++) s = advance(s, 'right', 5).state
    expect(s).toEqual({ left: 0, right: 1 })
  })
})

describe('herds on the road', () => {
  const road: [number, number][] = [[0, 90], [40, 90], [40, 60]]

  it('the length counts the height for two thirds; the position is on the line', () => {
    expect(roadLength(road)).toBeCloseTo(40 + 30 * (2 / 3), 6)
    expect(positionAt(road, 0)).toEqual({ x: 0, y: 90 })
    expect(positionAt(road, 1)).toEqual({ x: 40, y: 60 })
    const mid = positionAt(road, 40 / (40 + 20) )
    expect(mid.x).toBeCloseTo(40, 6)
    expect(mid.y).toBeCloseTo(90, 6)
    expect(positionAt(road, -1)).toEqual({ x: 0, y: 90 })
    expect(positionAt(road, 5)).toEqual({ x: 40, y: 60 })
  })

  it('there is room when the herd behind is far enough (in percent of the road); too close is not', () => {
    expect(gapOk(50, 20, 25)).toBe(true)
    expect(gapOk(50, 30, 25)).toBe(false)
    expect(gapOk(50, 25, 25)).toBe(true)
    expect(gapOk(0, 0, 18)).toBe(false)
  })
})

describe('ring of the twelve sons', () => {
  const twelve = Array.from({ length: 12 }, (_, i) => i * 30)

  it('twelve figures like the hours of a clock are even, whatever the turn; a figure out of place is not', () => {
    expect(isEven(twelve, 14)).toBe(true)
    expect(isEven(twelve.map((a) => a + 17), 14)).toBe(true)
    expect(isEven(twelve.map((a) => a + (a === 90 ? 20 : 0)), 14)).toBe(false)
    expect(isEven(twelve.map((a) => a + (a === 90 ? 6 : 0)), 14)).toBe(true)
    expect(isEven(twelve.map((a) => a + (a === 90 ? 10 : 0)), 14)).toBe(false)
  })

  it('four figures a quarter of a circle apart are even; the first round is generous (25 degrees)', () => {
    expect(isEven([10, 100, 190, 280], 25)).toBe(true)
    expect(isEven([10, 100, 190, 290], 25)).toBe(true)
    expect(isEven([10, 100, 190, 310], 25)).toBe(false)
    expect(isEven([10, 100, 190, 330], 25)).toBe(false)
    expect(isEven([0, 20, 190, 280], 25)).toBe(false)
  })

  it('a few figures of the twelve are right when they lie on the clock, in any order, but not two on the same place', () => {
    expect(fitsRing([0], 12, 14)).toBe(true)
    expect(fitsRing([10, 130, 70], 12, 14)).toBe(true)
    expect(fitsRing([0, 45], 12, 14)).toBe(false)
    expect(fitsRing([0, 5], 12, 14)).toBe(false)
    expect(fitsRing(twelve, 11, 14)).toBe(false)
    expect(fitsRing([], 12, 14)).toBe(true)
  })

  it('two figures are not a ring yet (the first of a game cannot be wrong)', () => {
    expect(isEven([], 14)).toBe(false)
    expect(isEven([40], 14)).toBe(false)
  })

  it('a point is put on the ring: its angle, the place on the ring and how far it was from it', () => {
    const c = { x: 50, y: 50 }
    const right = snapToRing({ x: 80, y: 50 }, c, 20)
    expect(right.angle).toBeCloseTo(0, 6)
    expect(right.x).toBeCloseTo(70, 6)
    expect(right.y).toBeCloseTo(50, 6)
    expect(right.distance).toBeCloseTo(10, 6)
    // below the middle: 90 degrees; the height of the ring is two thirds of its width
    const below = snapToRing({ x: 50, y: 70 }, c, 20)
    expect(below.angle).toBeCloseTo(90, 6)
    expect(below.x).toBeCloseTo(50, 6)
    expect(below.y).toBeCloseTo(50 + 20 / (2 / 3), 6)
    expect(snapToRing({ x: 50, y: 50 + 20 / (2 / 3) }, c, 20).distance).toBeCloseTo(0, 6)
  })
})
