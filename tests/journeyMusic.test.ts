import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { journeyById } from '@/data/adventures'
import { abraham } from '@/data/adventures/abraham'
import { adamEva } from '@/data/adventures/adameva'
import { babel } from '@/data/adventures/babel'
import { gideon } from '@/data/adventures/gideon'
import { jakob } from '@/data/adventures/jakob'
import { josef } from '@/data/adventures/josef'
import { josua } from '@/data/adventures/josua'
import { mose } from '@/data/adventures/mose'
import { jona } from '@/data/adventures/jona'
import { noah } from '@/data/adventures/noah'
import { journeyFiles } from '@/utils/journeyFiles'
import { MUSIC_FILES } from '@/utils/sfxFiles'

// every adventure has its own music: at least three pieces (Anton, 21.10.2026), so that one hears more than one piece
const ALL = [josef, noah, adamEva, abraham, jakob, babel, josua, gideon, mose, jona]

describe('the music of the journeys', () => {
  for (const j of ALL) {
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

  it('different adventures have different music (no file twice)', () => {
    const all = ALL.flatMap((j) => j.music!)
    expect(new Set(all).size).toBe(all.length)
  })

  it('a journey without its own music gets the general pieces in its pack', () => {
    const plain = { ...josef, music: undefined }
    const files = journeyFiles(plain)
    for (const g of MUSIC_FILES) expect(files, g).toContain(g)
    expect(journeyById('josef')).toBeDefined()
  })
})
