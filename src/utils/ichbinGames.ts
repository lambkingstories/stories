/**
 * The stars of the two new games of "Jesus erzählt von sich" (`ichbin`): `wehen` (Which way does the wind blow?, John 3,8) and `hirtenruf` (The call of the shepherd, John 10,3-5).
 * The same count as in the other adventures (Anton): up to two mistakes three stars, up to four two stars, then one.
 * `wehen`: a tap on the wrong tablet is a mistake; `hirtenruf`: a tap on the wrong caller is a mistake (the calls of round 1 cannot go wrong).
 */
import { mistakeStars } from '@/utils/adventureScore'

export function ichbinStars(mistakes: number): number {
  return mistakeStars(Math.max(0, mistakes), 2, 4)
}
