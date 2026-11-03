/**
 * What the collection page ("Meine Sammlung") shows, worked out from the progress of the adventures: a card for every stage that was
 * gone through with three stars, and the cup of every journey. Pure functions, so they can be tested.
 */
import type { Journey, JourneyProgress, Medal, StageProgress } from '@/types/adventure'
import { MAX_STARS, stageStarsOf } from '@/utils/adventureScore'

export interface AlbumCard {
  stageId: number
  title: string
  image: string | undefined
  /** The Bible passage of the stage (printed on the back of the card). */
  ref: string
  /** The stage was gone through to the end. */
  played: boolean
  /** The card is won: the stage was gone through with all three stars (the best try counts). */
  have: boolean
  /** The stars that count (0–3). */
  stars: number
  /** How many stars are still missing for the card (3 when the stage was not played yet). */
  missing: number
}

/** The stars that count for a stage: the best of all tries (see `stageStarsOf`). */
export function starsOf(p: StageProgress | undefined): number {
  return stageStarsOf(p)
}

/** One card per stage of the journey (stages that are not ready yet are left out). A card needs three stars. */
export function albumCards(journey: Journey, stageOf: (stageId: number) => StageProgress | undefined): AlbumCard[] {
  return journey.stages
    .filter((s) => !s.soon)
    .map((s) => {
      const p = stageOf(s.id)
      const played = !!p?.done
      const stars = played ? starsOf(p) : 0
      return { stageId: s.id, title: s.title, image: s.image, ref: s.ref, played, have: played && stars >= MAX_STARS, stars, missing: MAX_STARS - stars }
    })
}

/** The special card of a journey: it is won with all the cards of that journey. */
export interface AlbumSetCard {
  journeyId: string
  title: string
  image: string
  have: boolean
  /** Cards of the journey that are won, and how many there are. */
  count: number
  all: number
}

export function albumSetCard(journey: Journey, cards: AlbumCard[]): AlbumSetCard {
  const count = cards.filter((c) => c.have).length
  return { journeyId: journey.id, title: journey.title, image: journey.medal, have: cards.length > 0 && count === cards.length, count, all: cards.length }
}

/** `have`: cards won; `all`: cards there are; `sets`: special cards won. */
export function albumTotals(sets: AlbumCard[][]): { have: number; all: number; sets: number } {
  let have = 0
  let all = 0
  let complete = 0
  for (const cards of sets) {
    for (const c of cards) {
      all++
      if (c.have) have++
    }
    if (cards.length > 0 && cards.every((c) => c.have)) complete++
  }
  return { have, all, sets: complete }
}

/** The cup of a journey and how far the child is from it ("points of max"). */
export function cupStats(
  journey: Journey,
  progress: JourneyProgress | undefined,
  cupOf: (j: Journey, p: JourneyProgress | undefined) => Medal | null,
  pointsOf: (p: JourneyProgress | undefined) => number,
  maxPoints: (j: Journey) => number
): { cup: Medal | null; points: number; max: number } {
  return { cup: cupOf(journey, progress), points: progress ? pointsOf(progress) : 0, max: maxPoints(journey) }
}
