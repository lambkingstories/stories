/**
 * The arithmetic of the two new games of "Jesu Wunder am See" (`utils/wunderNeu.ts`, Anton's plan of 5.11.2026): "The hem" (`saum`, Mark 5,25-34) and "Along the shore" (`ufer`, Mark 6,30-34).
 * Sample data like the real ones; the real data are checked in `wunderData.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import {
  SAUM_MIN_WINDOW,
  UFER_GOAL_R,
  saumCovered,
  saumHelpAt,
  saumHem,
  saumHiddenAtHand,
  saumJesusX,
  saumProblems,
  saumTap,
  saumWindows,
  uferAlong,
  uferBegin,
  uferBlock,
  uferHelpRoute,
  uferInPoly,
  uferLength,
  uferMove,
  uferProblems,
  uferRoute,
  uferShare,
  uferSimulate,
  uferStart,
  uferStraightBlocked,
  wunderDist
} from '@/utils/wunderNeu'
import type { SaumGame, UferGame, UferState } from '@/utils/wunderNeu'

const S = (label: string, w = 18) => ({ image: `x/${label}.webp`, label, w })

export const SAUM: SaumGame = {
  background: 'x/strasse.webp',
  road: 88,
  jesus: S('Jesus', 22),
  hem: { x: 30, y: 85 },
  woman: { ...S('Die Frau', 18), x: 42, y: 88 },
  touch: { x: 50, y: 83 },
  people: [S('Mann', 20), S('Frau mit Krug', 20), S('Alter Mann', 20), S('Junge', 15)],
  rounds: [
    { hint: 'Tippe auf den Saum.', duration: 9, pause: 1.5, reach: 9, hemR: 7, sway: 1, ring: true, walkers: [] },
    {
      hint: 'Schneller.',
      duration: 6.5,
      pause: 1.2,
      reach: 8,
      hemR: 6.5,
      sway: 2,
      walkers: [
        { person: 0, lane: 97, from: 110, to: -10, at: 0.9, dur: 4 },
        { person: 3, lane: 98, from: -10, to: 110, at: 0.2, dur: 3 }
      ]
    }
  ]
}

describe('Der Saum (saum)', () => {
  const r1 = SAUM.rounds[0]!
  const r2 = SAUM.rounds[1]!

  it('the sample data are in order', () => {
    expect(saumProblems(SAUM)).toEqual([])
  })

  it('Jesus walks in at the left and out at the right, then he is away for the pause', () => {
    expect(saumJesusX(SAUM, r1, 0)).toBeCloseTo(-12, 5)
    expect(saumJesusX(SAUM, r1, 4.5)).toBeCloseTo(50, 5)
    expect(saumJesusX(SAUM, r1, 9.2)).toBeNull()
    expect(saumJesusX(SAUM, r1, 10.5)).toBeCloseTo(-12, 5) // he comes again
    const hem = saumHem(SAUM, r1, 4.5)!
    expect(hem.x).toBeCloseTo(50 - 11 + 6.6, 5)
  })

  it('a tap on the hem at the fingers is a touch; before and after them too early or too late; beside the hem a miss; while he is away: wait', () => {
    const win = saumWindows(SAUM, r1)
    expect(win).toHaveLength(1)
    const mid = (win[0]![0] + win[0]![1]) / 2
    const hem = saumHem(SAUM, r1, mid)!
    expect(saumTap(SAUM, r1, mid, hem)).toBe('touch')
    expect(saumTap(SAUM, r1, mid, null)).toBe('touch')
    expect(saumTap(SAUM, r1, mid, { x: hem.x + 5, y: hem.y })).toBe('touch') // inside the tap circle
    expect(saumTap(SAUM, r1, mid, { x: hem.x, y: hem.y - 20 })).toBe('miss')
    expect(saumTap(SAUM, r1, win[0]![0] - 0.3, null)).toBe('early')
    expect(saumTap(SAUM, r1, win[0]![1] + 0.3, null)).toBe('late')
    expect(saumTap(SAUM, r1, 9.8, { x: 50, y: 80 })).toBe('wait')
  })

  it('somebody walking in front hides the hem (no mistake); round 2 has a shorter moment', () => {
    expect(saumHiddenAtHand(SAUM, r2)).toBeGreaterThan(0.1)
    let hidden = -1
    for (let t = 0; t < r2.duration; t += 0.01) {
      const hem = saumHem(SAUM, r2, t)!
      if (hem && Math.abs(hem.x - SAUM.touch.x) <= r2.reach && saumCovered(SAUM, r2, t, hem) >= 0) {
        hidden = t
        break
      }
    }
    expect(hidden).toBeGreaterThan(0)
    expect(saumTap(SAUM, r2, hidden, null)).toBe('covered')
    const long = (w: [number, number][]) => Math.max(...w.map(([a, b]) => b - a))
    expect(long(saumWindows(SAUM, r2))).toBeLessThan(long(saumWindows(SAUM, r1)))
    expect(long(saumWindows(SAUM, r2))).toBeGreaterThanOrEqual(SAUM_MIN_WINDOW)
  })

  it('the help finds the next good moment, also in the next passing', () => {
    const a = saumHelpAt(SAUM, r2, 0)!
    expect(saumTap(SAUM, r2, a, null)).toBe('touch')
    const b = saumHelpAt(SAUM, r2, a + 0.5)!
    expect(b).toBeCloseTo(a + r2.duration + r2.pause, 5)
    expect(saumTap(SAUM, r2, b, null)).toBe('touch')
  })

  it('the check finds bad data', () => {
    const bad: SaumGame = { ...SAUM, touch: { x: 50, y: 40 }, rounds: [{ ...r1, hemR: 4 }, { ...r2, walkers: [], ring: true }] }
    const p = saumProblems(bad)
    expect(p.some((x) => x.includes('height of the hem'))).toBe(true)
    expect(p.some((x) => x.includes('tap circle'))).toBe(true)
    expect(p.some((x) => x.includes('more people walking'))).toBe(true)
    expect(p.some((x) => x.includes('ring'))).toBe(true)
  })
})

const LAKE = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 0, y: 40 }]
export const UFER: UferGame = {
  rocks: [S('Felsbrocken', 16), S('Zwei Felsen', 16), S('Hoher Felsen', 16), S('Runder Felsen', 16)],
  crowd: S('Die Menge', 14),
  boat: S('Das Boot', 18),
  pad: 2,
  rounds: [
    {
      hint: 'Zeichne den Weg.',
      background: 'x/ufer-1.webp',
      water: [LAKE],
      rocks: [{ rock: 0, x: 50, y: 66, w: 16, r: 6 }, { rock: 1, x: 30, y: 86, w: 14, r: 5 }],
      start: { x: 8, y: 70 },
      goal: { x: 92, y: 60 },
      boatFrom: { x: 15, y: 20 },
      boatTo: { x: 88, y: 30 }
    },
    {
      hint: 'Um die Bucht.',
      background: 'x/ufer-2.webp',
      water: [LAKE, [{ x: 35, y: 39 }, { x: 65, y: 39 }, { x: 62, y: 70 }, { x: 38, y: 70 }]],
      rocks: [{ rock: 0, x: 30, y: 84, w: 14, r: 5 }, { rock: 2, x: 70, y: 84, w: 14, r: 5 }, { rock: 3, x: 50, y: 94, w: 12, r: 3.5 }],
      start: { x: 8, y: 86 },
      goal: { x: 92, y: 60 },
      boatFrom: { x: 15, y: 20 },
      boatTo: { x: 88, y: 30 }
    }
  ]
}

describe('Am Ufer entlang (ufer)', () => {
  const r1 = UFER.rounds[0]!
  const r2 = UFER.rounds[1]!

  it('the sample data are in order', () => {
    expect(uferProblems(UFER)).toEqual([])
  })

  it('the water, the rocks and the edge block a place; the open shore is free', () => {
    expect(uferInPoly({ x: 50, y: 20 }, LAKE)).toBe(true)
    expect(uferInPoly({ x: 50, y: 60 }, LAKE)).toBe(false)
    expect(uferBlock(UFER, r1, { x: 50, y: 20 })).toEqual({ kind: 'water' })
    expect(uferBlock(UFER, r1, { x: 50, y: 42 })).toEqual({ kind: 'water' }) // the way is two units wide on each side
    expect(uferBlock(UFER, r1, { x: 50, y: 66 })).toEqual({ kind: 'rock', index: 0 })
    expect(uferBlock(UFER, r1, { x: 0.2, y: 66 })).toEqual({ kind: 'edge' })
    expect(uferBlock(UFER, r1, { x: 70, y: 80 })).toBeNull()
    expect(uferStraightBlocked(UFER, r1)).toBe(true)
  })

  it('the line begins only at the crowd and goes on only at its end', () => {
    let st: UferState = uferStart()
    expect(uferBegin(r1, st, { x: 60, y: 80 }).verdict).toBe('far')
    const b = uferBegin(r1, st, { x: 12, y: 72 })
    expect(b.verdict).toBe('start')
    st = b.state
    expect(st.pts).toEqual([r1.start])
    st = uferMove(UFER, r1, st, { x: 30, y: 72 }).state
    expect(st.pts.length).toBeGreaterThan(20)
    expect(uferBegin(r1, st, { x: 8, y: 70 }).verdict).toBe('far')
    expect(uferBegin(r1, st, { x: 32, y: 73 }).verdict).toBe('continue')
  })

  it('a rock stops the line: one mistake, not again while the finger stays behind it; round it the line goes on; at the landing place it is finished', () => {
    let st = uferBegin(r1, uferStart(), r1.start).state
    st = uferMove(UFER, r1, st, { x: 30, y: 72 }).state
    const hit = uferMove(UFER, r1, st, { x: 70, y: 68 })
    expect(hit.event?.kind).toBe('rock')
    expect(hit.state.blocked).toBe(true)
    const end = hit.state.pts[hit.state.pts.length - 1]!
    expect(wunderDist(end, { x: 50, y: 66 })).toBeGreaterThanOrEqual(6 + 2 - 0.01)
    const again = uferMove(UFER, r1, hit.state, { x: 72, y: 66 })
    expect(again.event).toBeNull()
    // round the rock below it
    let s2 = { ...hit.state }
    for (const p of [{ x: 40, y: 80 }, { x: 60, y: 80 }, { x: 80, y: 70 }]) s2 = uferMove(UFER, r1, s2, p).state
    expect(s2.blocked).toBe(false)
    expect(uferShare(r1, s2)).toBeGreaterThan(0.8)
    const fin = uferMove(UFER, r1, s2, r1.goal)
    expect(fin.event).toEqual({ kind: 'goal' })
    expect(fin.state.reached).toBe(true)
    expect(fin.state.pts[fin.state.pts.length - 1]).toEqual(r1.goal)
  })

  it('the water stops the line too', () => {
    const st = uferBegin(r1, uferStart(), r1.start).state
    const r = uferMove(UFER, r1, st, { x: 20, y: 20 })
    expect(r.event?.kind).toBe('water')
  })

  it('the safe way goes round the bay; the help draws a piece and then the rest without a mistake', () => {
    const route = uferRoute(UFER, r2, r2.start)!
    expect(route).not.toBeNull()
    expect(route.every((p) => !uferBlock(UFER, r2, p))).toBe(true)
    expect(uferLength(route)).toBeGreaterThan(uferLength(uferRoute(UFER, r1, r1.start)!))
    const piece = uferHelpRoute(UFER, r2, uferStart())!
    expect(uferLength(piece)).toBeGreaterThan(40)
    expect(uferLength(piece)).toBeLessThan(48)
    const sim = uferSimulate(UFER, r2)
    expect(sim).toMatchObject({ mistakes: 0, arrived: true })
  })

  it('the crowd walks along the line', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 15 }]
    expect(uferLength(pts)).toBeCloseTo(20, 5)
    expect(uferAlong(pts, 5)).toMatchObject({ x: 5, y: 0 })
    expect(uferAlong(pts, 15)).toMatchObject({ x: 10, y: 7.5 })
    expect(uferAlong(pts, 99)).toMatchObject({ x: 10, y: 15 })
    expect(uferAlong([{ x: 10, y: 0 }, { x: 0, y: 0 }], 2).left).toBe(true)
  })

  it('the check finds bad data', () => {
    const bad: UferGame = { ...UFER, rounds: [{ ...r1, goal: { x: 50, y: 20 } }, { ...r2, rocks: [r2.rocks[0]!] }] }
    const p = uferProblems(bad)
    expect(p.some((x) => x.includes('landing place lies on a rock or in the water'))).toBe(true)
    expect(p.some((x) => x.includes('more rocks'))).toBe(true)
    expect(UFER_GOAL_R).toBeGreaterThan(0)
  })
})
