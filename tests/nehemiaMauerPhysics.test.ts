/**
 * "Nehemias Mauer": the physics of the stones (boxes fall, stack, rest, sleep, wake up).
 */
import { describe, expect, it } from 'vitest'
import { World, collide, inside, makeBody, mulberry32 } from '../src/utils/nehemiaMauerPhysics'

function world() {
  const w = new World()
  const ground = w.add(makeBody(w.newId(), 5, -0.5, 6, 0.5, 0, 1))
  return { w, ground }
}
function run(w: World, seconds: number) {
  for (let i = 0; i < seconds * 60; i++) w.step(1 / 60)
}

describe('collide', () => {
  it('finds two contact points when a box lies on another', () => {
    const w = new World()
    const a = makeBody(w.newId(), 0, 0, 2, 0.5, 0, 1)
    const b = makeBody(w.newId(), 0, 0.99, 0.5, 0.5, 1, 1)
    const c = collide(a, b)
    expect(c).toHaveLength(2)
    expect(c[0]!.ny).toBeGreaterThan(0.99)
    expect(c[0]!.sep).toBeLessThan(0)
  })
  it('finds nothing for boxes that are apart', () => {
    const a = makeBody(1, 0, 0, 1, 1, 1, 1)
    const b = makeBody(2, 5, 0, 1, 1, 1, 1)
    expect(collide(a, b)).toHaveLength(0)
  })
  it('tells whether a point is inside a box', () => {
    const b = makeBody(1, 2, 3, 1, 0.5, 1, 1)
    expect(inside(b, 2.9, 3.4)).toBe(true)
    expect(inside(b, 3.2, 3)).toBe(false)
  })
})

describe('the world', () => {
  it('a box falls onto the ground and rests on it', () => {
    const { w } = world()
    const b = w.add(makeBody(w.newId(), 5, 4, 0.5, 0.5, 1, 0.9))
    b.age = 0.001
    run(w, 3)
    expect(b.y).toBeCloseTo(0.5, 1)
    expect(Math.abs(b.rot)).toBeLessThan(0.02)
    expect(b.asleep).toBe(true)
    expect(w.events.some((e) => e.type === 'land')).toBe(true)
  })

  it('a tower of ten stones stands', () => {
    const { w } = world()
    const bodies = []
    for (let i = 0; i < 10; i++) bodies.push(w.add(makeBody(w.newId(), 5, 0.5 + i, 0.5, 0.5, 1, 0.9)))
    run(w, 6)
    for (let i = 0; i < 10; i++) {
      expect(bodies[i]!.y).toBeGreaterThan(0.5 + i - 0.12)
      expect(Math.abs(bodies[i]!.x - 5)).toBeLessThan(0.06)
    }
  })

  it('a long beam on two pillars stays', () => {
    const { w } = world()
    const p1 = w.add(makeBody(w.newId(), 3.5, 1, 0.5, 1, 1, 0.9))
    const p2 = w.add(makeBody(w.newId(), 6.5, 1, 0.5, 1, 1, 0.9))
    const beam = w.add(makeBody(w.newId(), 5, 2.5, 2.5, 0.5, 1, 0.9))
    run(w, 5)
    expect(beam.y).toBeGreaterThan(2.4)
    expect(p1.y).toBeGreaterThan(0.95)
    expect(p2.y).toBeGreaterThan(0.95)
  })

  it('a stone that is dropped half beside the tower tips over but nothing explodes', () => {
    const { w } = world()
    const bottom = w.add(makeBody(w.newId(), 5, 0.5, 0.5, 0.5, 1, 0.9))
    const top = w.add(makeBody(w.newId(), 5.9, 3, 0.5, 0.5, 1, 0.9))
    top.age = 0.001
    run(w, 4)
    for (const b of [bottom, top]) {
      expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true)
      expect(b.y).toBeGreaterThan(-1)
    }
  })

  it('sleeping stones wake up when a stone falls on them, and the stones on top wake with them', () => {
    const { w } = world()
    const a = w.add(makeBody(w.newId(), 5, 0.5, 0.5, 0.5, 1, 0.9))
    const b = w.add(makeBody(w.newId(), 5, 1.5, 0.5, 0.5, 1, 0.9))
    a.touched = b.touched = true
    run(w, 3)
    expect(a.asleep && b.asleep).toBe(true)
    const c = w.add(makeBody(w.newId(), 5.2, 6, 0.5, 0.5, 1, 0.9))
    c.vy = -6
    c.age = 0.001
    let woke = false
    for (let i = 0; i < 120; i++) {
      w.step(1 / 60)
      if (!b.asleep) woke = true
    }
    expect(woke).toBe(true)
  })

  it('removing a stone wakes the stones that lay on it', () => {
    const { w } = world()
    const a = w.add(makeBody(w.newId(), 5, 0.5, 0.5, 0.5, 1, 0.9))
    const b = w.add(makeBody(w.newId(), 5, 1.5, 0.5, 0.5, 1, 0.9))
    a.touched = b.touched = true
    run(w, 3)
    expect(b.asleep).toBe(true)
    w.remove(a)
    expect(b.asleep).toBe(false)
    run(w, 2)
    expect(b.y).toBeLessThan(1)
  })

  it('is deterministic', () => {
    const go = () => {
      const { w } = world()
      const rng = mulberry32(7)
      const list = []
      for (let i = 0; i < 12; i++) list.push(w.add(makeBody(w.newId(), 4 + rng() * 2, 1 + i * 1.2, 0.5 + rng() * 0.5, 0.5, 1, 0.9)))
      run(w, 5)
      return list.map((b) => b.x.toFixed(4) + b.y.toFixed(4)).join(',')
    }
    expect(go()).toBe(go())
  })
})
