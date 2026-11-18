/**
 * "Der Töpfer" on the screen: the menu shows the story, the task, 30 vessels in 5 chapters and the shelf; the explanation card has three
 * short lines and comes only the first time; a level opens with the tools of the potter.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameToepfer from '@/components/molecules/games/BigGameToepfer.vue'
import useBigGames from '@/use/useBigGames'

const messages = withGameTexts(app as unknown as object) as unknown as { de: object; en: object }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: messages.de, en: messages.en } })

/** jsdom does not load pictures: every one "fails" at once, so the game goes on without them. */
class FailingImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 0
  height = 0
  complete = false
  naturalWidth = 0
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

describe('BigGameToepfer', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
  })

  async function open() {
    const w = mount(BigGameToepfer, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('the menu has the story, the task, 30 vessels in 5 chapters and the shelf button', async () => {
    const w = await open()
    const box = w.find('[data-test="game-intro"]')
    expect(box.text()).toContain('Jeremia 18,3–4')
    expect(box.text()).toContain('Deine Aufgabe')
    expect(w.findAll('.tp-chapter')).toHaveLength(5)
    expect(w.findAll('.tp-level')).toHaveLength(30)
    expect(w.find('[data-test="toepfer-shelf"]').text()).toContain('0 / 30')
    w.unmount()
  })

  it('the explanation card has three lines and comes only the first time; a level then shows the tools', async () => {
    const w = await open()
    await w.find('[data-test="toepfer-level-0"]').trigger('click')
    expect(w.findAll('.tp-how-line')).toHaveLength(3)
    await w.find('[data-test="toepfer-go"]').trigger('click')
    // the story of the first chapter comes once
    await w.find('[data-test="toepfer-chapter-go"]').trigger('click')
    expect(w.find('[data-test="toepfer-undo"]').exists()).toBe(true)
    expect(w.find('[data-test="toepfer-help"]').exists()).toBe(true)
    expect(w.find('[data-test="toepfer-reset"]').exists()).toBe(true)
    // "Done" does not go on while the vessel does not fit
    expect(w.find('[data-test="toepfer-done"]').attributes('aria-disabled')).toBe('true')
    await w.find('[data-test="toepfer-menu"]').exists()
    w.unmount()
    const again = await open()
    await again.find('[data-test="toepfer-level-1"]').trigger('click')
    expect(again.find('[data-test="toepfer-go"]').exists()).toBe(false)
    again.unmount()
  })
})
