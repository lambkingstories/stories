/**
 * "Josefs Kornspeicher": the 36 levels. Every level stands still at the start, has at least one granary, and is solved by the stored shots in the simulator
 * with three stars; a slightly sloppy hand (a little off in angle or strength) still wins in some cases, so that no level needs an exact throw.
 */
import { describe, expect, it } from 'vitest'
import { BIG_GAMES } from '../src/data/bigGames'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER } from '../src/utils/kornspeicherLevels'
import { SOLUTIONS } from '../src/utils/kornspeicherSolutions'
import { SETTLE_STEPS, Sim, playShots } from '../src/utils/kornspeicherSim'

describe('the levels', () => {
  it('are 36 in four chapters of nine, in the right order', () => {
    expect(CHAPTER_COUNT).toBe(4)
    expect(LEVELS_PER_CHAPTER).toBe(9)
    expect(LEVELS).toHaveLength(36)
    LEVELS.forEach((l, i) => {
      expect(l.id).toBe(i)
      expect(l.chapter).toBe(Math.floor(i / 9))
      expect(l.index).toBe(i % 9)
    })
  })

  it('have a granary, a world that fits the width, at least three sacks and two more than the par', () => {
    for (const l of LEVELS) {
      expect(l.silos.length, `level ${l.id + 1} granaries`).toBeGreaterThanOrEqual(1)
      expect(l.ammo.length).toBeGreaterThanOrEqual(Math.max(3, l.par + 2))
      for (const g of l.silos) {
        expect(g.x + g.w / 2 + 0.5).toBeLessThan(l.width)
        expect(g.need).toBeGreaterThanOrEqual(1)
      }
      for (const p of l.parts) expect(p.x).toBeLessThan(l.width)
      expect(l.par).toBeGreaterThanOrEqual(1)
    }
  })

  it('teach one new thing at a time: the first level has one granary, the new things come in order', () => {
    expect(LEVELS[0]!.silos).toHaveLength(1)
    const intros = LEVELS.filter((l) => l.intro).map((l) => l.intro)
    expect(intros).toEqual(['sack', 'nil', 'schwer', 'aehren', 'garbe', 'fass', 'wind', 'wippe', 'luft'])
    // the new sack of an introduction is the first one of the level
    const first = (id: string) => LEVELS.find((l) => l.intro === id)!.ammo[0]
    expect(first('schwer')).toBe('schwer')
    expect(first('aehren')).toBe('aehren')
    expect(first('fass')).toBe('fass')
    expect(first('luft')).toBe('luft')
  })

  it('use all the kinds of sack, the river, palms, sheaves, clay, stone, the seesaw and hill granaries', () => {
    const ammo = new Set(LEVELS.flatMap((l) => l.ammo))
    expect([...ammo].sort()).toEqual(['aehren', 'fass', 'luft', 'sack', 'schwer'])
    expect(LEVELS.some((l) => (l.water ?? []).length > 0)).toBe(true)
    expect(LEVELS.some((l) => (l.rocks ?? []).some((r) => r.k === 'palm'))).toBe(true)
    expect(LEVELS.some((l) => l.parts.some((p) => p.grain))).toBe(true)
    expect(LEVELS.some((l) => l.parts.some((p) => p.m === 'clay'))).toBe(true)
    expect(LEVELS.some((l) => l.parts.some((p) => p.m === 'stone'))).toBe(true)
    expect(LEVELS.some((l) => (l.joints ?? []).some((j) => j.t === 'seesaw'))).toBe(true)
    expect(LEVELS.some((l) => l.silos.some((g) => g.y > 0))).toBe(true)
  })

  it('get harder: later chapters have more granaries and parts', () => {
    const avg = (c: number, f: (l: (typeof LEVELS)[number]) => number) => LEVELS.filter((l) => l.chapter === c).reduce((n, l) => n + f(l), 0) / 9
    expect(avg(3, (l) => l.silos.length)).toBeGreaterThan(avg(0, (l) => l.silos.length))
    expect(avg(3, (l) => l.parts.length)).toBeGreaterThan(avg(0, (l) => l.parts.length))
  })

  it('stand still at the start: nothing broken, no granary full, nothing moves away', () => {
    for (const l of LEVELS) {
      const s = new Sim(l)
      for (let i = 0; i < SETTLE_STEPS + 240; i++) s.step()
      expect(s.status, `level ${l.id + 1}`).toBe('play')
      expect(s.doneCount, `level ${l.id + 1} full granaries`).toBe(0)
      expect(s.score, `level ${l.id + 1} score`).toBe(0)
      for (const p of s.parts) {
        expect(p.dead, `level ${l.id + 1} broken`).toBe(false)
        if (!p.def.id) {
          const c = p.body.getPosition()
          expect(Math.hypot(c.x - p.def.x, c.y - p.def.y), `level ${l.id + 1} ${p.def.m}`).toBeLessThan(0.2)
        }
      }
    }
  })
})

describe('the solutions', () => {
  it('exist for every level and are as long as the par', () => {
    for (const l of LEVELS) {
      expect(SOLUTIONS[l.id], `level ${l.id + 1}`).toBeTruthy()
      expect(SOLUTIONS[l.id]!.length).toBe(l.par)
    }
  })

  it('win every level with three stars in the simulator', () => {
    for (const l of LEVELS) {
      const s = playShots(l, SOLUTIONS[l.id]!)
      expect(s.status, `level ${l.id + 1}`).toBe('won')
      expect(s.stars, `level ${l.id + 1} stars`).toBe(3)
      expect(s.used).toBeLessThanOrEqual(l.par)
    }
  })

  it('still win in several cases with a slightly sloppy hand (angle +-0.3 degrees, strength +-0.8 %, tap +-0.03 s), and no level needs an exact throw', () => {
    const variants: [number, number][] = [[0.3, 0], [-0.3, 0], [0, 0.008], [0, -0.008], [0.2, 0.005], [-0.2, -0.005], [0.2, -0.005], [-0.2, 0.005]]
    let total = 0
    let won = 0
    const weak: string[] = []
    for (const l of LEVELS) {
      let ok = 0
      for (const [da, dp] of variants) {
        const shots = SOLUTIONS[l.id]!.map((x) => ({ ...x, a: x.a + da, p: Math.min(1, x.p + dp), ...(x.tap !== undefined ? { tap: x.tap + (da > 0 ? 0.03 : -0.03) } : {}) }))
        if (playShots(l, shots).status === 'won') ok++
      }
      total += variants.length
      won += ok
      if (ok < 2) weak.push(`${l.id + 1}:${ok}`)
    }
    expect(weak, `levels that need an exact throw: ${weak.join(' ')}`).toEqual([])
    expect(won / total).toBeGreaterThan(0.5)
  })

  it('are listed as a big game of the corner (picked with a wish), instead of the old catapult game', () => {
    const g = BIG_GAMES.find((x) => x.id === 'kornspeicher')!
    expect(g.maxStars).toBe(108)
    expect(g.image).toBe('images/spiele-gross/kornspeicher/kachel.webp')
    expect(BIG_GAMES.some((x) => (x.id as string) === 'gideon')).toBe(false)
    expect(BIG_GAMES).toHaveLength(10)
  })
})
