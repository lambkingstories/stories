/**
 * Shared bottom-nav config + routing helpers for every "app/*" view.
 * Centralises the 5-item LambKing nav (Start, Lesen, Abenteuer, Malen, Ich) so each view only needs to call `useAppNav(t)` and pass the
 * returned `navItems` / `activeNav` / `onNav` into `<ZBottomNav>`.
 */
import { computed, ref, type ComputedRef } from 'vue'
import { useRoute, useRouter, type RouteLocationNormalized, type Router } from 'vue-router'
import type { ComposerTranslation } from 'vue-i18n'
import { prependBaseUrl } from '@/utils/function'

export type AppNavId = 'home' | 'series' | 'abenteuer' | 'malen' | 'profile'

export interface AppNavItem {
  id: AppNavId
  label: string
  icon: 'home' | 'series' | 'compass' | 'headphones' | 'brush' | 'profile'
  /** A painted (coloured) picture instead of the tinted icon, for the highlight of the app. */
  image?: string
}

/** The painted symbols of the app (the same ones are on the start page): start, lesen, abenteuer, malen, ich, pokal, plus. */
const symbol = (name: string) => prependBaseUrl(`images/icons/navi/${name}.webp`)

export function routeToNav(name: string, query?: Record<string, unknown>): AppNavId {
  if (name === 'app-main') return 'home'
  if (
    name === 'app-read'
    || name === 'app-books'
    || name === 'app-book-preview'
    || name === 'app-book-read'
    || name === 'app-all-books'
    || name === 'app-book'
    || name === 'app-series'
    || name === 'app-all-new-books'
  ) return 'series'
  if (name === 'app-adventure' || name === 'app-adventure-map' || name === 'app-adventure-stage' || name === 'app-adventure-stats' || name === 'app-family-quiz' || name === 'app-family-activity' || name === 'app-family-who' || name === 'app-family-order' || name === 'app-family-bingo' || name === 'app-family-memory' || name === 'app-family-wortreise') return 'abenteuer'
  // the good-night stories belong to "Lesen"
  if (name === 'app-goodnight') return 'series'
  // the coloring books: the door in "Lesen" leads there with `?from=read`, and then the tab bar keeps "Lesen" (Anton 22.11.2026); from "Malen" it shows "Malen"
  if (name === 'app-coloring-books' || name === 'app-coloring-book') return query?.from === 'read' ? 'series' : 'malen'
  if (name === 'app-coloring') return 'malen'
  if (name === 'app-profile' || name === 'app-legal' || name === 'app-plus' || name === 'app-awards' || name === 'app-parents' || name === 'app-collection' || name === 'app-gameroom' || name === 'app-games-adventure' || name === 'app-games-stage' || name === 'app-family' || name === 'app-journal' || name === 'app-voices') return 'profile'
  return 'home'
}

// ── Which tab is lit (Anton 22.11.2026) ─────────────────────────────────────────────────────────────────────────────────────────
// The tab bar follows the way the child went, not the page it is on: a page that is opened from "Start" keeps "Start" lit, one that is opened from "Lesen" keeps "Lesen", and so on.
// The tab changes only (1) when a tab is tapped, and (2) when a place is entered that belongs to a tab by itself: the painting screen (Malen), the adventure map and its stages
// (Abenteuer). Going back lights the tab that was lit on that page before. A page that is opened directly (the address, a reload) has the tab that its kind belongs to.

/** The places that belong to a tab by themselves. */
export const OWN_TAB: Readonly<Record<string, AppNavId>> = {
  'app-main': 'home',
  'app-read': 'series',
  'app-adventure': 'abenteuer',
  'app-adventure-map': 'abenteuer',
  'app-adventure-stage': 'abenteuer',
  'app-adventure-stats': 'abenteuer',
  'app-coloring': 'malen',
  'app-profile': 'profile'
}

