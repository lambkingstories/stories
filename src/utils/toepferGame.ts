/**
 * "Der Töpfer" (Jeremiah 18): the rules of the pottery game, without Vue and without a canvas, so that they can be tested.
 *
 * A vessel is a body of revolution. Its cross-section is the profile: the radius at every height (`r[i]` at `y = i * DY`) and the
 * height `h` of the rim. The finger forms it from the side: it drags the clay to its own distance from the axis (`dragAt`), and a
 * finger at the rim pulls the clay up or pushes it down (`pullTo`). The template is the same kind of profile; how well the two fit
 * gives the stars (`similarity`, `starsOf`). Nothing here can be lost or fail: there is only "not yet close enough".
 */

/** The rows of a profile: the radius is stored at every `DY` of height. */
export const ROWS = 140
/** The highest vessel there can be (world units; a radius of 1 is about the width of a hand). */
export const WORLD_H = 2.8
export const DY = WORLD_H / ROWS
/** The widest vessel, and the narrowest wall the clay can be pressed to. */
export const WORLD_R = 1.3
export const R_MIN = 0.1
/** The lowest vessel. */
export const H_MIN = 0.3
/** How much the view from above bends the rim (the rim is an ellipse of this ratio). */
export const TILT = 0.19

export interface Profile {
  /** The radius at the rows `0..ROWS`; rows above `h` repeat the radius of the rim (so growing taller needs no extra work). */
  r: Float32Array
  /** The height of the rim. */
  h: number
}

export const newProfile = (): Profile => ({ r: new Float32Array(ROWS + 1), h: 0 })

export function cloneProfile(p: Profile): Profile {
  return { r: new Float32Array(p.r), h: p.h }
}

export function copyInto(dst: Profile, src: Profile): void {
  dst.r.set(src.r)
  dst.h = src.h
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

/** The radius of the vessel at the height `y` (0 above the rim). */
export function radiusAt(p: Profile, y: number): number {
  if (y > p.h + 1e-9 || y < -1e-9) return 0
  const f = clamp(y, 0, p.h) / DY
  const i = Math.min(ROWS - 1, Math.floor(f))
  const t = f - i
  return p.r[i]! * (1 - t) + p.r[i + 1]! * t
}

/** A profile through control points `[height, radius]`, a smooth curve (cubic Hermite with finite-difference slopes). */
export function profileFromPoints(pts: ReadonlyArray<readonly [number, number]>): Profile {
  const p = newProfile()
  const n = pts.length
  const slope = pts.map((_, k) => {
    const a = pts[Math.max(0, k - 1)]!
    const b = pts[Math.min(n - 1, k + 1)]!
    return (b[1] - a[1]) / (b[0] - a[0] || 1)
  })
  const h = pts[n - 1]![0]
  p.h = h
  let k = 0
  for (let i = 0; i <= ROWS; i++) {
    const y = Math.min(i * DY, h)
    while (k < n - 2 && y > pts[k + 1]![0]) k++
    const [y0, r0] = pts[k]!
    const [y1, r1] = pts[k + 1]!
    const d = y1 - y0 || 1
    const t = clamp((y - y0) / d, 0, 1)
    const t2 = t * t
    const t3 = t2 * t
    const v = (2 * t3 - 3 * t2 + 1) * r0 + (t3 - 2 * t2 + t) * d * slope[k]! + (-2 * t3 + 3 * t2) * r1 + (t3 - t2) * d * slope[k + 1]!
    p.r[i] = clamp(v, R_MIN, WORLD_R)
  }
  return p
}

/** The lump of clay every vessel starts from. */
export function lumpProfile(): Profile {
  return profileFromPoints([
    [0, 0.72],
    [0.3, 0.75],
    [0.55, 0.68],
    [0.72, 0.5]
  ])
}

export interface Limits {
  /** The widest radius and the highest rim that this level lets the clay reach (the picture is zoomed to them). */
  rMax: number
  hMax: number
}

/**
 * The finger at the height `y` presses or pulls the clay to the radius `rTarget`; the nearby rows follow in a soft bell
 * (`sigma` wide), so the wall stays smooth and never gets an edge. `strength` 1 puts the clay exactly under the finger.
 */
export function dragAt(p: Profile, y: number, rTarget: number, sigma: number, lim: Limits, strength = 0.85): void {
  const yc = clamp(y, 0, p.h)
  const rWant = clamp(rTarget, R_MIN, lim.rMax)
  const top = Math.min(ROWS, Math.floor(p.h / DY))
  // the finger presses the wall flat along its slope, so that a slanting wall keeps its slant under the finger (no lag along the wall)
  const ic = Math.round(yc / DY)
  const ia = Math.max(0, ic - 2)
  const ib = Math.min(top, ic + 2)
  const slope = ib > ia ? clamp((p.r[ib]! - p.r[ia]!) / ((ib - ia) * DY), -3, 3) : 0
  const lo = Math.max(0, Math.floor((yc - 3 * sigma) / DY))
  const hi = Math.min(ROWS, Math.ceil((yc + 3 * sigma) / DY))
  for (let i = lo; i <= hi; i++) {
    const yi = i * DY
    if (yi > p.h + 1e-9) break
    const d = (yi - yc) / sigma
    const w = Math.exp(-0.5 * d * d) * strength
    const target = clamp(rWant + slope * (yi - yc), R_MIN, lim.rMax)
    p.r[i] = p.r[i]! + (target - p.r[i]!) * w
  }
  syncRim(p)
}

/** The rows above the highest full row take its radius (the rim stays where the finger left it). */
function syncRim(p: Profile): void {
  const top = Math.min(ROWS, Math.floor(p.h / DY))
  const rim = p.r[top]!
  for (let i = top + 1; i <= ROWS; i++) p.r[i] = rim
}

/** The finger at the rim pulls the clay up or pushes it down: the rim goes to `newH` (the clay under it keeps its shape). */
export function pullTo(p: Profile, newH: number, lim: Limits): void {
  const h = clamp(newH, H_MIN, lim.hMax)
  if (Math.abs(h - p.h) < 1e-9) return
  const rim = clamp(radiusAt(p, Math.min(p.h, h)), R_MIN, lim.rMax)
  p.h = h
  p.r[Math.min(ROWS, Math.floor(h / DY))] = rim
  syncRim(p)
}

/** The soft hand over the wall: every row moves a little towards the mean of its neighbours (the rim and the foot stay). */
export function smooth(p: Profile, passes = 2, amount = 0.5): void {
  const top = Math.min(ROWS, Math.floor(p.h / DY))
  for (let k = 0; k < passes; k++) {
    let prev = p.r[0]!
    for (let i = 1; i < top; i++) {
      const cur = p.r[i]!
      p.r[i] = cur + amount * (0.5 * (prev + p.r[i + 1]!) - cur)
      prev = cur
    }
  }
  syncRim(p)
}

/** How well a vessel fits the template, 0..1: one minus the mean relative difference of the radii over all heights. */
export function similarity(a: Profile, b: Profile): number {
  const top = Math.max(a.h, b.h)
  const n = Math.max(1, Math.round(top / DY))
  let sum = 0
  for (let i = 0; i < n; i++) {
    const y = (i + 0.5) * DY
    const ra = radiusAt(a, y)
    const rb = radiusAt(b, y)
    const denom = Math.max(ra, rb, 0.35)
    sum += 1 - Math.min(1, Math.abs(ra - rb) / denom)
  }
  return sum / n
}

/** The scores that give one, two and three stars. */
export type Thresholds = readonly [number, number, number]
export const THRESHOLDS: Thresholds = [0.78, 0.88, 0.94]
/** The first chapter is a little more generous. */
export const THRESHOLDS_EASY: Thresholds = [0.74, 0.85, 0.92]

export function starsOf(score: number, th: Thresholds): number {
  return score >= th[2] ? 3 : score >= th[1] ? 2 : score >= th[0] ? 1 : 0
}

// ── the levels ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface View {
  rMax: number
  hMax: number
  /** How wide the touch bell is (world units). */
  sigma: number
}

