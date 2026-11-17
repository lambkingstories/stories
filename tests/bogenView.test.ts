/** "Jonatans Pfeile": from the finger to the bow (the canvas is measured at every touch; the pull gives angle and power). */
import { describe, expect, it } from 'vitest'
import { ANG_MAX, ANG_MIN, F_MIN } from '../src/utils/bogenGame'
import { MIN_PULL_PX, clientToLocal, maxPullOf, pullToAim } from '../src/utils/bogenView'

describe('touch to canvas', () => {
  it('turns a touch on the page into a point of the canvas', () => {
    expect(clientToLocal({ left: 10, top: 20, width: 800, height: 400 }, 800, 400, 110, 220)).toEqual([100, 200])
  })
  it('scales by the real size when the page was resized without a message (the finger hits what it touches)', () => {
    // the game thinks 800 x 400, the canvas is now only 400 x 200 on the page
    expect(clientToLocal({ left: 0, top: 100, width: 400, height: 200 }, 800, 400, 200, 200)).toEqual([400, 200])
    // a canvas that moved
    expect(clientToLocal({ left: 30, top: -40, width: 800, height: 400 }, 800, 400, 130, 60)).toEqual([100, 100])
  })
  it('does not divide by zero', () => {
    expect(clientToLocal({ left: 0, top: 0, width: 0, height: 0 }, 800, 400, 5, 6)).toEqual([5, 6])
  })
})

describe('pull to aim', () => {
  const max = 120
  it('the arrow flies the other way: pull down and left, aim up and right', () => {
    const a = pullToAim(-60, 60, max)
    expect(a.angle).toBeCloseTo(45)
    expect(a.f).toBeCloseTo(0.707, 2)
    expect(a.ok).toBe(true)
  })
  it('a flat pull is a flat shot; the power grows with the pull and is at most one', () => {
    expect(pullToAim(-60, 0, max).angle).toBeCloseTo(0)
    expect(pullToAim(-60, 0, max).f).toBeCloseTo(0.5)
    expect(pullToAim(-400, 0, max).f).toBe(1)
  })
  it('a short pull is put back (no shot), a small one still has the smallest power', () => {
    expect(pullToAim(-(MIN_PULL_PX - 2), 0, max).ok).toBe(false)
    expect(pullToAim(-MIN_PULL_PX, 0, max).ok).toBe(true)
    expect(pullToAim(-MIN_PULL_PX, 0, max).f).toBeCloseTo(MIN_PULL_PX / max)
    expect(pullToAim(-3, 0, max).f).toBe(F_MIN)
  })
  it('an aim backwards is held at the steepest or the flattest angle', () => {
    expect(pullToAim(50, 50, max).angle).toBe(ANG_MAX)
    expect(pullToAim(50, -50, max).angle).toBe(ANG_MIN)
    expect(pullToAim(-1, 200, max).angle).toBeLessThanOrEqual(ANG_MAX)
  })
  it('the full pull depends on the size of the screen, within limits', () => {
    expect(maxPullOf(812, 375)).toBeGreaterThanOrEqual(90)
    expect(maxPullOf(2000, 1500)).toBe(150)
    expect(maxPullOf(300, 200)).toBe(90)
  })
})
