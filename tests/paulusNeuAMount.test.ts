/**
 * "Through the streets" (`gerade` = GameGerade), "Find Saul again" (`wiederfinden` = GameWiederfinden) and "Set the sail" (`segel` = GameSegel) of "Paulus",
 * mounted with sample data and played through with a fake clock: right and wrong moves (a cross, a word, a low tone, a mistake), the keyboard, "Help me" after fifteen seconds,
 * less motion, the rounds, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German and English words.
 * The new words are mixed into the messages of the app here (`paulusNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameGerade from '@/components/molecules/games/GameGerade.vue'
import GameWiederfinden from '@/components/molecules/games/GameWiederfinden.vue'
import GameSegel from '@/components/molecules/games/GameSegel.vue'
import { osterStars } from '@/utils/osternGames'
import { REFIND, SAIL, STREET } from './paulusSamples'
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
const box = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) })
const originalMatchMedia = window.matchMedia
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // every element is 100 x 100 pixels at the top left: a pointer at x is x % of the field
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

// ---------------------------------------------------------------- gerade
describe('Durch die Gassen (gerade)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameGerade, { props: { game: STREET }, ...opts(locale) })
  const pos = (w: Wr) => Number(w.find('.gm-walker').attributes('data-pos'))
  const up = async (w: Wr, wait = 450) => {
    await button(w, 'Einen Schritt weiter').trigger('click')
    await tick(wait)
  }

  it('the goal is every place of both rounds; Ananias, the city and the things are pictures; nothing drawn', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(10)
    expect(w.find('.gm-walker').attributes('aria-label')).toBe('Hananias, Platz 0 von 4')
    expect(w.find('.gm-field').attributes('aria-label')).toContain('Haus des Judas')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a step into a lane where something comes: the driver raises his hand, a cross, a word, a low tone, a mistake, and Ananias stays on the quiet strip', async () => {
    const w = mountIt()
    await tick(5000)
    await up(w)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Warte, bis der Weg frei ist!')
    expect(w.text()).toContain('hebt freundlich die Hand')
    expect(pos(w)).toBe(0)
    expect(w.find('.gm-hand').exists()).toBe(true)
  })

  it('staying in a lane until something comes is a mistake too: he steps back to the last quiet strip', async () => {
    const w = mountIt()
    await up(w)
    expect(pos(w)).toBe(1)
    expect(count('wrong')).toBe(0)
    await tick(5000)
    expect(count('wrong')).toBe(1)
    expect(pos(w)).toBe(0)
  })

  it('both rounds played through: the door of Judas, the picture in his house, the verse and the stars', async () => {
    const w = mountIt()
    for (let k = 0; k < 4; k++) await up(w)
    expect(w.text()).toContain('Hananias steht vor der Tür des Judas.')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    for (let k = 0; k < 6; k++) await up(w)
    expect(useTaskProgress().parts.value).toBe(10)
    await tick(1500)
    expect(w.find('.gm-end').exists()).toBe(true)
    expect(w.text()).toContain('Saulus kann wieder sehen')
    await tick(3300)
    expect(w.text()).toContain('fiel es von seinen Augen wie Schuppen')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
  })

  it('the keys and a tap: up arrow and a tap above him are a step, down arrow a step back (never a mistake)', async () => {
    const w = mountIt()
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowUp' })
    await tick(450)
    expect(pos(w)).toBe(1)
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowDown' })
    await tick(50)
    expect(pos(w)).toBe(0)
    await w.find('.gm-field').trigger('click', { clientY: 30 })
    await tick(450)
    expect(pos(w)).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('"Help me" after fifteen seconds lays a light spot on the next lane and says "Now!" when it is free; less motion; English words', async () => {
    const w = mountIt()
    await tick(16000)
    await button(w, 'Hilf mir').trigger('click')
    await tick(100)
    expect(w.find('.gm-light').exists()).toBe(true)
    expect(w.find('.gm-light').classes()).toContain('now')
    expect(w.text()).toContain('Jetzt!')
    lessMotion()
    const s = mountIt()
    expect(s.find('.gm').classes()).toContain('still')
    const en = mountIt('en')
    expect(en.text()).toContain('One step on')
  })
})

// ---------------------------------------------------------------- wiederfinden
describe('Saulus wiederfinden (wiederfinden)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameWiederfinden, { props: { game: REFIND }, ...opts(locale) })

  it('first the frame with Saul and "So sieht Saulus aus."; then the people come; the goal is one find a round', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.gm-frame').exists()).toBe(true)
    expect(w.text()).toContain('So sieht Saulus aus.')
    expect(w.find('[data-person]').exists()).toBe(false)
    await tick(3100)
    expect(w.find('.gm-frame').exists()).toBe(false)
    expect(w.find('[data-person="mann-1"]').exists()).toBe(true)
    expect(problems()).toEqual([])
  })

  it('every person is a button with a name that never gives Saul away (Tab and Enter work)', async () => {
    const w = mountIt()
    await tick(3000 + 2600)
    const saul = w.find('[data-person="saulus-geht"]')
    expect(saul.element.tagName).toBe('BUTTON')
    expect(saul.attributes('aria-label')).toBe('Ein Mann mit schwarzem Bart und grauem Mantel')
    expect(saul.attributes('aria-label')).not.toMatch(/Saul/)
  })

  it('someone else: he shakes his head, a cross, "Das ist nicht Saulus.", a low tone, one mistake (not two for a double tap)', async () => {
    const w = mountIt()
    await tick(3100)
    await w.find('[data-person="mann-1"]').trigger('click')
    await w.find('[data-person="mann-1"]').trigger('click')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das ist nicht Saulus.')
    expect(w.find('[data-person="mann-1"]').classes()).toContain('no')
  })

  it('Saul walks past untapped: no mistake, he comes again', async () => {
    const w = mountIt()
    await tick(3000 + 7300)
    expect(w.text()).toContain('Er kommt gleich noch einmal.')
    expect(count('wrong')).toBe(0)
  })

  it('both rounds: Saul is found, the picture of the two, the verse and the stars', async () => {
    const w = mountIt()
    await tick(3000 + 2600)
    await w.find('[data-person="saulus-geht"]').trigger('click')
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('Da ist Saulus!')
    expect(w.find('.gm-end').exists()).toBe(true)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    await tick(2000 + 4600)
    await w.find('[data-person="saulus-geht"]').trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(2900)
    expect(w.text()).toContain('Barnabas aber zog aus gen Tarsus, Saulus wieder zu suchen')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
  })

  it('"Help me" after fifteen seconds shows the frame with Saul for two seconds; less motion; English words', async () => {
    const w = mountIt()
    await tick(3000 + 16000)
    await button(w, 'Hilf mir').trigger('click')
    expect(w.find('.gm-frame').exists()).toBe(true)
    await tick(2100)
    expect(w.find('.gm-frame').exists()).toBe(false)
    lessMotion()
    expect(mountIt().find('.gm').classes()).toContain('still')
    expect(mountIt('en').text()).toContain('This is what Saul looks like.')
  })
})

// ---------------------------------------------------------------- segel
describe('Segel stellen (segel)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSegel, { props: { game: SAIL }, ...opts(locale) })
  const angle = (w: Wr) => Number(w.find('.gm-sail').attributes('data-angle'))
  const key = async (w: Wr, k: 'ArrowLeft' | 'ArrowRight', times: number) => {
    for (let i = 0; i < times; i++) await w.find('.gm-field').trigger('keydown', { key: k })
  }

  it('the goal is four quarters a round; the sail starts full in the wind; the ship, the sail and the pennant are pictures', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(angle(w)).toBe(90)
    expect(w.find('.gm-sail').attributes('aria-label')).toBe('Das Segel ist voll Wind.')
    expect(w.find('.gm-wind').attributes('aria-label')).toContain('Wimpel')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a slack sail for more than three seconds: a cross, "Der Wind hat gedreht!", a low tone, one mistake for this wind', async () => {
    const w = mountIt()
    await key(w, 'ArrowRight', 4)
    expect(angle(w)).toBe(150)
    await tick(200)
    expect(w.find('.gm-state').text()).toBe('Das Segel hängt schlaff.')
    await tick(3000)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Der Wind hat gedreht!')
    await tick(3000)
    expect(count('wrong')).toBe(1)
  })

  it('the finger turns the sail round the mast; the buttons turn it in steps', async () => {
    const w = mountIt()
    w.find('.gm-field').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 50, clientY: 90 }))
    await tick(50)
    expect(angle(w)).toBe(180)
    window.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 10, clientY: 50 }))
    await tick(50)
    expect(angle(w)).toBe(270)
    window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    await button(w, 'nach rechts').trigger('click')
    expect(angle(w)).toBe(285)
  })

  it('both rounds: follow the wind to Cyprus; a gust needs nothing; the harbour, the verse and the stars', async () => {
    const w = mountIt()
    await tick(7100)
    await key(w, 'ArrowLeft', 3)
    await tick(8200)
    expect(w.text()).toContain('Land in Sicht! Da ist Zypern.')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(angle(w)).toBe(90)
    await tick(3100)
    expect(w.text()).toContain('Windbö')
    await tick(3000)
    await key(w, 'ArrowRight', 4)
    await tick(6000)
    await key(w, 'ArrowLeft', 4)
    await tick(6600)
    expect(useTaskProgress().parts.value).toBe(8)
    await tick(1500)
    expect(w.find('.gm-end').exists()).toBe(true)
    await tick(3300)
    expect(w.text()).toContain('und von da schifften sie gen Zypern')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
  })

  it('"Help me" after fifteen seconds shows at the mast which way to turn; less motion: the sea stands still; English words', async () => {
    const w = mountIt()
    await tick(16000)
    await button(w, 'Hilf mir').trigger('click')
    expect(w.find('.gm-way').text()).toContain('nach links')
    expect(w.text()).toContain('Dreh das Segel nach links')
    lessMotion()
    const s = mountIt()
    expect(s.find('.gm').classes()).toContain('still')
    await tick(2000)
    expect((s.find('.gm-sea').element as HTMLElement).style.transform).toBe('translateX(-0%)')
    expect(mountIt('en').find('.gm-sail').attributes('aria-label')).toBe('The sail is full of wind.')
  })
})
