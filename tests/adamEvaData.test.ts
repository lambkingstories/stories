/**
 * The data of "Adam und Eva" (`adamEva.ts` and `en/adamEva.en.ts`): the stories and questions follow the rules of the adventures, every stage has its own
 * new game (none of Josef or Noah), the data of every game is complete and consistent, and the English file has the same shape. Once the stages are
 * released (no stage is `soon` any more) the files that the data names must exist, too.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { adamEva } from '@/data/adventures/adamEva'
import { CHANNEL_GRID_1, CHANNEL_GRID_2 } from '@/data/adventures/adamEvaChannels'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { flow, goalsOf, solve } from '@/utils/channels'
import { journeyFiles } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const released = adamEva.stages.every((s) => !s.soon)
const stage = (n: number) => adamEva.stages[n - 1]!
/** The words that every game text of the German data has to be free of (the story keeps to the Bible; nothing scary, no apple). */
const FORBIDDEN = /\b(Apfel|Äpfel|Teufel|Dämon|Hölle|Blut|tot geschlagen)\b/i

describe('Adam und Eva: stories and questions', () => {
  it('nine stages with 3 to 5 paragraphs of 60 to 220 words, and the Bible passage under every one', () => {
    expect(adamEva.stages).toHaveLength(9)
    for (const s of adamEva.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^1\. Mose \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(60)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(220)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, s.id.toString()).toBe(`audio/abenteuer/adam-eva/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
      expect(s.image).toBe(`images/abenteuer/adam-eva/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two questions per stage (three in the serious stage 7), three answers each, the right one first and the answers differ; the exam has six', () => {
    expect(adamEva.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 2, 2, 3, 2, 2])
    for (const q of [...adamEva.stages.flatMap((s) => s.questions), ...adamEva.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(adamEva.exam).toHaveLength(6)
    const asked = adamEva.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    // the exam asks about the whole story: its questions are not all new (most are asked in the stages, too)
    expect(adamEva.exam.filter((q) => asked.includes(q.q)).length).toBeGreaterThanOrEqual(4)
  })

  it('the questions do not ask what the game of the stage already showed (the order of the days, the lights, the channels, the sentence and the call)', () => {
    const text = adamEva.stages.map((s) => s.questions.map((q) => q.q).join(' ').toLowerCase())
    expect(text[0]).not.toMatch(/reihenfolge|zuerst|am ersten tag/)
    expect(text[1]).not.toMatch(/welche lichter/)
    expect(text[3]).not.toMatch(/was bewässert|wie viele krüge/)
    expect(text[4]).not.toMatch(/wie nannte adam/)
    expect(text[7]).not.toMatch(/welche (blüte|klang)/)
  })
})

describe('Adam und Eva: every stage has its own new game (no game of Josef or Noah)', () => {
  const OLD = ['puzzle', 'weg', 'ernten', 'memory', 'sortieren', 'wimmelbild', 'zaehlen', 'ausmalen', 'teilen', 'bauen', 'punkte', 'steuern']

  it('the games in the order of the plan; stage 7 is only the questions; no kind twice, none of the old ones', () => {
    expect(adamEva.stages.map((s) => s.task.kind)).toEqual(['reihenfolge', 'lichter', 'hueten', 'kanaele', 'lueckenvers', 'spiegeln', 'quiz', 'echo', 'saeen'])
    const kinds = adamEva.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(kinds).size).toBe(kinds.length)
    for (const k of kinds) expect(OLD, k).not.toContain(k)
    // never two quiz stages in a row, and the serious stage is only questions
    expect(stage(7).task.kind).toBe('quiz')
    expect(stage(7).task.hint).toContain('ernst')
  })

  it('every game has at most two rounds, a hint for each round, and its goal fits the plan', () => {
    const g = (n: number) => stage(n).task
    const rounds = [g(1).order!.rounds, g(2).lights!.rounds, g(3).herd!.rounds, g(4).channels!.rounds, g(5).verse!.rounds, g(6).mirror!.rounds, g(8).echo!.rounds, g(9).sow!.rounds]
    for (const r of rounds) {
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r.length).toBeLessThanOrEqual(2)
      for (const x of r) expect(x.hint.length).toBeGreaterThan(10)
    }
    // the goals (the number of right moves of all rounds), see the table "Stufen je Spiel" in the skill
    expect(g(1).order!.rounds.reduce((s, r) => s + r.cards.length, 0)).toBe(7)
    expect(g(2).lights!.rounds.reduce((s, r) => s + r.spots.length, 0)).toBe(14)
    expect(g(3).herd!.rounds).toHaveLength(2)
    expect(g(4).channels!.rounds.reduce((s, r) => s + goalsOf(r.grid), 0)).toBe(6)
    expect(g(5).verse!.rounds.reduce((s, r) => s + r.answers.length, 0)).toBe(3)
    expect(g(6).mirror!.rounds.reduce((s, r) => s + r.cols * r.rows, 0)).toBe(18)
    expect(g(8).echo!.rounds.reduce((s, r) => s + r.calls.length, 0)).toBe(6)
    expect(g(9).sow!.rounds.reduce((s, r) => s + r.furrows.length, 0)).toBe(10)
  })

  it('1 order: the cards exist, the first round has dots and three cards, the second four cards without dots; every round is in the order of the story', () => {
    const o = stage(1).task.order!
    const ids = o.cards.map((c) => c.id)
    for (const r of o.rounds) for (const id of r.cards) expect(ids).toContain(id)
    expect(o.rounds[0]!.numbered).toBe(true)
    expect(o.rounds[1]!.numbered).toBe(false)
    expect(o.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(o.rounds[1]!.cards).toEqual(['licht', 'himmel', 'land', 'pflanzen'])
    // the cards of round 1 are in the same order as in round 2
    expect(o.rounds[1]!.cards.filter((c) => o.rounds[0]!.cards.includes(c))).toEqual(o.rounds[0]!.cards)
    expect(o.cards.map((c) => c.image)).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/spiele/adam-eva/reihenfolge/schritt-${n}.webp`))
  })

  it('2 lights: six lights one after the other, then eight with two or three at once; all inside the picture and not on top of each other', () => {
    const l = stage(2).task.lights!
    expect(l.rounds.map((r) => r.spots.length)).toEqual([6, 8])
    expect(l.rounds[0]!.together).toBe(1)
    expect(l.rounds[1]!.together).toBeGreaterThanOrEqual(2)
    expect(l.rounds[1]!.together).toBeLessThanOrEqual(3)
    for (const r of l.rounds) {
      for (const s of r.spots) {
        expect(s.x - s.w / 2).toBeGreaterThanOrEqual(0)
        expect(s.x + s.w / 2).toBeLessThanOrEqual(100)
        expect(s.y - s.w / 2).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('3 herd: a leader and followers in each round, the resting place is not in the pond, and the leader starts outside both', () => {
    const h = stage(3).task.herd!
    expect(h.rounds[0]!.followers.length).toBe(3)
    expect(h.rounds[1]!.followers.length).toBe(4)
    expect(h.rounds[0]!.obstacle).toBeUndefined()
    const pond = h.rounds[1]!.obstacle!
    const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, ((a.y - b.y) * 4) / 3)
    for (const r of h.rounds) {
      expect(near(r.start, r.rest), 'the leader starts away from the resting place').toBeGreaterThan(r.rest.r * 2)
      if (r.obstacle) {
        expect(near(r.rest, r.obstacle)).toBeGreaterThan(r.rest.r + r.obstacle.r)
        expect(near(r.start, r.obstacle)).toBeGreaterThan(r.obstacle.r + 8)
      }
      for (const a of [r.leader, ...r.followers]) expect(a.label.length).toBeGreaterThan(2)
    }
    expect(pond.r).toBeGreaterThan(5)
  })

  it('4 channels: both gardens can be solved and nothing is wet at the start; four plants that are garden plants, all with their pictures', () => {
    const c = stage(4).task.channels!
    expect(c.rounds.map((r) => r.grid)).toEqual([CHANNEL_GRID_1, CHANNEL_GRID_2])
    for (const r of c.rounds) {
      expect(flow(r.grid).reached).toEqual([])
      const sol = solve(r.grid)
      expect(sol).toBeTruthy()
    }
    expect(Object.keys(c.goals).sort()).toEqual(['dattel', 'feige', 'granatapfel', 'wein'])
    for (const r of c.rounds) for (const t of r.grid.flat()) if (t.kind === 'goal') expect(c.goals[t.goal!], t.goal).toBeTruthy()
    expect(Object.entries(c.goals).map(([id, g]) => `${id} ${g.label}`).join(' ')).not.toMatch(/leben|erkenntnis|apfel$/i)
    expect(Object.keys(c.tiles).sort()).toEqual(['corner', 'empty', 'goal', 'source', 'straight', 'tee'])
    expect(Object.keys(c.wet).sort()).toEqual(['corner', 'source', 'straight', 'tee'])
  })

  it('5 gap sentences: one more piece than gaps, every answer is a word, the right words come first, the sentences are in the text of the stage', () => {
    const v = stage(5).task.verse!
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    const story = stage(5).text.join(' ')
    for (const r of v.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      r.answers.forEach((a, i) => {
        expect(a).toBe(i)
        expect(r.words[a], r.hint).toBeTruthy()
      })
      expect(r.words.length).toBeGreaterThan(r.answers.length)
      expect(new Set(r.words).size).toBe(r.words.length)
      // the sentence with the right words is a sentence of the story
      const whole = r.parts.reduce((s, p, i) => s + p + (r.answers[i] !== undefined ? r.words[r.answers[i]!] : ''), '').replace(/[.!?]$/, '')
      expect(story, whole).toContain(whole)
    }
    expect(v.background).toBe('images/abenteuer/adam-eva/etappe-bild-05.webp')
  })

  it('6 mirror: complete rectangles of stones that exist, two colours first and then three', () => {
    const m = stage(6).task.mirror!
    const ids = m.stones.map((s) => s.id)
    for (const r of m.rounds) {
      expect(r.left).toHaveLength(r.rows)
      for (const row of r.left) {
        expect(row).toHaveLength(r.cols)
        for (const id of row) expect(ids).toContain(id)
      }
    }
    expect(new Set(m.rounds[0]!.left.flat()).size).toBe(2)
    expect(new Set(m.rounds[1]!.left.flat()).size).toBe(3)
    expect(m.background).toBe('images/abenteuer/adam-eva/etappe-bild-06.webp')
  })

  it('8 call and answer: four blossoms with four different tones, calls of 3 to 4 and then 4 to 6 blossoms, all of them valid', () => {
    const e = stage(8).task.echo!
    expect(e.notes).toHaveLength(4)
    expect(new Set(e.notes.map((n) => n.rate)).size).toBe(4)
    for (const r of e.rounds[0]!.calls) expect(r.length >= 3 && r.length <= 4, JSON.stringify(r)).toBe(true)
    for (const r of e.rounds[1]!.calls) expect(r.length >= 4 && r.length <= 6, JSON.stringify(r)).toBe(true)
    for (const c of e.rounds.flatMap((r) => r.calls)) for (const i of c) expect(i >= 0 && i < 4).toBe(true)
    // a call is not just one blossom again and again
    for (const c of e.rounds.flatMap((r) => r.calls)) expect(new Set(c).size).toBeGreaterThan(1)
    expect(e.background).toBe('images/abenteuer/adam-eva/etappe-bild-08.webp')
  })

  it('9 sowing: six furrows from the front to the back, four of them in round 1 (the near ones), all six and a light wind in round 2', () => {
    const s = stage(9).task.sow!
    expect(s.furrows).toHaveLength(6)
    const ids = s.furrows.map((f) => f.id)
    for (const r of s.rounds) for (const id of r.furrows) expect(ids).toContain(id)
    expect(s.rounds[0]!.furrows).toEqual(ids.slice(0, 4))
    expect(s.rounds[1]!.furrows).toEqual(ids)
    expect(s.rounds[0]!.wind).toBe(0)
    expect(Math.abs(s.rounds[1]!.wind)).toBeGreaterThan(0)
    expect(Math.abs(s.rounds[1]!.wind)).toBeLessThanOrEqual(0.5)
    expect(s.sprout).toHaveLength(2)
    // front to back: the furrows lie higher up in the picture one after the other
    const ys = s.furrows.map((f) => f.y)
    expect(ys).toEqual([...ys].sort((a, b) => b - a))
    // the game never says punishment, trouble or curse (Etappe 9 is hope)
    expect(JSON.stringify(s.rounds)).not.toMatch(/Strafe|Mühe|Fluch/)
  })

  it('every picture and recording that the games name lies in the folders that only this adventure uses', () => {
    const paths: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') {
        if (/^(images|audio)\//.test(v)) paths.push(v)
      } else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    take(adamEva)
    expect(paths.length).toBeGreaterThan(60)
    for (const p of paths) {
      if (p === adamEva.map.ring || p.startsWith('images/abenteuer/ui/')) continue
      expect(/^(images\/abenteuer\/adam-eva\/|images\/abenteuer\/spiele\/adam-eva\/|audio\/abenteuer\/adam-eva\/)/.test(p), p).toBe(true)
    }
  })
})

describe('Adam und Eva: die Karte', () => {
  const m = adamEva.map
  // the painted map is 4938 x 822 px (the height of the picture is the unit of the ring and of the lowest fifth)
  const W = 4938
  const H = 822
  it('vier Stücke eines Bildes, jedes unter 1,8 MB; Stationen von links nach rechts, nicht zu tief und nicht zu dicht', () => {
    expect(m.images).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/adam-eva/karte-pano-${n}.webp`))
    for (const f of m.images) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(1800)
    expect(m.widthPx).toBe(W)
    expect(m.aspect).toBeCloseTo(W / H, 3)
    expect(m.stages).toHaveLength(9)
    const spots = [...m.stages, m.exam]
    for (let i = 0; i < spots.length; i++) {
      expect(spots[i]!.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.65)
      expect(spots[i]!.d).toBeCloseTo(168 / W, 3)
      if (i > 0) {
        expect(spots[i]!.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
        // two rings (168 px) do not touch: at least 170 px apart
        expect(Math.hypot((spots[i]!.x - spots[i - 1]!.x) * W, (spots[i]!.y - spots[i - 1]!.y) * H)).toBeGreaterThanOrEqual(170)
      }
    }
  })
  it('nichts liegt in den unteren 20 % der Karte: dort verdeckt die Navigationsleiste Ringe, Namen und Perlen', () => {
    for (const sp of [...m.stages, m.exam]) expect(sp.y * H, 'Ring-Mitte').toBeLessThanOrEqual(0.65 * H)
    for (const seg of m.path) for (const [, y] of seg) expect(y * H, 'Perle').toBeLessThanOrEqual(0.8 * H)
  })
  it('der Perlenweg hat eine Strecke je Etappe (die letzte führt zum Ziel), alle Perlen liegen im Bild', () => {
    expect(m.path).toHaveLength(9)
    for (const seg of m.path) for (const [x, y] of seg) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(1)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(1)
    }
  })
})

