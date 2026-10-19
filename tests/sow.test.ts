/**
 * The throw of the sowing game (`utils/sow.ts`): where a seed lands for a pull of the bag, with and without wind, and whether it falls into a furrow.
 */
import { describe, expect, it } from 'vitest'
import { GAIN, MAX_PULL, MIN_PULL, hits, isThrow, landing, pullFor, pullOf } from '@/utils/sow'

const ORIGIN = { x: 50, y: 90 }

describe('the throw', () => {
  it('the seed flies the other way than the pull, GAIN times as far', () => {
    // pulled straight down by 20 %: it flies straight up by 20 x GAIN
    const p = landing(ORIGIN, { x: 0, y: 20 })
    expect(p.x).toBeCloseTo(50, 5)
    expect(p.y).toBeCloseTo(90 - 20 * GAIN, 5)
    // pulled down and to the left: it flies up and to the right
    const q = landing(ORIGIN, { x: -10, y: 15 })
    expect(q.x).toBeGreaterThan(50)
    expect(q.y).toBeLessThan(90)
  })

  it('a pull is shortened to the longest pull; too short a pull is no throw', () => {
    expect(Math.hypot(pullOf({ x: 100, y: 0 }).x, pullOf({ x: 100, y: 0 }).y)).toBeCloseTo(MAX_PULL, 5)
    expect(pullOf({ x: 3, y: 4 })).toEqual({ x: 3, y: 4 })
    expect(isThrow({ x: 0, y: MIN_PULL - 0.1 })).toBe(false)
    expect(isThrow({ x: 0, y: MIN_PULL })).toBe(true)
    expect(isThrow({ x: 0, y: 0 })).toBe(false)
  })

  it('the wind drives the seed sideways, the farther it flies the more; calm wind changes nothing; the point stays on the field', () => {
    const calm = landing(ORIGIN, { x: 0, y: 30 }, 0)
    const right = landing(ORIGIN, { x: 0, y: 30 }, 1)
    const left = landing(ORIGIN, { x: 0, y: 30 }, -1)
    expect(right.x).toBeGreaterThan(calm.x)
    expect(left.x).toBeLessThan(calm.x)
    expect(right.x - calm.x).toBeCloseTo(calm.x - left.x, 5)
    expect(right.y).toBeCloseTo(calm.y, 5)
    const near = landing(ORIGIN, { x: 0, y: 10 }, 1)
    expect(near.x - 50).toBeLessThan(right.x - 50)
    const wild = landing(ORIGIN, { x: 0, y: 100 }, 1)
    expect(wild.x).toBeLessThanOrEqual(98)
    expect(wild.y).toBeGreaterThanOrEqual(2)
    expect(landing(ORIGIN, { x: 100, y: -100 }).y).toBeLessThanOrEqual(98)
  })

  it('a furrow counts a little bigger than it looks; pullFor gives the pull that lands on a point (without wind)', () => {
    const furrow = { x: 50, y: 40, w: 30, h: 8 }
    expect(hits({ x: 50, y: 40 }, furrow)).toBe(true)
    expect(hits({ x: 50 + 15 * 1.25, y: 40 }, furrow)).toBe(true)
    expect(hits({ x: 50 + 15 * 1.25 + 0.5, y: 40 }, furrow)).toBe(false)
    expect(hits({ x: 50, y: 40 + 4 * 1.25 + 0.5 }, furrow)).toBe(false)
    expect(hits({ x: 50, y: 40 + 4 * 1.25 }, furrow, 1)).toBe(false)
    const pull = pullFor(ORIGIN, { x: 50, y: 40 })
    const there = landing(ORIGIN, pull)
    expect(there.x).toBeCloseTo(50, 5)
    expect(there.y).toBeCloseTo(40, 5)
    // a pull that lands on the furrow with the wind of the second round is found by taking the drift off
    expect(Math.hypot(pull.x, pull.y)).toBeLessThanOrEqual(MAX_PULL)
  })
})
