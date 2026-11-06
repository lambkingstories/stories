/**
 * "Elia läuft" on the screen: the levels list opens with only the first level of the first world open, the free run is locked, a level
 * starts and shows the bread counter, the keys steer the run, and a finished level opens the next one.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), playElia: vi.fn(), stop: vi.fn() }) }))

import BigGameElia from '@/components/molecules/games/BigGameElia.vue'
import useBigGames from '@/use/useBigGames'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })

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

describe('BigGameElia', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
  })

  async function open() {
    const w = mount(BigGameElia, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('lists five worlds of three levels, only the very first open, the free run locked', async () => {
    const w = await open()
    const levels = w.findAll('.eg-level')
    expect(levels).toHaveLength(15)
    expect(levels[0]!.attributes('disabled')).toBeUndefined()
    expect(levels[1]!.attributes('disabled')).toBeDefined()
    expect(levels[3]!.attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="elia-free"]').attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('opens the next levels of the first world after a star, and the free run after the third', async () => {
    const bg = useBigGames()
    bg.record('elia', 0, 1)
    let w = await open()
    expect(w.findAll('.eg-level')[1]!.attributes('disabled')).toBeUndefined()
    expect(w.findAll('.eg-level')[2]!.attributes('disabled')).toBeDefined()
    w.unmount()
    bg.record('elia', 1, 2)
    bg.record('elia', 2, 3)
    w = await open()
    expect(w.find('[data-test="elia-free"]').attributes('disabled')).toBeUndefined()
    // the second world is not built yet
    expect(w.findAll('.eg-level')[3]!.attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('starts a level with the bread counter at 0 and a canvas', async () => {
    const w = await open()
    await w.find('[data-test="elia-level-0"]').trigger('click')
    expect(w.find('[data-test="elia-canvas"]').exists()).toBe(true)
    expect(w.find('[data-test="elia-bread"]').text()).toBe('0')
    w.unmount()
  })

  it('explains the game in the first rounds and starts after "Los"', async () => {
    const w = await open()
    await w.find('[data-test="elia-level-0"]').trigger('click')
    expect(w.text()).toContain('Kurz wischen')
    expect(w.text()).toContain('Hunger')
    await w.find('[data-test="elia-go"]').trigger('click')
    expect(w.find('[data-test="elia-go"]').exists()).toBe(false)
    w.unmount()
  })

  it('does not explain again after three rounds, but the menu has the explanation', async () => {
    const bg = useBigGames()
    bg.record('elia', 0, 1)
    bg.record('elia', 0, 1)
    bg.record('elia', 0, 1)
    const w = await open()
    await w.find('[data-test="elia-level-0"]').trigger('click')
    expect(w.find('[data-test="elia-go"]').exists()).toBe(false)
    w.unmount()
    const m = await open()
    await m.find('[data-test="elia-how"]').trigger('click')
    expect(m.find('[data-test="elia-go"]').exists()).toBe(true)
    m.unmount()
  })

  it('pauses with the escape key and goes on', async () => {
    const w = await open()
    await w.find('[data-test="elia-level-0"]').trigger('click')
    await w.find('[data-test="elia-go"]').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(w.text()).toContain('Pause')
    w.unmount()
  })
})
