/**
 * The pure parts of the three new games of "Die letzte Woche" (`utils/letzteWocheGames.ts`): stars, the road with its bare places, the oil in the lamp, the people who need something, and the checks of the data.
 */
import { describe, expect, it } from 'vitest'
import {
  LAMP_RATE,
  LAMP_STEP,
  helpActive,
  helpBefore,
  helpBox,
  helpFits,
  helpProblems,
  lampInWindow,
  lampJudge,
  lampMarkTop,
  lampPour,
  lampProblems,
  lampTap,
  lampTolerance,
  pointIn,
  prepareDonkeyAt,
  prepareDrop,
  prepareProblems,
  prepareReach,
  prepareSprite,
  prepareUsed,
  weekStars
} from '@/utils/letzteWocheGames'
import { HELP, LAMPS, PREPARE, sprite } from './letzteWocheSamples'

describe('stars', () => {
  it('up to two mistakes three stars, up to five two, then one (two rounds)', () => {
    expect([0, 1, 2, 3, 5, 6, 10].map((m) => weekStars(m, 2))).toEqual([3, 3, 3, 2, 2, 1, 1])
    expect(weekStars(0, 0)).toBe(3)
  })

  it('a point is inside a rectangle with a margin', () => {
    const r = { left: 10, top: 10, right: 20, bottom: 20 }
    expect(pointIn(r, 15, 15)).toBe(true)
    expect(pointIn(r, 22, 15)).toBe(false)
    expect(pointIn(r, 22, 15, 3)).toBe(true)
  })
})

describe('prepare the way', () => {
  it('three of five places are the first, the middle and the last; five are all; named places win', () => {
    expect(prepareUsed(PREPARE, { fields: 3 })).toEqual([0, 2, 4])
    expect(prepareUsed(PREPARE, { fields: 5 })).toEqual([0, 1, 2, 3, 4])
    expect(prepareUsed(PREPARE, { fields: 1 })).toEqual([2])
    expect(prepareUsed(PREPARE, { fields: 2 })).toEqual([0, 4])
    expect(prepareUsed(PREPARE, { fields: 3, use: [3, 1, 2] })).toEqual([1, 2, 3])
    expect(prepareUsed(PREPARE, { fields: 9 })).toEqual([0, 1, 2, 3, 4])
  })

  it('the donkey can walk over the places that are covered one after the other', () => {
    expect(prepareReach([])).toBe(0)
    expect(prepareReach([false, true, true])).toBe(0)
    expect(prepareReach([true, false, true])).toBe(1)
    expect(prepareReach([true, true, true])).toBe(3)
  })

  it('the donkey stands at its start, then on the last place that is laid, then at the gate', () => {
    const r1 = PREPARE.rounds[0]!
    expect(prepareDonkeyAt(PREPARE, r1, [false, false, false])).toEqual({ x: 10, y: 80 })
    expect(prepareDonkeyAt(PREPARE, r1, [true, false, false])).toEqual({ x: 24, y: 78 })
    // a place laid ahead of the donkey does not move it
    expect(prepareDonkeyAt(PREPARE, r1, [false, true, false])).toEqual({ x: 10, y: 80 })
    expect(prepareDonkeyAt(PREPARE, r1, [true, true, false])).toEqual({ x: 52, y: 72 })
    const gate = prepareDonkeyAt(PREPARE, r1, [true, true, true])
    expect(gate.x).toBeCloseTo(94 - 14 * 0.7, 6)
    expect(gate.y).toBe(62)
  })

  it('in a slow round the donkey walks up to the edge of the next bare place and waits there', () => {
    const r2 = PREPARE.rounds[1]!
    expect(prepareDonkeyAt(PREPARE, r2, [false, false, false, false, false]).x).toBeCloseTo(24 - 10 * 0.7, 6)
    expect(prepareDonkeyAt(PREPARE, r2, [true, false, false, false, false])).toEqual({ x: 38 - 7, y: 74 })
    expect(prepareDonkeyAt(PREPARE, r2, [true, true, true, true, true]).y).toBe(62)
  })

  it('cloaks and branches take turns through their pictures; a stone is always the stone', () => {
    expect(prepareSprite(PREPARE, 'cloak', 0).image).toBe('mantel-1')
    expect(prepareSprite(PREPARE, 'cloak', 4).image).toBe('mantel-2')
    expect(prepareSprite(PREPARE, 'branch', 3).image).toBe('zweig-2')
    expect(prepareSprite(PREPARE, 'stone', 7).image).toBe('stein')
  })

  it('a drop: cloak or branches on a bare place are laid; a stone is a mistake; a covered place takes nothing (no mistake)', () => {
    expect(prepareDrop('cloak', false)).toBe('lay')
    expect(prepareDrop('branch', false)).toBe('lay')
    expect(prepareDrop('stone', false)).toBe('stone')
    expect(prepareDrop('cloak', true)).toBe('full')
    expect(prepareDrop('stone', true)).toBe('full')
  })

  it('the checks of the data find places out of order, a gate left of the road and a round 2 that is not longer', () => {
    expect(prepareProblems(PREPARE)).toEqual([])
    expect(prepareProblems({ ...PREPARE, spots: PREPARE.spots.slice(0, 4) })).toContain('five bare places are needed')
    const swapped = { ...PREPARE, spots: [PREPARE.spots[1]!, PREPARE.spots[0]!, ...PREPARE.spots.slice(2)] }
    expect(prepareProblems(swapped).some((p) => p.includes('to the right of the one before'))).toBe(true)
    expect(prepareProblems({ ...PREPARE, field: 20 }).some((p) => p.includes('overlap'))).toBe(true)
    expect(prepareProblems({ ...PREPARE, gate: { ...PREPARE.gate, x: 50 } }).some((p) => p.includes('gate must lie right'))).toBe(true)
    expect(prepareProblems({ ...PREPARE, donkey: { ...PREPARE.donkey, x: 30 } }).some((p) => p.includes('donkey must start left'))).toBe(true)
    expect(prepareProblems({ ...PREPARE, rounds: [{ hint: '', fields: 5 }, { hint: '', fields: 3 }] })).toContain('round 2 should have more places than round 1')
    expect(prepareProblems({ ...PREPARE, rounds: [{ hint: '', fields: 3, use: [0, 0, 1] }] }).some((p) => p.includes('named places'))).toBe(true)
    expect(prepareProblems({ ...PREPARE, cloaks: [sprite('m')] })).toContain('three cloaks are needed')
  })
})

