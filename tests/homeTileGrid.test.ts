/**
 * Arranging the tiles of the start page like on the iPhone (Anton, 18.11.2026): a long press starts it, a tile is dragged to another place, made
 * small or wide, taken away or added; "Done" ends it. A tap outside of arranging opens the tile.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomeTileGrid from '@/components/molecules/HomeTileGrid.vue'
import messages from '@/i18n/app'
import { withGameTexts } from '@/i18n/bigGames'
import useHomeLayout from '@/use/useHomeLayout'
import { ALL_TILES, type HomeCard, type HomeTileId } from '@/utils/homeTiles'

vi.mock('@/components/atoms/ZIconography.vue', () => ({ default: { template: '<i />' } }))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: withGameTexts(messages) as never, missingWarn: false, fallbackWarn: false })
const go = vi.fn()
const cards = (): Partial<Record<HomeTileId, HomeCard>> =>
  Object.fromEntries(
    ALL_TILES.map((id) => [id, { id, kind: 'Art', title: `Titel ${id}`, meta: 'Zeile', image: `images/${id}.webp`, progress: -1, empty: false, icon: 'star', go: () => go(id) } as HomeCard])
  )
const mountGrid = () => mount(HomeTileGrid, { props: { cards: cards() }, global: { plugins: [i18n] }, attachTo: document.body })
const tileIds = (w: ReturnType<typeof mountGrid>) => w.findAll('.hg-tile').map((t) => t.attributes('data-tile-id'))
const press = (el: Element, x = 10, y = 10) => el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, button: 0 }))
const moveTo = (x: number, y: number) => document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y }))
const release = () => document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))

beforeEach(() => {
  localStorage.clear()
  useHomeLayout().reload()
  go.mockClear()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('the tiles of the start page', () => {
  it('show the five main tiles, the family games wide, and a tap opens a tile', async () => {
    const w = mountGrid()
    expect(tileIds(w)).toEqual(['adventure', 'book', 'picture', 'games', 'family'])
    expect(w.get('[data-tile-id="family"]').classes()).toContain('hg-tile--wide')
    expect(w.get('[data-tile-id="book"]').classes()).toContain('hg-tile--small')
    expect(w.find('.hg-remove').exists()).toBe(false)
    await w.get('[data-tile-id="book"] .resume-card').trigger('click')
    expect(go).toHaveBeenCalledWith('book')
    w.unmount()
  })

  it('a long press starts arranging: the tiles show the minus and the arrow, "Done" ends it, a tap opens nothing while arranging', async () => {
    const w = mountGrid()
    const tile = w.get('[data-tile-id="picture"]')
    press(tile.element)
    vi.advanceTimersByTime(200)
    await flushPromises()
    expect(w.find('.hg-remove').exists()).toBe(false)
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(w.classes()).toContain('is-editing')
    expect(w.findAll('.hg-remove')).toHaveLength(5)
    expect(w.findAll('.hg-size')).toHaveLength(5)
    expect(w.find('[data-test="tile-add"]').exists()).toBe(true)
    release()
    vi.advanceTimersByTime(200)
    // the click that follows the long press (and any tap while arranging) does not open the tile
    await w.get('[data-tile-id="picture"] .resume-card').trigger('click')
    expect(go).not.toHaveBeenCalled()
    await w.get('[data-test="tiles-done"]').trigger('click')
    expect(w.classes()).not.toContain('is-editing')
    expect(w.find('.hg-remove').exists()).toBe(false)
    w.unmount()
  })

  it('a finger that moves before the press is long enough is a scroll: arranging does not start', async () => {
    const w = mountGrid()
    press(w.get('[data-tile-id="book"]').element, 10, 10)
    vi.advanceTimersByTime(100)
    moveTo(10, 60)
    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(w.classes()).not.toContain('is-editing')
    release()
    w.unmount()
  })

  it('the arrow makes a tile wide or small again, the minus takes it away, and both are kept', async () => {
    const w = mountGrid()
    press(w.get('[data-tile-id="family"]').element)
    vi.advanceTimersByTime(500)
    release()
    await flushPromises()
    // the family games: wide -> small (what Anton asked for)
    await w.get('[data-tile-id="family"] [data-test="tile-size"]').trigger('click')
    expect(w.get('[data-tile-id="family"]').classes()).toContain('hg-tile--small')
    await w.get('[data-tile-id="book"] [data-test="tile-size"]').trigger('click')
    expect(w.get('[data-tile-id="book"]').classes()).toContain('hg-tile--wide')
    await w.get('[data-tile-id="games"] [data-test="tile-remove"]').trigger('click')
    expect(tileIds(w)).toEqual(['adventure', 'book', 'picture', 'family'])
    expect(useHomeLayout().layout.value.find((t) => t.id === 'family')?.size).toBe('small')
    w.unmount()
  })

  it('"Add a tile" lists what is not on the page; a tap adds it at the end; "reset" brings the main tiles back', async () => {
    const w = mountGrid()
    press(w.get('[data-tile-id="book"]').element)
    vi.advanceTimersByTime(500)
    release()
    await flushPromises()
    await w.get('[data-test="tile-add"]').trigger('click')
    const sheet = w.get('[data-test="tile-sheet"]')
    expect(sheet.findAll('.hg-item')).toHaveLength(13)
    await sheet.get('[data-test="add-quiz"]').trigger('click')
    expect(w.find('[data-test="tile-sheet"]').exists()).toBe(false)
    expect(tileIds(w)).toEqual(['adventure', 'book', 'picture', 'games', 'family', 'quiz'])
    await w.get('[data-test="tile-add"]').trigger('click')
    expect(w.findAll('.hg-item')).toHaveLength(12)
    await w.get('[data-test="tiles-reset"]').trigger('click')
    expect(tileIds(w)).toEqual(['adventure', 'book', 'picture', 'games', 'family'])
    w.unmount()
  })

  it('a tile is dragged to another place: it takes the place of the tile under the finger', async () => {
    const w = mountGrid()
    const family = w.get('[data-tile-id="family"]').element
    const adventure = w.get('[data-tile-id="adventure"]').element
    // jsdom has no layout: the tile under the finger is the first tile
    ;(document as unknown as { elementsFromPoint: () => Element[] }).elementsFromPoint = () => [adventure]
    press(family, 100, 400)
    vi.advanceTimersByTime(500)
    await flushPromises()
    moveTo(100, 380)
    moveTo(60, 120)
    await flushPromises()
    expect(tileIds(w)).toEqual(['family', 'adventure', 'book', 'picture', 'games'])
    // a ghost of the tile follows the finger and is gone when it is let go
    expect(document.querySelector('.hg-ghost')).not.toBeNull()
    release()
    await flushPromises()
    expect(document.querySelector('.hg-ghost')).toBeNull()
    expect(useHomeLayout().layout.value.map((t) => t.id)).toEqual(['family', 'adventure', 'book', 'picture', 'games'])
    w.unmount()
  })

  it('Escape ends arranging', async () => {
    const w = mountGrid()
    press(w.get('[data-tile-id="book"]').element)
    vi.advanceTimersByTime(500)
    release()
    await flushPromises()
    expect(w.classes()).toContain('is-editing')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(w.classes()).not.toContain('is-editing')
    w.unmount()
  })
})
