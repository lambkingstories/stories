/**
 * "Josefs Land": the rules of the farm game (state, planting and harvesting, workshops, animals, orders, the years of plenty and of hunger,
 * levels, goals, daily tasks, saving). No Vue and no clock of its own: every function that depends on time gets `now` (milliseconds), so that
 * the tests can run a whole game in a moment and so that a game that was closed simply goes on (every time is a point in time, nothing spoils,
 * nothing is punished). The orders come from a seeded generator, so they repeat with the same start value.
 */
import {
  ANIMALS,
  ANIMAL_IDS,
  BUILDINGS,
  BUILDING_IDS,
  CROPS,
  CROP_IDS,
  CYCLE_YEARS,
  DECORS,
  DECOR_IDS,
  FAT_FACTOR,
  GOODS,
  GOOD_IDS,
  GRAIN,
  LEAN_BASE,
  LEAN_MAX,
  LEVEL_MAX,
  MAX_PEN_LEVEL,
  MAX_WORKSHOP_LEVEL,
  PARCELS,
  PEN_SLOTS,
  RECIPES,
  RECIPE_IDS,
  SPOT_BY_ID,
  START_PARCELS,
  STORES,
  STORE_MAX_LEVEL,
  YEAR_SECONDS,
  leanNeed,
  levelCoins,
  orderSlots,
  phaseOf,
  unlocksAt,
  xpToNext,
  type AnimalId,
  type BuildingId,
  type CropId,
  type DecorId,
  type GoodId,
  type RecipeId,
  type StoreId,
  type YearPhase
} from '@/utils/josefslandData'

export const SAVE_KEY = 'lk-josefsland-v1'
export const GAME_ID = 'josefsland'

// ── the state ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface Plot {
  crop: CropId | null
  plantedAt: number
  readyAt: number
}
export interface Job {
  recipe: RecipeId
  doneAt: number
}
export interface BuildingState {
  built: boolean
  level: number
  queue: Job[]
}
/** `readyAt` 0 means the animal is hungry; otherwise the time at which its product is ready. */
export interface AnimalSlot {
  readyAt: number
}
export interface PenState {
  level: number
  slots: Array<AnimalSlot | null>
}
export interface OrderLine {
  good: GoodId
  n: number
}
export type OrderKind = 'caravan' | 'village' | 'palace' | 'dream' | 'brothers' | 'hunger'
export interface Order {
  id: number
  kind: OrderKind
  lines: OrderLine[]
  coins: number
  xp: number
  /** Which little figure stands for the one who asks (0 to 3). */
  who: number
}
export interface YearState {
  /** Years that are over (0 = the first good year is running). */
  index: number
  points: number
  /** The factor of the harvest in the running year. */
  factor: number
  /** How much of the need the granary could cover when the lean year began (0 to 1). */
  supplied: number
}
export interface DailyTask {
  id: string
  stat: string
  target: number
  base: number
  done: boolean
}
export interface DailyState {
  date: string
  tasks: DailyTask[]
}

export type GameEvent =
  | { kind: 'level'; level: number; unlocks: string[]; coins: number }
  | { kind: 'yearEnd'; index: number; phase: YearPhase; coins: number; xp: number }
  | { kind: 'leanStart'; index: number; need: number; given: number; coins: number; xp: number; factor: number }
  | { kind: 'fatStart'; cycle: number }
  | { kind: 'goal'; id: string; coins: number; xp: number }
  | { kind: 'stars'; chapter: number; stars: number }
  | { kind: 'daily'; id: string; coins: number; xp: number }
  | { kind: 'special'; order: OrderKind }

export interface GameState {
  v: 1
  seed: number
  coins: number
  xp: number
  level: number
  inv: Record<GoodId, number>
  parcels: number[]
  plots: Record<string, Plot>
  buildings: Record<BuildingId, BuildingState>
  pens: Record<AnimalId, PenState>
  decor: Record<string, DecorId>
  barn: number
  granary: number
  orders: Array<Order | null>
  refill: number[]
  orderCounter: number
  year: YearState
  stats: Record<string, number>
  goalsDone: string[]
  chapterStars: number[]
  seen: string[]
  daily: DailyState
  savedAt: number
  /** Things the screen should tell (not saved). */
  events: GameEvent[]
}

export type Reason = 'coins' | 'level' | 'busy' | 'full' | 'locked' | 'goods' | 'max' | 'none' | 'wrong' | 'wait'
export interface Result {
  ok: boolean
  reason?: Reason
  /** What the action gave (a number of goods). */
  n?: number
}
const ok = (n?: number): Result => ({ ok: true, n })
const no = (reason: Reason): Result => ({ ok: false, reason })

// ── random numbers with a start value ───────────────────────────────────────────────────────────────────────────────────────
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const rngFor = (seed: number, k: number): (() => number) => mulberry32((seed ^ Math.imul(k + 1, 0x9e3779b1)) >>> 0)

// ── creating, saving, loading ───────────────────────────────────────────────────────────────────────────────────────────────
const emptyInv = (): Record<GoodId, number> => Object.fromEntries(GOOD_IDS.map((g) => [g, 0])) as Record<GoodId, number>

export function newState(seed = 20261113, now = 0): GameState {
  const buildings = Object.fromEntries(BUILDING_IDS.map((b) => [b, { built: false, level: 1, queue: [] }])) as unknown as Record<BuildingId, BuildingState>
  const pens = Object.fromEntries(ANIMAL_IDS.map((a) => [a, { level: 1, slots: [null, null, null, null] }])) as Record<AnimalId, PenState>
  const s: GameState = {
    v: 1,
    seed: seed >>> 0,
    coins: 40,
    xp: 0,
    level: 1,
    inv: emptyInv(),
    parcels: [...START_PARCELS],
    plots: {},
    buildings,
    pens,
    decor: {},
    barn: 1,
    granary: 1,
    orders: [],
    refill: [],
    orderCounter: 0,
    year: { index: 0, points: 0, factor: FAT_FACTOR, supplied: 1 },
    stats: {},
    goalsDone: [],
    chapterStars: Array(CHAPTERS).fill(0) as number[],
    seen: [],
    daily: { date: '', tasks: [] },
    savedAt: now,
    events: []
  }
  tick(s, now)
  return s
}

