/**
 * The six new games of "Salomo" (Anton's plan of 5.11.2026), each mounted with sample data and played through:
 * GameWunschkarten (catching the heart, the other wishes, the rounds), GameFloesse (binding, sailing, cliff, help, landing), GameSchnitzen (tracing the line, slipping, the boards),
 * GameGranatapfel (hanging, checking, help), GameStufen (in step, wrong foot, too fast, too slow in round 2, help) and GameSchatzkammer (tap and tap, wrong shape, the next camel);
 * the goal of "Go on" (`useTaskProgress`), the end with the stars and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/salomo/INTEGRATION.json, written by D:/Claude/Abenteuer-Salomo/tools/i18n_neu_salomo.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameWunschkarten from '@/components/molecules/games/GameWunschkarten.vue'
import GameFloesse from '@/components/molecules/games/GameFloesse.vue'
import GameSchnitzen from '@/components/molecules/games/GameSchnitzen.vue'
import GameGranatapfel from '@/components/molecules/games/GameGranatapfel.vue'
import GameStufen from '@/components/molecules/games/GameStufen.vue'
import GameSchatzkammer from '@/components/molecules/games/GameSchatzkammer.vue'
import { carvingProblems, pomegranatesProblems, raftsProblems, stairsProblems, treasuryProblems, wishCardsProblems } from '@/utils/salomoNeu'
import type { CarveGame, PomGame, RaftGame, StairsGame, TreasuryGame, WishGame } from '@/utils/salomoNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "wishCardsField": "Die Nacht bei Gibeon. Bildkarten schweben am Himmel vorbei.",
    "wishCardsCount": "Gefangene Herzen: {n} von {total}",
    "wishCardsCaught": "Gefangen! Ein gehorsames Herz: {n} von {total}",
    "wishCardsRiches": "Um Reichtum hat Salomo nicht gebeten.",
    "wishCardsLife": "Um ein langes Leben hat Salomo nicht gebeten.",
    "wishCardsVictory": "Um den Sieg über seine Feinde hat Salomo nicht gebeten.",
    "wishCardsRoundDone": "Salomo bittet um ein gehorsames Herz. Diese Bitte gefällt Gott.",
    "wishCardsHelp": "Hilf mir",
    "wishCardsHelping": "Schau: Die Karten schweben jetzt langsam. Fang das Herz!",
    "wishCardsDone": "So wollest du deinem Knecht geben ein gehorsames Herz, daß er dein Volk richten möge und verstehen, was gut und böse ist. (1. Könige 3,9)",
    "raftsField": "Das Meer von oben. Links der Strand von Tyrus, rechts die Küste mit dem hellen Landeplatz.",
    "raftsCount": "Gebundene Stämme: {n} von {total}",
    "raftsBound": "Der Stamm liegt im Floß: {n} von {total}",
    "raftsTied": "Alle Stämme liegen beieinander. Die Seile werden festgebunden.",
    "raftsSail": "Das Floß ist fertig! Tippe aufs Meer, wohin es fahren soll.",
    "raftsSteer": "Steuere das Floß an den Riffen vorbei zum hellen Strand.",
    "raftsWhere": "Ziel: der helle Strand an der Küste",
    "raftsRaft": "Das Floß aus Zedernstämmen",
    "raftsReef": "Ein Riff! Das Floß stößt an. Steuere daran vorbei.",
    "raftsCliff": "Felsen! Hier kann niemand landen. Steuere zum hellen Strand.",
    "raftsArrived": "Angekommen! Salomos Leute holen die Zedern ab.",
    "raftsHelp": "Hilf mir",
    "raftsHelpBind": "Schau: So kommt ein Stamm ins Floß. Tippe die anderen an.",
    "raftsHelping": "Schau zu: Das Floß fährt jetzt von allein an die Küste.",
    "raftsDone": "Meine Knechte sollen die Stämme vom Libanon hinabbringen ans Meer, und will sie in Flöße legen lassen auf dem Meer bis an den Ort, den du mir wirst ansagen lassen, und will sie daselbst abbinden, und du sollst’s holen lassen. (1. Könige 5,9)",
    "carvingField": "Ein Brett aus Zedernholz mit einer goldenen Linie: {thing}",
    "carvingCount": "Brett {n} von {total}: {p} Prozent geschnitzt",
    "carvingOnLine": "Setze das Schnitzeisen auf die goldene Linie.",
    "carvingSlip": "Das Eisen ist abgerutscht! Setze es wieder auf die Linie.",
    "carvingBoardDone": "Fertig geschnitzt: {thing}!",
    "carvingHelp": "Hilf mir",
    "carvingHelping": "Schau: Beim Eisen geht die Linie weiter.",
    "carvingDone": "Inwendig war das ganze Haus eitel Zedern mit gedrehten Knoten und Blumenwerk, daß man keinen Stein sah. (1. Könige 6,18)",
    "pomegranatesField": "Der Knauf einer Säule aus Erz. Daran hängen Ketten mit Haken.",
    "pomegranatesHook": "Haken {n} in Kette {row}",
    "pomegranatesEmpty": "leer",
    "pomegranatesCount": "Leere Haken: {n}",
    "pomegranatesCheck": "Prüfen",
    "pomegranatesRight": "Richtig! Die Kette hängt am Knauf.",
    "pomegranatesWrong": "Das Muster stimmt noch nicht. {n} falsch. Die falschen kommen wieder ab.",
    "pomegranatesHelp": "Hilf mir",
    "pomegranatesHelping": "Schau: Hier gehört hin: {thing}.",
    "pomegranatesDone": "Und machte an jeglichem Knauf zwei Reihen Granatäpfel umher an dem Gitterwerk, womit der Knauf bedeckt ward. (1. Könige 7,18)",
    "stairsField": "Die breite Treppe zum Haus Gottes. Die Priester tragen die Lade hinauf.",
    "stairsLeft": "Links",
    "stairsRight": "Rechts",
    "stairsNow": "jetzt",
    "stairsCount": "Stufen: {n} von {total}",
    "stairsWrongFoot": "Der andere Fuß! Im Gleichschritt: links, rechts, links, rechts.",
    "stairsTooFast": "Langsamer! Die Lade ist schwer. Ruhig, Schritt für Schritt.",
    "stairsTooSlow": "Nicht stehen bleiben! Geh gleichmäßig weiter.",
    "stairsRestart": "Weiter geht es, im Gleichschritt.",
    "stairsArrived": "Oben! Die Priester tragen die Lade ins Haus.",
    "stairsHelp": "Hilf mir",
    "stairsHelping": "Schau: vier Schritte im Gleichschritt. Dann gehst du weiter.",
    "stairsDone": "Also brachten die Priester die Lade des Bundes des HERRN an ihren Ort, in den Chor des Hauses, in das Allerheiligste, unter die Flügel der Cherubim. (1. Könige 8,6)",
    "treasuryField": "Die Vorratskammer des Königs. Unten steht ein Kamel der Königin, oben an der Wand sind die Fächer.",
    "treasurySlot": "Leeres Fach für: {thing}",
    "treasurySlotFull": "Volles Fach: {thing}",
    "treasuryCount": "Leere Fächer: {n}",
    "treasuryChosen": "{thing} in der Hand. Tippe auf das passende Fach.",
    "treasuryChooseFirst": "Nimm zuerst ein Geschenk vom Kamel.",
    "treasuryStored": "Das passt! {thing} liegt im Fach.",
    "treasuryWrong": "Das passt nicht. {thing} braucht ein Fach mit seiner Form.",
    "treasuryFull": "In diesem Fach liegt schon etwas.",
    "treasuryNextCamel": "Das Kamel ist leer. Das nächste kommt.",
    "treasuryRoundDone": "Alle Geschenke liegen in ihren Fächern!",
    "treasuryHelp": "Hilf mir",
    "treasuryHelping": "Schau: {thing} gehört in das leuchtende Fach.",
    "treasuryDone": "Und sie gab dem König hundertzwanzig Zentner Gold und sehr viel Spezerei und Edelgestein. Es kam nicht mehr so viel Spezerei, als die Königin von Reicharabien dem König Salomo gab. (1. Könige 10,10)"
  },
  "en": {
    "wishCardsField": "The night at Gibeon. Picture cards float past in the sky.",
    "wishCardsCount": "Hearts caught: {n} of {total}",
    "wishCardsCaught": "Caught! An obedient heart: {n} of {total}",
    "wishCardsRiches": "Solomon did not ask for riches.",
    "wishCardsLife": "Solomon did not ask for a long life.",
    "wishCardsVictory": "Solomon did not ask for victory over his enemies.",
    "wishCardsRoundDone": "Solomon asks for an obedient heart. God is pleased with this request.",
    "wishCardsHelp": "Help me",
    "wishCardsHelping": "Look: the cards float slowly now. Catch the heart!",
    "wishCardsDone": "Give therefore thy servant an understanding heart to judge thy people, that I may discern between good and bad: for who is able to judge this thy so great a people? (1 Kings 3:9)",
    "raftsField": "The sea from above. On the left the beach of Tyre, on the right the coast with the bright landing place.",
    "raftsCount": "Trunks bound: {n} of {total}",
    "raftsBound": "The trunk lies in the raft: {n} of {total}",
    "raftsTied": "All the trunks lie together. The ropes are tied fast.",
    "raftsSail": "The raft is ready! Tap the sea where it should go.",
    "raftsSteer": "Steer the raft past the reefs to the bright beach.",
    "raftsWhere": "Goal: the bright beach on the coast",
    "raftsRaft": "The raft of cedar trunks",
    "raftsReef": "A reef! The raft bumps into it. Steer past it.",
    "raftsCliff": "Rocks! Nobody can land here. Steer to the bright beach.",
    "raftsArrived": "Arrived! Solomon’s men take the cedars.",
    "raftsHelp": "Help me",
    "raftsHelpBind": "Look: this is how a trunk goes into the raft. Tap the others.",
    "raftsHelping": "Watch: the raft now sails to the coast by itself.",
    "raftsDone": "My servants shall bring them down from Lebanon unto the sea: and I will convey them by sea in floats unto the place that thou shalt appoint me, and will cause them to be discharged there, and thou shalt receive them. (1 Kings 5:9)",
    "carvingField": "A board of cedar wood with a golden line: {thing}",
    "carvingCount": "Board {n} of {total}: {p} percent carved",
    "carvingOnLine": "Put the carving iron on the golden line.",
    "carvingSlip": "The iron slipped! Put it back on the line.",
    "carvingBoardDone": "Carved: {thing}!",
    "carvingHelp": "Help me",
    "carvingHelping": "Look: the line goes on where the iron is.",
    "carvingDone": "And the cedar of the house within was carved with knops and open flowers: all was cedar; there was no stone seen. (1 Kings 6:18)",
    "pomegranatesField": "The capital of a bronze pillar. Chains with hooks hang on it.",
    "pomegranatesHook": "Hook {n} in chain {row}",
    "pomegranatesEmpty": "empty",
    "pomegranatesCount": "Empty hooks: {n}",
    "pomegranatesCheck": "Check",
    "pomegranatesRight": "Right! The chain hangs on the capital.",
    "pomegranatesWrong": "The pattern is not right yet. {n} wrong. The wrong ones come off again.",
    "pomegranatesHelp": "Help me",
    "pomegranatesHelping": "Look: this one belongs here: {thing}.",
    "pomegranatesDone": "And he made the pillars, and two rows round about upon the one network, to cover the chapiters that were upon the top, with pomegranates: and so did he for the other chapiter. (1 Kings 7:18)",
    "stairsField": "The wide stairs to the house of God. The priests carry the ark up.",
    "stairsLeft": "Left",
    "stairsRight": "Right",
    "stairsNow": "now",
    "stairsCount": "Steps: {n} of {total}",
    "stairsWrongFoot": "The other foot! In step: left, right, left, right.",
    "stairsTooFast": "Slower! The ark is heavy. Calmly, step by step.",
    "stairsTooSlow": "Do not stop! Keep walking evenly.",
    "stairsRestart": "On they go, in step.",
    "stairsArrived": "At the top! The priests carry the ark into the house.",
    "stairsHelp": "Help me",
    "stairsHelping": "Look: four steps in step. Then you go on.",
    "stairsDone": "And the priests brought in the ark of the covenant of the LORD unto his place, into the oracle of the house, to the most holy place, even under the wings of the cherubims. (1 Kings 8:6)",
    "treasuryField": "The king’s storeroom. A camel of the queen stands below; the compartments are on the wall above.",
    "treasurySlot": "Empty compartment for: {thing}",
    "treasurySlotFull": "Full compartment: {thing}",
    "treasuryCount": "Empty compartments: {n}",
    "treasuryChosen": "{thing} in your hand. Tap the compartment that fits.",
    "treasuryChooseFirst": "First take a gift from the camel.",
    "treasuryStored": "It fits! {thing} lies in the compartment.",
    "treasuryWrong": "That does not fit. {thing} needs a compartment with its shape.",
    "treasuryFull": "Something already lies in this compartment.",
    "treasuryNextCamel": "The camel is empty. The next one comes.",
    "treasuryRoundDone": "All the gifts lie in their compartments!",
    "treasuryHelp": "Help me",
    "treasuryHelping": "Look: {thing} belongs in the shining compartment.",
    "treasuryDone": "And she gave the king an hundred and twenty talents of gold, and of spices very great store, and precious stones: there came no more such abundance of spices as these which the queen of Sheba gave to king Solomon. (1 Kings 10:10)"
  },
  "es": {
    "wishCardsField": "La noche en Gabaón. Unas tarjetas con dibujos pasan flotando por el cielo.",
    "wishCardsCount": "Corazones atrapados: {n} de {total}",
    "wishCardsCaught": "¡Atrapado! Un corazón dócil: {n} de {total}",
    "wishCardsRiches": "Salomón no pidió riquezas.",
    "wishCardsLife": "Salomón no pidió una vida larga.",
    "wishCardsVictory": "Salomón no pidió la victoria sobre sus enemigos.",
    "wishCardsRoundDone": "Salomón pide un corazón dócil. A Dios le agrada esta petición.",
    "wishCardsHelp": "Ayúdame",
    "wishCardsHelping": "Mira: ahora las tarjetas pasan despacio. ¡Atrapa el corazón!",
    "wishCardsDone": "Da pues á tu siervo corazón dócil para juzgar á tu pueblo, para discernir entre lo bueno y lo malo: porque ¿quién podrá gobernar este tu pueblo tan grande? (1 Reyes 3:9)",
    "raftsField": "El mar visto desde arriba. A la izquierda la playa de Tiro, a la derecha la costa con el lugar claro para desembarcar.",
    "raftsCount": "Troncos atados: {n} de {total}",
    "raftsBound": "El tronco está en la balsa: {n} de {total}",
    "raftsTied": "Todos los troncos están juntos. Se atan las cuerdas.",
    "raftsSail": "¡La balsa está lista! Toca el mar hacia donde debe ir.",
    "raftsSteer": "Guía la balsa entre los arrecifes hasta la playa clara.",
    "raftsWhere": "Meta: la playa clara de la costa",
    "raftsRaft": "La balsa de troncos de cedro",
    "raftsReef": "¡Un arrecife! La balsa choca. Pasa por su lado.",
    "raftsCliff": "¡Rocas! Aquí nadie puede desembarcar. Ve hacia la playa clara.",
    "raftsArrived": "¡Llegó! La gente de Salomón recoge los cedros.",
    "raftsHelp": "Ayúdame",
    "raftsHelpBind": "Mira: así entra un tronco en la balsa. Toca los demás.",
    "raftsHelping": "Mira: ahora la balsa va sola hasta la costa.",
    "raftsDone": "Mis siervos la llevarán desde el Líbano á la mar; y yo la pondré en balsas por la mar hasta el lugar que tú me señalares, y allí se desatará, y tú la tomarás. (1 Reyes 5:9)",
    "carvingField": "Una tabla de cedro con una línea dorada: {thing}",
    "carvingCount": "Tabla {n} de {total}: {p} por ciento tallado",
    "carvingOnLine": "Pon el cincel sobre la línea dorada.",
    "carvingSlip": "¡El cincel resbaló! Ponlo otra vez sobre la línea.",
    "carvingBoardDone": "¡Tallado: {thing}!",
    "carvingHelp": "Ayúdame",
    "carvingHelping": "Mira: la línea sigue donde está el cincel.",
    "carvingDone": "Y la casa estaba cubierta de cedro por de dentro, y tenía entalladuras de calabazas silvestres y de botones de flores. Todo era cedro; ninguna piedra se veía. (1 Reyes 6:18)",
    "pomegranatesField": "El capitel de una columna de bronce. De él cuelgan cadenas con ganchos.",
    "pomegranatesHook": "Gancho {n} de la cadena {row}",
    "pomegranatesEmpty": "vacío",
    "pomegranatesCount": "Ganchos vacíos: {n}",
    "pomegranatesCheck": "Comprobar",
    "pomegranatesRight": "¡Correcto! La cadena cuelga del capitel.",
    "pomegranatesWrong": "El patrón todavía no está bien. {n} mal. Los que están mal se quitan.",
    "pomegranatesHelp": "Ayúdame",
    "pomegranatesHelping": "Mira: aquí va: {thing}.",
    "pomegranatesDone": "Y cuando hubo hecho las columnas, hizo también dos órdenes de granadas alrededor en el un enredado, para cubrir los capiteles que estaban en las cabezas de las columnas con las granadas: y de la misma forma hizo en el otro capitel. (1 Reyes 7:18)",
    "stairsField": "La ancha escalera a la casa de Dios. Los sacerdotes suben el arca.",
    "stairsLeft": "Izquierda",
    "stairsRight": "Derecha",
    "stairsNow": "ahora",
    "stairsCount": "Escalones: {n} de {total}",
    "stairsWrongFoot": "¡El otro pie! Al mismo paso: izquierda, derecha, izquierda, derecha.",
    "stairsTooFast": "¡Más despacio! El arca pesa. Con calma, paso a paso.",
    "stairsTooSlow": "¡No te detengas! Sigue con paso regular.",
    "stairsRestart": "Siguen adelante, al mismo paso.",
    "stairsArrived": "¡Arriba! Los sacerdotes llevan el arca a la casa.",
    "stairsHelp": "Ayúdame",
    "stairsHelping": "Mira: cuatro pasos al mismo paso. Luego sigues tú.",
    "stairsDone": "Y los sacerdotes metieron el arca del pacto de Jehová en su lugar, en el oráculo de la casa, en el lugar santísimo, debajo de las alas de los querubines. (1 Reyes 8:6)",
    "treasuryField": "El almacén del rey. Abajo hay un camello de la reina; arriba, en la pared, están los compartimentos.",
    "treasurySlot": "Compartimento vacío para: {thing}",
    "treasurySlotFull": "Compartimento lleno: {thing}",
    "treasuryCount": "Compartimentos vacíos: {n}",
    "treasuryChosen": "{thing} en la mano. Toca el compartimento que encaja.",
    "treasuryChooseFirst": "Primero toma un regalo del camello.",
    "treasuryStored": "¡Encaja! {thing} está en el compartimento.",
    "treasuryWrong": "No encaja. {thing} necesita un compartimento con su forma.",
    "treasuryFull": "En este compartimento ya hay algo.",
    "treasuryNextCamel": "El camello está vacío. Viene el siguiente.",
    "treasuryRoundDone": "¡Todos los regalos están en sus compartimentos!",
    "treasuryHelp": "Ayúdame",
    "treasuryHelping": "Mira: {thing} va en el compartimento que brilla.",
    "treasuryDone": "Y dió ella al rey ciento y veinte talentos de oro, y muy mucha especiería, y piedras preciosas: nunca vino tan grande copia de especias, como la reina de Seba dió al rey Salomón. (1 Reyes 10:10)"
  }
}
// NEW_KEYS_END

const played: string[] = []
vi.mock('@/use/useSfx', () => ({
  default: () => ({
    play: (n: string) => {
      played.push(n)
      return Promise.resolve()
    },
    preload: vi.fn(),
    stopAll: vi.fn(),
    lengthOf: () => 0,
    enabled: { value: true },
    setEnabled: vi.fn(),
    toggle: vi.fn(),
    playedSince: () => true
  })
}))

type Tree = Record<string, Record<string, Record<string, unknown>>>
function allMessages() {
  const base = { ...(messages as object), ...(spanish as object) } as Tree
  const out: Tree = {}
  for (const loc of ['de', 'en', 'es'] as const) {
    const b = base[loc] ?? {}
    const app = (b.app ?? {}) as Record<string, unknown>
    out[loc] = { ...b, app: { ...app, adventure: { ...((app.adventure as object) ?? {}), ...NEW_KEYS[loc] } } }
  }
  return out
}
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: allMessages() as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ left: 0, top: 0, right: 300, bottom: 200, width: 300, height: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect)
  vi.spyOn(console, 'warn').mockImplementation((...a) => {
    warnings.push(a.map(String).join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...a) => {
    warnings.push('ERROR ' + a.map(String).join(' '))
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
const pointer = (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const until = async (cond: () => boolean, maxSeconds = 30) => {
  for (let i = 0; i < maxSeconds * 10 && !cond(); i++) await tick(100)
  return cond()
}
const S = (image: string, w = 15) => ({ image: `x/${image}.webp`, label: image, w })
type Wr = { findAll: (s: string) => Array<{ text: () => string; trigger: (e: string) => Promise<void> }> }
const helpButton = (w: Wr, label = 'Hilf mir') => w.findAll('button').find((b) => b.text() === label)

// ---------------------------------------------------------------- 1. the wish cards
const WISH: WishGame = {
  background: 'x/nacht.webp',
  cards: { heart: S('Herz'), riches: S('Reichtum'), life: S('Leben'), victory: S('Sieg') },
  cardW: 15,
  rounds: [
    { hint: 'Fang das Herz.', speed: 8, period: 12, need: 2, cards: [{ kind: 'heart', lane: 50, at: 0 }, { kind: 'riches', lane: 17, at: 3 }, { kind: 'life', lane: 83, at: 6 }, { kind: 'victory', lane: 50, at: 9 }] },
    { hint: 'Schneller.', speed: 12, period: 10, need: 2, cards: [{ kind: 'riches', lane: 50, at: 0 }, { kind: 'heart', lane: 17, at: 1.5 }, { kind: 'victory', lane: 83, at: 2.5 }, { kind: 'life', lane: 50, at: 3.2 }] }
  ]
}

describe('Die Wunschkarten (GameWunschkarten)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameWunschkarten, { props: { game: WISH }, ...opts(locale) })
  const card = (w: ReturnType<typeof mountIt>, label: string) => w.findAll('.gm-card').find((c) => c.attributes('aria-label') === label)

  it('the night, the hint, cards as buttons; another wish is a mistake with its word; the heart is caught', async () => {
    expect(wishCardsProblems(WISH)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Gibeon')
    await tick(1500)
    expect(card(w, 'Herz')!.element.tagName).toBe('BUTTON')
    await tick(3000)
    pointer(card(w, 'Reichtum')!.element, 'pointerdown')
    await tick(50)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Um Reichtum hat Salomo nicht gebeten.')
    // the same card again: no second mistake
    pointer(card(w, 'Reichtum')!.element, 'pointerdown')
    await tick(50)
    expect(count('wrong')).toBe(1)
    pointer(card(w, 'Herz')!.element, 'pointerdown')
    await tick(50)
    expect(count('right')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Gefangene Herzen: 1 von 2')
    expect(problems()).toEqual([])
  })

  it('both rounds with the keys; the help after fifteen seconds; the end with the verse', async () => {
    const w = mountIt()
    const field = w.find('.gm-field').element
    const catchHeart = async () => {
      expect(await until(() => !!card(w, 'Herz') && !card(w, 'Herz')!.classes('good'), 20)).toBe(true)
      pointer(card(w, 'Herz')!.element, 'pointerdown')
      await tick(1000)
    }
    await catchHeart()
    await tick(1000)
    // keys: the arrows select a card (it gets a frame), Enter taps it
    expect(await until(() => !!card(w, 'Herz') && card(w, 'Herz')!.classes('good') === false, 20)).toBe(true)
    const selected = () => (w.find('.gm-card.sel').exists() ? w.find('.gm-card.sel').attributes('aria-label') : '')
    for (let k = 0; k < 8 && selected() !== 'Herz'; k++) {
      key(field, 'ArrowRight')
      await flushPromises()
    }
    expect(selected()).toBe('Herz')
    key(field, 'Enter')
    await tick(100)
    expect(count('right')).toBe(2)
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    expect(await until(() => !!helpButton(w), 20)).toBe(true)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('langsam')
    await catchHeart()
    await catchHeart()
    expect(await until(() => w.text().includes('gehorsames Herz, daß er dein Volk richten möge'), 6)).toBe(true)
    expect(count('star')).toBe(1)
    expect(w.emitted('done')).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('English and Spanish words', async () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Hearts caught: 0 of 2')
    expect(en.text()).toContain('Round 1 of 2')
    const es = mountIt('es')
    expect(es.text()).toContain('Corazones atrapados: 0 de 2')
  })
})

// ---------------------------------------------------------------- 2. the rafts
const RAFT: RaftGame = {
  background: 'x/meer.webp',
  trunk: { ...S('Stamm', 13), thick: 2.2 },
  rope: S('Seil', 2),
  reefs: [S('Riff', 10), S('Riff', 10)],
  coast: 88,
  rounds: [
    { hint: 'Binde und steuere.', loose: [{ x: 20, y: 22 }, { x: 22, y: 50 }, { x: 19, y: 78 }], start: { x: 20, y: 50 }, speed: 7, turn: 75, landing: { top: 32, bottom: 58 }, reefs: [{ x: 50, y: 20, r: 4.5, kind: 0 }], route: [{ x: 50, y: 45 }] },
    { hint: 'Mit Strömung.', loose: [{ x: 19, y: 14 }, { x: 22, y: 36 }, { x: 19, y: 58 }, { x: 22, y: 80 }], start: { x: 20, y: 50 }, speed: 8, turn: 70, drift: { x: 0, y: 2 }, landing: { top: 34, bottom: 56 }, reefs: [{ x: 50, y: 20, r: 4.5, kind: 0 }, { x: 55, y: 80, r: 4.5, kind: 1 }], route: [{ x: 50, y: 40 }, { x: 80, y: 38 }] }
  ]
}

describe('Die Flöße (GameFloesse)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameFloesse, { props: { game: RAFT }, ...opts(locale) })

  it('binding the trunks, sailing straight to the landing place; round 2 drifts onto the cliffs, the help steers; the end', async () => {
    expect(raftsProblems(RAFT)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.findAll('.gm-trunk')).toHaveLength(3)
    expect(w.text()).toContain('Gebundene Stämme: 0 von 3')
    for (let i = 0; i < 3; i++) {
      pointer(w.findAll('.gm-trunk')[i]!.element, 'pointerdown')
      await tick(50)
    }
    expect(count('snap')).toBe(3)
    expect(w.text()).toContain('Seile')
    await tick(1700)
    expect(w.find('.gm-raft').exists()).toBe(true)
    expect(w.text()).toContain('Tippe aufs Meer')
    // straight on to the right: the raft lands
    expect(await until(() => w.text().includes('Angekommen'), 15)).toBe(true)
    expect(count('right')).toBe(1)
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    // round 2: Enter binds the trunks one after the other
    const field = w.find('.gm-field').element
    for (let i = 0; i < 4; i++) {
      key(field, 'Enter')
      await tick(50)
    }
    await tick(1700)
    // a tap on the sea far down steers the raft onto the rocks of the coast: a mistake
    pointer(field, 'pointerdown', 260, 190)
    pointer(field, 'pointerup', 260, 190)
    expect(await until(() => count('wrong') > 0, 20)).toBe(true)
    expect(w.text()).toMatch(/Felsen!|Ein Riff!/)
    expect(await until(() => !!helpButton(w), 25)).toBe(true)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('von allein')
    expect(await until(() => w.text().includes('in Flöße legen lassen'), 30)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(9)
    expect(problems()).toEqual([])
  })

  it('English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('Trunks bound: 0 of 3')
  })
})

// ---------------------------------------------------------------- 3. carving
const ring = (): string[] => {
  const rows: string[] = []
  for (let y = 0; y < 20; y++) {
    let r = ''
    for (let x = 0; x < 20; x++) r += Math.abs(Math.hypot(x + 0.5 - 10, y + 0.5 - 10) - 6) < 0.6 ? '#' : '.'
    rows.push(r)
  }
  return rows
}
const CARVE: CarveGame = {
  patterns: [
    { image: 'x/ring.webp', label: 'Ring', rows: ring() },
    { image: 'x/ring2.webp', label: 'Zweiter Ring', rows: ring() }
  ],
  tool: S('Eisen', 14),
  dust: 'x/staub.webp',
  brush: 1.6,
  rounds: [
    { hint: 'Fahre den Ring nach.', patterns: [0], need: 0.8, slip: 3 },
    { hint: 'Noch genauer.', patterns: [1], need: 0.85, slip: 2.4 }
  ]
}

describe('Schnitzen (GameSchnitzen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSchnitzen, { props: { game: CARVE }, ...opts(locale) })
  // the mocked field is 300 x 200 pixels: a cell is 15 x 10 pixels
  const at = (cx: number, cy: number): [number, number] => [(cx / 20) * 300, (cy / 20) * 200]
  const traceRing = async (el: Element, from = 0, to = 1) => {
    const [x0, y0] = at(10 + 6 * Math.cos(from * 2 * Math.PI), 10 + 6 * Math.sin(from * 2 * Math.PI))
    pointer(el, 'pointerdown', x0, y0)
    for (let k = 1; k <= 40; k++) {
      const a = (from + ((to - from) * k) / 40) * 2 * Math.PI
      const [x, y] = at(10 + 6 * Math.cos(a), 10 + 6 * Math.sin(a))
      pointer(el, 'pointermove', x, y)
    }
    pointer(el, 'pointerup')
    await tick(50)
  }

  it('off the line nothing happens; a slip is a mistake; going round the ring finishes the board and the round; the end', async () => {
    expect(carvingProblems(CARVE)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    const field = w.find('.gm-field').element
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Ring')
    pointer(field, 'pointerdown', ...at(10, 10))
    pointer(field, 'pointerup')
    await tick(50)
    expect(w.text()).toContain('Setze das Schnitzeisen auf die goldene Linie.')
    expect(count('wrong')).toBe(0)
    // on the line, then far away: the iron slips
    pointer(field, 'pointerdown', ...at(16, 10))
    pointer(field, 'pointermove', ...at(16, 11))
    pointer(field, 'pointermove', ...at(10, 10))
    pointer(field, 'pointerup')
    await tick(50)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das Eisen ist abgerutscht!')
    expect(w.findAll('.gm-dust').length).toBeGreaterThan(0)
    await traceRing(field, 0, 0.5)
    expect(w.text()).not.toContain('Fertig geschnitzt')
    await traceRing(field, 0.5, 1)
    expect(w.text()).toContain('Fertig geschnitzt: Ring!')
    expect(count('right')).toBe(1)
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    await traceRing(w.find('.gm-field').element, 0, 1.02)
    expect(await until(() => w.text().includes('gedrehten Knoten und Blumenwerk'), 6)).toBe(true)
    expect(problems()).toEqual([])
  })

  it('the keys: Enter sets the iron on the line, the arrows carve; the help after fifteen seconds', async () => {
    const w = mountIt()
    const field = w.find('.gm-field').element
    key(field, 'Enter')
    for (let i = 0; i < 3; i++) key(field, 'ArrowRight')
    await tick(50)
    expect(w.findAll('.gm-dust').length).toBeGreaterThan(0)
    key(field, 'Enter')
    expect(await until(() => !!helpButton(w), 20)).toBe(true)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('Beim Eisen geht die Linie weiter.')
    expect(problems()).toEqual([])
  })

  it('English words', () => {
    expect(mountIt('en').text()).toContain('Board 1 of 1: 0 percent carved')
  })
})

// ---------------------------------------------------------------- 4. pomegranates
const POM: PomGame = {
  background: 'x/saeule.webp',
  items: { granat: S('Granatapfel', 13), lilie: S('Lilie', 13), kette: S('Kettenglied', 13) },
  hook: S('Haken', 5),
  x0: 11,
  x1: 89,
  slotW: 13,
  rounds: [
    { hint: 'Setze das Muster fort.', rows: [{ y: 42, motif: ['granat', 'lilie'], length: 6, given: [0, 1, 2] }] },
    {
      hint: 'Zwei Ketten.',
      rows: [
        { y: 20, motif: ['granat', 'granat', 'lilie'], length: 6, given: [0, 1, 2] },
        { y: 58, motif: ['lilie', 'kette', 'granat'], length: 6, given: [0, 1, 2] }
      ]
    }
  ]
}

describe('Granatäpfel (GameGranatapfel)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameGranatapfel, { props: { game: POM }, ...opts(locale) })
  const hook = (w: ReturnType<typeof mountIt>, r: number, i: number) => w.find(`[data-row="${r}"][data-hook="${i}"]`)
  const check = (w: ReturnType<typeof mountIt>) => w.findAll('button').find((b) => b.text() === 'Prüfen')!

  it('the hooks cycle through the kinds; a wrong check is a mistake and the wrong things come off; the right chain ends the round; help; the end', async () => {
    expect(pomegranatesProblems(POM)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.findAll('.gm-hook')).toHaveLength(6)
    expect(hook(w, 0, 0).attributes('aria-label')).toContain('Granatapfel')
    expect(hook(w, 0, 3).attributes('aria-label')).toContain('leer')
    expect(check(w).attributes('disabled')).toBeDefined()
    // 3: lilie (two taps), 4: granat (one tap), 5: granat (wrong; should be lilie)
    await hook(w, 0, 3).trigger('click')
    await hook(w, 0, 3).trigger('click')
    await hook(w, 0, 4).trigger('click')
    await hook(w, 0, 5).trigger('click')
    expect(hook(w, 0, 3).attributes('aria-label')).toContain('Lilie')
    await check(w).trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('1 falsch')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(1500)
    expect(hook(w, 0, 5).attributes('aria-label')).toContain('leer')
    expect(hook(w, 0, 3).attributes('aria-label')).toContain('Lilie')
    // a locked hook does not change
    await hook(w, 0, 3).trigger('click')
    expect(hook(w, 0, 3).attributes('aria-label')).toContain('Lilie')
    await hook(w, 0, 5).trigger('click')
    await hook(w, 0, 5).trigger('click')
    await check(w).trigger('click')
    expect(w.text()).toContain('Richtig! Die Kette hängt am Knauf.')
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    // round 2: the help hangs the right things one by one
    for (let k = 0; k < 6; k++) {
      expect(await until(() => !!helpButton(w), 20)).toBe(true)
      await helpButton(w)!.trigger('click')
    }
    expect(await until(() => w.text().includes('zwei Reihen Granatäpfel'), 6)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(9)
    expect(problems()).toEqual([])
  })

  it('the arrow keys go from hook to hook', async () => {
    const w = mountIt()
    ;(hook(w, 0, 3).element as HTMLElement).focus()
    key(hook(w, 0, 3).element, 'ArrowRight')
    await flushPromises()
    expect(document.activeElement).toBe(hook(w, 0, 4).element)
  })

  it('English words', () => {
    expect(mountIt('en').text()).toContain('Empty hooks: 3')
  })
})

// ---------------------------------------------------------------- 5. up the steps
const STAIRS: StairsGame = {
  background: 'x/treppe.webp',
  ratio: 0.75,
  group: S('Priester', 50),
  bottom: 99,
  top: 46,
  topScale: 0.45,
  rounds: [
    { hint: 'Links, rechts.', steps: 6, min: 0.35, max: 2.5 },
    { hint: 'Genauer.', steps: 7, min: 0.4, max: 1.3, strict: true }
  ]
}

describe('Die Stufen hinauf (GameStufen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameStufen, { props: { game: STAIRS }, ...opts(locale) })
  const foot = (w: ReturnType<typeof mountIt>, side: 'Links' | 'Rechts') => w.findAll('.gm-foot').find((b) => b.text().startsWith(side) || b.text().includes(side))!

  it('in step up; the wrong foot and a quick step are mistakes; in round 2 a slow step too; the help walks; the end', async () => {
    expect(stairsProblems(STAIRS)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(13)
    pointer(foot(w, 'Links').element, 'pointerdown')
    await tick(100)
    expect(w.text()).toContain('Stufen: 1 von 6')
    pointer(foot(w, 'Rechts').element, 'pointerdown')
    await tick(50)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Langsamer!')
    await tick(600)
    pointer(foot(w, 'Links').element, 'pointerdown')
    await tick(50)
    expect(count('wrong')).toBe(2)
    expect(w.text()).toContain('Der andere Fuß!')
    let side: 'Links' | 'Rechts' = 'Rechts'
    for (let i = 0; i < 5; i++) {
      pointer(foot(w, side).element, 'pointerdown')
      side = side === 'Links' ? 'Rechts' : 'Links'
      await tick(600)
    }
    expect(w.text()).toContain('Oben!')
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    const field = w.find('.gm-field').element
    key(field, 'ArrowLeft')
    await tick(3000)
    key(field, 'ArrowRight')
    await tick(50)
    expect(count('wrong')).toBe(3)
    expect(w.text()).toContain('Nicht stehen bleiben!')
    expect(await until(() => !!helpButton(w), 20)).toBe(true)
    await helpButton(w)!.trigger('click')
    await tick(6000)
    expect(w.text()).toMatch(/Stufen: [45] von 7/)
    for (let i = 0; i < 6 && !w.text().includes('Oben!'); i++) {
      side = w.find('.gm-foot.next').text().includes('Links') ? 'Links' : 'Rechts'
      pointer(foot(w, side).element, 'pointerdown')
      await tick(700)
    }
    expect(await until(() => w.text().includes('unter die Flügel der Cherubim'), 6)).toBe(true)
    expect(problems()).toEqual([])
  })

  it('English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('Steps: 0 of 6')
    expect(w.text()).toContain('Left')
  })
})

// ---------------------------------------------------------------- 6. the treasury
const TREASURY: TreasuryGame = {
  background: 'x/kammer.webp',
  camel: { ...S('Kamel', 36), x: 80, y: 98 },
  board: [{ x: 79, y: 49 }, { x: 90.5, y: 49 }, { x: 84.7, y: 35 }],
  items: { sack: S('Gewürze', 12), barren: S('Gold', 12), stein: S('Edelstein', 12) },
  niches: { sack: S('Fach Gewürze', 15), barren: S('Fach Gold', 15), stein: S('Fach Edelsteine', 15) },
  rounds: [
    { hint: 'Ein Kamel.', slots: [{ shape: 'sack', x: 22, y: 32 }, { shape: 'barren', x: 38, y: 32 }, { shape: 'stein', x: 54, y: 32 }], camels: [['sack', 'barren', 'stein']] },
    {
      hint: 'Zwei Kamele.',
      slots: [
        { shape: 'barren', x: 22, y: 20 },
        { shape: 'stein', x: 38, y: 20 },
        { shape: 'sack', x: 54, y: 20 },
        { shape: 'sack', x: 22, y: 46 },
        { shape: 'barren', x: 38, y: 46 },
        { shape: 'stein', x: 54, y: 46 }
      ],
      camels: [['stein', 'sack', 'barren'], ['barren', 'stein', 'sack']]
    }
  ]
}

describe('Die Schatzkammer (GameSchatzkammer)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSchatzkammer, { props: { game: TREASURY }, ...opts(locale) })
  const gift = (w: ReturnType<typeof mountIt>, label: string) => w.findAll('.gm-gift').find((b) => b.attributes('aria-label') === label)
  const slots = (w: ReturnType<typeof mountIt>) => w.findAll('.gm-slot')
  const tap = async (el: Element) => {
    pointer(el, 'pointerdown', 250, 100)
    pointer(el, 'pointerup', 250, 100)
    await tick(30)
  }
  const store = async (w: ReturnType<typeof mountIt>, label: string, shape: string) => {
    expect(await until(() => !!gift(w, label), 5)).toBe(true)
    await tap(gift(w, label)!.element)
    const k = slots(w).findIndex((s) => s.attributes('aria-label')!.startsWith('Leeres') && s.attributes('aria-label')!.includes(shape))
    await slots(w)[k]!.trigger('click')
  }

  it('tap a gift, then a compartment; the wrong shape is a mistake; a drag stores too; the next camel; the end', async () => {
    expect(treasuryProblems(TREASURY)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.findAll('.gm-gift')).toHaveLength(3)
    await slots(w)[0]!.trigger('click')
    expect(w.text()).toContain('Nimm zuerst ein Geschenk vom Kamel.')
    await tap(gift(w, 'Gold')!.element)
    expect(w.text()).toContain('Gold in der Hand.')
    await slots(w)[0]!.trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das passt nicht.')
    await slots(w)[1]!.trigger('click')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Das passt! Gold liegt im Fach.')
    // a drag: from the gift to the middle of the first compartment (x 22 %, y 32 % of 300 x 200)
    const g = gift(w, 'Gewürze')!.element
    pointer(g, 'pointerdown', 237, 98)
    pointer(w.find('.gm-field').element, 'pointermove', 66, 64)
    pointer(w.find('.gm-field').element, 'pointerup', 66, 64)
    await tick(30)
    expect(count('right')).toBe(2)
    await store(w, 'Edelstein', 'Edelstein')
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    await store(w, 'Edelstein', 'Edelstein')
    await store(w, 'Gewürze', 'Gewürze')
    await store(w, 'Gold', 'Gold')
    expect(w.text()).toContain('Das Kamel ist leer.')
    await tick(2000)
    await store(w, 'Gold', 'Gold')
    await store(w, 'Edelstein', 'Edelstein')
    await store(w, 'Gewürze', 'Gewürze')
    expect(await until(() => w.text().includes('hundertzwanzig Zentner Gold'), 6)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(9)
    expect(problems()).toEqual([])
  })

  it('the help shows a gift and its compartment', async () => {
    const w = mountIt()
    expect(await until(() => !!helpButton(w), 20)).toBe(true)
    await helpButton(w)!.trigger('click')
    expect(w.find('.gm-slot.hinted').exists()).toBe(true)
    expect(w.text()).toContain('gehört in das leuchtende Fach')
  })

  it('Spanish words', () => {
    expect(mountIt('es').text()).toContain('Compartimentos vacíos: 3')
  })
})
