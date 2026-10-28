<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { orientation } from '@/use/useUser'
import { mobileCheck } from '@/utils/function'
import { useMusic } from '@/use/useSound'
import { useExtensionGuard } from '@/use/useExtensionGuard'
import { useBlockPullToRefresh } from '@/use/useBlockPullToRefresh'
import { windowWidth, windowHeight } from '@/use/useUser'
import useUser from '@/use/useUser'
import useCheats from '@/use/useCheats'
import useAssets from '@/use/useAssets'
import useAppNav from '@/use/useAppNav'
import ZBottomNav from '@/components/atoms/ZBottomNav.vue'
import useChrome from '@/use/useChrome'
import ParentalGateModal from '@/components/molecules/ParentalGateModal.vue'
import PremiumSheet from '@/components/molecules/PremiumSheet.vue'
import { GAME_USER_LANGUAGE } from '@/utils/constants.ts'
import { setAdventureLanguage } from '@/use/adventureLanguage'

const { initMusic, pauseMusic, continueMusic } = useMusic()
const { userLanguage } = useUser()
const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

// A screen that has to be loaded first leaves the tap without any answer for a moment: a thin gold bar at the top shows that it was
// understood (only when it takes longer than a blink).
const navigating = ref(false)
let navTimer: ReturnType<typeof setTimeout> | undefined
const stopNavBar = () => {
  clearTimeout(navTimer)
  navigating.value = false
}

// ── How a screen changes ──────────────────────────────────────────────────────────────────────────────────────────────────────
// Like on the iPhone: the main tabs fade into each other, going deeper pushes the new screen in from the right (the old one
// moves a little to the left), going back slides the top screen away to the right. No bounce, no scaling, so nothing wobbles.
type Motion = 'nav-fade' | 'nav-push' | 'nav-back'
const MOTION_MS: Record<Motion, number> = { 'nav-fade': 200, 'nav-push': 380, 'nav-back': 380 }
const motion = ref<Motion>('nav-fade')

const DEPTH: Record<string, number> = {
  'app-main': 0, 'app-read': 0, 'app-hoeren': 0, 'app-adventure': 0, 'app-profile': 0, 'app-coloring': 0,
  'app-books': 1, 'app-coloring-books': 1, 'app-reach-kids': 1, 'app-reach-kids-book': 2, 'app-book-preview': 2, 'app-all-books': 1, 'app-all-new-books': 1, 'app-category': 1, 'app-awards': 1,
  'app-legal': 1, 'app-adventure-map': 1, 'app-coloring-book': 1,
  'app-series': 2, 'app-book': 2, 'app-adventure-stage': 2, 'app-adventure-stats': 2,
  'app-reader': 3
}
// the painting program is a main tab, but a picture inside it (opened with a query) is a deeper screen
const depthOf = (r: { name?: unknown; query: Record<string, unknown> }): number =>
  r.name === 'app-coloring' && Object.keys(r.query).length ? 3 : (DEPTH[String(r.name ?? '')] ?? 1)

// the position of the page in the browser history tells a step back (the position gets smaller) from a step forward
const historyPosition = (): number => {
  const pos = (window.history.state as { position?: number } | null)?.position
  return typeof pos === 'number' ? pos : 0
}
let lastPosition = historyPosition()
// where each screen was scrolled to, so that going back lands on the same spot
const scrollOf = new Map<string, number>()
let restoreY = 0
let tabTapped = false
try {
  window.history.scrollRestoration = 'manual'
} catch { /* not available */ }

router.beforeEach((to, from) => {
  clearTimeout(navTimer)
  navTimer = setTimeout(() => (navigating.value = true), 90)
  scrollOf.set(from.fullPath, window.scrollY)
  const stepBack = historyPosition() < lastPosition
  const stepForward = historyPosition() > lastPosition
  if (!from.name) motion.value = 'nav-fade'
  else if (from.name === 'app-coloring' && to.name === 'app-coloring') motion.value = 'nav-fade'
  else if (tabTapped) motion.value = 'nav-fade'
  // a wide window (computer, tablet lying down): a whole screen sliding sideways looks restless, so the screens melt into each other
  else if (window.innerWidth >= 900) motion.value = 'nav-fade'
  else if (stepBack) motion.value = 'nav-back'
  else if (!stepForward && depthOf(to) < depthOf(from)) motion.value = 'nav-back'
  else motion.value = 'nav-push'
  restoreY = motion.value === 'nav-back' ? (scrollOf.get(to.fullPath) ?? 0) : 0
  return true
})
router.afterEach(() => {
  stopNavBar()
  lastPosition = historyPosition()
  tabTapped = false
})
router.onError(() => {
  stopNavBar()
  tabTapped = false
})

