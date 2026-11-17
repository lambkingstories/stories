/**
 * "Gideons Nacht" on the screen: the overview with the story and the four chapters, the explanation only once, the story of a chapter, the hint of a new
 * thing only once, the game with its buttons, the pause, a won round with its stars and the saved progress, the texts in all three languages.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '../src/i18n/bigGames'
import { SOLUTIONS } from '../src/utils/gideonSolutions'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameGideon from '@/components/molecules/games/BigGameGideon.vue'
import useBigGames from '@/use/useBigGames'

const app = withGameTexts(rawApp)
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })

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

describe('BigGameGideon', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
    window.location.hash = '#/app/spiel/gideon?probe=1'
  })
  afterEach(() => {
    vi.useRealTimers()
    delete (window as unknown as { __gideon?: unknown }).__gideon
  })

  async function open() {
    const w = mount(BigGameGideon, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('opens with the story, four chapters and 36 levels', async () => {
    const w = await open()
    expect(w.text()).toContain('Gideons Nacht')
    expect(w.text()).toContain('Richter 7,12')
    expect(w.text()).toContain('Deine Aufgabe')
    expect(w.findAll('.gd-chapter')).toHaveLength(4)
    expect(w.findAll('.gd-level')).toHaveLength(36)
    expect(w.text()).toContain('Das Lager im Tal')
    expect(w.text()).toContain('Die Flucht')
    w.unmount()
  })

  it('shows the explanation once, then the story of the chapter, then the hint, then plays', async () => {
    const w = await open()
    await w.find('[data-test="gideon-level-0"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(true)
    await w.find('[data-test="gideon-go"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(false)
    expect(w.text()).toContain('Das Lager im Tal')
    await w.find('[data-test="gideon-chapter-go"]').trigger('click')
    expect(w.find('[data-test="gideon-pause"]').exists()).toBe(true)
    expect(w.find('[data-test="gideon-restart"]').exists()).toBe(true)
    expect(w.text()).toContain('Ziehe den Krug zurück')
    expect(w.text()).toContain('0 von 1 erschreckt')
    // back to the overview and into the level again: neither card comes a second time, the hint neither
    await w.find('[data-test="gideon-pause"]').trigger('click')
    await w.find('[data-test="gideon-menu"]').trigger('click')
    await w.find('[data-test="gideon-level-1"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(false)
    expect(w.text()).not.toContain('Gott macht Gideons Heer klein')
    w.unmount()
  })

  it('brings the explanation back with the button of the overview', async () => {
    const w = await open()
    await w.find('[data-test="gideon-how"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(true)
    await w.find('[data-test="gideon-go"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(false)
    expect(w.find('.gd-menu').exists()).toBe(true)
    w.unmount()
  })

  it('pauses and resumes', async () => {
    const w = await open()
    await w.find('[data-test="gideon-level-3"]').trigger('click')
    await w.find('[data-test="gideon-go"]').trigger('click')
    await w.find('[data-test="gideon-pause"]').trigger('click')
    expect(w.find('[data-test="gideon-resume"]').exists()).toBe(true)
    await w.find('[data-test="gideon-resume"]').trigger('click')
    expect(w.find('[data-test="gideon-resume"]').exists()).toBe(false)
    w.unmount()
  })

  it('shows the stars of a won round and saves them for the level', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = await open()
    await w.find('[data-test="gideon-level-0"]').trigger('click')
    await w.find('[data-test="gideon-go"]').trigger('click')
    await w.find('[data-test="gideon-chapter-go"]').trigger('click')
    const probe = (window as unknown as { __gideon: { fire: (a: number, p: number, t?: number) => boolean; advance: (s: number) => void; sim: { status: string; stars: number } } }).__gideon
    expect(probe).toBeTruthy()
    const shot = SOLUTIONS[0]![0]!
    expect(probe.fire(shot.a, shot.p)).toBe(true)
    probe.advance(6)
    expect(probe.sim.status).toBe('won')
    expect(probe.sim.stars).toBe(3)
    expect(useBigGames().levels('gideon')[0]).toBe(3)
    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(w.text()).toContain('Wunderbar')
    expect(w.find('[data-test="gideon-next"]').exists()).toBe(true)
    await w.find('[data-test="gideon-menu"]').trigger('click')
    expect(w.findAll('.gd-level')).toHaveLength(36)
    w.unmount()
  })
})

describe('the texts of the game', () => {
  const keys = (o: unknown, p = ''): string[] =>
    o && typeof o === 'object'
      ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (Array.isArray(v) ? v.flatMap((x, i) => keys(x, `${p}${k}.${i}.`).concat(typeof x === 'string' ? [`${p}${k}.${i}`] : [])) : typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
      : []
  it('are complete in german, english and spanish', () => {
    const de = keys(BIG_GAME_TEXTS.de.gideon).sort()
    expect(de.length).toBeGreaterThan(90)
    expect(keys(BIG_GAME_TEXTS.en.gideon).sort()).toEqual(de)
    expect(keys(BIG_GAME_TEXTS.es.gideon).sort()).toEqual(de)
  })

  it('have four chapters with a story and a task, 36 level names, and say what the game is about', () => {
    for (const l of ['de', 'en', 'es'] as const) {
      const t = BIG_GAME_TEXTS[l].gideon as { chapters: { name: string; story: string; task: string }[]; levels: string[]; story: string; task: string; help: string }
      expect(t.chapters).toHaveLength(4)
      for (const c of t.chapters) expect(c.story.length).toBeGreaterThan(20)
      expect(t.levels).toHaveLength(36)
      expect(new Set(t.levels).size).toBe(36)
      expect(t.story).toMatch(/Gideon|Gedeón/)
      expect(t.task.length).toBeGreaterThan(20)
      expect(t.help.length).toBeGreaterThan(2)
    }
  })

  it('name a hint for every new thing of the levels', async () => {
    const { LEVELS } = await import('../src/utils/gideonLevels')
    for (const l of ['de', 'en', 'es'] as const) {
      const hints = (BIG_GAME_TEXTS[l].gideon as { hint: Record<string, string> }).hint
      for (const lv of LEVELS) if (lv.intro) expect(hints[lv.intro], `${l} ${lv.intro}`.trim()).toBeTruthy()
    }
  })
})
