/**
 * The pure parts of the four new games of "Hiskia: Ein Brief vor Gott" (id `hiskia`, 2 Kings 18-20, 2 Chronicles 30 and 32); the components only draw and listen:
 * 1. "Send the runners" (`laufwege`, field `runRoutes`, 2 Chronicles 30,5-12): Hezekiah has letters carried from town to town. Every runner has three letters, every town gets exactly one;
 *    the child plans which runner goes to which towns, along the given roads. The number of runners, letters and the roads are rules of the game, not words of the Bible.
 * 2. "The city wakes up" (`stadtmorgen`, field `cityMorning`, 2 Kings 19,35): houses on a slope, their doors still shut; a tap turns the door of the house and the doors next to it (a puzzle with
 *    "neighbours"); when every door is open the morning has come. The rule of the neighbours is a rule of the game.
 * 3. "How many steps?" (`sonnenuhr`, field `sundial`, 2 Kings 20,8-11): the shadow on the stairs of Ahaz; the child shows with the tip of the shadow where it will stand after three steps forward and
 *    after ten steps back, and counts step by step. Only afterwards the shadow moves by itself. The 14 steps and the three steps of round 1 are rules of the game.
 * 4. "Meeting in the rock" (`stollen`, field `tunnel`, 2 Kings 20,20, 2 Chronicles 32,30): two crews dig through the rock from both ends; the child chooses the direction of the next piece for each crew
 *    (up, straight, down), dark rock layers push the tunnel aside, and the two tunnels should meet in the middle. That two crews dug from both sides is not in the Bible (it is known from an
 *    inscription); here it is only a rule of the game.
 * All places are percent of the picture (width and height, 3:2 unless `ratio` says otherwise); a width is percent of the width of the picture. The arithmetic has no clock and no dice.
 */

export interface Pt {
  x: number
  y: number
}

/** The width of the screen the sizes are checked against (pixels). */
export const HISKIA_PHONE_W = 360
/** The smallest finger target (pixels). */
export const HISKIA_TOUCH = 44
/** A percent of the width of the picture in pixels on a phone. */
const pxW = (w: number) => (w / 100) * HISKIA_PHONE_W
/** A percent of the height of the picture in pixels on a phone (the picture is `ratio` times as wide as high). */
const pxH = (h: number, ratio: number) => (h / 100) * (HISKIA_PHONE_W / ratio)

/** A box in percent of the picture: `x`, `y` the middle, `w` the width (percent of the width), `h` the height (percent of the height). */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}
const boxInside = (b: Box): boolean => b.x - b.w / 2 >= -0.01 && b.x + b.w / 2 <= 100.01 && b.y - b.h / 2 >= -0.01 && b.y + b.h / 2 <= 100.01
const boxesMeet = (a: Box, b: Box): boolean => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2
/** The box of a sprite given by its middle: `w` its width (percent of the width), `ratio` the ratio (width / height) of its picture, `pic` the ratio of the whole picture. */
const midBox = (s: { x: number; y: number; w: number }, ratio: number, pic: number): Box => ({ x: s.x, y: s.y, w: s.w, h: (s.w * pic) / ratio })
/** The box of a sprite whose lower middle (the feet) is at `x`, `y`. */
const footBox = (s: { x: number; y: number; w: number }, ratio: number, pic: number): Box => {
  const h = (s.w * pic) / ratio
  return { x: s.x, y: s.y - h / 2, w: s.w, h }
}
/** The distance of two places of a picture in pixels on a phone. */
const pxDist = (a: Pt, b: Pt, pic: number): number => Math.hypot(pxW(a.x - b.x), pxH(a.y - b.y, pic))

// ================================================================ 1. send the runners (`laufwege`)

export const RUN_CITY = 'J'
/** A town: the picture (200 x 170), the name a screen reader says, the middle (percent of the picture), the width, and what its people do when the letter comes. */
export interface RunTown {
  id: string
  image: string
  label: string
  x: number
  y: number
  w: number
  reacts: 'comes' | 'laughs'
}
export interface RunRound {
  hint: string
  runners: number
  letters: number
  towns: RunTown[]
  /** The roads: pairs of town ids; `J` is Jerusalem. A road never lies on a third town. */
  roads: [string, string][]
}
export interface RunRunner {
  image: string
  label: string
}
/**
 * The game "Send the runners" (`laufwege`): the map of the hill country (3:2, no roads, no towns, nobody in it). Jerusalem stands at `city` (its middle, its width; picture 280 x 220), the towns of the
 * round on the map; the roads are drawn by the code from the data (`road`, 600 x 56, stretched and turned, `roadH` the thickness). The runners wait at the places of `waiting` (the middle of their feet), their
 * pictures are 260 x 380; the letters are 90 x 120; `step` (56 x 56) is the footprint that lies on the way to Jerusalem when a town sets out; `scenes` (360 x 280) shows what the people do.
 */
export interface RunRoutesGame {
  background: string
  ratio?: number
  city: { image: string; label: string; x: number; y: number; w: number }
  cityRatio: number
  townRatio: number
  runners: RunRunner[]
  runnerRatio: number
  runnerW: number
  waiting: Pt[]
  road: string
  roadH: number
  step: string
  letter: string
  letterRatio: number
  letterW: number
  scenes: { comes: string; laughs: string }
  sceneRatio: number
  sceneW: number
  rounds: RunRound[]
}

