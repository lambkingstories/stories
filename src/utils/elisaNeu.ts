/**
 * The pure parts of the three new games of "Elisa und Naaman" (Anton's plan of 5.11.2026; the components only show and listen):
 * - "The hand mill" (`handmuehle`, 2 Kings 4,42-44: the man brings fresh grain with the twenty loaves; the child turns the upper millstone with a circling finger until there is flour for the people).
 * - "The seal" (`siegel`, 2 Kings 5,5: the king of Syria writes a letter; the child turns the king's seal until it fits exactly into the imprint on the letter, then presses it).
 * - "Earth for Naaman" (`naamanerde`, 2 Kings 5,17: two mules' burden of earth; the child loads the sacks so that both mules carry the same).
 * Places are percent of the picture (4:3): x a part of the width, y a part of the height. Angles are degrees, clockwise on the screen, 0 = upright.
 * The arithmetic has no clock of its own (the time is handed in) and no dice.
 */

/** All three pictures are 4:3 (width / height). */
export const ELISA_RATIO = 4 / 3

export interface Spot {
  x: number
  y: number
}
/** A picture laid on the field: its middle (`x`, `y`) and its width (`w`), all percent of the field. */
export interface Place extends Spot {
  w: number
}

/** The angle of `point` seen from `center`, in degrees (clockwise on the screen, 0 = to the right). Both in pixels (or both in the same units). */
export function angleAt(center: Spot, point: Spot): number {
  return (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI
}

/** An angle brought into -180..180. */
export function wrap180(deg: number): number {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

/** An angle brought into 0..360. */
export const norm360 = (deg: number): number => ((deg % 360) + 360) % 360

// ================================================================== 1. the hand mill (handmuehle, field `handMill`)

/**
 * One round of the hand mill: the hint, how many full turns grind the flour of the round (`turns`), how many turns the grain in the hole of the stone lasts
 * (`hopper`; 0: the grain is enough for the whole round, nothing has to be poured in) and the fastest calm pace in turns per second (`maxSpeed`; 0: no limit).
 * Turning faster than `maxSpeed` makes the grains jump out of the hole: nothing is ground and the grain is lost (a mistake once per hurry).
 */
export interface MillRound {
  hint: string
  turns: number
  hopper: number
  maxSpeed: number
}

/**
 * The game "The hand mill" (`handmuehle`): the floor (4:3, seen from above), the lower stone and the upper runner stone (round, seen from above, the runner turns over the lower one),
 * the bowl and the heap of flour that grows in it, the open sack of barley (tap it to pour grain into the hole) and the little heap of grain in the hole.
 * `mill`: the middle of both stones and the width of the lower stone; `upperW` the width of the runner; `bowl`, `sack` their places; `flourW` the width of the full heap.
 */
export interface MillGame {
  background: string
  lower: string
  upper: string
  bowl: string
  flour: string
  sack: string
  grain: string
  mill: Place
  upperW: number
  bowlAt: Place
  sackAt: Place
  flourW: number
  grainW: number
  rounds: MillRound[]
}

/** How many seconds of turning the pace is measured over. */
export const MILL_WINDOW_MS = 500
/** How far the runner turns without grain before it counts as a mistake (stone grinds on stone). */
export const MILL_DRY_DEG = 120
/** A step of the button, of the arrow keys. */
export const MILL_STEP = 45

export interface MillState {
  /** Degrees ground into flour in this round (0 to `turns` × 360). */
  ground: number
  /** Degrees of turning the grain in the hole still lasts (Infinity: enough for the whole round). */
  grain: number
  /** The angle the runner is drawn at (it turns the way the finger turns). */
  rot: number
  /** The angle of the finger on its last move (null: no finger on the stone). */
  last: number | null
  /** Degrees turned while the hole was empty, since the last pouring. */
  dry: number
  /** The recent turning: when and how far (for the pace). */
  recent: { t: number; deg: number }[]
}

export type MillEvent = 'none' | 'flour' | 'empty' | 'fast' | 'full'

export function millStart(round: MillRound): MillState {
  return { ground: 0, grain: round.hopper > 0 ? round.hopper * 360 : Infinity, rot: 0, last: null, dry: 0, recent: [] }
}

/** The whole flour of the round in degrees. */
export const millGoal = (round: MillRound): number => round.turns * 360

/** How much of the flour of the round is there (0 to 1). */
export const millShare = (state: MillState, round: MillRound): number => Math.min(1, state.ground / millGoal(round))

/** How full the hole is (0 to 1; 1 when the grain is enough for the whole round). */
export const millGrainShare = (state: MillState, round: MillRound): number => (round.hopper > 0 ? Math.max(0, Math.min(1, state.grain / (round.hopper * 360))) : 1)

/** Turns per second over the last `MILL_WINDOW_MS`. */
export function millPace(state: MillState, now: number): number {
  const deg = state.recent.filter((r) => now - r.t <= MILL_WINDOW_MS).reduce((s, r) => s + r.deg, 0)
  return deg / 360 / (MILL_WINDOW_MS / 1000)
}

/** The round is ground. */
export const millDone = (state: MillState, round: MillRound): boolean => state.ground >= millGoal(round) - 1e-6

/**
 * The runner turns by `delta` degrees (either way counts) at the time `now` (ms). With grain in the hole and a calm pace it grinds: `flour`.
 * Too fast: the grains jump out, nothing is ground (`fast`). An empty hole: stone on stone, nothing is ground (`empty`). A ground round: `full`.
 */
export function millAdvance(state: MillState, round: MillRound, delta: number, now: number): { state: MillState; event: MillEvent } {
  const d = Math.abs(delta)
  if (d === 0) return { state, event: 'none' }
  if (millDone(state, round)) return { state: { ...state, rot: state.rot + delta }, event: 'full' }
  const recent = [...state.recent.filter((r) => now - r.t <= MILL_WINDOW_MS), { t: now, deg: d }]
  const next: MillState = { ...state, rot: state.rot + delta, recent }
  if (round.maxSpeed > 0 && millPace(next, now) > round.maxSpeed) {
    next.grain = Math.max(0, state.grain - d)
    return { state: next, event: 'fast' }
  }
  if (state.grain <= 0) {
    next.dry = state.dry + d
    return { state: next, event: 'empty' }
  }
  const use = Math.min(d, state.grain, millGoal(round) - state.ground)
  next.ground = state.ground + use
  next.grain = state.grain === Infinity ? Infinity : state.grain - use
  if (next.grain <= 0) next.dry = d - use
  return { state: next, event: 'flour' }
}

/** A finger is put on the stone. */
export const millGrab = (state: MillState, angle: number): MillState => ({ ...state, last: angle })
/** The finger is lifted. */
export const millRelease = (state: MillState): MillState => ({ ...state, last: null })

/** The finger moves to `angle`: the runner follows. */
export function millTurn(state: MillState, round: MillRound, angle: number, now: number): { state: MillState; event: MillEvent } {
  if (state.last === null) return { state: { ...state, last: angle }, event: 'none' }
  const delta = wrap180(angle - state.last)
  const res = millAdvance({ ...state, last: angle }, round, delta, now)
  return res
}

/** A step without circling (the button, the arrow keys). */
export const millStep = (state: MillState, round: MillRound, now: number, degrees = MILL_STEP): { state: MillState; event: MillEvent } => millAdvance(state, round, degrees, now)

/** Grain from the sack into the hole: `poured`, or `enough` when the hole is still more than half full (or the round needs no pouring). */
export function millRefill(state: MillState, round: MillRound): { state: MillState; kind: 'poured' | 'enough' } {
  if (round.hopper <= 0 || state.grain > (round.hopper * 360) / 2) return { state, kind: 'enough' }
  return { state: { ...state, grain: round.hopper * 360, dry: 0 }, kind: 'poured' }
}

/** What "Help me" says: pour grain, turn slower, or keep turning. */
export function millHint(state: MillState, round: MillRound, now: number): 'refill' | 'slow' | 'turn' {
  if (round.hopper > 0 && state.grain <= 0) return 'refill'
  if (round.maxSpeed > 0 && millPace(state, now) > round.maxSpeed * 0.8) return 'slow'
  return 'turn'
}

/** The problems of the data of `handmuehle` (an empty list is good). */
export function handMillProblems(game: MillGame): string[] {
  const out: string[] = []
  for (const [name, p] of [['lower', game.lower], ['upper', game.upper], ['bowl', game.bowl], ['flour', game.flour], ['sack', game.sack], ['grain', game.grain], ['background', game.background]] as const)
    if (!p) out.push(`no picture of the ${name}`)
  const inside = (name: string, p: Place) => {
    const hh = (p.w / 2) * ELISA_RATIO
    if (p.x - p.w / 2 < 0 || p.x + p.w / 2 > 100 || p.y - hh < 0 || p.y + hh > 100) out.push(`the ${name} lies outside the picture`)
  }
  inside('mill', game.mill)
  inside('bowl', game.bowlAt)
  inside('sack', game.sackAt)
  // a phone shows the field about 360 pixels wide: the stone to circle at least 120 pixels, the sack a button of at least 44
  if (game.upperW * 3.6 < 120) out.push(`the runner stone is ${game.upperW} % wide, less than 120 pixels on a phone`)
  if (game.sackAt.w * 3.6 < 44) out.push(`the sack is ${game.sackAt.w} % wide, less than 44 pixels on a phone`)
  if (game.upperW > game.mill.w) out.push('the runner is wider than the lower stone')
  if (game.flourW > game.bowlAt.w) out.push('the heap of flour is wider than the bowl')
  const apart = (a: Place, b: Place) => Math.hypot(a.x - b.x, (a.y - b.y) / ELISA_RATIO) >= (a.w + b.w) / 2 - 1
  if (!apart(game.mill, game.bowlAt)) out.push('the bowl lies on the mill')
  if (!apart(game.mill, game.sackAt)) out.push('the sack lies on the mill')
  if (!apart(game.bowlAt, game.sackAt)) out.push('the sack lies on the bowl')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    if (r.turns < 3 || r.turns > 12) out.push(`round ${n}: ${r.turns} turns (3 to 12)`)
    if (r.hopper < 0) out.push(`round ${n}: the hole holds less than nothing`)
    if (r.hopper > 0 && r.hopper < 1) out.push(`round ${n}: the hole must last at least one turn`)
    if (r.maxSpeed !== 0 && (r.maxSpeed < 1 || r.maxSpeed > 3)) out.push(`round ${n}: a pace limit of ${r.maxSpeed} turns a second is not calm (1 to 3)`)
    // the button turns MILL_STEP a tap: a child that taps four times a second must never be "too fast"
    if (r.maxSpeed > 0 && (MILL_STEP * 4) / 360 > r.maxSpeed) out.push(`round ${n}: the button is too fast already at four taps a second`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = [game.rounds[0]!, game.rounds[game.rounds.length - 1]!]
    const pours = (r: MillRound) => (r.hopper > 0 ? Math.ceil(r.turns / r.hopper) - 1 : 0)
    if (b.turns < a.turns) out.push('the last round grinds less than the first')
    if (pours(b) < 2) out.push('the last round must make the child pour grain at least twice')
    if (b.maxSpeed === 0) out.push('the last round must ask for a calm pace')
    if (pours(a) > pours(b)) out.push('the first round asks for more pouring than the last')
  }
  return out
}

// ================================================================== 2. the seal (siegel, field `sealTurn`)

/** A place for a seal on the letter: the middle of the wax (percent of the field) and the angle of the imprint (0 = the lion upright). `start`: the angle the seal comes in at. */
export interface SealSpot extends Spot {
  angle: number
  start: number
}

/** One round: the hint, the places on the letter (one after the other) and how exactly the seal must sit (`tolerance`, degrees either way). */
export interface SealRound {
  hint: string
  spots: SealSpot[]
  tolerance: number
}

/**
 * The game "The seal" (`siegel`): the writing table (4:3, seen from above), the rolled letter (`letterAt`: its middle and width), the red wax (round),
 * the king's seal (round, a lion with a star: clearly not symmetric), the width of a wax place (`waxW`) and of the seal (`sealW`), all percent of the field.
 */
export interface SealGame {
  background: string
  letter: string
  wax: string
  seal: string
  letterAt: Place
  letterRatio: number
  waxW: number
  sealW: number
  rounds: SealRound[]
}

/** The step of a turn button and of an arrow key. */
export const SEAL_STEP = 5

/** How far an angle is from the imprint (0 to 180). */
export const sealOff = (angle: number, target: number): number => Math.abs(wrap180(angle - target))

/** The seal sits in the imprint. */
export const sealFits = (angle: number, spot: SealSpot, tolerance: number): boolean => sealOff(angle, spot.angle) <= tolerance + 1e-9

/** The finger moves from `from` to `to` (both angles around the wax): the seal turns with it. */
export const sealDrag = (angle: number, from: number, to: number): number => norm360(angle + wrap180(to - from))

/** A turn by the buttons or the keys. */
export const sealNudge = (angle: number, dir: 1 | -1, step = SEAL_STEP): number => norm360(angle + dir * step)

/** The shorter way to the imprint (1 clockwise, -1 the other way, 0 it fits). */
export function sealWay(angle: number, spot: SealSpot, tolerance: number): 1 | -1 | 0 {
  if (sealFits(angle, spot, tolerance)) return 0
  return wrap180(spot.angle - angle) > 0 ? 1 : -1
}

/** The problems of the data of `siegel` (an empty list is good). */
export function sealTurnProblems(game: SealGame): string[] {
  const out: string[] = []
  for (const [name, p] of [['background', game.background], ['letter', game.letter], ['wax', game.wax], ['seal', game.seal]] as const) if (!p) out.push(`no picture of the ${name}`)
  if (game.waxW * 3.6 < 56) out.push(`the wax is ${game.waxW} % wide, less than 56 pixels on a phone`)
  if (game.sealW < game.waxW * 0.7 || game.sealW > game.waxW * 1.05) out.push('the seal must be a little smaller than the wax')
  const L = game.letterAt
  const lh = (L.w / game.letterRatio) * ELISA_RATIO
  if (L.x - L.w / 2 < 0 || L.x + L.w / 2 > 100 || L.y - lh / 2 < 0 || L.y + lh / 2 > 100) out.push('the letter lies outside the picture')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    if (r.spots.length < 1 || r.spots.length > 4) out.push(`round ${n}: ${r.spots.length} places (1 to 4)`)
    if (r.tolerance < 4 || r.tolerance > 25) out.push(`round ${n}: a tolerance of ${r.tolerance} degrees (4 to 25)`)
    // the buttons turn SEAL_STEP: from every start some step lands in the imprint
    if (r.tolerance * 2 < SEAL_STEP) out.push(`round ${n}: the turn buttons can step over the imprint`)
    const hw = game.waxW / 2
    r.spots.forEach((s, k) => {
      if (s.x - hw < 0 || s.x + hw > 100 || s.y - hw * ELISA_RATIO < 0 || s.y + hw * ELISA_RATIO > 100) out.push(`round ${n}: place ${k + 1} lies outside the picture`)
      // on the letter: the middle of the wax lies on the scroll
      if (Math.abs(s.x - L.x) > L.w / 2 - hw * 0.5 || Math.abs(s.y - L.y) > lh / 2) out.push(`round ${n}: place ${k + 1} is not on the letter`)
      if (sealOff(s.start, s.angle) < 40) out.push(`round ${n}: place ${k + 1}: the seal starts too near the imprint (${Math.round(sealOff(s.start, s.angle))} degrees)`)
      r.spots.forEach((o, j) => {
        if (j > k && Math.hypot(s.x - o.x, (s.y - o.y) / ELISA_RATIO) < game.waxW + 1) out.push(`round ${n}: places ${k + 1} and ${j + 1} overlap`)
      })
    })
    const angles = r.spots.map((s) => norm360(s.angle))
    if (new Set(angles).size !== angles.length) out.push(`round ${n}: two imprints have the same angle`)
  })
  if (game.rounds.length >= 2) {
    const a = game.rounds[0]!
    const b = game.rounds[game.rounds.length - 1]!
    if (b.tolerance >= a.tolerance) out.push('the last round is not more exact than the first')
    if (b.spots.length < a.spots.length) out.push('the last round has fewer places than the first')
  }
  return out
}

