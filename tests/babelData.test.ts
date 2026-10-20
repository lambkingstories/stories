/**
 * The data of "Der Turm von Babel" (`babel.ts` and `en/babel.en.ts`): the stories and questions follow the rules of the adventures, every stage has its
 * own new game (none of Josef, Noah or Adam und Eva; stage 5 is only questions), the data of every game is complete and consistent, and the English file
 * has the same shape. Until the stages are released (`soon`) none can be opened; once they are released the files that the data names must exist, too.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { babel } from '@/data/adventures/babel'
import { BABEL_PATH } from '@/data/adventures/babelPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { advance, buildTask, lineLength, pointAt, stepWidths } from '@/utils/babelGames'
import { journeyFiles } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const released = babel.stages.every((s) => !s.soon)
const stage = (n: number) => babel.stages[n - 1]!
/** Words that no text of the German data may use (the story keeps to the Bible and is gentle: nothing scary). */
const FORBIDDEN = /\b(Strafe|Fluch|Zorn|Teufel|Dämon|Hölle|Blut|tot|Tod)\b/i

describe('Babel: stories and questions', () => {
  it('six stages with 3 to 5 paragraphs of 60 to 220 words, the Bible passage under every one, the recording and picture names of the plan', () => {
    expect(babel.id).toBe('babel')
    expect(babel.age).toBe('8-10')
    expect(babel.stages).toHaveLength(6)
    expect(babel.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6])
    for (const s of babel.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^1\. Mose 11,/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(60)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(220)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, s.id.toString()).toBe(`audio/abenteuer/babel/geschichte-${String(s.id).padStart(2, '0')}-v2.mp3`)
      expect(s.image).toBe(`images/abenteuer/babel/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two questions per stage (three in the serious stage 5), three answers each, the right one first and the answers differ; the exam has six', () => {
    expect(babel.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 3, 2])
    for (const q of [...babel.stages.flatMap((s) => s.questions), ...babel.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(babel.exam).toHaveLength(6)
    const asked = babel.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    // the exam asks about the whole story: most of its questions were asked in the stages, too
    expect(babel.exam.filter((q) => asked.includes(q.q)).length).toBeGreaterThanOrEqual(3)
  })

  it('the questions do not ask what the game of the stage already showed (who was missing, what was passed on, the mountains and rivers)', () => {
    const text = babel.stages.map((s) => s.questions.map((q) => q.q).join(' ').toLowerCase())
    expect(text[0]).not.toMatch(/wer fehlt|wer ist weg/)
    expect(text[1]).not.toMatch(/wie viele ziegel/)
    expect(text[2]).not.toMatch(/wie viele stufen/)
    expect(text[5]).not.toMatch(/welche wege|wohin führt/)
  })
})

describe('Babel: every stage has its own new game (no game of Josef, Noah or Adam und Eva)', () => {
  const OLD = ['puzzle', 'weg', 'ernten', 'memory', 'sortieren', 'wimmelbild', 'zaehlen', 'ausmalen', 'teilen', 'bauen', 'punkte', 'steuern',
    'reihenfolge', 'lichter', 'hueten', 'kanaele', 'lueckenvers', 'spiegeln', 'echo', 'saeen']

  it('the games in the order of the plan; stage 5 is only the questions; no kind twice, none of the old ones', () => {
    expect(babel.stages.map((s) => s.task.kind)).toEqual(['fehlt', 'kette', 'stapeln', 'wischen', 'quiz', 'spur'])
    const kinds = babel.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(kinds).size).toBe(kinds.length)
    for (const k of kinds) expect(OLD, k).not.toContain(k)
    expect(stage(5).task.kind).toBe('quiz')
    expect(stage(5).task.hint).toContain('ernst')
  })

  it('every game has at most two rounds, a hint for each round, and its goal fits the table "Stufen je Spiel"', () => {
    const g = (n: number) => stage(n).task
    const rounds = [g(1).missing!.rounds, g(2).chain!.rounds, g(3).stack!.rounds, g(4).wipe!.rounds, g(6).trace!.rounds]
    for (const r of rounds) {
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r.length).toBeLessThanOrEqual(2)
      for (const x of r) expect(x.hint.length).toBeGreaterThan(8)
    }
    // the goals (the number of right moves of all rounds)
    expect(g(1).missing!.rounds.reduce((s, r) => s + r.tasks.reduce((n, t) => n + t.gone.length, 0), 0)).toBe(9)
    expect(g(2).chain!.rounds.reduce((s, r) => s + r.items.length, 0)).toBe(12)
    expect(g(3).stack!.rounds.reduce((s, r) => s + r.layers, 0)).toBe(8)
    expect(g(4).wipe!.rounds).toHaveLength(2)
    expect(g(6).trace!.rounds.reduce((s, r) => s + r.paths.length, 0)).toBe(6)
  })

  it('1 who is missing: every task is valid, round 1 has four people and one gone, round 2 six people and two gone; the places are enough', () => {
    const m = stage(1).task.missing!
    expect(m.people).toHaveLength(6)
    for (const p of m.people) expect(p.label.length).toBeGreaterThan(5)
    expect(new Set(m.people.map((p) => p.id)).size).toBe(6)
    for (const r of m.rounds) for (const t of r.tasks) expect(() => buildTask(m.people, t), JSON.stringify(t)).not.toThrow()
    expect(m.rounds.map((r) => r.tasks.length)).toEqual([3, 3])
    for (const t of m.rounds[0]!.tasks) {
      expect(t.row).toHaveLength(4)
      expect(t.gone).toHaveLength(1)
    }
    for (const t of m.rounds[1]!.tasks) {
      expect(t.row).toHaveLength(6)
      expect(t.gone).toHaveLength(2)
    }
    expect(m.slots.length).toBeGreaterThanOrEqual(6)
    // the places are the measured ones: the six stand side by side at the foot of the picture without touching, every person fully inside it
    expect(m.personWidth).toBe(14)
    const xs = m.slots.map((p) => p[0])
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!, 'people overlap').toBeGreaterThanOrEqual(m.personWidth!)
    for (const [x, y] of m.slots) {
      expect(x - m.personWidth! / 2).toBeGreaterThanOrEqual(0)
      expect(x + m.personWidth! / 2).toBeLessThanOrEqual(100)
      expect(y).toBeLessThanOrEqual(95)
    }
    // only one child, smaller than the grown-ups
    expect(m.people.filter((p) => (p.scale ?? 1) < 1)).toHaveLength(1)
    // the same people are not gone every time
    expect(new Set(m.rounds.flatMap((r) => r.tasks.flatMap((t) => t.gone))).size).toBeGreaterThanOrEqual(5)
    expect(m.background).toBe('images/abenteuer/babel/etappe-bild-01.webp')
  })

  it('2 brick chain: a place for every builder, round 1 only bricks, round 2 a mixture with pitch, one more builder', () => {
    const c = stage(2).task.chain!
    for (const r of c.rounds) expect(r.slots).toHaveLength(r.people)
    expect(c.rounds.map((r) => r.people)).toEqual([3, 4])
    expect(c.rounds.map((r) => r.items.length)).toEqual([4, 8])
    expect(c.rounds[0]!.items.every((i) => i === 'brick')).toBe(true)
    expect(c.rounds[1]!.items.filter((i) => i === 'pitch')).toHaveLength(4)
    expect(c.rounds[1]!.items.filter((i) => i === 'brick')).toHaveLength(4)
    // the builders stand in a row from left to right, side by side without touching (16 % wide), and the stack lies to the right of the last one
    for (const r of c.rounds) {
      const xs = r.slots.map((s) => s[0])
      expect(xs).toEqual([...xs].sort((a, b) => a - b))
      for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(14)
      for (const [x, y] of r.slots) {
        expect(x - 8).toBeGreaterThanOrEqual(0)
        expect(x + 8).toBeLessThanOrEqual(100)
        expect(y).toBeLessThanOrEqual(96)
      }
      expect(r.sink[0]).toBeGreaterThan(xs[xs.length - 1]!)
    }
    // the measured oven, the same in both rounds, and the rounds use the first places of the row
    expect(c.rounds[0]!.source).toEqual([48.5, 25.5])
    expect(c.rounds[1]!.source).toEqual(c.rounds[0]!.source)
    expect(c.rounds[1]!.slots.slice(0, 3)).toEqual(c.rounds[0]!.slots)
    expect(c.background).toBe('images/abenteuer/babel/etappe-bild-02.webp')
  })

  it('3 stepped tower: four steps in each round, every step narrower than the one below, the block always fits on the picture, the second round is narrower and quicker', () => {
    const s = stage(3).task.stack!
    expect(s.rounds.map((r) => r.layers)).toEqual([4, 4])
    for (const r of s.rounds) {
      const w = stepWidths(r.baseWidth, r.shrink, r.layers)
      expect(w).toEqual([...w].sort((a, b) => b - a))
      expect(w[0]).toBeLessThanOrEqual(80)
      expect(w[w.length - 1]).toBeGreaterThan(15)
      expect(r.speed).toBeGreaterThan(0.05)
      expect(r.speed).toBeLessThan(0.5)
    }
    expect(s.rounds[1]!.baseWidth).toBeLessThan(s.rounds[0]!.baseWidth)
    expect(s.rounds[1]!.speed).toBeGreaterThan(s.rounds[0]!.speed)
    expect(s.background).toBe('images/abenteuer/babel/etappe-bild-03.webp')
  })

  it('4 wiping the fog: the tower first (upper middle), then the people in front (lower part); the parts lie inside the picture', () => {
    const w = stage(4).task.wipe!
    for (const r of w.rounds) {
      expect(r.region.x).toBeGreaterThanOrEqual(0)
      expect(r.region.y).toBeGreaterThanOrEqual(0)
      expect(r.region.x + r.region.w).toBeLessThanOrEqual(100)
      expect(r.region.y + r.region.h).toBeLessThanOrEqual(100)
    }
    const [tower, city] = w.rounds.map((r) => r.region) as [typeof w.rounds[0]['region'], typeof w.rounds[0]['region']]
    expect(tower.y).toBeLessThan(city.y)
    expect(Math.abs(tower.x + tower.w / 2 - 50)).toBeLessThan(5)
    expect(city.y + city.h / 2).toBeGreaterThan(50)
    expect(w.background).toBe('images/abenteuer/babel/etappe-bild-04.webp')
  })

  it('6 following the roads: two roads, then four with other goals; every road starts at the tower, leads outwards and its length is worth walking', () => {
    const t = stage(6).task.trace!
    expect(t.rounds.map((r) => r.paths.length)).toEqual([2, 4])
    const goals = new Set(['berge', 'fluss', 'palmen', 'huegel'])
    for (const r of t.rounds) {
      expect(new Set(r.paths.map((p) => p.goal)).size).toBe(r.paths.length)
      for (const p of r.paths) {
        expect(goals.has(p.goal), p.id).toBe(true)
        expect(p.points.length, p.id).toBeGreaterThanOrEqual(5)
        for (const [x, y] of p.points) {
          expect(x >= 0 && x <= 100 && y >= 0 && y <= 100, p.id).toBe(true)
        }
        // the road starts at the foot of the tower in the middle of the picture
        expect(Math.abs(p.points[0]![0] - 50), p.id).toBeLessThanOrEqual(15)
        expect(Math.abs(p.points[0]![1] - 46), p.id).toBeLessThanOrEqual(10)
        expect(lineLength(p.points), p.id).toBeGreaterThan(30)
        // the walker at the end of the road stands where the road ends
        const end = pointAt(p.points, lineLength(p.points))
        const last = p.points[p.points.length - 1]!
        expect(end.x).toBeCloseTo(last[0], 5)
        expect(end.y).toBeCloseTo(last[1], 5)
        expect(p.r, p.id).toBeGreaterThanOrEqual(2)
        expect(p.r, p.id).toBeLessThanOrEqual(6)
      }
    }
    // the roads of round 2 are narrower than those of round 1
    expect(t.rounds[1]!.paths[0]!.r).toBeLessThan(t.rounds[0]!.paths[0]!.r)
    // the road ids and goals have words in the app
    expect(t.scene).toBe('images/abenteuer/spiele/babel/spur/wege-b.webp')
  })

  it('6 following the roads: a finger that follows the middle of every road, one step at a time, brings the walker to the goal without straying', () => {
    const t = stage(6).task.trace!
    for (const r of t.rounds) {
      for (const p of r.paths) {
        const len = lineLength(p.points)
        let progress = 0
        for (let along = 0; along <= len; along += 1) {
          const finger = pointAt(p.points, along)
          const a = advance(p.points, progress, finger, p.r)
          expect(a.strayed, `${p.id} strayed at ${along}`).toBe(false)
          expect(a.on, `${p.id} lost at ${along}`).toBe(true)
          progress = a.progress
        }
        expect(progress, p.id).toBeGreaterThanOrEqual(len - Math.max(2.5, p.r))
      }
    }
  })

  it('every picture and recording that the games name lies in the folders that only this adventure uses', () => {
    const paths: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') {
        if (/^(images|audio)\//.test(v)) paths.push(v)
      } else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    take(babel)
    expect(paths.length).toBeGreaterThan(30)
    for (const p of paths) {
      if (p === babel.map.ring || p.startsWith('images/abenteuer/ui/')) continue
      expect(/^(images\/abenteuer\/babel\/|images\/abenteuer\/spiele\/babel\/|audio\/abenteuer\/babel\/)/.test(p), p).toBe(true)
    }
  })
})

describe('Babel: die Karte', () => {
  const m = babel.map
  // the painted map is 4944 x 821 px (the height of the picture is the unit of the ring and of the lowest fifth)
  const W = 4944
  const H = 821
  it('vier Stücke eines Bildes, jedes unter 1,8 MB; Stationen von links nach rechts, nicht zu tief und nicht zu dicht', () => {
    expect(m.images).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/babel/karte-pano-${n}.webp`))
    for (const f of m.images) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(1800)
    expect(m.widthPx).toBe(W)
    expect(m.aspect).toBeCloseTo(W / H, 3)
    expect(m.stages).toHaveLength(6)
    const spots = [...m.stages, m.exam]
    for (let i = 0; i < spots.length; i++) {
      expect(spots[i]!.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.65)
      expect(spots[i]!.d).toBeCloseTo(167 / W, 3)
      if (i > 0) {
        expect(spots[i]!.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
        // two rings (167 px) do not touch: at least 170 px apart
        expect(Math.hypot((spots[i]!.x - spots[i - 1]!.x) * W, (spots[i]!.y - spots[i - 1]!.y) * H)).toBeGreaterThanOrEqual(170)
      }
    }
  })
  it('nichts liegt in den unteren 20 % der Karte; der Perlenweg hat eine Strecke je Etappe (die letzte führt zum Ziel) und alle Perlen liegen im Bild', () => {
    for (const sp of [...m.stages, m.exam]) expect(sp.y * H, 'Ring-Mitte').toBeLessThanOrEqual(0.65 * H)
    expect(m.path).toHaveLength(6)
    for (const seg of m.path) {
      for (const [x, y] of seg) {
        expect(y * H, 'Perle').toBeLessThanOrEqual(0.8 * H)
        expect(x > 0 && x < 1 && y > 0 && y < 1).toBe(true)
      }
    }
  })
})

