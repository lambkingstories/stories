/**
 * "Leap and praise" (`huepfen` = GameHuepfen), "Catch up with the chariot" (`wagen` = GameWagen) and "Peek through the gate" (`spaehen` = GameSpaehen) of "Pfingsten",
 * mounted with sample data and played through with a fake clock: right and wrong moves (a cross, a word, a low tone, a mistake), the keyboard, "Help me" after fifteen seconds,
 * less motion, the rounds, the goal for "Go on" (`useTaskProgress`), the end with its stars and the words of the Bible, German and English words.
 * The new words are mixed into the messages of the app here (`pfingstenNeuI18n.ts`), so that the test does not wait for them to be in `i18n/app.ts`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import spanish from '@/i18n/app.es'
import useTaskProgress from '@/use/useTaskProgress'
import GameHuepfen from '@/components/molecules/games/GameHuepfen.vue'
import GameWagen from '@/components/molecules/games/GameWagen.vue'
import GameSpaehen from '@/components/molecules/games/GameSpaehen.vue'
import { osterStars } from '@/utils/osternGames'
import { CHARIOT, HOP, PEEK } from './pfingstenSamples'
import { PFINGSTEN_WORDS } from './pfingstenNeuI18n'

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
    out[lang] = { ...base[lang], app: { ...app, adventure: { ...app.adventure, ...PFINGSTEN_WORDS[lang] } } }
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
const pointer = (el: Element | Window, type: 'pointerdown' | 'pointermove' | 'pointerup', x = 0, y = 50) =>
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }))
type Wr = ReturnType<typeof mount>

// ---------------------------------------------------------------- huepfen
describe('Springen und loben (huepfen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameHuepfen, { props: { game: HOP }, ...opts(locale) })
  const press = async (w: Wr, c: 'small' | 'big' | 'praise', wait = 1000) => {
    await w.find(`[data-choice="${c}"]`).trigger('click')
    await tick(wait)
  }

  it('the goal is every step; the stairs are built from the step pictures; two buttons in round 1 with picture and word', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(9)
    expect(w.findAll('[data-choice]')).toHaveLength(2)
    expect(w.find('[data-choice="small"]').text()).toContain('kleiner Sprung')
    expect(w.find('[data-choice="big"]').text()).toContain('großer Sprung')
    expect(w.find('[data-step="1-h"]').exists()).toBe(true)
    expect(w.find('.gm-next').text()).toBe('Die nächste Stufe ist niedrig.')
    expect(w.find('.gm-man').attributes('aria-label')).toBe('Der Mann auf Stufe 0 von 4')
    expect(problems()).toEqual([])
  })

  it('the wrong leap: a cross, "Schau die Stufe an!", a low tone, a mistake; he stays where he is and never falls', async () => {
    const w = mountIt()
    await w.find('[data-choice="big"]').trigger('click')
    expect(w.find('.gm-man').classes()).toContain('bounce')
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Schau die Stufe an!')
    await tick(1000)
    expect(w.find('.gm-man').attributes('aria-label')).toBe('Der Mann auf Stufe 0 von 4')
    await press(w, 'small')
    await w.find('[data-choice="small"]').trigger('click')
    expect(w.find('.gm-man').classes()).toContain('hop')
    expect(count('wrong')).toBe(2)
  })

  it('both rounds: on the landing he praises God; the end gives the verse and the stars', async () => {
    const w = mountIt()
    await press(w, 'small')
    await press(w, 'big')
    await press(w, 'small')
    await press(w, 'small')
    expect(w.text()).toContain('Oben an der Schönen Tür!')
    await tick(2500)
    expect(w.text()).toContain('Runde 2 von 2')
    expect(w.findAll('[data-choice]')).toHaveLength(3)
    await press(w, 'small')
    await press(w, 'small')
    expect(w.text()).toContain('Hier ist ein Absatz. Hier lobt er Gott.')
    await press(w, 'praise')
    await press(w, 'big')
    await press(w, 'small')
    await press(w, 'big')
    expect(useTaskProgress().parts.value).toBe(9)
    await tick(2500)
    expect(w.text()).toContain('wandelte und sprang und lobte Gott')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(1)])
  })

  it('the keys: right arrow is the small leap, up arrow the big one', async () => {
    const w = mountIt()
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    await tick(1000)
    await w.find('.gm-field').trigger('keydown', { key: 'ArrowUp' })
    await tick(1000)
    expect(w.find('.gm-man').attributes('aria-label')).toBe('Der Mann auf Stufe 2 von 4')
    expect(count('wrong')).toBe(0)
  })

  it('"Help me" after fifteen seconds marks the fitting button; less motion takes away the leaps', async () => {
    const w = mountIt()
    await tick(16000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.find('[data-choice="small"]').classes()).toContain('help')
    expect(w.text()).toContain('Die Stufe ist niedrig: ein kleiner Sprung.')
    lessMotion()
    const s = mountIt()
    expect(s.find('.gm').classes()).toContain('still')
  })

  it('English words', () => {
    const w = mountIt('en')
    expect(w.find('[data-choice="big"]').text()).toContain('big leap')
  })
})

// ---------------------------------------------------------------- wagen
describe('Den Wagen einholen (wagen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameWagen, { props: { game: CHARIOT }, ...opts(locale) })
  const runnerX = (w: Wr) => parseFloat((w.find('.gm-runner').element as HTMLElement).style.left)
  /** Keeps the finger on the middle of the window zone for `ms` milliseconds. */
  const follow = async (w: Wr, ms: number) => {
    pointer(w.find('.gm-field').element, 'pointerdown', 40)
    for (let t = 0; t < ms; t += 200) {
      const z = w.find('.gm-zone')
      if (z.exists()) {
        const st = (z.element as HTMLElement).style
        pointer(window, 'pointermove', parseFloat(st.left) + parseFloat(st.width) / 2)
      }
      await tick(200)
    }
  }

  it('the goal is four quarters of the scroll a round; Philip, the chariot, the zone and the scroll are pictures', () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(8)
    expect(w.find('.gm-runner').attributes('aria-label')).toBe('Philippus')
    expect(w.find('.gm-wagon').attributes('aria-label')).toContain('Kämmerer')
    expect(w.find('.gm-scroll').attributes('aria-label')).toBe('Schriftrolle: 0 Prozent')
    expect(w.find('svg').exists()).toBe(false)
    expect(problems()).toEqual([])
  })

  it('at the window the scroll fills; far from the chariot only a word after three seconds (no mistake)', async () => {
    const w = mountIt()
    await tick(4000)
    expect(w.text()).toContain('Lauf zum Wagen!')
    expect(count('wrong')).toBe(0)
    pointer(w.find('.gm-field').element, 'pointerdown', 40)
    await tick(1500)
    expect(w.find('.gm-runner').attributes('data-where')).toBe('zone')
    expect(w.find('.gm-runner').attributes('aria-label')).toBe('Philippus am Fenster des Wagens. Er hört ihn lesen.')
    await tick(2000)
    expect(useTaskProgress().parts.value).toBeGreaterThanOrEqual(1)
  })

  it('in front of the horses: a cross, "Nicht vor die Pferde!", a low tone, a mistake, and Philip steps back', async () => {
    const w = mountIt()
    await tick(700)
    pointer(w.find('.gm-field').element, 'pointerdown', 90)
    await tick(2000)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Nicht vor die Pferde!')
    expect(runnerX(w)).toBeLessThan(60)
  })

  it('both rounds played through: the chariot stops at the end, the verse, the stars', async () => {
    const w = mountIt()
    await tick(700)
    await follow(w, 5200)
    expect(w.text()).toContain('Philippus hat alles gehört!')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2900)
    expect(w.text()).toContain('Runde 2 von 2')
    await follow(w, 7000)
    expect(useTaskProgress().parts.value).toBe(8)
    await tick(1600)
    expect(w.find('.gm-end').exists()).toBe(true)
    expect(w.text()).toContain('Der Wagen hält, und der Kämmerer lässt Philippus aufsteigen.')
    await tick(3200)
    expect(w.text()).toContain('Verstehst du auch, was du liesest?')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
  })

  it('the arrow keys move Philip; "Help me" after fifteen seconds takes him to the window', async () => {
    const w = mountIt()
    await tick(700)
    const before = runnerX(w)
    for (let k = 0; k < 4; k++) await w.find('.gm-field').trigger('keydown', { key: 'ArrowRight' })
    await tick(1000)
    expect(runnerX(w)).toBeGreaterThan(before + 10)
    await tick(16000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.find('.gm-zone').classes()).toContain('help')
    await tick(1500)
    expect(w.find('.gm-runner').attributes('data-where')).toBe('zone')
  })

  it('less motion: the landscape stands still; English words', async () => {
    lessMotion()
    const w = mountIt()
    expect(w.find('.gm').classes()).toContain('still')
    await tick(2000)
    expect((w.find('.gm-far').element as HTMLElement).style.transform).toBe('translateX(-0%)')
    const en = mountIt('en')
    expect(en.find('.gm-runner').attributes('aria-label')).toBe('Philip')
  })
})

