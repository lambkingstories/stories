/**
 * The rules of one game of the Wortreise (pure, no Vue): a journey of some stages (one puzzle each), the people take turns, a turn ends when a
 * word of the grid was found or when the person passes. The state is plain data (`WrGame`), so it can be kept on the device and taken up again.
 */
import {
  WR_LANGS,
  WR_LEVELS,
  WR_MAX_PLAYERS,
  WR_STAGE_BONUS,
  bonusPoints,
  emptyProgress,
  judge,
  makePuzzle,
  mixSeed,
  pickHint,
  puzzleDone,
  wordPoints,
  wrHintsFor,
  type Rand,
  type WrLang,
  type WrLevel,
  type WrProgress,
  type WrPuzzle
} from './wortreise'

export interface WrConfig {
  lang: WrLang
  level: WrLevel
  players: number
  /** The number of puzzles of the journey (3, 5 or 7). */
  stages: number
  /** The seed of the journey: the same seed makes the same puzzles. */
  seed: number
}

export interface WrGame {
  cfg: WrConfig
  /** The puzzle that is played (0-based). */
  stage: number
  /** The person whose turn it is (0-based). */
  turn: number
  scores: number[]
  /** How many words of the grid and how many bonus words each person found (for the end). */
  words: number[]
  bonusWords: number[]
  progress: WrProgress
  /** Shared helps that are left (a shown letter). */
  hints: number
  /** How many people passed one after the other (when all have passed, a letter is shown for free). */
  passes: number
  /** Who filled the last square of each finished stage. */
  stageWinners: number[]
  /** All stages are done. */
  over: boolean
}

/** Which of the seven places of the journey each length of a journey passes (indexes into the list of places in the texts). */
export const WR_ROUTES: Record<number, number[]> = { 3: [2, 4, 6], 5: [0, 2, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] }
export const WR_PLACE_COUNT = 7

const stageCache = new Map<string, WrPuzzle[]>()

/** All puzzles of a journey, each with another word for its letters. */
export function buildStages(cfg: WrConfig): WrPuzzle[] {
  const id = `${cfg.lang}-${cfg.level}-${cfg.stages}-${cfg.seed}`
  const have = stageCache.get(id)
  if (have) return have
  const out: WrPuzzle[] = []
  const used: string[] = []
  for (let i = 0; i < cfg.stages; i++) {
    const p = makePuzzle(cfg.lang, cfg.level, mixSeed(cfg.seed, i, 99) % 100000, used)
    used.push(p.root)
    out.push(p)
  }
  if (stageCache.size > 20) stageCache.clear()
  stageCache.set(id, out)
  return out
}

export const puzzleOf = (g: WrGame): WrPuzzle => buildStages(g.cfg)[Math.min(g.stage, g.cfg.stages - 1)]!

export function newGame(cfg: WrConfig): WrGame {
  const zeros = () => Array.from({ length: cfg.players }, () => 0)
  return {
    cfg,
    stage: 0,
    turn: 0,
    scores: zeros(),
    words: zeros(),
    bonusWords: zeros(),
    progress: emptyProgress(),
    hints: wrHintsFor(cfg.stages),
    passes: 0,
    stageWinners: [],
    over: false
  }
}

function copy(g: WrGame): WrGame {
  return {
    ...g,
    scores: [...g.scores],
    words: [...g.words],
    bonusWords: [...g.bonusWords],
    stageWinners: [...g.stageWinners],
    progress: { found: [...g.progress.found], bonusFound: [...g.progress.bonusFound], shown: [...g.progress.shown] }
  }
}

export interface WrMove {
  game: WrGame
  /** What the typed word was. */
  result: 'grid' | 'bonus' | 'again' | 'no'
  points: number
  /** The grid is full now (the person gets the bonus for the stage in `points` already). */
  stageDone: boolean
  /** The turn is over (a word of the grid was found). */
  endsTurn: boolean
}

/** A person typed a word. A word of the grid gives points and ends the turn, a bonus word gives a point or two, the turn goes on. */
export function submit(game: WrGame, typed: string): WrMove {
  const p = puzzleOf(game)
  const result = judge(p, game.progress, typed)
  if (result === 'no' || result === 'again') return { game, result, points: 0, stageDone: false, endsTurn: false }
  const g = copy(game)
  const key = typed.toUpperCase()
  g.passes = 0
  if (result === 'bonus') {
    g.progress.bonusFound.push(key)
    const pts = bonusPoints(key.length)
    g.scores[g.turn] = (g.scores[g.turn] ?? 0) + pts
    g.bonusWords[g.turn] = (g.bonusWords[g.turn] ?? 0) + 1
    return { game: g, result, points: pts, stageDone: false, endsTurn: false }
  }
  g.progress.found.push(key)
  let pts = wordPoints(key.length)
  g.words[g.turn] = (g.words[g.turn] ?? 0) + 1
  const stageDone = puzzleDone(p, g.progress)
  if (stageDone) {
    pts += WR_STAGE_BONUS
    g.stageWinners.push(g.turn)
  }
  g.scores[g.turn] = (g.scores[g.turn] ?? 0) + pts
  return { game: g, result, points: pts, stageDone, endsTurn: true }
}

