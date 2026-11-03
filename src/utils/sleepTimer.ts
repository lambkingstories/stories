/**
 * The good-night mode: a story is listened to while the app counts down. These are the pure parts (the choices of the timer and the
 * way the voice gets softer at the end), so they can be tested without a device.
 */

/** The choices of the timer in minutes; `0` means "until the story ends". */
export const SLEEP_TIMER_MINUTES = [10, 20, 30, 0] as const
export type SleepTimerMinutes = (typeof SLEEP_TIMER_MINUTES)[number]

/** The last seconds of the timer in which the voice gets softer and softer. */
export const FADE_MS = 30_000

/** The volume to use while `remainingMs` are left: the chosen volume until the fade starts, then a straight line down to silence. */
export function fadedVolume(base: number, remainingMs: number, fadeMs = FADE_MS): number {
  const v = Math.min(1, Math.max(0, base))
  if (remainingMs <= 0) return 0
  if (remainingMs >= fadeMs) return v
  return v * (remainingMs / fadeMs)
}

/** "18:05" for the countdown on the screen. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
