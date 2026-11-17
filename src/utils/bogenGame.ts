/**
 * "Jonatans Pfeile": the rules and the physics of the archery game (no Vue, so it can be tested; deterministic: the same shots at the same times
 * always give the same game). The world is a side view in units of about one metre, the ground lies at y = 0, y points up. The archer stands at
 * the left; an arrow is a point (its tip) that flies under gravity and wind and is tested against the walls, the targets and the ropes along its
 * path in every little step (1/120 s). Everything that moves (swinging bells, sliding targets, falling weights, sinking gates) is a function of
 * the time or of the steps, nothing is random.
 */

export const DT = 1 / 120
export const GRAV = 10
/** The speed of an arrow at the full pull, in units per second. */
export const V_MAX = 27
/** The smallest pull that lets the arrow go (a smaller pull is "put back"). */
export const F_MIN = 0.12
export const ANG_MIN = -25
export const ANG_MAX = 88
/** The shoulder of the archer from his feet, the length of his arm to the grip and how far the arrow tip stands ahead of the grip. */
export const SHOULDER = { x: 0.25, y: 1.45 }
export const ARM = 0.85
export const TIP_AHEAD = 0.55
/** The hit zone of a round thing is a little bigger than its picture. */
export const HIT_ZONE = 1.12
export const WORLD_BOTTOM = -8
/** Spare arrows on top of the par for each chapter (two or more arrows left at the end give three stars). */
export const SUPPLY_EXTRA = [5, 4, 4, 3]

export type Mat = 'dirt' | 'wood' | 'stone' | 'shield'
export interface Poly {
  pts: [number, number][]
  mat: Mat
}

export type Effect = { t: 'open'; id: string } | { t: 'drop'; id: string }

export type Motion =
  | { k: 'slide'; x0: number; y0: number; x1: number; y1: number; period: number; phase: number }
  | { k: 'swing'; px: number; py: number; len: number; amp: number; period: number; phase: number }

export type ItemKind = 'target' | 'bell' | 'jar' | 'flag' | 'switch'
export interface ItemDef {
  id: string
  kind: ItemKind
  x: number
  y: number
  r: number
  /** Has to be done to win (target, bell, jar, flag: yes; switch: no). */
  need?: boolean
  motion?: Motion
  then?: Effect[]
  /** A look for the picture: a target on a cart, a flag on a pole ... */
  skin?: string
}
export interface RopeDef {
  id: string
  x0: number
  y0: number
  x1: number
  y1: number
  /** The weight that hangs on this rope: it falls when the rope is cut. */
  holds?: string
  then?: Effect[]
}
export interface WeightDef {
  id: string
  x: number
  y: number
  w: number
  h: number
}
export interface GateDef {
  id: string
  x: number
  /** The foot of the gate, its width and height. */
  y0: number
  w: number
  h: number
  mat?: Mat
}
export interface Zone {
  x0: number
  y0: number
  x1: number
  y1: number
  /** The extra acceleration inside the zone (units per second squared). */
  wx: number
  wy: number
}
export interface Deco {
  kind: 'gallows' | 'beam' | 'cairn' | 'bush' | 'sign' | 'chain'
  x: number
  y: number
  w?: number
  h?: number
  flip?: boolean
}
export interface LevelDef {
  /** The chapter (0..3) and the number inside the chapter (0..10). */
  chapter: number
  index: number
  key: string
  /** The width of the world; wider than the view (see `VIEW_W`) scrolls. */
  w: number
  archer: { x: number; y: number }
  wind: number
  zones?: Zone[]
  polys: Poly[]
  items: ItemDef[]
  ropes?: RopeDef[]
  weights?: WeightDef[]
  gates?: GateDef[]
  deco?: Deco[]
  /** Seconds of the flight that the preview line shows (0: none). */
  preview: number
  /** The key of the hint that is shown once, the first time this thing appears. */
  intro?: string
}

export interface Shot {
  /** Angle in degrees, power as a fraction of the full pull (0.12 .. 1). */
  a: number
  f: number
  /** The time (seconds of the game) to shoot at; without it the shot goes as soon as all arrows have settled. */
  at?: number
}

