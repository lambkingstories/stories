import { describe, expect, it } from 'vitest'
import {
  ARMS_UP,
  HELPER_PUSH,
  TILT_LIMIT,
  armsAreUp,
  armsPose,
  armsStep,
  armsUpTime,
  berriesLeft,
  caseStep,
  casesDone,
  grapesStep,
  helperLift,
  helperTap,
  signalAnswer,
  signalBlasts,
  signalGap,
  tiltAfterFall,
  tiltedTooFar,
  wayShare,
  wobbleAt
} from '@/utils/wuesteGames'

describe('Hold the arms', () => {
  it('rises while the finger holds and sinks otherwise, between 0 and 1', () => {
    expect(armsStep(0.3, 0.5, true, 0.2)).toBeCloseTo(0.75)
    expect(armsStep(0.3, 0.5, false, 0.2)).toBeCloseTo(0.2)
    expect(armsStep(0.95, 1, true, 0.2)).toBe(1)
    expect(armsStep(0.05, 1, false, 0.2)).toBe(0)
  })

  it('shows the picture of the level and counts the time only while the arms are up', () => {
    expect(armsPose(0)).toBe(0)
    expect(armsPose(0.4)).toBe(1)
    expect(armsPose(ARMS_UP)).toBe(2)
    expect(armsAreUp(ARMS_UP - 0.01)).toBe(false)
    expect(armsUpTime(2, 0.05, 0.9)).toBeCloseTo(2.05)
    expect(armsUpTime(2, 0.05, 0.3)).toBe(2)
  })

  it('lets the helpers lift one after the other; the same man twice in a row is too tired', () => {
    expect(helperTap(null, 'aaron')).toBe('ok')
    expect(helperTap('aaron', 'hur')).toBe('ok')
    expect(helperTap('hur', 'hur')).toBe('again')
    expect(helperLift(0.5)).toBeCloseTo(0.5 + HELPER_PUSH)
    expect(helperLift(0.95)).toBe(1)
  })

  it('can be won in the second round: alternate taps keep the arms up for the whole time (sink 0.28 per second)', () => {
    // two taps per second, alternating: +0.44 per second against -0.28 per second
    let level = 0.3
    let up = 0
    for (let tick = 0; tick < 20 * 12; tick++) {
      const dt = 0.05
      level = armsStep(level, dt, false, 0.28)
      if (tick % 10 === 0) level = helperLift(level)
      up = armsUpTime(up, dt, level)
    }
    expect(up).toBeGreaterThan(10)
  })
})

describe('Share the cases', () => {
  it('sends a small case to any of the men and a great one to Moses', () => {
    expect(caseStep('small', false)).toBe('ok')
    expect(caseStep('small', true)).toBe('tooLight')
    expect(caseStep('great', true)).toBe('ok')
    expect(caseStep('great', false)).toBe('tooHeavy')
  })

  it('is done when every case is decided', () => {
    expect(casesDone(3, 4)).toBe(false)
    expect(casesDone(4, 4)).toBe(true)
    expect(casesDone(0, 0)).toBe(false)
  })
})

describe('The silver trumpets', () => {
  it('lets both priests blow one note for "all", one priest for "leaders", and short blasts for "break"', () => {
    expect(signalBlasts('all', 2)).toEqual([{ at: 0, dur: 2, priests: [0, 1] }])
    expect(signalBlasts('leaders', 1.5)).toEqual([{ at: 0, dur: 1.5, priests: [0] }])
    const breakUp = signalBlasts('break', 2)
    expect(breakUp).toHaveLength(4)
    expect(breakUp.every((b) => b.priests.length === 2 && b.at + b.dur <= 2)).toBe(true)
    expect(breakUp[1]!.at).toBeCloseTo(0.5)
  })

  it('checks an answer against the row of signals', () => {
    expect(signalAnswer(['leaders'], ['leaders'])).toBe('ok')
    expect(signalAnswer(['leaders'], ['all'])).toBe('wrong')
    expect(signalAnswer(['leaders', 'break', 'all'], ['leaders'])).toBe('more')
    expect(signalAnswer(['leaders', 'break', 'all'], ['leaders', 'all'])).toBe('wrong')
    expect(signalAnswer(['leaders', 'break', 'all'], ['leaders', 'break', 'all'])).toBe('ok')
  })

  it('waits a breath after each signal', () => {
    expect(signalGap(2)).toBeCloseTo(2.9)
  })
})

describe('Carry the grapes', () => {
  it('is deterministic and gentle: round 1 pushes at most about 1 per second, never nothing', () => {
    expect(wobbleAt(3, 0.5, false)).toBe(wobbleAt(3, 0.5, false))
    let max = 0
    for (let t = 0; t < 60; t += 0.05) max = Math.max(max, Math.abs(wobbleAt(t, 0.5, false)))
    expect(max).toBeGreaterThan(0.2)
    expect(max).toBeLessThan(1.0)
    expect(wobbleAt(5, 0, false)).toBe(0)
  })

  it('tips without help and stays level with a hand on the pole', () => {
    // no help: the pole leaves the limit within the round
    let tilt = 0
    let tippedFar = false
    for (let t = 0; t < 30; t += 0.05) {
      tilt = grapesStep(tilt, t, 0.05, 0, 0.9, true)
      if (tiltedTooFar(tilt)) tippedFar = true
    }
    expect(tippedFar).toBe(true)
    // with a child who always lifts the end that is low, it never goes far
    tilt = 0
    let worst = 0
    for (let t = 0; t < 30; t += 0.05) {
      const input = tilt > 0.1 ? 1 : tilt < -0.1 ? -1 : 0
      tilt = grapesStep(tilt, t, 0.05, input, 0.9, true)
      worst = Math.max(worst, Math.abs(tilt))
    }
    expect(worst).toBeLessThan(TILT_LIMIT)
  })

  it('keeps the tilt within -1.2 and 1.2, springs back after a fall, keeps one berry and walks to the end', () => {
    expect(grapesStep(1.19, 0, 10, 0, 1, true)).toBeLessThanOrEqual(1.2)
    expect(grapesStep(-1.19, 0, 10, 0, 1, true)).toBeGreaterThanOrEqual(-1.2)
    expect(tiltAfterFall(1)).toBeCloseTo(0.4)
    expect(berriesLeft(6, 2)).toBe(4)
    expect(berriesLeft(6, 9)).toBe(1)
    expect(wayShare(5, 20)).toBeCloseTo(0.25)
    expect(wayShare(30, 20)).toBe(1)
    expect(wayShare(1, 0)).toBe(1)
  })
})
