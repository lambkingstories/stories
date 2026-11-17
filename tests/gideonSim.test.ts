/**
 * "Gideons Nacht": the rules and the physics (utils/gideonSim.ts). The structures stand, a jar that hits something breaks and startles the guards nearby,
 * the stone jar goes through wood, the trumpet blows things away and startles every guard in reach, the torch jar lights up its reach, the call of Gideon
 * splits into three, the same shots give the same game, and a round is won when every guard has run away.
 */
import { describe, expect, it } from 'vitest'
import { AMMO, BLAST_R, CATAPULT, LIGHT_R, MAX_PULL, SETTLE_STEPS, Sim, launchVelocity, playShots, previewPath, pullToShot, type LevelDef } from '../src/utils/gideonSim'

const base: LevelDef = {
  width: 40,
  wind: 0,
  ammo: ['krug', 'krug', 'krug', 'krug'],
  par: 1,
  parts: [],
  guards: [{ x: 24, y: 0, kind: 0 }]
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
  { m: 'wood', x: 24, y: 1, w: 0.5, h: 2 },
  { m: 'wood', x: 27, y: 1, w: 0.5, h: 2 },
  { m: 'wood', x: 25.5, y: 2.2, w: 3.8, h: 0.4 }
]

describe('the world', () => {
  it('lets a tower stand still after the settling steps, with nobody scared and nothing broken', () => {
    const s = ready({ ...base, parts: tower, guards: [{ x: 25.5, y: 2.4, kind: 1 }] })
    run(s, 240)
    expect(s.status).toBe('play')
    expect(s.scaredCount).toBe(0)
    expect(s.parts.every((p) => !p.dead)).toBe(true)
    for (const p of s.parts) {
      const c = p.body.getPosition()
      expect(Math.hypot(c.x - p.def.x, c.y - p.def.y)).toBeLessThan(0.1)
    }
    expect(s.quiet()).toBe(true)
  })

  it('gives the same game for the same shots', () => {
    const def = { ...base, parts: tower, guards: [{ x: 25.5, y: 2.4, kind: 1 }] }
    const a = playShots(def, [{ a: 15, p: 0.95 }, { a: 30, p: 0.8 }])
    const b = playShots(def, [{ a: 15, p: 0.95 }, { a: 30, p: 0.8 }])
    expect(a.steps).toBe(b.steps)
    expect(a.scaredCount).toBe(b.scaredCount)
    expect(a.parts.map((p) => p.dead)).toEqual(b.parts.map((p) => p.dead))
    expect(a.parts.filter((p) => !p.dead).map((p) => p.body.getPosition().x)).toEqual(b.parts.filter((p) => !p.dead).map((p) => p.body.getPosition().x))
  })
})

describe('the throw', () => {
  it('uses the launch speed of the pull, and the preview follows the same path as the jar', () => {
    const v = launchVelocity(45, 1)
    expect(Math.hypot(v.vx, v.vy)).toBeCloseTo(20, 5)
    expect(pullToShot(-MAX_PULL, 0).p).toBeCloseTo(1, 5)
    expect(pullToShot(-MAX_PULL, 0).a).toBeCloseTo(0, 5)
    expect(pullToShot(-1.2, -1.2).a).toBeCloseTo(45, 5)
    const s = ready({ ...base, guards: [{ x: 60, y: 0, kind: 0 }], width: 70 })
    s.fire(40, 0.7)
    run(s, 60)
    const path = previewPath(40, 0.7, 0, 1, 60)
    const q = s.projs[0]!.body!.getPosition()
    expect(q.x).toBeCloseTo(path[0]!.x, 2)
    expect(q.y).toBeCloseTo(path[0]!.y, 2)
  })

  it('counts the throws, serves the ammunition in order and stops when there is none', () => {
    const s = ready({ ...base, ammo: ['stein', 'krug'] })
    expect(s.nextAmmo).toBe('stein')
    expect(s.fire(45, 0.5)).toBe(true)
    expect(s.nextAmmo).toBe('krug')
    expect(s.fire(45, 0.5)).toBe(true)
    expect(s.fire(45, 0.5)).toBe(false)
    expect(s.used).toBe(2)
  })

  it('does not throw while the level is still settling', () => {
    const s = new Sim(base)
    expect(s.fire(45, 0.5)).toBe(false)
  })
})

