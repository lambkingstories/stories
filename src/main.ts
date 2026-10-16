import '@fontsource/fraunces/latin-700.css'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import '@fontsource/source-sans-3/latin-700.css'
import '@fontsource/source-sans-3/latin-800.css'
import { createApp, ref } from 'vue'
import App from '@/App.vue'
import router, { prefetchRoutes } from '@/router'
import '@/assets/css/tailwind.css'
import '@/assets/css/index.sass'
import '@/assets/css/theme.css'
import { startTheme } from '@/use/useTheme'
import { createI18n } from 'vue-i18n'
import baseTranslations from '@/i18n/translations'
import bookTranslations from '@/i18n/books'
import appTranslations from '@/i18n/app'
import { defaultLanguage } from '@/utils/defaultLanguage'
import { mergeObjectsRecursive } from '@/utils/function'
import { GAME_USER_LANGUAGE } from '@/utils/constants.ts'

// On-device debug console (vConsole). Gated by `VITE_DEBUG_CONSOLE=true`
// at build time so production APKs / Pages bundles don't ship the
// overlay. Vite inlines `import.meta.env.*`, so when the flag isn't set
// the dynamic `import('vconsole')` chunk is dead-code-eliminated and
// never downloaded.
//
// Enable for a Tauri Android closed-test diagnostic by setting
// `VITE_DEBUG_CONSOLE=true` in `.env.tauri.local` (or appending it to
// `.env.tauri`) and rebuilding the APK. The overlay surfaces the
// System / Network / Console panels directly inside the WebView —
// useful when the device is on a closed test track and you can't reach
// it with `adb` / Chrome remote debugging. The Network tab shows every
// `fetch` with full headers / response, which is what you need to
// confirm whether `/api/books` is going out with the right
// `X-Client-Key` header and what the server is replying.
if (import.meta.env.VITE_DEBUG_CONSOLE === 'true') {
  import('vconsole')
    .then(({ default: VConsole }) => {
      // eslint-disable-next-line no-new
      new VConsole({ theme: 'dark' })
    })
    .catch((err) => {
      // Diagnostic only — never block the app on a vConsole load failure.
      // eslint-disable-next-line no-console
      console.warn('[vConsole] failed to load:', err)
    })
}

const translations = mergeObjectsRecursive(
  mergeObjectsRecursive(
    mergeObjectsRecursive({}, bookTranslations),
    baseTranslations
  ),
  appTranslations
)

// Without a stored preference the website starts in German and the native
// apps in the device's language (see `defaultLanguage`). Returning users
// keep whichever language they last picked via the profile toggle (localStorage), and
// the in-tab session storage entry covers anonymous private-mode usage.
const userLanguage = ref(
  localStorage.getItem(GAME_USER_LANGUAGE)
  || sessionStorage.getItem(GAME_USER_LANGUAGE)
  || defaultLanguage()
)

const i18n: any = createI18n({
  locale: userLanguage.value || 'de',
  fallbackLocale: 'de',
  messages: translations,
  missingWarn: false,
  fallbackWarn: false
})

startTheme()
const app = createApp(App)

app.use(router)
app.use(i18n)

app.mount('#app')

// While the first screen is read, the screens of the bottom bar are loaded quietly in the background.
const whenQuiet = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
if (whenQuiet) whenQuiet(prefetchRoutes, { timeout: 4000 })
else setTimeout(prefetchRoutes, 2500)

// The web version keeps what it has loaded, so the app opens and the coloring screen works without a net (`public/sw.js`).
// The native apps have their files on the device and need none of this.
if (
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  location.protocol.startsWith('http') &&
  !('__TAURI_INTERNALS__' in window)
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined)
  })
}
