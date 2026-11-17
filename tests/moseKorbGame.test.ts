/**
 * "Moses Körbchen": the rules and the physics (ropes, cutting, falling, sliding, landing, lotus blossoms, bubbles, fans, seesaws, wheels, ducks).
 */
import { describe, expect, it } from 'vitest'
import { BASKET_R, DT, W, cutAt, cutRope, makeGame, ropeHolds, starCount, starsOf, step, stepOnce, tap, type LevelDef } from '../src/utils/moseKorbGame'

function level(extra: Partial<LevelDef> = {}): LevelDef {
  return {
    chapter: 0,
    index: 0,
    basket: { x: 180, y: 240 },
    ropes: [{ ax: 180, ay: 90 }],
    segs: [{ x1: 0, y1: 540, x2: 360, y2: 540, kind: 'clay', t: 10 }],
    stars: [
      { x: 180, y: 330 },
      { x: 180, y: 400 },
      { x: 180, y: 460 }
    ],
    target: { x: 180, y: 505, r: 36, figure: 'nest' },
    solutions: [],
    ...extra
  }
}

function run(g: ReturnType<typeof makeGame>, seconds: number) {
  const n = Math.round(seconds / DT)
  for (let i = 0; i < n; i++) stepOnce(g)
}

describe('ropes', () => {
  it('hold the basket: it hangs under the anchor without falling', () => {
    const g = makeGame(level({ target: { x: 20, y: 20, r: 5, figure: 'nest' } }))
    run(g, 3)
    expect(g.status).toBe('play')
    expect(Math.abs(g.basket.x - 180)).toBeLessThan(2)
    expect(g.basket.y).toBeGreaterThan(238)
    expect(g.basket.y).toBeLessThan(246)
    expect(ropeHolds(g, 0)).toBe(true)
  })

  it('stay as long as they were made (hardly any stretch while the basket swings)', () => {
    const g = makeGame(level({ basket: { x: 70, y: 200 }, ropes: [{ ax: 180, ay: 80 }], target: { x: 20, y: 20, r: 5, figure: 'nest' } }))
    const len = Math.hypot(70 - 180, 200 - 80)
    let worst = 0
    for (let i = 0; i < 120 * 6; i++) {
      stepOnce(g)
      worst = Math.max(worst, Math.hypot(g.basket.x - 180, g.basket.y - 80) - len)
    }
    expect(worst).toBeLessThan(len * 0.03)
  })

  it('swing like a pendulum (the time of one swing follows the length)', () => {
    const g = makeGame(level({ basket: { x: 150, y: 250 }, ropes: [{ ax: 180, ay: 100 }], target: { x: 20, y: 20, r: 5, figure: 'nest' } }))
    const L = Math.hypot(30, 150)
    const cross: number[] = []
    let prev = g.basket.x - 180
    for (let i = 0; i < 120 * 8; i++) {
      stepOnce(g)
      const rel = g.basket.x - 180
      if (prev < 0 && rel >= 0) cross.push(g.t)
      prev = rel
    }
    expect(cross.length).toBeGreaterThanOrEqual(2)
    const period = cross[1]! - cross[0]!
    const theory = 2 * Math.PI * Math.sqrt(L / 1000)
    expect(period).toBeGreaterThan(theory * 0.9)
    expect(period).toBeLessThan(theory * 1.15)
  })
})

