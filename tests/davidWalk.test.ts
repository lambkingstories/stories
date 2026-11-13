import { describe, expect, it } from 'vitest'
import { DEFAULT_DIMS, GAIT, approach, cycleLength, footPath, stepCount, strideLength, walkPose } from '@/utils/davidWalk'

const SPEED = 40

describe("Goliath's stride", () => {
  it('a foot that stands on the ground does not slide: its place in the world stays the same while the body moves on', () => {
    // the body moves forward by `dist`; the foot (forward from the hip) is `footX` from the body: world = dist + footX
    let checked = 0
    let start: number | null = null
    let ref = 0
    for (let d = 0; d < cycleLength(SPEED) * 3; d += 0.25) {
      const leg = walkPose(d, SPEED).near
      if (leg.stance) {
        const world = d + leg.footX
        if (start === null) {
          start = d
          ref = world
        }
        // inside one standing period the world place does not change (all the standing periods have their own place)
        if (d - start < strideLength(SPEED) / SPEED * SPEED * 0.99) expect(world).toBeCloseTo(ref, 3)
        checked++
        expect(leg.footY).toBeCloseTo(DEFAULT_DIMS.ankle, 6)
      } else start = null
    }
    expect(checked).toBeGreaterThan(100)
  })

  it('the stride is what the body moves while a foot stands (speed x stance time)', () => {
    expect(strideLength(SPEED)).toBeCloseTo(SPEED * GAIT.duty * GAIT.cycle, 9)
    const a = footPath(0, SPEED).x
    const b = footPath(GAIT.duty - 1e-9, SPEED).x
    expect(a - b).toBeCloseTo(strideLength(SPEED), 3)
  })

  it('the path of the foot is smooth: no jump anywhere in the cycle, also where the foot lifts off and sets down', () => {
    const dt = 0.01
    let prev = walkPose(0, SPEED)
    for (let d = dt * SPEED; d < cycleLength(SPEED) * 2; d += dt * SPEED) {
      const p = walkPose(d, SPEED)
      for (const [a, b] of [[prev.near, p.near], [prev.far, p.far]] as const) {
        expect(Math.abs(b.footX - a.footX)).toBeLessThan(2.5)
        expect(Math.abs(b.footY - a.footY)).toBeLessThan(2.5)
        expect(Math.abs(b.thigh - a.thigh)).toBeLessThan(0.04)
        expect(Math.abs(b.shin - a.shin)).toBeLessThan(0.05)
        expect(Math.abs(b.foot - a.foot)).toBeLessThan(0.05)
      }
      expect(Math.abs(p.hipY - prev.hipY)).toBeLessThan(0.8)
      prev = p
    }
  })

  it('the legs keep their length and the knee points forward (the knee is never overstretched)', () => {
    for (let d = 0; d < cycleLength(SPEED); d += 0.7) {
      const w = walkPose(d, SPEED)
      for (const l of [w.near, w.far]) {
        expect(Math.hypot(l.kneeX, w.hipY - l.kneeY)).toBeCloseTo(DEFAULT_DIMS.thigh, 3)
        expect(Math.hypot(l.footX - l.kneeX, l.kneeY - l.footY)).toBeCloseTo(DEFAULT_DIMS.shin, 3)
        // the knee is in front of the line from hip to foot
        expect(l.thigh).toBeGreaterThan(l.shin - 1e-9)
        expect(l.footY).toBeGreaterThanOrEqual(DEFAULT_DIMS.ankle - 1e-9)
      }
    }
  })

  it('the two legs are half a cycle apart, and the arms swing against the legs', () => {
    const w0 = walkPose(0, SPEED)
    const w1 = walkPose(cycleLength(SPEED) / 2, SPEED)
    expect(w0.near.footX).toBeCloseTo(w1.far.footX, 6)
    expect(w0.far.footX).toBeCloseTo(w1.near.footX, 6)
    // the near foot is forward: the near arm is back
    expect(w0.near.footX).toBeGreaterThan(0)
    expect(w0.armShield).toBeLessThan(0)
    // both feet are on the ground for a moment, and never both in the air
    let both = 0
    for (let d = 0; d < cycleLength(SPEED); d += 0.5) {
      const w = walkPose(d, SPEED)
      expect(w.near.stance || w.far.stance).toBe(true)
      if (w.near.stance && w.far.stance) both++
    }
    expect(both).toBeGreaterThan(5)
  })

  it('the body rises and sinks twice per cycle, around zero', () => {
    let min = 0
    let max = 0
    let sum = 0
    let n = 0
    for (let d = 0; d < cycleLength(SPEED); d += 0.5) {
      const b = walkPose(d, SPEED).bob
      min = Math.min(min, b)
      max = Math.max(max, b)
      sum += b
      n++
    }
    expect(max).toBeCloseTo(GAIT.bob, 1)
    expect(min).toBeCloseTo(-GAIT.bob, 1)
    expect(Math.abs(sum / n)).toBeLessThan(0.3)
  })

  it('counts the steps (for the dust and the shake): one per half cycle', () => {
    expect(stepCount(0, SPEED)).toBe(0)
    expect(stepCount(cycleLength(SPEED) / 2 + 0.01, SPEED)).toBe(1)
    expect(stepCount(cycleLength(SPEED) * 3, SPEED)).toBe(6)
  })

  it('stands still when the distance does not grow (he fell)', () => {
    const a = walkPose(123.4, SPEED)
    const b = walkPose(123.4, SPEED)
    expect(b).toEqual(a)
  })

  it('approach goes softly to the goal without passing it', () => {
    let v = 0
    for (let i = 0; i < 100; i++) {
      const n = approach(v, 1, 8, 1 / 60)
      expect(n).toBeGreaterThanOrEqual(v)
      expect(n).toBeLessThanOrEqual(1)
      v = n
    }
    expect(v).toBeGreaterThan(0.99)
  })
})