export interface ArrowState {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  px: number
  py: number
  age: number
  state: 'fly' | 'stuck' | 'gone'
  /** Stuck: the thing it stuck in (an item index or -1) and the place relative to it. */
  inItem: number
  ox: number
  oy: number
  ang: number
}
export interface ItemState {
  done: boolean
  hitT: number
  x: number
  y: number
}
export interface RopeState {
  cut: boolean
  cutT: number
  cutX: number
  cutY: number
}
export interface WeightState {
  state: 'hang' | 'fall' | 'rest'
  y: number
  vy: number
  t: number
}
export interface GateState {
  open: boolean
  off: number
  t: number
}

export type GameEvent =
  | { t: 'shoot'; x: number; y: number; f: number }
  | { t: 'stick'; x: number; y: number; mat: Mat | 'item' }
  | { t: 'bounce'; x: number; y: number; mat: Mat }
  | { t: 'hit'; item: number; kind: ItemKind; x: number; y: number }
  | { t: 'rope'; rope: number; x: number; y: number }
  | { t: 'gate'; gate: number }
  | { t: 'land'; weight: number; x: number; y: number }
  | { t: 'break'; item: number; x: number; y: number }
  | { t: 'miss'; x: number; y: number }
  | { t: 'last'; x: number; y: number }
  | { t: 'win' }
  | { t: 'lost' }

export interface Game {
  def: LevelDef
  t: number
  acc: number
  shots: number
  supply: number
  nextId: number
  arrows: ArrowState[]
  items: ItemState[]
  ropes: RopeState[]
  weights: WeightState[]
  gates: GateState[]
  events: GameEvent[]
  status: 'play' | 'won' | 'lost'
  /** The spare arrows at the moment of the win. */
  left: number
  winT: number
  idleT: number
  /** The last arrow that gave the final hit (for the slow motion and the camera). */
  lastHit: { x: number; y: number } | null
  /** How many things were done in all (the Tipp and the solver look at it). */
  misses: number
}

// ── geometry ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where the sweep p0→p1 meets the segment q0→q1: `s` along p (0..1) and the unit normal of the segment facing the arrow, or null. */
export function segHit(px0: number, py0: number, px1: number, py1: number, qx0: number, qy0: number, qx1: number, qy1: number): { s: number; nx: number; ny: number } | null {
  const rx = px1 - px0
  const ry = py1 - py0
  const sx = qx1 - qx0
  const sy = qy1 - qy0
  const den = rx * sy - ry * sx
  if (den === 0) return null
  const ux = qx0 - px0
  const uy = qy0 - py0
  const s = (ux * sy - uy * sx) / den
  const u = (ux * ry - uy * rx) / den
  if (s < 0 || s > 1 || u < 0 || u > 1) return null
  let nx = -sy
  let ny = sx
  const l = Math.hypot(nx, ny) || 1
  nx /= l
  ny /= l
  if (nx * rx + ny * ry > 0) {
    nx = -nx
    ny = -ny
  }
  return { s, nx, ny }
}

/** The first moment of the sweep p0→p1 inside the circle (cx, cy, r), as a part 0..1 of the sweep, or -1. */
export function circleHit(px0: number, py0: number, px1: number, py1: number, cx: number, cy: number, r: number): number {
  const dx = px1 - px0
  const dy = py1 - py0
  const fx = px0 - cx
  const fy = py0 - cy
  const c = fx * fx + fy * fy - r * r
  if (c <= 0) return 0
  const a = dx * dx + dy * dy
  if (a === 0) return -1
  const b = 2 * (fx * dx + fy * dy)
  const disc = b * b - 4 * a * c
  if (disc < 0) return -1
  const s = (-b - Math.sqrt(disc)) / (2 * a)
  return s >= 0 && s <= 1 ? s : -1
}

/** The shortest distance between the segments p and q (0 when they cross). */
export function segDist(px0: number, py0: number, px1: number, py1: number, qx0: number, qy0: number, qx1: number, qy1: number): number {
  if (segHit(px0, py0, px1, py1, qx0, qy0, qx1, qy1)) return 0
  const d = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
    const vx = bx - ax
    const vy = by - ay
    const l2 = vx * vx + vy * vy
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2))
    return Math.hypot(x - (ax + t * vx), y - (ay + t * vy))
  }
  return Math.min(d(px0, py0, qx0, qy0, qx1, qy1), d(px1, py1, qx0, qy0, qx1, qy1), d(qx0, qy0, px0, py0, px1, py1), d(qx1, qy1, px0, py0, px1, py1))
}

