/**
 * "Nehemias Mauer": the rules of the stone-and-template puzzle (no Vue, no drawing). Stones in the shapes of Tetris fall from the sky
 * into a template (the plan of a wall); the child moves, turns and drops them until the template is filled without a gap.
 *
 * The field: rows `0 .. sky-1` are free sky; below them the template (`#` in the map) is the part that has to be built. A cell of the field is
 *  - `SLOT` : a cell of the template (a stone may lie here),
 *  - `AIR`  : free space above a column of the template (a stone may fly through but not lie here),
 *  - `WALL` : solid (the opening of a gate under a lintel, and everything beside the template).
 * A stone comes to rest on the floor, on a wall cell or on a stone that lies already, and it may only lock when all its cells are slots.
 *
 * Everything is deterministic: the stones of a level come from the generator in `nehemiaLevels.ts` (a template cut into stones, in an order
 * in which each stone lands on its place by itself), so every level can be solved; `solveGeometry` tells the player when the rest of the
 * stones can not fill the template any more.
 */

export type ShapeId = 'M1' | 'I2' | 'I3' | 'V3' | 'I4' | 'O' | 'T' | 'S' | 'Z' | 'L' | 'J' | 'P' | 'U' | 'V5' | 'T5' | 'I5'

export const SHAPE_IDS: ShapeId[] = ['M1', 'I2', 'I3', 'V3', 'I4', 'O', 'T', 'S', 'Z', 'L', 'J', 'P', 'U', 'V5', 'T5', 'I5']

