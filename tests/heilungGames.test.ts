/**
 * The pure parts of the two new games of "Jesus heals" (`utils/heilungGames.ts`): "Who turns back?" (`umkehr`) and "Shout louder" (`ruf`).
 * Nothing here uses a clock or dice of its own: the seconds are given, the dice are `seeded`.
 */
import { describe, expect, it } from 'vitest'
import {
  SHOUT_PUSH,
  SHOUT_STEPS,
  TURN_BACK_SPEED,
  TURN_FAST_SPEED,
  TURN_KNEEL_GAP,
  TURN_KINDS,
  TURN_MEN,
  TURN_PARTS,
  TURN_SLOTS,
  TURN_SPEED,
  heilungStars,
  shoutFill,
  shoutFull,
  shoutGroupX,
  shoutHushTimes,
  shoutPercent,
  shoutRoundParts,
  shoutRoundProblems,
  shoutSteps,
  shoutStart,
  shoutTap,
  shoutTick,
  turnArriveAt,
  turnArrived,
  turnBuild,
  turnFacing,
  turnJudge,
  turnLayer,
  turnPhase,
  turnRoundParts,
  turnRoundProblems,
  turnTurnAt,
  turnX,
  turnY
} from '@/utils/heilungGames'
import type { ShoutRule, TurnGeometry } from '@/utils/heilungGames'
import { seeded } from '@/utils/jakobGames'

const GEO: TurnGeometry = { y: 78, spread: 10, startX: 20, gap: 5.4, houseX: 88, jesusX: 9 }

describe('stars of both games', () => {
  it('two rounds: up to two mistakes three stars, up to five two stars, then one', () => {
    expect([0, 1, 2].map((m) => heilungStars(m, 2))).toEqual([3, 3, 3])
    expect([3, 4, 5].map((m) => heilungStars(m, 2))).toEqual([2, 2, 2])
    expect([6, 9].map((m) => heilungStars(m, 2))).toEqual([1, 1])
  })
  it('a game without rounds counts as one round', () => {
    expect(heilungStars(0, 0)).toBe(3)
  })
})

describe('who turns back? the row of men', () => {
  it('has ten men, exactly one of them the Samaritan, never at the front and never at the back', () => {
    for (let seed = 1; seed < 40; seed++) {
      const men = turnBuild(false, GEO, seeded(seed))
      expect(men).toHaveLength(TURN_MEN)
      expect(men.filter((m) => m.samaritan)).toHaveLength(1)
      const slot = men.findIndex((m) => m.samaritan)
      expect(TURN_SLOTS as readonly number[]).toContain(slot)
    }
  })

  it('uses all six pictures for the nine others, and mirrors the three that come a second time', () => {
    const men = turnBuild(false, GEO, seeded(7)).filter((m) => !m.samaritan)
    expect(men).toHaveLength(TURN_MEN - 1)
    expect(new Set(men.map((m) => m.kind)).size).toBe(TURN_KINDS)
    expect(men.filter((m) => m.mirror)).toHaveLength(TURN_MEN - 1 - TURN_KINDS)
    for (const m of men) expect(m.kind).toBeGreaterThanOrEqual(0)
    expect(men.every((m) => m.kind < TURN_KINDS)).toBe(true)
  })

  it('a given place is used; the same seed gives the same row', () => {
    expect(turnBuild(false, GEO, seeded(3), 4).findIndex((m) => m.samaritan)).toBe(4)
    expect(turnBuild(true, GEO, seeded(9))).toEqual(turnBuild(true, GEO, seeded(9)))
    // a place outside the row is not taken
    expect(turnBuild(false, GEO, seeded(3), 12).filter((m) => m.samaritan)).toHaveLength(1)
  })

  it('stands in a row one gap apart; round 1 does not wander, round 2 does and some walk at another pace', () => {
    const calm = turnBuild(false, GEO, seeded(5))
    expect(calm[0]!.x0).toBeCloseTo(GEO.startX + 9 * GEO.gap)
    expect(calm[9]!.x0).toBeCloseTo(GEO.startX)
    expect(calm.every((m) => m.amp === 0 && m.pace === 1)).toBe(true)
    const crossing = turnBuild(true, GEO, seeded(5))
    expect(crossing.every((m) => m.amp > 0)).toBe(true)
    expect(crossing.some((m) => !m.samaritan && m.pace !== 1)).toBe(true)
    // the Samaritan walks at the usual pace, so the child can follow him
    expect(crossing.find((m) => m.samaritan)!.pace).toBe(1)
  })

  it('men who cross each other really change their order on the road', () => {
    const men = turnBuild(true, GEO, seeded(2))
    const order = (t: number) => [...men].sort((a, b) => turnX(a, t, GEO) - turnX(b, t, GEO)).map((m) => m.id)
    expect(order(0)).not.toEqual(order(turnTurnAt))
  })
})