// ================================================================== 3. earth for Naaman (naamanerde, field `earthLoad`)

/** One round: the hint and the sacks of earth that wait on the road (their sizes: 1 small, 2 middle, 3 big). */
export interface EarthRound {
  hint: string
  sacks: number[]
}

/**
 * The game "Earth for Naaman" (`naamanerde`): the road before Elisha's house (4:3), the two mules (side view, heads to the left, the blanket on the back),
 * the sacks by size (`sacks[0]` small, `[1]` middle, `[2]` big; one picture each, the same scale). `mules`: where each mule stands (the middle of its picture and its width);
 * `back`: where the load lies on a mule picture (its middle and the width of the back, percent of the mule picture; `mule ratio` width / height of the mule picture);
 * `sackY`: the line where the sacks wait (their feet), `sackW`: the width of each size on the road (percent of the field), `loadScale`: how big a sack is drawn on a mule.
 */
export interface EarthGame {
  background: string
  mule: [string, string]
  sacks: [string, string, string]
  sackRatio: [number, number, number]
  mules: [Place, Place]
  muleRatio: number
  back: Place
  sackY: number
  sackW: [number, number, number]
  loadScale: number
  rounds: EarthRound[]
}

/** Where a sack is: -1 on the road, 0 on the first mule, 1 on the second. */
export type EarthWhere = -1 | 0 | 1

