import type { Journey } from '@/types/adventure'
import { josef } from '@/data/adventures/josef'
import { localize } from '@/data/adventures/localize'

/** All journeys of this build. More follow, one after the other, through the whole Bible. */
export const journeys: Journey[] = [josef]

export const journeyById = (id: string): Journey | undefined => journeys.find((j) => j.id === id)

/** Journeys that are announced (shown closed on the adventure page); they get their own entry once they are written. */
export const comingSoon: { id: string; title: string }[] = [
  { id: 'adam-eva', title: 'Adam und Eva' },
  { id: 'noah', title: 'Noah' },
  { id: 'babel', title: 'Der Turm von Babel' },
  { id: 'abraham', title: 'Abraham' },
  { id: 'jakob', title: 'Jakob' }
]
// the names of the announced adventures in English (shown when the app is English)
localize(comingSoon, [{ title: 'Adam and Eve' }, { title: 'Noah' }, { title: 'The Tower of Babel' }, { title: 'Abraham' }, { title: 'Jacob' }])

/**
 * Noah, Adam and Eve, the Tower of Babel, Abraham and Jacob are not public yet (texts and pictures are not released). A build that contains one of them
 * (`VITE_INCLUDE_NOAH=true`, `VITE_INCLUDE_ADAM=true`, `VITE_INCLUDE_BABEL=true`, `VITE_INCLUDE_ABRAHAM=true`, `VITE_INCLUDE_JAKOB=true`, the hidden test build) does not show it to everybody: it shows only
 * on a device that has been unlocked once by opening the app with the unlock link (`/?noah=<code>`, `/?adam=<code>`, `/?babel=<code>`, `/?abraham=<code>`, `/?jakob=<code>`); the unlock is
 * kept on the device (`localStorage`), `?noah=off` / `?adam=off` / `?babel=off` / `?abraham=off` / `?jakob=off` takes it away again. `VITE_SHOW_NOAH=true` / `VITE_SHOW_ADAM=true` /
 * `VITE_SHOW_BABEL=true` / `VITE_SHOW_ABRAHAM=true` / `VITE_SHOW_JAKOB=true` (local `vite --mode noah` / `--mode adam` / `--mode babel` / `--mode abraham` / `--mode jakob`) shows it always.
 * A normal build contains none of it: the conditions below are constants there, so the chunk with the data of the journey is left out (and the
 * folders of its pictures and recordings are taken out of the build, see `vite.config.noah.ts`). Only data of our own server is loaded, never
 * code from outside. This is a hiding place, not a lock.
 */
export const PREVIEW_KEY = 'lk-preview-noah'
export const NOAH_UNLOCK_CODE = 'noah-vorschau-7k3q'
export const ADAM_PREVIEW_KEY = 'lk-preview-adam'
export const ADAM_UNLOCK_CODE = 'adam-vorschau-m4k7'
export const BABEL_PREVIEW_KEY = 'lk-preview-babel'
export const BABEL_UNLOCK_CODE = 'babel-vorschau-r7t3'
export const ABRAHAM_PREVIEW_KEY = 'lk-preview-abraham'
export const ABRAHAM_UNLOCK_CODE = 'abraham-vorschau-p6w2'
export const JAKOB_PREVIEW_KEY = 'lk-preview-jakob'
export const JAKOB_UNLOCK_CODE = 'jakob-vorschau-c8n5'

/** A journey that is shown only on unlocked devices: the name of its link (`?<param>=<code>`), where the unlock is kept, and how it is loaded. */
interface PreviewJourney {
  id: string
  param: string
  code: string
  key: string
  /** Shown on every device (the local test mode), without the link. */
  always: boolean
  load: () => Promise<Journey>
}

/**
 * The hidden journeys of THIS build. Every entry sits behind a condition on the build flags, which is a constant in a built app: without the
 * flag the whole entry, and with it the dynamic `import` of the data, is removed (the data is not even left as a chunk).
 */
function previewJourneys(): PreviewJourney[] {
  const list: PreviewJourney[] = []
  if (import.meta.env.VITE_INCLUDE_ADAM === 'true' || import.meta.env.VITE_SHOW_ADAM === 'true') {
    list.push({
      id: 'adam-eva',
      param: 'adam',
      code: ADAM_UNLOCK_CODE,
      key: ADAM_PREVIEW_KEY,
      always: import.meta.env.VITE_SHOW_ADAM === 'true',
      load: async () => (await import('@/data/adventures/adamEva')).adamEva
    })
  }
  if (import.meta.env.VITE_INCLUDE_BABEL === 'true' || import.meta.env.VITE_SHOW_BABEL === 'true') {
    list.push({
      id: 'babel',
      param: 'babel',
      code: BABEL_UNLOCK_CODE,
      key: BABEL_PREVIEW_KEY,
      always: import.meta.env.VITE_SHOW_BABEL === 'true',
      load: async () => (await import('@/data/adventures/babel')).babel
    })
  }
  if (import.meta.env.VITE_INCLUDE_ABRAHAM === 'true' || import.meta.env.VITE_SHOW_ABRAHAM === 'true') {
    list.push({
      id: 'abraham',
      param: 'abraham',
      code: ABRAHAM_UNLOCK_CODE,
      key: ABRAHAM_PREVIEW_KEY,
      always: import.meta.env.VITE_SHOW_ABRAHAM === 'true',
      load: async () => (await import('@/data/adventures/abraham')).abraham
    })
  }
  if (import.meta.env.VITE_INCLUDE_JAKOB === 'true' || import.meta.env.VITE_SHOW_JAKOB === 'true') {
    list.push({
      id: 'jakob',
      param: 'jakob',
      code: JAKOB_UNLOCK_CODE,
      key: JAKOB_PREVIEW_KEY,
      always: import.meta.env.VITE_SHOW_JAKOB === 'true',
      load: async () => (await import('@/data/adventures/jakob')).jakob
    })
  }
  if (import.meta.env.VITE_INCLUDE_NOAH === 'true' || import.meta.env.VITE_SHOW_NOAH === 'true') {
    list.push({
      id: 'noah',
      param: 'noah',
      code: NOAH_UNLOCK_CODE,
      key: PREVIEW_KEY,
      always: import.meta.env.VITE_SHOW_NOAH === 'true',
      load: async () => (await import('@/data/adventures/noah')).noah
    })
  }
  return list
}

/** Reads the unlock link of one journey (`?<param>=code` / `?<param>=off`), remembers it, and removes it from the address bar. */
function readUnlockLink(p: PreviewJourney): boolean {
  try {
    const url = new URL(window.location.href)
    const given = url.searchParams.get(p.param)
    if (given !== null) {
      if (given === p.code) localStorage.setItem(p.key, '1')
      else if (given === 'off') localStorage.removeItem(p.key)
      url.searchParams.delete(p.param)
      window.history.replaceState(window.history.state, '', url.toString())
    }
    return localStorage.getItem(p.key) === '1'
  } catch {
    return false
  }
}

/** Adds the journeys that are shown only on unlocked devices. Called once before the app is mounted. */
export async function loadPreviewJourneys(): Promise<void> {
  for (const p of previewJourneys()) {
    if (!(p.always || readUnlockLink(p))) continue
    try {
      const journey = await p.load()
      if (!journeys.some((j) => j.id === journey.id)) journeys.push(journey)
      const at = comingSoon.findIndex((c) => c.id === journey.id)
      if (at >= 0) comingSoon.splice(at, 1)
    } catch {
      // the journey could not be loaded (no net): the app simply goes on without it
    }
  }
}
