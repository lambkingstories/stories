/**
 * "Karawane über die Dünen": the rules and the physics of the third big game (a driving game like Hill Climb Racing; drawn and touched in
 * `BigGameKarawane.vue`). A cart on two wheels pulled by an animal drives from left to right over hills and dunes. Two keys: gas and brake
 * (backwards). The vehicle is one rigid body with two springs against the ground (the cart wheel and the feet of the animal): it bounces,
 * pitches, flies and must land well. Gas in the air lifts the nose, brake lowers it. The jars on the cart or the head of the animal on the
 * ground end the round. Stamina (the water of the animal) runs down; skins of water and the oases fill it. Everything here is plain
 * calculation in metres and seconds with a fixed time step and a seed, so that it can be tested (a bot drives a way in the tests).
 */
import type { Stats } from '@/utils/karawaneUpgrades'

// ── the time ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The fixed step of the physics (seconds). */
export const DT = 1 / 120
/** The distance between two measured heights of the ground (metres). */
export const STEP = 0.25
export const GRAVITY = 9.81

// ── random numbers with a seed ─────────────────────────────────────────────────────────────────────────────────────────────
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── the routes ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface RouteDef {
  id: string
  /** The metres to the goal (the finish gate; reaching it gives three stars). */
  length: number
  /** The metres for one, two and three stars. */
  goals: [number, number, number]
  seed: number
  /** The steepest slope (degrees) at the start and at the end of the way. */
  angles: [number, number]
  /** How high above the start the way may climb in the end. */
  relief: number
  /** The distance between two oases. */
  oasisGap: number
  /** The look of the way: the files `fern-N`, `mitte-N`, `boden-N`, `deko-N` and the mood of the sky. */
  mood: 'day' | 'dusk' | 'night' | 'morning' | 'bright' | 'gold'
  /** The character of the way: the grip of the ground (a factor), how deep the sand is (rolling resistance, 1 = none), the strength of the wind gusts (m/s squared), how big the hills are (a factor). */
  grip: number
  sand: number
  wind: number
  hillAmp: number
  /** Where the first oasis lies (a lively start has it early). */
  firstOasis?: number
  /** A lively start: a first small jump and bigger hills within the first hundred metres. */
  lively?: boolean
  /** The symbols shown on the card of the route. */
  chars: ('sand' | 'hills' | 'steep' | 'wind' | 'slippery' | 'festive')[]
}

export const ROUTES: RouteDef[] = [
  { id: 'egypt', length: 900, goals: [250, 550, 900], seed: 1337, angles: [10, 20], relief: 14, oasisGap: 270, mood: 'day', grip: 1, sand: 1.4, wind: 0, hillAmp: 1.35, firstOasis: 120, lively: true, chars: ['sand', 'hills'] },
  { id: 'bethlehem', length: 1000, goals: [280, 620, 1000], seed: 2024, angles: [11, 22], relief: 24, oasisGap: 280, mood: 'dusk', grip: 1.05, sand: 1, wind: 0, hillAmp: 1.45, firstOasis: 130, lively: true, chars: ['hills'] },
  { id: 'magi', length: 1100, goals: [300, 700, 1100], seed: 7771, angles: [11, 22], relief: 16, oasisGap: 290, mood: 'night', grip: 0.95, sand: 1.25, wind: 1.1, hillAmp: 1, chars: ['sand', 'wind'] },
  { id: 'jordan', length: 1200, goals: [320, 760, 1200], seed: 4242, angles: [12, 24], relief: 20, oasisGap: 300, mood: 'morning', grip: 0.85, sand: 1, wind: 0.4, hillAmp: 0.85, chars: ['slippery'] },
  { id: 'judea', length: 1300, goals: [340, 820, 1300], seed: 9001, angles: [13, 26], relief: 46, oasisGap: 310, mood: 'bright', grip: 1.1, sand: 1, wind: 0.6, hillAmp: 1.2, chars: ['steep', 'wind'] },
  { id: 'jerusalem', length: 1500, goals: [360, 900, 1500], seed: 5150, angles: [13, 26], relief: 36, oasisGap: 330, mood: 'gold', grip: 1, sand: 1, wind: 0.3, hillAmp: 1.1, chars: ['festive'] }
]

export const ROUTE_COUNT = ROUTES.length
/** The stars that can be won in all routes together. */
export const MAX_STARS = ROUTE_COUNT * 3

/** One, two or three stars for the metres reached. */
export function starsFor(route: number, meters: number): number {
  const g = ROUTES[route]!.goals
  return meters >= g[2] ? 3 : meters >= g[1] ? 2 : meters >= g[0] ? 1 : 0
}

