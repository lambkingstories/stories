/**
 * The focus game of "Abraham" (stage 12, `GameFocus`): the picture lies blurred under a slider; the slider clicks into place near the right spot, the round is done, the next one starts blurred again, and the
 * game ends with three stars (no mistake is possible). Mounted with sample data, in German and English.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { FocusGame } from '@/types/adventure'

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

beforeEach(() => {
  played.length = 0
  useTaskProgress().reset()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
const tick = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}

describe('Ins Weite schauen (focus)', () => {
  const game: FocusGame = {
    rounds: [
      { hint: 'Runde eins.', image: 'images/x/far.webp', sharpAt: 70 },
      { hint: 'Runde zwei.', image: 'images/x/near.webp', sharpAt: 30 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Focus } = await import('@/components/molecules/games/GameFocus.vue')
    const w = mount(Focus, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const slide = async (w: W, v: number) => {
    const input = w.find('.fc-slider')
    ;(input.element as HTMLInputElement).value = String(v)
    await input.trigger('input')
  }
  const blurOf = (w: W) => Number(/blur\(([\d.]+)px\)/.exec(w.find('.fc-pic').attributes('style') ?? '')![1])

  it('the goal is both pictures; the slider starts far from the right place and the picture is blurred', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(2)
    expect(w.find('.fc-round').text()).toContain('Runde 1 von 2')
    expect((w.find('.fc-slider').element as HTMLInputElement).value).toBe('8')
    expect(blurOf(w)).toBeGreaterThan(10)
    expect(w.find('.fc-count').text()).toBe('Bilder scharf gestellt: 0 von 2')
  })

  it('the nearer the slider comes the sharper the picture; far away it is blurred again', async () => {
    const w = await open()
    await slide(w, 30)
    const a = blurOf(w)
    await slide(w, 55)
    const b = blurOf(w)
    await slide(w, 5)
    const c = blurOf(w)
    expect(b).toBeLessThan(a)
    expect(a).toBeLessThan(c)
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('within eight percent it clicks into place: sharp, a tick, the slider is locked; the next round starts blurred at the other end', async () => {
    const w = await open()
    await slide(w, 63)
    expect(blurOf(w)).toBe(0)
    expect((w.find('.fc-slider').element as HTMLInputElement).value).toBe('70')
    expect(w.find('.fc-slider').attributes('disabled')).toBeDefined()
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('found')
    expect(w.find('.fc-fb').text()).toContain('scharf')
    await tick(3000)
    expect(w.find('.fc-round').text()).toContain('Runde 2 von 2')
    expect((w.find('.fc-slider').element as HTMLInputElement).value).toBe('92')
    expect(blurOf(w)).toBeGreaterThan(10)
    expect(w.find('.fc-slider').attributes('disabled')).toBeUndefined()
  })

  it('a place a little too far (nine percent) does not click into place', async () => {
    const w = await open()
    await slide(w, 61)
    expect(useTaskProgress().parts.value).toBe(0)
    expect(blurOf(w)).toBeGreaterThan(0)
  })

  it('the whole game ends with three stars, there is no way to make a mistake', async () => {
    const w = await open()
    await slide(w, 70)
    await tick(3000)
    await slide(w, 33)
    await tick(2000)
    expect(useTaskProgress().parts.value).toBe(2)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(played).not.toContain('wrong')
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.fc-count').text()).toBe('Pictures in focus: 0 of 2')
    await slide(w, 70)
    expect(w.find('.fc-fb').text()).toBe('Now the picture is sharp!')
  })
})
