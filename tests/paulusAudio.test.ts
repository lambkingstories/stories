import { existsSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { paulus } from '@/data/adventures/paulus'
import { paulusrom } from '@/data/adventures/paulusrom'
import { paulusEn } from '@/data/adventures/en/paulus.en'
import { paulusromEn } from '@/data/adventures/en/paulusrom.en'
import { journeyFiles } from '@/utils/journeyFiles'
import { MUSIC_FILES } from '@/utils/sfxFiles'

// Nr. 31 and Nr. 32: every stage has a German and an English recording (voice Achernar), the adventure has its own music (at least three pieces, Anton 21.10.2026)
const CASES = [
  { j: paulus, en: paulusEn, id: 'paulus' },
  { j: paulusrom, en: paulusromEn, id: 'paulusrom' }
]

describe.each(CASES)('recordings and music of $id', ({ j, en, id }) => {
  it('all nine stages have a German and an English recording that exist (the German ones are in the pack)', () => {
    const files = journeyFiles(j)
    expect(j.stages).toHaveLength(9)
    j.stages.forEach((s, i) => {
      const nn = String(i + 1).padStart(2, '0')
      expect(s.audio, `German ${nn}`).toBe(`audio/abenteuer/${id}/geschichte-${nn}-v1.mp3`)
      expect(en.stages![i].audio, `English ${nn}`).toBe(`audio/abenteuer/${id}/geschichte-${nn}-en-v1.mp3`)
      for (const f of [s.audio!, en.stages![i].audio!]) {
        expect(existsSync(`public/${f}`), f).toBe(true)
        expect(statSync(`public/${f}`).size, f).toBeGreaterThan(60 * 1024)
      }
      // the pack holds the recordings of the language of the app at the time of the download (journeyFiles): here German
      expect(files, s.audio!).toContain(s.audio!)
    })
  })

  it('has three pieces of its own music: files exist, are real pieces, are in the pack; the general pieces stay out', () => {
    const files = journeyFiles(j)
    expect(j.music!.length).toBeGreaterThanOrEqual(3)
    expect(new Set(j.music).size).toBe(j.music!.length)
    for (const m of j.music!) {
      expect(m.startsWith(`audio/abenteuer/${id}/musik-`), m).toBe(true)
      expect(existsSync(`public/${m}`), m).toBe(true)
      expect(statSync(`public/${m}`).size, m).toBeGreaterThan(200 * 1024)
      expect(files).toContain(m)
    }
    for (const g of MUSIC_FILES) expect(files, g).not.toContain(g)
  })
})
