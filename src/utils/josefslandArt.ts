/**
 * "Josefs Land": which painted picture belongs to what (names of the files below `public/images/spiele-gross/josefsland/`) and how big
 * things are drawn. The pictures are made by `bilder_josefsland.py` with three picture points to one unit of the world (`S`).
 */
import type { AnimalId, BuildingId, CropId, DecorId, GoodId } from '@/utils/josefslandData'
import { ANIMAL_IDS, BUILDING_IDS, CROP_IDS, DECOR_IDS, GOOD_IDS, storeLook, workshopLook } from '@/utils/josefslandData'

export const DIR = 'images/spiele-gross/josefsland/'
/** Picture points to one unit of the world. */
export const S = 3

export const CROP_FILE: Record<CropId, string> = { wheat: 'weizen', barley: 'gerste', flax: 'flachs', grapes: 'trauben', dates: 'datteln', pomegranate: 'granat' }
export const BUILDING_FILE: Record<BuildingId, string> = { mill: 'muehle', bakery: 'baeckerei', weaver: 'weberei', press: 'kelter', apiary: 'imkerei' }
export const ANIMAL_FILE: Record<AnimalId, string> = { sheep: 'schaf', goat: 'ziege', cow: 'rind', donkey: 'esel' }

export const fieldPic = (c: CropId, stage: number): string => `feld-${CROP_FILE[c]}-${Math.max(0, Math.min(3, stage))}`
export const buildingPic = (b: BuildingId, level: number): string => `${BUILDING_FILE[b]}-${workshopLook(level)}`
export const barnPic = (level: number): string => `scheune-${storeLook(level)}`
export const granaryPic = (level: number): string => `speicher-${storeLook(level)}`
export const animalPic = (a: AnimalId, eating: boolean): string => `${ANIMAL_FILE[a]}-${eating ? 'b' : 'a'}`
export const goodPic = (g: GoodId): string => `w-${g}`
export const decorPic = (d: DecorId): string => `d-${d}`

/** Everything the game draws (loaded when it opens; a missing picture is drawn as a coloured box, so the game never breaks). */
export const ALL_PICTURES: string[] = [
  'kachel-wiese', 'kachel-sand', 'kachel-weg', 'kachel-pflaster',
  'leer-trocken', 'leer-beet', 'leer-stroh',
  ...[0, 1, 2].flatMap((i) => [`scheune-${i}`, `speicher-${i}`]),
  ...BUILDING_IDS.flatMap((b) => [0, 1].map((i) => `${BUILDING_FILE[b]}-${i}`)),
  'brett', 'brunnen', 'zaun', 'pfosten', 'tor', 'futtertrog', 'heu', 'wassertrog', 'karawane',
  ...ANIMAL_IDS.flatMap((a) => [`${ANIMAL_FILE[a]}-a`, `${ANIMAL_FILE[a]}-b`]),
  ...CROP_IDS.flatMap((c) => [0, 1, 2, 3].map((i) => fieldPic(c, i))),
  ...GOOD_IDS.map(goodPic),
  'z-aehre-voll', 'z-aehre-duenn', 'z-siegel', 'z-rolle', 'z-sichel', 'z-samen', 'z-truhe', 'z-karawane',
  ...[0, 1, 2, 3].map((i) => `figur-${i}`),
  ...DECOR_IDS.map(decorPic),
  'fern-1', 'fern-2'
]
/** The pictures that are not needed at once (drawn only in the menus). */
export const LATE_PICTURES: string[] = ['traum', 'kachel']

/** The size (width, height in world units) that a picture is drawn with while it is missing. */
export function fallbackSize(name: string): [number, number] {
  if (name.startsWith('feld-') || name.startsWith('leer-')) return [118, 80]
  if (name.startsWith('scheune')) return [190, 130]
  if (name.startsWith('speicher')) return [200, 140]
  if (name.startsWith('d-')) return [70, 80]
  if (name.startsWith('w-') || name.startsWith('z-')) return [40, 40]
  if (name.startsWith('figur')) return [34, 78]
  if (name === 'zaun') return [100, 40]
  if (name === 'pfosten' || name === 'tor') return [50, 50]
  if (name === 'karawane') return [330, 80]
  if (name.endsWith('-a') || name.endsWith('-b')) return [70, 54]
  return [130, 110]
}
export function fallbackColor(name: string): string {
  if (name.startsWith('feld-') || name.startsWith('leer-')) return '#8a5e3c'
  if (name.startsWith('scheune') || name.startsWith('speicher')) return '#c9a066'
  if (name.startsWith('d-')) return '#5f8f4a'
  return '#b98a4e'
}
