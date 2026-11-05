/**
 * The pure parts of the two new games of "Ostern" (the components only draw and listen):
 * "The net on the right" (`fischzug`, John 21,6: aim the net at the fish shadows and let go) and
 * "Lead the lambs" (`weiden`, John 21,15-17: the shepherd walks first, the animals follow him into the pen).
 * All places are percent of the picture (3:2): x is a part of the width, y a part of the height. Distances are measured in "units" (percent of the
 * width), so that a circle is round on the screen: `osterDist` divides the vertical difference by the ratio of the picture. The arithmetic has no clock and no dice of its own
 * (a number generator is handed in).
 */
import { mistakeStars } from '@/utils/adventureScore'
import type { FischzugGame, FischzugRound, GrazeGame, GrazeRound, OsterBox } from '@/types/adventure'

/** The pictures of both games are 3:2 (width / height). */
export const OSTER_RATIO = 1.5

export interface Pt {
  x: number
  y: number
}

/**
 * Stars at the end of both games: up to two mistakes three stars, up to four two stars, then one (Anton: `mistakeStars(mistakes, 2, 4)`).
 * `fischzug`: a cast without a catch is a mistake; `weiden`: an animal that walks into a thornbush is a mistake.
 */
export function osterStars(mistakes: number): number {
  return mistakeStars(Math.max(0, mistakes), 2, 4)
}

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture. */
export function osterDist(a: Pt, b: Pt, ratio = OSTER_RATIO): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

/** A point lies inside a rectangle (with a margin around it); the rectangles are those of the browser (`getBoundingClientRect`). */
export function osterPointIn(rect: { left: number; top: number; right: number; bottom: number }, x: number, y: number, pad = 0): boolean {
  return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad
}

/** A point lies inside a box of the picture. */
export const osterInBox = (box: OsterBox, p: Pt): boolean => p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** A place kept inside the picture. */
export const osterClamp = (p: Pt): Pt => ({ x: clamp(p.x, 0, 100), y: clamp(p.y, 0, 100) })

// ================================================================ 1. the net on the right (`fischzug`)

/** How long the net flies, how long it takes to sink and when it is back (milliseconds); the fish stand still meanwhile (what the child aimed at is what the net meets). */
export const FISCH_FLY_MS = 450
export const FISCH_SINK_MS = 350
export const FISCH_BACK_MS = 700
/** How fast a swarm swims when the data say nothing (units a second), and how loosely it swims (units; the radius of the swarm). */
export const FISCH_SPEED = 3.5
export const FISCH_SPREAD = 9
/** How far the aim moves with one press of an arrow key (units). */
export const FISCH_KEY_STEP = 3

/** A swarm: the middle (percent), the speed (units a second), the time until it turns, and how far its fish reach from the middle (units). */
export interface FischSchool {
  x: number
  y: number
  vx: number
  vy: number
  turn: number
  reach: number
}
/** A fish shadow: the swarm it belongs to, its place in the swarm (units to the right, percent of the height down), a phase for the little swaying and the shape (index into the pictures). */
export interface FischShadow {
  school: number
  ox: number
  oy: number
  phase: number
  kind: number
}
export interface FischPond {
  time: number
  schools: FischSchool[]
  fish: FischShadow[]
}

/**
 * The start of a round: `fish` shadows in `schools` swarms (the fish are dealt round by round to the swarms), the swarms spread over the area from left to right, every swarm swims to the left or to the right.
 * `kinds` is the number of fish shapes, `speed` the speed of a swarm (units a second); `rand` gives numbers from 0 to 1.
 */
