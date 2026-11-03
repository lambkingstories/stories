import { beforeEach, describe, expect, it } from 'vitest'
import useAdventure from '../src/use/useAdventure'
import { stageStarsOf } from '../src/utils/adventureScore'

describe('the best try of a stage counts', () => {
  const adv = useAdventure()
  beforeEach(() => adv.reset('best'))

  it('a worse try later keeps the stars of the best one', () => {
    adv.recordStars('best', 1, 3)
    adv.recordFinal('best', 1, 3)
    adv.completeStage('best', 1)
    // the next try: the game gives one star, the questions bring none
    adv.recordStars('best', 1, 1)
    expect(stageStarsOf(adv.stageOf('best', 1))).toBe(3)
    adv.recordFinal('best', 1, 1)
    expect(stageStarsOf(adv.stageOf('best', 1))).toBe(3)
    expect(adv.stageOf('best', 1)?.finalStars).toBe(1)
  })

  it('a better try raises it', () => {
    adv.recordStars('best', 2, 1)
    adv.recordFinal('best', 2, 1)
    adv.recordStars('best', 2, 3)
    adv.recordFinal('best', 2, 2)
    expect(stageStarsOf(adv.stageOf('best', 2))).toBe(2)
  })

  it('stars saved before there was a best try are not lost on the next try', () => {
    adv.state.best = { stages: { 3: { stars: 3, gameStars: 3, finalStars: 3, done: true } } }
    adv.recordStars('best', 3, 0)
    adv.recordFinal('best', 3, 0)
    expect(stageStarsOf(adv.stageOf('best', 3))).toBe(3)
  })
})