const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Reads a save back (a broken or foreign one gives a new game); every value is checked. */
export function loadState(raw: string | null, now: number): GameState {
  const base = newState(undefined, now)
  if (!raw) return base
  let j: unknown
  try {
    j = JSON.parse(raw)
  } catch {
    return base
  }
  if (!isObj(j) || j.v !== 1) return base
  const s = newState(num(j.seed, base.seed), now)
  s.coins = Math.floor(num(j.coins, s.coins, 0, 1e9))
  s.level = Math.floor(num(j.level, 1, 1, LEVEL_MAX))
  s.xp = Math.floor(num(j.xp, 0, 0, 1e9))
  s.barn = Math.floor(num(j.barn, 1, 1, STORE_MAX_LEVEL))
  s.granary = Math.floor(num(j.granary, 1, 1, STORE_MAX_LEVEL))
  if (isObj(j.inv)) for (const g of GOOD_IDS) s.inv[g] = Math.floor(num(j.inv[g], 0, 0, 1e6))
  if (Array.isArray(j.parcels)) {
    const ids = j.parcels.filter((x): x is number => typeof x === 'number' && PARCELS.some((p) => p.id === x))
    s.parcels = Array.from(new Set([...START_PARCELS, ...ids]))
  }
  if (isObj(j.plots)) {
    for (const [id, p] of Object.entries(j.plots)) {
      const spot = SPOT_BY_ID[id]
      if (!spot || (spot.kind !== 'plot' && spot.kind !== 'bed') || !isObj(p)) continue
      const crop = typeof p.crop === 'string' && (CROP_IDS as string[]).includes(p.crop) ? (p.crop as CropId) : null
      if (crop && CROPS[crop].kind !== spot.kind) continue
      s.plots[id] = { crop, plantedAt: num(p.plantedAt, 0, 0), readyAt: num(p.readyAt, 0, 0) }
    }
  }
  if (isObj(j.buildings)) {
    for (const b of BUILDING_IDS) {
      const v = j.buildings[b]
      if (!isObj(v)) continue
      const queue = Array.isArray(v.queue)
        ? v.queue.filter((q): q is { recipe: RecipeId; doneAt: number } => isObj(q) && (RECIPE_IDS as string[]).includes(q.recipe as string) && RECIPES[q.recipe as RecipeId].building === b && typeof q.doneAt === 'number')
            .map((q) => ({ recipe: q.recipe, doneAt: q.doneAt }))
        : []
      s.buildings[b] = { built: v.built === true, level: Math.floor(num(v.level, 1, 1, MAX_WORKSHOP_LEVEL)), queue }
    }
  }
  if (isObj(j.pens)) {
    for (const a of ANIMAL_IDS) {
      const v = j.pens[a]
      if (!isObj(v)) continue
      const level = Math.floor(num(v.level, 1, 1, MAX_PEN_LEVEL))
      const slots: Array<AnimalSlot | null> = [null, null, null, null]
      if (Array.isArray(v.slots)) {
        for (let i = 0; i < Math.min(4, v.slots.length, PEN_SLOTS[level - 1]!); i++) {
          const sl = v.slots[i]
          slots[i] = isObj(sl) ? { readyAt: num(sl.readyAt, 0, 0) } : null
        }
      }
      s.pens[a] = { level, slots }
    }
  }
  if (isObj(j.decor)) {
    for (const [id, d] of Object.entries(j.decor)) if (SPOT_BY_ID[id]?.kind === 'decor' && (DECOR_IDS as string[]).includes(d as string)) s.decor[id] = d as DecorId
  }
  s.orderCounter = Math.floor(num(j.orderCounter, 0, 0, 1e9))
  if (Array.isArray(j.orders)) {
    s.orders = j.orders.map((o) => {
      if (!isObj(o) || !Array.isArray(o.lines)) return null
      const lines = o.lines.filter((l): l is OrderLine => isObj(l) && (GOOD_IDS as string[]).includes(l.good as string) && typeof l.n === 'number' && l.n >= 1).map((l) => ({ good: l.good, n: Math.floor(l.n) }))
      if (!lines.length) return null
      const kind = (['caravan', 'village', 'palace', 'dream', 'brothers', 'hunger'] as string[]).includes(o.kind as string) ? (o.kind as OrderKind) : 'village'
      return { id: Math.floor(num(o.id, 0, 0)), kind, lines, coins: Math.floor(num(o.coins, 10, 0, 1e7)), xp: Math.floor(num(o.xp, 3, 0, 1e7)), who: Math.floor(num(o.who, 0, 0, 3)) }
    })
    s.refill = Array.isArray(j.refill) ? s.orders.map((_, i) => num((j.refill as unknown[])[i], 0, 0)) : s.orders.map(() => 0)
  }
  if (isObj(j.year)) s.year = { index: Math.floor(num(j.year.index, 0, 0, 1e6)), points: num(j.year.points, 0, 0, YEAR_SECONDS - 1), factor: num(j.year.factor, FAT_FACTOR, 0.1, 3), supplied: num(j.year.supplied, 1, 0, 1) }
  if (isObj(j.stats)) for (const [k, v] of Object.entries(j.stats)) if (typeof v === 'number' && Number.isFinite(v)) s.stats[k] = v
  if (Array.isArray(j.goalsDone)) s.goalsDone = j.goalsDone.filter((g): g is string => typeof g === 'string' && GOALS.some((x) => x.id === g))
  if (Array.isArray(j.chapterStars)) s.chapterStars = s.chapterStars.map((_, i) => Math.floor(num((j.chapterStars as unknown[])[i], 0, 0, 3)))
  if (Array.isArray(j.seen)) s.seen = j.seen.filter((x): x is string => typeof x === 'string' && ALBUM.includes(x))
  if (isObj(j.daily) && typeof j.daily.date === 'string' && Array.isArray(j.daily.tasks)) {
    s.daily = {
      date: j.daily.date,
      tasks: j.daily.tasks.filter((t): t is DailyTask => isObj(t) && typeof t.id === 'string' && typeof t.stat === 'string').map((t) => ({ id: t.id, stat: t.stat, target: num(t.target, 5, 1), base: num(t.base, 0, 0), done: t.done === true }))
    }
  }
  s.savedAt = num(j.savedAt, now, 0)
  s.events = []
  tick(s, now)
  return s
}

