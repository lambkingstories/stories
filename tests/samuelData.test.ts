/**
 * The data of "Samuel und Saul" (`samuel.ts`, `en/samuel.en.ts`, `samuelPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Samuel/ENTWURF_Samuel.md`, Luther 1912),
 * the quiz stages are only quizzes, the six new games and the two old ones have sound data, the map has twelve stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { samuel } from '@/data/adventures/samuel'
import { SAMUEL_PATH } from '@/data/adventures/samuelPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { canHide, coatFits, fittingCoat, hidingSpots, stoneOk, untouchedMs, WALK_MS } from '@/utils/samuelGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => samuel.stages[n - 1]!
/** Words that no text of the German data may use (Samuel is told without cruelty: no blood, no weapons drawn, no killing). */
const FORBIDDEN = /\b(Messer|Speer|Schwert|Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|tot|töten|Tod|umbringen|zerrissen|schlachten|geschlachtet|Beulen)\b/i
const QUIZ_STAGES = [1, 4, 7, 12]

describe('Samuel und Saul: stories and questions', () => {
  it('twelve stages with 3 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(samuel.id).toBe('samuel')
    expect(samuel.age).toBe('8-10')
    expect(samuel.title).toBe('Samuel und Saul')
    expect(samuel.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(samuel.stages.map((s) => s.title)).toEqual([
      'Hanna betet',
      'Das kleine Oberkleid',
      'Gott ruft Samuel',
      'Die Lade bei den Philistern',
      'Zwei Kühe ziehen heim',
      'Eben-Ezer',
      'Wir wollen einen König',
      'Saul sucht die Eselinnen',
      'Samuel salbt Saul',
      'Saul wird König',
      'Saul kann nicht warten',
      'Gehorsam ist besser als Opfer'
    ])
    for (const s of samuel.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^1\. Samuel \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/samuel/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two or three questions per stage (the quiz stages three), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of samuel.stages) {
      expect(s.questions.length, `stage ${s.id}`).toBeGreaterThanOrEqual(2)
      expect(s.questions.length, `stage ${s.id}`).toBeLessThanOrEqual(3)
    }
    for (const n of QUIZ_STAGES) expect(stage(n).questions, `quiz stage ${n}`).toHaveLength(3)
    for (const q of [...samuel.stages.flatMap((s) => s.questions), ...samuel.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(samuel.exam).toHaveLength(6)
    const asked = samuel.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(samuel.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den'])
    for (const s of samuel.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the son, the call, the calves, the stone, the donkeys and obedience', () => {
    const q = samuel.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Hanna/)
    expect(q).toMatch(/Gott ihn ruft/)
    expect(q).toMatch(/Kühen/)
    expect(q).toMatch(/Eben-Ezer/)
    expect(q).toMatch(/Saul/)
    expect(q).toMatch(/besser als Opfer/)
  })

  it('the four quiz stages (1, 4, 7, 12) are only quizzes, never two in a row; the serious ones say so in the hint', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    for (const n of [1, 4, 12]) expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
    const kinds = samuel.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
    // a quiz at most at every third stage
    for (let i = 0; i + 2 < kinds.length; i++) expect(kinds.slice(i, i + 3).filter((k) => k === 'quiz').length, `three stages from ${i + 1}`).toBeLessThanOrEqual(1)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what was left out stays out', () => {
    expect(stage(1).text.join(' ')).toMatch(/Samuel/)
    expect(stage(3).text.join(' ')).toMatch(/Rede, Herr, denn dein Knecht hört/)
    expect(stage(6).text.join(' ')).toMatch(/Eben-Ezer/)
    expect(stage(6).text.join(' ')).toMatch(/Bis hierher hat uns Gott geholfen/)
    expect(stage(8).text.join(' ')).toMatch(/Eselinnen/)
    expect(stage(10).text.join(' ')).toMatch(/einen Kopf größer als alle/)
    expect(stage(10).text.join(' ')).toMatch(/Es lebe der König/)
    expect(stage(11).text.join(' ')).toMatch(/sieben Tage/)
    expect(stage(12).text.join(' ')).toMatch(/Gehorsam ist besser als Opfer/)
    // not told: the sons of Eli, Eli's death, the name Ikabod, the ban and the death of Agag, the crown
    const all = samuel.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Ikabod|Hofni|Pinhas|Agag|Krone/)
  })
})

describe('Samuel und Saul: the games', () => {
  it('the order of the games: 2 old (verse, order), 6 new, 4 quizzes; no game twice', () => {
    expect(samuel.stages.map((s) => s.task.kind)).toEqual(['quiz', 'oberkleid', 'lueckenvers', 'quiz', 'kuehe', 'stein', 'quiz', 'suchen', 'reihenfolge', 'gepaeck', 'volk', 'quiz'])
    const games = samuel.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['lueckenvers', 'reihenfolge'].includes(k))).toHaveLength(2)
  })

  it('2 coat: three rounds, in each exactly one robe fits the boy and the robes stay inside the picture', () => {
    const g = stage(2).task.coat!
    expect(g.rounds).toHaveLength(3)
    expect(g.boy).toMatch(/oberkleid\/samuel\.webp$/)
    expect(g.boyW).toHaveLength(3)
    expect(g.boyW).toEqual([...g.boyW].sort((a, b) => a - b))
    for (const r of g.rounds) {
      expect(r.coats).toHaveLength(3)
      expect(fittingCoat(r.coats, g.boyW[r.boy]!, g.ratio), r.hint).toBeGreaterThanOrEqual(0)
      expect(r.coats.filter((c) => coatFits(c, g.boyW[r.boy]!, g.ratio))).toHaveLength(1)
      // the robes on the shelf do not lie on top of each other (slot width against the robe width)
      const slot = (g.shelf.x1 - g.shelf.x0) / r.coats.length
      for (const c of r.coats) expect(c, r.hint).toBeLessThan(slot * 1.2)
    }
    expect(g.rounds.map((r) => r.boy)).toEqual([0, 1, 2])
    expect(g.shelf.y).toBeLessThanOrEqual(100)
    expect(g.shelf.x0).toBeLessThan(g.shelf.x1)
    expect(g.shelf.x1).toBeLessThanOrEqual(100)
    expect(g.boyPos.y).toBeLessThanOrEqual(100)
    // the right robe does not stand at the same place in every round
    expect(new Set(g.rounds.map((r) => fittingCoat(r.coats, g.boyW[r.boy]!, g.ratio))).size).toBeGreaterThan(1)
  })

  it('3 verse: the filled sentences stand in the text of the stage and the English file keeps the order of the words', () => {
    const g = stage(3).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(3).text.join(' ')
    const first = g.rounds[0]!
    const filled = first.parts.reduce((s, p, i) => s + p + (i < first.answers.length ? first.words[first.answers[i]!]! : ''), '')
    expect(text).toContain(filled.replace(/[„“]/g, '').replace(/\.$/, ''))
    // round two joins "Hier bin ich!" and "Du hast mich gerufen." from the story
    const second = g.rounds[1]!
    expect(second.words[second.answers[0]!]).toBe('bin')
    expect(second.words[second.answers[1]!]).toBe('gerufen')
    expect(text).toContain('Hier bin ich')
    expect(text).toContain('Du hast mich gerufen')
    setAdventureLanguage('en')
    const en = stage(3).task.verse!
    for (const [i, r] of g.rounds.entries()) {
      expect(en.rounds[i]!.words).toHaveLength(r.words.length)
      expect(en.rounds[i]!.parts).toHaveLength(r.parts.length)
    }
  })

  it('5 cows: two rounds, a gentle one and a stronger one; without tapping the cart reaches the grass sooner than the way ends, and one tap is enough to go on', () => {
    const g = stage(5).task.cows!
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[1]!.drift).toBeGreaterThan(g.rounds[0]!.drift)
    expect(g.rounds[1]!.dur).toBeGreaterThan(g.rounds[0]!.dur)
    for (const r of g.rounds) {
      expect(untouchedMs(r.drift), r.hint).toBeLessThan(r.dur)
      expect(untouchedMs(r.drift), r.hint).toBeGreaterThan(1800)
      expect(r.dur).toBeGreaterThanOrEqual(12000)
      expect(r.dur).toBeLessThanOrEqual(22000)
    }
    // the road is wide enough for the cart at the start and narrows toward the end; the cart stays in the picture and gets smaller
    expect(g.road.cx0 - g.road.half0).toBeGreaterThan(0)
    expect(g.road.cx0 + g.road.half0).toBeLessThan(100)
    expect(g.road.half0 * 2).toBeGreaterThan(g.cartW)
    expect(g.road.half1).toBeLessThan(g.road.half0)
    expect(g.road.y0).toBeGreaterThan(g.road.y1)
    expect(g.road.y0).toBeLessThanOrEqual(95)
    expect(g.road.y1).toBeGreaterThan(30)
    expect(g.tufts.length).toBeGreaterThanOrEqual(4)
    expect(new Set(g.tufts.map((t) => t.image)).size).toBe(4)
    expect(stage(5).task.hint).toMatch(/Seite/)
  })

  it('6 stone: two rounds with two pairs each, the groove only in round 1, the middle of every pair lies inside the picture and the stones are far enough from the landmarks to be told apart', () => {
    const g = stage(6).task.stone!
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds.map((r) => r.notch)).toEqual([true, false])
    for (const r of g.rounds) {
      expect(r.pairs).toHaveLength(2)
      for (const p of r.pairs) {
        const dist = Math.abs(p.b.x - p.a.x)
        expect(dist, r.hint).toBeGreaterThanOrEqual(36)
        expect(p.a.x).toBeGreaterThan(5)
        expect(p.b.x).toBeLessThan(95)
        expect(stoneOk((p.a.x + p.b.x) / 2, p.a.x, p.b.x)).toBe(true)
        // a stone near the landmark is wrong
        expect(stoneOk(p.a.x + dist * 0.25, p.a.x, p.b.x)).toBe(false)
        expect(p.a.image).toBeLessThan(g.marks.length)
        expect(p.b.image).toBeLessThan(g.marks.length)
      }
    }
    expect(g.markW).toHaveLength(g.marks.length)
    expect(g.groundY).toBeLessThan(g.startPos.y)
  })

  it('8 search: two rounds of five places each in the order of the story; footprints only in round 1; the places lie inside the picture and do not touch', () => {
    const g = stage(8).task.search!
    expect(g.places.map((p) => p.label)).toEqual(['Ephraim', 'Schalischa', 'Schaalim', 'Benjamin', 'Zuf'])
    expect(g.rounds.map((r) => r.prints)).toEqual([true, false])
    for (const r of g.rounds) expect([...r.order].sort()).toEqual([0, 1, 2, 3, 4])
    expect(g.rounds[0]!.order).toEqual([0, 1, 2, 3, 4])
    for (const p of g.places) {
      expect(p.x - p.w / 2).toBeGreaterThan(0)
      expect(p.x + p.w / 2).toBeLessThan(100)
      expect(p.y).toBeLessThanOrEqual(95)
      expect(p.y - (p.w * 12) / 9 / 2).toBeGreaterThan(2)
    }
    for (let i = 0; i < g.places.length; i++) {
      for (let j = i + 1; j < g.places.length; j++) {
        const a = g.places[i]!
        const b = g.places[j]!
        expect(Math.hypot(a.x - b.x, (a.y - b.y) * 0.75), `${a.label} - ${b.label}`).toBeGreaterThan(14)
      }
    }
    expect(g.prints).toHaveLength(4)
    expect(new Set(g.prints).size).toBe(4)
    expect(g.rounds[1]!.hint).toContain('Ephraim')
    expect(g.rounds[1]!.hint).toContain('Zuf')
  })

  it('9 order: four cards, round 1 three with dots, round 2 all four without; the anointing comes first and the signs follow in the order of Samuel\'s words', () => {
    const g = stage(9).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['salbung', 'grab', 'eiche', 'propheten'])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[0]!.cards).toEqual(['grab', 'eiche', 'propheten'])
    expect(g.rounds[1]!.cards).toEqual(['salbung', 'grab', 'eiche', 'propheten'])
    expect(new Set(g.cards.map((c) => c.image)).size).toBe(4)
  })

  it('10 baggage: two rounds with five and eight piles; Saul hides behind a pile that is tall enough for him, and there is more than one such pile', () => {
    const g = stage(10).task.baggage!
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds.map((r) => r.piles.length)).toEqual([5, 8])
    expect(g.piles).toHaveLength(4)
    expect(g.things).toHaveLength(3)
    expect(g.pileW).toHaveLength(4)
    expect(g.pileH).toHaveLength(4)
    // every pile in its full size is taller than Saul; the small ones (scale 0.7 and less) are not
    for (const h of g.pileH) {
      expect(h).toBeGreaterThan(g.saulH)
      expect(h * 0.7).toBeLessThan(g.saulH)
    }
    for (const r of g.rounds) {
      const heights = r.piles.map((p) => g.pileH[p.kind]! * (p.scale ?? 1))
      const spots = hidingSpots(heights, g.saulH)
      expect(spots.length, r.hint).toBeGreaterThanOrEqual(2)
      expect(spots, r.hint).toContain(r.hidden)
      expect(canHide(heights[r.hidden]!, g.saulH)).toBe(true)
      for (const p of r.piles) {
        expect(p.x).toBeGreaterThan(5)
        expect(p.x).toBeLessThan(95)
        expect(p.y).toBeLessThanOrEqual(95)
      }
      // the piles stand one after the other: two piles do not lie on the same spot
      for (let i = 0; i < r.piles.length; i++) {
        for (let j = i + 1; j < r.piles.length; j++) expect(Math.hypot(r.piles[i]!.x - r.piles[j]!.x, (r.piles[i]!.y - r.piles[j]!.y) * 0.75), `${i}-${j}`).toBeGreaterThan(8)
      }
    }
    expect(g.rounds[0]!.hidden === g.rounds[1]!.hidden && g.rounds[0]!.piles[g.rounds[0]!.hidden]!.x === g.rounds[1]!.piles[g.rounds[1]!.hidden]!.x).toBe(false)
  })

  it('11 gather: three days and seven days, every leave begins early enough to be answered before the last day ends, six men, and Samuel is in the picture; no word about offering', () => {
    const g = stage(11).task.gather!
    expect(g.rounds.map((r) => r.days)).toEqual([3, 7])
    expect(g.men).toHaveLength(6)
    expect(g.homes).toHaveLength(6)
    expect(g.rounds[1]!.dayMs).toBeLessThan(g.rounds[0]!.dayMs)
    for (const r of g.rounds) {
      const ats = r.leaves.map((l) => l.at)
      expect(ats, r.hint).toEqual([...ats].sort((a, b) => a - b))
      for (const l of r.leaves) {
        expect(l.man).toBeLessThan(g.homes.length)
        expect(l.at + WALK_MS, r.hint).toBeLessThanOrEqual(r.days * r.dayMs)
      }
      // the same man does not leave again before he could have walked off and been brought back
      for (const m of new Set(r.leaves.map((l) => l.man))) {
        const mine = r.leaves.filter((l) => l.man === m).map((l) => l.at)
        for (let i = 1; i < mine.length; i++) expect(mine[i]! - mine[i - 1]!, `man ${m}`).toBeGreaterThanOrEqual(WALK_MS)
      }
    }
    expect(g.rounds[0]!.leaves).toHaveLength(3)
    expect(g.rounds[1]!.leaves).toHaveLength(7)
    for (const h of g.homes) {
      expect(h.sprite).toBeLessThan(g.men.length)
      expect(h.x).toBeGreaterThan(6)
      expect(h.x).toBeLessThan(92)
      expect(h.y).toBeLessThanOrEqual(95)
      expect([-1, 1]).toContain(h.dir)
    }
    expect(new Set(g.homes.map((h) => h.sprite)).size).toBe(6)
    const hints = g.rounds.map((r) => r.hint).join(' ') + stage(11).task.hint
    expect(hints).not.toMatch(/opfer/i)
    expect(g.samuelPos.x + g.samuelPos.w / 2).toBeLessThanOrEqual(100)
    expect(g.saulPos.x - g.saulPos.w / 2).toBeGreaterThan(0)
    expect(g.saulPos.x + g.saulPos.w / 2).toBeLessThan(100)
  })

  it('the questions do not ask what a game of the stage shows (not how many piles, not how many days)', () => {
    expect(stage(10).questions.map((q) => q.q).join(' ')).not.toMatch(/Wie viele/)
    expect(stage(11).questions.map((q) => q.q).join(' ')).not.toMatch(/Wie viele Männer/)
  })
})

describe('Samuel und Saul: map, files, English', () => {
  it('twelve stations from left to right, not too low (the name and the button stay above the tab bar), at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = samuel.map
    expect(m.stages).toHaveLength(12)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1070)
      expect(s.d).toBeCloseTo(336 / 12942, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 12942, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(SAMUEL_PATH).toHaveLength(12)
    expect(m.path).toBe(SAMUEL_PATH)
    expect(m.aspect).toBeCloseTo(12942 / 1648, 6)
    expect(m.widthPx).toBe(12942)
    expect(m.images).toHaveLength(4)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(samuel).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/samuel\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(samuel)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(samuel) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Samuel and Saul')
    expect(en.stages).toHaveLength(12)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Hannah Prays')
    expect(stage(8).task.search!.places[1]!.label).toBe('Shalisha')
    expect(stage(2).task.coat!.rounds[0]!.hint).toContain('Which little robe')
    expect(stage(11).task.gather!.rounds[1]!.hint).toContain('seven days')
    // the English recordings are their own files, never the German ones
    for (const s of samuel.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/samuel/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of samuel.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/samuel/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
