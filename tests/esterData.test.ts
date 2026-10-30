/**
 * The data of "Esther" (`ester.ts`, `en/ester.en.ts`, `esterPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Ester/ENTWURF_Ester.md`, Luther 1912 told in our own words),
 * the two quiz stages are only quizzes, the two new games and the five old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { ester } from '@/data/adventures/ester'
import { ESTER_PATH } from '@/data/adventures/esterPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => ester.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no hanging, no killing, no blood). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|gehängt|Schwert|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [4, 8]

describe('Ester: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(ester.id).toBe('ester')
    expect(ester.age).toBe('8-10')
    expect(ester.title).toBe('Ester')
    expect(ester.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(ester.stages.map((s) => s.title)).toEqual([
      'Das Fest in Susa',
      'Hadassa, die Ester heißt',
      'Die neue Königin',
      'Hamans Plan',
      'Wer weiß, wozu?',
      'Vor dem König',
      'Die schlaflose Nacht',
      'Das Mahl der Königin',
      'Licht und Freude'
    ])
    for (const s of ester.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Ester \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/ester/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of ester.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...ester.stages.flatMap((s) => s.questions), ...ester.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(ester.exam).toHaveLength(6)
    const asked = ester.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(ester.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie'])
    for (const s of ester.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the king, the name, the crown, the fast, the scepter and Purim', () => {
    const q = ester.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Ahasveros/)
    expect(q).toMatch(/Hadassa/)
    expect(q).toMatch(/Haupt/)
    expect(q).toMatch(/fasten/)
    expect(q).toMatch(/entgegen/)
    expect(q).toMatch(/Fest/)
  })

  it('the two quiz stages (4, 8) are only quizzes, never two in a row, and say that they are serious', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(4).task.hint).toContain('ernst')
    expect(stage(8).task.hint).toContain('ernst')
    const kinds = ester.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what was left out stays out; God is not made to speak', () => {
    expect(stage(1).text.join(' ')).toMatch(/hundertsiebenundzwanzig Länder/)
    expect(stage(1).text.join(' ')).toMatch(/Weiße, rote und blaue Tücher/)
    expect(stage(1).text.join(' ')).toMatch(/jeder Becher sieht anders aus/)
    expect(stage(2).text.join(' ')).toMatch(/Hadassa, die auch Ester heißt/)
    expect(stage(2).text.join(' ')).toMatch(/sieben Mägde/)
    expect(stage(3).text.join(' ')).toMatch(/Krone/)
    expect(stage(3).text.join(' ')).toMatch(/Chronik/)
    expect(stage(4).text.join(' ')).toMatch(/Siegelring/)
    expect(stage(5).text.join(' ')).toMatch(/Wer weiß, ob du nicht gerade für diese Zeit Königin geworden bist/)
    expect(stage(5).text.join(' ')).toMatch(/drei Tage/)
    expect(stage(6).text.join(' ')).toMatch(/goldene Zepter/)
    expect(stage(7).text.join(' ')).toMatch(/königliche Kleider bringen, ein Pferd des Königs und eine Krone/)
    expect(stage(8).text.join(' ')).toMatch(/Der Feind ist dieser böse Haman/)
    expect(stage(9).text.join(' ')).toMatch(/Licht und Freude und Wonne und Ehre/)
    expect(stage(9).text.join(' ')).toMatch(/Purim/)
    // not told: the hanging, the numbers of the fights, the ten sons of Haman, the second request of Esther
    const all = ester.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/gehängt|Galgen|fünfhundert|fünfundsiebzigtausend|zehn Söhne|Söhne Hamans/)
    expect(all).not.toMatch(/Gott sprach|Gott sagte|Der Herr sprach|Der Herr sagte/)
  })
})

describe('Ester: the games', () => {
  it('the order of the games: 5 old, 2 new (decorate, honor), 2 quizzes; no game twice', () => {
    expect(ester.stages.map((s) => s.task.kind)).toEqual(['schmuecken', 'puzzle', 'memory', 'quiz', 'lueckenvers', 'reihenfolge', 'ehren', 'quiz', 'wimmelbild'])
    const games = ester.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['schmuecken', 'ehren'].includes(k))).toHaveLength(2)
  })

  it('1 decorate: three rounds (cloths, floor, cups); every place lies inside the picture; the cloths and the floor name the order of the text; the cups have twins and as many designs as places', () => {
    const g = stage(1).task.decor!
    expect(g.rounds.map((r) => r.mode)).toEqual(['order', 'order', 'distinct'])
    expect(g.rounds.map((r) => r.slots.length)).toEqual([3, 4, 5])
    for (const r of g.rounds) {
      for (const s of r.slots) {
        expect(s.x - s.w / 2, r.hint).toBeGreaterThanOrEqual(0)
        expect(s.x + s.w / 2, r.hint).toBeLessThanOrEqual(100)
        expect(s.y, r.hint).toBeGreaterThan(5)
        expect(s.y, r.hint).toBeLessThan(97)
      }
      expect(r.ghostW).toBeGreaterThan(4)
    }
    expect(g.rounds[0]!.want).toEqual(['weiss', 'rot', 'blau'])
    expect(g.rounds[1]!.want).toEqual(['gruen', 'weiss', 'gelb', 'schwarz'])
    expect(g.rounds[0]!.items.map((i) => i.key).sort()).toEqual(['blau', 'rot', 'weiss'])
    expect(g.rounds[1]!.items.map((i) => i.key).sort()).toEqual(['gelb', 'gruen', 'schwarz', 'weiss'])
    const cups = g.rounds[2]!.items.map((i) => i.key)
    expect(cups.length).toBeGreaterThan(g.rounds[2]!.slots.length)
    expect(new Set(cups).size).toBe(g.rounds[2]!.slots.length)
    expect(g.background).toMatch(/ester\/schmuecken\/halle\.webp$/)
    expect(stage(1).text.join(' ')).toMatch(/grünem, weißem, gelbem und schwarzem Marmor/)
  })

  it('2 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(2).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/tor\.webp$/)
  })

  it('3 memory: six pairs (a full board of 3 x 4), every one with a sentence that the text of the stage tells', () => {
    const g = stage(3).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
    const text = stage(3).text.join(' ')
    expect(text).toMatch(/Salben/)
    expect(text).toMatch(/Gewürzen/)
    expect(text).toMatch(/Krone/)
    expect(text).toMatch(/Fest/)
    expect(text).toMatch(/schenkt reich/)
    expect(text).toMatch(/Chronik/)
  })

  it('5 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(5).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(5).text.join(' ')
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(text).toMatch(/Wer weiß, ob du nicht gerade für diese Zeit Königin geworden bist/)
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('weiß')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['drei', 'Nacht'])
  })

  it('6 order: four cards, round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(6).task.order!
    expect(g.cards).toHaveLength(4)
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
  })

  it('7 honor: three rounds with four choices each, exactly one right; the right ones are what the text names (clothes, crown, horse)', () => {
    const g = stage(7).task.honor!
    expect(g.rounds).toHaveLength(3)
    for (const r of g.rounds) {
      expect(r.choices).toHaveLength(4)
      expect(r.choices.filter((c) => c.right)).toHaveLength(1)
      for (const c of r.choices) expect(c.label.length).toBeGreaterThan(3)
    }
    expect(g.rounds.flatMap((r) => r.choices.filter((c) => c.right).map((c) => c.image))).toEqual(expect.arrayContaining([expect.stringMatching(/kleid-1/), expect.stringMatching(/kopf-1/), expect.stringMatching(/tier-1/)]))
    expect(stage(7).text.join(' ')).toMatch(/königliche Kleider bringen, ein Pferd des Königs und eine Krone/)
    expect(g.background).toMatch(/ester\/ehren\/hof\.webp$/)
    expect(g.parade).toMatch(/ester\/ehren\/umzug\.webp$/)
  })

  it('9 hidden pictures: six messengers on mules, covers, every place inside the picture', () => {
    const t = stage(9).task
    expect(t.kind).toBe('wimmelbild')
    expect(t.count).toBe(6)
    const f = t.find!
    expect(f.finds).toHaveLength(6)
    expect(f.covers.length).toBeGreaterThanOrEqual(6)
    for (const s of [...f.finds, ...f.covers]) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(101)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(f.labels).toHaveLength(6)
  })
})

describe('Ester: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = ester.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9908, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9908, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(ESTER_PATH).toHaveLength(9)
    for (const seg of ESTER_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(ESTER_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.widthPx).toBe(9908)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(ester).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/ester\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(ester)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(ester) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Esther')
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
    expect(stage(1).title).toBe('The feast in Shushan')
    expect(stage(1).task.decor!.rounds[0]!.hint).toContain('Hang the cloths')
    expect(stage(7).task.honor!.rounds[0]!.hint).toContain('royal robe')
    expect(stage(5).task.verse!.rounds[0]!.parts[0]).toContain('And who')
    for (const s of ester.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/ester/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of ester.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/ester/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
