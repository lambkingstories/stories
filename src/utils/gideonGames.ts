/**
 * The small pure functions of the new games of "Gideon" (`utils/gideonGames.ts`): pushing the sacks in the cave (move, solved, solution, dead end), the wind and the chaff, the letters of a
 * word, the sky of the night and the dew, the switch for the men, the cones of light of the watchers and the answer to the signal. The games draw and time only what these say; the tests use them
 * directly.
 */
import { seeded } from '@/utils/jakobGames'

// ------------------------------------------------------------------ the sacks in the cave

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Cell = [number, number]
export interface CaveShape {
  cols: number
  rows: number
  walls: Cell[]
  niches: Cell[]
}
export interface CaveState {
  man: Cell
  sacks: Cell[]
}

const STEP: Record<Dir, Cell> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
export const DIRS: Dir[] = ['up', 'down', 'left', 'right']
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1]
const has = (list: Cell[], c: Cell) => list.some((x) => same(x, c))
const inside = (level: CaveShape, c: Cell) => c[0] >= 0 && c[1] >= 0 && c[0] < level.cols && c[1] < level.rows

/** Is the cell free of rock and inside the cave? */
export const isFloor = (level: CaveShape, c: Cell): boolean => inside(level, c) && !has(level.walls, c)

/**
 * One step of the man in a direction. A sack in front of him is pushed on (only one at a time, never through rock, never into another sack); if it cannot go on, nothing moves and
 * the answer says what stood in the way (`wall` for rock or the edge, `sack` for a second sack).
 */
export function moveMan(level: CaveShape, state: CaveState, dir: Dir): { state: CaveState; moved: boolean; pushed: boolean; blocked: 'wall' | 'sack' | null } {
  const d = STEP[dir]
  const to: Cell = [state.man[0] + d[0], state.man[1] + d[1]]
  if (!isFloor(level, to)) return { state, moved: false, pushed: false, blocked: 'wall' }
  const i = state.sacks.findIndex((s) => same(s, to))
  if (i < 0) return { state: { man: to, sacks: state.sacks }, moved: true, pushed: false, blocked: null }
  const beyond: Cell = [to[0] + d[0], to[1] + d[1]]
  if (!isFloor(level, beyond)) return { state, moved: false, pushed: false, blocked: 'wall' }
  if (has(state.sacks, beyond)) return { state, moved: false, pushed: false, blocked: 'sack' }
  const sacks = state.sacks.map((s, k) => (k === i ? beyond : s))
  return { state: { man: to, sacks }, moved: true, pushed: true, blocked: null }
}

/** How many sacks stand in a niche. */
export const sacksHome = (level: CaveShape, state: CaveState): number => state.sacks.filter((s) => has(level.niches, s)).length

/** Every sack stands in a niche. */
export const isSolved = (level: CaveShape, state: CaveState): boolean => state.sacks.length > 0 && sacksHome(level, state) === state.sacks.length

const keyOf = (s: CaveState) => `${s.man.join(',')}|${s.sacks.map((c) => c.join(',')).sort().join(';')}`

/** The shortest way to the solution from a state, as a list of steps; `null` when there is none, an empty list when it is solved. */
export function solution(level: CaveShape, from: CaveState): Dir[] | null {
  if (isSolved(level, from)) return []
  const seen = new Map<string, { prev: string; dir: Dir } | null>([[keyOf(from), null]])
  const states = new Map<string, CaveState>([[keyOf(from), from]])
  let frontier = [from]
  while (frontier.length) {
    const next: CaveState[] = []
    for (const s of frontier) {
      const k = keyOf(s)
      for (const dir of DIRS) {
        const r = moveMan(level, s, dir)
        if (!r.moved) continue
        const nk = keyOf(r.state)
        if (seen.has(nk)) continue
        seen.set(nk, { prev: k, dir })
        states.set(nk, r.state)
        if (isSolved(level, r.state)) {
          const way: Dir[] = []
          for (let cur = seen.get(nk); cur; cur = seen.get(cur.prev) ?? null) way.unshift(cur.dir)
          return way
        }
        next.push(r.state)
      }
    }
    frontier = next
  }
  return null
}

/** Can the puzzle be solved from the start (or from a state)? */
export const solvable = (level: CaveShape & { sacks: Cell[]; man: Cell }, from?: CaveState): boolean => solution(level, from ?? { man: level.man, sacks: level.sacks }) !== null

/** How many pushes the shortest solution needs (to show that a round is not trivial). */
export function pushesOf(level: CaveShape, from: CaveState): number | null {
  const way = solution(level, from)
  if (!way) return null
  let s = from
  let n = 0
  for (const d of way) {
    const r = moveMan(level, s, d)
    if (r.pushed) n++
    s = r.state
  }
  return n
}

