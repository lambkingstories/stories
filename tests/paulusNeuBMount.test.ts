/**
 * "Dye the purple" (`purpur` = GamePurpur) and "The workshop" (`werkstatt` = GameWerkstatt) of "Paulus", mounted with sample data and played through with a fake clock:
 * right and wrong moves (a cross, a word, a low tone, a mistake), moves that are no mistake, the keyboard, "Help me" after fifteen seconds, less motion, the rounds,
 * the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German and English words.
 * The new words are mixed into the messages of the app here (`paulusNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GamePurpur from '@/components/molecules/games/GamePurpur.vue'
import GameWerkstatt from '@/components/molecules/games/GameWerkstatt.vue'
import { osterStars } from '@/utils/osternGames'
import { DYE, TENT } from './paulusSamples'
import { PAULUS_WORDS } from './paulusNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...PAULUS_WORDS[lang] } } }
  }
  return out
}
const MESSAGES = allMessages()
const mk = (locale: 'de' | 'en' | 'es') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: MESSAGES as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' | 'es' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
const originalMatchMedia = window.matchMedia
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
  window.matchMedia = originalMatchMedia
})
const lessMotion = () => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn() })) as unknown as typeof window.matchMedia
}
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR|Missing required prop|Not found/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const count = (name: string) => played.filter((p) => p === name).length
type Wr = ReturnType<typeof mount>
const button = (w: Wr, text: string) => w.findAll('button').find((b) => b.text().includes(text))!

// ---------------------------------------------------------------- purpur
describe('Purpur färben (purpur)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GamePurpur, { props: { game: DYE }, ...opts(locale) })
  const dip = async (w: Wr, v: 'red' | 'blue') => {
    await w.find(`[data-vat="${v}"]`).trigger('click')
    await tick(550)
  }
  const colour = (w: Wr) => w.find('.gm-cloth').attributes('data-colour')

  it('the goal is every order; the vats are buttons marked by their signs (not only by colour); the cloth starts white', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('[data-vat="red"]').attributes('aria-label')).toContain('Tonschale')
    expect(w.find('[data-vat="blue"]').attributes('aria-label')).toContain('Holztäfelchen')
    expect(colour(w)).toBe('0-0')
    expect(w.find('.gm-sample').attributes('data-sample')).toBe('1-0')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a wrong colour: a cross, a word, a low tone, a mistake, and a new white cloth', async () => {
    const w = mountIt()
    await dip(w, 'blue')
    expect(colour(w)).toBe('0-1')
    await button(w, 'fertig').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Die Farbe passt nicht zum Muster.')
    await tick(1300)
    expect(colour(w)).toBe('0-0')
    expect(w.text()).toContain('Hier ist ein neues weißes Tuch.')
  })

  it('a third dip into the same vat does not go, and a white cloth is not handed over: no mistakes', async () => {
    const w = mountIt()
    await button(w, 'fertig').trigger('click')
    expect(w.text()).toContain('Das Tuch ist noch weiß.')
    await dip(w, 'red')
    await dip(w, 'red')
    await w.find('[data-vat="red"]').trigger('click')
    expect(w.find('[data-vat="red"]').classes()).toContain('wobble')
    expect(w.text()).toContain('Kräftiger geht es in diesem Bottich nicht.')
    expect(colour(w)).toBe('2-0')
    expect(count('wrong')).toBe(0)
  })

  it('both rounds: the customers smile, the verse and the stars', async () => {
    const w = mountIt()
    await dip(w, 'red')
    await button(w, 'fertig').trigger('click')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Die Farbe passt genau zum Muster!')
    await tick(1800 + 2500)
    expect(w.text()).toContain('Runde 2 von 2')
    await dip(w, 'red')
    await dip(w, 'blue')
    await button(w, 'fertig').trigger('click')
    await tick(1900)
    await dip(w, 'red')
    await dip(w, 'red')
    await dip(w, 'blue')
    await button(w, 'fertig').trigger('click')
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1800 + 1900)
    expect(w.text()).toContain('eine Purpurkrämerin aus der Stadt der Thyathirer')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
  })

  it('the keys choose a vat and dip; "Help me" shows the signs with how often; less motion; English words', async () => {
    const w = mountIt()
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    await w.find('.gm-field').trigger('keydown', { key: 'Enter' })
    await tick(550)
    expect(colour(w)).toBe('0-1')
    await tick(16000)
    await button(w, 'Hilf mir').trigger('click')
    expect(w.find('.gm-recipe').exists()).toBe(true)
    expect(w.find('.gm-recipe').text()).toContain('1-mal')
    lessMotion()
    expect(mountIt().find('.gm').classes()).toContain('still')
    expect(mountIt('en').text()).toContain('done')
  })
})

// ---------------------------------------------------------------- werkstatt
describe('Die Werkstatt (werkstatt)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameWerkstatt, { props: { game: TENT }, ...opts(locale) })
  const move = async (w: Wr, piece: number, to: string, wait = 0) => {
    await w.find(`[data-piece="${piece}"]`).trigger('click')
    await w.find(`[data-table="${to}"]`).trigger('click')
    if (wait) await tick(wait)
  }
  const stage = (w: Wr, piece: number) => Number(w.find(`[data-piece="${piece}"]`).attributes('data-stage'))

  it('the goal is four moves for every piece; the pieces and the tables are buttons with names; the first cloth lies on the bale', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.findAll('.gm-table')).toHaveLength(3)
    expect(w.find('[data-piece="0"]').attributes('aria-label')).toBe('Stück 1: Stoff, noch zusammengerollt')
    expect(w.find('[data-piece="0"]').element.tagName).toBe('BUTTON')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('the wrong table: a cross, "Erst zuschneiden!", a low tone, a mistake; the piece stays', async () => {
    const w = mountIt()
    await move(w, 0, '1')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Erst zuschneiden!')
    expect(w.find('.gm-pile [data-piece="0"]').exists()).toBe(true)
    await w.find('[data-table="0"]').trigger('click')
    expect(w.text()).toContain('Tipp zuerst auf ein Stück.')
    expect(count('wrong')).toBe(1)
  })

  it('both rounds: every piece goes from table to table; in round 2 new cloth comes when the cutting table is free; a working table is a mistake, a taken one is not; the sabbath, the verse, the stars', async () => {
    const w = mountIt()
    await move(w, 0, '0', 1100)
    expect(stage(w, 0)).toBe(1)
    await move(w, 0, '1', 1100)
    await move(w, 0, '2', 1100)
    expect(stage(w, 0)).toBe(3)
    await move(w, 0, 'shelf')
    expect(w.text()).toContain('Alle Zelte sind fertig!')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    await move(w, 0, '0', 1100)
    expect(w.find('[data-piece="1"]').exists()).toBe(false)
    await move(w, 0, '1')
    expect(w.text()).toContain('Neuer Stoff ist da.')
    // the sewing table is working: the new cloth there is a mistake
    await move(w, 1, '1')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('An diesem Tisch wird noch gearbeitet.')
    await move(w, 1, '0', 1100)
    // piece 0 is sewn and still lies on the sewing table: piece 1 cannot go there yet (no mistake)
    await move(w, 1, '1')
    expect(w.text()).toContain('Auf dem Tisch liegt noch ein Stück.')
    expect(count('wrong')).toBe(1)
    await move(w, 0, '2')
    await move(w, 1, '1', 300)
    await w.find('[data-piece="1"]').trigger('click')
    expect(w.text()).toContain('Hier wird noch gearbeitet')
    await tick(800)
    await move(w, 0, 'shelf')
    await move(w, 1, '2', 1100)
    await move(w, 1, 'shelf')
    expect(useTaskProgress().parts.value).toBe(12)
    await tick(1700)
    expect(w.find('.gm-end').exists()).toBe(true)
    await tick(3300)
    expect(w.text()).toContain('blieb er bei ihnen und arbeitete')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
  })

  it('"Help me" after fifteen seconds lights the next table; less motion; English words', async () => {
    const w = mountIt()
    await tick(16000)
    await button(w, 'Hilf mir').trigger('click')
    expect(w.find('[data-table="0"]').classes()).toContain('help')
    expect(w.text()).toContain('Der Tisch, der jetzt dran ist, leuchtet.')
    lessMotion()
    expect(mountIt().find('.gm').classes()).toContain('still')
    expect(mountIt('en').find('[data-piece="0"]').attributes('aria-label')).toBe('Piece 1: cloth, still rolled up')
  })
})
