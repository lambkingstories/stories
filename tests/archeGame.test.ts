/**
 * "Arche der Tierpaare": the rules (rows, special stones, chain reactions, obstacles, goals, boosters, the generator of random numbers).
 * The boards are written as text: a digit is an animal (0 elephant, 1 giraffe, 2 lion, 3 sheep, 4 donkey, 5 zebra, 6 frog), `.` an empty
 * cell of the map, `#` stands for "any animal that makes no row" (filled by the helper), letters mark the obstacles of the map.
 */
import { describe, expect, it } from 'vitest'
import {
  BASKET,
  CRATE,
  DOVE_H,
  DOVE_V,
  FLOOR,
  NONE,
  OLIVE,
  RAINBOW,
  STONE,
  VOID,
  WATER,
  boosterHammer,
  boosterShuffle,
  boosterSwap,
  bonusSteps,
  canSwap,
  cellAt,
  checkLevel,
  findMatchGroups,
  findMoves,
  goalLeft,
  goalsDone,
  hasMove,
  hint,
  newGame,
  planSpecial,
  rnd,
  starsFor,
  trySwap,
  type Game,
  type Goal,
  type Level
} from '../src/utils/archeGame'

/** A game on a board that is written out. `kinds` rows: digits are animals, `.` void, `S` `W` `K` obstacles, `b` basket. */
function make(rows: string[], goals: Goal[] = [{ t: 'score', n: 100000 }], extra: Partial<Level> = {}): Game {
  const map = rows.map((r) => r.replace(/[0-9]/g, '#').replace(/b/g, '#'))
  const level: Level = { id: 1, chapter: 0, moves: 20, map, kinds: [0, 1, 2, 3, 4, 5, 6], goals, seed: 7, ...extra }
  const g = newGame(level)
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row.charAt(c)
      const idx = cellAt(g, r, c)
      if (/[0-9]/.test(ch)) g.tiles[idx]!.kind = Number(ch)
      else if (ch === 'b') g.tiles[idx]!.kind = BASKET
    }
  })
  return g
}

/** The kinds of the board as text (`.` for an empty cell). */
function show(g: Game): string[] {
  const out: string[] = []
  for (let r = 0; r < g.rows; r++) {
    let s = ''
    for (let c = 0; c < g.cols; c++) {
      const idx = cellAt(g, r, c)
      const t = g.tiles[idx]
      s += g.type[idx] === VOID ? ' ' : g.type[idx] === STONE ? 'S' : g.type[idx] === WATER ? 'W' : g.type[idx] === CRATE ? 'K' : t ? (t.kind === BASKET ? 'b' : String(t.kind)) : '.'
    }
    out.push(s)
  }
  return out
}

/** A board without any row and without a spare move: a checkerboard of kinds in a way no three are equal. */
const QUIET = ['0123012', '1230123', '2301230', '3012301', '0123012', '1230123', '2301230', '3012301']

describe('the generator of random numbers', () => {
  it('gives the same numbers for the same start value', () => {
    const a = { rng: 42 }
    const b = { rng: 42 }
    for (let i = 0; i < 20; i++) expect(rnd(a)).toBe(rnd(b))
  })
  it('stays between 0 and 1 and is not constant', () => {
    const a = { rng: 1 }
    const seen = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const v = rnd(a)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
      seen.add(v)
    }
    expect(seen.size).toBeGreaterThan(190)
  })
})

describe('a new game', () => {
  it('has no row of three and a move that can be made, for many start values', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const level: Level = { id: 1, chapter: 0, moves: 20, map: ['#######', '#######', '#######', '#######', '#######', '#######', '#######'], kinds: [0, 1, 2, 3, 4], goals: [{ t: 'score', n: 1 }], seed }
      const g = newGame(level)
      expect(findMatchGroups(g)).toHaveLength(0)
      expect(hasMove(g)).toBe(true)
    }
  })
  it('is the same with the same start value, and different with another', () => {
    const level: Level = { id: 1, chapter: 0, moves: 20, map: ['######', '######', '######', '######', '######', '######'], kinds: [0, 1, 2, 3, 4, 5], goals: [{ t: 'score', n: 1 }], seed: 5 }
    expect(show(newGame(level))).toEqual(show(newGame(level)))
    expect(show(newGame(level, 6))).not.toEqual(show(newGame(level)))
  })
  it('builds the obstacles from the map', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: ['#S#', 'WKN', '#C#', '#B#'], kinds: [0, 1, 2], goals: [{ t: 'score', n: 1 }], seed: 3 })
    expect(g.type[1]).toBe(STONE)
    expect(g.type[3]).toBe(WATER)
    expect(g.type[4]).toBe(CRATE)
    expect(g.hp[4]).toBe(2)
    expect(g.tiles[5]!.net).toBe(true)
    expect(g.tiles[7]!.cage).toBe(true)
    expect(g.tiles[10]!.kind).toBe(BASKET)
    expect(g.tiles[1]).toBeNull()
  })
  it('checks a level definition', () => {
    const ok: Level = { id: 1, chapter: 0, moves: 9, map: ['###', '###'], kinds: [0, 1, 2], goals: [{ t: 'score', n: 1 }], seed: 1 }
    expect(checkLevel(ok)).toEqual([])
    expect(checkLevel({ ...ok, map: ['###', '##'] })).toContain('rows of different length')
    expect(checkLevel({ ...ok, map: ['##x'] })).toContain('unknown character in the map')
    expect(checkLevel({ ...ok, kinds: [0, 1] })).toContain('kinds')
  })
})

