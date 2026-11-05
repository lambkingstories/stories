/**
 * The pure parts of the five new games of "Geschichten von Jesus" (Anton's plan of 5.11.2026; the components only show and listen):
 * 1. "A hundredfold" (`hundertfach`, Matthew 13,8.23): on the good land the child taps the ears, and each one gives thirty, sixty or a hundred grains; the seed on the path, on the rock and in the thorns gives nothing.
 * 2. "Stop!" (`anhalten`, Luke 10,33-34): the Samaritan rides down the road; holding the finger down lets the donkey walk, letting go lets it stop; it is to stop right beside the man who was robbed.
 * 3. "To the inn" (`herberge`, Luke 10,34): the donkey walks to the inn by itself over a bumpy road; the child keeps the man on its back upright (lean him back or forward).
 * 4. "Carry it home" (`heimtragen`, Luke 15,5-6): the shepherd carries the found sheep home on his shoulders; a tap makes him jump over rocks, brooks and thorns.
 * 5. "The way home" (`heimweg`, Luke 15,18.20): the son goes home step by step in time; a footprint comes with every beat and the child taps it; the house of the father comes nearer.
 * Places are percent of the picture: x of the width, y of the height. Times are seconds unless the name says milliseconds. Nothing here has a clock or dice of its own.
 */

/** A picture laid on the field: the file, a short name (for the screen reader and the stand-in) and its width in percent of the field. */
export interface NeuSprite {
  image: string
  label: string
  w: number
}

