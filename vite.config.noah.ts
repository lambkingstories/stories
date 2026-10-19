import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The folders (below the build folder) that belong to the journey "Noah" alone: its pictures, the pictures of its games, its recordings and its
 * music. A build that does not contain Noah (see `src/data/adventures/index.ts`) takes them out again; the hidden test build keeps them.
 * A new folder that only Noah uses has to be listed here (a test finds the ones that are missing).
 */
export const NOAH_ONLY_DIRS = [
  'images/abenteuer/noah',
  'images/abenteuer/spiele/noah',
  'images/abenteuer/spiele/wimmel-noah',
  'images/abenteuer/spiele/memory-tiere',
  'images/abenteuer/spiele/bauen',
  'images/abenteuer/spiele/teilen',
  'images/abenteuer/spiele/tiere',
  'images/abenteuer/spiele/punkte',
  'images/abenteuer/spiele/steuern',
  'images/abenteuer/spiele/altar',
  'audio/abenteuer/noah'
]

/** Takes the folders of Noah out of a finished build. */
export function stripNoahFiles(outDir: string) {
  for (const dir of NOAH_ONLY_DIRS) rmSync(resolve(outDir, dir), { recursive: true, force: true })
}
