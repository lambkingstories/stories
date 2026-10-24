/**
 * The data of "Jona" (`jona.ts`, `en/jona.en.ts`, `jonaPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Jona/ENTWURF_Jona.md`),
 * the quiz stages are only quizzes, the four new games and the two old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { jona } from '@/data/adventures/jona'
import { JONA_PATH } from '@/data/adventures/jonaPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { needsSack, shellsAtRisk } from '@/utils/jonaGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => jona.stages[n - 1]!
/** Words that no text of the German data may use (Jonah is told without cruelty: no death wish, no blood, no weapons). */
const FORBIDDEN = /\b(Messer|Speer|Schwert|Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|tot|töten|Tod)\b/i
const QUIZ_STAGES = [1, 4, 8]

describe('Jona: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(jona.id).toBe('jona')
    expect(jona.age).toBe('8-10')
    expect(jona.title).toBe('Jona')
    expect(jona.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(jona.stages.map((s) => s.title)).toEqual([
      'Der Auftrag und die Flucht',
      'Der große Sturm',
      'Das Los',
      'Ins Meer',
      'Im Bauch des Fisches',
      'Wieder an Land',
      'Ninive hört zu',
      'Jonas Zorn',
      'Der Rizinus'
    ])
    for (const s of jona.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Jona \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/jona/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two questions per stage, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of jona.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(2)
    for (const q of [...jona.stages.flatMap((s) => s.questions), ...jona.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(jona.exam).toHaveLength(6)
    const asked = jona.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(jona.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor'])
    for (const s of jona.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the beginning, the sea, the fish, the city and the end', () => {
    const q = jona.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Wohin soll Jona gehen/)
    expect(q).toMatch(/Meer/)
    expect(q).toMatch(/Fisches/)
    expect(q).toMatch(/Ninive/)
    expect(jona.exam[5]!.q).toMatch(/zum Schluss/)
  })

  it('the three serious stages (1, 4, 8) say so in the hint and are only quizzes, never two in a row; the end stays open (God asks the last question)', () => {
    for (const n of QUIZ_STAGES) {
      expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
      expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    }
    const kinds = jona.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
    expect(stage(9).text.at(-1)).toMatch(/Ninive nicht leidtun, diese große Stadt\?.*viele Tiere\.“$/)
    // the death wish of Jonah (4,3.8.9) is left out; nothing is shown of the throw into the sea
    expect(stage(8).text.join(' ')).not.toMatch(/lieber/)
    expect(stage(4).text.join(' ')).toMatch(/werfen ihn ins Meer/)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words)', () => {
    expect(stage(1).text.join(' ')).toMatch(/Sohn Amittais/)
    expect(stage(1).text.join(' ')).toMatch(/Japho/)
    expect(stage(3).text.join(' ')).toMatch(/Ich verehre Gott, den Herrn des Himmels, der das Meer und das trockene Land gemacht hat/)
    expect(stage(5).text.join(' ')).toMatch(/Drei Tage und drei Nächte/)
    expect(stage(6).text.join(' ')).toMatch(/zum zweiten Mal/i)
    expect(stage(7).text.join(' ')).toMatch(/Noch vierzig Tage/)
    expect(stage(7).text.join(' ')).toMatch(/Menschen und Tiere sollen Säcke tragen/)
    expect(stage(9).text.join(' ')).toMatch(/hundertzwanzigtausend/)
  })
})

describe('Jona: the games', () => {
  it('the order of the games: 2 old (verse, paint), 4 new, 3 quizzes; no game twice', () => {
    expect(jona.stages.map((s) => s.task.kind)).toEqual(['quiz', 'bord', 'lueckenvers', 'quiz', 'ausmalen', 'strand', 'saecke', 'quiz', 'schatten'])
  })

  it('2 cargo overboard: four pieces, then six, all of known kinds, in the deck strip, sliding slower in round 1', () => {
    const g = stage(2).task.overboard!
    expect(g.rounds.map((r) => r.pieces.length)).toEqual([4, 6])
    const ids = g.kinds.map((k) => k.id)
    for (const r of g.rounds) for (const p of r.pieces) {
      expect(ids, p.kind).toContain(p.kind)
      expect(p.x - p.amp, p.kind).toBeGreaterThan(2)
      expect(p.x + p.amp, p.kind).toBeLessThan(98)
    }
    const avg = (i: number) => g.rounds[i]!.pieces.reduce((s, p) => s + p.periodMs, 0) / g.rounds[i]!.pieces.length
    expect(avg(1)).toBeLessThan(avg(0))
    expect(g.deck.y + g.deck.h).toBeLessThan(100)
  })

  it('3 verse: the filled sentences stand in the text of the stage and the English file keeps the order of the words', () => {
    const g = stage(3).task.verse!
    const text = stage(3).text.join(' ')
    for (const r of g.rounds) {
      const filled = r.parts.reduce((s, p, i) => s + p + (i < r.answers.length ? r.words[r.answers[i]!]! : ''), '')
      expect(text, filled).toContain(filled.replace(/^„/, '').replace(/“, sagt Jona\.$/, ''))
    }
    setAdventureLanguage('en')
    const en = stage(3).task.verse!
    for (const [i, r] of g.rounds.entries()) {
      expect(en.rounds[i]!.words).toHaveLength(r.words.length)
      expect(en.rounds[i]!.parts).toHaveLength(r.parts.length)
    }
  })

  it('5 paint: the fish in the sea (calm, without a pool of jobs)', () => {
    const t = stage(5).task
    expect(t.kind).toBe('ausmalen')
    expect(t.image).toBe('images/abenteuer/jona/etappe-05.webp')
  })

  it('6 shells: five and seven shells on the beach, some in the reach of the wave, the second wave faster and higher', () => {
    const g = stage(6).task.shore!
    expect(g.rounds.map((r) => r.shells.length)).toEqual([5, 7])
    for (const r of g.rounds) {
      expect(shellsAtRisk(r), 'shells in the reach').toBeGreaterThanOrEqual(2)
      for (const s of r.shells) {
        expect(s.kind).toBeLessThan(g.shells.length)
        expect(s.x).toBeGreaterThan(4)
        expect(s.x).toBeLessThan(96)
      }
      expect(r.high).toBeLessThan(r.low)
    }
    expect(g.rounds[1]!.periodMs).toBeLessThan(g.rounds[0]!.periodMs)
    expect(g.rounds[1]!.high).toBeLessThan(g.rounds[0]!.high)
  })

  it('7 sacks: six and seven figures; children, grown-ups and (in round 2) animals; every figure has its picture in the sack', () => {
    const g = stage(7).task.sacks!
    expect(g.rounds.map((r) => r.figures.length)).toEqual([6, 7])
    const who = (i: number, w: string) => g.rounds[i]!.figures.filter((f) => f.who === w).length
    expect([who(0, 'child'), who(0, 'adult'), who(0, 'animal')]).toEqual([3, 3, 0])
    expect([who(1, 'child'), who(1, 'adult'), who(1, 'animal')]).toEqual([2, 3, 2])
    for (const r of g.rounds) {
      expect(new Set(r.figures.map((f) => f.id)).size, 'figures of a round differ').toBe(r.figures.length)
      for (const f of r.figures) {
        expect(f.imageSack).toContain('-sack')
        expect(needsSack(f.who)).toBe(f.who === 'child' ? 'small' : 'big')
      }
    }
  })

  it('9 shade: two rounds, the second faster and with a narrower shade; Jonah sits inside the picture', () => {
    const g = stage(9).task.shade!
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[1]!.sunSeconds).toBeLessThan(g.rounds[0]!.sunSeconds)
    expect(g.rounds[1]!.tolerance).toBeLessThan(g.rounds[0]!.tolerance)
    expect(g.jonahBox.x).toBeGreaterThan(10)
    expect(g.jonahBox.x).toBeLessThan(90)
    // the shade can be kept: the time to sit in the shade is a good part of the way of the sun
    for (const r of g.rounds) expect(r.seconds).toBeLessThan(r.sunSeconds)
  })

  it('the questions do not ask what a game of the stage shows (the sacks, the sentence)', () => {
    expect(stage(7).questions.map((q) => q.q).join(' ')).not.toMatch(/Säcke|Sack/)
    expect(stage(3).questions.map((q) => q.q).join(' ')).not.toMatch(/Hebräer/)
  })
})

