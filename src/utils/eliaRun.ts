/**
 * "Elia läuft": the rules of the second big game, a three-lane runner (drawn and touched in `BigGameElia.vue`). Elijah runs away from the
 * camera on a track of three lanes. A swipe left or right changes the lane, up jumps, down slides (in the air it drops at once). Low things
 * (stones, thorns) are jumped, high things (a beam) are slid under, a whole blocked lane needs a change of lane. The first stumble only slows
 * Elijah down; a second one within a few seconds, or running head-on into a blocked lane, makes him fall and the run is over. A raven feather
 * on the track calls a raven: it flies in from behind, overtakes him and drops bread into a lane, which he runs through to eat. Without
 * a feather there is no bread, only jugs, so that Elijah gets really hungry. Everything here is plain calculation (metres and seconds), so it can be tested.
 */

export const LANES = 3
/** The width of one lane in metres. */
export const LANE_W = 1.5
/** The distance between two rows of a pattern. */
export const ROW = 8
export const PLAYER_H = 1.8
export const SLIDE_H = 0.7
export const GRAVITY = 30
/** The jump: the top is at 1.73 m, in the air for about 0.68 s. */
export const JUMP_V = 10.2
/** The speed (m/s) of the drop after a swipe down in the air. */
export const FASTFALL = -22
export const LOW_H = 0.8
/** A beam hangs between this height and 2.2 m. */
export const HIGH_BOTTOM = 1.0
export const BLOCK_H = 2.4
export const SLIDE_TIME = 0.65
/** Lane change: metres per second sideways (one lane in 0.14 s). */
export const LANE_SPEED = 11
/** A second stumble within this many seconds is a fall. */
export const STUMBLE_WINDOW = 6
/** A swipe a little too early is kept for this long. */
export const BUFFER = 0.14
/** Elijah gets hungry: the bar of 1 runs empty in this many seconds; bread and jugs fill it again. */
export const HUNGER_SECONDS = 26
export const BREAD_FOOD = 0.06
export const KRUG_FOOD = 0.3
/** Below this the bar warns, and the second star is gone. */
export const HUNGRY = 0.25
/** A raven feather lies on the track every 150 to 200 metres (the first one at 50); the raven it calls drops five or six pieces of bread. */
export const FEATHER_FIRST = 50
export const FEATHER_MIN = 150
export const FEATHER_MAX = 200
/** How far in front of Elijah the raven flies while it drops (metres), how long it takes to fly in, the pause between two pieces, and the flight away. */
export const RAVEN_LEAD = 26
export const RAVEN_IN = 1.5
export const RAVEN_GAP = 0.26
export const RAVEN_OUT = 1.3
/** The height of the raven while it drops, and how fast a piece of bread falls. */
export const RAVEN_Y = 3.6
export const BREAD_FALL = 16
/** A piece of bread lies at this height when it has fallen. */
export const BREAD_REST = 0.6
/** The metres in front of the runner that are filled with things. */
export const AHEAD = 140
/** The free run in front of the first pattern. */
export const START_FREE = 24

/**
 * What a cell of a pattern holds (one character per lane):
 * `.` nothing, `k` jug, `f` raven feather (not used in the patterns), `L` low obstacle, `H` high beam, `B` a blocked lane (the patterns no longer put bread
 * on the ground, the ravens bring it; `o`, `a`, `l` and `h` are bread variants that still work).
 */
export type CellChar = '.' | 'o' | 'a' | 'k' | 'f' | 'L' | 'l' | 'H' | 'h' | 'B'

export type ObstacleKind = 'low' | 'high' | 'block'

export interface Obstacle {
  z: number
  lane: number
  kind: ObstacleKind
  /** Which picture: 0 to 2 low (stone, thorns, slabs), 3 the beam, 4 to 6 blocking (tall things). */
  sprite: number
  hit: boolean
}

export type PickupType = 'brot' | 'krug' | 'feder'

