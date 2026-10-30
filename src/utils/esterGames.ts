/**
 * The pure parts of the two new games of "Esther" (the components only draw and listen): decorating the feast (put the things where the text says, or put each kind of cup only once)
 * and honoring the man (choose what the king gives). Places are percent of the picture; where a height is mixed with a width the heights are first turned into widths
 * (the pictures are 4:3).
 */

/** The pictures of the games are 4:3: one percent of the height is three quarters of one percent of the width. */
export const ASPECT = 3 / 4

/** One place on the picture: the middle (percent) and the width. */
export interface DecorPlace {
  x: number
  y: number
  w: number
}

/** The nearest place that is within reach of the finger (a place counts up to about its own width), or -1. */
export function placeAt(p: { x: number; y: number }, places: DecorPlace[]): number {
  let best = -1
  let bestD = Infinity
  places.forEach((s, i) => {
    const d = Math.hypot(p.x - s.x, (p.y - s.y) * ASPECT)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  if (best < 0) return -1
  const s = places[best]!
  return bestD <= Math.max(s.w * 0.75, 6) ? best : -1
}

export type DecorMode = 'order' | 'distinct'
export type DecorResult = 'ok' | 'wrong' | 'taken' | 'twin'

/**
 * What happens when a thing is put on a place.
 * `order`: place `slot` takes only the thing named in `want[slot]` (the text names the order: white, red, blue).
 * `distinct`: every place takes any thing, but a design that already stands on the table is refused (every cup looks different).
 */
export function decorPlace(mode: DecorMode, want: string[] | undefined, placedKeys: string[], slot: number, key: string, slotTaken: boolean): DecorResult {
  if (slotTaken) return 'taken'
  if (mode === 'order') return want && want[slot] === key ? 'ok' : 'wrong'
  return placedKeys.includes(key) ? 'twin' : 'ok'
}

/** How many different designs a round can show (the number of places of a `distinct` round, otherwise the number of places). */
export function decorTarget(places: DecorPlace[]): number {
  return places.length
}

/** True when every place of the round is taken. */
export function decorDone(taken: number[]): boolean {
  return taken.length > 0 && taken.every((x) => x >= 0)
}

/** One choice of a round of "Honor the man": is it among the things the king's man named? */
export function honorPick(right: boolean): 'ok' | 'wrong' {
  return right ? 'ok' : 'wrong'
}
