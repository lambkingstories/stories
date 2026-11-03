/**
 * "Familien-Stimmen": stories that grandma, grandpa or the parents have read aloud into the microphone, kept for the child.
 * The recordings stay on the device in IndexedDB; the app never uploads anything. A grown-up can send a recording as a file with the share
 * sheet of the phone (a grandparent far away reads, the parents add the file they got), so no server and no account are needed.
 * Recording is a grown-ups' job (it sits behind the parental gate); the child only plays them (in the good-night mode).
 */

export interface VoiceMeta {
  id: string
  /** The story that was read (its id and the title at the time). */
  bookId: string
  bookTitle: string
  /** Who read it ("Oma"). */
  reader: string
  mime: string
  durationMs: number
  createdAt: number
}

interface VoiceRecord extends VoiceMeta {
  blob: Blob
}

const DB_NAME = 'lambking-voices'
const STORE = 'recordings'
let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
  )
}

/** The best format the device can record: mp4/aac where the browser is Safari, otherwise webm/opus; `''` when recording is not possible. */
export function recordingMime(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const m of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported?.(m)) return m
  }
  return ''
}

export async function saveVoice(meta: VoiceMeta, blob: Blob): Promise<void> {
  await run('readwrite', (s) => s.put({ ...meta, blob } as VoiceRecord))
}

/** Newest first; without the sound itself, so the list stays light. */
export async function listVoices(): Promise<VoiceMeta[]> {
  try {
    const all = (await run('readonly', (s) => s.getAll())) as VoiceRecord[]
    return all.map(({ blob: _blob, ...meta }) => meta).sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export async function getVoiceBlob(id: string): Promise<Blob | null> {
  try {
    return ((await run('readonly', (s) => s.get(id))) as VoiceRecord | undefined)?.blob ?? null
  } catch {
    return null
  }
}

export async function deleteVoice(id: string): Promise<void> {
  try {
    await run('readwrite', (s) => s.delete(id))
  } catch {
    /* nothing to delete */
  }
}

// ── a recording as a file: send it, and add one that was sent ───────────────────────────────────────────────────────

/** The biggest file that is added (a story of an hour is about 30 MB as aac). */
export const MAX_IMPORT_BYTES = 80 * 1024 * 1024

const EXT_OF_MIME: [RegExp, string][] = [
  [/mp4|m4a|aac/, 'm4a'],
  [/webm/, 'webm'],
  [/ogg|opus/, 'ogg'],
  [/mpeg|mp3/, 'mp3'],
  [/wav/, 'wav']
]
const MIME_OF_EXT: Record<string, string> = { m4a: 'audio/mp4', aac: 'audio/aac', mp4: 'audio/mp4', webm: 'audio/webm', ogg: 'audio/ogg', opus: 'audio/ogg', oga: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav' }

export function extOfMime(mime: string): string {
  const m = mime.toLowerCase()
  return EXT_OF_MIME.find(([re]) => re.test(m))?.[1] ?? 'm4a'
}

/** What a file is, by its name, when the device gives it no type (the sound of a message of a messenger often has none). */
export function mimeOfName(name: string): string {
  return MIME_OF_EXT[name.toLowerCase().split('.').pop() ?? ''] ?? ''
}

/** True for a file that looks like a sound. */
export function looksLikeAudio(file: { name: string; type: string }): boolean {
  return file.type.startsWith('audio/') || !!mimeOfName(file.name)
}

const clean = (s: string) => s.replace(/[^\p{L}\p{N} -]/gu, '').trim().replace(/\s+/g, ' ')

/** `LambKing__<story id>__<reader>.m4a`: the other app knows which story it is and who read it, when the name is kept. */
export function voiceFileName(v: Pick<VoiceMeta, 'bookId' | 'reader' | 'mime'>): string {
  return `LambKing__${v.bookId.replace(/__/g, '_')}__${clean(v.reader) || 'Familie'}.${extOfMime(v.mime)}`
}

/** The story and the reader out of a name made by `voiceFileName`; `null` for any other file. */
export function parseVoiceFileName(name: string): { bookId: string; reader: string } | null {
  const m = /^LambKing__(.+?)__(.+?)(?: \(\d+\))?\.[A-Za-z0-9]+$/.exec(name)
  return m ? { bookId: m[1]!, reader: m[2]! } : null
}

/** How long a sound is (milliseconds); `null` when this device cannot play it. */
export function audioDuration(blob: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const a = new Audio()
    const done = (ms: number | null) => {
      URL.revokeObjectURL(url)
      resolve(ms)
    }
    a.preload = 'metadata'
    a.onerror = () => done(null)
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration)) return done(Math.round(a.duration * 1000))
      // a sound recorded in the browser has no length in its head: jump to the end to learn it
      a.ontimeupdate = () => {
        a.ontimeupdate = null
        done(Number.isFinite(a.duration) ? Math.round(a.duration * 1000) : 0)
      }
      a.currentTime = 1e9
    }
    a.src = url
  })
}
