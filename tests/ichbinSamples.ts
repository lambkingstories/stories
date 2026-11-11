/**
 * Sample data of the two new games of "Jesus erzählt von sich" (`ichbin`) for the tests of their logic and of their components (the real data lie in `src/data/adventures/ichbin.ts`).
 * Every sample passes the check of its game (`*Problems`), the tests of the components play it through.
 */
import type { BreezeGame, HerdCallGame } from '@/utils/ichbinNeu'

const G = 'images/abenteuer/spiele/ichbin/'

export const BREEZE: BreezeGame = {
  background: `${G}wehen/hof.webp`,
  ratio: 1.5,
  things: [
    { id: 'flamme', kind: 'flame', label: 'die Flamme der Lampe', x: 22, y: 47, w: 7, ratio: 0.667, image: `${G}wehen/flamme-still.webp`, images: { left: `${G}wehen/flamme-links.webp`, right: `${G}wehen/flamme-rechts.webp` } },
    { id: 'tuch', kind: 'cloth', label: 'ein Tuch an der Leine', x: 62, y: 36, w: 20, ratio: 1.231, image: `${G}wehen/tuch-still.webp`, images: { left: `${G}wehen/tuch-links.webp`, right: `${G}wehen/tuch-rechts.webp` } },
    { id: 'zweig', kind: 'twig', label: 'ein Olivenzweig', x: 76, y: 30, w: 18, ratio: 1.2, image: `${G}wehen/zweig.webp` },
    { id: 'gras', kind: 'grass', label: 'Gras', x: 38, y: 96, w: 16, ratio: 1.231, image: `${G}wehen/gras.webp` },
    { id: 'blatt', kind: 'leaf', label: 'ein Blatt', x: 50, y: 62, w: 5, ratio: 1, image: `${G}wehen/blatt.webp` }
  ],
  tablets: { left: `${G}wehen/tafel-links.webp`, still: `${G}wehen/tafel-still.webp`, right: `${G}wehen/tafel-rechts.webp` },
  tabletW: 24,
  rounds: [
    {
      hint: 'Du siehst den Wind nicht. Schau, was er bewegt, und tippe, wohin er weht.',
      ask: 'blown',
      gusts: [
        { dir: 'right', ms: 2500 },
        { dir: 'left', ms: 2500 },
        { dir: 'left', ms: 2500 },
        { dir: 'right', ms: 2500 }
      ]
    },
    {
      hint: 'Der Wind dreht sich. Tippe, wohin er zuletzt weht, oder auf die Ruhe.',
      ask: 'now',
      gusts: [
        { dir: 'left', turnTo: 'right', ms: 2600 },
        { dir: 'left', ms: 2500 },
        { dir: 'right', turnTo: 'left', ms: 2600 },
        { dir: 'calm', ms: 2500 },
        { dir: 'left', turnTo: 'right', ms: 2600 }
      ]
    }
  ]
}

export const HERD: HerdCallGame = {
  background: `${G}hirtenruf/weide.webp`,
  ratio: 1.5,
  fog: [`${G}hirtenruf/nebel-1.webp`, `${G}hirtenruf/nebel-2.webp`],
  fogTop: [24, 38],
  ring: `${G}hirtenruf/ring.webp`,
  shepherd: { image: `${G}hirtenruf/hirte.webp`, x: 14, y: 46, w: 15 },
  stranger: { image: `${G}hirtenruf/fremder.webp` },
  figureRatio: 0.667,
  sheepRatio: 1.222,
  sheep: [
    { id: 's1', image: `${G}hirtenruf/schaf-1.webp`, hearing: `${G}hirtenruf/schaf-1-hoert.webp`, x: 30, y: 54, w: 14, near: 0 },
    { id: 's2', image: `${G}hirtenruf/schaf-2.webp`, hearing: `${G}hirtenruf/schaf-2-hoert.webp`, x: 28, y: 62, w: 15, near: 0 },
    { id: 's3', image: `${G}hirtenruf/schaf-3.webp`, hearing: `${G}hirtenruf/schaf-3-hoert.webp`, x: 50, y: 58, w: 13, near: 1 },
    { id: 's4', image: `${G}hirtenruf/schaf-1.webp`, hearing: `${G}hirtenruf/schaf-1-hoert.webp`, x: 58, y: 64, w: 14, near: 1 },
    { id: 's5', image: `${G}hirtenruf/schaf-2.webp`, hearing: `${G}hirtenruf/schaf-2-hoert.webp`, x: 88, y: 56, w: 11.5, near: 2 },
    { id: 's6', image: `${G}hirtenruf/schaf-3.webp`, hearing: `${G}hirtenruf/schaf-3-hoert.webp`, x: 90, y: 66, w: 12.5, near: 2 }
  ],
  slots: [
    { x: 30, y: 50, w: 14 },
    { x: 44, y: 56, w: 14 },
    { x: 54, y: 70, w: 14 },
    { x: 38, y: 76, w: 14 },
    { x: 22, y: 74, w: 14 },
    { x: 12, y: 64, w: 14 }
  ],
  radii: [30, 55, 85],
  flock: [
    { x: 40, y: 84, w: 15 },
    { x: 50, y: 80, w: 14 },
    { x: 60, y: 84, w: 15 },
    { x: 50, y: 90, w: 16 }
  ],
  sides: { left: { x: 11, y: 60, w: 17 }, right: { x: 89, y: 60, w: 17 } },
  gather: {
    left: [
      { x: 22, y: 72, w: 14 },
      { x: 30, y: 80, w: 15 },
      { x: 20, y: 86, w: 15 },
      { x: 32, y: 92, w: 15 }
    ],
    right: [
      { x: 78, y: 72, w: 14 },
      { x: 70, y: 80, w: 15 },
      { x: 80, y: 86, w: 15 },
      { x: 68, y: 92, w: 15 }
    ]
  },
  nearShift: 22,
  rounds: [
    { hint: 'Tippe auf den Hirten. Jeder Ruf reicht ein Stück weiter.', mode: 'radius' },
    {
      hint: 'Schau, wohin die Schafe laufen, und tippe auf den Hirten.',
      mode: 'who',
      trials: [
        { shepherdSide: 'left', delay: 3600 },
        { shepherdSide: 'right', hesitant: true, delay: 3600 },
        { shepherdSide: 'left', strangerNear: true, delay: 3600 }
      ]
    }
  ]
}