export interface Pt {
  x: number
  y: number
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function neuDist(a: Pt, b: Pt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

/** A direction: 0 up, 1 right, 2 down, 3 left (arrow keys). */
export type NeuDir = 0 | 1 | 2 | 3

/** The place an arrow key goes to: the nearest point in that direction (a point far to the side does not count; `ratio` = width / height). Null when there is none. */
export function neuNeighbour(points: readonly Pt[], i: number, dir: NeuDir, ratio = 1.5, skip: (k: number) => boolean = () => false): number | null {
  const a = points[i]
  if (!a) return null
  let best: number | null = null
  let bestScore = Infinity
  points.forEach((p, k) => {
    if (k === i || skip(k)) return
    const dx = p.x - a.x
    const dy = (p.y - a.y) / ratio
    const along = dir === 1 ? dx : dir === 3 ? -dx : dir === 2 ? dy : -dy
    const across = dir === 1 || dir === 3 ? Math.abs(dy) : Math.abs(dx)
    if (along <= 0.5 || across > along * 2) return
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = k
    }
  })
  return best
}

// ================================================================ 1. a hundredfold (`hundertfach`)

/** What stands on the field: ears on the good land (30, 60, 100 grains) or seed that brought nothing (on the rock, in the thorns, on the path with the bird). */
export type YieldKind = 'y30' | 'y60' | 'y100' | 'rock' | 'thorn' | 'path'
export const YIELD_GOOD: readonly YieldKind[] = ['y100', 'y60', 'y30']
export const YIELD_BAD: readonly YieldKind[] = ['rock', 'thorn', 'path']
/** The grains of an ear on the good land (Matthew 13,8: a hundredfold, sixtyfold, thirtyfold). */
export const YIELD_GRAINS: Record<YieldKind, number> = { y30: 30, y60: 60, y100: 100, rock: 0, thorn: 0, path: 0 }
/** The narrowest picture that can still be tapped on a phone (12 % of a field 360 pixels wide are 43 pixels). */
export const YIELD_MIN_W = 12

/** A plant of a round: its kind and the middle of its foot (percent of the field). */
export interface YieldPlant {
  kind: YieldKind
  x: number
  y: number
}
/** One round: the hint, the plants and whether the ears must be taken in the order of the Bible (first the hundredfold, then the sixtyfold, then the thirtyfold). */
export interface YieldRound {
  hint: string
  plants: YieldPlant[]
  ordered?: boolean
}
/**
 * The game "A hundredfold" (`hundertfach`): the empty plowed field (3:2), a picture for each kind (square pictures, standing on their foot), the heap of grains that flies into the sack,
 * the sack (middle of its foot and width) and the rounds.
 */
export interface YieldGame {
  field: string
  ratio?: number
  sprites: Record<YieldKind, NeuSprite>
  grain: NeuSprite
  sack: NeuSprite & Pt
  rounds: YieldRound[]
}

export const yieldIsGood = (k: YieldKind): boolean => YIELD_GOOD.includes(k)

/** The ears of the good land of a round (indices). */
export const yieldGoodPlants = (round: YieldRound): number[] => round.plants.map((p, i) => (yieldIsGood(p.kind) ? i : -1)).filter((i) => i >= 0)

/** All the grains a round brings. */
export const yieldTotal = (round: YieldRound): number => round.plants.reduce((n, p) => n + YIELD_GRAINS[p.kind], 0)

/** In a round in the order of the Bible: the kind that must come next (the biggest one that is left); null when there is no order or nothing is left. */
export function yieldExpected(round: YieldRound, harvested: readonly boolean[]): YieldKind | null {
  if (!round.ordered) return null
  for (const k of YIELD_GOOD) if (round.plants.some((p, i) => p.kind === k && !harvested[i])) return k
  return null
}

export type YieldVerdict = { kind: 'harvest'; grains: number } | { kind: 'bad'; why: YieldKind } | { kind: 'order'; want: YieldKind } | { kind: 'already' }

/** A tap on plant `i`: an ear of the good land is taken (in the order of the Bible, if the round wants it); the seed on the rock, in the thorns and on the path brought nothing. */
export function yieldTap(round: YieldRound, harvested: readonly boolean[], i: number): YieldVerdict {
  const p = round.plants[i]
  if (!p || harvested[i]) return { kind: 'already' }
  if (!yieldIsGood(p.kind)) return { kind: 'bad', why: p.kind }
  const want = yieldExpected(round, harvested)
  if (want && want !== p.kind) return { kind: 'order', want }
  return { kind: 'harvest', grains: YIELD_GRAINS[p.kind] }
}

/** Every ear of the good land is taken. */
export const yieldDone = (round: YieldRound, harvested: readonly boolean[]): boolean => yieldGoodPlants(round).every((i) => harvested[i])

/** The ear the button "Help me" shows: the next one that may be taken (the biggest first in a round with the order of the Bible). */
export function yieldHint(round: YieldRound, harvested: readonly boolean[]): number | null {
  const want = yieldExpected(round, harvested)
  const i = round.plants.findIndex((p, k) => !harvested[k] && yieldIsGood(p.kind) && (!want || p.kind === want))
  return i >= 0 ? i : null
}

/** The problems of the data of `hundertfach` (an empty list is good). */
export function yieldProblems(game: YieldGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.field) out.push('no picture of the field')
  for (const k of [...YIELD_GOOD, ...YIELD_BAD]) {
    const s = game.sprites[k]
    if (!s || !s.image) out.push(`no picture for "${k}"`)
    else if (!(s.w >= YIELD_MIN_W && s.w <= 30)) out.push(`the picture "${k}" should be ${YIELD_MIN_W} to 30 percent wide (it is ${s.w})`)
  }
  if (!game.grain?.image) out.push('no picture of the grains')
  const sack = game.sack
  if (!sack?.image) out.push('no picture of the sack')
  else if (sack.x - sack.w / 2 < 0 || sack.x + sack.w / 2 > 100 || sack.y > 100 || sack.y - sack.w * ratio < 0) out.push('the sack lies outside the picture')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const good = yieldGoodPlants(r)
    const bad = r.plants.length - good.length
    if (good.length < 3) out.push(`round ${n}: fewer than three ears on the good land`)
    if (bad < 2) out.push(`round ${n}: fewer than two places where the seed brought nothing`)
    if (r.ordered) for (const k of YIELD_GOOD) if (!r.plants.some((p) => p.kind === k)) out.push(`round ${n}: the order of the Bible needs an ear of "${k}"`)
    r.plants.forEach((p, i) => {
      const s = game.sprites[p.kind]
      if (!s) return
      const h = s.w * ratio // the pictures are square
      if (p.x - s.w / 2 < -0.01 || p.x + s.w / 2 > 100.01 || p.y > 100.01 || p.y - h < -0.01) out.push(`round ${n}: plant ${i + 1} lies outside the picture`)
      if (sack && neuDist(p, sack, ratio) < (s.w + sack.w) / 2 * 0.8) out.push(`round ${n}: plant ${i + 1} stands on the sack`)
      r.plants.forEach((o, k) => {
        if (k <= i) return
        const so = game.sprites[o.kind]
        if (!so) return
        if (neuDist(p, o, ratio) < ((s.w + so.w) / 2) * 0.8) out.push(`round ${n}: plants ${i + 1} and ${k + 1} stand too close together to be tapped`)
      })
    })
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.plants.length <= a!.plants.length) out.push('round 2 should have more plants than round 1')
    if (!b!.ordered) out.push('round 2 should ask for the order of the Bible')
  }
  return out
}

// ================================================================ 2. stop! (`anhalten`)

/** One round of "Stop!": the hint, where the rider starts (the middle of the picture of rider and donkey), where the man sits, where the rider is to stop (and how far off he may be),
 * the top speed (percent of the width a second), how fast the donkey starts and how fast it stops when the finger lets go (percent a second a second). */
export interface HaltRound {
  hint: string
  start: number
  man: number
  spot: number
  tolerance: number
  speed: number
  accel: number
  brake: number
}
/**
 * The game "Stop!" (`anhalten`): the road from Jerusalem to Jericho seen from the side (3:2), the line of the feet (`road`, percent of the height), the Samaritan on his donkey (looks to the right),
 * the man who was robbed (sits, looks to the right, toward the kneeling Samaritan), the donkey standing and the Samaritan kneeling (for the help at the end) and the rounds. All pictures stand on their foot.
 */
