/**
 * "Moses Körbchen": the rules and the physics of the rope puzzle (no Vue, no drawing). The basket of Moses hangs on reed ropes; the finger cuts them with a swipe;
 * the basket swings, falls, slides and lands softly in the hands of the daughter of Pharaoh (Exodus 2). Three lotus blossoms on the way give the stars.
 *
 * Everything runs in a fixed time step (`DT`), nothing is random, so the same cuts at the same moments always give the same game (the tests rely on that).
 * The world is 360 x 600 units; the y axis points down; the water of the Nile lies at the bottom (`waterY`). Nobody can lose: a basket that sinks into the
 * water floats calmly and the child tries again.
 *
 * - Ropes: chains of points (Verlet) between a fixed anchor and the basket, kept at their length by iterating the distances.
 * - The basket: a circle with a weight; it slides on the ground (friction), bounces a little, and rolls on slopes.
 * - Things: walls (reed, rock, wood), round posts, feather cushions that bounce, flumes with a current (a belt), seesaws and flaps that tip, a water wheel that
 *   turns, ducks and fish that swim to and fro, bubbles that lift the basket until a tap pops them, fans that blow when tapped.
 */

export const W = 360
export const H = 600
export const DT = 1 / 120
export const GRAVITY = 1000
/** The radius of the basket. */
export const BASKET_R = 18
const ROPE_SEG = 13
const ROPE_IM = 22
const ITERS = 26
const CUT_RADIUS = 7
const STAR_REACH = BASKET_R + 15
const FADE_TIME = 1.1

// ── the description of a level (data) ───────────────────────────────────────────────────────────────────────────────────────

export type Surface = 'reed' | 'rock' | 'wood' | 'clay' | 'feder'

export interface SegDef {
  x1: number
  y1: number
  x2: number
  y2: number
  /** The half thickness of the wall. */
  t?: number
  kind?: Surface
  /** The bounce: 0.2 default; a feather cushion gives the basket a push up. */
  e?: number
  mu?: number
  /** A flume: the surface carries the basket along the wall in the direction (x1,y1) -> (x2,y2) with this speed (negative: the other way). */
  belt?: number
  /** The least speed that a cushion gives back (0 = not a cushion). */
  kick?: number
}

export interface CircleDef {
  x: number
  y: number
  r: number
  kind?: Surface
  e?: number
}

export interface RopeDef {
  ax: number
  ay: number
}

/** A seesaw (the board tips about its middle) or a flap (a board on a hinge at its end that springs back). Local coordinates: the pivot is the origin. */
export interface RotorDef {
  x: number
  y: number
  /** The board from (x1,y1) to (x2,y2) around the pivot, or the paddles of a wheel. */
  segs: { x1: number; y1: number; x2: number; y2: number; t?: number }[]
  /** A round hub of the wheel (radius), or 0. */
  hub?: number
  /** The start angle (radians, positive = clockwise on the screen). */
  a0: number
  minA?: number
  maxA?: number
  /** A wheel turns by itself with this speed (radians per second); a board gets its speed from the basket. */
  drive?: number
  /** The weight of a board (1 = like a basket at the end of the board). */
  heavy?: number
  /** A flap springs back to `a0` (strength). */
  spring?: number
  kind: 'seesaw' | 'flap' | 'wheel'
}

export interface MoverDef {
  /** The middle of the way. */
  x: number
  y: number
  /** The half way (the mover goes `x ± ax`, `y ± ay`). */
  ax: number
  ay: number
  period: number
  phase?: number
  /** The half length of its back. */
  hw: number
  /** The slope of its back (radians; positive = the right end is lower): the basket slides off on that side. */
  tilt?: number
  /** The grip of its back (a duck 0.8, a fish 0.15). */
  mu?: number
  kind: 'duck' | 'fish'
}

export interface BubbleDef {
  x: number
  y: number
  /** The sideways speed of the bubble while it carries the basket (units per second, positive = right). */
  drift?: number
}

export interface FanDef {
  x: number
  y: number
  /** The direction of the wind, radians (0 = right, positive = down on the screen). */
  angle: number
}

export interface Cut {
  rope: number
  /** The time (seconds after the start) at which the swipe crosses the rope. */
  t: number
}

export interface Tap {
  /** The time in seconds. */
  t: number
  x?: number
  y?: number
  /** The number of the bubble that carries the basket (the tap goes where it is now). */
  bubble?: number
  /** The number of the fan that is tapped. */
  fan?: number
}

