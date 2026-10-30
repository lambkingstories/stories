/**
 * The pure arithmetic of the new games of "Nehemiah" (`utils/nehemiaGames.ts`): which place of the night ride comes next, and where the builders gather around the trumpeter.
 */
import { describe, expect, it } from 'vitest'
import { allGathered, gatherSpot, rideStep } from '@/utils/nehemiaGames'

describe('Der nächtliche Ritt: the next place', () => {
  const order = ['taltor', 'quelle', 'mist']

  it('the next place of the text is right', () => {
    expect(rideStep(order, 0, 'taltor')).toBe('ok')
    expect(rideStep(order, 1, 'quelle')).toBe('ok')
    expect(rideStep(order, 2, 'mist')).toBe('ok')
  })

  it('a place that comes later or does not belong is wrong', () => {
    expect(rideStep(order, 0, 'quelle')).toBe('wrong')
    expect(rideStep(order, 1, 'mist')).toBe('wrong')
    expect(rideStep(order, 0, 'teich')).toBe('wrong')
  })

  it('a place that was already reached is no mistake', () => {
    expect(rideStep(order, 2, 'taltor')).toBe('again')
    expect(rideStep(order, 2, 'quelle')).toBe('again')
  })

  it('after the last place everything is wrong or again', () => {
    expect(rideStep(order, 3, 'mist')).toBe('again')
    expect(rideStep(order, 3, 'teich')).toBe('wrong')
  })
})

describe('Die Posaune ruft: the fan around the trumpeter', () => {
  const horn = { x: 50, y: 60 }

  it('the first builders stand left and right of the trumpeter, nearest first', () => {
    const a = gatherSpot(horn, 0)
    const b = gatherSpot(horn, 1)
    const c = gatherSpot(horn, 2)
    expect(a.x).toBeGreaterThan(horn.x)
    expect(b.x).toBeLessThan(horn.x)
    expect(Math.abs(c.x - horn.x)).toBeGreaterThan(Math.abs(a.x - horn.x))
  })

  it('no two builders of a round stand on the same place', () => {
    const spots = Array.from({ length: 10 }, (_, i) => gatherSpot(horn, i))
    const keys = new Set(spots.map((s) => `${Math.round(s.x)}:${Math.round(s.y)}`))
    expect(keys.size).toBe(10)
  })

  it('the places stay inside the picture, also for a trumpeter at the edge', () => {
    for (const h of [{ x: 5, y: 95 }, { x: 95, y: 95 }]) {
      for (let i = 0; i < 12; i++) {
        const s = gatherSpot(h, i)
        expect(s.x).toBeGreaterThanOrEqual(4)
        expect(s.x).toBeLessThanOrEqual(96)
        expect(s.y).toBeLessThanOrEqual(96)
      }
    }
  })

  it('the round is done when everybody has arrived (and an empty round is never done)', () => {
    expect(allGathered([true, true])).toBe(true)
    expect(allGathered([true, false])).toBe(false)
    expect(allGathered([])).toBe(false)
  })
})