export interface HaltGame {
  background: string
  ratio?: number
  road: number
  rider: NeuSprite
  man: NeuSprite
  donkey: NeuSprite
  kneel: NeuSprite
  rounds: HaltRound[]
}
export interface HaltState {
  x: number
  v: number
  /** the donkey stopped where it should */
  stopped: boolean
}
/** How far the rider goes back after riding past the man (percent before the spot). */
export const HALT_BACK = 18

export const haltStart = (round: HaltRound): HaltState => ({ x: round.start, v: 0, stopped: false })

/** How far the donkey still walks when the finger lets go now (percent). */
export const haltCoast = (v: number, brake: number): number => (v > 0 && brake > 0 ? (v * v) / (2 * brake) : 0)

/** The farthest the rider may go (his picture stays inside). */
export const haltLimit = (game: HaltGame): number => 100 - game.rider.w / 2

export type HaltEvent = 'stopped-good' | 'stopped-early' | 'stopped-late' | null

/** One step (`dt` seconds): with the finger down the donkey walks faster (up to the top speed), without it slows down; when it stands, the place is judged. */
export function haltStep(game: HaltGame, round: HaltRound, st: HaltState, held: boolean, dt: number): { state: HaltState; event: HaltEvent } {
  if (st.stopped) return { state: st, event: null }
  let v = st.v
  const moving = v > 0
  if (held) v = Math.min(round.speed, v + round.accel * dt)
  else v = Math.max(0, v - round.brake * dt)
  let x = st.x + v * dt
  const limit = haltLimit(game)
  if (x >= limit) {
    x = limit
    v = 0
  }
  let event: HaltEvent = null
  if (moving && v === 0 && !held) event = haltJudge(round, x)
  else if (moving && v === 0 && x >= limit) event = haltJudge(round, x)
  return { state: { x, v, stopped: event === 'stopped-good' }, event }
}

/** Where the donkey stands: at the right place, too early (it may walk on) or past it (a mistake). */
export function haltJudge(round: HaltRound, x: number): Exclude<HaltEvent, null> {
  if (Math.abs(x - round.spot) <= round.tolerance + 1e-9) return 'stopped-good'
  return x < round.spot ? 'stopped-early' : 'stopped-late'
}

/** The button "Help me": the finger stays down until the donkey would stop at the middle of the spot by itself. */
export const haltAutoHeld = (round: HaltRound, st: HaltState): boolean => st.x + haltCoast(st.v, round.brake) < round.spot - 0.2

/** Where the kneeling Samaritan is shown at the end: on the other side of the man (the man looks to the right, the kneeling Samaritan to the left). */
export const haltKneel = (game: HaltGame, round: HaltRound): number => round.man + (game.man.w + game.kneel.w) * 0.3

/** The place where the rider waits after riding past the man. */
export const haltBackTo = (round: HaltRound): number => Math.max(round.start, round.spot - HALT_BACK)

/** Simulates the help from the start (steps of `dt`); returns where the donkey stops (for the check of the data). */
export function haltSimulate(game: HaltGame, round: HaltRound, dt = 0.05): { x: number; event: HaltEvent; seconds: number } {
  let st = haltStart(round)
  for (let t = 0; t < 120; t += dt) {
    const r = haltStep(game, round, st, haltAutoHeld(round, st), dt)
    st = r.state
    if (r.event) return { x: st.x, event: r.event, seconds: t }
  }
  return { x: st.x, event: null, seconds: 120 }
}

/** The problems of the data of `anhalten` (an empty list is good). */
export function haltProblems(game: HaltGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the road')
  if (!(game.road >= 55 && game.road <= 99)) out.push('the road (the line of the feet) should lie between 55 and 99 percent of the height')
  for (const [k, s, lo] of [['rider', game.rider, 16], ['man', game.man, 11], ['donkey', game.donkey, 12], ['kneel', game.kneel, 9]] as const) {
    if (!s?.image) out.push(`no picture of "${k}"`)
    else if (!(s.w >= lo && s.w <= 40)) out.push(`the picture "${k}" should be ${lo} to 40 percent wide (it is ${s.w})`)
  }
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (![r.start, r.man, r.spot, r.tolerance, r.speed, r.accel, r.brake].every(finite)) {
      out.push(`round ${n}: a number is missing`)
      return
    }
    if (r.start - game.rider.w / 2 < 0) out.push(`round ${n}: the rider starts outside the picture`)
    if (r.man + game.man.w / 2 > 100) out.push(`round ${n}: the man sits outside the picture`)
    if (!(r.spot > r.start + 20)) out.push(`round ${n}: the spot must lie at least 20 percent after the start`)
    if (!(r.spot < r.man)) out.push(`round ${n}: the rider must stop before the man`)
    const front = r.spot + game.rider.w / 2
    if (front > r.man + game.man.w * 0.15) out.push(`round ${n}: the spot is so near that the rider would stand on the man`)
    if (front < r.man - game.man.w / 2 - 6) out.push(`round ${n}: the spot is too far from the man (the rider would not be beside him)`)
    if (!(r.tolerance >= 1.5 && r.tolerance <= 10)) out.push(`round ${n}: the tolerance should be 1.5 to 10 percent`)
    if (!(r.speed > 0 && r.accel > 0 && r.brake > 0)) out.push(`round ${n}: speed, start and stop must be more than zero`)
    if (r.spot + r.tolerance + 1 > haltLimit(game)) out.push(`round ${n}: the spot lies too far to the right`)
    if (haltKneel(game, r) + game.kneel.w / 2 > 100) out.push(`round ${n}: the kneeling Samaritan would stand outside the picture`)
    if (haltCoast(r.speed, r.brake) > (r.spot - r.start) * 0.6) out.push(`round ${n}: the donkey walks on too far when the finger lets go`)
    const sim = haltSimulate(game, r)
    if (sim.event !== 'stopped-good') out.push(`round ${n}: the help does not stop at the spot`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.tolerance > a!.tolerance) out.push('round 2 should have a narrower spot than round 1')
    if (haltCoast(b!.speed, b!.brake) <= haltCoast(a!.speed, a!.brake)) out.push('round 2 should let the donkey walk on farther than round 1')
  }
  return out
}

