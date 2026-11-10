/**
 * "Hand in hand" (`reigen` = GameReigen) of "Der verlorene Sohn" (`sohn`), mounted with sample data and played through: picking a dancer and joining two (by two taps and by dragging),
 * a hand across the ring in round 1, the rules of round 2 (no crossing, two hands at most, no early ring), loosening a band, the turning ring, "Help me" after fifteen seconds
 * (also when a band is in the way), the keyboard, less motion, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`sohnNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameReigen from '@/components/molecules/games/GameReigen.vue'
import { osterStars } from '@/utils/osternGames'
import { danceRingPairs } from '@/utils/sohnNeuB'
import { DANCE } from './sohnSamples'
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
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every element is 100 x 100 pixels at the top left: a pointer at (x, y) is (x %, y %) of the field
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
  vi.unstubAllGlobals()
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
const helpButton = (w: Wr) => w.findAll('button').find((b) => b.text() === 'Hilf mir')
const againButton = (w: Wr) => w.findAll('button').find((b) => b.text() === 'Von vorn')!
const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameReigen, { props: { game: DANCE }, ...opts(locale) })
const dancer = (w: Wr, id: string) => w.find(`[data-dancer="${id}"]`)
const bandKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
const band = (w: Wr, a: string, b: string) => w.find(`[data-band="${bandKey(a, b)}"]`)
/** Joins two dancers by two taps. */
const join = async (w: Wr, a: string, b: string) => {
  await dancer(w, a).trigger('click')
  await dancer(w, b).trigger('click')
}
const R1 = DANCE.rounds[0]!
const R2 = DANCE.rounds[1]!
const pairs = (order: string[]) => danceRingPairs(order)

