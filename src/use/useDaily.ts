/**
 * "Heute für dich" (Anton 10.11.2026): every day one Bible verse and one small task (read, play or paint). Whoever does the task gets a
 * star for the day. There is no streak and no penalty: a day without a star simply stays empty, and the stars of the days before stay. What
 * was done is read from the diary of the app (`useActivity`), the stars are kept on the device.
 */
import { computed, reactive } from 'vue'
import { dayKey, useActivity } from '@/use/useActivity'
import { MEMORY_VERSES } from '@/data/memoryVerses'
import { memoryVerseOf } from '@/data/memoryVerses'

export type DailyKind = 'read' | 'play' | 'paint'

const KEY = 'lk-daily-v1'
const KINDS: DailyKind[] = ['read', 'play', 'paint']
const VERSE_IDS = Object.keys(MEMORY_VERSES)

interface Saved {
  /** The days (yyyy-mm-dd) on which the task was done. */
  days: string[]
}

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null
    if (raw && Array.isArray(raw.days)) return { days: raw.days.filter((d): d is string => typeof d === 'string') }
  } catch {
    // start fresh
  }
  return { days: [] }
}

const state = reactive<Saved>(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // a private window: the stars are not remembered
  }
}

/** The number of the day (the same for everybody on the same calendar day), for choosing the verse and the task. */
export function dayNumber(date: Date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}

/** The verse id and the kind of task of a day. The verse changes every day and the task rotates, so the three kinds follow one another. */
export function dailyFor(date: Date = new Date()): { verseId: string; kind: DailyKind } {
  const n = dayNumber(date)
  return { verseId: VERSE_IDS[n % VERSE_IDS.length]!, kind: KINDS[n % KINDS.length]! }
}

/** True when the diary of a day shows that the task of the kind was done. */
export function taskDone(kind: DailyKind, rec: { pages: number; stages: number; pictures: number; sec: { paint: number } } | undefined): boolean {
  if (!rec) return false
  if (kind === 'read') return rec.pages >= 3
  if (kind === 'play') return rec.stages >= 1
  return rec.sec.paint >= 120 || rec.pictures >= 1
}

export function useDaily(lang: () => 'de' | 'en') {
  const activity = useActivity()
  const today = computed(() => dailyFor())
  const verse = computed(() => memoryVerseOf(today.value.verseId, lang()))
  const done = computed(() => taskDone(today.value.kind, activity.days[dayKey()]))
  const claimed = computed(() => state.days.includes(dayKey()))
  /** How many days have a star (days in a row do not matter). */
  const total = computed(() => state.days.length)

  /** Gives the star of today when the task is done and it was not given yet; true when it was given just now. */
  function settle(): boolean {
    if (!done.value || claimed.value) return false
    state.days.push(dayKey())
    save()
    return true
  }

  return { today, verse, done, claimed, total, settle }
}

/** The number of stars of the days (for the awards). */
export const dailyStarCount = () => state.days.length

export default useDaily
