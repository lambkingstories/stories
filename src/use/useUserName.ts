/**
 * Shared store for the user's display name. Persisted in localStorage
 * so the home greeting + profile card render the same name across
 * reloads, and so changing it in one place updates the other reactively.
 *
 *   - `userName`           raw stored value (empty string when not set)
 *   - `displayName`        what the profile card shows — falls back to
 *                          the seed "Entdecker" so the slot never reads as
 *                          empty before the user has typed anything
 *   - `hasCustomName`      truthy once the user has entered a non-empty,
 *                          non-default name; the main-view greeting uses
 *                          this to switch from "Hallo, Entdecker!" to
 *                          the personalised "Hallo, <name>!"
 *   - `setUserName(name)`  trims + persists; empty string clears back
 *                          to the default state
 */
import { computed, ref } from 'vue'

const LS_USER_NAME = 'kanaan.userName'
const DEFAULT_NAME = 'Entdecker'

function readStored(): string {
  try {
    const raw = localStorage.getItem(LS_USER_NAME)
    return typeof raw === 'string' ? raw : ''
  } catch {
    return ''
  }
}

const userName = ref<string>(readStored())

export default function useUserName() {
  const displayName = computed<string>(() => userName.value.trim() || DEFAULT_NAME)
  const hasCustomName = computed<boolean>(() => {
    const trimmed = userName.value.trim()
    return trimmed.length > 0 && trimmed !== DEFAULT_NAME
  })

  function setUserName(name: string) {
    const trimmed = name.trim()
    userName.value = trimmed
    try {
      if (trimmed) localStorage.setItem(LS_USER_NAME, trimmed)
      else localStorage.removeItem(LS_USER_NAME)
    } catch { /* quota / disabled */
    }
  }

  return {
    userName,
    displayName,
    hasCustomName,
    setUserName,
    defaultName: DEFAULT_NAME
  }
}
