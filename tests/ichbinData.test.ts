/**
 * The data of "Jesus erzählt von sich" (`ichbin.ts`, `en/ichbin.en.ts`, `ichbinPath.ts`), adventure id `ichbin` (John 3, 4 and 10, Matthew 16,13-20 and 17,1-13): the stories and questions follow the rules
 * of the adventures (texts of the draft `D:/Claude/Abenteuer-IchBin/ENTWURF_IchBin.md`, Luther 1912 told for children, no verse left out), two known and two new games with playable data (every `*Problems`
 * check is empty), the question rule (two after a game, three in the ten stages without one, six in the exam), the map has fourteen stations and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted the test does not ask for the picture files; it asks for them as soon as the pictures are built in (the last picture of the building-in script,
 * `spiele/ichbin/hirtenruf/ring.webp`, lies in `public/`). The map pieces are asked for as soon as the panorama is in. Recordings and music only when they exist.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { ichbin } from '@/data/adventures/ichbin'
import { ICHBIN_PATH } from '@/data/adventures/ichbinPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { breezeAnswer, breezeProblems, herdCallProblems } from '@/utils/ichbinNeu'
import type { BreezeGame, HerdCallGame } from '@/utils/ichbinNeu'
import { tellProblems } from '@/utils/weihnachtenNeu'
import type { TellGame } from '@/utils/weihnachtenNeu'
import type { VerseGame } from '@/types/adventure'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => ichbin.stages[n - 1]!
/** The fields of the new games (`TaskKind`/`GameTask` are wired by the lead; until then they are read like this). */
type NewTask = { breeze?: BreezeGame; herdCall?: HerdCallGame; tell?: TellGame & { texts?: Record<string, string> }; verse?: VerseGame }
const task = (n: number) => stage(n).task as unknown as NewTask
/**
 * Words that no German text, question or answer may use. The wolf (Joh 10,12), the thief and the robber (Joh 10,1.8.10) stand in the text, because the Bible says them, and are never in a picture;
 * nothing gruesome, no "Mörder" (the text says "Räuber"), no stones, no cross, no wounds.
 */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Blut|blutig|Kreuz|Kreuze|Kreuzigung|Schwert|Messer|Mörder|Steine|Wunden|Waffen|Heiligenschein|töten|getötet|umbringen)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/ichbin/hirtenruf/ring.webp')
const PANORAMA_IN = existsSync('public/images/abenteuer/ichbin/karte-pano-v1-1.webp')
const LUTHER_316 = 'Also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.'

