/**
 * The data of "Solomon" (`salomo.ts`, `en/salomo.en.ts`, `salomoPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Salomo/ENTWURF_Salomo.md`, Luther 1912),
 * the quiz stages are only quizzes, the two new games and the eight old ones have sound data, the map has twelve stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { salomo } from '@/data/adventures/salomo'
import { SALOMO_PATH } from '@/data/adventures/salomoPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { dist } from '@/utils/salomoGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => salomo.stages[n - 1]!
/** Words that no text of the German data may use (Solomon is told without cruelty). The judgment (stage 3) says "Schwert" and "tötet", and nothing else of it. */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Hure|Huren)\b/i
const FORBIDDEN_EXCEPT_3 = /\b(Schwert|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [3, 10]

describe('Salomo: stories and questions', () => {
  it('twelve stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(salomo.id).toBe('salomo')
    expect(salomo.age).toBe('8-10')
    expect(salomo.title).toBe('Salomo')
    expect(salomo.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(salomo.stages.map((s) => s.title)).toEqual([
      'Auf dem Weg nach Gibeon',
      'Ein gehorsames Herz',
      'Das Urteil des Königs',
      'Sicher unter dem Feigenbaum',
      'Zedern aus dem Libanon',
      'Steine ohne Lärm',
      'Zedern, Gold und Cherubim',
      'Zwei Säulen aus Erz',
      'Die Lade zieht ein',
      'Salomos Gebet',
      'Die Königin von Saba',
      'Der Thron aus Elfenbein'
    ])
    for (const s of salomo.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^1\. Könige \d/)
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
      if (s.id !== 3) expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN_EXCEPT_3)
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/salomo/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of salomo.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...salomo.stages.flatMap((s) => s.questions), ...salomo.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(salomo.exam).toHaveLength(6)
    const asked = salomo.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(salomo.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den'])
    for (const s of salomo.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the wish, the judgment, the cedars, the pillars, the ark and the lions', () => {
    const q = salomo.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Salomo Gott/)
    expect(q).toMatch(/Kind/)
    expect(q).toMatch(/Zedern/)
    expect(q).toMatch(/Säulen/)
    expect(q).toMatch(/Lade des Bundes/)
    expect(q).toMatch(/Löwen/)
  })

  it('the two quiz stages (3, 10) are only quizzes, never two in a row; stage 3 says it is serious', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(3).task.hint).toContain('ernst')
    const kinds = salomo.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what was left out stays out', () => {
    expect(stage(1).text.join(' ')).toMatch(/Bitte, was ich dir geben soll/)
    expect(stage(2).text.join(' ')).toMatch(/gehorsames Herz/)
    expect(stage(3).text.join(' ')).toMatch(/Teilt das lebende Kind in zwei Teile/)
    expect(stage(3).text.join(' ')).toMatch(/Sie ist seine Mutter/)
    expect(stage(4).text.join(' ')).toMatch(/Weinstock und seinem Feigenbaum/)
    expect(stage(5).text.join(' ')).toMatch(/Gelobt sei der Herr/)
    expect(stage(6).text.join(' ')).toMatch(/keinen Hammer/)
    expect(stage(7).text.join(' ')).toMatch(/zwei Cherubim/)
    expect(stage(8).text.join(' ')).toMatch(/Jachin/)
    expect(stage(8).text.join(' ')).toMatch(/Boas/)
    expect(stage(9).text.join(' ')).toMatch(/zwei steinernen Tafeln/)
    expect(stage(10).text.join(' ')).toMatch(/Himmel und aller Himmel Himmel/)
    expect(stage(11).text.join(' ')).toMatch(/nicht einmal die Hälfte/)
    expect(stage(12).text.join(' ')).toMatch(/zwölf in allen/)
    // not told: Solomon's wives, the high places, the fall of chapter 11, the punishments of God
    const all = salomo.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Pharao|Götzen|andere Götter|Abfall|verwerfen|ausrotten|Weiber|Frauen Salomos/)
  })
})

