/**
 * The pure parts of three games of "Bis nach Rom" (no. 32, id `paulusrom`; the components only show and listen):
 * "Shadows on the wall" (`wandschatten`, field `wallShadows`, Acts 20,8: many lamps throw the shadows of the listeners on the wall; the child taps the person who casts the shadow),
 * "A place for two" (`beiseite`, field `quietSpot`, Acts 23,19: the captain takes the young man to a place apart; the child brings the two where nobody listens) and
 * "Boards to the shore" (`bretter`, field `planks`, Acts 27,44: the child chooses the place where a board goes into the water; the painted current carries it to the shore or to the rocks).
 * All places are percent of the picture: x a part of the width, y a part of the height. Distances are measured in "units" (percent of the width), so that a circle is round
 * on the screen: `prDist` divides the vertical difference by the ratio of the picture (width / height). The arithmetic has no clock and no dice.
 */

export interface PrPt {
  x: number
  y: number
}

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function prDist(a: PrPt, b: PrPt, ratio = 1): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

// ================================================================ 1. shadows on the wall (`wandschatten`)

/** A listener: his picture (240 x 360, transparent), the painted shadow of the same pose (300 x 420, transparent) and two words for the screen reader. */
export interface WallPerson {
  id: string
  image: string
  shadow: string
  name: string
  shadowName: string
}
/** A shadow that appears on the wall: whose it is, how much bigger than the picture of the shadow (the lamp stands nearer) and whether it is turned round (the lamp stands on the other side). */
export interface WallShadow {
  id: string
  scale: number
  flip: boolean
}
/** A round: the hint, the people who sit in the row (ids, from left to right) and the shadows one after the other. */
export interface WallShadowRound {
  hint: string
  people: string[]
  shadows: WallShadow[]
}
/**
 * The game "Shadows on the wall" (`wallShadows`): the room (3:2, no people), the middle of the wall (`x`, the shadow stands on `base`, both percent) and how high a shadow is at scale 1
 * (`h`, percent of the HEIGHT of the room), where the feet of the people stand (`rowY`, percent of the height), the widest a person may be (`personW`, percent of the width), the
 * people and the rounds.
 */
export interface WallShadowGame {
  room: string
  ratio?: number
  wall: { x: number; base: number; h: number }
  rowY: number
  personW: number
  people: WallPerson[]
  rounds: WallShadowRound[]
}

/** The width of one person of a row of `n`: not wider than `personW`, and the row fits into 94 percent of the width. */
export const wallPersonW = (game: Pick<WallShadowGame, 'personW'>, n: number): number => Math.min(game.personW, 94 / Math.max(1, n))

/** The middle of person `i` in a row of `n` (percent of the width). */
export const wallPersonX = (n: number, i: number): number => ((i + 0.5) / Math.max(1, n)) * 100

/** The size of a shadow on the wall (percent of the width and of the height of the room): the picture of the shadow is 300 x 420. */
export function wallShadowSize(game: Pick<WallShadowGame, 'wall' | 'ratio'>, scale: number): { w: number; h: number } {
  const h = game.wall.h * scale
  return { h, w: (h * (300 / 420)) / (game.ratio ?? 1.5) }
}

/** A tap on a person: right when it is the person who casts the shadow. */
export const wallFits = (shadow: WallShadow, person: WallPerson): boolean => shadow.id === person.id

