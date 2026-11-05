/**
 * The five new games of "Josef" (`garben` = GameGarben, `keltern` = GameKeltern, `kuehenil` = GameKuehenil, `umarmen` = GameUmarmen, `begegnung` = GameBegegnung), each mounted with
 * sample data and played through: turning sheaves (tap, a bowing sheaf tapped again, keys, help); pressing grapes (not full, full, running over, keys, help); tapping cows (fat, lean,
 * one that walks by and comes again, help); Benjamin first (keys, help); two teams on the road (a finger in each half, a bump, keys, help); the rounds, the goal of "Go on"
 * (`useTaskProgress`), the end with the stars and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (written from D:/Claude/Abenteuer-Josef/tools/i18n_neu_josef.py, the same as INTEGRATION.json).
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameGarben from '@/components/molecules/games/GameGarben.vue'
import GameKeltern from '@/components/molecules/games/GameKeltern.vue'
import GameKuehenil from '@/components/molecules/games/GameKuehenil.vue'
import GameUmarmen from '@/components/molecules/games/GameUmarmen.vue'
import GameBegegnung from '@/components/molecules/games/GameBegegnung.vue'
import type { EmbraceGame, MeetingGame, NileCowsGame, SheavesGame, WinePressGame } from '@/utils/josefNeu'

// ---------------------------------------------------------------- the new words (generated from the tool)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "sheavesBowField": "Das abgeerntete Feld von oben. In der Mitte steht Josefs Garbe, rundherum liegen elf Garben.",
    "sheavesBowJosef": "Josefs Garbe steht aufrecht",
    "sheavesBowSheaf": "Garbe {n}",
    "sheavesBowBowing": "sie verneigt sich",
    "sheavesBowRight": "Diese Garbe verneigt sich! ({n} von {total})",
    "sheavesBowAlready": "Die verneigt sich schon. Lass sie so.",
    "sheavesBowCount": "Verneigt: {n} von {total}",
    "sheavesBowKeys": "Links und rechts: eine Garbe wählen. Enter: drehen.",
    "sheavesBowHelp": "Hilf mir",
    "sheavesBowHelping": "Schau zu: Diese Garbe dreht sich, bis sie sich verneigt.",
    "sheavesBowHelped": "Jetzt verneigt sie sich. ({n} von {total})",
    "sheavesBowRoundDone": "Alle Garben ringsum neigen sich vor Josefs Garbe.",
    "sheavesBowDone": "Mich deuchte, wir banden Garben auf dem Felde, und meine Garbe richtete sich auf und stand, und eure Garben umher neigten sich vor meiner Garbe. (1. Mose 37,7)",
    "winePressField": "Der Traum des Mundschenks: der Weinstock mit drei Reben, darunter der Becher des Pharao.",
    "winePressGrapes": "Die Trauben. Gedrückt halten: auspressen",
    "winePressCup": "Der Becher des Pharao",
    "winePressHold": "Drücken (gedrückt halten)",
    "winePressCount": "Becher {cup} von {cups}: {n} % voll",
    "winePressMore": "Noch nicht voll ({n} %). Drück noch einmal.",
    "winePressFull": "Der Becher ist voll, und nichts ist übergelaufen!",
    "winePressOver": "Oh, er ist übergelaufen! Der Mundschenk nimmt einen sauberen Becher.",
    "winePressNextCup": "Noch ein Becher!",
    "winePressHelp": "Hilf mir",
    "winePressHelping": "Schau zu: Er lässt los, sobald der Becher voll ist.",
    "winePressHelped": "So! Der Becher ist voll.",
    "winePressRoundDone": "Der Mundschenk gibt dem Pharao den Becher in die Hand.",
    "winePressDone": "… und ich hatte den Becher Pharaos in meiner Hand und nahm die Beeren und zerdrückte sie in den Becher und gab den Becher Pharao in die Hand. (1. Mose 40,11)",
    "nileCowsField": "Die Wiese am Nil. Rechts steigen die Kühe aus dem Wasser.",
    "nileCowsFatName": "Eine dicke, schöne Kuh",
    "nileCowsLeanName": "Eine magere Kuh",
    "nileCowsMeadow": "Die Weide mit den dicken Kühen",
    "nileCowsCount": "Dicke Kühe auf der Weide: {n} von {total}",
    "nileCowsFat": "Eine dicke Kuh! Sie geht auf die Weide. ({n} von 7)",
    "nileCowsLean": "Diese Kuh ist mager. Lass sie vorbeiziehen.",
    "nileCowsMissed": "Eine dicke Kuh ist vorbeigezogen. Sie kommt noch einmal.",
    "nileCowsChosen": "Diese Kuh ist gewählt. Enter: antippen.",
    "nileCowsKeys": "Links und rechts: eine Kuh wählen. Enter: antippen.",
    "nileCowsHelp": "Hilf mir",
    "nileCowsHelping": "Schau: Die nächste dicke Kuh wird gezeigt.",
    "nileCowsHelped": "Das war eine dicke Kuh. ({n} von 7)",
    "nileCowsRoundDone": "Sieben dicke Kühe sind auf der Weide.",
    "nileCowsDone": "… und sähe aus dem Wasser steigen sieben schöne, fette Kühe; die gingen auf der Weide im Grase. (1. Mose 41,2)",
    "embrace2Field": "Josefs Saal in Ägypten. Die Brüder stehen erschrocken da, Josef geht zu ihnen.",
    "embrace2Josef": "Josef",
    "embrace2IsScared": "erschrocken",
    "embrace2IsGlad": "froh",
    "embrace2Count": "Umarmt: {n} von {total}",
    "embrace2Benjamin": "Zuerst zu Benjamin, dem Jüngsten!",
    "embrace2BenjaminGlad": "Josef fällt Benjamin um den Hals, und beide weinen.",
    "embrace2Glad": "Josef umarmt {name}. Jetzt ist {name} froh.",
    "embrace2Already": "{name} ist schon froh.",
    "embrace2Keys": "Links und rechts: einen Bruder wählen. Enter: Josef geht zu ihm.",
    "embrace2Help": "Hilf mir",
    "embrace2Helping": "Schau: Josef geht zu {name}.",
    "embrace2RoundDone": "Josef hat alle umarmt. Jetzt reden die Brüder mit ihm.",
    "embrace2Done": "Und er fiel seinem Bruder Benjamin um den Hals und weinte; und Benjamin weinte auch an seinem Halse. Und er küßte alle seine Brüder und weinte über ihnen. Darnach redeten seine Brüder mit ihm. (1. Mose 45,14–15)",
    "meetingField": "Die Straße im Land Gosen. Links fährt Josef, rechts kommt Jakob. Links tippen lenkt Josef, rechts tippen lenkt Jakob.",
    "meetingJosef": "Josefs Wagen, Spur {n}",
    "meetingJakob": "Jakobs Wagen, Spur {n}",
    "meetingThing": "Etwas liegt auf der Straße",
    "meetingCount": "Vorbei: {n} von {total}",
    "meetingBumpJosef": "Halt! Josefs Wagen steht vor einem Hindernis. Lenk ihn in eine andere Spur.",
    "meetingBumpJakob": "Halt! Jakobs Wagen steht vor einem Hindernis. Lenk ihn in eine andere Spur.",
    "meetingJosefThere": "Josef ist am Brunnen.",
    "meetingJakobThere": "Jakob ist am Brunnen.",
    "meetingMet": "Sie sind da! Josef fällt seinem Vater um den Hals und weint lange.",
    "meetingChosenJosef": "Josefs Wagen ist gewählt.",
    "meetingChosenJakob": "Jakobs Wagen ist gewählt.",
    "meetingKeys": "Hoch und runter: die Spur wechseln. Links und rechts: Josef oder Jakob wählen.",
    "meetingHelp": "Hilf mir",
    "meetingHelping": "Schau zu: Beide Wagen fahren an allem vorbei.",
    "meetingDone": "Da spannte Joseph seinen Wagen an und zog hinauf, seinem Vater Israel entgegen, nach Gosen. Und da er ihn sah, fiel er ihm um den Hals und weinte lange an seinem Halse. (1. Mose 46,29)"
  },
  "en": {
    "sheavesBowField": "The harvested field from above. Joseph’s sheaf stands in the middle, eleven sheaves lie around it.",
    "sheavesBowJosef": "Joseph’s sheaf stands upright",
    "sheavesBowSheaf": "Sheaf {n}",
    "sheavesBowBowing": "it bows",
    "sheavesBowRight": "This sheaf bows! ({n} of {total})",
    "sheavesBowAlready": "It bows already. Leave it as it is.",
    "sheavesBowCount": "Bowing: {n} of {total}",
    "sheavesBowKeys": "Left and right: choose a sheaf. Enter: turn it.",
    "sheavesBowHelp": "Help me",
    "sheavesBowHelping": "Watch: this sheaf turns until it bows.",
    "sheavesBowHelped": "Now it bows. ({n} of {total})",
    "sheavesBowRoundDone": "All the sheaves around bow down to Joseph’s sheaf.",
    "sheavesBowDone": "For, behold, we were binding sheaves in the field, and, lo, my sheaf arose, and also stood upright; and, behold, your sheaves stood round about, and made obeisance to my sheaf. (Genesis 37:7)",
    "winePressField": "The cupbearer’s dream: the vine with three branches, and Pharaoh’s cup below it.",
    "winePressGrapes": "The grapes. Hold down: press them",
    "winePressCup": "Pharaoh’s cup",
    "winePressHold": "Press (hold down)",
    "winePressCount": "Cup {cup} of {cups}: {n} % full",
    "winePressMore": "Not full yet ({n} %). Press again.",
    "winePressFull": "The cup is full, and nothing ran over!",
    "winePressOver": "Oh, it ran over! The cupbearer takes a clean cup.",
    "winePressNextCup": "One more cup!",
    "winePressHelp": "Help me",
    "winePressHelping": "Watch: he lets go as soon as the cup is full.",
    "winePressHelped": "There! The cup is full.",
    "winePressRoundDone": "The cupbearer gives the cup into Pharaoh’s hand.",
    "winePressDone": "And Pharaoh’s cup was in my hand: and I took the grapes, and pressed them into Pharaoh’s cup, and I gave the cup into Pharaoh’s hand. (Genesis 40:11)",
    "nileCowsField": "The meadow by the Nile. On the right the cows come up out of the water.",
    "nileCowsFatName": "A fat, fine cow",
    "nileCowsLeanName": "A thin cow",
    "nileCowsMeadow": "The pasture with the fat cows",
    "nileCowsCount": "Fat cows in the pasture: {n} of {total}",
    "nileCowsFat": "A fat cow! It goes to the pasture. ({n} of 7)",
    "nileCowsLean": "This cow is thin. Let it walk by.",
    "nileCowsMissed": "A fat cow walked by. It comes once more.",
    "nileCowsChosen": "This cow is chosen. Enter: tap it.",
    "nileCowsKeys": "Left and right: choose a cow. Enter: tap it.",
    "nileCowsHelp": "Help me",
    "nileCowsHelping": "Look: the next fat cow is shown.",
    "nileCowsHelped": "That was a fat cow. ({n} of 7)",
    "nileCowsRoundDone": "Seven fat cows are in the pasture.",
    "nileCowsDone": "And, behold, there came up out of the river seven well favoured kine and fatfleshed; and they fed in a meadow. (Genesis 41:2)",
    "embrace2Field": "Joseph’s hall in Egypt. The brothers stand there frightened; Joseph goes to them.",
    "embrace2Josef": "Joseph",
    "embrace2IsScared": "frightened",
    "embrace2IsGlad": "glad",
    "embrace2Count": "Hugged: {n} of {total}",
    "embrace2Benjamin": "First go to Benjamin, the youngest!",
    "embrace2BenjaminGlad": "Joseph falls on Benjamin’s neck, and both weep.",
    "embrace2Glad": "Joseph hugs {name}. Now {name} is glad.",
    "embrace2Already": "{name} is glad already.",
    "embrace2Keys": "Left and right: choose a brother. Enter: Joseph goes to him.",
    "embrace2Help": "Help me",
    "embrace2Helping": "Look: Joseph goes to {name}.",
    "embrace2RoundDone": "Joseph has hugged them all. Now the brothers talk with him.",
    "embrace2Done": "And he fell upon his brother Benjamin’s neck, and wept; and Benjamin wept upon his neck. Moreover he kissed all his brethren, and wept upon them: and after that his brethren talked with him. (Genesis 45:14–15)",
    "meetingField": "The road in the land of Goshen. Joseph drives on the left, Jacob comes on the right. Tap on the left to steer Joseph, on the right to steer Jacob.",
    "meetingJosef": "Joseph’s chariot, lane {n}",
    "meetingJakob": "Jacob’s wagon, lane {n}",
    "meetingThing": "Something lies on the road",
    "meetingCount": "Passed: {n} of {total}",
    "meetingBumpJosef": "Stop! Joseph’s chariot is stuck in front of something. Steer it into another lane.",
    "meetingBumpJakob": "Stop! Jacob’s wagon is stuck in front of something. Steer it into another lane.",
    "meetingJosefThere": "Joseph is at the well.",
    "meetingJakobThere": "Jacob is at the well.",
    "meetingMet": "They are there! Joseph falls on his father’s neck and weeps a long time.",
    "meetingChosenJosef": "Joseph’s chariot is chosen.",
    "meetingChosenJakob": "Jacob’s wagon is chosen.",
    "meetingKeys": "Up and down: change lane. Left and right: choose Joseph or Jacob.",
    "meetingHelp": "Help me",
    "meetingHelping": "Watch: both teams drive past everything.",
    "meetingDone": "And Joseph made ready his chariot, and went up to meet Israel his father, to Goshen, and presented himself unto him; and he fell on his neck, and wept on his neck a good while. (Genesis 46:29)"
  },
  "es": {
    "sheavesBowField": "El campo segado visto desde arriba. En el centro está la gavilla de José, alrededor hay once gavillas.",
    "sheavesBowJosef": "La gavilla de José está derecha",
    "sheavesBowSheaf": "Gavilla {n}",
    "sheavesBowBowing": "se inclina",
    "sheavesBowRight": "¡Esta gavilla se inclina! ({n} de {total})",
    "sheavesBowAlready": "Esa ya se inclina. Déjala así.",
    "sheavesBowCount": "Inclinadas: {n} de {total}",
    "sheavesBowKeys": "Izquierda y derecha: elige una gavilla. Enter: girarla.",
    "sheavesBowHelp": "Ayúdame",
    "sheavesBowHelping": "Mira: esta gavilla gira hasta que se inclina.",
    "sheavesBowHelped": "Ahora se inclina. ({n} de {total})",
    "sheavesBowRoundDone": "Todas las gavillas alrededor se inclinan ante la gavilla de José.",
    "sheavesBowDone": "He aquí que atábamos manojos en medio del campo, y he aquí que mi manojo se levantaba, y estaba derecho, y que vuestros manojos estaban alrededor, y se inclinaban al mío. (Génesis 37:7)",
    "winePressField": "El sueño del copero: la vid con tres sarmientos, y debajo la copa de Faraón.",
    "winePressGrapes": "Las uvas. Mantén pulsado: exprimirlas",
    "winePressCup": "La copa de Faraón",
    "winePressHold": "Exprimir (mantén pulsado)",
    "winePressCount": "Copa {cup} de {cups}: {n} % llena",
    "winePressMore": "Todavía no está llena ({n} %). Exprime otra vez.",
    "winePressFull": "¡La copa está llena y no se derramó nada!",
    "winePressOver": "¡Oh, se derramó! El copero toma una copa limpia.",
    "winePressNextCup": "¡Otra copa!",
    "winePressHelp": "Ayúdame",
    "winePressHelping": "Mira: suelta en cuanto la copa está llena.",
    "winePressHelped": "¡Así! La copa está llena.",
    "winePressRoundDone": "El copero da la copa en mano de Faraón.",
    "winePressDone": "Y que la copa de Faraón estaba en mi mano, y tomaba yo las uvas, y las exprimía en la copa de Faraón, y daba yo la copa en mano de Faraón. (Génesis 40:11)",
    "nileCowsField": "El prado junto al Nilo. A la derecha las vacas suben del agua.",
    "nileCowsFatName": "Una vaca gorda y hermosa",
    "nileCowsLeanName": "Una vaca flaca",
    "nileCowsMeadow": "El pasto con las vacas gordas",
    "nileCowsCount": "Vacas gordas en el pasto: {n} de {total}",
    "nileCowsFat": "¡Una vaca gorda! Va al pasto. ({n} de 7)",
    "nileCowsLean": "Esta vaca es flaca. Déjala pasar.",
    "nileCowsMissed": "Una vaca gorda pasó de largo. Vuelve otra vez.",
    "nileCowsChosen": "Esta vaca está elegida. Enter: tocarla.",
    "nileCowsKeys": "Izquierda y derecha: elige una vaca. Enter: tocarla.",
    "nileCowsHelp": "Ayúdame",
    "nileCowsHelping": "Mira: se muestra la próxima vaca gorda.",
    "nileCowsHelped": "Esa era una vaca gorda. ({n} de 7)",
    "nileCowsRoundDone": "Siete vacas gordas están en el pasto.",
    "nileCowsDone": "Y que del río subían siete vacas, hermosas á la vista, y muy gordas, y pacían en el prado. (Génesis 41:2)",
    "embrace2Field": "La sala de José en Egipto. Los hermanos están asustados; José va hacia ellos.",
    "embrace2Josef": "José",
    "embrace2IsScared": "asustado",
    "embrace2IsGlad": "contento",
    "embrace2Count": "Abrazados: {n} de {total}",
    "embrace2Benjamin": "¡Primero a Benjamín, el más joven!",
    "embrace2BenjaminGlad": "José se echa sobre el cuello de Benjamín, y los dos lloran.",
    "embrace2Glad": "José abraza a {name}. Ahora {name} está contento.",
    "embrace2Already": "{name} ya está contento.",
    "embrace2Keys": "Izquierda y derecha: elige un hermano. Enter: José va hacia él.",
    "embrace2Help": "Ayúdame",
    "embrace2Helping": "Mira: José va hacia {name}.",
    "embrace2RoundDone": "José los ha abrazado a todos. Ahora los hermanos hablan con él.",
    "embrace2Done": "Y echóse sobre el cuello de Benjamín su hermano, y lloró; y también Benjamín lloró sobre su cuello. Y besó á todos sus hermanos, y lloró sobre ellos: y después sus hermanos hablaron con él. (Génesis 45:14–15)",
    "meetingField": "El camino en la tierra de Gosén. A la izquierda va José, a la derecha viene Jacob. Toca a la izquierda para guiar a José, a la derecha para guiar a Jacob.",
    "meetingJosef": "El carro de José, carril {n}",
    "meetingJakob": "El carro de Jacob, carril {n}",
    "meetingThing": "Algo hay en el camino",
    "meetingCount": "Superados: {n} de {total}",
    "meetingBumpJosef": "¡Alto! El carro de José está parado ante un obstáculo. Llévalo a otro carril.",
    "meetingBumpJakob": "¡Alto! El carro de Jacob está parado ante un obstáculo. Llévalo a otro carril.",
    "meetingJosefThere": "José está junto al pozo.",
    "meetingJakobThere": "Jacob está junto al pozo.",
    "meetingMet": "¡Ya llegaron! José se echa sobre el cuello de su padre y llora largo rato.",
    "meetingChosenJosef": "El carro de José está elegido.",
    "meetingChosenJakob": "El carro de Jacob está elegido.",
    "meetingKeys": "Arriba y abajo: cambiar de carril. Izquierda y derecha: elegir a José o a Jacob.",
    "meetingHelp": "Ayúdame",
    "meetingHelping": "Mira: los dos carros pasan junto a todo.",
    "meetingDone": "Y José unció su carro y vino á recibir á Israel su padre á Gosén; y se manifestó á él, y echóse sobre su cuello, y lloró sobre su cuello bastante. (Génesis 46:29)"
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
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every element is 100 x 100 pixels at the corner: a pointer at (x, y) is at x %, y % of the field
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => box(0, 0, 100, 100) as DOMRect)
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
const status = (w: VueWrapper) => w.find('[role="status"]').text()
/** A pointer event (jsdom has no PointerEvent: a MouseEvent with the pointer's name does the same here). */
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const button = (w: VueWrapper, text: string) => w.findAll('button').find((b) => b.text() === text)

