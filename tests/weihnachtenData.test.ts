/**
 * The data of "Christmas" (`weihnachten.ts`, `en/weihnachten.en.ts`, `weihnachtenPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Weihnachten/ENTWURF_Weihnachten.md`, Luther 1912 told in our own words),
 * the two quiz stages are only quizzes, the two new games and the five old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { weihnachten } from '@/data/adventures/weihnachten'
import { WEIHNACHTEN_PATH } from '@/data/adventures/weihnachtenPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { roundIsValid } from '@/utils/weihnachtenGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => weihnachten.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [2, 9]

describe('Weihnachten: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(weihnachten.id).toBe('weihnachten')
    expect(weihnachten.age).toBe('8-10')
    expect(weihnachten.title).toBe('Weihnachten')
    expect(weihnachten.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(weihnachten.stages.map((s) => s.title)).toEqual([
      'Der Engel kommt zu Maria',
      'Maria besucht Elisabeth',
      'Josefs Traum',
      'Auf nach Bethlehem',
      'Kein Raum in der Herberge',
      'Die Hirten und der Engel',
      'Die Hirten bei der Krippe',
      'Die Weisen und der Stern',
      'Nach Ägypten und wieder heim'
    ])
    for (const s of weihnachten.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Lukas|Matthäus) \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/weihnachten/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of weihnachten.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...weihnachten.stages.flatMap((s) => s.questions), ...weihnachten.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(weihnachten.exam).toHaveLength(6)
    const asked = weihnachten.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(weihnachten.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'werden', 'ihrer'])
    for (const s of weihnachten.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the angel, Elisabeth, Bethlehem, the manger, the angels and the gifts', () => {
    const q = weihnachten.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Engel, der zu Maria/)
    expect(q).toMatch(/Elisabeth/)
    expect(q).toMatch(/Zählung/)
    expect(q).toMatch(/legt Maria das Kind/)
    expect(q).toMatch(/Gott loben/)
    expect(q).toMatch(/Weisen/)
  })

  it('the two quiz stages (2, 9) are only quizzes, never two in a row; stage 9 says that it is serious', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(9).task.hint).toContain('ernst')
    const kinds = weihnachten.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what is not in the Bible stays out', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Gabriel/)
    expect(t(1)).toMatch(/Ich habe doch keinen Mann/)
    expect(t(1)).toMatch(/Bei Gott ist nichts unmöglich/)
    expect(t(1)).toMatch(/Siehe, ich bin des Herrn Magd/)
    expect(t(2)).toMatch(/Priesters Zacharias/)
    expect(t(2)).toMatch(/Heiligen Geist erfüllt/)
    expect(t(2)).toMatch(/Drei Monate/)
    expect(t(3)).toMatch(/Josef, du Sohn Davids/)
    expect(t(3)).toMatch(/von ihren Sünden/)
    expect(t(3)).not.toMatch(/geboren wird/)
    expect(t(4)).toMatch(/Kaiser Augustus/)
    expect(t(4)).toMatch(/Stadt Davids/)
    expect(t(5)).toMatch(/in Windeln und legt ihn in eine Krippe/)
    expect(t(5)).toMatch(/keinen Raum in der Herberge/)
    expect(t(6)).toMatch(/Fürchtet euch nicht/)
    expect(t(6)).toMatch(/Ehre sei Gott in der Höhe/)
    expect(t(7)).toMatch(/Kommt, wir gehen nach Bethlehem/)
    expect(t(7)).toMatch(/behält alle diese Worte/)
    expect(t(8)).toMatch(/Gold, Weihrauch und Myrrhe/)
    expect(t(8)).toMatch(/Herodes erschrickt/)
    expect(t(8)).toMatch(/Gott sagt ihnen im Traum/)
    expect(t(9)).toMatch(/flieh nach Ägypten/)
    expect(t(9)).toMatch(/Da sagt Gott ihm im Traum/)
    const all = weihnachten.stages.map((s) => s.text.join(' ')).join(' ')
    // not told: the killing of the children, an ox or a donkey or a stable, a number of wise men, the Christmas carol
    expect(all).not.toMatch(/Ochs|Esel|Stall|drei Weisen|drei Könige|Heilige Drei|Stille Nacht|Kindermord|umbringen|töten/)
  })
})

describe('Weihnachten: the games', () => {
  it('the order of the games: 5 old, 2 new (manger, sign), 2 quizzes; no game twice', () => {
    expect(weihnachten.stages.map((s) => s.task.kind)).toEqual(['lueckenvers', 'quiz', 'reihenfolge', 'wimmelbild', 'krippe', 'memory', 'zeichen', 'puzzle', 'quiz'])
    const games = weihnachten.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['krippe', 'zeichen'].includes(k))).toHaveLength(2)
  })

  it('1 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(1).task.verse!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('Magd')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['nichts', 'unmöglich'])
  })

  it('3 order: four cards in the order of the story; round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(3).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['denkt', 'traum', 'erwacht', 'nimmt'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['denkt', 'traum', 'erwacht', 'nimmt'])
  })

  it('4 hidden pictures: Joseph, Mary and three travelers, covers, every place inside the picture', () => {
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
    expect(f.labels).toContain('Josef')
    expect(f.labels).toContain('Maria')
  })

  it('5 manger: two rounds (the cloth, the bed); the right ones are swaddling cloths and a manger among three; everything inside the picture', () => {
    const g = stage(5).task.crib!
    expect(g.rounds.map((r) => r.right)).toEqual(['windeln', 'krippe'])
    for (const r of g.rounds) {
      expect(r.options).toHaveLength(3)
      expect(r.options).toContain(r.right)
      expect(new Set(r.options).size).toBe(3)
      for (const id of r.options) expect(g.items.find((i) => i.id === id), id).toBeTruthy()
    }
    for (const at of [g.parentsAt, g.babyAt, g.mangerAt]) {
      expect(at.x).toBeGreaterThan(5)
      expect(at.x).toBeLessThan(95)
      expect(at.y).toBeGreaterThan(30)
      expect(at.y).toBeLessThan(75)
    }
    expect(g.background).toMatch(/weihnachten\/krippe\/stall\.webp$/)
    expect(g.baby).toMatch(/weihnachten\/krippe\/kind\.webp$/)
    const text = stage(5).text.join(' ')
    for (const w of ['Windeln', 'Krippe']) expect(text, w).toContain(w)
  })

  it('6 memory: six pairs (a full board of 3 x 4), every one with a sentence that the text of the shepherds tells', () => {
    const g = stage(6).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
    const text = stage(6).text.join(' ')
    for (const w of ['Hirten', 'Herde', 'Windeln', 'Krippe', 'Hürden']) expect(text, w).toContain(w)
  })

  it('7 sign: three rounds, six places in six slots, the shelter with the manger is the right place and stands in another slot each round; round and slots inside the picture', () => {
    const g = stage(7).task.sign!
    expect(g.places).toHaveLength(6)
    expect(g.slots).toHaveLength(6)
    const ids = g.places.map((p) => p.id)
    expect(g.rounds).toHaveLength(3)
    for (const r of g.rounds) {
      expect(r.right).toBe('stall')
      expect(roundIsValid(r.order, r.right, ids)).toBe(true)
    }
    const spots = g.rounds.map((r) => r.order.indexOf('stall'))
    expect(new Set(spots).size).toBe(3)
    for (const s of g.slots) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(0)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(100)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(g.background).toMatch(/weihnachten\/zeichen\/strasse\.webp$/)
    expect(g.walker).toMatch(/weihnachten\/zeichen\/hirten\.webp$/)
    expect(stage(7).text.join(' ')).toContain('Krippe')
  })

  it('8 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(8).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/stern\.webp$/)
  })
})

describe('Weihnachten: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = weihnachten.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(WEIHNACHTEN_PATH).toHaveLength(9)
    for (const seg of WEIHNACHTEN_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(WEIHNACHTEN_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.widthPx).toBe(9920)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(weihnachten).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/weihnachten\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(weihnachten)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(weihnachten) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Christmas')
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
    expect(stage(1).title).toBe('The angel comes to Mary')
    expect(stage(5).task.crib!.items[0]!.label).toBe('Swaddling cloths')
    expect(stage(7).task.sign!.places[5]!.label).toBe('The shelter with the manger')
    expect(stage(7).task.sign!.rounds[0]!.hint).toContain('swaddling cloths')
    expect(stage(1).task.verse!.rounds[1]!.parts[0]).toContain('With God')
    for (const s of weihnachten.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/weihnachten/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of weihnachten.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/weihnachten/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
