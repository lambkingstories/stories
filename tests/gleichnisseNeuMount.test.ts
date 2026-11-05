/**
 * The five new games of "Geschichten von Jesus" (Anton's plan of 5.11.2026), each mounted with sample data and played through:
 * GameHundertfach (ears, rock, thorns, path, the order of the Bible, help, keys), GameAnhalten (holding the reins, too early, too far, help), GameHerberge (leaning, sliding, help),
 * GameHeimtragen (jumping, stumbling, help), GameHeimweg (in time, early, late, the other foot, help); the rounds, the goal of "Go on" (`useTaskProgress`), the end with the stars
 * and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/gleichnisse/INTEGRATION.json, written by tools/i18n_neu_gleichnisse.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameHundertfach from '@/components/molecules/games/GameHundertfach.vue'
import GameAnhalten from '@/components/molecules/games/GameAnhalten.vue'
import GameHerberge from '@/components/molecules/games/GameHerberge.vue'
import GameHeimtragen from '@/components/molecules/games/GameHeimtragen.vue'
import GameHeimweg from '@/components/molecules/games/GameHeimweg.vue'
import { carryProblems, haltProblems, homeProblems, innProblems, yieldProblems } from '@/utils/gleichnisseNeu'
import type { CarryGame, HaltGame, HomeGame, InnGame, YieldGame } from '@/utils/gleichnisseNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "yieldGameField": "Der gepflügte Acker am See. Darauf stehen Ähren und Saat, die nichts gebracht hat.",
    "yieldGameCount": "Körner im Sack: {n}. Ähren: {taken} von {total}",
    "yieldGameGrains": "{n} Körner!",
    "yieldGameTaken": "{thing}: {n} Körner sind im Sack",
    "yieldGameRock": "Auf dem Fels hatte das Korn keine Wurzeln. Die Sonne hat es verbrannt.",
    "yieldGameThorn": "Die Dornen haben das Korn erstickt.",
    "yieldGamePath": "Die Körner auf dem Weg haben die Vögel gefressen.",
    "yieldGameOrder": "Zuerst die Ähren, die {n} Körner bringen.",
    "yieldGameRoundDone": "Hundertfach, sechzigfach, dreißigfach: {n} Körner im Sack!",
    "yieldGameHelp": "Hilf mir",
    "yieldGameHelped": "Schau: Diese Ähre ist jetzt dran.",
    "yieldGameDone": "Das aber in das gute Land gesät ist, das ist, wenn jemand das Wort hört und versteht es und dann auch Frucht bringt; und etlicher trägt hundertfältig, etlicher aber sechzigfältig, etlicher dreißigfältig. (Matthäus 13,23)",
    "haltField": "Die Straße von Jerusalem nach Jericho. Links kommt der Samariter auf seinem Esel, rechts sitzt der Mann am Weg.",
    "haltHold": "Gedrückt halten: reiten",
    "haltRiding": "Er reitet …",
    "haltEarly": "Noch nicht ganz. Halte noch einmal kurz gedrückt.",
    "haltLate": "Zu weit! Der Samariter kehrt um und kommt zurück.",
    "haltAgain": "Versuch es noch einmal. Lass früher los.",
    "haltGood": "Genau da! Der Samariter steigt ab und hilft dem Mann.",
    "haltHelp": "Hilf mir",
    "haltHelping": "Schau zu: Er lässt rechtzeitig los.",
    "haltDone": "Ein Samariter aber reiste und kam dahin; und da er ihn sah, jammerte ihn sein, ging zu ihm, verband ihm seine Wunden und goß darein Öl und Wein. (Lukas 10,33–34)",
    "innField": "Der Weg zur Herberge. Der Samariter führt den Esel, darauf sitzt der verbundene Mann.",
    "innBack": "Nach hinten",
    "innForward": "Nach vorn",
    "innUpright": "Er sitzt gerade.",
    "innLeansForward": "Er neigt sich nach vorn.",
    "innLeansBack": "Er neigt sich nach hinten.",
    "innWarnForward": "Vorsicht, er kippt nach vorn! Halte links.",
    "innWarnBack": "Vorsicht, er kippt nach hinten! Halte rechts.",
    "innSlip": "Hoppla! Der Mann rutscht. Der Samariter hilft ihm wieder hinauf.",
    "innArrived": "Geschafft! Sie sind an der Herberge.",
    "innHelp": "Hilf mir",
    "innHelping": "Über die nächsten zwei Steine hält ihn der Samariter fest. Dann hilfst du wieder.",
    "innDone": "Und hob ihn auf sein Tier und führte ihn in die Herberge und pflegte sein. (Lukas 10,34)",
    "carryHomeField": "Die Weide am Abend. Der Hirte trägt das Schaf auf den Schultern nach Hause.",
    "carryHomeJump": "Springen",
    "carryHomeCount": "Hindernisse geschafft: {n} von {total}",
    "carryHomeHit": "Hoppla! Der Hirte stolpert. Das Schaf hält sich fest.",
    "carryHomeArrived": "Zu Hause! Die Freunde und Nachbarn freuen sich mit ihm.",
    "carryHomeHelp": "Hilf mir",
    "carryHomeHelping": "Über die nächsten zwei Hindernisse springt er von allein. Dann tippst du wieder.",
    "carryHomeDone": "Und wenn er’s gefunden hat, so legt er’s auf seine Achseln mit Freuden. Und wenn er heimkommt, ruft er seine Freunde und Nachbarn und spricht zu ihnen: Freuet euch mit mir; denn ich habe mein Schaf gefunden, das verloren war. (Lukas 15,5–6)",
    "homewardField": "Die lange Straße zum Haus des Vaters. Vorn geht der Sohn, vor ihm erscheinen die Fußspuren.",
    "homewardLeft": "Linke Fußspur",
    "homewardRight": "Rechte Fußspur",
    "homewardNext": "kommt jetzt",
    "homewardCount": "Schritte: {n} von {total}",
    "homewardEarly": "Zu früh! Warte, bis die Spur ganz da ist.",
    "homewardLate": "Zu spät! Tippe, sobald die Spur ganz da ist.",
    "homewardFoot": "Der andere Fuß! Tippe auf die Spur, die gerade kommt.",
    "homewardMissed": "Tippe immer dann, wenn eine Fußspur ganz klar ist.",
    "homewardRoundDone": "Das Haus des Vaters ist ganz nah!",
    "homewardHelp": "Hilf mir",
    "homewardHelping": "Schau: vier Schritte im Takt. Dann tippst du wieder.",
    "homewardDone": "Ich will mich aufmachen und zu meinem Vater gehen und zu ihm sagen: Vater, ich habe gesündigt gegen den Himmel und vor dir. (Lukas 15,18)"
  },
  "en": {
    "yieldGameField": "The plowed field by the lake. Ears of grain grow on it, and seed that brought nothing.",
    "yieldGameCount": "Grains in the sack: {n}. Ears: {taken} of {total}",
    "yieldGameGrains": "{n} grains!",
    "yieldGameTaken": "{thing}: {n} grains are in the sack",
    "yieldGameRock": "On the rock the seed had no roots. The sun scorched it.",
    "yieldGameThorn": "The thorns choked the seed.",
    "yieldGamePath": "The birds ate the seeds by the road.",
    "yieldGameOrder": "First the ears that bring {n} grains.",
    "yieldGameRoundDone": "A hundredfold, sixtyfold, thirtyfold: {n} grains in the sack!",
    "yieldGameHelp": "Help me",
    "yieldGameHelped": "Look: this ear is next.",
    "yieldGameDone": "But he that received seed into the good ground is he that heareth the word, and understandeth it; which also beareth fruit, and bringeth forth, some an hundredfold, some sixty, some thirty. (Matthew 13:23)",
    "haltField": "The road from Jerusalem to Jericho. The Samaritan comes on his donkey from the left; the man sits by the road on the right.",
    "haltHold": "Hold down: ride",
    "haltRiding": "He rides …",
    "haltEarly": "Not quite there. Hold down again for a moment.",
    "haltLate": "Too far! The Samaritan turns round and comes back.",
    "haltAgain": "Try again. Let go earlier.",
    "haltGood": "Right there! The Samaritan gets down and helps the man.",
    "haltHelp": "Help me",
    "haltHelping": "Watch: he lets go in time.",
    "haltDone": "But a certain Samaritan, as he journeyed, came where he was: and when he saw him, he had compassion on him, and went to him, and bound up his wounds, pouring in oil and wine. (Luke 10:33–34)",
    "innField": "The road to the inn. The Samaritan leads the donkey; the bandaged man sits on it.",
    "innBack": "Back",
    "innForward": "Forward",
    "innUpright": "He sits upright.",
    "innLeansForward": "He leans forward.",
    "innLeansBack": "He leans back.",
    "innWarnForward": "Careful, he tips forward! Hold the left side.",
    "innWarnBack": "Careful, he tips back! Hold the right side.",
    "innSlip": "Oops! The man slides. The Samaritan helps him back up.",
    "innArrived": "Well done! They are at the inn.",
    "innHelp": "Help me",
    "innHelping": "The Samaritan holds him over the next two stones. Then you help again.",
    "innDone": "And set him on his own beast, and brought him to an inn, and took care of him. (Luke 10:34)",
    "carryHomeField": "The pasture in the evening. The shepherd carries the sheep home on his shoulders.",
    "carryHomeJump": "Jump",
    "carryHomeCount": "Obstacles passed: {n} of {total}",
    "carryHomeHit": "Oops! The shepherd stumbles. The sheep holds on tight.",
    "carryHomeArrived": "Home! His friends and neighbours rejoice with him.",
    "carryHomeHelp": "Help me",
    "carryHomeHelping": "He jumps over the next two obstacles by himself. Then you tap again.",
    "carryHomeDone": "And when he hath found it, he layeth it on his shoulders, rejoicing. And when he cometh home, he calleth together his friends and neighbours, saying unto them, Rejoice with me; for I have found my sheep which was lost. (Luke 15:5–6)",
    "homewardField": "The long road to the father’s house. The son walks in front; the footprints appear ahead of him.",
    "homewardLeft": "Left footprint",
    "homewardRight": "Right footprint",
    "homewardNext": "coming now",
    "homewardCount": "Steps: {n} of {total}",
    "homewardEarly": "Too early! Wait until the print is fully there.",
    "homewardLate": "Too late! Tap as soon as the print is fully there.",
    "homewardFoot": "The other foot! Tap the print that is coming now.",
    "homewardMissed": "Tap each time a footprint is quite clear.",
    "homewardRoundDone": "The father’s house is very near!",
    "homewardHelp": "Help me",
    "homewardHelping": "Look: four steps in time. Then you tap again.",
    "homewardDone": "I will arise and go to my father, and will say unto him, Father, I have sinned against heaven, and before thee. (Luke 15:18)"
  },
  "es": {
    "yieldGameField": "El campo arado junto al lago. En él hay espigas y semilla que no dio nada.",
    "yieldGameCount": "Granos en el saco: {n}. Espigas: {taken} de {total}",
    "yieldGameGrains": "¡{n} granos!",
    "yieldGameTaken": "{thing}: {n} granos están en el saco",
    "yieldGameRock": "En la roca la semilla no tenía raíz. El sol la quemó.",
    "yieldGameThorn": "Los espinos ahogaron la semilla.",
    "yieldGamePath": "Las aves se comieron las semillas del camino.",
    "yieldGameOrder": "Primero las espigas que dan {n} granos.",
    "yieldGameRoundDone": "A ciento, a sesenta, a treinta: ¡{n} granos en el saco!",
    "yieldGameHelp": "Ayúdame",
    "yieldGameHelped": "Mira: ahora toca esta espiga.",
    "yieldGameDone": "Mas el que fué sembrado en buena tierra, éste es el que oye y entiende la palabra, y el que lleva fruto: y lleva uno á ciento, y otro á sesenta, y otro á treinta. (Mateo 13:23)",
    "haltField": "El camino de Jerusalén a Jericó. Por la izquierda viene el samaritano en su asno; a la derecha está sentado el hombre junto al camino.",
    "haltHold": "Mantén pulsado: cabalgar",
    "haltRiding": "Cabalga …",
    "haltEarly": "Todavía no. Mantén pulsado otra vez un momento.",
    "haltLate": "¡Demasiado lejos! El samaritano da la vuelta y regresa.",
    "haltAgain": "Inténtalo otra vez. Suelta antes.",
    "haltGood": "¡Justo ahí! El samaritano se baja y ayuda al hombre.",
    "haltHelp": "Ayúdame",
    "haltHelping": "Mira: suelta a tiempo.",
    "haltDone": "Mas un Samaritano que transitaba, viniendo cerca de él, y viéndole, fué movido á misericordia; y llegándose, vendó sus heridas, echándoles aceite y vino. (Lucas 10:33–34)",
    "innField": "El camino al mesón. El samaritano guía el asno; en él va sentado el hombre vendado.",
    "innBack": "Atrás",
    "innForward": "Adelante",
    "innUpright": "Va derecho.",
    "innLeansForward": "Se inclina hacia delante.",
    "innLeansBack": "Se inclina hacia atrás.",
    "innWarnForward": "¡Cuidado, se cae hacia delante! Mantén la izquierda.",
    "innWarnBack": "¡Cuidado, se cae hacia atrás! Mantén la derecha.",
    "innSlip": "¡Uy! El hombre resbala. El samaritano lo vuelve a subir.",
    "innArrived": "¡Lo lograste! Han llegado al mesón.",
    "innHelp": "Ayúdame",
    "innHelping": "El samaritano lo sujeta en las dos piedras siguientes. Luego ayudas tú otra vez.",
    "innDone": "Y poniéndole sobre su cabalgadura, llevóle al mesón, y cuidó de él. (Lucas 10:34)",
    "carryHomeField": "El pasto al atardecer. El pastor lleva la oveja a casa sobre los hombros.",
    "carryHomeJump": "Saltar",
    "carryHomeCount": "Obstáculos superados: {n} de {total}",
    "carryHomeHit": "¡Uy! El pastor tropieza. La oveja se agarra fuerte.",
    "carryHomeArrived": "¡En casa! Los amigos y vecinos se alegran con él.",
    "carryHomeHelp": "Ayúdame",
    "carryHomeHelping": "Salta solo los dos obstáculos siguientes. Luego tocas tú otra vez.",
    "carryHomeDone": "Y hallada, la pone sobre sus hombros gozoso; y viniendo á casa, junta á los amigos y á los vecinos, diciéndoles: Dadme el parabién, porque he hallado mi oveja que se había perdido. (Lucas 15:5–6)",
    "homewardField": "El largo camino a la casa del padre. Delante va el hijo; ante él aparecen las huellas.",
    "homewardLeft": "Huella izquierda",
    "homewardRight": "Huella derecha",
    "homewardNext": "viene ahora",
    "homewardCount": "Pasos: {n} de {total}",
    "homewardEarly": "¡Demasiado pronto! Espera a que la huella se vea entera.",
    "homewardLate": "¡Demasiado tarde! Toca en cuanto la huella se vea entera.",
    "homewardFoot": "¡El otro pie! Toca la huella que viene ahora.",
    "homewardMissed": "Toca cada vez que una huella se vea clara.",
    "homewardRoundDone": "¡La casa del padre está muy cerca!",
    "homewardHelp": "Ayúdame",
    "homewardHelping": "Mira: cuatro pasos al compás. Luego tocas tú otra vez.",
    "homewardDone": "Me levantaré, é iré á mi padre, y le diré: Padre, he pecado contra el cielo y contra ti. (Lucas 15:18)"
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
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointerup', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
const key = (el: Element, type: 'keydown' | 'keyup', k: string) => el.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }))
const until = async (cond: () => boolean, maxSeconds = 30) => {
  for (let i = 0; i < maxSeconds * 10 && !cond(); i++) await tick(100)
  return cond()
}
const S = (image: string, w = 15) => ({ image: `x/${image}.webp`, label: image, w })
/** Sees whether the end page (stars and the words of the Bible) is there. */
const done = (w: { text: () => string }, verse: RegExp) => verse.test(w.text())