/** The width of the slot of one waiting sack (percent of the field): the road is shared equally. */
export const earthSlot = (round: EarthRound): number => 100 / Math.max(1, round.sacks.length)

/** The middle of the slot of sack `i` on the road (percent of the width). */
export const earthSlotX = (round: EarthRound, i: number): number => earthSlot(round) * (i + 0.5)

/** What each mule should carry: half of all the earth. */
export const earthTarget = (round: EarthRound): number => round.sacks.reduce((s, x) => s + x, 0) / 2

/** What each mule carries. */
export function earthLoads(round: EarthRound, on: readonly EarthWhere[]): [number, number] {
  const out: [number, number] = [0, 0]
  round.sacks.forEach((s, i) => {
    const w = on[i] ?? -1
    if (w === 0 || w === 1) out[w] += s
  })
  return out
}

/** All sacks are on the mules (then both carry the same, because no mule may carry more than half). */
export const earthDone = (round: EarthRound, on: readonly EarthWhere[]): boolean => round.sacks.every((_, i) => (on[i] ?? -1) >= 0)

/**
 * A sack is put on a mule: `loaded`; it would make the mule carry more than half: `heavy` (a mistake, nothing changes); a sack that is on a mule is taken down when it is chosen again (`taken`, see `earthTake`).
 */
