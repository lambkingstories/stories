/**
 * The pure parts of the two new games of "Jesus heals" (the components only draw and listen):
 * "Who turns back?" (Luke 17,14-16: ten men are made clean on the way to the priests, one of them turns back and thanks Jesus) and
 * "Shout louder" (Mark 10,46-49: the blind Bartimaeus calls out, many tell him to be quiet, he calls out much more, and Jesus stands still).
 * Places are percent of the picture (3:2). The arithmetic has no clock and no dice of its own: the components give the seconds (`t`, `dt`) and a seeded `rand`.
 */
import { mistakeStars } from '@/utils/adventureScore'

/**
 * Stars at the end of both games: the mistakes of all rounds (a tap on a wrong man, a round that ran out of time) against the number of rounds.
 * Two rounds: up to 2 mistakes three stars, up to 5 two stars, then one (the same steps as `bahn`, `netz`, `boote` and `dach`).
 */
export function heilungStars(mistakes: number, rounds: number): number {
  const r = Math.max(1, rounds)
  return mistakeStars(mistakes, r, r * 2 + 1)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// ---------------------------------------------------------------- 1. who turns back? (`umkehr`)

/** Ten men walk to the house of the priests: nine of the old kinds and the Samaritan. */
export const TURN_MEN = 10
/** The pictures of the nine other men (`mann-1` to `mann-6`); more men than pictures use a picture again, mirrored. */
export const TURN_KINDS = 6
/** Seconds the men walk on before the hands show clean. */
export const TURN_WALK = 2.5
/** Seconds the hands show clean (sparkles and ticks) before one man turns round. */
export const TURN_CLEAN = 1.5
/** How fast the men walk to the right (percent of the picture width a second). */
export const TURN_SPEED = 3.2
/** How fast the Samaritan runs back before the child has tapped him (slowly: the child has time to find him). */
export const TURN_BACK_SPEED = 4
/** How fast he runs to Jesus after the tap. */
export const TURN_FAST_SPEED = 20
/** He kneels this far (percent of the width) to the right of Jesus' place; before the tap he never runs further left than this. */
export const TURN_KNEEL_GAP = 10
/** The places in the row (counted from the front, 0 = the first man in front) where the Samaritan can walk: never in front, never at the back. */
export const TURN_SLOTS = [1, 2, 3, 4, 5] as const
/** Parts of the task per round (for "Go on"): a mistake counts a part (two at most), the solved round counts all three. */
export const TURN_PARTS = 3
export const TURN_MISS_PARTS = 2

export type TurnPhase = 'walk' | 'clean' | 'turn' | 'late'
export type TurnVerdict = 'right' | 'wrong' | 'early'

/** Where the road lies (percent of the picture): the feet of the men, the middle of the lanes, where the row begins and how far apart the men stand, the door of the house and the place of Jesus. */
export interface TurnGeometry {
  /** Height of the feet of the row (percent from the top). */
  y: number
  /** How wide the band is in which the men cross each other in round 2 (percent of the height). */
  spread: number
  /** The middle of the last man of the row at the start (percent of the width). */
  startX: number
  /** The distance between two men of the row. */
  gap: number
  /** The men stop here (the door of the house). */
  houseX: number
  /** The middle of Jesus. */
  jesusX: number
}

export interface TurnWalker {
  id: number
  samaritan: boolean
  /** Which picture (0 to 5); -1 for the Samaritan. */
  kind: number
  /** A picture used for the second time is shown mirrored. */
  mirror: boolean
  x0: number
  /** Distance from the middle line of the road (percent of the height). */
  lane: number
  /** How far he wanders up and down while walking (0 in a round without crossing). */
  amp: number
  phase: number
  /** How fast he walks compared to the others (1 = the usual; in a crossing round some are quicker and some slower). The Samaritan always walks at 1. */
  pace: number
}

export interface TurnRoundRule {
  /** The seconds the child has to find the man who turns back. */
  seconds: number
  /** Round 2: the men wander over the road and cross each other. */
  crossing: boolean
}

function shuffled<T>(list: readonly T[], rand: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const k = Math.min(i, Math.floor(rand() * (i + 1)))
    const keep = out[i]!
    out[i] = out[k]!
    out[k] = keep
  }
  return out
}

