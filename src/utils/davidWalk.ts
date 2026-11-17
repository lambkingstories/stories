/**
 * The stride of Goliath in "David's sling": a walk cycle of a figure made of separate parts (body, two legs of thigh and shin, two arms), pure
 * maths without any drawing, so that it can be tested.
 *
 * The rules that make a walk look right (and not like a slide show):
 *  - the cycle runs on the DISTANCE walked, not on the clock: a foot that stands on the ground stays where it stands, while the body moves
 *    on over it (no sliding), and when Goliath stops (he falls) the legs stop with him;
 *  - the stride is exactly what the body moves while one foot stands on the ground (stride = speed x stance time);
 *  - the feet follow a smooth path (the speed of the swinging foot starts and ends equal to the body's speed, no jerk), and the knees and hips
 *    come from a two-bone solution (IK) so that the legs never stretch or break;
 *  - the body rises over a standing leg and sinks when both feet are on the ground (twice per cycle), the arms swing against the legs.
 *
 * Coordinates here: "forward" is the direction Goliath looks and walks (the drawing turns it to the left), "up" is up; the origin is the
 * hip joint on the ground line below it. All lengths are scene units.
 */

/** The size of the figure's legs and the rhythm of the walk. */
export interface WalkDims {
  /** Hip to knee. */
  thigh: number
  /** Knee to ankle. */
  shin: number
  /** The ankle's height above the ground (sole of the foot to ankle). */
  ankle: number
  /** How high the hip rides above the ankle line when it is at its highest. */
  hipUp: number
}

export const GAIT = {
  /** Seconds for a whole cycle (two steps) at the speed the figure was made for. */
  cycle: 3.2,
  /** The part of the cycle that a foot stays on the ground. More than half: for a short moment both feet stand. */
  duty: 0.62,
  /** How high the swinging foot lifts. */
  lift: 36,
  /** How far the body rises and sinks (half of the whole travel). */
  bob: 11,
  /** The arms swing (radians). */
  armShield: 0.17,
  armSpear: 0.08
}

/**
 * The painted parts of Goliath (pictures in `public/images/spiele-gross/david/gol-*.webp`), all side views looking left. Each has its pivots in
 * picture pixels; `RIG_K` is the scale from picture pixels to scene units (so that his forehead is where the game expects it).
 */
export const RIG_K = 0.46
export const PARTS = {
  torso: { img: 'gol-torso', w: 239, h: 509, hip: [122, 465], shoulder: [155, 247] },
  armSpear: { img: 'gol-arm-speer', w: 195, h: 413, pivot: [105, 75], hand: [78, 372], k: 0.9 },
  armShield: { img: 'gol-arm-schild', w: 209, h: 418, pivot: [125, 80], k: 0.9 },
  thigh: { img: 'gol-bein-ober', w: 174, h: 375, hip: [92, 55], knee: [95, 325], rest: -0.011, kx: 0.78 },
  shin: { img: 'gol-bein-unter', w: 135, h: 369, knee: [62, 33], ankle: [56, 327], rest: 0.02, kx: 1 },
  foot: { img: 'gol-fuss', w: 185, h: 119, ankle: [135, 20] },
  rock: { img: 'gol-rock', w: 239, h: 352, pivot: [120, 6], at: [120, 362] },
  spear: { img: 'gol-speer', w: 40, h: 465, grip: [20, 330], k: 2.8 }
} as const

export const DEFAULT_DIMS: WalkDims = {
  thigh: Math.hypot(PARTS.thigh.knee[0] - PARTS.thigh.hip[0], PARTS.thigh.knee[1] - PARTS.thigh.hip[1]) * RIG_K,
  shin: Math.hypot(PARTS.shin.ankle[0] - PARTS.shin.knee[0], PARTS.shin.ankle[1] - PARTS.shin.knee[1]) * RIG_K,
  ankle: (PARTS.foot.h - PARTS.foot.ankle[1]) * RIG_K,
  hipUp: 8
}

/** How far the body rises over its mean height (up is positive), cheap version for the aim (the forehead). */
export function bobAt(dist: number, speed: number): number {
  return -Math.cos(2 * TAU * frac(Math.max(0, dist) / cycleLength(speed))) * GAIT.bob
}

export interface LegPose {
  /** The foot (ankle joint) and the knee, forward / up from the hip's ground point. */
  footX: number
  footY: number
  kneeX: number
  kneeY: number
  /** The angles from "straight down", forward is positive: thigh, shin, and the foot against the ground (toe up is positive). */
  thigh: number
  shin: number
  foot: number
  /** The foot stands on the ground. */
  stance: boolean
  /** The phase of this leg, 0 to 1. */
  phase: number
}

export interface WalkPose {
  /** Where the hip is: forward 0, up above the ground. */
  hipY: number
  /** The up/down of the body around its middle (up is positive), for the head and everything that rides on the body. */
  bob: number
  /** Forward lean of the torso (radians). */
  lean: number
  /** The leg that is on the near side (towards the viewer) and the one on the far side. */
  near: LegPose
  far: LegPose
  /** The arms (radians from "hanging down", forward is positive). */
  armShield: number
  armSpear: number
  /** The length of a stride (the distance one foot travels in the body's frame while it stands). */
  stride: number
}