export function fischzugStart(round: Pick<FischzugRound, 'fish' | 'schools' | 'spread'>, area: OsterBox, kinds: number, speed: number, rand: () => number): FischPond {
  const schoolsN = Math.max(1, Math.min(round.schools ?? 1, Math.max(1, round.fish)))
  const spread = round.spread ?? FISCH_SPREAD
  const reach = spread + 1.5
  const w = area.right - area.left
  const h = area.bottom - area.top
  const mx = Math.min(reach, w / 2 - 0.01)
  const my = Math.min(reach * OSTER_RATIO, h / 2 - 0.01)
  const schools: FischSchool[] = []
  for (let s = 0; s < schoolsN; s++) {
    const slot = (s + 0.5) / schoolsN
    const x = clamp(area.left + w * slot + (rand() - 0.5) * (w / schoolsN) * 0.3, area.left + mx, area.right - mx)
    const y = clamp(area.top + h * (0.3 + 0.4 * rand()), area.top + my, area.bottom - my)
    const dir = (s + (rand() < 0.5 ? 0 : 1)) % 2 === 0 ? 1 : -1
    schools.push({ x, y, vx: dir * speed * (0.85 + rand() * 0.3), vy: (rand() - 0.5) * speed * 0.4, turn: 4 + rand() * 5, reach })
  }
  const count: number[] = schools.map(() => 0)
  const total: number[] = schools.map((_, s) => Math.ceil((round.fish - s) / schoolsN))
  const fish: FischShadow[] = []
  for (let i = 0; i < round.fish; i++) {
    const s = i % schoolsN
    const j = count[s]!
    count[s] = j + 1
    const angle = j * 2.399963
    const r = spread * Math.sqrt((j + 0.5) / Math.max(1, total[s]!))
    fish.push({ school: s, ox: Math.cos(angle) * r, oy: Math.sin(angle) * r * OSTER_RATIO, phase: rand() * Math.PI * 2, kind: kinds > 0 ? i % kinds : 0 })
  }
  return { time: 0, schools, fish }
}

/** One step of the swimming: every swarm swims on, turns now and then (mostly to the left or to the right) and swims back at the edge of the area. */
export function fischzugStep(pond: FischPond, dt: number, area: OsterBox, rand: () => number): FischPond {
  const schools = pond.schools.map((s) => {
    let { x, y, vx, vy, turn } = s
    turn -= dt
    if (turn <= 0) {
      const speed = Math.hypot(vx, vy) || FISCH_SPEED
      const angle = (rand() - 0.5) * 0.9 + (rand() < 0.5 ? 0 : Math.PI)
      vx = Math.cos(angle) * speed
      vy = Math.sin(angle) * speed * 0.6
      turn = 4 + rand() * 5
    }
    x += vx * dt
    y += vy * dt * OSTER_RATIO
    const mx = Math.min(s.reach, (area.right - area.left) / 2 - 0.01)
    const my = Math.min(s.reach * OSTER_RATIO, (area.bottom - area.top) / 2 - 0.01)
    if (x < area.left + mx) {
      x = area.left + mx
      vx = Math.abs(vx)
    } else if (x > area.right - mx) {
      x = area.right - mx
      vx = -Math.abs(vx)
    }
    if (y < area.top + my) {
      y = area.top + my
      vy = Math.abs(vy)
    } else if (y > area.bottom - my) {
      y = area.bottom - my
      vy = -Math.abs(vy)
    }
    return { ...s, x, y, vx, vy, turn }
  })
  return { time: pond.time + dt, schools, fish: pond.fish }
}

/** Where fish `i` swims now (the middle of the shadow, percent): the swarm's middle, its place in the swarm and a little swaying. */
export function fischzugPos(pond: FischPond, i: number): Pt {
  const f = pond.fish[i]!
  const s = pond.schools[f.school]!
  return {
    x: s.x + f.ox + Math.sin(pond.time * 0.8 + f.phase) * 1.0,
    y: s.y + f.oy + Math.cos(pond.time * 0.6 + f.phase) * 1.0 * OSTER_RATIO
  }
}

/** Which way fish `i` looks: 1 to the right, -1 to the left (the way its swarm swims). */
export const fischzugDir = (pond: FischPond, i: number): 1 | -1 => ((pond.schools[pond.fish[i]!.school]?.vx ?? 1) < 0 ? -1 : 1)

/** The radius of the circle of the net in units (the net picture is as wide as the circle). */
export const fischzugRadius = (netWidth: number): number => netWidth / 2

/** The fish that the net takes in: those that are not caught yet and whose middle lies in the circle (a circle on the screen, `radius` in units). */
export function fischzugCatch(pos: readonly Pt[], taken: readonly boolean[], at: Pt, radius: number): number[] {
  const out: number[] = []
  pos.forEach((p, i) => {
    if (!taken[i] && osterDist(p, at) <= radius + 1e-9) out.push(i)
  })
  return out
}

/** The best place for a cast (for the button "Cast for me"): the middle of a free fish around which the circle takes in the most fish; none when no fish is left. */
export function fischzugBestSpot(pos: readonly Pt[], taken: readonly boolean[], radius: number): Pt | null {
  let best: Pt | null = null
  let most = 0
  pos.forEach((p, i) => {
    if (taken[i]) return
    const n = fischzugCatch(pos, taken, p, radius).length
    if (n > most) {
      most = n
      best = { x: p.x, y: p.y }
    }
  })
  return best
}

