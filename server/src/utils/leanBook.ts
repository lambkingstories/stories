// The slim form of a book for the list (`GET /api/books?lean=1`): the text of the story pages is left out, because it is about
// three quarters of the list (the app fetches the whole book with `GET /api/book/:id` when a story is opened). A slim book carries
// `lean: true` so that the app knows its pages are not complete.
//
// Coloring books (category "Ausmalbücher" / "Ausmahlbücher") stay complete: their pages are small and the coloring menu needs the
// pictures that sit inside the page text.

const COLORING_CATEGORY_ALIASES = new Set(['Ausmahlbücher', 'Ausmalbücher'].map((s) => s.normalize('NFC').toLowerCase()))

export function isColoringCategory(category?: string | null): boolean {
  if (!category) return false
  return COLORING_CATEGORY_ALIASES.has(category.normalize('NFC').trim().toLowerCase())
}

type Page = { page?: number; title?: string }
type Loc = { content?: Page[] } | null | undefined

export function leanBook<T>(book: T): T {
  if (!book || typeof book !== 'object') return book
  const b = book as unknown as { kind?: string; category?: string; localizations?: Record<string, Loc> }
  if (b.kind === 'coloring' || (b.kind !== 'story' && isColoringCategory(b.category))) return book
  if (!b.localizations) return book
  const localizations: Record<string, Loc> = {}
  for (const [lang, loc] of Object.entries(b.localizations)) {
    localizations[lang] =
      loc && Array.isArray(loc.content)
        ? { ...loc, content: loc.content.map((p) => ({ page: p.page, title: p.title ?? '' })) }
        : loc
  }
  return { ...book, localizations, lean: true } as T
}
