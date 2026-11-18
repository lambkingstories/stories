/**
 * The main menu of the painting program (Anton, 18.11.2026): the card "Keep painting" with the painting that was painted on last (or "Your first picture" with a button
 * into painting), under it a small row of the exhibition (no three huge empty frames any more), the finished pictures of the coloring books as a gallery of their own,
 * and a quiet view of one painting (a tap on a painting of the exhibition or the gallery does not open the painting screen). Everything stays on the device.
 */
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '@/i18n/app'
import type { ArtworkMeta } from '@/use/useArtworks'
import type { BookCard } from '@/types/coloringMenu'

vi.mock('@/components/molecules/AppHeader.vue', () => ({ default: { name: 'AppHeader', template: '<header />' } }))
vi.mock('@/components/atoms/LkCompanion.vue', () => ({ default: { name: 'LkCompanion', template: '<span />' } }))
// the quiet view asks the device for a time-lapse: here there is none (the test of the button builds its own)
const lapse = vi.hoisted(() => ({ blob: null as Blob | null, data: null as unknown }))
vi.mock('@/use/useArtworks', async (orig) => ({
  ...(await orig<typeof import('@/use/useArtworks')>()),
  getTimelapse: async () => lapse.blob
}))
vi.mock('@/utils/timelapse', async (orig) => ({
  ...(await orig<typeof import('@/utils/timelapse')>()),
  unpackTimelapse: async () => lapse.data
}))

const i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'de', messages: messages as never, missingWarn: false, fallbackWarn: false })

const work = (id: string, updatedAt: number, done = false, extra: Partial<ArtworkMeta> = {}): ArtworkMeta => ({
  id, title: id, kind: 'page', sourceUrl: '', sourceType: '', page: 1, width: 1200, height: 1600, thumb: 'data:image/png;base64,AAAA', updatedAt, done, ...extra
})
const WORKS = [work('a', 1, true), work('b', 3), work('c', 2, true), work('d', 4)]

