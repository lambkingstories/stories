/**
 * "Josefs Kornspeicher": the rules and the physics (utils/kornspeicherSim.ts). The structures stand, a granary is full when the grain in it reaches its mark
 * (a sack, a sheaf of wheat), a sack that falls into the Nile is lost, a long beam snaps in two, a crate that is pushed away pays points, every kind of sack
 * has its ability (heavy sack: plunge, ears: split in three, barrel: push, air bag: swell up and float), nothing is catapulted away, the same shots give the same
 * game, and a round is won when every granary is full.
 */
import { describe, expect, it } from 'vitest'
import { AMMO, CATAPULT, MATS, MAX_PULL, SETTLE_STEPS, Sim, launchVelocity, playShots, previewPath, pullToShot, type LevelDef } from '../src/utils/kornspeicherSim'

const base: LevelDef = {
  width: 40,
  wind: 0,
  ammo: ['sack', 'sack', 'sack', 'sack'],
  par: 1,
  parts: [],
  silos: [{ x: 24, y: 0, w: 3, h: 2.3, need: 1 }]
}
function ready(def: LevelDef): Sim {
  const s = new Sim(def)
  for (let i = 0; i < SETTLE_STEPS + 2; i++) s.step()
  s.events.length = 0
  return s
}
function run(s: Sim, steps: number) {
  for (let i = 0; i < steps; i++) s.step()
}
const tower: LevelDef['parts'] = [
  { m: 'wood', x: 30, y: 1, w: 0.5, h: 2 },
  { m: 'wood', x: 33, y: 1, w: 0.5, h: 2 },
  { m: 'wood', x: 31.5, y: 2.2, w: 3.8, h: 0.4 }
]
/** The first throw at one of many angles (full power, no tap) that wins the level (or null). */
function findWin(def: LevelDef, powers = [1, 0.9, 0.8]): { a: number; p: number } | null {
  for (const p of powers) for (let a = 6; a <= 80; a += 1) if (playShots(def, [{ a, p }]).status === 'won') return { a, p }
  return null
}

describe('the world', () => {
  it('lets a tower stand still after the settling steps, with nothing broken and no granary full', () => {
    const s = ready({ ...base, parts: tower })
    run(s, 240)
    expect(s.status).toBe('play')
    expect(s.parts.every((p) => !p.dead)).toBe(true)
    for (const p of s.parts) {
      const c = p.body.getPosition()
      expect(Math.hypot(c.x - p.def.x, c.y - p.def.y)).toBeLessThan(0.1)
    }
    expect(s.doneCount).toBe(0)
    expect(s.quiet()).toBe(true)
    expect(s.score).toBe(0)
  })

  it('gives the same game for the same shots', () => {
    const def = { ...base, parts: tower, ammo: ['schwer', 'aehren', 'sack'] as LevelDef['ammo'] }
    const a = playShots(def, [{ a: 20, p: 0.95 }, { a: 30, p: 0.8, tap: 0.6 }])
    const b = playShots(def, [{ a: 20, p: 0.95 }, { a: 30, p: 0.8, tap: 0.6 }])
    expect(a.steps).toBe(b.steps)
    expect(a.score).toBe(b.score)
    expect(a.parts.map((p) => p.dead)).toEqual(b.parts.map((p) => p.dead))
    expect(a.projs.filter((p) => !p.dead).map((p) => p.body!.getPosition().x)).toEqual(b.projs.filter((p) => !p.dead).map((p) => p.body!.getPosition().x))
  })

  it('has materials with their own weight and strength (crate < wood < clay < stone)', () => {
    expect(MATS.crate.hp).toBeLessThan(MATS.wood.hp)
    expect(MATS.wood.hp).toBeLessThan(MATS.stone.hp)
    expect(MATS.clay.density).toBeGreaterThan(MATS.wood.density)
    expect(MATS.stone.density).toBeGreaterThan(MATS.clay.density)
    expect(MATS.crate.armor).toBeLessThan(MATS.wood.armor)
  })

  it('has five different sacks, the heavy one heaviest, the bundle of ears worth a bundle', () => {
    expect(Object.keys(AMMO).sort()).toEqual(['aehren', 'fass', 'luft', 'sack', 'schwer'])
    const mass = (k: keyof typeof AMMO) => (AMMO[k].circle ? Math.PI * AMMO[k].hw ** 2 : 4 * AMMO[k].hw * AMMO[k].hh) * AMMO[k].density
    expect(mass('schwer')).toBeGreaterThan(mass('sack') * 2)
    expect(AMMO.aehren.grain).toBeGreaterThan(AMMO.sack.grain)
  })
})

