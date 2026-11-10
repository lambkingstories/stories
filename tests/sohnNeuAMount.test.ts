/**
 * "Who is coming?" (`ausschau` = GameAusschau) of "Der verlorene Sohn" (`sohn`), mounted with sample data and played through: the walkers come out of the haze one after the other,
 * a wrong tap (a cross, a word, a low tone, a mistake), the right tap (the son stops, the light, a tick, the verse), the second round, "Help me" after fifteen seconds, the keyboard,
 * less motion, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`sohnNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameAusschau from '@/components/molecules/games/GameAusschau.vue'
import { osterStars } from '@/utils/osternGames'
import { LOOKOUT } from './sohnSamples'
import { SOHN_WORDS } from './sohnNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...SOHN_WORDS[lang] } } }
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
const helpButton = (w: Wr) => w.findAll('button').find((b) => b.text() === 'Hilf mir')
const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameAusschau, { props: { game: LOOKOUT }, ...opts(locale) })
const walker = (w: Wr, id: string) => w.find(`[data-walker="${id}"]`)
const ids = (w: Wr) => w.findAll('.gm-walker').map((b) => b.attributes('data-walker'))
/** Waits until the first round has run for `ms` milliseconds (it starts 600 ms after the mount). */
const runTo = async (_w: Wr, ms: number) => {
  await tick(ms + 600)
}

