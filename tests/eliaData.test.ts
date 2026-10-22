/**
 * The data of "Elia" (`elia.ts`, `en/elia.en.ts`, `eliaPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Elia/ENTWURF_Elia.md`, Luther 1912),
 * the quiz stages are only quizzes, the four new games and the two old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { elia } from '@/data/adventures/elia'
import { ELIA_PATH } from '@/data/adventures/eliaPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { foodCount } from '@/utils/eliaGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => elia.stages[n - 1]!
/** Words that no text of the German data may use (Elia is told without cruelty: no blood, no weapons, no killing). */
const FORBIDDEN = /\b(Messer|Speer|Schwert|Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|tot|töten|Tod|umbringen|zerrissen|schlachten|geschlachtet)\b/i
const QUIZ_STAGES = [3, 6, 9]

describe('Elia: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(elia.id).toBe('elia')
    expect(elia.age).toBe('8-10')
    expect(elia.title).toBe('Elia')
    expect(elia.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(elia.stages.map((s) => s.title)).toEqual([
      'Kein Regen, und die Raben',
      'Die Witwe von Zarpat',
      'Der Sohn der Witwe',
      'Elia und Obadja',
      'Auf dem Karmel',
      'Das Feuer fällt',
      'Der Regen kommt',
      'Das stille Sausen',
      'Elisa und der feurige Wagen'
    ])
    for (const s of elia.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^[12]\. Könige \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/elia/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two questions per stage, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of elia.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(2)
    for (const q of [...elia.stages.flatMap((s) => s.questions), ...elia.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(elia.exam).toHaveLength(6)
    const asked = elia.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(elia.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird'])
    for (const s of elia.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the ravens, the widow, the caves, the altar, the cloud and the still small sound', () => {
    const q = elia.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Raben|Brot und Fleisch/)
    expect(q).toMatch(/Witwe/)
    expect(q).toMatch(/Obadja/)
    expect(q).toMatch(/Altar/)
    expect(q).toMatch(/Diener/)
    expect(q).toMatch(/Horeb/)
  })

  it('the three serious stages (3, 6, 9) are only quizzes, never two in a row; 3 and 6 say that they are serious in the hint', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    for (const n of [3, 6]) expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
    const kinds = elia.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); the angel and God are told, never painted; what was left out stays out', () => {
    expect(stage(1).text.join(' ')).toMatch(/weder Tau noch Regen/)
    expect(stage(1).text.join(' ')).toMatch(/den Raben geboten/)
    expect(stage(2).text.join(' ')).toMatch(/Handvoll Mehl im Topf und ein wenig Öl im Krug/)
    expect(stage(3).text.join(' ')).toMatch(/Dreimal beugt er sich über das Kind/)
    expect(stage(4).text.join(' ')).toMatch(/schon im dritten Jahr/)
    expect(stage(4).text.join(' ')).toMatch(/fünfzig in einer Höhle und fünfzig in einer anderen/)
    expect(stage(4).text.join(' ')).toMatch(/Der König ruft seinen Hofmeister Obadja/)
    expect(stage(5).text.join(' ')).toMatch(/Wie lange hinkt ihr auf beiden Seiten/)
    expect(stage(5).text.join(' ')).toMatch(/Auf Elias Wort lässt Ahab/)
    expect(stage(5).text.join(' ')).toMatch(/vierhundertfünfzig Propheten des Baal/)
    expect(stage(6).text.join(' ')).toMatch(/aus zwölf Steinen/)
    expect(stage(6).text.join(' ')).toMatch(/Da fällt Feuer vom Himmel/)
    expect(stage(7).text.join(' ')).toMatch(/nicht größer als eine Männerhand/)
    expect(stage(7).text.join(' ')).toMatch(/denn es rauscht, als wollte es sehr regnen/)
    expect(stage(8).text.join(' ')).toMatch(/stilles, sanftes Sausen/)
    expect(stage(8).text.join(' ')).toMatch(/vierzig Tage und Nächte/)
    expect(stage(9).text.join(' ')).toMatch(/feuriger Wagen mit feurigen Pferden/)
    expect(stage(9).text.join(' ')).toMatch(/Später gehen die beiden zum Jordan/)
    // not told: the killing of the prophets of Baal, the cuts with knives, the wish to die
    const all = elia.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Kison|ritzten|sterben möchte|Aschera/)
  })
})

