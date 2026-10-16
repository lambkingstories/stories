// "Coloring books" (Ausmalbücher) carry this category. Their pages are single
// images that render full-bleed in the iPhone preview / reader. Detection
// mirrors the app/website helper.
export const COLORING_CATEGORY = 'Ausmahlbücher'

// Normalize to NFC so a decomposed "ü" (u + U+0308) matches the pre-composed
// form (U+00FC) — see the app-side helper for the full rationale.
const COLORING_CATEGORY_ALIASES = new Set(
  ['Ausmahlbücher', 'Ausmalbücher'].map((s) => s.normalize('NFC').toLowerCase())
)

export function isColoringCategory(category?: string | null): boolean {
  if (!category) return false
  return COLORING_CATEGORY_ALIASES.has(category.normalize('NFC').trim().toLowerCase())
}

/** A coloring book: the kind says so; books without a kind (older ones) are recognised by their category. */
export function isColoringBook(book: { kind?: string | null; category?: string | null }): boolean {
  return book.kind === 'coloring' || (book.kind !== 'story' && isColoringCategory(book.category))
}