/** A way to win that is stored with the level (the tests play it in the simulator). */
export interface Solution {
  name: string
  cuts: Cut[]
  taps?: Tap[]
  /** The stars that the way has to win (the tests check at least this). */
  stars: number
}

export interface LevelDef {
  chapter: number
  /** The number inside the chapter (0 to 9). */
  index: number
  /** The hint that is shown once when a new thing appears. */
  intro?: string
  basket: { x: number; y: number }
  ropes: RopeDef[]
  segs?: SegDef[]
  circles?: CircleDef[]
  rotors?: RotorDef[]
  movers?: MoverDef[]
  bubbles?: BubbleDef[]
  fans?: FanDef[]
  /** The three lotus blossoms. */
  stars: { x: number; y: number }[]
  /** The place where the daughter of Pharaoh (or the reed nest) catches the basket. */
  target: { x: number; y: number; r: number; figure: 'nest' | 'mirjam' | 'tochter' }
  /** The place of the figures that cheer: [mother, Miriam, ...]. */
  cheer?: { x: number; y: number; who: 'mutter' | 'mirjam' }[]
  waterY?: number
  /** The ways to win, the first one is the one that the tip shows. */
  solutions: Solution[]
}

// ── the state ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface Pt {
  x: number
  y: number
  px: number
  py: number
  /** The inverse mass (0 = fixed). */
  im: number
}

export interface Rope {
  /** The number of the rope in the level (a cut piece keeps it). */
  id: number
  pts: Pt[]
  rest: number
  /** The first point is fixed to the anchor. */
  anchored: boolean
  /** The last point is the basket. */
  joined: boolean
  /** Still holds the basket (not a cut piece). */
  live: boolean
  /** A cut piece fades out (1 = full). */
  fade: number
}

export interface Collider {
  x1: number
  y1: number
  x2: number
  y2: number
  t: number
  e: number
  mu: number
  belt: number
  kick: number
  kind: Surface
  /** The speed of the surface (a duck, a wheel). */
  vx: number
  vy: number
  rotor: RotorState | null
}

export interface RotorState {
  def: RotorDef
  angle: number
  omega: number
  inertia: number
  /** The colliders of this rotor (the board or the paddles), moved at each step. */
  cols: Collider[]
  hub: Collider | null
}

export interface MoverState {
  def: MoverDef
  x: number
  y: number
  vx: number
  vy: number
  col: Collider
}

export interface BubbleState {
  def: BubbleDef
  x: number
  y: number
  state: 'free' | 'carry' | 'popped'
  r: number
}

export interface FanState {
  def: FanDef
  /** The seconds that it still blows. */
  on: number
  cool: number
}

export type GameEvent =
  | { t: 'cut'; x: number; y: number }
  | { t: 'star'; i: number; x: number; y: number }
  | { t: 'bubble'; x: number; y: number }
  | { t: 'pop'; x: number; y: number }
  | { t: 'fan'; i: number }
  | { t: 'bounce'; x: number; y: number; speed: number }
  | { t: 'land'; x: number; y: number; speed: number }
  | { t: 'caught' }
  | { t: 'win' }
  | { t: 'splash'; x: number; y: number }

export type Status = 'play' | 'caught' | 'won' | 'splash'

export interface Game {
  def: LevelDef
  t: number
  /** The rest of time that is left over from the last `step` (less than `DT`). */
  acc: number
  status: Status
  basket: Pt & { tilt: number }
  ropes: Rope[]
  statics: Collider[]
  rotors: RotorState[]
  movers: MoverState[]
  bubbles: BubbleState[]
  fans: FanState[]
  got: boolean[]
  /** The seconds that the basket has hardly moved without a rope that holds it. */
  calm: number
  /** The basket sits still and nothing holds it: the child can start again (the game does not end). */
  stuck: boolean
  /** The seconds since the basket was caught. */
  caughtT: number
  waterY: number
  events: GameEvent[]
  /** The last contact of the basket (for the lean). */
  contactN: { x: number; y: number } | null
  cuts: number
}

// ── building the game ───────────────────────────────────────────────────────────────────────────────────────────────────────

function makeCollider(s: Partial<Collider> & { x1: number; y1: number; x2: number; y2: number }): Collider {
  return { t: 4, e: 0.2, mu: 0.25, belt: 0, kick: 0, kind: 'reed', vx: 0, vy: 0, rotor: null, ...s }
}

