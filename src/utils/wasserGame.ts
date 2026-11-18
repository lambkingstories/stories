/**
 * "Wasser für das Volk": the rules and the physics of the big game (no Vue in here, so it can be tested: the same start gives the same game).
 *
 * The field is a grid of cells (96 wide, 144 high). A level is an ASCII map of 24 x 36 signs; each sign stands for 4 x 4 cells and the corners are rounded when the
 * map is built, so that the earth does not look like blocks.
 *
 * Water is a mass in every cell (a cellular automaton with pressure balance): it falls, spreads sideways, is pressed up in U-tubes and fills basins evenly.
 * Earth and sand can be dug with the finger, rock cannot. Sand slides after, mud sucks the water up, salt swallows it. A float or a water wheel
 * opens a wooden gate when water reaches it. Plants that get water bloom. The jar is full when its mark is reached.
 */

// ── the field ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const COLS = 24
export const ROWS = 36
/** The cells of one sign of the map (in each direction). */
export const K = 4
export const W = COLS * K
export const H = ROWS * K
/** Simulation steps per second. */
export const SIM_HZ = 120
/** The radius of the finger (in cells). */
export const DIG_R = 2.8

export const AIR = 0
export const DIRT = 1
export const ROCK = 2
export const SAND = 3
export const MUD = 4
export const SALT = 5
/** A wooden gate (opens when its float or wheel gets water). */
export const WOOD = 6
/** The wall of the vessel (jar, trough, well): cannot be dug. */
export const WALL = 7

export type VesselKind = 'krug' | 'trog' | 'brunnen' | 'becken' | 'teich'
export type SensorKind = 'float' | 'wheel'
export type Mechanic = 'dig' | 'rock' | 'plants' | 'sand' | 'salt' | 'mud' | 'sources' | 'gate' | 'wheel' | 'cloud' | 'pressure' | 'thorn' | 'mix'
export type Pt = [number, number]

/** A line the finger digs (points in signs of the map: x 0..24, y 0..36). `t` is the second at which it is dug (a test plays it back), `r` the radius in cells. */
export interface Stroke {
  pts: Pt[]
  t?: number
  r?: number
}

export interface Solution {
  name: string
  strokes: Stroke[]
  /** The stars this way must win (the first solution of a level wins three). */
  stars: 1 | 2 | 3
}

export interface LevelDef {
  id: string
  world: 0 | 1 | 2
  /** The new thing this level shows for the first time. */
  intro?: Mechanic
  /** 36 lines of 24 signs (see `parseMap`). */
  map: string[]
  vessel: VesselKind
  /** The part of the vessel that must be filled (0.8 of its inside by default). */
  fill?: number
  /** All the water the sources give together, as a multiple of the water the vessel needs (for example 2.2). */
  supply: number
  /** How much each source sign gives per step (0.2 by default). */
  rate?: number
  /** Third star: this share of the water that came out lies in the vessel in the end. */
  eff: number
  /** The kind of the sensors `1` `2` `3` `4` (a float by default). */
  sensors?: SensorKind[]
  /** The short line the tip button shows. */
  tip: Stroke
  solutions: Solution[]
  seed?: number
}

export interface Plant {
  /** Cell of the foot (centre of the sign). */
  x: number
  y: number
  thorn: boolean
  /** The rectangle of cells that counts as "water at the plant". */
  x0: number
  y0: number
  x1: number
  y1: number
  wet: number
  drown: number
  bloomed: boolean
  drowned: boolean
  /** Seconds since it bloomed (the picture grows). */
  age: number
}

export interface Sensor {
  id: number
  kind: SensorKind
  x0: number
  y0: number
  x1: number
  y1: number
  progress: number
  on: boolean
  /** The turn of the wheel in radians. */
  angle: number
  speed: number
}

export interface Gate {
  id: number
  /** The cells of the gate, the lowest first. */
  cells: number[]
  open: boolean
  /** How many cells have been taken out already. */
  gone: number
}

export interface Source {
  x0: number
  y0: number
  cloud: boolean
  /** The cells the water comes out of. */
  cells: number[]
}

export type Ev =
  | { type: 'dug'; x: number; y: number; mat: number; n: number }
  | { type: 'splash'; x: number; y: number; s: number }
  | { type: 'bloom'; i: number }
  | { type: 'drown'; i: number }
  | { type: 'gate'; id: number }
  | { type: 'sensor'; id: number }
  | { type: 'goal' }
  | { type: 'first' }
  | { type: 'salt' }
  | { type: 'end'; phase: 'won' | 'lost' }

