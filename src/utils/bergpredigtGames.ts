/**
 * The stars of the three new games of "Die Bergpredigt" (`bergpredigt`): `selig` (Whom is the word for?, Matthew 5,3-6), `scheffel` (Where does the light belong?, Matthew 5,15-16) and
 * `nahblick` (Look closely, Matthew 6,28). The same count as in the other adventures (Anton): up to two mistakes three stars, up to four two stars, then one.
 * `selig`: a gift on the wrong listener is a mistake; `scheffel`: a lamp on a place that leaves somebody in the dark is a mistake (round 2 only); `nahblick`: a tap on a blossom without a guest is a mistake.
 */
import { mistakeStars } from '@/utils/adventureScore'

export function bergStars(mistakes: number): number {
  return mistakeStars(Math.max(0, mistakes), 2, 4)
}
