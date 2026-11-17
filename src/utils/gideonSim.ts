/**
 * "Gideons Nacht": the rules and the physics of the big game, without any drawing (so they can be tested and played back by the level tests).
 *
 * Gideon and his 300 men surround the camp of the Midianites at night (Judges 7,19–22). Gideon's catapult throws clay jars, trumpets and torch jars at the
 * towers, tents and straw heaps of the camp. Nobody is hurt: a guard who is hit, who falls, or who is startled by a crash, a trumpet or a bright light
 * is scared and runs away shouting for help. The level is won when every guard has run away. The structures are real physics (Box2D through `planck`):
 * stacks, beams, bridges, barrels that roll, seesaws and swinging logs, with a hit-point model for each material.
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

export type Ammo = 'krug' | 'stein' | 'posaune' | 'fackel' | 'ruf'
export type Mat = 'wood' | 'straw' | 'stone' | 'cloth' | 'barrel' | 'rock'
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
  /** Which of the three figures (0, 1, 2). */
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
  /** For trumpet, torch jar and call: the seconds after the throw at which the child taps (the effect then happens in the air). */
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
}
export const MATS: Record<Mat, MatInfo> = {
  wood: { density: 0.9, friction: 0.6, restitution: 0.04, hp: 13, armor: 1.7 },
  straw: { density: 0.38, friction: 0.85, restitution: 0.0, hp: 4.5, armor: 0.7 },
  stone: { density: 2.2, friction: 0.7, restitution: 0.02, hp: 36, armor: 5 },
  cloth: { density: 0.3, friction: 0.55, restitution: 0.0, hp: 2.2, armor: 0.35 },
  barrel: { density: 0.6, friction: 0.5, restitution: 0.12, hp: 7, armor: 1.1 },
  rock: { density: 1, friction: 0.8, restitution: 0, hp: 1e9, armor: 1e9 }
}

export interface AmmoInfo {
  r: number
  density: number
  /** The jar breaks on its first real hit. */
  breaks: boolean
  /** How far the clatter of the breaking jar scares a guard. */
  klirr: number
}
export const AMMO: Record<Ammo, AmmoInfo> = {
  krug: { r: 0.42, density: 1.25, breaks: true, klirr: 1.7 },
  stein: { r: 0.5, density: 3.1, breaks: false, klirr: 0 },
  posaune: { r: 0.34, density: 1.0, breaks: true, klirr: 0 },
  fackel: { r: 0.42, density: 1.2, breaks: true, klirr: 1.4 },
  ruf: { r: 0.42, density: 1.25, breaks: true, klirr: 1.7 }
}
/** The reach of the trumpet blast and of the torch light. */
export const BLAST_R = 5.2
export const LIGHT_R = 4.6
const GUARD_ARMOR = 2.2
const GUARD_W = 0.76
const GUARD_H = 1.56
const SCARE_SECONDS = 0.55

export type SimEvent =
  | { t: 'launch'; ammo: Ammo; x: number; y: number }
  | { t: 'hit'; x: number; y: number; power: number; m: Mat }
  | { t: 'break'; m: Mat; x: number; y: number; w: number; h: number; vx: number; vy: number }
  | { t: 'klirr'; x: number; y: number; r: number }
  | { t: 'blast'; x: number; y: number; r: number }
  | { t: 'light'; x: number; y: number; r: number }
  | { t: 'split'; x: number; y: number }
  | { t: 'scare'; x: number; y: number; kind: number }
  | { t: 'run'; x: number; y: number; kind: number }
  | { t: 'won' }
  | { t: 'lost' }