export type Phase = 'ready' | 'play' | 'won' | 'lost'

export interface World {
  def: LevelDef
  mat: Uint8Array
  /** The water mass of every cell. */
  m: Float32Array
  n: Float32Array
  /** The sideways flow over the right edge of every cell. */
  fx: Float32Array
  /** How wet a mud cell is. */
  wet: Float32Array
  /** 1 where a neighbour sucks up water (mud or salt). */
  adj: Uint8Array
  /** 1 inside the vessel. */
  vmask: Uint8Array
  vcells: Int32Array
  /** The cell row of the mark of the vessel and the mass that has to be in it. */
  markY: number
  goal: number
  sources: Source[]
  plants: Plant[]
  sensors: Sensor[]
  gates: Gate[]
  tick: number
  phase: Phase
  started: boolean
  /** The mass that came out of the sources, and the mass left to come. */
  emitted: number
  supplyLeft: number
  /** All the water in the world. */
  total: number
  vesselMass: number
  /** The most water the vessel ever held in this round. */
  settle: number
  /** What had come out of the sources when the jar was full (the third star counts against it). */
  emittedAtGoal: number
  /** The movement of water in the last steps (low: the water rests). */
  motion: number
  calm: number
  /** The cells changed since the picture was drawn (a rectangle) and the water rows. */
  dirty: { x0: number; y0: number; x1: number; y1: number; on: boolean }
  /** A growing number: the picture of the earth must be drawn again when it changes. */
  terrain: number
  seed: number
  events: Ev[]
  digged: number
  /** The round is over and the result is known (the water has settled after the win). */
  done: boolean
  /** The final result (after the water settled). */
  stars: number
  eff: number
  /** The seconds since the start (steps / SIM_HZ). */
  clock: number
  /** The sign of the sand: the number of sand cells (when none are left nothing has to slide). */
  sand: number
  /** The sky: where clouds are (the growing of the cloud). */
  cloudK: number
}

const SOLID_OF: Record<string, number> = { '#': ROCK, d: DIRT, s: SAND, m: MUD, z: SALT, c: WALL, A: WOOD, B: WOOD, C: WOOD, D: WOOD }

// ── building the world from the map ─────────────────────────────────────────────────────────────────────────────────────────
function ch(map: string[], cx: number, cy: number): string {
  if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return '#'
  return map[cy]?.[cx] ?? '#'
}

/** Checks the shape of a map (36 lines of 24 signs, only known signs); returns the problems. */
export function checkMap(map: string[]): string[] {
  const bad: string[] = []
  if (map.length !== ROWS) bad.push(`${map.length} lines instead of ${ROWS}`)
  map.forEach((line, y) => {
    if (line.length !== COLS) bad.push(`line ${y + 1} has ${line.length} signs`)
    for (const c of line) if (!'.#dsmzcVQC*^~ABCD1234'.includes(c)) bad.push(`line ${y + 1}: unknown sign ${c}`)
  })
  return bad
}

