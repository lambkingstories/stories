/**
 * The data of "Geschichten von Jesus" (`gleichnisse.ts`, `en/gleichnisse.en.ts`, `gleichnissePath.ts`): the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Gleichnisse/ENTWURF_Gleichnisse.md`, Luther 1912 told in our own words), the two quiz stages are only quizzes, the games follow Anton's rule of 5.11.2026
 * (at most two known games, never two in a row: Lückenvers 1 and Reihenfolge 3; the four games of that day in 2, 6, 7 and 8, checked by `@/utils/gleichnisseNeu`) and have sound data,
 * the map has twelve stations and the exam, and the English file has the same shape.
 * REBUILD of 10.11.2026: the stages 10 to 12 are now the unmerciful servant (only questions, a serious passage), the house on the rock (`baugrund`) and the great supper (`einladen`), texts of
 * `D:/Claude/Abenteuer-Gleichnisse/UMBAU-2026-11/ENTWURF_Etappen_10-12.md`; the games of 11 and 12 are checked by `@/utils/gleichnisseNeuC`. The lost son is an adventure of its own (`sohn`).
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { gleichnisse } from '@/data/adventures/gleichnisse'
import { GLEICHNISSE_PATH } from '@/data/adventures/gleichnissePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { coinProblems, digProblems } from '@/utils/gleichnisseGames'
import { carryProblems, haltProblems, innProblems, yieldProblems } from '@/utils/gleichnisseNeu'
import type { CarryGame, HaltGame, InnGame, YieldGame } from '@/utils/gleichnisseNeu'
import { groundProblems, inviteProblems, inviteSeatsOf } from '@/utils/gleichnisseNeuC'
import type { GroundGame, InviteGame } from '@/utils/gleichnisseNeuC'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => gleichnisse.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood, no devil; "tot" stays, because the father says it: "war tot und lebt wieder"). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|halbtot|Eiter|Heiligenschein)\b/i
const QUIZ_STAGES = [5, 10]
/** the stages whose pictures and recordings were made new at the rebuild of 10.11.2026 (a new file name for the cache of the phone) */
const REBUILT = [10, 11, 12]
/** the most words a stage may have (stage 10 tells two scenes; stage 12 has five short paragraphs) */
const MAX_WORDS: Record<number, number> = { 10: 225, 12: 175 }
const plain = (s: string) => s.replace(/[„“”]/g, '')

