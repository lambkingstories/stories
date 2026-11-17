/**
 * "Karawane über die Dünen": the stable (workshop) of the big game. The child pays with the coins it picked up while driving (play money that
 * only exists in the game, never real money) for better wheels, a softer suspension, a bigger water skin and a tarp that brings more coins,
 * and buys other draught animals. Everything here is plain calculation (no Vue), so that it can be tested; the save lives on the device only.
 */

export type UpgradeId = 'wheels' | 'suspension' | 'water' | 'cover' | 'harness' | 'hop'
export const UPGRADE_IDS: UpgradeId[] = ['wheels', 'suspension', 'water', 'cover', 'harness', 'hop']

/** The levels one can buy (level 0 is what one starts with) and the coins each step costs. */
export const UPGRADES: Record<UpgradeId, { max: number; costs: number[] }> = {
  wheels: { max: 5, costs: [40, 90, 180, 320, 560] },
  suspension: { max: 5, costs: [40, 90, 180, 320, 560] },
  water: { max: 5, costs: [35, 80, 160, 300, 520] },
  cover: { max: 4, costs: [60, 140, 280, 520] },
  /** A better harness: more pull (the animal starts faster and climbs better). */
  harness: { max: 4, costs: [45, 100, 190, 360] },
  /** The spring strength: the hop (a short push up from the ground, for dips and little jumps); level 1 gives the hop itself. */
  hop: { max: 3, costs: [50, 110, 210] }
}

export type AnimalId = 'donkey' | 'ox' | 'camel' | 'horse'
export const ANIMAL_IDS: AnimalId[] = ['donkey', 'ox', 'camel', 'horse']

export interface AnimalStats {
  /** The pull from a standstill (metres per second squared). */
  power: number
  /** The speed at which the pull is gone (m/s). */
  vmax: number
  /** Extra seconds of stamina. */
  stamina: number
  /** Extra grip of the feet (a broad hoof holds better). */
  grip: number
  /** The coins it costs. */
  cost: number
}

export const ANIMALS: Record<AnimalId, AnimalStats> = {
  donkey: { power: 7.2, vmax: 14, stamina: 0, grip: 0, cost: 0 },
  ox: { power: 9, vmax: 10.5, stamina: 30, grip: 0.25, cost: 160 },
  camel: { power: 7.6, vmax: 17, stamina: 15, grip: 0.1, cost: 360 },
  /** The Egyptian horse: the top of the animals (fast, strong, lasting, expensive). */
  horse: { power: 8.2, vmax: 19, stamina: 28, grip: 0.18, cost: 960 }
}

/** What the vehicle is like with the bought parts: everything the physics needs. */
export interface Stats {
  /** Grip of wheel and feet (friction coefficient). */
  mu: number
  /** Radius of the cart wheel in metres. */
  wheelR: number
  /** Stiffness of one spring (per unit mass), the damping ratio and the spring travel in metres. */
  K: number
  zeta: number
  travel: number
  /** Seconds of stamina when the bar is full. */
  staminaSec: number
  /** The factor on every coin that is found. */
  coinMult: number
  power: number
  vmax: number
  grip: number
  /** The strength of the hop (m/s upwards, 0 = no hop yet) and the seconds before the next one. */
  hopV: number
  hopCool: number
  /** The speed up to which a wooden bridge can be crossed (the suspension carries the load) and the level of the suspension. */
  bridgeV: number
  suspLevel: number
  /** How strongly the cart rights itself on the ground (the strength of the help for the youngest). */
  assist: number
  animal: AnimalId
}

export interface Save {
  v: 1
  coins: number
  up: Record<UpgradeId, number>
  owned: AnimalId[]
  animal: AnimalId
  /** The most metres reached on each route (the record). */
  best: number[]
  /** All coins ever collected and all rounds played (for the pride of it). */
  earned: number
  rounds: number
  /** The routes whose story card was shown (it comes once). */
  seen: number[]
}

export const SAVE_KEY = 'lk-karawane-v1'

export function newSave(): Save {
  return { v: 1, coins: 0, up: { wheels: 0, suspension: 0, water: 0, cover: 0, harness: 0, hop: 0 }, owned: ['donkey'], animal: 'donkey', best: [], earned: 0, rounds: 0, seen: [] }
}

type Store = Pick<Storage, 'getItem' | 'setItem'>

