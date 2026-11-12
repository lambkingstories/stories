/**
 * The data of "Die Bergpredigt" (`bergpredigt.ts`, `en/bergpredigt.en.ts`, `bergpredigtPath.ts`), adventure id `bergpredigt` (Matthew 4,25 to 7,29 without the house on the rock, Matthew 7,24-27, which is
 * told in "Geschichten von Jesus", stage 11): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Bergpredigt/ENTWURF_Bergpredigt.md`, Luther 1912 told for
 * children), three new and two known games with playable data (every `*Problems` check is empty), the question rule (two after a game, three in the four stages without one, six in the exam), the map has
 * nine stations and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted the test does not ask for the picture files; it asks for them as soon as the pictures are built in (the last picture of the building-in script,
 * `spiele/bergpredigt/nahblick/dunst.webp`, lies in `public/`). The map pieces are asked for as soon as the panorama is in. Recordings and music only when they exist.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { bergpredigt } from '@/data/adventures/bergpredigt'
import { BERGPREDIGT_PATH } from '@/data/adventures/bergpredigtPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { blessedProblems, lightSolvers, lightStandProblems, nearViewProblems, nearVisible } from '@/utils/bergpredigtNeu'
import type { BlessedGame, LightStandGame, NearViewGame } from '@/utils/bergpredigtNeu'
import type { VerseGame } from '@/types/adventure'
import { BERGPREDIGT_WORDS } from './bergpredigtNeuI18n'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => bergpredigt.stages[n - 1]!
/** The fields of the new games (`TaskKind`/`GameTask` are wired by the lead; until then they are read like this). */
type NewTask = { blessed?: BlessedGame; lightStand?: LightStandGame; nearView?: NearViewGame; verse?: VerseGame; image?: string }
const task = (n: number) => stage(n).task as unknown as NewTask
/** Words that no German text, question or answer may use: nothing gruesome, no cross, no wounds, no weapons (the snake of stage 8 and the oven of stage 7 are words of Jesus and stand only there). */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Blut|blutig|Kreuz|Kreuze|Kreuzigung|Schwert|Messer|Mörder|Steine|Wunden|Waffen|Heiligenschein|töten|getötet|umbringen)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/bergpredigt/nahblick/dunst.webp')
const PANORAMA_IN = existsSync('public/images/abenteuer/bergpredigt/karte-pano-v6-1.webp')
const LUTHER_77 = 'Bittet, so wird euch gegeben; suchet, so werdet ihr finden; klopfet an, so wird euch aufgetan.'

