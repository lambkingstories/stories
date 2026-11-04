/**
 * The pure parts of the three new games of "Zacchaeus and Lazarus" (the components only draw and listen):
 * "Up the tree" (`klettern`, Luke 19,4: Zacchaeus climbs the sycomore tree, always on the strong branch),
 * "Half to the poor" (`halbieren`, Luke 19,8: the coins are divided exactly in the middle) and
 * "Loose him" (`loesen`, John 11,44: the linen strips are pulled off Lazarus).
 * Places are percent of the picture. The arithmetic has no clock and no dice of its own.
 */
import { mistakeStars } from '@/utils/adventureScore'
import type { ClimbGame, ClimbRound, HalveGame, HalveRound, UnwrapGame, UnwrapStrip } from '@/types/adventure'

/**
 * Stars at the end of "climb" and of "halve": the mistakes of all rounds against the number of rounds (the same steps as the games of "Stories of Jesus"):
 * two rounds: up to 2 mistakes three stars, up to 5 two stars, then one.
 */
export function zachaeusStars(mistakes: number, rounds: number): number {
  const r = Math.max(1, rounds)
  return mistakeStars(mistakes, r, r * 2 + 1)
}

// ---------------------------------------------------------------- 1. up the tree (`klettern`)

export type Side = 'l' | 'r'

/** A tap on a branch of the current height: the strong one lets Zacchaeus climb up, the weak one creaks (a mistake without loss). */
export function climbJudge(strong: Side, tapped: Side): 'up' | 'creak' {
  return strong === tapped ? 'up' : 'creak'
}

/** The x of the branch on one side (percent of the tree picture). */
export const climbBranchX = (game: Pick<ClimbGame, 'branches'>, side: Side): number => (side === 'l' ? game.branches[0] : game.branches[1])

/** Where Zacchaeus stands after `climbed` heights of a round (0 = at the foot of the trunk): x and the lower edge y, percent of the tree picture. */
export function climbSpot(game: Pick<ClimbGame, 'branches' | 'trunk' | 'start'>, round: ClimbRound, climbed: number): { x: number; y: number } {
  if (climbed <= 0) return { x: game.trunk, y: game.start }
  const lv = round.levels[Math.min(climbed, round.levels.length) - 1]!
  // he stands on the branch half way between the trunk and the middle of the branch
  const bx = climbBranchX(game, lv.strong)
  return { x: (game.trunk + bx) / 2, y: lv.y }
}

/** The round is done: every height is climbed. */
export const climbAtTop = (round: ClimbRound, climbed: number): boolean => climbed >= round.levels.length

