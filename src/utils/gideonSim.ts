/**
 * "Gideons Nacht": the rules and the physics of the big game, without any drawing (so they can be tested and played back by the level tests).
 *
 * Gideon and his 300 men surround the camp of the Midianites at night (Judges 7,19–22). Gideon's catapult throws clay jars, stone jars, a trumpet, a torch
 * jar and a bundle of three jars at the towers of the camp (a game in the manner of the birds-and-pigs games). The structures are real physics (Box2D through
 * `planck`): beams, blocks, tiles, bricks, straw and cloth, each material with its own weight, strength and way of breaking. A beam that is hit tips over, a
 * tower that loses a post falls down, and what falls down (or what is thrown, or what burns) hurts the soldiers: every soldier has hit points and is
 * knocked silly when they are gone (he sees stars, loses his helmet and runs away shouting for help; nobody is bleeding or really hurt).
 * Every jar has an ability that the child starts with a tap while it flies: the clay jar bursts into shards, the stone jar plunges down, the trumpet
 * blows a shock wave, the torch jar sets wood, straw and cloth on fire (and the fire spreads), the bundle of three jars splits into three.
 * The level is won when every soldier is down. Points are given for broken parts and soldiers (and a bonus for every jar not used); the stars come
 * from the throws (three up to the par, two with one more, one otherwise).
 *
 * The simulation is deterministic: a fixed time step (1/60 s), the same level and the same shots always give the same game.
 */
import { World, Vec2, Box, Circle, Polygon, RopeJoint, RevoluteJoint, type Body } from 'planck'

export const DT = 1 / 60
export const GRAVITY = 10
/** Where the cup of the catapult rests (world metres, the ground is y = 0, x grows to the right), how far it can be pulled and how fast a full pull throws. */
export const CATAPULT = { x: 3.2, y: 2.35 }
export const MAX_PULL = 2.4
export const SPEED_MAX = 20
/** A pull shorter than this (as a share of the full pull) does not throw. */
export const MIN_POWER = 0.14
export const SETTLE_STEPS = 100
/** Nothing that is not thrown flies faster than this (or upward faster than `UP_MAX`): a blast or a break never catapults a block away. */
const SPEED_CAP = 26
const UP_MAX = 12

export type Ammo = 'krug' | 'stein' | 'posaune' | 'fackel' | 'ruf'
export type Mat = 'wood' | 'straw' | 'stone' | 'cloth' | 'barrel' | 'rock' | 'clay' | 'glass'
export type Shape = 'box' | 'circle' | 'tent'

export interface PartDef {
  m: Mat
  s?: Shape
  /** The centre. */
  x: number
  y: number
  w: number
  h: number
  /** Turn in radians (counter-clockwise). */
  a?: number
  /** A seesaw plank or a hanging log: the joint is made from the `joints` list. */
  id?: string
  /** Fixed in the ground (a gallows post, a beam): it never moves and cannot be broken. */
  fixed?: boolean
}
export interface GuardDef {
  x: number
  /** The height of the feet. */
  y: number
  /** Which of the three soldiers (0 = soldier, 1 = captain with a crest, 2 = the small one with the big helmet). */
  kind: number
}
export interface JointDef {
  t: 'seesaw' | 'pendulum'
  /** The id of the part (a plank for the seesaw, the hanging block for the pendulum). */
  part: string
  /** The point where it turns (seesaw) or hangs from (pendulum). */
  x: number
  y: number
}
export interface LevelDef {
  /** The width of the camp (the camera does not go further right). */
  width: number
  /** A steady wind in m/s² (positive blows to the right), only the thrown things feel it. */
  wind: number
  ammo: Ammo[]
  /** The number of throws that gives three stars (found by the level test); one more gives two stars. */
  par: number
  parts: PartDef[]
  guards: GuardDef[]
  /** Fixed rock: it cannot be broken. */
  rocks?: { x: number; y: number; w: number; h: number }[]
  joints?: JointDef[]
}
export interface Shot {
  /** The angle in degrees above the horizon (0 to 85). */
  a: number
  /** The strength 0..1 of the full pull. */
  p: number
  /** The seconds after the throw at which the child taps (the ability of the jar then works in the air). */
  tap?: number
}

