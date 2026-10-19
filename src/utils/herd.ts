/**
 * The herding game: the child's finger leads one animal (the leader) over the meadow, and the herd follows it in a row on its trail. There is no
 * physics and no swarm: the followers always stand on points of the trail the leader has walked, a fixed distance apart. A pond may lie in the way;
 * the leader cannot step into it but stops at its edge and slides along it. Everything is in "width units" (x and y both in hundredths of the
 * width of the meadow; the game turns the height into these). Plain functions, so that the game and the tests use the same arithmetic.
 */
export interface Pt {
  x: number
  y: number
}

export interface Circle extends Pt {
  r: number
}

/** The leader never walks faster than this (units per second), and a new point is put on the trail after this much distance. */
export const WALK_SPEED = 62
export const TRAIL_STEP = 0.8
const TRAIL_MAX = 900

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

/** Is the point inside the circle? */
export const inside = (p: Pt, c: Circle): boolean => dist(p, c) < c.r

/** A point inside the circle is moved to its edge (straight away from the middle); a point outside stays where it is. */
export function clampOutside(p: Pt, c: Circle): Pt {
  const d = dist(p, c)
  if (d >= c.r) return { ...p }
  if (d < 0.0001) return { x: c.x + c.r, y: c.y }
  return { x: c.x + ((p.x - c.x) / d) * c.r, y: c.y + ((p.y - c.y) / d) * c.r }
}

/**
 * One step of the leader towards the finger: it walks at most `WALK_SPEED * dt` and never into the pond (`obstacle`, already widened by the
 * size of the animal). When the straight step would end inside the pond, the leader ends on its edge, so it slides along it.
 */
export function walk(leader: Pt, target: Pt, dt: number, obstacle?: Circle): Pt {
  const d = dist(leader, target)
  const max = WALK_SPEED * dt
  const to = d <= max || d === 0 ? { ...target } : { x: leader.x + ((target.x - leader.x) / d) * max, y: leader.y + ((target.y - leader.y) / d) * max }
  return obstacle ? clampOutside(to, obstacle) : to
}

/** Adds a point to the trail when the leader has moved far enough from the last one (the trail does not grow for ever). */
export function extendTrail(trail: Pt[], p: Pt): void {
  const last = trail[trail.length - 1]
  if (!last || dist(last, p) >= TRAIL_STEP) trail.push({ ...p })
  if (trail.length > TRAIL_MAX) trail.splice(0, trail.length - TRAIL_MAX)
}

/**
 * Where the followers stand: on the trail, behind the head, `spacing` apart along the way the leader walked (the first one `spacing` behind
 * the head, the next `2 x spacing` ...). A trail that is not long enough yet leaves the followers at its beginning.
 */
export function followPositions(trail: Pt[], spacing: number, count: number): Pt[] {
  const out: Pt[] = []
  if (!trail.length) return out
  // walk back along the trail and drop a follower at each multiple of the spacing
  let along = 0
  let k = 1
  let i = trail.length - 1
  while (out.length < count) {
    if (i <= 0) {
      out.push({ ...trail[0]! })
      continue
    }
    const a = trail[i]!
    const b = trail[i - 1]!
    const seg = dist(a, b)
    while (out.length < count && along + seg >= k * spacing) {
      const f = seg === 0 ? 0 : (k * spacing - along) / seg
      out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })
      k++
    }
    along += seg
    i--
  }
  return out
}

/** The way the help shows: a straight line from the leader to the resting place, bent around the pond when the pond is in the way. */
export function helpPath(from: Pt, to: Pt, obstacle?: Circle): Pt[] {
  if (!obstacle) return [from, to]
  // the distance of the pond's middle from the line from -> to
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((obstacle.x - from.x) * dx + (obstacle.y - from.y) * dy) / len2))
  const near = { x: from.x + dx * t, y: from.y + dy * t }
  const gap = dist(near, obstacle)
  if (gap >= obstacle.r * 1.15) return [from, to]
  // a point beside the pond, on the side the line already passes (or to the right when it goes through the middle)
  const len = Math.sqrt(len2)
  const nx = -dy / len
  const ny = dx / len
  const side = (near.x - obstacle.x) * nx + (near.y - obstacle.y) * ny >= 0 ? 1 : -1
  const away = obstacle.r * 1.5
  const via = { x: obstacle.x + nx * side * away, y: obstacle.y + ny * side * away }
  return [from, via, to]
}
