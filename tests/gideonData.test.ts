/**
 * The data of "Gideon" (`gideon.ts` and `en/gideon.en.ts`), phase 2a: the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Gideon/ENTWURF_Gideon.md`), every stage has the game of the plan (the stages 1, 5 and 11 only the questions) and a picture of Josef until the own pictures are built in, the map is the
 * placeholder map of Josef (twelve stations + exam), and the English file has the same shape. The own pictures and recordings are not there yet (`audio` is missing on purpose).
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { josef } from '@/data/adventures/josef'
import { gideon } from '@/data/adventures/gideon'
import { GIDEON_PATH } from '@/data/adventures/gideonPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { adventureLanguage, setAdventureLanguage } from '@/use/adventureLanguage'
import { isStageOpen } from '@/utils/adventureScore'
import { blow, deadlock, inBox, isSolved, lit, makePieces, PAIR_SPEED, pushesOf, SLOPE, solvable, stopParts, tilesFor, wayLength, wayPoint } from '@/utils/gideonGames'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => gideon.stages[n - 1]!
/** Words that no text of the German data may use (the night with the jars is told without fighting; the dream of the Midianite says "Schwert" in the Bible, so that one word is allowed). */
/** Stages whose text was corrected for Bible faithfulness on 21.10.2026 and wait for a new recording (see `NEUAUFNAHME-BIBELTREUE-2026-10-21.md`). */
const RECORDED_AGAIN = [2, 3, 8, 9, 10, 11, 12]
const FORBIDDEN = /\b(Messer|Speer|Pfeil|Blut|töten|erschlagen|erwürgen|Teufel|Hölle)\b/i

