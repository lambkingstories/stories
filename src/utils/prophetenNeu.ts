/**
 * The pure parts of the three new games of "Der König kommt" (the components only show and listen):
 * "The name lanterns" (`laternen`, Isaiah 9,5: lanterns rise into the evening sky, the child catches the ones that carry the names of the child),
 * "The shoot" (`spross`, Isaiah 11,1: a shoot grows out of the stump of Jesse; the child steers it past the stones to the light) and
 * "Ways to Zion" (`zionwege`, Micah 4,1-2.6-7: path tiles are turned until all the scattered people have a way to Mount Zion).
 * The arithmetic has no clock and no dice of its own: the components hand in the time.
 */
import { mistakeStars } from '@/utils/adventureScore'

export interface Pt {
  x: number
  y: number
}

/** Stars at the end of all three games: up to two mistakes three stars, up to four two stars, then one (the same as `osterStars`). */
export const prophetenStars = (mistakes: number): number => mistakeStars(Math.max(0, mistakes), 2, 4)

// ================================================================ 1. the name lanterns (`laternen`)

/** The field is upright, 3:4 (width / height); the lantern pictures are 3:4 too, so a lantern is as high in percent of the field height as it is wide in percent of the width. */
export const LANTERN_RATIO = 0.75
/** Where a lantern starts (below the field) and where it leaves (above the field), percent of the height (the middle of the lantern). */
export const LANTERN_FROM = 112
export const LANTERN_TO = -14
/** The height band in which a lantern can be caught (its middle). */
export const LANTERN_CATCH_TOP = 2
export const LANTERN_CATCH_BOTTOM = 98

/** One lantern of a round: which name it carries (`name` = index into `names`, -1 = no name), its lane, when it starts in the loop (ms) and which picture it shows. */
export interface LanternSpec {
  name: number
  lane: number
  at: number
  design: number
}
/** One round: the hint, how long a lantern takes to rise (ms), how long the loop is (ms; then all lanterns come again), whether the names must be caught in their order, how far a lantern sways (percent of the width) and the lanterns. */
export interface LanternRound {
  hint: string
  rise: number
  loop: number
  order: boolean
  sway: number
  lanterns: LanternSpec[]
}
/**
 * The game "The name lanterns" (`laternen`): the evening sky (3:4), the lantern pictures (3:4, transparent, without writing), the names of the child (Isaiah 9,5, shown as the
 * writing of the app on a little plate under the lantern), the middles of the lanes (percent of the width), the width of a lantern (percent of the width) and the rounds.
 */
export interface LanternGame {
  background: string
  designs: string[]
  names: string[]
  lanes: number[]
  w: number
  rounds: LanternRound[]
}

/** A lantern on the screen: its key (`index:loop`, the same lantern comes again in the next loop), its place (the middle, percent) and what it carries. */
export interface LanternPose {
  key: string
  i: number
  x: number
  y: number
  name: number
  design: number
}

/** Where lantern `i` of a round is at `clock` ms (null when it is not in the sky). */
export function lanternPose(game: LanternGame, round: LanternRound, i: number, clock: number): LanternPose | null {
  const l = round.lanterns[i]
  if (!l) return null
  const phase = clock - l.at
  if (phase < 0) return null
  const loop = Math.floor(phase / round.loop)
  const local = phase - loop * round.loop
  if (local > round.rise) return null
  const p = local / round.rise
  const y = LANTERN_FROM + (LANTERN_TO - LANTERN_FROM) * p
  const x = (game.lanes[l.lane] ?? 50) + round.sway * Math.sin(p * Math.PI * 3 + i * 1.7)
  return { key: `${i}:${loop}`, i, x, y, name: l.name, design: l.design }
}

/** All lanterns in the sky at `clock`, without those already used (`gone`, by key) and without the names already caught. */
export function lanternPoses(game: LanternGame, round: LanternRound, clock: number, gone: ReadonlySet<string>, caught: readonly number[]): LanternPose[] {
  const out: LanternPose[] = []
  round.lanterns.forEach((l, i) => {
    if (l.name >= 0 && caught.includes(l.name)) return
    const p = lanternPose(game, round, i, clock)
    if (p && !gone.has(p.key)) out.push(p)
  })
  return out
}

