/**
 * Shared request headers for every public API call.
 *
 *  - `X-Client-Key`: per-build attribution key. Each distribution channel
 *    (Tauri Android, GitHub Pages, Electron, …) ships its own value injected
 *    at build time via the matching `.env.<target>` file. The server's
 *    `requireClientKey` middleware uses it for attribution + as the trigger
 *    to flip CORS into permissive mode (so the Tauri WebView's
 *    `https://tauri.localhost` origin doesn't have to be allowlisted).
 *    Empty string disables the header — the server then falls back to
 *    legacy behaviour, which keeps `pnpm dev` against an unconfigured
 *    backend working.
 *
 * This is the only custom header the app sends. It used to be joined by
 * `X-User-Uuid`, a random per-install id that fed a daily-active-users
 * dashboard; the app now sends nothing identifying at all and the server
 * counts book detail views instead. Any header added here must also be
 * announced in the server's permissive CORS branch (`allowedHeaders` in
 * server/src/app.ts) or the preflight fails.
 */
const CLIENT_KEY: string = (import.meta.env.VITE_CLIENT_KEY ?? '').trim()

export function buildApiHeaders(extra?: HeadersInit): HeadersInit {
  return {
    accept: 'application/json',
    ...(CLIENT_KEY ? { 'X-Client-Key': CLIENT_KEY } : {}),
    ...(extra ?? {})
  }
}
