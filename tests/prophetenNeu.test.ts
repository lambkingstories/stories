/**
 * The pure parts of the three new games of "Der König kommt" (`utils/prophetenNeu.ts`): the name lanterns (where a lantern is, what a tap means, the lane of the keys,
 * the check of the data), the shoot (growing, turning, touching and sliding round a stone, the light, the help, the check of the data) and the ways to Zion
 * (open edges, the way from Zion, the fewest taps, the help, the mistakes, the check of the data). The real data are checked as well.
 */
import { describe, expect, it } from 'vitest'
import { propheten } from '@/data/adventures/propheten'
import {
  LANTERN_FROM,
  LANTERN_TO,
  SHOOT_MAX,
  lanternInLane,
  lanternPose,
  lanternPoses,
  lanternTry,
  lanternWanted,
  lanternsProblems,
  prophetenStars,
  shootAim,
  shootAuto,
  shootGrowProblems,
  shootSimulate,
  shootStart,
  shootStep,
  shootUnits,
  zionBest,
  zionCost,
  zionHint,
  zionMistakes,
  zionMove,
  zionOpen,
  zionPathsProblems,
  zionPeopleReached,
  zionReached,
  zionSolved,
  zionTurns
} from '@/utils/prophetenNeu'
import type { LanternGame, ShootGame, ZionGame, ZionRound } from '@/utils/prophetenNeu'

const task = (n: number) => propheten.stages[n - 1]!.task as unknown as { lanterns: LanternGame; shootGrow: ShootGame; zionPaths: ZionGame }
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

describe('stars', () => {
  it('up to two mistakes three stars, up to four two, then one', () => {
    expect([0, 2, 3, 4, 5, 9].map(prophetenStars)).toEqual([3, 3, 2, 2, 1, 1])
  })
})

describe('the name lanterns (laternen)', () => {
  const game = task(2).lanterns
  const r1 = game.rounds[0]!
  const r2 = game.rounds[1]!

  it('a lantern starts below the sky, rises in a straight lane (with a little sway) and leaves at the top; it comes again in the next loop with a new key', () => {
    const l = r1.lanterns[0]!
    expect(lanternPose(game, r1, 0, l.at - 1)).toBeNull()
    const a = lanternPose(game, r1, 0, l.at)!
    expect(a.y).toBeCloseTo(LANTERN_FROM, 5)
    const half = lanternPose(game, r1, 0, l.at + r1.rise / 2)!
    expect(half.y).toBeCloseTo((LANTERN_FROM + LANTERN_TO) / 2, 5)
    expect(Math.abs(half.x - game.lanes[l.lane]!)).toBeLessThanOrEqual(r1.sway + 1e-9)
    expect(lanternPose(game, r1, 0, l.at + r1.rise + 1)).toBeNull()
    const again = lanternPose(game, r1, 0, l.at + r1.loop + 10)!
    expect(again.key).not.toBe(a.key)
    expect(again.key).toBe('0:1')
  })

  it('the lanterns in the sky leave out the used ones and the names already caught', () => {
    const t = r1.rise / 2
    const all = lanternPoses(game, r1, t, new Set(), [])
    expect(all.length).toBeGreaterThan(1)
    const first = all[0]!
    expect(lanternPoses(game, r1, t, new Set([first.key]), []).some((p) => p.key === first.key)).toBe(false)
    const named = all.find((p) => p.name >= 0)!
    expect(lanternPoses(game, r1, t, new Set(), [named.name]).some((p) => p.name === named.name)).toBe(false)
  })

  it('a tap: a name is caught, no name is a mistake, in round 2 only the next name counts', () => {
    expect(lanternTry(game, r1, [], -1)).toBe('blank')
    expect(lanternTry(game, r1, [], 3)).toBe('caught')
    expect(lanternWanted(game, r1, [3])).toEqual([0, 1, 2, 4])
    expect(lanternTry(game, r2, [], 3)).toBe('order')
    expect(lanternTry(game, r2, [], 0)).toBe('caught')
    expect(lanternWanted(game, r2, [0, 1])).toEqual([2])
  })

  it('the key Enter catches the catchable lantern of the lane nearest the middle', () => {
    const t = 4000
    const poses = lanternPoses(game, r1, t, new Set(), [])
    for (let lane = 0; lane < game.lanes.length; lane++) {
      const p = lanternInLane(game, r1, poses, lane)
      const inLane = poses.filter((q) => r1.lanterns[q.i]!.lane === lane && q.y >= 2 && q.y <= 98)
      if (!inLane.length) expect(p).toBeNull()
      else expect(Math.abs(p!.y - 50)).toBe(Math.min(...inLane.map((q) => Math.abs(q.y - 50))))
    }
  })

  it('the check of the data: the real game is fine; a missing name, overlapping lanterns, too small lanterns and an easy round 2 are found', () => {
    expect(lanternsProblems(game)).toEqual([])
    const g = clone(game)
    g.rounds[0]!.lanterns = g.rounds[0]!.lanterns.filter((l) => l.name !== 2)
    expect(lanternsProblems(g).join(' ')).toMatch(/"Held" is on 0 lanterns/)
    const o = clone(game)
    o.rounds[0]!.lanterns.push({ name: -1, lane: o.rounds[0]!.lanterns[0]!.lane, at: o.rounds[0]!.lanterns[0]!.at + 100, design: 0 })
    expect(lanternsProblems(o).join(' ')).toMatch(/overlap/)
    const s = clone(game)
    s.w = 10
    expect(lanternsProblems(s).join(' ')).toMatch(/smaller than 13/)
    const e = clone(game)
    e.rounds[1] = clone(e.rounds[0]!)
    expect(lanternsProblems(e)).toContain('round 2 is not harder than round 1')
  })
})

