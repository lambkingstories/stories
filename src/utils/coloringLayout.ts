/**
 * Where the paper of the painting screen sits, as plain numbers (no DOM), so that the rule can be tested.
 *
 * The paper fills the screen; the top bar floats over its upper edge and the colour box over its lower edge. On a phone held wide
 * (the screen is hardly 375 px high) the top bar would take 62 px of the little height for nothing: its buttons sit in the two
 * corners and the paper in the middle is narrow, so there the paper may rise up to the top edge as long as the buttons do not
 * reach into the paper's column.
 */

/** Breathing room around the paper at the sides (and at the top/bottom where nothing floats). */
export const PAGE_INSET = 10
/** The top bar of the painting screen floats over the top edge; below it the paper starts. */
export const TOP_BAR_ROOM = 62
/** Room for the little arrow tab that stays at the bottom edge while the colour box is hidden. */
export const FOLDED_TAB = 30
/** A screen of this height or less (held wide) is a "flat" one: the phone in landscape. */
export const FLAT_MAX_HEIGHT = 450
/** The paper's distance from the top edge on a flat screen when the buttons stay in the corners. */
export const FLAT_TOP_INSET = 8

/** A phone held wide: wider than high and hardly more than 450 px high. */
export function isFlatLandscape(width: number, height: number): boolean {
  return width > height && height <= FLAT_MAX_HEIGHT
}

export interface TopBarContent {
  /** A button that hands the picture in ("Fertig") sits next to the back button. */
  doneButton: boolean
  /** The arrows of a coloring book (previous, next page). */
  pages: boolean
  /** The percentage and zoom buttons. */
  zoom: boolean
  /** The button with the text of the page. */
  text: boolean
}

/**
 * How far the buttons of the top bar reach from the screen edge into the screen (the wider one of the left and right group),
 * in pixels. The widths are those of the buttons at 44 px.
 */
export function topBarReach(c: TopBarContent): number {
  const BTN = 44
  const GAP = 6
  const EDGE = 12
  const left = EDGE + BTN + (c.doneButton ? GAP + 170 : 0)
  // eraser, undo, redo (6 px apart), then the menu (8 px further)
  let right = EDGE + BTN * 4 + GAP * 2 + 8
  if (c.pages) right += GAP + 104
  if (c.zoom) right += GAP + 150
  if (c.text) right += GAP + BTN
  return Math.max(left, right)
}

export interface InsetInput {
  /** Size of the picture area (the whole screen). */
  width: number
  height: number
  /** Width / height of the sheet. */
  ratio: number
  fullscreen: boolean
  hasImage: boolean
  /** Height of the band of the family activity over the top (0 without). */
  band: number
  /** See `topBarReach`. */
  reach: number
}

export interface Insets {
  top: number
  bottom: number
  /** The paper may not be wider than this (on a flat screen between the two groups of buttons). */
  maxWidth: number
}

/** Gap kept between the buttons of the top bar and the paper. */
const BAR_GAP = 8

/** Room that stays free over and under the paper. */
export function paperInsets(i: InsetInput): Insets {
  const sideRoom = i.width - PAGE_INSET * 2
  if (i.fullscreen) return { top: PAGE_INSET, bottom: PAGE_INSET, maxWidth: sideRoom }
  const bottom = i.hasImage ? FOLDED_TAB : PAGE_INSET
  const lower = { top: TOP_BAR_ROOM + i.band, bottom, maxWidth: sideRoom }
  if (!isFlatLandscape(i.width, i.height)) return lower
  // Paper right up to the top edge, but only between the two groups of buttons: is it then bigger than below the bar?
  const between = i.width - 2 * (i.reach + BAR_GAP)
  const raised = { top: FLAT_TOP_INSET + i.band, bottom, maxWidth: Math.max(1, between) }
  const widthOf = (r: Insets) => Math.min(r.maxWidth, (i.height - r.top - r.bottom) * i.ratio)
  return widthOf(raised) >= widthOf(lower) ? raised : lower
}

/** The biggest sheet of the given ratio that fits in the free area (whole pixels, at least 1). */
export function fitPaper(i: InsetInput): { w: number; h: number; insets: Insets } {
  const insets = paperInsets(i)
  const aw = Math.min(i.width - PAGE_INSET * 2, insets.maxWidth)
  const ah = i.height - insets.top - insets.bottom
  let w = aw
  let h = aw / i.ratio
  if (h > ah) {
    h = ah
    w = ah * i.ratio
  }
  return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)), insets }
}