// ---------------------------------------------------------------- 1. a hundredfold
const YIELD: YieldGame = {
  field: 'x/acker.webp',
  sprites: { y30: S('Drei Ähren'), y60: S('Sechs Ähren'), y100: S('Viele Ähren'), rock: S('Fels'), thorn: S('Dornen'), path: S('Weg mit Vogel') },
  grain: S('korn', 9),
  sack: { ...S('Sack', 14), x: 90, y: 99 },
  rounds: [
    {
      hint: 'Tippe die reifen Ähren an.',
      plants: [
        { kind: 'y30', x: 12, y: 55 },
        { kind: 'rock', x: 34, y: 55 },
        { kind: 'y60', x: 56, y: 55 },
        { kind: 'y100', x: 78, y: 55 },
        { kind: 'thorn', x: 46, y: 77 },
        { kind: 'path', x: 12, y: 99 }
      ]
    },
    {
      hint: 'Erst hundert, dann sechzig, dann dreißig.',
      ordered: true,
      plants: [
        { kind: 'y60', x: 9, y: 54 },
        { kind: 'y30', x: 27, y: 54 },
        { kind: 'rock', x: 45, y: 54 },
        { kind: 'y100', x: 63, y: 54 },
        { kind: 'thorn', x: 36, y: 76 },
        { kind: 'y100', x: 18, y: 76 },
        { kind: 'path', x: 72, y: 76 }
      ]
    }
  ]
}