/** The lantern can be caught now (its middle is inside the field). */
export const lanternCatchable = (p: LanternPose): boolean => p.y >= LANTERN_CATCH_TOP && p.y <= LANTERN_CATCH_BOTTOM

/** The names the child may catch now: in a round with order only the next one, otherwise every name not caught yet. */
export function lanternWanted(game: LanternGame, round: LanternRound, caught: readonly number[]): number[] {
  const left = game.names.map((_, k) => k).filter((k) => !caught.includes(k))
  return round.order ? left.slice(0, 1) : left
}

/** What a tap on a lantern means: `caught` (a wanted name), `blank` (no name: a mistake), `order` (a name, but not the next one: a mistake). */
export function lanternTry(game: LanternGame, round: LanternRound, caught: readonly number[], name: number): 'caught' | 'blank' | 'order' {
  if (name < 0) return 'blank'
  return lanternWanted(game, round, caught).includes(name) ? 'caught' : 'order'
}

/** The lantern a key press catches in a lane: the catchable one nearest to the middle of the field (null when there is none). */
export function lanternInLane(game: LanternGame, round: LanternRound, poses: readonly LanternPose[], lane: number): LanternPose | null {
  let best: LanternPose | null = null
  for (const p of poses) {
    if (round.lanterns[p.i]?.lane !== lane || !lanternCatchable(p)) continue
    if (!best || Math.abs(p.y - 50) < Math.abs(best.y - 50)) best = p
  }
  return best
}

/** How long (ms) two lanterns of one lane must start apart so that they never overlap (the lantern height plus a little gap). */
export function lanternSpacing(game: LanternGame, round: LanternRound): number {
  return ((game.w * 1.35) / (LANTERN_FROM - LANTERN_TO)) * round.rise
}

/** The problems of the data of `laternen` (an empty list is good). */
export function lanternsProblems(game: LanternGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the sky')
  if (!game.designs.length) out.push('no lantern pictures')
  if (game.names.length < 3 || game.names.length > 6) out.push('there must be 3 to 6 names')
  if (new Set(game.names).size !== game.names.length) out.push('a name is there twice')
  if (game.w < 13) out.push('the lanterns are smaller than 13 % of the width (under 47 pixels on a phone)')
  const lanes = [...game.lanes].sort((a, b) => a - b)
  if (lanes.length < 3) out.push('fewer than three lanes')
  lanes.forEach((x, k) => {
    if (x - game.w / 2 < 0 || x + game.w / 2 > 100) out.push(`lane ${k + 1} lies partly outside the field`)
  })
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const minGap = Math.min(...lanes.slice(1).map((x, k) => x - lanes[k]!))
    if (minGap < game.w + 2 * r.sway) out.push(`round ${n}: two lanterns of neighbouring lanes can touch (lanes ${minGap.toFixed(1)} apart, need ${(game.w + 2 * r.sway).toFixed(1)})`)
    if (r.rise < 4000) out.push(`round ${n}: the lanterns rise in under 4 seconds`)
    if (r.loop < r.rise) out.push(`round ${n}: the loop is shorter than the rise`)
    for (let k = 0; k < game.names.length; k++) {
      const c = r.lanterns.filter((l) => l.name === k).length
      if (c !== 1) out.push(`round ${n}: the name "${game.names[k]}" is on ${c} lanterns (one is needed)`)
    }
    if (r.lanterns.filter((l) => l.name < 0).length < 2) out.push(`round ${n}: fewer than two lanterns without a name`)
    r.lanterns.forEach((l, i) => {
      if (l.lane < 0 || l.lane >= game.lanes.length) out.push(`round ${n}: lantern ${i + 1} has no lane`)
      if (l.design < 0 || l.design >= game.designs.length) out.push(`round ${n}: lantern ${i + 1} has no picture`)
      if (l.at < 0 || l.at >= r.loop) out.push(`round ${n}: lantern ${i + 1} starts outside the loop`)
      if (l.name >= game.names.length || l.name < -1) out.push(`round ${n}: lantern ${i + 1} has an unknown name`)
    })
    const space = lanternSpacing(game, r)
    r.lanterns.forEach((a, i) => {
      r.lanterns.forEach((b, k) => {
        if (k <= i || a.lane !== b.lane) return
        const d = Math.abs(a.at - b.at) % r.loop
        if (Math.min(d, r.loop - d) < space) out.push(`round ${n}: lanterns ${i + 1} and ${k + 1} overlap in lane ${a.lane + 1}`)
      })
    })
  })
  const [r1, r2] = game.rounds
  if (r1 && r2) {
    const blanks = (r: LanternRound) => r.lanterns.filter((l) => l.name < 0).length
    if (!(r2.rise < r1.rise || blanks(r2) > blanks(r1) || (r2.order && !r1.order))) out.push('round 2 is not harder than round 1')
  }
  return out
}

