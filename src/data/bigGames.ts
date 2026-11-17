/**
 * The big games of the game corner (profile page): real games, not mini games. Each one opens when the child has gathered enough stars on
 * the adventures (the stars of all stages together). The games are played on the whole screen.
 */
export type BigGameId = 'david' | 'elia' | 'wasser' | 'karawane' | 'nehemia' | 'memory' | 'lamm' | 'gideon' | 'mose' | 'bogen'

export interface BigGame {
  id: BigGameId
  /** The stars of all adventures together that open the game. */
  at: number
  /** The picture on its tile (a path below `public/`). */
  image: string
  /** The stars that can be won in all levels together. */
  maxStars: number
}

export const BIG_GAMES: BigGame[] = [
  { id: 'david', at: 20, image: 'images/spiele-gross/david/kachel.webp', maxStars: 30 },
  // the memory with the pictures of the adventures: one board for each of the 37 adventures on the time line, three stars each (see `utils/bilderMemory.ts`)
  { id: 'memory', at: 30, image: 'images/spiele-gross/memory/kachel.webp', maxStars: 111 },
  { id: 'elia', at: 40, image: 'images/spiele-gross/elia/kachel.webp', maxStars: 45 },
  // the catapult puzzle in the style of the birds-and-towers games: 36 levels in 4 chapters, jars, trumpets and torch jars (see `utils/gideonSim.ts`)
  { id: 'gideon', at: 50, image: 'images/spiele-gross/gideon/kachel.webp', maxStars: 108 },
  { id: 'wasser', at: 60, image: 'images/spiele-gross/wasser/kachel.webp', maxStars: 108 },
  // the rope puzzle in the style of Cut the Rope: Moses' basket, 40 levels in 4 chapters (see `utils/moseKorbGame.ts`)
  { id: 'mose', at: 70, image: 'images/spiele-gross/mose/kachel.webp', maxStars: 120 },
  { id: 'nehemia', at: 80, image: 'images/spiele-gross/nehemia/kachel.webp', maxStars: 180 },
  // the path puzzle of the lost lamb (Psalm 23): 5 chapters, three stars each level (see `utils/lammLevels.ts`)
  { id: 'lamm', at: 90, image: 'images/spiele-gross/lamm/kachel.webp', maxStars: 102 },
  { id: 'karawane', at: 100, image: 'images/spiele-gross/karawane/kachel.webp', maxStars: 18 },
  // the archery game of Jonathan's arrows: 44 levels in 4 chapters, wind, ropes, switches, bounces (see `utils/bogenGame.ts`)
  { id: 'bogen', at: 110, image: 'images/spiele-gross/bogen/kachel.webp', maxStars: 132 }
]