export interface WrHintMove {
  game: WrGame
  cell: [number, number] | null
  stageDone: boolean
}

/** Shows a letter: from the shared helps, or for free when `free` (after a round in which everybody passed). */
export function showLetter(game: WrGame, rand: Rand = Math.random, free = false): WrHintMove {
  const p = puzzleOf(game)
  if (!free && game.hints <= 0) return { game, cell: null, stageDone: false }
  const cell = pickHint(p, game.progress, rand)
  if (!cell) return { game, cell: null, stageDone: false }
  const g = copy(game)
  g.progress.shown.push(`${cell[0]},${cell[1]}`)
  if (!free) g.hints--
  const stageDone = puzzleDone(p, g.progress)
  if (stageDone) {
    g.stageWinners.push(g.turn)
    g.scores[g.turn] = (g.scores[g.turn] ?? 0) + WR_STAGE_BONUS
  }
  return { game: g, cell, stageDone }
}

/** How many passes in a row show a letter for free: everybody has passed once; a person who plays alone passes three times. */
export const passesForFreeLetter = (players: number): number => (players <= 1 ? 3 : players)

/** The person passes. When everybody passed one after the other, a letter is shown for free. */
export function pass(game: WrGame, rand: Rand = Math.random): WrHintMove & { freeLetter: boolean } {
  const g = copy(game)
  g.passes++
  if (g.passes >= passesForFreeLetter(g.cfg.players)) {
    g.passes = 0
    const m = showLetter(g, rand, true)
    return { ...m, freeLetter: m.cell !== null }
  }
  return { game: g, cell: null, stageDone: false, freeLetter: false }
}

/** The next person is on turn. */
export function endTurn(game: WrGame): WrGame {
  const g = copy(game)
  g.turn = (g.turn + 1) % g.cfg.players
  return g
}

/** Goes on to the next puzzle, or finishes the journey after the last one. */
export function nextStage(game: WrGame): WrGame {
  const g = copy(game)
  g.stage++
  g.progress = emptyProgress()
  g.passes = 0
  if (g.stage >= g.cfg.stages) {
    g.stage = g.cfg.stages - 1
    g.over = true
  }
  return g
}

/** The kept game, or null when it does not look like a game of this version (a number is missing, a list has the wrong length). */
export function parseGame(raw: unknown): WrGame | null {
  const g = raw as WrGame | null
  if (!g || typeof g !== 'object' || !g.cfg || typeof g.cfg !== 'object') return null
  const c = g.cfg
  if (!WR_LANGS.includes(c.lang) || !WR_LEVELS.includes(c.level)) return null
  if (!Number.isInteger(c.players) || c.players < 1 || c.players > WR_MAX_PLAYERS) return null
  if (![3, 5, 7].includes(c.stages) || !Number.isFinite(c.seed)) return null
  const n = c.players
  const nums = (a: unknown, len: number) => Array.isArray(a) && a.length === len && a.every((x) => Number.isFinite(x))
  if (!nums(g.scores, n) || !nums(g.words, n) || !nums(g.bonusWords, n)) return null
  if (!Number.isInteger(g.stage) || g.stage < 0 || g.stage >= c.stages) return null
  if (!Number.isInteger(g.turn) || g.turn < 0 || g.turn >= n) return null
  const pr = g.progress
  if (!pr || !Array.isArray(pr.found) || !Array.isArray(pr.bonusFound) || !Array.isArray(pr.shown)) return null
  if (![...pr.found, ...pr.bonusFound, ...pr.shown].every((x) => typeof x === 'string')) return null
  if (!Number.isInteger(g.hints) || g.hints < 0 || !Number.isInteger(g.passes) || g.passes < 0) return null
  if (!Array.isArray(g.stageWinners) || g.stageWinners.length > c.stages) return null
  // the kept words must be words of this puzzle (a changed word list would break it)
  const p = buildStages(c)[g.stage]
  if (!p) return null
  if (!pr.found.every((k) => p.words.some((w) => w.key === k)) || !pr.bonusFound.every((k) => p.bonus.includes(k))) return null
  return { ...g, over: false }
}
