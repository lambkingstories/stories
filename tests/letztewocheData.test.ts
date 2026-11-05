/**
 * The data of "Die letzte Woche" (`letztewoche.ts`, `en/letztewoche.en.ts`, `letztewochePath.ts`): the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-LetzteWoche/ENTWURF_LetzteWoche.md`, Luther 1912 told in our own words), the five stages of the passion (7 to 11) are only told and asked (quiz), the three new games
 * and the four old ones have sound data, the map has twelve stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { letztewoche } from '@/data/adventures/letztewoche'
import { LETZTEWOCHE_PATH } from '@/data/adventures/letztewochePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { helpProblems, lampProblems, prepareProblems } from '@/utils/letzteWocheGames'
import { commandCardsOf, commandKindOf, commandProblems } from '@/utils/letztewocheNeu'
import type { CommandGame } from '@/utils/letztewocheNeu'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => letztewoche.stages[n - 1]!
/** Words that no text of the German data may use. "Blut" stands once, in the words of Jesus over the cup (stage 6). The passion is told without any detail of the suffering. */
const FORBIDDEN = /\b(Teufel|Hölle|Leiche|Leichen|Leichnam|Nägel|Nagel|Dornen|Dornenkrone|Peitsche|Peitschen|Geißel|Geißelung|Wunde|Wunden|Fesseln|gefesselt|blutet|blutig|Heiligenschein)\b/i
const BLOOD = /\bBlut\b/i
const QUIZ_STAGES = [7, 8, 9, 10, 11, 12]

