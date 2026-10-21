/**
 * The pure functions of the new games of "Abraham" (`utils/abrahamGames.ts`): the camels (balance, ways to spread the packs, the tip) and the constellation (which
 * star of the model a laid star belongs to). The games use only these.
 */
import { describe, expect, it } from 'vitest'
import { abraham } from '@/data/adventures/abraham'
import type { Clue } from '@/types/adventure'
import {
  alignedCount,
  BIRDS_ASPECT,
  birdAngle,
  blurAt,
  claim,
  clueHolds,
  cluesSolutions,
  distToLine,
  frameRatio,
  hitTarget,
  holding,
  isAligned,
  isBalanced,
  isExact,
  isSharp,
  lineEnd,
  matches,
  onRay,
  ringsSolvable,
  rotateRing,
  sharpness,
  solutions,
  solveRings,
  solvable,
  splits,
  tip,
  total
} from '@/utils/abrahamGames'

describe('camels: balance', () => {
  it('both sides weigh the same (and something lies in the baskets)', () => {
    expect(isBalanced([1, 2], [3])).toBe(true)
    expect(isBalanced([3], [1, 1])).toBe(false)
    expect(isBalanced([], [])).toBe(false)
    expect(isBalanced([2, 2], [2, 2])).toBe(true)
  })

  it('finds every way to spread the weights (a mirror image counts as another way) and knows what cannot be balanced', () => {
    expect(splits([1, 2, 3])).toEqual([
      ['left', 'left', 'right'],
      ['right', 'right', 'left']
    ])
    expect(solvable([1, 1, 2])).toBe(true)
    // an odd sum cannot be halved; 2 + 2 + 2 cannot either (three equal packs never split evenly)
    expect(solvable([1, 2, 2])).toBe(false)
    expect(solvable([2, 2, 2])).toBe(false)
    expect(solvable([])).toBe(false)
    expect(solvable([3, 3, 1, 2, 1])).toBe(true)
  })

  it('the tip is the first pack that is not where it belongs in the nearest way to balance; nothing to do when it is balanced', () => {
    // nothing in the baskets yet: the first pack goes to one side
    expect(tip([1, 2, 3], [null, null, null])).toEqual({ index: 0, side: 'left' })
    // 3 on the left: the two others must go right (the nearest way keeps the 3 where it lies)
    expect(tip([1, 2, 3], [null, null, 'left'])).toEqual({ index: 0, side: 'right' })
    // all three on one side: only the 3 has to go to the other side (the nearest way keeps the 1 and the 2 together)
    expect(tip([1, 2, 3], ['left', 'left', 'left'])).toEqual({ index: 2, side: 'right' })
    // balanced already, or impossible
    expect(tip([1, 2, 3], ['left', 'left', 'right'])).toBeNull()
    expect(tip([2, 2, 2], [null, null, null])).toBeNull()
  })

  it('the camel of every round of the data can be balanced: one camel with three packs in round 1 and one with five in round 2', () => {
    const g = abraham.stages[0]!.task.balance!
    const weight = (id: string) => g.packs.find((p) => p.id === id)!.weight
    for (const r of g.rounds) {
      expect(r.camels).toHaveLength(1)
      for (const c of r.camels) expect(solvable(c.packs.map(weight)), c.packs.join(',')).toBe(true)
    }
    expect(g.rounds[0]!.camels.map((c) => c.packs.length)).toEqual([3])
    expect(g.rounds[1]!.camels.map((c) => c.packs.length)).toEqual([5])
  })
})