export function newWorld(def: LevelDef): World {
  const map = def.map
  const mat = new Uint8Array(W * H)
  const m = new Float32Array(W * H)
  const vmask = new Uint8Array(W * H)
  const vlist: number[] = []
  /** The gate sign of every wooden cell (the sign that gave it its material). */
  const gateOf = new Map<number, string>()
  // the earth: the solid signs are smoothed (a bilinear field, cut at one half), the material is that of the strongest neighbour
  const solidAt = (cx: number, cy: number) => (SOLID_OF[ch(map, cx, cy)] !== undefined ? 1 : 0)
  for (let y = 0; y < H; y++) {
    const v = (y + 0.5) / K - 0.5
    const j0 = Math.floor(v)
    const fy = v - j0
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / K - 0.5
      const i0 = Math.floor(u)
      const fx = u - i0
      const w00 = (1 - fx) * (1 - fy)
      const w10 = fx * (1 - fy)
      const w01 = (1 - fx) * fy
      const w11 = fx * fy
      const d = w00 * solidAt(i0, j0) + w10 * solidAt(i0 + 1, j0) + w01 * solidAt(i0, j0 + 1) + w11 * solidAt(i0 + 1, j0 + 1)
      const idx = y * W + x
      // the nearest sign decides what a cell is when it is a vessel (inside) or a gate
      const nc = ch(map, Math.floor(x / K), Math.floor(y / K))
      if (d >= 0.5) {
        let best = 0
        let bestMat = ROCK
        let bestCh = '#'
        const cands: [number, string][] = [
          [w00, ch(map, i0, j0)],
          [w10, ch(map, i0 + 1, j0)],
          [w01, ch(map, i0, j0 + 1)],
          [w11, ch(map, i0 + 1, j0 + 1)]
        ]
        for (const [wt, c] of cands) {
          const mt = SOLID_OF[c]
          if (mt !== undefined && wt > best) {
            best = wt
            bestMat = mt
            bestCh = c
          }
        }
        mat[idx] = bestMat
        if (bestMat === WOOD) gateOf.set(idx, bestCh)
      } else if (nc === '~') {
        m[idx] = 1
      }
      if (nc === 'V' && mat[idx] === AIR) {
        vmask[idx] = 1
        vlist.push(idx)
      }
    }
  }
  const sources: Source[] = []
  const plants: Plant[] = []
  const gates: Gate[] = []
  const sensorBox = new Map<number, { x0: number; y0: number; x1: number; y1: number }>()
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      const c = ch(map, cx, cy)
      const x0 = cx * K
      const y0 = cy * K
      if (c === 'Q' || c === 'C') {
        const cells: number[] = []
        for (let dx = 1; dx < K - 1; dx++) cells.push((y0 + K - 1) * W + x0 + dx)
        sources.push({ x0, y0, cloud: c === 'C', cells })
      } else if (c === '*' || c === '^') {
        plants.push({ x: x0 + K / 2, y: y0 + K, thorn: c === '^', x0: x0 - K, y0: y0 - 3, x1: x0 + 2 * K - 1, y1: y0 + K, wet: 0, drown: 0, bloomed: false, drowned: false, age: 0 })
      } else if (c >= '1' && c <= '4') {
        const id = c.charCodeAt(0) - 49
        const b = sensorBox.get(id)
        if (!b) sensorBox.set(id, { x0, y0, x1: x0 + K - 1, y1: y0 + K - 1 })
        else {
          b.x0 = Math.min(b.x0, x0)
          b.y0 = Math.min(b.y0, y0)
          b.x1 = Math.max(b.x1, x0 + K - 1)
          b.y1 = Math.max(b.y1, y0 + K - 1)
        }
      }
    }
  }
  for (let id = 0; id < 4; id++) {
    const letter = 'ABCD'[id]!
    const cells: number[] = []
    for (let y = H - 1; y >= 0; y--) for (let x = 0; x < W; x++) if (mat[y * W + x] === WOOD && gateOf.get(y * W + x) === letter) cells.push(y * W + x)
    if (cells.length) gates.push({ id, cells, open: false, gone: 0 })
  }
  const sensors: Sensor[] = []
  for (const [id, b] of [...sensorBox.entries()].sort((a, b2) => a[0] - b2[0])) sensors.push({ id, kind: def.sensors?.[id] ?? 'float', ...b, progress: 0, on: false, angle: 0, speed: 0 })

  // the vessel: the mark lies where the cells below it (inside the vessel) are as many as the mass that must be reached
  const fillShare = def.fill ?? 0.8
  const goal = Math.round(vlist.length * fillShare)
  const rows = new Map<number, number>()
  for (const i of vlist) rows.set(Math.floor(i / W), (rows.get(Math.floor(i / W)) ?? 0) + 1)
  let acc = 0
  let markY = 0
  for (const y of [...rows.keys()].sort((a, b) => b - a)) {
    acc += rows.get(y)!
    markY = y
    if (acc >= goal) break
  }

  let sand = 0
  const adj = new Uint8Array(W * H)
  const w: World = {
    def,
    mat,
    m,
    n: new Float32Array(W * H),
    fx: new Float32Array(W * H),
    wet: new Float32Array(W * H),
    adj,
    vmask,
    vcells: Int32Array.from(vlist),
    markY,
    goal,
    sources,
    plants,
    sensors,
    gates,
    tick: 0,
    phase: 'ready',
    started: false,
    emitted: 0,
    supplyLeft: Math.max(goal, 40) * def.supply,
    total: 0,
    vesselMass: 0,
    settle: 0,
    emittedAtGoal: 0,
    motion: 0,
    calm: 0,
    dirty: { x0: 0, y0: 0, x1: W - 1, y1: H - 1, on: true },
    terrain: 1,
    seed: (def.seed ?? 1234567) >>> 0 || 1,
    events: [],
    digged: 0,
    done: false,
    stars: 0,
    eff: 0,
    clock: 0,
    sand: 0,
    cloudK: 0
  }
  for (let i = 0; i < W * H; i++) {
    if (mat[i] === SAND) sand++
    w.total += m[i]!
  }
  w.sand = sand
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) refreshAdj(w, x, y)
  return w
}

