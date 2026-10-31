/**
 * The pure parts of the two new games of "The Young Jesus and His Baptism" (the components only draw and listen): "Prepare the way" (Matthew 3,3: stones, thorns and branches are
 * cleared away, the travelers stay) and "Cast the net" (Matthew 4,18: a tap casts the round net and takes in the fish under it). Places are percent of the picture (4:3).
 */

export type PickResult = 'ok' | 'wrong'

/** One tap on a thing of the road: a stone, a thornbush or a branch is cleared away; a traveler must be left alone. */
export function roadStep(keep: boolean): PickResult {
  return keep ? 'wrong' : 'ok'
}

/** The road is clear when every thing that is no traveler is gone. */
export function roadIsClear(cleared: number, total: number): boolean {
  return total > 0 && cleared >= total
}

/** A fish: its place (middle, percent) and its speed to the right (negative: to the left, percent a second) and up or down. */
export interface Fish {
  x: number
  y: number
  vx: number
  vy: number
}

/** The sea is 4:3: a step of one percent of the height is three quarters of a percent of the width. */
const PIC = 3 / 4

export interface Area {
  x: number
  y: number
  w: number
  h: number
}

/** The start of `n` fish: spread over the area in lanes, every second one swimming to the left; `rand` gives numbers from 0 to 1. */
export function startFish(n: number, area: Area, speed: number, rand: () => number): Fish[] {
  const out: Fish[] = []
  for (let i = 0; i < n; i++) {
    const lane = (i + 0.5) / n
    const dir = i % 2 === 0 ? 1 : -1
    out.push({
      x: area.x + rand() * area.w,
      y: area.y + lane * area.h,
      vx: dir * speed * 100 * (0.8 + rand() * 0.4),
      vy: (rand() - 0.5) * speed * 40
    })
  }
  return out
}

/** One step of the swimming: the fish swim on, turn round at the edges of the area and drift a little up and down (never out of the area). */
export function stepFish(fish: Fish[], dt: number, area: Area, rand: () => number): Fish[] {
  return fish.map((f) => {
    let { vx, vy } = f
    if (rand() < dt / 3) vy = (rand() - 0.5) * Math.abs(vx) * 0.4
    let x = f.x + vx * dt
    let y = f.y + vy * dt
    if (x < area.x) {
      x = area.x
      vx = Math.abs(vx)
    } else if (x > area.x + area.w) {
      x = area.x + area.w
      vx = -Math.abs(vx)
    }
    if (y < area.y) {
      y = area.y
      vy = Math.abs(vy)
    } else if (y > area.y + area.h) {
      y = area.y + area.h
      vy = -Math.abs(vy)
    }
    return { x, y, vx, vy }
  })
}

/** Which fish (their numbers) lie under a net that is cast at `at`; `reach` is the radius in percent of the width. */
export function castNet(fish: readonly Fish[], at: { x: number; y: number }, reach: number): number[] {
  const out: number[] = []
  fish.forEach((f, i) => {
    if (Math.hypot(f.x - at.x, (f.y - at.y) * PIC) <= reach) out.push(i)
  })
  return out
}

/** The place of the fish that is nearest to a point (for the button "Cast for me"); -1 when there is none. */
export function nearestFish(fish: readonly Fish[], at: { x: number; y: number }): number {
  let best = -1
  let bestD = Infinity
  fish.forEach((f, i) => {
    const d = Math.hypot(f.x - at.x, (f.y - at.y) * PIC)
    if (d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}
