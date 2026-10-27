/**
 * The data of "David" (`david.ts`, `en/david.en.ts`, `davidPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-David/ENTWURF_David.md`, Luther 1912),
 * the quiz stages are only quizzes, the six new games and the five old ones have sound data, the map has fifteen stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { david } from '@/data/adventures/david'
import { DAVID_PATH } from '@/data/adventures/davidPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { arrowLanding, arrowZoneHit, dist, nearestOnPath, pathLength, slingAimError, slingAngle, slingHit, slingPos, stringAt, ASPECT } from '@/utils/davidGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => david.stages[n - 1]!
/** Words that no text of the German data may use (David is told without cruelty: no blood, no killing in detail, nothing gruesome). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Kopf ab|abgehauen|Usa)\b/i
const QUIZ_STAGES = [3, 8, 12, 15]

describe('David: stories and questions', () => {
  it('fifteen stages with 3 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(david.id).toBe('david')
    expect(david.age).toBe('8-10')
    expect(david.title).toBe('David')
    expect(david.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(david.stages.map((s) => s.title)).toEqual([
      'Der Jüngste auf der Weide',
      'Die Harfe für Saul',
      'Brot für die Brüder',
      'Die Rüstung ist zu schwer',
      'Fünf glatte Steine',
      'David und Goliat',
      'Jonatan und David',
      'Saul wird neidisch',
      'Das Zeichen mit den Pfeilen',
      'In der Höhle',
      'Abigajil bringt Brot',
      'Davids Klage',
      'König in Hebron und Jerusalem',
      'Die Lade kommt heim',
      'Ein Haus für Gott?'
    ])
    for (const s of david.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^[12]\. Samuel \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/david/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two or three questions per stage (the quiz stages three), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of david.stages) {
      expect(s.questions.length, `stage ${s.id}`).toBeGreaterThanOrEqual(2)
      expect(s.questions.length, `stage ${s.id}`).toBeLessThanOrEqual(3)
    }
    for (const n of QUIZ_STAGES) expect(stage(n).questions, `quiz stage ${n}`).toHaveLength(3)
    for (const q of [...david.stages.flatMap((s) => s.questions), ...david.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(14)
    }
    expect(david.exam).toHaveLength(6)
    const asked = david.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(david.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den'])
    for (const s of david.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the sheep, the harp, the sling, the gifts, the corner and the tent', () => {
    const q = david.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Samuel nach den Söhnen/)
    expect(q).toMatch(/für Saul/)
    expect(q).toMatch(/Goliat/)
    expect(q).toMatch(/Jonatan/)
    expect(q).toMatch(/Höhle/)
    expect(q).toMatch(/Lade/)
  })

  it('the four quiz stages (3, 8, 12, 15) are only quizzes, never two in a row; the serious ones say so in the hint', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    for (const n of [8, 12]) expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
    const kinds = david.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
    for (let i = 0; i + 2 < kinds.length; i++) expect(kinds.slice(i, i + 3).filter((k) => k === 'quiz').length, `three stages from ${i + 1}`).toBeLessThanOrEqual(1)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); what was left out stays out', () => {
    expect(stage(1).text.join(' ')).toMatch(/Gott sieht das Herz an/)
    expect(stage(2).text.join(' ')).toMatch(/Harfe/)
    expect(stage(3).text.join(' ')).toMatch(/sechs Ellen und eine Handbreit/)
    expect(stage(4).text.join(' ')).toMatch(/Löwe oder ein Bär/)
    expect(stage(5).text.join(' ')).toMatch(/fünf glatte Steine/)
    expect(stage(6).text.join(' ')).toMatch(/Schleuder/)
    expect(stage(7).text.join(' ')).toMatch(/Bund/)
    expect(stage(8).text.join(' ')).toMatch(/Saul hat tausend geschlagen/)
    expect(stage(9).text.join(' ')).toMatch(/Pfeil liegt weiter vorn/)
    expect(stage(10).text.join(' ')).toMatch(/Zipfel/)
    expect(stage(12).text.join(' ')).toMatch(/Wie sind die Helden gefallen/)
    expect(stage(13).text.join(' ')).toMatch(/Du sollst mein Volk Israel hüten/)
    expect(stage(14).text.join(' ')).toMatch(/Obed-Edom/)
    expect(stage(15).text.join(' ')).toMatch(/Ich will dir ein Haus machen/)
    // not told: the head of Goliath, the foreskins, Nabal's death, Saul's death in detail, Uzzah, a crown
    const all = david.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Vorhäute|Haupt|Krone|Selbstmord|erstochen|Nabal stirbt/)
  })
})

describe('David: the games', () => {
  it('the order of the games: 5 old (verse, memory, order, puzzle, words), 6 new, 4 quizzes; no game twice', () => {
    expect(david.stages.map((s) => s.task.kind)).toEqual(['lueckenvers', 'harfe', 'quiz', 'hirte', 'kiesel', 'schleuder', 'memory', 'quiz', 'pfeil', 'zipfel', 'reihenfolge', 'quiz', 'puzzle', 'worte', 'quiz'])
    const games = david.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['lueckenvers', 'memory', 'reihenfolge', 'puzzle', 'worte'].includes(k))).toHaveLength(5)
  })

  it('1 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(1).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = stage(1).text.join(' ')
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      const filled = r.parts.map((p, i) => p + (r.answers[i] !== undefined ? r.words[r.answers[i]!] : '')).join('').replace(/[„“]/g, '')
      expect(text.includes(filled.replace(/\.$/, '').trim()), filled).toBe(true)
    }
  })

  it('2 harp: eight strings that a finger can hit one by one, calm needs rise, the pause grows, Saul has three pictures', () => {
    const g = stage(2).task.harp!
    expect(g.saul).toHaveLength(3)
    expect(g.strings.n).toBe(8)
    expect(g.strings.x1).toBeGreaterThan(g.strings.x0)
    expect(g.strings.y1).toBeGreaterThan(g.strings.y0)
    for (let i = 0; i < g.strings.n; i++) {
      const step = (g.strings.x1 - g.strings.x0) / (g.strings.n - 1)
      expect(stringAt(g.strings.x0 + i * step, g.strings.n, g.strings.x0, g.strings.x1)).toBe(i)
    }
    expect(g.rounds.map((r) => r.need)).toEqual([8, 10])
    expect(g.rounds[1]!.minGap).toBeGreaterThan(g.rounds[0]!.minGap)
    expect(g.harpPos.x + g.harpPos.w / 2).toBeLessThanOrEqual(100)
    expect(g.harpPos.x - g.harpPos.w / 2).toBeGreaterThanOrEqual(0)
    expect(g.saulPos.x + g.saulPos.w / 2).toBeLessThanOrEqual(100)
    expect(g.saulPos.x - g.saulPos.w / 2).toBeGreaterThanOrEqual(0)
  })

  it('4 shepherd: three lambs, a lion and a bear, every beast has a lamb to go to and enough time to be stopped; the second round has two beasts that overlap', () => {
    const g = stage(4).task.shepherd!
    expect(g.lambPos).toHaveLength(3)
    expect(g.animals).toHaveLength(2)
    expect(g.animalW).toHaveLength(2)
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds.map((r) => r.threats.length)).toEqual([2, 2])
    for (const r of g.rounds) {
      for (const th of r.threats) {
        expect(th.lamb).toBeLessThan(3)
        expect(th.animal).toBeLessThan(2)
        // at least four seconds to walk: David can get there
        expect(th.dur, r.hint).toBeGreaterThanOrEqual(5000)
      }
    }
    // round 1 one after the other: the second beast starts after the first has arrived and trotted off
    const [a, b] = g.rounds[0]!.threats
    expect(b!.delay).toBeGreaterThanOrEqual(a!.delay + a!.dur + 1800)
    // round 2 two beasts from two sides and for two different lambs, the second starts while the first is on its way
    const [c, d] = g.rounds[1]!.threats
    expect(c!.from).not.toBe(d!.from)
    expect(c!.lamb).not.toBe(d!.lamb)
    expect(d!.delay).toBeLessThan(c!.delay + c!.dur)
    // the lambs are far enough from each other that David cannot guard two at once
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(dist(g.lambPos[i]!, g.lambPos[j]!), `${i}-${j}`).toBeGreaterThan(g.guard * 1.6)
  })

  it('5 pebbles: three smooth among six, five among ten; every sprite exists; the stones do not lie on top of each other', () => {
    const g = stage(5).task.pebbles!
    expect(g.smooth).toHaveLength(6)
    expect(g.rough).toHaveLength(6)
    expect(g.rounds.map((r) => r.smooth.length)).toEqual([3, 5])
    expect(g.rounds.map((r) => r.smooth.length + r.rough.length)).toEqual([6, 10])
    for (const r of g.rounds) {
      const all = [...r.smooth, ...r.rough]
      for (const s of r.smooth) expect(s.sprite).toBeLessThan(g.smooth.length)
      for (const s of r.rough) expect(s.sprite).toBeLessThan(g.rough.length)
      for (const s of all) {
        expect(s.x).toBeGreaterThan(4)
        expect(s.x).toBeLessThan(96)
        expect(s.y).toBeLessThanOrEqual(97)
      }
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(dist(all[i]!, all[j]!), `${i}-${j}`).toBeGreaterThan(5)
    }
  })

  it('6 sling: in both rounds there is a moment when the stone points at Goliath within the allowed aim, and the second round is harder', () => {
    const g = stage(6).task.sling!
    expect(g.rounds).toHaveLength(2)
    const centre = { x: g.hand.x, y: g.hand.y * ASPECT }
    for (const r of g.rounds) {
      const target = { x: r.head.x, y: r.head.y * ASPECT }
      let best = 180
      let share = 0
      const steps = 400
      for (let i = 0; i < steps; i++) {
        const e = slingAimError(slingAngle((i * r.period) / steps, r.period, Math.PI), centre, g.radius, target)
        best = Math.min(best, e)
        if (slingHit(e, r.tol)) share++
      }
      expect(best, r.hint).toBeLessThan(r.tol * 0.5)
      // the golden moment is not the whole turn and not a blink: between 2 and 30 percent of a turn
      expect(share / steps, r.hint).toBeGreaterThan(0.02)
      expect(share / steps, r.hint).toBeLessThan(0.3)
      // Goliath stands inside the picture, to the right of David
      expect(r.goliat.x).toBeGreaterThan(g.davidPos.x + 20)
      expect(r.goliat.x + r.goliat.w / 2).toBeLessThanOrEqual(100)
      expect(r.head.y).toBeLessThan(r.goliat.y)
    }
    expect(g.rounds[1]!.tol).toBeLessThan(g.rounds[0]!.tol)
    expect(g.rounds[1]!.period).toBeLessThan(g.rounds[0]!.period)
    // the stone at the highest point of the circle stays inside the picture
    const top = slingPos((3 * Math.PI) / 2, centre, g.radius)
    expect(top.y).toBeGreaterThan(0)
  })

  it('7 memory: five pairs, every one with a sentence', () => {
    const g = stage(7).task.memory!
    expect(g.pairs).toHaveLength(5)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
  })

  it('9 arrow: the sign of peace lands behind the boy, the sign to flee before him; both zones can be hit with a pull and are narrower than the range', () => {
    const g = stage(9).task.arrow!
    expect(g.rounds.map((r) => r.sign)).toEqual(['peace', 'flee'])
    expect(g.rounds.map((r) => r.arrows)).toEqual([2, 3])
    const [peace, flee] = g.rounds
    expect(peace!.zone.to).toBeLessThan(g.boyPos.x - 2)
    expect(peace!.zone.from).toBeGreaterThan(g.jonatanPos.x + g.jonatanPos.w / 2)
    expect(flee!.zone.from).toBeGreaterThan(g.boyPos.x + 2)
    expect(flee!.zone.to).toBeLessThanOrEqual(g.range.max)
    for (const r of g.rounds) {
      const width = r.zone.to - r.zone.from
      expect(width).toBeGreaterThanOrEqual(10)
      expect(width).toBeLessThanOrEqual(22)
      // a pull of the middle of the zone lands in it
      const pull = (((r.zone.from + r.zone.to) / 2 - g.range.min) / (g.range.max - g.range.min))
      expect(pull).toBeGreaterThan(0.06)
      expect(pull).toBeLessThan(1)
      expect(arrowZoneHit(arrowLanding(pull, g.range.min, g.range.max), r.zone)).toBe(true)
      // and a zone is not so wide that a blind pull always hits: it covers less than a third of the range
      expect(width / (g.range.max - g.range.min)).toBeLessThan(0.34)
    }
  })

  it('10 hem: two seams of enough length, the second narrower and curved; every point lies inside the picture; the seams are not too steep for a finger', () => {
    const g = stage(10).task.hem!
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[1]!.tol).toBeLessThan(g.rounds[0]!.tol)
    expect(g.rounds[1]!.path.length).toBeGreaterThan(g.rounds[0]!.path.length)
    for (const r of g.rounds) {
      expect(r.path.length).toBeGreaterThanOrEqual(2)
      for (const p of r.path) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(100)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThanOrEqual(100)
      }
      expect(pathLength(r.path), r.hint).toBeGreaterThan(15)
      // the start is the first point of the seam
      expect(nearestOnPath(r.path, r.path[0]!).along).toBeCloseTo(0)
      expect(nearestOnPath(r.path, r.path[r.path.length - 1]!).along).toBeCloseTo(1)
    }
  })

  it('11 order: four cards, round 1 with the numbers and three cards, round 2 with all four; 14 words: the sentences stand in the text', () => {
    const g = stage(11).task.order!
    expect(g.cards).toHaveLength(4)
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    const w = stage(14).task.words!
    const text = stage(14).text.join(' ')
    for (const r of w.rounds) for (const s of r.sentences) expect(text.includes(s), s).toBe(true)
  })

  it('13 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(13).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/stadt\.webp$/)
  })

  it('the questions do not ask what a game of the stage shows (not how many strings, not how many lambs)', () => {
    expect(stage(2).questions.map((q) => q.q).join(' ')).not.toMatch(/Wie viele Saiten/)
  })
})

describe('David: map, files, English', () => {
  it('fifteen stations from left to right, not too low (the name and the button stay above the tab bar), at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = david.map
    expect(m.stages).toHaveLength(15)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 65 %').toBeLessThanOrEqual(1070)
      expect(s.d).toBeCloseTo(336 / 15976, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 15976, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(DAVID_PATH).toHaveLength(15)
    expect(m.path).toBe(DAVID_PATH)
    expect(m.aspect).toBeCloseTo(15976 / 1648, 6)
    expect(m.widthPx).toBe(15976)
    expect(m.images).toHaveLength(5)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(david).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/david\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(david)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(david) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('David')
    expect(en.stages).toHaveLength(15)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The Youngest in the Pasture')
    expect(stage(2).task.harp!.rounds[0]!.hint).toContain('Stroke slowly')
    expect(stage(9).task.arrow!.rounds[1]!.hint).toContain('flee')
    expect(stage(14).task.words!.rounds[0]!.sentences[1]).toBe('Then they all go home.')
    for (const s of david.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/david/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of david.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/david/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
