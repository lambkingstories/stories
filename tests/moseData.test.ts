/**
 * The data of "Mose" (`mose.ts` and `en/mose.en.ts`), phase 2a: the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Mose/ENTWURF_Mose.md`), every stage still has the quiz PLACEHOLDER and a picture of Josef until the games and the own pictures are built in, the map is the
 * placeholder map of Josef (fifteen stations + exam), and the English file has the same shape. The own pictures and recordings are not there yet (`audio` is missing on purpose).
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { mose } from '@/data/adventures/mose'
import { MOSE_PATH } from '@/data/adventures/mosePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { dayOk, diffAt, distance, noTriple, shuffle, wordsOf } from '@/utils/moseGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => mose.stages[n - 1]!
/** Words that no text of the German data may use (the plagues, the Passover night and the golden calf are told without cruelty; "töten" is allowed because it is a commandment, "Blut" because the Bible says so). */
const FORBIDDEN = /\b(Messer|Speer|Pfeil|Peitsche|Teufel|Hölle|erschlagen|erwürgen|dreitausend)\b/i
const QUIZ_STAGES = [1, 3, 8, 9, 14]

describe('Mose: stories and questions', () => {
  it('fifteen stages with 3 to 5 paragraphs of 60 to 260 words and the Bible passage under every one; no recording yet; the stage pictures are the ones of Josef (PLATZHALTER)', () => {
    expect(mose.id).toBe('mose')
    expect(mose.age).toBe('8-10')
    expect(mose.title).toBe('Mose')
    expect(mose.subtitle).toBe('Der Weg in die Freiheit')
    expect(mose.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(mose.stages.map((s) => s.title)).toEqual([
      'Das Volk in Ägypten',
      'Das Körbchen im Schilf',
      'Flucht nach Midian',
      'Der brennende Dornbusch',
      'Mose und Aaron',
      'Lass mein Volk ziehen',
      'Die ersten Plagen',
      'Hagel, Heuschrecken und Finsternis',
      'Die Nacht des Passah',
      'Der Auszug',
      'Das Wunder am Meer',
      'Brot vom Himmel',
      'Gottes Wort am Berg Sinai',
      'Das goldene Kalb',
      'Gott geht mit'
    ])
    for (const s of mose.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^2\. Mose \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(60)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(260)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, `no recording yet, the device voice reads: ${s.id}`).toBeUndefined()
      expect(s.image, `stage ${s.id}`).toMatch(/^images\/abenteuer\/josef\/etappe-bild-\d\d(-v2)?\.webp$/)
    }
  })

  it('two questions per stage (three in the serious stages 1, 3, 8, 9 and 14), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    expect(mose.stages.map((s) => s.questions.length)).toEqual([3, 2, 3, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 3, 2])
    for (const q of [...mose.stages.flatMap((s) => s.questions), ...mose.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(mose.exam).toHaveLength(6)
    const asked = mose.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(mose.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von'])
    for (const s of mose.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        // at least one word of the right answer (cut to its first five letters, for endings) lies in the text
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the five serious stages (1, 3, 8, 9, 14) say so in the hint and are only quizzes; the hard places are told calmly (no cruelty, no picture words)', () => {
    for (const n of QUIZ_STAGES) {
      expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
      expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    }
    // the death of the Egyptian: one sober sentence, without "im Zorn" (the Bible does not say it)
    expect(stage(3).text.join(' ')).toMatch(/schlägt den Ägypter, sodass der Mann stirbt/)
    expect(stage(3).text.join(' ')).not.toMatch(/Zorn/)
    // the Passover night: the firstborn die, nothing is painted out
    const t9 = stage(9).text.join(' ')
    expect(t9).toMatch(/Passah/)
    expect(t9).toMatch(/erstgeborenen Söhne/)
    // the golden calf: told in a few sentences, without the judgement of the Levites
    const t14 = stage(14).text.join(' ')
    expect(t14).toMatch(/Kalb/)
    expect(t14).not.toMatch(/Schwert|Levi|Pest|Seuche/)
    // the burning bush and the pillar of cloud: Gott speaks, no angel
    expect(stage(4).text.join(' ')).toMatch(/Mose, Mose/)
    expect(stage(4).text.join(' ')).not.toMatch(/Engel/)
  })

  it('God is "Gott" everywhere in the narration (also in direct speech); not "der Herr"', () => {
    const all = mose.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/der Herr\b|dem Herrn\b|\bHERR\b/)
  })

  it('the questions do not ask what a game of the stage will show (the sentences of the verse game, the frogs, the commandment sentences)', () => {
    const q = (n: number) => stage(n).questions.map((x) => x.q).join(' ').toLowerCase()
    expect(q(6)).not.toMatch(/lass mein volk|herausführen/)
    expect(q(13)).not.toMatch(/du sollst/)
  })
})

describe('Mose: the games, and the placeholders until the pictures come', () => {
  it('every stage has the quiz task for now (PLATZHALTER bis Spiel/Bild); the games of the plan are listed in the data file, not yet built', () => {
    expect(mose.stages.map((s) => s.task.kind)).toEqual(['quiz', 'quiz', 'quiz', 'quiz', 'unterschied', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'manna', 'worte', 'quiz', 'wolke'])
    for (const s of mose.stages) expect(s.task.hint.length, `hint ${s.id}`).toBeGreaterThan(8)
  })

  it('13 words: three sentences in each round, all word for word in the text of the stage (also in English); the sentence of the quiz question is not used; the goal is 6', () => {
    const g = stage(13).task.words
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.sentences.length)).toEqual([3, 3])
    const check = () => {
      const text = stage(13).text.join(' ')
      for (const r of stage(13).task.words!.rounds) {
        for (const sentence of r.sentences) {
          expect(text, sentence).toContain(sentence.replace(/[.!?]$/, ''))
          expect(sentence.split(' ').length).toBeGreaterThanOrEqual(4)
        }
      }
    }
    check()
    // the round 2 sentences are longer than the round 1 sentences
    const avg = (xs: string[]) => xs.reduce((n, s) => n + s.split(' ').length, 0) / xs.length
    expect(avg(g.rounds[1]!.sentences)).toBeGreaterThan(avg(g.rounds[0]!.sentences))
    expect(g.rounds.flatMap((r) => r.sentences).join(' ')).not.toContain('Alles, was Gott gesagt hat')
    for (const r of g.rounds) for (const s of r.sentences) expect(shuffle(wordsOf(s), 1).join(' ')).not.toBe(wordsOf(s).join(' '))
    setAdventureLanguage('en')
    expect(stage(13).task.words!.rounds.map((r) => r.sentences.length)).toEqual([3, 3])
    check()
    setAdventureLanguage('de')
    expect(g.background).toBe(stage(13).image)
  })

  it('5 differences: four things, then six; every thing lies in the picture, the things are apart from each other (so that a tap belongs to one), the sprites differ; the goal is 10', () => {
    const g = stage(5).task.diff
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.items.length)).toEqual([4, 6])
    expect(g.rounds[0]!.base).not.toBe(g.rounds[1]!.base)
    for (const r of g.rounds) {
      for (const [i, a] of r.items.entries()) {
        expect(a.x >= 0 && a.x <= 100 && a.y >= 0 && a.y <= 100).toBe(true)
        for (const b of r.items.slice(i + 1)) expect(distance(a, b), 'apart').toBeGreaterThan(12)
      }
    }
    // a tap on the middle of a thing hits exactly this thing
    for (const r of g.rounds) r.items.forEach((it, i) => expect(diffAt(r.items, { x: it.x, y: it.y }, r.items.map(() => false))).toBe(i))
    expect(new Set(g.rounds.flatMap((r) => r.items.map((it) => it.image))).size).toBe(10)
    expect(g.rounds[1]!.items.reduce((n, it) => n + it.w, 0) / 6).toBeLessThan(g.rounds[0]!.items.reduce((n, it) => n + it.w, 0) / 4)
    expect(g.rounds.reduce((n, r) => n + r.items.length, 0)).toBe(10)
  })

  it('12 manna: three usual days, then two usual, a double day and a day of rest; four grains fill a jar; the goal is seven days', () => {
    const g = stage(12).task.manna
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.days.map((d) => d.jars))).toEqual([[2, 2, 2], [2, 2, 4, 0]])
    expect(g.flakesPerJar).toBe(4)
    expect(g.flakes).toHaveLength(3)
    // the day of rest is the last day; the double day comes the day before; right and wrong collected amounts
    const days = g.rounds.flatMap((r) => r.days)
    expect(days).toHaveLength(7)
    expect(days[6]!.jars).toBe(0)
    expect(days[5]!.jars).toBe(2 * days[4]!.jars)
    for (const d of days) {
      expect(dayOk(d, d.jars * 4, 4)).toBe(true)
      expect(dayOk(d, d.jars * 4 + 4, 4)).toBe(false)
    }
    expect(g.background).toBe(stage(12).image)
  })

  it('15 cloud: five questions by day, five by night; never three times the same in a row; both answers occur in each round; the extras have pictures; the goal is 10', () => {
    const g = stage(15).task.cloud
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.mode, r.trials.length])).toEqual([['day', 5], ['night', 5]])
    for (const r of g.rounds) {
      expect(noTriple(r.trials)).toBe(true)
      expect(r.trials.some((t) => t.pillar === 'rises')).toBe(true)
      expect(r.trials.some((t) => t.pillar === 'stays')).toBe(true)
      for (const t of r.trials) {
        expect(t.distractors.length).toBeGreaterThanOrEqual(1)
        for (const d of t.distractors) expect(Object.keys(g.extras).concat('banner')).toContain(d)
      }
    }
    expect(g.rounds[1]!.trials.every((t) => !t.distractors.includes('birds'))).toBe(true)
    expect(g.rounds.reduce((n, r) => n + r.trials.length, 0)).toBe(10)
  })

  it('no stage is "soon": the first stage is open at the start, the others open one after the other', () => {
    expect(mose.stages.every((s) => !s.soon)).toBe(true)
    const open = mose.stages.map((_, i) => isStageOpen(mose, undefined, i))
    expect(open).toEqual([true, ...Array(14).fill(false)])
  })

  it('medal and gift are the ones of Josef until its own come; the gift has its final title', () => {
    expect(mose.medal).toBe(josef.medal)
    expect(mose.gift.title).toBe('Der Weg durch das Meer')
    expect(mose.gift.image).toBe(josef.gift.image)
  })

  it('every file that the data names exists (the pictures of Josef, the map, the medal) and is small enough', () => {
    let bytes = 0
    for (const f of journeyFiles(mose)) {
      if (notPaintedYet(f) && !existsSync(`public/${f}`)) continue
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(1_800_000)
      bytes += size
    }
    expect(bytes / 1_000_000, 'the placeholder pack in MB').toBeLessThan(20)
  })
})

