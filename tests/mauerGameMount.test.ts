/**
 * Nehemias Mauer on the screen: the sections list opens, a section starts, a stone can be dragged onto the board (pointer events) and
 * lands there. A bad drop changes nothing. The sections are unlocked one after the other, free building after the third.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import app from '../src/i18n/app'

vi.mock('@/use/useSfx', () => ({ default: () => ({ play: vi.fn() }) }))
vi.mock('@/use/useMusic', () => ({ default: () => ({ playGame: vi.fn(), stop: vi.fn() }) }))

// jsdom has no PointerEvent: a mouse event with the pointer type reaches the same listeners
const pointer = (type: string, x: number, y: number) => new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true })

import BigGameMauer from '@/components/molecules/games/BigGameMauer.vue'
import useBigGames from '@/use/useBigGames'

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de: (app as { de?: object }).de ?? {}, en: (app as { en?: object }).en ?? {} } })

describe('BigGameMauer', () => {
  beforeEach(() => localStorage.clear())

  async function open() {
    const w = mount(BigGameMauer, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('lists five sections and free building, only the first open', async () => {
    const w = await open()
    const levels = w.findAll('.mg-level')
    expect(levels).toHaveLength(6)
    expect(levels[0]!.attributes('disabled')).toBeUndefined()
    expect(levels[1]!.attributes('disabled')).toBeDefined()
    expect(levels[5]!.attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('opens the next section and free building after the stars are won', async () => {
    const bg = useBigGames()
    bg.record('mauer', 0, 1)
    bg.record('mauer', 1, 2)
    bg.record('mauer', 2, 3)
    const w = await open()
    const levels = w.findAll('.mg-level')
    expect(levels[3]!.attributes('disabled')).toBeUndefined()
    expect(levels[4]!.attributes('disabled')).toBeDefined()
    expect(levels[5]!.attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('starts a section, shows the board and three stones, and takes the first stone dropped on the board', async () => {
    const w = await open()
    await w.find('.mg-level').trigger('click')
    expect(w.findAll('.mg-cell')).toHaveLength(64)
    expect(w.findAll('.mg-piece')).toHaveLength(3)
    expect(w.text()).toContain('0 von 4 Schichten')

    // jsdom has no layout: give the board a size so that the drop can be calculated
    const board = w.find('.mg-board').element as HTMLElement
    board.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 400, width: 400, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    const piece = w.findAll('.mg-piece')[0]!
    const filled = () => w.findAll('.mg-cell').filter((c) => !c.classes().includes('is-empty')).length
    expect(filled()).toBe(0)

    piece.element.dispatchEvent(pointer('pointerdown', 60, 300))
    window.dispatchEvent(pointer('pointermove', 200, 260))
    window.dispatchEvent(pointer('pointerup', 200, 260))
    await flushPromises()
    expect(filled()).toBeGreaterThan(0)
    expect(w.findAll('.mg-piece')).toHaveLength(2)
    w.unmount()
  })

  it('a drop away from the board changes nothing', async () => {
    const w = await open()
    await w.find('.mg-level').trigger('click')
    const board = w.find('.mg-board').element as HTMLElement
    board.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 400, width: 400, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    w.findAll('.mg-piece')[0]!.element.dispatchEvent(pointer('pointerdown', 60, 900))
    window.dispatchEvent(pointer('pointerup', 60, 900))
    await flushPromises()
    expect(w.findAll('.mg-piece')).toHaveLength(3)
    expect(w.findAll('.mg-cell').filter((c) => !c.classes().includes('is-empty'))).toHaveLength(0)
    w.unmount()
  })
})
