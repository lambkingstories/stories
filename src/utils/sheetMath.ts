/** Where a touch on the screen lands on a sheet of paper that may be turned. */

export interface ScreenBox {
  left: number
  top: number
  width: number
  height: number
}

/**
 * The point of the picture (in its own pixels) under a point of the screen. `box` is the box the browser reports around
 * the sheet: when the sheet is turned, that box is larger than the sheet, so the middle and the size per picture pixel
 * are taken from it, and the touch is turned back by the angle of the sheet.
 */
export function screenToSheet(clientX: number, clientY: number, box: ScreenBox, rotationDeg: number, sheetW: number, sheetH: number): { x: number; y: number } {
  if (rotationDeg === 0) return { x: ((clientX - box.left) * sheetW) / box.width, y: ((clientY - box.top) * sheetH) / box.height }
  const a = (rotationDeg * Math.PI) / 180
  const cosA = Math.cos(a)
  const sinA = Math.sin(a)
  const k = box.width / (sheetW * Math.abs(cosA) + sheetH * Math.abs(sinA))
  const dx = clientX - (box.left + box.width / 2)
  const dy = clientY - (box.top + box.height / 2)
  return { x: sheetW / 2 + (dx * cosA + dy * sinA) / k, y: sheetH / 2 + (-dx * sinA + dy * cosA) / k }
}
