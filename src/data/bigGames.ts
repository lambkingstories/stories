/**
 * The adventure games ("My games" in the profile area): real games, not small stage games. The games are played on the whole screen.
 * How they open (Anton, 17.11.2026): for every full `STEP` stars on the adventures (the stars of all stages together) the child may pick
 * one game it wants to play, and it picks which one (see `utils/bigGames.ts` and `use/useGameWishes.ts`). The choice is for good.
 */
export type BigGameId = 'david' | 'elia' | 'wasser' | 'karawane' | 'nehemia' | 'memory' | 'lamm' | 'mose' | 'bogen' | 'arche' | 'bezalel'

/**
 * The stars of all adventures together that give one wish for a game. 40 stars: with about 300 stars (the nine adventures of the store
 * version) that is 7 wishes; with 50 it would be 6 (see the report). Change only this number to change the rhythm.
 */
export const STEP = 40

export interface BigGame {
  id: BigGameId
  /** The picture on its tile (a path below `public/`). */
  image: string
  /** The stars that can be won in all levels together. */
  maxStars: number
  /** Opens by itself at this many stars on the adventures (a gift: it needs no wish and uses none). */
  freeAt?: number
}

export const BIG_GAMES: BigGame[] = [
  // David's sling is free from the start (Anton, 18.11.2026): it needs no stars and no wish; all the other games open with a wish, one for every 40 stars
  { id: 'david', image: 'images/spiele-gross/david/kachel.webp', maxStars: 30, freeAt: 0 },
  // the memory with the pictures of the adventures: one board for each of the 38 adventures on the time line, three stars each (see `utils/bilderMemory.ts`)
  { id: 'memory', image: 'images/spiele-gross/memory/kachel-2.webp', maxStars: 114 },
  { id: 'elia', image: 'images/spiele-gross/elia/kachel.webp', maxStars: 45 },
  { id: 'wasser', image: 'images/spiele-gross/wasser/kachel-hiskia.webp', maxStars: 108 },
  // the rope puzzle in the style of Cut the Rope: Moses' basket, 40 levels in 4 chapters (see `utils/moseKorbGame.ts`)
  { id: 'mose', image: 'images/spiele-gross/mose/kachel.webp', maxStars: 120 },
  { id: 'nehemia', image: 'images/spiele-gross/nehemia/kachel.webp', maxStars: 180 },
  // the path puzzle of the lost lamb (Psalm 23): 5 chapters, three stars each level (see `utils/lammLevels.ts`)
  { id: 'lamm', image: 'images/spiele-gross/lamm/kachel-2.webp', maxStars: 102 },
  { id: 'karawane', image: 'images/spiele-gross/karawane/kachel.webp', maxStars: 18 },
  // the archery game of Jonathan's arrows: 44 levels in 4 chapters, wind, ropes, switches, bounces (see `utils/bogenGame.ts`)
  { id: 'bogen', image: 'images/spiele-gross/bogen/kachel-2.webp', maxStars: 132 },
  // the match-3 game of the animal pairs on Noah's ark: 60 levels in 6 chapters, special stones, obstacles, helpers (see `utils/archeGame.ts`)
  { id: 'arche', image: 'images/spiele-gross/arche/kachel.webp', maxStars: 180 },
  // the tangram game of Bezalel's workshop (Exodus 31, 25 to 40): seven pieces into a dark outline, 40 objects of the tabernacle in 4 chapters (see `utils/bezalelGame.ts`)
  { id: 'bezalel', image: 'images/spiele-gross/bezalel/kachel.webp', maxStars: 120 }
]