// The leaving screen stays exactly where the child saw it (it is taken out of the flow, the page scroll jumps back to the top).
function onBeforeLeave(el: Element) {
  ;(el as HTMLElement).style.top = `${-window.scrollY}px`
  // both screens lie on top of each other and the page would shrink to the window height for a moment: the bar for scrolling
  // would jump up and down. The page keeps its height until the new screen has arrived.
  const root = document.getElementById('app-root')
  if (root) root.style.minHeight = `${Math.max(window.innerHeight, document.documentElement.scrollHeight)}px`
}
function releaseHeight() {
  const root = document.getElementById('app-root')
  if (root) root.style.minHeight = ''
}
// The entering screen starts at the top, or, when going back, at the spot where the child left it.
function onBeforeEnter(el: Element) {
  if (restoreY > 0) (el as HTMLElement).style.top = `${-restoreY}px`
  else window.scrollTo(0, 0)
}
function onEnterDone(el: Element) {
  const node = el as HTMLElement
  releaseHeight()
  node.style.top = ''
  if (restoreY > 0) {
    window.scrollTo(0, restoreY)
    restoreY = 0
  }
}

const { navItems, activeNav, onNav: goToTab } = useAppNav(t)
// the tab bar fades, it never pushes
const onNav = (id: string | number) => {
  tabTapped = true
  goToTab(id)
}

// Routes that render the shared ZBottomNav. Keeping the nav rendered at
// the App level (outside the page-swipe transition wrapper) means it
// stays mounted when navigating between any two of these routes, so it
// no longer slides off-screen with the leaving page only to fly back in
// with the entering one.
const NAV_ROUTES = new Set([
  'app-main',
  'app-read',
  'app-books',
  'app-coloring-books',
  'app-reach-kids',
  'app-all-books',
  'app-all-new-books',
  'app-series',
  'app-book',
  'app-hoeren',
  'app-profile',
  'app-adventure',
  'app-adventure-map',
  'app-adventure-stage',
  'app-legal',
  'app-awards'
])
const { coloringMenuShown } = useChrome()
const showAppNav = computed(() => NAV_ROUTES.has(String(route.name || '')) || (route.name === 'app-coloring' && coloringMenuShown.value))

// Keep i18n locale + localStorage in sync with the user's stored language.
// IDB seeds `userLanguage` after boot, so `immediate: true` updates the
// already-mounted i18n to whatever was last persisted.
watch(userLanguage, (v) => {
  if (!v) return
  if (locale.value !== v) locale.value = v as any
  try {
    localStorage.setItem(GAME_USER_LANGUAGE, v)
  } catch { /* quota / disabled */
  }
}, { immediate: true })
// the texts of the adventures (stories, questions, hints, recordings) follow the language of the app
watch(locale, (v) => setAdventureLanguage(String(v)), { immediate: true })
useExtensionGuard()
useCheats()
// Kill the browser's pull-to-refresh gesture without touching scroll CSS.
// The earlier overscroll-behavior approach broke document scrolling on the
// Tauri WebView; the JS handler walks up from the touch target so inner
// scroll containers keep their native behaviour while the document itself
// can no longer overscroll-down to trigger a refresh.
useBlockPullToRefresh()
const { resourceCache } = useAssets()


// initMusic('adventure_main-menu.mp3')

const portraitQuery = window.matchMedia('(orientation: portrait)')
const onTouchStart = (event: any) => {
  if (event.touches.length > 1) {
    event.preventDefault() // Block multitouch (pinch)
  }
}

const onGestureStart = (event: any) => {
  event.preventDefault() // Block specific Safari zoom gestures
}
const onOrientationChange = (event: any) => {
  if (event.matches) {
    orientation.value = 'portrait'
  } else {
    orientation.value = 'landscape'
  }
}

const onContextMenu = (event: any) => {
  event.preventDefault() // Block right-click context menu
}

