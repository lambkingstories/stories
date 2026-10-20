/**
 * The data of "Abraham" (`abraham.ts` and `en/abraham.en.ts`): the stories and questions follow the rules of the adventures, the games are the ones the Leitung chose
 * (at most two old mechanics; stages 7 and 9 are only questions; the stages 4, 5, 10 and 11 of the extension to eleven stages hold the games birds, rings, silver and clues), the data of every game is complete and consistent, and the English file has the same shape. Until the stages are released (`soon`) none can be opened; once they are released the files that the data names must exist, too.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { abraham } from '@/data/adventures/abraham'
import { ABRAHAM_PATH } from '@/data/adventures/abrahamPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { birdAngle, cluesSolutions, distToLine, isAligned, lineEnd, onRay, ringsSolvable, solutions, total } from '@/utils/abrahamGames'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const released = abraham.stages.every((s) => !s.soon)
const stage = (n: number) => abraham.stages[n - 1]!
/** Words that no text of the German data may use (stage 6 is told calmly: no knife, no binding, no killing). */
/** The version of the recording per stage: a stage revised again after the first rewrite has a newer file name. */
const DE_V: Record<number, string> = { 6: 'v3' }
const EN_V: Record<number, string> = { 1: 'v3', 3: 'v3', 6: 'v3' }
/** The stages that have a recording so far (the new stages 4, 5, 7, 10, 11 and the extended stage 9 wait for the speech AI quota): the others have none. */
const RECORDED = [1, 2, 3, 6, 8]
/** The picture of every stage: the new stages use a picture of the others until they get their own. */
const PICTURE: Record<number, string> = { 1: '01', 2: '02', 3: '03', 4: '02', 5: '03', 6: '04', 7: '04', 8: '05', 9: '06', 10: '05', 11: '01' }
const FORBIDDEN = /\b(Messer|Schwert|gefesselt|Fesseln|Fesselung|töten|getötet|schlachten|Blut|Teufel|Hölle)\b/i

