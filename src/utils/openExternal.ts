/**
 * Open an external URL in the *system* browser, on every shell we ship to.
 *
 * A plain `<a target="_blank">` is NOT reliable inside a native WebView, and
 * that is exactly how the PayPal / Ko-fi donate CTAs shipped dead in the Play
 * Store build while working fine on the web:
 *
 *  - **Tauri Android** — the generated `RustWebView` never calls
 *    `settings.setSupportMultipleWindows(true)` and `RustWebChromeClient` has
 *    no `onCreateWindow` override, so a `target="_blank"` click is a "please
 *    open a new window" request that Chromium hands to the host app and the
 *    host app silently drops. The button highlights on tap and nothing else
 *    happens — no error, no navigation.
 *  - **Tauri iOS** — WKWebView drops it for the same reason (wry implements
 *    no `webView:createWebViewWithConfiguration:`).
 *  - **Electron** — an unhandled `window.open` spawns a second chromeless
 *    BrowserWindow (kiosk mode, no menu, no address bar) carrying our own
 *    preload. A payment page has no business running in there.
 *
 * So we ask the OS instead of the WebView: `@tauri-apps/plugin-opener`'s
 * `openUrl()` fires an `ACTION_VIEW` intent on Android / `UIApplication.open`
 * on iOS, and Electron gets `shell.openExternal` over IPC. Only the real
 * browser build keeps using `window.open`, where it has always worked.
 *
 * It must be `plugin-opener`, NOT the older `plugin-shell`. `plugin-shell`'s
 * JS `open()` is deprecated and silently broken on mobile: its `shell|open`
 * command runs `OpenScope::open` → the desktop `open` crate on every target,
 * so on Android it looks for `xdg-open` and fails with "Scoped shell IO
 * error: No such file or directory (os error 2)". The `ShellPlugin.kt` that
 * would fire the intent is only reachable from Rust (`shell().open(..)`),
 * never from JavaScript. Verified on-device — the fallback below then ran and
 * loaded PayPal *inside* the app's webview.
 *
 * The opener plugin needs BOTH halves in `src-tauri/capabilities/default.json`:
 * `opener:allow-open-url` enables the command, `opener:allow-default-urls`
 * supplies the URL scope (mailto/tel/http/https). With only the first, every
 * call is rejected with "Not allowed to open url …" — also verified on-device.
 * (`opener:default` bundles both plus `reveal-item-in-dir`, a filesystem
 * capability this app has no use for.)
 *
 * Note this is an app-side bug, not a store restriction: neither Google Play
 * nor the Play Console blocks an installed app from opening ko-fi.com or
 * paypal.com — and donations are exempt from the Play Billing requirement, so
 * handing the link to the system browser is also the policy-safe shape.
 */
import { isTauri } from '@tauri-apps/api/core'
import { isIOS } from '@/utils/platform'
import { requestParentalGate } from '@/use/useParentalGate'

// Same two-signal check `useUserUuid` uses: `isTauri()` reads the
// `window.isTauri` marker the v2 WebView injects, `__TAURI_INTERNALS__` is the
// equivalent on older 2.x runtimes.
function inTauriApp(): boolean {
  try {
    return isTauri() || (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window)
  } catch {
    return false
  }
}

// Keeps a value that sneaked in from the API (or a future caller) from
// turning a donate button into a `javascript:` or `file:` navigation. The
// opener plugin has no URL scope of its own, so this list is the gate.
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:'])

export function isExternalUrl(raw: string): boolean {
  try {
    return ALLOWED_PROTOCOLS.has(new URL(raw).protocol)
  } catch {
    return false
  }
}

function openInBrowserTab(url: string): boolean {
  try {
    return Boolean(window.open(url, '_blank', 'noopener,noreferrer'))
  } catch {
    return false
  }
}

/**
 * Hands `url` to the OS browser. Resolves `true` when something took the link.
 * Never throws — a dead donate button is a bug, a crashing one is worse.
 */
export async function openExternal(url: string): Promise<boolean> {
  if (!isExternalUrl(url)) return false
  // Kids Category: nothing leaves the iOS app without a grown-up (Guideline 1.3).
  if (isIOS && !(await requestParentalGate())) return false

  if (inTauriApp()) {
    try {
      // Dynamic so the web and Electron bundles don't pull the plugin in.
      const { openUrl } = await import('@tauri-apps/plugin-opener')
      await openUrl(url)
      return true
    } catch (error) {
      console.warn('[openExternal] openUrl failed', error)
      // Last resort. Measured on the Android WebView: with multiple windows
      // unsupported, `window.open` does not pop anything, it navigates the
      // current document — so this reaches the page but strands the user
      // inside the app (hardware back is the only way out). Acceptable only
      // as a fallback that should never fire.
      return openInBrowserTab(url)
    }
  }

  if (typeof window !== 'undefined' && typeof window.electronAPI?.openExternal === 'function') {
    window.electronAPI.openExternal(url)
    return true
  }

  if (openInBrowserTab(url)) return true

  // Plain browser with the popup blocked — the user did ask for this link, so
  // navigating the current tab is the honest fallback. (Not reached inside the
  // app shells, which return above.)
  try {
    window.location.assign(url)
    return true
  } catch {
    return false
  }
}

export default openExternal
