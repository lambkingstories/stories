/**
 * "Arche der Tierpaare": the rules of the match-3 game, without any drawing (so they can be tested and played by a bot).
 *
 * A field of animals. The child swaps two animals that lie next to each other; three or more of one kind in a row go on board the ark.
 * New animals fall in from above (the "random" is a seeded generator, so a round can be played again exactly). Four in a row make a dove
 * (sweeps a row or a column), an L, T or cross makes an olive branch (sweeps an area), five in a row make a rainbow (sweeps all
 * animals of one kind). Special stones can be swapped with each other for a bigger effect.
 * Obstacles: water fields (open when something next to them is cleared; in the later chapters the water rises), wooden crates
 * (two hits), stones (fixed, only the hammer removes them), nets (hold an animal, cut by a match), cages (an animal that is freed by a match),
 * feed baskets (they fall down and are collected at the bottom).
 * A level has goals and a limited number of moves (no timer). Nothing is lost for good: the child just tries again.
 *
 * The game never draws and never reads the clock: `trySwap` plays a whole move at once and tells what happened step by step
 * (`Step`), the screen replays those steps with its own animations.
 */

// ── the board ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const VOID = 0
export const FLOOR = 1
export const STONE = 2
export const WATER = 3
export const CRATE = 4
export type CellType = 0 | 1 | 2 | 3 | 4

export const NONE = 0
export const DOVE_H = 1
export const DOVE_V = 2
export const OLIVE = 3
export const RAINBOW = 4
export type Special = 0 | 1 | 2 | 3 | 4

/** The animals (the picture of each lies in `images/spiele-gross/arche/tier-<name>.webp`). */
export const KIND_NAMES = ['elefant', 'giraffe', 'loewe', 'schaf', 'esel', 'zebra', 'frosch'] as const
export const KIND_COUNT = KIND_NAMES.length
/** The kinds above 6 are no animals: the feed basket falls down to be collected; the rainbow stone matches nothing. */
export const BASKET = 7
export const RAINBOW_KIND = 8

export interface Tile {
  id: number
  kind: number
  special: Special
  /** A caged animal cannot be swapped, but a match frees it. */
  cage: boolean
  /** A netted animal is held fast: no swap, it does not fall; a match cuts the net (the animal stays). */
  net: boolean
}

export type GoalType = 'kind' | 'dove' | 'olive' | 'rainbow' | 'water' | 'crate' | 'net' | 'cage' | 'basket' | 'score'
export interface Goal {
  t: GoalType
  /** How many (not used for the goals that mean "all of them": water, crate, net, cage). */
  n: number
  kind?: number
}

export interface Level {
  /** The number of the level, from 1. */
  id: number
  /** The chapter, from 0. */
  chapter: number
  moves: number
  /** One string per row, `.` nothing, `#` floor, `S` stone, `W` water, `K` crate, `N` netted animal, `C` caged animal, `B` floor with a basket. */
  map: string[]
  /** The animals of the level (indices into `KIND_NAMES`). */
  kinds: number[]
  goals: Goal[]
  seed: number
  /** A basket comes in from the top after this many moves (up to `dropTotal` in all, the ones on the map included). */
  dropEvery?: number
  dropTotal?: number
  /** Every this many moves the water rises by one field, if no water was cleared in that move. */
  rise?: number
}

export interface Step {
  /** 1 for the first clearing of a move, 2 for the chain reaction after it, and so on. */
  cascade: number
  clears: { idx: number; id: number; kind: number; special: Special; cage: boolean }[]
  made: { idx: number; id: number; special: Special; kind: number }[]
  effects: { type: EffectType; idx: number; kind: number; cells: number[] }[]
  hits: { idx: number; what: 'crate' | 'water' | 'net' | 'stone'; gone: boolean }[]
  /** The animals that move: `fr`/`fc` may lie above the board (new ones). */
  falls: { id: number; kind: number; special: Special; cage: boolean; fr: number; fc: number; tr: number; tc: number; spawned: boolean }[]
  collects: { idx: number; id: number }[]
  points: number
  /** The state after this step (for the counters on the screen). */
  progress: number[]
  score: number
}

export type EffectType = 'doveH' | 'doveV' | 'olive' | 'rainbow' | 'cross' | 'bigcross' | 'bigolive' | 'all' | 'hammer'

export interface ShuffleMove {
  id: number
  from: number
  to: number
}

export interface Turn {
  ok: boolean
  /** The two cells that were swapped (the screen plays the swap first, also for a move that is turned back). */
  swap?: { a: number; b: number }
  steps: Step[]
  /** The animals that were put in a new order because no move was left. */
  shuffled?: ShuffleMove[]
  /** Water fields that appeared (the water rose). */
  flood: { idx: number; id: number }[]
  phase: 'play' | 'won' | 'lost'
}

export interface Game {
  level: Level
  cols: number
  rows: number
  type: Uint8Array
  hp: Uint8Array
  tiles: (Tile | null)[]
  rng: number
  nextId: number
  /** The moves that are left. */
  moves: number
  movesMade: number
  score: number
  /** Per goal: how many were done (the goals that mean "all" are counted from the board, see `goalLeft`). */
  progress: number[]
  /** Per goal: how many there were at the start (for the goals that mean "all"). */
  initial: number[]
  phase: 'play' | 'won' | 'lost'
  basketsSeen: number
  /** The baskets that stand on the map at the start. */
  basketsPre: number
  /** The moves that were left when the last goal was reached (the stars come from it). */
  movesAtWin: number
  floodCount: number
}