// ── the ground ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type PickupKind = 'coin' | 'date' | 'skin' | 'pouch'
export interface Pickup {
  x: number
  y: number
  kind: PickupKind
}
export interface Decor {
  x: number
  /** Which of the six things of the sheet `deko-N`. */
  kind: number
  scale: number
  flip: boolean
}
export interface Track {
  route: number
  /** The heights of the ground every `STEP` metres. */
  h: Float32Array
  length: number
  finishX: number
  /** The middle of every oasis. */
  oases: number[]
  pickups: Pickup[]
  decor: Decor[]
  /** The steepest slope that was built (tangent), for the tests. */
  maxSlope: number
}

export const START_X = 8

export function heightAt(t: Track, x: number): number {
  const f = x / STEP
  const n = t.h.length - 1
  if (f <= 0) return t.h[0]!
  if (f >= n) return t.h[n]!
  const i = f | 0
  const u = f - i
  return t.h[i]! * (1 - u) + t.h[i + 1]! * u
}

/** The slope (dy/dx) of the ground at x. */
export function slopeAt(t: Track, x: number): number {
  return (heightAt(t, x + 0.2) - heightAt(t, x - 0.2)) / 0.4
}

const rad = (d: number) => (d * Math.PI) / 180
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const smooth = (u: number) => u * u * (3 - 2 * u)

type Fn = (u: number) => number

/** Builds the ground of a route from blocks (flat stretches, hills, valleys, bumps, ramps with a landing, climbs), always with a seed. */
export function generateTrack(route: number, seed?: number): Track {
  const R = ROUTES[route]!
  const rnd = rng(seed ?? R.seed)
  const range = (a: number, b: number) => a + (b - a) * rnd()
  const total = R.length + 140
  const n = Math.ceil(total / STEP) + 1
  const h = new Float32Array(n)
  let i = 0
  let y = 0
  const oases: number[] = []
  const crests: number[] = []
  let finishX = 0

  /** Puts a block of `len` metres whose shape is `f` (0 at the start, the rise at the end). */
  const stopAt = Math.floor((R.length - 20) / STEP)
  const put = (len: number, f: Fn) => {
    const k = Math.max(2, Math.round(len / STEP))
    let j = 0
    for (; j < k && i < n && i < stopAt; j++, i++) h[i] = y + f((j + 0.5) / k)
    y += f(j / k)
  }
  const flat = (len: number) => put(len, () => 0)

  /** A ramp, a short top and a steep drop behind it: the cart takes off and lands on a long gentle slope (a "jump"). */
  const jump = (a1: number, l1: number, extraDrop: number) => {
    const up = a1 * l1
    const dy = Math.max(0.9, up - 0.8 + range(0.3, 1.3) + extraDrop)
    const ld = dy / 0.7
    const landing = 0.18
    const ll = 9
    const total = l1 + 1.2 + ld + ll
    put(total, (u) => {
      const m = u * total
      if (m < l1) return a1 * m
      if (m < l1 + 1.2) return up
      if (m < l1 + 1.2 + ld) return up - 0.7 * (m - l1 - 1.2)
      return up - dy - landing * (m - l1 - 1.2 - ld)
    })
    crests.push(i * STEP - ld - ll - 1.2)
  }
  const hill = (len: number, amp: number, sign = 1) => put(len, (u) => sign * amp * (1 - Math.cos(2 * Math.PI * u)) * 0.5)

  if (R.lively) {
    // a lively start: soft hills with dips, a first little jump within the first hundred metres, bigger hills after it
    flat(24)
    hill(30, 1.1)
    flat(6)
    hill(24, 0.9, -1)
    flat(8)
    jump(Math.tan(rad(11)), 8, 0.3)
    flat(8)
    hill(34, 1.6)
    hill(30, 1.2, -1)
    flat(8)
  } else {
    // the start: a long flat run-up and a very gentle first hill
    flat(34)
    hill(36, 0.7)
    flat(10)
  }

  let nextOasis = R.firstOasis ?? R.oasisGap * range(0.8, 0.95)
  let placedFinish = false
  let last = ''
  let guard = 0
  while (i < n && guard++ < 4000) {
    const x = i * STEP
    const d = Math.min(1, x / R.length)
    const easy = x < 160 ? (R.lively ? 0.8 : 0.55) : 1
    const A = Math.tan(rad(lerp(R.angles[0], R.angles[1], d)) * easy)
    if (x >= R.length - 20) {
      // the finish: a long flat stretch, the gate stands exactly at the goal
      finishX = R.length
      i = Math.max(i, stopAt)
      flat(n * STEP - i * STEP)
      placedFinish = true
      break
    }
    if (x >= nextOasis && x < R.length - 110) {
      oases.push(x + 16)
      flat(32)
      nextOasis += R.oasisGap * range(0.9, 1.1)
      last = 'oasis'
      continue
    }
    // what may come: stay inside the height of the route
    const high = y > R.relief * 0.85
    const low = y < -9
    type Block = { w: number; run: () => void; name: string }
    const blocks: Block[] = []
    const add = (name: string, w: number, run: () => void) => {
      if (w > 0 && name !== last) blocks.push({ name, w, run })
    }
    add('flat', 1.2, () => flat(range(10, 24)))
    add('hill', low ? 1 : 3, () => {
      const len = range(24, 46)
      const amp = Math.min(range(1.2, 2.7) * (0.6 + 0.9 * d) * R.hillAmp, (len * A * 0.9) / Math.PI)
      put(len, (u) => amp * (1 - Math.cos(2 * Math.PI * u)) * 0.5)
    })
    add('valley', high ? 3 : y > -6 ? 1.6 : 0, () => {
      const len = range(26, 48)
      const amp = Math.min(range(1.2, 2.6) * (0.6 + 0.9 * d) * R.hillAmp, (len * A * 0.9) / Math.PI)
      put(len, (u) => -amp * (1 - Math.cos(2 * Math.PI * u)) * 0.5)
    })
    add('bumps', 1.2 + 1.6 * d, () => {
      const nb = Math.round(range(3, 6))
      const wl = range(7.5, 11)
      const amp = Math.min(range(0.28, 0.6) * (0.6 + d), (wl * A * 0.9) / Math.PI)
      put(nb * wl, (u) => amp * (1 - Math.cos(2 * Math.PI * nb * u)) * 0.5)
    })
    add('up', high ? 0 : 2.2, () => {
      const len = range(22, 48)
      const dy = (A * 0.78 * len) / 1.5
      put(len, (u) => dy * smooth(u))
    })
    add('down', low ? 0 : 2.2, () => {
      const len = range(22, 48)
      const dy = (A * 0.78 * len) / 1.5
      put(len, (u) => -dy * smooth(u))
    })
    add('crest', x > (R.lively ? 45 : 90) ? 1 + 2.4 * d + (R.lively ? 0.6 : 0) : 0, () => {
      flat(range(12, 18))
      jump(Math.tan(rad(lerp(R.lively ? 10 : 12, 29, d))), range(8, 13), d * range(0.5, 2.2))
      flat(range(8, 14))
    })
    add('climb', d > 0.1 && !high ? 0.6 + 1.8 * d : 0, () => {
      const len = range(30, 60)
      const dy = (A * 0.93 * len) / 1.5
      put(len, (u) => dy * smooth(u))
      flat(range(10, 16))
    })
    let tot = 0
    for (const b of blocks) tot += b.w
    let pick = rnd() * tot
    let chosen = blocks[0]!
    for (const b of blocks) {
      pick -= b.w
      if (pick <= 0) {
        chosen = b
        break
      }
    }
    chosen.run()
    last = chosen.name
  }
  while (i < n) h[i++] = y

  // soften every corner (a moving average of about one and a half metres, twice)
  const tmp = new Float32Array(n)
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < n; k++) {
      let s = 0
      let c = 0
      for (let o = -3; o <= 3; o++) {
        const q = k + o
        if (q >= 0 && q < n) {
          s += h[q]!
          c++
        }
      }
      tmp[k] = s / c
    }
    h.set(tmp)
  }
  // the very start is flat, so the cart stands still
  const flatN = Math.round((START_X + 6) / STEP)
  for (let k = 0; k < flatN; k++) h[k] = h[flatN]!

  let maxSlope = 0
  for (let k = 1; k < n; k++) maxSlope = Math.max(maxSlope, Math.abs(h[k]! - h[k - 1]!) / STEP)

  const t: Track = { route, h, length: R.length, finishX, oases, pickups: [], decor: [], maxSlope }
  placePickups(t, rnd, crests)
  placeDecor(t, rnd)
  return t
}

