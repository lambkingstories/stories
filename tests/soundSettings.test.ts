import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GAME_MUSIC, MUSIC_FILES, moodOfGame, pickGameMusic } from '@/utils/sfxFiles'

describe('music for the mini games', () => {
  it('has pieces for every mood and a file for each', () => {
    for (const mood of ['ruhig', 'mittel', 'lebhaft'] as const) expect(GAME_MUSIC.filter((p) => p.mood === mood).length).toBeGreaterThanOrEqual(2)
    expect(GAME_MUSIC).toHaveLength(10)
    expect(MUSIC_FILES).toHaveLength(11)
  })

  it('picks a piece of the mood and never the same twice in a row', () => {
    for (const mood of ['ruhig', 'mittel', 'lebhaft'] as const) {
      let last: string | undefined
      for (let i = 0; i < 30; i++) {
        const p = pickGameMusic(mood, last)
        expect(p.mood).toBe(mood)
        expect(p.file).not.toBe(last)
        last = p.file
      }
    }
  })

  it('gives every game a mood, and a medium one to games it does not know', () => {
    expect(moodOfGame('find')).toBe('ruhig')
    expect(moodOfGame('fly')).toBe('lebhaft')
    expect(moodOfGame('puzzle')).toBe('mittel')
    expect(moodOfGame(undefined)).toBe('mittel')
    expect(moodOfGame('unknown')).toBe('mittel')
  })
})

describe('the volume sliders', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('start with a quiet music and full sounds, keep the values and stay between 0 and 1', async () => {
    const m = await import('@/use/useSoundSettings')
    const s = m.default()
    expect(s.musicVolume.value).toBe(m.DEFAULT_MUSIC)
    expect(s.sfxVolume.value).toBe(1)
    s.setMusicVolume(0.25)
    s.setSfxVolume(7)
    expect(s.musicVolume.value).toBe(0.25)
    expect(s.sfxVolume.value).toBe(1)
    expect(localStorage.getItem('lk-music-volume')).toBe('0.25')
    vi.resetModules()
    const again = (await import('@/use/useSoundSettings')).default()
    expect(again.musicVolume.value).toBe(0.25)
  })

  it('has a third slider for the reading voice: full by default, remembered, between 0 and 1, and the speaker is only off when all three are 0', async () => {
    const s = (await import('@/use/useSoundSettings')).default()
    expect(s.voiceVolume.value).toBe(1)
    s.setVoiceVolume(0.35)
    expect(s.voiceVolume.value).toBe(0.35)
    expect(localStorage.getItem('lk-voice-volume')).toBe('0.35')
    s.setVoiceVolume(-3)
    expect(s.voiceVolume.value).toBe(0)
    vi.resetModules()
    localStorage.setItem('lk-voice-volume', '0.6')
    expect((await import('@/use/useSoundSettings')).default().voiceVolume.value).toBe(0.6)
  })

  it('treats the speaker as off when both sliders are at 0', async () => {
    const s = (await import('@/use/useSoundSettings')).default()
    const sfx = (await import('@/use/useSfx')).default()
    expect(sfx.enabled.value).toBe(true)
    s.setMusicVolume(0)
    s.setSfxVolume(0)
    expect(sfx.enabled.value).toBe(false)
    sfx.setEnabled(true)
    expect(s.musicVolume.value).toBeGreaterThan(0)
    expect(s.sfxVolume.value).toBe(1)
  })
})
