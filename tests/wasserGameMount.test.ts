/**
 * "Wasser für das Volk" on the screen: the list of the three worlds (36 levels, all open), the card that explains the game only the very first time, pause and restart,
 * and the end of a round (stars and progress are kept).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameWasser from '@/components/molecules/games/BigGameWasser.vue'
import useBigGames from '@/use/useBigGames'
import { LEVELS } from '@/utils/wasserLevels'

const texts = withGameTexts(app) as { de?: object; en?: object }
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: texts.de ?? {}, en: texts.en ?? {} } })

/** jsdom does not load pictures: every one "fails" at once, so the game goes on without them. */
class FailingImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  width = 0
  height = 0
  complete = false
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

describe('BigGameWasser', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    window.location.hash = '#/app/spiel/wasser?probe=1'
  })

  async function open() {
    const w = mount(BigGameWasser, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('lists three worlds with twelve levels each, all of them open', async () => {
    const w = await open()
    expect(w.findAll('.wg-world')).toHaveLength(3)
    expect(w.findAll('.wg-level')).toHaveLength(LEVELS.length)
    expect(LEVELS.length).toBeGreaterThanOrEqual(36)
    for (const l of w.findAll('.wg-level')) expect(l.attributes('disabled')).toBeUndefined()
    expect(w.text()).toContain('Wasser für das Volk')
    w.unmount()
  })

  it('shows the card that explains the game once, at the first level, and never again', async () => {
    const w = await open()
    await w.find('[data-test="wasser-level-0"]').trigger('click')
    expect(w.find('[data-test="wasser-go"]').exists()).toBe(true)
    await w.find('[data-test="wasser-go"]').trigger('click')
    expect(w.find('[data-test="wasser-go"]').exists()).toBe(false)
    // another level: no card
    w.unmount()
    const again = await open()
    await again.find('[data-test="wasser-level-3"]').trigger('click')
    expect(again.find('[data-test="wasser-go"]').exists()).toBe(false)
    // the question mark of the list brings the card back
    expect(again.find('.wg-hud').exists()).toBe(true)
    again.unmount()
  })

  it('has pause, restart and tip in the game, and the pause leads back to the list', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ wasser: true }))
    localStorage.setItem('lk-wasser-story-v1', JSON.stringify({ 0: true, 1: true, 2: true }))
    const w = await open()
    await w.find('[data-test="wasser-level-1"]').trigger('click')
    expect(w.find('.wg-hud').exists()).toBe(true)
    expect(w.findAll('.wg-flower')).toHaveLength(0 + w.findAll('.wg-flower').length)
    await w.find('[data-test="wasser-pause"]').trigger('click')
    expect(w.text()).toContain('Pause')
    await w.find('[data-test="wasser-menu"]').trigger('click')
    expect(w.find('.wg-levels').exists()).toBe(true)
    await w.find('[data-test="wasser-level-1"]').trigger('click')
    await w.find('[data-test="wasser-restart"]').trigger('click')
    expect(w.find('.wg-hud').exists()).toBe(true)
    await w.find('[data-test="wasser-tip"]').trigger('click')
    w.unmount()
  })

  it('a won round ends with its stars, keeps them and offers the next level', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ wasser: true }))
    localStorage.setItem('lk-wasser-story-v1', JSON.stringify({ 0: true, 1: true, 2: true }))
    const w = await open()
    await w.find('[data-test="wasser-level-0"]').trigger('click')
    const probe = (window as unknown as { __wasser: { w: import('../src/utils/wasserGame').World; begin: (i: number) => void; advance: (s: number) => void } }).__wasser
    expect(probe).toBeDefined()
    const g = probe.w
    // the jar is full and the plants are wet: a round with three stars
    g.started = true
    g.phase = 'play'
    for (const k of g.vcells) g.m[k] = 1
    for (const p of g.plants) p.bloomed = true
    g.emitted = g.vesselMass = g.goal
    for (let i = 0; i < 140; i++) probe.advance(0.05)
    await new Promise((r) => setTimeout(r, 700))
    await flushPromises()
    expect(w.find('[data-test="wasser-next"]').exists()).toBe(true)
    expect(useBigGames().levels('wasser')[0]).toBeGreaterThanOrEqual(2)
    await w.find('[data-test="wasser-menu"]').trigger('click')
    expect(w.findAll('.wg-level')[0]!.text()).toContain('1')
    w.unmount()
  })

  it('a round without enough water ends friendly: again, no stars', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ wasser: true }))
    localStorage.setItem('lk-wasser-story-v1', JSON.stringify({ 0: true, 1: true, 2: true }))
    const w = await open()
    await w.find('[data-test="wasser-level-2"]').trigger('click')
    const probe = (window as unknown as { __wasser: { w: import('../src/utils/wasserGame').World; advance: (s: number) => void } }).__wasser
    const g = probe.w
    g.started = true
    g.phase = 'lost'
    g.events.push({ type: 'end', phase: 'lost' })
    probe.advance(0.05)
    await new Promise((r) => setTimeout(r, 1000))
    await flushPromises()
    expect(w.find('[data-test="wasser-again"]').exists()).toBe(true)
    expect(w.find('[data-test="wasser-next"]').exists()).toBe(false)
    expect(useBigGames().levels('wasser')[2] ?? 0).toBe(0)
    w.unmount()
  })

  it('tells the story of a world once (at its first level), again from the banner, and the tip shows the way step by step', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ wasser: true }))
    const w = await open()
    await w.find('[data-test="wasser-level-0"]').trigger('click')
    expect(w.find('[data-test="wasser-story-go"]').exists()).toBe(true)
    expect(w.text()).toContain('Hiskia')
    expect(w.text()).toContain('Deine Aufgabe')
    await w.find('[data-test="wasser-story-go"]').trigger('click')
    expect(w.find('[data-test="wasser-story-go"]').exists()).toBe(false)
    // the tip: a line for the first piece of the way (the text says so), pressing again does not break anything
    await w.find('[data-test="wasser-tip"]').trigger('click')
    expect(w.find('.wg-tip').exists()).toBe(true)
    await w.find('[data-test="wasser-tip"]').trigger('click')
    await w.find('[data-test="wasser-menu"]').exists()
    await w.find('[data-test="wasser-restart"]').trigger('click')
    expect(w.find('[data-test="wasser-story-go"]').exists()).toBe(false)
    // the second world has its own story
    w.unmount()
    const again = await open()
    await again.find('[data-test="wasser-level-12"]').trigger('click')
    expect(again.find('[data-test="wasser-story-go"]').exists()).toBe(true)
    expect(again.text()).toContain('Elia')
    again.unmount()
  })
})
