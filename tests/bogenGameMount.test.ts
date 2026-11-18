/**
 * "Jonatans Pfeile" on the screen: the overview with the story and 44 levels, the explanation only once, the story of a chapter, the game with its
 * buttons, a shot with the finger (pull and let go), the pause, the result with stars and the saved progress, the texts in all three languages.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameBogen from '@/components/molecules/games/BigGameBogen.vue'
import useBigGames from '@/use/useBigGames'
import { LEVELS } from '../src/utils/bogenLevels'

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

/** A finger event on the canvas (jsdom's mouse events have no settable position: a real event is made with it). */
function finger(el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number, y: number, id: number) {
  const e = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })
  Object.defineProperty(e, 'pointerId', { value: id })
  el.dispatchEvent(e)
}

interface Probe {
  g: { shots: number; status: string; arrows: unknown[]; left: number }
  begin: (i: number) => void
  shoot: (a: number, f: number) => boolean
  advance: (s: number) => void
}
const probe = () => (window as unknown as { __bogen: Probe }).__bogen

describe('BigGameBogen', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = '#/app/spiel/bogen?probe=1'
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  async function open() {
    const w = mount(BigGameBogen, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('opens with the story, four chapters and forty-four levels', async () => {
    const w = await open()
    expect(w.text()).toContain('Jonatans Pfeile')
    expect(w.text()).toContain('Jonatan ist der beste Freund von David')
    expect(w.text()).toContain('Deine Aufgabe')
    expect(w.findAll('.bo-chapter')).toHaveLength(4)
    expect(w.findAll('.bo-level')).toHaveLength(44)
    expect(w.text()).toContain('Das Zeichen für David')
    w.unmount()
  })

  it('shows the explanation once, then the story of the chapter, then plays', async () => {
    const w = await open()
    await w.find('[data-test="bogen-level-0"]').trigger('click')
    expect(w.find('.bo-how').exists()).toBe(true)
    await w.find('[data-test="bogen-go"]').trigger('click')
    expect(w.find('.bo-how').exists()).toBe(false)
    expect(w.text()).toContain('Der Übungsplatz')
    await w.find('[data-test="bogen-chapter-go"]').trigger('click')
    expect(w.find('[data-test="bogen-pause"]').exists()).toBe(true)
    expect(w.find('[data-test="bogen-tip"]').exists()).toBe(true)
    expect(w.find('[data-test="bogen-arrows"]').exists()).toBe(true)
    // back to the overview and into the next level: neither card comes a second time
    await w.find('[data-test="bogen-pause"]').trigger('click')
    await w.find('[data-test="bogen-menu"]').trigger('click')
    await w.find('[data-test="bogen-level-1"]').trigger('click')
    expect(w.find('.bo-how').exists()).toBe(false)
    expect(w.text()).not.toContain('Jonatan und David wurden Freunde')
    w.unmount()
  })

  it('shoots when the finger is pulled back and let go, and not on a tap', async () => {
    const w = await open()
    await w.find('[data-test="bogen-level-0"]').trigger('click')
    await w.find('[data-test="bogen-go"]').trigger('click')
    await w.find('[data-test="bogen-chapter-go"]').trigger('click')
    expect(probe().g.shots).toBe(0)
    const c = w.find('canvas').element
    // a tap: no shot
    finger(c, 'pointerdown', 400, 300, 1)
    finger(c, 'pointerup', 400, 300, 1)
    expect(probe().g.shots).toBe(0)
    // pull down and to the left, let go: one arrow
    finger(c, 'pointerdown', 400, 300, 2)
    finger(c, 'pointermove', 340, 350, 2)
    finger(c, 'pointerup', 340, 350, 2)
    expect(probe().g.shots).toBe(1)
    expect(probe().g.arrows).toHaveLength(1)
    w.unmount()
  })

  it('the pause has a way out of the game (leave the game)', async () => {
    const w = await open()
    await w.find('[data-test="bogen-level-0"]').trigger('click')
    await w.find('[data-test="bogen-go"]').trigger('click')
    await w.find('[data-test="bogen-chapter-go"]').trigger('click')
    await w.find('[data-test="bogen-pause"]').trigger('click')
    const out = w.find('[data-test="bogen-pause-leave"]')
    expect(out.exists()).toBe(true)
    expect(out.text()).toBe('Spiel verlassen')
    await out.trigger('click')
    expect(w.emitted('leave')).toBeTruthy()
    w.unmount()
  })

  it('pause stops the game and restart gives all arrows back', async () => {
    const w = await open()
    await w.find('[data-test="bogen-level-0"]').trigger('click')
    await w.find('[data-test="bogen-go"]').trigger('click')
    await w.find('[data-test="bogen-chapter-go"]').trigger('click')
    probe().shoot(10, 0.6)
    await w.find('[data-test="bogen-pause"]').trigger('click')
    expect(w.find('[data-test="bogen-resume"]').exists()).toBe(true)
    await w.find('[data-test="bogen-resume"]').trigger('click')
    await w.find('[data-test="bogen-restart"]').trigger('click')
    expect(probe().g.shots).toBe(0)
    w.unmount()
  })

  it('a won round gives stars, is saved and shows the result', async () => {
    const w = await open()
    await w.find('[data-test="bogen-level-3"]').trigger('click')
    await w.find('[data-test="bogen-go"]').trigger('click')
    // (the story of the chapter comes only at the first level of a chapter)
    expect(w.find('[data-test="bogen-chapter-go"]').exists()).toBe(false)
    const sol = LEVELS[3]!.solution
    for (const s of sol) {
      probe().shoot(s.a, s.f)
      probe().advance(5)
    }
    expect(probe().g.status).toBe('won')
    await new Promise((r) => setTimeout(r, 2500))
    await flushPromises()
    expect(w.text()).toContain('Meisterhaft')
    expect(w.find('[data-test="bogen-next"]').exists()).toBe(true)
    expect(useBigGames().levels('bogen')[3]).toBe(3)
    w.unmount()
  })

  it('a lost round says so kindly and offers another try', async () => {
    const w = await open()
    await w.find('[data-test="bogen-level-0"]').trigger('click')
    await w.find('[data-test="bogen-go"]').trigger('click')
    await w.find('[data-test="bogen-chapter-go"]').trigger('click')
    for (let i = 0; i < 6; i++) probe().shoot(85, 0.2)
    probe().advance(8)
    await new Promise((r) => setTimeout(r, 1200))
    await flushPromises()
    expect(w.text()).toContain('Die Pfeile sind alle')
    expect(w.find('[data-test="bogen-again"]').exists()).toBe(true)
    expect(w.find('[data-test="bogen-next"]').exists()).toBe(false)
    w.unmount()
  })

  it('has its texts in english and spanish too', () => {
    const en = (app as { en: { app: { bigGames: { bogen: { title: string } } } } }).en.app.bigGames.bogen
    expect(en.title).toBe("Jonathan's Arrows")
  })
})
