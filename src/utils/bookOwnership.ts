/**
 * What a person has of a book that can be bought: it is free for everybody (`free`), it was bought (`owned`), it comes with the
 * subscription (`plus`), or it is still to be bought (`locked`). The "Lesen" pages (coloring books and books) show this on every
 * book and let people look only at "mine" (everything they can open) or at "still to buy".
 */
export type Ownership = 'free' | 'owned' | 'plus' | 'locked'
export type OwnFilterValue = 'all' | 'mine' | 'buy'

export function ownershipOf(input: { free: boolean; owned: boolean; plus: boolean }): Ownership {
  if (input.free) return 'free'
  if (input.owned) return 'owned'
  if (input.plus) return 'plus'
  return 'locked'
}

export function matchesOwnFilter(state: Ownership, filter: OwnFilterValue): boolean {
  if (filter === 'all') return true
  return filter === 'buy' ? state === 'locked' : state !== 'locked'
}

/** How many books each filter shows (for the numbers on the chips). */
export function ownCounts(states: Ownership[]): Record<OwnFilterValue, number> {
  return { all: states.length, mine: states.filter((s) => matchesOwnFilter(s, 'mine')).length, buy: states.filter((s) => matchesOwnFilter(s, 'buy')).length }
}
