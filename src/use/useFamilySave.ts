/**
 * "Keep playing": a family game that was begun and not finished is kept on the device (nothing is sent anywhere), so the people can leave
 * the game (the back button goes to the start page of the game), do something else and come back to the same round.
 *
 * Every game gives its own key and its own state (plain data: numbers, texts, lists). `save` is called whenever the state changes while a
 * round runs, `clear` when the round is over or thrown away. A saved round older than a week is forgotten. `version` guards against a
 * state of an older app version (another shape): a saved round with another version is ignored.
 */
import { ref, type Ref } from 'vue'

const PREFIX = 'lk-family-save-'
const MAX_AGE = 7 * 24 * 60 * 60 * 1000

interface Stored<T> {
  v: number
  at: number
  state: T
}

export interface FamilySave<T> {
  /** The kept round, or null. */
  saved: Ref<T | null>
  /** Keeps this state as the round that can be taken up again. */
  save: (state: T) => void
  /** Forgets the kept round. */
  clear: () => void
}

export function readSaved<T>(key: string, version: number, now: number = Date.now()): T | null {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFIX + key) ?? 'null') as Stored<T> | null
    if (raw && raw.v === version && Number.isFinite(raw.at) && now - raw.at < MAX_AGE && raw.state && typeof raw.state === 'object') return raw.state
  } catch {
    // nothing kept
  }
  return null
}

export default function useFamilySave<T>(key: string, version = 1): FamilySave<T> {
  const saved = ref(readSaved<T>(key, version)) as Ref<T | null>

  function save(state: T) {
    saved.value = state
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ v: version, at: Date.now(), state } satisfies Stored<T>))
    } catch {
      // the round is only kept until the app is closed
    }
  }

  function clear() {
    saved.value = null
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      // nothing to forget
    }
  }

  return { saved, save, clear }
}
