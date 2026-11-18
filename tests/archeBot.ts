/**
 * A simple player for the tests of "Arche der Tierpaare": it looks at every move, values it by what it clears (the animals of the goals, the
 * obstacles next to the rows, the special stones that it makes) and plays the best one; now and then (`noise`) a random move. It has no
 * foresight, so a level that this bot wins in about every second try is easy enough for a child.
 */
import {
  BASKET,
  CRATE,
  DOVE_H,
  DOVE_V,
  NONE,
  OLIVE,
  RAINBOW,
  STAR2,
  STAR3,
  WATER,
  colOf,
  findMoves,
  goalLeft,
  isValidSwap,
  neighbours,
  newGame,
  rnd,
  rowOf,
  trySwap,
  type Game,
  type Level
} from '../src/utils/archeGame'

function swapT(g: Game, a: number, b: number) {
  const t = g.tiles[a] ?? null
  g.tiles[a] = g.tiles[b] ?? null
  g.tiles[b] = t
}

/** The cells of the rows that go through `idx` (empty when the animal is in no row), and which special stone they would make. */
function rowsThrough(g: Game, idx: number): { cells: number[]; special: number } {
  const t = g.tiles[idx]
  if (!t || t.kind >= BASKET) return { cells: [], special: 0 }
  const k = t.kind
  const r = rowOf(g, idx)
  const c = colOf(g, idx)
  const same = (i: number) => g.tiles[i]?.kind === k
  const h: number[] = [idx]
  for (let x = c - 1; x >= 0 && same(r * g.cols + x); x--) h.push(r * g.cols + x)
  for (let x = c + 1; x < g.cols && same(r * g.cols + x); x++) h.push(r * g.cols + x)
  const v: number[] = [idx]
  for (let y = r - 1; y >= 0 && same(y * g.cols + c); y--) v.push(y * g.cols + c)
  for (let y = r + 1; y < g.rows && same(y * g.cols + c); y++) v.push(y * g.cols + c)
  const hh = h.length >= 3
  const vv = v.length >= 3
  const cells = [...(hh ? h : []), ...(vv ? v.filter((x) => x !== idx || !hh) : [])]
  let special = 0
  if (h.length >= 5 || v.length >= 5) special = 3
  else if (hh && vv) special = 2
  else if (h.length === 4 || v.length === 4) special = 1
  return { cells, special }
}

/** How good a move is (higher is better). */
function value(g: Game, a: number, b: number): number {
  const ta = g.tiles[a]!
  const tb = g.tiles[b]!
  const goals = g.level.goals
  const need = (t: string, kind?: number) => goals.some((x, i) => x.t === t && (t !== 'kind' || x.kind === kind) && goalLeft(g, i) > 0)
  let v = 0
  if ((ta.special !== NONE && tb.special !== NONE) || ta.special === RAINBOW || tb.special === RAINBOW) v += 30
  swapT(g, a, b)
  const ra = rowsThrough(g, a)
  const rb = rowsThrough(g, b)
  const seen = new Set<number>([...ra.cells, ...rb.cells])
  const specials = [ra.special, rb.special].filter(Boolean)
  for (const s of specials) {
    v += s === 3 ? 12 : s === 2 ? 8 : 5
    if (s === 3 && need('rainbow')) v += 60
    if (s === 2 && need('olive')) v += 45
    if (s === 1 && need('dove')) v += 30
  }
  for (const idx of seen) {
    const t = g.tiles[idx]!
    v += 1
    if (need('kind', t.kind)) v += 4
    if (t.special !== NONE) v += 6
    if (t.cage) v += need('cage') ? 8 : 2
    if (t.net) v += need('net') ? 7 : 2
    for (const n of neighbours(g, idx)) {
      if (g.type[n] === WATER && need('water')) v += 4
      if (g.type[n] === CRATE && need('crate')) v += 3
    }
    // a basket above this row: clearing under it lets it fall
    if (need('basket')) {
      const c = colOf(g, idx)
      for (let r = 0; r < rowOf(g, idx); r++) if (g.tiles[r * g.cols + c]?.kind === BASKET) v += 9
    }
  }
  swapT(g, a, b)
  return v
}

/** Chooses a move (null: none). */
export function botMove(g: Game, noise = 0.15): { a: number; b: number } | null {
  const moves = findMoves(g)
  if (!moves.length) return null
  if (rnd(g) < noise) return moves[Math.floor(rnd(g) * moves.length)]!
  let best = moves[0]!
  let bestV = -1
  for (const m of moves) {
    const v = value(g, m.a, m.b) + rnd(g) * 0.5
    if (v > bestV) {
      bestV = v
      best = m
    }
  }
  return best
}

export interface PlayResult {
  won: boolean
  stars: number
  movesLeft: number
  score: number
}

/** Plays a level to the end with the bot. */
export function playLevel(level: Level, seed: number, noise = 0.15): PlayResult {
  const g = newGame(level, seed)
  // the bot has its own stream of random numbers, so that it does not change what falls
  const own = { rng: (seed ^ 0x9e3779b9) >>> 0 }
  let guard = 0
  while (g.phase === 'play' && guard++ < level.moves + 5) {
    const moves = findMoves(g)
    if (!moves.length) break
    let m: { a: number; b: number } | null
    if (rnd(own) < noise) m = moves[Math.floor(rnd(own) * moves.length)]!
    else {
      let best = moves[0]!
      let bv = -1
      for (const x of moves) {
        const v = value(g, x.a, x.b) + rnd(own) * 0.5
        if (v > bv) {
          bv = v
          best = x
        }
      }
      m = best
    }
    if (!isValidSwap(g, m.a, m.b)) break
    trySwap(g, m.a, m.b)
  }
  return { won: g.phase === 'won', stars: g.phase === 'won' ? (g.movesAtWin / level.moves >= STAR3 ? 3 : g.movesAtWin / level.moves >= STAR2 ? 2 : 1) : 0, movesLeft: g.movesAtWin, score: g.score }
}

export { DOVE_H, DOVE_V, OLIVE }