// ================================================================ 2. the shoot (`spross`)

/** The field is upright, 3:4. Inside the arithmetic everything is in "units": percent of the width (x 0..100, y 0..133.3), so a circle is round. */
export const SHOOT_RATIO = 0.75
/** How fast the shoot grows (units a second), how fast it turns (degrees a second) and how far it may lean (degrees from straight up). */
export const SHOOT_SPEED = 13
export const SHOOT_TURN = 110
export const SHOOT_MAX = 72
/** The radius of the tip that touches a stone (units), the distance between two points of the drawn stem (units) and the margin at the edges. */
export const SHOOT_TIP_R = 4.5
export const SHOOT_TRAIL = 1.6
export const SHOOT_EDGE = 4
/** The space the help keeps from every stone (units, besides the tip). */
export const SHOOT_CLEAR = 2

/** A stone: the middle (x percent of the width, y percent of the height), the radius it blocks (units) and its picture. */
export interface ShootStone {
  x: number
  y: number
  r: number
  image: number
}
/** One round: the hint, the stones and the way of the help (points from the stump to the light, percent like the stones). */
export interface ShootRound {
  hint: string
  stones: ShootStone[]
  route: Pt[]
}
/**
 * The game "The shoot" (`spross`): the grove with the stump and the light (3:4), the stem piece and the tip (pictures), the stone pictures,
 * where the shoot starts (the cut of the stump) and where the light is (percent), how near the tip must come to the light (units), how wide a stone picture is
 * compared with its blocking circle (`stoneScale`, width = 2 r stoneScale) and the rounds.
 */
export interface ShootGame {
  background: string
  stem: string
  tip: string
  stones: string[]
  start: Pt
  light: Pt
  lightR: number
  stoneScale: number
  rounds: ShootRound[]
}

export interface ShootState {
  /** the tip, in units */
  tip: Pt
  /** degrees from straight up, + to the right */
  heading: number
  /** the stem, in units, from the stump to the tip */
  trail: Pt[]
  /** the stones touched already (each is one mistake) */
  hit: number[]
  /** the stone the tip leans against now (-1 none) */
  touching: number
  done: boolean
}

const H = 100 / SHOOT_RATIO
const RAD = Math.PI / 180
/** A place of the data (percent of the width and of the height) in units. */
export const shootUnits = (p: Pt): Pt => ({ x: p.x, y: (p.y * H) / 100 })
/** A place in units as percent of the width and the height (for the screen). */
export const shootPercent = (p: Pt): Pt => ({ x: p.x, y: (p.y * 100) / H })
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The shoot at the start of a round: the tip on the stump, straight up. */
export function shootStart(game: ShootGame): ShootState {
  const s = shootUnits(game.start)
  return { tip: { ...s }, heading: 0, trail: [{ ...s }], hit: [], touching: -1, done: false }
}

/** The steering that turns the tip toward a point (units): -1 left .. 1 right, 0 when it points there already. */
export function shootAim(state: ShootState, target: Pt, dt: number): number {
  const want = clamp(Math.atan2(target.x - state.tip.x, state.tip.y - target.y) / RAD, -SHOOT_MAX, SHOOT_MAX)
  const diff = want - state.heading
  if (Math.abs(diff) < 1) return 0
  return clamp(diff / Math.max(1e-6, SHOOT_TURN * dt), -1, 1)
}

/**
 * One step of growing: turn by the steering (`input` -1..1), then grow `speed * dt` along the heading. When a stone is in the way, the tip slides round it
 * (when it leans enough to one side) or waits; the first touch of every stone is one mistake (`hit`). Reaching the light ends the round (`done`).
 */
