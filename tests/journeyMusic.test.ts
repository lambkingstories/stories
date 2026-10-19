import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { journeyById } from '@/data/adventures'
import { josef } from '@/data/adventures/josef'
import { noah } from '@/data/adventures/noah'
import { journeyFiles } from '@/utils/journeyFiles'
import { MUSIC_FILES } from '@/utils/sfxFiles'

describe('the music of the journeys', () => {
  for (const j of [josef, noah]) {
    it(`${j.id} has its own pieces: files exist, are in the pack, and the general pieces stay out`, () => {
      expect(j.music!.length).toBeGreaterThanOrEqual(3)
      expect(new Set(j.music).size).toBe(j.music!.length)
      const files = journeyFiles(j)
      for (const m of j.music!) {
        expect(existsSync(`public/${m}`), m).toBe(true)
        expect(statSync(`public/${m}`).size, `${m} is a real piece`).toBeGreaterThan(200 * 1024)
        expect(files).toContain(m)
      }
      for (const g of MUSIC_FILES) expect(files, g).not.toContain(g)
    })
  }

  it('different journeys have different music', () => {
    expect(josef.music!.filter((m) => noah.music!.includes(m))).toEqual([])
  })

  it('a journey without its own music gets the general pieces in its pack', () => {
    const plain = { ...josef, music: undefined }
    const files = journeyFiles(plain)
    for (const g of MUSIC_FILES) expect(files, g).toContain(g)
    expect(journeyById('josef')).toBeDefined()
  })
})
