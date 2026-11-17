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
  'karren', 'karren-2', 'karren-3', 'karren-4', 'rad', 'rad-2', 'rad-3', 'rad-4',
  'esel-a', 'esel-b', 'kamel-a', 'kamel-b', 'ochse-a', 'ochse-b',
  ...['esel', 'ochse', 'kamel', 'pferd'].flatMap((a) => [1, 2, 3, 4, 5, 6].map((k) => `${a}-teil-${k}`)),
  'krug-gross', 'krug-klein', 'sack', 'korb', 'plane', 'scherben',
  'dattel', 'schlauch', 'muenze', 'beutel', 'feder', 'oase', 'ziel',
  ...[1, 2, 3, 4, 5, 6].map((k) => `sym-${k}`)
]

/** The pictures of one route (n counts from 1): sky with far mountains, mid hills, the strip of ground and the six decor things. */
export function routeImages(n: number): string[] {
  return [`fern-${n}`, `mitte-${n}`, `boden-${n}`, ...[1, 2, 3, 4, 5, 6].map((k) => `deko-${n}-${k}`), ...[1, 2, 3, 4, 5].map((k) => `vorn-${n}-${k}`)]
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
  camel: { file: 'kamel', h: 1.85, footX: 0.49, ringX: 0.61, ringY: 0.44 },
  horse: { file: 'pferd', h: 1.9, footX: 0.5, ringX: 0.6, ringY: 0.5 }
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

/**
 * Where the layers of the background are on a screen of `hPx` pixels with the camera at height `camY` (metres). The mid hills end at their bottom
 * edge, and everything below it down to the bottom of the screen is filled with their colour: without that fill a jump (the ground far below the
 * screen) showed a broad bar of the sky picture there. The sky picture always covers the whole screen.
 */
export function backgroundBands(look: Look, hPx: number, camY: number, ppm: number) {
  const skyHpx = hPx * look.skyH
  let skyTop = hPx * look.skyTop + Math.max(-1.2, Math.min(1.2, (camY - 3) * 0.04)) * hPx * 0.04
  skyTop = Math.min(0, Math.max(hPx - skyHpx, skyTop))
  const midH = hPx * look.midH
  const midBottom = hPx * look.midBottom + Math.max(-2, Math.min(2, (camY - 3) * 0.5)) * ppm * 0.18
  return { skyTop, skyH: skyHpx, midH, midBottom, fillFrom: Math.min(hPx, midBottom - 1), fillTo: hPx }
}

// ── the cart grows with the parts ──────────────────────────────────────────────────────────────────────────────────────────
/** The cart pictures from the plain wooden cart (0) to the gilded wagon (3), and the wheels from wood to gold. */
export const CART_IMAGES = ['karren', 'karren-2', 'karren-3', 'karren-4']
export const WHEEL_IMAGES = ['rad', 'rad-2', 'rad-3', 'rad-4']

/** Measures of a cart picture (a missing one falls back to the plain cart). */
export function cartMeta(name: string) {
  return {
    mw: meta(name, 'mw', CART.mw),
    mh: meta(name, 'mh', CART.mh),
    ax: meta(name, 'ax', CART.ax),
    ay: meta(name, 'ay', CART.ay),
    tx: meta(name, 'tx', CART.tx),
    ty: meta(name, 'ty', CART.ty),
    /** The share of the picture height where the loading board lies. */
    bed: meta(name, 'bed', 0.49)
  }
}

/** The names of the cart levels in the workshop (text keys). */
export const TIER_KEYS = ['wood', 'strong', 'painted', 'gilded']

// ── the paper-doll animals ─────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * How the painted pieces of an animal fit together (shares of each picture). `prefix` + 1 is the body, +2 the tail, +3 to +6 the legs (near fore,
 * far fore, near hind, far hind). `fore` and `hind` are the places on the body where the legs are fixed, `ring` the collar ring where the strap of the
 * pole is tied, `tailAt` where the tail is fixed on the body, `tailPivot` the top of the tail, `legX` the fixing on each leg (share of its width),
 * `knee` the share of the leg height where the knee or hock bends.
 */
export interface RigArt {
  prefix: string
  fore: { x: number; y: number }
  hind: { x: number; y: number }
  ring: { x: number; y: number }
  tailAt: { x: number; y: number }
  tailPivot: { x: number; y: number }
  legX: number[]
  knee: number[]
}
export const RIG_ART: Record<AnimalId, RigArt> = {
  donkey: { prefix: 'esel-teil-', fore: { x: 0.567, y: 0.855 }, hind: { x: 0.153, y: 0.836 }, ring: { x: 0.49, y: 0.755 }, tailAt: { x: 0.033, y: 0.7 }, tailPivot: { x: 0.7, y: 0.02 }, legX: [0.49, 0.49, 0.55, 0.55], knee: [0.46, 0.46, 0.42, 0.42] },
  ox: { prefix: 'ochse-teil-', fore: { x: 0.6, y: 0.85 }, hind: { x: 0.18, y: 0.84 }, ring: { x: 0.62, y: 0.7 }, tailAt: { x: 0.03, y: 0.6 }, tailPivot: { x: 0.5, y: 0.02 }, legX: [0.5, 0.5, 0.55, 0.55], knee: [0.46, 0.46, 0.42, 0.42] },
  camel: { prefix: 'kamel-teil-', fore: { x: 0.64, y: 0.85 }, hind: { x: 0.2, y: 0.84 }, ring: { x: 0.64, y: 0.7 }, tailAt: { x: 0.03, y: 0.6 }, tailPivot: { x: 0.5, y: 0.02 }, legX: [0.5, 0.5, 0.55, 0.55], knee: [0.46, 0.46, 0.42, 0.42] },
  horse: { prefix: 'pferd-teil-', fore: { x: 0.62, y: 0.85 }, hind: { x: 0.2, y: 0.84 }, ring: { x: 0.62, y: 0.7 }, tailAt: { x: 0.03, y: 0.6 }, tailPivot: { x: 0.5, y: 0.02 }, legX: [0.5, 0.5, 0.55, 0.55], knee: [0.46, 0.46, 0.42, 0.42] }
}
