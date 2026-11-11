/**
 * The data of "Der verlorene Sohn" (`sohn.ts`, `en/sohn.en.ts`, `sohnPath.ts`), adventure id `sohn` (Luke 15,11-32): the stories and questions follow the rules of the adventures
 * (texts of the draft `D:/Claude/Abenteuer-Sohn/ENTWURF_Sohn.md`, Luther 1912 told in our own words), two known and two new games with playable data (every `*Problems` check is empty),
 * the question rule (two after a game, three in the serious stages 2, 3 and 7, six in the exam), the map has seven stations and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted the test does not ask for the picture files; it asks for them as soon as the pictures are built in (the last picture of
 * the building-in script, `spiele/sohn/reigen/vater-fest.webp`, lies in `public/`). The map pieces are asked for at once (the panorama is in). Recordings and music only when they exist.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { sohn } from '@/data/adventures/sohn'
import { SOHN_PATH } from '@/data/adventures/sohnPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { solvable } from '@/utils/josuaGames'
import { lookoutProblems } from '@/utils/sohnNeuA'
import type { LookoutGame } from '@/utils/sohnNeuA'
import { danceProblems } from '@/utils/sohnNeuB'
import type { DanceGame } from '@/utils/sohnNeuB'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => sohn.stages[n - 1]!
/** The fields of the new games (`TaskKind`/`GameTask` are wired by the lead; until then they are read like this). */
type NewTask = { lookout?: LookoutGame; dance?: DanceGame }
const task = (n: number) => stage(n).task as unknown as NewTask
/**
 * Words that no German text, question or answer may use. The calf of the father is in the text ("das fette Kalb", Luther 1912) and is only fetched, nothing is slaughtered;
 * nothing gruesome, nothing about the way the younger son wastes his money (no women, no wine), no Jesus (the parable is told without a frame), no angel.
 */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Blut|blutig|Kreuz|Schwert|geschlachtet|schlachten|Fleisch|Messer|Hure|Huren|Dirnen|Prasser|prassen|Wein|betrunken|Jesus|Christus|Engel|Heiligenschein)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/sohn/reigen/vater-fest.webp')