describe('jars and structures', () => {
  const bale: LevelDef = { ...base, parts: [{ m: 'straw', x: 22, y: 0.5, w: 1.5, h: 1 }], guards: [{ x: 23.3, y: 0, kind: 0 }] }

  it('breaks the jar on its first hit and startles a guard near the clatter, but not one far from it', () => {
    let near = 0
    let farAway = 0
    for (let a = 5; a <= 40; a += 1) {
      const t = ready({ ...base, guards: [{ x: 24, y: 0, kind: 0 }] })
      t.fire(a, 0.85)
      let spot: { x: number; y: number } | null = null
      for (let i = 0; i < 240; i++) {
        t.step()
        for (const e of t.events) if (e.t === 'klirr') spot = { x: e.x, y: e.y }
        t.events.length = 0
      }
      expect(t.projs[0]!.dead).toBe(true)
      if (!spot) continue
      const d = Math.hypot(spot.x - 24, spot.y - 0.78)
      if (d < 1.5) {
        near++
        expect(t.scaredCount).toBe(1)
        expect(t.status).toBe('won')
      } else if (d > 2.2) {
        farAway++
        expect(t.scaredCount).toBe(0)
      }
    }
    expect(near).toBeGreaterThan(0)
    expect(farAway).toBeGreaterThan(0)
  })

  it('does not hurt a block that only rests (no damage from the weight of a stack)', () => {
    const parts = Array.from({ length: 8 }, (_, i) => ({ m: 'wood' as const, x: 24, y: 0.5 + i, w: 1, h: 1 }))
    const s = ready({ ...base, parts, guards: [{ x: 30, y: 0, kind: 0 }] })
    run(s, 600)
    expect(s.parts.every((p) => !p.dead && p.hp > p.maxHp * 0.99)).toBe(true)
  })

  it('startles a guard who is dropped from a height, but not one who stays', () => {
    const s = ready({ ...base, parts: [{ m: 'wood', x: 25, y: 2.2, w: 3, h: 0.4 }, { m: 'wood', x: 24, y: 1, w: 0.5, h: 2 }, { m: 'wood', x: 26, y: 1, w: 0.5, h: 2 }], guards: [{ x: 25, y: 2.4, kind: 0 }] })
    run(s, 60)
    expect(s.scaredCount).toBe(0)
    s.parts[1]!.body.setLinearVelocity({ x: 8, y: 0 })
    s.parts[2]!.body.setLinearVelocity({ x: 8, y: 0 })
    run(s, 240)
    expect(s.scaredCount).toBe(1)
  })

  it('lets the stone jar go through a wooden plank and keep flying', () => {
    const def: LevelDef = { ...base, ammo: ['stein', 'krug'], parts: [{ m: 'wood', x: 24, y: 1, w: 0.4, h: 2 }], guards: [{ x: 27.5, y: 0, kind: 0 }] }
    let punched = false
    for (let a = 4; a <= 24 && !punched; a += 2) {
      const s = ready(def)
      s.fire(a, 1)
      for (let i = 0; i < 120 && !punched; i++) {
        s.step()
        if (s.parts[0]!.dead) {
          const p = s.projs[0]!
          if (!p.dead && p.body && p.body.getLinearVelocity().x > 10) punched = true
        }
      }
    }
    expect(punched).toBe(true)
  })
})

