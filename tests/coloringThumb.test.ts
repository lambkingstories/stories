import { describe, expect, it } from 'vitest'
import { OLD_THUMB_WIDTH, THUMB_LONG, frameRatio, thumbSize } from '@/utils/coloringThumb'

describe('the thumb of a painting', () => {
  it('is sharp: its long side is 800 px, much more than the 280 px of the old thumbs', () => {
    expect(THUMB_LONG).toBeGreaterThanOrEqual(800)
    expect(thumbSize(1200, 1600)).toEqual({ w: 600, h: 800 })
    expect(thumbSize(1600, 1200)).toEqual({ w: 800, h: 600 })
    expect(thumbSize(1200, 1600).w).toBeGreaterThanOrEqual(OLD_THUMB_WIDTH * 2)
  })

  it('keeps the ratio of the sheet and never goes below one pixel', () => {
    const s = thumbSize(1800, 1260)
    expect(s.w / s.h).toBeCloseTo(1800 / 1260, 2)
    expect(thumbSize(0, 0)).toEqual({ w: 800, h: 800 })
    expect(thumbSize(1, 5000).w).toBe(1)
  })

  it('frames a painting in its own ratio (between 1:3 and 3:1), 3:4 when nothing is known; old small thumbs keep their ratio', () => {
    expect(frameRatio({ width: 1600, height: 1200 })).toBeCloseTo(4 / 3, 5)
    expect(frameRatio({ width: 1200, height: 1600 })).toBeCloseTo(3 / 4, 5)
    expect(frameRatio({ width: 280, height: 366 })).toBeCloseTo(280 / 366, 5)
    expect(frameRatio(null)).toBeCloseTo(3 / 4, 5)
    expect(frameRatio({ width: 0, height: 0 })).toBeCloseTo(3 / 4, 5)
    expect(frameRatio({ width: 5000, height: 100 })).toBe(3)
    expect(frameRatio({ width: 100, height: 5000 })).toBeCloseTo(1 / 3, 5)
  })
})