const SURFACE_MU: Record<Surface, number> = { reed: 0.3, rock: 0.3, wood: 0.15, clay: 0.45, feder: 0.5 }

export function segToCollider(s: SegDef): Collider {
  const kind = s.kind ?? 'reed'
  return makeCollider({
    x1: s.x1,
    y1: s.y1,
    x2: s.x2,
    y2: s.y2,
    t: s.t ?? 5,
    kind,
    e: s.e ?? (s.kick ? 0.9 : 0.18),
    mu: s.mu ?? SURFACE_MU[kind],
    belt: s.belt ?? 0,
    kick: s.kick ?? 0
  })
}

function ropePoints(ax: number, ay: number, b: Pt): Rope['pts'] {
  const dx = b.x - ax
  const dy = b.y - ay
  const dist = Math.hypot(dx, dy)
  const n = Math.max(3, Math.round(dist / ROPE_SEG))
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const k = i / n
    const x = ax + dx * k
    const y = ay + dy * k
    pts.push({ x, y, px: x, py: y, im: i === 0 ? 0 : ROPE_IM })
  }
  pts.push(b)
  return pts
}

export function makeGame(def: LevelDef): Game {
  const basket = { x: def.basket.x, y: def.basket.y, px: def.basket.x, py: def.basket.y, im: 1, tilt: 0 }
  const ropes: Rope[] = def.ropes.map((r, id) => {
    const pts = ropePoints(r.ax, r.ay, basket)
    const rest = Math.hypot(basket.x - r.ax, basket.y - r.ay) / (pts.length - 1)
    return { id, pts, rest, anchored: true, joined: true, live: true, fade: 1 }
  })
  const statics = (def.segs ?? []).map(segToCollider)
  for (const c of def.circles ?? []) {
    statics.push(makeCollider({ x1: c.x, y1: c.y, x2: c.x, y2: c.y, t: c.r, kind: c.kind ?? 'rock', e: c.e ?? 0.25, mu: SURFACE_MU[c.kind ?? 'rock'] }))
  }
  const rotors: RotorState[] = (def.rotors ?? []).map((d) => {
    const reach = Math.max(1, ...d.segs.map((s) => Math.max(Math.hypot(s.x1, s.y1), Math.hypot(s.x2, s.y2))))
    const heavy = d.heavy ?? 1.4
    const st: RotorState = {
      def: d,
      angle: d.a0,
      omega: d.drive ?? 0,
      inertia: heavy * reach * reach * 0.6,
      cols: d.segs.map((s) =>
        makeCollider({ x1: 0, y1: 0, x2: 0, y2: 0, t: s.t ?? 5, kind: d.kind === 'wheel' ? 'wood' : 'wood', e: 0.12, mu: 0.45 })
      ),
      hub: d.hub ? makeCollider({ x1: d.x, y1: d.y, x2: d.x, y2: d.y, t: d.hub, kind: 'wood', e: 0.15, mu: 0.4 }) : null
    }
    st.cols.forEach((c) => (c.rotor = st))
    if (st.hub) st.hub.rotor = st
    placeRotor(st)
    return st
  })
  const movers: MoverState[] = (def.movers ?? []).map((d) => {
    const m: MoverState = { def: d, x: d.x, y: d.y, vx: 0, vy: 0, col: makeCollider({ x1: 0, y1: 0, x2: 0, y2: 0, t: 5, kind: 'wood', e: 0.12, mu: d.mu ?? (d.kind === 'fish' ? 0.15 : 0.8) }) }
    placeMover(m, 0)
    return m
  })
  const g: Game = {
    def,
    t: 0,
    acc: 0,
    status: 'play',
    basket,
    ropes,
    statics,
    rotors,
    movers,
    bubbles: (def.bubbles ?? []).map((b) => ({ def: b, x: b.x, y: b.y, state: 'free', r: 27 })),
    fans: (def.fans ?? []).map((f) => ({ def: f, on: 0, cool: 0 })),
    got: def.stars.map(() => false),
    calm: 0,
    stuck: false,
    caughtT: 0,
    waterY: def.waterY ?? 548,
    events: [],
    contactN: null,
    cuts: 0
  }
  settle(g)
  return g
}

