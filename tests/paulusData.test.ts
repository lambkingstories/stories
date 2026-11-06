/**
 * The data of "Paulus" (`paulus.ts`, `en/paulus.en.ts`, `paulusPath.ts`), adventure no. 31 "Vom Verfolger zum Boten" (Acts 9-18): the stories and questions follow
 * the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Paulus/ENTWURF_Paulus.md`, Luther 1912 told in our own words), two known and five new games with
 * playable data (every `*Problems` check is empty), the question rule (two after a game, three in the stages 1 and 8 with only questions, six in the exam), the map has nine stations
 * and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted the test does not ask for the picture files; it asks for them as soon as the pictures are built in (the last picture of
 * the building-in script, `spiele/paulus/werkstatt/sabbat.webp`, lies in `public/`). The map pieces are asked for at once (the panorama is in). Recordings and music only when they exist.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { paulus } from '@/data/adventures/paulus'
import { PAULUS_PATH } from '@/data/adventures/paulusPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { refindProblems, sailTrimProblems, straightStreetProblems } from '@/utils/paulusNeuA'
import type { RefindGame, SailGame, StreetGame } from '@/utils/paulusNeuA'
import { dyeProblems, tentShopProblems } from '@/utils/paulusNeuB'
import type { DyeGame, TentShopGame } from '@/utils/paulusNeuB'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => paulus.stages[n - 1]!
/** The fields of the new games (`TaskKind`/`GameTask` are wired by the lead; until then they are read like this). */
type NewTask = { straightStreet?: StreetGame; refind?: RefindGame; sailTrim?: SailGame; dye?: DyeGame; tentShop?: TentShopGame }
const task = (n: number) => stage(n).task as unknown as NewTask
/** Words that no German text, question or answer may use (nothing gruesome; the stoning of Stephen is one quiet sentence, the beating in Philippi is told without detail). */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Leichnam|Blut|blutig|Kreuz|Kreuze|Heiligenschein|Schwert|geschlachtet|gesteinigt|Steinigung|Peitsche|Ketten)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/paulus/werkstatt/sabbat.webp')

describe('Paulus: stories and questions', () => {
  it('nine stages with 3 to 5 paragraphs of 100 to 210 words and the Bible passage (Acts) under every one', () => {
    expect(paulus.id).toBe('paulus')
    expect(paulus.age).toBe('8-10')
    expect(paulus.title).toBe('Paulus')
    expect(paulus.subtitle).toBe('Vom Verfolger zum Boten')
    expect(paulus.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of paulus.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Apostelgeschichte (9|13|15|16|18)\b/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(100)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(210)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/paulus/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    expect(paulus.stages.map((s) => s.ref.split(',')[0])).toEqual(['Apostelgeschichte 9', 'Apostelgeschichte 9', 'Apostelgeschichte 9', 'Apostelgeschichte 9', 'Apostelgeschichte 13', 'Apostelgeschichte 15', 'Apostelgeschichte 16', 'Apostelgeschichte 16', 'Apostelgeschichte 18'])
  })

  it('no angel in any text; nothing forbidden in any question or answer; Stephen only in stage 1', () => {
    for (const s of paulus.stages) {
      expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(/\bEngel\b/)
      if (s.id !== 1) expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(/Stephanus/)
      for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    }
    for (const q of paulus.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
  })

  it('two questions after a game, three in the stages 1 and 8 (only questions), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of paulus.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    expect([stage(1).task.kind, stage(8).task.kind]).toEqual(['quiz', 'quiz'])
    for (const q of [...paulus.stages.flatMap((s) => s.questions), ...paulus.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(paulus.exam).toHaveLength(6)
    const asked = paulus.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(paulus.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'etwa', 'etwas'])
    for (const s of paulus.stages) {
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
    expect(t(1)).toMatch(/Licht vom Himmel/)
    expect(t(1)).toMatch(/Saul, Saul, was verfolgst du mich/)
    expect(t(2)).toMatch(/die Gerade/)
    expect(t(2)).toMatch(/wie Schuppen/)
    expect(t(3)).toMatch(/Korb/)
    expect(t(4)).toMatch(/Barnabas/)
    expect(t(4)).toMatch(/Christen/)
    expect(t(5)).toMatch(/Zypern/)
    expect(t(5)).toMatch(/Paulus/)
    expect(t(6)).toMatch(/Komm herüber nach Mazedonien und hilf uns/)
    expect(t(7)).toMatch(/Lydia/)
    expect(t(7)).toMatch(/Purpur/)
    expect(t(8)).toMatch(/Loblieder/)
    expect(t(8)).toMatch(/Glaube an den Herrn Jesus Christus/)
    expect(t(9)).toMatch(/Aquila/)
    expect(t(9)).toMatch(/Zelte/)
  })

  it('the exam asks across the whole adventure', () => {
    const q = paulus.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/Licht vom Himmel/)
    expect(q).toMatch(/Korb/)
    expect(q).toMatch(/Zelte/)
  })
})

describe('Paulus: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (abseilen, weg) not side by side, five new ones, stages 1 and 8 only questions; no game twice in a row', () => {
    const kinds = paulus.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['quiz', 'gerade', 'abseilen', 'wiederfinden', 'segel', 'weg', 'purpur', 'quiz', 'werkstatt'])
    for (let i = 1; i < kinds.length; i++) expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(straightStreetProblems(task(2).straightStreet!)).toEqual([])
    expect(refindProblems(task(4).refind!)).toEqual([])
    expect(sailTrimProblems(task(5).sailTrim!)).toEqual([])
    expect(dyeProblems(task(7).dye!)).toEqual([])
    expect(tentShopProblems(task(9).tentShop!)).toEqual([])
  })

  it('2 streets: two cross streets and the Straight street, then four and two lanes on the Straight street', () => {
    const g = task(2).straightStreet!
    expect(g.rounds.map((r) => r.lanes.length)).toEqual([3, 6])
    expect(g.city).toBe('images/abenteuer/spiele/paulus/gerade/stadt.webp')
  })

  it('3 lowering: the basket with Saul on the rope, two rounds, the guard twice in round 2', () => {
    const l = stage(3).task.lower!
    expect(l.men.map((m) => m.image)).toEqual(['images/abenteuer/spiele/paulus/abseilen/korb-am-seil-a.webp', 'images/abenteuer/spiele/paulus/abseilen/korb-am-seil-b.webp'])
    expect(l.rounds.map((r) => r.passes)).toEqual([1, 2])
  })

  it('4 find again: Saul and three others, then Saul and six others in two rows; the picture shows shorter in round 2', () => {
    const g = task(4).refind!
    expect(g.rounds.map((r) => r.walkers.length)).toEqual([4, 7])
    expect(g.rounds.map((r) => r.show)).toEqual([4000, 3000])
    expect(g.people.filter((p) => p.saul).map((p) => p.id)).toEqual(['saulus-geht'])
  })

  it('5 sail: three changes of the wind, then five and two gusts', () => {
    const g = task(5).sailTrim!
    expect(g.rounds.map((r) => r.winds.length - 1)).toEqual([3, 5])
    expect(g.rounds.map((r) => r.gusts.length)).toEqual([0, 2])
  })

  it('6 the way: three forks (Galatia right, Mysia left, Troas the middle of three ways)', () => {
    const w = stage(6).task.way!
    expect(w.scenes.map((s) => s.goal)).toEqual(['right', 'left', 'middle'])
    expect(w.scenes[2]!.paths).toBe(3)
    expect(w.texts!.done).toContain('Mazedonien')
  })

  it('7 purple: two samples from one vat, then three mixed ones; nine painted colours of the cloth', () => {
    const g = task(7).dye!
    expect(g.rounds.map((r) => r.orders.map((o) => `${o.red}${o.blue}`))).toEqual([['10', '02'], ['11', '21', '12']])
    expect(g.cloths.flat()).toHaveLength(9)
  })

  it('9 workshop: two pieces one after the other, then four at once', () => {
    const g = task(9).tentShop!
    expect(g.rounds.map((r) => [r.pieces, r.overlap])).toEqual([[2, false], [4, true]])
    expect(g.tables.map((t) => t.id)).toEqual(['cut', 'sew', 'rope'])
  })
})

