/**
 * The four new games of "Hiskia: Ein Brief vor Gott" (`hiskia`), mounted with sample data and played through:
 * - `laufwege` = GameLaufwege ("Send the runners"): runner and town by two taps and by dragging, a town that has a letter, a runner without letters, a road that does not exist, a dead end, "one step back",
 *   "Start again", "Help me", the way of the solution through both rounds, the end with the verse (2 Chronicles 30,9), stars, English and Spanish;
 * - `stadtmorgen` = GameStadtmorgen ("The city wakes up"): the neighbours turn, "Undo", "Start again", "Help me", arrow keys, both rounds, taps beyond the shortest way, the verse (2 Kings 19,34);
 * - `sonnenuhr` = GameSonnenuhr ("How many steps?"): the buttons and the keys, dragging the handle, a wrong number and a wrong direction, the shadow that moves by itself after the right answer, "Help me", the verse;
 * - `stollen` = GameStollen ("Meeting in the rock"): the directions, "Dig", the pointers (always in round 1, after "Listen" in round 2), a miss, "Undo", a meeting with three stars through both rounds, "Help me", the verse.
 * The new words are mixed into the messages of the app here (`hiskiaNeuI18n.ts`), so that the test does not depend on their place in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameLaufwege from '@/components/molecules/games/GameLaufwege.vue'
import GameStadtmorgen from '@/components/molecules/games/GameStadtmorgen.vue'
import GameSonnenuhr from '@/components/molecules/games/GameSonnenuhr.vue'
import GameStollen from '@/components/molecules/games/GameStollen.vue'
import { allEnds, runHint, runStart, runStep, shadowLength, tunnelGap, tunnelHeight } from '@/utils/hiskiaNeu'
import { hiskiaStars, moveStars } from '@/utils/hiskiaGames'
import { MORNING, RUN, SUNDIAL, TUNNEL } from './hiskiaSamples'
import { HISKIA_WORDS } from './hiskiaNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...HISKIA_WORDS[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every picture area is 400 x 300 pixels (a percent of the picture is 4 pixels wide and 3 pixels high)
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
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
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
type Wr = ReturnType<typeof mount>
const helpButton = (w: Wr, label = 'Hilf mir') => w.findAll('button').find((b) => b.text() === label)
const button = (w: Wr, label: string) => w.findAll('button').find((b) => b.text() === label)
/** A pointer event at a place given in percent of the picture (the picture is 400 x 300 pixels in the test). */
const ptr = async (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x * 4, clientY: y * 3 }))
  await flushPromises()
}
const stillMotion = () =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn() }))

