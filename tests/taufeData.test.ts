/**
 * The data of "The Young Jesus and His Baptism" (`taufe.ts`, `en/taufe.en.ts`, `taufePath.ts`): the stories and questions follow the rules of the adventures (texts of the draft `D:/Claude/Abenteuer-Taufe/ENTWURF_Taufe.md`,
 * Luther 1912 told in our own words), the two quiz stages are only quizzes, the five new games (Anton's plan of games, 5.11.2026: at most two old ones, never in a row) and the two old ones have sound data,
 * the map has nine stations and the exam, and the English file has the same shape.
 */
import { existsSync, statSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { taufe } from '@/data/adventures/taufe'
import { TAUFE_PATH } from '@/data/adventures/taufePath'
import { englishTextsOf } from '@/data/adventures/localize'
import { setAdventureLanguage } from '@/use/adventureLanguage'
import { journeyFiles, notPaintedYet } from '@/utils/journeyFiles'
import { scrollProblems, shadeProblems, sunriseProblems } from '@/utils/taufeNeu'
import type { ScrollGame, ShadowWalkGame, SunGame } from '@/utils/taufeNeu'

afterEach(() => setAdventureLanguage('de'))
const stage = (n: number) => taufe.stages[n - 1]!
/** Words that no text of the German data may use (the story is told without cruelty: no killing, no blood, no devil). */
const FORBIDDEN = /\b(Blut|Teufel|Hölle|erschlagen|erwürgen|ertrinken|ertrunken|umbringen|schlachten|geschlachtet|Leiche|Leichen|Galgen|töten|tötet|Tod|tot)\b/i
const QUIZ_STAGES = [6, 9]

describe('Taufe: stories and questions', () => {
  it('nine stages with 3 or 4 paragraphs of 90 to 145 words and the Bible passage under every one', () => {
    expect(taufe.id).toBe('taufe')
    expect(taufe.age).toBe('8-10')
    expect(taufe.title).toBe('Der junge Jesus und die Taufe')
    expect(taufe.stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(taufe.stages.map((s) => s.title)).toEqual([
      'Jesus bleibt in Jerusalem',
      'Im Haus seines Vaters',
      'Johannes ruft in der Wüste',
      'Jesus wird getauft',
      'Vierzig Tage in der Wüste',
      'Auf dem Tempel und auf dem Berg',
      'Jesus zieht nach Kapernaum',
      'Jesus ruft vier Fischer',
      'Jesus lehrt und heilt'
    ])
    for (const s of taufe.stages) {
      expect(s.ref, `stage ${s.id}`).toMatch(/^(Lukas|Matthäus) \d/)
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
      expect(s.image, `stage ${s.id}`).toBe(`images/abenteuer/taufe/etappe-bild-${String(s.id).padStart(2, '0')}.webp`)
    }
  })

  it('three questions in the two quiz stages and two after a game, three answers each, the right one first and the answers differ; the exam has six; nothing is asked twice', () => {
    for (const s of taufe.stages) expect(s.questions, `stage ${s.id}`).toHaveLength(QUIZ_STAGES.includes(s.id) ? 3 : 2)
    for (const q of [...taufe.stages.flatMap((s) => s.questions), ...taufe.exam]) {
      expect(q.options, q.q).toHaveLength(3)
      expect(q.answer, q.q).toBe(0)
      expect(new Set(q.options).size, q.q).toBe(3)
      expect(q.q.trim().endsWith('?'), q.q).toBe(true)
      expect(q.q.split(/\s+/).length, q.q).toBeLessThanOrEqual(16)
    }
    expect(taufe.exam).toHaveLength(6)
    const asked = taufe.stages.flatMap((s) => s.questions.map((q) => `${q.q} ${q.options[0]}`))
    expect(new Set(asked).size).toBe(asked.length)
    expect(new Set(taufe.exam.map((q) => q.q)).size).toBe(6)
  })

  it('the right answer of a stage question is in the text of the stage (questions only about what is told)', () => {
    const STOP = new Set(['der', 'die', 'das', 'und', 'ist', 'sind', 'ein', 'eine', 'einen', 'nicht', 'alle', 'in', 'im', 'am', 'zu', 'auf', 'mit', 'von', 'vor', 'sie', 'seinem', 'seinen', 'wird', 'ihm', 'ihr', 'dem', 'den', 'sich', 'für', 'dass', 'aus', 'wie', 'nach', 'bei'])
    for (const s of taufe.stages) {
      const text = s.text.join(' ').toLowerCase()
      for (const q of s.questions) {
        const words = q.options[0]!.toLowerCase().replace(/[.,!?„“]/g, '').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w))
        const hit = words.length === 0 || words.some((w) => text.includes(w.slice(0, 5)))
        expect(hit, `stage ${s.id}: "${q.q}" -> "${q.options[0]}"`).toBe(true)
      }
    }
  })

  it('the exam asks across the whole adventure: the temple, John, the dove, the forty days, the service of God alone and the fishers of people', () => {
    const q = taufe.exam.map((x) => x.q).join(' ')
    expect(q).toMatch(/Jungen Jesus/)
    expect(q).toMatch(/Johannes der Täufer/)
    expect(q).toMatch(/Geist Gottes/)
    expect(q).toMatch(/fastet Jesus/)
    expect(q).toMatch(/allein dienen/)
    expect(q).toMatch(/Simon und Andreas/)
  })

  it('the two quiz stages (6, 9) are only quizzes, never two in a row; stage 6 says that it is serious', () => {
    for (const n of QUIZ_STAGES) expect(stage(n).task.kind, `kind ${n}`).toBe('quiz')
    expect(stage(6).task.hint).toContain('ernst')
    const kinds = taufe.stages.map((s) => s.task.kind)
    for (let i = 1; i < kinds.length; i++) expect(kinds[i] === 'quiz' && kinds[i - 1] === 'quiz', `two quizzes in a row at ${i + 1}`).toBe(false)
  })

  it('the key sentences of the Bible are there (Luther 1912, told in our own words); the tempter is only a voice in the text', () => {
    const t = (n: number) => stage(n).text.join(' ')
    expect(t(1)).toMatch(/zwölf Jahre alt/)
    expect(t(1)).toMatch(/Verwandten und Bekannten/)
    expect(t(2)).toMatch(/mitten unter den Lehrern/)
    expect(t(2)).toMatch(/Wisst ihr nicht, dass ich sein muss in dem, was meines Vaters ist/)
    expect(t(2)).toMatch(/Weisheit, Alter und Gnade/)
    expect(t(3)).toMatch(/Kamelhaar/)
    expect(t(3)).toMatch(/Heuschrecken und wilden Honig/)
    expect(t(3)).toMatch(/Bereitet dem Herrn den Weg/)
    expect(t(3)).toMatch(/Heiligen Geist taufen/)
    expect(t(4)).toMatch(/Dies ist mein lieber Sohn/)
    expect(t(4)).toMatch(/wie eine Taube/)
    expect(t(5)).toMatch(/Vierzig Tage und vierzig Nächte/)
    expect(t(5)).toMatch(/Der Mensch lebt nicht vom Brot allein/)
    expect(t(6)).toMatch(/Zinne des Tempels/)
    expect(t(6)).toMatch(/alle Reiche der Welt/)
    expect(t(6)).toMatch(/Weg mit dir, Satan/)
    expect(t(7)).toMatch(/Kapernaum/)
    expect(t(7)).toMatch(/großes Licht gesehen/)
    expect(t(8)).toMatch(/Menschenfischern/)
    expect(t(8)).toMatch(/Zebedäus/)
    expect(t(9)).toMatch(/Synagogen/)
    expect(t(9)).toMatch(/macht sie alle gesund/)
    const all = taufe.stages.map((s) => s.text.join(' ')).join(' ')
    expect(all).not.toMatch(/Teufel|Heiligenschein|Taube,? die/)
  })
})

