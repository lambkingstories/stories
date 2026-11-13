/**
 * "Josefs Land": the fixed content of the farm game (goods, plants, workshops, animals, land, decoration, levels, goals). Everything here is
 * plain data and small calculations (no Vue), so that the rules in `josefslandGame.ts` and the tests can use it. Times are in seconds,
 * the play money (coins) exists only in the game, never real money.
 * The Bible: Genesis 41 (seven good years, seven lean years, the storehouses of Joseph) and 42:1–3 (the brothers come to buy grain).
 */

// ── goods ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type GoodId =
  | 'wheat' | 'barley' | 'flax' | 'grapes' | 'dates' | 'pomegranate'
  | 'flour' | 'bread' | 'flatbread' | 'datebread' | 'honeycake' | 'linen' | 'cloth' | 'grapejuice' | 'pomjuice' | 'honey'
  | 'wool' | 'milk' | 'butter' | 'silt'

export const GOOD_IDS: GoodId[] = [
  'wheat', 'barley', 'flax', 'grapes', 'dates', 'pomegranate',
  'flour', 'bread', 'flatbread', 'datebread', 'honeycake', 'linen', 'cloth', 'grapejuice', 'pomjuice', 'honey',
  'wool', 'milk', 'butter', 'silt'
]

/** Where a good is kept: the granary holds the grain, the barn everything else. */
export type StoreId = 'barn' | 'granary'
export const GRAIN: GoodId[] = ['wheat', 'barley']

export interface GoodDef {
  /** The player level from which one can get it. */
  level: number
  /** The coins it is worth (selling, rewards of orders). */
  price: number
  store: StoreId
}

export const GOODS: Record<GoodId, GoodDef> = {
  wheat: { level: 1, price: 3, store: 'granary' },
  barley: { level: 3, price: 5, store: 'granary' },
  flax: { level: 6, price: 8, store: 'barn' },
  grapes: { level: 10, price: 12, store: 'barn' },
  dates: { level: 15, price: 16, store: 'barn' },
  pomegranate: { level: 20, price: 20, store: 'barn' },
  flour: { level: 2, price: 9, store: 'barn' },
  bread: { level: 4, price: 24, store: 'barn' },
  flatbread: { level: 9, price: 28, store: 'barn' },
  datebread: { level: 16, price: 52, store: 'barn' },
  honeycake: { level: 14, price: 40, store: 'barn' },
  linen: { level: 7, price: 24, store: 'barn' },
  cloth: { level: 10, price: 50, store: 'barn' },
  grapejuice: { level: 11, price: 52, store: 'barn' },
  pomjuice: { level: 21, price: 85, store: 'barn' },
  honey: { level: 13, price: 20, store: 'barn' },
  wool: { level: 5, price: 18, store: 'barn' },
  milk: { level: 8, price: 14, store: 'barn' },
  butter: { level: 12, price: 34, store: 'barn' },
  silt: { level: 17, price: 12, store: 'barn' }
}

// ── plants ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type CropId = 'wheat' | 'barley' | 'flax' | 'grapes' | 'dates' | 'pomegranate'
export const CROP_IDS: CropId[] = ['wheat', 'barley', 'flax', 'grapes', 'dates', 'pomegranate']
/** The fields take the grain and the flax, the garden beds the plants that give fruit. */
export type PlotKind = 'plot' | 'bed'

export interface CropDef {
  level: number
  kind: PlotKind
  /** Seconds until it is ripe. */
  grow: number
  /** What one plot gives (before the years change it). */
  yield: number
  seed: number
  xp: number
}

export const CROPS: Record<CropId, CropDef> = {
  wheat: { level: 1, kind: 'plot', grow: 15, yield: 2, seed: 1, xp: 1 },
  barley: { level: 3, kind: 'plot', grow: 30, yield: 2, seed: 2, xp: 2 },
  flax: { level: 6, kind: 'plot', grow: 60, yield: 2, seed: 3, xp: 2 },
  grapes: { level: 10, kind: 'bed', grow: 100, yield: 3, seed: 5, xp: 3 },
  dates: { level: 15, kind: 'bed', grow: 150, yield: 3, seed: 7, xp: 4 },
  pomegranate: { level: 20, kind: 'bed', grow: 180, yield: 3, seed: 9, xp: 5 }
}

