/**
 * The herd of the herding game (`utils/herd.ts`): animals step away from the finger, stay together, never crowd, slow down in the resting place,
 * lie down there and stay. A simulated shepherd (a finger that stands behind the animals, on the side away from the resting place) has to be able
 * to bring every kind of herd home, so that the game can be won with a finger.
 */
import { describe, expect, it } from 'vitest'
import { PUSH_RADIUS, REST_AFTER, SHY_RADIUS, makeAnimal, restingCount, stepHerd, type Animal, type Pt, type Zone } from '@/utils/herd'

const ZONE: Zone = { x: 70, y: 40, r: 14 }
const DT = 1 / 30

/** Run `seconds` with a finger that does not move. */
function run(animals: Animal[], pointer: Pt | null, seconds: number, zone: Zone = ZONE) {
  for (let t = 0; t < seconds; t += DT) stepHerd(animals, pointer, DT, zone)
}

/**
 * A simple shepherd: the finger stands a little behind the animal that is farthest from the resting place (seen from the place), so that the
 * herd is driven toward it. Returns the seconds it took, or null if the herd was not at rest after `limit` seconds.
 */
function shepherd(animals: Animal[], zone: Zone, limit = 40): number | null {
  let finger: Pt = { x: 50, y: 120 }
  for (let t = 0; t < limit; t += DT) {
    const left = animals.filter((a) => !a.resting)
    if (!left.length) return t
    const far = left.reduce((m, a) => (Math.hypot(a.x - zone.x, a.y - zone.y) > Math.hypot(m.x - zone.x, m.y - zone.y) ? a : m))
    const dx = zone.x - far.x
    const dy = zone.y - far.y
    const d = Math.hypot(dx, dy) || 1
    const behind = { x: far.x - (dx / d) * 14, y: far.y - (dy / d) * 14 }
    // the finger glides to its place (a hand cannot jump)
    const gx = behind.x - finger.x
    const gy = behind.y - finger.y
    const g = Math.hypot(gx, gy) || 1
    const step = Math.min(g, 90 * DT)
    finger = { x: finger.x + (gx / g) * step, y: finger.y + (gy / g) * step }
    stepHerd(animals, finger, DT, zone)
  }
  return animals.every((a) => a.resting) ? limit : null
}

describe('one animal', () => {
  it('steps away from the finger, the closer the finger the faster; a shy animal already from farther off', () => {
    const calm = [makeAnimal(50, 70)]
    run(calm, { x: 50 + PUSH_RADIUS - 2, y: 70 }, 0.5)
    // the finger is to the right: the animal went left
    expect(calm[0]!.x).toBeLessThan(50)
    const near = [makeAnimal(50, 70)]
    const far = [makeAnimal(50, 70)]
    run(near, { x: 58, y: 70 }, 0.5)
    run(far, { x: 50 + PUSH_RADIUS - 2, y: 70 }, 0.5)
    expect(50 - near[0]!.x).toBeGreaterThan(50 - far[0]!.x)
    // outside the reach nothing happens; a shy animal reaches farther
    const out = [makeAnimal(50, 70)]
    const shy = [makeAnimal(50, 70, true)]
    const at = { x: 50 + PUSH_RADIUS + 4, y: 70 }
    run(out, at, 0.5)
    run(shy, at, 0.5)
    expect(out[0]!.x).toBeCloseTo(50, 3)
    expect(shy[0]!.x).toBeLessThan(50)
    expect(PUSH_RADIUS + 4).toBeLessThan(SHY_RADIUS)
  })

  it('stops by itself when the finger lifts (damping), and stays on the meadow', () => {
    const a = [makeAnimal(10, 20)]
    a[0]!.vx = -30
    run(a, null, 3)
    expect(Math.hypot(a[0]!.vx, a[0]!.vy)).toBeLessThan(0.5)
    expect(a[0]!.x).toBeGreaterThanOrEqual(4)
    const b = [makeAnimal(96, 128)]
    run(b, { x: 80, y: 110 }, 5)
    expect(b[0]!.x).toBeLessThanOrEqual(96)
    expect(b[0]!.y).toBeLessThanOrEqual(129)
  })

  it('in the resting place it slows down, lies down after a moment and then stays, even when the finger comes close', () => {
    const a = [makeAnimal(ZONE.x, ZONE.y)]
    run(a, null, REST_AFTER - 0.2)
    expect(a[0]!.resting).toBe(false)
    run(a, null, 0.5)
    expect(a[0]!.resting).toBe(true)
    const where = { x: a[0]!.x, y: a[0]!.y }
    run(a, { x: where.x + 3, y: where.y }, 3)
    expect(a[0]!.x).toBe(where.x)
    expect(a[0]!.y).toBe(where.y)
    expect(restingCount(a)).toBe(1)
  })

  it('an animal that only passes through does not rest (the time starts again outside)', () => {
    const a = [makeAnimal(ZONE.x, ZONE.y)]
    run(a, null, 0.3)
    a[0]!.x = 30
    a[0]!.y = 90
    run(a, null, 0.2)
    expect(a[0]!.calm).toBe(0)
    expect(a[0]!.resting).toBe(false)
  })
})

