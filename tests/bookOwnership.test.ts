import { describe, expect, it } from 'vitest'
import { matchesOwnFilter, ownCounts, ownershipOf } from '@/utils/bookOwnership'

describe('what a person has of a book', () => {
  it('names the state: free before bought before Plus before still to buy', () => {
    expect(ownershipOf({ free: true, owned: true, plus: true })).toBe('free')
    expect(ownershipOf({ free: false, owned: true, plus: true })).toBe('owned')
    expect(ownershipOf({ free: false, owned: false, plus: true })).toBe('plus')
    expect(ownershipOf({ free: false, owned: false, plus: false })).toBe('locked')
  })

  it('sorts the books into "I have" and "to buy"', () => {
    const states = ['free', 'owned', 'plus', 'locked', 'locked'] as const
    expect(states.filter((s) => matchesOwnFilter(s, 'mine'))).toEqual(['free', 'owned', 'plus'])
    expect(states.filter((s) => matchesOwnFilter(s, 'buy'))).toEqual(['locked', 'locked'])
    expect(ownCounts([...states])).toEqual({ all: 5, mine: 3, buy: 2 })
  })
})
