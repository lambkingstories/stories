/**
 * The pure logic of three games of "Bis nach Rom": "Shadows on the wall" (`wandschatten`), "A place for two" (`beiseite`) and "Boards to the shore" (`bretter`),
 * with their checks of the data (`wallShadowsProblems`, `quietSpotProblems`, `planksProblems`).
 */
import { describe, expect, it } from 'vitest'
import {
  planksPathAt,
  planksProblems,
  prDist,
  quietBestSpot,
  quietBlockedAt,
  quietHeardBy,
  quietPlaces,
  quietSlack,
  quietSpotProblems,
  wallFits,
  wallPersonW,
  wallPersonX,
  wallShadowSize,
  wallShadowsProblems
} from '@/utils/paulusromNeuA'
import { PLANKS, QUIET, WALL } from './paulusromSamples'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('wandschatten: shadows on the wall', () => {
  it('the sample data can be played', () => {
    expect(wallShadowsProblems(WALL)).toEqual([])
  })

  it('a tap is right when the person casts the shadow; the people stand evenly in a row that fits the width', () => {
    expect(wallFits({ id: 'frau', scale: 1, flip: false }, WALL.people[1]!)).toBe(true)
    expect(wallFits({ id: 'frau', scale: 1, flip: false }, WALL.people[0]!)).toBe(false)
    expect(wallPersonX(4, 0)).toBeCloseTo(12.5, 6)
    expect(wallPersonX(4, 3)).toBeCloseTo(87.5, 6)
    expect(wallPersonW(WALL, 3)).toBe(18)
    expect(wallPersonW(WALL, 6)).toBeCloseTo(94 / 6, 6)
  })

  it('the size of a shadow follows the scale and the ratio of the picture (300 x 420)', () => {
    const a = wallShadowSize(WALL, 1)
    expect(a.h).toBe(40)
    expect(a.w).toBeCloseTo((40 * (300 / 420)) / 1.5, 6)
    expect(wallShadowSize(WALL, 1.3).h).toBeCloseTo(52, 6)
  })

  it('the checks find the faults of the data', () => {
    const g = clone(WALL)
    g.rounds[0]!.shadows.push({ id: 'paulus', scale: 1, flip: false })
    expect(wallShadowsProblems(g).join(' ')).toContain('a shadow comes twice')
    const h = clone(WALL)
    h.rounds[0]!.shadows[0] = { id: 'eutychus', scale: 1, flip: false }
    expect(wallShadowsProblems(h).join(' ')).toContain('belongs to nobody in the row')
    const k = clone(WALL)
    k.rounds[0]!.shadows[0]!.flip = true
    expect(wallShadowsProblems(k).join(' ')).toContain('in round 1 the shadows are not turned')
    const l = clone(WALL)
    l.rounds[1]!.shadows.forEach((s) => ((s.scale = 1), (s.flip = false)))
    expect(wallShadowsProblems(l).join(' ')).toContain('bigger or turned')
    const m = clone(WALL)
    m.wall.base = 40
    expect(wallShadowsProblems(m).join(' ')).toContain('does not fit above the baseline')
    const o = clone(WALL)
    o.personW = 9
    expect(wallShadowsProblems(o).join(' ')).toContain('too small for a phone')
    const r = clone(WALL)
    r.rounds.pop()
    expect(wallShadowsProblems(r).join(' ')).toContain('two rounds')
  })
})