export type FischzugVerdict = 'going' | 'won' | 'lost'
/** The state of a round after a cast: enough fish (or all of them) is won, no cast left without enough fish is lost (the fish move on, the round begins again), otherwise it goes on. */
export function fischzugVerdict(caught: number, goal: number, fishTotal: number, throwsLeft: number): FischzugVerdict {
  if (caught >= Math.min(goal, fishTotal)) return 'won'
  if (throwsLeft <= 0) return 'lost'
  return 'going'
}

/** The aim moved by an arrow key (`dx`, `dy` are -1, 0 or 1); a circle is round on the screen, so a step down is `ratio` times as many percent of the height. */
export function fischzugNudge(at: Pt, dx: number, dy: number): Pt {
  return osterClamp({ x: at.x + dx * FISCH_KEY_STEP, y: at.y + dy * FISCH_KEY_STEP * OSTER_RATIO })
}

/** The problems of the data of `fischzug` (an empty list is good). */
export function fischzugProblems(game: FischzugGame): string[] {
  const out: string[] = []
  const a = game.area
  if (a.left < 0 || a.top < 0 || a.right > 100 || a.bottom > 100 || a.right <= a.left || a.bottom <= a.top) out.push('the swimming area lies outside the picture')
  if (game.net.w < 14 || game.net.w > 40) out.push('the net should be between 14 and 40 percent wide')
  if (game.fish.length < 1) out.push('no fish pictures')
  if (game.boat.x < 0 || game.boat.x > 100 || game.boat.y < 0 || game.boat.y > 100) out.push('the boat lies outside the picture')
  if (game.basket.x < 0 || game.basket.x > 100 || game.basket.y < 0 || game.basket.y > 100) out.push('the basket lies outside the picture')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const schools = r.schools ?? 1
    if (r.fish < 1) out.push(`round ${n}: no fish`)
    if (schools < 1 || schools > r.fish) out.push(`round ${n}: the swarms do not fit the fish`)
    if (r.throws < 1) out.push(`round ${n}: no casts`)
    if (r.goal < 1 || r.goal > r.fish) out.push(`round ${n}: the goal must lie between one and the number of fish`)
    const spread = r.spread ?? FISCH_SPREAD
    if ((a.right - a.left) < (spread + 1.5) * 2 * schools * 0.6) out.push(`round ${n}: the swimming area is too narrow for the swarms`)
    if ((a.bottom - a.top) < (spread + 1.5) * OSTER_RATIO * 2 * 0.8) out.push(`round ${n}: the swimming area is too low for the swarms`)
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.fish <= game.rounds[0]!.fish) out.push('round 2 should have more fish than round 1')
  return out
}

// ================================================================ 2. lead the lambs (`weiden`)

/** How near the shepherd must be for an animal to join (units), how far apart the animals walk in the line (units) and how far behind an animal may fall before it is left behind (units). */
export const GRAZE_JOIN = 14
export const GRAZE_GAP = 5
export const GRAZE_LOSE = 34
/** The speeds when the data say nothing (units a second): the shepherd, a lamb. A sheep is slower (the data name it). */
export const GRAZE_SPEED = 22
export const GRAZE_LAMB = 26
/** The thornbush stops an animal that comes nearer to its foot than this share of the bush's width. */
export const GRAZE_THORN = 0.4
/** How long a bleating animal stands before the shepherd can call it again (seconds). */
export const GRAZE_WAIT = 1.0
/** How long the trail of the shepherd is kept (units of path). */
const TRAIL_MAX = 48

export type GrazeMode = 'idle' | 'follow' | 'stuck' | 'penned'
export interface GrazeAnimal extends Pt {
  kind: string
  mode: GrazeMode
  /** 1 looks to the right, -1 to the left. */
  face: 1 | -1
  moving: boolean
  /** An animal that stood in a thornbush has learned to walk round the thorns. */
  careful: boolean
  /** Seconds until a bleating animal can be called again. */
  wait: number
}
export interface GrazeShepherd extends Pt {
  face: 1 | -1
  moving: boolean
}
export interface GrazeState {
  hirte: GrazeShepherd
  /** The way the shepherd walked (the animals follow it), the oldest place first. */
  trail: Pt[]
  animals: GrazeAnimal[]
  /** The animals that follow him, in the order in which they joined (indices into `animals`). */
  order: number[]
}
export type GrazeEvent =
  | { type: 'join'; index: number; recalled: boolean }
  | { type: 'stuck'; index: number; thorn: number }
  | { type: 'penned'; index: number }
  | { type: 'lost'; index: number }
  | { type: 'blocked'; index: number }

