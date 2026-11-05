/**
 * The pure parts of the three new games of "Jesus heilt" (5.11.2026, Anton's plan "A"; the components only show and listen):
 * 1. "The synagogue" (`synagoge`, field `synagogue`, Luke 7,5): the columns, the beams and the roof of the synagogue that the captain built are set on the building site, in the order of building.
 * 2. "Ten on the way" (`zehn`, field `ten`, Luke 17,14): one finger leads all ten men at once to the house of the priests; whoever is left far behind stops and must be fetched.
 * 3. "To Jesus" (`kinder`, field `children`, Mark 10,13-16): the children come to Jesus one after another, the smallest first (the little ones on the arm).
 * All places are percent of the picture: x a part of the width, y a part of the height. Distances are "units" (percent of the width): the vertical difference is divided by the ratio of the picture.
 * The arithmetic has no clock and no dice.
 */
import { mistakeStars } from '@/utils/adventureScore'

export interface Pt {
  x: number
  y: number
}

/** Stars at the end of every game: up to two mistakes three stars, up to four two stars, then one (the same as `osterStars`). */
export const heilungStars = (mistakes: number): number => mistakeStars(Math.max(0, mistakes), 2, 4)

/** The distance of two places in units (percent of the width); `ratio` is width / height of the picture. */
export const heilDist = (a: Pt, b: Pt, ratio: number): number => Math.hypot(a.x - b.x, (a.y - b.y) / ratio)

// ================================================================ 1. the synagogue (`synagoge`)

export type SynagoguePartKind = 'column' | 'beam' | 'roof'
export const SYNAGOGUE_KINDS: SynagoguePartKind[] = ['column', 'beam', 'roof']

/** A place of a part on the building site: its box (left and top edge, width, height in percent of the picture) and the places that must be built before it (`needs`). */
export interface SynagogueSlot {
  id: string
  kind: SynagoguePartKind
  x: number
  y: number
  w: number
  h: number
  needs: string[]
  name: string
}
/** One round: the hint, the places, and whether the places are shown as dashed outlines from the start (round 1) or only while a part is in the hand. */
export interface SynagogueRound {
  hint: string
  slots: SynagogueSlot[]
  outline: boolean
}
/** A painted part (cut from one sheet, transparent): the picture and its name (German in the data, English over it). */
export interface SynagoguePart {
  image: string
  name: string
}
/**
 * The game "The synagogue": the empty building site (`background`, a straight front view; `ratio` = width / height), the top of the platform (`floor`, percent of the height),
 * the three parts and the rounds.
 */
export interface SynagogueGame {
  background: string
  ratio: number
  floor: number
  parts: Record<SynagoguePartKind, SynagoguePart>
  rounds: SynagogueRound[]
}

/** How far (units) from the middle of a place a part may be let go and still find it. */
export const SYNAGOGUE_REACH = 14

export type SynagogueVerdict = 'ok' | 'kind' | 'needs' | 'full'

export const synagogueMid = (s: SynagogueSlot): Pt => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 })

/** May a part of `kind` go on place `slotId` now? `ok`, `kind` (another part belongs there), `needs` (what carries it is not there yet) or `full`. */
export function synagogueFits(round: SynagogueRound, filled: ReadonlySet<string>, kind: SynagoguePartKind, slotId: string): SynagogueVerdict {
  const s = round.slots.find((x) => x.id === slotId)
  if (!s) return 'kind'
  if (filled.has(s.id)) return 'full'
  if (s.kind !== kind) return 'kind'
  if (s.needs.some((n) => !filled.has(n))) return 'needs'
  return 'ok'
}

/** How many parts of a kind are still to be set. */
export const synagogueLeft = (round: SynagogueRound, filled: ReadonlySet<string>, kind: SynagoguePartKind): number =>
  round.slots.filter((s) => s.kind === kind && !filled.has(s.id)).length

/**
 * Where a part of `kind` let go at `p` lands: the nearest free place of that kind within reach (a column finds any free column place near it), otherwise the nearest place of any kind
 * within reach (then the verdict says why it does not fit). Null: no place near, the part goes back without a mistake.
 */