// ================================================================ 3. to the inn (`herberge`)

/** A stone or a root on the road: where it lies (percent of the width), its picture (index into `stones`), how hard it pushes the man (degrees a second; + forward, - back). */
export interface InnBump {
  x: number
  push: number
  stone: number
}
/** One round: the hint, how fast the donkey walks (percent a second), how strongly a tilt grows by itself (a second; the man is not used to riding), the stones on the way. */
export interface InnRound {
  hint: string
  speed: number
  drift: number
  bumps: InnBump[]
}
/**
 * The game "To the inn" (`herberge`): the road seen from the side with the inn at the right (3:2), the line of the feet, where the caravan starts and where the gate of the inn is (the middle of the donkey),
 * the donkey (looks to the right), the man sitting on his blanket (stands on the seat of the donkey: `seat` is where the bottom of his picture lies, percent of the donkey picture from its left edge and from its foot),
 * the Samaritan who leads (stands `lead` percent of the width before the donkey), the stones and the rounds.
 */
export interface InnGame {
  background: string
  ratio?: number
  road: number
  start: number
  gate: number
  donkey: NeuSprite
  rider: NeuSprite
  seat: Pt
  leader: NeuSprite
  lead: number
  stones: NeuSprite[]
  rounds: InnRound[]
}
/** At this tilt the man slides (degrees); a little earlier a warning is shown. */
export const INN_SLIP = 30
export const INN_WARN = 18
/** How strongly the finger straightens the man (degrees a second a second) and how the movement is damped (a second). */
export const INN_POWER = 140
export const INN_DAMP = 2.2
/** How long the caravan waits after the man slid (seconds). */
export const INN_PAUSE = 1.4

export interface InnState {
  /** where the middle of the donkey is */
  x: number
  /** the tilt of the man (degrees; + forward, - back) and how fast it changes */
  tilt: number
  spin: number
  /** the stones passed */
  passed: number
  pause: number
  time: number
  arrived: boolean
}
export type InnEvent = { type: 'bump'; index: number } | { type: 'slip' } | { type: 'arrived' }

export const innStart = (game: InnGame): InnState => ({ x: game.start, tilt: 0, spin: 0, passed: 0, pause: 0, time: 0, arrived: false })

/** The front hoof of the donkey (it meets a stone first). */
export const innHoof = (game: InnGame, x: number): number => x + game.donkey.w * 0.3

/** A small swaying of the walk (degrees a second a second), the same every time. */
export const innSway = (time: number): number => Math.sin(time * 2.1) * 9 + Math.sin(time * 3.7 + 1) * 5

/**
 * One step (`dt` seconds) with the finger's push `control` (-1 lean back … +1 lean forward): the donkey walks, a stone under the front hoof pushes the man, his tilt grows by itself,
 * the finger straightens him. When he tilts too far he slides (a mistake): the caravan waits and the Samaritan sets him straight. At the gate of the inn the round is won.
 */
export function innStep(game: InnGame, round: InnRound, st: InnState, control: number, dt: number): { state: InnState; events: InnEvent[] } {
  const events: InnEvent[] = []
  if (st.arrived) return { state: st, events }
  const s = { ...st, time: st.time + dt }
  if (s.pause > 0) {
    s.pause = Math.max(0, s.pause - dt)
    return { state: s, events }
  }
  s.x = Math.min(game.gate, s.x + round.speed * dt)
  while (s.passed < round.bumps.length && innHoof(game, s.x) >= round.bumps[s.passed]!.x) {
    s.spin += round.bumps[s.passed]!.push
    events.push({ type: 'bump', index: s.passed })
    s.passed++
  }
  const c = clamp(control, -1, 1)
  // a tilt grows by itself (drift), the walk sways him, the finger turns him (+ forward, - back), the movement is damped
  const acc = s.tilt * round.drift + innSway(s.time) + c * INN_POWER - s.spin * INN_DAMP
  s.spin += acc * dt
  s.tilt += s.spin * dt
  if (Math.abs(s.tilt) >= INN_SLIP) {
    events.push({ type: 'slip' })
    s.tilt = 0
    s.spin = 0
    s.pause = INN_PAUSE
  }
  if (s.x >= game.gate) {
    s.arrived = true
    events.push({ type: 'arrived' })
  }
  return { state: s, events }
}

