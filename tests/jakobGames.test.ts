/**
 * The pure functions of the new games of "Jakob" (`utils/jakobGames.ts`): the slide puzzle (board, moves, mixing that can always be solved), the crank (how far a
 * finger that circles has turned it) and the holding game (the morning that comes while the light is held, the light that wanders). The games use only these.
 */
import { describe, expect, it } from 'vitest'
import { jakob } from '@/data/adventures/jakob'
import {
  angleOf,
  bucketLevel,
  crank,
  crankStep,
  FULL,
  gapOf,
  grab,
  holdProgress,
  isSolved,
  move,
  neighbors,
  onSpark,
  pointAt,
  release,
  scramble,
  seeded,
  solvedBoard,
  startCrank,
  wholePercent,
  type Board
} from '@/utils/jakobGames'

/** The shortest way back to the finished picture (a breadth-first search; fine for a board of 3 x 2). Returns the places of the tiles to slide, in order. */
export function solveSteps(start: Board, cols: number): number[] {
  const target = start.map((_, i) => i).join(',')
  const seen = new Map<string, { from: string; place: number } | null>([[start.join(','), null]])
  let frontier: Board[] = [start]
  while (frontier.length) {
    const next: Board[] = []
    for (const b of frontier) {
      if (b.join(',') === target) {
        const steps: number[] = []
        let key = target
        for (let s = seen.get(key); s; s = seen.get(key)) {
          steps.unshift(s.place)
          key = s.from
        }
        return steps
      }
      for (const place of neighbors(b, cols)) {
        const m = move(b, cols, place)!
        const k = m.join(',')
        if (!seen.has(k)) {
          seen.set(k, { from: b.join(','), place })
          next.push(m)
        }
      }
    }
    frontier = next
  }
  throw new Error('no way back')
}

describe('slide puzzle: board and moves', () => {
  it('the finished picture has every piece at its own place; the gap is the last piece', () => {
    const b = solvedBoard(3, 2)
    expect(b).toEqual([0, 1, 2, 3, 4, 5])
    expect(isSolved(b)).toBe(true)
    expect(gapOf(b)).toBe(5)
    expect(isSolved([1, 0, 2, 3, 4, 5])).toBe(false)
  })

  it('only the tiles next to the gap can be slid (not across a row, not diagonally)', () => {
    const b = solvedBoard(3, 2)
    // gap at place 5 (bottom right): its neighbours are 4 (left) and 2 (above)
    expect(neighbors(b, 3).sort()).toEqual([2, 4])
    expect(move(b, 3, 3)).toBeNull()
    expect(move(b, 3, 5)).toBeNull()
    expect(move(b, 3, 4)).toEqual([0, 1, 2, 3, 5, 4])
    expect(move(b, 3, 2)).toEqual([0, 1, 5, 3, 4, 2])
    // a tile at the end of a row is not a neighbour of the gap at the start of the next row
    expect(neighbors([0, 1, 2, 5, 3, 4], 3).sort()).toEqual([0, 4])
  })

  it('a move can be undone by sliding the same tile back', () => {
    const b = solvedBoard(4, 3)
    const m = move(b, 4, 10)!
    expect(gapOf(m)).toBe(10)
    expect(move(m, 4, 11)).toEqual(b)
  })
})