describe('the shoot (spross)', () => {
  const game = task(4).shootGrow
  const free: ShootGame = { ...clone(game), rounds: [{ hint: '', stones: [{ x: 15, y: 30, r: 7, image: 0 }], route: [] }, { hint: '', stones: [{ x: 50, y: 50, r: 8, image: 0 }], route: [{ x: 75, y: 50 }] }] }

  it('the shoot starts on the stump and grows straight up to the light when nothing is in the way', () => {
    const st = shootStart(free)
    expect(st.tip).toEqual(shootUnits(free.start))
    let event: string | null = null
    for (let i = 0; i < 1000 && !st.done; i++) event = shootStep(free, free.rounds[0]!, st, 0, 1 / 30) ?? event
    expect(st.done).toBe(true)
    expect(event).toBe('done')
    expect(st.hit).toEqual([])
    expect(st.trail.length).toBeGreaterThan(10)
  })

  it('steering turns the tip, but never further than the limit; the tip never grows downward', () => {
    const st = shootStart(free)
    for (let i = 0; i < 60; i++) shootStep(free, free.rounds[0]!, st, 1, 1 / 30)
    expect(st.heading).toBe(SHOOT_MAX)
    let y = st.tip.y
    for (let i = 0; i < 60; i++) {
      shootStep(free, free.rounds[0]!, st, -1, 1 / 30)
      expect(st.tip.y).toBeLessThanOrEqual(y + 1e-9)
      y = st.tip.y
    }
    expect(st.heading).toBe(-SHOOT_MAX)
  })

  it('aiming at a point turns toward it', () => {
    const st = shootStart(free)
    expect(shootAim(st, { x: st.tip.x + 30, y: st.tip.y - 10 }, 1 / 30)).toBeGreaterThan(0)
    expect(shootAim(st, { x: st.tip.x - 30, y: st.tip.y - 10 }, 1 / 30)).toBeLessThan(0)
    expect(shootAim(st, { x: st.tip.x, y: st.tip.y - 30 }, 1 / 30)).toBe(0)
  })

  it('a stone straight above: the first touch is one mistake, then the tip waits; leaning to a side, it slides round the stone (no second mistake) and reaches the light', () => {
    const r = free.rounds[1]!
    const st = shootStart(free)
    const events: string[] = []
    for (let i = 0; i < 400 && st.touching < 0; i++) {
      const e = shootStep(free, r, st, 0, 1 / 30)
      if (e) events.push(e)
    }
    expect(events).toEqual(['hit'])
    expect(st.hit).toEqual([0])
    const y = st.tip.y
    for (let i = 0; i < 20; i++) shootStep(free, r, st, 0, 1 / 30)
    expect(st.tip.y).toBeCloseTo(y, 5)
    for (let i = 0; i < 600 && !st.done; i++) {
      const e = shootStep(free, r, st, st.heading < 50 && st.touching >= 0 ? 1 : shootAuto(free, r, st, 1 / 30), 1 / 30)
      if (e) events.push(e)
    }
    expect(st.done).toBe(true)
    expect(events).toEqual(['hit', 'done'])
  })

  it('the help follows the route of every real round to the light without touching a stone, and straight up always touches one', () => {
    for (const r of game.rounds) {
      const auto = shootSimulate(game, r, 'auto')
      expect(auto.done).toBe(true)
      expect(auto.hits).toBe(0)
      expect(shootSimulate(game, r, 'straight').hits).toBeGreaterThan(0)
    }
  })

  it('the check of the data: the real game is fine; a stone on the stump, a stone on the way of the help and an easy round 2 are found', () => {
    expect(shootGrowProblems(game)).toEqual([])
    const a = clone(game)
    a.rounds[0]!.stones.push({ x: a.start.x, y: a.start.y - 4, r: 8, image: 0 })
    expect(shootGrowProblems(a).join(' ')).toMatch(/too near the stump/)
    const b = clone(game)
    const w = b.rounds[0]!.route[0]!
    b.rounds[0]!.stones.push({ x: w.x, y: w.y, r: 7, image: 0 })
    expect(shootGrowProblems(b).join(' ')).toMatch(/help (touches|does not reach)/)
    const c = clone(game)
    c.rounds[1] = clone(c.rounds[0]!)
    expect(shootGrowProblems(c)).toContain('round 2 is not harder than round 1 (not more stones)')
  })
})

