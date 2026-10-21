/**
 * The two gardens of the channel game in "Adam und Eva" (stage 4, 1. Mose 2,10): the tiles and how they lie at the start. Round 1: a small garden
 * with two plants (4 x 3); round 2 (plan v3: a smaller garden than before): another one with three plants, where the stream divides into three arms (4 x 3). Nothing reaches a plant at the
 * start, and both gardens can be solved (`tests/adamGames.test.ts` solves them). The tree of life and the tree of knowledge are not among the plants.
 * Kinds (as painted): `straight` (left to right), `corner` (left to down), `tee` (left, right and down), `empty`, `source` (the stream, opens to the
 * right) and `goal` (a plant, opens to the left). `rot` is the number of clockwise quarter turns.
 */
import type { ChannelRound } from '@/types/adventure'

type Rows = ChannelRound['grid']

export const CHANNEL_GRID_1: Rows = [
  [{ kind: 'empty', rot: 0 }, { kind: 'corner', rot: 0 }, { kind: 'straight', rot: 1 }, { kind: 'goal', rot: 0, goal: 'feige' }],
  [{ kind: 'source', rot: 0 }, { kind: 'tee', rot: 0 }, { kind: 'straight', rot: 1 }, { kind: 'goal', rot: 0, goal: 'dattel' }],
  [{ kind: 'empty', rot: 0 }, { kind: 'corner', rot: 2 }, { kind: 'empty', rot: 0 }, { kind: 'straight', rot: 0 }]
]

export const CHANNEL_GRID_2: Rows = [
  [{ kind: 'empty', rot: 0 }, { kind: 'empty', rot: 0 }, { kind: 'corner', rot: 0 }, { kind: 'goal', rot: 0, goal: 'feige' }],
  [{ kind: 'source', rot: 0 }, { kind: 'tee', rot: 1 }, { kind: 'tee', rot: 0 }, { kind: 'goal', rot: 0, goal: 'dattel' }],
  [{ kind: 'empty', rot: 0 }, { kind: 'corner', rot: 0 }, { kind: 'straight', rot: 1 }, { kind: 'goal', rot: 0, goal: 'wein' }]
]
