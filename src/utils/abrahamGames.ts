/**
 * The small pure functions of the new games of "Abraham": the camel game (do the packs of a camel weigh the same on both sides, can they be spread so, which
 * pack is the next one to move) and the constellation game (which star of the model a star that was laid belongs to). The games only draw what these say;
 * the tests use them directly.
 */

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
