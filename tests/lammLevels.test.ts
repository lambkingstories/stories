/**
 * The 34 levels of "Das verlorene Lamm": every level can be won (the solver proves it and finds the fewest moves, with and without all flowers), no state of any level is a dead end
 * (so the child can try whatever it likes and can always go on), no two cells ever lie in the same place, the data says the truth about itself (`min`, `par`), the tip leads
 * to the goal by the shortest way, and random play never ends in a trap.
 */
import { describe, expect, it } from 'vitest'
import app from '../src/i18n/app'
import { BIG_GAMES } from '../src/data/bigGames'
import { withGameTexts } from '../src/i18n/bigGames'
import { buildGraph, explore, parseLevel, slack, solveLevel, stateKey, tipFor, tryMove, won, MAX_GROUPS } from '../src/utils/lammGame'
import { CHAPTERS, LEVELS } from '../src/utils/lammLevels'
import { fitView, levelBounds } from '../src/utils/lammView'

const texts = withGameTexts(app) as unknown as Record<'de' | 'en', { app: { bigGames: { lamm: { levels: string[]; hint: Record<string, string>; chapters: unknown[]; story: unknown[] } } } }>

describe('the list of levels', () => {
  it('has five chapters of at least five levels (34 in all), ids are different, chapters come in order', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(30)
    expect(CHAPTERS).toHaveLength(5)
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length)
    for (let c = 0; c < 5; c++) expect(LEVELS.filter((l) => l.chapter === c).length).toBeGreaterThanOrEqual(5)
    const chapters = LEVELS.map((l) => l.chapter)
    expect(chapters).toEqual([...chapters].sort((a, b) => a - b))
  })

  it('is entered as a big game with the stars of all its levels', () => {
    const g = BIG_GAMES.find((x) => x.id === 'lamm')!
    expect(g).toBeDefined()
    expect(g.at).toBe(90)
    expect(g.maxStars).toBe(LEVELS.length * 3)
    expect(g.image).toBe('images/spiele-gross/lamm/kachel.webp')
  })

  it('shows every mechanic first in a level of its own, in a sensible order', () => {
    const first = (m: string) => LEVELS.findIndex((l) => l.intro === m)
    for (const m of ['stairs', 'turn', 'slide', 'ride', 'perspective', 'lift', 'fold', 'link', 'gate'] as const) expect(first(m), m).toBeGreaterThanOrEqual(0)
    expect(first('stairs')).toBe(0)
    expect(first('turn')).toBeLessThan(first('slide'))
    expect(first('slide')).toBeLessThan(first('ride'))
    expect(first('ride')).toBeLessThan(first('perspective'))
    expect(first('perspective')).toBeLessThan(first('lift'))
    expect(first('lift')).toBeLessThan(first('fold'))
    expect(first('fold')).toBeLessThan(first('link'))
    expect(first('link')).toBeLessThan(first('gate'))
  })

  it('the difficulty rises: the later chapters need more moves than the first one', () => {
    const mean = (c: number) => {
      const ls = LEVELS.filter((l) => l.chapter === c)
      return ls.reduce((n, l) => n + l.min, 0) / ls.length
    }
    expect(mean(0)).toBeLessThan(mean(2))
    expect(mean(2)).toBeLessThan(mean(4))
    expect(Math.max(...LEVELS.filter((l) => l.chapter === 4).map((l) => l.min))).toBeGreaterThanOrEqual(5)
  })

  it('has a name for every level and a hint for every mechanic in german and english', () => {
    for (const lang of ['de', 'en'] as const) {
      const t = texts[lang].app.bigGames.lamm
      expect(t.levels, lang).toHaveLength(LEVELS.length)
      expect(t.chapters, lang).toHaveLength(5)
      expect(t.story, lang).toHaveLength(5)
      for (const l of LEVELS) if (l.intro) expect(t.hint[l.intro], `${lang} ${l.intro}`).toBeTruthy()
    }
  })
})

describe.each(LEVELS.map((l, i) => [i + 1, l] as const))('level %i', (_n, def) => {
  const m = parseLevel(def)
  const space = explore(m)
  const sol = solveLevel(m)

  it('is well formed: few groups, flowers, every crank moves something, the start state is free of collisions', () => {
    expect(m.groups.length).toBeLessThanOrEqual(MAX_GROUPS)
    expect(m.flowers).toBeLessThanOrEqual(4)
    if (m.groups.length) expect(def.controls.length).toBeGreaterThan(0)
    for (const c of m.controls) expect(c.groups.length).toBeGreaterThan(0)
    // every group can be moved by some crank
    for (const g of m.groups) expect(m.controls.some((c) => c.groups.includes(g.index)), `group ${g.def.id}`).toBe(true)
    expect(buildGraph(m, m.startState).collide).toBe(false)
  })

  it('can be won, with the fewest moves the data says, and with all flowers (so three stars are possible)', () => {
    expect(sol.best).toBe(def.min)
    expect(sol.bestAll).toBeGreaterThanOrEqual(sol.best)
    expect(def.par).toBe(sol.bestAll + slack(sol.bestAll))
  })

  it('has no dead end: from every state the lamb can still get home, and no move ever puts two cells in one place', () => {
    expect(sol.deadEnds).toBe(0)
    expect(sol.collisions).toBe(0)
    expect(space.nodes.length).toBeGreaterThan(0)
  })

  it('the tip leads to the goal by the shortest way', () => {
    let st = m.startState
    let lamb = m.start
    let steps = 0
    for (; steps < 40; steps++) {
      const tip = tipFor(space, st, lamb)
      if (!tip) break
      const next = tryMove(m, st, tip.g, tip.s)
      expect(next, `step ${steps}`).not.toBeNull()
      st = next!
      lamb = tip.s
    }
    expect(won(m, buildGraph(m, st), lamb)).toBe(true)
    expect(steps).toBe(def.min)
  })

  it('random play never ends in a trap (several walks of random touches, then the goal is still within reach)', () => {
    if (!m.controls.length) return
    let seed = 7 + def.id.length
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (let walk = 0; walk < 4; walk++) {
      let st = m.startState
      let lamb = m.start
      for (let i = 0; i < 30; i++) {
        const g = buildGraph(m, st)
        const members: number[] = []
        for (let c = 0; c < g.comp.length; c++) if (g.comp[c] === g.comp[lamb]) members.push(c)
        lamb = members[Math.floor(rnd() * members.length)]!
        const next = tryMove(m, st, Math.floor(rnd() * m.controls.length), lamb)
        if (next) st = next
      }
      const g = buildGraph(m, st)
      const idx = space.index.get(`${stateKey(m, st)}:${g.rep[g.comp[lamb]!]}`)
      expect(idx, 'the state was found by the solver').toBeDefined()
      expect(space.dist[idx!]).toBeGreaterThanOrEqual(0)
    }
  })

  it('fits on a phone held upright with tiles that are big enough, and held across', () => {
    const b = levelBounds(m)
    expect(fitView(b, 6, 66, 363, 700).s).toBeGreaterThanOrEqual(26)
    expect(fitView(b, 6, 44, 796, 321).s).toBeGreaterThanOrEqual(15)
  })
})
