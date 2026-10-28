/**
 * The adventure to go on with. The start page ("Continue") and the adventure page ("Continue the adventure") both ask here, so that
 * they always name the same one: the first adventure in the order of the time line of the Bible that was begun (a stage has been
 * played) and is not finished.
 */
import { timelineNumber } from '@/data/adventures/timeline'
import { nextStageIndex } from '@/utils/adventureScore'
import type { Journey, JourneyProgress } from '@/types/adventure'

export function journeyToContinue(list: Journey[], progressOf: (id: string) => JourneyProgress | undefined): Journey | null {
  const order = (j: Journey) => timelineNumber(j.id) || Number.MAX_SAFE_INTEGER
  for (const j of [...list].sort((a, b) => order(a) - order(b))) {
    const p = progressOf(j.id)
    const begun = !!p && Object.keys(p.stages).length > 0
    if (begun && nextStageIndex(j, p) !== null) return j
  }
  return null
}
