import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AppHomeView from '@/views/app/AppHomeView.vue'
import AppWelcomeView from '@/views/app/AppWelcomeView.vue'
import useUser, { isWeb } from '@/use/useUser'
import { prependBaseUrl } from '@/utils/function'

// Lazy-load the secondary app routes as well — AppHomeView stays eager
// because it's the landing route.
const AppReadView = () => import('@/views/app/AppReadView.vue')
const AppBooksView = () => import('@/views/app/AppBooksView.vue')
const AppBookPreviewView = () => import('@/views/app/AppBookPreviewView.vue')
const AppColoringBooksView = () => import('@/views/app/AppColoringBooksView.vue')
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
const AppPlusView = () => import('@/views/app/AppPlusView.vue')
const AppFeaturesView = () => import('@/views/app/AppFeaturesView.vue')
const AppVoicesView = () => import('@/views/app/AppVoicesView.vue')
const AppJournalView = () => import('@/views/app/AppJournalView.vue')
const AppFamilyQuizView = () => import('@/views/app/AppFamilyQuizView.vue')
const AppFamilyGamesView = () => import('@/views/app/AppFamilyGamesView.vue')
const AppFamilyActivityView = () => import('@/views/app/AppFamilyActivityView.vue')
const AppFamilyWhoView = () => import('@/views/app/AppFamilyWhoView.vue')
const AppFamilyOrderView = () => import('@/views/app/AppFamilyOrderView.vue')
const AppFamilyBingoView = () => import('@/views/app/AppFamilyBingoView.vue')
const AppFamilyMemoryView = () => import('@/views/app/AppFamilyMemoryView.vue')
const AppCollectionView = () => import('@/views/app/AppCollectionView.vue')
const AppGoodNightView = () => import('@/views/app/AppGoodNightView.vue')
const AppParentOverviewView = () => import('@/views/app/AppParentOverviewView.vue')

/**
 * Loads the screens that are opened from the bottom bar before they are asked for (a moment after the app has started, and not when
 * the device saves data), so that the first tap on "Abenteuer" or "Malen" does not have to wait for them.
 */
export function prefetchRoutes() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  if (saveData) return
  void AppAdventureHomeView()
  // the picture at the top of the adventure page is ready when the page opens
  new Image().src = prependBaseUrl('images/bg/abenteuer-reise.webp')
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
  // "Lesen": the front door with three areas — Stories (all-books), Books (printed books of the store) and Malbücher
  { path: '/app/read', name: 'app-read', component: AppReadView },
  { path: '/app/books', name: 'app-books', component: AppBooksView },
  // a look inside a printed book of the store (cover, sample pages, hint that it can be bought)
  { path: '/app/books/:bookId/vorschau', name: 'app-book-preview', component: AppBookPreviewView },
  // the whole digital book (bought in the app), read page by page; the same view as the preview
  { path: '/app/books/:bookId/lesen', name: 'app-book-read', component: AppBookPreviewView },
  { path: '/app/coloring-books', name: 'app-coloring-books', component: AppColoringBooksView },
  { path: '/app/all-books', name: 'app-all-books', component: AppAllBooksView },
  { path: '/app/new-books', name: 'app-all-new-books', component: AppAllNewBooksView },
  { path: '/app/series/:seriesId', name: 'app-series', component: AppBookSeriesView },
  { path: '/app/categories/:category', name: 'app-category', component: AppCategoryView },
  { path: '/app/book/:bookId', name: 'app-book', component: AppBookDetailView },
  { path: '/app/book/:bookId/reader', name: 'app-reader', component: AppReaderView },
  { path: '/app/hoeren', name: 'app-hoeren', component: AppHoerenView },
  // stories read aloud by the family into the microphone (grown-ups only, behind the parental gate)
  { path: '/app/familien-stimmen', name: 'app-voices', component: AppVoicesView },
  // the thank-you book: the child's own words and drawings, only on this device
  { path: '/app/dankbuch', name: 'app-journal', component: AppJournalView },
  // the games for the whole family (all on the device, nothing goes online): the page with the four games, and the games
  { path: '/app/familie', name: 'app-family', component: AppFamilyGamesView },
  // the quiz for the whole family in three forms (your progress, all questions, several phones with a round code)
  { path: '/app/familien-quiz', name: 'app-family-quiz', component: AppFamilyQuizView },
  { path: '/app/activity', name: 'app-family-activity', component: AppFamilyActivityView },
  { path: '/app/wer-bin-ich', name: 'app-family-who', component: AppFamilyWhoView },
  { path: '/app/reihenfolge', name: 'app-family-order', component: AppFamilyOrderView },
  { path: '/app/bibel-bingo', name: 'app-family-bingo', component: AppFamilyBingoView },
  { path: '/app/memory', name: 'app-family-memory', component: AppFamilyMemoryView },
  // the cabinet with the cups and the card album
  { path: '/app/sammlung', name: 'app-collection', component: AppCollectionView },
  { path: '/app/spielzimmer', name: 'app-gameroom', component: () => import('@/views/app/AppGameRoomView.vue') },
  { path: '/app/spiel/:gameId', name: 'app-big-game', component: () => import('@/views/app/AppBigGameView.vue') },
  // the good-night mode: a story with a timer and a darkening screen
  { path: '/app/gute-nacht', name: 'app-goodnight', component: AppGoodNightView },
  { path: '/app/awards', name: 'app-awards', component: AppAwardsView },
  { path: '/app/coloring', name: 'app-coloring', component: AppColoringView },
  { path: '/app/coloring/book/:bookId', name: 'app-coloring-book', component: AppColoringBookView },
  { path: '/app/adventure', name: 'app-adventure', component: AppAdventureHomeView },
  { path: '/app/adventure/:journeyId', name: 'app-adventure-map', component: AppAdventureView },
  // the statistics (opened from the cup on the map); the fixed word comes before the stage number
  { path: '/app/adventure/:journeyId/statistik', name: 'app-adventure-stats', component: AppAdventureStatsView },
  { path: '/app/adventure/:journeyId/:stageId', name: 'app-adventure-stage', component: AppAdventureStageView },
  { path: '/app/profile', name: 'app-profile', component: AppProfileView },
  { path: '/app/legal', name: 'app-legal', component: AppLegalView },
  { path: '/app/plus', name: 'app-plus', component: AppPlusView },
  { path: '/app/was-kann-lambking', name: 'app-features', component: AppFeaturesView },
  // the numbers for grown-ups (reached through the parents' window, behind the parental gate)
  { path: '/app/eltern', name: 'app-parents', component: AppParentOverviewView }
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