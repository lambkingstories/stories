import { onBeforeUnmount } from 'vue'
import confetti from 'canvas-confetti'
import useSfx from '@/use/useSfx'
import type { Medal } from '@/types/adventure'

/**
 * The celebration when a cup is won: bronze is quiet (a cup sound and a small shower), silver a little more, gold the full party
 * (a fanfare, a cup sound and a firework of confetti that goes up here and there for a few seconds). Friendly and not loud; for children
 * who switched motion off the confetti stays away (`disableForReducedMotion`) and only the sounds are left. The timers stop when the page goes.
 */
export default function useCelebration() {
  const { play } = useSfx()
  const timers: number[] = []
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
  const shower = (particleCount: number, x: number, y: number, spread = 70, velocity = 35) =>
    confetti({ particleCount, spread, startVelocity: velocity, origin: { x, y }, ticks: 140, scalar: 0.9, disableForReducedMotion: true })

  function celebrate(medal: Medal | null) {
    if (!medal) return
    if (medal === 'bronze') {
      later(() => play('trophy'), 200)
      later(() => shower(36, 0.5, 0.6, 55, 28), 250)
      return
    }
    if (medal === 'silver') {
      later(() => play('trophy'), 200)
      later(() => play('star'), 700)
      later(() => shower(60, 0.35, 0.65), 250)
      later(() => shower(60, 0.65, 0.65), 800)
      return
    }
    // gold: the fanfare, the cup sound, and fireworks (bursts of confetti high up at different places)
    later(() => play('fanfare'), 150)
    later(() => play('trophy'), 900)
    const bursts: [number, number, number][] = [[0.5, 0.45, 0], [0.25, 0.35, 450], [0.75, 0.35, 900], [0.4, 0.3, 1500], [0.6, 0.3, 2000], [0.5, 0.4, 2700]]
    for (const [x, y, at] of bursts) later(() => confetti({ particleCount: 90, spread: 360, startVelocity: 24, gravity: 0.9, ticks: 120, origin: { x, y }, scalar: 0.95, disableForReducedMotion: true }), 250 + at)
    later(() => shower(80, 0.5, 0.75, 100, 45), 3300)
  }

  function stop() {
    while (timers.length) window.clearTimeout(timers.pop())
  }
  onBeforeUnmount(stop)
  return { celebrate, stop }
}
