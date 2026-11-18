/**
 * "Josefs Kornspeicher" (Genesis 41): the rules and the physics of the big game, without any drawing (so they can be tested and played back by the level tests).
 *
 * In the seven good years Joseph gathers grain so that Egypt has bread in the lean years. A catapult throws sacks of grain, a heavy sack, a bundle of ears,
 * a barrel and an inflated goatskin bag into the empty granaries (open wooden or mud-brick bins). A granary is full when the grain in it reaches its mark.
 * Nobody is in the way: the obstacles are towers of crates and beams, mud bricks, stone blocks, palms and the Nile (a sack that falls into the river is lost).
 * The structures are real physics (Box2D through `planck`): a beam that is hit tips over, a long beam snaps in two, a tower that loses a post falls down, and
 * falling crates and sheaves of wheat push grain into the bin. Every kind of sack has an ability that a tap starts in the air:
 * the heavy sack plunges, the bundle of ears splits into three, the barrel gets a push forward and rolls on, the goatskin bag swells up and floats for a moment.
 * Points are given for full granaries and for crates and beams that fall over (and a bonus for every sack not used); the stars come from the throws
 * (three up to the par, two with one more, one otherwise).
 *
 * The simulation is deterministic: a fixed time step (1/60 s), the same level and the same shots always give the same game.
 */
import { World, Vec2, Box, Circle, RopeJoint, RevoluteJoint, type Body, type Fixture } from 'planck'

export const DT = 1 / 60
export const GRAVITY = 10
/** Where the cup of the catapult rests (world metres, the ground is y = 0, x grows to the right), how far it can be pulled and how fast a full pull throws. */
export const CATAPULT = { x: 3.2, y: 2.35 }
export const MAX_PULL = 2.4
export const SPEED_MAX = 20
/** A pull shorter than this (as a share of the full pull) does not throw. */
export const MIN_POWER = 0.14
export const SETTLE_STEPS = 100
/** Nothing that is not thrown flies faster than this (or upward faster than `UP_MAX`): a crash never catapults a crate away. */
const SPEED_CAP = 26
const UP_MAX = 12

export type Ammo = 'sack' | 'schwer' | 'aehren' | 'fass' | 'luft'
export type Mat = 'wood' | 'crate' | 'straw' | 'stone' | 'clay' | 'barrel' | 'rock'
export type Shape = 'box' | 'circle'

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
  /** Fixed in the ground (a post, a beam): it never moves and cannot be broken. */
  fixed?: boolean
  /** A sheaf of wheat: it is grain, and counts in a granary like a sack. */
  grain?: boolean
}
export interface SiloDef {
  /** The middle of the bin (x), the height of its floor (y), the free width inside, the height of its walls and the grain it needs (sacks, see `GRAIN`). */
  x: number
  y: number
  w: number
  h: number
  need: number
  /** Which picture: 0 = wooden bin, 1 = mud-brick bin. */
  look?: number
}
export interface RockDef {
  x: number
  y: number
  w: number
  h: number
  /** What it looks like: a plain block, a palm tree (trunk is the block), a block of the pyramid. */
  k?: 'palm' | 'pyramid'
}
export interface WaterDef {
  x0: number
  x1: number
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
  /** The width of the world (the camera does not go further right). */
  width: number
  /** A steady wind in m/s² (positive blows to the right), only the thrown things feel it. */
  wind: number
  ammo: Ammo[]
  /** The number of throws that gives three stars (found by the level test); one more gives two stars. */
  par: number
  parts: PartDef[]
  silos: SiloDef[]
  /** Fixed rock: it cannot be broken. */
  rocks?: RockDef[]
  /** Stretches of the Nile: what falls in is lost. */
  water?: WaterDef[]
  joints?: JointDef[]
}
export interface Shot {
  /** The angle in degrees above the horizon (0 to 85). */
  a: number
  /** The strength 0..1 of the full pull. */
  p: number
  /** The seconds after the throw at which the child taps (the ability of the sack then works in the air). */
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
  /** The points for breaking a part of it. */
  pts: number
}
export const MATS: Record<Mat, MatInfo> = {
  wood: { density: 0.9, friction: 0.6, restitution: 0.04, hp: 13, armor: 1.7, pts: 500 },
  crate: { density: 0.55, friction: 0.6, restitution: 0.04, hp: 9, armor: 1.2, pts: 400 },
  straw: { density: 0.38, friction: 0.85, restitution: 0.0, hp: 4.5, armor: 0.7, pts: 300 },
  stone: { density: 2.2, friction: 0.7, restitution: 0.02, hp: 36, armor: 5, pts: 1000 },
  clay: { density: 1.5, friction: 0.7, restitution: 0.0, hp: 9, armor: 1.4, pts: 600 },
  barrel: { density: 0.6, friction: 0.5, restitution: 0.12, hp: 7, armor: 1.1, pts: 400 },
  rock: { density: 1, friction: 0.8, restitution: 0, hp: 1e9, armor: 1e9, pts: 0 }
}
/** The materials that give way to the heavy sack like paper. */
const SOFT: Mat[] = ['wood', 'crate', 'straw', 'barrel', 'clay']