/** The cells of each shape in its square box (the box turns around its middle, so a turn is exact and can be undone by turning back). */
const BOX: Record<ShapeId, { n: number; cells: [number, number][] }> = {
  M1: { n: 1, cells: [[0, 0]] },
  I2: { n: 2, cells: [[0, 0], [1, 0]] },
  I3: { n: 3, cells: [[0, 1], [1, 1], [2, 1]] },
  V3: { n: 2, cells: [[0, 0], [0, 1], [1, 1]] },
  I4: { n: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { n: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { n: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { n: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { n: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  L: { n: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  J: { n: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  P: { n: 3, cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] },
  U: { n: 3, cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
  V5: { n: 3, cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
  T5: { n: 3, cells: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]] },
  I5: { n: 5, cells: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] }
}

export const SHAPE_SIZE = Object.fromEntries(SHAPE_IDS.map((s) => [s, BOX[s].cells.length])) as Record<ShapeId, number>

/** The colour slot of each shape (the picture sheet of a chapter holds six block colours). */
export const SHAPE_COLOR: Record<ShapeId, number> = { M1: 2, I2: 3, I3: 4, V3: 5, I4: 0, O: 1, T: 2, S: 3, Z: 4, L: 5, J: 1, P: 0, U: 3, V5: 4, T5: 5, I5: 2 }

export interface Orient {
  rot: number
  cells: [number, number][]
  /** The first cell in reading order (row by row), used to cut a template into stones. */
  anchor: [number, number]
}

function turnCw(cells: [number, number][], n: number): [number, number][] {
  return cells.map(([x, y]) => [n - 1 - y, x] as [number, number])
}

/** The four orientations of each shape (rot 0..3, clockwise). */
export const ORIENTS = {} as Record<ShapeId, Orient[]>
/** The orientations that differ (a square has one, a bar two), the lowest rot of each. */
export const UNIQUE_ORIENTS = {} as Record<ShapeId, Orient[]>
for (const s of SHAPE_IDS) {
  const list: Orient[] = []
  let cells = BOX[s].cells
  for (let r = 0; r < 4; r++) {
    const sorted = [...cells].sort((a, b) => a[1] - b[1] || a[0] - b[0])
    list.push({ rot: r, cells: sorted, anchor: sorted[0]! })
    cells = turnCw(cells, BOX[s].n)
  }
  ORIENTS[s] = list
  const seen = new Set<string>()
  const uniq: Orient[] = []
  for (const o of list) {
    const key = norm(o.cells)
    if (seen.has(key)) continue
    seen.add(key)
    uniq.push(o)
  }
  UNIQUE_ORIENTS[s] = uniq
}

function norm(cells: [number, number][]): string {
  const mx = Math.min(...cells.map((c) => c[0]))
  const my = Math.min(...cells.map((c) => c[1]))
  return cells
    .map((c) => `${c[0] - mx},${c[1] - my}`)
    .sort()
    .join(';')
}

export const boxSize = (s: ShapeId): number => BOX[s].n
/** The longest side of a shape (the sky must be at least this high so that every stone can turn up there). */
export const reach = (s: ShapeId): number => {
  const c = BOX[s].cells
  return Math.max(Math.max(...c.map((p) => p[0])) - Math.min(...c.map((p) => p[0])), Math.max(...c.map((p) => p[1])) - Math.min(...c.map((p) => p[1]))) + 1
}

/** A small seeded random number generator (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const AIR = 0
export const WALL = 1
export const SLOT = 2

/** A stone of the row: a shape, or grey rubble that does not belong into the wall. */
export interface QItem {
  shape: ShapeId
  decoy: boolean
}

export interface Active {
  shape: ShapeId
  rot: number
  /** The top left of the box of the stone. */
  x: number
  y: number
  decoy: boolean
}

export interface PlacedPiece {
  shape: ShapeId
  rot: number
  x: number
  y: number
  decoy: boolean
  /** The cell indexes (y * cols + x) it covers. */
  cells: number[]
}

export type JEvent =
  | { t: 'move' }
  | { t: 'bump' }
  | { t: 'rotate' }
  | { t: 'tick' }
  | { t: 'lock'; cells: number[]; decoy: boolean; hard: boolean }
  | { t: 'refuse' }
  | { t: 'hold' }
  | { t: 'discard' }
  | { t: 'undo' }
  | { t: 'spawn' }
  | { t: 'stuck' }
  | { t: 'unstuck' }
  | { t: 'win'; patched: number }
  | { t: 'lost' }

export interface GameDef {
  /** The template as text rows: `#` is a cell to build, `.` is nothing. */
  map: string[]
  queue: QItem[]
  /** Rows of sky above the template (default: the longest stone, at least 3). */
  sky?: number
  /** How fast a stone falls by itself (rows per second); 0 stops it. */
  gravity: number
  undo: number
  /** Gaps that the clay may fill when the stones are used up. */
  clay: number
  hold: boolean
  /** The seconds that the third star allows. */
  par: number
}

export type Status = 'play' | 'won' | 'lost'

export interface Game {
  cols: number
  rows: number
  sky: number
  kind: Uint8Array
  /** 0 = empty, else the index in `placed` plus one. */
  fill: Int16Array
  placed: PlacedPiece[]
  queue: QItem[]
  cur: Active | null
  hold: QItem | null
  holdUsed: boolean
  holdAllowed: boolean
  slotsLeft: number
  slotsAll: number
  piecesAll: number
  undoLeft: number
  undoStart: number
  clayLeft: number
  /** Help that costs the second star was used. */
  helped: boolean
  usedUndo: number
  usedTip: number
  status: Status
  stuck: boolean
  /** The gaps that the clay filled at the end. */
  patched: number
  time: number
  par: number
  started: boolean
  gravity: number
  gravAcc: number
  /** Seconds that the stone has rested (for the automatic lock of the quick mode); `lockDelay` 0 = never by itself. */
  lockT: number
  lockDelay: number
  moves: number
  turns: number
  events: JEvent[]
  /** The rules of the stuck test (the budget of the search). */
  solveBudget: number
}

export function skyFor(queue: QItem[]): number {
  let m = 3
  for (const q of queue) m = Math.max(m, reach(q.shape))
  return m
}

/** Reads the map into the kinds of the cells (see the top of the file). */
export function fieldOf(map: string[], sky: number): { cols: number; rows: number; kind: Uint8Array } {
  const cols = Math.max(1, ...map.map((r) => r.length))
  const rows = sky + map.length
  const kind = new Uint8Array(cols * rows)
  for (let c = 0; c < cols; c++) {
    let top = -1
    for (let r = 0; r < map.length; r++) {
      if (map[r]![c] === '#') {
        top = r
        break
      }
    }
    for (let y = 0; y < rows; y++) {
      let k: number = WALL
      if (top < 0) k = y < sky ? AIR : WALL
      else if (y < sky + top) k = AIR
      else k = map[y - sky]![c] === '#' ? SLOT : WALL
      kind[y * cols + c] = k
    }
  }
  return { cols, rows, kind }
}

/** Why a map is not good: a column must be one run of cells from its top to the bottom or to a gate opening. */
export function checkMap(map: string[]): string[] {
  const errs: string[] = []
  const cols = Math.max(1, ...map.map((r) => r.length))
  for (let c = 0; c < cols; c++) {
    let state = 0
    for (let r = 0; r < map.length; r++) {
      const on = map[r]![c] === '#'
      if (state === 0 && on) state = 1
      else if (state === 1 && !on) state = 2
      else if (state === 2 && on) {
        errs.push(`column ${c}: a second run of cells at row ${r}`)
        break
      }
    }
  }
  return errs
}

export function newGame(def: GameDef): Game {
  const sky = def.sky ?? skyFor(def.queue)
  const { cols, rows, kind } = fieldOf(def.map, sky)
  let slots = 0
  for (let i = 0; i < kind.length; i++) if (kind[i] === SLOT) slots++
  const g: Game = {
    cols,
    rows,
    sky,
    kind,
    fill: new Int16Array(cols * rows),
    placed: [],
    queue: def.queue.map((q) => ({ ...q })),
    cur: null,
    hold: null,
    holdUsed: false,
    holdAllowed: def.hold,
    slotsLeft: slots,
    slotsAll: slots,
    piecesAll: def.queue.filter((q) => !q.decoy).length,
    undoLeft: def.undo,
    undoStart: def.undo,
    clayLeft: def.clay,
    helped: false,
    usedUndo: 0,
    usedTip: 0,
    status: 'play',
    stuck: false,
    patched: 0,
    time: 0,
    par: def.par,
    started: false,
    gravity: def.gravity,
    gravAcc: 0,
    lockT: 0,
    lockDelay: 0,
    moves: 0,
    turns: 0,
    events: [],
    solveBudget: 30000
  }
  nextPiece(g)
  return g
}

// ── cells ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Whether the cell is free for a flying stone. */
export function free(g: Game, x: number, y: number): boolean {
  if (x < 0 || x >= g.cols || y < 0 || y >= g.rows) return false
  const i = y * g.cols + x
  return g.kind[i] !== WALL && g.fill[i] === 0
}

export function fits(g: Game, shape: ShapeId, rot: number, x: number, y: number): boolean {
  const cells = ORIENTS[shape][rot]!.cells
  for (let i = 0; i < cells.length; i++) if (!free(g, x + cells[i]![0], y + cells[i]![1])) return false
  return true
}

/** Whether a stone could stay here for good: all its cells are slots of the template. */
export function lockable(g: Game, shape: ShapeId, rot: number, x: number, y: number): boolean {
  const cells = ORIENTS[shape][rot]!.cells
  for (let i = 0; i < cells.length; i++) {
    const cx = x + cells[i]![0]
    const cy = y + cells[i]![1]
    if (cx < 0 || cx >= g.cols || cy < 0 || cy >= g.rows || g.kind[cy * g.cols + cx] !== SLOT) return false
  }
  return true
}

export function cellsAt(shape: ShapeId, rot: number, x: number, y: number): [number, number][] {
  return ORIENTS[shape][rot]!.cells.map(([cx, cy]) => [x + cx, y + cy] as [number, number])
}

export function minY(shape: ShapeId, rot: number): number {
  return Math.min(...ORIENTS[shape][rot]!.cells.map((c) => c[1]))
}

/** Where the box of a stone starts: in the middle, with its top row in the top row of the field. */
export function spawnPos(g: Game, shape: ShapeId, rot = 0): { x: number; y: number } {
  return { x: Math.floor((g.cols - boxSize(shape)) / 2), y: 0 - minY(shape, rot) }
}

function ev(g: Game, e: JEvent) {
  g.events.push(e)
}

function nextPiece(g: Game) {
  const item = g.queue.shift()
  if (!item) {
    g.cur = null
    return
  }
  setCurrent(g, item)
  ev(g, { t: 'spawn' })
}

function setCurrent(g: Game, item: QItem) {
  const p = spawnPos(g, item.shape, 0)
  g.cur = { shape: item.shape, rot: 0, x: p.x, y: p.y, decoy: item.decoy }
  g.gravAcc = 0
  g.lockT = 0
  g.holdUsed = false
}

/** The lowest row the stone can reach straight down from its place. */
export function ghostY(g: Game): number {
  const c = g.cur
  if (!c) return 0
  let y = c.y
  while (fits(g, c.shape, c.rot, c.x, y + 1)) y++
  return y
}

/** Where a stone that is dropped at column `x` (box left) with orientation `rot` from the sky comes to rest, or null when it can not even stand at the top. */
export function landingY(g: Game, shape: ShapeId, rot: number, x: number): number | null {
  let y = 0 - minY(shape, rot)
  if (!fits(g, shape, rot, x, y)) return null
  while (fits(g, shape, rot, x, y + 1)) y++
  return y
}

export function resting(g: Game): boolean {
  const c = g.cur
  return !!c && !fits(g, c.shape, c.rot, c.x, c.y + 1)
}

function canAct(g: Game): boolean {
  return g.status === 'play' && !!g.cur
}

function touch(g: Game) {
  g.started = true
  g.lockT = 0
}

// ── the moves ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function move(g: Game, dx: number): boolean {
  if (!canAct(g)) return false
  const c = g.cur!
  if (fits(g, c.shape, c.rot, c.x + dx, c.y)) {
    c.x += dx
    touch(g)
    g.moves++
    ev(g, { t: 'move' })
    return true
  }
  ev(g, { t: 'bump' })
  return false
}

/** Where a turned stone may go when it does not fit at the same place (it is pushed aside, up or down: the "kicks"). */
export const KICKS: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [-1, -1], [1, -1], [0, 2], [-2, 1], [2, 1]]

export function rotate(g: Game, dir: 1 | -1 = 1): boolean {
  if (!canAct(g)) return false
  const c = g.cur!
  const nr = (c.rot + dir + 4) % 4
  for (const [dx, dy] of KICKS) {
    if (fits(g, c.shape, nr, c.x + dx, c.y + dy)) {
      c.rot = nr
      c.x += dx
      c.y += dy
      touch(g)
      g.turns++
      ev(g, { t: 'rotate' })
      return true
    }
  }
  ev(g, { t: 'bump' })
  return false
}

/** One row down. At rest it locks the stone when `allowLock` is set and the place is good. Returns what happened. */
export function softDrop(g: Game, allowLock = false): 'moved' | 'rest' | 'locked' | 'none' {
  if (!canAct(g)) return 'none'
  const c = g.cur!
  if (fits(g, c.shape, c.rot, c.x, c.y + 1)) {
    c.y++
    touch(g)
    ev(g, { t: 'tick' })
    return 'moved'
  }
  if (allowLock) {
    touch(g)
    return lockCurrent(g, false) ? 'locked' : 'rest'
  }
  return 'rest'
}

export function hardDrop(g: Game): boolean {
  if (!canAct(g)) return false
  const c = g.cur!
  touch(g)
  c.y = ghostY(g)
  return lockCurrent(g, true)
}

/** Locks the stone where it is (or says no when a cell is outside the template). */
function lockCurrent(g: Game, hard: boolean): boolean {
  const c = g.cur
  if (!c || g.status !== 'play') return false
  if (c.decoy) {
    // grey rubble does not belong into the wall: it crumbles to dust where it lands
    g.cur = null
    ev(g, { t: 'discard' })
    afterLock(g, true)
    return true
  }
  if (!lockable(g, c.shape, c.rot, c.x, c.y)) {
    ev(g, { t: 'refuse' })
    return false
  }
  const cells = ORIENTS[c.shape][c.rot]!.cells.map(([cx, cy]) => (c.y + cy) * g.cols + (c.x + cx))
  g.placed.push({ shape: c.shape, rot: c.rot, x: c.x, y: c.y, decoy: c.decoy, cells })
  const id = g.placed.length
  for (const i of cells) g.fill[i] = id
  g.slotsLeft -= cells.length
  g.cur = null
  ev(g, { t: 'lock', cells, decoy: c.decoy, hard })
  afterLock(g)
  return true
}

function realLeft(g: Game): number {
  let n = g.queue.filter((q) => !q.decoy).length
  if (g.cur && !g.cur.decoy) n++
  if (g.hold && !g.hold.decoy) n++
  return n
}

function afterLock(g: Game, skipWin = false) {
  if (!skipWin && g.slotsLeft === 0) {
    g.status = 'won'
    g.stuck = false
    ev(g, { t: 'win', patched: 0 })
    return
  }
  nextPiece(g)
  if (!g.cur && g.hold) {
    const h = g.hold
    g.hold = null
    setCurrent(g, h)
  }
  checkEnd(g)
  if (g.status === 'play') analyze(g)
}

/** The row of stones is used up: the clay fills the last gaps, or the wall is not finished. */
function checkEnd(g: Game) {
  if (g.status !== 'play') return
  if (realLeft(g) > 0) return
  if (g.slotsLeft <= g.clayLeft) {
    g.patched = g.slotsLeft
    g.helped = g.helped || g.patched > 0
    g.clayLeft -= g.patched
    g.status = 'won'
    g.stuck = false
    ev(g, { t: 'win', patched: g.patched })
  } else {
    g.status = 'lost'
    ev(g, { t: 'lost' })
  }
}

export function holdPiece(g: Game): boolean {
  if (!canAct(g) || !g.holdAllowed || g.holdUsed) {
    if (g.status === 'play') ev(g, { t: 'refuse' })
    return false
  }
  const c = g.cur!
  const mine: QItem = { shape: c.shape, decoy: c.decoy }
  if (g.hold) {
    const other = g.hold
    g.hold = mine
    setCurrent(g, other)
  } else {
    const item = g.queue.shift()
    if (!item) {
      ev(g, { t: 'refuse' })
      return false
    }
    g.hold = mine
    setCurrent(g, item)
  }
  g.holdUsed = true
  g.started = true
  ev(g, { t: 'hold' })
  analyze(g)
  return true
}

/** Throws the rubble into the chute. Only grey rubble can go; a real stone is needed for the wall. */
export function discard(g: Game): boolean {
  if (!canAct(g)) return false
  const c = g.cur!
  if (!c.decoy) {
    ev(g, { t: 'refuse' })
    return false
  }
  touch(g)
  g.cur = null
  ev(g, { t: 'discard' })
  nextPiece(g)
  if (!g.cur && g.hold) {
    const h = g.hold
    g.hold = null
    setCurrent(g, h)
  }
  checkEnd(g)
  if (g.status === 'play') analyze(g)
  return true
}

/** Takes the last stone back: it is the stone in the hand again, and the stone that was in the hand goes to the front of the row. */
export function undo(g: Game): boolean {
  if (g.status !== 'play' || g.undoLeft <= 0 || g.placed.length === 0) {
    if (g.status === 'play') ev(g, { t: 'refuse' })
    return false
  }
  const p = g.placed.pop()!
  for (const i of p.cells) g.fill[i] = 0
  g.slotsLeft += p.cells.length
  if (g.cur) g.queue.unshift({ shape: g.cur.shape, decoy: g.cur.decoy })
  setCurrent(g, { shape: p.shape, decoy: p.decoy })
  g.undoLeft--
  g.usedUndo++
  g.helped = true
  g.started = true
  ev(g, { t: 'undo' })
  analyze(g)
  return true
}

/** Time and gravity. */
export function tick(g: Game, dt: number) {
  if (g.status !== 'play') return
  if (g.started) g.time += dt
  const c = g.cur
  if (!c) return
  if (g.gravity > 0) {
    g.gravAcc += dt * g.gravity
    while (g.gravAcc >= 1) {
      g.gravAcc -= 1
      if (fits(g, c.shape, c.rot, c.x, c.y + 1)) c.y++
      else {
        g.gravAcc = 0
        break
      }
    }
  }
  if (g.lockDelay > 0 && resting(g) && lockable(g, c.shape, c.rot, c.x, c.y)) {
    g.lockT += dt
    if (g.lockT >= g.lockDelay) lockCurrent(g, false)
  } else g.lockT = 0
}

/** The stars of a finished wall: built, built without help, built without help in time. */
export function starsOf(g: Game): number {
  if (g.status !== 'won') return 0
  if (g.helped) return 1
  return g.time <= g.par ? 3 : 2
}

// ── the stuck test ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The real stones that are still to be placed (in hand, in the row, in the reserve). */
export function remainingShapes(g: Game): ShapeId[] {
  const out: ShapeId[] = []
  if (g.cur && !g.cur.decoy) out.push(g.cur.shape)
  if (g.hold && !g.hold.decoy) out.push(g.hold.shape)
  for (const q of g.queue) if (!q.decoy) out.push(q.shape)
  return out
}

/**
 * Whether the free slots can be filled exactly by the given stones (turned as you like, in any order), with at most `holes` cells left over.
 * Returns true / false, or null when the search ran out of its budget.
 */
export function solveGeometry(g: Game, shapes: ShapeId[], holes: number, budget = g.solveBudget, extraFilled: number[] = []): boolean | null {
  const cols = g.cols
  const cell = new Uint8Array(g.cols * g.rows)
  const list: number[] = []
  for (let i = 0; i < cell.length; i++) {
    if (g.kind[i] === SLOT && g.fill[i] === 0) {
      cell[i] = 1
      list.push(i)
    }
  }
  for (const i of extraFilled) if (cell[i]) cell[i] = 0
  const open = list.filter((i) => cell[i] === 1)
  let sum = 0
  const count: Partial<Record<ShapeId, number>> = {}
  for (const s of shapes) {
    sum += SHAPE_SIZE[s]
    count[s] = (count[s] ?? 0) + 1
  }
  const extra = open.length - sum
  if (extra < 0 || extra > holes) return false
  const kinds = Object.keys(count) as ShapeId[]
  kinds.sort((a, b) => SHAPE_SIZE[b] - SHAPE_SIZE[a])
  let nodes = 0
  let cut = false
  // the pieces of free cells that hang together must be as large as some sum of stones (a quick no for most dead ends)
  if (!componentsOk(cell, open, cols, g.rows, shapes, extra)) return false
  const rec = (start: number, holesLeft: number): boolean => {
    if (cut) return false
    // the first free cell in reading order
    let p = start
    while (p < open.length && cell[open[p]!] !== 1) p++
    if (p >= open.length) return holesLeft === 0 && kinds.every((k) => (count[k] ?? 0) === 0)
    if (++nodes > budget) {
      cut = true
      return false
    }
    const idx = open[p]!
    const ax = idx % cols
    const ay = (idx - ax) / cols
    for (const k of kinds) {
      if ((count[k] ?? 0) === 0) continue
      for (const o of UNIQUE_ORIENTS[k]) {
        const ox = ax - o.anchor[0]
        const oy = ay - o.anchor[1]
        let ok = true
        for (let i = 0; i < o.cells.length; i++) {
          const x = ox + o.cells[i]![0]
          const y = oy + o.cells[i]![1]
          if (x < 0 || x >= cols || y < 0 || y >= g.rows || cell[y * cols + x] !== 1) {
            ok = false
            break
          }
        }
        if (!ok) continue
        for (const [cx, cy] of o.cells) cell[(oy + cy) * cols + ox + cx] = 0
        count[k]!--
        const done = rec(p + 1, holesLeft)
        count[k]!++
        for (const [cx, cy] of o.cells) cell[(oy + cy) * cols + ox + cx] = 1
        if (done) return true
        if (cut) return false
      }
    }
    if (holesLeft > 0) {
      cell[idx] = 0
      const done = rec(p + 1, holesLeft - 1)
      cell[idx] = 1
      if (done) return true
    }
    return false
  }
  const res = rec(0, extra)
  if (res) return true
  return cut ? null : false
}

function componentsOk(cell: Uint8Array, open: number[], cols: number, rows: number, shapes: ShapeId[], holes: number): boolean {
  // the sums that the stones can make
  const sizes = shapes.map((s) => SHAPE_SIZE[s])
  const total = sizes.reduce((a, b) => a + b, 0)
  const can = new Uint8Array(total + 1)
  can[0] = 1
  for (const s of sizes) for (let v = total; v >= s; v--) if (can[v - s]) can[v] = 1
  const seen = new Uint8Array(cell.length)
  let spare = holes
  for (const start of open) {
    if (seen[start] || cell[start] !== 1) continue
    let n = 0
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const i = stack.pop()!
      n++
      const x = i % cols
      const y = (i - x) / cols
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue
        const j = ny * cols + nx
        if (cell[j] === 1 && !seen[j]) {
          seen[j] = 1
          stack.push(j)
        }
      }
    }
    // a component of n cells needs stones of exactly n cells, or fewer stones and (n - sum) holes
    let ok = false
    for (let h = 0; h <= Math.min(spare, n); h++) {
      if (n - h <= total && can[n - h]) {
        ok = true
        break
      }
    }
    if (!ok) return false
  }
  return true
}

/** Looks at the wall after a stone has gone down: tells whether the rest can still be built. */
export function analyze(g: Game): void {
  if (g.status !== 'play') return
  const res = solveGeometry(g, remainingShapes(g), g.clayLeft)
  const stuck = res === false
  if (stuck !== g.stuck) {
    g.stuck = stuck
    ev(g, { t: stuck ? 'stuck' : 'unstuck' })
  }
}

// ── the tip ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where the stone in the hand may rest (reachable by moving, turning and falling), with the places that keep the wall buildable first. */
export function restingPlaces(g: Game): { rot: number; x: number; y: number }[] {
  const c = g.cur
  if (!c) return []
  const seen = new Set<number>()
  const key = (rot: number, x: number, y: number) => (rot * 64 + (y + 8)) * 64 + (x + 8)
  const out: { rot: number; x: number; y: number }[] = []
  const stack: { rot: number; x: number; y: number }[] = [{ rot: c.rot, x: c.x, y: c.y }]
  seen.add(key(c.rot, c.x, c.y))
  const push = (rot: number, x: number, y: number) => {
    const k = key(rot, x, y)
    if (seen.has(k)) return
    seen.add(k)
    if (fits(g, c.shape, rot, x, y)) stack.push({ rot, x, y })
  }
  while (stack.length) {
    const s = stack.pop()!
    if (!fits(g, c.shape, s.rot, s.x, s.y + 1)) {
      if (lockable(g, c.shape, s.rot, s.x, s.y)) out.push(s)
    } else push(s.rot, s.x, s.y + 1)
    push(s.rot, s.x - 1, s.y)
    push(s.rot, s.x + 1, s.y)
    for (const d of [1, 3]) {
      const nr = (s.rot + d) % 4
      for (const [dx, dy] of KICKS) {
        if (fits(g, c.shape, nr, s.x + dx, s.y + dy)) {
          push(nr, s.x + dx, s.y + dy)
          break
        }
      }
    }
  }
  return out
}

/** A good place for the stone in the hand (the wall stays buildable), the lowest one first; null when there is none. Costs the second star. */
export function tip(g: Game): { rot: number; x: number; y: number } | null {
  const c = g.cur
  if (!c || g.status !== 'play') return null
  g.helped = true
  g.usedTip++
  g.started = true
  const rest = remainingShapes(g)
  const mine = c.decoy ? rest : (() => {
    const copy = [...rest]
    copy.splice(copy.indexOf(c.shape), 1)
    return copy
  })()
  const places = restingPlaces(g).sort((a, b) => b.y - a.y || a.x - b.x)
  if (c.decoy) return null
  for (const p of places) {
    const cells = ORIENTS[c.shape][p.rot]!.cells.map(([cx, cy]) => (p.y + cy) * g.cols + (p.x + cx))
    const ok = solveGeometry(g, mine, g.clayLeft, 12000, cells)
    if (ok === true) return p
  }
  return places[0] ?? null
}