/** The lists of the area "Lesen" that a book of "New for you" opens. */
export const ASKED_LISTS: readonly string[] = ['app-all-books', 'app-books', 'app-coloring-books']

/**
 * The tab of a page that is entered. `previous` is the tab that was lit on the page the child comes from (none when the app has just been opened), `remembered` the tab this
 * very page had when it was shown before (going back or forward in the history).
 */
export function decideNav(name: string, query: Record<string, unknown> | undefined, previous: AppNavId | null, remembered: AppNavId | null): AppNavId {
  const own = OWN_TAB[name]
  if (own) return own
  // a book of "New for you" opens the list of its area with `?book=<id>`: that is "Lesen" (the child has gone over to the books), and it stays there (Anton 22.11.2026)
  if (ASKED_LISTS.includes(name) && query?.book) return 'series'
  return remembered ?? previous ?? routeToNav(name, query)
}

/** The tab that is lit now; `null` until the first page is entered (then the kind of the page decides, see `routeToNav`). */
export const contextNav = ref<AppNavId | null>(null)
const visited = new Map<number, { path: string; nav: AppNavId }>()
let tracked = false

/** Starts to follow the way through the app (once). */
export function trackNav(router: Router): void {
  if (tracked) return
  tracked = true
  // where in the history the page stands: the browser says it (`state.position`); a history without that (the one of the tests) is counted by hand
  let counted = 0
  let popDelta: number | null = null
  // the first page may be entered already (the app starts before this runs): its tab is the one of its kind
  const here = router.currentRoute.value
  if (here.name) {
    counted = 1
    const nav = decideNav(String(here.name), here.query, null, null)
    contextNav.value = nav
    const given = (router.options.history.state as { position?: number } | undefined)?.position
    visited.set(typeof given === 'number' ? given : counted, { path: here.fullPath, nav })
  }
  router.options.history.listen((_to, _from, info) => {
    popDelta = info.delta
  })
  router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    counted = popDelta !== null ? counted + popDelta : counted + 1
    popDelta = null
    const given = (router.options.history.state as { position?: number } | undefined)?.position
    const position = typeof given === 'number' ? given : counted
    const seen = visited.get(position)
    const remembered = seen && seen.path === to.fullPath ? seen.nav : null
    const nav = decideNav(String(to.name ?? ''), to.query, from.name ? contextNav.value : null, remembered)
    contextNav.value = nav
    visited.set(position, { path: to.fullPath, nav })
  })
}

/** For the tests: forget the way. */
export function resetNavTracking(): void {
  contextNav.value = null
  visited.clear()
  tracked = false
}

const ROUTE_BY_NAV: Record<AppNavId, string> = {
  home: 'app-main',
  series: 'app-read',
  abenteuer: 'app-adventure',
  malen: 'app-coloring',
  profile: 'app-profile'
}

export default function useAppNav(t: ComposerTranslation): {
  navItems: ComputedRef<AppNavItem[]>
  activeNav: ComputedRef<string | number>
  onNav: (id: string | number) => void
} {
  const route = useRoute()
  const router = useRouter()

  const navItems = computed<AppNavItem[]>(() => [
    { id: 'home', label: t('app.nav.home'), icon: 'home', image: symbol('start') },
    { id: 'series', label: t('app.nav.series'), icon: 'series', image: symbol('lesen') },
    { id: 'abenteuer', label: t('app.nav.abenteuer'), icon: 'compass', image: symbol('abenteuer') },
    { id: 'malen', label: t('app.nav.color'), icon: 'brush', image: symbol('malen') },
    { id: 'profile', label: t('app.nav.profile'), icon: 'profile', image: symbol('ich') },
  ])

  const activeNav = computed<string | number>(() => contextNav.value ?? routeToNav(String(route.name || ''), route.query))

  function onNav(id: string | number) {
    const name = ROUTE_BY_NAV[id as AppNavId]
    if (name) router.push({ name })
  }

  return { navItems, activeNav, onNav }
}
