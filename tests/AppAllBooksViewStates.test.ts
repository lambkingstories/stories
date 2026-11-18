/**
 * "Lesen → Geschichten" while the list of books is on its way: placeholders (not the text "Noch keine Serien", which would be wrong),
 * the real empty page only after a successful answer, and a friendly note with a button when the server did not answer.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const h = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return {
  series: reactive({ all: [] as unknown[] | null, byId: {} as Record<string, unknown>, loading: false, error: null as string | null }),
  state: { all: null as unknown[] | null, byId: {}, loading: {}, listLoading: false, listReady: false, listFailed: false, error: null as string | null },
  loadAllBooks: vi.fn(async () => [] as unknown[])
  }
})

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, name: 'app-all-books' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key, locale: { value: 'de' } }) }))
vi.mock('@/use/useApiBooks', () => ({
  default: () => ({
    state: h.state,
    loadAllBooks: h.loadAllBooks,
    booksOfSeries: () => [],
    loadBook: vi.fn(),
    nextBookInSeries: vi.fn(),
    getById: () => null
  })
}))
vi.mock('@/use/useApiSeries', () => ({
  default: () => ({ state: h.series, loadAll: vi.fn(async () => []), getById: (id: string) => (h.series.byId[id] as unknown) ?? null })
}))
vi.mock('@/use/useModels', () => ({ default: () => ({ getSeries: () => undefined, getSeriesOfBook: () => undefined }) }))
vi.mock('@/use/useCatalogNames', () => ({
  default: () => ({ seriesName: (_id: string, fallback = '') => fallback, seriesNameOfBook: () => '', categoryName: (n: string) => n, badgeLabel: (b: string) => b })
}))
vi.mock('@/use/useUser', () => ({ isMobileLandscape: { value: false }, isMobilePortrait: { value: true } }))
vi.mock('@/components/molecules/AppHeader.vue', () => ({ default: { name: 'AppHeader', template: '<header />' } }))

async function open() {
  const { default: View } = await import('@/views/app/AppAllBooksView.vue')
  const wrapper = mount(View)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  Object.assign(h.state, { all: null, listLoading: false, listReady: false, listFailed: false, error: null })
  Object.assign(h.series, { all: [], byId: {}, error: null })
  h.loadAllBooks.mockClear()
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
})

describe('AppAllBooksView · waiting for the list', () => {
  it('shows placeholders, and neither the empty text nor the error, before the first answer', async () => {
    const w = await open()
    expect(w.find('[data-test="book-skeleton"]').exists()).toBe(true)
    expect(w.text()).not.toContain('app.allBooks.emptyTitle')
    expect(w.find('[data-test="book-list-error"]').exists()).toBe(false)
  })

  it('after an answer without any books: the real empty page, no placeholders', async () => {
    Object.assign(h.state, { all: [], listReady: true })
    const w = await open()
    expect(w.find('[data-test="book-skeleton"]').exists()).toBe(false)
    expect(w.text()).toContain('app.allBooks.emptyTitle')
  })

  it('when the server did not answer and nothing is kept: a friendly note and a button that asks again', async () => {
    Object.assign(h.state, { all: [], listReady: true, listFailed: true, error: 'Failed to fetch' })
    const w = await open()
    expect(w.find('[data-test="book-skeleton"]').exists()).toBe(false)
    expect(w.text()).not.toContain('app.allBooks.emptyTitle')
    const error = w.find('[data-test="book-list-error"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('app.state.listFailTitle')
    h.loadAllBooks.mockClear()
    await w.find('[data-test="book-list-retry"]').trigger('click')
    expect(h.loadAllBooks).toHaveBeenCalledTimes(1)
  })

  it('the offline page keeps its own text (no placeholders without a net)', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    Object.assign(h.state, { all: [], listReady: true, listFailed: true })
    const w = await open()
    expect(w.find('[data-test="book-skeleton"]').exists()).toBe(false)
    expect(w.text()).toContain('app.offline.emptyTitle')
  })

  it('the shelves wait for the names and order of the series (no shelves with made-up names that then jump)', async () => {
    const book = { bookId: 'a-1', bookSeriesId: 'a', author: 'x', category: 'c', releaseDate: '2020-01-01', updatedDate: '2020-01-01', badges: [], isPublished: true, previewImage: 'p.webp', localizations: { de: { title: 'T', shortDescription: '', description: '', content: [] } } }
    Object.assign(h.state, { all: [book], listReady: true })
    Object.assign(h.series, { all: null })
    const w = await open()
    expect(w.findAll('.shelf')).toHaveLength(0)
    expect(w.find('[data-test="book-skeleton"]').exists()).toBe(true)
    h.series.all = [{ seriesId: 'a', name: 'Reihe A', prefix: 'a', coverImage: '', sortOrder: 1 }]
    h.series.byId = { a: h.series.all[0] }
    await flushPromises()
    expect(w.findAll('.shelf')).toHaveLength(1)
    expect(w.find('.shelf-name').text()).toBe('Reihe A')
    expect(w.find('[data-test="book-skeleton"]').exists()).toBe(false)
  })
})