// ---------------------------------------------------------------- every word the games use is there, in three languages
describe('the words', () => {
  it('every key of app.adventure that the five games use is there in German, English and Spanish, and each starts with its field', () => {
    const all = allMessages()
    const fields: Record<string, string> = { GameGarben: 'sheavesBow', GameKeltern: 'winePress', GameKuehenil: 'nileCows', GameUmarmen: 'embrace2', GameBegegnung: 'meeting' }
    for (const [file, field] of Object.entries(fields)) {
      const code = readFileSync(`src/components/molecules/games/${file}.vue`, 'utf-8')
      const keys = [...new Set([...code.matchAll(/app\.adventure\.(\w+)/g)].map((m) => m[1]!))]
      expect(keys.length, file).toBeGreaterThan(8)
      for (const k of keys) if (k !== 'gameRound' && k !== 'gameNext') expect(k.startsWith(field), `${file} ${k}`).toBe(true)
      for (const loc of ['de', 'en', 'es'] as const) {
        const adv = ((all[loc]!.app as Record<string, unknown>).adventure ?? {}) as Record<string, unknown>
        for (const k of keys) expect(typeof adv[k], `${file} ${loc} ${k}`).toBe('string')
      }
    }
    expect(Object.keys(NEW_KEYS.en).sort()).toEqual(Object.keys(NEW_KEYS.de).sort())
    expect(Object.keys(NEW_KEYS.es).sort()).toEqual(Object.keys(NEW_KEYS.de).sort())
    // since the wiring of 5.11.2026 the shared words hold exactly these texts (nothing else was overwritten)
    const de = ((messages as unknown as Tree).de!.app as Record<string, Record<string, unknown>>).adventure!
    for (const [k, v] of Object.entries(NEW_KEYS.de)) expect(de[k], k).toBe(v)
  })
})

