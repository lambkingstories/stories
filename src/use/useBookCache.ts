/**
 * Offline-first cache for books: book metadata (JSON) + media blobs (images,
 * audio, attachments) keyed by their absolute URL. Built on IndexedDB so it
 * works unchanged across Electron, the Surge web build, and the future Tauri
 * iOS/Android targets without touching Node fs or Electron IPC.
 *
 * Two object stores:
 *   books   { bookId, updatedDate, book: ApiBook, cachedAt }
 *   blobs   { url, blob, contentType, cachedAt, bookId? }
 *
 * Blobs are returned as `blob:` object URLs the caller can drop straight into
 * <img src>, <audio src>, or <a href>. Object URLs created via `getBlobUrl`
 * live until `releaseBlobUrl` is called — callers that render them in a view
 * should revoke on unmount to avoid leaking during long sessions.
 */
import type { ApiBook } from '@/types/apiBook'
import { pickLocalizedImage } from '@/types/apiBook'
import { isQuotaError } from '@/utils/offlineStories'
import type { BookStore, OfflineMeta, PrefetchResult } from '@/utils/offlineStories'

const DB_NAME = 'kanaan-book-cache'
// 2: the store `meta` (which stories are kept for reading without a net, see `useOfflineStories`)
const DB_VERSION = 2
const STORE_BOOKS = 'books'
const STORE_BLOBS = 'blobs'
const STORE_META = 'meta'

interface CachedBookRecord {
  bookId: string
  updatedDate: string
  book: ApiBook
  cachedAt: number
}

interface CachedBlobRecord {
  url: string
  blob: Blob
  contentType: string
  cachedAt: number
  bookId?: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this environment'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'bookId' })
      }
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'bookId' })
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        const blobs = db.createObjectStore(STORE_BLOBS, { keyPath: 'url' })
        blobs.createIndex('bookId', 'bookId', { unique: false })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      // another tab wants to change the database: let go, the next call opens it again
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    req.onerror = () => reject(req.error ?? new Error('Failed to open cache DB'))
    req.onblocked = () => reject(new Error('Cache DB is blocked by another tab'))
  }).catch((err) => {
    // do not keep a failed attempt for good: a later call may succeed (e.g. after the other tab closed)
    dbPromise = null
    throw err
  })
  dbPromise = opening
  return opening
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const req = fn(transaction.objectStore(store))
        if (mode === 'readwrite') {
          // a write counts when the transaction is complete: "no room left" shows up only as an abort of the transaction
          transaction.oncomplete = () => resolve(req.result as T)
          transaction.onabort = () => reject(transaction.error ?? req.error ?? new Error(`IDB write aborted on ${store}`))
          transaction.onerror = () => reject(transaction.error ?? req.error ?? new Error(`IDB op failed on ${store}`))
          return
        }
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error ?? new Error(`IDB op failed on ${store}`))
      })
  )
}

async function getCachedBook(bookId: string): Promise<CachedBookRecord | undefined> {
  try {
    return await tx<CachedBookRecord | undefined>(STORE_BOOKS, 'readonly', (s) =>
      s.get(bookId) as IDBRequest<CachedBookRecord | undefined>
    )
  } catch {
    return undefined
  }
}

async function putCachedBook(book: ApiBook): Promise<void> {
  const rec: CachedBookRecord = {
    bookId: book.bookId,
    updatedDate: book.updatedDate ?? book.updatedAt ?? new Date(0).toISOString(),
    book,
    cachedAt: Date.now()
  }
  try {
    await tx<IDBValidKey>(STORE_BOOKS, 'readwrite', (s) => s.put(rec))
  } catch {
    // best-effort — swallow storage errors (private mode, quota, etc.)
  }
}

/** Like `putCachedBook`, but lets the error out (the caller wants to know that there was no room). */
async function putBookStrict(book: ApiBook): Promise<void> {
  const rec: CachedBookRecord = {
    bookId: book.bookId,
    updatedDate: book.updatedDate ?? book.updatedAt ?? new Date(0).toISOString(),
    book,
    cachedAt: Date.now()
  }
  await tx<IDBValidKey>(STORE_BOOKS, 'readwrite', (s) => s.put(rec))
}

async function getCachedBlob(url: string): Promise<CachedBlobRecord | undefined> {
  try {
    return await tx<CachedBlobRecord | undefined>(STORE_BLOBS, 'readonly', (s) =>
      s.get(url) as IDBRequest<CachedBlobRecord | undefined>
    )
  } catch {
    return undefined
  }
}

