/**
 * The herd of the herding game (`utils/herd.ts`): the leader walks to the finger (never faster than a calm walk, never into the pond), the herd
 * follows on the trail in a row at a fixed distance, and the help bends around the pond.
 */
import { describe, expect, it } from 'vitest'
import { TRAIL_STEP, WALK_SPEED, clampOutside, extendTrail, followPositions, helpPath, inside, walk, type Pt } from '@/utils/herd'

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

describe('the pond', () => {
  it('a point inside the pond goes to its edge, straight away from the middle; a point outside stays', () => {
    const pond = { x: 50, y: 60, r: 10 }
    const edge = clampOutside({ x: 52, y: 60 }, pond)
    expect(dist(edge, pond)).toBeCloseTo(10, 5)
    expect(edge.x).toBeCloseTo(60, 5)
    expect(edge.y).toBeCloseTo(60, 5)
    expect(clampOutside({ x: 80, y: 60 }, pond)).toEqual({ x: 80, y: 60 })
    // exactly in the middle: it still goes to the edge (never stays inside)
    expect(dist(clampOutside({ x: 50, y: 60 }, pond), pond)).toBeCloseTo(10, 5)
    expect(inside({ x: 55, y: 60 }, pond)).toBe(true)
    expect(inside({ x: 61, y: 60 }, pond)).toBe(false)
  })
})

describe('the leader', () => {
  it('walks towards the finger, at most as fast as a calm walk, and stops at the finger', () => {
    let p: Pt = { x: 10, y: 100 }
    p = walk(p, { x: 90, y: 100 }, 0.1)
    expect(p.x).toBeCloseTo(10 + WALK_SPEED * 0.1, 5)
    expect(p.y).toBeCloseTo(100, 5)
    expect(walk({ x: 10, y: 100 }, { x: 12, y: 100 }, 1)).toEqual({ x: 12, y: 100 })
  })

  it('never steps into the pond: dragged into it, it stops at the edge, and dragged round it, it slides along the edge', () => {
    const pond = { x: 50, y: 60, r: 12 }
    let p: Pt = { x: 20, y: 60 }
    for (let t = 0; t < 4; t += 0.05) p = walk(p, { x: 50, y: 60 }, 0.05, pond)
    expect(dist(p, pond)).toBeGreaterThanOrEqual(12 - 0.001)
    expect(p.x).toBeLessThan(50)
    // the finger moves to the other side of the pond: the leader gets there and never enters
    let minimum = Infinity
    for (let t = 0; t < 8; t += 0.05) {
      p = walk(p, { x: 80, y: 60 }, 0.05, pond)
      minimum = Math.min(minimum, dist(p, pond))
    }
    expect(minimum).toBeGreaterThanOrEqual(12 - 0.001)
  })
})

describe('the trail and the followers', () => {
  const walkAlong = (points: Pt[]) => {
    const trail: Pt[] = []
    for (const p of points) extendTrail(trail, p)
    return trail
  }
  const line = (n: number) => Array.from({ length: n }, (_, i) => ({ x: 10 + i, y: 50 }))

  it('a new point comes on the trail only when the leader has moved far enough', () => {
    const trail: Pt[] = []
    extendTrail(trail, { x: 10, y: 10 })
    extendTrail(trail, { x: 10 + TRAIL_STEP / 2, y: 10 })
    expect(trail).toHaveLength(1)
    extendTrail(trail, { x: 10 + TRAIL_STEP, y: 10 })
    expect(trail).toHaveLength(2)
  })

  it('the followers stand on the trail behind the head, the same distance apart, in a row (first one `spacing` behind the head)', () => {
    const trail = walkAlong(line(40))
    const head = trail[trail.length - 1]!
    const f = followPositions(trail, 5, 3)
    expect(f).toHaveLength(3)
    expect(dist(head, f[0]!)).toBeCloseTo(5, 0)
    expect(dist(f[0]!, f[1]!)).toBeCloseTo(5, 0)
    expect(dist(f[1]!, f[2]!)).toBeCloseTo(5, 0)
    // they are all on the line the leader walked
    for (const p of f) expect(p.y).toBeCloseTo(50, 5)
    expect(f[0]!.x).toBeGreaterThan(f[1]!.x)
    expect(f[1]!.x).toBeGreaterThan(f[2]!.x)
  })

  it('they follow the bends: after a turn they stand on the way the leader took, not on a straight line to it', () => {
    const trail: Pt[] = []
    for (let x = 10; x <= 30; x += 1) extendTrail(trail, { x, y: 50 })
    for (let y = 51; y <= 70; y += 1) extendTrail(trail, { x: 30, y })
    const f = followPositions(trail, 8, 3)
    // the first follower is still on the straight part going down, the third one is already round the corner on the first leg
    expect(f[0]!.x).toBeCloseTo(30, 0)
    expect(f[0]!.y).toBeCloseTo(70 - 8, 0)
    expect(f[2]!.y).toBeCloseTo(50, 0)
    expect(f[2]!.x).toBeCloseTo(30 - 4, 0)
  })

  it('a trail that is too short leaves the followers at its beginning (they are all there, none is lost); an empty trail has no followers', () => {
    const trail = walkAlong(line(3))
    const f = followPositions(trail, 5, 3)
    expect(f).toHaveLength(3)
    for (const p of f) expect(p).toEqual(trail[0])
    expect(followPositions([], 5, 3)).toEqual([])
  })
})

describe('the help', () => {
  it('is a straight line when nothing is in the way, and bends round the pond when the pond is on the line', () => {
    const from = { x: 20, y: 100 }
    const to = { x: 80, y: 100 }
    expect(helpPath(from, to)).toEqual([from, to])
    expect(helpPath(from, to, { x: 50, y: 40, r: 8 })).toEqual([from, to])
    const bent = helpPath(from, to, { x: 50, y: 100, r: 9 })
    expect(bent).toHaveLength(3)
    // the point in between lies beside the pond, outside it
    expect(dist(bent[1]!, { x: 50, y: 100 })).toBeGreaterThan(9)
  })
})
