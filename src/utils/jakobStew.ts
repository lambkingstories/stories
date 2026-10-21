/**
 * The small pure functions of the stew game of "Jakob" (stage 1, "Cook the soup before Esau comes"): what is in the pot, whether the soup is ready, the picture of the pot,
 * and where Esau is on his way. The game only draws what these say; the tests use them directly.
 */
export type StewSourceId = 'bowl' | 'jug' | 'wood'

/** What is in the pot: the lentils and the water once each, the logs twice. */
export interface StewState {
  bowl: number
  jug: number
  wood: number
}

/** How often a source is used until it is spent. */
export const STEW_NEED: Record<StewSourceId, number> = { bowl: 1, jug: 1, wood: 2 }

export const stewStart = (): StewState => ({ bowl: 0, jug: 0, wood: 0 })

/** A source that is spent does no more (a tap on it is a soft shake, no mistake). */
export const stewCan = (state: StewState, source: StewSourceId): boolean => state[source] < STEW_NEED[source]

/** The state after a source is used (the same state when it is spent). */
export function stewAdd(state: StewState, source: StewSourceId): StewState {
  return stewCan(state, source) ? { ...state, [source]: state[source] + 1 } : state
}

/** Lentils, water and two logs are there: the soup can cook. */
export const stewReady = (state: StewState): boolean => state.bowl >= 1 && state.jug >= 1 && state.wood >= 2

export type PotKey = 'empty' | 'lentils' | 'water' | 'soup'

/** The picture of the pot: empty, only lentils, only water, or both (the red soup). */
export function potKey(state: StewState): PotKey {
  if (state.bowl && state.jug) return 'soup'
  if (state.bowl) return 'lentils'
  if (state.jug) return 'water'
  return 'empty'
}

/** The fire: none, a small flame (one log) or a big one (two logs). */
export const fireSize = (state: StewState): 0 | 1 | 2 => (state.wood >= 2 ? 2 : state.wood >= 1 ? 1 : 0)

export interface StewPoint {
  x: number
  y: number
}

/** The point on a line of points after `progress` (0 to 1) of its length, counted by the length of the line (not by the number of points). */
export function esauAt(path: [number, number][], progress: number): StewPoint {
  if (!path.length) return { x: 0, y: 0 }
  const p = Math.min(1, Math.max(0, progress))
  const parts = path.slice(1).map((pt, i) => Math.hypot(pt[0] - path[i]![0], pt[1] - path[i]![1]))
  const total = parts.reduce((a, b) => a + b, 0)
  if (!total || p === 0) return { x: path[0]![0], y: path[0]![1] }
  let rest = p * total
  for (let i = 0; i < parts.length; i++) {
    if (rest <= parts[i]! || i === parts.length - 1) {
      const f = parts[i]! ? Math.min(1, rest / parts[i]!) : 0
      return { x: path[i]![0] + (path[i + 1]![0] - path[i]![0]) * f, y: path[i]![1] + (path[i + 1]![1] - path[i]![1]) * f }
    }
    rest -= parts[i]!
  }
  const last = path[path.length - 1]!
  return { x: last[0], y: last[1] }
}

/** How big Esau is on his way: 55 percent of his size far away, all of it at the tent. */
export const esauScale = (progress: number): number => 0.55 + 0.45 * Math.min(1, Math.max(0, progress))

/** How long Esau walks in a try: slower after each new start, but never longer than `maxMs` (the game says nothing of it). */
export const walkDuration = (restarts: number, walkMs: number, slowerMs: number, maxMs: number): number => Math.min(maxMs, walkMs + Math.max(0, restarts) * slowerMs)

/** With reduced motion Esau does not glide, he jumps in six steps. */
export const stepped = (progress: number, steps = 6): number => Math.min(1, Math.floor(Math.min(1, Math.max(0, progress)) * steps) / steps)

/** The words that tell how far Esau is (for the screen reader): after a third, two thirds and nearly there. */
export function esauSaid(progress: number): 'far' | 'near' | 'almost' | null {
  if (progress >= 0.9) return 'almost'
  if (progress >= 2 / 3) return 'near'
  if (progress >= 1 / 3) return 'far'
  return null
}
