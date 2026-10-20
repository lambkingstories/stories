/**
 * The new games of "Gideon" (`wort`, `tau`, `worfeln`, `weiche`, `zeichen`, `hoehle`, `schleichen`, and the shared hidden-picture game with its stand-ins): each is mounted with sample data and
 * used: right and wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { WordGame } from '@/types/adventure'

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



// ---------------------------------------------------------------- lay the word
describe('Das Wort legen (word)', () => {
  const game: WordGame = {
    background: 'images/x/altar.webp',
    rounds: [
      { hint: 'Runde eins.', word: 'FRIEDE', extra: ['T', 'L'] },
      { hint: 'Runde zwei.', word: 'FELSEN', extra: ['A', 'M'] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Word } = await import('@/components/molecules/games/GameWord.vue')
    const w = mount(Word, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  /** Choose a tile with this letter (a press and a release without moving), then tap the box. */
  const lay = async (w: W, letter: string, box: number) => {
    const el = w.findAll('.wd-tile').find((x) => x.text() === letter)!.element
    el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 5, clientY: 5 }))
    window.dispatchEvent(new MouseEvent('pointerup', { clientX: 5, clientY: 5 }))
    await flushPromises()
    await w.find(`[data-drop="box-${box}"]`).trigger('click')
    await flushPromises()
  }
  const wordOne = async (w: W) => {
    for (const [i, l] of 'FRIEDE'.split('').entries()) await lay(w, l, i)
  }
  const wordTwo = async (w: W) => {
    for (const [i, l] of 'FELSEN'.split('').entries()) await lay(w, l, i)
  }

  it('the goal is every letter of both words; six boxes, eight tiles (two too many), the hint is the beginning of the sentence', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(12)
    expect(w.find('.wd-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.wd-box')).toHaveLength(6)
    expect(w.findAll('.wd-tile')).toHaveLength(8)
    expect(w.find('.wd-hint').text()).toBe('Runde eins.')
    expect(w.findAll('.wd-tile').map((x) => x.text()).sort()).toEqual(['D', 'E', 'E', 'F', 'I', 'L', 'R', 'T'])
  })

  it('the right letter at the right place clicks in with a tick; the tile is gone from the tray', async () => {
    const w = await open()
    await lay(w, 'F', 0)
    expect(w.find('[data-drop="box-0"]').text()).toContain('F')
    expect(w.find('[data-drop="box-0"]').classes()).toContain('filled')
    expect(w.findAll('.wd-tile')).toHaveLength(7)
    expect(played).toContain('snap')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a wrong letter wobbles back with a cross and a mistake; nothing is laid', async () => {
    const w = await open()
    await lay(w, 'T', 0)
    expect(played).toContain('wrong')
    expect(w.find('.wd-fb').text()).toContain('passt hier nicht')
    expect(w.find('.wd-tile.wobble').exists()).toBe(true)
    expect(w.findAll('.wd-tile')).toHaveLength(8)
    expect(w.find('[data-drop="box-0"]').classes()).not.toContain('filled')
    expect(w.find('.gm.bad').exists()).toBe(true)
  })

  it('a letter that is in the word twice: both E tiles fit, in the third and the sixth box', async () => {
    const w = await open()
    await lay(w, 'E', 3)
    await lay(w, 'E', 5)
    expect(w.find('[data-drop="box-3"]').text()).toContain('E')
    expect(w.find('[data-drop="box-5"]').text()).toContain('E')
    expect(played).not.toContain('wrong')
  })

  it('the tip lays the letter of the first empty box and counts as a tip', async () => {
    const w = await open()
    await lay(w, 'F', 0)
    await w.find('.wd-tip').trigger('click')
    expect(w.find('[data-drop="box-1"]').text()).toContain('R')
    expect(useTaskProgress().parts.value).toBe(2)
  })

  it('the whole word: it shines; after a while the second word begins with six new boxes', async () => {
    const w = await open()
    await wordOne(w)
    expect(w.find('.wd-boxes').classes()).toContain('shine')
    expect(played).toContain('star')
    expect(useTaskProgress().parts.value).toBe(6)
    await tick(1900)
    expect(w.find('.wd-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.wd-tile').map((x) => x.text()).sort()).toEqual(['A', 'E', 'E', 'F', 'L', 'M', 'N', 'S'])
    expect(w.find('.wd-boxes').classes()).not.toContain('shine')
  })

  it('the whole game: the end with three stars; mistakes and tips together give the stars (up to two: three, up to six: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 2], [7, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await lay(w, 'T', 0)
      await wordOne(w)
      await tick(1900)
      await wordTwo(w)
      await tick(1500)
      expect(useTaskProgress().parts.value).toBe(12)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.wd-box').attributes('aria-label')).toBe('Box 1, empty')
    expect(w.find('.wd-tip').text()).toBe('Tip')
    await lay(w, 'T', 0)
    expect(w.find('.wd-fb').text()).toBe('This letter does not fit here.')
  })
})
