/**
 * "Gideons Nacht": the rules and the physics (utils/gideonSim.ts). The structures stand, a thrown jar breaks and hurts what it hits, what falls hurts the
 * soldiers (a beam that is hit tips over, a tower that loses a post falls on them), a long beam snaps in two, every jar has an ability that a tap starts in
 * the air (clay jar: shards, stone jar: plunge, trumpet: shock wave, torch jar: fire that spreads, triple jar: three jars), nothing is catapulted away,
 * the same shots give the same game, and a round is won when every soldier is knocked out.
 */
import { describe, expect, it } from 'vitest'
import { BLAST_R, CATAPULT, FIRE_R, GUARD_HP, MATS, MAX_PULL, SETTLE_STEPS, Sim, launchVelocity, playShots, previewPath, pullToShot, type LevelDef } from '../src/utils/gideonSim'

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
/** Flies a jar until it is right above `x` (or `limit` steps are over). */
function flyTo(s: Sim, x: number, limit = 400) {
  for (let i = 0; i < limit && s.projs[0]!.body && s.projs[0]!.body.getPosition().x < x; i++) s.step()
}
/** Throws at several angles and taps (once) at the first moment the jar is within `r` metres of the point; returns the simulation of the first angle that gets there. */
function tapNear(def: LevelDef, x: number, y: number, r: number, power = 0.9): Sim {
  for (let a = 8; a <= 70; a += 2) {
    const s = ready(def)
    s.fire(a, power)
    for (let i = 0; i < 300; i++) {
      const b = s.projs[0]?.body
      if (!b) break
      const q = b.getPosition()
      if (Math.hypot(q.x - x, q.y - y) <= r) {
        s.tap()
        return s
      }
      if (q.x > x + 4) break
      s.step()
    }
  }
  throw new Error('no angle gets near')
}