/** The problems of the data of `wandschatten` (an empty list is good). */
export function wallShadowsProblems(game: WallShadowGame): string[] {
  const out: string[] = []
  if (!game.room) out.push('no picture of the room')
  if (game.personW < 12) out.push('the people are too small for a phone (at least 12 percent)')
  if (game.wall.base - game.wall.h * 1.3 < 0) out.push('a big shadow (scale 1.3) does not fit above the baseline of the wall')
  const big = wallShadowSize(game, 1.3)
  if (game.wall.x - big.w / 2 < 0 || game.wall.x + big.w / 2 > 100) out.push('a big shadow does not fit into the width of the room')
  if (game.rowY > 98 || game.rowY < 60) out.push('the row of people should stand in the lower part of the room')
  const ids = game.people.map((p) => p.id)
  if (new Set(ids).size !== ids.length) out.push('two people have the same id')
  for (const p of game.people) {
    if (!p.image || !p.shadow) out.push(`${p.id}: no picture of the person or of the shadow`)
    if (!p.name || !p.shadowName) out.push(`${p.id}: no name for the screen reader`)
  }
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (r.people.length < 3) out.push(`round ${n}: fewer than three people`)
    if (r.people.length > 6) out.push(`round ${n}: more than six people do not fit into a row on a phone`)
    if (new Set(r.people).size !== r.people.length) out.push(`round ${n}: a person sits twice`)
    for (const id of r.people) if (!ids.includes(id)) out.push(`round ${n}: the person "${id}" does not exist`)
    if (r.people.length >= 1 && wallPersonW(game, r.people.length) < 12) out.push(`round ${n}: the people would be narrower than 12 percent`)
    if (r.shadows.length < 3) out.push(`round ${n}: fewer than three shadows`)
    const seen = r.shadows.map((s) => s.id)
    if (new Set(seen).size !== seen.length) out.push(`round ${n}: a shadow comes twice`)
    for (const s of r.shadows) {
      if (!r.people.includes(s.id)) out.push(`round ${n}: the shadow of "${s.id}" belongs to nobody in the row`)
      if (s.scale < 0.8 || s.scale > 1.3) out.push(`round ${n}: the scale of the shadow of "${s.id}" must be between 0.8 and 1.3`)
    }
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [WallShadowRound, WallShadowRound]
    if (b.people.length <= a.people.length) out.push('round 2 should have more people than round 1')
    if (a.shadows.some((s) => s.flip || s.scale !== 1)) out.push('in round 1 the shadows are not turned and not bigger')
    if (b.shadows.filter((s) => s.flip || s.scale !== 1).length < 2) out.push('in round 2 at least two shadows are bigger or turned')
  }
  return out
}

// ================================================================ 2. a place for two (`beiseite`)

/** A pillar or a fountain of the yard: the pair cannot be put down on it (no mistake). */
export interface QuietBlock {
  x: number
  y: number
  r: number
}
/** A soldier: which picture (1 to 5), where he stands and how far he hears (radius of his ring, percent of the width). */
export interface QuietSoldier {
  sprite: number
  x: number
  y: number
  r: number
}
/** A round: the hint, the soldiers, the rings (`always` visible or `near`: they show when the pair comes nearer than one and a half times the radius), the obstacles, where the pair starts. */
export interface QuietRound {
  hint: string
  soldiers: QuietSoldier[]
  showRings: 'always' | 'near'
  blocks: QuietBlock[]
  start: PrPt
}
/**
 * The game "A place for two" (`quietSpot`): the yard (4:3, no people), the five soldiers (220 x 260, transparent), the pair walking and the pair talking (260 x 300), the ring of hearing
 * (600 x 600, transparent), the width of a soldier and of the pair (percent of the width), the radius of the pair (percent of the width) and the rounds.
 */
export interface QuietSpotGame {
  yard: string
  ratio?: number
  soldiers: string[]
  pair: string
  pairTalk: string
  ring: string
  soldierW: number
  pairW: number
  pairR: number
  rounds: QuietRound[]
}

/** A soldier hears the pair when its middle is inside his ring (plus half the radius of the pair). */
export const quietHears = (s: QuietSoldier, p: PrPt, pairR: number, ratio = 4 / 3): boolean => prDist(p, s, ratio) < s.r + pairR * 0.5

/** The index of the first soldier who hears the pair at `p`, or -1. */
export const quietHeardBy = (round: Pick<QuietRound, 'soldiers'>, p: PrPt, pairR: number, ratio = 4 / 3): number => round.soldiers.findIndex((s) => quietHears(s, p, pairR, ratio))

/** The pair cannot be put down on an obstacle. */
export const quietBlockedAt = (round: Pick<QuietRound, 'blocks'>, p: PrPt, pairR: number, ratio = 4 / 3): boolean =>
  round.blocks.some((b) => prDist(p, b, ratio) < b.r + pairR * 0.5)

/** How far a point is from being heard or blocked (units; more than 0 means free): the smallest margin to a ring, an obstacle or the edge of the yard. */
export function quietSlack(round: Pick<QuietRound, 'soldiers' | 'blocks'>, p: PrPt, pairR: number, ratio = 4 / 3): number {
  let m = Infinity
  for (const s of round.soldiers) m = Math.min(m, prDist(p, s, ratio) - (s.r + pairR * 0.5))
  for (const b of round.blocks) m = Math.min(m, prDist(p, b, ratio) - (b.r + pairR * 0.5))
  m = Math.min(m, p.x - pairR, 100 - pairR - p.x, p.y / ratio - pairR, (100 - p.y) / ratio - pairR)
  return m
}

