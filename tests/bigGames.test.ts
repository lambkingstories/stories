import { beforeEach, describe, expect, it } from 'vitest'
import useBigGames from '../src/use/useBigGames'
import { bigGameStates, nextBigGame, totalStars } from '../src/utils/bigGames'
import type { Journey, JourneyProgress } from '../src/types/adventure'

const games = [
  { id: 'david' as const, at: 20, image: 'a.webp' },
  { id: 'david' as const, at: 60, image: 'b.webp' }
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

  it('a game opens at its stars and says how many are missing', () => {
    const s = bigGameStates(games, 12)
    expect(s.map((x) => x.open)).toEqual([false, false])
    expect(s[0]).toMatchObject({ missing: 8, share: 0.6 })
    expect(bigGameStates(games, 20)[0]!.open).toBe(true)
  })

  it('the next game is the nearest closed one', () => {
    expect(nextBigGame(games, 25)?.game.at).toBe(60)
    expect(nextBigGame(games, 99)).toBeNull()
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