const handleVisibilityChange = async () => {
  try {
    if (document.hidden) {
      pauseMusic()
      // console.log('App moved to background - Pausing Music')
    } else {
      continueMusic()
      // console.log('App back in focus - Resuming Music')
    }
  } catch (error) {
    // console.log('error: ', error)
  }
}

const updateGlobalDimensions = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
  orientation.value = mobileCheck() && windowWidth.value > windowHeight.value ? 'landscape' : 'portrait'
}

const dimensionsInterval = ref<any | null>(null)
// Ensure listeners are active
const delayedUpdateGlobalDimensions = () => setTimeout(updateGlobalDimensions, 300)
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateGlobalDimensions)

    dimensionsInterval.value = setInterval(() => {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }, 400)
    window.addEventListener('orientationchange', delayedUpdateGlobalDimensions)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
})
onUnmounted(() => {
  window.removeEventListener('resize', updateGlobalDimensions)
  window.removeEventListener('orientationchange', delayedUpdateGlobalDimensions)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  clearInterval(dimensionsInterval.value)
})

onMounted(() => {
  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('touchstart', onTouchStart, { passive: false })
  document.addEventListener('gesturestart', onGestureStart)
  portraitQuery.addEventListener('change', onOrientationChange)
})
onUnmounted(() => {
  document.removeEventListener('contextmenu', onContextMenu)
  document.removeEventListener('touchstart', onTouchStart)
  document.removeEventListener('gesturestart', onGestureStart)
  portraitQuery.removeEventListener('change', onOrientationChange)
})

function isCrazyGamesUrl() {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  const idx = parts.indexOf('crazygames')
  return idx !== -1 && idx >= parts.length - 3
}

</script>

<template lang="pug">
  //- `w-full`, not `w-screen`: WKWebView can keep a stale `100vw` after the
  //- window resizes (iPad Split View → full screen), which left every page
  //- at the old half width while fixed layers already spanned the screen.
  div(id="app-root").min-h-screen.w-full.app-container.root-protection.game-ui-immune.relative
    div(v-if="navigating" class="nav-bar" role="progressbar" aria-busy="true")
    RouterView(v-slot="{ Component, route }")
      transition(
        :name="motion"
        :duration="MOTION_MS[motion]"
        appear
        @before-leave="onBeforeLeave"
        @before-enter="onBeforeEnter"
        @after-enter="onEnterDone"
        @enter-cancelled="onEnterDone"
      )
        component(:is="Component" :key="route.fullPath")

    //- Shared bottom nav lives outside the page-swipe <transition> so it
    //- stays mounted while the underlying pages slide past each other.
    //- The active dot still updates immediately from the route name.
    ZBottomNav(
      v-if="showAppNav"
      :items="navItems"
      :model-value="activeNav"
      @update:model-value="onNav"
    )

    //- One shared parental-gate dialog, opened from anywhere via requireParent().
    ParentalGateModal
    //- "LambKing Plus" hint for locked features; only reachable with VITE_PREMIUM_TEASER=true.
    PremiumSheet
</template>

