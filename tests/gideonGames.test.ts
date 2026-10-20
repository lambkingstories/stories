/**
 * The pure functions of the new games of "Gideon" (`utils/gideonGames.ts`): the sacks in the cave, the wind and the chaff, the letters, the sky and the dew, the switch, the cones of light
 * and the answer to the signal.
 */
import { describe, expect, it } from 'vitest'
import {
  blow,
  blownAway,
  coneAngle,
  cuePhase,
  deadlock,
  effectiveWind,
  inBox,
  isSolved,
  lit,
  makePieces,
  moveMan,
  nearestPart,
  nextShadow,
  pushesOf,
  route,
  sacksHome,
  skyColour,
  solution,
  stopParts,
  tilesFor,
  waitTime,
  wayLength,
  wayPoint,
  type CaveShape,
  type CaveState
} from '@/utils/gideonGames'

describe('sacks in the cave', () => {
  // 5 x 3, a rock in the middle, one niche at the right edge
  const level: CaveShape = { cols: 5, rows: 3, walls: [[2, 0]], niches: [[4, 1]] }
  const start: CaveState = { man: [0, 1], sacks: [[2, 1]] }

  it('the man walks on free floor, not into rock and not out of the cave', () => {
    expect(moveMan(level, start, 'down').state.man).toEqual([0, 2])
    expect(moveMan(level, start, 'up').moved).toBe(true)
    expect(moveMan(level, start, 'left')).toMatchObject({ moved: false, blocked: 'wall' })
    const atRock: CaveState = { man: [1, 0], sacks: [] }
    expect(moveMan(level, atRock, 'right')).toMatchObject({ moved: false, blocked: 'wall' })
  })

  it('a sack is pushed on, one cell, and the man follows; it is never pulled', () => {
    const r = moveMan(level, { man: [1, 1], sacks: [[2, 1]] }, 'right')
    expect(r).toMatchObject({ moved: true, pushed: true })
    expect(r.state).toEqual({ man: [2, 1], sacks: [[3, 1]] })
    const back = moveMan(level, r.state, 'left')
    expect(back.pushed).toBe(false)
    expect(back.state.sacks).toEqual([[3, 1]])
  })

  it('a sack does not go through rock, nor out of the cave, nor into a second sack: nothing moves', () => {
    expect(moveMan(level, { man: [1, 1], sacks: [[2, 1]] }, 'right').moved).toBe(true)
    const rock = moveMan(level, { man: [2, 2], sacks: [[2, 1]] }, 'up')
    expect(rock).toMatchObject({ moved: false, blocked: 'wall' })
    expect(rock.state).toEqual({ man: [2, 2], sacks: [[2, 1]] })
    const edge = moveMan(level, { man: [3, 1], sacks: [[4, 1]] }, 'right')
    expect(edge).toMatchObject({ moved: false, blocked: 'wall' })
    const two = moveMan(level, { man: [0, 1], sacks: [[1, 1], [2, 1]] }, 'right')
    expect(two).toMatchObject({ moved: false, blocked: 'sack' })
    expect(two.state.sacks).toEqual([[1, 1], [2, 1]])
  })

  it('solved when every sack stands in a niche; the number of sacks at home is counted', () => {
    expect(sacksHome(level, start)).toBe(0)
    const done: CaveState = { man: [3, 1], sacks: [[4, 1]] }
    expect(sacksHome(level, done)).toBe(1)
    expect(isSolved(level, done)).toBe(true)
    expect(isSolved(level, start)).toBe(false)
    expect(isSolved(level, { man: [0, 0], sacks: [] })).toBe(false)
  })

  it('finds the shortest way and knows when there is none', () => {
    const way = solution(level, start)!
    expect(way.length).toBeGreaterThan(2)
    let s = start
    for (const d of way) s = moveMan(level, s, d).state
    expect(isSolved(level, s)).toBe(true)
    expect(pushesOf(level, start)).toBe(2)
    expect(solution(level, { man: [3, 1], sacks: [[4, 1]] })).toEqual([])
    // a sack in the corner can never come to the niche at the other edge
    const stuck: CaveState = { man: [0, 1], sacks: [[0, 2]] }
    expect(solution(level, stuck)).toBeNull()
  })

  it('a sack in a corner (outside a niche) is a dead end; in a niche or in the open it is not', () => {
    expect(deadlock(level, { man: [0, 1], sacks: [[0, 2]] })).toBe(true)
    expect(deadlock(level, { man: [0, 1], sacks: [[1, 1]] })).toBe(false)
    expect(deadlock({ ...level, niches: [[0, 2]] }, { man: [0, 1], sacks: [[0, 2]] })).toBe(false)
    // against rock and the edge at the same time
    expect(deadlock(level, { man: [0, 1], sacks: [[3, 0]] })).toBe(true)
  })

  it('the two puzzles of the game can be solved and are not trivial (more than a few pushes)', () => {
    const r1: CaveShape & { sacks: [number, number][]; man: [number, number] } = { cols: 5, rows: 4, walls: [[4, 3], [1, 0]], niches: [[3, 0], [0, 0]], sacks: [[2, 2], [3, 2]], man: [2, 3] }
    const r2: CaveShape & { sacks: [number, number][]; man: [number, number] } = { cols: 6, rows: 5, walls: [[3, 2], [3, 0], [4, 2]], niches: [[0, 0], [5, 2], [5, 4]], sacks: [[0, 3], [2, 1], [3, 1]], man: [0, 4] }
    expect(pushesOf(r1, { man: r1.man, sacks: r1.sacks })).toBe(6)
    expect(pushesOf(r2, { man: r2.man, sacks: r2.sacks })).toBe(12)
  })
})

