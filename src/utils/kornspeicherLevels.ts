/**
 * "Josefs Kornspeicher": the 36 levels in 4 chapters as data (the rules and the physics are in `kornspeicherSim.ts`).
 * Chapter 1 at the Nile, chapter 2 in the desert (wind, clay walls, seesaw), chapter 3 in the town (towers of crates with sheaves of wheat),
 * chapter 4 at the pyramids (stone). Every structure is put together from a few builders; all coordinates are in metres (the ground is y = 0, the catapult
 * stands at x = 3.2). The shots that win each level (found by the solver and played back by the tests) are in `kornspeicherSolutions.ts`.
 */
import type { Ammo, JointDef, LevelDef, Mat, PartDef, RockDef, SiloDef, WaterDef } from './kornspeicherSim'
import { SOLUTIONS } from './kornspeicherSolutions'

export const CHAPTER_COUNT = 4
export const LEVELS_PER_CHAPTER = 9

export interface Level extends LevelDef {
  /** 0-based number over all levels. */
  id: number
  chapter: number
  /** 0-based number in the chapter. */
  index: number
  /** The little hint that is shown once when this level starts (a key in the texts), if there is a new thing. */
  intro?: 'sack' | 'nil' | 'schwer' | 'aehren' | 'garbe' | 'fass' | 'wind' | 'wippe' | 'luft'
}

