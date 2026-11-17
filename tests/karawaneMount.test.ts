/**
 * "Karawane über die Dünen" on the screen: the routes list with six routes, the card that explains the game comes only once, a route starts and
 * shows the counters, the workshop buys a part with the coins of the save, and the keys steer the cart.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameKarawane from '@/components/molecules/games/BigGameKarawane.vue'
import useBigGames from '@/use/useBigGames'
import { SAVE_KEY } from '../src/utils/karawaneUpgrades'

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

describe('BigGameKarawane', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
  })

  async function open() {
    const w = mount(BigGameKarawane, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('lists the six routes, all open from the start', async () => {
    const w = await open()
    expect(w.findAll('.kg-route')).toHaveLength(6)
    for (const r of w.findAll('.kg-route')) expect(r.attributes('disabled')).toBeUndefined()
    expect(w.text()).toContain('Die Karawane nach Ägypten')
    expect(w.text()).toContain('Auf nach Jerusalem')
    w.unmount()
  })

  it('shows the explanation once at the first start, never again, and the question button brings it back', async () => {
    let w = await open()
    await w.find('[data-test="karawane-route-0"]').trigger('click')
    await flushPromises()
    // the first time a route is picked its story card comes (what it is about, what the task is)
    expect(w.find('[data-test="karawane-story"]').exists()).toBe(true)
    expect(w.text()).toContain('Deine Aufgabe')
    await w.find('[data-test="karawane-story-go"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="karawane-go"]').exists()).toBe(true)
    await w.find('[data-test="karawane-go"]').trigger('click')
    expect(w.find('[data-test="karawane-go"]').exists()).toBe(false)
    expect(w.find('.kg-hud').exists()).toBe(true)
    w.unmount()
    w = await open()
    await w.find('[data-test="karawane-route-1"]').trigger('click')
    await flushPromises()
    await w.find('[data-test="karawane-story-go"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="karawane-go"]').exists()).toBe(false)
    expect(w.find('.kg-hud').exists()).toBe(true)
    w.unmount()
    w = await open()
    await w.find('[data-test="karawane-how"]').trigger('click')
    expect(w.find('[data-test="karawane-go"]').exists()).toBe(true)
    w.unmount()
  })

  it('pauses, goes on, and leaves to the routes', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ karawane: true }))
    const w = await open()
    await w.find('[data-test="karawane-route-2"]').trigger('click')
    await flushPromises()
    await w.find('[data-test="karawane-story-go"]').trigger('click')
    await flushPromises()
    await w.find('.kg-pause').trigger('click')
    expect(w.text()).toContain('Pause')
    const buttons = w.findAll('.kg-card--small button')
    await buttons[buttons.length - 1]!.trigger('click')
    expect(w.findAll('.kg-route')).toHaveLength(6)
    w.unmount()
  })

  it('the workshop buys a part with the coins and keeps it on the device', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, coins: 500, up: { wheels: 0, suspension: 0, water: 0, cover: 0, harness: 0, hop: 0 }, owned: ['donkey'], animal: 'donkey', best: [], earned: 0, rounds: 0, seen: [] }))
    const w = await open()
    await w.find('[data-test="karawane-shop"]').trigger('click')
    expect(w.find('[data-test="karawane-workshop"]').exists()).toBe(true)
    await w.find('[data-test="karawane-buy-wheels"]').trigger('click')
    await w.find('[data-test="karawane-animal-ox"]').trigger('click')
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') as { coins: number; up: { wheels: number }; owned: string[]; animal: string }
    expect(saved.up.wheels).toBe(1)
    expect(saved.owned).toContain('ox')
    expect(saved.animal).toBe('ox')
    expect(saved.coins).toBe(500 - 40 - 160)
    await w.find('[data-test="karawane-shop-close"]').trigger('click')
    expect(w.find('[data-test="karawane-workshop"]').exists()).toBe(false)
    w.unmount()
  })

  it('shows the record of a route in the menu', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, coins: 0, up: {}, owned: ['donkey'], animal: 'donkey', best: [0, 432], earned: 0, rounds: 1 }))
    const w = await open()
    expect(w.findAll('.kg-route')[1]!.text()).toContain('432')
    w.unmount()
  })

  it('the story card comes once per route: a seen route starts at once', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ karawane: true }))
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, coins: 0, up: {}, owned: ['donkey'], animal: 'donkey', best: [], earned: 0, rounds: 0, seen: [2] }))
    const w = await open()
    await w.find('[data-test="karawane-route-2"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="karawane-story"]').exists()).toBe(false)
    expect(w.find('.kg-hud').exists()).toBe(true)
    w.unmount()
  })

  it('shows the character of every route with its symbols, the story of the game, the wagon and four animals in the workshop', async () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, coins: 100, up: {}, owned: ['donkey'], animal: 'donkey', best: [], earned: 0, rounds: 0, seen: [] }))
    const w = await open()
    expect(w.findAll('.kg-chip').length).toBeGreaterThanOrEqual(6)
    expect(w.text()).toContain('Deine Aufgabe')
    await w.find('[data-test="karawane-shop"]').trigger('click')
    expect(w.find('[data-test="karawane-wagon"]').exists()).toBe(true)
    expect(w.findAll('.kg-part')).toHaveLength(6)
    expect(w.findAll('.kg-animal')).toHaveLength(4)
    expect(w.find('[data-test="karawane-animal-horse"]').exists()).toBe(true)
    expect(w.find('[data-test="karawane-buy-hop"]').exists()).toBe(true)
    w.unmount()
  })

  it('shows the sun that wanders in the game and the before and after values in the workshop', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ karawane: true }))
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, coins: 900, up: {}, owned: ['donkey'], animal: 'donkey', best: [], earned: 0, rounds: 0, seen: [0] }))
    let w = await open()
    await w.find('[data-test="karawane-shop"]').trigger('click')
    expect(w.find('[data-test="karawane-now"]').text()).toContain('km/h')
    expect(w.find('[data-test="karawane-delta-wheels"]').text()).toMatch(/→/)
    expect(w.find('[data-test="karawane-animal-stat-horse"]').text()).toMatch(/→/)
    expect(w.find('[data-test="karawane-trial"]').exists()).toBe(true)
    w.unmount()
    w = await open()
    await w.find('[data-test="karawane-route-0"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="karawane-sun"]').exists()).toBe(true)
    w.unmount()
  })
})