export interface Part {
  def: PartDef
  body: Body
  hp: number
  maxHp: number
  dead: boolean
  mat: MatInfo
  kind: 'part'
}
export interface Guard {
  def: GuardDef
  body: Body | null
  scared: boolean
  /** Seconds since the scare. */
  since: number
  gone: boolean
  kind: 'guard'
}
export interface Proj {
  ammo: Ammo
  body: Body | null
  age: number
  /** The effect (blast, light, split) has been used. */
  used: boolean
  tapAt: number | null
  dead: boolean
  hits: number
  prevVx: number
  prevVy: number
  punched: boolean
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
  /** Steps since the last guard was scared (for the cheer after the win). */
  sinceWin = 0
  private armed = false
  private notes: ContactNote[] = []
  private ground: Body
  private wind: number
  private quietSteps = 0

  constructor(def: LevelDef) {
    this.def = def
    this.wind = def.wind
    this.world = new World({ gravity: new Vec2(0, -GRAVITY) })
    this.ground = this.world.createBody({ type: 'static', position: new Vec2(0, 0), userData: { kind: 'ground' } satisfies Ground })
    this.ground.createFixture({ shape: new Box(def.width + 60, 1, new Vec2(def.width / 2, -1), 0), friction: 0.9, restitution: 0 })
    // a low wall far left and far right so that nothing rolls out of the world and bounces back
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
    const part: Part = { def: d, body, hp, maxHp: hp, dead: false, mat, kind: 'part' }
    body.setUserData(part)
    this.parts.push(part)
    return part
  }

  private addGuard(d: GuardDef): Guard {
    const body = this.world.createBody({ type: 'dynamic', position: new Vec2(d.x, d.y + GUARD_H / 2), angularDamping: 0.7, linearDamping: 0.02 })
    body.createFixture({ shape: new Box(GUARD_W / 2, GUARD_H / 2), density: 0.45, friction: 0.7, restitution: 0 })
    const g: Guard = { def: d, body, scared: false, since: 0, gone: false, kind: 'guard' }
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
  get scaredCount(): number {
    let n = 0
    for (const g of this.guards) if (g.scared) n++
    return n
  }
  /** The stars of the round: 3 up to `par` throws, 2 with one more, 1 otherwise. */
  get stars(): number {
    if (this.status !== 'won') return 0
    return this.used <= this.def.par ? 3 : this.used <= this.def.par + 1 ? 2 : 1
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
    body.setAngularVelocity(-4)
    const p: Proj = { ammo, body, age: 0, used: false, tapAt: tap ?? null, dead: false, hits: 0, prevVx: 0, prevVy: 0, punched: false, kind: 'proj' }
    body.setUserData(p)
    this.projs.push(p)
    this.used++
    this.sinceShot = 0
    this.events.push({ t: 'launch', ammo, x: CATAPULT.x, y: CATAPULT.y })
    return true
  }

  /** The child taps while a jar is in the air: the newest one that has an effect left. */
  tap(): boolean {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!
      if (!p.dead && !p.used && (p.ammo === 'posaune' || p.ammo === 'fackel' || p.ammo === 'ruf')) {
        this.trigger(p)
        return true
      }
    }
    return false
  }

  /** Is there a thrown thing in the air that a tap would do something to? */
  get tappable(): boolean {
    return this.projs.some((p) => !p.dead && !p.used && (p.ammo === 'posaune' || p.ammo === 'fackel' || p.ammo === 'ruf'))
  }

  private trigger(p: Proj) {
    if (!p.body || p.used) return
    const pos = p.body.getPosition()
    if (p.ammo === 'posaune') {
      p.used = true
      this.blast(pos.x, pos.y)
      this.killProj(p)
    } else if (p.ammo === 'fackel') {
      p.used = true
      this.light(pos.x, pos.y)
    } else if (p.ammo === 'ruf') {
      p.used = true
      const v = p.body.getLinearVelocity()
      const speed = Math.hypot(v.x, v.y)
      const ang = Math.atan2(v.y, v.x)
      this.events.push({ t: 'split', x: pos.x, y: pos.y })
      p.body.setLinearVelocity(new Vec2(Math.cos(ang) * speed, Math.sin(ang) * speed))
      for (const d of [-0.2, 0.2]) {
        const body = this.world.createBody({ type: 'dynamic', position: new Vec2(pos.x, pos.y + d * 1.6), bullet: true })
        body.createFixture({ shape: new Circle(0.36), density: 1.25, friction: 0.5, restitution: 0.1, filterGroupIndex: -1 })
        body.setLinearVelocity(new Vec2(Math.cos(ang + d) * speed, Math.sin(ang + d) * speed))
        body.setAngularVelocity(-4)
        const q: Proj = { ammo: 'ruf', body, age: p.age, used: true, tapAt: null, dead: false, hits: 0, prevVx: 0, prevVy: 0, punched: false, kind: 'proj' }
        body.setUserData(q)
        this.projs.push(q)
      }
    }
  }