/** Where an item stands at the time `t` (a swinging or sliding thing moves, the others stand). */
export function itemPos(it: ItemDef, t: number, out: { x: number; y: number }): { x: number; y: number } {
  const m = it.motion
  if (!m) {
    out.x = it.x
    out.y = it.y
  } else if (m.k === 'slide') {
    const k = (1 - Math.cos(2 * Math.PI * (t / m.period + m.phase))) / 2
    out.x = m.x0 + (m.x1 - m.x0) * k
    out.y = m.y0 + (m.y1 - m.y0) * k
  } else {
    const a = m.amp * Math.sin(2 * Math.PI * (t / m.period + m.phase))
    out.x = m.px + Math.sin(a) * m.len
    out.y = m.py - Math.cos(a) * m.len
  }
  return out
}

/** The acceleration of the wind at a place. */
export function windAt(def: LevelDef, x: number, y: number, out: { x: number; y: number }): { x: number; y: number } {
  out.x = def.wind
  out.y = 0
  const z = def.zones
  if (z)
    for (const q of z)
      if (x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1) {
        out.x += q.wx
        out.y += q.wy
      }
  return out
}

/** The place of the bow's grip and of the arrow's tip when the archer aims at `angle` (radians). */
export function aimPoints(def: LevelDef, angle: number): { sx: number; sy: number; gx: number; gy: number; tx: number; ty: number } {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const sx = def.archer.x + SHOULDER.x
  const sy = def.archer.y + SHOULDER.y
  const gx = sx + c * ARM
  const gy = sy + s * ARM
  return { sx, sy, gx, gy, tx: gx + c * TIP_AHEAD, ty: gy + s * TIP_AHEAD }
}

export const clampAngle = (deg: number) => Math.max(ANG_MIN, Math.min(ANG_MAX, deg))
export const speedOf = (f: number) => V_MAX * f

// ── the game ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function newGame(def: LevelDef, par: number): Game {
  return {
    def,
    t: 0,
    acc: 0,
    shots: 0,
    supply: par + SUPPLY_EXTRA[def.chapter]!,
    nextId: 1,
    arrows: [],
    items: def.items.map((it) => ({ done: false, hitT: -9, ...itemPos(it, 0, { x: 0, y: 0 }) })),
    ropes: (def.ropes ?? []).map(() => ({ cut: false, cutT: -9, cutX: 0, cutY: 0 })),
    weights: (def.weights ?? []).map((w) => ({ state: 'hang' as const, y: w.y, vy: 0, t: -9 })),
    gates: (def.gates ?? []).map(() => ({ open: false, off: 0, t: -9 })),
    events: [],
    status: 'play',
    left: 0,
    winT: -1,
    idleT: 0,
    lastHit: null,
    misses: 0
  }
}

/** A copy of the running game (the level definition is shared); the solver and the hint try shots on copies. */
export function cloneGame(g: Game): Game {
  return {
    ...g,
    arrows: g.arrows.map((a) => ({ ...a })),
    items: g.items.map((i) => ({ ...i })),
    ropes: g.ropes.map((r) => ({ ...r })),
    weights: g.weights.map((w) => ({ ...w })),
    gates: g.gates.map((q) => ({ ...q })),
    events: [],
    lastHit: g.lastHit ? { ...g.lastHit } : null
  }
}

const needOf = (it: ItemDef) => (it.need ?? it.kind !== 'switch')
export const needsLeft = (g: Game) => g.def.items.reduce((n, it, i) => n + (needOf(it) && !g.items[i]!.done ? 1 : 0), 0)
export const needsAll = (def: LevelDef) => def.items.reduce((n, it) => n + (needOf(it) ? 1 : 0), 0)
export const arrowsLeft = (g: Game) => g.supply - g.shots

