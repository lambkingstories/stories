import { existsSync, readdirSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { journeys } from '@/data/adventures'
import { ADVENTURE_SOUND_FILES, ADVENTURE_UI_FILES, journeyFiles } from '@/utils/journeyFiles'

describe('the download of a journey', () => {
  it('lists only files that exist, each once', () => {
    for (const j of journeys) {
      const files = journeyFiles(j)
      expect(new Set(files).size).toBe(files.length)
      for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
    }
  })

  it('knows every painted sign and every sound of the folder (a new file has to be added to the list)', () => {
    const ui = readdirSync('public/images/abenteuer/ui').map((n) => `images/abenteuer/ui/${n}`)
    expect([...ui].sort()).toEqual([...ADVENTURE_UI_FILES].sort())
    const sounds = readdirSync('public/audio/abenteuer').filter((n) => n.endsWith('.mp3')).map((n) => `audio/abenteuer/${n}`)
    expect([...sounds].sort()).toEqual([...ADVENTURE_SOUND_FILES].sort())
  })

  it('states about the right size before the download', () => {
    for (const j of journeys) {
      const mb = journeyFiles(j).reduce((n, f) => n + statSync(`public/${f}`).size, 0) / 1024 / 1024
      expect(j.downloadMb, j.id).toBeDefined()
      expect(Math.abs((j.downloadMb ?? 0) - mb) / mb, `${j.id}: ${mb.toFixed(1)} MB`).toBeLessThan(0.25)
    }
  })
})
