/**
 * The pure parts of three more games of "Ostern" (the components only draw and listen):
 * "The road to Emmaus" (`wanderweg`, Luke 24,13-15: lead the two walkers up the road past stones and thornbushes to the milestone),
 * "Lay the table" (`tischdecken`, Luke 24,29-30: drag the things to their places at the table in Emmaus; at the end the bread is broken) and
 * "Pass on the light" (`lichtweg`, Luke 24,52-53: pass the flame from lamp to lamp within reach, all the way to the city gate).
 * All places are percent of the picture: x is a part of the width, y a part of the height. Distances are "units" (percent of the width), so that a circle is round on the screen
 * (`osterDist` divides the vertical difference by the ratio of the picture). The types live here until they are moved to `types/adventure.ts`.
 */
import { osterDist } from '@/utils/osternGames'
import type { Pt } from '@/utils/osternGames'

export type { Pt }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const inPicture = (p: Pt): boolean => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100

/**
 * The neighbour for the arrow keys: the nearest place in the direction `dx`, `dy` (-1, 0 or 1) from place `idx`; places straight in that direction come first.
 * Without a place there (or with `idx` < 0) the first place, or `idx` itself.
 */
export function osterNeighbour(points: readonly Pt[], idx: number, dx: number, dy: number, ratio: number): number {
  if (!points.length) return -1
  if (idx < 0 || idx >= points.length) return 0
  const a = points[idx]!
  let best = idx
  let bestScore = Infinity
  points.forEach((p, i) => {
    if (i === idx) return
    const ux = p.x - a.x
    const uy = (p.y - a.y) / ratio
    const along = ux * dx + uy * dy
    if (along <= 0.01) return
    const across = Math.abs(ux * dy - uy * dx)
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}

// ================================================================ 1. the road to Emmaus (`wanderweg`)

/** The road picture is upright, 3:4 (width / height). */
export const WANDER_RATIO = 0.75
/** How fast the walkers follow the finger (units a second) when the data say nothing. */
export const WANDER_SPEED = 18
/** The circle of the walkers for touching an obstacle: this share of the width of the walker picture. */
export const WANDER_BODY = 0.3
/** How long the walkers stand after touching an obstacle (seconds). */
export const WANDER_PAUSE = 0.9
/** How far they step back from the obstacle they touched (units). */
export const WANDER_BOUNCE = 2
/** How far they must go from that obstacle before touching it again counts again (units, beyond its edge). */
export const WANDER_REARM = 3
/** Half the width of the road (units) when the data say nothing: the way the help and the checks use. */
export const WANDER_ROAD = 12
/** A gap must be this many walker widths wide (the check of the data; the walkers only touch with a circle of 0.6 widths, so three quarters of a width leave a little room). */
export const WANDER_PASS = 0.75
/** How far an arrow key sends the walkers (units). */
export const WANDER_KEY_STEP = 6
/** How far the button "Help me" leads them (units). */
export const WANDER_HELP_LEN = 30
/** The obstacle pictures are drawn this many times as wide as their radius (a little larger than the circle, so that touching the picture's edge is no mistake). */
export const WANDER_DRAW = 2.4
/** The cells of the search for a way (units). */
const WANDER_GRID = 1.5

/** A stone or a thornbush: the picture, the middle and the radius (units), the name (for screen readers); `kind` decides the word on touching (without it: a picture with "dorn" in its name is a thornbush). */
export interface WanderObstacle {
  image: string
  x: number
  y: number
  r: number
  name: string
  kind?: 'stone' | 'thorn'
}
/** The milestone with the jug at the top (the middle and the width in percent). */
export interface WanderGoal {
  image: string
  x: number
  y: number
  w: number
  name?: string
}
export interface WanderRound {
  /** The road (3:4, painted, without stones on it). */
  background: string
  /** The middle of the road from the bottom (the start of the walkers) to the top. */
  path: Pt[]
  obstacles: WanderObstacle[]
  goal: WanderGoal
  hint: string
  /** Half the width of the road (units, `WANDER_ROAD` without it). */
  road?: number
}
export interface WanderGame {
  /** The two walkers (one picture). */
  walker: string
  /** The width of the walker picture (percent of the width). */
  walkerW: number
  /** How fast they walk (units a second, `WANDER_SPEED` without it). */
  speed?: number
  rounds: WanderRound[]
}

export interface WanderState extends Pt {
  /** 1 looks to the right, -1 to the left. */
  face: 1 | -1
  moving: boolean
  /** Seconds they still stand after touching an obstacle. */
  pause: number
  /** The obstacle they touched last (-1: none); touching it again does not count until they have gone away from it. */
  touching: number
  /** The farthest share of the road they reached (0 to 1). */
  best: number
  arrived: boolean
}
export type WanderEvent = { type: 'hit'; index: number } | { type: 'arrived' }

const wanderRoundOf = (game: WanderGame, ri: number): WanderRound => game.rounds[clamp(ri, 0, game.rounds.length - 1)]!

/** The distance on the upright road picture (units). */
export const wanderDist = (a: Pt, b: Pt): number => osterDist(a, b, WANDER_RATIO)

/** The radius of the walkers for touching (units). */
export const wanderRadius = (game: WanderGame): number => game.walkerW * WANDER_BODY

/** Whether an obstacle is a thornbush (the word on touching). */
export const wanderIsThorn = (o: WanderObstacle): boolean => (o.kind ? o.kind === 'thorn' : /dorn/i.test(o.image))

/** The first obstacle that a walker at `p` touches (-1: none). */
export function wanderHit(obstacles: readonly WanderObstacle[], p: Pt, radius: number, skip = -1): number {
  return obstacles.findIndex((o, i) => i !== skip && wanderDist(p, o) < o.r + radius)
}

/** The walkers are at the milestone. */
export function wanderAtGoal(game: WanderGame, round: WanderRound, p: Pt): boolean {
  return wanderDist(p, round.goal) <= round.goal.w * 0.5 + wanderRadius(game) * 0.5
}

/** A place kept inside the picture (the walkers stay whole on it). */
export function wanderKeep(p: Pt, radius: number): Pt {
  const mx = Math.min(radius, 49)
  const my = Math.min(radius * WANDER_RATIO, 49)
  return { x: clamp(p.x, mx, 100 - mx), y: clamp(p.y, my, 100 - my) }
}

/** The pieces of the road in units (y divided by the ratio) with their lengths. */
function pathSegments(path: readonly Pt[]) {
  const pts = path.map((p) => ({ x: p.x, y: p.y / WANDER_RATIO }))
  const segs: { a: Pt; b: Pt; len: number; from: number }[] = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    segs.push({ a, b, len, from: total })
    total += len
  }
  return { segs, total }
}

/** Where a place lies on the road: the share of the road (0 at the bottom, 1 at the top) of the nearest point and how far the place is from the road (units). */
export function wanderOnPath(path: readonly Pt[], p: Pt): { along: number; off: number } {
  const { segs, total } = pathSegments(path)
  if (!segs.length || total <= 0) return { along: 0, off: path.length ? wanderDist(p, path[0]!) : 0 }
  const q = { x: p.x, y: p.y / WANDER_RATIO }
  let best = { along: 0, off: Infinity }
  for (const s of segs) {
    const dx = s.b.x - s.a.x
    const dy = s.b.y - s.a.y
    const t = s.len > 1e-9 ? clamp(((q.x - s.a.x) * dx + (q.y - s.a.y) * dy) / (s.len * s.len), 0, 1) : 0
    const off = Math.hypot(s.a.x + dx * t - q.x, s.a.y + dy * t - q.y)
    if (off < best.off - 1e-9) best = { along: (s.from + t * s.len) / total, off }
  }
  return best
}

/** The share of the road that a place has reached (0 to 1). */
export const wanderAlong = (path: readonly Pt[], p: Pt): number => wanderOnPath(path, p).along

/** The state at the beginning of a round: the walkers at the bottom of the road. */
export function wanderStart(game: WanderGame, ri: number): WanderState {
  const r = wanderRoundOf(game, ri)
  const s = r.path[0] ?? { x: 50, y: 90 }
  return { x: s.x, y: s.y, face: 1, moving: false, pause: 0, touching: -1, best: 0, arrived: false }
}

/**
 * One step of the game (`dt` seconds): the walkers go toward `target` (the finger) at most at their speed. Touching a new obstacle is a mistake (the event "hit"): they step back
 * and stand for a moment. The obstacle they touched last stops them without a new mistake (they slide along it) until they have gone away from it. At the milestone the round is won (the event "arrived").
 */
export function wanderStep(game: WanderGame, ri: number, st: WanderState, target: Pt | null, dt: number): { state: WanderState; events: WanderEvent[] } {
  const round = wanderRoundOf(game, ri)
  const R = wanderRadius(game)
  const speed = game.speed ?? WANDER_SPEED
  const events: WanderEvent[] = []
  let { x, y, face, touching, best, arrived } = st
  let pause = Math.max(0, st.pause - dt)
  let moving = false
  if (!arrived && target && pause <= 0) {
    const from = { x, y }
    const d = wanderDist(from, target)
    if (d > 0.05) {
      const s = Math.min(speed * dt, d)
      const ux = (target.x - x) / d
      const uy = (target.y - y) / WANDER_RATIO / d
      const full = wanderKeep({ x: x + ux * s, y: y + uy * s * WANDER_RATIO }, R)
      const j = wanderHit(round.obstacles, full, R)
      let to: Pt | null = null
      if (j < 0) to = full
      else if (j !== touching) {
        events.push({ type: 'hit', index: j })
        touching = j
        pause = WANDER_PAUSE
        const o = round.obstacles[j]!
        const ox = from.x - o.x
        const oy = (from.y - o.y) / WANDER_RATIO
        const ol = Math.hypot(ox, oy)
        if (ol > 1e-6) {
          const back = wanderKeep({ x: from.x + (ox / ol) * WANDER_BOUNCE, y: from.y + (oy / ol) * WANDER_BOUNCE * WANDER_RATIO }, R)
          if (wanderHit(round.obstacles, back, R) < 0) to = back
        }
      } else {
        // the obstacle they know: slide along it, one direction after the other
        const xOnly = wanderKeep({ x: x + Math.sign(ux) * Math.min(s, Math.abs(target.x - x)), y }, R)
        const yOnly = wanderKeep({ x, y: y + Math.sign(uy) * Math.min(s * WANDER_RATIO, Math.abs(target.y - y)) }, R)
        if (Math.abs(xOnly.x - x) > 0.01 && wanderHit(round.obstacles, xOnly, R) < 0) to = xOnly
        else if (Math.abs(yOnly.y - y) > 0.01 && wanderHit(round.obstacles, yOnly, R) < 0) to = yOnly
      }
      if (to) {
        const dxm = to.x - x
        if (Math.abs(dxm) > 0.02) face = dxm < 0 ? -1 : 1
        moving = pause <= 0 && (Math.abs(to.x - x) > 1e-4 || Math.abs(to.y - y) > 1e-4)
        x = to.x
        y = to.y
      }
    }
  }
  if (touching >= 0) {
    const o = round.obstacles[touching]
    if (!o || wanderDist({ x, y }, o) > o.r + R + WANDER_REARM) touching = -1
  }
  best = Math.max(best, wanderAlong(round.path, { x, y }))
  if (!arrived && wanderAtGoal(game, round, { x, y })) {
    arrived = true
    best = 1
    events.push({ type: 'arrived' })
  }
  return { state: { x, y, face, moving, pause, touching, best, arrived }, events }
}

/** The target of an arrow key (`dx`, `dy` are -1, 0 or 1): a step of `WANDER_KEY_STEP` units, as long on the screen down as across. */
export function wanderNudge(at: Pt, dx: number, dy: number): Pt {
  return { x: clamp(at.x + dx * WANDER_KEY_STEP, 0, 100), y: clamp(at.y + dy * WANDER_KEY_STEP * WANDER_RATIO, 0, 100) }
}

/** The target of Enter: the next bend of the road ahead of the walkers (at the end the milestone). */
export function wanderBendAhead(round: WanderRound, p: Pt): Pt {
  const { segs, total } = pathSegments(round.path)
  const now = wanderAlong(round.path, p)
  if (total > 0) {
    for (let i = 1; i < round.path.length; i++) {
      const at = (segs[i - 1]!.from + segs[i - 1]!.len) / total
      if (at > now + 0.02) return { ...round.path[i]! }
    }
  }
  return { x: round.goal.x, y: round.goal.y }
}

/** A free place for a walker with `clearance` units round him: inside the picture, away from every obstacle, and (with `road`) near the road. */
function wanderFree(round: WanderRound, p: Pt, clearance: number, road: number | null): boolean {
  if (p.x < 1 || p.x > 99 || p.y < 1 || p.y > 99) return false
  if (round.obstacles.some((o) => wanderDist(p, o) <= o.r + clearance)) return false
  return road === null || wanderOnPath(round.path, p).off <= road
}

/**
 * A way from `from` to the milestone that keeps `clearance` units away from every obstacle (a search over cells of 1.5 units; with `roadOnly` it stays on the road),
 * straightened where a straight piece is free. Null when there is none. The places are percent; the first is `from`.
 */
export function wanderRoute(game: WanderGame, ri: number, from: Pt, clearance: number, roadOnly = true): Pt[] | null {
  const round = wanderRoundOf(game, ri)
  const g = WANDER_GRID
  const W = Math.ceil(100 / g)
  const H = Math.ceil(100 / WANDER_RATIO / g)
  const road = roadOnly ? (round.road ?? WANDER_ROAD) : null
  const cellPt = (i: number, j: number): Pt => ({ x: (i + 0.5) * g, y: (j + 0.5) * g * WANDER_RATIO })
  const reach = round.goal.w * 0.5 + wanderRadius(game) * 0.5
  const free = new Uint8Array(W * H)
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) free[j * W + i] = wanderFree(round, cellPt(i, j), clearance, road) ? 1 : 0
  const si = clamp(Math.floor(from.x / g), 0, W - 1)
  const sj = clamp(Math.floor(from.y / WANDER_RATIO / g), 0, H - 1)
  const prev = new Int32Array(W * H).fill(-2)
  const start = sj * W + si
  prev[start] = -1
  const queue = [start]
  let found = -1
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q]!
    const ci = c % W
    const cj = Math.floor(c / W)
    if (wanderDist(cellPt(ci, cj), round.goal) <= reach) {
      found = c
      break
    }
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue
        const ni = ci + di
        const nj = cj + dj
        if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue
        const n = nj * W + ni
        if (prev[n] !== -2 || !free[n]) continue
        // a step across a corner needs both cells beside it
        if (di && dj && (!free[cj * W + ni] || !free[nj * W + ci])) continue
        prev[n] = c
        queue.push(n)
      }
  }
  if (found < 0) return null
  const cells: Pt[] = []
  for (let c = found; c >= 0 && c !== start; c = prev[c]!) cells.push(cellPt(c % W, Math.floor(c / W)))
  cells.reverse()
  // straighten: from each point go as far as a straight free piece reaches
  const clear = (a: Pt, b: Pt) => {
    const n = Math.max(1, Math.ceil(wanderDist(a, b) / 0.5))
    for (let k = 1; k <= n; k++) {
      const t = k / n
      if (!wanderFree(round, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, clearance, null)) return false
    }
    return true
  }
  const out: Pt[] = [{ x: from.x, y: from.y }]
  let k = 0
  let cur: Pt = out[0]!
  while (k < cells.length) {
    let far = k
    for (let m = cells.length - 1; m > k; m--)
      if (clear(cur, cells[m]!)) {
        far = m
        break
      }
    cur = cells[far]!
    out.push({ x: cur.x, y: cur.y })
    k = far + 1
  }
  return out
}