describe('slide puzzle: the mixing', () => {
  it('is the same for the same seed and differs for other seeds; the random numbers lie between 0 and 1', () => {
    expect(scramble(3, 2, 20, 7)).toEqual(scramble(3, 2, 20, 7))
    expect(new Set([1, 2, 3, 4, 5, 6].map((s) => scramble(4, 3, 60, s).join(','))).size).toBeGreaterThan(3)
    const r = seeded(42)
    for (let i = 0; i < 100; i++) {
      const v = r()
      expect(v >= 0 && v < 1).toBe(true)
    }
  })

  it('never gives the finished picture, whatever the seed and the number of moves, and every piece is there exactly once', () => {
    for (const [cols, rows] of [[3, 2], [4, 3]] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const moves of [1, 2, 5, 24, 80]) {
          const b = scramble(cols, rows, moves, seed)
          expect(isSolved(b), `${cols}x${rows} seed ${seed} moves ${moves}`).toBe(false)
          expect([...b].sort((x, y) => x - y)).toEqual(solvedBoard(cols, rows))
        }
      }
    }
  })

  it('every 3 x 2 puzzle can be solved (a breadth-first search finds the way back), and it takes a few moves', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const b = scramble(3, 2, 24, seed)
      const steps = solveSteps(b, 3)
      expect(steps.length, `seed ${seed}`).toBeGreaterThan(0)
      let cur = b
      for (const place of steps) cur = move(cur, 3, place)!
      expect(isSolved(cur)).toBe(true)
    }
  })

  it('every 4 x 3 puzzle can be solved (the parity of the pieces fits the place of the gap: the rule of the 15-puzzle)', () => {
    const solvable = (b: Board, cols: number) => {
      const gap = gapOf(b)
      const pieces = b.filter((p) => p !== b.length - 1)
      let inversions = 0
      for (let i = 0; i < pieces.length; i++) for (let k = i + 1; k < pieces.length; k++) if (pieces[i]! > pieces[k]!) inversions++
      if (cols % 2 === 1) return inversions % 2 === 0
      const rows = b.length / cols
      const fromBottom = rows - Math.floor(gap / cols)
      return (fromBottom % 2 === 0) === (inversions % 2 === 1)
    }
    for (let seed = 1; seed <= 60; seed++) expect(solvable(scramble(4, 3, 80, seed), 4), `seed ${seed}`).toBe(true)
    expect(solvable(solvedBoard(4, 3), 4)).toBe(true)
    // a board with two pieces swapped cannot be solved
    expect(solvable([1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 4)).toBe(false)
  })

  it('the rounds of the data are mixed but not finished, and a round of 3 x 2 can be solved', () => {
    const s = jakob.stages[2]!.task.slide!
    for (const r of s.rounds) {
      const b = scramble(r.cols, r.rows, r.moves, r.seed)
      expect(isSolved(b)).toBe(false)
    }
    const first = s.rounds[0]!
    expect(solveSteps(scramble(first.cols, first.rows, first.moves, first.seed), first.cols).length).toBeGreaterThan(2)
  })
})

describe('crank', () => {
  /** A finger that circles: angles in degrees. */
  const circle = (from: number, to: number, step = 30) => {
    let s = grab(startCrank(), from)
    const n = Math.abs(to - from) / step
    for (let i = 1; i <= n; i++) s = crank(s, from + Math.sign(to - from) * step * i)
    return s
  }

  it('the angle of the finger seen from the middle of the crank', () => {
    expect(angleOf({ x: 50, y: 50 }, { x: 100, y: 50 })).toBe(0)
    expect(angleOf({ x: 50, y: 50 }, { x: 50, y: 100 })).toBe(90)
    expect(angleOf({ x: 50, y: 50 }, { x: 0, y: 50 })).toBe(180)
    expect(angleOf({ x: 50, y: 50 }, { x: 50, y: 0 })).toBe(-90)
  })

  it('three turns fill a bucket, in either direction (the first direction draws the bucket up)', () => {
    expect(circle(0, 1080).turned).toBe(FULL)
    expect(bucketLevel(circle(0, 1080))).toBe(1)
    expect(circle(0, -1080).turned).toBe(FULL)
    expect(bucketLevel(circle(0, 540))).toBeCloseTo(0.5, 6)
    // more than three turns do not overfill it
    expect(circle(0, 1500).turned).toBe(FULL)
  })

  it('turning back lets the bucket down again, never below the bottom (nothing is lost)', () => {
    let s = circle(0, 360)
    expect(s.dir).toBe(1)
    for (let a = 360; a > 180; a -= 30) s = crank(s, a - 30)
    expect(s.turned).toBe(180)
    for (let a = 180; a > 0; a -= 30) s = crank(s, a - 30)
    expect(s.turned).toBe(0)
    expect(s.dir).toBe(0)
    // all the way down: the other direction may be chosen now
    // (the finger went on turning back: now this is the direction that draws the bucket up)
    s = crank(s, -30)
    expect(s.dir).toBe(-1)
    expect(s.turned).toBe(30)
  })

  it('a finger that crosses the half turn (from 170 degrees to -170) goes on the short way round, 20 degrees', () => {
    const s = crank(grab(startCrank(), 170), -170)
    expect(s.turned).toBe(20)
    expect(crank(grab(startCrank(), -170), 170).turned).toBe(20)
  })

  it('a finger that is not on the crank turns nothing; lifting it keeps what has been turned', () => {
    const s = crank(startCrank(), 90)
    expect(s.turned).toBe(0)
    expect(s.last).toBe(90)
    const t = circle(0, 360)
    const lifted = release(t)
    expect(lifted.turned).toBe(360)
    expect(lifted.last).toBeNull()
  })

  it('a step without circling turns a part of a turn (eight steps fill a bucket)', () => {
    let s = startCrank()
    for (let i = 0; i < 7; i++) s = crankStep(s)
    expect(bucketLevel(s)).toBeLessThan(1)
    expect(crankStep(s).turned).toBe(FULL)
  })

  it('the data: one bucket, then three', () => {
    expect(jakob.stages[3]!.task.crank!.rounds.map((r) => r.buckets)).toEqual([1, 3])
  })
})

