/**
 * The texts of the newer big games, one file per game, so that several games can be built side by side without touching the big text files.
 * They are merged into `app.bigGames.<id>` in `app.ts` (german, english) and `app.es.ts` (spanish).
 */
import activityFlow from './activityFlow'
import arche from './arche'
import bezalel from './bezalel'
import bogen from './bogen'
import common from './common'
import familyFlow from './familyFlow'
import home from './home'
import karawane from './karawane'
import lamm from './lamm'
import memory from './memory'
import mose from './mose'
import nehemia from './nehemia'
import result from './result'
import rooms from './rooms'
import wasser from './wasser'
import whoFlow from './whoFlow'
import wortreise from './wortreise'

export const BIG_GAME_TEXTS = {
  de: { common: common.de, bogen: bogen.de, wasser: wasser.de, arche: arche.de, bezalel: bezalel.de, mose: mose.de, karawane: karawane.de, nehemia: nehemia.de, wortreise: wortreise.de, memory: memory.de, lamm: lamm.de, rooms: rooms.de, result: result.de, home: home.de, familyFlow: familyFlow.de, activityFlow: activityFlow.de, whoFlow: whoFlow.de },
  en: { common: common.en, bogen: bogen.en, wasser: wasser.en, arche: arche.en, bezalel: bezalel.en, mose: mose.en, karawane: karawane.en, nehemia: nehemia.en, wortreise: wortreise.en, memory: memory.en, lamm: lamm.en, rooms: rooms.en, result: result.en, home: home.en, familyFlow: familyFlow.en, activityFlow: activityFlow.en, whoFlow: whoFlow.en },
  es: { common: common.es, bogen: bogen.es, wasser: wasser.es, arche: arche.es, bezalel: bezalel.es, mose: mose.es, karawane: karawane.es, nehemia: nehemia.es, wortreise: wortreise.es, memory: memory.es, lamm: lamm.es, rooms: rooms.es, result: result.es, home: home.es, familyFlow: familyFlow.es, activityFlow: activityFlow.es, whoFlow: whoFlow.es }
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
