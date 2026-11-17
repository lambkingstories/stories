/**
 * Stories without a net: which stories the device keeps, and the calls the screens need.
 *
 *  - `noteOpened(book)`: every story that is opened is remembered by itself (text and pictures lie in the book cache). The newest 40
 *    (and no more than ~150 MB) stay, the oldest go first. Stories on the "Gemerkt" list and stories pressed "for the road" stay.
 *  - `pin(book)` / `unpin(id)`: the button "Offline speichern". Says honestly whether it worked (`saved`, `full`, `error`).
 *  - `list()`: the stories that can be read now without a net, newest first. A broken entry is dropped.
 *
 * Everything stays on the device; nothing is sent anywhere. Every storage call is guarded, so a private window without IndexedDB
 * simply keeps nothing and the app behaves as before.
 *
 * `createOfflineStories` is the whole logic with its place of storage handed in (tests use a double); `useOfflineStories` is the one
 * the app uses.
 */
import { reactive } from 'vue'
import type { ApiBook } from '@/types/apiBook'
import { createIdbBookStore } from '@/use/useBookCache'
import { isBookLocked } from '@/use/useBookAccess'
import useModels from '@/use/useModels'
import {
  DEFAULT_LIMITS,
  canKeepOffline,
  estimateBookBytes,
  fitsHardLimit,
  isQuotaError,
  planEviction,
  type BookStore,
  type Limits,
  type OfflineMeta
} from '@/utils/offlineStories'

export type PinResult = 'saved' | 'full' | 'error' | 'unavailable'

export interface OfflineDeps {
  store: BookStore
  /** Stories that must never be removed by themselves (the "Gemerkt" list). */
  protectedIds?: () => readonly string[]
  /** The Plus rules: true when this story may not be read in full (stories are free today). */
  isLocked?: (book: ApiBook) => boolean
  now?: () => number
  limits?: Limits
}

export interface OfflineItem {
  book: ApiBook
  meta: OfflineMeta
}