/**
 * The ten men of an attempt: the row stands one gap apart; the Samaritan walks at `slot` (a number from 0, counted from the front; when none is given `rand` chooses one of `TURN_SLOTS`).
 * The nine others get the six pictures in a mixed order; the seventh to ninth use a picture again, mirrored.
 */
export function turnBuild(crossing: boolean, geo: TurnGeometry, rand: () => number, slot?: number): TurnWalker[] {
  const s = slot !== undefined && slot >= 0 && slot < TURN_MEN ? slot : TURN_SLOTS[Math.min(TURN_SLOTS.length - 1, Math.floor(rand() * TURN_SLOTS.length))]!
  const order = shuffled(
    Array.from({ length: TURN_KINDS }, (_, i) => i),
    rand
  )
  const out: TurnWalker[] = []
  let k = 0
  for (let i = 0; i < TURN_MEN; i++) {
    const samaritan = i === s
    const kind = samaritan ? -1 : order[k % TURN_KINDS]!
    const mirror = !samaritan && k >= TURN_KINDS
    if (!samaritan) k++
    out.push({
      id: i,
      samaritan,
      kind,
      mirror,
      x0: geo.startX + (TURN_MEN - 1 - i) * geo.gap,
      lane: crossing ? (rand() - 0.5) * geo.spread : i % 2 ? 1.2 : -1.2,
      amp: crossing ? 1.5 + rand() * 3 : 0,
      phase: rand() * Math.PI * 2,
      pace: crossing && !samaritan ? 0.7 + rand() * 0.6 : 1
    })
  }
  return out
}

/** The time (seconds from the start of an attempt) at which one man turns round. */
export const turnTurnAt = TURN_WALK + TURN_CLEAN

/** In which part of an attempt we are at second `t`: walking, hands clean, the turn (the child may tap), too late. */
export function turnPhase(t: number, seconds: number): TurnPhase {
  if (t < TURN_WALK) return 'walk'
  if (t < turnTurnAt) return 'clean'
  return t < turnTurnAt + seconds - 1e-9 ? 'turn' : 'late'
}

function walkX(w: TurnWalker, t: number, geo: TurnGeometry): number {
  return Math.min(geo.houseX, w.x0 + TURN_SPEED * w.pace * t)
}

/**
 * The place (percent of the width) of a man at second `t`. The others walk on to the door and wait there. The Samaritan walks with them until the turn, then runs slowly back towards Jesus
 * (never beyond the kneeling place); `tapAt` is the second of the right tap: from then on he runs fast to Jesus.
 */
export function turnX(w: TurnWalker, t: number, geo: TurnGeometry, tapAt: number | null = null): number {
  if (!w.samaritan || t <= turnTurnAt) return walkX(w, Math.max(0, t), geo)
  const stop = geo.jesusX + TURN_KNEEL_GAP
  const slowUntil = tapAt === null ? t : Math.min(t, tapAt)
  let x = Math.max(stop, walkX(w, turnTurnAt, geo) - TURN_BACK_SPEED * (slowUntil - turnTurnAt))
  if (tapAt !== null && t > tapAt) x = Math.max(stop, x - TURN_FAST_SPEED * (t - tapAt))
  return x
}

/** The height of the feet of a man (percent from the top): his lane, plus a wave while he walks (nothing in a round without crossing); after the tap the Samaritan comes to the middle line of the road. */
export function turnY(w: TurnWalker, t: number, geo: TurnGeometry, tapAt: number | null = null): number {
  const wave = w.amp * Math.sin(1.1 * t + w.phase)
  if (!w.samaritan || tapAt === null || t <= tapAt) return geo.y + w.lane + wave
  const k = clamp(1 - (t - tapAt) / 1.5, 0, 1)
  return geo.y + (w.lane + wave) * k
}

/** Which way a man looks: to the right (1) while walking; the Samaritan to the left (-1) from the turn on. */
export function turnFacing(w: TurnWalker, t: number): 1 | -1 {
  return w.samaritan && t >= turnTurnAt ? -1 : 1
}

