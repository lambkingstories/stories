/**
 * The two new games of "Jesu Wunder am See" (Anton's plan of 5.11.2026), each mounted with sample data and played through:
 * GameSaum (too early, beside the hem, the touch, Jesus comes again, help, keys) and GameUfer (start at the crowd, a rock, going on at the end, the landing place, the crowd walks,
 * draw again, the arrow keys, help); the rounds, the goal of "Go on" (`useTaskProgress`), the end with the stars and the words of the Bible, German, English and Spanish words.
 * The new words are not in `i18n/app.ts` yet: they are mixed in here (a copy of D:/Claude/Spiele-Neu/wunder/INTEGRATION.json, written by D:/Claude/Abenteuer-Wunder/tools/i18n_neu_wunder.py).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameSaum from '@/components/molecules/games/GameSaum.vue'
import GameUfer from '@/components/molecules/games/GameUfer.vue'
import { saumProblems, uferProblems } from '@/utils/wunderNeu'
import type { SaumGame, UferGame } from '@/utils/wunderNeu'

// ---------------------------------------------------------------- the new words (generated from the JSON)
// NEW_KEYS_START
const NEW_KEYS: Record<'de' | 'en' | 'es', Record<string, string>> = {
  "de": {
    "hemTouchField": "Eine Gasse in Kapernaum. Jesus geht in der Menge vorbei. Eine Frau aus der Menge streckt die Hand nach seinem Mantel aus.",
    "hemTouchCount": "Saum berührt: {n} von {total}",
    "hemTouchGood": "Sie hat den Saum berührt! Jesus bleibt stehen und dreht sich um.",
    "hemTouchHelped": "Da! Sie hat den Saum berührt. Jesus bleibt stehen und dreht sich um.",
    "hemTouchEarly": "Zu früh! Warte, bis der Saum bei ihrer Hand ist.",
    "hemTouchLate": "Zu spät! Der Saum ist schon an ihrer Hand vorbei.",
    "hemTouchMiss": "Das war nicht der Saum. Tippe genau auf die Quasten unten am Mantel.",
    "hemTouchCovered": "Gerade drängt sich jemand davor. Warte einen Augenblick.",
    "hemTouchWait": "Jesus kommt gleich vorbei.",
    "hemTouchAgain": "Jesus ist vorbei. Gleich kommt er noch einmal.",
    "hemTouchHelp": "Hilf mir",
    "hemTouchHelping": "Schau zu: Im richtigen Augenblick greift sie nach dem Saum.",
    "hemTouchDone": "Denn sie sprach: Wenn ich nur sein Kleid möchte anrühren, so würde ich gesund. (Markus 5,28)",
    "bankPathField": "Das Ufer am See. Links steht die Menge beim Dorf, rechts ist die Anlegestelle. Auf dem See fährt das Boot.",
    "bankPathStart": "Fang bei der Menge an und zieh den Weg mit dem Finger.",
    "bankPathContinue": "Zeichne am Ende deines Weges weiter.",
    "bankPathRock": "Da sind Felsen! Führe den Weg außen herum.",
    "bankPathWater": "Im Wasser kann die Menge nicht laufen. Bleib am Ufer.",
    "bankPathCount": "Weg geschafft: {n} von {total}",
    "bankPathClear": "Neu zeichnen",
    "bankPathGoal": "Die Anlegestelle",
    "bankPathArrived": "Die Menge ist schon da, als das Boot ankommt!",
    "bankPathHelp": "Hilf mir",
    "bankPathHelping": "Schau: ein Stück Weg um die Felsen. Dann zeichnest du weiter.",
    "bankPathDone": "Und Jesus ging heraus und sah das große Volk; und es jammerte ihn derselben; denn sie waren wie die Schafe, die keinen Hirten haben; und er fing an eine lange Predigt. (Markus 6,34)"
  },
  "en": {
    "hemTouchField": "A lane in Capernaum. Jesus walks past in the crowd. A woman of the crowd stretches out her hand toward his mantle.",
    "hemTouchCount": "Hem touched: {n} of {total}",
    "hemTouchGood": "She has touched the hem! Jesus stops and turns round.",
    "hemTouchHelped": "There! She has touched the hem. Jesus stops and turns round.",
    "hemTouchEarly": "Too early! Wait until the hem is at her hand.",
    "hemTouchLate": "Too late! The hem has already passed her hand.",
    "hemTouchMiss": "That was not the hem. Tap right on the tassels at the bottom of the mantle.",
    "hemTouchCovered": "Someone is pushing in front just now. Wait a moment.",
    "hemTouchWait": "Jesus is coming past in a moment.",
    "hemTouchAgain": "Jesus has gone past. He comes again in a moment.",
    "hemTouchHelp": "Help me",
    "hemTouchHelping": "Watch: at the right moment she reaches for the hem.",
    "hemTouchDone": "For she said, If I may touch but his clothes, I shall be whole. (Mark 5:28)",
    "bankPathField": "The shore of the lake. On the left the crowd stands by the village, on the right is the landing place. The boat sails on the lake.",
    "bankPathStart": "Start at the crowd and draw the way with your finger.",
    "bankPathContinue": "Go on drawing at the end of your way.",
    "bankPathRock": "Rocks in the way! Lead the way round them.",
    "bankPathWater": "The crowd cannot walk in the water. Stay on the shore.",
    "bankPathCount": "Way done: {n} of {total}",
    "bankPathClear": "Draw again",
    "bankPathGoal": "The landing place",
    "bankPathArrived": "The crowd is there before the boat arrives!",
    "bankPathHelp": "Help me",
    "bankPathHelping": "Look: a piece of the way round the rocks. Then you draw on.",
    "bankPathDone": "And Jesus, when he came out, saw much people, and was moved with compassion toward them, because they were as sheep not having a shepherd: and he began to teach them many things. (Mark 6:34)"
  },
  "es": {
    "hemTouchField": "Una calle de Capernaum. Jesús pasa entre la multitud. Una mujer de la multitud extiende la mano hacia su manto.",
    "hemTouchCount": "Borde tocado: {n} de {total}",
    "hemTouchGood": "¡Ha tocado el borde! Jesús se detiene y se da vuelta.",
    "hemTouchHelped": "¡Ahí! Ha tocado el borde. Jesús se detiene y se da vuelta.",
    "hemTouchEarly": "¡Demasiado pronto! Espera a que el borde esté junto a su mano.",
    "hemTouchLate": "¡Demasiado tarde! El borde ya pasó junto a su mano.",
    "hemTouchMiss": "Eso no era el borde. Toca justo las borlas de abajo del manto.",
    "hemTouchCovered": "Ahora alguien se pone delante. Espera un momento.",
    "hemTouchWait": "Jesús pasa enseguida.",
    "hemTouchAgain": "Jesús ya pasó. Enseguida vuelve a pasar.",
    "hemTouchHelp": "Ayúdame",
    "hemTouchHelping": "Mira: en el momento justo ella alcanza el borde.",
    "hemTouchDone": "Porque decía: Si tocare tan solamente su vestido, seré salva. (Marcos 5:28)",
    "bankPathField": "La orilla del lago. A la izquierda está la multitud junto a la aldea, a la derecha el embarcadero. La barca navega por el lago.",
    "bankPathStart": "Empieza junto a la multitud y traza el camino con el dedo.",
    "bankPathContinue": "Sigue trazando desde el final de tu camino.",
    "bankPathRock": "¡Ahí hay rocas! Lleva el camino alrededor.",
    "bankPathWater": "La multitud no puede andar por el agua. Quédate en la orilla.",
    "bankPathCount": "Camino hecho: {n} de {total}",
    "bankPathClear": "Trazar de nuevo",
    "bankPathGoal": "El embarcadero",
    "bankPathArrived": "¡La multitud ya está allí cuando llega la barca!",
    "bankPathHelp": "Ayúdame",
    "bankPathHelping": "Mira: un trozo del camino alrededor de las rocas. Luego sigues tú.",
    "bankPathDone": "Y saliendo Jesús vió grande multitud, y tuvo compasión de ellos, porque eran como ovejas que no tenían pastor; y les comenzó á enseñar muchas cosas. (Marcos 6:34)"
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
/** A pointer at a place in percent of the field (the field is 300 x 200 pixels in the test). */
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: (x / 100) * 300, clientY: (y / 100) * 200 }))
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const until = async (cond: () => boolean, maxSeconds = 30) => {
  for (let i = 0; i < maxSeconds * 10 && !cond(); i++) await tick(100)
  return cond()
}
const S = (label: string, w = 18) => ({ image: `x/${label}.webp`, label, w })
const helpButton = (w: { findAll: (s: string) => { text: () => string; trigger: (e: string) => Promise<void> }[] }) => w.findAll('button').find((b) => b.text() === 'Hilf mir')