/** What has been reached so far: the solver wants every shot to bring something (a thing done, a rope cut, a gate open, a weight down). */
export function progressOf(g: Game): number {
  let p = 0
  g.def.items.forEach((it, i) => {
    if (g.items[i]!.done) p += needOf(it) ? 4 : 2
  })
  for (const r of g.ropes) if (r.cut) p += 2
  for (const w of g.weights) if (w.state !== 'hang') p += 1
  for (const q of g.gates) if (q.open) p += 1
  return p
}

/** All arrows have landed and everything that was set moving has come to rest. */
export function settled(g: Game): boolean {
  for (const a of g.arrows) if (a.state === 'fly') return false
  for (const w of g.weights) if (w.state === 'fall') return false
  for (let i = 0; i < g.gates.length; i++) if (g.gates[i]!.open && g.gates[i]!.off < g.def.gates![i]!.h) return false
  return true
}

/** Puts an arrow on its way. Returns false when there is no arrow left. */
export function shoot(g: Game, angleDeg: number, f: number): boolean {
  if (g.status !== 'play' || arrowsLeft(g) <= 0) return false
  const ang = (clampAngle(angleDeg) * Math.PI) / 180
  const p = aimPoints(g.def, ang)
  const v = speedOf(Math.max(F_MIN, Math.min(1, f)))
  g.arrows.push({ id: g.nextId++, x: p.tx, y: p.ty, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, px: p.tx, py: p.ty, age: 0, state: 'fly', inItem: -1, ox: 0, oy: 0, ang })
  g.shots++
  g.events.push({ t: 'shoot', x: p.tx, y: p.ty, f })
  return true
}

function applyEffects(g: Game, effs: Effect[] | undefined) {
  if (!effs) return
  for (const e of effs) {
    if (e.t === 'open') {
      const i = (g.def.gates ?? []).findIndex((q) => q.id === e.id)
      if (i >= 0 && !g.gates[i]!.open) {
        g.gates[i]!.open = true
        g.gates[i]!.t = g.t
        g.events.push({ t: 'gate', gate: i })
      }
    } else {
      dropWeight(g, e.id)
    }
  }
}

function dropWeight(g: Game, id: string) {
  const i = (g.def.weights ?? []).findIndex((w) => w.id === id)
  if (i >= 0 && g.weights[i]!.state === 'hang') {
    g.weights[i]!.state = 'fall'
    g.weights[i]!.t = g.t
    g.weights[i]!.vy = 0
  }
}

function doneItem(g: Game, i: number, ax: number, ay: number) {
  const it = g.def.items[i]!
  const st = g.items[i]!
  st.hitT = g.t
  if (st.done) return
  st.done = true
  g.events.push({ t: 'hit', item: i, kind: it.kind, x: st.x, y: st.y })
  if (it.kind === 'jar') g.events.push({ t: 'break', item: i, x: st.x, y: st.y })
  applyEffects(g, it.then)
  if (needOf(it) && needsLeft(g) === 0 && g.status === 'play') {
    g.status = 'won'
    g.left = arrowsLeft(g)
    g.winT = 0
    g.lastHit = { x: ax, y: ay }
    g.events.push({ t: 'win' })
  }
}

const _w = { x: 0, y: 0 }
const _p = { x: 0, y: 0 }

interface Edges {
  n: number
  d: number[]
  mat: Mat[]
}
const edgeCache = new WeakMap<LevelDef, Edges>()
/** The fixed walls of a level as flat lists (the ground and every edge of every polygon); the gates are added while the arrow is stepped. */
function edgesOf(def: LevelDef): Edges {
  let e = edgeCache.get(def)
  if (e) return e
  e = { n: 0, d: [], mat: [] }
  const add = (x0: number, y0: number, x1: number, y1: number, m: Mat) => {
    e!.d.push(x0, y0, x1, y1)
    e!.mat.push(m)
    e!.n++
  }
  add(-60, 0, def.w + 60, 0, 'dirt')
  for (const p of def.polys) {
    const n = p.pts.length
    for (let k = 0; k < n; k++) {
      const a = p.pts[k]!
      const b = p.pts[(k + 1) % n]!
      add(a[0], a[1], b[0], b[1], p.mat)
    }
  }
  edgeCache.set(def, e)
  return e
}

