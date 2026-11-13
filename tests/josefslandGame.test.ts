/**
 * "Josefs Land": the rules of the farm game. The chains of goods are right, the orders can always be filled, the levels rise, the years of
 * plenty and of hunger change the harvest (and the grain in the granary softens the lean ones), a game that was closed goes on by the clock,
 * the save is safe, and a simple bot that plays the game gets far.
 */
import { describe, expect, it } from 'vitest'
import {
  ANIMALS,
  ANIMAL_IDS,
  BUILDINGS,
  BUILDING_IDS,
  CROPS,
  CROP_IDS,
  DECOR_IDS,
  DECORS,
  FAT_FACTOR,
  GOODS,
  GOOD_IDS,
  GRAIN,
  LEAN_BASE,
  LEAN_MAX,
  LEVEL_MAX,
  PARCELS,
  RECIPES,
  RECIPE_IDS,
  SPOT_BY_ID,
  STORES,
  YEAR_SECONDS,
  leanNeed,
  orderSlots,
  unlocksAt,
  xpToNext,
  type BuildingId,
  type CropId,
  type GoodId
} from '../src/utils/josefslandData'
import {
  ALBUM_ITEMS,
  CHAPTERS,
  GOALS,
  MAX_STARS,
  SAVE_KEY,
  addGood,
  addXp,
  advanceYear,
  build,
  buyAnimal,
  buyParcel,
  canFill,
  capacity,
  chapterGoals,
  collectAnimal,
  collectJobs,
  dailyReward,
  dateKey,
  drainEvents,
  enqueue,
  ensureOrders,
  feed,
  fillOrder,
  grainStock,
  harvest,
  harvestYield,
  load,
  loadState,
  makeOrder,
  makeable,
  newState,
  persist,
  placeDecor,
  plant,
  plotPhase,
  plotStage,
  readySummary,
  room,
  sell,
  serialize,
  skipOrder,
  starsOfChapter,
  stat,
  tick,
  upgradeBuilding,
  upgradeStore,
  useSilt,
  yearView,
  type GameState
} from '../src/utils/josefslandGame'

const T0 = new Date(2026, 10, 13, 10, 0, 0).getTime()
const SEC = 1000

