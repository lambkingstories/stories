/**
 * The pure parts of two more games of "Bis nach Rom" (no. 32, id `paulusrom`; the components only show and listen):
 * "Gather the sticks" (`reisig`, field `brushwood`, Acts 28,3: the child draws a closed loop with a finger around dry sticks and leaves stones, shells, seaweed and wet wood outside) and
 * "Welcome everyone" (`besuch`, field `visitors`, Acts 28,16.20.30: the child sets the stool of the soldier so that the chain lets Paulus reach every guest).
 * All places are percent of the picture: x a part of the width, y a part of the height; distances are measured in units (percent of the width, see `prDist`).
 */
import { prDist } from '@/utils/paulusromNeuA'
import type { PrPt } from '@/utils/paulusromNeuA'

// ================================================================ 1. gather the sticks (`reisig`)

/** A thing on the beach: its picture (up to 160 x 160, transparent), where it lies, how wide it is (percent of the width), whether it burns and a word for the screen reader. */
export interface BrushThing {
  id: string
  image: string
  x: number
  y: number
  w: number
  dry: boolean
  name: string
}
/** A round: the hint, the things, how many bundles make it (each needs two heaps of dry sticks at least) and with which fire (1 to 4) the round begins. */
export interface BrushRound {
  hint: string
  things: BrushThing[]
  bundles: number
  fireStart: number
}
/**
 * The game "Gather the sticks" (`brushwood`): the beach (3:2), the four sizes of the fire (360 x 360), the bundle (200 x 140), Paulus with a bundle (220 x 330), the dot of the trail
 * (32 x 32), the finishing picture (3:2), where the fire and Paulus stand (percent) and how wide they are, how near the end of the loop must come to its beginning (percent of the width,
 * default 8) and the rounds.
 */
export interface BrushwoodGame {
  beach: string
  ratio?: number
  fire: string[]
  fireAt: PrPt
  fireW: number
  bundle: string
  paulus: string
  paulusAt: PrPt
  paulusW: number
  dot: string
  finale: string
  closeDist?: number
  rounds: BrushRound[]
}

/** The loop is closed when it has enough points and its end is near its beginning. */
export function brushLoopClosed(points: readonly PrPt[], ratio = 1.5, closeDist = 8): boolean {
  if (points.length < 8) return false
  return prDist(points[0]!, points[points.length - 1]!, ratio) <= closeDist
}

/** A point lies inside the loop (ray casting; the vertical axis is scaled to units first, so that the loop is round on the screen). */
export function brushInside(points: readonly PrPt[], p: PrPt, ratio = 1.5): boolean {
  let inside = false
  const px = p.x
  const py = p.y / ratio
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i]!.x
    const yi = points[i]!.y / ratio
    const xj = points[j]!.x
    const yj = points[j]!.y / ratio
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** What a loop (or a marked set) that holds the things `held` (indices) does: `bad` something that does not burn is in it, `few` fewer than two heaps of dry sticks, `bundle` good. */
export function brushJudge(round: Pick<BrushRound, 'things'>, held: readonly number[]): 'bad' | 'few' | 'bundle' {
  if (held.some((i) => round.things[i] && !round.things[i]!.dry)) return 'bad'
  if (held.filter((i) => round.things[i]?.dry).length < 2) return 'few'
  return 'bundle'
}

/** The fire after `done` bundles: it grows from `fireStart` to the biggest fire (4), evenly over the bundles of the round. */
export function brushFireLevel(round: Pick<BrushRound, 'fireStart' | 'bundles'>, done: number): number {
  return Math.min(4, round.fireStart + Math.floor((done * (4 - round.fireStart)) / round.bundles + 1e-9))
}

