/**
 * The data of the two games of the lost son (`entgegen` = MeetGame, `heimweg` = HomeGame) as they stood in "Geschichten von Jesus" until the rebuild of 10.11.2026
 * (copied from `src/data/adventures/gleichnisse.ts` of the commit before). The adventure does not use them any more (the lost son becomes the adventure `sohn`), but the games, their checkers
 * and their tests stay in the repository, so the tests of the checkers keep real data.
 */
import type { MeetGame } from '@/types/adventure'
import type { HomeGame } from '@/utils/gleichnisseNeu'

const G = 'images/abenteuer/spiele/gleichnisse/'

export const ENTGEGEN_OLD: MeetGame = {
  road: `${G}entgegen/weg.webp`,
  yard: `${G}entgegen/hof.webp`,
  father: { image: `${G}entgegen/vater.webp`, label: 'Der Vater im Tor des Hofguts', w: 12, x: 80, y: 82 },
  son: { image: `${G}entgegen/sohn.webp`, label: 'Der Sohn, müde, in zerrissenen Kleidern', w: 11, x: 14, y: 86 },
  embrace: { image: `${G}entgegen/umarmung.webp`, label: 'Vater und Sohn in Umarmung', w: 18 },
  meet: 34,
  steps: 12,
  ragged: { image: `${G}entgegen/sohn-lumpen.webp`, label: 'Der Sohn in zerrissenen Kleidern', w: 20, x: 50, y: 92 },
  robed: { image: `${G}entgegen/sohn-kleid.webp`, label: 'Der Sohn im neuen Kleid', w: 20 },
  dressed: { image: `${G}entgegen/sohn-fertig.webp`, label: 'Der Sohn mit Kleid, Ring und Schuhen', w: 20 },
  gifts: [
    { id: 'kleid', image: `${G}entgegen/kleid.webp`, label: 'Das Kleid', w: 10 },
    { id: 'ring', image: `${G}entgegen/ring.webp`, label: 'Der Ring', w: 10 },
    { id: 'schuhe', image: `${G}entgegen/schuhe.webp`, label: 'Die Schuhe', w: 10 }
  ],
  rounds: [
    { kind: 'run', hint: 'Tippe abwechselnd auf die Füße, damit der Vater zu seinem Sohn läuft.' },
    { kind: 'gifts', hint: 'Ziehe das Kleid, den Ring und die Schuhe zum Sohn.' }
  ]
}

export const HEIMWEG_OLD: HomeGame = {
  background: `${G}heimweg/strasse.webp`,
  ratio: 0.75,
  house: { x: 51, y: 31 },
  zoom: 2.2,
  son: { image: `${G}heimweg/sohn.webp`, label: 'Der Sohn auf dem Weg nach Hause', w: 34, x: 50, y: 99 },
  print: { image: `${G}heimweg/fuss.webp`, label: 'Eine Fußspur', w: 18 },
  left: { x: 37, y: 62 },
  right: { x: 63, y: 62 },
  rounds: [
    { hint: 'Der Sohn macht sich auf den Weg zu seinem Vater. Tippe immer dann, wenn die Fußspur ganz klar ist.', beat: 900, window: 260, steps: 10 },
    { hint: 'Jetzt geht er schneller. Tippe genau auf die Fußspur, die kommt: links, rechts, links …', beat: 720, window: 200, steps: 14, feet: true }
  ]
}