export interface Pickup {
  z: number
  lane: number
  /** The height above the ground. */
  y: number
  type: PickupType
  got: boolean
  /** Only while a piece of bread from a raven is falling: the speed downwards (negative). */
  vy?: number
}

/** A raven that flies in from behind and drops bread into one lane. */
export interface Raven {
  lane: number
  /** The pieces to drop, and how many have fallen. */
  n: number
  dropped: number
  age: number
  /** Where it is: sideways in metres, height, and the metres in front of Elijah. */
  x: number
  y: number
  lead: number
  /** The side it comes from (-1 left, 1 right). */
  side: number
  /** The seconds since it began to fly away (-1 while it still drops). */
  leaving: number
  gone: boolean
}


export interface Pattern {
  tier: number
  rows: string[]
}

/** The hand-made patterns. Every one can be passed (see `solvable`); harder ones come with the tier. */
export const PATTERNS: readonly Pattern[] = [
  // tier 1: stones to jump, space to look
  { tier: 1, rows: ['L..', '...', '..L', '...'] },
  { tier: 1, rows: ['.L.', '...', '...', '...'] },
  { tier: 1, rows: ['.L.', '...', '...', 'L..'] },
  { tier: 1, rows: ['..L', '...', '.L.', '...', 'L..'] },
  { tier: 1, rows: ['k..', '...', '..k'] },
  // tier 2: blocked lanes
  { tier: 2, rows: ['B..', '.B.', '..B', '...'] },
  { tier: 2, rows: ['.B.', '...', '.B.', '...'] },
  { tier: 2, rows: ['BL.', '...', '.LB'] },
  { tier: 2, rows: ['B.B', '...', '.L.', '...'] },
  { tier: 2, rows: ['.BB', '...', 'B.L', '...'] },
  // tier 3: beams to slide under
  { tier: 3, rows: ['HHH', '...', '...'] },
  { tier: 3, rows: ['H..', '.H.', '..H', '...'] },
  { tier: 3, rows: ['H.B', '...', 'B.H', '...'] },
  { tier: 3, rows: ['LBL', '...', 'HHH', '...'] },
  { tier: 3, rows: ['L.H', '...', '.L.', '...', 'H.L'] },
  // tier 4: closer together
  { tier: 4, rows: ['BLB', '.B.', 'LBL', '...'] },
  { tier: 4, rows: ['L.L', '.B.', 'H.H', '...'] },
  { tier: 4, rows: ['HBH', '...', 'LBL', '...', 'BHB'] },
  { tier: 4, rows: ['.L.', '.L.', '...'] },
  { tier: 4, rows: ['.B.', 'B.B', '.B.', '...'] }
]

const isHazard = (c: string) => c === 'L' || c === 'l' || c === 'H' || c === 'h'

/**
 * True when a runner can get through the rows: one lane change per row at most, nothing blocked, and never a jump or slide in two rows
 * one after the other (there is no time to land and start again).
 */
export function solvable(rows: readonly string[]): boolean {
  // state: lane and whether the row before had a hazard in the path
  let states = new Set<string>(['0,0', '1,0', '2,0'])
  for (const row of rows) {
    const next = new Set<string>()
    for (const s of states) {
      const [laneS, hazS] = s.split(',')
      const lane = Number(laneS)
      const wasHazard = hazS === '1'
      for (let to = Math.max(0, lane - 1); to <= Math.min(LANES - 1, lane + 1); to++) {
        const c = row[to] ?? '.'
        if (c === 'B') continue
        const hz = isHazard(c)
        if (hz && wasHazard) continue
        next.add(`${to},${hz ? 1 : 0}`)
      }
    }
    if (next.size === 0) return false
    states = next
  }
  return true
}

export type Phase = 'play' | 'won' | 'over'
export type FallCause = 'block' | 'second' | 'hunger'

/** A moment in the run that the picture and the sound care about; the list is emptied at the start of every step. */
export type RunEvent = 'jump' | 'slide' | 'land' | 'lane' | 'brot' | 'krug' | 'feder' | 'stumble' | 'fall' | 'tired' | 'win' | 'rabe' | 'abwurf'