export function synagogueDrop(round: SynagogueRound, filled: ReadonlySet<string>, kind: SynagoguePartKind, p: Pt, ratio: number): string | null {
  const near = (s: SynagogueSlot) => heilDist(synagogueMid(s), p, ratio)
  const inBox = (s: SynagogueSlot) => p.x >= s.x - 2 && p.x <= s.x + s.w + 2 && p.y >= s.y - 3 && p.y <= s.y + s.h + 3
  const ok = round.slots.filter((s) => s.kind === kind && !filled.has(s.id) && (inBox(s) || near(s) <= SYNAGOGUE_REACH))
  if (ok.length) return ok.sort((a, b) => near(a) - near(b))[0]!.id
  const any = round.slots.filter((s) => inBox(s) || near(s) <= SYNAGOGUE_REACH)
  if (!any.length) return null
  // a free place of another kind first (it tells what belongs there), a full one last
  return any.sort((a, b) => Number(filled.has(a.id)) - Number(filled.has(b.id)) || near(a) - near(b))[0]!.id
}

/** The next place for the button "Help me": the first free place in the list whose carriers stand (null when all are set). */
export function synagogueHelp(round: SynagogueRound, filled: ReadonlySet<string>): SynagogueSlot | null {
  return round.slots.find((s) => !filled.has(s.id) && s.needs.every((n) => filled.has(n))) ?? null
}

/** Every place is set. */
export const synagogueDone = (round: SynagogueRound, filled: ReadonlySet<string>): boolean => round.slots.every((s) => filled.has(s.id))

/** The problems of the data of `synagoge` (an empty list is good). */
export function synagogueProblems(game: SynagogueGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the building site')
  if (!(game.ratio > 0.5 && game.ratio < 3)) out.push('the ratio of the picture is odd')
  for (const k of SYNAGOGUE_KINDS) if (!game.parts[k]?.image) out.push(`no picture of the part "${k}"`)
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const ids = new Set<string>()
    const byId = new Map(r.slots.map((s) => [s.id, s]))
    if (r.slots.length < 3) out.push(`round ${n}: fewer than three places`)
    for (const s of r.slots) {
      if (ids.has(s.id)) out.push(`round ${n}: the place "${s.id}" is there twice`)
      ids.add(s.id)
      if (s.x < 0 || s.y < 0 || s.w <= 0 || s.h <= 0 || s.x + s.w > 100.01 || s.y + s.h > 100.01) out.push(`round ${n}: the place "${s.id}" lies outside the picture`)
      if (!s.name) out.push(`round ${n}: the place "${s.id}" has no name`)
      for (const k of s.needs) {
        const c = byId.get(k)
        if (!c) {
          out.push(`round ${n}: the place "${s.id}" needs "${k}", which does not exist`)
          continue
        }
        // what carries a part stands right under it
        if (Math.abs(c.y - (s.y + s.h)) > 2.5) out.push(`round ${n}: "${s.id}" does not rest on "${k}" (bottom ${(s.y + s.h).toFixed(1)}, top of the carrier ${c.y.toFixed(1)})`)
        if (c.x + c.w / 2 < s.x - 1 || c.x + c.w / 2 > s.x + s.w + 1) out.push(`round ${n}: "${k}" is not under "${s.id}"`)
      }
      if (s.kind === 'column') {
        if (s.needs.length) out.push(`round ${n}: the column "${s.id}" must stand on the platform, not on another part`)
        if (Math.abs(s.y + s.h - game.floor) > 1.5) out.push(`round ${n}: the column "${s.id}" does not stand on the platform (bottom ${(s.y + s.h).toFixed(1)}, platform ${game.floor})`)
      } else if (s.needs.length < 1) out.push(`round ${n}: the ${s.kind} "${s.id}" rests on nothing`)
      if (s.kind === 'beam' && s.needs.some((k) => byId.get(k)?.kind !== 'column')) out.push(`round ${n}: the beam "${s.id}" must rest on columns`)
      if (s.kind === 'roof' && s.needs.some((k) => byId.get(k)?.kind !== 'beam')) out.push(`round ${n}: the roof "${s.id}" must rest on beams`)
    }
    // the places can be built one after another (no circle of needs)
    const built = new Set<string>()
    let grew = true
    while (grew) {
      grew = false
      for (const s of r.slots)
        if (!built.has(s.id) && s.needs.every((k) => built.has(k))) {
          built.add(s.id)
          grew = true
        }
    }
    if (built.size !== r.slots.length) out.push(`round ${n}: some places can never be built`)
    // places of the same kind do not overlap; columns are far enough apart for a finger (at least 9 % of the width)
    const cols = r.slots.filter((s) => s.kind === 'column').sort((a, b) => a.x - b.x)
    for (let i = 1; i < cols.length; i++) if (cols[i]!.x + cols[i]!.w / 2 - (cols[i - 1]!.x + cols[i - 1]!.w / 2) < 9) out.push(`round ${n}: the columns "${cols[i - 1]!.id}" and "${cols[i]!.id}" are too close for a finger`)
  })
  const counts = game.rounds.map((r) => r.slots.length)
  if (counts.length >= 2 && counts[1]! <= counts[0]!) out.push('round 2 must have more parts than round 1')
  return out
}

