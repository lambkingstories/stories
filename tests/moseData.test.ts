/**
 * The data of "Mose" (`mose.ts` and `en/mose.en.ts`), phase 2a: the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Mose/ENTWURF_Mose.md`), every stage still has the quiz PLACEHOLDER and a picture of Josef until the games and the own pictures are built in, the map is the
 * placeholder map of Josef (fifteen stations + exam), and the English file has the same shape. The own pictures and recordings are not there yet (`audio` is missing on purpose).
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { mose } from '@/data/adventures/mose'
import { MOSE_PATH } from '@/data/adventures/mosePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { solvable } from '@/utils/josuaGames'
import { dayOk, diffAt, distance, frontCells, frontCount, glow, noTriple, ringTimes, shuffle, wordsOf } from '@/utils/moseGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => mose.stages[n - 1]!
/** Words that no text of the German data may use (the plagues, the Passover night and the golden calf are told without cruelty; "töten" is allowed because it is a commandment, "Blut" because the Bible says so). */
const FORBIDDEN = /\b(Messer|Speer|Pfeil|Peitsche|Teufel|Hölle|erschlagen|erwürgen|dreitausend)\b/i
const QUIZ_STAGES = [1, 3, 8, 9, 14]

describe('Mose: stories and questions', () => {
  it('fifteen stages with 3 or 4 paragraphs of 90 to 145 words (plan v3) and the Bible passage under every one; no recording yet; the stage pictures are the ones of Josef (PLATZHALTER)', () => {
    expect(mose.id).toBe('mose')
    expect(mose.age).toBe('8-10')
    expect(mose.title).toBe('Mose')
    expect(mose.subtitle).toBe('Der Weg in die Freiheit')
    expect(mose.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(mose.stages.map((s) => s.title)).toEqual([
      'Schifra und Pua',
      'Das Körbchen im Schilf',
      'Flucht nach Midian',
      'Der brennende Dornbusch',
      'Mose und Aaron',
      'Lass mein Volk ziehen',
      'Die Frösche',
      'Finsternis und Licht',
      'Die Nacht des Passah',
      'Der Auszug',
      'Das Wunder am Meer',
      'Brot vom Himmel',
      'Die zehn Gebote',
      'Das goldene Kalb',
      'Gott geht mit'
    ])
    for (const s of mose.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^2\. Mose \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(90)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(145)
      // short sentences like Noah and Josef (they have 9 to 10 words on average)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(7)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(12.5)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, `no recording yet, the device voice reads: ${s.id}`).toBeUndefined()
      expect(s.image, `stage ${s.id}`).toMatch(/^images\/abenteuer\/josef\/etappe-bild-\d\d(-v2)?\.webp$/)
    }
  })

  it('two questions per stage (three in the serious stages 1, 3, 8 and 9), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    expect(mose.stages.map((s) => s.questions.length)).toEqual([3, 2, 3, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2])
    for (const q of [...mose.stages.flatMap((s) => s.questions), ...mose.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(mose.exam).toHaveLength(6)
    // nothing is asked twice with the same answer (a question may come back in another stage with other answers; each is shown only in its own stage)
    const asked = mose.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(mose.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von'])
    for (const s of mose.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        // at least one word of the right answer (cut to its first five letters, for endings) lies in the text
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the five serious stages (1, 3, 8, 9, 14) say so in the hint and are only quizzes; the hard places are told calmly (no cruelty, no picture words)', () => {
    for (const n of QUIZ_STAGES) {
      expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
      expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    }
    // the death of the Egyptian: one sober sentence, without "im Zorn" (the Bible does not say it)
    expect(stage(3).text.join(' ')).toMatch(/erschlägt den Ägypter und versteckt ihn/)
    expect(stage(3).text.join(' ')).not.toMatch(/Zorn/)
    // the Passover night: the firstborn die, nothing is painted out
    const t9 = stage(9).text.join(' ')
    expect(t9).toMatch(/Passah/)
    expect(t9).toMatch(/alle Erstgeborenen/)
    // the golden calf: told in a few sentences, without the judgement of the Levites
    const t14 = stage(14).text.join(' ')
    expect(t14).toMatch(/Kalb/)
    expect(t14).not.toMatch(/Schwert|Levi|Pest|Seuche/)
    // the burning bush and the pillar of cloud: Gott speaks, no angel
    expect(stage(4).text.join(' ')).toMatch(/Mose, Mose/)
    expect(stage(4).text.join(' ')).not.toMatch(/Engel/)
  })

  it('God is "Gott" everywhere in the narration (also in direct speech); not "der Herr"', () => {
    const all = mose.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/der Herr\b|dem Herrn\b|\bHERR\b/)
  })

  it('the questions do not ask what a game of the stage will show (the sentences of the verse game, the frogs, the commandment sentences)', () => {
    const q = (n: number) => stage(n).questions.map((x) => x.q).join(' ').toLowerCase()
    expect(q(6)).not.toMatch(/lass mein volk|herausführen/)
    expect(q(13)).not.toMatch(/du sollst/)
  })
})

describe('Mose: the games, and the placeholders until the pictures come', () => {
  it('the plan of the games: ten stages with a game, the five serious ones only quizzes; six new mechanics, one drum game; three old ones (verse, hidden pictures, packing) and no mechanic twice; at most two rounds each', () => {
    expect(mose.stages.map((s) => s.task.kind)).toEqual(['quiz', 'flechten', 'quiz', 'leuchten', 'unterschied', 'lueckenvers', 'wimmelbild', 'quiz', 'quiz', 'packen', 'takt', 'manna', 'worte', 'quiz', 'wolke'])
    for (const s of mose.stages) expect(s.task.hint.length, `hint ${s.id}`).toBeGreaterThan(8)
    const games = mose.stages.filter((s) => s.task.kind !== 'quiz')
    expect(games).toHaveLength(10)
    expect(new Set(games.map((s) => s.task.kind)).size, 'no mechanic twice').toBe(10)
    for (const s of games) {
      const g = (s.task.weave ?? s.task.glow ?? s.task.diff ?? s.task.verse ?? s.task.pack ?? s.task.beat ?? s.task.manna ?? s.task.words ?? s.task.cloud) as { rounds: unknown[] } | undefined
      if (s.task.kind !== 'wimmelbild') expect(g?.rounds.length, `rounds of stage ${s.id}`).toBeLessThanOrEqual(2)
    }
  })

  it('13 words: two sentences in each round, all word for word in the text of the stage (also in English); the sentence of the quiz question is not used; the goal is 4', () => {
    const g = stage(13).task.words
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.sentences.length)).toEqual([2, 2])
    const check = () => {
      const text = stage(13).text.join(' ')
      for (const r of stage(13).task.words!.rounds) {
        for (const sentence of r.sentences) {
          expect(text, sentence).toContain(sentence.replace(/[.!?]$/, ''))
          expect(sentence.split(' ').length).toBeGreaterThanOrEqual(4)
        }
      }
    }
    check()
    // the round 2 sentences are longer than the round 1 sentences
    const avg = (xs: string[]) => xs.reduce((n, s) => n + s.split(' ').length, 0) / xs.length
    expect(avg(g.rounds[1]!.sentences)).toBeGreaterThan(avg(g.rounds[0]!.sentences))
    expect(g.rounds.flatMap((r) => r.sentences).join(' ')).not.toContain('Alles, was Gott gesagt hat')
    for (const r of g.rounds) for (const s of r.sentences) expect(shuffle(wordsOf(s), 1).join(' ')).not.toBe(wordsOf(s).join(' '))
    setAdventureLanguage('en')
    expect(stage(13).task.words!.rounds.map((r) => r.sentences.length)).toEqual([2, 2])
    check()
    setAdventureLanguage('de')
    expect(g.background).toBe(stage(13).image)
  })

  it('5 differences: three things, then four; every thing lies in the picture, the things are apart from each other (so that a tap belongs to one), the sprites differ; the goal is 7', () => {
    const g = stage(5).task.diff
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.items.length)).toEqual([3, 4])
    expect(g.rounds[0]!.base).not.toBe(g.rounds[1]!.base)
    for (const r of g.rounds) {
      for (const [i, a] of r.items.entries()) {
        expect(a.x >= 0 && a.x <= 100 && a.y >= 0 && a.y <= 100).toBe(true)
        for (const b of r.items.slice(i + 1)) expect(distance(a, b), 'apart').toBeGreaterThan(12)
      }
    }
    // a tap on the middle of a thing hits exactly this thing
    for (const r of g.rounds) r.items.forEach((it, i) => expect(diffAt(r.items, { x: it.x, y: it.y }, r.items.map(() => false))).toBe(i))
    expect(new Set(g.rounds.flatMap((r) => r.items.map((it) => it.image))).size).toBe(7)
    expect(g.rounds[1]!.items.reduce((n, it) => n + it.w, 0) / 4).toBeLessThan(g.rounds[0]!.items.reduce((n, it) => n + it.w, 0) / 3)
    expect(g.rounds.reduce((n, r) => n + r.items.length, 0)).toBe(7)
  })

  it('12 manna: two usual days, then a usual one, a double day and a day of rest; four grains fill a jar; two pictures of grains; the goal is five days', () => {
    const g = stage(12).task.manna
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.days.map((d) => d.jars))).toEqual([[2, 2], [2, 4, 0]])
    expect(g.flakesPerJar).toBe(4)
    expect(g.flakes).toHaveLength(2)
    // the day of rest is the last day; the double day comes the day before; right and wrong collected amounts
    const days = g.rounds.flatMap((r) => r.days)
    expect(days).toHaveLength(5)
    expect(days[4]!.jars).toBe(0)
    expect(days[3]!.jars).toBe(2 * days[2]!.jars)
    // the text says it: twice as much on the sixth day, nothing on the ground on the seventh
    expect(stage(12).text.join(' ')).toMatch(/doppelt/)
    expect(stage(12).text.join(' ')).toMatch(/siebten Tag/)
    for (const d of days) {
      expect(dayOk(d, d.jars * 4, 4)).toBe(true)
      expect(dayOk(d, d.jars * 4 + 4, 4)).toBe(false)
    }
    expect(g.background).toBe(stage(12).image)
  })

  it('15 cloud: three questions by day, three by night; never three times the same in a row; both answers occur in each round; the extras have pictures (no smoke any more); the goal is 6', () => {
    const g = stage(15).task.cloud
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.mode, r.trials.length])).toEqual([['day', 3], ['night', 3]])
    for (const r of g.rounds) {
      expect(noTriple(r.trials)).toBe(true)
      expect(r.trials.some((t) => t.pillar === 'rises')).toBe(true)
      expect(r.trials.some((t) => t.pillar === 'stays')).toBe(true)
      expect(r.trials.some((t) => t.distractors.length > 0)).toBe(true)
      for (const t of r.trials) {
        for (const d of t.distractors) expect(Object.keys(g.extras).concat('banner')).toContain(d)
      }
    }
    expect(g.rounds[1]!.trials.every((t) => !t.distractors.includes('birds'))).toBe(true)
    expect(Object.keys(g.extras).sort()).toEqual(['birds', 'sparks'])
    expect(g.rounds.reduce((n, r) => n + r.trials.length, 0)).toBe(6)
    // the rule of the pillar stands in the text
    expect(stage(15).text.join(' ')).toMatch(/Wolke/)
  })

  it('2 weave: three rows of four stakes, then four rows of five; the cells to tap add up to 16; the second round alternates; the goal is 16', () => {
    const g = stage(2).task.weave
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.rows, r.stakes, r.pattern])).toEqual([[3, 4, 'same'], [4, 5, 'alternate']])
    const counts = g.rounds.map((r) => frontCount(frontCells(r.rows, r.stakes, r.pattern)))
    expect(counts).toEqual([6, 10])
    expect(counts.reduce((a, b) => a + b, 0)).toBe(16)
    expect(g.tiles.stake).not.toBe(g.tiles.front)
    expect(g.background).toBe(stage(2).image)
  })

  it('4 glow: two rounds with an open bush and a bush behind rocks; Moses does not start at the bush, the glow can be seen from the start, the threshold is seven percent; the goal is 2', () => {
    const g = stage(4).task.glow
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.threshold, Boolean(r.cover)])).toEqual([[7, false], [7, true]])
    for (const r of g.rounds) {
      const d = distance({ x: r.start[0], y: r.start[1] }, { x: r.target[0], y: r.target[1] })
      expect(d, 'far from the bush at the start').toBeGreaterThan(40)
      expect(glow(d, 90), 'a faint glow at the start').toBeGreaterThan(0.05)
      for (const v of [...r.start, ...r.target]) expect(v >= 0 && v <= 100).toBe(true)
    }
    // one slope for both rounds; the rocks lie over it in round 2 only
    expect(g.rounds[0]!.background).toBe(g.rounds[1]!.background)
    expect(g.rounds).toHaveLength(2)
  })

  it('11 beat: six rings, then seven with two pauses (nine beats); 13 rings in all; the second round is a little quicker; the goal is 13', () => {
    const g = stage(11).task.beat
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.pattern.filter((p) => p === 1).length)).toEqual([6, 7])
    expect(g.rounds.map((r) => r.pattern.filter((p) => p === 0).length)).toEqual([0, 2])
    expect(g.rounds[0]!.bpm).toBeLessThan(g.rounds[1]!.bpm)
    for (const r of g.rounds) {
      expect(r.bpm).toBeGreaterThanOrEqual(60)
      expect(r.bpm).toBeLessThanOrEqual(90)
      expect(r.pattern[0], 'starts with a ring').toBe(1)
      expect(r.pattern[r.pattern.length - 1], 'ends with a ring').toBe(1)
      // no two pauses in a row: the beat stays easy to feel
      expect(r.pattern.join('')).not.toContain('00')
      // the gaps between the rings are far wider than the window of a hit
      const times = ringTimes(r.bpm, r.pattern)
      for (let i = 1; i < times.length; i++) expect(times[i]! - times[i - 1]!).toBeGreaterThan(0.5)
    }
    expect(g.background).toBe(stage(11).image)
    expect(g.drum).not.toBe(g.ring)
  })

  it('6 verse: two rounds with two and three gaps (five in all); the right words are in the text of the stage; every round has a wrong word as well; the goal is 5', () => {
    const g = stage(6).task.verse
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.answers.length)).toEqual([2, 3])
    expect(g.rounds.reduce((sum, r) => sum + r.answers.length, 0)).toBe(5)
    const text = stage(6).text.join(' ')
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      expect(new Set(r.answers).size, 'every gap has its own word').toBe(r.answers.length)
      for (const a of r.answers) {
        expect(a).toBeLessThan(r.words.length)
        expect(text, r.words[a]).toContain(r.words[a]!)
      }
      expect(r.words.length, 'a wrong word or two as well').toBeGreaterThan(r.answers.length)
    }
    expect(g.background).toBe(stage(6).image)
    // the stage picture has big figures: drawn soft behind the board
    expect(g.soft).toBe(true)
  })

  it('7 hidden frogs: seven finds, four covers, a label for each; three frog pictures and three cover pictures; all inside the picture; every cover hides a find', () => {
    const f = stage(7).task.find
    expect(f, 'the game is built').toBeDefined()
    if (!f) return
    expect(stage(7).task.count).toBe(7)
    expect(f.finds).toHaveLength(7)
    expect(f.covers).toHaveLength(4)
    expect(f.labels).toHaveLength(7)
    expect(new Set(f.covers.map((t) => t.image)).size).toBe(3)
    // the text names the places of the frogs
    expect(stage(7).text.join(' ')).toMatch(/Backstube/)
    expect(stage(7).text.join(' ')).toMatch(/Schlafkammer/)
    for (const t of [...f.finds, ...f.covers]) {
      expect(t.x >= 0 && t.x <= 100 && t.y >= 0 && t.y <= 100).toBe(true)
    }
    // each cover stands just in front of a find (its middle is near the find's, a little lower)
    for (const c of f.covers) {
      const hides = f.finds.filter((t) => Math.abs(t.x - c.x) <= c.w / 2 && c.y - t.y >= 0 && c.y - t.y <= 10)
      expect(hides.length, `cover at ${c.x}/${c.y}`).toBeGreaterThanOrEqual(1)
    }
    expect(new Set(f.finds.map((t) => t.image)).size, 'three different frogs').toBe(3)
  })

  it('10 pack: two rounds fill the cloth exactly and can be packed; the pieces have names; the goal is 8', () => {
    const p = stage(10).task.pack
    expect(p, 'the game is built').toBeDefined()
    if (!p) return
    expect(p.rounds.map((r) => [r.cols, r.rows, r.items.length])).toEqual([[4, 3, 3], [5, 4, 5]])
    expect(p.rounds.reduce((sum, r) => sum + r.items.length, 0)).toBe(8)
    expect(new Set(p.items.map((i) => i.id)).size).toBe(p.items.length)
    for (const i of p.items) expect(i.label, i.id).toBeTruthy()
    for (const r of p.rounds) {
      const shapes = r.items.map((id) => {
        const it = p.items.find((i) => i.id === id)
        expect(it, id).toBeDefined()
        return { id, w: it!.w, h: it!.h }
      })
      expect(shapes.reduce((s, x) => s + x.w * x.h, 0), 'no cell left over').toBe(r.cols * r.rows)
      expect(solvable(r.cols, r.rows, shapes), 'the round can be packed').toBe(true)
    }
    expect(p.background).toBe(stage(10).image)
    // the text names what is packed
    const t10 = stage(10).text.join(' ')
    for (const w of ['Teig', 'Silber', 'Gold', 'Kleider']) expect(t10, w).toContain(w)
  })

  it('no stage is "soon": the first stage is open at the start, the others open one after the other', () => {
    expect(mose.stages.every((s) => !s.soon)).toBe(true)
    const open = mose.stages.map((_, i) => isStageOpen(mose, undefined, i))
    expect(open).toEqual([true, ...Array(14).fill(false)])
  })

  it('medal and gift are the ones of Josef until its own come; the gift has its final title', () => {
    expect(mose.medal).toBe(josef.medal)
    expect(mose.gift.title).toBe('Der Weg durch das Meer')
    expect(mose.gift.image).toBe(josef.gift.image)
  })

  it('every file that the data names exists (the pictures of Josef, the map, the medal) and is small enough', () => {
    let bytes = 0
    for (const f of journeyFiles(mose)) {
      if (notPaintedYet(f) && !existsSync(`public/${f}`)) continue
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(1_800_000)
      bytes += size
    }
    expect(bytes / 1_000_000, 'the placeholder pack in MB').toBeLessThan(20)
  })
})