<style lang="sass">
// the thin bar at the top while a screen is being loaded
.nav-bar
  position: fixed
  top: 0
  left: 0
  height: 4px
  width: 100%
  z-index: 500
  background: linear-gradient(90deg, #ffe38a, #d4a83e, #ffe38a)
  background-size: 200% 100%
  transform-origin: left
  animation: nav-bar-run 1.6s ease-out forwards, nav-bar-shine 1s linear infinite
  pointer-events: none

@keyframes nav-bar-run
  from
    transform: scaleX(0.05)
  to
    transform: scaleX(0.92)

@keyframes nav-bar-shine
  to
    background-position: -200% 0

*
  font-family: 'Source Sans 3', 'Nunito', system-ui, sans-serif
  user-select: none
  // Standard
  -webkit-user-select: none
  // Safari
  -moz-user-select: none
  // Firefox
  -ms-user-select: none
  // IE10+

  // Optional: prevent the "tap highlight" color on mobile
  -webkit-tap-highlight-color: transparent

img
  pointer-events: none

// The root sits behind the page-pop-scale transition. During the scale-down
// the entering page is smaller than the viewport, so whatever lives behind
// it (body / WebView default) becomes visible at the edges. Pin it to the
// palette's beige so the gap blends with the app pages instead of flashing
// black/blue on Tauri.
#app-root
  background-color: var(--color-bg-main)
  // the pages slide sideways: what sticks out must not widen the page (that made the screen shiver)
  overflow-x: clip

// ----- Screen changes (like on the iPhone) -----
// Both screens lie on top of each other while they change (taken out of the flow; the leaving one keeps its scroll spot, see
// `onBeforeLeave`). The shared ZBottomNav lives outside the <transition>, so it never moves. The screens that slide get a solid
// background (the page background of the day/night theme), so the one below never shows through. Only transform and opacity
// are animated, that is smooth on every phone. #app-root clips the sideways overflow, so no sideways scrollbar flickers.
.nav-fade-enter-active, .nav-fade-leave-active,
.nav-push-enter-active, .nav-push-leave-active,
.nav-back-enter-active, .nav-back-leave-active
  position: absolute
  top: 0
  left: 0
  width: 100%
  will-change: transform, opacity
  backface-visibility: hidden

// the main tabs: the new screen fades in over the old one (which stays until it is covered)
.nav-fade-enter-active
  z-index: 2
  background: var(--lk-bg, var(--color-bg-main))
  animation: nav-fade-in 200ms ease-out both

.nav-fade-leave-active
  z-index: 1

// going deeper: the new screen pushes in from the right, the old one moves a little to the left
.nav-push-enter-active
  z-index: 2
  background: var(--lk-bg, var(--color-bg-main))
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.16)
  animation: nav-push-in 380ms cubic-bezier(0.32, 0.72, 0, 1) both

.nav-push-leave-active
  z-index: 1
  animation: nav-push-out 380ms cubic-bezier(0.32, 0.72, 0, 1) both

// going back: the top screen slides away to the right, the screen below moves back from the left
.nav-back-enter-active
  z-index: 1
  animation: nav-back-in 380ms cubic-bezier(0.32, 0.72, 0, 1) both

.nav-back-leave-active
  z-index: 2
  background: var(--lk-bg, var(--color-bg-main))
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.16)
  animation: nav-back-out 380ms cubic-bezier(0.32, 0.72, 0, 1) both

@keyframes nav-fade-in
  from
    opacity: 0
  to
    opacity: 1

@keyframes nav-push-in
  from
    transform: translate3d(100%, 0, 0)
  to
    transform: translate3d(0, 0, 0)

@keyframes nav-push-out
  from
    transform: translate3d(0, 0, 0)
  to
    transform: translate3d(-24%, 0, 0)

@keyframes nav-back-in
  from
    transform: translate3d(-24%, 0, 0)
  to
    transform: translate3d(0, 0, 0)

@keyframes nav-back-out
  from
    transform: translate3d(0, 0, 0)
  to
    transform: translate3d(100%, 0, 0)

// whoever wants less movement gets a short fade instead of the sliding
@media (prefers-reduced-motion: reduce)
  .nav-push-enter-active,
  .nav-back-enter-active
    animation: nav-fade-in 150ms ease-out both
    box-shadow: none
    background: var(--lk-bg, var(--color-bg-main))
    z-index: 2

  .nav-push-leave-active,
  .nav-back-leave-active
    animation: none
    box-shadow: none
    z-index: 1

// ----- Extra playful transitions -----
// 1. Balloon bounce — drops in from above with a squash-and-stretch bounce
.page-balloon-enter-active
  animation: page-balloon-in 820ms cubic-bezier(0.34, 1.56, 0.64, 1) both
  transform-origin: top center

.page-balloon-leave-active
  animation: page-balloon-out 380ms ease-in both
  transform-origin: top center

@keyframes page-balloon-in
  0%
    opacity: 0
    transform: translateY(-120%) scaleY(1.25) scaleX(0.78)
  50%
    opacity: 1
    transform: translateY(6%) scaleY(0.82) scaleX(1.18)
  70%
    transform: translateY(-3%) scaleY(1.08) scaleX(0.95)
  85%
    transform: translateY(1%) scaleY(0.96) scaleX(1.03)
  100%
    opacity: 1
    transform: translateY(0) scaleY(1) scaleX(1)

@keyframes page-balloon-out
  0%
    opacity: 1
    transform: translateY(0) scale(1)
  100%
    opacity: 0
    transform: translateY(120%) scale(0.85)

// 2. Swoosh slide — whooshes in from the right with a slight tilt
.page-swoosh-enter-active
  animation: page-swoosh-in 620ms cubic-bezier(0.22, 1.2, 0.36, 1) both