/** The part of the world a level shows: it fits the template with room around it. */
export function viewOf(target: Profile): View {
  let rm = 0
  for (let i = 0; i <= Math.round(target.h / DY); i++) rm = Math.max(rm, target.r[i]!)
  const hMax = Math.min(WORLD_H, Math.max(target.h * 1.15 + 0.15, 0.95))
  const rMax = Math.min(WORLD_R, Math.max(rm * 1.3, 0.9))
  const sigma = clamp(0.055 * hMax, 0.06, 0.12)
  return { rMax, hMax, sigma }
}

/** A deterministic random number generator (small and fast, for the dents of a spoiled vessel and for the tests). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** The bent and dented earlier vessel that a "spoiled" level starts from: waves in the wall, a sunken rim, a lower rim. */
export function spoiledStart(base: Profile, seed: number): Profile {
  const rnd = seeded(seed * 7919 + 13)
  const p = cloneProfile(base)
  const ph1 = rnd() * 6.28
  const ph2 = rnd() * 6.28
  const f1 = 4.5 + rnd() * 2.5
  const f2 = 11 + rnd() * 3
  p.h = Math.max(H_MIN + 0.1, base.h * (0.74 + rnd() * 0.08))
  const top = Math.min(ROWS, Math.floor(p.h / DY))
  for (let i = 0; i <= top; i++) {
    const y = i * DY
    const wave = 0.17 * Math.sin(y * f1 + ph1) + 0.05 * Math.sin(y * f2 + ph2)
    const dent = -0.3 * Math.exp(-(((y - p.h * (0.4 + 0.3 * rnd())) / 0.18) ** 2))
    p.r[i] = clamp(base.r[i]! * (1 + wave + dent * 0.5), 0.28, 1.15)
  }
  syncRim(p)
  smooth(p, 5, 0.5)
  return p
}

// ── a hand for the tests (and for the check that every template can be reached) ─────────────────────────────────────────────

/**
 * Forms a vessel the way a patient finger would: the rim to the height of the template, then the finger runs along the wall from
 * the foot to the rim and back, at every step to the radius of the template (plus `shake` of a trembling hand).
 */
export function formLikeFinger(p: Profile, target: Profile, view: View, opts: { shake?: number; rnd?: () => number; rounds?: number } = {}): void {
  const rnd = opts.rnd ?? seeded(5)
  const shake = opts.shake ?? 0
  const lim: Limits = { rMax: view.rMax, hMax: view.hMax }
  const jitter = () => (shake ? (rnd() - 0.5) * 2 * shake : 0)
  for (let k = 0; k < 40 && Math.abs(p.h - target.h) > 0.005; k++) pullTo(p, p.h + clamp(target.h - p.h, -0.3, 0.3), lim)
  // the finger runs along the wall up and down; the player looks at the result and presses a little beyond the template where it still differs
  const rounds = opts.rounds ?? 8
  for (let round = 0; round < rounds; round++) {
    const sigma = round < 2 ? view.sigma : view.sigma * 0.5
    const step = sigma / 2
    const n = Math.ceil(target.h / step)
    for (let s = 0; s <= n; s++) {
      const y = (round % 2 === 0 ? s : n - s) * step
      const want = radiusAt(target, Math.min(y, target.h))
      const have = radiusAt(p, Math.min(y, p.h))
      dragAt(p, y, want + (want - have) * 0.9 + jitter(), sigma, lim, 0.45)
    }
  }
}