/** The distance of a point from a segment (units). */
function segDist(p: PrPt, a: PrPt, b: PrPt, ratio: number): number {
  const ax = a.x
  const ay = a.y / ratio
  const bx = b.x
  const by = b.y / ratio
  const px = p.x
  const py = p.y / ratio
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Two heaps can be gathered by one loop when nothing that does not burn lies near the line between them (`margin` units). */
export function brushPairFree(round: Pick<BrushRound, 'things'>, i: number, j: number, ratio = 1.5, margin = 4): boolean {
  const a = round.things[i]!
  const b = round.things[j]!
  return round.things.every((t) => t.dry || segDist(t, a, b, ratio) >= margin + t.w / 2)
}

/** The heaps of dry sticks (indices) that are not yet taken. */
const dryLeft = (round: Pick<BrushRound, 'things'>, taken: readonly number[]): number[] => round.things.map((_, i) => i).filter((i) => round.things[i]!.dry && !taken.includes(i))

/** Can `n` bundles still be made from the heaps that are left? (Disjoint pairs that a loop can gather; small numbers, a search over all ways.) */
export function brushSolvable(round: Pick<BrushRound, 'things'>, taken: readonly number[], n: number, ratio = 1.5): boolean {
  const left = dryLeft(round, taken)
  const go = (pool: number[], need: number): boolean => {
    if (need <= 0) return true
    if (pool.length < 2 * need) return false
    const [first, ...rest] = pool
    for (let k = 0; k < rest.length; k++) {
      if (!brushPairFree(round, first!, rest[k]!, ratio)) continue
      if (go(rest.filter((_, m) => m !== k), need - 1)) return true
    }
    return go(rest, need)
  }
  return go(left, n)
}

/** For "Help me": the two heaps (indices) to gather next, or null when there are none (the nearest pair that a loop can gather and that leaves the round solvable). */
export function brushHelp(round: Pick<BrushRound, 'things' | 'bundles'>, taken: readonly number[], done: number, ratio = 1.5): [number, number] | null {
  const left = dryLeft(round, taken)
  let best: [number, number] | null = null
  let bestD = Infinity
  for (let a = 0; a < left.length; a++) {
    for (let b = a + 1; b < left.length; b++) {
      const i = left[a]!
      const j = left[b]!
      if (!brushPairFree(round, i, j, ratio)) continue
      if (!brushSolvable(round, [...taken, i, j], round.bundles - done - 1, ratio)) continue
      const d = prDist(round.things[i]!, round.things[j]!, ratio)
      if (d < bestD) {
        bestD = d
        best = [i, j]
      }
    }
  }
  return best
}

/** The problems of the data of `reisig` (an empty list is good). */
export function brushwoodProblems(game: BrushwoodGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.beach) out.push('no picture of the beach')
  if (game.fire.length !== 4 || game.fire.some((f) => !f)) out.push('four pictures of the fire are needed')
  if (!game.bundle || !game.paulus || !game.dot || !game.finale) out.push('a picture is missing (bundle, Paulus, dot or finishing picture)')
  if ((game.closeDist ?? 8) < 6 || (game.closeDist ?? 8) > 12) out.push('the loop should close within 6 to 12 percent')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const dry = r.things.filter((t) => t.dry)
    if (new Set(r.things.map((t) => t.id)).size !== r.things.length) out.push(`round ${n}: two things have the same id`)
    for (const t of r.things) {
      if (!t.image || !t.name) out.push(`round ${n}: ${t.id} has no picture or no name`)
      if (t.w < 10) out.push(`round ${n}: ${t.id} is too small for a phone (at least 10 percent)`)
      if (t.x < t.w / 2 || t.x > 100 - t.w / 2 || t.y < 5 || t.y > 95) out.push(`round ${n}: ${t.id} lies partly outside the picture`)
    }
    for (let a = 0; a < r.things.length; a++) {
      for (let b = a + 1; b < r.things.length; b++) {
        if (prDist(r.things[a]!, r.things[b]!, ratio) < 7) out.push(`round ${n}: ${r.things[a]!.id} and ${r.things[b]!.id} lie too near each other (7 units)`)
      }
    }
    if (r.fireStart < 1 || r.fireStart > 3) out.push(`round ${n}: the fire begins at 1 to 3`)
    if (r.bundles < 2) out.push(`round ${n}: fewer than two bundles`)
    if (dry.length < r.bundles * 2) out.push(`round ${n}: ${dry.length} heaps are too few for ${r.bundles} bundles of two`)
    if (r.things.every((t) => t.dry)) out.push(`round ${n}: there is nothing that must stay outside`)
    if (!brushSolvable(r, [], r.bundles, ratio)) out.push(`round ${n}: the round cannot be solved: ${r.bundles} bundles do not fit between the things that do not burn`)
    if (i === 1) {
      const near = r.things.some((t) => !t.dry && dry.some((d) => prDist(t, d, ratio) < 12))
      if (!near) out.push('round 2: some thing that does not burn must lie close to the sticks (narrow loops)')
    }
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [BrushRound, BrushRound]
    if (b.bundles <= a.bundles) out.push('round 2 should need more bundles than round 1')
    if (b.things.length <= a.things.length) out.push('round 2 should have more things than round 1')
  }
  return out
}

