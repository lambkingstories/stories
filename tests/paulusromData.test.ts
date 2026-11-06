/**
 * The data of "Bis nach Rom" (`paulusrom.ts`, `en/paulusrom.en.ts`, `paulusromPath.ts`), adventure no. 32 (Acts 17-28): the stories and questions follow the rules of the adventures
 * (texts of the draft `D:/Claude/Abenteuer-PaulusRom/ENTWURF_PaulusRom.md`, Luther 1912 told in our own words), two known and five new games with playable data (every `*Problems` check
 * is empty), the question rule (two after a game, three in the serious stages 3 and 6, six in the exam), the map has nine stations and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted the test does not ask for the picture files; it asks for them as soon as the pictures are built in (the last picture of the
 * building-in script, `spiele/paulusrom/besuch/alle-hoeren.webp`, lies in `public/`). The map pieces are asked for as soon as the first piece lies in `public/`. Recordings and music only when they exist.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { paulusrom } from '@/data/adventures/paulusrom'
import { PAULUSROM_PATH } from '@/data/adventures/paulusromPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { planksProblems, quietSpotProblems, wallShadowsProblems } from '@/utils/paulusromNeuA'
import type { PlanksGame, QuietSpotGame, WallShadowGame } from '@/utils/paulusromNeuA'
import { brushwoodProblems, visitorsProblems } from '@/utils/paulusromNeuB'
import type { BrushwoodGame, VisitorsGame } from '@/utils/paulusromNeuB'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => paulusrom.stages[n - 1]!
/** The fields of the new games (`TaskKind`/`GameTask` are wired by the lead; until then they are read like this). */
type NewTask = { wallShadows?: WallShadowGame; quietSpot?: QuietSpotGame; planks?: PlanksGame; brushwood?: BrushwoodGame; visitors?: VisitorsGame }
const task = (n: number) => stage(n).task as unknown as NewTask
/** Words that no German text, question or answer may use (nothing gruesome; the data rules of the earlier adventures). */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Leichnam|Blut|blutig|Kreuz|Kreuze|Heiligenschein|Schwert|Schwerter|geschlachtet|getötet|töten|tot|Tod|Mörder|Mord|Mordplan)\b/i
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/paulusrom/besuch/alle-hoeren.webp')
const MAP_IN = existsSync('public/images/abenteuer/paulusrom/karte-pano-v1-1.webp')