describe('Hundertfach (GameHundertfach)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHundertfach, { props: { game: YIELD }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const plant = (w: Wr, i: number) => w.findAll('.gm-plant')[i]!

  it('the sample data are in order; the field, the sack, six plants as buttons; the goal is every ear of both rounds', () => {
    expect(yieldProblems(YIELD)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Tippe die reifen Ähren an.')
    expect(w.findAll('.gm-plant')).toHaveLength(6)
    expect(plant(w, 1).attributes('aria-label')).toBe('Fels')
    expect(plant(w, 0).element.tagName).toBe('BUTTON')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Acker')
    expect(w.text()).toContain('Körner im Sack: 0. Ähren: 0 von 3')
    expect(problems()).toEqual([])
  })

  it('the rock, the thorns and the path: a cross, the word of the story, one mistake each (once per plant)', async () => {
    const w = mountIt()
    await plant(w, 1).trigger('click')
    expect(w.text()).toContain('Auf dem Fels hatte das Korn keine Wurzeln')
    expect(plant(w, 1).find('.gm-mark').exists()).toBe(true)
    await plant(w, 4).trigger('click')
    expect(w.text()).toContain('Die Dornen haben das Korn erstickt.')
    await plant(w, 5).trigger('click')
    expect(w.text()).toContain('Die Körner auf dem Weg haben die Vögel gefressen.')
    await plant(w, 5).trigger('click')
    expect(count('wrong')).toBe(4)
    // the ears: grains fly into the sack
    await plant(w, 0).trigger('click')
    expect(w.text()).toContain('30 Körner!')
    await tick(800)
    expect(w.text()).toContain('Körner im Sack: 30. Ähren: 1 von 3')
    expect(plant(w, 0).attributes('aria-label')).toContain('30 Körner sind im Sack')
    expect(count('sack')).toBe(1)
    await plant(w, 2).trigger('click')
    await plant(w, 3).trigger('click')
    await tick(1200)
    expect(w.text()).toContain('Hundertfach, sechzigfach, dreißigfach: 190 Körner im Sack!')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    // round 2: the order of the Bible
    await plant(w, 0).trigger('click')
    expect(w.text()).toContain('Zuerst die Ähren, die 100 Körner bringen.')
    for (const i of [3, 5]) await plant(w, i).trigger('click')
    await plant(w, 1).trigger('click')
    expect(w.text()).toContain('Zuerst die Ähren, die 60 Körner bringen.')
    await plant(w, 0).trigger('click')
    await plant(w, 1).trigger('click')
    expect(await until(() => done(w, /hundertfältig, etlicher aber sechzigfältig/), 6)).toBe(true)
    // mistakes: rock, thorn, path (once), the order twice = 5 -> two stars
    expect(w.findAll('.gs-star, [class*="star"]').length).toBeGreaterThan(0)
    expect(w.emitted('done')).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('"Help me" after fifteen seconds shows the next ear; the arrow keys go from plant to plant', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(16000)
    const help = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    await help.trigger('click')
    expect(plant(w, 0).classes()).toContain('hinted')
    expect(w.text()).toContain('Schau: Diese Ähre ist jetzt dran.')
    key(plant(w, 0).element, 'keydown', 'ArrowRight')
    await flushPromises()
    expect(document.activeElement).toBe(plant(w, 1).element)
    expect(plant(w, 1).attributes('tabindex')).toBe('0')
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Grains in the sack: 0. Ears: 0 of 3')
    const es = mountIt('es')
    expect(es.text()).toContain('Granos en el saco: 0')
  })
})

// ---------------------------------------------------------------- 2. stop!
const HALT: HaltGame = {
  background: 'x/strasse.webp',
  road: 84,
  rider: S('Samariter auf dem Esel', 32),
  man: S('Der Mann', 24),
  donkey: S('Esel', 26),
  kneel: S('kniet', 24),
  rounds: [
    { hint: 'Halte gedrückt.', start: 17, man: 72, spot: 50, tolerance: 5, speed: 14, accel: 30, brake: 22 },
    { hint: 'Jetzt schneller.', start: 17, man: 64, spot: 41, tolerance: 3, speed: 20, accel: 36, brake: 16 }
  ]
}

describe('Anhalten (GameAnhalten)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameAnhalten, { props: { game: HALT }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const riderX = (w: Wr) => parseFloat((w.find('.gm-rider').element as HTMLElement).style.left)

  it('the sample data are in order; the rider at the start, the man, the reins', () => {
    expect(haltProblems(HALT)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(riderX(w)).toBe(17)
    expect(w.find('.gm-reins').text()).toBe('Gedrückt halten: reiten')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(problems()).toEqual([])
  })

  it('holding rides, letting go stops: too early may go on, too far is a mistake and he comes back; at the spot he kneels by the man', async () => {
    const w = mountIt()
    pointer(w.find('.gm-reins').element, 'pointerdown')
    await tick(1000)
    expect(riderX(w)).toBeGreaterThan(25)
    expect(w.find('.gm-reins').text()).toBe('Er reitet …')
    pointer(window, 'pointerup')
    expect(await until(() => w.text().includes('Noch nicht ganz'), 3)).toBe(true)
    const x = riderX(w)
    expect(x).toBeLessThan(45)
    // now too far: hold for a long time
    pointer(w.find('.gm-field').element, 'pointerdown')
    await tick(3000)
    pointer(window, 'pointerup')
    expect(await until(() => w.text().includes('Zu weit!'), 3)).toBe(true)
    expect(count('wrong')).toBe(1)
    expect(await until(() => w.text().includes('Lass früher los'), 6)).toBe(true)
    expect(riderX(w)).toBeCloseTo(32, 0)
    // the keys: hold Space until the right moment
    const f = w.find('.gm-field').element
    key(f, 'keydown', ' ')
    expect(await until(() => riderX(w) >= 50 - 5 - 4.4 + 2 - 0.5, 4)).toBe(true)
    key(f, 'keyup', ' ')
    expect(await until(() => w.text().includes('Genau da!'), 3)).toBe(true)
    expect(w.findAll('.gm-fig').some((e) => e.attributes('aria-label') === 'kniet')).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(await until(() => w.text().includes('Runde 2 von 2'), 4)).toBe(true)
    // round 2: the help rides to the spot
    await tick(16000)
    const help = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    await help.trigger('click')
    expect(await until(() => done(w, /jammerte ihn sein/), 20)).toBe(true)
    expect(problems()).toEqual([])
  })

  it('English words', () => {
    const w = mountIt('en')
    expect(w.find('.gm-reins').text()).toBe('Hold down: ride')
  })
})

// ---------------------------------------------------------------- 3. to the inn
const INN: InnGame = {
  background: 'x/weg.webp',
  road: 86,
  start: 14,
  gate: 67,
  donkey: S('Esel', 22),
  rider: S('Der Mann', 13),
  seat: { x: 48, y: 62 },
  leader: S('Samariter', 17),
  lead: 2,
  stones: [S('Stein', 5), S('Steinplatte', 8)],
  rounds: [
    { hint: 'Halte ihn gerade.', speed: 5, drift: 1.2, bumps: [{ x: 34, push: 40, stone: 0 }, { x: 46, push: -35, stone: 1 }, { x: 58, push: 45, stone: 0 }, { x: 70, push: -40, stone: 1 }] },
    { hint: 'Mehr Steine.', speed: 6, drift: 2.4, bumps: [{ x: 26, push: 45, stone: 0 }, { x: 34, push: -50, stone: 1 }, { x: 42, push: 40, stone: 0 }, { x: 50, push: -45, stone: 0 }, { x: 58, push: 55, stone: 1 }] }
  ]
}

describe('Zur Herberge (GameHerberge)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHerberge, { props: { game: INN }, ...opts(locale) })

  it('the sample data are in order; the caravan, the stones, the two buttons', () => {
    expect(innProblems(INN)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.findAll('.gm-stone')).toHaveLength(4)
    expect(w.findAll('.gm-side').map((b) => b.text())).toEqual(['Nach hinten', 'Nach vorn'])
    expect(w.text()).toContain('Er sitzt gerade.')
    expect(problems()).toEqual([])
  })

  it('without help the man slides (a mistake); the buttons and keys turn him; the help brings him to the inn; the end', async () => {
    const w = mountIt()
    // holding "forward" for a long time throws him forward
    pointer(w.findAll('.gm-side')[1]!.element, 'pointerdown')
    expect(await until(() => w.text().includes('Hoppla! Der Mann rutscht.'), 4)).toBe(true)
    pointer(window, 'pointerup')
    expect(count('wrong')).toBeGreaterThanOrEqual(1)
    const tilt = () => (w.find('.gm-tilt').element as HTMLElement).style.transform
    await tick(1500)
    key(w.find('.gm-field').element, 'keydown', 'ArrowLeft')
    await tick(400)
    expect(tilt()).toMatch(/rotate\(-/)
    key(w.find('.gm-field').element, 'keyup', 'ArrowLeft')
    // the help
    expect(await until(() => w.findAll('button').some((b) => b.text() === 'Hilf mir'), 25)).toBe(true)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.text()).toContain('Über die nächsten zwei Steine')
    expect(await until(() => w.text().includes('Geschafft! Sie sind an der Herberge.') || w.text().includes('Runde 2'), 30)).toBe(true)
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    // round 2: the help again (after fifteen seconds)
    for (let i = 0; i < 3 && !done(w, /führte ihn in die Herberge/); i++) {
      if (await until(() => w.findAll('button').some((b) => b.text() === 'Hilf mir'), 20)) await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
      await until(() => done(w, /führte ihn in die Herberge/), 15)
    }
    expect(done(w, /führte ihn in die Herberge/)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(6)
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- 4. carry it home
const CARRY: CarryGame = {
  background: 'x/weide.webp',
  road: 86,
  hero: S('Hirte mit Schaf', 20),
  heroAt: 26,
  jump: 1.1,
  height: 26,
  sprites: { rock: 'x/fels.webp', brook: 'x/bach.webp', thorn: 'x/dorn.webp' },
  labels: { rock: 'Felsbrocken', brook: 'Bach', thorn: 'Dornbusch' },
  sink: { brook: 4 },
  home: S('Haus', 30),
  rounds: [
    { hint: 'Tippe zum Springen.', speed: 18, home: 300, obstacles: [{ kind: 'rock', at: 95, w: 8 }, { kind: 'brook', at: 135, w: 9 }, { kind: 'rock', at: 175, w: 8 }] },
    { hint: 'Schneller.', speed: 22, home: 330, obstacles: [{ kind: 'rock', at: 95, w: 8 }, { kind: 'brook', at: 140, w: 12 }, { kind: 'thorn', at: 186, w: 9 }, { kind: 'rock', at: 230, w: 8 }] }
  ]
}

describe('Heimtragen (GameHeimtragen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHeimtragen, { props: { game: CARRY }, ...opts(locale) })

  it('the sample data are in order; the pasture repeats, the shepherd, the jump button', () => {
    expect(carryProblems(CARRY)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.findAll('.gm-tile')).toHaveLength(2)
    expect(w.find('.gm-tile.mirror').exists()).toBe(true)
    expect(w.find('.gm-jump').text()).toBe('Springen')
    expect(w.text()).toContain('Hindernisse geschafft: 0 von 3')
    expect(problems()).toEqual([])
  })

  it('Space, Enter and the up arrow key jump; the jump button too', async () => {
    const w = mountIt()
    const top = () => parseFloat((w.find('.gm-hero').element as HTMLElement).style.top)
    await tick(200)
    key(w.find('.gm-field').element, 'keydown', ' ')
    await tick(300)
    expect(top()).toBeLessThan(86)
    await tick(1000)
    expect(top()).toBe(86)
    key(w.find('.gm-jump').element, 'keydown', 'ArrowUp')
    await tick(300)
    expect(top()).toBeLessThan(86)
    await tick(1000)
    pointer(w.find('.gm-jump').element, 'pointerdown')
    await tick(300)
    expect(top()).toBeLessThan(86)
    expect(count('wrong')).toBe(0)
  })

  it('without a jump he stumbles (a mistake); a tap makes him jump; the help jumps; at home the end', async () => {
    const w = mountIt()
    expect(await until(() => w.text().includes('Hoppla! Der Hirte stolpert.'), 8)).toBe(true)
    expect(count('wrong')).toBe(1)
    await tick(1000)
    pointer(w.find('.gm-field').element, 'pointerdown')
    await tick(300)
    expect(parseFloat((w.find('.gm-hero').element as HTMLElement).style.top)).toBeLessThan(86)
    for (let i = 0; i < 4 && !done(w, /mein Schaf gefunden, das verloren war/); i++) {
      if (await until(() => w.findAll('button').some((b) => b.text() === 'Hilf mir'), 20)) {
        await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
        expect(w.text()).toContain('springt er von allein')
      }
      await until(() => done(w, /mein Schaf gefunden, das verloren war/), 12)
    }
    expect(done(w, /mein Schaf gefunden, das verloren war/)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(9)
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- 5. the way home
const HOME: HomeGame = {
  background: 'x/strasse.webp',
  ratio: 0.75,
  house: { x: 50, y: 28 },
  zoom: 2.2,
  son: { ...S('Der Sohn', 30), x: 50, y: 99 },
  print: S('Fußspur', 18),
  left: { x: 38, y: 72 },
  right: { x: 62, y: 72 },
  rounds: [
    { hint: 'Tippe im Takt.', beat: 900, window: 260, steps: 6 },
    { hint: 'Die richtige Spur.', beat: 720, window: 200, steps: 6, feet: true }
  ]
}

describe('Heimweg (GameHeimweg)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHeimweg, { props: { game: HOME }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const scale = (w: Wr) => (w.find('.gm-world').element as HTMLElement).style.transform

  it('the sample data are in order; the road, two prints, the son', () => {
    expect(homeProblems(HOME)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.findAll('.gm-print')).toHaveLength(2)
    expect(w.findAll('.gm-print')[0]!.attributes('aria-label')).toBe('Linke Fußspur (kommt jetzt)')
    expect(w.text()).toContain('Schritte: 0 von 6')
    expect(scale(w)).toBe('scale(1)')
    expect(problems()).toEqual([])
  })

  it('taps in time are steps, the picture grows; early, late and the other foot are mistakes; round 2 asks for the foot; the end', async () => {
    const w = mountIt()
    const f = w.find('.gm-field').element
    let now = 0
    const at = async (ms: number) => {
      await tick(ms - now)
      now = ms
    }
    await at(900)
    key(f, 'keydown', 'Enter')
    await flushPromises()
    expect(w.text()).toContain('Schritte: 1 von 6')
    expect(scale(w)).not.toBe('scale(1)')
    await at(1400) // beat 2 is 500 ms away: too early
    key(f, 'keydown', 'Enter')
    await flushPromises()
    expect(w.text()).toContain('Zu früh!')
    expect(count('wrong')).toBe(1)
    // beat 2 was used by the stumble; beats 3 to 7 in time (one of them a tap on the print)
    for (let b = 3; b <= 7; b++) {
      await at(b * 900 + 40)
      if (b === 4) pointer(w.findAll('.gm-print')[1]!.element, 'pointerdown')
      else key(f, 'keydown', ' ')
      await flushPromises()
    }
    expect(w.text()).toContain('Das Haus des Vaters ist ganz nah!')
    expect(scale(w)).toBe('scale(2.2)')
    await at(7 * 900 + 40 + 3000)
    expect(w.text()).toContain('Runde 2 von 2')
    const start2 = now
    await at(start2 + 720)
    key(f, 'keydown', 'ArrowRight')
    await flushPromises()
    expect(w.text()).toContain('Der andere Fuß!')
    for (let b = 2; b <= 7; b++) {
      await at(start2 + b * 720)
      key(f, 'keydown', b % 2 === 0 ? 'ArrowLeft' : 'ArrowRight')
      await flushPromises()
    }
    expect(await until(() => done(w, /Ich will mich aufmachen und zu meinem Vater gehen/), 4)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(12)
    expect(count('wrong')).toBe(2)
    expect(problems()).toEqual([])
  })

  it('a missed beat is no mistake; "Help me" after fifteen seconds walks four steps in time', async () => {
    const w = mountIt()
    await tick(4000)
    expect(w.text()).toContain('Tippe immer dann, wenn eine Fußspur ganz klar ist.')
    expect(count('wrong')).toBe(0)
    await tick(12000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    await tick(4 * 900 + 200)
    expect(w.text()).toContain('Schritte: 4 von 6')
    expect(count('wrong')).toBe(0)
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').text()).toContain('Steps: 0 of 6')
    expect(mountIt('es').text()).toContain('Pasos: 0 de 6')
  })
})
