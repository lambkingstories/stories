import { describe, expect, it } from 'vitest'
import { ORDER_BONUS, buildOrderRound, mixUp, orderJourneys, parseOrderSnap, scoreFromMissed, scoreOrder } from '../src/utils/orderRace'
import { BINGO_CELLS, BINGO_LINES, drawOrder, hasBingo, isTrueBingo, liveIsOver, makeCard, parseBingoSnap } from '../src/utils/bibleBingo'
import { WHO_PEOPLE } from '../src/data/whoAmI'
import { mulberry32 } from '../src/utils/familyCode'
import type { Journey } from '../src/types/adventure'

const journeys = [
  { id: 'a', title: 'Josef', stages: ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben'].map((title, i) => ({ id: i + 1, title })) },
  { id: 'b', title: 'Klein', stages: [{ id: 1, title: 'Nur eins' }, { id: 2, title: 'Zwei', soon: true }] },
  { id: 'c', title: 'Doppelt', stages: ['X', 'X', 'Y', 'Z', 'W', 'V'].map((title, i) => ({ id: i + 1, title })) }
] as unknown as Journey[]

describe('order race', () => {
  it('takes stages in a row from one adventure, in the order of the story', () => {
    for (let seed = 1; seed < 40; seed++) {
      const round = buildOrderRound(journeys, 4, mulberry32(seed), 'Josef')!
      expect(round.journey).toBe('Josef')
      const all = ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben']
      const at = all.indexOf(round.titles[0]!)
      expect(round.titles).toEqual(all.slice(at, at + 4))
    }
  })

  it('leaves out adventures with too few stages, stages that are not ready and titles that appear twice', () => {
    expect(orderJourneys(journeys, 4)).toEqual(['Josef', 'Doppelt'])
    expect(orderJourneys(journeys, 5)).toEqual(['Josef'])
    expect(orderJourneys(journeys, 8)).toEqual([])
    const round = buildOrderRound(journeys, 4, mulberry32(1), 'Doppelt')!
    expect(round.titles).toEqual(['Y', 'Z', 'W', 'V'])
    expect(buildOrderRound(journeys, 8)).toBeNull()
    expect(buildOrderRound(journeys, 4, Math.random, 'Klein')).toBeNull()
  })

  it('mixes the titles up, never in the right order already', () => {
    const titles = ['a', 'b', 'c', 'd']
    for (let seed = 1; seed < 50; seed++) {
      const mixed = mixUp(titles, mulberry32(seed))
      expect([...mixed].sort()).toEqual(titles)
      expect(mixed).not.toEqual(titles)
    }
    expect(mixUp(['x'])).toEqual(['x'])
  })

  it('gives a point for every right place and a bonus for a whole row', () => {
    const right = ['a', 'b', 'c', 'd']
    expect(scoreOrder(right, ['a', 'b', 'c', 'd'])).toEqual({ right: 4, all: true, points: 4 + ORDER_BONUS })
    expect(scoreOrder(right, ['a', 'b', 'd', 'c'])).toEqual({ right: 2, all: false, points: 2 })
    expect(scoreOrder(right, ['d', 'c', 'b', 'a'])).toEqual({ right: 0, all: false, points: 0 })
    expect(scoreOrder([], [])).toEqual({ right: 0, all: false, points: 0 })
  })
})

describe('order race, keep playing', () => {
  const titles = ['a', 'b', 'c', 'd']
  const base = {
    phase: 'play',
    playerCount: 2,
    rounds: 1,
    count: 4,
    only: '',
    names: ['Anna', 'Ben'],
    turn: 1,
    scores: [5, 2],
    round: { journey: 'Josef', titles },
    mixed: ['c', 'a', 'd', 'b'],
    picked: ['a', 'b'],
    missed: [false, true, false, false],
    tried: ['d']
  }
  const roundtrip = (v: unknown) => JSON.parse(JSON.stringify(v))

  it('reads back a round in a row and a round between two turns', () => {
    expect(parseOrderSnap(roundtrip(base))).toEqual(base)
    const wait = { ...base, phase: 'handover', round: null, mixed: [], picked: [], missed: [], tried: [] }
    expect(parseOrderSnap(roundtrip(wait))).toEqual(wait)
    // between two turns the row is not needed, whatever is in the state
    expect(parseOrderSnap({ ...base, phase: 'handover' })).toEqual(wait)
  })

  it('refuses a state of another shape', () => {
    expect(parseOrderSnap(null)).toBeNull()
    expect(parseOrderSnap('x')).toBeNull()
    expect(parseOrderSnap({ ...base, phase: 'result' })).toBeNull()
    expect(parseOrderSnap({ ...base, turn: 2 })).toBeNull()
    expect(parseOrderSnap({ ...base, scores: [1] })).toBeNull()
    expect(parseOrderSnap({ ...base, count: 7 })).toBeNull()
    expect(parseOrderSnap({ ...base, picked: ['b'] })).toBeNull()
    expect(parseOrderSnap({ ...base, mixed: ['a', 'b', 'c', 'x'] })).toBeNull()
    expect(parseOrderSnap({ ...base, missed: [false] })).toBeNull()
    expect(parseOrderSnap({ ...base, tried: ['a'] })).toBeNull()
    expect(parseOrderSnap({ ...base, round: null })).toBeNull()
  })

  it('the points of a finished row come from the places that were missed', () => {
    expect(scoreFromMissed(titles, [false, false, false, false])).toEqual({ right: 4, all: true, points: 4 + ORDER_BONUS })
    expect(scoreFromMissed(titles, [false, true, false, false]).all).toBe(false)
    expect(scoreFromMissed(titles, [false, true, false, false]).points).toBe(scoreOrder(titles, ['a', 'c', 'c', 'd']).points)
  })
})

describe('bible bingo', () => {
  it('reads back what this phone keeps of a round', () => {
    const card = makeCard(mulberry32(7))
    const marked = Array.from({ length: BINGO_CELLS }, (_, i) => i < 3)
    const people = WHO_PEOPLE.length
    const host = { way: 'table', level: 'hints', phase: 'host', card, marked, order: drawOrder(mulberry32(3)), step: 4, hintN: 2, revealed: false, code: '', startedAt: 0 }
    expect(parseBingoSnap(JSON.parse(JSON.stringify(host)))).toEqual(host)
    const table = { ...host, phase: 'card', order: [], step: 0, hintN: 1 }
    expect(parseBingoSnap(table)).toEqual(table)
    const live = { ...table, way: 'code', phase: 'live', code: 'K7M4QX', startedAt: 1_700_000_000_000 }
    expect(parseBingoSnap(live)).toEqual(live)
    const ready = { ...live, phase: 'ready', startedAt: 0 }
    expect(parseBingoSnap(ready)).toEqual(ready)
    // other shapes are refused
    expect(parseBingoSnap({ ...host, step: people })).toBeNull()
    expect(parseBingoSnap({ ...host, order: [1, 2] })).toBeNull()
    expect(parseBingoSnap({ ...host, card: card.slice(1) })).toBeNull()
    expect(parseBingoSnap({ ...host, marked: [true] })).toBeNull()
    expect(parseBingoSnap({ ...host, way: 'code' })).toBeNull()
    expect(parseBingoSnap({ ...live, code: 'x' })).toBeNull()
    expect(parseBingoSnap({ ...live, startedAt: 0 })).toBeNull()
    expect(parseBingoSnap({ ...host, phase: 'won' })).toBeNull()
    expect(parseBingoSnap(null)).toBeNull()
  })

  it('a round with a code is over when everybody was called', () => {
    const per = 20000
    const people = WHO_PEOPLE.length
    expect(liveIsOver(1000, 1000 + per * people - 1, per)).toBe(false)
    expect(liveIsOver(1000, 1000 + per * people, per)).toBe(true)
    expect(liveIsOver(5000, 1000, per)).toBe(false)
  })

  it('a card has sixteen different people and the draw order has everybody once', () => {
    const card = makeCard(mulberry32(5))
    expect(BINGO_CELLS).toBe(16)
    expect(card).toHaveLength(BINGO_CELLS)
    expect(new Set(card).size).toBe(BINGO_CELLS)
    const order = drawOrder(mulberry32(5), 26)
    expect(order).toHaveLength(26)
    expect(new Set(order).size).toBe(26)
  })

  it('knows the ten lines of a four by four card', () => {
    expect(BINGO_LINES).toHaveLength(10)
    const t = (...on: number[]) => Array.from({ length: 16 }, (_, i) => on.includes(i))
    expect(hasBingo(t(0, 1, 2, 3))).toBe(true)
    expect(hasBingo(t(1, 5, 9, 13))).toBe(true)
    expect(hasBingo(t(0, 5, 10, 15))).toBe(true)
    expect(hasBingo(t(3, 6, 9, 12))).toBe(true)
    expect(hasBingo(t(0, 1, 2, 4, 5, 6))).toBe(false)
    expect(hasBingo(t())).toBe(false)
  })

  it('the player can check a bingo against the people that were called', () => {
    const card = Array.from({ length: 16 }, (_, i) => i + 10)
    const marked = Array.from({ length: 16 }, (_, i) => i < 4)
    expect(isTrueBingo(card, marked, [10, 11, 12, 13, 1])).toBe(true)
    expect(isTrueBingo(card, marked, [10, 11, 12])).toBe(false)
  })
})