// ---------------------------------------------------------------- 1. the hem
const SAUM: SaumGame = {
  background: 'x/strasse.webp',
  road: 88,
  jesus: S('Jesus', 22),
  hem: { x: 30, y: 85 },
  woman: { ...S('Die Frau', 18), x: 42, y: 88 },
  touch: { x: 50, y: 83 },
  people: [S('Mann', 20), S('Frau mit Krug', 20), S('Alter Mann', 20), S('Junge', 15)],
  rounds: [
    { hint: 'Tippe auf den Saum.', duration: 9, pause: 1.5, reach: 9, hemR: 7, sway: 1, ring: true, walkers: [] },
    {
      hint: 'Schneller.',
      duration: 6.5,
      pause: 1.2,
      reach: 8,
      hemR: 6.5,
      sway: 2,
      walkers: [
        { person: 0, lane: 97, from: 110, to: -10, at: 0.9, dur: 4 },
        { person: 3, lane: 98, from: -10, to: 110, at: 0.2, dur: 3 }
      ]
    }
  ]
}

describe('Der Saum (GameSaum)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSaum, { props: { game: SAUM }, ...opts(locale) })

  it('the sample data are in order; the lane, the woman, the ring, the count', () => {
    expect(saumProblems(SAUM)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Kapernaum')
    expect(w.find('.gm-field').attributes('tabindex')).toBe('0')
    expect(w.find('.gm-woman').attributes('aria-label')).toBe('Die Frau')
    expect(w.find('.gm-ring').exists()).toBe(true)
    expect(w.text()).toContain('Saum berührt: 0 von 2')
    expect(problems()).toEqual([])
  })

  it('too early and beside the hem are mistakes; at her hand she touches it, Jesus turns; round 2 without the ring; the help touches it; the end', async () => {
    const w = mountIt()
    const f = w.find('.gm-field').element
    await tick(2000)
    expect(w.find('.gm-jesus').exists()).toBe(true)
    key(f, 'Enter')
    await flushPromises()
    expect(w.text()).toContain('Zu früh!')
    expect(count('wrong')).toBe(1)
    pointer(f, 'pointerdown', 10, 10)
    await flushPromises()
    expect(w.text()).toContain('Das war nicht der Saum.')
    pointer(f, 'pointerdown', 12, 10) // a quick second tap beside it counts once
    await flushPromises()
    expect(count('wrong')).toBe(2)
    expect(w.find('.gm-mark').exists()).toBe(true)
    // the hem is at her hand about 4.8 seconds after the start
    await tick(2800)
    key(f, ' ')
    await flushPromises()
    expect(w.text()).toContain('Sie hat den Saum berührt!')
    expect(w.find('.gm-jesus').classes()).toContain('turned')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Saum berührt: 1 von 2')
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    expect(w.find('.gm-ring').exists()).toBe(false)
    expect(await until(() => !!helpButton(w as never), 20)).toBe(true)
    await helpButton(w as never)!.trigger('click')
    expect(w.text()).toContain('Schau zu')
    expect(await until(() => w.find('.gm-hemring').exists(), 3)).toBe(true) // the ring follows the hem while Jesus is in the picture
    expect(await until(() => /Wenn ich nur sein Kleid möchte anrühren/.test(w.text()), 15)).toBe(true)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(count('wrong')).toBe(2)
    expect(problems()).toEqual([])
  })

  it('when Jesus has gone past he comes again (no mistake)', async () => {
    const w = mountIt()
    await tick(10600)
    expect(w.text()).toContain('Gleich kommt er noch einmal')
    expect(count('wrong')).toBe(0)
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').text()).toContain('Hem touched: 0 of 2')
    expect(mountIt('es').text()).toContain('Borde tocado: 0 de 2')
  })
})

