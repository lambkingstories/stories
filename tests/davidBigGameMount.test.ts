/**
 * "David's sling" (the big game) on the screen: the levels list has the box with the background story and the task, the card that
 * explains the game comes only the first time, and Goliath's level tells who he is once, before it begins.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playDavid: vi.fn(), playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameDavid from '@/components/molecules/games/BigGameDavid.vue'
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

describe('BigGameDavid', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
  })

  async function open() {
    const w = mount(BigGameDavid, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('shows the background story with the verse and the task in the menu', async () => {
    const w = await open()
    const box = w.find('[data-test="david-story"]')
    expect(box.exists()).toBe(true)
    expect(box.text()).toContain('Worum es geht')
    expect(box.text()).toContain('Löwe und Bär')
    expect(box.text()).toContain('1. Samuel 17,34')
    expect(box.text()).toContain('Deine Aufgabe')
    w.unmount()
  })

  it('the explanation card has three short lines and comes only the first time', async () => {
    const w = await open()
    const levels = w.findAll('.dg-level')
    expect(levels.length).toBe(10)
    await levels[0]!.trigger('click')
    expect(w.find('[data-test="david-go"]').exists()).toBe(true)
    expect(w.findAll('.dg-how-line')).toHaveLength(3)
    await w.find('[data-test="david-go"]').trigger('click')
    expect(w.find('[data-test="david-go"]').exists()).toBe(false)
    w.unmount()
    const again = await open()
    await again.findAll('.dg-level')[1]!.trigger('click')
    expect(again.find('[data-test="david-go"]').exists()).toBe(false)
    again.unmount()
  })

  it('the pause has a way out of the game (leave the game)', async () => {
    const w = await open()
    await w.findAll('.dg-level')[0]!.trigger('click')
    await w.find('[data-test="david-go"]').trigger('click')
    await w.find('button[aria-label="Pause"]').trigger('click')
    const out = w.find('[data-test="david-pause-leave"]')
    expect(out.exists()).toBe(true)
    await out.trigger('click')
    expect(w.emitted('leave')).toBeTruthy()
    w.unmount()
  })

  it('tells about Goliath once before his level, never at the other levels', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ david: true }))
    const w = await open()
    await w.findAll('.dg-level')[9]!.trigger('click')
    const card = w.find('[data-test="david-goliath-story"]')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('fünf Steine')
    expect(card.text()).toContain('1. Samuel 17,40')
    await w.find('[data-test="david-goliath-go"]').trigger('click')
    expect(w.find('[data-test="david-goliath-story"]').exists()).toBe(false)
    w.unmount()
    const again = await open()
    await again.findAll('.dg-level')[9]!.trigger('click')
    expect(again.find('[data-test="david-goliath-story"]').exists()).toBe(false)
    again.unmount()
    const other = await open()
    await other.findAll('.dg-level')[0]!.trigger('click')
    expect(other.find('[data-test="david-goliath-story"]').exists()).toBe(false)
    other.unmount()
  })
})
