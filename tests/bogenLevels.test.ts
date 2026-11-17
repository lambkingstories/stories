/**
 * "Jonatans Pfeile": the 44 levels. Every level has a stored solution (shots found by the level tool); the test plays it in the simulator and
 * wins with three stars, and it keeps winning when every shot is a little off (angle ±1.5°, power ±4 %, time ±0.12 s) and with a shaky hand,
 * so no level asks for a pixel-exact shot. The texts exist in all three languages.
 */
import { describe, expect, it } from 'vitest'
import rawApp from '../src/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '../src/i18n/bigGames'
import { BIG_GAMES } from '../src/data/bigGames'
import { newGame, playShots, shoot, starsOf, step, type Shot } from '../src/utils/bogenGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, MAX_STARS } from '../src/utils/bogenLevels'
import { ALT_SOLUTIONS, SOLUTIONS } from '../src/utils/bogenSolutions'
import { toleranceFails } from '../src/utils/bogenSolve'

const app = withGameTexts(rawApp) as unknown as Record<'de' | 'en', { app: { bigGames: { bogen: Record<string, unknown> } } }>

describe('the levels of Jonatan\'s arrows', () => {
  it('are 44 in four chapters of eleven, with an entry in the list of big games', () => {
    expect(LEVELS).toHaveLength(44)
    expect(CHAPTER_COUNT).toBe(4)
    expect(LEVELS_PER_CHAPTER).toBe(11)
    for (let c = 0; c < 4; c++) expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(11)
    const g = BIG_GAMES.find((x) => x.id === 'bogen')!
    expect(g.maxStars).toBe(MAX_STARS)
    expect(MAX_STARS).toBe(132)
  })

  it('have different keys, things to hit and a solution each', () => {
    expect(new Set(LEVELS.map((l) => l.def.key)).size).toBe(44)
    for (const l of LEVELS) {
      expect(l.def.items.some((i) => i.kind !== 'switch' && i.need !== false), l.def.key).toBe(true)
      expect(SOLUTIONS[l.id], l.id).toBeTruthy()
      expect(l.solution.length, l.id).toBeGreaterThan(0)
      expect(l.par).toBe(l.solution.length)
    }
  })

  it('introduce a new thing in their own level (the hint is shown once)', () => {
    const intros = LEVELS.filter((l) => l.intro).map((l) => l.intro)
    expect(new Set(intros).size).toBe(intros.length)
    expect(intros.length).toBeGreaterThanOrEqual(16)
    for (const lang of ['de', 'en'] as const) {
      const hints = app[lang].app.bigGames.bogen.hint as Record<string, string>
      for (const k of intros) expect(hints[k as string], `${lang} ${k}`).toBeTruthy()
    }
  })

  it('every stored solution wins its level with three stars and keeps the par', () => {
    for (const l of LEVELS) {
      const g = playShots(l.def, l.par, l.solution)
      expect(g.status, l.id).toBe('won')
      expect(starsOf(g), l.id).toBe(3)
      expect(g.shots, l.id).toBeLessThanOrEqual(l.par)
    }
  })

  it('keep winning when a shot is a little off: angle ±1.5°, power ±4 %, time ±0.12 s', () => {
    const bad: string[] = []
    for (const l of LEVELS) {
      const fails = toleranceFails(l.def, l.par, l.solution)
      if (fails.length) bad.push(`${l.id} ${l.def.key}: ${fails.join(', ')}`)
    }
    expect(bad).toEqual([])
  })

  it('keep winning with a shaky hand (every shot a little off at the same time)', () => {
    let seed = 7
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296 - 0.5
    }
    const bad: string[] = []
    for (const l of LEVELS)
      for (let k = 0; k < 6; k++) {
        const shots: Shot[] = l.solution.map((s) => ({ a: s.a + rnd() * 1.2, f: s.f * (1 + rnd() * 0.04), at: s.at === undefined ? undefined : s.at + rnd() * 0.16 }))
        if (playShots(l.def, l.par, shots).status !== 'won') bad.push(`${l.id} ${l.def.key}#${k}`)
      }
    expect(bad).toEqual([])
  })

  it('can be won in a second, different way (another first shot) in almost every level, and that way is just as forgiving', () => {
    const ids = Object.keys(ALT_SOLUTIONS)
    expect(ids.length).toBeGreaterThanOrEqual(40)
    for (const l of LEVELS) {
      const alt = ALT_SOLUTIONS[l.id]
      if (!alt) continue
      const g = playShots(l.def, alt.length, alt)
      expect(g.status, `${l.id} alternative`).toBe('won')
      const main = l.solution[0]!
      expect(Math.abs(alt[0]!.a - main.a) >= 7 || Math.abs(alt[0]!.f - main.f) >= 0.14 * Math.max(0.5, main.f), `${l.id} different first shot`).toBe(true)
      expect(toleranceFails(l.def, alt.length, alt), `${l.id} alternative tolerance`).toEqual([])
    }
  })

  it('cannot be won without a shot, and a bad shot does nothing bad', () => {
    for (const l of LEVELS) {
      const g = newGame(l.def, l.par)
      for (let n = 0; n < 5 * 120; n++) step(g)
      expect(g.status, l.id).toBe('play')
      shoot(g, 85, 0.2)
      for (let n = 0; n < 6 * 120; n++) step(g)
      expect(g.status, l.id).toBe('play')
    }
  })

  it('have no level that a single flat shot straight ahead wins by accident', () => {
    for (const l of LEVELS.filter((x) => x.par >= 3)) {
      const g = playShots(l.def, l.par, [{ a: 0, f: 1 }])
      expect(g.status, l.id).toBe('play')
    }
  })
})

describe('the texts', () => {
  it('give every level a name and every chapter a story and a task in all three languages', () => {
    for (const lang of ['de', 'en', 'es'] as const) {
      const t = BIG_GAME_TEXTS[lang].bogen as unknown as { names: string[]; chapters: { name: string; ref: string; story: string; task: string }[]; hint: Record<string, string>; ending: Record<string, string> }
      expect(t.names, lang).toHaveLength(44)
      expect(t.names.every((n) => n.length > 2), lang).toBe(true)
      expect(t.chapters, lang).toHaveLength(4)
      for (const c of t.chapters) {
        expect(c.name && c.ref && c.story && c.task, lang).toBeTruthy()
      }
      expect(Object.keys(t.hint).length, lang).toBeGreaterThanOrEqual(16)
      expect(t.ending.text, lang).toBeTruthy()
    }
  })

  it('give the task with "Deine Aufgabe" and name the Bible places', () => {
    const de = app.de.app.bigGames.bogen as { task: string; chapters: { task: string; ref: string }[] }
    expect(de.task).toContain('Deine Aufgabe')
    expect(de.chapters.map((c) => c.ref).join(' ')).toContain('1. Samuel 20,35–42')
  })
})
