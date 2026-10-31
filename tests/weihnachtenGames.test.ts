/**
 * The pure arithmetic of the new games of "Christmas" (`utils/weihnachtenGames.ts`): which cloth and which bed are right (Luke 2,7), which place carries the sign (Luke 2,12.16) and whether a round is well made.
 */
import { describe, expect, it } from 'vitest'
import { cribStep, placeInSlot, roundIsValid, signStep } from '@/utils/weihnachtenGames'

describe('Das Kind in die Krippe legen: the right cloth and bed', () => {
  it('swaddling cloths and the manger are right', () => {
    expect(cribStep('windeln', 'windeln')).toBe('ok')
    expect(cribStep('krippe', 'krippe')).toBe('ok')
  })

  it('a royal robe, a fur, a golden bed or a basket are wrong', () => {
    expect(cribStep('windeln', 'koenigstuch')).toBe('wrong')
    expect(cribStep('windeln', 'fell')).toBe('wrong')
    expect(cribStep('krippe', 'bett')).toBe('wrong')
    expect(cribStep('krippe', 'korb')).toBe('wrong')
  })
})

describe('Das Zeichen finden: the place with the sign', () => {
  const order = ['haus1', 'stall', 'haus2', 'leer', 'haus3', 'haus4']

  it('only the shelter with the manger is right', () => {
    expect(signStep('stall', 'stall')).toBe('ok')
    expect(signStep('stall', 'haus1')).toBe('wrong')
    expect(signStep('stall', 'leer')).toBe('wrong')
  })

  it('the slot gives the place that stands in it', () => {
    expect(placeInSlot(order, 1)).toBe('stall')
    expect(placeInSlot(order, 5)).toBe('haus4')
    expect(placeInSlot(order, 6)).toBeUndefined()
  })

  it('a round is well made when it uses every place once and the right place is there', () => {
    const places = ['haus1', 'haus2', 'haus3', 'haus4', 'leer', 'stall']
    expect(roundIsValid(order, 'stall', places)).toBe(true)
    expect(roundIsValid(['haus1', 'haus1', 'haus2', 'leer', 'haus3', 'haus4'], 'stall', places)).toBe(false)
    expect(roundIsValid(order.slice(0, 5), 'stall', places)).toBe(false)
    expect(roundIsValid(['haus1', 'x', 'haus2', 'leer', 'haus3', 'haus4'], 'stall', places)).toBe(false)
  })
})
