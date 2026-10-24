/**
 * The data of "Rut" (`rut.ts`, `en/rut.en.ts`, `rutPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Rut/ENTWURF_Rut.md`, Luther 1912),
 * the quiz stages are only quizzes, the four new games and the two old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { rut } from '@/data/adventures/rut'
import { RUT_PATH } from '@/data/adventures/rutPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { earCount } from '@/utils/rutGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => rut.stages[n - 1]!
/** Words that no text of the German data may use (Rut is told without cruelty: no blood, no weapons, no killing). */
const FORBIDDEN = /\b(Messer|Speer|Schwert|Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|tot|töten|Tod|umbringen|zerrissen|schlachten|geschlachtet)\b/i
const QUIZ_STAGES = [1, 4, 7]

describe('Rut: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(rut.id).toBe('rut')
    expect(rut.age).toBe('8-10')
    expect(rut.title).toBe('Rut')
    expect(rut.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(rut.stages.map((s) => s.title)).toEqual([
      'Hunger in Bethlehem',
      'Wo du hingehst',
      'Ist das Noomi?',
      'Boas ist gütig',
      'Ein Epha Gerste',
      'Auf der Tenne',
      'Sechs Maß Gerste',
      'Am Stadttor',
      'Obed'
    ])
    for (const s of rut.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Rut \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/rut/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two or three questions per stage (the quiz stages three), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of rut.stages) expect(s.questions.length, `stage ${s.id}`).toBeGreaterThanOrEqual(2)
    for (const n of QUIZ_STAGES) expect(stage(n).questions, `quiz stage ${n}`).toHaveLength(3)
    for (const q of [...rut.stages.flatMap((s) => s.questions), ...rut.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(rut.exam).toHaveLength(6)
    const asked = rut.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(rut.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den'])
    for (const s of rut.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: Moab, the words of Ruth, the field, the meal, the shoe and the son', () => {
    const q = rut.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Elimelech/)
    expect(q).toMatch(/Rut zu Noomi/)
    expect(q).toMatch(/Ähren/)
    expect(q).toMatch(/essen/)
    expect(q).toMatch(/verzichtet|aus/)
    expect(q).toMatch(/Sohn/)
  })

  it('the three quiz stages (1, 4, 7) are only quizzes, never two in a row; stage 1 says that it is serious in the hint', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(1).task.hint).toContain('ernst')
    const kinds = rut.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what was left out stays out', () => {
    expect(stage(1).text.join(' ')).toMatch(/als in Israel noch Richter regieren/)
    expect(stage(1).text.join(' ')).toMatch(/Orpa, die andere Rut/)
    expect(stage(1).text.join(' ')).toMatch(/etwa zehn Jahren/)
    expect(stage(2).text.join(' ')).toMatch(/Wo du hingehst, da gehe ich auch hin/)
    expect(stage(2).text.join(' ')).toMatch(/Dein Volk ist mein Volk, und dein Gott ist mein Gott/)
    expect(stage(3).text.join(' ')).toMatch(/nennt mich Mara/)
    expect(stage(3).text.join(' ')).toMatch(/Der Herr sei mit euch/)
    expect(stage(4).text.join(' ')).toMatch(/geröstete Körner/)
    expect(stage(4).text.join(' ')).toMatch(/unter seinen Flügeln/)
    expect(stage(5).text.join(' ')).toMatch(/ungefähr ein Epha Gerste/)
    expect(stage(6).text.join(' ')).toMatch(/Um Mitternacht/)
    expect(stage(6).text.join(' ')).toMatch(/Ich bin Rut, deine Magd/)
    expect(stage(7).text.join(' ')).toMatch(/sechs Maß Gerste/)
    expect(stage(7).text.join(' ')).toMatch(/noch näher mit euch verwandt/)
    expect(stage(8).text.join(' ')).toMatch(/zehn Männer von den Ältesten/)
    expect(stage(8).text.join(' ')).toMatch(/zieht seinen Schuh aus/)
    expect(stage(9).text.join(' ')).toMatch(/Obed/)
    expect(stage(9).text.join(' ')).toMatch(/der Vater von David/)
    // not told: the words about dying together and the praise about the young men
    const all = rut.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Jünglingen|da sterbe ich|begraben/)
  })
})