describe('Gideon: stories and questions', () => {
  it('twelve stages with 3 or 4 paragraphs of 90 to 145 words (plan v3) and the Bible passage under every one; the German recordings; the stage pictures are the ones of Josef (PLATZHALTER)', () => {
    expect(gideon.id).toBe('gideon')
    expect(gideon.age).toBe('8-10')
    expect(gideon.title).toBe('Gideon')
    expect(gideon.subtitle).toBe('Der Kleinste und die Dreihundert')
    expect(gideon.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(gideon.stages.map((s) => s.title)).toEqual([
      'Debora und Barak',
      'Die Midianiter kommen',
      'Gideon in der Kelter',
      'Feuer aus dem Fels',
      'Der Altar des Baal',
      'Das Fell auf der Tenne',
      'Zu viele Männer',
      'Am Wasser',
      'Der Traum im Lager',
      'Krüge, Fackeln und Posaunen',
      'Ephraim und die Furten',
      'Gott soll euer Herr sein'
    ])
    for (const s of gideon.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Richter \d/)
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
      // the stages with a text corrected on 21.10.2026 (Bible faithfulness) were recorded again ("-v4")
      expect(s.audio, `German recording ${s.id}`).toBe(`audio/abenteuer/gideon/geschichte-${String(s.id).padStart(2, '0')}-${RECORDED_AGAIN.includes(s.id) ? 'v4' : 'v3'}.mp3`)
      expect(existsSync(`public/${s.audio}`), `file ${s.audio}`).toBe(true)
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/gideon/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
    expect(new Set(gideon.stages.map((s) => s.image)).size).toBe(12)
  })

  it('two questions per stage, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    expect(gideon.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
    for (const q of [...gideon.stages.flatMap((s) => s.questions), ...gideon.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(gideon.exam).toHaveLength(6)
    const asked = gideon.stages.flatMap((s) => s.questions.map((q) => q.q))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(gideon.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von'])
    for (const s of gideon.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        // at least one word of the right answer (cut to its first five letters, for endings) lies in the text
        const hit = words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the serious stages (1, 5, 11) say so in the hint and are only quizzes; the war of Debora and the altar of Baal are told without fighting', () => {
    expect(stage(1).task.hint).toContain('ernst')
    expect(stage(5).task.hint).toContain('ernst')
    expect(stage(11).task.hint).toContain('ernst')
    expect(stage(1).task.kind).toBe('quiz')
    expect(stage(5).task.kind).toBe('quiz')
    const t1 = stage(1).text.join(' ')
    expect(t1).toMatch(/Debora/)
    expect(t1).not.toMatch(/Jael|Nagel|Schläfe|gefallen|Schwert/)
    const t5 = stage(5).text.join(' ')
    expect(t5).toMatch(/Baal/)
    expect(t5).not.toMatch(/sterben|töten|Tod/)
  })

  it('God is "Gott" everywhere in the narration (also in direct speech); the angel is named only as "Engel Gottes" or "Engel"', () => {
    const all = gideon.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/der Herr\b|dem Herrn\b|\bHERR\b/)
    expect(stage(3).text.join(' ')).toMatch(/Engel Gottes/)
    expect(stage(4).text.join(' ')).toMatch(/Feuer aus dem Felsen/)
  })

  it('the questions do not ask what a game of the stage will show (the word, the dew, the men who drink from the hand)', () => {
    const q = (n: number) => stage(n).questions.map((x) => x.q).join(' ').toLowerCase()
    expect(q(4)).not.toMatch(/wie nennt gideon den altar|wohin legt gideon/)
    expect(q(6)).not.toMatch(/wo liegt.*tau/)
    expect(q(8)).not.toMatch(/woran erkennt/)
  })
})

describe('Gideon: the games, and the placeholders until the pictures come', () => {
  it('every stage has the game of the plan; the stages 1, 5 and 11 are only questions; two old mechanics at most (hidden picture, memory), every other game is new', () => {
    expect(gideon.stages.map((s) => s.task.kind)).toEqual(['quiz', 'hoehle', 'worfeln', 'wort', 'quiz', 'tau', 'weiche', 'wimmelbild', 'schleichen', 'zeichen', 'quiz', 'memory'])
    for (const s of gideon.stages) expect(s.task.hint.length, `hint ${s.id}`).toBeGreaterThan(8)
  })

  it('4 word: two words from the text (FRIEDE and FELSEN), one extra letter each that is not in the word; the English words are PEACE and ROCK; the goal comes from the letters', () => {
    const g = stage(4).task.word
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => r.word)).toEqual(['FRIEDE', 'FELSEN'])
    for (const r of g.rounds) {
      expect(r.word).toBe(r.word.toUpperCase())
      expect(r.extra).toHaveLength(1)
      for (const l of r.extra) expect(r.word, `extra ${l}`).not.toContain(l)
      expect(stage(4).text.join(' ').toUpperCase()).toContain(r.word)
      const tiles = tilesFor(r.word, r.extra)
      expect(tiles).toHaveLength(r.word.length + 1)
    }
    expect(g.rounds.reduce((n, r) => n + r.word.length, 0)).toBe(12)
    setAdventureLanguage('en')
    expect(stage(4).task.word!.rounds.map((r) => r.word)).toEqual(['PEACE', 'ROCK'])
    expect(stage(4).task.word!.rounds.reduce((n, r) => n + r.word.length, 0)).toBe(9)
    setAdventureLanguage('de')
  })

  it('8 hidden picture: five men and three covers (two pictures), every man lies on the scene and at least half of them are partly hidden; 12 memory: six pairs with a sentence that is true to the text', () => {
    const f = stage(8).task.find
    expect(f, 'the game is built').toBeDefined()
    expect(stage(8).task.count).toBe(5)
    expect(f!.finds).toHaveLength(5)
    expect(f!.covers).toHaveLength(3)
    expect(new Set(f!.covers.map((c) => c.image)).size).toBe(2)
    expect(new Set(f!.finds.map((c) => c.image)).size).toBe(2)
    expect(f!.labels).toHaveLength(5)
    for (const t of [...f!.finds, ...f!.covers]) expect(t.x >= 0 && t.x <= 100 && t.y >= 0 && t.y <= 100).toBe(true)
    // a cover hides a man when it stands in front of him: near in the width and its bottom edge a little lower
    const hidden = f!.finds.filter((m) => f!.covers.some((c) => Math.abs(c.x - m.x) < c.w / 2 && c.y >= m.y && c.y - m.y < 12))
    expect(hidden.length).toBeGreaterThanOrEqual(3)
    const m = stage(12).task.memory
    expect(m, 'the game is built').toBeDefined()
    expect(m!.pairs).toHaveLength(6)
    const told = gideon.stages.map((s) => s.text.join(' ')).join(' ')
    for (const word of ['Palme', 'Kelter', 'Fell', 'Altar', 'Fackel', 'Friede', 'Debora', 'Weizen']) expect(told, word).toContain(word)
    expect(m!.back).toMatch(/spiele\/gideon\/memory\//)
    expect(stage(8).task.kind).toBe('wimmelbild')
    expect(stage(12).task.kind).toBe('memory')
  })

  it('6 dew: the first night four drops on the fleece, the second six drops on the ground round it; the fleece lies on the floor; the goal is 10', () => {
    const g = stage(6).task.dew
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.wet, r.spots.length])).toEqual([['fleece', 4], ['ground', 6]])
    for (const r of g.rounds) {
      for (const [x, y] of r.spots) {
        expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
        expect(inBox({ x, y }, g.fleeceBox), `(${x}, ${y}) ${r.wet}`).toBe(r.wet === 'fleece')
      }
    }
    expect(g.fleeceBox.x + g.fleeceBox.w).toBeLessThanOrEqual(100)
    expect(g.fleeceBox.y + g.fleeceBox.h).toBeLessThanOrEqual(100)
    expect(g.rounds.reduce((n, r) => n + r.spots.length, 0)).toBe(10)
  })

  it('3 winnow: eight pieces of chaff, then ten; the right wind gets narrower and no gust comes; six grains each; the pieces can be told apart by their wind (grains never fly in the window); the tray lies in the picture', () => {
    const g = stage(3).task.winnow
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.chaff, r.grains, r.window, r.gust])).toEqual([[8, 6, [35, 75], 0], [10, 6, [42, 64], 0]])
    expect(g.rounds[1]!.window[1] - g.rounds[1]!.window[0]).toBeLessThan(g.rounds[0]!.window[1] - g.rounds[0]!.window[0])
    for (const r of g.rounds) {
      const pieces = makePieces(r)
      expect(blow(pieces, r.window[1] + r.gust).grains, 'no grain flies in the window').toEqual([])
      expect(blow(pieces, r.window[1]).chaff).toHaveLength(r.chaff)
      expect(blow(pieces, 100).grains.length).toBeGreaterThan(0)
    }
    expect(g.trayBox.x + g.trayBox.w).toBeLessThanOrEqual(100)
    expect(g.trayBox.y + g.trayBox.h).toBeLessThanOrEqual(100)
    expect(g.rounds.reduce((n, r) => n + r.chaff, 0)).toBe(18)
  })

  it('7 switch: five men, then six with two waiting and a bubble that goes away; every round has men who go home and men who stay; the fork lies in the picture; the goal is 11', () => {
    const g = stage(7).task.swit
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.men.length, r.queue, r.hideBubbleMs ?? 0])).toEqual([[5, 1, 0], [6, 2, 2000]])
    for (const r of g.rounds) {
      expect(r.men.filter((m) => m === 'home').length).toBeGreaterThanOrEqual(2)
      expect(r.men.filter((m) => m === 'stay').length).toBeGreaterThanOrEqual(2)
      for (const m of r.men) expect(['home', 'stay']).toContain(m)
    }
    expect(g.men).toHaveLength(2)
    // one lever picture for both sides: the left one is the right one turned round
    expect(g.leverLeft).toBeUndefined()
    expect(g.leverRight).toContain('hebel.webp')
    expect(g.fork[0] >= 0 && g.fork[0] <= 100 && g.fork[1] >= 0 && g.fork[1] <= 100).toBe(true)
    // the men queue up the path, which must stay inside the picture
    expect(g.fork[1] - 13 * (g.rounds[1]!.queue - 1)).toBeGreaterThan(0)
    expect(g.rounds.reduce((n, r) => n + r.men.length, 0)).toBe(11)
  })

  it('10 cue: two signals, then three with an owl (twice) that must not be answered; the waiting is a few seconds; the groups stand on both sides, Gideon in the middle; the goal is 5', () => {
    const g = stage(10).task.cue
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.signals, r.decoys])).toEqual([[2, []], [3, ['owl', 'owl']]])
    for (const r of g.rounds) {
      expect(r.waitMs[0]).toBeGreaterThanOrEqual(2000)
      expect(r.waitMs[1]).toBeLessThanOrEqual(5000)
      expect(r.waitMs[0]).toBeLessThan(r.waitMs[1])
      for (const d of r.decoys) expect(Object.keys(g.decoyImages)).toContain(d)
    }
    expect(g.groups.map((x) => x.id)).toEqual(['links', 'rechts'])
    expect(g.groups[0]!.x).toBeLessThan(g.leader.x)
    expect(g.groups[1]!.x).toBeGreaterThan(g.leader.x)
    // the answers: Gideon first, then the two groups; the signals are as many as the goal says
    expect(g.rounds.reduce((n, r) => n + r.signals, 0)).toBe(5)
    // the three groups are one picture; no picture of the wind any more
    expect(new Set([...g.groups.map((x) => x.image), g.front.image]).size).toBe(1)
    expect(Object.keys(g.decoyImages)).toEqual(['owl'])
  })

  it('2 cave: two sacks, then three, both in 5 x 4 without rock; both puzzles can be solved (3 and 5 pushes, 8 and 12 steps); nobody starts on a niche or in a dead end; the goal is 5', () => {
    const g = stage(2).task.cave
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.cols, r.rows, r.sacks.length, r.niches.length])).toEqual([[5, 4, 2, 2], [5, 4, 3, 3]])
    expect(g.rounds.map((r) => pushesOf(r, { man: r.man, sacks: r.sacks }))).toEqual([3, 5])
    for (const r of g.rounds) {
      expect(solvable(r)).toBe(true)
      const start = { man: r.man, sacks: r.sacks }
      expect(isSolved(r, start)).toBe(false)
      expect(deadlock(r, start), 'no dead end at the start').toBe(false)
      for (const [c, row] of [r.man, ...r.sacks, ...r.niches, ...r.walls]) expect(c >= 0 && c < r.cols && row >= 0 && row < r.rows).toBe(true)
      expect(r.sacks.every((s) => !r.niches.some((n) => n[0] === s[0] && n[1] === s[1]))).toBe(true)
    }
    expect(g.area.x + g.area.w).toBeLessThanOrEqual(100)
    expect(g.area.y + g.area.h).toBeLessThanOrEqual(100)
    expect(g.rounds.every((r) => r.walls.length === 0)).toBe(true)
    expect(g.wall).toBeUndefined()
    expect(g.rounds.reduce((n, r) => n + r.sacks.length, 0)).toBe(5)
  })

  it('9 sneak: two rocks with two watchers, then three rocks with three watchers; the rocks lie on the way; and every stretch is free at some time for the whole walk (the cones leave a gap you can use)', () => {
    const g = stage(9).task.sneak
    expect(g, 'the game is built').toBeDefined()
    if (!g) return
    expect(g.rounds.map((r) => [r.stops.length, r.watchers.length])).toEqual([[2, 2], [3, 3]])
    const total = wayLength(g.path as [number, number][])
    for (const [ri, r] of g.rounds.entries()) {
      const parts = stopParts(g.path as [number, number][], r.stops as [number, number][])
      expect(parts).toHaveLength(r.stops.length)
      // the rocks lie on the way (within three percent of the width) and in order
      for (const [i, s] of r.stops.entries()) {
        const q = wayPoint(g.path as [number, number][], parts[i]!)
        expect(Math.hypot(q.x - s[0], (q.y - s[1]) * SLOPE), `rock ${i} of round ${ri + 1}`).toBeLessThan(3)
      }
      let from = 0
      for (const [k, to] of parts.entries()) {
        const seconds = ((to - from) * total) / PAIR_SPEED
        // is there a start time (0 to 40 seconds) at which no cone lights any point of the stretch while the pair walks it?
        let free = 0
        for (let start = 0; start < 40000; start += 100) {
          let ok = true
          for (let tau = 0; tau <= seconds + 0.001 && ok; tau += 0.05) {
            const p = wayPoint(g.path as [number, number][], from + ((to - from) * Math.min(tau, seconds)) / seconds)
            if (r.watchers.some((w) => lit(w, start + tau * 1000, p, 13))) ok = false
          }
          if (ok) free++
        }
        // the free start times add up to at least two seconds in forty (so that a child has room to start), and not always (the light really comes)
        expect(free, `stretch ${k + 1} of round ${ri + 1} has free times`).toBeGreaterThanOrEqual(20)
        expect(free, `stretch ${k + 1} of round ${ri + 1} is not always free`).toBeLessThan(380)
        from = to
      }
    }
    expect(g.rounds.reduce((n, r) => n + r.stops.length, 0)).toBe(5)
    expect(g.watcherImages.length).toBeGreaterThanOrEqual(2)
  })

  it('every game has at most two rounds, a hint for each round, and the kinds of the games are all different', () => {
    const g = (n: number) => stage(n).task
    const rounds = [g(2).cave!.rounds, g(3).winnow!.rounds, g(4).word!.rounds, g(6).dew!.rounds, g(7).swit!.rounds, g(9).sneak!.rounds, g(10).cue!.rounds]
    for (const r of rounds) {
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r.length).toBeLessThanOrEqual(2)
      for (const x of r) expect(x.hint.length).toBeGreaterThan(8)
    }
    const kinds = gideon.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(kinds).size).toBe(kinds.length)
    expect(kinds.filter((k) => ['wimmelbild', 'memory'].includes(k))).toHaveLength(2)
    for (const n of [1, 5, 11]) expect(stage(n).task.kind).toBe('quiz')
  })

  it('no stage is "soon": the first stage is open at the start, the others open one after the other', () => {
    expect(gideon.stages.every((s) => !s.soon)).toBe(true)
    const open = gideon.stages.map((_, i) => isStageOpen(gideon, undefined, i))
    expect(open).toEqual([true, ...Array(11).fill(false)])
  })

  it('no stage picture and no game background is a picture of Josef any more (only map, medal and gift are placeholders)', () => {
    const names = JSON.stringify(gideon.stages.map((s) => [s.image, s.task]))
    expect(names).not.toContain('abenteuer/josef/')
    for (const s of gideon.stages) expect(existsSync(`public/${s.image}`), s.image).toBe(true)
  })

  it('the medal and the gift picture are the own ones of Gideon; the gift has its final title', () => {
    expect(gideon.medal).toBe('images/abenteuer/gideon/medaille-v3.webp')
    expect(existsSync(`public/${gideon.medal}`)).toBe(true)
    expect(gideon.gift.title).toBe('Die Nacht mit den Krügen und Fackeln')
    expect(gideon.gift.image).toBe('images/abenteuer/gideon/geschenk.webp')
    expect(existsSync(`public/${gideon.gift.image}`)).toBe(true)
  })

  it('every file that the data names exists (the own stage pictures, the map and medal of Josef) and is small enough', () => {
    let bytes = 0
    for (const f of journeyFiles(gideon)) {
      if (notPaintedYet(f) && !existsSync(`public/${f}`)) continue
      expect(existsSync(`public/${f}`), `missing: ${f}`).toBe(true)
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(1_800_000)
      bytes += size
    }
    expect(bytes / 1_000_000, 'the placeholder pack in MB').toBeLessThan(20)
  })
})