describe('Der verlorene Sohn: stories and questions', () => {
  it('seven stages with 4 to 6 short paragraphs (at most 60 words each) of 65 to 175 words in all and the Bible passage (Lukas 15) under every one', () => {
    expect(sohn.id).toBe('sohn')
    expect(sohn.age).toBe('8-10')
    expect(sohn.title).toBe('Der verlorene Sohn')
    expect(sohn.subtitle).toBe('Das Gleichnis vom Vater und seinen zwei Söhnen')
    expect(sohn.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
    for (const s of sohn.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Lukas 15,\d+/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(4)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(6)
      for (const p of s.text) expect(p.split(/\s+/).length, `a paragraph of stage ${s.id}`).toBeLessThanOrEqual(60)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(65)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(175)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/sohn/etappe-bild-${String(s.id).padStart(2, '0')}(-b|-v2)?\\.webp$`))
    }
    expect(sohn.stages.map((s) => s.ref)).toEqual(['Lukas 15,11–13a', 'Lukas 15,13b–14', 'Lukas 15,15–16', 'Lukas 15,17–20a', 'Lukas 15,20b–21', 'Lukas 15,22–25a', 'Lukas 15,25–32'])
  })

  it('what the story leaves out stays out: no wasting with women, no wine, no slaughtering, no explaining of the parable', () => {
    const all = sohn.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/\b(Prassen|Dirnen?|Hure|Huren|Wein|Gleichnis|bedeutet|das heißt|so ist es auch mit)\b/i)
    for (const s of sohn.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    for (const q of sohn.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
    // the calf is fetched and a meal is made, nothing more
    expect(stage(6).text.join(' ')).toMatch(/das fette Kalb aus dem Stall/)
  })

  it('two questions after a game, three in the serious stages 2, 3 and 7 (only questions), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of sohn.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    for (const n of [2, 3, 7]) expect(stage(n).task.kind).toBe('quiz')
    for (const q of [...sohn.stages.flatMap((s) => s.questions), ...sohn.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(sohn.exam).toHaveLength(6)
    const asked = sohn.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(sohn.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'etwa', 'er', 'es'])
    for (const s of sohn.stages) {
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
    expect(t(1)).toMatch(/was mir später gehören soll/)
    expect(t(1)).toMatch(/ein fernes Land/)
    expect(t(2)).toMatch(/Hungersnot/)
    expect(t(3)).toMatch(/Schweine hüten/)
    expect(t(4)).toMatch(/Ich will mich aufmachen und zu meinem Vater gehen/)
    expect(t(4)).toMatch(/Mach mich zu einem deiner Arbeiter/)
    expect(t(5)).toMatch(/fällt dem Sohn um den Hals und küsst ihn/)
    expect(t(5)).toMatch(/Ich bin es nicht mehr wert, dein Sohn zu heißen/)
    expect(t(6)).toMatch(/das beste Kleid/)
    expect(t(6)).toMatch(/Ring/)
    expect(t(6)).toMatch(/Schuhe/)
    expect(t(6)).toMatch(/tot und ist wieder lebendig geworden/)
    expect(t(6)).toMatch(/verloren und ist gefunden worden/)
    expect(t(7)).toMatch(/Der Vater kommt heraus und bittet ihn/)
    expect(t(7)).toMatch(/alles, was mir gehört, gehört auch dir/)
  })

  it('the exam asks across the whole adventure', () => {
    const q = sohn.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/seinen Teil/)
    expect(q).toMatch(/Hungersnot/)
    expect(q).toMatch(/Schweine/)
    expect(q).toMatch(/zu seinem Vater zurückgehen/)
    expect(q).toMatch(/läuft ihm entgegen/)
  })
})

describe('Der verlorene Sohn: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (packen, lueckenvers) apart, two new ones, stages 2, 3 and 7 only questions; no game twice in a row', () => {
    const kinds = sohn.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['packen', 'quiz', 'quiz', 'lueckenvers', 'ausschau', 'reigen', 'quiz'])
    // the two quiet stages 2 and 3 follow each other: both are plain questions, no game
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(lookoutProblems(task(5).lookout!)).toEqual([])
    expect(danceProblems(task(6).dance!)).toEqual([])
  })

  it('1 pack: both rounds can be packed (round 1 fills the cloth exactly, round 2 leaves two cells), every thing has a name, the goal is 10', () => {
    const p = stage(1).task.pack!
    expect(p.rounds.map((r) => [r.cols, r.rows, r.items.length])).toEqual([[3, 2, 4], [4, 3, 6]])
    expect(p.rounds.reduce((sum, r) => sum + r.items.length, 0)).toBe(10)
    expect(new Set(p.items.map((i) => i.id)).size).toBe(p.items.length)
    for (const i of p.items) expect(i.label, i.id).toBeTruthy()
    for (const r of p.rounds) {
      const shapes = r.items.map((id) => {
        const it = p.items.find((i) => i.id === id)
        expect(it, id).toBeDefined()
        return { id, w: it!.w, h: it!.h }
      })
      const cells = shapes.reduce((s, x) => s + x.w * x.h, 0)
      expect(cells).toBeLessThanOrEqual(r.cols * r.rows)
      expect(solvable(r.cols, r.rows, shapes), 'the round can be packed').toBe(true)
    }
    expect(p.rounds[0]!.cols * p.rounds[0]!.rows).toBe(6)
    // the cloth lies on the yard in the lower part of the picture and is as wide as high as 4:3 in pixels (area is percent of a 3:2 picture)
    const a = p.area
    expect(a.x + a.w).toBeLessThanOrEqual(100)
    expect(a.y + a.h).toBeLessThanOrEqual(100)
    expect((a.w * 1.5) / a.h).toBeCloseTo(4 / 3, 0)
    expect(p.basket).toBe('images/abenteuer/spiele/sohn/packen/tuch.webp')
  })

  it('4 missing word: the sentence of the verse game is word for word in the story (Lk 15,18)', () => {
    const v = stage(4).task.verse!
    const text = stage(4).text.join(' ').replace(/[„“”]/g, '')
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(text).toContain(s)
    }
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    expect(v.rounds[1]!.words[v.rounds[1]!.answers[0]!]).toBe('aufmachen')
  })

  it('5 lookout: four walkers, then six; the son is the third and then the second to come; the others leave; the lanes lead from the horizon down to the gate', () => {
    const g = task(5).lookout!
    expect(g.rounds.map((r) => r.order.length)).toEqual([4, 6])
    expect(g.rounds.map((r) => r.order.findIndex((a) => a.walker === 'sohn'))).toEqual([2, 2])
    expect(g.rounds.every((r) => r.son === 'sohn')).toBe(true)
    expect(g.walkers.map((w) => w.id).sort()).toEqual(['bauer', 'frau', 'haendler', 'hirte', 'jungmann', 'sohn'])
    for (const l of g.lanes) expect(l.from.y).toBeLessThan(50)
    expect(g.background).toBe('images/abenteuer/spiele/sohn/ausschau/strasse.webp')
    // the help in words: the son walks alone and slowly
    expect(g.rounds[1]!.order.some((a) => a.walker === 'jungmann')).toBe(true)
  })

  it('6 dance: six dancers in a ring (only the neighbour), then ten (free); the father and the son dance; Luke 15,24-25', () => {
    const g = task(6).dance!
    expect(g.rounds.map((r) => r.mode)).toEqual(['neighbours', 'free'])
    expect(g.rounds.map((r) => r.places.length)).toEqual([6, 10])
    expect(g.rounds.every((r) => r.places.some((p) => p.id === 'vater') && r.places.some((p) => p.id === 'sohn'))).toBe(true)
    expect(g.dancers).toHaveLength(10)
    expect(g.notes).toHaveLength(3)
    // the father and the son stand next to each other in the ring of round 1
    const o = g.rounds[0]!.order
    expect(Math.abs(o.indexOf('vater') - o.indexOf('sohn'))).toBe(1)
  })
})

describe('Der verlorene Sohn: map, files, English', () => {
  it('seven stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = sohn.map
    expect(m.stages).toHaveLength(7)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(SOHN_PATH).toHaveLength(7)
    for (const seg of SOHN_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(SOHN_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    // Panorama mit dem Fest mit Freunden (Lk 15,13): Kachel 1 und 2 neu (v2), Kachel 3 unverändert (v1)
    expect(m.images).toEqual(['karte-pano-v2-1', 'karte-pano-v2-2', 'karte-pano-v1-3'].map((n) => `images/abenteuer/sohn/${n}.webp`))
    if (existsSync('public/images/abenteuer/sohn/karte-pano-v2-1.webp')) for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the medal and the gift lie in the folder of the adventure; music of its own only when its files are in', () => {
    expect(sohn.medal).toMatch(/^images\/abenteuer\/sohn\/medaille-v\d\.webp$/)
    expect(sohn.gift.image).toBe('images/abenteuer/sohn/geschenk.webp')
    expect(sohn.gift.title).toBe('Kleid, Ring und Schuhe')
    expect(sohn.downloadMb).toBeGreaterThan(5)
    for (const f of sohn.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('a recording is named only when its file is in `public/` (otherwise the device reads)', () => {
    for (const s of sohn.stages) {
      const nn = String(s.id).padStart(2, '0')
      const file = `audio/abenteuer/sohn/geschichte-${nn}-v1.mp3`
      expect(s.audio, `stage ${s.id}`).toBe(existsSync(`public/${file}`) ? file : undefined)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(sohn).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f) || /karte-pano/.test(f))
    expect(wanted.filter((f) => !existsSync(`public/${f}`))).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/sohn/etappe-bild-01'))).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(sohn)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(sohn) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string; subtitle: string }
    expect(en.title).toBe('The Lost Son')
    expect(en.subtitle).toBe('The parable of the father and his two sons')
    expect(en.stages).toHaveLength(7)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Give Me My Share')
    expect(sohn.gift.title).toBe('Robe, Ring and Shoes')
    expect(task(5).lookout!.walkers[0]!.name).toBe('a merchant')
    expect(task(5).lookout!.rounds[1]!.hint).toBe('Now six are coming. Look closely.')
    expect(task(6).dance!.dancers[2]!.name).toBe('Guest 1')
    expect(task(6).dance!.rounds[0]!.hint).toBe('Join the dancers until everyone holds hands.')
    expect(stage(1).task.pack!.items[0]!.label).toBe('Money pouch')
    expect(stage(4).task.verse!.rounds[0]!.words[0]).toBe('arise')
    setAdventureLanguage('de')
    expect(task(5).lookout!.walkers[0]!.name).toBe('ein Händler')
  })

  it('the English texts stay quiet: no blood, no cross, no devil, no harlots, no wine', () => {
    const en = englishTextsOf(sohn) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|hell|devil|cross|sword|corpse|harlots?|riotous|wine|slaughter(ed)?|knife|Jesus|angel)\b/i)
    })
  })
})
