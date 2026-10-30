/**
 * The pure parts of the two new games of "The King Is Coming" (the components only draw and listen): the peace among the animals (which animals belong together according to Isaiah 11)
 * and the forge (how many blows, which tool the weapon becomes according to Micah 4). Places are percent of the picture.
 */

export type PeaceResult = 'ok' | 'again' | 'wrong'

/** One pair of the text: the animal that is dangerous (the predator) and the one that lives safely beside it. */
export interface PeacePairDef {
  predator: string
  prey: string
}

/**
 * Two animals were tapped, one after the other (in either order). `done` are the predators whose pair is already together.
 * The right partner is `ok`; two animals of the same kind, or a pair that is already together, is `again` (no mistake, nothing happens); any other pair is `wrong`.
 */
export function peaceStep(pairs: readonly PeacePairDef[], done: readonly string[], predator: string, prey: string): PeaceResult {
  const pair = pairs.find((p) => p.predator === predator)
  if (!pair) return 'wrong'
  if (done.includes(predator)) return 'again'
  return pair.prey === prey ? 'ok' : 'wrong'
}

/** Where the partner stands when the pair is together: right beside the predator (at the same height), but never outside the picture. */
export function peaceSpot(predator: { x: number; y: number }, gap = 23): { x: number; y: number } {
  return { x: Math.min(92, predator.x + gap), y: predator.y }
}

/** True when every pair of the round is together. */
export function allPaired(done: readonly string[], pairs: readonly PeacePairDef[]): boolean {
  return pairs.length > 0 && pairs.every((p) => done.includes(p.predator))
}

export type ForgeBlow = 'hit' | 'ready'

/** A blow on the anvil: after `needed` blows the metal glows and the child may choose what it becomes. */
export function forgeBlow(hits: number, needed: number): ForgeBlow {
  return hits + 1 >= needed ? 'ready' : 'hit'
}

/** The choice of the tool: only the tool named by Micah is right (a plowshare for the sword, a pruning hook for the spear). */
export function forgeChoice(result: string, tapped: string): 'ok' | 'wrong' {
  return result === tapped ? 'ok' : 'wrong'
}