export function serialize(s: GameState, now = s.savedAt): string {
  s.savedAt = now
  const { events: _events, ...rest } = s
  void _events
  return JSON.stringify(rest)
}

export interface Store {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
}
export function persist(s: GameState, now: number, store: Store = localStorage): void {
  try {
    store.setItem(SAVE_KEY, serialize(s, now))
  } catch {
    // a private window: not remembered
  }
}
export function load(now: number, store: Store = localStorage): GameState {
  try {
    return loadState(store.getItem(SAVE_KEY), now)
  } catch {
    return newState(undefined, now)
  }
}

// ── small helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────
export const stat = (s: GameState, k: string): number => s.stats[k] ?? 0
function bump(s: GameState, k: string, n = 1): void {
  s.stats[k] = (s.stats[k] ?? 0) + n
}
export const unlocked = (s: GameState, parcel: number): boolean => s.parcels.includes(parcel)

export function earn(s: GameState, n: number): void {
  const k = Math.max(0, Math.floor(n))
  s.coins += k
  bump(s, 'coinsEarned', k)
}

/** Experience: raises the level (and gives coins) as often as it fits. */
export function addXp(s: GameState, n: number): void {
  s.xp += Math.max(0, Math.floor(n))
  while (s.level < LEVEL_MAX && s.xp >= xpToNext(s.level)) {
    s.xp -= xpToNext(s.level)
    s.level++
    const coins = levelCoins(s.level)
    s.coins += coins
    s.events.push({ kind: 'level', level: s.level, unlocks: unlocksAt(s.level), coins })
  }
  if (s.level >= LEVEL_MAX) s.xp = Math.min(s.xp, xpToNext(LEVEL_MAX) - 1)
}

const ALBUM: string[] = [
  ...GOOD_IDS.map((g) => `good:${g}`),
  ...ANIMAL_IDS.map((a) => `animal:${a}`),
  ...BUILDING_IDS.map((b) => `building:${b}`),
  ...DECOR_IDS.map((d) => `decor:${d}`)
]
export const ALBUM_ITEMS = ALBUM
function see(s: GameState, key: string): void {
  if (!s.seen.includes(key)) s.seen.push(key)
}

// ── the stores ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const storeLevel = (s: GameState, store: StoreId): number => (store === 'barn' ? s.barn : s.granary)
export const capacity = (s: GameState, store: StoreId): number => STORES[store].cap[storeLevel(s, store) - 1]!
export function used(s: GameState, store: StoreId): number {
  let n = 0
  for (const g of GOOD_IDS) if (GOODS[g].store === store) n += s.inv[g]
  return n
}
export const room = (s: GameState, store: StoreId): number => Math.max(0, capacity(s, store) - used(s, store))
export const grainStock = (s: GameState): number => GRAIN.reduce((n, g) => n + s.inv[g], 0)

/** Puts goods into the store as far as they fit; returns how many went in. */
export function addGood(s: GameState, good: GoodId, n: number): number {
  const k = Math.max(0, Math.min(Math.floor(n), room(s, GOODS[good].store)))
  if (k > 0) {
    s.inv[good] += k
    see(s, `good:${good}`)
    if (GRAIN.includes(good)) s.stats.maxGrain = Math.max(stat(s, 'maxGrain'), grainStock(s))
  }
  return k
}

/** Sells goods for their price (one can always get rid of goods when the store is full). */
export function sell(s: GameState, good: GoodId, n: number): Result {
  const k = Math.min(Math.floor(n), s.inv[good])
  if (k <= 0) return no('goods')
  s.inv[good] -= k
  earn(s, k * GOODS[good].price)
  bump(s, 'sold', k)
  checkProgress(s)
  return ok(k)
}

function hasGoods(s: GameState, goods: Partial<Record<GoodId, number>>): boolean {
  return (Object.entries(goods) as Array<[GoodId, number]>).every(([g, n]) => s.inv[g] >= n)
}
function takeGoods(s: GameState, goods: Partial<Record<GoodId, number>>): void {
  for (const [g, n] of Object.entries(goods) as Array<[GoodId, number]>) s.inv[g] -= n
}

// ── the years: seven good, seven lean ───────────────────────────────────────────────────────────────────────────────────────
export interface YearView {
  index: number
  cycle: number
  /** 1 to 7 inside its phase. */
  nth: number
  phase: YearPhase
  points: number
  len: number
  factor: number
  supplied: number
}
export function yearView(s: GameState): YearView {
  const inCycle = s.year.index % CYCLE_YEARS
  return {
    index: s.year.index,
    cycle: Math.floor(s.year.index / CYCLE_YEARS) + 1,
    nth: (inCycle % 7) + 1,
    phase: phaseOf(s.year.index),
    points: s.year.points,
    len: YEAR_SECONDS,
    factor: s.year.factor,
    supplied: s.year.supplied
  }
}

/** The grain of the granary that Joseph gives out at the start of a lean year, and what the harvest is like afterwards. */
function startLean(s: GameState): void {
  const need = leanNeed(s.level)
  const stock = grainStock(s)
  let given = Math.min(need, stock)
  // the barley goes first, so that the wheat stays for sowing
  let rest = given
  for (const g of ['barley', 'wheat'] as GoodId[]) {
    const t = Math.min(rest, s.inv[g])
    s.inv[g] -= t
    rest -= t
  }
  given -= rest
  const f = need > 0 ? given / need : 1
  s.year.supplied = f
  s.year.factor = LEAN_BASE + (LEAN_MAX - LEAN_BASE) * f
  const coins = given * 3
  const xp = given * 2
  earn(s, coins)
  addXp(s, xp)
  bump(s, 'grainGiven', given)
  bump(s, 'leanStarted')
  s.events.push({ kind: 'leanStart', index: s.year.index, need, given, coins, xp, factor: s.year.factor })
}

