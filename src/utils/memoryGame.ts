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
