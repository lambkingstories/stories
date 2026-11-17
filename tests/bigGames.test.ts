import { beforeEach, describe, expect, it } from 'vitest'
import useBigGames from '../src/use/useBigGames'
import { bigGameStates, totalStars, wishState } from '../src/utils/bigGames'
import type { Journey, JourneyProgress } from '../src/types/adventure'

const games = [
  { id: 'david' as const, image: 'a.webp', maxStars: 1 },
  { id: 'elia' as const, image: 'b.webp', maxStars: 1 }
]

describe('big games', () => {
  it('counts the stars of all stages of all journeys (the exam does not)', () => {
    const progress: Record<string, JourneyProgress> = {
      a: { stages: { 1: { stars: 3, finalStars: 3, done: true }, 2: { stars: 1, done: true } }, exam: { correct: 5, total: 6 } },
      b: { stages: { 1: { stars: 2, finalStars: 1, bestStars: 2, done: true } } }
    }
    const journeys = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as unknown as Journey[]
    expect(totalStars(journeys, (id) => progress[id])).toBe(6)
  })

  it('a game is open when it was picked, not by stars (the stars give wishes: see gameWishes.test.ts)', () => {
    expect(bigGameStates(games, []).map((x) => x.open)).toEqual([false, false])
    expect(bigGameStates(games, ['elia']).map((x) => x.open)).toEqual([false, true])
    // an unknown id opens nothing
    expect(bigGameStates(games, ['nonsense']).map((x) => x.open)).toEqual([false, false])
  })

  it('the way to the next wish: stars missing and share', () => {
    expect(wishState(games, 12, [])).toMatchObject({ free: 0, missing: 28, share: 0.3, allOpen: false })
    expect(wishState(games, 45, [])).toMatchObject({ free: 1, missing: 35 })
    expect(wishState(games, 1000, ['david', 'elia']).allOpen).toBe(true)
  })
})

describe('progress of a big game', () => {
  const bg = useBigGames()
  beforeEach(() => localStorage.removeItem('lk-biggames-v1'))

  it('keeps the best stars of a level', () => {
    bg.record('test-game', 1, 2)
    bg.record('test-game', 1, 1)
    bg.record('test-game', 0, 3)
    expect(bg.levels('test-game')[1]).toBe(2)
    expect(bg.levels('test-game')[0]).toBe(3)
    expect(bg.stars('test-game')).toBe(5)
  })
})
