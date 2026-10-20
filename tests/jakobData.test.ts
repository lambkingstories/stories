/**
 * The data of "Jakob" (`jakob.ts` and `en/jakob.en.ts`): the stories and questions follow the rules of the adventures, the games are the ones the Leitung chose (at most two
 * old mechanics, three new ones; stage 2 is only questions), the data of every game is complete and consistent, and the English file has the same shape. Until the stages
 * are released (`soon`) none can be opened; once they are released the files that the data names must exist, too.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { jakob } from '@/data/adventures/jakob'
import { JAKOB_PATH } from '@/data/adventures/jakobPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { isSolved, scramble } from '@/utils/jakobGames'
import { journeyFiles } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const released = jakob.stages.every((s) => !s.soon)
const stage = (n: number) => jakob.stages[n - 1]!
/** The number of the stage picture that each stage shows (the new stages borrow one until their own picture exists). */
const PICTURE = [1, 2, 3, 4, 4, 1, 4, 6, 5, 5, 6, 3]
/** Words that no text of the German data may use (stage 5 is a quiet, mysterious moment, not a fight scene; nothing violent). */
const FORBIDDEN = /\b(Messer|Schwert|Pfeil|Blut|töten|erschlagen|Teufel|Hölle|Feind|Gegner)\b/i

