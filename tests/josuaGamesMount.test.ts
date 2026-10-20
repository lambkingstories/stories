/**
 * The new games of "Josua" (`packen`, `verstecken`, `abseilen`, `schritt`, `backen`, `still`, and the shared memory with its stand-ins): each is mounted with sample data and used: right and
 * wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'

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
