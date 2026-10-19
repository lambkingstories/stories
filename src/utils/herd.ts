/**
 * The herd of the herding game: animals stand on a meadow, and the child's finger is the shepherd's staff. Every animal gently steps away from the
 * finger (a shy one from farther off), stays near the others, never crowds them, and slows down in the resting place (the shade of the trees); an
 * animal that has stayed there a moment lies down and rests, and stays. Nothing threatens them and none runs away: it is all soft steering.
 * Everything is in "width units": x and y are both counted in hundredths of the width of the meadow (the game turns the height into these), and
 * speeds are units per second. Plain functions that change the animals in place, so that the game and the tests use the same arithmetic.
 */
export interface Pt {
  x: number
  y: number
}

export interface Animal extends Pt {
  vx: number
  vy: number
  /** A shy animal steps away from the finger earlier. */
  shy: boolean
  /** How long it has been in the resting place (seconds). */
  calm: number
  /** It rests: it lies in the shade and does not move any more. */
  resting: boolean
}

/** The resting place: its middle and radius. */
export interface Zone extends Pt {
  r: number
}

export const PUSH_RADIUS = 24
export const SHY_RADIUS = 36
const PUSH = 220
const COHESION = 5
const SEPARATION_RADIUS = 9
const SEPARATION = 70
const LURE = 10
const MAX_SPEED = 38
/** An animal counts as in the resting place inside this share of its radius, and rests after this many seconds. */
export const REST_SHARE = 0.85
export const REST_AFTER = 0.7

export function makeAnimal(x: number, y: number, shy = false): Animal {
  return { x, y, vx: 0, vy: 0, shy, calm: 0, resting: false }
}

/**
 * One step of `dt` seconds. `pointer` is the finger (or null when no finger is down); `bounds` keeps the animals on the meadow.
 * The animals that rest do not move and are not pushed.
 */
export function stepHerd(animals: Animal[], pointer: Pt | null, dt: number, zone: Zone, bounds: { w: number; h: number } = { w: 100, h: 133 }): void {
  const moving = animals.filter((a) => !a.resting)
  const centre = moving.length > 1 ? { x: moving.reduce((s, a) => s + a.x, 0) / moving.length, y: moving.reduce((s, a) => s + a.y, 0) / moving.length } : null
  for (const a of moving) {
    let ax = 0
    let ay = 0
    // the finger: a step away from it, the closer the stronger
    if (pointer) {
      const dx = a.x - pointer.x
      const dy = a.y - pointer.y
      const d = Math.hypot(dx, dy) || 0.001
      const reach = a.shy ? SHY_RADIUS : PUSH_RADIUS
      if (d < reach) {
        const k = (1 - d / reach) * PUSH
        ax += (dx / d) * k
        ay += (dy / d) * k
      }
    }
    // the others: stay together, but never on top of each other
    // (only while the finger leads: without it the animals just stand)
    if (centre && pointer) {
      ax += (centre.x - a.x) * COHESION * 0.05
      ay += (centre.y - a.y) * COHESION * 0.05
    }
    for (const b of animals) {
      if (b === a) continue
      const dx = a.x - b.x
      const dy = a.y - b.y
      const d = Math.hypot(dx, dy) || 0.001
      if (d < SEPARATION_RADIUS) {
        const k = (1 - d / SEPARATION_RADIUS) * SEPARATION
        ax += (dx / d) * k
        ay += (dy / d) * k
      }
    }
    // the resting place calls softly and slows the animal down
    const zx = zone.x - a.x
    const zy = zone.y - a.y
    const zd = Math.hypot(zx, zy)
    const inside = zd < zone.r * REST_SHARE
    if (zd < zone.r * 1.7 && zd > 0.001) {
      ax += (zx / zd) * LURE
      ay += (zy / zd) * LURE
    }
    a.vx += ax * dt
    a.vy += ay * dt
    const damping = Math.exp(-(inside ? 6 : 2.2) * dt)
    a.vx *= damping
    a.vy *= damping
    const speed = Math.hypot(a.vx, a.vy)
    if (speed > MAX_SPEED) {
      a.vx = (a.vx / speed) * MAX_SPEED
      a.vy = (a.vy / speed) * MAX_SPEED
    }
    a.x = Math.min(bounds.w - 4, Math.max(4, a.x + a.vx * dt))
    a.y = Math.min(bounds.h - 4, Math.max(10, a.y + a.vy * dt))
    // in the shade for a moment: it lies down
    if (inside) {
      a.calm += dt
      if (a.calm >= REST_AFTER) {
        a.resting = true
        a.vx = 0
        a.vy = 0
      }
    } else {
      a.calm = 0
    }
  }
}

/** How many animals rest. */
export const restingCount = (animals: Animal[]): number => animals.filter((a) => a.resting).length
