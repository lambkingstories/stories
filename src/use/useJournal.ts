/**
 * "Mein Dankbuch": short notes and little drawings of the child (what was good today, who to thank, what to tell God). Everything stays
 * on the device in `localStorage`; nothing is sent anywhere and nobody reads it. A drawing is a small JPEG, so the limit of the storage is
 * not reached quickly; when it is, the entry is simply not kept (`add` returns `false`).
 */
import { computed, reactive } from 'vue'

export interface JournalEntry {
  id: string
  /** When it was written (milliseconds). */
  at: number
  text: string
  /** A small drawing (JPEG data URL), if there is one. */
  drawing?: string
}

const KEY = 'lk-journal-v1'
const DRAFT_KEY = 'lk-journal-draft'
export const MAX_ENTRIES = 300
export const MAX_TEXT = 400

function load(): JournalEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (Array.isArray(raw)) {
      return raw
        .filter((e) => e && typeof e.id === 'string' && typeof e.at === 'number')
        .map((e) => ({ id: e.id, at: e.at, text: typeof e.text === 'string' ? e.text : '', drawing: typeof e.drawing === 'string' ? e.drawing : undefined }))
    }
  } catch {
    // start with an empty book
  }
  return []
}

const state = reactive<{ entries: JournalEntry[] }>({ entries: load() })

function save(): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.entries))
    return true
  } catch {
    return false
  }
}

/** The words that are not in the book yet (the child goes to paint and comes back). */
export function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function writeDraft(text: string) {
  try {
    if (text) localStorage.setItem(DRAFT_KEY, text)
    else localStorage.removeItem(DRAFT_KEY)
  } catch {
    // the words are only not kept
  }
}

/** Longest side of a drawing in the book: small enough that many fit into the storage of the device. */
export const DRAWING_SIDE = 720

/** A painted picture as the small JPEG of the book. */
export function drawingFrom(picture: HTMLCanvasElement): string {
  const k = Math.min(1, DRAWING_SIDE / Math.max(picture.width, picture.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(picture.width * k))
  c.height = Math.max(1, Math.round(picture.height * k))
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(picture, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.72)
}

export default function useJournal() {
  /** Newest first. */
  const entries = computed(() => [...state.entries].sort((a, b) => b.at - a.at))

  /** Writes a new entry; an entry with neither a word nor a drawing is not made. Returns `false` when it could not be kept. */
  function add(text: string, drawing?: string | null, now = Date.now()): boolean {
    const t = text.trim().slice(0, MAX_TEXT)
    if (!t && !drawing) return false
    const entry: JournalEntry = { id: `${now}-${Math.random().toString(36).slice(2, 7)}`, at: now, text: t, drawing: drawing || undefined }
    state.entries.push(entry)
    if (state.entries.length > MAX_ENTRIES) state.entries.splice(0, state.entries.length - MAX_ENTRIES)
    if (!save()) {
      state.entries.pop()
      return false
    }
    return true
  }

  function remove(id: string) {
    const i = state.entries.findIndex((e) => e.id === id)
    if (i < 0) return
    state.entries.splice(i, 1)
    save()
  }

  return { entries, add, remove, count: computed(() => state.entries.length) }
}
