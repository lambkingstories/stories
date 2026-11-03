/**
 * How much of a book may be seen without paying.
 *
 *   - Stories (and every book that is not a coloring book) are free in full, with reading aloud.
 *   - A coloring book: the first 2 pictures. The books in `FREE_COLORING_BOOKS` (Band 1) are free in full.
 *
 * The rest opens with the subscription (LambKing Plus) or when the single book was bought. All of this only
 * applies when `VITE_PREMIUM_TEASER=true` (see `usePremium`): while nothing can be bought yet, a book is
 * free in full, so nobody gets stuck in front of a lock they cannot open.
 */
import { PREMIUM_TEASER, hasBook } from '@/use/usePremium'

export const FREE_COLORING_PAGES = 2

/**
 * The coloring books that are free in full: Band 1 of the Buntstift series "Gott erschafft die Welt" and Band 1 of the series
 * for 9 to 12 "Die Schöpfung" (each the id in the backend, and the id of the copy that is built into the test app). A book can
 * also be made free in the AdminUI with its own number of free pictures.
 */
export const FREE_COLORING_BOOKS: readonly string[] = [
  'ba-02-gott-erschafft-die-welt',
  'ba-1-buntstift-schoepfung',
  'ba-11-schoepfung-gott-macht-die-welt',
  'lokal-912-schoepfung'
]

export type BookKind = 'story' | 'coloring'

/**
 * How many of `total` pages (pictures for a coloring book) are free for this kind of book. A coloring book can carry its own
 * number (`freePages`, set in the AdminUI); without one the rule of the app applies.
 */
export function freePageCount(kind: BookKind, total: number, own?: number | null): number {
  if (total <= 0) return 0
  if (kind === 'story') return total
  return Math.min(typeof own === 'number' && own >= 0 ? own : FREE_COLORING_PAGES, total)
}

/** Number of pages of this book the person may use right now (all of them when unlocked). */
export function allowedPages(bookId: string, kind: BookKind, total: number, own?: number | null): number {
  if (!PREMIUM_TEASER || FREE_COLORING_BOOKS.includes(bookId) || hasBook(bookId)) return total
  return freePageCount(kind, total, own)
}

export function isBookLocked(bookId: string, kind: BookKind, total: number, own?: number | null): boolean {
  return allowedPages(bookId, kind, total, own) < total
}
