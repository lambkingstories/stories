/**
 * "Moses Körbchen" on the screen: the overview with the story, four chapters and forty ropes, the explanation only once, the story of a chapter, the game
 * with its buttons (pause, restart, tip), the texts in all three languages.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import { BIG_GAME_TEXTS, withGameTexts } from '../src/i18n/bigGames'
import { BIG_GAMES } from '../src/data/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameMose from '@/components/molecules/games/BigGameMose.vue'
import useBigGames from '@/use/useBigGames'

const app = withGameTexts(rawApp)
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })

/** jsdom does not load pictures: every one "fails" at once, so the game goes on with the plain stand-ins. */
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

describe('BigGameMose', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  async function open() {
    const w = mount(BigGameMose, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('is a game of the corner (picked with a wish)', () => {
    const g = BIG_GAMES.find((x) => x.id === 'mose')!
    expect(g.maxStars).toBe(120)
    expect(g.image).toBe('images/spiele-gross/mose/kachel.webp')
  })

  it('opens with the story, four chapters and forty levels', async () => {
    const w = await open()
    expect(w.text()).toContain('Moses Körbchen')
    expect(w.text()).toContain('2. Mose 2,1–10')
    expect(w.text()).toContain('Deine Aufgabe')
    expect(w.findAll('.mk-chapter')).toHaveLength(4)
    expect(w.findAll('.mk-level')).toHaveLength(40)
    w.unmount()
  })

  it('shows the explanation once, then the story of the chapter, then plays', async () => {
    const w = await open()
    await w.find('[data-test="mose-level-0"]').trigger('click')
    expect(w.find('.mk-how').exists()).toBe(true)
    await w.find('[data-test="mose-go"]').trigger('click')
    expect(w.find('.mk-how').exists()).toBe(false)
    expect(w.text()).toContain('Am Ufer')
    await w.find('[data-test="mose-chapter-go"]').trigger('click')
    expect(w.find('[data-test="mose-pause"]').exists()).toBe(true)
    expect(w.find('[data-test="mose-tip"]').exists()).toBe(true)
    // back to the overview and into the level again: neither card comes a second time
    await w.find('[data-test="mose-pause"]').trigger('click')
    await w.find('[data-test="mose-menu"]').trigger('click')
    await w.find('[data-test="mose-level-1"]').trigger('click')
    expect(w.find('.mk-how').exists()).toBe(false)
    expect(w.text()).not.toContain('versteckt ihr Kind drei Monate')
    w.unmount()
  })

  it('brings the explanation back with the question mark of the overview', async () => {
    const w = await open()
    await w.find('[data-test="mose-how"]').trigger('click')
    expect(w.find('.mk-how').exists()).toBe(true)
    await w.find('[data-test="mose-go"]').trigger('click')
    expect(w.find('.mk-how').exists()).toBe(false)
    w.unmount()
  })

  it('the pause has a way out of the game (leave the game)', async () => {
    const w = await open()
    await w.find('[data-test="mose-level-3"]').trigger('click')
    await w.find('[data-test="mose-go"]').trigger('click')
    await w.find('[data-test="mose-pause"]').trigger('click')
    const out = w.find('[data-test="mose-pause-leave"]')
    expect(out.exists()).toBe(true)
    expect(out.text()).toBe('Spiel verlassen')
    await out.trigger('click')
    expect(w.emitted('leave')).toBeTruthy()
    w.unmount()
  })

  it('pauses, resumes, restarts and gives a tip', async () => {
    const w = await open()
    await w.find('[data-test="mose-level-3"]').trigger('click')
    await w.find('[data-test="mose-go"]').trigger('click')
    await w.find('[data-test="mose-pause"]').trigger('click')
    expect(w.find('[data-test="mose-resume"]').exists()).toBe(true)
    await w.find('[data-test="mose-resume"]').trigger('click')
    expect(w.find('[data-test="mose-resume"]').exists()).toBe(false)
    await w.find('[data-test="mose-tip"]').trigger('click')
    expect(w.find('.mk-tip').exists()).toBe(true)
    await w.find('[data-test="mose-restart"]').trigger('click')
    expect(w.find('[data-test="mose-pause"]').exists()).toBe(true)
    w.unmount()
  })
})

describe('the texts of the game', () => {
  const keys = (o: unknown, p = ''): string[] =>
    o && typeof o === 'object'
      ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => (Array.isArray(v) ? v.flatMap((x, i) => keys(x, `${p}${k}.${i}.`).concat(typeof x === 'string' ? [`${p}${k}.${i}`] : [])) : typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
      : []
  it('are complete in german, english and spanish', () => {
    const de = keys(BIG_GAME_TEXTS.de.mose).sort()
    expect(de.length).toBeGreaterThan(50)
    expect(keys(BIG_GAME_TEXTS.en.mose).sort()).toEqual(de)
    expect(keys(BIG_GAME_TEXTS.es.mose).sort()).toEqual(de)
  })

  it('have four chapters with a story and a task, a story that says what the game is about and a hint for every thing', () => {
    for (const l of ['de', 'en', 'es'] as const) {
      const t = BIG_GAME_TEXTS[l].mose as { chapters: { name: string; story: string; task: string }[]; story: string; task: string; hint: Record<string, string> }
      expect(t.chapters).toHaveLength(4)
      for (const c of t.chapters) {
        expect(c.story.length).toBeGreaterThan(20)
        expect(c.task.length).toBeGreaterThan(10)
      }
      expect(t.story.length).toBeGreaterThan(60)
      expect(t.task.length).toBeGreaterThan(20)
      for (const k of ['cut', 'swing', 'order', 'slope', 'wall', 'bubble', 'seesaw', 'feder', 'flap', 'wheel', 'duck', 'fish', 'fan', 'flume', 'many']) expect(t.hint[k]?.length).toBeGreaterThan(10)
    }
  })
})
