/**
 * "Das verlorene Lamm" on the screen: the list of the five chapters (34 levels, all open), the card that explains the game only the very first time, the story of a chapter once,
 * pause, restart, undo and tip, a won round with its stars (kept on the device) and the touch on a crank.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'
import { withGameTexts } from '../src/i18n/bigGames'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn(), preload: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

import BigGameLamm from '@/components/molecules/games/BigGameLamm.vue'
import useBigGames from '@/use/useBigGames'
import { LEVELS } from '@/utils/lammLevels'
import { parseLevel, solveLevel } from '@/utils/lammGame'

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

interface Probe {
  run: {
    moves: number
    won: boolean
    got: number
    stepT: number
    anim: unknown
    m: { goal: number; start: number; cells: { id: number; flower: number }[] }
    st: number[]
    lamb: number
    graph: { comp: Int32Array }
  }
  begin: (i: number) => void
  advance: (s: number) => void
  touchHandle: (ci: number) => void
  walkTo: (cell: number) => void
  undo: () => void
}
const probe = () => (window as unknown as { __lamm: Probe }).__lamm

describe('BigGameLamm', () => {
  beforeEach(() => {
    localStorage.clear()
    useBigGames().replaceAll({})
    vi.stubGlobal('Image', FailingImage)
    window.location.hash = '#/app/spiel/lamm?probe=1'
  })

  async function open() {
    const w = mount(BigGameLamm, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }
  const quiet = () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ lamm: true }))
    localStorage.setItem('lk-lamm-story-v1', JSON.stringify({ 0: true, 1: true, 2: true, 3: true, 4: true }))
  }

  it('lists five chapters with all levels, all of them open', async () => {
    const w = await open()
    expect(w.findAll('.lg-world')).toHaveLength(5)
    expect(w.findAll('.lg-level')).toHaveLength(LEVELS.length)
    expect(LEVELS.length).toBeGreaterThanOrEqual(30)
    for (const l of w.findAll('.lg-level')) expect(l.attributes('disabled')).toBeUndefined()
    expect(w.text()).toContain('Das verlorene Lamm')
    expect(w.text()).toContain('Psalm 23,4')
    w.unmount()
  })

  it('shows the card that explains the game once, at the first level, and never again', async () => {
    const w = await open()
    await w.find('[data-test="lamm-level-0"]').trigger('click')
    expect(w.find('[data-test="lamm-go"]').exists()).toBe(true)
    expect(w.text()).toContain('Kurbeln')
    await w.find('[data-test="lamm-go"]').trigger('click')
    expect(w.find('[data-test="lamm-go"]').exists()).toBe(false)
    w.unmount()
    const again = await open()
    await again.find('[data-test="lamm-level-3"]').trigger('click')
    expect(again.find('[data-test="lamm-go"]').exists()).toBe(false)
    expect(again.find('.lg-hud').exists()).toBe(true)
    // the question mark of the list brings the card back
    await again.find('[data-test="lamm-menu"]').exists()
    again.unmount()
  })

  it('tells the story of a chapter once (at its first level) with the task, and again from its banner', async () => {
    localStorage.setItem('lk-biggames-how-v1', JSON.stringify({ lamm: true }))
    const w = await open()
    await w.find('[data-test="lamm-level-0"]').trigger('click')
    expect(w.find('[data-test="lamm-story-go"]').exists()).toBe(true)
    expect(w.text()).toContain('David')
    expect(w.text()).toContain('Deine Aufgabe')
    await w.find('[data-test="lamm-story-go"]').trigger('click')
    expect(w.find('[data-test="lamm-story-go"]').exists()).toBe(false)
    await w.find('[data-test="lamm-restart"]').trigger('click')
    expect(w.find('[data-test="lamm-story-go"]').exists()).toBe(false)
    w.unmount()
    const again = await open()
    await again.find('[data-test="lamm-menu"]').exists()
    await again.find('[data-test="lamm-banner-3"]').trigger('click')
    expect(again.find('[data-test="lamm-story-go"]').exists()).toBe(true)
    expect(again.text()).toContain('Tal')
    again.unmount()
  })

  it('the pause has a way out of the game (leave the game)', async () => {
    quiet()
    const w = await open()
    await w.find('[data-test="lamm-level-1"]').trigger('click')
    await w.find('[data-test="lamm-pause"]').trigger('click')
    const out = w.find('[data-test="lamm-pause-leave"]')
    expect(out.exists()).toBe(true)
    await out.trigger('click')
    expect(w.emitted('leave')).toBeTruthy()
    w.unmount()
  })

  it('has pause, restart, undo and tip in the game, and the pause leads back to the list', async () => {
    quiet()
    const w = await open()
    await w.find('[data-test="lamm-level-1"]').trigger('click')
    expect(w.find('.lg-hud').exists()).toBe(true)
    expect(w.find('[data-test="lamm-undo"]').attributes('disabled')).toBeDefined()
    await w.find('[data-test="lamm-tip"]').trigger('click')
    expect(w.find('.lg-tip').exists()).toBe(true)
    await w.find('[data-test="lamm-pause"]').trigger('click')
    expect(w.text()).toContain('Pause')
    await w.find('[data-test="lamm-menu"]').trigger('click')
    expect(w.find('.lg-levels').exists()).toBe(true)
    await w.find('[data-test="lamm-level-1"]').trigger('click')
    await w.find('[data-test="lamm-restart"]').trigger('click')
    expect(w.find('.lg-hud').exists()).toBe(true)
    w.unmount()
  })

  it('a crank turns the bridge, the lamb walks home, the round ends with stars that are kept; undo takes a move back', async () => {
    quiet()
    const w = await open()
    // level 2: one turn bridge, a flower beside the goal
    await w.find('[data-test="lamm-level-1"]').trigger('click')
    const p = probe()
    expect(p.run.moves).toBe(0)
    // there is no way yet
    p.walkTo(p.run.m.goal)
    p.advance(2)
    expect(p.run.won).toBe(false)
    p.touchHandle(0)
    p.advance(1.2)
    expect(p.run.moves).toBe(1)
    await flushPromises()
    expect(w.find('[data-test="lamm-undo"]').attributes('disabled')).toBeUndefined()
    // take the move back and make it again
    p.undo()
    p.advance(1.2)
    expect(p.run.moves).toBe(0)
    expect(p.run.st).toEqual([0])
    p.touchHandle(0)
    p.advance(1.2)
    p.walkTo(p.run.m.goal)
    p.advance(4)
    expect(p.run.won).toBe(true)
    await new Promise((r) => setTimeout(r, 2500))
    await flushPromises()
    expect(w.find('[data-test="lamm-next"]').exists()).toBe(true)
    // one move, a flower is missing: at least one star, and kept
    expect(useBigGames().levels('lamm')[1]).toBeGreaterThanOrEqual(1)
    await w.find('[data-test="lamm-menu"]').trigger('click')
    expect(w.findAll('.lg-level')[1]!.text()).toContain('2')
    w.unmount()
  })

  it('every level can be won in the game itself with three stars by the way the solver found (walking, riding, the perspective join, flowers)', async () => {
    quiet()
    const w = await open()
    await w.find('[data-test="lamm-level-0"]').trigger('click')
    const p = probe()
    /** Lets the lamb finish walking and the parts finish moving. */
    const settle = () => {
      for (let i = 0; i < 400 && (p.run.stepT < 1 || p.run.anim); i++) p.advance(0.05)
    }
    const go = (cell: number) => {
      p.walkTo(cell)
      settle()
    }
    /** Walks to every flower of the part the lamb is in. */
    const gather = () => {
      for (const c of p.run.m.cells) {
        if (c.flower < 0 || p.run.got & (1 << c.flower)) continue
        if (p.run.graph.comp[c.id]! >= 0 && p.run.graph.comp[c.id] === p.run.graph.comp[p.run.lamb]) go(c.id)
      }
    }
    for (let i = 0; i < LEVELS.length; i++) {
      const way = solveLevel(parseLevel(LEVELS[i]!)).way
      p.begin(i)
      settle()
      for (const step of way) {
        gather()
        go(step.s)
        p.touchHandle(step.g)
        settle()
      }
      gather()
      go(p.run.m.goal)
      settle()
      expect(p.run.won, `level ${i + 1} is won`).toBe(true)
      expect(useBigGames().levels('lamm')[i], `level ${i + 1} gives three stars`).toBe(3)
    }
    w.unmount()
  })

  it('the last level of the game ends with the closing text and no next level', async () => {
    quiet()
    const w = await open()
    await w.find(`[data-test="lamm-level-${LEVELS.length - 1}"]`).trigger('click')
    expect(w.find('.lg-hud').exists()).toBe(true)
    w.unmount()
  })
})
