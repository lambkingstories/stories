/**
 * The pure parts of three games of "Pfingsten" (no. 30, id `pfingsten`; the components only show and listen):
 * "To the uttermost part of the earth" (`zeugen`, field `witness`, Acts 1,8: the places go into the rings in the order of the verse, then the light is pulled outwards ring by ring),
 * "Everyone hears it" (`sprachen`, field `tongues`, Acts 2,5-11: every guest is brought to his own land on the map) and
 * "Fill the baskets" (`koerbe`, field `fill`, Acts 4,35: gifts of different sizes are shared so that every family has exactly enough).
 * All places are percent of the picture. The arithmetic has no clock and no dice.
 */

export interface Pt {
  x: number
  y: number
}

/** The distance of two places in percent of the width; the vertical difference is shortened by the ratio of the picture (width / height). */
export function pfDist(a: Pt, b: Pt, ratio = 1): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

// ================================================================ 1. to the uttermost part of the earth (`zeugen`)

/** A place of the verse: its round medallion (320 x 320, transparent) and its name for the screen reader. */
export interface WitnessPlace {
  id: string
  image: string
  name: string
}
/** A round: `order` = the places go into the rings (round 1), `stretch` = the light is pulled outwards ring by ring (round 2). */
export interface WitnessRound {
  hint: string
  mode: 'order' | 'stretch'
}
/**
 * The game "To the uttermost part of the earth" (`zeugen`): the painted map (square, without rings), the ring picture and the light picture (both square, transparent,
 * scaled to a radius), the middle of Jerusalem (percent), the outer radius of every ring (percent of the width, from the inside out), the band around the edge of a ring
 * where the light may be let go (percent), the places in the order of the verse (place `i` belongs into ring `i`), the width of a medallion (percent) and the rounds.
 */
export interface WitnessGame {
  map: string
  ring: string
  light: string
  centre: Pt
  rings: number[]
  band: number
  places: WitnessPlace[]
  placeW: number
  rounds: WitnessRound[]
}

/** The ring that a point lies in (0 is the middle of Jerusalem, a disc), or -1 outside the last ring. */
export function witnessRingAt(game: Pick<WitnessGame, 'centre' | 'rings'>, p: Pt): number {
  const d = pfDist(p, game.centre)
  return game.rings.findIndex((r) => d <= r)
}

/** Round 1: a place dropped into a ring. Only the next ring of the verse takes the next place. */
export function witnessDrop(next: number, place: number, ring: number): 'ok' | 'wrong' {
  return place === next && ring === next ? 'ok' : 'wrong'
}

/**
 * Round 2: the light is let go at radius `r` (percent of the width) while `lit` rings shine. The edge of ring `lit` is the goal:
 * within `band` of it is right, before it the light only shrinks back (no mistake), past it is too far (a mistake).
 */
export function witnessRelease(game: Pick<WitnessGame, 'rings' | 'band'>, lit: number, r: number): 'ok' | 'short' | 'far' {
  const edge = game.rings[Math.min(lit, game.rings.length - 1)]!
  if (r < edge - game.band) return 'short'
  if (r > edge + game.band) return 'far'
  return 'ok'
}

/** Where a medallion sits in its ring: the first in the middle, the others in the middle of their ring band, each at its own angle. */
export function witnessSpot(game: Pick<WitnessGame, 'centre' | 'rings'>, i: number): Pt {
  if (i <= 0) return { ...game.centre }
  const inner = game.rings[i - 1] ?? 0
  const outer = game.rings[i] ?? inner
  const mid = (inner + outer) / 2
  const angle = ((-60 + (i - 1) * 125) * Math.PI) / 180
  return { x: game.centre.x + Math.cos(angle) * mid, y: game.centre.y + Math.sin(angle) * mid }
}

/** The problems of the data of `zeugen` (an empty list is good). */
export function witnessProblems(game: WitnessGame): string[] {
  const out: string[] = []
  if (!game.map) out.push('no picture of the map')
  if (!game.ring) out.push('no picture of the ring')
  if (!game.light) out.push('no picture of the light')
  const n = game.rings.length
  if (n < 2) out.push('fewer than two rings')
  if (game.places.length !== n) out.push(`${n} rings but ${game.places.length} places`)
  game.rings.forEach((r, i) => {
    if (r <= 0) out.push(`ring ${i + 1} has no size`)
    if (i > 0 && r <= game.rings[i - 1]!) out.push(`ring ${i + 1} is not bigger than ring ${i}`)
    if (i > 0 && r - game.rings[i - 1]! < game.band * 2 + 2) out.push(`ring ${i + 1} is too near ring ${i} for the band`)
  })
  const last = game.rings[n - 1] ?? 0
  const c = game.centre
  if (c.x - last < 0 || c.x + last > 100 || c.y - last < 0 || c.y + last > 100) out.push('the last ring does not fit into the picture')
  if (game.band < 1.5) out.push('the band is too narrow to let go on a phone')
  if (game.placeW < 11) out.push('the medallions are too small for a phone (at least 11 percent)')
  game.places.forEach((p, i) => {
    if (!p.image) out.push(`place ${i + 1} has no picture`)
    if (!p.name) out.push(`place ${i + 1} has no name`)
  })
  if (new Set(game.places.map((p) => p.id)).size !== game.places.length) out.push('two places have the same id')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  else if (game.rounds[0]!.mode !== 'order' || game.rounds[1]!.mode !== 'stretch') out.push('round 1 orders the places, round 2 stretches the light')
  return out
}

