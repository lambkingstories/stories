/**
 * What the child painted on a page of a coloring book that is locked (Anton 22.11.2026): it is not shown while the page is locked (no Plus, book not bought), and it is kept on
 * the device, so it is back when Plus or the book comes again. Otherwise one month of Plus would be enough to paint a little in every book and keep seeing it afterwards.
 *
 * A page is locked when it comes after the free pictures of its book (see `useBookAccess`). Nothing is deleted: the lists of the screens only leave the picture out
 * (`visibleArtworks`), the backup of the pictures (`useArtworkBackup`) still takes all of them.
 */
import { PREMIUM_TEASER, hasBook } from '@/use/usePremium'
import { FREE_COLORING_BOOKS, FREE_COLORING_PAGES } from '@/use/useBookAccess'
import type { ArtworkMeta } from '@/use/useArtworks'

const KEY = 'lk-book-free-pages-v1'

function readMap(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown
    return raw && typeof raw === 'object' ? (raw as Record<string, number>) : {}
  } catch {
    return {}
  }
}

/** A book can have its own number of free pictures (the AdminUI): the screen of the book tells it here, so the lists of the other screens know it too. */
export function rememberFreePages(bookId: string, own: number | null | undefined) {
  try {
    const map = readMap()
    if (typeof own === 'number' && own >= 0) map[bookId] = own
    else delete map[bookId]
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // no storage: the rule of the app (one free picture) applies
  }
}

/** True when this painting belongs to a locked page of a coloring book (a blank sheet or a free page is never locked). */
export function isArtworkLocked(meta: Pick<ArtworkMeta, 'bookId' | 'bookPage'>): boolean {
  if (!PREMIUM_TEASER) return false
  const { bookId, bookPage } = meta
  if (!bookId || !bookPage) return false
  if (FREE_COLORING_BOOKS.includes(bookId) || hasBook(bookId)) return false
  const own = readMap()[bookId]
  return bookPage > (typeof own === 'number' ? own : FREE_COLORING_PAGES)
}

/** The paintings the screens show: the ones on locked pages are left out. */
export function visibleArtworks<T extends Pick<ArtworkMeta, 'bookId' | 'bookPage'>>(list: T[]): T[] {
  return list.filter((a) => !isArtworkLocked(a))
}