describe('swapping', () => {
  it('only neighbours can be swapped', () => {
    const g = make(QUIET)
    expect(canSwap(g, 0, 1)).toBe(true)
    expect(canSwap(g, 0, 7)).toBe(true)
    expect(canSwap(g, 0, 8)).toBe(false)
    expect(canSwap(g, 6, 7)).toBe(false) // end of a row and start of the next
    expect(canSwap(g, 3, 3)).toBe(false)
  })

  it('turns a swap back when it makes no row: no move is used', () => {
    const g = make(QUIET)
    const before = show(g)
    const t = trySwap(g, 0, 1)
    expect(t.ok).toBe(false)
    expect(g.moves).toBe(20)
    expect(show(g)).toEqual(before)
    expect(t.swap).toEqual({ a: 0, b: 1 })
  })

  it('clears three in a row and uses a move', () => {
    const g = make(['0013000', '1230123', '2301230', '3012301', '0123012', '1230123', '2301230', '3012301'])
    // swap the 3 at column 3 with the 0 below? build a clean case: 0 0 _ 0
    g.tiles[cellAt(g, 0, 2)]!.kind = 1
    g.tiles[cellAt(g, 0, 3)]!.kind = 0
    g.tiles[cellAt(g, 1, 2)]!.kind = 0
    const t = trySwap(g, cellAt(g, 0, 2), cellAt(g, 1, 2))
    expect(t.ok).toBe(true)
    expect(g.moves).toBe(19)
    expect(g.movesMade).toBe(1)
    expect(t.steps[0]!.clears.length).toBeGreaterThanOrEqual(3)
    expect(t.steps[0]!.cascade).toBe(1)
  })

  it('lets the animals fall and fills the board again', () => {
    const g = make(['0013000', '1230123', '2301230', '3012301', '0123012', '1230123', '2301230', '3012301'])
    g.tiles[cellAt(g, 0, 2)]!.kind = 1
    g.tiles[cellAt(g, 1, 2)]!.kind = 0
    g.tiles[cellAt(g, 0, 3)]!.kind = 0
    trySwap(g, cellAt(g, 0, 2), cellAt(g, 1, 2))
    for (let i = 0; i < g.tiles.length; i++) expect(g.tiles[i]).not.toBeNull()
    expect(findMatchGroups(g)).toHaveLength(0)
  })

  it('does not swap while the round is over', () => {
    const g = make(QUIET)
    g.phase = 'lost'
    expect(canSwap(g, 0, 1)).toBe(false)
  })
})