describe('constellation: laying a star', () => {
  const targets: [number, number][] = [[20, 20], [60, 30], [80, 80]]

  it('a star belongs to the nearest free star of the model within the tolerance (12 % of the width of the frame); one star far from all is nothing', () => {
    expect(claim(targets, [false, false, false], { x: 22, y: 21 })).toBe(0)
    expect(claim(targets, [false, false, false], { x: 58, y: 35 })).toBe(1)
    expect(claim(targets, [false, false, false], { x: 40, y: 55 })).toBe(-1)
    // just inside and just outside
    expect(claim(targets, [false, false, false], { x: 20 + 11.9, y: 20 })).toBe(0)
    expect(claim(targets, [false, false, false], { x: 20 + 12.1, y: 20 })).toBe(-1)
  })

  it('a star of the model that has its star is taken: a second star at the same place does not count twice', () => {
    expect(claim(targets, [true, false, false], { x: 21, y: 20 })).toBe(-1)
    expect(claim(targets, [false, false, true], { x: 80, y: 80 })).toBe(-1)
  })

  it('the height counts as much as the width (a frame that is wider than high: the ratio is height / width in pixels)', () => {
    // frame 600 x 300 px: a vertical distance of 20 % of the height is only 10 % of the width
    expect(claim(targets, [false, false, false], { x: 20, y: 40 }, 12, 0.5)).toBe(0)
    expect(claim(targets, [false, false, false], { x: 20, y: 40 }, 12, 1)).toBe(-1)
    expect(frameRatio({ w: 60, h: 40 })).toBeCloseTo(40 / (60 * 1.5), 6)
  })

  it('a set of stars matches the model in any order, but not with a star too many, too few or twice at one place', () => {
    const p = (x: number, y: number) => ({ x, y })
    expect(matches(targets, [p(80, 80), p(20, 21), p(61, 29)])).toBe(true)
    expect(matches(targets, [p(80, 80), p(20, 21)])).toBe(false)
    expect(matches(targets, [p(80, 80), p(20, 21), p(21, 22)])).toBe(false)
    expect(matches(targets, [p(80, 80), p(20, 21), p(40, 55)])).toBe(false)
  })

  it('the stars of the data are inside the frame, far enough from each other for the tolerance to be clear, and the second round has more stars', () => {
    const g = abraham.stages[2]!.task.constellation!
    const ratio = frameRatio(g.frame)
    for (const r of g.rounds) {
      for (const [x, y] of r.targets) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
      for (let i = 0; i < r.targets.length; i++) {
        for (let k = i + 1; k < r.targets.length; k++) {
          const d = Math.hypot(r.targets[i]![0] - r.targets[k]![0], (r.targets[i]![1] - r.targets[k]![1]) * ratio)
          expect(d, `stars ${i} and ${k}`).toBeGreaterThan(12 * 1.2)
        }
      }
    }
    expect(g.rounds.map((r) => r.targets.length)).toEqual([4, 6])
    expect(g.rounds.map((r) => r.showAlways)).toEqual([true, false])
  })
})

describe('silver', () => {
  it('adds up what lies on the cloth; exact only when it is the price and something lies there', () => {
    expect(total([200, 100, 100])).toBe(400)
    expect(total([])).toBe(0)
    expect(isExact([200, 100, 100], 400)).toBe(true)
    expect(isExact([200, 100], 400)).toBe(false)
    expect(isExact([200, 100, 100, 25], 400)).toBe(false)
    expect(isExact([], 0)).toBe(false)
  })

  it('finds every way to pay: the first round (200, 100, 100, 50, 50, 25, 25) and the second (150, 125, 100, 75, 75, 50, 25)', () => {
    const one = [200, 100, 100, 50, 50, 25, 25]
    const two = [150, 125, 100, 75, 75, 50, 25]
    for (const values of [one, two]) {
      const ways = solutions(values, 400)
      expect(ways.length).toBeGreaterThan(0)
      // laying everything is no way to pay
      expect(total(values)).toBeGreaterThan(400)
      for (const way of ways) {
        expect(total(way.map((i) => values[i]!))).toBe(400)
        expect(way.length).toBeLessThan(values.length)
      }
    }
    expect(solutions(one, 400).some((w) => w.length === 3 && w.every((i) => [0, 1, 2].includes(i)))).toBe(true)
    expect(solutions([150, 125, 75, 50], 400)).toEqual([[0, 1, 2, 3]])
    expect(solutions([100, 100], 400)).toEqual([])
  })
})

