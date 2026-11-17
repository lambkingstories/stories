/** "Jonatans Pfeile": the 44 levels with their solutions (the par of a level is the number of shots of its solution). */
import { newGame, type Game, type LevelDef, type Shot } from './bogenGame'
import { CHAPTERS, LEVEL_DEFS, PER_CHAPTER } from './bogenLevelDefs'
import { SOLUTIONS } from './bogenSolutions'

export interface Level {
  def: LevelDef
  /** The place in the whole list (0..43). */
  no: number
  /** The key of the solutions list, e.g. `2-05`. */
  id: string
  chapter: number
  index: number
  solution: Shot[]
  par: number
  /** The key of the hint shown once with this level. */
  intro?: string
  /** A level with things that move: shots have to be timed. */
  moving: boolean
}

export const LEVELS: Level[] = LEVEL_DEFS.map((def, no) => {
  const id = `${def.chapter + 1}-${String(def.index + 1).padStart(2, '0')}`
  const solution = SOLUTIONS[id] ?? []
  return { def, no, id, chapter: def.chapter, index: def.index, solution, par: Math.max(1, solution.length || 2), intro: def.intro, moving: def.items.some((i) => i.motion) }
})
export const LEVELS_PER_CHAPTER = PER_CHAPTER
export const CHAPTER_COUNT = CHAPTERS

/** A fresh game of a level. */
export const levelGame = (no: number): Game => {
  const l = LEVELS[no]!
  return newGame(l.def, l.par)
}
/** How many stars can be won in all levels together (three for each). */
export const MAX_STARS = LEVELS.length * 3
