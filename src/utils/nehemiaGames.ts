/**
 * The pure parts of the two new games of "Nehemiah" (the components only draw and listen): the night ride around the city (which place comes next) and the call of the trumpet
 * (where the builders gather around the trumpeter). Places are percent of the picture; where a height is mixed with a width the heights are first turned into widths (the pictures are 4:3).
 */

/** The pictures of the games are 4:3: one percent of the height is three quarters of one percent of the width. */
export const ASPECT = 3 / 4

export type RideResult = 'ok' | 'again' | 'wrong'

/**
 * A tap on a place of the night ride. `order` is the way of the text, `done` how many places are already reached.
 * The next place is right; a place that was already reached is no mistake (the rider is already there); any other place is wrong.
 */
export function rideStep(order: readonly string[], done: number, tapped: string): RideResult {
  if (done < order.length && order[done] === tapped) return 'ok'
  if (order.slice(0, done).includes(tapped)) return 'again'
  return 'wrong'
}

/** The place of the n-th builder when the trumpet calls: they gather in a fan around the trumpeter, in rows of five, left and right in turn, nearest first. */
export function gatherSpot(horn: { x: number; y: number }, index: number, rowSize = 5): { x: number; y: number } {
  const row = Math.floor(index / rowSize)
  const k = index % rowSize
  const side = k % 2 === 0 ? 1 : -1
  const step = Math.floor(k / 2) + 1
  return { x: Math.max(4, Math.min(96, horn.x + side * (step + 0.4) * 8)), y: Math.min(96, horn.y + row * 5 + (k % 3)) }
}

/** True when every builder of the round has arrived. */
export function allGathered(arrived: readonly boolean[]): boolean {
  return arrived.length > 0 && arrived.every(Boolean)
}
