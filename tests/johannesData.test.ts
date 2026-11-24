/**
 * The data of "Johannes der Täufer" (`johannes.ts`, `en/johannes.en.ts`, `johannesPath.ts`), adventure id `johannes` (Luke 1 and 3, John 1 and 3, Matthew 11 and 14, a selection told for children):
 * the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Johannes/ENTWURF_Johannes.md`, Luther 1912 told for children; Anton approved the one sentence
 * "Später starb Johannes ..." at the end of stage 10 on 24.11.2026), three new and two known games with playable data (every `*Problems` check is empty), the question rule (two after a game, three in
 * the five stages without one, six in the exam), the map has ten stations and the exam, and the English file has the same shape. What is left out on purpose is checked too: no Herodias, no feast,
 * no head, no blood.
 *
 * The pictures: while they are still being painted the test does not ask for the picture files (and the data write the folders in the PLACEHOLDER way, see `bauen_johannes.py`); it asks for them as
 * soon as the pictures are built in (the last picture of the list, `spiele/johannes/zeigen/mann-traeger.webp`, lies in `public/`). The map pieces are asked for as soon as the panorama is in.
 * Recordings and music only when they exist.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { johannes } from '@/data/adventures/johannes'
import { JOHANNES_PATH } from '@/data/adventures/johannesPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { gestureProblems, giveAwayProblems, giveSolve, pointProblems } from '@/utils/johannesNeu'
import type { GestureGame, GiveAwayGame, PointGame } from '@/utils/johannesNeu'
import type { VerseGame } from '@/types/adventure'
import { JOHANNES_WORDS } from './johannesNeuI18n'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => johannes.stages[n - 1]!
type NewTask = { gestures?: GestureGame; giveAway?: GiveAwayGame; pointing?: PointGame; verse?: VerseGame; image?: string }
const task = (n: number) => stage(n).task as unknown as NewTask
/** Words that no German text, question or answer may use: nothing gruesome; what the plan leaves out of the story. */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Blut|blutig|Kreuz|Schwert|Messer|Mörder|Wunden|Waffen|Heiligenschein|enthaupt\w*|Kopf ab|Schüssel|Herodias|Salome|Fest|Tanz|Ketten|Fesseln)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/johannes/zeigen/mann-traeger.webp')
const PANORAMA_IN = existsSync('public/images/abenteuer/johannes/karte-pano-v3-1.webp')
const LUTHER_1_80A = 'Und das Kindlein wuchs und ward stark im Geist.'

