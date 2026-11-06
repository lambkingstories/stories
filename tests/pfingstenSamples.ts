/**
 * Sample data of the six new games of "Pfingsten" for the logic tests and the mount tests (small, with short times where the game has a clock).
 */
import type { FillGame, TonguesGame, WitnessGame } from '@/utils/pfingstenNeuA'
import type { ChariotGame, HopGame, PeekGame } from '@/utils/pfingstenNeuB'

export const HOP: HopGame = {
  temple: 'tempel',
  low: 'stufe-niedrig',
  high: 'stufe-hoch',
  man: { stand: 'mann-steht', jump: 'mann-springt', praise: 'mann-lobt' },
  buttons: { small: 'knopf-klein', big: 'knopf-gross', praise: 'knopf-loben' },
  from: 14,
  to: 88,
  unit: 4,
  manH: 28,
  rounds: [
    { hint: 'Spring hinauf.', steps: ['n', 'h', 'n', 'n'] },
    { hint: 'Mit Absatz.', steps: ['n', 'L', 'h', 'n', 'h'] }
  ]
}

export const CHARIOT: ChariotGame = {
  far: 'fern',
  near: 'nah',
  wagon: ['wagen-1', 'wagen-2'],
  runner: ['philippus-1', 'philippus-2'],
  zone: 'zone',
  scroll: 'rolle',
  scrollOpen: 'rolle-offen',
  finale: 'einsteigen',
  wagonW: 42,
  wagonY: 26,
  wagonX: 30,
  swing: 14,
  runnerW: 11,
  runnerY: 4,
  window: { from: 0.05, to: 0.38 },
  horses: 0.85,
  rounds: [
    { hint: 'Bleib am Fenster.', speed: [{ t: 0, v: 1 }], fill: 4000 },
    { hint: 'Das Tempo wechselt.', speed: [{ t: 0, v: 1 }, { t: 1500, v: 1.6 }, { t: 3000, v: 0.6 }], fill: 5000 }
  ]
}

export const PEEK: PeekGame = {
  lane: 'gasse',
  open: 'tor-offen',
  rhode: { listen: 'rhode-horcht', run: 'rhode-laeuft' },
  marks: ['merkmal-bart', 'merkmal-tunika', 'merkmal-mantel'],
  walkMs: 2500,
  wait: 2000,
  personH: 80,
  stopX: 50,
  people: [
    { id: 'petrus', image: 'petrus', name: 'Petrus', peter: true },
    { id: 'mann-1', image: 'mann-1', name: 'Ein Mann mit roter Tunika' },
    { id: 'frau-1', image: 'frau-1', name: 'Eine Frau mit Korb' }
  ],
  rounds: [
    {
      hint: 'Wer steht vor dem Tor?',
      gate: 'tor-innen-1',
      slits: [{ x: 30, w: 7 }, { x: 46.5, w: 7 }, { x: 63, w: 7 }],
      people: [{ id: 'frau-1' }, { id: 'mann-1', stop: true }, { id: 'petrus', stop: true }]
    },
    {
      hint: 'Die Ritzen sind schmal.',
      gate: 'tor-innen-2',
      slits: [{ x: 35, w: 3.5 }, { x: 48, w: 3.5 }, { x: 61, w: 3.5 }],
      people: [{ id: 'frau-1' }, { id: 'mann-1', stop: true }, { id: 'frau-1' }, { id: 'petrus', stop: true }]
    }
  ]
}

export const WITNESS: WitnessGame = {
  map: 'karte',
  ring: 'ring',
  light: 'licht',
  centre: { x: 50, y: 50 },
  rings: [12, 25, 37, 48],
  band: 4,
  placeW: 13,
  places: [
    { id: 'ort-jerusalem', image: 'jerusalem', name: 'Jerusalem' },
    { id: 'ort-judaea', image: 'judaea', name: 'Judäa' },
    { id: 'ort-samarien', image: 'samarien', name: 'Samarien' },
    { id: 'ort-ende', image: 'ende', name: 'Das Ende der Erde' }
  ],
  rounds: [
    { hint: 'Leg die Orte in die Ringe.', mode: 'order' },
    { hint: 'Zieh das Licht.', mode: 'stretch' }
  ]
}

export const TONGUES: TonguesGame = {
  map: 'karte',
  ratio: 1.5,
  ear: 'ohr',
  guestW: 10,
  lands: [
    { id: 'rom', x: 15, y: 30, r: 8, home: 'heimat-rom', name: 'Rom' },
    { id: 'kreta', x: 35, y: 55, r: 7, home: 'heimat-kreta', name: 'Kreta' },
    { id: 'aegypten', x: 40, y: 82, r: 8, home: 'heimat-aegypten', name: 'Ägypten' },
    { id: 'parther', x: 88, y: 40, r: 8, home: 'heimat-parther', name: 'Das Land der Parther' }
  ],
  guests: [
    { id: 'rom', land: 'rom', image: 'gast-rom', name: 'Ein Gast aus Rom' },
    { id: 'kreta', land: 'kreta', image: 'gast-kreta', name: 'Ein Gast aus Kreta' },
    { id: 'aegypten', land: 'aegypten', image: 'gast-aegypten', name: 'Ein Gast aus Ägypten' },
    { id: 'parther', land: 'parther', image: 'gast-parther', name: 'Ein Gast aus dem Land der Parther' }
  ],
  rounds: [
    { hint: 'Bring jeden Gast heim.', guests: ['rom', 'kreta'], showHome: true },
    { hint: 'Jetzt ohne Bilder.', guests: ['parther', 'aegypten', 'rom'], showHome: false }
  ]
}

export const FILL: FillGame = {
  yard: 'hof',
  basket: 'korb-leer',
  markFull: 'zeichen-brot',
  markEmpty: 'zeichen-leer',
  gifts: [
    { size: 1, image: 'brot', name: 'Ein Fladenbrot' },
    { size: 2, image: 'korb-2', name: 'Ein kleiner Korb' },
    { size: 3, image: 'korb-3', name: 'Ein großer Korb' },
    { size: 5, image: 'korb-5', name: 'Ein Sack voll Brot' }
  ],
  families: [
    { image: 'familie-1', happy: 'familie-1-froh', name: 'Die alte Frau' },
    { image: 'familie-2', happy: 'familie-2-froh', name: 'Der Vater mit seinem Kind' },
    { image: 'familie-3', happy: 'familie-3-froh', name: 'Die Mutter mit zwei Kindern' },
    { image: 'familie-4', happy: 'familie-4-froh', name: 'Die große Familie' }
  ],
  rounds: [
    { hint: 'Verteile die Gaben.', families: [{ family: 0, need: 1 }, { family: 1, need: 2 }, { family: 2, need: 3 }], gifts: [1, 1, 2, 2] },
    { hint: 'Vier Familien.', families: [{ family: 0, need: 2 }, { family: 1, need: 3 }, { family: 2, need: 4 }, { family: 3, need: 5 }], gifts: [1, 1, 2, 2, 3, 5] }
  ]
}
