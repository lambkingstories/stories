import { onBeforeUnmount, onMounted } from 'vue'

/**
 * JS-side replacement for the failed `overscroll-behavior` CSS attempt.
 *
 * Pull-to-refresh fires when the user touches a scroll container that's
 * already at scrollTop=0 and drags downward — the browser interprets the
 * "would-be overscroll" as a refresh request. We intercept the touchmove
 * event at document level and `preventDefault()` it when, and only when:
 *
 *   1. the document is scrolled to the top (`window.scrollY === 0`), and
 *   2. the finger is moving downward (`deltaY > 0`), and
 *   3. no ancestor of the touch target is itself a scroll container with
 *      headroom to absorb the gesture (`scrollTop > 0`).
 *
 * Condition 3 is what kept the previous CSS fix from working — blanket
 * `overscroll-behavior` on body broke the inner reader scroller. Walking
 * up from the touch target lets every inner scroller keep its native
 * scroll behaviour while still killing the document-level refresh.
 *
 * The handler is mounted on `document` so it covers every view in the
 * SPA. The touch coordinates are tracked on `window` instead of in a
 * closure so a touchmove that arrives without a matching touchstart
 * (rare, but possible during routing transitions) doesn't leak stale
 * deltas.
 */
export function useBlockPullToRefresh(): void {
  let startY = 0
  let startX = 0

  const onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length !== 1) return
    startY = e.touches[0]!.clientY
    startX = e.touches[0]!.clientX
  }

  const onTouchMove = (e: TouchEvent): void => {
    // Only single-finger drags can trigger pull-to-refresh; multi-touch
    // is handled by the pinch blocker elsewhere in App.vue.
    if (e.touches.length !== 1) return

    // Document already scrolled past the top — this is a normal scroll
    // gesture, never a refresh.
    if (window.scrollY > 0) return

    const dy = e.touches[0]!.clientY - startY
    if (dy <= 0) return // Finger moving up → not a refresh attempt.
    // A mostly sideways swipe (a map, a slider) is no refresh gesture: cancelling it made such swipes stop at the first
    // little downward drift of the finger.
    if (Math.abs(e.touches[0]!.clientX - startX) >= dy) return

    // Walk from the touch target up to <body>. If any ancestor is a
    // scroll container that's scrolled past its top, the browser will
    // give that container the event (scroll up inside it) instead of
    // chaining to the document. Don't preventDefault in that case —
    // we'd freeze the user's legitimate scroll.
    let el: HTMLElement | null = e.target as HTMLElement | null
    while (el && el !== document.body) {
      if (el.scrollTop > 0) return
      el = el.parentElement
    }

    e.preventDefault()
  }

  onMounted(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    // Must be non-passive for preventDefault() to actually cancel the
    // browser's overscroll/refresh action.
    document.addEventListener('touchmove', onTouchMove, { passive: false })
  })

  onBeforeUnmount(() => {
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove', onTouchMove)
  })
}

export default useBlockPullToRefresh
