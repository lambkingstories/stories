/**
 * The big games of the game corner (profile page): real games, not mini games. Each one opens when the child has gathered enough stars on
 * the adventures (the stars of all stages together). The games are played on the whole screen.
 */
export type BigGameId = 'david' | 'mauer'

export interface BigGame {
  id: BigGameId
  /** The stars of all adventures together that open the game. */
  at: number
  /** The picture on its tile (a path below `public/`). */
  image: string
}

export const BIG_GAMES: BigGame[] = [
  { id: 'david', at: 20, image: 'images/spiele-gross/david/wiese.webp' },
  // the tile shows a picture of the Nehemia journey until the painted tile `spiele-gross/mauer/kachel.webp` exists
  { id: 'mauer', at: 40, image: 'images/abenteuer/nehemia/etappe-bild-04.webp' }
]
