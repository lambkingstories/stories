/**
 * The stars of the four new games of "Hiskia: Ein Brief vor Gott" (`hiskia`): `laufwege` (Send the runners, 2 Chronicles 30), `stadtmorgen` (The city wakes up, 2 Kings 19,35), `sonnenuhr` (How many steps?,
 * 2 Kings 20,8-11) and `stollen` (Meeting in the rock, 2 Kings 20,20). The same count as in the other adventures (Anton): up to two mistakes three stars, up to four two stars, then one; skipping gives none (the
 * stage page does that). `laufwege`: a runner sent to a town that has a letter, one without letters, or a dead end; `sonnenuhr`: a wrong step; `stadtmorgen` has no mistakes, it counts the taps beyond the shortest
 * way; `stollen` counts how near the two tunnels meet. "Help me" costs nothing.
 */
import { mistakeStars } from '@/utils/adventureScore'
import { outcome, TUNNEL_TOLERANCE } from '@/utils/hiskiaNeu'

export function hiskiaStars(mistakes: number): number {
  return mistakeStars(Math.max(0, mistakes), 2, 4)
}

/** `stadtmorgen`: the taps beyond the shortest ways (3 and 5) of both rounds: up to 10 extra taps three stars, up to 20 two stars, then one. */
export function moveStars(extraTaps: number): number {
  return mistakeStars(Math.max(0, extraTaps), 10, 20)
}

/** `stollen`: the stars of one meeting by the distance of the tips (3, 2 or 1; 0 when the tunnels missed each other). */
export function meetStars(gap: number, tol = TUNNEL_TOLERANCE): number {
  return outcome(gap, tol)
}

/** `stollen`: both rounds together, the sum divided by two and rounded down, at least 1. */
export function stollenStars(first: number, second: number): number {
  return Math.max(1, Math.floor((Math.max(0, first) + Math.max(0, second)) / 2))
}
