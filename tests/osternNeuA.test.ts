/**
 * The pure parts of "The errand" (`botengang`) and "The shutters" (`fensterlaeden`) of "Ostern" (`utils/osternNeuA.ts`): the shape and turn of the lane tiles, the straight way of a tap,
 * the run of a swipe to the next branching, the distances, the shortest way and the next stop for "Help me", the turning of the shutters with their neighbours, the fewest moves, the
 * mistakes over par, the arrow keys between the windows, and the checks of the data.
 */
import { describe, expect, it } from 'vitest'
import {
  errandDirTo,
  errandDistances,
  errandFind,
  errandGoal,
  errandLine,
  errandNextStop,
  errandPath,
  errandPicture,
  errandProblems,
  errandSides,
  errandSize,
  errandSlide,
  errandStart,
  errandTile,
  shuttersBest,
  shuttersHint,
  shuttersMistakes,
  shuttersNeighbour,
  shuttersOpenCount,
  shuttersProblems,
  shuttersSolved,
  shuttersToggle
} from '@/utils/osternNeuA'
import type { Cell, ErrandGame, ShuttersGame } from '@/utils/osternNeuA'

/** Round 1: 5 x 5, one dead end (B at the left of the middle row); the shortest way is 8 steps. */
const R1 = ['S..##', '##.##', 'B....', '####.', '####Z']
/** Round 2: 6 rows x 7 columns, three dead ends; two shortest ways of 11 steps. */
const R2 = ['S.....B', '##.##.#', 'B..##.#', '##.....', '##.###.', '##B###Z']
const ERRAND: ErrandGame = {
  tiles: { straight: 'gerade', corner: 'ecke', tee: 't', cross: 'kreuz', dead: 'sackgasse', roofs: ['dach-1', 'dach-2'], start: 'start', goal: 'ziel' },
  walker: 'maria',
  rounds: [
    { hint: 'a', rows: R1 },
    { hint: 'b', rows: R2 }
  ]
}
const at = (r: number, c: number): Cell => ({ r, c })

/** Round 1: four windows in a row (neighbours left and right), all closed, two moves; round 2: two rows of three (above, below, left, right), three moves. */
const row4 = [10, 32, 54, 76].map((x) => ({ x, y: 30, w: 14, h: 30 }))
const grid6 = [15, 57].flatMap((y) => [14, 43, 72].map((x) => ({ x, y, w: 14, h: 28 })))
const SHUT: ShuttersGame = {
  shutter: 'laden',
  lights: ['licht-1', 'licht-2', 'licht-3', 'licht-4', 'licht-5', 'licht-6'],
  rounds: [
    { hint: 'a', background: 'haus-1', windows: row4, links: [[1], [0, 2], [1, 3], [2]], start: [false, false, false, false], par: 2 },
    {
      hint: 'b',
      background: 'haus-2',
      ratio: 4 / 3,
      windows: grid6,
      links: [
        [1, 3],
        [0, 2, 4],
        [1, 5],
        [0, 4],
        [1, 3, 5],
        [2, 4]
      ],
      // with these neighbours only two starts need three moves (the grid has just 16 solvable states): this one and its mirror [false, true, false, true, true, true]
      start: [true, true, true, false, true, false],
      par: 3
    }
  ]
}

