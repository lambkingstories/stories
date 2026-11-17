/**
 * What the child reached in the big games: the stars of every level (the best one counts), and which games it picked with its wishes
 * (the choice is for good). Everything stays on the device.
 */
import { reactive, ref } from 'vue'

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

const PICKS_KEY = 'lk-biggames-picks-v1'

function loadPicks(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PICKS_KEY) ?? 'null') as unknown
    if (Array.isArray(raw)) return [...new Set(raw.filter((x): x is string => typeof x === 'string'))]
  } catch {
    // start fresh
  }
  return []
}

/** The games the child picked, in the order of the picks. */
const picks = ref<string[]>(loadPicks())

function savePicks() {
  try {
    localStorage.setItem(PICKS_KEY, JSON.stringify(picks.value))
  } catch {
    // a private window: not remembered
  }
}

const HOW_KEY = 'lk-biggames-how-v1'

/** The card that explains the controls is shown only once for a game (Anton, 12.11.2026), not at every level; the question mark brings it back. */
export function howSeen(id: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(HOW_KEY) ?? '{}') as Record<string, boolean>)[id] === true
  } catch {
    return false
  }
}

export function markHowSeen(id: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(HOW_KEY) ?? '{}') as Record<string, boolean>
    all[id] = true
    localStorage.setItem(HOW_KEY, JSON.stringify(all))
  } catch {
    // not remembered: the card comes again next time
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
    /** The games picked so far (a game is open when it is in here; `useGameWishes` checks that a wish was free). */
    picked: (): string[] => picks.value,
    isPicked: (id: string): boolean => picks.value.includes(id),
    /** Keeps a pick for good: a game is in the list only once. Whether a wish was free is the business of `useGameWishes().pick`. */
    addPick(id: string) {
      if (picks.value.includes(id)) return
      picks.value = [...picks.value, id]
      savePicks()
    },
    /** The test build only: put the list of picks in one go (or back). */
    replacePicks(list: string[]) {
      picks.value = [...new Set(list)]
      savePicks()
    },
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