describe('beiseite: a place for two', () => {
  const ratio = 4 / 3
  const r1 = QUIET.rounds[0]!
  const r2 = QUIET.rounds[1]!

  it('the sample data can be played', () => {
    expect(quietSpotProblems(QUIET)).toEqual([])
  })

  it('a soldier hears the pair inside his ring (plus half the radius of the pair); outside nobody hears', () => {
    expect(quietHeardBy(r1, { x: 28, y: 30 }, 7, ratio)).toBe(0)
    expect(quietHeardBy(r1, { x: 28 + 15 + 3, y: 30 }, 7, ratio)).toBe(0)
    expect(quietHeardBy(r1, { x: 28 + 15 + 3.6, y: 30 }, 7, ratio)).toBe(-1)
    expect(quietHeardBy(r1, { x: 10, y: 84 }, 7, ratio)).toBe(-1)
    expect(quietHeardBy(r1, { x: 72, y: 32 }, 7, ratio)).toBe(1)
    expect(prDist({ x: 0, y: 0 }, { x: 3, y: 4 }, 1)).toBe(5)
  })

  it('the pillar and the fountain are in the way (not a mistake, the pair is just not put down)', () => {
    expect(quietBlockedAt(r1, { x: 50, y: 52 }, 7, ratio)).toBe(true)
    expect(quietBlockedAt(r1, { x: 50, y: 52 + 12 * ratio }, 7, ratio)).toBe(false)
    expect(quietBlockedAt(r1, { x: 14, y: 56 }, 7, ratio)).toBe(true)
    expect(quietBlockedAt(r1, { x: 10, y: 84 }, 7, ratio)).toBe(false)
  })

  it('slack is the room around a point: positive in a free place, negative inside a ring or at the edge', () => {
    expect(quietSlack(r1, { x: 20, y: 76 }, 7, ratio)).toBeGreaterThan(8)
    expect(quietSlack(r1, { x: 28, y: 30 }, 7, ratio)).toBeLessThan(0)
    expect(quietSlack(r1, { x: 1, y: 84 }, 7, ratio)).toBeLessThan(0)
  })

  it('round 1 has several free places, round 2 exactly one, and the best spot of round 2 is free', () => {
    expect(quietPlaces(r1, 7, ratio, 1.5)).toBeGreaterThanOrEqual(2)
    expect(quietPlaces(r2, 7, ratio, 1.5)).toBe(1)
    const best = quietBestSpot(r2, 7, ratio)!
    expect(best.slack).toBeGreaterThanOrEqual(3)
    expect(quietHeardBy(r2, best.p, 7, ratio)).toBe(-1)
    expect(quietBlockedAt(r2, best.p, 7, ratio)).toBe(false)
  })

  it('the checks find the faults of the data', () => {
    const g = clone(QUIET)
    g.rounds[1]!.soldiers[4]!.r = 4
    expect(quietSpotProblems(g).join(' ')).toContain('too small to see')
    const h = clone(QUIET)
    h.rounds[1]!.soldiers = [{ sprite: 1, x: 50, y: 50, r: 70 }]
    expect(quietSpotProblems(h).join(' ')).toContain('no free place')
    const k = clone(QUIET)
    k.rounds[1]!.start = { x: 24, y: 26 }
    expect(quietSpotProblems(k).join(' ')).toContain('starts inside a ring')
    const l = clone(QUIET)
    l.rounds[1]!.soldiers = [{ sprite: 1, x: 50, y: 50, r: 28 }]
    l.rounds[1]!.blocks = []
    expect(quietSpotProblems(l).join(' ')).toContain('exactly one free place')
    const m = clone(QUIET)
    m.rounds[0]!.showRings = 'near'
    expect(quietSpotProblems(m).join(' ')).toContain('always visible')
    const o = clone(QUIET)
    o.pairW = 10
    expect(quietSpotProblems(o).join(' ')).toContain('too small for a phone')
  })
})

describe('bretter: boards to the shore', () => {
  const r1 = PLANKS.rounds[0]!
  const r2 = PLANKS.rounds[1]!

  it('the sample data can be played', () => {
    expect(planksProblems(PLANKS)).toEqual([])
  })

  it('the nearest current among those of the round takes the board', () => {
    expect(planksPathAt(PLANKS, r1, 18)).toBe(0)
    expect(planksPathAt(PLANKS, r1, 34)).toBe(2) // the current at 32 is not painted in round 1: the nearest is 46
    expect(planksPathAt(PLANKS, r2, 34)).toBe(1)
    expect(planksPathAt(PLANKS, r2, 62)).toBe(3)
    expect(planksPathAt(PLANKS, r2, 86)).toBe(4)
    expect(planksPathAt(PLANKS, r1, 90)).toBe(3)
  })

  it('the checks find the faults of the data', () => {
    const g = clone(PLANKS)
    g.rounds[0]!.paths = [1, 2, 4]
    expect(planksProblems(g).join(' ')).toContain('no track leads to the shore')
    const h = clone(PLANKS)
    h.rounds[0]!.paths = [0, 3]
    expect(planksProblems(h).join(' ')).toContain('no track leads to the rocks')
    const k = clone(PLANKS)
    k.paths[1]!.start = 24
    expect(planksProblems(k).join(' ')).toContain('less than 6.5 percent apart')
    const l = clone(PLANKS)
    l.paths[0]!.points = [{ x: 20, y: 72 }]
    expect(planksProblems(l).join(' ')).toContain('fewer than two points')
    const m = clone(PLANKS)
    m.rounds[1]!.boards = ['brett-1', 'brett-2', 'brett-3']
    expect(planksProblems(m).join(' ')).toContain('round 2 should have more boards')
    const o = clone(PLANKS)
    o.rounds[0]!.boards = ['brett-1', 'nope', 'brett-3']
    expect(planksProblems(o).join(' ')).toContain('does not exist')
    const r = clone(PLANKS)
    r.paths[0]!.points[0] = { x: 20, y: 40 }
    expect(planksProblems(r).join(' ')).toContain('first point is not at the rail')
  })
})