// ── workshops ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type BuildingId = 'mill' | 'bakery' | 'weaver' | 'press' | 'apiary'
export const BUILDING_IDS: BuildingId[] = ['mill', 'bakery', 'weaver', 'press', 'apiary']
export const MAX_WORKSHOP_LEVEL = 5

export interface BuildingDef {
  /** The player level that opens it, the coins it costs. */
  level: number
  cost: number
  /** The land piece it stands on. */
  parcel: number
  /** Jobs that fit in the queue, and the speed factor (the time of a job times this) at levels 1, 2, 3. */
  queue: number[]
  speed: number[]
  /** What the upgrade to level 2 and 3 costs (coins and goods) and the player level it needs. */
  upgrade: Array<{ level: number; coins: number; goods: Partial<Record<GoodId, number>> }>
}

const up = (level: number, coins: number, goods: Partial<Record<GoodId, number>>) => ({ level, coins, goods })
const QUEUE = [2, 3, 4, 5, 6]
const SPEED = [1, 0.85, 0.7, 0.6, 0.5]
export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  mill: { level: 2, cost: 80, parcel: 6, queue: QUEUE, speed: SPEED, upgrade: [up(6, 250, { flour: 6 }), up(14, 700, { bread: 6 }), up(26, 2500, { bread: 10, linen: 4 }), up(38, 6000, { cloth: 6, grapejuice: 4 })] },
  bakery: { level: 4, cost: 200, parcel: 6, queue: QUEUE, speed: SPEED, upgrade: [up(8, 400, { flour: 8, bread: 2 }), up(16, 1000, { bread: 8, linen: 3 }), up(28, 2800, { linen: 8, cloth: 4 }), up(40, 6500, { honeycake: 5, datebread: 3 })] },
  weaver: { level: 7, cost: 400, parcel: 6, queue: QUEUE, speed: SPEED, upgrade: [up(11, 700, { linen: 4 }), up(20, 1500, { cloth: 4 }), up(30, 3000, { cloth: 8, butter: 4 }), up(42, 7000, { cloth: 10, pomjuice: 4 })] },
  press: { level: 11, cost: 700, parcel: 7, queue: QUEUE, speed: SPEED, upgrade: [up(15, 1000, { grapejuice: 3 }), up(24, 2200, { pomjuice: 3, cloth: 3 }), up(33, 3500, { pomjuice: 6, butter: 4 }), up(44, 7500, { pomjuice: 8, honeycake: 6 })] },
  apiary: { level: 13, cost: 900, parcel: 7, queue: QUEUE, speed: SPEED, upgrade: [up(17, 1300, { honey: 4 }), up(26, 2600, { honeycake: 3, honey: 4 }), up(35, 3800, { honeycake: 6, butter: 5 }), up(46, 8000, { honeycake: 8, datebread: 5 })] }
}

export type RecipeId = 'flour' | 'bread' | 'flatbread' | 'datebread' | 'honeycake' | 'linen' | 'cloth' | 'grapejuice' | 'pomjuice' | 'honey'
export const RECIPE_IDS: RecipeId[] = ['flour', 'bread', 'flatbread', 'datebread', 'honeycake', 'linen', 'cloth', 'grapejuice', 'pomjuice', 'honey']

export interface RecipeDef {
  building: BuildingId
  level: number
  inputs: Partial<Record<GoodId, number>>
  time: number
  xp: number
}

