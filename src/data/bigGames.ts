/**
 * The big games of the game corner (profile page): real games, not mini games. Each one opens when the child has gathered enough stars on
 * the adventures (the stars of all stages together). The games are played on the whole screen.
 */
export type BigGameId = 'david' | 'elia' | 'wasser' | 'karawane' | 'nehemia' | 'memory'

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
  { id: 'wasser', at: 60, image: 'images/spiele-gross/wasser/kachel.webp', maxStars: 108 },
  { id: 'nehemia', at: 80, image: 'images/spiele-gross/nehemia/kachel.webp', maxStars: 180 },
  { id: 'karawane', at: 100, image: 'images/spiele-gross/karawane/kachel.webp', maxStars: 18 }
]