describe('ways to Zion (zionwege)', () => {
  const game = task(9).zionPaths
  const r1 = game.rounds[0]!

  it('the open edges follow the turn; Zion is always open at the bottom; a field has none', () => {
    const rows = ['.Z', 'LI']
    expect(zionOpen(rows, [[0, 0], [0, 0]], 1, 0)).toEqual([0, 1])
    expect(zionOpen(rows, [[0, 0], [1, 0]], 1, 0)).toEqual([1, 2])
    expect(zionOpen(rows, [[0, 3], [0, 0]], 0, 1)).toEqual([2])
    expect(zionOpen(rows, [[0, 0], [0, 0]], 0, 0)).toEqual([])
    expect(zionReached(rows, [[0, 0], [0, 0]])[1]![1]).toBe(true)
    expect(zionReached(rows, [[0, 0], [0, 1]])[1]![1]).toBe(false)
  })

  it('a straight tile is the same after half a turn (fewest taps)', () => {
    expect(zionCost('I', 0, 2)).toBe(0)
    expect(zionCost('I', 1, 0)).toBe(1)
    expect(zionCost('L', 1, 0)).toBe(3)
    expect(zionCost('E', 3, 1)).toBe(2)
  })

  it('the real rounds: nobody has a way at the start, the solution brings everybody, and the fewest taps are `par`', () => {
    for (const r of game.rounds) {
      expect(zionPeopleReached(r, zionTurns(r.start))).toBe(0)
      expect(zionSolved(r, zionTurns(r.solution))).toBe(true)
      expect(zionBest(r, zionTurns(r.start))!.taps).toBe(r.par)
    }
  })

  it('the help: following it tile by tile solves every round in exactly `par` taps', () => {
    for (const r of game.rounds) {
      const turns = zionTurns(r.start)
      let n = 0
      for (let h = zionHint(r, turns); h && n < 100; h = zionHint(r, turns)) {
        turns[h.r]![h.c] = (turns[h.r]![h.c]! + 1) % 4
        n++
      }
      expect(zionSolved(r, turns)).toBe(true)
      expect(n).toBe(r.par)
    }
  })

  it('every four taps over the fewest are one mistake; the arrow keys stay inside the map', () => {
    expect([12, 15, 16, 19, 20].map((t) => zionMistakes(t, 12))).toEqual([0, 0, 1, 1, 2])
    expect(zionMove(r1.rows, { r: 0, c: 0 }, 0)).toEqual({ r: 0, c: 0 })
    expect(zionMove(r1.rows, { r: 0, c: 0 }, 1)).toEqual({ r: 0, c: 1 })
    expect(zionMove(r1.rows, { r: 3, c: 3 }, 2)).toEqual({ r: 3, c: 3 })
  })

  it('the check of the data: the real game is fine; a wrong par, a start that is solved, two Zions and a person on a field are found', () => {
    expect(zionPathsProblems(game)).toEqual([])
    const a = clone(game)
    a.rounds[0]!.par = 9
    expect(zionPathsProblems(a).join(' ')).toMatch(/fewest taps are 12, not 9/)
    const b = clone(game)
    b.rounds[0]!.start = [...b.rounds[0]!.solution]
    expect(zionPathsProblems(b).join(' ')).toMatch(/at the start already/)
    const c = clone(game)
    c.rounds[0]!.rows = ['ZZ..', ...c.rounds[0]!.rows.slice(1)]
    expect(zionPathsProblems(c).join(' ')).toMatch(/exactly one Mount Zion/)
    const d = clone(game)
    const r = d.rounds[0]! as ZionRound
    r.people[0] = { r: 0, c: 0, image: 0 }
    expect(zionPathsProblems(d).join(' ')).toMatch(/does not stand on a path tile/)
  })
})
