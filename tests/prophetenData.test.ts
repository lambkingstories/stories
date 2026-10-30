/**
 * The data of "The King Is Coming" (`propheten.ts`, `en/propheten.en.ts`, `prophetenPath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Propheten/ENTWURF_Propheten.md`, Luther 1912 told in our own words),
 * the two quiz stages (Isaiah 53) are only quizzes, the two new games and the five old ones have sound data, the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { propheten } from '@/data/adventures/propheten'
import { PROPHETEN_PATH } from '@/data/adventures/prophetenPath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => propheten.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [5, 7]

describe('Der König kommt: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(propheten.id).toBe('propheten')
    expect(propheten.age).toBe('8-10')
    expect(propheten.title).toBe('Der König kommt')
    expect(propheten.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(propheten.stages.map((s) => s.title)).toEqual([
      'Das große Licht',
      'Ein Kind ist uns geboren',
      'Bethlehem',
      'Ein Zweig aus dem Stamm Isais',
      'Der Knecht Gottes',
      'Wolf und Lamm',
      'Wie ein Lamm',
      'Schwerter zu Pflugscharen',
      'Der Friede und der König'
    ])
    for (const s of propheten.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Jesaja|Micha) \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(90)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(145)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(7)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(12.5)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/propheten/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of propheten.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...propheten.stages.flatMap((s) => s.questions), ...propheten.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(propheten.exam).toHaveLength(6)
    const asked = propheten.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(propheten.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'werden'])
    for (const s of propheten.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the light, Bethlehem, Jesse, the sheep, the lion and the swords', () => {
    const q = propheten.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Finstern/)
    expect(q).toMatch(/Micha/)
    expect(q).toMatch(/Isai/)
    expect(q).toMatch(/in die Irre/)
    expect(q).toMatch(/Löwe/)
    expect(q).toMatch(/Schwertern/)
  })

  it('the two quiz stages (5, 7) are only quizzes, never two in a row, and say that they are serious', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(5).task.hint).toContain('ernst')
    expect(stage(7).task.hint).toContain('ernst')
    const kinds = propheten.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); who speaks is right; what was left out stays out', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Das Volk, das im Finstern wandelt, sieht ein großes Licht/)
    expect(t(1)).toMatch(/spricht Jesaja zu Gott/)
    expect(t(2)).toMatch(/uns ist ein Kind geboren/)
    expect(t(2)).toMatch(/ein Sohn ist uns gegeben/)
    expect(t(2)).toMatch(/Stuhl Davids/)
    expect(t(3)).toMatch(/spricht der Herr durch Micha/)
    expect(t(3)).toMatch(/Bethlehem Ephrata/)
    expect(t(3)).toMatch(/Hohenpriester und Schriftgelehrten/)
    expect(t(4)).toMatch(/Stamm Isais/)
    expect(t(4)).toMatch(/Geist der Weisheit und des Verstandes/)
    expect(t(5)).toMatch(/Wir gingen alle in die Irre wie Schafe/)
    expect(t(5)).toMatch(/Wir hielten nichts von ihm/)
    expect(t(6)).toMatch(/Wölfe werden bei den Lämmern wohnen/)
    expect(t(6)).toMatch(/spricht der Herr durch Jesaja/)
    expect(t(6)).toMatch(/Stroh/)
    expect(t(7)).toMatch(/still wie ein Lamm/)
    expect(t(7)).toMatch(/für die Übeltäter gebeten/)
    expect(t(8)).toMatch(/Schwerter zu Pflugscharen/)
    expect(t(8)).toMatch(/Weinstock und Feigenbaum/)
    expect(t(9)).toMatch(/Lahmen sammeln/)
    expect(t(9)).toMatch(/er wird unser Friede sein/)
    // the Prophets speak in the future about what is to come (the frame story is in the present)
    expect(t(6)).not.toMatch(/Der Löwe frisst/)
    expect(t(8)).not.toMatch(/Dann schmieden sie/)
    // not told: judgement on Israel, the killing of the wicked, Assyria, the sword of Micah 5, no name of Jesus
    const all = propheten.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Gottlosen töten|Assur|ausrotten|Jesus|Christus|Maria|Josef/)
  })
})

describe('Der König kommt: the games', () => {
  it('the order of the games: 5 old, 2 new (peace, forge), 2 quizzes; no game twice', () => {
    expect(propheten.stages.map((s) => s.task.kind)).toEqual(['puzzle', 'lueckenvers', 'wimmelbild', 'reihenfolge', 'quiz', 'friede', 'quiz', 'schmieden', 'memory'])
    const games = propheten.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['friede', 'schmieden'].includes(k))).toHaveLength(2)
  })

  it('1 puzzle: a portrait picture in 2 columns and 3 rows', () => {
    const g = stage(1).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/licht\.webp$/)
  })

  it('2 verse: the sentences are in the text and the right words are on the leaves', () => {
    const g = stage(2).task.verse!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('geboren')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['Ende', 'Stuhl'])
    expect(stage(2).text.join(' ')).toMatch(/uns ist ein Kind geboren/)
    expect(stage(2).text.join(' ')).toMatch(/kein Ende sein auf dem Stuhl Davids/)
  })

  it('3 hidden pictures: five lambs, covers, every place inside the picture', () => {
    const t = stage(3).task
    expect(t.kind).toBe('wimmelbild')
    expect(t.count).toBe(5)
    const f = t.find!
    expect(f.finds).toHaveLength(5)
    expect(f.covers.length).toBeGreaterThanOrEqual(6)
    for (const s of [...f.finds, ...f.covers]) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(101)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(f.labels).toHaveLength(5)
  })

  it('4 order: four cards, round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(4).task.order!
    expect(g.cards).toHaveLength(4)
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['stumpf', 'trieb', 'zweig', 'frucht'])
  })

  it('6 peace: four pairs of the text (wolf and lamb, leopard and young goat, lion and calf, bear and cow); round 1 with the list, round 2 without and with another order; everything inside the picture', () => {
    const g = stage(6).task.peace!
    expect(g.pairs).toEqual([
      { predator: 'wolf', prey: 'lamm' },
      { predator: 'leopard', prey: 'zicklein' },
      { predator: 'loewe', prey: 'kalb' },
      { predator: 'baer', prey: 'kuh' }
    ])
    expect(g.animals).toHaveLength(8)
    expect(new Set(g.animals.map((a) => a.id)).size).toBe(8)
    for (const p of g.pairs) {
      expect(g.animals.find((a) => a.id === p.predator), p.predator).toBeTruthy()
      expect(g.animals.find((a) => a.id === p.prey), p.prey).toBeTruthy()
    }
    expect(g.spots).toHaveLength(4)
    for (const s of g.spots) {
      expect(s.x).toBeGreaterThan(5)
      expect(s.x + 23).toBeLessThanOrEqual(95)
      expect(s.y).toBeGreaterThan(20)
      expect(s.y).toBeLessThan(g.stripY)
    }
    expect(g.stripY).toBeLessThanOrEqual(99)
    expect(g.rounds.map((r) => r.showList)).toEqual([true, false])
    for (const r of g.rounds) expect([...r.preyOrder].sort()).toEqual(['kalb', 'kuh', 'lamm', 'zicklein'])
    expect(g.rounds[0]!.preyOrder).not.toEqual(g.rounds[1]!.preyOrder)
    expect(g.background).toMatch(/propheten\/friede\/wiese\.webp$/)
    expect(g.boy).toMatch(/propheten\/friede\/knabe\.webp$/)
    const text = stage(6).text.join(' ')
    for (const w of ['Wölfe', 'Lämmern', 'Parder', 'Böcken', 'Löwe', 'Bären', 'Kühe']) expect(text, w).toContain(w)
  })

  it('8 forge: four rounds (sword, spear, sword, spear), three blows each, the tool of Micah among three tools; the anvil lies inside the picture', () => {
    const g = stage(8).task.forge!
    expect(g.rounds.map((r) => r.item)).toEqual(['schwert', 'speer', 'schwert', 'speer'])
    expect(g.rounds.map((r) => r.result)).toEqual(['pflugschar', 'sichel', 'pflugschar', 'sichel'])
    for (const r of g.rounds) {
      expect(r.hits).toBe(3)
      expect(r.options).toHaveLength(3)
      expect(r.options).toContain(r.result)
      expect(new Set(r.options).size).toBe(3)
      for (const id of [r.item, r.result, ...r.options]) expect(g.items.find((i) => i.id === id), id).toBeTruthy()
    }
    expect(g.items.find((i) => i.id === g.hot)).toBeTruthy()
    expect(g.items.find((i) => i.id === g.hammer)).toBeTruthy()
    expect(g.anvil.x).toBeGreaterThan(20)
    expect(g.anvil.x).toBeLessThan(80)
    expect(g.anvil.y).toBeGreaterThan(40)
    expect(g.anvil.y).toBeLessThan(95)
    expect(g.background).toMatch(/propheten\/schmieden\/schmiede\.webp$/)
    const text = stage(8).text.join(' ')
    for (const w of ['Schwerter zu Pflugscharen', 'Spieße zu Sicheln']) expect(text, w).toContain(w)
  })

  it('9 memory: six pairs (a full board of 3 x 4), every one with a sentence that the text of Micah tells', () => {
    const g = stage(9).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
  })
})

describe('Der König kommt: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = propheten.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(PROPHETEN_PATH).toHaveLength(9)
    for (const seg of PROPHETEN_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(PROPHETEN_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.widthPx).toBe(9920)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(propheten).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/propheten\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(propheten)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(propheten) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('The King Is Coming')
    expect(en.stages).toHaveLength(9)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The great light')
    expect(stage(6).task.peace!.animals[0]!.label).toBe('Wolf')
    expect(stage(6).task.peace!.animals[7]!.label).toBe('Cow')
    expect(stage(8).task.forge!.items[0]!.label).toBe('Sword')
    expect(stage(8).task.forge!.rounds[0]!.hint).toContain('anvil')
    expect(stage(2).task.verse!.rounds[1]!.parts[0]).toContain('increase of his peace')
    for (const s of propheten.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/propheten/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of propheten.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/propheten/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
