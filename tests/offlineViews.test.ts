/**
 * Stories without a net, the screens: "Lesen → Geschichten" shows the stories on the device instead of "Du bist offline", and the book
 * page has the button "Für unterwegs speichern" (stories only; a coloring book has none).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import type { ApiBook } from '@/types/apiBook'
import { createOfflineStories } from '@/use/useOfflineStories'
import { MemoryStore, makeStory } from './offlineStoreDouble'

const h = vi.hoisted(() => ({
  push: vi.fn(),
  routeParams: { bookId: 'a' } as Record<string, string>,
  apiState: null as unknown as { all: unknown[] | null; byId: Record<string, unknown>; loading: Record<string, boolean>; listLoading: boolean; listFailed: boolean; error: string | null },
  loadAllBooks: vi.fn(async () => [] as unknown[]),
  loadBook: vi.fn(async () => null as unknown),
  offline: null as unknown
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: h.routeParams, query: {}, name: 'x' }),
  useRouter: () => ({ push: h.push, back: vi.fn() })
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: 'de' } })
}))
vi.mock('@/use/useApiBooks', () => ({
  default: () => ({
    state: h.apiState,
    loadAllBooks: h.loadAllBooks,
    booksOfSeries: () => [],
    loadBook: h.loadBook,
    nextBookInSeries: vi.fn(),
    getById: (id: string) => (h.apiState.byId[id] as ApiBook | undefined) ?? null
  })
}))
vi.mock('@/use/useApiSeries', () => ({
  default: () => ({ state: { all: [], byId: {}, loading: false, error: null }, loadAll: vi.fn(async () => []), getById: () => null })
}))
vi.mock('@/use/useModels', () => ({
  default: () => ({
    getSeries: () => undefined,
    getSeriesOfBook: () => undefined,
    isInWatchList: () => false,
    toggleWatchList: vi.fn(),
    setLastRead: vi.fn(),
    getPlaybackState: () => undefined,
    setPlaybackState: vi.fn(),
    watchListIds: { value: [] }
  })
}))
vi.mock('@/use/useCatalogNames', () => ({
  default: () => ({
    seriesName: (_id: string, fallback = '') => fallback,
    seriesNameOfBook: () => 'Reihe',
    categoryName: (n: string) => n,
    badgeLabel: (b: string) => b
  })
}))
vi.mock('@/use/useUser', () => ({ isMobileLandscape: { value: false }, isMobilePortrait: { value: true } }))
vi.mock('@/use/useOfflineStories', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/use/useOfflineStories')>()),
  default: () => h.offline,
  useOfflineStories: () => h.offline
}))
vi.mock('@/use/useBookCache', () => ({
  default: () => ({ releaseBlobUrl: vi.fn() }),
  cachedBlobUrl: vi.fn(async () => ''),
  cacheUrlToBlobUrl: vi.fn(async (u: string) => u),
  createIdbBookStore: vi.fn()
}))
vi.mock('@/components/molecules/AppHeader.vue', () => ({ default: { name: 'AppHeader', template: '<header class="app-header-stub" />' } }))
vi.mock('@/components/atoms/ZBackButton.vue', () => ({ default: { name: 'ZBackButton', template: '<button class="z-back-btn-stub" />' } }))

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => value })
}

let store: MemoryStore
const mounted: Array<{ unmount: () => void }> = []
/** Every screen is taken down after its test: a screen that stays listens to the net events of the next test. */
function track<T extends { unmount: () => void }>(wrapper: T): T {
  mounted.push(wrapper)
  return wrapper
}

function freshOffline() {
  store = new MemoryStore()
  h.offline = createOfflineStories({ store, protectedIds: () => [] })
  return h.offline as ReturnType<typeof createOfflineStories>
}

async function keep(offline: ReturnType<typeof createOfflineStories>, id: string, over: Partial<ApiBook> = {}) {
  const book = makeStory(id, over)
  await store.putBook(book)
  await offline.noteOpened(book)
  return book
}

beforeEach(() => {
  h.push.mockClear()
  h.loadAllBooks.mockClear()
  h.apiState = reactive({ all: [], byId: {}, loading: {}, listLoading: false, listFailed: false, error: null })
  setNavigatorOnline(true)
})
afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount()
  setNavigatorOnline(true)
})