describe('cutting', () => {
  it('a swipe across the rope cuts it; the basket falls', () => {
    const g = makeGame(level())
    const n = cutAt(g, 150, 160, 210, 160)
    expect(n).toBe(1)
    expect(ropeHolds(g, 0)).toBe(false)
    run(g, 0.4)
    expect(g.basket.y).toBeGreaterThan(300)
  })

  it('a swipe that does not touch the rope cuts nothing', () => {
    const g = makeGame(level())
    expect(cutAt(g, 100, 160, 140, 160)).toBe(0)
    expect(ropeHolds(g, 0)).toBe(true)
  })

  it('a tap on the rope also cuts it (a swipe of length 0)', () => {
    const g = makeGame(level())
    expect(cutAt(g, 180, 150, 180, 150)).toBe(1)
  })

  it('one swipe can cut two ropes', () => {
    const g = makeGame(level({ ropes: [{ ax: 120, ay: 90 }, { ax: 240, ay: 90 }] }))
    expect(cutAt(g, 100, 160, 260, 160)).toBe(2)
    expect(g.ropes.every((r) => !r.live)).toBe(true)
  })

  it('the pieces of a cut rope fade away', () => {
    const g = makeGame(level())
    cutRope(g, 0)
    expect(g.ropes.length).toBe(2)
    run(g, 1.5)
    expect(g.ropes.length).toBe(0)
  })

  it('a rope that is already cut cannot be cut again', () => {
    const g = makeGame(level())
    expect(cutRope(g, 0)).toBe(true)
    expect(cutRope(g, 0)).toBe(false)
  })
})

describe('landing', () => {
  it('the basket that falls into the hands is caught softly, then the round is won with the stars on its way', () => {
    const g = makeGame(level({ segs: [{ x1: 120, y1: 541, x2: 240, y2: 541, kind: 'reed', t: 8 }] }))
    cutRope(g, 0)
    run(g, 4)
    expect(g.status).toBe('won')
    expect(g.events.some((e) => e.t === 'caught')).toBe(true)
    expect(g.events.some((e) => e.t === 'win')).toBe(true)
    expect(starCount(g)).toBe(3)
    expect(starsOf(g)).toBe(3)
    expect(Math.hypot(g.basket.x - 180, g.basket.y - 505)).toBeLessThan(4)
  })

  it('a landing without a lotus blossom is one star', () => {
    const g = makeGame(level({ stars: [{ x: 20, y: 20 }, { x: 340, y: 20 }, { x: 180, y: 20 }], segs: [{ x1: 120, y1: 541, x2: 240, y2: 541, kind: 'reed', t: 8 }] }))
    cutRope(g, 0)
    run(g, 4)
    expect(g.status).toBe('won')
    expect(starsOf(g)).toBe(1)
  })

  it('a basket that falls into the water floats and the round is not won', () => {
    const g = makeGame(level({ segs: [], ropes: [{ ax: 180, ay: 90 }], target: { x: 30, y: 300, r: 10, figure: 'nest' } }))
    cutRope(g, 0)
    run(g, 3)
    expect(g.status).toBe('splash')
    expect(starsOf(g)).toBe(0)
    expect(g.events.some((e) => e.t === 'splash')).toBe(true)
  })

  it('the ropes that still hold are let go when the hands take the basket', () => {
    const g = makeGame(level({ ropes: [{ ax: 150, ay: 90 }, { ax: 210, ay: 90 }], basket: { x: 180, y: 470 }, target: { x: 180, y: 480, r: 40, figure: 'nest' } }))
    run(g, 0.3)
    expect(g.status === 'caught' || g.status === 'won').toBe(true)
    expect(g.ropes.some((r) => r.live)).toBe(false)
  })

  it('a basket that rests without a rope and far from the hands is "stuck" (the child may start again)', () => {
    const g = makeGame(level({ segs: [{ x1: 0, y1: 300, x2: 360, y2: 300, kind: 'clay', t: 10 }], target: { x: 30, y: 500, r: 10, figure: 'nest' } }))
    cutRope(g, 0)
    run(g, 5)
    expect(g.status).toBe('play')
    expect(g.stuck).toBe(true)
  })
})

