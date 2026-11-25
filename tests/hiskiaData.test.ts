/**
 * The data of "Hiskia: Ein Brief vor Gott" (`hiskia.ts`, `en/hiskia.en.ts`, `hiskiaPath.ts`), adventure id `hiskia` (2 Kings 18-20, 2 Chronicles 29, 30 and 32, a selection told for children):
 * the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Hiskia/ENTWURF_Hiskia.md`, Luther 1912 told for children; Anton approved on 25.11.2026 that stage 8 names
 * the angel of the LORD - in the text only, never in a picture - and the new stage 10 "Das Wasser für die Stadt"), four new and two known games with playable data (every `*Problems` check is empty), the
 * question rule (two after a game, three in the four stages without one, six in the exam), the map has ten stations and the exam, and the English file has the same shape. What is left out on purpose is
 * checked too: no blood, no dead, no number in the camp, no sword, no weapon.
 *
 * The pictures: while they are still being painted the test does not ask for the picture files (and the data write the folders in the PLACEHOLDER way, see `bauen_hiskia.py`); it asks for them as soon as
 * the pictures are built in (the last picture of the list, `spiele/hiskia/stollen/zeiger.webp`, lies in `public/`). The map pieces are asked for as soon as the panorama is in. Recordings and music only when they exist.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { hiskia } from '@/data/adventures/hiskia'
import { HISKIA_PATH } from '@/data/adventures/hiskiaPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { cityMorningProblems, runRoutesProblems, runSolutions, solveMorning, sundialProblems, targetStep, tunnelProblems } from '@/utils/hiskiaNeu'
import type { CityMorningGame, RunRoutesGame, SundialGame, TunnelGame } from '@/utils/hiskiaNeu'
import type { MemoryGame, VerseGame } from '@/types/adventure'
import { HISKIA_WORDS } from './hiskiaNeuI18n'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => hiskia.stages[n - 1]!
type NewTask = { runRoutes?: RunRoutesGame; cityMorning?: CityMorningGame; sundial?: SundialGame; tunnel?: TunnelGame; memory?: MemoryGame; verse?: VerseGame }
const task = (n: number) => stage(n).task as unknown as NewTask
/** Words that no German text, question or answer may use: nothing gruesome; what the plan leaves out of the story (the numbers in the camp, the dead, weapons). */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Blut|blutig|Kreuz|Schwert|Schwerter|Messer|Waffen|Speer|Pfeil|Pfeile|Heiligenschein|Tote|Toten|erschlagen|erschlug|schlug|hundertfünfundachtzigtausend|Totenzahl)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/hiskia/stollen/zeiger.webp')
const PANORAMA_IN = existsSync('public/images/abenteuer/hiskia/karte-pano-v3-1.webp')
const LUTHER_2KOEN_19_6 = 'Fürchte dich nicht vor den Worten, die du gehört hast.'

