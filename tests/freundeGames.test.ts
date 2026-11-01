/**
 * The pure parts of the two new games of "Jesus Calls His Friends" (`utils/freundeGames.ts`): the boats that are filled place by place and the pieces of the roof that come off above Jesus.
 */
import { describe, expect, it } from 'vitest'
import { boatSink, boatSlots, boatStep, boatsFull, colRange, peopleUnder, roofOpen, roofRoundProblems, roofStep, underCol } from '@/utils/freundeGames'

describe('fill both boats', () => {
  it('a fish jumps in until the boat is full; then the boat says no', () => {
    expect(boatStep(0, 3)).toBe('ok')
    expect(boatStep(2, 3)).toBe('ok')
    expect(boatStep(3, 3)).toBe('full')
    expect(boatStep(4, 3)).toBe('full')
  })

  it('both boats are full only when each one holds its number', () => {
    expect(boatsFull([3, 5], [3, 5])).toBe(true)
    expect(boatsFull([3, 4], [3, 5])).toBe(false)
    expect(boatsFull([0, 0], [3, 5])).toBe(false)
    expect(boatsFull([], [])).toBe(false)
  })

  it('the places for the fish lie inside the deck: one row up to three, two rows from four, the upper row has the extra one', () => {
    const deck = { x: 10, y: 20, w: 60, h: 40 }
    expect(boatSlots(0, deck)).toEqual([])
    expect(boatSlots(3, deck)).toHaveLength(3)
    expect(new Set(boatSlots(3, deck).map((s) => s.y)).size).toBe(1)
    const five = boatSlots(5, deck)
    expect(five).toHaveLength(5)
    expect(five.filter((s) => s.y === five[0]!.y)).toHaveLength(3)
    expect(new Set(five.map((s) => s.y)).size).toBe(2)
    for (const n of [1, 3, 4, 5, 6, 7, 8]) {
      for (const s of boatSlots(n, deck)) {
        expect(s.x).toBeGreaterThan(deck.x)
        expect(s.x).toBeLessThan(deck.x + deck.w)
        expect(s.y).toBeGreaterThan(deck.y)
        expect(s.y).toBeLessThan(deck.y + deck.h)
      }
    }
    // no two places lie on top of each other
    const six = boatSlots(6, deck)
    for (let i = 0; i < six.length; i++) for (let k = i + 1; k < six.length; k++) expect(Math.hypot(six[i]!.x - six[k]!.x, six[i]!.y - six[k]!.y)).toBeGreaterThan(5)
  })

  it('the boat lies deeper with every fish and never more than the maximum', () => {
    expect(boatSink(0, 4, 2.4)).toBe(0)
    expect(boatSink(2, 4, 2.4)).toBeCloseTo(1.2)
    expect(boatSink(4, 4, 2.4)).toBeCloseTo(2.4)
    expect(boatSink(9, 4, 2.4)).toBeCloseTo(2.4)
    expect(boatSink(1, 0, 2.4)).toBe(0)
  })
})

describe('open the roof', () => {
  const area = { x: 14, y: 26, w: 72, h: 9 }

  it('the pieces above the free place come off, the others stay', () => {
    expect(roofStep(3, [3, 4])).toBe('ok')
    expect(roofStep(4, [3, 4])).toBe('ok')
    expect(roofStep(2, [3, 4])).toBe('wrong')
    expect(roofStep(7, [3, 4])).toBe('wrong')
  })

  it('the hole is open when every free piece is off', () => {
    expect(roofOpen([3], [3, 4])).toBe(false)
    expect(roofOpen([3, 4], [3, 4])).toBe(true)
    expect(roofOpen([4, 3, 1], [3, 4])).toBe(true)
    expect(roofOpen([], [])).toBe(false)
  })

  it('a piece covers its part of the width, and a person under it is found', () => {
    const [from, to] = colRange(3, 8, area)
    expect(from).toBeCloseTo(41)
    expect(to).toBeCloseTo(50)
    expect(underCol(45, 6, 3, 8, area)).toBe(true)
    expect(underCol(20, 10, 3, 8, area)).toBe(false)
    expect(underCol(37, 6, 3, 8, area)).toBe(false)
    expect(underCol(37, 10, 3, 8, area)).toBe(true)
    expect(peopleUnder(2, 8, area, [{ x: 20, w: 10 }, { x: 36, w: 10 }, { x: 80, w: 10 }])).toEqual([1])
  })

  it('a round is right when the hole lies over Jesus and the bed and nobody sits under it', () => {
    const people = [{ x: 19, w: 13 }, { x: 31, w: 13 }, { x: 70, w: 13 }, { x: 80, w: 13 }]
    const ok = { cols: 8, free: [3, 4], jesusX: 45, matX: 52 }
    expect(roofRoundProblems(ok, area, people, 12, 14)).toEqual([])
    expect(roofRoundProblems({ ...ok, jesusX: 30 }, area, people, 12, 14).join()).toContain('Jesus does not sit under the hole')
    expect(roofRoundProblems({ ...ok, matX: 70 }, area, people, 12, 14).join()).toContain('the bed does not land under the hole')
    expect(roofRoundProblems(ok, area, [...people, { x: 52, w: 13 }], 12, 14).join()).toContain('sits under the free piece')
    expect(roofRoundProblems({ ...ok, free: [2, 4] }, area, people, 12, 14).join()).toContain('not next to each other')
    expect(roofRoundProblems({ ...ok, free: [] }, area, people, 12, 14).join()).toContain('no free piece')
  })
})
