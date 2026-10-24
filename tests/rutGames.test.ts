/**
 * The pure parts of the new games of "Rut" (`utils/rutGames.ts`): the reapers and the clumps, the measure and its mark, the walkers, the rhythm of the cradle.
 */
import { describe, expect, it } from 'vitest'
import {
  CALM_MAX_MS,
  CALM_MIN_MS,
  FILL_MS,
  FILL_TOLERANCE,
  GLEAN_GRACE_MS,
  allWalkersOver,
  cradleState,
  earCount,
  eldersCalled,
  gleanRoundOver,
  isCut,
  judgeLevel,
  levelAt,
  reaperOver,
  reaperX,
  rockAngle,
  rockVerdict,
  seatFor,
  stateBlend,
  walkerOver,
  walkerX
} from '@/utils/rutGames'

describe('gleaning: reapers, clumps, ears', () => {
  const r = { at: 1000, dur: 10000, clumps: [20, 50, 80] }

  it('a reaper is not there before his start, enters at the left edge, crosses at a steady pace and has left at the right edge', () => {
    expect(reaperX(999, r)).toBeNull()
    expect(reaperX(1000, r)).toBeCloseTo(-8)
    expect(reaperX(6000, r)).toBeCloseTo(50)
    expect(reaperX(11000, r)).toBeCloseTo(108)
    expect(reaperX(99999, r)).toBeCloseTo(108)
    expect(reaperOver(10999, r)).toBe(false)
    expect(reaperOver(11000, r)).toBe(true)
  })

  it('a clump is cut when the reaper has come to it, never before he has started', () => {
    expect(isCut(20, null)).toBe(false)
    expect(isCut(20, 19.9)).toBe(false)
    expect(isCut(20, 20)).toBe(true)
    expect(isCut(80, 50)).toBe(false)
    // in time: the middle clump falls when the reaper is at 50 percent
    expect(isCut(50, reaperX(5999, r))).toBe(false)
    expect(isCut(50, reaperX(6000, r))).toBe(true)
  })

  it('an ear stays for every clump', () => {
    expect(earCount([r, { clumps: [10, 40] }])).toBe(5)
    expect(earCount([])).toBe(0)
  })

  it('the round ends when every reaper has gone by and every ear is picked, or the grace time after the last reaper has run out; never earlier', () => {
    const two = [r, { at: 3000, dur: 10000, clumps: [30, 60] }]
    expect(gleanRoundOver(5000, two, 0)).toBe(false)
    expect(gleanRoundOver(13000, two, 5)).toBe(true)
    expect(gleanRoundOver(13000, two, 4)).toBe(false)
    expect(gleanRoundOver(13000 + GLEAN_GRACE_MS - 1, two, 4)).toBe(false)
    expect(gleanRoundOver(13000 + GLEAN_GRACE_MS, two, 4)).toBe(true)
    // all picked but a reaper is still on his way: not over
    expect(gleanRoundOver(11500, two, 5)).toBe(false)
  })
})

describe('fill the measure', () => {
  it('the grain needs about four seconds from empty to the brim and the level never goes below empty', () => {
    expect(FILL_MS).toBeGreaterThanOrEqual(3500)
    expect(FILL_MS).toBeLessThanOrEqual(5000)
    expect(levelAt(0)).toBe(0)
    expect(levelAt(-50)).toBe(0)
    expect(levelAt(FILL_MS / 2)).toBeCloseTo(0.5)
    expect(levelAt(FILL_MS)).toBeCloseTo(1)
  })

  it('too little keeps going, within eight percent of the mark lets go, more spills', () => {
    expect(FILL_TOLERANCE).toBeCloseTo(0.08)
    expect(judgeLevel(0.5, 1)).toBe('low')
    expect(judgeLevel(0.91, 1)).toBe('low')
    expect(judgeLevel(0.92, 1)).toBe('ok')
    expect(judgeLevel(1, 1)).toBe('ok')
    expect(judgeLevel(1.08, 1)).toBe('ok')
    expect(judgeLevel(1.09, 1)).toBe('high')
    expect(judgeLevel(0.42, 0.5)).toBe('ok')
    expect(judgeLevel(0.41, 0.5)).toBe('low')
    expect(judgeLevel(0.59, 0.5)).toBe('high')
  })

  it('the window to let go of is wide enough for a child: at least a quarter of a second', () => {
    expect(2 * FILL_TOLERANCE * FILL_MS).toBeGreaterThanOrEqual(250)
  })

  it('the five pictures: the two nearest ones and how far on the way, empty and full alone', () => {
    expect(stateBlend(0)).toEqual({ lo: 0, hi: 1, t: 0 })
    expect(stateBlend(0.5)).toEqual({ lo: 2, hi: 3, t: 0 })
    expect(stateBlend(0.125).lo).toBe(0)
    expect(stateBlend(0.125).t).toBeCloseTo(0.5)
    expect(stateBlend(1)).toEqual({ lo: 4, hi: 4, t: 0 })
    expect(stateBlend(1.4)).toEqual({ lo: 4, hi: 4, t: 0 })
    expect(stateBlend(-1)).toEqual({ lo: 0, hi: 1, t: 0 })
  })
})

