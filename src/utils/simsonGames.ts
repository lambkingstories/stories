/**
 * The stars of the three new games of "Simson" (`simson`): `meiden` (What must she avoid?, Judges 13,4.13-14), `raetsel` (Sweet and strong, Judges 14,14.18) and `torheben` (Lift out the gate,
 * Judges 16,3). The same count as in the other adventures (Anton): up to two mistakes three stars, up to four two stars, then one; skipping gives none (the stage page does that).
 * `meiden`: a thing in the wrong place is a mistake; `raetsel`: a card on the wrong step; `torheben`: a tap on a part that still holds. "Help me" costs nothing.
 */
import { mistakeStars } from '@/utils/adventureScore'

export function simsonStars(mistakes: number): number {
  return mistakeStars(Math.max(0, mistakes), 2, 4)
}
