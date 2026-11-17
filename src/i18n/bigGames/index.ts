/**
 * The texts of the newer big games, one file per game, so that several games can be built side by side without touching the big text files.
 * They are merged into `app.bigGames.<id>` in `app.ts` (german, english) and `app.es.ts` (spanish).
 */
import karawane from './karawane'
import nehemia from './nehemia'
import wasser from './wasser'
import wortreise from './wortreise'

export const BIG_GAME_TEXTS = {
  de: { wasser: wasser.de, karawane: karawane.de, nehemia: nehemia.de, wortreise: wortreise.de },
  en: { wasser: wasser.en, karawane: karawane.en, nehemia: nehemia.en, wortreise: wortreise.en },
  es: { wasser: wasser.es, karawane: karawane.es, nehemia: nehemia.es, wortreise: wortreise.es }
} as Record<'de' | 'en' | 'es', Record<string, Record<string, unknown>>>

/**
 * The texts of the games laid over the big text files. `unplugin-vue-i18n` only accepts `export default { … }` as an object in `app.ts` and
 * `app.es.ts`, so the games' texts are merged where the messages are put together (`main.ts`) and in the tests (`withGameTexts`).
 */
export function gameTextTree(): Record<'de' | 'en' | 'es', { app: { bigGames: Record<string, Record<string, unknown>> } }> {
  return {
    de: { app: { bigGames: BIG_GAME_TEXTS.de } },
    en: { app: { bigGames: BIG_GAME_TEXTS.en } },
    es: { app: { bigGames: BIG_GAME_TEXTS.es } }
  }
}

/** The big text file `app.ts` (de, en) with the games' texts in it, for tests. */
export function withGameTexts<T extends object>(messages: T): T {
  const copy = JSON.parse(JSON.stringify(messages)) as Record<string, { app?: { bigGames?: Record<string, unknown> } }>
  for (const lang of ['de', 'en'] as const) {
    const app = (copy[lang] ??= {}).app ?? (copy[lang]!.app = {})
    app.bigGames = { ...(app.bigGames ?? {}), ...BIG_GAME_TEXTS[lang] }
  }
  return copy as T
}