const nearOasis = (t: Track, x: number, r: number) => t.oases.some((o) => Math.abs(o - x) < r)

/** Coins in lines, dates in threes, skins of water now and then, a pouch over some of the ridges, and arcs of coins above the jumps. */
function placePickups(t: Track, rnd: () => number, crests: number[]): void {
  const range = (a: number, b: number) => a + (b - a) * rnd()
  const out = t.pickups
  let x = 38
  let nextSkin = range(70, 110)
  while (x < t.finishX - 12) {
    if (nearOasis(t, x, 22)) {
      x += 10
      continue
    }
    if (x >= nextSkin) {
      out.push({ x, y: heightAt(t, x) + 1.3, kind: 'skin' })
      nextSkin = x + range(110, 150)
      x += 14
      continue
    }
    const r = rnd()
    if (r < 0.55) {
      const c = Math.round(range(4, 8))
      for (let k = 0; k < c; k++) {
        const px = x + k * 2.2
        out.push({ x: px, y: heightAt(t, px) + 1.35, kind: 'coin' })
      }
      x += c * 2.2 + range(10, 20)
    } else if (r < 0.85) {
      for (let k = 0; k < 3; k++) {
        const px = x + k * 2.6
        out.push({ x: px, y: heightAt(t, px) + 1.4 + (k === 1 ? 0.4 : 0), kind: 'date' })
      }
      x += 8 + range(12, 22)
    } else {
      x += range(10, 20)
    }
  }
  for (const cx of crests) {
    if (cx < 60 || cx > t.finishX - 30 || nearOasis(t, cx, 30)) continue
    const base = heightAt(t, cx)
    for (let k = 0; k < 7; k++) {
      const px = cx + 3 + k * 2.4
      const arc = 1.4 + 2.6 * Math.sin((Math.PI * k) / 6)
      out.push({ x: px, y: Math.max(heightAt(t, px) + 1.3, base + arc - 0.6 * k * 0.2), kind: k === 3 ? 'pouch' : 'coin' })
    }
  }
  out.sort((a, b) => a.x - b.x)
}

