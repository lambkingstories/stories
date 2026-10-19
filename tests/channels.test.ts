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
  it('every kind of tile has its sides, and a quarter turn moves them clockwise', () => {
    expect(openings('straight', 0)).toEqual([1, 3])
    expect(openings('straight', 1)).toEqual([2, 0])
    expect(openings('corner', 0)).toEqual([0, 1])
    expect(openings('corner', 1)).toEqual([1, 2])
    expect(openings('corner', 3)).toEqual([3, 0])
    expect(openings('tee', 0)).toEqual([0, 1, 3])
    expect(openings('cross', 2).sort()).toEqual([0, 1, 2, 3])
    expect(openings('empty', 1)).toEqual([])
    expect(openings('source', 0)).toEqual([1])
    expect(openings('goal', 0)).toEqual([3])
    // four turns are the starting position, and a negative turn works
    expect(openings('corner', 4)).toEqual(openings('corner', 0))
    expect(openings('corner', -1)).toEqual(openings('corner', 3))
  })

  it('only straight pieces, curves and forks can be turned by the child; a straight piece has two positions, the others four', () => {
    const kinds: ChannelKind[] = ['straight', 'corner', 'tee', 'cross', 'empty', 'source', 'goal']
    expect(kinds.filter(isTurnable)).toEqual(['straight', 'corner', 'tee'])
    expect(kinds.map(turnsOf)).toEqual([2, 4, 4, 1, 1, 1, 1])
  })
})

describe('the flow of the water', () => {
  it('runs from the source through the openings that meet and stops where a piece does not open back', () => {
    const grid = [[T('source'), T('straight', 0), T('goal', 0, 'a')]]
    expect(flow(grid).wet).toEqual([[true, true, true]])
    expect(flow(grid).reached).toEqual(['a'])
    // the middle piece turned: the water stops at it (it is wet, but the goal is dry)
    const turned = [[T('source'), T('straight', 1), T('goal', 0, 'a')]]
    expect(flow(turned).wet).toEqual([[true, false, false]])
    expect(flow(turned).reached).toEqual([])
  })

  it('goes round a corner and through a fork into two ways; a one-sided opening does not let water in', () => {
    const grid = [
      [E, T('goal', 3, 'up'), E],
      [T('source'), T('tee', 3), T('goal', 0, 'right')]
    ]
    // goal rotated 3 times opens downwards (3 + 3 = 2); the fork turned 3 opens left, up and down: up reaches the goal above, right is closed
    const f = flow(grid)
    expect(f.reached).toEqual(['up'])
    expect(f.wet[1]![1]).toBe(true)
    expect(f.wet[1]![2]).toBe(false)
  })

  it('a cross passes the water on in all four directions', () => {
    const grid = [
      [E, T('goal', 3, 'n'), E],
      [T('source'), T('cross'), T('goal', 0, 'e')],
      [E, T('goal', 1, 's'), E]
    ]
    expect(flow(grid).reached.sort()).toEqual(['e', 'n', 's'])
  })

  it('two sources and no goal: nothing is reached; goalsOf counts the goals of a grid', () => {
    const grid = [[T('source'), E, T('source')]]
    expect(flow(grid).reached).toEqual([])
    expect(goalsOf([[T('goal', 0, 'a'), T('goal', 0, 'b'), E]])).toBe(2)
  })
})

describe('the solver', () => {
  it('finds the turns that bring the water to the goal and gives back the grid of turns', () => {
    const grid = [[T('source'), T('straight', 1), T('corner', 3), T('goal', 0, 'a')]]
    // a corner cannot continue to the right from the left side in a one-row grid: no way
    expect(solve(grid)).toBeNull()
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