describe('Jesus erzählt von sich: stories and questions', () => {
  it('fourteen stages with 4 to 8 paragraphs (at most 62 words each) of 100 to 180 words in all and the Bible passage under every one', () => {
    expect(ichbin.id).toBe('ichbin')
    expect(ichbin.age).toBe('8-10')
    expect(ichbin.title).toBe('Jesus erzählt von sich')
    expect(ichbin.subtitle).toBe('Was Jesus über sich sagt')
    expect(ichbin.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    for (const s of ichbin.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Johannes|Matthäus) \d+,\d+/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(4)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(8)
      for (const p of s.text) expect(p.split(/\s+/).length, `a paragraph of stage ${s.id}`).toBeLessThanOrEqual(62)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(100)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(180)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/ichbin/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    expect(ichbin.stages.map((s) => s.ref)).toEqual([
      'Johannes 3,1–7', 'Johannes 3,8–15', 'Johannes 3,16–21', 'Johannes 4,1–9', 'Johannes 4,10–15', 'Johannes 4,16–24', 'Johannes 4,25–34',
      'Johannes 4,35–42', 'Matthäus 16,13–20', 'Matthäus 17,1–5', 'Matthäus 17,6–13', 'Johannes 10,1–10', 'Johannes 10,11–18', 'Johannes 10,19–30'
    ])
  })

  it('no text, question or answer uses a forbidden word; the wolf is a word of the Bible in stage 13 only', () => {
    for (const s of ichbin.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    for (const q of ichbin.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
    const wolf = ichbin.stages.filter((s) => /\bWolf\b/.test(s.text.join(' '))).map((s) => s.id)
    expect(wolf).toEqual([13])
    // the Bible says "Räuber" (Joh 10,1.8), not the harder "Mörder" of Luther
    expect(stage(12).text.join(' ')).toMatch(/Dieb und ein Räuber/)
  })

  it('two questions after a game (stages 2, 3, 7, 12), three in the ten stages without one (only questions), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of ichbin.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    for (const n of [1, 4, 5, 6, 8, 9, 10, 11, 13, 14]) expect(stage(n).task.kind).toBe('quiz')
    for (const q of [...ichbin.stages.flatMap((s) => s.questions), ...ichbin.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(ichbin.stages.flatMap((s) => s.questions)).toHaveLength(38)
    expect(ichbin.exam).toHaveLength(6)
    const asked = ichbin.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(ichbin.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'etwa', 'er', 'es', 'damit', 'wer', 'wo', 'was', 'wann'])
    for (const s of ichbin.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the key words of the Bible are there (Luther 1912, told for children; no verse left out)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Nikodemus/)
    expect(t(1)).toMatch(/von neuem geboren/)
    expect(t(1)).toMatch(/aus Wasser und Geist/)
    expect(t(2)).toMatch(/Der Wind weht, wohin er will/)
    expect(t(2)).toMatch(/Mose hat in der Wüste eine Schlange hoch aufgerichtet/)
    expect(t(3)).toMatch(/So sehr hat Gott die Welt geliebt/)
    expect(t(3)).toMatch(/einzigen Sohn/) // the verse of the game says "eingeborenen Sohn" (Luther 1912)
    expect(t(3)).toMatch(/Das Licht ist in die Welt gekommen/)
    expect(t(4)).toMatch(/Jakobs Brunnen/)
    expect(t(4)).toMatch(/Gib mir zu trinken/)
    expect(t(5)).toMatch(/ebendiges Wasser/)
    expect(t(6)).toMatch(/Fünf Männer/)
    expect(t(6)).toMatch(/im Geist und in der Wahrheit/)
    expect(t(7)).toMatch(/Ich bin es, der mit dir redet/)
    expect(t(7)).toMatch(/Krug/)
    expect(t(8)).toMatch(/Retter der Welt/)
    expect(t(9)).toMatch(/Cäsarea Philippi/)
    expect(t(9)).toMatch(/Du bist der Christus/)
    expect(t(9)).toMatch(/Totenreich/)
    expect(t(10)).toMatch(/helle Wolke/)
    expect(t(11)).toMatch(/Steht auf/)
    expect(t(12)).toMatch(/Ich bin die Tür/)
    expect(t(12)).toMatch(/mehr als genug/)
    expect(t(13)).toMatch(/Ich bin der gute Hirte/)
    expect(t(14)).toMatch(/Halle Salomos/)
    expect(t(14)).toMatch(/aus der Hand/)
  })

  it('the exam asks across the whole adventure', () => {
    const q = ichbin.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/gerettet/)
    expect(q).toMatch(/lebendiges Wasser/)
    expect(q).toMatch(/Ich bin es, der mit dir redet/)
    expect(q).toMatch(/Christus/)
    expect(q).toMatch(/aus der Hand/)
  })
})

describe('Jesus erzählt von sich: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (lueckenvers, weitersagen) apart, two new ones (wehen, hirtenruf), everything else only questions; no game twice in a row', () => {
    const kinds = ichbin.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['quiz', 'wehen', 'lueckenvers', 'quiz', 'quiz', 'quiz', 'weitersagen', 'quiz', 'quiz', 'quiz', 'quiz', 'hirtenruf', 'quiz', 'quiz'])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    const known = kinds.filter((k) => k === 'lueckenvers' || k === 'weitersagen')
    expect(known).toHaveLength(2)
    // the serious stages 9, 10 and 11 (confession, mountain, descent) have no game
    for (const n of [9, 10, 11]) expect(stage(n).task.kind).toBe('quiz')
  })

  it('the new games and the known one with its own data can be played: the checks of their logic find nothing', () => {
    expect(breezeProblems(task(2).breeze!)).toEqual([])
    expect(herdCallProblems(task(12).herdCall!)).toEqual([])
    expect(tellProblems(task(7).tell!)).toEqual([])
  })

  it('2 wind: round 1 four gusts that end right, left, left, right; round 2 five gusts with three turns and one calm; every gust has a right tablet; the tablets are big enough', () => {
    const g = task(2).breeze!
    expect(g.rounds.map((r) => r.gusts.length)).toEqual([4, 5])
    expect(g.rounds[0]!.gusts.map(breezeAnswer)).toEqual(['right', 'left', 'left', 'right'])
    expect(g.rounds[1]!.gusts.map(breezeAnswer)).toEqual(['right', 'left', 'left', 'still', 'right'])
    expect(g.rounds[1]!.gusts.filter((x) => x.turnTo).length).toBe(3)
    expect(g.rounds.map((r) => r.ask)).toEqual(['blown', 'now'])
    expect(g.things.map((t) => t.kind).sort()).toEqual(['cloth', 'flame', 'grass', 'leaf', 'twig'])
    expect(g.tabletW * 3.6).toBeGreaterThanOrEqual(56)
    expect(g.background).toBe('images/abenteuer/spiele/ichbin/wehen/hof.webp')
    expect(Object.values(g.tablets)).toEqual(['left', 'still', 'right'].map((k) => `images/abenteuer/spiele/ichbin/wehen/tafel-${{ left: 'links', still: 'still', right: 'rechts' }[k as 'left']}.webp`))
    expect(stage(2).task.hint).toBe('Du siehst den Wind nicht. Schau, was er bewegt, und tippe, wohin er weht.')
  })

  it('3 missing word (the memory verse, John 3,16): the verse is word for word Luther 1912; the story says "einzigen Sohn", the game "eingeborenen Sohn"; the gaps are words of the story', () => {
    const v = task(3).verse!
    const text = stage(3).text.join(' ')
    expect(v.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    expect(v.rounds.map((r) => r.words.length)).toEqual([3, 4])
    for (const r of v.rounds) {
      let s = r.parts[0]!
      r.answers.forEach((a, k) => (s += r.words[a]! + r.parts[k + 1]!))
      expect(LUTHER_316).toContain(s.replace(/\.$/, ''))
      for (const a of r.answers) expect(text).toContain(r.words[a]!)
    }
    expect(v.rounds[0]!.words[0]).toBe('Welt')
    expect(v.rounds[1]!.words.slice(0, 2)).toEqual(['Sohn', 'Leben'])
    expect(v.background).toBe('images/abenteuer/spiele/ichbin/hintergrund/vers-hintergrund.webp')
    // the question of stage 3 does not ask for the words of the verse
    expect(stage(3).questions.map((q) => q.q).join(' ')).not.toMatch(/Welt geliebt|eingeborenen/)
  })

  it('7 from house to house: three houses, then five with a dead end; the woman starts at the well; the texts of the game are those of Sychar, not of Bethlehem; the verse is John 4,29', () => {
    const g = task(7).tell!
    expect(g.rounds.map((r) => r.houses.length)).toEqual([3, 5])
    expect(g.rounds.every((r) => /brunnen\.webp$/.test(r.start.image))).toBe(true)
    expect(g.walker).toBe('images/abenteuer/spiele/ichbin/weitersagen/frau.webp')
    expect(g.texts!.done).toBe('Kommt, seht einen Menschen, der mir gesagt hat alles, was ich getan habe, ob er nicht Christus sei!')
    for (const v of Object.values(g.texts!)) expect(v).not.toMatch(/Hirten|Bethlehem|Krippe/)
    expect(g.texts!.field).toMatch(/Sichar/)
    expect(stage(7).task.hint).toBe('Führe die Frau von Haus zu Haus. Die Wege dürfen sich nicht kreuzen.')
    expect(stage(7).questions.map((q) => q.q).join(' ')).not.toMatch(/Kommt, seht/)
  })

  it('12 the call of the shepherd: six sheep (two for each ring), places to gather, three passes (left, right, left); the stranger stands nearer in the third; the shepherd is not Jesus (no face of Jesus in the data)', () => {
    const g = task(12).herdCall!
    expect(g.sheep).toHaveLength(6)
    expect(g.sheep.map((s) => s.near)).toEqual([0, 0, 1, 1, 2, 2])
    expect(g.slots).toHaveLength(6)
    expect(g.flock).toHaveLength(4)
    expect(g.radii).toEqual([30, 55, 85])
    expect(g.rounds.map((r) => r.mode)).toEqual(['radius', 'who'])
    expect(g.rounds[1]!.trials!.map((t) => t.shepherdSide)).toEqual(['left', 'right', 'left'])
    expect(g.rounds[1]!.trials![2]!.strangerNear).toBe(true)
    expect(g.rounds[1]!.trials![1]!.hesitant).toBe(true)
    expect(g.shepherd.image).toBe('images/abenteuer/spiele/ichbin/hirtenruf/hirte.webp')
    expect(g.stranger.image).toBe('images/abenteuer/spiele/ichbin/hirtenruf/fremder.webp')
    expect(JSON.stringify(g)).not.toMatch(/wolf|jesus/i)
  })
})