function memoryStore(init?: string) {
  const m = new Map<string, string>()
  if (init) m.set(SAVE_KEY, init)
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

/** A state with everything opened (as a player of a high level would have it). */
function rich(level = 40, seed = 7): GameState {
  const s = newState(seed, T0)
  s.level = level
  s.coins = 1_000_000
  for (const p of PARCELS) if (!s.parcels.includes(p.id)) s.parcels.push(p.id)
  for (const b of BUILDING_IDS) {
    s.buildings[b].built = true
    s.buildings[b].level = 5
  }
  s.barn = 8
  s.granary = 8
  for (const a of ANIMAL_IDS) s.pens[a].level = 3
  s.orders = []
  s.refill = []
  return s
}

const firstSpot = (kind: 'plot' | 'bed') => PARCELS.flatMap((p) => p.spots).find((sp) => sp.kind === kind)!.id

describe('the content', () => {
  it('every good has a price, a level and a place; the chains add up', () => {
    for (const g of GOOD_IDS) {
      expect(GOODS[g].price).toBeGreaterThan(0)
      expect(['barn', 'granary']).toContain(GOODS[g].store)
    }
    expect(GRAIN.every((g) => GOODS[g].store === 'granary')).toBe(true)
    for (const r of RECIPE_IDS) {
      const def = RECIPES[r]
      expect(GOODS[r as GoodId]).toBeDefined()
      // the good gets available with its recipe, and never before the goods it is made from
      expect(GOODS[r].level).toBe(def.level)
      let cost = 0
      for (const [g, n] of Object.entries(def.inputs) as Array<[GoodId, number]>) {
        expect(GOODS[g].level).toBeLessThanOrEqual(def.level)
        cost += GOODS[g].price * n
      }
      // making something is worth it
      expect(GOODS[r].price).toBeGreaterThanOrEqual(cost)
      expect(BUILDINGS[def.building].level).toBeLessThanOrEqual(def.level)
    }
    for (const c of CROP_IDS) {
      expect(GOODS[c].level).toBe(CROPS[c].level)
      expect(GOODS[c].price * CROPS[c].yield).toBeGreaterThan(CROPS[c].seed)
    }
    for (const a of ANIMAL_IDS) {
      expect(GOODS[ANIMALS[a].product].level).toBe(ANIMALS[a].level)
      expect(GOODS[ANIMALS[a].feed].level).toBeLessThanOrEqual(ANIMALS[a].level)
    }
  })

  it('every land piece, building and pen has its place on the map; no two places are the same', () => {
    const ids = PARCELS.flatMap((p) => p.spots.map((s) => s.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const b of BUILDING_IDS) expect(SPOT_BY_ID[`p${BUILDINGS[b].parcel}-${b}`]?.kind).toBe('building')
    for (const a of ANIMAL_IDS) expect(PARCELS[ANIMALS[a].parcel]!.animal).toBe(a)
    expect(PARCELS.filter((p) => p.cost === 0).map((p) => p.id).sort()).toEqual([1, 5])
    // the fields and the beds exist for every plant
    expect(PARCELS.some((p) => p.spots.some((s) => s.kind === 'plot'))).toBe(true)
    expect(PARCELS.some((p) => p.spots.some((s) => s.kind === 'bed'))).toBe(true)
    // the levels that open things never come before a good that they need
    for (const p of PARCELS) if (p.cost > 0) expect(p.level).toBeGreaterThanOrEqual(2)
    for (const b of BUILDING_IDS) expect(PARCELS[BUILDINGS[b].parcel]!.level).toBeLessThanOrEqual(BUILDINGS[b].level)
    for (const a of ANIMAL_IDS) expect(PARCELS[ANIMALS[a].parcel]!.level).toBeLessThanOrEqual(ANIMALS[a].level)
  })

  it('the levels get harder, there are more than forty, and the stores grow', () => {
    for (let l = 1; l < LEVEL_MAX; l++) expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l))
    expect(LEVEL_MAX).toBeGreaterThanOrEqual(40)
    for (const st of ['barn', 'granary'] as const) {
      const cap = STORES[st].cap
      for (let i = 1; i < cap.length; i++) expect(cap[i]!).toBeGreaterThan(cap[i - 1]!)
      expect(STORES[st].upgrade).toHaveLength(cap.length - 1)
    }
    // new things keep coming into the high levels (decoration, upgrades)
    const opens = new Set<number>()
    for (let l = 1; l <= LEVEL_MAX; l++) if (unlocksAt(l).length) opens.add(l)
    expect(Math.max(...opens)).toBeGreaterThanOrEqual(30)
    expect(DECOR_IDS.map((d) => DECORS[d].level).sort((a, b) => a - b)).toEqual(DECOR_IDS.map((d) => DECORS[d].level).sort((a, b) => a - b))
  })

  it('eight chapters of six goals, three stars each, the goals can be reached', () => {
    expect(CHAPTERS).toBe(8)
    expect(MAX_STARS).toBe(24)
    for (let c = 0; c < CHAPTERS; c++) expect(chapterGoals(c)).toHaveLength(6)
    expect(new Set(GOALS.map((g) => g.id)).size).toBe(GOALS.length)
    expect([0, 1, 2, 3, 4, 5, 6].map(starsOfChapter)).toEqual([0, 0, 1, 1, 2, 2, 3])
    expect(ALBUM_ITEMS.length).toBe(GOOD_IDS.length + ANIMAL_IDS.length + BUILDING_IDS.length + DECOR_IDS.length)
  })
})

