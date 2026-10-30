/**
 * The data of "Elisha and Naaman" (`elisa.ts`, `en/elisa.en.ts`, `elisaPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Elisa/ENTWURF_Elisa.md`, Luther 1912),
 * the quiz stages are only quizzes, the two new games and the five old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { elisa } from '@/data/adventures/elisa'
import { ELISA_PATH } from '@/data/adventures/elisaPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => elisa.stages[n - 1]!
/** Words that no text of the German data may use (Elisha is told without cruelty; the skin disease is never named "Aussatz"). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Aussatz|Aussätzige|Schwert|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [3, 6]

describe('Elisa: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(elisa.id).toBe('elisa')
    expect(elisa.age).toBe('8-10')
    expect(elisa.title).toBe('Elisa und Naaman')
    expect(elisa.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(elisa.stages.map((s) => s.title)).toEqual([
      'Das Öl der Witwe',
      'Das Zimmer auf dem Dach',
      'Der Sohn der Frau',
      'Der Topf mit dem bitteren Gemüse',
      'Zwanzig Brote',
      'Das Mädchen aus Israel',
      'Der Brief und die Geschenke',
      'Siebenmal im Jordan',
      'Naamans Dank'
    ])
    for (const s of elisa.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^2\. Könige [45],\d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(90)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(145)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(7)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(12.5)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/elisa/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of elisa.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...elisa.stages.flatMap((s) => s.questions), ...elisa.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(elisa.exam).toHaveLength(6)
    const asked = elisa.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(elisa.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den'])
    for (const s of elisa.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the oil, the room, the boy, the pot, the girl and the Jordan', () => {
    const q = elisa.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/gießt/)
    expect(q).toMatch(/Zimmer|baut/)
    expect(q).toMatch(/niest/)
    expect(q).toMatch(/Topf/)
    expect(q).toMatch(/Naaman/)
    expect(q).toMatch(/Jordan/)
  })

  it('the two quiz stages (3, 6) are only quizzes, never two in a row; stage 3 says it is serious', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(3).task.hint).toContain('ernst')
    const kinds = elisa.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what was left out stays out', () => {
    expect(stage(1).text.join(' ')).toMatch(/Was hast du im Haus/)
    expect(stage(1).text.join(' ')).toMatch(/Es ist keins mehr da/)
    expect(stage(2).text.join(' ')).toMatch(/bauen/)
    expect(stage(2).text.join(' ')).toMatch(/Bett, einen Tisch, einen Stuhl und einen Leuchter/)
    expect(stage(3).text.join(' ')).toMatch(/Ich lasse dich nicht los/)
    expect(stage(3).text.join(' ')).toMatch(/siebenmal/)
    expect(stage(4).text.join(' ')).toMatch(/im Topf ist Gift/)
    expect(stage(4).text.join(' ')).toMatch(/Bringt Mehl/)
    expect(stage(5).text.join(' ')).toMatch(/zwanzig Gerstenbrote/)
    expect(stage(5).text.join(' ')).toMatch(/noch etwas übrig bleiben/)
    expect(stage(6).text.join(' ')).toMatch(/Wenn mein Herr doch zu dem Propheten in Samaria ginge/)
    expect(stage(7).text.join(' ')).toMatch(/zehn Zentner Silber/)
    expect(stage(7).text.join(' ')).toMatch(/Bin ich Gott/)
    expect(stage(8).text.join(' ')).toMatch(/taucht siebenmal unter/)
    expect(stage(8).text.join(' ')).toMatch(/Haut eines Kindes/)
    expect(stage(9).text.join(' ')).toMatch(/So wahr Gott lebt, ich nehme nichts/)
    expect(stage(9).text.join(' ')).toMatch(/Zieh hin in Frieden/)
    // not told: Gehazi's greed and his punishment (chapter 5, verses 20 to 27), the mocking children, the war with Moab
    const all = elisa.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Gehasi läuft|Gehasi nimmt|Spott|Moab|Kahlkopf|Bären/)
  })
})

describe('Elisa: the games', () => {
  it('the order of the games: 5 old, 2 new (jars, dip), 2 quizzes; no game twice', () => {
    expect(elisa.stages.map((s) => s.task.kind)).toEqual(['kruege', 'puzzle', 'quiz', 'ernten', 'reihenfolge', 'quiz', 'memory', 'tauchen', 'lueckenvers'])
    const games = elisa.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['kruege', 'tauchen'].includes(k))).toHaveLength(2)
  })

  it('1 jars: three rounds with 3, 4 and 5 jars, every jar lies inside the picture and has a picture of its own, the jars do not overlap, the oil takes between 1 and 2.5 seconds', () => {
    const g = stage(1).task.jars!
    expect(g.rounds.map((r) => r.jars.length)).toEqual([3, 4, 5])
    expect(g.jars).toHaveLength(3)
    expect(g.jugW).toBeGreaterThanOrEqual(10)
    for (const r of g.rounds) {
      const jars = [...r.jars].sort((a, b) => a.x - b.x)
      jars.forEach((j, i) => {
        expect(j.x - j.w / 2, r.hint).toBeGreaterThanOrEqual(0)
        expect(j.x + j.w / 2, r.hint).toBeLessThanOrEqual(100)
        expect(j.y, r.hint).toBeGreaterThan(50)
        expect(j.y, r.hint).toBeLessThanOrEqual(95)
        expect(j.sprite, r.hint).toBeGreaterThanOrEqual(0)
        expect(j.sprite, r.hint).toBeLessThan(g.jars.length)
        expect(j.ms, r.hint).toBeGreaterThanOrEqual(1000)
        expect(j.ms, r.hint).toBeLessThanOrEqual(2500)
        if (i > 0) expect(j.x - jars[i - 1]!.x, `${r.hint} ${i}`).toBeGreaterThan((j.w + jars[i - 1]!.w) / 2)
      })
    }
    expect(g.background).toMatch(/elisa\/kruege\/hof\.webp$/)
  })

  it('2 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(2).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/zimmer\.webp$/)
  })

  it('4 harvest: vegetables against the wild vines; ten ripe things', () => {
    const g = stage(4).task.harvest!
    expect(g.fruits).toHaveLength(4)
    expect(g.weeds).toHaveLength(3)
    expect(g.count).toBe(10)
    expect(g.field).toMatch(/elisa\/ernten\/feld\.webp$/)
  })

  it('5 order: four cards, round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(5).task.order!
    expect(g.cards).toHaveLength(4)
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
  })

  it('7 memory: six pairs (a full board of 3 x 4), every one with a sentence that the text of the stage tells', () => {
    const g = stage(7).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
    const text = stage(7).text.join(' ')
    expect(text).toMatch(/Brief/)
    expect(text).toMatch(/Zentner Silber/)
    expect(text).toMatch(/Goldstücke/)
    expect(text).toMatch(/Festkleider/)
    expect(text).toMatch(/Pferden und Wagen/)
  })

  it('8 dip: seven dips, he stays under water for a moment and the water needs longer to calm down; the pictures are named', () => {
    const g = stage(8).task.dive!
    expect(g.dips).toBe(7)
    expect(g.underMs).toBeGreaterThanOrEqual(600)
    expect(g.calmMs).toBeGreaterThan(g.underMs)
    expect(g.calmMs).toBeLessThanOrEqual(3000)
    expect(g.pos.x - g.pos.w / 2).toBeGreaterThanOrEqual(0)
    expect(g.pos.x + g.pos.w / 2).toBeLessThanOrEqual(100)
    expect(g.pos.y).toBeLessThanOrEqual(100)
    expect(g.naaman).toMatch(/tauchen\/naaman\.webp$/)
    expect(g.naamanNew).toMatch(/tauchen\/naaman-neu\.webp$/)
    expect(g.ripple).toMatch(/tauchen\/welle\.webp$/)
    expect(g.background).toMatch(/tauchen\/jordan\.webp$/)
  })

  it('9 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(9).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(9).text.join(' ')
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      const filled = r.parts.map((p, i) => p + (r.answers[i] !== undefined ? r.words[r.answers[i]!] : '')).join('').replace(/[„“]/g, '')
      expect(text.includes(filled.replace(/[!.]$/, '').trim()), filled).toBe(true)
    }
  })
})

describe('Elisa: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = elisa.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1100)
      expect(s.d).toBeCloseTo(336 / 9908, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9908, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(ELISA_PATH).toHaveLength(9)
    for (const seg of ELISA_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(ELISA_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.widthPx).toBe(9908)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(elisa).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/elisa\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(elisa)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(elisa) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Elisha and Naaman')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The widow\u2019s oil'.replace('\u2019', '’'))
    expect(stage(1).task.jars!.rounds[0]!.hint).toContain('Drag the jug')
    expect(stage(8).task.dive!.hint).toContain('calm')
    expect(stage(9).task.verse!.rounds[0]!.parts[0]).toContain('Go in')
    for (const s of elisa.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/elisa/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of elisa.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/elisa/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