// ── the builders (the bottom edge `yb` and the middle `x`) ──────────────────────────────────────────────────────────────────
const box = (m: Mat, x: number, yb: number, w: number, h: number, more: Partial<PartDef> = {}): PartDef => ({ m, x, y: yb + h / 2, w, h, ...more })
export const wood = (x: number, yb: number, w: number, h: number, more: Partial<PartDef> = {}) => box('wood', x, yb, w, h, more)
export const post = (x: number, yb: number, h = 2) => wood(x, yb, 0.5, h)
export const plank = (x: number, yb: number, w = 3, h = 0.4) => wood(x, yb, w, h)
export const crate = (x: number, yb: number) => box('crate', x, yb, 1, 1)
export const block = (x: number, yb: number, s = 1, m: Mat = 'stone') => box(m, x, yb, s, s)
export const sheaf = (x: number, yb: number): PartDef => ({ m: 'straw', x, y: yb + 0.55, w: 0.9, h: 1.1, grain: true })
export const barrel = (x: number, yb: number): PartDef => ({ m: 'barrel', s: 'circle', x, y: yb + 0.55, w: 1.1, h: 1.1 })
/** A granary: a bin of the given inner width, with the grain it needs. */
export const silo = (x: number, need: number, more: Partial<SiloDef> = {}): SiloDef => ({ x, y: 0, w: 3.0, h: 2.3, need, look: 0, ...more })
export const palm = (x: number, h = 5): RockDef => ({ x, y: h / 2, w: 0.5, h, k: 'palm' })
/** A platform of stone blocks for a granary on a hill (its top is at `top`). */
export const plat = (x: number, top: number, w = 4.6): RockDef => ({ x, y: top / 2, w, h: top, k: 'pyramid' })
export const nile = (x0: number, x1: number): WaterDef => ({ x0, x1 })

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
/** A wall of blocks: `cols` x `rows`, each block 1 m square, starting at the bottom left corner `x0`. */
export function wall(x0: number, yb: number, cols: number, rows: number, m: Mat = 'crate'): PartDef[] {
  const out: PartDef[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(block(x0 + 0.5 + c, yb + r, 1, m))
  return out
}
/** A pyramid of stone blocks: `rows` rows, the bottom row has `rows` blocks of 1.4 m, each row one block shorter. */
export function pyramid(x: number, rows: number, m: Mat = 'stone'): PartDef[] {
  const out: PartDef[] = []
  for (let r = 0; r < rows; r++) {
    const n = rows - r
    for (let c = 0; c < n; c++) out.push(box(m, x + (c - (n - 1) / 2) * 1.4, r * 0.9, 1.4, 0.9))
  }
  return out
}
/** A seesaw: a plank on a wedge (the wedge is a small rock). */
export function seesaw(x: number, id: string, len = 6): { part: PartDef; rock: RockDef; joint: JointDef } {
  return { part: wood(x, 0.85, len, 0.3, { id }), rock: { x, y: 0.4, w: 0.6, h: 0.8 }, joint: { t: 'seesaw', part: id, x, y: 1.0 } }
}

interface Spec {
  width: number
  wind?: number
  ammo: Ammo[]
  parts?: PartDef[]
  silos: SiloDef[]
  rocks?: RockDef[]
  water?: WaterDef[]
  joints?: JointDef[]
  intro?: Level['intro']
}

function make(chapter: number, index: number, spec: Spec): Level {
  const id = chapter * LEVELS_PER_CHAPTER + index
  const par = SOLUTIONS[id]?.length ?? Math.max(1, spec.ammo.length - 2)
  // two throws more than the best solution (one more still gives two stars), never fewer than three
  const ammo = [...spec.ammo]
  while (ammo.length < Math.max(3, par + 2)) ammo.push('sack')
  return {
    id,
    chapter,
    index,
    width: spec.width,
    wind: spec.wind ?? 0,
    ammo,
    par,
    parts: spec.parts ?? [],
    // wooden bins at the Nile, mud-brick bins in the town and at the pyramids (some of both in the desert)
    silos: spec.silos.map((g, i) => ({ ...g, look: g.look ?? (chapter >= 2 ? 1 : chapter === 1 && i % 2 === 1 ? 1 : 0) })),
    rocks: spec.rocks,
    water: spec.water,
    joints: spec.joints,
    intro: spec.intro
  }
}

const K: Ammo = 'sack'
const H: Ammo = 'schwer'
const E: Ammo = 'aehren'
const F: Ammo = 'fass'
const L: Ammo = 'luft'

// ── chapter 1: at the Nile ──────────────────────────────────────────────────────────────────────────────────────────────────
function chapter1(): Level[] {
  const c = 0
  const out: Level[] = []
  // 1 one granary, one sack is enough
  out.push(make(c, 0, { width: 40, ammo: [K, K, K], silos: [silo(24, 1)], intro: 'sack' }))
  // 2 the Nile in front of the granary
  out.push(make(c, 1, { width: 42, ammo: [K, K, K, K], silos: [silo(30, 2)], water: [nile(12, 19)], intro: 'nil' }))
  // 3 a palm in the way
  out.push(make(c, 2, { width: 42, ammo: [K, K, K, K], silos: [silo(27, 2)], rocks: [palm(17, 5.5)] }))
  // 4 a wall of crates in front: the heavy sack
  out.push(make(c, 3, { width: 44, ammo: [H, K, K, K], silos: [silo(33, 2)], parts: wall(23, 0, 1, 4), intro: 'schwer' }))
  // 5 the river is wide: the bundle of ears splits in three
  out.push(make(c, 4, { width: 46, ammo: [E, K, K, K], silos: [silo(35, 3)], water: [nile(13, 26)], intro: 'aehren' }))
  // 6 a sheaf on a tower falls into the granary
  {
    const t = tower(26, 0, 1)
    out.push(make(c, 5, { width: 44, ammo: [K, K, K, K], silos: [silo(33, 2)], parts: [...t.parts, sheaf(26, t.top)], intro: 'garbe' }))
  }
  // 7 two granaries with a wall between
  out.push(make(c, 6, { width: 48, ammo: [K, K, K, K, K], silos: [silo(21, 1), silo(38, 2)], parts: wall(29, 0, 1, 3) }))
  // 8 a block of crates: the barrel
  out.push(make(c, 7, { width: 46, ammo: [F, K, K, K, K], silos: [silo(37, 2)], parts: wall(26, 0, 3, 3), intro: 'fass' }))
  // 9 river, palm and two granaries
  out.push(make(c, 8, { width: 50, ammo: [K, E, K, K, K, K], silos: [silo(31, 2), silo(42, 1)], rocks: [palm(25, 6)], water: [nile(13, 22)] }))
  return out
}

// ── chapter 2: the desert ───────────────────────────────────────────────────────────────────────────────────────────────────
function chapter2(): Level[] {
  const c = 1
  const out: Level[] = []
  // 10 wind and a clay wall
  out.push(make(c, 0, { width: 44, wind: 1.6, ammo: [K, K, K, K, K], silos: [silo(31, 2)], parts: wall(22, 0, 1, 3, 'clay'), intro: 'wind' }))
  // 11 wind against the throw, a palm and crates
  out.push(make(c, 1, { width: 46, wind: -1.4, ammo: [K, K, K, K, K], silos: [silo(35, 2)], rocks: [palm(20, 5)], parts: wall(27, 0, 1, 3) }))
  // 12 the seesaw throws a sheaf
  {
    const s = seesaw(22, 'ws')
    out.push(make(c, 2, { width: 44, ammo: [K, K, K, K, K], silos: [silo(29.5, 2)], parts: [s.part, sheaf(24.6, 1.0)], rocks: [s.rock], joints: [s.joint], intro: 'wippe' }))
  }
  // 13 a high clay wall: the swollen bag floats over it
  out.push(make(c, 3, { width: 46, ammo: [L, K, K, K, K], silos: [silo(32, 2)], parts: wall(24, 0, 1, 5, 'clay'), rocks: [palm(19, 6.5)], intro: 'luft' }))
  // 14 a granary on a hill
  out.push(make(c, 4, { width: 46, ammo: [K, K, K, K, K], silos: [silo(33, 2, { y: 2.5 })], rocks: [plat(33, 2.5)] }))
  // 15 two granaries, a tower with sheaves between
  {
    const t = tower(30, 0, 2)
    out.push(make(c, 5, { width: 46, ammo: [K, E, K, K, K], silos: [silo(23, 1), silo(38, 2)], parts: [...t.parts, sheaf(29, t.top), sheaf(31, t.top)] }))
  }
  // 16 a wide river: only far throws arrive
  out.push(make(c, 6, { width: 48, ammo: [E, L, K, K, K, K], silos: [silo(37, 2)], water: [nile(10, 28)] }))
  // 17 clay and wood towers in the way
  {
    const a = tower(24, 0, 2, 3, 'clay')
    const b = tower(30, 0, 2)
    out.push(make(c, 7, { width: 48, ammo: [H, K, K, K, K], silos: [silo(37, 2)], parts: [...a.parts, ...b.parts] }))
  }
  // 18 wind and three small granaries
  out.push(make(c, 8, { width: 50, wind: 1.2, ammo: [K, K, K, K, K, K], silos: [silo(21, 1), silo(31, 1), silo(41, 1)], parts: [...wall(26, 0, 1, 3, 'clay'), ...wall(36, 0, 1, 3, 'clay')] }))
  return out
}

// ── chapter 3: the town ─────────────────────────────────────────────────────────────────────────────────────────────────────
function chapter3(): Level[] {
  const c = 2
  const out: Level[] = []
  // 19 sheaves on a tower next to the granary
  {
    const t = tower(26, 0, 2)
    out.push(make(c, 0, { width: 44, ammo: [K, K, K, K, K], silos: [silo(33, 3)], parts: [...t.parts, sheaf(25, t.top), sheaf(27, t.top)] }))
  }
  // 20 a river and a block of crates
  out.push(make(c, 1, { width: 46, ammo: [H, K, K, K], silos: [silo(34, 2)], parts: wall(26, 0, 2, 3), water: [nile(15, 24)] }))
  // 21 a hill granary behind a palm
  out.push(make(c, 2, { width: 48, ammo: [E, K, K, K, K], silos: [silo(35, 2, { y: 2.5 })], rocks: [plat(35, 2.5), palm(24, 6)] }))
  // 22 wind and a high clay wall between two granaries
  out.push(make(c, 3, { width: 50, wind: -1.2, ammo: [K, K, K, K, K, K], silos: [silo(23, 2), silo(38, 1)], parts: wall(30, 0, 1, 5, 'clay') }))
  // 23 seesaw, sheaves and a tower
  {
    const s = seesaw(21, 'ws')
    const t = tower(33, 0, 2)
    out.push(make(c, 4, { width: 48, ammo: [K, K, L, K, K, K], silos: [silo(27.5, 1), silo(40, 2)], parts: [s.part, sheaf(23.6, 1.0), ...t.parts, sheaf(33, t.top)], rocks: [s.rock], joints: [s.joint] }))
  }
  // 24 two towers with sheaves
  {
    const a = tower(22, 0, 2)
    const b = tower(31, 0, 2)
    out.push(make(c, 5, { width: 50, ammo: [K, K, E, K, K, K], silos: [silo(26.5, 2), silo(38, 1)], parts: [...a.parts, ...b.parts, sheaf(22, a.top), sheaf(31, b.top)] }))
  }
  // 25 a river, a palm and the swollen bag
  out.push(make(c, 6, { width: 50, ammo: [L, E, K, K, K, K], silos: [silo(38, 2)], rocks: [palm(33.5, 5.5)], water: [nile(18, 31)] }))
  // 26 two granaries on hills
  out.push(make(c, 7, { width: 50, ammo: [K, K, F, K, K, K], silos: [silo(27, 1, { y: 2 }), silo(40, 2, { y: 3.5 })], rocks: [plat(27, 2), plat(40, 3.5)] }))
  // 27 the city of crates
  out.push(make(c, 8, { width: 50, ammo: [H, K, K, K, K, K], silos: [silo(28, 2), silo(41, 1)], parts: [...wall(21, 0, 2, 4), ...wall(33, 0, 2, 3)] }))
  return out
}

// ── chapter 4: the pyramids ─────────────────────────────────────────────────────────────────────────────────────────────────
function chapter4(): Level[] {
  const c = 3
  const out: Level[] = []
  // 28 a little pyramid in front of the granary
  out.push(make(c, 0, { width: 46, ammo: [K, K, K, K, K], silos: [silo(35, 2)], parts: pyramid(25, 3) }))
  // 29 wind and a tall stone wall
  out.push(make(c, 1, { width: 48, wind: 1.5, ammo: [H, H, K, K, K, K], silos: [silo(36, 3)], parts: wall(25, 0, 1, 4, 'stone') }))
  // 30 two hill granaries behind a pyramid
  out.push(make(c, 2, { width: 50, ammo: [K, E, K, K, K, K], silos: [silo(31, 1, { y: 2 }), silo(41, 1, { y: 3 })], rocks: [plat(31, 2), plat(41, 3)], parts: pyramid(22, 2) }))
  // 31 river, palms, pyramid
  out.push(make(c, 3, { width: 52, ammo: [E, L, K, K, K, K], silos: [silo(42, 3)], rocks: [palm(30, 6)], parts: pyramid(35, 3), water: [nile(16, 27)] }))
  // 32 clay tower with sheaves, wind
  {
    const t = tower(28, 0, 3, 3, 'clay')
    out.push(make(c, 4, { width: 50, wind: -0.8, ammo: [H, K, K, K, K, K], silos: [silo(35, 2), silo(42, 1)], parts: [...t.parts, sheaf(27, t.top), sheaf(29, t.top)] }))
  }
  // 33 seesaw, sheaves, a pyramid
  {
    const s = seesaw(20, 'ws')
    out.push(make(c, 5, { width: 52, ammo: [K, K, K, F, K, K], silos: [silo(26.5, 1), silo(43, 2)], parts: [s.part, sheaf(22.6, 1.0), ...pyramid(33, 3)], rocks: [s.rock], joints: [s.joint] }))
  }
  // 34 three granaries and walls of stone
  out.push(make(c, 6, { width: 52, ammo: [K, K, E, K, K, K], silos: [silo(22, 1), silo(33, 1), silo(44, 2)], parts: [...wall(27, 0, 1, 3, 'stone'), ...wall(38, 0, 1, 3, 'stone')] }))
  // 35 a big pyramid with sheaves on top
  {
    const p = pyramid(33, 4)
    out.push(make(c, 7, { width: 52, ammo: [H, K, K, K, K, K], silos: [silo(41, 3)], parts: [...p, sheaf(33, 3.6), sheaf(34.3, 2.7)] }))
  }
  // 36 the great granary: river, palm, towers, two granaries
  {
    const t = tower(30, 0, 2)
    out.push(make(c, 8, { width: 54, wind: 1, ammo: [E, L, H, K, K, K], silos: [silo(38, 2), silo(46, 1)], parts: [...t.parts, sheaf(29, t.top), sheaf(31, t.top)], rocks: [palm(24, 6)], water: [nile(11, 20)] }))
  }
  return out
}

export const LEVELS: Level[] = [...chapter1(), ...chapter2(), ...chapter3(), ...chapter4()]