export function earthPut(round: EarthRound, on: readonly EarthWhere[], sack: number, mule: 0 | 1): { kind: 'loaded' | 'heavy' | 'none'; on: EarthWhere[] } {
  const next = round.sacks.map((_, i) => on[i] ?? -1) as EarthWhere[]
  if (sack < 0 || sack >= round.sacks.length || next[sack] === mule) return { kind: 'none', on: next }
  const loads = earthLoads(round, next.map((w, i) => (i === sack ? -1 : w)) as EarthWhere[])
  if (loads[mule] + round.sacks[sack]! > earthTarget(round)) return { kind: 'heavy', on: next }
  next[sack] = mule
  return { kind: 'loaded', on: next }
}

/** A sack is taken down from its mule back to the road. */
export function earthTake(round: EarthRound, on: readonly EarthWhere[], sack: number): EarthWhere[] {
  const next = round.sacks.map((_, i) => on[i] ?? -1) as EarthWhere[]
  if (sack >= 0 && sack < next.length) next[sack] = -1
  return next
}

/** Can the sacks still on the road be shared so that both mules come to half? (a search; there are few sacks) */
export function earthSolve(round: EarthRound, on: readonly EarthWhere[]): EarthWhere[] | null {
  const target = earthTarget(round)
  const start = round.sacks.map((_, i) => on[i] ?? -1) as EarthWhere[]
  const loads = earthLoads(round, start)
  if (loads[0] > target || loads[1] > target || !Number.isInteger(target)) return null
  const free = round.sacks.map((_, i) => i).filter((i) => start[i] === -1).sort((a, b) => round.sacks[b]! - round.sacks[a]!)
  const res = [...start]
  const go = (k: number, a: number, b: number): boolean => {
    if (k === free.length) return a === target && b === target
    const i = free[k]!
    const s = round.sacks[i]!
    for (const m of [0, 1] as const) {
      const na = m === 0 ? a + s : a
      const nb = m === 1 ? b + s : b
      if (na > target || nb > target) continue
      res[i] = m
      if (go(k + 1, na, nb)) return true
    }
    res[i] = -1
    return false
  }
  return go(0, loads[0], loads[1]) ? res : null
}

