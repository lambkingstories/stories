/**
 * "Josefs Land" on the screen: the story card comes at every start (what it is about and the task), the card that explains the controls only
 * once, the four buttons at the bottom open the order board, the store, the land and the goals, an order is delivered and paid, the years
 * explain themselves, and the game is kept on the device.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameJosefsLand from '@/components/molecules/games/BigGameJosefsLand.vue'
import useBigGames from '@/use/useBigGames'
import { SAVE_KEY, type GameState } from '../src/utils/josefslandGame'

const texts = withGameTexts(app as { de?: object; en?: object })
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: texts.de ?? {}, en: texts.en ?? {} } })

/** jsdom does not load pictures: every one "fails" at once, so the game goes on without them. */
class FailingImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 0
  height = 0
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

interface Probe {
  game: GameState
  refresh: () => void
}
const probe = () => (window as unknown as { __josefsland: Probe }).__josefsland

describe('BigGameJosefsLand', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    window.history.pushState({}, '', '/?probe=1')
  })

  async function open(started = true) {
    const w = mount(BigGameJosefsLand, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    if (started) {
      await w.find('[data-test="jl-start"]').trigger('click')
      await flushPromises()
    }
    return w
  }

  it('tells the story at every start, then explains the controls only once', async () => {
    let w = await open(false)
    expect(w.find('[data-test="jl-intro"]').exists()).toBe(true)
    expect(w.text()).toContain('Josefs Land')
    expect(w.text()).toContain('Deine Aufgabe')
    expect(w.text()).toContain('1. Mose 41')
    await w.find('[data-test="jl-start"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="jl-how"]').exists()).toBe(true)
    await w.find('[data-test="jl-how-go"]').trigger('click')
    expect(w.find('[data-test="jl-how"]').exists()).toBe(false)
    expect(w.find('[data-test="jl-orders"]').exists()).toBe(true)
    w.unmount()
    // the next time: the story again, but not the explanation
    w = await open(false)
    expect(w.find('[data-test="jl-intro"]').exists()).toBe(true)
    await w.find('[data-test="jl-start"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="jl-how"]').exists()).toBe(false)
    w.unmount()
  })

  it('shows level, coins and the years; the years open their story', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ josefsland: true }))
    const w = await open()
    expect(w.find('[data-test="jl-coins"]').text()).toBe('40')
    await w.find('[data-test="jl-year"]').trigger('click')
    expect(w.text()).toContain('Gutes Jahr 1 von 7')
    expect(w.text()).toContain('Sieben Jahre lang gibt es viel Korn')
    await w.find('[data-test="jl-close"]').trigger('click')
    expect(w.text()).not.toContain('Gutes Jahr 1 von 7')
    w.unmount()
  })

  it('the buttons open the order board, the store, the land and the goals', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ josefsland: true }))
    const w = await open()
    await w.find('[data-test="jl-orders"]').trigger('click')
    expect(w.find('[data-test="jl-board"]').exists()).toBe(true)
    expect(w.findAll('.jl-order')).toHaveLength(3)
    await w.find('[data-test="jl-close"]').trigger('click')
    await w.find('[data-test="jl-store"]').trigger('click')
    expect(w.text()).toContain('Kornspeicher')
    expect(w.text()).toContain('Scheune')
    await w.find('[data-test="jl-close"]').trigger('click')
    await w.find('[data-test="jl-land"]').trigger('click')
    expect(w.findAll('[data-test^="jl-landrow-"]')).toHaveLength(12)
    expect(w.text()).toContain('Mühle')
    await w.find('[data-test="jl-close"]').trigger('click')
    await w.find('[data-test="jl-goals"]').trigger('click')
    expect(w.text()).toContain('Das erste Feld')
    expect(w.text()).toContain('Pflanze 5 Mal')
    await w.find('[data-test="jl-tab-daily"]').trigger('click')
    expect(w.text()).toContain('Drei Aufgaben für heute')
    await w.find('[data-test="jl-tab-album"]').trigger('click')
    expect(w.text()).toContain('Entdeckt: 0 von')
    w.unmount()
  })

  it('an order is delivered with the goods of the store and pays coins and experience', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ josefsland: true }))
    const w = await open()
    const g = probe().game
    const o = g.orders[0]!
    const coins = g.coins
    for (const l of o.lines) g.inv[l.good] = l.n
    probe().refresh()
    await flushPromises()
    await w.find('[data-test="jl-orders"]').trigger('click')
    const btn = w.find('[data-test="jl-fill-0"]')
    expect(btn.attributes('disabled')).toBeUndefined()
    await btn.trigger('click')
    expect(g.coins).toBeGreaterThanOrEqual(coins + o.coins)
    expect(g.orders[0]).toBeNull()
    expect(w.find('[data-test="jl-fill-0"]').exists()).toBe(false)
    w.unmount()
  })

  it('an order that cannot be filled yet cannot be delivered', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ josefsland: true }))
    const w = await open()
    await w.find('[data-test="jl-orders"]').trigger('click')
    expect(w.find('[data-test="jl-fill-0"]').attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('the store sells a good for its price', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ josefsland: true }))
    const w = await open()
    const g = probe().game
    g.inv.wheat = 5
    probe().refresh()
    await flushPromises()
    await w.find('[data-test="jl-store"]').trigger('click')
    await w.find('[data-test="jl-sell-wheat"]').trigger('click')
    expect(g.inv.wheat).toBe(4)
    expect(g.coins).toBe(43)
    w.unmount()
  })

  it('keeps the game on the device and leaves with the back button', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ josefsland: true }))
    const w = await open()
    probe().game.coins = 777
    await w.find('[data-test="jl-leave"]').trigger('click')
    expect(w.emitted('leave')).toHaveLength(1)
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') as { coins: number; v: number }
    expect(saved.v).toBe(1)
    expect(saved.coins).toBe(777)
    w.unmount()
    // opened again: the same game
    const w2 = await open()
    expect(w2.find('[data-test="jl-coins"]').text()).toBe('777')
    w2.unmount()
  })
})