/** Palms, rocks, trees and houses along the way (what the six things are is painted in the sheet `deko-N`). */
function placeDecor(t: Track, rnd: () => number): void {
  const range = (a: number, b: number) => a + (b - a) * rnd()
  let x = 12
  let prev = -1
  while (x < t.finishX + 70) {
    if (!nearOasis(t, x, 20) && Math.abs(x - t.finishX) > 8) {
      let kind = Math.floor(rnd() * 6)
      if (kind === prev) kind = (kind + 1 + Math.floor(rnd() * 5)) % 6
      prev = kind
      t.decor.push({ x, kind, scale: range(0.85, 1.2), flip: rnd() < 0.5 })
    }
    x += range(9, 26)
  }
}

// ── the vehicle ────────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface Input {
  gas: boolean
  brake: boolean
}

interface SupportDef {
  /** Where the spring is fixed on the body (the body frame: x forward, y up, the origin is the centre of mass). */
  lx: number
  ly: number
  /** The length of the spring when nothing presses on it (the wheel hangs down this far). */
  l0: number
  /** The share of the weight that the support carries. */
  share: number
}

export const REAR: SupportDef = { lx: -1.15, ly: 0.05, l0: 0.62, share: 0.5 }
export const FRONT: SupportDef = { lx: 1.25, ly: 0.1, l0: 1.1, share: 0.5 }
export const FOOT_R = 0.12
/** The points that must not touch the ground: the jars on the cart (three) and the head of the animal. */
export const LOAD_POINTS: [number, number][] = [
  [-2.05, 0.85],
  [-1.15, 1.05],
  [-0.3, 0.85]
]
export const HEAD_POINT: [number, number] = [1.95, 0.35]
/** The belly of the cart: it scrapes over a ridge instead of ending the round. */
export const BELLY_POINTS: [number, number][] = [
  [-0.45, -0.42],
  [0.35, -0.45]
]
const GYRATION2 = 1.25
const ANG_DAMP = 0.5
const BUMP_K = 320
const BELLY_K = 260

export interface Support {
  /** The compression of the spring in metres (0: hanging in the air). */
  comp: number
  /** The centre of the wheel (or of the foot) in the world. */
  cx: number
  cy: number
  /** The extension of the spring (for drawing). */
  ext: number
  load: number
  contact: boolean
  /** The slope angle under the support (radians). */
  slope: number
  /** The turning of the wheel in radians (for drawing). */
  spin: number
  /** The compression of the last step (for the damper). */
  prev: number
}

export type GameEvent =
  | { type: 'pickup'; kind: PickupKind; coins: number; x: number; y: number }
  | { type: 'oasis'; x: number }
  | { type: 'jump'; coins: number; dist: number }
  | { type: 'flip'; coins: number; count: number }
  | { type: 'land'; speed: number; air: number; dist: number }
  | { type: 'crash'; kind: 'load' | 'animal' }
  | { type: 'won' }
  | { type: 'tired' }
  | { type: 'low' }
  | { type: 'hop' }

export type Phase = 'play' | 'crash' | 'won' | 'tired'

const R_OF = (r: Run): RouteDef => ROUTES[r.route]!

export interface Run {
  /** The seconds until the next hop is possible (a hop is a short push up from the ground). */
  hopCd: number
  /** A corner of the cart is deep in the ground (a hard impact): the round ends at once. */
  deep: boolean
  /** Whether a support touches the ground in this step. */
  touching: number
  track: Track
  stats: Stats
  route: number
  t: number
  x: number
  y: number
  a: number
  vx: number
  vy: number
  w: number
  rear: Support
  front: Support
  /** What the stamina is (0 to 1). */
  stamina: number
  /** The metres reached (the furthest). */
  meters: number
  /** The coins of this round (found coins, bonuses). */
  coins: number
  phase: Phase
  crashKind: 'load' | 'animal' | null
  /** The seconds since the end (for the slow end and the result). */
  endT: number
  /** The way of the airtime. */
  airT: number
  airRot: number
  airStartX: number
  airAngle: number
  grounded: number
  /** A bonus that waits for a safe landing. */
  pendJump: number
  pendFlips: number
  pendT: number
  pendDist: number
  taken: Uint8Array
  /** The last oasis that was reached: the cart can go on from there. */
  checkpoint: number
  idle: number
  crashAcc: number
  lowSaid: boolean
  /** How long the gas was held (for the animal's bobbing), and a running count of the metres for the legs. */
  gasT: number
  events: GameEvent[]
  acc: number
  /** The gas and brake of the last step (for drawing). */
  gas: number
  brake: number
  lastCx: number
}

