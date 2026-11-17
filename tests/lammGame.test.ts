/**
 * "Das verlorene Lamm", the rules: how cells are joined (floors at the same height, stairs, the perspective join), how groups turn, slide, fold and open, how the lamb rides,
 * which moves are not allowed, and what the solver finds.
 */
import { describe, expect, it } from 'vitest'
import {
  buildGraph, explore, parseLevel, pathTo, placeOf, poseOf, slack, sliderPos, solveLevel, starsFor, tipFor, tryMove, turnPoint, won,
  type LevelDef
} from '../src/utils/lammGame'
import { fitView, levelBounds, project, unproject } from '../src/utils/lammView'

const level = (layers: string[][], groups: LevelDef['groups'] = [], controls: LevelDef['controls'] = [], extra: Partial<LevelDef> = {}): LevelDef => ({
  id: 't', chapter: 0, layers, groups, controls, min: 0, par: 0, ...extra
})
const idAt = (m: ReturnType<typeof parseLevel>, x: number, y: number, z: number) => m.cells.find((c) => c.x === x && c.y === y && c.z === z)!.id

describe('reading a level', () => {
  it('knows the start, the goal, the flowers and the groups', () => {
    const m = parseLevel(level([['SoaG', '..A.']], [{ id: 'a', kind: 'fold' }], [{ h: [0, 3, 0], g: 'a' }]))
    expect(m.cells).toHaveLength(5)
    expect(m.flowers).toBe(2)
    expect(m.cells[m.start]!.start).toBe(true)
    expect(m.cells[m.goal]!.goal).toBe(true)
    expect(m.groups[0]!.cells).toHaveLength(2)
    expect(m.controls[0]!.groups).toEqual([0])
  })

  it('refuses a level without a goal and an unknown sign', () => {
    expect(() => parseLevel(level([['S#']]))).toThrow()
    expect(() => parseLevel(level([['S#Gx']]))).toThrow()
  })
})

describe('which cells are joined', () => {
  it('floors at the same height next to each other are, a gap or another height is not', () => {
    const m = parseLevel(level([['S#.#G'], ['#']]))
    const g = buildGraph(m, m.startState)
    expect(g.adj[idAt(m, 0, 0, 0)]).toContain(idAt(m, 1, 0, 0))
    expect(g.comp[idAt(m, 3, 0, 0)]).not.toBe(g.comp[idAt(m, 0, 0, 0)])
    // the cell above the start is not joined to it (no stair)
    expect(g.adj[idAt(m, 0, 0, 0)]).not.toContain(idAt(m, 0, 0, 1))
  })

  it('a stair joins its low end at the height z and its high end at z + 1, and nothing at its sides', () => {
    const m = parseLevel(level([['S#>.', '..#'], ['...#', '...#', '...G']]))
    const g = buildGraph(m, m.startState)
    const stair = idAt(m, 2, 0, 0)
    expect(g.adj[stair]).toContain(idAt(m, 1, 0, 0))
    expect(g.adj[stair]).toContain(idAt(m, 3, 0, 1))
    // a floor beside the stair (at the side) is not joined to it
    expect(g.adj[stair]).not.toContain(idAt(m, 2, 1, 0))
    expect(won(m, g, m.start)).toBe(true)
  })

  it('the signs of the stairs name the direction of their high end (> v < ^)', () => {
    const m = parseLevel(level([['S>v<^', '....G']]))
    expect(m.cells.filter((c) => c.stair >= 0).map((c) => c.stair)).toEqual([0, 1, 2, 3])
  })

  it('the perspective join: a nearer, higher floor whose top meets the far one along an edge', () => {
    // far cell F = (1,0,0), near cell N = F + (1,0,0) + (1,1,1) = (3,1,1)
    const m = parseLevel(level([['S#'], ['....', '...G']]))
    const g = buildGraph(m, m.startState)
    expect(won(m, g, m.start)).toBe(true)
    expect(g.persp.length).toBeGreaterThan(0)
    // one cell further right the tops do not meet: no join
    const far = parseLevel(level([['S#'], ['....', '....G']]))
    expect(won(far, buildGraph(far, far.startState), far.start)).toBe(false)
  })

  it('the perspective join does not work with the nearer floor lower, and not for stairs', () => {
    // the near floor is lower than the far one: nothing joins
    const lower = parseLevel(level([['....', '...S'], ['.G']]))
    expect(won(lower, buildGraph(lower, lower.startState), lower.start)).toBe(false)
    // a stair is never part of a perspective join
    const m = parseLevel(level([['S>'], ['....', '...G']]))
    const g = buildGraph(m, m.startState)
    expect(g.persp).toHaveLength(0)
    expect(won(m, g, m.start)).toBe(false)
  })
})

