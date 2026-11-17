/**
 * "Nehemias Mauer": the rules (the stone in the hand, dropping, the flags, the stars, the weather, nobody is ever stuck).
 */
import { describe, expect, it } from 'vitest'
import { HELP_AFTER, STONES, dropHand, handSize, holdSwap, marksHit, moveHand, newGame, rotateHand, starsOf, tick, towerTop, type Game, type GameDef } from '../src/utils/nehemiaMauerGame'
import { makeBody } from '../src/utils/nehemiaMauerPhysics'

const def = (extra: Partial<GameDef> = {}): GameDef => ({
  width: 8,
  base: 6,
  marks: [{ x: 4, y: 0.5 }],
  weights: [1, 1, 1, 1, 1, 1],
  wind: 0,
  rain: false,
  quake: false,
  night: false,
  par: 3,
  seed: 1,
  ...extra
})

function run(g: Game, s: number) {
  for (let i = 0; i < s * 60; i++) tick(g, 1 / 60)
}

describe('the stone in the hand', () => {
  it('hangs in the middle of the sky, moves within the world and turns', () => {
    const g = newGame(def())
    expect(g.hand!.x).toBe(4)
    expect(g.hand!.y).toBeGreaterThan(5)
    moveHand(g, 100)
    expect(g.hand!.x).toBeLessThanOrEqual(9)
    moveHand(g, -100)
    expect(g.hand!.x).toBeGreaterThanOrEqual(-1)
    const before = handSize(g.hand!)
    rotateHand(g)
    expect(handSize(g.hand!)).toEqual({ w: before.h, h: before.w })
    expect(g.queue).toHaveLength(3)
  })

  it('falls onto the foundation and lies still; the next stone comes at once', () => {
    const g = newGame(def())
    const first = g.hand!.type
    const b = dropHand(g)!
    expect(b.tag).toBe(first)
    expect(g.hand).not.toBeNull()
    expect(g.used).toBe(1)
    run(g, 4)
    expect(b.y).toBeCloseTo(STONES[first]!.h / 2, 1)
    expect(b.asleep).toBe(true)
    expect(g.events.some((e) => e.t === 'land')).toBe(true)
  })

  it('swaps with the reserve once per stone', () => {
    const g = newGame(def())
    const first = g.hand!.type
    expect(holdSwap(g)).toBe(true)
    expect(g.hold).toBe(first)
    expect(holdSwap(g)).toBe(false)
    dropHand(g)
    expect(holdSwap(g)).toBe(true)
    expect(g.hold).not.toBeNull()
  })
})

describe('the flags and the stars', () => {
  it('the wall is built when a stone lies still on the flag for a second', () => {
    const g = newGame(def())
    expect(marksHit(g)).toBe(0)
    moveHand(g, 4)
    dropHand(g)
    run(g, 6)
    expect(marksHit(g)).toBe(1)
    expect(g.status).toBe('won')
    expect(starsOf(g)).toBe(3)
  })

  it('stones that fall off cost a star but never stop the game, and the builders send long stones then', () => {
    const g = newGame(def({ marks: [{ x: 4, y: 30 }] }))
    for (let i = 0; i < 12; i++) {
      moveHand(g, -1)
      dropHand(g)
      run(g, 3)
    }
    expect(g.lost).toBeGreaterThanOrEqual(HELP_AFTER)
    expect(g.status).toBe('play')
    expect(g.hand).not.toBeNull()
    expect(g.queue.length).toBeGreaterThanOrEqual(2)
  })

  it('counts the stars by the stones that were lost and used', () => {
    const done = newGame(def())
    done.status = 'won'
    done.lost = 5
    expect(starsOf(done)).toBe(1)
    done.lost = 3
    expect(starsOf(done)).toBe(2)
    done.lost = 0
    done.used = 3
    expect(starsOf(done)).toBe(3)
    done.used = 9
    expect(starsOf(done)).toBe(2)
  })

  it('a flag that is touched by a stone that still moves does not count', () => {
    const g = newGame(def({ marks: [{ x: 4, y: 3 }] }))
    const b = g.world.add(makeBody(g.world.newId(), 4, 3, 0.5, 0.5, 1, 0.9))
    g.stones.push(b)
    b.vy = 5
    tick(g, 1 / 60)
    expect(marksHit(g)).toBe(0)
  })

  it('the tower top grows with the wall', () => {
    const g = newGame(def())
    expect(towerTop(g)).toBe(0)
    dropHand(g)
    run(g, 3)
    expect(towerTop(g)).toBeGreaterThan(0.5)
  })
})

describe('the weather', () => {
  it('wind pushes a falling stone', () => {
    const g = newGame(def({ wind: 8, marks: [{ x: 4, y: 30 }] }))
    g.clock = 1.5
    moveHand(g, 4)
    const b = dropHand(g)!
    let maxDx = 0
    for (let i = 0; i < 40; i++) {
      tick(g, 1 / 60)
      maxDx = Math.max(maxDx, Math.abs(b.x - 4))
    }
    expect(maxDx).toBeGreaterThan(0.01)
    run(g, 6)
    expect(Number.isFinite(b.x)).toBe(true)
  })

  it('rain makes the stones slippery', () => {
    const g = newGame(def({ rain: true }))
    const b = dropHand(g)!
    expect(b.friction).toBeLessThan(0.6)
  })

  it('the earth shakes now and then and the ground comes back to its place', () => {
    const g = newGame(def({ quake: true, marks: [{ x: 4, y: 30 }] }))
    let shook = false
    for (let i = 0; i < 12 * 60; i++) {
      tick(g, 1 / 60)
      if (g.shake > 0.5) shook = true
    }
    expect(shook).toBe(true)
    expect(g.events.some((e) => e.t === 'quake')).toBe(true)
    run(g, 3)
    expect(g.ground.x).toBeCloseTo(4, 3)
  })
})