describe('Elia: the games', () => {
  it('the order of the games: 2 old (pouring, verse), 4 new, 3 quizzes; no game twice', () => {
    expect(elia.stages.map((s) => s.task.kind)).toEqual(['raben', 'giessen', 'quiz', 'hoehlen', 'lueckenvers', 'quiz', 'regen', 'sausen', 'quiz'])
  })

  it('1 ravens: two rounds (morning, evening), the second has more ravens, every round has food and something that is not food; every raven enters before its round could be over', () => {
    const g = stage(1).task.ravens!
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[1]!.flights.length).toBeGreaterThan(g.rounds[0]!.flights.length)
    for (const r of g.rounds) {
      expect(foodCount(r.flights)).toBeGreaterThanOrEqual(3)
      expect(r.flights.some((f) => f.kind === 'twig' || f.kind === 'empty')).toBe(true)
      for (const f of r.flights) {
        expect(f.y).toBeGreaterThan(8)
        expect(f.y).toBeLessThan(45)
        expect(f.dur).toBeGreaterThan(6000)
      }
      const ats = r.flights.map((f) => f.at)
      expect(ats).toEqual([...ats].sort((a, b) => a - b))
    }
    // the evening is a little faster than the morning
    expect(g.rounds[1]!.flights[0]!.dur).toBeLessThan(g.rounds[0]!.flights[0]!.dur)
    expect(Object.keys(g.ravens).sort()).toEqual(['bread', 'empty', 'meat', 'twig'])
    // the food of the longest round lies on the rock, inside the picture
    const most = Math.max(...g.rounds.map((r) => foodCount(r.flights)))
    expect(g.rock.x + g.rock.step * (most - 1)).toBeLessThan(97)
  })

  it('2 pouring: five bowls in two rounds (three with one jug, two deep ones with two), the jar and the bowls lie inside the picture; the hint says that the jar does not run empty', () => {
    const g = stage(2).task.water!
    expect(g.rounds.map((r) => r.plants.length)).toEqual([3, 2])
    expect(g.plants.map((p) => p.need)).toEqual([1, 1, 1, 2, 2])
    expect(g.river.x + g.river.w).toBeLessThanOrEqual(100)
    expect(g.river.y + g.river.h).toBeLessThanOrEqual(100)
    for (const p of g.plants) {
      expect(p.x).toBeGreaterThan(30)
      expect(p.x).toBeLessThan(95)
      expect(p.y).toBeLessThan(95)
    }
    expect(g.rounds[0]!.hint).toMatch(/nicht leer/)
    expect(stage(2).task.hint).toMatch(/nicht leer/)
  })

  it('4 caves: eight prophets, rounds of four and eight, an even number each; two caves on both sides of the middle; the yard lies below the caves', () => {
    const g = stage(4).task.caves!
    expect(g.prophets).toHaveLength(8)
    expect(new Set(g.prophets.map((p) => p.image)).size).toBe(8)
    expect(g.rounds.map((r) => r.count)).toEqual([4, 8])
    for (const r of g.rounds) expect(r.count % 2).toBe(0)
    expect(g.caves[0].x).toBeLessThan(50)
    expect(g.caves[1].x).toBeGreaterThan(50)
    for (const c of g.caves) {
      expect(c.x - c.w / 2).toBeGreaterThan(0)
      expect(c.x + c.w / 2).toBeLessThan(100)
    }
    expect(g.yard.y).toBeGreaterThan(g.caves[0].y + g.caves[0].h / 2)
    expect(g.yard.y + g.yard.row).toBeLessThan(100)
    expect(g.yard.x1).toBeGreaterThan(g.yard.x0)
  })

  it('5 verse: the filled sentences stand in the text of the stage and the English file keeps the order of the words', () => {
    const g = stage(5).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(5).text.join(' ')
    for (const r of g.rounds) {
      const filled = r.parts.reduce((s, p, i) => s + p + (i < r.answers.length ? r.words[r.answers[i]!]! : ''), '')
      const plain = filled.replace(/[„“]/g, '').replace(/\?$/, '').replace(/\.$/, '')
      expect(text, filled).toContain(plain.replace(/^Ist der Herr Gott, so folgt ihm nach$/, 'Ist der Herr Gott, so folgt ihm nach'))
    }
    setAdventureLanguage('en')
    const en = stage(5).task.verse!
    for (const [i, r] of g.rounds.entries()) {
      expect(en.rounds[i]!.words).toHaveLength(r.words.length)
      expect(en.rounds[i]!.parts).toHaveLength(r.parts.length)
    }
  })

  it('7 rain: round 1 one cloud that grows, round 2 six clouds that drift in one after the other and take long enough to be tapped; the dry and the green picture and the three clouds are there', () => {
    const g = stage(7).task.rain!
    expect(g.rounds.map((r) => r.mode)).toEqual(['grow', 'pass'])
    expect(g.rounds[0]!.clouds).toHaveLength(1)
    expect(g.rounds[1]!.clouds).toHaveLength(6)
    const ats = g.rounds[1]!.clouds.map((c) => c.at)
    expect(ats).toEqual([...ats].sort((a, b) => a - b))
    for (const c of g.rounds[1]!.clouds) {
      expect(c.dur).toBeGreaterThanOrEqual(9000)
      expect(c.y).toBeGreaterThan(5)
      expect(c.y).toBeLessThan(35)
    }
    expect(g.clouds).toHaveLength(3)
    expect(g.cloudW[0]).toBeLessThan(g.cloudW[1])
    expect(g.cloudW[1]).toBeLessThan(g.cloudW[2])
    expect(g.sea.y).toBeGreaterThan(30)
    expect(g.sea.y).toBeLessThan(60)
  })

  it('8 whisper: two rounds, the loud things are wind, earthquake and fire in another order in round 2, longer, and the stillness before the quiet sound is longer', () => {
    const g = stage(8).task.whisper!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) expect([...r.order].sort()).toEqual(['fire', 'quake', 'wind'])
    expect(g.rounds[1]!.order).not.toEqual(g.rounds[0]!.order)
    expect(g.rounds[1]!.loudMs).toBeGreaterThan(g.rounds[0]!.loudMs)
    expect(g.rounds[1]!.silenceMs).toBeGreaterThan(g.rounds[0]!.silenceMs)
    expect(g.elia.x).toBeGreaterThan(5)
    expect(g.elia.x).toBeLessThan(60)
    expect(g.elia.y).toBeLessThan(98)
  })

  it('the questions do not ask what a game of the stage shows (the order of the loud things in the whisper game is asked in the story, not the cave counts)', () => {
    expect(stage(4).questions.map((q) => q.q).join(' ')).not.toMatch(/gleich viele/)
    expect(stage(7).questions.map((q) => q.q).join(' ')).not.toMatch(/Wolken an/)
  })
})

