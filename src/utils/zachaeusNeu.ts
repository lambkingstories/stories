/**
 * The pure part of the new game of "Zachäus und Lazarus" (the component only shows and listens):
 * "Stepping stones" (`bachsteine`, John 11,3: the sisters send a messenger to Jesus; the child lays stones into a brook so that he gets across dry).
 * The brook is an upright picture (3:4). Places are percent of the picture; distances are "units" (percent of the width, the vertical difference divided by the ratio,
 * so that a circle is round on the screen). The messenger steps from the bank to a stone, from stone to stone and to the far bank, never farther than `reach`.
 * A whirl carries a stone away. The arithmetic has no clock and no dice.
 */
import { osterDist } from '@/utils/osternGames'
import type { Pt } from '@/utils/osternGames'
import type { Dir } from '@/utils/osternNeuA'

export type { Pt, Dir }

/** The pictures are upright: width / height. */
export const STONES_RATIO = 3 / 4

/** A place in the water where a stone can lie (its middle); `whirl`: a whirl is there, it carries every stone away. */
export interface StoneSpot {
  x: number
  y: number
  whirl?: boolean
}

/**
 * One round: the hint, the brook (`background`, 3:4), where the messenger stands on the near bank (`start`, his feet) and where the path goes on on the far bank (`goal`),
 * the widest step of the messenger (`reach`, units), the places in the water and how many stones the child has.
 */
export interface StonesRound {
  hint: string
  background: string
  start: Pt
  goal: Pt
  reach: number
  spots: StoneSpot[]
  stones: number
}

/**
 * The game "Stepping stones" (`bachsteine`): the messenger (from behind, 220 x 330, transparent, feet at the bottom), the stones (taken in turn), the calm shallow place and the whirl
 * (round, 240 x 240, transparent), the widths in percent of the picture and the rounds.
 */
export interface StonesGame {
  messenger: string
  stone: string[]
  shallow: string
  whirl: string
  messengerW: number
  stoneW: number
  spotW: number
  rounds: StonesRound[]
}

/** The distance of two places in units. */
export const stonesDist = (a: Pt, b: Pt): number => osterDist(a, b, STONES_RATIO)

/** The places of a round as one list: 0 the near bank, 1..n the spots, n+1 the far bank. */
const nodes = (round: StonesRound): Pt[] => [round.start, ...round.spots, round.goal]

/** A spot where a stone stays (not a whirl). */
export const stonesCalm = (round: StonesRound, i: number): boolean => !!round.spots[i] && !round.spots[i]!.whirl

/** How many stones are laid. */
export const stonesLaid = (placed: readonly boolean[]): number => placed.filter(Boolean).length

/** How many stones the child still has. */
export const stonesLeft = (round: StonesRound, placed: readonly boolean[]): number => Math.max(0, round.stones - stonesLaid(placed))

/**
 * Where the messenger can go (a breadth-first search from the near bank over the laid stones): which spots he reaches, whether he reaches the far bank,
 * and the way there (the spots in order) when he does. `from`: the stone he stands on (-1: the near bank); the way then starts after that stone.
 */
export function stonesReach(round: StonesRound, placed: readonly boolean[], from = -1): { reached: boolean[]; goal: boolean; route: number[] | null } {
  const ps = nodes(round)
  const n = ps.length
  const open = (k: number) => k === n - 1 || (k > 0 && !!placed[k - 1] && stonesCalm(round, k - 1))
  const first = from >= 0 && from < round.spots.length ? from + 1 : 0
  const prev = Array<number>(n).fill(-2)
  prev[first] = -1
  const queue = [first]
  for (let q = 0; q < queue.length; q++) {
    const u = queue[q]!
    if (u === n - 1) continue
    for (let v = 0; v < n; v++) {
      if (prev[v] !== -2 || !open(v) || stonesDist(ps[u]!, ps[v]!) > round.reach + 1e-9) continue
      prev[v] = u
      queue.push(v)
    }
  }
  const reached = round.spots.map((_, i) => prev[i + 1] !== -2)
  const goal = prev[n - 1] !== -2
  let route: number[] | null = null
  if (goal) {
    route = []
    for (let k = prev[n - 1]!; k > 0 && k !== first; k = prev[k]!) route.unshift(k - 1)
  }
  return { reached, goal, route }
}

/**
 * Where the messenger stands: on the reached stone nearest to the far bank (only if it is nearer than the bank he started from), on the far bank when he can get there.
 * `spot` is the index of the stone, -1 on the near bank, -2 on the far bank.
 */
