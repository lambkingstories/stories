/**
 * The 30 vessels of "Der Töpfer", in five chapters of six: the jug, the bowl, the lamp, the vase, the amphora. Each is a list of control
 * points `[height, radius]` of the profile (see `toepferGame.ts`). In every chapter two vessels start "spoiled" (Jeremiah 18:4): the
 * level begins with a bent, dented earlier vessel that has to be formed anew.
 */
import { THRESHOLDS, THRESHOLDS_EASY, cloneProfile, lumpProfile, profileFromPoints, spoiledStart, viewOf, type Profile, type Thresholds, type View } from './toepferGame'

export const CHAPTER_COUNT = 5
export const LEVELS_PER_CHAPTER = 6
export const LEVEL_COUNT = CHAPTER_COUNT * LEVELS_PER_CHAPTER

type Pts = ReadonlyArray<readonly [number, number]>

/** The vessels in order. The names are in the texts (`levels.<index>`). */
const SHAPES: Pts[] = [
  // 1 the jug
  [[0, 0.48], [0.4, 0.54], [0.8, 0.6]],
  [[0, 0.4], [0.25, 0.62], [0.55, 0.66], [0.85, 0.45], [1.0, 0.35], [1.15, 0.42]],
  [[0, 0.45], [0.3, 0.7], [0.7, 0.75], [1.05, 0.5], [1.3, 0.34], [1.5, 0.4]],
  [[0, 0.5], [0.3, 0.8], [0.65, 0.85], [0.95, 0.6], [1.1, 0.42], [1.3, 0.5]],
  [[0, 0.38], [0.4, 0.55], [0.9, 0.6], [1.3, 0.45], [1.55, 0.32], [1.75, 0.4]],
  [[0, 0.5], [0.35, 0.8], [0.8, 0.9], [1.25, 0.7], [1.55, 0.42], [1.75, 0.36], [1.9, 0.48]],
  // 2 the bowl
  [[0, 0.4], [0.1, 0.55], [0.35, 0.95], [0.45, 1.05]],
  [[0, 0.35], [0.2, 0.6], [0.55, 0.9], [0.8, 1.0]],
  [[0, 0.4], [0.12, 0.7], [0.3, 1.0], [0.4, 1.12]],
  [[0, 0.3], [0.25, 0.55], [0.6, 0.85], [1.0, 0.95]],
  [[0, 0.45], [0.15, 0.75], [0.5, 0.95], [0.7, 0.95], [0.75, 0.85]],
  [[0, 0.5], [0.1, 0.3], [0.3, 0.28], [0.45, 0.45], [0.75, 0.95], [0.95, 1.05]],
  // 3 the lamp
  [[0, 0.35], [0.15, 0.6], [0.35, 0.65], [0.55, 0.4], [0.65, 0.22], [0.75, 0.3]],
  [[0, 0.55], [0.12, 0.8], [0.3, 0.85], [0.55, 0.5], [0.75, 0.22], [0.9, 0.3]],
  [[0, 0.3], [0.3, 0.45], [0.7, 0.45], [0.95, 0.2], [1.15, 0.15], [1.3, 0.3]],
  [[0, 0.45], [0.25, 0.75], [0.5, 0.7], [0.8, 0.3], [1.05, 0.2], [1.2, 0.35]],
  [[0, 0.55], [0.1, 0.3], [0.4, 0.25], [0.6, 0.5], [0.85, 0.7], [1.05, 0.45], [1.2, 0.25], [1.3, 0.32]],
  [[0, 0.5], [0.3, 0.9], [0.6, 0.95], [0.95, 0.5], [1.2, 0.24], [1.35, 0.2], [1.5, 0.38]],
  // 4 the vase
  [[0, 0.35], [0.5, 0.45], [1.0, 0.5], [1.5, 0.35], [1.7, 0.3], [1.85, 0.4]],
  [[0, 0.4], [0.35, 0.8], [0.7, 0.95], [1.1, 0.7], [1.4, 0.35], [1.6, 0.4]],
  [[0, 0.4], [0.4, 0.6], [0.9, 0.45], [1.4, 0.5], [1.75, 0.3], [1.95, 0.4]],
  [[0, 0.45], [0.35, 0.7], [0.7, 0.72], [1.0, 0.3], [1.5, 0.2], [1.9, 0.22], [2.0, 0.34]],
  [[0, 0.4], [0.25, 0.7], [0.5, 0.72], [0.75, 0.38], [1.0, 0.7], [1.25, 0.72], [1.5, 0.4], [1.7, 0.4], [1.85, 0.5]],
  [[0, 0.45], [0.1, 0.3], [0.25, 0.38], [0.5, 0.85], [0.9, 0.9], [1.3, 0.5], [1.55, 0.28], [1.75, 0.3], [1.95, 0.5]],
  // 5 the amphora
  [[0, 0.25], [0.3, 0.6], [0.7, 0.75], [1.1, 0.55], [1.35, 0.3], [1.55, 0.32], [1.65, 0.42]],
  [[0, 0.2], [0.35, 0.55], [0.8, 0.8], [1.3, 0.62], [1.65, 0.3], [1.9, 0.28], [2.0, 0.4]],
  [[0, 0.22], [0.5, 0.5], [1.0, 0.72], [1.55, 0.55], [1.9, 0.28], [2.15, 0.25], [2.25, 0.38]],
  [[0, 0.12], [0.45, 0.5], [0.95, 0.72], [1.45, 0.7], [1.8, 0.34], [2.05, 0.3], [2.15, 0.42]],
  [[0, 0.3], [0.4, 0.68], [0.95, 0.92], [1.5, 0.7], [1.8, 0.35], [2.0, 0.3], [2.1, 0.4], [2.2, 0.5]],
  [[0, 0.35], [0.12, 0.25], [0.3, 0.5], [0.9, 0.95], [1.5, 0.78], [1.8, 0.32], [2.0, 0.28], [2.15, 0.42], [2.25, 0.52]]
]

export interface Level {
  index: number
  chapter: number
  place: number
  spoiled: boolean
  pts: Pts
}

/** Two vessels of every chapter start spoiled: the fourth and the sixth. */
export const LEVELS: Level[] = SHAPES.map((pts, index) => {
  const place = index % LEVELS_PER_CHAPTER
  return { index, chapter: Math.floor(index / LEVELS_PER_CHAPTER), place, spoiled: place === 3 || place === 5, pts }
})

const targets: Profile[] = []
/** The template of a level (shared: do not change it). */
export function levelTarget(i: number): Profile {
  return (targets[i] ??= profileFromPoints(LEVELS[i]!.pts))
}

export function levelView(i: number): View {
  return viewOf(levelTarget(i))
}

export function levelThresholds(i: number): Thresholds {
  return LEVELS[i]!.chapter === 0 ? THRESHOLDS_EASY : THRESHOLDS
}

/** The clay a level starts with: the lump, or the spoiled earlier vessel (the one of the level before). */
export function levelStart(i: number): Profile {
  const L = LEVELS[i]!
  if (!L.spoiled || i === 0) return lumpProfile()
  return spoiledStart(cloneProfile(levelTarget(i - 1)), i + 1)
}
