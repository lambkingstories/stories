/**
 * The data of "Das Volk in der Wüste" (`wueste.ts`, `en/wueste.en.ts`, `wuestePath.ts`): the stories and questions follow the rules of the adventures (texts of the draft
 * `D:/Claude/Abenteuer-Wuestenvolk/ENTWURF_Wuestenvolk.md`, Luther 1912 told in our own words), three stages are quizzes by design (8, 10, 15, serious), the others are quiz stand-ins until
 * their games are built (stage 13 has its verse game already), the map has fifteen stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { wueste } from '@/data/adventures/wueste'
import { WUESTE_PATH } from '@/data/adventures/wuestePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => wueste.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet)\b/i
/** The serious stages are only quizzes (the death of Aaron and Moses, the refusal at Kadesch, the grief of the people). */
const SERIOUS = [8, 10, 15]

describe('Das Volk in der Wüste: stories and questions', () => {
  it('fifteen stages with 3 or 4 paragraphs and the Bible passage under every one', () => {
    expect(wueste.id).toBe('wueste')
    expect(wueste.age).toBe('8-10')
    expect(wueste.title).toBe('Das Volk in der Wüste')
    expect(wueste.subtitle).toBe('Vierzig Jahre unterwegs')
    expect(wueste.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(wueste.stages.map((s) => s.title)).toEqual([
      'Wasser aus dem Felsen',
      'Die Arme des Mose',
      'Jitro und die Richter',
      'Das Zelt Gottes',
      'Aufbruch vom Sinai',
      'Klagen und Wachteln',
      'Zwölf Kundschafter',
      'Josua und Kaleb',
      'Aarons Stab blüht',
      'Kadesch und der Berg Hor',
      'Die Schlange aus Bronze',
      'Bileam und die Eselin',
      'Höre, Israel',
      'Seid mutig!',
      'Auf dem Berg Nebo'
    ])
    for (const s of wueste.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(\d\. Mose) \d/)
      expect(s.text.length, `paragraphs ${s.id}`).toBeGreaterThanOrEqual(3)
      expect(s.text.length, `paragraphs ${s.id}`).toBeLessThanOrEqual(4)
      const text = s.text.join(' ')
      const words = text.split(/\s+/).length
      expect(words, `words ${s.id}`).toBeGreaterThanOrEqual(80)
      expect(words, `words ${s.id}`).toBeLessThanOrEqual(160)
      expect(text, `stage ${s.id}`).not.toMatch(FORBIDDEN)
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/wueste/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('two questions after a game or stand-in and two or three in a serious stage, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of wueste.stages) {
      expect(s.questions.length, `stage ${s.id}`).toBeGreaterThanOrEqual(2)
      expect(s.questions.length, `stage ${s.id}`).toBeLessThanOrEqual(3)
    }
    for (const q of [...wueste.stages.flatMap((s) => s.questions), ...wueste.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(wueste.exam).toHaveLength(6)
    const asked = wueste.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(wueste.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'ihre', 'einige', 'soll', 'sollen'])
    for (const s of wueste.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        // "Segen" is told as "segnet" (one word family with another vowel)
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)) || (w === 'segen' && text.includes('segnet')))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the rock, Jethro, the grapes, Joshua and Caleb, the donkey and Mount Nebo', () => {
    const q = wueste.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Refidim/)
    expect(q).toMatch(/Jitro/)
    expect(q).toMatch(/Stange/)
    expect(q).toMatch(/Das Land ist sehr gut/)
    expect(q).toMatch(/Engel/)
    expect(q).toMatch(/Berg/)
  })

  it('the serious stages (8, 10, 15) are only quizzes and say that they are serious', () => {
    for (const n of SERIOUS) {
      expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
      expect(stage(n).task.hint, `hint ${n}`).toContain('ernst')
    }
    for (const s of wueste.stages) if (!SERIOUS.includes(s.id)) expect(s.task.hint, `stage ${s.id}`).not.toContain('ernst')
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words)', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/Refidim/)
    expect(t(1)).toMatch(/Massa und Meriba/)
    expect(t(2)).toMatch(/Aaron und Hur/)
    expect(t(2)).toMatch(/Solange Mose die Hände hochhält/)
    expect(t(3)).toMatch(/Jitro/)
    expect(t(3)).toMatch(/Tausend, über Hundert, über Fünfzig und über Zehn/)
    expect(t(4)).toMatch(/Bezalel und Oholiab/)
    expect(t(4)).toMatch(/Niemand soll mehr etwas bringen/)
    expect(t(5)).toMatch(/zwei Trompeten aus Silber/)
    expect(t(6)).toMatch(/siebzig Älteste/)
    expect(t(6)).toMatch(/Eldad und Medad/)
    expect(t(7)).toMatch(/Eschkol/)
    expect(t(7)).toMatch(/zwei Männer sie an einer Stange/)
    expect(t(8)).toMatch(/Das Land ist sehr gut/)
    expect(t(8)).toMatch(/Vierzig Jahre/)
    expect(t(9)).toMatch(/Mandeln/)
    expect(t(10)).toMatch(/Mirjam/)
    expect(t(10)).toMatch(/Eleasar/)
    expect(t(11)).toMatch(/Schlange aus Bronze/)
    expect(t(12)).toMatch(/Balak/)
    expect(t(12)).toMatch(/Wie fein sind deine Zelte, Jakob/)
    expect(t(13)).toMatch(/Höre, Israel/)
    expect(t(13)).toMatch(/mit deinem ganzen Herzen, mit deiner ganzen Seele und mit all deiner Kraft/)
    expect(t(14)).toMatch(/Sei mutig und hab keine Angst/)
    expect(t(15)).toMatch(/Nebo/)
    expect(t(15)).toMatch(/Bis heute weiß niemand, wo sein Grab ist/)
  })

  it('Antons decisions: the angel of Balaam is only told, never a figure; the bronze snake only a sign; Amalek is not fought on screen', () => {
    // no stage task is a game that would show the angel, the snake or a fight (stand-ins and the verse game only)
    for (const s of wueste.stages) expect(['quiz', 'lueckenvers'], `stage ${s.id}`).toContain(s.task.kind)
    expect(stage(12).questions.map((q) => q.q).join(' ')).toContain('Engel')
  })
})

