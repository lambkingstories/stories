/**
 * The pure functions of the new games of "Mose" (`utils/moseGames.ts`): the plaiting, the glow, the differences, the drum, the manna, the words and the pillar of cloud.
 */
import { describe, expect, it } from 'vitest'
import {
  answerOk,
  dayOk,
  diffAt,
  diffHit,
  distance,
  found,
  frontCells,
  frontCount,
  glow,
  judge,
  nextWord,
  noTriple,
  ringFor,
  ringTimes,
  shuffle,
  wordsOf
} from '@/utils/moseGames'

describe('plaiting', () => {
  it('in the pattern "same" every row begins in front of the first stake', () => {
    const cells = frontCells(3, 4, 'same')
    expect(cells).toHaveLength(3)
    for (const row of cells) expect(row).toEqual([true, false, true, false])
  })

  it('in the pattern "alternate" every row begins the other way round than the one before', () => {
    const cells = frontCells(4, 6, 'alternate')
    expect(cells[0]).toEqual([true, false, true, false, true, false])
    expect(cells[1]).toEqual([false, true, false, true, false, true])
    expect(cells[2]).toEqual(cells[0])
    expect(cells[3]).toEqual(cells[1])
  })

  it('the cells to tap add up to 18 for the two rounds of the game (3 x 4 and 4 x 6)', () => {
    expect(frontCount(frontCells(3, 4, 'same'))).toBe(6)
    expect(frontCount(frontCells(4, 6, 'alternate'))).toBe(12)
  })
})

describe('glow', () => {
  it('the glow gets stronger the closer Moses comes: monotone, 1 at the bush, 0 far away', () => {
    expect(glow(0, 60)).toBe(1)
    expect(glow(60, 60)).toBe(0)
    expect(glow(90, 60)).toBe(0)
    let last = -1
    for (let d = 60; d >= 0; d -= 3) {
      const g = glow(d, 60)
      expect(g).toBeGreaterThanOrEqual(last)
      last = g
    }
    expect(glow(30, 60)).toBeCloseTo(0.5, 6)
    expect(glow(5, 0)).toBe(0)
  })

  it('Moses is at the bush when he is within the threshold; the distance counts the height three quarters', () => {
    expect(found(6.9, 7)).toBe(true)
    expect(found(7.1, 7)).toBe(false)
    expect(distance({ x: 10, y: 10 }, { x: 10, y: 50 })).toBeCloseTo(30, 6)
    expect(distance({ x: 10, y: 10 }, { x: 40, y: 10 })).toBeCloseTo(30, 6)
  })
})

describe('differences', () => {
  const items = [
    { x: 30, y: 40, w: 12 },
    { x: 70, y: 60, w: 8 }
  ]

  it('a tap hits within half the width of the thing (at least five percent)', () => {
    expect(diffHit(items[0]!, { x: 35, y: 40 })).toBe(true)
    expect(diffHit(items[0]!, { x: 38, y: 40 })).toBe(false)
    expect(diffHit(items[1]!, { x: 73, y: 60 })).toBe(true)
    expect(diffHit(items[1]!, { x: 76, y: 60 })).toBe(false)
  })

  it('the nearest thing that is not found yet is the one that is hit', () => {
    expect(diffAt(items, { x: 31, y: 41 }, [false, false])).toBe(0)
    expect(diffAt(items, { x: 31, y: 41 }, [true, false])).toBe(-1)
    expect(diffAt(items, { x: 70, y: 61 }, [false, false])).toBe(1)
    expect(diffAt(items, { x: 5, y: 5 }, [false, false])).toBe(-1)
  })
})

