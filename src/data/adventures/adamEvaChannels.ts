/**
 * The two gardens of the channel game in "Adam und Eva" (stage 4, 1. Mose 2,10): the tiles and how they lie at the start. Round 1: a small garden
 * with two plants (4 x 3); round 2: a bigger one with four plants, because the stream divides into four arms (5 x 4). Nothing reaches a plant at the
 * start, and both gardens can be solved (`tests/adamGames.test.ts` solves them). The tree of life and the tree of knowledge are not among the plants.
 * Kinds: `straight` (two sides, opposite), `corner`, `tee` (three sides), `cross` (four), `empty`, `source` (the stream, opens right) and `goal`
 * (a plant, opens left).
 */
import type { ChannelRound } from '@/types/adventure'

type Rows = ChannelRound['grid']

export const CHANNEL_GRID_1: Rows = [
  [{ kind: 'empty', rot: 0 }, { kind: 'corner', rot: 0 }, { kind: 'straight', rot: 1 }, { kind: 'goal', rot: 0, goal: 'feige' }],
  [{ kind: 'source', rot: 0 }, { kind: 'tee', rot: 1 }, { kind: 'straight', rot: 1 }, { kind: 'goal', rot: 0, goal: 'dattel' }],
  [{ kind: 'empty', rot: 0 }, { kind: 'corner', rot: 2 }, { kind: 'empty', rot: 0 }, { kind: 'straight', rot: 0 }]
]

export const CHANNEL_GRID_2: Rows = [
  [{ kind: 'empty', rot: 0 }, { kind: 'corner', rot: 0 }, { kind: 'straight', rot: 1 }, { kind: 'straight', rot: 1 }, { kind: 'goal', rot: 0, goal: 'granatapfel' }],
  [{ kind: 'source', rot: 0 }, { kind: 'tee', rot: 1 }, { kind: 'cross', rot: 0 }, { kind: 'tee', rot: 0 }, { kind: 'goal', rot: 0, goal: 'wein' }],
  [{ kind: 'corner', rot: 1 }, { kind: 'straight', rot: 0 }, { kind: 'straight', rot: 0 }, { kind: 'corner', rot: 2 }, { kind: 'goal', rot: 0, goal: 'olive' }],
  [{ kind: 'empty', rot: 0 }, { kind: 'corner', rot: 3 }, { kind: 'corner', rot: 1 }, { kind: 'straight', rot: 1 }, { kind: 'goal', rot: 0, goal: 'blumen' }]
]
