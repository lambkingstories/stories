import { describe, expect, it } from 'vitest'
import { albumCards, albumSetCard, albumTotals, starsOf } from '../src/utils/collection'
import { stageStarsOf } from '../src/utils/adventureScore'
import type { Journey, StageProgress } from '../src/types/adventure'

const journey = {
  id: 'x',
  title: 'Der Weg',
  medal: 'm.webp',
  stages: [
    { id: 1, title: 'Eins', image: 'a.webp', ref: '1. Mose 1' },
    { id: 2, title: 'Zwei', image: 'b.webp', ref: '1. Mose 2' },
    { id: 3, title: 'Drei', image: 'c.webp', ref: '1. Mose 3' },
    { id: 4, title: 'Vier', image: 'd.webp', ref: '1. Mose 4', soon: true }
  ]
} as unknown as Journey

const progress: Record<number, StageProgress> = {
  1: { stars: 2, finalStars: 3, done: true },
  2: { stars: 1, done: true },
  3: { stars: 3, done: false }
}

describe('collection', () => {
  it('uses the final stars when there are some, else the stars of the task', () => {
    expect(starsOf({ stars: 2, finalStars: 3, done: true })).toBe(3)
    expect(starsOf({ stars: 1, done: true })).toBe(1)
    expect(starsOf(undefined)).toBe(0)
  })

  it('the best try counts: a worse try later takes no star away', () => {
    expect(starsOf({ stars: 1, finalStars: 1, bestStars: 3, done: true })).toBe(3)
    expect(stageStarsOf({ stars: 1, gameStars: 1, bestStars: 2, done: true })).toBe(2)
    expect(stageStarsOf({ stars: 3, finalStars: 3, bestStars: 1, done: true })).toBe(3)
  })

  it('makes one card per ready stage and only stages that are done are played', () => {
    const cards = albumCards(journey, (id) => progress[id])
    expect(cards.map((c) => c.stageId)).toEqual([1, 2, 3])
    expect(cards.map((c) => c.played)).toEqual([true, true, false])
    expect(cards[0]!.ref).toBe('1. Mose 1')
  })

  it('a card needs three stars; the others say how many stars are missing', () => {
    const cards = albumCards(journey, (id) => progress[id])
    expect(cards.map((c) => c.have)).toEqual([true, false, false])
    expect(cards.map((c) => c.missing)).toEqual([0, 2, 3])
    expect(cards[2]!.stars).toBe(0)
  })

  it('the special card comes with all the cards of the journey', () => {
    const open = albumCards(journey, (id) => progress[id])
    expect(albumSetCard(journey, open)).toMatchObject({ have: false, count: 1, all: 3, image: 'm.webp' })
    const all = albumCards(journey, () => ({ stars: 3, finalStars: 3, done: true }))
    expect(albumSetCard(journey, all)).toMatchObject({ have: true, count: 3, all: 3 })
  })

  it('counts cards and special cards over all journeys', () => {
    const a = albumCards(journey, (id) => progress[id])
    const full = albumCards(journey, () => ({ stars: 3, finalStars: 3, done: true }))
    expect(albumTotals([a, full])).toEqual({ have: 4, all: 6, sets: 1 })
  })
})
