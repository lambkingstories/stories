/**
 * The pure parts of two more new games of "Paulus" (no. 31, id `paulus`; the components only show and listen):
 * "Dye the purple" (`purpur`, field `dye`, Acts 16,14: Lydia sells purple; a white cloth is dipped into two vats of purple until it matches the sample) and
 * "The workshop" (`werkstatt`, field `tentShop`, Acts 18,3: Paul, Aquila and Priscilla make tents; every piece goes to the three work tables in the right order).
 * All places are percent of the field, times milliseconds; the arithmetic has no clock of its own and no dice.
 */

// ================================================================ 1. dye the purple (`purpur`)

/** A colour of a cloth: how often it was dipped into the red-violet vat and into the blue-violet vat (0 to `maxDips` each). */
export interface DyeColour {
  red: number
  blue: number
}
/** An order: the colour of the sample and which customer brings it (index into `customers`). */
export interface DyeOrder extends DyeColour {
  customer: number
}
export interface DyeRound {
  hint: string
  orders: DyeOrder[]
}
/** A customer of Philippi holding up the sample: the picture, the glad picture and a name for the screen reader. */
export interface DyeCustomer {
  image: string
  happy: string
  name: string
}
/** Where a thing lies on the picture of the yard: the middle of its lower edge (`x`, `y`) and its width `w` (percent of the field). */
export interface DyeSpot {
  x: number
  y: number
  w: number
}
/**
 * The game "Dye the purple" (`purpur`): Lydia's yard by the river (3:2, without people), the hanging cloth in all its colours (`cloths[red][blue]`, cut from one painted sheet),
 * the same as small samples (`samples[red][blue]`), the two signs that mark the vats (a round clay bowl for the round vat, a square wooden tablet for the square one) (not only the colour tells them apart), the customers, the wooden peg of the button "done",
 * where the two vats, the customer and the cloth are on the picture, and how often a cloth may go into one vat.
 */
export interface DyeGame {
  yard: string
  cloths: string[][]
  samples: string[][]
  signs: { red: string; blue: string }
  customers: DyeCustomer[]
  peg: string
  vats: { red: DyeSpot; blue: DyeSpot }
  customer: DyeSpot
  cloth: DyeSpot
  maxDips: number
  rounds: DyeRound[]
}

/** A dip into a vat: the new colour, or `full` when the cloth cannot get any stronger in this vat (no mistake). */
export function dyeDip(c: DyeColour, vat: 'red' | 'blue', max: number): { colour: DyeColour; full: boolean } {
  if (c[vat] >= max) return { colour: { ...c }, full: true }
  return { colour: { ...c, [vat]: c[vat] + 1 }, full: false }
}

/** Whether a cloth matches the sample. */
export const dyeMatches = (c: DyeColour, order: DyeColour): boolean => c.red === order.red && c.blue === order.blue

/** What is still missing (for the word after a wrong cloth): too much or too little of each. */
export function dyeCompare(c: DyeColour, order: DyeColour): { red: number; blue: number } {
  return { red: order.red - c.red, blue: order.blue - c.blue }
}

/** The problems of the data of `purpur` (an empty list is good). */
export function dyeProblems(game: DyeGame): string[] {
  const out: string[] = []
  const m = game.maxDips
  if (!game.yard) out.push('no picture of the yard')
  if (m < 1 || m > 3) out.push('a cloth goes into a vat one to three times')
  const grid = (g: string[][]) => g.length === m + 1 && g.every((row) => row.length === m + 1 && row.every((p) => !!p))
  if (!grid(game.cloths)) out.push(`the cloths must be ${m + 1} x ${m + 1} pictures`)
  if (!grid(game.samples)) out.push(`the samples must be ${m + 1} x ${m + 1} pictures`)
  if (!game.signs.red || !game.signs.blue) out.push('no pictures of the signs (the vats are not told apart by colour only)')
  if (!game.peg) out.push('no picture of the button "done"')
  if (!game.customers.length) out.push('no customers')
  for (const c of game.customers) if (!c.image || !c.happy) out.push('a customer has no pictures')
  const spots = [game.vats.red, game.vats.blue, game.customer, game.cloth]
  for (const s of spots) if (s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100 || s.w < 8) out.push('a place on the picture lies outside or is too small')
  if (Math.abs(game.vats.red.x - game.vats.blue.x) < (game.vats.red.w + game.vats.blue.w) / 2) out.push('the two vats overlap')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.orders.length) out.push(`round ${n}: no orders`)
    const seen = new Set<string>()
    for (const o of r.orders) {
      if (o.red < 0 || o.red > m || o.blue < 0 || o.blue > m) out.push(`round ${n}: an order cannot be dyed`)
      if (o.red === 0 && o.blue === 0) out.push(`round ${n}: a white sample is no order`)
      if (!game.customers[o.customer]) out.push(`round ${n}: the customer ${o.customer + 1} has no picture`)
      const key = `${o.red}-${o.blue}`
      if (seen.has(key)) out.push(`round ${n}: the same colour twice`)
      seen.add(key)
    }
    r.orders.forEach((o, k) => {
      if (k > 0 && r.orders[k - 1]!.customer === o.customer) out.push(`round ${n}: the same customer twice in a row`)
    })
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [DyeRound, DyeRound]
    if (a.orders.some((o) => o.red > 0 && o.blue > 0)) out.push('round 1 uses only one vat for each cloth')
    if (!b.orders.every((o) => o.red > 0 && o.blue > 0)) out.push('round 2 mixes both vats in every cloth')
    if (b.orders.length <= a.orders.length) out.push('round 2 should have more orders than round 1')
  }
  return out
}

