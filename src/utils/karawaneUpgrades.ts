/**
 * "Karawane über die Dünen": the stable (workshop) of the big game. The child pays with the coins it picked up while driving (play money that
 * only exists in the game, never real money) for better wheels, a softer suspension, a bigger water skin and a tarp that brings more coins,
 * and buys other draught animals. Everything here is plain calculation (no Vue), so that it can be tested; the save lives on the device only.
 */

export type UpgradeId = 'wheels' | 'suspension' | 'water' | 'cover'
export const UPGRADE_IDS: UpgradeId[] = ['wheels', 'suspension', 'water', 'cover']

/** The levels one can buy (level 0 is what one starts with) and the coins each step costs. */
export const UPGRADES: Record<UpgradeId, { max: number; costs: number[] }> = {
  wheels: { max: 5, costs: [100, 220, 450, 800, 1400] },
  suspension: { max: 5, costs: [100, 220, 450, 800, 1400] },
  water: { max: 5, costs: [90, 200, 400, 750, 1300] },
  cover: { max: 4, costs: [150, 350, 700, 1300] }
}

export type AnimalId = 'donkey' | 'ox' | 'camel'
export const ANIMAL_IDS: AnimalId[] = ['donkey', 'ox', 'camel']

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
  ox: { power: 9, vmax: 10.5, stamina: 30, grip: 0.25, cost: 400 },
  camel: { power: 7.6, vmax: 17, stamina: 15, grip: 0.1, cost: 900 }
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
}

export const SAVE_KEY = 'lk-karawane-v1'

export function newSave(): Save {
  return { v: 1, coins: 0, up: { wheels: 0, suspension: 0, water: 0, cover: 0 }, owned: ['donkey'], animal: 'donkey', best: [], earned: 0, rounds: 0 }
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
    power: a.power,
    vmax: a.vmax,
    grip: a.grip,
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