/** The finger of the button "Help me" (and of the check of the data): it pushes against the tilt and its movement. */
export const innAuto = (st: InnState): number => clamp(-(st.tilt * 0.12 + st.spin * 0.06), -1, 1)

/** The share of the way that is done (0 … 1). */
export const innShare = (game: InnGame, st: InnState): number => clamp((st.x - game.start) / Math.max(1e-6, game.gate - game.start), 0, 1)

/** Lets the help ride a round from the start; returns how often the man slid (for the check of the data: the help must never let him slide). */
export function innSimulate(game: InnGame, round: InnRound, dt = 0.05): { slips: number; arrived: boolean; seconds: number } {
  let st = innStart(game)
  let slips = 0
  for (let t = 0; t < 300; t += dt) {
    const r = innStep(game, round, st, innAuto(st), dt)
    st = r.state
    slips += r.events.filter((e) => e.type === 'slip').length
    if (st.arrived) return { slips, arrived: true, seconds: t }
  }
  return { slips, arrived: false, seconds: 300 }
}

/** How far a tilt goes without the finger after a stone (for the check: a stone must not throw the man off at once). */
export function innFreeSwing(push: number, drift: number): number {
  let tilt = 0
  let spin = push
  let most = 0
  for (let t = 0; t < 0.6; t += 0.01) {
    spin += (tilt * drift - spin * INN_DAMP) * 0.01
    tilt += spin * 0.01
    most = Math.max(most, Math.abs(tilt))
  }
  return most
}

/** The problems of the data of `herberge` (an empty list is good). */
export function innProblems(game: InnGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the road')
  if (!(game.road >= 55 && game.road <= 99)) out.push('the road (the line of the feet) should lie between 55 and 99 percent of the height')
  for (const [k, s, lo] of [['donkey', game.donkey, 14], ['rider', game.rider, 7], ['leader', game.leader, 7]] as const) {
    if (!s?.image) out.push(`no picture of "${k}"`)
    else if (!(s.w >= lo && s.w <= 40)) out.push(`the picture "${k}" should be ${lo} to 40 percent wide (it is ${s.w})`)
  }
  if (!(game.seat.x > 10 && game.seat.x < 90 && game.seat.y > 20 && game.seat.y < 95)) out.push('the seat should lie on the back of the donkey')
  if (!game.stones.length) out.push('no pictures of stones')
  if (game.start - game.donkey.w / 2 - Math.max(0, game.lead) < -game.leader.w / 2) out.push('the caravan starts outside the picture')
  if (!(game.gate > game.start + 40)) out.push('the gate must lie at least 40 percent after the start')
  if (game.gate + game.donkey.w / 2 + game.lead + game.leader.w / 2 > 104) out.push('at the gate the Samaritan walks out of the picture')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!(r.speed >= 2 && r.speed <= 15)) out.push(`round ${n}: the speed should be 2 to 15 percent a second`)
    if (!(r.drift >= 0 && r.drift <= 6)) out.push(`round ${n}: the drift should be 0 to 6`)
    if (r.bumps.length < 2) out.push(`round ${n}: fewer than two stones`)
    r.bumps.forEach((b, k) => {
      if (!(b.x > innHoof(game, game.start) + 5 && b.x < innHoof(game, game.gate) - 2)) out.push(`round ${n}: stone ${k + 1} does not lie on the way`)
      if (k > 0 && b.x - r.bumps[k - 1]!.x < 8) out.push(`round ${n}: stones ${k} and ${k + 1} lie closer than 8 percent`)
      if (!game.stones[b.stone]) out.push(`round ${n}: stone ${k + 1} has no picture`)
      if (!(Math.abs(b.push) >= 10)) out.push(`round ${n}: stone ${k + 1} hardly pushes`)
      if (innFreeSwing(b.push, r.drift) >= INN_SLIP) out.push(`round ${n}: stone ${k + 1} throws the man off before the child can help`)
    })
    const sim = innSimulate(game, r)
    if (!sim.arrived) out.push(`round ${n}: the caravan does not arrive`)
    if (sim.slips > 0) out.push(`round ${n}: even the help lets the man slide ${sim.slips} times`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.bumps.length <= a!.bumps.length) out.push('round 2 should have more stones than round 1')
    if (b!.drift < a!.drift) out.push('round 2 should tilt at least as easily as round 1')
  }
  return out
}

// ================================================================ 4. carry it home (`heimtragen`)

