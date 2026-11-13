/** The data of the levels of "Arche der Tierpaare": number, chapters, maps, goals, and that every cell of a map can be supplied with animals. */
import { describe, expect, it } from 'vitest'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, MAPS, PAIR_KIND, SIM_SEEDS } from '../src/utils/archeLevels'
import { KIND_COUNT, checkLevel, findMatchGroups, hasMove, newGame } from '../src/utils/archeGame'

describe('the levels', () => {
  it('are at least 60, in six chapters of ten, numbered from 1', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(60)
    expect(CHAPTER_COUNT).toBe(6)
    LEVELS.forEach((l, i) => {
      expect(l.id).toBe(i + 1)
      expect(l.chapter).toBe(Math.floor(i / LEVELS_PER_CHAPTER))
    })
  })

  it('are valid definitions', () => {
    for (const l of LEVELS) expect(checkLevel(l), `level ${l.id}`).toEqual([])
  })

  it('have goals that can be done with the animals and the obstacles of the level', () => {
    for (const l of LEVELS) {
      const map = l.map.join('')
      for (const g of l.goals) {
        if (g.t === 'kind') expect(l.kinds, `level ${l.id}: kind goal`).toContain(g.kind)
        if (g.t === 'kind' || g.t === 'basket' || g.t === 'dove' || g.t === 'olive' || g.t === 'rainbow') expect(g.n, `level ${l.id}`).toBeGreaterThan(0)
        if (g.t === 'water') expect(map.includes('W'), `level ${l.id}: water goal needs water`).toBe(true)
        if (g.t === 'crate') expect(map.includes('K'), `level ${l.id}`).toBe(true)
        if (g.t === 'net') expect(map.includes('N'), `level ${l.id}`).toBe(true)
        if (g.t === 'cage') expect(map.includes('C'), `level ${l.id}`).toBe(true)
        if (g.t === 'basket') {
          expect(l.dropTotal ?? 0, `level ${l.id}`).toBeGreaterThanOrEqual(g.n)
          expect(l.dropEvery, `level ${l.id}`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('use only the animals that exist, 4 to 7 of them, and every animal appears somewhere', () => {
    const seen = new Set<number>()
    for (const l of LEVELS) {
      expect(l.kinds.length).toBeGreaterThanOrEqual(4)
      expect(new Set(l.kinds).size).toBe(l.kinds.length)
      for (const k of l.kinds) {
        expect(k).toBeLessThan(KIND_COUNT)
        seen.add(k)
      }
    }
    expect(seen.size).toBe(KIND_COUNT)
  })

  it('bring in the obstacles one after the other: crates, stones, baskets, water, nets, cages', () => {
    const first = (pred: (m: string, l: (typeof LEVELS)[number]) => boolean) => LEVELS.findIndex((l) => pred(l.map.join(''), l)) + 1
    expect(first((m) => m.includes('K'))).toBe(6)
    expect(first((m) => m.includes('S'))).toBe(7)
    expect(first((m) => m.includes('B'))).toBe(9)
    expect(first((m) => m.includes('W'))).toBe(11)
    expect(first((m) => m.includes('N'))).toBe(13)
    expect(first((m) => m.includes('C'))).toBe(22)
    expect(first((_m, l) => !!l.rise)).toBe(21)
    expect(LEVELS[2]!.goals.some((g) => g.t === 'dove')).toBe(true)
    expect(LEVELS[3]!.goals.some((g) => g.t === 'olive')).toBe(true)
    expect(LEVELS[4]!.goals.some((g) => g.t === 'rainbow')).toBe(true)
  })

  it('give more moves for more to do (the last level has more than the first)', () => {
    expect(LEVELS[59]!.moves).toBeGreaterThan(LEVELS[0]!.moves)
  })

  it('start with a quiet board and a move, with every start value of the simulation', () => {
    for (const l of LEVELS) {
      for (const seed of SIM_SEEDS(l, 5)) {
        const g = newGame(l, seed)
        expect(findMatchGroups(g), `level ${l.id}`).toHaveLength(0)
        expect(hasMove(g), `level ${l.id}`).toBe(true)
      }
    }
  })

  it('has the pair of a level: seven kinds in turn', () => {
    expect(PAIR_KIND(0)).not.toBe(PAIR_KIND(1))
    expect(new Set(Array.from({ length: 7 }, (_, i) => PAIR_KIND(i))).size).toBe(7)
  })
})

describe('the maps', () => {
  /** A cell of a map is supplied when animals can reach it: from the top edge, or from above (also through cells that open later), or sliding in from the side. */
  function unsupplied(map: string[]): string[] {
    const rows = map.length
    const cols = map[0]!.length
    const open = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && map[r]![c] !== '.' && map[r]![c] !== 'S'
    const sup: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false))
    const bad: string[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!open(r, c)) continue
        const above = r === 0 || map[r - 1]![c] === '.'
        sup[r]![c] = above || (open(r - 1, c) && sup[r - 1]![c]!) || (open(r - 1, c - 1) && sup[r - 1]![c - 1]!) || (open(r - 1, c + 1) && sup[r - 1]![c + 1]!)
        if (!sup[r]![c]) bad.push(`${r},${c}`)
      }
    }
    return bad
  }
  it('leave no pocket in which animals can never arrive', () => {
    for (const [name, m] of Object.entries(MAPS)) expect(unsupplied(m), name).toEqual([])
  })

  it('have rows of equal length and fit on the screen', () => {
    for (const [name, m] of Object.entries(MAPS)) {
      expect(new Set(m.map((r) => r.length)).size, name).toBe(1)
      expect(m.length, name).toBeLessThanOrEqual(8)
      expect(m[0]!.length, name).toBeLessThanOrEqual(7)
    }
  })
})
