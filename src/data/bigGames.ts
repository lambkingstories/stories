/**
 * The adventure games ("My games" in the profile area): real games, not small stage games. The games are played on the whole screen.
 * How they open (Anton, 17.11.2026): for every full `STEP` stars on the adventures (the stars of all stages together) the child may pick
 * one game it wants to play, and it picks which one (see `utils/bigGames.ts` and `use/useGameWishes.ts`). The choice is for good.
 */
export type BigGameId = 'david' | 'elia' | 'wasser' | 'karawane' | 'nehemia' | 'memory' | 'lamm' | 'mose' | 'bogen' | 'toepfer' | 'bezalel'

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
}

export const BIG_GAMES: BigGame[] = [
  { id: 'david', image: 'images/spiele-gross/david/kachel.webp', maxStars: 30 },
  // the memory with the pictures of the adventures: one board for each of the 37 adventures on the time line, three stars each (see `utils/bilderMemory.ts`)
  { id: 'memory', image: 'images/spiele-gross/memory/kachel-2.webp', maxStars: 111 },
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
  // the pottery game of Jeremiah 18: form the clay on the wheel like the template, fire and paint it, 30 vessels in 5 chapters (see `utils/toepferGame.ts`)
  { id: 'toepfer', image: 'images/spiele-gross/toepfer/kachel.webp', maxStars: 90 },
  // the tangram game of Bezalel's workshop (Exodus 31, 25 to 40): seven pieces into a dark outline, 40 objects of the tabernacle in 4 chapters (see `utils/bezalelGame.ts`)
  { id: 'bezalel', image: 'images/spiele-gross/bezalel/kachel.webp', maxStars: 120 }
]
