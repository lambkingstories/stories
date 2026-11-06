/**
 * Sample data of the five new games of "Paulus" for the logic tests and the mount tests (small, with short times where the game has a clock).
 */
import type { RefindGame, SailGame, StreetGame } from '@/utils/paulusNeuA'
import type { DyeGame, TentShopGame } from '@/utils/paulusNeuB'

/**
 * Two rounds: round 1 two lanes to the right, round 2 three lanes in both directions. Every lane: one thing, speed 10, so that the place of Ananias (44-56 %) is free from 0 to 4.4 s
 * (with the step of 0.4 s) and taken from 4.4 to 8 s of the lane; one turn lasts 14.8 s.
 */
export const STREET: StreetGame = {
  city: 'stadt',
  things: [
    { id: 'esel', image: 'esel', w: 20 },
    { id: 'karren', image: 'karren', w: 24 }
  ],
  walker: { stand: 'hananias-steht', walk: 'hananias-geht' },
  walkerW: 10,
  walkerX: 50,
  gapLight: 'luecke',
  finale: 'sehen',
  stepMs: 400,
  rounds: [
    {
      hint: 'Geh hinauf.',
      lanes: [
        { y: 70, dir: 1, speed: 10, items: ['esel'], gap: 40, offset: 0 },
        { y: 45, dir: 1, speed: 10, items: ['esel'], gap: 40, offset: 0 }
      ],
      safe: [92, 58, 20]
    },
    {
      hint: 'Drei Gassen.',
      lanes: [
        { y: 75, dir: 1, speed: 10, items: ['esel'], gap: 40, offset: 0 },
        { y: 55, dir: -1, speed: 10, items: ['karren'], gap: 40, offset: 0 },
        { y: 35, dir: 1, speed: 10, items: ['esel'], gap: 40, offset: 0 }
      ],
      safe: [92, 65, 45, 15]
    }
  ]
}

export const REFIND: RefindGame = {
  street: 'tarsus',
  barnabas: 'barnabas',
  frame: 'rahmen',
  portrait: 'saulus-bild',
  found: 'gefunden',
  people: [
    { id: 'saulus-geht', image: 'saulus-geht', name: 'Ein Mann mit schwarzem Bart und grauem Mantel', saul: true },
    { id: 'mann-1', image: 'mann-1', name: 'Ein Mann mit grauem Bart' },
    { id: 'mann-2', image: 'mann-2', name: 'Ein Mann mit braunem Mantel' },
    { id: 'mann-3', image: 'mann-3', name: 'Ein Mann mit weißem Turban' },
    { id: 'frau-1', image: 'frau-1', name: 'Eine Frau mit Wasserkrug' }
  ],
  lanes: [
    { y: 90, dir: 1 },
    { y: 78, dir: -1 }
  ],
  personW: 12,
  barnabasW: 12,
  rounds: [
    {
      hint: 'Merk dir Saulus.',
      show: 3000,
      again: 2000,
      walkers: [
        { id: 'mann-1', lane: 0, at: 0, dur: 5000 },
        { id: 'saulus-geht', lane: 0, at: 2000, dur: 5000 },
        { id: 'mann-2', lane: 0, at: 4000, dur: 5000 },
        { id: 'frau-1', lane: 0, at: 6000, dur: 5000 }
      ]
    },
    {
      hint: 'Zwei Reihen.',
      show: 2000,
      again: 2000,
      walkers: [
        { id: 'mann-1', lane: 0, at: 0, dur: 5000 },
        { id: 'mann-2', lane: 1, at: 500, dur: 5000 },
        { id: 'mann-3', lane: 0, at: 2000, dur: 5000 },
        { id: 'frau-1', lane: 1, at: 2500, dur: 5000 },
        { id: 'saulus-geht', lane: 0, at: 4000, dur: 5000 }
      ]
    }
  ]
}

export const SAIL: SailGame = {
  sea: 'meer',
  ship: 'schiff',
  sails: { full: 'segel-voll', half: 'segel-halb', slack: 'segel-schlaff' },
  pennant: 'wimpel',
  wave: 'welle',
  gull: 'moewe',
  strip: 'leiste',
  shipMini: 'schiffchen',
  finale: 'zypern',
  mast: { x: 50, y: 50 },
  shipW: 40,
  sailW: 55,
  sailRing: { x: 50, y: 7 },
  sailTurn: -180,
  pennantTurn: 0,
  full: 25,
  half: 50,
  slackMs: 3000,
  keyStep: 15,
  warnMs: 1000,
  rounds: [
    { hint: 'Segle nach Zypern.', winds: [{ t: 0, dir: 90 }, { t: 7000, dir: 45 }], gusts: [], duration: 15000 },
    { hint: 'Mehr Wind.', winds: [{ t: 0, dir: 90 }, { t: 6000, dir: 150 }, { t: 12000, dir: 90 }], gusts: [3000], duration: 18000 }
  ]
}

const grid = (pre: string) => [0, 1, 2].map((r) => [0, 1, 2].map((b) => `${pre}-r${r}b${b}`))
export const DYE: DyeGame = {
  yard: 'hof',
  cloths: grid('tuch'),
  samples: grid('muster'),
  signs: { red: 'zeichen-rot', blue: 'zeichen-blau' },
  customers: [
    { image: 'kunde-1', happy: 'kunde-1-froh', name: 'Eine Kundin' },
    { image: 'kunde-2', happy: 'kunde-2-froh', name: 'Ein Kunde' }
  ],
  peg: 'knopf-fertig',
  vats: { red: { x: 30, y: 80, w: 22 }, blue: { x: 58, y: 80, w: 22 } },
  customer: { x: 86, y: 94, w: 16 },
  cloth: { x: 44, y: 46, w: 18 },
  maxDips: 2,
  rounds: [
    { hint: 'Färbe wie das Muster.', orders: [{ red: 1, blue: 0, customer: 0 }] },
    { hint: 'Gemischt.', orders: [{ red: 1, blue: 1, customer: 1 }, { red: 2, blue: 1, customer: 0 }] }
  ]
}

const worker = (w: string) => ({ a: `${w}-1`, b: `${w}-2`, happy: `${w}-froh` })
export const TENT: TentShopGame = {
  shop: 'werkstatt',
  finale: 'sabbat',
  pieces: ['stueck-roh', 'stueck-zugeschnitten', 'stueck-genaeht', 'stueck-fertig'],
  bale: 'stoffballen',
  tent: 'zelt-fertig',
  tables: [
    { id: 'cut', image: 'tisch-schneiden', worker: worker('aquila'), name: 'Zuschneiden', x: 30 },
    { id: 'sew', image: 'tisch-naehen', worker: worker('priszilla'), name: 'Nähen', x: 51 },
    { id: 'rope', image: 'tisch-seile', worker: worker('paulus'), name: 'Seile', x: 72 }
  ],
  workMs: 1000,
  tableY: 92,
  tableW: 19,
  workerW: 12,
  pieceW: 12,
  rounds: [
    { hint: 'Ein Stück.', pieces: 1, overlap: false },
    { hint: 'Zwei Stücke.', pieces: 2, overlap: true }
  ]
}
