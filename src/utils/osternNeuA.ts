/**
 * The pure parts of two more games of "Ostern" (the components only show and listen):
 * "The errand" (`botengang`, John 20,18: Mary runs through the lanes from the garden to the disciples) and
 * "The shutters" (`fensterlaeden`, Luke 24,36: every window of the upper room is to be open and bright; a shutter also turns its neighbours).
 * The arithmetic has no clock and no dice.
 */

// ================================================================ 1. the errand (`botengang`)

/**
 * The painted lane tiles (seen from above, 256 x 256, all in the same scale and light). The app turns them (0, 90, 180, 270 degrees clockwise) to fit the neighbours.
 * Without a turn the pictures lie like this:
 * - `straight`: the lane runs from the top edge to the bottom edge;
 * - `corner`: the lane joins the top edge and the right edge;
 * - `tee`: the lane joins the left, the right and the bottom edge (the top is a wall);
 * - `cross`: all four edges;
 * - `dead`: the lane comes in at the bottom edge and ends at a well;
 * - `start` (the garden gate) and `goal` (the house with the open door): the lane leaves at the bottom edge;
 * - `roofs`: flat clay roofs (no lane), taken in turn and turned for variety.
 * `turn` adds degrees to the turn of a picture that was painted the other way round (e.g. `{ corner: 90 }`).
 */
export interface ErrandTiles {
  straight: string
  corner: string
  tee: string
  cross: string
  dead: string
  roofs: string[]
  start: string
  goal: string
  turn?: Partial<Record<ErrandTileKind, number>>
}
/**
 * One round: the hint and the map, one string per row, every sign one cell:
 * `#` roof, `.` lane, `S` start (the garden gate), `Z` goal (the house of the disciples), `B` dead end with a well (entering it is a mistake).
 */
export interface ErrandRound {
  hint: string
  rows: string[]
}
/** The game "The errand" (`botengang`): the tiles, Mary as a sprite (from above at a slant, 200 x 200, transparent) and the rounds. */
export interface ErrandGame {
  tiles: ErrandTiles
  walker: string
  rounds: ErrandRound[]
}

export type ErrandTileKind = 'straight' | 'corner' | 'tee' | 'cross' | 'dead' | 'roof' | 'start' | 'goal'
/** A direction: 0 up (north), 1 right (east), 2 down (south), 3 left (west). */
export type Dir = 0 | 1 | 2 | 3
export interface Cell {
  r: number
  c: number
}

const STEP: Record<Dir, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] }
const ALL_DIRS: Dir[] = [0, 1, 2, 3]
const LANE = new Set(['.', 'S', 'Z', 'B'])
const SIGNS = new Set(['#', '.', 'S', 'Z', 'B'])

export const errandSame = (a: Cell, b: Cell): boolean => a.r === b.r && a.c === b.c
export const errandStep = (p: Cell, d: Dir): Cell => ({ r: p.r + STEP[d][0], c: p.c + STEP[d][1] })
export const errandBack = (d: Dir): Dir => ((d + 2) % 4) as Dir

/** The size of the map: the number of rows and of columns (the longest row). */
export function errandSize(rows: readonly string[]): { rows: number; cols: number } {
  return { rows: rows.length, cols: rows.reduce((n, r) => Math.max(n, r.length), 0) }
}

/** The sign of a cell (`#` outside the map or past the end of a short row). */
export function errandAt(rows: readonly string[], p: Cell): string {
  const row = rows[p.r]
  if (row === undefined || p.c < 0 || p.c >= row.length) return '#'
  return row[p.c]!
}

/** A cell Mary can stand on: a lane, the start, the goal or a dead end. */
export const errandOpen = (rows: readonly string[], p: Cell): boolean => LANE.has(errandAt(rows, p))

/** The directions in which the neighbour of a cell is a lane (up, right, down, left). */
export function errandSides(rows: readonly string[], p: Cell): Dir[] {
  return ALL_DIRS.filter((d) => errandOpen(rows, errandStep(p, d)))
}

/** All cells with a sign. */
export function errandFind(rows: readonly string[], sign: string): Cell[] {
  const out: Cell[] = []
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === sign) out.push({ r, c })
  })
  return out
}

