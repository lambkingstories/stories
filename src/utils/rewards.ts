import { REWARD_GAMES } from '@/data/adventures/rewardGames'
import { maxPoints, medalFor, pointsOf } from '@/utils/adventureScore'
import type { Journey, JourneyProgress } from '@/types/adventure'

/** The cup (any) of a journey: the exam is done and the points reach at least bronze. */
export function cupOf(journey: Journey, progress: JourneyProgress | undefined) {
  if (!progress?.exam) return null
  return medalFor(pointsOf(progress), maxPoints(journey))
}

export interface RewardGame {
  journeyId: string
  journeyTitle: string
  stageId: number
  title: string
  image: string | undefined
}

/** The games of the journeys whose GOLD cup is won (the replayable games of `REWARD_GAMES`, in the order of the list). */
export function unlockedGames(journeys: Journey[], progressOf: (id: string) => JourneyProgress | undefined): RewardGame[] {
  const out: RewardGame[] = []
  for (const j of journeys) {
    if (cupOf(j, progressOf(j.id)) !== 'gold') continue
    for (const id of REWARD_GAMES[j.id] ?? []) {
      const s = j.stages.find((x) => x.id === id)
      if (!s || s.soon) continue
      out.push({ journeyId: j.id, journeyTitle: j.title, stageId: s.id, title: s.title, image: s.image })
    }
  }
  return out
}

/** How many games all journeys together hold as rewards (for "3 of 30"). */
export function rewardGameTotal(journeys: Journey[]): number {
  return journeys.reduce((n, j) => n + (REWARD_GAMES[j.id] ?? []).filter((id) => j.stages.some((s) => s.id === id && !s.soon)).length, 0)
}
