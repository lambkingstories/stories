/**
 * The pure logic of three new games of "Paulus": "Through the streets" (`gerade`), "Find Saul again" (`wiederfinden`) and "Set the sail" (`segel`),
 * with their checks of the data (`straightStreetProblems`, `refindProblems`, `sailTrimProblems`).
 */
import { describe, expect, it } from 'vitest'
import {
  refindCycle,
  refindProblems,
  refindTap,
  refindX,
  sailDiff,
  sailKey,
  sailPennantAt,
  sailPointer,
  sailSpeed,
  sailState,
  sailTrimProblems,
  sailTurnTo,
  sailWindAt,
  sailWindIndex,
  straightStreetProblems,
  streetFree,
  streetHit,
  streetLongestGap,
  streetLoop,
  streetRows,
  streetThings,
  streetWait
} from '@/utils/paulusNeuA'
import { REFIND, SAIL, STREET } from './paulusSamples'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('gerade: through the streets', () => {
  const lane = STREET.rounds[0]!.lanes[0]!
  const left = STREET.rounds[1]!.lanes[1]!

  it('the places go from the start below to the door above, quiet strips and lanes mixed', () => {
    const rows = streetRows(STREET.rounds[0]!)
    expect(rows.map((r) => r.kind)).toEqual(['safe', 'lane', 'safe', 'lane', 'safe'])
    expect(rows.map((r) => r.y)).toEqual([92, 70, 58, 45, 20])
  })

  it('a turn of a lane is never shorter than the field and twice the widest thing; things come in from outside', () => {
    expect(streetLoop(STREET, lane)).toBe(148)
    const [th] = streetThings(STREET, lane, 0)
    expect(th!.x).toBe(-24)
    expect(th!.w).toBe(20)
    // a second later it moved 10 % to the right
    expect(streetThings(STREET, lane, 1000)[0]!.x).toBeCloseTo(-14, 6)
    // to the left: it comes in at the right edge and moves left
    expect(streetThings(STREET, left, 0)[0]!.x).toBe(100)
    expect(streetThings(STREET, left, 1000)[0]!.x).toBeCloseTo(90, 6)
  })

  it('a thing touches Ananias only where he stands; the lane is free or taken over a time; the wait for the next gap', () => {
    expect(streetHit(STREET, lane, 0, 50, 10)).toBe(false)
    expect(streetHit(STREET, lane, 6000, 50, 10)).toBe(true)
    expect(streetHit(STREET, lane, 6000, 15, 10)).toBe(false)
    expect(streetFree(STREET, lane, 0, 50, 10, 400)).toBe(true)
    expect(streetFree(STREET, lane, 4300, 50, 10, 400)).toBe(true)
    expect(streetFree(STREET, lane, 4500, 50, 10, 400)).toBe(false)
    expect(streetWait(STREET, lane, 6000, 50, 10, 400)).toBeGreaterThan(1500)
    expect(streetWait(STREET, lane, 6000, 50, 10, 400)).toBeLessThan(2500)
    expect(streetLongestGap(STREET, lane)).toBeGreaterThan(10000)
  })

  it('the sample data are playable; the checks find wrong data', () => {
    expect(straightStreetProblems(STREET)).toEqual([])
    const g = clone(STREET)
    g.rounds[0]!.lanes[0]!.items = ['loewe']
    g.rounds[1]!.safe = [92, 65, 45]
    g.walkerW = 5
    const p = straightStreetProblems(g).join(' | ')
    expect(p).toMatch(/has no picture/)
    expect(p).toMatch(/door of Judas/)
    expect(p).toMatch(/too small/)
    const tight = clone(STREET)
    tight.rounds[1]!.lanes[0]!.items = ['esel', 'karren', 'esel', 'karren', 'esel']
    tight.rounds[1]!.lanes[0]!.gap = 2
    tight.rounds[1]!.lanes[0]!.speed = 30
    expect(straightStreetProblems(tight).join(' ')).toMatch(/too short to step across/)
    const same = clone(STREET)
    same.rounds[1]!.lanes.forEach((l) => (l.dir = 1))
    expect(straightStreetProblems(same).join(' ')).toMatch(/both directions/)
  })
})