describe('the throw', () => {
  it('uses the launch speed of the pull, and the preview follows the same path as the sack', () => {
    const v = launchVelocity(45, 1)
    expect(Math.hypot(v.vx, v.vy)).toBeCloseTo(20, 5)
    expect(pullToShot(-MAX_PULL, 0).p).toBeCloseTo(1, 5)
    expect(pullToShot(-MAX_PULL, 0).a).toBeCloseTo(0, 5)
    expect(pullToShot(-1.2, -1.2).a).toBeCloseTo(45, 5)
    const s = ready({ ...base, silos: [{ x: 60, y: 0, w: 3, h: 2.3, need: 1 }], width: 70 })
    s.fire(40, 0.7)
    run(s, 60)
    const path = previewPath(40, 0.7, 0, 1, 60)
    const q = s.projs[0]!.body!.getPosition()
    expect(q.x).toBeCloseTo(path[0]!.x, 2)
    expect(q.y).toBeCloseTo(path[0]!.y, 2)
  })

  it('counts the throws, serves the ammunition in order and stops when there is none', () => {
    const s = ready({ ...base, ammo: ['schwer', 'sack'] })
    expect(s.nextAmmo).toBe('schwer')
    expect(s.fire(45, 0.5)).toBe(true)
    expect(s.nextAmmo).toBe('sack')
    expect(s.fire(45, 0.5)).toBe(true)
    expect(s.fire(45, 0.5)).toBe(false)
    expect(s.used).toBe(2)
  })

  it('does not throw while the level is still settling', () => {
    const s = new Sim(base)
    expect(s.fire(45, 0.5)).toBe(false)
  })

  it('lets the wind carry the sack', () => {
    const calm = previewPath(45, 0.7, 0, 1, 80)[0]!
    const windy = previewPath(45, 0.7, 2, 1, 80)[0]!
    expect(windy.x).toBeGreaterThan(calm.x + 0.5)
  })
})

describe('the granaries', () => {
  it('is full when a sack lies in it, for a while; the round is won, with points and the bonus for the sacks not used', () => {
    const win = findWin(base)
    expect(win).toBeTruthy()
    const s = playShots(base, [win!])
    expect(s.status).toBe('won')
    expect(s.doneCount).toBe(1)
    expect(s.stars).toBe(3)
    expect(s.score).toBeGreaterThanOrEqual(3000)
    expect(s.bonus).toBe(3 * 10000)
    expect(s.total).toBe(s.score + s.bonus)
  })

  it('does not count a sack that only flies through or bounces out (it has to rest inside)', () => {
    const s = ready({ ...base, silos: [{ x: 24, y: 0, w: 3, h: 2.3, need: 1 }] })
    // a sack that is held in the air above the bin does not count
    s.fire(45, 0.5)
    const b = s.projs[0]!.body!
    b.setTransform({ x: 24, y: 1.2 } as never, 0)
    b.setLinearVelocity({ x: 0, y: 6 } as never)
    b.setGravityScale(0)
    run(s, 30)
    expect(s.silos[0]!.fill).toBe(0)
    expect(s.doneCount).toBe(0)
  })

  it('needs as much grain as the mark says: one sack is not enough for two', () => {
    const def: LevelDef = { ...base, silos: [{ x: 24, y: 0, w: 3, h: 2.3, need: 2 }], ammo: ['sack', 'sack', 'sack', 'sack', 'sack'] }
    const one = findWin({ ...base, silos: def.silos, ammo: def.ammo })
    expect(one).toBeNull()
  })

  it('counts a sheaf of wheat that stands in the bin like a sack', () => {
    const def: LevelDef = { ...base, ammo: ['sack'], parts: [{ m: 'straw', x: 24, y: 0.55, w: 0.9, h: 1.1, grain: true }] }
    const s = ready(def)
    run(s, 80)
    expect(s.silos[0]!.fill).toBeCloseTo(1, 5)
    expect(s.doneCount).toBe(1)
    expect(s.status).toBe('won')
  })

  it('loses a sack that falls into the Nile, and takes a crate with it', () => {
    const def: LevelDef = { ...base, water: [{ x0: 10, x1: 16 }], parts: [{ m: 'crate', x: 12, y: 0.5, w: 1, h: 1 }] }
    const s = ready(def)
    run(s, 80)
    // the crate stood over the river: it falls in and is gone
    expect(s.parts[0]!.dead).toBe(true)
    s.fire(45, 0.45)
    const splash = () => s.events.some((e) => e.t === 'splash')
    let seen = false
    for (let i = 0; i < 240 && !seen; i++) {
      s.step()
      seen = splash()
    }
    expect(seen).toBe(true)
    expect(s.projs[0]!.dead).toBe(true)
  })
})