describe('groups', () => {
  const bridge = level([['..a..', 'S.a.G', '..a..']], [{ id: 'a', kind: 'turn', pivot: [2, 1] }], [{ h: [1, 3, 0], g: 'a' }])

  it('turnPoint turns a quarter clockwise about the pivot, exactly for whole turns', () => {
    expect(turnPoint(2, 0, 2, 1, 1)).toEqual([3, 1])
    expect(turnPoint(2, 2, 2, 1, 1)).toEqual([1, 1])
    expect(turnPoint(3, 1, 2, 1, 4)).toEqual([3, 1])
    expect(turnPoint(3, 1, 2, 1, 2)).toEqual([1, 1])
    const half = turnPoint(3, 1, 2, 1, 0.5)
    expect(half[0]).toBeCloseTo(2 + Math.cos(Math.PI / 4), 6)
  })

  it('a turn bridge is across the way until it is turned once', () => {
    const m = parseLevel(bridge)
    expect(won(m, buildGraph(m, m.startState), m.start)).toBe(false)
    const next = tryMove(m, m.startState, 0, m.start)!
    expect(next).toEqual([1])
    expect(won(m, buildGraph(m, next), m.start)).toBe(true)
    // four touches come round again
    let st = m.startState
    for (let i = 0; i < 4; i++) st = tryMove(m, st, 0, m.start)!
    expect(st).toEqual([0])
  })

  it('the cells of a turned group stand where the maths says', () => {
    const m = parseLevel(bridge)
    const c = m.cells.find((x) => x.x === 2 && x.y === 0)!
    const p = poseOf(m.groups[0]!, 1)
    expect(placeOf(m, c, p)).toEqual([3, 1, 0])
  })

  it('a slider runs to the end and back (0, 1, 2, 1) and moves its cells by the step', () => {
    expect([0, 1, 2, 3].map((s) => sliderPos(2, s))).toEqual([0, 1, 2, 1])
    const m = parseLevel(level([['S#..#G', '......', '..aa..']], [{ id: 'a', kind: 'slide', step: [0, -1, 0], n: 2 }], [{ h: [1, 3, 0], g: 'a' }]))
    const c = m.cells.find((x) => x.g === 0)!
    expect(placeOf(m, c, poseOf(m.groups[0]!, 2))).toEqual([c.x, c.y - 2, c.z])
    // two touches fill the gap
    let st = m.startState
    expect(won(m, buildGraph(m, st), m.start)).toBe(false)
    st = tryMove(m, st, 0, m.start)!
    expect(won(m, buildGraph(m, st), m.start)).toBe(false)
    st = tryMove(m, st, 0, m.start)!
    expect(won(m, buildGraph(m, st), m.start)).toBe(true)
  })

  it('a fold is away at the start, a gate is closed: the lamb cannot stand on a closed gate', () => {
    const f = parseLevel(level([['SaaG']], [{ id: 'a', kind: 'fold', start: 0 }], [{ h: [1, 2, 0], g: 'a' }]))
    expect(won(f, buildGraph(f, f.startState), f.start)).toBe(false)
    expect(won(f, buildGraph(f, tryMove(f, f.startState, 0, f.start)!), f.start)).toBe(true)
    const g = parseLevel(level([['S#a#G']], [{ id: 'a', kind: 'gate', start: 0 }], [{ h: [2, 2, 0], g: 'a' }]))
    const closed = buildGraph(g, g.startState)
    expect(closed.walk[idAt(g, 2, 0, 0)]).toBe(0)
    expect(won(g, closed, g.start)).toBe(false)
    const open = tryMove(g, g.startState, 0, g.start)!
    expect(won(g, buildGraph(g, open), g.start)).toBe(true)
  })

  it('the lamb rides on a turning group, and a move that would leave it on a vanishing floor is not allowed', () => {
    const table = parseLevel(level([['.....', '.....', 'SaaA.', '.....', '..G..']], [{ id: 'a', kind: 'turn', pivot: [2, 2] }], [{ h: [4, 4, 0], g: 'a' }]))
    // from the start alone the turn does not help (the lamb stays behind), on the table it does
    const after = tryMove(table, table.startState, 0, idAt(table, 2, 2, 0))!
    const g = buildGraph(table, after)
    expect(won(table, g, idAt(table, 2, 2, 0))).toBe(true)
    expect(won(table, g, table.start)).toBe(false)
    const fold = parseLevel(level([['SaaG']], [{ id: 'a', kind: 'fold', start: 1 }], [{ h: [1, 2, 0], g: 'a' }]))
    // standing on the fold when it folds away: not allowed
    expect(tryMove(fold, fold.startState, 0, idAt(fold, 1, 0, 0))).toBeNull()
    expect(tryMove(fold, fold.startState, 0, fold.start)).not.toBeNull()
  })

  it('a move that would put two cells in the same place is not allowed', () => {
    const m = parseLevel(level([['S#a', '', 'G']], [{ id: 'a', kind: 'slide', step: [-1, 0, 0], n: 1 }], [{ h: [3, 3, 0], g: 'a' }]))
    expect(tryMove(m, m.startState, 0, m.start)).toBeNull()
  })

  it('one touch can move several groups', () => {
    const m = parseLevel(level([['S.a.G']], [{ id: 'a', kind: 'turn', pivot: [2, 0] }, { id: 'b', kind: 'fold' }], [{ h: [0, 2, 0], g: 'ab' }]))
    expect(tryMove(m, m.startState, 0, m.start)).toEqual([1, 1])
  })
})

