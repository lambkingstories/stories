/**
 * What plan v3 added to the Jakob games: the play field lies on a soft stage picture (class `game-soft`, the picture as `--bg`), a herd of the relay game is a troop of animals, the tent of the catch
 * game has a picture, the small stone of the cairn game is the big one when no picture of its own is given, and the places of the sons are `ringPlaces` (like the hours of a clock) with `nearestFree`.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import useTaskProgress from '@/use/useTaskProgress'
import { nearestFree, ringPlaces } from '@/utils/jakobGames2'
import type { CairnGame, CatchGame, RelayGame } from '@/types/adventure'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: () => Promise.resolve(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))
const mk = (locale: 'de' | 'en') => createI18n({ legacy: false, locale, fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })
const opts = () => ({ global: { plugins: [mk('de')], stubs: { RouterLink: true } }, attachTo: document.body })
beforeEach(() => {
  useTaskProgress().reset()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('the places of the sons', () => {
  it('twelve places like the hours of a clock, the first at the top; four places are every third of them', () => {
    expect(ringPlaces(12)).toEqual([270, 300, 330, 0, 30, 60, 90, 120, 150, 180, 210, 240])
    expect(ringPlaces(4)).toEqual([270, 0, 90, 180])
  })

  it('a son snaps to the nearest free place, also round the zero; nothing free means nothing', () => {
    expect(nearestFree([0, 90, 180], 40)).toBe(0)
    expect(nearestFree([90, 180], 275)).toBe(180)
    expect(nearestFree([350, 100], 5)).toBe(350)
    expect(nearestFree([], 5)).toBeUndefined()
  })
})

describe('the games on a soft stage picture', () => {
  const relay: RelayGame = {
    background: 'images/x/stage.webp',
    herds: [{ id: 'ziegen', image: 'images/x/ziege.webp', w: 16, copies: 3 }, { id: 'schafe', image: 'images/x/schaf.webp', w: 16 }],
    road: [[6, 88], [94, 58]],
    rounds: [{ hint: 'Runde eins.', herds: ['ziegen', 'schafe'], minGap: 25, speed: 0.1 }]
  }

  it('relay: the field is soft, the road is drawn by the app, a herd with copies is a troop of three animals, one without is a single animal', async () => {
    const { default: Relay } = await import('@/components/molecules/games/GameRelay.vue')
    // on a stage picture the app draws the road; a painted backdrop (`/hintergrund/`) has its own road and the line is left out
    const painted = mount(Relay, { ...opts(), props: { game: { ...relay, background: 'images/x/hintergrund/staffel.webp' } } })
    await flushPromises()
    expect(painted.find('.rl-road').exists()).toBe(false)
    const w = mount(Relay, { ...opts(), props: { game: { ...relay, background: 'images/x/stage.webp', road: [[6, 88], [94, 58]] } } })
    await flushPromises()
    const field = w.find('.rl-field')
    expect(field.classes()).toContain('game-soft')
    expect(field.attributes('style')).toContain('--bg')
    const pts = w.find('.rl-road polyline').attributes('points')!.split(' ').map((p) => p.split(',').map(Number))
    expect(pts[0]![0]).toBe(6)
    expect(pts[0]![1]).toBeCloseTo(88 / 1.5, 3)
    expect(pts[1]![0]).toBe(94)
    expect(pts[1]![1]).toBeCloseTo(58 / 1.5, 3)
    // the first herd waits at the start: a troop of three
    expect(w.findAll('.rl-herd.waiting .rl-copy')).toHaveLength(3)
    await w.find('.rl-go').trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    // the second herd waits now: a single animal
    expect(w.findAll('.rl-herd.waiting .rl-copy')).toHaveLength(1)
  })

  it('catch: the tent has a picture when the data names one, and the field is soft', async () => {
    const game: CatchGame = {
      background: 'images/x/stage.webp',
      kids: [{ id: 'kind-1', image: 'images/x/kind-1.webp', w: 7 }],
      tent: [88, 58],
      tentImage: 'images/x/zelt.webp',
      field: { x: 6, y: 62, w: 70, h: 30 },
      rounds: [{ hint: 'Runde eins.', kids: ['kind-1'], speed: 0.04 }]
    }
    const { default: Catch } = await import('@/components/molecules/games/GameCatch.vue')
    const w = mount(Catch, { ...opts(), props: { game } })
    await flushPromises()
    expect(w.find('.ct-field').classes()).toContain('game-soft')
    expect(w.find('.ct-tent-pic').exists()).toBe(true)
    expect(w.find('.ct-tent-pic').attributes('style')).toContain('left: 88%')
    w.unmount()
    const { default: Catch2 } = await import('@/components/molecules/games/GameCatch.vue')
    const w2 = mount(Catch2, { ...opts(), props: { game: { ...game, tentImage: undefined } } })
    await flushPromises()
    expect(w2.find('.ct-tent-pic').exists()).toBe(false)
  })

  it('cairn: without a picture of a small stone the heap is made of the big stone', async () => {
    const game: CairnGame = {
      background: 'images/x/stage.webp',
      stoneLeft: 'images/x/links.webp',
      stoneRight: 'images/x/rechts.webp',
      centre: [50, 72],
      leftStart: [14, 66],
      rightStart: [86, 66],
      rounds: [{ hint: 'Runde eins.', stones: 2, steps: 3 }]
    }
    const { default: Cairn } = await import('@/components/molecules/games/GameCairn.vue')
    const w = mount(Cairn, { ...opts(), props: { game } })
    await flushPromises()
    expect(w.find('.ca-field').classes()).toContain('game-soft')
    expect(w.findAll('.ca-big')).toHaveLength(2)
  })
})
