/**
 * Which collection cards the child has looked at. A card that is won but not looked at yet is "new" (a mark in the album and a reveal
 * when it is opened). Everything stays on the device.
 */
import { reactive } from 'vue'

const KEY = 'lk-cards-seen-v1'

function load(): Record<string, true> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, true> | null
    if (raw && typeof raw === 'object') return raw
  } catch {
    // start fresh
  }
  return {}
}

const seen = reactive<Record<string, true>>(load())

/** The key of a card of a stage, and of the special card of a journey. */
export const cardKey = (journeyId: string, stageId: number | 'set') => `${journeyId}:${stageId}`

export default function useCardsSeen() {
  return {
    isNew: (key: string, have: boolean) => have && !seen[key],
    markSeen(key: string) {
      if (seen[key]) return
      seen[key] = true
      try {
        localStorage.setItem(KEY, JSON.stringify(seen))
      } catch {
        // a private window: not remembered
      }
    }
  }
}
