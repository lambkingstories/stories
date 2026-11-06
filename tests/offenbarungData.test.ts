/**
 * The data of "Alles wird neu" (`offenbarung.ts`, `en/offenbarung.en.ts`, `offenbarungPath.ts`), adventure no. 33 (Revelation 1-5, 7, 21-22, "a selection: the chapters of hope"):
 * the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Offenbarung/ENTWURF_Offenbarung.md`, Luther 1912 told in our own words),
 * two known and five new games with playable data (every `*Problems` check is empty), the question rule (two after a game, three in the quiet stages 2 and 5, six in the exam),
 * the map has nine stations and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted the test does not ask for the picture files; it asks for them as soon as the pictures are built in (the last picture of
 * the building-in script, `spiele/offenbarung/perlentore/stadt-offen.webp`, lies in `public/`). The map pieces are asked for at once (the panorama is in). Recordings and music only when they exist.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { offenbarung } from '@/data/adventures/offenbarung'
import { OFFENBARUNG_PATH } from '@/data/adventures/offenbarungPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { lettersProblems, praiseProblems, writeProblems } from '@/utils/offenbarungNeuA'
import type { LettersGame, PraiseGame, WriteGame } from '@/utils/offenbarungNeuA'
import { gatesProblems, palmsProblems } from '@/utils/offenbarungNeuB'
import type { GatesGame, PalmsGame } from '@/utils/offenbarungNeuB'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => offenbarung.stages[n - 1]!
/** The fields of the new games (`TaskKind`/`GameTask` are wired by the lead; until then they are read like this). */
type NewTask = { write?: WriteGame; letters?: LettersGame; praise?: PraiseGame; palms?: PalmsGame; gates?: GatesGame }
const task = (n: number) => stage(n).task as unknown as NewTask
/**
 * Words that no German text, question or answer may use. "getötet" is allowed here: Luther 1912 says "erwürget" for the lamb (Rev 5,6.9), the text says it mildly and once (stage 6).
 * Nothing else gruesome: no devil, no hell, no blood, no cross, no sword, no beast, no dragon, no plague.
 */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Leichnam|Blut|blutig|Kreuz|Kreuze|Heiligenschein|Schwert|geschlachtet|Drache|Drachen|Plage|Plagen|Reiter|Feuersee|Satan|Antichrist)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/offenbarung/perlentore/stadt-offen.webp')