const rotate = (sides: readonly Dir[], q: number): Dir[] => sides.map((d) => ((d + q) % 4) as Dir)
const sameSet = (a: readonly Dir[], b: readonly Dir[]): boolean => a.length === b.length && a.every((d) => b.includes(d))
/** The open edges of each picture without a turn (see `ErrandTiles`). */
const BASE: Record<'straight' | 'corner' | 'tee' | 'one', Dir[]> = { straight: [0, 2], corner: [0, 1], tee: [1, 2, 3], one: [2] }
const turnFor = (base: Dir[], sides: readonly Dir[]): number => {
  for (let q = 0; q < 4; q++) if (sameSet(rotate(base, q), sides)) return q * 90
  return 0
}

/**
 * Which picture a cell gets and how far it is turned (degrees clockwise): the shape follows the lanes around it. A roof is turned by its place (for variety),
 * the start, the goal and a dead end face their first open neighbour.
 */
export function errandTile(rows: readonly string[], p: Cell): { kind: ErrandTileKind; turn: number } {
  const sign = errandAt(rows, p)
  if (!LANE.has(sign)) return { kind: 'roof', turn: ((p.r * 3 + p.c * 5) % 4) * 90 }
  const sides = errandSides(rows, p)
  if (sign === 'S' || sign === 'Z' || sign === 'B' || sides.length <= 1) {
    const kind: ErrandTileKind = sign === 'S' ? 'start' : sign === 'Z' ? 'goal' : 'dead'
    return { kind, turn: sides.length ? turnFor(BASE.one, [sides[0]!]) : 0 }
  }
  if (sides.length === 4) return { kind: 'cross', turn: 0 }
  if (sides.length === 3) return { kind: 'tee', turn: turnFor(BASE.tee, sides) }
  if (sameSet(sides, [0, 2]) || sameSet(sides, [1, 3])) return { kind: 'straight', turn: turnFor(BASE.straight, sides) }
  return { kind: 'corner', turn: turnFor(BASE.corner, sides) }
}

/** The picture of a cell of the game (with the correction of `tiles.turn`). */
export function errandPicture(game: ErrandGame, rows: readonly string[], p: Cell): { src: string; turn: number; kind: ErrandTileKind } {
  const { kind, turn } = errandTile(rows, p)
  const t = game.tiles
  const roofs = t.roofs.length ? t.roofs : [t.straight]
  const src = kind === 'roof' ? roofs[(p.r * 7 + p.c * 3) % roofs.length]! : t[kind]
  return { src, kind, turn: (((turn + (t.turn?.[kind] ?? 0)) % 360) + 360) % 360 }
}

/** The direction from one cell to another in the same row or column (null otherwise or for the same cell). */
export function errandDirTo(from: Cell, to: Cell): Dir | null {
  if (from.r === to.r && from.c !== to.c) return to.c > from.c ? 1 : 3
  if (from.c === to.c && from.r !== to.r) return to.r > from.r ? 2 : 0
  return null
}

/**
 * The way to a tapped cell: in a straight line, lane after lane without a roof between (the cells after `from`, the last one is `to`).
 * Mary stops at the goal or a dead end on the way. Null when the cell does not lie in a straight line or a roof is between.
 */
export function errandLine(rows: readonly string[], from: Cell, to: Cell): Cell[] | null {
  const d = errandDirTo(from, to)
  if (d === null || !errandOpen(rows, to)) return null
  const out: Cell[] = []
  let p = from
  while (!errandSame(p, to)) {
    p = errandStep(p, d)
    if (!errandOpen(rows, p)) return null
    out.push(p)
    const s = errandAt(rows, p)
    if (s === 'Z' || s === 'B') break
  }
  return out
}

/**
 * A swipe (or an arrow key): Mary runs in the direction and follows the lane round its corners until the next branching, the goal, a dead end or the end of the lane.
 * The cells after `from`; empty when the first cell in that direction is a roof.
 */