describe('Gideon: die Karte', () => {
  const m = gideon.map
  it('vier Stücke eines Bildes (eigene Karte v3), jedes unter 1,8 MB; zwölf Stationen von links nach rechts plus Ziel, nicht zu tief; der Perlenweg hat eine Strecke je Station (die letzte führt zum Ziel)', () => {
    expect(m.images).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/gideon/karte-pano-v4-${n}.webp`))
    for (const f of m.images) expect(statSync(`public/${f}`).size / 1024, f).toBeLessThan(1800)
    expect(m.widthPx).toBe(9908)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 3)
    expect(m.stages).toHaveLength(12)
    expect(m.path).toHaveLength(12)
    expect(m.path).toBe(GIDEON_PATH)
    const spots = [...m.stages, m.exam]
    spots.forEach((sp, i) => {
      expect(sp.y, `Station ${i + 1} nicht hinter der Leiste`).toBeLessThanOrEqual(0.65)
      if (i > 0) expect(sp.x, `Station ${i + 1} rechts von ${i}`).toBeGreaterThan(spots[i - 1]!.x)
    })
    for (const seg of m.path) for (const [x, y] of seg) expect(x > 0 && x < 1 && y > 0 && y <= 0.8).toBe(true)
  })
})

describe('Gideon: the lists of the writing session (stories-gideon-v3-*.json) say exactly what the data says', () => {
  const de = 'D:/Claude/Abenteuer-Gideon/stories-gideon-v3-de.json'
  const en = 'D:/Claude/Abenteuer-Gideon/ENGLISCH/stories-gideon-v3-en.json'
  // the lists lie outside the repository (they belong to the drafts); on another computer there is nothing to compare
  it.runIf(existsSync(de) && existsSync(en))('German and English list (plan v3): twelve entries, the same paragraphs as the data, the German recording linked', () => {
    const read = (f: string) => JSON.parse(readFileSync(f, 'utf-8')) as { n: number; text: string[]; audio: string }[]
    const overlay = englishTextsOf(gideon) as any
    setAdventureLanguage('de')
    const dl = read(de)
    const el = read(en)
    expect(dl).toHaveLength(12)
    expect(el).toHaveLength(12)
    gideon.stages.forEach((s, i) => {
      expect(dl[i]!.n).toBe(s.id)
      expect(dl[i]!.text, `German list ${s.id}`).toEqual(s.text)
      expect(el[i]!.text, `English list ${s.id}`).toEqual(overlay.stages[i].text)
      // the German recording of the new text is linked (the English list has none yet); not for the stages that wait for a new recording
      expect(s.audio).toBe(`audio/abenteuer/gideon/geschichte-${String(s.id).padStart(2, '0')}-${RECORDED_AGAIN.includes(s.id) ? 'v4' : 'v3'}.mp3`)
    })
  })
})

describe('Gideon: English', () => {
  const overlay = englishTextsOf(gideon) as any

  it('has the same shape as the German data (the same number of stages, paragraphs, questions, answers, exam questions) and no German word is left', () => {
    expect(overlay).toBeTruthy()
    expect(overlay.stages).toHaveLength(12)
    overlay.stages.forEach((e: any, i: number) => {
      const s = gideon.stages[i]!
      setAdventureLanguage('de')
      const dePar = s.text.length
      const deQ = s.questions.map((q) => q.options.length)
      expect(e.text, `paragraphs ${s.id}`).toHaveLength(dePar)
      expect(e.questions.map((q: any) => q.options.length), `answers ${s.id}`).toEqual(deQ)
      expect(e.audio, `English recording ${s.id}`).toBe(`audio/abenteuer/gideon/geschichte-${String(s.id).padStart(2, '0')}-en-v4.mp3`)
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
    const de = gideon.stages.map((s) => ({ title: s.title, text: [...s.text], hint: s.task.hint, q: s.questions.map((q) => q.q), ref: s.ref }))
    setAdventureLanguage('en')
    gideon.stages.forEach((s, i) => {
      expect(s.title, `title ${s.id}`).not.toBe(de[i]!.title)
      expect(s.text.join(' '), `text ${s.id}`).not.toBe(de[i]!.text.join(' '))
      expect(s.task.hint, `hint ${s.id}`).not.toBe(de[i]!.hint)
      s.questions.forEach((q, k) => expect(q.q, `question ${s.id}.${k}`).not.toBe(de[i]!.q[k]))
      expect(s.ref, `ref ${s.id}`).toMatch(/^Judges \d/)
    })
    expect(gideon.title).toBe('Gideon')
    expect(gideon.subtitle).toBe('The Smallest and the Three Hundred')
    expect(gideon.gift.title).toBe('The Night of the Jars and Torches')
    expect(adventureLanguage.value).toBe('en')
    expect(stage(1).text.join(' ')).toMatch(/Deborah/)
    expect(stage(3).text.join(' ')).toMatch(/Ophrah/)
    expect(stage(9).text.join(' ')).toMatch(/Purah/)
    for (const q of [...gideon.stages.flatMap((s) => s.questions), ...gideon.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer).toBe(0)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
    }
    expect(stage(1).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
  })
})