describe('who turns back? time and places', () => {
  it('walks, shows clean hands, then the turn lasts as long as the round says, then it is late', () => {
    expect(turnPhase(0, 4)).toBe('walk')
    expect(turnPhase(2.4, 4)).toBe('walk')
    expect(turnPhase(2.5, 4)).toBe('clean')
    expect(turnPhase(3.9, 4)).toBe('clean')
    expect(turnPhase(turnTurnAt, 4)).toBe('turn')
    expect(turnPhase(turnTurnAt + 3.9, 4)).toBe('turn')
    expect(turnPhase(turnTurnAt + 4, 4)).toBe('late')
  })

  it('the men walk to the right at the same speed and wait at the door', () => {
    const [m] = turnBuild(false, GEO, seeded(1)).filter((w) => !w.samaritan)
    expect(turnX(m!, 0, GEO)).toBeCloseTo(m!.x0)
    expect(turnX(m!, 1, GEO) - turnX(m!, 0, GEO)).toBeCloseTo(TURN_SPEED, 5)
    expect(turnX(m!, 60, GEO)).toBe(GEO.houseX)
  })

  it('the Samaritan walks with the others until the turn, then runs back slowly and looks the other way', () => {
    const sam = turnBuild(false, GEO, seeded(1), 2).find((m) => m.samaritan)!
    expect(turnFacing(sam, turnTurnAt - 0.1)).toBe(1)
    expect(turnFacing(sam, turnTurnAt)).toBe(-1)
    const atTurn = turnX(sam, turnTurnAt, GEO)
    expect(turnX(sam, turnTurnAt + 1, GEO)).toBeCloseTo(atTurn - TURN_BACK_SPEED, 5)
    expect(turnX(sam, turnTurnAt + 2, GEO)).toBeLessThan(turnX(sam, turnTurnAt + 1, GEO))
    // the others are not turned
    const other = turnBuild(false, GEO, seeded(1), 2).find((m) => !m.samaritan)!
    expect(turnFacing(other, 10)).toBe(1)
  })

  it('without a tap he never reaches Jesus (he stays where the child can still tap him)', () => {
    for (const slot of TURN_SLOTS) {
      const sam = turnBuild(false, GEO, seeded(1), slot).find((m) => m.samaritan)!
      expect(turnX(sam, turnTurnAt + 4, GEO)).toBeGreaterThan(GEO.jesusX + TURN_KNEEL_GAP + 1)
      expect(turnX(sam, 200, GEO)).toBe(GEO.jesusX + TURN_KNEEL_GAP)
    }
  })

  it('after the right tap he runs faster, reaches Jesus at the second that is named and stops there', () => {
    const sam = turnBuild(false, GEO, seeded(1), 3).find((m) => m.samaritan)!
    const tap = turnTurnAt + 1.5
    const at = turnX(sam, tap, GEO, tap)
    expect(turnX(sam, tap + 0.5, GEO, tap)).toBeCloseTo(at - 0.5 * TURN_FAST_SPEED, 5)
    expect(turnArrived(at, GEO)).toBe(false)
    const arrive = turnArriveAt(sam, GEO, tap)
    expect(arrive).toBeGreaterThan(tap)
    expect(turnArrived(turnX(sam, arrive + 0.01, GEO, tap), GEO)).toBe(true)
    expect(turnArrived(turnX(sam, arrive - 0.3, GEO, tap), GEO)).toBe(false)
    expect(turnX(sam, arrive + 5, GEO, tap)).toBe(GEO.jesusX + TURN_KNEEL_GAP)
  })

  it('a man wanders up and down only when his round has crossing; after the tap the Samaritan comes to the middle line', () => {
    const calm = turnBuild(false, GEO, seeded(1))[0]!
    expect(turnY(calm, 0, GEO)).toBeCloseTo(turnY(calm, 3, GEO))
    const wild = turnBuild(true, GEO, seeded(1)).find((m) => m.samaritan)!
    expect(turnY(wild, 0, GEO)).not.toBeCloseTo(turnY(wild, 1, GEO))
    expect(turnY(wild, 20, GEO, 5)).toBeCloseTo(GEO.y)
  })

  it('the lower a man stands in the picture, the higher his layer', () => {
    expect(turnLayer(80)).toBeGreaterThan(turnLayer(70))
  })
})