describe('Johannes: stories and questions', () => {
  it('ten stages with 3 to 4 paragraphs (at most 62 words each) of 70 to 150 words in all and the Bible passage under every one', () => {
    expect(johannes.id).toBe('johannes')
    expect(johannes.title).toBe('Johannes der Täufer')
    expect(johannes.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (const s of johannes.stages) {
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      for (const p of s.text) expect(p.split(/\s+/).length, `a paragraph of stage ${s.id}`).toBeLessThanOrEqual(62)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(70)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(150)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/johannes/etappe-bild-${String(s.id).padStart(2, '0')}(-b|-n|-m|-v\\d)?\\.webp$`))
    }
    expect(johannes.stages.map((s) => s.ref)).toEqual([
      'Lukas 1,5–16', 'Lukas 1,18–25', 'Lukas 1,57–80', 'Lukas 3,1–6', 'Lukas 3,10–14', 'Matthäus 3,13–17', 'Johannes 1,19–28', 'Johannes 1,29–37', 'Johannes 3,22–30', 'Matthäus 11,2–11; 14,3.12'
    ])
  })

  it('the end as Anton approved it (24.11.2026): one sentence "Später starb Johannes, ...", nothing about how; the messengers, the answer of Jesus and "mehr als ein Prophet" before it', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(stage(10).text[stage(10).text.length - 1]).toBe('Später starb Johannes, und seine Jünger kamen, begruben ihn und sagten es Jesus.')
    expect(t(10)).toContain('Johannes sitzt im Gefängnis.')
    expect(t(10)).toContain('Er ist mehr als ein Prophet.')
    expect(t(10)).not.toMatch(/Herodias|Fest|Schüssel|Kopf|Blut|enthaupt/)
    // Herodes only as the one who had him arrested, in stage 10 and nowhere else
    expect(johannes.stages.filter((s) => /Herodes/.test(s.text.join(' '))).map((s) => s.id)).toEqual([10])
    // the dove ("wie eine Taube"; in stage 10 "Taube hören" are the deaf) in the baptism (stage 6) and in the words of John (stage 8), the lamb only in the words of John (stage 8)
    expect(johannes.stages.filter((s) => /wie eine Taube/.test(s.text.join(' '))).map((s) => s.id)).toEqual([6, 8])
    expect(johannes.stages.filter((s) => /Lamm/.test(s.text.join(' '))).map((s) => s.id)).toEqual([8])
    expect(johannes.stages.filter((s) => /Gabriel/.test(s.text.join(' '))).map((s) => s.id)).toEqual([2])
    expect(t(4)).toContain('Alle Täler sollen voll werden, alle Berge und Hügel niedriger.')
  })

  it('no question or answer uses a forbidden word; two questions after a game (stages 2, 3, 5, 6, 8), three in the five stages without one, three answers each, the right one first; the exam has six', () => {
    for (const s of johannes.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    for (const q of johannes.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
    for (const s of johannes.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    for (const n of [1, 4, 7, 9, 10]) expect(stage(n).task.kind).toBe('quiz')
    for (const q of [...johannes.stages.flatMap((s) => s.questions), ...johannes.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(johannes.stages.flatMap((s) => s.questions)).toHaveLength(25)
    expect(johannes.exam).toHaveLength(6)
    const asked = johannes.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'seiner', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'er', 'es', 'wer', 'wo', 'was', 'wann', 'seine', 'noch', 'soll', 'hat', 'unser', 'einmal', 'um'])
    for (const s of johannes.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the changes of the check of the Bible (24.11.2026) are in: stage 1 reference, stage 2 "Dienstzeit", stage 5 "was er falsch gemacht hat", stage 6 the tax collectors question, stage 7 question 3, stage 9 "es wird getauft"', () => {
    expect(stage(1).ref).toBe('Lukas 1,5–16')
    expect(stage(2).text.join(' ')).toContain('Als seine Dienstzeit zu Ende ist, geht er heim. Danach erwartet Elisabeth ein Kind')
    expect(stage(4).text.join(' ')).toContain('was er falsch gemacht hat')
    expect(stage(5).questions[0]!.q).toBe('Wer kommt außer den Leuten auch zu Johannes und fragt?')
    expect(stage(5).questions[0]!.options[0]).toBe('die Zöllner')
    expect(stage(7).questions[2]!.q).toBe('Wessen Schuhriemen ist Johannes nicht wert zu lösen?')
    expect(stage(9).text.join(' ')).toContain('und bleibt dort, und es wird getauft')
  })
})

describe('Johannes: the games', () => {
  it('the order of the games: two known ones (lueckenvers, ausmalen) apart, three new ones (gebaerde, abgeben, zeigen), the stages 1, 3, 5, 7 and the serious 10 only questions; no game twice in a row', () => {
    const kinds = johannes.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['quiz', 'gebaerde', 'lueckenvers', 'quiz', 'abgeben', 'ausmalen', 'quiz', 'zeigen', 'quiz', 'quiz'])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] === 'quiz' && i !== 9) expect(kinds[i - 1], `two stages with questions only in a row at ${i + 1}`).not.toBe('quiz') // stages 9 and 10 (both only questions) are the one pair, by Anton's wish
    expect(kinds.indexOf('ausmalen') - kinds.indexOf('lueckenvers')).toBeGreaterThan(1)
    expect(stage(10).task.hint).toBe('Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.')
    for (const n of [1, 4, 7, 9]) expect(stage(n).task.hint).toBe('Höre gut zu und beantworte die Fragen.')
    expect(stage(2).task.hint).toBe('Zacharias kann nicht reden. Zeige dem Volk mit den Händen, was er sagen will.')
    expect(stage(5).task.hint).toBe('Wer zwei hat, gibt einen ab. Reiche weiter, bis jeder einen hat.')
    expect(stage(8).task.hint).toBe('Johannes zeigt auf einen Mann. Tippe den Mann an, auf den er zeigt.')
    expect(stage(6).task.hint).toBe('Male die Taufe Jesu im Jordan aus.')
    expect(stage(3).task.hint).toBe('Setze das fehlende Wort in den Vers.')
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(gestureProblems(task(2).gestures!)).toEqual([])
    expect(giveAwayProblems(task(5).giveAway!)).toEqual([])
    expect(pointProblems(task(8).pointing!)).toEqual([])
  })

  it('2 show them: the right postures are "he saw something" and "he cannot speak"; the words of the feedback name no angel, no Gabriel, no John, no son (they say only that the people understand)', () => {
    const g = task(2).gestures!
    expect(g.rounds.map((r) => r.right)).toEqual(['sehen', 'mund'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 3])
    expect(g.poses.map((p) => p.label)).toEqual(['Hand über den Augen, Blick nach oben', 'Hand auf dem Mund', 'Hand auf dem Bauch', 'Kopf auf den gefalteten Händen'])
    for (const k of ['signTalkRight', 'signTalkWrong'] as const) expect(JOHANNES_WORDS.de[k]).not.toMatch(/Engel|Gabriel|Johannes|Sohn/)
    expect(g.background).toBe('images/abenteuer/spiele/johannes/gebaerde/vorhof.webp')
    expect(stage(2).text.join(' ')).toContain('Er winkt ihnen zu. Sie merken, dass er im Tempel etwas gesehen hat.')
    expect(stage(2).questions.map((q) => q.q).join(' ')).not.toMatch(/winkt|gesehen|sprechen|reden/)
  })

  it('4 missing word (the memory verse, Luke 1,80a): the verse is word for word Luther 1912; its words stand (as a stem) in the story; the questions do not ask for it', () => {
    const v = task(3).verse!
    const text = stage(3).text.join(' ')
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(s).toBe(LUTHER_1_80A)
      for (const a of r.answers) expect(text).toContain(r.words[a]!.slice(0, 5))
    }
    expect(text).toContain('Das Kindlein wächst und wird stark im Geist.')
    expect(v.background).toBe('images/abenteuer/spiele/johannes/hintergrund/vers-hintergrund.webp')
    expect(stage(3).questions.map((q) => q.q).join(' ')).not.toMatch(/stark|wuchs|wächst|Geist|Kindlein/)
      })

  it('6 whoever has two gives one away: five people, coats then bread; the shortest ways are 2 and 4 moves; the words of the feedback say nothing of sin, tax collectors or soldiers', () => {
    const g = task(5).giveAway!
    expect(g.persons).toHaveLength(5)
    expect(g.rounds.map((r) => r.start)).toEqual([[2, 1, 0, 1], [0, 0, 4, 0, 1]])
    expect(g.rounds.map((r) => r.item)).toEqual(['rock', 'brot'])
    expect(g.rounds.map((r) => giveSolve(r.start)!.length)).toEqual([2, 4])
    for (const [k, v] of Object.entries(JOHANNES_WORDS.de)) if (k.startsWith('shareOne') && !k.endsWith('Done')) expect(v, k).not.toMatch(/Sünde|Zöllner|Soldat/)
    expect(stage(5).text.join(' ')).toContain('Wer zwei Röcke hat, soll einen davon dem geben, der keinen hat.')
    expect(stage(5).questions.map((q) => q.q).join(' ')).not.toMatch(/Röcke|Rock|zwei/)
  })

  it('8 where does John point: Jesus is the man on the line in both rounds; no man carries an animal; the disciples only in round 2; no dove, no lamb in the data', () => {
    const g = task(8).pointing!
    expect(g.rounds.map((r) => r.men.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.right)).toEqual(['jesus', 'jesus'])
    expect(g.rounds.map((r) => !!r.disciples)).toEqual([false, true])
    expect(JSON.stringify(g)).not.toMatch(/taube|lamm|dove|lamb|schaf/i)
    expect(JSON.stringify(g)).not.toMatch(/Heiligenschein|Soldat|Schwert|Waffe/i)
    expect(stage(8).text.join(' ')).toContain('Siehe, das ist Gottes Lamm')
    expect(g.background).toBe('images/abenteuer/spiele/johannes/zeigen/ufer-weit.webp')
  })

  it('6 colouring (known): the baptism of Jesus (a line picture for ten-year-olds, one dove); the line picture lies in the folder of the game; the zones and the pool of tasks once they are measured', () => {
    expect(stage(6).task.kind).toBe('ausmalen')
    expect(task(6).image).toBe('images/abenteuer/spiele/johannes/ausmalen/etappe-06.webp')
    const t9 = stage(6).task
    if (t9.zones) {
      expect(Object.keys(t9.zones).length).toBeGreaterThanOrEqual(5)
      for (const z of Object.values(t9.zones)) for (const [x, y] of z.seeds) expect(x >= 0 && x <= 100 && y >= 0 && y <= 100).toBe(true)
      expect(t9.jobCount).toBe(3)
      expect((t9.jobs ?? []).length).toBeGreaterThanOrEqual(6)
      for (const j of t9.jobs ?? []) {
        expect(t9.zones?.[j.zone], j.zone).toBeDefined()
        expect(!!(j.tool || j.color), j.hint).toBe(true)
      }
      expect(new Set((t9.jobs ?? []).map((j) => j.zone)).size).toBeGreaterThanOrEqual(5)
    }
  })

  it('the stage pictures: variant a (newer versions carry an ending, a new name for the cache of the phones); the medal, the gift and the map pieces lie in the folder of the adventure', () => {
    expect(johannes.stages.every((s) => /^images\/abenteuer\/johannes\/etappe-bild-\d\d(-v\d+|-n|-m)?\.webp$/.test(s.image!))).toBe(true)
    expect(johannes.gift.title).toBe('Johannes ruft am Jordan')
    expect(johannes.gift.image).toMatch(/^images\/abenteuer\/johannes\/geschenk(-[a-z0-9]+)?\.webp$/)
    expect(johannes.map.images.map((f) => f.replace(/-v\d-/, '-vN-'))).toEqual([1, 2, 3].map((n) => `images/abenteuer/johannes/karte-pano-vN-${n}.webp`))
    expect(johannes.medal).toMatch(/^images\/abenteuer\/(johannes\/medaille-v\d+|ui\/medaille-josef)\.webp$/)
  })
})

describe('Johannes: map, files, English', () => {
  it('ten stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = johannes.map
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
    expect(JOHANNES_PATH).toHaveLength(10)
    for (const seg of JOHANNES_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    for (const seg of JOHANNES_PATH) for (const [, y] of seg) expect(y * H, 'no bead in the lowest fifth').toBeLessThanOrEqual(H * 0.8)
    expect(m.path).toBe(JOHANNES_PATH)
    if (PANORAMA_IN) for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the way and the medal are placeholders only as long as their pictures are missing (the files say so)', () => {
    const path = readFileSync('src/data/adventures/johannesPath.ts', 'utf8')
    if (PANORAMA_IN) expect(path, 'the real way of the panorama v3 must replace the transition way').not.toMatch(/PLATZHALTER|UEBERGANG/)
    const data = readFileSync('src/data/adventures/johannes.ts', 'utf8')
    if (existsSync(`public/${johannes.medal}`) && johannes.medal.includes('/johannes/')) expect(data).not.toMatch(/PLATZHALTER: die Josef-Medaille/)
    else expect(data).toMatch(/medal: 'images\/abenteuer\/ui\/medaille-josef\.webp', \/\/ PLATZHALTER/)
    if (PICTURES_IN) expect(data).toMatch(/const G = 'images\/abenteuer\/spiele\/johannes\/'/)
  })

  it('the download size is entered; music of its own only when its files are in', () => {
    expect(johannes.downloadMb).toBeGreaterThan(0)
    for (const f of johannes.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
    for (const s of johannes.stages) if (s.music) expect(johannes.music).toContain(s.music)
  })

  it('the music and the recordings (Neuplanung 24.11.2026, 10 stages): three pieces, stages 1-3 temple, 4-8 voice, 9-10 Aenon; the recordings of the geltend.json (stage 3 new, stages 4-10 under new names v30); no file of an older numbering is played', () => {
    expect(johannes.stages.map((s) => s.audio)).toEqual(
      [2, 3, 5, 30, 30, 30, 30, 30, 30, 30].map((v, i) => `audio/abenteuer/johannes/geschichte-${String(i + 1).padStart(2, '0')}-v${v}.mp3`)
    )
    // files of the older numberings (10 stages as first built, then 11 stages) must never be played for the stages 3 to 10
    const OLD = [
      'geschichte-03-v3.mp3', 'geschichte-04-v4.mp3', 'geschichte-05-v3.mp3', 'geschichte-06-v2.mp3', 'geschichte-07-v2.mp3', 'geschichte-08-v2.mp3', 'geschichte-09-v2.mp3', 'geschichte-10-v3.mp3',
      'geschichte-07-v5.mp3', 'geschichte-08-v20.mp3', 'geschichte-09-v20.mp3', 'geschichte-10-v20.mp3', 'geschichte-11-v20.mp3'
    ]
    for (const s of johannes.stages) if (s.audio) for (const o of OLD) expect(s.audio, `stage ${s.id}`).not.toContain(o)
    setAdventureLanguage('en')
    const en = englishTextsOf(johannes) as { stages: { audio?: string }[] }
    expect(en.stages.map((s) => s.audio)).toEqual(
      [4, 2, 6, 30, 30, 30, 30, 30, 30, 30].map((v, i) => `audio/abenteuer/johannes/geschichte-${String(i + 1).padStart(2, '0')}-en-v${v}.mp3`)
    )
    setAdventureLanguage('de')
    expect(johannes.music).toEqual(['tempel', 'stimme', 'aenon'].map((n) => `audio/abenteuer/johannes/musik-${n}-v1.mp3`))
    expect(johannes.stages.map((s) => s.music?.match(/musik-(\w+)-/)?.[1])).toEqual(['tempel', 'tempel', 'tempel', 'stimme', 'stimme', 'stimme', 'stimme', 'stimme', 'aenon', 'aenon'])
  })

  it('a story is read from a recording only when the recording file exists (the German and the English one)', () => {
    for (const s of johannes.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/johannes/geschichte-${String(s.id).padStart(2, '0')}-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
    setAdventureLanguage('en')
    for (const s of johannes.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/johannes/geschichte-${String(s.id).padStart(2, '0')}-en-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(johannes).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f))
    expect(wanted.filter((f) => !existsSync(`public/${f}`))).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/johannes/etappe-bild-01'))).toBe(true)
    for (const d of ['gebaerde', 'abgeben', 'zeigen', 'ausmalen', 'hintergrund', 'lueckenvers']) expect(files.some((f) => f.startsWith(`images/abenteuer/spiele/johannes/${d}/`)), d).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(johannes)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(johannes) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('John the Baptist')
    expect(en.stages).toHaveLength(10)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The Angel in the Temple')
    expect(stage(10).text[3]).toBe('Later John died, and his disciples came, buried him and told Jesus.')
    expect(johannes.gift.title).toBe('John Calls by the Jordan')
    expect(task(2).gestures!.poses[0]!.label).toBe('Hand over the eyes, looking up')
    expect(task(2).gestures!.rounds[1]!.hint).toBe('Show the people: You cannot speak.')
    expect(task(3).verse!.rounds[0]!.words[0]).toBe('strong')
    expect(task(3).verse!.rounds[1]!.parts[0]).toBe('And the ')
    expect(task(5).giveAway!.rounds[0]!.hint).toBe('Whoever has two coats gives one to his neighbor. Soon everyone has one.')
    expect(task(5).giveAway!.persons[4]!.label).toBe('a boy of about twelve')
    expect(task(8).pointing!.rounds[0]!.men[1]!.label).toBe('a fisherman with a net on his shoulder')
    expect(task(8).pointing!.rounds[1]!.hint).toBe('The day after: Whom does John point at now?')
    expect(stage(10).task.hint).toBe('This stage is serious. Listen well and answer the questions.')
    expect(stage(8).task.hint).toBe('John points at a man. Tap the man he points at.')
    setAdventureLanguage('de')
    expect(task(2).gestures!.poses[0]!.label).toBe('Hand über den Augen, Blick nach oben')
  })

  it('the English texts stay quiet: no blood, no sword, no head, no feast, no Herodias', () => {
    const en = englishTextsOf(johannes) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|bloody|hell|devil|sword|corpse|knife|murder\w*|wounds?|weapons?|head|beheaded|feast|dance\w*|Herodias|chains?|fetters)\b/i)
    })
  })
})