export interface LevelDef {
  /** 0 to 4: Krit, the way to Zarpat, Zarpat, the Karmel, the run in the rain. */
  world: number
  goal: number
  /** The speed (m/s) at the start and at the end. */
  v0: number
  v1: number
  /** The hardest tier of patterns the level uses. */
  tier: number
  /** The world is built; the others show "soon". */
  ready: boolean
}

export const WORLDS = ['krit', 'weg', 'zarpat', 'karmel', 'regen'] as const

export const LEVELS: readonly LevelDef[] = [
  { world: 0, goal: 600, v0: 13, v1: 17, tier: 2, ready: true },
  { world: 0, goal: 700, v0: 14, v1: 19, tier: 3, ready: true },
  { world: 0, goal: 800, v0: 15, v1: 20, tier: 3, ready: true },
  { world: 1, goal: 800, v0: 15, v1: 20, tier: 3, ready: false },
  { world: 1, goal: 900, v0: 16, v1: 21, tier: 3, ready: false },
  { world: 1, goal: 1000, v0: 16, v1: 22, tier: 4, ready: false },
  { world: 2, goal: 900, v0: 16, v1: 22, tier: 3, ready: false },
  { world: 2, goal: 1000, v0: 17, v1: 22, tier: 4, ready: false },
  { world: 2, goal: 1100, v0: 17, v1: 23, tier: 4, ready: false },
  { world: 3, goal: 1000, v0: 17, v1: 23, tier: 4, ready: false },
  { world: 3, goal: 1100, v0: 18, v1: 24, tier: 4, ready: false },
  { world: 3, goal: 1200, v0: 18, v1: 24, tier: 4, ready: false },
  { world: 4, goal: 1100, v0: 18, v1: 24, tier: 4, ready: false },
  { world: 4, goal: 1300, v0: 19, v1: 25, tier: 4, ready: false },
  { world: 4, goal: 1500, v0: 19, v1: 26, tier: 4, ready: false }
]
/** The "level" number of the free run (after the last one). */
export const FREE_LEVEL = LEVELS.length
/** The free run opens after this many levels are won (the whole first world while only that exists). */
export const FREE_AFTER = 3
/** In the free run the speed grows up to this metre mark. */
const FREE_RAMP = 2400

export interface Run {
  level: number
  /** The metres of the level, 0 for the free run. */
  goal: number
  tier: number
  v0: number
  v1: number
  /** Metres run. */
  dist: number
  speed: number
  /** The lane aimed at (0, 1, 2) and the sideways place in metres from the middle of the track. */
  lane: number
  x: number
  /** The height of the feet and the climb speed. */
  y: number
  vy: number
  /** Seconds of the slide left. */
  slide: number
  /** The seconds since the last stumble (a big number if none). */
  sinceStumble: number
  /** Seconds in which nothing hurts. */
  invuln: number
  /** The slow-down after a stumble, 0.55 to 1. */
  slow: number
  bread: number
  /** How full Elijah is, 1 to 0. At 0 he slows down and stops. */
  hunger: number
  /** The lowest the bar has been. */
  minHunger: number
  /** The bread that the ravens bring on the whole track up to the goal. */
  breadTotal: number
  /** The ravens that are on their way, the ravens called by a feather that have not come yet, and where the next feather is laid. */
  ravens: Raven[]
  ravenCalls: number
  planTo: number
  stumbles: number
  phase: Phase
  cause: FallCause | null
  time: number
  obstacles: Obstacle[]
  pickups: Pickup[]
  /** Where things are made up to (metres). */
  genTo: number
  bufJump: number
  bufSlide: number
  events: RunEvent[]
  /** The last pattern used (so the same one does not come twice in a row). */
  lastPattern: number
}

export const laneX = (lane: number) => (lane - 1) * LANE_W

