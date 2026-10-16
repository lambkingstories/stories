/** `later(fn, ms)` is `setTimeout`, but the timers are stopped when the component goes away (no change of a screen that is gone). */
import { onBeforeUnmount } from 'vue'

export default function useTimers() {
  const ids = new Set<number>()
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.delete(id)
      fn()
    }, ms)
    ids.add(id)
    return id
  }
  onBeforeUnmount(() => {
    for (const id of ids) window.clearTimeout(id)
    ids.clear()
  })
  return { later }
}