describe('Bis nach Rom: stories and questions', () => {
  it('nine stages with 3 to 5 paragraphs of 100 to 190 words and the Bible passage (Acts) under every one', () => {
    expect(paulusrom.id).toBe('paulusrom')
    expect(paulusrom.age).toBe('8-10')
    expect(paulusrom.title).toBe('Bis nach Rom')
    expect(paulusrom.subtitle).toBe('Paulus reist in die Hauptstadt der Welt')
    expect(paulusrom.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of paulusrom.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Apostelgeschichte (17|20|21|24|27|28)\b/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(100)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(190)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/paulusrom/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    expect(paulusrom.stages.map((s) => s.ref.split(',')[0])).toEqual([
      'Apostelgeschichte 17',
      'Apostelgeschichte 20',
      'Apostelgeschichte 20',
      'Apostelgeschichte 21',
      'Apostelgeschichte 24',
      'Apostelgeschichte 27',
      'Apostelgeschichte 27',
      'Apostelgeschichte 28',
      'Apostelgeschichte 28'
    ])
  })

  it('the angel only in the text of stage 6, Jesus only as a voice in the text (stages 4 and 5); nothing forbidden in any question or answer', () => {
    for (const s of paulusrom.stages) {
      if (s.id !== 6) expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(/\bEngel\b/)
      for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    }
    for (const q of paulusrom.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
    // the serpent of Malta is only told in two sober sentences, never asked, never in a game
    for (const s of paulusrom.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(/Otter|Schlange/)
  })

  it('two questions after a game, three in stages 3 and 6 (only questions), three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of paulusrom.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(s.task?.kind === 'quiz' ? 3 : 2)
    expect(stage(3).task.kind).toBe('quiz')
    expect(stage(6).task.kind).toBe('quiz')
    for (const q of [...paulusrom.stages.flatMap((s) => s.questions), ...paulusrom.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(paulusrom.exam).toHaveLength(6)
    const asked = paulusrom.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(paulusrom.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn', 'etwa'])
    for (const s of paulusrom.stages) {
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
    expect(t(1)).toMatch(/Dem unbekannten Gott/)
    expect(t(1)).toMatch(/Dionysius/)
    expect(t(2)).toMatch(/Eutychus/)
    expect(t(2)).toMatch(/Seine Seele ist in ihm/)
    expect(t(3)).toMatch(/Geben ist seliger als Nehmen/)
    expect(t(4)).toMatch(/Sohn von Paulus' Schwester/)
    expect(t(5)).toMatch(/Agrippa/)
    expect(t(5)).toMatch(/Licht vom Himmel/)
    expect(t(6)).toMatch(/Julius/)
    expect(t(6)).toMatch(/Seid unverzagt/)
    expect(t(7)).toMatch(/Brettern/)
    expect(t(8)).toMatch(/Malta/)
    expect(t(8)).toMatch(/Publius/)
    expect(t(9)).toMatch(/unverboten/)
    expect(t(9)).toMatch(/[Zz]wei Jahre/)
  })

  it('the exam asks across the whole adventure', () => {
    const q = paulusrom.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/Altar/)
    expect(q).toMatch(/Eutychus/)
    expect(q).toMatch(/Agrippa/)
    expect(q).toMatch(/unverboten/)
  })
})

describe('Bis nach Rom: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (wimmelbild, reihenfolge) not next to each other, five new ones, stages 3 and 6 only questions; no game twice in a row', () => {
    const kinds = paulusrom.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['wimmelbild', 'wandschatten', 'quiz', 'beiseite', 'reihenfolge', 'quiz', 'bretter', 'reisig', 'besuch'])
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
  })

  it('the new games can be played: the checks of their logic find nothing', () => {
    expect(wallShadowsProblems(task(2).wallShadows!)).toEqual([])
    expect(quietSpotProblems(task(4).quietSpot!)).toEqual([])
    expect(planksProblems(task(7).planks!)).toEqual([])
    expect(brushwoodProblems(task(8).brushwood!)).toEqual([])
    expect(visitorsProblems(task(9).visitors!)).toEqual([])
  })

  it('1 hidden pictures: four altars of Athens', () => {
    const t = stage(1).task
    expect(t.count).toBe(4)
    const f = t.find!
    expect(f.finds).toHaveLength(4)
    expect(f.labels).toHaveLength(4)
    expect(f.covers.length).toBeGreaterThanOrEqual(4)
    expect(f.scene).toBe('images/abenteuer/spiele/paulusrom/wimmel/szene.webp')
    expect(f.doneText).toContain('Dem unbekannten Gott')
  })

  it('2 shadows on the wall: four people (each shadow once), then six people and five shadows, some bigger or turned', () => {
    const g = task(2).wallShadows!
    expect(g.rounds.map((r) => r.people.length)).toEqual([4, 6])
    expect(g.rounds.map((r) => r.shadows.length)).toEqual([4, 5])
    expect(g.rounds[0]!.shadows.every((s) => s.scale === 1 && !s.flip)).toBe(true)
    expect(g.rounds[1]!.shadows.filter((s) => s.flip || s.scale > 1).length).toBeGreaterThanOrEqual(2)
    expect(g.people.map((p) => p.id)).toContain('eutychus')
  })

  it('4 a place for two: three soldiers with visible rings, then five with rings that show when the pair comes near', () => {
    const g = task(4).quietSpot!
    expect(g.rounds.map((r) => r.soldiers.length)).toEqual([3, 5])
    expect(g.rounds.map((r) => r.showRings)).toEqual(['always', 'near'])
  })

  it('5 order: four cards with dots, then five cards without; the life of Paul in the order of the Bible', () => {
    const o = stage(5).task.order!
    expect(o.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(o.rounds[0]!.cards).toEqual(['pharisaeer', 'licht', 'predigt', 'agrippa'])
    expect(o.rounds[1]!.cards).toEqual(['pharisaeer', 'briefe', 'licht', 'predigt', 'agrippa'])
    expect(o.cards.map((c) => c.image).every((i) => /reihenfolge\/karte-[a-z]+\.webp$/.test(i))).toBe(true)
  })

  it('7 boards: four boards and three currents, then six boards and four currents; two currents reach the shore in both rounds', () => {
    const g = task(7).planks!
    expect(g.rounds.map((r) => r.boards.length)).toEqual([4, 6])
    expect(g.rounds.map((r) => r.paths.length)).toEqual([3, 4])
    for (const r of g.rounds) expect(r.paths.filter((k) => g.paths[k]!.ends === 'shore')).toHaveLength(2)
  })

  it('8 sticks: three bundles with stones outside, then four bundles; the serpent is not in the game', () => {
    const g = task(8).brushwood!
    expect(g.rounds.map((r) => r.bundles)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.fireStart)).toEqual([1, 2])
    expect(JSON.stringify(g)).not.toMatch(/otter|schlange|snake/i)
  })

  it('9 welcome: three guests, then five (two visits with two guests at once); the chain is light', () => {
    const g = task(9).visitors!
    expect(g.rounds.map((r) => r.visits.reduce((s, v) => s + v.arrivals.length, 0))).toEqual([3, 5])
    expect(g.rounds[1]!.visits.filter((v) => v.arrivals.length === 2)).toHaveLength(2)
    expect(g.rounds.map((r) => r.showReach)).toEqual([true, false])
    expect(g.chain).toBe('images/abenteuer/spiele/paulusrom/besuch/kette.webp')
  })
})

describe('Bis nach Rom: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = paulusrom.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(PAULUSROM_PATH).toHaveLength(9)
    for (const seg of PAULUSROM_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(PAULUSROM_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.images).toEqual([1, 2, 3].map((n) => `images/abenteuer/paulusrom/karte-pano-v1-${n}.webp`))
    if (MAP_IN) for (const f of m.images) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('the medal and the gift lie in the folder of the adventure; music of its own only when its files are in', () => {
    expect(paulusrom.medal).toMatch(/^images\/abenteuer\/paulusrom\/medaille-v\d\.webp$/)
    expect(paulusrom.gift!.image).toBe('images/abenteuer/paulusrom/geschenk.webp')
    expect(paulusrom.downloadMb).toBeGreaterThan(5)
    for (const f of paulusrom.music ?? []) expect(existsSync(`public/${f}`), f).toBe(true)
  })

  it('a recording is named only when its file is in `public/` (otherwise the device reads)', () => {
    for (const s of paulusrom.stages) {
      const nn = String(s.id).padStart(2, '0')
      const file = `audio/abenteuer/paulusrom/geschichte-${nn}-v1.mp3`
      expect(s.audio, `stage ${s.id}`).toBe(existsSync(`public/${file}`) ? file : undefined)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in)', () => {
    const files = journeyFiles(paulusrom).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f) || (MAP_IN && f.includes('karte-pano')))
    const missing = wanted.filter((f) => !existsSync(`public/${f}`))
    expect(missing).toEqual([])
    expect(files.some((f) => f.startsWith('images/abenteuer/paulusrom/etappe-bild-01'))).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(paulusrom)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(paulusrom) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('All the Way to Rome')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('To the Unknown God')
    expect(stage(1).task.find!.labels![2]).toBe('The plain altar with the empty tablet')
    expect(task(2).wallShadows!.people[0]!.name).toBe('Paul')
    expect(task(4).quietSpot!.rounds[0]!.hint).toContain('no one is listening')
    expect(stage(5).task.order!.cards[2]!.label).toContain('Damascus')
    expect(task(7).planks!.items[0]!.name).toBe('A sailor on a board')
    expect(task(8).brushwood!.rounds[0]!.things[0]!.name).toBe('Dry sticks')
    expect(task(9).visitors!.guests[0]!.name).toBe('A Jewish elder')
    setAdventureLanguage('de')
    expect(task(2).wallShadows!.people[0]!.name).toBe('Paulus')
  })

  it('the English texts stay quiet: no blood, no cross, no devil', () => {
    const en = englishTextsOf(paulusrom) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      expect(e.text.join(' '), `stage ${i + 1}`).not.toMatch(/\b(blood|hell|devil|cross|sword|corpse)\b/i)
    })
  })
})
