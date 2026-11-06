/**
 * "Palm branches" (`palmen` = GamePalmen) and "Twelve pearl gates" (`perlentore` = GamePerlentore) of "Alles wird neu" (`offenbarung`),
 * mounted with sample data and played through: right and wrong moves (a cross, a word, a low tone, a mistake), the keyboard, "Help me" after fifteen seconds, the rounds,
 * the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German, English and Spanish words.
 * The new words are mixed into the messages of the app here (`offenbarungNeuI18n.ts`).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GamePalmen from '@/components/molecules/games/GamePalmen.vue'
import GamePerlentore from '@/components/molecules/games/GamePerlentore.vue'
import { osterStars } from '@/utils/osternGames'
import { GATES, PALMS } from './offenbarungSamples'
import { OFFENBARUNG_WORDS } from './offenbarungNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...OFFENBARUNG_WORDS[lang] } } }
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

// ---------------------------------------------------------------- palmen
describe('Palmzweige (palmen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GamePalmen, { props: { game: PALMS }, ...opts(locale) })
  /** One stroke: the finger goes down at `from` percent and moves `step` percent every 50 ms up to `to`; it lets go at the end when `lift`. */
  const stroke = async (w: Wr, from: number, to: number, step: number, lift = true) => {
    pointer(w.find('.gm-field').element, 'pointerdown', from, 50)
    let x = from
    for (let i = 0; i < 400 && x < to && count('wrong') === 0; i++) {
      x = Math.min(to, x + step)
      pointer(window, 'pointermove', x, 50)
      await tick(50)
    }
    if (lift) pointer(window, 'pointerup', x, 50)
    await flushPromises()
  }
  const up = (w: Wr) => w.findAll('.gm-col.up').length

  it('the goal is every wave; three rows with eleven people each, the speed meter, the hint, the round', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.findAll('.gm-row')).toHaveLength(3)
    expect(w.findAll('.gm-col')).toHaveLength(33)
    expect(up(w)).toBe(0)
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.text()).toContain('Streich ruhig über die Schar.')
    expect(w.find('.gm-meter').attributes('aria-label')).toBe('Streich über die Schar')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('a stroke at the right speed: "Just right", the people rise one after the other, at the end all stand with branches up, a tick and a bright tone', async () => {
    const w = mountIt()
    await stroke(w, 5, 50, 2.1, false)
    expect(w.find('.gm-meter-word').text()).toBe('Genau richtig')
    const half = up(w)
    expect(half).toBeGreaterThan(2)
    expect(half).toBeLessThan(11)
    await stroke(w, 50, 100, 2.1, true)
    expect(count('right')).toBe(1)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.text()).toContain('Die Welle ist gelungen! Jetzt die nächste.')
    expect(count('wrong')).toBe(0)
    await tick(1500)
    expect(up(w)).toBe(0)
  })

  it('too fast: people are skipped, a cross, "A little slower", a mistake', async () => {
    const w = mountIt()
    await stroke(w, 5, 100, 20)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Ein bisschen langsamer.')
    expect(w.find('.gm-mark').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('too slow: "A little faster", a mistake', async () => {
    const w = mountIt()
    await stroke(w, 5, 100, 0.5)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Ein bisschen schneller.')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('the stroke must begin on the left; a finger lifted early is no mistake', async () => {
    const w = mountIt()
    pointer(w.find('.gm-field').element, 'pointerdown', 60, 50)
    await flushPromises()
    expect(w.text()).toContain('Fang ganz links an.')
    await stroke(w, 5, 30, 2.1, true)
    expect(w.text()).toContain('Streich noch einmal von links bis ganz nach rechts.')
    expect(count('wrong')).toBe(0)
  })

  it('both rounds played through: two waves in one row, then one wave through each of three rows, at the end all branches rise together; the verse, the stars', async () => {
    const w = mountIt()
    await stroke(w, 5, 100, 2)
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(700)
    await stroke(w, 5, 100, 2)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.text()).toContain('Die Welle läuft durch die ganze Schar!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.text()).toContain('Jetzt sind es drei Reihen.')
    for (let k = 0; k < 3; k++) {
      await stroke(w, 5, 100, 2)
      await tick(700)
    }
    expect(useTaskProgress().parts.value).toBe(5)
    expect(count('wrong')).toBe(0)
    await tick(1200)
    expect(w.text()).toContain('Alle Palmzweige gehen zugleich hoch!')
    expect(up(w)).toBe(33)
    await tick(2800)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('… eine große Schar, welche niemand zählen konnte')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
    expect(problems()).toEqual([])
  })

  it('the keyboard: the right arrow held down goes at the right speed and raises the wave', async () => {
    const w = mountIt()
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    for (let i = 0; i < 80 && !w.text().includes('gelungen'); i++) await tick(100)
    expect(w.text()).toContain('Die Welle ist gelungen!')
    await w.find('.gm-field').trigger('keyup', { key: 'ArrowRight' })
    expect(count('wrong')).toBe(0)
  })

  it('"Help me" comes after fifteen seconds and shows a dot that runs along the row', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.text()).toContain('Der Punkt zeigt das richtige Tempo.')
    expect(w.find('.gm-dot').exists()).toBe(true)
    await tick(500)
    const x1 = (w.find('.gm-dot').element as HTMLElement).style.left
    await tick(500)
    expect((w.find('.gm-dot').element as HTMLElement).style.left).not.toBe(x1)
  })

  it('with less motion the allowed speed is twice as wide', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const w = mountIt()
    // 0.7 widths a second is too fast for [0.25, 0.6] but right for the wide window
    await stroke(w, 5, 100, 3.5)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(count('wrong')).toBe(0)
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-meter').attributes('aria-label')).toBe('Stroke across the crowd')
    expect(mountIt('es').find('.gm-meter').attributes('aria-label')).toBe('Pasa el dedo por la multitud')
  })
})

