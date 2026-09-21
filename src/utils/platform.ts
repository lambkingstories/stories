/**
 * `true` in the iOS App Store build. That build replaces the PayPal / Ko-fi
 * donation CTAs with a StoreKit tip (App Review Guideline 3.1.1(a): no calls
 * to action for payments outside in-app purchase, except on the US
 * storefront; a tip *through* in-app purchase is allowed by 3.1.1).
 *
 * `ios-build.yml` and `pnpm tauri:build-ios` set VITE_APP_PLATFORM=ios. The
 * user-agent check covers a local iOS build that forgot it; iPadOS WebViews
 * report "Macintosh", hence the touch-point test. Kept free of app imports so
 * `openExternal` can read it without dragging the user store along.
 */
export const isIOS: boolean = import.meta.env.VITE_APP_PLATFORM === 'ios' || (
  import.meta.env.VITE_APP_NATIVE === 'true' && typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  )
)