export function stonesStand(round: StonesRound, placed: readonly boolean[]): { at: Pt; spot: number } {
  const r = stonesReach(round, placed)
  if (r.goal) return { at: round.goal, spot: -2 }
  let best = -1
  let bestD = stonesDist(round.start, round.goal)
  r.reached.forEach((ok, i) => {
    if (!ok) return
    const d = stonesDist(round.spots[i]!, round.goal)
    if (d < bestD - 1e-9) {
      bestD = d
      best = i
    }
  })
  return best < 0 ? { at: round.start, spot: -1 } : { at: round.spots[best]!, spot: best }
}

/** How far across the messenger is (0 on the near bank, 1 on the far bank): the part of the distance from bank to bank he has made. */
export function stonesProgress(round: StonesRound, at: Pt): number {
  const whole = stonesDist(round.start, round.goal)
  if (whole <= 0) return 1
  return Math.min(1, Math.max(0, 1 - stonesDist(at, round.goal) / whole))
}

/**
 * The cheapest way over the brook from the stones that are laid: every calm spot without a stone costs one stone, a laid one nothing, a whirl cannot be used.
 * The cost and the spots of the way in order; null when there is no way at all.
 */
export function stonesCheapest(round: StonesRound, placed: readonly boolean[]): { cost: number; spots: number[] } | null {
  const ps = nodes(round)
  const n = ps.length
  const cost = (k: number) => (k === n - 1 ? 0 : placed[k - 1] ? 0 : 1)
  const usable = (k: number) => k === n - 1 || (k > 0 && stonesCalm(round, k - 1))
  const best = Array<number>(n).fill(Infinity)
  const prev = Array<number>(n).fill(-1)
  const done = Array<boolean>(n).fill(false)
  best[0] = 0
  for (;;) {
    let u = -1
    for (let k = 0; k < n; k++) if (!done[k] && best[k]! < Infinity && (u < 0 || best[k]! < best[u]!)) u = k
    if (u < 0) break
    done[u] = true
    if (u === n - 1) break
    for (let v = 1; v < n; v++) {
      if (done[v] || !usable(v) || stonesDist(ps[u]!, ps[v]!) > round.reach + 1e-9) continue
      const c = best[u]! + cost(v)
      if (c < best[v]!) {
        best[v] = c
        prev[v] = u
      }
    }
  }
  if (best[n - 1] === Infinity) return null
  const spots: number[] = []
  for (let k = prev[n - 1]!; k > 0; k = prev[k]!) spots.unshift(k - 1)
  return { cost: best[n - 1]!, spots }
}

/** The fewest stones a round needs (from an empty brook); null when it cannot be crossed. */
export function stonesFewest(round: StonesRound): number | null {
  return stonesCheapest(round, round.spots.map(() => false))?.cost ?? null
}

/**
 * The button "Help me": `place` a stone on a spot of the cheapest way, or, when the stones in hand are not enough for it, `lift` a laid stone that is not on that way.
 * Null when the way is already there or nothing helps.
 */
export function stonesHint(round: StonesRound, placed: readonly boolean[]): { kind: 'place' | 'lift'; spot: number } | null {
  const way = stonesCheapest(round, placed)
  if (!way || way.cost === 0) return null
  if (stonesLeft(round, placed) >= way.cost) {
    const spot = way.spots.find((i) => !placed[i])
    return spot === undefined ? null : { kind: 'place', spot }
  }
  const spot = placed.findIndex((p, i) => p && !way.spots.includes(i))
  return spot < 0 ? null : { kind: 'lift', spot }
}

/**
 * A tap on a spot: a laid stone is taken back (`lifted`); on a whirl the stone is carried away (`whirl`, a mistake, nothing changes); without a stone in hand nothing happens (`empty`);
 * otherwise the stone is laid (`placed`). The new list of laid stones.
 */
export function stonesTap(round: StonesRound, placed: readonly boolean[], i: number): { kind: 'placed' | 'lifted' | 'whirl' | 'empty'; placed: boolean[] } {
  const out = round.spots.map((_, k) => !!placed[k])
  if (i < 0 || i >= round.spots.length) return { kind: 'empty', placed: out }
  if (out[i]) {
    out[i] = false
    return { kind: 'lifted', placed: out }
  }
  if (!stonesCalm(round, i)) return { kind: 'whirl', placed: out }
  if (stonesLeft(round, out) <= 0) return { kind: 'empty', placed: out }
  out[i] = true
  return { kind: 'placed', placed: out }
}

