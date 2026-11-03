/**
 * "Nehemias Mauer": the rules of the second big game (a block puzzle, drawn and touched in `BigGameMauer.vue`). Stones of one to four
 * squares are dragged onto a grid of 8 x 8; a full row or column becomes a finished layer of the wall. There is no clock and no enemy.
 * When no stone fits, the builders help and clear two rows (three times at most); only then the round ends. Everything here is plain
 * calculation, so it can be tested.
 */

export const SIZE = 8
/** How many different colours of stone there are (pictures `stein-1` to `stein-5`). */
export const TINTS = 5
/** How often the builders may help in one round. */
export const HELPS = 3
/** Seconds without a move until the hint shows where a stone fits. */
export const HINT_AFTER = 8

export type Cell = readonly [row: number, col: number]
export type Shape = readonly Cell[]

export interface Piece {
  shape: Shape
  tint: number
}

/** The shapes of the stones, with how often they come. Never turned, so a child always sees what it gets. */
const SHAPES: { cells: Shape; weight: number }[] = [
  { cells: [[0, 0]], weight: 3 },
  { cells: [[0, 0], [0, 1]], weight: 5 },
  { cells: [[0, 0], [1, 0]], weight: 5 },
  { cells: [[0, 0], [0, 1], [0, 2]], weight: 4 },
  { cells: [[0, 0], [1, 0], [2, 0]], weight: 4 },
  { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], weight: 2 },
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], weight: 2 },
  { cells: [[0, 0], [0, 1], [1, 0], [1, 1]], weight: 4 },
  // the small corner, four ways
  { cells: [[0, 0], [0, 1], [1, 0]], weight: 3 },
  { cells: [[0, 0], [0, 1], [1, 1]], weight: 3 },
  { cells: [[0, 0], [1, 0], [1, 1]], weight: 3 },
  { cells: [[0, 1], [1, 0], [1, 1]], weight: 3 },
  // the long corner (an L of four), four ways
  { cells: [[0, 0], [1, 0], [2, 0], [2, 1]], weight: 2 },
  { cells: [[0, 0], [0, 1], [0, 2], [1, 0]], weight: 2 },
  { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], weight: 2 },
  { cells: [[0, 2], [1, 0], [1, 1], [1, 2]], weight: 2 },
  { cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], weight: 1 }
]

export const SHAPE_LIST: readonly Shape[] = SHAPES.map((s) => s.cells)

export interface Level {
  id: 'schaftor' | 'fischtor' | 'taltor' | 'brunnentor' | 'fertig'
  /** The layers (full rows or columns) that finish the section. */
  goal: number
  /** The third star: finished with this many stones or fewer. */
  par: number
}

export const LEVELS: readonly Level[] = [
  // par: a player who follows the hint needs about 3.2 stones per layer; the third star is given up to 4 per layer plus 8
  { id: 'schaftor', goal: 4, par: 24 },
  { id: 'fischtor', goal: 6, par: 32 },
  { id: 'taltor', goal: 8, par: 40 },
  { id: 'brunnentor', goal: 10, par: 48 },
  { id: 'fertig', goal: 12, par: 56 }
]
/** Free building opens after this many sections (the third one). */
export const FREE_AFTER = 3
/** The "level" number of free building (after the five sections). */
export const FREE_LEVEL = LEVELS.length

export type Phase = 'play' | 'won' | 'ended'

export interface Game {
  /** 0 empty, otherwise the tint (1 to TINTS) of the stone that lies there. */
  board: number[]
  /** The three stones at the bottom; a placed one is null. */
  pieces: (Piece | null)[]
  /** The layers finished so far. */
  layers: number
  /** The stones placed so far. */
  placed: number
  /** The times the builders helped. */
  helps: number
  /** The goal of the section, 0 for free building. */
  goal: number
  par: number
  phase: Phase
  /** What the last move did (for sound and light): the rows and columns that were cleared. */
  cleared: { rows: number[]; cols: number[] }
  /** The last help: the rows the builders cleared. */
  helped: number[]
}

export const idx = (r: number, c: number) => r * SIZE + c

export function emptyBoard(): number[] {
  return new Array<number>(SIZE * SIZE).fill(0)
}

/** The size of a shape (rows and columns). */
export function extent(shape: Shape): { rows: number; cols: number } {
  return { rows: Math.max(...shape.map((c) => c[0])) + 1, cols: Math.max(...shape.map((c) => c[1])) + 1 }
}

export function canPlace(board: readonly number[], shape: Shape, r: number, c: number): boolean {
  return shape.every(([dr, dc]) => {
    const rr = r + dr
    const cc = c + dc
    return rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && board[idx(rr, cc)] === 0
  })
}

/** Every place where the shape fits. */
export function placements(board: readonly number[], shape: Shape): Cell[] {
  const out: Cell[] = []
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (canPlace(board, shape, r, c)) out.push([r, c])
  return out
}

export const fitsAnywhere = (board: readonly number[], shape: Shape): boolean => {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (canPlace(board, shape, r, c)) return true
  return false
}

/** True when at least one of the stones at the bottom still fits. */
export function hasMove(board: readonly number[], pieces: readonly (Piece | null)[]): boolean {
  return pieces.some((p) => p && fitsAnywhere(board, p.shape))
}

