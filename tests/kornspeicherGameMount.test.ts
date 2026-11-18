/**
 * "Josefs Kornspeicher" on the screen: the overview with the story and the four chapters, the explanation only once, the story of a chapter, the hint of a new
 * thing only once, the game with its buttons, the pause, a won round with its stars and the saved progress, the texts in all three languages.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '../src/i18n/bigGames'
import { SOLUTIONS } from '../src/utils/kornspeicherSolutions'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameKornspeicher from '@/components/molecules/games/BigGameKornspeicher.vue'
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

describe('BigGameKornspeicher', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
    window.location.hash = '#/app/spiel/kornspeicher?probe=1'
  })
  afterEach(() => {
    vi.useRealTimers()
    delete (window as unknown as { __kornspeicher?: unknown }).__kornspeicher
  })

  async function open() {
    const w = mount(BigGameKornspeicher, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('opens with the story, four chapters and 36 levels', async () => {
    const w = await open()
    expect(w.text()).toContain('Josefs Kornspeicher')
    expect(w.text()).toContain('1. Mose 41,34')
    expect(w.text()).toContain('Deine Aufgabe')
    expect(w.findAll('.gd-chapter')).toHaveLength(4)
    expect(w.findAll('.gd-level')).toHaveLength(36)
    expect(w.text()).toContain('Am Nil')
    expect(w.text()).toContain('Bei den Pyramiden')
    w.unmount()
  })

  it('shows the explanation once, then the story of the chapter, then the hint, then plays', async () => {
    const w = await open()
    await w.find('[data-test="korn-level-0"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(true)
    await w.find('[data-test="korn-go"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(false)
    expect(w.text()).toContain('Am Nil')
    await w.find('[data-test="korn-chapter-go"]').trigger('click')
    expect(w.find('[data-test="korn-pause"]').exists()).toBe(true)
    expect(w.find('[data-test="korn-restart"]').exists()).toBe(true)
    expect(w.text()).toContain('Ziehe die Schleuder zurück')
    expect(w.text()).toContain('Speicher: 0 von 1')
    // back to the overview and into the level again: neither card comes a second time, the hint neither
    await w.find('[data-test="korn-pause"]').trigger('click')
    await w.find('[data-test="korn-menu"]').trigger('click')
    await w.find('[data-test="korn-level-1"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(false)
    expect(w.text()).not.toContain('Gott zeigt dem Pharao durch Josef')
    w.unmount()
  })

  it('brings the explanation back with the button of the overview', async () => {
    const w = await open()
    await w.find('[data-test="korn-how"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(true)
    await w.find('[data-test="korn-go"]').trigger('click')
    expect(w.find('.gd-how').exists()).toBe(false)
    expect(w.find('.gd-menu').exists()).toBe(true)
    w.unmount()
  })

  it('pauses and resumes', async () => {
    const w = await open()
    await w.find('[data-test="korn-level-3"]').trigger('click')
    await w.find('[data-test="korn-go"]').trigger('click')
    await w.find('[data-test="korn-pause"]').trigger('click')
    expect(w.find('[data-test="korn-resume"]').exists()).toBe(true)
    await w.find('[data-test="korn-resume"]').trigger('click')
    expect(w.find('[data-test="korn-resume"]').exists()).toBe(false)
    w.unmount()
  })

  it('shows the stars of a won round and saves them for the level', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const w = await open()
    await w.find('[data-test="korn-level-0"]').trigger('click')
    await w.find('[data-test="korn-go"]').trigger('click')
    await w.find('[data-test="korn-chapter-go"]').trigger('click')
    const probe = (window as unknown as { __kornspeicher: { fire: (a: number, p: number, t?: number) => boolean; advance: (s: number) => void; sim: { status: string; stars: number } } }).__kornspeicher
    expect(probe).toBeTruthy()
    for (const shot of SOLUTIONS[0]!) {
      expect(probe.fire(shot.a, shot.p, shot.tap)).toBe(true)
      probe.advance(7)
    }
    expect(probe.sim.status).toBe('won')
    expect(probe.sim.stars).toBe(3)
    expect(useBigGames().levels('kornspeicher')[0]).toBe(3)
    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(w.text()).toContain('Wunderbar')
    expect(w.find('[data-test="korn-next"]').exists()).toBe(true)
    await w.find('[data-test="korn-menu"]').trigger('click')
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
    const de = keys(BIG_GAME_TEXTS.de.kornspeicher).sort()
    expect(de.length).toBeGreaterThan(90)
    expect(keys(BIG_GAME_TEXTS.en.kornspeicher).sort()).toEqual(de)
    expect(keys(BIG_GAME_TEXTS.es.kornspeicher).sort()).toEqual(de)
  })

  it('have four chapters with a story and a task, 36 level names, and say what the game is about', () => {
    for (const l of ['de', 'en', 'es'] as const) {
      const t = BIG_GAME_TEXTS[l].kornspeicher as { chapters: { name: string; story: string; task: string }[]; levels: string[]; story: string; task: string; rotate: string }
      expect(t.chapters).toHaveLength(4)
      for (const c of t.chapters) expect(c.story.length).toBeGreaterThan(20)
      expect(t.levels).toHaveLength(36)
      expect(new Set(t.levels).size).toBe(36)
      expect(t.story).toMatch(/Josef|Joseph|José/)
      expect(t.task.length).toBeGreaterThan(20)
      expect(t.rotate.length).toBeGreaterThan(2)
    }
  })

  it('stay short (the rules for the texts of the big games): explanation lines up to 8 words, background up to 25, task up to 12, chapter tasks up to 15, hints up to 10, level names up to 3', () => {
    const words = (x: string) => x.trim().split(/\s+/).length
    for (const l of ['de', 'en', 'es'] as const) {
      const t = BIG_GAME_TEXTS[l].kornspeicher as Record<string, any>
      for (const k of ['howPull', 'howTap', 'howFill']) expect(words(t[k]), `${l} ${k}`).toBeLessThanOrEqual(8)
      expect(words(t.story), `${l} story`).toBeLessThanOrEqual(25)
      expect(words(t.task), `${l} task`).toBeLessThanOrEqual(12)
      for (const c of t.chapters as { story: string; task: string }[]) {
        expect(words(c.story), `${l} chapter story`).toBeLessThanOrEqual(25)
        expect(words(c.task), `${l} chapter task`).toBeLessThanOrEqual(15)
      }
      for (const [k, h] of Object.entries(t.hint as Record<string, string>)) expect(words(h), `${l} hint ${k}`).toBeLessThanOrEqual(10)
      for (const n of t.levels as string[]) expect(words(n), `${l} level ${n}`).toBeLessThanOrEqual(3)
    }
  })

  it('name a hint for every new thing of the levels', async () => {
    const { LEVELS } = await import('../src/utils/kornspeicherLevels')
    for (const l of ['de', 'en', 'es'] as const) {
      const hints = (BIG_GAME_TEXTS[l].kornspeicher as { hint: Record<string, string> }).hint
      for (const lv of LEVELS) if (lv.intro) expect(hints[lv.intro], `${l} ${lv.intro}`.trim()).toBeTruthy()
    }
  })
})
