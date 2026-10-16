// Helpers for the pages of a coloring book (Ausmalbuch) in the editor. Pure functions, so they can be tested without a browser.
import type { BookPage } from '@/types'

/** Files in the order a person reads them: "bild2.png" before "bild10.png". */
export function sortFilesNaturally<T extends { name: string }>(files: T[]): T[] {
  return [...files].sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true, sensitivity: 'base' }))
}

/** A first title from the file name ("003_arche-baut.png" → "Arche baut"); empty when the name says nothing. */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, '').replace(/^[\d\s._-]+/, '').replace(/[_-]+/g, ' ').trim()
  if (!base || /^\d+$/.test(base)) return ''
  return base.charAt(0).toUpperCase() + base.slice(1)
}

/** The pages with numbers 1…n in their order again (after moving or removing one). */
export function renumber(pages: BookPage[]): BookPage[] {
  return pages.map((p, i) => ({ ...p, page: i + 1 }))
}

/** A page moved by `delta` places (−1 up, +1 down); the list stays as it is when that is not possible. */
export function movePage(pages: BookPage[], index: number, delta: number): BookPage[] {
  const to = index + delta
  if (index < 0 || index >= pages.length || to < 0 || to >= pages.length) return pages
  const next = [...pages]
  const [item] = next.splice(index, 1)
  next.splice(to, 0, item!)
  return renumber(next)
}

export function removePage(pages: BookPage[], index: number): BookPage[] {
  if (index < 0 || index >= pages.length) return pages
  return renumber(pages.filter((_, i) => i !== index))
}

export function newColoringPage(n: number, image: string, title = ''): BookPage {
  return { page: n, title, text: '', image, reference: '' }
}

/**
 * The page of a language that belongs to a German page. They are matched by the picture (every language page carries the same
 * picture address), so moving or removing German pages cannot mix up the translations.
 */
export function pageOf(pages: BookPage[] | undefined, de: BookPage): BookPage | undefined {
  return pages?.find((p) => p.image && p.image === de.image)
}

/** `pages` with a field of the page that belongs to `de` set; the page is created when the language does not have it yet. */
export function setPageField(pages: BookPage[], de: BookPage, field: 'title' | 'reference' | 'text', value: string): BookPage[] {
  const exists = pageOf(pages, de)
  const next = exists
    ? pages.map((p) => (p === exists ? { ...p, page: de.page, [field]: value } : p))
    : [...pages, { page: de.page, title: '', text: '', image: de.image ?? '', reference: '', [field]: value }]
  return next
}

/** The pages of another language in the order of the German book, without pages whose German picture is gone. */
export function alignToGerman(pages: BookPage[], dePages: BookPage[]): BookPage[] {
  const out: BookPage[] = []
  for (const de of dePages) {
    const own = pageOf(pages, de)
    if (own) out.push({ ...own, page: de.page })
  }
  return out
}
