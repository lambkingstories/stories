import { describe, expect, it } from 'vitest'
import { clock, fadedVolume, FADE_MS, SLEEP_TIMER_MINUTES } from '../src/utils/sleepTimer'

describe('sleep timer', () => {
  it('keeps the chosen volume until the last seconds', () => {
    expect(fadedVolume(0.8, 10 * 60_000)).toBe(0.8)
    expect(fadedVolume(0.8, FADE_MS)).toBe(0.8)
  })

  it('goes down in a straight line and reaches silence', () => {
    expect(fadedVolume(1, FADE_MS / 2)).toBeCloseTo(0.5)
    expect(fadedVolume(1, 1)).toBeLessThan(0.001)
    expect(fadedVolume(1, 0)).toBe(0)
    expect(fadedVolume(1, -500)).toBe(0)
  })

  it('never goes outside 0..1', () => {
    expect(fadedVolume(5, 60_000)).toBe(1)
    expect(fadedVolume(-1, 60_000)).toBe(0)
  })

  it('writes the countdown as minutes and seconds', () => {
    expect(clock(18 * 60_000 + 5_000)).toBe('18:05')
    expect(clock(59_100)).toBe('1:00')
    expect(clock(-3)).toBe('0:00')
  })

  it('offers three timers and "until the end"', () => {
    expect(SLEEP_TIMER_MINUTES).toEqual([10, 20, 30, 0])
  })
})
