/**
 * The pure arithmetic of the new games of "Esther" (`utils/esterGames.ts`): which place the finger lets go on, what happens when a thing is put on a place (decorate the feast) and the choice of a round (honor the man).
 */
import { describe, expect, it } from 'vitest'
import { decorDone, decorPlace, honorPick, placeAt } from '@/utils/esterGames'

describe('Das Fest schmücken: the place under the finger', () => {
  const places = [{ x: 22, y: 40, w: 12 }, { x: 50, y: 40, w: 12 }, { x: 78, y: 40, w: 12 }]

  it('the finger is on a place when it is within about the width of the place; otherwise -1', () => {
    expect(placeAt({ x: 50, y: 40 }, places)).toBe(1)
    expect(placeAt({ x: 55, y: 44 }, places)).toBe(1)
    expect(placeAt({ x: 24, y: 38 }, places)).toBe(0)
    expect(placeAt({ x: 36, y: 40 }, places)).toBe(-1)
    expect(placeAt({ x: 50, y: 90 }, places)).toBe(-1)
    expect(placeAt({ x: 50, y: 40 }, [])).toBe(-1)
  })

  it('between two close places the nearer one wins', () => {
    const close = [{ x: 40, y: 60, w: 14 }, { x: 50, y: 60, w: 14 }]
    expect(placeAt({ x: 43, y: 60 }, close)).toBe(0)
    expect(placeAt({ x: 48, y: 60 }, close)).toBe(1)
  })
})

describe('Das Fest schmücken: putting a thing on a place', () => {
  const want = ['weiss', 'rot', 'blau']

  it('in an `order` round only the thing the text names fits on a place', () => {
    expect(decorPlace('order', want, [], 0, 'weiss', false)).toBe('ok')
    expect(decorPlace('order', want, [], 0, 'rot', false)).toBe('wrong')
    expect(decorPlace('order', want, ['weiss'], 1, 'rot', false)).toBe('ok')
    expect(decorPlace('order', want, ['weiss'], 2, 'rot', false)).toBe('wrong')
  })

  it('a place that is taken takes nothing more', () => {
    expect(decorPlace('order', want, ['weiss'], 0, 'weiss', true)).toBe('taken')
    expect(decorPlace('distinct', undefined, ['b1'], 0, 'b2', true)).toBe('taken')
  })

  it('in a `distinct` round every design is taken once; a twin is refused', () => {
    expect(decorPlace('distinct', undefined, [], 0, 'b1', false)).toBe('ok')
    expect(decorPlace('distinct', undefined, ['b1'], 1, 'b2', false)).toBe('ok')
    expect(decorPlace('distinct', undefined, ['b1', 'b2'], 2, 'b1', false)).toBe('twin')
  })

  it('a round is done when every place is taken (and an empty round is never done)', () => {
    expect(decorDone([0, 1, 2])).toBe(true)
    expect(decorDone([0, -1, 2])).toBe(false)
    expect(decorDone([])).toBe(false)
  })
})

describe('Den Mann ehren: a choice', () => {
  it('a right choice is ok, a wrong one is wrong', () => {
    expect(honorPick(true)).toBe('ok')
    expect(honorPick(false)).toBe('wrong')
  })
})
