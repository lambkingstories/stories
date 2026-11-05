/**
 * The pure parts of the three new games of "Elisa und Naaman" (Anton's plan of 5.11.2026, `utils/elisaNeu.ts`): the hand mill (turning, pace, empty hole, pouring),
 * the seal (angles, fitting, the way to turn) and the earth for Naaman (loading, too heavy, taking down, dead ends, help). The checkers find no problem in the real data
 * and find the problems of broken data.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  MILL_DRY_DEG,
  earthDone,
  earthHasDeadEnd,
  earthHint,
  earthHintTop,
  earthLoadProblems,
  earthLoads,
  earthPut,
  earthSlot,
  earthSolve,
  earthStuck,
  earthTake,
  earthTarget,
  earthTop,
  handMillProblems,
  millAdvance,
  millDone,
  millGrab,
  millHint,
  millPace,
  millRefill,
  millShare,
  millStart,
  millStep,
  millTurn,
  norm360,
  sealDrag,
  sealFits,
  sealNudge,
  sealOff,
  sealTurnProblems,
  sealWay,
  wrap180
} from '@/utils/elisaNeu'
import type { EarthRound, EarthWhere, MillRound, SealSpot } from '@/utils/elisaNeu'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const { elisa } = await import('@/data/adventures/elisa')
const stage = (n: number) => elisa.stages[n - 1]!.task as unknown as Record<string, unknown>

describe('angles', () => {
  it('wrap and norm', () => {
    expect(wrap180(190)).toBe(-170)
    expect(wrap180(-190)).toBe(170)
    expect(wrap180(180)).toBe(180)
    expect(norm360(-10)).toBe(350)
    expect(norm360(725)).toBe(5)
  })
})

describe('the hand mill', () => {
  const easy: MillRound = { hint: 'x', turns: 4, hopper: 0, maxSpeed: 0 }
  const hard: MillRound = { hint: 'x', turns: 6, hopper: 1.5, maxSpeed: 1.6 }

  it('a round with enough grain: every degree grinds, either way, until the bowl is full', () => {
    let s = millStart(easy)
    expect(s.grain).toBe(Infinity)
    let r = millAdvance(s, easy, 90, 0)
    expect(r.event).toBe('flour')
    expect(r.state.ground).toBe(90)
    r = millAdvance(r.state, easy, -90, 5000)
    expect(r.state.ground).toBe(180)
    expect(r.state.rot).toBe(0)
    s = r.state
    for (let t = 10000; !millDone(s, easy); t += 1000) s = millAdvance(s, easy, 90, t).state
    expect(s.ground).toBe(4 * 360)
    expect(millShare(s, easy)).toBe(1)
    expect(millAdvance(s, easy, 90, 99999).event).toBe('full')
  })

  it('the finger: grab, then every move turns by the change of the angle (across the -180/180 line too)', () => {
    let s = millGrab(millStart(easy), 170)
    let r = millTurn(s, easy, -170, 0)
    expect(r.state.ground).toBeCloseTo(20)
    s = r.state
    r = millTurn(s, easy, -150, 1000)
    expect(r.state.ground).toBeCloseTo(40)
    // no finger yet: the first move only sets the place
    r = millTurn(millStart(easy), easy, 30, 0)
    expect(r.event).toBe('none')
    expect(r.state.last).toBe(30)
  })

  it('the grain in the hole runs out; turning on is dry; pouring fills it; half full is still enough', () => {
    let s = millStart(hard)
    expect(s.grain).toBe(1.5 * 360)
    let t = 0
    for (let k = 0; k < 6; k++) s = millAdvance(s, hard, 90, (t += 1000)).state
    expect(s.grain).toBe(0)
    expect(s.ground).toBe(540)
    const dry = millAdvance(s, hard, 90, (t += 1000))
    expect(dry.event).toBe('empty')
    expect(dry.state.ground).toBe(540)
    expect(dry.state.dry).toBe(90)
    expect(millAdvance(dry.state, hard, 45, (t += 1000)).state.dry).toBeGreaterThanOrEqual(MILL_DRY_DEG)
    expect(millHint(dry.state, hard, t)).toBe('refill')
    const full = millRefill(dry.state, hard)
    expect(full.kind).toBe('poured')
    expect(full.state.grain).toBe(540)
    expect(full.state.dry).toBe(0)
    expect(millRefill(full.state, hard).kind).toBe('enough')
    expect(millRefill(millStart(easy), easy).kind).toBe('enough')
  })

  it('too fast: nothing is ground and the grain jumps out; slow again grinds again', () => {
    let s = millStart(hard)
    // 5 moves of 60 degrees in 400 ms: 300 degrees in half a second = 1.67 turns a second
    let ev = ''
    for (let k = 0; k < 5; k++) {
      const r = millAdvance(s, hard, 60, k * 100)
      s = r.state
      ev = r.event
    }
    expect(millPace(s, 400)).toBeGreaterThan(1.6)
    expect(ev).toBe('fast')
    expect(s.ground).toBeLessThan(300)
    expect(s.grain).toBeLessThan(540 - s.ground + 1)
    expect(millHint(s, hard, 400)).toBe('slow')
    const calm = millAdvance(s, hard, 30, 3000)
    expect(calm.event).toBe('flour')
  })

  it('the button: a step of 45 degrees, four taps a second are never too fast', () => {
    let s = millStart(hard)
    for (let k = 0; k < 8; k++) {
      const r = millStep(s, hard, k * 250)
      expect(r.event).toBe('flour')
      s = r.state
    }
    expect(s.ground).toBe(360)
  })

  it('the real data of stage 5 have no problems; round 2 asks for pouring and a calm pace', () => {
    const g = stage(5).handMill as Parameters<typeof handMillProblems>[0]
    expect(stage(5).kind).toBe('handmuehle')
    expect(handMillProblems(g)).toEqual([])
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[1]!.hopper).toBeGreaterThan(0)
    expect(g.rounds[1]!.maxSpeed).toBeGreaterThan(0)
  })

  it('the checker finds broken data', () => {
    const g = stage(5).handMill as Parameters<typeof handMillProblems>[0]
    const bad = { ...g, upperW: 20, sackAt: { x: 50, y: 50, w: 10 }, rounds: [{ hint: '', turns: 2, hopper: 0.5, maxSpeed: 0.5 }] }
    const p = handMillProblems(bad).join(' | ')
    expect(p).toMatch(/runner stone/)
    expect(p).toMatch(/sack lies on the mill/)
    expect(p).toMatch(/fewer than two rounds/)
    expect(p).toMatch(/no hint/)
    expect(p).toMatch(/turns/)
  })
})

describe('the seal', () => {
  const spot: SealSpot = { x: 50, y: 50, angle: 350, start: 120 }

  it('off, fits, drag, nudge and the way to turn', () => {
    expect(sealOff(5, 350)).toBe(15)
    expect(sealFits(2, spot, 14)).toBe(true)
    expect(sealFits(10, spot, 14)).toBe(false)
    expect(sealDrag(355, 170, -170)).toBe(15)
    expect(sealNudge(358, 1)).toBe(3)
    expect(sealNudge(2, -1)).toBe(357)
    expect(sealWay(120, spot, 7)).toBe(-1)
    expect(sealWay(300, spot, 7)).toBe(1)
    expect(sealWay(352, spot, 7)).toBe(0)
  })

  it('the real data of stage 7 have no problems; round 2 has more seals and is more exact', () => {
    const g = stage(7).sealTurn as Parameters<typeof sealTurnProblems>[0]
    expect(stage(7).kind).toBe('siegel')
    expect(sealTurnProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.spots.length)).toEqual([2, 3])
    expect(g.rounds[1]!.tolerance).toBeLessThan(g.rounds[0]!.tolerance)
  })

  it('the checker finds broken data', () => {
    const g = stage(7).sealTurn as Parameters<typeof sealTurnProblems>[0]
    const bad = { ...g, waxW: 10, rounds: [{ hint: 'x', tolerance: 2, spots: [{ x: 50, y: 52, angle: 0, start: 10 }, { x: 52, y: 52, angle: 0, start: 100 }] }] }
    const p = sealTurnProblems(bad).join(' | ')
    expect(p).toMatch(/wax is 10/)
    expect(p).toMatch(/tolerance of 2/)
    expect(p).toMatch(/starts too near/)
    expect(p).toMatch(/overlap/)
    expect(p).toMatch(/same angle/)
    expect(p).toMatch(/fewer than two rounds/)
  })
})

describe('earth for Naaman', () => {
  const r: EarthRound = { hint: 'x', sacks: [2, 3, 1, 2, 3, 2, 1] }
  const none = (): EarthWhere[] => r.sacks.map(() => -1)

  it('half for each mule; loading; too heavy; taking down', () => {
    expect(earthTarget(r)).toBe(7)
    let on = none()
    let res = earthPut(r, on, 1, 0)
    expect(res.kind).toBe('loaded')
    on = res.on
    on = earthPut(r, on, 4, 0).on
    expect(earthLoads(r, on)).toEqual([6, 0])
    res = earthPut(r, on, 0, 0)
    expect(res.kind).toBe('heavy')
    expect(res.on).toEqual(on)
    on = earthPut(r, on, 2, 0).on
    expect(earthLoads(r, on)).toEqual([7, 0])
    on = earthTake(r, on, 2)
    expect(earthLoads(r, on)).toEqual([6, 0])
    expect(earthPut(r, on, 1, 0).kind).toBe('none')
  })

  it('a dead end: 3+3+1 and 2+2+2 leave a 1 that fits, 3+2+1 and 3+2+1 leave a 2 that fits nowhere', () => {
    const on: EarthWhere[] = [0, 0, 0, 1, 1, -1, 1]
    expect(earthLoads(r, on)).toEqual([6, 6])
    expect(earthStuck(r, on)).toBe(true)
    expect(earthSolve(r, on)).toBeNull()
    expect(earthDone(r, on)).toBe(false)
    const h = earthHint(r, on)
    expect(h?.kind).toBe('take')
    // the top sack of a mule is the one loaded last; the help points at a mule whose top sack opens a way
    const order = [1, 0, 2, 4, 3, 6]
    expect(earthTop(on, order, 0)).toBe(2)
    expect(earthTop(on, order, 1)).toBe(6)
    const ht = earthHintTop(r, on, order)
    expect(ht?.kind).toBe('take')
    expect(earthHasDeadEnd(r)).toBe(true)
  })

  it('the help leads to the end: following it from an empty road loads all sacks with no mistake', () => {
    let on = none()
    for (let k = 0; k < 20 && !earthDone(r, on); k++) {
      const h = earthHint(r, on)!
      expect(h.kind).toBe('put')
      if (h.kind !== 'put') break
      const res = earthPut(r, on, h.sack, h.mule)
      expect(res.kind).toBe('loaded')
      on = res.on
    }
    expect(earthDone(r, on)).toBe(true)
    expect(earthLoads(r, on)).toEqual([7, 7])
    expect(earthHint(r, on)).toBeNull()
  })

  it('the slots of the road share the width', () => {
    expect(earthSlot(r)).toBeCloseTo(100 / 7)
  })

  it('the real data of stage 9 have no problems; both rounds can be shared, round 2 has more sacks', () => {
    const g = stage(9).earthLoad as Parameters<typeof earthLoadProblems>[0]
    expect(stage(9).kind).toBe('naamanerde')
    expect(earthLoadProblems(g)).toEqual([])
    for (const rr of g.rounds) expect(earthSolve(rr, rr.sacks.map(() => -1))).not.toBeNull()
    expect(g.rounds[1]!.sacks.length).toBeGreaterThan(g.rounds[0]!.sacks.length)
  })

  it('the checker finds broken data', () => {
    const g = stage(9).earthLoad as Parameters<typeof earthLoadProblems>[0]
    const bad = { ...g, sackW: [10, 9, 13] as [number, number, number], rounds: [{ hint: '', sacks: [3, 3, 3, 1, 4] }] }
    const p = earthLoadProblems(bad).join(' | ')
    expect(p).toMatch(/do not grow/)
    expect(p).toMatch(/other than 1, 2 or 3/)
    expect(p).toMatch(/fewer than two rounds/)
    expect(p).toMatch(/no hint/)
    const odd = earthLoadProblems({ ...g, rounds: [{ hint: 'x', sacks: [3, 1, 1, 2] }, { hint: 'x', sacks: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3] }] }).join(' | ')
    expect(odd).toMatch(/cannot be halved/)
    expect(odd).toMatch(/44 pixels/)
  })
})
