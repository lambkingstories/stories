/**
 * "Jonatans Pfeile": the physics and the rules (flight under gravity and wind, walls that stick or throw back, ropes, switches and gates, weights,
 * the stars, the preview line, a game that is the same every time).
 */
import { describe, expect, it } from 'vitest'
import {
  DT,
  GRAV,
  V_MAX,
  aimPoints,
  advance,
  arrowsLeft,
  cloneGame,
  needsLeft,
  newGame,
  playShots,
  previewPath,
  progressOf,
  segHit,
  circleHit,
  segDist,
  settled,
  shoot,
  starsOf,
  step,
  type LevelDef
} from '../src/utils/bogenGame'
import { bar, box, gate, hook, gallows, jar, lv, rope, sw, target, weight, flag, bell, slide } from '../src/utils/bogenKit'

const plain = (o: Partial<LevelDef> = {}): LevelDef => lv(0, 0, { key: 't', items: [target('t', 99, 50, 1)], ...o })

function run(g: ReturnType<typeof newGame>, seconds: number) {
  for (let n = 0; n < seconds / DT; n++) step(g)
}

describe('geometry', () => {
  it('finds where a sweep meets a segment', () => {
    const h = segHit(0, 0, 10, 0, 5, -1, 5, 1)!
    expect(h.s).toBeCloseTo(0.5)
    expect(h.nx).toBe(-1)
    expect(segHit(0, 0, 10, 0, 12, -1, 12, 1)).toBeNull()
  })
  it('finds the first moment inside a circle and the distance to a rope', () => {
    expect(circleHit(0, 0, 10, 0, 5, 0, 1)).toBeCloseTo(0.4)
    expect(circleHit(0, 0, 10, 0, 5, 3, 1)).toBe(-1)
    expect(segDist(0, 0, 10, 0, 5, -1, 5, 1)).toBe(0)
    expect(segDist(0, 0, 10, 0, 5, 2, 5, 4)).toBeCloseTo(2)
  })
})

describe('the flight of an arrow', () => {
  it('follows the throwing parabola (gravity 10, speed 27 * pull)', () => {
    const g = newGame(plain(), 1)
    shoot(g, 45, 0.5)
    const a = g.arrows[0]!
    const p = aimPoints(g.def, Math.PI / 4)
    const v = V_MAX * 0.5
    const tFlight = (v * Math.SQRT1_2 + Math.sqrt((v * Math.SQRT1_2) ** 2 + 2 * GRAV * p.ty)) / GRAV
    const xEnd = p.tx + v * Math.SQRT1_2 * tFlight
    run(g, 6)
    expect(a.state).toBe('stuck')
    expect(a.y).toBeCloseTo(0, 1)
    expect(Math.abs(a.x - xEnd)).toBeLessThan(0.2)
  })

  it('goes farther with a tail wind and shorter against the wind', () => {
    const land = (wind: number) => {
      const g = newGame(plain({ wind }), 1)
      shoot(g, 40, 0.6)
      run(g, 6)
      return g.arrows[0]!.x
    }
    const calm = land(0)
    expect(land(4)).toBeGreaterThan(calm + 1)
    expect(land(-4)).toBeLessThan(calm - 1)
  })

  it('is deterministic: the same shots give the same game', () => {
    const def = plain({ polys: [bar(20, 0, 20, 8, 'stone', 0.5)], wind: 1.5 })
    const a = playShots(def, 2, [{ a: 30, f: 0.7 }, { a: 20, f: 0.9 }])
    const b = playShots(def, 2, [{ a: 30, f: 0.7 }, { a: 20, f: 0.9 }])
    expect(JSON.stringify(a.arrows)).toBe(JSON.stringify(b.arrows))
  })

  it('does not go on without a pull and ends when the supply is used up', () => {
    const g = newGame(plain(), 1)
    expect(arrowsLeft(g)).toBe(1 + 5)
    for (let i = 0; i < 6; i++) expect(shoot(g, 30, 0.8)).toBe(true)
    expect(shoot(g, 30, 0.8)).toBe(false)
  })
})