// ================================================================ laufwege
describe('Schicke die Läufer los (laufwege)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameLaufwege, { props: { game: RUN }, ...opts(locale) })
  const runner = (w: Wr, r: number) => w.find(`[data-runner="${r}"]`)
  const town = (w: Wr, id: string) => w.find(`[data-town="${id}"]`)
  /** Runner `r` goes to the town `id` by two taps (what the keyboard does). */
  const go = async (w: Wr, r: number, id: string) => {
    await runner(w, r).trigger('click')
    await town(w, id).trigger('click')
  }
  /** The way of the solution of round 1: a goes 5, 3 and b goes 2, 1, 4. */
  const solveRound1 = async (w: Wr) => {
    await go(w, 0, '5')
    await go(w, 0, '3')
    await go(w, 1, '2')
    await go(w, 1, '1')
    await go(w, 1, '4')
  }
  const solveRound2 = async (w: Wr) => {
    for (const [r, id] of [[0, '1'], [0, '2'], [1, '3'], [1, '5'], [2, '4'], [2, '7'], [2, '6']] as const) await go(w, r, id)
  }

  it('the goal is all twelve towns; the hint, the round, the field as one group, two runners and five towns as buttons with names; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Zwei Läufer, fünf Städte.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Die Karte vom Bergland')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-runner')).toHaveLength(2)
    expect(w.findAll('button.gm-tbtn')).toHaveLength(5)
    expect(runner(w, 0).attributes('aria-label')).toBe('Läufer mit Stirnband, 3 Briefe')
    expect(town(w, '1').attributes('aria-label')).toBe('Stadt 1, noch kein Brief')
    expect(w.findAll('.gm-letter')).toHaveLength(6)
    expect(w.findAll('.gm-road')).toHaveLength(8)
    expect(w.text()).toContain('Briefe abgegeben: 0 von 5')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a runner (he shines), then the town: the runner stands there, one letter less, a letter in the town, a soft tone, "Brief abgegeben.", a tick over the town; the people react', async () => {
    const w = mountIt()
    await runner(w, 0).trigger('click')
    expect(runner(w, 0).attributes('aria-pressed')).toBe('true')
    expect(runner(w, 0).classes()).toContain('sel')
    expect(w.text()).toContain('Tippe jetzt die Stadt an.')
    const before = runner(w, 0).attributes('style')
    await town(w, '5').trigger('click')
    expect(count('snap')).toBe(1)
    expect(w.text()).toContain('Brief abgegeben.')
    expect(w.text()).toContain('Die Leute machen sich auf den Weg nach Jerusalem.')
    expect(town(w, '5').attributes('aria-label')).toBe('Stadt 5, Brief liegt dort')
    expect(runner(w, 0).attributes('aria-label')).toBe('Läufer mit Stirnband, 2 Briefe')
    expect(runner(w, 0).attributes('style')).not.toBe(before)
    expect(w.findAll('.gm-letter')).toHaveLength(5)
    expect(w.findAll('.gm-town .gm-mark')).toHaveLength(1)
    expect(w.find('.gm-scene.comes').exists()).toBe(true)
    expect(w.find('.gm-foot').exists()).toBe(true)
    expect(w.find('.gm-foot').attributes('style')).toContain('filter: none') // the first runner: the colour of the picture
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('wrong')).toBe(0)
    await tick(1700)
    expect(w.find('.gm-scene').exists()).toBe(false)
    // the town that laughs
    await go(w, 1, '1')
    expect(w.text()).toContain('Die Leute lachen.')
    expect(w.find('.gm-scene.laughs').exists()).toBe(true)
  })

  it('a town that has a letter already: the runner wiggles, a cross, a low tone, "Hier war schon ein Läufer.", a mistake, the runner stays', async () => {
    const w = mountIt()
    await go(w, 0, '5')
    await go(w, 1, '5')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Hier war schon ein Läufer.')
    expect(runner(w, 1).classes()).toContain('wiggle')
    expect(runner(w, 1).attributes('aria-label')).toBe('Läufer mit Bartschatten, 3 Briefe')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a town without a road from where he stands is no mistake: "Dorthin führt kein Weg."; a town without a runner taken up asks for a runner', async () => {
    const w = mountIt()
    await town(w, '4').trigger('click')
    expect(w.text()).toContain('Tippe zuerst einen Läufer an.')
    await go(w, 0, '4')
    expect(w.text()).toContain('Dorthin führt kein Weg.')
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a runner without letters (round 2): "Dieser Läufer hat keine Briefe mehr." and a mistake', async () => {
    const w = mountIt()
    await solveRound1(w)
    await tick(3500)
    expect(w.text()).toContain('Runde 2 von 2')
    for (const id of ['1', '2', '4']) await go(w, 0, id)
    expect(runner(w, 0).attributes('aria-label')).toBe('Läufer mit Stirnband, 0 Briefe')
    expect(w.text()).toContain('Briefe abgegeben: 3 von 7')
    await go(w, 0, '7')
    expect(count('wrong')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Dieser Läufer hat keine Briefe mehr.')
  })

  it('a dead end: "Das reicht noch nicht. Versuche es anders." (a mistake, once), the button "Neu anfangen" pulses; "Einen Schritt zurück" and "Neu anfangen" cost nothing', async () => {
    const w = mountIt()
    // the town 1 is the knot: a runner who goes there first leaves the town 4 (reached only from 1) without a letter for ever
    await go(w, 0, '1')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das reicht noch nicht. Versuche es anders.')
    expect(button(w, 'Neu anfangen')!.classes()).toContain('pulse')
    // further steps in the dead end are no second mistake
    await go(w, 0, '3')
    await go(w, 1, '5')
    expect(count('wrong')).toBe(1)
    expect(button(w, 'Neu anfangen')!.classes()).toContain('pulse')
    // one step back: the runner b is back in Jerusalem, his letter is back, the town has none; still a dead end
    await button(w, 'Einen Schritt zurück')!.trigger('click')
    expect(town(w, '5').attributes('aria-label')).toBe('Stadt 5, noch kein Brief')
    expect(runner(w, 1).attributes('aria-label')).toBe('Läufer mit Bartschatten, 3 Briefe')
    expect(button(w, 'Neu anfangen')!.classes()).toContain('pulse')
    await button(w, 'Einen Schritt zurück')!.trigger('click')
    expect(button(w, 'Neu anfangen')!.classes()).toContain('pulse')
    // the last step back leads out of the dead end
    await button(w, 'Einen Schritt zurück')!.trigger('click')
    expect(button(w, 'Neu anfangen')!.classes()).not.toContain('pulse')
    expect(town(w, '1').attributes('aria-label')).toBe('Stadt 1, noch kein Brief')
    expect(button(w, 'Einen Schritt zurück')!.attributes('disabled')).toBeDefined()
    await go(w, 0, '1')
    expect(count('wrong')).toBe(2) // into the dead end again: again one mistake
    await button(w, 'Neu anfangen')!.trigger('click')
    expect(w.findAll('.gm-letter')).toHaveLength(6)
    expect(w.text()).toContain('Briefe abgegeben: 0 von 5')
    expect(count('wrong')).toBe(2)
    // the towns that got a letter once count once for "Go on", even after starting again
    expect(useTaskProgress().parts.value).toBe(3)
    await go(w, 0, '1')
    expect(useTaskProgress().parts.value).toBe(3)
  })

  it('a runner can be dragged over a town; letting go beside a town does nothing; a tap with the pointer takes the runner up', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(runner(w, 0).element, 'pointerdown', 7, 80)
    await ptr(wrap, 'pointermove', 20, 75)
    expect(w.find('.gm-ghost').exists()).toBe(true)
    await ptr(wrap, 'pointerup', 5, 20) // no town there
    expect(useTaskProgress().parts.value).toBe(0)
    expect(count('wrong')).toBe(0)
    await ptr(runner(w, 0).element, 'pointerdown', 7, 80)
    await ptr(wrap, 'pointermove', 20, 75)
    await ptr(wrap, 'pointerup', 33, 70) // the town 5
    expect(town(w, '5').attributes('aria-label')).toBe('Stadt 5, Brief liegt dort')
    expect(w.find('.gm-ghost').exists()).toBe(false)
    // a tap (down and up at the same place)
    await ptr(runner(w, 1).element, 'pointerdown', 19, 80)
    await ptr(wrap, 'pointerup', 19, 80)
    expect(runner(w, 1).attributes('aria-pressed')).toBe('true')
  })

  it('"Help me" after fifteen seconds lets a runner and his next town shine and costs nothing; with no way left it says so and the button "Neu anfangen" pulses', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    const h = runHint(RUN.rounds[0]!, runStart(RUN.rounds[0]!))!
    expect(runner(w, h.runner).classes()).toContain('shine')
    expect(town(w, h.to).classes()).toContain('shine')
    expect(w.text()).toContain('Ein Läufer und seine nächste Stadt leuchten.')
    await go(w, 0, h.to)
    expect(w.findAll('.shine')).toHaveLength(0)
    // a dead end
    await button(w, 'Neu anfangen')!.trigger('click')
    for (const [r, id] of [[0, '1'], [0, '3'], [1, '5']] as const) await go(w, r, id)
    await tick(16000)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('Hier geht es nicht weiter. Fang noch einmal an.')
    expect(button(w, 'Neu anfangen')!.classes()).toContain('pulse')
    expect(useTaskProgress().parts.value).toBe(new Set([h.to, '1', '3', '5']).size)
  })

  it('the end: the way of the solution through both rounds gives three stars and the verse (2 Chronicles 30,9); the button goes on', async () => {
    const w = mountIt()
    await solveRound1(w)
    expect(useTaskProgress().parts.value).toBe(5)
    await tick(1500)
    expect(w.text()).toContain('Jede Stadt hat einen Brief.')
    expect(runner(w, 0).attributes('disabled')).toBeDefined()
    await tick(2000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Drei Läufer, sieben Städte.')
    expect(w.findAll('button.gm-runner')).toHaveLength(3)
    expect(w.findAll('button.gm-tbtn')).toHaveLength(7)
    expect(w.text()).toContain('Briefe abgegeben: 0 von 7')
    await solveRound2(w)
    expect(useTaskProgress().parts.value).toBe(12)
    await tick(3500)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Der HERR, euer Gott, ist gnädig und barmherzig und wird sein Angesicht nicht von euch wenden, so ihr euch zu ihm bekehrt.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('three mistakes give two stars', async () => {
    const w = mountIt()
    await go(w, 0, '5')
    for (let k = 0; k < 3; k++) await go(w, 1, '5')
    expect(count('wrong')).toBe(3)
    await go(w, 0, '3')
    await go(w, 1, '2')
    await go(w, 1, '1')
    await go(w, 1, '4')
    await tick(3500)
    await solveRound2(w)
    await tick(3500)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([hiskiaStars(3)])
    expect(hiskiaStars(3)).toBe(2)
  })

  it('English and Spanish words; less motion: nothing runs', async () => {
    const en = mountIt('en')
    await go(en, 0, '5')
    expect(en.text()).toContain('Letter delivered.')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('The map of the hill country')
    expect(en.text()).toContain('Letters delivered: 1 of 5')
    en.unmount()
    const es = mountIt('es')
    await go(es, 0, '1')
    expect(es.text()).toContain('Carta entregada.')
    expect(es.text()).toContain('La gente se ríe.')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
  })
})

// ================================================================ stadtmorgen
describe('Die Stadt wacht auf (stadtmorgen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameStadtmorgen, { props: { game: MORNING }, ...opts(locale) })
  const house = (w: Wr, i: number) => w.find(`[data-house="${i}"]`)
  const shutCount = (w: Wr) => w.findAll('button.gm-house').filter((b) => b.attributes('aria-label') === 'Haus, Tür zu').length
  const tapAll = async (w: Wr, list: number[]) => {
    for (const i of list) await house(w, i).trigger('click')
  }

  it('the goal is the ten doors that are shut at the start (3 + 7); nine houses with a shut or an open door in their name, three doors shut; the hint, the round, the status line; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Neun Häuser, drei Türen sind noch zu.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Der Hang von Jerusalem')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('button.gm-house')).toHaveLength(9)
    expect(shutCount(w)).toBe(3)
    expect(house(w, 0).attributes('aria-label')).toBe('Haus, Tür zu')
    expect(house(w, 1).attributes('aria-label')).toBe('Haus, Tür offen')
    expect(w.text()).toContain('Offene Türen: 6 von 9')
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('a tap turns the house and its neighbours (a soft tone); there is no mistake and no cross; every door that was shut at the start and opens counts once', async () => {
    const w = mountIt()
    await house(w, 4).trigger('click') // turns 1, 3, 4, 5, 7: 4 opens, the four open ones shut
    expect(count('tap')).toBe(1)
    expect(house(w, 4).attributes('aria-label')).toBe('Haus, Tür offen')
    expect(house(w, 1).attributes('aria-label')).toBe('Haus, Tür zu')
    expect(house(w, 0).attributes('aria-label')).toBe('Haus, Tür zu')
    expect(w.text()).toContain('Offene Türen: 3 von 9')
    expect(useTaskProgress().parts.value).toBe(1) // the door 4 opened for the first time
    await house(w, 4).trigger('click')
    expect(house(w, 4).attributes('aria-label')).toBe('Haus, Tür zu')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('wrong')).toBe(0)
    expect(w.find('.gm-mark').exists()).toBe(false)
    expect(w.find('.gm-house.turn').exists()).toBe(true) // the doors turn for a short moment
    await tick(600)
    expect(w.find('.gm-house.turn').exists()).toBe(false)
  })

  it('"Rückgängig" takes the last tap back and "Neu anfangen" sets the round back; both cost nothing', async () => {
    const w = mountIt()
    const start = w.findAll('button.gm-house').map((b) => b.attributes('aria-label'))
    expect(button(w, 'Rückgängig')!.attributes('disabled')).toBeDefined()
    await tapAll(w, [4, 2, 6])
    expect(w.findAll('button.gm-house').map((b) => b.attributes('aria-label'))).not.toEqual(start)
    await button(w, 'Rückgängig')!.trigger('click')
    await button(w, 'Rückgängig')!.trigger('click')
    await button(w, 'Rückgängig')!.trigger('click')
    expect(w.findAll('button.gm-house').map((b) => b.attributes('aria-label'))).toEqual(start)
    expect(button(w, 'Rückgängig')!.attributes('disabled')).toBeDefined()
    await tapAll(w, [4, 2])
    await button(w, 'Neu anfangen')!.trigger('click')
    expect(w.findAll('button.gm-house').map((b) => b.attributes('aria-label'))).toEqual(start)
  })

  it('the arrow keys go from house to house; Enter and Space turn (as a click)', async () => {
    const w = mountIt()
    await house(w, 0).trigger('keydown', { key: 'ArrowRight' })
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-house')).toBe('1')
    await house(w, 1).trigger('keydown', { key: 'ArrowDown' })
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-house')).toBe('4')
    await house(w, 4).trigger('keydown', { key: 'ArrowLeft' })
    await house(w, 3).trigger('keydown', { key: 'ArrowLeft' })
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-house')).toBe('3') // the edge: nothing
    await house(w, 8).trigger('keydown', { key: 'ArrowDown' })
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-house')).toBe('3')
  })

  it('"Help me" after fifteen seconds lets the next house of a shortest way shine (also after a wrong tap) and costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(house(w, 0).classes()).toContain('shine')
    expect(w.findAll('.shine')).toHaveLength(1)
    expect(w.text()).toContain('Ein Haus leuchtet.')
    await house(w, 0).trigger('click')
    expect(w.findAll('.shine')).toHaveLength(0)
    expect(w.text()).not.toContain('Offene Türen: 9 von 9')
  })

  it('round 1 with the three taps of the diagonal: "Der Morgen ist da.", the bright tone, a warmer light, a tick; after a moment round 2 with twelve houses', async () => {
    const w = mountIt()
    await tapAll(w, [0, 4, 8])
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Der Morgen ist da.')
    expect(w.find('.gm-glow').classes()).toContain('on')
    expect(w.find('.gm-ok').exists()).toBe(true)
    expect(shutCount(w)).toBe(0)
    expect(house(w, 0).attributes('disabled')).toBeDefined()
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(3100)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Zwölf Häuser, sieben Türen sind noch zu.')
    expect(w.findAll('button.gm-house')).toHaveLength(12)
    expect(shutCount(w)).toBe(7)
    expect(w.find('.gm-glow').classes()).not.toContain('on')
  })

  it('the end: the shortest ways of both rounds give three stars and the verse (2 Kings 19,34); the button goes on', async () => {
    const w = mountIt()
    await tapAll(w, [0, 4, 8])
    await tick(3100)
    await tapAll(w, [1, 4, 5, 9, 11])
    expect(useTaskProgress().parts.value).toBe(10)
    expect(w.text()).toContain('Der Morgen ist da.')
    await tick(3100)
    expect(count('star')).toBe(2)
    expect(w.text()).toContain('Und ich will diese Stadt beschirmen, dass ich ihr helfe um meinetwillen und um Davids, meines Knechtes, willen.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('taps beyond the shortest way cost stars: twelve extra taps give two stars; taps that were taken back do not count', async () => {
    const w = mountIt()
    await tapAll(w, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]) // twelve taps that turn nothing in the end
    await tapAll(w, [0, 4, 8])
    await tick(3100)
    await tapAll(w, [6])
    await button(w, 'Rückgängig')!.trigger('click') // taken back: not counted
    await tapAll(w, [1, 4, 5, 9, 11])
    await tick(3100)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([moveStars(12)])
    expect(moveStars(12)).toBe(2)
  })

  it('English and Spanish words; less motion: the doors jump', async () => {
    const en = mountIt('en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('The slope of Jerusalem')
    expect(house(en, 0).attributes('aria-label')).toBe('house, door shut')
    expect(en.text()).toContain('Open doors: 6 of 9')
    en.unmount()
    const es = mountIt('es')
    expect(house(es, 1).attributes('aria-label')).toBe('casa, puerta abierta')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
  })
})

