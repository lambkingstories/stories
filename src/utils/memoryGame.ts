/**
 * The memory game: every pair is the same big painted scene of a Bible story, twice. Three sizes (small, medium, large). These are the pure
 * parts (the cards, the match, the turns), so they can be tested.
 */
import { MEMORY_SCENES } from '@/data/memoryScenes'
import { shuffle } from '@/utils/familyQuiz'

export type MemorySize = 'small' | 'medium' | 'large'
export const MEMORY_SIZES: Record<MemorySize, { cols: number; pairs: number }> = {
  small: { cols: 4, pairs: 6 },
  medium: { cols: 4, pairs: 10 },
  large: { cols: 5, pairs: 15 }
}
export const MEMORY_SIZE_LIST: readonly MemorySize[] = ['small', 'medium', 'large']
export const MEMORY_MAX_PLAYERS = 4

export interface MemoryCard {
  /** The place of the card in the game. */
  id: number
  /** Which scene (number in `MEMORY_SCENES`) the card shows. */
  scene: number
}

/** The cards of a game: `pairs` different scenes, each twice, shuffled. */
export function buildMemory(pairs: number, rand: () => number = Math.random, scenes: number = MEMORY_SCENES.length): MemoryCard[] {
  const chosen = shuffle(Array.from({ length: scenes }, (_, i) => i), rand).slice(0, Math.max(0, Math.min(pairs, scenes)))
  return shuffle(chosen.flatMap((scene) => [scene, scene]), rand).map((scene, id) => ({ id, scene }))
}

/** Two cards are a pair when they show the same scene and are not the same card. */
export const isMatch = (a: MemoryCard, b: MemoryCard): boolean => a.id !== b.id && a.scene === b.scene

/** Who is on turn: after a pair the same person goes on, after a miss the next one. */
export const nextPlayer = (current: number, players: number, matched: boolean): number => (players <= 0 ? 0 : matched ? current : (current + 1) % players)

// ── "keep playing": the round on the device ────────────────────────────────────────────────────────────────────────
/** Everything that is needed to take up a memory round again (plain data): the mix of the cards, the turned and found ones, the turn. */
export interface MemorySnap {
  size: MemorySize
  playerCount: number
  names: string[]
  cards: MemoryCard[]
  /** The cards that are turned over now (at most two; two that are no pair mean a miss that was not hidden yet). */
  open: number[]
  /** The cards of the pairs that are found. */
  found: number[]
  turn: number
  scores: number[]
  moves: number
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const isIds = (v: unknown, size: number): v is number[] => Array.isArray(v) && v.every((x) => isInt(x, 0, size - 1)) && new Set(v).size === v.length

/** The kept round if it has the expected shape and makes sense, else `null`. A broken or old state never reaches the game. */
export function parseMemorySnap(raw: unknown, scenes: number = MEMORY_SCENES.length): MemorySnap | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (typeof s.size !== 'string' || !MEMORY_SIZE_LIST.includes(s.size as MemorySize)) return null
  const size = s.size as MemorySize
  const total = MEMORY_SIZES[size].pairs * 2
  if (!isInt(s.playerCount, 1, MEMORY_MAX_PLAYERS) || !Array.isArray(s.names) || s.names.length > 8 || !s.names.every((x) => typeof x === 'string' && x.length <= 200)) return null
  if (!Array.isArray(s.cards) || s.cards.length !== total) return null
  const cards: MemoryCard[] = []
  const perScene = new Map<number, number>()
  for (let i = 0; i < s.cards.length; i++) {
    const c = s.cards[i] as Record<string, unknown> | null
    if (!c || typeof c !== 'object' || c.id !== i || !isInt(c.scene, 0, scenes - 1)) return null
    cards.push({ id: i, scene: c.scene })
    perScene.set(c.scene, (perScene.get(c.scene) ?? 0) + 1)
  }
  if ([...perScene.values()].some((n) => n !== 2)) return null
  if (!isIds(s.open, total) || s.open.length > 2 || !isIds(s.found, total) || s.found.length % 2 !== 0) return null
  const found = s.found
  if (s.open.some((id) => found.includes(id))) return null
  // the found cards come in complete pairs
  const foundScenes = new Map<number, number>()
  for (const id of found) foundScenes.set(cards[id]!.scene, (foundScenes.get(cards[id]!.scene) ?? 0) + 1)
  if ([...foundScenes.values()].some((n) => n !== 2)) return null
  // two cards that are turned over and form a pair would have been taken at once
  if (s.open.length === 2 && isMatch(cards[s.open[0]!]!, cards[s.open[1]!]!)) return null
  if (!isInt(s.turn, 0, s.playerCount - 1) || !isInt(s.moves, 0, 100000)) return null
  if (!Array.isArray(s.scores) || s.scores.length !== s.playerCount || !s.scores.every((x) => isInt(x, 0, total))) return null
  if ((s.scores as number[]).reduce((a, b) => a + b, 0) !== found.length / 2) return null
  return { size, playerCount: s.playerCount, names: s.names as string[], cards, open: s.open, found, turn: s.turn, scores: s.scores as number[], moves: s.moves }
}

/**
 * The best number of columns for a board that has to fit into `width` x `height` pixels (turned phone): the cards (height = `ratio` x width)
 * are as big as possible and all of them are seen without scrolling. Returns the columns and the width of one card.
 */
export function bestColumns(count: number, width: number, height: number, ratio = 1.5, gap = 8): { cols: number; cardWidth: number } {
  let best = { cols: 1, cardWidth: 0 }
  for (let cols = 1; cols <= Math.max(1, count); cols++) {
    const rows = Math.ceil(count / cols)
    const byWidth = (width - gap * (cols - 1)) / cols
    const byHeight = (height - gap * (rows - 1)) / rows / ratio
    const cardWidth = Math.floor(Math.min(byWidth, byHeight))
    if (cardWidth > best.cardWidth) best = { cols, cardWidth }
  }
  return best
}