.page-swoosh-leave-active
  animation: page-swoosh-out 380ms cubic-bezier(0.5, 0, 0.75, 0) both

@keyframes page-swoosh-in
  0%
    opacity: 0
    transform: translateX(110%) rotate(6deg) skewX(-6deg)
  60%
    opacity: 1
    transform: translateX(-3%) rotate(-1deg) skewX(1deg)
  100%
    opacity: 1
    transform: translateX(0) rotate(0) skewX(0)

@keyframes page-swoosh-out
  0%
    opacity: 1
    transform: translateX(0) rotate(0)
  100%
    opacity: 0
    transform: translateX(-50%) rotate(-4deg) skewX(4deg)

// 3. Spin pop — rotates in like a coin flip with a pop
.page-spin-enter-active
  animation: page-spin-in 760ms cubic-bezier(0.34, 1.56, 0.64, 1) both

.page-spin-leave-active
  animation: page-spin-out 360ms ease-in both

@keyframes page-spin-in
  0%
    opacity: 0
    transform: scale(0.2) rotate(-220deg)
    filter: blur(6px)
  60%
    opacity: 1
    transform: scale(1.08) rotate(8deg)
    filter: blur(0)
  80%
    transform: scale(0.98) rotate(-3deg)
  100%
    opacity: 1
    transform: scale(1) rotate(0)

@keyframes page-spin-out
  0%
    opacity: 1
    transform: scale(1) rotate(0)
  100%
    opacity: 0
    transform: scale(0.3) rotate(180deg)

// 4. Jelly wobble — lands and wiggles like jelly
.page-jelly-enter-active
  animation: page-jelly-in 900ms cubic-bezier(0.34, 1.56, 0.64, 1) both
  transform-origin: center bottom

.page-jelly-leave-active
  animation: page-jelly-out 360ms ease-in both

@keyframes page-jelly-in
  0%
    opacity: 0
    transform: translateY(40%) scaleY(0.55) scaleX(1.4)
  40%
    opacity: 1
    transform: translateY(-4%) scaleY(1.15) scaleX(0.9)
  60%
    transform: translateY(0) scaleY(0.92) scaleX(1.06)
  75%
    transform: scaleY(1.04) scaleX(0.97)
  90%
    transform: scaleY(0.98) scaleX(1.02)
  100%
    opacity: 1
    transform: translateY(0) scaleY(1) scaleX(1)

@keyframes page-jelly-out
  0%
    opacity: 1
    transform: scale(1)
  100%
    opacity: 0
    transform: scale(0.88) translateY(10%)

// 5. Page flip — storybook 3D flip from the left edge
.page-flip-enter-active
  animation: page-flip-in 820ms cubic-bezier(0.22, 1.2, 0.36, 1) both
  transform-origin: left center
  backface-visibility: hidden

.page-flip-leave-active
  animation: page-flip-out 380ms ease-in both
  transform-origin: right center
  backface-visibility: hidden

@keyframes page-flip-in
  0%
    opacity: 0
    transform: perspective(1200px) rotateY(-95deg) translateX(-10%)
  60%
    opacity: 1
    transform: perspective(1200px) rotateY(10deg) translateX(0)
  80%
    transform: perspective(1200px) rotateY(-4deg)
  100%
    opacity: 1
    transform: perspective(1200px) rotateY(0) translateX(0)

@keyframes page-flip-out
  0%
    opacity: 1
    transform: perspective(1200px) rotateY(0)
  100%
    opacity: 0
    transform: perspective(1200px) rotateY(90deg)

// 6. Confetti pop — zoom in fast with a cheerful overshoot
.page-pop-enter-active
  animation: page-pop-in 680ms cubic-bezier(0.34, 1.8, 0.64, 1) both

.page-pop-leave-active
  animation: page-pop-out 300ms ease-in both

@keyframes page-pop-in
  0%
    opacity: 0
    transform: scale(0.3) rotate(-8deg)
  55%
    opacity: 1
    transform: scale(1.12) rotate(3deg)
  75%
    transform: scale(0.96) rotate(-1deg)
  100%
    opacity: 1
    transform: scale(1) rotate(0)

@keyframes page-pop-out
  0%
    opacity: 1
    transform: scale(1)
  100%
    opacity: 0
    transform: scale(1.3)
    filter: blur(4px)
</style>