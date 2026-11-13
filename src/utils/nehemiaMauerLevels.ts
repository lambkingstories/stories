/**
 * "Nehemias Mauer": the 60 levels in six chapters (a piece of wall, a tower, an arch, battlements, the city gate, the whole city).
 * A level is a template (a skyline of columns, with openings of gates under it, written as text) and the stones that are allowed.
 * The row of stones is made by a generator: it cuts the template into stones (a seeded random search) and puts them in an order in which each
 * stone lands on its place by itself when it is dropped from the sky. So every level can be solved, and a test plays the solution.
 */
import {
  ORIENTS,
  UNIQUE_ORIENTS,
  SLOT,
  checkMap,
  fits,
  landingY,
  mulberry32,
  newGame,
  skyFor,
  type Game,
  type GameDef,
  type QItem,
  type ShapeId
} from '@/utils/nehemiaMauerGame'

export interface Placement {
  shape: ShapeId
  rot: number
  x: number
  y: number
}

export interface LevelDef {
  /** 0..5 */
  chapter: number
  /** 0..9 inside the chapter */
  index: number
  /** Column heights, one character per column (0-9, a = 10, b = 11, c = 12). */
  heights: string
  /** Openings of gates at the foot: [first column, width, height]. */
  gates: [number, number, number][]
  pieces: ShapeId[]
  /** Shapes that must be in the row (a level that brings a shape). */
  must: ShapeId[]
  decoys: number
  seed: number
  gravity: number
  undo: number
  clay: number
  hold: boolean
  /** The seconds that the third star allows. */
  par: number
  /** The text rows of the template, with a free column at both sides. */
  map: string[]
  /** The word of a hint that comes with the first level of a thing (see the texts). */
  intro?: string
}

const T4: ShapeId[] = ['I4', 'O', 'T', 'L', 'J', 'S', 'Z']
const sky = (s: string) => s.replace(/\s/g, '').split('').map((ch) => (ch >= 'a' ? ch.charCodeAt(0) - 87 : Number(ch)))

/** The template as text rows (`#` = cell to build): a skyline of column heights with the openings of gates cut out of the foot. */
export function buildMap(heights: string, gates: [number, number, number][] = []): string[] {
  const h = sky(heights)
  const H = Math.max(...h)
  const rows: string[] = []
  for (let r = 0; r < H; r++) {
    let line = ''
    for (let c = 0; c < h.length; c++) {
      const fromBottom = H - r
      let on = fromBottom <= h[c]!
      for (const [gx, gw, gh] of gates) if (c >= gx && c < gx + gw && fromBottom <= gh) on = false
      line += on ? '#' : '.'
    }
    rows.push(line)
  }
  // a free column on both sides (and at least six columns, so that there is room to move)
  const width = h.length
  const side = Math.max(1, Math.ceil((6 - width) / 2))
  const pad = '.'.repeat(side)
  return rows.map((r) => pad + r + pad)
}

const PER_PIECE = [18, 17, 16, 15, 14, 13]
const GRAVITY = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

interface Row {
  h: string
  g?: [number, number, number][]
  p: ShapeId[] | string
  m?: ShapeId[] | string
  d?: number
  hold?: boolean
  intro?: string
}

const P = (s: string) => s.split(' ').filter(Boolean) as ShapeId[]