// ================================================================ 2. welcome everyone (`besuch`)

/** A guest: the picture standing and the picture sitting and listening (both 200 x 300, transparent) and a word for the screen reader. */
export interface VisitorsGuest {
  id: string
  image: string
  listening: string
  name: string
}
/** A guest who comes in and sits down at a place (percent of the room). */
export interface VisitorsArrival {
  guest: number
  at: PrPt
}
/** One visit: one guest, or two who come at the same time. Both have to be reached. */
export interface VisitorsVisit {
  arrivals: VisitorsArrival[]
}
/** A round: the hint, whether the circle of the chain is shown, the places for the stool (indices into `VisitorsGame.stools`, the first is where the soldier sits at the beginning) and the visits. */
export interface VisitorsRound {
  hint: string
  showReach: boolean
  stools: number[]
  visits: VisitorsVisit[]
}
/**
 * The game "Welcome everyone" (`visitors`): the room (4:3), the soldier sitting and carrying his stool (220 x 280), Paulus standing, walking and talking (200 x 300), the chain (600 x 60),
 * the circle of the chain (600 x 600), the guests, the finishing picture (3:2), the painted places for the stool, where Paulus stands next to the soldier (offset from the stool), how long
 * the chain is (units), the widths of the soldier, Paulus and a guest, how far in front of a guest Paulus stops (units) and the rounds.
 */
export interface VisitorsGame {
  room: string
  ratio?: number
  soldier: { sit: string; carry: string }
  paulus: { stand: string; walk: string; talk: string }
  chain: string
  reach: string
  guests: VisitorsGuest[]
  finale: string
  stools: PrPt[]
  beside: PrPt
  chainLen: number
  soldierW: number
  paulusW: number
  guestW: number
  standOff: number
  rounds: VisitorsRound[]
}

const vRatio = (g: Pick<VisitorsGame, 'ratio'>) => g.ratio ?? 4 / 3

/** The chain from the stool reaches a place when it is not further away than the chain is long. */
export const visitorsReaches = (game: Pick<VisitorsGame, 'stools' | 'chainLen' | 'ratio'>, stool: number, at: PrPt): boolean => prDist(game.stools[stool]!, at, vRatio(game)) <= game.chainLen

/** A stool reaches a visit when it reaches every guest of it. */
export const visitorsReachesAll = (game: Pick<VisitorsGame, 'stools' | 'chainLen' | 'ratio'>, stool: number, visit: VisitorsVisit): boolean => visit.arrivals.every((a) => visitorsReaches(game, stool, a.at))

/** Where Paulus stops to talk to a guest: `standOff` units in front of him, on the line to the stool. */
export function visitorsStand(game: Pick<VisitorsGame, 'stools' | 'standOff' | 'ratio'>, stool: number, at: PrPt): PrPt {
  const s = game.stools[stool]!
  const r = vRatio(game)
  const d = prDist(s, at, r)
  if (d <= game.standOff) return { ...s }
  const f = game.standOff / d
  return { x: at.x + (s.x - at.x) * f, y: at.y + (s.y - at.y) * f }
}

/** Where Paulus stops when the chain is too short: at the end of the chain, on the line to the guest. */
export function visitorsEnd(game: Pick<VisitorsGame, 'stools' | 'chainLen' | 'ratio'>, stool: number, at: PrPt): PrPt {
  const s = game.stools[stool]!
  const d = prDist(s, at, vRatio(game))
  if (d <= game.chainLen || d === 0) return { ...at }
  const f = (game.chainLen * 0.96) / d
  return { x: s.x + (at.x - s.x) * f, y: s.y + (at.y - s.y) * f }
}

