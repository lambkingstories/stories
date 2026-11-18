/**
 * The levels of "Wasser für das Volk": three worlds of twelve levels each (the maps are in `wasserWelt1.ts`, `wasserWelt2.ts`, `wasserWelt3.ts`).
 * The order is the order of the game; the test `tests/wasserLevels.test.ts` plays the solutions of every level.
 */
import type { LevelDef } from '@/utils/wasserGame'
import { WELT1 } from '@/utils/wasserWelt1'
import { WELT2 } from '@/utils/wasserWelt2'
import { WELT3 } from '@/utils/wasserWelt3'

export const LEVELS: LevelDef[] = [...WELT1, ...WELT2, ...WELT3]

export interface WorldInfo {
  id: 'hiskia' | 'elia' | 'vaeter'
  /** The first level of the world (index in `LEVELS`). */
  first: number
  count: number
}

export const WORLDS: WorldInfo[] = [
  { id: 'hiskia', first: 0, count: WELT1.length },
  { id: 'elia', first: WELT1.length, count: WELT2.length },
  { id: 'vaeter', first: WELT1.length + WELT2.length, count: WELT3.length }
]