describe('who turns back? the taps and the parts of the task', () => {
  it('a tap before the turn is only "wait"; during the turn the Samaritan is right and every other man wrong', () => {
    for (const phase of ['walk', 'clean', 'late'] as const) {
      expect(turnJudge({ samaritan: true }, phase)).toBe('early')
      expect(turnJudge({ samaritan: false }, phase)).toBe('early')
    }
    expect(turnJudge({ samaritan: true }, 'turn')).toBe('right')
    expect(turnJudge({ samaritan: false }, 'turn')).toBe('wrong')
  })

  it('every mistake counts a part (two at most), the solved round counts all three', () => {
    expect([0, 1, 2, 3, 9].map((m) => turnRoundParts(m, false))).toEqual([0, 1, 2, 2, 2])
    expect(turnRoundParts(0, true)).toBe(TURN_PARTS)
    expect(turnRoundParts(7, true)).toBe(TURN_PARTS)
  })

  it('two mistakes in the first of two rounds give a third of the task: "Go on (1 star)"', () => {
    const goal = 2 * TURN_PARTS
    expect(Math.ceil(0.3 * goal)).toBeLessThanOrEqual(turnRoundParts(2, false))
    expect(Math.ceil(0.3 * goal)).toBeGreaterThan(turnRoundParts(1, false))
  })
})

describe('who turns back? the data of a round', () => {
  it('the sample road is in order for both rounds', () => {
    expect(turnRoundProblems(GEO, { seconds: 4, crossing: false })).toEqual([])
    expect(turnRoundProblems(GEO, { seconds: 4, crossing: true })).toEqual([])
  })
  it('finds the problems', () => {
    expect(turnRoundProblems(GEO, { seconds: 1, crossing: false }).join()).toContain('seconds')
    // so long a window that the Samaritan would stand at Jesus before the child has tapped
    expect(turnRoundProblems({ ...GEO, jesusX: 14 }, { seconds: 8, crossing: false }).join()).toContain('with Jesus before')
    expect(turnRoundProblems({ ...GEO, gap: 2 }, { seconds: 4, crossing: false }).join()).toContain('too close')
    expect(turnRoundProblems({ ...GEO, houseX: 60 }, { seconds: 4, crossing: false }).join()).toContain('door')
    expect(turnRoundProblems({ ...GEO, jesusX: 30 }, { seconds: 4, crossing: false }).join()).toContain('Jesus stands in the row')
    expect(turnRoundProblems({ ...GEO, spread: 2 }, { seconds: 4, crossing: true }).join()).toContain('narrow')
  })
})

// ---------------------------------------------------------------- shout louder

const R1: ShoutRule = { seconds: 12, need: 25, hushes: 2 }
const R2: ShoutRule = { seconds: 14, need: 35, hushes: 4 }