export function errandSlide(rows: readonly string[], from: Cell, dir: Dir): Cell[] {
  const out: Cell[] = []
  let p = from
  let d = dir
  const { rows: h, cols: w } = errandSize(rows)
  const limit = h * w + 1
  while (out.length < limit) {
    const next = errandStep(p, d)
    if (!errandOpen(rows, next)) break
    out.push(next)
    p = next
    const s = errandAt(rows, p)
    if (s === 'Z' || s === 'B' || s === 'S') break
    const ways = errandSides(rows, p).filter((x) => x !== errandBack(d))
    if (ways.length !== 1) break
    d = ways[0]!
    if (errandSame(p, from)) break
  }
  return out
}

/** How many steps every cell is from the goal (a breadth-first search over the lanes; `Infinity` where the goal cannot be reached). A dead end is never passed. */
export function errandDistances(rows: readonly string[], goal: Cell): number[][] {
  const { rows: h, cols: w } = errandSize(rows)
  const dist = Array.from({ length: h }, () => Array<number>(w).fill(Infinity))
  if (!errandOpen(rows, goal)) return dist
  dist[goal.r]![goal.c] = 0
  const queue: Cell[] = [goal]
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!
    if (errandAt(rows, p) === 'B' && !errandSame(p, goal)) continue
    for (const d of errandSides(rows, p)) {
      const q = errandStep(p, d)
      if (dist[q.r]![q.c] !== Infinity) continue
      dist[q.r]![q.c] = dist[p.r]![p.c]! + 1
      queue.push(q)
    }
  }
  return dist
}

/** The goal of a map (the first `Z`). */
export const errandGoal = (rows: readonly string[]): Cell | null => errandFind(rows, 'Z')[0] ?? null
/** The start of a map (the first `S`). */
export const errandStart = (rows: readonly string[]): Cell | null => errandFind(rows, 'S')[0] ?? null

/** A shortest way from a cell to the goal (the cells after `from`, the last one is the goal); empty when there is none or `from` is the goal. */
export function errandPath(rows: readonly string[], from: Cell): Cell[] {
  const goal = errandGoal(rows)
  if (!goal) return []
  const dist = errandDistances(rows, goal)
  let p = from
  let left = dist[p.r]?.[p.c] ?? Infinity
  if (left === Infinity) return []
  const out: Cell[] = []
  while (left > 0) {
    const next = errandSides(rows, p)
      .map((d) => errandStep(p, d))
      .find((q) => dist[q.r]![q.c] === left - 1 && (errandAt(rows, q) !== 'B' || left === 1))
    if (!next) return []
    out.push(next)
    p = next
    left--
  }
  return out
}

/** The next stop for the button "Help me": along a shortest way, the farthest cell in a straight line from Mary (a tap there brings her nearer). Null at the goal. */
export function errandNextStop(rows: readonly string[], from: Cell): Cell | null {
  const path = errandPath(rows, from)
  if (!path.length) return null
  const d = errandDirTo(from, path[0]!)
  let stop = path[0]!
  for (let i = 1; i < path.length; i++) {
    if (errandDirTo(path[i - 1]!, path[i]!) !== d) break
    stop = path[i]!
  }
  return stop
}

/** The problems of the data of `botengang` (an empty list is good). */
export function errandProblems(game: ErrandGame): string[] {
  const out: string[] = []
  const t = game.tiles
  for (const k of ['straight', 'corner', 'tee', 'cross', 'dead', 'start', 'goal'] as const) if (!t[k]) out.push(`no picture for the tile "${k}"`)
  if (!t.roofs.length) out.push('no roof pictures')
  if (!game.walker) out.push('no picture of Mary')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((round, i) => {
    const n = i + 1
    const rows = round.rows
    const { rows: h, cols: w } = errandSize(rows)
    if (h < 2 || w < 2) {
      out.push(`round ${n}: the map is too small`)
      return
    }
    if (rows.some((r) => r.length !== w)) out.push(`round ${n}: the rows are not all equally long`)
    if (w > 8) out.push(`round ${n}: more than 8 columns are too small to tap on a phone`)
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (!SIGNS.has(row[c]!)) out.push(`round ${n}: unknown sign "${row[c]}" in row ${r + 1}`)
    })
    const starts = errandFind(rows, 'S')
    const goals = errandFind(rows, 'Z')
    if (starts.length !== 1) out.push(`round ${n}: there must be exactly one start (S), there are ${starts.length}`)
    if (goals.length !== 1) out.push(`round ${n}: there must be exactly one goal (Z), there are ${goals.length}`)
    for (const b of errandFind(rows, 'B')) if (errandSides(rows, b).length !== 1) out.push(`round ${n}: the dead end in row ${b.r + 1}, column ${b.c + 1} must have exactly one lane next to it`)
    for (const p of errandFind(rows, '.')) {
      const k = errandSides(rows, p).length
      if (k === 0) out.push(`round ${n}: the lane in row ${p.r + 1}, column ${p.c + 1} is cut off`)
      else if (k === 1) out.push(`round ${n}: the lane in row ${p.r + 1}, column ${p.c + 1} ends without a well (use B)`)
    }
    if (starts.length === 1 && goals.length === 1) {
      const dist = errandDistances(rows, goals[0]!)
      if (dist[starts[0]!.r]![starts[0]!.c] === Infinity) out.push(`round ${n}: the goal cannot be reached from the start`)
    }
  })
  return out
}