describe('Taufe: the games', () => {
  it('the order of the games: 2 old (hidden pictures, order; not in a row), 5 new, 2 quizzes; no game twice', () => {
    expect(taufe.stages.map((s) => s.task.kind)).toEqual(['wimmelbild', 'schriftrolle', 'bahn', 'reihenfolge', 'schattenweg', 'quiz', 'sonnenaufgang', 'netz', 'quiz'])
    const games = taufe.stages.map((s) => s.task.kind).filter((k) => k !== 'quiz')
    expect(new Set(games).size).toBe(games.length)
    expect(games.filter((k) => ['bahn', 'netz', 'schriftrolle', 'schattenweg', 'sonnenaufgang'].includes(k))).toHaveLength(5)
  })

  it('1 hidden pictures: five relatives, covers, every place inside the picture; Jesus is not among them', () => {
    const t = stage(1).task
    expect(t.kind).toBe('wimmelbild')
    expect(t.count).toBe(5)
    const f = t.find!
    expect(f.finds).toHaveLength(5)
    expect(f.labels).toHaveLength(5)
    expect(f.covers.length).toBeGreaterThanOrEqual(6)
    for (const s of [...f.finds, ...f.covers]) {
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(-1)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(101)
      expect(s.y).toBeLessThanOrEqual(100)
    }
    expect(f.labels.join(' ')).not.toMatch(/Jesus|Junge/)
    expect(f.doneText).toContain('Jesus ist nicht dabei')
  })

  it('2 scrolls: two rounds, the checker of the game finds nothing, the temple is looked for first; the text tells of the temple', () => {
    const t = stage(2).task as unknown as { kind: string; scroll: ScrollGame }
    expect(t.kind).toBe('schriftrolle')
    expect(scrollProblems(t.scroll)).toEqual([])
    expect(t.scroll.rounds).toHaveLength(2)
    expect(t.scroll.rounds[0]!.find[0]).toBe('tempel')
    expect(t.scroll.frame).toMatch(/taufe\/schriftrolle\/rolle\.webp$/)
    expect(stage(2).text.join(' ')).toContain('im Tempel')
  })

  it('3 road: two rounds, stones, thorns and branches to clear, the travelers to leave alone; every thing has a picture; everything inside the picture', () => {
    const g = stage(3).task.road!
    expect(g.rounds).toHaveLength(2)
    const ids = g.items.map((i) => i.id)
    for (const r of g.rounds) {
      const obstacles = r.spots.filter((s) => !s.keep)
      expect(obstacles.length).toBeGreaterThanOrEqual(4)
      expect(r.spots.filter((s) => s.keep).length).toBeGreaterThanOrEqual(1)
      for (const s of r.spots) {
        expect(ids, s.item).toContain(s.item)
        expect(s.x).toBeGreaterThan(5)
        expect(s.x).toBeLessThan(95)
        expect(s.y).toBeGreaterThan(30)
        expect(s.y).toBeLessThanOrEqual(99)
      }
    }
    expect(g.rounds[1]!.spots.filter((s) => !s.keep).length).toBeGreaterThan(g.rounds[0]!.spots.filter((s) => !s.keep).length)
    expect(g.background).toMatch(/taufe\/bahn\/weg\.webp$/)
    expect(stage(3).text.join(' ')).toContain('Bereitet dem Herrn den Weg')
  })

  it('4 order: four cards in the order of the story; round 1 with the numbers and three cards, round 2 with all four', () => {
    const g = stage(4).task.order!
    expect(g.cards.map((c) => c.id)).toEqual(['kommt', 'tauft', 'steigt', 'himmel'])
    expect(g.rounds.map((r) => r.cards.length)).toEqual([3, 4])
    expect(g.rounds.map((r) => r.numbered)).toEqual([true, false])
    expect(g.rounds[1]!.cards).toEqual(['kommt', 'tauft', 'steigt', 'himmel'])
  })

  it('5 sun and shade: two rounds, the checker finds nothing ("Help me" reaches the big rock without a mistake); the text tells of the dry wilderness', () => {
    const t = stage(5).task as unknown as { kind: string; shadowWalk: ShadowWalkGame }
    expect(t.kind).toBe('schattenweg')
    expect(shadeProblems(t.shadowWalk)).toEqual([])
    expect(t.shadowWalk.rounds).toHaveLength(2)
    expect(t.shadowWalk.walker).toMatch(/taufe\/schattenweg\/jesus\.webp$/)
    expect(stage(5).text.join(' ')).toContain('Die Wüste ist trocken')
  })

  it('7 light over Galilee: two rounds, the checker finds nothing, Capernaum is among the villages; the text tells of the great light', () => {
    const t = stage(7).task as unknown as { kind: string; sunrise: SunGame }
    expect(t.kind).toBe('sonnenaufgang')
    expect(sunriseProblems(t.sunrise)).toEqual([])
    expect(t.sunrise.rounds.map((r) => r.villages.length)).toEqual([4, 6])
    expect(t.sunrise.rounds[0]!.villages.map((v) => v.name)).toContain('Kapernaum')
    expect(stage(7).text.join(' ')).toContain('großes Licht gesehen')
  })

  it('8 net: two rounds with four and six fish, every fish has a picture, the area and the reach are inside the picture and the speed is slow', () => {
    const g = stage(8).task.net!
    expect(g.rounds.map((r) => r.fish.length)).toEqual([4, 6])
    const ids = g.fish.map((f) => f.id)
    for (const r of g.rounds) {
      for (const id of r.fish) expect(ids, id).toContain(id)
      expect(r.speed).toBeGreaterThan(0.02)
      expect(r.speed).toBeLessThanOrEqual(0.07)
    }
    expect(g.area.x).toBeGreaterThanOrEqual(0)
    expect(g.area.x + g.area.w).toBeLessThanOrEqual(100)
    expect(g.area.y).toBeGreaterThanOrEqual(0)
    expect(g.area.y + g.area.h).toBeLessThanOrEqual(100)
    expect(g.reach).toBeGreaterThanOrEqual(9)
    expect(g.background).toMatch(/taufe\/netz\/see\.webp$/)
    expect(g.net).toMatch(/taufe\/netz\/netz\.webp$/)
    expect(stage(8).text.join(' ')).toContain('Netze')
  })
})