// ================================================================ 2. everyone hears it (`sprachen`)

/** A land on the map: the middle and radius of its circle (percent of the width; `y` percent of the height), its home medallion and its name. */
export interface TonguesLand {
  id: string
  x: number
  y: number
  r: number
  home: string
  name: string
}
/** A guest: the land he comes from, his picture (220 x 330, transparent) and a word for the screen reader. */
export interface TonguesGuest {
  id: string
  land: string
  image: string
  name: string
}
/** A round: the guests (ids, in the order of the strip) and whether the home picture floats over them. */
export interface TonguesRound {
  hint: string
  guests: string[]
  showHome: boolean
}
/** The game "Everyone hears it" (`sprachen`): the map (3:2 without writing), its ratio, the lands, the guests, the little ear, the width of a guest on the map and the rounds. */
export interface TonguesGame {
  map: string
  ratio?: number
  lands: TonguesLand[]
  guests: TonguesGuest[]
  ear: string
  guestW: number
  rounds: TonguesRound[]
}

/** The land whose circle a point lies in (the nearest middle when circles touch), or -1. */
export function tonguesLandAt(lands: readonly TonguesLand[], p: Pt, ratio = 1.5): number {
  let best = -1
  let bestD = Infinity
  lands.forEach((l, i) => {
    const d = pfDist(p, l, ratio)
    if (d <= l.r && d < bestD) {
      best = i
      bestD = d
    }
  })
  return best
}

/** A guest dropped on a land: right when it is his land. */
export const tonguesFits = (guest: TonguesGuest, land: TonguesLand): boolean => guest.land === land.id

/** The problems of the data of `sprachen` (an empty list is good). */
export function tonguesProblems(game: TonguesGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.map) out.push('no picture of the map')
  if (!game.ear) out.push('no picture of the ear')
  if (game.guestW < 6 || game.guestW > 20) out.push('a guest on the map should be between 6 and 20 percent wide')
  game.lands.forEach((l, i) => {
    if (l.r < 6) out.push(`land ${l.id}: the circle is too small to drop on a phone (at least 6 percent)`)
    if (l.x - l.r < 0 || l.x + l.r > 100 || l.y < 0 || l.y > 100) out.push(`land ${l.id} lies outside the picture`)
    if (!l.home) out.push(`land ${l.id} has no home picture`)
    game.lands.forEach((o, k) => {
      if (k > i && pfDist(l, o, ratio) < l.r + o.r) out.push(`the lands ${l.id} and ${o.id} overlap`)
    })
  })
  for (const g of game.guests) {
    if (!game.lands.some((l) => l.id === g.land)) out.push(`guest ${g.id}: the land "${g.land}" is not on the map`)
    if (!g.image) out.push(`guest ${g.id} has no picture`)
  }
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (r.guests.length < 2) out.push(`round ${n}: fewer than two guests`)
    if (new Set(r.guests).size !== r.guests.length) out.push(`round ${n}: a guest comes twice`)
    const lands = r.guests.map((id) => game.guests.find((g) => g.id === id)?.land)
    if (new Set(lands).size !== lands.length) out.push(`round ${n}: two guests come from the same land`)
    for (const id of r.guests) if (!game.guests.some((g) => g.id === id)) out.push(`round ${n}: the guest "${id}" has no picture`)
  })
  if (game.rounds.length === 2) {
    if (game.rounds[1]!.guests.length <= game.rounds[0]!.guests.length) out.push('round 2 should have more guests than round 1')
    if (!game.rounds[0]!.showHome) out.push('round 1 shows the home pictures')
    if (game.rounds[1]!.showHome) out.push('round 2 is played without the home pictures')
  }
  return out
}

// ================================================================ 3. fill the baskets (`koerbe`)