const roundOf = (game: GrazeGame, ri: number): GrazeRound => game.rounds[Math.min(Math.max(0, ri), game.rounds.length - 1)]!
const kindOf = (game: GrazeGame, id: string) => game.kinds.find((k) => k.id === id)

/** Whether the water of the round's brook is there (and so the bridge). */
export const grazeHasStream = (game: GrazeGame, ri: number): boolean => roundOf(game, ri).stream === true

/** A place in the water of the brook: inside the band and off the lane of the bridge. */
export function grazeWet(game: GrazeGame, ri: number, p: Pt): boolean {
  if (!grazeHasStream(game, ri)) return false
  const s = game.stream
  if (!(p.x > s.from && p.x < s.to)) return false
  return !(p.y >= s.top && p.y <= s.bottom)
}

/** The middle of the lane of the bridge (percent of the height). */
export const grazeLaneMid = (game: GrazeGame): number => (game.stream.top + game.stream.bottom) / 2

/** A place in the pen (the inside, where the animals stand). */
export const grazeInPen = (game: GrazeGame, p: Pt): boolean => osterInBox(game.pen.area, p)

/** Where animal `i` of `n` stands in the pen: in two columns, row after row, always inside. */
export function grazePenSlot(game: GrazeGame, i: number, n: number): Pt {
  const b = game.pen.area
  const cols = Math.min(2, Math.max(1, n))
  const rows = Math.max(1, Math.ceil(n / cols))
  const c = i % cols
  const r = Math.floor(i / cols)
  const x = b.left + ((c + 0.5) / cols) * (b.right - b.left)
  const y = b.top + ((r + 1) / rows) * (b.bottom - b.top) - 0.4
  return { x, y: clamp(y, b.top, b.bottom) }
}

/** The start places of the animals of a round: the data name them, otherwise they wait in a loose arc in front of the shepherd (never in the pen, the brook or a thornbush). */
export function grazeStarts(game: GrazeGame, ri: number): Pt[] {
  const r = roundOf(game, ri)
  if (r.starts && r.starts.length >= r.animals.length) return r.animals.map((_, i) => ({ x: r.starts![i]!.x, y: r.starts![i]!.y }))
  const n = r.animals.length
  return r.animals.map((_, i) => ({ x: clamp(game.hirte.x + 14 + (i % 2) * 6 + i * 3, 4, 96), y: clamp(game.hirte.y + (i - (n - 1) / 2) * 5, 20, 96) }))
}

/** The state at the beginning of a round: the shepherd at his place, the animals waiting. */
export function grazeStart(game: GrazeGame, ri: number): GrazeState {
  const r = roundOf(game, ri)
  const starts = grazeStarts(game, ri)
  return {
    hirte: { x: game.hirte.x, y: game.hirte.y, face: 1, moving: false },
    trail: [{ x: game.hirte.x, y: game.hirte.y }],
    animals: r.animals.map((kind, i) => ({ kind, x: starts[i]!.x, y: starts[i]!.y, mode: 'idle' as GrazeMode, face: 1 as const, moving: false, careful: false, wait: 0 })),
    order: []
  }
}

/** All animals of the round stand in the pen. */
export const grazeDone = (st: GrazeState): boolean => st.animals.length > 0 && st.animals.every((a) => a.mode === 'penned')

/** How many animals stand in the pen. */
export const grazePennedCount = (st: GrazeState): number => st.animals.filter((a) => a.mode === 'penned').length

/** How fast animal `a` walks. */
export function grazeSpeedOf(game: GrazeGame, kind: string): number {
  return kindOf(game, kind)?.speed ?? GRAZE_LAMB
}

/**
 * The place on the way of the shepherd that lies `back` units behind him (counted along the way he walked). When the way is not that long yet, the places lie in a line behind his
 * oldest place, to the side he does not face.
 */