// ================================================================ 2. ten on the way (`zehn`)

/** The field is upright (3:4). */
export const TEN_RATIO = 0.75
/** How fast the finger's ring goes (units a second) and how fast the men walk (a little faster, so that they keep up in the open). */
export const TEN_LEAD_SPEED = 20
export const TEN_MAN_SPEED = 26
/** The body of a man (units) for the obstacles and for the room between two men. */
export const TEN_BODY = 2.6
export const TEN_SPACE = 4.6
/** How far the men stand round the finger. */
export const TEN_SPREAD = 8
/** A man farther than this from the finger for longer than `TEN_LOST_TIME` is left behind (a mistake); he waits until the finger comes within `TEN_FETCH`. */
export const TEN_STRAY = 30
export const TEN_LOST_TIME = 1.4
export const TEN_FETCH = 12
/** The arrow keys move the finger this far (units). */
export const TEN_KEY_STEP = 7

/**
 * Something in the way, seen from above: the picture (`x`, `y` its middle, `w` its width, percent), and the part that stops the men: a circle of radius `r` (units) round the middle,
 * stretched to a band of half-length `span` (units, left and right) for a wall.
 */
export interface TenObstacle {
  image: string
  x: number
  y: number
  w: number
  r: number
  span?: number
  kind: 'tree' | 'rock' | 'thorn' | 'wall'
  name: string
}
/** One round: the hint, the land, where the men start, the middle of the house of the priests, the place in front of it (middle and radius in units), what is in the way, and a safe way for the help. */
export interface TenRound {
  hint: string
  background: string
  start: Pt
  house: Pt
  goal: Pt & { r: number }
  obstacles: TenObstacle[]
  route: Pt[]
}
/** The game "Ten on the way": ten men (pictures, transparent, the man stands at the bottom middle), their width (percent), the house of the priests and the rounds. */
export interface TenGame {
  men: string[]
  manW: number
  house: { image: string; w: number; name: string }
  rounds: TenRound[]
}

export interface TenMan extends Pt {
  /** left behind: he waits for the finger */
  lost: boolean
  /** how long he has been too far away */
  far: number
  /** 1 looks to the right, -1 to the left */
  face: number
  moving: boolean
}
export interface TenState {
  lead: Pt
  men: TenMan[]
}
export type TenEvent = { type: 'lost'; man: number } | { type: 'fetched'; man: number } | { type: 'arrived'; man: number } | { type: 'done' }

/** Where man `i` stands round the finger (a sunflower: the first in the middle, the others in rings), in units (a circle on the screen). */
export function tenOffset(i: number, spread = TEN_SPREAD): Pt {
  if (i === 0) return { x: 0, y: 0 }
  const a = i * 2.39996
  const r = spread * Math.sqrt(i / 9)
  return { x: Math.cos(a) * r, y: Math.sin(a) * r }
}

const units = (p: Pt): Pt => ({ x: p.x, y: p.y / TEN_RATIO })
const percent = (u: Pt): Pt => ({ x: u.x, y: u.y * TEN_RATIO })
export const tenDist = (a: Pt, b: Pt): number => heilDist(a, b, TEN_RATIO)

/** The nearest point of an obstacle's core (its middle, or the band of a wall), in units. */
function core(o: TenObstacle, u: Pt): Pt {
  const c = units(o)
  const s = o.span ?? 0
  return { x: Math.max(c.x - s, Math.min(c.x + s, u.x)), y: c.y }
}