/** Steps one arrow by one little step. With `dry` nothing in the world changes (the preview line): it only tells where the arrow ends. */
function stepArrow(g: Game, a: ArrowState, dry: boolean): boolean {
  const def = g.def
  windAt(def, a.x, a.y, _w)
  a.vx += _w.x * DT
  a.vy += (_w.y - GRAV) * DT
  const x0 = a.x
  const y0 = a.y
  const x1 = x0 + a.vx * DT
  const y1 = y0 + a.vy * DT
  a.age += DT
  // the earliest thing on the way
  let bestS = 2
  let kind = 'none' as 'wall' | 'item' | 'none'
  let bnx = 0
  let bny = 0
  let bmat = 'dirt' as Mat
  let bitem = -1
  const E = edgesOf(def)
  for (let k = 0; k < E.n; k++) {
    const h = segHit(x0, y0, x1, y1, E.d[4 * k]!, E.d[4 * k + 1]!, E.d[4 * k + 2]!, E.d[4 * k + 3]!)
    if (h && h.s < bestS) {
      bestS = h.s
      kind = 'wall'
      bnx = h.nx
      bny = h.ny
      bmat = E.mat[k]!
    }
  }
  const gs = def.gates
  if (gs)
    for (let i = 0; i < gs.length; i++) {
      const q = gs[i]!
      const st = g.gates[i]!
      if (st.open && st.off >= q.h) continue
      const gx0 = q.x - q.w / 2
      const gx1 = q.x + q.w / 2
      const gy0 = Math.max(0, q.y0 - st.off)
      const gy1 = q.y0 + q.h - st.off
      const m = q.mat ?? 'wood'
      for (let k = 0; k < 4; k++) {
        const h =
          k === 0 ? segHit(x0, y0, x1, y1, gx0, gy0, gx0, gy1) : k === 1 ? segHit(x0, y0, x1, y1, gx1, gy0, gx1, gy1) : k === 2 ? segHit(x0, y0, x1, y1, gx0, gy1, gx1, gy1) : segHit(x0, y0, x1, y1, gx0, gy0, gx1, gy0)
        if (h && h.s < bestS) {
          bestS = h.s
          kind = 'wall'
          bnx = h.nx
          bny = h.ny
          bmat = m
        }
      }
    }
  for (let i = 0; i < def.items.length; i++) {
    const it = def.items[i]!
    const st = g.items[i]!
    if (st.done && (it.kind === 'jar' || it.kind === 'flag')) continue
    itemPos(it, g.t, _p)
    const s = circleHit(x0, y0, x1, y1, _p.x, _p.y, it.r * HIT_ZONE)
    if (s >= 0 && s < bestS) {
      bestS = s
      kind = 'item'
      bitem = i
    }
  }
  const rs = def.ropes
  if (rs)
    for (let i = 0; i < rs.length; i++) {
      if (g.ropes[i]!.cut) continue
      const r = rs[i]!
      if (segDist(x0, y0, x1, y1, r.x0, r.y0, r.x1, r.y1) <= 0.2) {
        // the place on the rope is not needed exactly: the crossing point of the arrow's line with the rope's line
        if (!dry) {
          const st = g.ropes[i]!
          st.cut = true
          st.cutT = g.t
          const t = Math.max(0, Math.min(1, ((x1 - r.x0) * (r.x1 - r.x0) + (y1 - r.y0) * (r.y1 - r.y0)) / ((r.x1 - r.x0) ** 2 + (r.y1 - r.y0) ** 2 || 1)))
          st.cutX = r.x0 + (r.x1 - r.x0) * t
          st.cutY = r.y0 + (r.y1 - r.y0) * t
          g.events.push({ t: 'rope', rope: i, x: st.cutX, y: st.cutY })
          if (r.holds) dropWeight(g, r.holds)
          applyEffects(g, r.then)
        }
      }
    }
  if (kind === 'wall') {
    const hx = x0 + (x1 - x0) * bestS
    const hy = y0 + (y1 - y0) * bestS
    if (bmat === 'stone' || bmat === 'shield') {
      const en = bmat === 'shield' ? 0.9 : 0.6
      const et = bmat === 'shield' ? 0.97 : 0.85
      const vn = a.vx * bnx + a.vy * bny
      const tx = a.vx - vn * bnx
      const ty = a.vy - vn * bny
      a.vx = tx * et - en * vn * bnx
      a.vy = ty * et - en * vn * bny
      a.x = hx + bnx * 0.03
      a.y = hy + bny * 0.03
      a.ang = Math.atan2(a.vy, a.vx)
      if (!dry) g.events.push({ t: 'bounce', x: hx, y: hy, mat: bmat })
      return dry ? false : true
    }
    a.x = hx
    a.y = hy
    a.ang = Math.atan2(a.vy, a.vx)
    a.state = 'stuck'
    if (!dry) g.events.push({ t: 'stick', x: hx, y: hy, mat: bmat })
    return false
  }
  if (kind === 'item') {
    const it = def.items[bitem]!
    const hx = x0 + (x1 - x0) * bestS
    const hy = y0 + (y1 - y0) * bestS
    if (it.kind === 'jar' || it.kind === 'flag') {
      // the arrow flies through and loses a little speed
      if (!dry) doneItem(g, bitem, hx, hy)
      const k = it.kind === 'jar' ? 0.82 : 0.9
      a.vx *= k
      a.vy *= k
    } else if (it.kind === 'bell') {
      if (!dry) doneItem(g, bitem, hx, hy)
      // the arrow loses its speed and drops
      a.x = hx
      a.y = hy
      a.vx *= 0.08
      a.vy = Math.min(0, a.vy * 0.1)
      if (dry) {
        a.state = 'stuck'
        return false
      }
      return true
    } else {
      // target, switch: the arrow stays in it
      a.x = hx
      a.y = hy
      a.ang = Math.atan2(a.vy, a.vx)
      a.state = 'stuck'
      a.inItem = bitem
      itemPos(it, g.t, _p)
      a.ox = hx - _p.x
      a.oy = hy - _p.y
      // the arrow sits inside the thing, not on its rim
      const d = Math.hypot(a.ox, a.oy)
      const deep = it.r * 0.7
      if (d > deep) {
        a.ox *= deep / d
        a.oy *= deep / d
        a.x = _p.x + a.ox
        a.y = _p.y + a.oy
      }
      if (!dry) {
        g.events.push({ t: 'stick', x: hx, y: hy, mat: 'item' })
        doneItem(g, bitem, hx, hy)
      }
      return false
    }
  }
  a.px = x0
  a.py = y0
  a.x = x1
  a.y = y1
  a.ang = Math.atan2(a.vy, a.vx)
  if (a.y < WORLD_BOTTOM || a.x < -14 || a.x > def.w + 30 || a.age > 12) {
    a.state = 'gone'
    if (!dry) g.events.push({ t: 'miss', x: Math.max(-2, Math.min(def.w + 2, a.x)), y: Math.max(0, a.y) })
    return false
  }
  return true
}

