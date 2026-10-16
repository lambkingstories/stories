/**
 * The fields of a line drawing: which pixels belong together, bounded by the
 * outlines. Used for two helps in the coloring app:
 *   - "stay inside the lines": a stroke only paints in the field where it started;
 *   - the paint bucket, which must not run through a small gap in an outline.
 *
 * Small gaps in the outline are closed first: every dark pixel is thickened by
 * `gap` pixels, and the fields are what is left between the thickened lines.
 * Paint then reaches a little further than a field (see `regionMaskAlpha`), so it
 * ends under the outline and no pale edge is left.
 */

export interface RegionMap {
  w: number
  h: number
  /** Map pixels per picture pixel; 1 for normal pictures, 2 for very large ones. */
  scale: number
  /** Gap that was closed, in map pixels. */
  gap: number
  /** 1 where an outline (thickened by `gap`) is. */
  barrier: Uint8Array
  /** 0 on outlines, otherwise the number of the field (from 1). */
  labels: Int32Array
}

/** How wide a gap in the outline may be (half of it, in pixels) for a picture of this width. */
export function gapFor(pictureWidth: number): number {
  return Math.max(1, Math.min(3, Math.round(pictureWidth / 600)))
}

/** Thickens the 1s of `src` by `r` pixels in x and y (a square). */
export function dilate(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return src
  const tmp = new Uint8Array(src.length)
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      if (!src[row + x]) continue
      const from = Math.max(0, x - r)
      const to = Math.min(w - 1, x + r)
      for (let k = from; k <= to; k++) tmp[row + k] = 1
    }
  }
  const out = new Uint8Array(src.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!tmp[y * w + x]) continue
      const from = Math.max(0, y - r)
      const to = Math.min(h - 1, y + r)
      for (let k = from; k <= to; k++) out[k * w + x] = 1
    }
  }
  return out
}

/**
 * Builds the map of fields from the line art (RGBA pixels, white paper). `dark` is the brightness below which a
 * pixel counts as outline.
 */
export function buildRegionMap(img: { data: Uint8ClampedArray; width: number; height: number }, scale: number, gap: number, dark = 215): RegionMap {
  const { width: w, height: h, data } = img
  const line = new Uint8Array(w * h)
  for (let i = 0; i < line.length; i++) {
    const o = i * 4
    // transparent pixels are paper
    const a = data[o + 3]! / 255
    const lum = (data[o]! * 0.299 + data[o + 1]! * 0.587 + data[o + 2]! * 0.114) * a + 255 * (1 - a)
    if (lum < dark) line[i] = 1
  }
  const barrier = dilate(line, w, h, gap)

  const labels = new Int32Array(w * h)
  let next = 0
  const stack: number[] = []
  for (let start = 0; start < labels.length; start++) {
    if (barrier[start] || labels[start]) continue
    next++
    labels[start] = next
    stack.push(start)
    while (stack.length) {
      const i = stack.pop()!
      const x = i % w
      const y = (i - x) / w
      if (x > 0 && !barrier[i - 1] && !labels[i - 1]) {
        labels[i - 1] = next
        stack.push(i - 1)
      }
      if (x < w - 1 && !barrier[i + 1] && !labels[i + 1]) {
        labels[i + 1] = next
        stack.push(i + 1)
      }
      if (y > 0 && !barrier[i - w] && !labels[i - w]) {
        labels[i - w] = next
        stack.push(i - w)
      }
      if (y < h - 1 && !barrier[i + w] && !labels[i + w]) {
        labels[i + w] = next
        stack.push(i + w)
      }
    }
  }
  return { w, h, scale, gap, barrier, labels }
}

/**
 * The field at a map position. A touch right on an outline belongs to the closest field within `radius`
 * pixels; 0 when there is none (then nothing is held back).
 */
export function labelAt(map: RegionMap, mx: number, my: number, radius = 8): number {
  const x = Math.round(mx)
  const y = Math.round(my)
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return 0
  const here = map.labels[y * map.w + x]!
  if (here > 0) return here
  let best = 0
  let bestD = Infinity
  for (let dy = -radius; dy <= radius; dy++) {
    const yy = y + dy
    if (yy < 0 || yy >= map.h) continue
    for (let dx = -radius; dx <= radius; dx++) {
      const xx = x + dx
      if (xx < 0 || xx >= map.w) continue
      const l = map.labels[yy * map.w + xx]!
      if (l > 0) {
        const d = dx * dx + dy * dy
        if (d < bestD) {
          bestD = d
          best = l
        }
      }
    }
  }
  return best
}

/**
 * Where paint of a field may go, as an alpha mask (255 / 0) in map pixels: the field itself, grown by `grow` pixels
 * into the outline around it, so paint ends under the line and not before it.
 */
export function regionMaskAlpha(map: RegionMap, label: number, grow: number): Uint8Array {
  const inside = new Uint8Array(map.labels.length)
  for (let i = 0; i < inside.length; i++) if (map.labels[i] === label) inside[i] = 1
  const grown = dilate(inside, map.w, map.h, grow)
  const out = new Uint8Array(grown.length)
  for (let i = 0; i < out.length; i++) out[i] = grown[i] ? 255 : 0
  return out
}

/**
 * How much of the picture is painted, 0 to 1: the share of all field pixels (the outlines do not count, the paper beside the drawing is a field too).
 * `alpha` is the paint layer at the size of the map (one byte per pixel). The paper is looked at in small squares: a square counts as painted when
 * about a third of its field is covered, so the little gaps a child leaves between strokes do not count against the picture.
 */
export function paintedShare(map: RegionMap, alpha: Uint8Array, block = 8): number {
  const { w, h, labels } = map
  let field = 0
  let painted = 0
  for (let by = 0; by < h; by += block) {
    for (let bx = 0; bx < w; bx += block) {
      let f = 0
      let c = 0
      const yEnd = Math.min(h, by + block)
      const xEnd = Math.min(w, bx + block)
      for (let y = by; y < yEnd; y++) {
        for (let x = bx; x < xEnd; x++) {
          const i = y * w + x
          if (!labels[i]) continue
          f++
          if (alpha[i]! > 40) c++
        }
      }
      field += f
      if (f > 0 && c / f >= 0.35) painted += f
    }
  }
  return field > 0 ? painted / field : 0
}