describe('structures', () => {
  it('does not hurt a block that only rests (no damage from the weight of a stack)', () => {
    const parts = Array.from({ length: 8 }, (_, i) => ({ m: 'crate' as const, x: 30, y: 0.5 + i, w: 1, h: 1 }))
    const s = ready({ ...base, parts })
    run(s, 600)
    expect(s.parts.every((p) => !p.dead && p.hp > p.maxHp * 0.99)).toBe(true)
  })

  it('lets the heavy sack go through a wooden plank and keep flying', () => {
    const def: LevelDef = { ...base, ammo: ['schwer', 'sack'], parts: [{ m: 'wood', x: 20, y: 1, w: 0.4, h: 2 }] }
    let punched = false
    for (let a = 4; a <= 24 && !punched; a += 2) {
      const s = ready(def)
      s.fire(a, 1)
      for (let i = 0; i < 120 && !punched; i++) {
        s.step()
        if (s.parts[0]!.dead) {
          const p = s.projs[0]!
          if (!p.dead && p.body && p.body.getLinearVelocity().x > 8) punched = true
        }
      }
    }
    expect(punched).toBe(true)
  })

  it('snaps a long wooden beam in two pieces that fall on, and pays points', () => {
    const def: LevelDef = { ...base, ammo: ['schwer'], parts: [{ m: 'wood', x: 20, y: 0.25, w: 3, h: 0.5 }] }
    let snapped = false
    for (let a = 4; a <= 40 && !snapped; a += 1) {
      const s = ready(def)
      s.fire(a, 1)
      for (let i = 0; i < 150 && !s.parts.some((p) => p.dead); i++) s.step()
      if (s.parts.some((p) => p.dead)) {
        const pieces = s.parts.filter((p) => p.half && !p.dead)
        expect(pieces).toHaveLength(2)
        expect(pieces.every((p) => p.def.w < 1.6)).toBe(true)
        expect(s.score).toBeGreaterThanOrEqual(MATS.wood.pts)
        snapped = true
      }
    }
    expect(snapped).toBe(true)
  })

  it('pays a few points once for a crate that is pushed away from its place', () => {
    const def: LevelDef = { ...base, ammo: ['sack'], parts: [{ m: 'crate', x: 20, y: 0.5, w: 1, h: 1 }] }
    let paid = false
    for (let a = 4; a <= 40 && !paid; a += 2) {
      const s = ready(def)
      s.fire(a, 0.9)
      run(s, 240)
      if (s.parts[0]!.moved && !s.parts[0]!.dead) {
        expect(s.score).toBe(150)
        paid = true
      }
    }
    expect(paid).toBe(true)
  })
})