describe('Paulus: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = paulus.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(PAULUS_PATH).toHaveLength(9)
    for (const seg of PAULUS_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(PAULUS_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.images).toEqual([1, 2, 3].map((n) => `images/abenteuer/paulus/karte-pano-v1-${n}.webp`))
    for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the medal and the gift lie in the folder of the adventure; music of its own only when its files are in', () => {
    expect(paulus.medal).toMatch(/^images\/abenteuer\/paulus\/medaille-v\d\.webp$/)
    expect(paulus.gift!.image).toBe('images/abenteuer/paulus/geschenk.webp')
    expect(paulus.gift!.title).toBe('Im Korb über die Mauer')
    expect(paulus.downloadMb).toBeGreaterThan(5)
    for (const f of paulus.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('a recording is named only when its file is in `public/` (otherwise the device reads)', () => {
    for (const s of paulus.stages) {
      const nn = String(s.id).padStart(2, '0')
      const file = `audio/abenteuer/paulus/geschichte-${nn}-v1.mp3`
      expect(s.audio, `stage ${s.id}`).toBe(existsSync(`public/${file}`) ? file : undefined)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(paulus).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f) || f.includes('karte-pano'))
    const missing = wanted.filter((f) => !existsSync(`public/${f}`))
    expect(missing).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/paulus/etappe-bild-01'))).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(paulus)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(paulus) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Paul')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Light on the Way')
    expect(task(2).straightStreet!.rounds[0]!.hint).toContain('Ananias')
    expect(stage(3).task.lower!.rounds[0]!.hint).toContain('basket')
    expect(task(4).refind!.people[1]!.name).toBe('A man with a grey beard and a grey cloak')
    expect(task(5).sailTrim!.rounds[0]!.hint).toContain('Cyprus')
    expect(stage(6).task.way!.texts!.done).toContain('Macedonia')
    expect(task(7).dye!.customers[0]!.name).toBe('A customer from Philippi')
    expect(task(9).tentShop!.tables[1]!.name).toContain('Priscilla')
    setAdventureLanguage('de')
    expect(task(9).tentShop!.tables[1]!.name).toContain('Priszilla')
  })

  it('the English texts stay quiet: no blood, no cross, no devil', () => {
    const en = englishTextsOf(paulus) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|hell|devil|cross|sword|corpse|stoned)\b/i)
    })
  })
})
