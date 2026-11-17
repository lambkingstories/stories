/**
 * "Jonatans Pfeile": the search that tries shots in the simulator. It is used (1) by the level tool, which finds a robust solution for every
 * level (a shot whose neighbours still work: angle ±1.5°, power ±4 %), and (2) by the hint button of the game, which looks for a shot that
 * brings something in the game as it is just now. No Vue.
 */
import { DT, F_MIN, cloneGame, newGame, playShots, progressOf, settled, shoot, step, type Game, type LevelDef, type Shot } from './bogenGame'

/** The tolerance every solution has to keep: the neighbours of a shot must still do the same. */
export const TOL_ANGLE = 1.5
export const TOL_POWER = 0.04
export const TOL_TIME = 0.12

/** A copy of the game that shoots once and runs until everything has come to rest (or the game is won). */
export function runShot(g0: Game, a: number, f: number, wait = 0, maxSeconds = 14): Game {
  const g = cloneGame(g0)
  g.arrows = g.arrows.filter((x) => x.state === 'fly')
  if (wait > 0) {
    const until = g.t + wait
    while (g.t < until && g.status === 'play') step(g)
  }
  if (g.status === 'play') shoot(g, a, f)
  let n = 0
  while (g.status === 'play' && !settled(g) && n++ < maxSeconds / DT) step(g)
  return g
}

/** A word for what the game looks like (which things are done, which ropes cut, which gates open): shots with the same result are the same "class". */
export function signature(g: Game): string {
  let s = ''
  for (const i of g.items) s += i.done ? '1' : '0'
  for (const r of g.ropes) s += r.cut ? 'c' : 'r'
  for (const w of g.weights) s += w.state === 'hang' ? 'h' : w.state === 'fall' ? 'f' : 'd'
  for (const q of g.gates) s += q.open ? 'o' : 'g'
  return s
}

export interface Candidate {
  a: number
  f: number
  wait: number
  gain: number
  sig: string
  /** How far around this shot the same result holds (in grid steps, up to `maxMargin`). */
  margin: number
  won: boolean
}

export interface SearchOpts {
  aMin?: number
  aMax?: number
  aStep?: number
  fMin?: number
  fStep?: number
  waits?: number[]
  /** How many different classes of shots to return. */
  top?: number
}

/** The shots that bring something, one (the most robust) for every class of result, the biggest gain first. A coarse grid finds the places, the fine grid is tried only around them. */
export function searchShots(g: Game, o: SearchOpts = {}): Candidate[] {
  const aMin = o.aMin ?? -20
  const aMax = o.aMax ?? 72
  const aStep = o.aStep ?? 0.5
  const fMin = o.fMin ?? 0.2
  const fStep = o.fStep ?? 0.01
  const waits = o.waits ?? [0]
  const base = progressOf(g)
  const na = Math.round((aMax - aMin) / aStep) + 1
  const nf = Math.round((1 - fMin) / fStep) + 1
  const aSteps = Math.max(1, Math.round(TOL_ANGLE / aStep))
  const maxMargin = Math.max(aSteps, 6)
  const cs = Math.max(1, Math.round(aSteps))
  const all: Candidate[] = []
  for (const wait of waits) {
    const memo = new Map<number, { gain: number; sig: string; won: boolean }>()
    const ev = (i: number, j: number) => {
      const key = i * 4096 + j
      let m = memo.get(key)
      if (!m) {
        const r = runShot(g, aMin + i * aStep, fMin + j * fStep, wait)
        m = { gain: progressOf(r) - base, sig: signature(r), won: r.status === 'won' }
        memo.set(key, m)
      }
      return m
    }
    const cand = new Set<number>()
    for (let i = 0; i < na; i += cs)
      for (let j = 0; j < nf; j += cs)
        if (ev(i, j).gain > 0)
          for (let di = -cs; di <= cs; di++)
            for (let dj = -cs; dj <= cs; dj++) {
              const ii = i + di
              const jj = j + dj
              if (ii >= 0 && ii < na && jj >= 0 && jj < nf) cand.add(ii * 4096 + jj)
            }
    for (const key of cand) {
      const i = Math.floor(key / 4096)
      const j = key % 4096
      const me = ev(i, j)
      if (me.gain <= 0) continue
      const f = fMin + j * fStep
      const fSteps = Math.max(1, Math.ceil((TOL_POWER * f) / fStep))
      // how far along both axes (angle and power) the same result holds
      let m = 0
      for (; m < maxMargin; m++) {
        const ma = m + 1
        const mf = Math.max(1, Math.round((fSteps * ma) / aSteps))
        let ok = true
        for (let d = -ma; d <= ma && ok; d++) {
          const ii = i + d
          if (ii < 0 || ii >= na || ev(ii, j).sig !== me.sig) ok = false
        }
        for (let d = -mf; d <= mf && ok; d++) {
          const jj = j + d
          if (jj < 0 || jj >= nf || ev(i, jj).sig !== me.sig) ok = false
        }
        if (!ok) break
      }
      all.push({ a: aMin + i * aStep, f, wait, gain: me.gain, sig: me.sig, margin: m, won: me.won })
    }
  }
  // one representative per class: the one with the largest margin
  const score = (c: Candidate) => c.margin - Math.max(0, c.a - 46) / 6
  const best = new Map<string, Candidate>()
  for (const c of all) {
    const old = best.get(c.sig)
    if (!old || score(c) > score(old) || (score(c) === score(old) && c.wait < old.wait)) best.set(c.sig, c)
  }
  let list = [...best.values()]
  const robust = list.filter((c) => c.margin >= aSteps)
  if (robust.length) list = robust
  list.sort((x, y) => (y.won ? 1 : 0) - (x.won ? 1 : 0) || y.gain - x.gain || score(y) - score(x))
  return list.slice(0, o.top ?? 3)
}

