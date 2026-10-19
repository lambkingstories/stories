/**
 * The water of the channel game (`utils/channels.ts`): the openings of the tiles, the flow from the source, and the solver (which the hint button
 * uses and the tests use to make sure that every round of the game can be solved).
 */
import { describe, expect, it } from 'vitest'
import { flow, goalsOf, isTurnable, openings, solve, turnsOf } from '@/utils/channels'
import type { ChannelKind, ChannelTile } from '@/types/adventure'

const T = (kind: ChannelKind, rot = 0, goal?: string): ChannelTile => ({ kind, rot, ...(goal ? { goal } : {}) })
const E = T('empty')

describe('openings and turning', () => {
  it('every kind of tile has its sides as it is painted, and a quarter turn moves them clockwise', () => {
    // straight: left to right; corner: left to down; fork: left, right and down; source: right; goal: left
    expect(openings('straight', 0)).toEqual([1, 3])
    expect(openings('straight', 1)).toEqual([2, 0])
    expect(openings('corner', 0)).toEqual([3, 2])
    expect(openings('corner', 1)).toEqual([0, 3])
    expect(openings('corner', 2)).toEqual([1, 0])
    expect(openings('tee', 0)).toEqual([3, 1, 2])
    expect(openings('tee', 1)).toEqual([0, 2, 3])
    expect(openings('empty', 1)).toEqual([])
    expect(openings('source', 0)).toEqual([1])
    expect(openings('goal', 0)).toEqual([3])
    // four turns are the starting position, and a negative turn works
    expect(openings('corner', 4)).toEqual(openings('corner', 0))
    expect(openings('corner', -1)).toEqual(openings('corner', 3))
  })

  it('only straight pieces, curves and forks can be turned by the child; a straight piece has two positions, the others four', () => {
    const kinds: ChannelKind[] = ['straight', 'corner', 'tee', 'empty', 'source', 'goal']
    expect(kinds.filter(isTurnable)).toEqual(['straight', 'corner', 'tee'])
    expect(kinds.map(turnsOf)).toEqual([2, 4, 4, 1, 1, 1])
  })
})

describe('the flow of the water', () => {
  it('runs from the source through the openings that meet and stops where a piece does not open back', () => {
    const grid = [[T('source'), T('straight', 0), T('goal', 0, 'a')]]
    expect(flow(grid).wet).toEqual([[true, true, true]])
    expect(flow(grid).reached).toEqual(['a'])
    // the middle piece turned: the water stops at the source (the piece is dry, so is the goal)
    const turned = [[T('source'), T('straight', 1), T('goal', 0, 'a')]]
    expect(flow(turned).wet).toEqual([[true, false, false]])
    expect(flow(turned).reached).toEqual([])
  })

  it('goes round a corner and through a fork into two ways; a closed side does not let water in', () => {
    // a fork turned once opens up, down and left: up reaches the goal above (a goal turned three times opens downwards), right is closed
    const grid = [
      [E, T('goal', 3, 'up'), E],
      [T('source'), T('tee', 1), T('goal', 0, 'right')]
    ]
    const f = flow(grid)
    expect(f.reached).toEqual(['up'])
    expect(f.wet[1]![1]).toBe(true)
    expect(f.wet[1]![2]).toBe(false)
    // a fork in the painted position (left, right, down) feeds the goal on the right and the goal below (turned once it opens upwards)
    const both = [
      [T('source'), T('tee', 0), T('goal', 0, 'e')],
      [E, T('goal', 1, 's'), E]
    ]
    expect(flow(both).reached.sort()).toEqual(['e', 's'])
  })

  it('a curve turns the water: left to down', () => {
    const grid = [
      [T('source'), T('corner', 0)],
      [E, T('goal', 1, 'down')]
    ]
    expect(flow(grid).reached).toEqual(['down'])
    // the curve turned once opens up and to the left: the goal below stays dry
    expect(flow([[T('source'), T('corner', 1)], [E, T('goal', 1, 'down')]]).reached).toEqual([])
  })

  it('two sources and no goal: nothing is reached; goalsOf counts the goals of a grid', () => {
    const grid = [[T('source'), E, T('source')]]
    expect(flow(grid).reached).toEqual([])
    expect(goalsOf([[T('goal', 0, 'a'), T('goal', 0, 'b'), E]])).toBe(2)
  })
})

describe('the solver', () => {
  it('finds the turns that bring the water to the goal and gives back the grid of turns', () => {
    // a curve cannot lead a one-row garden on: no way
    const none = [[T('source'), T('straight', 1), T('corner', 3), T('goal', 0, 'a')]]
    expect(solve(none)).toBeNull()
    const ok = [[T('source'), T('straight', 1), T('straight', 1), T('goal', 0, 'a')]]
    const turns = solve(ok)!
    expect(turns).toBeTruthy()
    // the solution really lets the water through
    const solved = ok.map((row, r) => row.map((t, c) => ({ ...t, rot: turns[r]![c]! })))
    expect(flow(solved).reached).toEqual(['a'])
  })

  it('a tile that the water does not need keeps its turn', () => {
    const grid = [[T('source'), T('straight', 1), T('goal', 0, 'a')], [E, T('corner', 2), E]]
    const turns = solve(grid)!
    expect(turns[1]![1]).toBe(2)
  })
})