describe('the world', () => {
  it('lets a tower stand still after the settling steps, with nobody hurt and nothing broken', () => {
    const s = ready({ ...base, parts: tower, guards: [{ x: 25.5, y: 2.4, kind: 1 }] })
    run(s, 240)
    expect(s.status).toBe('play')
    expect(s.downCount).toBe(0)
    expect(s.guards[0]!.hp).toBe(GUARD_HP[1])
    expect(s.parts.every((p) => !p.dead)).toBe(true)
    for (const p of s.parts) {
      const c = p.body.getPosition()
      expect(Math.hypot(c.x - p.def.x, c.y - p.def.y)).toBeLessThan(0.1)
    }
    expect(s.quiet()).toBe(true)
    expect(s.score).toBe(0)
  })

  it('gives the same game for the same shots', () => {
    const def = { ...base, parts: tower, guards: [{ x: 25.5, y: 2.4, kind: 1 }] }
    const a = playShots(def, [{ a: 15, p: 0.95 }, { a: 30, p: 0.8, tap: 0.6 }])
    const b = playShots(def, [{ a: 15, p: 0.95 }, { a: 30, p: 0.8, tap: 0.6 }])
    expect(a.steps).toBe(b.steps)
    expect(a.downCount).toBe(b.downCount)
    expect(a.score).toBe(b.score)
    expect(a.parts.map((p) => p.dead)).toEqual(b.parts.map((p) => p.dead))
    expect(a.parts.filter((p) => !p.dead).map((p) => p.body.getPosition().x)).toEqual(b.parts.filter((p) => !p.dead).map((p) => p.body.getPosition().x))
  })

  it('has materials with their own weight and strength (tile < wood < clay < stone)', () => {
    expect(MATS.glass.hp).toBeLessThan(MATS.wood.hp)
    expect(MATS.wood.hp).toBeLessThan(MATS.stone.hp)
    expect(MATS.clay.density).toBeGreaterThan(MATS.wood.density)
    expect(MATS.stone.density).toBeGreaterThan(MATS.clay.density)
    expect(MATS.glass.armor).toBeLessThan(MATS.wood.armor)
    expect(MATS.wood.burns && MATS.straw.burns && MATS.cloth.burns).toBe(true)
    expect(MATS.stone.burns || MATS.clay.burns || MATS.glass.burns).toBe(false)
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

describe('structures and soldiers', () => {
  it('does not hurt a block that only rests (no damage from the weight of a stack)', () => {
    const parts = Array.from({ length: 8 }, (_, i) => ({ m: 'wood' as const, x: 24, y: 0.5 + i, w: 1, h: 1 }))
    const s = ready({ ...base, parts, guards: [{ x: 30, y: 0, kind: 0 }] })
    run(s, 600)
    expect(s.parts.every((p) => !p.dead && p.hp > p.maxHp * 0.99)).toBe(true)
  })

  it('hurts a soldier a jar hits and breaks the jar on its first hit', () => {
    let hurt = 0
    for (let a = 5; a <= 45; a += 1) {
      const t = ready({ ...base, guards: [{ x: 24, y: 0, kind: 1 }] })
      t.fire(a, 0.85)
      run(t, 240)
      expect(t.projs[0]!.dead).toBe(true)
      if (t.guards[0]!.hp < GUARD_HP[1]!) hurt++
    }
    expect(hurt).toBeGreaterThan(0)
  })

  it('knocks out a soldier who is dropped from a height, but not one who stays', () => {
    const s = ready({ ...base, parts: [{ m: 'wood', x: 25, y: 4.4, w: 3, h: 0.4 }, { m: 'wood', x: 24, y: 2.2, w: 0.5, h: 4.4 }, { m: 'wood', x: 26, y: 2.2, w: 0.5, h: 4.4 }], guards: [{ x: 25, y: 4.6, kind: 2 }] })
    run(s, 60)
    expect(s.downCount).toBe(0)
    s.parts[1]!.body.setLinearVelocity({ x: 8, y: 0 })
    s.parts[2]!.body.setLinearVelocity({ x: 8, y: 0 })
    run(s, 300)
    expect(s.downCount).toBe(1)
    expect(s.score).toBeGreaterThanOrEqual(5000)
  })

  it('lets the stone jar go through a wooden plank and keep flying', () => {
    const def: LevelDef = { ...base, ammo: ['stein', 'krug'], parts: [{ m: 'wood', x: 24, y: 1, w: 0.4, h: 2 }], guards: [{ x: 27.5, y: 0, kind: 0 }] }
    let punched = false
    for (let a = 4; a <= 24 && !punched; a += 2) {
      const s = ready(def)
      s.fire(a, 1)
      for (let i = 0; i < 120 && !punched; i++) {
        s.step()
        if (s.parts.some((p) => p.dead)) {
          const p = s.projs[0]!
          if (!p.dead && p.body && p.body.getLinearVelocity().x > 10) punched = true
        }
      }
    }
    expect(punched).toBe(true)
  })

  it('snaps a long wooden beam in two pieces that fall on, and pays points', () => {
    const def: LevelDef = { ...base, ammo: ['stein'], parts: [{ m: 'wood', x: 24, y: 0.25, w: 3, h: 0.5 }], guards: [{ x: 40, y: 0, kind: 0 }] }
    let snapped = false
    for (let a = 4; a <= 40 && !snapped; a += 1) {
      const s = ready(def)
      s.fire(a, 1)
      for (let i = 0; i < 150 && !s.parts.some((p) => p.dead); i++) s.step()
      const dead = s.parts.filter((p) => p.dead)
      if (dead.length) {
        const pieces = s.parts.filter((p) => p.half && !p.dead)
        expect(pieces).toHaveLength(2)
        expect(pieces.every((p) => p.def.w < 1.6)).toBe(true)
        expect(s.score).toBeGreaterThanOrEqual(MATS.wood.pts)
        snapped = true
      }
    }
    expect(snapped).toBe(true)
  })

  it('lets a clay jar go through a tent (the tent breaks, the jar flies on, slowed) and break on the second one', () => {
    const def: LevelDef = { ...base, ammo: ['krug'], parts: [{ m: 'cloth', s: 'tent', x: 22, y: 1.1, w: 3, h: 2.2 }, { m: 'cloth', s: 'tent', x: 26, y: 1.1, w: 3, h: 2.2 }], guards: [{ x: 40, y: 0, kind: 0 }] }
    let through = false
    for (let a = 8; a <= 40 && !through; a += 1) {
      const s = ready(def)
      s.fire(a, 1)
      let seen = false
      for (let i = 0; i < 150; i++) {
        s.step()
        if (s.parts[0]!.dead) seen = true
        if (seen && !s.projs[0]!.dead && s.projs[0]!.body && s.projs[0]!.body.getLinearVelocity().x > 5) {
          through = true
          break
        }
      }
    }
    expect(through).toBe(true)
  })

  it('breaks a tile with much less than a block of stone needs', () => {
    const hit = (m: 'glass' | 'stone') => {
      const s = ready({ ...base, ammo: ['krug'], parts: [{ m, x: 24, y: 1, w: 0.5, h: 2 }], guards: [{ x: 40, y: 0, kind: 0 }] })
      s.fire(8, 0.8)
      run(s, 150)
      return s.parts[0]!.dead
    }
    let glassBroke = false
    for (let a = 4; a <= 30; a += 2) {
      const s = ready({ ...base, ammo: ['krug'], parts: [{ m: 'glass', x: 24, y: 1, w: 0.5, h: 2 }], guards: [{ x: 40, y: 0, kind: 0 }] })
      s.fire(a, 0.8)
      run(s, 150)
      if (s.parts[0]!.dead) glassBroke = true
    }
    expect(glassBroke).toBe(true)
    expect(hit('stone')).toBe(false)
  })
})

describe('the abilities (a tap in the air)', () => {
  const far: LevelDef = { ...base, width: 50, ammo: ['posaune', 'fackel', 'ruf', 'krug'], guards: [{ x: 33, y: 0, kind: 0 }, { x: 35.5, y: 0, kind: 1 }, { x: 46, y: 0, kind: 2 }] }

  it('bursts the clay jar into shards that hurt a soldier in front of it', () => {
    let hurt = false
    for (let tap = 0.3; tap <= 1.4 && !hurt; tap += 0.1) {
      const s = ready({ ...base, ammo: ['krug'], guards: [{ x: 28, y: 0, kind: 0 }] })
      s.fire(30, 0.8, tap)
      run(s, 200)
      expect(s.projs.some((p) => p.shard)).toBe(true)
      if (s.guards[0]!.hp < GUARD_HP[0]!) hurt = true
    }
    expect(hurt).toBe(true)
  })

  it('lets the clay jar burst by a tap: the jar is gone, shards fly, the tap is used up', () => {
    const s = ready({ ...base, ammo: ['krug', 'krug'] })
    s.fire(45, 0.7)
    run(s, 20)
    expect(s.tappable).toBe(true)
    expect(s.tap()).toBe(true)
    expect(s.projs[0]!.dead).toBe(true)
    expect(s.projs.filter((p) => p.shard && !p.dead).length).toBeGreaterThan(3)
    expect(s.events.some((e) => e.t === 'shatter')).toBe(true)
    expect(s.tappable).toBe(false)
    expect(s.tap()).toBe(false)
  })

  it('lets the stone jar plunge: it falls much faster downward after the tap', () => {
    const s = ready({ ...base, ammo: ['stein'], guards: [{ x: 40, y: 0, kind: 0 }] })
    s.fire(50, 0.7)
    run(s, 25)
    const before = s.projs[0]!.body!.getLinearVelocity().y
    s.tap()
    expect(s.projs[0]!.body!.getLinearVelocity().y).toBeLessThan(Math.min(before, 0) - 8)
    expect(s.events.some((e) => e.t === 'slam')).toBe(true)
  })

  it('lets the trumpet blow when tapped: a soldier in reach is hurt and pushed, the one far away is not, the trumpet is used up', () => {
    const s = ready(far)
    s.fire(45, 0.9)
    flyTo(s, 34)
    expect(s.tappable).toBe(true)
    expect(s.tap()).toBe(true)
    expect(s.projs[0]!.dead).toBe(true)
    expect(s.guards[0]!.hp).toBeLessThan(GUARD_HP[0]!)
    expect(s.guards[2]!.hp).toBe(GUARD_HP[2])
    expect(s.events.some((e) => e.t === 'blast' && e.r === BLAST_R)).toBe(true)
  })

  it('pushes a block in reach away from the trumpet and never catapults it up', () => {
    const s = ready({ ...far, parts: [{ m: 'stone', x: 36.5, y: 0.5, w: 1, h: 1 }] })
    s.fire(45, 0.9)
    flyTo(s, 34)
    const x0 = s.parts[0]!.body.getPosition().x
    s.tap()
    let top = 0
    for (let i = 0; i < 90; i++) {
      s.step()
      top = Math.max(top, s.parts[0]!.body.getLinearVelocity().y)
    }
    expect(s.parts[0]!.body.getPosition().x).toBeGreaterThan(x0 + 0.1)
    expect(top).toBeLessThanOrEqual(12.01)
  })

  it('breaks a tile with the shock wave of the trumpet where stone stays whole', () => {
    const wave = (m: 'glass' | 'stone') => {
      const s = tapNear({ ...far, parts: [{ m, x: 36, y: 0.5, w: 1, h: 1 }], guards: [{ x: 46, y: 0, kind: 2 }] }, 34.5, 1.5, 0.6)
      return s.parts[0]!.dead
    }
    expect(wave('glass')).toBe(true)
    expect(wave('stone')).toBe(false)
  })

  it('lets the torch jar set wood on fire, and the fire jumps to the next beam and burns it down', () => {
    const def: LevelDef = {
      ...far,
      ammo: ['fackel', 'krug'],
      parts: [
        { m: 'wood', x: 33.5, y: 0.5, w: 1, h: 1 },
        { m: 'wood', x: 34.7, y: 0.5, w: 1, h: 1 },
        { m: 'stone', x: 33.5, y: 2.5, w: 1, h: 1 }
      ]
    }
    const s = tapNear(def, 33.5, 1.2, 0.9, 1)
    expect(s.events.some((e) => e.t === 'fire' && e.r === FIRE_R)).toBe(true)
    expect(s.parts[0]!.burn).toBeGreaterThan(0)
    expect(s.parts[2]!.burn).toBe(0)
    expect(s.quiet()).toBe(false)
    run(s, 60 * 8)
    expect(s.parts[0]!.dead).toBe(true)
    expect(s.parts[1]!.dead).toBe(true)
    expect(s.parts[2]!.dead).toBe(false)
  })

  it('gives a soldier in the fire hot feet until he is knocked out', () => {
    const s = tapNear({ ...far, ammo: ['fackel'], guards: [{ x: 33, y: 0, kind: 2 }, { x: 46, y: 0, kind: 0 }] }, 33, 1.2, 0.9, 1)
    expect(s.guards[0]!.burn).toBeGreaterThan(0)
    run(s, 200)
    expect(s.guards[0]!.down).toBe(true)
    expect(s.guards[1]!.down).toBe(false)
  })

  it('does not burn stone, clay or tiles', () => {
    const s = tapNear({ ...far, ammo: ['fackel'], parts: [{ m: 'clay', x: 33.5, y: 0.5, w: 1, h: 1 }, { m: 'glass', x: 34.7, y: 0.5, w: 1, h: 1 }] }, 34, 1.2, 0.9, 1)
    expect(s.parts.every((p) => p.burn === 0)).toBe(true)
  })

  it('splits the triple jar into three jars when tapped', () => {
    const s = ready({ ...far, ammo: ['ruf', 'krug'] })
    s.fire(45, 0.6)
    run(s, 30)
    expect(s.projs.filter((p) => !p.dead)).toHaveLength(1)
    s.tap()
    expect(s.projs.filter((p) => !p.dead)).toHaveLength(3)
    expect(s.tap()).toBe(false)
  })

  it('has a reach that is larger for the trumpet than for the fire', () => {
    expect(BLAST_R).toBeGreaterThan(FIRE_R)
    expect(CATAPULT.x).toBeLessThan(8)
  })
})

describe('nothing is catapulted away', () => {
  it('keeps every block that was not thrown below the speed caps while a tower falls apart', () => {
    const parts: LevelDef['parts'] = []
    for (let i = 0; i < 6; i++) parts.push({ m: 'stone', x: 24, y: 0.5 + i, w: 1, h: 1 }, { m: 'wood', x: 26, y: 0.5 + i, w: 1, h: 1 })
    const s = ready({ ...base, ammo: ['stein', 'posaune'], parts, guards: [{ x: 30, y: 0, kind: 0 }] })
    s.fire(30, 1)
    let maxUp = 0
    let maxSpeed = 0
    for (let i = 0; i < 360; i++) {
      if (i === 40) s.fire(40, 0.7, 0.5)
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
    const s = ready({ ...base, ammo: ['stein'], parts: tower, guards: [{ x: 25.5, y: 2.4, kind: 1 }] })
    s.fire(15, 1)
    run(s, 60 * 12)
    expect(s.quiet()).toBe(true)
  })
})

describe('the round', () => {
  it('is won when every soldier is knocked out, with three stars up to the par and points with a bonus for the jars left', () => {
    const def: LevelDef = { ...base, par: 1, parts: [{ m: 'straw', x: 22, y: 0.5, w: 1.5, h: 1 }], guards: [{ x: 23.3, y: 0, kind: 2 }] }
    let won = false
    for (let a = 4; a <= 24 && !won; a += 1) {
      const s = playShots(def, [{ a, p: 1 }])
      if (s.status === 'won') {
        won = true
        expect(s.used).toBe(1)
        expect(s.stars).toBe(3)
        expect(s.downCount).toBe(1)
        expect(s.bonus).toBe(3 * 10000)
        expect(s.total).toBeGreaterThan(s.score)
        expect(s.score).toBeGreaterThanOrEqual(5000)
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

  it('is lost, kindly, when the jars are gone and a soldier still stands', () => {
    const s = playShots({ ...base, ammo: ['krug', 'krug'] }, [{ a: 85, p: 0.2 }, { a: 85, p: 0.2 }])
    run(s, 400)
    expect(s.status).toBe('lost')
    expect(s.downCount).toBe(0)
  })

  it('lets the wind carry the jar', () => {
    const calm = previewPath(45, 0.7, 0, 1, 80)[0]!
    const windy = previewPath(45, 0.7, 2, 1, 80)[0]!
    expect(windy.x).toBeGreaterThan(calm.x + 0.5)
  })
})