// ── the generator of random numbers ─────────────────────────────────────────────────────────────────────────────────────────
/** mulberry32: the same start value gives the same game. */
export function rnd(g: { rng: number }): number {
  g.rng = (g.rng + 0x6d2b79f5) >>> 0
  let t = g.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ── small helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────
export const rowOf = (g: { cols: number }, idx: number) => Math.floor(idx / g.cols)
export const colOf = (g: { cols: number }, idx: number) => idx % g.cols
export const cellAt = (g: { cols: number }, r: number, c: number) => r * g.cols + c

function newTile(g: Game, kind: number, special: Special = NONE): Tile {
  return { id: g.nextId++, kind, special, cage: false, net: false }
}

/** The kind (0 to 6) that a tile counts as in a row; -1 for a tile that matches nothing, and for an empty cell. */
function matchKind(g: Game, idx: number): number {
  const t = g.tiles[idx]
  return t && t.kind < BASKET ? t.kind : -1
}

export function isMovable(t: Tile | null | undefined): t is Tile {
  return !!t && !t.net
}

/** A goal that is counted from the board and means "all of them". */
const STATE_GOALS: GoalType[] = ['water', 'crate', 'net', 'cage']

function countState(g: Game, t: GoalType): number {
  let n = 0
  for (let i = 0; i < g.type.length; i++) {
    if (t === 'water' && g.type[i] === WATER) n++
    else if (t === 'crate' && g.type[i] === CRATE) n++
    else if (t === 'net' && g.tiles[i]?.net) n++
    else if (t === 'cage' && g.tiles[i]?.cage) n++
  }
  return n
}

// ── building a game ─────────────────────────────────────────────────────────────────────────────────────────────────────────
export function newGame(level: Level, seed: number = level.seed): Game {
  const rows = level.map.length
  const cols = level.map[0]!.length
  const g: Game = {
    level,
    cols,
    rows,
    type: new Uint8Array(rows * cols),
    hp: new Uint8Array(rows * cols),
    tiles: new Array<Tile | null>(rows * cols).fill(null),
    rng: seed >>> 0,
    nextId: 1,
    moves: level.moves,
    movesMade: 0,
    score: 0,
    progress: level.goals.map(() => 0),
    initial: level.goals.map(() => 0),
    phase: 'play',
    basketsSeen: 0,
    basketsPre: 0,
    movesAtWin: 0,
    floodCount: 0
  }
  const marks: { idx: number; ch: string }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const ch = level.map[r]!.charAt(c)
      if (ch === '.') g.type[idx] = VOID
      else if (ch === 'S') g.type[idx] = STONE
      else if (ch === 'W') g.type[idx] = WATER
      else if (ch === 'K') {
        g.type[idx] = CRATE
        g.hp[idx] = 2
      } else {
        g.type[idx] = FLOOR
        if (ch === 'N' || ch === 'C' || ch === 'B') marks.push({ idx, ch })
      }
    }
  }
  fillBoard(g)
  for (const m of marks) {
    const t = g.tiles[m.idx]!
    if (m.ch === 'N') t.net = true
    else if (m.ch === 'C') t.cage = true
    else {
      t.kind = BASKET
      g.basketsSeen++
      g.basketsPre++
    }
  }
  level.goals.forEach((goal, i) => {
    if (STATE_GOALS.includes(goal.t)) g.initial[i] = countState(g, goal.t)
  })
  if (!hasMove(g)) shuffleBoard(g)
  return g
}

/** Fills every empty floor cell with an animal, in a way that no three in a row appear; tries again until at least one move exists. */
function fillBoard(g: Game): void {
  for (let attempt = 0; attempt < 200; attempt++) {
    for (let i = 0; i < g.tiles.length; i++) g.tiles[i] = null
    for (let r = 0; r < g.rows; r++) {
      for (let c = 0; c < g.cols; c++) {
        const idx = r * g.cols + c
        if (g.type[idx] !== FLOOR) continue
        const ok = g.level.kinds.filter((k) => {
          if (c >= 2 && matchKind(g, idx - 1) === k && matchKind(g, idx - 2) === k) return false
          if (r >= 2 && matchKind(g, idx - g.cols) === k && matchKind(g, idx - 2 * g.cols) === k) return false
          return true
        })
        const pool = ok.length ? ok : g.level.kinds
        g.tiles[idx] = newTile(g, pool[Math.floor(rnd(g) * pool.length)]!)
      }
    }
    if (hasMove(g)) return
  }
}

// ── finding rows ────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface Run {
  /** 0: along a row, 1: along a column. */
  dir: 0 | 1
  cells: number[]
  kind: number
}
export interface MatchGroup {
  kind: number
  cells: number[]
  runs: Run[]
}

/** Every run of three or more of one kind, and the runs that cross are joined to one group (an L, a T, a cross). */
export function findMatchGroups(g: Game): MatchGroup[] {
  const runs: Run[] = []
  for (let r = 0; r < g.rows; r++) {
    let c = 0
    while (c < g.cols) {
      const k = matchKind(g, r * g.cols + c)
      let e = c + 1
      if (k >= 0) while (e < g.cols && matchKind(g, r * g.cols + e) === k) e++
      if (k >= 0 && e - c >= 3) {
        const cells: number[] = []
        for (let x = c; x < e; x++) cells.push(r * g.cols + x)
        runs.push({ dir: 0, cells, kind: k })
      }
      c = Math.max(e, c + 1)
    }
  }
  for (let c = 0; c < g.cols; c++) {
    let r = 0
    while (r < g.rows) {
      const k = matchKind(g, r * g.cols + c)
      let e = r + 1
      if (k >= 0) while (e < g.rows && matchKind(g, e * g.cols + c) === k) e++
      if (k >= 0 && e - r >= 3) {
        const cells: number[] = []
        for (let y = r; y < e; y++) cells.push(y * g.cols + c)
        runs.push({ dir: 1, cells, kind: k })
      }
      r = Math.max(e, r + 1)
    }
  }
  if (!runs.length) return []
  // join the runs that share a cell
  const parent = runs.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)))
  const owner = new Map<number, number>()
  runs.forEach((run, i) => {
    for (const cell of run.cells) {
      const o = owner.get(cell)
      if (o === undefined) owner.set(cell, i)
      else parent[find(i)] = find(o)
    }
  })
  const byRoot = new Map<number, MatchGroup>()
  runs.forEach((run, i) => {
    const root = find(i)
    let grp = byRoot.get(root)
    if (!grp) {
      grp = { kind: run.kind, cells: [], runs: [] }
      byRoot.set(root, grp)
    }
    grp.runs.push(run)
    for (const cell of run.cells) if (!grp.cells.includes(cell)) grp.cells.push(cell)
  })
  const groups = [...byRoot.values()]
  groups.sort((a, b) => Math.min(...a.cells) - Math.min(...b.cells))
  return groups
}

