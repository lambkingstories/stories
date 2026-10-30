/**
 * The pure arithmetic of the new games of "The King Is Coming" (`utils/prophetenGames.ts`): which animals belong together according to Isaiah 11, where the partner stands, how many blows the forge needs and which tool is right.
 */
import { describe, expect, it } from 'vitest'
import { allPaired, forgeBlow, forgeChoice, peaceSpot, peaceStep } from '@/utils/prophetenGames'

const pairs = [
  { predator: 'wolf', prey: 'lamm' },
  { predator: 'leopard', prey: 'zicklein' },
  { predator: 'loewe', prey: 'kalb' },
  { predator: 'baer', prey: 'kuh' }
]

describe('Frieden unter den Tieren: which animals belong together', () => {
  it('the partner of the text is right', () => {
    expect(peaceStep(pairs, [], 'wolf', 'lamm')).toBe('ok')
    expect(peaceStep(pairs, ['wolf'], 'baer', 'kuh')).toBe('ok')
  })

  it('any other prey is wrong', () => {
    expect(peaceStep(pairs, [], 'wolf', 'kuh')).toBe('wrong')
    expect(peaceStep(pairs, [], 'loewe', 'zicklein')).toBe('wrong')
  })

  it('a pair that is already together is no mistake', () => {
    expect(peaceStep(pairs, ['wolf'], 'wolf', 'lamm')).toBe('again')
    expect(peaceStep(pairs, ['wolf'], 'wolf', 'kuh')).toBe('again')
  })

  it('an unknown predator is wrong', () => {
    expect(peaceStep(pairs, [], 'fuchs', 'lamm')).toBe('wrong')
  })

  it('the partner stands right beside the predator at the same height and never leaves the picture', () => {
    expect(peaceSpot({ x: 14, y: 46 })).toEqual({ x: 37, y: 46 })
    expect(peaceSpot({ x: 80, y: 70 }).x).toBeLessThanOrEqual(92)
  })

  it('the round is done when every pair is together (and an empty round is never done)', () => {
    expect(allPaired(['wolf', 'leopard', 'loewe', 'baer'], pairs)).toBe(true)
    expect(allPaired(['wolf', 'leopard', 'loewe'], pairs)).toBe(false)
    expect(allPaired([], [])).toBe(false)
  })
})

describe('Die Schmiede: blows and tools', () => {
  it('the third blow makes the metal glow', () => {
    expect(forgeBlow(0, 3)).toBe('hit')
    expect(forgeBlow(1, 3)).toBe('hit')
    expect(forgeBlow(2, 3)).toBe('ready')
  })

  it('only the tool of Micah is right', () => {
    expect(forgeChoice('pflugschar', 'pflugschar')).toBe('ok')
    expect(forgeChoice('pflugschar', 'sichel')).toBe('wrong')
    expect(forgeChoice('sichel', 'hammer')).toBe('wrong')
  })
})