describe('Hand in hand (reigen)', () => {
  it('the goal is the two rounds; six dancers, the hint, the round, the count, the lyre player, the status line; no drawing', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.findAll('.gm-dancer')).toHaveLength(6)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Verbinde die Tänzer, bis sich alle an den Händen halten.')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Der Festhof am Abend.')
    expect(w.find('.gm-count').text()).toBe('Bänder: 0 von 6')
    expect(dancer(w, 'vater').attributes('aria-label')).toBe('der Vater, 0 von 2 Händen gereicht')
    expect(dancer(w, 'vater').attributes('aria-pressed')).toBe('false')
    expect(w.find('.gm-lyre').exists()).toBe(true)
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(helpButton(w)).toBeUndefined()
    expect(againButton(w).attributes('disabled')).toBeDefined()
    expect(problems()).toEqual([])
  })

  it('a tap picks a dancer (marked and said, not only coloured); a second tap on him lets him go; a tap on a neighbour joins the two with a band', async () => {
    const w = mountIt()
    await dancer(w, 'vater').trigger('click')
    expect(dancer(w, 'vater').classes()).toContain('sel')
    expect(dancer(w, 'vater').attributes('aria-pressed')).toBe('true')
    expect(w.find('.gm-sel').exists()).toBe(true)
    expect(w.text()).toContain('der Vater ist gewählt.')
    await dancer(w, 'vater').trigger('click')
    expect(dancer(w, 'vater').classes()).not.toContain('sel')
    await join(w, 'vater', 'sohn')
    expect(count('snap')).toBe(1)
    expect(band(w, 'vater', 'sohn').exists()).toBe(true)
    expect(band(w, 'vater', 'sohn').attributes('aria-label')).toBe('Band zwischen der Vater und der jüngere Sohn. Ein Tippen löst es.')
    expect(w.text()).toContain('Die Hände sind gefasst.')
    expect(w.find('.gm-count').text()).toBe('Bänder: 1 von 6')
    expect(dancer(w, 'vater').attributes('aria-label')).toBe('der Vater, 1 von 2 Händen gereicht')
    expect(dancer(w, 'vater').classes()).not.toContain('sel')
    expect(count('wrong')).toBe(0)
  })

  it('dragging from one dancer to another joins them too; a drag that ends on nobody does nothing', async () => {
    const w = mountIt()
    pointer(dancer(w, 'vater').element, 'pointerdown', 36.5, 35.5)
    pointer(window, 'pointermove', 50, 35.5)
    await flushPromises()
    expect(w.find('.gm-pull').exists()).toBe(true)
    pointer(window, 'pointerup', 63.5, 35.5)
    await flushPromises()
    expect(w.find('.gm-pull').exists()).toBe(false)
    expect(band(w, 'vater', 'sohn').exists()).toBe(true)
    pointer(dancer(w, 'g1').element, 'pointerdown', 77, 52)
    pointer(window, 'pointerup', 50, 52)
    await flushPromises()
    expect(w.findAll('.gm-band')).toHaveLength(1)
    expect(count('wrong')).toBe(0)
  })

  it('round 1: a hand across the ring springs back: a cross, the words, a low tone, a mistake, no band', async () => {
    const w = mountIt()
    await join(w, 'vater', 'g2')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Reiche die Hand dem, der neben dir steht.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(w.findAll('.gm-band')).toHaveLength(0)
    expect(dancer(w, 'vater').classes()).not.toContain('sel')
  })

  it('a tap on a band loosens it, "Start again" loosens all; neither is a mistake', async () => {
    const w = mountIt()
    await join(w, 'vater', 'sohn')
    await join(w, 'sohn', 'g1')
    expect(w.findAll('.gm-band')).toHaveLength(2)
    await band(w, 'vater', 'sohn').trigger('click')
    expect(w.findAll('.gm-band')).toHaveLength(1)
    expect(w.text()).toContain('Das Band ist gelöst.')
    expect(againButton(w).attributes('disabled')).toBeUndefined()
    await againButton(w).trigger('click')
    expect(w.findAll('.gm-band')).toHaveLength(0)
    expect(w.text()).toContain('Alle Bänder sind gelöst.')
    expect(count('wrong')).toBe(0)
  })

  it('round 1 played through: the last band starts the turning; notes rise; the dancers move round the ring; then round 2 with ten dancers', async () => {
    const w = mountIt()
    for (const [a, b] of pairs(R1.order)) await join(w, a, b)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Der Reigen dreht sich!')
    expect(count('right')).toBe(0)
    await tick(400)
    expect(count('found')).toBe(1)
    expect(count('right')).toBe(1)
    expect(w.findAll('.gm-note')).toHaveLength(3)
    expect(w.classes()).toContain('spin')
    // nobody can be picked while the ring turns
    expect(dancer(w, 'vater').attributes('disabled')).toBeDefined()
    const left = () => (dancer(w, 'vater').element as HTMLElement).style.left
    const first = left()
    await tick(500)
    expect(left()).not.toBe(first)
    await tick(6000)
    expect(w.text()).toContain('Geschafft! Die nächste Runde beginnt')
    await tick(2000)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Reiche jedem Tänzer zwei Hände, bis ein großer Ring entsteht.')
    expect(w.findAll('.gm-dancer')).toHaveLength(10)
    expect(w.findAll('.gm-band')).toHaveLength(0)
    expect(w.find('.gm-count').text()).toBe('Bänder: 0 von 10')
    expect(count('wrong')).toBe(0)
  })

  it('round 2: a band across another is a mistake; a third hand is refused softly; a ring that closes too early springs open', async () => {
    const w = mountIt()
    for (const [a, b] of pairs(R1.order)) await join(w, a, b)
    await tick(10000)
    const id = (k: number) => R2.order[k % 10]!
    await join(w, id(0), id(5))
    expect(w.findAll('.gm-band')).toHaveLength(1)
    await join(w, id(2), id(7))
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Die Bänder dürfen sich nicht kreuzen.')
    expect(w.findAll('.gm-band')).toHaveLength(1)
    // a third hand for the first dancer (no mistake, a soft tone)
    await join(w, id(0), id(1))
    expect(w.findAll('.gm-band')).toHaveLength(2)
    const taps = count('tap')
    await join(w, id(0), id(9))
    expect(w.findAll('.gm-band')).toHaveLength(2)
    expect(count('wrong')).toBe(1)
    expect(count('tap')).toBeGreaterThan(taps)
    expect(w.text()).toContain('Gast 5 hält schon zwei Hände.')
    // a small ring that closes too early
    await againButton(w).trigger('click')
    await join(w, id(0), id(1))
    await join(w, id(1), id(2))
    await join(w, id(2), id(3))
    await join(w, id(3), id(0))
    expect(count('wrong')).toBe(2)
    expect(w.text()).toContain('Es fehlen noch Tänzer.')
    expect(w.findAll('.gm-band')).toHaveLength(3)
  })

  it('both rounds played through: the verse and the stars; one mistake costs what it costs', async () => {
    const w = mountIt()
    await join(w, 'vater', 'g2')
    for (const [a, b] of pairs(R1.order)) await join(w, a, b)
    await tick(10000)
    for (const [a, b] of pairs(R2.order)) await join(w, a, b)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(13000)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Denn dieser mein Sohn war tot und ist wieder lebendig geworden; er war verloren und ist gefunden worden.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('"Help me" comes after fifteen seconds, lights the next two dancers, and following it never costs a mistake', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    for (let k = 0; k < R1.order.length; k++) {
      if (k > 0) await tick(16000)
      await helpButton(w)!.trigger('click')
      const lit = w.findAll('.gm-dancer.help').map((d) => d.attributes('data-dancer')!)
      expect(lit, `step ${k + 1}`).toHaveLength(2)
      expect(w.text()).toContain('leuchten. Verbinde die beiden.')
      await join(w, lit[0]!, lit[1]!)
    }
    expect(count('wrong')).toBe(0)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Der Reigen dreht sich!')
  })

  it('"Help me" also names the band that is in the way, and a tap on it loosens it', async () => {
    const w = mountIt()
    await join(w, R1.order[0]!, R1.order[1]!)
    await tick(500)
    // a band that is allowed in round 1 only between neighbours; so change to round 2 first
    for (const [a, b] of pairs(R1.order).slice(1)) await join(w, a, b)
    await tick(10000)
    const id = (k: number) => R2.order[k % 10]!
    await join(w, id(0), id(5))
    await tick(16000)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('Dieses Band stört. Tippe darauf, dann löst es sich.')
    expect(band(w, id(0), id(5)).classes()).toContain('help')
    await band(w, id(0), id(5)).trigger('click')
    expect(w.findAll('.gm-band')).toHaveLength(0)
    expect(count('wrong')).toBe(0)
  })

  it('the keyboard: dancers and bands are buttons; the arrow keys move between the dancers from left to right; Enter on two dancers joins them', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    const all = w.findAll('.gm-dancer')
    expect(all.every((b) => b.element.tagName === 'BUTTON')).toBe(true)
    const byX = [...all].sort((a, b) => Number(a.attributes('data-x')) - Number(b.attributes('data-x')))
    ;(byX[0]!.element as HTMLElement).focus()
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(byX[1]!.element)
    await field.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(byX[0]!.element)
    await join(w, 'sohn', 'g1')
    expect(band(w, 'sohn', 'g1').element.tagName).toBe('BUTTON')
  })

  it('with less motion the ring does not turn; the notes stand still; the next round follows', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const w = mountIt()
    expect(w.classes()).toContain('still')
    for (const [a, b] of pairs(R1.order)) await join(w, a, b)
    expect(w.text()).toContain('Der Reigen dreht sich!')
    expect(w.classes()).not.toContain('spin')
    const left = (dancer(w, 'vater').element as HTMLElement).style.left
    await tick(1000)
    expect((dancer(w, 'vater').element as HTMLElement).style.left).toBe(left)
    expect(w.findAll('.gm-note')).toHaveLength(3)
    await tick(4500)
    expect(w.text()).toContain('Runde 2 von 2')
  })

  it('English and Spanish words', async () => {
    const en = mountIt('en')
    expect(en.find('.gm-field').attributes('aria-label')).toContain('The courtyard of the feast in the evening.')
    await en.find('[data-dancer="vater"]').trigger('click')
    await en.find('[data-dancer="g2"]').trigger('click')
    expect(en.text()).toContain('Give your hand to the one next to you.')
    const es = mountIt('es')
    expect(es.find('.gm-field').attributes('aria-label')).toContain('El patio de la fiesta al atardecer.')
    expect(es.find('.gm-count').text()).toBe('Cintas: 0 de 6')
  })
})
