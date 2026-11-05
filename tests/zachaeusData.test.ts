/**
 * The data of "Zachäus und Lazarus" (`zachaeus.ts`, `en/zachaeus.en.ts`, `zachaeusPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Zachaeus/ENTWURF_Zachaeus.md`, Luther 1912 told in our own words), the three quiz stages are only quizzes, the four new games and the two old ones have sound data
 * (Anton's plan of 5.11.2026: at most two known games, never in two stages in a row; stage 5 "Bachsteine" instead of the order game, stage 7 serious, only questions),
 * the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { zachaeus } from '@/data/adventures/zachaeus'
import { ZACHAEUS_PATH } from '@/data/adventures/zachaeusPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { climbProblems, halveProblems, unwrapProblems } from '@/utils/zachaeusGames'
import { stepStonesProblems, stonesFewest } from '@/utils/zachaeusNeu'
import type { StonesGame } from '@/utils/zachaeusNeu'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => zachaeus.stages[n - 1]!
/** Words that no text of the German data may use (Lazarus is told gently: no smell, no corpse, no stoning; "gestorben" stays, because Jesus says it). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|stinkt|Gestank|Leiche|Leichen|Leichnam|steinigen|Steinigung|töten|tötet|verwest|Verwesung|Heiligenschein)\b/i
const QUIZ_STAGES = [6, 7, 8]
/** The games that are known from other adventures (Anton, 5.11.2026: at most two in an adventure, never in two stages in a row). */
const KNOWN = ['wimmelbild', 'lueckenvers', 'reihenfolge', 'puzzle', 'memory', 'weg', 'unterschied']
const stones = () => (stage(5).task as { stepStones?: StonesGame }).stepStones!
const plain = (s: string) => s.replace(/[„“”]/g, '')

describe('Zachäus: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 70 to 145 words and the Bible passage under every one', () => {
    expect(zachaeus.id).toBe('zachaeus')
    expect(zachaeus.age).toBe('8-10')
    expect(zachaeus.title).toBe('Zachäus und Lazarus')
    expect(zachaeus.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of zachaeus.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Lukas 19|Johannes 11),\d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(70)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(145)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(7)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(14)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/zachaeus/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    // the first four stages are Luke 19, the last five John 11
    expect(zachaeus.stages.map((s) => s.ref.split(',')[0])).toEqual(['Lukas 19', 'Lukas 19', 'Lukas 19', 'Lukas 19', 'Johannes 11', 'Johannes 11', 'Johannes 11', 'Johannes 11', 'Johannes 11'])
  })

  it('three questions in the three quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of zachaeus.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...zachaeus.stages.flatMap((s) => s.questions), ...zachaeus.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?') || q.q.trim().endsWith('.'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(zachaeus.exam).toHaveLength(6)
    const asked = zachaeus.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(zachaeus.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei'])
    for (const s of zachaeus.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the tree, the call, the half, Bethany, the resurrection and the grave', () => {
    const q = zachaeus.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/Baum/)
    expect(q).toMatch(/herunter/)
    expect(q).toMatch(/Hälfte/)
    expect(q).toMatch(/Bethanien/)
    expect(q).toMatch(/Auferstehung/)
    expect(q).toMatch(/komm heraus/)
  })

  it('the three quiz stages (6, 7, 8: the serious middle of John 11) are only quizzes; stage 7 says that it is serious and asks what the people say when Jesus weeps', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(7).task.hint).toBe('Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.')
    expect(stage(7).questions.map((q) => q.options[0])).toEqual(['ihm zu Füßen', 'die Tränen', 'Seht, wie lieb er ihn gehabt hat!'])
    expect(stage(7).questions[2]!.q).toBe('Was sagen die Leute, als Jesus weint?')
    expect(plain(stage(7).text.join(' '))).toContain('Seht, wie lieb er ihn gehabt hat!')
    expect(stage(7).task.puzzle).toBeUndefined()
  })

  it('the key words of the Bible are there (Luther 1912, told in our own words)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Jericho/)
    expect(t(1)).toMatch(/Zöllner/)
    expect(t(1)).toMatch(/klein/)
    expect(t(2)).toMatch(/Maulbeerbaum/)
    expect(t(3)).toMatch(/steig schnell herunter/)
    expect(t(3)).toMatch(/Sünder/)
    expect(t(4)).toMatch(/Hälfte/)
    expect(t(4)).toMatch(/Vierfache/)
    expect(t(4)).toMatch(/Sohn Abrahams/)
    expect(t(4)).toMatch(/zu suchen und zu retten, was verloren ist/)
    expect(t(5)).toMatch(/Bethanien/)
    expect(t(5)).toMatch(/zwei Tage/)
    expect(t(6)).toMatch(/vier Tage/)
    expect(t(6)).toMatch(/Ich bin die Auferstehung und das Leben/)
    expect(t(7)).toMatch(/zu Füßen/)
    expect(t(7)).toMatch(/Tränen/)
    expect(t(8)).toMatch(/Hebt den Stein ab/)
    expect(t(8)).toMatch(/Himmel/)
    expect(t(9)).toMatch(/Lazarus, komm heraus/)
    expect(t(9)).toMatch(/Löst ihn auf und lasst ihn gehen/)
    const all = zachaeus.stages.map((s) => s.text.join(' ')).join(' ')
    // not told here (Nr. 28 and later): the council and the plan against Jesus, the anointing in John 12, the pounds of Luke 19,11-27
    expect(all).not.toMatch(/Hohepriester|Hohen Rat|salbt|Pfund/)
  })
})