function refreshAdj(w: World, x: number, y: number) {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = y * W + x
  const a = (xx: number, yy: number) => {
    if (xx < 0 || yy < 0 || xx >= W || yy >= H) return false
    const t = w.mat[yy * W + xx]
    return t === MUD || t === SALT
  }
  w.adj[i] = a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1) ? 1 : 0
}

// ── small helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────
function rnd(w: World): number {
  let s = w.seed
  s ^= s << 13
  s >>>= 0
  s ^= s >>> 17
  s ^= s << 5
  s >>>= 0
  w.seed = s || 1
  return (w.seed & 0xffff) / 0x10000
}

function emit(w: World, e: Ev) {
  if (w.events.length < 300) w.events.push(e)
}

function touch(w: World, x: number, y: number) {
  const d = w.dirty
  if (!d.on) {
    d.x0 = x
    d.x1 = x
    d.y0 = y
    d.y1 = y
    d.on = true
  } else {
    if (x < d.x0) d.x0 = x
    if (x > d.x1) d.x1 = x
    if (y < d.y0) d.y0 = y
    if (y > d.y1) d.y1 = y
  }
  w.terrain++
}

// ── the finger ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** Digs a round hole (cell coordinates). Returns the cells dug. The first dig of a round lets the water come. */
export function dig(w: World, cx: number, cy: number, r = DIG_R): number {
  // after the win the finger may still dig for a while (the water goes on while a plant waits)
  if (w.phase === 'lost' || w.done) return 0
  const x0 = Math.max(0, Math.floor(cx - r))
  const x1 = Math.min(W - 1, Math.ceil(cx + r))
  const y0 = Math.max(0, Math.floor(cy - r))
  const y1 = Math.min(H - 1, Math.ceil(cy + r))
  let n = 0
  let kind = 0
  const r2 = r * r
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy > r2) continue
      const i = y * W + x
      const t = w.mat[i]!
      if (t === DIRT || t === SAND || t === MUD) {
        if (t === SAND) w.sand--
        kind = t
        w.mat[i] = AIR
        w.wet[i] = 0
        n++
      }
    }
  }
  if (n > 0) {
    touch(w, x0 - 1, y0 - 1)
    touch(w, x1 + 1, y1 + 1)
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) refreshAdj(w, x, y)
    w.digged += n
    emit(w, { type: 'dug', x: cx, y: cy, mat: kind, n })
    if (!w.started) start(w)
  }
  return n
}

/** Digs along a line (a hole every half radius). */
export function digLine(w: World, x0: number, y0: number, x1: number, y1: number, r = DIG_R): number {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const steps = Math.max(1, Math.ceil(len / (r * 0.5)))
  let n = 0
  for (let s = 0; s <= steps; s++) n += dig(w, x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, r)
  return n
}

/** A stroke of a solution or a tip (the points are in signs of the map). */
export function digStroke(w: World, s: Stroke) {
  const r = s.r ?? DIG_R
  const p = s.pts
  if (p.length === 1) dig(w, p[0]![0] * K, p[0]![1] * K, r)
  for (let i = 1; i < p.length; i++) digLine(w, p[i - 1]![0] * K, p[i - 1]![1] * K, p[i]![0] * K, p[i]![1] * K, r)
}

/** Lets the water come (the first dig does it, a test may call it). */
export function start(w: World) {
  if (w.started) return
  w.started = true
  if (w.phase === 'ready') w.phase = 'play'
  emit(w, { type: 'first' })
}

// ── the water ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const MAX_MASS = 1
const MAX_COMPRESS = 0.04
const MIN_MASS = 0.004
const MIN_FLOW = 0.01
const MAX_SPEED = 1
/** The sideways flow: how much of the speed stays, and how hard a step of height pushes. */
const DAMP = 0.92
const PUSH = 0.3
/** What the sources give per step and sign (the level may say another number). */
export const RATE = 0.2
const MUD_CAP = 2.2

