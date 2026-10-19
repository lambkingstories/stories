/**
 * Reactive store of books fetched from the Render API, layered on top of the
 * IndexedDB cache (`useBookCache`). Cache-first: always returns the cached
 * copy if present, then kicks off a network check in the background to
 * refresh the cache when `updatedDate` advances. This is the single source of
 * truth for book content app-side; `useModels` only retains watch-list /
 * last-read / playback state and the (static) series catalogue.
 */
import { reactive, readonly } from 'vue'
import { booksApi } from '@/api/booksApi'
import useBookCache from '@/use/useBookCache'
import type { ApiBook } from '@/types/apiBook'
import { localColoringBooks, localColoringBooksMissingFrom } from '@/data/localColoringBooks'

const state = reactive<{
  byId: Record<string, ApiBook>
  all: ApiBook[] | null
  loading: Record<string, boolean>
  listLoading: boolean
  error: string | null
}>({
  byId: {},
  all: null,
  loading: {},
  listLoading: false,
  error: null
})

const cache = useBookCache()

async function refreshBookInBackground(bookId: string): Promise<void> {
  try {
    const fresh = await booksApi.getById(bookId)
    const cached = await cache.getCached(bookId)
    const cachedMs = cached ? Date.parse(cached.updatedDate) : 0
    const freshMs = Date.parse(fresh.updatedDate)
    // Always write the freshest book to the in-memory store so consumers
    // that key off `state.byId` (the BookDetail / Reader views) see new
    // server-side fields the moment the network returns — even when the
    // server didn't bump `updatedDate` (e.g. a schema migration that
    // re-shapes attachments without touching the document timestamp).
    state.byId[bookId] = fresh
    if (!cached || !Number.isFinite(cachedMs) || freshMs > cachedMs) {
      await cache.invalidateBookBlobs(bookId)
      await cache.saveBook(fresh)
    }
    void cache.prefetchBlobs(fresh)
  } catch {
    // offline or server hiccup — cached copy stays authoritative
  }
}

/** Books that ship inside a test build (see `localColoringBooks`); they never touch the cache or the network. */
const localBookById = (id: string): ApiBook | undefined => localColoringBooks().find((b) => b.bookId === id)

async function loadBook(bookId: string): Promise<ApiBook | null> {
  const local = localBookById(bookId)
  if (local) {
    state.byId[bookId] = local
    return local
  }
  if (state.loading[bookId]) return state.byId[bookId] ?? null
  state.loading[bookId] = true
  try {
    const stored = await cache.getCached(bookId)
    // a slim copy (no story text) is never used for reading
    const cached = stored && !stored.lean ? stored : null
    if (cached) {
      state.byId[bookId] = cached
      void refreshBookInBackground(bookId)
      return cached
    }
    const fresh = await booksApi.getById(bookId)
    await cache.saveBook(fresh)
    state.byId[bookId] = fresh
    void cache.prefetchBlobs(fresh)
    return fresh
  } catch (err) {
    state.error = (err as Error).message
    return state.byId[bookId] ?? null
  } finally {
    state.loading[bookId] = false
  }
}

async function loadAllBooks(): Promise<ApiBook[]> {
  if (state.listLoading) return state.all ?? []
  state.listLoading = true
  try {
    const remote = await booksApi.list()
    const books = [...remote, ...localColoringBooksMissingFrom(remote)]
    state.all = books
    for (const b of books) {
      // a slim entry (no story text) never replaces a whole book that is already known, and is not kept for offline use:
      // the whole book is fetched and cached when it is opened
      const known = state.byId[b.bookId]
      if (!(b.lean && known && !known.lean)) state.byId[b.bookId] = b
      if (!b.lean && !localBookById(b.bookId)) void cache.saveBook(b)
    }
    return books
  } catch (err) {
    state.error = (err as Error).message
    // offline: a test build still has its own books
    if (!state.all && localColoringBooks().length) state.all = localColoringBooks()
    return state.all ?? []
  } finally {
    state.listLoading = false
  }
}

// Volume number lives in the middle segment of the bookId — the
// AdminUI enforces a `<2-letter prefix>-<volume>-<short title>` shape
// (e.g. `fa-1-mission-friede`, `fa-10-mission-alle-fruechte`). Plain
// string sort puts "fa-10" right after "fa-1", so pull the number out
// and compare it numerically with a string-key fallback for ids that
// don't follow the pattern.
function volumeOf(id: string): number {
  const m = /^[a-z]+-(\d+)/i.exec(id)
  if (!m) return Number.POSITIVE_INFINITY
  const n = Number(m[1])
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

function booksOfSeries(seriesId: string): ApiBook[] {
  const list = state.all ?? Object.values(state.byId)
  return list
    .filter((b) => b.bookSeriesId === seriesId)
    .sort((a, b) => {
      const va = volumeOf(a.bookId)
      const vb = volumeOf(b.bookId)
      if (va !== vb) return va - vb
      return a.bookId < b.bookId ? -1 : a.bookId > b.bookId ? 1 : 0
    })
}

function nextBookInSeries(book: ApiBook): ApiBook | null {
  const siblings = booksOfSeries(book.bookSeriesId)
  if (!siblings.length) return null
  const idx = siblings.findIndex((b) => b.bookId === book.bookId)
  if (idx < 0 || idx >= siblings.length - 1) return null
  return siblings[idx + 1] ?? null
}

export const useApiBooks = () => {
  return {
    state: readonly(state),
    loadBook,
    loadAllBooks,
    booksOfSeries,
    nextBookInSeries,
    getById: (id: string): ApiBook | null => state.byId[id] ?? null
  }
}

export default useApiBooks
