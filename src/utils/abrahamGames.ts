/**
 * The small pure functions of the new games of "Abraham": the camel game (do the packs of a camel weigh the same on both sides, can they be spread so, which
 * pack is the next one to move) and the constellation game (which star of the model a star that was laid belongs to). The games only draw what these say;
 * the tests use them directly.
 */
import type { Clue } from '@/types/adventure'

// ------------------------------------------------------------------ the camels

export type Side = 'left' | 'right'

const sum = (w: number[]) => w.reduce((a, b) => a + b, 0)

/** Both sides weigh the same and at least one pack lies in the baskets. */
export function isBalanced(left: number[], right: number[]): boolean {
  return left.length + right.length > 0 && sum(left) === sum(right)
}

/** Every way to spread the weights over the two baskets so that both sides weigh the same (a list of sides, one per weight). */
export function splits(weights: number[]): Side[][] {
  const total = sum(weights)
  if (!weights.length || total % 2 !== 0 || weights.length > 14) return []
  const out: Side[][] = []
  for (let mask = 0; mask < 1 << weights.length; mask++) {
    let left = 0
    for (let i = 0; i < weights.length; i++) if (mask & (1 << i)) left += weights[i]!
    if (left * 2 === total) out.push(weights.map((_, i) => (mask & (1 << i) ? 'left' : 'right')))
  }
  return out
}

/** Can the weights be spread over the two baskets so that both sides weigh the same? Every camel of the game has to be solvable. */
export const solvable = (weights: number[]): boolean => splits(weights).length > 0

/**
 * The tip: of all the ways to balance the camel, the one that is nearest to what lies in the baskets now (packs that are not in a basket count as different),
 * and the first pack that is not where it belongs in it. Nothing is left to do (`null`) when the camel is balanced already or cannot be balanced.
 */
export function tip(weights: number[], sides: (Side | null)[]): { index: number; side: Side } | null {
  let best: Side[] | null = null
  let bestDiff = Infinity
  for (const s of splits(weights)) {
    const diff = s.reduce((n, side, i) => n + (sides[i] === side ? 0 : 1), 0)
    if (diff < bestDiff) {
      best = s
      bestDiff = diff
    }
  }
  if (!best || bestDiff === 0) return null
  const index = best.findIndex((side, i) => sides[i] !== side)
  return { index, side: best[index]! }
}

// ------------------------------------------------------------------ the constellation

export interface Pt {
  x: number
  y: number
}

/**
 * A star was laid at `point` (percent of the frame, 0 to 100 each way). It belongs to the nearest target of the model that is not taken yet and lies within
 * `tol` (percent of the width of the frame; `ratio` is the height of the frame divided by its width in pixels, so that a distance is the same all round).
 * Returns the index of that target, or -1 when the star is too far from every free one.
 */
export function claim(targets: [number, number][], taken: boolean[], point: Pt, tol = 12, ratio = 1): number {
  let best = -1
  let bestDist = Infinity
  targets.forEach((t, i) => {
    if (taken[i]) return
    const d = Math.hypot(point.x - t[0], (point.y - t[1]) * ratio)
    if (d <= tol && d < bestDist) {
      best = i
      bestDist = d
    }
  })
  return best
}

/** Does a set of laid stars match the model (every star within the tolerance of its own target, nothing laid twice), in any order? */
export function matches(targets: [number, number][], placed: Pt[], tol = 12, ratio = 1): boolean {
  if (placed.length !== targets.length) return false
  const taken = targets.map(() => false)
  for (const p of placed) {
    const i = claim(targets, taken, p, tol, ratio)
    if (i < 0) return false
    taken[i] = true
  }
  return true
}

/** The real height of a frame divided by its real width, from its size as a part of a picture that is `aspect` times as wide as high (3 / 2). */
export const frameRatio = (frame: { w: number; h: number }, aspect = 3 / 2): number => frame.h / (frame.w * aspect)

// ------------------------------------------------------------------ the silver

/** What lies on the cloth, together. */
export const total = (values: number[]): number => values.reduce((a, b) => a + b, 0)

/** Exactly the price (and something lies on the cloth). */
export const isExact = (values: number[], price: number): boolean => values.length > 0 && total(values) === price

/** Every way to pay the price with the pieces of a round: the indices of the pieces to lay (at most 14 pieces). */
export function solutions(values: number[], price: number): number[][] {
  if (values.length > 14) return []
  const out: number[][] = []
  for (let mask = 1; mask < 1 << values.length; mask++) {
    const picked = values.map((_, i) => i).filter((i) => mask & (1 << i))
    if (total(picked.map((i) => values[i]!)) === price) out.push(picked)
  }
  return out
}

// ------------------------------------------------------------------ the birds

/** The height of the picture divided by its width (the desert is 1200 x 900): a distance in percent of the height counts this much of a percent of the width. */
export const BIRDS_ASPECT = 900 / 1200

/** Where the drawn flight path of a bird ends: `shown` (0 to 1) of the way from its start to the meeting point. */
export function lineEnd(from: [number, number], target: [number, number], shown: number): Pt {
  const f = Math.min(1, Math.max(0, shown))
  return { x: from[0] + (target[0] - from[0]) * f, y: from[1] + (target[1] - from[1]) * f }
}