/** Which special stone a group makes, and in which cell (null: none). `prefer` are the cells the child swapped. */
export function planSpecial(g: Game, grp: MatchGroup, prefer: number[]): { idx: number; special: Special } | null {
  let longest = grp.runs[0]!
  for (const r of grp.runs) if (r.cells.length > longest.cells.length) longest = r
  const hasH = grp.runs.some((r) => r.dir === 0)
  const hasV = grp.runs.some((r) => r.dir === 1)
  let special: Special
  let candidates: number[] = []
  if (longest.cells.length >= 5) {
    special = RAINBOW
    candidates = [...prefer.filter((p) => longest.cells.includes(p)), longest.cells[Math.floor(longest.cells.length / 2)]!, ...longest.cells]
  } else if (hasH && hasV) {
    special = OLIVE
    const crossing: number[] = []
    for (const h of grp.runs.filter((r) => r.dir === 0)) for (const cell of h.cells) if (grp.runs.some((v) => v.dir === 1 && v.cells.includes(cell))) crossing.push(cell)
    candidates = [...prefer.filter((p) => crossing.includes(p)), ...crossing, ...grp.cells]
  } else if (longest.cells.length === 4) {
    // a row of four makes a dove that flies along the column, and the other way round
    special = longest.dir === 0 ? DOVE_V : DOVE_H
    candidates = [...prefer.filter((p) => longest.cells.includes(p)), longest.cells[1]!, ...longest.cells]
  } else return null
  for (const idx of candidates) {
    const t = g.tiles[idx]
    if (t && t.special === NONE && !t.cage && !t.net) return { idx, special }
  }
  return null
}

// ── clearing ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function emptyStep(g: Game, cascade: number): Step {
  return { cascade, clears: [], made: [], effects: [], hits: [], falls: [], collects: [], points: 0, progress: [...g.progress], score: g.score }
}

function goalIndex(g: Game, t: GoalType, kind?: number): number[] {
  const out: number[] = []
  g.level.goals.forEach((goal, i) => {
    if (goal.t === t && (t !== 'kind' || goal.kind === kind)) out.push(i)
  })
  return out
}

function count(g: Game, t: GoalType, by = 1, kind?: number): void {
  for (const i of goalIndex(g, t, kind)) g.progress[i] = (g.progress[i] ?? 0) + by
}

/** The kind of animal that is on the board most often (ties: the lower one), for the rainbow. */
function commonKind(g: Game, except = -1): number {
  const n = new Array<number>(KIND_COUNT).fill(0)
  for (let i = 0; i < g.tiles.length; i++) {
    const t = g.tiles[i]
    if (t && t.kind < BASKET && i !== except) n[t.kind] = (n[t.kind] ?? 0) + 1
  }
  let best = 0
  for (let k = 1; k < KIND_COUNT; k++) if (n[k]! > n[best]!) best = k
  return best
}

function cellsOfKind(g: Game, kind: number): number[] {
  const out: number[] = []
  for (let i = 0; i < g.tiles.length; i++) if (g.tiles[i]?.kind === kind) out.push(i)
  return out
}

function rowCells(g: Game, r: number): number[] {
  const out: number[] = []
  for (let c = 0; c < g.cols; c++) out.push(r * g.cols + c)
  return out
}
function colCells(g: Game, c: number): number[] {
  const out: number[] = []
  for (let r = 0; r < g.rows; r++) out.push(r * g.cols + c)
  return out
}
/** The cells within `radius` steps (a diamond, or a square when `square`). */
function areaCells(g: Game, idx: number, radius: number, square = false): number[] {
  const r0 = rowOf(g, idx)
  const c0 = colOf(g, idx)
  const out: number[] = []
  for (let r = Math.max(0, r0 - radius); r <= Math.min(g.rows - 1, r0 + radius); r++) {
    for (let c = Math.max(0, c0 - radius); c <= Math.min(g.cols - 1, c0 + radius); c++) {
      if (square || Math.abs(r - r0) + Math.abs(c - c0) <= radius) out.push(r * g.cols + c)
    }
  }
  return out
}

function activation(g: Game, idx: number, t: Tile): { type: EffectType; cells: number[]; kind: number } {
  if (t.special === DOVE_H) return { type: 'doveH', cells: rowCells(g, rowOf(g, idx)), kind: t.kind }
  if (t.special === DOVE_V) return { type: 'doveV', cells: colCells(g, colOf(g, idx)), kind: t.kind }
  if (t.special === OLIVE) return { type: 'olive', cells: areaCells(g, idx, 2), kind: t.kind }
  const k = commonKind(g, idx)
  return { type: 'rainbow', cells: cellsOfKind(g, k), kind: k }
}