function newSupport(): Support {
  return { comp: 0, cx: 0, cy: 0, ext: 0, load: 0, contact: false, slope: 0, spin: 0, prev: 0 }
}

/** Starts a round on a track; with `from` (the metres) the cart stands at that oasis with full stamina. */
export function newRun(track: Track, stats: Stats, from = 0): Run {
  const x0 = from > 0 ? from : START_X
  const r: Run = {
    track,
    stats,
    route: track.route,
    t: 0,
    x: x0,
    y: heightAt(track, x0) + 1.05,
    a: 0,
    vx: 0,
    vy: 0,
    w: 0,
    rear: newSupport(),
    front: newSupport(),
    stamina: 1,
    meters: Math.max(0, x0 - START_X),
    coins: 0,
    phase: 'play',
    crashKind: null,
    endT: 0,
    airT: 0,
    airRot: 0,
    airStartX: 0,
    airAngle: 0,
    grounded: 1,
    pendJump: 0,
    pendFlips: 0,
    pendT: 0,
    pendDist: 0,
    hopCd: 0,
    deep: false,
    touching: 0,
    taken: new Uint8Array(track.pickups.length),
    checkpoint: from,
    idle: 0,
    crashAcc: 0,
    lowSaid: false,
    gasT: 0,
    events: [],
    acc: 0,
    gas: 0,
    brake: 0,
    lastCx: 0
  }
  // the pickups behind the start are gone
  for (let k = 0; k < track.pickups.length; k++) if (track.pickups[k]!.x < x0 + 4) r.taken[k] = 1
  // settle the springs
  for (let k = 0; k < 120; k++) physics(r, DT, { gas: false, brake: false }, true)
  r.x = x0
  r.vx = 0
  r.vy = 0
  r.w = 0
  r.t = 0
  r.events.length = 0
  return r
}

/** The highest point that a circle of radius `rad` standing at x can reach (the circle rolls over the ground). */
function envelope(t: Track, x: number, rr: number): number {
  let e = -1e9
  for (let k = -3; k <= 3; k++) {
    const o = (k / 3) * rr
    const v = heightAt(t, x + o) + Math.sqrt(Math.max(0, rr * rr - o * o))
    if (v > e) e = v
  }
  return e
}

/** Works out one support: where the wheel sits and how much the spring is pressed. */
function solve(r: Run, def: SupportDef, S: Support, rr: number): void {
  const c = Math.cos(r.a)
  const s = Math.sin(r.a)
  const ax = r.x + def.lx * c - def.ly * s
  const ay = r.y + def.lx * s + def.ly * c
  let ext = def.l0
  if (c > 0.12) {
    for (let k = 0; k < 4; k++) {
      const cx = ax + s * ext
      ext = (ay - envelope(r.track, cx, rr)) / c
    }
  }
  const comp = def.l0 - ext
  S.comp = comp > 0 ? comp : 0
  S.ext = ext > def.l0 ? def.l0 : ext
  S.cx = ax + s * S.ext
  S.cy = ay - c * S.ext
}

/** The ground for a wreck: every corner of the cart is stopped by the ground (no bounce upwards), it slides on and comes to rest. */
function wreckGround(r: Run, dt: number): void {
  const tr = r.track
  const c = Math.cos(r.a)
  const s = Math.sin(r.a)
  let worst = 0
  const check = (px: number, py: number) => {
    const pen = heightAt(tr, r.x + px * c - py * s) - (r.y + px * s + py * c)
    if (pen > worst) worst = pen
  }
  for (const [px, py] of LOAD_POINTS) check(px, py)
  for (const [px, py] of BELLY_POINTS) check(px, py)
  check(HEAD_POINT[0], HEAD_POINT[1])
  check(REAR.lx, REAR.ly - 0.6)
  check(FRONT.lx, FRONT.ly - 0.6)
  if (worst > 0) {
    // pushed out of the ground slowly (never a jump), the fall is stopped, the slide rubs off
    r.y += Math.min(worst * 0.3, 0.012)
    if (r.vy < 0) r.vy = 0
    r.vx *= 1 - 4 * dt
    r.w *= 1 - 5 * dt
  }
  // never flung upwards
  if (r.vy > 1) r.vy = 1
}

