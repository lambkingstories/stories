/**
 * Media outside the program file (the test for 1.3, Anton 23.11.2026).
 *
 * Apple lets the program file of an app be 500 MB at most; Tauri puts every file of `dist` into it. So the pictures and sounds of some adventures can be kept
 * as plain files next to the program (`bundle.resources`) and be read through the asset protocol. This file decides where such a file is.
 *
 *  - `VITE_MEDIA_SPLIT=elia,david` names the adventures whose media are taken out of `dist` (see `vite.config.media.ts`). Without it nothing changes.
 *  - In the app from the store (Tauri on iOS) the folder of the resources is looked for: a small sentinel picture is tried in a few places, the first place that
 *    answers is used. The result is written down for the test page (`#/app/medientest`), so one try on a real iPhone shows what happened.
 *  - In the browser (`VITE_MEDIA_SPLIT_WEB=true`, the check on the PC) the files lie below `__media__/` of the same site.
 *
 * `prependBaseUrl` asks `splitUrl` first; a path that is not part of the split goes the old way.
 */
const IDS = ((import.meta.env.VITE_MEDIA_SPLIT as string | undefined) ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/** True in a build that keeps the media of some adventures outside the program file. */
export const MEDIA_SPLIT_ON = IDS.length > 0

const PATTERN = MEDIA_SPLIT_ON ? new RegExp(`^(images/abenteuer/(spiele/)?(${IDS.join('|')})/|audio/abenteuer/(${IDS.join('|')})/)`) : null

/** The folders (below `dist`) that belong to one adventure's media: the pictures, the pictures of its games, the sounds. */
export const splitDirsOf = (id: string) => [`images/abenteuer/${id}`, `images/abenteuer/spiele/${id}`, `audio/abenteuer/${id}`]

/** The name of the little picture that is put at the root of the media folder: if it loads, the folder is found. */
export const SENTINEL = '__sentinel.png'

/** Where the folder of the media was looked for, relative to the resource folder of the app (the first that answers wins). */
export const CANDIDATES = ['media', '_up_/dist-media', 'dist-media', 'assets/media', 'assets/_up_/dist-media', 'Resources/media']

export const isSplitPath = (path: string): boolean => !!PATTERN && PATTERN.test(path)

export interface MediaSplitReport {
  on: boolean
  ids: string[]
  mode: 'none' | 'web' | 'asset'
  resourceDir: string
  tried: { where: string; ok: boolean; url: string }[]
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
    const results = await Promise.all(
      CANDIDATES.map(async (where) => {
        const url = convertFileSrc(`${rd}/${where}/${SENTINEL}`)
        const ok = await pictureLoads(url)
        mediaSplitReport.tried.push({ where, ok, url })
        return { where, ok }
      })
    )
    const hit = CANDIDATES.map((c) => results.find((r) => r.where === c)).find((r) => r?.ok)
    if (hit) {
      mediaSplitReport.chosen = hit.where
      toUrl = (path) => convertFileSrc(`${rd}/${hit.where}/${path}`)
    }
  } catch (err) {
    mediaSplitReport.error = String(err)
  } finally {
    mediaSplitReport.ms = Math.round(performance.now() - t0)
  }
}
