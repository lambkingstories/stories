/**
 * The pure functions of the new games of "Jona" (`utils/jonaGames.ts`): the cargo that slides on the deck, the wave on the beach, the sack that fits a figure, and the sun, the roof and the heat.
 */
import { describe, expect, it } from 'vitest'
import { heatStep, hitsPiece, inShade, isWashed, needsSack, respawnY, roofTarget, sackTotal, shadeParts, shellsAtRisk, shipRise, slideX, sunAt, waveFront } from '@/utils/jonaGames'

describe('cargo that slides (overboard)', () => {
  it('slides sine-like round its place, to each side by the amplitude; without a slide it stays', () => {
    expect(slideX(0, 40, 10, 3000)).toBeCloseTo(40, 6)
    expect(slideX(750, 40, 10, 3000)).toBeCloseTo(50, 6)
    expect(slideX(2250, 40, 10, 3000)).toBeCloseTo(30, 6)
    expect(slideX(3000, 40, 10, 3000)).toBeCloseTo(40, 6)
    expect(slideX(1234, 40, 0, 3000)).toBe(40)
    expect(slideX(1234, 40, 10, 0)).toBe(40)
    // the phase moves the start
    expect(slideX(0, 40, 10, 3000, Math.PI / 2)).toBeCloseTo(50, 6)
  })
  it('the ship rises with every piece that is gone (0 with all on board, 1 with none)', () => {
    expect(shipRise(0, 4)).toBe(0)
    expect(shipRise(2, 4)).toBe(0.5)
    expect(shipRise(4, 4)).toBe(1)
    expect(shipRise(9, 4)).toBe(1)
    expect(shipRise(1, 0)).toBe(0)
  })
  it('a tap hits a piece within its width, with some slack for a finger', () => {
    expect(hitsPiece(50, 50, 10)).toBe(true)
    expect(hitsPiece(57, 50, 10)).toBe(true)
    expect(hitsPiece(59, 50, 10)).toBe(false)
  })
})

describe('the wave on the beach (shore)', () => {
  const round = { periodMs: 8000, high: 50, low: 90 }
  it('starts dry at the lowest place, is highest after half a period and back after a whole one', () => {
    expect(waveFront(0, round)).toBeCloseTo(90, 6)
    expect(waveFront(4000, round)).toBeCloseTo(50, 6)
    expect(waveFront(8000, round)).toBeCloseTo(90, 6)
    expect(waveFront(2000, round)).toBeCloseTo(70, 6)
    expect(waveFront(10000, round)).toBeCloseTo(70, 6)
    expect(waveFront(12000, round)).toBeCloseTo(50, 6)
  })
  it('washes a shell only when the front is at or above it', () => {
    expect(isWashed(60, 70)).toBe(false)
    expect(isWashed(60, 60)).toBe(true)
    expect(isWashed(60, 50)).toBe(true)
    expect(isWashed(20, 50)).toBe(false)
  })
  it('counts the shells in the reach of the wave; a washed shell comes back above the reach, apart from the others', () => {
    expect(shellsAtRisk({ ...round, shells: [{ x: 1, y: 20, kind: 0 }, { x: 1, y: 60, kind: 0 }, { x: 1, y: 85, kind: 0 }] })).toBe(2)
    for (let i = 0; i < 6; i++) expect(respawnY(round, i)).toBeLessThan(round.high)
    expect(new Set([0, 1, 2].map((i) => respawnY(round, i))).size).toBe(3)
    expect(respawnY({ high: 10 }, 0)).toBe(12)
  })
})

describe('sacks for great and small', () => {
  it('the children need small sacks, the grown-ups and the animals big ones', () => {
    expect(needsSack('child')).toBe('small')
    expect(needsSack('adult')).toBe('big')
    expect(needsSack('animal')).toBe('big')
  })
  it('counts the figures of all rounds', () => {
    const fig = (id: string) => ({ id, who: 'child' as const, image: '', imageSack: '', x: 0, y: 0, w: 1 })
    expect(sackTotal({ rounds: [{ hint: '', figures: [fig('a'), fig('b')] }, { hint: '', figures: [fig('c')] }] })).toBe(3)
  })
})

describe('sun, roof and heat (shade)', () => {
  it('the sun climbs from the left in an arc and sets at the right', () => {
    expect(sunAt(0).x).toBeCloseTo(10, 6)
    expect(sunAt(1).x).toBeCloseTo(90, 6)
    expect(sunAt(0.5).x).toBeCloseTo(50, 6)
    expect(sunAt(0.5).y).toBeLessThan(sunAt(0).y)
    expect(sunAt(-1).x).toBeCloseTo(10, 6)
    expect(sunAt(2).x).toBeCloseTo(90, 6)
  })
  it('the roof has to lie on the line from Jonah to the sun', () => {
    const jonah = { x: 50, y: 66 }
    const sun = { x: 90, y: 10 }
    const r = roofTarget(sun, jonah)
    expect(r.x).toBeGreaterThan(50)
    expect(r.x).toBeLessThan(90)
    expect(r.y).toBeLessThan(66)
    // on the line: the same direction as Jonah to the sun
    expect((r.x - jonah.x) / (sun.x - jonah.x)).toBeCloseTo((r.y - jonah.y) / (sun.y - jonah.y), 6)
  })
  it('the shade covers Jonah within the tolerance (the height counts three quarters)', () => {
    expect(inShade({ x: 50, y: 40 }, { x: 50, y: 40 }, 10)).toBe(true)
    expect(inShade({ x: 59, y: 40 }, { x: 50, y: 40 }, 10)).toBe(true)
    expect(inShade({ x: 61, y: 40 }, { x: 50, y: 40 }, 10)).toBe(false)
    expect(inShade({ x: 50, y: 52 }, { x: 50, y: 40 }, 10)).toBe(true)
    expect(inShade({ x: 50, y: 54 }, { x: 50, y: 40 }, 10)).toBe(false)
  })
  it('the heat rises in the sun (full after four seconds), falls in the shade (empty after two and a half) and stays between 0 and 1', () => {
    expect(heatStep(0, 4000, false)).toBe(1)
    expect(heatStep(0, 2000, false)).toBeCloseTo(0.5, 6)
    expect(heatStep(1, 2500, true)).toBe(0)
    expect(heatStep(0.2, 5000, true)).toBe(0)
    expect(heatStep(0.9, 9000, false)).toBe(1)
  })
  it('counts a part for every fifth of a second in the shade', () => {
    expect(shadeParts({ seconds: 8 })).toBe(40)
    expect(shadeParts({ seconds: 10 })).toBe(50)
  })
})