export function shootStep(game: ShootGame, round: ShootRound, state: ShootState, input: number, dt: number, speed = SHOOT_SPEED): 'hit' | 'done' | null {
  if (state.done) return null
  state.heading = clamp(state.heading + clamp(input, -1, 1) * SHOOT_TURN * dt, -SHOOT_MAX, SHOOT_MAX)
  const step = speed * dt
  const d = { x: Math.sin(state.heading * RAD) * step, y: -Math.cos(state.heading * RAD) * step }
  let next = { x: clamp(state.tip.x + d.x, SHOOT_EDGE, 100 - SHOOT_EDGE), y: Math.max(SHOOT_EDGE, state.tip.y + d.y) }
  let event: 'hit' | 'done' | null = null
  const block = round.stones.findIndex((s) => dist(next, shootUnits(s)) < s.r + SHOOT_TIP_R)
  if (block >= 0) {
    const s = round.stones[block]!
    const c = shootUnits(s)
    if (!state.hit.includes(block)) {
      state.hit.push(block)
      event = 'hit'
    }
    state.touching = block
    // slide along the stone: the part of the step along the tangent, kept on the circle round the stone
    const nx = state.tip.x - c.x
    const ny = state.tip.y - c.y
    const nl = Math.hypot(nx, ny) || 1
    let tx = -ny / nl
    let ty = nx / nl
    let along = (d.x * tx + d.y * ty) / step
    if (along < 0) {
      tx = -tx
      ty = -ty
      along = -along
    }
    const slid = { x: state.tip.x + tx * step * along, y: state.tip.y + ty * step * along }
    const sl = Math.hypot(slid.x - c.x, slid.y - c.y) || 1
    const rr = s.r + SHOOT_TIP_R + 0.01
    next = { x: c.x + ((slid.x - c.x) / sl) * rr, y: c.y + ((slid.y - c.y) / sl) * rr }
    const other = round.stones.some((o, k) => k !== block && dist(next, shootUnits(o)) < o.r + SHOOT_TIP_R)
    // a shoot does not grow downward; a step of almost nothing (straight against the stone) waits
    if (along < 0.25 || next.y > state.tip.y + 0.05 || other || next.x < SHOOT_EDGE || next.x > 100 - SHOOT_EDGE) return event
  } else state.touching = -1
  state.tip = next
  const last = state.trail[state.trail.length - 1]!
  if (dist(last, next) >= SHOOT_TRAIL) state.trail.push({ ...next })
  if (dist(next, shootUnits(game.light)) <= game.lightR) {
    state.done = true
    state.trail.push({ ...next })
    return 'done'
  }
  return event
}

/** The waypoint of the help for a state: the first point of the route that is still above the tip (the light at the end). */
export function shootWaypoint(game: ShootGame, round: ShootRound, state: ShootState): Pt {
  for (const p of round.route) {
    const u = shootUnits(p)
    if (u.y < state.tip.y - 2) return u
  }
  return shootUnits(game.light)
}

/** The steering of the help (and of the check of the data): toward the next waypoint of the route. */
export function shootAuto(game: ShootGame, round: ShootRound, state: ShootState, dt: number): number {
  return shootAim(state, shootWaypoint(game, round, state), dt)
}

/** Lets the shoot grow by itself (help or check): how many stones it touched, whether it reached the light, the time and how near it came to a stone (units of free space). */
export function shootSimulate(game: ShootGame, round: ShootRound, steer: 'auto' | 'straight', maxSeconds = 60, dt = 1 / 30): { hits: number; done: boolean; seconds: number; clearance: number } {
  const st = shootStart(game)
  let t = 0
  let clearance = Infinity
  while (t < maxSeconds && !st.done) {
    shootStep(game, round, st, steer === 'auto' ? shootAuto(game, round, st, dt) : 0, dt)
    for (const s of round.stones) clearance = Math.min(clearance, dist(st.tip, shootUnits(s)) - s.r - SHOOT_TIP_R)
    t += dt
  }
  return { hits: st.hit.length, done: st.done, seconds: t, clearance }
}