function physics(r: Run, dt: number, input: Input, quiet = false): void {
  const st = r.stats
  const tr = r.track
  const c = Math.cos(r.a)
  const s = Math.sin(r.a)
  const running = r.phase === 'play'
  const gas = running && input.gas && r.stamina > 0 ? 1 : 0
  const gasKey = running && input.gas ? 1 : 0
  const brake = running && input.brake ? 1 : 0
  r.gas = gasKey
  r.brake = brake

  solve(r, REAR, r.rear, st.wheelR)
  solve(r, FRONT, r.front, FOOT_R)

  let fx = 0
  let fy = -GRAVITY
  let torque = 0
  let touching = 0
  // after a crash the cart is a wreck: no springs, no drive, only the ground and gravity (it falls, tips, slides and lies still)
  const wreck = r.phase === 'crash'
  for (let si = 0; si < 2 && !wreck; si++) {
    const def = si === 0 ? REAR : FRONT
    const S = si === 0 ? r.rear : r.front
    S.contact = S.comp > 0.002
    S.load = 0
    if (!S.contact) continue
    touching++
    // the spring and its damper (per unit mass)
    const kk = st.K
    const cc = 2 * st.zeta * Math.sqrt(kk * def.share)
    let cv = (S.comp - S.prev) / dt
    if (cv > 10) cv = 10
    else if (cv < -10) cv = -10
    let F = kk * S.comp + cc * cv
    const travel = si === 1 ? st.travel * 1.3 : st.travel
    if (S.comp > travel) F += BUMP_K * (S.comp - travel)
    if (F < 0) F = 0
    S.load = F
    // the force pushes along the up axis of the body, at the fixing of the spring
    const ux = -s
    const uy = c
    const rx = def.lx * c - def.ly * s
    const ry = def.lx * s + def.ly * c
    fx += F * ux
    fy += F * uy
    torque += rx * F * uy - ry * F * ux
    // the ground under the support
    const gx = S.cx
    const slope = slopeAt(tr, gx)
    S.slope = Math.atan(slope)
    const nl = Math.sqrt(1 + slope * slope)
    const tx = 1 / nl
    const ty = slope / nl
    const nx = -slope / nl
    const ny = 1 / nl
    const rr = si === 0 ? st.wheelR : FOOT_R
    const px = S.cx - nx * rr
    const py = S.cy - ny * rr
    const prx = px - r.x
    const pry = py - r.y
    const vpx = r.vx - r.w * pry
    const vpy = r.vy + r.w * prx
    const vt = vpx * tx + vpy * ty
    const grip = st.mu * R_OF(r).grip * Math.min(F, 14)
    let ft = 0
    if (si === 1) {
      if (gas) ft += Math.min(st.power * (1 - Math.min(1.4, Math.max(0, vt) / st.vmax)), grip)
      if (brake) {
        if (vt > 0.5) ft -= Math.min(7.5, grip)
        else ft -= Math.min(st.power * 0.55 * (1 - Math.min(1, Math.max(0, -vt) / 4)), grip)
      }
    } else if (brake && vt > 0.5) {
      ft -= Math.min(4.5, grip)
    }
    // the animal holds the cart when nobody pulls or brakes (it stands, or trots slower), the wheel rolls freely
    if (si === 1 && !gas && !brake) ft -= Math.max(-2.2, Math.min(2.2, vt * 2.5))
    // rolling and air friction
    ft -= vt * (0.02 + 0.1 * (R_OF(r).sand - 1)) + (vt > 0 ? 0.0015 : -0.0015) * vt * vt
    fx += ft * tx
    fy += ft * ty
    torque += prx * ft * ty - pry * ft * tx
    S.spin += (vt / rr) * dt
  }
  // keep the compressions for the damper
  r.rear.prev = r.rear.comp
  r.front.prev = r.front.comp

  // air: gas lifts the nose, brake lowers it; on the ground the cart levels itself a little with the slope
  if (wreck) {
    // nothing steers a wreck
  } else if (touching === 0) {
    torque += 4.4 * (gasKey - brake) * GYRATION2 * (running ? 1 : 0)
    // a little help in the air: the nose slowly turns towards the slope where the cart will land
    if (running) {
      const land = Math.atan(slopeAt(tr, r.x + Math.max(2, r.vx * 0.4)))
      torque += st.assist * 0.55 * GYRATION2 * Math.max(-1, Math.min(1, land - r.a))
    }
  } else if (running) {
    const target = Math.atan(slopeAt(tr, r.x))
    torque += r.stats.assist * GYRATION2 * Math.max(-1, Math.min(1, target - r.a)) * (touching === 2 ? 1 : 0.35)
  }

  // the belly and the points that end a round
  const belly = (px: number, py: number, k: number) => {
    const wx = r.x + px * c - py * s
    const wy = r.y + px * s + py * c
    const pen = heightAt(tr, wx) - wy
    if (pen > 0) {
      const prx = wx - r.x
      const pry = wy - r.y
      const vpx = r.vx - r.w * pry
      const vpy = r.vy + r.w * prx
      const F = Math.max(0, k * pen - 9 * vpy)
      fy += F
      fx -= vpx * 1.5
      torque += prx * F
    }
  }
  if (!wreck) for (const [px, py] of BELLY_POINTS) belly(px, py, BELLY_K)
  let touchLoad = false
  let touchHead = false
  let deep = false
  for (const [px, py] of LOAD_POINTS) {
    const wx = r.x + px * c - py * s
    const wy = r.y + px * s + py * c
    const pe = heightAt(tr, wx) - wy
    if (pe > 0.12) touchLoad = true
    if (pe > 0.25) deep = true
  }
  {
    const wx = r.x + HEAD_POINT[0] * c - HEAD_POINT[1] * s
    const wy = r.y + HEAD_POINT[0] * s + HEAD_POINT[1] * c
    const pe = heightAt(tr, wx) - wy
    if (pe > 0.12) touchHead = true
    if (pe > 0.25) deep = true
  }
  r.deep = deep

  r.touching = touching
  if (r.hopCd > 0) r.hopCd -= dt
  // gusts of wind (a slow push to and fro, stronger on some ways)
  const wind = R_OF(r).wind
  if (wind > 0 && running) fx += wind * Math.sin(r.t * 0.45 + r.route) * (0.6 + 0.4 * Math.sin(r.t * 1.3))

  // the integration
  r.vx += fx * dt
  r.vy += fy * dt
  r.w += (torque / GYRATION2) * dt
  r.w *= 1 - ANG_DAMP * dt
  if (r.w > 7) r.w = 7
  else if (r.w < -7) r.w = -7
  const sp = Math.hypot(r.vx, r.vy)
  if (sp > 38) {
    r.vx *= 38 / sp
    r.vy *= 38 / sp
  }
  r.x += r.vx * dt
  r.y += r.vy * dt
  r.a += r.w * dt
  if (wreck) wreckGround(r, dt)
  // not back past the start
  if (r.x < 2) {
    r.x = 2
    if (r.vx < 0) r.vx = 0
  }
  // never inside the ground
  const gmin = heightAt(tr, r.x) + 0.25
  if (r.y < gmin) {
    r.y = gmin
    if (r.vy < 0) r.vy = 0
  }
  r.t += dt
  if (quiet) return

  // ── the round ──
  if (r.phase === 'play' || r.phase === 'crash') {
    if (r.x - START_X > r.meters) r.meters = r.x - START_X
  }
  if (r.phase === 'play') {
    // the stamina
    const T = st.staminaSec
    r.stamina -= (dt * (0.32 + 0.68 * gasKey)) / T
    if (r.stamina < 0) r.stamina = 0
    if (r.stamina < 0.22 && !r.lowSaid) {
      r.lowSaid = true
      r.events.push({ type: 'low' })
    }
    if (r.stamina > 0.4) r.lowSaid = false
    r.gasT += gas * dt
    // pickups
    for (let k = 0; k < tr.pickups.length; k++) {
      if (r.taken[k]) continue
      const p = tr.pickups[k]!
      if (p.x < r.x - 6) {
        r.taken[k] = 1
        continue
      }
      if (p.x > r.x + 5) break
      if (Math.hypot(p.x - r.x, p.y - r.y) < 1.7) {
        r.taken[k] = 1
        const base = p.kind === 'coin' ? 5 : p.kind === 'date' ? 2 : p.kind === 'pouch' ? 25 : 0
        const coins = Math.round(base * st.coinMult)
        r.coins += coins
        if (p.kind === 'skin') r.stamina = Math.min(1, r.stamina + 0.35)
        else if (p.kind === 'date') r.stamina = Math.min(1, r.stamina + 0.08)
        r.events.push({ type: 'pickup', kind: p.kind, coins, x: p.x, y: p.y })
      }
    }
    // oases fill the stamina and are checkpoints
    for (const o of tr.oases) {
      if (o > r.checkpoint && Math.abs(o - r.x) < 5) {
        r.checkpoint = o
        r.stamina = 1
        r.lowSaid = false
        r.events.push({ type: 'oasis', x: o })
      }
    }
    // the air: how long, how far, how many turns; the bonus waits for a safe landing
    const inAir = touching === 0
    if (inAir) {
      if (r.grounded > 0) {
        r.grounded = 0
        r.airT = 0
        r.airRot = 0
        r.airStartX = r.x
        r.airAngle = r.a
      } else {
        r.airT += dt
        r.airRot += r.w * dt
      }
    } else {
      if (r.grounded === 0) {
        // just landed
        const dist = r.x - r.airStartX
        if (r.airT > 0.9 || dist > 11) {
          r.pendJump = Math.round((6 + Math.max(0, r.airT - 0.9) * 14 + Math.max(0, dist - 11) * 1.5) * st.coinMult)
        }
        const flips = Math.floor((Math.abs(r.airRot) + 0.5) / (2 * Math.PI))
        if (flips > 0) r.pendFlips = flips
        if (r.airT > 0.3) r.events.push({ type: 'land', speed: Math.abs(r.vy), air: r.airT, dist })
        r.pendT = r.pendJump > 0 || r.pendFlips > 0 ? 0.55 : 0
        r.pendDist = dist
      }
      r.grounded += dt
    }
    if (r.pendT > 0) {
      r.pendT -= dt
      if (r.pendT <= 0) {
        if (r.pendJump > 0) {
          r.coins += r.pendJump
          r.events.push({ type: 'jump', coins: r.pendJump, dist: r.pendDist })
        }
        if (r.pendFlips > 0) {
          const c2 = Math.round(40 * r.pendFlips * st.coinMult)
          r.coins += c2
          r.events.push({ type: 'flip', coins: c2, count: r.pendFlips })
        }
        r.pendJump = 0
        r.pendFlips = 0
      }
    }
    // the end of a round
    const flipped = Math.cos(r.a) < -0.55
    if (touchLoad || touchHead || flipped) r.crashAcc += r.deep ? 1 : dt
    else r.crashAcc = Math.max(0, r.crashAcc - dt)
    if (r.crashAcc > 0.1 || (flipped && r.crashAcc > 0.04)) {
      r.phase = 'crash'
      r.crashKind = touchHead && !touchLoad ? 'animal' : 'load'
      r.pendJump = 0
      r.pendFlips = 0
      r.pendT = 0
      r.events.push({ type: 'crash', kind: r.crashKind })
    } else if (r.x >= tr.finishX) {
      r.phase = 'won'
      r.events.push({ type: 'won' })
    } else if (r.stamina <= 0 && Math.abs(r.vx) < 0.35 && touching > 0) {
      r.idle += dt
      if (r.idle > 1.4) {
        r.phase = 'tired'
        r.events.push({ type: 'tired' })
      }
    } else {
      r.idle = 0
    }
  } else {
    r.endT += dt
    if (r.phase === 'won') {
      // the animal slows down after the gate
      r.vx *= 1 - 1.6 * dt
    }
  }
}

