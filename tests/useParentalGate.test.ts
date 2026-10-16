import { describe, expect, it } from 'vitest'
import { createChallenge, numberWord, requireParent } from '@/use/useParentalGate'

describe('parental gate', () => {
  it('picks a two-digit number that is never a round ten', () => {
    expect(createChallenge(() => 0).number).toBe(21)
    expect(createChallenge(() => 0.999).number).toBe(99)
    for (let i = 0; i < 72; i++) {
      const n = createChallenge(() => i / 72).number
      expect(n).toBeGreaterThanOrEqual(21)
      expect(n).toBeLessThanOrEqual(99)
      expect(n % 10).not.toBe(0)
    }
  })

  it('covers all 72 numbers exactly once', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 72; i++) seen.add(createChallenge(() => i / 72).number)
    expect(seen.size).toBe(72)
  })

  it('writes the number in German', () => {
    expect(numberWord(21, 'de')).toBe('einundzwanzig')
    expect(numberWord(43, 'de')).toBe('dreiundvierzig')
    expect(numberWord(66, 'de')).toBe('sechsundsechzig')
    expect(numberWord(97, 'de')).toBe('siebenundneunzig')
  })

  it('writes the number in English', () => {
    expect(numberWord(21, 'en')).toBe('twenty-one')
    expect(numberWord(43, 'en')).toBe('forty-three')
    expect(numberWord(99, 'en')).toBe('ninety-nine')
  })

  it('lets the web build through without a dialog', async () => {
    // VITE_APP_NATIVE is not set under vitest, so there is no gate to show.
    await expect(requireParent()).resolves.toBe(true)
  })
})