describe('planting and harvesting', () => {
  it('a plot grows in stages, ripens by the clock, and gives goods, experience and a year point', () => {
    const s = newState(1, T0)
    const id = firstSpot('plot')
    expect(plotPhase(s, id, T0)).toBe('locked')
    const fields = PARCELS.find((p) => p.id === 1)!.spots.filter((sp) => sp.kind === 'plot')
    const f = fields[0]!.id
    expect(plotPhase(s, f, T0)).toBe('empty')
    expect(plant(s, f, 'wheat', T0).ok).toBe(true)
    expect(s.coins).toBe(40 - CROPS.wheat.seed)
    expect(plotPhase(s, f, T0 + 5 * SEC)).toBe('growing')
    expect(plotStage(s, f, T0 + 1 * SEC)).toBe(0)
    expect(plotStage(s, f, T0 + 10 * SEC)).toBe(2)
    expect(harvest(s, f, T0 + 5 * SEC)).toMatchObject({ ok: false, reason: 'wait' })
    const r = harvest(s, f, T0 + 16 * SEC)
    expect(r.ok).toBe(true)
    expect(r.n).toBe(harvestYield(s, 'wheat'))
    expect(s.inv.wheat).toBe(r.n)
    expect(s.xp).toBeGreaterThan(0)
    expect(plotPhase(s, f, T0 + 17 * SEC)).toBe('empty')
    expect(s.seen).toContain('good:wheat')
  })

  it('a plant needs its level, the right kind of plot, free soil and a coin', () => {
    const s = newState(1, T0)
    const f = PARCELS.find((p) => p.id === 1)!.spots.find((sp) => sp.kind === 'plot')!.id
    expect(plant(s, f, 'barley', T0)).toMatchObject({ ok: false, reason: 'level' })
    expect(plant(s, f, 'grapes', T0).ok).toBe(false)
    s.coins = 0
    expect(plant(s, f, 'wheat', T0)).toMatchObject({ ok: false, reason: 'coins' })
    s.coins = 10
    expect(plant(s, f, 'wheat', T0).ok).toBe(true)
    expect(plant(s, f, 'wheat', T0)).toMatchObject({ ok: false, reason: 'busy' })
    const locked = firstSpot('bed')
    expect(plant(s, locked, 'grapes', T0)).toMatchObject({ ok: false, reason: 'locked' })
  })

  it('a full granary does not take the harvest; selling makes room', () => {
    const s = newState(1, T0)
    const f = PARCELS.find((p) => p.id === 1)!.spots.find((sp) => sp.kind === 'plot')!.id
    addGood(s, 'wheat', capacity(s, 'granary'))
    plant(s, f, 'wheat', T0)
    expect(harvest(s, f, T0 + 20 * SEC)).toMatchObject({ ok: false, reason: 'full' })
    expect(sell(s, 'wheat', 5).ok).toBe(true)
    expect(harvest(s, f, T0 + 20 * SEC).ok).toBe(true)
    expect(room(s, 'granary')).toBeGreaterThanOrEqual(0)
  })

  it('Nile silt halves the time that is left', () => {
    const s = rich(20)
    const f = firstSpot('plot')
    plant(s, f, 'flax', T0)
    expect(useSilt(s, f, T0 + 10 * SEC)).toMatchObject({ ok: false, reason: 'goods' })
    s.inv.silt = 2
    expect(useSilt(s, f, T0 + 10 * SEC).ok).toBe(true)
    expect(s.plots[f]!.readyAt).toBe(T0 + 10 * SEC + 25 * SEC)
    expect(s.inv.silt).toBe(1)
  })
})

