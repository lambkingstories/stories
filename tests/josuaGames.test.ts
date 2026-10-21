/**
 * The pure functions of the new games of "Josua" (`utils/josuaGames.ts`): the supplies in the basket, the flax over the men, the red rope and the guard, the beats of the bearers, the flatbreads
 * and the clouds of noise.
 */
import { describe, expect, it } from 'vitest'
import {
  bakeState,
  cloudLevel,
  covered,
  coveredFraction,
  fastestFinishMs,
  firstSeenMs,
  fits,
  gridOf,
  guardState,
  guardX,
  lastKnot,
  lowerStart,
  lowerStep,
  passMs,
  isLoud,
  judge,
  nearestBeat,
  nextSpawn,
  packSize,
  peeks,
  schedule,
  solvable,
  tipSpot,
  turnRect
} from '@/utils/josuaGames'
import type { RopeRules } from '@/utils/josuaGames'

const sack = { id: 'sack', w: 2, h: 2 }
const krug = { id: 'krug', w: 1, h: 2 }
const brote = { id: 'brote', w: 2, h: 1 }
const datteln = { id: 'datteln', w: 1, h: 1 }
const feigen = { id: 'feigen', w: 1, h: 1 }

describe('supplies in the basket', () => {
  it('a thing turned a quarter swaps width and height', () => {
    expect(packSize(krug, false)).toEqual({ w: 1, h: 2 })
    expect(packSize(krug, true)).toEqual({ w: 2, h: 1 })
    expect(packSize(sack, true)).toEqual({ w: 2, h: 2 })
  })

  it('the grid shows which cells a thing covers; a thing fits only on free cells inside the basket', () => {
    const grid = gridOf(4, 3, [{ id: 'sack', col: 0, row: 0, rot: false }], [sack])
    expect(grid).toEqual(['sack', 'sack', '', '', 'sack', 'sack', '', '', '', '', '', ''])
    expect(fits(grid, 4, 3, krug, 2, 0, false)).toBe(true)
    expect(fits(grid, 4, 3, krug, 1, 0, false)).toBe(false)
    expect(fits(grid, 4, 3, krug, 3, 2, false)).toBe(false)
    expect(fits(grid, 4, 3, krug, 3, 1, false)).toBe(true)
    // turned it lies across: two cells wide
    expect(fits(grid, 4, 3, krug, 3, 0, true)).toBe(false)
    expect(fits(grid, 4, 3, krug, 2, 0, true)).toBe(true)
    expect(fits(grid, 4, 3, krug, -1, 0, false)).toBe(false)
  })

  it('round 1 (4 x 3: sack, jug, loaves, dates, figs) and round 2 (5 x 3 with a second jug and a water skin) can be packed', () => {
    expect(solvable(4, 3, [sack, krug, brote, datteln, feigen])).toBe(true)
    expect(solvable(5, 3, [sack, krug, { id: 'krug-2', w: 1, h: 2 }, brote, { id: 'schlauch', w: 1, h: 2 }, datteln, feigen])).toBe(true)
  })

  it('knows what cannot be packed', () => {
    expect(solvable(3, 3, [sack, { id: 'sack-2', w: 2, h: 2 }])).toBe(false)
    expect(solvable(2, 2, [sack, datteln])).toBe(false)
    expect(solvable(4, 3, [])).toBe(true)
  })

  it('the tip is a place after which the rest can still be packed; it turns a thing when it has to', () => {
    const empty = gridOf(4, 3, [], [])
    const spot = tipSpot(empty, 4, 3, [sack, krug, brote, datteln, feigen])!
    expect(spot).not.toBeNull()
    const rest = [sack, krug, brote, datteln, feigen].filter((i) => i.id !== spot.id)
    const thing = [sack, krug, brote, datteln, feigen].find((i) => i.id === spot.id)!
    const grid = gridOf(4, 3, [spot], [thing])
    expect(fits(empty, 4, 3, thing, spot.col, spot.row, spot.rot)).toBe(true)
    // the grid with the tipped thing can still be finished
    expect(tipSpot(grid, 4, 3, rest)).not.toBeNull()
    // a basket with a bad thing in the middle cannot be finished: no tip
    const bad = gridOf(3, 3, [{ id: 'datteln', col: 1, row: 1, rot: false }], [datteln])
    expect(tipSpot(bad, 3, 3, [{ id: 'sack', w: 2, h: 2 }])).toBeNull()
    expect(tipSpot(empty, 4, 3, [])).toBeNull()
  })
})

