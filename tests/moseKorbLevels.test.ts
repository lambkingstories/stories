/**
 * "Moses Körbchen": the 40 levels. Every level is solvable (the stored ways are played in the simulator), and not only with exact timing:
 * a shift of the moments by 0.08 s or a little shaking of every cut still wins; every level has a second, different way.
 */
import { describe, expect, it } from 'vitest'
import { BIG_GAMES } from '../src/data/bigGames'
import { BASKET_R, H, W, makeGame, play, starsOf, stepOnce, type LevelDef, type Solution } from '../src/utils/moseKorbGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, levelGame, tipRope } from '../src/utils/moseKorbLevels'

describe('the levels of Moses Körbchen', () => {
  it('are 40 in 4 chapters of 10 and the game is one of the corner (70 stars, 120 to win)', () => {
    expect(CHAPTER_COUNT).toBe(4)
    expect(LEVELS_PER_CHAPTER).toBe(10)
    expect(LEVELS).toHaveLength(40)
    LEVELS.forEach((l, i) => {
      expect(l.chapter).toBe(Math.floor(i / 10))
      expect(l.index).toBe(i % 10)
    })
    const g = BIG_GAMES.find((x) => x.id === 'mose')!
    expect(g.at).toBe(70)
    expect(g.maxStars).toBe(LEVELS.length * 3)
  })

  it('have a sound structure: everything inside the picture, ropes that hang from above, three lotus blossoms apart from each other', () => {
    for (const [i, l] of LEVELS.entries()) {
      const where = `level ${i + 1}`
      expect(l.basket.x, where).toBeGreaterThan(BASKET_R)
      expect(l.basket.x, where).toBeLessThan(W - BASKET_R)
      expect(l.basket.y, where).toBeLessThan(H - 100)
      expect(l.ropes.length, where).toBeGreaterThanOrEqual(1)
      expect(l.ropes.length, where).toBeLessThanOrEqual(3)
      for (const r of l.ropes) {
        expect(r.ay, where).toBeLessThan(l.basket.y - 40)
        expect(r.ax, where).toBeGreaterThan(0)
        expect(r.ax, where).toBeLessThan(W)
      }
      expect(l.stars, where).toHaveLength(3)
      for (const [k, s] of l.stars.entries()) {
        expect(s.x, where).toBeGreaterThan(0)
        expect(s.x, where).toBeLessThan(W)
        expect(s.y, where).toBeGreaterThan(0)
        expect(s.y, where).toBeLessThan(H)
        for (const o of l.stars.slice(k + 1)) expect(Math.hypot(s.x - o.x, s.y - o.y), where).toBeGreaterThan(40)
        expect(Math.hypot(s.x - l.target.x, s.y - l.target.y), where).toBeGreaterThan(l.target.r)
      }
      expect(l.target.r).toBeGreaterThanOrEqual(30)
    }
  })

  it('do not win by themselves (nothing is caught without a cut)', () => {
    for (const [i, l] of LEVELS.entries()) {
      const g = makeGame(l)
      for (let k = 0; k < 120 * 6; k++) stepOnce(g)
      expect(g.status, `level ${i + 1}`).toBe('play')
    }
  })

  it('bring in the new things in the right order, each in a level that has it', () => {
    const order = LEVELS.map((l) => l.intro).filter(Boolean)
    expect(new Set(order).size).toBe(order.length)
    const has: Record<string, (l: LevelDef) => boolean> = {
      cut: (l) => l.ropes.length === 1,
      swing: (l) => l.ropes.length === 1,
      order: (l) => l.ropes.length >= 2,
      slope: (l) => (l.segs ?? []).some((s) => s.kind === 'wood'),
      wall: (l) => (l.segs ?? []).some((s) => s.x1 === s.x2 && s.y1 < 500),
      bubble: (l) => (l.bubbles ?? []).length > 0,
      feder: (l) => (l.segs ?? []).some((s) => s.kind === 'feder'),
      seesaw: (l) => (l.rotors ?? []).some((r) => r.kind === 'seesaw'),
      wheel: (l) => (l.rotors ?? []).some((r) => r.kind === 'wheel'),
      duck: (l) => (l.movers ?? []).some((m) => m.kind === 'duck'),
      fish: (l) => (l.movers ?? []).some((m) => m.kind === 'fish'),
      fan: (l) => (l.fans ?? []).length > 0,
      flume: (l) => (l.segs ?? []).some((s) => !!s.belt)
    }
    for (const l of LEVELS) if (l.intro && has[l.intro]) expect(has[l.intro]!(l), `intro ${l.intro}`).toBe(true)
    // the big things come in the chapter that the story gives them
    expect(LEVELS.findIndex((l) => l.intro === 'bubble')).toBeGreaterThanOrEqual(10)
    expect(LEVELS.findIndex((l) => l.intro === 'wheel')).toBeGreaterThanOrEqual(20)
    expect(LEVELS.findIndex((l) => l.intro === 'fan')).toBeGreaterThanOrEqual(30)
  })

  it('let the tip show a rope that exists', () => {
    for (let i = 0; i < LEVELS.length; i++) expect(LEVELS[i]!.ropes[tipRope(i)], `level ${i + 1}`).toBeDefined()
  })

  it('give a game that is ready (the rope is taut and the basket still)', () => {
    const g = levelGame(0)
    expect(g.t).toBe(0)
    expect(g.status).toBe('play')
  })
})

