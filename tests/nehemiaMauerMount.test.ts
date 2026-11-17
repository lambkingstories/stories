/**
 * "Nehemias Mauer" on the screen: the overview with the story and the chapters, the explanation only once, the story of a chapter, the game with
 * its buttons, the pause, the texts in all three languages.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '../src/i18n/bigGames'
import { BIG_GAMES } from '../src/data/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameNehemia from '@/components/molecules/games/BigGameNehemia.vue'
import useBigGames from '@/use/useBigGames'

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

describe('BigGameNehemia', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  async function open() {
    const w = mount(BigGameNehemia, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('is a game of the corner, opened with 280 stars', () => {
    const g = BIG_GAMES.find((x) => x.id === 'nehemia')!
    expect(g.at).toBe(280)
    expect(g.maxStars).toBe(180)
  })

  it('opens with the story, six chapters and sixty levels', async () => {
    const w = await open()
    expect(w.text()).toContain('Nehemias Mauer')
    expect(w.text()).toContain('Hier geht es um Nehemia')
    expect(w.text()).toContain('Deine Aufgabe')
    expect(w.findAll('.nm-chapter')).toHaveLength(6)
    expect(w.findAll('.nm-level')).toHaveLength(60)
    w.unmount()
  })

  it('shows the explanation once, then the story of the chapter, then plays', async () => {
    const w = await open()
    await w.find('[data-test="nehemia-level-0"]').trigger('click')
    expect(w.find('.nm-how').exists()).toBe(true)
    await w.find('[data-test="nehemia-go"]').trigger('click')
    expect(w.find('.nm-how').exists()).toBe(false)
    expect(w.text()).toContain('Das Schaftor')
    await w.find('[data-test="nehemia-chapter-go"]').trigger('click')
    expect(w.find('[data-test="nehemia-rotate"]').exists()).toBe(true)
    expect(w.find('[data-test="nehemia-drop"]').exists()).toBe(true)
    // back to the overview and into the level again: neither card comes a second time
    await w.find('[data-test="nehemia-pause"]').trigger('click')
    await w.find('[data-test="nehemia-menu"]').trigger('click')
    await w.find('[data-test="nehemia-level-1"]').trigger('click')
    expect(w.find('.nm-how').exists()).toBe(false)
    expect(w.text()).not.toContain('Nehemia ist in Jerusalem angekommen')
    w.unmount()
  })

  it('pauses and resumes', async () => {
    const w = await open()
    await w.find('[data-test="nehemia-level-3"]').trigger('click')
    await w.find('[data-test="nehemia-go"]').trigger('click')
    await w.find('[data-test="nehemia-pause"]').trigger('click')
    expect(w.find('[data-test="nehemia-resume"]').exists()).toBe(true)
    await w.find('[data-test="nehemia-resume"]').trigger('click')
    expect(w.find('[data-test="nehemia-resume"]').exists()).toBe(false)
    w.unmount()
  })
})

describe('the texts of the game', () => {
  const keys = (o: unknown, p = ''): string[] =>
    o && typeof o === 'object'
      ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (Array.isArray(v) ? v.flatMap((x, i) => keys(x, `${p}${k}.${i}.`).concat(typeof x === 'string' ? [`${p}${k}.${i}`] : [])) : typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
      : []
  it('are complete in german, english and spanish', () => {
    const de = keys(BIG_GAME_TEXTS.de.nehemia).sort()
    expect(de.length).toBeGreaterThan(60)
    expect(keys(BIG_GAME_TEXTS.en.nehemia).sort()).toEqual(de)
    expect(keys(BIG_GAME_TEXTS.es.nehemia).sort()).toEqual(de)
  })

  it('have six chapters with a story and a task, and a story that says what the game is about', () => {
    for (const l of ['de', 'en', 'es'] as const) {
      const t = BIG_GAME_TEXTS[l].nehemia as { chapters: { name: string; story: string; task: string }[]; story: string; task: string }
      expect(t.chapters).toHaveLength(6)
      for (const c of t.chapters) expect(c.story.length).toBeGreaterThan(20)
      expect(t.story).toContain(l === 'de' ? 'Nehemia' : 'Nehem')
      expect(t.task.length).toBeGreaterThan(20)
    }
  })
})
