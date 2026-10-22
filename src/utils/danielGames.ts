/**
 * The pure parts of the new games of "Daniel" (the components only draw and listen): the dishes of a day and how long a day lasts, the places of the statue,
 * the lamp and the signs on the wall, the sun and the prayer times. All times are in milliseconds unless the name says seconds.
 */
import type { DaysDish, HoursRound, LampSign } from '@/types/adventure'

/** A small seeded random generator (the same seed gives the same numbers), so the days of the game are the same in every test. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Daniel eats vegetables and drinks water; meat and sweets are the king's food. */
export function isGoodDish(kind: DaysDish['kind']): boolean {
  return kind === 'veg' || kind === 'water'
}

/** The four dishes of a day (their indexes in `dishes`): one of every kind, the variant and the order change from day to day. `day` counts from 0. */
export function buildDay(day: number, dishes: Pick<DaysDish, 'kind'>[]): number[] {
  const rnd = seeded(7919 * (day + 1))
  const kinds: DaysDish['kind'][] = ['veg', 'water', 'meat', 'sweet']
  const picks = kinds.map((k) => {
    const of = dishes.map((d, i) => ({ d, i })).filter((x) => x.d.kind === k)
    return of.length ? of[(day + Math.floor(rnd() * of.length)) % of.length]!.i : -1
  }).filter((i) => i >= 0)
  // shuffle (Fisher-Yates), but never put both good dishes side by side on every day: the order is only random
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[picks[i], picks[j]] = [picks[j]!, picks[i]!]
  }
  return picks
}

/** How long a day lasts in the days game: `limits` are the seconds for days 1 to 3, 4 to 7 and 8 to 10 (`day` counts from 0); with "reduce motion" two seconds more. */
export function dayLimitMs(day: number, limits: [number, number, number], reduced = false): number {
  const s = day < 3 ? limits[0] : day < 7 ? limits[1] : limits[2]
  return (s + (reduced ? 2 : 0)) * 1000
}

/** Whether the disc of the statue `piece` belongs in the place `slot` (both counted from the head, 0 to 4). */
export function isRightSlot(piece: number, slot: number): boolean {
  return piece === slot
}

/** How fast the lamp was moved: percent of the picture width per second between two places (the picture is 4:3, the height counts three quarters). */
export function lampSpeed(prev: { x: number; y: number }, next: { x: number; y: number }, dtMs: number): number {
  if (dtMs <= 0) return 0
  return (Math.hypot(next.x - prev.x, (next.y - prev.y) * 0.75) / dtMs) * 1000
}

/** The lamp is too fast when it moves more than half the width of the picture in a second: the flame goes out. */
export const LAMP_TOO_FAST = 55

/** Whether the lamp (its middle) lights a sign: the sign lies within the circle of light, a little less than the full radius (so the sign is in its middle). */
export function isOnSign(lamp: { x: number; y: number }, sign: Pick<LampSign, 'x' | 'y'>, radius: number): boolean {
  return Math.hypot(lamp.x - sign.x, (lamp.y - sign.y) * 0.75) <= radius * 0.8
}

/** How full the ring of a sign is after `dtMs`: it fills in `seconds` seconds over the sign and empties quickly when the lamp leaves; between 0 and 1. */
export function fillStep(fill: number, dtMs: number, onSign: boolean, seconds = 1.2): number {
  const next = onSign ? fill + dtMs / (seconds * 1000) : fill - dtMs / 600
  return Math.min(1, Math.max(0, next))
}

/** The radius of the circle of light at the time `t`: with a flickering flame it breathes a little (a tenth to each side). */
export function lightRadius(base: number, t: number, flicker: boolean): number {
  return flicker ? base * (1 + 0.1 * Math.sin(t / 230) + 0.04 * Math.sin(t / 97)) : base
}

/** Where the sun is when it has gone `p` (0 to 1) of its day: it climbs from the left in an arc and sets at the right (percent of the picture). */
export function sunOnArc(p: number): { x: number; y: number } {
  const q = Math.min(1, Math.max(0, p))
  return { x: 8 + 84 * q, y: 62 - 48 * Math.sin(Math.PI * q) }
}

/** The three prayer times of a day as shares of the day (morning, noon, evening). */
export const PRAYER_MARKS = [0.2, 0.5, 0.8] as const

/** The prayer time whose window contains the time `tMs` of a day (counted from the start of the day), or -1: a window reaches `windowMs` to each side of the mark. */
export function prayerAt(tMs: number, round: Pick<HoursRound, 'dayMs' | 'windowMs'>): number {
  for (let i = 0; i < PRAYER_MARKS.length; i++) {
    if (Math.abs(tMs - PRAYER_MARKS[i]! * round.dayMs) <= round.windowMs) return i
  }
  return -1
}

/** How many prayer times a round has (three a day). */
export function prayerTotal(round: Pick<HoursRound, 'days'>): number {
  return round.days * PRAYER_MARKS.length
}
