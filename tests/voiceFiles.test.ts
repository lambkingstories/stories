import { describe, expect, it } from 'vitest'
import { extOfMime, looksLikeAudio, mimeOfName, parseVoiceFileName, voiceFileName } from '@/use/useVoices'

describe('Familien-Stimmen als Datei', () => {
  it('der Dateiname trägt Geschichte und Vorleser und wird wieder gelesen', () => {
    const name = voiceFileName({ bookId: 'abc123', reader: 'Oma Ruth', mime: 'audio/mp4' })
    expect(name).toBe('LambKing__abc123__Oma Ruth.m4a')
    expect(parseVoiceFileName(name)).toEqual({ bookId: 'abc123', reader: 'Oma Ruth' })
  })

  it('ein vom Messenger umbenannter Name mit (1) bleibt lesbar', () => {
    expect(parseVoiceFileName('LambKing__abc123__Opa (1).webm')).toEqual({ bookId: 'abc123', reader: 'Opa' })
  })

  it('Sonderzeichen im Namen des Vorlesers werden entfernt, ein leerer Name wird Familie', () => {
    expect(voiceFileName({ bookId: 'x', reader: 'Opa/../?', mime: 'audio/webm;codecs=opus' })).toBe('LambKing__x__Opa.webm')
    expect(voiceFileName({ bookId: 'x', reader: '', mime: 'audio/ogg' })).toBe('LambKing__x__Familie.ogg')
  })

  it('eine fremde Datei hat keinen Dateinamen-Hinweis', () => {
    expect(parseVoiceFileName('Sprachnachricht.opus')).toBeNull()
  })

  it('Endung und Typ werden erkannt, auch wenn das Gerät keinen Typ meldet', () => {
    expect(extOfMime('audio/mp4')).toBe('m4a')
    expect(mimeOfName('PTT-2026.OPUS')).toBe('audio/ogg')
    expect(looksLikeAudio({ name: 'a.m4a', type: '' })).toBe(true)
    expect(looksLikeAudio({ name: 'foto.jpg', type: 'image/jpeg' })).toBe(false)
  })
})