describe('holding the light', () => {
  it('the morning comes only while the finger is on the light; seconds add up; it never goes back and never passes 1', () => {
    let p = 0
    p = holdProgress(p, 1, true, 10)
    expect(p).toBeCloseTo(0.1, 6)
    p = holdProgress(p, 3, false, 10)
    expect(p).toBeCloseTo(0.1, 6)
    p = holdProgress(p, 2, true, 10)
    expect(p).toBeCloseTo(0.3, 6)
    expect(holdProgress(0.95, 5, true, 10)).toBe(1)
    expect(holdProgress(0.5, 1, true, 0)).toBe(0.5)
  })

  it('a light that wanders passes the points of its way at the same speed and stays on the way', () => {
    const path: [number, number][] = [[0, 0], [10, 0], [10, 10]]
    expect(pointAt(path, 0)).toEqual([0, 0])
    expect(pointAt(path, 1)).toEqual([10, 10])
    expect(pointAt(path, 0.25)).toEqual([5, 0])
    expect(pointAt(path, 0.5)).toEqual([10, 0])
    expect(pointAt(path, 0.75)).toEqual([10, 5])
    expect(pointAt(path, -1)).toEqual([0, 0])
    expect(pointAt(path, 2)).toEqual([10, 10])
    expect(pointAt([[30, 40]], 0.5)).toEqual([30, 40])
  })

  it('a finger is on the light within the radius (a height counts with the ratio)', () => {
    expect(onSpark({ x: 55, y: 50 }, { x: 50, y: 50 }, 10)).toBe(true)
    expect(onSpark({ x: 61, y: 50 }, { x: 50, y: 50 }, 10)).toBe(false)
    expect(onSpark({ x: 50, y: 66 }, { x: 50, y: 50 }, 10, 2 / 3)).toBe(false)
    expect(onSpark({ x: 50, y: 62 }, { x: 50, y: 50 }, 10, 2 / 3)).toBe(true)
  })

  it('the whole morning in percent over both rounds', () => {
    expect(wholePercent(0, 2, 0)).toBe(0)
    expect(wholePercent(0, 2, 0.5)).toBe(25)
    expect(wholePercent(0, 2, 1)).toBe(50)
    expect(wholePercent(1, 2, 0.5)).toBe(75)
    expect(wholePercent(1, 2, 1)).toBe(100)
  })

  it('the data: ten seconds with the light standing still, then fifteen with a light that wanders along a way inside the picture', () => {
    const h = jakob.stages[4]!.task.hold!
    expect(h.rounds.map((r) => r.seconds)).toEqual([10, 15])
    expect(h.rounds[0]!.path).toBeUndefined()
    const path = h.rounds[1]!.path!
    expect(path.length).toBeGreaterThanOrEqual(3)
    for (const [x, y] of path) expect(x >= 5 && x <= 95 && y >= 5 && y <= 95).toBe(true)
    expect(h.start[0] >= 5 && h.start[0] <= 95).toBe(true)
  })
})
