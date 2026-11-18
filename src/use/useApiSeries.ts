/**
 * Tiny reactive cache for the public series list. Mirrors the shape of
 * `useApiBooks` so views can stay consistent.
 *
 * The legacy `useModels.getSeries` still exists for back-compat
 * consumers (it reads from the hardcoded `BOOK_SERIES` constant);
 * `useApiSeries.getById` returns the *server* truth and is the one
 * surface that carries the editor-uploaded `coverImage`.
 */
import { reactive, readonly } from 'vue'
import { seriesApi } from '@/api/seriesApi'
import type { ApiSeries } from '@/types/apiBook'

const state = reactive<{
  byId: Record<string, ApiSeries>
  all: ApiSeries[] | null
  loading: boolean
  error: string | null
}>({
  byId: {},
  all: null,
  loading: false,
  error: null
})

/**
 * The series list of the last visit lies on the device (it is tiny): the shelves know their names, order and pictures at once, and the
 * net only refreshes them. Without it a screen drew the shelves with made-up names first and then reordered them.
 */
const KEPT_KEY = 'lk-series-v1'

function readKept(): ApiSeries[] | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEPT_KEY) ?? 'null') as unknown
    return Array.isArray(raw) && raw.length ? (raw as ApiSeries[]) : null
  } catch {
    return null
  }
}

function keep(list: ApiSeries[]): void {
  try {
    localStorage.setItem(KEPT_KEY, JSON.stringify(list))
  } catch {
    // a full device or a private window: the next start waits for the net, as before
  }
}

const kept = readKept()
if (kept) {
  state.all = kept
  for (const s of kept) state.byId[s.seriesId] = s
}

/** The net has answered in this run (the kept list alone does not count). */
let refreshed = false
let inflight: Promise<ApiSeries[]> | null = null

async function loadAll(): Promise<ApiSeries[]> {
  if (inflight) return inflight
  if (refreshed && state.all && state.all.length) return state.all
  state.loading = true
  inflight = (async () => {
    try {
      const list = await seriesApi.list()
      state.all = list
      for (const s of list) state.byId[s.seriesId] = s
      refreshed = true
      state.error = null
      keep(list)
      return list
    } catch (err) {
      state.error = (err as Error).message
      return state.all ?? []
    } finally {
      state.loading = false
      inflight = null
    }
  })()
  return inflight
}

export default function useApiSeries() {
  return {
    state: readonly(state),
    loadAll,
    getById: (id: string): ApiSeries | null => state.byId[id] ?? null
  }
}
