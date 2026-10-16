/**
 * The paint bucket. It works on plain pixel arrays (so it can be tested): it looks at the picture as it shows (paint under
 * line art) so painted areas can be repainted, fills the field that was touched up to the outlines, and grows the fill one
 * pixel under the line art, so no pale halo is left along the outlines.
 */
import type { RegionMap } from '@/utils/coloringRegions'

export interface FillOptions {
  /** The picture as it shows, RGBA: white paper, the paint, the line art. */
  merged: Uint8ClampedArray
  /** The paint layer, RGBA; the fill is written into it. */
  paint: Uint8ClampedArray
  w: number
  h: number
  /** Where the touch was. */
  x: number
  y: number
  /** The colour of the fill, 0–255. */
  r: number
  g: number
  b: number
  a: number
  /** The fields of the line art; small gaps in an outline are closed with it. */
  map?: RegionMap | null
  /** How much the colour of a pixel may differ from the touched one to belong to the field. */
  tolerance?: number
}

/** Returns true when something was painted. */
export function floodFillPaint(o: FillOptions): boolean {
  const { merged: mData, paint: dData, w: cw, h: ch, r: fR, g: fG, b: fB, a: fA } = o
  let { x: sx, y: sy } = o
  if (sx < 0 || sy < 0 || sx >= cw || sy >= ch) return false
  // Small gaps in an outline are closed: the pixels next to the line art do not belong to a field.
  const map = o.map ?? null
  const bar = map?.barrier
  const ms = map?.scale ?? 1
  const mw = map?.w ?? 0
  const blockedAt = (pi: number): boolean => {
    if (!bar) return false
    if (ms === 1) return bar[pi] === 1
    const x = pi % cw
    return bar[(((pi - x) / cw / ms) | 0) * mw + ((x / ms) | 0)] === 1
  }
  if (blockedAt(sy * cw + sx)) {
    // the touch landed on an outline: the nearest free pixel is used
    let found = false
    for (let r = 1; r <= 10 * ms && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const xx = sx + dx
          const yy = sy + dy
          if (xx >= 0 && yy >= 0 && xx < cw && yy < ch && !blockedAt(yy * cw + xx)) {
            sx = xx
            sy = yy
            found = true
            break
          }
        }
      }
    }
    if (!found) return false
  }
  const ti = (sy * cw + sx) * 4
  const tR = mData[ti]!
  const tG = mData[ti + 1]!
  const tB = mData[ti + 2]!
  // the field already has this colour
  if (Math.abs(tR - fR) < 3 && Math.abs(tG - fG) < 3 && Math.abs(tB - fB) < 3) return false
  const tol = o.tolerance ?? 35
  const ok = (i: number) =>
    !blockedAt(i >> 2) && Math.abs(mData[i]! - tR) <= tol && Math.abs(mData[i + 1]! - tG) <= tol && Math.abs(mData[i + 2]! - tB) <= tol
  const put = (pi: number) => {
    const mi = pi * 4
    dData[mi] = fR
    dData[mi + 1] = fG
    dData[mi + 2] = fB
    dData[mi + 3] = fA
  }
  const vis = new Uint8Array(cw * ch)
  let minX = cw
  let maxX = 0
  let minY = ch
  let maxY = 0
  const stk: [number, number][] = [[sx, sy]]
  while (stk.length > 0) {
    const top = stk.pop()!
    let x = top[0]
    const y = top[1]
    if (y < 0 || y >= ch) continue
    while (x > 0 && ok((y * cw + x - 1) * 4) && !vis[y * cw + x - 1]) x--
    let sa = false
    let sb = false
    while (x < cw) {
      const mi = (y * cw + x) * 4
      const pi = y * cw + x
      if (!ok(mi) || vis[pi]) break
      vis[pi] = 1
      put(pi)
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (y > 0) {
        const ai = (y - 1) * cw + x
        if (ok(ai * 4) && !vis[ai]) {
          if (!sa) {
            stk.push([x, y - 1])
            sa = true
          }
        } else sa = false
      }
      if (y < ch - 1) {
        const bi = (y + 1) * cw + x
        if (ok(bi * 4) && !vis[bi]) {
          if (!sb) {
            stk.push([x, y + 1])
            sb = true
          }
        } else sb = false
      }
      x++
    }
  }
  // One pixel further, under the anti-aliased edge of the outline.
  for (let y = Math.max(0, minY - 1); y <= Math.min(ch - 1, maxY + 1); y++) {
    for (let x = Math.max(0, minX - 1); x <= Math.min(cw - 1, maxX + 1); x++) {
      const pi = y * cw + x
      if (vis[pi]) continue
      let near = false
      for (let dy = -1; dy <= 1 && !near; dy++) {
        const yy = y + dy
        if (yy < 0 || yy >= ch) continue
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx
          if (xx >= 0 && xx < cw && vis[yy * cw + xx]) {
            near = true
            break
          }
        }
      }
      if (near) put(pi)
    }
  }
  // The gap that was closed is given back along the outline: the paint goes on under the line art, a few more pixels.
  const grow = map ? map.gap * ms : 0
  for (let pass = 0; pass < grow; pass++) {
    const add: number[] = []
    for (let y = Math.max(0, minY - 2 - pass); y <= Math.min(ch - 1, maxY + 2 + pass); y++) {
      for (let x = Math.max(0, minX - 2 - pass); x <= Math.min(cw - 1, maxX + 2 + pass); x++) {
        const pi = y * cw + x
        if (vis[pi] || !blockedAt(pi)) continue
        if ((x > 0 && vis[pi - 1]) || (x < cw - 1 && vis[pi + 1]) || (y > 0 && vis[pi - cw]) || (y < ch - 1 && vis[pi + cw])) add.push(pi)
      }
    }
    for (const pi of add) {
      vis[pi] = 1
      put(pi)
    }
  }
  return true
}
