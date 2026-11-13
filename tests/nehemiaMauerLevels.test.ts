/**
 * "Nehemias Mauer": the 60 levels. Every level can be solved: the generator cuts the template into stones, and the test plays the solution
 * with the real rules (turn, move, drop) and checks that the template is full.
 */
import { describe, expect, it } from 'vitest'
import { analyze, checkMap, discard, hardDrop, move, rotate, starsOf, ORIENTS, type Game } from '../src/utils/nehemiaMauerGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, buildMap, levelGame, levelProblems, levelStones } from '../src/utils/nehemiaMauerLevels'

function playSolution(i: number): Game {
  const g = levelGame(i)
  const sol = levelStones(i).solution
  let k = 0
  let guard = 0
  while (g.status === 'play' && g.cur && guard++ < 500) {
    if (g.cur.decoy) {
      expect(discard(g)).toBe(true)
      continue
    }
    const p = sol[k++]!
    expect(g.cur.shape).toBe(p.shape)
    if (p.rot === 3) rotate(g, -1)
    else for (let r = 0; r < p.rot; r++) rotate(g, 1)
    expect(g.cur.rot).toBe(p.rot)
    let n = 0
    while (g.cur.x < p.x && n++ < 40) expect(move(g, 1)).toBe(true)
    while (g.cur.x > p.x && n++ < 40) expect(move(g, -1)).toBe(true)
    expect(g.cur.x).toBe(p.x)
    const before = g.placed.length
    expect(hardDrop(g)).toBe(true)
    expect(g.placed).toHaveLength(before + 1)
    const last = g.placed[g.placed.length - 1]!
    expect([last.shape, last.rot, last.x, last.y]).toEqual([p.shape, p.rot, p.x, p.y])
    // the rest of the wall must stay buildable after every stone of the solution
    expect(g.stuck).toBe(false)
  }
  return g
}

describe('the level table', () => {
  it('has 60 levels in six chapters of ten', () => {
    expect(LEVELS).toHaveLength(60)
    expect(CHAPTER_COUNT * LEVELS_PER_CHAPTER).toBe(60)
    for (let c = 0; c < 6; c++) expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(10)
  })

  it('has good maps: every column is one run, the fields are not wider than twelve columns', () => {
    expect(levelProblems()).toEqual([])
    for (const l of LEVELS) {
      expect(checkMap(l.map)).toEqual([])
      expect(l.map[0]!.length).toBeLessThanOrEqual(12)
      expect(l.map.length).toBeLessThanOrEqual(12)
    }
  })

  it('builds a skyline with a gate', () => {
    expect(buildMap('3333')).toEqual(['.####.', '.####.', '.####.'])
    expect(buildMap('353', [[1, 1, 2]])).toEqual(['...#...', '...#...', '..###..', '..#.#..', '..#.#..'])
  })

  it('gets harder: more stones from chapter to chapter, and the stones of the first chapters are few', () => {
    const count = (c: number) => LEVELS.map((l, i) => ({ l, i })).filter((x) => x.l.chapter === c).map((x) => levelStones(x.i).solution.length)
    const avg = (a: number[]) => a.reduce((n, v) => n + v, 0) / a.length
    expect(avg(count(0))).toBeLessThan(avg(count(2)))
    expect(avg(count(2))).toBeLessThan(avg(count(5)))
    expect(Math.max(...count(0))).toBeLessThanOrEqual(8)
    expect(Math.max(...count(5))).toBeGreaterThanOrEqual(20)
  })

  it('brings the new things one level at a time', () => {
    const intro = LEVELS.filter((l) => l.intro).map((l) => l.intro)
    expect(new Set(intro).size).toBe(intro.length)
    expect(LEVELS[0]!.decoys).toBe(0)
    expect(LEVELS.find((l) => l.decoys > 0)!.intro).toBe('rubble')
  })
})

describe('every level can be solved', () => {
  LEVELS.forEach((l, i) => {
    it(`level ${i + 1} (chapter ${l.chapter + 1}.${l.index + 1})`, () => {
      const info = levelStones(i)
      // the stones are exactly the cells of the template
      const cells = l.map.join('').split('#').length - 1
      const sum = info.solution.reduce((n, p) => n + ORIENTS[p.shape][0]!.cells.length, 0)
      expect(sum).toBe(cells)
      for (const m of l.must) expect(info.solution.some((p) => p.shape === m)).toBe(true)
      expect(info.queue.filter((q) => q.decoy)).toHaveLength(l.decoys)
      // it plays through with the real rules
      const g = playSolution(i)
      expect(g.status).toBe('won')
      expect(g.slotsLeft).toBe(0)
      expect(g.patched).toBe(0)
      expect(starsOf(g)).toBe(3)
    })
  })
})

describe('the generator is deterministic', () => {
  it('gives the same stones for the same level', () => {
    const a = levelStones(33)
    const b = levelGame(33)
    expect(b.queue.length + 1).toBe(a.queue.length)
    expect(JSON.stringify(a.solution)).toBe(JSON.stringify(levelStones(33).solution))
  })

  it('a fresh game is not stuck', () => {
    for (let i = 0; i < LEVELS.length; i += 7) {
      const g = levelGame(i)
      analyze(g)
      expect(g.stuck).toBe(false)
    }
  })
})
