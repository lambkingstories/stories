/**
 * The data of "Jesu Wunder am See" (`wunder.ts`, `en/wunder.en.ts`, `wunderPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Wunder/ENTWURF_Wunder.md`,
 * Luther 1912 told in our own words), the three quiz stages are only quizzes, the seven new games and the two old ones have sound data (Anton's plan of 5.11.2026: at most two known games;
 * "The hem" and "Along the shore" replace the hidden picture and the puzzle), the map has twelve stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { wunder } from '@/data/adventures/wunder'
import { WUNDER_PATH } from '@/data/adventures/wunderPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { bailRoundProblems, bundleProblems, crowdProblems, rowRoundProblems } from '@/utils/wunderGames'
import { saumProblems, uferProblems } from '@/utils/wunderNeu'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => wunder.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood, no devil). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [4, 7, 12]

describe('Wunder: stories and questions', () => {
  it('twelve stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(wunder.id).toBe('wunder')
    expect(wunder.age).toBe('8-10')
    expect(wunder.title).toBe('Jesu Wunder am See')
    expect(wunder.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(wunder.stages.map((s) => s.title)).toEqual([
      'Hinüber ans andere Ufer',
      'Der Sturm',
      'Eine große Stille',
      'Der Mann bei den Gräbern',
      'Jairus bittet um Hilfe',
      'Der Saum seines Kleides',
      'Das Mädchen schläft',
      'Zwei und zwei',
      'Ein ruhiger Ort',
      'Fünf Brote und zwei Fische',
      'Jesus kommt über das Wasser',
      'Am Saum seines Kleides'
    ])
    for (const s of wunder.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Markus [456],\d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/wunder/etappe-bild-${String(s.id).padStart(2, '0')}${s.id === 2 || s.id === 12 ? '-b' : ''}.webp`) // Antons Wahl: b bei Etappe 2 und 12
    }
  })

  it('three questions in the three quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of wunder.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...wunder.stages.flatMap((s) => s.questions), ...wunder.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?') || q.q.trim().endsWith('.'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(wunder.exam).toHaveLength(6)
    const asked = wunder.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(wunder.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei'])
    for (const s of wunder.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the cushion, the word to the wind, Jairus, the twelve years, the baskets and the word on the water', () => {
    const q = wunder.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Kopf/)
    expect(q).toMatch(/Wind und zum Meer/)
    expect(q).toMatch(/Tochter/)
    expect(q).toMatch(/krank/)
    expect(q).toMatch(/Körbe/)
    expect(q).toMatch(/auf dem Wasser/)
  })

  it('the three quiz stages (4, 7, 12) are only quizzes, never two in a row', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    const kinds = wunder.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); nothing is told that the Bible does not say', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Lasst uns hinüberfahren/)
    expect(t(1)).toMatch(/Jesus bleibt im Boot, so wie er ist/)
    expect(t(2)).toMatch(/großer Sturm/)
    expect(t(2)).toMatch(/schläft/)
    expect(t(2)).toMatch(/auf einem Kissen/)
    expect(t(2)).toMatch(/dass wir untergehen/)
    expect(t(3)).toMatch(/Schweig und verstumme/)
    expect(t(3)).toMatch(/ganz still/)
    expect(t(3)).toMatch(/Sogar der Wind und das Meer hören auf ihn/)
    expect(t(4)).toMatch(/Gerasener/)
    expect(t(4)).toMatch(/Gräbern/)
    expect(t(4)).toMatch(/zehn Städten/)
    expect(t(5)).toMatch(/Jairus/)
    expect(t(5)).toMatch(/Vorsteher der Synagoge/)
    expect(t(5)).toMatch(/liegt im Sterben/)
    expect(t(6)).toMatch(/Seit zwölf Jahren/)
    expect(t(6)).toMatch(/Wer hat meine Kleider angerührt/)
    expect(t(6)).toMatch(/dein Glaube hat dich gesund gemacht/)
    expect(t(7)).toMatch(/Fürchte dich nicht, glaube nur/)
    expect(t(7)).toMatch(/Talitha kumi/)
    expect(t(7)).toMatch(/zwölf Jahre alt/)
    expect(t(8)).toMatch(/Zimmermann/)
    expect(t(8)).toMatch(/zu zweit/)
    expect(t(8)).toMatch(/nur einen Stab/)
    expect(t(9)).toMatch(/einsamen Ort/)
    expect(t(9)).toMatch(/Schafe ohne Hirten/)
    expect(t(10)).toMatch(/Fünf Brote/)
    expect(t(10)).toMatch(/zwei Fische/)
    expect(t(10)).toMatch(/Zwölf Körbe/)
    expect(t(10)).toMatch(/fünftausend Männer/)
    expect(t(11)).toMatch(/Gegenwind|Wind weht ihnen entgegen/)
    expect(t(11)).toMatch(/Gespenst/)
    expect(t(11)).toMatch(/Seid getrost! Ich bin es, fürchtet euch nicht/)
    expect(t(12)).toMatch(/Land Genezareth/)
    expect(t(12)).toMatch(/Saum deines Kleides/)
    const all = wunder.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Teufel|Heiligenschein|Taube,? die|Engel|Legion|Ketten|ertrunken/)
  })
})

describe('Wunder: the games', () => {
  it('the order of the games: 2 old (verse, order; not one after the other), 7 new (bail, crowd, hem, bundle, shore, bread, row), 3 quizzes; no game twice', () => {
    expect(wunder.stages.map((s) => s.task.kind)).toEqual(['lueckenvers', 'schoepfen', 'reihenfolge', 'quiz', 'gedraenge', 'saum', 'quiz', 'buendel', 'ufer', 'brote', 'rudern', 'quiz'])
    const games = wunder.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['schoepfen', 'gedraenge', 'saum', 'buendel', 'ufer', 'brote', 'rudern'].includes(k))).toHaveLength(7)
  })

  it('1 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(1).task.verse!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('Ufer')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['Jüngern', 'hinüberfahren'])
    const text = stage(1).text.join(' ')
    expect(text).toContain('Jesus sagt zu seinen Jüngern: „Lasst uns hinüberfahren ans andere Ufer.“')
  })

  it('2 bail: two rounds, the places of the puddles are inside the boat and every round is playable', () => {
    const g = stage(2).task.bail!
    expect(g.rounds).toHaveLength(2)
    expect(g.puddles.length).toBeGreaterThanOrEqual(3)
    for (const s of g.spots) {
      expect(s.x).toBeGreaterThan(10)
      expect(s.x).toBeLessThan(90)
      expect(s.y).toBeGreaterThan(10)
      expect(s.y).toBeLessThan(90)
    }
    for (const r of g.rounds) expect(bailRoundProblems(r, g.spots.length), r.hint).toEqual([])
    expect(g.rounds[1]!.total).toBeGreaterThan(g.rounds[0]!.total)
    expect(g.rounds[1]!.every).toBeLessThan(g.rounds[0]!.every)
    expect(g.background).toMatch(/wunder\/schoepfen\/boot-innen\.webp$/)
  })

  it('3 order: four cards in the order of the story; round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(3).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['abend', 'sturm', 'wecken', 'stille'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['abend', 'sturm', 'wecken', 'stille'])
  })

  it('5 crowd: two rounds, every row can be solved, the second crowd is bigger', () => {
    const g = stage(5).task.crowd!
    expect(g.rounds).toHaveLength(2)
    expect(g.people.length).toBe(6)
    for (const r of g.rounds) expect(crowdProblems(r.rows), r.hint).toEqual([])
    expect(g.rounds[1]!.rows.length).toBeGreaterThan(g.rounds[0]!.rows.length)
    expect(g.area.x + g.area.w).toBeLessThanOrEqual(100)
    expect(g.area.y + g.area.h).toBeLessThanOrEqual(100)
    expect(g.door.y).toBeLessThan(g.area.y)
  })

  it('6 the hem: the data are in order (the hem at the height of her fingers, a moment long enough, round 2 shorter and with people in front, the help touches it)', () => {
    const t = stage(6).task
    expect(t.kind).toBe('saum')
    const g = t.hemTouch!
    expect(saumProblems(g)).toEqual([])
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[0]!.ring).toBe(true)
    expect(g.background).toMatch(/wunder\/saum\/strasse\.webp$/)
    expect(g.jesus.label).toBe('Jesus')
  })

  it('8 bundle: two rounds, only the staff, the sandals and one shirt are allowed, the things do not overlap', () => {
    const g = stage(8).task.bundle!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(bundleProblems(r.items, g.things[0]!.w), r.hint).toEqual([])
      expect(r.items.filter((i) => i.allowed)).toHaveLength(2)
      for (const i of r.items) expect(g.things.map((t) => t.id)).toContain(i.thing)
    }
    const allowed = g.rounds.flatMap((r) => r.items.filter((i) => i.allowed).map((i) => i.thing)).sort()
    expect(allowed).toEqual(['hemd', 'sandalen', 'stab', 'stab'])
    const forbidden = g.rounds.flatMap((r) => r.items.filter((i) => !i.allowed).map((i) => i.thing)).sort()
    expect(forbidden).toEqual(['brot', 'geld', 'hemd2', 'tasche'])
  })

  it('9 along the shore: the data are in order (the way round the rocks is wide enough, round 2 with the bay is longer, the help reaches the landing place without a mistake)', () => {
    const t = stage(9).task
    expect(t.kind).toBe('ufer')
    const g = t.bankPath!
    expect(uferProblems(g)).toEqual([])
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds.map((r) => r.background)).toEqual([1, 2].map((n) => `images/abenteuer/spiele/wunder/ufer/ufer-${n}.webp`))
    expect(g.rounds[1]!.water.length).toBeGreaterThanOrEqual(1)
  })

  it('10 bread: five groups and twelve baskets, two rounds (feed, collect), everything inside the picture', () => {
    const g = stage(10).task.bread!
    expect(g.groups).toHaveLength(5)
    expect(g.leftover.count).toBe(12)
    expect(g.rounds.map((r) => r.kind)).toEqual(['feed', 'collect'])
    for (const s of g.groups) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(0)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(100)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(g.leftover.area.x + g.leftover.area.w).toBeLessThanOrEqual(100)
    expect(stage(10).text.join(' ')).toContain('Zwölf Körbe')
  })

  it('11 row: two rounds, the second is longer and the wind is stronger, the boat has a way to go', () => {
    const g = stage(11).task.row!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) expect(rowRoundProblems(r), r.hint).toEqual([])
    expect(g.rounds[1]!.distance).toBeGreaterThan(g.rounds[0]!.distance)
    expect(Math.abs(g.rounds[1]!.wind)).toBeGreaterThan(Math.abs(g.rounds[0]!.wind))
    expect(g.start).toBeGreaterThan(g.goal)
  })
})

describe('Wunder: map, files, English', () => {
  it('twelve stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = wunder.map
    expect(m.stages).toHaveLength(12)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(WUNDER_PATH).toHaveLength(12)
    for (const seg of WUNDER_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(WUNDER_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.widthPx).toBe(9920)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(wunder).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/wunder\/(geschichte|musik)/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(wunder)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(wunder) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('The Miracles at the Lake')
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
    expect(stage(2).title).toBe('The Storm')
    expect(stage(2).task.bail!.rounds[0]!.hint).toContain('Bail the water')
    expect(stage(5).task.crowd!.pair.label).toBe('Jesus and Jairus')
    expect(stage(8).task.bundle!.things[0]!.label).toBe('Staff')
    expect(stage(10).task.bread!.rounds[1]!.hint).toContain('twelve baskets')
    expect(stage(11).task.row!.boat.label).toBe('The boat with two oars')
    expect(stage(6).task.hemTouch!.woman.label).toBe('A woman of the crowd')
    expect(stage(6).task.hemTouch!.rounds[1]!.hint).toContain('Wait for the right moment')
    expect(stage(9).task.bankPath!.crowd.label).toBe('The crowd')
    expect(stage(9).task.bankPath!.rounds[0]!.hint).toContain('along the shore')
    expect(stage(1).task.verse!.rounds[0]!.parts[0]).toContain('Let us go over')
    for (const s of wunder.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/wunder/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of wunder.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/wunder/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