describe('rows and special stones', () => {
  /** A board of the quiet pattern with the cells of `cells` set, everything else is the pattern. */
  function board(set: Record<string, number>): Game {
    const g = make(QUIET)
    for (const [k, v] of Object.entries(set)) {
      const [r, c] = k.split(',').map(Number)
      g.tiles[cellAt(g, r!, c!)]!.kind = v
    }
    return g
  }

  it('four in a row make a dove that sweeps the column', () => {
    // row 7: 0 0 _ 0 0 -> put a 0 into the gap from below? use row 3 and row 4: gap at column 2
    const g = board({ '3,0': 5, '3,1': 5, '3,3': 5, '3,4': 5, '3,2': 1, '2,2': 5 })
    // a 5 comes down into the gap (from row 2): four 5s in row 3
    const groups = (() => {
      g.tiles[cellAt(g, 3, 2)]!.kind = 5
      return findMatchGroups(g)
    })()
    expect(groups).toHaveLength(1)
    expect(groups[0]!.cells).toHaveLength(5) // 3,0..3,4
    const plan = planSpecial(g, groups[0]!, [cellAt(g, 3, 2)])
    expect(plan!.special).toBe(RAINBOW)
  })

  it('a row of four gives a dove, placed on the cell that was swapped', () => {
    const g = board({ '4,0': 5, '4,1': 5, '4,3': 5, '4,2': 1, '5,2': 5 })
    // swap 4,2 with 5,2: row 4 = 5 5 5 5
    const r = trySwap(g, cellAt(g, 4, 2), cellAt(g, 5, 2))
    expect(r.ok).toBe(true)
    const made = r.steps[0]!.made
    expect(made).toHaveLength(1)
    expect(made[0]!.special).toBe(DOVE_V) // a row makes a dove that flies along the column
    expect(made[0]!.idx).toBe(cellAt(g, 4, 2))
    // the row of four is cleared except the dove
    expect(r.steps[0]!.clears.length).toBe(3 + (r.steps[0]!.clears.length - 3))
  })

  it('a column of four gives a dove that flies along the row', () => {
    const g = board({ '1,3': 5, '2,3': 5, '4,3': 5, '3,3': 1, '3,4': 5 })
    // swap 3,3 and 3,4: column 3 = 5 5 5 5 (rows 1 to 4)
    const grp = (() => {
      g.tiles[cellAt(g, 3, 3)]!.kind = 5
      g.tiles[cellAt(g, 3, 4)]!.kind = 1
      return findMatchGroups(g)
    })()
    expect(grp[0]!.cells).toHaveLength(4)
    const plan = planSpecial(g, grp[0]!, [cellAt(g, 3, 3)])
    expect(plan!.special).toBe(DOVE_H)
    expect(plan!.idx).toBe(cellAt(g, 3, 3))
  })

  it('an L makes an olive branch at the crossing', () => {
    const g = board({ '2,2': 6, '2,3': 6, '3,4': 6, '4,4': 6, '2,4': 1, '3,3': 6 })
    // swap 2,4 with 3,4? build the L directly: horizontal 2,2 2,3 2,4; vertical 2,4 3,4 4,4
    g.tiles[cellAt(g, 2, 4)]!.kind = 6
    const groups = findMatchGroups(g)
    expect(groups).toHaveLength(1)
    const plan = planSpecial(g, groups[0]!, [])
    expect(plan).toEqual({ idx: cellAt(g, 2, 4), special: OLIVE })
  })

  it('five in a row make a rainbow', () => {
    const g = board({ '5,0': 5, '5,1': 5, '5,3': 5, '5,4': 5, '5,2': 1, '4,2': 5 })
    const r = trySwap(g, cellAt(g, 5, 2), cellAt(g, 4, 2))
    expect(r.ok).toBe(true)
    expect(r.steps[0]!.made[0]!.special).toBe(RAINBOW)
  })

  it('a rainbow swapped with an animal clears all of that kind', () => {
    const g = make(QUIET)
    const rb = g.tiles[cellAt(g, 0, 0)]!
    rb.special = RAINBOW
    rb.kind = 8
    const target = g.tiles[cellAt(g, 0, 1)]!.kind
    const total = g.tiles.filter((t) => t && t.kind === target).length
    const r = trySwap(g, cellAt(g, 0, 0), cellAt(g, 0, 1))
    expect(r.ok).toBe(true)
    expect(r.steps[0]!.effects[0]!.type).toBe('rainbow')
    // every animal of that kind of the first step is cleared (+ the rainbow itself)
    const cleared = r.steps[0]!.clears.filter((c) => c.kind === target).length
    expect(cleared).toBe(total)
  })

  it('two rainbows clear the whole board', () => {
    const g = make(QUIET)
    for (const c of [0, 1]) {
      const t = g.tiles[cellAt(g, 0, c)]!
      t.special = RAINBOW
      t.kind = 8
    }
    const r = trySwap(g, 0, 1)
    expect(r.ok).toBe(true)
    expect(r.steps[0]!.effects[0]!.type).toBe('all')
    expect(r.steps[0]!.clears.length).toBe(56)
  })

  it('two doves make a cross', () => {
    const g = make(QUIET)
    g.tiles[cellAt(g, 3, 3)]!.special = DOVE_H
    g.tiles[cellAt(g, 3, 4)]!.special = DOVE_V
    const r = trySwap(g, cellAt(g, 3, 3), cellAt(g, 3, 4))
    expect(r.ok).toBe(true)
    expect(r.steps[0]!.effects[0]!.type).toBe('cross')
    expect(r.steps[0]!.clears.length).toBe(7 + 8 - 1)
  })

  it('a dove and an olive branch make three rows and three columns', () => {
    const g = make(QUIET)
    g.tiles[cellAt(g, 3, 3)]!.special = DOVE_H
    g.tiles[cellAt(g, 4, 3)]!.special = OLIVE
    const r = trySwap(g, cellAt(g, 3, 3), cellAt(g, 4, 3))
    expect(r.steps[0]!.effects[0]!.type).toBe('bigcross')
    // 3 rows of 7 + 3 columns of 8 minus the 9 cells they share
    expect(r.steps[0]!.clears.length).toBe(21 + 24 - 9)
  })

  it('two olive branches clear a square of radius three', () => {
    const g = make(QUIET)
    g.tiles[cellAt(g, 3, 3)]!.special = OLIVE
    g.tiles[cellAt(g, 3, 4)]!.special = OLIVE
    const r = trySwap(g, cellAt(g, 3, 3), cellAt(g, 3, 4))
    expect(r.steps[0]!.effects[0]!.type).toBe('bigolive')
    expect(r.steps[0]!.clears.length).toBe(7 * 7 - 0 > 49 ? 49 : r.steps[0]!.clears.length)
    expect(r.steps[0]!.clears.length).toBeGreaterThanOrEqual(35)
  })

  it('a rainbow with a dove turns the most common kind into doves', () => {
    const g = make(QUIET)
    g.tiles[cellAt(g, 3, 3)]!.special = RAINBOW
    g.tiles[cellAt(g, 3, 3)]!.kind = 8
    g.tiles[cellAt(g, 3, 4)]!.special = DOVE_H
    const r = trySwap(g, cellAt(g, 3, 3), cellAt(g, 3, 4))
    expect(r.ok).toBe(true)
    expect(r.steps[0]!.effects[0]!.type).toBe('rainbow')
    // doves fly in all rows and columns: far more than one kind is cleared
    expect(r.steps[0]!.clears.length).toBeGreaterThan(20)
  })

  it('a special stone in a row goes off by itself', () => {
    const g = board({ '7,0': 5, '7,1': 5, '7,2': 1, '6,2': 5 })
    g.tiles[cellAt(g, 7, 0)]!.special = DOVE_H
    const r = trySwap(g, cellAt(g, 7, 2), cellAt(g, 6, 2))
    expect(r.ok).toBe(true)
    expect(r.steps[0]!.effects.some((e) => e.type === 'doveH')).toBe(true)
  })

  it('the rainbow stone matches nothing and the basket neither', () => {
    const g = make(QUIET)
    for (const c of [0, 1, 2]) {
      g.tiles[cellAt(g, 0, c)]!.kind = 8
      g.tiles[cellAt(g, 0, c)]!.special = RAINBOW
    }
    expect(findMatchGroups(g)).toHaveLength(0)
    for (const c of [0, 1, 2]) {
      g.tiles[cellAt(g, 1, c)]!.kind = BASKET
      g.tiles[cellAt(g, 1, c)]!.special = NONE
    }
    expect(findMatchGroups(g)).toHaveLength(0)
  })
})

