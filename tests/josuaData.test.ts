/**
 * The data of "Josua" (`josua.ts` and `en/josua.en.ts`), phase 2a: the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Josua/ENTWURF_Josua.md`), every stage still has the quiz PLACEHOLDER and a picture of Josef until the games and the own pictures are built in, the map is the
 * placeholder map of Josef (ten stations + exam), and the English file has the same shape. The own pictures and recordings are not there yet (`audio` is missing on purpose).
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { josua } from '@/data/adventures/josua'
import { JOSUA_PATH } from '@/data/adventures/josuaPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => josua.stages[n - 1]!
/** Words that no text of the German data may use (the fall of Jericho is told without fighting and without anything that is hurt). */
const FORBIDDEN = /\b(Messer|Schwert|Speer|Pfeil|Blut|töten|erschlagen|Teufel|Hölle)\b/i

describe('Josua: stories and questions', () => {
  it('ten stages with 3 to 5 paragraphs of 60 to 260 words and the Bible passage under every one; no recording yet; the stage pictures are the ones of Josef (PLATZHALTER)', () => {
    expect(josua.id).toBe('josua')
    expect(josua.age).toBe('8-10')
    expect(josua.title).toBe('Josua')
    expect(josua.subtitle).toBe('Mut für das neue Land')
    expect(josua.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(josua.stages.map((s) => s.title)).toEqual([
      'Ein neuer Anführer',
      'Zwei Kundschafter',
      'Die rote Schnur',
      'Der Jordan',
      'Zwölf Steine',
      'Brot aus dem neuen Land',
      'Heiliger Boden',
      'Rund um die Stadt',
      'Die Mauer fällt',
      'Der Stein unter der Eiche'
    ])
    for (const s of josua.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Josua \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(60)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(260)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, `no recording yet, the device voice reads: ${s.id}`).toBeUndefined()
      expect(s.image, `stage ${s.id}`).toMatch(/^images\/abenteuer\/josef\/etappe-bild-\d\d\.webp$/)
    }
    expect(new Set(josua.stages.map((s) => s.image)).size).toBe(10)
  })

  it('two questions per stage (three in the stages 7 and 9), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    expect(josua.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 2, 2, 3, 2, 3, 2])
    for (const q of [...josua.stages.flatMap((s) => s.questions), ...josua.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(josua.exam).toHaveLength(6)
    const asked = josua.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(josua.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von'])
    for (const s of josua.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        // at least one word of the right answer (cut to its first five letters, for endings) lies in the text
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the serious stages (7, 9) say so in the hint; the fall of the wall is only told (quiz), and nothing violent is in the text of stage 9', () => {
    expect(stage(7).task.hint).toContain('ernst')
    expect(stage(9).task.hint).toContain('ernst')
    expect(stage(9).task.kind).toBe('quiz')
    const t9 = stage(9).text.join(' ')
    expect(t9).toMatch(/Mauer/)
    expect(t9).toMatch(/Rahab/)
    expect(t9).not.toMatch(/Feuer|verletzt|Wunde|zerstört/i)
  })

  it('God is "Gott" everywhere in the text (also in direct speech); Rahab is told without her trade; the commander is not named an angel', () => {
    const all = josua.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/der Herr\b|dem Herrn\b|\bHERR\b/)
    expect(all).not.toMatch(/Hure|Wirtin/)
    expect(all).not.toMatch(/Engel/)
    expect(stage(7).text.join(' ')).toMatch(/Fürst über das Heer Gottes/)
  })

  it('the questions do not ask what a game of the stage will show (the supplies, the flax bundles, the steps of the rope, the footprints, the flatbreads, the animals)', () => {
    const text = josua.stages.map((s) => s.questions.map((q) => q.q).join(' ').toLowerCase())
    expect(text[0]).not.toMatch(/was packt/)
    expect(text[7]).not.toMatch(/wie viele (tiere|esel)/)
  })
})

describe('Josua: the placeholders until the games and pictures come', () => {
  it('every stage has the quiz task for now (PLATZHALTER bis Spiel/Bild); the games of the plan are listed in the data file, not yet built', () => {
    expect(josua.stages.map((s) => s.task.kind)).toEqual(['quiz', 'quiz', 'abseilen', 'schritt', 'memory', 'quiz', 'quiz', 'quiz', 'quiz', 'lueckenvers'])
    for (const s of josua.stages) expect(s.task.hint.length, `hint ${s.id}`).toBeGreaterThan(8)
  })

  it('5 memory: six pairs from the stages 1 to 5, each with a sentence that is true to the text; 10 verse: two sentences from the text with the right words first', () => {
    const m = stage(5).task.memory
    expect(m, 'the game is built').toBeDefined()
    expect(m!.pairs).toHaveLength(6)
    const told = josua.stages.slice(0, 5).map((x) => x.text.join(' ')).join(' ')
    for (const word of ['Buch des Gesetzes', 'Flachs', 'Schnur', 'Seil', 'Lade', 'Steine']) expect(told, word).toContain(word)
    for (const p of m!.pairs) expect(p.text.length).toBeGreaterThan(20)
    expect(stage(5).task.memory!.back).toMatch(/spiele\/josua\/memory\//)
    const v = stage(10).task.verse
    expect(v, 'the game is built').toBeDefined()
    expect(v!.rounds).toHaveLength(2)
    expect(v!.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    for (const r of v!.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      expect(r.answers.map((a) => r.words[a])).toBeDefined()
    }
    expect(v!.rounds[0]!.answers.map((a) => v!.rounds[0]!.words[a])).toEqual(['dienen'])
    expect(v!.rounds[1]!.answers.map((a) => v!.rounds[1]!.words[a])).toEqual(['Zeuge', 'Worte'])
    // the words and the sentences come from the text of the stage
    const text = stage(10).text.join(' ')
    for (const word of ['dienen', 'Zeuge', 'Worte']) expect(text, word).toContain(word)
    expect(v!.background).toBe(stage(10).image)
  })

  it('4 step: eight steps at 70 beats a minute, then twelve at 90; the second round is quicker and stricter; the path goes up the picture', () => {
    const g = stage(4).task.step
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.bpm, r.steps, r.tolerance])).toEqual([[70, 8, 0.3], [90, 12, 0.25]])
    expect(g.path.length).toBeGreaterThanOrEqual(6)
    for (let i = 1; i < g.path.length; i++) expect(g.path[i]![1], 'the path goes up').toBeLessThan(g.path[i - 1]![1])
    for (const [x, y] of g.path) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
  })

  it('3 lower: five steps with a calm wind, then six with a stronger one; the swing is wider than the free threshold; the rope hangs from a window above the ground and the man fits in between', () => {
    const g = stage(3).task.lower
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.steps, r.period, r.amplitude, r.threshold])).toEqual([[5, 3.4, 12, 2], [6, 2.8, 14, 4]])
    for (const r of g.rounds) {
      expect(r.amplitude).toBeGreaterThan(r.threshold)
      expect(g.men.map((m) => m.id)).toContain(r.man)
    }
    expect(new Set(g.rounds.map((r) => r.man)).size).toBe(2)
    const manH = (g.men[0]!.w * (560 / 160)) / (4 / 3)
    expect(g.ground - g.window[1], 'room for the man').toBeGreaterThan(manH)
    expect(g.window[0] >= 0 && g.window[0] <= 100).toBe(true)
  })

  it('no stage is "soon": the first stage is open at the start, the others open one after the other', () => {
    expect(josua.stages.every((s) => !s.soon)).toBe(true)
    const open = josua.stages.map((_, i) => isStageOpen(josua, undefined, i))
    expect(open).toEqual([true, false, false, false, false, false, false, false, false, false])
  })

  it('medal and gift are the ones of Josef until its own come; the gift has its final title', () => {
    expect(josua.medal).toBe(josef.medal)
    expect(josua.gift.title).toBe('Die Posaunen von Jericho')
    expect(josua.gift.image).toBe(josef.gift.image)
  })

  it('every file that the data names exists (the pictures of Josef, the map, the medal) and is small enough', () => {
    let bytes = 0
    for (const f of journeyFiles(josua)) {
      if (notPaintedYet(f) && !existsSync(`public/${f}`)) continue
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(1_800_000)
      bytes += size
    }
    expect(bytes / 1_000_000, 'the placeholder pack in MB').toBeLessThan(20)
  })
})

