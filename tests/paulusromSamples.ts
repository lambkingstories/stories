/**
 * Sample data of the five new games of "Bis nach Rom" for the logic tests and the mount tests (small, and arranged so that a click at (x, y) of the 100 x 100 mock field is (x %, y %)).
 */
import type { PlanksGame, QuietSpotGame, WallShadowGame } from '@/utils/paulusromNeuA'
import type { BrushwoodGame, VisitorsGame } from '@/utils/paulusromNeuB'

export const WALL: WallShadowGame = {
  room: 'raum',
  wall: { x: 50, base: 54, h: 40 },
  rowY: 96,
  personW: 18,
  people: [
    { id: 'paulus', image: 'person-paulus', shadow: 'schatten-paulus', name: 'Paulus', shadowName: 'Schatten eines Mannes mit erhobener Hand' },
    { id: 'frau', image: 'person-frau', shadow: 'schatten-frau', name: 'Die Frau mit dem Krug', shadowName: 'Schatten mit einem Krug' },
    { id: 'alter', image: 'person-alter', shadow: 'schatten-alter', name: 'Der alte Mann', shadowName: 'Schatten mit Stock' },
    { id: 'eutychus', image: 'person-eutychus', shadow: 'schatten-eutychus', name: 'Eutychus im Fenster', shadowName: 'Schatten mit angezogenen Knien' }
  ],
  rounds: [
    { hint: 'Tippe auf den, der den Schatten wirft.', people: ['paulus', 'frau', 'alter'], shadows: [{ id: 'frau', scale: 1, flip: false }, { id: 'paulus', scale: 1, flip: false }, { id: 'alter', scale: 1, flip: false }] },
    {
      hint: 'Jetzt vier Zuhörer.',
      people: ['paulus', 'frau', 'alter', 'eutychus'],
      shadows: [{ id: 'alter', scale: 1.3, flip: false }, { id: 'eutychus', scale: 1, flip: true }, { id: 'paulus', scale: 1.3, flip: true }]
    }
  ]
}

export const QUIET: QuietSpotGame = {
  yard: 'hof',
  soldiers: ['soldat-1', 'soldat-2', 'soldat-3', 'soldat-4', 'soldat-5'],
  pair: 'paar',
  pairTalk: 'paar-reden',
  ring: 'hoerkreis',
  soldierW: 15,
  pairW: 18,
  pairR: 7,
  rounds: [
    {
      hint: 'Bring die beiden an einen ruhigen Ort.',
      showRings: 'always',
      start: { x: 50, y: 8 },
      soldiers: [{ sprite: 1, x: 28, y: 30, r: 15 }, { sprite: 2, x: 72, y: 32, r: 15 }, { sprite: 3, x: 50, y: 80, r: 15 }],
      blocks: [{ x: 50, y: 52, r: 7 }, { x: 14, y: 55, r: 3 }, { x: 86, y: 58, r: 3 }]
    },
    {
      hint: 'Jetzt mehr Soldaten.',
      showRings: 'near',
      start: { x: 50, y: 8 },
      soldiers: [{ sprite: 1, x: 24, y: 26, r: 20 }, { sprite: 2, x: 76, y: 26, r: 20 }, { sprite: 3, x: 18, y: 78, r: 20 }, { sprite: 4, x: 84, y: 76, r: 20 }, { sprite: 5, x: 50, y: 40, r: 18 }],
      blocks: [{ x: 50, y: 64, r: 6 }]
    }
  ]
}

export const PLANKS: PlanksGame = {
  bay: 'bucht',
  finale: 'alle-an-land',
  items: [
    { id: 'brett-1', image: 'brett-1', ashore: 'an-land-1', name: 'Ein Seemann auf einem Brett' },
    { id: 'brett-2', image: 'brett-2', ashore: 'an-land-2', name: 'Ein Soldat auf einem Brett' },
    { id: 'brett-3', image: 'brett-3', ashore: 'an-land-3', name: 'Ein Gefangener auf einem Brett' },
    { id: 'stueck-1', image: 'stueck-1', ashore: 'an-land-4', name: 'Ein Mensch auf einem Lukendeckel' }
  ],
  paths: [
    { start: 20, ends: 'shore', points: [{ x: 20, y: 72 }, { x: 24, y: 56 }, { x: 30, y: 24 }] },
    { start: 32, ends: 'rocks', points: [{ x: 32, y: 72 }, { x: 12, y: 54 }, { x: 8, y: 48 }] },
    { start: 46, ends: 'rocks', points: [{ x: 46, y: 72 }, { x: 80, y: 54 }, { x: 90, y: 48 }] },
    { start: 60, ends: 'shore', points: [{ x: 60, y: 72 }, { x: 58, y: 56 }, { x: 64, y: 24 }] },
    { start: 74, ends: 'rocks', points: [{ x: 74, y: 72 }, { x: 92, y: 54 }, { x: 93, y: 46 }] }
  ],
  rail: { y: 72, from: 12, to: 88 },
  boardW: 22,
  ashoreW: 14,
  rounds: [
    { hint: 'Lass das Brett ins Wasser.', boards: ['brett-1', 'brett-2', 'brett-3'], paths: [0, 2, 3] },
    { hint: 'Jetzt mehr.', boards: ['brett-1', 'brett-2', 'brett-3', 'stueck-1'], paths: [0, 1, 2, 3, 4] }
  ]
}

