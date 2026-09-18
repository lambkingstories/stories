/**
 * Shared bottom-nav config + routing helpers for every "app/*" view.
 * Centralises the 5-item LambKing nav (Start, Serien, Hören, Malen, Mein
 * Bereich) so each view only needs to call `useAppNav(t)` and pass the
 * returned `navItems` / `activeNav` / `onNav` into `<ZBottomNav>`.
 */
import { computed, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ComposerTranslation } from 'vue-i18n'

export type AppNavId = 'home' | 'series' | 'hoeren' | 'malen' | 'profile'

export interface AppNavItem {
  id: AppNavId
  label: string
  icon: 'home' | 'series' | 'headphones' | 'brush' | 'profile'
}

function routeToNav(name: string): AppNavId {
  if (name === 'app-main') return 'home'
  if (
    name === 'app-all-books'
    || name === 'app-book'
    || name === 'app-series'
    || name === 'app-all-new-books'
  ) return 'series'
  if (name === 'app-hoeren') return 'hoeren'
  if (name === 'app-coloring' || name === 'app-awards') return 'malen'
  if (name === 'app-profile' || name === 'app-legal') return 'profile'
  return 'home'
}

const ROUTE_BY_NAV: Record<AppNavId, string> = {
  home: 'app-main',
  series: 'app-all-books',
  hoeren: 'app-hoeren',
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
    { id: 'home', label: t('app.nav.home'), icon: 'home' },
    { id: 'series', label: t('app.nav.series'), icon: 'series' },
    // { id: 'hoeren', label: t('app.nav.hoeren'), icon: 'headphones' },
    { id: 'profile', label: t('app.nav.profile'), icon: 'profile' },
    { id: 'malen', label: t('app.nav.color'), icon: 'brush' },
  ])

  const activeNav = computed<string | number>(() => routeToNav(String(route.name || '')))

  function onNav(id: string | number) {
    const name = ROUTE_BY_NAV[id as AppNavId]
    if (name) router.push({ name })
  }

  return { navItems, activeNav, onNav }
}