describe('Die Bergpredigt: stories and questions', () => {
  it('nine stages with 4 to 6 paragraphs (at most 62 words each) of 100 to 150 words in all and the Bible passage under every one', () => {
    expect(bergpredigt.id).toBe('bergpredigt')
    expect(bergpredigt.title).toBe('Die Bergpredigt')
    expect(bergpredigt.subtitle).toBe('Von den Seligpreisungen bis zur goldenen Regel')
    expect(bergpredigt.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of bergpredigt.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Matthäus \d+,\d+/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(4)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(6)
      for (const p of s.text) expect(p.split(/\s+/).length, `a paragraph of stage ${s.id}`).toBeLessThanOrEqual(62)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(100)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(150)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/bergpredigt/etappe-bild-${String(s.id).padStart(2, '0')}(-b|-v2)?\\.webp$`))
    }
    expect(bergpredigt.stages.map((s) => s.ref)).toEqual([
      'Matthäus 4,25 bis 5,2', 'Matthäus 5,3–6', 'Matthäus 5,7–12', 'Matthäus 5,13–16', 'Matthäus 6,6 und 6,8–13',
      'Matthäus 6,25–26', 'Matthäus 6,28–30 und 6,34', 'Matthäus 7,7–11', 'Matthäus 7,12 und 7,28 bis 8,1'
    ])
  })

  it('no text, question or answer uses a forbidden word; the snake is a word of Jesus in stage 8 only, the oven in stage 7 only; nothing of the house on the rock', () => {
    for (const s of bergpredigt.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    for (const q of bergpredigt.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
    const where = (re: RegExp) => bergpredigt.stages.filter((s) => re.test(s.text.join(' '))).map((s) => s.id)
    expect(where(/\bSchlange\b/)).toEqual([8])
    expect(where(/\bOfen\b/)).toEqual([7])
    expect(where(/\bFels\b|Felsen\b|\bHaus auf\b|\bSand\b|\bRegen\b/)).toEqual([])
    // the persecution is told as a word of Jesus, in stage 3 only
    expect(where(/verfolgt/)).toEqual([3])
    for (const s of bergpredigt.stages) expect(s.questions.map((q) => q.q).join(' '), `stage ${s.id}`).not.toMatch(/Schlange|verfolgt/)
  })

  it('two questions after a game (stages 2, 4, 6, 7, 8), three in the four stages without one (only questions), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of bergpredigt.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    for (const n of [1, 3, 5, 9]) expect(stage(n).task.kind).toBe('quiz')
    for (const q of [...bergpredigt.stages.flatMap((s) => s.questions), ...bergpredigt.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(bergpredigt.stages.flatMap((s) => s.questions)).toHaveLength(22)
    expect(bergpredigt.exam).toHaveLength(6)
    const asked = bergpredigt.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(bergpredigt.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'etwa', 'er', 'es', 'damit', 'wer', 'wo', 'was', 'wann', 'seine', 'ihnen', 'ihren', 'euer', 'ganz'])
    for (const s of bergpredigt.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        // stage 9, question 1 paraphrases the golden rule ("was ihr wollt" -> "was sie sich selbst wünschen"): the same sense in other words, checked by eye
        const paraphrase = s.id === 9 && q.options[0] === 'was sie sich selbst von ihnen wünschen' && text.includes('was ihr wollt')
        const hit = paraphrase || words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the key words of the Bible are there (Luther 1912, told for children)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/steigt er auf einen Berg/)
    expect(t(1)).toMatch(/Jünger/)
    expect(t(2)).toMatch(/Selig sind, die arm sind vor Gott/)
    expect(t(2)).toMatch(/Denn das Himmelreich gehört ihnen/)
    expect(t(2)).toMatch(/Selig sind die Sanftmütigen/)
    expect(t(2)).toMatch(/Hunger und Durst/)
    expect(t(3)).toMatch(/Selig sind die Barmherzigen/)
    expect(t(3)).toMatch(/Gottes Kinder heißen/)
    expect(t(3)).toMatch(/Seid fröhlich und getrost/)
    expect(t(4)).toMatch(/Ihr seid das Salz der Erde/)
    expect(t(4)).toMatch(/Ihr seid das Licht der Welt/)
    expect(t(4)).toMatch(/Leuchter/)
    expect(t(4)).toMatch(/euren Vater im Himmel/)
    expect(t(5)).toMatch(/Unser Vater in dem Himmel! Dein Name werde geheiligt/)
    expect(t(5)).toMatch(/Unser täglich Brot gib uns heute/)
    expect(t(5)).toMatch(/in Ewigkeit\. Amen/)
    expect(t(6)).toMatch(/Sorgt euch nicht um euer Leben/)
    expect(t(6)).toMatch(/Sie säen nicht, sie ernten nicht/)
    expect(t(7)).toMatch(/Schaut die Lilien auf dem Feld/)
    expect(t(7)).toMatch(/Salomo in all seiner Pracht/)
    expect(t(8)).toContain(LUTHER_77)
    expect(t(8)).toMatch(/einen Stein/)
    expect(t(8)).toMatch(/Wie viel mehr wird euer Vater im Himmel Gutes geben/)
    expect(t(9)).toMatch(/Alles nun, was ihr wollt, dass euch die Leute tun sollen, das tut ihr ihnen auch/)
    expect(t(9)).toMatch(/Schriftgelehrten/)
  })

  it('the changes of the second check (12.11.2026) are in: stage 9, paragraph 3; stage 4, question 2; stage 5, question 1', () => {
    expect(stage(9).text[2]).toMatch(/^Jesus spricht noch weiter\. Dann hat er seine Rede vollendet\. Es bleibt lange still\./)
    expect(stage(4).questions[1]!.options[0]).toBe('den Vater im Himmel')
    expect(stage(5).questions[0]!.q).toBe('Wohin soll man gehen, wenn man ganz für sich zu seinem Vater beten will?')
  })

  it('the exam asks across the whole adventure', () => {
    const q = bergpredigt.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/Berg/)
    expect(q).toMatch(/Gottes Kinder/)
    expect(q).toMatch(/Stadt/)
    expect(q).toMatch(/Salomo/)
    expect(q).toMatch(/ersten Lichter/)
  })
})

describe('Die Bergpredigt: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (ausmalen, lueckenvers) apart, three new ones (selig, scheffel, nahblick), the four others only questions; no game twice in a row', () => {
    const kinds = bergpredigt.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['quiz', 'selig', 'quiz', 'scheffel', 'quiz', 'ausmalen', 'nahblick', 'lueckenvers', 'quiz'])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    expect(kinds.filter((k) => k === 'ausmalen' || k === 'lueckenvers')).toHaveLength(2)
    expect(kinds.filter((k) => k === 'selig' || k === 'scheffel' || k === 'nahblick')).toHaveLength(3)
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(blessedProblems(task(2).blessed!)).toEqual([])
    expect(lightStandProblems(task(4).lightStand!)).toEqual([])
    expect(nearViewProblems(task(7).nearView!)).toEqual([])
  })

  it('2 whom is the word for?: the four sentences are those of the story, in its order; four listeners; six gifts, two of them for nobody; the pictures lie in their folder', () => {
    const g = task(2).blessed!
    const text = stage(2).text.join(' ')
    expect(g.sentences).toHaveLength(4)
    expect(g.sentences.map((s) => s.personId)).toEqual(['mann-leer', 'frau-traenen', 'hirte', 'junger-mann'])
    let at = -1
    for (const s of g.sentences) {
      const [a, b] = s.text.split('. Denn ')
      expect(text, s.text).toContain(a!)
      expect(text, s.text).toContain('Denn ' + b!)
      const next = text.indexOf(a!)
      expect(next, 'in the order of the story').toBeGreaterThan(at)
      at = next
    }
    expect(g.sentences[0]!.text).toContain('Himmelreich')
    expect(g.sentences[1]!.text).toContain('getröstet')
    expect(g.sentences[2]!.text).toContain('Land')
    expect(g.sentences[3]!.text).toContain('satt werden')
    expect(g.gifts.filter((x) => !x.forPerson).map((x) => x.id)).toEqual(['ablenker-truhe', 'ablenker-mantel'])
    expect(g.rounds.map((r) => r.mode)).toEqual(['sentence', 'free'])
    for (const p of g.people) expect(p.image).toMatch(/^images\/abenteuer\/spiele\/bergpredigt\/selig\/[a-z-]+\.webp$/)
    expect(g.background).toBe('images/abenteuer/spiele/bergpredigt/selig/wiese.webp')
    expect(stage(2).task.hint).toBe('Gib jedem Zuhörer, was Jesus ihm zusagt.')
    // the feedback of a wrong gift does not say that the word "means" another person (second check, note 5)
    for (const lang of ['de', 'en', 'es'] as const) expect(BERGPREDIGT_WORDS[lang].beatitudeWrong).not.toMatch(/meint|means|significa/)
    expect(BERGPREDIGT_WORDS.de.beatitudeWrong).toBe('Dieses Wort passt zu einem anderen.')
    // the questions of stage 2 ask about the picture of the story, not about the pairs of the game
    expect(stage(2).questions.map((q) => q.q).join(' ')).not.toMatch(/Himmelreich|getröstet|Land besitzen/)
  })

  it('4 where does the light belong?: two rooms (two and five people), only the lampstand reaches everybody, the basket lies over the lamp in room 1; the hint is that of the story', () => {
    const g = task(4).lightStand!
    expect(g.rooms.map((r) => r.people.length)).toEqual([2, 5])
    expect(g.rooms.map((r) => lightSolvers(g, r))).toEqual([['leuchter'], ['leuchter']])
    expect(g.rooms[0]!.basket).toBeDefined()
    expect(g.rooms[1]!.basket).toBeUndefined()
    expect(g.rooms[0]!.bright).toBe('images/abenteuer/spiele/bergpredigt/scheffel/stube-klein-hell.webp')
    expect(g.rooms[1]!.dark).toBe('images/abenteuer/spiele/bergpredigt/scheffel/stube-gross-dunkel.webp')
    expect(g.stand.image).toBe('images/abenteuer/spiele/bergpredigt/scheffel/leuchter.webp')
    expect(stage(4).task.hint).toBe('Befreie die Lampe und stelle sie dorthin, wo alle im Haus ihr Licht sehen.')
    expect(stage(4).text.join(' ')).toMatch(/stülpt einen Korb darüber/)
  })

  it('6 colouring (known): the birds under the sky; the line picture lies in the folder of the game', () => {
    expect(stage(6).task.kind).toBe('ausmalen')
    expect(stage(6).task.hint).toBe('Male die Vögel unter dem Himmel aus.')
    expect(task(6).image).toBe('images/abenteuer/spiele/bergpredigt/ausmalen/etappe-06.webp')
  })

  it('7 look closely: seven blossoms, round 1 with three to be seen and two guests, round 2 with four guests and three empty blossoms; a wreath of olive twigs, no lens', () => {
    const g = task(7).nearView!
    expect(g.blooms).toHaveLength(7)
    expect(g.rounds.map((r) => r.sits.length)).toEqual([2, 4])
    expect(g.rounds.map((r) => nearVisible(r).length)).toEqual([3, 7])
    expect(g.guests.map((x) => x.id)).toEqual(['biene', 'marienkaefer', 'schmetterling', 'grille'])
    expect(g.wreath.minCover).toBe(0.5)
    expect(g.wreath.image).toBe('images/abenteuer/spiele/bergpredigt/nahblick/kranz.webp')
    expect(JSON.stringify(g)).not.toMatch(/lupe|glas|lens|magnif/i)
    expect(BERGPREDIGT_WORDS.de.wreathLookField).not.toMatch(/Lupe/)
    expect(stage(7).task.hint).toBe('Schau durch den Zweigkranz genau hin und finde, wer in den Blumen sitzt.')
    expect(stage(7).text.join(' ')).toMatch(/Biene/)
  })

  it('8 missing word (the memory verse, Matthew 7,7): the verse is word for word Luther 1912; the gaps are words of the story; the questions do not ask for the words of the verse', () => {
    const v = task(8).verse!
    const text = stage(8).text.join(' ')
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    expect(v.rounds.map((r) => r.words.length)).toEqual([3, 4])
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(LUTHER_77.toLowerCase()).toContain(s.replace(/\.$/, '').toLowerCase())
      for (const a of r.answers) expect(text).toContain(r.words[a]!)
    }
    expect(v.rounds[0]!.words[0]).toBe('gegeben')
    expect(v.rounds[1]!.words.slice(0, 2)).toEqual(['finden', 'aufgetan'])
    expect(v.background).toBe('images/abenteuer/spiele/bergpredigt/hintergrund/vers-hintergrund.webp')
    expect(stage(8).questions.map((q) => q.q).join(' ')).not.toMatch(/gegeben|aufgetan|finden/)
    expect(stage(8).task.hint).toBe('Setze das fehlende Wort in den Vers.')
  })
})

describe('Die Bergpredigt: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = bergpredigt.map
    const W = m.widthPx
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / W, 3)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * W, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(BERGPREDIGT_PATH).toHaveLength(9)
    for (const seg of BERGPREDIGT_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    for (const seg of BERGPREDIGT_PATH) for (const [, y] of seg) expect(y * 1648, 'no bead in the lowest fifth').toBeLessThanOrEqual(1318)
    expect(m.path).toBe(BERGPREDIGT_PATH)
    expect(m.aspect).toBeCloseTo(W / 1648, 6)
    expect(m.images.map((f) => f.replace(/\d+\.webp$/, ''))).toEqual(m.images.map(() => 'images/abenteuer/bergpredigt/karte-pano-v6-'))
    if (PANORAMA_IN) for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the way is a placeholder only as long as the panorama is missing (the file says so)', () => {
    const src = readFileSync('src/data/adventures/bergpredigtPath.ts', 'utf8')
    if (PANORAMA_IN) expect(src, 'the real way of the panorama must replace the placeholder').not.toMatch(/PLATZHALTER/)
  })

  it('the medal and the gift lie in the folder of the adventure; music of its own only when its files are in', () => {
    expect(bergpredigt.medal).toMatch(/^images\/abenteuer\/bergpredigt\/medaille-v\d\.webp$/)
    expect(bergpredigt.gift.image).toBe('images/abenteuer/bergpredigt/geschenk.webp')
    expect(bergpredigt.gift.title).toBe('Lilien auf dem Feld')
    expect(bergpredigt.downloadMb).toBe(13) // measured: all files of the journey are 12.50 MB
    for (const f of bergpredigt.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
    for (const s of bergpredigt.stages) if (s.music) expect(bergpredigt.music).toContain(s.music)
  })

  it('a story is read from a recording only when the recording file exists (the German and the English one)', () => {
    for (const s of bergpredigt.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/bergpredigt/geschichte-0${s.id}-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
    setAdventureLanguage('en')
    for (const s of bergpredigt.stages) {
      if (s.audio) expect(s.audio).toMatch(new RegExp(`^audio/abenteuer/bergpredigt/geschichte-0${s.id}-en-v\\d+\\.mp3$`))
      if (s.audio) expect(existsSync(`public/${s.audio}`), s.audio).toBe(true)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(bergpredigt).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f))
    expect(wanted.filter((f) => !existsSync(`public/${f}`))).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/bergpredigt/etappe-bild-01'))).toBe(true)
    for (const d of ['selig', 'scheffel', 'nahblick', 'ausmalen', 'hintergrund', 'lueckenvers']) expect(files.some((f) => f.startsWith(`images/abenteuer/spiele/bergpredigt/${d}/`)), d).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(bergpredigt)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(bergpredigt) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string; subtitle: string }
    expect(en.title).toBe('The Sermon on the Mount')
    expect(en.subtitle).toBe('From the Beatitudes to the Golden Rule')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Up the Mountain')
    expect(stage(3).title).toBe('Rejoice and Be Glad')
    expect(bergpredigt.gift.title).toBe('Lilies of the Field')
    expect(task(2).blessed!.people[0]!.label).toBe('the man with empty hands')
    expect(task(2).blessed!.sentences[1]!.text).toBe('Blessed are they that mourn, for they shall be comforted.')
    expect(task(2).blessed!.rounds[1]!.hint).toBe('Who gets which gift? Two gifts are left over.')
    expect(task(4).lightStand!.rooms[1]!.people[0]!.label).toBe('The grandfather')
    expect(task(7).nearView!.guests[0]!.label).toBe('A bee')
    expect(task(8).verse!.rounds[0]!.words[0]).toBe('given')
    expect(task(8).verse!.rounds[1]!.parts[0]).toBe('Seek, and ye shall ')
    // the changes of the second check
    expect(stage(3).questions[2]!.options[0]).toBe('glad and joyful')
    expect(stage(9).text[1]).toBe('“So whatever you want people to do for you, do the same for them,” says Jesus.')
    expect(stage(9).text[2]).toMatch(/^Jesus goes on speaking\. Then he has finished his speech\. It stays quiet for a long time\./)
    setAdventureLanguage('de')
    expect(task(2).blessed!.people[0]!.label).toBe('der Mann mit den leeren Händen')
    expect(task(4).lightStand!.rooms[1]!.people[0]!.label).toBe('Der Großvater')
  })

  it('the English texts stay quiet: no blood, no cross, no devil, no sword, no wound; the snake only in stage 8', () => {
    const en = englishTextsOf(bergpredigt) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|bloody|hell|devil|crosses|the cross|a cross|crucif\w*|sword|corpse|knife|murder\w*|wounds?|weapons?|stones)\b/i)
      expect(/\bsnake\b/i.test(e.text.join(' ')), `stage ${i + 1}`).toBe(i === 7)
    })
  })
})
