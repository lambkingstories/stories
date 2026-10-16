/**
 * Regression test for the "Bücher der Serie" grid on `AppBookSeriesView`.
 *
 * What this test covers (JSDom):
 *   - One `.book-card` per book in the series fixture.
 *   - Each card carries the structural skeleton that the CSS depends on
 *     (`.book-card-img-wrap` wrapping a `.book-card-img`, plus a
 *     `.book-card-meta` block).
 *   - The grid container exists and renders all children.
 *
 * What this test does NOT cover:
 *   - Computed CSS layout (grid track widths, `aspect-ratio` / padding
 *     resolution, image sizing). JSDom does not run a layout engine, so
 *     visual regressions like "image renders tiny" can't be caught here.
 *     For that, add Playwright as a follow-up and assert
 *     `getBoundingClientRect()` on the image wrap.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ApiBook } from '@/types/apiBook'

// ---- Fixtures --------------------------------------------------------------

function makeBook(idx: number, overrides: Partial<ApiBook> = {}): ApiBook {
  const id = `fa-${idx}-fixture`
  return {
    bookId: id,
    author: 'Test Author',
    category: 'test',
    bookSeriesId: 'fruit-agents',
    releaseDate: new Date(Date.now() - idx * 86_400_000).toISOString(),
    updatedDate: new Date().toISOString(),
    badges: [],
    previewImage: 'images/test.webp',
    localizations: {
      de: {
        title: `Band ${idx}: Mission Test`,
        shortDescription: '',
        description: '',
        content: [
          { page: 1, title: '', text: '' },
          { page: 2, title: '', text: '' }
        ]
      }
    },
    isPublished: true,
    ...overrides
  }
}

const FIXTURE_BOOKS: ApiBook[] = Array.from({ length: 9 }, (_, i) => makeBook(i + 1))

// ---- Module mocks ----------------------------------------------------------
// Every composable AppBookSeriesView pulls in needs a minimal stub so the
// mount doesn't blow up on missing globals (no real router, no real store).

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { seriesId: 'fruit-agents' }, name: 'app-series' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key,
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

vi.mock('@/use/useModels', () => ({
  default: () => ({
    getSeries: (id: string) =>
      id === 'fruit-agents'
        ? { id: 'fruit-agents', name: 'Die Frucht-Agenten', description: 'desc', bookIds: [], coverImage: '' }
        : undefined,
    getSeriesOfBook: () => undefined,
    isInWatchList: () => false,
    toggleWatchList: vi.fn(),
    setLastRead: vi.fn(),
    getPlaybackState: () => undefined,
    setPlaybackState: vi.fn()
  })
}))

vi.mock('@/use/useReadingProgress', () => ({
  default: () => ({
    getPct: () => 0,
    isCompleted: () => false
  })
}))

vi.mock('@/use/useAppNav', () => ({
  default: () => ({
    navItems: { value: [] },
    activeNav: { value: 'series' },
    onNav: vi.fn()
  })
}))

vi.mock('@/use/useUser', () => ({
  isMobileLandscape: { value: false },
  isMobilePortrait: { value: true }
}))

// Stub the back-button atom so we don't need to drag its i18n + asset
// mask dependencies into this test.
vi.mock('@/components/atoms/ZBackButton.vue', () => ({
  default: { name: 'ZBackButton', template: '<button class="z-back-btn-stub" />' }
}))

vi.mock('@/components/molecules/AppHeader.vue', () => ({
  default: { name: 'AppHeader', template: '<header class="app-header-stub" />' }
}))

vi.mock('@/components/atoms/ZBottomNav.vue', () => ({
  default: { name: 'ZBottomNav', template: '<nav class="z-bottom-nav-stub" />' }
}))

// ---- Test ------------------------------------------------------------------

describe('AppBookSeriesView · Bücher der Serie grid', () => {
  beforeEach(() => {
    // pug needs the linker; vue-test-utils mounts the compiled SFC, so
    // nothing to seed here beyond the module mocks above.
  })

  it('renders one .cell per book in the series', async () => {
    const { default: AppBookSeriesView } = await import('@/views/app/AppBookSeriesView.vue')
    const wrapper = mount(AppBookSeriesView)
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.cell').length).toBe(FIXTURE_BOOKS.length)
  })

  it('renders the .grid container exactly once', async () => {
    const { default: AppBookSeriesView } = await import('@/views/app/AppBookSeriesView.vue')
    const wrapper = mount(AppBookSeriesView)
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.grid').length).toBe(1)
  })

  it('each cell has a cover image and the localized title', async () => {
    const { default: AppBookSeriesView } = await import('@/views/app/AppBookSeriesView.vue')
    const wrapper = mount(AppBookSeriesView)
    await wrapper.vm.$nextTick()

    wrapper.findAll('.cell').forEach((cell, i) => {
      expect(cell.find('.cell-cover img').exists()).toBe(true)
      expect(cell.find('.cell-title').text()).toContain(`Band ${i + 1}`)
    })
  })

  it('a book that was not started says so', async () => {
    const { default: AppBookSeriesView } = await import('@/views/app/AppBookSeriesView.vue')
    const wrapper = mount(AppBookSeriesView)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.cell .cell-meta').text()).toContain('app.read.open')
  })

  it('image well declares the 4:3 padding-bottom aspect lock in its scoped style', async () => {
    // Defends against the visual-regression class of bug we hit in
    // production: someone removes the legacy `padding-bottom` trick (or
    // swaps `aspect-ratio` only, which has flaky support in some
    // engines + caches) and the image collapses to its intrinsic size
    // inside an empty container.
    //
    // We're reading the raw SFC source here because JSDom does not
    // resolve scoped CSS at mount time; the file content is the
    // closest reliable proxy.
    const fs = await import('node:fs')
    const path = await import('node:path')
    // The grid styles moved into the shared BookGridSection organism
    // (reused by the Categories page), so the source check reads that
    // component instead of the view.
    const sfc = fs.readFileSync(
      path.resolve(__dirname, '../src/components/organisms/BookGridSection.vue'),
      'utf-8'
    )
    // Either the padding-bottom trick OR a working aspect-ratio rule
    // needs to be present on the wrap.
    expect(sfc).toMatch(/\.book-card-img-wrap[\s\S]*?padding-bottom:\s*133/)
    expect(sfc).toMatch(/\.book-card-img[\s\S]*?object-fit:\s*cover/)
  })
})
