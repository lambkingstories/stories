/**
 * The pure parts of the two new games of "Christmas" (the components only draw and listen): the manger (which cloth, which bed is the right one according to Luke 2,7) and the sign (which place the shepherds
 * have to find according to Luke 2,12 and 2,16). Places are percent of the picture.
 */

export type PickResult = 'ok' | 'wrong'

/** One choice of the manger: only the thing that the text names is right (swaddling cloths, a manger). */
export function cribStep(right: string, tapped: string): PickResult {
  return right === tapped ? 'ok' : 'wrong'
}

/** One tap on a place of the game "Find the sign": only the place with the child in the manger is right. */
export function signStep(right: string, tapped: string): PickResult {
  return right === tapped ? 'ok' : 'wrong'
}

/** The place of a slot of the round: the id that stands in it (empty when the round has fewer places than slots). */
export function placeInSlot(order: readonly string[], slot: number): string | undefined {
  return order[slot]
}

/** A round is well made when it uses every place exactly once and the right place is among them. */
export function roundIsValid(order: readonly string[], right: string, places: readonly string[]): boolean {
  return order.length === places.length && new Set(order).size === order.length && order.every((id) => places.includes(id)) && order.includes(right)
}
