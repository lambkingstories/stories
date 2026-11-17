import { describe, expect, it } from 'vitest'
import { buildStamp, buildStampText } from '@/utils/buildStamp'

describe('Stand-Nummer', () => {
  it('zeigt Datum und kurze Commit-Nummer', () => {
    expect(buildStampText({ date: '17.11.', commit: '4e1f2a3' }, 'de')).toBe('Stand 17.11. · 4e1f2a3')
    expect(buildStampText({ date: '17.11.', commit: '4e1f2a3+' }, 'en')).toBe('Build 17.11. · 4e1f2a3+')
  })

  it('sagt "Entwicklung", wenn Git nicht verfügbar war', () => {
    expect(buildStampText({ date: '17.11.', commit: '' }, 'de')).toBe('Stand Entwicklung')
    expect(buildStampText({ date: '', commit: '' }, 'en-US')).toBe('Build development')
  })

  it('fällt ohne Bau-Angabe (Tests, andere Werkzeuge) auf leer zurück, ohne zu werfen', () => {
    const s = buildStamp()
    expect(typeof s.date).toBe('string')
    expect(typeof s.commit).toBe('string')
  })
})