describe('Botengang: the map', () => {
  it('size, start, goal, dead ends', () => {
    expect(errandSize(R1)).toEqual({ rows: 5, cols: 5 })
    expect(errandSize(R2)).toEqual({ rows: 6, cols: 7 })
    expect(errandStart(R1)).toEqual(at(0, 0))
    expect(errandGoal(R1)).toEqual(at(4, 4))
    expect(errandFind(R1, 'B')).toHaveLength(1)
    expect(errandFind(R2, 'B')).toHaveLength(3)
    expect(errandSides(R1, at(2, 2))).toEqual([0, 1, 3])
  })

  it('the shape and the turn of a tile follow the lanes around it', () => {
    expect(errandTile(R1, at(0, 0))).toEqual({ kind: 'start', turn: 270 })
    expect(errandTile(R1, at(0, 1))).toEqual({ kind: 'straight', turn: 90 })
    expect(errandTile(R1, at(1, 2))).toEqual({ kind: 'straight', turn: 0 })
    expect(errandTile(R1, at(0, 2))).toEqual({ kind: 'corner', turn: 180 })
    expect(errandTile(R1, at(2, 4))).toEqual({ kind: 'corner', turn: 180 })
    expect(errandTile(R2, at(3, 6))).toEqual({ kind: 'corner', turn: 180 })
    expect(errandTile(R1, at(2, 2))).toEqual({ kind: 'tee', turn: 180 })
    expect(errandTile(R2, at(0, 2))).toEqual({ kind: 'tee', turn: 0 })
    expect(errandTile(R2, at(2, 2))).toEqual({ kind: 'tee', turn: 90 })
    expect(errandTile(R2, at(3, 2))).toEqual({ kind: 'tee', turn: 270 })
    expect(errandTile(['#.#', '...', '#.#'], at(1, 1))).toEqual({ kind: 'cross', turn: 0 })
    expect(errandTile(R1, at(2, 0))).toEqual({ kind: 'dead', turn: 270 })
    expect(errandTile(R2, at(5, 2))).toEqual({ kind: 'dead', turn: 180 })
    expect(errandTile(R2, at(0, 6))).toEqual({ kind: 'dead', turn: 90 })
    expect(errandTile(R1, at(4, 4))).toEqual({ kind: 'goal', turn: 180 })
    expect(errandTile(R1, at(0, 3)).kind).toBe('roof')
  })

  it('the picture of a cell: the file of its kind, the roofs in turn, and the correction of the data', () => {
    expect(errandPicture(ERRAND, R1, at(0, 2))).toEqual({ src: 'ecke', kind: 'corner', turn: 180 })
    expect(['dach-1', 'dach-2']).toContain(errandPicture(ERRAND, R1, at(0, 3)).src)
    const roofs = new Set(errandFind(R2, '#').map((p) => errandPicture(ERRAND, R2, p).src))
    expect(roofs).toEqual(new Set(['dach-1', 'dach-2']))
    const turned: ErrandGame = { ...ERRAND, tiles: { ...ERRAND.tiles, turn: { corner: 270 } } }
    expect(errandPicture(turned, R1, at(0, 2)).turn).toBe(90)
  })

  it('a tap: a straight line without a roof between; Mary stops at a dead end or the goal', () => {
    expect(errandDirTo(at(0, 0), at(0, 3))).toBe(1)
    expect(errandDirTo(at(2, 2), at(0, 2))).toBe(0)
    expect(errandDirTo(at(0, 0), at(1, 1))).toBeNull()
    expect(errandLine(R1, at(0, 0), at(0, 2))).toEqual([at(0, 1), at(0, 2)])
    expect(errandLine(R1, at(0, 0), at(2, 2))).toBeNull()
    expect(errandLine(R1, at(0, 0), at(0, 3))).toBeNull()
    expect(errandLine(R1, at(0, 0), at(0, 0))).toBeNull()
    expect(errandLine(R1, at(2, 2), at(2, 0))).toEqual([at(2, 1), at(2, 0)])
    expect(errandLine(R1, at(2, 4), at(4, 4))).toEqual([at(3, 4), at(4, 4)])
    // a roof between: (0,2) down to (2,2) is free, but (0,0) to (2,0) crosses the roof at (1,0)
    expect(errandLine(R1, at(0, 2), at(2, 2))).toEqual([at(1, 2), at(2, 2)])
    expect(errandLine(R1, at(0, 0), at(2, 0))).toBeNull()
  })

  it('a swipe runs round corners to the next branching, the goal or a dead end; into a roof it does nothing', () => {
    expect(errandSlide(R1, at(0, 0), 1)).toEqual([at(0, 1), at(0, 2), at(1, 2), at(2, 2)])
    expect(errandSlide(R1, at(2, 2), 3)).toEqual([at(2, 1), at(2, 0)])
    expect(errandSlide(R1, at(2, 2), 1)).toEqual([at(2, 3), at(2, 4), at(3, 4), at(4, 4)])
    expect(errandSlide(R1, at(0, 0), 2)).toEqual([])
    expect(errandSlide(R1, at(0, 0), 3)).toEqual([])
    expect(errandSlide(R2, at(0, 0), 1)).toEqual([at(0, 1), at(0, 2)])
    expect(errandSlide(R2, at(3, 5), 1)).toEqual([at(3, 6), at(4, 6), at(5, 6)])
    // a ring of lanes without a branching: the run stops when it is back
    expect(errandSlide(['...', '.#.', '...'], at(0, 0), 1)).toHaveLength(8)
  })

  it('distances, the shortest way and the next stop of "Help me"', () => {
    const d = errandDistances(R1, errandGoal(R1)!)
    expect(d[0]![0]).toBe(8)
    expect(d[2]![0]).toBe(6)
    expect(d[0]![3]).toBe(Infinity)
    const p = errandPath(R1, at(0, 0))
    expect(p).toHaveLength(8)
    expect(p[p.length - 1]).toEqual(at(4, 4))
    expect(p.some((c) => R1[c.r]![c.c] === 'B')).toBe(false)
    expect(errandPath(R1, at(4, 4))).toEqual([])
    expect(errandNextStop(R1, at(0, 0))).toEqual(at(0, 2))
    expect(errandNextStop(R1, at(0, 2))).toEqual(at(2, 2))
    expect(errandNextStop(R1, at(2, 2))).toEqual(at(2, 4))
    expect(errandNextStop(R1, at(2, 0))).toEqual(at(2, 4))
    expect(errandNextStop(R1, at(4, 4))).toBeNull()
    expect(errandDistances(R2, errandGoal(R2)!)[0]![0]).toBe(11)
    expect(errandPath(R2, at(0, 0))).toHaveLength(11)
  })

  it('the checks of the data', () => {
    expect(errandProblems(ERRAND)).toEqual([])
    const one = (rows: string[]) => errandProblems({ ...ERRAND, rounds: [{ hint: 'x', rows }] })
    expect(one(['S.Z', 'S##'])).toContain('round 1: there must be exactly one start (S), there are 2')
    expect(one(['S..', '###']).join()).toMatch(/exactly one goal/)
    expect(one(['S.#.Z', '#####']).join()).toMatch(/cannot be reached/)
    expect(one(['S.#.Z', '#####']).join()).toMatch(/ends without a well/)
    expect(one(['S.B.Z', '#####']).join()).toMatch(/dead end in row 1, column 3/)
    expect(one(['S.X.Z', '#####']).join()).toMatch(/unknown sign "X"/)
    expect(one(['S..Z', '###']).join()).toMatch(/not all equally long/)
    expect(one(['S........Z', '##########']).join()).toMatch(/more than 8 columns/)
    expect(errandProblems({ ...ERRAND, rounds: [] })).toContain('no rounds')
    expect(errandProblems({ ...ERRAND, tiles: { ...ERRAND.tiles, roofs: [] } })).toContain('no roof pictures')
  })
})