/** The Samaritan has come to Jesus and kneels. */
export function turnArrived(x: number, geo: TurnGeometry): boolean {
  return x <= geo.jesusX + TURN_KNEEL_GAP + 1e-6
}

/** The second at which a Samaritan tapped at `tapAt` kneels before Jesus (the time he needs from the place of the tap). */
export function turnArriveAt(w: TurnWalker, geo: TurnGeometry, tapAt: number): number {
  const stop = geo.jesusX + TURN_KNEEL_GAP
  const from = turnX(w, tapAt, geo, tapAt)
  return tapAt + Math.max(0, from - stop) / TURN_FAST_SPEED
}

/** What a tap on a man means: before the turn it is too early (nothing happens, no mistake); during the turn the Samaritan is right and every other man is wrong. */
export function turnJudge(w: { samaritan: boolean }, phase: TurnPhase): TurnVerdict {
  if (phase !== 'turn') return 'early'
  return w.samaritan ? 'right' : 'wrong'
}

/** The parts of the task a round has brought so far: every mistake counts a part (two at most), a solved round all three. */
export function turnRoundParts(roundMisses: number, solved: boolean): number {
  if (solved) return TURN_PARTS
  return clamp(Math.floor(roundMisses), 0, TURN_MISS_PARTS)
}

/** The layer of a man: whoever stands lower in the picture is in front. */
export function turnLayer(y: number): number {
  return Math.round(y * 10)
}

/** The problems of the data of a round (an empty list is good): the time to find the man, a Samaritan who cannot reach Jesus before the time is over, a road that is wide enough for ten men. */
export function turnRoundProblems(geo: TurnGeometry, round: TurnRoundRule): string[] {
  const out: string[] = []
  if (round.seconds < 2 || round.seconds > 8) out.push('the seconds to find the man should be between 2 and 8')
  if (geo.jesusX >= geo.startX) out.push('Jesus stands in the row')
  if (geo.houseX <= geo.startX + (TURN_MEN - 1) * geo.gap) out.push('the first man would stand behind the door at the start')
  if (geo.gap < 3) out.push('the men stand too close together')
  for (const slot of TURN_SLOTS) {
    const man: TurnWalker = { id: slot, samaritan: true, kind: -1, mirror: false, x0: geo.startX + (TURN_MEN - 1 - slot) * geo.gap, lane: 0, amp: 0, phase: 0, pace: 1 }
    const xEnd = turnX(man, turnTurnAt + round.seconds, geo, null)
    if (xEnd <= geo.jesusX + TURN_KNEEL_GAP + 1) {
      out.push(`the Samaritan at place ${slot} is with Jesus before the time is over`)
      break
    }
  }
  if (round.crossing && geo.spread < 4) out.push('the road is too narrow for men who cross each other')
  return out
}

// ---------------------------------------------------------------- 2. shout louder (`ruf`)

/** The crowd pushes the bar back by this many taps when the round does not say otherwise. */
export const SHOUT_PUSH = 3
/** The bar has ten steps; every step the bar reaches for the first time counts a part of the task. */
export const SHOUT_STEPS = 10
/** A round may not ask for more than this many taps a second (calls plus what the crowd pushes back). */
export const SHOUT_MAX_RATE = 4.5

/** The rule of a round: the seconds (they run from the first tap), the taps that fill the bar, how often the crowd says "Quiet!", and how far it pushes the bar back (in taps). */
export interface ShoutRule {
  seconds: number
  need: number
  hushes: number
  push?: number
}

export interface ShoutState {
  /** The bar in taps (0 to `need`). */
  level: number
  /** Seconds since the first tap. */
  time: number
  /** The clock runs from the first tap; before it nothing happens (no one is hurried before the game has begun). */
  started: boolean
  /** How many times the crowd has hushed so far. */
  hushed: number
}

export const shoutStart = (): ShoutState => ({ level: 0, time: 0, started: false, hushed: 0 })

const pushOf = (rule: ShoutRule) => Math.max(0, rule.push ?? SHOUT_PUSH)

/** One call: the bar rises by one tap (never above `need`); the first call starts the clock. */
export function shoutTap(s: ShoutState, rule: ShoutRule): ShoutState {
  return { ...s, started: true, level: Math.min(rule.need, s.level + 1) }
}

