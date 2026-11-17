/**
 * A small 2D physics for boxes (after Erin Catto's "Box2D-Lite": box-box contacts by clipping, sequential impulses with accumulated impulses and
 * warm starting), made for stacking stones. No Vue, no drawing. Bodies that lie still go to sleep (they stay put until something hits them),
 * so a built wall is calm and cheap. Units are metres-like "stone units"; y points up; angles in radians (counter-clockwise).
 */

export interface Body {
  id: number
  x: number
  y: number
  rot: number
  vx: number
  vy: number
  /** Angular velocity. */
  w: number
  /** Half width and half height. */
  hw: number
  hh: number
  /** 0 = does not move (the ground); the ground may still be moved by hand (`kinematic`). */
  invMass: number
  invI: number
  friction: number
  asleep: boolean
  sleepT: number
  /** Seconds since it was released (for gusts of wind that blow on stones in the air). */
  age: number
  /** Whether it has touched something since it was released. */
  touched: boolean
  /** Free for the game (the kind of stone, ...). */
  tag: number
}

interface Contact {
  px: number
  py: number
  nx: number
  ny: number
  sep: number
  r1x: number
  r1y: number
  r2x: number
  r2y: number
  Pn: number
  Pt: number
  massNormal: number
  massTangent: number
  bias: number
}

interface Arbiter {
  a: Body
  b: Body
  contacts: Contact[]
  friction: number
}

export interface PhysEvent {
  type: 'land'
  body: Body
  speed: number
}

export const BIAS_FACTOR = 0.2
export const ALLOWED_PEN = 0.01
export const ITERATIONS = 12

export function makeBody(id: number, x: number, y: number, hw: number, hh: number, density: number, friction: number, rot = 0): Body {
  const mass = density > 0 ? 4 * hw * hh * density : 0
  const I = mass > 0 ? (mass * (4 * hw * hw + 4 * hh * hh)) / 12 : 0
  return {
    id,
    x,
    y,
    rot,
    vx: 0,
    vy: 0,
    w: 0,
    hw,
    hh,
    invMass: mass > 0 ? 1 / mass : 0,
    invI: I > 0 ? 1 / I : 0,
    friction,
    asleep: false,
    sleepT: 0,
    age: 0,
    touched: false,
    tag: 0
  }
}

const im = (b: Body) => (b.asleep ? 0 : b.invMass)
const ii = (b: Body) => (b.asleep ? 0 : b.invI)

// ── box against box (clipping) ──────────────────────────────────────────────────────────────────────────────────────────────

interface V {
  x: number
  y: number
}

function clipSegment(out: V[], vIn: V[], nx: number, ny: number, offset: number): number {
  let n = 0
  const d0 = nx * vIn[0]!.x + ny * vIn[0]!.y - offset
  const d1 = nx * vIn[1]!.x + ny * vIn[1]!.y - offset
  if (d0 <= 0) out[n++] = vIn[0]!
  if (d1 <= 0) out[n++] = vIn[1]!
  if (d0 * d1 < 0) {
    const t = d0 / (d0 - d1)
    out[n++] = { x: vIn[0]!.x + t * (vIn[1]!.x - vIn[0]!.x), y: vIn[0]!.y + t * (vIn[1]!.y - vIn[0]!.y) }
  }
  return n
}

function incidentEdge(hx: number, hy: number, px: number, py: number, c: number, s: number, nx: number, ny: number): V[] {
  // the reference normal into the frame of the incident box, flipped
  const lx = -(c * nx + s * ny)
  const ly = -(-s * nx + c * ny)
  let a: V
  let b: V
  if (Math.abs(lx) > Math.abs(ly)) {
    if (lx > 0) {
      a = { x: hx, y: -hy }
      b = { x: hx, y: hy }
    } else {
      a = { x: -hx, y: hy }
      b = { x: -hx, y: -hy }
    }
  } else if (ly > 0) {
    a = { x: hx, y: hy }
    b = { x: -hx, y: hy }
  } else {
    a = { x: -hx, y: -hy }
    b = { x: hx, y: -hy }
  }
  return [
    { x: px + c * a.x - s * a.y, y: py + s * a.x + c * a.y },
    { x: px + c * b.x - s * b.y, y: py + s * b.x + c * b.y }
  ]
}

