import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Media outside the program file (the test for 1.3, see `src/utils/mediaSplit.ts`): takes the folders of some adventures out of a finished build and puts them
 *  - for the app (Tauri on iOS) into `<project>/dist-media/` (`bundle.resources` of `src-tauri/tauri.ios-media.conf.json` picks that folder up), or
 *  - for the check in the browser (`web`) into `<dist>/__media__/` (the same site serves them).
 * A tiny picture (`__sentinel.png`) is put at the root of the target: the app finds the folder by loading it.
 */
const SENTINEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
)

export function splitMediaFiles(outDir: string, projectRoot: string, ids: string[], web: boolean): { moved: number; target: string } {
  const target = web ? resolve(outDir, '__media__') : resolve(projectRoot, 'dist-media')
  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  let moved = 0
  for (const id of ids) {
    for (const dir of [`images/abenteuer/${id}`, `images/abenteuer/spiele/${id}`, `audio/abenteuer/${id}`]) {
      const from = resolve(outDir, dir)
      if (!existsSync(from)) continue
      const to = resolve(target, dir)
      mkdirSync(dirname(to), { recursive: true })
      cpSync(from, to, { recursive: true })
      rmSync(from, { recursive: true, force: true })
      moved++
    }
  }
  writeFileSync(resolve(target, '__sentinel.png'), SENTINEL_PNG)
  return { moved, target }
}