describe('the abilities (a tap in the air)', () => {
  it('gives the plain sack no ability: a tap does nothing', () => {
    const s = ready(base)
    s.fire(45, 0.7)
    run(s, 20)
    expect(s.tappable).toBe(false)
    expect(s.tap()).toBe(false)
  })

  it('lets the heavy sack plunge: it falls much faster downward after the tap, and only once', () => {
    const s = ready({ ...base, ammo: ['schwer'] })
    s.fire(50, 0.7)
    run(s, 25)
    expect(s.tappable).toBe(true)
    const before = s.projs[0]!.body!.getLinearVelocity().y
    expect(s.tap()).toBe(true)
    expect(s.projs[0]!.body!.getLinearVelocity().y).toBeLessThan(Math.min(before, 0) - 8)
    expect(s.events.some((e) => e.t === 'slam')).toBe(true)
    expect(s.tap()).toBe(false)
  })

  it('splits the bundle of ears into three small bundles, each worth a third', () => {
    const s = ready({ ...base, ammo: ['aehren', 'sack'] })
    s.fire(45, 0.6)
    run(s, 30)
    expect(s.projs.filter((p) => !p.dead)).toHaveLength(1)
    expect(s.tap()).toBe(true)
    const live = s.projs.filter((p) => !p.dead)
    expect(live).toHaveLength(3)
    expect(live.every((p) => p.piece)).toBe(true)
    expect(live.reduce((n, p) => n + p.grain, 0)).toBeCloseTo(AMMO.aehren.grain, 5)
    expect(s.tap()).toBe(false)
  })

  it('gives the barrel a push forward', () => {
    const s = ready({ ...base, ammo: ['fass'] })
    s.fire(45, 0.6)
    run(s, 20)
    const vx = s.projs[0]!.body!.getLinearVelocity().x
    s.tap()
    expect(s.projs[0]!.body!.getLinearVelocity().x).toBeGreaterThan(vx + 4)
    expect(s.events.some((e) => e.t === 'boost')).toBe(true)
  })

  it('lets the air bag swell up and float for a moment, then become small again', () => {
    const s = ready({ ...base, ammo: ['luft'] })
    s.fire(60, 0.7)
    run(s, 20)
    const r0 = s.projs[0]!.body!.getFixtureList()!.getShape().getRadius()
    s.tap()
    const body = s.projs[0]!.body!
    expect(body.getFixtureList()!.getShape().getRadius()).toBeGreaterThan(r0 + 0.1)
    expect(body.getGravityScale()).toBeLessThan(0.5)
    run(s, 120)
    expect(body.getGravityScale()).toBe(1)
  })

  it('keeps the swollen bag higher in the air than the same throw without the tap', () => {
    const height = (tap?: number) => {
      const s = ready({ ...base, width: 60, ammo: ['luft'], silos: [{ x: 55, y: 0, w: 3, h: 2.3, need: 1 }] })
      s.fire(55, 0.7, tap)
      run(s, 140)
      return s.projs[0]!.body!.getPosition().y
    }
    expect(height(0.4)).toBeGreaterThan(height() + 1)
  })
})

describe('nothing is catapulted away', () => {
  it('keeps every block that was not thrown below the speed caps while a tower falls apart', () => {
    const parts: LevelDef['parts'] = []
    for (let i = 0; i < 6; i++) parts.push({ m: 'stone', x: 28, y: 0.5 + i, w: 1, h: 1 }, { m: 'crate', x: 30, y: 0.5 + i, w: 1, h: 1 })
    const s = ready({ ...base, ammo: ['schwer', 'fass'], parts })
    s.fire(30, 1)
    let maxUp = 0
    let maxSpeed = 0
    for (let i = 0; i < 360; i++) {
      if (i === 40) s.fire(40, 0.9, 0.3)
      s.step()
      for (let b = s.world.getBodyList(); b; b = b.getNext()) {
        if (!b.isDynamic()) continue
        const ud = b.getUserData() as { kind: string } | null
        if (ud?.kind === 'proj') continue
        const v = b.getLinearVelocity()
        maxUp = Math.max(maxUp, v.y)
        maxSpeed = Math.max(maxSpeed, Math.hypot(v.x, v.y))
      }
    }
    expect(maxUp).toBeLessThanOrEqual(12.01)
    expect(maxSpeed).toBeLessThanOrEqual(26.01)
  })

  it('lets everything go to sleep after the crash (no steady jiggling)', () => {
    const s = ready({ ...base, ammo: ['schwer'], parts: tower })
    s.fire(15, 1)
    run(s, 60 * 12)
    expect(s.quiet()).toBe(true)
  })
})

describe('the round', () => {
  it('gives two stars for one throw more and one star for more', () => {
    const s = ready({ ...base, par: 1 })
    expect(s.stars).toBe(0)
    s.used = 2
    s.status = 'won'
    expect(s.stars).toBe(2)
    s.used = 3
    expect(s.stars).toBe(1)
  })

  it('is lost, kindly, when the sacks are gone and a granary is not full', () => {
    const s = playShots({ ...base, ammo: ['sack', 'sack'] }, [{ a: 85, p: 0.2 }, { a: 85, p: 0.2 }])
    run(s, 400)
    expect(s.status).toBe('lost')
    expect(s.doneCount).toBe(0)
  })

  it('has a catapult close to the left edge', () => {
    expect(CATAPULT.x).toBeLessThan(8)
  })
})
