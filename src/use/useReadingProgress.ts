/**
 * Per-book reading progress tracker.
 *
 * A page counts as "read" when the user dwelled on it long enough to plausibly
 * finish it — 20 seconds for normal pages, 0.5 seconds for the first page
 * (cover-like intro) and the last page (celebration screen). Progress is
 * expressed as (pagesRead / totalPages) and persisted to localStorage so it
 * survives reloads and informs retention UI on the home screen.
 *
 * The "total pages" counted excludes the synthetic celebration page — the
 * last real content page IS the lastRealPageIndex passed in by the caller.
 */
import { computed, reactive } from 'vue'
import { useActivity } from '@/use/useActivity'

const LS_KEY = 'kanaan.readingProgress.v1'

export interface BookProgress {
  pagesRead: number[]
  totalPages: number
  lastPage: number
  updatedAt: number
  completedAt?: number
}

type ProgressMap = Record<string, BookProgress>

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as ProgressMap
    return {}
  } catch {
    return {}
  }
}

const state = reactive<{ map: ProgressMap }>({ map: loadProgress() })

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state.map))
  } catch {
    // private mode / quota — degrade gracefully
  }
}

function ensureEntry(bookId: string, totalPages: number): BookProgress {
  const existing = state.map[bookId]
  if (existing) {
    if (existing.totalPages !== totalPages) existing.totalPages = totalPages
    return existing
  }
  const rec: BookProgress = {
    pagesRead: [],
    totalPages,
    lastPage: 1,
    updatedAt: Date.now()
  }
  state.map[bookId] = rec
  return rec
}

export const useReadingProgress = () => {
  function markPageRead(bookId: string, page: number, totalPages: number) {
    const rec = ensureEntry(bookId, totalPages)
    if (!rec.pagesRead.includes(page)) {
      rec.pagesRead = [...rec.pagesRead, page].sort((a, b) => a - b)
      useActivity().count('pages')
    }
    rec.updatedAt = Date.now()
    if (rec.pagesRead.length >= totalPages && !rec.completedAt) {
      rec.completedAt = Date.now()
    }
    persist()
  }

  function setLastPage(bookId: string, page: number, totalPages: number) {
    const rec = ensureEntry(bookId, totalPages)
    rec.lastPage = page
    rec.updatedAt = Date.now()
    persist()
  }

  function reset(bookId: string) {
    delete state.map[bookId]
    persist()
  }

  function getProgress(bookId: string): BookProgress | null {
    return state.map[bookId] ?? null
  }

  function getPct(bookId: string, totalPagesFallback = 0): number {
    const rec = state.map[bookId]
    if (!rec) return 0
    const total = rec.totalPages || totalPagesFallback
    if (!total) return 0
    return Math.min(1, rec.pagesRead.length / total)
  }

  function isCompleted(bookId: string): boolean {
    return !!state.map[bookId]?.completedAt
  }

  const progressMap = computed(() => state.map)

  /**
   * Minimum dwell time in ms before `markPageRead` should be called. First and
   * last pages are treated as brief so the user can sweep through a cover
   * image or celebration screen without gaming the completion signal.
   */
  function dwellMsForPage(page: number, totalPages: number): number {
    if (page <= 1 || page >= totalPages) return 500
    return 20_000
  }

  return {
    progressMap,
    markPageRead,
    setLastPage,
    reset,
    getProgress,
    getPct,
    isCompleted,
    dwellMsForPage
  }
}

export default useReadingProgress