describe('wind and chaff', () => {
  const setup = { chaff: 10, grains: 8, window: [35, 75] as [number, number], gust: 0, seed: 4 }

  it('the pieces are always the same for the same seed; chaff thresholds lie in the window, grain thresholds above it', () => {
    const a = makePieces(setup)
    expect(makePieces(setup)).toEqual(a)
    expect(makePieces({ ...setup, seed: 5 })).not.toEqual(a)
    expect(a).toHaveLength(18)
    for (const p of a.filter((x) => x.kind === 'chaff')) {
      expect(p.threshold).toBeGreaterThanOrEqual(35)
      expect(p.threshold).toBeLessThanOrEqual(75)
    }
    for (const p of a.filter((x) => x.kind === 'grain')) {
      expect(p.threshold).toBeGreaterThan(75)
      expect(p.threshold).toBeLessThanOrEqual(100)
    }
  })

  it('at a wind inside the window never a grain flies, at the top of the window all the chaff is gone, at 100 % at least one grain is lost', () => {
    for (const s of [setup, { chaff: 12, grains: 8, window: [45, 62] as [number, number], gust: 5, seed: 9 }]) {
      const pieces = makePieces(s)
      const top = s.window[1]
      const at = blow(pieces, top + s.gust)
      expect(at.grains, `grains at ${top + s.gust}`).toEqual([])
      expect(blow(pieces, top).chaff).toHaveLength(s.chaff)
      expect(blow(pieces, 100).grains.length).toBeGreaterThanOrEqual(1)
      expect(blow(pieces, 0).chaff).toEqual([])
    }
  })

  it('a piece flies from its threshold on', () => {
    expect(blownAway({ id: 'x', kind: 'chaff', threshold: 50 }, 50)).toBe(true)
    expect(blownAway({ id: 'x', kind: 'chaff', threshold: 50 }, 49.9)).toBe(false)
  })

  it('the gust swings the wind a little, always the same way for the same seed and time, and stays between 0 and 100', () => {
    expect(effectiveWind(50, 0, 3, 7)).toBe(50)
    for (let t = 0; t < 40; t++) {
      const w = effectiveWind(50, 5, 3, t)
      expect(w).toBeGreaterThanOrEqual(45)
      expect(w).toBeLessThanOrEqual(55)
      expect(effectiveWind(50, 5, 3, t)).toBe(w)
    }
    expect(new Set(Array.from({ length: 20 }, (_, t) => effectiveWind(50, 5, 3, t))).size).toBeGreaterThan(5)
    expect(effectiveWind(99, 5, 3, 1)).toBeLessThanOrEqual(100)
    expect(effectiveWind(1, 5, 3, 1)).toBeGreaterThanOrEqual(0)
  })
})

describe('letters', () => {
  it('the tiles have every letter of the word and the extra ones, in a mixed order that is the same every time and is not the word', () => {
    const tiles = tilesFor('FRIEDE', ['T', 'L'])
    expect(tiles).toHaveLength(8)
    expect([...tiles].sort()).toEqual(['D', 'E', 'E', 'F', 'I', 'L', 'R', 'T'])
    expect(tilesFor('FRIEDE', ['T', 'L'])).toEqual(tiles)
    expect(tiles.slice(0, 6).join('')).not.toBe('FRIEDE')
    expect(tilesFor('FELSEN', ['A', 'M'])).toHaveLength(8)
  })
})

describe('sky and dew', () => {
  it('the sky goes from dark blue through rose to light', () => {
    expect(skyColour(0)).toBe('rgb(22, 32, 72)')
    expect(skyColour(1)).toBe('rgb(196, 226, 246)')
    const dark = skyColour(0).match(/\d+/g)!.map(Number)
    const light = skyColour(1).match(/\d+/g)!.map(Number)
    expect(light[0]! + light[1]! + light[2]!).toBeGreaterThan(dark[0]! + dark[1]! + dark[2]!)
    expect(skyColour(-3)).toBe(skyColour(0))
    expect(skyColour(9)).toBe(skyColour(1))
    expect(skyColour(0.8)).toBe('rgb(214, 130, 130)')
  })

  it('a point lies in a box or outside', () => {
    const box = { x: 30, y: 40, w: 40, h: 30 }
    expect(inBox({ x: 50, y: 50 }, box)).toBe(true)
    expect(inBox({ x: 29, y: 50 }, box)).toBe(false)
    expect(inBox({ x: 50, y: 71 }, box)).toBe(false)
  })
})