/** Does a solution keep working when every shot is a little off (angle ±1.5°, power ±4 %, time ±0.12 s)? Returns what went wrong, or an empty list. */
export function toleranceFails(def: LevelDef, par: number, shots: Shot[]): string[] {
  const fails: string[] = []
  const tryIt = (k: number, da: number, df: number, dt: number, label: string) => {
    const s = shots.map((x, i) => (i === k ? { a: x.a + da, f: Math.min(1, x.f * (1 + df)), at: x.at === undefined ? undefined : x.at + dt } : x))
    if (playShots(def, par, s).status !== 'won') fails.push(`shot ${k + 1}: ${label}`)
  }
  for (let k = 0; k < shots.length; k++) {
    tryIt(k, TOL_ANGLE, 0, 0, 'angle +1.5')
    tryIt(k, -TOL_ANGLE, 0, 0, 'angle -1.5')
    tryIt(k, 0, TOL_POWER, 0, 'power +4%')
    tryIt(k, 0, -TOL_POWER, 0, 'power -4%')
    if (shots[k]!.at !== undefined) {
      tryIt(k, 0, 0, TOL_TIME, 'time +0.12')
      tryIt(k, 0, 0, -TOL_TIME, 'time -0.12')
    }
  }
  return fails
}

export interface Solution {
  shots: Shot[]
}

/** Looks for a list of shots that wins the level; tries the best class first and deepens when needed. */
export function solveLevel(def: LevelDef, o: { maxDepth?: number; width?: number; waits?: number[]; aStep?: number; fStep?: number } = {}): Shot[] | null {
  const maxDepth = o.maxDepth ?? 8
  const hasMotion = def.items.some((i) => i.motion)
  const waits = o.waits ?? (hasMotion ? [0, 0.4, 0.8, 1.2, 1.6, 2, 2.4, 2.8, 3.2, 3.6, 4, 4.4, 4.8, 5.2] : [0])
  const deepen = (g: Game, depth: number, limit: number, width: number): Shot[] | null => {
    if (g.status === 'won') return []
    if (depth >= limit) return null
    const cands = searchShots(g, { waits, top: width, aStep: o.aStep, fStep: o.fStep })
    for (const c of cands) {
      const r = runShot(g, c.a, c.f, c.wait)
      const rest = deepen(r, depth + 1, limit, width)
      if (rest) return [{ a: c.a, f: c.f, ...(c.wait > 0 || hasMotion ? { at: Math.round((g.t + c.wait) * 1000) / 1000 } : {}) }, ...rest]
    }
    return null
  }
  for (const width of [o.width ?? 1, 3])
    for (let limit = 1; limit <= (width === 1 ? maxDepth : Math.min(maxDepth, 5)); limit++) {
      const r = deepen(newGame(def, 0), 0, limit, width)
      if (r) return r
    }
  return null
}

/** A shot for the hint button: the best robust shot that brings something in the game as it is now (coarser and quicker than the tool's search). */
export function findHint(g: Game): { a: number; f: number; wait: number } | null {
  const hasMotion = g.def.items.some((i) => i.motion)
  const waits = hasMotion ? [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2, 4.9] : [0]
  const c = searchShots(g, { aStep: 1, fStep: 0.025, waits, top: 1, aMin: -15 })[0]
  if (!c) return null
  return { a: c.a, f: c.f, wait: c.wait }
}

export { F_MIN }