/** The way of the button "Help me": a safe way to the milestone (on the road if possible), cut after `len` units. Null when there is none. */
export function wanderHelpRoute(game: WanderGame, ri: number, from: Pt, len = WANDER_HELP_LEN): Pt[] | null {
  const R = wanderRadius(game)
  const route = wanderRoute(game, ri, from, R + 0.8, true) ?? wanderRoute(game, ri, from, R + 0.8, false) ?? wanderRoute(game, ri, from, R + 0.1, false)
  if (!route) return null
  const out: Pt[] = []
  let left = len
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!
    const b = route[i]!
    const d = wanderDist(a, b)
    if (d >= left) {
      const t = d > 1e-9 ? left / d : 1
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      return out
    }
    out.push(b)
    left -= d
  }
  return out
}

/** The problems of the data of `wanderweg` (an empty list is good). */
export function wanderProblems(game: WanderGame): string[] {
  const out: string[] = []
  if (!game.walker) out.push('no picture of the walkers')
  if (game.walkerW < 6 || game.walkerW > 26) out.push('the walkers should be between 6 and 26 percent wide')
  if ((game.speed ?? WANDER_SPEED) < 6 || (game.speed ?? WANDER_SPEED) > 40) out.push('the speed should be between 6 and 40 units a second')
  if (game.rounds.length < 1) out.push('no rounds')
  const R = wanderRadius(game)
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.background) out.push(`round ${n}: no picture of the road`)
    if (r.path.length < 2) {
      out.push(`round ${n}: the road needs at least two points`)
      return
    }
    r.path.forEach((p, k) => {
      if (!inPicture(p)) out.push(`round ${n}: point ${k + 1} of the road lies outside the picture`)
    })
    if (r.path[0]!.y <= r.path[r.path.length - 1]!.y) out.push(`round ${n}: the road must lead from the bottom up`)
    if (!inPicture(r.goal)) out.push(`round ${n}: the milestone lies outside the picture`)
    if (wanderDist(r.goal, r.path[r.path.length - 1]!) > (r.road ?? WANDER_ROAD) + 5) out.push(`round ${n}: the milestone is not at the end of the road`)
    if (r.obstacles.length < 1) out.push(`round ${n}: no obstacles`)
    r.obstacles.forEach((o, k) => {
      if (!inPicture(o)) out.push(`round ${n}: obstacle ${k + 1} lies outside the picture`)
      if (o.r < 2 || o.r > 15) out.push(`round ${n}: obstacle ${k + 1} should have a radius between 2 and 15 units`)
      if (!o.image) out.push(`round ${n}: obstacle ${k + 1} has no picture`)
      if (wanderDist(o, r.goal) < o.r + r.goal.w * 0.5) out.push(`round ${n}: obstacle ${k + 1} lies on the milestone`)
    })
    if (wanderHit(r.obstacles, r.path[0]!, R + 1) >= 0) out.push(`round ${n}: the walkers start at an obstacle`)
    if (wanderAtGoal(game, r, r.path[0]!)) out.push(`round ${n}: the walkers start at the milestone`)
    // a way on the road with gaps of at least 1.5 walker widths
    if (!wanderRoute(game, i, r.path[0]!, (WANDER_PASS * game.walkerW) / 2, true)) out.push(`round ${n}: no way to the milestone with gaps of ${WANDER_PASS} walker widths on the road`)
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.obstacles.length <= game.rounds[0]!.obstacles.length) out.push('round 2 should have more obstacles than round 1')
  return out
}