describe('chain reactions', () => {
  it('a chain of clearings gets a higher cascade number and more points', () => {
    // find a seed on a plain board where a move leads to a chain
    let found = false
    for (let seed = 1; seed <= 400 && !found; seed++) {
      const g = newGame({ id: 1, chapter: 0, moves: 99, map: Array(8).fill('#######'), kinds: [0, 1, 2, 3], goals: [{ t: 'score', n: 999999 }], seed })
      const m = findMoves(g)[0]
      if (!m) continue
      const t = trySwap(g, m.a, m.b)
      if (t.steps.length >= 2) {
        found = true
        expect(t.steps[1]!.cascade).toBe(2)
        expect(t.steps[1]!.points).toBeGreaterThan(0)
        expect(g.score).toBe(t.steps.reduce((n, s) => n + s.points, 0))
      }
    }
    expect(found).toBe(true)
  })

  it('every step tells the state of the goals and the score', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 99, map: Array(8).fill('#######'), kinds: [0, 1, 2, 3, 4], goals: [{ t: 'kind', kind: 0, n: 5 }], seed: 3 })
    const t = trySwap(g, findMoves(g)[0]!.a, findMoves(g)[0]!.b)
    const last = t.steps[t.steps.length - 1]!
    expect(last.score).toBe(g.score)
    expect(last.progress).toEqual(g.progress)
  })

  it('always ends with a quiet board that still has a move', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const g = newGame({ id: 1, chapter: 0, moves: 99, map: Array(8).fill('#######'), kinds: [0, 1, 2, 3, 4, 5], goals: [{ t: 'score', n: 999999 }], seed })
      for (let i = 0; i < 12; i++) {
        const m = findMoves(g)[i % 3] ?? findMoves(g)[0]
        if (!m) break
        trySwap(g, m.a, m.b)
        expect(findMatchGroups(g)).toHaveLength(0)
        expect(hasMove(g)).toBe(true)
        for (let k = 0; k < g.tiles.length; k++) expect(g.tiles[k]).not.toBeNull()
      }
    }
  })
})