/** The obstacle a body at `p` (percent) touches, or -1. */
export function tenTouch(obstacles: readonly TenObstacle[], p: Pt, body = TEN_BODY): number {
  const u = units(p)
  return obstacles.findIndex((o) => {
    const c = core(o, u)
    return Math.hypot(u.x - c.x, u.y - c.y) < o.r + body
  })
}

/** A man at the goal: inside the circle in front of the house. */
export const tenAtGoal = (round: TenRound, p: Pt): boolean => tenDist(p, round.goal) <= round.goal.r

/** The start: the ring of the finger at the start point and the men round it. */
export function tenStart(game: TenGame, ri: number): TenState {
  const r = game.rounds[ri]!
  const s = units(r.start)
  return {
    lead: { ...r.start },
    men: game.men.map((_, i) => {
      const o = tenOffset(i)
      return { ...percent({ x: s.x + o.x, y: s.y + o.y }), lost: false, far: 0, face: 1, moving: false }
    })
  }
}

/**
 * One tick: the finger's ring goes toward the finger (`target`, or stays), every man who is not left behind walks toward his place round the ring, the men keep a little room between them,
 * no one walks into an obstacle (a man who meets one slides along it on the side of his place), and nobody leaves the field.
 * A man far from the ring for too long is left behind (`lost`); the ring near him fetches him (`fetched`). `arrived` once for each man that enters the goal, `done` when all are there.
 */
export function tenStep(game: TenGame, ri: number, st: TenState, target: Pt | null, dt: number, inGoal: readonly boolean[] = []): { state: TenState; events: TenEvent[] } {
  const r = game.rounds[ri]!
  const events: TenEvent[] = []
  // the ring
  let lead = st.lead
  if (target) {
    const a = units(lead)
    const b = units(target)
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    const step = Math.min(d, TEN_LEAD_SPEED * dt)
    lead = d > 1e-6 ? percent({ x: a.x + ((b.x - a.x) / d) * step, y: a.y + ((b.y - a.y) / d) * step }) : { ...target }
  }
  const L = units(lead)
  // the men walk
  const pos = st.men.map((m) => units(m))
  const next = st.men.map((m, i) => {
    if (m.lost) return { ...pos[i]! }
    const o = tenOffset(i)
    const want = { x: L.x + o.x, y: L.y + o.y }
    const p = pos[i]!
    const dx = want.x - p.x
    const dy = want.y - p.y
    const d = Math.hypot(dx, dy)
    const step = Math.min(d, TEN_MAN_SPEED * dt)
    return d > 1e-6 ? { x: p.x + (dx / d) * step, y: p.y + (dy / d) * step } : { ...p }
  })
  // room between the men
  for (let k = 0; k < 2; k++)
    for (let i = 0; i < next.length; i++)
      for (let j = i + 1; j < next.length; j++) {
        const a = next[i]!
        const b = next[j]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy)
        if (d >= TEN_SPACE) continue
        const push = (TEN_SPACE - d) / 2
        const ux = d > 1e-6 ? dx / d : i % 2 ? 1 : -1
        const uy = d > 1e-6 ? dy / d : 0
        const la = st.men[i]!.lost
        const lb = st.men[j]!.lost
        if (!la) {
          a.x -= ux * push * (lb ? 2 : 1)
          a.y -= uy * push * (lb ? 2 : 1)
        }
        if (!lb) {
          b.x += ux * push * (la ? 2 : 1)
          b.y += uy * push * (la ? 2 : 1)
        }
      }
  // the obstacles: out of every core, and along it toward the side of the man's place
  next.forEach((p, i) => {
    if (st.men[i]!.lost) return
    const o = tenOffset(i)
    const want = { x: L.x + o.x, y: L.y + o.y }
    for (let k = 0; k < 3; k++)
      for (const ob of r.obstacles) {
        const c = core(ob, p)
        const dx = p.x - c.x
        const dy = p.y - c.y
        const d = Math.hypot(dx, dy)
        const need = ob.r + TEN_BODY
        if (d >= need) continue
        const nx = d > 1e-6 ? dx / d : 0
        const ny = d > 1e-6 ? dy / d : 1
        p.x = c.x + nx * need
        p.y = c.y + ny * need
        // slide along the obstacle (a quarter of a step) toward the side where his place is
        const tx = -ny
        const ty = nx
        const side = (want.x - p.x) * tx + (want.y - p.y) * ty
        const sgn = Math.abs(side) > 0.05 ? Math.sign(side) : i % 2 ? 1 : -1
        const slide = TEN_MAN_SPEED * dt * 0.6
        p.x += tx * sgn * slide
        p.y += ty * sgn * slide
      }
    p.x = Math.max(3, Math.min(97, p.x))
    p.y = Math.max(4 / TEN_RATIO, Math.min(98 / TEN_RATIO, p.y))
  })
  // left behind, fetched, arrived
  const men: TenMan[] = st.men.map((m, i) => {
    const p = next[i]!
    const old = pos[i]!
    const moved = Math.hypot(p.x - old.x, p.y - old.y)
    const dLead = Math.hypot(p.x - L.x, p.y - L.y)
    let lost = m.lost
    let far = m.far
    if (lost) {
      if (dLead <= TEN_FETCH) {
        lost = false
        far = 0
        events.push({ type: 'fetched', man: i })
      }
    } else if (dLead > TEN_STRAY) {
      far += dt
      if (far >= TEN_LOST_TIME) {
        lost = true
        events.push({ type: 'lost', man: i })
      }
    } else far = 0
    const face = Math.abs(p.x - old.x) > 0.02 ? Math.sign(p.x - old.x) : m.face
    return { ...percent(p), lost, far, face, moving: moved > 0.05 }
  })
  men.forEach((m, i) => {
    if (!m.lost && tenAtGoal(r, m) && !inGoal[i]) events.push({ type: 'arrived', man: i })
  })
  if (men.every((m) => !m.lost && tenAtGoal(r, m))) events.push({ type: 'done' })
  return { state: { lead, men }, events }
}

