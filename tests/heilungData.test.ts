/**
 * The data of "Jesus heilt" (`heilung.ts`, `en/heilung.en.ts`, `heilungPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Heilung/ENTWURF_Heilung.md`,
 * Luther 1912 told in our own words), the two quiz stages are only quizzes, the games have sound data (Anton's rule of 5.11.2026: at most two known games, never in two stages in a row;
 * the new games `synagoge`, `zehn` and `kinder` are checked by their `*Problems` functions), the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { heilung } from '@/data/adventures/heilung'
import { HEILUNG_PATH } from '@/data/adventures/heilungPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { shoutRoundProblems, turnRoundProblems } from '@/utils/heilungGames'
import { childrenNext, childrenProblems, synagogueProblems, tenPlayRoute, tenProblems } from '@/utils/heilungNeu'
import type { ChildrenGame, SynagogueGame, TenGame } from '@/utils/heilungNeu'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => heilung.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood, no devil). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|Tod|tot|Wunden|Eiter)\b/i
const QUIZ_STAGES = [4, 9]
/** The data of a new game (its field is not in `GameTask` until the lead adds it). */
const newGame = <T>(n: number, field: string): T => (stage(n).task as unknown as Record<string, T>)[field]!

describe('Heilung: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 80 to 145 words and the Bible passage under every one', () => {
    expect(heilung.id).toBe('heilung')
    expect(heilung.age).toBe('8-10')
    expect(heilung.title).toBe('Jesus heilt')
    expect(heilung.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(heilung.stages.map((s) => s.title)).toEqual([
      'Wenn du willst',
      'Der Hauptmann bittet',
      'Sprich nur ein Wort',
      'Weine nicht',
      'Zehn Männer rufen',
      'Einer kehrt um',
      'Lasst die Kinder zu mir kommen',
      'Lauter rufen',
      'Ich will sehen'
    ])
    for (const s of heilung.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Lukas [5717]+|Markus 10),\d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(80)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(145)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(7)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(12.5)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/heilung/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of heilung.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...heilung.stages.flatMap((s) => s.questions), ...heilung.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?') || q.q.trim().endsWith('.'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(heilung.exam).toHaveLength(6)
    const asked = heilung.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(heilung.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei'])
    for (const s of heilung.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the man with leprosy, the word of the captain, the widow, the ten, the one who returns and Bartimäus', () => {
    const q = heilung.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Aussatz/)
    expect(q).toMatch(/Hauptmann/)
    expect(q).toMatch(/Witwe/)
    expect(q).toMatch(/zehn|Männer/i)
    expect(q).toMatch(/zurück/)
    expect(q).toMatch(/Bartimäus/)
  })

  it('the two quiz stages (4, 9) are only quizzes, never two in a row', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    const kinds = heilung.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); nothing is told that the Bible does not say', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Aussatz/)
    expect(t(1)).toMatch(/wenn du willst, kannst du mich rein machen/)
    expect(t(1)).toMatch(/Ich will es tun/)
    expect(t(1)).toMatch(/Sei rein/)
    expect(t(1)).toMatch(/Priester/)
    expect(t(2)).toMatch(/Hauptmann/)
    expect(t(2)).toMatch(/Kapernaum/)
    expect(t(2)).toMatch(/todkrank/)
    expect(t(2)).toMatch(/Älteste/)
    expect(t(2)).toMatch(/Synagoge/)
    expect(t(3)).toMatch(/Sprich nur ein Wort/)
    expect(t(3)).toMatch(/Tu das/)
    expect(t(3)).toMatch(/So einen Glauben habe ich in Israel nicht gefunden/)
    expect(t(4)).toMatch(/Nain/)
    expect(t(4)).toMatch(/einzige Sohn/)
    expect(t(4)).toMatch(/Witwe/)
    expect(t(4)).toMatch(/Weine nicht/)
    expect(t(4)).toMatch(/Steh auf/)
    expect(t(5)).toMatch(/zehn Männer/)
    expect(t(5)).toMatch(/Aussatz/)
    expect(t(5)).toMatch(/Erbarmen/)
    expect(t(5)).toMatch(/Priestern/)
    expect(t(6)).toMatch(/Samariter/)
    expect(t(6)).toMatch(/Wo sind die neun/)
    expect(t(6)).toMatch(/Dein Glaube hat dir geholfen/)
    expect(t(7)).toMatch(/Lasst die Kinder zu mir kommen/)
    expect(t(7)).toMatch(/segnet sie/)
    expect(t(8)).toMatch(/Bartimäus/)
    expect(t(8)).toMatch(/Jericho/)
    expect(t(8)).toMatch(/Sohn Davids/)
    expect(t(8)).toMatch(/Sei still/)
    expect(t(8)).toMatch(/noch viel lauter/)
    expect(t(8)).toMatch(/Ruft ihn her/)
    expect(t(9)).toMatch(/Mantel/)
    expect(t(9)).toMatch(/Was willst du, dass ich dir tun soll/)
    expect(t(9)).toMatch(/Rabbuni/)
    expect(t(9)).toMatch(/dein Glaube hat dir geholfen/)
    const all = heilung.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Teufel|Heiligenschein|Engel|Römer|Legion|Ketten|ertrunken/)
  })
})

