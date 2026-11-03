import { afterEach, describe, expect, it, vi } from 'vitest'
import { GROUND, KINDS, LEVELS, SLING, W, body, clampPull, forehead, newGame, preview, shoot, shotVelocity, starsFor, step, type Game } from '../src/utils/davidGame'

const run = (g: Game, seconds: number, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) step(g, dt)
}

describe('the sling', () => {
  it('shoots away from the pull, harder the further it is pulled', () => {
    const soft = shotVelocity(-40, 10)
    const hard = shotVelocity(-170, 10)
    expect(soft.vx).toBeGreaterThan(0)
    expect(hard.vx).toBeGreaterThan(soft.vx)
    expect(shotVelocity(-3, 0).power).toBeLessThan(0.12)
  })

  it('keeps the pull inside its reach', () => {
    const c = clampPull(-1000, 0)
    expect(Math.hypot(c.x, c.y)).toBeCloseTo(170, 5)
  })

  it('a short pull shoots nothing and costs no stone', () => {
    const g = newGame(LEVELS[0]!)
    expect(shoot(g, -5, 0)).toBe(false)
    expect(g.stonesLeft).toBe(LEVELS[0]!.stones)
  })

  it('a shot costs a stone and the stone falls under gravity', () => {
    const g = newGame({ ...LEVELS[0]!, waves: [] })
    expect(shoot(g, -170, 0)).toBe(true)
    expect(g.stonesLeft).toBe(LEVELS[0]!.stones - 1)
    const y0 = g.stones[0]!.y
    run(g, 0.5)
    expect(g.stones[0]!.y).toBeGreaterThan(y0)
  })

  it('shows the first part of the flight', () => {
    const g = newGame(LEVELS[0]!)
    const dots = preview(g, -170, 40)
    expect(dots.length).toBeGreaterThan(5)
    expect(dots[0]!.x).toBeGreaterThan(SLING.x)
  })
})

describe('the animals', () => {
  it('a stone that hits a wolf scares it away', () => {
    const g = newGame({ ...LEVELS[0]!, waves: [{ kind: 'wolf', after: 0.01 }] })
    run(g, 0.1)
    const a = g.animals[0]!
    const b = body(a)
    // put a stone right on the wolf
    g.stones.push({ x: b.x, y: b.y, vx: 100, vy: 0, bounces: 3, age: 0 })
    step(g, 1 / 60)
    expect(a.mode).toBe('flee')
    expect(g.score).toBe(KINDS.wolf.points)
  })

  it('the bear needs three hits', () => {
    const g = newGame({ ...LEVELS[1]!, waves: [{ kind: 'bear', after: 0.01 }], boulders: [] })
    run(g, 0.1)
    const a = g.animals[0]!
    for (let i = 0; i < 2; i++) {
      const b = body(a)
      g.stones.push({ x: b.x, y: b.y, vx: 100, vy: 0, bounces: 3, age: 0 })
      step(g, 1 / 60)
      expect(a.mode).toBe('come')
    }
    const b = body(a)
    g.stones.push({ x: b.x, y: b.y, vx: 100, vy: 0, bounces: 3, age: 0 })
    step(g, 1 / 60)
    expect(a.mode).toBe('flee')
  })

  it('an animal that reaches the sheep scares one of them away', () => {
    const g = newGame({ ...LEVELS[0]!, waves: [{ kind: 'wolf', after: 0.01 }] })
    run(g, 20)
    expect(g.sheep).toBe(2)
    expect(g.lostSheep).toBe(1)
  })

  it('the round is lost when the sheep are gone', () => {
    const g = newGame({ ...LEVELS[0]!, waves: Array.from({ length: 4 }, () => ({ kind: 'wolf' as const, after: 0.3 })) })
    run(g, 40)
    expect(g.phase).toBe('lost')
    expect(starsFor(g)).toBe(0)
  })
})

