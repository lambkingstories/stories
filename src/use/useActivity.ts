/**
 * A small diary of what the child did, for the grown-ups' overview: per day how long the app was in use (split into reading,
 * adventure, painting and the rest), how many pages were read, stages played and pictures finished. Only numbers are kept, only on
 * the device, and only the last 60 days (nothing is sent anywhere).
 */
import { computed, reactive } from 'vue'

export type Section = 'home' | 'read' | 'adventure' | 'paint' | 'other'
export type Counter = 'pages' | 'stages' | 'pictures'

export interface DayRecord {
  /** Seconds in use per section. */
  sec: Record<Section, number>
  pages: number
  stages: number
  pictures: number
}

const KEY = 'lk-activity-v1'
const KEEP_DAYS = 60
/** After this long without a touch the app counts as "not in use" (a story that is being listened to still counts for a while). */
export const IDLE_MS = 3 * 60_000

const SECTIONS: Section[] = ['home', 'read', 'adventure', 'paint', 'other']

const emptyDay = (): DayRecord => ({ sec: { home: 0, read: 0, adventure: 0, paint: 0, other: 0 }, pages: 0, stages: 0, pictures: 0 })

/** yyyy-mm-dd in the local time zone (a day ends at midnight where the child is). */
export function dayKey(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

function load(): Record<string, DayRecord> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, Partial<DayRecord>> | null
    if (raw && typeof raw === 'object') {
      const out: Record<string, DayRecord> = {}
      for (const [day, r] of Object.entries(raw)) {
        const rec = emptyDay()
        for (const s of SECTIONS) rec.sec[s] = Number(r?.sec?.[s]) || 0
        rec.pages = Number(r?.pages) || 0
        rec.stages = Number(r?.stages) || 0
        rec.pictures = Number(r?.pictures) || 0
        out[day] = rec
      }
      return out
    }
  } catch {
    // start fresh
  }
  return {}
}

const days = reactive<Record<string, DayRecord>>(load())

function save() {
  // keep only the newest days
  const keys = Object.keys(days).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete days[k]
  try {
    localStorage.setItem(KEY, JSON.stringify(days))
  } catch {
    // a private window: the diary is not remembered
  }
}

function today(): DayRecord {
  const k = dayKey()
  if (!days[k]) days[k] = emptyDay()
  return days[k]!
}

export interface DaySummary {
  day: string
  /** Total minutes in use. */
  minutes: number
  pages: number
  stages: number
  pictures: number
}

const minutesOf = (r: DayRecord) => Math.round(SECTIONS.reduce((n, s) => n + r.sec[s], 0) / 60)

export function useActivity() {
  /** Some seconds were spent in a section. */
  function addSeconds(section: Section, seconds: number) {
    if (!(seconds > 0)) return
    today().sec[section] += seconds
    save()
  }
  function count(kind: Counter, n = 1) {
    today()[kind] += n
    save()
  }

  /** The last `n` days, oldest first (days without any record are zero). */
  function lastDays(n: number, from: Date = new Date()): DaySummary[] {
    const out: DaySummary[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(from)
      d.setDate(d.getDate() - i)
      const key = dayKey(d)
      const r = days[key]
      out.push({ day: key, minutes: r ? minutesOf(r) : 0, pages: r?.pages ?? 0, stages: r?.stages ?? 0, pictures: r?.pictures ?? 0 })
    }
    return out
  }

  /** Minutes per section over the last `n` days. */
  function sectionMinutes(n: number, from: Date = new Date()): Record<Section, number> {
    const total: Record<Section, number> = { home: 0, read: 0, adventure: 0, paint: 0, other: 0 }
    for (let i = 0; i < n; i++) {
      const d = new Date(from)
      d.setDate(d.getDate() - i)
      const r = days[dayKey(d)]
      if (r) for (const s of SECTIONS) total[s] += r.sec[s]
    }
    for (const s of SECTIONS) total[s] = Math.round(total[s] / 60)
    return total
  }

  const todayMinutes = computed(() => {
    const r = days[dayKey()]
    return r ? minutesOf(r) : 0
  })

  function clear() {
    for (const k of Object.keys(days)) delete days[k]
    save()
  }

  return { days, addSeconds, count, lastDays, sectionMinutes, todayMinutes, clear }
}

let lastTouch = Date.now()
/** Something that counts as "in use" without a touch is going on (a story is being listened to at bedtime). */
export function noteUse() {
  lastTouch = Date.now()
}

/**
 * Counts the seconds the app is really in use: the page is visible and the child touched it in the last three minutes.
 * `currentSection` says where the child is right now. Returns a function that stops the counting.
 */
export function startActivityTracking(currentSection: () => Section, tickMs = 10_000): () => void {
  if (typeof document === 'undefined') return () => {}
  const activity = useActivity()
  let last = Date.now()
  const touch = noteUse
  const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
  for (const e of events) window.addEventListener(e, touch, { passive: true, capture: true })

  const timer = setInterval(() => {
    const now = Date.now()
    const gap = Math.min(now - last, tickMs * 3) / 1000
    last = now
    if (document.visibilityState === 'visible' && now - lastTouch < IDLE_MS) activity.addSeconds(currentSection(), gap)
  }, tickMs)

  return () => {
    clearInterval(timer)
    for (const e of events) window.removeEventListener(e, touch, { capture: true })
  }
}

export default useActivity