describe('the solver', () => {
  it('finds the fewest moves, with the flowers, and proves that nothing is a dead end', () => {
    const m = parseLevel(level([['..o......', '......b..', 'Saaa#.b.G', '......b..', '..o......']], [{ id: 'a', kind: 'turn', pivot: [2, 2] }, { id: 'b', kind: 'turn', pivot: [6, 2] }], [{ h: [0, 4, 0], g: 'a' }, { h: [8, 4, 0], g: 'b' }]))
    const s = solveLevel(m)
    expect(s.best).toBe(1)
    expect(s.bestAll).toBe(3)
    expect(s.deadEnds).toBe(0)
    expect(s.collisions).toBe(0)
    expect(s.way).toHaveLength(3)
  })

  it('says -1 for a level that cannot be won', () => {
    const m = parseLevel(level([['S.G']]))
    expect(solveLevel(m).best).toBe(-1)
  })

  it('the tip leads to the goal with the fewest moves', () => {
    const m = parseLevel(level([['..a..', 'S.a.G', '..a..']], [{ id: 'a', kind: 'turn', pivot: [2, 1] }], [{ h: [0, 3, 0], g: 'a' }]))
    const space = explore(m)
    let st = m.startState
    let lamb = m.start
    let steps = 0
    for (; steps < 6; steps++) {
      const tip = tipFor(space, st, lamb)
      if (!tip) break
      st = tryMove(m, st, tip.g, tip.s)!
      lamb = tip.s
    }
    expect(steps).toBe(1)
    expect(won(m, buildGraph(m, st), lamb)).toBe(true)
    // when the way is open already there is nothing to tip
    expect(tipFor(space, st, lamb)).toBeNull()
  })

  it('the path of the lamb is the shortest way inside its part', () => {
    const m = parseLevel(level([['S###', '...#', '...G']]))
    const g = buildGraph(m, m.startState)
    expect(pathTo(g, m.start, m.goal).map((i) => `${g.x[i]},${g.y[i]}`)).toEqual(['1,0', '2,0', '3,0', '3,1', '3,2'])
    expect(pathTo(g, m.start, m.start)).toEqual([])
  })
})

describe('stars and the view', () => {
  it('one star without all flowers, two with them, three with them and few moves', () => {
    expect(starsFor(1, 2, 1, 5)).toBe(1)
    expect(starsFor(2, 2, 9, 5)).toBe(2)
    expect(starsFor(2, 2, 5, 5)).toBe(3)
    expect(starsFor(0, 0, 0, 1)).toBe(3)
    expect(slack(0)).toBe(1)
    expect(slack(8)).toBe(2)
  })

  it('project and unproject are the inverse of each other, and a level fits the screen', () => {
    const v = { s: 40, ox: 100, oy: 200 }
    const [px, py] = project(v, 3, 2, 1)
    const [x, y] = unproject(v, px, py, 1)
    expect(x).toBeCloseTo(3, 9)
    expect(y).toBeCloseTo(2, 9)
    const m = parseLevel(level([['S#>.'], ['...#', '....#', '....G']]))
    const view = fitView(levelBounds(m), 6, 66, 363, 700)
    expect(view.s).toBeGreaterThan(20)
  })
})
