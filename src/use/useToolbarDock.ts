/**
 * Where the tool bar of the coloring screen sits: at the left or the right screen edge, anywhere along it (a bar along the top or
 * bottom edge never fitted the tools and the phone's top bar). The grip of the bar
 * moves it as soon as it is dragged, the folded tab after a long press, and the grip's window moves it with one tap. The
 * place is remembered.
 */
import { computed, ref, type Ref } from 'vue'

export type DockEdge = 'left' | 'right'

export interface Dock {
  edge: DockEdge
  /** Position along the edge, 0–1. */
  pos: number
}

export const DOCK_KEY = 'lk-coloring-tools-dock'
const LONG_PRESS_MS = 450

const clampPos = (p: number) => Math.min(0.92, Math.max(0.08, p))

/**
 * The saved place, or the left edge in the middle when there is none (or it is damaged). A bar that was saved at the top or the
 * bottom (an older version allowed that) goes to the side that is nearer to where it was along the edge.
 */
export function parseDock(raw: string | null): Dock {
  try {
    const d = JSON.parse(raw ?? 'null') as Partial<Dock> | null
    if (d && typeof d.pos === 'number' && Number.isFinite(d.pos)) {
      if (d.edge === 'left' || d.edge === 'right') return { edge: d.edge, pos: clampPos(d.pos) }
      if (d.edge === 'top' || d.edge === 'bottom') return { edge: d.pos < 0.5 ? 'left' : 'right', pos: 0.5 }
    }
  } catch {
    // fall through to the default
  }
  return { edge: 'left', pos: 0.5 }
}

/** The place for a bar that was let go at (x, y) on a screen of w × h: the side it is nearer to, and how far down. */
export function nearestDock(x: number, y: number, w: number, h: number): Dock {
  return { edge: x < w / 2 ? 'left' : 'right', pos: clampPos(y / h) }
}

interface Options {
  /** Room the colour box takes at the bottom edge, in pixels. */
  room: () => number
  fullscreen: Ref<boolean>
}

export function useToolbarDock(opts: Options) {
  const dock = ref<Dock>(parseDock(safeGet()))
  /** While the bar is carried: where the finger is. */
  const carry = ref<{ x: number; y: number } | null>(null)
  /** The bar was just carried: the click that follows must not open anything. */
  const justCarried = ref(false)

  let pressTimer: ReturnType<typeof setTimeout> | undefined
  let pressFrom: { x: number; y: number; id: number; immediate: boolean } | null = null
  let suppressClick = false

  function safeGet(): string | null {
    try {
      return localStorage.getItem(DOCK_KEY)
    } catch {
      return null
    }
  }

  function save() {
    try {
      localStorage.setItem(DOCK_KEY, JSON.stringify(dock.value))
    } catch {
      // not remembered in a private window
    }
  }

  /** How the bar is placed: how far along its edge, and the room of the colour box and of the top bar. */
  const toolbarStyle = computed<Record<string, string>>(() => {
    const style: Record<string, string> = {
      '--pos': String(dock.value.pos),
      '--lift': `${opts.room()}px`,
      '--top': opts.fullscreen.value ? '0px' : '52px'
    }
    // carried: the anchor is the finger itself
    if (carry.value) Object.assign(style, { '--pos': '0', left: `${carry.value.x}px`, top: `${carry.value.y}px`, right: 'auto', bottom: 'auto' })
    return style
  })

  function clearPress() {
    clearTimeout(pressTimer)
    pressTimer = undefined
  }

  function startCarry(e: PointerEvent, x: number, y: number, buzz: number) {
    carry.value = { x, y }
    suppressClick = true
    try {
      ;(e.currentTarget as Element | null)?.setPointerCapture?.(e.pointerId)
    } catch {
      // the finger is still followed by the move events of the button
    }
    navigator.vibrate?.(buzz)
  }

  function onHandleDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const target = e.currentTarget as Element | null
    // the grip moves the bar as soon as it is dragged; the folded tab needs a long press (a tap opens the bar)
    pressFrom = { x: e.clientX, y: e.clientY, id: e.pointerId, immediate: !!target?.classList.contains('tb-grip') }
    clearPress()
    pressTimer = setTimeout(() => {
      if (!pressFrom) return
      carry.value = { x: pressFrom.x, y: pressFrom.y }
      suppressClick = true
      try {
        target?.setPointerCapture?.(pressFrom.id)
      } catch {
        // the finger is still followed by the move events of the button
      }
      navigator.vibrate?.(15)
    }, LONG_PRESS_MS)
  }

  function onHandleMove(e: PointerEvent) {
    if (!pressFrom) return
    if (carry.value) {
      carry.value = { x: e.clientX, y: e.clientY }
      return
    }
    const moved = Math.hypot(e.clientX - pressFrom.x, e.clientY - pressFrom.y)
    if (pressFrom.immediate && moved > 8) {
      clearPress()
      startCarry(e, e.clientX, e.clientY, 10)
      return
    }
    // moving before the press was long enough: just a swipe, no carrying
    if (moved > 10) clearPress()
  }

  function onHandleUp(e: PointerEvent) {
    clearPress()
    pressFrom = null
    if (!carry.value) return
    // the click that follows a carried button is swallowed; if none comes, the next real tap must still work
    setTimeout(() => {
      suppressClick = false
    }, 80)
    dock.value = nearestDock(e.clientX, e.clientY, window.innerWidth, window.innerHeight)
    carry.value = null
    justCarried.value = true
    setTimeout(() => (justCarried.value = false), 150)
    save()
  }

  /** The two sides of the screen, to put the bar there with one tap. */
  function setDock(edge: DockEdge) {
    dock.value = { edge, pos: 0.5 }
    save()
  }

  /** True once after a carried tab: its click must not open the bar. */
  function swallowCarryClick(): boolean {
    if (!suppressClick) return false
    suppressClick = false
    return true
  }

  return { dock, carry, justCarried, toolbarStyle, onHandleDown, onHandleMove, onHandleUp, setDock, swallowCarryClick }
}
