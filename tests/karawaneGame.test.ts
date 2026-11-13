/**
 * "Karawane über die Dünen": the rules and the physics (ground made from blocks, the vehicle, stamina, coins, stars) and the workshop.
 */
import { describe, expect, it } from 'vitest'
import {
  DT,
  MAX_STARS,
  ROUTES,
  ROUTE_COUNT,
  START_X,
  botInput,
  generateTrack,
  heightAt,
  newRun,
  rng,
  slopeAt,
  starsFor,
  stepRun,
  type Input,
  type Run
} from '../src/utils/karawaneGame'
import { ANIMAL_IDS, UPGRADES, UPGRADE_IDS, addCoins, buyAnimal, buyUpgrade, canBuyUpgrade, fullSave, loadSave, newSave, persist, recordBest, selectAnimal, statsFor, upgradeCost } from '../src/utils/karawaneUpgrades'

function memoryStore(init?: string) {
  const m = new Map<string, string>()
  if (init) m.set('lk-karawane-v1', init)
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

/** Drives for `seconds` with a driver function and returns the seconds driven. */
function drive(r: Run, seconds: number, driver: (r: Run) => Input) {
  let t = 0
  while (r.phase === 'play' && t < seconds) {
    stepRun(r, 1 / 60, driver(r))
    r.events.length = 0
    t += 1 / 60
  }
  return t
}

describe('the routes', () => {
  it('has six routes with growing goals, and three stars each', () => {
    expect(ROUTE_COUNT).toBe(6)
    expect(MAX_STARS).toBe(18)
    for (const r of ROUTES) {
      expect(r.goals[0]).toBeLessThan(r.goals[1])
      expect(r.goals[1]).toBeLessThan(r.goals[2])
      expect(r.goals[2]).toBe(r.length)
    }
    expect(ROUTES.map((r) => r.id)).toEqual(['egypt', 'bethlehem', 'magi', 'jordan', 'judea', 'jerusalem'])
  })

  it('gives one, two or three stars for the metres', () => {
    const g = ROUTES[0]!.goals
    expect(starsFor(0, 0)).toBe(0)
    expect(starsFor(0, g[0] - 1)).toBe(0)
    expect(starsFor(0, g[0])).toBe(1)
    expect(starsFor(0, g[1])).toBe(2)
    expect(starsFor(0, g[2])).toBe(3)
    expect(starsFor(5, 99999)).toBe(3)
  })

  it('makes the same ground every time (with a seed) and another one for another seed', () => {
    const a = generateTrack(2)
    const b = generateTrack(2)
    expect(Array.from(a.h.slice(0, 500))).toEqual(Array.from(b.h.slice(0, 500)))
    expect(a.pickups.length).toBe(b.pickups.length)
    const c = generateTrack(2, 4711)
    expect(Array.from(c.h.slice(0, 2000))).not.toEqual(Array.from(a.h.slice(0, 2000)))
    const r = rng(7)
    const x = [r(), r(), r()]
    const r2 = rng(7)
    expect([r2(), r2(), r2()]).toEqual(x)
  })

  it('always builds a way that can be driven: no holes or walls, a flat start, oases and a flat finish', () => {
    for (let i = 0; i < ROUTE_COUNT; i++) {
      for (const seed of [undefined, 1, 2, 3]) {
        const t = generateTrack(i, seed)
        // no steeper than the ramps (tan 40 degrees) anywhere
        expect(t.maxSlope).toBeLessThan(Math.tan((40 * Math.PI) / 180))
        for (let k = 1; k < t.h.length; k++) expect(Number.isFinite(t.h[k])).toBe(true)
        // the start is flat
        expect(Math.abs(heightAt(t, 2) - heightAt(t, START_X + 4))).toBeLessThan(0.05)
        // the finish is flat around its gate
        expect(Math.abs(heightAt(t, t.finishX - 6) - heightAt(t, t.finishX + 18))).toBeLessThan(0.3)
        expect(t.finishX).toBeGreaterThan(ROUTES[i]!.length - 30)
        expect(t.finishX).toBe(ROUTES[i]!.length)
        // oases lie on flat ground
        expect(t.oases.length).toBeGreaterThanOrEqual(2)
        for (const o of t.oases) expect(Math.abs(slopeAt(t, o))).toBeLessThan(0.08)
        // the height stays in a sane range
        for (let x = 0; x < ROUTES[i]!.length; x += 5) expect(Math.abs(heightAt(t, x))).toBeLessThan(ROUTES[i]!.relief * 1.6 + 30)
      }
    }
  })

  it('starts gently: the first 150 metres are not steep', () => {
    for (let i = 0; i < ROUTE_COUNT; i++) {
      const t = generateTrack(i)
      let worst = 0
      for (let x = START_X; x < 150; x += 0.5) worst = Math.max(worst, Math.abs(slopeAt(t, x)))
      expect(Math.atan(worst)).toBeLessThan((18 * Math.PI) / 180)
    }
  })

  it('puts pickups of every kind on the way, in order, never behind the finish', () => {
    const t = generateTrack(0)
    const kinds = new Set(t.pickups.map((p) => p.kind))
    expect(kinds.has('coin')).toBe(true)
    expect(kinds.has('date')).toBe(true)
    expect(kinds.has('skin')).toBe(true)
    for (let k = 1; k < t.pickups.length; k++) expect(t.pickups[k]!.x).toBeGreaterThanOrEqual(t.pickups[k - 1]!.x)
    expect(t.pickups[t.pickups.length - 1]!.x).toBeLessThan(t.finishX + 1)
    for (const p of t.pickups) expect(p.y).toBeGreaterThan(heightAt(t, p.x) - 0.5)
    expect(t.decor.length).toBeGreaterThan(20)
  })
})

describe('the vehicle', () => {
  const stats = statsFor(newSave())

  it('stands still on the flat start and settles on its springs', () => {
    const r = newRun(generateTrack(0), stats)
    expect(r.phase).toBe('play')
    expect(r.rear.contact).toBe(true)
    expect(r.front.contact).toBe(true)
    drive(r, 2, () => ({ gas: false, brake: false }))
    expect(Math.abs(r.vx)).toBeLessThan(0.2)
    expect(Math.abs(r.a)).toBeLessThan(0.15)
    expect(r.phase).toBe('play')
  })

  it('drives forward with gas, reverses with brake', () => {
    const r = newRun(generateTrack(0), stats)
    drive(r, 3, () => ({ gas: true, brake: false }))
    expect(r.vx).toBeGreaterThan(4)
    expect(r.x).toBeGreaterThan(START_X + 8)
    const b = newRun(generateTrack(0), stats)
    drive(b, 2, () => ({ gas: false, brake: true }))
    expect(b.x).toBeLessThan(START_X - 2)
  })

  it('is deterministic: the same inputs give the same ride', () => {
    const a = newRun(generateTrack(1), stats)
    const b = newRun(generateTrack(1), stats)
    const drv = (r: Run) => ({ gas: Math.floor(r.t * 2) % 3 !== 0, brake: false })
    drive(a, 20, drv)
    drive(b, 20, drv)
    expect(a.x).toBe(b.x)
    expect(a.y).toBe(b.y)
    expect(a.a).toBe(b.a)
  })

  it('uses up stamina, and a skin of water or an oasis fills it', () => {
    const t = generateTrack(0)
    const r = newRun(t, stats)
    r.stamina = 0.3
    const skin = t.pickups.find((p) => p.kind === 'skin')!
    r.x = skin.x
    r.y = skin.y
    r.taken.fill(0)
    stepRun(r, DT * 2, { gas: false, brake: false })
    expect(r.stamina).toBeGreaterThan(0.55)
    const o = newRun(t, stats)
    o.stamina = 0.2
    o.x = t.oases[0]!
    o.y = heightAt(t, o.x) + 1
    stepRun(o, DT * 3, { gas: false, brake: false })
    expect(o.stamina).toBeGreaterThan(0.99)
    expect(o.checkpoint).toBe(t.oases[0])
    expect(o.events.some((e) => e.type === 'oasis')).toBe(true)
    // and it runs down with time and gas
    const d = newRun(t, stats)
    d.taken.fill(1)
    drive(d, 10, () => ({ gas: true, brake: false }))
    expect(d.stamina).toBeLessThan(0.85)
    const idle = newRun(t, stats)
    drive(idle, 10, () => ({ gas: false, brake: false }))
    expect(idle.stamina).toBeGreaterThan(d.stamina)
  })

  it('collects coins (more with a better tarp) and keeps them', () => {
    const t = generateTrack(0)
    const coin = t.pickups.find((p) => p.kind === 'coin')!
    const get = (cover: number) => {
      const s = newSave()
      s.up.cover = cover
      const r = newRun(t, statsFor(s))
      r.taken.fill(0)
      r.x = coin.x
      r.y = coin.y
      stepRun(r, DT * 2, { gas: false, brake: false })
      return r.coins
    }
    expect(get(0)).toBe(5)
    expect(get(4)).toBe(10)
  })

  it('ends the round when the jars touch the ground (turned over), kindly', () => {
    const r = newRun(generateTrack(0), stats)
    r.a = Math.PI * 0.9
    r.y += 2
    drive(r, 4, () => ({ gas: false, brake: false }))
    expect(r.phase).toBe('crash')
    expect(['load', 'animal']).toContain(r.crashKind)
  })

  it('gas in the air lifts the nose, brake lowers it', () => {
    const t = generateTrack(0)
    const up = newRun(t, stats)
    up.y += 6
    for (let i = 0; i < 40; i++) stepRun(up, 1 / 60, { gas: true, brake: false })
    const down = newRun(t, stats)
    down.y += 6
    for (let i = 0; i < 40; i++) stepRun(down, 1 / 60, { gas: false, brake: true })
    expect(up.a).toBeGreaterThan(0.2)
    expect(down.a).toBeLessThan(-0.2)
  })

  it('a tired animal that stands still ends the round', () => {
    const r = newRun(generateTrack(0), stats)
    r.stamina = 0
    drive(r, 6, () => ({ gas: true, brake: false }))
    expect(r.phase).toBe('tired')
  })

  it('a bot drives the first route to the finish on the plain cart, without a fall', () => {
    const r = newRun(generateTrack(0), statsFor(newSave()))
    drive(r, 300, botInput)
    expect(r.phase).toBe('won')
    expect(r.meters).toBeGreaterThan(ROUTES[0]!.length - 30)
  })

  it('a bot with the best parts drives every route to the finish', () => {
    for (let i = 0; i < ROUTE_COUNT; i++) {
      const r = newRun(generateTrack(i), statsFor(fullSave()))
      drive(r, 400, botInput)
      expect(r.phase, `route ${i}`).toBe('won')
    }
  })

  it('goes on from an oasis with full stamina and the metres counted on', () => {
    const t = generateTrack(0)
    const r = newRun(t, stats, t.oases[0])
    expect(r.x).toBe(t.oases[0])
    expect(r.meters).toBeCloseTo(t.oases[0]! - START_X, 1)
    expect(r.stamina).toBe(1)
    expect(r.phase).toBe('play')
  })

  it('never leaves the start backwards', () => {
    const r = newRun(generateTrack(0), stats)
    drive(r, 10, () => ({ gas: false, brake: true }))
    expect(r.x).toBeGreaterThanOrEqual(2)
  })
})

describe('the workshop', () => {
  it('starts empty, with a donkey, and costs more for each step', () => {
    const s = newSave()
    expect(s.coins).toBe(0)
    expect(s.owned).toEqual(['donkey'])
    for (const id of UPGRADE_IDS) {
      const c = UPGRADES[id].costs
      expect(c.length).toBe(UPGRADES[id].max)
      for (let i = 1; i < c.length; i++) expect(c[i]!).toBeGreaterThan(c[i - 1]!)
      expect(UPGRADES[id].max).toBeGreaterThanOrEqual(4)
    }
  })

  it('buys a part only with enough coins, takes the coins, and stops at the top', () => {
    const s = newSave()
    expect(buyUpgrade(s, 'wheels')).toBe(false)
    expect(canBuyUpgrade(s, 'wheels')).toBe(false)
    s.coins = 10000
    for (let i = 0; i < UPGRADES.wheels.max; i++) expect(buyUpgrade(s, 'wheels')).toBe(true)
    expect(s.up.wheels).toBe(UPGRADES.wheels.max)
    expect(buyUpgrade(s, 'wheels')).toBe(false)
    expect(upgradeCost(s, 'wheels')).toBeNull()
    expect(s.coins).toBe(10000 - UPGRADES.wheels.costs.reduce((a, b) => a + b, 0))
  })

  it('every part changes how the cart drives', () => {
    const base = statsFor(newSave())
    const s = newSave()
    s.up.wheels = 5
    expect(statsFor(s).mu).toBeGreaterThan(base.mu)
    expect(statsFor(s).wheelR).toBeGreaterThan(base.wheelR)
    const f = newSave()
    f.up.suspension = 5
    expect(statsFor(f).zeta).toBeGreaterThan(base.zeta)
    expect(statsFor(f).travel).toBeGreaterThan(base.travel)
    expect(statsFor(f).K).toBeGreaterThan(base.K)
    const w = newSave()
    w.up.water = 5
    expect(statsFor(w).staminaSec).toBeGreaterThan(base.staminaSec + 40)
    const c = newSave()
    c.up.cover = 4
    expect(statsFor(c).coinMult).toBeCloseTo(2, 5)
  })

  it('buys animals with different strengths and takes the new one at once', () => {
    const s = newSave()
    expect(buyAnimal(s, 'ox')).toBe(false)
    s.coins = 5000
    expect(buyAnimal(s, 'ox')).toBe(true)
    expect(s.animal).toBe('ox')
    expect(buyAnimal(s, 'ox')).toBe(false)
    expect(selectAnimal(s, 'camel')).toBe(false)
    expect(buyAnimal(s, 'camel')).toBe(true)
    expect(selectAnimal(s, 'donkey')).toBe(true)
    const stats = ANIMAL_IDS.map((a) => {
      const x = newSave()
      x.owned = [...ANIMAL_IDS]
      x.animal = a
      return statsFor(x)
    })
    // the ox is the strongest and the slowest, the camel the fastest
    expect(stats[1]!.power).toBeGreaterThan(stats[0]!.power)
    expect(stats[1]!.vmax).toBeLessThan(stats[0]!.vmax)
    expect(stats[2]!.vmax).toBeGreaterThan(stats[0]!.vmax)
    expect(stats[1]!.staminaSec).toBeGreaterThan(stats[0]!.staminaSec)
  })

  it('keeps the record of every route and says when it is a new one', () => {
    const s = newSave()
    expect(recordBest(s, 2, 300)).toBe(true)
    expect(recordBest(s, 2, 250)).toBe(false)
    expect(recordBest(s, 2, 301.9)).toBe(true)
    expect(s.best[2]).toBe(301)
    expect(s.best[0]).toBe(0)
  })

  it('keeps coins and rounds, and saves and loads on the device', () => {
    const store = memoryStore()
    const s = newSave()
    addCoins(s, 120)
    s.up.water = 2
    buyAnimal(s, 'ox')
    s.coins = 30
    recordBest(s, 1, 444)
    persist(s, store)
    const l = loadSave(store)
    expect(l.coins).toBe(30)
    expect(l.up.water).toBe(2)
    expect(l.best[1]).toBe(444)
    expect(l.rounds).toBe(1)
    expect(l.earned).toBe(120)
  })

  it('survives a broken or foreign save', () => {
    expect(loadSave(memoryStore('not json')).coins).toBe(0)
    expect(loadSave(memoryStore('{"v":2,"coins":99}')).coins).toBe(0)
    const l = loadSave(memoryStore(JSON.stringify({ v: 1, coins: -5, up: { wheels: 99, water: 'x' }, owned: ['camel', 'dragon'], animal: 'dragon', best: [10, 'a'] })))
    expect(l.coins).toBe(0)
    expect(l.up.wheels).toBe(UPGRADES.wheels.max)
    expect(l.up.water).toBe(0)
    expect(l.owned).toEqual(['donkey', 'camel'])
    expect(l.animal).toBe('donkey')
    expect(l.best).toEqual([10, 0])
  })
})