// ---------------------------------------------------------------- 2. along the shore
const LAKE = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 40 }, { x: 0, y: 40 }]
const UFER: UferGame = {
  rocks: [S('Felsbrocken', 16), S('Zwei Felsen', 16), S('Hoher Felsen', 16), S('Runder Felsen', 16)],
  crowd: S('Die Menge', 14),
  boat: S('Das Boot', 18),
  pad: 2,
  rounds: [
    {
      hint: 'Zeichne den Weg.',
      background: 'x/ufer-1.webp',
      water: [LAKE],
      rocks: [{ rock: 0, x: 50, y: 66, w: 16, r: 6 }, { rock: 1, x: 30, y: 86, w: 14, r: 5 }],
      start: { x: 8, y: 70 },
      goal: { x: 92, y: 60 },
      boatFrom: { x: 15, y: 20 },
      boatTo: { x: 88, y: 30 }
    },
    {
      hint: 'Um die Bucht.',
      background: 'x/ufer-2.webp',
      water: [LAKE, [{ x: 35, y: 39 }, { x: 65, y: 39 }, { x: 62, y: 70 }, { x: 38, y: 70 }]],
      rocks: [{ rock: 0, x: 30, y: 84, w: 14, r: 5 }, { rock: 2, x: 70, y: 84, w: 14, r: 5 }, { rock: 3, x: 50, y: 94, w: 12, r: 3.5 }],
      start: { x: 8, y: 86 },
      goal: { x: 92, y: 60 },
      boatFrom: { x: 15, y: 20 },
      boatTo: { x: 88, y: 30 }
    }
  ]
}

