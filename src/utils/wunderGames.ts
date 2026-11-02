/**
 * The pure parts of the five new games of "Jesus' Miracles at the Lake" (the components only draw and listen):
 * "Bail out the boat" (Mark 4,37: the waves throw water into the boat), "Through the crowd" (Mark 5,24: a great crowd presses round Jesus and Jairus),
 * "Pack the bundle" (Mark 6,8-9: nothing on the way but a staff, sandals and one shirt), "Share the bread" (Mark 6,39-43: five loaves, two fish, twelve baskets left)
 * and "Row against the wind" (Mark 6,48: the disciples strain at the oars, for the wind is against them).
 * Places are percent of the picture (3:2), the arithmetic has no clock of its own: the components give the seconds.
 */

// ---------------------------------------------------------------- 1. bail out the boat (`schoepfen`)

/** How many scoops one puddle takes. */
export const BAIL_SCOOPS = 3
/** Four puddles at the same time flood the boat (one mistake per round). */
export const BAIL_MAX = 4

/** One puddle in the boat: where it lies (a number of the places of the game) and how big it is (BAIL_SCOOPS = full, 1 = the last scoop). */
export interface Puddle {
  id: number
  spot: number
  size: number
}
/** The rule of a round: how many puddles have to be scooped away in all, and the seconds between two waves. */
export interface BailRule {
  total: number
  every: number
}
export interface BailState {
  puddles: Puddle[]
  /** How many puddles have appeared so far (the first ones included). */
  spawned: number
  /** How many puddles are scooped away. */
  removed: number
  /** Seconds since the last wave. */
  timer: number
  nextId: number
  /** At some time of the round four puddles lay in the boat together. */
  flooded: boolean
}

/** A free place for a new puddle (a number), chosen by `rand`; -1 when every place is taken. */
export function freeSpot(taken: readonly number[], spotCount: number, rand: () => number): number {
  const free: number[] = []
  for (let i = 0; i < spotCount; i++) if (!taken.includes(i)) free.push(i)
  if (!free.length) return -1
  return free[Math.min(free.length - 1, Math.floor(rand() * free.length))]!
}

function withPuddle(s: BailState, spotCount: number, rand: () => number): BailState {
  const spot = freeSpot(
    s.puddles.map((p) => p.spot),
    spotCount,
    rand
  )
  if (spot < 0) return s
  const puddles = [...s.puddles, { id: s.nextId, spot, size: BAIL_SCOOPS }]
  return { ...s, puddles, spawned: s.spawned + 1, nextId: s.nextId + 1, flooded: s.flooded || puddles.length >= BAIL_MAX }
}

/** The start of a round: two puddles lie in the boat (one when the round has only one). */
export function bailStart(rule: BailRule, spotCount: number, rand: () => number): BailState {
  let s: BailState = { puddles: [], spawned: 0, removed: 0, timer: 0, nextId: 1, flooded: false }
  for (let i = 0; i < Math.min(2, rule.total); i++) s = withPuddle(s, spotCount, rand)
  return s
}

/**
 * `dt` seconds go by: when `rule.every` seconds are over a wave throws a new puddle into the boat, as long as puddles are still to come. With four puddles in the boat
 * the wave waits (the clock begins again): there are never more than four.
 */
export function bailTick(s: BailState, dt: number, rule: BailRule, spotCount: number, rand: () => number): BailState {
  if (s.spawned >= rule.total) return s
  const timer = s.timer + dt
  if (timer < rule.every) return { ...s, timer }
  if (s.puddles.length >= BAIL_MAX) return { ...s, timer: 0 }
  return withPuddle({ ...s, timer: 0 }, spotCount, rand)
}

/** One scoop on a puddle: it gets smaller; the last scoop takes it away. `gone` says that this scoop removed it. */
export function bailTap(s: BailState, id: number): { state: BailState; gone: boolean; hit: boolean } {
  const p = s.puddles.find((x) => x.id === id)
  if (!p) return { state: s, gone: false, hit: false }
  if (p.size <= 1) return { state: { ...s, puddles: s.puddles.filter((x) => x.id !== id), removed: s.removed + 1 }, gone: true, hit: true }
  return { state: { ...s, puddles: s.puddles.map((x) => (x.id === id ? { ...x, size: x.size - 1 } : x)) }, gone: false, hit: true }
}

