import { computed, ref } from 'vue'

/**
 * The paint shelf: the coloring books the child (or the parents) put into the painting program. The books are chosen under
 * "Lesen" with "Add to the paint shelf" and can be taken out again in the painting program. Only the ids are kept, on the device.
 * A device that painted before this existed gets the books it already painted on in its shelf once (see `seedShelf`).
 */
const KEY = 'lk-coloring-shelf'

function read(): string[] | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return null
    const v = JSON.parse(raw) as unknown
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

const initial = read()
const ids = ref<string[]>(initial ?? [])
const seeded = ref(initial !== null)

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.value))
  } catch {
    // not remembered in a private window
  }
}

export default function useColoringShelf() {
  return {
    ids: computed(() => ids.value),
    has: (id: string) => ids.value.includes(id),
    add(id: string) {
      if (!ids.value.includes(id)) {
        ids.value = [...ids.value, id]
        seeded.value = true
        save()
      }
    },
    remove(id: string) {
      ids.value = ids.value.filter((x) => x !== id)
      seeded.value = true
      save()
    },
    toggle(id: string) {
      if (ids.value.includes(id)) this.remove(id)
      else this.add(id)
    },
    /** The very first time: the books that were already painted on stay on the shelf. */
    seedShelf(startedIds: string[]) {
      if (seeded.value) return
      ids.value = [...startedIds]
      seeded.value = true
      save()
    }
  }
}