/** No sack on the road fits on either mule any more, but not all are loaded: some sack has to come down again. */
export function earthStuck(round: EarthRound, on: readonly EarthWhere[]): boolean {
  if (earthDone(round, on)) return false
  return round.sacks.every((_, i) => (on[i] ?? -1) >= 0 || ([0, 1] as const).every((m) => earthPut(round, on, i, m).kind !== 'loaded'))
}

/** What "Help me" shows: a sack and the mule it should go on, or a sack that has to come down (the way from here is shut). Null when all is done. */
export function earthHint(round: EarthRound, on: readonly EarthWhere[]): { kind: 'put'; sack: number; mule: 0 | 1 } | { kind: 'take'; sack: number } | null {
  if (earthDone(round, on)) return null
  const way = earthSolve(round, on)
  if (way) {
    // the biggest sack on the road first
    const free = round.sacks.map((_, i) => i).filter((i) => (on[i] ?? -1) === -1).sort((a, b) => round.sacks[b]! - round.sacks[a]!)
    const i = free[0]!
    return { kind: 'put', sack: i, mule: way[i] as 0 | 1 }
  }
  // the smallest loaded sack whose taking down opens a way
  const loaded = round.sacks.map((_, i) => i).filter((i) => (on[i] ?? -1) >= 0).sort((a, b) => round.sacks[a]! - round.sacks[b]!)
  for (const i of loaded) if (earthSolve(round, earthTake(round, on, i))) return { kind: 'take', sack: i }
  return loaded.length ? { kind: 'take', sack: loaded[0]! } : null
}

