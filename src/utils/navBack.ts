import type { RouteLocationRaw, Router } from 'vue-router'

/** The page before this one in the browser's history, as the router wrote it (`null` when this is the first page). */
export function previousPath(): string | null {
  const state = window.history.state as { back?: unknown } | null
  return typeof state?.back === 'string' ? state.back : null
}

/**
 * Goes to a page that this page was probably opened from. When the page before is that page, the way back is one real
 * step back (the history does not grow); otherwise this page is replaced by it, so a few "back" presses never end up
 * stepping through pages that were only a stop on the way.
 */
export function goBackTo(router: Router, to: RouteLocationRaw): void {
  const path = router.resolve(to).path
  const prev = previousPath()
  if (prev !== null && prev.split('?')[0] === path) router.back()
  else void router.replace(to)
}

/**
 * The way back to where the child really came from (Anton 22.11.2026): when there is a page before this one in the app, one real step back leads there, whatever it is (the start
 * page, a list, a book). Only when this is the first page (opened by a link, a reload) the page `fallback` takes its place. Used where a page can be reached from several
 * places, so that "back" does not throw the child into another part of the app (and the tab bar does not jump).
 */
export function goBackToOrigin(router: Router, fallback: RouteLocationRaw): void {
  if (previousPath() !== null) router.back()
  else void router.replace(fallback)
}