/** The spot an arrow key goes to: the nearest middle in that direction (the distance plus the sideways part again, so that a near place half aside wins over a far one straight ahead). Null when there is none. From -1 (nothing chosen) the spot nearest to the messenger. */
export function stonesNeighbour(round: StonesRound, i: number, dir: Dir): number | null {
  const spots = round.spots
  if (!spots.length) return null
  if (i < 0 || i >= spots.length) {
    let best = 0
    spots.forEach((s, k) => {
      if (stonesDist(s, round.start) < stonesDist(spots[best]!, round.start)) best = k
    })
    return best
  }
  const a = spots[i]!
  let best: number | null = null
  let bestScore = Infinity
  spots.forEach((s, k) => {
    if (k === i) return
    const dx = s.x - a.x
    const dy = (s.y - a.y) / STONES_RATIO
    const along = dir === 1 ? dx : dir === 3 ? -dx : dir === 2 ? dy : -dy
    const across = dir === 1 || dir === 3 ? Math.abs(dy) : Math.abs(dx)
    if (along <= 0.5 || across > along * 1.5) return
    const score = Math.hypot(along, across) + across
    if (score < bestScore) {
      bestScore = score
      best = k
    }
  })
  return best
}

/** The problems of the data of `bachsteine` (an empty list is good). */
export function stepStonesProblems(game: StonesGame): string[] {
  const out: string[] = []
  if (!game.messenger) out.push('no picture of the messenger')
  if (!game.stone.length || game.stone.some((s) => !s)) out.push('no pictures of the stones')
  if (!game.shallow) out.push('no picture of the calm place')
  if (!game.whirl) out.push('no picture of the whirl')
  // a phone shows the brook about 360 pixels wide: a spot is a button of at least 44 pixels, the messenger at least about 40
  if (game.spotW * 3.6 < 44) out.push(`the spots are ${game.spotW} % wide, less than 44 pixels on a phone`)
  if (game.messengerW * 3.6 < 39) out.push(`the messenger is ${game.messengerW} % wide, less than 40 pixels on a phone`)
  if (game.stoneW > game.spotW + 1) out.push('a stone is wider than its spot')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  let before: { fewest: number; spare: number } | null = null
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.background) out.push(`round ${n}: no picture of the brook`)
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    for (const [name, p] of [['start', r.start], ['goal', r.goal]] as const) if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) out.push(`round ${n}: the ${name} lies outside the picture`)
    if (r.reach <= 0) out.push(`round ${n}: the reach must be more than 0`)
    if (r.spots.length < 4) out.push(`round ${n}: fewer than four spots`)
    if (r.spots.length > 16) out.push(`round ${n}: more than 16 spots are too small to tap`)
    const half = game.spotW / 2
    r.spots.forEach((s, i) => {
      if (s.x - half < 0 || s.x + half > 100 || s.y - half * STONES_RATIO < 0 || s.y + half * STONES_RATIO > 100) out.push(`round ${n}: spot ${i + 1} lies outside the picture`)
      r.spots.forEach((o, k) => {
        if (k > i && stonesDist(s, o) < game.spotW - 0.5) out.push(`round ${n}: spots ${i + 1} and ${k + 1} overlap`)
      })
    })
    const whirls = r.spots.filter((s) => s.whirl).length
    if (whirls < 1) out.push(`round ${n}: no whirl`)
    if (stonesDist(r.start, r.goal) <= r.reach) out.push(`round ${n}: the messenger can step over the brook without a stone`)
    const fewest = stonesFewest(r)
    if (fewest === null) {
      out.push(`round ${n}: the brook cannot be crossed`)
      return
    }
    if (fewest < 2) out.push(`round ${n}: one stone is enough, that is too easy`)
    const spare = r.stones - fewest
    if (spare < 1) out.push(`round ${n}: ${r.stones} stones, but the fewest way needs ${fewest} (at least one spare stone)`)
    if (spare > 3) out.push(`round ${n}: ${spare} spare stones are too many`)
    if (r.spots.length - whirls < fewest + 2) out.push(`round ${n}: too few calm spots to choose from`)
    // if a whirl were calm, would the way be shorter? Then the whirls matter (the child has to go round them)
    const calm = { ...r, spots: r.spots.map((s) => ({ x: s.x, y: s.y })) }
    const withoutWhirls = stonesFewest(calm)
    if (withoutWhirls !== null && withoutWhirls === fewest && ri > 0) out.push(`round ${n}: the whirls do not change the way (round 2 should make the child go round them)`)
    if (before && (fewest < before.fewest || spare > before.spare)) out.push(`round ${n}: easier than round ${n - 1}`)
    before = { fewest, spare }
  })
  return out
}