export const RECIPES: Record<RecipeId, RecipeDef> = {
  flour: { building: 'mill', level: 2, inputs: { wheat: 2 }, time: 20, xp: 3 },
  bread: { building: 'bakery', level: 4, inputs: { flour: 2 }, time: 40, xp: 6 },
  flatbread: { building: 'bakery', level: 9, inputs: { flour: 1, milk: 1 }, time: 30, xp: 7 },
  datebread: { building: 'bakery', level: 16, inputs: { flour: 1, dates: 2 }, time: 60, xp: 12 },
  honeycake: { building: 'bakery', level: 14, inputs: { flour: 1, honey: 1 }, time: 70, xp: 11 },
  linen: { building: 'weaver', level: 7, inputs: { flax: 2 }, time: 45, xp: 7 },
  cloth: { building: 'weaver', level: 10, inputs: { wool: 2 }, time: 60, xp: 9 },
  grapejuice: { building: 'press', level: 11, inputs: { grapes: 3 }, time: 60, xp: 9 },
  pomjuice: { building: 'press', level: 21, inputs: { pomegranate: 3 }, time: 90, xp: 13 },
  honey: { building: 'apiary', level: 13, inputs: {}, time: 50, xp: 6 }
}

// ── animals ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type AnimalId = 'sheep' | 'goat' | 'cow' | 'donkey'
export const ANIMAL_IDS: AnimalId[] = ['sheep', 'goat', 'cow', 'donkey']
/** A pen holds 2 animals, 3 at pen level 2 and 4 at pen level 3. */
export const PEN_SLOTS = [2, 3, 4]
export const MAX_PEN_LEVEL = 3

export interface AnimalDef {
  level: number
  /** The coins one animal costs (the next one in the same pen costs a little more). */
  price: number
  parcel: number
  feed: GoodId
  feedN: number
  product: GoodId
  time: number
  xp: number
  /** The pen upgrade to level 2 and 3 (coins) and the player level it needs. */
  upgrade: Array<{ level: number; coins: number }>
}

export const ANIMALS: Record<AnimalId, AnimalDef> = {
  sheep: { level: 5, price: 60, parcel: 4, feed: 'wheat', feedN: 1, product: 'wool', time: 90, xp: 4, upgrade: [{ level: 9, coins: 300 }, { level: 18, coins: 800 }] },
  goat: { level: 8, price: 120, parcel: 8, feed: 'barley', feedN: 1, product: 'milk', time: 70, xp: 5, upgrade: [{ level: 12, coins: 500 }, { level: 21, coins: 1100 }] },
  cow: { level: 12, price: 250, parcel: 9, feed: 'wheat', feedN: 2, product: 'butter', time: 120, xp: 8, upgrade: [{ level: 16, coins: 800 }, { level: 25, coins: 1700 }] },
  donkey: { level: 17, price: 400, parcel: 11, feed: 'barley', feedN: 2, product: 'silt', time: 100, xp: 6, upgrade: [{ level: 21, coins: 1200 }, { level: 30, coins: 2400 }] }
}

// ── stores ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const STORE_MAX_LEVEL = 8
export const STORES: Record<StoreId, { cap: number[]; upgrade: Array<{ level: number; coins: number; goods: Partial<Record<GoodId, number>> }> }> = {
  barn: {
    cap: [50, 90, 140, 200, 280, 380, 500, 650],
    upgrade: [
      up(3, 120, { flour: 4 }),
      up(7, 300, { bread: 4, linen: 2 }),
      up(12, 650, { cloth: 3, grapejuice: 3 }),
      up(18, 1200, { honeycake: 3, butter: 3 }),
      up(26, 2200, { datebread: 3, pomjuice: 3 }),
      up(34, 3500, { pomjuice: 5, datebread: 4 }),
      up(44, 6500, { pomjuice: 8, cloth: 8 })
    ]
  },
  granary: {
    cap: [40, 80, 140, 220, 340, 500, 700, 900],
    upgrade: [
      up(4, 150, { flour: 4 }),
      up(8, 350, { bread: 3 }),
      up(13, 700, { linen: 4, cloth: 2 }),
      up(19, 1300, { butter: 3, honey: 4 }),
      up(27, 2300, { datebread: 2, pomjuice: 2 }),
      up(36, 3800, { datebread: 5, butter: 6 }),
      up(46, 7000, { datebread: 8, honeycake: 8 })
    ]
  }
}
/** The picture of a store has three looks: levels 1–2, 3–5, 6–8. */
export const storeLook = (level: number): number => (level >= 6 ? 2 : level >= 3 ? 1 : 0)
export const workshopLook = (level: number): number => (level >= 3 ? 1 : 0)