/** A gift: how much it counts (the number of loaves), its picture (transparent) and its name. */
export interface FillGift {
  size: number
  image: string
  name: string
}
/** A family: the picture waiting and the glad picture (300 x 360, transparent) and its name. */
export interface FillFamily {
  image: string
  happy: string
  name: string
}
/** A round: which family (index into `families`) needs how much, and the gifts on the mat (their sizes). The gifts add up to the needs. */
export interface FillRound {
  hint: string
  families: { family: number; need: number }[]
  gifts: number[]
}
/** The game "Fill the baskets" (`koerbe`): the yard (3:2), the gifts by size, the families, the empty basket, the little loaf marks (full and empty) and the rounds. */
export interface FillGame {
  yard: string
  gifts: FillGift[]
  families: FillFamily[]
  basket: string
  markFull: string
  markEmpty: string
  rounds: FillRound[]
}

/** A gift of `size` goes into a basket that has `have` of `need`: only when it does not bring more than the family needs. */
export const fillFits = (need: number, have: number, size: number): boolean => size > 0 && have + size <= need

/** Can the gifts be shared out so that every rest (`needs` minus what is in the baskets) is met exactly? (A search over all ways, small numbers only.) */
export function fillSolvable(rest: readonly number[], gifts: readonly number[]): boolean {
  if (rest.some((r) => r < 0)) return false
  const total = gifts.reduce((s, g) => s + g, 0)
  if (total !== rest.reduce((s, r) => s + r, 0)) return false
  const sorted = [...gifts].sort((a, b) => b - a)
  const left = [...rest]
  const go = (i: number): boolean => {
    if (i >= sorted.length) return left.every((r) => r === 0)
    const g = sorted[i]!
    const tried = new Set<number>()
    for (let k = 0; k < left.length; k++) {
      if (left[k]! < g || tried.has(left[k]!)) continue
      tried.add(left[k]!)
      left[k] = left[k]! - g
      if (go(i + 1)) return true
      left[k] = left[k]! + g
    }
    return false
  }
  return go(0)
}

/**
 * The move for the button "Help me": a gift on the mat (index into `free`) and a family (index) such that the rest can still be shared exactly; null when there is none
 * (then a gift must be taken back).
 */
export function fillHelp(needs: readonly number[], have: readonly number[], free: readonly number[]): { gift: number; family: number } | null {
  const rest = needs.map((n, i) => n - (have[i] ?? 0))
  if (!fillSolvable(rest, free)) return null
  for (let g = 0; g < free.length; g++) {
    for (let f = 0; f < rest.length; f++) {
      if (!fillFits(needs[f]!, have[f] ?? 0, free[g]!)) continue
      const r2 = rest.slice()
      r2[f] = r2[f]! - free[g]!
      if (fillSolvable(r2, free.filter((_, k) => k !== g))) return { gift: g, family: f }
    }
  }
  return null
}

/** The problems of the data of `koerbe` (an empty list is good). */
export function fillProblems(game: FillGame): string[] {
  const out: string[] = []
  if (!game.yard) out.push('no picture of the yard')
  if (!game.basket) out.push('no picture of the empty basket')
  if (!game.markFull || !game.markEmpty) out.push('no pictures of the loaf marks')
  if (new Set(game.gifts.map((g) => g.size)).size !== game.gifts.length) out.push('two gift pictures have the same size')
  game.families.forEach((f, i) => {
    if (!f.image || !f.happy) out.push(`family ${i + 1} has no pictures`)
  })
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const needs = r.families.map((f) => f.need)
    for (const s of r.gifts) if (!game.gifts.some((g) => g.size === s)) out.push(`round ${n}: no picture for a gift of ${s}`)
    for (const f of r.families) {
      if (!game.families[f.family]) out.push(`round ${n}: the family ${f.family + 1} has no picture`)
      if (f.need < 1 || f.need > 6) out.push(`round ${n}: a need of ${f.need} does not fit the row of loaves (1 to 6)`)
    }
    if (new Set(r.families.map((f) => f.family)).size !== r.families.length) out.push(`round ${n}: a family comes twice`)
    const sumG = r.gifts.reduce((s, g) => s + g, 0)
    const sumN = needs.reduce((s, x) => s + x, 0)
    if (sumG !== sumN) out.push(`round ${n}: the gifts (${sumG}) do not add up to the needs (${sumN})`)
    else if (!fillSolvable(needs, r.gifts)) out.push(`round ${n}: the gifts cannot be shared out exactly`)
    if (r.families.length > 4) out.push(`round ${n}: more than four families do not fit on a phone`)
  })
  if (game.rounds.length === 2 && game.rounds[1]!.families.length <= game.rounds[0]!.families.length) out.push('round 2 should have more families than round 1')
  return out
}
