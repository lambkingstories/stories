/**
 * The three new games of "Ester" (`tor` = GameTor, `zepter` = GameZepter, `boten` = GameBoten), each mounted with sample data and played through:
 * tapping the doorkeepers while they whisper (too early, only one, both, Enter, help); leading Esther's hand to the sceptre (a slow drag, a hasty one, keys, help);
 * sealing the letters and sending the messengers (tap, drag of the ring, swipe, keys, a wrong land, help); the rounds, the goal of "Go on" (`useTaskProgress`),
 * the end with the stars and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/ester/INTEGRATION.json, written by tools/i18n_neu_ester.py).
 */
import { readFileSync } from 'node:fs'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameTor from '@/components/molecules/games/GameTor.vue'
import GameZepter from '@/components/molecules/games/GameZepter.vue'
import GameBoten from '@/components/molecules/games/GameBoten.vue'
import { esterDist, sceptreTip } from '@/utils/esterNeu'
import type { GateGame, RidersGame, SceptreGame } from '@/utils/esterNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  de: {
    gateWatchField: "Das Tor des Königs. Links sitzt Mordechai, rechts stehen die zwei Türhüter.",
    gateWatchCount: "Gehört: {n} von {total}",
    gateWatchApart: "Jetzt flüstern sie nicht. Warte, bis sie die Köpfe zusammenstecken.",
    gateWatchOne: "Gut! Jetzt schnell auch den anderen.",
    gateWatchBoth: "Fast! Tippe beide an, solange sie flüstern.",
    gateWatchHeard: "Mordechai hat es gehört! ({n} von {total})",
    gateWatchRoundDone: "Mordechai hat genug gehört. Er sagt es Ester.",
    gateWatchNow: "Jetzt! Sie flüstern. Tippe beide an.",
    gateWatchHelped: "Schau auf die zwei Türhüter. Sobald sie flüstern, sage ich: Jetzt!",
    gateWatchHelp: "Hilf mir",
    gateWatchDone: "Das ward Mardochai kund, und er sagte es der Königin Esther, und Esther sagte es dem König in Mardochais Namen.",
    sceptreField: "Der innere Hof. Von rechts streckt der König das goldene Zepter aus, unten ist Esters Hand.",
    sceptreArm: "Das goldene Zepter des Königs",
    sceptreHand: "Esters Hand",
    sceptreCount: "Geschafft: {n} von {total}",
    sceptreHold: "Ganz ruhig halten …",
    sceptreHolding: "Halten: {n} %",
    sceptreTouched: "Ester berührt die Spitze des Zepters.",
    sceptreHasty: "Zu hastig! Die Hand zittert. Noch einmal, ganz ruhig.",
    sceptreKeys: "Mit den Pfeiltasten bewegst du die Hand. Enter: ein Stück zum Zepter.",
    sceptreHelped: "Schau: Die Hand geht ganz ruhig zur Spitze.",
    sceptreHelp: "Hilf mir",
    sceptreDone: "Und der König reckte das goldene Zepter in seiner Hand gegen Esther. Da trat Esther herzu und rührte die Spitze des Zepters an.",
    ridersField: "Die Karte des Reiches. In der Mitte liegt Susa, rundherum die Länder.",
    ridersTray: "Der Tisch mit dem Brief und dem Siegelring",
    ridersRider: "Der Bote mit dem Brief nach {land}",
    ridersLetter: "Der Brief nach {land}, noch ohne Siegel",
    ridersLetterSealed: "Der Brief nach {land}, gesiegelt",
    ridersTo: "nach {land}",
    ridersRing: "Der Siegelring des Königs",
    ridersRingTaken: "Du hast den Ring. Tippe jetzt den Brief an.",
    ridersRingFirst: "Nimm zuerst den Siegelring.",
    ridersRingBack: "Zieh den Ring auf den Brief.",
    ridersSealed: "Gesiegelt! Schick den Boten nach {land}.",
    ridersSealFirst: "Erst muss der Brief gesiegelt werden.",
    ridersNone: "Wisch den Boten zu einem Land auf der Karte.",
    ridersWrong: "Dieser Brief geht nach {land}, nicht nach {other}.",
    ridersArrived: "Der Bote reitet nach {land}.",
    ridersRoundDone: "Alle Briefe sind unterwegs!",
    ridersCount: "Unterwegs: {n} von {total}",
    ridersKeys: "Enter: siegeln. Dann mit links und rechts ein Land wählen und mit Enter losschicken.",
    ridersHelpSeal: "Tippe den Ring an und dann den Brief.",
    ridersHelpSend: "Der Brief geht nach {land}. Schick den Boten dorthin.",
    ridersHelp: "Hilf mir",
    ridersDone: "Und es war geschrieben in des Königs Ahasveros Namen und mit des Königs Ring versiegelt. Und er sandte die Briefe durch die reitenden Boten auf jungen Maultieren."
  },
  en: {
    gateWatchField: "The king’s gate. Mordecai sits on the left, the two doorkeepers stand on the right.",
    gateWatchCount: "Heard: {n} of {total}",
    gateWatchApart: "They are not whispering now. Wait until they put their heads together.",
    gateWatchOne: "Good! Now quickly the other one too.",
    gateWatchBoth: "Almost! Tap both while they whisper.",
    gateWatchHeard: "Mordecai has heard it! ({n} of {total})",
    gateWatchRoundDone: "Mordecai has heard enough. He tells Esther.",
    gateWatchNow: "Now! They are whispering. Tap both.",
    gateWatchHelped: "Watch the two doorkeepers. As soon as they whisper, I will say: Now!",
    gateWatchHelp: "Help me",
    gateWatchDone: "And the thing was known to Mordecai, who told it unto Esther the queen; and Esther certified the king thereof in Mordecai’s name.",
    sceptreField: "The inner court. From the right the king holds out the golden sceptre; below is Esther’s hand.",
    sceptreArm: "The king’s golden sceptre",
    sceptreHand: "Esther’s hand",
    sceptreCount: "Done: {n} of {total}",
    sceptreHold: "Keep it very still …",
    sceptreHolding: "Holding: {n} %",
    sceptreTouched: "Esther touches the top of the sceptre.",
    sceptreHasty: "Too hasty! The hand trembles. Once more, very calmly.",
    sceptreKeys: "The arrow keys move the hand. Enter: a step toward the sceptre.",
    sceptreHelped: "Look: the hand goes very calmly to the top.",
    sceptreHelp: "Help me",
    sceptreDone: "And the king held out to Esther the golden sceptre that was in his hand. So Esther drew near, and touched the top of the sceptre.",
    ridersField: "The map of the kingdom. Shushan lies in the middle, the lands all around.",
    ridersTray: "The table with the letter and the signet ring",
    ridersRider: "The messenger with the letter to {land}",
    ridersLetter: "The letter to {land}, not sealed yet",
    ridersLetterSealed: "The letter to {land}, sealed",
    ridersTo: "to {land}",
    ridersRing: "The king’s signet ring",
    ridersRingTaken: "You have the ring. Now tap the letter.",
    ridersRingFirst: "First take the signet ring.",
    ridersRingBack: "Drag the ring onto the letter.",
    ridersSealed: "Sealed! Send the messenger to {land}.",
    ridersSealFirst: "First the letter must be sealed.",
    ridersNone: "Swipe the messenger toward a land on the map.",
    ridersWrong: "This letter goes to {land}, not to {other}.",
    ridersArrived: "The messenger rides to {land}.",
    ridersRoundDone: "All the letters are on their way!",
    ridersCount: "On the way: {n} of {total}",
    ridersKeys: "Enter: seal. Then choose a land with left and right and send him with Enter.",
    ridersHelpSeal: "Tap the ring and then the letter.",
    ridersHelpSend: "The letter goes to {land}. Send the messenger there.",
    ridersHelp: "Help me",
    ridersDone: "And he wrote in the king Ahasuerus’ name, and sealed it with the king’s ring, and sent letters by posts on horseback, and riders on mules, camels, and young dromedaries."
  },
  es: {
    gateWatchField: "La puerta del rey. A la izquierda está sentado Mardoqueo, a la derecha están los dos porteros.",
    gateWatchCount: "Oído: {n} de {total}",
    gateWatchApart: "Ahora no susurran. Espera hasta que junten las cabezas.",
    gateWatchOne: "¡Bien! Ahora rápido también al otro.",
    gateWatchBoth: "¡Casi! Toca a los dos mientras susurran.",
    gateWatchHeard: "¡Mardoqueo lo ha oído! ({n} de {total})",
    gateWatchRoundDone: "Mardoqueo ha oído bastante. Se lo dice a Ester.",
    gateWatchNow: "¡Ahora! Están susurrando. Toca a los dos.",
    gateWatchHelped: "Mira a los dos porteros. En cuanto susurren, te diré: ¡Ahora!",
    gateWatchHelp: "Ayúdame",
    gateWatchDone: "Mas entendido que fue esto por Mardochêo, él lo denunció a la reina Esther, y Esther lo dijo al rey en nombre de Mardochêo.",
    sceptreField: "El patio interior. Desde la derecha el rey extiende el cetro de oro; abajo está la mano de Ester.",
    sceptreArm: "El cetro de oro del rey",
    sceptreHand: "La mano de Ester",
    sceptreCount: "Logrado: {n} de {total}",
    sceptreHold: "Mantenla muy quieta …",
    sceptreHolding: "Sosteniendo: {n} %",
    sceptreTouched: "Ester toca la punta del cetro.",
    sceptreHasty: "¡Demasiado deprisa! La mano tiembla. Otra vez, muy tranquilo.",
    sceptreKeys: "Con las flechas mueves la mano. Enter: un paso hacia el cetro.",
    sceptreHelped: "Mira: la mano va muy tranquila hacia la punta.",
    sceptreHelp: "Ayúdame",
    sceptreDone: "Y el rey extendió a Esther el cetro de oro que tenía en la mano. Entonces se llegó Esther, y tocó la punta del cetro.",
    ridersField: "El mapa del reino. En el centro está Susa, alrededor los países.",
    ridersTray: "La mesa con la carta y el anillo del rey",
    ridersRider: "El correo con la carta para {land}",
    ridersLetter: "La carta para {land}, todavía sin sello",
    ridersLetterSealed: "La carta para {land}, sellada",
    ridersTo: "para {land}",
    ridersRing: "El anillo del rey para sellar",
    ridersRingTaken: "Tienes el anillo. Ahora toca la carta.",
    ridersRingFirst: "Primero toma el anillo.",
    ridersRingBack: "Arrastra el anillo sobre la carta.",
    ridersSealed: "¡Sellada! Envía al correo a {land}.",
    ridersSealFirst: "Primero hay que sellar la carta.",
    ridersNone: "Desliza al correo hacia un país del mapa.",
    ridersWrong: "Esta carta va a {land}, no a {other}.",
    ridersArrived: "El correo cabalga hacia {land}.",
    ridersRoundDone: "¡Todas las cartas van de camino!",
    ridersCount: "De camino: {n} de {total}",
    ridersKeys: "Enter: sellar. Luego elige un país con izquierda y derecha y envíalo con Enter.",
    ridersHelpSeal: "Toca el anillo y luego la carta.",
    ridersHelpSend: "La carta va a {land}. Envía al correo allí.",
    ridersHelp: "Ayúdame",
    ridersDone: "Y escribió en nombre del rey Assuero, y selló con el anillo del rey, y envió letras por correos de a caballo, montados en dromedarios, y en mulos hijos de yeguas."
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
const key = async (w: VueWrapper, sel: string, k: string) => {
  await w.find(sel).trigger('keydown', { key: k })
  await flushPromises()
}

// ---------------------------------------------------------------- every word the games use is there, in three languages
describe('the words', () => {
  it('every key of app.adventure that the three games use is there in German, English and Spanish', () => {
    const all = allMessages()
    for (const file of ['GameTor', 'GameZepter', 'GameBoten']) {
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
    for (const k of Object.keys(NEW_KEYS.de)) expect(k).toMatch(/^(gateWatch|sceptre|riders)/)
  })
})

// ---------------------------------------------------------------- 1. the gate
const GATE: GateGame = {
  background: 'tor/hof.webp',
  ratio: 4 / 3,
  guards: { apart: 'a.webp', whisper: 'w.webp', x: 70, y: 90, w: 36, ratio: 0.9, split: 0.5, top: 0.05, names: ['Erster Türhüter', 'Zweiter Türhüter'] },
  rounds: [
    { hint: 'Runde eins', need: 3, pattern: [3000, 3800, 2600], whisperMs: 2400 },
    { hint: 'Runde zwei', need: 4, pattern: [2200, 3400, 1600, 2800], whisperMs: 1600 }
  ]
}

describe('GameTor', () => {
  it('a tap too early is a mistake; one of the two and then the other is heard; only one in a whispering is a word; Enter taps both; the end gives the stars and Esther 2,22', async () => {
    const w = mount(GameTor, { props: { game: GATE }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.text()).toContain('Runde eins')
    expect(w.findAll('[data-guard]')).toHaveLength(2)
    expect(w.find('[data-guard="0"]').attributes('aria-label')).toBe('Erster Türhüter')
    expect(w.find('.gt-guards').attributes('data-whisper')).toBe('no')
    // too early
    await tick(1000)
    await w.find('[data-guard="0"]').trigger('click')
    expect(status(w)).toContain('Jetzt flüstern sie nicht')
    expect(played).toContain('wrong')
    expect(w.find('.gt-mark').exists()).toBe(true)
    // the first whispering (3000 to 5400): one, then the other
    await tick(2100)
    expect(w.find('.gt-guards').attributes('data-whisper')).toBe('yes')
    await w.find('[data-guard="1"]').trigger('click')
    expect(status(w)).toContain('Jetzt schnell auch den anderen')
    expect(w.find('[data-guard="1"]').classes()).toContain('tapped')
    await w.find('[data-guard="0"]').trigger('click')
    expect(status(w)).toContain('Mordechai hat es gehört! (1 von 3)')
    expect(w.text()).toContain('Gehört: 1 von 3')
    expect(useTaskProgress().parts.value).toBe(1)
    // the second whispering (9200 to 11600): only one tapped, then it ends: a word, no mistake
    await tick(9300 - 3100)
    await w.find('[data-guard="0"]').trigger('click')
    await tick(11700 - 9300)
    expect(status(w)).toContain('Tippe beide an, solange sie flüstern')
    // the third whispering (14200 to 16600) with Enter, the fourth (19600 to 22000) by tapping
    await tick(14300 - 11700)
    await key(w, '.gt-field', 'Enter')
    expect(w.text()).toContain('Gehört: 2 von 3')
    await tick(19700 - 14300)
    await key(w, '.gt-field', 'ArrowLeft')
    await key(w, '.gt-field', 'ArrowRight')
    expect(status(w)).toContain('Mordechai hat es gehört! (3 von 3)')
    await tick(1000)
    expect(status(w)).toContain('Mordechai hat genug gehört')
    // round 2
    await tick(3200)
    expect(w.text()).toContain('Runde zwei')
    expect(w.text()).toContain('Gehört: 0 von 4')
    // the clock of round 2 runs since 4000 ms after the end of round 1 (about 200 ms now); the whisperings: 2200, 7200, 10400, 14800
    let now = 200
    for (const at of [2300, 7300, 10500, 14900]) {
      await tick(at - now)
      now = at
      await key(w, '.gt-field', 'Enter')
    }
    expect(useTaskProgress().parts.value).toBe(7)
    await tick(4000)
    expect(w.find('.gd').exists()).toBe(true)
    expect(w.text()).toContain('Das ward Mardochai kund')
    // one mistake: three stars
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(played).toContain('star')
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('after fifteen seconds without a tap "Help me" marks the doorkeepers and says "Now!" while they whisper (English)', async () => {
    const w = mount(GameTor, { props: { game: GATE }, ...opts('en') })
    await flushPromises()
    expect(button(w, 'Help me')).toBeUndefined()
    await tick(15200)
    // 15200 lies in the third whispering? no: 14200 to 16600 it is the third whispering
    const help = button(w, 'Help me')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(status(w)).toContain('Now! They are whispering')
    expect(w.findAll('.gt-guard.help')).toHaveLength(2)
    await tick(1600)
    expect(w.findAll('.gt-guard.help')).toHaveLength(0)
    // the next whispering begins at 16600 + 3000 = 19600: "Now!" again
    await tick(19700 - 16800)
    expect(status(w)).toContain('Now!')
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('Spanish words', async () => {
    const w = mount(GameTor, { props: { game: GATE }, ...opts('es') })
    await flushPromises()
    await w.find('[data-guard="0"]').trigger('click')
    expect(status(w)).toContain('Ahora no susurran')
    expect(w.text()).toContain('Oído: 0 de 3')
    w.unmount()
  })
})

// ---------------------------------------------------------------- 2. the sceptre
const SCEPTRE: SceptreGame = {
  background: 'saal.webp',
  ratio: 4 / 3,
  arm: { image: 'arm.webp', w: 80, aspect: 3, pivot: { x: 1, y: 0.5 }, tip: { x: 0.03, y: 0.55 } },
  hand: { image: 'hand.webp', w: 18, aspect: 0.3, pivot: { x: 0.5, y: 0.02 }, tip: { x: 0.5, y: 0.02 } },
  rounds: [
    { hint: 'Runde eins', pivot: { x: 112, y: 40 }, angle: 0, sway: 4, period: 4.2, start: { x: 30, y: 88 }, reach: 8, hold: 0.8, maxSpeed: 80 },
    { hint: 'Runde zwei', pivot: { x: 112, y: 40 }, angle: -4, sway: 7, period: 3.4, start: { x: 24, y: 90 }, reach: 6.5, hold: 1.2, maxSpeed: 55 }
  ]
}
/** Where the hand is (the tip of the finger, from the style of the hand: left + tip.x * w, top + tip.y * h). */
function handAt(w: VueWrapper): { x: number; y: number } {
  const st = w.find('[data-hand]').attributes('style') ?? ''
  const left = parseFloat(/left:\s*([-\d.]+)%/.exec(st)![1]!)
  const top = parseFloat(/top:\s*([-\d.]+)%/.exec(st)![1]!)
  const h = (SCEPTRE.hand.w / SCEPTRE.hand.aspect) * SCEPTRE.ratio
  return { x: left + SCEPTRE.hand.tip.x * SCEPTRE.hand.w, y: top + SCEPTRE.hand.tip.y * h }
}

describe('GameZepter', () => {
  it('a hasty hand trembles and goes back (a mistake); a slow drag to the knob and holding it finishes the round; round 2 with the keys; the end gives Esther 5,2', async () => {
    const w = mount(GameZepter, { props: { game: SCEPTRE }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde eins')
    const field = w.find('.gs-field').element
    expect(handAt(w).x).toBeCloseTo(30, 4)
    // hasty: 30 units in 40 milliseconds
    pointer(field, 'pointerdown', 30, 88)
    await tick(40)
    pointer(window, 'pointermove', 45, 80)
    await tick(40)
    pointer(window, 'pointermove', 60, 70)
    await flushPromises()
    expect(status(w)).toContain('Zu hastig')
    expect(played).toContain('wrong')
    expect(w.find('.gs-hand').classes()).toContain('tremble')
    await tick(600)
    expect(handAt(w).x).toBeCloseTo(30, 4)
    pointer(window, 'pointerup', 60, 70)
    // a slow drag: the finger goes 1.2 units every 40 milliseconds (30 units a second) toward the knob and follows it
    let finger = { x: 50, y: 50 }
    pointer(field, 'pointerdown', finger.x, finger.y)
    let clock = 0.68
    for (let k = 0; k < 200 && !status(w).includes('berührt'); k++) {
      const hand = handAt(w)
      const tip = sceptreTip(SCEPTRE, SCEPTRE.rounds[0]!, clock)
      const d = esterDist(hand, tip, SCEPTRE.ratio)
      const step = Math.min(1.2, d)
      if (d > 0.01) finger = { x: finger.x + ((tip.x - hand.x) / d) * step, y: finger.y + ((tip.y - hand.y) / d) * step }
      await tick(40)
      clock += 0.04
      pointer(window, 'pointermove', finger.x, finger.y)
      await flushPromises()
    }
    expect(status(w)).toContain('Ester berührt die Spitze des Zepters')
    pointer(window, 'pointerup', finger.x, finger.y)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('right')
    // round 2 by the keys: Enter steps toward the knob
    await tick(3500)
    expect(w.text()).toContain('Runde zwei')
    await key(w, '.gs-field', 'ArrowUp')
    expect(handAt(w).y).toBeCloseTo(90 - 3 * (4 / 3), 4)
    for (let k = 0; k < 200 && !status(w).includes('berührt'); k++) {
      await key(w, '.gs-field', 'Enter')
      await tick(40)
    }
    expect(status(w)).toContain('Ester berührt die Spitze des Zepters')
    await tick(3400)
    expect(w.find('.gd').exists()).toBe(true)
    expect(w.text()).toContain('rührte die Spitze des Zepters an')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('after fifteen seconds without a move "Help me" leads the hand calmly to the knob (English)', async () => {
    const w = mount(GameZepter, { props: { game: SCEPTRE }, ...opts('en') })
    await flushPromises()
    await tick(15200)
    const help = button(w, 'Help me')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(status(w)).toContain('the hand goes very calmly')
    expect(w.find('.gs-hand').classes()).toContain('guided')
    await tick(8000)
    expect(status(w) + w.text()).toMatch(/Esther touches the top of the sceptre|Round 2/)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).not.toContain('wrong')
    w.unmount()
  })
})

// ---------------------------------------------------------------- 3. the messengers
const RIDERS: RidersGame = {
  map: 'karte.webp',
  ratio: 4 / 3,
  susa: { x: 50, y: 50, name: 'Susa' },
  lands: [
    { id: 'medien', name: 'Medien', x: 55, y: 10, angle: -79 },
    { id: 'indien', name: 'Indien', x: 90, y: 48, angle: -1 },
    { id: 'persien', name: 'Persien', x: 78, y: 86, angle: 44 },
    { id: 'kusch', name: 'Kusch', x: 15, y: 86, angle: 143 }
  ],
  letter: 'brief.webp',
  letterAspect: 2.4,
  ring: 'ring.webp',
  seal: 'siegel.webp',
  sealAt: { x: 0.5, y: 0.5 },
  sealW: 0.3,
  riderW: 16,
  rounds: [
    { hint: 'Runde eins', tolerance: 40, letters: [{ land: 'indien', rider: 'r1.webp' }, { land: 'kusch', rider: 'r2.webp' }] },
    {
      hint: 'Runde zwei',
      tolerance: 20,
      letters: [
        { land: 'medien', rider: 'r3.webp' },
        { land: 'kusch', rider: 'r4.webp' },
        { land: 'persien', rider: 'r1.webp' },
        { land: 'indien', rider: 'r2.webp' }
      ]
    }
  ]
}

describe('GameBoten', () => {
  it('seal first (tap the letter, a land: words, no mistake), the ring and the letter, a wrong land is a mistake, the right one; dragging the ring, swiping; round 2 with the keys; the end gives Esther 8,10', async () => {
    const w = mount(GameBoten, { props: { game: RIDERS }, ...opts('de') })
    await flushPromises()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.text()).toContain('Runde eins')
    expect(w.text()).toContain('nach Indien')
    expect(w.findAll('[data-land]').map((b) => b.text())).toEqual(['Medien', 'Indien', 'Persien', 'Kusch'])
    // the letter without the ring, a land before the seal
    await w.find('[data-letter]').trigger('click')
    expect(status(w)).toContain('Nimm zuerst den Siegelring')
    await w.find('[data-land="indien"]').trigger('click')
    expect(status(w)).toContain('Erst muss der Brief gesiegelt werden')
    expect(played).not.toContain('wrong')
    // a tap on the ring (down and up without moving), then the letter
    const ring = w.find('[data-ring]').element
    pointer(ring, 'pointerdown', 80, 50)
    pointer(window, 'pointerup', 80, 50)
    await flushPromises()
    expect(status(w)).toContain('Du hast den Ring')
    await w.find('[data-letter]').trigger('click')
    expect(status(w)).toContain('Gesiegelt! Schick den Boten nach Indien')
    expect(w.find('.gb-seal').exists()).toBe(true)
    expect(w.find('[data-ring]').exists()).toBe(false)
    // a wrong land
    await w.find('[data-land="kusch"]').trigger('click')
    expect(status(w)).toContain('Dieser Brief geht nach Indien, nicht nach Kusch')
    expect(played).toContain('wrong')
    // the right land by a swipe to the right
    const map = w.find('.gb-map').element
    pointer(map, 'pointerdown', 40, 60)
    pointer(window, 'pointerup', 70, 61)
    await flushPromises()
    expect(w.find('[data-rider]').classes()).toContain('ride')
    await tick(1400)
    expect(status(w)).toContain('Der Bote reitet nach Indien')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('nach Kusch')
    // the second letter: dragging the ring onto the letter, then a tap on the map toward Kusch (down left of Susa)
    pointer(w.find('[data-ring]').element, 'pointerdown', 80, 50)
    pointer(window, 'pointermove', 60, 50)
    await flushPromises()
    expect(w.find('.gb-ringghost').exists()).toBe(true)
    pointer(window, 'pointerup', 30, 50)
    await flushPromises()
    expect(w.find('.gb-seal').exists()).toBe(true)
    pointer(map, 'pointerdown', 20, 80)
    pointer(window, 'pointerup', 20, 80)
    await tick(1400)
    expect(status(w)).toContain('Der Bote reitet nach Kusch')
    await tick(1000)
    expect(status(w)).toContain('Alle Briefe sind unterwegs')
    // round 2 by the keys: Enter seals, the arrows choose a land, Enter sends
    await tick(3000)
    expect(w.text()).toContain('Runde zwei')
    const order = ['medien', 'kusch', 'persien', 'indien']
    const ids = RIDERS.lands.map((l) => l.id)
    for (const land of order) {
      await key(w, '.gb-map', 'Enter')
      expect(w.find('.gb-seal').exists()).toBe(true)
      for (let k = 0; k <= ids.indexOf(land); k++) await key(w, '.gb-map', 'ArrowRight')
      await key(w, '.gb-map', 'Enter')
      await tick(1400)
    }
    expect(useTaskProgress().parts.value).toBe(6)
    await tick(3500)
    expect(w.find('.gd').exists()).toBe(true)
    expect(w.text()).toContain('mit des Königs Ring versiegelt')
    await button(w, 'Weiter')!.trigger('click')
    expect(w.emitted('done')?.[0]).toEqual([3])
    expect(problems()).toEqual([])
    w.unmount()
  })

  it('after fifteen seconds "Help me" marks the ring and the letter, then the land of the letter (English)', async () => {
    const w = mount(GameBoten, { props: { game: RIDERS }, ...opts('en') })
    await flushPromises()
    await tick(15300)
    await button(w, 'Help me')!.trigger('click')
    expect(status(w)).toContain('Tap the ring and then the letter')
    expect(w.find('[data-letter]').classes()).toContain('help')
    await w.find('[data-letter]').trigger('click')
    expect(status(w)).toContain('Sealed! Send the messenger to')
    await tick(15300)
    await button(w, 'Help me')!.trigger('click')
    expect(w.find('[data-land="indien"]').classes()).toContain('help')
    w.unmount()
  })

  it('Spanish words', async () => {
    const w = mount(GameBoten, { props: { game: RIDERS }, ...opts('es') })
    await flushPromises()
    await w.find('[data-letter]').trigger('click')
    expect(status(w)).toContain('Primero toma el anillo')
    w.unmount()
  })
})