describe('Taufe: map, files, English', () => {
  it('nine stations from left to right, not too low, at least 450 pixels apart, and the exam at the end; the way has a stretch to every medal', () => {
    const m = taufe.map
    expect(m.stages).toHaveLength(9)
    const all = [...m.stages, m.exam]
    const xs = all.map((s) => s.x)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    for (const s of all) {
      expect(s.y * 1648, 'station not lower than 80 %').toBeLessThanOrEqual(1318)
      expect(s.d).toBeCloseTo(336 / 9920, 4)
    }
    for (let i = 1; i < all.length; i++) expect(Math.hypot((all[i]!.x - all[i - 1]!.x) * 9920, (all[i]!.y - all[i - 1]!.y) * 1648), `station ${i} to ${i + 1}`).toBeGreaterThanOrEqual(450)
    expect(TAUFE_PATH).toHaveLength(9)
    for (const seg of TAUFE_PATH) expect(seg.length).toBeGreaterThanOrEqual(10)
    expect(m.path).toBe(TAUFE_PATH)
    expect(m.aspect).toBeCloseTo(9920 / 1648, 6)
    expect(m.widthPx).toBe(9920)
    expect(m.images).toHaveLength(3)
  })

  it('every file of the adventure exists in `public/` (the pictures that are not painted yet are on the list `NOT_PAINTED_YET`)', () => {
    const missing = journeyFiles(taufe).filter((f) => !existsSync(`public/${f}`) && !notPaintedYet(f) && !/^audio\/abenteuer\/taufe\/geschichte/.test(f))
    expect(missing).toEqual([])
  })

  it('no file is too big (the map pieces up to 2.4 MB, everything else under 620 KB)', () => {
    for (const f of journeyFiles(taufe)) {
      if (!existsSync(`public/${f}`)) continue
      const size = statSync(`public/${f}`).size
      expect(size, f).toBeLessThan(f.includes('karte-pano') ? 2_400_000 : 620_000)
    }
  })

  it('the English file has the same shape: the same number of stages, paragraphs, questions and answers; each language has its own recording', () => {
    const en = englishTextsOf(taufe) as { stages: { text: string[]; questions: { options: string[] }[]; task?: { hint?: string } }[]; exam: { options: string[] }[]; title: string }
    expect(en.title).toBe('The Young Jesus and His Baptism')
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
    expect(stage(1).title).toBe('Jesus Stays in Jerusalem')
    expect(stage(3).task.road!.items[0]!.label).toBe('Boulder')
    expect(stage(3).task.road!.rounds[0]!.hint).toContain('Clear the road')
    expect(stage(8).task.net!.rounds[0]!.hint).toContain('Cast the net')
    expect((stage(2).task as unknown as { scroll: ScrollGame }).scroll.tiles[0]!.label).toBe('the temple')
    expect((stage(5).task as unknown as { shadowWalk: ShadowWalkGame }).shadowWalk.rounds[0]!.hint).toContain('Lead Jesus')
    expect((stage(7).task as unknown as { sunrise: SunGame }).sunrise.rounds[0]!.villages[0]!.name).toBe('Capernaum')
    for (const s of taufe.stages) {
      const audio = s.audio
      if (audio) expect(audio, `stage ${s.id}`).toBe(`audio/abenteuer/taufe/geschichte-${String(s.id).padStart(2, '0')}-en-v1.mp3`)
    }
    setAdventureLanguage('de')
    for (const s of taufe.stages) {
      if (s.audio) expect(s.audio, `stage ${s.id}`).toBe(`audio/abenteuer/taufe/geschichte-${String(s.id).padStart(2, '0')}-v1.mp3`)
    }
  })
})