describe('workshops, animals, land', () => {
  it('a workshop turns goods into goods one after the other, and the finished ones wait until they are taken', () => {
    const s = rich(10)
    s.inv.wheat = 10
    expect(enqueue(s, 'mill', 'flour', T0).ok).toBe(true)
    expect(enqueue(s, 'mill', 'flour', T0).ok).toBe(true)
    expect(s.inv.wheat).toBe(6)
    const q = s.buildings.mill.queue
    // level 5: 0.5 of 20 seconds, the second job starts when the first is done
    expect(q[0]!.doneAt - T0).toBe(10 * SEC)
    expect(q[1]!.doneAt - q[0]!.doneAt).toBe(10 * SEC)
    expect(collectJobs(s, 'mill', T0 + 5 * SEC)).toMatchObject({ ok: false, reason: 'wait' })
    expect(collectJobs(s, 'mill', T0 + 11 * SEC).n).toBe(1)
    expect(collectJobs(s, 'mill', T0 + 60 * SEC).n).toBe(1)
    expect(s.inv.flour).toBe(2)
    s.inv.wheat = 0
    expect(enqueue(s, 'bakery', 'flour', T0)).toMatchObject({ ok: false, reason: 'wrong' })
    expect(enqueue(s, 'mill', 'flour', T0)).toMatchObject({ ok: false, reason: 'goods' })
  })

  it('the honey of the apiary needs nothing; the queue has a limit', () => {
    const s = rich(20)
    const cap = BUILDINGS.apiary.queue[4]!
    for (let i = 0; i < cap; i++) expect(enqueue(s, 'apiary', 'honey', T0).ok).toBe(true)
    expect(enqueue(s, 'apiary', 'honey', T0)).toMatchObject({ ok: false, reason: 'full' })
  })

  it('an animal wants feed, gives its product when the time is over, and is hungry again', () => {
    const s = rich(20)
    expect(buyAnimal(s, 'sheep').ok).toBe(true)
    expect(feed(s, 'sheep', 0, T0)).toMatchObject({ ok: false, reason: 'goods' })
    s.inv.wheat = 3
    expect(feed(s, 'sheep', 0, T0).ok).toBe(true)
    expect(feed(s, 'sheep', 0, T0)).toMatchObject({ ok: false, reason: 'busy' })
    expect(collectAnimal(s, 'sheep', 0, T0 + 10 * SEC)).toMatchObject({ ok: false, reason: 'wait' })
    expect(collectAnimal(s, 'sheep', 0, T0 + 91 * SEC).ok).toBe(true)
    expect(s.inv.wool).toBe(1)
    expect(s.pens.sheep.slots[0]!.readyAt).toBe(0)
    // a second animal costs more; a pen of level 1 holds two
    const s2 = newState(3, T0)
    s2.level = 12
    s2.coins = 100000
    s2.parcels.push(4)
    expect(buyAnimal(s2, 'sheep').ok).toBe(true)
    const second = s2.coins
    expect(buyAnimal(s2, 'sheep').ok).toBe(true)
    expect(second - s2.coins).toBeGreaterThan(ANIMALS.sheep.price)
    expect(buyAnimal(s2, 'sheep')).toMatchObject({ ok: false, reason: 'full' })
  })

  it('land, buildings, stores and decoration are bought with coins and level', () => {
    const s = newState(2, T0)
    expect(buyParcel(s, 6)).toMatchObject({ ok: false, reason: 'level' })
    s.level = 2
    s.coins = 500
    expect(buyParcel(s, 6).ok).toBe(true)
    expect(buyParcel(s, 6)).toMatchObject({ ok: false, reason: 'busy' })
    expect(build(s, 'mill').ok).toBe(true)
    expect(build(s, 'bakery')).toMatchObject({ ok: false, reason: 'level' })
    expect(build(s, 'press')).toMatchObject({ ok: false, reason: 'locked' })
    // the stores need goods for the next step
    s.level = 10
    expect(upgradeStore(s, 'barn')).toMatchObject({ ok: false, reason: 'goods' })
    s.inv.flour = 4
    expect(upgradeStore(s, 'barn').ok).toBe(true)
    expect(s.barn).toBe(2)
    expect(capacity(s, 'barn')).toBe(STORES.barn.cap[1])
    expect(upgradeBuilding(s, 'mill')).toMatchObject({ ok: false, reason: 'goods' })
    s.inv.flour = 6
    s.coins = 1000
    expect(upgradeBuilding(s, 'mill').ok).toBe(true)
    expect(s.buildings.mill.level).toBe(2)
    // decoration
    expect(placeDecor(s, 'p5-d0', 'palm').ok).toBe(true)
    expect(s.decor['p5-d0']).toBe('palm')
    expect(s.seen).toContain('decor:palm')
    expect(placeDecor(s, 'p5-d0', 'palm')).toMatchObject({ ok: false, reason: 'busy' })
    expect(placeDecor(s, 'p0-f0', 'palm')).toMatchObject({ ok: false, reason: 'wrong' })
  })
})