// ── decoration ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type DecorId = 'palm' | 'youngpalm' | 'jars' | 'papyrus' | 'pond' | 'flowers' | 'fig' | 'pavilion' | 'stall' | 'wall' | 'waterjar' | 'boat'
export const DECOR_IDS: DecorId[] = ['palm', 'youngpalm', 'jars', 'papyrus', 'pond', 'flowers', 'fig', 'pavilion', 'stall', 'wall', 'waterjar', 'boat']
export const DECORS: Record<DecorId, { level: number; cost: number }> = {
  palm: { level: 4, cost: 90 },
  youngpalm: { level: 5, cost: 60 },
  jars: { level: 6, cost: 70 },
  papyrus: { level: 8, cost: 100 },
  pond: { level: 9, cost: 200 },
  flowers: { level: 11, cost: 160 },
  fig: { level: 13, cost: 260 },
  pavilion: { level: 16, cost: 400 },
  stall: { level: 20, cost: 600 },
  wall: { level: 24, cost: 300 },
  waterjar: { level: 28, cost: 500 },
  boat: { level: 32, cost: 800 }
}

// ── the land ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const PARCEL_W = 380
export const PARCEL_H = 300
export const RIVER_H = 150
export const COLS = 4
export const ROWS = 3
export const WORLD_W = COLS * PARCEL_W
export const WORLD_H = RIVER_H + ROWS * PARCEL_H

export type SpotKind = 'plot' | 'bed' | 'building' | 'board' | 'granary' | 'barn' | 'pen' | 'decor'
export interface Spot {
  id: string
  kind: SpotKind
  /** The base point of the picture in the world (bottom centre). */
  x: number
  y: number
  /** The building id, the animal id of the pen. */
  ref?: string
  parcel: number
}

export type ParcelRole = 'fields' | 'yard' | 'works' | 'works2' | 'pen' | 'garden'
export interface ParcelDef {
  id: number
  col: number
  row: number
  role: ParcelRole
  /** The player level and the coins it takes to get the land (0 = from the start). */
  level: number
  cost: number
  spots: Spot[]
  /** The animal of a pen land. */
  animal?: AnimalId
}

const ROLE: Array<[ParcelRole, number, number, AnimalId?]> = [
  ['fields', 3, 250], ['fields', 1, 0], ['garden', 10, 1300], ['fields', 6, 600],
  ['pen', 5, 400, 'sheep'], ['yard', 1, 0], ['works', 2, 120], ['works2', 11, 1800],
  ['pen', 8, 900, 'goat'], ['pen', 12, 2400, 'cow'], ['garden', 15, 3200], ['pen', 17, 4200, 'donkey']
]