// ---------------------------------------------------------------- perlentore
describe('Zwölf Perlentore (perlentore)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GamePerlentore, { props: { game: GATES }, ...opts(locale) })
  const tapTile = async (w: Wr) => {
    pointer(w.find('[data-tile="1"]').element, 'pointerdown', 5, 5)
    pointer(window, 'pointerup', 6, 5)
    await flushPromises()
  }
  const place = async (w: Wr, side: string, i: number) => {
    await tapTile(w)
    await w.find(`[data-open="${side}-${i}"]`).trigger('click')
  }

  it('the goal is twelve gates; twelve openings with names, six gates in the tray, the piece of the verse, the compass rose', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.findAll('.gm-open')).toHaveLength(12)
    expect(w.findAll('.gm-tile')).toHaveLength(6)
    expect(w.find('[data-part]').text()).toBe('Vom Morgen drei Tore')
    expect(w.find('[data-open="morgen-0"]').attributes('aria-label')).toBe('Seite Morgen (Osten), Torplatz 1')
    expect(w.find('.gm-rose').attributes('role')).toBe('img')
    expect(w.text()).toContain('Runde 1 von 2')
    expect(w.find('.gm-fb').attributes('role')).toBe('status')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('the wrong side: a cross, "Morning means east", a mistake, the gate stays in the tray; the right side: the gate snaps in', async () => {
    const w = mountIt()
    await place(w, 'abend', 0)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Morgen heißt Osten. Schau auf die Windrose.')
    expect(w.find('[data-placed="abend-0"]').exists()).toBe(false)
    expect(w.findAll('.gm-tile')).toHaveLength(6)
    expect(w.find('.gm-mark').exists()).toBe(true)
    await place(w, 'morgen', 0)
    expect(count('snap')).toBe(1)
    expect(w.find('[data-placed="morgen-0"]').exists()).toBe(true)
    expect(w.text()).toContain('Das Tor sitzt.')
    expect(w.findAll('.gm-tile')).toHaveLength(5)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a taken opening is no mistake; an opening without a chosen gate asks for a gate', async () => {
    const w = mountIt()
    await w.find('[data-open="morgen-1"]').trigger('click')
    expect(w.text()).toContain('Wähl zuerst unten ein Tor.')
    await place(w, 'morgen', 1)
    await place(w, 'morgen', 1)
    expect(w.text()).toContain('Dort steht schon ein Tor.')
    expect(count('wrong')).toBe(0)
    expect(w.findAll('.gm-tile')).toHaveLength(5)
  })

  it('a gate can be dragged onto an opening; letting go beside the openings is no mistake', async () => {
    const w = mountIt()
    const t = w.find('[data-tile="1"]').element
    pointer(t, 'pointerdown', 5, 95)
    pointer(window, 'pointermove', 50, 60)
    pointer(window, 'pointerup', 50, 50)
    await flushPromises()
    expect(w.text()).toContain('Setz das Tor auf einen Torplatz der Mauer.')
    expect(count('wrong')).toBe(0)
    pointer(w.find('[data-tile="1"]').element, 'pointerdown', 5, 95)
    pointer(window, 'pointermove', 80, 40)
    pointer(window, 'pointerup', 88, 36)
    await flushPromises()
    expect(w.find('[data-placed="morgen-1"]').exists()).toBe(true)
    expect(count('snap')).toBe(1)
  })

  it('both rounds played through: morning and evening, then midnight and noon, every side asks for its own piece of the verse; all twelve gates stand open; the verse, the stars', async () => {
    const w = mountIt()
    for (let i = 0; i < 3; i++) await place(w, 'morgen', i)
    expect(w.text()).toContain('Die Seite Morgen hat ihre drei Tore.')
    expect(w.find('[data-part]').text()).toBe('Vom Abend drei Tore')
    for (let i = 0; i < 3; i++) await place(w, 'abend', i)
    expect(w.text()).toContain('Zwei Seiten haben ihre Tore!')
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('.gm-tile')).toHaveLength(6)
    expect(w.findAll('[data-placed]')).toHaveLength(6)
    expect(w.find('[data-part]').text()).toBe('Von Mitternacht drei Tore')
    await place(w, 'mittag', 0)
    expect(w.text()).toContain('Mitternacht heißt Norden. Schau auf die Windrose.')
    expect(count('wrong')).toBe(1)
    for (let i = 0; i < 3; i++) await place(w, 'mitternacht', i)
    expect(w.find('[data-part]').text()).toBe('Vom Mittag drei Tore')
    for (let i = 0; i < 3; i++) await place(w, 'mittag', i)
    expect(useTaskProgress().parts.value).toBe(12)
    await tick(1500)
    expect(w.text()).toContain('Alle zwölf Tore stehen offen.')
    expect(w.find('.gm-open').exists()).toBe(false)
    await tick(3000)
    expect(count('star')).toBeGreaterThanOrEqual(1)
    expect(w.text()).toContain('Und die zwölf Tore waren zwölf Perlen, und ein jeglich Tor war von einer Perle.')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
    expect(problems()).toEqual([])
  })

  it('the keyboard: Enter chooses a gate and the opening of the side that is asked for, arrows move on, Enter puts the gate there', async () => {
    const w = mountIt()
    const f = w.find('.gm-field')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.text()).toContain('Seite Morgen (Osten), Torplatz 1. Mit Enter setzt du das Tor ein.')
    await f.trigger('keydown', { key: 'ArrowRight' })
    expect(w.text()).toContain('Torplatz 2.')
    await f.trigger('keydown', { key: 'Enter' })
    expect(w.find('[data-placed="morgen-1"]').exists()).toBe(true)
    expect(count('snap')).toBe(1)
  })

  it('"Help me" comes after fifteen seconds: the tip of the compass rose and the openings of the side glow', async () => {
    const w = mountIt()
    await tick(14000)
    expect(helpButton(w)).toBeUndefined()
    await tick(2000)
    await helpButton(w)!.trigger('click')
    expect(w.find('.gm-tip').exists()).toBe(true)
    expect(w.find('[data-open="morgen-2"]').classes()).toContain('help')
    expect(w.find('[data-open="abend-2"]').classes()).not.toContain('help')
    expect(w.text()).toContain('Gesucht: Vom Morgen drei Tore.')
  })

  it('English and Spanish words', () => {
    expect(mountIt('en').find('.gm-field').attributes('aria-label')).toContain('The city seen from above')
    expect(mountIt('es').find('.gm-field').attributes('aria-label')).toContain('La ciudad vista desde arriba')
  })
})