export type CarryKind = 'rock' | 'brook' | 'thorn'
/** An obstacle on the way: its kind, where its middle lies (percent of the width of the field, counted along the whole way) and how wide it is. */
export interface CarryObstacle {
  kind: CarryKind
  at: number
  w: number
}
/** One round: the hint, the speed (percent of the width a second), the obstacles and where the house is (the middle of the house picture, along the way). */
export interface CarryRound {
  hint: string
  speed: number
  obstacles: CarryObstacle[]
  home: number
}
/**
 * The game "Carry it home" (`heimtragen`): the pasture seen from the side (3:2; it repeats, every second copy mirrored), the line of the feet, the shepherd with the sheep (looks to the right; `hero`),
 * where he stands on the screen (`heroAt`, percent of the width), how long and how high a jump is, the pictures of the obstacles (their width comes from the data of the round) and of the house with the friends.
 */
export interface CarryGame {
  background: string
  ratio?: number
  road: number
  hero: NeuSprite
  heroAt: number
  jump: number
  height: number
  sprites: Record<CarryKind, string>
  labels: Record<CarryKind, string>
  /** How far a picture reaches below the line of the feet (percent of the height; the brook lies in the path). */
  sink?: Partial<Record<CarryKind, number>>
  home: NeuSprite
  rounds: CarryRound[]
}
/** The part of the shepherd's feet that touches an obstacle (percent of the width of his picture, around his middle). */
export const CARRY_FEET = 0.22
/** In the first and the last tenth of a jump the feet are still low (they touch an obstacle). */
export const CARRY_LOW = 0.1
/** After a stumble he waits (seconds) and is set just behind the obstacle (percent): he climbed over it. */
export const CARRY_PAUSE = 0.9
export const CARRY_OVER = 0.5

export interface CarryState {
  /** how far he has walked (percent of the width) */
  d: number
  /** seconds since the jump began (null on the ground) */
  air: number | null
  pause: number
  /** obstacles behind him (they are not met again) */
  passed: number
  arrived: boolean
}
export type CarryEvent = { type: 'jump' } | { type: 'land' } | { type: 'hit'; index: number } | { type: 'passed'; index: number } | { type: 'arrived' }

export const carryStart = (): CarryState => ({ d: 0, air: null, pause: 0, passed: 0, arrived: false })

/** How high he is now (0 … 1 of the jump height): a smooth arc. */
export const carryLift = (st: CarryState, jump: number): number => (st.air === null ? 0 : Math.sin(Math.PI * clamp(st.air / jump, 0, 1)))

/** His feet are low (on the ground, or at the start or end of a jump). */
export const carryLow = (st: CarryState, jump: number): boolean => st.air === null || st.air < jump * CARRY_LOW || st.air > jump * (1 - CARRY_LOW)

/** The part of the way his feet cover now. */
export const carryFeet = (game: CarryGame, d: number): [number, number] => [d - (game.hero.w * CARRY_FEET) / 2, d + (game.hero.w * CARRY_FEET) / 2]

/** Where the house stands for the shepherd to reach it (his middle at the door). */
export const carryGoal = (game: CarryGame, round: CarryRound): number => round.home - game.home.w * 0.25

/** A tap: he jumps (not while he is in the air or waits after a stumble). */
export function carryJump(st: CarryState): CarryState {
  if (st.air !== null || st.pause > 0 || st.arrived) return st
  return { ...st, air: 0 }
}

/** One step (`dt` seconds): he walks on, a jump goes on, an obstacle under his low feet is a stumble (a mistake: he waits a moment and climbs over it); at the house the round is won. */
export function carryStep(game: CarryGame, round: CarryRound, st: CarryState, dt: number): { state: CarryState; events: CarryEvent[] } {
  const events: CarryEvent[] = []
  if (st.arrived) return { state: st, events }
  const s = { ...st }
  if (s.pause > 0) {
    s.pause = Math.max(0, s.pause - dt)
    return { state: s, events }
  }
  s.d += round.speed * dt
  if (s.air !== null) {
    s.air += dt
    if (s.air >= game.jump) {
      s.air = null
      events.push({ type: 'land' })
    }
  }
  const [a, b] = carryFeet(game, s.d)
  while (s.passed < round.obstacles.length) {
    const o = round.obstacles[s.passed]!
    const lo = o.at - o.w / 2
    const hi = o.at + o.w / 2
    if (a > hi) {
      events.push({ type: 'passed', index: s.passed })
      s.passed++
      continue
    }
    if (b >= lo && carryLow(s, game.jump)) {
      // he stumbles, waits a moment and climbs over it (the obstacle is behind him then)
      events.push({ type: 'hit', index: s.passed })
      events.push({ type: 'passed', index: s.passed })
      s.d = hi + (b - a) / 2 + CARRY_OVER
      s.air = null
      s.pause = CARRY_PAUSE
      s.passed++
    }
    break
  }
  if (s.d >= carryGoal(game, round)) {
    s.d = carryGoal(game, round)
    s.arrived = true
    events.push({ type: 'arrived' })
  }
  return { state: s, events }
}