function spotsOf(id: number, role: ParcelRole, animal?: AnimalId): Spot[] {
  const ox = (id % COLS) * PARCEL_W
  const oy = RIVER_H + Math.floor(id / COLS) * PARCEL_H
  const s = (key: string, kind: SpotKind, x: number, y: number, ref?: string): Spot => ({ id: `p${id}-${key}`, kind, x: ox + x, y: oy + y, ref, parcel: id })
  if (role === 'fields') {
    const out: Spot[] = []
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) out.push(s(`f${r * 3 + c}`, 'plot', 65 + c * 125, 135 + r * 120))
    return out
  }
  if (role === 'garden') {
    return [s('b0', 'bed', 100, 135), s('b1', 'bed', 280, 135), s('b2', 'bed', 100, 255), s('b3', 'bed', 280, 255), s('d0', 'decor', 190, 205)]
  }
  if (role === 'yard') {
    return [s('barn', 'barn', 92, 178, 'barn'), s('granary', 'granary', 288, 178, 'granary'), s('board', 'board', 190, 262), s('d0', 'decor', 38, 288), s('d1', 'decor', 345, 288)]
  }
  if (role === 'works') {
    return [s('mill', 'building', 80, 165, 'mill'), s('bakery', 'building', 290, 165, 'bakery'), s('weaver', 'building', 185, 275, 'weaver'), s('d0', 'decor', 36, 280), s('d1', 'decor', 345, 280)]
  }
  if (role === 'works2') {
    return [s('press', 'building', 95, 170, 'press'), s('apiary', 'building', 285, 170, 'apiary'), s('d0', 'decor', 190, 275)]
  }
  // a pen: the animals stand on four places inside the fence
  return [s('pen', 'pen', 190, 270, animal), s('d0', 'decor', 40, 80), s('d1', 'decor', 340, 80)]
}

export const PARCELS: ParcelDef[] = ROLE.map(([role, level, cost, animal], id) => ({
  id,
  col: id % COLS,
  row: Math.floor(id / COLS),
  role,
  level,
  cost,
  spots: spotsOf(id, role, animal),
  animal
}))
/** The land the child starts with. */
export const START_PARCELS = [1, 5]

/** The four places of the animals inside the pen of a land piece (relative to the lower middle of the pen spot). */
export const PEN_PLACES: Array<[number, number]> = [[-70, -95], [70, -95], [-70, -25], [70, -25]]

export const SPOT_BY_ID: Record<string, Spot> = Object.fromEntries(PARCELS.flatMap((p) => p.spots.map((s) => [s.id, s])))

// ── levels ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const LEVEL_MAX = 60
/** The experience points that bring a player from `level` to the next one. */
export const xpToNext = (level: number): number => 30 + 24 * level + 2 * level * level
/** What one gets for reaching a level (coins). */
export const levelCoins = (level: number): number => 20 + 5 * level

/** How many orders the board holds at a level. */
export const orderSlots = (level: number): number => (level >= 28 ? 6 : level >= 16 ? 5 : level >= 8 ? 4 : 3)

/** What a level opens (for the message when it is reached). */
export function unlocksAt(level: number): string[] {
  const out: string[] = []
  for (const c of CROP_IDS) if (CROPS[c].level === level) out.push(`crop:${c}`)
  for (const b of BUILDING_IDS) if (BUILDINGS[b].level === level) out.push(`building:${b}`)
  for (const a of ANIMAL_IDS) if (ANIMALS[a].level === level) out.push(`animal:${a}`)
  for (const d of DECOR_IDS) if (DECORS[d].level === level) out.push(`decor:${d}`)
  for (const r of RECIPE_IDS) if (RECIPES[r].level === level && !out.includes(`building:${RECIPES[r].building}`)) out.push(`recipe:${r}`)
  for (const p of PARCELS) if (p.level === level && p.cost > 0) out.push(`land:${p.role}`)
  return out
}

// ── years ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Seconds of play that fill one year. Only the time with the game open counts (no wall clock: a child who is away misses no year and no
 * hunger, and a child with many plots does not rush through the years).
 */
export const YEAR_SECONDS = 300
export const FAT_YEARS = 7
export const CYCLE_YEARS = 14
export type YearPhase = 'fat' | 'lean'
export const phaseOf = (index: number): YearPhase => (index % CYCLE_YEARS < FAT_YEARS ? 'fat' : 'lean')
/** The harvest in a good year is bigger. */
export const FAT_FACTOR = 1.5
/** The harvest in a lean year without any grain in the granary, and the most the granary can bring it back to. */
export const LEAN_BASE = 0.5
export const LEAN_MAX = 0.85
/** The grain the people need at the start of a lean year. */
export const leanNeed = (level: number): number => Math.min(120, Math.round(10 + level * 2.2))
