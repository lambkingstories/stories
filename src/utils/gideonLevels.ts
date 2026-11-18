/**
 * "Gideons Nacht": the 36 levels in 4 chapters as data (the rules and the physics are in `gideonSim.ts`).
 * Every structure is put together from a few builders; all coordinates are in metres (the ground is y = 0, the catapult stands at x = 3.2).
 * The shots that win each level (found by the solver and played back by the tests) are in `gideonSolutions.ts`.
 */
import type { Ammo, GuardDef, JointDef, LevelDef, Mat, PartDef } from './gideonSim'
import { SOLUTIONS } from './gideonSolutions'

export const CHAPTER_COUNT = 4
export const LEVELS_PER_CHAPTER = 9

export interface Level extends LevelDef {
  /** 0-based number over all levels. */
  id: number
  chapter: number
  /** 0-based number in the chapter. */
  index: number
  /** The little hint that is shown once when this level starts (a key in the texts), if there is a new thing. */
  intro?: 'krug' | 'stein' | 'lehm' | 'glas' | 'wind' | 'wippe' | 'pendel' | 'ruf' | 'posaune' | 'fackel' | 'fels'
}

// ── the builders (the bottom edge `yb` and the middle `x`) ──────────────────────────────────────────────────────────────────
const box = (m: Mat, x: number, yb: number, w: number, h: number, more: Partial<PartDef> = {}): PartDef => ({ m, x, y: yb + h / 2, w, h, ...more })
export const wood = (x: number, yb: number, w: number, h: number, more: Partial<PartDef> = {}) => box('wood', x, yb, w, h, more)
export const post = (x: number, yb: number, h = 2) => wood(x, yb, 0.5, h)
export const plank = (x: number, yb: number, w = 3, h = 0.4) => wood(x, yb, w, h)
export const block = (x: number, yb: number, s = 1, m: Mat = 'stone') => box(m, x, yb, s, s)
export const slab = (x: number, yb: number, w: number, h: number, m: Mat = 'stone') => box(m, x, yb, w, h)
export const bale = (x: number, yb: number, w = 1.5, h = 1) => box('straw', x, yb, w, h)
export const barrel = (x: number, yb: number): PartDef => ({ m: 'barrel', s: 'circle', x, y: yb + 0.55, w: 1.1, h: 1.1 })
export const tent = (x: number, yb: number, w = 3, h = 2.2): PartDef => ({ m: 'cloth', s: 'tent', x, y: yb + h / 2, w, h })
export const guard = (x: number, yb: number, kind = 0): GuardDef => ({ x, y: yb, kind })