interface MatInfo {
  density: number
  friction: number
  restitution: number
  /** Hit points per half metre of thickness (the thinner side of a block). */
  hp: number
  /** A hit weaker than this does nothing. */
  armor: number
  /** Wood, straw, cloth and barrels burn. */
  burns: boolean
  /** How much the shock wave of the trumpet hurts it (relative). */
  blast: number
  /** The points for breaking a part of it. */
  pts: number
}
export const MATS: Record<Mat, MatInfo> = {
  wood: { density: 0.9, friction: 0.6, restitution: 0.04, hp: 13, armor: 1.7, burns: true, blast: 1, pts: 500 },
  straw: { density: 0.38, friction: 0.85, restitution: 0.0, hp: 4.5, armor: 0.7, burns: true, blast: 1.5, pts: 300 },
  stone: { density: 2.2, friction: 0.7, restitution: 0.02, hp: 36, armor: 5, burns: false, blast: 0.45, pts: 1000 },
  cloth: { density: 0.3, friction: 0.55, restitution: 0.0, hp: 2.2, armor: 0.35, burns: true, blast: 1.5, pts: 300 },
  barrel: { density: 0.6, friction: 0.5, restitution: 0.12, hp: 7, armor: 1.1, burns: true, blast: 1, pts: 400 },
  rock: { density: 1, friction: 0.8, restitution: 0, hp: 1e9, armor: 1e9, burns: false, blast: 0, pts: 0 },
  /** Sun-dried clay brick: heavy, brittle. */
  clay: { density: 1.5, friction: 0.7, restitution: 0.0, hp: 9, armor: 1.4, burns: false, blast: 1.7, pts: 600 },
  /** Glazed tile ("glass"): light and very fragile, shatters at a touch. */
  glass: { density: 0.7, friction: 0.35, restitution: 0.05, hp: 3.2, armor: 0.45, burns: false, blast: 3.5, pts: 400 }
}
/** The materials that give way to the stone jar like paper. */
const SOFT: Mat[] = ['wood', 'straw', 'cloth', 'barrel', 'glass', 'clay']

export interface AmmoInfo {
  r: number
  density: number
  /** The jar breaks on its first real hit. */
  breaks: boolean
}
export const AMMO: Record<Ammo, AmmoInfo> = {
  krug: { r: 0.42, density: 1.25, breaks: true },
  stein: { r: 0.5, density: 3.1, breaks: false },
  posaune: { r: 0.34, density: 1.0, breaks: true },
  fackel: { r: 0.42, density: 1.2, breaks: true },
  ruf: { r: 0.42, density: 1.25, breaks: true }
}
/** The reach of the shock wave of the trumpet and of the burst of fire of the torch jar. */
export const BLAST_R = 5.2
export const FIRE_R = 2.5
const GUARD_ARMOR = 0.6
const GUARD_W = 0.76
const GUARD_H = 1.56
/** The hit points of the three kinds of soldier. */
export const GUARD_HP = [4.5, 9, 3.2]
/** The points for a soldier who is knocked out. */
export const GUARD_PTS = [5000, 8000, 5000]
const BONUS_PER_JAR = 10000
const SCARE_SECONDS = 0.6
const SHARD_DMG = 1.4
const SHARD_POWER = 1.7
const MAX_SHARDS = 24
const BURN_SECONDS = 6
const BURN_DPS = 6
const SHARD_LIFE = 1.5

export type SimEvent =
  | { t: 'launch'; ammo: Ammo; x: number; y: number }
  | { t: 'hit'; x: number; y: number; power: number; m: Mat }
  | { t: 'break'; m: Mat; x: number; y: number; w: number; h: number; vx: number; vy: number }
  | { t: 'shatter'; x: number; y: number }
  | { t: 'blast'; x: number; y: number; r: number }
  | { t: 'fire'; x: number; y: number; r: number }
  | { t: 'split'; x: number; y: number }
  | { t: 'slam'; x: number; y: number }
  | { t: 'hurt'; x: number; y: number; kind: number }
  | { t: 'down'; x: number; y: number; kind: number }
  | { t: 'run'; x: number; y: number; kind: number }
  | { t: 'points'; x: number; y: number; n: number }
  | { t: 'won' }
  | { t: 'lost' }

export interface Part {
  def: PartDef
  body: Body
  hp: number
  maxHp: number
  dead: boolean
  mat: MatInfo
  /** Seconds the part will still burn (0 = not burning) and how long it has burned. */
  burn: number
  burnT: number
  /** A piece of a broken beam (it does not break into pieces again). */
  half: boolean
  kind: 'part'
}
export interface Guard {
  def: GuardDef
  body: Body | null
  hp: number
  maxHp: number
  /** Knocked out: he sees stars and then runs away. */
  down: boolean
  /** Seconds since he was knocked out. */
  since: number
  /** Seconds he still shows the hit face (after a hit that did not knock him out). */
  hurtT: number
  /** Seconds he still burns (his feet are hot). */
  burn: number
  gone: boolean
  kind: 'guard'
}
export interface Proj {
  ammo: Ammo
  body: Body | null
  age: number
  /** The ability (burst, plunge, blast, fire, split) has been used. */
  used: boolean
  tapAt: number | null
  dead: boolean
  hits: number
  prevVx: number
  prevVy: number
  punched: boolean
  /** A shard of a clay jar. */
  shard: boolean
  /** How many tents or tiles the jar has gone through (a clay jar goes through two of them before it breaks). */
  pierce: number
  kind: 'proj'
}
interface Ground {
  kind: 'ground'
}
type Ent = Part | Guard | Proj | Ground
const GROUND_ENT: Ground = { kind: 'ground' }

interface ContactNote {
  a: Ent
  b: Ent
  i: number
  ap: number
  x: number
  y: number
}