describe('Goliath', () => {
  afterEach(() => vi.restoreAllMocks())
  const goliath = () => {
    const g = newGame({ ...LEVELS[4]!, wind: 0, gust: false, waves: [{ kind: 'goliath', after: 0.01 }] })
    run(g, 0.1)
    return g
  }

  it('falls from a stone on the forehead', () => {
    const g = goliath()
    const a = g.animals[0]!
    a.shield = 0
    a.shieldIn = 99
    const f = forehead(a)
    g.stones.push({ x: f.x, y: f.y, vx: 100, vy: 0, bounces: 3, age: 0 })
    step(g, 1 / 60)
    expect(a.mode).toBe('fall')
    run(g, 2)
    expect(g.phase).toBe('won')
  })

  it('the shield stops the stone', () => {
    const g = goliath()
    const a = g.animals[0]!
    a.shield = 1
    const f = forehead(a)
    g.stones.push({ x: f.x, y: f.y, vx: 100, vy: 0, bounces: 3, age: 0 })
    step(g, 1 / 60)
    expect(a.mode).toBe('come')
  })

  it('lifts the shield against a stone that flies at his head, a moment after the throw', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const g = goliath()
    const a = g.animals[0]!
    a.shield = 0
    a.shieldIn = 5
    const f = forehead(a)
    // a flight of half a second that ends on the forehead
    g.stones.push({ x: f.x - 600, y: f.y, vx: 1200, vy: -375, bounces: 3, age: 0 })
    run(g, 0.04)
    expect(a.shield).toBe(0)
    run(g, 0.3)
    expect(a.shield).toBeGreaterThan(0)
  })

  it('does not lift the shield against a stone that is no threat to his head', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const g = goliath()
    const a = g.animals[0]!
    a.shield = 0
    a.shieldIn = 5
    const f = forehead(a)
    g.stones.push({ x: f.x - 600, y: f.y + 400, vx: 1200, vy: -375, bounces: 3, age: 0 })
    run(g, 0.4)
    expect(a.shield).toBe(0)
  })

  it('can miss the moment: a stone he does not answer gets through', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.95)
    const g = goliath()
    const a = g.animals[0]!
    a.shield = 0
    a.shieldIn = 5
    const f = forehead(a)
    g.stones.push({ x: f.x - 600, y: f.y, vx: 1200, vy: -375, bounces: 3, age: 0 })
    run(g, 0.7)
    expect(a.mode).toBe('fall')
  })

  it('a stone on the armour bounces off', () => {
    const g = goliath()
    const a = g.animals[0]!
    a.shield = 0
    a.shieldIn = 99
    const b = body(a)
    g.stones.push({ x: b.x - b.r, y: b.y + 20, vx: 600, vy: 0, bounces: 3, age: 0 })
    step(g, 1 / 60)
    expect(a.mode).toBe('come')
    expect(g.stones[0]!.vx).toBeLessThan(0)
  })
})

describe('the stars of a level', () => {
  const won = (lost: number, left: number): Game => ({ ...newGame(LEVELS[0]!), phase: 'won', lostSheep: lost, stonesLeft: left })
  it('winning is one star, no sheep lost another, stones left the third', () => {
    expect(starsFor(won(2, 0))).toBe(1)
    expect(starsFor(won(0, 0))).toBe(2)
    expect(starsFor(won(0, 6))).toBe(3)
    expect(starsFor(won(1, 6))).toBe(2)
  })

  it('has five levels and every animal is inside the scene when it comes', () => {
    expect(LEVELS).toHaveLength(5)
    expect(W).toBe(1600)
    expect(GROUND).toBeGreaterThan(SLING.y)
  })
})

describe('the shots can reach every place', () => {
  // a wolf that stands still: is there a pull that hits it?
  const canHit = (x: number, level = LEVELS[0]!) => {
    for (let px = -170; px <= 0; px += 10) {
      for (let py = -100; py <= 170; py += 10) {
        const g = newGame({ ...level, waves: [{ kind: 'wolf', after: 0.0001 }], boulders: [] })
        step(g, 0.01)
        g.animals[0]!.x = x
        g.animals[0]!.speed = 0
        if (!shoot(g, px, py)) continue
        for (let t = 0; t < 4 && g.stones.length; t += 1 / 60) {
          step(g, 1 / 60)
          g.animals[0]!.x = x
          if (g.animals[0]!.mode === 'flee') return true
        }
      }
    }
    return false
  }

  it('a wolf close by and one far away can be hit', () => {
    expect(canHit(520)).toBe(true)
    expect(canHit(900)).toBe(true)
    expect(canHit(1450)).toBe(true)
  })

  it('also in the wind', () => {
    expect(canHit(1100, LEVELS[3]!)).toBe(true)
  })
})