/** A tower of `floors` floors: two posts and a floor plank for each. Returns the parts and the height of the top. */
export function tower(x: number, yb: number, floors: number, span = 3, m: Mat = 'wood'): { parts: PartDef[]; top: number } {
  const parts: PartDef[] = []
  let y = yb
  for (let f = 0; f < floors; f++) {
    parts.push(box(m, x - (span / 2 - 0.25), y, 0.5, 1.8), box(m, x + (span / 2 - 0.25), y, 0.5, 1.8))
    parts.push(box(m, x, y + 1.8, span + 0.2, 0.4))
    y += 2.2
  }
  return { parts, top: y }
}
/** A little house for one soldier: two thin posts and a roof slab (the soldier stands inside, at the bottom edge `yb`). The roof is 1.75 m above the bottom. */
export function cabin(x: number, yb: number, span = 2.6, m: Mat = 'glass'): { parts: PartDef[]; top: number } {
  return { parts: [box(m, x - (span / 2 - 0.2), yb, 0.4, 1.75), box(m, x + (span / 2 - 0.2), yb, 0.4, 1.75), box(m, x, yb + 1.75, span + 0.3, 0.3)], top: yb + 2.05 }
}
/** A camel frame: two posts, a beam across the top. The top is 2.55 m above the bottom. */
export function frame(x: number, yb: number, w = 3): PartDef[] {
  return [post(x - (w / 2 - 0.25), yb, 2.2), post(x + (w / 2 - 0.25), yb, 2.2), wood(x, yb + 2.2, w + 0.3, 0.35)]
}
/** A wall of blocks: `cols` x `rows`, each block `s` square, starting at the bottom left corner `x0`. */
export function wall(x0: number, yb: number, cols: number, rows: number, m: Mat = 'stone', s = 1): PartDef[] {
  const out: PartDef[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(block(x0 + s / 2 + c * s, yb + r * s, s, m))
  return out
}
/** A pile of straw bales: rows from the bottom (`n` bales in the first row, one less in each row above, each row shifted by half a bale). */
export function hay(x: number, yb: number, n: number): { parts: PartDef[]; top: number } {
  const parts: PartDef[] = []
  const w = 1.5
  for (let r = 0; r < n; r++) {
    const cnt = n - r
    for (let c = 0; c < cnt; c++) parts.push(bale(x + (c - (cnt - 1) / 2) * w, yb + r, w, 1))
  }
  return { parts, top: yb + n }
}
/** A gallows with a hanging log: a post, a beam and a log on a rope. */
export function gallows(x: number, hang: number, logH = 3.6): { parts: PartDef[]; joint: JointDef } {
  const top = 8.4
  const beamW = hang + 1.6
  const parts: PartDef[] = [
    wood(x - hang / 2 - 0.55, 0, 0.5, top, { fixed: true }),
    wood(x - hang / 2 + beamW / 2 - 0.8, top, beamW, 0.4, { fixed: true }),
    wood(x, top - 1.5 - logH, 0.9, logH, { id: 'log' })
  ]
  return { parts, joint: { t: 'pendulum', part: 'log', x, y: top } }
}

/** A shelter with a guard: parts and guards that are added to a level. */
interface Mod {
  parts: PartDef[]
  guards: GuardDef[]
}
export const mod = {
  /** A tent with a guard behind it (to the right). */
  tent: (x: number, kind = 1): Mod => ({ parts: [tent(x, 0)], guards: [guard(x + 2.3, 0, kind)] }),
  /** A stone wall `h` blocks high with a guard behind it. */
  wall: (x: number, h = 2, kind = 2, m: Mat = 'stone'): Mod => ({ parts: wall(x - 0.5, 0, 1, h, m), guards: [guard(x + 1.3, 0, kind)] }),
  /** Two straw bales on each other with a guard on top. */
  bale: (x: number, kind = 0): Mod => ({ parts: [bale(x, 0), bale(x, 1)], guards: [guard(x, 2, kind)] }),
  /** A one-floor wooden tower with a guard on top. */
  tower: (x: number, kind = 1): Mod => {
    const t = tower(x, 0, 1)
    return { parts: t.parts, guards: [guard(x, t.top, kind)] }
  },
  /** A camel frame with a guard on its beam. */
  frame: (x: number, kind = 2): Mod => ({ parts: frame(x, 0), guards: [guard(x, 2.55, kind)] })
}

interface Spec {
  width: number
  wind?: number
  ammo: Ammo[]
  parts: PartDef[]
  guards: GuardDef[]
  rocks?: LevelDef['rocks']
  joints?: JointDef[]
  intro?: Level['intro']
  /** Shelters with guards that are added to the level. */
  mods?: Mod[]
}

function make(chapter: number, index: number, spec: Spec): Level {
  const id = chapter * LEVELS_PER_CHAPTER + index
  const par = SOLUTIONS[id]?.length ?? Math.max(1, spec.ammo.length - 2)
  // two throws more than the best solution (one more still gives two stars), never fewer than three
  const ammo = [...spec.ammo]
  while (ammo.length < Math.max(3, par + 2)) ammo.push('krug')
  return {
    id,
    chapter,
    index,
    width: spec.width,
    wind: spec.wind ?? 0,
    ammo,
    par,
    parts: [...spec.parts, ...(spec.mods ?? []).flatMap((m) => m.parts)],
    guards: [...spec.guards, ...(spec.mods ?? []).flatMap((m) => m.guards)],
    rocks: spec.rocks,
    joints: spec.joints,
    intro: spec.intro
  }
}

const K: Ammo = 'krug'
const S: Ammo = 'stein'
const P: Ammo = 'posaune'
const F: Ammo = 'fackel'
const R: Ammo = 'ruf'

// ── chapter 1: the camp in the valley ───────────────────────────────────────────────────────────────────────────────────────
function chapter1(): Level[] {
  const c = 0
  const out: Level[] = []
  // 1 one guard behind one bale
  out.push(make(c, 0, { width: 36, ammo: [K, K, K], parts: [bale(20.5, 0)], guards: [guard(24, 0)], intro: 'krug' }))
  // 2 a tower with a guard on top
  {
    const t = tower(25, 0, 1)
    out.push(make(c, 1, { width: 36, ammo: [K, K, K], parts: t.parts, guards: [guard(25, t.top)] }))
  }
  // 3 two guards: one behind a bale, one on a stack of bales
  out.push(make(c, 2, {
    width: 38,
    ammo: [K, K, K, K],
    parts: [bale(20, 0), bale(31, 0), bale(31, 1)],
    guards: [guard(22.8, 0, 1), guard(31, 2, 2)]
  }))
  // 4 the tents
  out.push(make(c, 3, {
    width: 40,
    ammo: [K, K, K, K, K],
    parts: [tent(20, 0), tent(26, 0), tent(32, 0)],
    guards: [guard(23, 0), guard(29, 0, 1), guard(35.5, 0, 2)]
  }))
  // 5 barrels on a rock ledge
  out.push(make(c, 4, {
    width: 40,
    ammo: [K, K, K, K],
    parts: [barrel(26.2, 2), barrel(27.4, 2), bale(29.8, 2)],
    rocks: [{ x: 29.5, y: 1, w: 9, h: 2 }],
    guards: [guard(32.2, 2)],
    mods: [mod.bale(37.5)]
  }))
  // 6 a stone column in front of the guard (the stone jar)
  out.push(make(c, 5, {
    width: 38,
    ammo: [S, K, K, S],
    parts: [block(25, 0), block(25, 1), block(25, 2), block(25, 3), bale(31, 0)],
    guards: [guard(28, 0), guard(31, 1)],
    mods: [mod.tower(35)],
    intro: 'stein'
  }))
  // 7 a bridge between two posts
  out.push(make(c, 6, {
    width: 40,
    ammo: [K, K, S, K],
    parts: [post(22, 0, 2.6), post(32, 0, 2.6), plank(27, 2.6, 11.2), block(27, 0, 1, 'clay'), block(27, 1, 1, 'clay')],
    guards: [guard(25, 3), guard(29.5, 3, 1), guard(33.5, 0, 2)],
    mods: [mod.wall(36.5, 2, 2, 'clay')],
    intro: 'lehm'
  }))
  // 8 a pile of hay
  {
    const h = hay(26, 0, 4)
    out.push(make(c, 7, {
      width: 40,
      ammo: [K, K, K, S],
      parts: h.parts,
      guards: [guard(26, h.top), guard(30.5, 0, 1), guard(21, 0, 2)]
    }))
  }
  // 9 the big watchtower, a stone wall and a guard far behind
  {
    const t = tower(26, 0, 3)
    const cb = cabin(26, t.top, 2.6, 'glass')
    out.push(make(c, 8, {
      width: 44,
      ammo: [K, S, K, K, S, K],
      parts: [...t.parts, ...cb.parts, ...wall(31, 0, 1, 3), bale(37.5, 0), bale(37.5, 1)],
      guards: [guard(26, t.top), guard(34, 0, 1), guard(37.5, 2, 2)],
      intro: 'glas'
    }))
  }
  return out
}

// ── chapter 2: midnight ─────────────────────────────────────────────────────────────────────────────────────────────────────
function chapter2(): Level[] {
  const c = 1
  const out: Level[] = []
  // 10 the night wind
  {
    const t = tower(26, 0, 2)
    out.push(make(c, 0, { width: 40, wind: 1.6, ammo: [K, K, K, K, K], parts: [...t.parts, bale(21.5, 0)], guards: [guard(26, t.top), guard(31, 0, 1)], mods: [mod.wall(35, 2, 2, 'clay')], intro: 'wind' }))
  }
  // 11 wind against the throw, two towers
  {
    const a = tower(23, 0, 1)
    const b = tower(31, 0, 1, 2.6, 'clay')
    out.push(make(c, 1, { width: 42, wind: -1.6, ammo: [K, K, K, K, K], parts: [...a.parts, ...b.parts, bale(27, 0)], guards: [guard(23, a.top), guard(31, b.top, 1), guard(35, 0, 2)] }))
  }
  // 12 the seesaw
  out.push(make(c, 2, {
    width: 42,
    ammo: [K, K, K, K, K],
    parts: [wood(27, 0.85, 6, 0.3, { id: 'ws' }), bale(33.5, 0), bale(33.5, 1)],
    rocks: [{ x: 27, y: 0.4, w: 0.6, h: 0.8 }],
    joints: [{ t: 'seesaw', part: 'ws', x: 27, y: 1.0 }],
    guards: [guard(29.3, 1.15), guard(33.5, 2, 1)],
    intro: 'wippe'
  }))
  // 13 the swinging log
  {
    const g = gallows(25, 5)
    const t = tower(31, 0, 2)
    out.push(make(c, 3, {
      width: 42,
      ammo: [K, K, K, S, K],
      parts: [...g.parts, ...t.parts, bale(36.5, 0)],
      joints: [g.joint],
      guards: [guard(31, t.top), guard(36.5, 1, 1)],
      mods: [mod.wall(38.5, 3, 2, 'clay')],
      intro: 'pendel'
    }))
  }
  // 14 the call of Gideon: two towers far apart
  {
    const a = tower(24, 0, 1)
    const b = tower(35, 0, 1)
    const cb = cabin(29.5, 0, 2.6, 'glass')
    out.push(make(c, 4, { width: 42, ammo: [R, R, K, K, K], parts: [...a.parts, ...b.parts, ...cb.parts], guards: [guard(24, a.top), guard(35, b.top, 1), guard(29.5, 0, 2)], mods: [mod.tent(38.5)], intro: 'ruf' }))
  }
  // 15 camel frames with sacks
  out.push(make(c, 5, {
    width: 42,
    ammo: [K, K, R, K, K, S],
    parts: [...frame(22, 0), ...frame(28, 0), ...frame(34, 0), bale(28, 2.55), barrel(22, 2.55)],
    guards: [guard(22, 3.65), guard(34, 2.55, 1), guard(28, 0, 2)]
  }))
  // 16 the stone fort
  out.push(make(c, 6, {
    width: 44,
    wind: 1,
    ammo: [S, S, R, K, K, K],
    parts: [...wall(25, 0, 2, 2), ...wall(25, 2, 2, 2, 'clay'), slab(26, 4, 3, 0.5, 'clay'), bale(31, 0), block(34, 0), block(34, 1), bale(38, 0)],
    guards: [guard(26, 4.5), guard(29.5, 0, 1), guard(34, 2, 2), guard(38, 1, 0)],
    mods: [mod.tower(41.5)]
  }))
  // 17 the tent city
  out.push(make(c, 7, {
    width: 44,
    wind: -1,
    ammo: [R, R, K, K, K, K],
    parts: [tent(20, 0), tent(25.5, 0), tent(31, 0), tent(36.5, 0), bale(28.2, 0), bale(33.8, 0)],
    guards: [guard(22.8, 0), guard(28.2, 1, 1), guard(33.8, 1, 2), guard(39, 0)],
    mods: [mod.frame(42.2)]
  }))
  // 18 midnight watch: the finale of the chapter
  {
    const g = gallows(22, 5)
    const t = tower(29, 0, 2)
    const cb = cabin(29, t.top, 2.6, 'glass')
    out.push(make(c, 8, {
      width: 46,
      ammo: [K, R, S, K, K, K],
      parts: [...g.parts, ...t.parts, ...cb.parts, ...wall(32.5, 0, 1, 2), ...frame(39, 0), bale(36, 0)],
      joints: [g.joint],
      guards: [guard(29, t.top), guard(34.5, 0, 1), guard(39, 2.55, 2)],
      mods: [mod.tent(42.2)]
    }))
  }
  return out
}

// ── chapter 3: trumpets and torches ─────────────────────────────────────────────────────────────────────────────────────────
function chapter3(): Level[] {
  const c = 2
  const out: Level[] = []
  // 19 the trumpet: a wall of rock between
  out.push(make(c, 0, {
    width: 44,
    ammo: [P, P, K, K, K],
    parts: [bale(40, 0), bale(40, 1)],
    rocks: [{ x: 27, y: 3, w: 1.6, h: 6 }],
    guards: [guard(31, 0), guard(33.5, 0, 1), guard(40, 2, 2)],
    intro: 'posaune'
  }))
  // 20 the torch jar: guards in stone boxes
  out.push(make(c, 1, {
    width: 44,
    ammo: [F, F, K, K, K],
    parts: [...wall(27.4, 0, 1, 2, 'wood'), ...wall(31.6, 0, 1, 2, 'wood'), slab(30, 2, 5.4, 0.5, 'wood'), ...wall(37.4, 0, 1, 2, 'wood'), ...wall(41.6, 0, 1, 2, 'wood'), slab(40, 2, 5.4, 0.5, 'wood')],
    guards: [guard(30, 0), guard(40, 0, 1)],
    intro: 'fackel'
  }))
  // 21 the cliff
  out.push(make(c, 2, {
    width: 46,
    ammo: [P, F, K, K, K, K],
    parts: [...wall(31, 5, 1, 2, 'clay'), bale(35, 5), ...tower(25, 0, 1).parts],
    rocks: [{ x: 34, y: 2.5, w: 8, h: 5 }],
    guards: [guard(33.2, 5), guard(37.2, 5, 1), guard(25, 2.2, 2)],
    intro: 'fels'
  }))
  // 22 the straw village
  {
    const a = hay(26, 0, 3)
    const b = hay(34, 0, 3)
    out.push(make(c, 3, {
      width: 46,
      ammo: [P, P, F, K, K, K],
      parts: [...a.parts, ...b.parts, tent(40.5, 0)],
      guards: [guard(26, a.top), guard(34, b.top, 1), guard(38.3, 0, 2)]
    }))
  }
  // 23 two cliffs
  {
    const t = tower(24, 3, 1, 2.6)
    const h = hay(35, 4, 2)
    out.push(make(c, 4, {
      width: 49,
      wind: 1.2,
      ammo: [F, R, P, K, K, K],
      parts: [...t.parts, ...h.parts, ...wall(39, 4, 1, 2)],
      rocks: [{ x: 24, y: 1.5, w: 4.4, h: 3 }, { x: 37.5, y: 2, w: 10, h: 4 }],
      guards: [guard(24, t.top), guard(35, h.top, 1), guard(41.3, 4, 2)],
      mods: [mod.tent(45)]
    }))
  }
  // 24 seesaw, swinging log and tower
  {
    const g = gallows(31, 5)
    const t = tower(38, 0, 2)
    out.push(make(c, 5, {
      width: 46,
      ammo: [K, R, P, K, K, K],
      parts: [wood(22, 0.85, 6, 0.3, { id: 'ws' }), ...g.parts, ...t.parts],
      rocks: [{ x: 22, y: 0.4, w: 0.6, h: 0.8 }],
      joints: [{ t: 'seesaw', part: 'ws', x: 22, y: 1.0 }, g.joint],
      guards: [guard(24.3, 1.15), guard(38, t.top, 1), guard(41.5, 0, 2)]
    }))
  }
  // 25 the fort in the wind
  {
    const t = tower(33, 0, 2, 3, 'wood')
    out.push(make(c, 6, {
      width: 49,
      wind: 2,
      ammo: [P, F, S, K, K, K],
      parts: [...wall(24, 0, 2, 2), ...wall(24, 2, 2, 1, 'clay'), ...t.parts, block(38.5, 0, 1, 'clay'), block(38.5, 1, 1, 'glass')],
      guards: [guard(25, 3), guard(33, t.top, 1), guard(41, 0, 2)],
      mods: [mod.tent(44.5)]
    }))
  }
  // 26 straw, stone and wood
  out.push(make(c, 7, {
    width: 50,
    ammo: [R, F, P, S, K, K],
    parts: [...wall(22, 0, 1, 2), ...wall(22, 2, 1, 1, 'clay'), ...frame(28, 0), bale(28, 2.55), ...hay(35, 0, 3).parts, tent(41.5, 0)],
    guards: [guard(25, 0), guard(28, 3.55, 1), guard(35, 3, 2), guard(44, 0)],
    mods: [mod.tower(47.5)]
  }))
  // 27 the ring of lights: the finale of the chapter
  {
    const t = tower(36, 0, 1)
    out.push(make(c, 8, {
      width: 50,
      ammo: [F, F, P, P, R, K],
      parts: [tent(21, 0), ...wall(27, 0, 2, 2), ...t.parts, ...frame(43, 0)],
      guards: [guard(23.8, 0), guard(28, 2, 1), guard(36, t.top, 2), guard(43, 2.55)]
    }))
  }
  return out
}

// ── chapter 4: the flight ───────────────────────────────────────────────────────────────────────────────────────────────────
function chapter4(): Level[] {
  const c = 3
  const out: Level[] = []
  // 28 the caravanserai
  out.push(make(c, 0, {
    width: 48,
    ammo: [K, R, S, P, K, K],
    parts: [...frame(22, 0), ...frame(28, 0), ...frame(34, 0), slab(31, 2.55, 4.2, 0.4, 'glass'), tent(40, 0), ...hay(45, 0, 2).parts],
    guards: [guard(22, 2.55), guard(28, 2.55, 1), guard(34, 2.55, 2), guard(45, 2)]
  }))
  // 29 the ram
  {
    const g = gallows(24, 5)
    const t = tower(31, 0, 3)
    out.push(make(c, 1, {
      width: 48,
      wind: -1.5,
      ammo: [S, K, R, P, K, K],
      parts: [...g.parts, ...t.parts, ...wall(37, 0, 1, 3), bale(42, 0), bale(42, 1)],
      joints: [g.joint],
      guards: [guard(31, t.top), guard(34.5, 0, 1), guard(42, 2, 2)]
    }))
  }
  // 30 the citadel
  out.push(make(c, 2, {
    width: 48,
    ammo: [F, P, S, K, K, K],
    parts: [...wall(28, 0, 3, 3), slab(29.5, 3, 3.4, 0.5, 'clay'), ...wall(34.5, 0, 1, 2, 'clay'), ...wall(38, 0, 2, 3), slab(39, 3, 2.4, 0.5, 'clay')],
    guards: [guard(29.5, 3.5), guard(32.5, 0, 1), guard(39, 3.5, 2), guard(36, 0)],
    mods: [mod.tent(43.5)]
  }))
  // 31 the sea of tents
  out.push(make(c, 3, {
    width: 48,
    wind: 1,
    ammo: [R, R, P, F, K, K],
    parts: [tent(20, 0, 3.4, 2.4), tent(25.5, 0), tent(31, 0, 3.4, 2.4), tent(36.5, 0), tent(42, 0, 3.4, 2.4), bale(28.3, 0), bale(33.8, 0), bale(39.3, 0)],
    guards: [guard(22.9, 0), guard(28.3, 1, 1), guard(33.8, 1, 2), guard(39.3, 1), guard(45, 0, 1)]
  }))
  // 32 two seesaws
  {
    const t = tower(35, 0, 2)
    out.push(make(c, 4, {
      width: 50,
      ammo: [K, R, P, K, K, K],
      parts: [wood(21, 0.85, 6, 0.3, { id: 'w1' }), wood(28.5, 0.85, 6, 0.3, { id: 'w2' }), ...t.parts, ...wall(40, 0, 1, 2)],
      rocks: [{ x: 21, y: 0.4, w: 0.6, h: 0.8 }, { x: 28.5, y: 0.4, w: 0.6, h: 0.8 }],
      joints: [{ t: 'seesaw', part: 'w1', x: 21, y: 1.0 }, { t: 'seesaw', part: 'w2', x: 28.5, y: 1.0 }],
      guards: [guard(23.3, 1.15), guard(30.8, 1.15, 1), guard(35, t.top, 2), guard(43, 0)],
      mods: [mod.tent(46.5)]
    }))
  }
  // 33 the high tower of stone and wood
  {
    const a = tower(28, 0, 2, 3, 'clay')
    const b = tower(28, a.top, 2, 3, 'wood')
    out.push(make(c, 5, {
      width: 48,
      wind: 1.5,
      ammo: [S, P, R, K, K, K],
      parts: [...a.parts, ...b.parts, ...wall(35, 0, 1, 2), bale(40, 0)],
      guards: [guard(28, a.top), guard(28, b.top, 1), guard(37.5, 0, 2), guard(40, 1)],
      mods: [mod.tower(45)]
    }))
  }
  // 34 the fortress on the rock
  out.push(make(c, 6, {
    width: 48,
    ammo: [F, P, P, S, K, K],
    parts: [...wall(31, 5, 2, 2), slab(32, 7, 3.2, 0.5), ...hay(37, 5, 2).parts, tent(23, 0)],
    rocks: [{ x: 35, y: 2.5, w: 10, h: 5 }],
    guards: [guard(32, 7.5), guard(37, 7, 1), guard(39.2, 5, 2), guard(26, 0)],
    mods: [mod.tent(43.5)]
  }))
  // 35 the chain of guards
  {
    const t = tower(23, 0, 2)
    out.push(make(c, 7, {
      width: 48,
      ammo: [R, F, P, S, K, K],
      parts: [...t.parts, ...hay(29.5, 0, 3).parts, ...wall(35, 0, 1, 2), ...wall(35, 2, 1, 1, 'glass'), ...frame(40.5, 0), tent(45, 0)],
      guards: [guard(23, t.top), guard(29.5, 3, 1), guard(37, 0, 2), guard(40.5, 2.55), guard(47.5, 0, 1)]
    }))
  }
  // 36 Gideon has won: the whole camp
  {
    const t = tower(24, 0, 3, 3, 'wood')
    const cb = cabin(43, 0, 2.6, 'glass')
    out.push(make(c, 8, {
      width: 48,
      wind: 0,
      ammo: [R, P, F, S, K, K],
      parts: [...t.parts, ...wall(37, 0, 2, 3), slab(38, 3, 3.4, 0.5), ...cb.parts, bale(20, 0)],
      guards: [guard(24, t.top), guard(34.5, 0, 1), guard(38, 3.5, 2), guard(43, 0)],
      mods: [mod.bale(27.4), mod.tent(29.6)]
    }))
  }
  return out
}

export const LEVELS: Level[] = [...chapter1(), ...chapter2(), ...chapter3(), ...chapter4()]