/** Keeps a picture; the answer says whether it worked (`full`: the device has no more room). */
async function putCachedBlob(url: string, blob: Blob, bookId?: string): Promise<'ok' | 'full' | 'error'> {
  const rec: CachedBlobRecord = {
    url,
    blob,
    contentType: blob.type || 'application/octet-stream',
    cachedAt: Date.now(),
    bookId
  }
  try {
    await tx<IDBValidKey>(STORE_BLOBS, 'readwrite', (s) => s.put(rec))
    return 'ok'
  } catch (err) {
    // we just re-fetch next time
    return isQuotaError(err) ? 'full' : 'error'
  }
}

async function deleteBlobsForBook(bookId: string): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_BLOBS, 'readwrite')
      const store = transaction.objectStore(STORE_BLOBS)
      const idx = store.index('bookId')
      const req = idx.openCursor(IDBKeyRange.only(bookId))
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      req.onerror = () => reject(req.error ?? new Error('Failed to purge blobs'))
    })
  } catch {
    // ignore
  }
}

/**
 * Return a `blob:` object URL for the given absolute URL, fetching and caching
 * the bytes on first miss. On fetch failure falls back to the original URL so
 * the UI still tries to load it directly.
 */
export async function cacheUrlToBlobUrl(url: string, bookId?: string): Promise<string> {
  if (!url) return url
  // Only absolute http(s) URLs are worth caching. Relative paths and blob:
  // URLs are returned as-is.
  if (!/^https?:\/\//i.test(url)) return url
  const hit = await getCachedBlob(url)
  if (hit) return URL.createObjectURL(hit.blob)
  try {
    const res = await fetch(url)
    if (!res.ok) return url
    const blob = await res.blob()
    await putCachedBlob(url, blob, bookId)
    return URL.createObjectURL(blob)
  } catch {
    return url
  }
}

/**
 * The pictures of a book that are worth keeping. The sound (the read-aloud audio is a Plus feature and only plays with a net) and the
 * big download files are not kept, only text pictures and covers.
 */
function collectBookUrls(book: ApiBook): string[] {
  const out = new Set<string>()
  const push = (v?: string) => {
    if (v && /^https?:\/\//i.test(v)) out.add(v)
  }
  // coverImage / previewImage are localized — collect both locales so the
  // offline cache covers either reading direction.
  push(pickLocalizedImage(book.coverImage, 'de'))
  push(pickLocalizedImage(book.coverImage, 'en'))
  push(pickLocalizedImage(book.previewImage, 'de'))
  push(pickLocalizedImage(book.previewImage, 'en'))
  push(book.contentCoverImage?.de)
  push(book.contentCoverImage?.en)
  for (const a of book.attachments ?? []) {
    push(a?.previewImage)
    // a picture that is an attachment (a coloring page) is kept; a PDF or another download file is not
    if (a?.data && /\.(webp|png|jpe?g|gif|svg)(\?|$)/i.test(a.data)) push(a.data)
  }
  const IMG_RE = /!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src=["']([^"']+)["']/gi
  for (const loc of [book.localizations?.de, book.localizations?.en]) {
    for (const page of loc?.content ?? []) {
      const text = page?.text ?? ''
      for (const m of text.matchAll(IMG_RE)) push(m[1] ?? m[2])
    }
  }
  return [...out]
}

/** Fetches every picture of the book that is not on the device yet. Never throws; the result says how it went. */
const prefetching = new Map<string, Promise<PrefetchResult>>()

function prefetchBookBlobs(book: ApiBook): Promise<PrefetchResult> {
  // the same book asked twice at once (opened, then refreshed) is fetched once
  const running = prefetching.get(book.bookId)
  if (running) return running
  const job = fetchBookBlobs(book).finally(() => prefetching.delete(book.bookId))
  prefetching.set(book.bookId, job)
  return job
}

async function fetchBookBlobs(book: ApiBook): Promise<PrefetchResult> {
  const urls = collectBookUrls(book)
  const out: PrefetchResult = { stored: 0, failed: 0, full: false }
  await Promise.allSettled(
    urls.map(async (u) => {
      try {
        const hit = await getCachedBlob(u)
        if (hit) {
          out.stored += 1
          return
        }
        const res = await fetch(u)
        if (!res.ok) {
          out.failed += 1
          return
        }
        const blob = await res.blob()
        const state = await putCachedBlob(u, blob, book.bookId)
        if (state === 'ok') out.stored += 1
        else {
          out.failed += 1
          if (state === 'full') out.full = true
        }
      } catch {
        out.failed += 1
      }
    })
  )
  return out
}

/**
 * A picture that is already on the device, as a `blob:` address; an empty string when it is not (no fetch, no net needed).
 * The caller lets go of it with `releaseBlobUrl`.
 */
export async function cachedBlobUrl(url: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return ''
  const hit = await getCachedBlob(url)
  return hit ? URL.createObjectURL(hit.blob) : ''
}

async function listAllBooks(): Promise<Array<{ book: ApiBook; cachedAt: number }>> {
  const rows = await tx<CachedBookRecord[]>(STORE_BOOKS, 'readonly', (s) => s.getAll() as IDBRequest<CachedBookRecord[]>)
  return (rows ?? []).filter((r) => r && r.book).map((r) => ({ book: r.book, cachedAt: r.cachedAt || 0 }))
}

async function sumBlobBytes(bookId: string): Promise<number> {
  const db = await openDb()
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(STORE_BLOBS, 'readonly')
    const req = transaction.objectStore(STORE_BLOBS).index('bookId').openCursor(IDBKeyRange.only(bookId))
    let sum = 0
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        sum += (cursor.value as CachedBlobRecord).blob?.size ?? 0
        cursor.continue()
      } else resolve(sum)
    }
    req.onerror = () => reject(req.error ?? new Error('Failed to count blobs'))
  })
}

