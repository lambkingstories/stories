import { describe, expect, it } from 'vitest'
import { finalStars, starAccount } from '@/utils/adventureScore'

describe('the account of the stars of a try', () => {
  it('counts the stars the wrong answers took, but never more than there were', () => {
    expect(starAccount(3, 1, 1, false)).toEqual({ game: 3, right: 1, taken: 1 })
    // no star from the game and no right answer: nothing to take away, so no "-1"
    expect(starAccount(0, 0, 2, false)).toEqual({ game: 0, right: 0, taken: 0 })
    // one star from the right answer, two wrong ones: only the star that was there is taken
    expect(starAccount(0, 1, 2, false)).toEqual({ game: 0, right: 1, taken: 1 })
  })

  it('has no game and no deduction on a quiz stage', () => {
    expect(starAccount(3, 2, 1, true)).toEqual({ game: 0, right: 2, taken: 0 })
  })

  it('is never negative, whatever it is given', () => {
    const a = starAccount(-2, -1, -3, false)
    expect(Object.values(a).every((n) => n >= 0)).toBe(true)
  })

  it('adds up to the final stars of the try (game + right - taken)', () => {
    for (let game = 0; game <= 3; game++)
      for (let correct = 0; correct <= 3; correct++)
        for (let wrong = 0; wrong <= 3; wrong++) {
          const a = starAccount(game, correct, wrong, false)
          const net = Math.min(3, a.game + a.right) - a.taken
          expect(Math.max(0, net), `${game}/${correct}/${wrong}`).toBe(finalStars(game, correct, wrong))
        }
  })
})