/** The ropes sag a little around the basket before the child may cut (the basket stays where the level puts it). */
function settle(g: Game) {
  const b = g.basket
  const keep = b.im
  b.im = 0
  for (let i = 0; i < 160; i++) {
    for (const r of g.ropes) integrateRope(r, 0.5)
    solveRopes(g)
  }
  b.im = keep
  b.px = b.x
  b.py = b.y
  for (const r of g.ropes) for (const p of r.pts) {
    p.px = p.x
    p.py = p.y
  }
}

function placeRotor(r: RotorState) {
  const c = Math.cos(r.angle)
  const s = Math.sin(r.angle)
  const d = r.def
  r.cols.forEach((col, i) => {
    const sg = d.segs[i]!
    col.x1 = d.x + sg.x1 * c - sg.y1 * s
    col.y1 = d.y + sg.x1 * s + sg.y1 * c
    col.x2 = d.x + sg.x2 * c - sg.y2 * s
    col.y2 = d.y + sg.x2 * s + sg.y2 * c
  })
}

function placeMover(m: MoverState, t: number) {
  const d = m.def
  const w = (Math.PI * 2) / d.period
  const ph = w * t + (d.phase ?? 0)
  m.x = d.x + d.ax * Math.sin(ph)
  m.y = d.y + d.ay * Math.sin(ph)
  m.vx = d.ax * w * Math.cos(ph)
  m.vy = d.ay * w * Math.cos(ph)
  const c = m.col
  const tl = d.tilt ?? 0
  const cx = Math.cos(tl) * d.hw
  const sy = Math.sin(tl) * d.hw
  c.x1 = m.x - cx
  c.x2 = m.x + cx
  c.y1 = m.y - sy
  c.y2 = m.y + sy
  c.vx = m.vx
  c.vy = m.vy
}

// ── the steps ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

function integrateRope(r: Rope, gk = 1) {
  const g = GRAVITY * DT * DT * gk
  for (const p of r.pts) {
    if (p.im === 0) continue
    if (r.joined && p === r.pts[r.pts.length - 1]) continue
    const vx = (p.x - p.px) * 0.9990
    const vy = (p.y - p.py) * 0.9990
    p.px = p.x
    p.py = p.y
    p.x += vx
    p.y += vy + g
  }
}

function solveSeg(a: Pt, b: Pt, rest: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.hypot(dx, dy) || 1e-6
  const w = a.im + b.im
  if (w === 0) return
  const k = (d - rest) / d / w
  a.x += dx * k * a.im
  a.y += dy * k * a.im
  b.x -= dx * k * b.im
  b.y -= dy * k * b.im
}

function solveRopes(g: Game, flip = false) {
  for (const r of g.ropes) {
    const n = r.pts.length - 1
    if (flip) for (let i = n - 1; i >= 0; i--) solveSeg(r.pts[i]!, r.pts[i + 1]!, r.rest)
    else for (let i = 0; i < n; i++) solveSeg(r.pts[i]!, r.pts[i + 1]!, r.rest)
  }
}

function closest(c: Collider, px: number, py: number, out: { x: number; y: number }) {
  const dx = c.x2 - c.x1
  const dy = c.y2 - c.y1
  const l2 = dx * dx + dy * dy
  let k = l2 > 1e-9 ? ((px - c.x1) * dx + (py - c.y1) * dy) / l2 : 0
  k = k < 0 ? 0 : k > 1 ? 1 : k
  out.x = c.x1 + dx * k
  out.y = c.y1 + dy * k
}

const CP = { x: 0, y: 0 }

