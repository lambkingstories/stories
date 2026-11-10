/**
 * The logic of the game "Who is coming?" (`ausschau`, field `lookout`) of "Der verlorene Sohn" (`sohn`): the arithmetic of the walkers on the road is pure,
 * the check of the data (`lookoutProblems`) accepts the sample and names what is wrong in damaged copies.
 */
import { describe, expect, it } from 'vitest'
import {
  LOOKOUT_LEAVE_MS,
  LOOKOUT_MAX_MS,
  lookoutBoxPx,
  lookoutHaze,
  lookoutIsSon,
  lookoutLeaveShare,
  lookoutPhase,
  lookoutProblems,
  lookoutProgress,
  lookoutRoundEnd,
  lookoutSonOf,
  lookoutSpot,
  lookoutTouchBox,
  offDist
} from '@/utils/sohnNeuA'
import type { LookoutGame } from '@/utils/sohnNeuA'
import { LOOKOUT } from './sohnSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('offDist', () => {
  it('shortens the vertical difference by the ratio of the picture', () => {
    expect(offDist({ x: 0, y: 0 }, { x: 30, y: 0 }, 1.5)).toBeCloseTo(30)
    expect(offDist({ x: 0, y: 0 }, { x: 0, y: 30 }, 1.5)).toBeCloseTo(20)
  })
})

describe('ausschau: the walkers on the road', () => {
  const lane = LOOKOUT.lanes[1]!

  it('the sample is playable', () => {
    expect(lookoutProblems(LOOKOUT)).toEqual([])
  })

  it('progress runs from 0 at the start to 1 at the gate and stays there', () => {
    const a = { delay: 9000, dur: 19000 }
    expect(lookoutProgress(a, 0)).toBe(0)
    expect(lookoutProgress(a, 9000)).toBe(0)
    expect(lookoutProgress(a, 18500)).toBeCloseTo(0.5)
    expect(lookoutProgress(a, 28000)).toBe(1)
    expect(lookoutProgress(a, 99999)).toBe(1)
  })

  it('the figure grows and comes down the picture; coming nearer is bent a little (slow far away, quicker near)', () => {
    const far = lookoutSpot(lane, 0)
    const half = lookoutSpot(lane, 0.5)
    const near = lookoutSpot(lane, 1)
    expect(far).toEqual({ x: 50, y: 40.5, w: 3.2 })
    expect(near.w).toBe(19)
    expect(near.y).toBe(94)
    expect(half.w).toBeGreaterThan(far.w)
    expect(half.w).toBeLessThan((far.w + near.w) / 2)
    expect(lookoutSpot(lane, -3)).toEqual(far)
    expect(lookoutSpot(lane, 3)).toEqual(near)
  })

  it('far away a walker is pale, blurred and without much colour; near he is clear and coloured', () => {
    const far = lookoutHaze(0)
    const near = lookoutHaze(1)
    expect(far.opacity).toBeLessThan(0.6)
    expect(far.blur).toBeGreaterThan(2)
    expect(far.saturate).toBeLessThan(0.4)
    expect(near).toEqual({ opacity: 1, blur: 0, saturate: 1 })
    expect(lookoutHaze(0.35).blur).toBeLessThan(far.blur)
  })

  it('the son waits at the gate; the others leave to the side and are gone after a short time', () => {
    const a = { walker: 'frau', lane: 2, delay: 1000, dur: 5000 }
    expect(lookoutPhase(a, 500, false)).toBe('before')
    expect(lookoutPhase(a, 3000, false)).toBe('walk')
    expect(lookoutPhase(a, 6200, false)).toBe('leave')
    expect(lookoutPhase(a, 6000 + LOOKOUT_LEAVE_MS, false)).toBe('gone')
    expect(lookoutPhase(a, 99999, true)).toBe('stand')
    expect(lookoutLeaveShare(a, 5000)).toBe(0)
    expect(lookoutLeaveShare(a, 6000 + LOOKOUT_LEAVE_MS / 2)).toBeCloseTo(0.5)
    expect(lookoutLeaveShare(a, 99999)).toBe(1)
  })

  it('the end of a round, the son of a round and the right tap', () => {
    expect(lookoutRoundEnd(LOOKOUT.rounds[0]!)).toBe(33000)
    expect(lookoutRoundEnd(LOOKOUT.rounds[1]!)).toBe(33000)
    expect(lookoutRoundEnd({ order: [] })).toBe(0)
    expect(lookoutSonOf(LOOKOUT.rounds[0]!)).toEqual({ walker: 'sohn', lane: 1, delay: 9000, dur: 19000 })
    expect(lookoutIsSon(LOOKOUT.rounds[0]!, 'sohn')).toBe(true)
    expect(lookoutIsSon(LOOKOUT.rounds[0]!, 'haendler')).toBe(false)
  })

  it('a finger target is at least 44 pixels, even when the figure is tiny', () => {
    const tiny = lookoutBoxPx({ x: 50, y: 41, w: 3 }, 0.667)
    expect(tiny.w).toBeLessThan(12)
    const box = lookoutTouchBox({ x: 50, y: 41, w: 3 }, 0.667, 1.5)
    expect(box.right - box.left).toBe(44)
    expect(box.bottom - box.top).toBe(44)
    const big = lookoutTouchBox({ x: 50, y: 94, w: 19 }, 0.667, 1.5)
    expect(big.right - big.left).toBeCloseTo(68.4)
  })
})

