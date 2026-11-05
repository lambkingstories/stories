/**
 * The data of "Ostern" (`ostern.ts`, `en/ostern.en.ts`, `osternPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Ostern/ENTWURF_Ostern.md`, Luther 1912 told in our own words), the games (since 5.11.2026 two known and seven new ones) have playable data,
 * the map has nine stations and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted (nothing of them is in `public/` yet) the test does not ask for the picture files; it asks for them as soon as the
 * pictures are built in (the picture of the last new game, `spiele/ostern/licht/huegel.webp`, lies in `public/`). The recordings and the music are checked at once.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { ostern } from '@/data/adventures/ostern'
import { OSTERN_PATH } from '@/data/adventures/osternPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { fischzugProblems, grazeProblems } from '@/utils/osternGames'
import { errandProblems, shuttersProblems } from '@/utils/osternNeuA'
import { flameProblems, tableProblems, wanderProblems } from '@/utils/osternNeuB'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => ostern.stages[n - 1]!
/** Words that no text of the German data may use: nothing of the suffering is told or asked here, the joy of Easter is told quietly. */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Leichnam|Nägel|Nagel|Nägelmale|Wunde|Wunden|Blut|blutet|blutig|Dornenkrone|Heiligenschein|Kreuz|Kreuze)\b/i
const plain = (s: string) => s.replace(/[„“”]/g, '')
/** The pictures are in `public/` when the last file of the building-in script is there. */
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/ostern/licht/huegel.webp')