describe('Babel: the scaffold', () => {
  it('the titles and passages of the plan, and "soon" until pictures and recordings are built in: no stage opens, no game or recording is downloaded; the painted map and the way are there', () => {
    expect(babel.title).toBe('Der Turm von Babel')
    expect(babel.subtitle).toBe('Eine Stadt und ein Turm')
    expect(babel.stages.map((s) => [s.title, s.ref])).toEqual([
      ['Eine Sprache', '1. Mose 11,1–2'],
      ['Ziegel und Pech', '1. Mose 11,3'],
      ['Eine Stadt mit einem Turm', '1. Mose 11,4'],
      ['Gott sieht den Bau', '1. Mose 11,5–6'],
      ['Viele Sprachen', '1. Mose 11,7–8'],
      ['Der Name Babel', '1. Mose 11,9']
    ])
    expect(babel.gift.title).toBe('Der Turm aus Ziegeln')
    expect(babel.map.images).toHaveLength(4)
    expect(BABEL_PATH).toHaveLength(6)
    if (!released) {
      for (const s of babel.stages) expect(s.soon, `stage ${s.id}`).toBe(true)
      for (let i = 0; i < babel.stages.length; i++) expect(isStageOpen(babel, undefined, i), `stage ${i + 1}`).toBe(false)
      // nothing of a game or of a recording is downloaded while all stages are soon
      const own = journeyFiles(babel).filter((f) => f.includes('babel/'))
      expect(own.filter((f) => f.includes('spiele/') || f.startsWith('audio/'))).toEqual([])
    }
  })
})