/** One step (1/120 s) of the whole game. */
export function step(g: Game) {
  g.t += DT
  const def = g.def
  // gates sink, weights fall
  if (def.gates)
    for (let i = 0; i < def.gates.length; i++) {
      const st = g.gates[i]!
      if (st.open && st.off < def.gates[i]!.h) st.off = Math.min(def.gates[i]!.h, st.off + (def.gates[i]!.h / 0.9) * DT)
    }
  if (def.weights)
    for (let i = 0; i < def.weights.length; i++) {
      const st = g.weights[i]!
      if (st.state !== 'fall') continue
      const w = def.weights[i]!
      st.vy += 14 * DT
      const y0 = st.y
      let y1 = y0 - st.vy * DT
      // what is below: the ground and the tops of the walls under the weight (its bottom edge is y - h/2)
      let floor = 0
      for (const p of def.polys) {
        const n = p.pts.length
        for (let k = 0; k < n; k++) {
          const a = p.pts[k]!
          const b = p.pts[(k + 1) % n]!
          if (a[1] !== b[1]) continue // only flat tops
          const lo = Math.min(a[0], b[0])
          const hi = Math.max(a[0], b[0])
          if (hi < w.x - w.w / 2 || lo > w.x + w.w / 2) continue
          if (a[1] <= y0 - w.h / 2 + 0.01 && a[1] > floor) floor = a[1]
        }
      }
      // things the weight smashes on the way down: jars and switches under it
      for (let j = 0; j < def.items.length; j++) {
        const it = def.items[j]!
        const is = g.items[j]!
        if ((it.kind !== 'jar' && it.kind !== 'switch') || is.done) continue
        itemPos(it, g.t, _p)
        if (Math.abs(_p.x - w.x) > w.w / 2 + it.r * 0.5) continue
        const top = _p.y + it.r * 0.6
        if (y0 - w.h / 2 >= top - 0.01 && y1 - w.h / 2 <= top) {
          doneItem(g, j, _p.x, _p.y)
          if (it.kind === 'switch') floor = Math.max(floor, top)
        }
      }
      if (y1 - w.h / 2 <= floor) {
        y1 = floor + w.h / 2
        st.state = 'rest'
        st.vy = 0
        g.events.push({ t: 'land', weight: i, x: w.x, y: floor })
      }
      st.y = y1
    }
  for (const a of g.arrows) {
    if (a.state === 'fly') stepArrow(g, a, false)
    else if (a.state === 'stuck' && a.inItem >= 0) {
      itemPos(def.items[a.inItem]!, g.t, _p)
      a.x = _p.x + a.ox
      a.y = _p.y + a.oy
    }
  }
  for (let i = 0; i < def.items.length; i++) if (def.items[i]!.motion) itemPos(def.items[i]!, g.t, g.items[i]!)
  if (g.status === 'won') g.winT += DT
  else if (g.status === 'play') {
    if (arrowsLeft(g) <= 0 && settled(g)) {
      g.idleT += DT
      if (g.idleT > 0.9) {
        g.status = 'lost'
        g.events.push({ t: 'lost' })
      }
    } else g.idleT = 0
  }
  // old stuck arrows stay but not too many
  if (g.arrows.length > 28) for (let k = 0; k < g.arrows.length - 28; k++) if (g.arrows[k]!.state !== 'fly') g.arrows[k]!.state = 'gone'
}

