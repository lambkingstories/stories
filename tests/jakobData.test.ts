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
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const released = jakob.stages.every((s) => !s.soon)
const stage = (n: number) => jakob.stages[n - 1]!
/** The number of the stage picture that each stage shows (the new stages borrow one until their own picture exists). */
const PICTURE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
/** Stages whose text was corrected in the Bible check of 21.10.2026 and were recorded again (see NEUAUFNAHME-BIBELTREUE-2026-10-21.md). */
const RECORDED_AGAIN = [1, 2, 3, 5, 6, 10]

/** Words that no text of the German data may use (stage 5 is a quiet, mysterious moment, not a fight scene; nothing violent). */
const FORBIDDEN = /\b(Messer|Schwert|Pfeil|Blut|töten|erschlagen|Teufel|Hölle|Feind|Gegner)\b/i

describe('Jakob: stories and questions', () => {
  it('twelve stages with 3 or 4 paragraphs of 90 to 145 words (plan v3), the Bible passage under every one, the German recording of every story, the picture names of the plan', () => {
    expect(jakob.id).toBe('jakob')
    expect(jakob.age).toBe('8-10')
    expect(jakob.title).toBe('Jakob')
    expect(jakob.subtitle).toBe('Ein Weg mit Umwegen')
    expect(jakob.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(jakob.stages.map((s) => s.title)).toEqual(['Zwillinge', 'Der Segen', 'Die Himmelsleiter', 'Am Brunnen', 'Sieben Jahre für Rahel', 'Die große Familie', 'Die Herden wachsen', 'Der Weg nach Hause', 'Engel und Geschenke', 'Der Kampf am Fluss', 'Wiedersehen', 'Zwölf Söhne'])
    for (const s of jakob.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^1\. Mose \d/)
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
      // Bible check 21.10.2026: the stages whose text changed were recorded again ("-v4")
      expect(s.audio, `German recording ${s.id}`).toBe(`audio/abenteuer/jakob/geschichte-${String(s.id).padStart(2, '0')}-${RECORDED_AGAIN.includes(s.id) ? 'v4' : 'v3'}.mp3`)
      expect(existsSync(`public/${s.audio}`), `file ${s.audio}`).toBe(true)
      // stages 5 to 9 and 12 use an existing picture until their own picture is built in (PLATZHALTER)
      expect(s.image).toBe(`images/abenteuer/jakob/etappe-bild-${String(PICTURE[s.id - 1]).padStart(2, '0')}.webp`)
    }
  })

  it('two questions per stage, three answers each, the right one first and the answers differ; the exam has six', () => {
    expect(jakob.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    for (const q of [...jakob.stages.flatMap((s) => s.questions), ...jakob.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(jakob.exam).toHaveLength(6)
    // nothing is asked twice with the same answer; "Was sagt Gott zu Jakob?" is asked in stage 3 and in stage 7 (the answers differ and each question is shown only in its own stage)
    const asked = jakob.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
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
  const OLD = ['puzzle', 'weg', 'ernten', 'memory', 'sortieren', 'wimmelbild', 'ausmalen', 'teilen', 'bauen', 'punkte', 'steuern']
  const NEW = ['reihenfolge', 'lichter', 'hueten', 'kanaele', 'lueckenvers', 'spiegeln', 'echo', 'saeen', 'fehlt', 'kette', 'stapeln', 'wischen', 'spur', 'waage', 'sternbild', 'giessen']

  it('the games in the order of the plan; stage 2 is only the questions; one old mechanic (the puzzle) and the rest new; no counting game any more', () => {
    // the plan of the twelve stages: all the new games are built
    const PLAN = ['suppe', 'quiz', 'schieben', 'kurbel', 'jahre', 'fangen', 'schaetzen', 'bund', 'staffel', 'halten', 'puzzle', 'kreis']
    expect(jakob.stages.map((st) => st.task.kind)).toEqual(PLAN)
    const kinds = jakob.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(kinds).size).toBe(kinds.length)
    expect(kinds.filter((k) => OLD.includes(k)).sort()).toEqual(['puzzle'])
    expect(kinds).not.toContain('zaehlen')
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
    expect(g(4).crank!.rounds.reduce((s, r) => s + r.buckets, 0)).toBe(3)
    // the goals of the other games (plan v3: two rounds each, a few things in each round)
    const all = [g(5).cycle!.rounds, g(6).catch!.rounds, g(7).guess!.rounds, g(8).cairn!.rounds, g(9).relay!.rounds, g(12).ring!.rounds]
    for (const r of all) {
      expect(r.length).toBe(2)
      for (const x of r) expect(x.hint.length).toBeGreaterThan(8)
    }
    expect(g(5).cycle!.rounds.reduce((s, r) => s + r.gaps.length, 0)).toBe(5)
    expect(g(6).catch!.rounds.reduce((s, r) => s + r.kids.length, 0)).toBe(8)
    expect(g(7).guess!.rounds.reduce((s, r) => s + r.tasks.length, 0)).toBe(4)
    expect(g(8).cairn!.rounds.reduce((s, r) => s + r.stones, 0)).toBe(6)
    expect(g(9).relay!.rounds.reduce((s, r) => s + r.herds.length, 0)).toBe(7)
    expect(g(12).ring!.rounds.reduce((s, r) => s + r.count, 0)).toBe(16)
    expect(g(10).hold!.rounds.map((r) => r.seconds)).toEqual([10, 15])
    expect(g(1).stew).toBeDefined()
    expect(g(11).puzzle).toMatchObject({ cols: 2, rows: 3 })
  })

  it('1 stew: one round (no rounds field), a hint in one sentence, the scene and the pictures under suppe/, the pot at the middle, Esau walks 32 s, six seconds slower each time up to 50 s', () => {
    const t = stage(1).task
    const g = t.stew!
    expect(t.kind).toBe('suppe')
    expect(t.hint).toBe(g.hint)
    expect(g.hint).toBe('Koche die Suppe, bevor Esau da ist: tippe Linsen, Wasser und Holz an.')
    expect(g.hint.split(/[.!?]/).filter((x) => x.trim())).toHaveLength(1)
    const files = [g.scene, ...Object.values(g.pot), g.logs, g.flame, g.steam, g.esau, ...Object.values(g.sources).map((x) => x.image)]
    expect(files).toHaveLength(12)
    expect(new Set(files).size).toBe(12)
    for (const f of files) expect(f, f).toMatch(/^images\/abenteuer\/spiele\/jakob\/suppe\/[a-z-]+\.webp$/)
    expect(g.potAt).toEqual([50.5, 54.5])
    expect(Object.values(g.sources).map((x) => x.at)).toEqual([[18, 89], [50, 90], [82, 89]])
    expect(g.walkMs).toBe(32000)
    expect(g.slowerMs).toBe(6000)
    expect(g.maxWalkMs).toBe(50000)
    expect(g.simmerMs).toBe(2500)
    // the way goes from the fields at the top right to the tent: always inside the scene, further down and to the left
    expect(g.path.length).toBeGreaterThanOrEqual(5)
    for (const [x, y] of g.path) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(100)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(100)
    }
    expect(g.path[0]![1]).toBeLessThan(g.path[g.path.length - 1]![1])
    // the pictures are painted (21.10.2026): the folder is no longer tolerated as missing
    expect(notPaintedYet(g.scene)).toBe(false)
  })

  it('1 stew: the text of the stage says that Jacob cooked red lentils; the second question is about the text (the heel), not about the game', () => {
    expect(stage(1).text.join(' ')).toContain('rote Linsen gekocht')
    expect(stage(1).questions[1]!.q).toBe('Was hält Jakob bei der Geburt fest?')
    expect(stage(1).questions[1]!.options[0]).toBe('die Ferse seines Bruders')
    expect(stage(1).text.join(' ')).toContain('die Ferse seines Bruders fest')
    expect(stage(1).questions.map((q) => q.q).join(' ')).not.toContain('gekocht')
  })

  it('3 stairway: the picture is the stage picture; round 1 is 2 x 2 tiles, round 2 3 x 2; both rounds are mixed, never finished, and round 2 has more tiles and more moves', () => {
    const s = stage(3).task.slide!
    expect(s.image).toBe('images/abenteuer/jakob/etappe-bild-03.webp')
    expect(s.rounds.map((r) => [r.cols, r.rows])).toEqual([[2, 2], [3, 2]])
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
    // the well has a scene of its own (J34, not painted yet)
    expect(c.background).toBe('images/abenteuer/spiele/jakob/kurbel/brunnen.webp')
    expect(c.rounds.map((r) => r.buckets)).toEqual([1, 2])
  })

  it('10 morning light: the light lies inside the picture; in round 2 it wanders along a way of at least three points, in round 1 it stands still; there is no enemy', () => {
    const h = stage(10).task.hold!
    expect(h.start[0] >= 5 && h.start[0] <= 95 && h.start[1] >= 5 && h.start[1] <= 95).toBe(true)
    expect(h.rounds[0]!.path).toBeUndefined()
    expect(h.rounds[1]!.path!.length).toBeGreaterThanOrEqual(3)
    expect(h.background).toBe('images/abenteuer/jakob/etappe-bild-10.webp')
    expect(JSON.stringify(h)).not.toMatch(/gegner|kampf|feind/i)
  })

  it('5 seasons: four signs, a row of two years and a row of three years, the gaps lie inside the rows, the last one at the very end in round 2', () => {
    const c = stage(5).task.cycle
    expect(c, 'the game is built').toBeDefined()
    if (!c) return
    expect(c.tokens.map((t) => t.id)).toEqual(['fruehling', 'sommer', 'herbst', 'winter'])
    expect(c.rounds.map((r) => r.length)).toEqual([8, 12])
    for (const r of c.rounds) {
      expect(r.cycle).toEqual(c.tokens.map((t) => t.id))
      expect(r.length % r.cycle.length, 'whole years').toBe(0)
      for (const g of r.gaps) expect(g >= 0 && g < r.length).toBe(true)
      expect(new Set(r.gaps).size).toBe(r.gaps.length)
    }
    expect(c.rounds.map((r) => r.gaps.length)).toEqual([2, 3])
    expect(c.rounds[1]!.gaps.slice(-1)).toEqual([11])
    expect(c.rounds[0]!.gaps.every((g) => g > 0 && g < 7)).toBe(true)
    expect(c.background).toBe(stage(5).image)
  })

  it('8 cairn: two rounds, two and four stones with three steps each, the small stone is the big one at half the size, both stones start left and right of the middle and the heap lies in the picture', () => {
    const c = stage(8).task.cairn
    expect(c, 'the game is built').toBeDefined()
    if (!c) return
    expect(c.rounds.map((r) => r.stones)).toEqual([2, 4])
    expect(c.rounds.map((r) => r.steps)).toEqual([3, 3])
    expect(c.stoneSmall, 'no picture of its own').toBeUndefined()
    expect(c.leftStart[0]).toBeLessThan(c.centre[0])
    expect(c.rightStart[0]).toBeGreaterThan(c.centre[0])
    for (const [x, y] of [c.centre, c.leftStart, c.rightStart]) {
      expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
    }
    expect(c.background).toBe(stage(8).image)
  })

  it('12 ring: four sons, then twelve like the hours of a clock, the tolerance gets smaller, two figures, the ring lies inside the picture', () => {
    const g = stage(12).task.ring
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.count)).toEqual([4, 12])
    expect(g.rounds[1]!.tolerance).toBeLessThan(g.rounds[0]!.tolerance)
    for (const r of g.rounds) expect(r.tolerance, 'less than half a gap').toBeLessThan(360 / r.count)
    expect(g.tokens).toHaveLength(2)
    const [cx, cy] = g.centre
    // the ring is a circle of the picture's width: in height it reaches one and a half times as far
    expect(cx - g.radius).toBeGreaterThanOrEqual(0)
    expect(cx + g.radius).toBeLessThanOrEqual(100)
    expect(cy + g.radius * 1.5).toBeLessThanOrEqual(100)
    expect(cy - g.radius * 1.5).toBeGreaterThanOrEqual(0)
    expect(g.background).toBe(stage(12).image)
  })

  it('6 catch: three children, then five, both slow, three kinds of children, the tent has a picture, meadow and tent lie inside the picture and the meadow is the lower part', () => {
    const g = stage(6).task.catch
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.kids.length)).toEqual([3, 5])
    expect(g.rounds.map((r) => r.speed)).toEqual([0.04, 0.04])
    expect(g.kids).toHaveLength(3)
    expect(g.tentImage).toBe('images/abenteuer/spiele/jakob/fangen/zelt.webp')
    expect(g.field.y).toBeGreaterThanOrEqual(55)
    for (const r of g.rounds) {
      expect(r.speed).toBeGreaterThanOrEqual(0.04)
      expect(r.speed).toBeLessThanOrEqual(0.09)
      for (const id of r.kids) expect(g.kids.map((k) => k.id)).toContain(id)
    }
    for (const k of g.kids) expect(k.w >= 6 && k.w <= 8, k.id).toBe(true)
    expect(g.field.x + g.field.w).toBeLessThanOrEqual(100)
    expect(g.field.y + g.field.h).toBeLessThanOrEqual(100)
    expect(g.tent[0] >= 0 && g.tent[0] <= 100 && g.tent[1] >= 0 && g.tent[1] <= 100).toBe(true)
    expect(g.background).toBe(stage(6).image)
  })

  it('9 relay: three herds, then four, each a troop of three animals, the room gets narrower and the walk faster, the road runs from left to right inside the picture', () => {
    const g = stage(9).task.relay
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.herds.length)).toEqual([3, 4])
    expect(g.herds.every((h) => h.copies === 3)).toBe(true)
    expect(g.rounds.map((r) => r.minGap)).toEqual([25, 20])
    expect(g.rounds[1]!.minGap).toBeLessThan(g.rounds[0]!.minGap)
    expect(g.rounds[1]!.speed).toBeGreaterThan(g.rounds[0]!.speed)
    for (const r of g.rounds) for (const id of r.herds) expect(g.herds.map((h) => h.id)).toContain(id)
    expect(g.road.length).toBeGreaterThanOrEqual(2)
    for (const [x, y] of g.road) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
    expect(g.road[g.road.length - 1]![0]).toBeGreaterThan(g.road[0]![0])
    expect(g.background).toBe(stage(9).image)
  })

  it('7 guessing the herds: round 1 compares herds that are clearly different, round 2 asks for the range that contains the number; the animals exist and stand in the meadow', () => {
    const g = stage(7).task.guess
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.mode)).toEqual(['compare', 'range'])
    for (const r of g.rounds) {
      expect(r.tasks).toHaveLength(2)
      for (const t of r.tasks) {
        expect(g.animals.map((a) => a.id)).toContain(t.a.animal)
        expect(t.a.count).toBeGreaterThan(5)
        expect(t.a.count).toBeLessThanOrEqual(70)
        if (r.mode === 'compare') {
          expect(g.animals.map((a) => a.id)).toContain(t.b!.animal)
          const [hi, lo] = [Math.max(t.a.count, t.b!.count), Math.min(t.a.count, t.b!.count)]
          expect(hi / lo, 'clearly different herds').toBeGreaterThanOrEqual(1.5)
        } else {
          const ranges = t.ranges!
          expect(ranges).toHaveLength(3)
          expect(ranges.filter(([lo, hi]) => t.a.count >= lo && t.a.count <= hi)).toHaveLength(1)
          for (let i = 1; i < ranges.length; i++) expect(ranges[i]![0]).toBeGreaterThan(ranges[i - 1]![1])
        }
      }
    }
    // the right answers of round 2 are not always the same place
    const places = g.rounds[1]!.tasks.map((t) => t.ranges!.findIndex(([lo, hi]) => t.a.count >= lo && t.a.count <= hi))
    expect(new Set(places).size).toBeGreaterThanOrEqual(2)
    expect(g.region.x + g.region.w).toBeLessThanOrEqual(100)
    expect(g.region.y + g.region.h).toBeLessThanOrEqual(100)
    // the game lies on the picture of its stage
    expect(g.background).toBe(stage(7).image)
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
    expect(m.images).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/jakob/karte-pano-v3-${n}.webp`))
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
      expect(s.audio, `English recording ${s.id}`).toBe(`audio/abenteuer/jakob/geschichte-${String(s.id).padStart(2, '0')}-en-v4.mp3`)
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
    expect(stage(1).task.hint).toBe('Cook the soup before Esau arrives: tap lentils, water and wood.')
    expect(stage(1).task.stew!.hint).toBe(stage(1).task.hint)
    expect(stage(2).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
  })
})

describe.runIf(released)('Jakob: when the stages are released, every file exists and the size of the download is right', () => {
  it('all the files of the journey are there, none is too big, and the size of the pack is about what the data says', () => {
    let bytes = 0
    for (const f of journeyFiles(jakob)) {
      if (notPaintedYet(f) && !existsSync(`public/${f}`)) continue
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