describe('Wer kommt da? (ausschau)', () => {
  it('the goal is the two rounds; the hint, the round, the field, the status line; no drawing; nobody on the road before the round starts', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Halte Ausschau und tippe auf den Sohn, sobald du ihn erkennst.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Die Straße, vom Tor des Hofs aus gesehen.')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(w.findAll('.gm-walker')).toHaveLength(0)
    expect(helpButton(w)).toBeUndefined()
    expect(problems()).toEqual([])
  })

  it('the walkers come one after the other; far away they are small and named "a walker far away", near they are named by what they look like', async () => {
    const w = mountIt()
    await runTo(w, 1000)
    expect(ids(w)).toEqual(['haendler'])
    expect(walker(w, 'haendler').attributes('aria-label')).toBe('Ein Wanderer in der Ferne')
    const wide = (id: string) => parseFloat((walker(w, id).element as HTMLElement).style.width)
    const w1 = wide('haendler')
    await tick(4000)
    expect(ids(w)).toEqual(['haendler', 'frau'])
    expect(wide('haendler')).toBeGreaterThan(w1)
    await tick(5500)
    expect(ids(w)).toEqual(['haendler', 'frau', 'sohn'])
    expect(walker(w, 'haendler').attributes('aria-label')).toBe('ein Händler mit einem beladenen Esel')
    expect(walker(w, 'sohn').attributes('aria-label')).toBe('Ein Wanderer in der Ferne')
    // the nearer walker lies in front (higher on the screen order of the layers is lower on the picture)
    const z = (id: string) => Number((walker(w, id).element as HTMLElement).style.zIndex)
    expect(z('haendler')).toBeGreaterThan(z('sohn'))
    expect(problems()).toEqual([])
  })

  it('a wrong tap: a cross, "That is a merchant.", a low tone, a mistake, the walker sways and goes on; round 1 gives no extra line', async () => {
    const w = mountIt()
    await runTo(w, 3000)
    await walker(w, 'haendler').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das ist ein Händler.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(walker(w, 'haendler').classes()).toContain('wobble')
    expect(w.find('.gm-tip').exists()).toBe(false)
    const before = parseFloat((walker(w, 'haendler').element as HTMLElement).style.top)
    await tick(2000)
    expect(parseFloat((walker(w, 'haendler').element as HTMLElement).style.top)).toBeGreaterThan(before)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the right tap: the son stops, the pool of light, a tick, the words, a tone; the others fade away; the round is done', async () => {
    const w = mountIt()
    await runTo(w, 12000)
    expect(w.find('.gm-halo').exists()).toBe(false)
    await walker(w, 'sohn').trigger('click')
    expect(count('found')).toBe(1)
    expect(w.text()).toContain('Ja, das ist er! Der Vater erkennt seinen Sohn schon von weitem.')
    expect(w.find('.gm-halo').exists()).toBe(true)
    expect(w.find('.gm-halo').attributes('aria-label')).toBe('Ein sanftes Licht liegt um den Sohn')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(walker(w, 'haendler').classes()).toContain('gone')
    expect(walker(w, 'sohn').classes()).toContain('son')
    expect(useTaskProgress().parts.value).toBe(1)
    // he stands still
    const top = (walker(w, 'sohn').element as HTMLElement).style.top
    await tick(1000)
    expect((walker(w, 'sohn').element as HTMLElement).style.top).toBe(top)
    await tick(2000)
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Der Sohn ist gefunden!')
  })

  it('the others walk past the gate and leave; the son stops short of the gate and waits as long as it takes (no hurry, no mistake)', async () => {
    const w = mountIt()
    await runTo(w, 18500)
    expect(ids(w)).not.toContain('haendler')
    expect(ids(w)).toContain('sohn')
    await tick(17000)
    expect(ids(w)).toEqual(['sohn'])
    await tick(40000)
    expect(ids(w)).toEqual(['sohn'])
    expect(walker(w, 'sohn').attributes('aria-label')).toBe('ein Mann allein, barfuß, in zerrissenem Gewand')
    expect(count('wrong')).toBe(0)
    await walker(w, 'sohn').trigger('click')
    expect(w.text()).toContain('Ja, das ist er!')
  })

  it('both rounds: round 2 has six walkers; after the first mistake the line "The son walks alone and slowly." stays; the verse and the stars at the end', async () => {
    const w = mountIt()
    await runTo(w, 11000)
    await walker(w, 'sohn').trigger('click')
    await tick(5400)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Jetzt kommen sechs. Schau genau hin.')
    expect(w.find('.gm-halo').exists()).toBe(false)
    expect(w.find('.gm-tip').exists()).toBe(false)
    await tick(1000)
    expect(ids(w)).toEqual(['bauer'])
    await tick(12000)
    expect(ids(w)).toContain('jungmann')
    await walker(w, 'jungmann').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das ist ein junger Mann.')
    expect(w.find('.gm-tip').text()).toBe('Der Sohn geht allein und langsam.')
    await walker(w, 'sohn').trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(2900)
    expect(w.text()).toContain('Der Sohn ist gefunden!')
    await tick(2000)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Da er aber noch ferne von dannen war, sah ihn sein Vater, und es jammerte ihn, lief und fiel ihm um seinen Hals und küsste ihn.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('"Help me" comes after fifteen seconds without a tap and lays the soft light round the son; a tap starts the fifteen seconds again', async () => {
    const w = mountIt()
    await runTo(w, 14000)
    expect(helpButton(w)).toBeUndefined()
    await walker(w, 'haendler').trigger('click')
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.find('.gm-halo').classes()).toContain('help')
    expect(w.text()).toContain('Ein sanftes Licht liegt um den Sohn. Tippe darauf.')
    expect(w.find('.gm-tip').text()).toBe('Der Sohn geht allein und langsam.')
    // the help costs no star: only the one mistake counts
    await walker(w, 'sohn').trigger('click')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(helpButton(w)).toBeUndefined()
  })

  it('the keyboard: the walkers are buttons; the arrow keys move between them from left to right', async () => {
    const w = mountIt()
    await runTo(w, 6000)
    const field = w.find('.gm-field')
    const all = w.findAll('.gm-walker')
    expect(all.length).toBe(2)
    expect(all.every((b) => b.element.tagName === 'BUTTON')).toBe(true)
    const byX = [...all].sort((a, b) => Number(a.attributes('data-x')) - Number(b.attributes('data-x')))
    ;(byX[0]!.element as HTMLElement).focus()
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(byX[1]!.element)
    await field.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(byX[0]!.element)
    await byX[0]!.trigger('click')
    expect(count('wrong')).toBe(1)
  })

  it('with less motion the walkers hop in steps instead of gliding, and nothing sways', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const w = mountIt()
    expect(w.classes()).toContain('still')
    await runTo(w, 3000)
    const top = (id: string) => (walker(w, id).element as HTMLElement).style.top
    const seen = new Set<string>()
    for (let i = 0; i < 12; i++) {
      await tick(50)
      seen.add(top('haendler'))
    }
    expect(seen.size).toBeLessThanOrEqual(2)
    await tick(2000)
    expect(seen.has(top('haendler'))).toBe(false)
    await walker(w, 'haendler').trigger('click')
    expect(w.text()).toContain('Das ist ein Händler.')
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('The road, seen from the gate of the farm.')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('El camino, visto desde la puerta de la finca.')
  })
})
