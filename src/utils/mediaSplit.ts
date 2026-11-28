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
 * are assets of the APK, which the asset protocol cannot read): there the media are a Play Asset Delivery pack that a little server on the phone hands out
 * (`initAndroidPack`, scripts/android-pack/LkMedia.kt).
 */
import { reactive } from 'vue'
import bookMedia from '@/data/bookMedia.json'

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

/** True in a build that also keeps the whole digital books outside the program file (Android: one Play pack per book). */
export const BOOK_SPLIT_ON: boolean = MEDIA_SPLIT_ON && import.meta.env.VITE_MEDIA_SPLIT_BOOKS === 'true'

const isBookPath = (path: string): boolean => BOOK_SPLIT_ON && bookMedia.some((b) => path === b.pdf || path.startsWith(`${b.folder}/`))

export const isSplitPath = (path: string): boolean => (!!PATTERN && PATTERN.test(path)) || isBookPath(path)

export interface MediaSplitReport {
  on: boolean
  ids: string[]
  mode: 'none' | 'web' | 'asset' | 'android'
  resourceDir: string
  tried: { where: string; ok: boolean; url: string; note: string }[]
  /** Android: what the media server on the phone said (the Play pack: ready, downloading ...). */
  pack: { status: string; percent: number; detail: string; port: number }
  chosen: string
  error: string
  ms: number
}

/** What the start found out (shown by the test page). */
export const mediaSplitReport: MediaSplitReport = { on: MEDIA_SPLIT_ON, ids: IDS, mode: 'none', resourceDir: '', tried: [], pack: { status: '', percent: 0, detail: '', port: 0 }, chosen: '', error: '', ms: 0 }

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

/** The ports of the little media server of the Android app (LkMedia.kt; scripts/android-pack). */
export const ANDROID_PORTS = [47321, 47322, 47323]

/** Android: asks the media server on the phone itself; ready when the Play Asset Delivery pack is downloaded. */
async function initAndroidPack(): Promise<void> {
  mediaSplitReport.mode = 'android'
  const asks = ANDROID_PORTS.map(async (port) => {
    const ctl = new AbortController()
    const timer = window.setTimeout(() => ctl.abort(), 2000)
    try {
      const r = await fetch(`http://127.0.0.1:${port}/__status`, { signal: ctl.signal })
      const j = (await r.json()) as { status?: string; percent?: number; detail?: string }
      return { port, status: String(j.status ?? ''), percent: Number(j.percent ?? 0), detail: String(j.detail ?? '') }
    } catch (e) {
      mediaSplitReport.tried.push({ where: `Anschluss ${port}`, ok: false, url: `http://127.0.0.1:${port}/`, note: String(e).slice(0, 80) })
      return null
    } finally {
      window.clearTimeout(timer)
    }
  })
  const answer = (await Promise.all(asks)).find(Boolean)
  if (!answer) return
  mediaSplitReport.pack = answer
  const base = `http://127.0.0.1:${answer.port}/`
  const ok = answer.status === 'ready' && (await pictureLoads(base + SENTINEL))
  mediaSplitReport.tried.push({ where: `Anschluss ${answer.port}`, ok, url: base + SENTINEL, note: answer.status + (answer.detail ? ' ' + answer.detail : '') })
  if (ok) {
    mediaSplitReport.chosen = base
    toUrl = (path) => base + path
  }
}

/** Android: the state of the Play pack right now (asked again and again by the waiting screen); `null` when the media server does not answer. */
export async function androidPackStatus(): Promise<{ status: string; percent: number; detail: string } | null> {
  const ports = mediaSplitReport.pack.port ? [mediaSplitReport.pack.port] : ANDROID_PORTS
  for (const port of ports) {
    const ctl = new AbortController()
    const timer = window.setTimeout(() => ctl.abort(), 2000)
    try {
      const j = (await (await fetch(`http://127.0.0.1:${port}/__status`, { signal: ctl.signal })).json()) as { status?: string; percent?: number; detail?: string }
      return { status: String(j.status ?? ''), percent: Number(j.percent ?? 0), detail: String(j.detail ?? '') }
    } catch {
      /* try the next port */
    } finally {
      window.clearTimeout(timer)
    }
  }
  return null
}