/** A tap hits the meeting point when it lies within `radius` (percent of the width) of it. */
export const hitTarget = (tap: Pt, target: [number, number], radius: number): boolean => Math.hypot(tap.x - target[0], (tap.y - target[1]) * BIRDS_ASPECT) <= radius

/** How far a point lies from the straight line through `from` and `to` (percent of the width). */
export function distToLine(from: [number, number], to: [number, number], point: [number, number]): number {
  const ax = from[0]
  const ay = from[1] * BIRDS_ASPECT
  const dx = to[0] - ax
  const dy = to[1] * BIRDS_ASPECT - ay
  const len = Math.hypot(dx, dy)
  if (len === 0) return Math.hypot(point[0] - ax, point[1] * BIRDS_ASPECT - ay)
  return Math.abs(dx * (point[1] * BIRDS_ASPECT - ay) - dy * (point[0] - ax)) / len
}

/** The path of a bird from `from` to `to` lies on the way to the meeting point: the meeting point is on its line (within `tol`) and in front of it. */
export function onRay(from: [number, number], to: [number, number], target: [number, number], tol = 0.5): boolean {
  if (distToLine(from, to, target) > tol) return false
  const dx = to[0] - from[0]
  const dy = (to[1] - from[1]) * BIRDS_ASPECT
  return dx * (target[0] - from[0]) + dy * (target[1] - from[1]) * BIRDS_ASPECT >= 0
}

/** The direction of a bird in degrees (0 = to the right, 90 = down), the real direction on the screen. */
export const birdAngle = (from: [number, number], to: [number, number]): number => (Math.atan2((to[1] - from[1]) * BIRDS_ASPECT, to[0] - from[0]) * 180) / Math.PI

// ------------------------------------------------------------------ the rings

export type Couple = [number, number][]
const twelfth = (n: number) => ((n % 12) + 12) % 12

/** Turns a ring by `steps` twelfths; the ring that is coupled to it (turning `a` turns `b` the other way) turns the opposite way by the same. */
export function rotateRing(state: number[], ring: number, steps: number, couple: Couple): number[] {
  const next = state.slice()
  next[ring] = twelfth(next[ring]! + steps)
  for (const [a, b] of couple) if (a === ring && b < next.length) next[b] = twelfth(next[b]! - steps)
  return next
}

/** Every ring stands with its gap at the top. */
export const isAligned = (state: number[]): boolean => state.length > 0 && state.every((s) => twelfth(s) === 0)

/** How many rings stand right. */
export const alignedCount = (state: number[]): number => state.filter((s) => twelfth(s) === 0).length

/** The shortest way to line up all rings: single steps (one twelfth, either way) of one ring; `null` when it cannot be done; an empty way when it is done. */
export function solveRings(start: number[], couple: Couple): { ring: number; steps: number }[] | null {
  if (isAligned(start)) return []
  const key = (s: number[]) => s.map(twelfth).join(',')
  const seen = new Map<string, { from: string; move: { ring: number; steps: number } } | null>([[key(start), null]])
  let frontier: number[][] = [start.map(twelfth)]
  while (frontier.length) {
    const nextFrontier: number[][] = []
    for (const s of frontier) {
      for (let ring = 0; ring < s.length; ring++) {
        for (const steps of [1, -1]) {
          const n = rotateRing(s, ring, steps, couple)
          const k = key(n)
          if (seen.has(k)) continue
          seen.set(k, { from: key(s), move: { ring, steps } })
          if (isAligned(n)) {
            const way: { ring: number; steps: number }[] = []
            for (let cur = seen.get(k); cur; cur = seen.get(cur.from) ?? null) way.unshift(cur.move)
            return way
          }
          nextFrontier.push(n)
        }
      }
    }
    frontier = nextFrontier
  }
  return null
}

/** Can the rings be lined up? */
export const ringsSolvable = (start: number[], couple: Couple): boolean => solveRings(start, couple) !== null

// ------------------------------------------------------------------ the clues

/** Does a clue hold for a full row of blankets (index 0 is the place at the well, `slot` counts from 1)? */
export function clueHolds(order: string[], clue: Clue): boolean {
  if (clue.kind === 'at') return order[clue.slot - 1] === clue.blanket
  if (clue.kind === 'notAt') return order[clue.slot - 1] !== clue.blanket
  const a = order.indexOf(clue.a)
  const b = order.indexOf(clue.b)
  if (a < 0 || b < 0) return false
  return clue.kind === 'before' ? a < b : Math.abs(a - b) === 1
}

/** How many of the clues hold for the row. */
export const holding = (order: string[], clues: Clue[]): number => clues.filter((c) => clueHolds(order, c)).length

/** Every row of the blankets that makes all the clues true. */
export function cluesSolutions(blankets: string[], clues: Clue[]): string[][] {
  const out: string[][] = []
  const rec = (rest: string[], row: string[]) => {
    if (!rest.length) {
      if (clues.every((c) => clueHolds(row, c))) out.push(row)
      return
    }
    rest.forEach((b, i) => rec([...rest.slice(0, i), ...rest.slice(i + 1)], [...row, b]))
  }
  rec(blankets, [])
  return out
}
