/**
 * The new games of "Elisha and Naaman" (`kruege`, `tauchen`): each is mounted with sample data and used: right and wrong moves, the rounds, the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars,
 * German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import GameJars from '@/components/molecules/games/GameJars.vue'
import GameDive from '@/components/molecules/games/GameDive.vue'
import type { DiveGame, JarGame } from '@/types/adventure'

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

const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = (locale: 'de' | 'en' = 'de') => ({ global: { plugins: [mk(locale)], stubs: { RouterLink: true } }, attachTo: document.body })

let warnings: string[] = []
beforeEach(() => {
  played.length = 0
  warnings = []
  useTaskProgress().reset()
  vi.useFakeTimers()
  // the pouring measures the time with performance.now(): let it follow the fake clock
  vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
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
const problems = () => warnings.filter((w) => /not defined on instance|is not a function|Unhandled error|ERROR/.test(w))
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
const box400x300 = () => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
const ptr = async (el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }))
  await flushPromises()
}

// ---------------------------------------------------------------- fill the jars
describe('Krüge füllen (kruege)', () => {
  const game: JarGame = {
    background: 'images/x/hof.webp',
    jars: ['images/x/krug-1.webp', 'images/x/krug-2.webp'],
    jug: 'images/x/kanne.webp',
    jugW: 15,
    jugStart: { x: 50, y: 20 },
    rounds: [
      { hint: 'Ziehe die Kanne über den Krug.', jars: [{ x: 50, y: 85, w: 20, sprite: 0, ms: 1000 }] },
      { hint: 'Jetzt zwei Krüge.', jars: [{ x: 28, y: 85, w: 18, sprite: 1, ms: 1000 }, { x: 72, y: 85, w: 18, sprite: 0, ms: 1000 }] }
    ]
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => {
    box400x300()
    return mount(GameJars, { props: { game }, ...opts(locale) })
  }
  /** Takes the jug with a finger and holds it at a place (percent of the picture), without letting go. */
  const hold = async (w: ReturnType<typeof mountIt>, xPct: number, yPct = 20) => {
    const field = w.find('.gm-field').element
    await ptr(field, 'pointerdown', (xPct / 100) * 400, (yPct / 100) * 300)
  }
  const moveTo = async (w: ReturnType<typeof mountIt>, xPct: number, yPct = 20) => {
    await ptr(w.find('.gm-field').element, 'pointermove', (xPct / 100) * 400, (yPct / 100) * 300)
  }

  it('the goal is every jar of all rounds; the hint, the jars and the jug are there; the jug does not pour before it is touched', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.text()).toContain('Ziehe die Kanne über den Krug.')
    expect(w.findAll('.gm-jar')).toHaveLength(1)
    expect(w.find('img.gm-jug').exists()).toBe(true)
    expect(w.find('.gm-count').text()).toContain('0')
    // the jug hangs over the jar at the start, but nothing is poured until it is grabbed
    await tick(3000)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(played).not.toContain('wrong')
    expect(problems()).toEqual([])
  })

  it('the jug over a jar fills it in its time (the oil rises, a sound, a part done); round one is over and round two comes', async () => {
    const w = mountIt()
    await hold(w, 50)
    await tick(500)
    expect(w.find('.gm-oil').attributes('style')).toContain('--f')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(700)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.gm-jar').classes()).toContain('full')
    await tick(2000)
    expect(w.text()).toContain('Jetzt zwei Krüge.')
    expect(w.findAll('.gm-jar')).toHaveLength(2)
    expect(problems()).toEqual([])
  })

  it('oil that goes on into a full jar spills over: a cross, a word, one mistake for the jar; moving on works', async () => {
    const w = mountIt()
    await hold(w, 50)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(1)
    // the last jar of the round is full and the round ends; make the spill in round two: hold the jug over the first jar for much longer than it takes
    await tick(2000)
    await ptr(w.find('.gm-field').element, 'pointerup', 200, 60)
    await hold(w, 28)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(2)
    await tick(700)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Zu viel')
    expect(w.find('.gm-cross').exists()).toBe(true)
    await moveTo(w, 72)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(3)
  })

  it('both rounds and the end: no mistake gives three stars', async () => {
    const w = mountIt()
    await hold(w, 50)
    await tick(1100)
    await tick(2000)
    await ptr(w.find('.gm-field').element, 'pointerup', 200, 60)
    await hold(w, 28)
    await tick(1100)
    await moveTo(w, 72)
    await tick(1100)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.text()).toContain('Es ist kein Krug mehr da')
    await tick(3000)
    expect(w.text()).toContain('Alle Krüge sind voll Öl')
    expect(w.findAll('.gm-jar')).toHaveLength(0)
    expect(problems()).toEqual([])
  })

  it('the arrow keys move the jug in steps', async () => {
    const w = mountIt()
    const field = w.find('.gm-field')
    for (let i = 0; i < 4; i++) await field.trigger('keydown', { key: 'ArrowLeft' })
    await field.trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('img.gm-jug').attributes('style')).toContain('left: 35%')
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    expect(w.find('.gm-count').text()).toContain('Jars full')
    await hold(w, 50)
    await tick(1100)
    expect(w.text()).toContain('The jar is full')
  })
})