/** The basket against one wall. Returns the speed with which it hit (0 = no contact). */
function collide(g: Game, c: Collider, respond: boolean): number {
  const b = g.basket
  closest(c, b.x, b.y, CP)
  let nx = b.x - CP.x
  let ny = b.y - CP.y
  const d = Math.hypot(nx, ny)
  const minD = BASKET_R + c.t
  if (d >= minD) return 0
  if (d < 1e-6) {
    // exactly on the line: push out to the upper side of the wall
    const lx = c.x2 - c.x1
    const ly = c.y2 - c.y1
    const ll = Math.hypot(lx, ly) || 1
    nx = ly / ll
    ny = -lx / ll
    if (ny > 0) {
      nx = -nx
      ny = -ny
    }
  } else {
    nx /= d
    ny /= d
  }
  const pen = minD - d
  let vx = (b.x - b.px) / DT
  let vy = (b.y - b.py) / DT
  b.x += nx * pen
  b.y += ny * pen
  g.contactN = { x: nx, y: ny }
  let hit = 0
  if (respond) {
    // the speed of the wall at the point of contact
    let wvx = c.vx
    let wvy = c.vy
    let rx = 0
    let ry = 0
    const rot = c.rotor
    if (rot) {
      rx = CP.x - rot.def.x
      ry = CP.y - rot.def.y
      wvx = -rot.omega * ry
      wvy = rot.omega * rx
    }
    const rvx = vx - wvx
    const rvy = vy - wvy
    const vn = rvx * nx + rvy * ny
    if (vn < 0) {
      hit = -vn
      let target: number
      if (c.kick > 0) target = Math.max(-vn * c.e, c.kick)
      else target = -vn < 50 ? 0 : -vn * c.e
      const dvn = target - vn
      let jn = dvn
      let rxn = 0
      if (rot && rot.def.kind !== 'wheel') {
        rxn = rx * ny - ry * nx
        jn = dvn / (1 + (rxn * rxn) / rot.inertia)
      }
      vx += jn * nx
      vy += jn * ny
      if (rot && rot.def.kind !== 'wheel') rot.omega += (-rxn * jn) / rot.inertia
      // friction along the wall
      const tx = -ny
      const ty = nx
      const vt = (vx - wvx) * tx + (vy - wvy) * ty
      let want = -vt
      if (c.belt) {
        const wl = Math.hypot(c.x2 - c.x1, c.y2 - c.y1) || 1
        const sgn = Math.sign((tx * (c.x2 - c.x1) + ty * (c.y2 - c.y1)) / wl) || 1
        want = c.belt * sgn - vt
      }
      const maxF = c.belt ? Math.max(jn * c.mu, 24) : jn * c.mu
      const f = want > maxF ? maxF : want < -maxF ? -maxF : want
      vx += f * tx
      vy += f * ty
      if (rot && rot.def.kind !== 'wheel') {
        const rxt = rx * ty - ry * tx
        rot.omega += (-rxt * f) / rot.inertia
      }
    }
  }
  b.px = b.x - vx * DT
  b.py = b.y - vy * DT
  return hit
}

function collideAll(g: Game, respond: boolean) {
  let hit = 0
  let hx = 0
  let hy = 0
  let bounced = false
  const b = g.basket
  for (const c of g.statics) {
    const h = collide(g, c, respond)
    if (h > hit) {
      hit = h
      hx = b.x
      hy = b.y
      bounced = c.kick > 0
    }
  }
  for (const r of g.rotors) {
    for (const c of r.cols) {
      const h = collide(g, c, respond)
      if (h > hit) {
        hit = h
        hx = b.x
        hy = b.y
        bounced = false
      }
    }
    if (r.hub) collide(g, r.hub, respond)
  }
  for (const m of g.movers) {
    const h = collide(g, m.col, respond)
    if (h > hit) {
      hit = h
      hx = b.x
      hy = b.y
    }
  }
  // the bank at the sides and the sky at the top
  const vx = (b.x - b.px) / DT
  if (b.x < BASKET_R) {
    b.x = BASKET_R
    if (respond && vx < 0) b.px = b.x + vx * DT * 0.3
  } else if (b.x > W - BASKET_R) {
    b.x = W - BASKET_R
    if (respond && vx > 0) b.px = b.x + vx * DT * 0.3
  }
  if (b.y < BASKET_R) {
    b.y = BASKET_R
    b.py = b.y
  }
  if (respond && hit > 90) g.events.push(bounced ? { t: 'bounce', x: hx, y: hy, speed: hit } : { t: 'land', x: hx, y: hy, speed: hit })
}

function moveThings(g: Game) {
  for (const r of g.rotors) {
    const d = r.def
    if (d.kind === 'wheel') {
      r.angle += (d.drive ?? 0) * DT
    } else {
      if (d.spring) r.omega += -d.spring * (r.angle - d.a0) * DT
      r.omega *= 1 - Math.min(1, 2.2 * DT)
      r.angle += r.omega * DT
      const lo = d.minA ?? -0.45
      const hi = d.maxA ?? 0.45
      if (r.angle > hi) {
        r.angle = hi
        r.omega = r.omega > 0 ? -r.omega * 0.15 : r.omega
      } else if (r.angle < lo) {
        r.angle = lo
        r.omega = r.omega < 0 ? -r.omega * 0.15 : r.omega
      }
    }
    placeRotor(r)
  }
  for (const m of g.movers) placeMover(m, g.t)
  for (const f of g.fans) {
    if (f.on > 0) f.on = Math.max(0, f.on - DT)
    else if (f.cool > 0) f.cool = Math.max(0, f.cool - DT)
  }
  for (let i = 0; i < g.bubbles.length; i++) {
    const bb = g.bubbles[i]!
    if (bb.state === 'free') bb.y = bb.def.y + Math.sin(g.t * 1.6 + i * 1.7) * 4
  }
}