export type Status = 'settle' | 'play' | 'won' | 'lost'

export class Sim {
  readonly def: LevelDef
  world: World
  parts: Part[] = []
  guards: Guard[] = []
  projs: Proj[] = []
  /** The ropes of the swinging logs: [anchor x, anchor y, part index]. */
  ropes: { x: number; y: number; part: Part; lx: number; ly: number }[] = []
  events: SimEvent[] = []
  status: Status = 'settle'
  /** The steps since the start (the settling steps included). */
  steps = 0
  used = 0
  /** Steps since the last throw. */
  sinceShot = 0
  /** Steps since the last soldier went down (for the cheer after the win). */
  sinceWin = 0
  /** The points for broken parts and soldiers, and the bonus for the jars not used (given when the round is won). */
  score = 0
  bonus = 0
  private armed = false
  private notes: ContactNote[] = []
  private ground: Body
  private wind: number
  private quietSteps = 0
  private rng = 20231117

  constructor(def: LevelDef) {
    this.def = def
    this.wind = def.wind
    this.world = new World({ gravity: new Vec2(0, -GRAVITY) })
    this.ground = this.world.createBody({ type: 'static', position: new Vec2(0, 0), userData: { kind: 'ground' } satisfies Ground })
    this.ground.createFixture({ shape: new Box(def.width + 60, 1, new Vec2(def.width / 2, -1), 0), friction: 0.9, restitution: 0 })
    for (const r of def.rocks ?? []) {
      const b = this.world.createBody({ type: 'static', position: new Vec2(r.x, r.y) })
      b.createFixture({ shape: new Box(r.w / 2, r.h / 2), friction: 0.8, restitution: 0 })
    }
    for (const p of def.parts) this.addPart(p)
    for (const g of def.guards) this.addGuard(g)
    for (const j of def.joints ?? []) this.addJoint(j)
    this.world.on('pre-solve', (c) => {
      const fa = c.getFixtureA().getBody()
      const fb = c.getFixtureB().getBody()
      const va = fa.getLinearVelocity()
      const vb = fb.getLinearVelocity()
      const dx = vb.x - va.x
      const dy = vb.y - va.y
      const rel2 = dx * dx + dy * dy
      const slot = c as unknown as { _ap?: number; _px?: number; _py?: number }
      if (rel2 < 0.6) {
        slot._ap = 0
        return
      }
      const wm = c.getWorldManifold(null)
      if (!wm) {
        slot._ap = 0
        return
      }
      // the speed with which the two come together along the contact normal (normal points from A to B)
      slot._ap = Math.max(0, -(dx * wm.normal.x + dy * wm.normal.y))
      slot._px = wm.points[0]?.x ?? fa.getPosition().x
      slot._py = wm.points[0]?.y ?? fa.getPosition().y
    })
    this.world.on('post-solve', (c, imp) => {
      if (!this.armed) return
      const slot = c as unknown as { _ap?: number; _px?: number; _py?: number }
      const ap = slot._ap ?? 0
      if (ap < 0.7) return
      let i = 0
      for (const n of imp.normalImpulses) i += n
      if (i < 0.25) return
      const a = (c.getFixtureA().getBody().getUserData() as Ent | null) ?? GROUND_ENT
      const b = (c.getFixtureB().getBody().getUserData() as Ent | null) ?? GROUND_ENT
      this.notes.push({ a, b, i, ap, x: slot._px ?? 0, y: slot._py ?? 0 })
    })
  }

  private rand(): number {
    this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0
    return this.rng / 4294967296
  }

  private addPart(d: PartDef): Part {
    const mat = MATS[d.m]
    const shape: Shape = d.s ?? (d.m === 'barrel' ? 'circle' : 'box')
    const body = this.world.createBody({ type: d.fixed ? 'static' : 'dynamic', position: new Vec2(d.x, d.y), angle: d.a ?? 0, angularDamping: shape === 'circle' ? 0.05 : 0.2, linearDamping: 0.02 })
    const opt = { density: mat.density, friction: mat.friction, restitution: mat.restitution }
    if (shape === 'circle') body.createFixture({ shape: new Circle(d.w / 2), ...opt })
    else if (shape === 'tent') {
      const w = d.w / 2
      const h = d.h / 2
      body.createFixture({ shape: new Polygon([new Vec2(-w, -h), new Vec2(w, -h), new Vec2(w * 0.1, h), new Vec2(-w * 0.1, h)]), ...opt })
    } else body.createFixture({ shape: new Box(d.w / 2, d.h / 2), ...opt })
    const thin = Math.min(d.w, d.h)
    const hp = d.fixed ? 1e9 : mat.hp * Math.max(0.6, Math.min(2.4, thin / 0.5))
    const part: Part = { def: d, body, hp, maxHp: hp, dead: false, mat, burn: 0, burnT: 0, half: false, kind: 'part' }
    body.setUserData(part)
    this.parts.push(part)
    return part
  }