/** The help (and the check of the data): jump when the next obstacle is just right ahead (the jump then covers it from the middle). */
export function carryAutoJump(game: CarryGame, round: CarryRound, st: CarryState): boolean {
  if (st.air !== null || st.pause > 0) return false
  const o = round.obstacles[st.passed]
  if (!o) return false
  const [, b] = carryFeet(game, st.d)
  const lo = o.at - o.w / 2 - round.speed * game.jump * CARRY_LOW
  return b >= lo - round.speed * CARRY_AUTO && b <= lo
}
/** The help jumps at most this many seconds before the last good moment (a little more than one step of the game). */
export const CARRY_AUTO = 0.06

/** How far a jump carries him (percent of the width) and how much of it is high enough to pass over something. */
export const carryLength = (game: CarryGame, round: CarryRound): number => round.speed * game.jump
export const carryClear = (game: CarryGame, round: CarryRound): number => round.speed * game.jump * (1 - 2 * CARRY_LOW)

/** Lets the help play a round; returns the stumbles (the help must never stumble). */
export function carrySimulate(game: CarryGame, round: CarryRound, dt = 0.05): { hits: number; arrived: boolean } {
  let st = carryStart()
  let hits = 0
  for (let t = 0; t < 300; t += dt) {
    if (carryAutoJump(game, round, st)) st = carryJump(st)
    const r = carryStep(game, round, st, dt)
    st = r.state
    hits += r.events.filter((e) => e.type === 'hit').length
    if (st.arrived) return { hits, arrived: true }
  }
  return { hits, arrived: false }
}

/** The problems of the data of `heimtragen` (an empty list is good). */
export function carryProblems(game: CarryGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the pasture')
  if (!(game.road >= 55 && game.road <= 99)) out.push('the road (the line of the feet) should lie between 55 and 99 percent of the height')
  if (!game.hero?.image) out.push('no picture of the shepherd')
  else if (!(game.hero.w >= 13 && game.hero.w <= 30)) out.push(`the shepherd should be 13 to 30 percent wide (he is ${game.hero.w})`)
  if (!(game.heroAt >= 15 && game.heroAt <= 45)) out.push('the shepherd should walk between 15 and 45 percent of the width')
  if (!(game.jump >= 0.45 && game.jump <= 1.2)) out.push('a jump should last 0.45 to 1.2 seconds')
  if (!(game.height >= 10 && game.height <= 40)) out.push('a jump should be 10 to 40 percent of the height high')
  for (const k of ['rock', 'brook', 'thorn'] as const) if (!game.sprites[k]) out.push(`no picture of "${k}"`)
  if (!game.home?.image) out.push('no picture of the house')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!(r.speed >= 8 && r.speed <= 40)) out.push(`round ${n}: the speed should be 8 to 40 percent a second`)
    if (r.obstacles.length < 3) out.push(`round ${n}: fewer than three obstacles`)
    const clear = carryClear(game, r)
    const feet = game.hero.w * CARRY_FEET
    r.obstacles.forEach((o, k) => {
      if (!game.sprites[o.kind]) out.push(`round ${n}: obstacle ${k + 1} has no picture`)
      if (!(o.w >= 5)) out.push(`round ${n}: obstacle ${k + 1} is too small to be seen`)
      if (o.w + feet + r.speed * CARRY_AUTO > clear - 0.5) out.push(`round ${n}: obstacle ${k + 1} is too wide to be jumped over`)
      if (k === 0 && o.at - o.w / 2 < 100 - game.heroAt + 10) out.push(`round ${n}: the first obstacle must come from the right edge (at least ${100 - game.heroAt + 10})`)
      if (k > 0) {
        const prev = r.obstacles[k - 1]!
        const gap = o.at - o.w / 2 - (prev.at + prev.w / 2)
        if (gap < carryLength(game, r) + r.speed * 0.45) out.push(`round ${n}: obstacles ${k} and ${k + 1} lie too close (no time to land and jump again)`)
      }
    })
    const last = r.obstacles[r.obstacles.length - 1]
    if (last && carryGoal(game, r) < last.at + last.w / 2 + carryLength(game, r)) out.push(`round ${n}: the house stands too near the last obstacle`)
    const sim = carrySimulate(game, r)
    if (!sim.arrived) out.push(`round ${n}: the shepherd does not arrive`)
    if (sim.hits > 0) out.push(`round ${n}: even the help stumbles ${sim.hits} times`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.obstacles.length <= a!.obstacles.length) out.push('round 2 should have more obstacles than round 1')
    if (b!.speed < a!.speed) out.push('round 2 should not be slower than round 1')
    if (!b!.obstacles.some((o) => o.kind === 'brook')) out.push('round 2 should have a brook')
  }
  return out
}

// ================================================================ 5. the way home (`heimweg`)

export type HomeFoot = 'left' | 'right'
/** One round: the hint, the time between two steps (milliseconds), how far off a tap may be (milliseconds), how many steps lead home and whether the right foot must be tapped. */
export interface HomeRound {
  hint: string
  beat: number
  window: number
  steps: number
  feet?: boolean
}
/**
 * The game "The way home" (`heimweg`): the road to the house of the father (portrait 3:4), the point the picture grows toward (the house) and how much it grows at the end,
 * the son seen from behind (stands on `son`, his foot), the footprint picture (a left foot; the right one is mirrored), where the left and the right print lie and the rounds.
 */
