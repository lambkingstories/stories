/**
 * Storage for the children's coloring work ("Meine Bilder"), so a picture that
 * is not finished can be picked up exactly where it was left.
 *
 * Everything stays on the device in IndexedDB; nothing is sent anywhere. Only
 * the child's painted layer is stored (a transparent PNG) plus a small preview.
 * The line art underneath is loaded again from where it came from (a built-in
 * page, a book attachment) or, for a blank sheet, is simply white.
 */

export interface ArtworkMeta {
  /** `src:<url>#<page>` for a coloring page, `blank:<timestamp>` for a blank sheet. */
  id: string
  title: string
  kind: 'page' | 'blank'
  /** Where the line art came from (empty for a blank sheet). */
  sourceUrl: string
  sourceType: 'image' | 'pdf' | ''
  page: number
  /** The child marked the picture as finished. */
  done?: boolean
  /** The coloring book the page belongs to, when it was opened from one. */
  bookId?: string
  /** Number of the page within that book (1-based). */
  bookPage?: number
  width: number
  height: number
  /** Small JPEG data URL of the picture as it looks now. */
  thumb: string
  updatedAt: number
}

interface ArtworkRecord extends ArtworkMeta {
  /** The painted layer (transparent PNG). */
  drawing: Blob
}

const DB_NAME = 'lambking-artworks'
const STORE = 'works'
/** The time-lapse of a painting (packed, see `utils/timelapse.ts`), by the id of the artwork. */
const LAPSE = 'timelapse'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(LAPSE)) db.createObjectStore(LAPSE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  // A failed open must not poison every later call.
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

function request<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>, storeName = STORE): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(storeName, mode).objectStore(storeName))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
  )
}

export function pageArtworkId(sourceUrl: string, page: number): string {
  return `src:${sourceUrl}#${page}`
}

export async function saveArtwork(meta: ArtworkMeta, drawing: Blob): Promise<void> {
  const record: ArtworkRecord = { ...meta, drawing }
  await request('readwrite', (s) => s.put(record))
}

export async function getArtwork(id: string): Promise<ArtworkRecord | null> {
  try {
    return ((await request('readonly', (s) => s.get(id))) as ArtworkRecord | undefined) ?? null
  } catch {
    return null
  }
}

/** Newest first. Without the painted layers' bytes in the result objects the list stays light. */
export async function listArtworks(): Promise<ArtworkMeta[]> {
  try {
    const all = (await request('readonly', (s) => s.getAll())) as ArtworkRecord[]
    return all
      .map(({ drawing: _drawing, ...meta }) => meta)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export async function deleteArtwork(id: string): Promise<void> {
  try {
    await request('readwrite', (s) => s.delete(id))
    await request('readwrite', (s) => s.delete(id), LAPSE)
  } catch {
    /* nothing to delete */
  }
}

/** Keeps the time-lapse of a painting (`null` removes it). */
export async function saveTimelapse(id: string, blob: Blob | null): Promise<void> {
  try {
    if (blob) await request('readwrite', (s) => s.put(blob, id), LAPSE)
    else await request('readwrite', (s) => s.delete(id), LAPSE)
  } catch {
    /* a missing time-lapse is no loss for the painting */
  }
}

export async function getTimelapse(id: string): Promise<Blob | null> {
  try {
    return ((await request('readonly', (s) => s.get(id), LAPSE)) as Blob | undefined) ?? null
  } catch {
    return null
  }
}

/** The painted pages of one coloring book, keyed by the page's line-art URL. */
export async function listBookArtworks(bookId: string): Promise<ArtworkMeta[]> {
  return (await listArtworks()).filter((a) => a.bookId === bookId)
}

/** The painted layer of a saved page as a PNG blob, `null` when nothing was painted yet. */
export async function getDrawing(id: string): Promise<Blob | null> {
  return (await getArtwork(id))?.drawing ?? null
}