  private addGuard(d: GuardDef): Guard {
    const body = this.world.createBody({ type: 'dynamic', position: new Vec2(d.x, d.y + GUARD_H / 2), angularDamping: 0.7, linearDamping: 0.02 })
    body.createFixture({ shape: new Box(GUARD_W / 2, GUARD_H / 2), density: 0.45, friction: 0.7, restitution: 0 })
    const hp = GUARD_HP[d.kind % 3]!
    const g: Guard = { def: d, body, hp, maxHp: hp, down: false, since: 0, hurtT: 0, burn: 0, gone: false, kind: 'guard' }
    body.setUserData(g)
    this.guards.push(g)
    return g
  }

  private addJoint(j: JointDef) {
    const part = this.parts.find((p) => p.def.id === j.part)
    if (!part) throw new Error(`no part ${j.part}`)
    if (j.t === 'seesaw') {
      this.world.createJoint(new RevoluteJoint({ lowerAngle: 0, upperAngle: 0.65, enableLimit: true }, this.ground, part.body, new Vec2(j.x, j.y)))
      part.hp = part.maxHp = 1e6
    } else {
      // a log on a rope: the rope is fastened at the middle of its top side
      const top = part.body.getWorldPoint(new Vec2(0, part.def.h / 2))
      const len = Math.hypot(top.x - j.x, top.y - j.y)
      this.world.createJoint(new RopeJoint({ maxLength: len }, this.ground, part.body, new Vec2(j.x, j.y)))
      this.ropes.push({ x: j.x, y: j.y, part, lx: 0, ly: part.def.h / 2 })
    }
  }

  get shotsLeft(): number {
    return this.def.ammo.length - this.used
  }
  get nextAmmo(): Ammo | null {
    return this.def.ammo[this.used] ?? null
  }
  /** How many soldiers are down. */
  get downCount(): number {
    let n = 0
    for (const g of this.guards) if (g.down) n++
    return n
  }
  /** The points of the round so far (with the bonus once it is won). */
  get total(): number {
    return this.score + this.bonus
  }
  /** The stars of the round: 3 up to `par` throws, 2 with one more, 1 otherwise. */
  get stars(): number {
    if (this.status !== 'won') return 0
    return this.used <= this.def.par ? 3 : this.used <= this.def.par + 1 ? 2 : 1
  }

  private makeProj(ammo: Ammo, body: Body, tapAt: number | null, shard = false, used = false): Proj {
    const p: Proj = { ammo, body, age: 0, used, tapAt, dead: false, hits: 0, prevVx: 0, prevVy: 0, punched: false, shard, pierce: 0, kind: 'proj' }
    body.setUserData(p)
    this.projs.push(p)
    return p
  }

  /** Throws the next jar. Returns false if there is none or the round is over. */
  fire(angleDeg: number, power: number, tap?: number): boolean {
    if (this.status !== 'play') return false
    const ammo = this.nextAmmo
    if (!ammo) return false
    const a = (Math.max(0, Math.min(85, angleDeg)) * Math.PI) / 180
    const pw = Math.max(MIN_POWER, Math.min(1, power))
    const v = SPEED_MAX * pw
    const info = AMMO[ammo]
    const body = this.world.createBody({ type: 'dynamic', position: new Vec2(CATAPULT.x, CATAPULT.y), bullet: true, linearDamping: 0, angularDamping: 0.1 })
    body.createFixture({ shape: new Circle(info.r), density: info.density, friction: 0.5, restitution: ammo === 'stein' ? 0.05 : 0.1, filterGroupIndex: -1 })
    body.setLinearVelocity(new Vec2(Math.cos(a) * v, Math.sin(a) * v))
    body.setAngularVelocity(ammo === 'posaune' ? -1.5 : -4)
    this.makeProj(ammo, body, tap ?? null)
    this.used++
    this.sinceShot = 0
    this.events.push({ t: 'launch', ammo, x: CATAPULT.x, y: CATAPULT.y })
    return true
  }