/** An arrow key: the finger goes a step from the ring (percent, kept in the field). */
export function tenNudge(lead: Pt, dx: number, dy: number, step = TEN_KEY_STEP): Pt {
  return { x: Math.max(3, Math.min(97, lead.x + dx * step)), y: Math.max(4, Math.min(97, lead.y + dy * step * TEN_RATIO)) }
}

/** The next point of the safe way ahead of the ring (for Enter and "Help me"): the first point of the route that is nearer the goal than the ring and not right under it. */
export function tenRouteAhead(round: TenRound, lead: Pt): Pt {
  const route = [...round.route, { x: round.goal.x, y: round.goal.y }]
  // the route point nearest to the ring, then the one after it
  let best = 0
  let bd = Infinity
  route.forEach((p, i) => {
    const d = tenDist(p, lead)
    if (d < bd) {
      bd = d
      best = i
    }
  })
  const k = bd < 5 ? Math.min(route.length - 1, best + 1) : best
  return { ...route[k]! }
}

/** The rest of the safe way from the ring (for "Help me"): from the next point ahead to the goal. */
export function tenHelpRoute(round: TenRound, lead: Pt): Pt[] {
  const route = [...round.route, { x: round.goal.x, y: round.goal.y }]
  const ahead = tenRouteAhead(round, lead)
  const k = route.findIndex((p) => p.x === ahead.x && p.y === ahead.y)
  return route.slice(Math.max(0, k))
}

/** Play a round along its route (the finger goes from point to point): whether all ten arrive, how many were left behind and how long it took (seconds). */
export function tenPlayRoute(game: TenGame, ri: number, dt = 0.05, maxSeconds = 120): { done: boolean; lost: number; seconds: number } {
  const r = game.rounds[ri]!
  let st = tenStart(game, ri)
  const route = [...r.route, { x: r.goal.x, y: r.goal.y }]
  let k = 0
  let lost = 0
  const inGoal = game.men.map(() => false)
  for (let t = 0; t < maxSeconds; t += dt) {
    while (k < route.length - 1 && tenDist(st.lead, route[k]!) < 1) k++
    const res = tenStep(game, ri, st, route[k]!, dt, inGoal)
    st = res.state
    for (const e of res.events) {
      if (e.type === 'lost') lost++
      if (e.type === 'arrived') inGoal[e.man] = true
      if (e.type === 'done') return { done: true, lost, seconds: t }
    }
  }
  return { done: false, lost, seconds: maxSeconds }
}

