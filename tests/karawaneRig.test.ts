/**
 * "Karawane über die Dünen": the walk of the animals (diagonal pairs, feet that do not slide, rest when standing, stretched legs in the air)
 * and the layers of the background (they always cover the whole screen, also high in a jump).
 */
import { describe, expect, it } from 'vitest'
import { LEG_OFFSET, RIG_PARAMS, newPose, newRigState, rigPose, stepRig } from '../src/utils/karawaneRig'
import { LOOKS, backgroundBands } from '../src/utils/karawaneArt'

const P = RIG_PARAMS.donkey

function run(speed: number, seconds: number, airborne = false) {
  const s = newRigState()
  for (let i = 0; i < seconds * 60; i++) stepRig(s, P, 1 / 60, speed, airborne)
  return s
}

describe('the walk of the animals', () => {
  it('stands still when the cart stands: legs straight, no bobbing', () => {
    const s = run(0, 2)
    const pose = rigPose(s, P)
    for (const l of pose.legs) {
      expect(Math.abs(l.hip)).toBeLessThan(0.02)
      expect(l.knee).toBeLessThan(0.02)
    }
    expect(Math.abs(pose.bodyY)).toBeLessThan(0.005)
  })

  it('moves the legs in diagonal pairs', () => {
    expect(LEG_OFFSET[0]).toBe(LEG_OFFSET[3])
    expect(LEG_OFFSET[1]).toBe(LEG_OFFSET[2])
    expect(Math.abs(LEG_OFFSET[0]! - LEG_OFFSET[1]!)).toBeCloseTo(Math.PI, 5)
    const s = run(6, 1.3)
    const pose = rigPose(s, P)
    expect(pose.legs[0]!.hip).toBeCloseTo(pose.legs[3]!.hip, 5)
    expect(pose.legs[1]!.hip).toBeCloseTo(pose.legs[2]!.hip, 5)
    expect(pose.legs[0]!.hip).toBeCloseTo(-pose.legs[1]!.hip, 5)
  })

  it('goes faster with speed, and the feet do not slide on the ground', () => {
    const rate = (sp: number) => {
      const s = run(sp, 1.5)
      const before = s.phase
      stepRig(s, P, 0.1, sp, false)
      return (s.phase - before) / 0.1
    }
    expect(rate(8)).toBeGreaterThan(rate(3))
    expect(rate(3)).toBeGreaterThan(rate(1.5))
    // the foot moves back relative to the body at the speed of the cart: amp * legLen * omega
    for (const sp of [3, 5, 7]) {
      const s = run(sp, 1.5)
      expect(s.amp * P.legLen * rate(sp)).toBeGreaterThan(sp * 0.85)
      expect(s.amp * P.legLen * rate(sp)).toBeLessThan(sp * 1.15)
    }
  })

  it('never turns the legs faster than they can go', () => {
    const s = run(40, 1)
    const before = s.phase
    stepRig(s, P, 0.1, 40, false)
    expect((s.phase - before) / 0.1).toBeLessThanOrEqual(P.maxOmega + 0.01)
  })

  it('bends the knee while the leg swings forward, never backwards', () => {
    const s = newRigState()
    const pose = newPose()
    let max = 0
    for (let i = 0; i < 240; i++) {
      stepRig(s, P, 1 / 60, 7, false)
      rigPose(s, P, pose)
      for (const l of pose.legs) {
        expect(l.knee).toBeGreaterThanOrEqual(0)
        max = Math.max(max, l.knee)
      }
    }
    expect(max).toBeGreaterThan(0.4)
  })

  it('stretches the legs out in the air (fore forward, hind back), and comes back smoothly', () => {
    const s = run(8, 1)
    for (let i = 0; i < 30; i++) stepRig(s, P, 1 / 60, 8, true)
    const air = rigPose(s, P)
    expect(air.legs[0]!.hip).toBeGreaterThan(0.3)
    expect(air.legs[2]!.hip).toBeLessThan(-0.3)
    // one step later the pose changes only a little (no jerk)
    const before = air.legs[0]!.hip
    stepRig(s, P, 1 / 60, 8, true)
    expect(Math.abs(rigPose(s, P).legs[0]!.hip - before)).toBeLessThan(0.08)
    for (let i = 0; i < 90; i++) stepRig(s, P, 1 / 60, 8, false)
    expect(s.air).toBeLessThan(0.05)
  })

  it('has no jerks: the angles change smoothly from one picture to the next', () => {
    const s = newRigState()
    const pose = newPose()
    let prev: number[] | null = null
    for (let i = 0; i < 600; i++) {
      // from standing to running and back, with a hop in the air
      const sp = i < 200 ? i / 20 : i < 400 ? 10 : 0
      stepRig(s, P, 1 / 60, sp, i > 300 && i < 330)
      rigPose(s, P, pose)
      const now = [...pose.legs.map((l) => l.hip), ...pose.legs.map((l) => l.knee), pose.bodyY, pose.bodyPitch, pose.tail]
      if (prev) for (let k = 0; k < now.length; k++) expect(Math.abs(now[k]! - prev[k]!)).toBeLessThan(0.25)
      prev = now
    }
  })

  it('every animal has its own gait', () => {
    expect(RIG_PARAMS.horse.maxOmega).toBeGreaterThan(RIG_PARAMS.ox.maxOmega)
    expect(RIG_PARAMS.camel.legLen).toBeGreaterThan(RIG_PARAMS.donkey.legLen)
  })
})

describe('the layers of the background', () => {
  it('cover the whole screen, also high in a jump and deep in a valley', () => {
    for (const look of LOOKS) {
      for (const hPx of [320, 375, 600, 900]) {
        for (let camY = -40; camY <= 140; camY += 5) {
          const b = backgroundBands(look, hPx, camY, hPx / 7.4)
          // the sky picture covers from the top of the screen to the bottom
          expect(b.skyTop).toBeLessThanOrEqual(0)
          expect(b.skyTop + b.skyH).toBeGreaterThanOrEqual(hPx - 0.001)
          // below the mid hills everything down to the bottom is filled (no bar)
          expect(b.fillTo).toBe(hPx)
          expect(b.fillFrom).toBeLessThanOrEqual(hPx)
          expect(b.fillFrom).toBeLessThanOrEqual(b.midBottom)
        }
      }
    }
  })
})