describe('Die letzte Woche: stories and questions', () => {
  it('twelve stages with 3 or 4 paragraphs of 70 to 160 words and the Bible passage under every one', () => {
    expect(letztewoche.id).toBe('letztewoche')
    expect(letztewoche.age).toBe('8-10')
    expect(letztewoche.title).toBe('Die letzte Woche')
    expect(letztewoche.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    for (const s of letztewoche.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^Matthäus 2[1-7]/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(70)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(160)
      const sentences = text.split(/[.!?]+["“”„]?\s+/).filter((x) => x.trim()).length
      expect(words / sentences, `words per sentence ${s.id}`).toBeGreaterThan(6)
      expect(words / sentences, `words per sentence ${s.id}`).toBeLessThan(15)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      if (s.id !== 6) expect(text, `stage ${s.id}`).not.toMatch(BLOOD)
      expect(s.image, `stage ${s.id}`).toMatch(new RegExp(`^images/abenteuer/letztewoche/etappe-bild-${String(s.id).padStart(2, '0')}(-b)?\\.webp$`))
    }
    expect(letztewoche.stages.map((s) => s.ref.split(',')[0])).toEqual(['Matthäus 21', 'Matthäus 21', 'Matthäus 22', 'Matthäus 25', 'Matthäus 25', 'Matthäus 26', 'Matthäus 26', 'Matthäus 26', 'Matthäus 26', 'Matthäus 27', 'Matthäus 27', 'Matthäus 27'])
  })

  it('the word "Blut" stands exactly once, in the words of Jesus over the cup (stage 6)', () => {
    const all = letztewoche.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all.match(/\bBlut\b/gi)).toHaveLength(1)
    expect(stage(6).text.join(' ')).toMatch(/Das ist mein Blut des neuen Bundes/)
    // the questions and answers do not use any of the forbidden words either
    for (const s of letztewoche.stages) for (const q of s.questions) expect(`${q.q} ${q.options.join(' ')}`, `stage ${s.id}`).not.toMatch(FORBIDDEN)
  })

  it('three questions in the six quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of letztewoche.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...letztewoche.stages.flatMap((s) => s.questions), ...letztewoche.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?') || q.q.trim().endsWith('.'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(letztewoche.exam).toHaveLength(6)
    const asked = letztewoche.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(letztewoche.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei', 'ihn'])
    for (const s of letztewoche.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the entry, the lamps, the help, the supper, the rooster and the grave', () => {
    const q = letztewoche.exam.map((x) => `${x.q} ${x.options[0]}`).join(' ')
    expect(q).toMatch(/Mäntel/)
    expect(q).toMatch(/Öl/)
    expect(q).toMatch(/besucht/)
    expect(q).toMatch(/Silbermünzen/)
    expect(q).toMatch(/Hahn/)
    expect(q).toMatch(/Josef/)
  })

  it('the five stages of the passion (7 to 11) and the grave (12) are only quizzes; no game is played twice in a row (the quiz stages follow one another by design)', () => {
    expect(stage(12).task.hint).toBe('Diese Etappe ist ernst. Höre gut zu und beantworte die Fragen.')
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    const kinds = letztewoche.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) if (kinds[i] !== 'quiz') expect(kinds[i], `same game in a row at ${i + 1}`).not.toBe(kinds[i - 1])
  })

  it('the key words of the Bible are there (Luther 1912, told in our own words)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Ölberg/)
    expect(t(1)).toMatch(/Eselin/)
    expect(t(1)).toMatch(/Hosianna dem Sohn Davids/)
    expect(t(1)).toMatch(/Dein König kommt zu dir/)
    expect(t(2)).toMatch(/Tauben/)
    expect(t(2)).toMatch(/Haus des Gebets/)
    expect(t(2)).toMatch(/Räuberhöhle/)
    expect(t(3)).toMatch(/Du sollst deinen Nächsten lieben wie dich selbst/)
    expect(t(3)).toMatch(/von ganzem Herzen/)
    expect(t(4)).toMatch(/Bräutigam/)
    expect(t(4)).toMatch(/Öl/)
    expect(t(4)).toMatch(/Darum wacht/)
    expect(t(5)).toMatch(/ich war hungrig/)
    expect(t(5)).toMatch(/Das Reich ist für euch bereit/)
    expect(t(5)).toMatch(/geringsten Brüdern/)
    expect(t(6)).toMatch(/dreißig Silbermünzen/)
    expect(t(6)).toMatch(/Einer von euch wird mich verraten/)
    expect(t(6)).toMatch(/das ist mein Leib/)
    expect(t(7)).toMatch(/Gethsemane/)
    expect(t(7)).toMatch(/nicht, wie ich will, sondern wie du willst/)
    expect(t(7)).toMatch(/Steht auf, wir gehen/)
    expect(t(8)).toMatch(/Wen ich küsse/)
    expect(t(8)).toMatch(/Steck dein Schwert weg/)
    expect(t(9)).toMatch(/Ich kenne den Menschen nicht/)
    expect(t(9)).toMatch(/Da kräht ein Hahn/)
    expect(t(9)).toMatch(/weint bitterlich/)
    expect(t(10)).toMatch(/Barabbas/)
    expect(t(10)).toMatch(/bringen die Hohenpriester und Ältesten Jesus/)
    expect(t(10)).toMatch(/unschuldig am Tod dieses Gerechten/)
    expect(t(11)).toMatch(/Golgatha/)
    expect(t(11)).toMatch(/Kyrene/)
    expect(t(11)).toMatch(/Mein Gott, mein Gott, warum hast du mich verlassen/)
    expect(t(11)).toMatch(/Wirklich, dieser war Gottes Sohn/)
    expect(t(12)).toMatch(/Arimatäa/)
    expect(t(12)).toMatch(/Leinentuch/)
    expect(t(12)).toMatch(/versiegeln den Stein/)
    // the story ends at the threshold of Easter: nothing of the resurrection is told here
    expect(t(12)).not.toMatch(/auferstanden|Engel|leer/)
  })
})

describe('Die letzte Woche: the games', () => {
  it('the order of the games (Anton 5.11.2026): 2 old (wimmelbild, reihenfolge, not in a row), 4 new (bereiten, gebote, lampen, helfen), 6 quizzes (passion and grave)', () => {
    expect(letztewoche.stages.map((s) => s.task.kind as string)).toEqual(['bereiten', 'wimmelbild', 'gebote', 'lampen', 'helfen', 'reihenfolge', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz'])
  })

  it('1 prepare: five bare places, round 1 with three and round 2 with five (the donkey goes on slowly); the data can be played; the pictures come from the data', () => {
    const g = stage(1).task.prepare!
    expect(prepareProblems(g)).toEqual([])
    expect(g.spots).toHaveLength(5)
    expect(g.rounds.map((r) => r.fields)).toEqual([3, 5])
    expect(g.rounds.map((r) => !!r.slow)).toEqual([false, true])
    expect(g.cloaks).toHaveLength(3)
    expect(g.branches).toHaveLength(2)
    expect(g.road).toBe('images/abenteuer/spiele/letztewoche/bereiten/strasse.webp')
    expect([g.donkey.image, g.stone.image, g.crowd.image, g.gate.image]).toEqual(['eselin', 'stein', 'menschen', 'tor'].map((f) => `images/abenteuer/spiele/letztewoche/bereiten/${f}.webp`))
  })

  it('2 hidden pictures: Jesus, a child, a dove seller and a blind man, covers, every place inside the picture', () => {
    const t = stage(2).task
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
    expect(f.labels!.join(' ')).toMatch(/Jesus/)
    expect(f.labels!.join(' ')).toMatch(/Kind/)
    expect(f.labels!.join(' ')).toMatch(/Taubenhändler/)
    expect(f.labels!.join(' ')).toMatch(/Blinder/)
    expect(f.scene).toBe('images/abenteuer/spiele/letztewoche/wimmel/szene.webp')
  })

  it('3 two halves: the data can be played; six pictures, three for each commandment; round 1 two pictures, round 2 four; the pictures come from the data', () => {
    const g = (stage(3).task as unknown as { commandment: CommandGame }).commandment
    expect(commandProblems(g)).toEqual([])
    expect(g.cards.filter((c) => c.kind === 'god')).toHaveLength(3)
    expect(g.cards.filter((c) => c.kind === 'neighbor')).toHaveLength(3)
    expect(g.rounds.map((r) => commandCardsOf(r).length)).toEqual([2, 4])
    for (const r of g.rounds) expect(new Set(commandCardsOf(r).map((c) => commandKindOf(g, c)))).toEqual(new Set(['god', 'neighbor']))
    expect(g.heart.image).toBe('images/abenteuer/spiele/letztewoche/gebote/herz.webp')
    for (const c of g.cards) expect(c.image).toBe(`images/abenteuer/spiele/letztewoche/gebote/${c.id}.webp`)
  })

  it('4 lamps: two rounds of three lamps, the second narrower; the data can be played; the pictures come from the data', () => {
    const g = stage(4).task.lamps!
    expect(lampProblems(g)).toEqual([])
    expect(g.rounds.map((r) => r.marks.length)).toEqual([3, 3])
    expect(g.rounds[1]!.tolerance ?? 7).toBeLessThanOrEqual(7)
    expect(g.night).toBe('images/abenteuer/spiele/letztewoche/lampen/nacht.webp')
    expect(g.row).toBe('images/abenteuer/spiele/letztewoche/lampen/lampen-reihe.webp')
    expect([g.lamp.image, g.lit.image, g.out.image, g.oil.image, g.mark.image, g.jug.image]).toEqual(['lampe', 'lampe-brennt', 'lampe-aus', 'oel', 'marke', 'krug'].map((f) => `images/abenteuer/spiele/letztewoche/lampen/${f}.webp`))
  })

  it('5 help: six people with six cards, round 1 hungry, thirsty, stranger and round 2 freezing, sick, prisoner; the data can be played', () => {
    const g = stage(5).task.help!
    expect(helpProblems(g)).toEqual([])
    expect(g.people.map((p) => p.id)).toEqual(['hunger', 'durst', 'fremd', 'frieren', 'krank', 'gefangen'])
    expect(g.rounds.map((r) => r.people)).toEqual([
      ['hunger', 'durst', 'fremd'],
      ['frieren', 'krank', 'gefangen']
    ])
    expect(g.village).toBe('images/abenteuer/spiele/letztewoche/helfen/dorf.webp')
    expect(new Set(g.people.map((p) => p.card)).size).toBe(6)
    for (const p of g.people) expect(p.glad).toBe(p.image.replace('.webp', '-froh.webp'))
  })

  it('6 order: four cards in the order of the story (table, meal, bread, Mount of Olives); round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(6).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['tisch', 'mahl', 'brot', 'oelberg'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['tisch', 'mahl', 'brot', 'oelberg'])
  })

  it('12 the grave: no game, three questions about the text (the third: the guard at the grave, Matthew 27,64-66)', () => {
    const t = stage(12).task as unknown as Record<string, unknown>
    expect(t.kind).toBe('quiz')
    expect(Object.keys(t).sort()).toEqual(['hint', 'kind'])
    expect(stage(12).questions.map((q) => q.options[0])).toEqual(['Josef aus Arimatäa', 'in sein eigenes Grab im Felsen', 'Sie lassen das Grab bewachen.'])
    expect(stage(12).text.join(' ')).toMatch(/Lass das Grab bewachen/)
  })
})

describe('Die letzte Woche: map, files, English', () => {
  it('twelve stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = letztewoche.map
    expect(m.stages).toHaveLength(12)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(LETZTEWOCHE_PATH).toHaveLength(12)
    for (const seg of LETZTEWOCHE_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(LETZTEWOCHE_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.images).toHaveLength(3)
  })

  it('the music: three pieces of its own, the medal and the gift lie in the folder of the adventure', () => {
    expect(letztewoche.music).toEqual(['musik-einzug-v1.mp3', 'musik-garten-v1.mp3', 'musik-grab-v1.mp3'].map((f) => `audio/abenteuer/letztewoche/${f}`))
    expect(letztewoche.medal).toMatch(/^images\/abenteuer\/letztewoche\/medaille-v\d\.webp$/)
    expect(letztewoche.gift!.image).toBe('images/abenteuer/letztewoche/geschenk.webp')
  })

  it('every file of the adventure exists in `public/` (red until the pictures are painted; the recordings and the music are not checked here, they come later)', () => {
    const missing = journeyFiles(letztewoche).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/letztewoche\/(geschichte|musik)/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(letztewoche)) {
      if (!existsSync(`public/${f}`)) continue
      expect(statSync(`public/${f}`).size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the game words are English', () => {
    const en = englishTextsOf(letztewoche) as { stages: { text: string[]; questions: { options: string[] }[] }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('The Last Week')
    expect(en.stages).toHaveLength(12)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length))
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('The King on the Donkey')
    expect(stage(1).task.prepare!.rounds[0]!.hint).toContain('bare places')
    expect(stage(1).task.prepare!.cloaks[0]!.label).toBe('A red cloak')
    expect(stage(4).task.lamps!.jug.label).toBe('A jug of oil')
    expect(stage(5).task.help!.people[5]!.label).toContain('prisoner')
    expect(stage(6).task.order!.cards[2]!.label).toContain('breaks the bread')
    expect(stage(2).task.find!.labels![2]).toContain('dove seller')
    const cmd = (stage(3).task as unknown as { commandment: CommandGame }).commandment
    expect(cmd.cards[1]!.label).toBe('A boy shares his bread with the boy next door')
    expect(cmd.heart.label).toContain('neighbors')
    expect(cmd.rounds[1]!.hint).toContain('upside down')
    expect(stage(12).task.hint).toContain('serious')
    expect(stage(12).questions[2]!.q).toBe('What do the chief priests do the next day?')
    for (const s of letztewoche.stages) if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/letztewoche/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    setAdventureLanguage('de')
    expect(stage(4).task.lamps!.jug.label).toBe('Ein Krug mit Öl')
  })

  it('the English texts keep the quiet of the passion: no detail of the suffering, "blood" only in the words over the cup (stage 6)', () => {
    const en = englishTextsOf(letztewoche) as { stages: { text: string[] }[] }
    en.stages.forEach((e, i) => {
      const t = e.text.join(' ')
      expect(t, `stage ${i + 1}`).not.toMatch(/\b(nails?|thorns?|crown of thorns|whip|scourg\w*|wounds?|chains?|corpse|bleed\w*|hell|devil)\b/i)
      if (i + 1 !== 6) expect(t, `stage ${i + 1}`).not.toMatch(/\bblood\b/i)
    })
  })
})