/**
 * The place where kept stories lie (see `useOfflineStories`): the book, its pictures and one small record that says since when and how
 * big. Everything here may throw (no IndexedDB in a private window, no room); the callers catch.
 */
export function createIdbBookStore(): BookStore {
  return {
    listMetas: async () => (await tx<OfflineMeta[]>(STORE_META, 'readonly', (s) => s.getAll() as IDBRequest<OfflineMeta[]>)) ?? [],
    putMeta: async (meta) => {
      await tx<IDBValidKey>(STORE_META, 'readwrite', (s) => s.put(meta))
    },
    listBooks: listAllBooks,
    getBook: async (bookId) => (await getCachedBook(bookId))?.book ?? null,
    putBook: putBookStrict,
    removeBook: async (bookId) => {
      await deleteBlobsForBook(bookId)
      await tx<undefined>(STORE_BOOKS, 'readwrite', (s) => s.delete(bookId) as IDBRequest<undefined>)
      await tx<undefined>(STORE_META, 'readwrite', (s) => s.delete(bookId) as IDBRequest<undefined>)
    },
    prefetch: prefetchBookBlobs,
    blobBytes: sumBlobBytes
  }
}

export const useBookCache = () => {
  /**
   * Check if the cached copy of `bookId` is up-to-date vs. the freshly fetched
   * `updatedDate`. If stale (or missing), the caller should re-fetch and
   * `save()` it. Returns the cached book on fresh-hit so the caller can skip
   * the network round-trip for blobs entirely.
   */
  async function getIfFresh(bookId: string, remoteUpdatedDate: string): Promise<ApiBook | null> {
    const hit = await getCachedBook(bookId)
    if (!hit) return null
    const localMs = Date.parse(hit.updatedDate)
    const remoteMs = Date.parse(remoteUpdatedDate)
    if (!Number.isFinite(localMs) || !Number.isFinite(remoteMs)) return null
    return localMs >= remoteMs ? hit.book : null
  }

  async function getCached(bookId: string): Promise<ApiBook | null> {
    const hit = await getCachedBook(bookId)
    return hit?.book ?? null
  }

  async function saveBook(book: ApiBook): Promise<void> {
    await putCachedBook(book)
  }

  async function invalidateBookBlobs(bookId: string): Promise<void> {
    await deleteBlobsForBook(bookId)
  }

  /**
   * Background-prefetch every media URL referenced by the book so the reader
   * works offline. Failures are ignored — if the network dies mid-prefetch,
   * the reader falls back to streaming.
   */
  async function prefetchBlobs(book: ApiBook): Promise<PrefetchResult> {
    return prefetchBookBlobs(book)
  }

  async function getBlobUrl(url: string, bookId?: string): Promise<string> {
    return cacheUrlToBlobUrl(url, bookId)
  }

  function releaseBlobUrl(u?: string | null): void {
    if (u && u.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(u)
      } catch {
        // ignore
      }
    }
  }

  return {
    getIfFresh,
    getCached,
    saveBook,
    invalidateBookBlobs,
    prefetchBlobs,
    getBlobUrl,
    releaseBlobUrl
  }
}

export default useBookCache
