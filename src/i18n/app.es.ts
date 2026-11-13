import teil1 from '@/i18n/es/teil1'
import teil2 from '@/i18n/es/teil2'
import teil3 from '@/i18n/es/teil3'
import { BIG_GAME_TEXTS } from '@/i18n/bigGames'

/**
 * The Spanish screens, translated from the English texts. The stories, books and adventures are not translated yet (Spanish
 * screens show the English ones, see `contentLocale`). A text that is missing here is shown in English (see `main.ts`).
 */
const rest = teil3 as Record<string, Record<string, unknown>>
// the texts of the newer big games live in their own files (`bigGames/`)
rest.bigGames = { ...rest.bigGames, ...BIG_GAME_TEXTS.es }

export default {
  es: {
    app: {
      nav: { home: 'Inicio', series: 'Leer', hoeren: 'Escuchar', color: 'Pintar', abenteuer: 'Aventura', profile: 'Yo' },
      adventure: { ...teil1, ...teil2 },
      ...rest
    }
  }
}