function hitWater(g: Game, idx: number, step: Step): void {
  g.type[idx] = FLOOR
  step.hits.push({ idx, what: 'water', gone: true })
  step.points += 15
}
function hitCrate(g: Game, idx: number, step: Step): void {
  g.hp[idx] = Math.max(0, (g.hp[idx] ?? 1) - 1)
  const gone = g.hp[idx] === 0
  if (gone) g.type[idx] = FLOOR
  step.hits.push({ idx, what: 'crate', gone })
  step.points += gone ? 25 : 8
}

/**
 * Clears the cells of `queue` (and, from them, what the special stones among them sweep). Animals that are cleared count for the goals and
 * hit the crates and the water fields next to them (once each). `force` is the hammer: it also takes nets, cages and stones.
 */
function clearCells(g: Game, queue: number[], step: Step, force = false): void {
  const adj: number[] = []
  const direct = new Set<number>()
  const seen = new Set<number>()
  for (let qi = 0; qi < queue.length; qi++) {
    const idx = queue[qi]!
    if (seen.has(idx)) continue
    seen.add(idx)
    const ty = g.type[idx]
    if (ty === VOID) continue
    if (ty === STONE) {
      if (force) {
        g.type[idx] = FLOOR
        step.hits.push({ idx, what: 'stone', gone: true })
        direct.add(idx)
      }
      continue
    }
    if (ty === WATER) {
      hitWater(g, idx, step)
      direct.add(idx)
      continue
    }
    if (ty === CRATE) {
      if (force) g.hp[idx] = 1
      hitCrate(g, idx, step)
      direct.add(idx)
      continue
    }
    const t = g.tiles[idx]
    if (!t || t.kind === BASKET) continue
    if (t.net) {
      t.net = false
      step.hits.push({ idx, what: 'net', gone: true })
      step.points += 10
      count(g, 'net')
      if (!force) continue
    }
    g.tiles[idx] = null
    step.clears.push({ idx, id: t.id, kind: t.kind, special: t.special, cage: t.cage })
    step.points += 20
    if (t.kind < BASKET) count(g, 'kind', 1, t.kind)
    if (t.cage) {
      count(g, 'cage')
      step.points += 30
    }
    for (const n of neighbours(g, idx)) adj.push(n)
    if (t.special !== NONE) {
      const a = activation(g, idx, t)
      step.effects.push({ type: a.type, idx, kind: a.kind, cells: a.cells })
      step.points += 40
      for (const cell of a.cells) queue.push(cell)
    }
  }
  for (const idx of adj) {
    if (direct.has(idx)) continue
    if (g.type[idx] === WATER) {
      hitWater(g, idx, step)
      direct.add(idx)
    } else if (g.type[idx] === CRATE) {
      hitCrate(g, idx, step)
      direct.add(idx)
    }
  }
}

export function neighbours(g: { cols: number; rows: number }, idx: number): number[] {
  const r = Math.floor(idx / g.cols)
  const c = idx % g.cols
  const out: number[] = []
  if (r > 0) out.push(idx - g.cols)
  if (c > 0) out.push(idx - 1)
  if (c < g.cols - 1) out.push(idx + 1)
  if (r < g.rows - 1) out.push(idx + g.cols)
  return out
}

// ── gravity and new animals ─────────────────────────────────────────────────────────────────────────────────────────────────
/** An empty floor cell at the top edge (or under a hole of the map) gets new animals from above. */
function isSource(g: Game, idx: number): boolean {
  const r = rowOf(g, idx)
  return r === 0 || g.type[idx - g.cols] === VOID
}

/** The cell an animal comes from to fill the empty cell `idx`: straight from above, or, when above is blocked, diagonally; -1 if none. */
function sourceFor(g: Game, idx: number): number {
  const r = rowOf(g, idx)
  if (r === 0) return -1
  const c = colOf(g, idx)
  const up = idx - g.cols
  const ut = g.type[up]
  if (ut === FLOOR) {
    const t = g.tiles[up]
    if (t && !t.net) return up
    if (!t) return -1
    // a netted animal above: it blocks like a stone
  } else if (ut === VOID) return -1
  // blocked above: slide in from the side (the side that comes first alternates, so that nothing leans to one side)
  const sides = (r + c) % 2 === 0 ? [-1, 1] : [1, -1]
  for (const d of sides) {
    const cc = c + d
    if (cc < 0 || cc >= g.cols) continue
    const from = up + d
    if (g.type[from] !== FLOOR) continue
    const t = g.tiles[from]
    if (!t || t.net) continue
    // an animal that can fall straight down does that instead
    const below = idx + d
    if (g.type[below] === FLOOR && !g.tiles[below]) continue
    return from
  }
  return -1
}

function basketDue(g: Game): boolean {
  const total = g.level.dropTotal ?? 0
  if (!total || !g.level.dropEvery) return false
  const allowed = Math.min(total, g.basketsPre + Math.ceil(g.movesMade / g.level.dropEvery))
  return g.basketsSeen < allowed
}

function isExit(g: Game, idx: number): boolean {
  return rowOf(g, idx) === g.rows - 1 || g.type[idx + g.cols] === VOID
}