export function grazeTrailPoint(trail: readonly Pt[], head: Pt, back: number, face: 1 | -1 = 1): Pt {
  let remaining = back
  let prev = head
  for (let i = trail.length - 1; i >= 0; i--) {
    const p = trail[i]!
    const seg = osterDist(prev, p)
    if (seg > 1e-9 && seg >= remaining) {
      const t = remaining / seg
      return { x: prev.x + (p.x - prev.x) * t, y: prev.y + (p.y - prev.y) * t }
    }
    remaining -= seg
    prev = p
  }
  return { x: clamp(prev.x - face * remaining, 1, 99), y: prev.y }
}

/** A step of walking from a place toward another one, `step` units long at most; a place in the water is not entered, the walker slides along the bank (one axis after the other). */
export function grazeMove(from: Pt, to: Pt, step: number, blocked: (p: Pt) => boolean): { x: number; y: number; moved: boolean; blocked: boolean } {
  const d = osterDist(from, to)
  if (d < 0.05 || step <= 0) return { x: from.x, y: from.y, moved: false, blocked: false }
  const s = Math.min(step, d)
  const dxU = (to.x - from.x) / d
  const dyU = ((to.y - from.y) / OSTER_RATIO) / d
  const full = { x: from.x + dxU * s, y: from.y + dyU * s * OSTER_RATIO }
  if (!blocked(full)) return { ...full, moved: true, blocked: false }
  const xOnly = { x: from.x + Math.sign(to.x - from.x) * Math.min(s, Math.abs(to.x - from.x)), y: from.y }
  if (Math.abs(xOnly.x - from.x) > 0.01 && !blocked(xOnly)) return { ...xOnly, moved: true, blocked: false }
  const yOnly = { x: from.x, y: from.y + Math.sign(to.y - from.y) * Math.min(s * OSTER_RATIO, Math.abs(to.y - from.y)) }
  if (Math.abs(yOnly.y - from.y) > 0.01 && !blocked(yOnly)) return { ...yOnly, moved: true, blocked: false }
  return { x: from.x, y: from.y, moved: false, blocked: true }
}

/**
 * The place to walk to first. With the brook in the round and the goal on the other bank, an animal walks to the bridge, over it, and on; on the bridge it keeps to the lane. Without a brook,
 * or on the same bank, the goal itself.
 */
export function grazeRoute(game: GrazeGame, ri: number, from: Pt, goal: Pt): Pt {
  if (!grazeHasStream(game, ri)) return goal
  const s = game.stream
  const mid = (s.from + s.to) / 2
  const lane = grazeLaneMid(game)
  const inBand = (p: Pt) => p.x > s.from && p.x < s.to
  const side = (p: Pt) => (p.x < mid ? -1 : 1)
  if (inBand(goal)) return goal
  if (inBand(from)) return { x: side(goal) < 0 ? s.from - 0.8 : s.to + 0.8, y: clamp(from.y, s.top, s.bottom) }
  if (side(from) === side(goal)) return goal
  const entryX = side(from) < 0 ? s.from - 0.8 : s.to + 0.8
  const exitX = side(from) < 0 ? s.to + 0.8 : s.from - 0.8
  const atEntry = Math.abs(from.x - entryX) < 1.6 && from.y >= s.top - 1 && from.y <= s.bottom + 1
  return atEntry ? { x: exitX, y: lane } : { x: entryX, y: lane }
}

/**
 * A walk round the thornbushes: when the straight way from `from` to `goal` comes nearer to a bush than `r` units, the first goal is a place beside the bush (1.4 `r` from its foot) on the side of the way.
 * Several bushes: the nearest one on the way counts. Without a bush on the way the goal itself.
 */
export function grazeAround(from: Pt, goal: Pt, bushes: readonly Pt[], r: number): Pt {
  const a = { x: from.x, y: from.y / OSTER_RATIO }
  const b = { x: goal.x, y: goal.y / OSTER_RATIO }
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  let best: { t: number; c: Pt; q: { x: number; y: number } } | null = null
  for (const c of bushes) {
    const cu = { x: c.x, y: c.y / OSTER_RATIO }
    const t = len2 < 1e-9 ? 0 : clamp(((cu.x - a.x) * dx + (cu.y - a.y) * dy) / len2, 0, 1)
    const q = { x: a.x + dx * t, y: a.y + dy * t }
    if (Math.hypot(q.x - cu.x, q.y - cu.y) < r * 1.05 && (!best || t < best.t)) best = { t, c, q }
  }
  if (!best) return goal
  const cu = { x: best.c.x, y: best.c.y / OSTER_RATIO }
  let nx = best.q.x - cu.x
  let ny = best.q.y - cu.y
  let nl = Math.hypot(nx, ny)
  if (nl < 1e-6) {
    // straight through the middle: go round on the left of the way
    const l = Math.sqrt(len2) || 1
    nx = -dy / l
    ny = dx / l
    nl = 1
  }
  const side = { x: cu.x + (nx / nl) * r * 1.4, y: cu.y + (ny / nl) * r * 1.4 }
  return { x: clamp(side.x, 1, 99), y: clamp(side.y * OSTER_RATIO, 1, 99) }
}