/** The problems of the data of `zehn` (an empty list is good): pictures, places, a free goal, and a route along which all ten arrive without anyone left behind. */
export function tenProblems(game: TenGame): string[] {
  const out: string[] = []
  if (game.men.length !== 10) out.push(`there must be ten men, there are ${game.men.length}`)
  if (game.men.some((m) => !m)) out.push('a man has no picture')
  if (!game.house?.image) out.push('no picture of the house of the priests')
  if (!(game.manW >= 9)) out.push('the men are too small for a phone (at least 9 % of the width, about 32 pixels)')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const inside = (p: Pt) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100
    if (!r.background) out.push(`round ${n}: no picture of the land`)
    if (!inside(r.start) || !inside(r.goal) || !inside(r.house)) out.push(`round ${n}: the start, the house or the goal lies outside the land`)
    if (r.house.y >= r.goal.y) out.push(`round ${n}: the goal must lie in front of (below) the house`)
    if (r.goal.r < TEN_SPREAD + TEN_BODY + 1) out.push(`round ${n}: the goal is too small for ten men`)
    r.obstacles.forEach((o, i) => {
      if (!inside(o) || !o.image || !o.name) out.push(`round ${n}: obstacle ${i + 1} lies outside or has no picture or name`)
      if (o.kind === 'wall' && !(o.span && o.span > 0)) out.push(`round ${n}: the wall ${i + 1} has no length (span)`)
      const c = { x: Math.max(o.x - (o.span ?? 0), Math.min(o.x + (o.span ?? 0), r.goal.x)), y: o.y }
      if (tenDist(c, r.goal) < r.goal.r + o.r) out.push(`round ${n}: obstacle ${i + 1} stands in the goal`)
    })
    const st = tenStart(game, ri)
    st.men.forEach((m, i) => {
      if (tenTouch(r.obstacles, m) >= 0) out.push(`round ${n}: man ${i + 1} starts in an obstacle`)
    })
    if (r.route.some((p) => !inside(p))) out.push(`round ${n}: a point of the route lies outside the land`)
    if (r.route.some((p) => tenTouch(r.obstacles, p, 0) >= 0)) out.push(`round ${n}: a point of the route lies in an obstacle`)
    const play = tenPlayRoute(game, ri)
    if (!play.done) out.push(`round ${n}: along the route not all ten arrive`)
    if (play.lost) out.push(`round ${n}: along the route ${play.lost} men are left behind`)
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.obstacles.length <= game.rounds[0]!.obstacles.length) out.push('round 2 must have more obstacles than round 1')
  return out
}

// ================================================================ 3. to Jesus (`kinder`)

/**
 * A child who waits (seen from the front, transparent, standing at the bottom middle of its picture): its `rank` (1 the smallest; the order in which the children come),
 * its height in the waiting row (`h`, percent of the picture height), whether it is carried (`carried`: a mother or father carries the little one, the picture is the grown-up with the child),
 * and its name.
 */
export interface ChildFigure {
  id: string
  image: string
  name: string
  rank: number
  h: number
  carried?: boolean
}
/** One round: the hint and the children in the order in which they wait from left to right. */
export interface ChildrenRound {
  hint: string
  children: ChildFigure[]
}
/**
 * The game "To Jesus": the courtyard with Jesus under the fig tree (`background`, `ratio` = width / height), the waiting row (`row`: the line the children stand on, percent of the height,
 * from `x0` to `x1`), the places round Jesus (`seats`: where the feet of a child stand, and how much smaller it looks there) and the rounds. The pictures of the children are 300 x 330.
 */
export interface ChildrenGame {
  background: string
  ratio: number
  figureRatio: number
  row: { y: number; x0: number; x1: number }
  seats: (Pt & { scale: number })[]
  rounds: ChildrenRound[]
}

/** The rank that comes next: the smallest of those who still wait (null when all are with Jesus). */
export function childrenNext(round: ChildrenRound, come: ReadonlySet<string>): ChildFigure | null {
  const left = round.children.filter((c) => !come.has(c.id))
  if (!left.length) return null
  return left.reduce((a, b) => (b.rank < a.rank ? b : a))
}

/** A tap on a waiting child: `ok` (it is the smallest of those who wait), `bigger` (a smaller one still waits) or `already` (it is with Jesus). */
export function childrenTap(round: ChildrenRound, come: ReadonlySet<string>, id: string): 'ok' | 'bigger' | 'already' {
  if (come.has(id)) return 'already'
  return childrenNext(round, come)?.id === id ? 'ok' : 'bigger'
}