/** Runs the physics for `dt` seconds of play (in steps of `DT`); the events collect in `run.events` (the caller empties them). */
export function stepRun(r: Run, dt: number, input: Input): void {
  r.acc += Math.min(dt, 0.1)
  let n = 0
  while (r.acc >= DT && n < 14) {
    physics(r, DT, input)
    r.acc -= DT
    n++
  }
  if (n === 14) r.acc = 0
}

/** A hop: a short push up from the ground (only with the part "Federkraft", then every so many seconds). True when it jumped. */
export function hop(r: Run): boolean {
  if (r.phase !== 'play' || r.stats.hopV <= 0 || r.hopCd > 0) return false
  // from the ground, or a moment after leaving it
  if (r.touching === 0 && r.airT > 0.18) return false
  const c = Math.cos(r.a)
  const s = Math.sin(r.a)
  r.vx += -s * r.stats.hopV * 0.5
  r.vy = Math.max(r.vy, 0) + c * r.stats.hopV
  r.hopCd = r.stats.hopCool
  r.events.push({ type: 'hop' })
  return true
}

/** The speed along the ground (m/s), for the counters and the dust. */
export function speedOf(r: Run): number {
  return r.vx
}

// ── the bot (a simple driver for the tests, and to try a way) ──────────────────────────────────────────────────────────────
const botMemory = new WeakMap<Run, { slow: number; back: number }>()

