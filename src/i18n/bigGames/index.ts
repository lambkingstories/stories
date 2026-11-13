/**
 * The texts of the newer big games, one file per game, so that several games can be built side by side without touching the big text files.
 * They are merged into `app.bigGames.<id>` in `app.ts` (german, english) and `app.es.ts` (spanish).
 */
import arche from './arche'
import karawane from './karawane'
import wasser from './wasser'

export const BIG_GAME_TEXTS = {
  de: { wasser: wasser.de, arche: arche.de, karawane: karawane.de },
  en: { wasser: wasser.en, arche: arche.en, karawane: karawane.en },
  es: { wasser: wasser.es, arche: arche.es, karawane: karawane.es }
} as Record<'de' | 'en' | 'es', Record<string, Record<string, unknown>>>