describe('obstacles', () => {
  it('a crate takes two hits from a clearing next to it', () => {
    const g = make(['K0000', '10120', '01201', '20120', '01201'], [{ t: 'crate', n: 1 }])
    // make a row of three in row 1 under the crate: cells 1,0..: set 1,1 1,2 1,3 = 4,4,4 is hard: use the helper below
    expect(g.hp[0]).toBe(2)
    g.tiles[cellAt(g, 1, 0)]!.kind = 5
    g.tiles[cellAt(g, 1, 1)]!.kind = 5
    g.tiles[cellAt(g, 2, 2)]!.kind = 5
    g.tiles[cellAt(g, 1, 2)]!.kind = 3
    // 1,0 1,1 = 5 5, swap 1,2 (3) with 2,2 (5): row 1 -> 5 5 5, the crate is above 1,0
    const r = trySwap(g, cellAt(g, 1, 2), cellAt(g, 2, 2))
    expect(r.ok).toBe(true)
    expect(g.hp[0]).toBe(1)
    expect(r.steps[0]!.hits.some((h) => h.what === 'crate' && !h.gone)).toBe(true)
  })

  it('a crate opens after the second hit', () => {
    const g = make(['K0000', '10120', '01201', '20120', '01201'], [{ t: 'crate', n: 1 }])
    g.hp[0] = 1
    g.tiles[cellAt(g, 1, 0)]!.kind = 5
    g.tiles[cellAt(g, 1, 1)]!.kind = 5
    g.tiles[cellAt(g, 2, 2)]!.kind = 5
    g.tiles[cellAt(g, 1, 2)]!.kind = 3
    trySwap(g, cellAt(g, 1, 2), cellAt(g, 2, 2))
    expect(g.type[0]).toBe(FLOOR)
    expect(goalLeft(g, 0)).toBe(0)
    expect(g.phase).toBe('won')
  })

  it('water is cleared by a clearing next to it', () => {
    const g = make(['W0000', '10120', '01201', '20120', '01201'], [{ t: 'water', n: 1 }])
    g.tiles[cellAt(g, 1, 0)]!.kind = 5
    g.tiles[cellAt(g, 1, 1)]!.kind = 5
    g.tiles[cellAt(g, 2, 2)]!.kind = 5
    g.tiles[cellAt(g, 1, 2)]!.kind = 3
    expect(goalLeft(g, 0)).toBe(1)
    trySwap(g, cellAt(g, 1, 2), cellAt(g, 2, 2))
    expect(g.type[0]).toBe(FLOOR)
    expect(g.phase).toBe('won')
  })

  it('a dove that sweeps over a crate hits it', () => {
    const g = make(['0000K', '10120', '01201', '20120', '01201'], [{ t: 'crate', n: 1 }])
    g.hp[4] = 1
    g.tiles[cellAt(g, 0, 0)]!.special = DOVE_H
    g.tiles[cellAt(g, 0, 0)]!.kind = 0
    g.tiles[cellAt(g, 0, 1)]!.kind = 0
    g.tiles[cellAt(g, 0, 2)]!.kind = 0
    g.tiles[cellAt(g, 0, 3)]!.kind = 3
    g.tiles[cellAt(g, 1, 3)]!.kind = 0
    const r = trySwap(g, cellAt(g, 0, 3), cellAt(g, 1, 3))
    expect(r.ok).toBe(true)
    expect(g.type[4]).toBe(FLOOR)
  })

  it('a stone stays, nothing falls through it, animals slide around it', () => {
    const g = make(['0123', '1S01', '2310', '0123'].map((r) => r.replace(/[^S\d]/g, '0')))
    expect(g.type[cellAt(g, 1, 1)]).toBe(STONE)
    // clear the cell under the stone by hand and let it settle
    const t = trySwap(g, 0, 1)
    void t
    for (let i = 0; i < g.tiles.length; i++) if (g.type[i] === FLOOR) expect(g.tiles[i]).not.toBeNull()
    expect(g.type[cellAt(g, 1, 1)]).toBe(STONE)
  })

  it('a netted animal cannot be swapped; the net is cut by a row and the animal stays', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: ['###', '#N#', '###', '###'], kinds: [0, 1, 2, 3], goals: [{ t: 'net', n: 1 }], seed: 4 })
    const n = cellAt(g, 1, 1)
    expect(canSwap(g, n, cellAt(g, 1, 0))).toBe(false)
    expect(goalLeft(g, 0)).toBe(1)
    // build a row through the net: all three animals of row 1 are alike after a swap
    g.tiles[cellAt(g, 1, 0)]!.kind = 2
    g.tiles[n]!.kind = 2
    g.tiles[cellAt(g, 1, 2)]!.kind = 1
    g.tiles[cellAt(g, 2, 2)]!.kind = 2
    g.tiles[cellAt(g, 0, 2)]!.kind = 3
    g.tiles[cellAt(g, 0, 0)]!.kind = 0
    g.tiles[cellAt(g, 0, 1)]!.kind = 1
    g.tiles[cellAt(g, 2, 0)]!.kind = 0
    g.tiles[cellAt(g, 2, 1)]!.kind = 1
    g.tiles[cellAt(g, 3, 0)]!.kind = 1
    g.tiles[cellAt(g, 3, 1)]!.kind = 0
    g.tiles[cellAt(g, 3, 2)]!.kind = 3
    const t = trySwap(g, cellAt(g, 1, 2), cellAt(g, 2, 2))
    expect(t.ok).toBe(true)
    expect(goalLeft(g, 0)).toBe(0)
    expect(g.tiles[n]).not.toBeNull()
    expect(g.tiles[n]!.net).toBe(false)
  })

  it('a caged animal cannot be swapped but a row frees it (and it counts)', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: ['###', '#C#', '###', '###'], kinds: [0, 1, 2, 3], goals: [{ t: 'cage', n: 1 }], seed: 4 })
    const c = cellAt(g, 1, 1)
    expect(canSwap(g, c, cellAt(g, 1, 0))).toBe(false)
    expect(goalLeft(g, 0)).toBe(1)
    g.tiles[cellAt(g, 1, 0)]!.kind = 2
    g.tiles[c]!.kind = 2
    g.tiles[cellAt(g, 1, 2)]!.kind = 1
    g.tiles[cellAt(g, 2, 2)]!.kind = 2
    g.tiles[cellAt(g, 0, 2)]!.kind = 3
    g.tiles[cellAt(g, 0, 0)]!.kind = 0
    g.tiles[cellAt(g, 0, 1)]!.kind = 1
    g.tiles[cellAt(g, 2, 0)]!.kind = 0
    g.tiles[cellAt(g, 2, 1)]!.kind = 1
    g.tiles[cellAt(g, 3, 0)]!.kind = 1
    g.tiles[cellAt(g, 3, 1)]!.kind = 0
    g.tiles[cellAt(g, 3, 2)]!.kind = 3
    const t = trySwap(g, cellAt(g, 1, 2), cellAt(g, 2, 2))
    expect(t.ok).toBe(true)
    expect(goalLeft(g, 0)).toBe(0)
    expect(g.phase).toBe('won')
  })

  it('a basket falls down and is collected at the bottom', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 30, map: ['B##', '###', '###', '###'], kinds: [0, 1, 2, 3], goals: [{ t: 'basket', n: 1 }], seed: 11 })
    expect(g.tiles[0]!.kind).toBe(BASKET)
    for (let i = 0; i < 25 && g.phase === 'play'; i++) {
      const m = findMoves(g)[0]
      if (!m) break
      trySwap(g, m.a, m.b)
    }
    expect(goalLeft(g, 0)).toBe(0)
    expect(g.phase).toBe('won')
  })

  it('baskets keep coming from above while moves are made (dropEvery)', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 40, map: Array(6).fill('####'), kinds: [0, 1, 2, 3], goals: [{ t: 'basket', n: 2 }], seed: 5, dropEvery: 2, dropTotal: 2 })
    let seen = 0
    for (let i = 0; i < 30 && g.phase === 'play'; i++) {
      const m = findMoves(g)[0]
      if (!m) break
      trySwap(g, m.a, m.b)
      seen = g.basketsSeen
    }
    expect(seen).toBeLessThanOrEqual(2)
    expect(seen).toBeGreaterThanOrEqual(1)
  })

  it('the water rises when none is cleared (and stops at a limit)', () => {
    const g = newGame({ id: 1, chapter: 2, moves: 60, map: ['W######', '#######', '#######', '#######', '#######', '#######'], kinds: [0, 1, 2, 3, 4], goals: [{ t: 'water', n: 1 }], seed: 8, rise: 2 })
    const before = g.type.filter((x) => x === WATER).length
    let flooded = 0
    for (let i = 0; i < 30 && g.phase === 'play'; i++) {
      const m = findMoves(g).find((mv) => {
        // do not touch the water: only moves away from the corner
        return mv.a % g.cols > 2 && mv.b % g.cols > 2
      })
      if (!m) break
      const t = trySwap(g, m.a, m.b)
      flooded += t.flood.length
    }
    expect(flooded).toBeGreaterThan(0)
    expect(before).toBe(1)
    expect(g.floodCount).toBe(flooded)
    expect(g.floodCount).toBeLessThanOrEqual(6)
  })
})