function endYear(s: GameState): void {
  const ended = phaseOf(s.year.index)
  bump(s, 'yearsDone')
  bump(s, ended === 'fat' ? 'fatYears' : 'leanYears')
  const coins = 40 + 4 * s.level
  const xp = 20 + s.level
  earn(s, coins)
  addXp(s, xp)
  s.events.push({ kind: 'yearEnd', index: s.year.index, phase: ended, coins, xp })
  s.year.index++
  s.year.points -= YEAR_SECONDS
  if (phaseOf(s.year.index) === 'lean') {
    // every lean year begins with Joseph opening the granary
    startLean(s)
  } else {
    s.year.factor = FAT_FACTOR
    s.year.supplied = 1
    if (s.year.index % CYCLE_YEARS === 0) {
      bump(s, 'cycles')
      s.events.push({ kind: 'fatStart', cycle: Math.floor(s.year.index / CYCLE_YEARS) + 1 })
    }
  }
}

/**
 * Lets the year go on while the child plays (`seconds` of play; one picture of the game passes a fraction of a second, a long gap while the
 * page was hidden counts at most 5 seconds).
 */
export function advanceYear(s: GameState, seconds: number): void {
  s.year.points += Math.max(0, Math.min(5, seconds))
  let ended = false
  while (s.year.points >= YEAR_SECONDS) {
    endYear(s)
    ended = true
  }
  if (ended) checkProgress(s)
}

/** What a plot gives now: the base yield times the factor of the running year (at least one). */
export const harvestYield = (s: GameState, crop: CropId): number => Math.max(1, Math.round(CROPS[crop].yield * s.year.factor))

// ── plots ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type PlotPhase = 'locked' | 'empty' | 'growing' | 'ripe'
export function plotPhase(s: GameState, id: string, now: number): PlotPhase {
  const spot = SPOT_BY_ID[id]
  if (!spot || !unlocked(s, spot.parcel)) return 'locked'
  const p = s.plots[id]
  if (!p || !p.crop) return 'empty'
  return now >= p.readyAt ? 'ripe' : 'growing'
}
/** 0 to 1 while it grows. */
export function plotProgress(s: GameState, id: string, now: number): number {
  const p = s.plots[id]
  if (!p || !p.crop) return 0
  const total = p.readyAt - p.plantedAt
  return total <= 0 ? 1 : Math.min(1, Math.max(0, (now - p.plantedAt) / total))
}
/** The growth picture of a plot: 0 just sown, 1 sprouting, 2 growing, 3 ripe. */
export function plotStage(s: GameState, id: string, now: number): number {
  const ph = plotPhase(s, id, now)
  if (ph === 'ripe') return 3
  if (ph !== 'growing') return 0
  const k = plotProgress(s, id, now)
  return k < 0.25 ? 0 : k < 0.55 ? 1 : 2
}

export function plant(s: GameState, id: string, crop: CropId, now: number): Result {
  const spot = SPOT_BY_ID[id]
  if (!spot || (spot.kind !== 'plot' && spot.kind !== 'bed')) return no('wrong')
  if (!unlocked(s, spot.parcel)) return no('locked')
  const def = CROPS[crop]
  if (def.kind !== spot.kind) return no('wrong')
  if (s.level < def.level) return no('level')
  if (plotPhase(s, id, now) !== 'empty') return no('busy')
  if (s.coins < def.seed) return no('coins')
  s.coins -= def.seed
  s.plots[id] = { crop, plantedAt: now, readyAt: now + def.grow * 1000 }
  bump(s, 'planted')
  checkProgress(s)
  return ok()
}

export function harvest(s: GameState, id: string, now: number): Result {
  if (plotPhase(s, id, now) !== 'ripe') return no('wait')
  const p = s.plots[id]!
  const crop = p.crop!
  const n = harvestYield(s, crop)
  if (room(s, GOODS[crop].store) < n) return no('full')
  addGood(s, crop, n)
  s.plots[id] = { crop: null, plantedAt: 0, readyAt: 0 }
  bump(s, 'harvested')
  bump(s, `harvest_${crop}`)
  if (phaseOf(s.year.index) === 'lean') bump(s, 'harvestLean')
  addXp(s, CROPS[crop].xp)
  checkProgress(s)
  return ok(n)
}

/** Nile silt halves the time that is left of a growing plot. */
export function useSilt(s: GameState, id: string, now: number): Result {
  if (plotPhase(s, id, now) !== 'growing') return no('wait')
  if (s.inv.silt < 1) return no('goods')
  s.inv.silt--
  const p = s.plots[id]!
  p.readyAt = now + (p.readyAt - now) * 0.5
  bump(s, 'siltUsed')
  checkProgress(s)
  return ok()
}

// ── land and buildings ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function buyParcel(s: GameState, id: number): Result {
  const p = PARCELS.find((x) => x.id === id)
  if (!p) return no('wrong')
  if (unlocked(s, id)) return no('busy')
  if (s.level < p.level) return no('level')
  if (s.coins < p.cost) return no('coins')
  s.coins -= p.cost
  s.parcels.push(id)
  bump(s, 'parcelsBought')
  checkProgress(s)
  return ok()
}

export function build(s: GameState, id: BuildingId): Result {
  const def = BUILDINGS[id]
  const b = s.buildings[id]
  if (b.built) return no('busy')
  if (!unlocked(s, def.parcel)) return no('locked')
  if (s.level < def.level) return no('level')
  if (s.coins < def.cost) return no('coins')
  s.coins -= def.cost
  b.built = true
  b.level = 1
  b.queue = []
  see(s, `building:${id}`)
  bump(s, 'built')
  checkProgress(s)
  return ok()
}