describe('Am Ufer entlang (GameUfer)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameUfer, { props: { game: UFER }, ...opts(locale) })
  type Wr = ReturnType<typeof mountIt>
  const lineLength = (w: Wr) => (w.find('.gm-line-over').exists() ? w.find('.gm-line-over').attributes('points')!.split(' ').length : 0)

  it('the sample data are in order; the crowd at its ring, the rocks, the boat, the button "Draw again"', () => {
    expect(uferProblems(UFER)).toEqual([])
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.findAll('.gm-rock')).toHaveLength(2)
    expect(w.find('.gm-start').exists()).toBe(true)
    expect(w.find('.gm-crowd').attributes('aria-label')).toBe('Die Menge')
    expect(w.find('.gm-goal').attributes('aria-label')).toBe('Die Anlegestelle')
    expect(w.find('.gm-clear').text()).toBe('Neu zeichnen')
    expect(w.find('.gm-clear').attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Weg geschafft: 0 von 3')
    expect(problems()).toEqual([])
  })

  it('the way begins at the crowd; a rock stops it (one mistake); a lifted finger goes on at the end; at the landing place the crowd walks; round 2 with the help; the end', async () => {
    const w = mountIt()
    const f = w.find('.gm-field').element
    pointer(f, 'pointerdown', 60, 80)
    await flushPromises()
    expect(w.text()).toContain('Fang bei der Menge an')
    pointer(f, 'pointerdown', 9, 71)
    pointer(window, 'pointermove', 30, 72)
    await flushPromises()
    expect(lineLength(w)).toBeGreaterThan(20)
    expect(w.find('.gm-start').exists()).toBe(false)
    pointer(window, 'pointermove', 70, 68)
    await flushPromises()
    expect(w.text()).toContain('Da sind Felsen!')
    expect(count('wrong')).toBe(1)
    pointer(window, 'pointermove', 72, 66) // still behind the rock: no second mistake
    await flushPromises()
    expect(count('wrong')).toBe(1)
    pointer(window, 'pointerup')
    pointer(f, 'pointerdown', 90, 90)
    await flushPromises()
    expect(w.text()).toContain('Zeichne am Ende deines Weges weiter.')
    const pts = w.find('.gm-line-over').attributes('points')!.split(' ')
    const [ex, ey] = pts[pts.length - 1]!.split(',').map(Number)
    pointer(f, 'pointerdown', ex!, ey!)
    for (const [x, y] of [[40, 80], [60, 80], [80, 70], [92, 60]] as const) pointer(window, 'pointermove', x, y)
    pointer(window, 'pointerup')
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.find('.gm-crowd').classes()).toContain('walking')
    expect(await until(() => w.text().includes('Die Menge ist schon da, als das Boot ankommt!'), 6)).toBe(true)
    expect(await until(() => w.text().includes('Runde 2 von 2'), 5)).toBe(true)
    expect(lineLength(w)).toBe(0)
    // round 2: the help draws piece by piece
    for (let i = 0; i < 4 && !/keinen Hirten haben/.test(w.text()); i++) {
      if (await until(() => !!helpButton(w as never), 20)) {
        await helpButton(w as never)!.trigger('click')
        expect(w.text()).toContain('ein Stück Weg um die Felsen')
      }
      await until(() => /keinen Hirten haben/.test(w.text()), 8)
    }
    expect(/keinen Hirten haben/.test(w.text())).toBe(true)
    expect(useTaskProgress().parts.value).toBe(6)
    expect(count('wrong')).toBe(1)
    expect(problems()).toEqual([])
  })

  it('the arrow keys draw from the crowd; Enter draws farther; "Draw again" starts anew without a mistake', async () => {
    const w = mountIt()
    const f = w.find('.gm-field').element
    key(f, 'ArrowDown')
    await flushPromises()
    const a = lineLength(w)
    expect(a).toBeGreaterThan(2)
    key(f, 'ArrowRight')
    key(f, 'Enter')
    await flushPromises()
    expect(lineLength(w)).toBeGreaterThan(a + 10)
    await w.find('.gm-clear').trigger('click')
    expect(lineLength(w)).toBe(0)
    expect(w.find('.gm-start').exists()).toBe(true)
    expect(count('wrong')).toBe(0)
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-clear').text()).toBe('Draw again')
    expect(mountIt('es').text()).toContain('Camino hecho: 0 de 3')
  })
})