describe('call the elders: walkers and seats', () => {
  const w = { at: 500, dur: 9000 }
  it('a walker enters at the left edge, crosses at a steady pace and has left at the right edge', () => {
    expect(walkerX(499, w)).toBeNull()
    expect(walkerX(500, w)).toBeCloseTo(-8)
    expect(walkerX(5000, w)).toBeCloseTo(50)
    expect(walkerX(9500, w)).toBeCloseTo(108)
    expect(walkerOver(9499, w)).toBe(false)
    expect(walkerOver(9500, w)).toBe(true)
  })

  it('the round is done when all of its elders have been called (the others do not count); people who were called do not have to go by again', () => {
    const list = [{ kind: 'other' as const }, { kind: 'elder' as const }, { kind: 'elder' as const }, { kind: 'other' as const }]
    expect(eldersCalled(list, 1)).toBe(false)
    expect(eldersCalled(list, 2)).toBe(true)
    const timed = [
      { at: 0, dur: 1000 },
      { at: 500, dur: 1000 },
      { at: 1000, dur: 1000 }
    ]
    expect(allWalkersOver(1500, timed, new Set())).toBe(false)
    expect(allWalkersOver(1500, timed, new Set([2]))).toBe(true)
    expect(allWalkersOver(2000, timed, new Set())).toBe(true)
  })

  it('the n-th called elder goes to the n-th seat, and the last seat holds if there are more calls than seats', () => {
    const seats = [{ x: 1 }, { x: 2 }, { x: 3 }]
    expect(seatFor(0, seats).x).toBe(1)
    expect(seatFor(2, seats).x).toBe(3)
    expect(seatFor(9, seats).x).toBe(3)
    expect(seatFor(-1, seats).x).toBe(1)
  })
})

describe('rock the cradle', () => {
  it('the first rock is only a start; the other side after a calm pause is calm; the same side or a rock that is too fast is restless; a long break is a new start', () => {
    expect(rockVerdict(null, 'left', null)).toBe('first')
    expect(rockVerdict('left', 'right', 1000)).toBe('calm')
    expect(rockVerdict('left', 'right', CALM_MIN_MS)).toBe('calm')
    expect(rockVerdict('left', 'right', CALM_MAX_MS)).toBe('calm')
    expect(rockVerdict('left', 'right', CALM_MIN_MS - 1)).toBe('fast')
    expect(rockVerdict('left', 'left', 1000)).toBe('same')
    expect(rockVerdict('left', 'left', 100)).toBe('same')
    expect(rockVerdict('left', 'right', CALM_MAX_MS + 1)).toBe('slow')
    expect(rockVerdict('left', 'left', CALM_MAX_MS + 1)).toBe('slow')
  })

  it('the calm gap is wide enough for a child (at least a second of room) and not so long that it gets boring', () => {
    expect(CALM_MAX_MS - CALM_MIN_MS).toBeGreaterThanOrEqual(1000)
    expect(CALM_MAX_MS).toBeLessThanOrEqual(2400)
  })

  it('the baby is awake at the start, sleepy after a third (at most eight rocks) and asleep only at the very end', () => {
    expect(cradleState(0, 24)).toBe(0)
    expect(cradleState(7, 24)).toBe(0)
    expect(cradleState(8, 24)).toBe(1)
    expect(cradleState(23, 24)).toBe(1)
    expect(cradleState(24, 24)).toBe(2)
    expect(cradleState(3, 9)).toBe(1)
  })

  it('the cradle swings to the side that was tapped, less with reduced motion, and stands still without a tap', () => {
    expect(rockAngle(null, false)).toBe(0)
    expect(rockAngle('left', false)).toBeLessThan(0)
    expect(rockAngle('right', false)).toBeGreaterThan(0)
    expect(Math.abs(rockAngle('left', true))).toBeLessThan(Math.abs(rockAngle('left', false)))
  })
})