/** The bar is full. */
export function shoutFull(s: ShoutState, rule: ShoutRule): boolean {
  return rule.need > 0 && s.level >= rule.need
}

/** The bar as a share (0 to 1). */
export function shoutFill(s: ShoutState, rule: ShoutRule): number {
  return rule.need > 0 ? clamp(s.level / rule.need, 0, 1) : 0
}

/** The bar as a whole percent for the screen (0 to 100). */
export function shoutPercent(s: ShoutState, rule: ShoutRule): number {
  return Math.round(shoutFill(s, rule) * 100)
}

/** How many of the ten steps of the bar a level has reached (whole steps, no rounding up). */
export function shoutSteps(level: number, need: number): number {
  if (need <= 0) return 0
  return Math.floor((clamp(level, 0, need) * SHOUT_STEPS) / need)
}

/**
 * The seconds (from the first tap) at which the crowd says "Quiet!": spread evenly over the first nine tenths of the time, each moved a little by `rand` (at most a twentieth of the time),
 * the first not before 1.5 seconds, always in rising order, and the last at least 1.5 seconds before the end.
 */
export function shoutHushTimes(rule: ShoutRule, rand: () => number): number[] {
  const n = Math.max(0, Math.floor(rule.hushes))
  const out: number[] = []
  let before = 1
  for (let i = 1; i <= n; i++) {
    const base = (rule.seconds * 0.9 * i) / (n + 1)
    const t = clamp(base + (rand() - 0.5) * rule.seconds * 0.1, Math.max(1.5, before + 0.5), Math.max(1.5, rule.seconds - 1.5))
    out.push(Math.round(t * 100) / 100)
    before = t
  }
  return out
}

/**
 * `dt` seconds go by: once the clock runs, the time rises; at every hush time that is reached the bar is pushed back (never below 0); when the time is over before the bar is full, `timeUp` is true.
 * `hush` says that the crowd spoke in this step (more than one hush in one step count together).
 */
export function shoutTick(s: ShoutState, dt: number, rule: ShoutRule, times: readonly number[]): { state: ShoutState; hush: boolean; timeUp: boolean } {
  if (!s.started || shoutFull(s, rule)) return { state: s, hush: false, timeUp: false }
  let { level, hushed } = s
  const time = s.time + dt
  let hush = false
  while (hushed < times.length && time + 1e-9 >= times[hushed]!) {
    level = Math.max(0, level - pushOf(rule))
    hushed++
    hush = true
  }
  const state: ShoutState = { ...s, level, hushed, time }
  return { state, hush, timeUp: time + 1e-9 >= rule.seconds && level < rule.need }
}

/** The place of the group of Jesus (percent of the width): it walks from `from` to `to` in the seconds of the round, and stands still when the clock stands still. */
export function shoutGroupX(time: number, seconds: number, from: number, to: number): number {
  if (seconds <= 0) return from
  return from + (to - from) * clamp(time / seconds, 0, 1)
}

/** The parts of the task so far: the steps of the bar this round has reached at its best (a bar that the crowd pushed back does not take the parts away). */
export function shoutRoundParts(bestLevel: number, need: number, full: boolean): number {
  return full ? SHOUT_STEPS : shoutSteps(bestLevel, need)
}

/** The problems of the data of a round (an empty list is good): the time, the number of taps, a rate of taps a child can keep up, a hush that does not push the whole bar away at once. */
export function shoutRoundProblems(rule: ShoutRule): string[] {
  const out: string[] = []
  if (rule.seconds < 5) out.push('the time is too short')
  if (rule.need < 10) out.push('too few taps to fill the bar')
  if (rule.hushes < 0) out.push('a negative number of hushes')
  const push = pushOf(rule)
  if (push < 1 && rule.hushes > 0) out.push('a hush that pushes nothing back')
  if (push >= rule.need / 2) out.push('a hush pushes back too much')
  const rate = (rule.need + Math.max(0, rule.hushes) * push) / Math.max(1, rule.seconds)
  if (rate > SHOUT_MAX_RATE) out.push(`the child would have to tap ${rate.toFixed(1)} times a second`)
  return out
}
