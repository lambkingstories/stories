/**
 * The magnifier of the digital book (`BookFlip`): how far the book may be enlarged and moved. Pure arithmetic, so that it can be tested.
 * `x` and `y` are how far the middle of the book is moved from the middle of the screen, in pixels.
 */
export interface Zoom {
  s: number
  x: number
  y: number
}

export const ZOOM_MAX = 4
/** What a double tap and the button with the magnifying glass go to. */
export const ZOOM_TAP = 2.5

/** The screen (`w`, `h`) and the size of the book on it before it is enlarged (`bw`, `bh`). */
export interface ZoomRoom {
  w: number
  h: number
  bw: number
  bh: number
}

const between = (v: number, limit: number) => Math.min(limit, Math.max(-limit, v)) || 0

/** Keeps the size between "whole page" and four times, and the book on the screen: it can only be moved as far as it sticks out. */
export function clampZoom(z: Zoom, room: ZoomRoom): Zoom {
  const s = Math.min(ZOOM_MAX, Math.max(1, Number.isFinite(z.s) ? z.s : 1))
  if (s <= 1.01) return { s: 1, x: 0, y: 0 }
  return {
    s,
    x: between(z.x, Math.max(0, (room.bw * s - room.w) / 2)),
    y: between(z.y, Math.max(0, (room.bh * s - room.h) / 2))
  }
}

/** A new size around a point (relative to the middle of the screen): what lies under the finger stays under the finger. */
export function zoomAround(z: Zoom, s: number, px: number, py: number, room: ZoomRoom): Zoom {
  const next = Math.min(ZOOM_MAX, Math.max(1, s))
  const k = next / z.s
  return clampZoom({ s: next, x: px - (px - z.x) * k, y: py - (py - z.y) * k }, room)
}