describe('fill the lamps', () => {
  it('the tolerance of a round: its own, otherwise ten in round 1 and seven later', () => {
    expect(lampTolerance({}, 0)).toBe(10)
    expect(lampTolerance({}, 1)).toBe(7)
    expect(lampTolerance({}, 5)).toBe(7)
    expect(lampTolerance({ tolerance: 4 }, 0)).toBe(4)
  })

  it('pouring raises the level with the clock and stops at the top; a tap pours a little', () => {
    expect(lampPour(0, 1000)).toBe(LAMP_RATE)
    expect(lampPour(50, 1000)).toBe(50 + LAMP_RATE)
    expect(lampPour(90, 5000)).toBe(100)
    expect(lampPour(10, -50)).toBe(10)
    expect(lampTap(0)).toBe(LAMP_STEP)
    expect(lampTap(98)).toBe(100)
  })

  it('at the mark within the tolerance is right, below it too little, above it too much', () => {
    expect(lampJudge(60, 60, 10)).toBe('ok')
    expect(lampJudge(50, 60, 10)).toBe('ok')
    expect(lampJudge(70, 60, 10)).toBe('ok')
    expect(lampJudge(49.9, 60, 10)).toBe('low')
    expect(lampJudge(70.1, 60, 10)).toBe('high')
    expect(lampJudge(0, 45, 7)).toBe('low')
    expect(lampInWindow(52, 60, 10)).toBe(true)
    expect(lampInWindow(45, 60, 10)).toBe(false)
  })

  it('the ring lies on the glass: the mark counts from the bottom of the glass opening', () => {
    const g = LAMPS.glass
    expect(lampMarkTop(0, g)).toBeCloseTo(88, 6)
    expect(lampMarkTop(100, g)).toBeCloseTo(10, 6)
    expect(lampMarkTop(50, g)).toBeCloseTo(49, 6)
  })

  it('a tap never jumps over the window of the mark (the window is wider than one tap)', () => {
    for (const [i, r] of LAMPS.rounds.entries())
      for (const m of r.marks) {
        let level = 0
        let steps = 0
        while (lampJudge(level, m, lampTolerance(r, i)) === 'low') {
          level = lampTap(level)
          steps++
        }
        expect(lampJudge(level, m, lampTolerance(r, i))).toBe('ok')
        expect(steps).toBeLessThan(14)
      }
  })

  it('about eight taps fill to the middle mark of round 1', () => {
    let level = 0
    let taps = 0
    while (lampJudge(level, 60, 10) === 'low') {
      level = lampTap(level)
      taps++
    }
    expect(taps).toBe(7)
  })

  it('the checks of the data: glass inside the lamp, marks far from the edges and from each other, round 2 narrower', () => {
    expect(lampProblems(LAMPS)).toEqual([])
    expect(lampProblems({ ...LAMPS, glass: { x: 50, y: 10, w: 60, h: 78 } })).toContain('the glass opening lies outside the lamp picture')
    expect(lampProblems({ ...LAMPS, rounds: [{ hint: '', marks: [60, 98] }, LAMPS.rounds[1]!] }).some((p) => p.includes('too low or too high'))).toBe(true)
    expect(lampProblems({ ...LAMPS, rounds: [{ hint: '', marks: [60, 64] }, LAMPS.rounds[1]!] }).some((p) => p.includes('too close'))).toBe(true)
    expect(lampProblems({ ...LAMPS, rounds: [{ hint: '', marks: [60, 80] }, { hint: '', marks: [50, 70], tolerance: 12 }] })).toContain('round 2 needs a narrower tolerance than round 1')
    expect(lampProblems({ ...LAMPS, rounds: [{ hint: '', marks: [60, 80], tolerance: 3 }, { hint: '', marks: [50, 70], tolerance: 2 }] }).some((p) => p.includes('tolerance'))).toBe(true)
  })
})