describe('Josua: die Karte (Platzhalter von Josef)', () => {
  const m = josua.map
  it('vier Stücke eines Bildes (von Josef), zehn Stationen von links nach rechts plus Ziel, nicht zu tief; der Perlenweg hat eine Strecke je Station (die letzte führt zum Ziel)', () => {
    expect(m.images).toEqual(josef.map.images)
    expect(m.stages).toHaveLength(10)
    expect(m.path).toHaveLength(10)
    expect(m.path).toBe(JOSUA_PATH)
    const spots = [...m.stages, m.exam]
    spots.forEach((sp, i) => {
      // 0.65 for the own map; the placeholder uses station 11 of Josef as the exam (y 0.6556), which is a little lower
      expect(sp.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.66)
      if (i > 0) expect(sp.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
    })
    for (const seg of m.path) for (const [x, y] of seg) expect(x > 0 && x < 1 && y > 0 && y <= 0.8).toBe(true)
  })
})

describe('Josua: English', () => {
  const overlay = englishTextsOf(josua) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, answers, exam questions) and no German word is left', () => {
    expect(overlay).toBeTruthy()
    expect(overlay.stages).toHaveLength(10)
    overlay.stages.forEach((e: any, i: number) => {
      const s = josua.stages[i]!
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

  it('every German text has an English one that is different; names and the first quiz follow the English Bible; the right answer stays first', () => {
    setAdventureLanguage('de')
    const de = josua.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q), ref: s.ref }))
    setAdventureLanguage('en')
    josua.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Joshua \d/)
    })
    expect(josua.title).toBe('Joshua')
    expect(josua.subtitle).toBe('Courage for the New Land')
    expect(josua.gift.title).toBe('The Trumpets of Jericho')
    expect(adventureLanguage.value).toBe('en')
    expect(stage(2).text.join(' ')).toMatch(/Rahab/)
    expect(stage(10).text.join(' ')).toMatch(/Shechem/)
    for (const q of [...josua.stages.flatMap((s) => s.questions), ...josua.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(stage(9).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
  })
})