/** True on Android when the media server answered and the core pack is usable. */
export const androidPackReady = (): boolean => MEDIA_SPLIT_ON && mediaSplitReport.mode === 'android' && !!mediaSplitReport.chosen

/** True on Android while the media pack is not usable yet (the app then shows the waiting screen instead of empty pictures). */
export const androidPackMissing = (): boolean => MEDIA_SPLIT_ON && mediaSplitReport.mode === 'android' && !mediaSplitReport.chosen

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
    if (/Android/i.test(navigator.userAgent)) return await initAndroidPack()
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

// ── Android: one pack per adventure (on-demand) ──────────────────────────────────────────────────────────────────────────────────

/** The name of the Play pack of an adventure (the same rule as in scripts/patch-android-assetpack.mjs and LkMedia.kt). */
export const packNameOf = (journeyId: string): string => 'adv_' + journeyId.replace(/-/g, '_')

/** What the waiting screen shows while a pack of an adventure is downloaded (`id` is empty when nothing is waited for). */
export const adventureWait = reactive({ id: '', percent: 0, status: '', cancelled: false, kind: 'adventure' as 'adventure' | 'book' })

/** The packs that are known to be there (asked once, then remembered for this start). */
const packReady = new Set<string>()

/** One answer of the media server about a pack (`fetch` also asks Google to download it). */
async function packAsk(port: number, pack: string, fetchIt: boolean): Promise<{ status: string; percent: number; detail: string } | null> {
  const ctl = new AbortController()
  const timer = window.setTimeout(() => ctl.abort(), 3000)
  try {
    const r = await fetch(`http://127.0.0.1:${port}/${fetchIt ? '__fetch' : '__status'}?pack=${encodeURIComponent(pack)}`, { signal: ctl.signal })
    const j = (await r.json()) as { status?: string; percent?: number; detail?: string }
    return { status: String(j.status ?? ''), percent: Number(j.percent ?? 0), detail: String(j.detail ?? '') }
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/**
 * Android: makes sure the pack of an adventure is on the phone before the adventure opens (the router waits for it). Returns `false` when the child cancelled,
 * `true` otherwise (also when nothing has to be done: not Android, no split, an adventure without a pack, or the pack is there).
 */
export async function ensureAdventurePack(journeyId: string): Promise<boolean> {
  if (!androidPackReady() || !journeyId) return true
  return ensurePack(packNameOf(journeyId), journeyId, 'adventure')
}

/** The name of the Play pack of a digital book (the same rule as in scripts/patch-android-assetpack.mjs and LkMedia.kt). */
export const bookPackNameOf = (bookId: string): string => 'book_' + bookId.replace(/-/g, '_')

/** True where the pages of a book have to be fetched before they can be shown (Android with the books in Play packs). */
export const bookNeedsPack = (bookId: string): boolean => BOOK_SPLIT_ON && androidPackReady() && bookMedia.some((b) => b.id === bookId)

/** Like `ensureAdventurePack`, for the pages and the PDF of a digital book. */
export async function ensureBookPack(bookId: string): Promise<boolean> {
  if (!bookNeedsPack(bookId)) return true
  return ensurePack(bookPackNameOf(bookId), bookId, 'book')
}

async function ensurePack(pack: string, waitId: string, kind: 'adventure' | 'book'): Promise<boolean> {
  if (packReady.has(pack)) return true
  const port = mediaSplitReport.pack.port
  let a = await packAsk(port, pack, false)
  if (!a || a.status === 'none') {
    // not downloaded yet (or no such pack: then the server says `none` again after the first request)
    a = await packAsk(port, pack, true)
  }
  if (!a || a.status === 'ready') {
    packReady.add(pack)
    return true
  }
  if (a.status === 'none') return true
  adventureWait.id = waitId
  adventureWait.kind = kind
  adventureWait.cancelled = false
  adventureWait.percent = a.percent
  adventureWait.status = a.status
  try {
    for (let i = 0; i < 1500 && !adventureWait.cancelled; i++) {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      const s = await packAsk(port, pack, i % 8 === 7)
      if (!s) continue
      adventureWait.percent = s.percent
      adventureWait.status = s.status
      if (s.status === 'ready') {
        packReady.add(pack)
        return true
      }
    }
    return false
  } finally {
    adventureWait.id = ''
  }
}
