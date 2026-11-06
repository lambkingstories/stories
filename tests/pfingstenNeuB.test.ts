/**
 * The pure logic of three more games of "Pfingsten": "Leap and praise" (`huepfen`), "Catch up with the chariot" (`wagen`) and "Peek through the gate" (`spaehen`),
 * with their checks of the data (`hopProblems`, `chariotProblems`, `peekProblems`).
 */
import { describe, expect, it } from 'vitest'
import {
  chariotClamp,
  chariotProblems,
  chariotSpeedAt,
  chariotWagonX,
  chariotWhere,
  chariotZone,
  hopLevels,
  hopNeed,
  hopPress,
  hopProblems,
  hopRise,
  peekIsPeter,
  peekOpenShare,
  peekProblems,
  peekTap
} from '@/utils/pfingstenNeuB'
import { CHARIOT, HOP, PEEK } from './pfingstenSamples'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('huepfen: leap and praise', () => {
  it('a low step lifts one unit, a high step two, a landing none; the levels add up', () => {
    expect([hopRise('n'), hopRise('h'), hopRise('L')]).toEqual([1, 2, 0])
    expect(hopLevels(['n', 'h', 'L', 'n'])).toEqual([1, 3, 3, 4])
    expect([hopNeed('n'), hopNeed('h'), hopNeed('L')]).toEqual(['small', 'big', 'praise'])
  })

  it('the fitting button is right; otherwise he hops on the spot, leaps and lands again, or should praise (never a fall)', () => {
    expect(hopPress('n', 'small')).toBe('ok')
    expect(hopPress('h', 'big')).toBe('ok')
    expect(hopPress('L', 'praise')).toBe('ok')
    expect(hopPress('h', 'small')).toBe('low')
    expect(hopPress('n', 'big')).toBe('high')
    expect(hopPress('L', 'small')).toBe('landing')
    expect(hopPress('n', 'praise')).toBe('praise')
  })

  it('the check finds nothing in good data and names every fault', () => {
    expect(hopProblems(HOP)).toEqual([])
    const bad = clone(HOP)
    bad.rounds[0]!.steps = ['L', 'n', 'n', 'n']
    bad.rounds[1]!.steps = ['n', 'L', 'L', 'h']
    bad.manH = 60
    const p = hopProblems(bad).join(' | ')
    expect(p).toMatch(/round 1: the stairs begin with a landing/)
    expect(p).toMatch(/round 2: two landings in a row/)
    expect(p).toMatch(/round 1: low and high steps/)
    expect(p).toMatch(/round 1 has no landing/)
    expect(p).toMatch(/round 2 should be longer/)
    expect(p).toMatch(/the man should be between/)
  })
})

describe('wagen: catch up with the chariot', () => {
  it('the speed changes at its times; the chariot moves forward when it is faster', () => {
    const r = CHARIOT.rounds[1]!
    expect(chariotSpeedAt(r, 0)).toBe(1)
    expect(chariotSpeedAt(r, 1499)).toBe(1)
    expect(chariotSpeedAt(r, 1500)).toBe(1.6)
    expect(chariotSpeedAt(r, 9999)).toBe(0.6)
    expect(chariotWagonX(CHARIOT, 1)).toBe(30)
    expect(chariotWagonX(CHARIOT, 1.5)).toBe(37)
  })

  it('the window zone moves with the chariot; in front of the horses is a mistake, elsewhere nothing', () => {
    const z = chariotZone(CHARIOT, 30)
    expect(z.from).toBeCloseTo(32.1, 6)
    expect(z.to).toBeCloseTo(45.96, 6)
    expect(chariotWhere(CHARIOT, 30, 40)).toBe('zone')
    expect(chariotWhere(CHARIOT, 30, 20)).toBe('off')
    expect(chariotWhere(CHARIOT, 30, 55)).toBe('off')
    expect(chariotWhere(CHARIOT, 30, 70)).toBe('horses')
    expect(chariotClamp(CHARIOT, -5)).toBe(5.5)
    expect(chariotClamp(CHARIOT, 200)).toBe(94.5)
  })

  it('the check finds nothing in good data and names every fault', () => {
    expect(chariotProblems(CHARIOT)).toEqual([])
    const bad = clone(CHARIOT)
    bad.window = { from: 0.3, to: 0.32 }
    bad.swing = 60
    bad.rounds[1]!.fill = 2000
    bad.rounds[1]!.speed = [{ t: 100, v: 3 }]
    const p = chariotProblems(bad).join(' | ')
    expect(p).toMatch(/window zone is too narrow/)
    expect(p).toMatch(/leaves the field on the right/)
    expect(p).toMatch(/round 2: the scroll fills too quickly/)
    expect(p).toMatch(/round 2: the first speed is at time 0/)
    expect(p).toMatch(/a speed of 3 is not possible/)
  })
})

describe('spaehen: peek through the gate', () => {
  it('a tap is right only at Peter; nobody at the gate is no mistake', () => {
    expect(peekTap(PEEK, 'petrus')).toBe('peter')
    expect(peekTap(PEEK, 'mann-1')).toBe('wrong')
    expect(peekTap(PEEK, null)).toBe('nobody')
    expect(peekIsPeter(PEEK, 'petrus')).toBe(true)
    expect(peekIsPeter(PEEK, 'frau-1')).toBe(false)
    expect(peekOpenShare(PEEK.rounds[0]!)).toBeCloseTo(0.21, 6)
  })

  it('the check finds nothing in good data and names every fault', () => {
    expect(peekProblems(PEEK)).toEqual([])
    const bad = clone(PEEK)
    bad.rounds[0]!.people = [{ id: 'petrus', stop: true }, { id: 'frau-1' }]
    bad.rounds[1]!.slits = [{ x: 30, w: 8 }, { x: 35, w: 8 }]
    bad.people.push({ id: 'petrus-2', image: 'p', name: 'P', peter: true })
    const p = peekProblems(bad).join(' | ')
    expect(p).toMatch(/exactly one Peter, there are 2/)
    expect(p).toMatch(/round 1: Peter comes last/)
    expect(p).toMatch(/round 1: someone else must also stop/)
    expect(p).toMatch(/round 2: the cracks 1 and 2 overlap/)
    expect(p).toMatch(/narrower cracks/)
  })
})
