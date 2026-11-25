/**
 * Sample data of the four new games of "Hiskia: Ein Brief vor Gott" (`hiskia`) for the tests of their logic and of their components (the real data lie in `src/data/adventures/hiskia.ts`).
 * Every sample passes the check of its game (`*Problems`), the tests of the components play it through. The places are made so that the checks hold; they are not the places of the painted pictures
 * (copied from the first data, 25.11.2026, tools/samples_hiskia.py).
 */
import type { CityMorningGame, RunRoutesGame, SundialGame, TunnelGame } from '@/utils/hiskiaNeu'

const G = 'images/abenteuer/spiele/hiskia/'

export const RUN: RunRoutesGame = {
  background: `${G}laufwege/karte.webp`,
  ratio: 1.5,
  city: { image: `${G}laufwege/jerusalem.webp`, label: 'Jerusalem', x: 50, y: 86, w: 18 },
  cityRatio: 1.273,
  townRatio: 1.176,
  runners: [
    { image: `${G}laufwege/laeufer-1.webp`, label: 'Läufer mit Stirnband' },
    { image: `${G}laufwege/laeufer-2.webp`, label: 'Läufer mit Bartschatten' },
    { image: `${G}laufwege/laeufer-3.webp`, label: 'junger Läufer' }
  ],
  runnerRatio: 0.684,
  runnerW: 12.5,
  waiting: [{ x: 7, y: 96 }, { x: 19, y: 96 }, { x: 31, y: 96 }],
  road: `${G}laufwege/strasse.webp`,
  roadH: 3.4,
  step: `${G}laufwege/fuss.webp`,
  letter: `${G}laufwege/brief.webp`,
  letterRatio: 0.75,
  letterW: 5,
  scenes: { comes: `${G}laufwege/kommt.webp`, laughs: `${G}laufwege/lacht.webp` },
  sceneRatio: 1.286,
  sceneW: 22,
  rounds: [
    {
      hint: 'Zwei Läufer, fünf Städte. Tippe einen Läufer an, dann die Stadt, zu der er läuft.',
      runners: 2,
      letters: 3,
      towns: [
        { id: '1', image: `${G}laufwege/ort-1.webp`, label: 'Stadt 1', x: 52, y: 51, w: 15, reacts: 'laughs' },
        { id: '2', image: `${G}laufwege/ort-2.webp`, label: 'Stadt 2', x: 74, y: 67, w: 15, reacts: 'comes' },
        { id: '3', image: `${G}laufwege/ort-3.webp`, label: 'Stadt 3', x: 20, y: 46, w: 15, reacts: 'laughs' },
        { id: '4', image: `${G}laufwege/ort-4.webp`, label: 'Stadt 4', x: 70, y: 28, w: 15, reacts: 'laughs' },
        { id: '5', image: `${G}laufwege/ort-5.webp`, label: 'Stadt 5', x: 33, y: 70, w: 15, reacts: 'comes' }
      ],
      roads: [['J', '1'], ['J', '2'], ['J', '5'], ['1', '2'], ['1', '3'], ['1', '4'], ['1', '5'], ['3', '5']]
    },
    {
      hint: 'Drei Läufer, sieben Städte. In jede Stadt kommt nur ein Brief.',
      runners: 3,
      letters: 3,
      towns: [
        { id: '1', image: `${G}laufwege/ort-1.webp`, label: 'Stadt 1', x: 75, y: 62, w: 15, reacts: 'comes' },
        { id: '2', image: `${G}laufwege/ort-2.webp`, label: 'Stadt 2', x: 74, y: 29, w: 15, reacts: 'comes' },
        { id: '3', image: `${G}laufwege/ort-3.webp`, label: 'Stadt 3', x: 34, y: 55, w: 15, reacts: 'comes' },
        { id: '4', image: `${G}laufwege/ort-4.webp`, label: 'Stadt 4', x: 54, y: 54, w: 15, reacts: 'comes' },
        { id: '5', image: `${G}laufwege/ort-5.webp`, label: 'Stadt 5', x: 13, y: 58, w: 15, reacts: 'laughs' },
        { id: '6', image: `${G}laufwege/ort-6.webp`, label: 'Stadt 6', x: 24, y: 19, w: 15, reacts: 'laughs' },
        { id: '7', image: `${G}laufwege/ort-7.webp`, label: 'Stadt 7', x: 42, y: 30, w: 15, reacts: 'laughs' }
      ],
      roads: [
        ['J', '1'],
        ['J', '3'],
        ['J', '4'],
        ['1', '2'],
        ['1', '4'],
        ['2', '4'],
        ['2', '7'],
        ['3', '4'],
        ['3', '5'],
        ['3', '6'],
        ['3', '7'],
        ['4', '7'],
        ['6', '7']
      ]
    }
  ]
}

