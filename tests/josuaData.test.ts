/**
 * The data of "Josua" (`josua.ts` and `en/josua.en.ts`), phase 2a: the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Josua/ENTWURF_Josua.md`), every stage has the game of the plan (the stages 7 and 9 only the questions) and a picture of Josef until the own pictures are built in, the map is the
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
import { covered, groupLanding } from '@/utils/josuaGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => josua.stages[n - 1]!
/** Words that no text of the German data may use (the fall of Jericho is told without fighting and without anything that is hurt). */
const FORBIDDEN = /\b(Messer|Schwert|Speer|Pfeil|Blut|töten|erschlagen|Teufel|Hölle)\b/i

describe('Josua: stories and questions', () => {
  it('ten stages with 3 or 4 paragraphs of 90 to 145 words (plan v3) and the Bible passage under every one; the German recordings; the stage pictures are the ones of Josef (PLATZHALTER)', () => {
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
      expect(s.audio, `German recording ${s.id}`).toBe(`audio/abenteuer/josua/geschichte-${String(s.id).padStart(2, '0')}-v3.mp3`)
      expect(existsSync(`public/${s.audio}`), `file ${s.audio}`).toBe(true)
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/josua/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
    expect(new Set(josua.stages.map((s) => s.image)).size).toBe(10)
  })

  it('two questions per stage, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    expect(josua.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
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
        // at least one word of the right answer (cut to its first five letters, for endings) lies in the text; an answer of only short words ("Ich bin mit dir.") must stand there as a whole
        const whole = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '')
        const hit = words.length ? words.some((w) => text.includes(w.slice(0, 5))) : text.includes(whole)
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

describe('Josua: the games, and the placeholders until the pictures come', () => {
  it('every stage has the game of the plan; the stages 1, 7 and 9 are only questions (never two in a row); two old mechanics (memory, verse), five new games', () => {
    expect(josua.stages.map((s) => s.task.kind)).toEqual(['quiz', 'verstecken', 'abseilen', 'jordan', 'memory', 'backen', 'quiz', 'still', 'quiz', 'lueckenvers'])
    for (const s of josua.stages) expect(s.task.hint.length, `hint ${s.id}`).toBeGreaterThan(8)
  })

  it('5 memory: five pairs from the stages 1 to 5, each with a sentence that is true to the text; 10 verse: two sentences from the text with the right words first', () => {
    const m = stage(5).task.memory
    expect(m, 'the game is built').toBeDefined()
    expect(m!.pairs).toHaveLength(5)
    const told = josua.stages.slice(0, 5).map((x) => x.text.join(' ')).join(' ')
    for (const word of ['mutig und stark', 'Flachs', 'Schnur', 'Lade', 'Steine']) expect(told, word).toContain(word)
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
    // the stage picture has big figures: the app draws it soft behind the board
    expect(v!.soft).toBe(true)
  })

  it('4 cross: the chest starts on the left bank and goes to the middle of the river, three groups wait on the left and land on the far bank; all places lie in the picture; two hints', () => {
    const g = stage(4).task.cross
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) expect(r.hint.length).toBeGreaterThan(8)
    expect(g.start[0]).toBeLessThan(g.middle[0])
    expect(g.middle[0]).toBeLessThan(g.farBank[0])
    expect(g.groups).toHaveLength(3)
    const inside = (p: [number, number]) => p[0] >= 0 && p[0] <= 100 && p[1] >= 0 && p[1] <= 100
    for (const p of [g.start, g.middle, g.farBank, ...g.groups]) expect(inside(p), JSON.stringify(p)).toBe(true)
    // the groups wait on the left bank (left of the middle), the far bank is on the right
    for (const p of g.groups) expect(p[0]).toBeLessThan(g.middle[0])
    // every landing place lies inside the picture and on the right of the middle
    g.groups.forEach((_, i) => {
      const l = groupLanding(g.farBank, i)
      expect(l.x >= 0 && l.x <= 100 && l.y >= 0 && l.y <= 100).toBe(true)
      expect(l.x).toBeGreaterThan(g.middle[0])
    })
    expect(g.background).toBe('images/abenteuer/spiele/josua/jordan/fluss.webp')
  })

  it('3 lower: four steps with a calm wind, then five with a stronger one; the swing is wider than the free threshold; the rope hangs from a window above the ground and the man fits in between', () => {
    const g = stage(3).task.lower
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.steps, r.period, r.amplitude, r.threshold])).toEqual([[4, 3.4, 12, 2], [5, 2.8, 14, 4]])
    for (const r of g.rounds) {
      expect(r.amplitude).toBeGreaterThan(r.threshold)
      expect(g.men.map((m) => m.id)).toContain(r.man)
    }
    expect(new Set(g.rounds.map((r) => r.man)).size).toBe(2)
    const manH = (g.men[0]!.w * (560 / 160)) / (4 / 3)
    expect(g.ground - g.window[1], 'room for the man').toBeGreaterThan(manH)
    expect(g.window[0] >= 0 && g.window[0] <= 100).toBe(true)
  })

  it('1 quiz: the first stage has no game (the packing game is the one of Mose)', () => {
    expect(stage(1).task.kind).toBe('quiz')
    expect(stage(1).task.pack).toBeUndefined()
    expect(stage(1).task.hint).toContain('ruhig')
  })

  it('6 bake: four flatbreads on three stones, then six on four; the golden time gets shorter, every stone has a place; the ball of dough and the stack have no picture of their own', () => {
    const g = stage(6).task.bake
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.dough, r.stones, r.goldenFrom, r.goldenTo])).toEqual([[4, 3, 2.5, 6], [6, 4, 2.2, 5]])
    expect(g.stonesAt).toHaveLength(4)
    for (const [x, y] of g.stonesAt) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
    expect(g.dough).toBeUndefined()
    expect(g.stack).toBeUndefined()
    expect(g.stackAt).toBeUndefined()
    // the golden time is at least two seconds long in both rounds, the dark time comes after it
    for (const r of g.rounds) {
      expect(r.goldenTo - r.goldenFrom).toBeGreaterThanOrEqual(2.5)
      expect(r.stones).toBeLessThanOrEqual(g.stonesAt.length)
      expect(r.dough).toBeGreaterThan(r.stones)
    }
    expect(g.rounds[1]!.goldenTo - g.rounds[1]!.goldenFrom).toBeLessThan(g.rounds[0]!.goldenTo - g.rounds[0]!.goldenFrom)
  })

  it('2 hide: one man and three bundles, then two men and five; every round can be won with real placements; the men lie on the roof and apart; the bundles are not too big', () => {
    const g = stage(2).task.hide
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.men.length, r.bundles.length])).toEqual([[1, 3], [2, 5]])
    const H = 4 / 3
    const man = (id: string) => {
      const m = g.men.find((x) => x.id === id)!
      return { x: m.x, y: m.y * H, w: m.w, h: m.h * H }
    }
    const at = (id: string, cx: number, cy: number) => {
      const b = g.bundles.find((x) => x.id === id)!
      return { x: cx - b.w / 2, y: cy - b.h / 2, w: b.w, h: b.h }
    }
    // round 1: two big bundles that lie a little over each other hide the man; the small one alone does not
    const a = man('mann-a')
    expect(covered(a, [at('gross-1', a.x + 15, a.y + 5.4), at('gross-2', a.x + 15, a.y + a.h - 5.4)])).toBe(true)
    expect(covered(a, [at('klein-1', a.x + 15, a.y + 5)])).toBe(false)
    // round 2: man a as before, man b with a big, a middle and a small bundle
    const b = man('mann-b')
    const bundlesB = [at('gross-3', b.x + 15, b.y + 5.4), at('mittel-1', b.x + 8.3 + 10.85, b.y + 2.5 + 5), at('klein-1', b.x + 7.5, b.y + 3.3 + 4.6)]
    expect(covered(b, bundlesB)).toBe(true)
    // the roof is 100 wide and 133 high: both men lie inside and do not touch
    for (const m of [a, b]) {
      expect(m.x).toBeGreaterThanOrEqual(0)
      expect(m.x + m.w).toBeLessThanOrEqual(100)
      expect(m.y + m.h).toBeLessThanOrEqual(100 * H)
    }
    expect(a.y + a.h).toBeLessThan(b.y)
    // all the bundles of a round are less than the roof: the area is smaller than a quarter of the roof
    for (const r of g.rounds) {
      const area = r.bundles.reduce((n, id) => n + g.bundles.find((x) => x.id === id)!.w * g.bundles.find((x) => x.id === id)!.h, 0)
      expect(area).toBeLessThan(100 * 100 * H * 0.25)
    }
  })

  it('8 hush: five calmings with at most two clouds and 4 seconds, then eight with two and 3 seconds; four places at the side of the road, one cloud picture for three sizes, the animals are not in the middle of the picture', () => {
    const g = stage(8).task.hush
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.calms, r.maxClouds, r.grow])).toEqual([[5, 2, 4], [8, 2, 3]])
    expect(g.spots).toHaveLength(4)
    expect(g.clouds).toHaveLength(3)
    expect(new Set(g.clouds).size, 'one picture of a cloud').toBe(1)
    expect(new Set(g.spots.map((s) => s.animal)).size).toBe(4)
    expect(g.background).toBe(stage(8).image)
    for (const s of g.spots) {
      expect(s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100, s.id).toBe(true)
      expect(s.y, 'at the side of the road, low in the picture').toBeGreaterThan(70)
    }
    // the places do not stand on each other
    for (let i = 1; i < g.spots.length; i++) expect(g.spots[i]!.x - g.spots[i - 1]!.x).toBeGreaterThan(g.spots[i]!.w * 0.9)
    // the most clouds at once are less than the places and less than the calmings of the round
    for (const r of g.rounds) {
      expect(r.maxClouds).toBeLessThan(g.spots.length)
      expect(r.maxClouds).toBeLessThan(r.calms)
    }
  })

  it('every game has at most two rounds, a hint for each round, and its goal fits the table "Stufen je Spiel"', () => {
    const g = (n: number) => stage(n).task
    const rounds = [g(2).hide!.rounds, g(3).lower!.rounds, g(4).cross!.rounds, g(6).bake!.rounds, g(8).hush!.rounds, g(10).verse!.rounds]
    for (const r of rounds) {
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r.length).toBeLessThanOrEqual(2)
      for (const x of r) expect(x.hint.length).toBeGreaterThan(8)
    }
    expect(g(2).hide!.rounds.reduce((n, r) => n + r.men.length, 0)).toBe(3)
    expect(g(3).lower!.rounds.reduce((n, r) => n + r.steps, 0)).toBe(9)
    expect(1 + g(4).cross!.groups.length).toBe(4)
    expect(g(5).memory!.pairs.length).toBe(5)
    expect(g(6).bake!.rounds.reduce((n, r) => n + r.dough, 0)).toBe(10)
    expect(g(8).hush!.rounds.reduce((n, r) => n + r.calms, 0)).toBe(13)
    expect(g(10).verse!.rounds.reduce((n, r) => n + r.answers.length, 0)).toBe(3)
    const kinds = josua.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(kinds).size).toBe(kinds.length)
    expect(kinds.filter((k) => ['memory', 'lueckenvers'].includes(k))).toHaveLength(2)
    for (const n of [1, 7, 9]) expect(stage(n).task.kind).toBe('quiz')
    const kindList = josua.stages.map((s) => s.task.kind)
    kindList.forEach((k, i) => expect(k === 'quiz' && kindList[i + 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false))
  })

  it('no stage is "soon": the first stage is open at the start, the others open one after the other', () => {
    expect(josua.stages.every((s) => !s.soon)).toBe(true)
    const open = josua.stages.map((_, i) => isStageOpen(josua, undefined, i))
    expect(open).toEqual([true, false, false, false, false, false, false, false, false, false])
  })

  it('no stage picture and no game background is a picture of Josef any more (only map, medal and gift are placeholders)', () => {
    const names = JSON.stringify(josua.stages.map((s) => [s.image, s.task]))
    expect(names).not.toContain('abenteuer/josef/')
    for (const s of josua.stages) expect(existsSync(`public/${s.image}`), s.image).toBe(true)
  })

  it('medal and gift are the ones of Josef until its own come; the gift has its final title', () => {
    expect(josua.medal).toBe(josef.medal)
    expect(josua.gift.title).toBe('Die Posaunen von Jericho')
    expect(josua.gift.image).toBe(josef.gift.image)
  })

  it('every file that the data names exists (the own stage pictures, the map and medal of Josef) and is small enough', () => {
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