export interface AmmoInfo {
  /** Half width and half height of a box, or the radius of a circle. */
  hw: number
  hh: number
  circle: boolean
  density: number
  friction: number
  restitution: number
  /** How much grain it is worth in a granary. */
  grain: number
  /** How hard it hits things (relative). */
  hit: number
}
export const AMMO: Record<Ammo, AmmoInfo> = {
  sack: { hw: 0.38, hh: 0.32, circle: false, density: 1.4, friction: 0.7, restitution: 0.05, grain: 1, hit: 1.5 },
  schwer: { hw: 0.5, hh: 0.4, circle: false, density: 2.6, friction: 0.7, restitution: 0.03, grain: 1.5, hit: 2 },
  aehren: { hw: 0.55, hh: 0.25, circle: false, density: 1.0, friction: 0.7, restitution: 0.05, grain: 1.5, hit: 1 },
  fass: { hw: 0.42, hh: 0.42, circle: true, density: 1.1, friction: 0.35, restitution: 0.12, grain: 1.5, hit: 2.2 },
  luft: { hw: 0.4, hh: 0.4, circle: true, density: 0.9, friction: 0.6, restitution: 0.3, grain: 1, hit: 1 }
}
/** A small bundle of ears (one of the three pieces after the split) is worth a third of the bundle. */
const PIECE = { hw: 0.3, hh: 0.2, grain: 0.5 }
/** The grain of the things that count in a granary. */
export const GRAIN = { sack: 1, sheaf: 1 }
/** Seconds the goatskin bag floats after the tap. */
const FLOAT_SECONDS = 1.5
const BONUS_PER_SACK = 10000
const SILO_POINTS = 3000
const MOVE_POINTS = 150
/** A granary counts as full when it has been full for this many steps (so that a sack that bounces through does not count). */
const FULL_STEPS = 40

export type SimEvent =
  | { t: 'launch'; ammo: Ammo; x: number; y: number }
  | { t: 'hit'; x: number; y: number; power: number; m: Mat | 'sack' }
  | { t: 'break'; m: Mat; x: number; y: number; w: number; h: number; vx: number; vy: number }
  | { t: 'split'; x: number; y: number }
  | { t: 'slam'; x: number; y: number }
  | { t: 'boost'; x: number; y: number }
  | { t: 'inflate'; x: number; y: number }
  | { t: 'splash'; x: number; y: number }
  | { t: 'silo'; i: number; x: number; y: number }
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
  /** A piece of a broken beam (it does not break into pieces again). */
  half: boolean
  /** It has been pushed away from its place (and was paid for). */
  moved: boolean
  kind: 'part'
}
export interface Proj {
  ammo: Ammo
  body: Body | null
  age: number
  /** The ability (plunge, split, push, swell) has been used. */
  used: boolean
  tapAt: number | null
  dead: boolean
  /** The number of hits since the throw (after the first one it is on the ground and a tap does nothing). */
  hits: number
  prevVx: number
  prevVy: number
  punched: boolean
  /** The grain it is worth in a granary. */
  grain: number
  /** A small piece of a split bundle. */
  piece: boolean
  /** Seconds the swollen goatskin bag still floats (0 = not floating). */
  float: number
  kind: 'proj'
}
interface Ground {
  kind: 'ground'
}
type Ent = Part | Proj | Ground
const GROUND_ENT: Ground = { kind: 'ground' }

