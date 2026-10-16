/**
 * The awards of the app and what it takes to earn them. Pure rules, no storage: `useAwards` keeps the numbers
 * and asks `awardProgress` how far each award is.
 */

export type AwardId =
  | 'first-picture'
  | 'five-pictures'
  | 'twenty-pictures'
  | 'first-book'
  | 'all-tools'
  | 'three-days'
  | 'first-read'
  | 'brush-artist'

/** What the app has counted so far. */
export interface AwardStats {
  /** Pictures marked as finished. */
  finishedPictures: number
  /** Coloring books with every picture finished. */
  finishedBooks: number
  /** The painting tools that were used at least once. */
  toolsUsed: string[]
  /** Different days on which something was painted. */
  paintDays: number
  /** Books read to the end. */
  booksRead: number
}

/** The six painting tools; "all tools" needs every one of them. */
export const PAINT_TOOLS = ['pencil', 'felt', 'watercolor', 'oil', 'graphite', 'chalk'] as const

export interface AwardDef {
  id: AwardId
  /** Picture of the medal (under `images/awards/`). */
  image: string
  goal: number
  progress: (s: AwardStats) => number
}

const toolCount = (s: AwardStats) => PAINT_TOOLS.filter((t) => s.toolsUsed.includes(t)).length

export const AWARDS: AwardDef[] = [
  { id: 'first-picture', image: 'first-picture', goal: 1, progress: (s) => s.finishedPictures },
  { id: 'five-pictures', image: 'five-pictures', goal: 5, progress: (s) => s.finishedPictures },
  { id: 'twenty-pictures', image: 'twenty-pictures', goal: 20, progress: (s) => s.finishedPictures },
  { id: 'first-book', image: 'first-book', goal: 1, progress: (s) => s.finishedBooks },
  { id: 'all-tools', image: 'all-tools', goal: PAINT_TOOLS.length, progress: toolCount },
  { id: 'brush-artist', image: 'brush-artist', goal: 2, progress: (s) => ['watercolor', 'oil'].filter((t) => s.toolsUsed.includes(t)).length },
  { id: 'three-days', image: 'three-days', goal: 3, progress: (s) => s.paintDays },
  { id: 'first-read', image: 'first-read', goal: 1, progress: (s) => s.booksRead }
]

export interface AwardProgress {
  id: AwardId
  image: string
  goal: number
  /** Never more than the goal. */
  done: number
  earned: boolean
}

export function awardProgress(stats: AwardStats): AwardProgress[] {
  return AWARDS.map((a) => {
    const done = Math.min(a.goal, Math.max(0, a.progress(stats)))
    return { id: a.id, image: a.image, goal: a.goal, done, earned: done >= a.goal }
  })
}

/** The awards that are earned with `after` but were not with `before`. */
export function newlyEarned(before: AwardStats, after: AwardStats): AwardId[] {
  const was = new Set(awardProgress(before).filter((a) => a.earned).map((a) => a.id))
  return awardProgress(after)
    .filter((a) => a.earned && !was.has(a.id))
    .map((a) => a.id)
}