// ---------------------------------------------------------------- 1. the sheaves bow
const SHEAVES: SheavesGame = {
  field: 'feld.webp',
  josef: 'josef.webp',
  josefW: 26,
  sheafW: 15,
  rounds: [
    {
      hint: 'Runde eins',
      center: { x: 50, y: 50 },
      step: 45,
      sheaves: [
        { x: 50, y: 88, start: 270, image: 'g1.webp' },
        { x: 12, y: 50, start: 0, image: 'g2.webp' }
      ]
    },
    { hint: 'Runde zwei', center: { x: 50, y: 50 }, step: 30, sheaves: [{ x: 88, y: 50, start: 180, image: 'g1.webp' }] }
  ]
}

describe('GameGarben', () => {
  it('a tap turns a sheaf; when it points to the middle it bows; a bowing sheaf tapped again is a mistake; keys; the help in round 2; the end gives Genesis 37,7', async () => {
    const w = mount(GameGarben, { props: { game: SHEAVES }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.text()).toContain('Runde eins')
    expect(w.findAll('button.gg-sheaf')).toHaveLength(2)
    expect(w.find('[data-sheaf="0"] .gg-turn').attributes('style')).toContain('rotate(270deg)')
    await w.find('[data-sheaf="0"]').trigger('click')
    expect(w.find('[data-sheaf="0"] .gg-turn').attributes('style')).toContain('rotate(315deg)')
    expect(w.find('[data-sheaf="0"]').classes()).not.toContain('bows')
    await w.find('[data-sheaf="0"]').trigger('click')
    expect(w.find('[data-sheaf="0"]').classes()).toContain('bows')
    expect(status(w)).toContain('Diese Garbe verneigt sich! (1 von 2)')
    expect(w.find('.gg-mark').exists()).toBe(true)
    // tapped again: it stays and that is a mistake
    await w.find('[data-sheaf="0"]').trigger('click')
    expect(status(w)).toContain('Die verneigt sich schon')
    expect(played).toContain('wrong')
    expect(w.find('[data-sheaf="0"] .gg-turn').attributes('style')).toContain('rotate(360deg)')
    // the keys: Enter first chooses, then turns
    const field = w.find('.gg-field')
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(status(w)).toBe('Garbe 2')
    await field.trigger('keydown', { key: 'Enter' })
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Verneigt: 2 von 2')
    await tick(800)
    expect(status(w)).toContain('Alle Garben ringsum neigen sich')
    await tick(4200)
    expect(w.text()).toContain('Runde zwei')
    expect(w.find('[data-sheaf="0"] .gg-turn').attributes('style')).toContain('rotate(180deg)')
    // the help turns the sheaf until it bows
    await tick(16000)
    await button(w, 'Hilf mir')!.trigger('click')
    expect(w.find('.gg-sheaf.help').exists()).toBe(true)
    await tick(1600)
    expect(w.find('[data-sheaf="0"]').classes()).toContain('bows')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(5000)
    expect(w.text()).toContain('und eure Garben umher neigten sich vor meiner Garbe. (1. Mose 37,7)')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('English and Spanish words', async () => {
    const en = mount(GameGarben, { props: { game: SHEAVES }, ...opts('en') })
    await flushPromises()
    expect(en.text()).toContain('Bowing: 0 of 2')
    en.unmount()
    const es = mount(GameGarben, { props: { game: SHEAVES }, ...opts('es') })
    await flushPromises()
    expect(es.text()).toContain('Inclinadas: 0 de 2')
    es.unmount()
  })
})

// ---------------------------------------------------------------- 2. the wine press
const PRESS: WinePressGame = {
  background: 'traum.webp',
  ratio: 0.75,
  cups: ['b0.webp', 'b1.webp', 'b2.webp', 'b3.webp', 'b4.webp'],
  cupRatio: 1,
  cup: { x: 50, y: 80, w: 40 },
  grapes: { x: 50, y: 30, w: 30, image: 'trauben.webp', ratio: 1 },
  drop: 'tropfen.webp',
  puddle: 'lache.webp',
  rounds: [
    { hint: 'Runde eins', flow: 0.5, push: 0, full: 0.8, cups: 1 },
    { hint: 'Runde zwei', flow: 0.5, push: 0, full: 0.8, cups: 2 }
  ]
}

describe('GameKeltern', () => {
  it('pressing fills the cup; letting go early asks for more; full at the brim; running over is a mistake; Space presses; the help fills; the end gives Genesis 40,11', async () => {
    const w = mount(GameKeltern, { props: { game: PRESS }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(3)
    const grapes = w.find('.gw-grapes')
    await grapes.trigger('pointerdown')
    await tick(1000)
    expect(w.find('.gw-cup').attributes('data-stage')).toBe('2')
    expect(w.find('.gw-drop').exists()).toBe(true)
    await grapes.trigger('pointerup')
    expect(status(w)).toContain('Noch nicht voll (50 %)')
    await grapes.trigger('pointerdown')
    await tick(700)
    expect(w.find('.gw-cup').attributes('data-stage')).toBe('3')
    await grapes.trigger('pointerup')
    expect(status(w)).toContain('Der Becher ist voll')
    expect(w.find('.gw-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(4500)
    expect(w.text()).toContain('Runde zwei')
    expect(w.text()).toContain('Becher 1 von 2: 0 % voll')
    // held too long: it runs over
    const field = w.find('.gw-field')
    await field.trigger('keydown', { key: ' ' })
    await tick(2200)
    expect(status(w)).toContain('übergelaufen')
    expect(played).toContain('wrong')
    expect(w.find('.gw-puddle').exists()).toBe(true)
    await field.trigger('keyup', { key: ' ' })
    await tick(2300)
    expect(w.find('.gw-cup').attributes('data-stage')).toBe('0')
    // the help fills the first cup of round 2; then the press button fills the second
    await tick(16000)
    await button(w, 'Hilf mir')!.trigger('click')
    expect(status(w)).toContain('Schau zu')
    await tick(2000)
    expect(status(w)).toContain('So! Der Becher ist voll.')
    await tick(2500)
    expect(w.text()).toContain('Becher 2 von 2')
    const press = w.find('.gw-press')
    await press.trigger('pointerdown')
    await tick(1800)
    await press.trigger('pointerup')
    expect(status(w)).toContain('Der Becher ist voll')
    await tick(5000)
    expect(w.text()).toContain('und gab den Becher Pharao in die Hand. (1. Mose 40,11)')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(useTaskProgress().parts.value).toBe(3)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('English and Spanish words', async () => {
    const en = mount(GameKeltern, { props: { game: PRESS }, ...opts('en') })
    await flushPromises()
    expect(en.text()).toContain('Cup 1 of 1: 0 % full')
    en.unmount()
    const es = mount(GameKeltern, { props: { game: PRESS }, ...opts('es') })
    await flushPromises()
    expect(es.text()).toContain('Exprimir (mantén pulsado)')
    es.unmount()
  })
})

// ---------------------------------------------------------------- 3. cows by the Nile
const fat = (at: number) => ({ kind: 'fat' as const, image: 'dick.webp', lane: 0, at })
const COWS: NileCowsGame = {
  background: 'wiese.webp',
  ratio: 4 / 3,
  shore: { x: 80, y: 40 },
  shoreScale: 0.6,
  lanes: [{ x: -10, y: 90, scale: 1 }],
  cowW: 20,
  cowRatio: 1.4,
  rise: 0.5,
  rounds: [
    { hint: 'Runde eins', speed: 5, cows: [fat(0), { kind: 'lean', image: 'duenn.webp', lane: 0, at: 0 }, fat(0.2), fat(0.4), fat(0.6), fat(0.8), fat(1), fat(1.2)] },
    { hint: 'Runde zwei', speed: 20, cows: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map(fat) }
  ]
}

describe('GameKuehenil', () => {
  it('fat cows go to the pasture, a lean one is a mistake, a fat one that walks by comes again; the help; round 2; the end gives Genesis 41,2', async () => {
    const w = mount(GameKuehenil, { props: { game: COWS }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(14)
    await tick(120)
    expect(w.findAll('button.gn-cow')).toHaveLength(2)
    await w.find('[data-cow="1"]').trigger('pointerdown')
    expect(status(w)).toContain('Diese Kuh ist mager')
    expect(played).toContain('wrong')
    await w.find('[data-cow="0"]').trigger('pointerdown')
    expect(status(w)).toContain('Eine dicke Kuh! Sie geht auf die Weide. (1 von 7)')
    expect(w.findAll('.gn-slot.full')).toHaveLength(1)
    // cows 3 to 7 tapped as soon as they are there; cow 2 walks by
    for (const i of [3, 4, 5, 6, 7]) {
      await tick(250)
      while (!w.find(`[data-cow="${i}"]`).exists()) await tick(100)
      await w.find(`[data-cow="${i}"]`).trigger('pointerdown')
    }
    expect(w.text()).toContain('Dicke Kühe auf der Weide: 6 von 7')
    // cow 2 walks by (about 20 seconds later); the help is offered after 15 seconds without a tap
    await tick(20000)
    expect(status(w)).toContain('Eine dicke Kuh ist vorbeigezogen')
    expect(played.filter((p) => p === 'wrong')).toHaveLength(2)
    // it comes again: the help waits for it, shows it and taps it
    await button(w, 'Hilf mir')!.trigger('click')
    await tick(2000)
    expect(w.text()).toContain('Dicke Kühe auf der Weide: 7 von 7')
    await tick(4000)
    expect(w.text()).toContain('Runde zwei')
    for (let i = 0; i < 7; i++) {
      while (!w.find(`[data-cow="${i}"]`).exists()) await tick(50)
      await w.find(`[data-cow="${i}"]`).trigger('pointerdown')
    }
    await tick(1000)
    expect(status(w)).toContain('Sieben dicke Kühe sind auf der Weide')
    await tick(4000)
    expect(w.text()).toContain('sieben schöne, fette Kühe; die gingen auf der Weide im Grase. (1. Mose 41,2)')
    await button(w, 'Weiter')!.trigger('click')
    // two mistakes: three stars
    expect(w.emitted('done')![0]).toEqual([3])
    expect(useTaskProgress().parts.value).toBe(14)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('the keys choose a cow and tap it; English and Spanish words', async () => {
    const w = mount(GameKuehenil, { props: { game: COWS }, ...opts('en') })
    await flushPromises()
    await tick(300)
    const field = w.find('.gn-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Left and right: choose a cow')
    await field.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toMatch(/Fat cows in the pasture: [01] of 7/)
    w.unmount()
    const es = mount(GameKuehenil, { props: { game: COWS }, ...opts('es') })
    await flushPromises()
    expect(es.text()).toContain('Vacas gordas en el pasto: 0 de 7')
    es.unmount()
  })
})

// ---------------------------------------------------------------- 4. embrace
const bro = (id: string, name: string, x: number, benjamin = false) => ({ id, name, x, y: 95, h: 50, scared: `${id}-s.webp`, glad: `${id}-g.webp`, benjamin })
const HUG: EmbraceGame = {
  background: 'saal.webp',
  ratio: 1.5,
  josef: 'josef.webp',
  josefH: 52,
  figureRatio: 2 / 3,
  speed: 40,
  rounds: [
    { hint: 'Runde eins', start: { x: 50, y: 70 }, showBenjamin: true, brothers: [bro('ruben', 'Ruben', 15), bro('benjamin', 'Benjamin', 85, true), bro('juda', 'Juda', 50)] },
    { hint: 'Runde zwei', start: { x: 5, y: 80 }, showBenjamin: false, brothers: [bro('levi', 'Levi', 20), bro('dan', 'Dan', 50), bro('benjamin', 'Benjamin', 80, true)] }
  ]
}

describe('GameUmarmen', () => {
  it('another brother before Benjamin is a mistake; Joseph walks and embraces; the faces become glad; keys and help in round 2; the end gives Genesis 45,14-15', async () => {
    const w = mount(GameUmarmen, { props: { game: HUG }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.find('[data-brother="benjamin"]').classes()).toContain('ring')
    expect(w.find('[data-brother="ruben"] img').attributes('src')).toContain('ruben-s.webp')
    await w.find('[data-brother="ruben"]').trigger('click')
    expect(status(w)).toContain('Zuerst zu Benjamin, dem Jüngsten!')
    expect(played).toContain('wrong')
    await w.find('[data-brother="benjamin"]').trigger('click')
    await tick(2000)
    expect(status(w)).toContain('Josef fällt Benjamin um den Hals')
    expect(w.find('[data-brother="benjamin"] img').attributes('src')).toContain('benjamin-g.webp')
    expect(w.find('[data-brother="benjamin"]').classes()).toContain('glad')
    await w.find('[data-brother="benjamin"]').trigger('click')
    expect(status(w)).toContain('Benjamin ist schon froh.')
    for (const id of ['juda', 'ruben']) {
      await w.find(`[data-brother="${id}"]`).trigger('click')
      await tick(2500)
    }
    expect(w.text()).toContain('Umarmt: 3 von 3')
    await tick(1300)
    expect(status(w)).toContain('Jetzt reden die Brüder mit ihm')
    await tick(4000)
    expect(w.text()).toContain('Runde zwei')
    expect(w.find('.gu-bro.ring').exists()).toBe(false)
    // keys: Enter chooses the first from the left, then the arrows go on
    const field = w.find('.gu-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Levi')
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(status(w)).toBe('Benjamin')
    await field.trigger('keydown', { key: 'Enter' })
    await tick(3000)
    expect(w.find('[data-brother="benjamin"]').classes()).toContain('glad')
    for (let k = 0; k < 2; k++) {
      await tick(16000)
      const help = button(w, 'Hilf mir')
      expect(help, `help ${k}`).toBeTruthy()
      await help!.trigger('click')
      await tick(4000)
    }
    expect(w.findAll('.gu-bro.glad')).toHaveLength(3)
    await tick(5000)
    expect(w.text()).toContain('Und er küßte alle seine Brüder und weinte über ihnen. Darnach redeten seine Brüder mit ihm. (1. Mose 45,14–15)')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(useTaskProgress().parts.value).toBe(6)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('English and Spanish words', async () => {
    const en = mount(GameUmarmen, { props: { game: HUG }, ...opts('en') })
    await flushPromises()
    await en.find('[data-brother="juda"]').trigger('click')
    expect(status(en)).toContain('First go to Benjamin')
    en.unmount()
    const es = mount(GameUmarmen, { props: { game: HUG }, ...opts('es') })
    await flushPromises()
    expect(es.text()).toContain('Abrazados: 0 de 3')
    es.unmount()
  })
})

// ---------------------------------------------------------------- 5. meeting
const MEET: MeetingGame = {
  background: 'land.webp',
  ratio: 1.5,
  lanes: [40, 65, 90],
  josef: { image: 'josef.webp', w: 20, ratio: 1.5 },
  jakob: { image: 'jakob.webp', w: 20, ratio: 1.5 },
  from: 0,
  meet: 50,
  gap: 2,
  bump: 1,
  rounds: [
    {
      hint: 'Runde eins',
      speed: 10,
      startLane: { josef: 1, jakob: 1 },
      obstacles: [
        { side: 'josef', lane: 1, x: 25, image: 'fels.webp', w: 10 },
        { side: 'jakob', lane: 1, x: 75, image: 'schaf.webp', w: 10 }
      ]
    },
    {
      hint: 'Runde zwei',
      speed: 10,
      startLane: { josef: 1, jakob: 1 },
      obstacles: [
        { side: 'josef', lane: 1, x: 25, image: 'fels.webp', w: 10 },
        { side: 'jakob', lane: 1, x: 75, image: 'schaf.webp', w: 10 },
        { side: 'jakob', lane: 0, x: 65, image: 'busch.webp', w: 10 }
      ]
    }
  ]
}

describe('GameBegegnung', () => {
  it('a finger in the left half steers Joseph, Jacob runs into the sheep (a mistake), they meet; keys in round 2; the end gives Genesis 46,29', async () => {
    const w = mount(GameBegegnung, { props: { game: MEET }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('.gb-thing')).toHaveLength(2)
    const field = w.find('.gb-field')
    pointer(field.element, 'pointerdown', 20, 38)
    await flushPromises()
    pointer(field.element, 'pointerup', 20, 38)
    expect(w.find('[data-team="josef"]').attributes('data-lane')).toBe('0')
    expect(w.find('[data-team="jakob"]').attributes('data-lane')).toBe('1')
    await tick(1500)
    expect(status(w)).toContain('Jakobs Wagen steht vor einem Hindernis')
    expect(played).toContain('wrong')
    await tick(3500)
    expect(status(w)).toContain('Sie sind da!')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(4500)
    expect(w.text()).toContain('Runde zwei')
    // keys: Joseph down, Jacob down (the bush is in lane 1 ... lane 0, the sheep in lane 1)
    await field.trigger('keydown', { key: 'ArrowDown' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(status(w)).toContain('Jakobs Wagen ist gewählt')
    await field.trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[data-team="josef"]').attributes('data-lane')).toBe('2')
    expect(w.find('[data-team="jakob"]').attributes('data-lane')).toBe('2')
    await tick(5000)
    expect(status(w)).toContain('Sie sind da!')
    expect(played.filter((p) => p === 'wrong')).toHaveLength(1)
    await tick(4500)
    expect(w.text()).toContain('fiel er ihm um den Hals und weinte lange an seinem Halse. (1. Mose 46,29)')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(useTaskProgress().parts.value).toBe(5)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('two fingers at once, the help steers past everything; English and Spanish words', async () => {
    const w = mount(GameBegegnung, { props: { game: MEET }, ...opts('en') })
    await flushPromises()
    const field = w.find('.gb-field')
    // two pointers: one left, one right (each with its own id)
    field.element.dispatchEvent(Object.assign(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10, clientY: 90 }), { pointerId: 1 }))
    field.element.dispatchEvent(Object.assign(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 90, clientY: 40 }), { pointerId: 2 }))
    await flushPromises()
    expect(w.find('[data-team="josef"]').attributes('data-lane')).toBe('2')
    expect(w.find('[data-team="jakob"]').attributes('data-lane')).toBe('0')
    w.unmount()
    // two bumps in a row (nobody steers): the help is offered at once and steers past everything
    const h = mount(GameBegegnung, { props: { game: { ...MEET, rounds: [MEET.rounds[1]!, MEET.rounds[1]!] } }, ...opts('es') })
    await flushPromises()
    expect(h.text()).toContain('Superados: 0 de 3')
    await tick(1700)
    expect(played.filter((p) => p === 'wrong')).toHaveLength(2)
    await button(h, 'Ayúdame')!.trigger('click')
    expect(status(h)).toContain('Mira: los dos carros')
    await tick(5000)
    expect(status(h)).toContain('¡Ya llegaron!')
    expect(played.filter((p) => p === 'wrong')).toHaveLength(2)
    h.unmount()
  })
})