export interface UpgradeInfo {
  level: number
  coins: number
  goods: Partial<Record<GoodId, number>>
}
/** What the next step of a building costs (null when it is at its top). */
export function nextBuildingUpgrade(s: GameState, id: BuildingId): UpgradeInfo | null {
  const b = s.buildings[id]
  return b.built && b.level < MAX_WORKSHOP_LEVEL ? BUILDINGS[id].upgrade[b.level - 1]! : null
}
export function nextStoreUpgrade(s: GameState, store: StoreId): UpgradeInfo | null {
  const l = storeLevel(s, store)
  return l < STORE_MAX_LEVEL ? STORES[store].upgrade[l - 1]! : null
}
export function nextPenUpgrade(s: GameState, a: AnimalId): { level: number; coins: number } | null {
  const l = s.pens[a].level
  return l < MAX_PEN_LEVEL ? ANIMALS[a].upgrade[l - 1]! : null
}

function payUpgrade(s: GameState, up: UpgradeInfo): Result {
  if (s.level < up.level) return no('level')
  if (s.coins < up.coins) return no('coins')
  if (!hasGoods(s, up.goods)) return no('goods')
  s.coins -= up.coins
  takeGoods(s, up.goods)
  bump(s, 'upgrades')
  return ok()
}
export function upgradeBuilding(s: GameState, id: BuildingId): Result {
  const up = nextBuildingUpgrade(s, id)
  if (!up) return no('max')
  const r = payUpgrade(s, up)
  if (r.ok) s.buildings[id].level++
  checkProgress(s)
  return r
}
export function upgradeStore(s: GameState, store: StoreId): Result {
  const up = nextStoreUpgrade(s, store)
  if (!up) return no('max')
  const r = payUpgrade(s, up)
  if (r.ok) {
    if (store === 'barn') s.barn++
    else s.granary++
  }
  checkProgress(s)
  return r
}
export function upgradePen(s: GameState, a: AnimalId): Result {
  const up = nextPenUpgrade(s, a)
  if (!up) return no('max')
  const r = payUpgrade(s, { level: up.level, coins: up.coins, goods: {} })
  if (r.ok) s.pens[a].level++
  checkProgress(s)
  return r
}

// ── workshops ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const queueCap = (s: GameState, id: BuildingId): number => BUILDINGS[id].queue[s.buildings[id].level - 1]!
export const jobSeconds = (s: GameState, r: RecipeId): number => Math.max(5, Math.round(RECIPES[r].time * BUILDINGS[RECIPES[r].building].speed[s.buildings[RECIPES[r].building].level - 1]!))

export function enqueue(s: GameState, id: BuildingId, recipe: RecipeId, now: number): Result {
  const b = s.buildings[id]
  const r = RECIPES[recipe]
  if (!b.built || r.building !== id) return no('wrong')
  if (s.level < r.level) return no('level')
  if (b.queue.length >= queueCap(s, id)) return no('full')
  if (!hasGoods(s, r.inputs)) return no('goods')
  takeGoods(s, r.inputs)
  const start = Math.max(now, b.queue.length ? b.queue[b.queue.length - 1]!.doneAt : now)
  b.queue.push({ recipe, doneAt: start + jobSeconds(s, recipe) * 1000 })
  return ok()
}
export const readyJobs = (s: GameState, id: BuildingId, now: number): number => s.buildings[id].queue.filter((j) => j.doneAt <= now).length

/** Takes the finished goods of a workshop into the stores (as many as fit). */
export function collectJobs(s: GameState, id: BuildingId, now: number): Result {
  const b = s.buildings[id]
  let n = 0
  let blocked = false
  while (b.queue.length && b.queue[0]!.doneAt <= now) {
    const g = b.queue[0]!.recipe as GoodId
    if (room(s, GOODS[g].store) < 1) {
      blocked = true
      break
    }
    b.queue.shift()
    addGood(s, g, 1)
    addXp(s, RECIPES[g as RecipeId].xp)
    bump(s, 'made')
    bump(s, `made_${g}`)
    n++
  }
  if (n === 0) return no(blocked ? 'full' : 'wait')
  checkProgress(s)
  return ok(n)
}

// ── animals ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const animalCount = (s: GameState, a: AnimalId): number => s.pens[a].slots.filter(Boolean).length
export const animalsOwned = (s: GameState): number => ANIMAL_IDS.reduce((n, a) => n + animalCount(s, a), 0)
export const penCapacity = (s: GameState, a: AnimalId): number => PEN_SLOTS[s.pens[a].level - 1]!
export function animalPrice(s: GameState, a: AnimalId): number {
  return Math.round(ANIMALS[a].price * (1 + 0.4 * animalCount(s, a)))
}

export function buyAnimal(s: GameState, a: AnimalId): Result {
  const def = ANIMALS[a]
  const pen = s.pens[a]
  if (!unlocked(s, def.parcel)) return no('locked')
  if (s.level < def.level) return no('level')
  const slot = pen.slots.findIndex((x, i) => !x && i < penCapacity(s, a))
  if (slot < 0) return no('full')
  const price = animalPrice(s, a)
  if (s.coins < price) return no('coins')
  s.coins -= price
  pen.slots[slot] = { readyAt: 0 }
  see(s, `animal:${a}`)
  checkProgress(s)
  return ok()
}

export function feed(s: GameState, a: AnimalId, i: number, now: number): Result {
  const sl = s.pens[a].slots[i]
  if (!sl) return no('none')
  if (sl.readyAt !== 0) return no('busy')
  const def = ANIMALS[a]
  if (s.inv[def.feed] < def.feedN) return no('goods')
  s.inv[def.feed] -= def.feedN
  sl.readyAt = now + def.time * 1000
  bump(s, 'fed')
  return ok()
}
export const animalReady = (s: GameState, a: AnimalId, i: number, now: number): boolean => {
  const sl = s.pens[a].slots[i]
  return !!sl && sl.readyAt !== 0 && now >= sl.readyAt
}
export function collectAnimal(s: GameState, a: AnimalId, i: number, now: number): Result {
  const sl = s.pens[a].slots[i]
  if (!sl) return no('none')
  if (!animalReady(s, a, i, now)) return no('wait')
  const def = ANIMALS[a]
  if (room(s, GOODS[def.product].store) < 1) return no('full')
  addGood(s, def.product, 1)
  sl.readyAt = 0
  addXp(s, def.xp)
  bump(s, 'animalCollected')
  bump(s, `animal_${def.product}`)
  checkProgress(s)
  return ok(1)
}

