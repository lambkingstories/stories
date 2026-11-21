/**
 * Which language the cover and the texts of a book are in, when that is not the language of the screen (Anton 21.11.2026: someone who reads English may still want the German
 * coloring book, so it is shown with a flag instead of being hidden). A book has German always; it has English when the server holds an English version. For the content every
 * language but German counts as English (`contentLocale`).
 */
import { contentLocale, type ContentLocale } from '@/utils/contentLocale'

/** What is needed of a book (also a read-only one): the versions it has and its cover. */
export interface BookLanguageInfo {
  readonly localizations?: { readonly de?: unknown; readonly en?: unknown }
  readonly previewImage?: string | { readonly de?: string; readonly en?: string }
}

/** `'de'` / `'en'` when the book (cover and texts) is in that language and the screen is not; `null` when it fits the screen. */
export function bookFlagLanguage(book: BookLanguageInfo | null | undefined, screenLocale: string | undefined | null): ContentLocale | null {
  if (!book) return null
  const want = contentLocale(screenLocale)
  if (want === 'en') {
    if (!book.localizations?.en) return 'de'
    const image = book.previewImage
    // the server has English texts but only a German cover: the cover is what the child sees first
    if (image && typeof image === 'object' && !image.en && image.de) return 'de'
    return null
  }
  return book.localizations?.de ? null : book.localizations?.en ? 'en' : null
}