/**
 * The top sack of a mule: the one loaded last (`order` lists the sacks in the order they were loaded). A tap on a mule with no sack chosen takes this one down. -1: the mule carries nothing.
 */
export function earthTop(on: readonly EarthWhere[], order: readonly number[], mule: 0 | 1): number {
  for (let k = order.length - 1; k >= 0; k--) if ((on[order[k]!] ?? -1) === mule) return order[k]!
  return -1
}

/**
 * "Help me" in the game, where a sack comes down from the top of a mule: a sack and the mule it should go on, or the mule whose top sack should come down
 * (the one whose taking down opens a way; when none does alone, the mule with more load). Null when all is done.
 */
export function earthHintTop(round: EarthRound, on: readonly EarthWhere[], order: readonly number[]): { kind: 'put'; sack: number; mule: 0 | 1 } | { kind: 'take'; mule: 0 | 1 } | null {
  const h = earthHint(round, on)
  if (!h || h.kind === 'put') return h
  for (const m of [0, 1] as const) {
    const top = earthTop(on, order, m)
    if (top >= 0 && earthSolve(round, earthTake(round, on, top))) return { kind: 'take', mule: m }
  }
  const loads = earthLoads(round, on)
  const m: 0 | 1 = loads[0] >= loads[1] ? 0 : 1
  return earthTop(on, order, m) >= 0 ? { kind: 'take', mule: m } : { kind: 'take', mule: m === 0 ? 1 : 0 }
}

