/**
 * The adventure to go on with. The start page ("Continue") and the adventure page ("Continue the adventure") both ask here, so that
 * they always name the same one: the first adventure in the order of the time line of the Bible that was begun (a stage has been
 * played) and is not finished.
 */
import { timelineNumber } from '@/data/adventures/timeline'
import { nextStageIndex } from '@/utils/adventureScore'
import type { Journey, JourneyProgress } from '@/types/adventure'

/** The adventures in the order of the time line of the Bible (those that are not on the list come last, as they were). */
export function inBibleOrder<T extends { id: string }>(list: readonly T[]): T[] {
  const order = (j: T) => timelineNumber(j.id) || Number.MAX_SAFE_INTEGER
  return [...list].sort((a, b) => order(a) - order(b))
}

/**
 * The adventure a child begins with when none is under way: the first one of the Bible that is not finished and that the child
 * may play (`locked` tells which ones are closed); when all open ones are done, the very first one.
 */
export function journeyToBegin(list: Journey[], progressOf: (id: string) => JourneyProgress | undefined, locked: (id: string) => boolean = () => false): Journey | null {
  const sorted = inBibleOrder(list)
  return sorted.find((j) => !locked(j.id) && nextStageIndex(j, progressOf(j.id)) !== null) ?? sorted[0] ?? null
}

export function journeyToContinue(
  list: Journey[],
  progressOf: (id: string) => JourneyProgress | undefined,
  locked: (id: string) => boolean = () => false
): Journey | null {
  const order = (j: Journey) => timelineNumber(j.id) || Number.MAX_SAFE_INTEGER
  for (const j of [...list].sort((a, b) => order(a) - order(b))) {
    const p = progressOf(j.id)
    const begun = !!p && Object.keys(p.stages).length > 0
    // an adventure that is closed for this child (Plus) is not offered to go on with; the start card then suggests a free one
    if (begun && !locked(j.id) && nextStageIndex(j, p) !== null) return j
  }
  return null
}