// ================================================================ 2. lay the table (`tischdecken`)

/** The table picture is 4:3 (width / height). */
export const TABLE_RATIO = 4 / 3

/** A place at the table (a cushion, the middle, the basket): the middle and the radius in which a thing is taken (units). */
export interface TableSlot {
  id: string
  x: number
  y: number
  r: number
  /** For screen readers ("Platz 1" without it). */
  name?: string
}
/** A thing in the strip under the table: the picture, the name, the width on the table (percent) and the place it belongs to. Things with the same picture (or `kind`) can change places. */
export interface TableItem {
  id: string
  image: string
  name: string
  w: number
  target: string
  kind?: string
}
export interface TableRound {
  hint: string
  items: TableItem[]
}
/** A picture standing on the table picture (the middle and the width in percent). */
export interface TableSprite {
  image: string
  x: number
  y: number
  w: number
}
/** The breaking of the bread at the end: the whole loaf (a thing of the last round, `item` is its id) is replaced by two halves. */
export interface TableBread {
  item: string
  whole: string
  halves: [string, string]
}
export interface TableGame {
  /** The table from above (4:3, three cushions, empty). */
  background: string
  slots: TableSlot[]
  /** The basket beside the table (drawn on the picture at its place). */
  basket?: TableSprite
  bread: TableBread
  /** The place of the guest (the bread belongs there). */
  guestSlot: string
  rounds: TableRound[]
}

