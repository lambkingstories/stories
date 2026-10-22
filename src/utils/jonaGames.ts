/**
 * The pure parts of the new games of "Jona" (the components only draw and listen): the cargo that slides to and fro on the deck, the wave that runs up the beach
 * and back, the sack that fits a figure, and the sun, the shade and the heat of the shade game. All times are in milliseconds unless the name says seconds.
 */
import type { SacksFigure, SacksGame, ShadeRound, ShoreRound } from '@/types/adventure'

/** Where a piece of cargo is at the time `t` (ms): it slides sine-like round `base` (percent), `amp` percent to each side, one slide to and fro takes `periodMs`. */
export function slideX(t: number, base: number, amp: number, periodMs: number, phase = 0): number {
  if (!amp || !periodMs) return base
  return base + amp * Math.sin((2 * Math.PI * t) / periodMs + phase)
}

/** How high the ship lies in the water: 0 with all the cargo on board, 1 with none (a part of the way the ship can rise). */
export function shipRise(thrown: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, thrown / total))
}

/** Whether a tap on the deck at this place (percent) hits a piece that lies at `x` (percent) and is `w` wide (percent): a generous hit box (a finger is bigger than a barrel). */
export function hitsPiece(tapX: number, pieceX: number, w: number, slack = 1.6): boolean {
  return Math.abs(tapX - pieceX) <= (w / 2) * slack
}

/**
 * The front of the wave at the time `t` (ms), as a percent from the top of the beach picture: it runs from `low` (the sea) up to `high` (the highest place) and back, one wave takes `periodMs`.
 * At the time 0 the wave lies at `low`, so every round starts with the beach dry.
 */
export function waveFront(t: number, round: Pick<ShoreRound, 'periodMs' | 'high' | 'low'>): number {
  const phase = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / round.periodMs)
  return round.low - (round.low - round.high) * phase
}

/** The wave has reached a shell that lies at `shellY` (percent from the top) when its front is at or above that place. */
export function isWashed(shellY: number, front: number): boolean {
  return front <= shellY
}

/** The shells of a round that lie in the reach of the wave (they have to be taken when the wave goes back). */
export function shellsAtRisk(round: Pick<ShoreRound, 'high' | 'low' | 'shells'>): number {
  return round.shells.filter((s) => s.y >= round.high && s.y <= round.low).length
}

/** A washed-away shell comes back higher up the beach, in the dry sand above the reach of the wave (a few percent apart, so that it does not lie on another shell). */
export function respawnY(round: Pick<ShoreRound, 'high'>, index: number): number {
  return Math.max(12, round.high - 6 - (index % 3) * 6)
}

/** Which size of sack a figure needs: the children small ones, the grown-ups and the animals big ones ("the great and the small", "man and beast"). */
export function needsSack(who: SacksFigure['who']): 'small' | 'big' {
  return who === 'child' ? 'small' : 'big'
}

/** All the figures of a sacks game that need a sack (every round). */
export function sackTotal(game: Pick<SacksGame, 'rounds'>): number {
  return game.rounds.reduce((sum, r) => sum + r.figures.length, 0)
}

/** Where the sun is when it has gone `progress` (0 to 1) of its way: it climbs from the left in an arc and sets at the right (percent of the picture). */
export function sunAt(progress: number): { x: number; y: number } {
  const p = Math.min(1, Math.max(0, progress))
  return { x: 10 + 80 * p, y: 34 - 26 * Math.sin(Math.PI * p) }
}

/** Where the middle of the roof has to be so that its shadow falls on Jonah: on the line from Jonah to the sun, a third of the way to the sun. */
export function roofTarget(sun: { x: number; y: number }, jonah: { x: number; y: number }): { x: number; y: number } {
  return { x: jonah.x + (sun.x - jonah.x) * 0.34, y: jonah.y + (sun.y - jonah.y) * 0.34 }
}

/** The shade of the roof covers Jonah when the middle of the roof lies within `tolerance` percent of the picture width of the right place (the picture is 4:3, so the height counts three quarters). */
export function inShade(roof: { x: number; y: number }, target: { x: number; y: number }, tolerance: number): boolean {
  return Math.hypot(roof.x - target.x, (roof.y - target.y) * 0.75) <= tolerance
}

/** The heat of Jonah after `dtMs`: in the sun it rises (full after 4 s), in the shade it falls (empty after 2.5 s); always between 0 and 1. */
export function heatStep(heat: number, dtMs: number, shaded: boolean): number {
  const next = shaded ? heat - dtMs / 2500 : heat + dtMs / 4000
  return Math.min(1, Math.max(0, next))
}

/** The number of small parts the shade game counts for a round (one for every fifth of a second in the shade); the goal of the whole task is the sum. */
export function shadeParts(round: Pick<ShadeRound, 'seconds'>): number {
  return Math.round(round.seconds * 5)
}
