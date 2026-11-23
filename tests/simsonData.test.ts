/**
 * The data of "Simson" (`simson.ts`, `en/simson.en.ts`, `simsonPath.ts`), adventure id `simson` (Judges 13 to 16, a selection told for children): the stories and questions follow the rules of the
 * adventures (texts of the draft `D:/Claude/Abenteuer-Simson/ENTWURF_Simson.md`, Luther 1912 told for children; the end as in the approved sample), three new and two known games with playable data
 * (every `*Problems` check is empty), the question rule (two after a game, three in the six stages without one, six in the exam), the map has eleven stations and the exam, and the English file has
 * the same shape. What is left out on purpose (Anton, 23.11.2026) is checked too: no putting out of the eyes, no words of revenge, no number of the dead, no wedding, no foxes, no jawbone.
 *
 * The pictures: while they are still being painted the test does not ask for the picture files (and the data write the folders in the PLACEHOLDER way, see `bauen_simson.py`); it asks for them as soon
 * as the pictures are built in (the last picture of the list, `spiele/simson/torheben/simson-links-v3.webp`, lies in `public/`). The map pieces are asked for as soon as the panorama is in. Recordings and
 * music only when they exist.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { simson } from '@/data/adventures/simson'
import { SIMSON_PATH } from '@/data/adventures/simsonPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { AVOID_BANNED_IDS, avoidProblems, gateLiftProblems, gateSolve, riddleProblems } from '@/utils/simsonNeu'
import type { AvoidGame, GateLiftGame, RiddleGame } from '@/utils/simsonNeu'
import type { VerseGame } from '@/types/adventure'
import { SIMSON_WORDS } from './simsonNeuI18n'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => simson.stages[n - 1]!
type NewTask = { avoid?: AvoidGame; riddle?: RiddleGame; gateLift?: GateLiftGame; verse?: VerseGame; image?: string }
const task = (n: number) => stage(n).task as unknown as NewTask
/** Words that no German text, question or answer may use: nothing gruesome, no weapons; what Anton left out of the story. */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Blut|blutig|Kreuz|Schwert|Messer|Mörder|Wunden|Waffen|Heiligenschein|Augen aus|stachen|blendeten|räche|rächen|Rache|Hochzeit|Philisterin|Füchse|Fackeln|Kinnbacken|Eselskinnbacken|Askalon|dreitausend|erschlug|erschlagen|Hure|Aas)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/simson/torheben/simson-links-v3.webp')
const PANORAMA_IN = existsSync('public/images/abenteuer/simson/karte-pano-v3-1.webp')
const LUTHER_13_24B = 'Und der Knabe wuchs, und der HERR segnete ihn.'