/** Lets everything fall, brings in new animals and collects baskets, until nothing moves any more. */
function settle(g: Game, step: Step): void {
  const byId = new Map<number, Step['falls'][number]>()
  const pile = new Array<number>(g.cols).fill(0)
  const move = (from: number, to: number) => {
    const t = g.tiles[from]!
    g.tiles[to] = t
    g.tiles[from] = null
    const e = byId.get(t.id)
    if (e) {
      e.tr = rowOf(g, to)
      e.tc = colOf(g, to)
    } else {
      const f = { id: t.id, kind: t.kind, special: t.special, cage: t.cage, fr: rowOf(g, from), fc: colOf(g, from), tr: rowOf(g, to), tc: colOf(g, to), spawned: false }
      byId.set(t.id, f)
      step.falls.push(f)
    }
  }
  for (let guard = 0; guard < 400; guard++) {
    let changed = false
    let again = true
    while (again) {
      again = false
      for (let r = g.rows - 1; r >= 0; r--) {
        for (let c = 0; c < g.cols; c++) {
          const idx = r * g.cols + c
          if (g.type[idx] !== FLOOR || g.tiles[idx]) continue
          const src = sourceFor(g, idx)
          if (src >= 0) {
            move(src, idx)
            again = true
            changed = true
          }
        }
      }
    }
    // baskets at the bottom are collected
    for (let idx = 0; idx < g.tiles.length; idx++) {
      const t = g.tiles[idx]
      if (t && t.kind === BASKET && g.type[idx] === FLOOR && isExit(g, idx)) {
        g.tiles[idx] = null
        step.collects.push({ idx, id: t.id })
        step.points += 50
        count(g, 'basket')
        changed = true
      }
    }
    if (changed) continue
    // new animals from above
    const open: number[] = []
    for (let idx = 0; idx < g.tiles.length; idx++) if (g.type[idx] === FLOOR && !g.tiles[idx] && isSource(g, idx)) open.push(idx)
    if (!open.length) break
    const basketAt = basketDue(g) ? open[Math.floor(rnd(g) * open.length)]! : -1
    for (const idx of open) {
      const c = colOf(g, idx)
      const isBasket = idx === basketAt
      if (isBasket) g.basketsSeen++
      const t = newTile(g, isBasket ? BASKET : g.level.kinds[Math.floor(rnd(g) * g.level.kinds.length)]!)
      g.tiles[idx] = t
      const f = { id: t.id, kind: t.kind, special: t.special, cage: false, fr: rowOf(g, idx) - 1 - pile[c]!, fc: c, tr: rowOf(g, idx), tc: c, spawned: true }
      pile[c] = pile[c]! + 1
      byId.set(t.id, f)
      step.falls.push(f)
    }
  }
}

// ── moves ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export function canSwap(g: Game, a: number, b: number): boolean {
  if (g.phase !== 'play') return false
  if (a < 0 || b < 0 || a >= g.tiles.length || b >= g.tiles.length || a === b) return false
  const d = Math.abs(a - b)
  if (!(d === g.cols || (d === 1 && rowOf(g, a) === rowOf(g, b)))) return false
  const ta = g.tiles[a]
  const tb = g.tiles[b]
  if (!ta || !tb || g.type[a] !== FLOOR || g.type[b] !== FLOOR) return false
  return !ta.net && !tb.net && !ta.cage && !tb.cage
}

type Combo = 'none' | 'rainbowAll' | 'rainbowKind' | 'rainbowSpecial' | 'cross' | 'bigcross' | 'bigolive'

function comboOf(ta: Tile, tb: Tile): Combo {
  if (ta.kind === BASKET || tb.kind === BASKET) return 'none'
  const sa = ta.special
  const sb = tb.special
  if (sa === RAINBOW && sb === RAINBOW) return 'rainbowAll'
  if (sa === RAINBOW || sb === RAINBOW) return sa !== NONE && sb !== NONE ? 'rainbowSpecial' : 'rainbowKind'
  if (sa === NONE || sb === NONE) return 'none'
  const dove = (s: Special) => s === DOVE_H || s === DOVE_V
  if (dove(sa) && dove(sb)) return 'cross'
  if (sa === OLIVE && sb === OLIVE) return 'bigolive'
  return 'bigcross'
}

function swapTiles(g: Game, a: number, b: number): void {
  const t = g.tiles[a] ?? null
  g.tiles[a] = g.tiles[b] ?? null
  g.tiles[b] = t
}

/** Does the animal in `idx` stand in a row of three or more? */
function inRow(g: Game, idx: number): boolean {
  const k = matchKind(g, idx)
  if (k < 0) return false
  const r = rowOf(g, idx)
  const c = colOf(g, idx)
  let h = 1
  for (let x = c - 1; x >= 0 && matchKind(g, r * g.cols + x) === k; x--) h++
  for (let x = c + 1; x < g.cols && matchKind(g, r * g.cols + x) === k; x++) h++
  if (h >= 3) return true
  let v = 1
  for (let y = r - 1; y >= 0 && matchKind(g, y * g.cols + c) === k; y--) v++
  for (let y = r + 1; y < g.rows && matchKind(g, y * g.cols + c) === k; y++) v++
  return v >= 3
}

/** Would swapping the two cells be a move (a row of three, or two special stones)? Changes nothing. */
export function isValidSwap(g: Game, a: number, b: number): boolean {
  if (!canSwap(g, a, b)) return false
  if (comboOf(g.tiles[a]!, g.tiles[b]!) !== 'none') return true
  swapTiles(g, a, b)
  const ok = inRow(g, a) || inRow(g, b)
  swapTiles(g, a, b)
  return ok
}

/** Every move that can be made, as pairs of cells (the first is the cell to the left or above). */
export function findMoves(g: Game): { a: number; b: number }[] {
  const out: { a: number; b: number }[] = []
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const a = r * g.cols + c
      if (c + 1 < g.cols && isValidSwap(g, a, a + 1)) out.push({ a, b: a + 1 })
      if (r + 1 < g.rows && isValidSwap(g, a, a + g.cols)) out.push({ a, b: a + g.cols })
    }
  }
  return out
}

export function hasMove(g: Game): boolean {
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const a = r * g.cols + c
      if (c + 1 < g.cols && isValidSwap(g, a, a + 1)) return true
      if (r + 1 < g.rows && isValidSwap(g, a, a + g.cols)) return true
    }
  }
  return false
}

