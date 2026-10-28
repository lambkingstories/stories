/**
 * The pure arithmetic of the new games of "Solomon" (`utils/salomoGames.ts`): how fast a stone is pulled (lay the stones quietly), whether it lies over a gap, which side a lion belongs to and what happens
 * when a lion is put on a slot (build the throne).
 */
import { describe, expect, it } from 'vitest'
import { ASPECT, dist, gapAt, isLoud, lionSide, loudness, overGap, placeLion, quietSpeed, slotAt } from '@/utils/salomoGames'

describe('Steine leise legen: the speed of the stone', () => {
  it('a slow pull is quiet, a fast one is loud, and one sample or a very short stretch is not judged', () => {
    expect(quietSpeed([])).toBe(0)
    expect(quietSpeed([{ x: 10, y: 10, t: 0 }])).toBe(0)
    // 1 percent of the width in 50 ms is 20 percent per second
    const slow = [0, 1, 2, 3].map((i) => ({ x: 10 + i, y: 50, t: i * 50 }))
    expect(quietSpeed(slow)).toBeCloseTo(20, 5)
    expect(isLoud(quietSpeed(slow), 70)).toBe(false)
    // 30 percent in 50 ms is 600 percent per second
    const fast = [{ x: 10, y: 50, t: 0 }, { x: 40, y: 50, t: 50 }]
    expect(quietSpeed(fast)).toBeCloseTo(600, 5)
    expect(isLoud(quietSpeed(fast), 70)).toBe(true)
    // two samples 20 ms apart are too short to judge
    expect(quietSpeed([{ x: 10, y: 50, t: 0 }, { x: 50, y: 50, t: 20 }])).toBe(0)
  })

  it('only the last 160 ms count: an old jerk is forgotten, and the height counts three quarters of the width', () => {
    const jerkThenSlow = [{ x: 0, y: 50, t: 0 }, { x: 40, y: 50, t: 50 }, { x: 41, y: 50, t: 400 }, { x: 42, y: 50, t: 450 }, { x: 43, y: 50, t: 500 }]
    expect(quietSpeed(jerkThenSlow)).toBeLessThan(30)
    // a move of 40 percent of the height is 30 units of the width
    const up = [{ x: 50, y: 80, t: 0 }, { x: 50, y: 40, t: 100 }]
    expect(quietSpeed(up)).toBeCloseTo((40 * ASPECT) / 0.1, 5)
  })

  it('the meter: quiet below 55 percent of the limit, louder up to the limit, loud above it', () => {
    expect(loudness(10, 70)).toBe(0)
    expect(loudness(38, 70)).toBe(0)
    expect(loudness(40, 70)).toBe(1)
    expect(loudness(70, 70)).toBe(1)
    expect(loudness(71, 70)).toBe(2)
  })

  it('a stone lies over a gap within two thirds of its width; the nearest free gap wins; filled gaps are skipped', () => {
    const gap = { x: 50, y: 60, w: 18 }
    expect(overGap({ x: 50, y: 60 }, gap)).toBe(true)
    expect(overGap({ x: 58, y: 60 }, gap)).toBe(true)
    expect(overGap({ x: 70, y: 60 }, gap)).toBe(false)
    const gaps = [{ x: 30, y: 60, w: 18 }, { x: 50, y: 60, w: 18 }, { x: 70, y: 60, w: 18 }]
    expect(gapAt({ x: 52, y: 60 }, gaps, [false, false, false])).toBe(1)
    expect(gapAt({ x: 52, y: 60 }, gaps, [false, true, false])).toBe(-1)
    expect(gapAt({ x: 40, y: 60 }, gaps, [false, true, false])).toBe(0)
    expect(gapAt({ x: 50, y: 10 }, gaps, [false, false, false])).toBe(-1)
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(Math.hypot(3, 4 * ASPECT), 6)
  })
})

describe('Den Thron bauen: the lions', () => {
  it('a lion that looks to the right belongs to the left of the throne, and the other way round', () => {
    expect(lionSide('right')).toBe('left')
    expect(lionSide('left')).toBe('right')
  })

  it('the right side and a free slot is ok; the wrong side and a taken slot are not; the armrests count as their side', () => {
    expect(placeLion('right', 'left', false)).toBe('ok')
    expect(placeLion('left', 'right', false)).toBe('ok')
    expect(placeLion('left', 'left', false)).toBe('wrongSide')
    expect(placeLion('right', 'right', false)).toBe('wrongSide')
    expect(placeLion('right', 'left', true)).toBe('full')
    expect(placeLion('right', 'arm-left', false)).toBe('ok')
    expect(placeLion('right', 'arm-right', false)).toBe('wrongSide')
    expect(placeLion('left', 'arm-right', false)).toBe('ok')
  })

  it('the slot under a finger is the nearest one within its width, else -1', () => {
    const slots = [{ x: 30, y: 70, w: 10 }, { x: 70, y: 70, w: 10 }]
    expect(slotAt({ x: 31, y: 70 }, slots)).toBe(0)
    expect(slotAt({ x: 69, y: 72 }, slots)).toBe(1)
    expect(slotAt({ x: 50, y: 70 }, slots)).toBe(-1)
  })
})