export function stepOnce(g: Game) {
  if (g.status === 'won' || g.status === 'splash') {
    // the world goes on a little (pieces of rope fall), the basket rests
    fadePieces(g)
    return
  }
  g.t += DT
  moveThings(g)
  const b = g.basket
  g.contactN = null

  // the forces on the basket
  let ax = 0
  let ay = GRAVITY
  let drag = 0.9997
  let carried: BubbleState | null = null
  for (const bb of g.bubbles) if (bb.state === 'carry') carried = bb
  if (carried) {
    ay = 0
    drag = 0.955
  }
  for (const f of g.fans) {
    if (f.on <= 0) continue
    const ca = Math.cos(f.def.angle)
    const sa = Math.sin(f.def.angle)
    const dx = b.x - f.def.x
    const dy = b.y - f.def.y
    const u = dx * ca + dy * sa
    const v = -dx * sa + dy * ca
    if (u > 0 && u < FAN_RANGE && Math.abs(v) < FAN_WIDTH + u * 0.35) {
      const k = 1 - (u / FAN_RANGE) * 0.55
      ax += ca * FAN_POWER * k
      ay += sa * FAN_POWER * k
    }
  }

  if (g.status === 'caught') {
    // the hands take the basket: it glides softly to the middle
    g.caughtT += DT
    const tx = g.def.target.x
    const ty = g.def.target.y
    b.px = b.x
    b.py = b.y
    b.x += (tx - b.x) * 0.06
    b.y += (ty - b.y) * 0.06
    for (const r of g.ropes) integrateRope(r)
    if (g.caughtT > 0.9) {
      g.status = 'won'
      g.events.push({ t: 'win' })
    }
    fadePieces(g)
    return
  }

  // integrate the basket and the ropes
  {
    let vx = (b.x - b.px) * drag
    let vy = (b.y - b.py) * drag
    if (carried) vy += (-CARRY_SPEED * DT - vy) * 0.2
    if (carried) vx += ((carried.def.drift ?? 0) * DT - vx) * 0.2
    b.px = b.x
    b.py = b.y
    b.x += vx + ax * DT * DT
    b.y += vy + ay * DT * DT
  }
  for (const r of g.ropes) integrateRope(r)

  for (let it = 0; it < ITERS; it++) {
    solveRopes(g, (it & 1) === 1)
    if (it === ITERS - 4) collideAll(g, true)
    else if (it > ITERS - 4) collideAll(g, false)
  }

  // the bubbles
  for (const bb of g.bubbles) {
    if (bb.state === 'free') {
      if (Math.hypot(b.x - bb.x, b.y - bb.y) < bb.r + 4) {
        bb.state = 'carry'
        g.events.push({ t: 'bubble', x: bb.x, y: bb.y })
      }
    } else if (bb.state === 'carry') {
      bb.x += (b.x - bb.x) * 0.3
      bb.y += (b.y - 3 - bb.y) * 0.3
    }
  }

  // the lotus blossoms
  const sp = g.def.stars
  for (let i = 0; i < sp.length; i++) {
    if (g.got[i]) continue
    if (Math.hypot(b.x - sp[i]!.x, b.y - sp[i]!.y) < STAR_REACH) {
      g.got[i] = true
      g.events.push({ t: 'star', i, x: sp[i]!.x, y: sp[i]!.y })
    }
  }

  // the hands: the basket is in the place of the daughter of Pharaoh
  const tg = g.def.target
  if (Math.hypot(b.x - tg.x, b.y - tg.y) < tg.r) {
    g.status = 'caught'
    g.caughtT = 0
    releaseRopes(g)
    for (const bb of g.bubbles) if (bb.state === 'carry') bb.state = 'popped'
    g.events.push({ t: 'caught' })
  } else if (b.y > g.waterY) {
    g.status = 'splash'
    g.events.push({ t: 'splash', x: b.x, y: g.waterY })
  }

  // does the basket hang, swing or sit still without any help?
  const speed = Math.hypot(b.x - b.px, b.y - b.py) / DT
  const holds = g.ropes.some((r) => r.live && r.joined)
  if (speed < 8 && !holds && !carried) {
    g.calm += DT
    if (g.calm > 2.5) g.stuck = true
  } else {
    g.calm = 0
    g.stuck = false
  }

  // the lean of the basket (cosmetic, but the drawing uses it)
  let want = Math.max(-0.5, Math.min(0.5, (b.x - b.px) / DT / 420))
  const cn = g.contactN as { x: number; y: number } | null
  if (cn) want = Math.max(-0.45, Math.min(0.45, Math.atan2(cn.x, -cn.y)))
  b.tilt += (want - b.tilt) * 0.12
  fadePieces(g)
}

