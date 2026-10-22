/**
 * The pure parts of the new games of "Daniel" (`utils/danielGames.ts`): the dishes of a day and the length of a day, the places of the statue, the lamp and the signs, the sun and the prayer times.
 */
import { describe, expect, it } from 'vitest'
import {
  buildDay,
  dayLimitMs,
  fillStep,
  isGoodDish,
  isOnSign,
  isRightSlot,
  lampSpeed,
  LAMP_TOO_FAST,
  lightRadius,
  PRAYER_MARKS,
  prayerAt,
  prayerTotal,
  seeded,
  sunOnArc
} from '@/utils/danielGames'

const DISHES = [
  { kind: 'veg' as const },
  { kind: 'veg' as const },
  { kind: 'water' as const },
  { kind: 'water' as const },
  { kind: 'meat' as const },
  { kind: 'meat' as const },
  { kind: 'sweet' as const },
  { kind: 'sweet' as const }
]

describe('the days game', () => {
  it('Daniel eats vegetables and drinks water, never meat and sweets', () => {
    expect(isGoodDish('veg')).toBe(true)
    expect(isGoodDish('water')).toBe(true)
    expect(isGoodDish('meat')).toBe(false)
    expect(isGoodDish('sweet')).toBe(false)
  })

  it('every day has four dishes, one of each kind, two good and two of the king, always the same for the same day', () => {
    for (let day = 0; day < 10; day++) {
      const picks = buildDay(day, DISHES)
      expect(picks, `day ${day}`).toHaveLength(4)
      expect(new Set(picks).size).toBe(4)
      expect(picks.map((i) => DISHES[i]!.kind).sort()).toEqual(['meat', 'sweet', 'veg', 'water'])
      expect(picks.filter((i) => isGoodDish(DISHES[i]!.kind))).toHaveLength(2)
      expect(buildDay(day, DISHES)).toEqual(picks)
    }
  })

  it('the days differ from each other (the order and the variant change)', () => {
    const days = Array.from({ length: 10 }, (_, d) => buildDay(d, DISHES).join(','))
    expect(new Set(days).size).toBeGreaterThanOrEqual(6)
  })

  it('a day takes seven, five, then four seconds; two seconds more with reduced motion', () => {
    const limits: [number, number, number] = [7, 5, 4]
    expect([0, 2].map((d) => dayLimitMs(d, limits))).toEqual([7000, 7000])
    expect([3, 6].map((d) => dayLimitMs(d, limits))).toEqual([5000, 5000])
    expect([7, 9].map((d) => dayLimitMs(d, limits))).toEqual([4000, 4000])
    expect(dayLimitMs(9, limits, true)).toBe(6000)
  })

  it('the random numbers are the same for the same seed and differ for another', () => {
    const a = seeded(5)
    const b = seeded(5)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(seeded(5)()).not.toBe(seeded(6)())
  })
})

describe('the statue game', () => {
  it('a disc belongs in the place with its own number (head 0 to feet 4)', () => {
    for (let i = 0; i < 5; i++) for (let k = 0; k < 5; k++) expect(isRightSlot(i, k)).toBe(i === k)
  })

})

describe('the lamp game', () => {
  it('the speed of the lamp is percent of the picture width per second (the height counts three quarters)', () => {
    expect(lampSpeed({ x: 10, y: 10 }, { x: 20, y: 10 }, 1000)).toBeCloseTo(10)
    expect(lampSpeed({ x: 10, y: 10 }, { x: 10, y: 30 }, 1000)).toBeCloseTo(15)
    expect(lampSpeed({ x: 0, y: 0 }, { x: 5, y: 0 }, 0)).toBe(0)
    expect(lampSpeed({ x: 0, y: 0 }, { x: 30, y: 0 }, 400)).toBeGreaterThan(LAMP_TOO_FAST)
    expect(lampSpeed({ x: 0, y: 0 }, { x: 8, y: 0 }, 400)).toBeLessThan(LAMP_TOO_FAST)
  })

  it('a sign is lit when the lamp is inside the middle part of the circle of light', () => {
    expect(isOnSign({ x: 50, y: 50 }, { x: 50, y: 50 }, 20)).toBe(true)
    expect(isOnSign({ x: 60, y: 50 }, { x: 50, y: 50 }, 20)).toBe(true)
    expect(isOnSign({ x: 70, y: 50 }, { x: 50, y: 50 }, 20)).toBe(false)
    // the height counts three quarters: 20 points up is 15 on the width scale
    expect(isOnSign({ x: 50, y: 30 }, { x: 50, y: 50 }, 20)).toBe(true)
  })

  it('the ring fills in about a second and a fifth over the sign and empties faster; always between 0 and 1', () => {
    let f = 0
    for (let i = 0; i < 12; i++) f = fillStep(f, 100, true)
    expect(f).toBeCloseTo(1)
    expect(fillStep(1, 5000, true)).toBe(1)
    expect(fillStep(0.5, 300, false)).toBeCloseTo(0)
    expect(fillStep(0, 100, false)).toBe(0)
  })

  it('the flame breathes only when it flickers (a tenth to each side, never more than a seventh)', () => {
    expect(lightRadius(20, 123, false)).toBe(20)
    for (let t = 0; t < 4000; t += 37) {
      const r = lightRadius(20, t, true)
      expect(r).toBeGreaterThan(20 * 0.85)
      expect(r).toBeLessThan(20 * 1.15)
    }
  })
})

describe('the hours game', () => {
  it('the sun climbs from the left, stands highest in the middle and sets at the right', () => {
    const a = sunOnArc(0)
    const m = sunOnArc(0.5)
    const z = sunOnArc(1)
    expect(a.x).toBeLessThan(m.x)
    expect(m.x).toBeLessThan(z.x)
    expect(m.y).toBeLessThan(a.y)
    expect(m.y).toBeLessThan(z.y)
    expect(sunOnArc(-1)).toEqual(a)
    expect(sunOnArc(3)).toEqual(z)
  })

  it('three prayer times a day: morning, noon, evening, in this order and far enough apart', () => {
    expect(PRAYER_MARKS).toHaveLength(3)
    expect([...PRAYER_MARKS]).toEqual([...PRAYER_MARKS].sort())
    expect(PRAYER_MARKS[1]! - PRAYER_MARKS[0]!).toBeGreaterThan(0.25)
  })

  it('a tap counts within the window of a mark and nowhere else', () => {
    const round = { dayMs: 12000, windowMs: 1000 }
    expect(prayerAt(2400, round)).toBe(0)
    expect(prayerAt(3300, round)).toBe(0)
    expect(prayerAt(3500, round)).toBe(-1)
    expect(prayerAt(6000, round)).toBe(1)
    expect(prayerAt(9600, round)).toBe(2)
    expect(prayerAt(0, round)).toBe(-1)
    expect(prayerAt(-500, round)).toBe(-1)
    // a narrower window in the second round
    expect(prayerAt(3300, { dayMs: 9000, windowMs: 700 })).toBe(-1)
    expect(prayerAt(1800, { dayMs: 9000, windowMs: 700 })).toBe(0)
  })

  it('three prayer times for every day of a round', () => {
    expect(prayerTotal({ days: 1 })).toBe(3)
    expect(prayerTotal({ days: 2 })).toBe(6)
  })
})
