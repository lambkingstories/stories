/**
 * The data of "Geschichten von Jesus" (`gleichnisse.ts`, `en/gleichnisse.en.ts`, `gleichnissePath.ts`): the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Gleichnisse/ENTWURF_Gleichnisse.md`, Luther 1912 told in our own words), the two quiz stages are only quizzes, the three new games and the seven old ones have sound data,
 * the map has twelve stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { gleichnisse } from '@/data/adventures/gleichnisse'
import { GLEICHNISSE_PATH } from '@/data/adventures/gleichnissePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { coinProblems, digProblems, meetProblems } from '@/utils/gleichnisseGames'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => gleichnisse.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood, no devil; "tot" stays, because the father says it: "war tot und lebt wieder"). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|halbtot|Eiter|Heiligenschein)\b/i
const QUIZ_STAGES = [5, 12]
const plain = (s: string) => s.replace(/[„“”]/g, '')

describe('Gleichnisse: stories and questions', () => {
  it('twelve stages with 3 or 4 paragraphs of 70 to 145 words and the Bible passage under every one', () => {
    expect(gleichnisse.id).toBe('gleichnisse')
    expect(gleichnisse.age).toBe('8-10')
    expect(gleichnisse.title).toBe('Geschichten von Jesus')
    expect(gleichnisse.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(gleichnisse.stages.map((s) => s.title)).toEqual([
      'Der Sämann geht aufs Feld',
      'Wer Ohren hat',
      'Das kleinste Korn',
      'Der Schatz im Acker',
      'Wer ist mein Nächster?',
      'Sie gehen vorbei',
      'Pflege ihn',
      'Das verlorene Schaf',
      'Die verlorene Münze',
      'Ich will mich aufmachen',
      'Der Vater läuft ihm entgegen',
      'Der ältere Bruder'
    ])
    for (const s of gleichnisse.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Matthäus 13|Lukas 10|Lukas 15),\d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(70)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(145)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(7)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(14)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/gleichnisse/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of gleichnisse.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...gleichnisse.stages.flatMap((s) => s.questions), ...gleichnisse.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?') || q.q.trim().endsWith('.'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(gleichnisse.exam).toHaveLength(6)
    const asked = gleichnisse.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(gleichnisse.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei'])
    for (const s of gleichnisse.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the sower, the mustard seed, the treasure, the Samaritan, the coin and the father', () => {
    const q = gleichnisse.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Körnern|Weg/)
    expect(q).toMatch(/Senfkorn/)
    expect(q).toMatch(/Schatz/)
    expect(q).toMatch(/überfallenen|hilft/)
    expect(q).toMatch(/Münze/)
    expect(q).toMatch(/Vater/)
  })

  it('the two quiz stages (5, 12) are only quizzes, never two in a row', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    const kinds = gleichnisse.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); nothing is told that the Bible does not say', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Boot/)
    expect(t(1)).toMatch(/Ein Sämann ging aufs Feld/)
    expect(t(1)).toMatch(/Vögel/)
    expect(t(1)).toMatch(/Dornen/)
    expect(t(1)).toMatch(/gutes Land/)
    expect(t(2)).toMatch(/Wer Ohren hat/)
    expect(t(2)).toMatch(/Same ist das Wort/)
    expect(t(2)).toMatch(/Dornen/)
    expect(t(3)).toMatch(/Senfkorn/)
    expect(t(3)).toMatch(/kleinste/)
    expect(t(3)).toMatch(/Baum/)
    expect(t(3)).toMatch(/Sauerteig/)
    expect(t(4)).toMatch(/Schatz/)
    expect(t(4)).toMatch(/Acker/)
    expect(t(4)).toMatch(/Perle/)
    expect(t(5)).toMatch(/Schriftgelehrte/)
    expect(t(5)).toMatch(/wer ist mein Nächster/)
    expect(t(5)).toMatch(/Jericho/)
    expect(t(5)).toMatch(/Räuber/)
    expect(t(6)).toMatch(/Priester/)
    expect(t(6)).toMatch(/Levit/)
    expect(t(6)).toMatch(/Samariter/)
    expect(t(6)).toMatch(/Mitleid/)
    expect(t(6)).toMatch(/Öl und Wein/)
    expect(t(7)).toMatch(/Herberge/)
    expect(t(7)).toMatch(/zwei Silbermünzen/)
    expect(t(7)).toMatch(/Pflege ihn/)
    expect(t(7)).toMatch(/geh hin und tu das auch/)
    expect(t(8)).toMatch(/Zöllner/)
    expect(t(8)).toMatch(/hundert Schafe/)
    expect(t(8)).toMatch(/neunundneunzig/)
    expect(t(8)).toMatch(/Schultern/)
    expect(t(8)).toMatch(/Freut euch mit mir/)
    expect(t(9)).toMatch(/zehn Silbermünzen/)
    expect(t(9)).toMatch(/Licht an/)
    expect(t(9)).toMatch(/kehrt das ganze Haus/)
    expect(t(9)).toMatch(/Freut euch mit mir/)
    expect(t(10)).toMatch(/zwei Söhne/)
    expect(t(10)).toMatch(/Erbe/)
    expect(t(10)).toMatch(/Schweine/)
    expect(t(10)).toMatch(/Ich will mich aufmachen/)
    expect(t(11)).toMatch(/läuft/)
    expect(t(11)).toMatch(/um den Hals/)
    expect(t(11)).toMatch(/Kleid/)
    expect(t(11)).toMatch(/Ring/)
    expect(t(11)).toMatch(/Schuhe/)
    expect(t(11)).toMatch(/war tot und lebt wieder/)
    expect(t(12)).toMatch(/Musik/)
    expect(t(12)).toMatch(/zornig/)
    expect(t(12)).toMatch(/du bist immer bei mir/)
    const all = gleichnisse.stages.map((s) => s.text.join(' ')).join(' ')
    // the angels are only a word in the Bible (Luke 15,10, stage 9); the evil one and the trouble of Matthew 13 have no shape in the text
    expect(gleichnisse.stages.filter((s) => /Engel/.test(s.text.join(' '))).map((s) => s.id)).toEqual([9])
    expect(all).not.toMatch(/Teufel|Heiligenschein|Legion|Ketten|Arge|Huren|Prassen|geschlagen/)
  })
})

describe('Gleichnisse: the games', () => {
  it('the order of the games: 7 old, 3 new (graben, muenze, entgegen), 2 quizzes; no game twice in a row', () => {
    expect(gleichnisse.stages.map((s) => s.task.kind)).toEqual(['lueckenvers', 'wimmelbild', 'reihenfolge', 'graben', 'quiz', 'puzzle', 'memory', 'weg', 'muenze', 'lueckenvers', 'entgegen', 'quiz'])
    const kinds = gleichnisse.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    expect(kinds.filter((k) => ['graben', 'muenze', 'entgegen'].includes(k!))).toHaveLength(3)
  })

  it('1 and 10 verse: two rounds each, the sentences stand word for word in the text of the stage, the right words are on the leaves', () => {
    for (const n of [1, 10]) {
      const g = stage(n).task.verse!
      expect(g.rounds, `stage ${n}`).toHaveLength(2)
      const text = plain(stage(n).text.join(' '))
      for (const r of g.rounds) {
        expect(r.parts).toHaveLength(r.answers.length + 1)
        for (const a of r.answers) expect(r.words[a]).toBeTruthy()
        let sentence = r.parts[0]!
        r.answers.forEach((a, k) => {
          sentence += r.words[a] + r.parts[k + 1]
        })
        expect(text, `stage ${n}: "${sentence}"`).toContain(plain(sentence))
      }
      expect(g.rounds.map((r) => r.answers.length)).toEqual([1, 2])
    }
    expect(stage(1).task.verse!.rounds[0]!.words[0]).toBe('Vögel')
    expect(stage(10).task.verse!.rounds[0]!.words[0]).toBe('Brot')
  })

  it('2 hidden pictures: the four things of the sower (bird, rock, thorn bush, ear), covers, every place inside the picture', () => {
    const t = stage(2).task
    expect(t.kind).toBe('wimmelbild')
    expect(t.count).toBe(4)
    const f = t.find!
    expect(f.finds).toHaveLength(4)
    expect(f.labels).toHaveLength(4)
    expect(f.covers.length).toBeGreaterThanOrEqual(6)
    for (const s of [...f.finds, ...f.covers]) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(101)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(f.labels!.join(' ')).toMatch(/Vogel/)
    expect(f.labels!.join(' ')).toMatch(/Fels/)
    expect(f.labels!.join(' ')).toMatch(/Dornenbusch/)
    expect(f.labels!.join(' ')).toMatch(/Ähre/)
  })

  it('3 order: four cards in the order of the story (seed, sprout, bush, tree); round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(3).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['korn', 'spross', 'strauch', 'baum'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['korn', 'spross', 'strauch', 'baum'])
  })

  it('4 dig: two rounds (the field, the pearl); the data can be played; twelve mounds in a 4 x 3 grid, five pearls, the best one first', () => {
    const g = stage(4).task.dig!
    expect(g.rounds.map((r) => r.kind)).toEqual(['field', 'pearls'])
    expect(digProblems(g)).toEqual([])
    expect(g.rounds[0]!.cells).toHaveLength(12)
    expect(g.pearls).toHaveLength(5)
    expect(g.pearls[0]!.w).toBeGreaterThan(g.pearls[1]!.w)
    expect(g.field).toMatch(/gleichnisse\/graben\/acker\.webp$/)
    expect(g.stall).toMatch(/gleichnisse\/graben\/stand\.webp$/)
    expect(g.pearls[0]!.image).toMatch(/graben\/perle-1\.webp$/)
  })

  it('6 puzzle: a picture in 2 columns and 3 rows', () => {
    const g = stage(6).task.puzzle!
    expect(g.cols).toBe(2)
    expect(g.rows).toBe(3)
    expect(g.image).toMatch(/puzzle\/strasse\.webp$/)
  })

  it('7 memory: six pairs with a sentence each, in the order oil jug, wine skin, bandage, donkey, inn, two coins', () => {
    const g = stage(7).task.memory!
    expect(g.pairs).toHaveLength(6)
    for (const p of g.pairs) expect(p.text.length).toBeGreaterThan(10)
    expect(g.pairs.map((p) => p.text.split(':')[0])).toEqual(['Der Ölkrug', 'Der Weinschlauch', 'Die Verbandsrolle', 'Der Esel', 'Die Herberge', 'Die zwei Silbermünzen'])
    expect(g.pairs.map((p) => p.image)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `images/abenteuer/spiele/gleichnisse/memory/karte-${n}.webp`))
  })

  it('8 way: three forks without signs, each with three ways, the right way on the left, in the middle and on the right', () => {
    const g = stage(8).task.way!
    expect(g.scenes).toHaveLength(3)
    expect(g.scenes.map((s) => s.paths)).toEqual([3, 3, 3])
    expect(g.scenes.map((s) => s.goal)).toEqual(['left', 'middle', 'right'])
    expect(g.walker).toMatch(/weg\/hirte\.webp$/)
    expect(g.texts!.hint).toContain('{n}')
    expect(g.texts!.hint).toContain('{total}')
  })

  it('9 coin: two rounds, the first without things that look like a coin, the second with two (a lid, a pebble); the data can be played', () => {
    const g = stage(9).task.coin!
    expect(g.rounds).toHaveLength(2)
    expect(coinProblems(g)).toEqual([])
    expect(g.rounds[0]!.decoys ?? []).toHaveLength(0)
    expect(g.rounds[1]!.decoys!.map((d) => d.kind).sort()).toEqual(['lid', 'pebble'])
    expect(g.rounds.map((r) => r.room)).toEqual(['raum-1', 'raum-2'].map((n) => `images/abenteuer/spiele/gleichnisse/muenze/${n}.webp`))
  })

  it('11 meet: a run and the gifts; twelve steps; the father stops between the son and the gate; robe, ring and shoes', () => {
    const g = stage(11).task.meet!
    expect(g.rounds.map((r) => r.kind)).toEqual(['run', 'gifts'])
    expect(meetProblems(g)).toEqual([])
    expect(g.steps).toBe(12)
    expect(g.gifts.map((x) => x.id)).toEqual(['kleid', 'ring', 'schuhe'])
    expect(g.road).toMatch(/entgegen\/weg\.webp$/)
    expect(g.yard).toMatch(/entgegen\/hof\.webp$/)
  })
})

describe('Gleichnisse: map, files, English', () => {
  it('twelve stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = gleichnisse.map
    expect(m.stages).toHaveLength(12)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(GLEICHNISSE_PATH).toHaveLength(12)
    for (const seg of GLEICHNISSE_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(GLEICHNISSE_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.widthPx).toBe(9920)
    expect(m.images).toHaveLength(3)
  })

  it('the music: three pieces of its own, the German recordings have one name for each stage', () => {
    expect(gleichnisse.music).toEqual(['musik-acker-v1.mp3', 'musik-strasse-v1.mp3', 'musik-fest-v1.mp3'].map((f) => `audio/abenteuer/gleichnisse/${f}`))
    expect(gleichnisse.medal).toMatch(/^images\/abenteuer\/gleichnisse\/medaille-v\d\.webp$/)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`; the recordings and the music are not checked here, they come later)', () => {
    const missing = journeyFiles(gleichnisse).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/gleichnisse\/(geschichte|musik)/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(gleichnisse)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(gleichnisse) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('Stories of Jesus')
    expect(en.stages).toHaveLength(12)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The Sower Goes Out')
    expect(stage(4).task.dig!.rounds[0]!.hint).toContain('Dig for the treasure')
    expect(stage(4).task.dig!.chest.label).toBe('A chest with an iron band')
    expect(stage(9).task.coin!.rounds[0]!.hint).toContain('Light the lamp')
    expect(stage(9).task.coin!.lamp.label).toBe('The little oil lamp')
    expect(stage(11).task.meet!.rounds[1]!.hint).toContain('robe')
    expect(stage(11).task.meet!.gifts.map((g) => g.label)).toEqual(['The robe', 'The ring', 'The shoes'])
    expect(stage(8).task.way!.texts!.hint).toContain('Fork {n} of {total}')
    expect(stage(1).task.verse!.rounds[0]!.parts[0]).toContain('Some seeds fell by the road')
    expect(stage(7).task.memory!.pairs[0]!.text).toContain('jug of oil')
    expect(stage(2).task.find!.labels![0]).toBe('The bird on the road')
    for (const s of gleichnisse.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/gleichnisse/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of gleichnisse.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/gleichnisse/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })

  it('the English verses stand word for word in the English texts of the stages', () => {
    const en = englishTextsOf(gleichnisse) as { stages: { text: string[]; task?: { verse?: { rounds: { parts: string[]; words: string[] }[] } } }[] }
    for (const n of [1, 10]) {
      const e = en.stages[n - 1]!
      const text = plain(e.text.join(' '))
      const de = stage(n).task.verse!
      e.task!.verse!.rounds.forEach((r, k) => {
        let sentence = r.parts[0]!
        de.rounds[k]!.answers.forEach((a, i) => {
          sentence += r.words[a] + r.parts[i + 1]
        })
        expect(text, `stage ${n}: "${sentence}"`).toContain(plain(sentence))
      })
    }
  })
})