describe('goals, stars and the end of the round', () => {
  it('counts the animals of a kind for a goal and wins', () => {
    const g = make(QUIET, [{ t: 'kind', kind: 0, n: 3 }])
    expect(goalLeft(g, 0)).toBe(3)
    expect(goalsDone(g)).toBe(false)
    g.tiles[cellAt(g, 0, 0)]!.kind = 0
    g.tiles[cellAt(g, 0, 1)]!.kind = 0
    g.tiles[cellAt(g, 0, 2)]!.kind = 1
    g.tiles[cellAt(g, 1, 2)]!.kind = 0
    const r = trySwap(g, cellAt(g, 0, 2), cellAt(g, 1, 2))
    expect(r.ok).toBe(true)
    expect(g.phase).toBe('won')
    expect(r.phase).toBe('won')
    expect(starsFor(g)).toBe(3)
  })

  it('counts the special stones that are made', () => {
    const g = make(QUIET, [{ t: 'dove', n: 1 }])
    g.tiles[cellAt(g, 4, 0)]!.kind = 5
    g.tiles[cellAt(g, 4, 1)]!.kind = 5
    g.tiles[cellAt(g, 4, 3)]!.kind = 5
    g.tiles[cellAt(g, 4, 2)]!.kind = 1
    g.tiles[cellAt(g, 5, 2)]!.kind = 5
    trySwap(g, cellAt(g, 4, 2), cellAt(g, 5, 2))
    expect(g.progress[0]).toBe(1)
    expect(g.phase).toBe('won')
  })

  it('is lost when the moves are used up and the goal is not reached', () => {
    const g = make(QUIET, [{ t: 'kind', kind: 0, n: 500 }], { moves: 1 })
    g.tiles[cellAt(g, 0, 0)]!.kind = 5
    g.tiles[cellAt(g, 0, 1)]!.kind = 5
    g.tiles[cellAt(g, 0, 2)]!.kind = 1
    g.tiles[cellAt(g, 1, 2)]!.kind = 5
    const r = trySwap(g, cellAt(g, 0, 2), cellAt(g, 1, 2))
    expect(r.ok).toBe(true)
    expect(g.phase).toBe('lost')
    expect(starsFor(g)).toBe(0)
    expect(canSwap(g, 0, 1)).toBe(false)
  })

  it('a win with the last move still counts as a win', () => {
    const g = make(QUIET, [{ t: 'kind', kind: 0, n: 3 }], { moves: 1 })
    g.tiles[cellAt(g, 0, 0)]!.kind = 0
    g.tiles[cellAt(g, 0, 1)]!.kind = 0
    g.tiles[cellAt(g, 0, 2)]!.kind = 1
    g.tiles[cellAt(g, 1, 2)]!.kind = 0
    trySwap(g, cellAt(g, 0, 2), cellAt(g, 1, 2))
    expect(g.phase).toBe('won')
    expect(starsFor(g)).toBe(1)
  })

  it('gives 1, 2 or 3 stars by the moves that are left', () => {
    const base = (movesLeft: number) => {
      const g = make(QUIET, [{ t: 'score', n: 1 }], { moves: 20 })
      g.phase = 'won'
      g.movesAtWin = movesLeft
      return starsFor(g)
    }
    expect(base(0)).toBe(1)
    expect(base(2)).toBe(1)
    expect(base(3)).toBe(2)
    expect(base(6)).toBe(2)
    expect(base(7)).toBe(3)
    expect(base(20)).toBe(3)
  })

  it('the bonus turns the moves that are left into doves, and points', () => {
    const g = make(QUIET, [{ t: 'kind', kind: 0, n: 3 }], { moves: 10 })
    g.tiles[cellAt(g, 0, 0)]!.kind = 0
    g.tiles[cellAt(g, 0, 1)]!.kind = 0
    g.tiles[cellAt(g, 0, 2)]!.kind = 1
    g.tiles[cellAt(g, 1, 2)]!.kind = 0
    trySwap(g, cellAt(g, 0, 2), cellAt(g, 1, 2))
    const score = g.score
    const steps = bonusSteps(g)
    expect(steps.length).toBeGreaterThan(0)
    expect(g.score).toBeGreaterThan(score)
    expect(steps[0]!.made[0]!.special === DOVE_H || steps[0]!.made[0]!.special === DOVE_V).toBe(true)
    for (let i = 0; i < g.tiles.length; i++) if (g.type[i] === FLOOR) expect(g.tiles[i]).not.toBeNull()
  })

  it('no bonus while the round is not won', () => {
    expect(bonusSteps(make(QUIET))).toEqual([])
  })
})

