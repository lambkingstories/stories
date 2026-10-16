/**
 * Taps with a pen (Apple Pencil, S Pen) that the browser does not turn into a click. A pen tip moves a little when it is set
 * down, and then a tablet browser sometimes decides it was no tap at all: the button stays silent and the child has to try
 * again. Here a short touch of a button with the pen that stays on the same button counts as a tap: if the browser sent no
 * click by itself right after, one is sent.
 */

const INTERACTIVE = 'button, a[href], [role="button"], [role="menuitem"]'

const interactiveOf = (target: EventTarget | null): HTMLElement | null => (target instanceof Element ? target.closest<HTMLElement>(INTERACTIVE) : null)

const isDisabled = (el: HTMLElement) => (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true'

interface Options {
  /** How long to wait for the browser's own click, in milliseconds. */
  delay?: number
  /** How far the pen may move between touching down and lifting, in pixels. */
  slop?: number
}

/** Starts watching the window; the returned function stops it. */
export function installPenTaps(options: Options = {}): () => void {
  const delay = options.delay ?? 140
  const slop = options.slop ?? 24
  let down: { el: HTMLElement; x: number; y: number; id: number } | null = null
  let lastClick: { el: HTMLElement | null; at: number } = { el: null, at: 0 }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'pen') return
    const el = interactiveOf(e.target)
    down = el && !isDisabled(el) ? { el, x: e.clientX, y: e.clientY, id: e.pointerId } : null
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'pen' || !down || down.id !== e.pointerId) return
    const start = down
    down = null
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > slop) return
    const under = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(e.clientX, e.clientY) : null
    if (interactiveOf(under ?? e.target) !== start.el) return
    const since = performance.now()
    setTimeout(() => {
      // the browser sent its click: nothing to add
      if (lastClick.el === start.el && lastClick.at >= since - 1) return
      if (!start.el.isConnected || isDisabled(start.el)) return
      start.el.click()
    }, delay)
  }

  const onCancel = () => {
    down = null
  }

  const onClick = (e: Event) => {
    lastClick = { el: interactiveOf(e.target), at: performance.now() }
  }

  window.addEventListener('pointerdown', onDown, true)
  window.addEventListener('pointerup', onUp, true)
  window.addEventListener('pointercancel', onCancel, true)
  window.addEventListener('click', onClick, true)
  return () => {
    window.removeEventListener('pointerdown', onDown, true)
    window.removeEventListener('pointerup', onUp, true)
    window.removeEventListener('pointercancel', onCancel, true)
    window.removeEventListener('click', onClick, true)
  }
}
