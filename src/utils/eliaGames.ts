/**
 * The pure parts of the new games of "Elia" (the components only draw and listen): where a raven is at a time, whether the two caves hold the same number,
 * where a cloud is and how far it has grown, and when the wind, the earthquake, the fire and the quiet sound come. All times are in milliseconds.
 */
import type { LoudKind, RainCloud, RavenFlight, RavenKind, WhisperRound } from '@/types/adventure'

/** Bread and meat are food (right to tap); a twig and an empty beak are not. */
export function isFood(kind: RavenKind): boolean {
  return kind === 'bread' || kind === 'meat'
}

/** How many ravens of a round carry food. */
export function foodCount(flights: Pick<RavenFlight, 'kind'>[]): number {
  return flights.filter((f) => isFood(f.kind)).length
}

/** The middle of a raven (percent of the picture width) at the time `elapsed` of the round: it enters at the right edge (112) and has left at the left edge (-12); before its start it is not there (null). */
export function flightX(elapsed: number, f: Pick<RavenFlight, 'at' | 'dur'>): number | null {
  const p = (elapsed - f.at) / f.dur
  if (p < 0) return null
  return 112 - 124 * Math.min(1, p)
}

/** Whether the raven has crossed the whole picture at the time `elapsed`. */
export function flightOver(elapsed: number, f: Pick<RavenFlight, 'at' | 'dur'>): boolean {
  return elapsed >= f.at + f.dur
}

/** The height of a raven (percent of the picture height): it flies in a calm wave around its line. */
export function flightY(elapsed: number, f: Pick<RavenFlight, 'y' | 'at'>): number {
  return f.y + 2.4 * Math.sin((elapsed - f.at) / 520)
}

/** Whether every raven of a round has either been tapped (`gone`) or has left the picture. */
export function ravensRoundOver(elapsed: number, flights: Pick<RavenFlight, 'at' | 'dur'>[], gone: ReadonlySet<number>): boolean {
  return flights.every((f, i) => gone.has(i) || flightOver(elapsed, f))
}

/** Whether the two caves hold the same number of prophets. */
export function isEven(left: number, right: number): boolean {
  return left === right
}

/** Which cave holds too many and how many have to go back: `{ cave: 0 | 1, n }`, or `{ cave: -1, n: 0 }` when the caves are even. */
export function excess(left: number, right: number): { cave: -1 | 0 | 1; n: number } {
  if (left === right) return { cave: -1, n: 0 }
  const n = Math.abs(left - right) / 2
  return { cave: left > right ? 0 : 1, n: Math.ceil(n) }
}

/** The middle of a cloud (percent of the picture width) at the time `elapsed`: it enters at the left edge (-14) and has left at the right edge (114). Before its start it is not there (null). */
export function cloudX(elapsed: number, c: Pick<RainCloud, 'at' | 'dur'>): number | null {
  const p = (elapsed - c.at) / c.dur
  if (p < 0) return null
  return -14 + 128 * Math.min(1, p)
}

/** Whether the cloud has crossed the whole picture. */
export function cloudOver(elapsed: number, c: Pick<RainCloud, 'at' | 'dur'>): boolean {
  return elapsed >= c.at + c.dur
}

/** The size of the cloud that rises from the sea after `taps` taps: 0 tiny (like a hand), 1 medium, 2 big and heavy (it rains). */
export function rainGrowth(taps: number): 0 | 1 | 2 {
  return taps <= 0 ? 0 : taps === 1 ? 1 : 2
}

/** How green the mountain is: the share of the clouds that have rained, between 0 and 1. */
export function greenShare(rained: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, rained / total))
}

/** The time of each loud thing of a round: wind, earthquake and fire in the order of the round, one after the other with a pause between them, after a lead of `leadMs`. */
export function loudTimes(round: Pick<WhisperRound, 'order' | 'loudMs' | 'gapMs'>, leadMs = 0): { kind: LoudKind; from: number; to: number }[] {
  return round.order.map((kind, i) => {
    const from = leadMs + i * (round.loudMs + round.gapMs)
    return { kind, from, to: from + round.loudMs }
  })
}

/** When the quiet sound appears: after the last loud thing and the stillness. */
export function whisperAt(round: Pick<WhisperRound, 'order' | 'loudMs' | 'gapMs' | 'silenceMs'>, leadMs = 0): number {
  const times = loudTimes(round, leadMs)
  const last = times[times.length - 1]
  return (last ? last.to : leadMs) + round.silenceMs
}

/** Which loud thing is going on at the time `elapsed` (null in a pause or in the stillness). */
export function loudAt(elapsed: number, round: Pick<WhisperRound, 'order' | 'loudMs' | 'gapMs'>, leadMs = 0): LoudKind | null {
  for (const t of loudTimes(round, leadMs)) {
    if (elapsed >= t.from && elapsed < t.to) return t.kind
  }
  return null
}
