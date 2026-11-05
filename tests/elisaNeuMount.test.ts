/**
 * The three new games of "Elisa und Naaman" (Anton's plan of 5.11.2026), mounted with the real data of `elisa.ts` and played through:
 * GameHandmuehle (the hand mill, 2 Kings 4,42-44), GameSiegel (the seal, 2 Kings 5,5), GameNaamanerde (earth for Naaman, 2 Kings 5,17).
 * Turning, mistakes (cross, words, one each), the help after fifteen seconds, the keys, the rounds, the goal of "Go on" (`useTaskProgress`), the end with the stars and the words of the Bible,
 * German, English and Spanish. The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/elisa/INTEGRATION.json,
 * written by D:/Claude/Abenteuer-Elisa/tools/integration_elisa.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameHandmuehle from '@/components/molecules/games/GameHandmuehle.vue'
import GameSiegel from '@/components/molecules/games/GameSiegel.vue'
import GameNaamanerde from '@/components/molecules/games/GameNaamanerde.vue'
import type { EarthGame, MillGame, SealGame } from '@/utils/elisaNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "handMillField": "Die Handmühle von oben: in der Mitte die zwei Mühlsteine, links der Sack mit Gerste, rechts die Schale für das Mehl.",
    "handMillStone": "Der obere Mühlstein: Finger darauflegen und im Kreis drehen. Gemahlen: {n} von {total} Umdrehungen.",
    "handMillSack": "Der Sack mit Gerste: Antippen schüttet Körner in das Loch des Mühlsteins.",
    "handMillBowl": "Die Schale mit dem Mehl von {n} der {total} Umdrehungen",
    "handMillCount": "Gemahlen: {n} von {total} Umdrehungen",
    "handMillTurnButton": "Drehen",
    "handMillFast": "Langsamer! Sonst springen die Körner aus dem Loch.",
    "handMillEmptySoon": "Das Loch ist leer. Tippe auf den Sack, dann kommen neue Körner hinein.",
    "handMillEmpty": "Ohne Körner reibt nur Stein auf Stein. Tippe zuerst auf den Sack.",
    "handMillPoured": "Neue Körner sind im Loch.",
    "handMillEnough": "Im Loch sind noch genug Körner. Dreh weiter.",
    "handMillRoundDone": "Die Schale ist voll Mehl!",
    "handMillHelp": "Hilf mir",
    "handMillHelpRefill": "Schau: Das Loch ist leer. Tippe auf den Sack.",
    "handMillHelpSlow": "Dreh ruhiger, in einem großen, langsamen Kreis.",
    "handMillHelpTurn": "Leg den Finger auf den Mühlstein und fahr im Kreis herum. Oder tippe auf „Drehen“.",
    "handMillDone": "Und er legte es ihnen vor, daß sie aßen; und es blieb noch übrig nach dem Wort des HERRN. (2. Könige 4,44)",
    "sealTurnField": "Der Schreibtisch des Königs von Syrien mit dem Brief. Fahr mit dem Finger im Kreis, dann dreht sich das Siegel.",
    "sealTurnSeal": "Das Siegel des Königs mit dem Löwen",
    "sealTurnSpot": "Wachs {n} von {total} mit dem Abdruck des Siegels",
    "sealTurnSpotDone": "Wachs {n} von {total}: gesiegelt",
    "sealTurnLeft": "Siegel nach links drehen",
    "sealTurnRight": "Siegel nach rechts drehen",
    "sealTurnPress": "Siegeln",
    "sealTurnCount": "Gesiegelt: {n} von {total}",
    "sealTurnWrong": "Das passt noch nicht. Dreh weiter, bis der Löwe genau im Abdruck liegt.",
    "sealTurnSealed": "Gesiegelt! Das Siegel passt genau.",
    "sealTurnRoundDone": "Der Brief ist versiegelt!",
    "sealTurnHelp": "Hilf mir",
    "sealTurnHelpLeft": "Dreh das Siegel nach links.",
    "sealTurnHelpRight": "Dreh das Siegel nach rechts.",
    "sealTurnHelpPress": "Das Siegel passt. Tippe auf „Siegeln“.",
    "sealTurnDone": "Der König von Syrien sprach: So zieh hin, ich will dem König Israels einen Brief schreiben. (2. Könige 5,5)",
    "earthLoadField": "Vor Elisas Haus: zwei Maultiere, unten auf dem Weg die Säcke mit Erde.",
    "earthLoadMule1": "Braunes Maultier",
    "earthLoadMule2": "Graues Maultier",
    "earthLoadMule": "{mule}: trägt {n} von {total}. Antippen lädt den gewählten Sack auf oder nimmt den obersten Sack herunter.",
    "earthLoadLoad": "{mule}: {n} von {total}",
    "earthLoadSack": "Sack mit Erde, {size}, Größe {n}",
    "earthLoadSize1": "klein",
    "earthLoadSize2": "mittel",
    "earthLoadSize3": "groß",
    "earthLoadChosen": "gewählt",
    "earthLoadPick": "Gewählt. Jetzt tippe auf ein Maultier.",
    "earthLoadPickFirst": "Dieses Maultier trägt noch nichts. Tippe zuerst einen Sack auf dem Weg an.",
    "earthLoadLoaded": "Aufgeladen! {mule}: {n} von {total}.",
    "earthLoadHeavy": "Zu schwer! Dieses Maultier darf nur die Hälfte tragen.",
    "earthLoadTaken": "Der oberste Sack ist wieder unten.",
    "earthLoadStuck": "Kein Sack passt mehr. Tippe auf ein Maultier, dann kommt sein oberster Sack wieder herunter.",
    "earthLoadRoundDone": "Beide Maultiere tragen gleich viel!",
    "earthLoadHelp": "Hilf mir",
    "earthLoadHelpPut": "Schau: Dieser Sack passt auf dieses Maultier.",
    "earthLoadHelpTake": "Tippe auf das Maultier mit dem Ring. Dann kommt sein oberster Sack wieder herunter.",
    "earthLoadDone": "Da sprach Naeman: Möchte deinem Knecht nicht gegeben werden dieser Erde Last, soviel zwei Maultiere tragen? (2. Könige 5,17)"
  },
  "en": {
    "handMillField": "The hand mill from above: the two millstones in the middle, the sack of barley on the left, the bowl for the flour on the right.",
    "handMillStone": "The upper millstone: put your finger on it and turn it round. Ground: {n} of {total} turns.",
    "handMillSack": "The sack of barley: tap it to pour grain into the hole of the millstone.",
    "handMillBowl": "The bowl with the flour of {n} of the {total} turns",
    "handMillCount": "Ground: {n} of {total} turns",
    "handMillTurnButton": "Turn",
    "handMillFast": "Slower! Or the grains jump out of the hole.",
    "handMillEmptySoon": "The hole is empty. Tap the sack, and new grain goes in.",
    "handMillEmpty": "Without grain only stone rubs on stone. Tap the sack first.",
    "handMillPoured": "New grain is in the hole.",
    "handMillEnough": "There is still enough grain in the hole. Keep turning.",
    "handMillRoundDone": "The bowl is full of flour!",
    "handMillHelp": "Help me",
    "handMillHelpRefill": "Look: the hole is empty. Tap the sack.",
    "handMillHelpSlow": "Turn more calmly, in a big, slow circle.",
    "handMillHelpTurn": "Put your finger on the millstone and go round in a circle. Or tap “Turn”.",
    "handMillDone": "So he set it before them, and they did eat, and left thereof, according to the word of the LORD. (2 Kings 4:44)",
    "sealTurnField": "The writing table of the king of Syria with the letter. Move your finger in a circle, and the seal turns.",
    "sealTurnSeal": "The king’s seal with the lion",
    "sealTurnSpot": "Wax {n} of {total} with the imprint of the seal",
    "sealTurnSpotDone": "Wax {n} of {total}: sealed",
    "sealTurnLeft": "Turn the seal to the left",
    "sealTurnRight": "Turn the seal to the right",
    "sealTurnPress": "Seal",
    "sealTurnCount": "Sealed: {n} of {total}",
    "sealTurnWrong": "That does not fit yet. Keep turning until the lion lies exactly in the imprint.",
    "sealTurnSealed": "Sealed! The seal fits exactly.",
    "sealTurnRoundDone": "The letter is sealed!",
    "sealTurnHelp": "Help me",
    "sealTurnHelpLeft": "Turn the seal to the left.",
    "sealTurnHelpRight": "Turn the seal to the right.",
    "sealTurnHelpPress": "The seal fits. Tap “Seal”.",
    "sealTurnDone": "And the king of Syria said, Go to, go, and I will send a letter unto the king of Israel. (2 Kings 5:5)",
    "earthLoadField": "Before Elisha’s house: two mules, and below on the road the sacks of earth.",
    "earthLoadMule1": "Brown mule",
    "earthLoadMule2": "Grey mule",
    "earthLoadMule": "{mule}: carries {n} of {total}. Tap to load the chosen sack or to take the top sack down.",
    "earthLoadLoad": "{mule}: {n} of {total}",
    "earthLoadSack": "Sack of earth, {size}, size {n}",
    "earthLoadSize1": "small",
    "earthLoadSize2": "middle",
    "earthLoadSize3": "big",
    "earthLoadChosen": "chosen",
    "earthLoadPick": "Chosen. Now tap a mule.",
    "earthLoadPickFirst": "This mule carries nothing yet. Tap a sack on the road first.",
    "earthLoadLoaded": "Loaded! {mule}: {n} of {total}.",
    "earthLoadHeavy": "Too heavy! This mule may carry only half.",
    "earthLoadTaken": "The top sack is down again.",
    "earthLoadStuck": "No sack fits any more. Tap a mule, and its top sack comes down again.",
    "earthLoadRoundDone": "Both mules carry the same!",
    "earthLoadHelp": "Help me",
    "earthLoadHelpPut": "Look: this sack fits on this mule.",
    "earthLoadHelpTake": "Tap the mule with the ring. Then its top sack comes down again.",
    "earthLoadDone": "And Naaman said, Shall there not then, I pray thee, be given to thy servant two mules’ burden of earth? (2 Kings 5:17)"
  },
  "es": {
    "handMillField": "El molino de mano visto desde arriba: en el centro las dos piedras, a la izquierda el saco de cebada, a la derecha el cuenco para la harina.",
    "handMillStone": "La piedra de arriba: pon el dedo encima y gírala en círculo. Molido: {n} de {total} vueltas.",
    "handMillSack": "El saco de cebada: tócalo para echar grano en el agujero de la piedra.",
    "handMillBowl": "El cuenco con la harina de {n} de las {total} vueltas",
    "handMillCount": "Molido: {n} de {total} vueltas",
    "handMillTurnButton": "Girar",
    "handMillFast": "¡Más despacio! Si no, los granos saltan del agujero.",
    "handMillEmptySoon": "El agujero está vacío. Toca el saco y entra grano nuevo.",
    "handMillEmpty": "Sin grano solo roza piedra con piedra. Toca primero el saco.",
    "handMillPoured": "Hay grano nuevo en el agujero.",
    "handMillEnough": "Todavía hay bastante grano en el agujero. Sigue girando.",
    "handMillRoundDone": "¡El cuenco está lleno de harina!",
    "handMillHelp": "Ayúdame",
    "handMillHelpRefill": "Mira: el agujero está vacío. Toca el saco.",
    "handMillHelpSlow": "Gira con más calma, en un círculo grande y lento.",
    "handMillHelpTurn": "Pon el dedo en la piedra y da vueltas en círculo. O toca «Girar».",
    "handMillDone": "Entonces él lo puso delante de ellos, y comieron, y sobróles, conforme á la palabra de Jehová. (2 Reyes 4:44)",
    "sealTurnField": "La mesa del rey de Siria con la carta. Mueve el dedo en círculo y el sello gira.",
    "sealTurnSeal": "El sello del rey con el león",
    "sealTurnSpot": "Cera {n} de {total} con la huella del sello",
    "sealTurnSpotDone": "Cera {n} de {total}: sellada",
    "sealTurnLeft": "Girar el sello a la izquierda",
    "sealTurnRight": "Girar el sello a la derecha",
    "sealTurnPress": "Sellar",
    "sealTurnCount": "Sellado: {n} de {total}",
    "sealTurnWrong": "Todavía no encaja. Sigue girando hasta que el león quede justo en la huella.",
    "sealTurnSealed": "¡Sellado! El sello encaja justo.",
    "sealTurnRoundDone": "¡La carta está sellada!",
    "sealTurnHelp": "Ayúdame",
    "sealTurnHelpLeft": "Gira el sello a la izquierda.",
    "sealTurnHelpRight": "Gira el sello a la derecha.",
    "sealTurnHelpPress": "El sello encaja. Toca «Sellar».",
    "sealTurnDone": "Y díjole el rey de Siria: Anda, ve, y yo enviaré letras al rey de Israel. (2 Reyes 5:5)",
    "earthLoadField": "Delante de la casa de Eliseo: dos mulos, y abajo en el camino los sacos de tierra.",
    "earthLoadMule1": "Mulo marrón",
    "earthLoadMule2": "Mulo gris",
    "earthLoadMule": "{mule}: lleva {n} de {total}. Tócalo para cargar el saco elegido o para bajar el saco de arriba.",
    "earthLoadLoad": "{mule}: {n} de {total}",
    "earthLoadSack": "Saco de tierra, {size}, tamaño {n}",
    "earthLoadSize1": "pequeño",
    "earthLoadSize2": "mediano",
    "earthLoadSize3": "grande",
    "earthLoadChosen": "elegido",
    "earthLoadPick": "Elegido. Ahora toca un mulo.",
    "earthLoadPickFirst": "Este mulo todavía no lleva nada. Toca primero un saco del camino.",
    "earthLoadLoaded": "¡Cargado! {mule}: {n} de {total}.",
    "earthLoadHeavy": "¡Demasiado pesado! Este mulo solo puede llevar la mitad.",
    "earthLoadTaken": "El saco de arriba está otra vez abajo.",
    "earthLoadStuck": "Ya no cabe ningún saco. Toca un mulo y su saco de arriba vuelve a bajar.",
    "earthLoadRoundDone": "¡Los dos mulos llevan lo mismo!",
    "earthLoadHelp": "Ayúdame",
    "earthLoadHelpPut": "Mira: este saco cabe en este mulo.",
    "earthLoadHelpTake": "Toca el mulo del anillo. Entonces su saco de arriba vuelve a bajar.",
    "earthLoadDone": "Entonces Naamán dijo: Ruégote pues, ¿no se dará á tu siervo una carga de un par de acémilas de aquesta tierra? (2 Reyes 5:17)"
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

const { elisa } = await import('@/data/adventures/elisa')
const task = (n: number) => elisa.stages[n - 1]!.task as unknown as Record<string, unknown>
const MILL = task(5).handMill as MillGame
const SEAL = task(7).sealTurn as SealGame
const EARTH = task(9).earthLoad as EarthGame

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
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found|Not translated|Cannot translate/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const pointer = (type: string, x: number, y: number, target: EventTarget = window) => {
  const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0 })
  target.dispatchEvent(e)
}
const keyOn = (el: Element, k: string, repeat = false) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, repeat }))

describe('the new words', () => {
  it('every key in German, English and Spanish, the verses in Luther 1912, KJV and Reina-Valera 1909', () => {
    expect(Object.keys(NEW_KEYS.de).length).toBeGreaterThan(40)
    expect(Object.keys(NEW_KEYS.en)).toEqual(Object.keys(NEW_KEYS.de))
    expect(Object.keys(NEW_KEYS.es)).toEqual(Object.keys(NEW_KEYS.de))
    for (const loc of ['de', 'en', 'es'] as const) for (const [k, v] of Object.entries(NEW_KEYS[loc])) expect(v.trim(), `${loc} ${k}`).not.toBe('')
    expect(NEW_KEYS.de.handMillDone).toContain('es blieb noch übrig nach dem Wort des HERRN')
    expect(NEW_KEYS.en.sealTurnDone).toContain('I will send a letter unto the king of Israel')
    expect(NEW_KEYS.es.earthLoadDone).toContain('una carga de un par de acémilas de aquesta tierra')
  })
})

// ================================================================== the hand mill
describe('Die Handmühle (GameHandmuehle)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHandmuehle, { props: { game: MILL }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const turnButton = (w: Wr) => w.findAll('button').find((b) => b.text() === 'Drehen')!
  const steps = async (w: Wr, n: number) => {
    for (let k = 0; k < n; k++) {
      await turnButton(w).trigger('click')
      await tick(300)
    }
  }

  it('shows the field, the stone as a big button, the sack, the bowl, the count; the goal is all turns', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(MILL.rounds.reduce((s, r) => s + r.turns, 0))
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain(MILL.rounds[0]!.hint)
    expect(w.find('.hm-field').attributes('aria-label')).toContain('Handmühle')
    expect(w.find('.hm-stone').element.tagName).toBe('BUTTON')
    expect(w.find('.hm-stone').attributes('aria-label')).toContain('Gemahlen: 0 von 4')
    expect(w.find('.hm-sack').attributes('aria-label')).toContain('Sack mit Gerste')
    expect(w.text()).toContain('Gemahlen: 0 von 4 Umdrehungen')
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(problems()).toEqual([])
  })

  it('round 1 by the button; round 2: the hole runs empty (words, then one mistake), the sack pours, too fast is one mistake; the end with the verse', async () => {
    const w = mountIt()
    await steps(w, 16)
    expect(w.text()).toContain('Gemahlen: 2 von 4 Umdrehungen')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.find('.hm-runner').attributes('style')).toContain('rotate(720deg)')
    // round 1 has grain enough: the sack says so
    await w.find('.hm-sack').trigger('click')
    expect(w.text()).toContain('noch genug Körner')
    await steps(w, 16)
    expect(w.text()).toContain('Die Schale ist voll Mehl!')
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    // the grain lasts 1.5 turns = 12 steps
    await steps(w, 12)
    expect(w.text()).toContain('Gemahlen: 1 von 6 Umdrehungen')
    await steps(w, 1)
    expect(w.text()).toContain('Das Loch ist leer.')
    await tick(3200)
    await steps(w, 2)
    expect(w.text()).toContain('Ohne Körner reibt nur Stein auf Stein.')
    expect(w.find('.hm-fb .gm.bad').exists()).toBe(true)
    expect(played).toContain('wrong')
    await steps(w, 3)
    await w.find('.hm-sack').trigger('click')
    expect(w.text()).toContain('Neue Körner sind im Loch.')
    // too fast with the finger: five moves of 60 degrees at once
    const stone = w.find('.hm-stone')
    stone.element.dispatchEvent(new MouseEvent('pointerdown', { clientX: 100, clientY: 0, bubbles: true, cancelable: true, button: 0 }))
    for (let k = 1; k <= 5; k++) pointer('pointermove', 100 * Math.cos((k * Math.PI) / 3), 100 * Math.sin((k * Math.PI) / 3))
    pointer('pointerup', 0, 0)
    await flushPromises()
    expect(w.text()).toContain('Langsamer!')
    await tick(2000)
    // grind on calmly: pour whenever the hole is empty
    for (let k = 0; k < 80 && !w.text().includes('voll Mehl'); k++) {
      if (w.text().includes('Das Loch ist leer') || w.text().includes('Ohne Körner')) {
        await w.find('.hm-sack').trigger('click')
        await tick(3300)
      }
      await steps(w, 1)
    }
    expect(w.text()).toContain('Die Schale ist voll Mehl!')
    await tick(2500)
    expect(w.text()).toContain('und es blieb noch übrig nach dem Wort des HERRN. (2. Könige 4,44)')
    expect(useTaskProgress().parts.value).toBe(10)
    await w.find('.gd button').trigger('click')
    const stars = (w.emitted('done') as number[][])[0]![0]!
    expect(stars).toBeGreaterThanOrEqual(2)
    expect(stars).toBeLessThanOrEqual(3)
    expect(problems()).toEqual([])
  })

  it('the arrow keys turn a step a press (a held key does not race); the help comes after fifteen seconds', async () => {
    const w = mountIt()
    keyOn(w.find('.hm-stone').element, 'ArrowRight')
    keyOn(w.find('.hm-stone').element, 'ArrowRight', true)
    await flushPromises()
    expect(w.find('.hm-runner').attributes('style')).toContain('rotate(45deg)')
    expect(w.text()).not.toContain('Hilf mir')
    await tick(16000)
    const help = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    await help.trigger('click')
    expect(w.text()).toContain('Leg den Finger auf den Mühlstein')
    expect(w.find('.hm-stone').classes()).toContain('hinted')
  })

  it('English and Spanish', () => {
    expect(mountIt('en').find('.hm-field').attributes('aria-label')).toContain('hand mill')
    expect(mountIt('es').text()).toContain('Girar')
    expect(problems()).toEqual([])
  })
})

// ================================================================== the seal
describe('Das Siegel (GameSiegel)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSiegel, { props: { game: SEAL }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const btn = (w: Wr, label: string) => w.findAll('button').find((b) => b.attributes('aria-label') === label || b.text() === label)!
  const angleOf = (w: Wr) => Number(/rotate\((-?[\d.]+)deg\)/.exec(w.find('.sg-seal').attributes('style') ?? '')?.[1])
  /** Turn with the buttons until the seal sits on `target`. */
  const turnTo = async (w: Wr, target: number) => {
    for (let k = 0; k < 80; k++) {
      const a = angleOf(w)
      const d = ((((target - a) % 360) + 540) % 360) - 180
      if (Math.abs(d) < 2.5) break
      await btn(w, d > 0 ? 'Siegel nach rechts drehen' : 'Siegel nach links drehen').trigger('click')
    }
  }

  it('shows the letter, the wax places, the seal at its start, the turn buttons and "Siegeln"', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.find('.sg-field').attributes('aria-label')).toContain('Brief')
    expect(w.findAll('.sg-imprint')).toHaveLength(2)
    expect(angleOf(w)).toBe(SEAL.rounds[0]!.spots[0]!.start)
    expect(btn(w, 'Siegel nach links drehen').element.tagName).toBe('BUTTON')
    expect(w.text()).toContain('Siegeln')
    expect(w.text()).toContain('Gesiegelt: 0 von 2')
    expect(problems()).toEqual([])
  })

  it('pressing off the imprint is one mistake; turning to it seals; both rounds to the end with the verse', async () => {
    const w = mountIt()
    await btn(w, 'Siegeln').trigger('click')
    expect(w.text()).toContain('Das passt noch nicht.')
    expect(w.find('.sg-fb .gm.bad').exists()).toBe(true)
    for (const [ri, r] of SEAL.rounds.entries()) {
      for (const s of r.spots) {
        await turnTo(w, s.angle)
        await btn(w, 'Siegeln').trigger('click')
        await tick(700)
      }
      expect(w.text()).toContain('Der Brief ist versiegelt!')
      await tick(ri < SEAL.rounds.length - 1 ? 3000 : 2500)
    }
    expect(w.text()).toContain('ich will dem König Israels einen Brief schreiben. (2. Könige 5,5)')
    expect(useTaskProgress().parts.value).toBe(5)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('the finger turns the seal around the wax; the arrow keys turn and Enter presses; the help shows the way', async () => {
    const w = mountIt()
    const field = w.find('.sg-field').element
    const start = angleOf(w)
    // jsdom has no layout: the wax lies at (0, 0); a quarter circle around it
    field.dispatchEvent(new MouseEvent('pointerdown', { clientX: 100, clientY: 0, bubbles: true, cancelable: true, button: 0 }))
    pointer('pointermove', 71, 71)
    pointer('pointermove', 0, 100)
    pointer('pointerup', 0, 100)
    await flushPromises()
    expect(angleOf(w)).toBeCloseTo((start + 90) % 360, 0)
    keyOn(field, 'ArrowLeft')
    await flushPromises()
    expect(angleOf(w)).toBeCloseTo((start + 85) % 360, 0)
    keyOn(field, 'Enter')
    await flushPromises()
    expect(w.text()).toContain('Das passt noch nicht.')
    await tick(16000)
    await btn(w, 'Hilf mir').trigger('click')
    expect(w.text()).toMatch(/Dreh das Siegel nach (links|rechts)\./)
    expect(w.findAll('.sg-turn.hinted')).toHaveLength(1)
  })

  it('English and Spanish', () => {
    expect(mountIt('en').text()).toContain('Seal')
    expect(mountIt('es').text()).toContain('Sellar')
    expect(problems()).toEqual([])
  })
})

