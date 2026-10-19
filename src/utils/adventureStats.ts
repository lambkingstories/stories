import type { Medal } from '@/types/adventure'

/**
 * Small helpers of the statistics page of a journey. The statistics are opened from the cup on the map; from there stages can be played
 * again, and the way back from such a stage (and from the present, which is a painting) leads back to the statistics, not to the map.
 */

const VIA_KEY = 'lk-via-stats'
const BEFORE_KEY = 'lk-stats-medal-before'

const store = (): Storage | null => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** A stage (or the exam, `pruefung`) is played again from the statistics: the way back leads there. */
export function markViaStats(journeyId: string, stageKey: string, medalBefore: Medal | null) {
  const s = store()
  s?.setItem(VIA_KEY, `${journeyId}:${stageKey}`)
  s?.setItem(BEFORE_KEY, medalBefore ?? 'none')
}

/** Is this stage (or the exam) being played again from the statistics? */
export function isViaStats(journeyId: string, stageKey: string): boolean {
  return store()?.getItem(VIA_KEY) === `${journeyId}:${stageKey}`
}

/** The way back from the replay is taken; the mark is gone (the medal from before stays for the statistics page, which compares it). */
export function clearViaStats() {
  store()?.removeItem(VIA_KEY)
}

/** The medal the child had when it went to play again (`undefined`: it did not come from a replay). Reading it forgets it. */
export function takeMedalBefore(): Medal | null | undefined {
  const s = store()
  const v = s?.getItem(BEFORE_KEY)
  s?.removeItem(BEFORE_KEY)
  if (v === undefined || v === null) return undefined
  return v === 'bronze' || v === 'silver' || v === 'gold' ? v : null
}

const RANK: Record<Medal, number> = { bronze: 1, silver: 2, gold: 3 }
/** 0 for no cup, then bronze, silver, gold. */
export const medalRank = (m: Medal | null | undefined): number => (m ? RANK[m] : 0)

/** The next cup and how many points are still missing for it; `null` when the cup is gold already. */
export function nextMedal(points: number, max: number): { medal: Medal; missing: number } | null {
  const steps: [Medal, number][] = [['bronze', 0.5], ['silver', 0.75], ['gold', 0.9]]
  for (const [medal, share] of steps) {
    const need = Math.ceil(max * share)
    if (points < need) return { medal, missing: need - points }
  }
  return null
}