// Chapter 1: a piece of wall (mud bricks). Four-cell stones only, one new stone after the other.
// Chapter 2: the tower (limestone). Tall, narrow templates; three-cell stones help.
// Chapter 3: the arch (sandstone). A gate opening under a lintel; every stone, and a domino for the odd cells.
// Chapter 4: the battlements (baked bricks). Teeth along the top; rubble that does not belong into the wall.
// Chapter 5: the city gate (ashlar). Two towers with a gate; stones of five cells.
// Chapter 6: the whole city. Skylines with towers, a gate and Rahab's house at the wall.
const ROWS: Row[][] = [
  [
    { h: '3333', p: 'I4', m: 'I4', intro: 'move' },
    { h: '222222', p: 'O', m: 'O' },
    { h: '444444', p: 'I4 O', m: 'I4 O', intro: 'turn' },
    { h: '244442', p: 'I4 O T', m: 'T' },
    { h: '33333333', p: 'I4 O T L', m: 'L', hold: true, intro: 'hold' },
    { h: '23456', p: 'I4 O T L J', m: 'J' },
    { h: '44444444', p: 'I4 O T L J S Z', m: 'S Z' },
    { h: '345543', p: 'I4 O T L J S Z' },
    { h: '556655', p: 'I4 O T L J S Z' },
    { h: '46666 4', p: 'I4 O T L J S Z' }
  ],
  [
    { h: '666', p: 'I3 V3', m: 'I3 V3' },
    { h: '6666', p: 'I3 V3 I4 O', m: 'I4' },
    { h: '3377', p: 'I3 V3 I4 O T', m: 'T' },
    { h: '5775', p: 'I3 V3 I4 O T L J' },
    { h: '46864', p: 'I3 V3 I4 T L J S Z' },
    { h: '777', p: 'I3 V3 I4 O T L J' },
    { h: '88888', p: 'I3 V3 I4 T L J S Z' },
    { h: '3 5 9 9 9 5 3', p: 'I3 V3 I4 O T L J S Z' },
    { h: '8 9 9 8', p: 'I3 V3 I4 O T L J S Z' },
    { h: '6aaaa6', p: 'I3 V3 I4 O T L J S Z' }
  ],
  [
    { h: '555555', g: [[2, 2, 2]], p: 'I2 I4 O T L J', m: 'I2', intro: 'gate' },
    { h: '66666666', g: [[3, 2, 3]], p: 'I2 I4 O T L J S Z' },
    { h: '555555', g: [[2, 2, 3]], p: 'I2 V3 I4 O T L J S Z' },
    { h: '7777777', g: [[2, 3, 4]], p: 'I3 V3 I4 O T L J S Z' },
    { h: '66666666', g: [[2, 4, 3]], p: 'I2 I4 O T L J S Z' },
    { h: '4777774', g: [[2, 3, 4]], p: 'I2 V3 I4 O T L J S Z' },
    { h: '88888888', g: [[2, 4, 5]], p: 'I2 I4 O T L J S Z' },
    { h: '566665', g: [[2, 2, 4]], p: 'I2 V3 I4 O T L J S Z' },
    { h: '7777777777', g: [[3, 4, 4]], p: 'I2 I4 O T L J S Z' },
    { h: '77777777', g: [[0, 2, 3], [6, 2, 3]], p: 'I2 I4 O T L J S Z' }
  ],
  [
    { h: '444444', p: 'I4 O T L J S Z', d: 1, intro: 'rubble' },
    { h: '45454545', p: 'I4 O T L J S Z', d: 1 },
    { h: '5656565', p: 'I2 I4 O T L J S Z', d: 2 },
    { h: '466664', p: 'I4 O T L J S Z P', m: 'P', d: 2, intro: 'five' },
    { h: '445544', p: 'I4 O T L J S Z P', d: 2 },
    { h: '7575757', p: 'I2 I4 O T L J S Z P', d: 2 },
    { h: '66446644', p: 'I4 O T L J S Z P U', m: 'U', d: 2 },
    { h: '5757575', g: [[2, 2, 2]], p: 'I2 I4 O T L J S Z P U', d: 3 },
    { h: '8686868', p: 'I2 I4 O T L J S Z P U', d: 3 },
    { h: '66446644', g: [[3, 2, 2]], p: 'I2 I4 O T L J S Z P U', d: 3 }
  ],
  [
    { h: '77555577', g: [[3, 2, 3]], p: 'I2 I4 O T L J S Z P U', d: 2 },
    { h: '8855558 8', g: [[3, 2, 3]], p: 'I2 I4 O T L J S Z P U', d: 2 },
    { h: '9965569 9', g: [[3, 3, 3]], p: 'I4 O T L J S Z P U V5', m: 'V5', d: 2, intro: 'long' },
    { h: '88666688', g: [[3, 2, 4]], p: 'I4 O T L J S Z P U V5 T5', m: 'T5', d: 3 },
    { h: '9977779', g: [[2, 3, 4]], p: 'I2 I4 O T L J S Z P U V5 T5', d: 3 },
    { h: '899666698', g: [[3, 3, 4]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', m: 'I5', d: 3 },
    { h: 'a96666 69a', g: [[3, 4, 4]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 3 },
    { h: '88a77a88', g: [[3, 2, 4]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 4 },
    { h: '9aa66aa9', g: [[3, 2, 5]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 4 },
    { h: 'aa7777aa', g: [[3, 2, 5]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 4 }
  ],
  [
    { h: '4688643', p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 3 },
    { h: '35799753', g: [[3, 2, 2]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 3 },
    { h: '3 5 9 7 5 5 7 9 5 3', g: [[4, 2, 3]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 3, intro: 'city' },
    { h: '56a8658a65', g: [[4, 2, 2]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 3 },
    { h: '6aa6 6aa6', g: [[3, 2, 3]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 4 },
    { h: '6 8 a a 8 8 a a 8 6', g: [[4, 2, 3]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 4 },
    { h: '7 9 b 9 7 7 9 b 9 7', g: [[4, 2, 4]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 4 },
    { h: '5 8 b 8 6 6 8 b 8 5', g: [[4, 2, 4]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 4 },
    { h: '6 9 b b 9 9 b b 9 6', g: [[4, 2, 4]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 5 },
    { h: '6 8 b b 8 8 b b 8 6', g: [[4, 2, 5]], p: 'I2 I4 O T L J S Z P U V5 T5 I5', d: 5 }
  ]
]

const toShapes = (v: ShapeId[] | string | undefined): ShapeId[] => (typeof v === 'string' ? P(v) : (v ?? []))

export const LEVELS: LevelDef[] = ROWS.flatMap((rows, chapter) =>
  rows.map((r, index): LevelDef => {
    const map = buildMap(r.h, r.g ?? [])
    const pieces = toShapes(r.p)
    const cells = map.join('').split('#').length - 1
    const avg = pieces.reduce((n, s) => n + ORIENTS[s][0]!.cells.length, 0) / Math.max(1, pieces.length)
    const approx = Math.max(2, Math.round(cells / Math.min(avg, 4.2)))
    return {
      chapter,
      index,
      heights: r.h,
      gates: r.g ?? [],
      pieces,
      must: toShapes(r.m),
      decoys: r.d ?? 0,
      seed: 9100 + chapter * 100 + index * 7,
      gravity: GRAVITY[chapter]!,
      undo: chapter < 3 ? 2 : 3,
      clay: chapter < 1 ? 0 : chapter < 3 ? 1 : 2,
      hold: r.hold ?? (chapter > 0 || index >= 4),
      par: Math.round(approx * PER_PIECE[chapter]!),
      map,
      intro: r.intro
    }
  })
)

export const CHAPTER_COUNT = 6
export const LEVELS_PER_CHAPTER = 10

// ── the generator ───────────────────────────────────────────────────────────────────────────────────────────────────────────

function weightedPick<T extends { w: number }>(items: T[], rng: () => number): number {
  let total = 0
  for (const i of items) total += i.w
  let r = rng() * total
  for (let k = 0; k < items.length; k++) {
    r -= items[k]!.w
    if (r <= 0) return k
  }
  return items.length - 1
}

/** Cuts the template into stones (a seeded random search over the cells in reading order). */
function tileTemplate(g: Game, pieces: ShapeId[], must: ShapeId[], rng: () => number, maxNodes: number): Placement[] | null {
  const cols = g.cols
  const rows = g.rows
  const cell = new Uint8Array(cols * rows)
  const open: number[] = []
  for (let i = 0; i < cell.length; i++) {
    if (g.kind[i] === SLOT) {
      cell[i] = 1
      open.push(i)
    }
  }
  const out: Placement[] = []
  let nodes = 0
  const rec = (start: number): boolean => {
    let p = start
    while (p < open.length && cell[open[p]!] === 0) p++
    if (p >= open.length) return must.every((m) => out.some((o) => o.shape === m))
    if (++nodes > maxNodes) return false
    const idx = open[p]!
    const ax = idx % cols
    const ay = (idx - ax) / cols
    const opts: { shape: ShapeId; rot: number; ox: number; oy: number; cells: [number, number][]; w: number }[] = []
    for (const s of pieces) {
      for (const o of UNIQUE_ORIENTS[s]) {
        const ox = ax - o.anchor[0]
        const oy = ay - o.anchor[1]
        let ok = true
        for (const [cx, cy] of o.cells) {
          const x = ox + cx
          const y = oy + cy
          if (x < 0 || x >= cols || y < 0 || y >= rows || cell[y * cols + x] !== 1) {
            ok = false
            break
          }
        }
        if (ok) opts.push({ shape: s, rot: o.rot, ox, oy, cells: o.cells, w: must.includes(s) ? 2.2 : 1 })
      }
    }
    while (opts.length) {
      const k = weightedPick(opts, rng)
      const o = opts.splice(k, 1)[0]!
      for (const [cx, cy] of o.cells) cell[(o.oy + cy) * cols + o.ox + cx] = 0
      out.push({ shape: o.shape, rot: o.rot, x: o.ox, y: o.oy })
      if (rec(p + 1)) return true
      out.pop()
      for (const [cx, cy] of o.cells) cell[(o.oy + cy) * cols + o.ox + cx] = 1
      if (nodes > maxNodes) return false
    }
    return false
  }
  return rec(0) ? out : null
}

/** Puts the stones in an order in which each one lands on its place when it is dropped from the sky (mostly from the bottom up). */
function orderPlacements(g: Game, ps: Placement[], rng: () => number): Placement[] | null {
  g.fill.fill(0)
  const left = [...ps]
  const out: Placement[] = []
  while (left.length) {
    const cands = left.filter((p) => landingY(g, p.shape, p.rot, p.x) === p.y)
    if (!cands.length) return null
    let pick: Placement
    if (rng() < 0.78) {
      const bottom = (p: Placement) => p.y + Math.max(...ORIENTS[p.shape][p.rot]!.cells.map((c) => c[1]))
      const best = Math.max(...cands.map(bottom))
      const top = cands.filter((p) => bottom(p) === best)
      pick = top[Math.floor(rng() * top.length)]!
    } else pick = cands[Math.floor(rng() * cands.length)]!
    left.splice(left.indexOf(pick), 1)
    out.push(pick)
    for (const [cx, cy] of ORIENTS[pick.shape][pick.rot]!.cells) g.fill[(pick.y + cy) * g.cols + pick.x + cx] = 1
  }
  g.fill.fill(0)
  return out
}

export interface Generated {
  queue: QItem[]
  solution: Placement[]
  /** How many tries the generator needed (for the tests). */
  tries: number
}

/** The rows of sky of a level: as high as the longest stone that is allowed (the same for the generator and the game). */
export const levelSky = (def: LevelDef): number => skyFor(def.pieces.map((shape) => ({ shape, decoy: false })))

export function generate(def: LevelDef): Generated {
  const base = newGame({ map: def.map, queue: def.pieces.map((shape) => ({ shape, decoy: false })), sky: levelSky(def), gravity: 0, undo: 0, clay: 0, hold: false, par: 1 })
  for (let tries = 1; tries <= 80; tries++) {
    const rng = mulberry32(def.seed + tries * 7919)
    const tiling = tileTemplate(base, def.pieces, def.must, rng, 40000)
    if (!tiling) continue
    const order = orderPlacements(base, tiling, rng)
    if (!order) continue
    const queue: QItem[] = order.map((p) => ({ shape: p.shape, decoy: false }))
    const drng = mulberry32(def.seed * 31 + 7)
    for (let d = 0; d < def.decoys; d++) {
      const shape = def.pieces[Math.floor(drng() * def.pieces.length)]!
      // never first, never behind the last stone
      const at = 1 + Math.floor(drng() * Math.max(1, queue.length - 1))
      queue.splice(Math.min(at, queue.length), 0, { shape, decoy: true })
    }
    return { queue, solution: order, tries }
  }
  throw new Error(`no stones found for level ${def.chapter}-${def.index}`)
}

const cache = new Map<number, Generated>()

export function levelStones(i: number): Generated {
  let g = cache.get(i)
  if (!g) {
    g = generate(LEVELS[i]!)
    cache.set(i, g)
  }
  return g
}

/** A new game of a level (the pieces are made once and kept). */
export function levelGame(i: number): Game {
  const L = LEVELS[i]!
  const { queue } = levelStones(i)
  const def: GameDef = { map: L.map, queue, sky: levelSky(L), gravity: L.gravity, undo: L.undo, clay: L.clay, hold: L.hold, par: L.par }
  return newGame(def)
}

/** The problems of the level table (for the tests). */
export function levelProblems(): string[] {
  const out: string[] = []
  LEVELS.forEach((L, i) => {
    for (const e of checkMap(L.map)) out.push(`level ${i}: ${e}`)
    if (!L.pieces.length) out.push(`level ${i}: no stones`)
  })
  return out
}

export { fits }
