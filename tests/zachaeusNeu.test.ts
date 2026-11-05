/**
 * The arithmetic of the new game of "Zachäus und Lazarus" (`utils/zachaeusNeu.ts`): "Stepping stones" (`bachsteine`, John 11,3).
 * Distances on the upright picture, where the messenger can step, where he stands, the cheapest way, the help, a tap on a place, the arrow keys and the check of the data
 * (the real data of stage 5 and broken samples).
 */
import { describe, expect, it, vi } from 'vitest'
import { zachaeus } from '@/data/adventures/zachaeus'
import {
  STONES_RATIO,
  stepStonesProblems,
  stonesCheapest,
  stonesDist,
  stonesFewest,
  stonesHint,
  stonesLeft,
  stonesNeighbour,
  stonesProgress,
  stonesReach,
  stonesStand,
  stonesTap
} from '@/utils/zachaeusNeu'
import type { StonesGame, StonesRound } from '@/utils/zachaeusNeu'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

/** A small brook: three rows of places, the middle of the lowest and the highest row is a whirl. */
const ROUND: StonesRound = {
  hint: 'Lege Steine.',
  background: 'x/bach.webp',
  start: { x: 50, y: 76 },
  goal: { x: 50, y: 28 },
  reach: 25,
  stones: 5,
  spots: [
    { x: 36, y: 60.5 },
    { x: 52, y: 60, whirl: true },
    { x: 68, y: 60.5 },
    { x: 26, y: 50.5 },
    { x: 45, y: 50.5 },
    { x: 63, y: 50 },
    { x: 34, y: 41 },
    { x: 54, y: 41, whirl: true },
    { x: 72, y: 41 }
  ]
}
/** A wider brook: four whirls, the only way of five stones goes round them. */
const ROUND2: StonesRound = {
  hint: 'Der Bach ist breiter.',
  background: 'x/bach-2.webp',
  start: { x: 50, y: 80 },
  goal: { x: 50, y: 25 },
  reach: 23,
  stones: 6,
  spots: [
    [37, 66.5], [54, 66.5, 1], [70, 66], [27, 57, 1], [44, 57], [62, 57], [79, 56.5], [33, 47], [52, 47, 1], [72, 47], [24, 38], [43, 38, 1], [62, 38], [80, 38.5]
  ].map(([x, y, w]) => (w ? { x: x!, y: y!, whirl: true } : { x: x!, y: y! }))
}
const none = () => ROUND.spots.map(() => false)
const lay = (...ks: number[]) => ROUND.spots.map((_, i) => ks.includes(i))

describe('Stepping stones: the arithmetic', () => {
  it('measures on the upright picture: a step up counts more than the same step sideways', () => {
    expect(STONES_RATIO).toBeCloseTo(0.75)
    expect(stonesDist({ x: 0, y: 0 }, { x: 30, y: 0 })).toBeCloseTo(30)
    expect(stonesDist({ x: 0, y: 0 }, { x: 0, y: 30 })).toBeCloseTo(40)
  })

  it('the messenger reaches only stones within his step, over laid stones, never a whirl', () => {
    expect(stonesReach(ROUND, none()).reached.every((r) => !r)).toBe(true)
    // the right lower stone is too far from the bank
    expect(stonesReach(ROUND, lay(2)).reached[2]).toBe(false)
    const r = stonesReach(ROUND, lay(0, 3))
    expect(r.reached[0]).toBe(true)
    expect(r.reached[3]).toBe(true)
    expect(r.goal).toBe(false)
    const way = stonesReach(ROUND, lay(0, 3, 6))
    expect(way.goal).toBe(true)
    expect(way.route).toEqual([0, 3, 6])
    // the way from a stone he stands on starts after it
    expect(stonesReach(ROUND, lay(0, 3, 6), 3).route).toEqual([6])
    // a whirl is never a step, even if it were marked as laid
    expect(stonesReach(ROUND, lay(1)).reached[1]).toBe(false)
  })

  it('he stands on the reached stone nearest to the far bank, on the bank without one, on the far bank when the way is there', () => {
    expect(stonesStand(ROUND, none())).toEqual({ at: ROUND.start, spot: -1 })
    expect(stonesStand(ROUND, lay(0)).spot).toBe(0)
    expect(stonesStand(ROUND, lay(0, 4)).spot).toBe(4)
    // a stone he cannot reach does not move him
    expect(stonesStand(ROUND, lay(0, 8)).spot).toBe(0)
    expect(stonesStand(ROUND, lay(0, 4, 6))).toEqual({ at: ROUND.goal, spot: -2 })
    expect(stonesProgress(ROUND, ROUND.start)).toBe(0)
    expect(stonesProgress(ROUND, ROUND.goal)).toBe(1)
    const mid = stonesProgress(ROUND, ROUND.spots[4]!)
    expect(mid).toBeGreaterThan(0.3)
    expect(mid).toBeLessThan(0.7)
  })

  it('the cheapest way: three stones from an empty brook, what is laid costs nothing, a brook with only whirls cannot be crossed', () => {
    expect(stonesFewest(ROUND)).toBe(3)
    const c = stonesCheapest(ROUND, lay(4))!
    expect(c.cost).toBe(2)
    expect(c.spots).toContain(4)
    expect(stonesCheapest(ROUND, lay(0, 3, 6))!.cost).toBe(0)
    expect(stonesFewest({ ...ROUND, spots: ROUND.spots.map((s) => ({ ...s, whirl: true })) })).toBeNull()
  })

  it('the help shows the next place of the cheapest way, or a useless stone when the stones in hand are too few', () => {
    expect(stonesHint(ROUND, none())).toEqual({ kind: 'place', spot: 0 })
    expect(stonesHint(ROUND, lay(0))!.kind).toBe('place')
    expect([3, 4]).toContain(stonesHint(ROUND, lay(0))!.spot)
    // four stones on the wrong side, one in hand, the way still needs three: take one back
    const wrong = lay(2, 5, 8, 3)
    expect(stonesLeft(ROUND, wrong)).toBe(1)
    const h = stonesHint(ROUND, wrong)!
    expect(h.kind).toBe('lift')
    expect([2, 5, 8]).toContain(h.spot)
    expect(stonesHint(ROUND, lay(0, 3, 6))).toBeNull()
  })

  it('a tap lays a stone, takes it back, loses it to a whirl (nothing changes) or does nothing without a stone in hand', () => {
    const a = stonesTap(ROUND, none(), 0)
    expect(a.kind).toBe('placed')
    expect(a.placed[0]).toBe(true)
    const b = stonesTap(ROUND, a.placed, 0)
    expect(b.kind).toBe('lifted')
    expect(b.placed[0]).toBe(false)
    const w = stonesTap(ROUND, none(), 1)
    expect(w.kind).toBe('whirl')
    expect(w.placed).toEqual(none())
    const full = lay(0, 2, 3, 4, 5)
    expect(stonesLeft(ROUND, full)).toBe(0)
    expect(stonesTap(ROUND, full, 6).kind).toBe('empty')
    expect(stonesTap(ROUND, full, 6).placed).toEqual(full)
    expect(stonesTap(ROUND, none(), 99).kind).toBe('empty')
  })

  it('the arrow keys go to the nearest place in that direction; from nothing to the place nearest the messenger', () => {
    expect(stonesNeighbour(ROUND, -1, 0)).toBe(1)
    expect(stonesNeighbour(ROUND, 0, 1)).toBe(1)
    expect(stonesNeighbour(ROUND, 1, 3)).toBe(0)
    expect(stonesNeighbour(ROUND, 0, 0)).toBe(4)
    expect(stonesNeighbour(ROUND, 6, 2)).toBe(3)
    expect(stonesNeighbour(ROUND, 2, 1)).toBeNull()
  })
})

