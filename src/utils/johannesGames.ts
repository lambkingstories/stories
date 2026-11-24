/**
 * The stars of the three new games of "Johannes der Täufer" (`johannes`): `gebaerde` (Show them, Luke 1,21-22), `abgeben` (Whoever has two gives one away, Luke 3,11) and `zeigen` (Where does John
 * point?, John 1,29.35-37). The same count as in the other adventures (Anton): up to two mistakes three stars, up to four two stars, then one; skipping gives none (the stage page does that).
 * `gebaerde`: a card that the people do not understand is a mistake; `abgeben`: a piece taken from somebody who has only one; `zeigen`: a tap on a man John does not point at. "Help me" costs nothing.
 */
import { mistakeStars } from '@/utils/adventureScore'

export function johannesStars(mistakes: number): number {
  return mistakeStars(Math.max(0, mistakes), 2, 4)
}