describe('Simson: stories and questions', () => {
  it('eleven stages with 2 to 6 paragraphs (at most 62 words each) of 75 to 150 words in all and the Bible passage under every one', () => {
    expect(simson.id).toBe('simson')
    expect(simson.title).toBe('Simson')
    expect(simson.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    for (const s of simson.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Richter \d+,\d+/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(2)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(6)
      for (const p of s.text) expect(p.split(/\s+/).length, `a paragraph of stage ${s.id}`).toBeLessThanOrEqual(62)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(75)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(150)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/simson/etappe-bild-${String(s.id).padStart(2, '0')}(-b|-v\\d)?\\.webp$`))
    }
    expect(simson.stages.map((s) => s.ref)).toEqual([
      'Richter 13,1–5', 'Richter 13,6–14', 'Richter 13,15–23', 'Richter 13,24–25; 14,5–9', 'Richter 14,10–14.18a', 'Richter 15,18–19',
      'Richter 16,1–3', 'Richter 16,4–14', 'Richter 16,15–20', 'Richter 16,21–27', 'Richter 16,25b–31'
    ])
  })

  it('the end as Anton approved it (23.11.2026): the prayer for strength, the house falls, "Auch Simson stirbt dabei", the burial with his father; Simson blind only by the boy who leads him', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(11)).toContain('Gib mir noch einmal Kraft')
    expect(t(11)).toContain('Das Haus stürzt ein. Auch Simson stirbt dabei.')
    expect(t(11)).toContain('im Grab seines Vaters Manoach')
    expect(t(10)).toContain('Ein Junge führt Simson an der Hand')
    const all = simson.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/\bAugen\b|\bblind\b|tausend Mann|Toten mehr/)
    // the lion is told, not shown: stage 4 only, the word "tot" once (the dead lion where the bees are)
    expect(simson.stages.filter((s) => /Löwe/.test(s.text.join(' '))).map((s) => s.id)).toEqual([4, 5])
    expect(t(4)).toContain('er überwältigt den Löwen')
    expect(t(4)).not.toMatch(/zerr/) // Luther "zerriß ihn": told as "überwältigt" (the ropes of Delila in stage 8 are torn, that stays)
  })

  it('no question or answer uses a forbidden word; two questions after a game (stages 2, 4, 5, 6, 7), three in the six stages without one, three answers each, the right one first; the exam has six', () => {
    for (const s of simson.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    for (const q of simson.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
    for (const s of simson.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    for (const n of [1, 3, 8, 9, 10, 11]) expect(stage(n).task.kind).toBe('quiz')
    for (const q of [...simson.stages.flatMap((s) => s.questions), ...simson.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(simson.stages.flatMap((s) => s.questions)).toHaveLength(28)
    expect(simson.exam).toHaveLength(6)
    const asked = simson.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'seiner', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'er', 'es', 'wer', 'wo', 'was', 'wann', 'seine', 'noch', 'soll', 'hat', 'unser', 'einmal', 'um'])
    for (const s of simson.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the changes of the check of the Bible (23.11.2026) are in: stage 1 frame, stage 4 the dead lion, stage 5 "Jemand hat sie ihnen verraten.", stage 7 "eine Stadt der Philister"', () => {
    expect(stage(1).text[0]).toMatch(/^Die Israeliten tun, was dem HERRN nicht gefällt\./)
    expect(stage(4).text.join(' ')).toContain('sieht nach dem toten Löwen')
    expect(stage(5).text.join(' ')).toContain('Jemand hat sie ihnen verraten.')
    expect(stage(7).text[0]).toBe('Simson geht nach Gaza, in eine Stadt der Philister.')
    expect(stage(3).questions[0]!.options[0]).toBe('Er ist wunderbar.')
  })
})

describe('Simson: the games', () => {
  it('the order of the games: two known ones (lueckenvers, ausmalen) apart, three new ones (meiden, raetsel, torheben), the serious stages 8 to 11 only questions; no game twice in a row', () => {
    const kinds = simson.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['quiz', 'meiden', 'quiz', 'lueckenvers', 'raetsel', 'ausmalen', 'torheben', 'quiz', 'quiz', 'quiz', 'quiz'])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    expect(kinds.indexOf('ausmalen') - kinds.indexOf('lueckenvers')).toBeGreaterThan(1)
    for (const n of [8, 9, 10, 11]) expect(stage(n).task.hint).toBe('Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.')
    for (const n of [1, 3]) expect(stage(n).task.hint).toBe('Höre gut zu und beantworte die Fragen.')
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(avoidProblems(task(2).avoid!)).toEqual([])
    expect(riddleProblems(task(5).riddle!)).toEqual([])
    expect(gateLiftProblems(task(7).gateLift!)).toEqual([])
  })

  it('2 what must she avoid?: the forbidden things are those of the angel and the vine; the words of the feedback name only wine, the vine and strong drink (words of the story); the hint is that of the draft', () => {
    const g = task(2).avoid!
    expect(g.items.filter((i) => i.kind === 'nicht').map((i) => i.id).sort()).toEqual([...AVOID_BANNED_IDS].sort())
    expect(g.rounds.map((r) => r.itemIds.length)).toEqual([4, 6])
    expect(JSON.stringify(g)).not.toMatch(/[Uu]nrein/)
    const text = stage(2).text.join(' ')
    expect(text).toContain('Sie soll nichts essen, was vom Weinstock kommt')
    expect(text).toContain('Wein und starkes Getränk soll sie nicht trinken')
    for (const k of ['vineSortOk', 'vineSortBanned', 'vineSortVine', 'vineSortWrongBanned', 'vineSortWrongAllowed'] as const) {
      const nouns = SIMSON_WORDS.de[k].match(/\b[A-ZÄÖÜ][a-zäöüß]+\b/g)!.filter((w) => !['Das', 'Engel'].includes(w))
      for (const w of nouns) expect(['Weinstock', 'Wein', 'Getränk'], `${k}: ${w}`).toContain(w)
    }
    expect(stage(2).task.hint).toBe('Lege in den Korb, was die Frau essen und trinken darf. Das andere lege beiseite.')
    expect(g.background).toBe('images/abenteuer/spiele/simson/meiden/tisch.webp')
  })

  it('4 missing word (the memory verse, Judges 13,24b): the verse is word for word Luther 1912; its words stand (as a stem) in the story; the questions do not ask for it', () => {
    const v = task(4).verse!
    const text = stage(4).text.join(' ')
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(s).toBe(LUTHER_13_24B)
      for (const a of r.answers) expect(text).toContain(r.words[a]!.slice(0, 5))
    }
    expect(text).toContain('Der Knabe wächst, und der HERR segnet ihn.')
    expect(v.background).toBe('images/abenteuer/spiele/simson/hintergrund/vers-hintergrund.webp')
    expect(stage(4).questions.map((q) => q.q).join(' ')).not.toMatch(/segne|wuchs|wächst/)
    expect(stage(4).task.hint).toBe('Setze das fehlende Wort in den Vers.')
  })

  it('5 sweet and strong: honey and lion on top; the lion is only a card; the words never say "Fresser" or "Aas"', () => {
    const g = task(5).riddle!
    expect(g.rounds.map((r) => r.cards[r.cards.length - 1]!.id)).toEqual(['karte-honig', 'karte-loewe'])
    expect(g.rounds.map((r) => r.cards.map((c) => c.label))).toEqual([['Brot', 'Trauben', 'Honig'], ['Hase', 'Schaf', 'Esel', 'Löwe']])
    for (const lang of ['de', 'en', 'es'] as const)
      for (const [k, v] of Object.entries(SIMSON_WORDS[lang])) if (!k.endsWith('Done')) expect(v, k).not.toMatch(/Fresser|Aas|eater|carcass|comedor/i)
    expect(stage(5).text.join(' ')).toContain('Was ist süßer als Honig? Was ist stärker als ein Löwe?')
  })

  it('6 colouring (known): the spring in the cave; the line picture lies in the folder of the game', () => {
    expect(stage(6).task.kind).toBe('ausmalen')
    expect(stage(6).task.hint).toBe('Male die Quelle in der Höhle aus.')
    expect(task(6).image).toBe('images/abenteuer/spiele/simson/ausmalen/etappe-06.webp')
    // zones measured on the line picture (tools/ausmalen_zonen_simson.py), a pool of tasks, three drawn
    const t6 = stage(6).task
    expect(Object.keys(t6.zones ?? {}).sort()).toEqual(['baum', 'blumen', 'felsen', 'gras', 'himmel', 'quelle', 'teich', 'vogel', 'wolken'])
    for (const z of Object.values(t6.zones ?? {})) for (const [x, y] of z.seeds) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
    expect(t6.jobCount).toBe(3)
    for (const j of t6.jobs ?? []) {
      expect(t6.zones?.[j.zone], j.zone).toBeDefined()
      expect(!!(j.tool || j.color), j.hint).toBe(true)
    }
    expect(new Set((t6.jobs ?? []).map((j) => j.zone)).size).toBeGreaterThanOrEqual(3)
  })

  it('the stage pictures: variant a, the newer versions v3 of stages 3, 7 and 10 (new names for the cache of the phones)', () => {
    expect(simson.stages.map((s) => s.image!.replace('images/abenteuer/simson/', ''))).toEqual([
      'etappe-bild-01.webp', 'etappe-bild-02.webp', 'etappe-bild-03-v3.webp', 'etappe-bild-04.webp', 'etappe-bild-05.webp', 'etappe-bild-06.webp',
      'etappe-bild-07-v3.webp', 'etappe-bild-08.webp', 'etappe-bild-09.webp', 'etappe-bild-10-v3.webp', 'etappe-bild-11.webp'
    ])
    expect(simson.map.images).toEqual([1, 2, 3].map((n) => `images/abenteuer/simson/karte-pano-v3-${n}.webp`))
    expect(simson.medal).toBe('images/abenteuer/simson/medaille-v1.webp')
    expect(task(7).gateLift!.background).toBe('images/abenteuer/spiele/simson/torheben/nacht-v2.webp')
    expect(task(7).gateLift!.strong.image).toBe('images/abenteuer/spiele/simson/torheben/simson-links-v3.webp')
  })

  it('7 lift out the gate: the bar first, then the doors, then the posts; no guards, no weapons in the data', () => {
    const g = task(7).gateLift!
    expect(g.rounds.map((r) => r.parts.length)).toEqual([3, 5])
    expect(gateSolve(g.rounds[1]!)).toEqual(['riegel', 'fluegel-links', 'fluegel-rechts', 'pfosten-links', 'pfosten-rechts'])
    expect(JSON.stringify(g)).not.toMatch(/waechter|wächter|schwert|speer|fackel/i)
    expect(stage(7).text.join(' ')).toMatch(/mit dem Riegel, und legt sie auf seine Schultern/)
  })
})

describe('Simson: map, files, English', () => {
  it('eleven stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = simson.map
    const W = m.widthPx
    expect(m.stages).toHaveLength(11)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / W, 3)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * W, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(SIMSON_PATH).toHaveLength(11)
    for (const seg of SIMSON_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    for (const seg of SIMSON_PATH) for (const [, y] of seg) expect(y * 1648, 'no bead in the lowest fifth').toBeLessThanOrEqual(1318)
    expect(m.path).toBe(SIMSON_PATH)
    if (PANORAMA_IN) for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the way and the medal are placeholders only as long as their pictures are missing (the files say so)', () => {
    const path = readFileSync('src/data/adventures/simsonPath.ts', 'utf8')
    if (PANORAMA_IN) expect(path, 'the real way of the panorama must replace the placeholder').not.toMatch(/PLATZHALTER/)
    const data = readFileSync('src/data/adventures/simson.ts', 'utf8')
    if (existsSync('public/images/abenteuer/simson/medaille-v1.webp')) expect(simson.medal).toBe('images/abenteuer/simson/medaille-v1.webp')
    else expect(data).toMatch(/medal: 'images\/abenteuer\/ui\/medaille-josef\.webp', \/\/ PLATZHALTER/)
    if (PICTURES_IN) expect(data).toMatch(/const G = 'images\/abenteuer\/spiele\/simson\/'/)
  })

  it('the gift lies in the folder of the adventure; music of its own only when its files are in', () => {
    expect(simson.gift.image).toBe('images/abenteuer/simson/geschenk.webp')
    expect(simson.gift.title).toBe('Honig im Weinberg')
    expect(simson.downloadMb).toBe(13) // measured 23.11.2026: all files of the journey are 12.81 MB
    expect(simson.music).toEqual(['zora', 'timna', 'gaza'].map((n) => `audio/abenteuer/simson/musik-${n}-v1.mp3`))
    expect(simson.stages.map((s) => s.music?.match(/musik-(\w+)-/)?.[1])).toEqual(['zora', 'zora', 'zora', 'timna', 'timna', 'timna', 'timna', 'gaza', 'gaza', 'gaza', 'gaza'])
    for (const f of simson.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
    for (const s of simson.stages) if (s.music) expect(simson.music).toContain(s.music)
  })

  it('a story is read from a recording only when the recording file exists (the German and the English one)', () => {
    for (const s of simson.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/simson/geschichte-${String(s.id).padStart(2, '0')}-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
    setAdventureLanguage('en')
    for (const s of simson.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/simson/geschichte-${String(s.id).padStart(2, '0')}-en-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(simson).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f))
    expect(wanted.filter((f) => !existsSync(`public/${f}`))).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/simson/etappe-bild-01'))).toBe(true)
    for (const d of ['meiden', 'raetsel', 'torheben', 'ausmalen', 'hintergrund', 'lueckenvers']) expect(files.some((f) => f.startsWith(`images/abenteuer/spiele/simson/${d}/`)), d).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(simson)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(simson) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Samson')
    expect(en.stages).toHaveLength(11)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The Angel Comes')
    expect(stage(11).text[1]).toContain('Samson dies, too.')
    expect(simson.gift.title).toBe('Honey in the Vineyard')
    expect(task(2).avoid!.items[2]!.label).toBe('a cup of wine')
    expect(task(2).avoid!.rounds[1]!.hint).toBe('What may the woman eat? She must avoid everything that comes from the vine.')
    expect(task(5).riddle!.rounds[1]!.ladderLabel).toBe('the strongest')
    expect(task(5).riddle!.rounds[1]!.cards[3]!.label).toBe('Lion')
    expect(task(7).gateLift!.rounds[1]!.parts[0]!.label).toBe('The bar')
    expect(task(4).verse!.rounds[0]!.words[0]).toBe('blessed')
    expect(task(4).verse!.rounds[1]!.parts[0]).toBe('And the ')
    expect(stage(8).task.hint).toBe('This stage is serious. Listen well and answer the questions.')
    setAdventureLanguage('de')
    expect(task(2).avoid!.items[2]!.label).toBe('ein Becher Wein')
  })

  it('the English texts stay quiet: no blood, no sword, no eyes put out, no revenge', () => {
    const en = englishTextsOf(simson) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|bloody|hell|devil|sword|corpse|knife|murder\w*|wounds?|weapons?|eyes|blind\w*|revenge|avenge\w*|harlot|wedding|foxes|jawbone|carcass|thousand men)\b/i)
    })
  })
})
