import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * The folders (below the build folder) that belong to ONE hidden journey alone: its pictures, the pictures of its games, its recordings and its
 * music. A build that does not contain the journey (see `src/data/adventures/index.ts`) takes them out again; the hidden test build keeps them.
 * A new folder that only that journey uses has to be listed here (the tests find the ones that are missing).
 */

/** The folders that belong to the journey "Noah" alone. */
export const NOAH_ONLY_DIRS = [
  'images/abenteuer/noah',
  'images/abenteuer/spiele/noah',
  'images/abenteuer/spiele/wimmel-noah',
  'images/abenteuer/spiele/memory-paare',
  'images/abenteuer/spiele/bauen',
  'images/abenteuer/spiele/teilen',
  'images/abenteuer/spiele/tiere',
  'images/abenteuer/spiele/punkte',
  'images/abenteuer/spiele/steuern',
  'images/abenteuer/spiele/altar',
  'audio/abenteuer/noah'
]

/**
 * The folders that belong to the journey "Adam und Eva" (id `adam-eva`) alone. Rule for everybody who delivers files for it: pictures of the
 * stages, the map, the medal and the gift go into `images/abenteuer/adam-eva/`, the pictures of its games into
 * `images/abenteuer/spiele/adam-eva/<game>/` (never into a folder that Josef or Noah use), the recordings and the music into
 * `audio/abenteuer/adam-eva/`.
 */
export const ADAM_ONLY_DIRS = ['images/abenteuer/adam-eva', 'images/abenteuer/spiele/adam-eva', 'audio/abenteuer/adam-eva']

/** The folders that belong to the journey "Der Turm von Babel" (id `babel`) alone, in the same three places as Adam and Eve. */
export const BABEL_ONLY_DIRS = ['images/abenteuer/babel', 'images/abenteuer/spiele/babel', 'audio/abenteuer/babel']

/** The folders that belong to the journey "Abraham" (id `abraham`) alone, in the same three places as Adam and Eve. */
export const ABRAHAM_ONLY_DIRS = ['images/abenteuer/abraham', 'images/abenteuer/spiele/abraham', 'audio/abenteuer/abraham']

function strip(outDir: string, dirs: string[]) {
  for (const dir of dirs) rmSync(resolve(outDir, dir), { recursive: true, force: true })
}

/** Takes the folders of Noah out of a finished build. */
export function stripNoahFiles(outDir: string) {
  strip(outDir, NOAH_ONLY_DIRS)
}

/** Takes the folders of Adam and Eve out of a finished build. */
export function stripAdamFiles(outDir: string) {
  strip(outDir, ADAM_ONLY_DIRS)
}

/** Takes the folders of the Tower of Babel out of a finished build. */
export function stripBabelFiles(outDir: string) {
  strip(outDir, BABEL_ONLY_DIRS)
}

/** Takes the folders of Abraham out of a finished build. */
export function stripAbrahamFiles(outDir: string) {
  strip(outDir, ABRAHAM_ONLY_DIRS)
}