/** The move to show as a hint: a combination of special stones first, then the one that makes a special stone or clears the most. */
export function hint(g: Game): { a: number; b: number } | null {
  let best: { a: number; b: number } | null = null
  let bestScore = -1
  for (const m of findMoves(g)) {
    const ta = g.tiles[m.a]!
    const tb = g.tiles[m.b]!
    let score = 0
    if (comboOf(ta, tb) !== 'none') score = 200
    else {
      swapTiles(g, m.a, m.b)
      for (const grp of findMatchGroups(g)) score += grp.cells.length + (planSpecial(g, grp, [m.a, m.b]) ? 20 : 0)
      swapTiles(g, m.a, m.b)
    }
    if (score > bestScore) {
      bestScore = score
      best = m
    }
  }
  return best
}

/**
 * Plays one move: the two animals swap. If that makes no row (and no special stones meet) nothing happens (`ok` false, no move is used).
 * Otherwise everything is resolved at once, and the steps are given for the screen.
 */
export function trySwap(g: Game, a: number, b: number): Turn {
  const turn: Turn = { ok: false, steps: [], flood: [], phase: g.phase }
  if (!isValidSwap(g, a, b)) {
    if (canSwap(g, a, b)) turn.swap = { a, b }
    return turn
  }
  const ta = g.tiles[a]!
  const tb = g.tiles[b]!
  const combo = comboOf(ta, tb)
  swapTiles(g, a, b)
  g.moves--
  g.movesMade++
  turn.ok = true
  turn.swap = { a, b }
  runTurn(g, turn, combo === 'none' ? null : { combo, a, b }, [a, b])
  return turn
}

/** The effect of two special stones that were swapped: `b` is the cell the child moved to. */
function comboCells(g: Game, combo: Combo, a: number, b: number): { type: EffectType; cells: number[]; kind: number } {
  const tb = g.tiles[b]!
  const ta = g.tiles[a]!
  if (combo === 'rainbowAll') {
    const all: number[] = []
    for (let i = 0; i < g.tiles.length; i++) if (g.tiles[i] && g.tiles[i]!.kind !== BASKET) all.push(i)
    return { type: 'all', cells: all, kind: -1 }
  }
  if (combo === 'rainbowKind') {
    const other = ta.special === RAINBOW ? tb : ta
    return { type: 'rainbow', cells: cellsOfKind(g, other.kind), kind: other.kind }
  }
  if (combo === 'rainbowSpecial') {
    const sp = ta.special === RAINBOW ? tb : ta
    const k = commonKind(g, -1)
    const cells = cellsOfKind(g, k)
    let flip = 0
    for (const idx of cells) {
      const t = g.tiles[idx]!
      if (sp.special === OLIVE) t.special = OLIVE
      else t.special = flip++ % 2 === 0 ? DOVE_H : DOVE_V
    }
    return { type: 'rainbow', cells, kind: k }
  }
  if (combo === 'cross') return { type: 'cross', cells: [...rowCells(g, rowOf(g, b)), ...colCells(g, colOf(g, b))], kind: -1 }
  if (combo === 'bigcross') {
    const cells: number[] = []
    for (let d = -1; d <= 1; d++) {
      const r = rowOf(g, b) + d
      const c = colOf(g, b) + d
      if (r >= 0 && r < g.rows) cells.push(...rowCells(g, r))
      if (c >= 0 && c < g.cols) cells.push(...colCells(g, c))
    }
    return { type: 'bigcross', cells, kind: -1 }
  }
  return { type: 'bigolive', cells: areaCells(g, b, 3, true), kind: -1 }
}

/** Clears, lets fall and repeats until the board is quiet; then the water, the end of the round and a shuffle if no move is left. */
function runTurn(g: Game, turn: Turn, combo: { combo: Combo; a: number; b: number } | null, prefer: number[], booster = false): void {
  let cascade = 0
  if (combo) {
    cascade++
    const step = emptyStep(g, cascade)
    const eff = comboCells(g, combo.combo, combo.a, combo.b)
    const q: number[] = []
    // the two special stones that met are used up (their own sweep is replaced by the combination)
    for (const idx of [combo.a, combo.b]) {
      const t = g.tiles[idx]!
      if (t.special !== NONE && combo.combo !== 'rainbowSpecial') t.special = NONE
      q.push(idx)
    }
    if (combo.combo === 'rainbowSpecial') for (const idx of q) g.tiles[idx]!.special = NONE
    step.effects.push({ type: eff.type, idx: combo.b, kind: eff.kind, cells: eff.cells })
    step.points += 120
    q.push(...eff.cells)
    clearCells(g, q, step)
    finishStep(g, step)
    turn.steps.push(step)
  }
  for (let guard = 0; guard < 80; guard++) {
    const groups = findMatchGroups(g)
    if (!groups.length) break
    cascade++
    const step = emptyStep(g, cascade)
    const q: number[] = []
    const made = new Set<number>()
    for (const grp of groups) {
      const plan = planSpecial(g, grp, cascade === 1 || combo ? prefer : [])
      if (plan) {
        const t = g.tiles[plan.idx]!
        t.special = plan.special
        made.add(plan.idx)
        step.made.push({ idx: plan.idx, id: t.id, special: plan.special, kind: t.kind })
        step.points += plan.special === RAINBOW ? 100 : plan.special === OLIVE ? 70 : 50
        if (plan.special === RAINBOW) count(g, 'rainbow')
        else if (plan.special === OLIVE) count(g, 'olive')
        else count(g, 'dove')
      }
    }
    for (const grp of groups) for (const idx of grp.cells) if (!made.has(idx)) q.push(idx)
    clearCells(g, q, step)
    finishStep(g, step)
    turn.steps.push(step)
  }
  endOfTurn(g, turn, booster)
}