export const BRUSH: BrushwoodGame = {
  beach: 'strand',
  fire: ['feuer-1', 'feuer-2', 'feuer-3', 'feuer-4'],
  fireAt: { x: 14, y: 72 },
  fireW: 24,
  bundle: 'buendel',
  paulus: 'paulus-buendel',
  paulusAt: { x: 36, y: 78 },
  paulusW: 14,
  dot: 'spur-punkt',
  finale: 'am-feuer',
  closeDist: 8,
  rounds: [
    {
      hint: 'Zieh einen Kreis um das Reisig.',
      bundles: 2,
      fireStart: 1,
      things: [
        { id: 'r1', image: 'reisig-1', x: 30, y: 30, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r2', image: 'reisig-2', x: 42, y: 32, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r3', image: 'reisig-3', x: 30, y: 62, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r4', image: 'reisig-4', x: 42, y: 64, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'st', image: 'stein-1', x: 80, y: 80, w: 10, dry: false, name: 'Ein Stein' }
      ]
    },
    {
      hint: 'Jetzt enger.',
      bundles: 3,
      fireStart: 2,
      things: [
        { id: 'r1', image: 'reisig-1', x: 30, y: 24, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r2', image: 'reisig-2', x: 42, y: 24, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r3', image: 'reisig-3', x: 30, y: 50, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r4', image: 'reisig-4', x: 42, y: 50, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r5', image: 'reisig-1', x: 30, y: 80, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'r6', image: 'reisig-2', x: 42, y: 80, w: 11, dry: true, name: 'Trockenes Reisig' },
        { id: 'st', image: 'stein-1', x: 50, y: 36, w: 10, dry: false, name: 'Ein Stein' },
        { id: 'tg', image: 'tang', x: 80, y: 62, w: 11, dry: false, name: 'Nasser Seetang' }
      ]
    }
  ]
}

export const VISIT: VisitorsGame = {
  room: 'wohnung',
  soldier: { sit: 'soldat-hocker', carry: 'soldat-traegt' },
  paulus: { stand: 'paulus-steht', walk: 'paulus-geht', talk: 'paulus-redet' },
  chain: 'kette',
  reach: 'reichweite',
  finale: 'alle-hoeren',
  guests: [
    { id: 'g1', image: 'gast-1', listening: 'gast-1-hoert', name: 'Ein Ältester' },
    { id: 'g2', image: 'gast-2', listening: 'gast-2-hoert', name: 'Eine Mutter' },
    { id: 'g3', image: 'gast-3', listening: 'gast-3-hoert', name: 'Ein Händler' },
    { id: 'g4', image: 'gast-4', listening: 'gast-4-hoert', name: 'Ein junger Mann' },
    { id: 'g5', image: 'gast-5', listening: 'gast-5-hoert', name: 'Eine alte Frau' }
  ],
  stools: [{ x: 22, y: 72 }, { x: 50, y: 82 }, { x: 78, y: 70 }, { x: 50, y: 46 }],
  beside: { x: 7, y: -3 },
  chainLen: 28,
  soldierW: 18,
  paulusW: 15,
  guestW: 15,
  standOff: 8,
  rounds: [
    {
      hint: 'Stell den Hocker so hin, dass Paulus jeden Gast erreicht.',
      showReach: true,
      stools: [0, 1, 2],
      visits: [{ arrivals: [{ guest: 0, at: { x: 16, y: 44 } }] }, { arrivals: [{ guest: 1, at: { x: 54, y: 60 } }] }]
    },
    {
      hint: 'Jetzt ohne Kreis.',
      showReach: false,
      stools: [0, 1, 2, 3],
      visits: [{ arrivals: [{ guest: 2, at: { x: 14, y: 86 } }] }, { arrivals: [{ guest: 3, at: { x: 30, y: 44 } }, { guest: 4, at: { x: 66, y: 40 } }] }, { arrivals: [{ guest: 0, at: { x: 80, y: 90 } }, { guest: 1, at: { x: 60, y: 60 } }] }]
    }
  ]
}