describe('trumpet, torch jar and the call', () => {
  const far: LevelDef = { ...base, width: 50, ammo: ['posaune', 'fackel', 'ruf', 'krug'], guards: [{ x: 33, y: 0, kind: 0 }, { x: 35.5, y: 0, kind: 1 }, { x: 46, y: 0, kind: 2 }] }

  it('lets the trumpet blow when tapped: guards in reach are startled, the one far away is not, the trumpet is used up', () => {
    const s = ready(far)
    s.fire(45, 0.9)
    for (let i = 0; i < 300 && s.projs[0]!.body!.getPosition().x < 34; i++) s.step()
    expect(s.tappable).toBe(true)
    expect(s.tap()).toBe(true)
    expect(s.projs[0]!.dead).toBe(true)
    expect(s.guards[0]!.scared).toBe(true)
    expect(s.guards[1]!.scared).toBe(true)
    expect(s.guards[2]!.scared).toBe(false)
    expect(s.events.some((e) => e.t === 'blast' && e.r === BLAST_R)).toBe(true)
  })

  it('pushes a block in reach away from the trumpet', () => {
    const s = ready({ ...far, parts: [{ m: 'stone', x: 36.5, y: 0.5, w: 1, h: 1 }] })
    s.fire(45, 0.9)
    for (let i = 0; i < 300 && s.projs[0]!.body!.getPosition().x < 34; i++) s.step()
    const x0 = s.parts[0]!.body.getPosition().x
    s.tap()
    run(s, 20)
    expect(s.parts[0]!.body.getPosition().x).toBeGreaterThan(x0 + 0.1)
  })

  it('lets the torch jar light up when tapped, without any damage to the structures', () => {
    const def: LevelDef = { ...far, ammo: ['fackel', 'krug'], parts: [{ m: 'wood', x: 38.5, y: 0.5, w: 1, h: 1 }] }
    const s = ready(def)
    s.fire(45, 0.9)
    for (let i = 0; i < 300 && s.projs[0]!.body!.getPosition().x < 33; i++) s.step()
    s.tap()
    expect(s.events.some((e) => e.t === 'light' && e.r === LIGHT_R)).toBe(true)
    expect(s.guards[0]!.scared).toBe(true)
    expect(s.guards[2]!.scared).toBe(false)
    expect(s.parts[0]!.hp).toBe(s.parts[0]!.maxHp)
  })

  it('splits the call of Gideon into three jars when tapped', () => {
    const s = ready({ ...far, ammo: ['ruf', 'krug'] })
    s.fire(45, 0.6)
    run(s, 30)
    expect(s.projs.filter((p) => !p.dead)).toHaveLength(1)
    s.tap()
    expect(s.projs.filter((p) => !p.dead)).toHaveLength(3)
    expect(s.tap()).toBe(false)
  })

  it('has a reach that is larger for the trumpet than for the clatter of a jar', () => {
    expect(BLAST_R).toBeGreaterThan(AMMO.krug.klirr)
    expect(LIGHT_R).toBeGreaterThan(AMMO.fackel.klirr)
    expect(CATAPULT.x).toBeLessThan(8)
  })
})

describe('the round', () => {
  it('is won when every guard is startled, with three stars up to the par', () => {
    const def: LevelDef = { ...base, par: 1, parts: [{ m: 'straw', x: 22, y: 0.5, w: 1.5, h: 1 }], guards: [{ x: 23.3, y: 0, kind: 0 }] }
    let won = false
    for (const a of [8, 10, 12, 14, 16, 18, 20]) {
      const s = playShots(def, [{ a, p: 1 }])
      if (s.status === 'won') {
        won = true
        expect(s.used).toBe(1)
        expect(s.stars).toBe(3)
        break
      }
    }
    expect(won).toBe(true)
  })

  it('gives two stars for one throw more and one star for more', () => {
    const s = ready({ ...base, par: 1 })
    expect(s.stars).toBe(0)
    s.used = 2
    s.status = 'won'
    expect(s.stars).toBe(2)
    s.used = 3
    expect(s.stars).toBe(1)
  })

  it('is lost, kindly, when the jars are gone and a guard still stands', () => {
    const s = playShots({ ...base, ammo: ['krug', 'krug'] }, [{ a: 85, p: 0.2 }, { a: 85, p: 0.2 }])
    run(s, 400)
    expect(s.status).toBe('lost')
    expect(s.scaredCount).toBe(0)
  })

  it('lets the wind carry the jar', () => {
    const calm = previewPath(45, 0.7, 0, 1, 80)[0]!
    const windy = previewPath(45, 0.7, 2, 1, 80)[0]!
    expect(windy.x).toBeGreaterThan(calm.x + 0.5)
  })
})