function defaultStore(): Store | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Reads the save; anything broken or foreign gives a fresh one. Values are put back into their ranges. */
export function loadSave(store: Store | null = defaultStore()): Save {
  const s = newSave()
  try {
    const raw = JSON.parse(store?.getItem(SAVE_KEY) ?? 'null') as Partial<Save> | null
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return s
    s.coins = Math.max(0, Math.floor(Number(raw.coins) || 0))
    for (const id of UPGRADE_IDS) s.up[id] = Math.max(0, Math.min(UPGRADES[id].max, Math.floor(Number(raw.up?.[id]) || 0)))
    const owned = (Array.isArray(raw.owned) ? raw.owned : []).filter((a): a is AnimalId => ANIMAL_IDS.includes(a as AnimalId))
    s.owned = Array.from(new Set<AnimalId>(['donkey', ...owned]))
    s.animal = s.owned.includes(raw.animal as AnimalId) ? (raw.animal as AnimalId) : 'donkey'
    s.best = (Array.isArray(raw.best) ? raw.best : []).map((m) => Math.max(0, Math.floor(Number(m) || 0)))
    s.earned = Math.max(0, Math.floor(Number(raw.earned) || 0))
    s.rounds = Math.max(0, Math.floor(Number(raw.rounds) || 0))
    s.seen = (Array.isArray(raw.seen) ? raw.seen : []).map((n) => Math.floor(Number(n))).filter((n) => Number.isFinite(n) && n >= 0)
  } catch {
    return newSave()
  }
  return s
}

export function persist(s: Save, store: Store | null = defaultStore()): void {
  try {
    store?.setItem(SAVE_KEY, JSON.stringify(s))
  } catch {
    // a private window: not remembered
  }
}

/** The coins the next step of a part costs, or null when it is at its top. */
export function upgradeCost(s: Save, id: UpgradeId): number | null {
  const lvl = s.up[id]
  return lvl >= UPGRADES[id].max ? null : UPGRADES[id].costs[lvl]!
}

export function canBuyUpgrade(s: Save, id: UpgradeId): boolean {
  const c = upgradeCost(s, id)
  return c !== null && s.coins >= c
}

/** Buys the next step of a part. */
export function buyUpgrade(s: Save, id: UpgradeId): boolean {
  const c = upgradeCost(s, id)
  if (c === null || s.coins < c) return false
  s.coins -= c
  s.up[id]++
  return true
}

/** Buys an animal (and takes it into the harness at once). */
export function buyAnimal(s: Save, id: AnimalId): boolean {
  if (s.owned.includes(id) || s.coins < ANIMALS[id].cost) return false
  s.coins -= ANIMALS[id].cost
  s.owned.push(id)
  s.animal = id
  return true
}

export function selectAnimal(s: Save, id: AnimalId): boolean {
  if (!s.owned.includes(id)) return false
  s.animal = id
  return true
}

/** Adds the coins of a round and counts it. */
export function addCoins(s: Save, n: number): void {
  const k = Math.max(0, Math.floor(n))
  s.coins += k
  s.earned += k
  s.rounds++
}

/** Keeps the best metres of a route; true when it is a new record. */
export function recordBest(s: Save, route: number, meters: number): boolean {
  const m = Math.floor(meters)
  while (s.best.length <= route) s.best.push(0)
  if (m > s.best[route]!) {
    s.best[route] = m
    return true
  }
  return false
}

/** The values of the vehicle for the parts that were bought and the animal in the harness. */
export function statsFor(s: Save): Stats {
  const a = ANIMALS[s.animal]
  return {
    mu: 1.15 + 0.12 * s.up.wheels + a.grip,
    wheelR: 0.46 + 0.012 * s.up.wheels,
    K: 24 + 2.5 * s.up.suspension,
    zeta: 0.22 + 0.07 * s.up.suspension,
    travel: 0.36 + 0.04 * s.up.suspension,
    staminaSec: 55 + 9 * s.up.water + a.stamina,
    coinMult: 1 + 0.25 * s.up.cover,
    power: a.power * (1 + 0.07 * s.up.harness),
    vmax: a.vmax,
    grip: a.grip,
    hopV: s.up.hop > 0 ? 2.6 + 0.8 * s.up.hop : 0,
    hopCool: 2.3 - 0.3 * s.up.hop,
    bridgeV: 5.2 + 0.7 * s.up.suspension,
    suspLevel: s.up.suspension,
    assist: 2.6,
    animal: s.animal
  }
}

/** A save with every part at the top (for a test of the end of the way, and the test build). */
export function fullSave(): Save {
  const s = newSave()
  for (const id of UPGRADE_IDS) s.up[id] = UPGRADES[id].max
  s.owned = [...ANIMAL_IDS]
  s.animal = 'camel'
  return s
}

/** How the cart looks: the bought parts make it grow from a plain wooden cart (0) through a reinforced one (1) and a painted one with a cover (2) to a gilded wagon (3). */
export function wagonTier(s: Save): number {
  const sum = s.up.wheels + s.up.suspension + s.up.cover + s.up.harness
  return sum >= 13 ? 3 : sum >= 8 ? 2 : sum >= 3 ? 1 : 0
}

/** The look of the wheel (0 wood, 1 iron, 2 painted, 3 gilded) from the wheel part. */
export function wheelLook(s: Save): number {
  const w = s.up.wheels
  return w >= 5 ? 3 : w >= 4 ? 2 : w >= 2 ? 1 : 0
}