describe('Zachäus: the games', () => {
  it('the order of the games: 2 old, 4 new (klettern, halbieren, bachsteine, loesen), 3 quizzes; no game twice in a row; the known games never in two stages in a row', () => {
    const kinds = zachaeus.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['wimmelbild', 'klettern', 'lueckenvers', 'halbieren', 'bachsteine', 'quiz', 'quiz', 'quiz', 'loesen'])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    expect(kinds.filter((k) => KNOWN.includes(k))).toEqual(['wimmelbild', 'lueckenvers'])
    for (let i = 1; i < kinds.length; i++) expect(KNOWN.includes(kinds[i]!) && KNOWN.includes(kinds[i - 1]!), `two known games in a row at ${i + 1}`).toBe(false)
  })

  it('1 hidden pictures: Zacchaeus, Jesus, the child on the shoulders and the donkey, covers, every place inside the picture', () => {
    const t = stage(1).task
    expect(t.count).toBe(4)
    const f = t.find!
    expect(f.finds).toHaveLength(4)
    expect(f.labels).toHaveLength(4)
    expect(f.covers.length).toBeGreaterThanOrEqual(4)
    for (const s of [...f.finds, ...f.covers]) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(101)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(f.labels!.join(' ')).toMatch(/Zachäus/)
    expect(f.labels!.join(' ')).toMatch(/Jesus/)
    expect(f.labels!.join(' ')).toMatch(/Kind/)
    expect(f.labels!.join(' ')).toMatch(/Esel/)
    expect(f.scene).toBe('images/abenteuer/spiele/zachaeus/wimmel/szene.webp')
  })

  it('2 climb: two rounds of three and four heights; the data can be played; the pictures come from the data', () => {
    const g = stage(2).task.climb!
    expect(climbProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.levels.length)).toEqual([3, 4])
    expect(g.tree).toBe('images/abenteuer/spiele/zachaeus/klettern/baum.webp')
    expect(g.view).toBe('images/abenteuer/spiele/zachaeus/klettern/ausblick.webp')
    expect([g.climber.image, g.strong.image, g.weak.image]).toEqual(['zachaeus', 'ast-stark', 'ast-schwach'].map((f) => `images/abenteuer/spiele/zachaeus/klettern/${f}.webp`))
  })

  it('3 verse: two rounds, the call of Jesus stands word for word in the text of the stage, the right words are on the leaves', () => {
    const g = stage(3).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = plain(stage(3).text.join(' '))
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      let sentence = r.parts[0]!
      r.answers.forEach((a, k) => {
        sentence += r.words[a] + r.parts[k + 1]
      })
      expect(text, `"${sentence}"`).toContain(plain(sentence))
    }
    expect(g.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    expect(g.rounds[0]!.words[0]).toBe('herunter')
    expect(g.board).toBe('images/abenteuer/spiele/zachaeus/lueckenvers/tafel.webp')
  })

  it('4 halve: ten and fourteen coins; the data can be played; the pictures come from the data', () => {
    const g = stage(4).task.halve!
    expect(halveProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.coins)).toEqual([10, 14])
    expect(g.table).toBe('images/abenteuer/spiele/zachaeus/halbieren/tisch.webp')
    expect([g.coin, g.divider, g.bowlSelf, g.bowlPoor, g.poor].map((x) => x.image)).toEqual(['muenze', 'teiler', 'schale-zachaeus', 'schale-arme', 'arme'].map((f) => `images/abenteuer/spiele/zachaeus/halbieren/${f}.webp`))
  })

  it('5 stepping stones: two brooks, the data can be played (three stones on two ways, then five round the whirls), the pictures come from the data', () => {
    const g = stones()
    expect(stage(5).task.kind as string).toBe('bachsteine')
    expect(stepStonesProblems(g)).toEqual([])
    expect(g.rounds.map((r) => stonesFewest(r))).toEqual([3, 5])
    expect(g.rounds.map((r) => r.stones)).toEqual([5, 6])
    expect(g.rounds.map((r) => r.background)).toEqual([1, 2].map((n) => `images/abenteuer/spiele/zachaeus/bachsteine/bach-${n}.webp`))
    expect([g.messenger, g.shallow, g.whirl, ...g.stone]).toEqual(['bote', 'flach', 'strudel', 'stein-1', 'stein-2', 'stein-3'].map((f) => `images/abenteuer/spiele/zachaeus/bachsteine/${f}.webp`))
    expect(stage(5).task.order).toBeUndefined()
  })

  it('the old pictures of the order game and the puzzle are gone; the new pictures are there and small', () => {
    expect(existsSync('public/images/abenteuer/spiele/zachaeus/reihenfolge')).toBe(false)
    expect(existsSync('public/images/abenteuer/spiele/zachaeus/puzzle')).toBe(false)
    const g = stones()
    for (const f of [...g.rounds.map((r) => r.background), g.messenger, g.shallow, g.whirl, ...g.stone]) {
      expect(existsSync(`public/${f}`), f).toBe(true)
      expect(statSync(`public/${f}`).size, f).toBeLessThan(300_000)
    }
  })

  it('9 unwrap: five strips, the cloth on the head waits for two others; the data can be played', () => {
    const g = stage(9).task.unwrap!
    expect(unwrapProblems(g)).toEqual([])
    expect(g.strips.map((s) => s.image)).toEqual([1, 2, 3, 4, 5].map((n) => `images/abenteuer/spiele/zachaeus/loesen/streifen-${n}.webp`))
    expect(g.strips[4]!.needs).toBe(2)
    expect(g.strips.slice(0, 4).every((s) => !s.needs)).toBe(true)
    expect([g.scene, g.lazarus.image, g.free.image, g.maria.image]).toEqual(['szene', 'lazarus', 'lazarus-frei', 'maria'].map((f) => `images/abenteuer/spiele/zachaeus/loesen/${f}.webp`))
  })
})