describe('Heilung: the games', () => {
  it('the order of the games: 2 known (verse, order), never two in a row; 5 new; 2 quizzes; no game twice', () => {
    expect(heilung.stages.map((s) => s.task.kind as string)).toEqual(['lueckenvers', 'synagoge', 'reihenfolge', 'quiz', 'zehn', 'umkehr', 'kinder', 'ruf', 'quiz'])
    const games = heilung.stages.map((s) => s.task.kind as string).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    const known = heilung.stages.map((s) => ['lueckenvers', 'reihenfolge'].includes(s.task.kind))
    expect(known.filter(Boolean)).toHaveLength(2)
    for (let i = 1; i < known.length; i++) expect(known[i] && known[i - 1], `two known games in a row at ${i + 1}`).toBe(false)
  })

  it('1 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(1).task.verse!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('rein')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['Hand', 'rein'])
    const text = stage(1).text.join(' ')
    expect(text).toContain('Jesus streckt die Hand aus')
    expect(text).toContain('Sei rein!')
  })

  it('2 synagogue: the parts stand on the platform and on each other, round 1 four columns and a beam, round 2 six columns, two beams and the roof; no problems', () => {
    const g = newGame<SynagogueGame>(2, 'synagogue')
    expect(synagogueProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.slots.map((s) => s.kind).join(','))).toEqual(['column,column,column,column,beam', 'column,column,column,column,column,column,beam,beam,roof'])
    expect(g.rounds.map((r) => r.outline)).toEqual([true, false])
    expect(g.background).toMatch(/heilung\/synagoge\/bauplatz\.webp$/)
    for (const k of ['column', 'beam', 'roof'] as const) expect(existsSync(`public/${g.parts[k].image}`), k).toBe(true)
    expect(existsSync(`public/${g.background}`)).toBe(true)
  })

  it('3 order: four cards in the order of the story; round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(3).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['bitte', 'weg', 'wort', 'gesund'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['bitte', 'weg', 'wort', 'gesund'])
  })

  it('5 ten on the way: ten men, two rounds, along the safe way all ten arrive without anyone left behind; no problems; every picture is there', () => {
    const g = newGame<TenGame>(5, 'ten')
    expect(tenProblems(g)).toEqual([])
    expect(g.men).toHaveLength(10)
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[1]!.obstacles.length).toBeGreaterThan(g.rounds[0]!.obstacles.length)
    expect(g.rounds[1]!.obstacles.some((o) => o.kind === 'wall')).toBe(true)
    for (let ri = 0; ri < 2; ri++) {
      const play = tenPlayRoute(g, ri)
      expect(play.done && play.lost === 0, `round ${ri + 1}`).toBe(true)
      expect(play.seconds, `round ${ri + 1}`).toBeLessThan(40)
    }
    const files = [...g.men, g.house.image, ...g.rounds.flatMap((r) => [r.background, ...r.obstacles.map((o) => o.image)])]
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('6 turn back: two rounds, six men and the Samaritan, every round can be played, the second one lets the men cross', () => {
    const g = stage(6).task.turnBack!
    expect(g.rounds).toHaveLength(2)
    expect(g.men).toHaveLength(6)
    const geo = { ...g.road, jesusX: g.jesus.x }
    for (const r of g.rounds) expect(turnRoundProblems(geo, r), r.hint).toEqual([])
    expect(g.rounds.map((r) => r.crossing)).toEqual([false, true])
    expect(g.background).toMatch(/heilung\/umkehr\/strasse\.webp$/)
  })

  it('7 to Jesus: four and then six children, the little ones on the arm first, the others clearly growing; no problems; every picture is there', () => {
    const g = newGame<ChildrenGame>(7, 'children')
    expect(childrenProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.children.length)).toEqual([4, 6])
    expect(g.rounds.map((r) => r.children.filter((c) => c.carried).length)).toEqual([1, 2])
    for (const r of g.rounds) {
      const order: string[] = []
      const come = new Set<string>()
      for (let c = childrenNext(r, come); c; c = childrenNext(r, come)) {
        order.push(c.id)
        come.add(c.id)
      }
      expect(order).toHaveLength(r.children.length)
      expect(r.children.find((c) => c.id === order[0])!.carried).toBe(true)
    }
    const files = [g.background, ...g.rounds.flatMap((r) => r.children.map((c) => c.image))]
    for (const f of files) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('8 shout: two rounds, the second needs more calls and more hushes, every round can be won', () => {
    const g = stage(8).task.shout!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) expect(shoutRoundProblems(r), r.hint).toEqual([])
    expect(g.rounds[1]!.need).toBeGreaterThan(g.rounds[0]!.need)
    expect(g.rounds[1]!.hushes).toBeGreaterThan(g.rounds[0]!.hushes)
    expect(g.background).toMatch(/heilung\/ruf\/weg\.webp$/)
  })
})

describe('Heilung: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = heilung.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(HEILUNG_PATH).toHaveLength(9)
    for (const seg of HEILUNG_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(HEILUNG_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.widthPx).toBe(9920)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(heilung).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/heilung\/(geschichte|musik)/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(heilung)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(heilung) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Jesus Heals')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(9 - 3)
    setAdventureLanguage('en')
    expect(stage(2).title).toBe('The Captain Asks')
    expect(stage(6).task.turnBack!.rounds[0]!.hint).toContain('turns back')
    expect(stage(8).task.shout!.bartimaeus.label).toBe('Bartimaeus by the road')
    expect(stage(1).task.verse!.rounds[0]!.parts[0]).toContain('if you will')
    expect(stage(2).task.hint).toBe('Build the synagogue that the captain built.')
    expect(newGame<SynagogueGame>(2, 'synagogue').rounds[0]!.hint).toContain('columns')
    expect(newGame<SynagogueGame>(2, 'synagogue').parts.column.name).toBe('A column')
    expect(newGame<TenGame>(5, 'ten').rounds[1]!.hint).toMatch(/wall/)
    expect(newGame<ChildrenGame>(7, 'children').rounds[0]!.children.map((c) => c.name).join(' ')).toMatch(/braid/)
    for (const s of heilung.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/heilung/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of heilung.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/heilung/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
