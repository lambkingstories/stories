/**
 * The new games of "Gideon" (`wort`, `tau`, `worfeln`, `weiche`, `zeichen`, `hoehle`, `schleichen`, and the shared hidden-picture game with its stand-ins): each is mounted with sample data and
 * used: right and wrong moves, the rounds (at most two), the goal for the stars of "Go on" (`useTaskProgress`), the end with its stars, German and English words.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import type { CueGame, DewGame, SwitchGame, WinnowGame, WordGame } from '@/types/adventure'

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

// ---------------------------------------------------------------- the hidden-picture game and the memory with pictures that are not painted yet
describe('Wimmelbild and Memory with pictures that are not painted yet', () => {
  it('a picture that cannot be loaded is a plain shape in its place: the scene, the men and the covers; a man can be found all the same', async () => {
    const { gideon } = await import('@/data/adventures/gideon')
    const { default: Find } = await import('@/components/molecules/games/GameFind.vue')
    const w = mount(Find, { ...opts(), props: { game: gideon.stages[7]!.task.find! } })
    await flushPromises()
    expect(w.findAll('img')).toHaveLength(10)
    for (const img of w.findAll('img')) await img.trigger('error')
    await flushPromises()
    expect(w.findAll('img')).toHaveLength(0)
    expect(w.findAll('.fd-stand')).toHaveLength(6)
    expect(w.findAll('.fd-cover-stand')).toHaveLength(3)
    await w.findAll('.fd-thing')[0]!.trigger('click')
    expect(w.find('.fd-count').text()).toContain('1')
    expect(played).toContain('found')
    expect(problems()).toEqual([])
  })

  it('the memory of the last stage works with plain cards', async () => {
    const { gideon } = await import('@/data/adventures/gideon')
    const { default: Memory } = await import('@/components/molecules/games/GameMemory.vue')
    const w = mount(Memory, { ...opts(), props: { game: gideon.stages[11]!.task.memory! } })
    await flushPromises()
    expect(w.findAll('.mem-card')).toHaveLength(12)
    for (const img of w.findAll('img.mem-face')) await img.trigger('error')
    await flushPromises()
    expect(w.findAll('.mem-stand.mem-front')).toHaveLength(12)
    expect(new Set(w.findAll('.mem-stand.mem-front').map((x) => x.attributes('style'))).size).toBe(6)
  })
})

// ---------------------------------------------------------------- the night goes by
describe('Die Nacht vergeht (dew)', () => {
  const game: DewGame = {
    background: 'images/x/floor.webp',
    fleece: 'images/x/fleece.webp',
    bowl: 'images/x/bowl.webp',
    moon: 'images/x/moon.webp',
    sun: 'images/x/sun.webp',
    fleeceBox: { x: 30, y: 34, w: 40, h: 34 },
    rounds: [
      { hint: 'Die erste Nacht.', wet: 'fleece', spots: [[40, 45], [55, 50]] },
      { hint: 'Die zweite Nacht.', wet: 'ground', spots: [[10, 20], [85, 80], [50, 85]] }
    ]
  }
  // everything is 400 x 300 pixels: a percent of the width is four pixels, a percent of the height three
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Dew } = await import('@/components/molecules/games/GameDew.vue')
    const w = mount(Dew, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const morning = async (w: W) => {
    await w.find('.dw-track').trigger('keydown', { key: 'End' })
  }
  const tapField = async (w: W, x: number, y: number) => {
    await w.find('.dw-field').trigger('click', { clientX: x * 4, clientY: y * 3 })
    await flushPromises()
  }
  const roundOne = async (w: W) => {
    await morning(w)
    await w.findAll('.dw-spot')[0]!.trigger('click')
    await w.findAll('.dw-spot')[1]!.trigger('click')
  }
  const roundTwo = async (w: W) => {
    await morning(w)
    for (let i = 0; i < 3; i++) await w.findAll('.dw-spot')[i]!.trigger('click')
  }

  it('the goal is every drop of both rounds; it is evening, no drops yet, the moon is on the bar', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(5)
    expect(w.find('.dw-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.dw-track').attributes('aria-valuenow')).toBe('0')
    expect(w.find('.dw-track').attributes('aria-valuetext')).toBe('Nacht')
    expect(w.findAll('.dw-spot')).toHaveLength(0)
    expect(w.find('.dw-count').text()).toBe('Tautropfen: 0 von 2')
  })

  it('drawing the moon along the bar changes the sky: dark, rose, light; from the dawn on the sun takes the place of the moon', async () => {
    const w = await open()
    const dark = w.find('.dw-sky').attributes('style')
    expect(dark).toContain('rgb(22, 32, 72)')
    w.find('.dw-track').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 200 }))
    window.dispatchEvent(new MouseEvent('pointerup'))
    await flushPromises()
    expect(w.find('.dw-track').attributes('aria-valuenow')).toBe('50')
    expect(w.find('.dw-sky').attributes('style')).not.toBe(dark)
    w.find('.dw-track').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 300 }))
    window.dispatchEvent(new MouseEvent('pointerup'))
    await flushPromises()
    expect(w.find('.dw-track').attributes('aria-valuetext')).toBe('Morgendämmerung')
  })

  it('the arrow keys move the moon; the end key brings the morning, the drops glitter', async () => {
    const w = await open()
    await w.find('.dw-track').trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.dw-track').attributes('aria-valuenow')).toBe('5')
    await w.find('.dw-track').trigger('keydown', { key: 'ArrowLeft' })
    await w.find('.dw-track').trigger('keydown', { key: 'ArrowLeft' })
    expect(w.find('.dw-track').attributes('aria-valuenow')).toBe('0')
    await morning(w)
    expect(w.find('.dw-track').attributes('aria-valuetext')).toBe('Morgen')
    expect(w.findAll('.dw-spot')).toHaveLength(2)
  })

  it('a tap on a drop finds it: a tick, the drop turns green, the point is counted', async () => {
    const w = await open()
    await morning(w)
    await w.findAll('.dw-spot')[0]!.trigger('click')
    expect(w.findAll('.dw-spot.found')).toHaveLength(1)
    expect(played).toContain('bead')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.find('.dw-count').text()).toBe('Tautropfen: 1 von 2')
  })

  it('before the morning a tap on the floor does nothing; in the morning a tap on a dry place is a little sun with a cross and a mistake, a tap on the wet place between the drops is nothing', async () => {
    const w = await open()
    await tapField(w, 10, 10)
    expect(played).toHaveLength(0)
    await morning(w)
    await tapField(w, 50, 60)
    expect(played).not.toContain('wrong')
    await tapField(w, 10, 10)
    expect(played).toContain('wrong')
    expect(w.find('.dw-dry').exists()).toBe(true)
    expect(w.find('.dw-fb').text()).toContain('Boden trocken')
    await tick(1000)
    expect(w.find('.dw-dry').exists()).toBe(false)
  })

  it('when the moon is drawn back the drops are gone for the moment, and the found ones stay found', async () => {
    const w = await open()
    await morning(w)
    await w.findAll('.dw-spot')[0]!.trigger('click')
    await w.find('.dw-track').trigger('keydown', { key: 'Home' })
    expect(w.findAll('.dw-spot')).toHaveLength(0)
    await morning(w)
    expect(w.findAll('.dw-spot.found')).toHaveLength(1)
    expect(played).not.toContain('wrong')
  })

  it('all the drops of the first night found: the bowl fills; the second night starts in the evening with dew on the ground and a dry fleece', async () => {
    const w = await open()
    await roundOne(w)
    expect(w.find('.dw-bowl').classes()).toContain('full')
    expect(played).toContain('star')
    await tick(2300)
    expect(w.find('.dw-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.dw-track').attributes('aria-valuenow')).toBe('0')
    expect(w.find('.dw-count').text()).toBe('Tautropfen: 0 von 3')
    await morning(w)
    expect(w.findAll('.dw-spot')).toHaveLength(3)
    // now the fleece is dry
    await tapField(w, 50, 50)
    expect(played).toContain('wrong')
    expect(w.find('.dw-fb').text()).toContain('Fell trocken')
  })

  it('the whole game: the end with three stars; the taps on dry places give the stars (up to two: three, up to six: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [6, 2], [7, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      await morning(w)
      for (let i = 0; i < wrong; i++) await tapField(w, 10, 10)
      await roundOne(w)
      await tick(2300)
      await roundTwo(w)
      await tick(1600)
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
    expect(w.find('.dw-count').text()).toBe('Drops of dew: 0 of 2')
    expect(w.find('.dw-track').attributes('aria-valuetext')).toBe('Night')
    await morning(w)
    await tapField(w, 10, 10)
    expect(w.find('.dw-fb').text()).toBe('The ground is dry here. The dew lies on the fleece.')
  })
})

// ---------------------------------------------------------------- chaff in the wind
describe('Spreu im Wind (winnow)', () => {
  const game: WinnowGame = {
    background: 'images/x/press.webp',
    tray: 'images/x/tray.webp',
    grain: 'images/x/grain.webp',
    chaffImage: 'images/x/chaff.webp',
    handle: 'images/x/handle.webp',
    trayBox: { x: 20, y: 44, w: 48, h: 38 },
    rounds: [
      { hint: 'Runde eins.', chaff: 3, grains: 5, window: [35, 75], gust: 0, seed: 1 },
      { hint: 'Runde zwei.', chaff: 4, grains: 5, window: [45, 62], gust: 0, seed: 2 }
    ]
  }
  // the slider is 300 pixels high: a wind of 50 is at the pixel 150 from the top
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Winnow } = await import('@/components/molecules/games/GameWinnow.vue')
    const w = mount(Winnow, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const setWind = async (w: W, wind: number) => {
    w.find('.wn-track').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientY: (1 - wind / 100) * 300 }))
    window.dispatchEvent(new MouseEvent('pointerup'))
    await flushPromises()
  }
  const wind = (w: W) => Number(w.find('.wn-track').attributes('aria-valuenow'))
  const pieces = (w: W) => w.findAll('.wn-piece:not(.flying)')

  it('the goal is every piece of chaff of both rounds; three pieces of chaff and five grains lie in the tray, the wind is nothing', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.find('.wn-round').text()).toContain('Runde 1 von 2')
    expect(pieces(w)).toHaveLength(8)
    expect(w.findAll('.wn-piece.chaff')).toHaveLength(3)
    expect(wind(w)).toBe(0)
    expect(w.find('.wn-count').text()).toBe('Spreu fortgeweht: 0 von 3')
  })

  it('the keys and the finger set the wind in whole percent, between 0 and 100', async () => {
    const w = await open()
    await w.find('.wn-track').trigger('keydown', { key: 'ArrowUp' })
    expect(wind(w)).toBe(5)
    await w.find('.wn-track').trigger('keydown', { key: 'PageUp' })
    expect(wind(w)).toBe(15)
    await w.find('.wn-track').trigger('keydown', { key: 'ArrowDown' })
    expect(wind(w)).toBe(10)
    expect(w.find('.wn-wind').text()).toBe('Wind: 10 %')
    await setWind(w, 50)
    expect(wind(w)).toBe(50)
    await w.find('.wn-track').trigger('keydown', { key: 'End' })
    expect(wind(w)).toBe(100)
    await w.find('.wn-track').trigger('keydown', { key: 'Home' })
    expect(wind(w)).toBe(0)
  })

  it('with no wind nothing flies away, however long it takes', async () => {
    const w = await open()
    await tick(5000)
    expect(pieces(w)).toHaveLength(8)
    expect(played).toHaveLength(0)
  })

  it('a middle wind blows the chaff away (a tick for it), the grains stay; the round ends with a star when all the chaff is gone', async () => {
    const w = await open()
    await setWind(w, 75)
    await tick(500)
    expect(played).toContain('tap')
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(3)
    expect(played).toContain('star')
    expect(w.find('.wn-count').text()).toBe('Spreu fortgeweht: 3 von 3')
  })

  it('a weak wind blows only some of the chaff away, the stronger the more', async () => {
    const w = await open()
    await setWind(w, 55)
    await tick(500)
    const a = useTaskProgress().parts.value
    expect(a).toBeGreaterThanOrEqual(0)
    await setWind(w, 75)
    await tick(500)
    expect(useTaskProgress().parts.value).toBe(3)
    expect(a).toBeLessThanOrEqual(3)
  })

  it('too strong a wind blows grains away, too: a cross, a dull sound, each lost grain is a mistake and stays lost; the game goes on', async () => {
    const w = await open()
    await setWind(w, 100)
    await tick(500)
    expect(played).toContain('wrong')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(useTaskProgress().parts.value).toBe(3)
    await tick(2000)
    expect(w.find('.wn-round').text()).toContain('Runde 2 von 2')
  })

  it('round 2: the wind is back to nothing, four pieces of chaff, a narrow right wind: at the top of it no grain is lost', async () => {
    const w = await open()
    await setWind(w, 75)
    await tick(2500)
    expect(w.find('.wn-round').text()).toContain('Runde 2 von 2')
    expect(wind(w)).toBe(0)
    expect(w.findAll('.wn-piece.chaff')).toHaveLength(4)
    played.length = 0
    await setWind(w, 62)
    for (let i = 0; i < 40 && useTaskProgress().parts.value < 7; i++) await tick(400)
    expect(played).not.toContain('wrong')
    expect(useTaskProgress().parts.value).toBe(7)
  })

  it('the end: three stars with no grain lost; each lost grain counts (more than eight lost: one star)', async () => {
    const run = async (lostRounds: number) => {
      useTaskProgress().reset()
      played.length = 0
      const w = await open()
      await setWind(w, lostRounds >= 1 ? 100 : 75)
      await tick(2500)
      await setWind(w, lostRounds >= 2 ? 100 : 62)
      for (let i = 0; i < 60 && !useTaskProgress().finished.value; i++) await tick(200)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      const done = w.emitted('done')
      w.unmount()
      return done
    }
    expect(await run(0)).toEqual([[3]])
    // five grains lost: two stars
    expect(await run(1)).toEqual([[2]])
    // ten grains lost: one star
    expect(await run(2)).toEqual([[1]])
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.wn-count').text()).toBe('Chaff blown away: 0 of 3')
    expect(w.find('.wn-track').attributes('aria-label')).toBe('Wind')
    await setWind(w, 100)
    await tick(500)
    expect(w.find('.wn-fb').text()).toContain('some grains flew away')
  })
})

// ---------------------------------------------------------------- who goes home
describe('Wer geht heim? (switch)', () => {
  const game: SwitchGame = {
    background: 'images/x/fork.webp',
    men: [
      { id: 'a', image: 'images/x/a.webp', w: 14 },
      { id: 'b', image: 'images/x/b.webp', w: 14 },
      { id: 'c', image: 'images/x/c.webp', w: 14 }
    ],
    bubbleHome: 'images/x/house.webp',
    bubbleHorn: 'images/x/horn.webp',
    leverLeft: 'images/x/left.webp',
    leverRight: 'images/x/right.webp',
    fork: [50, 62],
    rounds: [
      { hint: 'Runde eins.', men: ['home', 'stay', 'home'], queue: 1 },
      { hint: 'Runde zwei.', men: ['stay', 'home', 'stay', 'home'], hideBubbleMs: 2000, queue: 2 }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Switch } = await import('@/components/molecules/games/GameSwitch.vue')
    const w = mount(Switch, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const pull = async (w: W, side: 'left' | 'right') => {
    await w.findAll('.sw-lever')[side === 'left' ? 0 : 1]!.trigger('click')
    await flushPromises()
  }
  /** The men are sent the way they want: the list is what the round says. */
  const send = async (w: W, men: ('home' | 'stay')[]) => {
    for (const m of men) {
      await pull(w, m === 'home' ? 'right' : 'left')
      await tick(800)
    }
  }

  it('the goal is every man of both rounds; one man waits at the fork and shows a house, the levers are the two ways', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(7)
    expect(w.find('.sw-round').text()).toContain('Runde 1 von 2')
    expect(w.findAll('.sw-man')).toHaveLength(1)
    expect(w.find('.sw-bubble').exists()).toBe(true)
    expect(w.find('.sw-man').attributes('aria-label')).toContain('Haus')
    expect(w.findAll('.sw-lever')).toHaveLength(2)
    expect(w.find('.sw-count').text()).toBe('Durchgelassen: 0 von 3')
  })

  it('the wrong lever: the man shakes his head, a cross, a dull sound, a mistake; he stays and the bubble stays', async () => {
    const w = await open()
    await pull(w, 'left')
    expect(played).toContain('wrong')
    expect(w.find('.sw-man').classes()).toContain('shake')
    expect(w.find('.sw-fb').text()).toContain('schüttelt freundlich den Kopf')
    expect(w.find('.gm.bad').exists()).toBe(true)
    expect(w.find('.sw-count').text()).toBe('Durchgelassen: 0 von 3')
    expect(w.find('.sw-bubble').exists()).toBe(true)
  })

  it('the right lever: the man walks off (soft steps), the levers wait meanwhile; then the next man comes with a horn', async () => {
    const w = await open()
    await pull(w, 'right')
    expect(played).toContain('caravan')
    expect(w.find('.sw-man').classes()).toContain('away')
    expect(w.find('.sw-man').classes()).toContain('right')
    expect(useTaskProgress().parts.value).toBe(1)
    expect(w.findAll('.sw-lever')[0]!.attributes('disabled')).toBeDefined()
    await pull(w, 'left')
    expect(played).not.toContain('wrong')
    await tick(800)
    expect(w.find('.sw-count').text()).toBe('Durchgelassen: 1 von 3')
    expect(w.find('.sw-man').attributes('aria-label')).toContain('Horn')
    expect(w.find('.sw-man').classes()).not.toContain('away')
  })

  it('the arrow keys set the switch, too', async () => {
    const w = await open()
    await w.find('.sw').trigger('keydown', { key: 'ArrowRight' })
    expect(useTaskProgress().parts.value).toBe(1)
    await tick(800)
    await w.find('.sw').trigger('keydown', { key: 'ArrowRight' })
    expect(w.find('.sw-fb').text()).toContain('Kopf')
  })

  it('round 2: two men wait, the bubble goes away after two seconds, a tap on the man shows it again (no mistake)', async () => {
    const w = await open()
    await send(w, ['home', 'stay', 'home'])
    await tick(1800)
    expect(w.find('.sw-round').text()).toContain('Runde 2 von 2')
    expect(w.findAll('.sw-man')).toHaveLength(2)
    expect(w.find('.sw-bubble').exists()).toBe(true)
    await tick(2100)
    expect(w.find('.sw-bubble').exists()).toBe(false)
    await w.find('.sw-man').trigger('click')
    expect(w.find('.sw-bubble').exists()).toBe(true)
    expect(played).not.toContain('wrong')
  })

  it('the whole game: the end with three stars; the wrong levers give the stars (up to two: three, up to five: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await pull(w, 'left')
      await send(w, ['home', 'stay', 'home'])
      await tick(1800)
      await send(w, ['stay', 'home', 'stay', 'home'])
      await tick(1000)
      expect(useTaskProgress().parts.value).toBe(7)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.sw-count').text()).toBe('Let through: 0 of 3')
    expect(w.findAll('.sw-lever')[1]!.text()).toBe('Home (right)')
    expect(w.find('.sw-man').attributes('aria-label')).toContain('house')
  })
})