describe('Elia: map, files, English', () => {
  it('nine stations from left to right, not too low (the name and the button stay above the tab bar) and the exam at the end; the way has a stretch to every medal', () => {
    const m = elia.map
    expect(m.stages).toHaveLength(9)
    const xs = [...m.stages, m.exam].map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of [...m.stages, m.exam]) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1070)
      expect(s.d).toBeCloseTo(336 / 9908, 4)
    }
    expect(ELIA_PATH).toHaveLength(9)
    expect(m.path).toBe(ELIA_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.images).toHaveLength(4)
  })

  it('every file of the adventure exists in `public/` (the pictures of the games that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(elia).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/elia\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 1.8 MB, everything else under 620 KB) and the size of the pack is about what the data says', () => {
    let bytes = 0
    for (const f of journeyFiles(elia)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 1_800_000 : 620_000)
      bytes += size
    }
    const mb = bytes / 1_000_000
    expect(elia.downloadMb!, `downloadMb (measured ${mb.toFixed(1)} MB)`).toBeGreaterThan(mb * 0.75)
    expect(elia.downloadMb!, `downloadMb (measured ${mb.toFixed(1)} MB)`).toBeLessThan(mb * 1.25)
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the German recording is not read in English', () => {
    const en = englishTextsOf(elia) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Elijah')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('No Rain, and the Ravens')
    expect(stage(9).text.at(-1)).toMatch(/spirit of Elijah/)
    expect(stage(1).task.hint).toContain('ravens')
    expect(stage(8).task.whisper!.rounds[0]!.hint).toContain('quiet sound')
    expect(stage(1).audio).toBeUndefined()
  })
})
