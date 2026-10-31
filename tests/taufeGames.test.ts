/**
 * The pure arithmetic of the new games of "The Young Jesus and His Baptism" (`utils/taufeGames.ts`): which things are cleared from the road (Matthew 3,3) and how the net takes in the fish (Matthew 4,18).
 */
import { describe, expect, it } from 'vitest'
import { seeded } from '@/utils/jakobGames'
import { castNet, nearestFish, roadIsClear, roadStep, startFish, stepFish } from '@/utils/taufeGames'

describe('Den Weg bereiten: what is cleared and what is left alone', () => {
  it('stones, thorns and branches are cleared; a traveler is a mistake', () => {
    expect(roadStep(false)).toBe('ok')
    expect(roadStep(true)).toBe('wrong')
  })

  it('the road is clear when every obstacle is gone', () => {
    expect(roadIsClear(3, 4)).toBe(false)
    expect(roadIsClear(4, 4)).toBe(true)
    expect(roadIsClear(0, 0)).toBe(false)
  })
})

describe('Das Netz auswerfen: swimming and catching', () => {
  const area = { x: 10, y: 30, w: 80, h: 50 }

  it('the fish start inside the area, in lanes, half of them swimming to the left', () => {
    const fish = startFish(6, area, 0.06, seeded(7))
    expect(fish).toHaveLength(6)
    for (const f of fish) {
      expect(f.x).toBeGreaterThanOrEqual(area.x)
      expect(f.x).toBeLessThanOrEqual(area.x + area.w)
      expect(f.y).toBeGreaterThan(area.y)
      expect(f.y).toBeLessThan(area.y + area.h)
    }
    expect(fish.filter((f) => f.vx < 0)).toHaveLength(3)
  })

  it('the fish turn round at the edge and never leave the area', () => {
    let fish = startFish(5, area, 0.08, seeded(3))
    const rand = seeded(11)
    for (let i = 0; i < 2000; i++) {
      fish = stepFish(fish, 0.05, area, rand)
      for (const f of fish) {
        expect(f.x).toBeGreaterThanOrEqual(area.x)
        expect(f.x).toBeLessThanOrEqual(area.x + area.w)
        expect(f.y).toBeGreaterThanOrEqual(area.y)
        expect(f.y).toBeLessThanOrEqual(area.y + area.h)
      }
    }
  })

  it('the speed of a fish is a few picture widths in a minute, not more', () => {
    const fish = startFish(4, area, 0.06, seeded(5))
    for (const f of fish) expect(Math.abs(f.vx)).toBeLessThan(0.1 * 100)
  })

  it('a net takes in every fish within its reach and none outside', () => {
    const fish = [
      { x: 40, y: 50, vx: 5, vy: 0 },
      { x: 46, y: 52, vx: -5, vy: 0 },
      { x: 80, y: 70, vx: 5, vy: 0 }
    ]
    expect(castNet(fish, { x: 43, y: 51 }, 10)).toEqual([0, 1])
    expect(castNet(fish, { x: 10, y: 10 }, 10)).toEqual([])
    expect(castNet(fish, { x: 80, y: 70 }, 4)).toEqual([2])
  })

  it('the height counts a little less than the width (the lake is 4:3)', () => {
    const fish = [{ x: 50, y: 50, vx: 1, vy: 0 }]
    // 12 percent of the height are 9 percent of the width
    expect(castNet(fish, { x: 50, y: 62 }, 10)).toEqual([0])
    expect(castNet(fish, { x: 62, y: 50 }, 10)).toEqual([])
  })

  it('the nearest fish is found', () => {
    const fish = [
      { x: 20, y: 40, vx: 1, vy: 0 },
      { x: 52, y: 50, vx: 1, vy: 0 },
      { x: 80, y: 60, vx: 1, vy: 0 }
    ]
    expect(nearestFish(fish, { x: 50, y: 50 })).toBe(1)
    expect(nearestFish([], { x: 50, y: 50 })).toBe(-1)
  })
})