describe('walls', () => {
  it('a basket slides down a ramp and stops at the wall of the world', () => {
    const g = makeGame(
      level({
        basket: { x: 60, y: 150 },
        ropes: [{ ax: 60, ay: 60 }],
        segs: [
          { x1: 20, y1: 250, x2: 300, y2: 350, kind: 'wood', t: 6 },
          { x1: 0, y1: 420, x2: 360, y2: 420, kind: 'clay', t: 10 }
        ],
        stars: [{ x: 20, y: 20 }, { x: 40, y: 20 }, { x: 60, y: 20 }],
        target: { x: 30, y: 10, r: 5, figure: 'nest' }
      })
    )
    cutRope(g, 0)
    run(g, 2.2)
    expect(g.basket.x).toBeGreaterThan(200)
    expect(g.basket.x).toBeLessThanOrEqual(W - BASKET_R + 0.5)
  })

  it('the basket cannot leave the picture to the sides or the top', () => {
    const g = makeGame(level({ basket: { x: 30, y: 200 }, ropes: [{ ax: 120, ay: 60 }] }))
    cutRope(g, 0)
    for (let i = 0; i < 120 * 3; i++) {
      stepOnce(g)
      expect(g.basket.x).toBeGreaterThanOrEqual(BASKET_R - 0.01)
      expect(g.basket.x).toBeLessThanOrEqual(W - BASKET_R + 0.01)
      expect(g.basket.y).toBeGreaterThanOrEqual(BASKET_R - 0.01)
    }
  })

  it('a feather cushion throws the basket back up', () => {
    const g = makeGame(
      level({
        segs: [{ x1: 120, y1: 400, x2: 240, y2: 400, kind: 'feder', t: 5, kick: 430, e: 0.85 }],
        target: { x: 30, y: 10, r: 5, figure: 'nest' }
      })
    )
    cutRope(g, 0)
    let low = 0
    let rose = false
    for (let i = 0; i < 120 * 2.5; i++) {
      stepOnce(g)
      low = Math.max(low, g.basket.y)
      if (low > 360 && g.basket.y < low - 40) rose = true
    }
    expect(rose).toBe(true)
    expect(g.events.some((e) => e.t === 'bounce')).toBe(true)
  })

  it('a flume with a current carries the basket along', () => {
    const g = makeGame(
      level({
        basket: { x: 60, y: 200 },
        ropes: [{ ax: 60, ay: 60 }],
        segs: [{ x1: 20, y1: 300, x2: 340, y2: 300, kind: 'wood', t: 6, belt: 120 }],
        target: { x: 30, y: 10, r: 5, figure: 'nest' }
      })
    )
    cutRope(g, 0)
    run(g, 1)
    const x1 = g.basket.x
    run(g, 1)
    expect(g.basket.x - x1).toBeGreaterThan(60)
  })
})

describe('the lotus blossoms', () => {
  it('are picked up when the basket touches them, once', () => {
    const g = makeGame(level({ target: { x: 30, y: 10, r: 5, figure: 'nest' } }))
    cutRope(g, 0)
    run(g, 1.2)
    expect(g.got.filter(Boolean).length).toBeGreaterThanOrEqual(1)
    const stars = g.events.filter((e) => e.t === 'star')
    expect(stars.length).toBe(g.got.filter(Boolean).length)
  })
})

describe('bubbles', () => {
  const lvl = () => level({ bubbles: [{ x: 180, y: 330, drift: 50 }], target: { x: 300, y: 505, r: 36, figure: 'nest' }, segs: [] })

  it('a bubble takes the basket and lifts it, slowly, to the side', () => {
    const g = makeGame(lvl())
    cutRope(g, 0)
    run(g, 1.5)
    expect(g.events.some((e) => e.t === 'bubble')).toBe(true)
    const y1 = g.basket.y
    const x1 = g.basket.x
    run(g, 1)
    expect(g.basket.y).toBeLessThan(y1 - 20)
    expect(g.basket.x).toBeGreaterThan(x1 + 20)
    expect(g.status).toBe('play')
  })

  it('a tap on the bubble pops it and the basket falls on', () => {
    const g = makeGame(lvl())
    cutRope(g, 0)
    run(g, 2)
    const b = g.bubbles[0]!
    expect(tap(g, b.x, b.y)).toBe(true)
    expect(b.state).toBe('popped')
    const y = g.basket.y
    run(g, 0.4)
    expect(g.basket.y).toBeGreaterThan(y + 30)
  })

  it('a tap far from any bubble does nothing', () => {
    const g = makeGame(lvl())
    expect(tap(g, 20, 20)).toBe(false)
  })
})