describe('switch', () => {
  it('the man who wants to go home goes to the right, the man who stays goes to the left', () => {
    expect(route('home', 'right')).toBe(true)
    expect(route('home', 'left')).toBe(false)
    expect(route('stay', 'left')).toBe(true)
    expect(route('stay', 'right')).toBe(false)
  })
})

describe('cones of light', () => {
  const cone = { x: 20, y: 30, from: 0, to: 60, periodMs: 4000, reach: 40 }

  it('the cone swings to and fro and rests a moment at both ends', () => {
    expect(coneAngle(cone, 0)).toBe(0)
    expect(coneAngle(cone, 200)).toBe(0)
    expect(coneAngle(cone, 2000)).toBe(60)
    expect(coneAngle(cone, 1800)).toBe(60)
    expect(coneAngle(cone, 1000)).toBeCloseTo(30, 6)
    expect(coneAngle(cone, 3000)).toBeCloseTo(30, 6)
    expect(coneAngle(cone, 4000)).toBe(0)
  })

  it('a point is lit when it is near enough and in the direction of the cone; the height counts three quarters', () => {
    // at the time 0 the cone points to the right
    expect(lit(cone, 0, { x: 40, y: 30 })).toBe(true)
    expect(lit(cone, 0, { x: 40, y: 45 })).toBe(false)
    expect(lit(cone, 0, { x: 70, y: 30 })).toBe(false)
    expect(lit(cone, 0, { x: 10, y: 30 })).toBe(false)
    // at the other end it points down to the right (60 degrees)
    const p = { x: 20 + 20 * Math.cos(Math.PI / 3), y: 30 + (20 * Math.sin(Math.PI / 3)) / 0.75 }
    expect(lit(cone, 2000, p)).toBe(true)
    expect(lit(cone, 0, p)).toBe(false)
  })

  it('a way has a length, a point at every part of it, and the nearest part to a point', () => {
    const path: [number, number][] = [[0, 0], [40, 0], [40, 40]]
    expect(wayLength(path)).toBeCloseTo(40 + 40 * 0.75, 6)
    expect(wayPoint(path, 0)).toEqual({ x: 0, y: 0 })
    expect(wayPoint(path, 1)).toEqual({ x: 40, y: 40 })
    const mid = wayPoint(path, 40 / (40 + 30))
    expect(mid.x).toBeCloseTo(40, 6)
    expect(mid.y).toBeCloseTo(0, 6)
    expect(nearestPart(path, { x: 38, y: 20 })).toBeGreaterThan(0.7)
    expect(nearestPart(path, { x: 3, y: 2 })).toBeLessThan(0.1)
  })

  it('the places in the shadow come in order along the way; the next one after a part', () => {
    const path: [number, number][] = [[0, 0], [100, 0]]
    const parts = stopParts(path, [[60, 0], [20, 0], [100, 0]])
    expect(parts).toEqual([0.2, 0.6, 1])
    expect(nextShadow(parts, 0)).toBe(0.2)
    expect(nextShadow(parts, 0.2)).toBe(0.6)
    expect(nextShadow(parts, 1)).toBeNull()
  })
})

describe('signal', () => {
  const groups = ['links', 'rechts']
  const wait = { step: 'wait' as const, done: [] as string[] }

  it('every tap while waiting is too early; the horn ends the waiting', () => {
    expect(cuePhase(wait, { type: 'tap', target: 'leader' }, groups)).toEqual({ state: wait, result: 'early' })
    const horn = cuePhase(wait, { type: 'horn' }, groups)
    expect(horn.result).toBe('horn')
    expect(horn.state.step).toBe('horn')
    expect(cuePhase(horn.state, { type: 'horn' }, groups).result).toBe('ignored')
  })

  it('after the horn Gideon first, then the groups in any order; the last one closes the ring', () => {
    let s = cuePhase(wait, { type: 'horn' }, groups).state
    expect(cuePhase(s, { type: 'tap', target: 'rechts' }, groups).result).toBe('order')
    let r = cuePhase(s, { type: 'tap', target: 'leader' }, groups)
    expect(r.result).toBe('ok')
    s = r.state
    r = cuePhase(s, { type: 'tap', target: 'rechts' }, groups)
    expect(r.result).toBe('ok')
    expect(cuePhase(r.state, { type: 'tap', target: 'rechts' }, groups).result).toBe('ignored')
    r = cuePhase(r.state, { type: 'tap', target: 'links' }, groups)
    expect(r.result).toBe('ring')
    expect(r.state.step).toBe('ring')
    expect(cuePhase(r.state, { type: 'tap', target: 'leader' }, groups).result).toBe('ignored')
  })

  it('the wait is within the range and always the same for the same seed and number', () => {
    for (let n = 0; n < 30; n++) {
      const t = waitTime(5, n, [2000, 5000])
      expect(t).toBeGreaterThanOrEqual(2000)
      expect(t).toBeLessThanOrEqual(5000)
      expect(waitTime(5, n, [2000, 5000])).toBe(t)
    }
    expect(new Set(Array.from({ length: 10 }, (_, n) => waitTime(5, n, [2000, 5000]))).size).toBeGreaterThan(5)
  })
})
