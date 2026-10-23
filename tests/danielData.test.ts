/**
 * The data of "Daniel" (`daniel.ts`, `en/daniel.en.ts`, `danielPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Daniel/ENTWURF_Daniel.md`),
 * the quiz stages are only quizzes, the four new games and the two old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { daniel } from '@/data/adventures/daniel'
import { DANIEL_PATH } from '@/data/adventures/danielPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { isGoodDish, prayerTotal } from '@/utils/danielGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => daniel.stages[n - 1]!
/** Words that no text of the German data may use (Daniel is told without cruelty: no death wish, no blood, no weapons). */
const FORBIDDEN = /\b(Messer|Speer|Schwert|Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|tot|töten|Tod|umbringen|zerrissen)\b/i
const QUIZ_STAGES = [1, 6, 9]

describe('Daniel: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(daniel.id).toBe('daniel')
    expect(daniel.age).toBe('8-10')
    expect(daniel.title).toBe('Daniel')
    expect(daniel.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(daniel.stages.map((s) => s.title)).toEqual([
      'Daniel am Hof des Königs',
      'Gemüse und Wasser',
      'Der Traum des Königs',
      'Das große Standbild',
      'Das goldene Bild',
      'Im Feuerofen',
      'Die Schrift an der Wand',
      'Daniel betet',
      'In der Löwengrube'
    ])
    for (const s of daniel.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Daniel \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/daniel/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two questions per stage, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of daniel.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(2)
    for (const q of [...daniel.stages.flatMap((s) => s.questions), ...daniel.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(daniel.exam).toHaveLength(6)
    const asked = daniel.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(daniel.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen'])
    for (const s of daniel.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the king, the food, the statue, the friends, the fire and the lions', () => {
    const q = daniel.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/König von Babel/)
    expect(q).toMatch(/zehn Tage/)
    expect(q).toMatch(/Standbildes/)
    expect(q).toMatch(/Sadrach/)
    expect(q).toMatch(/Feuer/)
    expect(q).toMatch(/Löwen/)
  })

  it('the three serious stages (1, 6, 9) say so in the hint and are only quizzes, never two in a row', () => {
    for (const n of QUIZ_STAGES) {
      expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
      expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    }
    const kinds = daniel.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); the fourth man and the angel are told, not painted', () => {
    expect(stage(1).text.join(' ')).toMatch(/Beltsazar/)
    expect(stage(2).text.join(' ')).toMatch(/Versuch es zehn Tage/)
    expect(stage(2).text.join(' ')).toMatch(/Gemüse zu essen und Wasser zu trinken/)
    expect(stage(3).text.join(' ')).toMatch(/Gelobt sei der Name Gottes von Ewigkeit zu Ewigkeit! Denn sein ist beides, Weisheit und Stärke/)
    expect(stage(4).text.join(' ')).toMatch(/Kopf war aus feinem Gold/)
    expect(stage(4).text.join(' ')).toMatch(/ohne dass eine Hand ihn berührte/)
    expect(stage(5).text.join(' ')).toMatch(/sechzig Ellen hoch/)
    expect(stage(5).text.join(' ')).toMatch(/Und wenn er es nicht tut, beten wir dein Bild trotzdem nicht an/)
    expect(stage(6).text.join(' ')).toMatch(/siebenmal heißer/)
    expect(stage(6).text.join(' ')).toMatch(/vier Männer/)
    expect(stage(6).text.join(' ')).toMatch(/seinen Engel gesandt/)
    expect(stage(7).text.join(' ')).toMatch(/Mene, mene, tekel, u-parsin/)
    expect(stage(8).text.join(' ')).toMatch(/Dreimal am Tag kniet er nieder/)
    expect(stage(9).text.join(' ')).toMatch(/Mein Gott hat seinen Engel gesandt/)
    expect(stage(9).text.join(' ')).toMatch(/lebendige Gott/)
  })
})

describe('Daniel: the games', () => {
  it('the order of the games: 2 old (verse, hidden picture), 4 new, 3 quizzes; no game twice', () => {
    expect(daniel.stages.map((s) => s.task.kind)).toEqual(['quiz', 'tage', 'lueckenvers', 'standbild', 'wimmelbild', 'quiz', 'lampe', 'zeiten', 'quiz'])
  })

  it('2 ten days: ten days, eight dishes (two of each kind), Daniel eats vegetables and water, the days get shorter, the table lies inside the picture', () => {
    const g = stage(2).task.days!
    expect(g.days).toBe(10)
    expect(g.dishes).toHaveLength(8)
    for (const k of ['veg', 'water', 'meat', 'sweet'] as const) expect(g.dishes.filter((d) => d.kind === k), k).toHaveLength(2)
    expect(g.dishes.filter((d) => isGoodDish(d.kind))).toHaveLength(4)
    expect(g.limits[0]).toBeGreaterThan(g.limits[1])
    expect(g.limits[1]).toBeGreaterThan(g.limits[2])
    expect(g.table.y + g.table.h).toBeLessThan(100)
    expect(new Set(g.dishes.map((d) => d.id)).size).toBe(8)
  })

  it('3 verse: the filled sentences stand in the text of the stage and the English file keeps the order of the words', () => {
    const g = stage(3).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(3).text.join(' ')
    for (const r of g.rounds) {
      const filled = r.parts.reduce((s, p, i) => s + p + (i < r.answers.length ? r.words[r.answers[i]!]! : ''), '')
      expect(text, filled).toContain(filled.replace(/^„/, '').replace(/“$/, '').replace(/ zu Ewigkeit!$/, ' zu Ewigkeit!'))
    }
    setAdventureLanguage('en')
    const en = stage(3).task.verse!
    for (const [i, r] of g.rounds.entries()) {
      expect(en.rounds[i]!.words).toHaveLength(r.words.length)
      expect(en.rounds[i]!.parts).toHaveLength(r.parts.length)
    }
  })

  it('4 statue: five discs from the head to the feet, five places, two rounds with five waiting places each, labels only in round 1; the discs fit together into one slim statue', () => {
    const g = stage(4).task.statue!
    expect(g.pieces.map((p) => p.label)).toEqual(['Gold', 'Silber', 'Erz', 'Eisen', 'Eisen und Ton'])
    expect(g.slots).toHaveLength(5)
    expect(g.rounds.map((r) => r.labels)).toEqual([true, false])
    for (const r of g.rounds) {
      expect(r.homes).toHaveLength(5)
      for (const h of r.homes) {
        expect(h.x).toBeGreaterThan(5)
        expect(h.x).toBeLessThan(95)
      }
      // the discs wait at the sides, never on the statue
      for (const h of r.homes) expect(Math.abs(h.x - 50)).toBeGreaterThan(25)
    }
    for (const p of g.pieces) expect(p.wait).toBeGreaterThan(1)
    // placed: from top to bottom, the middle of the statue
    const ys = g.pieces.map((p) => p.at.y)
    expect(ys).toEqual([...ys].sort((a, b) => a - b))
    for (const p of g.pieces) expect(Math.abs(p.at.x - 50)).toBeLessThan(1)
    // the places lie one above the other, in the same order
    const sy = g.slots.map((s) => s.y)
    expect(sy).toEqual([...sy].sort((a, b) => a - b))
  })

  it('5 hidden picture: three men who stay standing, with covers that are wide enough to hide them half', () => {
    const t = stage(5).task
    expect(t.kind).toBe('wimmelbild')
    expect(t.count).toBe(3)
    const g = t.find!
    expect(g.finds).toHaveLength(3)
    expect(g.labels).toHaveLength(3)
    expect(g.covers.length).toBeGreaterThanOrEqual(6)
    for (const f of g.finds) {
      expect(f.x).toBeGreaterThan(5)
      expect(f.x).toBeLessThan(95)
      expect(f.y).toBeLessThan(98)
    }
    // every man has a cover near him
    for (const f of g.finds) expect(g.covers.some((c) => Math.abs(c.x - f.x) < 8 && Math.abs(c.y - f.y) < 8), `cover near ${f.x}/${f.y}`).toBe(true)
  })

  it('7 lamp: two signs, then two more; the second round has the smaller circle and the flickering flame; all signs lie on the wall', () => {
    const g = stage(7).task.lamp!
    expect(g.rounds.map((r) => r.signs.length)).toEqual([2, 2])
    expect(g.rounds.map((r) => r.flicker)).toEqual([false, true])
    expect(g.rounds[1]!.radius).toBeLessThan(g.rounds[0]!.radius)
    for (const r of g.rounds) for (const s of r.signs) {
      expect(s.x).toBeGreaterThan(12)
      expect(s.x).toBeLessThan(88)
      expect(s.y).toBeGreaterThan(8)
      expect(s.y).toBeLessThan(75)
    }
    // the four signs are four different pictures
    expect(new Set(g.rounds.flatMap((r) => r.signs.map((s) => s.image))).size).toBe(4)
  })

  it('8 hours: one day, then two faster days with a narrower window; nine prayer times; the window of the sky lies inside the picture', () => {
    const g = stage(8).task.hours!
    expect(g.rounds.map((r) => r.days)).toEqual([1, 2])
    expect(g.rounds[1]!.dayMs).toBeLessThan(g.rounds[0]!.dayMs)
    expect(g.rounds[1]!.windowMs).toBeLessThan(g.rounds[0]!.windowMs)
    expect(g.rounds.reduce((s, r) => s + prayerTotal(r), 0)).toBe(9)
    // the window of a time to pray is shorter than the way between two marks
    for (const r of g.rounds) expect(r.windowMs * 2).toBeLessThan(r.dayMs * 0.3)
    expect(g.window.x + g.window.w).toBeLessThanOrEqual(100)
    expect(g.window.y + g.window.h).toBeLessThanOrEqual(100)
  })

  it('the questions do not ask what a game of the stage shows (the metals in the statue game, the prayer times)', () => {
    expect(stage(3).questions.map((q) => q.q).join(' ')).not.toMatch(/Weisheit|Stärke/)
    expect(stage(8).questions.map((q) => q.q).join(' ')).not.toMatch(/Gebetszeit/)
  })
})

describe('Daniel: map, files, English', () => {
  it('nine stations from left to right, not too low (the name and the button stay above the tab bar) and the exam at the end; the way has a stretch to every medal', () => {
    const m = daniel.map
    expect(m.stages).toHaveLength(9)
    const xs = [...m.stages, m.exam].map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of [...m.stages, m.exam]) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1070)
      expect(s.d).toBeCloseTo(336 / 9908, 4)
    }
    expect(DANIEL_PATH).toHaveLength(9)
    expect(m.path).toBe(DANIEL_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.images).toHaveLength(4)
  })

  it('every file of the adventure exists in `public/` (the pictures of the games that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(daniel).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 1.8 MB, everything else under 620 KB) and the size of the pack is about what the data says', () => {
    let bytes = 0
    for (const f of journeyFiles(daniel)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 1_800_000 : 620_000)
      bytes += size
    }
    const mb = bytes / 1_000_000
    expect(daniel.downloadMb!, `downloadMb (measured ${mb.toFixed(1)} MB)`).toBeGreaterThan(mb * 0.75)
    expect(daniel.downloadMb!, `downloadMb (measured ${mb.toFixed(1)} MB)`).toBeLessThan(mb * 1.25)
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the German recording is not read in English', () => {
    const en = englishTextsOf(daniel) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Daniel')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Daniel at the King’s Court')
    expect(stage(9).text.at(-1)).toMatch(/living God/)
    expect(stage(2).task.hint).toContain('vegetables')
    expect(stage(8).task.hours!.rounds[0]!.hint).toContain('golden mark')
    // the English recordings are linked (the German ones are checked in German mode)
    for (let n = 1; n <= 9; n++) expect(stage(n).audio, `English recording ${n}`).toBe(`audio/abenteuer/daniel/geschichte-${String(n).padStart(2, '0')}-en-v1.mp3`)
    setAdventureLanguage('de')
    for (let n = 1; n <= 9; n++) {
      expect(stage(n).audio, `German recording ${n}`).toBe(`audio/abenteuer/daniel/geschichte-${String(n).padStart(2, '0')}-v1.mp3`)
      expect(existsSync(`public/${stage(n).audio}`), `file ${stage(n).audio}`).toBe(true)
    }
  })
})