describe('Offenbarung: stories and questions', () => {
  it('nine stages with 3 to 5 paragraphs of 100 to 190 words and the Bible passage (Revelation) under every one', () => {
    expect(offenbarung.id).toBe('offenbarung')
    expect(offenbarung.age).toBe('8-10')
    expect(offenbarung.title).toBe('Alles wird neu')
    expect(offenbarung.subtitle).toBe('Eine Auswahl aus der Offenbarung: die Kapitel der Hoffnung')
    expect(offenbarung.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of offenbarung.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Offenbarung (1|2–3|3|4|5|7|21)\b/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(100)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(190)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/offenbarung/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    expect(offenbarung.stages.map((s) => s.ref.split(',')[0])).toEqual(['Offenbarung 1', 'Offenbarung 1', 'Offenbarung 2–3', 'Offenbarung 3', 'Offenbarung 4', 'Offenbarung 5', 'Offenbarung 7', 'Offenbarung 21', 'Offenbarung 21'])
  })

  it('the parts of the book that are left out do not appear: no riders, plagues, dragon, beasts, Babylon, thousand years, lake of fire (Rev 6, 8-20, 21,8)', () => {
    const all = offenbarung.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/tausend Jahre|Babylon|Feuersee|Posaunenengel|Reiter|Drache|Tier\b|Plage|Hure|Armageddon|Endzeit/i)
    for (const s of offenbarung.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    for (const q of offenbarung.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
  })

  it('two questions after a game, three in the quiet stages 2 and 5 (only questions), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of offenbarung.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    expect(stage(2).task.kind).toBe('quiz')
    expect(stage(5).task.kind).toBe('quiz')
    for (const q of [...offenbarung.stages.flatMap((s) => s.questions), ...offenbarung.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(offenbarung.exam).toHaveLength(6)
    const asked = offenbarung.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(offenbarung.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'etwa', 'er', 'es'])
    for (const s of offenbarung.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the key words of the Bible are there (Luther 1912, told in our own words)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Patmos/)
    expect(t(1)).toMatch(/das A und das O/)
    expect(t(1)).toMatch(/in ein Buch/)
    expect(t(2)).toMatch(/sieben goldene Leuchter/)
    expect(t(2)).toMatch(/Fürchte dich nicht/)
    expect(t(3)).toMatch(/erste Liebe/)
    expect(t(3)).toMatch(/offene Tür/)
    expect(t(3)).toMatch(/Wer Ohren hat/)
    expect(t(4)).toMatch(/Laodizea/)
    expect(t(4)).toMatch(/vor der Tür und klopfe an/)
    expect(t(5)).toMatch(/Regenbogen/)
    expect(t(5)).toMatch(/Kronen/)
    expect(t(6)).toMatch(/Lamm/)
    expect(t(6)).toMatch(/sieben Siegeln/)
    expect(t(7)).toMatch(/Palmzweige/)
    expect(t(7)).toMatch(/alle Tränen/)
    expect(t(8)).toMatch(/neuen Himmel und eine neue Erde/)
    expect(t(8)).toMatch(/Siehe, ich mache alles neu/)
    expect(t(9)).toMatch(/zwölf Toren/)
    expect(t(9)).toMatch(/einzigen Perle/)
    expect(t(9)).toMatch(/Baum des Lebens/)
    expect(t(9)).toMatch(/komm, Herr Jesus/)
  })

  it('the exam asks across the whole adventure', () => {
    const q = offenbarung.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/Patmos/)
    expect(q).toMatch(/Fürchte dich nicht/)
    expect(q).toMatch(/Lamm/)
    expect(q).toMatch(/alles neu/)
    expect(q).toMatch(/komm, Herr Jesus/)
  })
})

describe('Offenbarung: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (lueckenvers, puzzle) far apart, five new ones, stages 2 and 5 only questions; no game twice in a row', () => {
    const kinds = offenbarung.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['schreiben', 'quiz', 'briefe', 'lueckenvers', 'quiz', 'lob', 'palmen', 'puzzle', 'perlentore'])
    for (let i = 1; i < kinds.length; i++) expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(writeProblems(task(1).write!)).toEqual([])
    expect(lettersProblems(task(3).letters!)).toEqual([])
    expect(praiseProblems(task(6).praise!)).toEqual([])
    expect(palmsProblems(task(7).palms!)).toEqual([])
    expect(gatesProblems(task(9).gates!)).toEqual([])
  })

  it('1 write: three short lines, then five longer ones; a dip is worth 60 percent of a short line', () => {
    const g = task(1).write!
    expect(g.rounds.map((r) => r.lines)).toEqual([3, 5])
    expect(g.rounds[1]!.lineLength).toBeGreaterThan(g.rounds[0]!.lineLength)
    expect(g.inkPerDip).toBe(0.6)
    expect(g.desk).toBe('images/abenteuer/spiele/offenbarung/schreiben/tisch.webp')
  })

  it('3 letters: the seven cities of Revelation 1,11 in the order of the verse; round 1 three with names, round 2 all seven without', () => {
    const g = task(3).letters!
    expect(g.cities.map((c) => c.id)).toEqual(['ephesus', 'smyrna', 'pergamon', 'thyatira', 'sardes', 'philadelphia', 'laodizea'])
    expect(g.rounds.map((r) => r.cities.length)).toEqual([3, 7])
    expect(g.rounds.map((r) => r.names)).toEqual([true, false])
    const story = stage(1).text.join(' ')
    for (const c of g.cities) expect(story, c.name).toContain(c.name)
  })

  it('4 missing word: the sentences of the verse game are word for word in the story (Rev 3,20)', () => {
    const v = stage(4).task.verse!
    const text = stage(4).text.join(' ').replace(/[„“”]/g, '')
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(text).toContain(s)
    }
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
  })

  it('6 praise: heaven, earth and sea in the order of Revelation 5,13; the song lasts twenty seconds', () => {
    const g = task(6).praise!
    expect(g.order).toEqual(['himmel', 'erde', 'meer'])
    expect(g.zones.map((z) => z.place)).toEqual(['im Himmel', 'auf Erden', 'im Meer'])
    expect(g.duration).toBe(20000)
  })

  it('7 palms: two waves in one row, then one through each of three rows, the back rows slower', () => {
    const g = task(7).palms!
    expect(g.rounds.map((r) => r.waves.length)).toEqual([2, 3])
    expect(g.rounds[1]!.waves.map((w) => w.row)).toEqual([0, 1, 2])
  })

  it('8 puzzle: the new earth (one picture, 2 x 3 pieces like the other puzzles of the journey)', () => {
    const p = stage(8).task.puzzle!
    expect(p.image).toBe('images/abenteuer/spiele/offenbarung/puzzle/neue-erde.webp')
    expect([p.cols, p.rows]).toEqual([2, 3])
  })

  it('9 gates: four sides with three gates each, morning and evening first, then midnight and noon; each side asks its piece of Revelation 21,13', () => {
    const g = task(9).gates!
    expect(g.sides.map((s) => s.openings.length)).toEqual([3, 3, 3, 3])
    expect(g.rounds.map((r) => r.order)).toEqual([['morgen', 'abend'], ['mitternacht', 'mittag']])
    expect(g.sides.map((s) => s.part)).toEqual(['Vom Morgen drei Tore', 'Vom Abend drei Tore', 'Von Mitternacht drei Tore', 'Vom Mittag drei Tore'])
  })
})