export function createOfflineStories(deps: OfflineDeps) {
  const store = deps.store
  const limits = deps.limits ?? DEFAULT_LIMITS
  const now = deps.now ?? (() => Date.now())
  const isLocked = deps.isLocked ?? (() => false)
  const protectedNow = () => {
    try {
      return new Set(deps.protectedIds?.() ?? [])
    } catch {
      return new Set<string>()
    }
  }

  const state = reactive<{
    ready: boolean
    metas: Record<string, OfflineMeta>
    /** The stories that are being saved right now (the button shows a wait sign). */
    saving: Record<string, boolean>
  }>({ ready: false, metas: {}, saving: {} })

  // One thing at a time on the storage: opening a story and saving another must not trip over each other.
  let chain: Promise<unknown> = Promise.resolve()
  function queued<T>(job: () => Promise<T>): Promise<T> {
    const run = chain.then(job, job)
    chain = run.catch(() => undefined)
    return run
  }

  const keepable = (book: ApiBook | null | undefined) => canKeepOffline(book, book ? isLocked(book) : false)

  async function writeMeta(meta: OfflineMeta): Promise<boolean> {
    try {
      await store.putMeta(meta)
      state.metas[meta.bookId] = meta
      return true
    } catch {
      return false
    }
  }

  async function dropStory(bookId: string): Promise<void> {
    try {
      await store.removeBook(bookId)
    } catch {
      // the entry is forgotten in any case; what is left in the store is harmless
    }
    delete state.metas[bookId]
  }

  /** Removes what does not fit any more. `keep` are the stories that must stay in this round (the one that is open). */
  async function enforce(keep: Iterable<string> = []): Promise<void> {
    for (const id of planEviction(Object.values(state.metas), protectedNow(), limits, new Set(keep))) await dropStory(id)
  }

  async function doInit(): Promise<void> {
    if (state.ready) return
    let metas: OfflineMeta[] = []
    try {
      metas = await store.listMetas()
    } catch {
      metas = []
    }
    for (const m of metas) if (m && typeof m.bookId === 'string') state.metas[m.bookId] = m
    // stories that were cached before there was a list of kept stories: adopt them (once, with the time they were cached)
    try {
      for (const { book, cachedAt } of await store.listBooks()) {
        if (state.metas[book.bookId] || !keepable(book)) continue
        await writeMeta({ bookId: book.bookId, savedAt: cachedAt, lastUsedAt: cachedAt, pinned: false, bytes: estimateBookBytes(book) })
      }
    } catch {
      // nothing to adopt
    }
    state.ready = true
    await enforce()
  }

  const init = (): Promise<void> => queued(doInit)

  /** A story was opened (or fetched): it is kept from now on. */
  function noteOpened(book: ApiBook | null | undefined): Promise<void> {
    if (!book || !keepable(book)) return Promise.resolve()
    return queued(async () => {
      await doInit()
      const old = state.metas[book.bookId]
      const t = now()
      await writeMeta({
        bookId: book.bookId,
        savedAt: old?.savedAt ?? t,
        lastUsedAt: t,
        pinned: old?.pinned ?? false,
        bytes: old?.bytes || estimateBookBytes(book)
      })
      await enforce([book.bookId])
    })
  }

  /** The pictures of an opened story have arrived: now its size is known. */
  function refreshSize(bookId: string): Promise<void> {
    return queued(async () => {
      const meta = state.metas[bookId]
      if (!meta) return
      try {
        const book = await store.getBook(bookId)
        if (!book) return
        const bytes = estimateBookBytes(book) + (await store.blobBytes(bookId))
        await writeMeta({ ...meta, bytes })
        await enforce([bookId])
      } catch {
        // the old size stays
      }
    })
  }

  /** "Offline speichern": keeps this story (text and pictures) and never removes it by itself. */
  function pin(given: ApiBook | null | undefined): Promise<PinResult> {
    if (!given || !keepable(given)) return Promise.resolve('unavailable')
    // the screens hold the book inside a reactive proxy, which IndexedDB cannot store: a plain copy goes in
    let book: ApiBook
    try {
      book = JSON.parse(JSON.stringify(given)) as ApiBook
    } catch {
      return Promise.resolve('error')
    }
    const id = book.bookId
    state.saving[id] = true
    return queued(async (): Promise<PinResult> => {
      try {
        await doInit()
        const before = state.metas[id]
        const textBytes = estimateBookBytes(book)
        const others = Object.values(state.metas).filter((m) => m.bookId !== id)
        if (!fitsHardLimit(others, textBytes)) return 'full'
        try {
          await store.putBook(book)
        } catch (err) {
          return isQuotaError(err) ? 'full' : 'error'
        }
        const t = now()
        // first the text is safe (remembered), then the pictures come
        if (!before && !(await writeMeta({ bookId: id, savedAt: t, lastUsedAt: t, pinned: false, bytes: textBytes }))) return 'error'
        const result = await store.prefetch(book)
        if (result.full) {
          await enforce([id])
          return 'full'
        }
        // a picture that is missing on the server is missing online as well; only a net that failed makes the saving "not done"
        const netDown = typeof navigator !== 'undefined' && navigator.onLine === false
        if (result.failed > 0 && (result.stored === 0 || netDown)) return 'error'
        const bytes = textBytes + (await store.blobBytes(id).catch(() => 0))
        if (!fitsHardLimit(others, bytes)) return 'full'
        const saved = await writeMeta({ bookId: id, savedAt: before?.savedAt ?? t, lastUsedAt: t, pinned: true, bytes })
        if (!saved) return 'error'
        await enforce([id])
        return 'saved'
      } catch (err) {
        return isQuotaError(err) ? 'full' : 'error'
      } finally {
        delete state.saving[id]
      }
    })
  }

  /** The story is no longer "for the road"; it is still remembered (and goes when there is no more room). */
  function unpin(bookId: string): Promise<void> {
    return queued(async () => {
      const meta = state.metas[bookId]
      if (!meta || !meta.pinned) return
      await writeMeta({ ...meta, pinned: false })
      await enforce()
    })
  }

  /** The stories that can be read without a net, the last opened first. Entries that cannot be read are dropped on the way. */
  function list(): Promise<OfflineItem[]> {
    return queued(async () => {
      await doInit()
      const out: OfflineItem[] = []
      const metas = Object.values(state.metas).sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      for (const meta of metas) {
        let book: ApiBook | null = null
        try {
          book = await store.getBook(meta.bookId)
        } catch {
          book = null
        }
        if (book && keepable(book)) out.push({ book, meta })
        else await dropStory(meta.bookId)
      }
      return out
    })
  }

  return {
    state,
    init,
    noteOpened,
    refreshSize,
    pin,
    unpin,
    list,
    isStored: (bookId: string): boolean => !!state.metas[bookId],
    isPinned: (bookId: string): boolean => !!state.metas[bookId]?.pinned,
    isSaving: (bookId: string): boolean => !!state.saving[bookId],
    canKeep: keepable
  }
}

export type OfflineStories = ReturnType<typeof createOfflineStories>

let shared: OfflineStories | null = null

export const useOfflineStories = (): OfflineStories => {
  if (!shared) {
    const { watchListIds } = useModels()
    shared = createOfflineStories({
      store: createIdbBookStore(),
      protectedIds: () => watchListIds.value,
      isLocked: (book) => {
        const pages = book.localizations?.de?.content?.length ?? 0
        return isBookLocked(book.bookId, 'story', pages, book.freePages)
      }
    })
  }
  return shared
}

export default useOfflineStories