/** The free cells of the yard on a grid (every 2 percent): the cells whose slack is at least `margin`. */
function quietCells(round: Pick<QuietRound, 'soldiers' | 'blocks'>, pairR: number, ratio: number, margin: number): { x: number; y: number; slack: number }[] {
  const out: { x: number; y: number; slack: number }[] = []
  for (let y = 2; y <= 98; y += 2) {
    for (let x = 2; x <= 98; x += 2) {
      const slack = quietSlack(round, { x, y }, pairR, ratio)
      if (slack >= margin) out.push({ x, y, slack })
    }
  }
  return out
}

/** The best place to put the pair down (the most room around it) and how much room it has, or null when there is none. */
export function quietBestSpot(round: Pick<QuietRound, 'soldiers' | 'blocks'>, pairR: number, ratio = 4 / 3): { p: PrPt; slack: number } | null {
  let best: { p: PrPt; slack: number } | null = null
  for (const c of quietCells(round, pairR, ratio, 0.01)) if (!best || c.slack > best.slack) best = { p: { x: c.x, y: c.y }, slack: c.slack }
  return best
}

/** How many separate free places there are that have at least `margin` room around the middle of the pair (cells that touch form one place; a place of fewer than `minCells` grid cells is too small to count). */
export function quietPlaces(round: Pick<QuietRound, 'soldiers' | 'blocks'>, pairR: number, ratio = 4 / 3, margin = 1, minCells = 4): number {
  const cells = quietCells(round, pairR, ratio, margin)
  const key = (x: number, y: number) => `${x},${y}`
  const left = new Set(cells.map((c) => key(c.x, c.y)))
  let n = 0
  for (const c of cells) {
    if (!left.has(key(c.x, c.y))) continue
    let size = 1
    const stack = [c]
    left.delete(key(c.x, c.y))
    while (stack.length) {
      const q = stack.pop()!
      for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]] as const) {
        const k = key(q.x + dx, q.y + dy)
        if (left.has(k)) {
          left.delete(k)
          size++
          stack.push({ x: q.x + dx, y: q.y + dy, slack: 0 })
        }
      }
    }
    if (size >= minCells) n++
  }
  return n
}

/** The problems of the data of `beiseite` (an empty list is good). */
export function quietSpotProblems(game: QuietSpotGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 4 / 3
  if (!game.yard) out.push('no picture of the yard')
  if (!game.pair || !game.pairTalk) out.push('no pictures of the pair')
  if (!game.ring) out.push('no picture of the ring')
  if (game.soldiers.length < 5) out.push('five soldier pictures are needed')
  if (game.pairW < 14) out.push('the pair is too small for a phone (at least 14 percent)')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    for (const s of r.soldiers) {
      if (s.sprite < 1 || s.sprite > game.soldiers.length) out.push(`round ${n}: a soldier has no picture`)
      if (s.r < 6) out.push(`round ${n}: a ring is too small to see (at least 6 percent)`)
    }
    if (new Set(r.soldiers.map((s) => s.sprite)).size !== r.soldiers.length) out.push(`round ${n}: a soldier picture is used twice`)
    if (quietHeardBy(r, r.start, game.pairR, ratio) >= 0) out.push(`round ${n}: the pair starts inside a ring`)
    const best = quietBestSpot(r, game.pairR, ratio)
    if (!best) {
      out.push(`round ${n}: there is no free place for the pair`)
      return
    }
    if (best.slack < 3) out.push(`round ${n}: the free place is too small to hit with a finger (room ${best.slack.toFixed(1)}, at least 3)`)
    const places = quietPlaces(r, game.pairR, ratio, 1.5)
    if (i === 0 && places < 2) out.push('round 1 should have two separate free places')
    if (i === 1 && places !== 1) out.push(`round 2 should have exactly one free place (it has ${places})`)
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [QuietRound, QuietRound]
    if (b.soldiers.length <= a.soldiers.length) out.push('round 2 should have more soldiers than round 1')
    if (a.showRings !== 'always') out.push('in round 1 the rings are always visible')
    if (b.showRings !== 'near') out.push('in round 2 the rings show only when the pair comes near')
    if (b.soldiers.reduce((s, x) => s + x.r, 0) / b.soldiers.length <= a.soldiers.reduce((s, x) => s + x.r, 0) / a.soldiers.length) out.push('in round 2 the rings should be bigger')
  }
  return out
}

// ================================================================ 3. boards to the shore (`bretter`)

