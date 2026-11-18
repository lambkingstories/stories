/**
 * The small picture that is kept with every painting ("thumb"): it is what the main menu, the exhibition and the quiet picture view show.
 * It used to be 280 pixels wide, which looked blurred where a picture is shown big (the card "Keep painting", the exhibition, the view).
 * Now the long side is `THUMB_LONG` pixels (a sharp picture, still about 100 KB as JPEG). Pictures saved earlier keep their small thumb until they are
 * painted on again; `isSharpThumb` tells the two apart so that a view can ask for a new one only when it is worth it.
 */

/** The long side of a new thumb, in pixels. */
export const THUMB_LONG = 800
/** The old thumbs were 280 pixels wide; anything not wider than this counts as small. */
export const OLD_THUMB_WIDTH = 300

/** The size of a thumb for a sheet of the given size: the long side is `long`, the ratio is the one of the sheet, nothing is below 1 pixel. */
export function thumbSize(sheetW: number, sheetH: number, long = THUMB_LONG): { w: number; h: number } {
  const w0 = Math.max(1, sheetW)
  const h0 = Math.max(1, sheetH)
  const r = long / Math.max(w0, h0)
  return { w: Math.max(1, Math.round(w0 * r)), h: Math.max(1, Math.round(h0 * r)) }
}

/** How a picture is framed: the ratio of the stored picture, or the usual 3:4 when nothing is known. Always between 1:3 and 3:1. */
export function frameRatio(meta: { width?: number; height?: number } | null | undefined): number {
  const w = meta?.width ?? 0
  const h = meta?.height ?? 0
  if (!(w > 0) || !(h > 0)) return 3 / 4
  return Math.min(3, Math.max(1 / 3, w / h))
}