const FAN_RANGE = 190
const FAN_WIDTH = 46
const FAN_POWER = 1700
const FAN_TIME = 0.75
const CARRY_SPEED = 55

function fadePieces(g: Game) {
  for (let i = g.ropes.length - 1; i >= 0; i--) {
    const r = g.ropes[i]!
    if (r.live) continue
    r.fade -= DT / FADE_TIME
    if (r.fade <= 0) {
      g.ropes.splice(i, 1)
      continue
    }
    integrateRope(r)
    for (let k = 0; k < 6; k++) {
      const n = r.pts.length - 1
      for (let j = 0; j < n; j++) solveSeg(r.pts[j]!, r.pts[j + 1]!, r.rest)
    }
  }
}

/** When the hands take the basket, every rope that still holds it lets go (the mother unties it). */
function releaseRopes(g: Game) {
  for (const r of g.ropes.slice()) if (r.live && r.joined) splitRope(g, r, r.pts.length - 2)
}

/** Runs the game for `dt` seconds (in steps of `DT`; what is left over waits for the next call). */
export function step(g: Game, dt: number) {
  g.acc += dt
  let guard = 0
  while (g.acc >= DT && guard++ < 600) {
    g.acc -= DT
    stepOnce(g)
  }
}

// ── the finger ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

function segDist(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): number {
  // the least distance between the segments a-b and c-d (they cross: 0)
  const d1x = bx - ax
  const d1y = by - ay
  const d2x = dx - cx
  const d2y = dy - cy
  const den = d1x * d2y - d1y * d2x
  if (Math.abs(den) > 1e-9) {
    const s = ((cx - ax) * d2y - (cy - ay) * d2x) / den
    const u = ((cx - ax) * d1y - (cy - ay) * d1x) / den
    if (s >= 0 && s <= 1 && u >= 0 && u <= 1) return 0
  }
  return Math.min(pointSeg(ax, ay, cx, cy, dx, dy), pointSeg(bx, by, cx, cy, dx, dy), pointSeg(cx, cy, ax, ay, bx, by), pointSeg(dx, dy, ax, ay, bx, by))
}

function pointSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  let k = l2 > 1e-9 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0
  k = k < 0 ? 0 : k > 1 ? 1 : k
  return Math.hypot(px - (x1 + dx * k), py - (y1 + dy * k))
}

/** A swipe from (x1,y1) to (x2,y2) (a tap is a swipe of length 0): cuts the ropes it touches. Returns the number of ropes that were cut. */
export function cutAt(g: Game, x1: number, y1: number, x2: number, y2: number): number {
  if (g.status !== 'play') return 0
  let n = 0
  for (const r of g.ropes.slice()) {
    if (!r.live) continue
    for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i]!
      const c = r.pts[i + 1]!
      if (segDist(x1, y1, x2, y2, a.x, a.y, c.x, c.y) <= CUT_RADIUS) {
        splitRope(g, r, i)
        n++
        g.events.push({ t: 'cut', x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 })
        break
      }
    }
  }
  g.cuts += n
  return n
}

function splitRope(g: Game, r: Rope, at: number) {
  // the piece at the anchor stays hanging (and fades), the piece at the basket falls away from it
  const top = r.pts.slice(0, at + 1)
  const bottom = r.pts.slice(at + 1)
  const last = bottom[bottom.length - 1]!
  bottom[bottom.length - 1] = { x: last.x, y: last.y, px: last.px, py: last.py, im: ROPE_IM }
  const i = g.ropes.indexOf(r)
  const pieceA: Rope = { id: r.id, pts: top, rest: r.rest, anchored: true, joined: false, live: false, fade: 1 }
  const pieceB: Rope = { id: r.id, pts: bottom, rest: r.rest, anchored: false, joined: false, live: false, fade: 1 }
  // the free end of the top piece must move: only its first point is fixed
  g.ropes.splice(i, 1, pieceA, pieceB)
}

