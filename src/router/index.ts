import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AppHomeView from '@/views/app/AppHomeView.vue'
import AppWelcomeView from '@/views/app/AppWelcomeView.vue'
import useUser, { isWeb } from '@/use/useUser'

// Lazy-load the secondary app routes as well — AppHomeView stays eager
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
const AppColoringBookView = () => import('@/views/app/AppColoringBookView.vue')
const AppAdventureHomeView = () => import('@/views/app/AppAdventureHomeView.vue')
const AppAdventureView = () => import('@/views/app/AppAdventureView.vue')
const AppAdventureStageView = () => import('@/views/app/AppAdventureStageView.vue')
const AppAdventureStatsView = () => import('@/views/app/AppAdventureStatsView.vue')
const AppProfileView = () => import('@/views/app/AppProfileView.vue')
const AppLegalView = () => import('@/views/app/AppLegalView.vue')

/**
 * Loads the screens that are opened from the bottom bar before they are asked for (a moment after the app has started, and not when
 * the device saves data), so that the first tap on "Abenteuer" or "Malen" does not have to wait for them.
 */
export function prefetchRoutes() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  if (saveData) return
  void AppAdventureHomeView()
  void AppAdventureView()
  void AppAdventureStageView()
  void AppAdventureStatsView()
  void AppColoringView()
}

/** The welcome screen was shown once (see AppWelcomeView). */
export const WELCOME_SEEN_KEY = 'lk-welcome-seen'
function welcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

const routes: RouteRecordRaw[] = [
  // The welcome screen is the front door of the very first launch only: its single CTA continues to `app-main` and
  // remembers that it was seen. Every later start (also after the app was left for a web page and is loaded again)
  // goes straight to the start page. Eager-loaded for the same reason AppHomeView is.
  { path: '/', name: 'main-menu', redirect: () => (welcomeSeen() ? '/app' : '/welcome') },
  { path: '/welcome', name: 'app-welcome', component: AppWelcomeView },
  { path: '/app', name: 'app-main', component: AppHomeView },
  { path: '/app/all-books', name: 'app-all-books', component: AppAllBooksView },
  { path: '/app/new-books', name: 'app-all-new-books', component: AppAllNewBooksView },
  { path: '/app/series/:seriesId', name: 'app-series', component: AppBookSeriesView },
  { path: '/app/categories/:category', name: 'app-category', component: AppCategoryView },
  { path: '/app/book/:bookId', name: 'app-book', component: AppBookDetailView },
  { path: '/app/book/:bookId/reader', name: 'app-reader', component: AppReaderView },
  { path: '/app/hoeren', name: 'app-hoeren', component: AppHoerenView },
  { path: '/app/awards', name: 'app-awards', component: AppAwardsView },
  { path: '/app/coloring', name: 'app-coloring', component: AppColoringView },
  { path: '/app/coloring/book/:bookId', name: 'app-coloring-book', component: AppColoringBookView },
  { path: '/app/adventure', name: 'app-adventure', component: AppAdventureHomeView },
  { path: '/app/adventure/:journeyId', name: 'app-adventure-map', component: AppAdventureView },
  // the statistics (opened from the cup on the map); the fixed word comes before the stage number
  { path: '/app/adventure/:journeyId/statistik', name: 'app-adventure-stats', component: AppAdventureStatsView },
  { path: '/app/adventure/:journeyId/:stageId', name: 'app-adventure-stage', component: AppAdventureStageView },
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

// A screen of the app is loaded when it is first opened. If the app was updated while it was open, the old file is gone and the
// tap seems to do nothing: the page is loaded again once (the new files come with it) and goes on to the screen that was wanted.
const CHUNK_ERROR = /dynamically imported module|importing a module script|Unable to preload|error loading dynamically|Failed to fetch/i
router.onError((error, to) => {
  if (!CHUNK_ERROR.test(String((error as Error)?.message ?? error))) return
  try {
    const last = Number(sessionStorage.getItem('lk-chunk-reload') ?? 0)
    if (Date.now() - last < 15000) return
    sessionStorage.setItem('lk-chunk-reload', String(Date.now()))
  } catch {
    // without storage the page may be loaded again more than once, which is harmless
  }
  window.location.hash = `#${to.fullPath}`
  window.location.reload()
})

export default router