describe('Ostern: stories and questions', () => {
  it('nine stages with 3 to 5 paragraphs of 100 to 180 words and the Bible passage under every one', () => {
    expect(ostern.id).toBe('ostern')
    expect(ostern.age).toBe('8-10')
    expect(ostern.title).toBe('Ostern')
    expect(ostern.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const s of ostern.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Lukas 24|Johannes 2[01])/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(100)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(180)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(5)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(16)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/ostern/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    expect(ostern.stages.map((s) => s.ref.split(',')[0]!.split('–')[0])).toEqual(['Johannes 20', 'Johannes 20', 'Lukas 24', 'Lukas 24', 'Lukas 24', 'Johannes 20', 'Johannes 21', 'Johannes 21', 'Lukas 24'])
  })

  it('the angels stand only in the story of Mary (stage 2); no wound marks, no blood, no cross in any text, question or answer', () => {
    for (const s of ostern.stages) {
      if (s.id !== 2) expect(s.text.join(' '), `stage ${s.id}`).not.toMatch(/\bEngel\b/)
      for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
    }
    for (const q of ostern.exam) expect(`${q.q} ${q.options.join(' ')}`).not.toMatch(FORBIDDEN)
  })

  it('two questions after a game, three in a stage without one, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of ostern.stages) expect(s.questions, `stage ${s.id}`).toHaveLength((s.task?.kind === 'quiz' ? 3 : 2))
    for (const q of [...ostern.stages.flatMap((s) => s.questions), ...ostern.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?') || q.q.trim().endsWith('.'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(ostern.exam).toHaveLength(6)
    const asked = ostern.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(ostern.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn'])
    for (const s of ostern.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the stone, the stranger on the road, the bread, Thomas, the net and the call to follow', () => {
    const q = ostern.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/weggerollt/)
    expect(q).toMatch(/Jesus/)
    expect(q).toMatch(/Brot/)
    expect(q).toMatch(/Mein Herr und mein Gott/)
    expect(q).toMatch(/rechte Seite/)
    expect(q).toMatch(/Folge mir nach/)
  })

  it('no game is played twice in a row; the net and the pasture are on stages 7 and 8', () => {
    const kinds = ostern.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    expect(stage(7).task.kind).toBe('fischzug')
    expect(stage(8).task.kind).toBe('weiden')
  })

  it('the key words of the Bible are there (Luther 1912, told in our own words)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Maria Magdalena/)
    expect(t(1)).toMatch(/Stein vor dem Eingang ist weggerollt/)
    expect(t(1)).toMatch(/Leinentücher/)
    expect(t(1)).toMatch(/er sieht es und glaubt/i)
    expect(t(2)).toMatch(/Gärtner/)
    expect(t(2)).toMatch(/Maria!/)
    expect(t(2)).toMatch(/Rabbuni/)
    expect(t(2)).toMatch(/Ich habe den Herrn gesehen/)
    expect(t(3)).toMatch(/Emmaus/)
    expect(t(3)).toMatch(/Kleopas/)
    expect(t(3)).toMatch(/Jesus selbst/)
    expect(t(4)).toMatch(/Bleib bei uns/)
    expect(t(4)).toMatch(/bricht es/)
    expect(t(4)).toMatch(/Brannte nicht unser Herz/)
    expect(t(5)).toMatch(/Friede sei mit euch/)
    expect(t(5)).toMatch(/gebratenen Fisch/)
    expect(t(5)).toMatch(/Geist/)
    expect(t(6)).toMatch(/Thomas/)
    expect(t(6)).toMatch(/Mein Herr und mein Gott/)
    expect(t(6)).toMatch(/Selig sind, die nicht sehen und doch glauben/)
    expect(t(7)).toMatch(/Tiberias/)
    expect(t(7)).toMatch(/rechten Seite/)
    expect(t(7)).toMatch(/hundertdreiundfünfzig/)
    expect(t(7)).toMatch(/Kohlenfeuer/)
    expect(t(8)).toMatch(/Weide meine Lämmer/)
    expect(t(8)).toMatch(/Weide meine Schafe/)
    expect(t(8)).toMatch(/Folge mir nach/)
    expect(t(9)).toMatch(/Ihr aber seid Zeugen von alledem/)
    expect(t(9)).toMatch(/Bethanien/)
    expect(t(9)).toMatch(/segnet/)
    expect(t(9)).toMatch(/mit großer Freude/)
  })
})

describe('Ostern: the games', () => {
  it('the order of the games (Antons Regel 5.11.2026): two known ones (wimmelbild, unterschied) far apart, the others new', () => {
    expect(ostern.stages.map((s) => s.task.kind)).toEqual(['wimmelbild', 'botengang', 'wanderweg', 'tischdecken', 'fensterlaeden', 'unterschied', 'fischzug', 'weiden', 'lichtweg'])
  })
  it('1 hidden pictures: Mary Magdalene, Peter, the other disciple and the linen cloths, covers, every place inside the picture', () => {
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
    expect(f.labels!.join(' ')).toMatch(/Maria Magdalena/)
    expect(f.labels!.join(' ')).toMatch(/Petrus/)
    expect(f.labels!.join(' ')).toMatch(/Jünger/)
    expect(f.labels!.join(' ')).toMatch(/Leinentücher/)
    expect(f.scene).toBe('images/abenteuer/spiele/ostern/wimmel/szene.webp')
  })

  it('the new games can be played: errand, road, table, shutters, flame (the checks of their logic find nothing)', () => {
    expect(errandProblems(stage(2).task.errand!)).toEqual([])
    expect(wanderProblems(stage(3).task.wander!)).toEqual([])
    expect(tableProblems(stage(4).task.table!)).toEqual([])
    expect(shuttersProblems(stage(5).task.shutters!)).toEqual([])
    expect(flameProblems(stage(9).task.flame!)).toEqual([])
  })

  it('2 errand: Mary from the garden gate to the house of the disciples, round 2 bigger with more wells', () => {
    const g = stage(2).task.errand!
    expect(g.rounds).toHaveLength(2)
    const wells = (r: { rows: string[] }) => r.rows.join('').split('B').length - 1
    expect(wells(g.rounds[1]!)).toBeGreaterThan(wells(g.rounds[0]!))
    expect(g.walker).toBe('images/abenteuer/spiele/ostern/botengang/maria.webp')
  })

  it('3 road: the two walkers of the old way game on two painted roads, round 2 with more obstacles', () => {
    const g = stage(3).task.wander!
    expect(g.walker).toBe('images/abenteuer/spiele/ostern/weg/wanderer.webp')
    expect(g.rounds.map((r) => r.background)).toEqual([1, 2].map((n) => `images/abenteuer/spiele/ostern/wanderweg/strasse-${n}.webp`))
    expect(g.rounds[1]!.obstacles.length).toBeGreaterThan(g.rounds[0]!.obstacles.length)
  })

  it('4 table: a cup and a bowl at every place, then lamp and jug in the middle, the bread to the guest, net and staff into the basket', () => {
    const g = stage(4).task.table!
    expect(g.guestSlot).toBe('oben')
    expect(g.rounds[0]!.items.map((i) => i.target).sort()).toEqual(['links', 'links', 'oben', 'oben', 'rechts', 'rechts'])
    expect(Object.fromEntries(g.rounds[1]!.items.map((i) => [i.id, i.target]))).toEqual({ lampe: 'mitte', krug: 'mitte', brot: 'oben', netz: 'korb', stab: 'korb' })
  })

  it('5 shutters: four windows in a row (best 2), then two rows of three with five closed (best 3)', () => {
    const g = stage(5).task.shutters!
    expect(g.rounds.map((r) => r.windows.length)).toEqual([4, 6])
    expect(g.rounds.map((r) => r.par)).toEqual([2, 3])
    expect(g.rounds[1]!.start.filter((o) => !o)).toHaveLength(5)
  })

  it('6 differences: two views of the room, three big things and then four small ones', () => {
    const g = stage(6).task.diff!
    expect(g.rounds.map((r) => r.items.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.base)).toEqual([1, 2].map((n) => `images/abenteuer/spiele/ostern/unterschied/saal-${n}.webp`))
  })

  it('9 flame: six people in a row, then nine with a fork; every lamp can be reached', () => {
    const g = stage(9).task.flame!
    expect(g.rounds.map((r) => r.people.length)).toEqual([6, 9])
  })
  it('7 net: two rounds (five fish in one swarm, eight fish in two swarms); the data can be played; the pictures come from the data', () => {
    const g = stage(7).task.fischzug!
    expect(fischzugProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.fish)).toEqual([5, 8])
    expect(g.rounds.map((r) => r.throws)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.goal)).toEqual([4, 6])
    expect(g.rounds[1]!.schools).toBe(2)
    expect(g.fish).toHaveLength(3)
    expect(g.lake).toBe('images/abenteuer/spiele/ostern/fischzug/see.webp')
    expect(g.full).toBe('images/abenteuer/spiele/ostern/fischzug/fang.webp')
    expect([g.boat.image, g.net.image, g.basket.image]).toEqual(['boot', 'netz', 'korb'].map((f) => `images/abenteuer/spiele/ostern/fischzug/${f}.webp`))
    expect(g.fish.map((f) => f.image)).toEqual([1, 2, 3].map((n) => `images/abenteuer/spiele/ostern/fischzug/fisch-${n}.webp`))
  })

  it('8 pasture: round 1 four lambs without a brook, round 2 two lambs and two sheep with the brook and the bridge; the data can be played; the pictures come from the data', () => {
    const g = stage(8).task.graze!
    expect(grazeProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.animals.length)).toEqual([4, 4])
    expect(g.rounds.map((r) => r.stream)).toEqual([false, true])
    expect(g.rounds.map((r) => r.title)).toEqual(['Weide meine Lämmer!', 'Weide meine Schafe!'])
    for (const r of g.rounds) for (const a of r.animals) expect(g.kinds.map((k) => k.id), a).toContain(a)
    expect(g.kinds.find((k) => k.id === 'schaf')!.speed).toBeLessThan(26)
    expect(g.meadow).toBe('images/abenteuer/spiele/ostern/weiden/wiese.webp')
    expect(g.meadowStream).toBe('images/abenteuer/spiele/ostern/weiden/wiese-bach.webp')
    expect([g.hirte.image, g.thorn.image, g.pen.image, g.bridge.image]).toEqual(['hirte', 'dornen', 'pferch', 'steg'].map((f) => `images/abenteuer/spiele/ostern/weiden/${f}.webp`))
  })
})