/** Is there a way to load the mules that gets stuck (a dead end the child can walk into)? Used to check that a round asks for thought. */
export function earthHasDeadEnd(round: EarthRound): boolean {
  const n = round.sacks.length
  const seen = new Set<string>()
  const walk = (on: EarthWhere[]): boolean => {
    const key = on.join(',')
    if (seen.has(key)) return false
    seen.add(key)
    if (earthStuck(round, on)) return true
    for (let i = 0; i < n; i++) {
      if (on[i] !== -1) continue
      for (const m of [0, 1] as const) {
        const r = earthPut(round, on, i, m)
        if (r.kind === 'loaded' && walk(r.on)) return true
      }
    }
    return false
  }
  return walk(round.sacks.map(() => -1 as EarthWhere))
}

/** The problems of the data of `naamanerde` (an empty list is good). */
export function earthLoadProblems(game: EarthGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the road')
  if (game.mule.some((m) => !m)) out.push('no picture of a mule')
  if (game.sacks.some((s) => !s)) out.push('no picture of a sack')
  for (const [k, m] of game.mules.entries()) {
    const h = (m.w / game.muleRatio) * ELISA_RATIO
    if (m.x - m.w / 2 < 0 || m.x + m.w / 2 > 100 || m.y - h / 2 < 0 || m.y + h / 2 > 100) out.push(`mule ${k + 1} lies outside the picture`)
    if (m.w * 3.6 < 100) out.push(`mule ${k + 1} is ${m.w} % wide, less than 100 pixels on a phone`)
  }
  const [m1, m2] = game.mules
  if (Math.abs(m1.x - m2.x) < (m1.w + m2.w) / 2 - 2) out.push('the mules overlap')
  if (game.back.x < 0 || game.back.x > 100 || game.back.y < 0 || game.back.y > 100) out.push('the back lies outside the mule picture')
  if (!(game.sackW[0] < game.sackW[1] && game.sackW[1] < game.sackW[2])) out.push('the sacks do not grow from small to big')
  if (game.sackW[0] * 3.6 < 24) out.push(`the small sack is ${game.sackW[0]} % wide, hard to see on a phone`)
  if (game.sackY < 55 || game.sackY > 100) out.push('the sacks do not stand on the road (lower part of the picture)')
  if (game.loadScale <= 0.2 || game.loadScale > 1) out.push('the size of a sack on a mule is not sensible')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  let before: { n: number; dead: boolean } | null = null
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    if (r.sacks.some((s) => ![1, 2, 3].includes(s))) out.push(`round ${n}: a sack size other than 1, 2 or 3`)
    const total = r.sacks.reduce((s, x) => s + x, 0)
    if (total % 2) out.push(`round ${n}: the earth (${total}) cannot be halved`)
    else if (!earthSolve(r, r.sacks.map(() => -1))) out.push(`round ${n}: the sacks cannot be shared equally`)
    // the sacks wait side by side on the road, each in its own slot (`earthSlot`): a slot is a button of at least 44 pixels on a phone (about 360 pixels wide), and the biggest sack fits into it
    const slot = earthSlot(r)
    if (slot * 3.6 < 44) out.push(`round ${n}: ${r.sacks.length} sacks make slots of ${slot.toFixed(1)} %, less than 44 pixels on a phone`)
    if (Math.max(...r.sacks.map((x) => game.sackW[x - 1] ?? 0)) > slot) out.push(`round ${n}: the biggest sack is wider than its slot`)
    if (r.sacks.length < 4 || r.sacks.length > 9) out.push(`round ${n}: ${r.sacks.length} sacks (4 to 9)`)
    const dead = earthHasDeadEnd(r)
    if (before && (r.sacks.length < before.n || (before.dead && !dead))) out.push(`round ${n}: easier than round ${n - 1}`)
    if (i === game.rounds.length - 1 && !dead) out.push(`round ${n}: the last round has no dead end (it asks for no thought)`)
    before = { n: r.sacks.length, dead }
  })
  return out
}
