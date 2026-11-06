/**
 * The data of "Pfingsten" (`pfingsten.ts`, `en/pfingsten.en.ts`, `pfingstenPath.ts`), adventure no. 30 "Ihr werdet meine Zeugen sein" (Acts 1-12): the stories and questions follow
 * the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Pfingsten/ENTWURF_Pfingsten.md`, Luther 1912 told in our own words), two known and six new games with
 * playable data (every `*Problems` check is empty), the question rule (two after a game, three in the serious stage 6, six in the exam), the map has nine stations and the exam,
 * and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted the test does not ask for the picture files; it asks for them as soon as the pictures are built in (the last picture of
 * the building-in script, `spiele/pfingsten/spaehen/tor-offen.webp`, lies in `public/`). The map pieces are asked for at once (the panorama is in). Recordings and music only when they exist.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { pfingsten } from '@/data/adventures/pfingsten'
import { PFINGSTEN_PATH } from '@/data/adventures/pfingstenPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { fillProblems, tonguesProblems, witnessProblems } from '@/utils/pfingstenNeuA'
import type { FillGame, TonguesGame, WitnessGame } from '@/utils/pfingstenNeuA'
import { chariotProblems, hopProblems, peekProblems } from '@/utils/pfingstenNeuB'
import type { ChariotGame, HopGame, PeekGame } from '@/utils/pfingstenNeuB'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => pfingsten.stages[n - 1]!
/** The fields of the new games (`TaskKind`/`GameTask` are wired by the lead; until then they are read like this). */
type NewTask = { witness?: WitnessGame; tongues?: TonguesGame; fill?: FillGame; hop?: HopGame; chariot?: ChariotGame; peek?: PeekGame }
const task = (n: number) => stage(n).task as unknown as NewTask
/** Words that no German text, question or answer may use (nothing gruesome; Ananias and Sapphira and Stephen are not part of this adventure). */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Leichnam|Blut|blutig|Kreuz|Kreuze|Heiligenschein|Schwert|geschlachtet|getötet|töten|Ananias|Saphira|Stephanus)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/pfingsten/spaehen/tor-offen.webp')

