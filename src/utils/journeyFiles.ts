/**
 * Every file a journey needs while it is played (the painted map, the pictures of the games, the signs, the sounds): the list for
 * the one-time download of a journey. The files lie below `public/`; everything comes from our own server.
 */
import type { Journey } from '@/types/adventure'

/**
 * The version of the downloaded packs: raise it whenever a picture or sound of the adventures is replaced, so that devices that have
 * the old files load them again (the packs are served from the device without asking the net).
 */
export const PACK_VERSION = 18

/** The painted signs and buttons that every journey uses (everything in `public/images/abenteuer/ui`). */
export const ADVENTURE_UI_FILES = [
  'check',
  'coin-locked',
  'coin',
  'lock',
  'medaille-josef',
  'pfeil-links',
  'pokal-bronze',
  'pokal-gold',
  'pokal-silber',
  'stern-aus-1',
  'stern-aus-2',
  'stern-aus-3',
  'stern-gold-1',
  'stern-gold-2',
  'stern-gold-3',
  'sternglanz',
  'ton-an',
  'ton-aus'
].map((n) => `images/abenteuer/ui/${n}.webp`)

/** The sounds of the adventures (see `useSfx`). */
export const ADVENTURE_SOUND_FILES = ['tap', 'right', 'wrong', 'star', 'fanfare', 'flip', 'basket', 'sack', 'snap', 'bead', 'found', 'caravan', 'coin'].map((n) => `audio/abenteuer/${n}.mp3`)

/** All the picture and sound paths that are written in the data of a journey (a `{n}` stands for the variants 1 to 3). */
function pathsIn(value: unknown, out: Set<string>) {
  if (typeof value === 'string') {
    if (/^(images|audio)\//.test(value)) {
      if (value.includes('{n}')) for (const n of [1, 2, 3]) out.add(value.replace('{n}', String(n)))
      else out.add(value)
    }
  } else if (Array.isArray(value)) {
    for (const v of value) pathsIn(v, out)
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) pathsIn(v, out)
  }
}

export function journeyFiles(journey: Journey): string[] {
  const out = new Set<string>([...ADVENTURE_UI_FILES, ...ADVENTURE_SOUND_FILES])
  pathsIn(journey, out)
  return [...out]
}
