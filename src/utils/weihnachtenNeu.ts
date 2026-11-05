/**
 * The pure parts of the four new games of "Weihnachten" (Antons Regel 5.11.2026; the components only show and listen):
 * 1. "The census" (`zaehlung`, Luke 2,1-5): travelers are dragged on the map to the town where they are to be counted; Joseph and Mary belong to Bethlehem.
 * 2. "The shepherds' fire" (`hirtenfeuer`, Luke 2,8): in the night, wood is laid on at the right moment, so that the fire by the sheep keeps burning.
 * 3. "Spread the word" (`weitersagen`, Luke 2,17): the shepherds go from house to house; the ways between the houses must not cross.
 * 4. "Follow the star" (`stern`, Matthew 2,9): the star moves over the sky; the wise men are kept under it until it stands over the house.
 * All places are percent of the picture (x of the width, y of the height). Distances are "units" (percent of the width): the vertical difference is divided by the ratio of the
 * picture (width / height), so that a circle is round on the screen. The arithmetic has no clock and no dice; the types live here until they are moved to `types/adventure.ts`.
 */

export interface Pt {
  x: number
  y: number
}

/** The distance of two places in units (percent of the width); `ratio` is the width of the picture divided by its height. */
export function wnDist(a: Pt, b: Pt, ratio: number): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

const inside = (p: Pt, margin = 0): boolean => p.x >= margin && p.x <= 100 - margin && p.y >= margin && p.y <= 100 - margin

/**
 * The neighbour for the arrow keys: the nearest place in the direction `dx`, `dy` (-1, 0 or 1) from place `idx`; places straight in that direction come first.
 * Without a place there: `idx` itself (or the first place when `idx` is not a place).
 */
