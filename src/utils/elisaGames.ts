/**
 * The pure parts of the new games of "Elisha and Naaman" (the components only draw and listen): which jar the oil jug hangs over and how a jar fills and spills over (fill the jars), and the phases of a dip (dip seven times). Places are percent of the picture; where a height is mixed with a width the heights are first turned into units of the picture width (the pictures are 4:3).
 * Times are in milliseconds.
 */

/** A jar over which the jug can hang: the middle of its foot and its width (percent of the picture). */
export interface JarPlace {
  x: number
  y: number
  w: number
}

/** The jar under the jug, or -1: the jug hangs over a jar when its middle is within half the width of the jar and above the foot of the jar. */
export function jarAt(jug: { x: number; y: number }, jars: JarPlace[]): number {
  let best = -1
  let bestDx = Infinity
  jars.forEach((j, i) => {
    const dx = Math.abs(jug.x - j.x)
    if (dx <= Math.max(j.w * 0.55, 6) && jug.y < j.y - 4 && dx < bestDx) {
      best = i
      bestDx = dx
    }
  })
  return best
}

/** How long a full jar may keep getting oil before it spills over (ms). */
export const SPILL_MS = 450

export interface PourState {
  /** 0 empty to 1 full. */
  fill: number
  /** How long the jar got oil while it was already full. */
  over: number
}

/** One step of pouring: `dt` ms of oil into a jar that takes `ms` to fill; `spilled` is true the moment a full jar has got oil for `SPILL_MS`. */
export function pourStep(s: PourState, dt: number, ms: number): PourState & { spilled: boolean } {
  if (s.fill >= 1) {
    const over = s.over + dt
    return { fill: 1, over, spilled: s.over < SPILL_MS && over >= SPILL_MS }
  }
  const fill = Math.min(1, s.fill + dt / ms)
  return { fill, over: fill >= 1 ? 0 : s.over, spilled: false }
}

/** Whether every jar of a round is full. */
export function allFull(fills: number[]): boolean {
  return fills.length > 0 && fills.every((f) => f >= 1)
}

/** The way a jug is moved with the arrow keys: a step of this many percent. */
export const JUG_STEP = 5

/** The dip game: the phases of one dip (calm water, under water, the ring runs, all seven dips done). */
export type DivePhase = 'ready' | 'under' | 'rippling' | 'done'
