/**
 * `true` in the iOS App Store build. That build hides the donation CTAs (App
 * Review Guideline 3.1.1(a): no calls to action for payments outside in-app
 * purchase, except on the US storefront) and puts a parental gate in front of
 * every link out of the app (Kids Category, Guideline 1.3).
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
