/**
 * Keeps the picture of a game canvas from looking squeezed or stretched (Anton and a tester, 21.11.2026: Davids Schleuder on an iPhone). A canvas has a picture of its own size
 * (`width`, `height`) and a box that the page gives it; when the two do not have the same shape the browser stretches the picture into the box. That happens when a phone is turned
 * (the `resize` event comes before the page has the new size, on an iPhone especially), when the bars of the browser come or go, or when the window of a tablet is changed.
 * The game then has to make its picture new. This guard does that in every way the size can change:
 *   - the events `resize`, `orientationchange` and the visual viewport, each once at once and twice more a moment later (the new size is not there at the first call),
 *   - a `ResizeObserver` on the canvas,
 *   - a watch every quarter of a second (with `setInterval`, which also runs when the animation frames do not): when the box of the canvas has another size than the picture
 *     (times the density of the screen), or the window has another size than at the last look, the game is told to make its picture new.
 * Call it in `setup` of the game with the canvas and the function that sets the picture and everything that depends on it.
 */
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export const GUARD_WATCH_MS = 250

/** True when the picture of the canvas does not have the size of its box (times the density of the screen, at most 2 as in the games). */
export function canvasIsStale(cv: HTMLCanvasElement, rect: { width: number; height: number }, dpr: number): boolean {
  if (!(rect.width > 0) || !(rect.height > 0)) return false
  const d = Math.min(dpr || 1, 2)
  return Math.abs(Math.round(rect.width * d) - cv.width) > 1 || Math.abs(Math.round(rect.height * d) - cv.height) > 1
}

export interface CanvasGuardOptions {
  /** For a game whose picture does not follow the box (it has its own fixed size): says when the game must look again. */
  stale?: () => boolean
}

export default function useCanvasGuard(canvas: Ref<HTMLCanvasElement | null>, remake: () => void, options: CanvasGuardOptions = {}) {
  let timer: ReturnType<typeof setInterval> | undefined
  let later: ReturnType<typeof setTimeout>[] = []
  let observer: ResizeObserver | undefined
  let seen = ''

  const windowSize = () => `${window.innerWidth}x${window.innerHeight}|${window.visualViewport ? Math.round(window.visualViewport.width) + 'x' + Math.round(window.visualViewport.height) : ''}`

  function check() {
    const cv = canvas.value
    if (!cv) return
    const now = windowSize()
    const moved = now !== seen
    seen = now
    const stale = options.stale ? options.stale() : canvasIsStale(cv, cv.getBoundingClientRect(), window.devicePixelRatio)
    if (stale || moved) remake()
  }

  function soon() {
    check()
    for (const t of later) clearTimeout(t)
    later = [120, 450].map((ms) => setTimeout(check, ms))
  }

  onMounted(() => {
    seen = windowSize()
    window.addEventListener('resize', soon)
    window.addEventListener('orientationchange', soon)
    window.visualViewport?.addEventListener('resize', soon)
    if (typeof ResizeObserver !== 'undefined' && canvas.value) {
      observer = new ResizeObserver(() => check())
      observer.observe(canvas.value)
    }
    timer = setInterval(check, GUARD_WATCH_MS)
  })

  onBeforeUnmount(() => {
    clearInterval(timer)
    for (const t of later) clearTimeout(t)
    window.removeEventListener('resize', soon)
    window.removeEventListener('orientationchange', soon)
    window.visualViewport?.removeEventListener('resize', soon)
    observer?.disconnect()
  })

  return { check }
}