describe('the orders', () => {
  it('always ask for goods that can be made, in amounts that fit the stores, with a reward', () => {
    for (const level of [1, 2, 3, 5, 8, 12, 16, 21, 30, 45, 60]) {
      for (let seed = 1; seed <= 12; seed++) {
        const s = rich(level, seed)
        // the child may not have everything: some states have only the first parcels and the mill
        if (seed % 3 === 0) {
          s.parcels = [1, 5, 6, 4]
          for (const b of BUILDING_IDS) s.buildings[b].built = b === 'mill' || b === 'bakery'
          s.barn = 1
          s.granary = 1
        }
        const can = makeable(s)
        for (let k = 0; k < 25; k++) {
          const o = makeOrder(s)
          expect(o.lines.length).toBeGreaterThan(0)
          expect(o.coins).toBeGreaterThan(0)
          expect(o.xp).toBeGreaterThan(0)
          const goods = o.lines.map((l) => l.good)
          expect(new Set(goods).size).toBe(goods.length)
          expect(goods).not.toContain('silt')
          let barn = 0
          for (const l of o.lines) {
            expect(can).toContain(l.good)
            expect(l.n).toBeGreaterThanOrEqual(1)
            expect(l.n).toBeLessThanOrEqual(capacity(s, GOODS[l.good].store))
            if (GOODS[l.good].store === 'barn') barn += l.n
          }
          expect(barn).toBeLessThanOrEqual(capacity(s, 'barn'))
          // an order asks for goods that exist at this level
          for (const l of o.lines) expect(GOODS[l.good].level).toBeLessThanOrEqual(level)
        }
      }
    }
  })

  it('come from a start value: the same game gives the same orders', () => {
    const a = rich(18, 99)
    const b = rich(18, 99)
    const c = rich(18, 100)
    const la = Array.from({ length: 10 }, () => JSON.stringify(makeOrder(a)))
    const lb = Array.from({ length: 10 }, () => JSON.stringify(makeOrder(b)))
    const lc = Array.from({ length: 10 }, () => JSON.stringify(makeOrder(c)))
    expect(la).toEqual(lb)
    expect(la).not.toEqual(lc)
  })

  it('the board has places by level; a filled order pays, leaves a gap, and a new one comes later', () => {
    expect([1, 8, 16, 28].map(orderSlots)).toEqual([3, 4, 5, 6])
    const s = newState(5, T0)
    expect(s.orders.filter(Boolean)).toHaveLength(3)
    const o = s.orders[0]!
    expect(fillOrder(s, 0, T0)).toMatchObject({ ok: false, reason: 'goods' })
    for (const l of o.lines) s.inv[l.good] = l.n
    expect(canFill(s, o)).toBe(true)
    const coins = s.coins
    expect(fillOrder(s, 0, T0).ok).toBe(true)
    expect(s.coins).toBeGreaterThanOrEqual(coins + o.coins)
    expect(s.orders[0]).toBeNull()
    ensureOrders(s, T0 + 3 * SEC)
    expect(s.orders[0]).toBeNull()
    ensureOrders(s, T0 + 7 * SEC)
    expect(s.orders[0]).not.toBeNull()
    expect(skipOrder(s, 1, T0 + 10 * SEC).ok).toBe(true)
    expect(s.orders[1]).toBeNull()
    expect(stat(s, 'ordersDone')).toBe(1)
  })

  it('Pharaoh\'s dream asks to keep grain in the granary and does not take it away', () => {
    const s = rich(20, 4)
    s.stats.ordersDone = 8
    const o = makeOrder(s)
    s.orders = [o]
    s.refill = [0]
    expect(o.kind).toBe('dream')
    expect(o.lines).toHaveLength(1)
    expect(GRAIN).toContain(o.lines[0]!.good)
    expect(o.lines[0]!.n).toBeLessThanOrEqual(capacity(s, 'granary') * 0.7)
    s.inv.wheat = o.lines[0]!.n
    expect(fillOrder(s, 0, T0).ok).toBe(true)
    expect(s.inv.wheat).toBe(o.lines[0]!.n)
    expect(stat(s, 'ordersDone_dream')).toBe(1)
  })

  it('the brothers who come to buy grain appear in lean years', () => {
    const s = rich(25, 6)
    s.year.index = 8
    s.stats.ordersDone = 10
    const o = makeOrder(s)
    expect(o.kind).toBe('brothers')
    expect(o.lines.map((l) => l.good)).toEqual(['wheat', 'barley', 'bread'])
    expect(o.coins).toBeGreaterThan(o.lines.reduce((n, l) => n + l.n * GOODS[l.good].price, 0))
  })
})

