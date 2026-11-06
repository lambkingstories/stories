/**
 * The pure logic of two more new games of "Paulus": "Dye the purple" (`purpur`) and "The workshop" (`werkstatt`), with their checks of the data (`dyeProblems`, `tentShopProblems`).
 */
import { describe, expect, it } from 'vitest'
import { dyeCompare, dyeDip, dyeMatches, dyeProblems, tentAfter, tentMove, tentMoves, tentShopProblems, tentTarget } from '@/utils/paulusNeuB'
import { DYE, TENT } from './paulusSamples'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('purpur: dye the purple', () => {
  it('every dip makes one vat stronger, at most twice; the cloth never gets lighter', () => {
    let c = { red: 0, blue: 0 }
    c = dyeDip(c, 'red', 2).colour
    c = dyeDip(c, 'red', 2).colour
    expect(c).toEqual({ red: 2, blue: 0 })
    const third = dyeDip(c, 'red', 2)
    expect(third.full).toBe(true)
    expect(third.colour).toEqual({ red: 2, blue: 0 })
    expect(dyeDip(c, 'blue', 2)).toEqual({ colour: { red: 2, blue: 1 }, full: false })
  })

  it('a cloth matches its sample only exactly; what is missing', () => {
    expect(dyeMatches({ red: 1, blue: 1 }, { red: 1, blue: 1 })).toBe(true)
    expect(dyeMatches({ red: 2, blue: 1 }, { red: 1, blue: 1 })).toBe(false)
    expect(dyeCompare({ red: 2, blue: 0 }, { red: 1, blue: 1 })).toEqual({ red: -1, blue: 1 })
  })

  it('the sample data are playable; the checks find wrong data', () => {
    expect(dyeProblems(DYE)).toEqual([])
    const g = clone(DYE)
    g.rounds[0]!.orders.push({ red: 1, blue: 1, customer: 1 })
    g.rounds[1]!.orders.push({ red: 0, blue: 0, customer: 5 })
    g.cloths = [['a']]
    g.vats.blue.x = 35
    const p = dyeProblems(g).join(' | ')
    expect(p).toMatch(/round 1 uses only one vat/)
    expect(p).toMatch(/white sample/)
    expect(p).toMatch(/customer 6 has no picture/)
    expect(p).toMatch(/3 x 3 pictures/)
    expect(p).toMatch(/vats overlap/)
  })
})

describe('werkstatt: the workshop', () => {
  it('the steps: cut, sew, ropes, then the place for finished tents', () => {
    expect([0, 1, 2, 3].map((s) => tentTarget(s as 0 | 1 | 2 | 3))).toEqual([0, 1, 2, 'shelf'])
    expect([tentAfter(0), tentAfter(1), tentAfter(2)]).toEqual([1, 2, 3])
    expect(tentMoves({ pieces: 4 })).toBe(16)
  })

  it('a move is right, too early, onto a working table (mistakes) or onto a table that still holds a piece (no mistake)', () => {
    expect(tentMove(0, 0, false, false)).toEqual({ verdict: 'ok', need: 0 })
    expect(tentMove(0, 1, false, false)).toEqual({ verdict: 'wrong', need: 0 })
    expect(tentMove(1, 1, true, true)).toEqual({ verdict: 'busy', need: 1 })
    expect(tentMove(1, 1, false, true)).toEqual({ verdict: 'taken', need: 1 })
    expect(tentMove(2, 'shelf', false, false)).toEqual({ verdict: 'wrong', need: 2 })
    expect(tentMove(3, 'shelf', false, false)).toEqual({ verdict: 'ok', need: 'shelf' })
    expect(tentMove(3, 2, false, false)).toEqual({ verdict: 'wrong', need: 'shelf' })
  })

  it('the sample data are playable; the checks find wrong data', () => {
    expect(tentShopProblems(TENT)).toEqual([])
    const g = clone(TENT)
    g.tables.reverse()
    g.rounds[0]!.overlap = true
    g.rounds[1]!.pieces = 1
    g.workMs = 100
    const p = tentShopProblems(g).join(' | ')
    expect(p).toMatch(/cut, sew, ropes/)
    expect(p).toMatch(/one piece comes after the other/)
    expect(p).toMatch(/more pieces/)
    expect(p).toMatch(/0.8 and 4 seconds/)
  })
})