export function newRun(level: number, rand: () => number = Math.random): Run {
  const def = LEVELS[level]
  const g: Run = {
    level,
    goal: def?.goal ?? 0,
    tier: def?.tier ?? 4,
    v0: def?.v0 ?? 14,
    v1: def?.v1 ?? 26,
    dist: 0,
    speed: def?.v0 ?? 14,
    lane: 1,
    x: 0,
    y: 0,
    vy: 0,
    slide: 0,
    sinceStumble: 999,
    invuln: 0,
    slow: 1,
    bread: 0,
    hunger: 1,
    minHunger: 1,
    breadTotal: 0,
    ravens: [],
    ravenCalls: 0,
    planTo: FEATHER_FIRST,
    stumbles: 0,
    phase: 'play',
    cause: null,
    time: 0,
    obstacles: [],
    pickups: [],
    genTo: START_FREE,
    bufJump: 0,
    bufSlide: 0,
    events: [],
    lastPattern: -1
  }
  generate(g, g.goal > 0 ? g.goal + 40 : AHEAD, rand)
  if (g.goal > 0) {
    // behind the goal the way is free: Elijah runs out there, and the goal picture stands there
    g.obstacles = g.obstacles.filter((o) => o.z <= g.goal - GOAL_FREE)
    g.pickups = g.pickups.filter((p) => p.z <= g.goal - GOAL_FREE)
  }
  return g
}

/** The last metres before the goal and everything behind it have nothing on the way. */
export const GOAL_FREE = 6


/** The hardest tier that is used at this distance (it grows while running). */
function tierAt(g: Run, z: number): number {
  const span = g.goal > 0 ? g.goal : FREE_RAMP
  const t = 1 + Math.floor((z / span) * g.tier)
  return Math.max(1, Math.min(g.tier, t))
}

/** Fills the track with patterns up to the distance `upTo`. */
export function generate(g: Run, upTo: number, rand: () => number = Math.random): void {
  while (g.genTo < upTo) {
    const cap = tierAt(g, g.genTo)
    const pool = PATTERNS.map((p, i) => ({ p, i })).filter(({ p, i }) => p.tier <= cap && i !== g.lastPattern)
    // the hard ones come a bit more often than the easy ones
    let total = 0
    for (const { p } of pool) total += 1 + (p.tier === cap ? 1.5 : 0)
    let x = rand() * total
    let chosen = pool[0]!
    for (const e of pool) {
      x -= 1 + (e.p.tier === cap ? 1.5 : 0)
      if (x < 0) {
        chosen = e
        break
      }
    }
    g.lastPattern = chosen.i
    let z = g.genTo
    for (const row of chosen.p.rows) {
      for (let lane = 0; lane < LANES; lane++) put(g, row[lane] as CellChar, z, lane, rand)
      z += ROW
    }
    // a free row after every pattern
    g.genTo = z + ROW
  }
  layFeathers(g, rand)
}

/** Lays the raven feathers between the patterns, each in a lane that is free of things for a few metres around it. */
function layFeathers(g: Run, rand: () => number) {
  while (g.planTo < g.genTo - ROW) {
    const z = g.planTo
    const order = [0, 1, 2].sort(() => rand() - 0.5)
    const lane = order.find((l) => !g.obstacles.some((o) => o.lane === l && Math.abs(o.z - z) <= 4))
    if (lane === undefined) {
      // every lane has something there: a little further on
      g.planTo += ROW
      continue
    }
    g.pickups.push({ z, lane, y: 1.0, type: 'feder', got: false })
    if (g.goal === 0 || z + RAVEN_LEAD + 12 <= g.goal) g.breadTotal += 6
    g.planTo += FEATHER_MIN + rand() * (FEATHER_MAX - FEATHER_MIN)
  }
}