/** The full rows and columns of a board. */
export function fullLines(board: readonly number[]): { rows: number[]; cols: number[] } {
  const rows: number[] = []
  const cols: number[] = []
  for (let r = 0; r < SIZE; r++) if (Array.from({ length: SIZE }, (_, c) => board[idx(r, c)]).every((v) => v !== 0)) rows.push(r)
  for (let c = 0; c < SIZE; c++) if (Array.from({ length: SIZE }, (_, r) => board[idx(r, c)]).every((v) => v !== 0)) cols.push(c)
  return { rows, cols }
}

function pickShape(rand: () => number): Shape {
  const total = SHAPES.reduce((n, s) => n + s.weight, 0)
  let x = rand() * total
  for (const s of SHAPES) {
    x -= s.weight
    if (x < 0) return s.cells
  }
  return SHAPES[0]!.cells
}

/**
 * Three new stones. At least one of them always fits on the board (while there is any room at all), so a round never ends by bad luck
 * of the dice.
 */
export function dealPieces(board: readonly number[], rand: () => number = Math.random): Piece[] {
  const make = (shape: Shape): Piece => ({ shape, tint: 1 + Math.floor(rand() * TINTS) })
  for (let tries = 0; tries < 60; tries++) {
    const set = [make(pickShape(rand)), make(pickShape(rand)), make(pickShape(rand))]
    if (hasMove(board, set)) return set
  }
  // a crowded board: the smallest stone is dealt, if it fits anywhere
  const small = make(SHAPES[0]!.cells)
  return [small, make(pickShape(rand)), make(pickShape(rand))]
}

export function newGame(level: number, rand: () => number = Math.random): Game {
  const def = LEVELS[level]
  const board = emptyBoard()
  return {
    board,
    pieces: dealPieces(board, rand),
    layers: 0,
    placed: 0,
    helps: 0,
    goal: def?.goal ?? 0,
    par: def?.par ?? 0,
    phase: 'play',
    cleared: { rows: [], cols: [] },
    helped: []
  }
}

/**
 * Puts the stone of a slot on the board at (r, c). Returns false (and changes nothing) when it does not fit. Full rows and columns are
 * cleared at once and counted as layers. A section is won when its layers are reached; after the last stone of a set, three new ones come.
 */
export function place(g: Game, slot: number, r: number, c: number, rand: () => number = Math.random): boolean {
  const piece = g.pieces[slot]
  if (g.phase !== 'play' || !piece || !canPlace(g.board, piece.shape, r, c)) return false
  for (const [dr, dc] of piece.shape) g.board[idx(r + dr, c + dc)] = piece.tint
  g.pieces[slot] = null
  g.placed++
  const lines = fullLines(g.board)
  g.cleared = lines
  for (const row of lines.rows) for (let k = 0; k < SIZE; k++) g.board[idx(row, k)] = 0
  for (const col of lines.cols) for (let k = 0; k < SIZE; k++) g.board[idx(k, col)] = 0
  g.layers += lines.rows.length + lines.cols.length
  if (g.goal > 0 && g.layers >= g.goal) {
    g.phase = 'won'
    return true
  }
  if (g.pieces.every((p) => p === null)) g.pieces = dealPieces(g.board, rand)
  if (!hasMove(g.board, g.pieces)) {
    // nothing fits: the builders help, as long as they may; then the round ends
    if (g.helps >= HELPS) g.phase = 'ended'
  }
  return true
}

/** True while nothing fits and the builders can still help. */
export const needsHelp = (g: Game): boolean => g.phase === 'play' && !hasMove(g.board, g.pieces) && g.helps < HELPS

/** The builders clear the two fullest rows (not counted as layers). */
export function help(g: Game): void {
  if (!needsHelp(g)) return
  const filled = (r: number) => Array.from({ length: SIZE }, (_, c) => g.board[idx(r, c)]).filter((v) => v !== 0).length
  const rows = Array.from({ length: SIZE }, (_, r) => r)
    .sort((a, b) => filled(b) - filled(a) || a - b)
    .slice(0, 2)
    .sort((a, b) => a - b)
  for (const row of rows) for (let k = 0; k < SIZE; k++) g.board[idx(row, k)] = 0
  g.helps++
  g.helped = rows
  // the stones at the bottom stay; after the help one of them has to fit (two empty rows leave room for any stone of at most 2 rows)
  if (!hasMove(g.board, g.pieces)) g.pieces = dealPieces(g.board)
}

/** The stars of a won section: 1 for winning, 1 more without the builders' help, 1 more for few stones. */
export function starsFor(g: Game): number {
  if (g.phase !== 'won') return 0
  let n = 1
  if (g.helps === 0) n++
  if (g.placed <= g.par) n++
  return n
}

export interface Hint {
  slot: number
  row: number
  col: number
}

/** A place where a stone fits, the best one first: one that finishes a layer, then the one that fills a corner of the pile. */
export function findHint(board: readonly number[], pieces: readonly (Piece | null)[]): Hint | null {
  let bestHint: Hint | null = null
  let bestScore = -Infinity
  for (let slot = 0; slot < pieces.length; slot++) {
    const p = pieces[slot]
    if (!p) continue
    for (const [r, c] of placements(board, p.shape)) {
      const trial = board.slice()
      for (const [dr, dc] of p.shape) trial[idx(r + dr, c + dc)] = 1
      const lines = fullLines(trial)
      // lines first, then a bigger stone, then the lower left
      const score = (lines.rows.length + lines.cols.length) * 100 + p.shape.length * 4 - (r + c) * 0.01
      if (score > bestScore) {
        bestScore = score
        bestHint = { slot, row: r, col: c }
      }
    }
  }
  return bestHint
}
