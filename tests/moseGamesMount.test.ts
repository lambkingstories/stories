/**
 * The new games of "Mose" (`worte`, `unterschied`, `manna`, `wolke`, `flechten`, `leuchten`, `takt`, and the shared packing, verse and hidden-picture games with their stand-ins): each is mounted with
 * sample data and used: right and wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { WordsGame } from '@/types/adventure'

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




// ---------------------------------------------------------------- put the words in order
describe('Worte ordnen (words)', () => {
  const game: WordsGame = {
    background: 'images/x/sinai.webp',
    chip: 'images/x/chip.webp',
    strip: 'images/x/strip.webp',
    rounds: [
      { hint: 'Runde eins.', sentences: ['Du sollst nicht töten.', 'Ehre Vater und Mutter.'] },
      { hint: 'Runde zwei.', sentences: ['Halte den Ruhetag heilig.'] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Words } = await import('@/components/molecules/games/GameWords.vue')
    const w = mount(Words, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Choose the chip with this word (a press and a release without moving), then tap the strip. */
  const lay = async (w: W, word: string) => {
    const el = w.findAll('.ww-chip').find((x) => x.text() === word)!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find('.ww-strip').trigger('click')
    await flushPromises()
  }
  const sentence = async (w: W, text: string) => {
    for (const word of text.split(' ')) await lay(w, word)
  }

  it('the goal is every sentence of both rounds; the chips lie in a mixed order that is not the right one; the strip has a gap for every word', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(3)
    expect(w.find('.ww-round').text()).toContain('Runde 1 von 2')
    const chips = w.findAll('.ww-chip').map((x) => x.text())
    expect([...chips].sort()).toEqual(['Du', 'nicht', 'sollst', 'töten.'].sort())
    expect(chips.join(' ')).not.toBe('Du sollst nicht töten.')
    expect(w.findAll('.ww-gap')).toHaveLength(4)
    expect(w.find('.ww-count').text()).toBe('Sätze geordnet: 0 von 3')
  })

  it('the right next word stays in the strip (a tick); the chip is gone from the stone', async () => {
    const w = await open()
    await lay(w, 'Du')
    expect(w.findAll('.ww-word').map((x) => x.text())).toEqual(['Du'])
    expect(w.findAll('.ww-chip')).toHaveLength(3)
    expect(w.findAll('.ww-gap')).toHaveLength(3)
    expect(played).toContain('snap')
  })

  it('a wrong word wobbles back with a cross and a mistake; nothing is laid', async () => {
    const w = await open()
    await lay(w, 'töten.')
    expect(played).toContain('wrong')
    expect(w.find('.ww-chip.wobble').exists()).toBe(true)
    expect(w.find('.ww-fb').text()).toContain('kommt noch nicht')
    expect(w.findAll('.ww-word')).toHaveLength(0)
    expect(w.findAll('.ww-chip')).toHaveLength(4)
  })

  it('the tip lays the next word and counts as a tip', async () => {
    const w = await open()
    await lay(w, 'Du')
    await w.find('.ww-tip').trigger('click')
    expect(w.findAll('.ww-word').map((x) => x.text())).toEqual(['Du', 'sollst'])
  })

  it('the whole sentence: it shines with a star and the point is counted; after a while the next sentence begins with new chips', async () => {
    const w = await open()
    await sentence(w, 'Du sollst nicht töten.')
    expect(w.find('.ww-strip').classes()).toContain('shine')
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(1200)
    expect(w.findAll('.ww-word')).toHaveLength(0)
    expect(w.findAll('.ww-chip').map((x) => x.text()).sort()).toEqual(['Ehre', 'Mutter.', 'Vater', 'und'].sort())
    expect(w.find('.ww-count').text()).toBe('Sätze geordnet: 1 von 3')
  })

  it('both sentences of round 1 end the round; round 2 begins after a while', async () => {
    const w = await open()
    await sentence(w, 'Du sollst nicht töten.')
    await tick(1200)
    await sentence(w, 'Ehre Vater und Mutter.')
    await tick(1200)
    await tick(1500)
    expect(w.find('.ww-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.ww-chip')).toHaveLength(4)
  })

  it('the whole game: the end with three stars; mistakes and tips together give the stars (up to three: three, up to eight: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [3, 3], [4, 2], [8, 2], [9, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await lay(w, 'töten.')
      await sentence(w, 'Du sollst nicht töten.')
      await tick(1200)
      await sentence(w, 'Ehre Vater und Mutter.')
      await tick(2800)
      await sentence(w, 'Halte den Ruhetag heilig.')
      await tick(1200)
      expect(useTaskProgress().parts.value).toBe(3)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.ww-count').text()).toBe('Sentences put in order: 0 of 3')
    expect(w.find('.ww-tip').text()).toBe('Tip')
    await lay(w, 'töten.')
    expect(w.find('.ww-fb').text()).toBe('This word does not come yet.')
  })
})