/** The problems of the data of `climb` (an empty list is good): two rounds of three and four heights, from the bottom to the top, the strong branch changes sides, everything inside the picture. */
export function climbProblems(game: ClimbGame): string[] {
  const out: string[] = []
  if (game.rounds.length < 1) out.push('no rounds')
  const [l, r] = game.branches
  if (!(l < game.trunk && game.trunk < r)) out.push('the branches must lie left and right of the trunk')
  if (l - game.strong.w / 2 < -5 || r + game.strong.w / 2 > 105) out.push('a branch lies outside the tree')
  game.rounds.forEach((round, i) => {
    const lv = round.levels
    if (lv.length < 3 || lv.length > 5) out.push(`round ${i + 1}: three to five heights`)
    let prev = game.start
    for (const [k, h] of lv.entries()) {
      if (h.y >= prev) out.push(`round ${i + 1}: height ${k + 1} is not above the one below`)
      if (h.y < 5 || h.y > 95) out.push(`round ${i + 1}: height ${k + 1} lies outside the tree`)
      prev = h.y
    }
    if (lv.length > 1 && lv.every((h) => h.strong === lv[0]!.strong)) out.push(`round ${i + 1}: the strong branch never changes sides`)
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.levels.length <= game.rounds[0]!.levels.length) out.push('round 2 should be higher than round 1')
  return out
}

// ---------------------------------------------------------------- 2. half to the poor (`halbieren`)

type Row = HalveGame['row']

/** The middle of coin `i` of `n` in the row (percent of the width). */
export const halveCoinX = (i: number, n: number, row: Row): number => row.from + ((row.to - row.from) * (i + 0.5)) / n

/** The place of the divider when `k` coins lie to its left: in the gap between coin k-1 and coin k. */
export const halveDividerX = (k: number, n: number, row: Row): number => row.from + ((row.to - row.from) * k) / n

/** Where the divider snaps for a finger at `x` (percent of the width): the nearest gap, never before the first or after the last coin. */
export function halveSnap(x: number, n: number, row: Row): number {
  const k = Math.round(((x - row.from) / (row.to - row.from)) * n)
  return Math.min(n - 1, Math.max(1, k))
}

/** One step of the divider with the arrow buttons or keys. */
export const halveStep = (k: number, by: number, n: number): number => Math.min(n - 1, Math.max(1, k + by))

/**
 * "Done": exactly the middle is right; otherwise where the divider must go. `k` coins lie on the left (Zacchaeus), `n - k` on the right (the poor):
 * too few on the left means the divider must go to the right.
 */
export function halveJudge(k: number, n: number): 'right' | 'toRight' | 'toLeft' {
  const half = n / 2
  if (k === half) return 'right'
  return k < half ? 'toRight' : 'toLeft'
}

/** Stars of "halve": the same steps as `zachaeusStars`; a game in which "Help" showed the middle gives at most two stars. */
export function halveStars(mistakes: number, rounds: number, helped: boolean): number {
  const base = zachaeusStars(mistakes, rounds)
  return helped ? Math.min(2, base) : base
}

/** The problems of the data of a round of `halve` (an empty list is good): an even number of coins, the divider does not start in the middle, the shifts fit the coins. */
export function halveRoundProblems(round: HalveRound): string[] {
  const out: string[] = []
  if (round.coins < 4 || round.coins % 2 !== 0) out.push('an even number of coins, at least four')
  if (round.start < 1 || round.start > round.coins - 1) out.push('the divider must start between two coins')
  if (round.start === round.coins / 2) out.push('the divider must not start in the middle')
  if (round.offsets && round.offsets.length !== round.coins) out.push('one shift for every coin')
  if (round.offsets?.some((o) => Math.abs(o) > 5)) out.push('a coin is shifted too far (the row must stay easy to count)')
  return out
}

/** The problems of the whole game: the coins fit side by side into the row, the row lies inside the picture. */
export function halveProblems(game: HalveGame): string[] {
  const out: string[] = []
  const { row } = game
  if (row.from < 0 || row.to > 100 || row.from >= row.to) out.push('the row lies outside the picture')
  game.rounds.forEach((r, i) => {
    out.push(...halveRoundProblems(r).map((p) => `round ${i + 1}: ${p}`))
    if (((row.to - row.from) / r.coins) < game.coin.w * 0.95) out.push(`round ${i + 1}: the coins overlap`)
  })
  return out
}

// ---------------------------------------------------------------- 3. loose him (`loesen`)

/** How far the loose end must be pulled (percent of the width of the scene) until the strip comes off; a tap pulls a third of it. */
export const UNWRAP_PULL = 15
export const UNWRAP_TAPS = 3
/** The height of the scene divided by its width (3 : 2). */
const ASPECT = 2 / 3

/** The direction of a strip as a vector of length 1 (in units of the width of the scene). */
export function unwrapDir(dir: readonly [number, number]): [number, number] {
  const len = Math.hypot(dir[0], dir[1])
  return len > 0 ? [dir[0] / len, dir[1] / len] : [1, 0]
}

/**
 * How far a drag pulls the strip: the part of the movement (dx, dy in percent of the width and of the height of the scene) along the direction of the strip, in percent of the width;
 * pushing against the direction pulls nothing.
 */
export function unwrapPull(dx: number, dy: number, dir: readonly [number, number]): number {
  const [ux, uy] = unwrapDir(dir)
  return Math.max(0, dx * ux + dy * ASPECT * uy)
}

/** A strip can be loosed when enough others are off already. */
export const unwrapOpen = (strip: Pick<UnwrapStrip, 'needs'>, removed: number): boolean => removed >= (strip.needs ?? 0)

/** The strip is off when it is pulled far enough. */
export const unwrapOff = (pulled: number): boolean => pulled >= UNWRAP_PULL - 1e-9

/** Stars of "loose": nothing can be wrong, so three; with "Help" (the loose ends blink) two. */
export const unwrapStars = (helped: boolean): number => (helped ? 2 : 3)

/** The problems of the data of `unwrap` (an empty list is good): five strips with their own numbers, loose ends inside the picture, a direction, and a strip that waits for others can always be reached. */
export function unwrapProblems(game: UnwrapGame): string[] {
  const out: string[] = []
  const s = game.strips
  if (s.length !== 5) out.push('five strips are needed')
  if (new Set(s.map((x) => x.id)).size !== s.length) out.push('every strip needs its own number')
  for (const x of s) {
    if (x.end[0] < 0 || x.end[0] > 100 || x.end[1] < 0 || x.end[1] > 100) out.push(`the loose end of strip ${x.id} lies outside the picture`)
    if (Math.hypot(x.dir[0], x.dir[1]) < 1e-6) out.push(`strip ${x.id} has no direction`)
    if ((x.needs ?? 0) >= s.length) out.push(`strip ${x.id} waits for more strips than there are`)
  }
  // every strip that waits must be reachable: count the free ones step by step
  let removed = 0
  const left = [...s]
  while (left.length) {
    const i = left.findIndex((x) => unwrapOpen(x, removed))
    if (i < 0) {
      out.push('some strips can never be loosed')
      break
    }
    left.splice(i, 1)
    removed++
  }
  if (game.maria.from >= game.maria.x) out.push('Mary runs in from the left')
  return out
}