// ================================================================== earth for Naaman
describe('Erde für Naaman (GameNaamanerde)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameNaamanerde, { props: { game: EARTH }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const sack = (w: Wr, i: number) => w.find(`.ne-sack[data-sack="${i}"]`)
  const mule = (w: Wr, m: number) => w.find(`.ne-mule[data-mule="${m}"]`)
  const put = async (w: Wr, i: number, m: number) => {
    await sack(w, i).trigger('click')
    await mule(w, m).trigger('click')
    await flushPromises()
  }

  it('shows the two mules and the sacks with their sizes; the goal is all sacks', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(EARTH.rounds.reduce((s, r) => s + r.sacks.length, 0))
    expect(w.findAll('.ne-mule')).toHaveLength(2)
    expect(w.findAll('.ne-sack')).toHaveLength(EARTH.rounds[0]!.sacks.length)
    expect(sack(w, 0).attributes('aria-label')).toBe(`Sack mit Erde, ${['klein', 'mittel', 'groß'][EARTH.rounds[0]!.sacks[0]! - 1]}, Größe ${EARTH.rounds[0]!.sacks[0]}`)
    expect(sack(w, 0).find('.ne-size').text()).toBe(String(EARTH.rounds[0]!.sacks[0]))
    expect(mule(w, 0).attributes('aria-label')).toContain('Braunes Maultier: trägt 0 von 6')
    expect(w.text()).toContain('Graues Maultier: 0 von 6')
    expect(problems()).toEqual([])
  })

  it('loading, too heavy (one mistake), taking the top sack down, both rounds to the end with the verse', async () => {
    expect(EARTH.rounds[0]!.sacks).toEqual([3, 1, 2, 2, 1, 3])
    expect(EARTH.rounds[1]!.sacks).toEqual([2, 3, 1, 2, 3, 2, 1])
    const w = mountIt()
    await put(w, 0, 0)
    expect(w.text()).toContain('Braunes Maultier: 3 von 6')
    expect(w.findAll('.ne-load')).toHaveLength(1)
    await put(w, 5, 0)
    await put(w, 2, 0)
    expect(w.text()).toContain('Zu schwer!')
    expect(w.find('.ne-fb .gm.bad').exists()).toBe(true)
    expect(sack(w, 2).exists()).toBe(true)
    // no sack chosen: a tap on the mule takes its top sack (the last one) down
    await sack(w, 2).trigger('click')
    await mule(w, 0).trigger('click')
    expect(w.text()).toContain('Der oberste Sack ist wieder unten.')
    expect(sack(w, 5).exists()).toBe(true)
    expect(w.text()).toContain('Braunes Maultier: 3 von 6')
    await put(w, 1, 0)
    await put(w, 2, 0)
    await put(w, 3, 1)
    await put(w, 4, 1)
    await put(w, 5, 1)
    expect(w.text()).toContain('Beide Maultiere tragen gleich viel!')
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    // a dead end: 2+3+1 and 2+3+1, the last 2 fits nowhere
    await put(w, 0, 0)
    await put(w, 1, 0)
    await put(w, 2, 0)
    await put(w, 3, 1)
    await put(w, 4, 1)
    await put(w, 6, 1)
    expect(w.text()).toContain('Kein Sack passt mehr.')
    await tick(16000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.text()).toContain('Tippe auf das Maultier mit dem Ring.')
    expect(w.findAll('.ne-mule.hinted')).toHaveLength(1)
    // undo: both small sacks come down; then 2+3+2 and 2+3+1+1
    await mule(w, 0).trigger('click')
    await mule(w, 1).trigger('click')
    expect(w.text()).toContain('Braunes Maultier: 5 von 7')
    await put(w, 5, 0)
    await put(w, 2, 1)
    await put(w, 6, 1)
    expect(w.text()).toContain('Beide Maultiere tragen gleich viel!')
    await tick(2500)
    expect(w.text()).toContain('dieser Erde Last, soviel zwei Maultiere tragen? (2. Könige 5,17)')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('a sack can be dragged onto a mule', async () => {
    const w = mountIt()
    const m1 = mule(w, 1).element
    vi.spyOn(w.find('.ne-field').element, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 360, top: 0, bottom: 270, width: 360, height: 270, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
    vi.spyOn(m1, 'getBoundingClientRect').mockReturnValue({ left: 200, right: 300, top: 50, bottom: 150, width: 100, height: 100, x: 200, y: 50, toJSON: () => ({}) } as DOMRect)
    sack(w, 0).element.dispatchEvent(new MouseEvent('pointerdown', { clientX: 20, clientY: 250, bubbles: true, cancelable: true, button: 0 }))
    pointer('pointermove', 120, 180)
    pointer('pointermove', 250, 100)
    pointer('pointerup', 250, 100)
    await flushPromises()
    expect(w.text()).toContain('Graues Maultier: 3 von 6')
    expect(sack(w, 0).exists()).toBe(false)
  })

  it('the help points at a sack and a mule; the arrow keys go from button to button', async () => {
    const w = mountIt()
    await tick(16000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.text()).toContain('Dieser Sack passt auf dieses Maultier.')
    expect(w.findAll('.ne-sack.hinted')).toHaveLength(1)
    expect(w.findAll('.ne-mule.hinted')).toHaveLength(1)
    ;(mule(w, 0).element as HTMLElement).focus()
    keyOn(mule(w, 0).element, 'ArrowRight')
    await flushPromises()
    expect(document.activeElement).toBe(mule(w, 1).element)
  })

  it('English and Spanish', () => {
    expect(mountIt('en').text()).toContain('Brown mule: 0 of 6')
    expect(mountIt('es').text()).toContain('Mulo gris: 0 de 6')
    expect(problems()).toEqual([])
  })
})