describe('drum', () => {
  it('a tap is in time within a quarter of a second of the beat', () => {
    expect(judge(5.2, 5)).toBe(true)
    expect(judge(4.76, 5)).toBe(true)
    expect(judge(5.3, 5)).toBe(false)
    expect(judge(5.3, 5, 0.4)).toBe(true)
  })

  it('the rings reach the drum at the beats of the pattern, none in a pause', () => {
    // 72 a minute: a gap of 5 / 6 seconds
    const times = ringTimes(72, [1, 1, 0, 1], 2)
    expect(times).toHaveLength(3)
    expect(times[0]).toBe(2)
    expect(times[1]).toBeCloseTo(2 + 60 / 72, 9)
    expect(times[2]).toBeCloseTo(2 + (3 * 60) / 72, 9)
  })

  it('a tap belongs to the nearest ring that is not hit yet; a tap with no ring near belongs to none', () => {
    const times = [1, 2, 3]
    expect(ringFor(times, [false, false, false], 2.1)).toBe(1)
    expect(ringFor(times, [false, true, false], 2.1)).toBe(-1)
    expect(ringFor(times, [false, false, false], 2.5)).toBe(-1)
    expect(ringFor(times, [false, false, false], 1.9)).toBe(1)
  })
})

describe('manna', () => {
  it('a day is right with as many full jars as it needs; a day of rest needs no grain at all', () => {
    expect(dayOk({ jars: 2 }, 8, 4)).toBe(true)
    expect(dayOk({ jars: 2 }, 4, 4)).toBe(false)
    expect(dayOk({ jars: 2 }, 12, 4)).toBe(false)
    expect(dayOk({ jars: 4 }, 16, 4)).toBe(true)
    expect(dayOk({ jars: 0 }, 0, 4)).toBe(true)
    expect(dayOk({ jars: 0 }, 4, 4)).toBe(false)
    expect(dayOk({ jars: 2 }, 7, 4)).toBe(false)
  })
})

describe('words', () => {
  it('the next word of a sentence after the words that lie in the strip', () => {
    expect(wordsOf('Du sollst nicht töten.')).toEqual(['Du', 'sollst', 'nicht', 'töten.'])
    expect(nextWord('Du sollst nicht töten.', [])).toBe('Du')
    expect(nextWord('Du sollst nicht töten.', ['Du', 'sollst'])).toBe('nicht')
    expect(nextWord('Du sollst nicht töten.', ['Du', 'sollst', 'nicht', 'töten.'])).toBeUndefined()
  })

  it('the words are mixed the same way every time for the same seed, and never in the right order', () => {
    const words = wordsOf('Du sollst keine anderen Götter neben mir haben.')
    for (let seed = 1; seed < 30; seed++) {
      const mixed = shuffle(words, seed)
      expect([...mixed].sort()).toEqual([...words].sort())
      expect(mixed.join(' ')).not.toBe(words.join(' '))
      expect(shuffle(words, seed)).toEqual(mixed)
    }
    expect(new Set(Array.from({ length: 12 }, (_, s) => shuffle(words, s).join(' '))).size).toBeGreaterThan(5)
    expect(shuffle(['a'], 1)).toEqual(['a'])
    expect(shuffle(['a', 'a'], 1)).toEqual(['a', 'a'])
  })
})

describe('pillar of cloud', () => {
  it('the people break up when the pillar rises and stay when it stays', () => {
    expect(answerOk({ pillar: 'rises' }, 'go')).toBe(true)
    expect(answerOk({ pillar: 'rises' }, 'stay')).toBe(false)
    expect(answerOk({ pillar: 'stays' }, 'stay')).toBe(true)
    expect(answerOk({ pillar: 'stays' }, 'go')).toBe(false)
  })

  it('never three times the same in a row', () => {
    const t = (...p: ('rises' | 'stays')[]) => p.map((pillar) => ({ pillar }))
    expect(noTriple(t('rises', 'stays', 'rises', 'rises', 'stays'))).toBe(true)
    expect(noTriple(t('rises', 'rises', 'rises'))).toBe(false)
    expect(noTriple(t('stays', 'rises', 'stays', 'stays', 'stays'))).toBe(false)
    expect(noTriple([])).toBe(true)
  })
})