describe('Jesus erzählt von sich: map, files, English', () => {
  it('fourteen stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal; five pieces of 16000 x 1648 pixels', () => {
    const m = ichbin.map
    const W = m.widthPx
    expect(W).toBe(16000)
    expect(m.stages).toHaveLength(14)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / W, 3)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * W, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(ICHBIN_PATH).toHaveLength(14)
    for (const seg of ICHBIN_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    for (const seg of ICHBIN_PATH) for (const [x, y] of seg) expect(y * 1648, 'no bead in the lowest fifth').toBeLessThanOrEqual(1318)
    expect(m.path).toBe(ICHBIN_PATH)
    expect(m.aspect).toBeCloseTo(16000 / 1648, 6)
    expect(m.images).toEqual([1, 2, 3, 4, 5].map((n) => `images/abenteuer/ichbin/karte-pano-v1-${n}.webp`))
    expect(PANORAMA_IN).toBe(true)
    for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
    // the pieces cut at 3200, 6400, 9600, 12800 of 16000 pixels (the pieces are 3200 wide): the way of the panorama stands in the file
    expect(readFileSync('src/data/adventures/ichbinPath.ts', 'utf8')).toMatch(/width 16000/)
  })

  it('the way is a placeholder only as long as the panorama is missing (the file says so)', () => {
    const src = readFileSync('src/data/adventures/ichbinPath.ts', 'utf8')
    if (PANORAMA_IN) expect(src, 'the real way of the panorama must replace the placeholder').not.toMatch(/PLATZHALTER/)
  })

  it('the medal and the gift lie in the folder of the adventure; music of its own only when its files are in', () => {
    expect(ichbin.medal).toMatch(/^images\/abenteuer\/ichbin\/medaille-v\d\.webp$/)
    expect(ichbin.gift.image).toBe('images/abenteuer/ichbin/geschenk.webp')
    expect(ichbin.gift.title).toBe('Der Krug am Brunnen')
    expect(ichbin.downloadMb).toBe(17) // measured: all files of the journey are 16.26 MB
    for (const f of ichbin.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the valid recording of every story is named (after the transcription with OpenAI and the cut of the noise burst at the end: the table below); a worse, higher file is not taken', () => {
    const valid = (n: number, en: boolean) => (en ? ({ 2: 2, 4: 2, 5: 2, 7: 2, 8: 2, 10: 2, 14: 2 } as Record<number, number>)[n] : ({ 2: 2, 3: 2, 4: 3, 7: 2, 9: 2, 11: 2, 12: 3, 13: 2 } as Record<number, number>)[n]) ?? 1
    for (const s of ichbin.stages) {
      const nn = String(s.id).padStart(2, '0')
      const file = `audio/abenteuer/ichbin/geschichte-${nn}-v${valid(s.id, false)}.mp3`
      expect(existsSync(`public/${file}`), file).toBe(true)
      expect(s.audio, `stage ${s.id}`).toBe(file)
    }
    // the rejected recording of stage 4 (v2 reads on into stage 5) lies beside it, but is not named
    expect(stage(4).audio).toBe('audio/abenteuer/ichbin/geschichte-04-v3.mp3')
    expect(stage(12).audio).toBe('audio/abenteuer/ichbin/geschichte-12-v3.mp3')
    setAdventureLanguage('en')
    for (const s of ichbin.stages) {
      const nn = String(s.id).padStart(2, '0')
      const file = `audio/abenteuer/ichbin/geschichte-${nn}-en-v${valid(s.id, true)}.mp3`
      expect(existsSync(`public/${file}`), file).toBe(true)
      expect(s.audio, `stage ${s.id}`).toBe(file)
    }
    setAdventureLanguage('de')
  })

  it('the three pieces of music of the adventure are all in the list (night, well, shepherd)', () => {
    expect(ichbin.music).toEqual(['musik-nacht-v1', 'musik-brunnen-v1', 'musik-hirte-v1'].map((n) => `audio/abenteuer/ichbin/${n}.mp3`))
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(ichbin).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f))
    expect(wanted.filter((f) => !existsSync(`public/${f}`))).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/ichbin/etappe-bild-01'))).toBe(true)
    expect(files.some((f) => f.startsWith('images/abenteuer/spiele/ichbin/wehen/'))).toBe(true)
    expect(files.some((f) => f.startsWith('images/abenteuer/spiele/ichbin/hirtenruf/'))).toBe(true)
    expect(files.some((f) => f.startsWith('images/abenteuer/spiele/ichbin/weitersagen/'))).toBe(true)
    expect(files.some((f) => f.startsWith('images/abenteuer/spiele/ichbin/hintergrund/'))).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(ichbin)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(ichbin) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string; subtitle: string }
    expect(en.title).toBe('Jesus Tells About Himself')
    expect(en.subtitle).toBe('What Jesus says about himself')
    expect(en.stages).toHaveLength(14)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The Visit by Night')
    expect(stage(3).title).toBe('God So Loved the World')
    expect(ichbin.gift.title).toBe('The Jar at the Well')
    expect(task(2).breeze!.things[0]!.label).toBe('the flame of the lamp')
    expect(task(2).breeze!.rounds[1]!.hint).toBe('The wind turns. Tap the way it blows at the end, or the calm.')
    expect(task(3).verse!.rounds[0]!.words[0]).toBe('world')
    expect(task(3).verse!.rounds[1]!.parts[0]).toBe('For God so loved the world, that he gave his only begotten ')
    expect(task(7).tell!.rounds[0]!.houses[0]!.name).toBe('The potter’s house')
    expect(task(7).tell!.texts!.done).toBe('Come, see a man, which told me all things that ever I did: is not this the Christ?')
    expect(task(7).tell!.texts!.walkers).toBe('The woman')
    expect(task(12).herdCall!.rounds[0]!.hint).toBe('Tap the shepherd. Each call reaches a little farther.')
    setAdventureLanguage('de')
    expect(task(2).breeze!.things[0]!.label).toBe('die Flamme der Lampe')
    expect(task(7).tell!.texts!.walkers).toBe('Die Frau')
  })

  it('the English texts stay quiet: no blood, no cross, no devil, no sword, no stones, no wound', () => {
    const en = englishTextsOf(ichbin) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|bloody|hell|devil|cross|crucif\w*|sword|corpse|knife|murder\w*|wounds?|weapons?|stones)\b/i)
    })
  })
})
