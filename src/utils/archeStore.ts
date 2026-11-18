/**
 * What "Arche der Tierpaare" remembers besides the stars of the levels (those are in `useBigGames`): the helpers (booster) the child has.
 * They cost no money: every new star of a level gives one of them. At the start of a level there is at least one of each, so that nobody
 * ever stands without help. Everything stays on the device.
 */
export type BoosterName = 'hammer' | 'swap' | 'shuffle'
export const BOOSTERS: BoosterName[] = ['hammer', 'swap', 'shuffle']
export type Boosters = Record<BoosterName, number>

const KEY = 'lk-arche-v1'

export const START_BOOSTERS: Boosters = { hammer: 2, swap: 2, shuffle: 2 }

/** The smallest stock a level starts with. */
export const MIN_BOOSTERS = 1
/** The biggest stock (so that the number fits in its badge). */
export const MAX_BOOSTERS = 99

interface StorageLike {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
}

function store(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function loadBoosters(s: StorageLike | null = store()): Boosters {
  try {
    const raw = JSON.parse(s?.getItem(KEY) ?? 'null') as Partial<Boosters> | null
    if (raw && typeof raw === 'object') {
      const out = { ...START_BOOSTERS }
      for (const b of BOOSTERS) {
        const n = raw[b]
        if (typeof n === 'number' && Number.isFinite(n)) out[b] = Math.max(0, Math.min(MAX_BOOSTERS, Math.floor(n)))
      }
      return out
    }
  } catch {
    // start with the first stock
  }
  return { ...START_BOOSTERS }
}

export function saveBoosters(b: Boosters, s: StorageLike | null = store()): void {
  try {
    s?.setItem(KEY, JSON.stringify(b))
  } catch {
    // a private window: not remembered
  }
}

/** At least one of each. */
export function topUp(b: Boosters): Boosters {
  const out = { ...b }
  for (const k of BOOSTERS) out[k] = Math.max(MIN_BOOSTERS, out[k])
  return out
}

/** The helpers a level gives: one for each star that is new (more than the best result before), the kind goes round: hammer, swap, shuffle. */
export function earned(levelIndex: number, newStars: number, oldStars: number): BoosterName[] {
  const out: BoosterName[] = []
  for (let k = oldStars; k < newStars; k++) out.push(BOOSTERS[(levelIndex + k) % BOOSTERS.length]!)
  return out
}

export function add(b: Boosters, list: BoosterName[]): Boosters {
  const out = { ...b }
  for (const k of list) out[k] = Math.min(MAX_BOOSTERS, out[k] + 1)
  return out
}

/** One helper is used: the new stock, or null when there is none. */
export function spend(b: Boosters, name: BoosterName): Boosters | null {
  if (b[name] <= 0) return null
  return { ...b, [name]: b[name] - 1 }
}

/** The pairs on board: one for every level that was won (one star at least). */
export function pairsOnBoard(levels: number[], count: number): number {
  let n = 0
  for (let i = 0; i < count; i++) if ((levels[i] ?? 0) > 0) n++
  return n
}