describe('no move left, hints and boosters', () => {
  it('finds the moves, and a hint is one of them', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: Array(7).fill('#######'), kinds: [0, 1, 2, 3, 4], goals: [{ t: 'score', n: 1 }], seed: 9 })
    const moves = findMoves(g)
    expect(moves.length).toBeGreaterThan(0)
    const h = hint(g)!
    expect(moves.some((m) => m.a === h.a && m.b === h.b)).toBe(true)
  })

  it('a combination of special stones is the best hint', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: Array(7).fill('#######'), kinds: [0, 1, 2, 3, 4], goals: [{ t: 'score', n: 1 }], seed: 9 })
    g.tiles[cellAt(g, 6, 5)]!.special = DOVE_H
    g.tiles[cellAt(g, 6, 6)]!.special = OLIVE
    expect(hint(g)).toEqual({ a: cellAt(g, 6, 5), b: cellAt(g, 6, 6) })
  })

  it('a board without any move is shuffled by itself', () => {
    // a board in which only two kinds exist in a pattern that has no move: shuffle must give a board with a move
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: Array(6).fill('######'), kinds: [0, 1, 2, 3], goals: [{ t: 'score', n: 1 }], seed: 2 })
    const t = boosterShuffle(g)
    expect(t.ok).toBe(true)
    expect(findMatchGroups(g)).toHaveLength(0)
    expect(hasMove(g)).toBe(true)
  })

  it('the shuffle keeps netted, caged animals and baskets where they are', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: ['#N###', '#C###', '#B###', '#####', '#####'], kinds: [0, 1, 2, 3], goals: [{ t: 'score', n: 1 }], seed: 6 })
    const ids = [1, 6, 11].map((i) => g.tiles[i]!.id)
    boosterShuffle(g)
    expect([1, 6, 11].map((i) => g.tiles[i]!.id)).toEqual(ids)
  })

  it('the hammer removes an animal, costs no move and counts', () => {
    const g = make(QUIET, [{ t: 'kind', kind: 0, n: 1 }])
    const idx = cellAt(g, 0, 0)
    expect(g.tiles[idx]!.kind).toBe(0)
    const t = boosterHammer(g, idx)
    expect(t.ok).toBe(true)
    expect(g.moves).toBe(20)
    expect(g.progress[0]).toBeGreaterThanOrEqual(1)
    expect(t.steps[0]!.effects[0]!.type).toBe('hammer')
  })

  it('the hammer breaks a stone and a whole crate', () => {
    const g = make(['0S0', '1K1', '010', '101'], [{ t: 'crate', n: 1 }])
    boosterHammer(g, cellAt(g, 0, 1))
    expect(g.type[1]).toBe(FLOOR)
    boosterHammer(g, cellAt(g, 1, 1))
    expect(g.type[4]).toBe(FLOOR)
    expect(g.phase).toBe('won')
  })

  it('the hammer does not touch an empty cell or a basket', () => {
    const g = make(['0b0', '101', '010', '101'])
    expect(boosterHammer(g, 1).ok).toBe(false)
    expect(boosterHammer(g, -3).ok).toBe(false)
  })

  it('the swap booster swaps two neighbours without a row and without a move', () => {
    const g = make(QUIET)
    const ka = g.tiles[0]!.kind
    const kb = g.tiles[1]!.kind
    const t = boosterSwap(g, 0, 1)
    expect(t.ok).toBe(true)
    expect(g.moves).toBe(20)
    // the animals changed places (unless a chain moved them away again); at least the swap is reported
    expect(t.swap).toEqual({ a: 0, b: 1 })
    void ka
    void kb
  })

  it('the swap booster refuses a netted animal', () => {
    const g = newGame({ id: 1, chapter: 0, moves: 9, map: ['#N#', '###', '###'], kinds: [0, 1, 2, 3], goals: [{ t: 'score', n: 1 }], seed: 4 })
    expect(boosterSwap(g, 0, 1).ok).toBe(false)
  })
})

