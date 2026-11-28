import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Media outside the program file (see `src/utils/mediaSplit.ts`): takes the folders of the adventures out of a finished build and puts them
 *  - for the app (Tauri on iOS) into `<project>/dist-media/` (`bundle.resources` of `src-tauri/tauri.ios-media.conf.json` picks that folder up), or
 *  - for the check in the browser (`web`) into `<dist>/__media__/` (the same site serves them).
 * `ids` = `['*']` takes ALL adventures: every folder below `images/abenteuer/` except `ui/` (the signs of the adventure screens) and every folder below `audio/abenteuer/`
 * (the sound effects and pieces of music that lie directly in it stay). A tiny picture (`__sentinel.png`) is put at the root of the target: the app finds the folder by loading it.
 */
const SENTINEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
)

const subDirs = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).filter((n) => statSync(resolve(dir, n)).isDirectory()) : [])

/** The folders (below the build) that are taken out. */
export function mediaDirsOf(outDir: string, ids: string[]): string[] {
  if (ids.includes('*')) {
    return [
      ...subDirs(resolve(outDir, 'images/abenteuer')).filter((n) => n !== 'ui').map((n) => `images/abenteuer/${n}`),
      ...subDirs(resolve(outDir, 'audio/abenteuer')).map((n) => `audio/abenteuer/${n}`)
    ]
  }
  return ids.flatMap((id) => [`images/abenteuer/${id}`, `images/abenteuer/spiele/${id}`, `audio/abenteuer/${id}`])
}

export function splitMediaFiles(outDir: string, projectRoot: string, ids: string[], web: boolean, books: { folder: string; pdf: string }[] = []): { moved: number; target: string } {
  const target = web ? resolve(outDir, '__media__') : resolve(projectRoot, 'dist-media')
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  let moved = 0
  for (const dir of mediaDirsOf(outDir, ids)) {
    const from = resolve(outDir, dir)
    if (!existsSync(from)) continue
    const to = resolve(target, dir)
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to, { recursive: true })
    rmSync(from, { recursive: true, force: true })
    moved++
  }
  // the whole digital books (pages and PDF), only where `VITE_MEDIA_SPLIT_BOOKS` asks for it (Android: one Play pack per book); covers and sample pages stay
  for (const path of books.flatMap((b) => [b.folder, b.pdf])) {
    const from = resolve(outDir, path)
    if (!existsSync(from)) continue
    const to = resolve(target, path)
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to, { recursive: true })
    rmSync(from, { recursive: true, force: true })
    moved++
  }
  writeFileSync(resolve(target, '__sentinel.png'), SENTINEL_PNG)
  return { moved, target }
}