export type TableVerdict = 'ok' | 'wrong' | 'full'

/** The kind of a thing: the same kind can change places. */
export const tableKind = (it: TableItem): string => it.kind ?? it.image

/** The distance on the table picture (units). */
export const tableDist = (a: Pt, b: Pt): number => osterDist(a, b, TABLE_RATIO)

/** The place under the finger: the nearest place whose circle holds `p` (-1: none). */
export function tableSlotAt(slots: readonly TableSlot[], p: Pt): number {
  let best = -1
  let bestD = Infinity
  slots.forEach((s, i) => {
    const d = tableDist(p, s)
    if (d <= s.r && d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

/**
 * Whether thing `item` may lie on place `slotId`, with `placed[i]` the place of thing `i` of the round (null: still in the strip): it is right when a thing of the same kind belongs there
 * and there is room for one more of that kind; a place that has all its things of that kind is full.
 */
export function tableFits(round: TableRound, placed: readonly (string | null)[], item: number, slotId: string): TableVerdict {
  const it = round.items[item]
  if (!it) return 'wrong'
  const kind = tableKind(it)
  const want = round.items.filter((x) => tableKind(x) === kind && x.target === slotId).length
  if (!want) return 'wrong'
  const have = round.items.filter((x, i) => i !== item && tableKind(x) === kind && placed[i] === slotId).length
  return have < want ? 'ok' : 'full'
}

/** Every thing of the round lies on a place. */
export const tableDone = (placed: readonly (string | null)[]): boolean => placed.length > 0 && placed.every((p) => p !== null)

/** The help: the first thing in the strip and a place where it is right (its own one first). Null when everything lies. */
export function tableHelp(round: TableRound, placed: readonly (string | null)[]): { item: number; slot: string } | null {
  for (let i = 0; i < round.items.length; i++) {
    if (placed[i] !== null && placed[i] !== undefined) continue
    const it = round.items[i]!
    if (tableFits(round, placed, i, it.target) === 'ok') return { item: i, slot: it.target }
    const other = round.items.find((x) => tableKind(x) === tableKind(it) && tableFits(round, placed, i, x.target) === 'ok')
    if (other) return { item: i, slot: other.target }
  }
  return null
}

/** How many things lie on a place at the end of the game (all rounds). */
export const tableSlotTotal = (game: TableGame, slotId: string): number => game.rounds.reduce((n, r) => n + r.items.filter((it) => it.target === slotId).length, 0)

/** Where the `k`-th thing on a place lies when `n` things will lie there: side by side round the middle of the place. */
export function tableSpot(slot: TableSlot, k: number, n: number): Pt {
  if (n <= 1) return { x: slot.x, y: slot.y }
  const step = Math.min(slot.r * 0.8, 9)
  return { x: clamp(slot.x + (k - (n - 1) / 2) * step, 0, 100), y: slot.y }
}

/** The problems of the data of `tischdecken` (an empty list is good). */
export function tableProblems(game: TableGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the table')
  if (game.slots.length < 1) out.push('no places')
  const ids = new Set<string>()
  game.slots.forEach((s, k) => {
    if (ids.has(s.id)) out.push(`the place "${s.id}" is there twice`)
    ids.add(s.id)
    if (!inPicture(s)) out.push(`place ${k + 1} lies outside the picture`)
    if (s.r < 6) out.push(`place "${s.id}" is too small (at least 6 units)`)
  })
  for (let a = 0; a < game.slots.length; a++)
    for (let b = a + 1; b < game.slots.length; b++) {
      const A = game.slots[a]!
      const B = game.slots[b]!
      if (tableDist(A, B) < Math.max(A.r, B.r)) out.push(`the places "${A.id}" and "${B.id}" lie on each other`)
    }
  if (!ids.has(game.guestSlot)) out.push(`the place of the guest "${game.guestSlot}" is missing`)
  if (game.basket && !inPicture(game.basket)) out.push('the basket lies outside the picture')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.items.length) out.push(`round ${n}: no things`)
    const seen = new Set<string>()
    r.items.forEach((it) => {
      if (seen.has(it.id)) out.push(`round ${n}: the thing "${it.id}" is there twice`)
      seen.add(it.id)
      if (!ids.has(it.target)) out.push(`round ${n}: the thing "${it.id}" belongs to a place that is not there ("${it.target}")`)
      if (!it.image) out.push(`round ${n}: the thing "${it.id}" has no picture`)
      if (it.w < 4 || it.w > 30) out.push(`round ${n}: the thing "${it.id}" should be between 4 and 30 percent wide`)
    })
  })
  const last = game.rounds[game.rounds.length - 1]
  const bread = last?.items.find((it) => it.id === game.bread.item)
  if (!bread) out.push(`the bread "${game.bread.item}" is not a thing of the last round`)
  else if (bread.target !== game.guestSlot) out.push('the bread belongs to the place of the guest')
  if (!game.bread.whole || game.bread.halves.length !== 2 || !game.bread.halves[0] || !game.bread.halves[1]) out.push('the bread needs a whole loaf and two halves')
  return out
}

// ================================================================ 3. pass on the light (`lichtweg`)

/** The hill picture is 3:2 (width / height). */
export const FLAME_RATIO = 1.5
/** The people pictures are 220 x 330 (width / height) when the data say nothing. */
export const FLAME_SPRITE = 220 / 330
/** A finger that lets go this near to a lamp means that lamp (units). */
export const FLAME_PICK = 7
/** The last person must stand this near to the gate (units). */
export const FLAME_GATE = 16
/** Lamps must stand at least this far apart, so that a finger can tell them apart (units). */
export const FLAME_APART = 6

/** A person with an oil lamp: the picture, the middle of the feet and the width (percent of the picture), and the lamp in the hand (percent of the person picture). */
export interface FlamePerson {
  image: string
  x: number
  y: number
  w: number
  anchor: Pt
  name?: string
}
export interface FlameRound {
  /** The hill (3:2). */
  background: string
  hint: string
  people: FlamePerson[]
  /** The person whose lamp burns at the start. */
  start: number
  /** How far the flame reaches from a burning lamp (units). */
  reach: number
  /** The city gate (percent of the picture). */
  gate: Pt
}
export interface FlameGame {
  /** The little flame of an oil lamp. */
  flame: string
  /** Its width (percent of the picture, 3.5 without it). */
  flameW?: number
  /** Width / height of the people pictures (`FLAME_SPRITE` without it). */
  spriteRatio?: number
  rounds: FlameRound[]
}

export type FlameVerdict = 'ok' | 'far' | 'lit' | 'dark' | 'same'

/** The distance on the hill picture (units). */
export const flameDist = (a: Pt, b: Pt): number => osterDist(a, b, FLAME_RATIO)

/** Where the lamp of a person is (percent of the picture): the anchor in the person picture, which stands on its feet at `x`, `y`. */
export function flameLamp(p: FlamePerson, spriteRatio = FLAME_SPRITE): Pt {
  const h = (p.w / spriteRatio) * FLAME_RATIO
  return { x: p.x + (p.anchor.x / 100 - 0.5) * p.w, y: p.y - (1 - p.anchor.y / 100) * h }
}

/** The lamps of a round. */
export const flameLamps = (game: FlameGame, round: FlameRound): Pt[] => round.people.map((p) => flameLamp(p, game.spriteRatio ?? FLAME_SPRITE))

/** The lamp under the finger: the nearest one within `pick` units (-1: none); `skip` is left out. */
export function flameLampAt(lamps: readonly Pt[], p: Pt, pick = FLAME_PICK, skip = -1): number {
  let best = -1
  let bestD = Infinity
  lamps.forEach((l, i) => {
    if (i === skip) return
    const d = flameDist(p, l)
    if (d <= pick && d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

/** The lights at the start of a round: only the first lamp burns. */
export const flameStart = (round: FlameRound): boolean[] => round.people.map((_, i) => i === round.start)

/** Whether the flame may go from lamp `from` to lamp `to`: `from` must burn, `to` must be dark and within reach. */
export function flameTry(game: FlameGame, round: FlameRound, lit: readonly boolean[], from: number, to: number): FlameVerdict {
  if (from === to) return 'same'
  if (!lit[from]) return 'dark'
  if (lit[to]) return 'lit'
  const lamps = flameLamps(game, round)
  const a = lamps[from]
  const b = lamps[to]
  if (!a || !b) return 'far'
  return flameDist(a, b) <= round.reach + 1e-9 ? 'ok' : 'far'
}

/** All lamps burn. */
export const flameAllLit = (lit: readonly boolean[]): boolean => lit.length > 0 && lit.every(Boolean)

/** Which lamps can be lit from the first one, lamp by lamp within reach. */
export function flameReachable(game: FlameGame, round: FlameRound): boolean[] {
  const lamps = flameLamps(game, round)
  const seen = lamps.map(() => false)
  if (round.start < 0 || round.start >= lamps.length) return seen
  seen[round.start] = true
  const queue = [round.start]
  for (let q = 0; q < queue.length; q++) {
    const a = lamps[queue[q]!]!
    lamps.forEach((b, j) => {
      if (!seen[j] && flameDist(a, b) <= round.reach + 1e-9) {
        seen[j] = true
        queue.push(j)
      }
    })
  }
  return seen
}

/** The help: a burning lamp and the nearest dark lamp in its reach. Null when there is none. */
export function flameHelp(game: FlameGame, round: FlameRound, lit: readonly boolean[]): { from: number; to: number } | null {
  const lamps = flameLamps(game, round)
  let best: { from: number; to: number } | null = null
  let bestD = Infinity
  lamps.forEach((a, i) => {
    if (!lit[i]) return
    lamps.forEach((b, j) => {
      if (lit[j]) return
      const d = flameDist(a, b)
      if (d <= round.reach + 1e-9 && d < bestD) {
        bestD = d
        best = { from: i, to: j }
      }
    })
  })
  return best
}

/** The person nearest to the gate (the last one on the way). */
export function flameLast(round: FlameRound): number {
  let best = -1
  let bestD = Infinity
  round.people.forEach((p, i) => {
    const d = flameDist(p, round.gate)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** The problems of the data of `lichtweg` (an empty list is good). */
export function flameProblems(game: FlameGame): string[] {
  const out: string[] = []
  if (!game.flame) out.push('no picture of the flame')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.background) out.push(`round ${n}: no picture of the hill`)
    if (r.people.length < 2) {
      out.push(`round ${n}: at least two people`)
      return
    }
    if (r.start < 0 || r.start >= r.people.length) out.push(`round ${n}: the first lamp is not one of the people`)
    if (r.reach < 8 || r.reach > 45) out.push(`round ${n}: the reach should be between 8 and 45 units`)
    if (!inPicture(r.gate)) out.push(`round ${n}: the gate lies outside the picture`)
    const lamps = flameLamps(game, r)
    r.people.forEach((p, k) => {
      if (!inPicture(p)) out.push(`round ${n}: person ${k + 1} stands outside the picture`)
      if (p.anchor.x < 0 || p.anchor.x > 100 || p.anchor.y < 0 || p.anchor.y > 100) out.push(`round ${n}: the lamp of person ${k + 1} is not in the picture of the person`)
      if (!inPicture(lamps[k]!)) out.push(`round ${n}: the lamp of person ${k + 1} lies outside the picture`)
      if (!p.image) out.push(`round ${n}: person ${k + 1} has no picture`)
    })
    for (let a = 0; a < lamps.length; a++)
      for (let b = a + 1; b < lamps.length; b++)
        if (flameDist(lamps[a]!, lamps[b]!) < FLAME_APART) out.push(`round ${n}: the lamps of person ${a + 1} and ${b + 1} are too near together`)
    if (r.start >= 0 && r.start < r.people.length) {
      const seen = flameReachable(game, r)
      seen.forEach((s, k) => {
        if (!s) out.push(`round ${n}: the lamp of person ${k + 1} cannot be reached`)
      })
    }
    const last = flameLast(r)
    if (last < 0 || flameDist(r.people[last]!, r.gate) > FLAME_GATE) out.push(`round ${n}: nobody stands near the gate`)
    if (last === r.start) out.push(`round ${n}: the first lamp stands at the gate`)
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.people.length <= game.rounds[0]!.people.length) out.push('round 2 should have more people than round 1')
  return out
}
