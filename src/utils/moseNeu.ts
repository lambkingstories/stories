/**
 * The pure part of the new game of "Mose" (5.11.2026; the component only shows and listens):
 * "Frogs back to the Nile" (`froesche`, Exodus 8 / 2. Mose 7,26–8,11): frogs sit everywhere in a house (by the oven, at the kneading trough, on the bed); a short swipe flicks a frog
 * through the open side of the house to the river. Round 2: more frogs, they hop on from place to place, and the swipe has to point at the water.
 * A game of tidying up, not a retelling: in the Bible the frogs die (8,9–10); the game says nothing else about them.
 * The arithmetic has no clock and no dice (the hops go round in a fixed order).
 */

/** A place where a frog can sit: the middle of its feet (`x`, `y`) and its width (`w`), all in percent of the picture (`w` and `x` of the width, `y` of the height). */
export interface FrogSpot {
  x: number
  y: number
  w: number
}
/** The water of the Nile that can be seen through the open side of the house: left and top edge, width and height, in percent of the picture. */
export interface FrogRiver {
  x: number
  y: number
  w: number
  h: number
}
/**
 * One round: the hint, the painted house (`scene`, without frogs), its width divided by its height (`ratio`, 0.75 without it), the water (`river`), the places (`spots`),
 * how many frogs sit there at the start (`count`: the first `count` places), how far a swipe may point past the water (`aim`, degrees; 180 = any direction counts),
 * and in round 2 how often a frog hops on to the next free place (`hop`, seconds; none = the frogs stay where they are).
 */
export interface FrogRound {
  hint: string
  scene: string
  ratio?: number
  river: FrogRiver
  spots: FrogSpot[]
  count: number
  aim: number
  hop?: number
}
/** The game "Frogs back to the Nile" (`froesche`): the sitting frogs (taken in turn, every second one mirrored), the frog in the jump (while it flies to the river) and the rounds. */
export interface FrogFlickGame {
  frogs: string[]
  jump: string
  rounds: FrogRound[]
}

/** A point in percent of the picture. */
export interface FrogPt {
  x: number
  y: number
}
/** One of eight directions on the screen, for the words "swipe up to the left" and so on. */
export type FrogDir = 'up' | 'down' | 'left' | 'right' | 'upLeft' | 'upRight' | 'downLeft' | 'downRight'

export const FROG_RATIO = 0.75
/** The smallest width of a frog (percent of the picture): 12 % of a field 360 pixels wide are 43 pixels. */
export const FROG_MIN_W = 12
/** The least distance between two places (in widths of the picture), so that the finger meets one frog only. */
export const FROG_MIN_GAP = 0.13
/** The shortest pause between two hops (seconds). */
export const FROG_MIN_HOP = 2.5

export const frogRatio = (r: { ratio?: number }): number => (r.ratio && r.ratio > 0 ? r.ratio : FROG_RATIO)

/** A point of the picture in units of its width (the vertical part shortened by the ratio), so that angles and distances are true on the screen. */
const unit = (p: FrogPt, ratio: number) => ({ x: p.x / 100, y: p.y / 100 / ratio })

/** The distance of two points in widths of the picture. */
export function frogDistance(a: FrogPt, b: FrogPt, ratio = FROG_RATIO): number {
  const ua = unit(a, ratio)
  const ub = unit(b, ratio)
  return Math.hypot(ua.x - ub.x, ua.y - ub.y)
}

/** Whether a point lies in the water. */
export const frogInRiver = (p: FrogPt, river: FrogRiver): boolean => p.x >= river.x && p.x <= river.x + river.w && p.y >= river.y && p.y <= river.y + river.h

/** The middle of the water. */
export const frogRiverMiddle = (river: FrogRiver): FrogPt => ({ x: river.x + river.w / 2, y: river.y + river.h / 2 })

/** An angle in degrees brought into (-180, 180]. */
export function frogNorm(deg: number): number {
  let d = deg % 360
  if (d <= -180) d += 360
  if (d > 180) d -= 360
  return d
}

