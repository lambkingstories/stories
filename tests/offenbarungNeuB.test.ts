/**
 * The logic of two games of "Alles wird neu" (`offenbarung`): "Palm branches" (`palmen`) and "Twelve pearl gates" (`perlentore`).
 */
import { describe, expect, it } from 'vitest'
import {
  PALMS_END,
  gatesDrop,
  gatesKey,
  gatesOpeningAt,
  gatesProblems,
  gatesTip,
  gatesWanted,
  palmsIdeal,
  palmsProblems,
  palmsTempo,
  palmsUp,
  palmsWindow,
  strokeStart,
  strokeTick
} from '@/utils/offenbarungNeuB'
import type { Stroke } from '@/utils/offenbarungNeuB'
import { GATES, PALMS } from './offenbarungSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/** A stroke from `from` to the end at `v` widths a second, a tick every 50 ms; returns the stroke. */
function sweep(v: number, win: readonly [number, number], from = 0.05, cols = 11, to = 1): Stroke {
  let t = 0
  const s = strokeStart(cols, from, t)
  let x = from
  for (let i = 0; i < 400 && !s.done && !s.fail; i++) {
    t += 50
    x = Math.min(to, x + (v * 50) / 1000)
    strokeTick(s, win, x, t, from)
  }
  return s
}

describe('palmen: the speed of the stroke', () => {
  it('the samples are playable', () => {
    expect(palmsProblems(PALMS)).toEqual([])
  })

  it('too slow, right, too fast; with less motion the window is twice as wide', () => {
    expect(palmsTempo(0.1, [0.25, 0.6])).toBe('slow')
    expect(palmsTempo(0.4, [0.25, 0.6])).toBe('ok')
    expect(palmsTempo(0.9, [0.25, 0.6])).toBe('fast')
    const wide = palmsWindow([0.25, 0.6], true)
    expect(wide[1] - wide[0]).toBeCloseTo(2 * (0.6 - 0.25))
    expect(palmsTempo(0.9, wide)).toBe('fast')
    expect(palmsTempo(0.7, wide)).toBe('ok')
    expect(palmsIdeal([0.25, 0.6])).toBeCloseTo(0.425)
  })

  it('a stroke at the right speed reaches the end and raises every person', () => {
    const s = sweep(0.42, [0.25, 0.6])
    expect(s.done).toBe(true)
    expect(s.fail).toBeNull()
    expect(s.front).toBeGreaterThanOrEqual(PALMS_END)
    expect(s.raised.every((r) => r !== null)).toBe(true)
    expect(s.skipped.some(Boolean)).toBe(false)
  })

  it('a lightning stroke skips people and fails as too fast', () => {
    const s = sweep(4, [0.25, 0.6])
    expect(s.done).toBe(false)
    expect(s.fail).toBe('fast')
    expect(s.skipped.some(Boolean)).toBe(true)
  })

  it('a stroke that is much too fast fails before the end', () => {
    const s = sweep(1.6, [0.25, 0.6])
    expect(s.fail).toBe('fast')
    expect(s.done).toBe(false)
  })

  it('a stroke that is too slow fails as too slow', () => {
    const s = sweep(0.1, [0.25, 0.6])
    expect(s.fail).toBe('slow')
    expect(s.done).toBe(false)
    expect(s.front).toBeLessThan(0.7)
  })

  it('a short hurry does not break the wave (the speed must be wrong for 0.6 seconds)', () => {
    let t = 0
    const s = strokeStart(11, 0.05, t)
    const win: [number, number] = [0.25, 0.6]
    let x = 0.05
    const speeds = [...Array(10).fill(0.42), ...Array(3).fill(0.8), ...Array(60).fill(0.42)]
    for (const v of speeds) {
      t += 50
      x = Math.min(1, x + (v * 50) / 1000)
      strokeTick(s, win, x, t, 0.05)
      if (s.done || s.fail) break
    }
    expect(s.fail).toBeNull()
  })

  it('a finger that waits at the start is not judged "slow" until it has moved on', () => {
    let t = 0
    const s = strokeStart(11, 0.05, t)
    for (let i = 0; i < 40; i++) {
      t += 50
      strokeTick(s, [0.25, 0.6], 0.05, t, 0.05)
    }
    expect(s.fail).toBeNull()
    expect(s.tempo).toBeNull()
  })

  it('the branches stay up for `hold` milliseconds', () => {
    expect(palmsUp(900, 1000, 1500)).toBe(true)
    expect(palmsUp(900, 1000, 1900)).toBe(false)
    expect(palmsUp(900, null, 1500)).toBe(false)
  })

  it('the people are raised one after the other, left to right', () => {
    const s = strokeStart(10, 0.02, 0)
    strokeTick(s, [0.25, 0.6], 0.2, 50, 0.02)
    strokeTick(s, [0.25, 0.6], 0.4, 100, 0.02)
    const up = s.raised.map((r) => r !== null)
    expect(up.slice(5)).toEqual([false, false, false, false, false])
    expect(up[0] || up[1] || up[2] || s.skipped.some(Boolean)).toBe(true)
  })

  it('damaged data are found', () => {
    const a = copy(PALMS)
    a.rounds[1]!.waves[0]!.speed = [0.3, 0.4]
    expect(palmsProblems(a).join(' ')).toContain('too narrow')
    const b = copy(PALMS)
    b.rows[1]!.y = 70
    expect(palmsProblems(b).join(' ')).toContain('should lie behind')
    const c = copy(PALMS)
    c.rounds[0]!.waves.pop()
    expect(palmsProblems(c).join(' ')).toContain('two waves')
    const d = copy(PALMS)
    d.rounds[1]!.waves[2]!.speed = [0.3, 0.9]
    expect(palmsProblems(d).join(' ')).toContain('back row')
    const e = copy(PALMS)
    e.cols = 30
    expect(palmsProblems(e).join(' ')).toContain('8 to 14')
    const f = copy(PALMS)
    f.hold = 100
    expect(palmsProblems(f).join(' ')).toContain('stay up')
  })
})

