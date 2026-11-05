/**
 * The data of "Ostern" (`ostern.ts`, `en/ostern.en.ts`, `osternPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Ostern/ENTWURF_Ostern.md`, Luther 1912 told in our own words), the seven old games and the two new ones (`fischzug`, `weiden`) have playable data,
 * the map has nine stations and the exam, and the English file has the same shape.
 *
 * The pictures: while the pictures are still being painted (nothing of them is in `public/` yet) the test does not ask for the picture files; it asks for them as soon as the
 * pictures are built in (the last file that `bilder_einbauen.py` writes, `spiele/ostern/lueckenvers/tafel.webp`, lies in `public/`). The recordings and the music are checked at once.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { ostern } from '@/data/adventures/ostern'
import { OSTERN_PATH } from '@/data/adventures/osternPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { fischzugProblems, grazeProblems } from '@/utils/osternGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => ostern.stages[n - 1]!
/** Words that no text of the German data may use: nothing of the suffering is told or asked here, the joy of Easter is told quietly. */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Leichnam|Nägel|Nagel|Nägelmale|Wunde|Wunden|Blut|blutet|blutig|Dornenkrone|Heiligenschein|Kreuz|Kreuze)\b/i
const plain = (s: string) => s.replace(/[„“”]/g, '')
/** The pictures are in `public/` when the last file of the building-in script is there. */
const PICTURES_IN = existsSync('public/images/abenteuer/spiele/ostern/lueckenvers/tafel.webp')

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

  it('three questions in every stage, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of ostern.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(3)
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

  it('no game is played twice in a row (the verse gaps of stages 2 and 9 are far apart); the two new games are on stages 7 and 8', () => {
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
  it('the order of the games: 7 old ones (wimmelbild, lueckenvers, weg, reihenfolge, puzzle, memory, lueckenvers) and 2 new ones (fischzug, weiden)', () => {
    expect(ostern.stages.map((s) => s.task.kind)).toEqual(['wimmelbild', 'lueckenvers', 'weg', 'reihenfolge', 'puzzle', 'memory', 'fischzug', 'weiden', 'lueckenvers'])
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

  it.each([
    [2, 'Ich habe den Herrn gesehen!', 'gesehen'],
    [9, 'Ihr aber seid Zeugen von alledem.', 'Zeugen']
  ])('%i verse: two rounds, the sentence stands word for word in the text of the stage, the right words are on the leaves', (n, verse, firstWord) => {
    const g = stage(n).task.verse!
    expect(g.rounds).toHaveLength(2)
    const text = plain(stage(n).text.join(' '))
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      let sentence = r.parts[0]!
      r.answers.forEach((a, k) => {
        sentence += r.words[a] + r.parts[k + 1]
      })
      expect(text, `"${sentence}"`).toContain(plain(sentence))
      expect(sentence).toBe(verse)
    }
    expect(g.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    expect(g.rounds[0]!.words[0]).toBe(firstWord)
    expect(g.board).toBe('images/abenteuer/spiele/ostern/lueckenvers/tafel.webp')
    expect(g.leaf).toBe('images/abenteuer/spiele/ostern/lueckenvers/blatt.webp')
  })

  it('3 way: three forks with three ways each (left, right, middle), the walkers and the own words of the journey to Emmaus', () => {
    const g = stage(3).task.way!
    expect(g.scenes.map((s) => s.goal)).toEqual(['left', 'right', 'middle'])
    for (const s of g.scenes) expect(s.paths).toBe(3)
    expect(g.scenes.map((s) => s.image)).toEqual([1, 2, 3].map((n) => `images/abenteuer/spiele/ostern/weg/gabel-${n}.webp`))
    expect(g.walker).toBe('images/abenteuer/spiele/ostern/weg/wanderer.webp')
    expect(g.texts!.hint).toContain('{n}')
    expect(g.texts!.hint).toContain('{total}')
    expect(g.texts!.done).toContain('Emmaus')
  })

  it('4 order: four cards in the order of the story (road, stranger, bread, back); round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(4).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['weg', 'fremder', 'brot', 'zurueck'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['weg', 'fremder', 'brot', 'zurueck'])
    expect(g.cards.map((c) => c.image)).toEqual([1, 2, 3, 4].map((n) => `images/abenteuer/spiele/ostern/reihenfolge/karte-${n}.webp`))
  })

  it('5 puzzle: the picture of the room with Jesus in the middle in 2 columns and 3 rows', () => {
    const g = stage(5).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toBe('images/abenteuer/spiele/ostern/puzzle/saal.webp')
  })

  it('6 memory: six pairs with a text each (only what is in the texts of the stages), the back of the cards', () => {
    const g = stage(6).task.memory!
    expect(g.pairs).toHaveLength(6)
    expect(g.back).toBe('images/abenteuer/spiele/ostern/memory/rueckseite.webp')
    expect(g.pairs.map((p) => p.image)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `images/abenteuer/spiele/ostern/memory/karte-${n}.webp`))
    expect(new Set(g.pairs.map((p) => p.text)).size).toBe(6)
    for (const p of g.pairs) expect(p.text, p.text).not.toMatch(FORBIDDEN)
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
    expect(stage(3).task.way!.texts!.done).toContain('Emmaus')
    expect(stage(4).task.order!.cards[2]!.label).toContain('breaks the bread')
    expect(stage(6).task.memory!.pairs[4]!.text).toContain('net')
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

  it('the English verses stand word for word in the English text of stages 2 and 9', () => {
    const en = englishTextsOf(ostern) as { stages: { text: string[]; task?: { verse?: { rounds: { parts: string[]; words: string[] }[] } } }[] }
    for (const n of [2, 9]) {
      const e = en.stages[n - 1]!
      const text = plain(e.text.join(' '))
      const de = stage(n).task.verse!
      e.task!.verse!.rounds.forEach((r, k) => {
        let sentence = r.parts[0]!
        de.rounds[k]!.answers.forEach((a, i) => {
          sentence += r.words[a] + r.parts[i + 1]
        })
        expect(text, `"${sentence}"`).toContain(plain(sentence))
      })
    }
  })
})