  /** The child taps while a jar is in the air: the newest one that has its ability left. */
  tap(): boolean {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!
      if (!p.dead && !p.used && !p.shard) {
        this.trigger(p)
        return true
      }
    }
    return false
  }

  /** Is there a thrown thing in the air that a tap would do something to? */
  get tappable(): boolean {
    return this.projs.some((p) => !p.dead && !p.used && !p.shard)
  }

  private trigger(p: Proj) {
    if (!p.body || p.used) return
    const pos = p.body.getPosition()
    const v = p.body.getLinearVelocity()
    const speed = Math.hypot(v.x, v.y)
    const ang = Math.atan2(v.y, v.x)
    p.used = true
    if (p.ammo === 'krug') {
      // the jar bursts: a fan of shards flies on in the direction of the throw
      this.events.push({ t: 'shatter', x: pos.x, y: pos.y })
      this.shards(pos.x, pos.y, 7, ang, 1.2, speed * 0.55 + 2, speed * 0.9 + 3)
      this.killProj(p)
    } else if (p.ammo === 'stein') {
      // the stone jar plunges: almost straight down, fast
      this.events.push({ t: 'slam', x: pos.x, y: pos.y })
      p.body.setLinearVelocity(new Vec2(v.x * 0.2, -Math.min(22, Math.max(15, speed * 1.15))))
      p.body.setAngularVelocity(0)
    } else if (p.ammo === 'posaune') {
      this.blast(pos.x, pos.y)
      this.killProj(p)
    } else if (p.ammo === 'fackel') {
      this.burst(pos.x, pos.y)
      this.killProj(p)
    } else if (p.ammo === 'ruf') {
      this.events.push({ t: 'split', x: pos.x, y: pos.y })
      p.body.setLinearVelocity(new Vec2(Math.cos(ang) * speed, Math.sin(ang) * speed))
      for (const d of [-0.2, 0.2]) {
        const body = this.world.createBody({ type: 'dynamic', position: new Vec2(pos.x, pos.y + d * 1.6), bullet: true })
        body.createFixture({ shape: new Circle(0.36), density: 1.25, friction: 0.5, restitution: 0.1, filterGroupIndex: -1 })
        body.setLinearVelocity(new Vec2(Math.cos(ang + d) * speed, Math.sin(ang + d) * speed))
        body.setAngularVelocity(-4)
        const q = this.makeProj('ruf', body, null, false, true)
        q.age = p.age
      }
    }
  }

  private killProj(p: Proj) {
    if (p.dead) return
    p.dead = true
    if (p.body) this.world.destroyBody(p.body)
    p.body = null
  }

  /** Clay shards: `n` small bodies in a fan around `a0` (radians) with the given spread and speeds. */
  private shards(x: number, y: number, n: number, a0: number, spread: number, v0: number, v1: number) {
    let live = 0
    for (const p of this.projs) if (p.shard && !p.dead) live++
    n = Math.min(n, MAX_SHARDS - live)
    for (let i = 0; i < n; i++) {
      const ang = a0 + (n > 1 ? i / (n - 1) - 0.5 : 0) * spread + (this.rand() - 0.5) * 0.12
      const v = v0 + (v1 - v0) * this.rand()
      const body = this.world.createBody({ type: 'dynamic', position: new Vec2(x + Math.cos(ang) * 0.25, y + Math.sin(ang) * 0.25), linearDamping: 0.08, angularDamping: 0.1 })
      body.createFixture({ shape: new Circle(0.13), density: 1.6, friction: 0.5, restitution: 0.15, filterGroupIndex: -1 })
      body.setLinearVelocity(new Vec2(Math.cos(ang) * v, Math.sin(ang) * v))
      body.setAngularVelocity((this.rand() - 0.5) * 20)
      this.makeProj('krug', body, null, true, true)
    }
  }

  /** The trumpet: a shock wave that pushes everything near away, breaks fragile things and hurts the soldiers in reach. */
  private blast(x: number, y: number) {
    this.events.push({ t: 'blast', x, y, r: BLAST_R })
    for (const part of [...this.parts]) {
      if (part.dead || part.def.fixed) continue
      const c = part.body.getWorldCenter()
      const d = Math.hypot(c.x - x, c.y - y)
      if (d > BLAST_R) continue
      const k = 1 - d / BLAST_R
      const nx = (c.x - x) / (d || 1)
      // always a little upward, so that the push does not drive a block into the ground (where its friction would eat it)
      const ny = Math.max(0.3, (c.y - y) / (d || 1) + 0.25)
      const v = part.body.getLinearVelocity()
      part.body.setLinearVelocity(new Vec2(v.x + nx * 9 * k, Math.min(UP_MAX, v.y + ny * 9 * k)))
      part.body.setAwake(true)
      this.hurt(part, 4.5 * k * part.mat.blast)
    }
    for (const g of this.guards) {
      if (g.down || !g.body) continue
      const c = g.body.getWorldCenter()
      const d = Math.hypot(c.x - x, c.y - y)
      if (d > BLAST_R) continue
      const k = 1 - d / BLAST_R
      const v = g.body.getLinearVelocity()
      g.body.setLinearVelocity(new Vec2(v.x + ((c.x - x) / (d || 1)) * 7 * k, Math.min(UP_MAX, v.y + 2.5 * k)))
      g.body.setAwake(true)
      this.hurtGuard(g, 7.5 * k)
    }
  }

  /** The torch jar bursts: everything that burns near it catches fire, soldiers in the burst get hot feet. */
  private burst(x: number, y: number) {
    this.events.push({ t: 'fire', x, y, r: FIRE_R })
    for (const part of this.parts) {
      if (part.dead || !part.mat.burns || part.burn > 0) continue
      const c = part.body.getWorldCenter()
      const reach = FIRE_R + Math.min(part.def.w, part.def.h) * 0.4
      if (Math.hypot(c.x - x, c.y - y) <= reach) this.ignite(part)
    }
    for (const g of this.guards) {
      if (g.down || !g.body) continue
      const c = g.body.getWorldCenter()
      if (Math.hypot(c.x - x, c.y - y) <= FIRE_R) g.burn = 2.6
    }
  }

  private ignite(part: Part) {
    part.burn = BURN_SECONDS
    part.burnT = 0
  }

  private hurt(p: Part, dmg: number) {
    if (p.dead || dmg <= 0) return
    p.hp -= dmg
    if (p.hp <= 0) this.destroyPart(p)
  }

  private hurtGuard(g: Guard, dmg: number) {
    if (g.down || !this.armed || dmg <= 0 || !g.body) return
    g.hp -= dmg
    const p = g.body.getPosition()
    if (g.hp <= 0) {
      g.down = true
      g.since = 0
      this.events.push({ t: 'down', x: p.x, y: p.y, kind: g.def.kind })
      const pts = GUARD_PTS[g.def.kind % 3]!
      this.score += pts
      this.events.push({ t: 'points', x: p.x, y: p.y + 2.3, n: pts })
      if (this.status === 'play' && this.guards.every((q) => q.down)) {
        this.status = 'won'
        this.sinceWin = 0
        this.bonus = this.shotsLeft * BONUS_PER_JAR
        this.events.push({ t: 'won' })
      }
    } else if (dmg > 0.4 && g.hurtT < 0.2) {
      g.hurtT = 0.5
      this.events.push({ t: 'hurt', x: p.x, y: p.y, kind: g.def.kind })
    }
  }

  private destroyPart(p: Part) {
    p.dead = true
    const c = p.body.getWorldCenter()
    const v = p.body.getLinearVelocity()
    const d = p.def
    this.events.push({ t: 'break', m: d.m, x: c.x, y: c.y, w: d.w, h: d.h, vx: v.x, vy: v.y })
    const pts = p.mat.pts
    if (pts > 0) {
      this.score += pts
      this.events.push({ t: 'points', x: c.x, y: c.y + 0.4, n: pts })
    }
    const ang = p.body.getAngle()
    const w = d.w
    const h = d.h
    const av = p.body.getAngularVelocity()
    this.world.destroyBody(p.body)
    // a long wooden beam snaps in two (the pieces do not break again into pieces)
    const shape = d.s ?? 'box'
    const long = Math.max(w, h)
    if (d.m === 'wood' && shape === 'box' && !d.id && !d.fixed && !p.half && long >= 1.9 && Math.min(w, h) <= 0.6) {
      const horizontal = w >= h
      const half = long / 2 - 0.04
      for (const sgn of [-1, 1]) {
        const off = (long / 4) * sgn
        const lx = horizontal ? off : 0
        const ly = horizontal ? 0 : off
        const px = c.x + lx * Math.cos(ang) - ly * Math.sin(ang)
        const py = c.y + lx * Math.sin(ang) + ly * Math.cos(ang)
        const piece = this.addPart({ m: 'wood', x: px, y: py, w: horizontal ? half : w, h: horizontal ? h : half, a: ang })
        piece.half = true
        piece.hp = piece.maxHp = piece.maxHp * 0.35
        piece.body.setLinearVelocity(new Vec2(v.x * 0.7 + sgn * 0.8 * (horizontal ? 1 : 0), v.y * 0.7 + (horizontal ? 0 : sgn * 0.3)))
        piece.body.setAngularVelocity(av * 0.5 + sgn * 0.6)
        if (p.burn > 0) {
          piece.burn = p.burn
          piece.burnT = p.burnT
        }
      }
    }
  }

  /** One step of 1/60 s. */
  step() {
    // wind and the speed before the step (for the stone jar that goes through wood)
    for (const p of this.projs) {
      if (p.dead || !p.body) continue
      const v = p.body.getLinearVelocity()
      p.prevVx = v.x
      p.prevVy = v.y
      p.punched = false
      if (this.wind && !p.shard) p.body.applyForceToCenter(new Vec2(this.wind * p.body.getMass(), 0))
      p.age += DT
      if (p.tapAt !== null && !p.used && p.age >= p.tapAt) this.trigger(p)
    }
    this.notes.length = 0
    this.world.step(DT, 8, 3)
    this.steps++
    this.sinceShot++
    if (this.status === 'settle' && this.steps >= SETTLE_STEPS) {
      this.armed = true
      this.status = 'play'
    }
    this.processContacts()
    this.updateProjs()
    this.updateFire()
    this.updateGuards()
    this.capSpeeds()
    if (this.status === 'won') this.sinceWin++
    if (this.status === 'play' && this.shotsLeft === 0 && this.projs.every((p) => p.dead) && this.quiet()) {
      this.quietSteps++
      if (this.quietSteps > 40) {
        this.status = 'lost'
        this.events.push({ t: 'lost' })
      }
    } else this.quietSteps = 0
  }

  /** Nothing that was not thrown is faster than `SPEED_CAP` or flies upward faster than `UP_MAX`. */
  private capSpeeds() {
    for (let b = this.world.getBodyList(); b; b = b.getNext()) {
      if (!b.isDynamic() || !b.isAwake()) continue
      const v = b.getLinearVelocity()
      const ud = b.getUserData() as Ent | null
      const thrown = ud?.kind === 'proj'
      let vx = v.x
      let vy = v.y
      let changed = false
      if (!thrown && vy > UP_MAX) {
        vy = UP_MAX
        changed = true
      }
      const sp = Math.hypot(vx, vy)
      if (sp > SPEED_CAP) {
        vx *= SPEED_CAP / sp
        vy *= SPEED_CAP / sp
        changed = true
      }
      if (changed) b.setLinearVelocity(new Vec2(vx, vy))
    }
  }

  private processContacts() {
    let hitEvents = 0
    for (const n of this.notes) {
      const ents: [Ent, Ent][] = [
        [n.a, n.b],
        [n.b, n.a]
      ]
      for (const [me, other] of ents) {
        const shardHit = other.kind === 'proj' && other.shard
        if (shardHit && (other as Proj).age < 0.05) continue
        if (me.kind === 'part') {
          if (me.dead) continue
          const fromProj = other.kind === 'proj'
          let dmg: number
          if (shardHit) dmg = SHARD_POWER - me.mat.armor
          else {
            let k = fromProj ? 1.5 : 0.7
            if (fromProj && (other as Proj).ammo === 'stein' && SOFT.includes(me.def.m)) k = 3.2
            dmg = (n.i - me.mat.armor) * k
          }
          if (dmg > 0) {
            this.hurt(me, dmg)
            if (fromProj && me.dead && (other as Proj).ammo === 'stein') (other as Proj).punched = true
          }
          if (n.i > 2.2 && hitEvents < 3 && other.kind !== 'guard' && !shardHit) {
            hitEvents++
            this.events.push({ t: 'hit', x: n.x, y: n.y, power: Math.min(1, n.i / 12), m: me.def.m })
          }
        } else if (me.kind === 'guard') {
          if (me.down || !me.body) continue
          if (shardHit) this.hurtGuard(me, SHARD_DMG)
          else {
            const k = other.kind === 'proj' ? ((other as Proj).ammo === 'stein' ? 2.4 : 1.8) : 1.7
            this.hurtGuard(me, (n.i - GUARD_ARMOR) * k)
          }
        } else if (me.kind === 'proj') {
          if (me.dead || !me.body) continue
          if (me.shard) {
            if (me.age > 0.05 && n.i > 0.05) this.killProj(me)
            continue
          }
          me.hits++
          const info = AMMO[me.ammo]
          if (info.breaks && n.i > 0.6) {
            // a clay jar goes through cloth and tiles (they break, the jar is only slowed down), but breaks on the second one it meets
            if ((me.ammo === 'krug' || me.ammo === 'ruf') && other.kind === 'part' && (other.def.m === 'cloth' || other.def.m === 'glass') && me.pierce < 2) {
              me.pierce++
              me.punched = true
              continue
            }
            const p = me.body.getPosition()
            if (me.ammo === 'fackel') {
              if (!me.used) this.burst(p.x, p.y)
            } else if (me.ammo === 'posaune') {
              if (!me.used) this.blast(p.x, p.y)
            } else {
              // a clay jar that breaks on a hit throws a few shards up and sideways
              this.events.push({ t: 'shatter', x: p.x, y: p.y })
              this.shards(p.x, p.y + 0.1, me.ammo === 'ruf' ? 3 : 5, Math.PI / 2, 2.6, 3, 6.5)
            }
            me.used = true
            this.killProj(me)
          }
        }
      }
    }
  }

  private updateProjs() {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!
      if (!p.dead && p.body) {
        const pos = p.body.getPosition()
        if (p.punched) {
          p.body.setLinearVelocity(new Vec2(p.prevVx * 0.82, p.prevVy * 0.82))
        }
        if (p.shard) {
          if (p.age > SHARD_LIFE || pos.x > this.def.width + 30 || pos.y < -4) this.killProj(p)
        } else if (pos.x > this.def.width + 30 || pos.x < -10 || pos.y < -4 || p.age > 9) {
          // flown away: a jar that leaves the camp breaks in the distance
          this.killProj(p)
        } else if (p.ammo === 'stein' && p.age > 1 && p.body.getLinearVelocity().length() < 0.4 && p.body.isAwake() === false) {
          this.killProj(p)
        } else if (p.ammo !== 'stein' && p.hits > 0 && !p.dead && p.age > 0.2) {
          // a jar that touched something softly and did not break: it breaks after a moment
          if (p.hits > 2) this.killProj(p)
        }
      }
      if (p.dead && this.projs.length > 60) this.projs.splice(i, 1)
    }
  }

  /** Burning parts lose hit points, the fire jumps to burnable parts nearby, soldiers who stand in the fire get hot feet. */
  private updateFire() {
    const burning: Part[] = []
    for (const p of this.parts) if (!p.dead && p.burn > 0) burning.push(p)
    if (burning.length) {
      const spread = this.steps % 20 === 0
      for (const p of burning) {
        p.burn -= DT
        p.burnT += DT
        this.hurt(p, BURN_DPS * DT)
        if (p.dead) continue
        if (spread && p.burnT > 0.6) {
          const c = p.body.getWorldCenter()
          const ra = Math.hypot(p.def.w, p.def.h) / 2
          for (const q of this.parts) {
            if (q.dead || q === p || !q.mat.burns || q.burn > 0) continue
            const qc = q.body.getWorldCenter()
            if (Math.hypot(qc.x - c.x, qc.y - c.y) < ra + Math.hypot(q.def.w, q.def.h) / 2 + 0.35) this.ignite(q)
          }
        }
      }
    }
    for (const g of this.guards) {
      if (g.down || !g.body) continue
      let hot = g.burn > 0
      if (g.burn > 0) g.burn -= DT
      if (!hot && burning.length) {
        const c = g.body.getWorldCenter()
        for (const p of burning) {
          const pc = p.body.getWorldCenter()
          if (Math.hypot(pc.x - c.x, pc.y - c.y) < Math.hypot(p.def.w, p.def.h) / 2 + 0.7) {
            hot = true
            g.burn = Math.max(g.burn, 0.4)
            break
          }
        }
      }
      if (hot) this.hurtGuard(g, 1.9 * DT)
    }
  }

  private updateGuards() {
    for (const g of this.guards) {
      if (g.hurtT > 0) g.hurtT -= DT
      if (!g.down || g.gone) continue
      g.since += DT
      if (g.since >= SCARE_SECONDS && g.body) {
        const p = g.body.getPosition()
        this.events.push({ t: 'run', x: p.x, y: p.y - GUARD_H / 2, kind: g.def.kind })
        this.world.destroyBody(g.body)
        g.body = null
        g.gone = true
      }
    }
  }

  /** Nothing moves any more (all bodies sleep), nothing burns and no soldier waits to run. */
  quiet(): boolean {
    for (let b = this.world.getBodyList(); b; b = b.getNext()) if (b.isDynamic() && b.isAwake()) return false
    for (const p of this.parts) if (!p.dead && p.burn > 0) return false
    for (const g of this.guards) if (!g.gone && !g.down && g.burn > 0) return false
    return this.guards.every((g) => !g.down || g.gone)
  }

  /** Is a thrown thing (or a shard) still in the air? */
  get flying(): boolean {
    return this.projs.some((p) => !p.dead)
  }
}