// ================================================================ 2. the shutters (`fensterlaeden`)

/** A window opening of the painted house: the left and top edge, the width and height, all in percent of the picture. */
export interface ShutterWindow {
  x: number
  y: number
  w: number
  h: number
}
/**
 * One round of "The shutters": the hint, the house (`background`, the windows dark and empty), its width divided by its height (`ratio`, 1.5 without it), the window openings,
 * the neighbours of every window (`links[i]`: the windows that turn with window `i`, without `i` itself), the start (`true` = open) and the fewest moves (`par`).
 */
export interface ShuttersRound {
  hint: string
  background: string
  ratio?: number
  windows: ShutterWindow[]
  links: number[][]
  start: boolean[]
  par: number
  /** Pictures of this round instead of the game's (the window openings of another house have another shape). */
  shutter?: string
  lights?: string[]
}
/** The game "The shutters" (`fensterlaeden`): the closed shutter (260 x 300, transparent), the lit window pictures (taken in turn, one per window) and the rounds. */
export interface ShuttersGame {
  shutter: string
  lights: string[]
  rounds: ShuttersRound[]
}

/** A tap on window `i`: it turns, and so do its neighbours. */
export function shuttersToggle(state: readonly boolean[], links: readonly (readonly number[])[], i: number): boolean[] {
  const out = state.slice()
  for (const k of [i, ...(links[i] ?? [])]) if (k >= 0 && k < out.length) out[k] = !out[k]
  return out
}

/** Every window is open. */
export const shuttersSolved = (state: readonly boolean[]): boolean => state.length > 0 && state.every(Boolean)

/** How many windows are open. */
export const shuttersOpenCount = (state: readonly boolean[]): number => state.filter(Boolean).length

/** The most windows a breadth-first search looks at (2^16 states). */
export const SHUTTERS_MAX = 16

/** The fewest taps from a state to all windows open, and which windows (a breadth-first search over all states); null when it cannot be done. */
export function shuttersBest(state: readonly boolean[], links: readonly (readonly number[])[]): { moves: number; taps: number[] } | null {
  const n = state.length
  if (n < 1 || n > SHUTTERS_MAX) return null
  const masks = Array.from({ length: n }, (_, i) => [i, ...(links[i] ?? [])].filter((k) => k >= 0 && k < n).reduce((m, k) => m ^ (1 << k), 0))
  const from = state.reduce((m, open, i) => (open ? m | (1 << i) : m), 0)
  const full = (1 << n) - 1
  const prev = new Map<number, [number, number]>()
  prev.set(from, [-1, -1])
  const queue = [from]
  for (let q = 0; q < queue.length; q++) {
    const s = queue[q]!
    if (s === full) {
      const taps: number[] = []
      let cur = s
      while (cur !== from) {
        const [p, i] = prev.get(cur)!
        taps.unshift(i)
        cur = p
      }
      return { moves: taps.length, taps }
    }
    for (let i = 0; i < n; i++) {
      const t = s ^ masks[i]!
      if (prev.has(t)) continue
      prev.set(t, [s, i])
      queue.push(t)
    }
  }
  return null
}