function stable(total: number): number {
  if (total <= MAX_MASS) return MAX_MASS
  if (total < 2 * MAX_MASS + MAX_COMPRESS) return (MAX_MASS * MAX_MASS + total * MAX_COMPRESS) / (MAX_MASS + MAX_COMPRESS)
  return (total + MAX_COMPRESS) / 2
}

function flowWater(w: World) {
  const { mat, adj } = w
  let m = w.m
  const n = w.n
  n.set(m)
  let moved = 0
  const last = W * H
  const fx = w.fx
  for (let i = 0; i < last; i++) fx[i] = fx[i]! * DAMP
  const edge = (e: number): number => {
    let f = fx[e]! + PUSH * (m[e]! - m[e + 1]!)
    if (f > 0) {
      if (f > n[e]!) f = n[e]!
    } else if (-f > n[e + 1]!) f = -n[e + 1]!
    fx[e] = f
    n[e] = n[e]! - f
    n[e + 1] = n[e + 1]! + f
    return f > 0 ? f : -f
  }
  for (let i = 0; i < last; i++) {
    const rem0 = m[i]!
    if (rem0 <= 0) continue
    if (rem0 < MIN_MASS) {
      n[i] = n[i]! - rem0
      w.total -= rem0
      continue
    }
    const x = i % W
    const y = (i - x) / W
    // what can still leave this cell (an edge that was handled from the neighbour may have taken some already)
    let rem = rem0 < n[i]! ? rem0 : n[i]!
    if (rem <= 0) continue
    // down
    if (y + 1 < H && mat[i + W] === AIR) {
      const below = m[i + W]!
      let flow = stable(rem + below) - below
      if (flow > MIN_FLOW) flow *= 0.5
      if (flow > rem) flow = rem
      if (flow > MAX_SPEED) flow = MAX_SPEED
      if (flow > 0) {
        n[i] = n[i]! - flow
        n[i + W] = n[i + W]! + flow
        rem -= flow
        moved += flow
        if (flow > 0.35 && (below > 0.7 || (y + 2 < H && mat[i + 2 * W] !== AIR)) && (rnd(w) < 0.06)) emit(w, { type: 'splash', x, y, s: flow })
      }
    }
    if (rem <= 0) continue
    // sideways: the flow of an edge keeps its speed (a little), so the water rushes along a channel instead of creeping
    if (x < W - 1 && mat[i + 1] === AIR) moved += edge(i)
    if (x > 0 && mat[i - 1] === AIR && m[i - 1]! <= 0) moved += edge(i - 1)
    rem = n[i]!
    if (rem <= 0) continue
    // up (only what is pressed)
    if (y > 0 && mat[i - W] === AIR) {
      let flow = rem - stable(rem + m[i - W]!)
      if (flow > MIN_FLOW) flow *= 0.5
      if (flow > rem) flow = rem
      if (flow > MAX_SPEED) flow = MAX_SPEED
      if (flow > 0) {
        n[i] = n[i]! - flow
        n[i - W] = n[i - W]! + flow
        moved += flow
      }
    }
  }
  // what mud and salt next to water take (from the new masses)
  for (let i = 0; i < last; i++) {
    if (!adj[i]) continue
    const have = n[i]!
    if (have <= 0 || mat[i] !== AIR) continue
    const x = i % W
    const y = (i - x) / W
    for (let k = 0; k < 4; k++) {
      const j = k === 0 ? i - 1 : k === 1 ? i + 1 : k === 2 ? i - W : i + W
      if ((k === 0 && x === 0) || (k === 1 && x === W - 1) || (k === 2 && y === 0) || (k === 3 && y === H - 1)) continue
      const t = mat[j]
      if (t === MUD) {
        const a = Math.min(n[i]!, 0.012)
        if (a > 0) {
          n[i] = n[i]! - a
          w.total -= a
          w.wet[j] = w.wet[j]! + a
          if (w.wet[j]! >= MUD_CAP) {
            mat[j] = DIRT
            const jx = j % W
            const jy = (j - jx) / W
            for (let yy = jy - 1; yy <= jy + 1; yy++) for (let xx = jx - 1; xx <= jx + 1; xx++) refreshAdj(w, xx, yy)
            touch(w, jx, jy)
          }
        }
      } else if (t === SALT) {
        const a = Math.min(n[i]!, 0.3)
        if (a > 0) {
          n[i] = n[i]! - a
          w.total -= a
          if ((w.tick & 15) === 0) emit(w, { type: 'salt' })
        }
      }
    }
  }
  w.m = n
  w.n = m
  m = w.m
  w.motion = w.motion * 0.98 + moved * 0.02
}