describe('the herd', () => {
  it('animals do not crowd each other: two on one spot move apart', () => {
    const a = [makeAnimal(40, 80), makeAnimal(41, 80)]
    run(a, null, 1)
    expect(Math.hypot(a[0]!.x - a[1]!.x, a[0]!.y - a[1]!.y)).toBeGreaterThan(5)
  })

  it('the herd stays together while it is driven (the finger on one side pushes all of them the same way)', () => {
    const herd = [makeAnimal(40, 100), makeAnimal(50, 104), makeAnimal(58, 98), makeAnimal(46, 110), makeAnimal(54, 112)]
    run(herd, { x: 50, y: 125 }, 2)
    const ys = herd.map((a) => a.y)
    expect(Math.max(...ys)).toBeLessThan(112)
    const spread = Math.max(...herd.map((a) => Math.hypot(a.x - 50, a.y - Math.min(...ys))))
    expect(spread).toBeLessThan(40)
  })

  it('a shepherd that stands behind the herd brings five calm animals into the resting place', () => {
    const herd = [makeAnimal(30, 100), makeAnimal(42, 104), makeAnimal(55, 98), makeAnimal(36, 112), makeAnimal(50, 114)]
    const time = shepherd(herd, ZONE)
    expect(time, 'round 1 can be won').not.toBeNull()
    expect(restingCount(herd)).toBe(5)
    expect(time!).toBeLessThan(40)
  })

  it('and eight animals, two of them shy (round 2), from different corners of the meadow', () => {
    const herd = [
      makeAnimal(15, 60),
      makeAnimal(30, 105),
      makeAnimal(45, 118),
      makeAnimal(60, 108),
      makeAnimal(85, 95),
      makeAnimal(20, 85, true),
      makeAnimal(75, 118, true),
      makeAnimal(50, 90)
    ]
    const time = shepherd(herd, ZONE, 60)
    expect(time, 'round 2 can be won').not.toBeNull()
    expect(restingCount(herd)).toBe(8)
  })

  it('animals that rest stay where they lie while the others are still being driven', () => {
    const herd = [makeAnimal(ZONE.x, ZONE.y), makeAnimal(30, 100)]
    run(herd, null, 1.2)
    expect(herd[0]!.resting).toBe(true)
    const lie = { x: herd[0]!.x, y: herd[0]!.y }
    run(herd, { x: 30, y: 118 }, 4)
    expect(herd[0]!.x).toBe(lie.x)
    expect(herd[0]!.y).toBe(lie.y)
    expect(herd[1]!.y).toBeLessThan(100)
  })
})