/** The problems of the data of `spross` (an empty list is good). */
export function shootGrowProblems(game: ShootGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the grove')
  if (!game.stem || !game.tip) out.push('no picture of the stem or the tip')
  if (!game.stones.length) out.push('no stone pictures')
  if (game.lightR < 5) out.push('the light is too small to reach')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  const s0 = shootUnits(game.start)
  const l0 = shootUnits(game.light)
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (r.stones.length < 2) out.push(`round ${n}: fewer than two stones`)
    if (r.route.length < 1) out.push(`round ${n}: no route for the help`)
    r.stones.forEach((s, i) => {
      const u = shootUnits(s)
      if (s.image < 0 || s.image >= game.stones.length) out.push(`round ${n}: stone ${i + 1} has no picture`)
      if (s.r * 2 * game.stoneScale < 13) out.push(`round ${n}: stone ${i + 1} is smaller than 13 % of the width`)
      if (u.x - s.r < 0 || u.x + s.r > 100 || u.y - s.r < 0 || u.y + s.r > H) out.push(`round ${n}: stone ${i + 1} lies partly outside the field`)
      if (dist(u, s0) < s.r + SHOOT_TIP_R + 8) out.push(`round ${n}: stone ${i + 1} is too near the stump`)
      if (dist(u, l0) < s.r + game.lightR + 2) out.push(`round ${n}: stone ${i + 1} covers the light`)
    })
    const auto = shootSimulate(game, r, 'auto')
    if (!auto.done) out.push(`round ${n}: the help does not reach the light`)
    if (auto.hits) out.push(`round ${n}: the help touches ${auto.hits} stone(s)`)
    if (auto.clearance < SHOOT_CLEAR) out.push(`round ${n}: the way of the help passes a stone with only ${auto.clearance.toFixed(1)} units of space`)
    if (auto.done && auto.seconds > 25) out.push(`round ${n}: the way takes ${auto.seconds.toFixed(0)} seconds (too long)`)
    if (shootSimulate(game, r, 'straight').hits === 0) out.push(`round ${n}: growing straight up touches no stone (nothing to steer)`)
  })
  const [r1, r2] = game.rounds
  if (r1 && r2 && r2.stones.length <= r1.stones.length) out.push('round 2 is not harder than round 1 (not more stones)')
  return out
}

// ================================================================ 3. ways to Zion (`zionwege`)

/** A direction: 0 up, 1 right, 2 down, 3 left. */
export type ZionDir = 0 | 1 | 2 | 3
/** The tiles that can be turned: straight, corner, T and the end of a path. */
export type ZionKind = 'I' | 'L' | 'T' | 'E'
const STEP: Record<ZionDir, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] }
/** The open edges of each picture without a turn (like the lanes of `botengang`): straight up-down, corner up-right, T right-down-left, end and Zion down. */
export const ZION_BASE: Record<ZionKind | 'Z', ZionDir[]> = { I: [0, 2], L: [0, 1], T: [1, 2, 3], E: [2], Z: [2] }
const KINDS = new Set(['I', 'L', 'T', 'E'])
const SIGNS = new Set(['.', 'Z', 'I', 'L', 'T', 'E'])

/** A person who waits at a tile (row, column) and the picture of the person. */
export interface ZionPerson {
  r: number
  c: number
  image: number
}
/**
 * One round: the hint, the map (one string per row; `.` field, `Z` Mount Zion (not turned, open at the bottom), `I` `L` `T` `E` path tiles),
 * the turn of every tile at the start and in the solution (strings of digits 0-3, quarter turns clockwise, the same shape), the fewest taps (`par`) and the people.
 */
export interface ZionRound {
  hint: string
  rows: string[]
  start: string[]
  solution: string[]
  par: number
  people: ZionPerson[]
}
/** The pictures: one per path tile, Mount Zion, the fields (taken in turn) and the people; `turn` corrects a picture that was painted turned (degrees). */
export interface ZionTiles {
  straight: string
  corner: string
  tee: string
  end: string
  zion: string
  fields: string[]
  turn?: Partial<Record<ZionKind | 'Z', number>>
}
/** The game "Ways to Zion" (`zionwege`). */
export interface ZionGame {
  tiles: ZionTiles
  people: string[]
  rounds: ZionRound[]
}

export interface ZionCell {
  r: number
  c: number
}
export type ZionTurns = number[][]

