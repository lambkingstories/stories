import { describe, expect, it } from 'vitest'
import { MAX_QUESTIONS, buildWhoDeck, cardsFor, guesserOf, pointsFor } from '../src/utils/whoAmI'
import { WHO_PEOPLE } from '../src/data/whoAmI'
import { mulberry32 } from '../src/utils/familyCode'

describe('who am I', () => {
  it('gives 3 points up to 5 questions, 2 up to 10, 1 up to the end and nothing beyond', () => {
    expect([0, 1, 5].map(pointsFor)).toEqual([3, 3, 3])
    expect([6, 10].map(pointsFor)).toEqual([2, 2])
    expect([11, MAX_QUESTIONS].map(pointsFor)).toEqual([1, 1])
    expect(pointsFor(MAX_QUESTIONS + 1)).toBe(0)
    expect(pointsFor(-1)).toBe(0)
  })

  it('every person has a name and three facts in all three languages', () => {
    for (const person of WHO_PEOPLE) {
      for (const l of ['de', 'en', 'es'] as const) {
        expect(person.name[l].trim()).not.toBe('')
        expect(person.facts[l]).toHaveLength(3)
        for (const f of person.facts[l]) expect(f.trim()).not.toBe('')
      }
    }
    expect(new Set(WHO_PEOPLE.map((p) => p.name.de)).size).toBe(WHO_PEOPLE.length)
  })

  it('a fact never gives the name away in the same language', () => {
    // the facts are for the people who answer, but a card that names itself would be no riddle for a reader who peeks
    for (const person of WHO_PEOPLE) {
      for (const l of ['de', 'en', 'es'] as const) {
        const own = person.name[l].toLowerCase()
        for (const f of person.facts[l]) {
          if (['Johannes der Täufer', 'John the Baptist', 'Juan el Bautista'].includes(person.name[l])) continue
          expect(f.toLowerCase().includes(own), `${person.name[l]}: ${f}`).toBe(false)
        }
      }
    }
  })

  it('builds a deck of different people, never more than there are', () => {
    const deck = buildWhoDeck(10, mulberry32(3))
    expect(deck).toHaveLength(10)
    expect(new Set(deck.map((d) => d.name.de)).size).toBe(10)
    expect(buildWhoDeck(1000)).toHaveLength(WHO_PEOPLE.length)
    expect(buildWhoDeck(0)).toEqual([])
  })

  it('every person guesses in turn and the number of cards is capped', () => {
    expect([0, 1, 2, 3, 4].map((i) => guesserOf(i, 3))).toEqual([0, 1, 2, 0, 1])
    expect(cardsFor(3, 2)).toBe(6)
    expect(cardsFor(8, 3, 20)).toBe(20)
    expect(cardsFor(0, 2)).toBe(0)
  })
})
