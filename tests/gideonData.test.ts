/**
 * The data of "Gideon" (`gideon.ts` and `en/gideon.en.ts`), phase 2a: the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Gideon/ENTWURF_Gideon.md`), every stage still has the quiz PLACEHOLDER and a picture of Josef until the games and the own pictures are built in, the map is the
 * placeholder map of Josef (twelve stations + exam), and the English file has the same shape. The own pictures and recordings are not there yet (`audio` is missing on purpose).
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { gideon } from '@/data/adventures/gideon'
import { GIDEON_PATH } from '@/data/adventures/gideonPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { tilesFor } from '@/utils/gideonGames'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => gideon.stages[n - 1]!
/** Words that no text of the German data may use (the night with the jars is told without fighting; the dream of the Midianite says "Schwert" in the Bible, so that one word is allowed). */
const FORBIDDEN = /\b(Messer|Speer|Pfeil|Blut|töten|erschlagen|erwürgen|Teufel|Hölle)\b/i

describe('Gideon: stories and questions', () => {
  it('twelve stages with 3 to 5 paragraphs of 60 to 220 words and the Bible passage under every one; no recording yet; the stage pictures are the ones of Josef (PLATZHALTER)', () => {
    expect(gideon.id).toBe('gideon')
    expect(gideon.age).toBe('8-10')
    expect(gideon.title).toBe('Gideon')
    expect(gideon.subtitle).toBe('Der Kleinste und die Dreihundert')
    expect(gideon.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(gideon.stages.map((s) => s.title)).toEqual([
      'Debora und Barak',
      'Die Midianiter kommen',
      'Gideon in der Kelter',
      'Feuer aus dem Fels',
      'Der Altar des Baal',
      'Das Fell auf der Tenne',
      'Zu viele Männer',
      'Am Wasser',
      'Der Traum im Lager',
      'Krüge, Fackeln und Posaunen',
      'Ephraim und die Furten',
      'Gott soll euer Herr sein'
    ])
    for (const s of gideon.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Richter \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(60)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(220)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, `no recording yet, the device voice reads: ${s.id}`).toBeUndefined()
      expect(s.image, `stage ${s.id}`).toMatch(/^images\/abenteuer\/josef\/etappe-bild-\d\d(-v2)?\.webp$/)
    }
    expect(new Set(gideon.stages.map((s) => s.image)).size).toBe(12)
  })

  it('two questions per stage (three in the stages 1, 5 and 11), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    expect(gideon.stages.map((s) => s.questions.length)).toEqual([3, 2, 2, 2, 3, 2, 2, 2, 2, 2, 3, 2])
    for (const q of [...gideon.stages.flatMap((s) => s.questions), ...gideon.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(gideon.exam).toHaveLength(6)
    const asked = gideon.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(gideon.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von'])
    for (const s of gideon.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        // at least one word of the right answer (cut to its first five letters, for endings) lies in the text
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the serious stages (1, 5) say so in the hint and are only quizzes; the war of Debora and the altar of Baal are told without fighting', () => {
    expect(stage(1).task.hint).toContain('ernst')
    expect(stage(5).task.hint).toContain('ernst')
    expect(stage(1).task.kind).toBe('quiz')
    expect(stage(5).task.kind).toBe('quiz')
    const t1 = stage(1).text.join(' ')
    expect(t1).toMatch(/Debora/)
    expect(t1).not.toMatch(/Jael|Nagel|Schläfe|gefallen|Schwert/)
    const t5 = stage(5).text.join(' ')
    expect(t5).toMatch(/Baal/)
    expect(t5).not.toMatch(/sterben|töten|Tod/)
  })

  it('God is "Gott" everywhere in the narration (also in direct speech); the angel is named only as "Engel Gottes" or "Engel"', () => {
    const all = gideon.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/der Herr\b|dem Herrn\b|\bHERR\b/)
    expect(stage(3).text.join(' ')).toMatch(/Engel Gottes/)
    expect(stage(4).text.join(' ')).toMatch(/Feuer fährt aus dem Felsen/)
  })

  it('the questions do not ask what a game of the stage will show (the word, the dew, the men who drink from the hand)', () => {
    const q = (n: number) => stage(n).questions.map((x) => x.q).join(' ').toLowerCase()
    expect(q(4)).not.toMatch(/wie nennt gideon den altar|wohin legt gideon/)
    expect(q(6)).not.toMatch(/wo liegt.*tau/)
    expect(q(8)).not.toMatch(/woran erkennt/)
  })
})

describe('Gideon: the placeholders until the games and pictures come', () => {
  it('every stage has the quiz task for now (PLATZHALTER bis Spiel/Bild); the games of the plan are listed in the data file, not yet built', () => {
    expect(gideon.stages.map((s) => s.task.kind)).toEqual(['quiz', 'quiz', 'quiz', 'wort', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz'])
    for (const s of gideon.stages) expect(s.task.hint.length, `hint ${s.id}`).toBeGreaterThan(8)
  })

  it('4 word: two words from the text (FRIEDE and FELSEN), two extra letters each that are not in the word; the English words are PEACE and ROCK; the goal comes from the letters', () => {
    const g = stage(4).task.word
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.word)).toEqual(['FRIEDE', 'FELSEN'])
    for (const r of g.rounds) {
      expect(r.word).toBe(r.word.toUpperCase())
      expect(r.extra).toHaveLength(2)
      for (const l of r.extra) expect(r.word, `extra ${l}`).not.toContain(l)
      expect(stage(4).text.join(' ').toUpperCase()).toContain(r.word)
      const tiles = tilesFor(r.word, r.extra)
      expect(tiles).toHaveLength(r.word.length + 2)
    }
    expect(g.rounds.reduce((n, r) => n + r.word.length, 0)).toBe(12)
    setAdventureLanguage('en')
    expect(stage(4).task.word!.rounds.map((r) => r.word)).toEqual(['PEACE', 'ROCK'])
    expect(stage(4).task.word!.rounds.reduce((n, r) => n + r.word.length, 0)).toBe(9)
    setAdventureLanguage('de')
  })

  it('no stage is "soon": the first stage is open at the start, the others open one after the other', () => {
    expect(gideon.stages.every((s) => !s.soon)).toBe(true)
    const open = gideon.stages.map((_, i) => isStageOpen(gideon, undefined, i))
    expect(open).toEqual([true, ...Array(11).fill(false)])
  })

  it('medal and gift are the ones of Josef until its own come; the gift has its final title', () => {
    expect(gideon.medal).toBe(josef.medal)
    expect(gideon.gift.title).toBe('Die Nacht mit den Krügen und Fackeln')
    expect(gideon.gift.image).toBe(josef.gift.image)
  })

  it('every file that the data names exists (the pictures of Josef, the map, the medal) and is small enough', () => {
    let bytes = 0
    for (const f of journeyFiles(gideon)) {
      if (notPaintedYet(f) && !existsSync(`public/${f}`)) continue
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(1_800_000)
      bytes += size
    }
    expect(bytes / 1_000_000, 'the placeholder pack in MB').toBeLessThan(20)
  })
})

describe('Gideon: die Karte (Platzhalter von Josef)', () => {
  const m = gideon.map
  it('vier Stücke eines Bildes (von Josef), zwölf Stationen von links nach rechts plus Ziel, nicht zu tief; der Perlenweg hat eine Strecke je Station (die letzte führt zum Ziel)', () => {
    expect(m.images).toEqual(josef.map.images)
    expect(m.stages).toHaveLength(12)
    expect(m.path).toHaveLength(12)
    expect(m.path).toBe(GIDEON_PATH)
    const spots = [...m.stages, m.exam]
    spots.forEach((sp, i) => {
      expect(sp.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.66)
      if (i > 0) expect(sp.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
    })
    for (const seg of m.path) for (const [x, y] of seg) expect(x > 0 && x < 1 && y > 0 && y <= 0.8).toBe(true)
  })
})

describe('Gideon: the lists for the recordings (NEUAUFNAHME-Gideon.md) say exactly what the data says', () => {
  const de = 'D:/Claude/Abenteuer-Gideon/stories-gideon-de.json'
  const en = 'D:/Claude/Abenteuer-Gideon/ENGLISCH/stories-gideon-en.json'
  // the lists lie outside the repository (they belong to the drafts); on another computer there is nothing to compare
  it.runIf(existsSync(de) && existsSync(en))('German and English list: twelve entries, the same paragraphs as the data, the recording names of the plan', () => {
    const read = (f: string) => JSON.parse(readFileSync(f, 'utf-8')) as { n: number; text: string[]; audio: string }[]
    const overlay = englishTextsOf(gideon) as any
    setAdventureLanguage('de')
    const dl = read(de)
    const el = read(en)
    expect(dl).toHaveLength(12)
    expect(el).toHaveLength(12)
    gideon.stages.forEach((s, i) => {
      expect(dl[i]!.n).toBe(s.id)
      expect(dl[i]!.text, `German list ${s.id}`).toEqual(s.text)
      expect(dl[i]!.audio).toBe(`audio/abenteuer/gideon/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
      expect(el[i]!.text, `English list ${s.id}`).toEqual(overlay.stages[i].text)
      expect(el[i]!.audio).toBe(`audio/abenteuer/gideon/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    })
  })
})

describe('Gideon: English', () => {
  const overlay = englishTextsOf(gideon) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, answers, exam questions) and no German word is left', () => {
    expect(overlay).toBeTruthy()
    expect(overlay.stages).toHaveLength(12)
    overlay.stages.forEach((e: any, i: number) => {
      const s = gideon.stages[i]!
      setAdventureLanguage('de')
      const dePar = s.text.length
      const deQ = s.questions.map((q) => q.options.length)
      expect(e.text, `paragraphs ${s.id}`).toHaveLength(dePar)
      expect(e.questions.map((q: any) => q.options.length), `answers ${s.id}`).toEqual(deQ)
      expect(e.audio, `no English recording yet: ${s.id}`).toBeUndefined()
    })
    expect(overlay.exam).toHaveLength(6)
    const texts: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') texts.push(v)
      else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    take(overlay)
    for (const t of texts) expect(/[äöüßÄÖÜ]|\b(und|der|das|den|dem|nicht|ist|sind|ein|eine|einen)\b/.test(t), `German in: ${t}`).toBe(false)
  })

  it('every German text has an English one that is different; names follow the English Bible; the right answer stays first', () => {
    setAdventureLanguage('de')
    const de = gideon.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q), ref: s.ref }))
    setAdventureLanguage('en')
    gideon.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Judges \d/)
    })
    expect(gideon.title).toBe('Gideon')
    expect(gideon.subtitle).toBe('The Smallest and the Three Hundred')
    expect(gideon.gift.title).toBe('The Night of the Jars and Torches')
    expect(adventureLanguage.value).toBe('en')
    expect(stage(1).text.join(' ')).toMatch(/Deborah/)
    expect(stage(3).text.join(' ')).toMatch(/Ophrah/)
    expect(stage(9).text.join(' ')).toMatch(/Purah/)
    for (const q of [...gideon.stages.flatMap((s) => s.questions), ...gideon.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(stage(1).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
  })
})
