/**
 * The pure parts of the five new games of "Josef" (`utils/josefNeu.ts`): turning and bowing sheaves, pressing and letting go at the cup, the cows on their way, Benjamin first,
 * two teams on the road; and the checkers of the data with good and with broken data. The real data are checked in `josefData.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import {
  FINGER,
  angleGap,
  cowAt,
  cowTap,
  cowWalkTime,
  embraceNext,
  embraceProblems,
  embraceSpot,
  embraceTap,
  josefStars,
  meetLaneAt,
  meetPlay,
  meetSafeLane,
  meetStartState,
  meetStep,
  meetStop,
  meetingProblems,
  nileCowsProblems,
  sheafBows,
  sheafTap,
  sheafTarget,
  sheafTaps,
  sheavesProblems,
  winePress,
  winePressProblems,
  wineRelease,
  wineStage,
  wineWindow
} from '@/utils/josefNeu'
import type { EmbraceGame, MeetingGame, NileCowsGame, SheavesGame, WinePressGame } from '@/utils/josefNeu'
import { josef } from '@/data/adventures/josef'

const taskOf = (id: number) => josef.stages.find((s) => s.id === id)!.task as unknown as Record<string, unknown>
const GARBEN = () => structuredClone(taskOf(2).sheavesBow) as SheavesGame
const KELTERN = () => structuredClone(taskOf(7).winePress) as WinePressGame
const KUEHE = () => structuredClone(taskOf(8).nileCows) as NileCowsGame
const UMARMEN = () => structuredClone(taskOf(11).embrace2) as EmbraceGame
const BEGEGNUNG = () => structuredClone(taskOf(12).meeting) as MeetingGame

describe('stars', () => {
  it('three stars up to two mistakes, two up to four, then one', () => {
    expect([0, 2, 3, 4, 5, 9].map(josefStars)).toEqual([3, 3, 2, 2, 1, 1])
    expect(josefStars(-1)).toBe(3)
  })
})

describe('the sheaves bow', () => {
  it('the direction to the middle: up, right, down, left', () => {
    const c = { x: 50, y: 50 }
    expect(sheafTarget({ x: 50, y: 90 }, c)).toBeCloseTo(0)
    expect(sheafTarget({ x: 10, y: 50 }, c)).toBeCloseTo(90)
    expect(sheafTarget({ x: 50, y: 10 }, c)).toBeCloseTo(180)
    expect(sheafTarget({ x: 90, y: 50 }, c)).toBeCloseTo(270)
    expect(angleGap(350, 10)).toBe(20)
  })
  it('a tap turns a step; a sheaf that bows stays (a mistake)', () => {
    expect(sheafBows(20, 0, 45)).toBe(true)
    expect(sheafBows(30, 0, 45)).toBe(false)
    expect(sheafTaps(270, 0, 45)).toBe(2)
    const a = sheafTap(270, 0, 45)
    expect(a).toEqual({ verdict: 'turned', angle: 315, bows: false })
    const b = sheafTap(a.angle, 0, 45)
    expect(b.verdict).toBe('turned')
    expect(b.bows).toBe(true)
    expect(sheafTap(0, 0, 45).verdict).toBe('already')
  })
  it('the data of stage 2 have no problems, and broken data are found', () => {
    expect(sheavesProblems(GARBEN())).toEqual([])
    const g = GARBEN()
    g.rounds[0]!.sheaves[0]!.start = sheafTarget(g.rounds[0]!.sheaves[0]!, g.rounds[0]!.center)
    g.rounds[1]!.sheaves.pop()
    g.sheafW = 8
    const p = sheavesProblems(g)
    expect(p.some((x) => x.includes('bows already'))).toBe(true)
    expect(p.some((x) => x.includes('eleven'))).toBe(true)
    expect(p.some((x) => x.includes('too small'))).toBe(true)
  })
})

describe('the wine press', () => {
  const r = { hint: '', flow: 0.2, push: 0, full: 0.8, cups: 1 }
  it('the cup fills while the grapes are pressed and runs over', () => {
    let s = winePress(r, 0, 0, 1)
    expect(s.level).toBeCloseTo(0.2)
    s = winePress(r, 0.9, 1, 0.6)
    expect(s.over).toBe(true)
    expect(wineStage(0, 0.8)).toBe(0)
    expect(wineStage(0.2, 0.8)).toBe(1)
    expect(wineStage(0.5, 0.8)).toBe(2)
    expect(wineStage(0.85, 0.8)).toBe(3)
    expect(wineStage(1.05, 0.8)).toBe(4)
  })
  it('letting go: full only between "full" and the brim', () => {
    expect(wineRelease(r, 0.5)).toBe('more')
    expect(wineRelease(r, 0.9)).toBe('full')
    expect(wineRelease(r, 1.01)).toBe('more')
    const w = wineWindow(r)
    expect(w.full).toBeCloseTo(4, 1)
    expect(w.window).toBeCloseTo(1, 1)
  })
  it('the data of stage 7 have no problems; round 2 has a shorter moment', () => {
    const g = KELTERN()
    expect(winePressProblems(g)).toEqual([])
    expect(wineWindow(g.rounds[1]!).window).toBeLessThan(wineWindow(g.rounds[0]!).window)
    g.rounds[1]!.push = 2
    g.cup.w = 10
    const p = winePressProblems(g)
    expect(p.some((x) => x.includes('too short'))).toBe(true)
    expect(p.some((x) => x.includes('too small'))).toBe(true)
  })
})

describe('cows by the Nile', () => {
  it('a cow waits, comes up, walks and leaves the picture', () => {
    const g = KUEHE()
    const r = g.rounds[0]!
    const c = r.cows[0]!
    expect(cowAt(g, r, c, c.at - 0.1).phase).toBe('wait')
    expect(cowAt(g, r, c, c.at + g.rise / 2).phase).toBe('rise')
    const mid = cowAt(g, r, c, c.at + g.rise + cowWalkTime(g, r, c.lane) / 2)
    expect(mid.phase).toBe('walk')
    expect(mid.x).toBeLessThan(g.shore.x)
    expect(cowAt(g, r, c, c.at + g.rise + cowWalkTime(g, r, c.lane) + 0.1).phase).toBe('gone')
  })
  it('only the fat cows are right', () => {
    expect(cowTap({ kind: 'fat', image: '', lane: 0, at: 0 }, false, 'walk')).toBe('fat')
    expect(cowTap({ kind: 'lean', image: '', lane: 0, at: 0 }, false, 'walk')).toBe('lean')
    expect(cowTap({ kind: 'fat', image: '', lane: 0, at: 0 }, true, 'walk')).toBe('none')
    expect(cowTap({ kind: 'fat', image: '', lane: 0, at: 0 }, false, 'gone')).toBe('none')
  })
  it('the data of stage 8 have no problems: seven and seven, round 1 as in the dream, round 2 mixed', () => {
    const g = KUEHE()
    expect(nileCowsProblems(g)).toEqual([])
    expect(g.rounds[0]!.cows.slice(0, 7).every((c) => c.kind === 'fat')).toBe(true)
    g.rounds[1]!.cows = g.rounds[1]!.cows.map((c, i) => ({ ...c, at: i * 0.2 }))
    g.rounds[0]!.cows.pop()
    const p = nileCowsProblems(g)
    expect(p.some((x) => x.includes('seven fat'))).toBe(true)
    expect(p.some((x) => x.includes('on each other'))).toBe(true)
  })
})

describe('embrace', () => {
  it('Benjamin first, then every brother; a glad one is not embraced again', () => {
    const g = UMARMEN()
    const r = g.rounds[0]!
    const other = r.brothers.find((b) => !b.benjamin)!
    const ben = r.brothers.find((b) => b.benjamin)!
    expect(embraceTap(r, new Set(), other.id)).toBe('benjamin')
    expect(embraceTap(r, new Set(), ben.id)).toBe('ok')
    expect(embraceTap(r, new Set([ben.id]), other.id)).toBe('ok')
    expect(embraceTap(r, new Set([ben.id, other.id]), other.id)).toBe('glad')
    expect(embraceNext(r, new Set(), r.start, g.ratio)!.id).toBe(ben.id)
    expect(embraceNext(r, new Set(r.brothers.map((b) => b.id)), r.start, g.ratio)).toBeNull()
    const spot = embraceSpot(g, other)
    expect(Math.abs(spot.x - other.x)).toBeGreaterThan(0)
  })
  it('the data of stage 11 have no problems, and broken data are found', () => {
    const g = UMARMEN()
    expect(embraceProblems(g)).toEqual([])
    g.rounds[1]!.showBenjamin = true
    g.rounds[0]!.brothers = g.rounds[0]!.brothers.map((b) => ({ ...b, benjamin: false }))
    g.rounds[1]!.brothers[1]!.x = g.rounds[1]!.brothers[0]!.x + 1
    const p = embraceProblems(g)
    expect(p.some((x) => x.includes('exactly one Benjamin'))).toBe(true)
    expect(p.some((x) => x.includes('without a ring'))).toBe(true)
    expect(p.some((x) => x.includes('on each other'))).toBe(true)
  })
})

describe('meeting', () => {
  it('both drive to the middle, a bump stops a team, they meet', () => {
    const g = BEGEGNUNG()
    let st = meetStartState(g, 0)
    const r = g.rounds[0]!
    const events: string[] = []
    for (let t = 0; t < 60; t += 0.05) {
      const res = meetStep(g, 0, st, 0.05)
      st = res.state
      events.push(...res.events.map((e) => e.type))
      if (events.includes('met')) break
    }
    expect(events.filter((e) => e === 'met')).toHaveLength(1)
    expect(events.filter((e) => e === 'arrived')).toHaveLength(2)
    // without steering both bump into what lies in their start lane
    expect(events.filter((e) => e === 'bump').length).toBe(r.obstacles.filter((o) => o.lane === r.startLane[o.side]).length)
    expect(st.josef.x).toBeCloseTo(meetStop(g, 'josef'))
    expect(st.jakob.x).toBeCloseTo(meetStop(g, 'jakob'))
  })
  it('the lane of a tap, the safe lane and the help', () => {
    const g = BEGEGNUNG()
    expect(meetLaneAt(g, 0)).toBe(0)
    expect(meetLaneAt(g, 100)).toBe(g.lanes.length - 1)
    const st = meetStartState(g, 0)
    const lane = meetSafeLane(g, 0, 'josef', st.josef)
    const first = g.rounds[0]!.obstacles.filter((o) => o.side === 'josef').sort((a, b) => a.x - b.x)[0]!
    expect(lane).not.toBe(first.lane)
    for (const ri of [0, 1]) expect(meetPlay(g, ri, true)).toMatchObject({ met: true, bumps: 0 })
  })
  it('the data of stage 12 have no problems, and broken data are found', () => {
    const g = BEGEGNUNG()
    expect(meetingProblems(g)).toEqual([])
    g.lanes = [60, 70, 80]
    g.rounds[1]!.obstacles = g.rounds[1]!.obstacles.slice(0, 2)
    const p = meetingProblems(g)
    expect(p.some((x) => x.includes('too narrow to tap'))).toBe(true)
    expect(p.some((x) => x.includes('more obstacles'))).toBe(true)
  })
  it('a finger field is 44 pixels of 360', () => {
    expect(FINGER).toBeCloseTo(12.22, 1)
  })
})
