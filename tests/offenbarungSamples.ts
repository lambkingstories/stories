/**
 * Sample data of the five new games of "Alles wird neu" (`offenbarung`) for the tests of their logic and of their components (the real data lie in `src/data/adventures/offenbarung.ts`).
 * Every sample passes the check of its game (`*Problems`), the tests of the components play it through.
 */
import type { LettersGame, PraiseGame, WriteGame } from '@/utils/offenbarungNeuA'
import type { GatesGame, PalmsGame } from '@/utils/offenbarungNeuB'

const G = 'images/abenteuer/spiele/offenbarung/'

export const WRITE: WriteGame = {
  desk: `${G}schreiben/tisch.webp`,
  closed: `${G}schreiben/rolle-zu.webp`,
  inkwell: `${G}schreiben/tintenfass.webp`,
  pen: `${G}schreiben/feder.webp`,
  script: `${G}schreiben/schrift-zeile.webp`,
  dropFull: `${G}schreiben/tropfen-voll.webp`,
  dropEmpty: `${G}schreiben/tropfen-leer.webp`,
  ratio: 1.5,
  inkwellAt: { x: 88, y: 40, r: 9 },
  inkwellW: 13,
  lineX: [15, 68],
  lineYs: [26, 38, 50, 62, 74],
  band: 5,
  scriptH: 7,
  penW: 8,
  penTip: { x: 0.08, y: 0.96 },
  penRest: { x: 84, y: 94 },
  dropAt: { x: 88, y: 21 },
  dropW: 6.4,
  inkPerDip: 0.6,
  warnAt: 0.2,
  rounds: [
    { hint: 'Drei kurze Zeilen.', lines: 3, lineLength: 1 },
    { hint: 'Fünf längere Zeilen.', lines: 5, lineLength: 1.6 }
  ]
}

export const LETTERS: LettersGame = {
  map: `${G}briefe/karte.webp`,
  messenger: [`${G}briefe/bote-1.webp`, `${G}briefe/bote-2.webp`],
  lamp: `${G}briefe/leuchter.webp`,
  ratio: 1.5,
  speed: 30,
  messengerW: 11,
  gateR: 6.5,
  lampW: 6,
  // a road in a ring-like shape: 90 units long
  path: [
    { x: 10, y: 80 },
    { x: 10, y: 50 },
    { x: 30, y: 20 },
    { x: 60, y: 15 },
    { x: 85, y: 35 },
    { x: 85, y: 70 }
  ],
  cities: [
    { id: 'ephesus', name: 'Ephesus', at: 0.05, letter: `${G}briefe/brief-ephesus.webp` },
    { id: 'smyrna', name: 'Smyrna', at: 0.2, letter: `${G}briefe/brief-smyrna.webp` },
    { id: 'pergamon', name: 'Pergamon', at: 0.35, letter: `${G}briefe/brief-pergamon.webp` },
    { id: 'thyatira', name: 'Thyatira', at: 0.5, letter: `${G}briefe/brief-thyatira.webp` },
    { id: 'sardes', name: 'Sardes', at: 0.65, letter: `${G}briefe/brief-sardes.webp` },
    { id: 'philadelphia', name: 'Philadelphia', at: 0.8, letter: `${G}briefe/brief-philadelphia.webp` },
    { id: 'laodizea', name: 'Laodizea', at: 1, letter: `${G}briefe/brief-laodizea.webp` }
  ],
  rounds: [
    { hint: 'Gib dem Boten den richtigen Brief.', cities: ['ephesus', 'smyrna', 'pergamon'], names: true, tray: ['pergamon', 'ephesus', 'smyrna'] },
    { hint: 'Jetzt sieben Briefe, ohne Namen am Tor.', cities: ['ephesus', 'smyrna', 'pergamon', 'thyatira', 'sardes', 'philadelphia', 'laodizea'], names: false, tray: ['laodizea', 'smyrna', 'thyatira', 'ephesus', 'philadelphia', 'pergamon', 'sardes'] }
  ]
}

