import { describe, expect, it } from 'vitest'
import {
  FLAT_MAX_HEIGHT,
  FLAT_TOP_INSET,
  FOLDED_TAB,
  PAGE_INSET,
  TOP_BAR_ROOM,
  fitPaper,
  isFlatLandscape,
  paperInsets,
  topBarReach,
  type InsetInput
} from '@/utils/coloringLayout'

const plain = { doneButton: false, pages: false, zoom: false, text: false }
const base = (w: number, h: number, extra: Partial<InsetInput> = {}): InsetInput => ({
  width: w,
  height: h,
  ratio: 3 / 4,
  fullscreen: false,
  hasImage: true,
  band: 0,
  reach: topBarReach(plain),
  ...extra
})

describe('the paper of the painting screen', () => {
  it('knows a phone held wide', () => {
    expect(isFlatLandscape(812, 375)).toBe(true)
    expect(isFlatLandscape(667, 375)).toBe(true)
    expect(isFlatLandscape(844, 390)).toBe(true)
    expect(isFlatLandscape(900, FLAT_MAX_HEIGHT + 1)).toBe(false)
    expect(isFlatLandscape(900, FLAT_MAX_HEIGHT)).toBe(true)
    expect(isFlatLandscape(375, 812)).toBe(false)
    expect(isFlatLandscape(1180, 820)).toBe(false)
    expect(isFlatLandscape(820, 1180)).toBe(false)
  })

  it('keeps the old room on a phone held upright and on tablets', () => {
    for (const [w, h] of [
      [375, 812],
      [820, 1180],
      [1180, 820]
    ]) {
      const room = paperInsets(base(w, h))
      expect(room.top).toBe(TOP_BAR_ROOM)
      expect(room.bottom).toBe(FOLDED_TAB)
      expect(room.maxWidth).toBe(w - PAGE_INSET * 2)
    }
    // the same paper as before: 3:4 on 375 × 812
    const { w, h } = fitPaper(base(375, 812))
    expect(w).toBe(355)
    expect(h).toBe(473)
  })

  it('lets the paper rise to the top edge on a phone held wide', () => {
    const { w, h, insets } = fitPaper(base(812, 375))
    expect(insets.top).toBe(FLAT_TOP_INSET)
    expect(h).toBe(375 - FLAT_TOP_INSET - FOLDED_TAB)
    expect(w).toBe(Math.round(h * 0.75))
    // before: 212 × 283
    expect(w).toBeGreaterThan(212)
    expect(h).toBeGreaterThan(283)
  })

  it('is bigger than before on every phone held wide, and never reaches into the buttons', () => {
    for (const [W, H] of [
      [812, 375],
      [667, 375],
      [844, 390],
      [932, 430],
      [736, 414],
      [568, 320]
    ]) {
      const old = Math.round((H - TOP_BAR_ROOM - FOLDED_TAB) * 0.75)
      const { w, insets } = fitPaper(base(W, H))
      expect(w).toBeGreaterThanOrEqual(old)
      // the paper stays between the two groups of buttons when it rises to the top
      if (insets.top < TOP_BAR_ROOM) expect(w).toBeLessThanOrEqual(W - 2 * topBarReach(plain))
    }
  })

  it('goes back below the bar when the buttons leave no room beside the paper', () => {
    // a coloring book with arrows and the zoom buttons: the right group is wide
    const wide = topBarReach({ doneButton: false, pages: true, zoom: true, text: true })
    const { insets } = fitPaper(base(667, 375, { reach: wide }))
    expect(insets.top).toBe(TOP_BAR_ROOM)
  })

  it('narrows the paper between the buttons instead of dropping it below the bar when that is bigger', () => {
    const { w, insets } = fitPaper(base(667, 375))
    expect(insets.top).toBe(FLAT_TOP_INSET)
    expect(w).toBeLessThanOrEqual(667 - 2 * topBarReach(plain))
    expect(w).toBeGreaterThan(212)
  })

  it('adds the band of the family activity on top', () => {
    const a = paperInsets(base(812, 375))
    const b = paperInsets(base(812, 375, { band: 58 }))
    expect(b.top - a.top).toBe(58)
  })

  it('uses the whole screen in fullscreen', () => {
    const room = paperInsets(base(812, 375, { fullscreen: true }))
    expect(room).toEqual({ top: PAGE_INSET, bottom: PAGE_INSET, maxWidth: 812 - PAGE_INSET * 2 })
  })

  it('has no colour box tab to keep room for without a picture', () => {
    expect(paperInsets(base(375, 812, { hasImage: false })).bottom).toBe(PAGE_INSET)
  })

  it('fits a sheet that lies wide too', () => {
    const { w, h } = fitPaper(base(812, 375, { ratio: 4 / 3 }))
    expect(w / h).toBeCloseTo(4 / 3, 1)
    expect(h).toBeLessThanOrEqual(375 - FLAT_TOP_INSET - FOLDED_TAB)
  })

  it('counts the width of the top bar buttons', () => {
    expect(topBarReach(plain)).toBe(208)
    expect(topBarReach({ ...plain, pages: true })).toBeGreaterThan(topBarReach(plain))
    expect(topBarReach({ ...plain, zoom: true })).toBeGreaterThan(topBarReach(plain))
    expect(topBarReach({ ...plain, doneButton: true })).toBeGreaterThanOrEqual(topBarReach(plain))
  })
})
