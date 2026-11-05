/** Sample data of the two games of "Ostern" for the tests (the same shapes as the data of the adventure; no test file imports another one). */
import type { FischzugGame, GrazeGame } from '@/types/adventure'

export const sprite = (image: string, w = 10) => ({ image, label: image, w })

/** "The net on the right": a lake with the swimming area from 6 to 94 percent across and 30 to 78 down; the net is 30 percent wide (a circle of 15 units). */
export const FISCH: FischzugGame = {
  lake: 'see',
  boat: { ...sprite('boot', 26), x: 16, y: 96 },
  net: sprite('netz', 30),
  fish: [sprite('fisch-1', 9), sprite('fisch-2', 9), sprite('fisch-3', 9)],
  basket: { ...sprite('korb', 10), x: 92, y: 22 },
  full: 'fang',
  area: { left: 6, top: 30, right: 94, bottom: 78 },
  rounds: [
    { hint: 'a', fish: 5, throws: 3, goal: 4 },
    { hint: 'b', fish: 8, throws: 4, goal: 6, schools: 2 }
  ]
}

/** "Lead the lambs": the shepherd starts at the left, the pen is at the right (inside from 78 to 97 across and 58 to 86 down), in round 2 the brook runs from 46 to 54 with the lane of the bridge from 40 to 56. */
export const GRAZE: GrazeGame = {
  meadow: 'wiese',
  meadowStream: 'wiese-bach',
  hirte: { ...sprite('hirte', 10), x: 8, y: 72 },
  kinds: [
    { id: 'lamm-1', ...sprite('lamm-1', 7) },
    { id: 'lamm-2', ...sprite('lamm-2', 7) },
    { id: 'schaf', ...sprite('schaf', 9), speed: 17 }
  ],
  thorn: sprite('dornen', 8),
  pen: { ...sprite('pferch', 24), x: 88, y: 88, area: { left: 78, top: 58, right: 97, bottom: 86 } },
  bridge: { ...sprite('steg', 12), x: 50, y: 56 },
  stream: { from: 46, to: 54, top: 40, bottom: 56 },
  rounds: [
    {
      title: 'Weide meine Lämmer!',
      hint: 'a',
      animals: ['lamm-1', 'lamm-1', 'lamm-2', 'lamm-2'],
      starts: [
        { x: 22, y: 66 },
        { x: 27, y: 76 },
        { x: 32, y: 64 },
        { x: 36, y: 74 }
      ],
      thorns: [{ x: 55, y: 72 }],
      stream: false
    },
    {
      title: 'Hüte meine Schafe!',
      hint: 'b',
      animals: ['lamm-1', 'lamm-2', 'schaf', 'schaf'],
      starts: [
        { x: 24, y: 64 },
        { x: 28, y: 76 },
        { x: 32, y: 62 },
        { x: 36, y: 76 }
      ],
      thorns: [{ x: 66, y: 70 }],
      stream: true
    }
  ]
}