describe('Mose: die Karte (Platzhalter von Josef)', () => {
  const m = mose.map
  it('vier Stücke eines Bildes (von Josef), fünfzehn Stationen von links nach rechts plus Ziel, nicht zu tief; der Perlenweg hat eine Strecke je Station (die letzte führt zum Ziel)', () => {
    expect(m.images).toEqual(josef.map.images)
    expect(m.stages).toHaveLength(15)
    expect(m.path).toHaveLength(15)
    expect(m.path).toBe(MOSE_PATH)
    const spots = [...m.stages, m.exam]
    spots.forEach((sp, i) => {
      expect(sp.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.66)
      if (i > 0) expect(sp.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
    })
    for (const seg of m.path) for (const [x, y] of seg) expect(x > 0 && x < 1 && y > 0 && y <= 0.8).toBe(true)
  })
})

describe('Mose: the lists for the recordings (NEUAUFNAHME-Mose.md) say exactly what the data says', () => {
  const de = 'D:/Claude/Abenteuer-Mose/stories-mose-de.json'
  const en = 'D:/Claude/Abenteuer-Mose/ENGLISCH/stories-mose-en.json'
  // the lists lie outside the repository (they belong to the drafts); on another computer there is nothing to compare
  it.runIf(existsSync(de) && existsSync(en))('German and English list: fifteen entries, the same paragraphs as the data, the recording names of the plan', () => {
    const read = (f: string) => JSON.parse(readFileSync(f, 'utf-8')) as { n: number; text: string[]; audio: string }[]
    const overlay = englishTextsOf(mose) as any
    setAdventureLanguage('de')
    const dl = read(de)
    const el = read(en)
    expect(dl).toHaveLength(15)
    expect(el).toHaveLength(15)
    mose.stages.forEach((s, i) => {
      expect(dl[i]!.n).toBe(s.id)
      expect(dl[i]!.text, `German list ${s.id}`).toEqual(s.text)
      expect(dl[i]!.audio).toBe(`audio/abenteuer/mose/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
      expect(el[i]!.text, `English list ${s.id}`).toEqual(overlay.stages[i].text)
      expect(el[i]!.audio).toBe(`audio/abenteuer/mose/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    })
  })
})

describe('Mose: English', () => {
  const overlay = englishTextsOf(mose) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, answers, exam questions) and no German word is left', () => {
    expect(overlay).toBeTruthy()
    expect(overlay.stages).toHaveLength(15)
    overlay.stages.forEach((e: any, i: number) => {
      const s = mose.stages[i]!
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
    const de = mose.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q), ref: s.ref }))
    setAdventureLanguage('en')
    mose.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Exodus \d/)
    })
    expect(mose.title).toBe('Moses')
    expect(mose.subtitle).toBe('The Road to Freedom')
    expect(mose.gift.title).toBe('The Way Through the Sea')
    expect(adventureLanguage.value).toBe('en')
    expect(stage(1).text.join(' ')).toMatch(/Shiphrah and Puah/)
    expect(stage(3).text.join(' ')).toMatch(/Jethro/)
    expect(stage(11).text.join(' ')).toMatch(/Red Sea/)
    expect(stage(11).text.join(' ')).toMatch(/Miriam/)
    for (const q of [...mose.stages.flatMap((s) => s.questions), ...mose.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(stage(1).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
  })
})