describe('the years of plenty and of hunger', () => {
  /** Plays `years` years in pictures of a fraction of a second (as the game does). */
  function harvestYears(s: GameState, years: number): void {
    for (let i = 0; i < years * YEAR_SECONDS * 10 + 5; i++) advanceYear(s, 0.1)
  }

  it('seven good years with a bigger harvest, then seven lean ones', () => {
    const s = newState(3, T0)
    expect(yearView(s)).toMatchObject({ phase: 'fat', nth: 1, cycle: 1, factor: FAT_FACTOR })
    expect(harvestYield(s, 'wheat')).toBeGreaterThan(CROPS.wheat.yield)
    harvestYears(s, 1)
    expect(yearView(s).index).toBe(1)
    expect(drainEvents(s).some((e) => e.kind === 'yearEnd')).toBe(true)
    harvestYears(s, 6)
    expect(yearView(s)).toMatchObject({ phase: 'lean', nth: 1 })
    expect(stat(s, 'fatYears')).toBe(7)
    expect(harvestYield(s, 'wheat')).toBeLessThan(CROPS.wheat.yield + 1)
    harvestYears(s, 7)
    expect(yearView(s)).toMatchObject({ phase: 'fat', cycle: 2, nth: 1 })
    expect(stat(s, 'cycles')).toBe(1)
    expect(stat(s, 'leanYears')).toBe(7)
  })

  it('grain in the granary softens a lean year; without grain nothing bad is taken away', () => {
    const lean = (grain: number) => {
      const s = newState(3, T0)
      s.level = 10
      s.granary = 3
      s.year.index = 6
      s.year.points = YEAR_SECONDS - 1
      s.inv.wheat = grain
      const coins = s.coins
      advanceYear(s, 1)
      const ev = drainEvents(s).find((e) => e.kind === 'leanStart')
      return { s, ev, coins }
    }
    const need = leanNeed(10)
    const none = lean(0)
    expect(yearView(none.s).phase).toBe('lean')
    expect(none.ev).toMatchObject({ kind: 'leanStart', given: 0 })
    expect(none.s.year.factor).toBeCloseTo(LEAN_BASE)
    expect(none.s.coins).toBeGreaterThanOrEqual(none.coins)
    const half = lean(Math.floor(need / 2))
    const full = lean(need + 20)
    expect(half.s.year.factor).toBeGreaterThan(none.s.year.factor)
    expect(full.s.year.factor).toBeGreaterThan(half.s.year.factor)
    expect(full.s.year.factor).toBeCloseTo(LEAN_MAX)
    expect(full.ev).toMatchObject({ given: need })
    // the people take only what they need
    expect(grainStock(full.s)).toBeGreaterThanOrEqual(20)
    // and the better harvest is real
    expect(harvestYield(full.s, 'dates')).toBeGreaterThanOrEqual(harvestYield(none.s, 'dates'))
    expect(full.s.coins).toBeGreaterThan(none.s.coins)
    expect(stat(full.s, 'grainGiven')).toBe(need)
  })

  it('in a lean year hungry people ask for grain and pay double', () => {
    const s = rich(12, 11)
    s.year.index = 9
    const kinds = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const o = makeOrder(s)
      kinds.add(o.kind)
      if (o.kind === 'hunger') {
        expect(o.lines.every((l) => GRAIN.includes(l.good))).toBe(true)
        expect(o.coins).toBeGreaterThanOrEqual(Math.round(o.lines.reduce((n, l) => n + l.n * GOODS[l.good].price, 0) * 2))
      }
    }
    expect(kinds.has('hunger')).toBe(true)
  })
})

describe('levels, goals, daily tasks', () => {
  it('experience raises the level and gives coins and a message of what opens', () => {
    const s = newState(1, T0)
    drainEvents(s)
    addXp(s, xpToNext(1) + xpToNext(2) + 1)
    expect(s.level).toBe(3)
    const ev = drainEvents(s).filter((e) => e.kind === 'level')
    expect(ev).toHaveLength(2)
    const e3 = ev[1] as { level: number; unlocks: string[] }
    expect(e3.level).toBe(3)
    expect(e3.unlocks).toContain('crop:barley')
    addXp(s, 1e9)
    expect(s.level).toBe(LEVEL_MAX)
  })

  it('goals pay once, chapters give stars', () => {
    const s = newState(1, T0)
    drainEvents(s)
    s.stats.planted = 5
    s.stats.harvested = 12
    s.coins = 0
    tick(s, T0)
    expect(s.goalsDone).toEqual(expect.arrayContaining(['c0g1', 'c0g2']))
    const ev = drainEvents(s)
    expect(ev.filter((e) => e.kind === 'goal')).toHaveLength(2)
    expect(ev.find((e) => e.kind === 'stars')).toMatchObject({ chapter: 0, stars: 1 })
    expect(s.chapterStars[0]).toBe(1)
    const coins = s.coins
    tick(s, T0)
    expect(s.coins).toBe(coins)
  })

  it('three daily tasks come from the date, stay the same on that day, are free, and pay when reached', () => {
    const a = newState(1, T0)
    const b = newState(1, T0 + 5 * 3600 * SEC)
    expect(a.daily.tasks).toHaveLength(3)
    expect(a.daily.tasks.map((t) => t.id)).toEqual(b.daily.tasks.map((t) => t.id))
    expect(a.daily.date).toBe(dateKey(T0))
    const next = new Date(2026, 10, 14, 9, 0, 0).getTime()
    tick(b, next)
    expect(b.daily.date).toBe('2026-11-14')
    expect(new Set(a.daily.tasks.map((t) => t.id)).size).toBe(3)
    const t = a.daily.tasks[0]!
    drainEvents(a)
    a.stats[t.stat] = (a.stats[t.stat] ?? 0) + t.target
    const coins = a.coins
    tick(a, T0)
    expect(a.coins).toBeGreaterThanOrEqual(coins + dailyReward(a).coins)
    expect(drainEvents(a).some((e) => e.kind === 'daily')).toBe(true)
    expect(a.daily.tasks[0]!.done).toBe(true)
  })
})