describe('Fensterläden: the shutters', () => {
  const links1 = SHUT.rounds[0]!.links
  const links2 = SHUT.rounds[1]!.links

  it('a tap turns the window and its neighbours', () => {
    expect(shuttersToggle([false, false, false, false], links1, 0)).toEqual([true, true, false, false])
    expect(shuttersToggle([true, true, false, false], links1, 1)).toEqual([false, false, true, false])
    expect(shuttersToggle([false, false, false, false, false, false], links2, 4)).toEqual([false, true, false, true, true, true])
    expect(shuttersSolved([true, true])).toBe(true)
    expect(shuttersSolved([true, false])).toBe(false)
    expect(shuttersSolved([])).toBe(false)
    expect(shuttersOpenCount([true, false, true])).toBe(2)
  })

  it('the fewest moves: round 1 two, round 2 three; the taps of the solution open every window', () => {
    const b1 = shuttersBest(SHUT.rounds[0]!.start, links1)!
    expect(b1.moves).toBe(2)
    const b2 = shuttersBest(SHUT.rounds[1]!.start, links2)!
    expect(b2.moves).toBe(3)
    let s = SHUT.rounds[1]!.start.slice()
    for (const i of b2.taps) s = shuttersToggle(s, links2, i)
    expect(shuttersSolved(s)).toBe(true)
    expect(shuttersBest([true, true, true, true], links1)).toEqual({ moves: 0, taps: [] })
    // two windows that always turn together cannot be brought to different states
    expect(shuttersBest([true, false], [[1], [0]])).toBeNull()
  })

  it('the hint is the first tap of a shortest solution', () => {
    const start = SHUT.rounds[0]!.start
    const h = shuttersHint(start, links1)!
    expect([0, 3]).toContain(h)
    expect(shuttersBest(shuttersToggle(start, links1, h), links1)!.moves).toBe(1)
    expect(shuttersHint([true, true, true, true], links1)).toBeNull()
  })

  it('every two moves over par are one mistake', () => {
    expect(shuttersMistakes(2, 2)).toBe(0)
    expect(shuttersMistakes(3, 2)).toBe(0)
    expect(shuttersMistakes(4, 2)).toBe(1)
    expect(shuttersMistakes(5, 2)).toBe(1)
    expect(shuttersMistakes(8, 2)).toBe(3)
    expect(shuttersMistakes(1, 3)).toBe(0)
  })

  it('the arrow keys go to the nearest window in that direction', () => {
    expect(shuttersNeighbour(row4, 0, 1)).toBe(1)
    expect(shuttersNeighbour(row4, 1, 3)).toBe(0)
    expect(shuttersNeighbour(row4, 3, 1)).toBeNull()
    expect(shuttersNeighbour(row4, 0, 2)).toBeNull()
    expect(shuttersNeighbour(grid6, 0, 2, 4 / 3)).toBe(3)
    expect(shuttersNeighbour(grid6, 4, 0, 4 / 3)).toBe(1)
    expect(shuttersNeighbour(grid6, 4, 1, 4 / 3)).toBe(5)
    expect(shuttersNeighbour(grid6, 5, 3, 4 / 3)).toBe(4)
  })

  it('the checks of the data', () => {
    expect(shuttersProblems(SHUT)).toEqual([])
    const r1 = SHUT.rounds[0]!
    const one = (r: Partial<typeof r1>) => shuttersProblems({ ...SHUT, rounds: [{ ...r1, ...r }] }).join(' | ')
    expect(one({ par: 3 })).toMatch(/fewest moves are 2, not 3/)
    expect(one({ start: [true, true, true, true] })).toMatch(/all windows are open at the start/)
    expect(one({ start: [false, false, false] })).toMatch(/4 windows but 3 start values/)
    expect(one({ links: [[1], [0, 2], [1, 3]] })).toMatch(/4 windows but 3 lists/)
    expect(one({ links: [[1], [2], [1, 3], [2]] })).toMatch(/not the other way round/)
    expect(one({ links: [[0], [0, 2], [1, 3], [2]] })).toMatch(/its own neighbour/)
    expect(one({ links: [[7], [0, 2], [1, 3], [2]] })).toMatch(/does not exist/)
    expect(one({ windows: [...row4.slice(0, 3), { x: 90, y: 30, w: 14, h: 30 }] })).toMatch(/window 4 lies outside/)
    expect(one({ windows: [...row4.slice(0, 3), { x: 60, y: 30, w: 14, h: 30 }] })).toMatch(/windows 3 and 4 overlap/)
    const two: ShuttersGame = { shutter: 'l', lights: ['a'], rounds: [{ hint: '', background: 'h', windows: row4.slice(0, 2), links: [[1], [0]], start: [true, false], par: 1 }] }
    expect(shuttersProblems(two).join()).toMatch(/cannot be solved/)
    expect(shuttersProblems(two).join()).toMatch(/fewer lit pictures than windows/)
    expect(shuttersProblems({ ...SHUT, rounds: [] })).toContain('no rounds')
  })
})