function slideSand(w: World) {
  const { mat } = w
  const left = (w.tick & 4) === 0
  for (let y = H - 2; y >= 0; y--) {
    for (let k = 0; k < W; k++) {
      const x = left ? k : W - 1 - k
      const i = y * W + x
      if (mat[i] !== SAND) continue
      let to = -1
      if (mat[i + W] === AIR) to = i + W
      else {
        const first = rnd(w) < 0.5 ? -1 : 1
        for (const s of [first, -first]) {
          const nx = x + s
          if (nx < 0 || nx >= W) continue
          if (mat[i + s] === AIR && mat[i + W + s] === AIR) {
            to = i + W + s
            break
          }
        }
      }
      if (to < 0) continue
      mat[to] = SAND
      mat[i] = AIR
      // the water that was there goes up into the place the sand left
      const q = w.m[to]!
      if (q > 0) {
        w.m[i] = w.m[i]! + q
        w.m[to] = 0
      }
      const nx2 = to % W
      touch(w, x, y)
      touch(w, nx2, (to - nx2) / W)
      refreshAdj(w, x, y)
    }
  }
}

function sources(w: World) {
  if (!w.started) return
  if (w.phase === 'lost' || (w.phase === 'won' && (w.done || !plantsPending(w) || w.settle >= GRACE))) return
  const rate = w.def.rate ?? RATE
  for (const s of w.sources) {
    let k = 1
    if (s.cloud) k = 0.35 + 0.65 * Math.min(1, w.clock / 6)
    for (const c of s.cells) {
      if (w.supplyLeft <= 0) return
      const room = 2.5 - w.m[c]!
      if (room <= 0) continue
      const add = Math.min(rate * k, room, w.supplyLeft)
      if (add <= 0) continue
      w.m[c] = w.m[c]! + add
      w.supplyLeft -= add
      w.emitted += add
      w.total += add
    }
  }
}

function gates(w: World) {
  for (const g of w.gates) {
    if (!g.open || g.gone >= g.cells.length) continue
    // one row of cells goes in every two steps (the gate is lifted)
    if ((w.tick & 1) !== 0) continue
    let rowY = -1
    while (g.gone < g.cells.length) {
      const c = g.cells[g.gone]!
      const y = Math.floor(c / W)
      if (rowY < 0) rowY = y
      if (y !== rowY) break
      w.mat[c] = AIR
      g.gone++
      touch(w, c % W, y)
    }
    if (g.gone >= g.cells.length) emit(w, { type: 'gate', id: g.id })
  }
}

function sum(w: World, x0: number, y0: number, x1: number, y1: number): number {
  let s = 0
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) s += w.m[y * W + x]!
  return s
}

function devices(w: World) {
  for (const s of w.sensors) {
    if (s.on) {
      if (s.kind === 'wheel') s.speed = Math.min(1, s.speed + 0.02)
    } else {
      const wetness = sum(w, s.x0, s.y0, s.x1, s.y1)
      if (s.kind === 'float') {
        if (wetness >= 3) {
          s.progress++
          if (s.progress >= 10) trigger(w, s)
        }
      } else {
        const turning = wetness >= 1.2
        s.speed += ((turning ? Math.min(1, wetness / 5) : 0) - s.speed) * 0.05
        if (turning) {
          s.progress++
          if (s.progress >= 150) trigger(w, s)
        }
      }
    }
    s.angle += s.speed * 0.09
  }
  for (let i = 0; i < w.plants.length; i++) {
    const p = w.plants[i]!
    if (p.bloomed) p.age += 1 / SIM_HZ
    if (!p.bloomed && !p.drowned) {
      // the water that passes counts up (a thin stream for a long time is as good as a deep one for a short time)
      const wetness = sum(w, p.x0, p.y0, p.x1, p.y1)
      if (wetness > 0.05) {
        p.wet += wetness > 3 ? 3 : wetness
        if (p.wet >= 20) {
          p.bloomed = true
          emit(w, { type: 'bloom', i })
        }
      }
    }
    if (p.thorn && !p.drowned) {
      // a thorn bush is only to be watered, not flooded
      const wetness = sum(w, p.x0, p.y0, p.x1, p.y1)
      if (wetness >= 40) {
        p.drown++
        if (p.drown >= 40) {
          p.drowned = true
          p.bloomed = false
          emit(w, { type: 'drown', i })
        }
      }
    }
  }
}

