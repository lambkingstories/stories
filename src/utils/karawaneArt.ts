/**
 * "Karawane über die Dünen": what the painted pictures are (names, sizes in metres, anchor points). The pictures are painted by the image
 * model; their measures come from `karawaneArtMeta.ts` (made by the picture script), the rest is set by hand here.
 */
import { META } from '@/utils/karawaneArtMeta'
import type { PickupKind } from '@/utils/karawaneGame'
import type { AnimalId } from '@/utils/karawaneUpgrades'

export const DIR = 'images/spiele-gross/karawane/'

/** The pictures every route needs. */
export const COMMON_IMAGES = [
  'karren', 'rad', 'esel-a', 'esel-b', 'kamel-a', 'kamel-b', 'ochse-a', 'ochse-b',
  'krug-gross', 'krug-klein', 'sack', 'korb', 'plane', 'scherben',
  'dattel', 'schlauch', 'muenze', 'beutel', 'feder', 'oase', 'ziel'
]

/** The pictures of one route (n counts from 1): sky with far mountains, mid hills, the strip of ground and the six decor things. */
export function routeImages(n: number): string[] {
  return [`fern-${n}`, `mitte-${n}`, `boden-${n}`, ...[1, 2, 3, 4, 5, 6].map((k) => `deko-${n}-${k}`)]
}

/** The number from `META` (or a fallback), for pictures whose measures were not made yet. */
export function meta(name: string, key: string, fallback: number): number {
  const v = META[name]?.[key]
  return typeof v === 'number' ? v : fallback
}

// ── the cart ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The cart picture: its size in metres, the axle (where the wheel sits) and the loop of the pole, as shares of the picture. */
export const CART = {
  mw: meta('karren', 'mw', 3.47),
  mh: meta('karren', 'mh', 0.87),
  ax: meta('karren', 'ax', 0.295),
  ay: meta('karren', 'ay', 0.78),
  tx: meta('karren', 'tx', 0.948),
  ty: meta('karren', 'ty', 0.67)
}
/** Where the axle lies in the body frame (x forward, y up from the centre of mass); the loading board is a little above. */
export const AXLE_X = -1.15
export const AXLE_Y = -0.37
/** The bed of the cart lies this far above the axle (metres), measured from the picture (the bed top is at 49 per cent of its height). */
export const BED_Y = AXLE_Y + (CART.ay - 0.49) * CART.mh

// ── the animals ────────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface AnimalArt {
  /** The file name before `-a` and `-b`. */
  file: string
  /** The height of the picture in metres, and the share of its width where the feet are, and the collar ring (shares of width and height). */
  h: number
  footX: number
  ringX: number
  ringY: number
}
export const ANIMAL_ART: Record<AnimalId, AnimalArt> = {
  donkey: { file: 'esel', h: 1.45, footX: 0.54, ringX: 0.53, ringY: 0.55 },
  ox: { file: 'ochse', h: 1.5, footX: 0.5, ringX: 0.65, ringY: 0.41 },
  camel: { file: 'kamel', h: 1.85, footX: 0.49, ringX: 0.61, ringY: 0.44 }
}

// ── things on the way ──────────────────────────────────────────────────────────────────────────────────────────────────────
/** The height of each pickup in metres. */
export const PICKUP_H: Record<PickupKind, number> = { coin: 0.8, date: 0.85, skin: 1.0, pouch: 0.9 }
export const PICKUP_IMAGE: Record<PickupKind, string> = { coin: 'muenze', date: 'dattel', skin: 'schlauch', pouch: 'beutel' }

/** The things on the cart bed, in the order in which they are put on as the tarp upgrade grows (x on the bed from the left, height in metres). */
export const LOAD_ITEMS: { image: string; x: number; h: number }[] = [
  { image: 'krug-gross', x: 0.42, h: 0.72 },
  { image: 'sack', x: 1.05, h: 0.58 },
  { image: 'krug-klein', x: 1.5, h: 0.52 },
  { image: 'korb', x: 0.8, h: 0.5 }
]

/** The decor things (six per route): their height in metres. Set after looking at the painted sheets. */
export const DECOR_H: Record<number, number[]> = {
  1: [5.0, 3.4, 2.0, 1.7, 2.4, 1.4],
  2: [3.4, 1.3, 2.2, 4.2, 1.0, 2.6],
  3: [5.0, 4.4, 2.0, 2.0, 2.2, 3.2],
  4: [5.0, 3.4, 2.4, 2.0, 2.2, 4.6],
  5: [1.9, 2.6, 1.7, 1.5, 1.2, 2.2],
  6: [3.4, 5.0, 3.8, 4.2, 1.9, 2.4]
}

/** How the layers of the background sit on the screen (shares of the screen height) and how fast they move (the share of the camera). */
export interface Look {
  /** The sky picture: its height as a share of the screen and the top edge (negative: above the screen). */
  skyH: number
  skyTop: number
  skyPar: number
  /** The mid hills: the height of the picture, the bottom edge, the move. */
  midH: number
  midBottom: number
  midPar: number
  /** The colour of the sky above the picture and of the dust. */
  skyColor: string
  dust: string
}
export const LOOKS: Look[] = [
  { skyH: 1.25, skyTop: -0.3, skyPar: 0.04, midH: 0.26, midBottom: 0.86, midPar: 0.22, skyColor: '#f4977a', dust: '224,190,130' },
  { skyH: 1.25, skyTop: -0.3, skyPar: 0.04, midH: 0.26, midBottom: 0.86, midPar: 0.22, skyColor: '#b87a9a', dust: '200,170,120' },
  { skyH: 1.25, skyTop: -0.3, skyPar: 0.04, midH: 0.26, midBottom: 0.86, midPar: 0.22, skyColor: '#1c2a5a', dust: '150,160,190' },
  { skyH: 1.25, skyTop: -0.3, skyPar: 0.04, midH: 0.26, midBottom: 0.86, midPar: 0.22, skyColor: '#8cc4e6', dust: '190,190,150' },
  { skyH: 1.25, skyTop: -0.3, skyPar: 0.04, midH: 0.26, midBottom: 0.86, midPar: 0.22, skyColor: '#9cc8ee', dust: '210,200,180' },
  { skyH: 1.25, skyTop: -0.3, skyPar: 0.04, midH: 0.26, midBottom: 0.86, midPar: 0.22, skyColor: '#f0b070', dust: '210,190,140' }
]

/** How many metres of the ground picture fit into its width (the picture repeats along the way). */
export const BAND_M = 6.4