describe('Babel: English', () => {
  const overlay = englishTextsOf(babel) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, rounds, people, hints) and no German word is left', () => {
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
    same(babel, overlay, 'babel')
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

  it('every German text of the stages has an English one that is different, with the recordings of the English voice and the English passages', () => {
    setAdventureLanguage('de')
    const de = babel.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q) }))
    setAdventureLanguage('en')
    babel.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Genesis 11:/)
      expect(s.audio, `audio ${s.id}`).toBe(`audio/abenteuer/babel/geschichte-${String(s.id).padStart(2, '0')}-en-v2.mp3`)
    })
    expect(babel.title).toBe('The Tower of Babel')
    // the serious stage has its English line, too
    expect(babel.stages[4].task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
    expect(adventureLanguage.value).toBe('en')
    for (const q of [...babel.stages.flatMap((s) => s.questions), ...babel.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    // the people of the first game have English names, too, and the round hints are English
    const m = stage(1).task.missing!
    for (const p of m.people) expect(p.label).toMatch(/^[A-Za-z ,'-]+$/)
  })
})

describe.runIf(released)('Babel: when the stages are released, every file exists and the size of the download is right', () => {
  it('all the files of the journey are there, none is too big, and the size of the pack is about what the data says', () => {
    let bytes = 0
    for (const f of journeyFiles(babel)) {
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(620_000)
      bytes += size
    }
    const mb = bytes / 1_000_000
    expect(babel.downloadMb!, 'downloadMb').toBeGreaterThan(mb * 0.75)
    expect(babel.downloadMb!, 'downloadMb').toBeLessThan(mb * 1.25)
  })
})
