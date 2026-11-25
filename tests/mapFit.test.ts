import { describe, expect, it } from 'vitest'
import type { Journey } from '../src/types/adventure'
import { MAP_BELOW, MAP_BOTTOM_LIMIT, MAP_SLACK, fitMapToScreen, lowSpots, maxSpotY, spotBottom } from '../src/utils/mapFit'

// every journey file of the app (the shared helper files have no `map` and fall out)
const modules = import.meta.glob('../src/data/adventures/*.ts', { eager: true }) as Record<string, Record<string, unknown>>
const all: Journey[] = []
for (const m of Object.values(modules)) {
  for (const v of Object.values(m)) {
    const j = v as Journey
    if (j && typeof j === 'object' && typeof j.id === 'string' && j.map && Array.isArray(j.map.stages) && !all.some((x) => x.id === j.id)) all.push(j)
  }
}

describe('adventure map: name plates and the button stay above the tab bar', () => {
  it('finds all the adventures', () => {
    expect(all.length).toBeGreaterThanOrEqual(39)
  })

  it('the numbers come from the phone of Anton: the lowest middle of a round picture is about 0.646', () => {
    expect(MAP_BOTTOM_LIMIT).toBeCloseTo(0.84, 5)
    expect(maxSpotY(0.0339, 6.019)).toBeCloseTo(0.646, 2)
    expect(MAP_BELOW).toBeCloseTo(0.092, 5)
  })

  it.each(all.map((j) => [j.id, j] as const))('%s: after the fit no round picture reaches under the tab bar, and the rows do not run together', (_id, journey) => {
    const map = fitMapToScreen(journey.map)
    // 1. name plate + button above the tab bar
    expect(lowSpots(map)).toEqual([])
    for (const s of [...map.stages, map.exam]) expect(spotBottom(s, map.aspect)).toBeLessThanOrEqual(MAP_BOTTOM_LIMIT + MAP_SLACK)
    // 2. the pictures are not shoved over each other: two stages that are next to each other on the map keep their distance from one another
    const spots = [...map.stages, map.exam]
    for (let a = 0; a < spots.length; a++) {
      for (let b = a + 1; b < spots.length; b++) {
        const dx = (spots[a]!.x - spots[b]!.x) * map.aspect
        const dy = spots[a]!.y - spots[b]!.y
        expect(Math.hypot(dx, dy), `${journey.id}: spots ${a + 1} and ${b + 1} lie on top of each other`).toBeGreaterThan(spots[a]!.d * map.aspect * 0.9)
      }
    }
    // 3. the round pictures are not pushed off the top of the map (the top row is not moved by the fit; letztewoche has its top ring close under the title bar from the start)
    for (const s of spots) expect(s.y - (s.d * map.aspect) / 2).toBeGreaterThan(0.03)
    // 4. the beads of the way stay on the map
    for (const seg of map.path) for (const [, y] of seg) expect(y).toBeGreaterThan(0)
  })

  it('a map that already keeps the rule is not touched', () => {
    const good = all.find((j) => lowSpots(j.map).length === 0)
    expect(good).toBeTruthy()
    expect(fitMapToScreen(good!.map)).toBe(good!.map)
  })

  it('a map that is too low is pressed up: the lowest spot lies on the limit, the top row stays where it is', () => {
    const low = all.find((j) => lowSpots(j.map).length > 0)!
    const before = [...low.map.stages, low.map.exam]
    const after = [...fitMapToScreen(low.map).stages, fitMapToScreen(low.map).exam]
    expect(Math.min(...after.map((s) => s.y))).toBeCloseTo(Math.min(...before.map((s) => s.y)), 3)
    expect(Math.max(...after.map((s) => s.y))).toBeLessThanOrEqual(maxSpotY(before[0]!.d, low.map.aspect) + 0.001)
  })
})
