import { describe, expect, it } from 'vitest'
import { MEMORY_SIZES, MEMORY_SIZE_LIST, bestColumns, buildMemory, isMatch, nextPlayer, parseMemorySnap } from '../src/utils/memoryGame'
import { MEMORY_SCENES } from '../src/data/memoryScenes'
import { mulberry32 } from '../src/utils/familyCode'

describe('memory game', () => {
  it('has three sizes that fill whole rows and fit the scenes there are', () => {
    expect(MEMORY_SIZE_LIST).toEqual(['small', 'medium', 'large'])
    for (const s of MEMORY_SIZE_LIST) {
      const { cols, pairs } = MEMORY_SIZES[s]
      expect((pairs * 2) % cols).toBe(0)
      expect(pairs).toBeLessThanOrEqual(MEMORY_SCENES.length)
    }
    expect(MEMORY_SIZES.small.pairs).toBeLessThan(MEMORY_SIZES.medium.pairs)
    expect(MEMORY_SIZES.medium.pairs).toBeLessThan(MEMORY_SIZES.large.pairs)
  })

  it('every scene has a name in all three languages and none appears twice', () => {
    for (const sc of MEMORY_SCENES) for (const l of ['de', 'en', 'es'] as const) expect(sc[l].trim()).not.toBe('')
    expect(new Set(MEMORY_SCENES.map((x) => x.de)).size).toBe(MEMORY_SCENES.length)
  })

  it('builds every scene exactly twice', () => {
    for (const s of MEMORY_SIZE_LIST) {
      const { pairs } = MEMORY_SIZES[s]
      const cards = buildMemory(pairs, mulberry32(9))
      expect(cards).toHaveLength(pairs * 2)
      expect(cards.map((c) => c.id)).toEqual(cards.map((_, i) => i))
      const count = new Map<number, number>()
      for (const c of cards) count.set(c.scene, (count.get(c.scene) ?? 0) + 1)
      expect(count.size).toBe(pairs)
      for (const n of count.values()) expect(n).toBe(2)
    }
    expect(buildMemory(100)).toHaveLength(MEMORY_SCENES.length * 2)
    expect(buildMemory(0)).toEqual([])
  })

  it('the cards are in another order every time', () => {
    const a = buildMemory(10, mulberry32(1)).map((c) => c.scene)
    const b = buildMemory(10, mulberry32(2)).map((c) => c.scene)
    expect(a).not.toEqual(b)
  })

  it('two different cards with the same scene are a pair, nothing else', () => {
    const cards = buildMemory(6, mulberry32(3))
    const first = cards[0]!
    const twin = cards.find((c) => c.scene === first.scene && c.id !== first.id)!
    const other = cards.find((c) => c.scene !== first.scene)!
    expect(isMatch(first, twin)).toBe(true)
    expect(isMatch(twin, first)).toBe(true)
    expect(isMatch(first, other)).toBe(false)
    expect(isMatch(first, first)).toBe(false)
  })

  it('after a pair the same person goes on, after a miss the next one', () => {
    expect(nextPlayer(1, 3, true)).toBe(1)
    expect(nextPlayer(1, 3, false)).toBe(2)
    expect(nextPlayer(2, 3, false)).toBe(0)
    expect(nextPlayer(0, 1, false)).toBe(0)
  })

  it('a kept round is read back only when it has the right shape', () => {
    const cards = buildMemory(MEMORY_SIZES.small.pairs, mulberry32(4))
    const twin = (id: number) => cards.find((c) => c.scene === cards[id]!.scene && c.id !== id)!.id
    const base = { size: 'small', playerCount: 2, names: ['Anna', ''], cards, open: [] as number[], found: [] as number[], turn: 0, scores: [0, 0], moves: 0 }
    expect(parseMemorySnap(JSON.parse(JSON.stringify(base)))).toEqual(base)
    // a found pair (with its point) and one card turned over
    const a = 0
    const b = twin(0)
    const other = cards.find((c) => c.scene !== cards[0]!.scene)!.id
    const mid = { ...base, found: [a, b], open: [other], scores: [1, 0], moves: 1, turn: 0 }
    expect(parseMemorySnap(JSON.parse(JSON.stringify(mid)))).toEqual(mid)
    // a miss that was not turned back yet is allowed ...
    const third = cards.find((c) => c.scene !== cards[0]!.scene && c.scene !== cards[other]!.scene)!.id
    expect(parseMemorySnap({ ...mid, open: [other, third] })).not.toBeNull()
    // ... but two turned cards that are a pair, a point that does not match the found pairs, other numbers of cards, scenes or players are not
    expect(parseMemorySnap({ ...base, open: [a, b] })).toBeNull()
    expect(parseMemorySnap({ ...mid, scores: [0, 0] })).toBeNull()
    expect(parseMemorySnap({ ...mid, found: [a] })).toBeNull()
    expect(parseMemorySnap({ ...base, cards: cards.slice(1) })).toBeNull()
    expect(parseMemorySnap({ ...base, cards: cards.map((c) => ({ ...c, scene: 999 })) })).toBeNull()
    expect(parseMemorySnap({ ...base, size: 'huge' })).toBeNull()
    expect(parseMemorySnap({ ...base, turn: 2 })).toBeNull()
    expect(parseMemorySnap({ ...base, playerCount: 3 })).toBeNull()
    expect(parseMemorySnap({ ...base, open: [1, 1] })).toBeNull()
    expect(parseMemorySnap(null)).toBeNull()
    expect(parseMemorySnap('x')).toBeNull()
  })

  it('on a turned phone the cards are as big as they can be and all of them fit', () => {
    for (const n of [12, 20, 30]) {
      const { cols, cardWidth } = bestColumns(n, 780, 250)
      const rows = Math.ceil(n / cols)
      expect(cardWidth).toBeGreaterThan(30)
      expect(cols * cardWidth + (cols - 1) * 8).toBeLessThanOrEqual(780)
      expect(rows * cardWidth * 1.5 + (rows - 1) * 8).toBeLessThanOrEqual(250)
    }
    // a wide screen takes more columns than a narrow one
    expect(bestColumns(20, 800, 300).cols).toBeGreaterThan(bestColumns(20, 400, 800).cols)
    expect(bestColumns(0, 100, 100).cols).toBe(1)
  })
})
