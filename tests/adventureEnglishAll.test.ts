/**
 * Every adventure has an English text for every German text a child reads or hears (the check of `adventureEnglish.test.ts`, which looks
 * at Joseph and Noah in detail, for all of them). Texts that are only the names of things inside a game (ids) or numbered labels are left out.
 */
import { describe, expect, it } from 'vitest'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'

const TEXT_KEYS = new Set(['title', 'subtitle', 'ref', 'text', 'hint', 'q', 'options', 'question', 'label', 'labels', 'doneText', 'rejects'])
/** Places whose strings are ids of things in a game or numbered labels ("Prophet 1"), not words to translate. */
const NOT_WORDS = /\.(forge|crib)\.rounds\[|\.caves\.prophets\[/
type Walk = { path: string; de: string; en: string | undefined }

function collect(de: any, en: any, path: string, key: string, inside: boolean, out: Walk[]) {
  const isText = inside || TEXT_KEYS.has(key)
  if (typeof de === 'string') {
    if (isText && !de.startsWith('audio/') && !/\.(webp|png|mp3)$/.test(de)) out.push({ path, de, en: typeof en === 'string' ? en : undefined })
    return
  }
  if (Array.isArray(de)) {
    de.forEach((d, i) => collect(d, Array.isArray(en) ? en[i] : undefined, `${path}[${i}]`, key, isText, out))
    return
  }
  if (de && typeof de === 'object') {
    for (const k of Object.keys(de)) {
      if (k === 'seeds' || k === 'points' || k === 'polygon') continue
      collect(de[k], en && typeof en === 'object' ? en[k] : undefined, `${path}.${k}`, k, k === 'rejects' || (isText && inside), out)
    }
  }
}

const mods = import.meta.glob('/src/data/adventures/*.ts', { eager: true }) as Record<string, Record<string, any>>
const journeys = Object.values(mods).flatMap((m) => Object.values(m)).filter((j) => j && typeof j === 'object' && j.id && Array.isArray(j.stages) && Array.isArray(j.exam))

describe('English texts of all adventures', () => {
  it('finds the adventures', () => {
    expect(journeys.length).toBeGreaterThanOrEqual(26)
  })

  it.each(journeys.map((j) => [j.id, j] as const))('%s: no German text without an English one', (_id, j) => {
    setAdventureLanguage('de')
    const overlay = englishTextsOf(j) as any
    expect(overlay, `${j.id}: no English texts`).toBeTruthy()
    const walk: Walk[] = []
    collect(j, overlay, j.id, '', false, walk)
    const missing = walk.filter((w) => !NOT_WORDS.test(w.path) && (!w.en || !w.en.trim())).map((w) => `${w.path}: ${w.de.slice(0, 50)}`)
    expect(missing).toEqual([])
  })
})