/** A sack that is not in a niche and stands in a corner (rock or edge on one side along each axis) can never be moved again. */
export function deadlock(level: CaveShape, state: CaveState): boolean {
  return state.sacks.some((s) => {
    if (has(level.niches, s)) return false
    const blocked = (dx: number, dy: number) => !isFloor(level, [s[0] + dx, s[1] + dy])
    return (blocked(-1, 0) || blocked(1, 0)) && (blocked(0, -1) || blocked(0, 1))
  })
}

// ------------------------------------------------------------------ the wind and the chaff

export interface WinnowPiece {
  id: string
  kind: 'chaff' | 'grain'
  /** the wind (percent) from which the piece flies away */
  threshold: number
}
export interface WinnowSetup {
  chaff: number
  grains: number
  window: [number, number]
  gust: number
  seed: number
}

/**
 * The pieces in the tray: the light chaff flies away at a wind inside the right window (so all of it is gone at the upper end of the window), the heavy grains stay put as long as the wind,
 * with its gust, does not go beyond the window. Always the same for the same seed.
 */
export function makePieces(setup: WinnowSetup): WinnowPiece[] {
  const r = seeded(setup.seed)
  const [lo, hi] = setup.window
  const out: WinnowPiece[] = []
  for (let i = 0; i < setup.chaff; i++) out.push({ id: `c${i}`, kind: 'chaff', threshold: Math.round((lo + r() * (hi - lo - 2)) * 10) / 10 })
  const safe = hi + setup.gust + 3
  for (let i = 0; i < setup.grains; i++) out.push({ id: `g${i}`, kind: 'grain', threshold: Math.round((safe + r() * (100 - safe)) * 10) / 10 })
  return out
}

/** The piece flies away at this wind. */
export const blownAway = (piece: WinnowPiece, wind: number): boolean => wind >= piece.threshold

/** The wind with its gust: the child's setting plus or minus the gust, in a fixed order by seed and time (percent, 0 to 100). */
export function effectiveWind(wind: number, gust: number, seed: number, tick: number): number {
  if (!gust) return wind
  const r = seeded(seed * 7919 + tick)
  return Math.min(100, Math.max(0, wind + (r() * 2 - 1) * gust))
}

/** Which of the pieces that lie in the tray fly away at this wind: the chaff and the grains apart. */
export function blow(pieces: WinnowPiece[], wind: number): { chaff: string[]; grains: string[] } {
  const gone = pieces.filter((p) => blownAway(p, wind))
  return { chaff: gone.filter((p) => p.kind === 'chaff').map((p) => p.id), grains: gone.filter((p) => p.kind === 'grain').map((p) => p.id) }
}

// ------------------------------------------------------------------ the letters of a word

/** The tiles of a word: its letters and the extra ones, in a mixed order that is the same every time and is never the word itself. */
export function tilesFor(word: string, extra: string[]): string[] {
  const all = [...word.split(''), ...extra]
  let seed = all.length * 7741 + word.charCodeAt(0)
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const mix = (list: string[]) => {
    const a = list.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[a[i], a[j]] = [a[j]!, a[i]!]
    }
    return a
  }
  let out = mix(all)
  for (let k = 0; k < 8 && out.slice(0, word.length).join('') === word; k++) out = mix(all)
  return out
}

// ------------------------------------------------------------------ the sky of the night and the dew

/** The colour of the sky while the night goes by: dark blue in the evening, rose in the dawn, light in the morning (progress 0 to 1). */
export function skyColour(progress: number): string {
  const p = Math.min(1, Math.max(0, progress))
  const stops: [number, [number, number, number]][] = [
    [0, [22, 32, 72]],
    [0.55, [90, 70, 120]],
    [0.8, [214, 130, 130]],
    [1, [196, 226, 246]]
  ]
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i]!
    const [p0, c0] = stops[i - 1]!
    if (p <= p1) {
      const f = (p - p0) / (p1 - p0)
      return `rgb(${c0.map((v, k) => Math.round(v + (c1[k]! - v) * f)).join(', ')})`
    }
  }
  return 'rgb(196, 226, 246)'
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}
/** Does the point lie in the box (percent)? */
export const inBox = (p: { x: number; y: number }, b: Box): boolean => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h

// ------------------------------------------------------------------ the switch

export type Want = 'home' | 'stay'
export type Lever = 'left' | 'right'
/** The man goes where he wants to: a man who wants to go home goes to the right, one who stays goes to the left (into the camp). */
export const route = (man: Want, lever: Lever): boolean => (man === 'home') === (lever === 'right')

// ------------------------------------------------------------------ the cones of light