describe('Abraham: stories and questions', () => {
  it('eleven stages with 3 to 5 paragraphs of 60 to 220 words, the Bible passage under every one, the recording and picture names of the plan', () => {
    expect(abraham.id).toBe('abraham')
    expect(abraham.age).toBe('8-10')
    expect(abraham.title).toBe('Abraham')
    expect(abraham.subtitle).toBe('Gott ruft, Gott hält Wort')
    expect(abraham.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(abraham.stages.map((s) => [s.title, s.ref])).toEqual([
      ['Der Ruf', '1. Mose 12,1–9'],
      ['Abram und Lot', '1. Mose 13'],
      ['Die Sterne', '1. Mose 15,1–6'],
      ['Hagar und der Brunnen', '1. Mose 16'],
      ['Der Bund und die neuen Namen', '1. Mose 17,1–8.15–19'],
      ['Besuch bei den Eichen', '1. Mose 18,1–15'],
      ['Abraham bittet für Sodom', '1. Mose 18,16–33'],
      ['Isaak', '1. Mose 21,1–7'],
      ['Gott sorgt', '1. Mose 22,1–19'],
      ['Saras Grab', '1. Mose 23'],
      ['Eine Frau für Isaak', '1. Mose 24']
    ])
    for (const s of abraham.stages) {
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(60)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(220)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, s.id.toString()).toBe(RECORDED.includes(s.id) ? `audio/abenteuer/abraham/geschichte-${String(s.id).padStart(2, '0')}-${DE_V[s.id] ?? 'v2'}.mp3` : undefined)
      expect(s.image).toBe(`images/abenteuer/abraham/etappe-bild-${PICTURE[s.id]}.webp`)
    }
  })

  it('two questions per stage (three in the serious stage 9), three answers each, the right one first and the answers differ; the exam has six', () => {
    expect(abraham.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2])
    for (const q of [...abraham.stages.flatMap((s) => s.questions), ...abraham.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(abraham.exam).toHaveLength(6)
    const asked = abraham.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    // the exam asks about the whole story, one question for each stage, in its own words
    expect(new Set(abraham.exam.map((q) => q.q)).size).toBe(6)
  })

  it('stage 9 is told calmly: no knife, no binding, no fire; the voice from heaven ends it, nobody is harmed, and the second blessing (22,15-18) closes it', () => {
    const t = stage(9).text.join(' ')
    expect(t).toMatch(/Stimme vom Himmel/)
    expect(t).toMatch(/Widder/)
    expect(t).toMatch(/alle Völker gesegnet/)
    expect(t).not.toMatch(/Feuer|Messer|Hand aus|binden|band/i)
  })

  it('stage 7 (Sodom) shows no destruction (only the hope that God brings Lot to safety), stage 10 mentions Sara\'s death in one quiet sentence and no circumcision is told in stage 5', () => {
    const sodom = stage(7).text.join(' ')
    expect(sodom).toMatch(/zehn/i)
    expect(sodom).toMatch(/Lot in Sicherheit/)
    expect(sodom).not.toMatch(/Feuer|Schwefel|vernichte|zerstör|Untergang|Asche|Salzsäule/i)
    const grab = stage(10).text.join(' ')
    expect(grab.match(/stirbt|gestorben|Tod/g) ?? []).toHaveLength(1)
    expect(stage(5).text.join(' ')).not.toMatch(/beschnitt|Beschneidung|Zeichen am Körper/i)
  })

  it('the questions do not ask what the game of the stage already showed (the weights, the number of animals, the shape of the constellation)', () => {
    const text = abraham.stages.map((s) => s.questions.map((q) => q.q).join(' ').toLowerCase())
    expect(text[0]).not.toMatch(/gewicht|wie viele pakete|kamel/)
    expect(text[1]).not.toMatch(/wie viele (schafe|tiere|ziegen)/)
    expect(text[2]).not.toMatch(/form|wie viele sterne/)
    expect(text[5]).not.toMatch(/wie viele krüge|schüssel/)
  })
})

describe('Abraham: every stage has the game that was chosen', () => {
  const OLD = ['zaehlen', 'puzzle', 'weg', 'ernten', 'memory', 'sortieren', 'wimmelbild', 'ausmalen', 'teilen', 'bauen', 'punkte', 'steuern']
  const NEW = ['reihenfolge', 'lichter', 'hueten', 'kanaele', 'lueckenvers', 'spiegeln', 'echo', 'saeen', 'fehlt', 'kette', 'stapeln', 'wischen', 'spur']

  it('the games in the order of the plan; stage 9 is only the questions; at most two old mechanics and three new ones', () => {
    // stages 7 and 9 are only questions; all the other new stages have their game
    expect(abraham.stages.map((s) => s.task.kind)).toEqual(['waage', 'zaehlen', 'sternbild', 'voegel', 'ringe', 'giessen', 'quiz', 'puzzle', 'quiz', 'silber', 'hinweise'])
    const kinds = abraham.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(kinds).size).toBe(kinds.length)
    // "old" = a game that a journey before this one (Josef, Noah, Adam und Eva, Babel) already had; the pouring game was built for Noah but never used there
    const old = kinds.filter((k) => OLD.includes(k))
    expect(old.sort()).toEqual(['puzzle', 'zaehlen'])
    for (const k of ['waage', 'sternbild', 'giessen']) expect([...OLD, ...NEW], k).not.toContain(k)
    expect(stage(9).task.kind).toBe('quiz')
    expect(stage(9).task.hint).toContain('ernst')
  })

  it('every game has at most two rounds, a hint for each round, and its goal fits the table "Stufen je Spiel"', () => {
    const g = (n: number) => stage(n).task
    const rounds = [g(1).balance!.rounds, g(3).constellation!.rounds, g(6).water!.rounds, g(4).birds!.rounds, g(5).rings!.rounds, g(10).silver!.rounds, g(11).clues!.rounds]
    for (const r of rounds) {
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r.length).toBeLessThanOrEqual(2)
      for (const x of r) expect(x.hint.length).toBeGreaterThan(8)
    }
    // the goals (the number of right moves of all rounds)
    expect(g(1).balance!.rounds.reduce((s, r) => s + r.camels.length, 0)).toBe(4)
    expect(g(3).constellation!.rounds.reduce((s, r) => s + r.targets.length, 0)).toBe(10)
    const w = g(6).water!
    const need = (id: string) => w.plants.find((p) => p.id === id)!.need
    expect(w.rounds.reduce((s, r) => s + r.plants.reduce((n, id) => n + need(id), 0), 0)).toBe(9)
    // the goals of the four newer games: springs found, rings in the light, rounds paid, clue cards that are true
    expect(g(4).birds!.rounds.reduce((n, r) => n + r.tasks.length, 0)).toBe(6)
    expect(g(5).rings!.rounds.reduce((n, r) => n + r.start.length, 0)).toBe(7)
    expect(g(10).silver!.rounds.length).toBe(2)
    expect(g(11).clues!.rounds.reduce((n, r) => n + r.clues.length, 0)).toBe(7)
    expect(g(2).count).toBe(13)
    expect(g(2).groups!.reduce((s, x) => s + x.count, 0)).toBe(13)
    expect(g(8).puzzle).toMatchObject({ cols: 2, rows: 3 })
  })

  it('1 camels: ten packs in three weights with a picture and a name, round 1 three packs on each of two camels, round 2 five; the baskets hang left and right', () => {
    const b = stage(1).task.balance!
    const ids = b.packs.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of b.packs) {
      expect([1, 2, 3]).toContain(p.weight)
      expect(p.label.length).toBeGreaterThan(4)
    }
    // the weight can be told from the size of the picture: a pack of the same weight has the same picture, and the three weights have three pictures
    expect(new Set(b.packs.map((p) => `${p.weight} ${p.image}`)).size).toBe(3)
    for (const r of b.rounds) for (const c of r.camels) {
      expect(new Set(c.packs).size, 'a pack twice on a camel').toBe(c.packs.length)
      for (const id of c.packs) expect(ids).toContain(id)
    }
    expect(b.baskets![0][0]).toBeLessThan(b.baskets![1][0])
    expect(b.background).toBe('images/abenteuer/abraham/etappe-bild-01.webp')
  })

  it('2 counting: three kinds of animals of both herds, the question asks for all of them together, the background is the stage picture', () => {
    const t = stage(2).task
    expect(t.groups).toHaveLength(3)
    expect(t.question).toMatch(/zusammen/)
    expect(t.background).toBe('images/abenteuer/abraham/etappe-bild-02.webp')
  })

  it('3 constellation: the frame lies in the upper part of the sky and is wide enough, the model has room beside it; the star is the gold star of the screens', () => {
    const c = stage(3).task.constellation!
    expect(c.frame.x + c.frame.w).toBeLessThanOrEqual(100)
    expect(c.frame.y + c.frame.h).toBeLessThanOrEqual(70)
    expect(c.frame.w).toBeGreaterThanOrEqual(40)
    // the model (3 % from the left, 24 % wide) does not touch the frame
    expect(c.frame.x).toBeGreaterThan(3 + 24)
    expect(c.star).toBe('images/abenteuer/ui/stern-gold-1.webp')
    expect(c.background).toBe('images/abenteuer/abraham/etappe-bild-03.webp')
  })

  it('6 water for the guests: three bowls in each round that need one jug and then two; the well is a rectangle in the picture; the bowls lie inside it', () => {
    const w = stage(6).task.water!
    const ids = w.plants.map((p) => p.id)
    for (const r of w.rounds) for (const id of r.plants) expect(ids).toContain(id)
    expect(w.rounds.map((r) => r.plants.length)).toEqual([3, 3])
    expect(w.rounds[0]!.plants.every((id) => w.plants.find((p) => p.id === id)!.need === 1)).toBe(true)
    expect(w.rounds[1]!.plants.every((id) => w.plants.find((p) => p.id === id)!.need === 2)).toBe(true)
    for (const p of w.plants) {
      expect(p.label.length).toBeGreaterThan(8)
      expect(p.x - p.w / 2).toBeGreaterThanOrEqual(0)
      expect(p.x + p.w / 2).toBeLessThanOrEqual(100)
      expect(p.y).toBeLessThanOrEqual(95)
    }
    expect(w.river.x + w.river.w).toBeLessThanOrEqual(100)
    expect(w.river.y + w.river.h).toBeLessThanOrEqual(100)
  })

  it('4 birds: two rounds of three tasks, the paths lie on the way to the meeting point and the meeting points lie in the lower half; the birds differ in direction, the decoy misses by far', () => {
    const g = stage(4).task.birds
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.tasks.length)).toEqual([3, 3])
    expect(g.rounds.map((r) => r.tasks.map((t) => t.birds.length))).toEqual([[2, 2, 2], [3, 3, 3]])
    expect(g.rounds[0]!.tasks.some((t) => t.decoy)).toBe(false)
    expect(g.rounds[1]!.tasks.every((t) => t.decoy)).toBe(true)
    expect(g.radius).toBe(8)
    for (const [ri, r] of g.rounds.entries()) {
      for (const t of r.tasks) {
        expect(t.target[1], 'meeting point in the lower half').toBeGreaterThan(50)
        for (const b of t.birds) {
          expect(b.from[1], 'bird starts in the sky').toBeLessThanOrEqual(35)
          expect(b.shown).toBeGreaterThanOrEqual(0.3)
          expect(b.shown).toBeLessThanOrEqual(0.7)
          // a round 2 path is drawn to 40 % only
          if (ri === 1) expect(b.shown).toBeLessThanOrEqual(0.4)
          const end = lineEnd(b.from, t.target, b.shown)
          expect(onRay(b.from, [end.x, end.y], t.target)).toBe(true)
        }
        const angles = t.birds.map((b) => birdAngle(t.target, b.from)).sort((a, b) => a - b)
        for (let i = 1; i < angles.length; i++) expect(angles[i]! - angles[i - 1]!, 'the birds come from different directions').toBeGreaterThanOrEqual(25)
        if (t.decoy) expect(distToLine(t.decoy.from, t.decoy.to, t.target), 'the decoy misses the meeting point').toBeGreaterThanOrEqual(15)
      }
    }
    expect(g.bird).toHaveLength(2)
  })

  it('11 clues: three camels and three cards, then four and four; exactly one row makes all the cards true and it is the one written down; the slots lie in a row from the well', () => {
    const g = stage(11).task.clues
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.blankets.length, r.clues.length])).toEqual([[3, 3], [4, 4]])
    for (const r of g.rounds) {
      expect(cluesSolutions(r.blankets, r.clues)).toEqual([r.solution])
      for (const id of r.blankets) expect(g.blankets.map((b) => b.id)).toContain(id)
      for (const c of r.clues) {
        const used = c.kind === 'at' || c.kind === 'notAt' ? [c.blanket] : [c.a, c.b]
        for (const id of used) expect(r.blankets, `clue names ${id}`).toContain(id)
      }
    }
    expect(g.slots.length).toBeGreaterThanOrEqual(4)
    for (let i = 1; i < g.slots.length; i++) expect(g.slots[i]![0]).toBeGreaterThan(g.slots[i - 1]![0])
    for (const [x, y] of g.slots) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
    for (const b of g.blankets) expect(b.pattern.length).toBeGreaterThan(2)
  })

  it('5 rings: three rings alone, then four joined in pairs; every start is turned (1 to 11) and can be lined up; four ring pictures from outside to inside, the hub and the beam', () => {
    const g = stage(5).task.rings
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.start.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.couple.length)).toEqual([0, 2])
    expect(g.rings).toHaveLength(4)
    for (const r of g.rounds) {
      for (const s of r.start) {
        expect(s).toBeGreaterThanOrEqual(1)
        expect(s).toBeLessThanOrEqual(11)
      }
      expect(isAligned(r.start), 'never solved at the start').toBe(false)
      expect(ringsSolvable(r.start, r.couple), 'solvable').toBe(true)
      for (const [a, b] of r.couple) {
        expect(a).toBeLessThan(b)
        expect(b).toBeLessThan(r.start.length)
      }
    }
    expect(g.background).toBe(stage(5).image)
  })

  it('10 silver: three sizes of heaps with their worth in steps of 25, every round pays four hundred with at least one way and not by laying everything, round 1 shows the sum, round 2 not', () => {
    const g = stage(10).task.silver
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.price, r.showSum])).toEqual([[400, true], [400, false]])
    for (const p of g.pieces) {
      expect(p.value % 25, p.id).toBe(0)
      const size = /gross/.test(p.image) ? 'gross' : /mittel/.test(p.image) ? 'mittel' : 'klein'
      expect(size, `${p.id} picture fits ${p.value}`).toBe(p.value <= 50 ? 'klein' : p.value <= 125 ? 'mittel' : 'gross')
    }
    for (const r of g.rounds) {
      const values = r.pieces.map((id) => g.pieces.find((p) => p.id === id)!.value)
      expect(solutions(values, r.price).length).toBeGreaterThan(0)
      expect(total(values)).toBeGreaterThan(r.price)
    }
    expect(g.background).toBe(stage(10).image)
  })

  it('every picture and recording that the games name lies in the folders that only this adventure uses (or is one of the shared screens)', () => {
    const paths: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') {
        if (/^(images|audio)\//.test(v)) paths.push(v)
      } else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    take(abraham)
    expect(paths.length).toBeGreaterThan(30)
    for (const p of paths) {
      if (p === abraham.map.ring || p.startsWith('images/abenteuer/ui/')) continue
      expect(/^(images\/abenteuer\/abraham\/|images\/abenteuer\/spiele\/abraham\/|audio\/abenteuer\/abraham\/)/.test(p), p).toBe(true)
    }
  })
})

