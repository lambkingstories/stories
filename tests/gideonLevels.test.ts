/**
 * "Gideons Nacht": the 36 levels. Every level stands still at the start, has guards, and is solved by the stored shots in the simulator with three stars;
 * a slightly sloppy hand (a little off in angle or strength) still wins most of the time, so that no level needs a pixel-exact throw.
 */
import { describe, expect, it } from 'vitest'
import { BIG_GAMES } from '../src/data/bigGames'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER } from '../src/utils/gideonLevels'
import { SOLUTIONS } from '../src/utils/gideonSolutions'
import { SETTLE_STEPS, Sim, playShots } from '../src/utils/gideonSim'

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

  it('have guards, a camp that fits the width, at least three jars and two more than the par', () => {
    for (const l of LEVELS) {
      expect(l.guards.length, `level ${l.id + 1} guards`).toBeGreaterThanOrEqual(1)
      expect(l.ammo.length).toBeGreaterThanOrEqual(Math.max(3, l.par + 2))
      for (const g of l.guards) expect(g.x).toBeLessThan(l.width)
      for (const p of l.parts) expect(p.x).toBeLessThan(l.width)
      expect(l.par).toBeGreaterThanOrEqual(1)
    }
  })

  it('teach one new thing at a time: the first level has one guard, the new things come in order', () => {
    expect(LEVELS[0]!.guards).toHaveLength(1)
    const intros = LEVELS.filter((l) => l.intro).map((l) => l.intro)
    expect(intros).toEqual(['krug', 'stein', 'wind', 'wippe', 'pendel', 'ruf', 'posaune', 'fackel', 'fels'])
  })

  it('get harder: later chapters have more guards and parts', () => {
    const avg = (c: number, f: (l: (typeof LEVELS)[number]) => number) => LEVELS.filter((l) => l.chapter === c).reduce((n, l) => n + f(l), 0) / 9
    expect(avg(3, (l) => l.guards.length)).toBeGreaterThan(avg(0, (l) => l.guards.length))
    expect(avg(3, (l) => l.parts.length)).toBeGreaterThan(avg(0, (l) => l.parts.length))
  })

  it('stand still at the start: nothing broken, nobody startled, nothing moves away', () => {
    for (const l of LEVELS) {
      const s = new Sim(l)
      for (let i = 0; i < SETTLE_STEPS + 240; i++) s.step()
      expect(s.status, `level ${l.id + 1}`).toBe('play')
      expect(s.scaredCount, `level ${l.id + 1} scared`).toBe(0)
      for (const p of s.parts) {
        expect(p.dead, `level ${l.id + 1} broken`).toBe(false)
        if (!p.def.id) {
          const c = p.body.getPosition()
          expect(Math.hypot(c.x - p.def.x, c.y - p.def.y), `level ${l.id + 1} ${p.def.m}`).toBeLessThan(0.2)
        }
      }
      for (const g of s.guards) {
        const c = g.body!.getPosition()
        expect(Math.hypot(c.x - g.def.x, c.y - (g.def.y + 0.78)), `level ${l.id + 1} guard`).toBeLessThan(0.25)
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

  it('win most of the time with a slightly sloppy hand (angle +-0.6 degrees, strength +-1.5 %, tap +-0.04 s)', () => {
    const variants: [number, number][] = [[0.6, 0], [-0.6, 0], [0, 0.015], [0, -0.015], [0.4, 0.01], [-0.4, -0.01], [0.4, -0.01], [-0.4, 0.01]]
    let total = 0
    let won = 0
    const weak: string[] = []
    for (const l of LEVELS) {
      let ok = 0
      for (const [da, dp] of variants) {
        const shots = SOLUTIONS[l.id]!.map((x) => ({ ...x, a: x.a + da, p: Math.min(1, x.p + dp), ...(x.tap !== undefined ? { tap: x.tap + (da > 0 ? 0.04 : -0.04) } : {}) }))
        if (playShots(l, shots).status === 'won') ok++
      }
      total += variants.length
      won += ok
      // no level may depend on a pixel-exact throw
      if (ok < 2) weak.push(`${l.id + 1}:${ok}`)
    }
    expect(weak, `levels that need an exact throw: ${weak.join(' ')}`).toEqual([])
    expect(won / total).toBeGreaterThan(0.6)
  })

  it('are listed as a big game of the corner (picked with a wish)', () => {
    const g = BIG_GAMES.find((x) => x.id === 'gideon')!
    expect(g.maxStars).toBe(108)
    expect(g.image).toBe('images/spiele-gross/gideon/kachel.webp')
  })
})
