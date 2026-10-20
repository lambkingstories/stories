/**
 * The small pure functions of the new games of "Jakob": the slide puzzle (the board, the moves, the mixing that always leaves a puzzle that can be solved), the crank
 * (how far a finger that turns round a crank has turned it) and the holding game (how far the morning has come while a finger holds the light, and where a light
 * that wanders stands). The games only draw what these say; the tests use them directly.
 */

// ------------------------------------------------------------------ the slide puzzle

/** The board: `board[place]` is the number of the piece that lies at that place (rows from the top, left to right). The piece with the highest number is the gap. */
export type Board = number[]

/** The finished picture: every piece at its own place. */
export const solvedBoard = (cols: number, rows: number): Board => Array.from({ length: cols * rows }, (_, i) => i)

export const isSolved = (board: Board): boolean => board.every((piece, place) => piece === place)

/** The place of the gap. */
export const gapOf = (board: Board): number => board.indexOf(board.length - 1)

const near = (a: number, b: number, cols: number) => {
  const dc = Math.abs((a % cols) - (b % cols))
  const dr = Math.abs(Math.floor(a / cols) - Math.floor(b / cols))
  return dc + dr === 1
}

/** The places of the tiles next to the gap (the ones that can be slid). */
export function neighbors(board: Board, cols: number): number[] {
  const gap = gapOf(board)
  return board.map((_, place) => place).filter((place) => near(place, gap, cols))
}

/** The tile at `place` is slid into the gap. Returns the new board, or `null` when the tile is not next to the gap. */
export function move(board: Board, cols: number, place: number): Board | null {
  const gap = gapOf(board)
  if (place === gap || !near(place, gap, cols)) return null
  const next = [...board]
  next[gap] = board[place]!
  next[place] = board[gap]!
  return next
}

/** A small random generator that gives the same numbers for the same seed (a round is the same every time, and the tests can rely on it). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Mixes the finished picture by `moves` random moves of the tile next to the gap (never the move that undoes the one before). A board that comes about by moves
 * from the finished one can always be slid back, so the puzzle can always be solved. The result is never the finished picture.
 */
export function scramble(cols: number, rows: number, moves: number, seed: number): Board {
  const rand = seeded(seed)
  let board = solvedBoard(cols, rows)
  let before = -1
  const total = Math.max(1, moves)
  for (let i = 0; i < total || isSolved(board); i++) {
    const gap = gapOf(board)
    const choices = neighbors(board, cols).filter((p) => p !== before)
    const place = choices[Math.floor(rand() * choices.length)]!
    board = move(board, cols, place)!
    before = gap
    if (i > total + 200) break
  }
  return board
}

// ------------------------------------------------------------------ the crank

/** One full turn of the crank, and how many turns fill a bucket. */
export const TURN = 360
export const TURNS_PER_BUCKET = 3
export const FULL = TURN * TURNS_PER_BUCKET

export interface CrankState {
  /** How far the crank has been turned in the direction that draws the bucket up (0 to `FULL`). */
  turned: number
  /** The direction that draws the bucket up (1 or -1): the one in which the finger turned first. 0 while nothing has been turned. */
  dir: 0 | 1 | -1
  /** The angle of the finger on its last move (`null` while no finger is on the crank). */
  last: number | null
}

export const startCrank = (): CrankState => ({ turned: 0, dir: 0, last: null })

/** The angle of a point seen from the middle of the crank, in degrees (a height counts as much as a width: `ratio` is the height of one unit divided by its width). */
export function angleOf(center: { x: number; y: number }, point: { x: number; y: number }, ratio = 1): number {
  return (Math.atan2((point.y - center.y) * ratio, point.x - center.x) * 180) / Math.PI
}

const wrap = (deg: number) => {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

/** A finger is put on the crank. */
export const grab = (state: CrankState, angle: number): CrankState => ({ ...state, last: angle })

/** A finger is lifted: the bucket stays where it is. */
export const release = (state: CrankState): CrankState => ({ ...state, last: null })

/**
 * The finger moves to `angle`: the crank follows. The first direction in which a finger turns draws the bucket up, turning back lets it down again (never below the
 * bottom, so nothing is lost); when the bucket is all the way down, the next turn may choose the other direction.
 */
export function crank(state: CrankState, angle: number): CrankState {
  if (state.last === null) return { ...state, last: angle }
  const delta = wrap(angle - state.last)
  if (delta === 0) return { ...state, last: angle }
  const dir = state.dir === 0 || state.turned === 0 ? (delta > 0 ? 1 : -1) : state.dir
  const turned = Math.min(FULL, Math.max(0, state.turned + delta * dir))
  return { turned, dir: turned === 0 ? 0 : dir, last: angle }
}

/** A step without circling (the button or the keyboard): a part of a turn in the direction that draws the bucket up. */
export function crankStep(state: CrankState, degrees = 135): CrankState {
  return { turned: Math.min(FULL, state.turned + degrees), dir: 1, last: state.last }
}

/** How full the bucket is, from 0 (down) to 1 (up). */
export const bucketLevel = (state: CrankState): number => state.turned / FULL

// ------------------------------------------------------------------ holding the light

/**
 * The morning comes while the light is held: `progress` (0 to 1) grows by `dt` seconds out of the `seconds` of the round, but only while the finger is on the
 * light. Letting go changes nothing; there is no way back.
 */
export function holdProgress(progress: number, dt: number, onTarget: boolean, seconds: number): number {
  if (!onTarget || seconds <= 0) return progress
  // rounded, so that ten steps of a tenth really make a whole (0.1 added ten times is a little less than 1)
  return Math.min(1, Math.round((progress + dt / seconds) * 1e6) / 1e6)
}

/** Where a light that wanders along `path` (points in percent of the picture) stands when `t` (0 to 1) of the way is done; the points are passed at the same speed. */
export function pointAt(path: [number, number][], t: number, ratio = 1): [number, number] {
  if (path.length === 0) return [50, 50]
  if (path.length === 1) return path[0]!
  const len = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], (b[1] - a[1]) * ratio)
  let total = 0
  for (let i = 1; i < path.length; i++) total += len(path[i - 1]!, path[i]!)
  let left = Math.min(1, Math.max(0, t)) * total
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    const l = len(a, b)
    if (left <= l || i === path.length - 1) {
      const f = l === 0 ? 0 : Math.min(1, left / l)
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    left -= l
  }
  return path[path.length - 1]!
}

/** Is a finger on the light? (`radius` in percent of the width of the picture; a height counts with `ratio`.) */
export const onSpark = (finger: { x: number; y: number }, spark: { x: number; y: number }, radius: number, ratio = 1): boolean =>
  Math.hypot(finger.x - spark.x, (finger.y - spark.y) * ratio) <= radius

/** The whole game in percent: the rounds that are done and the part of the round that is going. */
export const wholePercent = (round: number, rounds: number, progress: number): number => Math.min(100, Math.floor(((round + progress) / Math.max(1, rounds)) * 100 + 1e-9))