describe('birds', () => {
  it('the drawn path ends a part of the way to the meeting point', () => {
    expect(lineEnd([0, 0], [100, 80], 0.5)).toEqual({ x: 50, y: 40 })
    expect(lineEnd([10, 10], [50, 70], 0)).toEqual({ x: 10, y: 10 })
    expect(lineEnd([10, 10], [50, 70], 2)).toEqual({ x: 50, y: 70 })
  })

  it('a tap hits within the circle (the height counts for three quarters, the picture is 4 : 3)', () => {
    expect(hitTarget({ x: 54, y: 60 }, [50, 60], 8)).toBe(true)
    expect(hitTarget({ x: 60, y: 60 }, [50, 60], 8)).toBe(false)
    expect(hitTarget({ x: 50, y: 70 }, [50, 60], 8)).toBe(true)
    expect(hitTarget({ x: 50, y: 72 }, [50, 60], 8)).toBe(false)
  })

  it('a point on the line has no distance; the distance counts in percent of the width', () => {
    expect(distToLine([0, 0], [100, 0], [30, 40])).toBeCloseTo(40 * BIRDS_ASPECT, 6)
    expect(distToLine([10, 10], [50, 50], [30, 30])).toBeCloseTo(0, 6)
  })

  it('a path is on the way to the meeting point when the point lies on its line and in front of the bird', () => {
    const target: [number, number] = [50, 70]
    const from: [number, number] = [10, 10]
    const half = lineEnd(from, target, 0.5)
    expect(onRay(from, [half.x, half.y], target)).toBe(true)
    // a bird that flies away from the meeting point is not on the way, one that aims past it is not either
    expect(onRay(from, [-10, -20], target)).toBe(false)
    expect(onRay(from, [60, 10], target)).toBe(false)
  })

  it('the direction of a bird is the real direction on the screen', () => {
    expect(birdAngle([0, 0], [10, 0])).toBeCloseTo(0, 6)
    expect(birdAngle([0, 0], [0, 10])).toBeCloseTo(90, 6)
    expect(birdAngle([0, 0], [10, 10 / BIRDS_ASPECT])).toBeCloseTo(45, 6)
  })
})

describe('rings', () => {
  const none: [number, number][] = []

  it('turns a ring in twelfths and round the circle', () => {
    expect(rotateRing([3, 7, 5], 0, 2, none)).toEqual([5, 7, 5])
    expect(rotateRing([3, 7, 5], 1, 8, none)).toEqual([3, 3, 5])
    expect(rotateRing([3, 7, 5], 2, -6, none)).toEqual([3, 7, 11])
  })

  it('a coupled ring turns the other way; only the first of a pair drives the second', () => {
    const couple: [number, number][] = [[0, 1], [2, 3]]
    expect(rotateRing([4, 9, 2, 11], 0, 3, couple)).toEqual([7, 6, 2, 11])
    expect(rotateRing([4, 9, 2, 11], 1, 3, couple)).toEqual([4, 0, 2, 11])
    expect(rotateRing([4, 9, 2, 11], 2, -1, couple)).toEqual([4, 9, 1, 0])
  })

  it('the rings stand right when every gap is at the top; counts the rings that do', () => {
    expect(isAligned([0, 0, 0])).toBe(true)
    expect(isAligned([0, 12, 24])).toBe(true)
    expect(isAligned([0, 1, 0])).toBe(false)
    expect(isAligned([])).toBe(false)
    expect(alignedCount([0, 5, 0, 11])).toBe(2)
  })

  it('finds the shortest way, also with the coupling, and the first step of it is what the tip shows', () => {
    expect(solveRings([0, 0, 0], none)).toEqual([])
    expect(solveRings([1, 0, 0], none)).toEqual([{ ring: 0, steps: -1 }])
    const couple: [number, number][] = [[0, 1]]
    // turning ring 0 back by one turns ring 1 on by one: [1, 11] is solved by one step of ring 0
    expect(solveRings([1, 11], couple)).toEqual([{ ring: 0, steps: -1 }])
    // [1, 0]: ring 1 alone cannot help; ring 0 back puts ring 1 at 1, then ring 1 back
    const way = solveRings([1, 0], couple)!
    let s = [1, 0]
    for (const m of way) s = rotateRing(s, m.ring, m.steps, couple)
    expect(isAligned(s)).toBe(true)
    expect(way).toHaveLength(2)
  })

  it('every start of the rounds can be lined up', () => {
    expect(ringsSolvable([3, 7, 5], none)).toBe(true)
    expect(ringsSolvable([4, 9, 2, 11], [[0, 1], [2, 3]])).toBe(true)
  })
})