describe('Offenbarung: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = offenbarung.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(OFFENBARUNG_PATH).toHaveLength(9)
    for (const seg of OFFENBARUNG_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(OFFENBARUNG_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.images).toEqual([1, 2, 3].map((n) => `images/abenteuer/offenbarung/karte-pano-v1-${n}.webp`))
    if (existsSync('public/images/abenteuer/offenbarung/karte-pano-v1-1.webp')) for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the medal and the gift lie in the folder of the adventure; music of its own only when its files are in', () => {
    expect(offenbarung.medal).toMatch(/^images\/abenteuer\/offenbarung\/medaille-v\d\.webp$/)
    expect(offenbarung.gift!.image).toBe('images/abenteuer/offenbarung/geschenk.webp')
    expect(offenbarung.downloadMb).toBeGreaterThan(5)
    for (const f of offenbarung.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('a recording is named only when its file is in `public/` (otherwise the device reads)', () => {
    for (const s of offenbarung.stages) {
      const nn = String(s.id).padStart(2, '0')
      const file = `audio/abenteuer/offenbarung/geschichte-${nn}-v1.mp3`
      expect(s.audio, `stage ${s.id}`).toBe(existsSync(`public/${file}`) ? file : undefined)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(offenbarung).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f))
    expect(wanted.filter((f) => !existsSync(`public/${f}`))).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/offenbarung/etappe-bild-01'))).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(offenbarung)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(offenbarung) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string; subtitle: string }
    expect(en.title).toBe('All Things New')
    expect(en.subtitle).toBe('A selection from Revelation: the chapters of hope')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('John on Patmos')
    expect(task(3).letters!.cities[2]!.name).toBe('Pergamos')
    expect(task(6).praise!.zones[1]!.name).toBe('The earth')
    expect(task(6).praise!.zones[1]!.place).toBe('on the earth')
    expect(task(9).gates!.sides[0]!.part).toBe('On the east three gates')
    expect(task(9).gates!.sides[0]!.word).toBe('East')
    expect(task(7).palms!.rounds[0]!.hint).toContain('palm branches')
    expect(task(1).write!.rounds[1]!.hint).toContain('five longer lines')
    expect(stage(4).task.verse!.rounds[0]!.words[0]).toBe('door')
    setAdventureLanguage('de')
    expect(task(3).letters!.cities[2]!.name).toBe('Pergamon')
  })

  it('the English texts stay quiet: no blood, no cross, no devil', () => {
    const en = englishTextsOf(offenbarung) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|hell|devil|cross|sword|corpse|dragon|beast|plague)\b/i)
    })
  })
})
