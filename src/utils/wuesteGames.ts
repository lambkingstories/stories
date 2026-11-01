/**
 * The pure parts of the four new games of "The People in the Desert" (the components only draw and listen): "Hold the arms" (Exodus 17,11-12), "Share the cases" (Exodus 18,22), "The silver trumpets"
 * (Numbers 10,1-10) and "Carry the grapes" (Numbers 13,23). Places are percent of the picture (4:3); levels and tilts are numbers; times are seconds.
 */

// ------------------------------------------------------------------------------------------------ Hold the arms

/** The arms count as "up" from this level (0 = hanging, 1 = high above the head). */
export const ARMS_UP = 0.67
/** How fast the arms rise while the child holds a finger on Moses' hands (share of the way per second). */
export const ARMS_RISE = 0.9
/** What a tap on a helper lifts the arms (the helpers stretch up one after the other). */
export const HELPER_PUSH = 0.22

/** The level after `dt` seconds: it rises while the finger holds, and sinks otherwise (never below 0 or above 1). */
export function armsStep(level: number, dt: number, holding: boolean, sink: number): number {
  const next = level + (holding ? ARMS_RISE : -sink) * dt
  return Math.min(1, Math.max(0, next))
}

/** Which of the three pictures of Moses shows: arms down (0), halfway (1), up (2). */
export function armsPose(level: number): 0 | 1 | 2 {
  if (level >= ARMS_UP) return 2
  if (level >= 0.34) return 1
  return 0
}

export const armsAreUp = (level: number): boolean => level >= ARMS_UP

/** A tap on a helper: it lifts the arms, but only when the other helper was the one before ("it is his turn"); the same man twice in a row is too tired. */
export function helperTap(last: string | null, who: string): 'ok' | 'again' {
  return last === who ? 'again' : 'ok'
}

/** The level after a good tap on a helper (at most 1). */
export function helperLift(level: number): number {
  return Math.min(1, level + HELPER_PUSH)
}

/** How long the arms have stayed up after a time step (only the time with the arms up counts). */
export function armsUpTime(upTime: number, dt: number, level: number): number {
  return armsAreUp(level) ? upTime + dt : upTime
}

// ------------------------------------------------------------------------------------------------ Share the cases

export type CaseResult = 'ok' | 'tooHeavy' | 'tooLight'

/** A case is taken to a seat: a small case is decided by any of the men who judge; a great one goes to Moses. */
export function caseStep(weight: 'small' | 'great', atMoses: boolean): CaseResult {
  if (weight === 'small') return atMoses ? 'tooLight' : 'ok'
  return atMoses ? 'ok' : 'tooHeavy'
}

/** The round is done when every case has been decided. */
export const casesDone = (decided: number, total: number): boolean => total > 0 && decided >= total

// ------------------------------------------------------------------------------------------------ The silver trumpets

export type SignalKind = 'all' | 'leaders' | 'break'

/** One sound of a trumpet: when it starts (seconds after the signal begins), how long it lasts, and which of the two priests blow (0 = left, 1 = right). */
export interface Blast {
  at: number
  dur: number
  priests: number[]
}

/** What the priests do for a signal that lasts `seconds`: both blow one long note (all gather), only one blows one long note (the leaders), or both blow short blasts again and again (the camp breaks up). */
export function signalBlasts(kind: SignalKind, seconds: number): Blast[] {
  if (kind === 'all') return [{ at: 0, dur: seconds, priests: [0, 1] }]
  if (kind === 'leaders') return [{ at: 0, dur: seconds, priests: [0] }]
  const n = 4
  const step = seconds / n
  return Array.from({ length: n }, (_, i) => ({ at: i * step, dur: step * 0.6, priests: [0, 1] }))
}

/** The answer of the child to a row of signals: `ok` (all right so far and complete), `more` (right so far, more to come) or `wrong` (a mistake). */
export function signalAnswer(expected: readonly SignalKind[], given: readonly SignalKind[]): 'ok' | 'more' | 'wrong' {
  for (let i = 0; i < given.length; i++) if (given[i] !== expected[i]) return 'wrong'
  return given.length >= expected.length ? 'ok' : 'more'
}

/** The seconds to wait before the next signal of a row starts (the end of the one before plus a breath). */
export function signalGap(seconds: number): number {
  return seconds + 0.9
}

// ------------------------------------------------------------------------------------------------ Carry the grapes

/** The pole falls out of balance beyond this tilt (-1 = the back end low, 1 = the front end low). */
export const TILT_LIMIT = 0.85
/** How long the pole may stay beyond the limit before a berry falls (seconds). */
export const TILT_GRACE = 0.35
/** How fast a held button tilts the pole back (tilt per second). */
export const TILT_CONTROL = 1.5

/**
 * How the way pushes the pole at the time `t` (tilt per second): the two men do not step in time, so the pole wobbles (`wobble` 0 to 1); on hills the way also goes up and down for a while.
 * It is made of sines, so a test can ask for any time and a round is the same every time.
 */
export function wobbleAt(t: number, wobble: number, hills: boolean): number {
  const base = wobble * 0.55 * (Math.sin(1.3 * t) + 0.6 * Math.sin(2.9 * t + 1))
  const slope = hills ? 0.4 * Math.sin(0.55 * t + 0.5) : 0
  return base + slope
}

/** The tilt after `dt` seconds at the time `t`; `input` is -1 (lift the back end), 0 or 1 (lift the front end); the tilt stays between -1.2 and 1.2. */
export function grapesStep(tilt: number, t: number, dt: number, input: -1 | 0 | 1, wobble: number, hills: boolean): number {
  const next = tilt + (wobbleAt(t, wobble, hills) - input * TILT_CONTROL) * dt
  return Math.min(1.2, Math.max(-1.2, next))
}

export const tiltedTooFar = (tilt: number): boolean => Math.abs(tilt) > TILT_LIMIT

/** The tilt after a berry has fallen: the pole springs half way back. */
export const tiltAfterFall = (tilt: number): number => tilt * 0.4

/** How many berries may still fall: the cluster is never bare (at least one berry stays). */
export function berriesLeft(total: number, lost: number): number {
  return Math.max(1, total - lost)
}

/** The share of the way that has been walked (0 to 1). */
export const wayShare = (t: number, seconds: number): number => (seconds <= 0 ? 1 : Math.min(1, Math.max(0, t / seconds)))