const TAU = Math.PI * 2
const frac = (x: number) => x - Math.floor(x)
const smooth = (x: number) => x * x * (3 - 2 * x)

/** The stride (how far the body moves while one foot stands) at a speed. */
export function strideLength(speed: number): number {
  return speed * GAIT.duty * GAIT.cycle
}

/** The distance of a whole cycle at a speed. */
export function cycleLength(speed: number): number {
  return speed * GAIT.cycle
}

/** The counter of the steps that were made after `dist` units: one per half cycle, even = the near foot touches down, odd = the far foot. */
export function stepCount(dist: number, speed: number): number {
  return Math.floor((2 * Math.max(0, dist)) / cycleLength(speed))
}

/** The angle of the foot against the ground over the phase of its leg: toe up when it touches down, flat, heel lifts to push off, swings through. */
const FOOT_KEYS: [number, number][] = [
  [0, 0.14],
  [0.1, 0.0],
  [0.4, 0.0],
  [GAIT.duty, -0.5],
  [GAIT.duty + 0.1, -0.28],
  [0.88, 0.16],
  [1, 0.14]
]

function footAngle(p: number): number {
  for (let i = 1; i < FOOT_KEYS.length; i++) {
    const [p1, a1] = FOOT_KEYS[i]!
    const [p0, a0] = FOOT_KEYS[i - 1]!
    if (p <= p1) {
      const k = (p - p0) / (p1 - p0)
      return a0 + (a1 - a0) * smooth(Math.max(0, Math.min(1, k)))
    }
  }
  return FOOT_KEYS[FOOT_KEYS.length - 1]![1]
}

/** Where the ankle is (forward from the hip, up from the ground) at the phase `p` of a leg. */
export function footPath(p: number, speed: number): { x: number; y: number; stance: boolean } {
  const S = strideLength(speed)
  const duty = GAIT.duty
  if (p < duty) {
    // standing: the foot is fixed on the ground, so against the body it moves back at exactly the speed of the walk
    return { x: S / 2 - S * (p / duty), y: 0, stance: true }
  }
  // swinging: a smooth arc forward (a Hermite curve that starts and ends with the body's speed), the foot lifts and sets down
  const u = (p - duty) / (1 - duty)
  const tw = (1 - duty) * GAIT.cycle
  const m = -speed * tw
  const u2 = u * u
  const u3 = u2 * u
  const x = (2 * u3 - 3 * u2 + 1) * (-S / 2) + (u3 - 2 * u2 + u) * m + (-2 * u3 + 3 * u2) * (S / 2) + (u3 - u2) * m
  const y = GAIT.lift * Math.pow(Math.sin(Math.PI * u), 1.6)
  return { x, y, stance: false }
}

/** Two bones from the hip to the foot: the knee points forward. */
function leg(hipY: number, p: number, speed: number, dims: WalkDims): LegPose {
  const f = footPath(p, speed)
  const ankleY = f.y + dims.ankle
  const dx = f.x
  const dy = hipY - ankleY
  const reach = dims.thigh + dims.shin
  let d = Math.hypot(dx, dy)
  const max = reach * 0.999
  let fx = dx
  let fy = dy
  if (d > max) {
    // out of reach (cannot happen in the normal gait): the foot is pulled in on the same line
    fx = (dx / d) * max
    fy = (dy / d) * max
    d = max
  }
  const dirDown = Math.atan2(fx, fy)
  const cosA = (dims.thigh * dims.thigh + d * d - dims.shin * dims.shin) / (2 * dims.thigh * d)
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)))
  const thigh = dirDown + A
  const kneeX = Math.sin(thigh) * dims.thigh
  const kneeY = hipY - Math.cos(thigh) * dims.thigh
  const footX = fx
  const footY = hipY - fy
  const shin = Math.atan2(footX - kneeX, kneeY - footY)
  return { footX, footY, kneeX, kneeY, thigh, shin, foot: footAngle(p), stance: f.stance, phase: p }
}

/** The whole figure after `dist` units walked at `speed`. */
export function walkPose(dist: number, speed: number, dims: WalkDims = DEFAULT_DIMS): WalkPose {
  const cycles = Math.max(0, dist) / cycleLength(speed)
  const p = frac(cycles)
  const pFar = frac(cycles + 0.5)
  // up and down: highest above the leg that stands alone (p = 0.25 and 0.75), lowest when both feet stand (p = 0, 0.5)
  const bob = -Math.cos(2 * TAU * p) * GAIT.bob
  const hipTop = dims.ankle + dims.thigh + dims.shin - dims.hipUp
  const hipY = hipTop + bob - GAIT.bob
  return {
    hipY,
    bob,
    lean: 0.03 - Math.cos(2 * TAU * p) * 0.012,
    near: leg(hipY, p, speed, dims),
    far: leg(hipY, pFar, speed, dims),
    // against the legs: when the near foot is forward, the near arm swings back
    armShield: -Math.cos(TAU * p) * GAIT.armShield,
    armSpear: Math.cos(TAU * p) * GAIT.armSpear,
    stride: strideLength(speed)
  }
}

/** A number that goes to its goal softly (no jump), `rate` per second. */
export function approach(cur: number, goal: number, rate: number, dt: number): number {
  const k = 1 - Math.exp(-rate * dt)
  return cur + (goal - cur) * k
}