/** The round is over when every puddle of the round is scooped away. */
export function bailDone(s: BailState, rule: BailRule): boolean {
  return s.removed >= rule.total && s.puddles.length === 0
}

/** The size of a puddle picture: a full puddle is 1, the last scoop is about half. */
export function bailScale(size: number): number {
  return 0.45 + 0.55 * (Math.min(BAIL_SCOOPS, Math.max(0, size)) / BAIL_SCOOPS)
}

/** The puddle that "Help me" scoops: the smallest one (it is gone soonest); the first when all are equal. -1 when none lies in the boat. */
export function bailHelpTarget(s: BailState): number {
  let best: Puddle | undefined
  for (const p of s.puddles) if (!best || p.size < best.size) best = p
  return best ? best.id : -1
}

/** The problems of the data of a round (an empty list is good): puddles to scoop, a wave that does not come too fast, places enough for four puddles at once. */
export function bailRoundProblems(rule: BailRule, spotCount: number): string[] {
  const out: string[] = []
  if (rule.total < 1) out.push('no puddle to scoop')
  if (rule.every < 2) out.push('the waves come too fast')
  if (spotCount < BAIL_MAX + 1) out.push('too few places for the puddles')
  return out
}

// ---------------------------------------------------------------- 2. through the crowd (`gedraenge`)

export const CROWD_COLS = 5
export const CROWD_ROWS = 6
/** The pair walks in this column (the middle one) and never leaves it. */
export const CROWD_MID = 2

/** One row of the crowd: five places, 0 = free, a number from 1 = a person (the number says which of the pictures). */
export type CrowdRow = number[]

/**
 * Where a person goes when tapped: one place to the side, away from the pair's column first (in the middle column to the right first), the other side if that one is
 * taken. `pairCol` is the place of the pair when it stands in this row (nobody steps into it), otherwise -1. -1 when the person cannot move.
 */
export function crowdTarget(row: readonly number[], col: number, pairCol = -1): number {
  if (!row[col]) return -1
  const away = col < CROWD_MID ? -1 : 1
  for (const d of [away, -away]) {
    const n = col + d
    if (n >= 0 && n < row.length && !row[n] && n !== pairCol) return n
  }
  return -1
}

/** The row after the person at `col` stepped aside; null when it cannot. */
export function crowdMoveRow(row: readonly number[], col: number, pairCol = -1): number[] | null {
  const n = crowdTarget(row, col, pairCol)
  if (n < 0) return null
  const out = [...row]
  out[n] = out[col]!
  out[col] = 0
  return out
}

/**
 * The shortest list of taps (the columns, one after the other) that frees the middle place of the row; [] when it is free already; null when it cannot be freed.
 * (A breadth-first search over the places that are taken; the kinds of the people do not matter.)
 */
export function crowdSolveRow(row: readonly number[]): number[] | null {
  const start = row.map((c) => (c ? 1 : 0))
  if (!start[CROWD_MID]) return []
  const key = (r: readonly number[]) => r.join('')
  const seen = new Set<string>([key(start)])
  let layer: { row: number[]; taps: number[] }[] = [{ row: start, taps: [] }]
  while (layer.length) {
    const next: { row: number[]; taps: number[] }[] = []
    for (const { row: r, taps } of layer) {
      for (let c = 0; c < r.length; c++) {
        const moved = crowdMoveRow(r, c)
        if (!moved || seen.has(key(moved))) continue
        seen.add(key(moved))
        const path = [...taps, c]
        if (!moved[CROWD_MID]) return path
        next.push({ row: moved, taps: path })
      }
    }
    layer = next
  }
  return null
}

/** The grid of a round: the crowd rows (the first one is the top one) lie right above the row where the pair starts (the last row); above them the street is free. */
export function crowdBuild(rows: readonly (readonly number[])[]): number[][] {
  const grid: number[][] = Array.from({ length: CROWD_ROWS }, () => Array<number>(CROWD_COLS).fill(0))
  const first = CROWD_ROWS - 1 - rows.length
  rows.forEach((r, i) => {
    if (first + i >= 0 && first + i < CROWD_ROWS - 1) grid[first + i] = [...r]
  })
  return grid
}

/** The first grid row that holds a crowd row (where marking the progress begins). */
export function crowdFirstRow(rows: readonly (readonly number[])[]): number {
  return CROWD_ROWS - 1 - rows.length
}