function trigger(w: World, s: Sensor) {
  s.on = true
  emit(w, { type: 'sensor', id: s.id })
  const g = w.gates.find((x) => x.id === s.id)
  if (g) g.open = true
}

// ── one step ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The time the water goes on after the jar is full (the water that is on its way arrives): at least this long, and until it rests, at most so long. */
const SETTLE_MIN = SIM_HZ * 1.5
const SETTLE_MAX = SIM_HZ * 6
/** How long the water goes on after the win when a plant still waits for it (the finger may dig on: a second branch to the last flower). */
const GRACE = SIM_HZ * 10
/** How long (steps) the water may rest before a round without enough water is given up. */
const REST = SIM_HZ * 2.5

export function allPlantsWatered(w: World): boolean {
  return w.plants.length > 0 && w.plants.every((p) => p.bloomed)
}

export function efficiency(w: World): number {
  const e = w.emittedAtGoal > 0 ? w.emittedAtGoal : w.emitted
  return e > 0 ? Math.min(1, w.vesselMass / e) : 0
}

/** Plants that are still waiting for water (not watered, not drowned). */
export function plantsPending(w: World): boolean {
  return w.plants.some((p) => !p.bloomed && !p.drowned)
}

export function starsOf(w: World): number {
  if (w.vesselMass < w.goal) return 0
  const plants = allPlantsWatered(w)
  const eff = efficiency(w) >= w.def.eff
  return 1 + (plants ? 1 : 0) + (plants && eff ? 1 : 0)
}

export function step(w: World) {
  if (w.phase === 'lost') return
  w.tick++
  if (w.started) w.clock += 1 / SIM_HZ
  sources(w)
  flowWater(w)
  if (w.sand > 0 && (w.tick & 1) === 0) slideSand(w)
  gates(w)
  devices(w)
  // the vessel
  // (water that is pressed together counts as one cell full at most, so that the level of the water is what the mark shows)
  let v = 0
  for (let k = 0; k < w.vcells.length; k++) {
    const q = w.m[w.vcells[k]!]!
    v += q > 1 ? 1 : q
  }
  w.vesselMass = v
  if (w.phase === 'play') {
    if (w.goal > 0 && v >= w.goal) {
      w.phase = 'won'
      w.settle = 0
      w.emittedAtGoal = w.emitted
      emit(w, { type: 'goal' })
    } else {
      // no water left that could still fill the jar, or the water rests and nothing comes any more
      const reachable = v + (w.total - v) + w.supplyLeft
      if (reachable < w.goal) {
        w.phase = 'lost'
        emit(w, { type: 'end', phase: 'lost' })
      } else if (w.supplyLeft <= 0 && w.motion < 0.01) {
        w.calm++
        if (w.calm > REST) {
          w.phase = 'lost'
          emit(w, { type: 'end', phase: 'lost' })
        }
      } else w.calm = 0
    }
  } else if (w.phase === 'won') {
    w.settle++
    const waiting = plantsPending(w)
    if (!w.done && ((w.settle >= SETTLE_MIN && w.motion < 0.012 && !waiting) || w.settle >= (waiting ? GRACE : SETTLE_MAX))) {
      w.done = true
      w.eff = efficiency(w)
      w.stars = starsOf(w)
      emit(w, { type: 'end', phase: 'won' })
    }
  }
}

/** The result is known (the water settled after the win). */
export function finished(w: World): boolean {
  return w.phase === 'lost' || (w.phase === 'won' && w.done)
}

/** The water per row of the picture: the smallest and the largest row with water (for drawing only that part). */
export function waterRows(w: World): [number, number] {
  let a = H
  let b = -1
  for (let y = 0; y < H; y++) {
    const o = y * W
    for (let x = 0; x < W; x++) {
      if (w.m[o + x]! > 0.01) {
        if (y < a) a = y
        if (y > b) b = y
        break
      }
    }
  }
  return [a, b]
}

