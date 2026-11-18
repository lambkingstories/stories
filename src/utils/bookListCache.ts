/**
 * The list of all books, kept on the device between two starts, so that the shelves are there at once and the net only refreshes them
 * (stale while revalidate). The list is slim (no story text, see `slimBook`): about 0.6 MB, even when an old server sent the whole texts.
 * An own small IndexedDB, apart from the book cache (`useBookCache`), so that neither touches the other's version.
 */
import type { ApiBook } from '@/types/apiBook'
import { isColoringBook } from '@/utils/coloringBook'

const DB_NAME = 'lk-book-list'
const STORE = 'list'
const KEY = 'all'

interface ListRecord {
  key: string
  savedAt: number
  books: ApiBook[]
}

/**
 * A story book without the text of its pages and marked `lean` (the same as the server's `?lean=1`). Coloring books stay complete, their
 * pages hold the pictures. A book that is already lean is returned as it is.
 */
export function slimBook(book: ApiBook): ApiBook {
  if (book.lean || isColoringBook(book)) return book
  const localizations: Record<string, unknown> = {}
  for (const [lang, loc] of Object.entries(book.localizations ?? {})) {
    const l = loc as { content?: Array<{ page: number; title: string }> } | null | undefined
    localizations[lang] = l && Array.isArray(l.content) ? { ...l, content: l.content.map((p) => ({ page: p.page, title: p.title ?? '', text: '' })) } : l
  }
  return { ...book, localizations, lean: true } as unknown as ApiBook
}

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not available'))
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Could not open the list cache'))
    req.onblocked = () => reject(new Error('The list cache is blocked'))
  }).catch((err) => {
    dbPromise = null
    throw err
  })
  return dbPromise
}

/** The books of the last successful list, or null when there is none (never throws). */
export async function readBookList(): Promise<{ books: ApiBook[]; savedAt: number } | null> {
  try {
    const db = await open()
    return await new Promise((resolve) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
      req.onsuccess = () => {
        const rec = req.result as ListRecord | undefined
        resolve(rec && Array.isArray(rec.books) && rec.books.length ? { books: rec.books, savedAt: rec.savedAt } : null)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/** Keeps the list (slim). A full device or a private window only means that the next start waits for the net, as before. */
export async function writeBookList(books: ApiBook[]): Promise<void> {
  try {
    const db = await open()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ key: KEY, savedAt: Date.now(), books: books.map(slimBook) } satisfies ListRecord)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
  } catch {
    // nothing is kept
  }
}
