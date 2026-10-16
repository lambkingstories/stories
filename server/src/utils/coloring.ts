// Coloring books (Ausmalbücher). A coloring book is a book with `kind: 'coloring'`; each page is one picture with its own
// fields (`image`, `title`, `reference`, optional `text`). Older books only have the category name "Ausmalbücher" and keep the
// picture as markdown inside the page text (`![Ausmalbild: Titel](url)`, the Bible passage after " · " in the title). These
// helpers read both forms, so a book in the old form keeps working until the migration has run.

const COLORING_CATEGORY_ALIASES = new Set(
  ['Ausmahlbücher', 'Ausmalbücher'].map((s) => s.normalize('NFC').toLowerCase())
)

/** The category name of the old form (the spelling with "h" and the correct one, in any case and any Unicode form of "ü"). */
export function isColoringCategory(category?: string | null): boolean {
  if (!category) return false
  return COLORING_CATEGORY_ALIASES.has(category.normalize('NFC').trim().toLowerCase())
}

export function isColoringBook(book: { kind?: string | null; category?: string | null }): boolean {
  return book.kind === 'coloring' || (book.kind !== 'story' && isColoringCategory(book.category))
}

export interface BookPage {
  page: number
  title?: string
  text?: string
  image?: string
  reference?: string
}

const PAGE_IMAGE = /!\[(Ausmalbild[^\]]*)\]\(([^)\s]+)\)/i

/** A page in the new form. Pages that already have an `image` are returned as they are; a page without picture stays a text page. */
export function normalizeColoringPage<T extends BookPage>(p: T): T {
  if (p.image) return { ...p, reference: p.reference ?? '' }
  const text = typeof p.text === 'string' ? p.text : ''
  const m = PAGE_IMAGE.exec(text)
  if (!m) return p
  const alt = m[1]!.replace(/^Ausmalbild:?\s*/i, '').trim()
  const [titlePart, ...refParts] = (p.title ?? '').split(' · ')
  return {
    ...p,
    image: m[2]!,
    title: (titlePart ?? '').trim() || alt,
    reference: refParts.join(' · ').trim(),
    text: text.replace(PAGE_IMAGE, '').trim()
  }
}

type Loc = { content?: BookPage[] } | null | undefined

/** The coloring pages of a book in the new form, in all languages. */
export function normalizeColoringBook<T>(book: T): T {
  if (!book || typeof book !== 'object') return book
  const b = book as unknown as { localizations?: Record<string, Loc> }
  if (!b.localizations) return book
  const localizations: Record<string, Loc> = {}
  for (const [lang, loc] of Object.entries(b.localizations)) {
    localizations[lang] =
      loc && Array.isArray(loc.content) ? { ...loc, content: loc.content.map((p) => normalizeColoringPage(p)) } : loc
  }
  return { ...book, localizations } as T
}

/**
 * The slim form of a book for the list: the text of the pages is left out of story books (the reader fetches the whole book
 * when it is opened). The pages of a coloring book stay complete: they are small and the coloring menu needs them.
 */
export function leanBook<T>(book: T): T {
  if (!book || typeof book !== 'object') return book
  const b = book as unknown as { kind?: string; category?: string; localizations?: Record<string, Loc> }
  if (isColoringBook(b)) return normalizeColoringBook(book)
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
