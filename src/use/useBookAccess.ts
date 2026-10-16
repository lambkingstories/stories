/**
 * How much of a book may be seen without paying.
 *
 *   - A coloring book (Ausmalbuch): the first 5 pictures.
 *   - Every other book: the first 15 % of its text, cut at the end of a paragraph (at least one paragraph).
 *     Most stories are one long page, so the text counts, not the pages.
 *
 * The rest opens with the subscription (LambKing Plus) or when the single book was bought. All of this only
 * applies when `VITE_PREMIUM_TEASER=true` (see `usePremium`): while nothing can be bought yet, a book is
 * free in full, so nobody gets stuck in front of a lock they cannot open.
 */
import { PREMIUM_TEASER, hasBook } from '@/use/usePremium'

export const FREE_COLORING_PAGES = 5
export const FREE_STORY_SHARE = 0.15

export type BookKind = 'story' | 'coloring'

/**
 * How many of `total` pages (pictures for a coloring book) are free for this kind of book. A coloring book can carry its own
 * number (`freePages`, set in the AdminUI); without one the rule of the app applies.
 */
export function freePageCount(kind: BookKind, total: number, own?: number | null): number {
  if (total <= 0) return 0
  if (kind === 'coloring') return Math.min(typeof own === 'number' && own >= 0 ? own : FREE_COLORING_PAGES, total)
  return Math.min(total, Math.max(1, Math.ceil(total * FREE_STORY_SHARE)))
}

/** Number of pages of this book the person may use right now (all of them when unlocked). */
export function allowedPages(bookId: string, kind: BookKind, total: number, own?: number | null): number {
  if (!PREMIUM_TEASER || hasBook(bookId)) return total
  return freePageCount(kind, total, own)
}

export function isBookLocked(bookId: string, kind: BookKind, total: number, own?: number | null): boolean {
  return allowedPages(bookId, kind, total, own) < total
}

/** True while this book is shown only in part (limits are on and the book is not bought). */
export function isLimited(bookId: string): boolean {
  return PREMIUM_TEASER && !hasBook(bookId)
}

/**
 * The free start of a story: the first `share` of the text of all pages together, ending with a whole paragraph.
 * `cut` says whether anything was left out. The pages that are not reached are dropped.
 */
export function previewTexts(texts: string[], share = FREE_STORY_SHARE): { texts: string[]; cut: boolean } {
  const total = texts.reduce((n, t) => n + t.length, 0)
  if (total === 0) return { texts, cut: false }
  const limit = Math.ceil(total * share)
  let used = 0
  const out: string[] = []
  for (let i = 0; i < texts.length; i++) {
    if (used >= limit) return { texts: out, cut: true }
    const paragraphs = texts[i]!.split(/\n{2,}/)
    const kept: string[] = []
    for (let k = 0; k < paragraphs.length; k++) {
      kept.push(paragraphs[k]!)
      used += paragraphs[k]!.length
      if (used >= limit) {
        out.push(kept.join('\n\n'))
        return { texts: out, cut: k < paragraphs.length - 1 || i < texts.length - 1 }
      }
    }
    out.push(kept.join('\n\n'))
  }
  return { texts: out, cut: false }
}