export const PRAISE: PraiseGame = {
  world: `${G}lob/welt.webp`,
  lamb: `${G}lob/lamm.webp`,
  wave: `${G}lob/klang.webp`,
  ratio: 1.5,
  lambAt: { x: 50, y: 13, w: 11 },
  duration: 20000,
  silent: 2000,
  order: ['himmel', 'erde', 'meer'],
  zones: [
    { id: 'himmel', name: 'Der Himmel', place: 'im Himmel', box: { left: 0, top: 0, right: 100, bottom: 33 }, still: `${G}lob/himmel-still.webp`, sing: `${G}lob/himmel-lob.webp`, fade: 7000, offset: 0 },
    { id: 'erde', name: 'Die Erde', place: 'auf Erden', box: { left: 0, top: 33, right: 100, bottom: 72 }, still: `${G}lob/erde-still.webp`, sing: `${G}lob/erde-lob.webp`, fade: 6500, offset: 1000 },
    { id: 'meer', name: 'Das Meer', place: 'im Meer', box: { left: 0, top: 72, right: 100, bottom: 100 }, still: `${G}lob/meer-still.webp`, sing: `${G}lob/meer-lob.webp`, fade: 6000, offset: 2000 }
  ],
  rounds: [{ hint: 'Ruf Himmel, Erde und Meer zum Lob.' }, { hint: 'Halte alle beim Singen.' }]
}

export const PALMS: PalmsGame = {
  crowd: `${G}palmen/schar.webp`,
  lamb: `${G}lob/lamm.webp`,
  meterPalm: `${G}palmen/tempo-palme.webp`,
  meterNeedle: `${G}palmen/tempo-zeiger.webp`,
  ratio: 3,
  lambAt: { x: 50, y: 36, w: 6 },
  cols: 11,
  hold: 900,
  rows: [
    { down: `${G}palmen/reihe-1-unten.webp`, up: `${G}palmen/reihe-1-oben.webp`, y: 58, h: 40 },
    { down: `${G}palmen/reihe-2-unten.webp`, up: `${G}palmen/reihe-2-oben.webp`, y: 36, h: 30 },
    { down: `${G}palmen/reihe-3-unten.webp`, up: `${G}palmen/reihe-3-oben.webp`, y: 18, h: 22 }
  ],
  rounds: [
    {
      hint: 'Streich ruhig über die Schar.',
      waves: [
        { row: 0, speed: [0.25, 0.6] },
        { row: 0, speed: [0.25, 0.6] }
      ]
    },
    {
      hint: 'Jetzt sind es drei Reihen.',
      waves: [
        { row: 0, speed: [0.25, 0.6] },
        { row: 1, speed: [0.22, 0.55] },
        { row: 2, speed: [0.2, 0.5] }
      ]
    }
  ]
}

export const GATES: GatesGame = {
  city: `${G}perlentore/stadt.webp`,
  cityOpen: `${G}perlentore/stadt-offen.webp`,
  rose: `${G}perlentore/windrose.webp`,
  gate: `${G}perlentore/tor-perle.webp`,
  roseAt: { x: 86, y: 86 },
  roseW: 22,
  gateW: 9,
  openR: 9,
  sides: [
    { id: 'morgen', word: 'Morgen', part: 'Vom Morgen drei Tore', name: 'Seite Morgen (Osten)', dir: { x: 1, y: 0 }, openings: [{ x: 88, y: 20 }, { x: 88, y: 36 }, { x: 88, y: 52 }] },
    { id: 'abend', word: 'Abend', part: 'Vom Abend drei Tore', name: 'Seite Abend (Westen)', dir: { x: -1, y: 0 }, openings: [{ x: 12, y: 34 }, { x: 12, y: 50 }, { x: 12, y: 66 }] },
    { id: 'mitternacht', word: 'Mitternacht', part: 'Von Mitternacht drei Tore', name: 'Seite Mitternacht (Norden)', dir: { x: 0, y: -1 }, openings: [{ x: 34, y: 12 }, { x: 50, y: 12 }, { x: 66, y: 12 }] },
    { id: 'mittag', word: 'Mittag', part: 'Vom Mittag drei Tore', name: 'Seite Mittag (Süden)', dir: { x: 0, y: 1 }, openings: [{ x: 30, y: 88 }, { x: 46, y: 88 }, { x: 62, y: 88 }] }
  ],
  rounds: [
    { hint: 'Zuerst Morgen und Abend.', order: ['morgen', 'abend'] },
    { hint: 'Jetzt Mitternacht und Mittag.', order: ['mitternacht', 'mittag'] }
  ]
}