/** The state of a round: where every runner is (`J` or a town), how many letters he has left, the towns that have a letter, and the moves made (for "one step back"). */
export interface RunMove {
  runner: number
  from: string
  to: string
}
export interface RunState {
  pos: string[]
  left: number[]
  got: string[]
  log: RunMove[]
}
export type RunCheck = 'ok' | 'empty' | 'city' | 'noroad' | 'taken'

export const RUN_STEP_MS = 9000
export const RUN_ROUND_MAX_MS = 90000
/** The smallest distance of two towns, and of a town to a road that is not its own, on a phone (pixels). */
export const RUN_TOWN_GAP_PX = 56
export const RUN_ROAD_GAP_PX = 44

export const runStart = (round: RunRound): RunState => ({ pos: Array.from({ length: round.runners }, () => RUN_CITY), left: Array.from({ length: round.runners }, () => round.letters), got: [], log: [] })
/** The places a road leads to from `id` (town ids, `J` for Jerusalem). */
export const runNeighbors = (round: RunRound, id: string): string[] => round.roads.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []))
/** May runner `r` go to `to` now? */
export function runCheck(round: RunRound, st: RunState, r: number, to: string): RunCheck {
  if ((st.left[r] ?? 0) <= 0) return 'empty'
  if (to === RUN_CITY) return 'city'
  if (!runNeighbors(round, st.pos[r] ?? RUN_CITY).includes(to)) return 'noroad'
  if (st.got.includes(to)) return 'taken'
  return 'ok'
}
/** The state after runner `r` ran to `to` and left a letter there, or null when that is not allowed. */
export function runStep(round: RunRound, st: RunState, r: number, to: string): RunState | null {
  if (runCheck(round, st, r, to) !== 'ok') return null
  const pos = [...st.pos]
  const left = [...st.left]
  const from = pos[r]!
  pos[r] = to
  left[r] = left[r]! - 1
  return { pos, left, got: [...st.got, to], log: [...st.log, { runner: r, from, to }] }
}
/** One step back: the last move of the last runner who moved is taken back. */
export function runUndo(st: RunState): RunState {
  const m = st.log[st.log.length - 1]
  if (!m) return st
  const pos = [...st.pos]
  const left = [...st.left]
  pos[m.runner] = m.from
  left[m.runner] = left[m.runner]! + 1
  return { pos, left, got: st.got.filter((t) => t !== m.to), log: st.log.slice(0, -1) }
}
/** Has every town a letter? */
export const runDone = (round: RunRound, st: RunState): boolean => round.towns.every((t) => st.got.includes(t.id))
const runKey = (st: RunState): string => `${st.pos.join(',')}|${st.left.join(',')}|${[...st.got].sort().join(',')}`
/** All moves that are allowed in a state. */
export function runMoves(round: RunRound, st: RunState): { runner: number; to: string }[] {
  const out: { runner: number; to: string }[] = []
  for (let r = 0; r < st.pos.length; r++)
    for (const to of runNeighbors(round, st.pos[r]!)) if (runCheck(round, st, r, to) === 'ok') out.push({ runner: r, to })
  return out
}
/** A way from a state to "every town has a letter" (depth-first search over all moves, the first one found), or null when there is none. */
export function runSolve(round: RunRound, st: RunState): { runner: number; to: string }[] | null {
  const dead = new Set<string>()
  const go = (cur: RunState): { runner: number; to: string }[] | null => {
    if (runDone(round, cur)) return []
    const k = runKey(cur)
    if (dead.has(k)) return null
    for (const m of runMoves(round, cur)) {
      const next = runStep(round, cur, m.runner, m.to)!
      const rest = go(next)
      if (rest) return [m, ...rest]
    }
    dead.add(k)
    return null
  }
  return go(st)
}
/** What "Help me" shows: the first move of a way from the CURRENT state (null when the round is solved or no way is left). */
export const runHint = (round: RunRound, st: RunState): { runner: number; to: string } | null => runSolve(round, st)?.[0] ?? null
/** No way leads to a letter in every town any more (and the round is not solved). */
export const runStuck = (round: RunRound, st: RunState): boolean => !runDone(round, st) && runSolve(round, st) === null
/** Every way to share out the letters: the set of the paths of the runners (a path is the list of towns one runner visits, in order), sorted so that the same share gives the same text. */
export function runSolutions(round: RunRound): string[][][] {
  const ids = round.towns.map((t) => t.id)
  const all: string[][] = [[]]
  const walk = (cur: string, path: string[]) => {
    if (path.length >= round.letters) return
    for (const nb of runNeighbors(round, cur)) {
      if (nb === RUN_CITY || path.includes(nb)) continue
      all.push([...path, nb])
      walk(nb, [...path, nb])
    }
  }
  walk(RUN_CITY, [])
  const found = new Map<string, string[][]>()
  const pick = (from: number, left: number, chosen: string[][]) => {
    if (left === 0) {
      const used = chosen.flat()
      if (used.length === new Set(used).size && ids.every((i) => used.includes(i))) {
        const sorted = [...chosen].sort((a, b) => a.join('>').localeCompare(b.join('>')))
        found.set(sorted.map((p) => p.join('>')).join('|'), sorted)
      }
      return
    }
    for (let i = from; i < all.length; i++) pick(i, left - 1, [...chosen, all[i]!])
  }
  pick(0, round.runners, [])
  return [...found.values()]
}

const segDistance = (p: Pt, a: Pt, b: Pt): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}
const orient = (a: Pt, b: Pt, c: Pt): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
/** Do the segments a-b and c-d cross (not only touch at an end)? */
const segCross = (a: Pt, b: Pt, c: Pt, d: Pt): boolean => {
  const o1 = orient(a, b, c)
  const o2 = orient(a, b, d)
  const o3 = orient(c, d, a)
  const o4 = orient(c, d, b)
  return o1 * o2 < 0 && o3 * o4 < 0
}

