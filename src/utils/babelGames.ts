/**
 * The small pure functions of the new games of "Der Turm von Babel": who is missing from the row (the memory game), how the brick chain passes things on,
 * where a block of the stepped tower lands, and how far a finger has followed a road. The games only draw what these say; the tests use them directly.
 */
import type { MissingPerson, MissingTask } from '@/types/adventure'

// ------------------------------------------------------------------ who is missing

export interface MissingView {
  /** The row as it stands after the dust cloud: the people at their places, `null` where somebody is gone. */
  after: (string | null)[]
  /** The people the child chooses from: everybody who stood in the row, in the order of the list of people (never in the order of the row). */
  choices: string[]
}

/** Works out what the row looks like after the dust cloud and who can be chosen. A task that does not make sense (somebody gone who was not there, nobody gone) is refused. */
export function buildTask(people: MissingPerson[], task: MissingTask): MissingView {
  const ids = new Set(people.map((p) => p.id))
  if (new Set(task.row).size !== task.row.length) throw new Error('a person stands twice in the row')
  for (const id of task.row) if (!ids.has(id)) throw new Error(`unknown person ${id}`)
  if (task.gone.length < 1 || task.gone.length > 2) throw new Error('one or two people are gone')
  for (const g of task.gone) if (!task.row.includes(g)) throw new Error(`${g} is not in the row`)
  return {
    after: task.row.map((id) => (task.gone.includes(id) ? null : id)),
    choices: people.filter((p) => task.row.includes(p.id)).map((p) => p.id)
  }
}

// ------------------------------------------------------------------ the brick chain

export type ChainItem = 'brick' | 'pitch'
export interface ChainState {
  /** What every person holds (index 0 stands at the oven, the last one at the stack). */
  holders: (ChainItem | null)[]
  /** What has not come out of the oven yet. */
  waiting: ChainItem[]
  /** What lies on the stack. */
  stacked: ChainItem[]
}
export type ChainResult = 'moved' | 'stacked' | 'blocked' | 'empty'

/** The start of a round: the first thing comes out of the oven into the hands of the first person. */
export function startChain(people: number, items: ChainItem[]): ChainState {
  const state: ChainState = { holders: Array.from({ length: people }, () => null), waiting: [...items], stacked: [] }
  feed(state)
  return state
}

/** The next thing comes out of the oven when the first person's hands are free (never before: there is no hurry). */
function feed(state: ChainState) {
  if (state.holders[0] === null && state.waiting.length) state.holders[0] = state.waiting.shift()!
}

/**
 * The person `index` is tapped. Holding something: the thing is passed on to the next person, or put on the stack by the last one; when the next
 * person's hands are full the thing stays (`blocked`, a friendly wobble, no fault). Holding nothing: `empty` (a small fault).
 */
export function passAlong(state: ChainState, index: number): { state: ChainState; result: ChainResult } {
  const next: ChainState = { holders: [...state.holders], waiting: [...state.waiting], stacked: [...state.stacked] }
  const held = next.holders[index]
  if (index < 0 || index >= next.holders.length || held === null || held === undefined) return { state: next, result: 'empty' }
  if (index === next.holders.length - 1) {
    next.holders[index] = null
    next.stacked.push(held)
    feed(next)
    return { state: next, result: 'stacked' }
  }
  if (next.holders[index + 1] !== null) return { state: next, result: 'blocked' }
  next.holders[index + 1] = held
  next.holders[index] = null
  feed(next)
  return { state: next, result: 'moved' }
}

/** Is everything on the stack? */
export const chainDone = (state: ChainState): boolean => state.waiting.length === 0 && state.holders.every((h) => h === null)

// ------------------------------------------------------------------ the stepped tower

export interface Landing {
  /** The block lies on the step within a tenth of its width over the edge: good. Otherwise it slides gently into place. */
  good: boolean
  /** Where the block ends up (its left edge, percent of the picture width): where it was let go when it is good, centred on the step when it slid. */
  left: number
  /** How far it hung over the edge when it was let go (percent of the picture width). */
  over: number
}