/** Whether the pair in row `pairRow` can take its next step up: the place in front of it (the middle one of the row above) is free. */
export function crowdCanAdvance(grid: readonly (readonly number[])[], pairRow: number): boolean {
  return pairRow > 0 && !grid[pairRow - 1]?.[CROWD_MID]
}

/** The tap that "Help me" makes: the person in front of the pair who should step aside first; null when the way is free. */
export function crowdHelp(grid: readonly (readonly number[])[], pairRow: number): { row: number; col: number } | null {
  if (pairRow <= 0) return null
  const row = grid[pairRow - 1]
  if (!row) return null
  const taps = crowdSolveRow(row)
  if (!taps || !taps.length) return null
  return { row: pairRow - 1, col: taps[0]! }
}

/** The problems of the crowd rows of a round (an empty list is good): five places in a row, at least one free place in each (otherwise nobody can move), and the middle place can be freed. */
export function crowdProblems(rows: readonly (readonly number[])[]): string[] {
  const out: string[] = []
  if (rows.length < 1) out.push('no crowd row')
  if (rows.length > CROWD_ROWS - 1) out.push('too many rows')
  rows.forEach((r, i) => {
    if (r.length !== CROWD_COLS) out.push(`row ${i} does not have ${CROWD_COLS} places`)
    else if (!r.some((c) => !c)) out.push(`row ${i} has no free place`)
    else if (crowdSolveRow(r) === null) out.push(`the middle of row ${i} cannot be freed`)
  })
  return out
}

// ---------------------------------------------------------------- 3. pack the bundle (`buendel`)

export type BundleResult = 'ok' | 'wrong'

/** One tap on a thing: what Jesus allowed flies into the bundle, the rest stays on the cloth. */
export function bundleStep(allowed: boolean): BundleResult {
  return allowed ? 'ok' : 'wrong'
}

export interface BundleItemRule {
  allowed: boolean
}

/** The bundle is packed when every allowed thing of the round lies in it (`packed` are the numbers of the things). */
export function bundleDone(packed: readonly number[], items: readonly BundleItemRule[]): boolean {
  const need = items.map((it, i) => (it.allowed ? i : -1)).filter((i) => i >= 0)
  return need.length > 0 && need.every((i) => packed.includes(i))
}

/** The problems of the things of a round (an empty list is good): some allowed, some not, no two on top of each other, all on the cloth. `w` is the width of a thing (percent of the picture). */
export function bundleProblems(items: readonly { thing: string; allowed: boolean; x: number; y: number }[], w: number): string[] {
  const out: string[] = []
  if (!items.some((i) => i.allowed)) out.push('no allowed thing')
  if (!items.some((i) => !i.allowed)) out.push('no forbidden thing')
  if (new Set(items.map((i) => i.thing)).size !== items.length) out.push('a thing lies twice')
  items.forEach((a, i) => {
    if (a.x - w / 2 < 0 || a.x + w / 2 > 100 || a.y - w * 0.75 < 0 || a.y + w * 0.75 > 100) out.push(`thing ${i} lies outside the picture`)
    for (let k = i + 1; k < items.length; k++) {
      const b = items[k]!
      // the picture is 3:2: a thing as wide as `w` is `w * 1.5` high in percent of the height
      if (Math.abs(a.x - b.x) < w && Math.abs(a.y - b.y) < w * 1.5) out.push(`things ${i} and ${k} lie on top of each other`)
    }
  })
  return out
}

/** The first allowed thing that is not yet packed (what "Help me" packs); -1 when none is left. */
export function bundleHelpTarget(packed: readonly number[], items: readonly BundleItemRule[]): number {
  return items.findIndex((it, i) => it.allowed && !packed.includes(i))
}

// ---------------------------------------------------------------- 4. share the bread (`brote`)

/**
 * `n` places for the twelve baskets: a grid inside the area (percent of the picture, which is 3:2), every place moved a little by a fixed pseudo random jitter
 * (`seed`), so that the baskets lie in the grass as if thrown there, and never on top of each other.
 */
export function scatterSpots(n: number, area: { x: number; y: number; w: number; h: number }, seed: number): { x: number; y: number }[] {
  if (n <= 0) return []
  // the area is wider in real pixels than in percent of the height: 1 percent of the height is 2/3 of 1 percent of the width
  const ratio = (area.w * 3) / (area.h * 2)
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * ratio))))
  const rows = Math.ceil(n / cols)
  const cw = area.w / cols
  const ch = area.h / rows
  let a = seed >>> 0
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    out.push({
      x: area.x + (c + 0.5) * cw + (rand() - 0.5) * cw * 0.5,
      y: area.y + (r + 0.5) * ch + (rand() - 0.5) * ch * 0.5
    })
  }
  return out
}