describe('Gleichnisse: stories and questions', () => {
  it('twelve stages with 3 to 5 paragraphs of 70 to 145 words (stage 10: 225, stage 12: 175) and the Bible passage under every one', () => {
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
      'Hab Geduld mit mir',
      'Das Haus auf dem Felsen',
      'Es ist noch Platz da'
    ])
    expect(gleichnisse.subtitle).toBe('Vom Sämann bis zum großen Fest')
    for (const s of gleichnisse.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Matthäus 13|Matthäus 18|Matthäus 7|Lukas 10|Lukas 15|Lukas 14),\d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(5)
      // every paragraph of the rebuilt stages is short enough to be read aloud in one breath
      if (REBUILT.includes(s.id)) for (const p of s.text) expect(p.split(/\s+/).length, `a paragraph of stage ${s.id}`).toBeLessThanOrEqual(65)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(70)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(MAX_WORDS[s.id] ?? 145)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(7)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(14)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/gleichnisse/etappe-bild-${String(s.id).padStart(2, '0')}${REBUILT.includes(s.id) ? '-v2' : ''}(-b)?\\.webp$`))
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

  it('the exam asks across the whole adventure: the sower, the mustard seed, the treasure, the Samaritan, the coin and the host of the great supper (question 6 replaced at the rebuild)', () => {
    const q = gleichnisse.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Körnern|Weg/)
    expect(q).toMatch(/Senfkorn/)
    expect(q).toMatch(/Schatz/)
    expect(q).toMatch(/überfallenen|hilft/)
    expect(q).toMatch(/Münze/)
    expect(q).toMatch(/Gastgeber/)
    expect(q).not.toMatch(/Vater|Sohn/)
    expect(gleichnisse.exam[5]!.options[0]).toBe('Mein Haus soll voll werden.')
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
    // stage 10, Matthew 18,21-34: Peter's question, the king, the debt, the plea, the pity, the second servant, the king's question (the sale of wife and children and the torturers of the Bible are left out)
    expect(t(10)).toMatch(/siebzigmal siebenmal/)
    expect(t(10)).toMatch(/König/)
    expect(t(10)).toMatch(/zehntausend Pfund/)
    expect(t(10)).toMatch(/hundert Groschen/)
    expect(t(10)).toMatch(/Hab Geduld mit mir/)
    expect(t(10)).toMatch(/vergibt ihm alle Schulden/)
    expect(t(10)).toMatch(/Hättest du nicht auch Mitleid/)
    expect(t(10)).toMatch(/Gefängnis/)
    expect(t(10)).not.toMatch(/Frau|Kinder|Peiniger|würgt/)
    // stage 11, Matthew 7,24-29: two men, the rock, the sand, rain, water and wind, the house stands or falls, hearing and doing, the people are amazed
    expect(t(11)).toMatch(/zwei Männern/)
    expect(t(11)).toMatch(/Felsen/)
    expect(t(11)).toMatch(/Sand/)
    expect(t(11)).toMatch(/Regen, Wasser kommt heran, und der Wind/)
    expect(t(11)).toMatch(/stürzt es ein/)
    expect(t(11)).toMatch(/hört und tut/)
    expect(t(11)).toMatch(/staunen/)
    expect(t(11)).not.toMatch(/Sturm|Blitz|Donner|Flut/)
    // stage 12, Luke 14,15-23: the supper, the three excuses, the streets and lanes, the poor, the lame and the blind, there is still room, highways and fences, the house shall be full
    expect(t(12)).toMatch(/Festessen/)
    expect(t(12)).toMatch(/Kommt, es ist alles bereit/)
    expect(t(12)).toMatch(/Acker gekauft/)
    expect(t(12)).toMatch(/fünf Paar Ochsen/)
    expect(t(12)).toMatch(/geheiratet/)
    expect(t(12)).toMatch(/Straßen und Gassen/)
    expect(t(12)).toMatch(/Armen, die Lahmen und die Blinden/)
    expect(t(12)).toMatch(/noch Platz da/)
    expect(t(12)).toMatch(/Landstraßen und an die Zäune/)
    expect(t(12)).toMatch(/Mein Haus soll voll werden/)
    const all = gleichnisse.stages.map((s) => s.text.join(' ')).join(' ')
    // the angels are only a word in the Bible (Luke 15,10, stage 9); the evil one and the trouble of Matthew 13 have no shape in the text
    expect(gleichnisse.stages.filter((s) => /Engel/.test(s.text.join(' '))).map((s) => s.id)).toEqual([9])
    expect(all).not.toMatch(/Teufel|Heiligenschein|Legion|Ketten|Arge|Huren|Prassen|geschlagen/)
  })
})

describe('Gleichnisse: the games', () => {
  it('the order of the games (Anton 5.11.2026): 2 known (Lückenvers, Reihenfolge, not in a row), 8 new, 2 quizzes; no game twice in a row', () => {
    const kinds = gleichnisse.stages.map((s) => s.task.kind as string)
    expect(kinds).toEqual(['lueckenvers', 'hundertfach', 'reihenfolge', 'graben', 'quiz', 'anhalten', 'herberge', 'heimtragen', 'muenze', 'quiz', 'baugrund', 'einladen'])
    for (let i = 1; i < kinds.length; i++) expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
    const known = kinds.map((k, i) => (['lueckenvers', 'reihenfolge'].includes(k) ? i : -1)).filter((i) => i >= 0)
    expect(known).toEqual([0, 2])
    expect(kinds.filter((k) => ['hundertfach', 'graben', 'anhalten', 'herberge', 'heimtragen', 'muenze', 'baugrund', 'einladen'].includes(k))).toHaveLength(8)
    // the old games of the lost son are not used any more (they stay in the repo for the adventure `sohn`)
    expect(kinds).not.toContain('heimweg')
    expect(kinds).not.toContain('entgegen')
    expect(JSON.stringify(gleichnisse.stages.map((s) => s.task))).not.toMatch(/spiele\/gleichnisse\/(heimweg|entgegen)\//)
  })

  it('1 verse: two rounds, the sentences stand word for word in the text of the stage, the right words are on the leaves', () => {
    for (const n of [1]) {
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

  it('2, 6, 7, 8: the four games of 5.11.2026 can be played (all checkers say nothing), with two rounds each and the pictures of their folders', () => {
    const t = (n: number) => stage(n).task as unknown as Record<string, unknown>
    const y = t(2).yieldGame as YieldGame
    expect(yieldProblems(y)).toEqual([])
    expect(y.field).toMatch(/gleichnisse\/hundertfach\/acker\.webp$/)
    expect(y.rounds.map((r) => !!r.ordered)).toEqual([false, true])
    const h = t(6).halt as HaltGame
    expect(haltProblems(h)).toEqual([])
    expect(h.background).toMatch(/gleichnisse\/anhalten\/strasse\.webp$/)
    const inn = t(7).inn as InnGame
    expect(innProblems(inn)).toEqual([])
    expect(inn.background).toMatch(/gleichnisse\/herberge\/weg\.webp$/)
    const c = t(8).carryHome as CarryGame
    expect(carryProblems(c)).toEqual([])
    expect(c.hero.image).toMatch(/gleichnisse\/heimtragen\/hirte\.webp$/)
    for (const g of [y, h, inn, c]) expect(g.rounds).toHaveLength(2)
  })

  it('9 coin: two rounds, the first without things that look like a coin, the second with two (a lid, a pebble); the data can be played', () => {
    const g = stage(9).task.coin!
    expect(g.rounds).toHaveLength(2)
    expect(coinProblems(g)).toEqual([])
    expect(g.rounds[0]!.decoys ?? []).toHaveLength(0)
    expect(g.rounds[1]!.decoys!.map((d) => d.kind).sort()).toEqual(['lid', 'pebble'])
    expect(g.rounds.map((r) => r.room)).toEqual(['raum-1', 'raum-2'].map((n) => `images/abenteuer/spiele/gleichnisse/muenze/${n}.webp`))
  })

  it('11 ground: two rounds (4 plots with 1 rock and as many knocks as one likes; 6 plots with 2 hidden rocks and 4 knocks); the data can be played; the pictures lie in the folder baugrund', () => {
    const g = (stage(11).task as unknown as { ground: GroundGame }).ground
    expect(g.rounds).toHaveLength(2)
    expect(groundProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.plots.length)).toEqual([4, 6])
    expect(g.rounds.map((r) => r.plots.filter((p) => p.ground === 'rock').length)).toEqual([1, 2])
    expect(g.rounds.map((r) => r.knocks)).toEqual([undefined, 4])
    expect(g.rounds.map((r) => r.mark)).toEqual([true, false])
    expect(g.rounds[1]!.plots.filter((p) => p.ground === 'rock').every((p) => p.hidden)).toBe(true)
    expect(g.background).toMatch(/gleichnisse\/baugrund\/tal\.webp$/)
    for (const [k, s] of Object.entries(g.sprites)) expect(s.image, k).toMatch(/gleichnisse\/baugrund\/[a-z-]+\.webp$/)
    expect(g.sprites.tilted.image).toMatch(/haus-schief\.webp$/)
  })

  it('12 invite: two rounds (6 guests, 5 places, two at once; 5 guests with the pair behind hedges and fences, 6 places, three at once); the twelve places of the table are all taken in the end; the data can be played', () => {
    const g = (stage(12).task as unknown as { invite: InviteGame }).invite
    expect(g.rounds).toHaveLength(2)
    expect(inviteProblems(g)).toEqual([])
    expect(g.tableSeats).toHaveLength(12)
    expect(g.rounds.map((r) => r.guests.length)).toEqual([6, 5])
    expect(g.rounds.map((r) => r.spots.length)).toEqual([5, 6])
    expect(g.rounds.map((r) => inviteSeatsOf(g, r))).toEqual([6, 6])
    expect(g.rounds.map((r) => r.atOnce)).toEqual([2, 3])
    expect(g.rounds.map((r) => r.show)).toEqual([5000, 3500])
    expect(g.sprites.pair!.seats).toBe(2)
    expect(g.rounds[1]!.guests.map((x) => x.sprite)).toContain('pair')
    expect(g.rounds[1]!.guests.every((x) => x.hidden)).toBe(true)
    expect(g.rounds[0]!.guests.some((x) => x.hidden)).toBe(false)
    expect(g.rounds.map((r) => r.scene)).toEqual(['stadt', 'land'].map((n) => `images/abenteuer/spiele/gleichnisse/einladen/${n}.webp`))
    expect(g.table.image).toMatch(/einladen\/tafel\.webp$/)
    expect(g.servant.image).toMatch(/einladen\/diener\.webp$/)
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
    const en = englishTextsOf(gleichnisse) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string; subtitle: string }
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
    expect(en.subtitle).toBe('From the Sower to the Great Feast')
    expect(stage(10).title).toBe('Have Patience with Me')
    expect(stage(10).questions[0]!.options[0]).toBe('seventy times seven')
    const ground = (stage(11).task as unknown as { ground: GroundGame }).ground
    expect(ground.rounds[0]!.hint).toContain('Knock on the ground')
    expect(ground.rounds[1]!.hint).toContain('only have four knocks')
    expect(ground.sprites.tilted.label).toContain('tilted')
    const invite = (stage(12).task as unknown as { invite: InviteGame }).invite
    expect(invite.rounds[1]!.hint).toContain('behind a hedge')
    expect(invite.sprites.g1!.wait.label).toBe('A woman with a basket waves')
    expect(invite.servant.label).toBe('The servant of the host waves')
    expect(stage(12).questions[0]!.options[0]).toBe('“Come, for all things are now ready!”')
    expect(gleichnisse.exam[5]!.options[0]).toBe('My house shall be full.')
    expect((stage(2).task as unknown as { yieldGame: YieldGame }).yieldGame.rounds[1]!.hint).toContain('a hundred grains')
    expect((stage(6).task as unknown as { halt: HaltGame }).halt.man.label).toBe('The man who was robbed')
    expect(stage(1).task.verse!.rounds[0]!.parts[0]).toContain('Some seeds fell by the road')
    // the rebuilt stages 10 to 12 have recordings with the name "-v2" (a new name for the cache of the phone), the others "-v1"
    const ver = (id: number) => (REBUILT.includes(id) ? 'v2' : 'v1')
    for (const s of gleichnisse.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/gleichnisse/geschichte-${String(s.id).padStart(2, '0')}-en-${ver(s.id)}.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of gleichnisse.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/gleichnisse/geschichte-${String(s.id).padStart(2, '0')}-${ver(s.id)}.mp3`)
    }
  })

  it('the English verses stand word for word in the English texts of the stages', () => {
    const en = englishTextsOf(gleichnisse) as { stages: { text: string[]; task?: { verse?: { rounds: { parts: string[]; words: string[] }[] } } }[] }
    for (const n of [1]) {
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