/** A board (or a piece of the ship) with a person on it, and the picture of the same person standing on the beach (160 x 260). */
export interface PlankItem {
  id: string
  image: string
  ashore: string
  name: string
}
/** A track of the current: where it begins on the rail of the ship (percent of the width), the points it runs through (percent of the picture) and where it leads. */
export interface PlankPath {
  start: number
  points: PrPt[]
  ends: 'shore' | 'rocks'
}
/** A round: the hint, the boards that wait (ids of `items`, one after the other) and the tracks that are painted in this round (indices of `PlanksGame.paths`). */
export interface PlankRound {
  hint: string
  boards: string[]
  paths: number[]
}
/**
 * The game "Boards to the shore" (`planks`): the bay (3:4), the finishing picture (3:2), the boards, the tracks of the current, the rail of the ship (`y` percent of the height, the board
 * slides between `from` and `to` percent of the width), the width of a board and of a person on the beach (percent of the width) and the rounds.
 */
export interface PlanksGame {
  bay: string
  ratio?: number
  finale: string
  items: PlankItem[]
  paths: PlankPath[]
  rail: { y: number; from: number; to: number }
  boardW: number
  ashoreW: number
  rounds: PlankRound[]
}

/** The track whose beginning is nearest to the place `x` on the rail, among the tracks of this round (index into `PlanksGame.paths`). */
export function planksPathAt(game: Pick<PlanksGame, 'paths'>, round: Pick<PlankRound, 'paths'>, x: number): number {
  let best = round.paths[0]!
  let bestD = Infinity
  for (const i of round.paths) {
    const d = Math.abs(game.paths[i]!.start - x)
    if (d < bestD) {
      best = i
      bestD = d
    }
  }
  return best
}

/** The problems of the data of `bretter` (an empty list is good). */
export function planksProblems(game: PlanksGame): string[] {
  const out: string[] = []
  if (!game.bay) out.push('no picture of the bay')
  if (!game.finale) out.push('no finishing picture')
  if (game.boardW < 14) out.push('the boards are too small for a phone (at least 14 percent)')
  if (game.rail.from >= game.rail.to) out.push('the rail has no length')
  const ids = game.items.map((i) => i.id)
  if (new Set(ids).size !== ids.length) out.push('two boards have the same id')
  for (const i of game.items) if (!i.image || !i.ashore || !i.name) out.push(`${i.id}: a picture or a name is missing`)
  game.paths.forEach((p, k) => {
    if (p.points.length < 2) out.push(`track ${k}: fewer than two points`)
    if (p.start < game.rail.from || p.start > game.rail.to) out.push(`track ${k}: the beginning is not on the rail`)
    const first = p.points[0]
    if (first && (Math.abs(first.y - game.rail.y) > 6 || Math.abs(first.x - p.start) > 4)) out.push(`track ${k}: the first point is not at the rail`)
    for (const q of p.points) if (q.x < 0 || q.x > 100 || q.y < 0 || q.y > 100) out.push(`track ${k}: a point lies outside the picture`)
  })
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    for (const b of r.boards) if (!ids.includes(b)) out.push(`round ${n}: the board "${b}" does not exist`)
    if (new Set(r.boards).size !== r.boards.length) out.push(`round ${n}: a board comes twice`)
    if (r.boards.length < 3 || r.boards.length > 6) out.push(`round ${n}: three to six boards are needed`)
    for (const k of r.paths) if (!game.paths[k]) out.push(`round ${n}: the track ${k} does not exist`)
    if (!r.paths.some((k) => game.paths[k]?.ends === 'shore')) out.push(`round ${n}: no track leads to the shore`)
    if (!r.paths.some((k) => game.paths[k]?.ends === 'rocks')) out.push(`round ${n}: no track leads to the rocks (there is nothing to read)`)
    const starts = r.paths.map((k) => game.paths[k]?.start ?? 0).sort((a, b) => a - b)
    for (let k = 1; k < starts.length; k++) if (starts[k]! - starts[k - 1]! < 6.5) out.push(`round ${n}: two tracks begin less than 6.5 percent apart (too near for a finger)`)
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [PlankRound, PlankRound]
    if (b.boards.length <= a.boards.length) out.push('round 2 should have more boards than round 1')
    if (b.paths.length <= a.paths.length) out.push('round 2 should have more tracks than round 1')
    const good = (r: PlankRound) => r.paths.filter((k) => game.paths[k]?.ends === 'shore').length
    if (good(b) >= good(a) + 2) out.push('round 2 should not have many more good tracks than round 1')
  }
  return out
}