describe('walls', () => {
  it('wood and the ground hold the arrow', () => {
    const g = newGame(plain({ polys: [box(15, 0, 16, 10, 'wood')] }), 1)
    shoot(g, 5, 0.9)
    run(g, 3)
    const a = g.arrows[0]!
    expect(a.state).toBe('stuck')
    expect(a.x).toBeLessThan(15.1)
  })

  it('stone and shields throw the arrow back (a shield more strongly)', () => {
    const back = (mat: 'stone' | 'shield') => {
      const g = newGame(plain({ polys: [bar(18, 0, 18, 12, mat, 0.5)] }), 1)
      shoot(g, 8, 0.9)
      let vxAfter = 0
      let bounced = false
      for (let n = 0; n < 3 * 120 && !bounced; n++) {
        step(g)
        if (g.events.some((e) => e.t === 'bounce')) {
          bounced = true
          vxAfter = g.arrows[0]!.vx
        }
        g.events.length = 0
      }
      expect(bounced).toBe(true)
      return vxAfter
    }
    const stone = back('stone')
    const shield = back('shield')
    expect(stone).toBeLessThan(0)
    expect(shield).toBeLessThan(stone)
  })
})

describe('things to hit', () => {
  it('a target holds the arrow and counts; the level is won when all are done', () => {
    const def = plain({ items: [target('t', 14, 2.2, 1.5)] })
    let won = false
    for (let a = -3; a <= 12 && !won; a += 0.5) {
      const g = playShots(def, 1, [{ a, f: 0.62 }])
      if (g.status !== 'won') continue
      won = true
      expect(needsLeft(g)).toBe(0)
      const arrow = g.arrows[0]!
      expect(arrow.state).toBe('stuck')
      expect(arrow.inItem).toBe(0)
      // the arrow sits inside the target, not on its rim
      expect(Math.hypot(arrow.x - 14, arrow.y - 2.2)).toBeLessThan(1.5 * 0.75)
    }
    expect(won).toBe(true)
  })

  it('an arrow flies through a jar and a flag and goes on', () => {
    const def = plain({ items: [jar('j', 10, 3.2, 1.2), flag('f', 14, 2.6, 1.4), target('t', 22, 1.5, 1.5)] })
    // find an arrow that passes all three: try a few flat shots
    let ok = false
    for (let a = -2; a <= 12 && !ok; a += 0.5)
      for (let f = 0.4; f <= 1 && !ok; f += 0.05) {
        const g = playShots(def, 1, [{ a, f }])
        if (g.status === 'won') ok = true
      }
    expect(ok).toBe(true)
  })

  it('a bell is hit and the arrow drops', () => {
    const def = plain({ items: [bell('b', 14, 2.5, 1.6)] })
    let hit = false
    for (let a = -3; a <= 12 && !hit; a += 0.5) {
      const g = playShots(def, 1, [{ a, f: 0.6 }])
      if (g.status === 'won') hit = true
    }
    expect(hit).toBe(true)
  })

  it('a switch opens its gate, and the gate sinks into the ground', () => {
    const def = plain({
      gates: [gate('g1', 20, 6)],
      items: [sw('s', 12, 2.4, [{ t: 'open', id: 'g1' }], 1.4), target('t', 99, 50, 1)]
    })
    let g = newGame(def, 2)
    let found = false
    for (let a = -3; a <= 14 && !found; a += 0.5) {
      g = playShots(def, 2, [{ a, f: 0.55 }])
      if (g.gates[0]!.open) found = true
    }
    expect(found).toBe(true)
    run(g, 2)
    expect(g.gates[0]!.off).toBeCloseTo(6, 3)
    // an arrow now flies where the gate stood
    const before = g.arrows.length
    shoot(g, 0, 0.9)
    run(g, 0.5)
    expect(g.arrows.length).toBe(before + 1)
  })

  it('a shot rope lets the weight fall onto the jar below, which breaks', () => {
    const gal = gallows(14, 10.6, 4)
    const def = plain({
      deco: [gal],
      ropes: [rope('r', hook(gal)[0], hook(gal)[1], hook(gal)[0], hook(gal)[1] - 3.3, { holds: 'w' })],
      weights: [weight('w', hook(gal)[0], hook(gal)[1] - 4.1)],
      items: [jar('j', hook(gal)[0], 0.9, 1.0)]
    })
    let won = 0
    for (let a = 20; a <= 60; a += 1) {
      const g = playShots(def, 1, [{ a, f: 0.9 }])
      if (g.status === 'won' && g.ropes[0]!.cut && g.weights[0]!.state !== 'hang') won++
    }
    expect(won).toBeGreaterThan(2)
  })

  it('swinging and sliding things are where their time says', () => {
    const def = plain({ items: [target('t', 20, 2, 1.5, { motion: slide(10, 2, 20, 2, 4) })] })
    const g = newGame(def, 1)
    expect(g.items[0]!.x).toBeCloseTo(10)
    run(g, 2)
    expect(g.items[0]!.x).toBeCloseTo(20, 1)
    run(g, 2)
    expect(g.items[0]!.x).toBeCloseTo(10, 1)
  })
})

