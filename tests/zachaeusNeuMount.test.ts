/**
 * The new game of "Zachäus und Lazarus" (Anton's plan of 5.11.2026), mounted with sample data and played through: GameBachsteine (stepping stones, John 11,3):
 * laying, the whirl (a cross, one mistake, not twice for the same whirl at once), a stone too far, taking a stone back, no stones left, the help after fifteen seconds,
 * the arrow keys, the walk across, the rounds, the goal of "Go on" (`useTaskProgress`), the end with the stars and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/zachaeus/INTEGRATION.json, written by
 * D:/Claude/Abenteuer-Zachaeus/tools/integration_bachsteine.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameBachsteine from '@/components/molecules/games/GameBachsteine.vue'
import { stepStonesProblems } from '@/utils/zachaeusNeu'
import type { StonesGame, StonesRound } from '@/utils/zachaeusNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "stepStonesField": "Der Bach. Unten am Ufer steht der Bote, oben geht der Weg zu Jesus weiter. Im Wasser liegen ruhige Stellen und Strudel.",
    "stepStonesSpot": "Ruhige Stelle {n}: einen Stein hineinlegen",
    "stepStonesSpotStone": "Stein auf Stelle {n}: antippen nimmt ihn zurück",
    "stepStonesSpotWhirl": "Strudel {n}: hier bleibt kein Stein liegen",
    "stepStonesMessenger": "Der Bote",
    "stepStonesCount": "Steine übrig: {n}",
    "stepStonesLinked": "Der Bote steigt auf den Stein.",
    "stepStonesLoose": "Der Stein liegt, aber so weit kann der Bote nicht steigen. Lege einen Stein dazwischen.",
    "stepStonesWhirl": "Der Strudel nimmt den Stein mit! Lege ihn auf eine ruhige Stelle.",
    "stepStonesNone": "Du hast keinen Stein mehr. Tippe auf einen gelegten Stein, dann nimmst du ihn zurück.",
    "stepStonesLifted": "Du hast den Stein wieder.",
    "stepStonesWalking": "Der Bote geht über die Steine …",
    "stepStonesArrived": "Geschafft! Der Bote ist trocken drüben und läuft weiter zu Jesus.",
    "stepStonesHelp": "Hilf mir",
    "stepStonesHelpPlace": "Schau: Auf diese ruhige Stelle passt ein Stein.",
    "stepStonesHelpLift": "Dieser Stein hilft dem Boten nicht. Nimm ihn zurück.",
    "stepStonesKeys": "Mit den Pfeiltasten gehst du von Stelle zu Stelle, mit Enter legst du einen Stein hin oder nimmst ihn zurück.",
    "stepStonesDone": "Da sandten seine Schwestern zu ihm und ließen ihm sagen: HERR, siehe, den du liebhast, der liegt krank. (Johannes 11,3)"
  },
  "en": {
    "stepStonesField": "The brook. The messenger stands on the near bank; on the far bank the path goes on to Jesus. In the water there are calm places and whirls.",
    "stepStonesSpot": "Calm place {n}: lay a stone here",
    "stepStonesSpotStone": "Stone on place {n}: tap to take it back",
    "stepStonesSpotWhirl": "Whirl {n}: no stone stays here",
    "stepStonesMessenger": "The messenger",
    "stepStonesCount": "Stones left: {n}",
    "stepStonesLinked": "The messenger steps onto the stone.",
    "stepStonesLoose": "The stone is there, but the messenger cannot step that far. Lay a stone in between.",
    "stepStonesWhirl": "The whirl carries the stone away! Lay it on a calm place.",
    "stepStonesNone": "You have no stones left. Tap a stone in the water to take it back.",
    "stepStonesLifted": "You have the stone back.",
    "stepStonesWalking": "The messenger walks over the stones …",
    "stepStonesArrived": "Well done! The messenger is across and dry, and he runs on to Jesus.",
    "stepStonesHelp": "Help me",
    "stepStonesHelpPlace": "Look: a stone fits on this calm place.",
    "stepStonesHelpLift": "This stone does not help the messenger. Take it back.",
    "stepStonesKeys": "Use the arrow keys to go from place to place, and Enter to lay a stone or take it back.",
    "stepStonesDone": "Therefore his sisters sent unto him, saying, Lord, behold, he whom thou lovest is sick. (John 11:3)"
  },
  "es": {
    "stepStonesField": "El arroyo. El mensajero está en la orilla de abajo; en la otra orilla el camino sigue hacia Jesús. En el agua hay lugares tranquilos y remolinos.",
    "stepStonesSpot": "Lugar tranquilo {n}: pon aquí una piedra",
    "stepStonesSpotStone": "Piedra en el lugar {n}: tócala para recogerla",
    "stepStonesSpotWhirl": "Remolino {n}: aquí no se queda ninguna piedra",
    "stepStonesMessenger": "El mensajero",
    "stepStonesCount": "Piedras que quedan: {n}",
    "stepStonesLinked": "El mensajero sube a la piedra.",
    "stepStonesLoose": "La piedra está puesta, pero el mensajero no llega tan lejos. Pon una piedra en medio.",
    "stepStonesWhirl": "¡El remolino se lleva la piedra! Ponla en un lugar tranquilo.",
    "stepStonesNone": "Ya no tienes piedras. Toca una piedra del agua para recogerla.",
    "stepStonesLifted": "Ya tienes otra vez la piedra.",
    "stepStonesWalking": "El mensajero pasa por las piedras …",
    "stepStonesArrived": "¡Lo lograste! El mensajero ha cruzado sin mojarse y sigue corriendo hacia Jesús.",
    "stepStonesHelp": "Ayúdame",
    "stepStonesHelpPlace": "Mira: en este lugar tranquilo cabe una piedra.",
    "stepStonesHelpLift": "Esta piedra no ayuda al mensajero. Recógela.",
    "stepStonesKeys": "Con las flechas vas de un lugar a otro; con Enter pones o recoges una piedra.",
    "stepStonesDone": "Enviaron, pues, sus hermanas á él, diciendo: Señor, he aquí, el que amas está enfermo. (Juan 11:3)"
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
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

const R1: StonesRound = {
  hint: 'Lege Steine auf die ruhigen Stellen.',
  background: 'x/bach-1.webp',
  start: { x: 50, y: 76 },
  goal: { x: 50, y: 28 },
  reach: 25,
  stones: 5,
  spots: [
    { x: 36, y: 60.5 },
    { x: 52, y: 60, whirl: true },
    { x: 68, y: 60.5 },
    { x: 26, y: 50.5 },
    { x: 45, y: 50.5 },
    { x: 63, y: 50 },
    { x: 34, y: 41 },
    { x: 54, y: 41, whirl: true },
    { x: 72, y: 41 }
  ]
}
const R2: StonesRound = {
  hint: 'Der Bach ist breiter.',
  background: 'x/bach-2.webp',
  start: { x: 50, y: 80 },
  goal: { x: 50, y: 25 },
  reach: 23,
  stones: 6,
  spots: [
    [37, 66.5], [54, 66.5, 1], [70, 66], [27, 57, 1], [44, 57], [62, 57], [79, 56.5], [33, 47], [52, 47, 1], [72, 47], [24, 38], [43, 38, 1], [62, 38], [80, 38.5]
  ].map(([x, y, w]) => (w ? { x: x!, y: y!, whirl: true } : { x: x!, y: y! }))
}
const GAME: StonesGame = {
  messenger: 'x/bote.webp',
  stone: ['x/stein-1.webp', 'x/stein-2.webp', 'x/stein-3.webp'],
  shallow: 'x/flach.webp',
  whirl: 'x/strudel.webp',
  messengerW: 12,
  stoneW: 12,
  spotW: 14,
  rounds: [R1, R2]
}

describe('Bachsteine (GameBachsteine)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameBachsteine, { props: { game: GAME }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const spot = (w: Wr, i: number) => w.findAll('.gm-spot')[i]!
  const tap = async (w: Wr, ...ks: number[]) => {
    for (const k of ks) {
      await spot(w, k).trigger('click')
      await flushPromises()
    }
  }

  it('the sample data are in order; the brook, nine places as buttons, the messenger, five stones; the goal is three parts a round', () => {
    expect(stepStonesProblems(GAME)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Lege Steine auf die ruhigen Stellen.')
    expect(w.findAll('.gm-spot')).toHaveLength(9)
    expect(spot(w, 0).element.tagName).toBe('BUTTON')
    expect(spot(w, 0).attributes('aria-label')).toBe('Ruhige Stelle 1: einen Stein hineinlegen')
    expect(spot(w, 1).attributes('aria-label')).toBe('Strudel 2: hier bleibt kein Stein liegen')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Bach')
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Der Bote')
    expect(w.find('.gm-ring').exists()).toBe(true)
    expect(w.text()).toContain('Steine übrig: 5')
    expect(w.findAll('.gm-icon')).toHaveLength(5)
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(problems()).toEqual([])
  })

  it('a whirl takes the stone: a cross, the words, one mistake (not twice for the same whirl at once), no stone is used', async () => {
    const w = mountIt()
    await tap(w, 1)
    expect(w.text()).toContain('Der Strudel nimmt den Stein mit!')
    expect(spot(w, 1).find('.gm-mark').exists()).toBe(true)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Steine übrig: 5')
    await tap(w, 1)
    // play the two rounds right through: one mistake is still three stars
    await tap(w, 0, 3, 6)
    await tick(5000)
    await tap(w, 0, 4, 5, 9, 12)
    await tick(6000)
    expect(w.text()).toContain('HERR, siehe, den du liebhast, der liegt krank.')
    expect(w.find('.gd-stars').exists()).toBe(true)
    expect(played).toContain('star')
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(problems()).toEqual([])
  })

  it('a stone too far: it lies, but the messenger stays and the words say why; a laid stone is taken back with a tap', async () => {
    const w = mountIt()
    await tap(w, 6)
    expect(spot(w, 6).classes()).toContain('laid')
    expect(spot(w, 6).attributes('aria-label')).toBe('Stein auf Stelle 7: antippen nimmt ihn zurück')
    expect(w.text()).toContain('so weit kann der Bote nicht steigen')
    expect(w.text()).toContain('Steine übrig: 4')
    const before = w.find('.gm-walker').attributes('style')
    await tap(w, 0)
    expect(w.text()).toContain('Der Bote steigt auf den Stein.')
    expect(w.find('.gm-walker').attributes('style')).not.toBe(before)
    expect(w.find('.gm-walker').attributes('style')).toContain('left: 36%')
    expect(useTaskProgress().parts.value).toBe(0)
    await tap(w, 6)
    expect(spot(w, 6).classes()).not.toContain('laid')
    expect(w.text()).toContain('Du hast den Stein wieder.')
    expect(w.text()).toContain('Steine übrig: 4')
  })

  it('no stone left: the words say how to take one back', async () => {
    const w = mountIt()
    await tap(w, 2, 5, 8, 3, 4)
    expect(w.text()).toContain('Steine übrig: 0')
    await tap(w, 6)
    expect(spot(w, 6).classes()).not.toContain('laid')
    expect(w.text()).toContain('Du hast keinen Stein mehr.')
  })

  it('round 1 played: the messenger walks across, the parts of "Go on" are full, then round 2 with fourteen places', async () => {
    const w = mountIt()
    await tap(w, 0, 3)
    expect(useTaskProgress().parts.value).toBeGreaterThanOrEqual(1)
    await tap(w, 6)
    expect(w.text()).toContain('Der Bote geht über die Steine')
    expect(spot(w, 4).attributes('disabled')).toBeDefined()
    await tick(2400)
    expect(w.text()).toContain('Geschafft! Der Bote ist trocken drüben')
    expect(w.find('.gm-goal .gm').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(played).toContain('right')
    await tick(3000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-spot')).toHaveLength(14)
    expect(w.text()).toContain('Steine übrig: 6')
    expect(w.findAll('.gm-spot.laid')).toHaveLength(0)
  })

  it('the help after fifteen seconds shows the next place; when the stones are on the wrong side it shows a stone to take back', async () => {
    const w = mountIt()
    expect(w.text()).not.toContain('Hilf mir')
    await tick(15500)
    const help = w.findAll('button').find((b) => b.text() === 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(spot(w, 0).classes()).toContain('hinted')
    expect(w.text()).toContain('Auf diese ruhige Stelle passt ein Stein.')
    await tap(w, 2, 5, 8, 3)
    await tick(15500)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.text()).toContain('Dieser Stein hilft dem Boten nicht.')
    expect(w.findAll('.gm-spot.hinted.lift')).toHaveLength(1)
  })

  it('the arrow keys go from place to place, Enter on the field chooses the first place', async () => {
    const w = mountIt()
    const field = w.find('.gm-field').element
    key(field, 'Enter')
    await flushPromises()
    expect(document.activeElement?.getAttribute('data-spot')).toBe('1')
    expect(w.text()).toContain('Mit den Pfeiltasten')
    key(document.activeElement!, 'ArrowLeft')
    await flushPromises()
    expect(document.activeElement?.getAttribute('data-spot')).toBe('0')
    key(document.activeElement!, 'ArrowUp')
    await flushPromises()
    expect(document.activeElement?.getAttribute('data-spot')).toBe('4')
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Stones left: 5')
    expect(en.findAll('.gm-spot')[1]!.attributes('aria-label')).toBe('Whirl 2: no stone stays here')
    en.unmount()
    const es = mountIt('es')
    expect(es.text()).toContain('Piedras que quedan: 5')
    expect(es.find('.gm-walker').attributes('aria-label')).toBe('El mensajero')
    for (const loc of ['de', 'en', 'es'] as const) expect(Object.keys(NEW_KEYS[loc]).sort()).toEqual(Object.keys(NEW_KEYS.de).sort())
    expect(NEW_KEYS.en.stepStonesDone).toBe('Therefore his sisters sent unto him, saying, Lord, behold, he whom thou lovest is sick. (John 11:3)')
    expect(NEW_KEYS.es.stepStonesDone).toBe('Enviaron, pues, sus hermanas á él, diciendo: Señor, he aquí, el que amas está enfermo. (Juan 11:3)')
  })
})