describe('Zachäus: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = zachaeus.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(ZACHAEUS_PATH).toHaveLength(9)
    for (const seg of ZACHAEUS_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(ZACHAEUS_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.images).toHaveLength(3)
  })

  it('the music: three pieces of its own, the medal and the gift lie in the folder of the adventure', () => {
    expect(zachaeus.music).toEqual(['musik-jericho-v1.mp3', 'musik-bethanien-v1.mp3', 'musik-morgen-v1.mp3'].map((f) => `audio/abenteuer/zachaeus/${f}`))
    expect(zachaeus.medal).toMatch(/^images\/abenteuer\/zachaeus\/medaille-v\d\.webp$/)
    expect(zachaeus.gift!.image).toBe('images/abenteuer/zachaeus/geschenk.webp')
  })

  it('every file of the adventure exists in `public/` (red until the pictures are painted; the recordings and the music are not checked here, they come later)', () => {
    const missing = journeyFiles(zachaeus).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/zachaeus\/(geschichte|musik)/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(zachaeus)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(zachaeus) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Zacchaeus and Lazarus')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Little Zacchaeus')
    expect(stage(2).task.climb!.rounds[0]!.hint).toContain('strong branch')
    expect(stage(2).task.climb!.weak.label).toBe('A thin dry branch with a bend')
    expect(stage(4).task.halve!.rounds[0]!.hint).toContain('Half is for the poor')
    expect(stage(4).task.halve!.bowlPoor.label).toBe('The bowl for the poor')
    expect(stage(9).task.unwrap!.hint).toContain('Pull at the cloths')
    expect(stage(9).task.unwrap!.strips.map((s) => s.label)[4]).toBe('The cloth on the head')
    expect(stones().rounds[0]!.hint).toContain('messenger')
    expect(stage(7).task.hint).toBe('This stage is serious. Listen carefully and answer the questions.')
    expect(stage(7).questions[2]!.q).toBe('What do the people say when Jesus weeps?')
    expect(stage(1).task.find!.labels![0]).toContain('Zacchaeus')
    for (const s of zachaeus.stages) if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/zachaeus/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    setAdventureLanguage('de')
    expect(stage(2).task.climb!.weak.label).toBe('Ein dünner, trockener Ast mit einem Knick')
  })

  it('the English verse stands word for word in the English text of stage 3', () => {
    const en = englishTextsOf(zachaeus) as { stages: { text: string[]; task?: { verse?: { rounds: { parts: string[]; words: string[] }[] } } }[] }
    const e = en.stages[2]!
    const text = plain(e.text.join(' '))
    const de = stage(3).task.verse!
    e.task!.verse!.rounds.forEach((r, k) => {
      let sentence = r.parts[0]!
      de.rounds[k]!.answers.forEach((a, i) => {
        sentence += r.words[a] + r.parts[i + 1]
      })
      expect(text, `"${sentence}"`).toContain(plain(sentence))
    })
  })
})
