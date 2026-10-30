/**
 * The data of "Nehemiah" (`nehemia.ts`, `en/nehemia.en.ts`, `nehemiaPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Nehemia/ENTWURF_Nehemia.md`, Luther 1912 told in our own words),
 * the two quiz stages are only quizzes, the two new games and the five old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { nehemia } from '@/data/adventures/nehemia'
import { NEHEMIA_PATH } from '@/data/adventures/nehemiaPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => nehemia.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [5, 8]

describe('Nehemia: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(nehemia.id).toBe('nehemia')
    expect(nehemia.age).toBe('8-10')
    expect(nehemia.title).toBe('Nehemia')
    expect(nehemia.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(nehemia.stages.map((s) => s.title)).toEqual([
      'Die Nachricht aus Jerusalem',
      'Der traurige Mundschenk',
      'Bei Nacht um die Stadt',
      'Jeder baut sein Stück',
      'Spott und Wache',
      'Die Posaune ruft',
      'Die Schulden werden erlassen',
      'Die Mauer ist fertig',
      'Die Freude am Herrn'
    ])
    for (const s of nehemia.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Nehemia \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/nehemia/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of nehemia.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...nehemia.stages.flatMap((s) => s.questions), ...nehemia.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(nehemia.exam).toHaveLength(6)
    const asked = nehemia.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(nehemia.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie'])
    for (const s of nehemia.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the cupbearer, the news, the three days, the daughters, the trumpet and the joy', () => {
    const q = nehemia.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Artaxerxes/)
    expect(q).toMatch(/Hanani/)
    expect(q).toMatch(/wartet/)
    expect(q).toMatch(/Töchtern/)
    expect(q).toMatch(/Posaune/)
    expect(q).toMatch(/Stärke/)
  })

  it('the two quiz stages (5, 8) are only quizzes, never two in a row, and say that they are serious', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(5).task.hint).toContain('ernst')
    expect(stage(8).task.hint).toContain('ernst')
    const kinds = nehemia.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what was left out stays out', () => {
    expect(stage(1).text.join(' ')).toMatch(/Mundschenk/)
    expect(stage(1).text.join(' ')).toMatch(/Mauern von Jerusalem sind zerbrochen, und die Tore sind verbrannt/)
    expect(stage(2).text.join(' ')).toMatch(/Briefe für die Statthalter/)
    expect(stage(2).text.join(' ')).toMatch(/Reiter/)
    expect(stage(3).text.join(' ')).toMatch(/Taltor.*Schlangenquelle.*Misttor.*Quelltor.*Königsteich/)
    expect(stage(3).text.join(' ')).toMatch(/lasst uns die Mauer bauen/)
    expect(stage(4).text.join(' ')).toMatch(/Schaftor/)
    expect(stage(4).text.join(' ')).toMatch(/Goldschmied/)
    expect(stage(4).text.join(' ')).toMatch(/Salbenmischer/)
    expect(stage(4).text.join(' ')).toMatch(/mit seinen Töchtern/)
    expect(stage(5).text.join(' ')).toMatch(/Fuchs/)
    expect(stage(5).text.join(' ')).toMatch(/halb hoch/)
    expect(stage(6).text.join(' ')).toMatch(/Wo ihr die Posaune hört/)
    expect(stage(6).text.join(' ')).toMatch(/Unser Gott wird für uns streiten/)
    expect(stage(7).text.join(' ')).toMatch(/Äcker, Weinberge, Ölgärten und Häuser/)
    expect(stage(8).text.join(' ')).toMatch(/Ebene von Ono/)
    expect(stage(8).text.join(' ')).toMatch(/zweiundfünfzig Tagen/)
    expect(stage(9).text.join(' ')).toMatch(/die Freude am Herrn ist eure Stärke/)
    expect(stage(9).text.join(' ')).toMatch(/Laubhütten/)
    // not told: the register of names (chapter 7), the plans to kill, the prayers of revenge
    const all = nehemia.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/erwürgen|umbringen|Kehre ihren Hohn|Namensverzeichnis|Geschlechtsregister/)
  })
})

describe('Nehemia: the games', () => {
  it('the order of the games: 5 old, 2 new (ride, trumpet), 2 quizzes; no game twice', () => {
    expect(nehemia.stages.map((s) => s.task.kind)).toEqual(['puzzle', 'memory', 'ritt', 'wimmelbild', 'quiz', 'posaune', 'reihenfolge', 'quiz', 'lueckenvers'])
    const games = nehemia.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['ritt', 'posaune'].includes(k))).toHaveLength(2)
  })

  it('1 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(1).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/mauer\.webp$/)
  })

  it('2 memory: six pairs (a full board of 3 x 4), every one with a sentence that the text of the stage tells', () => {
    const g = stage(2).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
    const text = stage(2).text.join(' ')
    for (const w of ['Becher', 'Wein', 'Briefe', 'Holz', 'Reiter', 'Tore']) expect(text, w).toContain(w)
  })

  it('3 ride: five different places that are named in the text in this order; every place lies inside the picture and the places are far apart; round 1 with the list, round 2 without', () => {
    const g = stage(3).task.ride!
    expect(g.spots.map((s) => s.id)).toEqual(['taltor', 'quelle', 'mist', 'quelltor', 'teich'])
    expect(g.spots.map((s) => s.label)).toEqual(['Taltor', 'Schlangenquelle', 'Misttor', 'Quelltor', 'Königsteich'])
    const text = stage(3).text.join(' ')
    let last = -1
    for (const s of g.spots) {
      const at = text.indexOf(s.label)
      expect(at, s.label).toBeGreaterThan(last)
      last = at
    }
    for (const s of g.spots) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(0)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(100)
      expect(s.y).toBeGreaterThan(5)
      expect(s.y).toBeLessThan(97)
    }
    for (let i = 0; i < g.spots.length; i++) {
      for (let k = i + 1; k < g.spots.length; k++) expect(Math.hypot(g.spots[i]!.x - g.spots[k]!.x, (g.spots[i]!.y - g.spots[k]!.y) * 0.75), `${i} and ${k}`).toBeGreaterThan(14)
    }
    expect(g.rounds.map((r) => r.showList)).toEqual([true, false])
    for (const r of g.rounds) expect(r.order).toEqual(g.spots.map((s) => s.id))
    expect(g.background).toMatch(/nehemia\/ritt\/karte\.webp$/)
    expect(g.rider).toMatch(/nehemia\/ritt\/esel\.webp$/)
  })

  it('4 hidden pictures: five builders, covers, every place inside the picture', () => {
    const t = stage(4).task
    expect(t.kind).toBe('wimmelbild')
    expect(t.count).toBe(5)
    const f = t.find!
    expect(f.finds).toHaveLength(5)
    expect(f.covers.length).toBeGreaterThanOrEqual(6)
    for (const s of [...f.finds, ...f.covers]) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(101)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(f.labels).toHaveLength(5)
  })

  it('6 trumpet: three rounds with 4, 5 and 6 builders; the trumpeter in the middle, at the left and at the right end; everything inside the picture', () => {
    const g = stage(6).task.post!
    expect(g.rounds.map((r) => r.workers.length)).toEqual([4, 5, 6])
    expect(g.rounds[0]!.horn.x).toBeGreaterThan(35)
    expect(g.rounds[0]!.horn.x).toBeLessThan(65)
    expect(g.rounds[1]!.horn.x).toBeLessThan(25)
    expect(g.rounds[2]!.horn.x).toBeGreaterThan(75)
    for (const r of g.rounds) {
      for (const w of r.workers) {
        expect(w.x).toBeGreaterThan(2)
        expect(w.x).toBeLessThan(98)
        expect(w.y).toBeGreaterThan(30)
        expect(w.y).toBeLessThanOrEqual(95)
      }
    }
    expect(g.workers).toHaveLength(6)
    expect(g.background).toMatch(/nehemia\/posaune\/mauer\.webp$/)
  })

  it('7 order: four cards, round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(7).task.order!
    expect(g.cards).toHaveLength(4)
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
  })

  it('9 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(9).task.verse!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('heilig')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['Freude', 'Stärke'])
    expect(stage(9).text.join(' ')).toMatch(/Dieser Tag ist heilig/)
  })
})

describe('Nehemia: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = nehemia.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9908, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9908, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(NEHEMIA_PATH).toHaveLength(9)
    for (const seg of NEHEMIA_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(NEHEMIA_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.widthPx).toBe(9908)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(nehemia).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/nehemia\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(nehemia)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(nehemia) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Nehemiah')
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
    expect(stage(1).title).toBe('The news from Jerusalem')
    expect(stage(3).task.ride!.spots[0]!.label).toBe('Valley Gate')
    expect(stage(6).task.post!.rounds[0]!.hint).toContain('trumpet')
    expect(stage(9).task.verse!.rounds[1]!.parts[0]).toContain('The')
    for (const s of nehemia.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/nehemia/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of nehemia.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/nehemia/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
