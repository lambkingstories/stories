/**
 * The new games of "Josua" (`packen`, `verstecken`, `abseilen`, `schritt`, `backen`, `still`, and the shared memory with its stand-ins): each is mounted with sample data and used: right and
 * wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { StepGame } from '@/types/adventure'

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
const boxOf100 = () => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}) })


// ---------------------------------------------------------------- the memory with cards that are not painted yet
describe('Memory with cards that are not painted yet', () => {
  it('a card whose picture cannot be loaded is a plain card in its place; the game works the same', async () => {
    const { josua } = await import('@/data/adventures/josua')
    const { default: Memory } = await import('@/components/molecules/games/GameMemory.vue')
    const w = mount(Memory, { ...opts(), props: { game: josua.stages[4]!.task.memory! } })
    await flushPromises()
    expect(w.findAll('.mem-card')).toHaveLength(12)
    expect(w.findAll('img.mem-face')).toHaveLength(24)
    for (const img of w.findAll('img.mem-face')) await img.trigger('error')
    await flushPromises()
    expect(w.findAll('img.mem-face')).toHaveLength(0)
    expect(w.findAll('.mem-stand.mem-front')).toHaveLength(12)
    expect(w.findAll('.mem-stand.back')).toHaveLength(12)
    // two cards of one pair have the same colour
    const colours = w.findAll('.mem-stand.mem-front').map((x) => x.attributes('style'))
    expect(new Set(colours).size).toBe(6)
    await w.findAll('.mem-card')[0]!.trigger('click')
    expect(w.findAll('.mem-card.up')).toHaveLength(1)
    expect(problems()).toEqual([])
  })
})

// ---------------------------------------------------------------- in step
describe('Im Gleichschritt (step)', () => {
  const game: StepGame = {
    background: 'images/x/riverbed.webp',
    bearers: 'images/x/ark.webp',
    print: 'images/x/print.webp',
    path: [[50, 90], [50, 60], [50, 30]],
    rounds: [
      { hint: 'Runde eins.', bpm: 60, steps: 3, tolerance: 0.3 },
      { hint: 'Runde zwei.', bpm: 120, steps: 2, tolerance: 0.25 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Step } = await import('@/components/molecules/games/GameStep.vue')
    const w = mount(Step, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const press = async (w: W) => {
    await w.find('.st-go').trigger('click')
    await flushPromises()
  }
  /** Start the round: from here the first beat is 1.5 seconds away, then one second each (60 a minute). */
  const start = async (w: W) => {
    await press(w)
  }
  const bearerTop = (w: W) => /top: ([\d.]+)%/.exec(w.find('.st-bearers').attributes('style') ?? '')![1]
  /** A whole round of three right steps. */
  const roundOne = async (w: W) => {
    await start(w)
    await tick(1500)
    await press(w)
    await tick(1000)
    await press(w)
    await tick(1000)
    await press(w)
  }
  /** Round 2: two steps at 120 a minute (half a second apart). */
  const roundTwo = async (w: W) => {
    await start(w)
    await tick(1500)
    await press(w)
    await tick(500)
    await press(w)
  }

  it('the goal is every step of both rounds; the footprints lie on the path, the button says "Start", nothing is walked yet', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.st-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.st-print')).toHaveLength(3)
    expect(w.find('.st-go').text()).toBe('Start')
    expect(w.find('.st-count').text()).toBe('Schritte: 0 von 3')
    expect(w.find('.st-print.next').exists()).toBe(true)
  })

  it('a tap before the first beat is no mistake', async () => {
    const w = await open()
    await start(w)
    expect(w.find('.st-go').text()).toBe('Schritt!')
    await press(w)
    await tick(300)
    await press(w)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('a tap on the beat is a step: a tick, a soft tone, the bearers go on, the next footprint is next', async () => {
    const w = await open()
    const before = bearerTop(w)
    await start(w)
    await tick(1500)
    await press(w)
    expect(played).toContain('right')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.st-count').text()).toBe('Schritte: 1 von 3')
    expect(w.find('.st-mark').exists()).toBe(true)
    expect(Number(bearerTop(w))).toBeLessThan(Number(before))
    expect(w.findAll('.st-print.done')).toHaveLength(1)
  })

  it('a tap between the beats is a cross, a wobble and a mistake; so is a second tap on the same beat', async () => {
    const w = await open()
    await start(w)
    await tick(2000)
    await press(w)
    expect(played).toContain('wrong')
    expect(w.find('.st-bearers').classes()).toContain('wobble')
    expect(w.find('.st-fb').text()).toContain('Nicht im Takt')
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(500)
    played.length = 0
    await press(w)
    expect(played).not.toContain('wrong')
    await press(w)
    expect(played).toContain('wrong')
  })

  it('beats that nobody taps cost nothing: they just go on', async () => {
    const w = await open()
    await start(w)
    await tick(15000)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('after five wrong taps the beat gets more room: a tap that was too far off is in time now', async () => {
    const w = await open()
    await start(w)
    await tick(2000)
    for (let i = 0; i < 5; i++) await press(w)
    expect(w.find('.st-fb').text()).toContain('Ruhiger Takt')
    // 0.4 seconds after a beat: too far for 0.3, in time for 0.45
    await tick(1900)
    expect(useTaskProgress().parts.value).toBe(0)
    await tick(0)
    await press(w)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('"Show the beat" shows a bar that fills up to the next beat', async () => {
    const w = await open()
    expect(w.find('.st-bar').exists()).toBe(false)
    await w.findAll('.st-actions button')[1]!.trigger('click')
    expect(w.find('.st-bar').exists()).toBe(true)
    await start(w)
    await tick(2000)
    expect(w.find('.st-bar-fill').attributes('style')).toMatch(/width: (4[5-9]|5[0-5])%/)
  })

  it('three right steps end round 1; round 2 asks for "Start" again with two steps at a quicker beat', async () => {
    const w = await open()
    await roundOne(w)
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(1800)
    expect(w.find('.st-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.st-go').text()).toBe('Start')
    expect(w.find('.st-count').text()).toBe('Schritte: 0 von 2')
    expect(w.findAll('.st-print')).toHaveLength(2)
  })

  it('the whole game: the end with three stars; the wrong taps give the stars (up to three: three, up to eight: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await start(w)
      await tick(2000)
      // the wrong taps are all on one spot between the beats
      for (let i = 0; i < wrong; i++) await press(w)
      await tick(500)
      await press(w)
      await tick(1000)
      await press(w)
      await tick(1000)
      await press(w)
      await tick(1800)
      await roundTwo(w)
      await tick(1100)
      expect(useTaskProgress().parts.value).toBe(5)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.st-count').text()).toBe('Steps: 0 of 3')
    expect(w.findAll('.st-actions button')[1]!.text()).toBe('Show the beat')
    await start(w)
    expect(w.find('.st-go').text()).toBe('Step!')
  })
})
