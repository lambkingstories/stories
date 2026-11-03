/**
 * "Meine Ausstellungsbilder": the three places of the child's own exhibition (place 1, 2 and 3) in the painting program. Each place
 * holds the id of one of the child's paintings (`ArtworkMeta.id`), or nothing. Everything stays on the device: nothing is sent
 * anywhere, nothing is shown to other children, so nobody has to look at anything. The places are remembered in `localStorage`.
 * A place whose painting was deleted is empty again.
 */
import { ref } from 'vue'

export const EXHIBITION_PLACES = 3
const STORAGE_KEY = 'lk-exhibition-v1'

type Places = (string | null)[]

function empty(): Places {
  return Array.from({ length: EXHIBITION_PLACES }, () => null)
}

function read(): Places {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : null
    if (!Array.isArray(list)) return empty()
    const places = empty()
    for (let i = 0; i < EXHIBITION_PLACES; i++) places[i] = typeof list[i] === 'string' ? (list[i] as string) : null
    return places
  } catch {
    return empty()
  }
}

const places = ref<Places>(read())

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places.value))
  } catch {
    // no storage: the exhibition only lasts until the app is closed
  }
}

export default function useExhibition() {
  /** Puts a painting on a place (0 = place 1). A painting hangs only once: if it hung on another place it moves, and the two swap. */
  function assign(place: number, id: string) {
    if (place < 0 || place >= EXHIBITION_PLACES) return
    const next = [...places.value]
    const from = next.indexOf(id)
    if (from >= 0 && from !== place) next[from] = next[place] ?? null
    next[place] = id
    places.value = next
    save()
  }

  function clear(place: number) {
    if (place < 0 || place >= EXHIBITION_PLACES || !places.value[place]) return
    const next = [...places.value]
    next[place] = null
    places.value = next
    save()
  }

  /** Fills the empty places with the given paintings (the newest first), without touching the ones that are taken. */
  function fill(ids: string[]) {
    const next = [...places.value]
    const free = ids.filter((id) => !next.includes(id))
    for (let i = 0; i < EXHIBITION_PLACES && free.length; i++) if (!next[i]) next[i] = free.shift()!
    places.value = next
    save()
  }

  return { places, assign, clear, fill }
}
