import { afterEach, describe, expect, it } from 'vitest'
import { introRuns, plusOffer } from '@/data/plus'

describe('the introductory price on the Plus page', () => {
  const before = { ...plusOffer }
  afterEach(() => Object.assign(plusOffer, before))

  it('is 19,99 € in the first year, then 29,99 €', () => {
    expect(plusOffer.introPrice).toBe('19,99 €')
    expect(plusOffer.year).toBe('29,99 €')
  })

  it('is said while the offer runs and goes by itself after its last day', () => {
    plusOffer.introUntil = '2026-12-01'
    expect(introRuns(new Date('2026-11-15T10:00:00'))).toBe(true)
    expect(introRuns(new Date('2026-12-01T23:00:00'))).toBe(true)
    expect(introRuns(new Date('2026-12-02T00:30:00'))).toBe(false)
  })

  it('is said without an end date, and not at all without a price', () => {
    plusOffer.introUntil = null
    expect(introRuns()).toBe(true)
    plusOffer.introPrice = null
    expect(introRuns()).toBe(false)
  })
})