describe('who needs what', () => {
  it('a card fits the person with the same need', () => {
    expect(helpFits('hunger', 'hunger')).toBe(true)
    expect(helpFits('hunger', 'durst')).toBe(false)
  })

  it('the people of a round and the ones that stand glad from the rounds before', () => {
    expect(helpActive(HELP, 0).map((p) => p.id)).toEqual(['hunger', 'durst', 'fremd'])
    expect(helpActive(HELP, 1).map((p) => p.id)).toEqual(['frieren', 'krank', 'gefangen'])
    expect(helpBefore(HELP, 0)).toEqual([])
    expect(helpBefore(HELP, 1).map((p) => p.id)).toEqual(['hunger', 'durst', 'fremd'])
  })

  it('the box of a person follows the ratio and the 3:2 picture', () => {
    const b = helpBox({ x: 50, y: 80, w: 14 }, 0.7)
    expect(b.left).toBe(43)
    expect(b.right).toBe(57)
    expect(b.bottom).toBe(80)
    expect(b.top).toBeCloseTo(80 - 30, 6)
  })

  it('the checks of the data: six different needs in two rounds of three, sprites of one size, inside the picture, not on top of each other', () => {
    expect(helpProblems(HELP)).toEqual([])
    expect(helpProblems({ ...HELP, people: HELP.people.slice(0, 5) })).toContain('six people are needed')
    expect(helpProblems({ ...HELP, rounds: [HELP.rounds[0]!, { hint: '', people: ['hunger', 'krank', 'gefangen'] }] })).toContain('a person is asked for in two rounds')
    expect(helpProblems({ ...HELP, rounds: [HELP.rounds[0]!, { hint: '', people: ['frieren', 'krank'] }] })).toContain('round 2: three people')
    expect(helpProblems({ ...HELP, people: HELP.people.map((p, i) => (i === 5 ? { ...p, x: 98 } : p)) }).some((p) => p.includes('outside the picture'))).toBe(true)
    expect(helpProblems({ ...HELP, people: HELP.people.map((p, i) => (i === 1 ? { ...p, x: 14 } : p)) }).some((p) => p.includes('overlap'))).toBe(true)
  })
})