/** The contact points of two boxes (empty when they do not touch). */
export function collide(A: Body, B: Body): { px: number; py: number; nx: number; ny: number; sep: number }[] {
  const cA = Math.cos(A.rot)
  const sA = Math.sin(A.rot)
  const cB = Math.cos(B.rot)
  const sB = Math.sin(B.rot)
  const dpx = B.x - A.x
  const dpy = B.y - A.y
  // positions in the frame of A and of B
  const dAx = cA * dpx + sA * dpy
  const dAy = -sA * dpx + cA * dpy
  const dBx = cB * dpx + sB * dpy
  const dBy = -sB * dpx + cB * dpy
  // C = RotA^T * RotB
  const C00 = cA * cB + sA * sB
  const C01 = -cA * sB + sA * cB
  const C10 = -sA * cB + cA * sB
  const C11 = sA * sB + cA * cB
  const a00 = Math.abs(C00)
  const a01 = Math.abs(C01)
  const a10 = Math.abs(C10)
  const a11 = Math.abs(C11)
  const faceAx = Math.abs(dAx) - A.hw - (a00 * B.hw + a01 * B.hh)
  const faceAy = Math.abs(dAy) - A.hh - (a10 * B.hw + a11 * B.hh)
  if (faceAx > 0 || faceAy > 0) return []
  const faceBx = Math.abs(dBx) - (a00 * A.hw + a10 * A.hh) - B.hw
  const faceBy = Math.abs(dBy) - (a01 * A.hw + a11 * A.hh) - B.hh
  if (faceBx > 0 || faceBy > 0) return []

  let axis = 0
  let separation = faceAx
  let nx = dAx > 0 ? cA : -cA
  let ny = dAx > 0 ? sA : -sA
  const relTol = 0.95
  const absTol = 0.01
  if (faceAy > relTol * separation + absTol * A.hh) {
    axis = 1
    separation = faceAy
    nx = dAy > 0 ? -sA : sA
    ny = dAy > 0 ? cA : -cA
  }
  if (faceBx > relTol * separation + absTol * B.hw) {
    axis = 2
    separation = faceBx
    nx = dBx > 0 ? cB : -cB
    ny = dBx > 0 ? sB : -sB
  }
  if (faceBy > relTol * separation + absTol * B.hh) {
    axis = 3
    separation = faceBy
    nx = dBy > 0 ? -sB : sB
    ny = dBy > 0 ? cB : -cB
  }

  let frontNx: number
  let frontNy: number
  let front: number
  let sideNx: number
  let sideNy: number
  let negSide: number
  let posSide: number
  let inc: V[]
  if (axis === 0) {
    frontNx = nx
    frontNy = ny
    front = A.x * frontNx + A.y * frontNy + A.hw
    sideNx = -sA
    sideNy = cA
    const side = A.x * sideNx + A.y * sideNy
    negSide = -side + A.hh
    posSide = side + A.hh
    inc = incidentEdge(B.hw, B.hh, B.x, B.y, cB, sB, frontNx, frontNy)
  } else if (axis === 1) {
    frontNx = nx
    frontNy = ny
    front = A.x * frontNx + A.y * frontNy + A.hh
    sideNx = cA
    sideNy = sA
    const side = A.x * sideNx + A.y * sideNy
    negSide = -side + A.hw
    posSide = side + A.hw
    inc = incidentEdge(B.hw, B.hh, B.x, B.y, cB, sB, frontNx, frontNy)
  } else if (axis === 2) {
    frontNx = -nx
    frontNy = -ny
    front = B.x * frontNx + B.y * frontNy + B.hw
    sideNx = -sB
    sideNy = cB
    const side = B.x * sideNx + B.y * sideNy
    negSide = -side + B.hh
    posSide = side + B.hh
    inc = incidentEdge(A.hw, A.hh, A.x, A.y, cA, sA, frontNx, frontNy)
  } else {
    frontNx = -nx
    frontNy = -ny
    front = B.x * frontNx + B.y * frontNy + B.hh
    sideNx = cB
    sideNy = sB
    const side = B.x * sideNx + B.y * sideNy
    negSide = -side + B.hw
    posSide = side + B.hw
    inc = incidentEdge(A.hw, A.hh, A.x, A.y, cA, sA, frontNx, frontNy)
  }
  const c1: V[] = []
  if (clipSegment(c1, inc, -sideNx, -sideNy, negSide) < 2) return []
  const c2: V[] = []
  if (clipSegment(c2, c1, sideNx, sideNy, posSide) < 2) return []
  const out: { px: number; py: number; nx: number; ny: number; sep: number }[] = []
  for (let i = 0; i < 2; i++) {
    const sep = frontNx * c2[i]!.x + frontNy * c2[i]!.y - front
    if (sep <= 0) out.push({ px: c2[i]!.x - sep * frontNx, py: c2[i]!.y - sep * frontNy, nx, ny, sep })
  }
  return out
}