/** The radius of a thornbush (units): the animals stop when their feet come nearer to the foot of the bush than this. */
export const grazeThornRadius = (game: GrazeGame): number => game.thorn.w * GRAZE_THORN

/**
 * One step of the game (`dt` seconds): the shepherd walks toward `target` (or stands), animals near him join, the followers walk after him, an animal that walks into a thornbush stops (a mistake), animals
 * that reach the pen stay there, and when the shepherd stands in the pen the followers walk to their places in it. An animal that falls too far behind is left (no mistake). Returns the new state and what happened.
 */
export function grazeStep(game: GrazeGame, ri: number, st: GrazeState, target: Pt | null, dt: number): { state: GrazeState; events: GrazeEvent[] } {
  const round = roundOf(game, ri)
  const events: GrazeEvent[] = []
  const wet = (p: Pt) => grazeWet(game, ri, p)
  const speedH = game.speed ?? GRAZE_SPEED

  // the shepherd
  let hirte: GrazeShepherd = { ...st.hirte, moving: false }
  if (target) {
    const mv = grazeMove(hirte, target, speedH * dt, wet)
    if (mv.moved) {
      const dxm = mv.x - hirte.x
      hirte = { x: mv.x, y: mv.y, face: Math.abs(dxm) > 0.02 ? (dxm < 0 ? -1 : 1) : hirte.face, moving: true }
    }
  }
  let trail = st.trail.slice()
  const last = trail[trail.length - 1]
  if (!last || osterDist(last, hirte) >= 0.6) trail.push({ x: hirte.x, y: hirte.y })
  let len = 0
  for (let i = trail.length - 1; i > 0; i--) {
    len += osterDist(trail[i]!, trail[i - 1]!)
    if (len > TRAIL_MAX) {
      trail = trail.slice(i)
      break
    }
  }
  const inPen = grazeInPen(game, hirte)

  // the animals
  const animals = st.animals.map((a) => ({ ...a, moving: false, wait: Math.max(0, a.wait - dt) }))
  let order = st.order.slice()
  animals.forEach((a, i) => {
    if ((a.mode === 'idle' || a.mode === 'stuck') && a.wait <= 0 && osterDist(a, hirte) <= GRAZE_JOIN) {
      events.push({ type: 'join', index: i, recalled: a.mode === 'stuck' })
      a.mode = 'follow'
      order.push(i)
    }
  })
  const bushes = round.thorns
  const r = grazeThornRadius(game)
  for (const [k, i] of order.slice().entries()) {
    const a = animals[i]!
    if (a.mode !== 'follow') continue
    if (!inPen && osterDist(a, hirte) > GRAZE_LOSE) {
      a.mode = 'idle'
      events.push({ type: 'lost', index: i })
      continue
    }
    const slot = inPen ? grazePenSlot(game, i, animals.length) : grazeTrailPoint(trail, hirte, (k + 1) * GRAZE_GAP, hirte.face)
    let goal = grazeRoute(game, ri, a, slot)
    if (a.careful) goal = grazeAround(a, goal, bushes, r)
    const prev = { x: a.x, y: a.y }
    const mv = grazeMove(a, goal, grazeSpeedOf(game, a.kind) * dt, wet)
    if (mv.moved) {
      const dxm = mv.x - a.x
      a.x = mv.x
      a.y = mv.y
      a.moving = true
      if (Math.abs(dxm) > 0.02) a.face = dxm < 0 ? -1 : 1
    } else if (mv.blocked) {
      events.push({ type: 'blocked', index: i })
    }
    if (!a.careful) {
      const j = bushes.findIndex((b) => osterDist(a, b) < r && osterDist(prev, b) >= r)
      if (j >= 0) {
        a.x = prev.x
        a.y = prev.y
        a.mode = 'stuck'
        a.careful = true
        a.wait = GRAZE_WAIT
        a.moving = false
        events.push({ type: 'stuck', index: i, thorn: j })
        continue
      }
    }
    if (grazeInPen(game, a)) {
      const spot = grazePenSlot(game, i, animals.length)
      a.x = spot.x
      a.y = spot.y
      a.mode = 'penned'
      a.moving = false
      events.push({ type: 'penned', index: i })
    }
  }
  order = order.filter((i) => animals[i]!.mode === 'follow')
  return { state: { hirte, trail, animals, order }, events }
}