describe('Das Volk in der Wüste: the games', () => {
  it('13 verse: the sentences are in the text and the right words are on the leaves', () => {
    expect(stage(13).task.kind).toBe('lueckenvers')
    const g = stage(13).task.verse!
    expect(g.rounds).toHaveLength(2)
    for (const r of g.rounds) {
      expect(r.parts).toHaveLength(r.answers.length + 1)
      for (const a of r.answers) expect(r.words[a]).toBeTruthy()
    }
    expect(g.rounds[0]!.words[g.rounds[0]!.answers[0]!]).toBe('allein')
    expect(g.rounds[1]!.answers.map((a) => g.rounds[1]!.words[a])).toEqual(['Seele', 'Kraft'])
    const text = stage(13).text.join(' ')
    expect(text).toContain(`${g.rounds[0]!.parts[0]}allein${g.rounds[0]!.parts[1]}`)
    expect(text).toContain(`${g.rounds[1]!.parts[0]}Seele${g.rounds[1]!.parts[1]}Kraft${g.rounds[1]!.parts[2]}`)
    // the backdrop is the picture of the stage until an own one is painted
    expect(g.background).toBe(stage(13).image)
  })

  it('the stand-ins and the finished games: no stage is an unknown task kind', () => {
    expect(wueste.stages.map((s) => s.task.kind)).toEqual(['quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'quiz', 'lueckenvers', 'quiz', 'quiz'])
  })
})

describe('Das Volk in der Wüste: map, files, English', () => {
  it('fifteen stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = wueste.map
    expect(m.stages).toHaveLength(15)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9908, 3)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9908, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(WUESTE_PATH).toHaveLength(15)
    for (const seg of WUESTE_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(WUESTE_PATH)
    expect(m.aspect).toBeCloseTo(9908 / 1648, 6)
    expect(m.widthPx).toBe(9908)
    expect(m.images).toHaveLength(4)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(wueste).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/wueste\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(wueste)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; the recordings are not made yet, so no stage has one', () => {
    const en = englishTextsOf(wueste) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('The People in the Desert')
    expect(en.stages).toHaveLength(15)
    en.stages.forEach((e, i) => {
      expect(e.text.length, `paragraphs ${i + 1}`).toBe(stage(i + 1).text.length)
      expect(e.questions.length, `questions ${i + 1}`).toBe(stage(i + 1).questions.length)
      e.questions.forEach((q, k) => {
        expect(q.options.length).toBe(stage(i + 1).questions[k]!.options.length)
      })
    })
    expect(en.exam).toHaveLength(6)
    setAdventureLanguage('en')
    expect(stage(1).title).toBe('Water from the Rock')
    expect(stage(12).title).toBe('Balaam and the Donkey')
    expect(stage(13).task.verse!.rounds[1]!.parts[0]).toContain('You shall love God')
    expect(wueste.gift.title).toBe('The Giant Cluster of Grapes')
    for (const s of wueste.stages) expect(s.audio, `stage ${s.id}`).toBeUndefined()
    setAdventureLanguage('de')
    for (const s of wueste.stages) expect(s.audio, `stage ${s.id}`).toBeUndefined()
  })
})