/** A tap: pops the bubble that carries the basket, or switches a fan on. Returns true when something happened. */
export function tap(g: Game, x: number, y: number): boolean {
  if (g.status !== 'play') return false
  for (const bb of g.bubbles) {
    if (bb.state === 'carry' && Math.hypot(x - bb.x, y - bb.y) < bb.r * 1.9) {
      bb.state = 'popped'
      g.events.push({ t: 'pop', x: bb.x, y: bb.y })
      return true
    }
  }
  for (let i = 0; i < g.fans.length; i++) {
    const f = g.fans[i]!
    if (f.on <= 0 && f.cool <= 0 && Math.hypot(x - f.def.x, y - f.def.y) < 44) {
      f.on = FAN_TIME
      f.cool = FAN_TIME * 0.6
      g.events.push({ t: 'fan', i })
      return true
    }
  }
  return false
}

export const ROPE_ANCHOR = (g: Game, id: number): { x: number; y: number } => ({ x: g.def.ropes[id]!.ax, y: g.def.ropes[id]!.ay })

/** Is rope `id` still holding the basket? */
export function ropeHolds(g: Game, id: number): boolean {
  return g.ropes.some((r) => r.live && r.id === id)
}

export function starCount(g: Game): number {
  return g.got.filter(Boolean).length
}

/** The stars of a won round: one for the landing, and one more for each lotus blossom after the first (1 to 3). */
export function starsOf(g: Game): number {
  return g.status === 'won' || g.status === 'caught' ? Math.max(1, starCount(g)) : 0
}

/** The speed of the basket (units per second), for the drawing. */
export function basketSpeed(g: Game): number {
  return Math.hypot(g.basket.x - g.basket.px, g.basket.y - g.basket.py) / DT
}

/**
 * Plays a stored solution (cuts and taps at their moments) until the basket is caught, sinks, or `maxSeconds` have passed.
 * `shift` moves every moment (to test that a way does not need exact timing).
 */
export function play(def: LevelDef, sol: Solution, opts: { shift?: number; maxSeconds?: number; jitter?: (i: number) => number } = {}): Game {
  const g = makeGame(def)
  const max = opts.maxSeconds ?? 30
  const ev: { t: number; kind: 'cut' | 'tap'; rope?: number; tap?: Tap }[] = [
    ...sol.cuts.map((c, i) => ({ t: c.t + (opts.shift ?? 0) + (opts.jitter ? opts.jitter(i) : 0), kind: 'cut' as const, rope: c.rope })),
    ...(sol.taps ?? []).map((c) => ({ t: c.t + (opts.shift ?? 0), kind: 'tap' as const, tap: c }))
  ].sort((a, b) => a.t - b.t)
  let k = 0
  while (g.t < max && g.status !== 'won' && g.status !== 'splash' && !g.stuck) {
    while (k < ev.length && ev[k]!.t <= g.t + 1e-9) {
      const e = ev[k++]!
      if (e.kind === 'cut') cutRope(g, e.rope!)
      else tapThing(g, e.tap!)
    }
    stepOnce(g)
  }
  return g
}

/** Plays a stored tap (on the bubble or the fan that it names, or at a place). */
export function tapThing(g: Game, q: Tap): boolean {
  if (q.bubble !== undefined) {
    const bb = g.bubbles[q.bubble]
    return bb ? tap(g, bb.x, bb.y) : false
  }
  if (q.fan !== undefined) {
    const f = g.fans[q.fan]
    return f ? tap(g, f.def.x, f.def.y) : false
  }
  return tap(g, q.x ?? -99, q.y ?? -99)
}

/** Cuts rope `id` in the middle (what a swipe across it does). */
export function cutRope(g: Game, id: number): boolean {
  const r = g.ropes.find((q) => q.live && q.id === id)
  if (!r) return false
  const m = Math.floor((r.pts.length - 1) / 2)
  const a = r.pts[m]!
  const c = r.pts[m + 1]!
  return cutAt(g, a.x - 3, a.y - 3, c.x + 3, c.y + 3) > 0 || cutAt(g, (a.x + c.x) / 2, (a.y + c.y) / 2, (a.x + c.x) / 2, (a.y + c.y) / 2) > 0
}
