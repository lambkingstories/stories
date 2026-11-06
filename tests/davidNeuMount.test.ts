/**
 * The three new games of "David" (5.11.2026: `eselladen` = GameEselLaden, `hebrontor` = GameHebrontor, `festzug` = GameFestzug), each mounted with sample data and played through:
 * loading the donkey (tap, drag, keys, a gift that slides back, a crooked load, taking out, help), opening the gate of Hebron (too early, right, too late, keys, help with "Now!"),
 * the procession (the one who lights up, a wrong one, a missed glow, the tunes after them, a wrong note, keys, help); the rounds, the goal of "Go on" (`useTaskProgress`),
 * the end with the stars and the words of the Bible, and the words in German, English and Spanish.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/david/INTEGRATION.json, made by `_texte.py`).
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameEselLaden from '@/components/molecules/games/GameEselLaden.vue'
import GameHebrontor from '@/components/molecules/games/GameHebrontor.vue'
import GameFestzug from '@/components/molecules/games/GameFestzug.vue'
import type { DonkeyLoadGame, FestMarchGame, HebronGateGame } from '@/utils/davidNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  de: {
    donkeyLoadField: "Der Hof von Abigajil. In der Mitte steht der Esel, auf seinem Rücken der Packsattel mit zwei Körben.",
    donkeyLoadTray: "Die Gaben von Abigajil",
    donkeyLoadGood: "{name}, {weight}",
    donkeyLoadLight: "leicht",
    donkeyLoadMiddle: "mittel",
    donkeyLoadHeavy: "schwer",
    donkeyLoadLeft: "Linker Korb",
    donkeyLoadRight: "Rechter Korb",
    donkeyLoadToLeft: "in den linken Korb",
    donkeyLoadToRight: "in den rechten Korb",
    donkeyLoadBasket: "{side}: {n} von {places} Plätzen belegt",
    donkeyLoadTakeOut: "{name}: wieder herausnehmen",
    donkeyLoadPicked: "{name}: In welchen Korb?",
    donkeyLoadPickFirst: "Nimm zuerst eine Gabe aus der Leiste.",
    donkeyLoadChoose: "{name} ist in der Hand. Pfeil links: linker Korb. Pfeil rechts: rechter Korb.",
    donkeyLoadKeys: "Links und rechts: eine Gabe wählen. Enter: nehmen. Dann links oder rechts: in welchen Korb.",
    donkeyLoadIn: "Gut! {name} {side}.",
    donkeyLoadHelpedIn: "So: {name} {side}.",
    donkeyLoadOut: "{name} liegt wieder in der Leiste.",
    donkeyLoadBack: "Zieh die Gabe in einen Korb.",
    donkeyLoadFull: "Dieser Korb ist voll.",
    donkeyLoadLean: "Zu schief! Die Gabe rutscht wieder herunter. Leg erst etwas Leichteres hinein.",
    donkeyLoadUneven: "Alles ist aufgeladen, aber die Last hängt schief. Nimm etwas heraus und tausche.",
    donkeyLoadStraight: "Die Last hängt gerade.",
    donkeyLoadLeansLeft: "Die Last hängt nach links.",
    donkeyLoadLeansRight: "Die Last hängt nach rechts.",
    donkeyLoadCount: "Aufgeladen: {n} von {total}",
    donkeyLoadRoundDone: "Geschafft! Die Last hängt gerade. Der Esel kann losgehen.",
    donkeyLoadHelp: "Hilf mir",
    donkeyLoadHelped: "Tipp: {name} {side}.",
    donkeyLoadHelpOut: "Tipp: Nimm {name} wieder heraus.",
    donkeyLoadDone: "Da eilte Abigail und nahm zweihundert Brote und zwei Krüge Wein und fünf gekochte Schafe und fünf Scheffel Mehl und hundert Rosinenkuchen und zweihundert Feigenkuchen und lud's auf Esel.",
    gateTimeField: "Die Stadtmauer von Hebron. Rechts ist das Tor, auf der Straße kommen die Stämme Israels.",
    gateTimeComes: "{name} kommt.",
    gateTimeZone: "Hier ist der richtige Moment",
    gateTimeOpen: "Das Tor ist offen",
    gateTimeClosed: "Das Tor: öffnen",
    gateTimeButton: "Tor öffnen",
    gateTimeEarly: "Noch zu früh! Sie sind noch weit weg.",
    gateTimeLate: "{name} wartet vor dem Tor. Mach schnell auf!",
    gateTimeRight: "Genau richtig! {name} zieht durch das Tor.",
    gateTimeInLate: "Jetzt ist es offen. {name} zieht hinein.",
    gateTimeNow: "Jetzt!",
    gateTimeCount: "In Hebron: {n} von {total}",
    gateTimeRoundDone: "Alle sind in Hebron. Sie kommen zu David.",
    gateTimeHelp: "Hilf mir",
    gateTimeHelped: "Schau auf die Straße. Wenn ich „Jetzt!“ sage, mach das Tor auf.",
    gateTimeDone: "Und es kamen alle Stämme Israels zu David gen Hebron und sprachen: Siehe, wir sind deines Gebeins und deines Fleisches.",
    festMarchField: "Der Weg hinauf zur Stadt Davids. Hinten tragen die Priester die Lade, vorn gehen die Musiker.",
    festMarchLit: "{name}, leuchtet jetzt",
    festMarchNow: "♪ Jetzt: {name}",
    festMarchRight: "Schön! {name} spielt.",
    festMarchWrong: "{name} leuchtet gerade nicht. Schau, wer jetzt leuchtet.",
    festMarchMissed: "Verpasst. Gleich kommt es noch einmal.",
    festMarchListen: "Hör zu: {n} Töne.",
    festMarchYourTurn: "Jetzt du! Spiel es nach.",
    festMarchWait: "Hör erst zu.",
    festMarchAgain: "Das war ein anderer Ton. Hör noch einmal zu.",
    festMarchTuneDone: "Richtig nachgespielt!",
    festMarchRoundDone: "Wunderbar! Der Festzug zieht weiter zur Stadt Davids.",
    festMarchCount: "Gespielt: {n} von {total}",
    festMarchTunes: "Lied {n} von {total}",
    festMarchKeys: "Links und rechts: einen Musiker wählen. Enter: antippen.",
    festMarchHelp: "Hilf mir",
    festMarchHelped: "Tipp: {name}.",
    festMarchHelpListen: "Hör gut zu. Danach zeige ich dir, wer dran ist.",
    festMarchDone: "spielte David und das ganze Haus Israel vor dem HERRN her mit allerlei Saitenspiel von Tannenholz, mit Harfen und Psaltern und Pauken und Schellen und Zimbeln."
  },
  en: {
    donkeyLoadField: "Abigail's yard. The donkey stands in the middle, with the pack saddle and two baskets on its back.",
    donkeyLoadTray: "Abigail's gifts",
    donkeyLoadGood: "{name}, {weight}",
    donkeyLoadLight: "light",
    donkeyLoadMiddle: "middle",
    donkeyLoadHeavy: "heavy",
    donkeyLoadLeft: "Left basket",
    donkeyLoadRight: "Right basket",
    donkeyLoadToLeft: "into the left basket",
    donkeyLoadToRight: "into the right basket",
    donkeyLoadBasket: "{side}: {n} of {places} places taken",
    donkeyLoadTakeOut: "{name}: take it out again",
    donkeyLoadPicked: "{name}: which basket?",
    donkeyLoadPickFirst: "First take a gift from the strip.",
    donkeyLoadChoose: "{name} is in your hand. Left arrow: left basket. Right arrow: right basket.",
    donkeyLoadKeys: "Left and right: choose a gift. Enter: take it. Then left or right: which basket.",
    donkeyLoadIn: "Good! {name} {side}.",
    donkeyLoadHelpedIn: "Like this: {name} {side}.",
    donkeyLoadOut: "{name} is back in the strip.",
    donkeyLoadBack: "Drag the gift into a basket.",
    donkeyLoadFull: "This basket is full.",
    donkeyLoadLean: "Too crooked! The gift slides off again. Put in something lighter first.",
    donkeyLoadUneven: "Everything is loaded, but the load hangs crooked. Take something out and swap.",
    donkeyLoadStraight: "The load hangs straight.",
    donkeyLoadLeansLeft: "The load hangs to the left.",
    donkeyLoadLeansRight: "The load hangs to the right.",
    donkeyLoadCount: "Loaded: {n} of {total}",
    donkeyLoadRoundDone: "Well done! The load hangs straight. The donkey can go.",
    donkeyLoadHelp: "Help me",
    donkeyLoadHelped: "Tip: {name} {side}.",
    donkeyLoadHelpOut: "Tip: take {name} out again.",
    donkeyLoadDone: "Then Abigail made haste, and took two hundred loaves, and two bottles of wine, and five sheep ready dressed, and five measures of parched corn, and an hundred clusters of raisins, and two hundred cakes of figs, and laid them on asses.",
    gateTimeField: "The city wall of Hebron. The gate is on the right; the tribes of Israel come along the road.",
    gateTimeComes: "{name} is coming.",
    gateTimeZone: "This is the right moment",
    gateTimeOpen: "The gate is open",
    gateTimeClosed: "The gate: open it",
    gateTimeButton: "Open the gate",
    gateTimeEarly: "Too early! They are still far away.",
    gateTimeLate: "{name} is waiting at the gate. Open it quickly!",
    gateTimeRight: "Just right! {name} goes through the gate.",
    gateTimeInLate: "Now it is open. {name} goes in.",
    gateTimeNow: "Now!",
    gateTimeCount: "In Hebron: {n} of {total}",
    gateTimeRoundDone: "They are all in Hebron. They have come to David.",
    gateTimeHelp: "Help me",
    gateTimeHelped: "Watch the road. When I say “Now!”, open the gate.",
    gateTimeDone: "Then came all the tribes of Israel to David unto Hebron, and spake, saying, Behold, we are thy bone and thy flesh.",
    festMarchField: "The road up to the City of David. The priests carry the ark far behind; the musicians walk in front.",
    festMarchLit: "{name}, lit up now",
    festMarchNow: "♪ Now: {name}",
    festMarchRight: "Lovely! {name} plays.",
    festMarchWrong: "{name} is not lit up now. Look who is lit up.",
    festMarchMissed: "Missed. It will come again soon.",
    festMarchListen: "Listen: {n} notes.",
    festMarchYourTurn: "Your turn! Play it after them.",
    festMarchWait: "Listen first.",
    festMarchAgain: "That was another note. Listen once more.",
    festMarchTuneDone: "Played just right!",
    festMarchRoundDone: "Wonderful! The procession goes on to the City of David.",
    festMarchCount: "Played: {n} of {total}",
    festMarchTunes: "Tune {n} of {total}",
    festMarchKeys: "Left and right: choose a musician. Enter: tap.",
    festMarchHelp: "Help me",
    festMarchHelped: "Tip: {name}.",
    festMarchHelpListen: "Listen carefully. Then I will show you whose turn it is.",
    festMarchDone: "And David and all the house of Israel played before the LORD on all manner of instruments made of fir wood, even on harps, and on psalteries, and on timbrels, and on cornets, and on cymbals."
  },
  es: {
    donkeyLoadField: "El patio de Abigail. En el medio está el asno, con la albarda y dos cestas sobre el lomo.",
    donkeyLoadTray: "Los regalos de Abigail",
    donkeyLoadGood: "{name}, {weight}",
    donkeyLoadLight: "ligero",
    donkeyLoadMiddle: "mediano",
    donkeyLoadHeavy: "pesado",
    donkeyLoadLeft: "Cesta izquierda",
    donkeyLoadRight: "Cesta derecha",
    donkeyLoadToLeft: "en la cesta izquierda",
    donkeyLoadToRight: "en la cesta derecha",
    donkeyLoadBasket: "{side}: {n} de {places} lugares ocupados",
    donkeyLoadTakeOut: "{name}: sacarlo otra vez",
    donkeyLoadPicked: "{name}: ¿en qué cesta?",
    donkeyLoadPickFirst: "Primero toma un regalo de la barra.",
    donkeyLoadChoose: "{name} está en tu mano. Flecha izquierda: cesta izquierda. Flecha derecha: cesta derecha.",
    donkeyLoadKeys: "Izquierda y derecha: elige un regalo. Enter: tomarlo. Luego izquierda o derecha: en qué cesta.",
    donkeyLoadIn: "¡Bien! {name} {side}.",
    donkeyLoadHelpedIn: "Así: {name} {side}.",
    donkeyLoadOut: "{name} vuelve a la barra.",
    donkeyLoadBack: "Arrastra el regalo a una cesta.",
    donkeyLoadFull: "Esta cesta está llena.",
    donkeyLoadLean: "¡Demasiado torcido! El regalo se resbala. Pon primero algo más ligero.",
    donkeyLoadUneven: "Todo está cargado, pero la carga cuelga torcida. Saca algo y cambia.",
    donkeyLoadStraight: "La carga cuelga derecha.",
    donkeyLoadLeansLeft: "La carga cuelga hacia la izquierda.",
    donkeyLoadLeansRight: "La carga cuelga hacia la derecha.",
    donkeyLoadCount: "Cargado: {n} de {total}",
    donkeyLoadRoundDone: "¡Lo lograste! La carga cuelga derecha. El asno puede salir.",
    donkeyLoadHelp: "Ayúdame",
    donkeyLoadHelped: "Pista: {name} {side}.",
    donkeyLoadHelpOut: "Pista: saca {name} otra vez.",
    donkeyLoadDone: "Entonces Abigail tomó luego doscientos panes, y dos cueros de vino, y cinco ovejas guisadas, y cinco medidas de grano tostado, y cien hilos de uvas pasas, y doscientos panes de higos secos, y cargolo en asnos.",
    gateTimeField: "La muralla de Hebrón. A la derecha está la puerta; por el camino vienen las tribus de Israel.",
    gateTimeComes: "Viene {name}.",
    gateTimeZone: "Aquí está el momento justo",
    gateTimeOpen: "La puerta está abierta",
    gateTimeClosed: "La puerta: abrirla",
    gateTimeButton: "Abrir la puerta",
    gateTimeEarly: "¡Todavía es pronto! Están aún lejos.",
    gateTimeLate: "{name} espera ante la puerta. ¡Abre rápido!",
    gateTimeRight: "¡Justo a tiempo! {name} pasa por la puerta.",
    gateTimeInLate: "Ahora está abierta. {name} entra.",
    gateTimeNow: "¡Ahora!",
    gateTimeCount: "En Hebrón: {n} de {total}",
    gateTimeRoundDone: "Todos están en Hebrón. Han venido a David.",
    gateTimeHelp: "Ayúdame",
    gateTimeHelped: "Mira el camino. Cuando diga «¡Ahora!», abre la puerta.",
    gateTimeDone: "Y vinieron todas las tribus de Israel a David en Hebrón, y hablaron, diciendo: He aquí nosotros somos tus huesos y tu carne.",
    festMarchField: "El camino que sube a la ciudad de David. Detrás, los sacerdotes llevan el arca; delante van los músicos.",
    festMarchLit: "{name}, brilla ahora",
    festMarchNow: "♪ Ahora: {name}",
    festMarchRight: "¡Qué bien! {name} toca.",
    festMarchWrong: "{name} no brilla ahora. Mira quién brilla.",
    festMarchMissed: "Se te pasó. Enseguida vuelve.",
    festMarchListen: "Escucha: {n} notas.",
    festMarchYourTurn: "¡Te toca! Repítelo.",
    festMarchWait: "Primero escucha.",
    festMarchAgain: "Esa era otra nota. Escucha otra vez.",
    festMarchTuneDone: "¡Bien repetido!",
    festMarchRoundDone: "¡Maravilloso! La procesión sigue hacia la ciudad de David.",
    festMarchCount: "Tocado: {n} de {total}",
    festMarchTunes: "Canción {n} de {total}",
    festMarchKeys: "Izquierda y derecha: elige un músico. Enter: tocar.",
    festMarchHelp: "Ayúdame",
    festMarchHelped: "Pista: {name}.",
    festMarchHelpListen: "Escucha bien. Luego te muestro a quién le toca.",
    festMarchDone: "Y David y toda la casa de Israel danzaban delante de Jehová con toda suerte de instrumentos de madera de haya; con arpas, salterios, adufes, flautas y címbalos."
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
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const button = (w: VueWrapper, text: string) => w.findAll('button').find((b) => b.text() === text)

// ---------------------------------------------------------------- every word the games use is there, in three languages
describe('the words', () => {
  it('every key of app.adventure that the three games use is there in German, English and Spanish', () => {
    const all = allMessages()
    for (const file of ['GameEselLaden', 'GameHebrontor', 'GameFestzug']) {
      const code = readFileSync(`src/components/molecules/games/${file}.vue`, 'utf-8')
      const keys = [...new Set([...code.matchAll(/app\.adventure\.(\w+)/g)].map((m) => m[1]!))]
      expect(keys.length, file).toBeGreaterThan(5)
      for (const loc of ['de', 'en', 'es'] as const) {
        const adv = ((all[loc]!.app as Record<string, unknown>).adventure ?? {}) as Record<string, unknown>
        for (const k of keys) expect(typeof adv[k], `${file} ${loc} ${k}`).toBe('string')
      }
    }
    expect(Object.keys(NEW_KEYS.en).sort()).toEqual(Object.keys(NEW_KEYS.de).sort())
    expect(Object.keys(NEW_KEYS.es).sort()).toEqual(Object.keys(NEW_KEYS.de).sort())
    // the new keys begin with the field names
    for (const k of Object.keys(NEW_KEYS.de)) expect(k).toMatch(/^(donkeyLoad|gateTime|festMarch)/)
  })
})

// ---------------------------------------------------------------- 1. load the donkey
const DONKEY: DonkeyLoadGame = {
  background: 'hof.webp',
  ratio: 4 / 3,
  donkey: 'esel.webp',
  donkeyRatio: 0.8,
  donkeyPos: { x: 50, y: 95, w: 36 },
  saddle: 'sattel.webp',
  saddleRatio: 1.34,
  saddlePos: { x: 50, y: 40, w: 56 },
  baskets: [
    { x: 20, y: 64 },
    { x: 80, y: 64 }
  ],
  goods: {
    brot: { image: 'brot.webp', name: 'Brote', weight: 2 },
    krug: { image: 'krug.webp', name: 'Weinkrug', weight: 3 },
    rosinen: { image: 'rosinen.webp', name: 'Rosinenkuchen', weight: 1 },
    feigen: { image: 'feigen.webp', name: 'Feigenkuchen', weight: 2 }
  },
  goodW: 21,
  rounds: [
    { hint: 'Runde eins', goods: ['krug', 'brot', 'feigen', 'rosinen'], places: 3, maxLean: 99 },
    { hint: 'Runde zwei', goods: ['krug', 'brot', 'rosinen', 'feigen', 'krug', 'brot', 'rosinen', 'feigen'], places: 4, maxLean: 2 }
  ]
}

describe('GameEselLaden', () => {
  it('round 1 by tapping: the load leans and says so; a crooked end is a mistake, taking out and swapping makes it straight; round 2: a heavy gift first slides back, the help loads the rest; the end gives the stars and 1 Samuel 25,18', async () => {
    const w = mount(GameEselLaden, { props: { game: DONKEY }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.text()).toContain('Runde eins')
    expect(w.findAll('[data-good]')).toHaveLength(4)
    expect(w.find('[data-good="0"]').attributes('aria-label')).toBe('Weinkrug, schwer')
    expect(w.find('[data-good="3"]').text()).toContain('leicht')
    // a basket without a gift in the hand
    await w.find('[data-basket="0"]').trigger('click')
    expect(status(w)).toContain('Nimm zuerst eine Gabe')
    const put = async (good: number, side: 0 | 1) => {
      await w.find(`[data-good="${good}"]`).trigger('click')
      await w.find(`[data-basket="${side}"]`).trigger('click')
    }
    await w.find('[data-good="0"]').trigger('click')
    expect(status(w)).toContain('Weinkrug: In welchen Korb?')
    expect(w.find('[data-good="0"]').attributes('aria-pressed')).toBe('true')
    await w.find('[data-basket="0"]').trigger('click')
    expect(status(w)).toContain('Gut! Weinkrug in den linken Korb.')
    expect(w.text()).toContain('Die Last hängt nach links.')
    expect(w.find('.ge-saddle').attributes('data-angle')).toBe('-15')
    expect(played).toContain('sack')
    await put(1, 0)
    await put(2, 1)
    await put(3, 1)
    // 5 against 3: crooked, a mistake
    expect(status(w)).toContain('die Last hängt schief')
    expect(w.text()).toContain('Aufgeladen: 4 von 4')
    expect(played).not.toContain('wrong')
    await tick(400)
    expect(played).toContain('wrong')
    // swap the bread and the raisin cakes
    await w.find('[data-in="1"]').trigger('click')
    expect(status(w)).toContain('Brote liegt wieder in der Leiste.')
    await w.find('[data-in="3"]').trigger('click')
    await put(3, 0)
    await put(1, 1)
    expect(w.text()).toContain('Die Last hängt gerade.')
    expect(status(w)).toContain('Gut!')
    await tick(1000)
    expect(status(w)).toContain('Geschafft! Die Last hängt gerade.')
    // each gift counts once for "Go on", even when it was taken out
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(4000)
    expect(w.text()).toContain('Runde zwei')
    expect(w.findAll('[data-good]')).toHaveLength(8)
    expect(w.findAll('[data-in]')).toHaveLength(0)
    // round 2: the wine jar first slides back (a mistake)
    played.length = 0
    await put(0, 0)
    expect(status(w)).toContain('Zu schief!')
    expect(played).toEqual(['wrong'])
    expect(w.findAll('[data-in]')).toHaveLength(0)
    expect(w.find('.ge-mark').exists()).toBe(true)
    // the help loads the rest, one gift each time
    for (let k = 0; k < 8; k++) {
      await tick(16000)
      const help = button(w, 'Hilf mir')
      expect(help, `help ${k}`).toBeTruthy()
      await help!.trigger('click')
      expect(status(w)).toMatch(/Tipp: /)
      await tick(1700)
    }
    expect(w.findAll('[data-in]')).toHaveLength(8)
    await tick(1000)
    expect(status(w)).toContain('Geschafft')
    await tick(3300)
    // two mistakes: three stars
    expect(w.text()).toContain("Da eilte Abigail und nahm zweihundert Brote und zwei Krüge Wein")
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('dragging a gift to a basket puts it in; let go far away it comes back without a mistake; a full basket says so', async () => {
    const w = mount(GameEselLaden, { props: { game: DONKEY }, ...opts('de') })
    await flushPromises()
    // the left basket on the field: 22 + 20 % of 56 = 33.2, 40 + 64 % of the saddle's height
    const drag = async (good: number, x: number, y: number) => {
      pointer(w.find(`[data-good="${good}"]`).element, 'pointerdown', 50, 98)
      pointer(window, 'pointermove', 45, 90)
      pointer(window, 'pointermove', x, y)
      await flushPromises()
      pointer(window, 'pointerup', x, y)
      await flushPromises()
    }
    await drag(3, 33, 75)
    expect(w.findAll('[data-in]').map((b) => b.attributes('data-side'))).toEqual(['0'])
    expect(status(w)).toContain('Rosinenkuchen in den linken Korb')
    await drag(0, 50, 10)
    expect(status(w)).toContain('Zieh die Gabe in einen Korb.')
    expect(w.findAll('[data-in]')).toHaveLength(1)
    await drag(0, 67, 75)
    expect(w.findAll('[data-in]').map((b) => b.attributes('data-side'))).toEqual(['0', '1'])
    // the left basket holds three: fill it and try a fourth (round 1 has only four gifts: take the jar back first)
    await w.find('[data-in="0"]').trigger('click')
    await drag(0, 33, 75)
    await drag(1, 33, 75)
    expect(w.findAll('[data-in]')).toHaveLength(3)
    await drag(2, 33, 75)
    expect(status(w)).toContain('Dieser Korb ist voll.')
    expect(w.findAll('[data-in]')).toHaveLength(3)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('keys: left/right choose a gift, Enter takes it, left/right put it into a basket; English words', async () => {
    const w = mount(GameEselLaden, { props: { game: DONKEY }, ...opts('en') })
    await flushPromises()
    const field = w.find('.ge-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Left and right: choose a gift.')
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(status(w)).toContain('Brote, middle')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Brote is in your hand.')
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(w.findAll('[data-in]').map((b) => b.attributes('data-side'))).toEqual(['1'])
    expect(w.text()).toContain('The load hangs to the right.')
    await field.trigger('keydown', { key: 'Enter' })
    await field.trigger('keydown', { key: 'Escape' })
    expect(w.findAll('[data-good]')).toHaveLength(3)
    expect(problems()).toEqual([])
    w.unmount()
  })
})

// ---------------------------------------------------------------- 2. the gate of Hebron
const GATE: HebronGateGame = {
  background: 'stadt.webp',
  ratio: 1.5,
  door: 'tor.webp',
  gate: { x: 70, y: 40, w: 17.5, h: 34 },
  groups: ['s1.webp', 's2.webp', 's3.webp', 's4.webp'],
  groupRatio: 1.2,
  groupW: 20,
  road: { y: 88, from: 0, stop: 83 },
  rounds: [
    {
      hint: 'Runde eins',
      zone: 14,
      grace: 1500,
      gap: 1200,
      tribes: [
        { name: 'Der Stamm Juda', sprite: 0, speed: 10 },
        { name: 'Der Stamm Simeon', sprite: 1, speed: 10 },
        { name: 'Der Stamm Levi', sprite: 2, speed: 10 }
      ]
    },
    {
      hint: 'Runde zwei',
      zone: 9,
      grace: 800,
      gap: 1000,
      tribes: [
        { name: 'Der Stamm Issachar', sprite: 1, speed: 12 },
        { name: 'Der Stamm Sebulon', sprite: 2, speed: 13 },
        { name: 'Der Stamm Dan', sprite: 3, speed: 14 }
      ]
    }
  ]
}

describe('GameHebrontor', () => {
  it('too early is a mistake, in front of the gate is right, waiting is a mistake; keys; help says "Now!"; the zone only in round 1; the end gives the stars and 2 Samuel 5,1', async () => {
    const w = mount(GameHebrontor, { props: { game: GATE }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(6)
    await tick(700)
    expect(status(w)).toContain('Der Stamm Juda kommt.')
    expect(w.find('[data-tribe-name]').text()).toBe('Der Stamm Juda')
    expect(w.find('[data-zone]').exists()).toBe(true)
    // too early
    await tick(3000)
    await w.find('[data-gate]').trigger('click')
    expect(status(w)).toContain('Noch zu früh!')
    expect(played).toContain('wrong')
    expect(w.find('.gh-gate').classes()).not.toContain('open')
    // in front of the gate: 7.5 seconds after setting off
    await tick(4400)
    expect(Number(w.find('.gh-group').attributes('data-front'))).toBeGreaterThan(70)
    await w.find('[data-open]').trigger('click')
    expect(status(w)).toContain('Genau richtig! Der Stamm Juda zieht durch das Tor.')
    expect(w.find('.gh-gate').classes()).toContain('open')
    expect(useTaskProgress().parts.value).toBe(1)
    // a tap while the group goes in does nothing
    await w.find('[data-gate]').trigger('click')
    await tick(1700)
    expect(w.text()).toContain('In Hebron: 1 von 3')
    await tick(1300)
    expect(status(w)).toContain('Der Stamm Simeon kommt.')
    // too late: the group waits at the gate (a mistake), then Enter opens it
    await tick(10200)
    expect(status(w)).toContain('Der Stamm Simeon wartet vor dem Tor.')
    await w.find('.gh-field').trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Jetzt ist es offen. Der Stamm Simeon zieht hinein.')
    await tick(3000)
    // the third group in time with the arrow key
    await tick(7800)
    await w.find('.gh-field').trigger('keydown', { key: 'ArrowUp' })
    expect(status(w)).toContain('Genau richtig! Der Stamm Levi')
    await tick(2400)
    expect(status(w)).toContain('Alle sind in Hebron.')
    await tick(4600)
    expect(w.text()).toContain('Runde zwei')
    expect(w.text()).toContain('In Hebron: 0 von 3')
    await tick(100)
    // round 2: no zone; the first group is let wait (a mistake) until the help comes
    expect(w.find('[data-zone]').exists()).toBe(false)
    await tick(16500)
    const help = button(w, 'Hilf mir')
    expect(help).toBeTruthy()
    await help!.trigger('click')
    expect(status(w)).toContain('Wenn ich „Jetzt!“ sage')
    expect(w.find('[data-zone]').exists()).toBe(true)
    await w.find('[data-gate]').trigger('click')
    await tick(1700 + 1000)
    // with the help: "Now!" when the group is in front of the gate
    await tick(6100)
    expect(status(w)).toBe('Jetzt!')
    expect(w.find('.gh-gate').classes()).toContain('help')
    await w.find('[data-gate]').trigger('click')
    expect(status(w)).toContain('Genau richtig! Der Stamm Sebulon')
    await tick(2700)
    await tick(5600)
    await w.find('[data-gate]').trigger('click')
    expect(status(w)).toContain('Genau richtig! Der Stamm Dan')
    await tick(2000)
    await tick(4500)
    // four mistakes: two stars
    expect(w.text()).toContain('Und es kamen alle Stämme Israels zu David gen Hebron')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([2])
    expect(useTaskProgress().parts.value).toBe(6)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('Spanish words', async () => {
    const w = mount(GameHebrontor, { props: { game: GATE }, ...opts('es') })
    await flushPromises()
    await tick(700)
    expect(status(w)).toContain('Viene Der Stamm Juda.')
    expect(w.text()).toContain('Abrir la puerta')
    await w.find('[data-gate]').trigger('click')
    expect(status(w)).toContain('¡Todavía es pronto!')
    expect(problems()).toEqual([])
    w.unmount()
  })
})

// ---------------------------------------------------------------- 3. the festive procession
const FEST: FestMarchGame = {
  background: 'weg.webp',
  ratio: 4 / 3,
  musicianRatio: 0.5357,
  musicians: [
    { instrument: 'harfe', name: 'Der Mann mit der Harfe', image: 'h.webp', x: 13, y: 96, w: 19 },
    { instrument: 'pauke', name: 'Die Frau mit der Pauke', image: 'p.webp', x: 37, y: 96, w: 19 },
    { instrument: 'schellen', name: 'Der Junge mit den Schellen', image: 's.webp', x: 63, y: 96, w: 19 },
    { instrument: 'zimbeln', name: 'Der Mann mit den Zimbeln', image: 'z.webp', x: 87, y: 96, w: 19 }
  ],
  rounds: [
    { hint: 'Runde eins', mode: 'glow', order: [0, 2, 1, 3, 2, 0], glowMs: 2600 },
    { hint: 'Runde zwei', mode: 'echo', tunes: [[0, 2], [1, 3, 0], [2, 0, 3, 1]], stepMs: 800 }
  ]
}

describe('GameFestzug', () => {
  const litIndex = (w: VueWrapper) => w.findAll('[data-musician]').findIndex((b) => b.classes().includes('lit'))
  it('round 1: tap who lights up (a wrong one is a mistake, a missed glow comes again); round 2: the tunes after them (a wrong note: the tune again), the help; the end gives the stars and 2 Samuel 6,5', async () => {
    const w = mount(GameFestzug, { props: { game: FEST }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(15)
    await tick(700)
    expect(litIndex(w)).toBe(0)
    expect(w.find('[data-musician="0"]').attributes('aria-label')).toBe('Der Mann mit der Harfe, leuchtet jetzt')
    expect(w.text()).toContain('♪ Jetzt: Der Mann mit der Harfe')
    // a wrong one
    await w.find('[data-musician="1"]').trigger('click')
    expect(status(w)).toContain('Die Frau mit der Pauke leuchtet gerade nicht.')
    expect(played).toContain('wrong')
    await w.find('[data-musician="0"]').trigger('click')
    expect(status(w)).toContain('Schön! Der Mann mit der Harfe spielt.')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(400)
    expect(litIndex(w)).toBe(2)
    // missed: no mistake, it comes again at the end
    await tick(2700)
    expect(status(w)).toContain('Verpasst.')
    await tick(400)
    expect(litIndex(w)).toBe(1)
    // the rest in turn: 1, 3, 2, 0, 2
    const seen: number[] = []
    for (let k = 0; k < 5; k++) {
      const i = litIndex(w)
      seen.push(i)
      await w.find(`[data-musician="${i}"]`).trigger('click')
      await tick(400)
    }
    expect(seen).toEqual([1, 3, 2, 0, 2])
    await tick(800)
    expect(status(w)).toContain('Wunderbar!')
    await tick(3800)
    expect(w.text()).toContain('Runde zwei')
    expect(w.text()).toContain('Lied 1 von 3')
    // tapping while they play: listen first
    await tick(800)
    expect(litIndex(w)).toBe(0)
    await w.find('[data-musician="0"]').trigger('click')
    expect(status(w)).toContain('Hör erst zu.')
    await tick(2300)
    expect(status(w)).toContain('Jetzt du!')
    await w.find('[data-musician="0"]').trigger('click')
    await w.find('[data-musician="2"]').trigger('click')
    expect(status(w)).toContain('Richtig nachgespielt!')
    await tick(1600)
    expect(w.text()).toContain('Lied 2 von 3')
    // tune 2 (1, 3, 0): a wrong first note, then it is played again
    await tick(700 + 3 * 1150)
    expect(status(w)).toContain('Jetzt du!')
    await w.find('[data-musician="3"]').trigger('click')
    expect(status(w)).toContain('Hör noch einmal zu.')
    await tick(1400 + 700 + 3 * 1150)
    for (const i of [1, 3, 0]) await w.find(`[data-musician="${i}"]`).trigger('click')
    expect(status(w)).toContain('Richtig nachgespielt!')
    await tick(1600)
    // tune 3 with the help: it marks the one to tap
    await tick(700 + 4 * 1150)
    await tick(15000)
    const help = button(w, 'Hilf mir')
    expect(help).toBeTruthy()
    await help!.trigger('click')
    expect(status(w)).toContain('Tipp: Der Junge mit den Schellen.')
    for (let k = 0; k < 4; k++) {
      const marked = w.findAll('[data-musician]').findIndex((b) => b.classes().includes('help'))
      expect(marked, `note ${k}`).toBe([2, 0, 3, 1][k])
      await w.find(`[data-musician="${marked}"]`).trigger('click')
    }
    await tick(800)
    expect(status(w)).toContain('Wunderbar!')
    await tick(3500)
    // two mistakes: three stars
    expect(w.text()).toContain('spielte David und das ganze Haus Israel vor dem HERRN her')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(useTaskProgress().parts.value).toBe(15)
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('keys: left/right choose a musician, Enter taps; English words', async () => {
    const w = mount(GameFestzug, { props: { game: FEST }, ...opts('en') })
    await flushPromises()
    await tick(700)
    const field = w.find('.gf-field')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Left and right: choose a musician.')
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('Lovely!')
    await tick(400)
    await field.trigger('keydown', { key: 'ArrowRight' })
    await field.trigger('keydown', { key: 'Enter' })
    expect(status(w)).toContain('is not lit up now')
    expect(problems()).toEqual([])
    w.unmount()
  })
})