function put(g: Run, c: CellChar, z: number, lane: number, rand: () => number) {
  const breadAt = (y: number, type: PickupType = 'brot') => {
    g.pickups.push({ z, lane, y, type, got: false })
    if ((g.goal === 0 || z <= g.goal) && type === 'brot') g.breadTotal++
    if (type === 'krug' && (g.goal === 0 || z <= g.goal)) g.breadTotal += KRUG_VALUE
  }
  const stone = (kind: ObstacleKind, sprite: number) => g.obstacles.push({ z, lane, kind, sprite, hit: false })
  switch (c) {
    case 'o':
      breadAt(0.6)
      break
    case 'a':
      breadAt(2.6)
      break
    case 'k':
      breadAt(0.7, 'krug')
      break
    case 'f':
      g.pickups.push({ z, lane, y: 1.0, type: 'feder', got: false })
      break
    case 'L':
      stone('low', Math.floor(rand() * 3))
      break
    case 'l':
      stone('low', Math.floor(rand() * 3))
      breadAt(2.6)
      break
    case 'H':
      stone('high', 3)
      break
    case 'h':
      stone('high', 3)
      breadAt(0.6)
      break
    case 'B':
      stone('block', 4 + Math.floor(rand() * 3))
      break
    default:
      break
  }
}

/** A jug counts as this many pieces of bread. */
export const KRUG_VALUE = 5

/** What a swipe does. Left and right take effect at once; jump and slide are kept for a moment if the runner is not ready. */
export function input(g: Run, what: 'left' | 'right' | 'jump' | 'slide'): void {
  if (g.phase !== 'play') return
  if (what === 'left' || what === 'right') {
    const to = Math.max(0, Math.min(LANES - 1, g.lane + (what === 'left' ? -1 : 1)))
    if (to !== g.lane) {
      g.lane = to
      g.events.push('lane')
    }
    return
  }
  if (what === 'jump') {
    g.bufJump = BUFFER
    tryJump(g)
    return
  }
  g.bufSlide = BUFFER
  trySlide(g)
}

function tryJump(g: Run) {
  if (g.y > 0.02 || g.bufJump <= 0) return
  g.vy = JUMP_V
  g.y = 0.001
  g.slide = 0
  g.bufJump = 0
  g.events.push('jump')
}

function trySlide(g: Run) {
  if (g.bufSlide <= 0) return
  if (g.y > 0.02) {
    // in the air: drop at once, slide when landing
    g.vy = Math.min(g.vy, FASTFALL)
    return
  }
  g.slide = SLIDE_TIME
  g.bufSlide = 0
  g.events.push('slide')
}

export const bodyHeight = (g: Run) => (g.slide > 0 ? SLIDE_H : PLAYER_H)

/** The speed at a distance: grows from v0 to v1 over the level (or the free ramp), slowed after a stumble. */
export function speedAt(g: Run): number {
  const span = g.goal > 0 ? g.goal : FREE_RAMP
  const k = Math.min(1, g.dist / span)
  return (g.v0 + (g.v1 - g.v0) * k) * g.slow
}

/** Moves the run by `dt` seconds (at most about 0.05). */
export function step(g: Run, dt: number, rand: () => number = Math.random): void {
  g.events.length = 0
  if (g.phase !== 'play') {
    settle(g, dt)
    return
  }
  g.time += dt
  g.sinceStumble += dt
  g.invuln = Math.max(0, g.invuln - dt)
  g.bufJump = Math.max(0, g.bufJump - dt)
  g.bufSlide = Math.max(0, g.bufSlide - dt)
  // hunger: the bar runs down; when it is empty Elijah gets slower and slower and at last stops
  g.hunger = Math.max(0, g.hunger - dt / HUNGER_SECONDS)
  g.minHunger = Math.min(g.minHunger, g.hunger)
  if (g.hunger <= 0) {
    g.slow = Math.max(0, g.slow - dt * 0.5)
    if (g.slow <= 0.04) {
      g.phase = 'over'
      g.cause = 'hunger'
      g.events.push('tired')
      return
    }
  } else if (g.slow < 1) {
    // the slow-down after a stumble fades away in about two seconds
    g.slow = Math.min(1, g.slow + dt * 0.23)
  }

  // sideways
  const tx = laneX(g.lane)
  const dx = tx - g.x
  const move = LANE_SPEED * dt
  g.x = Math.abs(dx) <= move ? tx : g.x + Math.sign(dx) * move

  // up and down
  if (g.y > 0 || g.vy > 0) {
    g.vy -= GRAVITY * dt
    g.y += g.vy * dt
    if (g.y <= 0) {
      g.y = 0
      g.vy = 0
      g.events.push('land')
      if (g.bufJump > 0) tryJump(g)
      else if (g.bufSlide > 0) trySlide(g)
    }
  }
  if (g.slide > 0) g.slide = Math.max(0, g.slide - dt)
  else if (g.y <= 0 && g.bufJump > 0) tryJump(g)

  // forward
  const before = g.dist
  g.speed = speedAt(g)
  g.dist += g.speed * dt
  if (g.goal === 0) generate(g, g.dist + AHEAD, rand)

  collide(g, before, g.dist)
  if (g.phase !== 'play') return
  ravens(g, dt, rand)
  collect(g, before, g.dist)

  if (g.goal > 0 && g.dist >= g.goal) {
    g.dist = g.goal
    g.phase = 'won'
    g.events.push('win')
  }
}