/** The sign of a cell (`.` outside the map). */
export const zionAt = (rows: readonly string[], r: number, c: number): string => rows[r]?.[c] ?? '.'
/** A tile the child can turn. */
export const zionTurnable = (rows: readonly string[], r: number, c: number): boolean => KINDS.has(zionAt(rows, r, c))
/** The digits of a turn map as numbers. */
export const zionTurns = (map: readonly string[]): ZionTurns => map.map((row) => [...row].map((ch) => (/[0-3]/.test(ch) ? Number(ch) : 0)))

/** The open edges of a cell with its turn. */
export function zionOpen(rows: readonly string[], turns: ZionTurns, r: number, c: number): ZionDir[] {
  const s = zionAt(rows, r, c)
  if (s === 'Z') return ZION_BASE.Z
  if (!KINDS.has(s)) return []
  const q = turns[r]?.[c] ?? 0
  return ZION_BASE[s as ZionKind].map((d) => ((d + q) % 4) as ZionDir)
}

/** Which cells have a way to Mount Zion (both tiles open toward each other, step by step from Zion). */
export function zionReached(rows: readonly string[], turns: ZionTurns): boolean[][] {
  const seen = rows.map((row) => [...row].map(() => false))
  const queue: ZionCell[] = []
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === 'Z') {
      seen[r]![c] = true
      queue.push({ r, c })
    }
  })
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!
    for (const d of zionOpen(rows, turns, p.r, p.c)) {
      const r = p.r + STEP[d][0]
      const c = p.c + STEP[d][1]
      if (seen[r]?.[c] === undefined || seen[r]![c]) continue
      if (!zionOpen(rows, turns, r, c).includes(((d + 2) % 4) as ZionDir)) continue
      seen[r]![c] = true
      queue.push({ r, c })
    }
  }
  return seen
}

/** How many people have a way to Zion. */
export function zionPeopleReached(round: ZionRound, turns: ZionTurns): number {
  const seen = zionReached(round.rows, turns)
  return round.people.filter((p) => seen[p.r]?.[p.c]).length
}
/** Every person has a way to Zion. */
export const zionSolved = (round: ZionRound, turns: ZionTurns): boolean => round.people.length > 0 && zionPeopleReached(round, turns) === round.people.length

/** The same open edges (a straight tile is the same after half a turn). */
const sameOpen = (kind: ZionKind, a: number, b: number) => {
  const x = ZION_BASE[kind].map((d) => (d + a) % 4).sort()
  const y = ZION_BASE[kind].map((d) => (d + b) % 4).sort()
  return x.join() === y.join()
}
/** The fewest taps (each a quarter turn clockwise) from turn `from` to the open edges of turn `to`. */
export function zionCost(kind: ZionKind, from: number, to: number): number {
  for (let k = 0; k < 4; k++) if (sameOpen(kind, (from + k) % 4, to)) return k
  return 0
}
/** The different turns of a tile (a straight tile has two). */
const distinctTurns = (kind: ZionKind): number[] => (kind === 'I' ? [0, 1] : [0, 1, 2, 3])

/** The most tiles the search looks at. */
export const ZION_MAX = 16

/**
 * The fewest taps from a state to a way for everybody (a search over all turns with a bound; null when there is none or the map is too big), and the turns of that solution.
 */