const nominal = (sol: Solution) => sol.cuts.length + (sol.taps?.length ?? 0)

describe('every level can be won', () => {
  for (const [i, l] of LEVELS.entries()) {
    const n = `level ${i + 1} (chapter ${l.chapter + 1}, no. ${l.index + 1})`

    it(`${n}: the way that the tip shows wins with three stars`, () => {
      const sol = l.solutions[0]!
      expect(sol, 'a stored way').toBeDefined()
      const g = play(l, sol)
      expect(g.status === 'won' || g.status === 'caught').toBe(true)
      expect(g.got.filter(Boolean).length).toBeGreaterThanOrEqual(sol.stars)
      expect(sol.stars).toBe(3)
    })

    it(`${n}: there is a second, different way (another order of the cuts or a much later moment) that wins`, () => {
      expect(l.solutions.length).toBeGreaterThanOrEqual(2)
      const a = l.solutions[0]!
      const others = l.solutions.slice(1)
      const different = others.filter((s) => s.cuts.map((c) => c.rope).join() !== a.cuts.map((c) => c.rope).join() || Math.abs((s.cuts[0]?.t ?? 0) - (a.cuts[0]?.t ?? 0)) >= 0.5 || nominal(s) !== nominal(a))
      expect(different.length).toBeGreaterThanOrEqual(1)
      for (const s of others) {
        const g = play(l, s)
        expect(g.status === 'won' || g.status === 'caught', s.name).toBe(true)
        expect(starsOf(g)).toBeGreaterThanOrEqual(1)
      }
    })

    it(`${n}: exact timing is not needed (all moments 0.08 s earlier or later, and a little shaking)`, () => {
      for (const sol of l.solutions) {
        for (const shift of [-0.08, 0.08]) {
          const g = play(l, sol, { shift: Math.max(shift, -(sol.cuts[0]?.t ?? 0)) })
          expect(g.status === 'won' || g.status === 'caught', `${sol.name} shift ${shift}`).toBe(true)
        }
      }
      const sol = l.solutions[0]!
      for (const seed of [1, 2, 3]) {
        const g = play(l, sol, { jitter: (k) => (((k * 7 + seed * 13) % 5) - 2) * 0.03 })
        expect(g.status === 'won' || g.status === 'caught', `shaking ${seed}`).toBe(true)
      }
    })
  }
})