// ================================================================ sonnenuhr
describe('Wie viele Stufen? (sonnenuhr)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSonnenuhr, { props: { game: SUNDIAL }, ...opts(locale) })
  const tip = (w: Wr) => w.find('[data-tip]')
  const step = (w: Wr) => Number(/Stufe (\d+) von 14/.exec(tip(w).attributes('aria-label') ?? '')?.[1])
  const down = async (w: Wr, n: number) => {
    for (let i = 0; i < n; i++) await button(w, 'Eine Stufe hinab')!.trigger('click')
  }
  const up = async (w: Wr, n: number) => {
    for (let i = 0; i < n; i++) await button(w, 'Eine Stufe hinauf')!.trigger('click')
  }
  const shadowH = (w: Wr) => parseFloat(/height: ([\d.]+)%/.exec(w.find('.gm-shadow').attributes('style') ?? '')?.[1] ?? 'NaN')
  /** Round 1 right: three steps down, "Fertig", and wait until the shadow has walked. */
  const round1 = async (w: Wr) => {
    await down(w, 3)
    await button(w, 'Fertig')!.trigger('click')
    await tick(500 + 3 * 380 + 1600)
  }

  it('the goal is the two rounds; 14 notches; the handle on step 4, the shadow reaches it; the hint, the round, the field as one group, the buttons; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Der Schatten geht drei Stufen vorwärts, die Treppe hinab. Zeige, wo er dann steht.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Treppe des Ahas mit vierzehn Stufen')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('.gm-notch')).toHaveLength(14)
    expect(step(w)).toBe(4)
    expect(shadowH(w)).toBeCloseTo(shadowLength(SUNDIAL.treads, SUNDIAL.post, 4), 3)
    expect(w.findAll('.gm-dot')).toHaveLength(10)
    expect(w.findAll('.gm-dot.on')).toHaveLength(0)
    expect(button(w, 'Fertig')).toBeDefined()
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('the buttons move the handle one step; a dot counts every step since the start; the edges of the stairs stop it', async () => {
    const w = mountIt()
    await down(w, 2)
    expect(step(w)).toBe(6)
    expect(w.findAll('.gm-dot.on')).toHaveLength(2)
    expect(w.text()).toContain('Stufen gezählt: 2')
    await up(w, 1)
    expect(step(w)).toBe(5)
    expect(w.findAll('.gm-dot.on')).toHaveLength(1)
    await up(w, 3)
    expect(step(w)).toBe(2)
    expect(w.findAll('.gm-dot.on')).toHaveLength(2)
    await up(w, 5)
    expect(step(w)).toBe(1)
    expect(button(w, 'Eine Stufe hinauf')!.attributes('disabled')).toBeDefined()
    expect(count('tap')).toBeGreaterThan(0)
    // the shadow does not move before the answer
    expect(shadowH(w)).toBeCloseTo(shadowLength(SUNDIAL.treads, SUNDIAL.post, 4), 3)
  })

  it('the handle can be pulled along the stairs (it clicks into the nearest step); a tap on the field puts it on a step; arrow keys move it', async () => {
    const w = mountIt()
    const wrap = w.find('.gm-wrap').element
    await ptr(tip(w).element, 'pointerdown', 50, SUNDIAL.treads[3]!)
    await ptr(wrap, 'pointermove', 50, SUNDIAL.treads[8]! + 1)
    expect(step(w)).toBe(9)
    await ptr(wrap, 'pointermove', 50, SUNDIAL.treads[6]! - 1)
    expect(step(w)).toBe(7)
    await ptr(wrap, 'pointerup', 50, SUNDIAL.treads[6]!)
    await ptr(wrap, 'pointermove', 50, SUNDIAL.treads[1]!) // not pulling any more
    expect(step(w)).toBe(7)
    await ptr(w.find('.gm-field').element, 'pointerdown', 20, SUNDIAL.treads[11]!)
    expect(step(w)).toBe(12)
    await tip(w).trigger('keydown', { key: 'ArrowUp' })
    expect(step(w)).toBe(11)
    await tip(w).trigger('keydown', { key: 'ArrowDown' })
    await tip(w).trigger('keydown', { key: 'ArrowDown' })
    expect(step(w)).toBe(13)
  })

  it('"Fertig" at the right step: a tick, a bright tone, "Genau so viele Stufen.", and only now the shadow walks to the shown step; then round 2', async () => {
    const w = mountIt()
    await down(w, 3)
    await button(w, 'Fertig')!.trigger('click')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Genau so viele Stufen.')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(button(w, 'Fertig')!.attributes('disabled')).toBeDefined()
    expect(shadowH(w)).toBeCloseTo(shadowLength(SUNDIAL.treads, SUNDIAL.post, 4), 3)
    await tick(510)
    expect(shadowH(w)).toBeCloseTo(shadowLength(SUNDIAL.treads, SUNDIAL.post, 5), 3)
    await tick(380 * 2)
    expect(shadowH(w)).toBeCloseTo(shadowLength(SUNDIAL.treads, SUNDIAL.post, 7), 3)
    await tick(2000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Jetzt geht der Schatten zehn Stufen zurück, die Treppe hinauf.')
    expect(step(w)).toBe(13)
    expect(shadowH(w)).toBeCloseTo(shadowLength(SUNDIAL.treads, SUNDIAL.post, 13), 3)
    expect(w.findAll('.gm-dot.on')).toHaveLength(0)
  })

  it('a wrong number: a cross, a low tone, a mistake, "Das waren 2 Stufen. Zähle noch einmal."; the handle stays and the child can go on', async () => {
    const w = mountIt()
    await down(w, 2)
    await button(w, 'Fertig')!.trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das waren 2 Stufen. Zähle noch einmal.')
    expect(step(w)).toBe(6)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
    await down(w, 1)
    await button(w, 'Fertig')!.trigger('click')
    expect(count('right')).toBe(1)
    expect(count('wrong')).toBe(1)
    // nothing moved (0 steps) is wrong, too
    const v = mountIt()
    await button(v, 'Fertig')!.trigger('click')
    expect(v.text()).toContain('Das waren 0 Stufen. Zähle noch einmal.')
  })

  it('the right number in the wrong direction: "... aber in die andere Richtung" (a mistake)', async () => {
    const w = mountIt()
    await up(w, 3)
    await button(w, 'Fertig')!.trigger('click')
    expect(w.text()).toContain('Das waren 3 Stufen, aber in die andere Richtung. Zähle noch einmal.')
    expect(count('wrong')).toBe(1)
  })

  it('"Help me" after fifteen seconds: the notches light up one after the other from the start step and stay at the right one; costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('Die Kerben zählen die Stufen mit.')
    expect(w.findAll('.gm-notch.lit')).toHaveLength(1)
    await tick(710)
    expect(w.findAll('.gm-notch.lit')).toHaveLength(2)
    await tick(2200)
    expect(w.findAll('.gm-notch.lit')).toHaveLength(4) // the steps 4, 5, 6, 7
    expect(w.find('.gm-notch.goal').exists()).toBe(true)
    expect(tip(w).classes()).toContain('shine')
    // touching the handle ends the help
    await down(w, 1)
    expect(w.findAll('.gm-notch.lit')).toHaveLength(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the end: both rounds right (3 steps down, 10 steps up) give three stars and the verse (2 Kings 20,5); the button goes on', async () => {
    const w = mountIt()
    await round1(w)
    await up(w, 10)
    expect(step(w)).toBe(3)
    expect(w.findAll('.gm-dot.on')).toHaveLength(10)
    await button(w, 'Fertig')!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(500 + 10 * 380 + 1600)
    expect(count('star')).toBe(1)
    expect(w.text()).toContain('Ich habe dein Gebet gehört und deine Tränen gesehen.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('five mistakes give one star; Enter on the handle is "Fertig"', async () => {
    const w = mountIt()
    for (let k = 0; k < 5; k++) await button(w, 'Fertig')!.trigger('click')
    expect(count('wrong')).toBe(5)
    await down(w, 3)
    await tip(w).trigger('keydown', { key: 'Enter' })
    expect(count('right')).toBe(1)
    await tick(500 + 3 * 380 + 1600)
    await up(w, 10)
    await button(w, 'Fertig')!.trigger('click')
    await tick(500 + 10 * 380 + 1600)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([hiskiaStars(5)])
    expect(hiskiaStars(5)).toBe(1)
  })

  it('English and Spanish words; less motion: the shadow and the handle jump', async () => {
    const en = mountIt('en')
    expect(tip(en).attributes('aria-label')).toBe('tip of the shadow, step 4 of 14')
    await button(en, 'Done')!.trigger('click')
    expect(en.text()).toContain('That was 0 steps. Count again.')
    en.unmount()
    const es = mountIt('es')
    expect(es.text()).toContain('Un escalón arriba')
    expect(tip(es).attributes('aria-label')).toBe('punta de la sombra, escalón 4 de 14')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
    await down(w, 3)
    await button(w, 'Fertig')!.trigger('click')
    await tick(10)
    expect(shadowH(w)).toBeCloseTo(shadowLength(SUNDIAL.treads, SUNDIAL.post, 7), 3)
  })
})