export function zionBest(round: ZionRound, turns: ZionTurns): { taps: number; turns: ZionTurns } | null {
  const rows = round.rows
  const cells: ZionCell[] = []
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (KINDS.has(row[c]!)) cells.push({ r, c })
  })
  if (cells.length > ZION_MAX) return null
  const zr = rows.findIndex((row) => row.includes('Z'))
  if (zr < 0) return null
  const zc = rows[zr]!.indexOf('Z')
  const cur = turns.map((row) => row.slice())
  let best: { taps: number; turns: ZionTurns } | null = null
  const options = cells.map(({ r, c }) => {
    const kind = rows[r]![c] as ZionKind
    const from = turns[r]?.[c] ?? 0
    return distinctTurns(kind)
      .map((t) => {
        const to = (from + zionCost(kind, from, t)) % 4
        return { to, cost: zionCost(kind, from, t) }
      })
      .sort((a, b) => a.cost - b.cost)
  })
  // the tiles in the order of their distance from Zion (so the bound below cuts early)
  const order = cells.map((p, k) => ({ p, k, d: Math.abs(p.r - zr) + Math.abs(p.c - zc) })).sort((a, b) => a.d - b.d)
  const sortedCells = order.map((o) => o.p)
  const sortedOptions = order.map((o) => options[o.k]!)
  cells.splice(0, cells.length, ...sortedCells)
  options.splice(0, options.length, ...sortedOptions)
  const decided = rows.map((row) => [...row].map(() => false))
  /** Could every person still get a way, when every tile not decided yet were open on all sides (an end tile can be entered, but not passed)? */
  const possible = (): boolean => {
    const seen = rows.map((row) => [...row].map(() => false))
    seen[zr]![zc] = true
    const queue: ZionCell[] = [{ r: zr, c: zc }]
    const openOf = (r: number, c: number): ZionDir[] => (zionTurnable(rows, r, c) && !decided[r]![c] ? (rows[r]![c] === 'E' ? [] : [0, 1, 2, 3]) : zionOpen(rows, cur, r, c))
    const accepts = (r: number, c: number, from: ZionDir): boolean => (zionTurnable(rows, r, c) && !decided[r]![c] ? true : zionOpen(rows, cur, r, c).includes(from))
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i]!
      for (const d of openOf(p.r, p.c)) {
        const r = p.r + STEP[d][0]
        const c = p.c + STEP[d][1]
        if (seen[r]?.[c] === undefined || seen[r]![c]) continue
        if (!accepts(r, c, ((d + 2) % 4) as ZionDir)) continue
        seen[r]![c] = true
        queue.push({ r, c })
      }
    }
    return round.people.every((p) => seen[p.r]?.[p.c])
  }
  const go = (k: number, taps: number) => {
    if (best && taps >= best.taps) return
    if (k > 0 && !possible()) return
    if (k === cells.length) {
      if (zionSolved(round, cur)) best = { taps, turns: cur.map((row) => row.slice()) }
      return
    }
    const { r, c } = cells[k]!
    decided[r]![c] = true
    for (const o of options[k]!) {
      cur[r]![c] = o.to
      go(k + 1, taps + o.cost)
    }
    decided[r]![c] = false
    cur[r]![c] = turns[r]?.[c] ?? 0
  }
  go(0, 0)
  return best
}

/** The tile the button "Help me" shows: the first tile of a solution with the fewest taps that still has to turn (null when solved or there is none). */
export function zionHint(round: ZionRound, turns: ZionTurns): ZionCell | null {
  if (zionSolved(round, turns)) return null
  const b = zionBest(round, turns)
  if (!b) return null
  for (let r = 0; r < round.rows.length; r++)
    for (let c = 0; c < round.rows[r]!.length; c++) {
      if (!zionTurnable(round.rows, r, c)) continue
      if ((b.turns[r]![c] ?? 0) !== (turns[r]![c] ?? 0)) return { r, c }
    }
  return null
}

/** The mistakes of a round: every four taps over the fewest taps are one mistake (trying is allowed). */
export const zionMistakes = (taps: number, par: number): number => Math.floor(Math.max(0, taps - par) / 4)

/** The cell an arrow key goes to (stays inside the map). */
export function zionMove(rows: readonly string[], at: ZionCell, dir: ZionDir): ZionCell {
  const r = Math.min(rows.length - 1, Math.max(0, at.r + STEP[dir][0]))
  const c = Math.min((rows[r]?.length ?? 1) - 1, Math.max(0, at.c + STEP[dir][1]))
  return { r, c }
}

/** The picture and the turn (degrees clockwise) of a cell: path tiles by their turn, Zion as painted, fields taken in turn. */
export function zionPicture(game: ZionGame, rows: readonly string[], turns: ZionTurns, r: number, c: number): { src: string; turn: number; kind: ZionKind | 'Z' | 'field' } {
  const s = zionAt(rows, r, c)
  const t = game.tiles
  if (s === 'Z') return { src: t.zion, turn: t.turn?.Z ?? 0, kind: 'Z' }
  if (!KINDS.has(s)) {
    const f = t.fields.length ? t.fields : [t.straight]
    return { src: f[(r * 3 + c * 5) % f.length]!, turn: 0, kind: 'field' }
  }
  const kind = s as ZionKind
  const src = kind === 'I' ? t.straight : kind === 'L' ? t.corner : kind === 'T' ? t.tee : t.end
  return { src, turn: (turns[r]?.[c] ?? 0) * 90 + (t.turn?.[kind] ?? 0), kind }
}

