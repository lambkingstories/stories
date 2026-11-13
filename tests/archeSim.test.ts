/**
 * Plays every level of "Arche der Tierpaare" with the simple bot (`archeBot.ts`, a casual player: it plays the best move it sees, one move
 * in three at random) and checks that the levels can be won, and that the levels get harder from chapter to chapter.
 */
import { describe, expect, it } from 'vitest'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, SIM_SEEDS } from '../src/utils/archeLevels'
import { FLOOR, findMatchGroups, findMoves, hasMove, newGame, trySwap, type Level } from '../src/utils/archeGame'
import { playLevel } from './archeBot'

const TRIES = 100
const rates: number[] = []

describe('simulation: every level can be won', () => {
  for (const lv of LEVELS) {
    it(`level ${lv.id} is won in at least 30 of ${TRIES} tries by the bot`, () => {
      let wins = 0
      for (const seed of SIM_SEEDS(lv, TRIES)) if (playLevel(lv, seed, 0.3).won) wins++
      rates[lv.id - 1] = wins / TRIES
      expect(wins).toBeGreaterThanOrEqual(30)
    })
  }

  it('the levels get harder: the share of won rounds falls from chapter to chapter (roughly)', () => {
    expect(rates.filter((r) => r !== undefined)).toHaveLength(LEVELS.length)
    const avg = (c: number) => rates.slice(c * LEVELS_PER_CHAPTER, (c + 1) * LEVELS_PER_CHAPTER).reduce((a, b) => a + b, 0) / LEVELS_PER_CHAPTER
    const chapter = Array.from({ length: CHAPTER_COUNT }, (_, c) => avg(c))
    expect(chapter[0]!).toBeGreaterThan(0.9)
    expect(chapter[CHAPTER_COUNT - 1]!).toBeLessThan(0.75)
    for (let c = 1; c < CHAPTER_COUNT; c++) expect(chapter[c]!).toBeLessThan(chapter[c - 1]! + 0.04)
    expect(chapter[0]!).toBeGreaterThan(chapter[CHAPTER_COUNT - 1]! + 0.25)
  })

  it('a level is not trivial: the last levels are lost now and then', () => {
    for (const lv of LEVELS.slice(-10)) expect(rates[lv.id - 1]!).toBeLessThan(0.95)
  })
})

describe('random play on every level (nothing breaks)', () => {
  /** A player that plays any valid move: the board must stay in order after each move. */
  function fuzz(level: Level, seed: number) {
    const g = newGame(level, seed)
    let moves = 0
    while (g.phase === 'play' && moves < level.moves + 2) {
      const mv = findMoves(g)
      expect(mv.length).toBeGreaterThan(0)
      const m = mv[(seed + moves * 5) % mv.length]!
      const t = trySwap(g, m.a, m.b)
      expect(t.ok).toBe(true)
      moves++
      // the board is quiet
      expect(findMatchGroups(g)).toHaveLength(0)
      if (g.phase === 'play') expect(hasMove(g)).toBe(true)
      // nothing stands on a cell that is no floor
      for (let i = 0; i < g.tiles.length; i++) if (g.type[i] !== FLOOR) expect(g.tiles[i]).toBeNull()
      expect(g.score).toBeGreaterThanOrEqual(0)
      expect(g.moves).toBe(level.moves - moves)
    }
    return g
  }
  it('keeps the board in order on all 60 levels with a few start values', () => {
    for (const lv of LEVELS) for (let k = 0; k < 4; k++) fuzz(lv, lv.seed + k * 101)
  })
})
