/**
 * Stories without a net: the rules (`utils/offlineStories`) and the keeping (`use/useOfflineStories`) against a pretend store.
 * The real store (IndexedDB) is checked in the browser, see BERICHT-optimierung-F.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createOfflineStories } from '@/use/useOfflineStories'
import {
  DEFAULT_LIMITS,
  MAX_BYTES,
  MAX_STORIES,
  canKeepOffline,
  fitsHardLimit,
  isQuotaError,
  isReadableOffline,
  planEviction,
  type OfflineMeta
} from '@/utils/offlineStories'
import { MemoryStore, makeStory } from './offlineStoreDouble'

const meta = (bookId: string, lastUsedAt: number, over: Partial<OfflineMeta> = {}): OfflineMeta => ({
  bookId,
  savedAt: lastUsedAt,
  lastUsedAt,
  pinned: false,
  bytes: 1000,
  ...over
})

describe('rules: what may be kept', () => {
  it('limits are 40 stories and 150 MB', () => {
    expect(MAX_STORIES).toBe(40)
    expect(MAX_BYTES).toBe(150 * 1024 * 1024)
    expect(DEFAULT_LIMITS).toEqual({ maxStories: 40, maxBytes: 150 * 1024 * 1024 })
  })

  it('keeps a whole story', () => {
    expect(canKeepOffline(makeStory('a'))).toBe(true)
  })

  it('does not keep a slim list entry, an empty book or something that is not a book', () => {
    expect(isReadableOffline(makeStory('a', { lean: true }))).toBe(false)
    const empty = makeStory('b')
    empty.localizations.de.content = [{ page: 1, title: 't', text: '   ' }]
    expect(isReadableOffline(empty)).toBe(false)
    expect(isReadableOffline(null)).toBe(false)
    expect(isReadableOffline({ bookId: '' })).toBe(false)
    expect(isReadableOffline('x')).toBe(false)
  })

  it('does not keep coloring books, store books, hidden books or locked ones', () => {
    expect(canKeepOffline(makeStory('c', { kind: 'coloring' }))).toBe(false)
    expect(canKeepOffline(makeStory('c', { category: 'Ausmalbücher' }))).toBe(false)
    expect(canKeepOffline(makeStory('d', { bookSeriesId: 'einzelne-bucher' }))).toBe(false)
    expect(canKeepOffline(makeStory('ba-01-die-schoepfung-der-welt'))).toBe(false)
    expect(canKeepOffline(makeStory('e', { bookSeriesId: 'gute-nacht-lilly' }))).toBe(false)
    expect(canKeepOffline(makeStory('f'), true)).toBe(false)
    expect(canKeepOffline(null)).toBe(false)
  })

  it('knows the errors of a full device', () => {
    expect(isQuotaError(Object.assign(new Error('x'), { name: 'QuotaExceededError' }))).toBe(true)
    expect(isQuotaError({ code: 22 })).toBe(true)
    expect(isQuotaError(new Error('The quota has been exceeded'))).toBe(true)
    expect(isQuotaError(new Error('boom'))).toBe(false)
    expect(isQuotaError(null)).toBe(false)
  })

  it('the hard limit counts everything together', () => {
    expect(fitsHardLimit([meta('a', 1, { bytes: 90 })], 10, 100)).toBe(true)
    expect(fitsHardLimit([meta('a', 1, { bytes: 90 })], 11, 100)).toBe(false)
  })
})

describe('rules: which stories go first', () => {
  it('nothing goes while everything fits', () => {
    expect(planEviction([meta('a', 1), meta('b', 2)], new Set())).toEqual([])
  })

  it('the oldest go first when there are too many', () => {
    const list = [meta('c', 30), meta('a', 10), meta('d', 40), meta('b', 20)]
    expect(planEviction(list, new Set(), { maxStories: 2, maxBytes: 1e9 })).toEqual(['a', 'b'])
  })

  it('the oldest go first when the size is too big', () => {
    const list = [meta('a', 1, { bytes: 600 }), meta('b', 2, { bytes: 600 }), meta('c', 3, { bytes: 600 })]
    expect(planEviction(list, new Set(), { maxStories: 40, maxBytes: 1000 })).toEqual(['a', 'b'])
  })

  it('pinned, protected ("Gemerkt") and open stories never go, even when they are the oldest', () => {
    const list = [meta('pin', 1, { pinned: true }), meta('merk', 2), meta('offen', 3), meta('x', 4), meta('y', 5)]
    // the open one counts, but is not thrown out: of the three that are only remembered (offen, x, y) one may stay
    expect(planEviction(list, new Set(['merk']), { maxStories: 1, maxBytes: 1e9 }, new Set(['offen']))).toEqual(['x', 'y'])
  })

  it('pinned and protected ones do not use up the count of the remembered ones', () => {
    const list = [meta('p1', 1, { pinned: true }), meta('p2', 2, { pinned: true }), meta('a', 3), meta('b', 4)]
    expect(planEviction(list, new Set(), { maxStories: 2, maxBytes: 1e9 })).toEqual([])
  })

  it('when only protected stories are left the plan stops (nothing to throw out)', () => {
    const list = [meta('p', 1, { pinned: true, bytes: 5000 })]
    expect(planEviction(list, new Set(), { maxStories: 40, maxBytes: 100 })).toEqual([])
  })
})

describe('keeping stories', () => {
  let store: MemoryStore
  let clock: number
  let protectedIds: string[]
  let locked: Set<string>

  const make = (limits = DEFAULT_LIMITS) =>
    createOfflineStories({
      store,
      limits,
      now: () => ++clock,
      protectedIds: () => protectedIds,
      isLocked: (b) => locked.has(b.bookId)
    })

  beforeEach(() => {
    store = new MemoryStore()
    clock = 1000
    protectedIds = []
    locked = new Set()
  })
  afterEach(() => vi.unstubAllGlobals())

  /** What the app does when a story is opened: the book is in the cache, then it is noted. */
  async function open(offline: ReturnType<typeof make>, id: string) {
    const book = makeStory(id)
    await store.putBook(book)
    await offline.noteOpened(book)
  }

  it('every opened story is remembered and shows up in the list, the last opened first', async () => {
    const offline = make()
    await open(offline, 'a')
    await open(offline, 'b')
    await open(offline, 'a')
    const list = await offline.list()
    expect(list.map((i) => i.book.bookId)).toEqual(['a', 'b'])
    expect(offline.isStored('a')).toBe(true)
    expect(offline.isPinned('a')).toBe(false)
  })

  it('a coloring book is not remembered', async () => {
    const offline = make()
    await offline.noteOpened(makeStory('m', { kind: 'coloring' }))
    expect(offline.isStored('m')).toBe(false)
    expect(store.metas.size).toBe(0)
  })

  it('a locked story is not remembered (the Plus rules stay as they are)', async () => {
    const offline = make()
    locked.add('p')
    await offline.noteOpened(makeStory('p'))
    expect(offline.isStored('p')).toBe(false)
    expect(await offline.pin(makeStory('p'))).toBe('unavailable')
  })

  it('when there are more stories than the limit the oldest are removed from the device', async () => {
    const offline = make({ maxStories: 3, maxBytes: 1e12 })
    for (const id of ['a', 'b', 'c', 'd', 'e']) await open(offline, id)
    expect(store.removed.sort()).toEqual(['a', 'b'])
    expect((await offline.list()).map((i) => i.book.bookId)).toEqual(['e', 'd', 'c'])
    expect(store.books.has('a')).toBe(false)
  })

  it('when the size is too big the oldest are removed (the size comes with the pictures)', async () => {
    const offline = make({ maxStories: 40, maxBytes: 8000 })
    store.pictureBytes = 2000 // two pictures: 4000 bytes, plus the text
    for (const id of ['a', 'b']) {
      await open(offline, id)
      await store.prefetch(makeStory(id)) // the pictures arrive
      await offline.refreshSize(id)
    }
    expect(offline.state.metas.b?.bytes).toBeGreaterThan(4000)
    expect(store.removed).toEqual(['a'])
    expect((await offline.list()).map((i) => i.book.bookId)).toEqual(['b'])
  })

  it('a story on the "Gemerkt" list is not removed', async () => {
    const offline = make({ maxStories: 1, maxBytes: 1e12 })
    protectedIds = ['a']
    for (const id of ['a', 'b', 'c']) await open(offline, id)
    expect((await offline.list()).map((i) => i.book.bookId).sort()).toEqual(['a', 'c'])
  })

  it('the story that is open right now is never the one that goes', async () => {
    const offline = make({ maxStories: 0, maxBytes: 1e12 })
    await open(offline, 'a')
    expect(offline.isStored('a')).toBe(true)
    await open(offline, 'b')
    expect(offline.isStored('b')).toBe(true)
    expect(offline.isStored('a')).toBe(false)
  })

  describe('"Offline speichern"', () => {
    it('keeps the text and the pictures and says saved', async () => {
      const offline = make()
      const book = makeStory('a')
      expect(await offline.pin(book)).toBe('saved')
      expect(offline.isPinned('a')).toBe(true)
      expect(store.books.has('a')).toBe(true)
      expect(offline.state.metas.a?.bytes).toBeGreaterThan(2000) // two pictures of 1000 bytes
      expect(offline.isSaving('a')).toBe(false)
    })

    it('a pinned story stays when many others come', async () => {
      const offline = make({ maxStories: 2, maxBytes: 1e12 })
      await offline.pin(makeStory('keep'))
      for (const id of ['a', 'b', 'c', 'd']) await open(offline, id)
      expect(offline.isStored('keep')).toBe(true)
      expect(store.removed).not.toContain('keep')
    })

    it('saves a book that comes from a screen (a reactive proxy cannot go into IndexedDB as it is)', async () => {
      const offline = make()
      const { reactive } = await import('vue')
      expect(await offline.pin(reactive(makeStory('a')))).toBe('saved')
      expect(store.books.get('a')?.book.localizations.de.title).toBe('Titel a')
    })

    it('can be taken back: the story is then only remembered', async () => {
      const offline = make()
      await offline.pin(makeStory('a'))
      await offline.unpin('a')
      expect(offline.isPinned('a')).toBe(false)
      expect(offline.isStored('a')).toBe(true)
    })

    it('says "full" when the device has no room for the text', async () => {
      const offline = make()
      store.putBookFull = true
      expect(await offline.pin(makeStory('a'))).toBe('full')
      expect(offline.isPinned('a')).toBe(false)
      expect(offline.isSaving('a')).toBe(false)
    })

    it('says "full" when the pictures do not fit, and the story is not marked as saved', async () => {
      const offline = make()
      store.prefetchResult = { stored: 1, failed: 1, full: true }
      expect(await offline.pin(makeStory('a'))).toBe('full')
      expect(offline.isPinned('a')).toBe(false)
    })

    it('says "full" when everything together would pass the hard limit', async () => {
      const offline = make()
      store.pictureBytes = 200 * 1024 * 1024
      store.prefetchResult = { stored: 1, failed: 0, full: false }
      expect(await offline.pin(makeStory('a'))).toBe('saved')
      expect(await offline.pin(makeStory('b'))).toBe('full')
      expect(offline.isPinned('b')).toBe(false)
    })

    it('says "error" when no picture came (the net failed)', async () => {
      const offline = make()
      store.prefetchResult = { stored: 0, failed: 2, full: false }
      expect(await offline.pin(makeStory('a'))).toBe('error')
      expect(offline.isPinned('a')).toBe(false)
    })

    it('says "error" when some pictures are missing and the net is down', async () => {
      const offline = make()
      vi.stubGlobal('navigator', { onLine: false })
      store.prefetchResult = { stored: 1, failed: 1, full: false }
      expect(await offline.pin(makeStory('a'))).toBe('error')
    })

    it('a picture that is missing on the server does not stop the saving', async () => {
      const offline = make()
      store.prefetchResult = { stored: 1, failed: 1, full: false }
      expect(await offline.pin(makeStory('a'))).toBe('saved')
    })

    it('a story without any picture can be saved', async () => {
      const offline = make()
      store.prefetchResult = { stored: 0, failed: 0, full: false }
      expect(await offline.pin(makeStory('a'))).toBe('saved')
    })

    it('does not save a coloring book', async () => {
      const offline = make()
      expect(await offline.pin(makeStory('m', { kind: 'coloring' }))).toBe('unavailable')
      expect(store.books.size).toBe(0)
    })

    it('says "error" when the storage breaks in between', async () => {
      const offline = make()
      store.broken = true
      expect(await offline.pin(makeStory('a'))).toBe('error')
    })
  })

  describe('the list without a net', () => {
    it('drops an entry whose book is gone or broken', async () => {
      const offline = make()
      await open(offline, 'good')
      await open(offline, 'gone')
      await open(offline, 'broken')
      store.books.delete('gone')
      const broken = store.books.get('broken')!.book
      broken.localizations.de.content = []
      const list = await offline.list()
      expect(list.map((i) => i.book.bookId)).toEqual(['good'])
      expect(store.metas.has('gone')).toBe(false)
      expect(store.metas.has('broken')).toBe(false)
    })

    it('adopts the stories that were cached before kept stories existed (not the coloring books)', async () => {
      store.books.set('old1', { book: makeStory('old1'), cachedAt: 50 })
      store.books.set('old2', { book: makeStory('old2'), cachedAt: 80 })
      store.books.set('col', { book: makeStory('col', { kind: 'coloring' }), cachedAt: 90 })
      const offline = make()
      const list = await offline.list()
      expect(list.map((i) => i.book.bookId)).toEqual(['old2', 'old1'])
      expect(store.metas.has('col')).toBe(false)
    })

    it('adopting old cached stories also respects the limit', async () => {
      for (let i = 0; i < 6; i++) store.books.set(`o${i}`, { book: makeStory(`o${i}`), cachedAt: 10 + i })
      const offline = make({ maxStories: 4, maxBytes: 1e12 })
      const list = await offline.list()
      expect(list).toHaveLength(4)
      expect(list.map((i) => i.book.bookId)).toEqual(['o5', 'o4', 'o3', 'o2'])
    })

    it('is empty and does not throw when the storage does not work at all (private window)', async () => {
      store.broken = true
      const offline = make()
      await expect(offline.init()).resolves.toBeUndefined()
      await expect(offline.noteOpened(makeStory('a'))).resolves.toBeUndefined()
      expect(await offline.list()).toEqual([])
      expect(offline.isStored('a')).toBe(false)
      await expect(offline.refreshSize('a')).resolves.toBeUndefined()
      await expect(offline.unpin('a')).resolves.toBeUndefined()
    })

    it('comes back after the net is back: a story opened again moves to the front', async () => {
      const offline = make()
      await open(offline, 'a')
      await open(offline, 'b')
      expect((await offline.list()).map((i) => i.book.bookId)).toEqual(['b', 'a'])
      await open(offline, 'a')
      expect((await offline.list()).map((i) => i.book.bookId)).toEqual(['a', 'b'])
    })
  })

  it('jobs at the same time do not trip over each other', async () => {
    const offline = make({ maxStories: 3, maxBytes: 1e12 })
    await offline.init()
    const books = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => makeStory(id))
    for (const b of books) await store.putBook(b)
    await Promise.all([...books.map((b) => offline.noteOpened(b)), offline.pin(makeStory('p'))])
    const ids = (await offline.list()).map((i) => i.book.bookId)
    expect(ids).toContain('p')
    expect(ids.filter((id) => id !== 'p')).toHaveLength(3)
  })
})

describe('the real store without IndexedDB (private window, old webview)', () => {
  it('keeps nothing, says "error" for the save button and never throws', async () => {
    const { createIdbBookStore, cachedBlobUrl } = await import('@/use/useBookCache')
    const offline = createOfflineStories({ store: createIdbBookStore() })
    await expect(offline.init()).resolves.toBeUndefined()
    await expect(offline.noteOpened(makeStory('a'))).resolves.toBeUndefined()
    expect(await offline.list()).toEqual([])
    expect(await offline.pin(makeStory('a'))).toBe('error')
    expect(await cachedBlobUrl('https://example.invalid/x.webp')).toBe('')
  })
})
