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
import { ALL_TILES, CORE_TILES, type HomeCard, type HomeTileId } from '@/utils/homeTiles'

vi.mock('@/components/atoms/ZIconography.vue', () => ({ default: { template: '<i />' } }))

// a small router: the address (`query`) is reactive, `push` puts a sign into it, `back` takes it away again (like the back button of the phone)
const nav = vi.hoisted(() => ({ route: null as unknown as { query: Record<string, string> }, push: vi.fn(), back: vi.fn(), replace: vi.fn() }))
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  nav.route = reactive({ query: {} as Record<string, string> })
  nav.push.mockImplementation(async (to: { query: Record<string, string> }) => {
    nav.route.query = { ...to.query }
  })
  nav.back.mockImplementation(() => {
    nav.route.query = {}
  })
  nav.replace.mockImplementation(async (to: { query: Record<string, string> }) => {
    nav.route.query = { ...to.query }
  })
  return { useRoute: () => nav.route, useRouter: () => ({ push: nav.push, back: nav.back, replace: nav.replace }) }
})

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
  nav.route.query = {}
  nav.push.mockClear()
  nav.back.mockClear()
  nav.replace.mockClear()
  useHomeLayout().reload()
  go.mockClear()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('the tiles of the start page', () => {
  it('show the five main tiles, all small (the family games too), and a tap opens a tile', async () => {
    const w = mountGrid()
    expect(tileIds(w)).toEqual(['adventure', 'book', 'picture', 'games', 'family'])
    expect(w.get('[data-tile-id="family"]').classes()).toContain('hg-tile--small')
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
    // the family games: small -> wide and back
    await w.get('[data-tile-id="family"] [data-test="tile-size"]').trigger('click')
    expect(w.get('[data-tile-id="family"]').classes()).toContain('hg-tile--wide')
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
    // every extra tile and every adventure game on its own can be added
    expect(sheet.findAll('.hg-item')).toHaveLength(ALL_TILES.length - CORE_TILES.length)
    expect(sheet.find('[data-test="add-game-arche"]').exists()).toBe(true)
    await sheet.get('[data-test="add-quiz"]').trigger('click')
    expect(w.find('[data-test="tile-sheet"]').exists()).toBe(false)
    expect(tileIds(w)).toEqual(['adventure', 'book', 'picture', 'games', 'family', 'quiz'])
    await w.get('[data-test="tile-add"]').trigger('click')
    expect(w.findAll('.hg-item')).toHaveLength(ALL_TILES.length - CORE_TILES.length - 1)
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

describe('the hint beside the lone tile (Anton 22.11.2026)', () => {
  const holdHint = (w: ReturnType<typeof mountGrid>) => press(w.get('[data-test="tile-hint"]').element)

  it('stands in the empty place beside the small family tile, as words only (no button, nothing that moves)', async () => {
    const w = mountGrid()
    const hint = w.get('[data-test="tile-hint"]')
    expect(hint.text()).toContain('Lange drücken')
    expect(hint.element.tagName).toBe('DIV')
    expect(hint.find('button').exists()).toBe(false)
    w.unmount()
  })

  it('is not there when the tiles fill the rows (an even number of small places, or a wide tile)', async () => {
    useHomeLayout().remove('family')
    const w = mountGrid()
    expect(w.find('[data-test="tile-hint"]').exists()).toBe(false)
    w.unmount()
  })

  it('a tap on it does nothing', async () => {
    const w = mountGrid()
    await w.get('[data-test="tile-hint"]').trigger('click')
    holdHint(w)
    vi.advanceTimersByTime(200)
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    w.get('[data-test="tile-hint"]').element.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    vi.advanceTimersByTime(600)
    await flushPromises()
    expect(w.classes()).not.toContain('is-editing')
    expect(w.find('[data-test="tile-sheet"]').exists()).toBe(false)
    expect(nav.push).not.toHaveBeenCalled()
    w.unmount()
  })

  it('a long press on it starts arranging and opens the list of things to choose; the hint is gone then', async () => {
    const w = mountGrid()
    holdHint(w)
    vi.advanceTimersByTime(500)
    await flushPromises()
    expect(w.classes()).toContain('is-editing')
    expect(w.find('[data-test="tile-sheet"]').exists()).toBe(true)
    expect(w.find('[data-test="tile-hint"]').exists()).toBe(false)
    w.unmount()
  })
})

describe('the back button while arranging (Anton 22.11.2026)', () => {
  it('arranging is a step in the address, and "back" ends it (the list too) instead of leaving the start page', async () => {
    const w = mountGrid()
    press(w.get('[data-test="tile-hint"]').element)
    vi.advanceTimersByTime(500)
    await flushPromises()
    expect(nav.push).toHaveBeenCalledWith({ query: { arrange: '1' } })
    expect(w.find('[data-test="tile-sheet"]').exists()).toBe(true)
    // the back button of the phone takes the step from the address
    nav.route.query = {}
    await flushPromises()
    expect(w.classes()).not.toContain('is-editing')
    expect(w.find('[data-test="tile-sheet"]').exists()).toBe(false)
    w.unmount()
  })

  it('a long press on a tile is a step too, and "Done" takes it back with one step of the history', async () => {
    const w = mountGrid()
    press(w.get('[data-tile-id="picture"]').element)
    vi.advanceTimersByTime(500)
    release()
    await flushPromises()
    expect(nav.push).toHaveBeenCalledTimes(1)
    expect(w.classes()).toContain('is-editing')
    await w.get('[data-test="tiles-done"]').trigger('click')
    expect(nav.back).toHaveBeenCalledTimes(1)
    expect(w.classes()).not.toContain('is-editing')
    w.unmount()
  })

  it('does not start in arranging when the page is opened with the sign in the address', async () => {
    nav.route.query = { arrange: '1' }
    const w = mountGrid()
    await flushPromises()
    expect(w.classes()).not.toContain('is-editing')
    expect(nav.replace).toHaveBeenCalledWith({ query: {} })
    w.unmount()
  })
})