describe('Jona: map, files, English', () => {
  it('nine stations from left to right, not too low (the name and the button stay above the tab bar) and the exam at the end; the way has a stretch to every medal', () => {
    const m = jona.map
    expect(m.stages).toHaveLength(9)
    const xs = [...m.stages, m.exam].map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of [...m.stages, m.exam]) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1070)
      expect(s.d).toBeCloseTo(336 / 9908, 4)
    }
    expect(JONA_PATH).toHaveLength(9)
    expect(m.path).toBe(JONA_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.images).toHaveLength(4)
  })

  it('every file of the adventure exists in `public/` (the pictures of the games that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(jona).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f))
    expect(missing).toEqual([])
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the German recording is not read in English', () => {
    const en = englishTextsOf(jona) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Jonah')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The Call and the Escape')
    expect(stage(9).text.at(-1)).toMatch(/Nineveh/)
    expect(stage(2).task.overboard!.rounds[0]!.hint).toContain('Tap')
    // the English recordings are linked (the German ones are checked in German mode)
    for (let n = 1; n <= 9; n++) expect(stage(n).audio, `English recording ${n}`).toBe(`audio/abenteuer/jona/geschichte-${String(n).padStart(2, '0')}-en-v1.mp3`)
    setAdventureLanguage('de')
    for (let n = 1; n <= 9; n++) {
      // stage 9 was recorded again after the Bible check of 24.10.2026 ("-v2")
      expect(stage(n).audio, `German recording ${n}`).toBe(`audio/abenteuer/jona/geschichte-${String(n).padStart(2, '0')}-${n === 9 ? 'v2' : 'v1'}.mp3`)
      expect(existsSync(`public/${stage(n).audio}`), `file ${stage(n).audio}`).toBe(true)
    }
  })
})
