/**
 * Every file a journey needs while it is played (the painted map, the pictures of the games, the signs, the sounds): the list for
 * the one-time download of a journey. The files lie below `public/`; everything comes from our own server.
 */
import type { Journey } from '@/types/adventure'
import { MUSIC_FILES, SFX_FILES } from '@/utils/sfxFiles'

/**
 * The version of the downloaded packs: raise it whenever a picture or sound of the adventures is replaced, so that devices that have
 * the old files load them again (the packs are served from the device without asking the net).
 */
export const PACK_VERSION = 52

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
export const ADVENTURE_SOUND_FILES = [...SFX_FILES, ...MUSIC_FILES]

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

/**
 * Folders of pictures that are not painted yet (the games stand in with plain shapes, see `GameImage`): a file of these folders that the
 * server does not have is no failure of the download. Take a folder out of this list when its pictures are delivered.
 */
export const NOT_PAINTED_YET = [
  'images/abenteuer/spiele/gideon/schleichen/',
  'images/abenteuer/spiele/gideon/hoehle/',
  'images/abenteuer/spiele/gideon/zeichen/',
  'images/abenteuer/spiele/gideon/weiche/',
  'images/abenteuer/spiele/gideon/worfeln/',
  'images/abenteuer/spiele/gideon/tau/',
  'images/abenteuer/spiele/gideon/wimmel/',
  'images/abenteuer/spiele/gideon/memory/',
  'images/abenteuer/spiele/josua/still/',
  'images/abenteuer/spiele/josua/verstecken/',
  'images/abenteuer/spiele/josua/backen/',
  'images/abenteuer/spiele/josua/packen/',
  'images/abenteuer/spiele/josua/abseilen/',
  'images/abenteuer/spiele/josua/schritt/',
  'images/abenteuer/spiele/josua/memory/',
  'images/abenteuer/spiele/abraham/ringe/',
  'images/abenteuer/spiele/abraham/hinweise/',
  'images/abenteuer/spiele/abraham/voegel/',
  'images/abenteuer/spiele/abraham/silber/',
  'images/abenteuer/spiele/jakob/jahre/',
  'images/abenteuer/spiele/jakob/bund/',
  'images/abenteuer/spiele/jakob/kreis/',
  'images/abenteuer/spiele/jakob/fangen/',
  'images/abenteuer/spiele/jakob/staffel/'
]

export const notPaintedYet = (path: string) => NOT_PAINTED_YET.some((p) => path.startsWith(p))

export function journeyFiles(journey: Journey): string[] {
  // the general music pieces only belong to a journey that has no music of its own (its own pieces are written in its data)
  const out = new Set<string>([...ADVENTURE_UI_FILES, ...SFX_FILES, ...(journey.music?.length ? [] : MUSIC_FILES)])
  // a stage that is not ready (`soon`) is not opened, so its pictures are not downloaded
  pathsIn({ ...journey, stages: journey.stages.filter((s) => !s.soon) }, out)
  // the recordings of the story are the ones of the language of the app at the time of the download (`stage.audio` answers with the
  // English or the German file); the other language is played from the net, or the voice of the device reads when there is no net
  // ... but its picture stands on the map
  for (const s of journey.stages) if (s.soon && s.image) out.add(s.image)
  return [...out]
}