/** The angle (degrees, 0 = right, 90 = down, as on the screen) of the way from `from` to `to`. */
export function frogAngle(from: FrogPt, to: FrogPt, ratio = FROG_RATIO): number {
  const a = unit(from, ratio)
  const b = unit(to, ratio)
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

/**
 * How the water is seen from a frog: the angle to its middle and how far the water reaches to either side of it (degrees, `lo` <= 0 <= `hi`),
 * i.e. every swipe between `mid + lo` and `mid + hi` points at the water.
 */
export function frogView(spot: FrogPt, river: FrogRiver, ratio = FROG_RATIO): { mid: number; lo: number; hi: number } {
  const mid = frogAngle(spot, frogRiverMiddle(river), ratio)
  const corners: FrogPt[] = [
    { x: river.x, y: river.y },
    { x: river.x + river.w, y: river.y },
    { x: river.x, y: river.y + river.h },
    { x: river.x + river.w, y: river.y + river.h }
  ]
  const ds = corners.map((c) => frogNorm(frogAngle(spot, c, ratio) - mid))
  return { mid, lo: Math.min(0, ...ds), hi: Math.max(0, ...ds) }
}

/** Whether a swipe (`dx`, `dy` in pixels of the screen) points at the water, with `aim` degrees to spare on either side (180 or more: any swipe counts). */
export function frogAimOk(spot: FrogPt, river: FrogRiver, dx: number, dy: number, aim: number, ratio = FROG_RATIO): boolean {
  if (aim >= 180) return true
  if (!dx && !dy) return false
  const v = frogView(spot, river, ratio)
  const d = frogNorm((Math.atan2(dy, dx) * 180) / Math.PI - v.mid)
  return d >= v.lo - aim && d <= v.hi + aim
}

/** Where a flicked frog lands: the nearest point of the water, moved a third of the way to its middle (so that it splashes into the water, not on its edge). */
export function frogTarget(spot: FrogPt, river: FrogRiver): FrogPt {
  const near = { x: Math.min(river.x + river.w, Math.max(river.x, spot.x)), y: Math.min(river.y + river.h, Math.max(river.y, spot.y)) }
  const m = frogRiverMiddle(river)
  return { x: near.x + (m.x - near.x) / 3, y: near.y + (m.y - near.y) / 3 }
}

/** The direction of the water from a frog, as one of eight words (for "Help me" and for a swipe the wrong way). */
export function frogDir(spot: FrogPt, river: FrogRiver, ratio = FROG_RATIO): FrogDir {
  const a = frogNorm(frogView(spot, river, ratio).mid)
  const k = Math.round(a / 45)
  const names: Record<string, FrogDir> = { '0': 'right', '1': 'downRight', '2': 'down', '3': 'downLeft', '4': 'left', '-4': 'left', '-3': 'upLeft', '-2': 'up', '-1': 'upRight' }
  return names[String(k)]!
}

/** The swipe that the keyboard (Enter) or "Help me" makes: straight at the middle of the water (in pixels of a field `width` wide). */
export function frogSwipeToWater(spot: FrogPt, river: FrogRiver, width = 360, ratio = FROG_RATIO): { dx: number; dy: number } {
  const m = frogRiverMiddle(river)
  const h = width / ratio
  return { dx: ((m.x - spot.x) / 100) * width, dy: ((m.y - spot.y) / 100) * h }
}

/** The next free place after place `from` (going round the list), or -1 when every place is taken. `taken[i]` is true for a place with a frog. */
export function frogNextFree(taken: readonly boolean[], from: number): number {
  const n = taken.length
  for (let k = 1; k < n; k++) {
    const i = (from + k) % n
    if (!taken[i]) return i
  }
  return -1
}

/** Whose turn it is to hop: the frogs still in the house take turns in the order of their numbers (`turn` counts the hops of the round; frogs in `skip` are passed over). */
export function frogHopper(inHouse: readonly number[], turn: number, skip: readonly number[] = []): number | null {
  const list = inHouse.filter((f) => !skip.includes(f))
  if (!list.length) return null
  return list[turn % list.length]!
}

/** The frogs of all rounds (the goal for "Go on"). */
export const frogGoal = (game: FrogFlickGame): number => game.rounds.reduce((n, r) => n + Math.max(0, r.count), 0)

/** The problems of the data of `froesche` (an empty list is good). */
export function frogFlickProblems(game: FrogFlickGame): string[] {
  const out: string[] = []
  if (!game.frogs.length || game.frogs.some((f) => !f)) out.push('no pictures of the sitting frogs')
  if (!game.jump) out.push('no picture of the jumping frog')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const ratio = frogRatio(r)
    if (!r.scene) out.push(`round ${n}: no picture of the house`)
    if (!r.hint) out.push(`round ${n}: no hint`)
    const rv = r.river
    if (rv.w <= 0 || rv.h <= 0 || rv.x < 0 || rv.y < 0 || rv.x + rv.w > 100 || rv.y + rv.h > 100) out.push(`round ${n}: the water lies outside the picture`)
    if (rv.w * rv.h < 150) out.push(`round ${n}: the water is too small to aim at`)
    if (!Number.isInteger(r.count) || r.count < 1) out.push(`round ${n}: there must be at least one frog`)
    if (r.spots.length < r.count) out.push(`round ${n}: ${r.count} frogs but only ${r.spots.length} places`)
    if (r.hop !== undefined) {
      if (r.hop < FROG_MIN_HOP) out.push(`round ${n}: the frogs hop too often (less than ${FROG_MIN_HOP} seconds)`)
      if (r.spots.length <= r.count) out.push(`round ${n}: the frogs hop, but there is no free place`)
    }
    if (!(r.aim > 0 && r.aim <= 180)) out.push(`round ${n}: aim must be more than 0 and at most 180 degrees`)
    r.spots.forEach((s, i) => {
      const k = i + 1
      if (s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100) out.push(`round ${n}: place ${k} lies outside the picture`)
      if (s.w < FROG_MIN_W) out.push(`round ${n}: the frog on place ${k} is too small for a finger (${s.w} < ${FROG_MIN_W})`)
      if (s.w > 25) out.push(`round ${n}: the frog on place ${k} is too big`)
      // the frog stands with its feet on the place and is about as high as it is wide: it must fit into the picture
      if (s.x - s.w / 2 < 0 || s.x + s.w / 2 > 100 || s.y - s.w * ratio < 0) out.push(`round ${n}: the frog on place ${k} sticks out of the picture`)
      if (frogInRiver(s, rv)) out.push(`round ${n}: place ${k} lies in the water`)
      r.spots.forEach((o, j) => {
        if (j > i && frogDistance(s, o, ratio) < FROG_MIN_GAP) out.push(`round ${n}: places ${k} and ${j + 1} lie too close together`)
      })
      if (r.aim < 180) {
        const v = frogView(s, rv, ratio)
        // there must be a wrong way as well, and the right way must be wide enough for a child's swipe
        if (v.hi - v.lo + 2 * r.aim >= 300) out.push(`round ${n}: from place ${k} almost every swipe counts`)
        if (v.hi - v.lo + 2 * r.aim < 30) out.push(`round ${n}: from place ${k} the water is too narrow to aim at`)
      }
    })
  })
  return out
}