/** The starting speed of a throw as a vector (the same for the preview and the throw). */
export function launchVelocity(angleDeg: number, power: number): { vx: number; vy: number } {
  const a = (Math.max(0, Math.min(85, angleDeg)) * Math.PI) / 180
  const v = SPEED_MAX * Math.max(MIN_POWER, Math.min(1, power))
  return { vx: Math.cos(a) * v, vy: Math.sin(a) * v }
}

/** The path of a throw in the air for the dotted preview: `n` points `every` steps apart, with the same stepping as the physics (and the wind). */
export function previewPath(angleDeg: number, power: number, wind: number, n: number, every = 5): { x: number; y: number }[] {
  const { vx, vy } = launchVelocity(angleDeg, power)
  let x = CATAPULT.x
  let y = CATAPULT.y
  let ux = vx
  let uy = vy
  const out: { x: number; y: number }[] = []
  for (let s = 1; s <= n * every; s++) {
    uy -= GRAVITY * DT
    ux += wind * DT
    x += ux * DT
    y += uy * DT
    if (s % every === 0) out.push({ x, y })
    if (y < 0) break
  }
  return out
}

/** The pull of the finger (the cup dragged to `dx, dy` from its rest place) as a throw: the angle in degrees and the strength 0..1. */
export function pullToShot(dx: number, dy: number): Shot {
  const len = Math.min(MAX_PULL, Math.hypot(dx, dy))
  const a = (Math.atan2(-dy, -dx) * 180) / Math.PI
  return { a: Math.max(0, Math.min(85, a)), p: len / MAX_PULL }
}

/** Plays shots one after the other, each time waiting until everything is still (as the level tests and the solver do). Returns the simulation. */
export function playShots(def: LevelDef, shots: Shot[]): Sim {
  const sim = new Sim(def)
  for (let i = 0; i < SETTLE_STEPS + 2; i++) sim.step()
  const settled = (): boolean => !sim.flying && sim.sinceShot > 20 && sim.quiet()
  for (const s of shots) {
    if (!sim.fire(s.a, s.p, s.tap)) break
    let guard = 0
    while (guard++ < 60 * 14 && sim.status === 'play') {
      sim.step()
      if (settled()) break
    }
    sim.events.length = 0
    if (sim.status !== 'play') break
  }
  // the last throw: let everything run out (a won round gets its cheer time)
  let g = 0
  while (g++ < 60 * 14 && (sim.status === 'won' ? sim.sinceWin < 45 : sim.status === 'play' && !settled())) sim.step()
  return sim
}