describe('Pfingsten: stories and questions', () => {
  it('nine stages with 3 to 5 paragraphs of 100 to 190 words and the Bible passage (Acts) under every one', () => {
    expect(pfingsten.id).toBe('pfingsten')
    expect(pfingsten.age).toBe('8-10')
    expect(pfingsten.title).toBe('Pfingsten')
    expect(pfingsten.subtitle).toBe('Ihr werdet meine Zeugen sein')
    expect(pfingsten.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of pfingsten.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Apostelgeschichte (1|2|3|4|8|10|12)\b/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(100)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(190)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/pfingsten/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    expect(pfingsten.stages.map((s) => s.ref.split(',')[0])).toEqual(['Apostelgeschichte 1', 'Apostelgeschichte 2', 'Apostelgeschichte 2', 'Apostelgeschichte 2', 'Apostelgeschichte 3', 'Apostelgeschichte 4', 'Apostelgeschichte 8', 'Apostelgeschichte 10', 'Apostelgeschichte 12'])
  })

  it('angels only in the text of stages 7, 8 and 9 (never in a picture); nothing forbidden in any question or answer', () => {
    for (const s of pfingsten.stages) {
      if (![7, 8, 9].includes(s.id)) expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(/\bEngel\b/)
      for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    }
    for (const q of pfingsten.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
  })

  it('two questions after a game, three in stage 6 (only questions), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of pfingsten.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    expect(stage(6).task.kind).toBe('quiz')
    for (const q of [...pfingsten.stages.flatMap((s) => s.questions), ...pfingsten.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(pfingsten.exam).toHaveLength(6)
    const asked = pfingsten.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(pfingsten.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'etwa'])
    for (const s of pfingsten.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the key words of the Bible are there (Luther 1912, told in our own words)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Kraft des Heiligen Geistes/)
    expect(t(1)).toMatch(/Zeugen/)
    expect(t(1)).toMatch(/Ende der Erde/)
    expect(t(1)).toMatch(/Wolke/)
    expect(t(2)).toMatch(/Brausen/)
    expect(t(2)).toMatch(/Zungen wie von Feuer/)
    expect(t(3)).toMatch(/Was sollen wir tun/)
    expect(t(3)).toMatch(/dreitausend/)
    expect(t(4)).toMatch(/Barnabas/)
    expect(t(5)).toMatch(/Gold und Silber habe ich nicht/)
    expect(t(5)).toMatch(/Schönen Tür/)
    expect(t(6)).toMatch(/nicht lassen/)
    expect(t(7)).toMatch(/Kämmerer/)
    expect(t(7)).toMatch(/Jesaja/)
    expect(t(8)).toMatch(/Kornelius/)
    expect(t(8)).toMatch(/Joppe/)
    expect(t(9)).toMatch(/Rhode/)
    expect(t(9)).toMatch(/klopft weiter/)
  })

  it('the exam asks across the whole adventure', () => {
    const q = pfingsten.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/Heiligen Geistes/)
    expect(q).toMatch(/Gold und Silber/)
    expect(q).toMatch(/Rhode/)
  })
})

describe('Pfingsten: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (lueckenvers, wimmelbild) far apart, six new ones, stage 6 only questions; no game twice in a row', () => {
    const kinds = pfingsten.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['zeugen', 'sprachen', 'lueckenvers', 'koerbe', 'huepfen', 'quiz', 'wagen', 'wimmelbild', 'spaehen'])
    for (let i = 1; i < kinds.length; i++) expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(witnessProblems(task(1).witness!)).toEqual([])
    expect(tonguesProblems(task(2).tongues!)).toEqual([])
    expect(fillProblems(task(4).fill!)).toEqual([])
    expect(hopProblems(task(5).hop!)).toEqual([])
    expect(chariotProblems(task(7).chariot!)).toEqual([])
    expect(peekProblems(task(9).peek!)).toEqual([])
  })

  it('1 witness: four places in the order of the verse (Jerusalem, Judaea, Samaria, the end of the earth), order then stretch', () => {
    const g = task(1).witness!
    expect(g.places.map((p) => p.id)).toEqual(['ort-jerusalem', 'ort-judaea', 'ort-samarien', 'ort-ende'])
    expect(g.rounds.map((r) => r.mode)).toEqual(['order', 'stretch'])
    expect(g.map).toBe('images/abenteuer/spiele/pfingsten/zeugen/karte.webp')
  })

  it('2 tongues: exactly the seven peoples of the story (Parthians, Medes, Mesopotamia, Egypt, Rome, Crete, Arabia), four with home pictures, then all seven without', () => {
    const g = task(2).tongues!
    expect(g.lands.map((l) => l.id).sort()).toEqual(['aegypten', 'arabien', 'kreta', 'meder', 'mesopotamien', 'parther', 'rom'])
    expect(g.rounds.map((r) => r.guests.length)).toEqual([4, 7])
    expect(g.rounds.map((r) => r.showHome)).toEqual([true, false])
    const story = stage(2).text.join(' ')
    for (const w of ['Parther', 'Meder', 'Mesopotamien', 'Ägypten', 'Rom', 'Kreter', 'Araber']) expect(story, w).toContain(w)
  })

  it('3 missing word: the sentence of the verse game is word for word in the story (Acts 2,32)', () => {
    const v = stage(3).task.verse!
    const text = stage(3).text.join(' ').replace(/[„“”]/g, '')
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(text).toContain(s)
    }
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
  })

  it('4 fill: three families (1, 2, 3), then four (2, 3, 4, 5); the gifts add up exactly', () => {
    const g = task(4).fill!
    expect(g.rounds.map((r) => r.families.map((f) => f.need))).toEqual([[1, 2, 3], [2, 3, 4, 5]])
    for (const r of g.rounds) expect(r.gifts.reduce((a, b) => a + b, 0)).toBe(r.families.reduce((a, f) => a + f.need, 0))
  })

  it('5 hop: six steps without a landing, then twelve with two landings', () => {
    const g = task(5).hop!
    expect(g.rounds.map((r) => r.steps.length)).toEqual([6, 12])
    expect(g.rounds.map((r) => r.steps.filter((s) => s === 'L').length)).toEqual([0, 2])
  })

  it('7 chariot: 8 seconds at an even speed, then 12 seconds with changing speed', () => {
    const g = task(7).chariot!
    expect(g.rounds.map((r) => r.fill)).toEqual([8000, 12000])
    expect(g.rounds[1]!.speed.length).toBeGreaterThan(1)
  })

  it('8 hidden pictures: four animals in the great sheet (camel, hare, raven, lizard)', () => {
    const t = stage(8).task
    expect(t.count).toBe(4)
    const f = t.find!
    expect(f.finds).toHaveLength(4)
    expect(f.labels).toEqual(['Ein Kamel', 'Ein Hase', 'Ein Rabe', 'Eine Eidechse'])
    expect(f.covers.length).toBeGreaterThanOrEqual(4)
    expect(f.scene).toBe('images/abenteuer/spiele/pfingsten/wimmel/szene.webp')
  })

  it('9 peek: five people with three wide cracks, then eight with five narrow ones; Peter comes last both times; no soldier', () => {
    const g = task(9).peek!
    expect(g.rounds.map((r) => r.people.length)).toEqual([5, 8])
    expect(g.rounds.map((r) => r.slits.length)).toEqual([3, 5])
    for (const r of g.rounds) expect(r.people[r.people.length - 1]!.id).toBe('petrus')
    expect(g.people.map((p) => p.name).join(' ')).not.toMatch(/Soldat|Wächter/)
  })
})

