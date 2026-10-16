import type { Journey } from '@/types/adventure'
import { josef } from '@/data/adventures/josef'

/** All journeys of this build. More follow, one after the other, through the whole Bible. */
export const journeys: Journey[] = [josef]

export const journeyById = (id: string): Journey | undefined => journeys.find((j) => j.id === id)

/** Journeys that are announced (shown closed on the adventure page); they get their own entry once they are written. */
export const comingSoon: { id: string; title: string }[] = [
  { id: 'adam-eva', title: 'Adam und Eva' },
  { id: 'noah', title: 'Noah' }
]
