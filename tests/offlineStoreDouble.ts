/**
 * A small stand-in for the place where kept stories lie (the IndexedDB of `useBookCache`), for the tests of `useOfflineStories`.
 * It can be told to run out of room or to fail, to see how the logic behaves.
 */
import type { ApiBook } from '../src/types/apiBook'
import type { BookStore, OfflineMeta, PrefetchResult } from '../src/utils/offlineStories'

export class MemoryStore implements BookStore {
  books = new Map<string, { book: ApiBook; cachedAt: number }>()
  metas = new Map<string, OfflineMeta>()
  pictures = new Map<string, number>()
  removed: string[] = []

  /** What the next `prefetch` answers (default: two pictures of 1000 bytes arrive). */
  prefetchResult: PrefetchResult = { stored: 2, failed: 0, full: false }
  /** Bytes one fetched picture takes. */
  pictureBytes = 1000
  /** `putBook` runs out of room. */
  putBookFull = false
  /** Every call fails (like a private window without IndexedDB). */
  broken = false

  private guard() {
    if (this.broken) throw new Error('IndexedDB not available')
  }

  async listMetas() {
    this.guard()
    return [...this.metas.values()].map((m) => ({ ...m }))
  }

  async putMeta(meta: OfflineMeta) {
    this.guard()
    this.metas.set(meta.bookId, { ...meta })
  }

  async listBooks() {
    this.guard()
    return [...this.books.values()]
  }

  async getBook(bookId: string) {
    this.guard()
    return this.books.get(bookId)?.book ?? null
  }

  async putBook(book: ApiBook) {
    this.guard()
    if (this.putBookFull) {
      const err = new Error('The quota has been exceeded.')
      err.name = 'QuotaExceededError'
      throw err
    }
    // IndexedDB stores a copy of plain data; a reactive proxy of the screens cannot be copied (the real store would throw as well)
    this.books.set(book.bookId, { book: structuredClone(book), cachedAt: 1 })
  }

  async removeBook(bookId: string) {
    this.guard()
    this.removed.push(bookId)
    this.books.delete(bookId)
    this.metas.delete(bookId)
    this.pictures.delete(bookId)
  }

  async prefetch(book: ApiBook) {
    this.guard()
    const r = this.prefetchResult
    this.pictures.set(book.bookId, r.stored * this.pictureBytes)
    return { ...r }
  }

  async blobBytes(bookId: string) {
    this.guard()
    return this.pictures.get(bookId) ?? 0
  }
}

/** A whole story with some text pages. */
export function makeStory(id: string, over: Partial<ApiBook> = {}): ApiBook {
  return {
    bookId: id,
    author: 'Test',
    category: 'Geschichten',
    bookSeriesId: 'serie-a',
    releaseDate: '2026-01-01T00:00:00.000Z',
    updatedDate: '2026-01-01T00:00:00.000Z',
    badges: [],
    previewImage: `https://example.invalid/${id}.webp`,
    localizations: {
      de: {
        title: `Titel ${id}`,
        shortDescription: '',
        description: '',
        content: [
          { page: 1, title: 'Eins', text: 'Es war einmal ein kleines Lamm.' },
          { page: 2, title: 'Zwei', text: 'Das Lamm ging nach Hause.' }
        ]
      }
    },
    isPublished: true,
    ...over
  }
}