describe('flax over the men', () => {
  const man = { x: 0, y: 0, w: 30, h: 12.5 }
  const big = { x: 0, y: 0, w: 30, h: 10.8 }

  it('one big bundle does not cover a man; the cells that look out are listed', () => {
    expect(coveredFraction(man, [big])).toBeCloseTo(0.8, 6)
    expect(covered(man, [big])).toBe(false)
    const looking = peeks(man, [big])
    expect(looking).toHaveLength(12)
    expect(looking.every((p) => p.y > 10)).toBe(true)
    expect(peeks(man, [])).toHaveLength(60)
  })

  it('two big bundles that lie a little over each other hide him', () => {
    expect(covered(man, [big, { x: 0, y: 1.7, w: 30, h: 10.8 }])).toBe(true)
    expect(peeks(man, [big, { x: 0, y: 1.7, w: 30, h: 10.8 }])).toEqual([])
  })

  it('a big and a middle bundle leave a corner (not hidden); with the small one on the corner he is hidden', () => {
    const mid = { x: 8.3, y: 2.5, w: 21.7, h: 10 }
    const small = { x: 0, y: 3.3, w: 15, h: 9.2 }
    expect(covered(man, [big, mid])).toBe(false)
    expect(coveredFraction(man, [big, mid])).toBeCloseTo(0.95, 6)
    expect(covered(man, [big, mid, small])).toBe(true)
  })

  it('a bundle turned a quarter keeps its middle', () => {
    const t = turnRect({ x: 10, y: 10, w: 30, h: 10 })
    expect(t).toEqual({ x: 20, y: 0, w: 10, h: 30 })
    expect(turnRect(t)).toEqual({ x: 10, y: 10, w: 30, h: 10 })
  })
})