export interface Silo {
  def: SiloDef
  /** The grain in it now. */
  fill: number
  /** The steps it has been full in a row. */
  held: number
  /** It has been full long enough: this is final. */
  done: boolean
}

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
  projs: Proj[] = []
  silos: Silo[] = []
  /** The ropes of the swinging logs: [anchor x, anchor y, part index]. */
  ropes: { x: number; y: number; part: Part; lx: number; ly: number }[] = []
  events: SimEvent[] = []
  status: Status = 'settle'
  /** The steps since the start (the settling steps included). */
  steps = 0
  used = 0
  /** Steps since the last throw. */
  sinceShot = 0
  /** Steps since the last granary was filled (for the cheer after the win). */
  sinceWin = 0
  /** The points for full granaries and fallen crates, and the bonus for the sacks not used (given when the round is won). */
  score = 0
  bonus = 0
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
    // the ground, with a gap for every stretch of the Nile, and a deep floor below everything (what falls in is removed before it reaches it)
    const water = [...(def.water ?? [])].sort((a, b) => a.x0 - b.x0)
    let x = -30
    const end = def.width + 60
    const segment = (x0: number, x1: number) => {
      if (x1 - x0 > 0.01) this.ground.createFixture({ shape: new Box((x1 - x0) / 2, 1, new Vec2((x0 + x1) / 2, -1), 0), friction: 0.9, restitution: 0 })
    }
    for (const w of water) {
      segment(x, w.x0)
      x = w.x1
    }
    segment(x, end)
    this.ground.createFixture({ shape: new Box((end + 30) / 2, 1, new Vec2((end - 30) / 2, -12), 0), friction: 0.9, restitution: 0 })
    for (const r of def.rocks ?? []) {
      const b = this.world.createBody({ type: 'static', position: new Vec2(r.x, r.y), userData: { kind: 'ground' } satisfies Ground })
      b.createFixture({ shape: new Box(r.w / 2, r.h / 2), friction: 0.8, restitution: 0 })
    }
    for (const s of def.silos) this.addSilo(s)
    for (const p of def.parts) this.addPart(p)
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

  private addSilo(d: SiloDef) {
    const wall = (cx: number) => {
      const b = this.world.createBody({ type: 'static', position: new Vec2(cx, d.y + d.h / 2), userData: { kind: 'ground' } satisfies Ground })
      b.createFixture({ shape: new Box(0.25, d.h / 2), friction: 0.6, restitution: 0 })
    }
    wall(d.x - d.w / 2 - 0.25)
    wall(d.x + d.w / 2 + 0.25)
    if (d.y > 0.01) {
      const f = this.world.createBody({ type: 'static', position: new Vec2(d.x, d.y - 0.15), userData: { kind: 'ground' } satisfies Ground })
      f.createFixture({ shape: new Box(d.w / 2 + 0.5, 0.15), friction: 0.8, restitution: 0 })
    }
    this.silos.push({ def: d, fill: 0, held: 0, done: false })
  }

  private addPart(d: PartDef): Part {
    const mat = MATS[d.m]
    const shape: Shape = d.s ?? (d.m === 'barrel' ? 'circle' : 'box')
    const body = this.world.createBody({ type: d.fixed ? 'static' : 'dynamic', position: new Vec2(d.x, d.y), angle: d.a ?? 0, angularDamping: shape === 'circle' ? 0.05 : 0.2, linearDamping: 0.02 })
    const opt = { density: mat.density, friction: mat.friction, restitution: mat.restitution }
    if (shape === 'circle') body.createFixture({ shape: new Circle(d.w / 2), ...opt })
    else body.createFixture({ shape: new Box(d.w / 2, d.h / 2), ...opt })
    const thin = Math.min(d.w, d.h)
    const hp = d.fixed ? 1e9 : mat.hp * Math.max(0.6, Math.min(2.4, thin / 0.5))
    const part: Part = { def: d, body, hp, maxHp: hp, dead: false, mat, half: false, moved: false, kind: 'part' }
    body.setUserData(part)
    this.parts.push(part)
    return part
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
  /** How many granaries are full. */
  get doneCount(): number {
    let n = 0
    for (const s of this.silos) if (s.done) n++
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

  private makeProj(ammo: Ammo, body: Body, tapAt: number | null, grain: number, piece = false, used = false): Proj {
    const p: Proj = { ammo, body, age: 0, used, tapAt, dead: false, hits: 0, prevVx: 0, prevVy: 0, punched: false, grain, piece, float: 0, kind: 'proj' }
    body.setUserData(p)
    this.projs.push(p)
    return p
  }

  private shape(info: { hw: number; hh: number; circle?: boolean }) {
    return info.circle ? new Circle(info.hw) : new Box(info.hw, info.hh)
  }

  /** Throws the next sack. Returns false if there is none or the round is over. */
  fire(angleDeg: number, power: number, tap?: number): boolean {
    if (this.status !== 'play') return false
    const ammo = this.nextAmmo
    if (!ammo) return false
    const a = (Math.max(0, Math.min(85, angleDeg)) * Math.PI) / 180
    const pw = Math.max(MIN_POWER, Math.min(1, power))
    const v = SPEED_MAX * pw
    const info = AMMO[ammo]
    const body = this.world.createBody({ type: 'dynamic', position: new Vec2(CATAPULT.x, CATAPULT.y), bullet: true, linearDamping: 0, angularDamping: ammo === 'fass' ? 0.05 : 0.1 })
    body.createFixture({ shape: this.shape(info), density: info.density, friction: info.friction, restitution: info.restitution })
    body.setLinearVelocity(new Vec2(Math.cos(a) * v, Math.sin(a) * v))
    body.setAngularVelocity(ammo === 'fass' ? -6 : ammo === 'aehren' ? -2 : -4)
    this.makeProj(ammo, body, tap ?? null, info.grain)
    this.used++
    this.sinceShot = 0
    this.events.push({ t: 'launch', ammo, x: CATAPULT.x, y: CATAPULT.y })
    return true
  }

  /** The child taps while a sack is in the air: the newest one that has its ability left (the plain sack has none). */
  tap(): boolean {
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!
      if (this.canTap(p)) {
        this.trigger(p)
        return true
      }
    }
    return false
  }

  private canTap(p: Proj): boolean {
    return !p.dead && !p.used && p.hits === 0 && !p.piece && p.ammo !== 'sack' && p.age > 0.05
  }

  /** Is there a sack in the air that a tap would do something to? */
  get tappable(): boolean {
    return this.projs.some((p) => this.canTap(p))
  }

  /** The sack that a tap would work on (the newest), or null. */
  get tapTarget(): Proj | null {
    for (let i = this.projs.length - 1; i >= 0; i--) if (this.canTap(this.projs[i]!)) return this.projs[i]!
    return null
  }

  private trigger(p: Proj) {
    if (!p.body || p.used) return
    const pos = p.body.getPosition()
    const v = p.body.getLinearVelocity()
    const speed = Math.hypot(v.x, v.y)
    const ang = Math.atan2(v.y, v.x)
    p.used = true
    if (p.ammo === 'schwer') {
      // the heavy sack plunges: almost straight down, fast
      this.events.push({ t: 'slam', x: pos.x, y: pos.y })
      p.body.setLinearVelocity(new Vec2(v.x * 0.2, -Math.min(22, Math.max(15, speed * 1.15))))
      p.body.setAngularVelocity(0)
    } else if (p.ammo === 'fass') {
      // the barrel gets a push forward
      this.events.push({ t: 'boost', x: pos.x, y: pos.y })
      p.body.setLinearVelocity(new Vec2(v.x + 6, v.y * 0.6))
    } else if (p.ammo === 'luft') {
      // the goatskin bag swells up: bigger, and it floats for a moment
      this.events.push({ t: 'inflate', x: pos.x, y: pos.y })
      const fx = p.body.getFixtureList() as Fixture
      p.body.destroyFixture(fx)
      p.body.createFixture({ shape: new Circle(0.62), density: 0.45, friction: 0.6, restitution: 0.3 })
      p.float = FLOAT_SECONDS
      p.body.setGravityScale(0.18)
      p.body.setLinearVelocity(new Vec2(v.x * 0.8, v.y * 0.4))
    } else if (p.ammo === 'aehren') {
      // the bundle of ears splits into three small bundles
      this.events.push({ t: 'split', x: pos.x, y: pos.y })
      this.killProj(p)
      for (const d of [-0.22, 0, 0.22]) {
        const body = this.world.createBody({ type: 'dynamic', position: new Vec2(pos.x, pos.y + d * 1.8), bullet: true, angularDamping: 0.1 })
        body.createFixture({ shape: new Box(PIECE.hw, PIECE.hh), density: 1.0, friction: 0.7, restitution: 0.05, filterGroupIndex: -2 })
        body.setLinearVelocity(new Vec2(Math.cos(ang + d) * speed, Math.sin(ang + d) * speed))
        body.setAngularVelocity(-3 + d * 6)
        const q = this.makeProj('aehren', body, null, PIECE.grain, true, true)
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

  private hurt(p: Part, dmg: number) {
    if (p.dead || dmg <= 0) return
    p.hp -= dmg
    if (p.hp <= 0) this.destroyPart(p)
  }

  private destroyPart(p: Part) {
    p.dead = true
    const c = p.body.getWorldCenter()
    const v = p.body.getLinearVelocity()
    const d = p.def
    this.events.push({ t: 'break', m: d.m, x: c.x, y: c.y, w: d.w, h: d.h, vx: v.x, vy: v.y })
    const pts = p.mat.pts
    if (pts > 0 && !d.grain) {
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
      }
    }
  }

  /** One step of 1/60 s. */
  step() {
    // wind and the speed before the step (for the heavy sack that goes through wood)
    for (const p of this.projs) {
      if (p.dead || !p.body) continue
      const v = p.body.getLinearVelocity()
      p.prevVx = v.x
      p.prevVy = v.y
      p.punched = false
      if (this.wind && p.hits === 0) p.body.applyForceToCenter(new Vec2(this.wind * p.body.getMass(), 0))
      p.age += DT
      if (p.float > 0) {
        p.float -= DT
        if (p.float <= 0) this.deflate(p)
      }
      if (p.tapAt !== null && !p.used && p.age >= p.tapAt && this.canTap(p)) this.trigger(p)
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
    this.updateParts()
    this.updateSilos()
    this.capSpeeds()
    if (this.status === 'won') this.sinceWin++
    if (this.status === 'play' && this.shotsLeft === 0 && !this.flying && this.quiet()) {
      this.quietSteps++
      if (this.quietSteps > 40) {
        this.status = 'lost'
        this.events.push({ t: 'lost' })
      }
    } else this.quietSteps = 0
  }

  /** The goatskin bag lets its air out: small again, normal weight. */
  private deflate(p: Proj) {
    if (!p.body) return
    const fx = p.body.getFixtureList() as Fixture
    p.body.destroyFixture(fx)
    p.body.createFixture({ shape: new Circle(AMMO.luft.hw), density: AMMO.luft.density, friction: 0.6, restitution: 0.3 })
    p.body.setGravityScale(1)
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
        if (me.kind === 'part') {
          if (me.dead) continue
          const fromProj = other.kind === 'proj'
          let k = fromProj ? AMMO[(other as Proj).ammo].hit : 0.7
          if (fromProj && (other as Proj).piece) k = 0.8
          if (fromProj && (other as Proj).ammo === 'schwer' && SOFT.includes(me.def.m)) k = 3.2
          const dmg = (n.i - me.mat.armor) * k
          if (dmg > 0) {
            this.hurt(me, dmg)
            if (fromProj && me.dead && (other as Proj).ammo === 'schwer') (other as Proj).punched = true
          }
          if (n.i > 2.2 && hitEvents < 3 && other.kind !== 'proj') {
            hitEvents++
            this.events.push({ t: 'hit', x: n.x, y: n.y, power: Math.min(1, n.i / 12), m: me.def.m })
          } else if (n.i > 1.2 && hitEvents < 3 && other.kind === 'proj') {
            hitEvents++
            this.events.push({ t: 'hit', x: n.x, y: n.y, power: Math.min(1, n.i / 12), m: me.def.m })
          }
        } else if (me.kind === 'proj') {
          if (me.dead || !me.body) continue
          me.hits++
          // a swollen bag that lands lets its air out at once
          if (me.float > 0) {
            me.float = 0
            this.deflate(me)
          }
          if (other.kind === 'ground' && n.i > 1.0 && hitEvents < 3) {
            hitEvents++
            this.events.push({ t: 'hit', x: n.x, y: n.y, power: Math.min(1, n.i / 10), m: 'sack' })
          }
        }
      }
    }
  }

  private updateProjs() {
    const water = this.def.water ?? []
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i]!
      if (!p.dead && p.body) {
        const pos = p.body.getPosition()
        if (p.punched) p.body.setLinearVelocity(new Vec2(p.prevVx * 0.82, p.prevVy * 0.82))
        let lost = false
        if (pos.y < -0.55) for (const w of water) if (pos.x > w.x0 && pos.x < w.x1) lost = true
        if (lost) {
          // fallen in the Nile: lost
          this.events.push({ t: 'splash', x: pos.x, y: 0 })
          this.killProj(p)
        } else if (pos.x > this.def.width + 30 || pos.x < -10 || pos.y < -4) this.killProj(p)
      }
    }
  }

  /** Parts that fall into the Nile disappear; parts that are pushed away from their place pay a few points once. */
  private updateParts() {
    const water = this.def.water ?? []
    for (const p of this.parts) {
      if (p.dead || p.def.fixed) continue
      const c = p.body.getPosition()
      if (c.y < -0.55) {
        let inWater = false
        for (const w of water) if (c.x > w.x0 && c.x < w.x1) inWater = true
        if (inWater || c.y < -4) {
          p.dead = true
          this.events.push({ t: 'splash', x: c.x, y: 0 })
          this.world.destroyBody(p.body)
          continue
        }
      }
      if (!p.moved && this.armed && !p.def.grain && Math.hypot(c.x - p.def.x, c.y - p.def.y) > 1.2 && !p.def.id) {
        p.moved = true
        this.score += MOVE_POINTS
        this.events.push({ t: 'points', x: c.x, y: c.y + 0.6, n: MOVE_POINTS })
      }
    }
  }

  /** Counts the grain in every granary (resting things inside the walls) and decides when one is full for good. */
  private updateSilos() {
    if (!this.armed) return
    for (const s of this.silos) {
      if (s.done) continue
      const d = s.def
      let fill = 0
      const inside = (x: number, y: number, body: Body) => {
        if (Math.abs(x - d.x) > d.w / 2 - 0.05 || y < d.y - 0.05 || y > d.y + d.h + 0.4) return false
        const v = body.getLinearVelocity()
        return v.x * v.x + v.y * v.y < 2.2
      }
      for (const p of this.projs) {
        if (p.dead || !p.body) continue
        const c = p.body.getPosition()
        if (inside(c.x, c.y, p.body)) fill += p.grain
      }
      for (const p of this.parts) {
        if (p.dead || !p.def.grain) continue
        const c = p.body.getPosition()
        if (inside(c.x, c.y, p.body)) fill += GRAIN.sheaf
      }
      s.fill = fill
      if (fill >= d.need - 1e-6) s.held++
      else s.held = 0
      if (s.held >= FULL_STEPS) {
        s.done = true
        const i = this.silos.indexOf(s)
        this.score += SILO_POINTS
        this.events.push({ t: 'silo', i, x: d.x, y: d.y + d.h })
        this.events.push({ t: 'points', x: d.x, y: d.y + d.h + 0.8, n: SILO_POINTS })
        if (this.status === 'play' && this.silos.every((q) => q.done)) {
          this.status = 'won'
          this.sinceWin = 0
          this.bonus = this.shotsLeft * BONUS_PER_SACK
          this.events.push({ t: 'won' })
        }
      }
    }
  }

  /** Nothing moves any more (all bodies sleep). */
  quiet(): boolean {
    for (let b = this.world.getBodyList(); b; b = b.getNext()) if (b.isDynamic() && b.isAwake()) return false
    return true
  }

  /** Is a sack still in the air (it has not touched anything yet)? */
  get flying(): boolean {
    return this.projs.some((p) => !p.dead && p.hits === 0 && p.age < 9)
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
