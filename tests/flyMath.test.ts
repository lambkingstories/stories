/** The small calculations of the steering game and the stars of games where things are caught. */
import { describe, expect, it } from 'vitest'
import { catchStars } from '@/utils/adventureScore'
import { pathTouches, skyDistance } from '@/utils/flyMath'

describe('the path of the dove', () => {
  const light = { x: 50, y: 50 }
  it('touches a light that lies on the way, even if the finger jumped over it', () => {
    expect(pathTouches({ x: 10, y: 50 }, { x: 90, y: 50 }, light, 10)).toBe(true)
    expect(pathTouches({ x: 10, y: 10 }, { x: 90, y: 90 }, light, 10)).toBe(true)
  })
  it('misses a light that is further away than its radius', () => {
    expect(pathTouches({ x: 10, y: 20 }, { x: 90, y: 20 }, light, 10)).toBe(false)
    // the sky is 3 : 4: 10 % of the height are 13 widths, so a path 10 % above the light is outside a radius of 10
    expect(pathTouches({ x: 10, y: 40 }, { x: 90, y: 40 }, light, 10)).toBe(false)
    expect(pathTouches({ x: 10, y: 45 }, { x: 90, y: 45 }, light, 10)).toBe(true)
  })
  it('a path that stops before the light does not touch it, and a point works as a path', () => {
    expect(pathTouches({ x: 10, y: 50 }, { x: 30, y: 50 }, light, 10)).toBe(false)
    expect(pathTouches({ x: 50, y: 50 }, { x: 50, y: 50 }, light, 1)).toBe(true)
  })
  it('measures a distance in widths', () => {
    expect(skyDistance({ x: 0, y: 0 }, { x: 0, y: 75 })).toBeCloseTo(100)
  })
})

describe('the stars of a game of catching', () => {
  it('all but one is three, more than half is two, otherwise one', () => {
    expect(catchStars(5, 5)).toBe(3)
    expect(catchStars(4, 5)).toBe(3)
    expect(catchStars(3, 5)).toBe(2)
    expect(catchStars(2, 5)).toBe(1)
    expect(catchStars(0, 5)).toBe(1)
    expect(catchStars(0, 0)).toBe(0)
  })
})
