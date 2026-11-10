/**
 * Sample data of the two new games of "Der verlorene Sohn" (`sohn`) for the tests of their logic and of their components (the real data lie in `src/data/adventures/sohn.ts`).
 * Every sample passes the check of its game (`*Problems`), the tests of the components play it through.
 */
import type { LookoutGame } from '@/utils/sohnNeuA'
import type { DanceGame } from '@/utils/sohnNeuB'

const G = 'images/abenteuer/spiele/sohn/'

export const LOOKOUT: LookoutGame = {
  background: `${G}ausschau/strasse.webp`,
  halo: `${G}ausschau/halo.webp`,
  ratio: 1.5,
  haloW: 22,
  walkers: [
    { id: 'haendler', name: 'ein Händler', look: 'ein Händler mit einem beladenen Esel', image: `${G}ausschau/haendler.webp`, ratio: 1.167 },
    { id: 'frau', name: 'eine Frau mit Krug', look: 'eine Frau mit einem Krug auf dem Kopf', image: `${G}ausschau/frau.webp`, ratio: 0.667 },
    { id: 'sohn', name: 'der Sohn', look: 'ein Mann allein, barfuß, in zerrissenem Gewand', image: `${G}ausschau/sohn.webp`, ratio: 0.667 },
    { id: 'hirte', name: 'ein Hirte', look: 'ein Hirte mit drei Schafen', image: `${G}ausschau/hirte.webp`, ratio: 1.333 },
    { id: 'bauer', name: 'ein Bauer', look: 'ein Bauer mit einer Hacke', image: `${G}ausschau/bauer.webp`, ratio: 0.667 },
    { id: 'jungmann', name: 'ein junger Mann', look: 'ein junger Mann in bunter Tunika', image: `${G}ausschau/jungmann.webp`, ratio: 0.667 }
  ],
  lanes: [
    { from: { x: 46.5, y: 41, w: 3 }, to: { x: 28, y: 93, w: 18 } },
    { from: { x: 50, y: 40.5, w: 3.2 }, to: { x: 50, y: 94, w: 19 } },
    { from: { x: 53.5, y: 41, w: 3 }, to: { x: 72, y: 93, w: 18 } }
  ],
  rounds: [
    {
      hint: 'Halte Ausschau und tippe auf den Sohn, sobald du ihn erkennst.',
      son: 'sohn',
      order: [
        { walker: 'haendler', lane: 0, delay: 0, dur: 17000 },
        { walker: 'frau', lane: 2, delay: 4000, dur: 15000 },
        { walker: 'sohn', lane: 1, delay: 9000, dur: 19000 },
        { walker: 'hirte', lane: 0, delay: 18000, dur: 15000 }
      ]
    },
    {
      hint: 'Jetzt kommen sechs. Schau genau hin.',
      son: 'sohn',
      order: [
        { walker: 'bauer', lane: 2, delay: 0, dur: 11000 },
        { walker: 'haendler', lane: 0, delay: 2000, dur: 12000 },
        { walker: 'sohn', lane: 1, delay: 8000, dur: 14000 },
        { walker: 'jungmann', lane: 2, delay: 12000, dur: 10000 },
        { walker: 'frau', lane: 0, delay: 15000, dur: 11000 },
        { walker: 'hirte', lane: 2, delay: 23000, dur: 10000 }
      ]
    }
  ]
}

export const DANCE: DanceGame = {
  background: `${G}reigen/festhof.webp`,
  band: `${G}reigen/band.webp`,
  notes: [`${G}reigen/noten-1.webp`, `${G}reigen/noten-2.webp`, `${G}reigen/noten-3.webp`],
  lyre: `${G}reigen/leier.webp`,
  lyreAt: { x: 11, y: 27, w: 11 },
  ratio: 1.5,
  dancerW: 12.5,
  dancerRatio: 0.625,
  handR: 5.5,
  bandH: 3.2,
  hopMs: 500,
  dancers: [
    { id: 'vater', name: 'der Vater', image: `${G}reigen/vater-fest.webp` },
    { id: 'sohn', name: 'der jüngere Sohn', image: `${G}reigen/sohn-fest.webp` },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({ id: `g${k}`, name: `Gast ${k}`, image: `${G}reigen/tanzer-${k}.webp` }))
  ],
  rounds: [
    {
      hint: 'Verbinde die Tänzer, bis sich alle an den Händen halten.',
      mode: 'neighbours',
      places: [
        { id: 'vater', x: 36.5, y: 35.5 },
        { id: 'sohn', x: 63.5, y: 35.5 },
        { id: 'g1', x: 77, y: 52 },
        { id: 'g2', x: 63.5, y: 68.5 },
        { id: 'g3', x: 36.5, y: 68.5 },
        { id: 'g4', x: 23, y: 52 }
      ],
      order: ['vater', 'sohn', 'g1', 'g2', 'g3', 'g4']
    },
    {
      hint: 'Reiche jedem Tänzer zwei Hände, bis ein großer Ring entsteht.',
      mode: 'free',
      places: [
        { id: 'g5', x: 24, y: 30 },
        { id: 'g1', x: 41, y: 26 },
        { id: 'vater', x: 59, y: 28 },
        { id: 'g6', x: 76, y: 31 },
        { id: 'g3', x: 91, y: 52 },
        { id: 'g8', x: 76, y: 74 },
        { id: 'sohn', x: 59, y: 78 },
        { id: 'g2', x: 41, y: 76 },
        { id: 'g7', x: 24, y: 73 },
        { id: 'g4', x: 9, y: 52 }
      ],
      order: ['g5', 'g1', 'vater', 'g6', 'g3', 'g8', 'sohn', 'g2', 'g7', 'g4']
    }
  ]
}