// ── the world ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export class World {
  bodies: Body[] = []
  gravity = -14
  /** Slow down all movement a little (settles a wall). */
  linDamp = 0.15
  angDamp = 0.5
  /** Bodies may go to sleep (off while the ground shakes). */
  sleeping = true
  events: PhysEvent[] = []
  private arbiters = new Map<number, Arbiter>()
  private nextId = 1

  add(b: Body): Body {
    this.bodies.push(b)
    return b
  }

  newId(): number {
    return this.nextId++
  }

  remove(b: Body): void {
    const i = this.bodies.indexOf(b)
    if (i < 0) return
    // whatever lay on it wakes up
    for (const [k, arb] of this.arbiters) {
      if (arb.a === b || arb.b === b) {
        this.wake(arb.a === b ? arb.b : arb.a)
        this.arbiters.delete(k)
      }
    }
    this.bodies.splice(i, 1)
  }

  wake(b: Body, depth = 0): void {
    if (b.invMass === 0 || (!b.asleep && depth > 0)) return
    b.asleep = false
    b.sleepT = 0
    if (depth > 40) return
    for (const arb of this.arbiters.values()) {
      if (arb.a === b) this.wake(arb.b, depth + 1)
      else if (arb.b === b) this.wake(arb.a, depth + 1)
    }
  }

  wakeAll(): void {
    for (const b of this.bodies) {
      b.asleep = false
      b.sleepT = 0
    }
  }

  step(dt: number): void {
    const bodies = this.bodies
    // new contacts
    for (let i = 0; i < bodies.length; i++) {
      const A = bodies[i]!
      for (let j = i + 1; j < bodies.length; j++) {
        const B = bodies[j]!
        if (A.invMass === 0 && B.invMass === 0) continue
        if ((A.asleep || A.invMass === 0) && (B.asleep || B.invMass === 0)) continue
        const rA = Math.hypot(A.hw, A.hh)
        const rB = Math.hypot(B.hw, B.hh)
        const dx = A.x - B.x
        const dy = A.y - B.y
        if (dx * dx + dy * dy > (rA + rB) * (rA + rB)) {
          this.arbiters.delete(A.id * 65536 + B.id)
          continue
        }
        const pts = collide(A, B)
        const key = A.id * 65536 + B.id
        if (pts.length === 0) {
          this.arbiters.delete(key)
          continue
        }
        const old = this.arbiters.get(key)
        const contacts: Contact[] = pts.map((p) => ({ px: p.px, py: p.py, nx: p.nx, ny: p.ny, sep: p.sep, r1x: 0, r1y: 0, r2x: 0, r2y: 0, Pn: 0, Pt: 0, massNormal: 0, massTangent: 0, bias: 0 }))
        if (old) {
          for (const c of contacts) {
            for (const o of old.contacts) {
              if ((c.px - o.px) ** 2 + (c.py - o.py) ** 2 < 0.01) {
                c.Pn = o.Pn
                c.Pt = o.Pt
                break
              }
            }
          }
        } else {
          // the first touch of a stone that was in the air
          const air = A.invMass > 0 && !A.touched ? A : B.invMass > 0 && !B.touched ? B : null
          if (air && air.invMass > 0 && air.age > 0) {
            this.events.push({ type: 'land', body: air, speed: Math.hypot(air.vx, air.vy) })
            air.touched = true
          }
        }
        this.arbiters.set(key, { a: A, b: B, contacts, friction: Math.sqrt(A.friction * B.friction) })
        // something that is moving hits a stone that sleeps: it wakes up (before the impulses are shared)
        if (A.asleep !== B.asleep) {
          const sleeper = A.asleep ? A : B
          const other = A.asleep ? B : A
          if (other.invMass > 0 && other.vx * other.vx + other.vy * other.vy > 0.4) this.wake(sleeper)
        }
      }
    }
    // forces
    for (const b of bodies) {
      if (b.invMass === 0 || b.asleep) continue
      b.vy += this.gravity * dt
      b.vx *= 1 / (1 + dt * this.linDamp)
      b.vy *= 1 / (1 + dt * this.linDamp * 0.3)
      b.w *= 1 / (1 + dt * this.angDamp)
      b.age += dt
    }
    const invDt = dt > 0 ? 1 / dt : 0
    // pre-step
    const live: Arbiter[] = []
    for (const arb of this.arbiters.values()) {
      const { a, b } = arb
      if (im(a) === 0 && im(b) === 0) continue
      live.push(arb)
      for (const c of arb.contacts) {
        c.r1x = c.px - a.x
        c.r1y = c.py - a.y
        c.r2x = c.px - b.x
        c.r2y = c.py - b.y
        const rn1 = c.r1x * c.nx + c.r1y * c.ny
        const rn2 = c.r2x * c.nx + c.r2y * c.ny
        const kN = im(a) + im(b) + ii(a) * (c.r1x * c.r1x + c.r1y * c.r1y - rn1 * rn1) + ii(b) * (c.r2x * c.r2x + c.r2y * c.r2y - rn2 * rn2)
        c.massNormal = 1 / kN
        const tx = c.ny
        const ty = -c.nx
        const rt1 = c.r1x * tx + c.r1y * ty
        const rt2 = c.r2x * tx + c.r2y * ty
        const kT = im(a) + im(b) + ii(a) * (c.r1x * c.r1x + c.r1y * c.r1y - rt1 * rt1) + ii(b) * (c.r2x * c.r2x + c.r2y * c.r2y - rt2 * rt2)
        c.massTangent = 1 / kT
        c.bias = -BIAS_FACTOR * invDt * Math.min(0, c.sep + ALLOWED_PEN)
        // warm start
        const Px = c.Pn * c.nx + c.Pt * tx
        const Py = c.Pn * c.ny + c.Pt * ty
        a.vx -= im(a) * Px
        a.vy -= im(a) * Py
        a.w -= ii(a) * (c.r1x * Py - c.r1y * Px)
        b.vx += im(b) * Px
        b.vy += im(b) * Py
        b.w += ii(b) * (c.r2x * Py - c.r2y * Px)
      }
    }
    for (let it = 0; it < ITERATIONS; it++) {
      for (const arb of live) {
        const { a, b } = arb
        for (const c of arb.contacts) {
          let dvx = b.vx - b.w * c.r2y - a.vx + a.w * c.r1y
          let dvy = b.vy + b.w * c.r2x - a.vy - a.w * c.r1x
          const vn = dvx * c.nx + dvy * c.ny
          let dPn = c.massNormal * (-vn + c.bias)
          const Pn0 = c.Pn
          c.Pn = Math.max(Pn0 + dPn, 0)
          dPn = c.Pn - Pn0
          let Px = dPn * c.nx
          let Py = dPn * c.ny
          a.vx -= im(a) * Px
          a.vy -= im(a) * Py
          a.w -= ii(a) * (c.r1x * Py - c.r1y * Px)
          b.vx += im(b) * Px
          b.vy += im(b) * Py
          b.w += ii(b) * (c.r2x * Py - c.r2y * Px)
          dvx = b.vx - b.w * c.r2y - a.vx + a.w * c.r1y
          dvy = b.vy + b.w * c.r2x - a.vy - a.w * c.r1x
          const tx = c.ny
          const ty = -c.nx
          const vt = dvx * tx + dvy * ty
          let dPt = c.massTangent * -vt
          const maxPt = arb.friction * c.Pn
          const Pt0 = c.Pt
          c.Pt = Math.max(-maxPt, Math.min(maxPt, Pt0 + dPt))
          dPt = c.Pt - Pt0
          Px = dPt * tx
          Py = dPt * ty
          a.vx -= im(a) * Px
          a.vy -= im(a) * Py
          a.w -= ii(a) * (c.r1x * Py - c.r1y * Px)
          b.vx += im(b) * Px
          b.vy += im(b) * Py
          b.w += ii(b) * (c.r2x * Py - c.r2y * Px)
        }
      }
    }
    // move
    for (const b of bodies) {
      if (b.invMass === 0 || b.asleep) continue
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.rot += b.w * dt
    }
    // sleep and wake
    for (const arb of live) {
      const { a, b } = arb
      if (a.asleep !== b.asleep) {
        const sleeper = a.asleep ? a : b
        const other = a.asleep ? b : a
        if (other.invMass > 0 && other.vx * other.vx + other.vy * other.vy > 0.5) this.wake(sleeper)
      }
    }
    for (const b of bodies) {
      if (b.invMass === 0 || b.asleep) continue
      const slow = b.vx * b.vx + b.vy * b.vy < 0.03 && b.w * b.w < 0.05
      if (slow && b.touched) b.sleepT += dt
      else b.sleepT = 0
      if (this.sleeping && b.sleepT > 0.6) {
        b.asleep = true
        b.vx = b.vy = b.w = 0
      }
    }
  }
}

/** Whether a point lies inside a box. */
export function inside(b: Body, px: number, py: number): boolean {
  const c = Math.cos(b.rot)
  const s = Math.sin(b.rot)
  const dx = px - b.x
  const dy = py - b.y
  const lx = c * dx + s * dy
  const ly = -s * dx + c * dy
  return Math.abs(lx) <= b.hw && Math.abs(ly) <= b.hh
}

/** A small seeded random number generator (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
