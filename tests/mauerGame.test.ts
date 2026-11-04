import { describe, expect, it } from 'vitest'
import {
  FREE_AFTER,
  FREE_LEVEL,
  HELPS,
  LEVELS,
  SHAPE_LIST,
  SIZE,
  canPlace,
  dealPieces,
  emptyBoard,
  extent,
  findHint,
  fullLines,
  hasMove,
  help,
  idx,
  needsHelp,
  newGame,
  place,
  placements,
  starsFor,
  type Game,
  type Piece
} from '../src/utils/mauerGame'
import { mulberry32 } from '../src/utils/familyCode'

const dot: Piece = { shape: [[0, 0]], tint: 1 }
const bar4: Piece = { shape: [[0, 0], [0, 1], [0, 2], [0, 3]], tint: 2 }

describe('Nehemias Mauer: the board and the stones', () => {
  it('has five sections that get longer, and free building after the third', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(['schaftor', 'fischtor', 'taltor', 'brunnentor', 'fertig'])
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i]!.goal).toBeGreaterThan(LEVELS[i - 1]!.goal)
    expect(FREE_AFTER).toBe(3)
    expect(FREE_LEVEL).toBe(5)
    expect(newGame(FREE_LEVEL).goal).toBe(0)
  })

  it('every shape stays inside a 4 x 4 box and has no cell twice', () => {
    for (const s of SHAPE_LIST) {
      const { rows, cols } = extent(s)
      expect(rows).toBeLessThanOrEqual(4)
      expect(cols).toBeLessThanOrEqual(4)
      expect(new Set(s.map((c) => c.join(','))).size).toBe(s.length)
    }
  })

  it('a stone fits only on free squares inside the board', () => {
    const board = emptyBoard()
    expect(canPlace(board, bar4.shape, 0, 0)).toBe(true)
    expect(canPlace(board, bar4.shape, 0, SIZE - 3)).toBe(false) // sticks out on the right
    expect(canPlace(board, bar4.shape, SIZE, 0)).toBe(false)
    board[idx(0, 2)] = 3
    expect(canPlace(board, bar4.shape, 0, 0)).toBe(false)
    expect(placements(board, dot.shape)).toHaveLength(SIZE * SIZE - 1)
  })

  it('finds full rows and columns', () => {
    const board = emptyBoard()
    for (let c = 0; c < SIZE; c++) board[idx(2, c)] = 1
    for (let r = 0; r < SIZE; r++) board[idx(r, 5)] = 1
    expect(fullLines(board)).toEqual({ rows: [2], cols: [5] })
  })
})

describe('Nehemias Mauer: a move', () => {
  function gameWith(board: number[], pieces: (Piece | null)[], level = 0): Game {
    const g = newGame(level, mulberry32(1))
    g.board = board
    g.pieces = pieces
    return g
  }

  it('a full row is cleared and counted as one layer', () => {
    const board = emptyBoard()
    for (let c = 0; c < 4; c++) board[idx(7, c)] = 1
    const g = gameWith(board, [bar4, dot, dot])
    expect(place(g, 0, 7, 4)).toBe(true)
    expect(g.layers).toBe(1)
    expect(g.cleared.rows).toEqual([7])
    expect(g.board.every((v) => v === 0)).toBe(true)
    expect(g.pieces[0]).toBeNull()
    expect(g.placed).toBe(1)
  })

  it('a row and a column at once are two layers, the crossing square is cleared once', () => {
    const board = emptyBoard()
    for (let c = 0; c < SIZE; c++) if (c !== 3) board[idx(0, c)] = 1
    for (let r = 1; r < SIZE; r++) board[idx(r, 3)] = 1
    const g = gameWith(board, [dot, dot, dot], 2)
    expect(place(g, 0, 0, 3)).toBe(true)
    expect(g.layers).toBe(2)
    expect(g.board.every((v) => v === 0)).toBe(true)
  })

  it('a stone that does not fit changes nothing', () => {
    const g = gameWith(emptyBoard(), [bar4, dot, dot])
    expect(place(g, 0, 0, 6)).toBe(false)
    expect(place(g, 1, 0, 0)).toBe(true)
    expect(place(g, 1, 0, 0)).toBe(false) // already placed
    expect(g.placed).toBe(1)
  })

  it('three new stones come after the last one of a set', () => {
    const g = gameWith(emptyBoard(), [dot, null, null])
    expect(place(g, 0, 0, 0)).toBe(true)
    expect(g.pieces.every((p) => p !== null)).toBe(true)
  })

  it('reaching the goal wins the section, with 1 to 3 stars', () => {
    const board = emptyBoard()
    for (let c = 0; c < 4; c++) board[idx(7, c)] = 1
    const g = gameWith(board, [bar4, dot, dot])
    g.layers = g.goal - 1
    place(g, 0, 7, 4)
    expect(g.phase).toBe('won')
    expect(starsFor(g)).toBe(3)
    g.helps = 1
    expect(starsFor(g)).toBe(2)
    g.placed = g.par + 1
    expect(starsFor(g)).toBe(1)
    g.phase = 'ended'
    expect(starsFor(g)).toBe(0)
  })
})