describe('perlentore: the sides, the openings and the gates', () => {
  it('the samples are playable', () => {
    expect(gatesProblems(GATES)).toEqual([])
  })

  it('the side that is asked for is the first of the round that has no three gates yet', () => {
    const r = GATES.rounds[0]!
    expect(gatesWanted(r, new Set())).toBe('morgen')
    expect(gatesWanted(r, new Set([gatesKey('morgen', 0), gatesKey('morgen', 1)]))).toBe('morgen')
    expect(gatesWanted(r, new Set(['morgen-0', 'morgen-1', 'morgen-2']))).toBe('abend')
    expect(gatesWanted(r, new Set(['morgen-0', 'morgen-1', 'morgen-2', 'abend-0', 'abend-1', 'abend-2']))).toBeNull()
    expect(gatesWanted(GATES.rounds[1]!, new Set(['morgen-0', 'morgen-1', 'morgen-2']))).toBe('mitternacht')
  })

  it('a gate fits only the side that is asked for; a taken opening is no mistake', () => {
    const none = new Set<string>()
    expect(gatesDrop('morgen', none, 'morgen', 1)).toBe('ok')
    expect(gatesDrop('morgen', none, 'abend', 1)).toBe('wrong')
    expect(gatesDrop('morgen', none, 'mittag', 0)).toBe('wrong')
    expect(gatesDrop('morgen', new Set(['morgen-1']), 'morgen', 1)).toBe('taken')
    expect(gatesDrop('morgen', new Set(['abend-1']), 'abend', 1)).toBe('taken')
    expect(gatesDrop(null, none, 'morgen', 0)).toBe('wrong')
  })

  it('the opening nearest to a drop within its reach is found; beside the openings nothing', () => {
    expect(gatesOpeningAt(GATES, { x: 88, y: 36 })).toEqual({ side: 'morgen', i: 1 })
    expect(gatesOpeningAt(GATES, { x: 84, y: 38 })).toEqual({ side: 'morgen', i: 1 })
    expect(gatesOpeningAt(GATES, { x: 50, y: 50 })).toBeNull()
    expect(gatesOpeningAt(GATES, { x: 49, y: 15 })).toEqual({ side: 'mitternacht', i: 1 })
  })

  it('the tips of the compass rose point at the sides', () => {
    const e = gatesTip(GATES, GATES.sides[0]!)
    const w = gatesTip(GATES, GATES.sides[1]!)
    const n = gatesTip(GATES, GATES.sides[2]!)
    const s = gatesTip(GATES, GATES.sides[3]!)
    expect(e.x).toBeGreaterThan(GATES.roseAt.x)
    expect(w.x).toBeLessThan(GATES.roseAt.x)
    expect(n.y).toBeLessThan(GATES.roseAt.y)
    expect(s.y).toBeGreaterThan(GATES.roseAt.y)
  })

  it('damaged data are found', () => {
    const a = copy(GATES)
    a.sides[0]!.openings[1] = { x: 88, y: 22 }
    expect(gatesProblems(a).join(' ')).toContain('too close together')
    const b = copy(GATES)
    b.rounds[1]!.order = ['morgen', 'mittag']
    expect(gatesProblems(b).join(' ')).toContain('every side once')
    const c = copy(GATES)
    c.sides[3]!.openings.pop()
    expect(gatesProblems(c).join(' ')).toContain('three openings')
    const d = copy(GATES)
    d.openR = 2
    expect(gatesProblems(d).join(' ')).toContain('too small for a finger')
    const e = copy(GATES)
    e.roseAt = { x: 88, y: 45 }
    expect(gatesProblems(e).join(' ')).toContain('under the compass rose')
    const f = copy(GATES)
    f.sides[2]!.part = ''
    expect(gatesProblems(f).join(' ')).toContain('no word')
  })
})
