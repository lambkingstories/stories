/**
 * Stories without a net: the rules (pure, no storage in here).
 *
 * The device keeps the text and the pictures of the stories a child has opened, so they can be read on a train or in a plane.
 * Two kinds of kept stories:
 *  - "remembered" by themselves: every story that was opened. They stay as long as there is room (the newest ones win, see `planEviction`).
 *  - "for the road" (`pinned`): the child (or a parent) pressed "Offline speichern". These never fly out by themselves.
 * Stories on the "Gemerkt" list are protected like pinned ones.
 *
 * Only stories are kept (not coloring books, not printed store books) and only what may be read for free; reading aloud is a different
 * thing (audio, needs a net).
 */
import type { ApiBook } from '@/types/apiBook'
import { readingAreaOf } from '@/utils/readingAreas'
import { isHiddenBookOrSeries } from '@/data/hiddenBooks'

/** How many remembered stories stay on the device at most (pinned and "Gemerkt" ones do not count against the oldest-first rule). */
export const MAX_STORIES = 40
/** How much room the remembered stories may take (text and pictures). */
export const MAX_BYTES = 150 * 1024 * 1024
/** A hard upper bound for everything together, pinned ones included: beyond it "for the road" says "full". */
export const HARD_MAX_BYTES = 300 * 1024 * 1024

/** What the device knows about one kept story (the text and the pictures lie in the book cache). */
export interface OfflineMeta {
  bookId: string
  /** When the story was kept the first time (ms). */
  savedAt: number
  /** When it was opened or saved last (ms): the oldest one goes first. */
  lastUsedAt: number
  /** Pressed "for the road": never removed by itself. */
  pinned: boolean
  /** Text and pictures together (estimated until the pictures are counted). */
  bytes: number
}

export interface PrefetchResult {
  stored: number
  failed: number
  /** The device had no more room. */
  full: boolean
}

/**
 * The place where kept stories lie. The real one is the IndexedDB of `useBookCache`; tests use a small double.
 * Every method may throw (private window, no room); the callers catch.
 */
export interface BookStore {
  listMetas(): Promise<OfflineMeta[]>
  putMeta(meta: OfflineMeta): Promise<void>
  /** All whole books that lie in the cache (to adopt what was cached before kept stories existed). */
  listBooks(): Promise<Array<{ book: ApiBook; cachedAt: number }>>
  getBook(bookId: string): Promise<ApiBook | null>
  putBook(book: ApiBook): Promise<void>
  /** Removes the book, its pictures and its meta. */
  removeBook(bookId: string): Promise<void>
  /** Fetches the pictures of the book into the cache (needs a net). */
  prefetch(book: ApiBook): Promise<PrefetchResult>
  /** Size of the pictures kept for the book. */
  blobBytes(bookId: string): Promise<number>
}

export interface Limits {
  maxStories: number
  maxBytes: number
}

export const DEFAULT_LIMITS: Limits = { maxStories: MAX_STORIES, maxBytes: MAX_BYTES }

/** How many text pages a story has in a language that has text. */
function textPages(book: ApiBook): number {
  let most = 0
  for (const loc of [book.localizations?.de, book.localizations?.en]) {
    const pages = Array.isArray(loc?.content) ? loc.content : []
    const n = pages.filter((p) => typeof p?.text === 'string' && p.text.trim().length > 0).length
    if (n > most) most = n
  }
  return most
}

/** A whole book (not the slim list entry) with at least one page of text: only this can be read without a net. */
export function isReadableOffline(book: unknown): book is ApiBook {
  if (!book || typeof book !== 'object') return false
  const b = book as ApiBook
  if (typeof b.bookId !== 'string' || !b.bookId) return false
  if (b.lean) return false
  return textPages(b) > 0
}

/**
 * May this book be kept for reading without a net? Only stories (not coloring books, not store books), not hidden ones, not
 * locked ones (`locked` is the answer of the Plus rules; stories are free today, but the rule stays in one place).
 */
export function canKeepOffline(book: ApiBook | null | undefined, locked = false): boolean {
  if (!book || locked) return false
  if (isHiddenBookOrSeries(book)) return false
  if (readingAreaOf(book) !== 'stories') return false
  return isReadableOffline(book)
}

/** Rough size of a book without its pictures. */
export function estimateBookBytes(book: ApiBook): number {
  try {
    return JSON.stringify(book).length * 2
  } catch {
    return 0
  }
}

/** The device ran out of room (the browsers name it differently). */
export function isQuotaError(err: unknown): boolean {
  const e = err as { name?: string; code?: number; message?: string } | null
  if (!e) return false
  return e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || /quota/i.test(e.message ?? '')
}

/**
 * Which kept stories must go so that the limits hold again. Protected stories (pinned ones, "Gemerkt" ones) never go, and neither does
 * a story in `keepIds` (the one that is open right now); that one counts like the others, though. Of the rest the oldest go first,
 * until the count and the size are right.
 */
export function planEviction(
  metas: readonly OfflineMeta[],
  protectedIds: ReadonlySet<string>,
  limits: Limits = DEFAULT_LIMITS,
  keepIds: ReadonlySet<string> = new Set()
): string[] {
  let bytes = metas.reduce((sum, m) => sum + Math.max(0, m.bytes || 0), 0)
  // the count rule is about the stories that are only remembered; pinned and "Gemerkt" ones do not use it up
  const remembered = metas.filter((m) => !m.pinned && !protectedIds.has(m.bookId))
  let count = remembered.length
  const candidates = remembered
    .filter((m) => !keepIds.has(m.bookId))
    .sort((a, b) => a.lastUsedAt - b.lastUsedAt || a.bookId.localeCompare(b.bookId))
  const gone: string[] = []
  for (const m of candidates) {
    if (count <= limits.maxStories && bytes <= limits.maxBytes) break
    gone.push(m.bookId)
    count -= 1
    bytes -= Math.max(0, m.bytes || 0)
  }
  return gone
}

/** Would one more story of `extra` bytes still fit under the hard limit? */
export function fitsHardLimit(metas: readonly OfflineMeta[], extra: number, hardMax = HARD_MAX_BYTES): boolean {
  return metas.reduce((sum, m) => sum + Math.max(0, m.bytes || 0), 0) + Math.max(0, extra) <= hardMax
}
