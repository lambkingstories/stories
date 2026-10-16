/**
 * Keeps count of what the child has done and hands out the awards (see `utils/awards`).
 * Everything stays on the device, like the paintings. An award that was earned stays earned,
 * even when the picture it was earned with is deleted later.
 */
import { computed, reactive } from 'vue'
import useReadingProgress from '@/use/useReadingProgress'
import { PAINT_TOOLS, awardProgress, newlyEarned, type AwardId, type AwardStats } from '@/utils/awards'

const KEY = 'lk-awards-v1'

interface Saved {
  earned: Partial<Record<AwardId, number>>
  /** Ids of the pictures that were marked as finished. */
  finished: string[]
  /** Coloring books that were finished (every picture). */
  books: string[]
  tools: string[]
  /** Days (yyyy-mm-dd) on which something was painted. */
  days: string[]
  /** Books read to the end (the reading progress is looked at as well). */
  read: string[]
}

function load(): Saved {
  const empty: Saved = { earned: {}, finished: [], books: [], tools: [], days: [], read: [] }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null
    if (raw && typeof raw === 'object') {
      return {
        earned: raw.earned && typeof raw.earned === 'object' ? raw.earned : {},
        finished: Array.isArray(raw.finished) ? raw.finished : [],
        books: Array.isArray(raw.books) ? raw.books : [],
        tools: Array.isArray(raw.tools) ? raw.tools : [],
        days: Array.isArray(raw.days) ? raw.days : [],
        read: Array.isArray(raw.read) ? raw.read : []
      }
    }
  } catch {
    // start fresh
  }
  return empty
}

const state = reactive<Saved>(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // private window: the awards just are not remembered
  }
}

const reading = useReadingProgress()

function readBooks(): number {
  const done = new Set(state.read)
  for (const [id, p] of Object.entries(reading.progressMap.value)) if (p.completedAt) done.add(id)
  return done.size
}

function stats(): AwardStats {
  return {
    finishedPictures: state.finished.length,
    finishedBooks: state.books.length,
    toolsUsed: state.tools,
    paintDays: state.days.length,
    booksRead: readBooks()
  }
}

/** Runs `change`, then gives out what became earned; returns those awards (for a "new!" message). */
function settle(change: () => void): AwardId[] {
  const before = stats()
  change()
  const won = newlyEarned(before, stats())
  const now = Date.now()
  for (const id of won) state.earned[id] = now
  save()
  return won
}

const today = () => new Date().toISOString().slice(0, 10)

export function useAwards() {
  /** All awards with how far each is; a medal that was earned once keeps its date. */
  const list = computed(() =>
    awardProgress(stats()).map((a) => ({ ...a, earned: a.earned || !!state.earned[a.id], earnedAt: state.earned[a.id] ?? null }))
  )

  /** A picture was marked as finished; `bookDone` is true when that completed a whole coloring book. */
  function pictureFinished(artworkId: string, book?: { bookId: string; complete: boolean }): AwardId[] {
    return settle(() => {
      if (!state.finished.includes(artworkId)) state.finished.push(artworkId)
      if (book?.complete && !state.books.includes(book.bookId)) state.books.push(book.bookId)
    })
  }

  /** A painting tool was used (only the six painting tools count). */
  function toolUsed(tool: string): AwardId[] {
    if (!(PAINT_TOOLS as readonly string[]).includes(tool) || state.tools.includes(tool)) return []
    return settle(() => state.tools.push(tool))
  }

  /** Something was painted today. */
  function paintedToday(): AwardId[] {
    const d = today()
    if (state.days.includes(d)) return []
    return settle(() => state.days.push(d))
  }

  /** A book was read to the end. */
  function bookRead(bookId: string): AwardId[] {
    if (state.read.includes(bookId)) return []
    return settle(() => state.read.push(bookId))
  }

  return { list, pictureFinished, toolUsed, paintedToday, bookRead }
}

export default useAwards