export function botInput(r: Run): Input {
  const tr = r.track
  const mem = botMemory.get(r) ?? { slow: 0, back: 0 }
  botMemory.set(r, mem)
  const grounded = r.rear.contact || r.front.contact
  const slopeHere = Math.atan(slopeAt(tr, r.x))
  const ahead = Math.atan(slopeAt(tr, r.x + Math.max(3, r.vx * 0.5)))
  if (!grounded) {
    // in the air: aim at the slope of the landing
    const landing = Math.atan(slopeAt(tr, r.x + Math.max(2, r.vx * 0.45)))
    const err = r.a - landing
    if (err > 0.06 || r.w > 1.6) return { gas: false, brake: true }
    if (err < -0.06 || r.w < -1.6) return { gas: true, brake: false }
    return { gas: false, brake: false }
  }
  // stuck on a climb: back off and take a run-up
  if (mem.back > 0) {
    mem.back -= DT * 2
    return { gas: false, brake: true }
  }
  if (r.vx < 1.2) mem.slow += DT * 2
  else mem.slow = 0
  if (mem.slow > 1.2) {
    mem.slow = 0
    mem.back = 3.2
  }
  const pitch = r.a - slopeHere
  // nose too high on the ground: let go of the gas
  if (pitch > 0.42) return { gas: false, brake: false }
  // steep way down and fast: brake a little
  if (r.vx > r.stats.vmax * 0.95 && ahead < -0.25) return { gas: false, brake: true }
  if (r.vx > r.stats.vmax * 1.1) return { gas: false, brake: false }
  return { gas: true, brake: false }
}