describe('Ostern: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = ostern.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(OSTERN_PATH).toHaveLength(9)
    for (const seg of OSTERN_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(OSTERN_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.images).toEqual([1, 2, 3].map((n) => `images/abenteuer/ostern/karte-pano-v1-${n}.webp`))
  })

  it('the music: three pieces of its own, the medal and the gift lie in the folder of the adventure', () => {
    expect(ostern.music).toEqual(['musik-garten-v1.mp3', 'musik-emmaus-v1.mp3', 'musik-see-v1.mp3'].map((f) => `audio/abenteuer/ostern/${f}`))
    expect(ostern.medal).toMatch(/^images\/abenteuer\/ostern\/medaille-v\d\.webp$/)
    expect(ostern.gift!.image).toBe('images/abenteuer/ostern/geschenk.webp')
    expect(ostern.downloadMb).toBeGreaterThan(5)
  })

  it('the recordings (German and English, all nine) and the music are in `public/`', () => {
    for (const f of ostern.music!) expect(existsSync(`public/${f}`), f).toBe(true)
    for (let i = 1; i <= 9; i++) {
      const nn = String(i).padStart(2, '0')
      expect(existsSync(`public/audio/abenteuer/ostern/geschichte-${nn}-v1.mp3`), `German ${nn}`).toBe(true)
      expect(existsSync(`public/audio/abenteuer/ostern/geschichte-${nn}-en-v1.mp3`), `English ${nn}`).toBe(true)
      expect(stage(i).audio, `stage ${i}`).toBe(`audio/abenteuer/ostern/geschichte-${nn}-v1.mp3`)
    }
  })

  it('every picture of the adventure exists in `public/` (asked for as soon as the pictures are built in; before that only the recordings and the music are checked)', () => {
    const files = journeyFiles(ostern).filter((f) => !notPaintedYet(f))
    const wanted = files.filter((f) => PICTURES_IN || /^audio\//.test(f))
    const missing = wanted.filter((f) => !existsSync(`public/${f}`))
    expect(missing).toEqual([])
    if (!PICTURES_IN) expect(files.some((f) => f.startsWith('images/abenteuer/ostern/etappe-bild-01'))).toBe(true)
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(ostern)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(ostern) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Easter')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The Tomb Is Empty')
    expect(stage(1).task.find!.labels![0]).toBe('Mary Magdalene')
    expect(stage(2).task.errand!.rounds[0]!.hint).toContain('Mary')
    expect(stage(3).task.wander!.rounds[0]!.obstacles.map((o) => o.name)).toContain('A stone')
    expect(stage(4).task.table!.rounds[1]!.items.map((i) => i.name)).toContain('The flatbread')
    expect(stage(5).task.shutters!.rounds[0]!.hint).toContain('shutters')
    expect(stage(6).task.diff!.rounds[0]!.hint).toContain('Eight days later')
    expect(stage(9).task.flame!.rounds[0]!.hint).toContain('Jerusalem')
    expect(stage(7).task.fischzug!.rounds[0]!.hint).toContain('net')
    expect(stage(7).task.fischzug!.boat.label).toContain('seven fishermen')
    expect(stage(8).task.graze!.rounds.map((r) => r.title)).toEqual(['Feed my lambs!', 'Feed my sheep!'])
    expect(stage(8).task.graze!.kinds[2]!.label).toBe('A sheep')
    for (const s of ostern.stages) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/ostern/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    setAdventureLanguage('de')
    expect(stage(8).task.graze!.kinds[2]!.label).toBe('Ein Schaf')
  })

  it('the English texts keep the quiet of Easter: no wound marks, no nails, no blood, no cross', () => {
    const en = englishTextsOf(ostern) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      const t = e.text.join(' ')
      expect(t, `stage ${i + 1}`).not.toMatch(/\b(nails?|thorns?|whip|scourg\w*|wounds?|corpse|bleed\w*|blood|hell|devil|cross)\b/i)
    })
  })
})