describe('the red rope and the guard', () => {
  // the numbers of the draft: the rope at 20.2 percent, the guard 12 percent of the width a second, light 16, wait 24 before it
  const base = { windowX: 20.2, guardSpeed: 12, lightRadius: 16, warnLead: 24, knots: 4, gapMs: 1500 }
  const r1: RopeRules = { ...base, descentMs: 8000, passes: 1 }
  const r2: RopeRules = { ...base, descentMs: 15000, passes: 2 }

  it('a pass of the guard takes 11.3 seconds; round 2 has two passes with a pause of 1.5 seconds, and nobody walks before, between or after', () => {
    expect(passMs(r1)).toBeCloseTo(11333.3, 0)
    expect(guardX(0, r1)).toBe(118)
    expect(guardX(5000, r1)).toBeCloseTo(58, 6)
    expect(guardX(passMs(r1) + 10, r1)).toBeNull()
    expect(guardX(-5, r1)).toBeNull()
    expect(guardX(passMs(r2) + 500, r2)).toBeNull()
    expect(guardX(passMs(r2) + 1500 + 1000, r2)).toBeCloseTo(118 - 12, 6)
    expect(guardX(passMs(r2) * 2 + 1500 + 10, r2)).toBeNull()
  })

  it('"wait" comes 2 seconds before the light reaches the rope, the light is the danger for 2.7 seconds, then it is free again (round 1: 4.8 / 6.8 / 9.5 seconds)', () => {
    const at = (ms: number) => guardState(guardX(ms, r1), r1)
    expect(at(0)).toBe('far')
    expect(at(4700)).toBe('far')
    expect(at(4900)).toBe('warn')
    expect(at(6700)).toBe('warn')
    expect(at(6900)).toBe('danger')
    expect(at(9400)).toBe('danger')
    expect(at(9600)).toBe('far')
    expect(at(passMs(r1) + 100)).toBe('far')
    // two seconds from "wait" to "danger" (24 percent at 12 percent a second)
    expect((r1.warnLead / r1.guardSpeed) * 1000).toBe(2000)
    // the danger is the light: 2 x 16 percent at 12 percent a second = 2.67 seconds
    expect(((2 * r1.lightRadius) / r1.guardSpeed) * 1000).toBeCloseTo(2667, 0)
  })

  it('round 2: both passes are told apart (4.8 / 6.8 / 9.5 and 17.6 / 19.6 / 22.3 seconds)', () => {
    const second = passMs(r2) + 1500
    const at = (ms: number) => guardState(guardX(ms, r2), r2)
    expect([at(4900), at(6900), at(9600)]).toEqual(['warn', 'danger', 'far'])
    expect([at(10500), at(12000)]).toEqual(['far', 'far'])
    expect([at(second + 4900), at(second + 6900), at(second + 9600)]).toEqual(['warn', 'danger', 'far'])
    expect(second / 1000 + 4.82).toBeCloseTo(17.65, 1)
  })

  it('the man is pulled back to the last of the four knots (at 0, 25, 50 and 75 percent of the way)', () => {
    expect([0, 0.1, 0.25, 0.3, 0.5, 0.74, 0.75, 0.99, 1].map((y) => lastKnot(y, 4))).toEqual([0, 0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1])
    expect(lastKnot(0.6, 0)).toBe(0)
  })

  it('holding lets the man down evenly, letting go stops him; waiting is never a mistake', () => {
    let s = lowerStart()
    for (let i = 0; i < 40; i++) s = lowerStep(s, 100, true, r1).state
    expect(s.y).toBeCloseTo(0.5, 6)
    const held = s.y
    for (let i = 0; i < 20; i++) {
      const r = lowerStep(s, 100, false, r1)
      expect(r.event).toBeNull()
      s = r.state
    }
    expect(s.y).toBe(held)
    expect(s.t).toBeCloseTo(6000, 6)
  })

  it('holding while the guard is in the light: he is seen, falls back to the last knot and the lock of 0.8 seconds counts nothing; the time goes on', () => {
    // wait for the light without holding, then hold
    let s = { t: 6800, y: 0.6, lock: 0 }
    const seen = lowerStep(s, 100, true, r1)
    expect(seen.event).toBe('gesehen')
    expect(seen.state.y).toBe(0.5)
    expect(seen.state.lock).toBe(800)
    expect(seen.state.t).toBe(6900)
    s = seen.state
    // still holding: nothing counts for 0.8 seconds (the guard is still in the light, but no second mistake)
    for (let i = 0; i < 8; i++) {
      const r = lowerStep(s, 100, true, r1)
      expect(r.event).toBeNull()
      expect(r.state.y).toBe(0.5)
      s = r.state
    }
    // after the lock the guard is still there: seen again
    expect(lowerStep(s, 100, true, r1).event).toBe('gesehen')
    // letting go in the light is never a mistake
    expect(lowerStep({ t: 7000, y: 0.6, lock: 0 }, 100, false, r1).event).toBeNull()
  })

  it('at the ground he is down', () => {
    const r = lowerStep({ t: 20000, y: 0.999, lock: 0 }, 100, true, r1)
    expect(r.event).toBe('unten')
    expect(r.state.y).toBe(1)
  })

  it('every round can be won by right play in at most 30 seconds, and cannot be won without waiting', () => {
    const f1 = fastestFinishMs(r1)!
    const f2 = fastestFinishMs(r2)!
    expect(f1).toBeGreaterThan(12500)
    expect(f1).toBeLessThan(13000)
    expect(f2).toBeGreaterThan(24000)
    expect(f2).toBeLessThan(25000)
    expect(f1).toBeLessThanOrEqual(30000)
    expect(f2).toBeLessThanOrEqual(30000)
    // a player who never lets go is seen when the light comes (6.8 seconds), long before he can be down
    const seen1 = firstSeenMs(r1)!
    expect(seen1).toBeGreaterThanOrEqual(6800)
    expect(seen1).toBeLessThan(7000)
    expect(seen1).toBeGreaterThan(4800 + 1000)
    expect(firstSeenMs(r2)!).toBeLessThan(7000)
    // 8 seconds of going down do not fit before the light (6.8 seconds): waiting is needed; in round 2 the second pause is forced (the man is not down before the second pass, at 17.6 seconds)
    expect(r1.descentMs).toBeGreaterThan(6800)
    expect(f2).toBeGreaterThan(17600)
  })

  it('a faster guard or a shorter rope stays winnable (the check is not a trick of these numbers)', () => {
    expect(fastestFinishMs({ ...r1, guardSpeed: 18 })).not.toBeNull()
    expect(fastestFinishMs({ ...r1, descentMs: 3000 })).toBeLessThan(3100)
  })
})
