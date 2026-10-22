/**
 * The pure parts of the new games of "Elia" (`utils/eliaGames.ts`): the flight of a raven, the two caves, the clouds, the loud things and the quiet sound.
 */
import { describe, expect, it } from 'vitest'
import { cloudOver, cloudX, excess, flightOver, flightX, flightY, foodCount, greenShare, isEven, isFood, loudAt, loudTimes, rainGrowth, ravensRoundOver, whisperAt } from '@/utils/eliaGames'

describe('Raben im Anflug', () => {
  it('bread and meat are food, a twig and an empty beak are not; the food of a round is counted', () => {
    expect(isFood('bread')).toBe(true)
    expect(isFood('meat')).toBe(true)
    expect(isFood('twig')).toBe(false)
    expect(isFood('empty')).toBe(false)
    expect(foodCount([{ kind: 'bread' }, { kind: 'twig' }, { kind: 'meat' }, { kind: 'empty' }, { kind: 'bread' }])).toBe(3)
  })

  it('a raven is not there before its time, enters at the right edge, crosses the picture evenly and has left at the left edge', () => {
    const f = { at: 1000, dur: 8000, y: 20 }
    expect(flightX(999, f)).toBeNull()
    expect(flightX(1000, f)).toBe(112)
    expect(flightX(5000, f)).toBeCloseTo(50, 5)
    expect(flightX(9000, f)).toBe(-12)
    expect(flightX(20000, f)).toBe(-12)
    expect(flightOver(8999, f)).toBe(false)
    expect(flightOver(9000, f)).toBe(true)
  })

  it('it flies in a calm wave around its line (never more than a few percent up or down)', () => {
    const f = { at: 0, y: 30 }
    for (let t = 0; t < 12000; t += 250) expect(Math.abs(flightY(t, f) - 30)).toBeLessThanOrEqual(2.4 + 1e-9)
  })

  it('a round is over when every raven was tapped or has left the picture', () => {
    const flights = [
      { at: 0, dur: 5000 },
      { at: 2000, dur: 5000 },
      { at: 4000, dur: 5000 }
    ]
    expect(ravensRoundOver(8000, flights, new Set())).toBe(false)
    expect(ravensRoundOver(8000, flights, new Set([2]))).toBe(true)
    expect(ravensRoundOver(9000, flights, new Set())).toBe(true)
    expect(ravensRoundOver(1000, flights, new Set([0, 1, 2]))).toBe(true)
  })
})

describe('In zwei Höhlen', () => {
  it('the caves are even when they hold the same number', () => {
    expect(isEven(2, 2)).toBe(true)
    expect(isEven(4, 4)).toBe(true)
    expect(isEven(3, 1)).toBe(false)
    expect(isEven(0, 4)).toBe(false)
  })

  it('the cave with too many names itself and says how many prophets have to come out (half of the difference)', () => {
    expect(excess(2, 2)).toEqual({ cave: -1, n: 0 })
    expect(excess(3, 1)).toEqual({ cave: 0, n: 1 })
    expect(excess(1, 3)).toEqual({ cave: 1, n: 1 })
    expect(excess(4, 0)).toEqual({ cave: 0, n: 2 })
    expect(excess(8, 0)).toEqual({ cave: 0, n: 4 })
    expect(excess(5, 3)).toEqual({ cave: 0, n: 1 })
  })
})

describe('Wolken zum Regnen bringen', () => {
  it('a cloud enters at the left edge, drifts evenly and has left at the right edge', () => {
    const c = { at: 500, dur: 10000 }
    expect(cloudX(499, c)).toBeNull()
    expect(cloudX(500, c)).toBe(-14)
    expect(cloudX(5500, c)).toBeCloseTo(50, 5)
    expect(cloudX(10500, c)).toBe(114)
    expect(cloudOver(10499, c)).toBe(false)
    expect(cloudOver(10500, c)).toBe(true)
  })

  it('the small cloud grows with the taps: tiny, medium, big (it rains), and the mountain turns green with the share of the rains', () => {
    expect([0, 1, 2, 3].map(rainGrowth)).toEqual([0, 1, 2, 2])
    expect(greenShare(0, 7)).toBe(0)
    expect(greenShare(7, 7)).toBe(1)
    expect(greenShare(3.5, 7)).toBeCloseTo(0.5, 5)
    expect(greenShare(9, 7)).toBe(1)
    expect(greenShare(1, 0)).toBe(0)
  })
})

describe('Das stille Sausen', () => {
  const round = { order: ['wind', 'quake', 'fire'] as const, loudMs: 3000, gapMs: 800, silenceMs: 2000 }

  it('the loud things come one after the other with a pause between them, in the order of the round', () => {
    const t = loudTimes({ ...round, order: [...round.order] }, 2000)
    expect(t.map((x) => x.kind)).toEqual(['wind', 'quake', 'fire'])
    expect(t[0]).toEqual({ kind: 'wind', from: 2000, to: 5000 })
    expect(t[1]).toEqual({ kind: 'quake', from: 5800, to: 8800 })
    expect(t[2]).toEqual({ kind: 'fire', from: 9600, to: 12600 })
  })

  it('the quiet sound comes after the last loud thing and the stillness, never before', () => {
    const r = { ...round, order: [...round.order] }
    expect(whisperAt(r, 2000)).toBe(12600 + 2000)
    for (const t of loudTimes(r, 2000)) expect(whisperAt(r, 2000)).toBeGreaterThan(t.to)
  })

  it('which loud thing goes on at a time: none in the lead, in a pause and in the stillness', () => {
    const r = { ...round, order: [...round.order] }
    expect(loudAt(1000, r, 2000)).toBeNull()
    expect(loudAt(2000, r, 2000)).toBe('wind')
    expect(loudAt(5200, r, 2000)).toBeNull()
    expect(loudAt(6000, r, 2000)).toBe('quake')
    expect(loudAt(10000, r, 2000)).toBe('fire')
    expect(loudAt(13000, r, 2000)).toBeNull()
  })

  it('another order and longer times in round 2 move the quiet sound later', () => {
    const r1 = { ...round, order: [...round.order] }
    const r2 = { order: ['fire', 'wind', 'quake'] as ('wind' | 'quake' | 'fire')[], loudMs: 4000, gapMs: 600, silenceMs: 2600 }
    expect(loudTimes(r2, 0)[0]!.kind).toBe('fire')
    expect(whisperAt(r2, 0)).toBeGreaterThan(whisperAt(r1, 0))
  })
})
