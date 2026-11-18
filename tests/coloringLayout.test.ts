import { describe, expect, it } from 'vitest'
import {
  COLOR_BOX_SIDE_TOP,
  FLAT_MAX_HEIGHT,
  FLAT_TOP_INSET,
  FOLDED_TAB,
  PAGE_INSET,
  TOP_BAR_ROOM,
  TOP_BTN,
  colorBoxPlacement,
  fitPaper,
  isFlatLandscape,
  paperInsets,
  toolbarStartsOpen,
  topBarReach,
  topBarRows,
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

describe('where the colour box stands', () => {
  it('is the box at the bottom edge on a phone held upright and on tablets', () => {
    for (const [w, h] of [
      [375, 812],
      [820, 1180],
      [1180, 820],
      [1024, 768]
    ]) {
      expect(colorBoxPlacement(w, h, 'left')).toBe('bottom')
      expect(colorBoxPlacement(w, h, 'right')).toBe('bottom')
    }
  })

  it('is a strip at the side away from the tool bar on a phone held wide', () => {
    for (const [w, h] of [
      [812, 375],
      [667, 375],
      [844, 390],
      [932, 430],
      [568, 320]
    ]) {
      expect(colorBoxPlacement(w, h, 'left')).toBe('side-right')
      expect(colorBoxPlacement(w, h, 'right')).toBe('side-left')
    }
  })

  it('never covers the paper: the strip stays outside the column of the paper and below the buttons of the top bar', () => {
    // the strip is at most 108 px deep (the deepest kit); the paper is centred
    for (const [W, H] of [
      [812, 375],
      [667, 375],
      [844, 390],
      [736, 414],
      [568, 320]
    ]) {
      const { w } = fitPaper(base(W, H))
      expect((W - w) / 2).toBeGreaterThanOrEqual(108)
    }
    expect(COLOR_BOX_SIDE_TOP).toBeGreaterThanOrEqual(8 + 44)
  })
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
    // no tab of the colour box at the bottom edge: it stands at the side
    expect(insets.bottom).toBe(PAGE_INSET)
    expect(h).toBe(375 - FLAT_TOP_INSET - PAGE_INSET)
    expect(w).toBe(Math.round(h * 0.75))
    // before: 212 × 283, and with the tab 253 × 337
    expect(w).toBeGreaterThan(253)
    expect(h).toBeGreaterThan(337)
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
    // (with 48 px buttons a 667 px wide phone has no more room beside the paper; 700 px is the narrowest case where rising is still bigger)
    const { w, insets } = fitPaper(base(700, 375))
    expect(insets.top).toBe(FLAT_TOP_INSET)
    expect(w).toBeLessThanOrEqual(700 - 2 * topBarReach(plain))
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
    expect(h).toBeLessThanOrEqual(375 - FLAT_TOP_INSET - PAGE_INSET)
  })

  it('counts the width of the top bar buttons', () => {
    expect(topBarReach(plain)).toBe(228)
    expect(topBarReach({ ...plain, pages: true })).toBeGreaterThan(topBarReach(plain))
    expect(topBarReach({ ...plain, zoom: true })).toBeGreaterThan(topBarReach(plain))
    expect(topBarReach({ ...plain, doneButton: true })).toBeGreaterThanOrEqual(topBarReach(plain))
  })
})

describe('the top bar with 48 px buttons', () => {
  it('has buttons of 48 px (Anton: everything a finger hits)', () => {
    expect(TOP_BTN).toBe(48)
  })

  it('is one row on a phone for a free sheet (back, eraser, undo, redo, finished, menu), also at 360 px', () => {
    const free = { doneButton: false, finishButton: true, pages: false, zoom: false, text: false }
    for (const w of [360, 375, 390, 412]) expect(topBarRows(w, free)).toBe(1)
  })

  it('wraps into a second row with the arrows of a book on a phone upright, and not on wide screens', () => {
    const book = { doneButton: false, finishButton: true, pages: true, zoom: false, text: true }
    expect(topBarRows(390, book)).toBe(2)
    expect(topBarRows(768, book)).toBe(1)
    expect(topBarRows(844, book)).toBe(1)
  })

  it('makes room for the second row over the paper: the paper starts lower, and keeps its size where the width limits it', () => {
    const one = paperInsets(base(390, 844))
    const two = paperInsets(base(390, 844, { rows: 2 }))
    expect(two.top - one.top).toBe(TOP_BTN + 8)
    // a sheet 3:4 on a phone upright is limited by the width
    expect(fitPaper(base(390, 844, { rows: 2 })).w).toBe(fitPaper(base(390, 844)).w)
  })

  it('counts the finished button in how far the buttons reach', () => {
    expect(topBarReach({ ...plain, finishButton: true })).toBeGreaterThan(topBarReach(plain))
  })
})

describe('the tool bar at the start of a picture', () => {
  it('starts folded on a phone (up to 520 px wide), so that the paper fills the screen', () => {
    expect(toolbarStartsOpen(360)).toBe(false)
    expect(toolbarStartsOpen(390)).toBe(false)
    expect(toolbarStartsOpen(520)).toBe(false)
  })

  it('starts out on tablets and computers, as before', () => {
    expect(toolbarStartsOpen(521)).toBe(true)
    expect(toolbarStartsOpen(768)).toBe(true)
    expect(toolbarStartsOpen(1280)).toBe(true)
  })
})
