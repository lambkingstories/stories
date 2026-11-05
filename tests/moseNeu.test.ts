/**
 * The pure part of the new game of "Mose" (`utils/moseNeu.ts`): "Frogs back to the Nile" (`froesche`). The view of the water from a frog, the aim of a swipe,
 * where a frog lands, the words for the direction, the free places and the turns of the hops, the checker of the data, and the real data of stage 7 (empty list of problems,
 * round 2 harder than round 1, a perfect player can clear every frog, a swipe the wrong way exists from every place of round 2).
 */
import { existsSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  FROG_MIN_W,
  frogAimOk,
  frogAngle,
  frogDir,
  frogDistance,
  frogFlickProblems,
  frogGoal,
  frogHopper,
  frogInRiver,
  frogNextFree,
  frogNorm,
  frogSwipeToWater,
  frogTarget,
  frogView
} from '@/utils/moseNeu'
import type { FrogFlickGame, FrogRound } from '@/utils/moseNeu'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const RIVER_UP = { x: 20, y: 20, w: 60, h: 20 }
const RIVER_LEFT = { x: 0, y: 20, w: 40, h: 25 }

describe('Frösche: geometry', () => {
  it('angles are screen angles (0 right, 90 down) and the vertical part is shortened by the ratio', () => {
    expect(frogAngle({ x: 50, y: 50 }, { x: 80, y: 50 })).toBeCloseTo(0)
    expect(frogAngle({ x: 50, y: 50 }, { x: 50, y: 80 })).toBeCloseTo(90)
    expect(frogAngle({ x: 50, y: 50 }, { x: 20, y: 50 })).toBeCloseTo(180)
    expect(frogAngle({ x: 50, y: 50 }, { x: 50, y: 10 })).toBeCloseTo(-90)
    // 30 % of the width to the right and 22.5 % of the height (= 30 % of the width at 3:4) down: 45 degrees
    expect(frogAngle({ x: 50, y: 50 }, { x: 80, y: 72.5 }, 0.75)).toBeCloseTo(45)
    expect(frogDistance({ x: 0, y: 0 }, { x: 0, y: 75 }, 0.75)).toBeCloseTo(1)
    expect(frogNorm(190)).toBe(-170)
    expect(frogNorm(-180)).toBe(180)
  })

  it('the view of the water: its middle and how far it reaches to either side', () => {
    const v = frogView({ x: 50, y: 80 }, RIVER_UP)
    expect(v.mid).toBeCloseTo(-90)
    expect(v.lo).toBeLessThan(-20)
    expect(v.hi).toBeGreaterThan(20)
    expect(v.lo).toBeCloseTo(-v.hi)
  })

  it('a swipe counts when it points at the water (with some degrees to spare); any swipe counts with 180', () => {
    const frog = { x: 50, y: 80 }
    expect(frogAimOk(frog, RIVER_UP, 0, -60, 20)).toBe(true) // straight up
    expect(frogAimOk(frog, RIVER_UP, 20, -60, 20)).toBe(true) // a little to the right
    expect(frogAimOk(frog, RIVER_UP, 60, 0, 20)).toBe(false) // to the right
    expect(frogAimOk(frog, RIVER_UP, 0, 60, 20)).toBe(false) // down
    expect(frogAimOk(frog, RIVER_UP, 0, 60, 180)).toBe(true)
    expect(frogAimOk(frog, RIVER_UP, 0, 0, 20)).toBe(false)
    // the water on the left: a swipe to the left counts, up does not (with no degrees to spare)
    const f2 = { x: 75, y: 70 }
    expect(frogAimOk(f2, RIVER_LEFT, -60, -40, 0)).toBe(true)
    expect(frogAimOk(f2, RIVER_LEFT, 0, -60, 0)).toBe(false)
  })

  it('a flicked frog lands in the water, not on its edge', () => {
    for (const p of [{ x: 50, y: 80 }, { x: 5, y: 90 }, { x: 95, y: 60 }]) {
      const t = frogTarget(p, RIVER_UP)
      expect(frogInRiver(t, RIVER_UP)).toBe(true)
      expect(t.x).toBeGreaterThan(RIVER_UP.x)
      expect(t.y).toBeLessThan(RIVER_UP.y + RIVER_UP.h)
    }
    expect(frogInRiver({ x: 50, y: 50 }, RIVER_UP)).toBe(false)
  })

  it('the words for the direction', () => {
    expect(frogDir({ x: 50, y: 80 }, RIVER_UP)).toBe('up')
    expect(frogDir({ x: 75, y: 33 }, RIVER_LEFT)).toBe('left')
    expect(frogDir({ x: 90, y: 90 }, RIVER_LEFT)).toBe('upLeft')
    expect(frogDir({ x: 50, y: 5 }, RIVER_UP)).toBe('down')
    expect(frogDir({ x: 5, y: 30 }, { x: 60, y: 20, w: 30, h: 20 })).toBe('right')
  })

  it('the swipe of the keyboard and of "Help me" always points at the water', () => {
    for (const p of [{ x: 50, y: 80 }, { x: 10, y: 95 }, { x: 90, y: 55 }]) {
      const s = frogSwipeToWater(p, RIVER_UP)
      expect(frogAimOk(p, RIVER_UP, s.dx, s.dy, 0)).toBe(true)
    }
  })
})

