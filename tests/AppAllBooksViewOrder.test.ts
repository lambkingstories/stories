/**
 * Regression test for the series ordering on `AppAllBooksView`.
 *
 * The tiles are derived by grouping the books list, so their natural order
 * is "whatever order the books arrived in" — not the display order the
 * editor set in the AdminUI. This asserts the view re-sorts by the series
 * record's `sortOrder` (lower first) and that a series without a position
 * lands at the end rather than at the front, for both the tiles and the
 * filter chips that are derived from them.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ApiBook, ApiSeries } from '@/types/apiBook'

// ---- Fixtures --------------------------------------------------------------

function makeBook(seriesId: string, idx: number): ApiBook {
  return {
    bookId: `${seriesId}-${idx}`,
    author: 'Test Author',
    category: 'test',
    bookSeriesId: seriesId,
    releaseDate: new Date(Date.now() - idx * 86_400_000).toISOString(),
    updatedDate: new Date().toISOString(),
    badges: [],
    previewImage: 'images/test.webp',
    localizations: {
      de: { title: `Titel ${idx}`, shortDescription: '', description: '', content: [] }
    },
    isPublished: true
  }
}

// Deliberately shuffled relative to the intended display order, so a view
// that just echoes the books order fails this test.
const FIXTURE_BOOKS: ApiBook[] = [
  makeBook('charlie', 1),
  makeBook('alpha', 1),
  makeBook('bravo', 1),
  makeBook('zulu', 1)
]

function makeSeries(seriesId: string, name: string, sortOrder?: number): ApiSeries {
  return { seriesId, name, prefix: seriesId.slice(0, 2), coverImage: '', sortOrder }
}

// `zulu` has no position at all — the pre-backfill state for a series
// created against an older server build.
const FIXTURE_SERIES: Record<string, ApiSeries> = {
  charlie: makeSeries('charlie', 'Charlie Reihe', 1),
  bravo: makeSeries('bravo', 'Bravo Reihe', 2),
  alpha: makeSeries('alpha', 'Alpha Reihe', 3),
  zulu: makeSeries('zulu', 'Zulu Reihe')
}

// ---- Module mocks ----------------------------------------------------------

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, name: 'app-all-books' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'de' }
  })
}))

vi.mock('@/use/useApiBooks', () => ({
  default: () => ({
    state: { all: FIXTURE_BOOKS, byId: {}, loading: {}, listLoading: false, error: null },
    loadAllBooks: vi.fn(async () => FIXTURE_BOOKS),
    booksOfSeries: (id: string) => FIXTURE_BOOKS.filter((b) => b.bookSeriesId === id),
    loadBook: vi.fn(),
    nextBookInSeries: vi.fn(),
    getById: (id: string) => FIXTURE_BOOKS.find((b) => b.bookId === id) ?? null
  })
}))

vi.mock('@/use/useApiSeries', () => ({
  default: () => ({
    state: { all: Object.values(FIXTURE_SERIES), byId: FIXTURE_SERIES, loading: false, error: null },
    loadAll: vi.fn(async () => Object.values(FIXTURE_SERIES)),
    getById: (id: string) => FIXTURE_SERIES[id] ?? null
  })
}))

vi.mock('@/use/useModels', () => ({
  default: () => ({
    getSeries: () => undefined,
    getSeriesOfBook: () => undefined
  })
}))

// No i18n overrides for these fixture ids — the raw API name comes through.
vi.mock('@/use/useCatalogNames', () => ({
  default: () => ({
    seriesName: (_id: string, fallback = '') => fallback,
    seriesNameOfBook: () => '',
    categoryName: (name: string) => name,
    badgeLabel: (badge: string) => badge
  })
}))

vi.mock('@/use/useUser', () => ({
  isMobileLandscape: { value: false },
  isMobilePortrait: { value: true }
}))

vi.mock('@/components/molecules/AppHeader.vue', () => ({
  default: { name: 'AppHeader', template: '<header class="app-header-stub" />' }
}))

vi.mock('@/components/atoms/ZBackButton.vue', () => ({
  default: { name: 'ZBackButton', template: '<button class="z-back-btn-stub" />' }
}))

// ---- Test ------------------------------------------------------------------

describe('AppAllBooksView · series display order', () => {
  it('orders the shelves by the AdminUI sortOrder, unpositioned series last', async () => {
    const { default: AppAllBooksView } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = mount(AppAllBooksView)
    await wrapper.vm.$nextTick()

    const names = wrapper.findAll('.shelf-name').map((n) => n.text())
    expect(names).toEqual(['Charlie Reihe', 'Bravo Reihe', 'Alpha Reihe', 'Zulu Reihe'])
  })

  it('every shelf has its books and an "all" link', async () => {
    const { default: AppAllBooksView } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = mount(AppAllBooksView)
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.shelf')).toHaveLength(4)
    expect(wrapper.findAll('.shelf-all')).toHaveLength(4)
    expect(wrapper.findAll('.shelf-book')).toHaveLength(4)
  })

  it('the search shows the matching books instead of the shelves, and says so when nothing matches', async () => {
    const { default: AppAllBooksView } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = mount(AppAllBooksView)
    await wrapper.vm.$nextTick()

    await wrapper.find('.ask-input').setValue('titel')
    expect(wrapper.findAll('.shelf')).toHaveLength(0)
    expect(wrapper.findAll('.result')).toHaveLength(4)

    await wrapper.find('.ask-input').setValue('zzzz')
    expect(wrapper.findAll('.result')).toHaveLength(0)
    expect(wrapper.find('.results-empty').exists()).toBe(true)

    await wrapper.find('.ask-input').setValue('')
    expect(wrapper.findAll('.shelf')).toHaveLength(4)
  })
})
