import { describe, expect, it } from 'vitest'
import { MEMORY_VERSES, memoryVerseOf } from '@/data/memoryVerses'
import { TIMELINE } from '@/data/adventures/timeline'
import { JESUS_PATH } from '@/data/jesusPath'

describe('memory verses', () => {
  it('there is one for every adventure of the time line, in German and in English, and none for a stranger', () => {
    for (const e of TIMELINE) {
      const v = MEMORY_VERSES[e.id]
      expect(v, e.id).toBeTruthy()
      for (const l of ['de', 'en'] as const) {
        expect(v![l].text.length, `${e.id} ${l}`).toBeGreaterThan(10)
        expect(v![l].ref, `${e.id} ${l}`).toMatch(/\d/)
        expect(v!.line[l].length).toBeGreaterThan(10)
      }
    }
    expect(Object.keys(MEMORY_VERSES).sort()).toEqual(TIMELINE.map((e) => e.id).sort())
    expect(memoryVerseOf('gibt-es-nicht', 'de')).toBeNull()
  })

  it('uses the spelling of today (no "daß") and no unfinished text', () => {
    for (const v of Object.values(MEMORY_VERSES)) {
      expect(v.de.text).not.toMatch(/daß|muß|laßt|�/)
      expect(v.de.text).not.toMatch(/\s{2,}/)
    }
  })

  it('the way "Who is Jesus?" has five steps in both languages, a prayer only in the fourth', () => {
    for (const l of ['de', 'en'] as const) {
      const steps = JESUS_PATH[l].steps
      expect(steps).toHaveLength(5)
      expect(steps.map((s) => !!s.prayer)).toEqual([false, false, false, true, false])
      for (const s of steps) expect(s.verse.text.length).toBeGreaterThan(10)
    }
  })
})