/** After the end: Elijah comes to a stop (in a fall quickly), and a jump that was going on is finished, so he does not hang in the air. */
function settle(g: Run, dt: number) {
  if (g.y > 0 || g.vy > 0) {
    g.vy -= GRAVITY * dt
    g.y += g.vy * dt
    if (g.y <= 0) {
      g.y = 0
      g.vy = 0
    }
  }
  g.slide = Math.max(0, g.slide - dt)
  g.speed *= Math.exp(-(g.phase === 'over' ? 5 : 1.8) * dt)
  g.dist += g.speed * dt
}

/** True when something stands in the lane within `margin` metres of the place `z` (a piece of bread must not fall onto it). */
function blockedAt(g: Run, lane: number, z: number, margin: number): boolean {
  return g.obstacles.some((o) => o.lane === lane && Math.abs(o.z - z) <= margin)
}

/** The lane a raven brings its bread to: one that is free where the pieces will fall (about: the speed changes a little). */
function ravenLane(g: Run, n: number, rand: () => number): number {
  const from = g.dist + g.speed * RAVEN_IN + RAVEN_LEAD
  const to = from + n * RAVEN_GAP * g.speed
  const free: number[] = []
  for (let lane = 0; lane < LANES; lane++) {
    let ok = true
    for (const o of g.obstacles) {
      if (o.lane === lane && o.z >= from - 3 && o.z <= to + 3) {
        ok = false
        break
      }
    }
    if (ok) free.push(lane)
  }
  if (free.length === 0) return -1
  return free[Math.floor(rand() * free.length)]!
}

/** The ravens: they come in from behind, fly over Elijah, drop bread one piece after the other into a lane and fly away; the bread falls. */
function ravens(g: Run, dt: number, rand: () => number) {
  // a feather has called a raven
  while (g.ravenCalls > 0) {
    // not near the goal: there is nothing left to feed
    if (g.goal > 0 && g.dist + RAVEN_LEAD + 12 > g.goal) {
      g.ravenCalls = 0
      break
    }
    const n = rand() < 0.5 ? 5 : 6
    const lane = ravenLane(g, n, rand)
    // every lane is full of things there: try again in the next step
    if (lane < 0) break
    g.ravenCalls--
    const side = lane === 0 ? 1 : lane === 2 ? -1 : rand() < 0.5 ? -1 : 1
    g.ravens.push({ lane, n, dropped: 0, age: 0, x: laneX(lane) + side * 7, y: 6.5, lead: -4, side, leaving: -1, gone: false })
    g.events.push('rabe')
  }
  for (const r of g.ravens) {
    r.age += dt
    const tin = Math.min(1, r.age / RAVEN_IN)
    const e = 1 - (1 - tin) * (1 - tin)
    if (r.leaving < 0) {
      r.x = laneX(r.lane) + r.side * 7 * (1 - e)
      r.y = 6.5 + (RAVEN_Y - 6.5) * e
      r.lead = -4 + (RAVEN_LEAD + 4) * e
      // one piece after the other
      while (r.dropped < r.n && r.age >= RAVEN_IN + r.dropped * RAVEN_GAP) {
        r.dropped++
        const z = g.dist + r.lead
        if (!blockedAt(g, r.lane, z, 1.3)) {
          g.pickups.push({ z, lane: r.lane, y: r.y - 0.5, type: 'brot', got: false, vy: 0 })
          g.events.push('abwurf')
        }
      }
      if (r.dropped >= r.n && r.age >= RAVEN_IN + r.n * RAVEN_GAP) r.leaving = 0
    } else {
      r.leaving += dt
      r.y += 3.2 * dt
      r.x += r.side * -2.5 * dt
      r.lead += 14 * dt
      if (r.leaving > RAVEN_OUT) r.gone = true
    }
  }
  if (g.ravens.some((r) => r.gone)) g.ravens = g.ravens.filter((r) => !r.gone)
  // falling bread
  for (const p of g.pickups) {
    if (p.vy === undefined || p.got) continue
    p.vy -= BREAD_FALL * dt
    p.y += p.vy * dt
    if (p.y <= BREAD_REST) {
      p.y = BREAD_REST
      delete p.vy
    }
  }
}

