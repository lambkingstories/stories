import { describe, expect, it } from 'vitest'
import { MEMORY_SIZES, MEMORY_SIZE_LIST, bestColumns, buildMemory, isMatch, nextPlayer } from '../src/utils/memoryGame'
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
