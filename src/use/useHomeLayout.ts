/**
 * The layout of the tiles of the start page, kept on the device (see `utils/homeTiles`). Nothing leaves the device; a private window simply
 * forgets the layout. One layout for the whole app (shared by every place that shows the tiles).
 */
import { readonly, ref } from 'vue'
import { addTile, defaultLayout, moveTile, normalizeLayout, removeTile, toggleSize, type HomeTile, type HomeTileId } from '@/utils/homeTiles'

export const HOME_LAYOUT_KEY = 'lk-home-layout-v1'

function load(): HomeTile[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HOME_LAYOUT_KEY) ?? 'null') as unknown
    return normalizeLayout(raw) ?? defaultLayout()
  } catch {
    return defaultLayout()
  }
}

const layout = ref<HomeTile[]>(load())

function set(next: HomeTile[]) {
  layout.value = next
  try {
    localStorage.setItem(HOME_LAYOUT_KEY, JSON.stringify(next))
  } catch {
    // a private window: the layout is not remembered
  }
}

export default function useHomeLayout() {
  return {
    layout: readonly(layout),
    move: (id: HomeTileId, targetId: HomeTileId) => set(moveTile(layout.value, id, targetId)),
    resize: (id: HomeTileId) => set(toggleSize(layout.value, id)),
    remove: (id: HomeTileId) => set(removeTile(layout.value, id)),
    add: (id: HomeTileId) => set(addTile(layout.value, id)),
    reset: () => set(defaultLayout()),
    /** Reads the saved layout again (for tests, and when another page of the app has changed it). */
    reload: () => {
      layout.value = load()
    }
  }
}