/** The window the button "Help me" shows: the first tap of a shortest solution (null when all are open or there is none). */
export function shuttersHint(state: readonly boolean[], links: readonly (readonly number[])[]): number | null {
  return shuttersBest(state, links)?.taps[0] ?? null
}

/** The mistakes of a round: every two moves over the fewest moves are one mistake. */
export const shuttersMistakes = (moves: number, par: number): number => Math.floor(Math.max(0, moves - par) / 2)

/** The window an arrow key goes to: the nearest middle in that direction (the vertical distance counts as much as the horizontal one; `ratio` = width / height of the house). Null when there is none. */
export function shuttersNeighbour(windows: readonly ShutterWindow[], i: number, dir: Dir, ratio = 1.5): number | null {
  const mid = (w: ShutterWindow) => ({ x: w.x + w.w / 2, y: (w.y + w.h / 2) / ratio })
  const a = windows[i]
  if (!a) return null
  const pa = mid(a)
  let best: number | null = null
  let bestScore = Infinity
  windows.forEach((w, k) => {
    if (k === i) return
    const p = mid(w)
    const dx = p.x - pa.x
    const dy = p.y - pa.y
    const along = dir === 1 ? dx : dir === 3 ? -dx : dir === 2 ? dy : -dy
    const across = dir === 1 || dir === 3 ? Math.abs(dy) : Math.abs(dx)
    if (along <= 0.5 || across > along * 1.5) return
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = k
    }
  })
  return best
}

/** The problems of the data of `fensterlaeden` (an empty list is good). */
export function shuttersProblems(game: ShuttersGame): string[] {
  const out: string[] = []
  if (!game.shutter) out.push('no picture of the shutter')
  if (!game.lights.length) out.push('no pictures of the lit windows')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const count = r.windows.length
    if (!r.background) out.push(`round ${n}: no picture of the house`)
    if (count < 2) out.push(`round ${n}: fewer than two windows`)
    if (count > SHUTTERS_MAX) out.push(`round ${n}: more than ${SHUTTERS_MAX} windows`)
    if (r.links.length !== count) out.push(`round ${n}: ${count} windows but ${r.links.length} lists of neighbours`)
    if (r.start.length !== count) out.push(`round ${n}: ${count} windows but ${r.start.length} start values`)
    if (game.lights.length && game.lights.length < count) out.push(`round ${n}: fewer lit pictures than windows (the faces repeat)`)
    r.windows.forEach((w, i) => {
      if (w.x < 0 || w.y < 0 || w.w <= 0 || w.h <= 0 || w.x + w.w > 100 || w.y + w.h > 100) out.push(`round ${n}: window ${i + 1} lies outside the picture`)
      r.windows.forEach((o, k) => {
        if (k > i && w.x < o.x + o.w && o.x < w.x + w.w && w.y < o.y + o.h && o.y < w.y + w.h) out.push(`round ${n}: windows ${i + 1} and ${k + 1} overlap`)
      })
    })
    r.links.forEach((list, i) => {
      list.forEach((k) => {
        if (!Number.isInteger(k) || k < 0 || k >= count) out.push(`round ${n}: window ${i + 1} has the neighbour ${k}, which does not exist`)
        else if (k === i) out.push(`round ${n}: window ${i + 1} is its own neighbour`)
        else if (!(r.links[k] ?? []).includes(i)) out.push(`round ${n}: window ${i + 1} turns window ${k + 1}, but not the other way round`)
      })
      if (new Set(list).size !== list.length) out.push(`round ${n}: window ${i + 1} names a neighbour twice`)
    })
    if (r.start.length === count && r.links.length === count && count >= 1 && count <= SHUTTERS_MAX) {
      if (shuttersSolved(r.start)) out.push(`round ${n}: all windows are open at the start`)
      else {
        const best = shuttersBest(r.start, r.links)
        if (!best) out.push(`round ${n}: the start cannot be solved`)
        else if (best.moves !== r.par) out.push(`round ${n}: the fewest moves are ${best.moves}, not ${r.par} (par)`)
      }
    }
    if (r.par < 1) out.push(`round ${n}: par must be at least 1`)
  })
  return out
}