describe('Stepping stones: the check of the data', () => {
  const GAME: StonesGame = {
    messenger: 'x/bote.webp',
    stone: ['x/stein.webp'],
    shallow: 'x/flach.webp',
    whirl: 'x/strudel.webp',
    messengerW: 12,
    stoneW: 12,
    spotW: 14,
    rounds: [ROUND, ROUND2]
  }

  it('the sample is in order; round 2 needs five stones on its only way', () => {
    expect(stepStonesProblems(GAME)).toEqual([])
    expect(stonesFewest(ROUND2)).toBe(5)
    expect(stonesCheapest(ROUND2, ROUND2.spots.map(() => false))!.spots).toEqual([0, 4, 5, 9, 12])
  })

  it('finds what is wrong', () => {
    const p = (g: Partial<StonesGame>) => stepStonesProblems({ ...GAME, ...g })
    expect(p({ messenger: '' })).toContain('no picture of the messenger')
    expect(p({ spotW: 10 }).join(' ')).toMatch(/44 pixels/)
    expect(p({ messengerW: 8 }).join(' ')).toMatch(/40 pixels/)
    expect(p({ rounds: [ROUND] })).toContain('fewer than two rounds')
    expect(p({ rounds: [{ ...ROUND, stones: 3 }, GAME.rounds[1]!] }).join(' ')).toMatch(/spare stone/)
    expect(p({ rounds: [{ ...ROUND, stones: 9 }, GAME.rounds[1]!] }).join(' ')).toMatch(/too many/)
    expect(p({ rounds: [{ ...ROUND, reach: 70 }, GAME.rounds[1]!] }).join(' ')).toMatch(/without a stone/)
    expect(p({ rounds: [{ ...ROUND, spots: ROUND.spots.map((s) => ({ x: s.x, y: s.y })) }, GAME.rounds[1]!] }).join(' ')).toMatch(/no whirl/)
    expect(p({ rounds: [{ ...ROUND, spots: ROUND.spots.map((s) => ({ ...s, whirl: true })) }, GAME.rounds[1]!] }).join(' ')).toMatch(/cannot be crossed/)
    expect(p({ rounds: [{ ...ROUND, spots: [...ROUND.spots, { x: 37, y: 61 }] }, GAME.rounds[1]!] }).join(' ')).toMatch(/overlap/)
    expect(p({ rounds: [{ ...ROUND, spots: [...ROUND.spots, { x: 98, y: 50 }] }, GAME.rounds[1]!] }).join(' ')).toMatch(/outside/)
    // round 2 with the same way as round 1 and more spare stones is not harder
    expect(p({ rounds: [ROUND, { ...ROUND, stones: 6 }] }).join(' ')).toMatch(/easier than round 1|do not change the way/)
  })

  it('the real data of stage 5 are in order: three stones on two ways in round 1, five on one way round the whirls in round 2', () => {
    const g = zachaeus.stages[4]!.task.stepStones as StonesGame
    expect(stepStonesProblems(g)).toEqual([])
    const [r1, r2] = g.rounds
    expect(stonesFewest(r1!)).toBe(3)
    expect(r1!.stones).toBe(5)
    expect(stonesFewest(r2!)).toBe(5)
    expect(r2!.stones).toBe(6)
    // without the whirls round 2 would be shorter: the child has to go round them
    expect(stonesFewest({ ...r2!, spots: r2!.spots.map((s) => ({ x: s.x, y: s.y })) })).toBeLessThan(5)
    expect(r2!.spots.length).toBeGreaterThan(r1!.spots.length)
  })
})
