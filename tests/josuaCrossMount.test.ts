/**
 * "Through the Jordan" (Josua stage 4, `GameCross`) and what plan v3 changed in the baking and hush games of Josua: the chest is pulled into the middle of the river (drag, tap, keys), the river bed dries behind it, then every
 * tap sends a group over; the end gives three stars. The baking game counts the turned flatbreads at a fixed place without a stack picture; the hush game lies on a soft stage picture.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import { crossAt, crossShare, groupLanding } from '@/utils/josuaGames'
import type { BakeGame, CrossGame, HushGame } from '@/types/adventure'

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

describe('the way of the chest and the groups', () => {
  it('the chest goes from the bank to the middle; a finger at some place means a share of the way, held at the ends', () => {
    expect(crossAt([10, 60], [50, 70], 0)).toEqual({ x: 10, y: 60 })
    expect(crossAt([10, 60], [50, 70], 1)).toEqual({ x: 50, y: 70 })
    expect(crossAt([10, 60], [50, 70], 0.5)).toEqual({ x: 30, y: 65 })
    expect(crossAt([10, 60], [50, 70], 2)).toEqual({ x: 50, y: 70 })
    expect(crossShare([10, 60], [50, 70], 30)).toBeCloseTo(0.5, 5)
    expect(crossShare([10, 60], [50, 70], 0)).toBe(0)
    expect(crossShare([10, 60], [50, 70], 90)).toBe(1)
  })

  it('the groups land side by side on the far bank, a little apart in depth', () => {
    const l = [0, 1, 2].map((i) => groupLanding([88, 70], i))
    expect(l.map((p) => p.x)).toEqual([88, 81, 74])
    expect(new Set(l.map((p) => p.y)).size).toBe(3)
  })
})

describe('Durch den Jordan (cross)', () => {
  const game: CrossGame = {
    background: 'images/x/river.webp',
    chest: 'images/x/chest.webp',
    group: 'images/x/people.webp',
    start: [10, 60],
    middle: [50, 60],
    groups: [[10, 74], [16, 82], [10, 90]],
    farBank: [88, 70],
    rounds: [{ hint: 'Ziehe die goldene Truhe ins Wasser.' }, { hint: 'Jetzt geht das Volk hinüber. Tippe die Gruppen an.' }]
  }
  // the field is 400 pixels wide: a percent of the picture is four pixels
  const open = async (locale: 'de' | 'en' = 'de') => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x: 0, y: 0, toJSON: () => ({}) })
    const { default: Cross } = await import('@/components/molecules/games/GameCross.vue')
    const w = mount(Cross, { ...opts(locale), props: { game } })
    await flushPromises()
    return w
  }
  type W = Awaited<ReturnType<typeof open>>
  const drag = async (w: W, toPercent: number) => {
    w.find('.cr-chest').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 40, clientY: 180 }))
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: toPercent * 4, clientY: 180 }))
    window.dispatchEvent(new MouseEvent('pointerup'))
    await flushPromises()
  }
  const chestX = (w: W) => Number(/left: ([\d.]+)%/.exec(w.find('.cr-chest').attributes('style') ?? '')![1])

  it('the goal is the chest and the three groups (four); the chest stands on the left bank, the first hint shows, the groups cannot be tapped yet', async () => {
    const w = await open()
    expect(useTaskProgress().goal.value).toBe(4)
    expect(w.find('.cr-round').text()).toContain('Runde 1 von 2')
    expect(w.find('.cr-hint').text()).toBe('Ziehe die goldene Truhe ins Wasser.')
    expect(chestX(w)).toBe(10)
    expect(w.findAll('.cr-group')).toHaveLength(3)
    expect(w.findAll('.cr-group').every((g) => g.attributes('disabled') !== undefined)).toBe(true)
    expect(w.find('.cr-count').text()).toBe('Getan: 0 von 4')
  })

  it('pulling the chest part of the way moves it and dries the bed behind it; it does not click into place yet', async () => {
    const w = await open()
    await drag(w, 30)
    expect(chestX(w)).toBeCloseTo(30, 3)
    expect(w.find('.cr-dry').attributes('style')).toContain('width: 20%')
    expect(useTaskProgress().parts.value).toBe(0)
  })

  it('near the middle the chest clicks into place: a tick, the sentence, then round 2 with the groups', async () => {
    const w = await open()
    await drag(w, 48)
    expect(chestX(w)).toBe(50)
    expect(useTaskProgress().parts.value).toBe(1)
    expect(played).toContain('found')
    expect(w.find('.cr-fb').text()).toContain('Das Wasser bleibt stehen')
    await tick(1800)
    expect(w.find('.cr-round').text()).toContain('Runde 2 von 2')
    expect(w.find('.cr-hint').text()).toContain('Tippe die Gruppen an')
    expect(w.findAll('.cr-group').every((g) => g.attributes('disabled') === undefined)).toBe(true)
  })

  it('a tap on the chest and the keys push it a quarter of the way', async () => {
    const w = await open()
    w.find('.cr-chest').element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 40, clientY: 180 }))
    window.dispatchEvent(new MouseEvent('pointerup'))
    await flushPromises()
    expect(chestX(w)).toBeCloseTo(20, 3)
    await w.find('.cr').trigger('keydown', { key: 'ArrowRight' })
    expect(chestX(w)).toBeCloseTo(30, 3)
    await w.find('.cr').trigger('keydown', { key: 'Enter' })
    await w.find('.cr').trigger('keydown', { key: 'Enter' })
    expect(chestX(w)).toBe(50)
    expect(useTaskProgress().parts.value).toBe(1)
  })

  it('every tap sends one group over to the far bank; after the third the game ends with three stars (no mistake is possible)', async () => {
    const w = await open()
    await drag(w, 50)
    await tick(1800)
    await w.findAll('.cr-group')[1]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(2)
    expect(w.findAll('.cr-group')[1]!.attributes('style')).toContain('left: 81%')
    expect(w.findAll('.cr-group')[1]!.attributes('disabled')).toBeDefined()
    expect(w.find('.cr-fb').text()).toContain('Die Gruppe geht trocken hinüber')
    // Enter sends the next group that waits (the first one)
    await w.find('.cr').trigger('keydown', { key: 'Enter' })
    expect(useTaskProgress().parts.value).toBe(3)
    await w.findAll('.cr-group')[2]!.trigger('click')
    expect(useTaskProgress().parts.value).toBe(4)
    await tick(2000)
    expect(useTaskProgress().finished.value).toBe(true)
    await w.find('.gd button').trigger('click')
    expect(w.emitted('done')).toEqual([[3]])
    expect(played).not.toContain('wrong')
  })

  it('speaks English', async () => {
    const w = await open('en')
    expect(w.find('.cr-count').text()).toBe('Done: 0 of 4')
    await drag(w, 50)
    expect(w.find('.cr-fb').text()).toBe('The chest stands in the middle of the river. The water stands still!')
  })
})

describe('plan v3 in the baking and the hush game', () => {
  it('bake: without a picture for the dough and the stack the raw flatbread is in the tray and the number of the turned ones stands at a fixed place', async () => {
    const game: BakeGame = {
      background: 'images/x/fire.webp',
      raw: 'images/x/raw.webp',
      golden: 'images/x/golden.webp',
      dark: 'images/x/dark.webp',
      stonesAt: [[26, 56], [50, 50], [74, 56], [50, 74]],
      rounds: [{ hint: 'Runde eins.', dough: 4, stones: 3, goldenFrom: 2.5, goldenTo: 6 }]
    }
    const { default: Bake } = await import('@/components/molecules/games/GameBake.vue')
    const w = mount(Bake, { ...opts(), props: { game } })
    await flushPromises()
    expect(w.findAll('.bk-dough')).toHaveLength(4)
    expect(w.find('.bk-dough img').attributes('src')).toContain('raw.webp')
    expect(w.find('.bk-stack').exists()).toBe(false)
    expect(w.find('.bk-turned').text()).toBe('0')
    expect(w.find('.bk-turned').attributes('style')).toContain('left: 88%')
    w.unmount()
  })

  it('hush: the field lies on the soft stage picture', async () => {
    const game: HushGame = {
      background: 'images/x/stage.webp',
      clouds: ['images/x/c.webp', 'images/x/c.webp', 'images/x/c.webp'],
      spots: [{ id: 'platz-1', animal: 'esel', image: 'images/x/esel.webp', x: 15, y: 90, w: 14 }],
      rounds: [{ hint: 'Runde eins.', calms: 2, maxClouds: 1, grow: 4, seed: 11 }]
    }
    const { default: Hush } = await import('@/components/molecules/games/GameHush.vue')
    const w = mount(Hush, { ...opts(), props: { game } })
    await flushPromises()
    expect(w.find('.hs-field').classes()).toContain('game-soft')
    expect(w.find('.hs-field').attributes('style')).toContain('--bg')
    w.unmount()
  })
})