beforeEach(() => {
  localStorage.clear()
  lapse.blob = null
  lapse.data = null
  vi.resetModules()
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function menu(works: ArtworkMeta[] = WORKS, books: BookCard[] = [], loose: ArtworkMeta[] = []) {
  const { default: View } = await import('@/components/molecules/ColoringMenu.vue')
  const wrapper = mount(View, {
    props: { books, works: loose, groups: [], exhibitionWorks: works, rewards: [], backupBusy: false, backupMessage: '' },
    global: { plugins: [i18n] },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

const places = () => JSON.parse(localStorage.getItem('lk-exhibition-v1') ?? '[]') as (string | null)[]
const bookCard = (id: string): BookCard => ({ bookId: id, title: 'Noah', cover: '', total: 30, done: 3, updatedAt: 1 })

describe('the card "Keep painting"', () => {
  it('shows the newest picture that is not finished, with a button that keeps painting on it', async () => {
    const w = await menu()
    const card = w.find('[data-test="continue-card"]')
    expect(card.exists()).toBe(true)
    // a and c are finished; of the others d (4) is newer than b (3)
    expect(card.find('.ac-cont-title').text()).toBe('d')
    expect(card.find('.ac-cont-kicker').text()).toContain('Mach da weiter')
    await w.find('[data-test="continue-go"]').trigger('click')
    expect(w.emitted('open-work')?.[0]?.[0]).toMatchObject({ id: 'd' })
  })

  it('says "Dein neuestes Bild" when everything is finished, and names the page of the book', async () => {
    const w = await menu([work('x', 5, true, { bookId: 'noah', bookPage: 3 })], [bookCard('noah')])
    expect(w.find('.ac-cont-kicker').text()).toContain('Dein neuestes Bild')
    expect(w.find('.ac-cont-sub').text()).toContain('Seite 3 von 30')
  })

  it('shows "Dein erstes Bild" with a button into painting while there is no picture, and no empty frames', async () => {
    const w = await menu([])
    expect(w.find('[data-test="continue-card"]').exists()).toBe(false)
    expect(w.find('[data-test="first-card"]').text()).toContain('Dein erstes Bild')
    await w.find('[data-test="first-go"]').trigger('click')
    expect(w.emitted('blank')?.[0]).toEqual(['portrait'])
    // the three big empty frames are gone: no exhibition at all before the first picture
    expect(w.find('[data-test="exhibition"]').exists()).toBe(false)
    expect(w.find('.ac-frame').exists()).toBe(false)
  })
})

describe('the exhibition of my pictures', () => {
  it('is one small row with a button to hang a picture, not three big frames', async () => {
    const w = await menu()
    expect(w.find('#ac-h-exhibition').text()).toContain('Meine Ausstellungsbilder')
    expect(w.findAll('.ac-frame:not(.is-empty)')).toHaveLength(0)
    expect(w.findAll('.ac-frame.is-empty')).toHaveLength(1)
    expect(w.find('#ac-h-exhibition .ac-count').text()).toContain('0/3')
  })

  it('hangs a chosen painting and remembers it', async () => {
    const w = await menu()
    await w.find('[data-test="exhibition-add"]').trigger('click')
    expect(w.find('.ac-ex-overlay').exists()).toBe(true)
    await w.findAll('[data-test="picker-tile"]')[1]!.trigger('click') // the list is newest first: d, b, c, a
    expect(w.find('.ac-ex-overlay').exists()).toBe(false)
    expect(places()).toEqual(['b', null, null])
    expect(w.findAll('[data-test="exhibition-frame"]')).toHaveLength(1)
    expect(w.find('#ac-h-exhibition .ac-count').text()).toContain('1/3')
  })

  it('hangs the newest finished paintings with one tap', async () => {
    const w = await menu()
    await w.find('[data-test="exhibition-fill"]').trigger('click')
    // finished ones first (c is newer than a), then the newest of the rest (d)
    expect(places()).toEqual(['c', 'a', 'd'])
    expect(w.find('[data-test="exhibition-fill"]').exists()).toBe(false)
    // all places are taken: no more "hang"
    expect(w.find('[data-test="exhibition-add"]').exists()).toBe(false)
  })

  it('leaves a place empty when its painting is gone', async () => {
    localStorage.setItem('lk-exhibition-v1', JSON.stringify(['zzz', 'b', null]))
    const w = await menu()
    expect(w.findAll('[data-test="exhibition-frame"]')).toHaveLength(1)
    expect(w.find('[data-test="exhibition-frame"]').attributes('aria-label')).toContain('Platz 2')
  })

  it('gives every frame the ratio of its picture (no white bars)', async () => {
    localStorage.setItem('lk-exhibition-v1', JSON.stringify(['wide', 'tall', null]))
    const w = await menu([work('wide', 2, false, { width: 1600, height: 1200 }), work('tall', 1, false, { width: 1200, height: 1600 })])
    const styles = w.findAll('[data-test="exhibition-frame"]').map((f) => f.attributes('style'))
    expect(styles[0]).toContain('aspect-ratio: 1.3333')
    expect(styles[1]).toContain('aspect-ratio: 0.75')
  })

  it('opens the quiet view on a tap, not the painting screen', async () => {
    localStorage.setItem('lk-exhibition-v1', JSON.stringify(['b', null, null]))
    const w = await menu()
    await w.find('[data-test="exhibition-frame"]').trigger('click')
    expect(w.emitted('open-work')).toBeUndefined()
    expect(w.find('[data-test="artwork-viewer"]').exists()).toBe(true)
    // "Weitermalen" there goes on painting
    await w.find('[data-test="viewer-continue"]').trigger('click')
    expect(w.emitted('open-work')?.[0]?.[0]).toMatchObject({ id: 'b' })
    expect(w.find('[data-test="artwork-viewer"]').exists()).toBe(false)
  })
})

describe('the quiet view', () => {
  async function opened() {
    localStorage.setItem('lk-exhibition-v1', JSON.stringify(['b', null, null]))
    const w = await menu()
    await w.find('[data-test="exhibition-frame"]').trigger('click')
    await flushPromises()
    return w
  }

  it('can save the picture and close', async () => {
    const w = await opened()
    await w.find('[data-test="viewer-save"]').trigger('click')
    expect(w.emitted('save-work')?.[0]?.[0]).toMatchObject({ id: 'b' })
    await w.find('[data-test="viewer-close"]').trigger('click')
    expect(w.find('[data-test="artwork-viewer"]').exists()).toBe(false)
  })

  it('takes a picture down from the exhibition and hangs it again', async () => {
    const w = await opened()
    expect(w.find('[data-test="viewer-hang"]').text()).toContain('Aus der Ausstellung nehmen')
    await w.find('[data-test="viewer-hang"]').trigger('click')
    expect(places()).toEqual([null, null, null])
    expect(w.find('[data-test="viewer-hang"]').text()).toContain('In die Ausstellung hängen')
    await w.find('[data-test="viewer-hang"]').trigger('click')
    expect(places()).toEqual(['b', null, null])
  })

  it('has no time-lapse button without a time-lapse, and one when the painting has a real one', async () => {
    const w1 = await opened()
    expect(w1.find('[data-test="viewer-lapse"]').exists()).toBe(false)
    w1.unmount()
    document.body.innerHTML = ''
    lapse.blob = new Blob(['x'])
    lapse.data = { w: 10, h: 10, base: null, steps: [1, 2, 3, 4] }
    const w2 = await opened()
    await flushPromises()
    expect(w2.find('[data-test="viewer-lapse"]').exists()).toBe(true)
    await w2.find('[data-test="viewer-lapse"]').trigger('click')
    expect(w2.emitted('play-lapse')?.[0]?.[0]).toMatchObject({ id: 'b' })
  })

  it('has no time-lapse for a picture from a PDF (its line art cannot be drawn again here)', async () => {
    lapse.blob = new Blob(['x'])
    lapse.data = { w: 10, h: 10, base: null, steps: [1, 2, 3, 4] }
    localStorage.setItem('lk-exhibition-v1', JSON.stringify(['pdf', null, null]))
    const w = await menu([work('pdf', 1, false, { sourceType: 'pdf' })])
    await w.find('[data-test="exhibition-frame"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-test="viewer-lapse"]').exists()).toBe(false)
  })
})

describe('my finished pictures', () => {
  it('collects the finished pictures of coloring books, and nothing else', async () => {
    const w = await menu([
      work('p1', 5, true, { bookId: 'noah', bookPage: 1 }),
      work('p2', 4, false, { bookId: 'noah', bookPage: 2 }),
      work('blank', 6, true)
    ])
    expect(w.find('#ac-h-finished').text()).toContain('Fertig aus den Malbüchern')
    expect(w.findAll('[data-test="finished-tile"]')).toHaveLength(1)
  })

  it('is not there without a finished book picture, shows six and then "alle anzeigen", and a tap opens the quiet view', async () => {
    expect((await menu([work('x', 1, true)])).find('[data-test="finished-gallery"]').exists()).toBe(false)
    document.body.innerHTML = ''
    const many = Array.from({ length: 8 }, (_, i) => work('f' + i, i + 1, true, { bookId: 'noah', bookPage: i + 1 }))
    const w = await menu(many)
    expect(w.findAll('[data-test="finished-tile"]')).toHaveLength(6)
    await w.find('[data-test="finished-more"]').trigger('click')
    expect(w.findAll('[data-test="finished-tile"]')).toHaveLength(8)
    await w.find('[data-test="finished-tile"]').trigger('click')
    expect(w.emitted('open-work')).toBeUndefined()
    expect(w.find('[data-test="artwork-viewer"]').exists()).toBe(true)
  })
})

describe('the shelf with one book', () => {
  it('has a friendly note beside the single book instead of looking empty', async () => {
    const w = await menu(WORKS, [bookCard('noah')])
    expect(w.find('[data-test="one-book-note"]').text()).toContain('Platz für mehr Bücher')
    await w.find('.ac-onebook-go').trigger('click')
    expect(w.emitted('to-books')).toHaveLength(1)
  })

  it('has no note with two books, which have the usual wide button under them', async () => {
    const w = await menu(WORKS, [bookCard('noah'), bookCard('david')])
    expect(w.find('[data-test="one-book-note"]').exists()).toBe(false)
    expect(w.find('.ac-allbooks').exists()).toBe(true)
  })
})