/** A child who taps `rate` times a second, all the time; returns whether the bar was filled and when. */
function tapper(rule: ShoutRule, rate: number, seed = 1): { won: boolean; time: number; taps: number } {
  let s = shoutStart()
  const times = shoutHushTimes(rule, seeded(seed))
  let acc = 0
  let taps = 0
  for (let i = 0; i < 400; i++) {
    acc += rate * 0.1
    while (acc >= 1) {
      acc -= 1
      s = shoutTap(s, rule)
      taps++
      if (shoutFull(s, rule)) return { won: true, time: s.time, taps }
    }
    const r = shoutTick(s, 0.1, rule, times)
    s = r.state
    if (r.timeUp) return { won: false, time: s.time, taps }
  }
  return { won: false, time: s.time, taps }
}

describe('shout louder: the bar', () => {
  it('rises with every tap, never above the taps it needs; the first tap starts the clock', () => {
    let s = shoutStart()
    expect(s.started).toBe(false)
    s = shoutTap(s, R1)
    expect(s.started).toBe(true)
    expect(s.level).toBe(1)
    for (let i = 0; i < 40; i++) s = shoutTap(s, R1)
    expect(s.level).toBe(25)
    expect(shoutFull(s, R1)).toBe(true)
    expect(shoutFill(s, R1)).toBe(1)
    expect(shoutPercent(s, R1)).toBe(100)
  })

  it('shows the fill as a share and as a whole percent', () => {
    let s = shoutStart()
    for (let i = 0; i < 10; i++) s = shoutTap(s, R1)
    expect(shoutFill(s, R1)).toBeCloseTo(0.4)
    expect(shoutPercent(s, R1)).toBe(40)
    expect(shoutFill(shoutStart(), { ...R1, need: 0 })).toBe(0)
  })

  it('the clock does not run before the first tap', () => {
    const r = shoutTick(shoutStart(), 5, R1, [3])
    expect(r.state.time).toBe(0)
    expect(r.hush).toBe(false)
    expect(r.timeUp).toBe(false)
  })

  it('the steps of the bar: whole tenths, no rounding up; 60 % of round 1 is six of ten', () => {
    expect(shoutSteps(0, 25)).toBe(0)
    expect(shoutSteps(2, 25)).toBe(0)
    expect(shoutSteps(3, 25)).toBe(1)
    expect(shoutSteps(15, 25)).toBe(6)
    expect(shoutSteps(25, 25)).toBe(SHOUT_STEPS)
    expect(shoutSteps(99, 25)).toBe(SHOUT_STEPS)
    expect(shoutSteps(5, 0)).toBe(0)
  })

  it('from 60 % in round 1 the task has a third done: "Go on (1 star)" (two rounds, ten steps each)', () => {
    const goal = 2 * SHOUT_STEPS
    expect(shoutRoundParts(15, 25, false) * 10).toBeGreaterThanOrEqual(goal * 3)
    expect(shoutRoundParts(14, 25, false) * 10).toBeLessThan(goal * 3)
    expect(shoutRoundParts(3, 25, true)).toBe(SHOUT_STEPS)
  })
})