// ---------------------------------------------------------------- spaehen
describe('Durchs Tor spähen (spaehen)', () => {
  const mountIt = (locale: 'de' | 'en' | 'es' = 'de') => mount(GameSpaehen, { props: { game: PEEK }, ...opts(locale) })
  const tapGate = async (w: Wr) => {
    await w.find('.gm-field').trigger('click')
    await flushPromises()
  }

  it('every round begins with the voice at the gate (a word, no recording); the goal is every person; the gate is a picture over the lane', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.text()).toContain('Rhode hört eine Stimme am Tor …')
    expect(w.find('.gm-field').attributes('role')).toBe('button')
    expect(w.find('.gm-gate').exists()).toBe(true)
    expect(w.text()).toContain('Das ist Petrus!')
    expect(problems()).toEqual([])
  })

  it('nobody at the gate: only a word; someone else: a cross, a word, a low tone, a mistake', async () => {
    const w = mountIt()
    await tick(1850)
    await tapGate(w)
    expect(w.text()).toContain('Da steht gerade niemand am Tor.')
    await tick(1000)
    expect(w.find('[data-person="frau-1"]').exists()).toBe(true)
    await tapGate(w)
    expect(count('wrong')).toBe(1)
    expect(w.text()).toContain('Das ist nicht Petrus. Schau genau hin!')
  })

  it('both rounds: someone who waits is left alone (a small tick), Peter knocks again and his marks are shown; the gate opens at the end', async () => {
    const w = mountIt()
    // round 1: the woman walks past, the man stops and knocks, waits and walks on, then Peter
    await tick(1800 + 2600 + 400 + 1300)
    expect(w.find('[data-person="mann-1"]').exists()).toBe(true)
    expect(count('tap')).toBe(1)
    await tick(2000 + 1400)
    expect(w.text()).toContain('Gut gewartet.')
    await tick(400 + 1300)
    expect(w.find('[data-person="petrus"]').exists()).toBe(true)
    await tapGate(w)
    expect(count('right')).toBe(1)
    expect(w.text()).toContain('vor lauter Freude macht sie nicht auf!')
    await tick(3900)
    expect(w.text()).toContain('Runde 2 von 2')
    // round 2: wait for Peter and let him knock twice
    await tick(1800 + 2600 + 400 + 1300 + 2000 + 1400 + 400 + 2600 + 400 + 1300)
    expect(w.find('[data-person="petrus"]').exists()).toBe(true)
    await tick(2100)
    expect(w.find('.gm-marks').exists()).toBe(true)
    expect(w.text()).toContain('Petrus klopft weiter.')
    expect(count('wrong')).toBe(0)
    await w.find('.gm-field').trigger('keydown', { key: 'Enter' })
    await tick(1700)
    expect(w.find('.gm-open').exists()).toBe(true)
    await tick(3000)
    expect(w.text()).toContain('Und als sie des Petrus Stimme erkannte, tat sie das Tor nicht auf vor Freuden')
    await w.find('button').trigger('click')
    expect(w.emitted('done')![0]).toEqual([osterStars(0)])
    expect(useTaskProgress().parts.value).toBe(7)
  })

  it('"Help me" after fifteen seconds shows the three marks of Peter with words', async () => {
    // slow walkers, so that Peter is not at the gate yet (at his second knock the marks show by themselves)
    const w = mount(GameSpaehen, { props: { game: { ...PEEK, walkMs: 30000 } }, ...opts('de') })
    await tick(17000)
    await w.findAll('button').find((b) => b.text() === 'Hilf mir')!.trigger('click')
    expect(w.findAll('.gm-marktile')).toHaveLength(3)
    expect(w.text()).toContain('Lockenbart')
    expect(w.find('.gm-field').classes()).toContain('glow')
  })

  it('less motion: the people appear at the gate without walking; the knock is shown as a word', async () => {
    lessMotion()
    const w = mountIt()
    await tick(1850)
    expect((w.find('[data-person="frau-1"]').element as HTMLElement).style.left).toBe('50%')
    await tick(1500 + 450)
    expect(w.find('[data-person="mann-1"]').exists()).toBe(true)
    expect(w.find('.gm-knock').text()).toBe('Klopf, klopf')
  })

  it('English words', () => {
    const w = mountIt('en')
    expect(w.text()).toContain('That is Peter!')
    expect(w.text()).toContain('Rhoda hears a voice at the gate …')
  })
})