// ---------------------------------------------------------------- on Gideon's sign
describe('Auf Gideons Zeichen (cue)', () => {
  const group = (id: string, x: number) => ({ id, image: `images/x/${id}.webp`, x, y: 80, jars: 3 })
  const game: CueGame = {
    background: 'images/x/valley.webp',
    groups: [group('links', 18), group('rechts', 82)],
    leader: { id: 'gideon', image: 'images/x/gideon.webp', x: 50, y: 74, jars: 1 },
    front: group('vorn', 50),
    horn: 'images/x/horn.webp',
    decoyImages: { owl: 'images/x/owl.webp', wind: 'images/x/wind.webp' },
    shards: 'images/x/shards.webp',
    rounds: [
      { hint: 'Runde eins.', signals: 2, decoys: [], waitMs: [2000, 3000] },
      { hint: 'Runde zwei.', signals: 2, decoys: ['owl'], waitMs: [2000, 3000] }
    ]
  }
  const open = async (locale: 'de' | 'en' = 'de') => {
    const { default: Cue } = await import('@/components/molecules/games/GameCue.vue')
    const w = mount(Cue, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const lit = (w: W) => w.find('.cu-horn').classes().includes('lit')
  /** Wait (a tenth of a second at a time) until the horn sounds. */
  const waitHorn = async (w: W) => {
    for (let i = 0; i < 80 && !lit(w); i++) await tick(100)
  }
  const tapCue = async (w: W, id: string) => {
    await w.find(`[data-cue="${id}"]`).trigger('click')
    await flushPromises()
  }
  /** One whole signal answered right: wait for the horn, Gideon, then the groups. */
  const signal = async (w: W) => {
    await waitHorn(w)
    await tapCue(w, 'leader')
    await tapCue(w, 'rechts')
    await tapCue(w, 'links')
  }

  it('the goal is every signal of both rounds; the horn is dark, Gideon and the two groups stand ready, the men round Gideon only stand there', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.cu-round').text()).toContain('Runde 1 von 2')
    expect(lit(w)).toBe(false)
    expect(w.findAll('[data-cue]')).toHaveLength(3)
    expect(w.find('.cu-front').exists()).toBe(true)
    expect(w.find('.cu-count').text()).toBe('Zeichen beantwortet: 0 von 2')
  })

  it('a tap while the child should wait is a "pst": the jars wobble, a cross, a dull sound, a mistake; the waiting begins anew', async () => {
    const w = await open()
    await tick(1500)
    await tapCue(w, 'links')
    expect(played).toContain('wrong')
    expect(w.find('.cu-field').classes()).toContain('pst')
    expect(w.find('.cu-fb').text()).toContain('Pst')
    expect(w.find('.cu-mark').exists()).toBe(true)
    // the wait began again: 1.9 seconds later the horn is still dark (the first wait would have ended)
    await tick(1900)
    expect(lit(w)).toBe(false)
    await waitHorn(w)
    expect(lit(w)).toBe(true)
  })

  it('a tap on the empty valley while waiting is too early as well', async () => {
    const w = await open()
    await w.find('.cu-field').trigger('click')
    expect(played).toContain('wrong')
  })

  it('the horn sounds after the waiting time (between two and three seconds here), it shines and sounds', async () => {
    const w = await open()
    await tick(1900)
    expect(lit(w)).toBe(false)
    await tick(1200)
    expect(lit(w)).toBe(true)
    expect(played).toContain('fanfare')
    expect(w.find('.cu-horn').attributes('aria-label')).toContain('leuchtet')
  })

  it('after the horn: a group before Gideon is only a friendly hint; Gideon first, then the groups in any order; the last one closes the ring', async () => {
    const w = await open()
    await waitHorn(w)
    await tapCue(w, 'links')
    expect(w.find('.cu-fb').text()).toContain('Erst Gideons Krug')
    expect(played).not.toContain('wrong')
    await tapCue(w, 'leader')
    expect(w.find('.cu-leader').classes()).toContain('broken')
    expect(w.findAll('.cu-shards')).toHaveLength(1)
    await tapCue(w, 'rechts')
    expect(w.find('.cu-field').classes()).not.toContain('shine')
    await tapCue(w, 'links')
    expect(w.find('.cu-field').classes()).toContain('shine')
    expect(played).toContain('star')
    expect(w.find('.cu-fb').text()).toContain('Ring ist geschlossen')
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('a tap on the empty valley after the horn does nothing; after the ring the next signal begins with a dark horn', async () => {
    const w = await open()
    await waitHorn(w)
    await w.find('.cu-field').trigger('click')
    expect(played).not.toContain('wrong')
    await tapCue(w, 'leader')
    await tapCue(w, 'links')
    await tapCue(w, 'rechts')
    await tick(1800)
    expect(lit(w)).toBe(false)
    expect(w.findAll('.cu-shards')).toHaveLength(0)
    expect(w.find('.cu-count').text()).toBe('Zeichen beantwortet: 1 von 2')
  })

  it('round 2: an owl calls while waiting (another picture and another sound); not answering it is right; the horn comes all the same', async () => {
    const w = await open()
    await signal(w)
    await tick(1800)
    await signal(w)
    // the ring shines, then the round ends and the next one begins
    await tick(3400)
    expect(w.find('.cu-round').text()).toContain('Runde 2 von 2')
    played.length = 0
    let seen = false
    for (let i = 0; i < 80 && !lit(w); i++) {
      await tick(100)
      if (w.find('.cu-decoy').exists()) seen = true
    }
    expect(seen).toBe(true)
    expect(played).toContain('flip')
    expect(played).not.toContain('wrong')
    expect(lit(w)).toBe(true)
  })

  it('the whole game: the end with three stars; the mistakes give the stars (up to two: three, up to five: two, more: one)', async () => {
    for (const [wrong, stars] of [[0, 3], [2, 3], [3, 2], [5, 2], [6, 1]] as const) {
      useTaskProgress().reset()
      const w = await open()
      for (let i = 0; i < wrong; i++) await w.find('.cu-field').trigger('click')
      await signal(w)
      await tick(1800)
      await signal(w)
      await tick(3400)
      await signal(w)
      await tick(1800)
      await signal(w)
      await tick(1800)
      expect(useTaskProgress().parts.value).toBe(4)
      expect(useTaskProgress().finished.value).toBe(true)
      await w.find('.gd button').trigger('click')
      expect(w.emitted('done'), `${wrong} wrong`).toEqual([[stars]])
      w.unmount()
    }
    expect(problems()).toEqual([])
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.cu-count').text()).toBe('Signs answered: 0 of 2')
    expect(w.find('.cu-horn').attributes('aria-label')).toBe('The horn is dark. Wait.')
    await w.find('.cu-field').trigger('click')
    expect(w.find('.cu-fb').text()).toBe('Pst! Not yet. Wait for the horn.')
  })
})