describe('ausschau: the check of the data finds what would make the game unplayable', () => {
  const bad = (mutate: (g: LookoutGame) => void): string => {
    const g = copy(LOOKOUT)
    mutate(g)
    return lookoutProblems(g).join(' | ')
  }

  it('exactly one son in every round, and he is not the first to come', () => {
    expect(bad((g) => g.rounds[0]!.order.push({ walker: 'sohn', lane: 0, delay: 40000, dur: 10000 }))).toContain('exactly one son')
    expect(bad((g) => g.rounds[0]!.order.splice(2, 1))).toContain('exactly one son')
    expect(bad((g) => (g.rounds[0]!.order[2]!.delay = 0))).toContain('must not be the first')
    expect(bad((g) => (g.rounds[0]!.son = 'hirte'))).toContain('the son must be')
  })

  it('somebody still comes after the son', () => {
    expect(bad((g) => g.rounds[0]!.order.pop())).toContain('somebody should still come after the son')
  })

  it('lanes: at least three, inside the picture, growing and leading down; big enough at the gate', () => {
    expect(bad((g) => g.lanes.pop())).toContain('at least three lanes')
    expect(bad((g) => (g.lanes[0]!.to.x = 99))).toContain('reaches out of the picture')
    expect(bad((g) => (g.lanes[0]!.to.w = 2))).toContain('the figure must grow')
    expect(bad((g) => (g.lanes[0]!.to.w = 9))).toContain('smaller than 40 pixels')
    expect(bad((g) => (g.lanes[2]!.from.y = 95))).toContain('must lead down')
  })

  it('times: a round lasts at most 70 seconds, a walker needs 6 to 30 seconds, two walkers are not on one lane at once', () => {
    expect(bad((g) => (g.rounds[0]!.order[3]!.delay = 70000))).toContain(`longer than ${LOOKOUT_MAX_MS / 1000} seconds`)
    expect(bad((g) => (g.rounds[0]!.order[0]!.dur = 3000))).toContain('6 to 30 seconds')
    expect(bad((g) => (g.rounds[0]!.order[3]!.delay = 10000))).toContain('on lane 1 at the same time')
  })

  it('rounds: two, the second with more and quicker walkers; a walker comes only once; the pictures are named', () => {
    expect(bad((g) => g.rounds.pop())).toContain('two rounds')
    expect(bad((g) => g.rounds[1]!.order.splice(4, 2))).toContain('not enough walkers')
    expect(bad((g) => g.rounds[1]!.order.splice(0, 6, ...copy(g.rounds[0]!.order)))).toContain('more walkers than round 1')
    expect(bad((g) => g.rounds[1]!.order.forEach((a) => (a.dur += 8000)))).toContain('faster')
    expect(bad((g) => g.rounds[0]!.order.push({ walker: 'frau', lane: 1, delay: 40000, dur: 9000 }))).toContain('comes twice')
    expect(bad((g) => (g.background = ''))).toContain('no picture of the road')
    expect(bad((g) => (g.walkers[0]!.image = ''))).toContain('has no picture')
  })

  it('nobody ends where the son waits (the finger targets would overlap), and the son is not covered by a nearer walker for long', () => {
    // a walker who ends on the lane of the son
    expect(
      bad((g) => {
        g.lanes[0]!.to = { x: 50, y: 94, w: 19 }
      })
    ).toContain('ends where the son waits')
    // a nearer walker who walks right in front of the son for most of his way
    expect(
      bad((g) => {
        g.lanes[2] = copy(g.lanes[1]!)
        g.lanes[2]!.to = { x: 50, y: 99, w: 19 }
        g.rounds[0]!.order[1]!.delay = 9000
        g.rounds[0]!.order[1]!.dur = 19000
      })
    ).toMatch(/covered by a nearer walker|ends where the son waits/)
  })
})