describe('Frösche: hops', () => {
  it('the next free place goes round the list; -1 when all are taken', () => {
    expect(frogNextFree([true, false, true, false], 0)).toBe(1)
    expect(frogNextFree([true, false, true, false], 1)).toBe(3)
    expect(frogNextFree([false, true, true, true], 3)).toBe(0)
    expect(frogNextFree([true, true], 0)).toBe(-1)
  })

  it('the frogs hop in turn; frogs under the finger or marked are passed over', () => {
    expect([0, 1, 2, 3].map((k) => frogHopper([0, 2, 5], k))).toEqual([0, 2, 5, 0])
    expect(frogHopper([0, 2, 5], 0, [0])).toBe(2)
    expect(frogHopper([3], 4, [3])).toBeNull()
    expect(frogHopper([], 0)).toBeNull()
  })
})

const round = (over: Partial<FrogRound> = {}): FrogRound => ({
  hint: 'Hilf beim Aufräumen.',
  scene: 'haus',
  river: RIVER_UP,
  spots: [
    { x: 20, y: 70, w: 13 },
    { x: 50, y: 75, w: 13 },
    { x: 80, y: 70, w: 13 },
    { x: 35, y: 92, w: 13 }
  ],
  count: 3,
  aim: 180,
  ...over
})
const GAME: FrogFlickGame = { frogs: ['a', 'c'], jump: 'b', rounds: [round(), round({ count: 3, aim: 25, hop: 3.5 })] }

describe('Frösche: the checker of the data', () => {
  it('good data have no problems; the goal is every frog of both rounds', () => {
    expect(frogFlickProblems(GAME)).toEqual([])
    expect(frogGoal(GAME)).toBe(6)
  })

  it('finds the mistakes', () => {
    const bad = (r: Partial<FrogRound>, g: Partial<FrogFlickGame> = {}) => frogFlickProblems({ ...GAME, ...g, rounds: [round(r)] }).join(' | ')
    expect(bad({}, { frogs: [] })).toMatch(/sitting frogs/)
    expect(bad({}, { jump: '' })).toMatch(/jumping frog/)
    expect(frogFlickProblems({ ...GAME, rounds: [] })).toEqual(['no rounds'])
    expect(bad({ scene: '' })).toMatch(/no picture of the house/)
    expect(bad({ river: { x: 50, y: 20, w: 60, h: 20 } })).toMatch(/water lies outside/)
    expect(bad({ river: { x: 50, y: 20, w: 5, h: 5 } })).toMatch(/too small to aim/)
    expect(bad({ count: 0 })).toMatch(/at least one frog/)
    expect(bad({ count: 5 })).toMatch(/only 4 places/)
    expect(bad({ count: 4, hop: 3 })).toMatch(/no free place/)
    expect(bad({ hop: 1 })).toMatch(/hop too often/)
    expect(bad({ aim: 0 })).toMatch(/aim must be/)
    expect(bad({ spots: [{ x: 20, y: 70, w: FROG_MIN_W - 1 }] , count: 1 })).toMatch(/too small for a finger/)
    expect(bad({ spots: [{ x: 50, y: 30, w: 13 }], count: 1 })).toMatch(/lies in the water/)
    expect(bad({ spots: [{ x: 3, y: 70, w: 13 }], count: 1 })).toMatch(/sticks out/)
    expect(bad({ spots: [{ x: 20, y: 70, w: 13 }, { x: 25, y: 72, w: 13 }], count: 2 })).toMatch(/too close together/)
    // a frog right under a huge water: nearly every swipe counts
    expect(bad({ river: { x: 0, y: 0, w: 100, h: 60 }, spots: [{ x: 50, y: 64, w: 13 }], count: 1, aim: 70 })).toMatch(/almost every swipe/)
  })
})

describe('Frösche: the real data of stage 7', () => {
  it('the checker finds nothing; round 2 is harder (more frogs, they hop, the swipe must point at the water); every picture exists', async () => {
    const { mose } = await import('@/data/adventures/mose')
    const task = mose.stages[6]!.task as unknown as { kind: string; frogFlick?: FrogFlickGame }
    expect(task.kind).toBe('froesche')
    const g = task.frogFlick!
    expect(g).toBeDefined()
    expect(frogFlickProblems(g)).toEqual([])
    expect(g.rounds).toHaveLength(2)
    const [r1, r2] = g.rounds as [FrogRound, FrogRound]
    expect(r2.count).toBeGreaterThan(r1.count)
    expect(r1.hop).toBeUndefined()
    expect(r2.hop).toBeGreaterThan(0)
    expect(r1.aim).toBe(180)
    expect(r2.aim).toBeLessThan(45)
    for (const f of [...g.frogs, g.jump, ...g.rounds.map((r) => r.scene)]) expect(existsSync(`public/${f}`), f).toBe(true)
    for (const f of [...g.frogs, g.jump, ...g.rounds.map((r) => r.scene)]) expect(f).toMatch(/^images\/abenteuer\/spiele\/mose\/froesche\//)
    // round 2: from every place there is a right way (the swipe straight at the water) and a wrong way (straight away from it)
    for (const s of r2.spots) {
      const right = frogSwipeToWater(s, r2.river, 360, r2.ratio)
      expect(frogAimOk(s, r2.river, right.dx, right.dy, r2.aim, r2.ratio)).toBe(true)
      expect(frogAimOk(s, r2.river, -right.dx, -right.dy, r2.aim, r2.ratio)).toBe(false)
    }
    // the goal for "Go on" is every frog
    expect(frogGoal(g)).toBe(r1.count + r2.count)
  })
})