describe('Lesen → Geschichten without a net', () => {
  it('shows the stories on the device instead of "you are offline"', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    await keep(offline, 'b')
    setNavigatorOnline(false)
    h.apiState.listFailed = true
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()

    expect(wrapper.find('[data-test="offline-list"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('app.offline.listTitle')
    expect(wrapper.text()).toContain('app.offline.listText')
    expect(wrapper.text()).not.toContain('app.offline.listTextServer')
    expect(wrapper.findAll('[data-test="offline-item"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Titel b')
    expect(wrapper.findAll('.shelf')).toHaveLength(0)
    expect(wrapper.find('.empty').exists()).toBe(false)
  })

  it('opens a kept story on a tap', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    setNavigatorOnline(false)
    h.apiState.listFailed = true
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()
    await wrapper.find('[data-test="offline-item"]').trigger('click')
    expect(h.push).toHaveBeenCalledWith({ name: 'app-book', params: { bookId: 'a' } })
  })

  it('marks a story that is saved for the road', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    await offline.pin(makeStory('p'))
    setNavigatorOnline(false)
    h.apiState.listFailed = true
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()
    expect(wrapper.findAll('.pin-mark')).toHaveLength(1)
  })

  it('with a net but a server that does not answer it says so honestly and still shows the stories', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    h.apiState.listFailed = true
    h.apiState.error = 'API 503'
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()
    expect(wrapper.text()).toContain('app.offline.listTextServer')
    expect(wrapper.findAll('[data-test="offline-item"]')).toHaveLength(1)
  })

  it('says what to do when nothing is kept yet', async () => {
    freshOffline()
    setNavigatorOnline(false)
    h.apiState.listFailed = true
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()
    expect(wrapper.find('[data-test="offline-list"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('app.offline.emptyTitle')
    expect(wrapper.text()).toContain('app.offline.emptyText')
  })

  it('the search runs over the stories on the device', async () => {
    const offline = freshOffline()
    await keep(offline, 'alpha')
    await keep(offline, 'beta')
    setNavigatorOnline(false)
    h.apiState.listFailed = true
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()
    await wrapper.find('.ask-input').setValue('alpha')
    expect(wrapper.findAll('[data-test="offline-item"]')).toHaveLength(1)
    await wrapper.find('.ask-input').setValue('zzz')
    expect(wrapper.findAll('[data-test="offline-item"]')).toHaveLength(0)
    expect(wrapper.find('.results-empty').exists()).toBe(true)
  })

  it('with a net and a working server there is no offline list, only the shelves', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    h.apiState.all = [makeStory('a')]
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()
    expect(wrapper.find('[data-test="offline-list"]').exists()).toBe(false)
    expect(wrapper.findAll('.shelf')).toHaveLength(1)
  })

  it('when the net comes back the list is fetched again and the page returns to the shelves', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    setNavigatorOnline(false)
    h.apiState.listFailed = true
    const { default: View } = await import('@/views/app/AppAllBooksView.vue')
    const wrapper = track(mount(View))
    await flushPromises()
    expect(wrapper.find('[data-test="offline-list"]').exists()).toBe(true)
    const calls = h.loadAllBooks.mock.calls.length

    setNavigatorOnline(true)
    h.loadAllBooks.mockImplementationOnce(async () => {
      h.apiState.all = [makeStory('a')]
      h.apiState.listFailed = false
      return h.apiState.all
    })
    window.dispatchEvent(new Event('online'))
    await flushPromises()
    expect(h.loadAllBooks.mock.calls.length).toBe(calls + 1)
    expect(wrapper.find('[data-test="offline-list"]').exists()).toBe(false)
    expect(wrapper.findAll('.shelf')).toHaveLength(1)
  })
})

describe('the book page: "Für unterwegs speichern"', () => {
  async function mountDetail(book: ApiBook) {
    h.routeParams.bookId = book.bookId
    h.apiState.byId[book.bookId] = book
    h.loadBook.mockImplementation(async () => book)
    const { default: View } = await import('@/views/app/AppBookDetailView.vue')
    const wrapper = track(mount(View, { global: { stubs: { AAudioPlayer: true, AttachmentTile: true, AttachmentContextMenu: true } } }))
    await flushPromises()
    return wrapper
  }

  it('is there for a story, and a tap keeps it', async () => {
    const offline = freshOffline()
    const wrapper = await mountDetail(makeStory('a'))
    const button = wrapper.find('[data-test="offline-save"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('app.offline.save')
    expect(button.attributes('aria-pressed')).toBe('false')

    await button.trigger('click')
    await flushPromises()
    expect(offline.isPinned('a')).toBe(true)
    expect(store.books.has('a')).toBe(true)
    expect(wrapper.find('[data-test="offline-save"]').text()).toContain('app.offline.saved')
    expect(wrapper.find('[data-test="offline-save"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-test="offline-note"]').text()).toBe('app.offline.notePinned')
  })

  it('a second tap takes it back', async () => {
    const offline = freshOffline()
    const wrapper = await mountDetail(makeStory('a'))
    await wrapper.find('[data-test="offline-save"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-test="offline-save"]').trigger('click')
    await flushPromises()
    expect(offline.isPinned('a')).toBe(false)
    expect(wrapper.find('[data-test="offline-save"]').text()).toContain('app.offline.save')
  })

  it('tells honestly when there is no room', async () => {
    const offline = freshOffline()
    store.putBookFull = true
    const wrapper = await mountDetail(makeStory('a'))
    await wrapper.find('[data-test="offline-save"]').trigger('click')
    await flushPromises()
    expect(offline.isPinned('a')).toBe(false)
    expect(wrapper.find('[data-test="offline-note"]').text()).toBe('app.offline.noteFull')
    // the button is usable again
    expect(wrapper.find('[data-test="offline-save"]').attributes('disabled')).toBeUndefined()
  })

  it('tells honestly when it did not work', async () => {
    freshOffline()
    store.prefetchResult = { stored: 0, failed: 2, full: false }
    const wrapper = await mountDetail(makeStory('a'))
    await wrapper.find('[data-test="offline-save"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="offline-note"]').text()).toBe('app.offline.noteError')
  })

  it('says that a story that is only remembered can be read without a net', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    const wrapper = await mountDetail(makeStory('a'))
    expect(wrapper.find('[data-test="offline-note"]').text()).toBe('app.offline.noteRemembered')
  })

  it('without a net it says that listening needs a net', async () => {
    const offline = freshOffline()
    await keep(offline, 'a')
    setNavigatorOnline(false)
    const wrapper = await mountDetail(makeStory('a'))
    expect(wrapper.find('[data-test="offline-note"]').text()).toBe('app.offline.noteNoNet')
  })

  it('a coloring book has no such button (Plus rules and the painting program stay as they are)', async () => {
    freshOffline()
    const wrapper = await mountDetail(makeStory('m', { kind: 'coloring' }))
    expect(wrapper.find('[data-test="offline-save"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="offline-note"]').exists()).toBe(false)
  })
})