describe('clues', () => {
  const row = ['gelb', 'blau', 'gruen', 'rot']

  it('knows when a clue holds (places count from 1 at the well)', () => {
    expect(clueHolds(row, { kind: 'at', blanket: 'gelb', slot: 1 })).toBe(true)
    expect(clueHolds(row, { kind: 'at', blanket: 'gelb', slot: 2 })).toBe(false)
    expect(clueHolds(row, { kind: 'notAt', blanket: 'rot', slot: 3 })).toBe(true)
    expect(clueHolds(row, { kind: 'notAt', blanket: 'gruen', slot: 3 })).toBe(false)
    expect(clueHolds(row, { kind: 'before', a: 'blau', b: 'rot' })).toBe(true)
    expect(clueHolds(row, { kind: 'before', a: 'rot', b: 'blau' })).toBe(false)
    expect(clueHolds(row, { kind: 'next', a: 'rot', b: 'gruen' })).toBe(true)
    expect(clueHolds(row, { kind: 'next', a: 'gelb', b: 'gruen' })).toBe(false)
    expect(clueHolds(row, { kind: 'next', a: 'gelb', b: 'unbekannt' })).toBe(false)
  })

  it('counts the clues that hold', () => {
    expect(holding(row, [{ kind: 'at', blanket: 'gelb', slot: 1 }, { kind: 'at', blanket: 'rot', slot: 1 }, { kind: 'before', a: 'blau', b: 'rot' }])).toBe(2)
  })

  it('lists every row that makes all the clues true (to find out that there is exactly one)', () => {
    const clues: Clue[] = [
      { kind: 'at', blanket: 'blau', slot: 1 },
      { kind: 'before', a: 'rot', b: 'gelb' },
      { kind: 'notAt', blanket: 'gelb', slot: 2 }
    ]
    expect(cluesSolutions(['rot', 'blau', 'gelb'], clues)).toEqual([['blau', 'rot', 'gelb']])
    // too few clues: more than one row
    expect(cluesSolutions(['rot', 'blau', 'gelb'], [{ kind: 'at', blanket: 'blau', slot: 1 }]).length).toBe(2)
  })
})

describe('focus: the slider', () => {
  it('the sharpness is 1 at the right place and falls to 0 half a slider away, on both sides', () => {
    expect(sharpness(70, 70)).toBe(1)
    expect(sharpness(20, 70)).toBe(0)
    expect(sharpness(120, 70)).toBe(0)
    expect(sharpness(45, 70)).toBeCloseTo(0.5, 5)
    expect(sharpness(95, 70)).toBeCloseTo(0.5, 5)
  })

  it('the blur is nothing at the right place and grows to the strongest on both sides', () => {
    expect(blurAt(30, 30)).toBe(0)
    expect(blurAt(30, 30, 20)).toBe(0)
    expect(blurAt(0, 30)).toBeGreaterThan(blurAt(10, 30))
    expect(blurAt(10, 30)).toBeGreaterThan(blurAt(20, 30))
    expect(blurAt(60, 30)).toBeCloseTo(blurAt(0, 30), 5)
    expect(blurAt(100, 30)).toBe(16)
    expect(blurAt(100, 30, 10)).toBe(10)
  })

  it('it clicks into place within eight percent of the slider (the border counts), not beyond', () => {
    expect(isSharp(70, 70)).toBe(true)
    expect(isSharp(62, 70)).toBe(true)
    expect(isSharp(78, 70)).toBe(true)
    expect(isSharp(61, 70)).toBe(false)
    expect(isSharp(79, 70)).toBe(false)
    expect(isSharp(50, 70, 25)).toBe(true)
  })
})