export function wnNeighbour(points: readonly Pt[], idx: number, dx: number, dy: number, ratio: number): number {
  if (!points.length) return -1
  if (idx < 0 || idx >= points.length) return 0
  const a = points[idx]!
  let best = idx
  let bestScore = Infinity
  points.forEach((p, i) => {
    if (i === idx) return
    const ux = p.x - a.x
    const uy = (p.y - a.y) / ratio
    const along = ux * dx + uy * dy
    if (along <= 0.01) return
    const across = Math.abs(ux * dy - uy * dx)
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}

// ================================================================ 1. the census (`zaehlung`)

/** The map is upright, 2:3 (width / height). */
export const CENSUS_RATIO = 2 / 3
/** How near (units) the finger must let go of a traveler to a town. Towns lie at least twice as far apart. */
export const CENSUS_PICK = 9
/** The width of a traveler who stands at his town (percent of the map); the sprites are 300 x 330. */
export const CENSUS_FIGURE = 12
export const CENSUS_SPRITE = 300 / 330

/** A painted town of the map: its middle (percent) and its name (the app writes it on the map; the picture has no text). */
export interface CensusTown extends Pt {
  id: string
  name: string
  /** On which side of the town the travelers who have arrived stand: 1 right (the default), -1 left (the row goes away from the town). */
  side?: 1 | -1
}
/** A traveler of a round: the picture (300 x 330, transparent), the name, the words that tell where he belongs, and the id of that town. */
export interface CensusPerson {
  image: string
  name: string
  clue: string
  town: string
}
export interface CensusRound {
  hint: string
  people: CensusPerson[]
}
/** The game "The census" (`zaehlung`): the painted map (3:4, without text), its towns and the rounds. */
export interface CensusGame {
  map: string
  towns: CensusTown[]
  rounds: CensusRound[]
  /** The width of a standing traveler (percent of the map), `CENSUS_FIGURE` without it. */
  figureW?: number
}

export type CensusVerdict = 'ok' | 'wrong'

export const censusDist = (a: Pt, b: Pt): number => wnDist(a, b, CENSUS_RATIO)

/** The town at a place (where a traveler is let go): the nearest one within `pick` units, or -1. */
export function censusTownAt(towns: readonly CensusTown[], p: Pt, pick = CENSUS_PICK): number {
  let best = -1
  let bestD = pick
  towns.forEach((t, i) => {
    const d = censusDist(t, p)
    if (d <= bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** Does the traveler belong to this town? */
export const censusVerdict = (person: CensusPerson, townId: string): CensusVerdict => (person.town === townId ? 'ok' : 'wrong')

/**
 * Where the travelers who have come to a town stand: their feet in a row beside the town (on its `side`; the name of the town is written above it, the painted houses are small), `k` of `n`
 * (percent of the map). The row goes away from the town and is kept inside the map.
 */
export function censusSpot(town: CensusTown, k: number, _n: number, figureW = CENSUS_FIGURE): Pt {
  const side = town.side ?? 1
  const step = figureW * 0.62
  const x = town.x + side * (step + 3 + k * step)
  return { x: Math.min(100 - figureW / 2, Math.max(figureW / 2, x)), y: Math.min(99, town.y + 8) }
}

/** "Help me": the first traveler of the round who is not at his town yet, and the index of his town (null when all are there). */
export function censusHelp(game: CensusGame, round: CensusRound, placed: readonly boolean[]): { person: number; town: number } | null {
  const i = round.people.findIndex((_, k) => !placed[k])
  if (i < 0) return null
  const town = game.towns.findIndex((t) => t.id === round.people[i]!.town)
  return town < 0 ? null : { person: i, town }
}

/** The problems of the data of `zaehlung` (an empty list is good). */
export function censusProblems(game: CensusGame): string[] {
  const out: string[] = []
  if (!game.map) out.push('no picture of the map')
  if (game.towns.length < 3) out.push('fewer than three towns')
  const ids = game.towns.map((t) => t.id)
  if (new Set(ids).size !== ids.length) out.push('two towns have the same id')
  game.towns.forEach((t, i) => {
    if (!t.name.trim()) out.push(`town ${i + 1} has no name`)
    if (!inside(t, 4)) out.push(`the town "${t.name}" lies too near the edge of the map`)
    game.towns.forEach((o, k) => {
      if (k > i && censusDist(t, o) < 2 * CENSUS_PICK) out.push(`the towns "${t.name}" and "${o.name}" are nearer than ${2 * CENSUS_PICK} units: a traveler could land at the wrong one`)
    })
  })
  // the travelers who stand at a town must not stand on another town (the most that can come to one town is counted)
  const most = Math.max(0, ...game.rounds.map((r) => Math.max(0, ...game.towns.map((t) => r.people.filter((p) => p.town === t.id).length))))
  game.towns.forEach((t) => {
    for (let k = 0; k < most; k++) {
      const spot = censusSpot(t, k, most, game.figureW ?? CENSUS_FIGURE)
      game.towns.forEach((o) => {
        if (o !== t && censusDist({ x: spot.x, y: spot.y - 5 }, o) < 9) out.push(`the travelers at "${t.name}" stand on the town "${o.name}"`)
      })
    }
  })
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    if (r.people.length < 2) out.push(`round ${n}: fewer than two travelers`)
    if (r.people.length > 8) out.push(`round ${n}: more than eight travelers do not fit under the map on a phone`)
    const names = r.people.map((p) => p.name)
    if (new Set(names).size !== names.length) out.push(`round ${n}: two travelers have the same name`)
    r.people.forEach((p, k) => {
      if (!p.image) out.push(`round ${n}: traveler ${k + 1} has no picture`)
      if (!p.name.trim() || !p.clue.trim()) out.push(`round ${n}: traveler ${k + 1} has no name or no clue`)
      if (!ids.includes(p.town)) out.push(`round ${n}: the town "${p.town}" of ${p.name} is not on the map`)
    })
    if (new Set(r.people.map((p) => p.town)).size < 3) out.push(`round ${n}: the travelers go to fewer than three towns`)
    // every town's row of travelers must fit on the map
    for (const t of game.towns) {
      const count = r.people.filter((p) => p.town === t.id).length
      if (count * (game.figureW ?? CENSUS_FIGURE) * 0.62 > 90) out.push(`round ${n}: too many travelers for "${t.name}"`)
    }
  })
  if (game.rounds.length >= 2 && game.rounds[1]!.people.length <= game.rounds[0]!.people.length) out.push('round 2 must have more travelers than round 1')
  return out
}

// ================================================================ 2. the shepherds' fire (`hirtenfeuer`)

/** The field is 3:2 (width / height). */
export const FIRE_RATIO = 1.5
/** Above this the fire is still too big: wood laid on now burns for nothing (a mistake). */
export const FIRE_EARLY = 0.45
/** Below this only the embers glow ("just in time"). */
export const FIRE_EMBERS = 0.2
/** The size of a fire that was relit after it went out. */
export const FIRE_RELIGHT = 0.35
/** How long a fire that went out stays dark before a shepherd lights it again (seconds). */
export const FIRE_DARK = 1.2

/** The place of a fire: the middle of the bottom of the fire picture (percent of the field) and its width (percent). */
export interface FireSpot extends Pt {
  w: number
}
/**
 * One round: the hint, the fires, how many times wood must be laid on in all (`feeds`), how many seconds a full fire burns until it is out (`burn`), and how full each fire is at
 * the start (`start`, 0 to 1; 1 without it).
 */
export interface FireRound {
  hint: string
  spots: FireSpot[]
  feeds: number
  burn: number
  start?: number[]
}
/**
 * The game "The shepherds' fire" (`hirtenfeuer`): the field at night (3:2, the foreground empty), the fire in four sizes (`stages`: embers, small, medium, big; all the same
 * picture size, the stone ring in the same place), the bundle of wood, the moon (it goes over the sky while the night passes), the way of the moon and the rounds.
 */
export interface FireGame {
  background: string
  stages: string[]
  wood: string
  moon: string
  moonFrom: Pt
  moonTo: Pt
  moonW: number
  rounds: FireRound[]
}

/** The fire pictures are 400 x 312 (width / height). */
export const FIRE_SPRITE = 400 / 312

/** The size of a fire: 3 big, 2 medium, 1 small, 0 only embers, -1 out. */
export type FireStage = -1 | 0 | 1 | 2 | 3
export function fireStage(level: number): FireStage {
  if (level <= 0) return -1
  if (level <= FIRE_EMBERS) return 0
  if (level <= FIRE_EARLY) return 1
  if (level <= 0.7) return 2
  return 3
}

/** The fire burns down for `dt` seconds. */
export const fireBurn = (level: number, dt: number, burn: number): number => Math.max(0, level - dt / Math.max(0.1, burn))

/** Wood is laid on: too early (the fire is still big), in time, or just in time (only the embers glow). */
export type FireVerdict = 'early' | 'ok' | 'late'
export function fireFeed(level: number): FireVerdict {
  if (level > FIRE_EARLY) return 'early'
  if (level <= FIRE_EMBERS) return 'late'
  return 'ok'
}

/** The levels at the start of a round. */
export const fireStart = (round: FireRound): number[] => round.spots.map((_, i) => Math.min(1, Math.max(0.05, round.start?.[i] ?? 1)))

/** Where the moon is when a part `frac` (0 to 1) of the night is over: on a flat arc from `moonFrom` to `moonTo`. */
export function fireMoon(game: FireGame, frac: number): Pt {
  const f = Math.min(1, Math.max(0, frac))
  const x = game.moonFrom.x + (game.moonTo.x - game.moonFrom.x) * f
  const y = game.moonFrom.y + (game.moonTo.y - game.moonFrom.y) * f - Math.sin(Math.PI * f) * 6
  return { x, y }
}

/** The fire that needs wood most (the lowest one that is not too big any more), or -1. */
export function fireNeediest(levels: readonly number[]): number {
  let best = -1
  levels.forEach((l, i) => {
    if (l > 0 && l <= FIRE_EARLY && (best < 0 || l < levels[best]!)) best = i
  })
  return best
}

/** The problems of the data of `hirtenfeuer` (an empty list is good). */
export function fireProblems(game: FireGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the field')
  if (game.stages.length !== 4 || game.stages.some((s) => !s)) out.push('the fire needs exactly four pictures (embers, small, medium, big)')
  if (!game.wood) out.push('no picture of the wood')
  if (!game.moon) out.push('no picture of the moon')
  for (const p of [game.moonFrom, game.moonTo]) if (!inside(p)) out.push('the way of the moon leaves the picture')
  if (game.moonFrom.y > 40 || game.moonTo.y > 40) out.push('the moon must stay in the sky (the upper 40 %)')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    if (r.spots.length < 1) out.push(`round ${n}: no fire`)
    if (r.feeds < r.spots.length * 2) out.push(`round ${n}: every fire should get wood at least twice`)
    // the time in which wood can be laid on: from "small" to "out"
    if (r.burn * FIRE_EARLY < 3) out.push(`round ${n}: the fire burns down too fast (less than 3 seconds to lay on wood)`)
    if (r.burn > 30) out.push(`round ${n}: the fire burns so slowly that the round is boring`)
    if (r.start && r.start.length !== r.spots.length) out.push(`round ${n}: ${r.spots.length} fires but ${r.start.length} start values`)
    r.spots.forEach((s, i) => {
      if (s.w < 12) out.push(`round ${n}: fire ${i + 1} is too small to tap on a phone`)
      if (s.x - s.w / 2 < 0 || s.x + s.w / 2 > 100 || s.y > 100 || s.y < 55) out.push(`round ${n}: fire ${i + 1} must stand in the empty foreground`)
      r.spots.forEach((o, k) => {
        if (k > i && Math.abs(s.x - o.x) < (s.w + o.w) / 2 + 4) out.push(`round ${n}: fires ${i + 1} and ${k + 1} are too close`)
      })
    })
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [FireRound, FireRound]
    if (!(b.spots.length > a.spots.length || b.burn < a.burn)) out.push('round 2 must be harder (more fires or a faster fire)')
  }
  return out
}

// ================================================================ 3. spread the word (`weitersagen`)

/** The village is 4:3 (width / height). */
export const TELL_RATIO = 4 / 3
/** A way may not pass nearer than this (units) to a house it does not go to. */
export const TELL_NEAR = 5
/** How far apart the houses stand at least (units). */
export const TELL_APART = 13

/** A house of the village: the picture (front view, transparent), its name, the place of its door (the way ends there; percent) and the width of the picture (percent). */
export interface TellHouse extends Pt {
  image: string
  name: string
  w: number
}
/** One round: the hint, the shelter with the manger (`start`, where the shepherds set out) and the houses. */
export interface TellRound {
  hint: string
  start: TellHouse
  houses: TellHouse[]
}
/** The game "Spread the word" (`weitersagen`): the village green (4:3), the piece of footpath (a straight strip, repeated along a way), the shepherds and the rounds. */
export interface TellGame {
  background: string
  path: string
  walker: string
  walkerW: number
  rounds: TellRound[]
}

/** The house pictures are 340 x 290 (width / height). */
export const TELL_SPRITE = 340 / 290

/** The place whose picture is under a point (the picture stands on its door: x is its middle, y its bottom edge), or -1; the nearest door wins when pictures overlap. */
export function tellPlaceAt(points: readonly TellHouse[], p: Pt, margin = 1.5): number {
  let best = -1
  let bestD = Infinity
  points.forEach((h, i) => {
    const hh = (h.w / TELL_SPRITE) * TELL_RATIO
    if (p.x < h.x - h.w / 2 - margin || p.x > h.x + h.w / 2 + margin || p.y < h.y - hh - margin || p.y > h.y + margin) return
    const d = wnDist(p, { x: h.x, y: h.y - hh / 2 }, TELL_RATIO)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** The places of a round: 0 is the shelter, 1 … n the houses. */
export const tellPoints = (round: TellRound): TellHouse[] => [round.start, ...round.houses]

const cross = (o: Pt, a: Pt, b: Pt): number => (a.x - o.x) * ((b.y - o.y) / TELL_RATIO) - ((a.y - o.y) / TELL_RATIO) * (b.x - o.x)

/** Do the ways a–b and c–d cross (or lie on each other)? Ways that only meet at a common end do not. */
export function tellCrosses(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const same = (p: Pt, q: Pt) => Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9
  const shared = same(a, c) || same(a, d) || same(b, c) || same(b, d)
  const d1 = cross(c, d, a)
  const d2 = cross(c, d, b)
  const d3 = cross(a, b, c)
  const d4 = cross(a, b, d)
  const eps = 1e-9
  if (((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) && ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps))) return !shared
  // on one line: they lie on each other when they overlap by more than a point
  if (Math.abs(d1) <= eps && Math.abs(d2) <= eps) {
    const t = (p: Pt) => (Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? (p.x - a.x) / (b.x - a.x) : (p.y - a.y) / (b.y - a.y))
    const lo = Math.max(0, Math.min(t(c), t(d)))
    const hi = Math.min(1, Math.max(t(c), t(d)))
    return hi - lo > 1e-6
  }
  return false
}

/** Where two ways cross (for the cross mark); the middle of a–b when they lie on each other. */
export function tellCrossPoint(a: Pt, b: Pt, c: Pt, d: Pt): Pt {
  const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x)
  if (Math.abs(den) < 1e-12) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
}

/** The distance (units) of a place from the way a–b. */
export function tellSegDist(p: Pt, a: Pt, b: Pt): number {
  const ax = a.x
  const ay = a.y / TELL_RATIO
  const bx = b.x
  const by = b.y / TELL_RATIO
  const px = p.x
  const py = p.y / TELL_RATIO
  const l2 = (bx - ax) ** 2 + (by - ay) ** 2
  const t = l2 ? Math.min(1, Math.max(0, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2)) : 0
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)))
}

/** What happens when the shepherds go from the last place of the route to place `j`. */
export type TellVerdict = { kind: 'ok' } | { kind: 'cross'; segment: number; at: Pt } | { kind: 'house'; house: number } | { kind: 'told' } | { kind: 'same' }

/** The verdict for a new way from the end of `route` (indices of `points`) to `j`. */
export function tellTry(points: readonly Pt[], route: readonly number[], j: number): TellVerdict {
  const last = route[route.length - 1]!
  if (j === last) return { kind: 'same' }
  if (route.includes(j)) return { kind: 'told' }
  const a = points[last]!
  const b = points[j]!
  for (let s = 0; s + 1 < route.length; s++) {
    const c = points[route[s]!]!
    const d = points[route[s + 1]!]!
    if (tellCrosses(a, b, c, d)) return { kind: 'cross', segment: s, at: tellCrossPoint(a, b, c, d) }
  }
  for (let k = 0; k < points.length; k++) {
    if (k === last || k === j) continue
    if (tellSegDist(points[k]!, a, b) < TELL_NEAR) return { kind: 'house', house: k }
  }
  return { kind: 'ok' }
}

/** The places the shepherds can go to next without a crossing. */
export const tellOptions = (points: readonly Pt[], route: readonly number[]): number[] =>
  points.map((_, j) => j).filter((j) => tellTry(points, route, j).kind === 'ok')

/** A way to finish the route (the places after `route`), or null when there is none (then a way must be taken back). */
export function tellSolve(points: readonly Pt[], route: readonly number[]): number[] | null {
  if (route.length >= points.length) return []
  for (const j of tellOptions(points, route)) {
    const rest = tellSolve(points, [...route, j])
    if (rest) return [j, ...rest]
  }
  return null
}

/** "Help me": the next house of a way that works, or "take back the last way" when the route cannot be finished any more. */
export function tellHelp(points: readonly Pt[], route: readonly number[]): { next: number } | { undo: true } | null {
  if (route.length >= points.length) return null
  const rest = tellSolve(points, route)
  if (rest && rest.length) return { next: rest[0]! }
  return route.length > 1 ? { undo: true } : null
}

/** How many dead ends a round has: routes from the shelter that cannot go on although houses are left (counted up to `limit`). Round 2 should have some, so that it is a puzzle. */
export function tellTraps(points: readonly Pt[], limit = 1000): number {
  let traps = 0
  const walk = (route: number[]) => {
    if (traps >= limit || route.length >= points.length) return
    const opts = tellOptions(points, route)
    if (!opts.length) {
      traps++
      return
    }
    for (const j of opts) walk([...route, j])
  }
  walk([0])
  return traps
}

/** The problems of the data of `weitersagen` (an empty list is good). */
export function tellProblems(game: TellGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the village')
  if (!game.path) out.push('no picture of the footpath')
  if (!game.walker) out.push('no picture of the shepherds')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const pts = tellPoints(r)
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    if (r.houses.length < 3) out.push(`round ${n}: fewer than three houses`)
    if (pts.length > 10) out.push(`round ${n}: more than ten places do not fit on a phone`)
    pts.forEach((p, i) => {
      if (!p.image || !p.name.trim()) out.push(`round ${n}: place ${i + 1} has no picture or no name`)
      if (p.x - p.w / 2 < 0 || p.x + p.w / 2 > 100 || p.y > 99 || p.y - (p.w / TELL_SPRITE) * TELL_RATIO < 0) out.push(`round ${n}: "${p.name}" does not lie wholly in the picture`)
      if (p.w < 12) out.push(`round ${n}: "${p.name}" is too small to tap on a phone`)
      pts.forEach((o, k) => {
        if (k > i && wnDist(p, o, TELL_RATIO) < TELL_APART) out.push(`round ${n}: "${p.name}" and "${o.name}" stand too close together`)
      })
    })
    if (pts.length >= 2 && !tellSolve(pts, [0])) out.push(`round ${n}: the houses cannot all be reached without a crossing`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [TellRound, TellRound]
    if (b.houses.length <= a.houses.length) out.push('round 2 must have more houses than round 1')
    if (tellTraps(tellPoints(b), 1) < 1) out.push('round 2 has no dead end: it is no puzzle')
  }
  return out
}

// ================================================================ 4. follow the star (`stern`)

/** The field is 3:2 (width / height). */
export const STAR_RATIO = 1.5
/** After this many seconds away from the star it counts as lost (one mistake, once each time). */
export const STAR_LOST = 1.6
/** How long the wise men must stand under the star when it has stopped (seconds). */
export const STAR_SETTLE = 0.6

/**
 * One round: the hint, the places (x, percent) the star goes to one after the other, always on towards the house (the Bible: the star "went before them"), how fast it goes (percent a second),
 * how long it waits at each place (seconds), how near the wise men must be (`tolerance`, percent), how many seconds of the way under the star make the round (`goal`; the star must not
 * have come to its last place before) and where the star stops at the end (`end`, x). The house where the child is stands at `end` (in every round).
 */
export interface StarRound {
  hint: string
  stops: number[]
  starSpeed: number
  pause: number
  tolerance: number
  goal: number
  end: number
}
/**
 * The game "Follow the star" (`stern`): the night landscape (3:2), the star, the wise men (walking to the right), the house, the heights (percent) of the star and of the feet of the
 * wise men, their width, how fast they go (percent a second), and the rounds.
 */
export interface StarGame {
  background: string
  star: string
  walkers: string
  house: string
  starY: number
  starW: number
  walkY: number
  walkW: number
  houseW: number
  walkSpeed: number
  /** Width divided by height of the pictures of the wise men, the star and the house (1 without them; they are only used for the stand-ins). */
  walkRatio?: number
  houseRatio?: number
  rounds: StarRound[]
}

/** The state of a round: the time on the star's way, where the star and the wise men are, how many seconds they went under it, how long they are away from it. */
export interface StarState {
  t: number
  sx: number
  x: number
  face: 1 | -1
  journey: number
  away: number
  lostCounted: boolean
  final: boolean
  settle: number
  arrived: boolean
}
export type StarEvent = { type: 'lost' } | { type: 'found' } | { type: 'stop' } | { type: 'arrived' }

/** The length of one trip of the star over all its places (seconds). */
export function starCycle(round: StarRound): number {
  const s = round.stops
  if (s.length < 2) return Math.max(round.pause, 0.001)
  let t = 0
  for (let i = 0; i < s.length; i++) t += Math.abs(s[(i + 1) % s.length]! - s[i]!) / round.starSpeed + round.pause
  return t
}

/** The time at which the star reaches its last place (seconds). */
export function starArrival(round: StarRound): number {
  const s = round.stops
  let t = round.pause
  for (let i = 0; i + 1 < s.length; i++) t += Math.abs(s[i + 1]! - s[i]!) / round.starSpeed + round.pause
  return t
}

/** Where the star is at time `t` (x, percent): it waits at each place and goes on to the next one (after the last one it would go back to the first; a round ends before). */
export function starX(round: StarRound, t: number): number {
  const s = round.stops
  if (!s.length) return 50
  if (s.length === 1) return s[0]!
  const cycle = starCycle(round)
  let left = ((t % cycle) + cycle) % cycle
  for (let i = 0; i < s.length; i++) {
    if (left < round.pause) return s[i]!
    left -= round.pause
    const a = s[i]!
    const b = s[(i + 1) % s.length]!
    const go = Math.abs(b - a) / round.starSpeed
    if (left < go) return a + (b - a) * (left / go)
    left -= go
  }
  return s[0]!
}

export const starStart = (round: StarRound, x?: number): StarState => {
  const sx = starX(round, 0)
  return { t: 0, sx, x: x ?? sx, face: 1, journey: 0, away: 0, lostCounted: false, final: false, settle: 0, arrived: false }
}

/** The wise men are under the star. */
export const starUnder = (round: StarRound, st: Pick<StarState, 'x' | 'sx'>): boolean => Math.abs(st.x - st.sx) <= round.tolerance

/**
 * One step of `dt` seconds: the wise men go towards `target` (x, or null to stand), the star goes its way (or, when the way is done, to its end and stays there),
 * the time under the star counts, and being away too long is one mistake. The wise men stay inside the field.
 */
export function starStep(game: StarGame, round: StarRound, st: StarState, target: number | null, dt: number): { state: StarState; events: StarEvent[] } {
  const s: StarState = { ...st }
  const events: StarEvent[] = []
  if (s.arrived) return { state: s, events }
  const lo = game.walkW / 2
  const hi = 100 - game.walkW / 2
  if (target !== null) {
    const goal = Math.min(hi, Math.max(lo, target))
    const step = game.walkSpeed * dt
    const d = goal - s.x
    if (Math.abs(d) > 0.05) s.face = d > 0 ? 1 : -1
    s.x = Math.abs(d) <= step ? goal : s.x + Math.sign(d) * step
  }
  if (!s.final) {
    s.t += dt
    s.sx = starX(round, s.t)
  } else {
    const d = round.end - s.sx
    const step = round.starSpeed * dt
    s.sx = Math.abs(d) <= step ? round.end : s.sx + Math.sign(d) * step
  }
  const under = starUnder(round, s)
  if (under) {
    if (s.away >= STAR_LOST) events.push({ type: 'found' })
    s.away = 0
    s.lostCounted = false
    if (!s.final) {
      s.journey += dt
      if (s.journey >= round.goal) {
        s.final = true
        events.push({ type: 'stop' })
      }
    } else if (Math.abs(s.sx - round.end) < 1e-6) {
      s.settle += dt
      if (s.settle >= STAR_SETTLE) {
        s.arrived = true
        events.push({ type: 'arrived' })
      }
    }
  } else {
    s.away += dt
    s.settle = 0
    if (s.away >= STAR_LOST && !s.lostCounted) {
      s.lostCounted = true
      events.push({ type: 'lost' })
    }
  }
  return { state: s, events }
}

/** The problems of the data of `stern` (an empty list is good). */
export function starProblems(game: StarGame): string[] {
  const out: string[] = []
  for (const [k, v] of [['landscape', game.background], ['star', game.star], ['wise men', game.walkers], ['house', game.house]] as const) if (!v) out.push(`no picture of the ${k}`)
  if (game.starY < 5 || game.starY > 45) out.push('the star must be in the sky (5 to 45 % from the top)')
  if (game.walkY < 60 || game.walkY > 100) out.push('the wise men must walk on the road (60 to 100 % from the top)')
  if (game.walkW < 14) out.push('the wise men are too small for a phone (at least 14 % of the width)')
  if (game.starW < 10) out.push('the star is too small for a phone (at least 10 % of the width)')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  const lo = game.walkW / 2
  const hi = 100 - game.walkW / 2
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.hint.trim()) out.push(`round ${n}: no hint`)
    if (r.stops.length < 2) out.push(`round ${n}: the star needs at least two places`)
    if (r.stops.some((x, k) => k > 0 && x <= r.stops[k - 1]!)) out.push(`round ${n}: the star goes only on towards the house (the places must grow)`)
    if (r.stops.length && r.end !== r.stops[r.stops.length - 1]) out.push(`round ${n}: the last place of the star must be the house`)
    if (r.stops.length >= 2 && r.goal > starArrival(r) - 1) out.push(`round ${n}: the way of ${r.goal} seconds is longer than the star needs to reach the house (${starArrival(r).toFixed(1)})`)
    for (const x of [...r.stops, r.end]) if (x < lo || x > hi) out.push(`round ${n}: the star goes to ${x} %, where the wise men cannot stand under it`)
    if (game.walkSpeed < r.starSpeed * 1.5) out.push(`round ${n}: the wise men must be at least one and a half times as fast as the star`)
    if (r.tolerance < 4) out.push(`round ${n}: the wise men must be nearer than 4 % to the star: too hard`)
    if (r.goal < 8) out.push(`round ${n}: the way is too short`)
    if (r.goal > 40) out.push(`round ${n}: the way is too long`)
    if (r.pause < 0) out.push(`round ${n}: the star cannot wait less than nothing`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [StarRound, StarRound]
    if (!(b.starSpeed > a.starSpeed || b.tolerance < a.tolerance)) out.push('round 2 must be harder (a faster star or less room)')
  }
  return out
}