/**
 * A block of width `w` is let go with its left edge at `x` over the step below, which starts at `prevLeft` and is `prevWidth` wide. It stays where it fell when it
 * hangs over by less than a tenth of its width; otherwise it slides to the middle of the step. Nothing ever falls down and the tower never gives way.
 */
export function land(prevLeft: number, prevWidth: number, x: number, w: number): Landing {
  const over = Math.max(0, prevLeft - x, x + w - (prevLeft + prevWidth))
  if (over <= w / 10) return { good: true, left: x, over }
  return { good: false, left: prevLeft + (prevWidth - w) / 2, over }
}

/** Where a block glides: to and fro between the left edge and the right edge of the picture (a triangle wave), `speed` picture widths a second. */
export function glideAt(seconds: number, speed: number, w: number): number {
  const travel = Math.max(0.0001, 100 - w)
  const lap = (speed * 100 * seconds) % (2 * travel)
  return lap <= travel ? lap : 2 * travel - lap
}

/** The widths of the steps of a round: the step below the first block, then every block `shrink` narrower than the one below. */
export function stepWidths(baseWidth: number, shrink: number, layers: number): number[] {
  return Array.from({ length: layers + 1 }, (_, k) => baseWidth * Math.pow(1 - shrink, k))
}

// ------------------------------------------------------------------ the roads

export interface Pt {
  x: number
  y: number
}

/** The length of every piece of a line, and the whole length, in percent of the picture width (the picture is 3 : 4, so a percent of the height is longer). */
const TALL = 4 / 3
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, (a.y - b.y) * TALL)

export function lineLength(points: [number, number][]): number {
  let sum = 0
  for (let i = 1; i < points.length; i++) sum += dist({ x: points[i - 1]![0], y: points[i - 1]![1] }, { x: points[i]![0], y: points[i]![1] })
  return sum
}

/** The point on the line at a distance `along` from its start. */
export function pointAt(points: [number, number][], along: number): Pt {
  let left = Math.max(0, along)
  for (let i = 1; i < points.length; i++) {
    const a = { x: points[i - 1]![0], y: points[i - 1]![1] }
    const b = { x: points[i]![0], y: points[i]![1] }
    const len = dist(a, b)
    if (left <= len || i === points.length - 1) {
      const f = len === 0 ? 0 : Math.min(1, left / len)
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    }
    left -= len
  }
  return { x: points[0]![0], y: points[0]![1] }
}

/** The nearest point of the line to the finger: how far along the line it is, and how far the finger is from the line. */
export function nearestOn(points: [number, number][], p: Pt): { along: number; distance: number } {
  let best = { along: 0, distance: Infinity }
  let before = 0
  for (let i = 1; i < points.length; i++) {
    const a = { x: points[i - 1]![0], y: points[i - 1]![1] }
    const b = { x: points[i]![0], y: points[i]![1] }
    const vx = b.x - a.x
    const vy = (b.y - a.y) * TALL
    const len2 = vx * vx + vy * vy || 1
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * TALL * vy) / len2))
    const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    const d = dist(p, q)
    if (d < best.distance) best = { along: before + Math.sqrt(len2) * t, distance: d }
    before += Math.sqrt(len2)
  }
  return best
}

export interface Advance {
  /** How far along the road the walker is now. */
  progress: number
  /** The finger is on the road and the walker goes with it. */
  on: boolean
  /** The finger has strayed far from the road (the walker stops). */
  strayed: boolean
}

/**
 * The finger is at `pointer`: the walker goes as far along the road as the finger has followed it, but only while the finger is within the width of the road
 * (`r`, with a little room to spare) and not far ahead of the walker (so that nobody skips a bend); it never goes back. Far from the road the walker stops
 * and the finger has strayed.
 */
export function advance(points: [number, number][], progress: number, pointer: Pt, r: number): Advance {
  const near = nearestOn(points, pointer)
  const width = r * 1.6
  if (near.distance > width * 1.8) return { progress, on: false, strayed: true }
  const reach = width * 3 + 4
  if (near.distance <= width && near.along >= progress - width * 2 && near.along <= progress + reach) {
    return { progress: Math.max(progress, near.along), on: true, strayed: false }
  }
  return { progress, on: false, strayed: false }
}
