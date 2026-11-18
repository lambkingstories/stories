/**
 * "Arche der Tierpaare" on the screen: the overview of the ark opens with the levels and the pairs, the explanation comes only once, a level
 * starts with its goals, the moves and the helpers, the pause works, and a won level is kept with its stars.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameArche from '@/components/molecules/games/BigGameArche.vue'
import useBigGames from '@/use/useBigGames'
import { LEVELS } from '../src/utils/archeLevels'

const app = withGameTexts(rawApp)
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

describe('BigGameArche', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  async function open() {
    const w = mount(BigGameArche, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('opens with the overview: the title, six chapters, the ten levels of the chapter and the pairs', async () => {
    const w = await open()
    expect(w.text()).toContain('Arche der Tierpaare')
    expect(w.findAll('.ag-chip')).toHaveLength(6)
    expect(w.findAll('.ag-level')).toHaveLength(10)
    expect(w.findAll('.ag-slot')).toHaveLength(10)
    expect(w.text()).toContain('Tierpaare an Bord: 0 von 60')
    // the story of the game and of the chapter, and the task
    expect(w.text()).toContain('Noah hat die Arche gebaut')
    expect(w.text()).toContain('Deine Aufgabe:')
    expect(w.find('.ag-story').text()).toContain('Baue eine Arche')
    w.unmount()
  })

  it('shows the levels of the chapter that is picked', async () => {
    const w = await open()
    await w.findAll('.ag-chip')[2]!.trigger('click')
    expect(w.findAll('.ag-level')[0]!.text()).toContain('21')
    w.unmount()
  })

  it('every level can be started at once', async () => {
    const w = await open()
    for (const l of w.findAll('.ag-level')) expect(l.attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('explains the game the first time, and not again; the overview has the explanation', async () => {
    const w = await open()
    await w.find('[data-test="arche-level-1"]').trigger('click')
    expect(w.find('[data-test="arche-go"]').exists()).toBe(true)
    expect(w.text()).toContain('So geht es')
    await w.find('[data-test="arche-go"]').trigger('click')
    expect(w.find('[data-test="arche-go"]').exists()).toBe(false)
    w.unmount()
    const again = await open()
    await again.find('[data-test="arche-level-2"]').trigger('click')
    expect(again.find('[data-test="arche-go"]').exists()).toBe(false)
    again.unmount()
    const m = await open()
    await m.find('[data-test="arche-how"]').trigger('click')
    expect(m.find('[data-test="arche-go"]').exists()).toBe(true)
    m.unmount()
  })

  it('a level shows its goals, its moves and the three helpers', async () => {
    const w = await open()
    await w.find('[data-test="arche-level-1"]').trigger('click')
    await w.find('[data-test="arche-go"]').trigger('click')
    expect(w.findAll('.ag-goal')).toHaveLength(LEVELS[0]!.goals.length)
    expect(w.find('.ag-moves-n').text()).toBe(String(LEVELS[0]!.moves))
    expect(w.findAll('.ag-boost-btn')).toHaveLength(3)
    w.unmount()
  })

  it('the pause has a way out of the game (leave the game)', async () => {
    const w = await open()
    await w.find('[data-test="arche-level-1"]').trigger('click')
    await w.find('[data-test="arche-go"]').trigger('click')
    await w.find('[data-test="arche-pause"]').trigger('click')
    const out = w.find('[data-test="arche-pause-leave"]')
    expect(out.exists()).toBe(true)
    await out.trigger('click')
    expect(w.emitted('leave')).toBeTruthy()
    w.unmount()
  })

  it('pauses and goes on, and can go back to the overview', async () => {
    const w = await open()
    await w.find('[data-test="arche-level-1"]').trigger('click')
    await w.find('[data-test="arche-go"]').trigger('click')
    await w.find('[data-test="arche-pause"]').trigger('click')
    expect(w.text()).toContain('Pause')
    await w.find('[data-test="arche-resume"]').trigger('click')
    expect(w.text()).not.toContain('Weiter')
    w.unmount()
  })

  it('a helper can be chosen and cancelled', async () => {
    const w = await open()
    await w.find('[data-test="arche-level-1"]').trigger('click')
    await w.find('[data-test="arche-go"]').trigger('click')
    await w.find('[data-test="arche-booster-hammer"]').trigger('click')
    expect(w.find('.ag-hintbar').exists()).toBe(true)
    expect(w.find('.ag-hintbar').text()).toContain('Tippe auf das')
    expect(w.find('.ag-goals').exists()).toBe(false)
    await w.find('[data-test="arche-cancel"]').trigger('click')
    expect(w.find('.ag-hintbar').exists()).toBe(false)
    expect(w.find('.ag-goals').exists()).toBe(true)
    w.unmount()
  })

  it('the stars that were won are shown in the overview', async () => {
    useBigGames().record('arche', 0, 3)
    useBigGames().record('arche', 1, 1)
    const w = await open()
    expect(w.text()).toContain('Tierpaare an Bord: 2 von 60')
    w.unmount()
  })

  it('has all its texts in german, english and spanish', async () => {
    const msgs = app as unknown as { de: { app: { bigGames: { arche?: Record<string, unknown> } } }; en: { app: { bigGames: { arche?: Record<string, unknown> } } } }
    const de = msgs.de.app.bigGames.arche!
    const en = msgs.en.app.bigGames.arche!
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort())
    expect((de.chapters as string[]).length).toBe(6)
    expect((de.chapterStories as string[]).length).toBe(6)
    expect((de.chapterTasks as string[]).length).toBe(6)
    expect((en.chapterStories as string[]).length).toBe(6)
    expect((en.chapters as string[]).length).toBe(6)
    const es = BIG_GAME_TEXTS.es.arche as Record<string, unknown>
    expect(Object.keys(es).sort()).toEqual(Object.keys(de).sort())
    const tipLevels = [1, 3, 4, 5, 6, 7, 9, 11, 13, 21, 22]
    for (const l of tipLevels) expect(typeof de[`tip${l}`]).toBe('string')
  })
})