export interface Cone {
  x: number
  y: number
  from: number
  to: number
  periodMs: number
  reach: number
}
/** How much the height of the picture counts in percent of the width (the slope is 3 : 4). */
export const SLOPE = 0.75
/** The direction of the cone at the time t (degrees, 0 to the right, 90 down): to and fro, resting a moment at both ends. */
export function coneAngle(c: Cone, tMs: number): number {
  const phase = (((tMs % c.periodMs) + c.periodMs) % c.periodMs) / c.periodMs
  const p = phase < 0.5 ? phase * 2 : (1 - phase) * 2
  const f = Math.min(1, Math.max(0, (p - 0.1) / 0.8))
  const eased = f * f * (3 - 2 * f)
  return c.from + (c.to - c.from) * eased
}
/** Does the cone light the point at the time t (percent of the picture)? */
export function lit(c: Cone, tMs: number, p: { x: number; y: number }, half = 13): boolean {
  const dx = p.x - c.x
  const dy = (p.y - c.y) * SLOPE
  if (Math.hypot(dx, dy) > c.reach) return false
  const a = (Math.atan2(dy, dx) * 180) / Math.PI
  const diff = Math.abs((((a - coneAngle(c, tMs)) % 360) + 540) % 360 - 180)
  return diff <= half
}

/** The length of a way (percent of the width). */
export function wayLength(path: Cell[]): number {
  let sum = 0
  for (let i = 1; i < path.length; i++) sum += Math.hypot(path[i]![0] - path[i - 1]![0], (path[i]![1] - path[i - 1]![1]) * SLOPE)
  return sum
}
/** The point at the part t (0 to 1) of the way. */
export function wayPoint(path: Cell[], t: number): { x: number; y: number } {
  if (!path.length) return { x: 50, y: 50 }
  let left = Math.min(1, Math.max(0, t)) * wayLength(path)
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    const len = Math.hypot(b[0] - a[0], (b[1] - a[1]) * SLOPE)
    if (left <= len || i === path.length - 1) {
      const f = len === 0 ? 0 : Math.min(1, left / len)
      return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f }
    }
    left -= len
  }
  const last = path[path.length - 1]!
  return { x: last[0], y: last[1] }
}
/** The part of the way (0 to 1) that is nearest to a point. */
export function nearestPart(path: Cell[], p: { x: number; y: number }): number {
  const total = wayLength(path)
  if (!total) return 0
  let best = 0
  let bestD = Infinity
  for (let i = 0; i <= 200; i++) {
    const t = i / 200
    const q = wayPoint(path, t)
    const d = Math.hypot(q.x - p.x, (q.y - p.y) * SLOPE)
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  return best
}
/** The parts of the way (0 to 1) of the places in the shadow, from the start on. */
export const stopParts = (path: Cell[], stops: Cell[]): number[] => stops.map((s) => nearestPart(path, { x: s[0], y: s[1] })).sort((a, b) => a - b)
/** The next place in the shadow after the part t, or `null` when there is none. */
export const nextShadow = (parts: number[], t: number): number | null => parts.find((s) => s > t + 1e-6) ?? null

// ------------------------------------------------------------------ the signal

export type CueStep = 'wait' | 'horn' | 'ring'
export interface CueState {
  step: CueStep
  /** who has answered since the horn: `leader` first, then the groups */
  done: string[]
}
export type CueEvent = { type: 'horn' } | { type: 'tap'; target: string }
export type CueResult = 'horn' | 'ok' | 'early' | 'order' | 'ring' | 'ignored'

/**
 * The course of one signal. While the child waits every tap is too early (a mistake). When the horn sounds, Gideon's jar comes first, then the groups in any order; a group before Gideon
 * is only a friendly hint (no mistake); when the last one has answered, the ring is closed.
 */
export function cuePhase(state: CueState, event: CueEvent, groups: string[]): { state: CueState; result: CueResult } {
  if (event.type === 'horn') return state.step === 'wait' ? { state: { step: 'horn', done: [] }, result: 'horn' } : { state, result: 'ignored' }
  if (state.step === 'wait') return { state, result: 'early' }
  if (state.step === 'ring' || state.done.includes(event.target)) return { state, result: 'ignored' }
  if (event.target !== 'leader' && !state.done.includes('leader')) return { state, result: 'order' }
  const done = [...state.done, event.target]
  const all = done.includes('leader') && groups.every((g) => done.includes(g))
  return { state: { step: all ? 'ring' : 'horn', done }, result: all ? 'ring' : 'ok' }
}

/** How long to wait for the signal number n (ms), always the same for the same seed. */
export function waitTime(seed: number, n: number, range: [number, number]): number {
  const r = seeded(seed * 4099 + n * 17 + 3)
  return Math.round(range[0] + r() * (range[1] - range[0]))
}
