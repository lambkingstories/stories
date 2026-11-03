/**
 * What the child reached in the big games: the stars of every level (the best one counts). Everything stays on the device.
 */
import { reactive } from 'vue'

const KEY = 'lk-biggames-v1'

interface Saved {
  [gameId: string]: { levels: number[]; plays: number }
}

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null
    if (raw && typeof raw === 'object') return raw
  } catch {
    // start fresh
  }
  return {}
}

const state = reactive<Saved>(load())

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // a private window: not remembered
  }
}

export default function useBigGames() {
  return {
    /** The best stars of every level of a game (0 for a level not won). */
    levels: (id: string): number[] => state[id]?.levels ?? [],
    plays: (id: string): number => state[id]?.plays ?? 0,
    stars: (id: string): number => (state[id]?.levels ?? []).reduce((n, s) => n + (s || 0), 0),
    /** The test build only: put the whole progress in one go (all levels open) or back (what was kept before). */
    replaceAll(saved: Saved) {
      for (const k of Object.keys(state)) delete state[k]
      Object.assign(state, saved)
      save()
    },
    snapshot: (): Saved => JSON.parse(JSON.stringify(state)) as Saved,
    /** A round ended: the stars of the level are kept when they are the best so far. */
    record(id: string, level: number, stars: number) {
      const g = (state[id] ??= { levels: [], plays: 0 })
      g.plays++
      const old = g.levels[level] ?? 0
      if (stars > old) {
        while (g.levels.length < level) g.levels.push(0)
        g.levels[level] = stars
      }
      save()
    }
  }
}