// ── decoration ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
export function placeDecor(s: GameState, spotId: string, d: DecorId): Result {
  const spot = SPOT_BY_ID[spotId]
  if (!spot || spot.kind !== 'decor') return no('wrong')
  if (!unlocked(s, spot.parcel)) return no('locked')
  const def = DECORS[d]
  if (s.level < def.level) return no('level')
  if (s.decor[spotId] === d) return no('busy')
  if (s.coins < def.cost) return no('coins')
  s.coins -= def.cost
  s.decor[spotId] = d
  const first = !s.seen.includes(`decor:${d}`)
  see(s, `decor:${d}`)
  if (first) addXp(s, Math.round(def.cost / 8) + 2)
  bump(s, 'decorPlaced')
  checkProgress(s)
  return ok()
}
export function clearDecor(s: GameState, spotId: string): void {
  delete s.decor[spotId]
}

// ── what can be made (for the orders) ───────────────────────────────────────────────────────────────────────────────────────
/** The goods the child can get now with what it has opened (plants on land that it has, workshops that are built, animals of a land that it has). */
export function makeable(s: GameState): GoodId[] {
  const out = new Set<GoodId>()
  const hasKind = (kind: 'plot' | 'bed') => PARCELS.some((p) => unlocked(s, p.id) && p.spots.some((sp) => sp.kind === kind))
  for (const c of CROP_IDS) if (s.level >= CROPS[c].level && hasKind(CROPS[c].kind)) out.add(c)
  for (const a of ANIMAL_IDS) if (s.level >= ANIMALS[a].level && unlocked(s, ANIMALS[a].parcel)) out.add(ANIMALS[a].product)
  // the recipes need their inputs to be makeable, so they are added until nothing changes
  for (let round = 0; round < 4; round++) {
    for (const r of RECIPE_IDS) {
      const def = RECIPES[r]
      if (!s.buildings[def.building].built || s.level < def.level) continue
      if ((Object.keys(def.inputs) as GoodId[]).every((g) => out.has(g))) out.add(r)
    }
  }
  return [...out]
}

// ── orders ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const KIND_PAY: Record<OrderKind, [number, number]> = {
  caravan: [1.5, 0.9],
  village: [1.3, 1.1],
  palace: [1.8, 1.4],
  hunger: [2.2, 1.2],
  brothers: [2.6, 1.6],
  dream: [0, 0]
}
/** The most of a good one order may ask for. */
function maxAsk(s: GameState, g: GoodId): number {
  const store = GOODS[g].store
  const byCap = Math.floor(capacity(s, store) * 0.3)
  const byLevel = GRAIN.includes(g) ? 4 + s.level : 3 + Math.floor(s.level / 6)
  return Math.max(1, Math.min(byCap, byLevel))
}

function pay(kind: OrderKind, lines: OrderLine[]): { coins: number; xp: number } {
  const base = lines.reduce((n, l) => n + l.n * GOODS[l.good].price, 0)
  const [c, x] = KIND_PAY[kind]
  return { coins: Math.max(5, Math.round(base * c)), xp: Math.max(2, Math.round(base * x * 0.45)) }
}

/** Which special order is due now (or none). */
function dueSpecial(s: GameState): 'dream' | 'brothers' | null {
  const phase = phaseOf(s.year.index)
  const done = stat(s, 'ordersDone')
  const onBoard = (k: OrderKind) => s.orders.some((o) => o?.kind === k)
  if (phase === 'fat' && s.level >= 12 && !onBoard('dream') && done >= 8 * (stat(s, 'ordersDone_dream') + 1)) return 'dream'
  if (phase === 'lean' && s.level >= 20 && !onBoard('brothers') && done >= 10 * (stat(s, 'ordersDone_brothers') + 1) && makeable(s).includes('bread')) return 'brothers'
  return null
}

