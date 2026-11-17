/**
 * "Das verlorene Lamm": how the building is put on the screen (no Vue): the light isometric view, fitting a level into a rectangle, and finding what a touch hit.
 * A point (x, y, z) of the building lies at u = (x - y) * S and v = ((x + y) / 2 - z) * S on the screen (S pixels for half the width of a floor tile).
 */
import { placeOf, poseOf, sliderPos, type Model } from '@/utils/lammGame'

export interface View {
  /** Pixels for half the width of a floor tile. */
  s: number
  /** The screen place of the point (0, 0, 0). */
  ox: number
  oy: number
}

export function project(v: View, x: number, y: number, z: number): [number, number] {
  return [v.ox + (x - y) * v.s, v.oy + ((x + y) / 2 - z) * v.s]
}

/** The place in the building at height z that lies under a screen point (x and y). */
export function unproject(v: View, px: number, py: number, z: number): [number, number] {
  const u = (px - v.ox) / v.s
  const w = 2 * ((py - v.oy) / v.s + z)
  return [(u + w) / 2, (w - u) / 2]
}

export interface Bounds {
  u0: number
  u1: number
  v0: number
  v1: number
}

/** The room a level needs on the screen, in units of S: every place a cell can be in (all states of every group, turns included) and the things that stand on it. */
export function levelBounds(m: Model): Bounds {
  let u0 = Infinity
  let u1 = -Infinity
  let v0 = Infinity
  let v1 = -Infinity
  const take = (x: number, y: number, z: number, up = 0, down = 0.6, side = 1) => {
    const u = x - y
    const v = (x + y) / 2 - z
    u0 = Math.min(u0, u - side)
    u1 = Math.max(u1, u + side)
    v0 = Math.min(v0, v - 0.5 - up)
    v1 = Math.max(v1, v + 0.5 + down)
  }
  for (const c of m.cells) {
    if (c.g < 0) {
      take(c.x, c.y, c.z, c.goal || c.start ? 1.9 : c.flower >= 0 ? 1.2 : 0.6)
      continue
    }
    const g = m.groups[c.g]!
    const gd = g.def
    const poses = []
    if (gd.kind === 'turn' || gd.kind === 'swing') for (let q = 0; q <= (gd.kind === 'turn' ? 4 : 1); q += 0.25) poses.push({ rot: q, dx: 0, dy: 0, dz: 0, on: true, open: true })
    else for (let s = 0; s < g.states; s++) poses.push(poseOf(g, s))
    // a slider moves between whole places: all of them are in `poses`; add the lamb's height on top
    for (const p of poses) {
      const [x, y, z] = placeOf(m, c, p)
      take(x, y, z, 1.2)
    }
  }
  for (const c of m.controls) take(c.def.h[0], c.def.h[1], c.def.h[2], 1.3)
  for (const d of m.def.deco ?? []) take(d.x, d.y, d.z, 1.6 * (d.k ?? 1), 0.3)
  return { u0, u1, v0, v1 }
}

/** The view that fits the building into a rectangle of the screen (left, top, width, height), centred; the scale is not bigger than `max`. */
export function fitView(b: Bounds, left: number, top: number, width: number, height: number, max = 74): View {
  const uw = Math.max(1, b.u1 - b.u0)
  const vh = Math.max(1, b.v1 - b.v0)
  const s = Math.max(8, Math.min(max, width / uw, height / vh))
  const ox = left + width / 2 - ((b.u0 + b.u1) / 2) * s
  const oy = top + height / 2 - ((b.v0 + b.v1) / 2) * s
  return { s, ox, oy }
}

/** The depth of a point for the order of drawing: what lies further to the right, further down (nearer to us) and higher is drawn later. */
export function depthKey(x: number, y: number, z: number): number {
  return x + y + z + (x - y) * 0.0001
}

/** The slider position as a fraction of its way, for the handle (not used by the rules). */
export function sliderFraction(n: number, s: number): number {
  return n > 0 ? sliderPos(n, s) / n : 0
}