// ================================================================ 2. the workshop (`werkstatt`)

/** The state of a piece: 0 rolled cloth, 1 cut into two lengths, 2 sewn into one wide length, 3 a finished tent roof with loops and ropes. */
export type TentStage = 0 | 1 | 2 | 3
/** Where a piece is taken: a work table (0 cut, 1 sew, 2 ropes) or the place for finished tents. */
export type TentTarget = 0 | 1 | 2 | 'shelf'
/** A work table: what is done there (a painted sign, no text), who works there (two pictures for the work and a glad one), a name for the screen reader, and where it stands (middle, percent of the width). */
export interface TentTable {
  id: 'cut' | 'sew' | 'rope'
  image: string
  worker: { a: string; b: string; happy: string }
  name: string
  x: number
}
/** A round: the hint, how many pieces, and whether a new piece comes as soon as the cutting table is free (then up to three are on their way at once). */
export interface TentRound {
  hint: string
  pieces: number
  overlap: boolean
}
/**
 * The game "The workshop" (`werkstatt`): the workshop in Corinth (3:2, without people), the picture at the end (sabbath: the workshop is quiet, the three go to the synagogue),
 * the four states of a piece, the bale of cloth (left) and the place of finished tents (right), the three tables, how long a table works (ms),
 * where the tables stand (their feet, percent of the height) and how wide tables, workers and pieces are (percent of the width), and the rounds.
 */
export interface TentShopGame {
  shop: string
  finale: string
  pieces: [string, string, string, string]
  bale: string
  tent: string
  tables: TentTable[]
  workMs: number
  tableY: number
  tableW: number
  workerW: number
  pieceW: number
  rounds: TentRound[]
}

/** Where a piece in this state must go next. */
export const tentTarget = (s: TentStage): TentTarget => (s === 3 ? 'shelf' : s)

/**
 * A piece in state `s` brought to `to` (`working`: that table is still busy, `taken`: a finished piece still lies on it): `ok` it is right; `busy` the table is still working (a mistake);
 * `taken` the table holds a piece that must be taken away first (no mistake); `wrong` it is not the next step (a mistake; `need` says which one is).
 */
export function tentMove(s: TentStage, to: TentTarget, working: boolean, taken: boolean): { verdict: 'ok' | 'busy' | 'taken' | 'wrong'; need: TentTarget } {
  const need = tentTarget(s)
  if (to !== 'shelf' && working) return { verdict: 'busy', need }
  if (to !== need) return { verdict: 'wrong', need }
  if (to !== 'shelf' && taken) return { verdict: 'taken', need }
  return { verdict: 'ok', need }
}

/** The state of a piece after the table `table` has worked on it. */
export const tentAfter = (table: 0 | 1 | 2): TentStage => (table + 1) as TentStage

/** How many right moves a round has (three tables and the place for finished tents for every piece). */
export const tentMoves = (r: Pick<TentRound, 'pieces'>): number => r.pieces * 4

/** The problems of the data of `werkstatt` (an empty list is good). */
export function tentShopProblems(game: TentShopGame): string[] {
  const out: string[] = []
  if (!game.shop) out.push('no picture of the workshop')
  if (!game.finale) out.push('no picture of the end')
  if (game.pieces.length !== 4 || game.pieces.some((p) => !p)) out.push('four pictures of the piece are needed (rolled, cut, sewn, finished)')
  if (!game.bale || !game.tent) out.push('no pictures of the bale and the finished tents')
  if (game.tables.length !== 3) out.push('there must be three tables')
  const ids = game.tables.map((t) => t.id).join(',')
  if (ids !== 'cut,sew,rope') out.push('the tables are, from left to right: cut, sew, ropes')
  for (const t of game.tables) {
    if (!t.image) out.push(`the table "${t.id}" has no picture`)
    if (!t.worker.a || !t.worker.b || !t.worker.happy) out.push(`the worker at the table "${t.id}" has no pictures`)
  }
  game.tables.forEach((t, k) => {
    if (k > 0 && t.x - game.tables[k - 1]!.x < game.tableW) out.push(`the tables ${k} and ${k + 1} overlap`)
  })
  const first = game.tables[0]
  const last = game.tables[game.tables.length - 1]
  if (first && first.x - game.tableW / 2 < game.pieceW + 2) out.push('there is no room for the bale left of the tables')
  if (last && last.x + game.tableW / 2 > 100 - game.pieceW - 2) out.push('there is no room for the finished tents right of the tables')
  if (game.tableY < 55 || game.tableY > 98) out.push('the tables should stand between 55 and 98 percent')
  if (game.workMs < 800 || game.workMs > 4000) out.push('a table should work between 0.8 and 4 seconds')
  if (game.pieceW < 9) out.push('a piece is too small for a phone (at least 9 percent)')
  if (game.tableW < 14) out.push('a table is too small for a phone (at least 14 percent)')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    if (r.pieces < 1 || r.pieces > 6) out.push(`round ${i + 1}: one to six pieces`)
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [TentRound, TentRound]
    if (a.overlap) out.push('in round 1 one piece comes after the other')
    if (!b.overlap) out.push('in round 2 several pieces are on their way at once')
    if (b.pieces <= a.pieces) out.push('round 2 should have more pieces than round 1')
  }
  return out
}
