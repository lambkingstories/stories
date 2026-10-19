/** The names of the little sounds of the adventures and the file of each (see `useSfx`). */
export type SfxName =
  | 'tap'
  | 'right'
  | 'wrong'
  | 'star'
  | 'fanfare'
  | 'flip'
  | 'basket'
  | 'sack'
  | 'snap'
  | 'bead'
  | 'found'
  | 'caravan'
  | 'coin'
  | 'button'
  | 'result'
  | 'trophy'

/** The file of each sound below `public/audio/abenteuer/` (a replaced sound gets a new name, so that phones do not keep the old one). */
export const SFX_FILE: Record<SfxName, string> = {
  tap: 'klang-tippen',
  right: 'klang-richtig',
  wrong: 'klang-falsch',
  star: 'klang-stern',
  fanfare: 'klang-fanfare',
  flip: 'klang-wenden',
  basket: 'klang-korb',
  sack: 'klang-sack',
  snap: 'klang-einrasten',
  bead: 'klang-perle',
  found: 'klang-fund',
  caravan: 'klang-karawane',
  coin: 'klang-muenze',
  button: 'klang-knopf-2',
  result: 'klang-ergebnis',
  trophy: 'klang-pokal'
}
/** Every sound file (`journeyFiles` puts them into the download pack). */
export const SFX_FILES = Object.values(SFX_FILE).map((n) => `audio/abenteuer/${n}.mp3`)

/** The soft music of the map: one piece, one round of `loop` seconds plus a ring-out that runs into the next round (see `useMusic`). */
export const MAP_MUSIC: MusicPiece = { file: 'musik-karte', loop: (64 * 60) / 76, mood: 'ruhig' }

/** The ten pieces for the mini games: three moods (calm, medium, lively), each piece one round of `loop` seconds (16 bars) plus a ring-out. */
export type Mood = 'ruhig' | 'mittel' | 'lebhaft'
export interface MusicPiece {
  file: string
  loop: number
  mood: Mood
}
export const GAME_MUSIC: MusicPiece[] = [
  { file: 'musik-spiel-01', loop: (64 * 60) / 112, mood: 'mittel' },
  { file: 'musik-spiel-02', loop: (64 * 60) / 112, mood: 'mittel' },
  { file: 'musik-spiel-03', loop: (64 * 60) / 112, mood: 'mittel' },
  { file: 'musik-spiel-04', loop: (64 * 60) / 84, mood: 'ruhig' },
  { file: 'musik-spiel-05', loop: (64 * 60) / 72, mood: 'ruhig' },
  { file: 'musik-spiel-06', loop: (64 * 60) / 80, mood: 'ruhig' },
  { file: 'musik-spiel-07', loop: (64 * 60) / 100, mood: 'mittel' },
  { file: 'musik-spiel-08', loop: (64 * 60) / 104, mood: 'mittel' },
  { file: 'musik-spiel-09', loop: (64 * 60) / 124, mood: 'lebhaft' },
  { file: 'musik-spiel-10', loop: (64 * 60) / 118, mood: 'lebhaft' }
]

/** Which mood fits which game: quiet looking and remembering, steady building and sorting, quick flying and dots. */
const GAME_MOOD: Record<string, Mood> = {
  find: 'ruhig', memory: 'ruhig', share: 'ruhig', count: 'ruhig', stones: 'ruhig',
  puzzle: 'mittel', sort: 'mittel', harvest: 'mittel', build: 'mittel', way: 'mittel',
  fly: 'lebhaft', dots: 'lebhaft'
}
export const moodOfGame = (kind: string | undefined): Mood => (kind && GAME_MOOD[kind]) || 'mittel'

/** A random piece of the mood, never the one that played last (`rnd` is injectable for tests). */
export function pickGameMusic(mood: Mood, last?: string, rnd: () => number = Math.random): MusicPiece {
  const all = GAME_MUSIC.filter((p) => p.mood === mood)
  const pool = all.length > 1 ? all.filter((p) => p.file !== last) : all
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))]!
}

export const MUSIC_FILES = [MAP_MUSIC, ...GAME_MUSIC].map((m) => `audio/abenteuer/${m.file}.mp3`)
