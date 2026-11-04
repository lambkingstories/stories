/** Sample data of the three games of "Die letzte Woche" for the tests (the same shapes as the data of the adventure; no test file imports another one). */
import type { HelpGame, HelpNeed, OilLampGame, PrepareGame } from '@/types/adventure'

export const sprite = (image: string, w = 10) => ({ image, label: image, w })

export const PREPARE: PrepareGame = {
  road: 'strasse',
  donkey: { ...sprite('eselin', 18), x: 10, y: 80 },
  cloaks: [sprite('mantel-1', 10), sprite('mantel-2', 10), sprite('mantel-3', 10)],
  branches: [sprite('zweig-1', 10), sprite('zweig-2', 10)],
  stone: sprite('stein', 7),
  crowd: { ...sprite('menschen', 24), x: 40, y: 40 },
  gate: { ...sprite('tor', 14), x: 94, y: 62 },
  spots: [
    { x: 24, y: 78 },
    { x: 38, y: 74 },
    { x: 52, y: 72 },
    { x: 66, y: 70 },
    { x: 80, y: 68 }
  ],
  field: 10,
  rounds: [
    { hint: 'a', fields: 3 },
    { hint: 'b', fields: 5, slow: true }
  ]
}

export const LAMPS: OilLampGame = {
  night: 'nacht',
  row: 'lampen-reihe',
  lamp: { ...sprite('lampe', 30), x: 50, y: 90 },
  lit: sprite('lampe-brennt', 30),
  out: sprite('lampe-aus', 30),
  oil: sprite('oel', 10),
  mark: sprite('marke', 34),
  jug: { ...sprite('krug', 18), x: 82, y: 90 },
  glass: { x: 20, y: 10, w: 60, h: 78 },
  rounds: [
    { hint: 'a', marks: [60, 80, 45] },
    { hint: 'b', marks: [70, 50, 85] }
  ]
}

const person = (id: HelpNeed, x: number) => ({ id, image: `mensch-${id}`, glad: `mensch-${id}-froh`, label: `Mensch ${id}`, x, y: 72, w: 14, card: `karte-${id}`, cardLabel: `Karte ${id}` })
export const HELP: HelpGame = {
  village: 'dorf',
  ratio: 0.7,
  people: [person('hunger', 12), person('durst', 28), person('fremd', 44), person('frieren', 60), person('krank', 76), person('gefangen', 91)],
  rounds: [
    { hint: 'a', people: ['hunger', 'durst', 'fremd'] },
    { hint: 'b', people: ['frieren', 'krank', 'gefangen'] }
  ]
}
