import type { Journey } from '@/types/adventure'
import { josef } from '@/data/adventures/josef'
import { localize } from '@/data/adventures/localize'

/** All journeys of this build. More follow, one after the other, through the whole Bible. */
export const journeys: Journey[] = [josef]

export const journeyById = (id: string): Journey | undefined => journeys.find((j) => j.id === id)

/** Journeys that are announced (shown closed on the adventure page); they get their own entry once they are written. */
export const comingSoon: { id: string; title: string }[] = [
  { id: 'adam-eva', title: 'Adam und Eva' },
  { id: 'noah', title: 'Noah' }
]
// the names of the announced adventures in English (shown when the app is English)
localize(comingSoon, [{ title: 'Adam and Eve' }, { title: 'Noah' }])

/**
 * Noah is not public yet (texts and pictures are not released). A build that contains it (`VITE_INCLUDE_NOAH=true`, the hidden test
 * build) does not show it to everybody: it shows only on a device that has been unlocked once by opening the app with the unlock link
 * (`/?noah=<code>`); the unlock is kept on the device (`localStorage`), `?noah=off` takes it away again. `VITE_SHOW_NOAH=true` (local
 * `vite --mode noah`) shows it always. A normal build contains none of it: the condition below is a constant there, so the chunk with
 * Noah's data is left out. Only data of our own server is loaded, never code from outside. This is a hiding place, not a lock.
 */
export const PREVIEW_KEY = 'lk-preview-noah'
export const NOAH_UNLOCK_CODE = 'noah-vorschau-7k3q'

/** Reads the unlock link (`?noah=code` / `?noah=off`), remembers it, and removes the code from the address bar. */
function readUnlockLink(): boolean {
  try {
    const url = new URL(window.location.href)
    const given = url.searchParams.get('noah')
    if (given !== null) {
      if (given === NOAH_UNLOCK_CODE) localStorage.setItem(PREVIEW_KEY, '1')
      else if (given === 'off') localStorage.removeItem(PREVIEW_KEY)
      url.searchParams.delete('noah')
      window.history.replaceState(window.history.state, '', url.toString())
    }
    return localStorage.getItem(PREVIEW_KEY) === '1'
  } catch {
    return false
  }
}

/** Adds the journeys that are shown only on unlocked devices. Called once before the app is mounted. */
export async function loadPreviewJourneys(): Promise<void> {
  const included = import.meta.env.VITE_INCLUDE_NOAH === 'true' || import.meta.env.VITE_SHOW_NOAH === 'true'
  if (!included) return
  const unlocked = import.meta.env.VITE_SHOW_NOAH === 'true' || readUnlockLink()
  if (!unlocked) return
  try {
    const { noah } = await import('@/data/adventures/noah')
    if (!journeys.some((j) => j.id === noah.id)) journeys.push(noah)
    const at = comingSoon.findIndex((c) => c.id === noah.id)
    if (at >= 0) comingSoon.splice(at, 1)
  } catch {
    // the journey could not be loaded (no net): the app simply goes on without it
  }
}