// ── playing a solution (tests and the tip) ──────────────────────────────────────────────────────────────────────────────────
export interface Outcome {
  phase: Phase
  stars: number
  eff: number
  seconds: number
  vessel: number
  goal: number
  bloomed: number
}

/** Plays a solution to the end (at most `limit` seconds) and tells what came out. */
export function playSolution(def: LevelDef, strokes: Stroke[], limit = 60): { w: World; out: Outcome } {
  const w = newWorld(def)
  const todo = strokes.map((s) => ({ s, at: Math.round((s.t ?? 0) * SIM_HZ), done: false }))
  const max = Math.round(limit * SIM_HZ)
  for (let t = 0; t <= max; t++) {
    for (const j of todo) {
      if (!j.done && j.at <= t) {
        j.done = true
        digStroke(w, j.s)
      }
    }
    step(w)
    w.events.length = 0
    if (finished(w)) break
  }
  return {
    w,
    out: {
      phase: w.phase,
      stars: w.phase === 'won' && w.done ? w.stars : 0,
      eff: efficiency(w),
      seconds: w.tick / SIM_HZ,
      vessel: w.vesselMass,
      goal: w.goal,
      bloomed: w.plants.filter((p) => p.bloomed).length
    }
  }
}

/** A text picture of the field for the tests (one sign per sign of the map). */
export function dump(w: World): string {
  const rows: string[] = []
  for (let cy = 0; cy < ROWS; cy++) {
    let line = ''
    for (let cx = 0; cx < COLS; cx++) {
      let water = 0
      const counts = new Array<number>(8).fill(0)
      for (let y = cy * K; y < cy * K + K; y++)
        for (let x = cx * K; x < cx * K + K; x++) {
          water += w.m[y * W + x]!
          counts[w.mat[y * W + x]!]!++
        }
      let best = 0
      for (let t = 1; t < 8; t++) if (counts[t]! > counts[best]!) best = t
      if (best !== AIR && counts[best]! >= 6) line += '?d#smzGc'[best]
      else if (w.plants.some((p) => Math.floor(p.x / K) === cx && Math.floor((p.y - 1) / K) === cy)) line += w.plants.find((p) => Math.floor(p.x / K) === cx && Math.floor((p.y - 1) / K) === cy)!.bloomed ? '*' : '^'
      else line += water > 10 ? 'O' : water > 4 ? 'o' : water > 0.6 ? '~' : water > 0.05 ? ',' : w.vmask[(cy * K + 2) * W + cx * K + 2] ? ':' : ' '
    }
    rows.push(line)
  }
  return rows.join('\n')
}

// ── the tip ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** The length of one tip step (in signs of the map). */
const TIP_LEN = 8

/**
 * The first kept solution of a level cut into short steps (every stroke of it, in pieces of about eight signs, the pieces meet in one point).
 * The tip button shows them one after the other. Digging the steps in this order is the solution itself.
 */
export function tipSteps(def: LevelDef): Pt[][] {
  const out: Pt[][] = []
  for (const s of def.solutions[0]?.strokes ?? []) {
    // the stroke in points one sign apart
    const pts: Pt[] = []
    for (let i = 0; i < s.pts.length; i++) {
      const b = s.pts[i]!
      if (i === 0) {
        pts.push(b)
        continue
      }
      const a = s.pts[i - 1]!
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])))
      for (let k = 1; k <= n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n])
    }
    if (pts.length < 2) {
      out.push([pts[0]!, pts[0]!])
      continue
    }
    for (let i = 0; i < pts.length - 1; i += TIP_LEN) out.push(pts.slice(i, Math.min(pts.length, i + TIP_LEN + 1)))
  }
  return out
}

/** How much of a tip step is dug already (0..1): the share of its points that lie in open cells. */
export function stepDug(w: World, pts: Pt[]): number {
  let n = 0
  for (const [x, y] of pts) {
    const cx = Math.min(W - 1, Math.max(0, Math.floor(x * K)))
    const cy = Math.min(H - 1, Math.max(0, Math.floor(y * K)))
    if (w.mat[cy * W + cx] === AIR) n++
  }
  return pts.length ? n / pts.length : 1
}

/** The next step that is not dug yet (-1: the whole way is dug). */
export function nextTipStep(w: World, steps: Pt[][]): number {
  for (let i = 0; i < steps.length; i++) if (stepDug(w, steps[i]!) < 0.8) return i
  return -1
}