describe('fans', () => {
  it('a tap switches the fan on for a moment and the wind pushes the basket', () => {
    const g = makeGame(level({ fans: [{ x: 40, y: 330, angle: 0 }], target: { x: 340, y: 20, r: 5, figure: 'nest' }, segs: [] }))
    cutRope(g, 0)
    run(g, 0.2)
    expect(tap(g, 40, 330)).toBe(true)
    run(g, 0.8)
    expect(g.basket.x).toBeGreaterThan(215)
    // not again at once
    expect(tap(g, 40, 330)).toBe(false)
  })
})

describe('seesaws and wheels', () => {
  const board = (a0: number) => ({
    x: 180,
    y: 400,
    segs: [{ x1: -60, y1: 0, x2: 60, y2: 0, t: 5 }],
    a0,
    minA: -0.4,
    maxA: 0.4,
    kind: 'seesaw' as const
  })

  it('a seesaw tips under the weight of the basket', () => {
    const g = makeGame(level({ basket: { x: 130, y: 240 }, ropes: [{ ax: 130, ay: 90 }], rotors: [board(0)], segs: [], target: { x: 340, y: 20, r: 5, figure: 'nest' } }))
    cutRope(g, 0)
    run(g, 1.2)
    expect(g.rotors[0]!.angle).toBeLessThan(-0.05)
  })

  it('a wheel turns by itself and carries a basket', () => {
    const paddles = Array.from({ length: 6 }, (_, k) => ({ x1: Math.cos((k * Math.PI) / 3) * 14, y1: Math.sin((k * Math.PI) / 3) * 14, x2: Math.cos((k * Math.PI) / 3) * 60, y2: Math.sin((k * Math.PI) / 3) * 60, t: 5 }))
    const g = makeGame(level({ rotors: [{ x: 180, y: 400, segs: paddles, hub: 14, a0: 0, drive: 0.8, kind: 'wheel' }], segs: [], target: { x: 340, y: 20, r: 5, figure: 'nest' } }))
    run(g, 2)
    expect(g.rotors[0]!.angle).toBeCloseTo(1.6, 1)
  })

  it('a duck swims to and fro and takes a basket that sits on it along', () => {
    const g = makeGame(
      level({
        basket: { x: 215, y: 200 },
        ropes: [{ ax: 215, ay: 60 }],
        movers: [{ x: 180, y: 400, ax: 60, ay: 0, period: 6, phase: 0, hw: 40, kind: 'duck' }],
        segs: [],
        target: { x: 340, y: 20, r: 5, figure: 'nest' }
      })
    )
    cutRope(g, 0)
    run(g, 1.6)
    const m = g.movers[0]!
    expect(g.status).toBe('play')
    expect(Math.abs(g.basket.x - m.x)).toBeLessThan(45)
    const x0 = g.basket.x
    run(g, 1)
    expect(Math.abs(g.basket.x - x0)).toBeGreaterThan(20)
  })
})

describe('determinism', () => {
  it('the same cuts at the same moments give the same game, also in other step sizes of the frames', () => {
    const play = (frame: number) => {
      const g = makeGame(level({ basket: { x: 60, y: 200 }, ropes: [{ ax: 150, ay: 70 }] }))
      let t = 0
      let cut = false
      while (t < 4) {
        if (!cut && g.t >= 1.0) {
          cutRope(g, 0)
          cut = true
        }
        step(g, frame)
        t += frame
      }
      return [g.basket.x, g.basket.y, g.status]
    }
    expect(play(1 / 60)).toEqual(play(1 / 60))
    const a = play(1 / 60) as number[]
    const b = play(1 / 30) as number[]
    expect(Math.abs(a[0]! - b[0]!)).toBeLessThan(40)
  })
})
