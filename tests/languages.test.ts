import { describe, expect, it } from 'vitest'
import { SPANISH_ENABLED, offeredLanguage } from '../src/utils/languages'

describe('offered languages', () => {
  it('Spanish is switched off for now: it is read as English, German and English stay', () => {
    expect(SPANISH_ENABLED).toBe(false)
    expect(offeredLanguage('es')).toBe('en')
    expect(offeredLanguage('de')).toBe('de')
    expect(offeredLanguage('en')).toBe('en')
  })
})
