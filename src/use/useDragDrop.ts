/**
 * Pieces that are dragged to a place or tapped and then placed by tapping the place (the second way is for those who cannot
 * drag, and for small fingers). Places carry `data-drop="<id>"`; a piece tells its `id` to `down`.
 */
import { onBeforeUnmount, reactive, ref } from 'vue'

export function useDragDrop(onDrop: (id: string, target: string) => void) {
  const dragging = ref<string | null>(null)
  const selected = ref<string | null>(null)
  const offset = reactive({ x: 0, y: 0 })
  let startX = 0
  let startY = 0
  let moved = false

  const targetAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y)
    const hit = el instanceof Element ? el.closest('[data-drop]') : null
    return hit instanceof HTMLElement ? hit.dataset.drop ?? null : null
  }

  function onMove(e: PointerEvent) {
    offset.x = e.clientX - startX
    offset.y = e.clientY - startY
    if (Math.hypot(offset.x, offset.y) > 8) moved = true
  }

  function stop() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
  }

  function onUp(e: PointerEvent) {
    stop()
    const id = dragging.value
    dragging.value = null
    offset.x = 0
    offset.y = 0
    if (!id) return
    if (moved) {
      const target = targetAt(e.clientX, e.clientY)
      if (target !== null) {
        selected.value = null
        onDrop(id, target)
      }
    } else {
      selected.value = selected.value === id ? null : id
    }
  }

  function onCancel() {
    stop()
    dragging.value = null
    offset.x = 0
    offset.y = 0
  }

  function down(e: PointerEvent, id: string) {
    if (e.button > 0) return
    e.preventDefault()
    dragging.value = id
    moved = false
    startX = e.clientX
    startY = e.clientY
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
  }

  /** A place was tapped while a piece is chosen. */
  function tapPlace(target: string) {
    const id = selected.value
    if (id === null) return
    selected.value = null
    onDrop(id, target)
  }

  /** The keyboard's way to choose a piece (Enter or Space) without dragging it. */
  function toggleSelect(id: string) {
    selected.value = selected.value === id ? null : id
  }

  function dragStyle(id: string): Record<string, string> | undefined {
    if (dragging.value !== id) return undefined
    return { transform: `translate(${offset.x}px, ${offset.y}px) scale(1.08)`, zIndex: '30', pointerEvents: 'none', transition: 'none' }
  }

  onBeforeUnmount(stop)
  return { dragging, selected, down, tapPlace, toggleSelect, dragStyle }
}