describe('a game that was closed goes on', () => {
  it('growing plants, jobs and animals are finished when the game is opened later; nothing is lost', () => {
    const s = rich(20, 8)
    const f = firstSpot('plot')
    const bed = firstSpot('bed')
    plant(s, f, 'wheat', T0)
    plant(s, bed, 'dates', T0)
    s.inv.wheat = 10
    enqueue(s, 'mill', 'flour', T0)
    enqueue(s, 'mill', 'flour', T0)
    buyAnimal(s, 'goat')
    s.inv.barley = 4
    feed(s, 'goat', 0, T0)
    const store = memoryStore()
    persist(s, T0, store)
    // nothing is ready right away
    const back = load(T0 + 2 * SEC, store)
    expect(readySummary(back, T0 + 2 * SEC)).toEqual({ plots: 0, jobs: 0, animals: 0 })
    // an hour later everything is ready
    const later = load(T0 + 3600 * SEC, store)
    expect(readySummary(later, T0 + 3600 * SEC)).toEqual({ plots: 2, jobs: 2, animals: 1 })
    expect(later.inv).toEqual(s.inv)
    expect(harvest(later, f, T0 + 3600 * SEC).ok).toBe(true)
    expect(harvest(later, bed, T0 + 3600 * SEC).ok).toBe(true)
    expect(collectJobs(later, 'mill', T0 + 3600 * SEC).n).toBe(2)
    expect(collectAnimal(later, 'goat', 0, T0 + 3600 * SEC).ok).toBe(true)
    // days later: still the same, and the orders did not pile up
    const days = load(T0 + 5 * 86400 * SEC, store)
    expect(readySummary(days, T0 + 5 * 86400 * SEC).plots).toBe(2)
    expect(days.orders.filter(Boolean).length).toBeLessThanOrEqual(orderSlots(days.level))
  })

  it('the save keeps everything and survives broken data', () => {
    const s = rich(33, 5)
    plant(s, firstSpot('plot'), 'wheat', T0)
    addGood(s, 'honey', 5)
    s.stats.ordersDone = 12
    placeDecor(s, 'p5-d1', 'jars')
    tick(s, T0)
    const raw = serialize(s, T0)
    const back = loadState(raw, T0)
    expect(JSON.parse(serialize(back, T0))).toEqual(JSON.parse(raw))
    expect(back.events).toEqual([])
    for (const junk of [null, '', 'nonsense', '{"v":2}', '{"v":1,"coins":"many","inv":{"wheat":-5},"parcels":[99,"x"],"plots":{"nope":{}},"year":{"index":-4}}', '[]']) {
      const g = loadState(junk, T0)
      expect(g.coins).toBeGreaterThanOrEqual(0)
      expect(g.parcels).toEqual(expect.arrayContaining([1, 5]))
      expect(g.inv.wheat).toBeGreaterThanOrEqual(0)
      expect(g.year.index).toBeGreaterThanOrEqual(0)
      expect(g.orders.filter(Boolean).length).toBeGreaterThan(0)
    }
    const k = loadState('{"v":1,"coins":99,"level":2}', T0)
    expect(k.coins).toBe(99)
    expect(k.level).toBe(2)
  })
})

