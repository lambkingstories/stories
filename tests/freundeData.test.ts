/**
 * The data of "Jesus Calls His Friends" (`freunde.ts`, `en/freunde.en.ts`, `freundePath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Freunde/ENTWURF_Freunde.md`,
 * Luther 1912 told in our own words), the two quiz stages are only quizzes, the two new games and the five old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { freunde } from '@/data/adventures/freunde'
import { FREUNDE_PATH } from '@/data/adventures/freundePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { roofRoundProblems } from '@/utils/freundeGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => freunde.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood, no devil). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [6, 9]

describe('Freunde: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(freunde.id).toBe('freunde')
    expect(freunde.age).toBe('8-10')
    expect(freunde.title).toBe('Jesus ruft seine Freunde')
    expect(freunde.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(freunde.stages.map((s) => s.title)).toEqual([
      'Das Boot als Kanzel',
      'Auf dein Wort',
      'Das volle Netz',
      'Menschen fangen',
      'Durch das Dach',
      'Levi am Zoll',
      'Das Fest bei Levi',
      'Zwölf Freunde auf dem Berg',
      'Wer gehört zu Jesus?'
    ])
    for (const s of freunde.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Lukas|Markus) \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/freunde/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of freunde.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...freunde.stages.flatMap((s) => s.questions), ...freunde.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?') || q.q.trim().endsWith('.'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(freunde.exam).toHaveLength(6)
    const asked = freunde.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(freunde.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei'])
    for (const s of freunde.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the word of Simon, the full boats, catching people, the four men, the doctor and the name Peter', () => {
    const q = freunde.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Simon/)
    expect(q).toMatch(/Boote/)
    expect(q).toMatch(/Jesus zu Simon/)
    expect(q).toMatch(/Gelähmten/)
    expect(q).toMatch(/Arzt/)
    expect(q).toMatch(/Namen gibt Jesus/)
  })

  it('the two quiz stages (6, 9) are only quizzes, never two in a row', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    const kinds = freunde.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); nothing is told that the Bible does not say', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Wort Gottes/)
    expect(t(1)).toMatch(/waschen ihre Netze/)
    expect(t(1)).toMatch(/lehrt die Menschen vom Wasser aus/)
    expect(t(2)).toMatch(/Fahre hinaus auf die Tiefe/)
    expect(t(2)).toMatch(/die ganze Nacht gearbeitet/)
    expect(t(2)).toMatch(/Auf dein Wort will ich das Netz auswerfen/)
    expect(t(3)).toMatch(/zu reißen beginnt/)
    expect(t(3)).toMatch(/fast untergehen/)
    expect(t(4)).toMatch(/ich bin ein sündiger Mensch/)
    expect(t(4)).toMatch(/Fürchte dich nicht! Von nun an wirst du Menschen fangen/)
    expect(t(4)).toMatch(/Jakobus und Johannes, die Söhne des Zebedäus/)
    expect(t(5)).toMatch(/Vier Männer/)
    expect(t(5)).toMatch(/decken sie das Dach auf/)
    expect(t(5)).toMatch(/deine Sünden sind dir vergeben/)
    expect(t(5)).toMatch(/Steh auf, nimm dein Bett/)
    expect(t(6)).toMatch(/Levi/)
    expect(t(6)).toMatch(/Zoll/)
    expect(t(6)).toMatch(/Folge mir nach/)
    expect(t(7)).toMatch(/Zöllner und Sünder/)
    expect(t(7)).toMatch(/Nicht die Gesunden brauchen einen Arzt, sondern die Kranken/)
    expect(t(8)).toMatch(/zwölf/)
    expect(t(8)).toMatch(/Petrus/)
    expect(t(8)).toMatch(/Donnersöhne/)
    expect(t(8)).toMatch(/Judas Iskariot/)
    expect(t(9)).toMatch(/seine Mutter und seine Brüder/)
    expect(t(9)).toMatch(/Gottes Willen tut/)
    const all = freunde.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Teufel|Heiligenschein|Taube,? die|Engel/)
  })
})

describe('Freunde: the games', () => {
  it('the order of the games: 5 old, 2 new (boats, roof), 2 quizzes; no game twice', () => {
    expect(freunde.stages.map((s) => s.task.kind)).toEqual(['puzzle', 'lueckenvers', 'boote', 'reihenfolge', 'dach', 'quiz', 'memory', 'wimmelbild', 'quiz'])
    const games = freunde.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['boote', 'dach'].includes(k))).toHaveLength(2)
  })

  it('1 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(1).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/ufer\.webp$/)
  })

  it('2 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(2).task.verse!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('Wort')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['Tiefe', 'Netze'])
    const text = stage(2).text.join(' ')
    expect(text).toContain(`${g.rounds[0]!.parts[0]}Wort${g.rounds[0]!.parts[1]}`.replace('„', '').replace('“', ''))
    expect(text).toContain('Fahre hinaus auf die Tiefe')
  })

  it('3 boats: two rounds, two boats with a mark each, the places of the fish are inside the boat, every fish has a picture, the heap and the boats are inside the lake', () => {
    const g = stage(3).task.boats!
    expect(g.boats).toHaveLength(2)
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.capacity).toHaveLength(2)
      for (const c of r.capacity) {
        expect(c).toBeGreaterThanOrEqual(3)
        expect(c).toBeLessThanOrEqual(8)
      }
    }
    expect(g.rounds[1]!.capacity.reduce((a, b) => a + b, 0)).toBeGreaterThan(g.rounds[0]!.capacity.reduce((a, b) => a + b, 0))
    for (const b of g.boats) {
      expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w / 2).toBeLessThanOrEqual(100)
      expect(b.y).toBeLessThanOrEqual(98)
      expect(b.deck.x).toBeGreaterThanOrEqual(0)
      expect(b.deck.x + b.deck.w).toBeLessThanOrEqual(100)
      expect(b.deck.y + b.deck.h).toBeLessThanOrEqual(100)
      expect(b.label.length).toBeGreaterThan(3)
    }
    // the two boats do not overlap
    const [a, b] = g.boats as [(typeof g.boats)[0], (typeof g.boats)[0]]
    expect(a.x + a.w / 2).toBeLessThan(b.x - b.w / 2)
    expect(g.fish.length).toBeGreaterThanOrEqual(3)
    for (const f of g.fish) expect(f.image).toMatch(/freunde\/boote\/fisch-/)
    expect(g.background).toMatch(/freunde\/boote\/see\.webp$/)
    expect(g.pile).toMatch(/freunde\/boote\/haufen\.webp$/)
    expect(g.pileAt.y).toBeLessThan(a.y - 20)
    expect(stage(3).text.join(' ')).toContain('beide Boote')
  })

  it('4 order: four cards in the order of the story; round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(4).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['lehrt', 'wirft', 'voll', 'folgt'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['lehrt', 'wirft', 'voll', 'folgt'])
  })

  it('5 roof: two rounds, the hole is above Jesus and the bed, nobody sits under a free piece, every picture exists in the data, everything inside the picture', () => {
    const g = stage(5).task.roof!
    expect(g.rounds).toHaveLength(2)
    expect(g.area.x).toBeGreaterThanOrEqual(0)
    expect(g.area.x + g.area.w).toBeLessThanOrEqual(100)
    expect(g.area.y + g.area.h).toBeLessThan(g.floor)
    const ids = g.people.map((p) => p.id)
    for (const [i, r] of g.rounds.entries()) {
      for (const s of r.spots) {
        expect(ids, s.person).toContain(s.person)
        expect(s.x).toBeGreaterThan(5)
        expect(s.x).toBeLessThan(95)
      }
      const people = r.spots.map((s) => ({ x: s.x, w: g.people.find((p) => p.id === s.person)!.w }))
      expect(roofRoundProblems(r, g.area, people, g.jesus.w, g.mat.w), `round ${i + 1}`).toEqual([])
      expect(r.cols, `cols ${i + 1}`).toBeGreaterThanOrEqual(6)
      expect(r.free.length, `free ${i + 1}`).toBeGreaterThanOrEqual(2)
    }
    expect(g.rounds[1]!.free.length).toBeGreaterThan(g.rounds[0]!.free.length)
    expect(g.rounds[1]!.jesusX).not.toBe(g.rounds[0]!.jesusX)
    expect(g.background).toMatch(/freunde\/dach\/haus\.webp$/)
    expect(g.roof).toMatch(/freunde\/dach\/dach\.webp$/)
    expect(g.rope.image).toMatch(/freunde\/dach\/seil\.webp$/)
    expect(g.mat.ratio).toBeGreaterThan(0)
    expect(stage(5).text.join(' ')).toContain('Dach')
  })

  it('7 memory: six pairs (a full board of 3 x 4), every one with a sentence that the text of the feast tells', () => {
    const g = stage(7).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
    const text = `${stage(6).text.join(' ')} ${stage(7).text.join(' ')}`
    for (const w of ['Zöllner', 'Sünder', 'Schriftgelehrten', 'Arzt', 'Zoll', 'Essen']) expect(text, w).toContain(w)
  })

  it('8 hidden pictures: the four fishermen, covers, every place inside the picture', () => {
    const t = stage(8).task
    expect(t.kind).toBe('wimmelbild')
    expect(t.count).toBe(4)
    const f = t.find!
    expect(f.finds).toHaveLength(4)
    expect(f.labels).toHaveLength(4)
    expect(f.covers.length).toBeGreaterThanOrEqual(6)
    for (const s of [...f.finds, ...f.covers]) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(101)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(f.labels.join(' ')).toMatch(/Simon/)
    expect(f.labels.join(' ')).not.toMatch(/Jesus/)
  })
})

describe('Freunde: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = freunde.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(FREUNDE_PATH).toHaveLength(9)
    for (const seg of FREUNDE_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(FREUNDE_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.widthPx).toBe(9920)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(freunde).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/freunde\/(geschichte|musik)/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(freunde)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(freunde) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Jesus Calls His Friends')
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
    expect(stage(1).title).toBe('The Boat as a Pulpit')
    expect(stage(3).task.boats!.boats[0]!.label).toBe('Small boat')
    expect(stage(3).task.boats!.rounds[0]!.hint).toContain('Fill both boats')
    expect(stage(5).task.roof!.rounds[0]!.hint).toContain('Open the roof')
    expect(stage(5).task.roof!.people[1]!.label).toBe('Woman with a child')
    expect(stage(2).task.verse!.rounds[1]!.parts[0]).toContain('Launch out')
    for (const s of freunde.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/freunde/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of freunde.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/freunde/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
