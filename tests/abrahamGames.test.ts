/**
 * The pure functions of the new games of "Abraham" (`utils/abrahamGames.ts`): the camels (balance, ways to spread the packs, the tip) and the constellation (which
 * star of the model a laid star belongs to). The games use only these.
 */
import { describe, expect, it } from 'vitest'
import { abraham } from '@/data/adventures/abraham'
import { claim, frameRatio, isBalanced, matches, solvable, splits, tip } from '@/utils/abrahamGames'

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

  it('every camel of the data can be balanced, with three packs in round 1 and five in round 2', () => {
    const g = abraham.stages[0]!.task.balance!
    const weight = (id: string) => g.packs.find((p) => p.id === id)!.weight
    for (const r of g.rounds) {
      expect(r.camels).toHaveLength(2)
      for (const c of r.camels) expect(solvable(c.packs.map(weight)), c.packs.join(',')).toBe(true)
    }
    expect(g.rounds[0]!.camels.map((c) => c.packs.length)).toEqual([3, 3])
    expect(g.rounds[1]!.camels.map((c) => c.packs.length)).toEqual([5, 5])
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