describe('wiederfinden: find Saul again', () => {
  const r1 = REFIND.rounds[0]!
  const row = REFIND.lanes[0]!

  it('a walker crosses the lane from edge to edge in his time and comes again after the pause', () => {
    const w = r1.walkers[1]!
    expect(refindX(r1, row, w, 1999, 12)).toBeNull()
    expect(refindX(r1, row, w, 2000, 12)).toBeCloseTo(-6, 6)
    expect(refindX(r1, row, w, 4500, 12)).toBeCloseTo(50, 6)
    expect(refindX(r1, row, w, 7001, 12)).toBeNull()
    expect(refindCycle(r1)).toBe(11000 + 2000)
    expect(refindX(r1, row, w, 13000 + 4500, 12)).toBeCloseTo(50, 6)
    // the second row walks to the left
    expect(refindX(r1, REFIND.lanes[1]!, w, 2000, 12)).toBeCloseTo(106, 6)
  })

  it('a tap on Saul finds him, anyone else is wrong', () => {
    expect(refindTap(REFIND, 'saulus-geht')).toBe('saul')
    expect(refindTap(REFIND, 'mann-1')).toBe('wrong')
  })

  it('the sample data are playable; the checks find wrong data', () => {
    expect(refindProblems(REFIND)).toEqual([])
    const g = clone(REFIND)
    g.people[1]!.name = 'Saulus mit grauem Bart'
    g.rounds[0]!.walkers.push({ id: 'saulus-geht', lane: 0, at: 9000, dur: 5000 })
    g.rounds[1]!.show = 5000
    g.rounds[1]!.walkers[2]!.at = 100
    const p = refindProblems(g).join(' | ')
    expect(p).toMatch(/gives Saul away/)
    expect(p).toMatch(/Saul must come exactly once/)
    expect(p).toMatch(/more briefly/)
    expect(p).toMatch(/walk over each other/)
  })
})

describe('segel: set the sail', () => {
  const r1 = SAIL.rounds[0]!

  it('angles: the difference, the shortest turn, the arrow keys and the finger', () => {
    expect(sailDiff(10, 350)).toBe(20)
    expect(sailDiff(90, 270)).toBe(180)
    expect(sailTurnTo(350, 10)).toBe(20)
    expect(sailTurnTo(10, 350)).toBe(-20)
    expect(sailKey(0, -1, 15)).toBe(345)
    expect(sailKey(350, 2, 15)).toBe(20)
    expect(sailPointer(50, 50, 50, 10)).toBeCloseTo(0, 6)
    expect(sailPointer(50, 50, 90, 50)).toBeCloseTo(90, 6)
    expect(sailPointer(50, 50, 50, 90)).toBeCloseTo(180, 6)
    expect(sailPointer(50, 50, 10, 50)).toBeCloseTo(270, 6)
  })

  it('the wind at a time, and the pennant turns during the second before a change', () => {
    expect(sailWindIndex(r1, 6999)).toBe(0)
    expect(sailWindAt(r1, 7000)).toBe(45)
    expect(sailPennantAt(r1, 5000, 1000)).toBe(90)
    expect(sailPennantAt(r1, 6500, 1000)).toBeCloseTo(67.5, 6)
    expect(sailPennantAt(r1, 7000, 1000)).toBe(45)
  })

  it('full, half, slack and their speeds', () => {
    expect(sailState(SAIL, 90, 90)).toBe('full')
    expect(sailState(SAIL, 115, 90)).toBe('full')
    expect(sailState(SAIL, 130, 90)).toBe('half')
    expect(sailState(SAIL, 150, 90)).toBe('slack')
    expect([sailSpeed('full'), sailSpeed('half'), sailSpeed('slack')]).toEqual([1, 0.45, 0.08])
  })

  it('the sample data are playable; the checks find wrong data', () => {
    expect(sailTrimProblems(SAIL)).toEqual([])
    const g = clone(SAIL)
    g.rounds[0]!.winds[1] = { t: 2000, dir: 80 }
    g.rounds[0]!.gusts = [1000]
    g.keyStep = 30
    const p = sailTrimProblems(g).join(' | ')
    expect(p).toMatch(/too soon/)
    expect(p).toMatch(/hardly changes/)
    expect(p).toMatch(/round 1 has no gusts/)
    expect(p).toMatch(/arrow keys/)
  })
})