describe('Mose: die Karte (Platzhalter von Josef)', () => {
  const m = mose.map
  it('vier Stücke eines Bildes (von Josef), fünfzehn Stationen von links nach rechts plus Ziel, nicht zu tief; der Perlenweg hat eine Strecke je Station (die letzte führt zum Ziel)', () => {
    expect(m.images).toEqual(josef.map.images)
    expect(m.stages).toHaveLength(15)
    expect(m.path).toHaveLength(15)
    expect(m.path).toBe(MOSE_PATH)
    const spots = [...m.stages, m.exam]
    spots.forEach((sp, i) => {
      expect(sp.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.66)
      if (i > 0) expect(sp.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
    })
    for (const seg of m.path) for (const [x, y] of seg) expect(x > 0 && x < 1 && y > 0 && y <= 0.8).toBe(true)
  })
})

describe('Mose: the lists for the recordings (NEUAUFNAHME-Mose.md) say exactly what the data says', () => {
  const de = 'D:/Claude/Abenteuer-Mose/stories-mose-v3-de.json'
  const en = 'D:/Claude/Abenteuer-Mose/ENGLISCH/stories-mose-v3-en.json'
  // the lists lie outside the repository (they belong to the drafts); on another computer there is nothing to compare
  it.runIf(existsSync(de) && existsSync(en))('German and English list (plan v3): fifteen entries, the same paragraphs as the data, no recording linked', () => {
    const read = (f: string) => JSON.parse(readFileSync(f, 'utf-8')) as { n: number; text: string[]; audio: string }[]
    const overlay = englishTextsOf(mose) as any
    setAdventureLanguage('de')
    const dl = read(de)
    const el = read(en)
    expect(dl).toHaveLength(15)
    expect(el).toHaveLength(15)
    mose.stages.forEach((s, i) => {
      expect(dl[i]!.n).toBe(s.id)
      expect(dl[i]!.text, `German list ${s.id}`).toEqual(s.text)
      expect(el[i]!.text, `English list ${s.id}`).toEqual(overlay.stages[i].text)
      expect(s.audio).toBeUndefined()
    })
  })
})

describe('Mose: English', () => {
  const overlay = englishTextsOf(mose) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, answers, exam questions) and no German word is left', () => {
    expect(overlay).toBeTruthy()
    expect(overlay.stages).toHaveLength(15)
    overlay.stages.forEach((e: any, i: number) => {
      const s = mose.stages[i]!
      setAdventureLanguage('de')
      const dePar = s.text.length
      const deQ = s.questions.map((q) => q.options.length)
      expect(e.text, `paragraphs ${s.id}`).toHaveLength(dePar)
      expect(e.questions.map((q: any) => q.options.length), `answers ${s.id}`).toEqual(deQ)
      expect(e.audio, `no English recording yet: ${s.id}`).toBeUndefined()
    })
    expect(overlay.exam).toHaveLength(6)
    const texts: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') texts.push(v)
      else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    take(overlay)
    for (const t of texts) expect(/[äöüßÄÖÜ]|\b(und|der|das|den|dem|nicht|ist|sind|ein|eine|einen)\b/.test(t), `German in: ${t}`).toBe(false)
  })

  it('every German text has an English one that is different; names follow the English Bible; the right answer stays first', () => {
    setAdventureLanguage('de')
    const de = mose.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q), ref: s.ref }))
    setAdventureLanguage('en')
    mose.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Exodus \d/)
    })
    expect(mose.title).toBe('Moses')
    expect(mose.subtitle).toBe('The Road to Freedom')
    expect(mose.gift.title).toBe('The Way Through the Sea')
    expect(adventureLanguage.value).toBe('en')
    expect(stage(1).text.join(' ')).toMatch(/Shiphrah and Puah/)
    expect(stage(3).text.join(' ')).toMatch(/Jethro/)
    expect(stage(11).text.join(' ')).toMatch(/sea/i)
    expect(stage(11).text.join(' ')).toMatch(/Miriam/)
    for (const q of [...mose.stages.flatMap((s) => s.questions), ...mose.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(stage(1).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
  })
})