/** Where child `i` of the row waits (the middle of its feet, percent). */
export function childrenSpot(game: ChildrenGame, round: ChildrenRound, i: number): Pt {
  const n = round.children.length
  const x = n <= 1 ? (game.row.x0 + game.row.x1) / 2 : game.row.x0 + ((game.row.x1 - game.row.x0) * i) / (n - 1)
  return { x, y: game.row.y }
}

/** The part of a child's picture (its width) that answers a tap: the middle half, where the child stands (the picture is wider than the child). */
export const CHILD_HIT = 0.5

/** The width of a child's picture (percent of the width of the field) from its height. */
export const childrenWidth = (game: ChildrenGame, c: ChildFigure, scale = 1): number => ((c.h * scale) / 100) * game.figureRatio * (100 / game.ratio)

/** The problems of the data of `kinder` (an empty list is good). */
export function childrenProblems(game: ChildrenGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the courtyard')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  const inside = (p: Pt) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100
  if (!inside({ x: game.row.x0, y: game.row.y }) || !inside({ x: game.row.x1, y: game.row.y }) || game.row.x1 <= game.row.x0) out.push('the waiting row lies outside the picture')
  game.seats.forEach((s, i) => {
    if (!inside(s) || !(s.scale > 0.3 && s.scale <= 1)) out.push(`seat ${i + 1} lies outside or its scale is odd`)
  })
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const k = r.children.length
    if (k < 3) out.push(`round ${n}: fewer than three children`)
    if (k > game.seats.length) out.push(`round ${n}: ${k} children but only ${game.seats.length} places round Jesus`)
    const ranks = r.children.map((c) => c.rank)
    if (new Set(ranks).size !== k) out.push(`round ${n}: two children have the same rank`)
    if (new Set(r.children.map((c) => c.id)).size !== k) out.push(`round ${n}: two children have the same id`)
    for (const c of r.children) {
      if (!c.image || !c.name) out.push(`round ${n}: the child "${c.id}" has no picture or name`)
      if (!(c.h >= 22 && c.h <= 62)) out.push(`round ${n}: the child "${c.id}" is ${c.h} % high (22 to 62)`)
    }
    // the little ones on the arm come first; then the children who walk, each a good bit taller than the one before (at least 9 %), so that the order can be seen
    const walking = r.children.filter((c) => !c.carried).sort((a, b) => a.rank - b.rank)
    const carried = r.children.filter((c) => c.carried)
    if (carried.length && walking.length && Math.max(...carried.map((c) => c.rank)) > Math.min(...walking.map((c) => c.rank))) out.push(`round ${n}: a child on the arm must come before the children who walk`)
    for (let i = 1; i < walking.length; i++)
      if (walking[i]!.h < walking[i - 1]!.h * 1.09) out.push(`round ${n}: "${walking[i]!.id}" is not clearly taller than "${walking[i - 1]!.id}"`)
    // tapping room in the waiting row: at least 12 % of the width between two children (44 pixels on a phone)
    const gap = k > 1 ? (game.row.x1 - game.row.x0) / (k - 1) : 100
    if (gap < 12) out.push(`round ${n}: the children stand too close for a finger`)
    for (let i = 1; i < k; i++) {
      const half = ((childrenWidth(game, r.children[i - 1]!) + childrenWidth(game, r.children[i]!)) / 2) * CHILD_HIT
      if (half > gap + 0.01) out.push(`round ${n}: the tapping areas of "${r.children[i - 1]!.id}" and "${r.children[i]!.id}" overlap`)
    }
    // the row is not already in order (nor the other way round)
    const order = r.children.map((c) => c.rank)
    const asc = order.every((v, i) => i === 0 || v > order[i - 1]!)
    const desc = order.every((v, i) => i === 0 || v < order[i - 1]!)
    if (asc || desc) out.push(`round ${n}: the children already wait in order`)
    // nobody is cut off at the edge (the child stands in the middle half of its picture)
    r.children.forEach((c, i) => {
      const p = childrenSpot(game, r, i)
      const w = childrenWidth(game, c) * CHILD_HIT
      if (p.x - w / 2 < 0 || p.x + w / 2 > 100 || p.y - c.h < 0) out.push(`round ${n}: the child "${c.id}" sticks out of the picture`)
    })
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.children.length <= game.rounds[0]!.children.length) out.push('round 2 must have more children than round 1')
  return out
}