export function makeOrder(s: GameState): Order {
  const r = rngFor(s.seed, s.orderCounter)
  s.orderCounter++
  const id = s.orderCounter
  const who = Math.floor(r() * 4)
  const special = dueSpecial(s)
  if (special === 'dream') {
    const store = capacity(s, 'granary')
    const n = Math.max(5, Math.min(Math.round(20 + s.level * 1.6), Math.floor(store * 0.7)))
    const lines: OrderLine[] = [{ good: 'wheat', n }]
    s.events.push({ kind: 'special', order: 'dream' })
    return { id, kind: 'dream', lines, coins: n * 8, xp: n * 2, who }
  }
  // the Nile silt is a helper for the plants, nobody orders it
  const pool = makeable(s).filter((g) => g !== 'silt')
  const grainOnly = pool.filter((g) => GRAIN.includes(g))
  let kind: OrderKind = 'village'
  if (special === 'brothers') kind = 'brothers'
  else if (phaseOf(s.year.index) === 'lean' && s.level >= 3 && r() < 0.45) kind = 'hunger'
  else {
    const k = r()
    kind = s.level >= 8 && k < 0.18 ? 'palace' : k < 0.6 ? 'caravan' : 'village'
  }
  const lines: OrderLine[] = []
  if (kind === 'hunger') {
    const g = grainOnly[Math.floor(r() * grainOnly.length)]!
    lines.push({ good: g, n: Math.max(2, Math.min(maxAsk(s, g), Math.round(6 + s.level / 3 + r() * 4))) })
  } else if (kind === 'brothers') {
    lines.push({ good: 'wheat', n: Math.min(maxAsk(s, 'wheat'), 8 + Math.floor(s.level / 2)) })
    if (pool.includes('barley')) lines.push({ good: 'barley', n: Math.min(maxAsk(s, 'barley'), 6 + Math.floor(s.level / 3)) })
    lines.push({ good: 'bread', n: Math.min(maxAsk(s, 'bread'), 3 + Math.floor(s.level / 10)) })
  } else {
    const count = Math.min(pool.length, s.level < 3 ? 1 : s.level < 10 ? 1 + Math.floor(r() * 2) : s.level < 30 ? 2 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3)) + (kind === 'palace' ? 1 : 0)
    // cheaper goods are asked more often than expensive ones
    const bag = [...pool]
    for (let i = 0; i < count && bag.length; i++) {
      const weights = bag.map((g) => 1 / Math.sqrt(GOODS[g].price))
      let t = r() * weights.reduce((a, b) => a + b, 0)
      let pick = 0
      for (let k = 0; k < bag.length; k++) {
        t -= weights[k]!
        if (t <= 0) {
          pick = k
          break
        }
      }
      const g = bag.splice(pick, 1)[0]!
      const budget = (6 + s.level * 5) * (0.7 + 0.6 * r()) * (kind === 'palace' ? 1.3 : 1)
      lines.push({ good: g, n: Math.max(1, Math.min(maxAsk(s, g), Math.round(budget / GOODS[g].price))) })
    }
    // the barn must be able to hold the whole order
    let barnN = lines.filter((l) => GOODS[l.good].store === 'barn').reduce((a, l) => a + l.n, 0)
    const cap = Math.floor(capacity(s, 'barn') * 0.8)
    for (let i = lines.length - 1; barnN > cap && i >= 0; i--) {
      const l = lines[i]!
      if (GOODS[l.good].store !== 'barn') continue
      const cut = Math.min(l.n - 1, barnN - cap)
      l.n -= cut
      barnN -= cut
    }
  }
  const p = pay(kind, lines)
  return { id, kind, lines, coins: p.coins, xp: p.xp, who }
}

/** Fills the empty places of the board with new orders whose waiting time is over. */
export function ensureOrders(s: GameState, now: number): void {
  const slots = orderSlots(s.level)
  while (s.orders.length < slots) {
    s.orders.push(null)
    s.refill.push(0)
  }
  for (let i = 0; i < slots; i++) if (!s.orders[i] && (s.refill[i] ?? 0) <= now) s.orders[i] = makeOrder(s)
}

export function canFill(s: GameState, o: Order): boolean {
  return o.lines.every((l) => s.inv[l.good] >= l.n)
}

export function fillOrder(s: GameState, i: number, now: number): Result {
  const o = s.orders[i]
  if (!o) return no('none')
  if (!canFill(s, o)) return no('goods')
  if (o.kind !== 'dream') for (const l of o.lines) s.inv[l.good] -= l.n
  earn(s, o.coins)
  s.orders[i] = null
  s.refill[i] = now + 6000
  bump(s, 'ordersDone')
  bump(s, `ordersDone_${o.kind}`)
  addXp(s, o.xp)
  checkProgress(s)
  return ok()
}

/** Sends an order away (no harm done); a new one comes a little later. */
export function skipOrder(s: GameState, i: number, now: number): Result {
  if (!s.orders[i]) return no('none')
  s.orders[i] = null
  s.refill[i] = now + 12000
  return ok()
}

// ── goals ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface Goal {
  id: string
  chapter: number
  stat: string
  target: number
  coins: number
  xp: number
}
export const CHAPTERS = 8
const G = (chapter: number, n: number, stat: string, target: number, coins: number, xp: number): Goal => ({ id: `c${chapter}g${n}`, chapter, stat, target, coins, xp })
export const GOALS: Goal[] = [
  G(0, 1, 'planted', 5, 20, 5), G(0, 2, 'harvested', 12, 25, 8), G(0, 3, 'ordersDone', 2, 30, 10), G(0, 4, 'level', 3, 40, 10), G(0, 5, 'coinsEarned', 150, 30, 10), G(0, 6, 'parcels', 3, 50, 15),
  G(1, 1, 'made_flour', 5, 40, 12), G(1, 2, 'made_bread', 3, 50, 15), G(1, 3, 'harvest_barley', 8, 40, 12), G(1, 4, 'level', 6, 60, 20), G(1, 5, 'ordersDone', 6, 60, 20), G(1, 6, 'buildings', 2, 70, 20),
  G(2, 1, 'animals', 1, 60, 20), G(2, 2, 'animalCollected', 5, 70, 20), G(2, 3, 'made_linen', 3, 80, 25), G(2, 4, 'animals', 3, 90, 25), G(2, 5, 'level', 9, 90, 30), G(2, 6, 'ordersDone', 12, 100, 30),
  G(3, 1, 'yearsDone', 1, 80, 30), G(3, 2, 'fatYears', 3, 100, 35), G(3, 3, 'grain', 60, 110, 35), G(3, 4, 'granaryLevel', 3, 120, 40), G(3, 5, 'level', 12, 130, 45), G(3, 6, 'ordersDone', 20, 140, 45),
  G(4, 1, 'ordersDone_dream', 1, 150, 50), G(4, 2, 'fatYears', 7, 200, 70), G(4, 3, 'ordersDone_palace', 5, 160, 55), G(4, 4, 'level', 16, 170, 60), G(4, 5, 'made_honey', 5, 150, 50), G(4, 6, 'made_cloth', 3, 150, 50),
  G(5, 1, 'leanStarted', 1, 200, 70), G(5, 2, 'grainGiven', 50, 220, 80), G(5, 3, 'ordersDone_hunger', 3, 220, 80), G(5, 4, 'harvestLean', 15, 230, 85), G(5, 5, 'level', 22, 250, 90), G(5, 6, 'grain', 150, 260, 95),
  G(6, 1, 'ordersDone_brothers', 1, 300, 110), G(6, 2, 'leanYears', 7, 400, 140), G(6, 3, 'grainGiven', 300, 350, 130), G(6, 4, 'ordersDone', 80, 330, 120), G(6, 5, 'level', 30, 400, 150), G(6, 6, 'barnLevel', 4, 320, 120),
  G(7, 1, 'parcels', 12, 500, 180), G(7, 2, 'buildings', 5, 450, 160), G(7, 3, 'album', 36, 600, 220), G(7, 4, 'level', 40, 700, 260), G(7, 5, 'ordersDone', 200, 700, 260), G(7, 6, 'cycles', 1, 900, 350)
]