/** Whether a group can be served: it is neither fed nor being served at this moment. */
export function breadCanServe(fed: boolean, serving: boolean): boolean {
  return !fed && !serving
}

/** The first group that is still hungry (what "Help me" serves); -1 when all are fed. */
export function breadNextHungry(fed: readonly boolean[], serving: readonly boolean[]): number {
  return fed.findIndex((f, i) => !f && !serving[i])
}

/** Stars for the sharing of the bread: only the taps on a group that is fed already count as a mistake (gently: three of them are free). */
export function breadStars(strayTaps: number): number {
  return strayTaps <= 3 ? 3 : strayTaps <= 7 ? 2 : 1
}

// ---------------------------------------------------------------- 5. row against the wind (`rudern`)

/** How far one stroke turns the boat (degrees): the left oar turns it to the right, the right oar to the left. */
export const ROW_TURN = 7
/** The boat never turns more than this (degrees to each side). */
export const ROW_MAX = 60
/** Within this angle the boat goes straight ahead: a stroke counts fully; beyond it only half. */
export const ROW_STRAIGHT = 30

export type Side = 'left' | 'right'

export interface RowState {
  /** The direction of the bow in degrees: 0 straight ahead, positive to the right. */
  heading: number
  /** How far the boat has come, in strokes (a stroke on a crooked boat counts half). */
  progress: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** One stroke of the left or right oar: it turns the boat and moves it ahead (fully when it points ahead, half when it is crooked). */
export function rowTap(s: RowState, side: Side): RowState {
  const heading = clamp(s.heading + (side === 'left' ? ROW_TURN : -ROW_TURN), -ROW_MAX, ROW_MAX)
  return { heading, progress: s.progress + (Math.abs(heading) <= ROW_STRAIGHT ? 1 : 0.5) }
}

/** The wind turns the bow on: `wind` degrees a second (positive to the right), for `dt` seconds. */
export function rowDrift(s: RowState, wind: number, dt: number): RowState {
  return { ...s, heading: clamp(s.heading + wind * dt, -ROW_MAX, ROW_MAX) }
}

/** The sideways place of the boat (percent of the width, 0 = the middle of the lake): it goes where the bow points, and the current brings it slowly back, never beyond `limit`. */
export function rowSway(x: number, heading: number, dt: number, limit = 36): number {
  const moved = x + Math.sin((heading * Math.PI) / 180) * 9 * dt
  return clamp(moved * (1 - 0.12 * dt), -limit, limit)
}

/** The boat has come far enough when its strokes reach the distance of the round. */
export function rowArrived(s: RowState, distance: number): boolean {
  return distance > 0 && s.progress >= distance
}

/** The height of the boat in the picture (percent from the top): from `from` at the start to `to` at the end of the distance. */
export function rowBoatY(progress: number, distance: number, from: number, to: number): number {
  if (distance <= 0) return from
  return from + (to - from) * clamp(progress / distance, 0, 1)
}

/** The side that "Help me" rows: against the turn when the boat is crooked, otherwise the other side than the stroke before. */
export function rowHelpSide(heading: number, last: Side | null): Side {
  if (heading > 4) return 'right'
  if (heading < -4) return 'left'
  return last === 'left' ? 'right' : 'left'
}

/** The seconds that count for the time: the gap since the last stroke, but a pause longer than three seconds counts three (whoever thinks is not punished). */
export function rowActive(gapMs: number): number {
  return clamp(gapMs, 0, 3000) / 1000
}

/** Stars by the time of both rounds (seconds of rowing): 70 or less three, 110 or less two, otherwise one. */
export function rowStars(seconds: number): number {
  return seconds <= 70 ? 3 : seconds <= 110 ? 2 : 1
}

/** The problems of the data of a round (an empty list is good): a distance of some strokes, a wind that can be fought (a stroke turns more than a second of wind). */
export function rowRoundProblems(round: { distance: number; wind: number }): string[] {
  const out: string[] = []
  if (round.distance < 10) out.push('the distance is too short')
  if (Math.abs(round.wind) >= ROW_TURN) out.push('the wind is too strong')
  return out
}