describe('Hiskia: stories and questions', () => {
  it('ten stages with 3 to 4 paragraphs (at most 62 words each) of 70 to 150 words in all and the Bible passage under every one', () => {
    expect(hiskia.id).toBe('hiskia')
    expect(hiskia.title).toBe('Hiskia: Ein Brief vor Gott')
    expect(hiskia.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const s of hiskia.stages) {
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      for (const p of s.text) expect(p.split(/\s+/).length, `a paragraph of stage ${s.id}`).toBeLessThanOrEqual(62)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(70)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(150)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/hiskia/etappe-bild-${String(s.id).padStart(2, '0')}(-b|-n|-m|-v\\d)?\\.webp$`))
    }
    expect(hiskia.stages.map((s) => s.ref)).toEqual([
      '2. Könige 18,1–7; 2. Chronik 29,3', '2. Chronik 30,1–12', '2. Chronik 30,13–27', '2. Könige 18,13–17', '2. Könige 18,19–37', '2. Könige 19,1–7', '2. Könige 19,8–19', '2. Könige 19,20–21.32–36',
      '2. Könige 20,1–11', '2. Könige 20,20; 2. Chronik 32,2–4.30'
    ])
  })

  it('what the plan keeps and leaves out (25.11.2026): the angel of the LORD only in stage 8 and without a number or a blow; Sennacherib and his envoy in the stages 4, 5, 6, 7, 8 and 10 only; the letter in stage 7', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(hiskia.stages.filter((s) => /Engel/.test(s.text.join(' '))).map((s) => s.id)).toEqual([8])
    expect(t(8)).toContain('In derselben Nacht fährt der Engel des HERRN aus. Am Morgen früh ist im Lager von Assyrien kein Feind mehr.')
    expect(t(8)).not.toMatch(/schlug|Tote|tot|Leichen|\d{3}/)
    expect(t(7)).toContain('breitet den Brief vor dem HERRN aus')
    expect(t(7)).toContain('Hiskia nimmt den Brief von den Boten und liest ihn.')
    expect(t(9)).toContain('der Schatten geht zehn Stufen zurück an der Treppe des Ahas')
    expect(t(10)).toContain('Hiskia macht den Teich und die Wasserleitung')
    expect(hiskia.stages.filter((s) => /Sanherib/.test(s.text.join(' '))).map((s) => s.id)).toEqual([4, 7, 8, 10])
    expect(hiskia.stages.filter((s) => /Babel|Merodach|Manasse|begraben/.test(s.text.join(' '))).map((s) => s.id)).toEqual([])
  })

  it('no question or answer uses a forbidden word; two questions after a game (stages 2, 4, 6, 8, 9, 10), three in the four stages without one, three answers each, the right one first; the exam has six', () => {
    for (const s of hiskia.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    for (const q of hiskia.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
    for (const s of hiskia.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    for (const n of [1, 3, 5, 7]) expect(stage(n).task.kind).toBe('quiz')
    for (const q of [...hiskia.stages.flatMap((s) => s.questions), ...hiskia.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(hiskia.stages.flatMap((s) => s.questions)).toHaveLength(24)
    expect(hiskia.exam).toHaveLength(6)
    const asked = hiskia.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'seiner', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'er', 'es', 'wer', 'wo', 'was', 'wann', 'seine', 'noch', 'soll', 'hat', 'unser', 'einmal', 'um', 'sollen', 'wenn', 'sagt', 'viele', 'viel'])
    for (const s of hiskia.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks about stages 1, 5, 7, 8, 9 and 10 (one question each, as in the draft)', () => {
    expect(hiskia.exam.map((q) => q.options[0])).toEqual([
      'Er macht die Türen am Haus des HERRN auf.', 'Sie schweigen.', 'den Brief', 'in Ninive', 'zehn Stufen', 'viel Wasser'
    ])
  })
})

describe('Hiskia: the games', () => {
  it('the order of the games: two known ones (memory, lueckenvers) apart, four new ones (laufwege, stadtmorgen, sonnenuhr, stollen), the stages 1, 3, 5, 7 only questions; no game twice in a row, never two stages with questions only in a row', () => {
    const kinds = hiskia.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['quiz', 'laufwege', 'quiz', 'memory', 'quiz', 'lueckenvers', 'quiz', 'stadtmorgen', 'sonnenuhr', 'stollen'])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] === 'quiz') expect(kinds[i - 1], `two stages with questions only in a row at ${i + 1}`).not.toBe('quiz')
    expect(kinds.indexOf('lueckenvers') - kinds.indexOf('memory')).toBeGreaterThan(1)
    expect(new Set(kinds.filter((k) => k !== 'quiz')).size).toBe(6)
    expect(stage(5).task.hint).toBe('Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.')
    for (const n of [1, 3, 7]) expect(stage(n).task.hint).toBe('Höre gut zu und beantworte die Fragen.')
    expect(stage(2).task.hint).toBe('Hiskia schickt Läufer mit Briefen. Jeder Läufer hat drei Briefe. Schicke sie so los, dass jede Stadt einen bekommt.')
    expect(stage(4).task.hint).toBe('Finde die zwei gleichen Bilder.')
    expect(stage(6).task.hint).toBe('Setze das fehlende Wort in den Vers.')
    expect(stage(8).task.hint).toBe('Die Stadt wacht auf. Tippe ein Haus an: Seine Tür und die Türen daneben wechseln. Öffne alle Türen.')
    expect(stage(9).task.hint).toBe('Der Schatten wandert über die Treppe. Zeige mit der Schattenspitze, wo er stehen wird, und zähle Stufe für Stufe.')
    expect(stage(10).task.hint).toBe('Zwei Trupps graben von beiden Seiten durch den Fels. Lenke beide, damit sie sich in der Mitte treffen.')
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(runRoutesProblems(task(2).runRoutes!)).toEqual([])
    expect(cityMorningProblems(task(8).cityMorning!)).toEqual([])
    expect(sundialProblems(task(9).sundial!)).toEqual([])
    expect(tunnelProblems(task(10).tunnel!)).toEqual([])
  })

  it('2 send the runners: one way in each round (2 runners and 5 towns, 3 runners and 7 towns); the words of the game name no Sennacherib, no envoy, no camp, no angel; the questions do not ask for the runners', () => {
    const g = task(2).runRoutes!
    expect(g.rounds.map((r) => r.runners)).toEqual([2, 3])
    expect(g.rounds.map((r) => r.towns.length)).toEqual([5, 7])
    expect(g.rounds.map((r) => runSolutions(r).length)).toEqual([1, 1])
    expect(g.rounds.map((r) => r.towns.filter((t) => t.reacts === 'comes').length)).toEqual([2, 4])
    expect(g.background).toBe('images/abenteuer/spiele/hiskia/laufwege/karte.webp')
    for (const [k, v] of Object.entries(HISKIA_WORDS.de)) if (k.startsWith('lettersRun') && !k.endsWith('Done')) expect(v, k).not.toMatch(/Sanherib|Gesandte|Lager|Engel|Assyrien|Israel|Juda/)
    expect(JSON.stringify(g)).not.toMatch(/Israel|Juda|Efraim|Manasse|Sanherib|Assyrien/)
    expect(stage(2).text.join(' ')).toContain('Läufer tragen die Briefe des Königs durch das ganze Land.')
  })

  it('4 find the pairs (known, no verse): six pairs with six different pictures; the sentences name no Sennacherib, no king of Assyria, no house of the LORD, no treasure (they would give away the questions)', () => {
    const m = task(4).memory!
    expect(m.pairs).toHaveLength(6)
    expect(new Set(m.pairs.map((p) => p.image)).size).toBe(6)
    expect(m.back).toBe('images/abenteuer/spiele/hiskia/memory/rueck.webp')
    expect(m.pairs.map((p) => p.image.split('/').pop())).toEqual(['leitung.webp', 'teich.webp', 'tuer.webp', 'truhe.webp', 'rolle.webp', 'mauer.webp'])
    for (const p of m.pairs) expect(p.text, p.image).not.toMatch(/Sanherib|König von Assyrien|Haus des HERRN|Schätze|Assyrer/)
    expect(new Set(m.pairs.map((p) => p.text)).size).toBe(6)
    expect(stage(4).questions.map((q) => q.q).join(' ')).not.toMatch(/Wasserleitung|Teich|Truhe|Mauer|Türen/)
  })

  it('6 missing word (the memory verse, 2 Kings 19,6): the verse is word for word Luther 1912; its words stand in the story; the questions of the stage do not ask for them', () => {
    const v = task(6).verse!
    const text = stage(6).text.join(' ')
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(s).toBe(LUTHER_2KOEN_19_6)
      for (const a of r.answers) expect(text).toContain(r.words[a]!.slice(0, 5))
    }
    expect(text).toContain('Fürchte dich nicht vor den Worten, die du gehört hast')
    expect(v.background).toBe('images/abenteuer/spiele/hiskia/hintergrund/vers-hintergrund.webp')
    expect(stage(6).questions.map((q) => `${q.q} ${q.options.join(' ')}`).join(' ')).not.toMatch(/Worten|Fürchte|gehört|Wellen|Wölfen/)
  })

  it('8 the city wakes up: the doors are shut at the start (3 and 7), one shortest way (3 and 5 taps); the words name no angel, no enemy, no camp, no Sennacherib, no Nineveh', () => {
    const g = task(8).cityMorning!
    expect(g.rounds.map((r) => r.shut.filter(Boolean).length)).toEqual([3, 7])
    expect(g.rounds.map((r) => solveMorning(r.shut, r.cols, r.rows)!.length)).toEqual([3, 5])
    expect(g.rounds.map((r) => [r.cols, r.rows])).toEqual([[3, 3], [3, 4]])
    for (const [k, v] of Object.entries(HISKIA_WORDS.de)) if (k.startsWith('cityWake') && !k.endsWith('Done')) expect(v, k).not.toMatch(/Engel|Feind|Lager|Sanherib|Ninive|Waffe/)
    expect(JSON.stringify(g)).not.toMatch(/Engel|Feind|Lager|Sanherib|Ninive|Waffe|Soldat/)
    expect(g.background).toBe('images/abenteuer/spiele/hiskia/stadtmorgen/hang.webp')
    expect(stage(8).questions.map((q) => q.q).join(' ')).not.toMatch(/Tür|Haus|Morgen/)
  })

  it('9 how many steps: fourteen steps; round 1 from step 4 three steps forward to step 7, round 2 from step 13 ten steps back to step 3; the words show no sun and no sign of the child', () => {
    const g = task(9).sundial!
    expect(g.treads).toHaveLength(14)
    expect(g.rounds.map((r) => [r.start, r.steps, r.dir, targetStep(r)])).toEqual([[4, 3, 1, 7], [13, 10, -1, 3]])
    for (const [k, v] of Object.entries(HISKIA_WORDS.de)) if (k.startsWith('shadowSteps') && !k.endsWith('Done')) expect(v, k).not.toMatch(/Sonne|Engel|Wunder|Zeichen/)
    expect(JSON.stringify(g.rounds)).not.toMatch(/Sonne|sun\b/i)
    expect(g.background).toBe('images/abenteuer/spiele/hiskia/sonnenuhr/treppe.webp')
    expect(stage(9).questions.map((q) => q.q).join(' ')).not.toMatch(/Stufen|Treppe|Schatten/)
  })

  it('10 meeting in the rock: five and six pieces, two and three layers, round 1 always shows where the other crew is and round 2 only after "Listen"; the words name no Gihon, no "zudecken", no Manasse, no grave', () => {
    const g = task(10).tunnel!
    expect(g.rounds.map((r) => [r.pieces, r.seg, r.bands.length, r.listen])).toEqual([[5, 9, 2, 'always'], [6, 7.5, 3, 'button']])
    expect(g.tolerance).toEqual({ three: 1.5, two: 3, join: 8 })
    for (const [k, v] of Object.entries(HISKIA_WORDS.de)) if (k.startsWith('meetRock') && !k.endsWith('Done')) expect(v, k).not.toMatch(/(Gihon|zudecken|zugedeckt|Manasse|Grab|Tunnel)/)
    expect(JSON.stringify(g)).not.toMatch(/Gihon|Siloah|Inschrift|Manasse|Grab/)
    expect(g.background).toBe('images/abenteuer/spiele/hiskia/stollen/fels.webp')
    expect(stage(10).questions.map((q) => `${q.q} ${q.options.join(' ')}`).join(' ')).not.toMatch(/Tunnel|Fels|Stollen|graben/)
  })

  it('the stage pictures: variant a (newer versions carry an ending, a new name for the cache of the phones); the medal, the gift and the map pieces lie in the folder of the adventure', () => {
    expect(hiskia.stages.every((s) => /^images\/abenteuer\/hiskia\/etappe-bild-\d\d(-v\d+|-n|-m|-b)?\.webp$/.test(s.image!))).toBe(true)
    expect(hiskia.gift.title).toBe('Jerusalem in Hiskias Tagen')
    expect(hiskia.gift.image).toMatch(/^images\/abenteuer\/hiskia\/geschenk(-[a-z0-9]+)?\.webp$/)
    expect(hiskia.map.images.map((f) => f.replace(/-v\d-/, '-vN-'))).toEqual([1, 2, 3].map((n) => `images/abenteuer/hiskia/karte-pano-vN-${n}.webp`))
    expect(hiskia.medal).toMatch(/^images\/abenteuer\/(hiskia\/medaille-v\d+|ui\/medaille-josef)\.webp$/)
  })
})

describe('Hiskia: map, files, English', () => {
  it('ten stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = hiskia.map
    const W = m.widthPx
    const H = Math.round(W / m.aspect)
    expect(m.stages).toHaveLength(10)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * H, 'station not lower than 80 %').toBeLessThanOrEqual(H * 0.8)
      expect(s.d).toBeCloseTo(336 / W, 3)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * W, (all[i]!.y - all[i - 1]!.y) * H), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(HISKIA_PATH).toHaveLength(10)
    for (const seg of HISKIA_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    for (const seg of HISKIA_PATH) for (const [, y] of seg) expect(y * H, 'no bead in the lowest fifth').toBeLessThanOrEqual(H * 0.8)
    expect(m.path).toBe(HISKIA_PATH)
    if (PANORAMA_IN) for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the way and the medal are placeholders only as long as their pictures are missing (the files say so)', () => {
    const path = readFileSync('src/data/adventures/hiskiaPath.ts', 'utf8')
    if (PANORAMA_IN) expect(path, 'the real way of the panorama must replace the transition way').not.toMatch(/PLATZHALTER|UEBERGANG/)
    const data = readFileSync('src/data/adventures/hiskia.ts', 'utf8')
    if (existsSync(`public/${hiskia.medal}`) && hiskia.medal.includes('/hiskia/')) expect(data).not.toMatch(/PLATZHALTER: die Josef-Medaille/)
    else expect(data).toMatch(/medal: 'images\/abenteuer\/ui\/medaille-josef\.webp', \/\/ PLATZHALTER/)
    if (PICTURES_IN) expect(data).toMatch(/const G = 'images\/abenteuer\/spiele\/hiskia\/'/)
  })

  it('the download size is entered; music of its own only when its files are in; recordings only when their files are in', () => {
    expect(hiskia.downloadMb).toBeGreaterThan(0)
    for (const f of hiskia.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
    for (const s of hiskia.stages) if (s.music) expect(hiskia.music).toContain(s.music)
    for (const s of hiskia.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/hiskia/geschichte-${String(s.id).padStart(2, '0')}-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
    setAdventureLanguage('en')
    for (const s of hiskia.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/hiskia/geschichte-${String(s.id).padStart(2, '0')}-en-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
  })

  it('the recordings of the Ton-Agent (geltend.json 25.11.2026) and the three pieces of music: stage 4 is v6 (with the host), the music 1-3, 4-6, 7-10', () => {
    expect(hiskia.stages.map((s) => s.audio)).toEqual([2, 2, 2, 6, 2, 2, 2, 2, 2, 2].map((v, i) => `audio/abenteuer/hiskia/geschichte-${String(i + 1).padStart(2, '0')}-v${v}.mp3`))
    setAdventureLanguage('en')
    const en = englishTextsOf(hiskia) as { stages: { audio?: string }[] }
    expect(en.stages.map((s) => s.audio)).toEqual([2, 2, 2, 6, 2, 2, 4, 2, 2, 2].map((v, i) => `audio/abenteuer/hiskia/geschichte-${String(i + 1).padStart(2, '0')}-en-v${v}.mp3`))
    setAdventureLanguage('de')
    expect(hiskia.music).toEqual(['offenetuer', 'vormauer', 'briefgebet'].map((n) => `audio/abenteuer/hiskia/musik-${n}-v1.mp3`))
    expect(hiskia.stages.map((s) => s.music?.match(/musik-(\w+)-v/)?.[1])).toEqual(['offenetuer', 'offenetuer', 'offenetuer', 'vormauer', 'vormauer', 'vormauer', 'briefgebet', 'briefgebet', 'briefgebet', 'briefgebet'])
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(hiskia).filter((f) => !notPaintedYet(f) && (PANORAMA_IN || !f.includes('karte-pano')))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f))
    expect(wanted.filter((f) => !existsSync(`public/${f}`))).toEqual([])
    if (PICTURES_IN) {
      expect(files.some((f) => f.startsWith('images/abenteuer/hiskia/etappe-bild-01'))).toBe(true)
      for (const d of ['laufwege', 'memory', 'stadtmorgen', 'sonnenuhr', 'stollen', 'hintergrund', 'lueckenvers']) expect(files.some((f) => f.startsWith(`images/abenteuer/spiele/hiskia/${d}/`)), d).toBe(true)
    }
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(hiskia)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(hiskia) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Hezekiah: A Letter Before God')
    expect(en.stages).toHaveLength(10)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Hezekiah Becomes King')
    expect(hiskia.gift.title).toBe('Jerusalem in Hezekiah’s Days')
    expect(task(2).runRoutes!.runners[0]!.label).toBe('runner with a headband')
    expect(task(2).runRoutes!.rounds[1]!.hint).toBe('Three runners, seven towns. Each town gets only one letter.')
    expect(task(2).runRoutes!.rounds[0]!.towns[2]!.label).toBe('Town 3')
    expect(task(4).memory!.pairs[4]!.text).toBe('Hezekiah sends word to Lachish.')
    expect(task(6).verse!.rounds[0]!.words[0]).toBe('words')
    expect(task(6).verse!.rounds[1]!.parts[0]).toBe('Be not ')
    expect(task(8).cityMorning!.rounds[1]!.hint).toBe('Twelve houses, seven doors are still shut.')
    expect(task(9).sundial!.rounds[1]!.hint).toBe('Now the shadow goes back ten steps, up the stairs. Show where it will stand.')
    expect(task(10).tunnel!.rounds[0]!.hint).toBe('Choose a direction for both crews and tap “Dig”. The dark layers push the tunnel to the side.')
    expect(task(10).tunnel!.crews.labelRight).toBe('crew at the pool')
    expect(stage(5).task.hint).toBe('This stage is serious. Listen well and answer the questions.')
    expect(stage(2).task.hint).toBe('Hezekiah sends runners with letters. Each runner has three letters. Send them out so that every town gets one.')
    setAdventureLanguage('de')
    expect(task(2).runRoutes!.runners[0]!.label).toBe('Läufer mit Stirnband')
  })

  it('the English texts stay quiet: no blood, no sword, no corpse, no number of the dead, no weapon', () => {
    const en = englishTextsOf(hiskia) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|bloody|hell|devil|sword|swords|corpse|corpses|knife|murder\w*|slew|smote|dead|weapons?|arrows?|spears?|hundred and fourscore)\b/i)
    })
  })
})