/** The problems of the data of `laufwege` (an empty list is good). */
export function runRoutesProblems(game: RunRoutesGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the map')
  if (!game.city?.image) out.push('no picture of Jerusalem')
  for (const [k, v] of Object.entries({ road: game.road, step: game.step, letter: game.letter, comes: game.scenes?.comes, laughs: game.scenes?.laughs })) if (!v) out.push(`no picture: ${k}`)
  for (const [k, v] of Object.entries({ cityRatio: game.cityRatio, townRatio: game.townRatio, runnerRatio: game.runnerRatio, letterRatio: game.letterRatio, sceneRatio: game.sceneRatio }))
    if (!(v > 0.2 && v < 5)) out.push(`${k} is not sensible`)
  if (game.runners.length < 3) out.push('three runners are needed')
  if (new Set(game.runners.map((r) => r.image)).size !== game.runners.length) out.push('two runners have the same picture')
  for (const r of game.runners) if (!r.image || !r.label) out.push('a runner needs a picture and a name')
  if (!(game.roadH > 0.5 && game.roadH < 8)) out.push('the roads have no sensible thickness')
  // ---- the runners on a phone: wide enough (about 40 px), a finger target of at least 44 px, standing in the picture
  if (pxW(game.runnerW) < 40) out.push('a runner is narrower than 40 pixels on a phone')
  if (game.waiting.length < 3) out.push('three waiting places are needed')
  for (const [i, w] of game.waiting.entries()) if (!boxInside(footBox({ x: w.x, y: w.y, w: game.runnerW }, game.runnerRatio, ratio))) out.push(`the waiting place of runner ${i + 1} lies outside the picture`)
  for (let a = 0; a < game.waiting.length; a++)
    for (let b = a + 1; b < game.waiting.length; b++) if (Math.abs(game.waiting[a]!.x - game.waiting[b]!.x) < game.runnerW * 0.9 && Math.abs(game.waiting[a]!.y - game.waiting[b]!.y) < 4) out.push('two waiting runners stand on each other')
  const cityBox = midBox(game.city, game.cityRatio, ratio)
  if (!boxInside(cityBox)) out.push('Jerusalem lies outside the picture')
  // ---- the rounds
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const wantRunners = [2, 3]
  const wantTowns = [5, 7]
  const wantComes = [2, 4]
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (r.runners !== wantRunners[i]) out.push(`round ${n} needs ${wantRunners[i]} runners`)
    if (r.runners > game.runners.length) out.push(`round ${n}: not enough runner pictures`)
    if (r.letters !== 3) out.push(`round ${n}: every runner has three letters`)
    if (r.towns.length !== wantTowns[i]) out.push(`round ${n} needs ${wantTowns[i]} towns`)
    const ids = r.towns.map((t) => t.id)
    if (new Set(ids).size !== ids.length) out.push(`round ${n}: two towns have the same id`)
    if (ids.includes(RUN_CITY)) out.push(`round ${n}: no town may be called ${RUN_CITY}`)
    const places = new Map<string, Pt>([[RUN_CITY, game.city], ...r.towns.map((t) => [t.id, t] as [string, Pt])])
    for (const t of r.towns) {
      if (!t.image || !t.label) out.push(`round ${n}: ${t.id} needs a picture and a name`)
      if (!boxInside(midBox(t, game.townRatio, ratio))) out.push(`round ${n}: town ${t.id} lies outside the picture`)
      if (pxW(t.w) < HISKIA_TOUCH || pxH((t.w * ratio) / game.townRatio, ratio) < HISKIA_TOUCH) out.push(`round ${n}: town ${t.id} is smaller than 44 pixels on a phone`)
      if (boxesMeet(midBox(t, game.townRatio, ratio), cityBox)) out.push(`round ${n}: town ${t.id} lies on Jerusalem`)
    }
    // the roads
    for (const [a, b] of r.roads) if (!places.has(a) || !places.has(b)) out.push(`round ${n}: the road ${a}-${b} leads nowhere`)
    const roads = r.roads.filter(([a, b]) => places.has(a) && places.has(b))
    if (new Set(roads.map(([a, b]) => [a, b].sort().join('-'))).size !== roads.length) out.push(`round ${n}: a road is there twice`)
    if (runNeighbors(r, RUN_CITY).length < 2) out.push(`round ${n}: at least two roads must lead away from Jerusalem`)
    // every town can be reached from Jerusalem
    const seen = new Set<string>([RUN_CITY])
    for (let grown = true; grown; ) {
      grown = false
      for (const [a, b] of roads) {
        if (seen.has(a) && !seen.has(b)) (seen.add(b), (grown = true))
        if (seen.has(b) && !seen.has(a)) (seen.add(a), (grown = true))
      }
    }
    for (const id of ids) if (!seen.has(id)) out.push(`round ${n}: town ${id} cannot be reached`)
    // distances on a phone
    const all = [...places.entries()]
    for (let a = 0; a < all.length; a++)
      for (let b = a + 1; b < all.length; b++) {
        const d = pxDist(all[a]![1], all[b]![1], ratio)
        if (d < RUN_TOWN_GAP_PX) out.push(`round ${n}: ${all[a]![0]} and ${all[b]![0]} are only ${d.toFixed(0)} pixels apart (at least ${RUN_TOWN_GAP_PX})`)
      }
    // no road lies close to a third place, no two roads cross
    const toPx = (p: Pt): Pt => ({ x: pxW(p.x), y: pxH(p.y, ratio) })
    for (const [a, b] of roads)
      for (const [id, p] of all) {
        if (id === a || id === b) continue
        const d = segDistance(toPx(p), toPx(places.get(a)!), toPx(places.get(b)!))
        if (d <= RUN_ROAD_GAP_PX) out.push(`round ${n}: the road ${a}-${b} passes ${id} at only ${d.toFixed(0)} pixels`)
      }
    for (let a = 0; a < roads.length; a++)
      for (let b = a + 1; b < roads.length; b++) {
        const [a1, a2] = roads[a]!
        const [b1, b2] = roads[b]!
        if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue
        if (segCross(places.get(a1)!, places.get(a2)!, places.get(b1)!, places.get(b2)!)) out.push(`round ${n}: the roads ${a1}-${a2} and ${b1}-${b2} cross`)
      }
    // exactly one way to share the letters, nobody carries more than the letters he has
    const sols = runSolutions(r)
    if (sols.length !== 1) out.push(`round ${n}: ${sols.length} ways to share the letters (exactly one wanted)`)
    for (const s of sols) for (const p of s) if (p.length > r.letters) out.push(`round ${n}: a runner needs more than ${r.letters} letters`)
    // what the people do
    const comes = r.towns.filter((t) => t.reacts === 'comes').length
    const laughs = r.towns.filter((t) => t.reacts === 'laughs').length
    if (comes !== wantComes[i]) out.push(`round ${n}: ${wantComes[i]} towns set out, ${comes} do`)
    if (laughs < 2) out.push(`round ${n}: more than one town must laugh`)
    if (i === 1) {
      const near = [...r.towns].sort((a, b) => pxDist(a, game.city, ratio) - pxDist(b, game.city, ratio)).slice(0, 3)
      if (near.some((t) => t.reacts !== 'comes')) out.push('round 2: the three towns next to Jerusalem (Judah) all come')
    }
    // the help finds a move at the start and solves the round without a dead end
    let cur = runStart(r)
    for (let k = 0; k < 20 && !runDone(r, cur); k++) {
      const h = runHint(r, cur)
      const next = h ? runStep(r, cur, h.runner, h.to) : null
      if (!next) {
        out.push(`round ${n}: the help finds nothing`)
        break
      }
      cur = next
    }
    if (!runDone(r, cur)) out.push(`round ${n}: the help does not solve it`)
    // one step back restores the state
    const first = runHint(r, runStart(r))
    if (first) {
      const s1 = runStep(r, runStart(r), first.runner, first.to)!
      if (JSON.stringify(runUndo(s1)) !== JSON.stringify(runStart(r))) out.push(`round ${n}: "one step back" does not restore the state`)
    }
    if (r.towns.length * RUN_STEP_MS > RUN_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${RUN_ROUND_MAX_MS / 1000} seconds`)
  })
  return out
}

// ================================================================ 2. the city wakes up (`stadtmorgen`)

export interface MorningRound {
  hint: string
  cols: number
  rows: number
  /** Door shut for every house, from the top left, row by row. */
  shut: boolean[]
  /** The area of the grid on the slope (percent of the picture): the top left corner, the width, the height. */
  grid: { x: number; y: number; w: number; h: number }
}
/**
 * The game "The city wakes up" (`stadtmorgen`): the slope of Jerusalem in the clear light of the morning (3:4, no houses). The houses lie in a grid on the terraces (two shapes in turn, each with a shut and an open
 * door, 280 x 260); `fill` is how much of the width of its cell a house takes.
 */
export interface CityMorningGame {
  background: string
  ratio?: number
  houses: { shut: string; open: string }[]
  houseRatio: number
  fill: number
  rounds: MorningRound[]
}
export const MORNING_ROUND_MAX_MS = 90000
export const MORNING_TAP_MS = 8000

/** The houses a tap on house `i` turns: itself and the neighbours above, below, left and right. */
export function morningTouched(cols: number, rows: number, i: number): number[] {
  const r = Math.floor(i / cols)
  const c = i % cols
  const out = [i]
  if (r > 0) out.push(i - cols)
  if (r < rows - 1) out.push(i + cols)
  if (c > 0) out.push(i - 1)
  if (c < cols - 1) out.push(i + 1)
  return out.sort((a, b) => a - b)
}
/** The doors after a tap on house `i` (true = shut). */
export function morningTap(shut: readonly boolean[], cols: number, rows: number, i: number): boolean[] {
  const next = [...shut]
  for (const k of morningTouched(cols, rows, i)) next[k] = !next[k]
  return next
}
export const morningOpenAll = (shut: readonly boolean[]): boolean => shut.length > 0 && shut.every((s) => !s)
/** The shortest sets of taps that open every door (the order does not matter; a house is tapped once). Searches all sets (the grid has at most 16 houses). */
export function morningSolutions(shut: readonly boolean[], cols: number, rows: number): number[][] {
  const n = cols * rows
  if (n > 16 || shut.length !== n) return []
  const toggle = Array.from({ length: n }, (_, i) => morningTouched(cols, rows, i).reduce((m, k) => m | (1 << k), 0))
  let start = 0
  shut.forEach((s, i) => {
    if (s) start |= 1 << i
  })
  let bestWeight = Infinity
  let best: number[][] = []
  for (let mask = 0; mask < 1 << n; mask++) {
    let state = start
    let weight = 0
    for (let i = 0; i < n; i++)
      if (mask & (1 << i)) {
        state ^= toggle[i]!
        weight++
      }
    if (state !== 0 || weight > bestWeight) continue
    const taps = Array.from({ length: n }, (_, i) => i).filter((i) => mask & (1 << i))
    if (weight < bestWeight) {
      bestWeight = weight
      best = []
    }
    best.push(taps)
  }
  return best
}
/** The shortest tap list (the first one when there are several) or null. */
export const solveMorning = (shut: readonly boolean[], cols: number, rows: number): number[] | null => morningSolutions(shut, cols, rows)[0] ?? null
/** What "Help me" shows: the first house of a shortest way from the CURRENT state. */
export const hintTap = (shut: readonly boolean[], cols: number, rows: number): number | null => solveMorning(shut, cols, rows)?.[0] ?? null
/** The box of house `i` of a round: the cell of the grid (percent of the picture, the middle and the size) and the house in it (width = `fill` of the cell, standing on the bottom of the cell). */
export function morningCell(round: MorningRound, i: number): Box {
  const r = Math.floor(i / round.cols)
  const c = i % round.cols
  const w = round.grid.w / round.cols
  const h = round.grid.h / round.rows
  return { x: round.grid.x + (c + 0.5) * w, y: round.grid.y + (r + 0.5) * h, w, h }
}
export function morningHouseBox(game: CityMorningGame, round: MorningRound, i: number): Box {
  const cell = morningCell(round, i)
  const pic = game.ratio ?? 0.75
  const w = cell.w * game.fill
  const h = (w * pic) / game.houseRatio
  return { x: cell.x, y: cell.y + cell.h / 2 - h / 2, w, h }
}

/** The problems of the data of `stadtmorgen` (an empty list is good). */
export function cityMorningProblems(game: CityMorningGame): string[] {
  const out: string[] = []
  const pic = game.ratio ?? 0.75
  if (!game.background) out.push('no picture of the slope')
  if (game.houses.length < 2) out.push('two house shapes are needed')
  for (const h of game.houses) if (!h.shut || !h.open) out.push('a house needs a picture with a shut and one with an open door')
  if (!(game.houseRatio > 0.5 && game.houseRatio < 2)) out.push('the ratio of the houses is not sensible')
  if (!(game.fill > 0.5 && game.fill <= 1)) out.push('the houses fill the cells in a strange way')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const want = [{ cols: 3, rows: 3, shut: 3, taps: 3 }, { cols: 3, rows: 4, shut: 7, taps: 5 }]
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const w = want[i]
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (w && (r.cols !== w.cols || r.rows !== w.rows)) out.push(`round ${n} needs a grid of ${w.cols} x ${w.rows} houses`)
    if (r.shut.length !== r.cols * r.rows) out.push(`round ${n}: the doors do not fit the grid`)
    if (w && r.shut.filter(Boolean).length !== w.shut) out.push(`round ${n} needs ${w.shut} shut doors at the start`)
    if (morningOpenAll(r.shut)) out.push(`round ${n} is solved at the start`)
    const sols = morningSolutions(r.shut, r.cols, r.rows)
    if (sols.length === 0) out.push(`round ${n} cannot be solved`)
    if (sols.length !== 1) out.push(`round ${n}: ${sols.length} shortest ways (exactly one wanted)`)
    if (w && sols[0] && sols[0].length !== w.taps) out.push(`round ${n}: the shortest way has ${sols[0].length} taps, ${w.taps} wanted`)
    // after the taps of the solution every door is open
    let cur = [...r.shut]
    for (const k of sols[0] ?? []) cur = morningTap(cur, r.cols, r.rows, k)
    if (!morningOpenAll(cur)) out.push(`round ${n}: the solution does not open every door`)
    // the help opens the round without an extra tap
    cur = [...r.shut]
    for (let k = 0; k < 30 && !morningOpenAll(cur); k++) {
      const h = hintTap(cur, r.cols, r.rows)
      if (h === null) break
      cur = morningTap(cur, r.cols, r.rows, h)
    }
    if (!morningOpenAll(cur)) out.push(`round ${n}: the help does not solve it`)
    if (!(r.grid.w > 20 && r.grid.h > 10)) out.push(`round ${n}: the grid is too small`)
    for (let k = 0; k < r.shut.length; k++) {
      const cell = morningCell(r, k)
      if (pxW(cell.w) < HISKIA_TOUCH || pxH(cell.h, pic) < HISKIA_TOUCH) out.push(`round ${n}: house ${k + 1} is smaller than 44 x 44 pixels on a phone`)
      if (!boxInside(cell)) out.push(`round ${n}: house ${k + 1} lies outside the picture`)
    }
    if (r.cols * r.rows * MORNING_TAP_MS > MORNING_ROUND_MAX_MS * 2) out.push(`round ${n}: lasts too long`)
  })
  return out
}

// ================================================================ 3. how many steps? (`sonnenuhr`)

export interface SundialRound {
  hint: string
  /** The step the shadow stands on at the start (1 = the top). */
  start: number
  /** How many steps it goes. */
  steps: number
  /** 1 = forward, down the stairs; -1 = back, up the stairs. */
  dir: 1 | -1
}
/**
 * The game "How many steps?" (`sonnenuhr`): the stairs of Ahaz (3:4) with fourteen steps, a mark (notch) at the left of every step, the post on the terrace at the top. The shadow (`shadow`, 220 x 600,
 * stretched in length) lies from the foot of the post `post` down to the step it stands on; the handle (`tip`, 160 x 160, `tipW` its width) is the tip of the shadow that the child pulls. `treads`: the middle
 * of every step (percent of the height, from the top), measured on the painted picture. `shadowW`: the width of the shadow (percent of the width); `notchX`: where the notches lie (percent of the width).
 */
export interface SundialGame {
  background: string
  ratio?: number
  treads: number[]
  post: Pt
  shadow: string
  shadowW: number
  tip: string
  tipW: number
  notchX: number
  rounds: SundialRound[]
}
export const SUNDIAL_TREADS = 14
export const SUNDIAL_ROUND_MAX_MS = 60000
export const SUNDIAL_TIP_PX = 56
export const SUNDIAL_DONE_PX = 56

/** The step the shadow stands on after the round (start + dir x steps). */
export const targetStep = (round: SundialRound): number => round.start + round.dir * round.steps
/** How many steps lie between two steps. */
export const stepsMoved = (from: number, to: number): number => Math.abs(to - from)
/** The step (1-based) whose middle lies nearest to `y` (percent of the height). */
export function snapToTread(y: number, treads: readonly number[]): number {
  let best = 1
  for (let i = 1; i < treads.length; i++) if (Math.abs(treads[i]! - y) < Math.abs(treads[best - 1]! - y)) best = i + 1
  return best
}
/** The length of the shadow (percent of the height) when it stands on `step`: from the foot of the post to the middle of that step. */
export const shadowLength = (treads: readonly number[], post: Pt, step: number): number => Math.max(0, (treads[Math.min(Math.max(step, 1), treads.length) - 1] ?? post.y) - post.y)

/** The problems of the data of `sonnenuhr` (an empty list is good). */
export function sundialProblems(game: SundialGame): string[] {
  const out: string[] = []
  const pic = game.ratio ?? 0.75
  if (!game.background || !game.shadow || !game.tip) out.push('a picture is missing (stairs, shadow, handle)')
  const t = game.treads
  if (t.length !== SUNDIAL_TREADS) out.push(`${SUNDIAL_TREADS} steps are needed, ${t.length} are there`)
  for (let i = 1; i < t.length; i++) {
    if (!(t[i]! > t[i - 1]!)) out.push(`step ${i + 1} does not lie below step ${i}`)
    else if (t[i]! - t[i - 1]! < 4) out.push(`steps ${i} and ${i + 1} are less than 4 percent of the height apart`)
  }
  if (t.some((y) => y < 0 || y > 100)) out.push('a step lies outside the picture')
  if (!(game.post.y < (t[0] ?? 100))) out.push('the post must stand above the first step')
  if (pxW(game.tipW) < SUNDIAL_TIP_PX) out.push(`the handle is narrower than ${SUNDIAL_TIP_PX} pixels on a phone`)
  if (!(game.shadowW > 1 && game.shadowW < 30)) out.push('the shadow has no sensible width')
  if (!(game.notchX > 0 && game.notchX < 50)) out.push('the notches lie in a strange place')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const want = [{ start: 4, steps: 3, dir: 1 }, { start: 13, steps: 10, dir: -1 }]
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const w = want[i]
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (w && (r.start !== w.start || r.steps !== w.steps || r.dir !== w.dir)) out.push(`round ${n}: start ${w.start}, ${w.steps} steps, direction ${w.dir} wanted`)
    const target = targetStep(r)
    if (target < 1 || target > SUNDIAL_TREADS) out.push(`round ${n}: the target lies outside the stairs`)
    if (r.start < 1 || r.start > SUNDIAL_TREADS) out.push(`round ${n}: the start lies outside the stairs`)
    if (stepsMoved(r.start, target) !== r.steps) out.push(`round ${n}: the steps do not fit`)
    if (r.dir === -1 && target - 1 < 2) out.push(`round ${n}: at least two steps must lie above the target (so that "all the way up" is not the answer)`)
    if (r.dir === 1 && SUNDIAL_TREADS - target < 3) out.push(`round ${n}: at least three steps must lie below the target`)
    // the shadow can stand on the target and on the start
    if (!(shadowLength(t, game.post, target) > 0) || !(shadowLength(t, game.post, r.start) > 0)) out.push(`round ${n}: the shadow has no length`)
    if (snapToTread(t[target - 1] ?? -100, t) !== target) out.push(`round ${n}: the target cannot be reached by the handle`)
  })
  if (game.rounds.length === 2 && game.rounds[0]!.dir === game.rounds[1]!.dir) out.push('the two rounds need the two directions')
  // the picture of the steps leaves room for the finger on a phone (steps are at least 26 pixels apart at 480 pixels height)
  if (t.length === SUNDIAL_TREADS && Math.min(...t.slice(1).map((y, i) => y - t[i]!)) * (pxH(100, pic) / 100) < 19) out.push('the steps are closer than 19 pixels on a phone')
  if (SUNDIAL_DONE_PX < 56) out.push('the button is too small')
  if (SUNDIAL_ROUND_MAX_MS < 12 * 4000) out.push('a round takes too long')
  return out
}

// ================================================================ 4. meeting in the rock (`stollen`)

export interface TunnelBand {
  /** The left and the right edge of the layer (percent of the width). */
  x0: number
  x1: number
  /** How far the layer pushes the tunnel (units of the width; + = down, - = up). */
  shift: number
  image: 'ab' | 'auf'
}
export interface TunnelRound {
  hint: string
  pieces: number
  /** The length of a piece (units: percent of the width). */
  seg: number
  /** How many degrees a crew turns for "up" or "down". */
  turn: number
  left: Pt
  right: Pt
  bands: TunnelBand[]
  /** `always`: the pointer that shows where the other crew is, is always there; `button`: only after "Listen". */
  listen: 'always' | 'button'
}
/**
 * The game "Meeting in the rock" (`stollen`): the rock seen from above (3:2). The spring lies at the left edge, the pool at the right edge; the crews start at `left` and `right` (units: percent of the width;
 * the height of the picture is 100 / ratio units). The pictures: spring and pool (300 x 300), the layers (420 x 1000), the crews (220 x 220), a piece of tunnel `gang` (160 x 90), flowing water `wasser` (160 x 60),
 * the knocking circles `klopf` (160 x 160) and the little arrow `zeiger` (80 x 80). `tolerance`: how near the tips must come for three stars, two stars and "joined".
 */
export interface TunnelGame {
  background: string
  ratio?: number
  /** The spring and the pool stand at the edges, at the height of the start of their crew in the round (`left.y`, `right.y`); `x` is the middle, `w` the width (percent of the width). */
  spring: { image: string; x: number; w: number; label: string }
  pool: { image: string; x: number; w: number; label: string }
  crews: { left: string; right: string; w: number; labelLeft: string; labelRight: string }
  tile: { gang: string; water: string; w: number }
  knock: string
  pointer: string
  bands: { ab: string; auf: string }
  tolerance: { three: number; two: number; join: number }
  rounds: TunnelRound[]
}
export type TunnelCrew = 'left' | 'right'
export const TUNNEL_TOLERANCE = { three: 1.5, two: 3.0, join: 8.0 }
export const TUNNEL_ROUND_MAX_MS = 120000
/** The sizes of the buttons (pixels). */
export const TUNNEL_BUTTON_PX = 44
export const TUNNEL_DIG_PX = 56
export const TUNNEL_POINTER_PX = 44

/** One piece of tunnel: where it starts, where it ends (after the push of a layer), the direction after turning (degrees, positive = up). */
export interface TunnelPiece {
  from: Pt
  to: Pt
  tilt: number
}
/** The height of the picture in units of the width. */
export const tunnelHeight = (game: TunnelGame): number => 100 / (game.ratio ?? 1.5)
/** The push of the layer a piece lies in (by the middle of the piece), or 0. */
export function bandShift(round: TunnelRound, midX: number): number {
  for (const b of round.bands) if (midX >= b.x0 && midX <= b.x1) return b.shift
  return 0
}
/** Digs one piece: the crew turns by `choice` (-1 down, 0 straight, +1 up) times the turn, digs `seg`, and the layer under the middle of the piece pushes the end. The tip stays inside the picture. */
export function digPiece(round: TunnelRound, crew: TunnelCrew, from: Pt, tilt: number, choice: number, height: number): TunnelPiece {
  const t = tilt + choice * round.turn
  const dir = crew === 'left' ? 1 : -1
  const dx = dir * Math.cos((t * Math.PI) / 180) * round.seg
  const dy = -Math.sin((t * Math.PI) / 180) * round.seg
  const shift = bandShift(round, from.x + dx / 2)
  return { from, to: { x: from.x + dx, y: Math.max(0, Math.min(height, from.y + dy + shift)) }, tilt: t }
}
/** The pieces dug by a crew after the given choices. */
export function tunnelWalk(round: TunnelRound, crew: TunnelCrew, choices: readonly number[], height: number): TunnelPiece[] {
  const out: TunnelPiece[] = []
  let at = crew === 'left' ? round.left : round.right
  let tilt = 0
  for (const c of choices) {
    const p = digPiece(round, crew, at, tilt, c, height)
    out.push(p)
    at = p.to
    tilt = p.tilt
  }
  return out
}
/** The tip of a crew after the choices (the start when nothing is dug). */
export function tunnelTip(round: TunnelRound, crew: TunnelCrew, choices: readonly number[], height: number): Pt {
  const w = tunnelWalk(round, crew, choices, height)
  return w.length ? w[w.length - 1]!.to : crew === 'left' ? round.left : round.right
}
/** The distance of the two tips. */
export const tunnelGap = (round: TunnelRound, left: readonly number[], right: readonly number[], height: number): number => {
  const a = tunnelTip(round, 'left', left, height)
  const b = tunnelTip(round, 'right', right, height)
  return Math.hypot(a.x - b.x, a.y - b.y)
}
/** The outcome of a meeting: 3 (exactly), 2 (almost), 1 (just joined), 0 (missed). */
export function outcome(gap: number, tol = TUNNEL_TOLERANCE): number {
  return gap <= tol.three ? 3 : gap <= tol.two ? 2 : gap <= tol.join ? 1 : 0
}
/** All sequences of `n` choices (-1, 0, 1). */
function sequences(n: number): number[][] {
  let out: number[][] = [[]]
  for (let i = 0; i < n; i++) out = out.flatMap((s) => [-1, 0, 1].map((c) => [...s, c]))
  return out
}
/** Every end a crew can reach (with the choices that lead there). */
export function allEnds(round: TunnelRound, crew: TunnelCrew, height: number): { tip: Pt; choices: number[] }[] {
  return sequences(round.pieces).map((choices) => ({ tip: tunnelTip(round, crew, choices, height), choices }))
}
/** The smallest gap over all ways to finish from the pieces already dug, and the first choices of that best way. */
export function bestNext(round: TunnelRound, left: readonly number[], right: readonly number[], height: number): { left: number; right: number; gap: number } | null {
  const rest = round.pieces - left.length
  if (rest <= 0 || right.length !== left.length) return null
  const seqs = sequences(rest)
  const lefts = seqs.map((s) => ({ s, tip: tunnelTip(round, 'left', [...left, ...s], height) }))
  const rights = seqs.map((s) => ({ s, tip: tunnelTip(round, 'right', [...right, ...s], height) }))
  let best: { left: number; right: number; gap: number } | null = null
  for (const l of lefts)
    for (const r of rights) {
      const g = Math.hypot(l.tip.x - r.tip.x, l.tip.y - r.tip.y)
      if (!best || g < best.gap - 1e-9) best = { left: l.s[0]!, right: r.s[0]!, gap: g }
    }
  return best
}

/** The problems of the data of `stollen` (an empty list is good). */
export function tunnelProblems(game: TunnelGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  const height = tunnelHeight(game)
  if (!game.background) out.push('no picture of the rock')
  for (const [k, v] of Object.entries({ spring: game.spring?.image, pool: game.pool?.image, crewLeft: game.crews?.left, crewRight: game.crews?.right, gang: game.tile?.gang, water: game.tile?.water, knock: game.knock, pointer: game.pointer, ab: game.bands?.ab, auf: game.bands?.auf }))
    if (!v) out.push(`no picture: ${k}`)
  const tol = game.tolerance
  if (!(tol.three > 0 && tol.three < tol.two && tol.two < tol.join)) out.push('the tolerances are not in order')
  if (pxW(game.crews.w) < 40) out.push('a crew is narrower than 40 pixels on a phone')
  if (TUNNEL_BUTTON_PX < 44 || TUNNEL_POINTER_PX < 44) out.push('a button is smaller than 44 pixels')
  if (TUNNEL_DIG_PX < 56) out.push('the button "Dig" is smaller than 56 pixels')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const want = [{ pieces: 5, seg: 9, listen: 'always' }, { pieces: 6, seg: 7.5, listen: 'button' }]
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const w = want[i]
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (w && (r.pieces !== w.pieces || r.seg !== w.seg)) out.push(`round ${n}: ${w.pieces} pieces of length ${w.seg} wanted`)
    if (w && r.listen !== w.listen) out.push(`round ${n}: listen must be '${w.listen}'`)
    if (r.turn !== 20) out.push(`round ${n}: the turn is 20 degrees`)
    for (const [crew, p] of [['left', r.left], ['right', r.right]] as const)
      if (p.y < 0 || p.y > height || p.x < 0 || p.x > 100) out.push(`round ${n}: the start of the ${crew} crew lies outside the picture`)
    // spring and pool stand at the height of the start of their crew, inside the picture
    if (!boxInside(midBox({ x: game.spring.x, y: r.left.y * ratio, w: game.spring.w }, 1, ratio))) out.push(`round ${n}: the spring lies outside the picture`)
    if (!boxInside(midBox({ x: game.pool.x, y: r.right.y * ratio, w: game.pool.w }, 1, ratio))) out.push(`round ${n}: the pool lies outside the picture`)
    for (const b of r.bands) {
      if (b.x0 < 8 || b.x1 > 92) out.push(`round ${n}: a layer reaches into the first or the last 8 percent`)
      if (!(b.x1 - b.x0 >= 6)) out.push(`round ${n}: a layer is too narrow`)
      if ((b.shift > 0) !== (b.image === 'ab') || b.shift === 0) out.push(`round ${n}: the picture of a layer must show its push (ab = down, auf = up)`)
    }
    for (let a = 0; a < r.bands.length; a++) for (let b = a + 1; b < r.bands.length; b++) if (r.bands[a]!.x0 < r.bands[b]!.x1 && r.bands[b]!.x0 < r.bands[a]!.x1) out.push(`round ${n}: two layers lie on top of each other`)
    // always straight on misses
    const straight = Array.from({ length: r.pieces }, () => 0)
    if (tunnelGap(r, straight, straight, height) <= tol.join) out.push(`round ${n}: "always straight on" must miss`)
    // some way meets (within the first tolerance), and every tip stays inside the picture (the code keeps it there)
    const lefts = allEnds(r, 'left', height)
    const rights = allEnds(r, 'right', height)
    let good = 0
    let min = Infinity
    for (const l of lefts)
      for (const q of rights) {
        const g = Math.hypot(l.tip.x - q.tip.x, l.tip.y - q.tip.y)
        if (g <= tol.three) good++
        min = Math.min(min, g)
      }
    if (good < 1) out.push(`round ${n}: no way meets exactly (best ${min.toFixed(2)})`)
    if (lefts.some((l) => l.tip.y < 0 || l.tip.y > height) || rights.some((l) => l.tip.y < 0 || l.tip.y > height)) out.push(`round ${n}: a tip leaves the picture`)
    // the help leads to a gap of at most the second tolerance with at most `pieces` moves
    let left: number[] = []
    let right: number[] = []
    for (let k = 0; k < r.pieces; k++) {
      const h = bestNext(r, left, right, height)
      if (!h) {
        out.push(`round ${n}: the help finds nothing`)
        break
      }
      left = [...left, h.left]
      right = [...right, h.right]
    }
    const g = tunnelGap(r, left, right, height)
    if (g > tol.two) out.push(`round ${n}: the help ends ${g.toFixed(2)} apart (at most ${tol.two})`)
    if (r.pieces * 15000 > TUNNEL_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${TUNNEL_ROUND_MAX_MS / 1000} seconds`)
  })
  return out
}
