/**
 * The pure functions of the new games of "Josua" (`utils/josuaGames.ts`): the supplies in the basket, the flax over the men, the swing of the rope, the beats of the bearers, the flatbreads
 * and the clouds of noise.
 */
import { describe, expect, it } from 'vitest'
import {
  angle,
  bakeState,
  cloudLevel,
  covered,
  coveredFraction,
  fits,
  gridOf,
  isFree,
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

describe('rope', () => {
  it('swings to and fro in one period: nothing at the start, the most at a quarter, the other way at three quarters', () => {
    expect(angle(0, 12, 3.4)).toBeCloseTo(0, 6)
    expect(angle(0.85, 12, 3.4)).toBeCloseTo(12, 6)
    expect(angle(2.55, 12, 3.4)).toBeCloseTo(-12, 6)
    expect(angle(3.4, 12, 3.4)).toBeCloseTo(0, 6)
  })

  it('free only when the rope swings away from the wall beyond the threshold', () => {
    expect(isFree(5, 2)).toBe(true)
    expect(isFree(2, 2)).toBe(false)
    expect(isFree(-8, 2)).toBe(false)
    expect(isFree(0, 2)).toBe(false)
  })

  it('the free part of a swing is a good part (round 1 a little under a half, round 2 a little shorter), so that a tap has a fair chance', () => {
    const share = (amp: number, period: number, threshold: number) => {
      let free = 0
      for (let i = 0; i < 1000; i++) if (isFree(angle((i / 1000) * period, amp, period), threshold)) free++
      return free / 1000
    }
    expect(share(12, 3.4, 2)).toBeGreaterThan(0.4)
    expect(share(12, 3.4, 2)).toBeLessThan(0.5)
    expect(share(14, 2.8, 4)).toBeGreaterThan(0.35)
    expect(share(14, 2.8, 4)).toBeLessThan(share(12, 3.4, 2))
  })
})

describe('beats', () => {
  it('beats come at an even distance: 70 a minute are 0.857 seconds apart', () => {
    const beats = schedule(70, 4, 2)
    expect(beats).toHaveLength(4)
    expect(beats[0]).toBe(2)
    expect(beats[1]! - beats[0]!).toBeCloseTo(60 / 70, 9)
    expect(beats[3]! - beats[2]!).toBeCloseTo(60 / 70, 9)
    expect(schedule(90, 3, 0).map((b) => Math.round(b * 1000))).toEqual([0, 667, 1333])
  })

  it('a tap is in time within the tolerance, before or after the beat', () => {
    expect(judge(5.2, 5, 0.3)).toBe(true)
    expect(judge(4.75, 5, 0.3)).toBe(true)
    expect(judge(5.4, 5, 0.3)).toBe(false)
    expect(judge(4.5, 5, 0.25)).toBe(false)
    expect(judge(5.3, 5, 0.3)).toBe(true)
  })

  it('the nearest beat to a time; never before the first one', () => {
    expect(nearestBeat(0, 60, 2)).toBe(2)
    expect(nearestBeat(2.4, 60, 2)).toBe(2)
    expect(nearestBeat(2.6, 60, 2)).toBe(3)
    expect(nearestBeat(10.2, 60, 2)).toBe(10)
  })
})

describe('flatbread', () => {
  it('raw before the window, golden in it (the ends count), too dark after', () => {
    expect(bakeState(0, 2.5, 6)).toBe('roh')
    expect(bakeState(2.49, 2.5, 6)).toBe('roh')
    expect(bakeState(2.5, 2.5, 6)).toBe('golden')
    expect(bakeState(6, 2.5, 6)).toBe('golden')
    expect(bakeState(6.01, 2.5, 6)).toBe('dunkel')
  })
})

describe('clouds of noise', () => {
  it('the next cloud is always the same for the same seed and number, at one of the places, after a short wait', () => {
    for (let n = 0; n < 40; n++) {
      const a = nextSpawn(3, n, 6)
      expect(nextSpawn(3, n, 6)).toEqual(a)
      expect(a.spot).toBeGreaterThanOrEqual(0)
      expect(a.spot).toBeLessThan(6)
      expect(a.wait).toBeGreaterThanOrEqual(0.8)
      expect(a.wait).toBeLessThanOrEqual(2.4)
    }
    const spots = new Set(Array.from({ length: 40 }, (_, n) => nextSpawn(3, n, 6).spot))
    expect(spots.size).toBeGreaterThanOrEqual(4)
    expect(Array.from({ length: 10 }, (_, n) => nextSpawn(3, n, 6))).not.toEqual(Array.from({ length: 10 }, (_, n) => nextSpawn(4, n, 6)))
  })

  it('a cloud grows through three sizes and is loud when the time is over', () => {
    expect(cloudLevel(0, 4)).toBe(1)
    expect(cloudLevel(1.2, 4)).toBe(1)
    expect(cloudLevel(1.4, 4)).toBe(2)
    expect(cloudLevel(2.6, 4)).toBe(2)
    expect(cloudLevel(2.7, 4)).toBe(3)
    expect(cloudLevel(10, 4)).toBe(3)
    expect(isLoud(3.9, 4)).toBe(false)
    expect(isLoud(4, 4)).toBe(true)
  })
})