/** Runs the game forward by `dt` seconds in fixed steps. */
export function advance(g: Game, dt: number) {
  g.acc += dt
  while (g.acc >= DT) {
    g.acc -= DT
    step(g)
  }
}

/** The stars for a won level: two or more spare arrows are three stars, one is two, none is one. */
export function starsOf(g: Game): number {
  if (g.status !== 'won') return 0
  return g.left >= 2 ? 3 : g.left === 1 ? 2 : 1
}

/** The preview line of a shot: the points of the free flight (as far as `seconds`), up to the first wall or target. */
export function previewPath(g: Game, angleDeg: number, f: number, seconds: number, out: number[] = []): number[] {
  out.length = 0
  const ang = (clampAngle(angleDeg) * Math.PI) / 180
  const p = aimPoints(g.def, ang)
  const v = speedOf(Math.max(F_MIN, Math.min(1, f)))
  const a: ArrowState = { id: 0, x: p.tx, y: p.ty, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, px: p.tx, py: p.ty, age: 0, state: 'fly', inItem: -1, ox: 0, oy: 0, ang }
  const copy = { ...g, t: g.t }
  let n = 0
  const max = Math.round(seconds / DT)
  out.push(a.x, a.y)
  while (n < max) {
    const keep = stepArrow(copy as Game, a, true)
    n++
    if (n % 4 === 0 || !keep) out.push(a.x, a.y)
    if (!keep) break
    copy.t += DT
  }
  return out
}

/** Plays a list of shots on a fresh game (the way the tests and the solver do): each shot goes when the arrows have settled, or at its time. */
export function playShots(def: LevelDef, par: number, shots: Shot[], maxSeconds = 16): Game {
  const g = newGame(def, par)
  for (const s of shots) {
    let guard = 0
    while (g.status === 'play' && guard++ < 40 * 120 && (s.at !== undefined ? g.t < s.at : !settled(g))) step(g)
    if (g.status !== 'play') break
    shoot(g, s.a, s.f)
  }
  let n = 0
  while (g.status === 'play' && !settled(g) && n++ < maxSeconds * 120) step(g)
  return g
}