describe('Pfingsten: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = pfingsten.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(PFINGSTEN_PATH).toHaveLength(9)
    for (const seg of PFINGSTEN_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(PFINGSTEN_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.images).toEqual([1, 2, 3].map((n) => `images/abenteuer/pfingsten/karte-pano-v1-${n}.webp`))
    for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the medal and the gift lie in the folder of the adventure; music of its own only when its files are in', () => {
    expect(pfingsten.medal).toMatch(/^images\/abenteuer\/pfingsten\/medaille-v\d\.webp$/)
    expect(pfingsten.gift!.image).toBe('images/abenteuer/pfingsten/geschenk.webp')
    expect(pfingsten.downloadMb).toBeGreaterThan(5)
    for (const f of pfingsten.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('a recording is named only when its file is in `public/` (otherwise the device reads)', () => {
    for (const s of pfingsten.stages) {
      const nn = String(s.id).padStart(2, '0')
      const file = `audio/abenteuer/pfingsten/geschichte-${nn}-v1.mp3`
      expect(s.audio, `stage ${s.id}`).toBe(existsSync(`public/${file}`) ? file : undefined)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(pfingsten).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f) || f.includes('karte-pano') || f.includes('/lueckenvers/'))
    const missing = wanted.filter((f) => !existsSync(`public/${f}`))
    expect(missing).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/pfingsten/etappe-bild-01'))).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(pfingsten)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(pfingsten) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Pentecost')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Unto the Uttermost Part of the Earth')
    expect(task(1).witness!.places[3]!.name).toBe('The uttermost part of the earth')
    expect(task(2).tongues!.guests.map((g) => g.name)).toContain('A visitor from Egypt')
    expect(task(4).fill!.families[0]!.name).toBe('The old woman')
    expect(task(5).hop!.rounds[1]!.hint).toContain('landing')
    expect(task(7).chariot!.rounds[0]!.hint).toContain('Philip')
    expect(stage(8).task.find!.labels![0]).toBe('A camel')
    expect(task(9).peek!.people[0]!.name).toBe('Peter')
    expect(stage(3).task.verse!.rounds[0]!.words[0]).toBe('witnesses')
    setAdventureLanguage('de')
    expect(task(9).peek!.people[0]!.name).toBe('Petrus')
  })

  it('the English texts stay quiet: no blood, no cross, no devil', () => {
    const en = englishTextsOf(pfingsten) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|hell|devil|cross|sword|corpse)\b/i)
    })
  })
})