/** Where the button "Help me" sends the shepherd: to the nearest animal that does not follow him (or stands bleating); when all of them follow, to the pen. */
export function grazeHelpTarget(game: GrazeGame, st: GrazeState): Pt {
  let best: Pt | null = null
  let bestD = Infinity
  for (const a of st.animals) {
    if (a.mode !== 'idle' && a.mode !== 'stuck') continue
    const d = osterDist(a, st.hirte)
    if (d < bestD) {
      bestD = d
      best = { x: a.x, y: a.y }
    }
  }
  if (best) return best
  const b = game.pen.area
  return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 }
}

/** The shepherd walked by an arrow key (`dx`, `dy` are -1, 0 or 1): a step of 6 units, and 6 units down are `ratio` times as many percent of the height. */
export function grazeNudge(at: Pt, dx: number, dy: number): Pt {
  return osterClamp({ x: at.x + dx * 6, y: at.y + dy * 6 * OSTER_RATIO })
}

/** The problems of the data of `graze` (an empty list is good). */
export function grazeProblems(game: GrazeGame): string[] {
  const out: string[] = []
  const b = game.pen.area
  if (b.left < 0 || b.top < 0 || b.right > 100 || b.bottom > 100 || b.right <= b.left || b.bottom <= b.top) out.push('the inside of the pen lies outside the picture')
  if (b.right - b.left < 10) out.push('the pen is too narrow for the animals')
  const s = game.stream
  if (s.from < 0 || s.to > 100 || s.to <= s.from) out.push('the brook lies outside the picture')
  if (s.bottom - s.top < 8) out.push('the lane of the bridge is too narrow (at least 8 percent of the height)')
  if (s.bottom - s.top > 30) out.push('the lane of the bridge is too wide (at most 30 percent of the height)')
  if (s.top < 0 || s.bottom > 100) out.push('the lane of the bridge lies outside the picture')
  if (game.hirte.x < 0 || game.hirte.x > 100 || game.hirte.y < 0 || game.hirte.y > 100) out.push('the shepherd starts outside the picture')
  if (game.rounds.length < 1) out.push('no rounds')
  if (game.kinds.length < 1) out.push('no animal pictures')
  const rad = grazeThornRadius(game)
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.animals.length) out.push(`round ${n}: no animals`)
    for (const id of r.animals) if (!kindOf(game, id)) out.push(`round ${n}: the animal "${id}" has no picture`)
    if (r.starts && r.starts.length < r.animals.length) out.push(`round ${n}: not every animal has a start place`)
    const starts = grazeStarts(game, i)
    starts.forEach((p, k) => {
      if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) out.push(`round ${n}: animal ${k + 1} starts outside the picture`)
      if (grazeInPen(game, p)) out.push(`round ${n}: animal ${k + 1} starts in the pen`)
      if (grazeWet(game, i, p)) out.push(`round ${n}: animal ${k + 1} starts in the water`)
      if (r.thorns.some((t) => osterDist(p, t) < rad * 1.6)) out.push(`round ${n}: animal ${k + 1} starts in a thornbush`)
    })
    if (grazeWet(game, i, game.hirte)) out.push(`round ${n}: the shepherd starts in the water`)
    r.thorns.forEach((t, k) => {
      if (t.x < 0 || t.x > 100 || t.y < 0 || t.y > 100) out.push(`round ${n}: thornbush ${k + 1} lies outside the picture`)
      if (grazeInPen(game, t)) out.push(`round ${n}: thornbush ${k + 1} stands in the pen`)
      if (r.stream && t.x > s.from - rad && t.x < s.to + rad && t.y >= s.top - 6 && t.y <= s.bottom + 6) out.push(`round ${n}: thornbush ${k + 1} stands at the bridge`)
    })
  })
  if (!game.meadow) out.push('no picture of the meadow')
  return out
}