describe('a simple player (bot) gets far', () => {
  /** Plays like a careful child: plants everything, harvests, makes what the orders ask, fills orders, buys what it can. */
  function bot(s: GameState, from: number, minutes: number, step = 2): number {
    let t = from
    const end = from + minutes * 60 * SEC
    while (t < end) {
      t += step * SEC
      tick(s, t)
      advanceYear(s, step)
      // harvest and plant
      for (const p of PARCELS) {
        if (!s.parcels.includes(p.id)) continue
        for (const sp of p.spots) {
          if (sp.kind !== 'plot' && sp.kind !== 'bed') continue
          harvest(s, sp.id, t)
          if (plotPhase(s, sp.id, t) === 'empty') {
            // the best plant of the kind that is open and whose goods are not piled up
            const crops = (CROP_IDS as CropId[]).filter((c) => CROPS[c].kind === sp.kind && s.level >= CROPS[c].level)
            const asked = crops.find((c) => s.orders.some((o) => o?.lines.some((l) => l.good === c && s.inv[c] < l.n)))
            const lowGrain = crops.find((c) => GRAIN.includes(c) && s.inv[c] < 24)
            const pick = asked ?? lowGrain ?? crops.filter((c) => room(s, GOODS[c].store) > 12 && s.inv[c] < 30).pop() ?? crops[0]
            if (pick) plant(s, sp.id, pick, t)
          }
        }
      }
      // buy land, workshops, animals
      for (const p of PARCELS) if (!s.parcels.includes(p.id)) buyParcel(s, p.id)
      for (const b of BUILDING_IDS) build(s, b)
      for (const a of ANIMAL_IDS) {
        buyAnimal(s, a)
        for (let i = 0; i < 4; i++) {
          collectAnimal(s, a, i, t)
          feed(s, a, i, t)
        }
      }
      // fill orders, otherwise make what an order asks for
      for (let i = 0; i < s.orders.length; i++) if (s.orders[i] && canFill(s, s.orders[i]!)) fillOrder(s, i, t)
      for (const b of BUILDING_IDS) collectJobs(s, b as BuildingId, t)
      for (const o of s.orders) {
        if (!o) continue
        for (const l of o.lines) {
          const rid = (RECIPE_IDS as string[]).includes(l.good) ? (l.good as (typeof RECIPE_IDS)[number]) : null
          if (rid && s.inv[l.good] < l.n) enqueue(s, RECIPES[rid].building, rid, t)
        }
      }
      // flour for the bakery orders, and sell what piles up
      if (s.buildings.mill.built && s.inv.flour < 4) enqueue(s, 'mill', 'flour', t)
      for (const g of GOOD_IDS) if (!GRAIN.includes(g) && s.inv[g] > 14 && !s.orders.some((o) => o?.lines.some((l) => l.good === g))) sell(s, g, s.inv[g] - 8)
      // a child sells when a store is nearly full (but in the good years keeps a heap of grain for the lean ones)
      if (room(s, 'granary') < 6) sell(s, s.inv.barley > 10 ? 'barley' : 'wheat', 8)
      if (room(s, 'barn') < 6) {
        const cheap = GOOD_IDS.filter((g) => GOODS[g].store === 'barn' && s.inv[g] > 0).sort((a, b) => GOODS[a].price - GOODS[b].price)[0]
        if (cheap) sell(s, cheap, s.inv[cheap])
      }
      // stores
      if (s.coins > 400) {
        upgradeStore(s, 'barn')
        upgradeStore(s, 'granary')
        for (const b of BUILDING_IDS) upgradeBuilding(s, b)
      }
      drainEvents(s)
    }
    return t
  }

  it('reaches a high level in a few hours of play, with all the rules working (no coin or level breaks)', () => {
    const s = newState(2026, T0)
    const t = bot(s, T0, 40)
    expect(s.level).toBeGreaterThanOrEqual(10)
    expect(stat(s, 'ordersDone')).toBeGreaterThan(25)
    // a bot plays much faster than a child (it never waits for a finger), a child needs about three times as long
    expect(s.level).toBeLessThan(30)
    bot(s, t, 80)
    expect(s.level).toBeGreaterThanOrEqual(18)
    expect(s.coins).toBeGreaterThanOrEqual(0)
    for (const g of GOOD_IDS) expect(s.inv[g]).toBeGreaterThanOrEqual(0)
    expect(s.chapterStars.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(8)
    expect(stat(s, 'yearsDone')).toBeGreaterThanOrEqual(6)
  })

  it('is not stuck: at every step of the first levels something can be done (a plot, an order or a purchase)', () => {
    const s = newState(77, T0)
    let t = T0
    let level = 1
    for (let i = 0; i < 60 * 25; i++) {
      t = bot(s, t, 1 / 30, 2)
      if (s.level > level) level = s.level
    }
    expect(level).toBeGreaterThanOrEqual(5)
  })

  it('every order that appears on the board can be filled by the bot sooner or later (the first ten levels)', () => {
    const s = newState(31, T0)
    bot(s, T0, 60)
    const seen = new Set<string>()
    for (const o of s.orders) if (o) for (const l of o.lines) seen.add(l.good)
    expect(s.level).toBeGreaterThanOrEqual(8)
    expect(seen.size).toBeGreaterThan(0)
  })
})
