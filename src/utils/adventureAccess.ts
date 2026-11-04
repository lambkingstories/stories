/**
 * Which adventures are free. Six adventures are free in full (all their stages and the exam at the end); every other adventure
 * comes with LambKing Plus as a whole. Only applies with `VITE_PREMIUM_TEASER=true` (see `usePremium`). To change them, change
 * `FREE_JOURNEYS` (the ids of the adventures, see the `id` of every file in `data/adventures`).
 */
import { PREMIUM_TEASER, hasFeature } from '@/use/usePremium'

/** The adventures that are free in full. */
export const FREE_JOURNEYS: readonly string[] = ['josef', 'adam-eva', 'noah', 'babel', 'abraham', 'jakob']

/** True when the whole adventure may be played without Plus. */
export const isJourneyFree = (journeyId: string): boolean => FREE_JOURNEYS.includes(journeyId)

/** True when the stage with this index (0 = first) may be played without Plus: every stage of a free adventure, no stage of another. */
export function isStageFree(journeyId: string, _index: number): boolean {
  return isJourneyFree(journeyId)
}

/** True when the whole adventure is behind Plus and the person does not have it (it is marked with "Plus" in the list of adventures). */
export const isJourneyPlusLocked = (journeyId: string): boolean => PREMIUM_TEASER && !isJourneyFree(journeyId) && !hasFeature('adventure')

/** True when the stage is behind Plus and the person does not have it. */
export function isStagePlusLocked(journeyId: string, index: number): boolean {
  return PREMIUM_TEASER && !isStageFree(journeyId, index) && !hasFeature('adventure')
}