/** The value of a counter for the goals (some are read from the state, the others are counted when they happen). */
export function statValue(s: GameState, key: string): number {
  switch (key) {
    case 'level': return s.level
    case 'parcels': return s.parcels.length
    case 'animals': return animalsOwned(s)
    case 'buildings': return BUILDING_IDS.filter((b) => s.buildings[b].built).length
    case 'album': return s.seen.length
    case 'grain': return grainStock(s)
    case 'granaryLevel': return s.granary
    case 'barnLevel': return s.barn
    default: return stat(s, key)
  }
}
export const goalProgress = (s: GameState, g: Goal): number => Math.min(g.target, statValue(s, g.stat))
export const chapterGoals = (c: number): Goal[] => GOALS.filter((g) => g.chapter === c)
export function chapterDone(s: GameState, c: number): number {
  return chapterGoals(c).filter((g) => s.goalsDone.includes(g.id)).length
}
/** 1 star for two goals of a chapter, 2 for four, 3 for all six. */
export const starsOfChapter = (done: number): number => (done >= 6 ? 3 : done >= 4 ? 2 : done >= 2 ? 1 : 0)
export const MAX_STARS = CHAPTERS * 3
/** The chapter the child works on now: the first one that is not finished. */
export function currentChapter(s: GameState): number {
  for (let c = 0; c < CHAPTERS; c++) if (chapterDone(s, c) < 6) return c
  return CHAPTERS - 1
}

// ── daily tasks ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
interface DailyDef {
  id: string
  stat: string
  base: number
  per: number
  needs?: (s: GameState) => boolean
}
export const DAILY_POOL: DailyDef[] = [
  { id: 'harvest', stat: 'harvested', base: 6, per: 0.4 },
  { id: 'plant', stat: 'planted', base: 6, per: 0.4 },
  { id: 'make', stat: 'made', base: 2, per: 0.2, needs: (s) => BUILDING_IDS.some((b) => s.buildings[b].built) },
  { id: 'animal', stat: 'animalCollected', base: 2, per: 0.15, needs: (s) => animalsOwned(s) > 0 },
  { id: 'orders', stat: 'ordersDone', base: 2, per: 0.1 },
  { id: 'coins', stat: 'coinsEarned', base: 80, per: 12 }
]

export function dateKey(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function hashString(t: string): number {
  let h = 2166136261
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Three new tasks when the day has changed (the same day always gives the same tasks). */
export function refreshDaily(s: GameState, now: number): void {
  const key = dateKey(now)
  if (s.daily.date === key) return
  const r = mulberry32(hashString(key) ^ s.seed)
  const pool = DAILY_POOL.filter((d) => !d.needs || d.needs(s))
  const tasks: DailyTask[] = []
  while (tasks.length < 3 && pool.length) {
    const d = pool.splice(Math.floor(r() * pool.length), 1)[0]!
    tasks.push({ id: d.id, stat: d.stat, target: Math.max(1, Math.round(d.base + d.per * s.level)), base: stat(s, d.stat), done: false })
  }
  s.daily = { date: key, tasks }
}
export const dailyReward = (s: GameState): { coins: number; xp: number } => ({ coins: 40 + s.level * 4, xp: 15 + s.level * 2 })

/** Checks goals and daily tasks (and pays them) until nothing new is reached. */
export function checkProgress(s: GameState): void {
  for (let guard = 0; guard < 20; guard++) {
    let changed = false
    for (const t of s.daily.tasks) {
      if (!t.done && stat(s, t.stat) - t.base >= t.target) {
        t.done = true
        changed = true
        const r = dailyReward(s)
        earn(s, r.coins)
        bump(s, 'dailyDone')
        addXp(s, r.xp)
        s.events.push({ kind: 'daily', id: t.id, coins: r.coins, xp: r.xp })
      }
    }
    for (const g of GOALS) {
      if (s.goalsDone.includes(g.id) || statValue(s, g.stat) < g.target) continue
      s.goalsDone.push(g.id)
      changed = true
      earn(s, g.coins)
      addXp(s, g.xp)
      s.events.push({ kind: 'goal', id: g.id, coins: g.coins, xp: g.xp })
    }
    for (let c = 0; c < CHAPTERS; c++) {
      const st = starsOfChapter(chapterDone(s, c))
      if (st > (s.chapterStars[c] ?? 0)) {
        s.chapterStars[c] = st
        s.events.push({ kind: 'stars', chapter: c, stars: st })
      }
    }
    if (!changed) break
  }
}

/** Called often (every second is enough): new day, new orders. */
export function tick(s: GameState, now: number): void {
  refreshDaily(s, now)
  ensureOrders(s, now)
  checkProgress(s)
}

/** Takes the things that the screen has to tell. */
export function drainEvents(s: GameState): GameEvent[] {
  const e = s.events
  s.events = []
  return e
}

// ── what happened while the game was closed ─────────────────────────────────────────────────────────────────────────────────
export interface Ready {
  plots: number
  jobs: number
  animals: number
}
export function readySummary(s: GameState, now: number): Ready {
  let plots = 0
  for (const p of PARCELS) {
    if (!unlocked(s, p.id)) continue
    for (const sp of p.spots) if ((sp.kind === 'plot' || sp.kind === 'bed') && plotPhase(s, sp.id, now) === 'ripe') plots++
  }
  const jobs = BUILDING_IDS.reduce((n, b) => n + readyJobs(s, b, now), 0)
  let animals = 0
  for (const a of ANIMAL_IDS) for (let i = 0; i < 4; i++) if (animalReady(s, a, i, now)) animals++
  return { plots, jobs, animals }
}