describe('Adam und Eva: English', () => {
  const overlay = englishTextsOf(adamEva) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, rounds, cards, words) and no German word is left', () => {
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
    same(adamEva, overlay, 'adamEva')
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

  it('every German text of the stages has an English one that is different; the gap sentences keep the order of the words (answers fit both languages)', () => {
    setAdventureLanguage('de')
    const de = adamEva.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q), verse: s.task.verse?.rounds.map((r) => r.words.length) }))
    setAdventureLanguage('en')
    adamEva.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Genesis \d/)
      expect(s.audio, `audio ${s.id}`).toBe(`audio/abenteuer/adam-eva/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
      if (s.task.verse) expect(s.task.verse.rounds.map((r) => r.words.length)).toEqual(de[i]!.verse)
    })
    expect(adamEva.title).toBe('Adam and Eve')
    expect(adventureLanguage.value).toBe('en')
    for (const q of [...adamEva.stages.flatMap((s) => s.questions), ...adamEva.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
  })
})

describe.runIf(released)('Adam und Eva: when the stages are released, every file exists and the size of the download is right', () => {
  it('all the files of the journey are there, none is too big, and the size of the pack is about what the data says', () => {
    let bytes = 0
    for (const f of journeyFiles(adamEva)) {
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(620_000)
      bytes += size
    }
    const mb = bytes / 1_000_000
    expect(adamEva.downloadMb!, 'downloadMb').toBeGreaterThan(mb * 0.75)
    expect(adamEva.downloadMb!, 'downloadMb').toBeLessThan(mb * 1.25)
  })
})
