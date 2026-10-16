// "Coloring books" (Ausmalbücher): each of their pages is a single picture meant to be opened in the coloring app. A book is
// one when its `kind` is 'coloring'. Books from before there was a kind are recognised by their category name set in the
// AdminUI (see `isColoringBook`).
export const COLORING_CATEGORY = 'Ausmahlbücher'

// Accept the user's spelling ("Ausmahlbücher") and the orthographically
// correct one ("Ausmalbücher"), case-insensitively, so a small editing slip
// in the AdminUI category name doesn't silently turn a coloring book back
// into a normal one. Normalize to NFC because the "ü" can be stored either
// pre-composed (U+00FC) or decomposed (u + U+0308) depending on the keyboard
// / OS that typed it — without this the two forms compare unequal.
const COLORING_CATEGORY_ALIASES = new Set(
  ['Ausmahlbücher', 'Ausmalbücher'].map((s) => s.normalize('NFC').toLowerCase())
)

export function isColoringCategory(category?: string | null): boolean {
  if (!category) return false
  return COLORING_CATEGORY_ALIASES.has(category.normalize('NFC').trim().toLowerCase())
}

// ── Pages of a coloring book ----------------------------------------------------------------

/** A coloring book: the kind says so; a book without a kind (an older one) is recognised by its category name. */
export function isColoringBook(book: { kind?: string | null; category?: string | null } | null | undefined): boolean {
  if (!book) return false
  return book.kind === 'coloring' || (book.kind !== 'story' && isColoringCategory(book.category))
}

/** `![Ausmalbild: Titel](https://…)` — how a coloring book of the old form stores a picture inside the story text. */
const PAGE_IMAGE = /!\[(Ausmalbild[^\]]*)\]\(([^)\s]+)\)/i

export interface ColoringBookPage {
  /** 1-based number among the coloring pages (the intro text page is not counted). */
  n: number
  /** The line art. */
  url: string
  title: string
  /** Bible passage of the picture. */
  reference: string
  /** Short text that belongs to the picture, if any. */
  text: string
}

interface RawPage {
  page?: number
  title?: string
  text?: string
  image?: string
  reference?: string
}

interface BookLike {
  localizations?: Record<string, { content?: unknown } | null | undefined>
}

/** The pictures of a page list, in order. A page has its picture in `image`; in the old form it is markdown inside the text. */
function parsePages(content: unknown): Omit<ColoringBookPage, 'n'>[] {
  const out: Omit<ColoringBookPage, 'n'>[] = []
  if (!Array.isArray(content)) return out
  for (const p of content as RawPage[]) {
    const text = typeof p?.text === 'string' ? p.text : ''
    const m = p?.image ? null : PAGE_IMAGE.exec(text)
    const url = p?.image || m?.[2]
    if (!url) continue
    const alt = m ? m[1]!.replace(/^Ausmalbild:?\s*/i, '').trim() : ''
    const [titlePart, ...refParts] = (p.title ?? '').split(' · ')
    out.push({
      url,
      title: (titlePart ?? '').trim() || alt,
      reference: (p.reference ?? '').trim() || refParts.join(' · ').trim(),
      text: m ? text.replace(PAGE_IMAGE, '').trim() : text.trim()
    })
  }
  return out
}

/**
 * The coloring pages of a book in the given language, in book order. Pages without a picture (an intro text) are skipped.
 * The pictures are the German ones; another language brings only its own words (matched by the picture), and a language
 * without any gets the German words. A language with its own pictures (old form) is used as it is.
 */
export function coloringPagesOfBook(book: BookLike, locale: string): ColoringBookPage[] {
  const loc = book.localizations ?? {}
  const de = parsePages(loc.de?.content)
  let list = de
  if (locale !== 'de') {
    const own = parsePages(loc[locale]?.content)
    if (own.length) {
      const matched = de.some((d) => own.some((o) => o.url === d.url))
      list = matched
        ? de.map((d) => {
            const o = own.find((x) => x.url === d.url)
            return o ? { url: d.url, title: o.title || d.title, reference: o.reference || d.reference, text: o.text || d.text } : d
          })
        : own
    }
  }
  return list.map((p, i) => ({ n: i + 1, ...p }))
}

/** The picture of a page of the reader (new form, or the old markdown form); empty for a page without picture. */
export function pageImageOf(p: { image?: string; text?: string } | null | undefined): string {
  if (!p) return ''
  if (p.image) return p.image
  const m = PAGE_IMAGE.exec(p.text ?? '')
  return m?.[2] ?? ''
}

/** What a coloring page shows besides its picture: title, Bible passage and text (the old form's text without the picture). */
export function pageCaptionOf(p: { title?: string; text?: string; image?: string; reference?: string }): { title: string; reference: string; text: string } {
  const [parsed] = parsePages([p])
  return parsed ? { title: parsed.title, reference: parsed.reference, text: parsed.text } : { title: '', reference: '', text: '' }
}