/** How many times new animals may fall in by chance and make a chain by themselves in one move; after that only "quiet" animals come in. */
export const MAX_FREE_CASCADES = 1

/** Would an animal of kind `k` in cell `idx` make a row of three with the animals that stand around it now? */
function formsRun(g: Game, idx: number, k: number): boolean {
  const r = rowOf(g, idx)
  const c = colOf(g, idx)
  let h = 1
  for (let x = c - 1; x >= 0 && matchKind(g, r * g.cols + x) === k; x--) h++
  for (let x = c + 1; x < g.cols && matchKind(g, r * g.cols + x) === k; x++) h++
  if (h >= 3) return true
  let v = 1
  for (let y = r - 1; y >= 0 && matchKind(g, y * g.cols + c) === k; y--) v++
  for (let y = r + 1; y < g.rows && matchKind(g, y * g.cols + c) === k; y++) v++
  return v >= 3
}

/**
 * Makes the animals that fell in new in this step "quiet": none of them stands in a row of three (their kinds are changed where needed). So the
 * new animals never clear themselves, and a level is won by the moves of the child, not by a chain of chance.
 */
function neutralize(g: Game, step: Step): void {
  const fresh = new Map<number, Step['falls'][number]>()
  // in a long chain the animals that only fell down count as new as well (they take another look: a chain must not go on and on)
  const deep = step.cascade > MAX_FREE_CASCADES + 1
  for (const f of step.falls) if ((f.spawned || deep) && f.kind < BASKET && f.special === NONE) fresh.set(f.id, f)
  if (!fresh.size) return
  const kinds = g.level.kinds
  for (let pass = 0; pass < 16; pass++) {
    let changed = false
    for (const grp of findMatchGroups(g)) {
      for (const cell of grp.cells) {
        const t = g.tiles[cell]
        const f = t ? fresh.get(t.id) : undefined
        if (!t || !f) continue
        const start = Math.floor(rnd(g) * kinds.length)
        for (let i = 0; i < kinds.length; i++) {
          const k = kinds[(start + i) % kinds.length]!
          if (k !== t.kind && !formsRun(g, cell, k)) {
            t.kind = k
            f.kind = k
            changed = true
            break
          }
        }
      }
    }
    if (!changed) break
  }
}

function finishStep(g: Game, step: Step): void {
  settle(g, step)
  if (step.cascade > MAX_FREE_CASCADES) neutralize(g, step)
  // a chain reaction is worth more
  step.points = Math.round(step.points * (1 + 0.5 * (step.cascade - 1)))
  g.score += step.points
  step.progress = [...g.progress]
  step.score = g.score
}

function endOfTurn(g: Game, turn: Turn, booster: boolean): void {
  const waterBefore = countState(g, 'water')
  const rise = g.level.rise
  if (rise && !booster && g.phase === 'play' && g.movesMade % rise === 0 && g.moves > 0 && !goalsDone(g)) {
    const cleared = turn.steps.some((s) => s.hits.some((h) => h.what === 'water'))
    if (!cleared && waterBefore > 0 && g.floodCount < 6) {
      const f = flood(g)
      if (f) {
        turn.flood.push(f)
        g.floodCount++
      }
    }
  }
  if (goalsDone(g)) {
    g.phase = 'won'
    g.movesAtWin = g.moves
  } else if (g.moves <= 0) g.phase = 'lost'
  else if (!hasMove(g)) turn.shuffled = shuffleBoard(g)
  turn.phase = g.phase
}

/** A water field spreads to a neighbouring animal (not a netted, caged or basket one). */
function flood(g: Game): { idx: number; id: number } | null {
  const cand: number[] = []
  for (let idx = 0; idx < g.tiles.length; idx++) {
    const t = g.tiles[idx]
    if (!t || t.net || t.cage || t.kind === BASKET) continue
    if (neighbours(g, idx).some((n) => g.type[n] === WATER)) cand.push(idx)
  }
  if (!cand.length) return null
  const idx = cand[Math.floor(rnd(g) * cand.length)]!
  const id = g.tiles[idx]!.id
  g.tiles[idx] = null
  g.type[idx] = WATER
  // the animals above fall into the gap? no: water is a blocked cell, the animals above stay; the cell below is not changed
  return { idx, id }
}

// ── goals and stars ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** How many are still to do for goal `i` (0: done). */
export function goalLeft(g: Game, i: number): number {
  const goal = g.level.goals[i]!
  if (STATE_GOALS.includes(goal.t)) return countState(g, goal.t)
  if (goal.t === 'score') return Math.max(0, goal.n - g.score)
  return Math.max(0, goal.n - (g.progress[i] ?? 0))
}

export function goalsDone(g: Game): boolean {
  return g.level.goals.every((_, i) => goalLeft(g, i) === 0)
}

/** 0 until the level is won; then 1 to 3 by the moves that were left. */
export function starsFor(g: Game): number {
  if (g.phase !== 'won') return 0
  const share = g.movesAtWin / g.level.moves
  if (share >= STAR3) return 3
  if (share >= STAR2) return 2
  return 1
}
export const STAR3 = 0.34
export const STAR2 = 0.12

