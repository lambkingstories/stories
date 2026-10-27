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

/** The folders that belong to the journey "Jakob" (id `jakob`) alone, in the same three places as Adam and Eve. */
export const JAKOB_ONLY_DIRS = ['images/abenteuer/jakob', 'images/abenteuer/spiele/jakob', 'audio/abenteuer/jakob']

/** The folders that belong to the journey "Josua" (id `josua`) alone, in the same three places as Adam and Eve. */
export const JOSUA_ONLY_DIRS = ['images/abenteuer/josua', 'images/abenteuer/spiele/josua', 'audio/abenteuer/josua']

/** The folders that belong to the journey "Gideon" (id `gideon`) alone, in the same three places as Adam and Eva. */
export const GIDEON_ONLY_DIRS = ['images/abenteuer/gideon', 'images/abenteuer/spiele/gideon', 'audio/abenteuer/gideon']

/** The folders that belong to the journey "Mose" (id `mose`) alone, in the same three places as Adam and Eva. */
export const MOSE_ONLY_DIRS = ['images/abenteuer/mose', 'images/abenteuer/spiele/mose', 'audio/abenteuer/mose']

/** The folders that belong to the journey "Jona" (id `jona`) alone, in the same three places as Adam and Eva. */
export const JONA_ONLY_DIRS = ['images/abenteuer/jona', 'images/abenteuer/spiele/jona', 'audio/abenteuer/jona']

/** The folders that belong to the journey "Daniel" (id `daniel`) alone, in the same three places as Adam and Eva. */
export const DANIEL_ONLY_DIRS = ['images/abenteuer/daniel', 'images/abenteuer/spiele/daniel', 'audio/abenteuer/daniel']

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

/** Takes the folders of Jakob out of a finished build. */
export function stripJakobFiles(outDir: string) {
  strip(outDir, JAKOB_ONLY_DIRS)
}

/** Takes the folders of Josua out of a finished build. */
export function stripJosuaFiles(outDir: string) {
  strip(outDir, JOSUA_ONLY_DIRS)
}

/** Takes the folders of Gideon out of a finished build. */
export function stripGideonFiles(outDir: string) {
  strip(outDir, GIDEON_ONLY_DIRS)
}

/** Takes the folders of Mose out of a finished build. */
export function stripMoseFiles(outDir: string) {
  strip(outDir, MOSE_ONLY_DIRS)
}

/** Takes the folders of Jona out of a finished build. */
export function stripJonaFiles(outDir: string) {
  strip(outDir, JONA_ONLY_DIRS)
}

/** Takes the folders of Daniel out of a finished build. */
export function stripDanielFiles(outDir: string) {
  strip(outDir, DANIEL_ONLY_DIRS)
}

/** The folders that belong to the journey "Elia" (id `elia`) alone, in the same three places as Adam and Eva. */
export const ELIA_ONLY_DIRS = ['images/abenteuer/elia', 'images/abenteuer/spiele/elia', 'audio/abenteuer/elia']

/** Takes the folders of Elia out of a finished build. */
export function stripEliaFiles(outDir: string) {
  strip(outDir, ELIA_ONLY_DIRS)
}

/** The folders that belong to the journey "Rut" (id `rut`) alone, in the same three places as Adam and Eva. */
export const RUT_ONLY_DIRS = ['images/abenteuer/rut', 'images/abenteuer/spiele/rut', 'audio/abenteuer/rut']

/** Takes the folders of Rut out of a finished build. */
export function stripRutFiles(outDir: string) {
  strip(outDir, RUT_ONLY_DIRS)
}

/** The folders that belong to the journey "Samuel und Saul" (id `samuel`) alone, in the same three places as Adam and Eva. */
export const SAMUEL_ONLY_DIRS = ['images/abenteuer/samuel', 'images/abenteuer/spiele/samuel', 'audio/abenteuer/samuel']

/** Takes the folders of Samuel und Saul out of a finished build. */
export function stripSamuelFiles(outDir: string) {
  strip(outDir, SAMUEL_ONLY_DIRS)
}

/** The folders that belong to the journey "David" (id `david`) alone, in the same three places as Adam and Eva. */
export const DAVID_ONLY_DIRS = ['images/abenteuer/david', 'images/abenteuer/spiele/david', 'audio/abenteuer/david']

/** Takes the folders of David out of a finished build. */
export function stripDavidFiles(outDir: string) {
  strip(outDir, DAVID_ONLY_DIRS)
}
