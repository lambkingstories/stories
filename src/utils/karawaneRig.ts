/**
 * "Karawane über die Dünen": the walk of the draught animals. The animal is a paper doll (a body, four legs in two pieces each, a tail), and this
 * file works out the angles of the pieces: a real trot with diagonal pairs of legs (near fore with far hind, far fore with near hind), the speed
 * of the legs tied to the speed of the cart (the feet do not slide), a body that bobs twice per stride and nods a little, a swinging tail,
 * legs that stretch out in the air and rest when the animal stands. Plain calculation (no Vue), tested.
 */

export interface RigParams {
  /** The length of a leg in metres. */
  legLen: number
  /** The swing of the legs (radians) at a slow and at a fast pace. */
  ampMin: number
  ampMax: number
  /** How far the knee bends while the leg swings forward (radians). */
  kneeBend: number
  /** The fastest the legs may go (radians per second). */
  maxOmega: number
  /** How much the body bobs (metres), nods (radians) and how far the tail swings (radians). */
  bobAmp: number
  headNod: number
  tailSwing: number
  /** In the air the fore legs reach forward and the hind legs back (radians), and the knees bend this much. */
  airFore: number
  airHind: number
  airKnee: number
}

export interface RigState {
  /** The phase of the stride (radians). */
  phase: number
  /** The swing in use now (radians), smoothed. */
  amp: number
  /** 0 standing, 1 moving. */
  moving: number
  /** 0 on the ground, 1 in the air. */
  air: number
  t: number
}

export interface LegPose {
  /** The angle of the whole leg at the shoulder or hip (radians, positive: the foot swings forward). */
  hip: number
  /** The bend of the knee (radians, positive: the lower leg swings back). */
  knee: number
}

export interface Pose {
  /** Near fore, far fore, near hind, far hind. */
  legs: LegPose[]
  bodyY: number
  bodyPitch: number
  tail: number
}

export const newRigState = (): RigState => ({ phase: 0, amp: 0, moving: 0, air: 0, t: 0 })
export const newPose = (): Pose => ({ legs: [0, 1, 2, 3].map(() => ({ hip: 0, knee: 0 })), bodyY: 0, bodyPitch: 0, tail: 0 })

const smoothstep = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return u * u * (3 - 2 * u)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** The phase of each leg: the diagonal pairs go together. */
export const LEG_OFFSET = [0, Math.PI, Math.PI, 0]

/** Moves the walk on by `dt` seconds at `speed` (m/s along the way) on the ground or in the air. */
export function stepRig(s: RigState, p: RigParams, dt: number, speed: number, airborne: boolean): void {
  const sp = Math.abs(speed)
  s.t += dt
  s.moving += (smoothstep(0.15, 1.2, sp) - s.moving) * (1 - Math.exp(-8 * dt))
  s.air += ((airborne ? 1 : 0) - s.air) * (1 - Math.exp(-9 * dt))
  const ampTarget = lerp(p.ampMin, p.ampMax, Math.min(1, sp / 12)) * s.moving
  s.amp += (ampTarget - s.amp) * (1 - Math.exp(-6 * dt))
  // the stance leg moves back at the speed of the cart: speed = amp * legLen * omega
  let omega = Math.sign(speed || 1) * Math.min(p.maxOmega, sp / Math.max(0.25, lerp(p.ampMin, p.ampMax, Math.min(1, sp / 12)) * p.legLen))
  // in the air the legs paddle slowly
  omega *= 1 - 0.65 * s.air
  s.phase += omega * dt * s.moving
  if (s.phase > 1e4 || s.phase < -1e4) s.phase %= Math.PI * 2
}

/** The angles of the pieces now (fills `out` and returns it). */
export function rigPose(s: RigState, p: RigParams, out: Pose = newPose()): Pose {
  for (let i = 0; i < 4; i++) {
    const ph = s.phase + LEG_OFFSET[i]!
    const fore = i < 2
    const swing = s.amp * Math.sin(ph)
    const knee = p.kneeBend * Math.max(0, Math.cos(ph)) * s.moving
    const airHip = fore ? p.airFore : -p.airHind
    out.legs[i]!.hip = lerp(swing, airHip, s.air)
    out.legs[i]!.knee = lerp(knee, p.airKnee, s.air)
  }
  out.bodyY = p.bobAmp * s.moving * Math.cos(2 * s.phase) * (1 - s.air)
  out.bodyPitch = p.headNod * s.moving * Math.sin(s.phase - 0.5) * (1 - s.air) - 0.05 * s.air
  out.tail = p.tailSwing * (0.45 * Math.sin(s.phase + 1.3) * s.moving + 0.14 * Math.sin(s.t * 1.7))
  return out
}

/** How the legs of each animal move (tuned by looking at the painted pieces). */
export const RIG_PARAMS: Record<'donkey' | 'ox' | 'camel' | 'horse', RigParams> = {
  donkey: { legLen: 0.68, ampMin: 0.34, ampMax: 0.58, kneeBend: 0.75, maxOmega: 19, bobAmp: 0.035, headNod: 0.035, tailSwing: 0.3, airFore: 0.5, airHind: 0.45, airKnee: 0.5 },
  ox: { legLen: 0.82, ampMin: 0.3, ampMax: 0.5, kneeBend: 0.6, maxOmega: 17, bobAmp: 0.03, headNod: 0.03, tailSwing: 0.26, airFore: 0.45, airHind: 0.4, airKnee: 0.45 },
  camel: { legLen: 1.2, ampMin: 0.3, ampMax: 0.5, kneeBend: 0.7, maxOmega: 15, bobAmp: 0.05, headNod: 0.05, tailSwing: 0.22, airFore: 0.5, airHind: 0.5, airKnee: 0.55 },
  horse: { legLen: 1.1, ampMin: 0.36, ampMax: 0.62, kneeBend: 0.95, maxOmega: 21, bobAmp: 0.045, headNod: 0.05, tailSwing: 0.36, airFore: 0.6, airHind: 0.55, airKnee: 0.6 }
}
