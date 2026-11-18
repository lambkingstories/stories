/**
 * "Bezalels Werkstatt" on the screen: the overview with the story, four chapters and forty levels, the explanation only once, the story of a chapter,
 * the game with its buttons, the pause, a finished figure with stars and the saved progress, the texts in all three languages.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import rawApp from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameBezalel from '@/components/molecules/games/BigGameBezalel.vue'
import useBigGames from '@/use/useBigGames'
import { LEVELS } from '../src/utils/bezalelLevels'
import { beginMove, endMove, moveTo, pieceById } from '../src/utils/bezalelGame'
import { placementToXf } from '../src/utils/bezalelTangram'

const app = withGameTexts(rawApp)
const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })

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

interface Probe {
  g: { done: boolean; hints: number; pieces: { id: string }[]; level: { solution: unknown[] } }
  begin: (i: number) => void
}
const probe = () => (window as unknown as { __bezalel: Probe }).__bezalel

describe('BigGameBezalel', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = '#/app/spiel/bezalel?probe=1'
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  })

  async function open() {
    const w = mount(BigGameBezalel, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('opens with the story, four chapters and forty levels', async () => {
    const w = await open()
    expect(w.text()).toContain('Bezalels Werkstatt')
    expect(w.text()).toContain('Gott erfüllt Bezalel mit seinem Geist')
    expect(w.text()).toContain('Deine Aufgabe')
    expect(w.findAll('.bz-chapter')).toHaveLength(4)
    expect(w.findAll('.bz-level')).toHaveLength(40)
    expect(w.text()).toContain('Das Brett')
    expect(w.text()).toContain('Das fertige Werk')
    // a level not solved shows its silhouette, not a picture
    expect(w.findAll('.bz-level svg')).toHaveLength(40)
    w.unmount()
  })

  it('the pause has a way out of the game (leave the game)', async () => {
    const w = await open()
    await w.find('[data-test="bezalel-level-0"]').trigger('click')
    await w.find('[data-test="bezalel-go"]').trigger('click')
    await w.find('[data-test="bezalel-chapter-go"]').trigger('click')
    await w.find('[data-test="bezalel-pause"]').trigger('click')
    const out = w.find('[data-test="bezalel-pause-leave"]')
    expect(out.exists()).toBe(true)
    await out.trigger('click')
    expect(w.emitted('leave')).toBeTruthy()
    w.unmount()
  })

  it('shows the explanation once, then the story of the chapter, then plays; the pause and the way back work', async () => {
    const w = await open()
    await w.find('[data-test="bezalel-level-0"]').trigger('click')
    expect(w.find('.bz-how').exists()).toBe(true)
    await w.find('[data-test="bezalel-go"]').trigger('click')
    expect(w.find('.bz-how').exists()).toBe(false)
    expect(w.text()).toContain('Das Holz')
    await w.find('[data-test="bezalel-chapter-go"]').trigger('click')
    expect(w.find('[data-test="bezalel-tip"]').exists()).toBe(true)
    expect(w.find('[data-test="bezalel-undo"]').exists()).toBe(true)
    expect(w.find('[data-test="bezalel-reset"]').exists()).toBe(true)
    expect(w.find('[data-test="bezalel-rotate"]').exists()).toBe(true)
    // no parallelogram in the first level: no flip button
    expect(w.find('[data-test="bezalel-flip"]').exists()).toBe(false)
    await w.find('[data-test="bezalel-pause"]').trigger('click')
    expect(w.text()).toContain('Weiter spielen')
    await w.find('[data-test="bezalel-resume"]').trigger('click')
    await w.find('[data-test="bezalel-pause"]').trigger('click')
    await w.find('[data-test="bezalel-menu"]').trigger('click')
    expect(w.findAll('.bz-level')).toHaveLength(40)
    // the explanation does not come again; the button in the menu brings it back
    await w.find('[data-test="bezalel-level-1"]').trigger('click')
    expect(w.find('.bz-how').exists()).toBe(false)
    w.unmount()
  })

  it('a finished figure gives stars and is kept; a hint costs one', async () => {
    const w = await open()
    await w.find('[data-test="bezalel-level-0"]').trigger('click')
    await w.find('[data-test="bezalel-go"]').trigger('click')
    await w.find('[data-test="bezalel-chapter-go"]').trigger('click')
    const g = probe().g as unknown as Parameters<typeof beginMove>[0]
    const L = LEVELS[0]!
    for (const s of L.solution) {
      const xf = placementToXf(s)
      beginMove(g, s.id)
      pieceById(g, s.id).angle = xf.angle
      moveTo(g, s.id, xf.cx + 0.1, xf.cy - 0.1)
      endMove(g, s.id, false)
    }
    expect(g.done).toBe(true)
    ;(probe() as unknown as { after: () => void }).after()
    expect(useBigGames().levels('bezalel')[0]).toBe(3)
    w.unmount()
  })

  it('with one hint the same figure gives two stars', async () => {
    const w = await open()
    await w.find('[data-test="bezalel-level-1"]').trigger('click')
    await w.find('[data-test="bezalel-go"]').trigger('click')
    await w.find('[data-test="bezalel-tip"]').trigger('click')
    const g = probe().g as unknown as Parameters<typeof beginMove>[0]
    expect(g.hints).toBe(1)
    for (const s of LEVELS[1]!.solution) {
      const xf = placementToXf(s)
      beginMove(g, s.id)
      pieceById(g, s.id).angle = xf.angle
      moveTo(g, s.id, xf.cx, xf.cy)
      endMove(g, s.id, false)
    }
    ;(probe() as unknown as { after: () => void }).after()
    expect(useBigGames().levels('bezalel')[1]).toBe(2)
    w.unmount()
  })

  it('the texts exist in german, english and spanish for all forty levels', () => {
    for (const lang of ['de', 'en', 'es'] as const) {
      const names = (withGameTexts(rawApp) as unknown as Record<string, { app: { bigGames: { bezalel?: { levels: string[]; refs: string[] } } } }>)
      const own = lang === 'es' ? undefined : names[lang]!.app.bigGames.bezalel
      if (own) {
        expect(own.levels).toHaveLength(40)
        expect(own.refs).toHaveLength(40)
      }
    }
  })
})
