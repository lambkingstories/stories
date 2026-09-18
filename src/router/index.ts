import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AppMainView from '@/views/app/AppMainView.vue'
import AppWelcomeView from '@/views/app/AppWelcomeView.vue'
import useUser, { isWeb } from '@/use/useUser'

// Lazy-loaded design-system routes. These views pull in every A/S/F atom
// for preview purposes, so we code-split them into their own chunks to
// keep them out of the main app bundle. Vite names the chunks via the
// magic comment so they're easy to identify in `vite build` output.
const DesignSystemView = () => import(/* webpackChunkName: "design-system" */ '@/views/DesignSystemView.vue')
const DesignSystemSView = () => import(/* webpackChunkName: "design-system-s" */ '@/views/DesignSystemSView.vue')
const DesignSystemAView = () => import(/* webpackChunkName: "design-system-a" */ '@/views/DesignSystemAView.vue')
const DesignSystemZView = () => import(/* webpackChunkName: "design-system-z" */ '@/views/DesignSystemZView.vue')

// Lazy-load the secondary app routes as well — AppMainView stays eager
// because it's the landing route.
const AppAllBooksView = () => import('@/views/app/AppAllBooksView.vue')
const AppAllNewBooksView = () => import('@/views/app/AppAllNewBooksView.vue')
const AppBookSeriesView = () => import('@/views/app/AppBookSeriesView.vue')
const AppCategoryView = () => import('@/views/app/AppCategoryView.vue')
const AppBookDetailView = () => import('@/views/app/AppBookDetailView.vue')
const AppReaderView = () => import('@/views/app/AppReaderView.vue')
const AppHoerenView = () => import('@/views/app/AppHoerenView.vue')
const AppAwardsView = () => import('@/views/app/AppAwardsView.vue')
const AppColoringView = () => import('@/views/app/AppColoringView.vue')
const AppProfileView = () => import('@/views/app/AppProfileView.vue')
const AppLegalView = () => import('@/views/app/AppLegalView.vue')

const routes: RouteRecordRaw[] = [
  // The welcome screen is the app's front door on every launch; its single
  // CTA continues to `app-main`. Eager-loaded for the same reason
  // AppMainView is — the landing route shouldn't wait on a chunk fetch.
  { path: '/', name: 'main-menu', redirect: '/welcome' },
  { path: '/welcome', name: 'app-welcome', component: AppWelcomeView },
  { path: '/design-system', name: 'design-system', component: DesignSystemView },
  { path: '/design-system-s', name: 'design-system-s', component: DesignSystemSView },
  { path: '/design-system-a', name: 'design-system-a', component: DesignSystemAView },
  { path: '/design-system-z', name: 'design-system-z', component: DesignSystemZView },
  { path: '/app', name: 'app-main', component: AppMainView },
  { path: '/app/all-books', name: 'app-all-books', component: AppAllBooksView },
  { path: '/app/new-books', name: 'app-all-new-books', component: AppAllNewBooksView },
  { path: '/app/series/:seriesId', name: 'app-series', component: AppBookSeriesView },
  { path: '/app/categories/:category', name: 'app-category', component: AppCategoryView },
  { path: '/app/book/:bookId', name: 'app-book', component: AppBookDetailView },
  { path: '/app/book/:bookId/reader', name: 'app-reader', component: AppReaderView },
  { path: '/app/hoeren', name: 'app-hoeren', component: AppHoerenView },
  { path: '/app/awards', name: 'app-awards', component: AppAwardsView },
  { path: '/app/coloring', name: 'app-coloring', component: AppColoringView },
  { path: '/app/profile', name: 'app-profile', component: AppProfileView },
  { path: '/app/legal', name: 'app-legal', component: AppLegalView }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

const remoteURL = import.meta.env.VITE_APP_REMOTE_URL
// --- THE ROUTER HOOK ---
router.beforeEach((to, from) => {
  const { userUnlocked, setSettingValue } = useUser()

  const url = window.location.href
  const storedUnlock: string = (localStorage.getItem('full_unlocked') as string)
  const parsedStoredUnlock: boolean = typeof storedUnlock === 'string' && storedUnlock?.length ? (JSON.parse(storedUnlock) as boolean) : false
  const isUnlocked = to.query.unlock === 'true' || to.query.unlocked === 'true' || from.query.unlocked === 'true' || parsedStoredUnlock === true

  // Only apply restrictions if it's the Web version
  if (isWeb) {
    const isFullVersion = url.includes(remoteURL + '/little-bible-stories/') && !url.includes('/little-bible-stories/demo/') && !url.includes('/little-bible-stories/develop/')
    const isDevelopVersion = url.includes(remoteURL + '/little-bible-stories/develop/')
    const isDev = url.includes('localhost:5173/')

    if (isDev) {
      return true
    }

    // If user is on Full or Develop without the unlock param, boot them to Demo
    if ((isFullVersion || isDevelopVersion) && !isUnlocked) {
      window.location.href = remoteURL + '/little-bible-stories/demo/'
      return false// Stop execution
    } else if (isUnlocked && (isFullVersion || isDevelopVersion)) {
      localStorage.setItem('full_unlocked', 'true')
    }
  }

  return true
})

export default router