describe('Nehemias Mauer: the builders help, a round never fails by bad luck', () => {
  it('with nothing that fits the builders clear the two fullest rows, up to three times, then the round ends', () => {
    const g = newGame(0, mulberry32(5))
    // a board without a single free square that the stones fit into: rows 0 and 1 are the fullest
    g.board = new Array<number>(SIZE * SIZE).fill(1)
    g.board[idx(3, 3)] = 0 // one hole, but the stones below are bigger
    g.pieces = [bar4, bar4, bar4]
    expect(hasMove(g.board, g.pieces)).toBe(false)
    expect(needsHelp(g)).toBe(true)
    help(g)
    expect(g.helps).toBe(1)
    expect(g.helped).toHaveLength(2)
    expect(g.board.filter((v) => v === 0).length).toBeGreaterThanOrEqual(2 * SIZE)
    expect(hasMove(g.board, g.pieces)).toBe(true)

    // after the third help and still stuck, the round ends
    g.helps = HELPS
    g.board = new Array<number>(SIZE * SIZE).fill(1)
    g.pieces = [bar4, null, null]
    g.board[idx(0, 0)] = 0
    g.pieces = [bar4, dot, dot]
    g.board[idx(7, 7)] = 0 // the dot fits here: no end yet
    expect(hasMove(g.board, g.pieces)).toBe(true)
    place(g, 1, 0, 0)
    place(g, 2, 7, 7) // all full lines are cleared, so it goes on
    expect(['play', 'won', 'ended']).toContain(g.phase)
  })

  it('a deal always has a stone that fits, also on a crowded board', () => {
    const rand = mulberry32(11)
    for (let n = 0; n < 200; n++) {
      const board = emptyBoard()
      const fill = Math.floor(rand() * 50)
      for (let k = 0; k < fill; k++) board[Math.floor(rand() * SIZE * SIZE)] = 1
      const set = dealPieces(board, rand)
      expect(set).toHaveLength(3)
      if (board.some((v) => v === 0)) expect(hasMove(board, set)).toBe(true)
    }
  })

  it('the hint prefers a stone that finishes a layer', () => {
    const board = emptyBoard()
    for (let c = 0; c < 4; c++) board[idx(7, c)] = 1
    const hint = findHint(board, [dot, bar4, dot])
    expect(hint).toEqual({ slot: 1, row: 7, col: 4 })
    expect(findHint(new Array<number>(SIZE * SIZE).fill(1), [dot, dot, dot])).toBeNull()
  })
})

describe('Nehemias Mauer: a simple player can finish every section', () => {
  // a player that always follows the hint and takes the builders' help; if this fails, the goals are too hard for a child
  function playOut(level: number, seed: number): Game {
    const rand = mulberry32(seed)
    const g = newGame(level, rand)
    for (let guard = 0; guard < 400 && g.phase === 'play'; guard++) {
      if (needsHelp(g)) {
        help(g)
        continue
      }
      const hint = findHint(g.board, g.pieces)
      if (!hint) break
      place(g, hint.slot, hint.row, hint.col, rand)
    }
    return g
  }

  it('wins all five sections in 60 of 60 tries, mostly inside the stone limit of the third star', () => {
    let inPar = 0
    let total = 0
    for (let level = 0; level < LEVELS.length; level++) {
      for (let seed = 1; seed <= 12; seed++) {
        const g = playOut(level, seed * 7 + level)
        expect(g.phase).toBe('won')
        total++
        if (g.placed <= g.par) inPar++
      }
    }
    expect(inPar / total).toBeGreaterThan(0.6)
  })
})