describe('Salomo: the games', () => {
  it('the order of the games: 8 old, 2 new (quiet, throne), 2 quizzes; no game twice', () => {
    expect(salomo.stages.map((s) => s.task.kind)).toEqual(['weg', 'lueckenvers', 'quiz', 'ernten', 'reihenfolge', 'leise', 'memory', 'worte', 'puzzle', 'quiz', 'sortieren', 'thron'])
    const games = salomo.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['leise', 'thron'].includes(k))).toHaveLength(2)
  })

  it('1 way: five forks (the fifth with three ways), the right way leaves on the side of the tracks, the walker and every picture are named', () => {
    const g = stage(1).task.way!
    expect(g.scenes).toHaveLength(5)
    expect(g.scenes.map((x) => x.goal)).toEqual(['right', 'left', 'left', 'right', 'middle'])
    expect(g.scenes.map((x) => x.paths ?? 2)).toEqual([2, 2, 2, 2, 3])
    expect(g.walker).toMatch(/weg\/zug\.webp$/)
    g.scenes.forEach((x, i) => expect(x.image.endsWith(`weg/weg-${i + 1}.webp`), x.image).toBe(true))
  })

  it('2 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(2).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(2).text.join(' ')
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      const filled = r.parts.map((p, i) => p + (r.answers[i] !== undefined ? r.words[r.answers[i]!] : '')).join('').replace(/[„“]/g, '')
      expect(text.includes(filled.replace(/\.$/, '').trim()), filled).toBe(true)
    }
  })

  it('4 harvest: figs, grapes, pomegranates and dates against thorns and stones; ten ripe things', () => {
    const g = stage(4).task.harvest!
    expect(g.fruits).toHaveLength(4)
    expect(g.weeds).toHaveLength(4)
    expect(g.count).toBe(10)
    expect(g.field).toMatch(/salomo\/ernten\/feld\.webp$/)
  })

  it('5 order: four cards, round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(5).task.order!
    expect(g.cards).toHaveLength(4)
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
  })

  it('6 quiet: three rounds with 1, 2 and 3 stones, every stone has its own waiting place, every gap lies inside the picture, the limits get stricter and the gaps are wide enough for the stone', () => {
    const g = stage(6).task.quiet!
    expect(g.rounds.map((r) => r.gaps.length)).toEqual([1, 2, 3])
    expect(g.stones).toHaveLength(3)
    let last = Infinity
    for (const r of g.rounds) {
      expect(r.starts).toHaveLength(r.gaps.length)
      expect(r.max, r.hint).toBeLessThan(last)
      expect(r.max, r.hint).toBeGreaterThanOrEqual(30)
      last = r.max
      for (const gap of r.gaps) {
        expect(gap.x - gap.w / 2).toBeGreaterThanOrEqual(0)
        expect(gap.x + gap.w / 2).toBeLessThanOrEqual(100)
        expect(gap.y).toBeGreaterThan(5)
        expect(gap.y).toBeLessThanOrEqual(100)
        expect(gap.w).toBeGreaterThanOrEqual(g.stoneW * 0.8)
      }
      for (let i = 0; i < r.gaps.length; i++) for (let j = i + 1; j < r.gaps.length; j++) expect(dist(r.gaps[i]!, r.gaps[j]!), `${i}-${j}`).toBeGreaterThan(r.gaps[i]!.w * 0.9)
      for (const s of r.starts) {
        expect(s.x).toBeGreaterThan(g.stoneW / 2 - 1)
        expect(s.x).toBeLessThan(100 - g.stoneW / 2 + 1)
        // a stone does not wait in a gap
        for (const gap of r.gaps) expect(dist(s, gap), r.hint).toBeGreaterThan(gap.w * 0.7)
      }
    }
    // the slowest pull the child needs for the longest way still stays under the limit: 1.5 seconds for the way across 60 percent = 40 percent per second
    expect(g.rounds[2]!.max).toBeGreaterThanOrEqual(36)
  })

  it('7 memory: six pairs (a full board of 3 x 4), every one with a sentence', () => {
    const g = stage(7).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
  })

  it('8 words: the sentences stand in the text of the stage', () => {
    const w = stage(8).task.words!
    const text = stage(8).text.join(' ')
    for (const r of w.rounds) for (const s of r.sentences) expect(text.includes(s), s).toBe(true)
  })

  it('9 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(9).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/lade\.webp$/)
  })

  it('11 sorting: three chests (green, golden, blue), two rounds', () => {
    const g = stage(11).task.sort!
    expect(g.bins.map((b) => b.id)).toEqual(['gruen', 'gold', 'blau'])
    expect(g.rounds!.map((r) => r.perBin)).toEqual([1, 2])
  })

  it('12 throne: twelve lions on six steps (one on the left and one on the right of each) and two at the armrests, counted in three rounds; the lions that wait fit the slots', () => {
    const g = stage(12).task.throne!
    expect(g.rounds.map((r) => r.slots.length)).toEqual([6, 6, 2])
    const all = g.rounds.flatMap((r) => r.slots)
    expect(all.filter((s) => s.side === 'left')).toHaveLength(6)
    expect(all.filter((s) => s.side === 'right')).toHaveLength(6)
    expect(all.filter((s) => s.side === 'arm-left' || s.side === 'arm-right')).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.lions).toHaveLength(r.slots.length)
      // for every slot a lion that looks the right way: as many looking right as there are left slots
      const left = r.slots.filter((s) => s.side === 'left' || s.side === 'arm-left').length
      expect(r.lions.filter((f) => f === 'right')).toHaveLength(left)
      expect(r.lions.filter((f) => f === 'left')).toHaveLength(r.slots.length - left)
      for (const s of r.slots) {
        expect(s.x - s.w / 2).toBeGreaterThanOrEqual(0)
        expect(s.x + s.w / 2).toBeLessThanOrEqual(100)
        expect(s.y).toBeLessThanOrEqual(100)
        expect(s.w).toBeGreaterThanOrEqual(7)
      }
    }
    // the slots do not lie on top of each other
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(dist(all[i]!, all[j]!), `${i}-${j}`).toBeGreaterThan(3.5)
  })

  it('the questions do not ask what a game of the stage shows (not how many lions are on the steps in stage 12 only after the game)', () => {
    expect(stage(1).questions.map((q) => q.q).join(' ')).not.toMatch(/Wie viele Tiere/)
  })
})

describe('Salomo: map, files, English', () => {
  it('twelve stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = salomo.map
    expect(m.stages).toHaveLength(12)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1070)
      expect(s.d).toBeCloseTo(336 / 12942, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 12942, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(SALOMO_PATH).toHaveLength(12)
    for (const seg of SALOMO_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(SALOMO_PATH)
    expect(m.aspect).toBeCloseTo(12942 / 1648, 6)
    expect(m.widthPx).toBe(12942)
    expect(m.images).toHaveLength(4)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(salomo).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/salomo\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(salomo)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(salomo) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Solomon')
    expect(en.stages).toHaveLength(12)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('On the way to Gibeon')
    expect(stage(6).task.quiet!.rounds[0]!.hint).toContain('very slowly')
    expect(stage(12).task.throne!.rounds[2]!.hint).toContain('armrests')
    expect(stage(8).task.words!.rounds[0]!.sentences[0]).toBe('Solomon builds on God’s house for seven years.')
    for (const s of salomo.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/salomo/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of salomo.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/salomo/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
