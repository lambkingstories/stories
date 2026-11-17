/**
 * "Nehemias Mauer": the 60 levels. Every level can be won: a test wall of unit stones (with a long beam over every gate) is put up on the foundation
 * and the physics has to hold it and touch every flag.
 */
import { describe, expect, it } from 'vitest'
import { dropHand, marksHit, moveHand, rotateHand, starsOf, tick, type Game } from '../src/utils/nehemiaMauerGame'
import { CHAPTER_COUNT, LEVELS, LEVELS_PER_CHAPTER, levelGame, type LevelDef } from '../src/utils/nehemiaMauerLevels'
import { makeBody } from '../src/utils/nehemiaMauerPhysics'

/** Puts up a full wall for the level: unit stones in every cell, a beam over every gate. */
function testWall(g: Game, L: LevelDef) {
  const add = (x: number, y: number, hw: number, hh: number) => {
    const b = g.world.add(makeBody(g.world.newId(), x, y, hw, hh, 1, 0.9))
    b.touched = true
    g.stones.push(b)
  }
  // one beam over each group of gates (gates that share a pillar share a beam): from one column left of the first gate to one column right of the last
  const groups: { from: number; to: number; gh: number; top: number }[] = []
  for (const [gx, gw, gh] of L.gates) {
    const top = Math.min(L.heights[gx]!, L.heights[gx + gw - 1]!)
    const last = groups[groups.length - 1]
    if (last && gx - 1 <= last.to) {
      last.to = gx + gw
      last.top = Math.min(last.top, top)
    } else groups.push({ from: gx - 1, to: gx + gw, gh, top })
  }
  const inBeam = (c: number, row: number) => groups.some((g0) => c >= g0.from && c <= g0.to && row >= g0.gh && row < g0.top)
  for (const g0 of groups) {
    const w = g0.to - g0.from + 1
    add(L.x0 + g0.from + w / 2, (g0.gh + g0.top) / 2, w / 2, (g0.top - g0.gh) / 2)
  }
  for (let c = 0; c < L.heights.length; c++) {
    const gate = L.gates.find(([gx, gw]) => c >= gx && c < gx + gw)
    for (let row = 0; row < L.heights[c]!; row++) {
      if (gate && row < gate[2]) continue
      if (inBeam(c, row)) continue
      add(L.x0 + c + 0.5, row + 0.5, 0.5, 0.5)
    }
  }
}

describe('the level table', () => {
  it('has 60 levels in six chapters of ten', () => {
    expect(LEVELS).toHaveLength(60)
    expect(CHAPTER_COUNT * LEVELS_PER_CHAPTER).toBe(60)
    for (let c = 0; c < 6; c++) expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(10)
  })

  it('has flags above the foundation and inside the world; gates are two wide and have a pillar at both sides', () => {
    for (const l of LEVELS) {
      expect(l.marks.length).toBeGreaterThan(0)
      for (const m of l.marks) {
        expect(m.x).toBeGreaterThan((l.width - l.base) / 2)
        expect(m.x).toBeLessThan((l.width + l.base) / 2)
        expect(m.y).toBeGreaterThan(0)
        expect(m.y).toBeLessThanOrEqual(11)
      }
      expect(l.width).toBeLessThanOrEqual(14)
      for (const [gx, gw] of l.gates) {
        expect(gw).toBeLessThanOrEqual(2)
        expect(gx).toBeGreaterThanOrEqual(1)
        expect(gx + gw).toBeLessThanOrEqual(l.heights.length - 1)
      }
    }
  })

  it('gets harder: higher and wider walls, more weather', () => {
    const area = (c: number) => {
      const ls = LEVELS.filter((l) => l.chapter === c)
      return ls.reduce((n, l) => n + l.heights.reduce((a, b) => a + b, 0), 0) / ls.length
    }
    expect(area(0)).toBeLessThan(area(2))
    expect(area(2)).toBeLessThan(area(5))
    expect(LEVELS[0]!.wind + Number(LEVELS[0]!.rain) + Number(LEVELS[0]!.quake)).toBe(0)
    expect(LEVELS.filter((l) => l.chapter === 1).every((l) => l.wind > 0)).toBe(true)
    expect(LEVELS.filter((l) => l.chapter === 2).every((l) => l.rain)).toBe(true)
    expect(LEVELS.filter((l) => l.chapter === 3).every((l) => l.quake)).toBe(true)
    expect(LEVELS.filter((l) => l.chapter === 5).every((l) => l.night && l.quake && l.rain && l.wind > 0)).toBe(true)
  })

  it('brings new things one level at a time', () => {
    const intro = LEVELS.filter((l) => l.intro).map((l) => l.intro)
    expect(new Set(intro).size).toBe(intro.length)
  })
})

describe('every level can be built', () => {
  LEVELS.forEach((L, i) => {
    it(`level ${i + 1} (chapter ${L.chapter + 1}.${L.index + 1})`, () => {
      const g = levelGame(i)
      testWall(g, L)
      for (let k = 0; k < 6 * 60; k++) tick(g, 1 / 60)
      expect(marksHit(g)).toBe(g.marks.length)
      expect(g.status).toBe('won')
      expect(g.lost).toBe(0)
    })
  })
})

describe('playing', () => {
  it('a child that just drops stones in the middle of the first level gets to the flag', () => {
    const g = levelGame(0)
    for (let k = 0; k < 14 && g.status === 'play'; k++) {
      moveHand(g, g.def.width / 2)
      if (g.hand && g.hand.type >= 1 && g.hand.type <= 3) rotateHand(g)
      dropHand(g)
      for (let t = 0; t < 4 * 60; t++) tick(g, 1 / 60)
    }
    expect(g.status).toBe('won')
    expect(starsOf(g)).toBeGreaterThanOrEqual(1)
  })
})