/** For "Help me": the first stool of the round that reaches the whole visit, or null. */
export function visitorsHelp(game: Pick<VisitorsGame, 'stools' | 'chainLen' | 'ratio'>, round: Pick<VisitorsRound, 'stools'>, visit: VisitorsVisit): number | null {
  const k = round.stools.find((s) => visitorsReachesAll(game, s, visit))
  return k === undefined ? null : k
}

/** The problems of the data of `besuch` (an empty list is good). */
export function visitorsProblems(game: VisitorsGame): string[] {
  const out: string[] = []
  const ratio = vRatio(game)
  if (!game.room) out.push('no picture of the room')
  if (!game.soldier.sit || !game.soldier.carry) out.push('no pictures of the soldier')
  if (!game.paulus.stand || !game.paulus.walk || !game.paulus.talk) out.push('no pictures of Paulus')
  if (!game.chain || !game.reach || !game.finale) out.push('a picture is missing (chain, circle or finishing picture)')
  if (game.chainLen < 14 || game.chainLen > 45) out.push('the chain should be 14 to 45 units long')
  if (game.stools.length < 3) out.push('at least three places for the stool')
  if (game.soldierW < 14 || game.paulusW < 12 || game.guestW < 12) out.push('the figures are too small for a phone (soldier 14, Paulus and guests 12 percent)')
  for (const g of game.guests) if (!g.image || !g.listening || !g.name) out.push(`${g.id}: a picture or a name is missing`)
  if (new Set(game.guests.map((g) => g.id)).size !== game.guests.length) out.push('two guests have the same id')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    for (const s of r.stools) if (!game.stools[s]) out.push(`round ${n}: the place ${s} does not exist`)
    if (r.stools.length < 3) out.push(`round ${n}: at least three places for the stool`)
    const first = r.stools[0]
    if (first !== undefined && game.stools[first]) {
      const p = { x: game.stools[first]!.x + game.beside.x, y: game.stools[first]!.y + game.beside.y }
      if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) out.push(`round ${n}: Paulus would stand outside the room`)
    }
    const guestIds: number[] = []
    r.visits.forEach((v, k) => {
      if (v.arrivals.length < 1 || v.arrivals.length > 2) out.push(`round ${n} visit ${k + 1}: one or two guests`)
      for (const a of v.arrivals) {
        guestIds.push(a.guest)
        if (!game.guests[a.guest]) out.push(`round ${n} visit ${k + 1}: the guest ${a.guest} does not exist`)
        if (a.at.x < 4 || a.at.x > 96 || a.at.y < 8 || a.at.y > 96) out.push(`round ${n} visit ${k + 1}: a guest sits outside the room`)
      }
      const reaching = r.stools.filter((s) => game.stools[s] && visitorsReachesAll(game, s, v))
      if (!reaching.length) out.push(`round ${n} visit ${k + 1}: no place of the stool reaches every guest`)
      if (reaching.length === r.stools.length) out.push(`round ${n} visit ${k + 1}: every place reaches, nothing to think about`)
      if (v.arrivals.length === 2 && reaching.length !== 1) out.push(`round ${n} visit ${k + 1}: for two guests exactly one place must reach both (${reaching.length} do)`)
      for (const s of r.stools) {
        if (!game.stools[s]) continue
        for (const a of v.arrivals) {
          const d = prDist(game.stools[s]!, a.at, ratio)
          if (Math.abs(d - game.chainLen) < 2) out.push(`round ${n} visit ${k + 1}: a guest lies within 2 units of the end of the chain from place ${s} (too close to call)`)
        }
      }
    })
    if (new Set(guestIds).size !== guestIds.length) out.push(`round ${n}: a guest comes twice`)
    if (r.showReach !== (i === 0)) out.push(i === 0 ? 'round 1 shows the circle of the chain' : 'round 2 is played without the circle')
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [VisitorsRound, VisitorsRound]
    const guests = (r: VisitorsRound) => r.visits.reduce((s, v) => s + v.arrivals.length, 0)
    if (guests(b) <= guests(a)) out.push('round 2 should have more guests than round 1')
    if (b.stools.length <= a.stools.length) out.push('round 2 should have more places for the stool than round 1')
    if (b.visits.filter((v) => v.arrivals.length === 2).length < 2) out.push('round 2 should have two visits with two guests')
  }
  return out
}
