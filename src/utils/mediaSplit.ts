/**
 * Media outside the program file (iOS; proven on a real iPad on 24.11.2026).
 *
 * Apple lets the program file of an app be 500 MB at most (the whole app 4 GB); Tauri puts every file of `dist` into the program file. So the pictures and sounds of the
 * adventures are kept as plain files next to the program (`bundle.resources`) and are read through the asset protocol of Tauri. This file decides where such a file is.
 *
 *  - `VITE_MEDIA_SPLIT=*` takes the media of ALL adventures out of `dist`; `VITE_MEDIA_SPLIT=elia,david` only those (see `vite.config.media.ts`). Without it nothing changes.
 *  - In the app from the store (Tauri on iOS) the folder of the resources is looked for: a small sentinel picture is tried in a few places, the first place that
 *    answers is used (on iOS it is `<resource folder>/_up_/dist-media`). The result is written down for the test page (`#/app/medientest`).
 *  - In the browser (`VITE_MEDIA_SPLIT_WEB=true`, the check on the PC) the files lie below `__media__/` of the same site.
 *  - The page of the app (`index.html`) must allow the address kind `asset:` for pictures, sounds and requests (its Content-Security-Policy): without it every file fails
 *    with "Load failed" (the first tries of 24.11.2026).
 *
 * `prependBaseUrl` asks `splitUrl` first; a path that is not part of the split goes the old way. Android keeps its media inside the app (the resources of an Android app
 * are assets of the APK, which the asset protocol cannot read).
 */
const IDS = ((import.meta.env.VITE_MEDIA_SPLIT as string | undefined) ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/** True in a build that keeps the media of the adventures outside the program file. */
export const MEDIA_SPLIT_ON = IDS.length > 0

/** The button to the test page (a test build only). */
export const MEDIA_TEST_LINK: boolean = MEDIA_SPLIT_ON && import.meta.env.VITE_MEDIA_TEST === 'true'

/**
 * `*`: everything below `images/abenteuer/` except the signs of the adventure screens (`ui/`), and the sound folders below `audio/abenteuer/` (the little sound
 * effects and pieces of music that lie directly in it stay in the program, every screen needs them).
 */
const PATTERN = !MEDIA_SPLIT_ON
  ? null
  : IDS.includes('*')
    ? /^(images\/abenteuer\/(?!ui\/)|audio\/abenteuer\/[^/]+\/)/
    : new RegExp(`^(images/abenteuer/(spiele/)?(${IDS.join('|')})/|audio/abenteuer/(${IDS.join('|')})/)`)

/** The name of the little picture that is put at the root of the media folder: if it loads, the folder is found. */
export const SENTINEL = '__sentinel.png'

/** Where the folder of the media was looked for, relative to the resource folder of the app (the first that answers wins). */
export const CANDIDATES = ['_up_/dist-media', 'media', 'dist-media', 'assets/media', 'assets/_up_/dist-media', 'Resources/media']

export const isSplitPath = (path: string): boolean => !!PATTERN && PATTERN.test(path)

export interface MediaSplitReport {
  on: boolean
  ids: string[]
  mode: 'none' | 'web' | 'asset'
  resourceDir: string
  tried: { where: string; ok: boolean; url: string; note: string }[]
  chosen: string
  error: string
  ms: number
}

/** What the start found out (shown by the test page). */
export const mediaSplitReport: MediaSplitReport = { on: MEDIA_SPLIT_ON, ids: IDS, mode: 'none', resourceDir: '', tried: [], chosen: '', error: '', ms: 0 }

let toUrl: ((path: string) => string) | null = null

/** The address of a media file of the split, `null` while the place is not known (the caller then uses the old address). */
export const splitUrl = (path: string): string | null => (toUrl ? toUrl(path) : null)

/** True when the picture at `url` loads (a plain picture needs no CORS, so this works for the asset protocol too). */
export function pictureLoads(url: string, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const done = (ok: boolean) => {
      img.onload = null
      img.onerror = null
      resolve(ok)
    }
    img.onload = () => done(true)
    img.onerror = () => done(false)
    window.setTimeout(() => done(false), timeoutMs)
    img.src = url
  })
}

/** Finds the media folder. Called once before the first screen is drawn; never throws (a failure only means the old addresses stay). */
export async function initMediaSplit(): Promise<void> {
  if (!MEDIA_SPLIT_ON) return
  const t0 = performance.now()
  try {
    if (import.meta.env.VITE_MEDIA_SPLIT_WEB === 'true') {
      const base = `${import.meta.env.BASE_URL || '/'}__media__/`
      mediaSplitReport.mode = 'web'
      mediaSplitReport.chosen = base
      toUrl = (path) => `${base}${path}`
      return
    }
    if (!('__TAURI_INTERNALS__' in window)) return
    const [{ resourceDir }, { convertFileSrc }] = await Promise.all([import('@tauri-apps/api/path'), import('@tauri-apps/api/core')])
    mediaSplitReport.mode = 'asset'
    const rd = (await resourceDir()).replace(/[\\/]+$/, '')
    mediaSplitReport.resourceDir = rd
    const attempts = CANDIDATES.map((where) => ({ where, url: convertFileSrc(`${rd}/${where}/${SENTINEL}`), make: (path: string) => convertFileSrc(`${rd}/${where}/${path}`) }))
    const results = await Promise.all(
      attempts.map(async (a) => {
        const ok = await pictureLoads(a.url)
        // a failed one says why, as far as the browser tells (the status, or the kind of error)
        let note = ''
        if (!ok) {
          note =
            typeof fetch !== 'function'
              ? ''
              : await Promise.race([
                  fetch(a.url).then(
                    (r) => 'HTTP ' + r.status,
                    (e) => String(e).slice(0, 80)
                  ),
                  new Promise<string>((resolve) => window.setTimeout(() => resolve('keine Antwort'), 2500))
                ])
        }
        mediaSplitReport.tried.push({ where: a.where, ok, url: a.url, note })
        return { a, ok }
      })
    )
    const hit = attempts.map((a) => results.find((r) => r.a === a)).find((r) => r?.ok)
    if (hit) {
      mediaSplitReport.chosen = hit.a.where
      toUrl = hit.a.make
    }
  } catch (err) {
    mediaSplitReport.error = String(err)
  } finally {
    mediaSplitReport.ms = Math.round(performance.now() - t0)
  }
}
