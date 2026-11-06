/**
 * "Shadows on the wall" (`wandschatten` = GameWandschatten), "A place for two" (`beiseite` = GameBeiseite) and "Boards to the shore" (`bretter` = GameBretter) of "Bis nach Rom",
 * mounted with sample data and played through: right and wrong taps and drops (a cross, a word, a low tone, a mistake), the keyboard, "Help me" after fifteen seconds, the rounds,
 * the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`paulusromNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameWandschatten from '@/components/molecules/games/GameWandschatten.vue'
import GameBeiseite from '@/components/molecules/games/GameBeiseite.vue'
import GameBretter from '@/components/molecules/games/GameBretter.vue'
import { osterStars } from '@/utils/osternGames'
import { PLANKS, QUIET, WALL } from './paulusromSamples'
import { PAULUSROM_WORDS } from './paulusromNeuI18n'

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

type Tree = Record<string, Record<string, { adventure: Record<string, unknown> } & Record<string, unknown>>>
function allMessages() {
  const base = { ...(messages as unknown as Tree), ...(spanish as unknown as Tree) }
  const out: Record<string, unknown> = {}
  for (const lang of ['de', 'en', 'es'] as const) {
    const app = base[lang]!.app!
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...PAULUSROM_WORDS[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
const boxes = new WeakMap<Element, { left: number; top: number; right: number; bottom: number }>()
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every element is 100 x 100 pixels at the top left unless the test says otherwise: a click at (x, y) is (x %, y %) of the field
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const b = boxes.get(this)
    return (b ? box(b.left, b.top, b.right - b.left, b.bottom - b.top) : box(0, 0, 100, 100)) as DOMRect
  })
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
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x = 0, y = 0) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
type Wr = ReturnType<typeof mount>
const helpButton = (w: Wr, label: string) => w.findAll('button').find((b) => b.text() === label)

// ---------------------------------------------------------------- wandschatten
describe('Schatten an der Wand (wandschatten)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameWandschatten, { props: { game: WALL }, ...opts(locale) })
  const tapPerson = async (w: Wr, id: string) => {
    await w.find(`[data-person="${id}"]`).trigger('click')
    await flushPromises()
  }

  it('the goal is six shadows; three people in a row, the shadow of the first question on the wall, the round, the hint', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(6)
    expect(w.findAll('.gm-person')).toHaveLength(3)
    expect(w.find('[data-shadow]').attributes('data-shadow-id')).toBe('frau')
    expect(w.find('[data-shadow]').attributes('aria-label')).toBe('Der Schatten an der Wand: Schatten mit einem Krug.')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Tippe auf den, der den Schatten wirft.')
    expect(w.text()).toContain('Schatten: 0 von 3')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a wrong tap: a cross, "Schau dir die Form genau an.", a low tone, the shadow stays; the right tap: a tick, a ✓ on the person, the next shadow after a moment', async () => {
    const w = mountIt()
    await tapPerson(w, 'alter')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Schau dir die Form genau an.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.find('[data-shadow]').attributes('data-shadow-id')).toBe('frau')
    expect(useTaskProgress().parts.value).toBe(0)
    await tapPerson(w, 'frau')
    expect(count('found')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Richtig: Die Frau mit dem Krug!')
    expect(w.find('[data-person="frau"]').classes()).toContain('found')
    expect(w.find('[data-person="frau"] .gm-ok').exists()).toBe(true)
    expect(w.find('[data-shadow]').classes()).toContain('settled')
    await tapPerson(w, 'paulus') // while the shadow wanders to its person nothing counts
    expect(count('wrong')).toBe(1)
    await tick(1200)
    expect(w.find('[data-shadow]').attributes('data-shadow-id')).toBe('paulus')
    expect(w.text()).toContain('Schatten: 1 von 3')
  })

  it('a person who has found his shadow cannot be tapped again: a word, no mistake', async () => {
    const w = mountIt()
    await tapPerson(w, 'frau')
    await tick(1200)
    await tapPerson(w, 'frau')
    expect(w.text()).toContain('Diesen Schatten hast du schon gefunden.')
    expect(count('wrong')).toBe(0)
    expect(w.find('[data-person="frau"]').attributes('aria-label')).toBe('Die Frau mit dem Krug ist schon gefunden.')
  })

  it('both rounds played through (one mistake): the end shows the verse and gives the stars', async () => {
    const w = mountIt()
    await tapPerson(w, 'frau')
    await tick(1200)
    await tapPerson(w, 'alter') // wrong
    await tapPerson(w, 'paulus')
    await tick(1200)
    await tapPerson(w, 'alter')
    await tick(1200)
    expect(w.text()).toContain('Jeder Schatten hat seinen Menschen gefunden!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-person')).toHaveLength(4)
    expect(w.text()).toContain('Jetzt vier Zuhörer.')
    for (const id of ['alter', 'eutychus', 'paulus']) {
      await tapPerson(w, id)
      await tick(1200)
    }
    expect(useTaskProgress().parts.value).toBe(6)
    await tick(2500)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Und es waren viel Lampen auf dem Söller, da sie versammelt waren.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('the shadows of round 2 are bigger or turned round (the style follows the data)', async () => {
    const w = mountIt()
    for (const id of ['frau', 'paulus', 'alter']) {
      await tapPerson(w, id)
      await tick(1200)
    }
    await tick(2900)
    const big = w.find('[data-shadow]').attributes('style') ?? ''
    expect(big).toContain('scaleX(1)')
    expect(Number(/width: ([\d.]+)%/.exec(big)![1])).toBeGreaterThan(19)
    await tapPerson(w, 'alter')
    await tick(1200)
    expect(w.find('[data-shadow]').attributes('style')).toContain('scaleX(-1)')
  })

  it('the keyboard: right/left choose a person, Enter taps; "Help me" after fifteen seconds lights the right person', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.text()).toContain('Paulus. Mit Enter tippst du darauf.')
    await f.trigger('keydown', { key: 'Enter' }) // wrong: Paulus does not cast the shadow of the woman
    expect(count('wrong')).toBe(1)
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('[data-person="frau"]').classes()).toContain('cursor')
    await f.trigger('keydown', { key: 'Enter' })
    expect(count('found')).toBe(1)
    await tick(1200)
    expect(helpButton(w, 'Hilf mir')).toBeUndefined()
    await tick(15500)
    const help = helpButton(w, 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(w.find('[data-person="paulus"]').classes()).toContain('help')
    expect(w.text()).toContain('Einer der Zuhörer leuchtet auf.')
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Round 1 of 2')
    expect(en.text()).toContain('Shadows: 0 of 3')
    en.unmount()
    const es = mountIt('es')
    expect(es.text()).toContain('Sombras: 0 de 3')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- beiseite
describe('Ein Ort für zwei (beiseite)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameBeiseite, { props: { game: QUIET }, ...opts(locale) })
  /** The finger takes the pair, moves to (x, y) and lets go there. */
  const dropAt = async (w: Wr, x: number, y: number) => {
    pointer(w.find('[data-pair]').element, 'pointerdown', 50, 8)
    pointer(window, 'pointermove', (50 + x) / 2, (8 + y) / 2)
    pointer(window, 'pointermove', x, y)
    pointer(window, 'pointerup', x, y)
    await flushPromises()
  }

  it('the goal is two places; the pair stands at the gate, three soldiers with rings, the hint and the labels', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('[data-pair]').attributes('style')).toContain('left: 50%')
    expect(w.findAll('[data-soldier]')).toHaveLength(3)
    expect(w.findAll('[data-ring]')).toHaveLength(3)
    expect(w.text()).toContain('Bring die beiden an einen ruhigen Ort.')
    expect(w.find('.gm-field').attributes('aria-label')).toBe('Der Hof im Lager. Die hellen Ringe zeigen, wie weit die Soldaten hören.')
    expect(w.find('[data-pair]').attributes('aria-label')).toBe('Der Oberhauptmann und der junge Mann')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('inside a ring: the soldier lifts his head, a cross, "Da hört einer zu.", a low tone, a mistake, the pair walks back to the gate', async () => {
    const w = mountIt()
    await dropAt(w, 28, 30)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Da hört einer zu.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.find('[data-soldier="0"]').classes()).toContain('wobble')
    expect(w.find('[data-pair]').attributes('style')).toContain('left: 28%')
    await tick(900)
    expect(w.find('[data-pair]').attributes('style')).toContain('left: 50%')
    expect(w.find('[data-soldier="0"]').classes()).not.toContain('wobble')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('on the fountain or a pillar: "Hier steht etwas im Weg.", no mistake, the pair goes back to where it was lifted', async () => {
    const w = mountIt()
    await dropAt(w, 50, 52)
    expect(w.text()).toContain('Hier steht etwas im Weg.')
    expect(count('wrong')).toBe(0)
    expect(w.find('[data-pair]').attributes('style')).toContain('left: 50%')
    expect(w.find('[data-pair]').attributes('style')).toContain('top: 8%')
  })

  it('a free place: a tick, the two talk (the other picture), round 2 follows with five soldiers whose rings show only when the pair comes near', async () => {
    const w = mountIt()
    await dropAt(w, 20, 76)
    expect(count('found')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Hier hört keiner zu!')
    expect(w.find('[data-pair] img').attributes('src')).toContain('paar-reden')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('[data-soldier]')).toHaveLength(5)
    expect(w.find('[data-pair] img').attributes('src')).not.toContain('paar-reden')
    // at the free place in the bottom middle no ring is near
    pointer(w.find('[data-pair]').element, 'pointerdown', 50, 8)
    pointer(window, 'pointermove', 48, 84)
    await flushPromises()
    expect(w.findAll('[data-ring]')).toHaveLength(0)
    pointer(window, 'pointermove', 50, 34)
    await flushPromises()
    expect(w.findAll('[data-ring]').length).toBeGreaterThanOrEqual(1)
    pointer(window, 'pointermove', 48, 84)
    pointer(window, 'pointerup', 48, 84)
    await flushPromises()
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(2500)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Da nahm ihn der Oberhauptmann bei der Hand')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
    expect(problems()).toEqual([])
  })

  it('a finger that is cancelled puts the pair back; the mistakes count for the stars', async () => {
    const w = mountIt()
    await dropAt(w, 28, 30)
    await tick(900)
    pointer(w.find('[data-pair]').element, 'pointerdown', 50, 8)
    pointer(window, 'pointermove', 30, 40)
    pointer(window, 'pointercancel', 30, 40)
    await flushPromises()
    expect(w.find('[data-pair]').attributes('style')).toContain('left: 50%')
    await dropAt(w, 72, 32)
    await tick(900)
    await dropAt(w, 20, 76)
    await tick(2900)
    await dropAt(w, 50, 40) // round 2: inside the ring of the soldier in the middle
    await tick(900)
    await dropAt(w, 48, 84)
    await tick(2500)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(3)])
  })

  it('the keyboard: the arrows move the pair, Enter puts it down; "Help me" after fifteen seconds lets the quiet place shimmer', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'ArrowLeft' })
    expect(w.find('[data-pair]').attributes('style')).toContain('left: 47%')
    await f.trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[data-pair]').attributes('style')).toContain('top: 11%')
    await tick(15500)
    const help = helpButton(w, 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(w.find('[data-spot]').exists()).toBe(true)
    expect(w.text()).toContain('Die helle Stelle ist ruhig.')
    await f.trigger('keydown', { key: 'Enter' }) // at (47, 11) the soldiers on both sides do not reach: this is a free place, too
    expect(count('found') + count('wrong')).toBe(1)
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Round 1 of 2')
    expect(en.text()).toContain('Places: 0 of 2')
    en.unmount()
    const es = mountIt('es')
    expect(es.text()).toContain('Lugares: 0 de 2')
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- bretter
describe('Bretter ans Ufer (bretter)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameBretter, { props: { game: PLANKS }, ...opts(locale) })
  /** The finger takes the board on the rail at x and lets go there. */
  const letGo = async (w: Wr, x: number) => {
    pointer(w.find('[data-rail]').element, 'pointerdown', x, 72)
    pointer(window, 'pointerup', x, 72)
    await flushPromises()
  }
  /** Time for one current of three points to run (2 pieces of 900 ms and the landing). */
  const RUN = 2000

  it('the goal is seven boards; the board waits on the rail, the hint, the counter, the labels', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.find('[data-board]').attributes('data-item')).toBe('brett-1')
    expect(w.find('[data-board]').attributes('aria-label')).toBe('Das nächste Brett: Ein Seemann auf einem Brett')
    expect(w.text()).toContain('Lass das Brett ins Wasser.')
    expect(w.text()).toContain('An Land: 0')
    expect(w.find('[data-rail]').attributes('role')).toBe('slider')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a current to the shore: the board drifts, the person stands up on the beach, a tick, a bright tone, the counter rises', async () => {
    const w = mountIt()
    await letGo(w, 18)
    expect(w.text()).toContain('Das Brett treibt …')
    expect(w.find('[data-board]').attributes('style')).toContain('left: 20%')
    await tick(950)
    expect(w.find('[data-board]').attributes('style')).toContain('left: 24%')
    await tick(RUN)
    expect(count('found')).toBe(1)
    expect(w.findAll('[data-ashore]')).toHaveLength(1)
    expect(w.text()).toContain('An Land: 1')
    expect(w.text()).toContain('Die Wellen tragen es ans Ufer!')
    expect(w.find('[data-board]').attributes('data-item')).toBe('brett-2')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a current to the rocks: the board turns round and comes back to the ship, a cross, a word, a low tone, a mistake, the same board waits again', async () => {
    const w = mountIt()
    await letGo(w, 46)
    await tick(RUN)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Da treibt es zu den Felsen. Versuch eine andere Stelle.')
    expect(w.find('[data-board]').classes()).toContain('spin')
    expect(w.find('.gm-mark').exists()).toBe(true)
    await tick(2000)
    expect(w.find('[data-board]').classes()).not.toContain('spin')
    expect(w.find('[data-board]').attributes('data-item')).toBe('brett-1')
    expect(w.find('[data-board]').attributes('style')).toContain('left: 46%')
    expect(w.findAll('[data-ashore]')).toHaveLength(0)
    // while it is on its way nothing else can be let go
    await letGo(w, 20)
    await letGo(w, 20)
    await tick(RUN)
    expect(w.findAll('[data-ashore]')).toHaveLength(1)
  })

  it('both rounds played through (one mistake): the picture of everyone ashore, then the verse and the stars', async () => {
    const w = mountIt()
    await letGo(w, 46)
    await tick(RUN + 2000)
    for (const x of [20, 60, 20]) {
      await letGo(w, x)
      await tick(RUN)
    }
    await tick(700)
    expect(w.text()).toContain('Alle Bretter sind am Ufer!')
    await tick(2800)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('[data-ashore]')).toHaveLength(0)
    expect(w.find('[data-board]').attributes('data-item')).toBe('brett-1')
    for (const x of [20, 60, 20, 60]) {
      await letGo(w, x)
      await tick(RUN)
    }
    await tick(700)
    expect(w.find('[data-finale]').exists()).toBe(true)
    expect(w.text()).toContain('Alle sind an Land!')
    expect(useTaskProgress().parts.value).toBe(7)
    await tick(3300)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Und also geschah es, dass sie alle gerettet zu Lande kamen.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('in round 2 the nearest of five currents takes the board (a place between two currents goes to the nearer one)', async () => {
    const w = mountIt()
    for (const x of [20, 60, 20]) {
      await letGo(w, x)
      await tick(RUN)
    }
    await tick(3500)
    await letGo(w, 33)
    await tick(RUN)
    expect(count('wrong')).toBe(1) // the current at 32 leads to the rocks
  })

  it('the keyboard: the arrows slide the board along the rail, Enter lets it go; "Help me" after fifteen seconds shows a good current', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    for (let i = 0; i < 4; i++) await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('[data-board]').attributes('style')).toContain('left: 66%')
    await tick(15500)
    const help = helpButton(w, 'Hilf mir')!
    expect(help).toBeTruthy()
    await help.trigger('click')
    expect(w.find('[data-help]').exists()).toBe(true)
    expect(w.find('[data-help]').attributes('style')).toContain('left: 60%')
    expect(w.text()).toContain('Dort, wo es leuchtet')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-help]').exists()).toBe(false)
    await tick(RUN)
    expect(count('found')).toBe(1)
  })

  it('English and Spanish words', () => {
    const en = mountIt('en')
    expect(en.text()).toContain('Round 1 of 2')
    expect(en.text()).toContain('Ashore: 0')
    en.unmount()
    const es = mountIt('es')
    expect(es.text()).toContain('En tierra: 0')
    expect(problems()).toEqual([])
  })
})
