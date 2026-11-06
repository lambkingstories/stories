import type { LowerGame } from '@/types/adventure'

/** A small lowering game for the test of `LowerGame.texts` (two rounds, no own texts). */
export const LOWER_DATA: LowerGame = {
  background: 'images/x/wall.webp',
  men: [
    { id: 'a', image: 'images/x/a.webp', w: 16 },
    { id: 'b', image: 'images/x/b.webp', w: 16 }
  ],
  guard: 'images/x/wache.webp',
  window: [20.2, 13.5],
  ground: 91,
  road: 94,
  guardSpeed: 12,
  lightRadius: 16,
  warnLead: 24,
  knots: 4,
  rounds: [
    { hint: 'Runde eins.', man: 'a', descentMs: 8000, passes: 1, gapMs: 1500 },
    { hint: 'Runde zwei.', man: 'b', descentMs: 15000, passes: 2, gapMs: 1500 }
  ]
}