// ================================================================ stollen
describe('Treffen im Fels (stollen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameStollen, { props: { game: TUNNEL }, ...opts(locale) })
  const H = tunnelHeight(TUNNEL)
  const dir = (w: Wr, crew: 'left' | 'right', d: number) => w.find(`[data-dir="${crew}${d}"]`)
  const pieces = (w: Wr) => w.findAll('.gm-gang').length
  const dig = (w: Wr) => button(w, 'Graben')!
  /** The choices of a way with the best meeting of a round (the first one that meets within `within`). */
  function findWay(round: number, within: number): { left: number[]; right: number[] } {
    const rd = TUNNEL.rounds[round]!
    const L = allEnds(rd, 'left', H)
    const R = allEnds(rd, 'right', H)
    for (const l of L) for (const r of R) if (Math.hypot(l.tip.x - r.tip.x, l.tip.y - r.tip.y) <= within) return { left: l.choices, right: r.choices }
    throw new Error('no way')
  }
  /** Digs a way: picks the direction of each crew and presses "Graben" for every piece. */
  async function play(w: Wr, way: { left: number[]; right: number[] }) {
    for (let k = 0; k < way.left.length; k++) {
      await dir(w, 'left', way.left[k]!).trigger('click')
      await dir(w, 'right', way.right[k]!).trigger('click')
      await dig(w).trigger('click')
      await tick(1200)
    }
  }

  it('the goal is 22 pieces; the hint, the round, the field as one group, two layers with names, spring and pool, two crews, two groups of three buttons, "Graben"; no "Horchen" in round 1', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(22)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Wähle für beide Trupps eine Richtung')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Der Fels von oben')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('.gm-band').map((b) => b.attributes('aria-label'))).toEqual(['Gesteinsschicht, schiebt nach unten', 'Gesteinsschicht, schiebt nach oben'])
    expect(w.find('[role="img"][aria-label="die Quelle"]').exists()).toBe(true)
    expect(w.find('[role="img"][aria-label="der Teich"]').exists()).toBe(true)
    expect(w.find('[data-crew="left"]').attributes('aria-label')).toBe('Gräbertrupp bei der Quelle')
    expect(w.find('[data-crew="right"]').attributes('aria-label')).toBe('Gräbertrupp beim Teich')
    expect(w.findAll('button.gm-dir')).toHaveLength(6)
    expect(dir(w, 'left', 0).attributes('aria-pressed')).toBe('true')
    expect(dir(w, 'left', 1).attributes('aria-label')).toBe('nach oben')
    expect(w.find('.gm-pad').attributes('aria-label')).toBe('Richtung für den Trupp bei der Quelle')
    expect(dig(w)).toBeDefined()
    expect(button(w, 'Horchen')).toBeUndefined()
    expect(w.text()).toContain('Stücke gegraben: 0 von 5')
    expect(pieces(w)).toBe(0)
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('the pointers: a planned piece for each crew; in round 1 the knocking pointers are always there (they point to the other crew)', () => {
    const w = mountIt()
    expect(w.findAll('.gm-ptr.plan')).toHaveLength(2)
    expect(w.findAll('.gm-ptr.listen')).toHaveLength(2)
    expect(w.find('[data-listen="left"]').attributes('aria-label')).toBe('Von dort klopft es.')
    expect(w.find('[data-plan="left"]').attributes('aria-label')).toBe('Das nächste Stück wird so gegraben.')
  })

  it('a choice shows (aria-pressed) and moves the planned pointer; "Graben": both crews dig one piece, the crews knock (rings), a soft tone, the pieces and the crews move on', async () => {
    const w = mountIt()
    const planBefore = w.find('[data-plan="left"]').attributes('style')
    await dir(w, 'left', 1).trigger('click')
    expect(dir(w, 'left', 1).attributes('aria-pressed')).toBe('true')
    expect(dir(w, 'left', 0).attributes('aria-pressed')).toBe('false')
    expect(w.find('[data-plan="left"]').attributes('style')).not.toBe(planBefore)
    const crewBefore = w.find('[data-crew="left"]').attributes('style')
    await dig(w).trigger('click')
    expect(count('tap')).toBe(1)
    expect(pieces(w)).toBe(2)
    expect(w.findAll('.gm-knock')).toHaveLength(2)
    expect(w.find('[data-crew="left"]').attributes('style')).not.toBe(crewBefore)
    expect(w.text()).toContain('Stücke gegraben: 1 von 5')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(1200)
    expect(w.findAll('.gm-knock')).toHaveLength(0)
    expect(count('wrong')).toBe(0)
  })

  it('five pieces always straight on miss: "Die Stollen haben sich verfehlt ...", a cross, a low tone, no stars; "Graben" is off; "Rückgängig" gives a piece back; nothing costs a mistake', async () => {
    const w = mountIt()
    for (let k = 0; k < 5; k++) await dig(w).trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Die Stollen haben sich verfehlt. Nimm einen Schritt zurück oder fang neu an.')
    expect(dig(w).attributes('disabled')).toBeDefined()
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.find('.gm-water').exists()).toBe(false)
    expect(useTaskProgress().parts.value).toBe(10)
    await button(w, 'Rückgängig')!.trigger('click')
    expect(w.text()).toContain('Stücke gegraben: 4 von 5')
    expect(dig(w).attributes('disabled')).toBeUndefined()
    // digging the same piece again does not count twice for "Go on"
    await dig(w).trigger('click')
    expect(useTaskProgress().parts.value).toBe(10)
    await button(w, 'Neu anfangen')!.trigger('click')
    expect(w.text()).toContain('Stücke gegraben: 0 von 5')
    expect(pieces(w)).toBe(0)
    expect(dir(w, 'right', 0).attributes('aria-pressed')).toBe('true')
  })

  it('a way that meets: the water flows ("Genau getroffen. Das Wasser fließt."), a tick, a bright tone; after a moment round 2 with "Horchen" and no pointers until it is pressed', async () => {
    const w = mountIt()
    await play(w, findWay(0, 1.5))
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Genau getroffen. Das Wasser fließt.')
    expect(w.findAll('.gm-water').length).toBeGreaterThanOrEqual(10)
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(dig(w).attributes('disabled')).toBeDefined()
    await tick(3200 + 1500)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Drei Schichten schieben den Stollen.')
    expect(w.findAll('.gm-band')).toHaveLength(3)
    expect(button(w, 'Horchen')).toBeDefined()
    expect(w.findAll('.gm-ptr.listen')).toHaveLength(0)
    expect(w.findAll('.gm-ptr.plan')).toHaveLength(2)
    await button(w, 'Horchen')!.trigger('click')
    expect(w.findAll('.gm-ptr.listen')).toHaveLength(2)
    expect(w.text()).toContain('Stücke gegraben: 0 von 6')
  })

  it('"Rückgängig" works in the middle of a round, and a crew can be taken up and the direction set by a tap above or below its tip', async () => {
    const w = mountIt()
    await dir(w, 'left', 1).trigger('click')
    await dig(w).trigger('click')
    await dig(w).trigger('click')
    expect(pieces(w)).toBe(4)
    await button(w, 'Rückgängig')!.trigger('click')
    expect(pieces(w)).toBe(2)
    await w.find('[data-crew="right"]').trigger('click')
    expect(w.find('[data-crew="right"]').attributes('aria-pressed')).toBe('true')
    // the field is 300 pixels high for 66.7 units: the tip of the right crew lies at y = 38 + a bit; a tap far above says "up", far below "down"
    await w.find('.gm-field').trigger('click', { clientY: 10 })
    expect(dir(w, 'right', 1).attributes('aria-pressed')).toBe('true')
    await w.find('.gm-field').trigger('click', { clientY: 290 })
    expect(dir(w, 'right', -1).attributes('aria-pressed')).toBe('true')
  })

  it('"Help me" after fifteen seconds lets the two best directions and "Graben" shine; in round 2 it also shows the pointers; it costs nothing', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.findAll('.gm-dir.shine')).toHaveLength(2)
    expect(w.find('.gm-dig').classes()).toContain('shine')
    expect(w.text()).toContain('Zwei Richtungen leuchten.')
    await dir(w, 'left', 1).trigger('click')
    expect(w.findAll('.gm-dir.shine')).toHaveLength(0)
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the end: both rounds meet exactly (three stars each) and give three stars and the verse (2 Kings 20,20); the button goes on', async () => {
    const w = mountIt()
    await play(w, findWay(0, 1.5))
    await tick(3200 + 1500)
    await play(w, findWay(1, 1.5))
    expect(useTaskProgress().parts.value).toBe(22)
    await tick(3200 + 1500)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Der Teich und die Wasserleitung, durch die er Wasser in die Stadt geleitet hat.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([3])
    expect(problems()).toEqual([])
  })

  it('an almost exact meeting counts two stars, a joined one a star: the sum of two rounds divided by two, rounded down, at least one', async () => {
    const w = mountIt()
    const two = findWay(0, 3.0)
    // a way with a gap between 1.5 and 3.0 (two stars): search one that is not within 1.5
    const rd = TUNNEL.rounds[0]!
    let near: { left: number[]; right: number[] } | null = null
    const L = allEnds(rd, 'left', H)
    const R = allEnds(rd, 'right', H)
    outer: for (const l of L) for (const r of R) {
      const g = Math.hypot(l.tip.x - r.tip.x, l.tip.y - r.tip.y)
      if (g > 1.6 && g <= 2.9) {
        near = { left: l.choices, right: r.choices }
        break outer
      }
    }
    expect(near).not.toBeNull()
    expect(tunnelGap(rd, near!.left, near!.right, H)).toBeGreaterThan(1.5)
    await play(w, near!)
    expect(w.text()).toContain('Fast getroffen. Das Wasser fließt.')
    expect(two.left).toHaveLength(5)
    await tick(3200 + 1500)
    await play(w, findWay(1, 1.5))
    await tick(3200 + 1500)
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([2]) // (2 + 3) / 2 rounded down
  })

  it('English and Spanish words; less motion: the water and the knocking come at once', async () => {
    const en = mountIt('en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('The rock seen from above')
    expect(en.find('[data-dir="left1"]').attributes('aria-label')).toBe('up')
    expect(en.text()).toContain('Pieces dug: 0 of 5')
    for (let k = 0; k < 5; k++) await en.find('.gm-dig').trigger('click')
    expect(en.text()).toContain('The tunnels missed each other.')
    en.unmount()
    const es = mountIt('es')
    expect(es.find('[data-dir="left1"]').attributes('aria-label')).toBe('arriba')
    expect(es.text()).toContain('Excavar')
    es.unmount()
    stillMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
    await play(w, findWay(0, 1.5))
    expect(w.find('.gm-water.flow').exists()).toBe(false)
    expect(w.findAll('.gm-water').length).toBeGreaterThan(0)
  })
})