describe('the end of a round and the stars', () => {
  const easy = () => plain({ items: [target('t', 14, 2.2, 3.0)] })
  const winWith = (usedBefore: number) => {
    const g = newGame(easy(), 1)
    g.shots = usedBefore
    shoot(g, 2.5, 0.62)
    run(g, 4)
    return g
  }
  it('two or more arrows left are three stars, one is two, none is one', () => {
    expect(starsOf(winWith(0))).toBe(3)
    expect(starsOf(winWith(3))).toBe(3)
    expect(starsOf(winWith(4))).toBe(2)
    expect(starsOf(winWith(5))).toBe(1)
  })

  it('no stars and a friendly end when the arrows are used up', () => {
    const g = newGame(easy(), 1)
    for (let i = 0; i < 6; i++) shoot(g, 80, 0.3)
    run(g, 8)
    expect(g.status).toBe('lost')
    expect(starsOf(g)).toBe(0)
  })

  it('knows when everything has come to rest (arrows landed, weights down, gates open)', () => {
    const g = newGame(easy(), 1)
    expect(settled(g)).toBe(true)
    shoot(g, 40, 0.7)
    expect(settled(g)).toBe(false)
    run(g, 6)
    expect(settled(g)).toBe(true)
  })

  it('counts progress for the solver and clones a game without sharing', () => {
    const g = newGame(easy(), 1)
    const c = cloneGame(g)
    shoot(c, 40, 0.7)
    expect(g.arrows.length).toBe(0)
    expect(progressOf(g)).toBe(0)
  })
})

describe('the preview line', () => {
  it('shows the first seconds of the flight and stops at a wall', () => {
    const g = newGame(plain({ polys: [box(12, 0, 13, 30, 'wood')] }), 1)
    const pts = previewPath(g, 20, 0.9, 3)
    expect(pts.length).toBeGreaterThan(8)
    const lastX = pts[pts.length - 2]!
    expect(lastX).toBeLessThan(13)
    // a longer time does not go beyond the wall
    expect(previewPath(g, 20, 0.9, 6).length).toBe(pts.length)
  })

  it('does not change the game and uses the wind', () => {
    const g = newGame(plain({ wind: 4 }), 1)
    const calm = newGame(plain({ wind: 0 }), 1)
    const a = previewPath(g, 35, 0.7, 1.5)
    const b = previewPath(calm, 35, 0.7, 1.5)
    expect(a[a.length - 2]!).toBeGreaterThan(b[b.length - 2]!)
    expect(g.arrows.length).toBe(0)
    expect(g.t).toBe(0)
  })

  it('advances the game in fixed steps', () => {
    const g = newGame(plain(), 1)
    advance(g, 1)
    expect(g.t).toBeCloseTo(1, 1)
  })
})