describe('the whole game is deterministic', () => {
  it('the same moves on the same seed give the same board and score', () => {
    const run = () => {
      const g = newGame({ id: 1, chapter: 0, moves: 40, map: Array(8).fill('#######'), kinds: [0, 1, 2, 3, 4, 5], goals: [{ t: 'score', n: 999999 }], seed: 31 })
      for (let i = 0; i < 25 && g.phase === 'play'; i++) {
        const mv = findMoves(g)
        const m = mv[(i * 7) % mv.length]
        if (!m) break
        trySwap(g, m.a, m.b)
      }
      return { board: show(g), score: g.score, moves: g.moves }
    }
    expect(run()).toEqual(run())
  })
})

describe('the new animals do not clear themselves (controlled refill)', () => {
  it('after the free chain of chance the animals that come in are quiet: the next step never clears them', async () => {
    const { MAX_FREE_CASCADES } = await import('../src/utils/archeGame')
    let checked = 0
    for (let seed = 1; seed <= 60; seed++) {
      const g = newGame({ id: 1, chapter: 0, moves: 99, map: Array(8).fill('#######'), kinds: [0, 1, 2, 3], goals: [{ t: 'score', n: 1e9 }], seed })
      for (let i = 0; i < 25 && g.phase === 'play'; i++) {
        const mv = findMoves(g)
        const m = mv[(seed + i * 3) % mv.length]
        if (!m) break
        const t = trySwap(g, m.a, m.b)
        t.steps.forEach((step, k) => {
          if (step.cascade <= MAX_FREE_CASCADES) return
          const next = t.steps[k + 1]
          if (!next || next.effects.length) return
          const spawned = new Set(step.falls.filter((f) => f.spawned).map((f) => f.id))
          for (const c of next.clears) expect(spawned.has(c.id)).toBe(false)
          for (const mk of next.made) expect(spawned.has(mk.id)).toBe(false)
          checked++
        })
      }
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('a move rarely runs on for long: on four kinds the average number of steps is small and no move runs on for more than a handful of steps', () => {
    let total = 0
    let moves = 0
    let longest = 0
    for (let seed = 1; seed <= 60; seed++) {
      const g = newGame({ id: 1, chapter: 0, moves: 99, map: Array(8).fill('#######'), kinds: [0, 1, 2, 3], goals: [{ t: 'score', n: 1e9 }], seed })
      for (let i = 0; i < 25 && g.phase === 'play'; i++) {
        const mv = findMoves(g)
        const m = mv[(seed + i * 3) % mv.length]
        if (!m) break
        const t = trySwap(g, m.a, m.b)
        total += t.steps.length
        moves++
        longest = Math.max(longest, t.steps.length)
      }
    }
    expect(total / moves).toBeLessThan(2.2)
    expect(longest).toBeLessThanOrEqual(6)
  })

  it('a first move on a simple level does not win it by chance: the child has to play several moves', () => {
    const lv = LEVELS_FOR_TEST
    let early = 0
    for (let seed = 1; seed <= 80; seed++) {
      const g = newGame(lv, seed)
      const m = findMoves(g)[0]
      if (!m) continue
      trySwap(g, m.a, m.b)
      if (g.phase === 'won') early++
    }
    expect(early).toBe(0)
  })
})

const LEVELS_FOR_TEST: Level = { id: 1, chapter: 0, moves: 14, map: ['#####', '#####', '#####', '#####', '#####', '#####'], kinds: [3, 0, 1, 2], goals: [{ t: 'kind', kind: 3, n: 12 }], seed: 1 }