  private killProj(p: Proj) {
    if (p.dead) return
    p.dead = true
    if (p.body) this.world.destroyBody(p.body)
    p.body = null
  }

  /** The trumpet: pushes everything near away and scares the guards in reach. */
  private blast(x: number, y: number) {
    this.events.push({ t: 'blast', x, y, r: BLAST_R })
    for (const part of this.parts) {
      if (part.dead) continue
      const c = part.body.getWorldCenter()
      const d = Math.hypot(c.x - x, c.y - y)
      if (d > BLAST_R) continue
      const k = 1 - d / BLAST_R
      const nx = (c.x - x) / (d || 1)
      // always a little upward, so that the push does not drive a block into the ground (where its friction would eat it)
      const ny = Math.max(0.3, (c.y - y) / (d || 1) + 0.25)
      const v = part.body.getLinearVelocity()
      part.body.setLinearVelocity(new Vec2(v.x + nx * 9 * k, v.y + ny * 9 * k))
      part.body.setAwake(true)
      this.hurt(part, 4.5 * k)
    }
    for (const g of this.guards) {
      if (g.scared || !g.body) continue
      const c = g.body.getWorldCenter()
      if (Math.hypot(c.x - x, c.y - y) <= BLAST_R * 0.85) this.scare(g)
      else {
        const d = Math.hypot(c.x - x, c.y - y)
        const k = 1 - d / BLAST_R
        if (k > 0) {
          const v = g.body.getLinearVelocity()
          g.body.setLinearVelocity(new Vec2(v.x + ((c.x - x) / (d || 1)) * 6 * k, v.y + 2 * k))
          g.body.setAwake(true)
        }
      }
    }
  }

  /** The torch jar: a bright light that scares the guards in reach (no fire, nothing burns). */
  private light(x: number, y: number) {
    this.events.push({ t: 'light', x, y, r: LIGHT_R })
    for (const g of this.guards) {
      if (g.scared || !g.body) continue
      const c = g.body.getWorldCenter()
      if (Math.hypot(c.x - x, c.y - y) <= LIGHT_R) this.scare(g)
    }
  }

  private klirr(x: number, y: number, r: number) {
    if (r <= 0) return
    this.events.push({ t: 'klirr', x, y, r })
    for (const g of this.guards) {
      if (g.scared || !g.body) continue
      const c = g.body.getWorldCenter()
      if (Math.hypot(c.x - x, c.y - y) <= r) this.scare(g)
    }
  }

  private scare(g: Guard) {
    if (g.scared || !this.armed) return
    g.scared = true
    g.since = 0
    const p = g.body!.getPosition()
    this.events.push({ t: 'scare', x: p.x, y: p.y, kind: g.def.kind })
    if (this.status === 'play' && this.guards.every((q) => q.scared)) {
      this.status = 'won'
      this.sinceWin = 0
      this.events.push({ t: 'won' })
    }
  }

  private hurt(p: Part, dmg: number) {
    if (p.dead || dmg <= 0) return
    p.hp -= dmg
    if (p.hp <= 0) this.destroyPart(p)
  }