describe('Rut: the games', () => {
  it('the order of the games: 2 old (verse, order), 4 new, 3 quizzes; no game twice', () => {
    expect(rut.stages.map((s) => s.task.kind)).toEqual(['quiz', 'lueckenvers', 'nachlese', 'quiz', 'epha', 'reihenfolge', 'quiz', 'aelteste', 'wiege'])
  })

  it('2 verse: the filled sentences stand in the text of the stage and the English file keeps the order of the words', () => {
    const g = stage(2).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(2).text.join(' ')
    for (const r of g.rounds) {
      const filled = r.parts.reduce((s, p, i) => s + p + (i < r.answers.length ? r.words[r.answers[i]!]! : ''), '')
      const plain = filled.replace(/[„“]/g, '').replace(/\.$/, '')
      // "Wo du hingehst, da gehe ich auch hin." stands in the story
      expect(text, filled).toContain(plain.replace(/^Wo du hingehst, da gehe ich auch hin$/, 'Wo du hingehst, da gehe ich auch hin'))
    }
    setAdventureLanguage('en')
    const en = stage(2).task.verse!
    for (const [i, r] of g.rounds.entries()) {
      expect(en.rounds[i]!.words).toHaveLength(r.words.length)
      expect(en.rounds[i]!.parts).toHaveLength(r.parts.length)
    }
  })

  it('3 gleaning: two rounds with two and three reapers, six and nine ears; every reaper has three clumps in his lane, the rounds get a little faster and the lanes lie inside the picture', () => {
    const g = stage(3).task.glean!
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds.map((r) => r.reapers.length)).toEqual([2, 3])
    expect(g.rounds.map((r) => earCount(r.reapers))).toEqual([6, 9])
    for (const r of g.rounds) {
      for (const p of r.reapers) {
        expect(p.clumps).toHaveLength(3)
        expect(p.lane).toBeGreaterThanOrEqual(0)
        expect(p.lane).toBeLessThan(g.lanes.length)
        expect(p.sprite).toBeLessThan(g.reapers.length)
        expect(p.dur).toBeGreaterThanOrEqual(8000)
        for (const x of p.clumps) {
          expect(x).toBeGreaterThan(8)
          expect(x).toBeLessThan(92)
        }
        // the clumps of one lane are far enough apart to be tapped one by one
        const sorted = [...p.clumps].sort((a, b) => a - b)
        for (let i = 1; i < sorted.length; i++) expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(10)
      }
      const ats = r.reapers.map((p) => p.at)
      expect(ats).toEqual([...ats].sort((a, b) => a - b))
    }
    expect(g.rounds[1]!.reapers[0]!.dur).toBeLessThan(g.rounds[0]!.reapers[0]!.dur)
    expect(g.lanes).toHaveLength(3)
    for (const y of g.lanes) {
      expect(y).toBeGreaterThan(30)
      expect(y).toBeLessThan(90)
    }
    // two reapers never share a lane in one round
    for (const r of g.rounds) expect(new Set(r.reapers.map((p) => p.lane)).size).toBe(r.reapers.length)
    expect(g.reapers).toHaveLength(3)
    expect(g.clumps).toHaveLength(4)
    expect(g.ears).toHaveLength(4)
  })

  it('5 measure: two rounds, to the brim and half, five pictures that are all different, the measure and the heap lie inside the picture and do not cover each other', () => {
    const g = stage(5).task.measure!
    expect(g.rounds.map((r) => r.mark)).toEqual([1, 0.5])
    expect(g.states).toHaveLength(5)
    expect(new Set(g.states).size).toBe(5)
    expect(g.measure.x - g.measure.w / 2).toBeGreaterThan(0)
    expect(g.measure.x + g.measure.w / 2).toBeLessThan(100)
    expect(g.measure.y).toBeLessThanOrEqual(100)
    expect(g.measure.top).toBeLessThan(g.measure.bottom)
    expect(g.heap.x - g.heap.w / 2).toBeGreaterThanOrEqual(g.measure.x + g.measure.w / 2 - 5)
    expect(g.heap.x + g.heap.w / 2).toBeLessThanOrEqual(112)
    expect(g.heap.y + g.heap.h / 2).toBeLessThan(100)
    expect(stage(5).task.hint).toMatch(/gedrückt/)
  })

  it('6 order: four cards, round 1 three with dots, round 2 all four without; the right order is the order of Noomi\'s advice (wash, dress, go down, wait)', () => {
    const g = stage(6).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['waschen', 'kleid', 'tenne', 'warten'])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[0]!.cards).toEqual(['waschen', 'tenne', 'warten'])
    expect(g.rounds[1]!.cards).toEqual(['waschen', 'kleid', 'tenne', 'warten'])
    expect(new Set(g.cards.map((c) => c.image)).size).toBe(4)
  })

  it('8 elders: ten elders in two rounds of five among twelve walkers, ten seats in a half circle, the walkers walk one after the other on lanes in the lower half', () => {
    const g = stage(8).task.elders!
    expect(g.elders).toHaveLength(10)
    expect(g.others).toHaveLength(8)
    expect(g.seats).toHaveLength(10)
    expect(g.rounds).toHaveLength(2)
    const used = new Set<number>()
    for (const r of g.rounds) {
      expect(r.walkers).toHaveLength(12)
      expect(r.walkers.filter((w) => w.kind === 'elder')).toHaveLength(5)
      expect(r.walkers.filter((w) => w.kind === 'other')).toHaveLength(7)
      for (const w of r.walkers) {
        expect(w.y).toBeGreaterThan(50)
        expect(w.y).toBeLessThan(85)
        expect(w.dur).toBeGreaterThanOrEqual(8000)
        if (w.kind === 'elder') {
          expect(used.has(w.sprite), `elder ${w.sprite} twice`).toBe(false)
          used.add(w.sprite)
        } else expect(w.sprite).toBeLessThan(8)
      }
      const ats = r.walkers.map((w) => w.at)
      expect(ats).toEqual([...ats].sort((a, b) => a - b))
      // two walkers never enter at the same time
      expect(new Set(ats).size).toBe(ats.length)
    }
    expect([...used].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    const xs = g.seats.map((s) => s.x)
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
    for (const s of g.seats) {
      expect(s.x).toBeGreaterThan(5)
      expect(s.x).toBeLessThan(95)
      expect(s.y).toBeLessThanOrEqual(95)
    }
  })

  it('9 cradle: two rounds with ten and fourteen calm rocks, the glow only in round 1, three pictures of the baby, the cradle stands inside the picture', () => {
    const g = stage(9).task.cradle!
    expect(g.rounds.map((r) => r.calm)).toEqual([10, 14])
    expect(g.rounds.map((r) => r.guide)).toEqual([true, false])
    expect(g.states).toHaveLength(3)
    expect(new Set(g.states).size).toBe(3)
    expect(g.cradle.x - g.cradle.w / 2).toBeGreaterThan(5)
    expect(g.cradle.x + g.cradle.w / 2).toBeLessThan(95)
    expect(g.cradle.y).toBeLessThanOrEqual(100)
  })

  it('the questions do not ask what a game of the stage shows (not how many ears or how many rocks)', () => {
    expect(stage(3).questions.map((q) => q.q).join(' ')).not.toMatch(/Wie viele/)
    expect(stage(9).questions.map((q) => q.q).join(' ')).not.toMatch(/Schaukel/)
  })
})

describe('Rut: map, files, English', () => {
  it('nine stations from left to right, not too low (the name and the button stay above the tab bar) and the exam at the end; the way has a stretch to every medal', () => {
    const m = rut.map
    expect(m.stages).toHaveLength(9)
    const xs = [...m.stages, m.exam].map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of [...m.stages, m.exam]) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1070)
      expect(s.d).toBeCloseTo(336 / 9908, 4)
    }
    expect(RUT_PATH).toHaveLength(9)
    expect(m.path).toBe(RUT_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.images).toHaveLength(4)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(rut).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/rut\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 1.8 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(rut)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 1_800_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(rut) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Ruth')
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
    expect(stage(1).title).toBe('Hunger in Bethlehem')
    expect(stage(9).text.at(-1)).toMatch(/king over Israel/)
    expect(stage(3).task.hint).toContain('ears')
    expect(stage(9).task.cradle!.rounds[0]!.hint).toContain('left and right')
    // the English recordings are their own files, never the German ones
    for (const s of rut.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/rut/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of rut.stages) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/rut/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
  })
})