/** The problems of the data of `zionwege` (an empty list is good). */
export function zionPathsProblems(game: ZionGame): string[] {
  const out: string[] = []
  const t = game.tiles
  for (const k of ['straight', 'corner', 'tee', 'end', 'zion'] as const) if (!t[k]) out.push(`no picture for the tile "${k}"`)
  if (!t.fields.length) out.push('no field pictures')
  if (!game.people.length) out.push('no pictures of people')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((round, ri) => {
    const n = ri + 1
    const { rows } = round
    const w = rows[0]?.length ?? 0
    if (rows.length < 3 || w < 3) out.push(`round ${n}: the map is too small`)
    if (w > 6) out.push(`round ${n}: more than 6 columns are too small to tap on a phone`)
    if (rows.some((row) => row.length !== w)) out.push(`round ${n}: the rows are not all equally long`)
    if (round.start.length !== rows.length || round.start.some((row, r) => row.length !== rows[r]!.length)) out.push(`round ${n}: the start turns do not have the shape of the map`)
    if (round.solution.length !== rows.length || round.solution.some((row, r) => row.length !== rows[r]!.length)) out.push(`round ${n}: the solution does not have the shape of the map`)
    if ([...round.start, ...round.solution].some((row) => !/^[0-3]*$/.test(row))) out.push(`round ${n}: turns must be digits 0 to 3`)
    rows.forEach((row, r) => {
      for (const ch of row) if (!SIGNS.has(ch)) out.push(`round ${n}: unknown sign "${ch}" in row ${r + 1}`)
    })
    const zions = rows.join('').split('').filter((ch) => ch === 'Z').length
    if (zions !== 1) out.push(`round ${n}: there must be exactly one Mount Zion, there are ${zions}`)
    const tiles = rows.join('').split('').filter((ch) => KINDS.has(ch)).length
    if (tiles > ZION_MAX) out.push(`round ${n}: more than ${ZION_MAX} tiles`)
    if (round.people.length < 2) out.push(`round ${n}: fewer than two people`)
    round.people.forEach((p, i) => {
      if (!zionTurnable(rows, p.r, p.c)) out.push(`round ${n}: person ${i + 1} does not stand on a path tile`)
      if (p.image < 0 || p.image >= game.people.length) out.push(`round ${n}: person ${i + 1} has no picture`)
      round.people.forEach((o, k) => {
        if (k > i && o.r === p.r && o.c === p.c) out.push(`round ${n}: persons ${i + 1} and ${k + 1} stand on the same tile`)
      })
    })
    if (out.some((x) => x.startsWith(`round ${n}:`))) return
    const start = zionTurns(round.start)
    const sol = zionTurns(round.solution)
    if (zionPeopleReached(round, start) > 0) out.push(`round ${n}: a person has a way to Zion at the start already`)
    if (!zionSolved(round, sol)) out.push(`round ${n}: the solution does not bring everybody to Zion`)
    let cost = 0
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (KINDS.has(row[c]!)) cost += zionCost(row[c] as ZionKind, start[r]![c]!, sol[r]![c]!)
    })
    const best = zionBest(round, start)
    if (!best) out.push(`round ${n}: the start cannot be solved`)
    else {
      if (best.taps !== round.par) out.push(`round ${n}: the fewest taps are ${best.taps}, not ${round.par} (par)`)
      if (cost !== best.taps) out.push(`round ${n}: the solution takes ${cost} taps, the fewest are ${best.taps}`)
    }
  })
  const [r1, r2] = game.rounds
  if (r1 && r2) {
    const tiles = (r: ZionRound) => r.rows.join('').split('').filter((ch) => KINDS.has(ch)).length
    if (!(tiles(r2) > tiles(r1) && r2.people.length >= r1.people.length && r2.par > r1.par)) out.push('round 2 is not harder than round 1')
  }
  return out
}