function collide(g: Run, from: number, to: number) {
  for (const o of g.obstacles) {
    if (o.hit) continue
    if (o.z < from - 0.55 || o.z > to + 0.55) continue
    const dx = Math.abs(g.x - laneX(o.lane))
    if (dx >= 1.0) continue
    let hurts = false
    if (o.kind === 'low') hurts = g.y < LOW_H
    else if (o.kind === 'high') hurts = g.slide <= 0
    else hurts = g.y < BLOCK_H
    if (!hurts) continue
    o.hit = true
    if (g.invuln > 0) continue
    // a wall taken head-on is a fall; brushing past it is only a stumble
    if (o.kind === 'block' && dx < 0.55) return fall(g, 'block')
    stumble(g)
    if (g.phase !== 'play') return
  }
}

function stumble(g: Run) {
  if (g.sinceStumble < STUMBLE_WINDOW) return fall(g, 'second')
  g.stumbles++
  g.sinceStumble = 0
  g.invuln = 1.2
  g.slow = 0.55
  g.events.push('stumble')
}

function fall(g: Run, cause: FallCause) {
  g.phase = 'over'
  g.cause = cause
  g.events.push('fall')
}

function collect(g: Run, from: number, to: number) {
  const h = bodyHeight(g)
  for (const p of g.pickups) {
    if (p.got) continue
    if (p.z < from - 0.7 || p.z > to + 0.7) continue
    const dx = Math.abs(g.x - laneX(p.lane))
    if (dx >= 1.0) continue
    if (!(p.y >= g.y - 0.3 && p.y <= g.y + h + 0.3)) continue
    p.got = true
    if (p.type === 'brot') {
      g.hunger = Math.min(1, g.hunger + BREAD_FOOD)
      g.bread++
      g.events.push('brot')
    } else if (p.type === 'krug') {
      g.hunger = Math.min(1, g.hunger + KRUG_FOOD)
      g.bread += KRUG_VALUE
      g.events.push('krug')
    } else {
      g.ravenCalls++
      g.events.push('feder')
    }
  }
}

/** The stars of a won level: 1 for the goal, 1 if Elijah never got really hungry, 1 for no stumble at all. */
export function starsFor(g: Run): number {
  if (g.phase !== 'won') return 0
  let n = 1
  if (g.minHunger >= HUNGRY) n++
  if (g.stumbles === 0) n++
  return n
}

/** The score of the free run: metres and three points a piece of bread. */
export const scoreOf = (g: Run): number => Math.floor(g.dist) + g.bread * 3

/** The things that are within sight, near ones last (so they are drawn over the far ones). Used by the picture. */
export function visible<T extends { z: number }>(list: readonly T[], dist: number, from: number, to: number): T[] {
  return list.filter((o) => o.z - dist >= from && o.z - dist <= to).sort((a, b) => b.z - a.z)
}