export interface HomeGame {
  background: string
  ratio?: number
  house: Pt
  zoom: number
  son: NeuSprite & Pt
  print: NeuSprite
  left: Pt
  right: Pt
  rounds: HomeRound[]
}
/** The print comes this share of a beat before its moment (it grows and gets clear). */
export const HOME_LEAD = 0.5

/** Which foot step `k` is (0 = the first step): left, right, left … */
export const homeFoot = (k: number): HomeFoot => (k % 2 === 0 ? 'left' : 'right')

/** The beat nearest to a moment (`ms` since the round began; the first beat is one beat after the start) and how far off the moment is (milliseconds, minus = early). */
export function homeNearest(round: HomeRound, ms: number): { beat: number; off: number } {
  const b = Math.max(1, Math.round(ms / round.beat))
  return { beat: b, off: ms - b * round.beat }
}

export type HomeVerdict = { kind: 'step' } | { kind: 'early' } | { kind: 'late' } | { kind: 'foot' } | { kind: 'again' }

/**
 * A tap at `ms` (on the `foot` that was tapped, or null for a tap anywhere): in time with a beat that is not used yet, a step; too early or too late, a stumble;
 * in a round with feet, the other foot is a stumble too. `used` is the last beat that was used (a beat counts once).
 */
export function homeTap(round: HomeRound, ms: number, foot: HomeFoot | null, used: number, stepIndex: number): { verdict: HomeVerdict; beat: number } {
  const { beat, off } = homeNearest(round, ms)
  if (beat <= used) return { verdict: { kind: 'again' }, beat }
  if (Math.abs(off) > round.window) return { verdict: { kind: off < 0 ? 'early' : 'late' }, beat }
  if (round.feet && foot !== null && foot !== homeFoot(stepIndex)) return { verdict: { kind: 'foot' }, beat }
  return { verdict: { kind: 'step' }, beat }
}

/** How clear the coming print is at `ms` (0 … 1): it comes during the last half beat before its moment and stays until the window is over. */
export function homePrintShow(round: HomeRound, ms: number): number {
  const next = Math.max(1, Math.ceil((ms - round.window) / round.beat))
  const at = next * round.beat
  const lead = round.beat * HOME_LEAD
  if (ms < at - lead) return 0
  if (ms <= at) return clamp(1 - (at - ms) / lead, 0, 1)
  return 1
}

/** How much the picture has grown after `done` of `steps` steps (1 at the start, `zoom` at home). */
export const homeScale = (game: HomeGame, done: number, steps: number): number => 1 + (game.zoom - 1) * clamp(done / Math.max(1, steps), 0, 1)

/** The problems of the data of `heimweg` (an empty list is good). */
export function homeProblems(game: HomeGame): string[] {
  const out: string[] = []
  const inside = (p: Pt) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100
  if (!game.background) out.push('no picture of the road')
  if (!inside(game.house)) out.push('the house lies outside the picture')
  if (!(game.zoom >= 1.2 && game.zoom <= 3)) out.push('the picture should grow 1.2 to 3 times')
  if (!game.son?.image) out.push('no picture of the son')
  else if (!(game.son.w >= 14 && game.son.w <= 40)) out.push(`the son should be 14 to 40 percent wide (he is ${game.son.w})`)
  if (!inside(game.son)) out.push('the son stands outside the picture')
  if (!game.print?.image) out.push('no picture of the footprint')
  else if (!(game.print.w >= 14 && game.print.w <= 30)) out.push(`the footprint should be 14 to 30 percent wide (it is ${game.print.w}; 44 pixels at least on a phone)`)
  for (const [k, p] of [['left', game.left], ['right', game.right]] as const) {
    if (!inside(p) || p.x - game.print.w / 2 < 0 || p.x + game.print.w / 2 > 100) out.push(`the ${k} print lies outside the picture`)
  }
  if (!(game.left.x < game.right.x)) out.push('the left print must lie left of the right one')
  if (game.right.x - game.left.x < game.print.w) out.push('the two prints overlap (they cannot be told apart by a tap)')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!(r.beat >= 450 && r.beat <= 1500)) out.push(`round ${n}: a beat should last 450 to 1500 milliseconds`)
    if (!(r.window >= 120 && r.window <= r.beat / 2 - 60)) out.push(`round ${n}: the window should be at least 120 milliseconds and leave a gap between the beats`)
    if (!(r.steps >= 6 && r.steps <= 30)) out.push(`round ${n}: 6 to 30 steps`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.beat > a!.beat) out.push('round 2 should not be slower than round 1')
    if (b!.window > a!.window) out.push('round 2 should not be more forgiving than round 1')
    if (b!.steps < a!.steps) out.push('round 2 should not be shorter than round 1')
    if (!b!.feet) out.push('round 2 should ask for the right foot')
  }
  return out
}
