/**
 * English version of the adventures (Joseph, Noah): every German text has an English counterpart of the same shape, nothing German is
 * left in the English texts, the recordings exist, and the screens follow the language.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { noah } from '@/data/adventures/noah'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles } from '@/utils/journeyFiles'
import type { Journey } from '@/types/adventure'

/** The keys whose strings are words the child reads or hears (everything else in the data is a picture path, a position or a rule). */
const TEXT_KEYS = new Set(['title', 'subtitle', 'ref', 'text', 'hint', 'q', 'options', 'question', 'label', 'labels', 'doneText', 'audio', 'rejects'])

type Walk = { path: string; de: string; en: string | undefined }

/** Walks the German data and collects every text with the English text at the same place. */
function collect(de: any, en: any, path: string, key: string, inside: boolean, out: Walk[]) {
  const isText = inside || TEXT_KEYS.has(key)
  if (typeof de === 'string') {
    if (isText) out.push({ path, de, en: typeof en === 'string' ? en : undefined })
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

/** Every array of the English file has as many entries as the German one. */
function sameShape(de: any, en: any, path: string, problems: string[]) {
  if (en === undefined || en === null) return
  if (Array.isArray(en)) {
    if (!Array.isArray(de) || de.length !== en.length) problems.push(`${path}: ${en.length} entries, German has ${Array.isArray(de) ? de.length : 'none'}`)
    else en.forEach((e, i) => sameShape(de[i], e, `${path}[${i}]`, problems))
  } else if (typeof en === 'object') {
    if (!de || typeof de !== 'object') problems.push(`${path}: no German counterpart`)
    else for (const k of Object.keys(en)) sameShape(de[k], en[k], `${path}.${k}`, problems)
  } else if (typeof de !== typeof en) problems.push(`${path}: not the same kind of value`)
}

/** Texts that are the same in both languages on purpose (names). */
const SAME_IN_BOTH = new Set(['Noah', 'Ham', 'Benjamin'])

const GERMAN = /[äöüßÄÖÜ]|\b(und|der|das|den|dem|nicht|ist|sind|ein|eine|einen|Josef|Jakob|Potifar|Ruben|Juda|Ägypten|Pharao|Mose)\b/

describe.each([[josef], [noah]] as [Journey][])('Englische Fassung %#', (j) => {
  const overlay = englishTextsOf(j) as any

  afterEach(() => setAdventureLanguage('de'))

  it('hat englische Texte, und sie haben dieselbe Gestalt wie die deutschen Daten', () => {
    expect(overlay, `${j.id}: localize() fehlt`).toBeTruthy()
    const problems: string[] = []
    sameShape(j, overlay, j.id, problems)
    expect(problems).toEqual([])
  })

  it('jeder deutsche Text hat einen englischen Gegenpart, der nicht gleich ist', () => {
    // the German data must be read while the language is German
    setAdventureLanguage('de')
    const walk: Walk[] = []
    collect(j, overlay, j.id, '', false, walk)
    expect(walk.length).toBeGreaterThan(80)
    const missing = walk.filter((w) => !w.en || !w.en.trim()).map((w) => w.path)
    expect(missing, 'deutsche Texte ohne englischen Text').toEqual([])
    const same = walk.filter((w) => w.en === w.de && !SAME_IN_BOTH.has(w.de) && !/\.(rejects)\./.test(w.path)).map((w) => `${w.path}: ${w.de}`)
    expect(same, 'unübersetzte Texte').toEqual([])
  })

  it('in der englischen Fassung steht nichts Deutsches mehr', () => {
    const texts: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') texts.push(v)
      else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    // the texts that are not paths of recordings
    take(overlay)
    for (const t of texts.filter((x) => !x.startsWith('audio/'))) {
      expect(GERMAN.test(t), `deutsches Wort in: ${t}`).toBe(false)
    }
  })

  it('schaltet mit der Sprache um: Titel, Geschichte, Fragen, Spieltexte und Aufnahmen', () => {
    setAdventureLanguage('de')
    const de = { title: j.title, story: j.stages[0]!.text[0], q: j.stages[0]!.questions[0]!.q, audio: j.stages[0]!.audio, hint: j.stages[0]!.task.hint, exam: j.exam[0]!.q, ref: j.stages[0]!.ref }
    setAdventureLanguage('en')
    expect(adventureLanguage.value).toBe('en')
    expect(j.title).toBe(overlay.title)
    expect(j.stages[0]!.text[0]).toBe(overlay.stages[0].text[0])
    expect(j.stages[0]!.questions[0]!.q).toBe(overlay.stages[0].questions[0].q)
    expect(j.stages[0]!.task.hint).toBe(overlay.stages[0].task.hint)
    expect(j.exam[0]!.q).toBe(overlay.exam[0].q)
    expect(j.stages[0]!.audio).toBe(overlay.stages[0].audio)
    expect(j.stages[0]!.audio).not.toBe(de.audio)
    expect(j.stages[0]!.ref).toMatch(/^Genesis /)
    setAdventureLanguage('de')
    expect({ title: j.title, story: j.stages[0]!.text[0], q: j.stages[0]!.questions[0]!.q, audio: j.stages[0]!.audio, hint: j.stages[0]!.task.hint, exam: j.exam[0]!.q, ref: j.stages[0]!.ref }).toEqual(de)
    // any other language than English shows the German originals
    setAdventureLanguage('fr')
    expect(j.title).toBe(de.title)
  })

  it('die englischen Fragen: dieselben Antwort-Indizes, drei Antworten, die richtige zuerst, Frage mit Fragezeichen', () => {
    setAdventureLanguage('en')
    const all = [...j.stages.flatMap((s) => s.questions), ...j.exam]
    const de = (() => {
      setAdventureLanguage('de')
      return [...j.stages.flatMap((s) => s.questions), ...j.exam].map((q) => ({ n: q.options.length, a: q.answer }))
    })()
    setAdventureLanguage('en')
    expect(all.length).toBe(de.length)
    all.forEach((q, i) => {
      expect(q.options.length, q.q).toBe(de[i]!.n)
      expect(q.answer, q.q).toBe(de[i]!.a)
      expect(new Set(q.options).size, q.q).toBe(q.options.length)
      expect(/[?]['’”]?$/.test(q.q.trim()), q.q).toBe(true)
    })
    // no question twice among the stages
    const qs = j.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(qs).size).toBe(qs.length)
  })

  it('die englischen Geschichten: Bibelstelle in englischer Schreibweise, gleich viele Absätze, 40–330 Wörter', () => {
    setAdventureLanguage('de')
    const paragraphs = j.stages.map((s) => s.text.length)
    setAdventureLanguage('en')
    j.stages.forEach((s, i) => {
      expect(s.ref, `Etappe ${s.id}`).toMatch(/^Genesis \d+(?:[:–,;\- ]+\d+)*$/)
      expect(s.text.length, `Absätze ${s.id}`).toBe(paragraphs[i])
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `Wörter ${s.id}`).toBeGreaterThan(40)
      expect(words, `Wörter ${s.id}`).toBeLessThan(330)
      expect(s.task.hint!.length, `Hinweis ${s.id}`).toBeGreaterThan(8)
      expect(s.task.hint!.length, `Hinweis ${s.id}`).toBeLessThanOrEqual(110)
    })
  })

  it('die englischen Aufnahmen liegen da, sind klein und gehören beim englischen Download ins Paket (und nur dort)', () => {
    setAdventureLanguage('en')
    const files = journeyFiles(j)
    for (const s of j.stages) {
      expect(s.audio, `Etappe ${s.id}`).toMatch(new RegExp(`^audio/abenteuer/${j.id}/geschichte-\\d\\d-en-v\\d+\\.mp3$`))
      const path = `public/${s.audio}`
      expect(existsSync(path), `fehlt: ${path}`).toBe(true)
      expect(statSync(path).size, path).toBeGreaterThan(20_000)
      expect(statSync(path).size, path).toBeLessThan(600_000)
      expect(files, s.audio).toContain(s.audio)
    }
    // the pack holds the recordings of the language of the app only (the size of the pack stays the same)
    setAdventureLanguage('de')
    const german = journeyFiles(j)
    for (const s of j.stages) {
      expect(german).toContain(s.audio)
      expect(german.some((f) => /-en-v\d+\.mp3$/.test(f)), 'englische Aufnahme im deutschen Paket').toBe(false)
    }
  })
})