describe('Abraham: die Karte', () => {
  const m = abraham.map
  // the painted map is 9908 x 1648 px (the height of the picture is the unit of the ring and of the lowest fifth)
  const W = 9908
  const H = 1648
  it('vier Stücke eines Bildes, jedes unter 1,8 MB; Stationen von links nach rechts, nicht zu tief und nicht zu dicht', () => {
    expect(m.images).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/abraham/karte-pano-v2-${n}.webp`))
    for (const f of m.images) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(1800)
    expect(m.widthPx).toBe(W)
    expect(m.aspect).toBeCloseTo(W / H, 3)
    expect(m.stages).toHaveLength(11)
    const spots = [...m.stages, m.exam]
    for (let i = 0; i < spots.length; i++) {
      expect(spots[i]!.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.65)
      expect(spots[i]!.d).toBeCloseTo((336 * H) / 1648 / W, 3)
      if (i > 0) {
        expect(spots[i]!.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
        // two rings (170 px) do not touch: at least 172 px apart
        expect(Math.hypot((spots[i]!.x - spots[i - 1]!.x) * W, (spots[i]!.y - spots[i - 1]!.y) * H)).toBeGreaterThanOrEqual(172)
      }
    }
  })
  it('nichts liegt in den unteren 20 % der Karte; der Perlenweg hat eine Strecke je Etappe (die letzte führt zum Ziel) und alle Perlen liegen im Bild', () => {
    for (const sp of [...m.stages, m.exam]) expect(sp.y * H, 'Ring-Mitte').toBeLessThanOrEqual(0.65 * H)
    expect(m.path).toHaveLength(11)
    for (const seg of m.path) {
      for (const [x, y] of seg) {
        expect(y * H, 'Perle').toBeLessThanOrEqual(0.8 * H)
        expect(x > 0 && x < 1 && y > 0 && y < 1).toBe(true)
      }
    }
  })
})

describe('Abraham: the scaffold', () => {
  it('until the pictures and recordings are built in all stages are "soon" (none opens, nothing is downloaded, no map yet); afterwards only the first opens at the start', () => {
    expect(abraham.gift.title).toBe('Abraham und Sara vor dem Zelt unter dem Sternenhimmel')
    expect(abraham.exam).toHaveLength(6)
    expect(abraham.stages.every((s) => !s.soon) || abraham.stages.every((s) => s.soon)).toBe(true)
    const open = abraham.stages.map((_, i) => isStageOpen(abraham, undefined, i))
    if (!released) {
      expect(open).toEqual(abraham.stages.map(() => false))
      // nothing of a game or of a recording is downloaded while all stages are soon
      const own = journeyFiles(abraham).filter((f) => f.includes('abraham/'))
      expect(own.filter((f) => f.includes('spiele/') || f.startsWith('audio/'))).toEqual([])
    } else {
      expect(open).toEqual([true, false, false, false, false, false, false, false, false, false, false])
    }
    // the painted map and the way are there
    expect(abraham.map.images).toHaveLength(4)
    expect(ABRAHAM_PATH).toHaveLength(11)
  })
})

describe('Abraham: English', () => {
  const overlay = englishTextsOf(abraham) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, rounds, packs, bowls, hints) and no German word is left', () => {
    expect(overlay).toBeTruthy()
    const problems: string[] = []
    const same = (de: any, en: any, path: string) => {
      if (en === undefined || en === null) return
      if (Array.isArray(en)) {
        if (!Array.isArray(de) || de.length !== en.length) problems.push(`${path}: ${en.length} entries, German has ${Array.isArray(de) ? de.length : 'none'}`)
        else en.forEach((e, i) => same(de[i], e, `${path}[${i}]`))
      } else if (typeof en === 'object') {
        if (!de || typeof de !== 'object') problems.push(`${path}: no German counterpart`)
        else for (const k of Object.keys(en)) same(de[k], en[k], `${path}.${k}`)
      }
    }
    setAdventureLanguage('de')
    same(abraham, overlay, 'abraham')
    expect(problems).toEqual([])
    const texts: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') texts.push(v)
      else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    take(overlay)
    for (const t of texts.filter((x) => !x.startsWith('audio/'))) expect(/[äöüßÄÖÜ]|\b(und|der|das|den|dem|nicht|ist|sind|ein|eine|einen)\b/.test(t), `German in: ${t}`).toBe(false)
  })

  it('every German text of the stages has an English one that is different, with the recordings of the English voice and the English passages; the names follow the English Bible', () => {
    setAdventureLanguage('de')
    const de = abraham.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q) }))
    setAdventureLanguage('en')
    abraham.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Genesis \d/)
      expect(s.audio, `audio ${s.id}`).toBe(RECORDED.includes(s.id) ? `audio/abenteuer/abraham/geschichte-${String(s.id).padStart(2, '0')}-en-${EN_V[s.id] ?? 'v2'}.mp3` : undefined)
    })
    expect(abraham.title).toBe('Abraham')
    expect(abraham.subtitle).toBe('God Calls, God Keeps His Word')
    expect(adventureLanguage.value).toBe('en')
    expect(stage(6).text.join(' ')).toMatch(/Sarah/)
    expect(stage(8).text.join(' ')).toMatch(/Isaac/)
    expect(stage(4).text.join(' ')).toMatch(/Hagar/)
    expect(stage(11).text.join(' ')).toMatch(/Rebekah/)
    for (const q of [...abraham.stages.flatMap((s) => s.questions), ...abraham.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    // the packs and bowls have English names, too, and the counting question is English
    for (const p of stage(1).task.balance!.packs) expect(p.label).toMatch(/^[A-Za-z ,'-]+$/)
    for (const p of stage(6).task.water!.plants) expect(p.label).toMatch(/^[A-Za-z ,'-]+$/)
    expect(stage(2).task.question).toBe('How many animals are there together?')
  })
})

describe.runIf(released)('Abraham: when the stages are released, every file exists and the size of the download is right', () => {
  it('all the files of the journey are there, none is too big, and the size of the pack is about what the data says', () => {
    let bytes = 0
    for (const f of journeyFiles(abraham)) {
      if (notPaintedYet(f) && !existsSync(`public/${f}`)) continue
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 1_800_000 : 620_000)
      bytes += size
    }
    const mb = bytes / 1_000_000
    expect(abraham.downloadMb!, 'downloadMb').toBeGreaterThan(mb * 0.75)
    expect(abraham.downloadMb!, 'downloadMb').toBeLessThan(mb * 1.25)
  })
})