// ── a shuffle, the helpers, the bonus ───────────────────────────────────────────────────────────────────────────────────────
/** Puts the animals that can move in a new order (netted, caged ones and baskets stay), so that there is no row yet and a move exists. */
export function shuffleBoard(g: Game): ShuffleMove[] {
  const cells: number[] = []
  for (let i = 0; i < g.tiles.length; i++) {
    const t = g.tiles[i]
    if (t && g.type[i] === FLOOR && !t.net && !t.cage && t.kind !== BASKET) cells.push(i)
  }
  const before = new Map<number, number>()
  for (const i of cells) before.set(g.tiles[i]!.id, i)
  const tiles = cells.map((i) => g.tiles[i]!)
  for (let attempt = 0; attempt < 80; attempt++) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(rnd(g) * (i + 1))
      const tmp = tiles[i]!
      tiles[i] = tiles[j]!
      tiles[j] = tmp
    }
    cells.forEach((cell, i) => (g.tiles[cell] = tiles[i]!))
    if (!findMatchGroups(g).length && hasMove(g)) break
    if (attempt === 79) {
      // as a last resort give new kinds
      cells.forEach((cell) => {
        g.tiles[cell]!.kind = g.level.kinds[Math.floor(rnd(g) * g.level.kinds.length)]!
      })
      for (let k = 0; k < 40 && (findMatchGroups(g).length || !hasMove(g)); k++) {
        cells.forEach((cell) => {
          if (g.tiles[cell]!.special === NONE) g.tiles[cell]!.kind = g.level.kinds[Math.floor(rnd(g) * g.level.kinds.length)]!
        })
      }
    }
  }
  const out: ShuffleMove[] = []
  for (const cell of cells) {
    const t = g.tiles[cell]!
    const from = before.get(t.id)!
    if (from !== cell) out.push({ id: t.id, from, to: cell })
  }
  return out
}

/** The booster "mix": same as the automatic shuffle, but on demand. */
export function boosterShuffle(g: Game): Turn {
  const turn: Turn = { ok: g.phase === 'play', steps: [], flood: [], phase: g.phase }
  if (g.phase !== 'play') return turn
  turn.shuffled = shuffleBoard(g)
  return turn
}

/** The booster "hammer": removes whatever is in the cell (an animal, a crate, water, a stone, a net). Costs no move. */
export function boosterHammer(g: Game, idx: number): Turn {
  const turn: Turn = { ok: false, steps: [], flood: [], phase: g.phase }
  if (g.phase !== 'play' || idx < 0 || idx >= g.tiles.length) return turn
  const t = g.tiles[idx]
  if (g.type[idx] === VOID || (g.type[idx] === FLOOR && (!t || t.kind === BASKET))) return turn
  turn.ok = true
  const step = emptyStep(g, 1)
  step.effects.push({ type: 'hammer', idx, kind: -1, cells: [idx] })
  clearCells(g, [idx], step, true)
  finishStep(g, step)
  turn.steps.push(step)
  runTurnRest(g, turn)
  return turn
}

/** The booster "swap": two neighbours swap even if no row comes of it. Costs no move. */
export function boosterSwap(g: Game, a: number, b: number): Turn {
  const turn: Turn = { ok: false, steps: [], flood: [], phase: g.phase }
  if (!canSwap(g, a, b)) return turn
  const ta = g.tiles[a]!
  const tb = g.tiles[b]!
  if (ta.kind === BASKET && tb.kind === BASKET) return turn
  const combo = comboOf(ta, tb)
  swapTiles(g, a, b)
  turn.ok = true
  turn.swap = { a, b }
  runTurn(g, turn, combo === 'none' ? null : { combo, a, b }, [a, b], true)
  return turn
}

/** After a booster: the chain reactions and the end of the round, but no water rises (it was no move). */
function runTurnRest(g: Game, turn: Turn): void {
  runTurn(g, turn, null, [], true)
}

/**
 * The bonus after a win: every move that was left turns an animal into a dove, one after the other the doves fly (points and jubilation).
 * Returns the steps for the screen; the board stays playable-free (the round is over).
 */
export function bonusSteps(g: Game): Step[] {
  const out: Step[] = []
  if (g.phase !== 'won') return out
  const n = Math.min(g.movesAtWin, 8)
  for (let i = 0; i < n; i++) {
    const cand: number[] = []
    for (let idx = 0; idx < g.tiles.length; idx++) {
      const t = g.tiles[idx]
      if (t && t.kind < BASKET && t.special === NONE) cand.push(idx)
    }
    if (!cand.length) break
    const idx = cand[Math.floor(rnd(g) * cand.length)]!
    const t = g.tiles[idx]!
    t.special = i % 2 === 0 ? DOVE_H : DOVE_V
    const step = emptyStep(g, 1)
    step.made.push({ idx, id: t.id, special: t.special, kind: t.kind })
    clearCells(g, [idx], step)
    step.points = Math.round(step.points * 1.5)
    settle(g, step)
    // chain reactions that these clearings cause are cleared too (they count for the score)
    g.score += step.points
    step.score = g.score
    step.progress = [...g.progress]
    out.push(step)
    for (let guard = 0; guard < 30; guard++) {
      const groups = findMatchGroups(g)
      if (!groups.length) break
      const s2 = emptyStep(g, 2)
      const q: number[] = []
      for (const grp of groups) q.push(...grp.cells)
      clearCells(g, q, s2)
      finishStep(g, s2)
      out.push(s2)
    }
  }
  return out
}

// ── checking a level ────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Problems of a level definition (an empty list: fine). */
export function checkLevel(level: Level): string[] {
  const bad: string[] = []
  const w = level.map[0]?.length ?? 0
  if (!w) bad.push('empty map')
  if (level.map.some((row) => row.length !== w)) bad.push('rows of different length')
  if (level.map.length > 8 || w > 7) bad.push('board bigger than 7 x 8')
  if (/[^.#SWKNCB]/.test(level.map.join(''))) bad.push('unknown character in the map')
  if (level.kinds.length < 3 || level.kinds.some((k) => k < 0 || k >= KIND_COUNT)) bad.push('kinds')
  if (!level.goals.length) bad.push('no goal')
  if (level.moves < 5) bad.push('too few moves')
  return bad
}
