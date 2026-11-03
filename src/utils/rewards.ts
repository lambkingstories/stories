import { REWARD_GAMES } from '@/data/adventures/rewardGames'
import { MAX_STARS, maxPoints, medalFor, pointsOf, stageStarsOf } from '@/utils/adventureScore'
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
  /** The place of the stage in the journey (1, 2, 3 ...). */
  stageNo: number
  title: string
  image: string | undefined
  /** The stage has all its three stars: the game is in the game room. */
  open: boolean
}

/**
 * Every replayable game of the journeys (`REWARD_GAMES`, in the order of the list), open or not. A game opens when the stage it belongs to has
 * all three stars (Anton, 3.11.2026: the games hang on the stars, so that they come quickly and can be collected; the big games hang on
 * far more stars, see `bigGames`).
 */
export function rewardGames(journeys: Journey[], progressOf: (id: string) => JourneyProgress | undefined): RewardGame[] {
  const out: RewardGame[] = []
  for (const j of journeys) {
    for (const id of REWARD_GAMES[j.id] ?? []) {
      const i = j.stages.findIndex((x) => x.id === id)
      const s = j.stages[i]
      if (!s || s.soon) continue
      out.push({
        journeyId: j.id,
        journeyTitle: j.title,
        stageId: s.id,
        stageNo: i + 1,
        title: s.title,
        image: s.image,
        open: stageStarsOf(progressOf(j.id)?.stages[s.id]) >= MAX_STARS
      })
    }
  }
  return out
}

/** The games that are open now. */
export function unlockedGames(journeys: Journey[], progressOf: (id: string) => JourneyProgress | undefined): RewardGame[] {
  return rewardGames(journeys, progressOf).filter((g) => g.open)
}

/** How many games all journeys together hold as rewards (for "3 of 30"). */
export function rewardGameTotal(journeys: Journey[]): number {
  return journeys.reduce((n, j) => n + (REWARD_GAMES[j.id] ?? []).filter((id) => j.stages.some((s) => s.id === id && !s.soon)).length, 0)
}