export const MORNING: CityMorningGame = {
  background: `${G}stadtmorgen/hang.webp`,
  ratio: 0.75,
  houses: [
    { shut: `${G}stadtmorgen/haus-1-zu.webp`, open: `${G}stadtmorgen/haus-1-auf.webp` },
    { shut: `${G}stadtmorgen/haus-2-zu.webp`, open: `${G}stadtmorgen/haus-2-auf.webp` }
  ],
  houseRatio: 1.077,
  fill: 0.94,
  rounds: [
    {
      hint: 'Neun Häuser, drei Türen sind noch zu.',
      cols: 3,
      rows: 3,
      shut: [true, false, false, false, true, false, false, false, true],
      grid: { x: 11, y: 30, w: 78, h: 58.5 }
    },
    {
      hint: 'Zwölf Häuser, sieben Türen sind noch zu.',
      cols: 3,
      rows: 4,
      shut: [true, false, false, true, true, false, true, true, false, true, false, true],
      grid: { x: 17, y: 22, w: 66, h: 64 }
    }
  ]
}

export const SUNDIAL: SundialGame = {
  background: `${G}sonnenuhr/treppe.webp`,
  ratio: 0.75,
  treads: [20.5, 26.2, 31.9, 37.6, 43.3, 49, 54.7, 60.4, 66.1, 71.8, 77.5, 83.2, 88.9, 94.6],
  post: { x: 50, y: 17 },
  shadow: `${G}sonnenuhr/schatten.webp`,
  shadowW: 7,
  tip: `${G}sonnenuhr/spitze.webp`,
  tipW: 17,
  notchX: 9,
  rounds: [
    {
      hint: 'Der Schatten geht drei Stufen vorwärts, die Treppe hinab. Zeige, wo er dann steht.',
      start: 4,
      steps: 3,
      dir: 1
    },
    {
      hint: 'Jetzt geht der Schatten zehn Stufen zurück, die Treppe hinauf. Zeige, wo er dann steht.',
      start: 13,
      steps: 10,
      dir: -1
    }
  ]
}

export const TUNNEL: TunnelGame = {
  background: `${G}stollen/fels.webp`,
  ratio: 1.5,
  spring: { image: `${G}stollen/quelle.webp`, x: 8, w: 14, label: 'die Quelle' },
  pool: { image: `${G}stollen/teich.webp`, x: 92, w: 14, label: 'der Teich' },
  crews: {
    left: `${G}stollen/trupp-links.webp`,
    right: `${G}stollen/trupp-rechts.webp`,
    w: 14,
    labelLeft: 'Gräbertrupp bei der Quelle',
    labelRight: 'Gräbertrupp beim Teich'
  },
  tile: { gang: `${G}stollen/gang.webp`, water: `${G}stollen/wasser.webp`, w: 4.4 },
  knock: `${G}stollen/klopf.webp`,
  pointer: `${G}stollen/zeiger.webp`,
  bands: { ab: `${G}stollen/schicht-ab.webp`, auf: `${G}stollen/schicht-auf.webp` },
  tolerance: { three: 1.5, two: 3, join: 8 },
  rounds: [
    {
      hint: 'Wähle für beide Trupps eine Richtung und tippe auf »Graben«. Die dunklen Schichten schieben den Stollen zur Seite.',
      pieces: 5,
      seg: 9,
      turn: 20,
      left: { x: 6, y: 22 },
      right: { x: 94, y: 38 },
      bands: [{ x0: 18, x1: 34, shift: 1.8, image: 'ab' }, { x0: 66, x1: 82, shift: -1.8, image: 'auf' }],
      listen: 'always'
    },
    {
      hint: 'Drei Schichten schieben den Stollen. Tippe auf »Horchen«, dann siehst du, wo der andere Trupp klopft.',
      pieces: 6,
      seg: 7.5,
      turn: 20,
      left: { x: 6, y: 30 },
      right: { x: 94, y: 46 },
      bands: [
        { x0: 14, x1: 28, shift: -2, image: 'auf' },
        { x0: 40, x1: 58, shift: 2.2, image: 'ab' },
        { x0: 72, x1: 86, shift: -2, image: 'auf' }
      ],
      listen: 'button'
    }
  ]
}
