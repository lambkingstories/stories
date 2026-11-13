/**
 * The 36 levels of "Wasser für das Volk": every map is well formed, every level has its spring (or cloud), its vessel and three plants, and every solution that is kept for a
 * level (the first one wins three stars, the others at least the stars they say) really wins them when the simulator plays it.
 */
import { describe, expect, it } from 'vitest'
import { BIG_GAMES } from '../src/data/bigGames'
import { COLS, ROWS, checkMap, dig, newWorld, nextTipStep, playSolution, step, tipSteps, SIM_HZ } from '../src/utils/wasserGame'
import { LEVELS, WORLDS } from '../src/utils/wasserLevels'

describe('the list of levels', () => {
  it('has three worlds of twelve levels (at least 36 in all), the ids are different', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(36)
    expect(WORLDS.map((w) => w.count)).toEqual([12, 12, 12])
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
    expect(LEVELS.filter((l) => l.world === 0)).toHaveLength(12)
    expect(LEVELS.filter((l) => l.world === 1)).toHaveLength(12)
    expect(LEVELS.filter((l) => l.world === 2)).toHaveLength(12)
  })

  it('is entered as a big game with the stars of all its levels', () => {
    const g = BIG_GAMES.find((x) => x.id === 'wasser')!
    expect(g).toBeDefined()
    expect(g.at).toBe(60)
    expect(g.maxStars).toBe(LEVELS.length * 3)
  })

  it('shows every mechanic first in a level of its own (rock, sand, salt, mud, gate, wheel, cloud)', () => {
    const intros = LEVELS.map((l) => l.intro)
    for (const m of ['dig', 'rock', 'plants', 'sand', 'salt', 'mud', 'sources', 'gate', 'wheel', 'cloud', 'thorn'] as const) expect(intros, m).toContain(m)
    const first = (m: string) => LEVELS.findIndex((l) => l.intro === m)
    expect(first('dig')).toBe(0)
    expect(first('rock')).toBeLessThan(first('sand'))
    expect(first('sand')).toBeLessThan(first('salt'))
    expect(first('salt')).toBeLessThan(first('mud'))
    expect(first('gate')).toBeLessThan(first('wheel'))
  })
})

describe.each(LEVELS.map((l, i) => [i + 1, l] as const))('level %i', (_n, def) => {
  it('is well formed: 24 x 36 signs, a spring or a cloud, a vessel, three plants, a tip', () => {
    expect(def.map).toHaveLength(ROWS)
    expect(def.map.every((r) => r.length === COLS)).toBe(true)
    expect(checkMap(def.map)).toEqual([])
    const w = newWorld(def)
    expect(w.sources.length).toBeGreaterThanOrEqual(1)
    expect(w.vcells.length).toBeGreaterThan(8)
    expect(w.goal).toBeGreaterThan(40)
    expect(w.plants).toHaveLength(3)
    expect(def.tip.pts.length).toBeGreaterThanOrEqual(2)
    expect(def.solutions.length).toBeGreaterThanOrEqual(1)
    expect(def.solutions[0]!.stars).toBe(3)
    // without digging nothing happens: the water waits, the jar stays empty
    for (let i = 0; i < SIM_HZ * 2; i++) step(w)
    expect(w.vesselMass).toBe(0)
    expect(w.phase).toBe('ready')
    // the rock of the border cannot be dug
    expect(dig(w, 1, 1)).toBe(0)
  })

  it('can be won: every kept solution wins its stars', () => {
    for (const s of def.solutions) {
      const { out } = playSolution(def, s.strokes, 90)
      expect(out.phase, s.name).toBe('won')
      expect(out.stars, `${def.id}: ${s.name} (eff ${out.eff.toFixed(2)})`).toBeGreaterThanOrEqual(s.stars)
    }
  }, 60000)
})

describe.each(LEVELS.map((l, i) => [i + 1, l] as const))('tip of level %i', (_n, def) => {
  it('shows the way step by step, and the steps together win all three stars (all three plants can be reached)', () => {
    const steps = tipSteps(def)
    expect(steps.length).toBeGreaterThanOrEqual(2)
    // every point of the kept solution is in a step
    const all = def.solutions[0]!.strokes.length
    expect(steps.reduce((n, s) => n + s.length, 0)).toBeGreaterThanOrEqual(all)
    const { out, w } = playSolution(def, steps.map((pts) => ({ pts })), 90)
    expect(out.phase).toBe('won')
    expect(out.bloomed).toBe(w.plants.length)
    expect(out.stars).toBe(3)
    // at the start the first step is the next one; after all of it is dug nothing is left
    const fresh = newWorld(def)
    expect(nextTipStep(fresh, steps)).toBeGreaterThanOrEqual(0)
    expect(nextTipStep(w, steps)).toBe(-1)
  })
})