describe('Jakob: stories and questions', () => {
  it('twelve stages with 3 to 5 paragraphs of 60 to 220 words, the Bible passage under every one, the recording and picture names of the plan', () => {
    expect(jakob.id).toBe('jakob')
    expect(jakob.age).toBe('8-10')
    expect(jakob.title).toBe('Jakob')
    expect(jakob.subtitle).toBe('Ein Weg mit Umwegen')
    expect(jakob.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(jakob.stages.map((s) => s.title)).toEqual(['Zwillinge', 'Der Segen', 'Die Himmelsleiter', 'Am Brunnen', 'Sieben Jahre für Rahel', 'Die große Familie', 'Die Herden wachsen', 'Der Weg nach Hause', 'Engel und Geschenke', 'Der Kampf am Fluss', 'Wiedersehen', 'Zwölf Söhne'])
    for (const s of jakob.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^1\. Mose \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const words = s.text.join(' ').split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(60)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(220)
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.audio, s.id.toString()).toBe(`audio/abenteuer/jakob/geschichte-${String(s.id).padStart(2, '0')}-${s.id === 3 ? 'v3' : 'v2'}.mp3`)
      // stages 5 to 9 and 12 use an existing picture until their own picture is built in (PLATZHALTER)
      expect(s.image).toBe(`images/abenteuer/jakob/etappe-bild-${String(PICTURE[s.id - 1]).padStart(2, '0')}.webp`)
    }
  })

  it('two questions per stage (three in the serious stage 2), three answers each, the right one first and the answers differ; the exam has six', () => {
    expect(jakob.stages.map((s) => s.questions.length)).toEqual([2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    for (const q of [...jakob.stages.flatMap((s) => s.questions), ...jakob.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(jakob.exam).toHaveLength(6)
    const asked = jakob.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(jakob.exam.map((q) => q.q)).size).toBe(6)
  })

  it('stage 2 (the blessing) is serious and told calmly; stage 10 is a quiet moment: nobody is hurt and there is no enemy in the text', () => {
    expect(stage(2).task.kind).toBe('quiz')
    expect(stage(2).task.hint).toContain('ernst')
    expect(stage(2).text.join(' ')).toMatch(/Das ist nicht wahr/)
    const t5 = stage(10).text.join(' ')
    expect(t5).toMatch(/Israel/)
    expect(t5).not.toMatch(/schlägt|verletzt|Wunde/i)
  })

  it('the questions do not ask what the game of the stage already showed (the number of animals, the shape of the stairway, the buckets)', () => {
    const text = jakob.stages.map((s) => s.questions.map((q) => q.q).join(' ').toLowerCase())
    expect(text[0]).not.toMatch(/wie viele (schafe|tiere|ziegen)/)
    expect(text[2]).not.toMatch(/wie viele (stufen|kacheln)/)
    expect(text[3]).not.toMatch(/wie viele eimer/)
    expect(text[9]).not.toMatch(/was hält jakob fest|gegner/)
  })
})

describe('Jakob: every stage has the game that was chosen', () => {
  const OLD = ['zaehlen', 'puzzle', 'weg', 'ernten', 'memory', 'sortieren', 'wimmelbild', 'ausmalen', 'teilen', 'bauen', 'punkte', 'steuern']
  const NEW = ['reihenfolge', 'lichter', 'hueten', 'kanaele', 'lueckenvers', 'spiegeln', 'echo', 'saeen', 'fehlt', 'kette', 'stapeln', 'wischen', 'spur', 'waage', 'sternbild', 'giessen']

  it('the games in the order of the plan; stage 2 is only the questions; at most two old mechanics and three new ones', () => {
    expect(jakob.stages.map((s) => s.task.kind)).toEqual(['zaehlen', 'quiz', 'schieben', 'kurbel', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'halten', 'puzzle', 'quiz'])
    const kinds = jakob.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(kinds).size).toBe(kinds.length)
    expect(kinds.filter((k) => OLD.includes(k)).sort()).toEqual(['puzzle', 'zaehlen'])
    for (const k of ['schieben', 'kurbel', 'halten']) expect([...OLD, ...NEW], k).not.toContain(k)
  })

  it('every game has at most two rounds, a hint for each round; the goals fit the table "Stufen je Spiel"', () => {
    const g = (n: number) => stage(n).task
    const rounds = [g(3).slide!.rounds, g(4).crank!.rounds, g(10).hold!.rounds]
    for (const r of rounds) {
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r.length).toBeLessThanOrEqual(2)
      for (const x of r) expect(x.hint.length).toBeGreaterThan(8)
    }
    expect(g(3).slide!.rounds).toHaveLength(2)
    expect(g(4).crank!.rounds.reduce((s, r) => s + r.buckets, 0)).toBe(4)
    expect(g(10).hold!.rounds.map((r) => r.seconds)).toEqual([10, 15])
    expect(g(1).count).toBe(8)
    expect(g(11).puzzle).toMatchObject({ cols: 2, rows: 3 })
  })

  it('1 counting: the sheep of the flock before the tent, counted in one scene (no rounds); the background is the stage picture', () => {
    const t = stage(1).task
    expect(t.count).toBe(8)
    expect(t.image).toBe('images/abenteuer/spiele/jakob/zaehlen/schaf.webp')
    expect(t.groups).toBeUndefined()
    expect(t.background).toBe('images/abenteuer/jakob/etappe-bild-01.webp')
  })

  it('3 stairway: the picture is the stage picture; round 1 is 3 x 2 tiles, round 2 4 x 3; both rounds are mixed, never finished, and round 2 has more tiles and more moves', () => {
    const s = stage(3).task.slide!
    expect(s.image).toBe('images/abenteuer/jakob/etappe-bild-03.webp')
    expect(s.rounds.map((r) => [r.cols, r.rows])).toEqual([[3, 2], [4, 3]])
    for (const r of s.rounds) {
      expect(isSolved(scramble(r.cols, r.rows, r.moves, r.seed))).toBe(false)
      expect(r.moves).toBeGreaterThan(5)
    }
    expect(s.rounds[1]!.moves).toBeGreaterThan(s.rounds[0]!.moves)
  })

  it('4 well: the places lie inside the picture, the crank is not on the trough, the bucket hangs higher up when it is up than when it is down', () => {
    const c = stage(4).task.crank!
    const inside = (x: number, y: number) => x >= 0 && x <= 100 && y >= 0 && y <= 100
    expect(inside(...c.crankAt)).toBe(true)
    expect(inside(c.bucketAt[0], c.bucketAt[1])).toBe(true)
    expect(inside(c.bucketAt[0], c.bucketAt[2])).toBe(true)
    expect(c.bucketAt[1]).toBeLessThan(c.bucketAt[2])
    expect(inside(c.troughAt[0], c.troughAt[1])).toBe(true)
    expect(Math.hypot(c.crankAt[0] - c.troughAt[0], c.crankAt[1] - c.troughAt[1])).toBeGreaterThan(c.troughAt[2] / 2)
    expect(c.background).toBe('images/abenteuer/jakob/etappe-bild-04.webp')
  })

  it('10 morning light: the light lies inside the picture; in round 2 it wanders along a way of at least three points, in round 1 it stands still; there is no enemy', () => {
    const h = stage(10).task.hold!
    expect(h.start[0] >= 5 && h.start[0] <= 95 && h.start[1] >= 5 && h.start[1] <= 95).toBe(true)
    expect(h.rounds[0]!.path).toBeUndefined()
    expect(h.rounds[1]!.path!.length).toBeGreaterThanOrEqual(3)
    expect(h.background).toBe('images/abenteuer/jakob/etappe-bild-05.webp')
    expect(JSON.stringify(h)).not.toMatch(/gegner|kampf|feind/i)
  })

  it('every picture and recording that the games name lies in the folders that only this adventure uses (or is one of the shared screens)', () => {
    const paths: string[] = []
    const take = (v: unknown) => {
      if (typeof v === 'string') {
        if (/^(images|audio)\//.test(v)) paths.push(v)
      } else if (Array.isArray(v)) v.forEach(take)
      else if (v && typeof v === 'object') Object.values(v).forEach(take)
    }
    take(jakob)
    expect(paths.length).toBeGreaterThan(20)
    for (const p of paths) {
      if (p === jakob.map.ring || p.startsWith('images/abenteuer/ui/')) continue
      expect(/^(images\/abenteuer\/jakob\/|images\/abenteuer\/spiele\/jakob\/|audio\/abenteuer\/jakob\/)/.test(p), p).toBe(true)
    }
  })
})

describe('Jakob: die Karte', () => {
  const m = jakob.map
  // the painted map is 9908 x 1648 px (the height of the picture is the unit of the ring and of the lowest fifth)
  const W = 9908
  const H = 1648
  it('vier Stücke eines Bildes, jedes unter 1,8 MB; Stationen von links nach rechts, nicht zu tief und nicht zu dicht', () => {
    expect(m.images).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/jakob/karte-pano-v2-${n}.webp`))
    for (const f of m.images) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(1800)
    expect(m.widthPx).toBe(W)
    expect(m.aspect).toBeCloseTo(W / H, 3)
    expect(m.stages).toHaveLength(12)
    const spots = [...m.stages, m.exam]
    for (let i = 0; i < spots.length; i++) {
      expect(spots[i]!.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.65)
      expect(spots[i]!.d).toBeCloseTo((336 * H) / 1648 / W, 3)
      if (i > 0) {
        expect(spots[i]!.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
        // two rings do not touch
        expect(Math.hypot((spots[i]!.x - spots[i - 1]!.x) * W, (spots[i]!.y - spots[i - 1]!.y) * H)).toBeGreaterThanOrEqual(169)
      }
    }
  })
  it('nichts liegt in den unteren 20 % der Karte; der Perlenweg hat eine Strecke je Etappe (die letzte führt zum Ziel) und alle Perlen liegen im Bild', () => {
    for (const sp of [...m.stages, m.exam]) expect(sp.y * H, 'Ring-Mitte').toBeLessThanOrEqual(0.65 * H)
    expect(m.path).toHaveLength(12)
    for (const seg of m.path) {
      for (const [x, y] of seg) {
        expect(y * H, 'Perle').toBeLessThanOrEqual(0.8 * H)
        expect(x > 0 && x < 1 && y > 0 && y < 1).toBe(true)
      }
    }
  })
})

describe('Jakob: the scaffold', () => {
  it('until the pictures and recordings are built in all stages are "soon" (none opens, nothing is downloaded, no map yet); afterwards only the first opens at the start', () => {
    expect(jakob.gift.title).toBe('Jakob und die Himmelsleiter im Traum')
    expect(jakob.exam).toHaveLength(6)
    expect(jakob.stages.every((s) => !s.soon) || jakob.stages.every((s) => s.soon)).toBe(true)
    const open = jakob.stages.map((_, i) => isStageOpen(jakob, undefined, i))
    if (!released) {
      expect(open).toEqual(jakob.stages.map(() => false))
      const own = journeyFiles(jakob).filter((f) => f.includes('jakob/'))
      expect(own.filter((f) => f.includes('spiele/') || f.startsWith('audio/'))).toEqual([])
    } else {
      expect(open).toEqual([true, false, false, false, false, false, false, false, false, false, false, false])
    }
    // the painted map and the way are there
    expect(jakob.map.images).toHaveLength(4)
    expect(JAKOB_PATH).toHaveLength(12)
  })
})

describe('Jakob: English', () => {
  const overlay = englishTextsOf(jakob) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, rounds, hints) and no German word is left', () => {
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
    same(jakob, overlay, 'jakob')
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
    const de = jakob.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q) }))
    setAdventureLanguage('en')
    jakob.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Genesis \d/)
      expect(s.audio, `audio ${s.id}`).toBe(`audio/abenteuer/jakob/geschichte-${String(s.id).padStart(2, '0')}-en-${s.id === 3 ? 'v3' : 'v2'}.mp3`)
    })
    expect(jakob.title).toBe('Jacob')
    expect(jakob.subtitle).toBe('A Road with Detours')
    expect(adventureLanguage.value).toBe('en')
    expect(stage(1).text.join(' ')).toMatch(/Rebekah/)
    expect(stage(3).text.join(' ')).toMatch(/Bethel/)
    for (const q of [...jakob.stages.flatMap((s) => s.questions), ...jakob.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(stage(1).task.hint).toBe('Tap the sheep and count them.')
    expect(stage(2).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
  })
})

describe.runIf(released)('Jakob: when the stages are released, every file exists and the size of the download is right', () => {
  it('all the files of the journey are there, none is too big, and the size of the pack is about what the data says', () => {
    let bytes = 0
    for (const f of journeyFiles(jakob)) {
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 1_800_000 : 620_000)
      bytes += size
    }
    const mb = bytes / 1_000_000
    expect(jakob.downloadMb!, 'downloadMb').toBeGreaterThan(mb * 0.75)
    expect(jakob.downloadMb!, 'downloadMb').toBeLessThan(mb * 1.25)
  })
})