describe('shout louder: the crowd and the time', () => {
  it('the hush times are as many as the round says, rising, inside the time, and the same for the same seed', () => {
    for (const rule of [R1, R2]) {
      for (let seed = 1; seed < 30; seed++) {
        const times = shoutHushTimes(rule, seeded(seed))
        expect(times).toHaveLength(rule.hushes)
        for (let i = 0; i < times.length; i++) {
          expect(times[i]).toBeGreaterThanOrEqual(1.5)
          expect(times[i]).toBeLessThanOrEqual(rule.seconds - 1.5)
          if (i > 0) expect(times[i]).toBeGreaterThan(times[i - 1]!)
        }
      }
    }
    expect(shoutHushTimes(R2, seeded(4))).toEqual(shoutHushTimes(R2, seeded(4)))
    expect(shoutHushTimes({ ...R1, hushes: 0 }, seeded(1))).toEqual([])
  })

  it('a hush pushes the bar back (never below nothing) and is reported once', () => {
    let s = shoutStart()
    for (let i = 0; i < 10; i++) s = shoutTap(s, R1)
    const r = shoutTick(s, 3, R1, [2.5])
    expect(r.hush).toBe(true)
    expect(r.state.level).toBe(10 - SHOUT_PUSH)
    expect(r.state.hushed).toBe(1)
    const again = shoutTick(r.state, 0.1, R1, [2.5])
    expect(again.hush).toBe(false)
    expect(again.state.level).toBe(10 - SHOUT_PUSH)
    // an almost empty bar is not pushed below nothing
    let low = shoutTap(shoutStart(), R1)
    low = shoutTick(low, 3, R1, [2]).state
    expect(low.level).toBe(0)
  })

  it('a round can say how far the crowd pushes', () => {
    let s = shoutStart()
    for (let i = 0; i < 12; i++) s = shoutTap(s, R1)
    expect(shoutTick(s, 3, { ...R1, push: 5 }, [1]).state.level).toBe(7)
    expect(shoutTick(s, 3, { ...R1, push: 0 }, [1]).state.level).toBe(12)
  })

  it('the time is up when 12 seconds are over and the bar is not full; a full bar stops the clock', () => {
    let s = shoutTap(shoutStart(), R1)
    expect(shoutTick(s, 11.9, R1, []).timeUp).toBe(false)
    expect(shoutTick(s, 12, R1, []).timeUp).toBe(true)
    for (let i = 0; i < 25; i++) s = shoutTap(s, R1)
    const r = shoutTick(s, 30, R1, [])
    expect(r.timeUp).toBe(false)
    expect(r.state.time).toBe(0)
  })

  it('the group walks from its first place to its last in the seconds of the round and stands where the clock stands', () => {
    expect(shoutGroupX(0, 12, 10, 58)).toBe(10)
    expect(shoutGroupX(6, 12, 10, 58)).toBe(34)
    expect(shoutGroupX(12, 12, 10, 58)).toBe(58)
    expect(shoutGroupX(99, 12, 10, 58)).toBe(58)
    expect(shoutGroupX(5, 0, 10, 58)).toBe(10)
  })

  it('who taps steadily wins, who taps slowly does not (round 1 and round 2)', () => {
    for (let seed = 1; seed < 20; seed++) {
      expect(tapper(R1, 3.5, seed).won, `round 1, seed ${seed}`).toBe(true)
      expect(tapper(R2, 4.5, seed).won, `round 2, seed ${seed}`).toBe(true)
      expect(tapper(R1, 1, seed).won).toBe(false)
      expect(tapper(R2, 2, seed).won).toBe(false)
    }
  })

  it('a child who taps in bursts (three seconds on, a second off) can still win round 1', () => {
    let s = shoutStart()
    const times = shoutHushTimes(R1, seeded(3))
    let won = false
    for (let i = 0; i < 120 && !won; i++) {
      const burst = i % 40 < 30
      if (burst && i % 3 === 0) s = shoutTap(s, R1)
      if (burst && i % 3 === 1) s = shoutTap(s, R1)
      won = shoutFull(s, R1)
      const r = shoutTick(s, 0.1, R1, times)
      s = r.state
      if (r.timeUp) break
    }
    expect(won).toBe(true)
  })
})

describe('shout louder: the data of a round', () => {
  it('the sample rounds are in order', () => {
    expect(shoutRoundProblems(R1)).toEqual([])
    expect(shoutRoundProblems(R2)).toEqual([])
  })
  it('finds the problems', () => {
    expect(shoutRoundProblems({ ...R1, seconds: 3 }).join()).toContain('too short')
    expect(shoutRoundProblems({ ...R1, need: 5 }).join()).toContain('too few')
    expect(shoutRoundProblems({ ...R1, hushes: 2, push: 0 }).join()).toContain('pushes nothing')
    expect(shoutRoundProblems({ ...R1, push: 20 }).join()).toContain('too much')
    expect(shoutRoundProblems({ seconds: 5, need: 40, hushes: 3 }).join()).toContain('times a second')
  })
})