// ---------------------------------------------------------------- dip seven times
describe('Siebenmal untertauchen (tauchen)', () => {
  const game: DiveGame = {
    background: 'images/x/jordan.webp',
    naaman: 'images/x/naaman.webp',
    naamanNew: 'images/x/naaman-neu.webp',
    ripple: 'images/x/welle.webp',
    pos: { x: 50, y: 80, w: 34 },
    ripplePos: { x: 50, y: 74, w: 50 },
    dips: 3,
    underMs: 900,
    calmMs: 1800,
    hint: 'Tippe, wenn das Wasser ruhig ist.'
  }
  const mountIt = (locale: 'de' | 'en' = 'de') => mount(GameDive, { props: { game }, ...opts(locale) })
  const tap = async (w: ReturnType<typeof mountIt>) => {
    await w.find('.gm-tap').trigger('click')
    await flushPromises()
  }

  it('the goal is every dip; the hint, the river, Naaman and the button (calm) are there', async () => {
    const w = mountIt()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.text()).toContain('Tippe, wenn das Wasser ruhig ist.')
    expect(w.find('img.gm-man').attributes('src')).toContain('naaman.webp')
    expect(w.find('.gm-tap').classes()).toContain('calm')
    expect(w.find('.gm-count').text()).toContain('0')
    expect(problems()).toEqual([])
  })

  it('a tap in calm water dips him: he sinks, comes up, a ring runs, the dip counts; the water is calm again after the ring', async () => {
    const w = mountIt()
    await tap(w)
    expect(w.find('img.gm-man').classes()).toContain('under')
    // a tap under water is ignored
    await tap(w)
    expect(played).not.toContain('wrong')
    await tick(950)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('img.gm-ring').exists()).toBe(true)
    expect(w.find('.gm-tap').classes()).not.toContain('calm')
    await tick(1850)
    expect(w.find('img.gm-ring').exists()).toBe(false)
    expect(w.find('.gm-tap').classes()).toContain('calm')
  })

  it('a tap while the ring runs is too early: a cross, a word, one mistake, and the dip does not count', async () => {
    const w = mountIt()
    await tap(w)
    await tick(950)
    await tap(w)
    expect(played).toContain('wrong')
    expect(w.text()).toContain('Noch nicht')
    expect(w.find('.gm-cross').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1900)
    await tap(w)
    await tick(950)
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('all dips: Naaman comes up well with raised arms (the second picture), then the end; one mistake still gives two stars at most', async () => {
    const w = mountIt()
    for (let i = 0; i < 3; i++) {
      await tap(w)
      await tick(950)
      if (i === 0) {
        await tap(w)
      }
      if (i < 2) await tick(1900)
    }
    expect(useTaskProgress().parts.value).toBe(3)
    expect(w.find('img.gm-man').attributes('src')).toContain('naaman-neu.webp')
    expect(w.find('.gm-tap').attributes('disabled')).toBeDefined()
    await tick(3000)
    expect(w.text()).toContain('Naaman ist gesund')
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = mountIt('en')
    expect(w.find('.gm-count').text()).toContain('Dips')
    expect(w.find('.gm-tap').text()).toContain('The water is calm')
    await tap(w)
    expect(w.find('.gm-tap').text()).toContain('Naaman dips under')
  })
})