  private destroyPart(p: Part) {
    p.dead = true
    const c = p.body.getWorldCenter()
    const v = p.body.getLinearVelocity()
    this.events.push({ t: 'break', m: p.def.m, x: c.x, y: c.y, w: p.def.w, h: p.def.h, vx: v.x, vy: v.y })
    this.world.destroyBody(p.body)
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
      if (this.wind) p.body.applyForceToCenter(new Vec2(this.wind * p.body.getMass(), 0))
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
    this.updateGuards()
    if (this.status === 'won') this.sinceWin++
    if (this.status === 'play' && this.shotsLeft === 0 && this.projs.every((p) => p.dead) && this.quiet()) {
      this.quietSteps++
      if (this.quietSteps > 40) {
        this.status = 'lost'
        this.events.push({ t: 'lost' })
      }
    } else this.quietSteps = 0
  }

  private processContacts() {
    let hitEvents = 0
    for (const n of this.notes) {
      const ents: [Ent, Ent][] = [
        [n.a, n.b],
        [n.b, n.a]
      ]
      for (const [me, other] of ents) {
        if (me.kind === 'part') {
          if (me.dead) continue
          const fromProj = other.kind === 'proj'
          let k = fromProj ? 1.5 : 0.7
          if (fromProj && (other as Proj).ammo === 'stein' && (me.def.m === 'wood' || me.def.m === 'straw' || me.def.m === 'cloth' || me.def.m === 'barrel')) k = 3.2
          const dmg = (n.i - me.mat.armor) * k
          if (dmg > 0) {
            this.hurt(me, dmg)
            if (fromProj && me.dead && (other as Proj).ammo === 'stein') (other as Proj).punched = true
          }
          if (n.i > 2.2 && hitEvents < 3 && other.kind !== 'guard') {
            hitEvents++
            this.events.push({ t: 'hit', x: n.x, y: n.y, power: Math.min(1, n.i / 12), m: me.def.m })
          }
        } else if (me.kind === 'guard') {
          if (!me.scared && me.body && n.i > GUARD_ARMOR) this.scare(me)
        } else if (me.kind === 'proj') {
          if (me.dead || !me.body) continue
          me.hits++
          const info = AMMO[me.ammo]
          if (info.breaks && n.i > 0.6) {
            const p = me.body.getPosition()
            if (me.ammo === 'fackel' && !me.used) {
              me.used = true
              this.light(p.x, p.y)
            }
            if (me.ammo === 'posaune' && !me.used) {
              me.used = true
              this.blast(p.x, p.y)
            } else if (me.ammo !== 'posaune') this.klirr(p.x, p.y, me.ammo === 'ruf' && me.used ? 1.3 : info.klirr)
            this.killProj(me)
          } else if (me.ammo === 'stein' && n.i > 4 && other.kind === 'guard' && !other.scared) {
            // a stone jar hits a guard: he is scared (handled above through the guard's own contact)
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
        if (pos.x > this.def.width + 30 || pos.x < -10 || pos.y < -4 || p.age > 9) {
          // flown away: a jar that leaves the camp breaks in the distance (nobody hears it)
          this.killProj(p)
        } else if (p.ammo === 'stein' && p.age > 1 && p.body.getLinearVelocity().length() < 0.4 && p.body.isAwake() === false) {
          this.killProj(p)
        } else if (p.ammo !== 'stein' && p.hits > 0 && !p.dead && p.age > 0.2) {
          // a jar that touched something softly and did not break: it breaks after a moment
          if (p.hits > 2) this.killProj(p)
        }
      }
      if (p.dead && this.projs.length > 40) this.projs.splice(i, 1)
    }
  }

  private updateGuards() {
    for (const g of this.guards) {
      if (!g.scared || g.gone) continue
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

  /** Nothing moves any more (all bodies sleep) and no guard waits to run. */
  quiet(): boolean {
    for (let b = this.world.getBodyList(); b; b = b.getNext()) if (b.isDynamic() && b.isAwake()) return false
    return this.guards.every((g) => !g.scared || g.gone)
  }

  /** The speed of the fastest thrown thing, or 0. */
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
