/**
 * The pure parts of the three new games of "Jesus ruft seine Freunde" (the components only show and listen):
 * 1. "The sounding lead" (`lot`, Luke 5,4-5): Simon's boat floats on the lake seen from the side; the child lets the lead down, reads how deep it is and casts the net only at the deep place.
 * 2. "The seats" (`sitzplaetze`, Mark 2,15; Luke 5,29): a sliding puzzle in Levi's house seen from above: the benches are pushed until a bench lies on every mat at the long table.
 * 3. "The Twelve" (`zwoelf`, Mark 3,13-19): a name lights up and the child taps the disciple with the matching sign (the net of the fisherman, the coin box of the tax collector, ...).
 * The arithmetic has no clock and no dice.
 */

/** A direction: 0 up, 1 right, 2 down, 3 left. */
export type Dir = 0 | 1 | 2 | 3
const STEP: Record<Dir, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] }

// ================================================================ 1. the sounding lead (`lot`)

/** One point of the bottom of the lake: `x` in percent of the width of the picture, `d` the depth in fathoms ("Klafter", Acts 27,28). */
export interface PlumbPoint {
  x: number
  d: number
}
/**
 * Simon's boat (a picture seen from the side, transparent): its width in percent of the field, its width divided by its height (`ratio`),
 * the place where the line leaves Simon's hands (`hand`, percent of the picture) and the height of the water line in the picture (`keel`, percent from the top).
 */
export interface PlumbBoat {
  image: string
  label: string
  w: number
  ratio: number
  hand: { x: number; y: number }
  keel: number
}
/** The lead (a picture, transparent): width in percent of the field and width divided by height. */
export interface PlumbLead {
  image: string
  w: number
  ratio: number
}
/**
 * One round: the hint, the painted lake (`background`, the bottom is not to be seen), its width divided by its height, the water surface (`surface`, percent of the height, measured in the picture),
 * how the depth is shown (`scale` fathoms lie at the height `floor`), the bottom of the lake (`bottom`, points from left to right), where the boat may go (`range`, its middle in percent),
 * where it starts and from how many fathoms on the water counts as "the deep" (`deep`).
 */
export interface PlumbRound {
  hint: string
  background: string
  ratio: number
  surface: number
  floor: number
  scale: number
  bottom: PlumbPoint[]
  range: [number, number]
  start: number
  deep: number
}
/** The game "The sounding lead" (`lot`): the boat, the lead, the picture of the line (a rope, stretched) and the rounds. */
export interface PlumbGame {
  boat: PlumbBoat
  lead: PlumbLead
  line: string
  rounds: PlumbRound[]
}

/** How far the boat goes with one arrow key (percent of the width). */
export const PLUMB_STEP = 3
/** The narrowest deep place the data may have (percent of the width): wider than one arrow step, so the keys can always reach it. */
export const PLUMB_MIN_ZONE = 4

/** The depth of the bottom below a place (fathoms, straight lines between the points; outside the points the first or last depth). */
export function plumbDepth(bottom: readonly PlumbPoint[], x: number): number {
  if (!bottom.length) return 0
  if (x <= bottom[0]!.x) return bottom[0]!.d
  for (let i = 1; i < bottom.length; i++) {
    const a = bottom[i - 1]!
    const b = bottom[i]!
    if (x <= b.x) return b.x === a.x ? b.d : a.d + ((b.d - a.d) * (x - a.x)) / (b.x - a.x)
  }
  return bottom[bottom.length - 1]!.d
}

/** The depth in whole fathoms as the child reads it. */
export const plumbFathoms = (bottom: readonly PlumbPoint[], x: number): number => Math.round(plumbDepth(bottom, x))

/** The place where the line leaves Simon's hands (percent of the width of the field) for a place of the boat. */
export const plumbHandX = (boat: PlumbBoat, boatX: number): number => boatX + ((boat.hand.x - 50) / 100) * boat.w

/** The place of the boat for a place of the line (the other way round). */
export const plumbBoatX = (boat: PlumbBoat, handX: number): number => handX - ((boat.hand.x - 50) / 100) * boat.w

/** The place of the boat kept inside its range. */
export const plumbClamp = (round: PlumbRound, x: number): number => Math.min(round.range[1], Math.max(round.range[0], x))

/** The water is deep enough for the net under the hand of Simon. */
export const plumbIsDeep = (game: PlumbGame, round: PlumbRound, boatX: number): boolean => plumbFathoms(round.bottom, plumbHandX(game.boat, boatX)) >= round.deep

/** The height of the boat in percent of the height of the field. */
export const plumbBoatH = (boat: PlumbBoat, round: PlumbRound): number => (boat.w / boat.ratio) * round.ratio
/** The top edge of the boat (percent of the height): the water line of the picture lies on the surface. */
export const plumbBoatTop = (boat: PlumbBoat, round: PlumbRound): number => round.surface - (boat.keel / 100) * plumbBoatH(boat, round)
/** The height of Simon's hands (percent of the height of the field). */
export const plumbHandY = (boat: PlumbBoat, round: PlumbRound): number => plumbBoatTop(boat, round) + (boat.hand.y / 100) * plumbBoatH(boat, round)
/** The height of the lead on the bottom (its lower edge, percent of the height) for a depth. */
export const plumbLeadY = (round: PlumbRound, d: number): number => round.surface + ((round.floor - round.surface) * d) / round.scale

/** The stretches of the range where the boat stands over the deep (its middle from - to, percent), found in steps of a tenth of a percent. */
export function plumbDeepZones(game: PlumbGame, round: PlumbRound): [number, number][] {
  const out: [number, number][] = []
  let from: number | null = null
  const [a, b] = round.range
  for (let i = 0; a + i / 10 <= b + 1e-9; i++) {
    const x = Math.round((a + i / 10) * 10) / 10
    const deep = plumbIsDeep(game, round, x)
    if (deep && from === null) from = x
    if (!deep && from !== null) {
      out.push([from, Math.round((x - 0.1) * 10) / 10])
      from = null
    }
  }
  if (from !== null) out.push([from, b])
  return out
}

/** Where the button "Help me" sends the boat: the middle of the nearest deep stretch (null when there is none). */
export function plumbTarget(game: PlumbGame, round: PlumbRound, boatX: number): number | null {
  let best: number | null = null
  for (const [a, b] of plumbDeepZones(game, round)) {
    const m = (a + b) / 2
    if (best === null || Math.abs(m - boatX) < Math.abs(best - boatX)) best = m
  }
  return best
}

/** The places the boat reaches from the start with the arrow keys. */
export function plumbKeyStops(round: PlumbRound): number[] {
  const out = new Set<number>()
  for (let x = round.start; x >= round.range[0] - 1e-9; x -= PLUMB_STEP) out.add(Math.round(x * 100) / 100)
  for (let x = round.start; x <= round.range[1] + 1e-9; x += PLUMB_STEP) out.add(Math.round(x * 100) / 100)
  out.add(round.range[0])
  out.add(round.range[1])
  return [...out].sort((a, b) => a - b)
}

/** The problems of the data of `lot` (an empty list is good). */
export function plumbProblems(game: PlumbGame): string[] {
  const out: string[] = []
  const b = game.boat
  if (!b.image) out.push('no picture of the boat')
  if (!game.lead.image) out.push('no picture of the lead')
  if (!game.line) out.push('no picture of the line')
  if (b.w < 20 || b.w > 60) out.push('the boat must be 20 to 60 percent wide')
  if (b.ratio <= 0 || game.lead.ratio <= 0) out.push('a ratio of a picture is not positive')
  if (b.hand.x < 0 || b.hand.x > 100 || b.hand.y < 0 || b.hand.y > 100 || b.keel <= 0 || b.keel > 100) out.push('the hand or the water line lies outside the picture of the boat')
  if (game.lead.w < 3) out.push('the lead is too small to see')
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.background) out.push(`round ${n}: no picture of the lake`)
    if (r.ratio <= 0) out.push(`round ${n}: the ratio is not positive`)
    if (!(r.surface > 5 && r.surface < 60)) out.push(`round ${n}: the surface must lie between 5 and 60 percent`)
    if (!(r.floor > r.surface + 20 && r.floor <= 98)) out.push(`round ${n}: the floor line must lie well below the surface and inside the picture`)
    if (r.scale <= 0) out.push(`round ${n}: the scale is not positive`)
    if (r.bottom.length < 3) out.push(`round ${n}: fewer than three points of the bottom`)
    r.bottom.forEach((p, k) => {
      if (k > 0 && p.x <= r.bottom[k - 1]!.x) out.push(`round ${n}: the points of the bottom are not from left to right`)
      if (p.d <= 0) out.push(`round ${n}: the depth at ${p.x} is not positive`)
      if (p.d > r.scale) out.push(`round ${n}: the depth at ${p.x} lies below the picture`)
    })
    const [lo, hi] = r.range
    if (lo >= hi) out.push(`round ${n}: the range is empty`)
    if (lo - b.w / 2 < -2 || hi + b.w / 2 > 102) out.push(`round ${n}: the boat leaves the picture`)
    if (r.bottom.length && (r.bottom[0]!.x > plumbHandX(b, lo) || r.bottom[r.bottom.length - 1]!.x < plumbHandX(b, hi))) out.push(`round ${n}: the bottom does not reach under every place of the line`)
    if (r.start < lo || r.start > hi) out.push(`round ${n}: the boat starts outside its range`)
    if (plumbIsDeep(game, r, r.start)) out.push(`round ${n}: the boat starts over the deep`)
    if (plumbBoatTop(b, r) < 0) out.push(`round ${n}: the boat sticks out at the top`)
    const zones = plumbDeepZones(game, r)
    if (!zones.length) out.push(`round ${n}: there is no deep place`)
    for (const [a, z] of zones) if (z - a < PLUMB_MIN_ZONE) out.push(`round ${n}: the deep place ${a}-${z} is narrower than ${PLUMB_MIN_ZONE} percent`)
    if (zones.length && !plumbKeyStops(r).some((x) => plumbIsDeep(game, r, x))) out.push(`round ${n}: the arrow keys never reach the deep place`)
    const lead = plumbLeadY(r, Math.max(...r.bottom.map((p) => p.d)))
    if (lead > 100) out.push(`round ${n}: the lead sinks below the picture`)
  })
  return out
}

// ================================================================ 2. the seats (`sitzplaetze`)

/** A bench: its first cell (row, column, from the top left), its length (2 or 3 seats) and how it lies (`h` across, `v` up and down). It slides in all four directions. */
export interface SeatsBench {
  id: string
  r: number
  c: number
  len: 2 | 3
  dir: 'h' | 'v'
}
/** A mat at the table (two cells side by side, the first one given): a place for the guests. A bench lying across it (`h`) covers it. */
export interface SeatsMat {
  r: number
  c: number
}
/**
 * One round: the hint, the room (one string per row, every sign one cell: `.` floor, `T` the long table (one straight row of 4 across), `K` a water jar, `O` a basket),
 * the mats, the benches at the start and the fewest moves (`par`; a move pushes one bench in one direction, as far as it goes).
 */
export interface SeatsRound {
  hint: string
  rows: string[]
  mats: SeatsMat[]
  benches: SeatsBench[]
  par: number
}
/** The game "The seats" (`sitzplaetze`): the pictures (all seen from directly above) and the rounds. `guests` is the picture of Levi with his guests, shown above the room. */
export interface SeatsGame {
  floor: string
  table: string
  bench2: string
  bench3: string
  jar: string
  basket: string
  mat: string
  /** The width of the mat picture divided by its height (2 without it): the mat is drawn two cells wide and as high as this makes it, in the middle of its row. */
  matRatio?: number
  guests?: string
  guestsLabel?: string
  rounds: SeatsRound[]
}
export interface SeatsPos {
  r: number
  c: number
}
/** One move: bench `i` goes `k` cells in the direction `dir`. */
export interface SeatsMove {
  i: number
  dir: Dir
  k: number
}

const SEATS_SIGNS = new Set(['.', 'T', 'K', 'O'])
/** The most states the search looks at (for the hint and the test of the data). */
export const SEATS_MAX_STATES = 400000

export function seatsSize(rows: readonly string[]): { rows: number; cols: number } {
  return { rows: rows.length, cols: rows.reduce((n, r) => Math.max(n, r.length), 0) }
}

/** The cells of a bench at a place. */
export function seatsCells(b: Pick<SeatsBench, 'len' | 'dir'>, p: SeatsPos): SeatsPos[] {
  return Array.from({ length: b.len }, (_, k) => ({ r: p.r + (b.dir === 'v' ? k : 0), c: p.c + (b.dir === 'h' ? k : 0) }))
}

/** A cell where nothing can stand: outside the room, the table, a jar or a basket. */
export function seatsBlocked(rows: readonly string[], p: SeatsPos): boolean {
  const row = rows[p.r]
  if (row === undefined || p.c < 0 || p.c >= row.length) return true
  return row[p.c] !== '.'
}

/** Which bench stands on every cell (-1 = none), for the places `pos`. */
function occupancy(rows: readonly string[], benches: readonly SeatsBench[], pos: readonly SeatsPos[]): number[][] {
  const { rows: h, cols: w } = seatsSize(rows)
  const occ = Array.from({ length: h }, () => Array<number>(w).fill(-1))
  benches.forEach((b, i) => {
    for (const x of seatsCells(b, pos[i]!)) if (occ[x.r]?.[x.c] !== undefined) occ[x.r]![x.c] = i
  })
  return occ
}

/** How far bench `i` can be pushed in a direction (0 when it cannot move). */
export function seatsReach(rows: readonly string[], benches: readonly SeatsBench[], pos: readonly SeatsPos[], i: number, dir: Dir): number {
  const b = benches[i]
  const p = pos[i]
  if (!b || !p) return 0
  const occ = occupancy(rows, benches, pos)
  const [dr, dc] = STEP[dir]
  let k = 0
  for (;;) {
    const q = { r: p.r + dr * (k + 1), c: p.c + dc * (k + 1) }
    const ok = seatsCells(b, q).every((x) => !seatsBlocked(rows, x) && (occ[x.r]![x.c] === -1 || occ[x.r]![x.c] === i))
    if (!ok) return k
    k++
  }
}

/** The places after pushing bench `i` by `k` cells (unchanged when it cannot go that far). */
export function seatsPush(rows: readonly string[], benches: readonly SeatsBench[], pos: readonly SeatsPos[], i: number, dir: Dir, k = 1): SeatsPos[] {
  if (k < 1 || seatsReach(rows, benches, pos, i, dir) < k) return pos.slice()
  const [dr, dc] = STEP[dir]
  return pos.map((p, j) => (j === i ? { r: p.r + dr * k, c: p.c + dc * k } : p))
}

/** The mats on which a bench lies across (both cells under ONE bench lying `h`). */
export function seatsCovered(mats: readonly SeatsMat[], benches: readonly SeatsBench[], pos: readonly SeatsPos[]): boolean[] {
  return mats.map((m) =>
    benches.some((b, i) => {
      if (b.dir !== 'h') return false
      const cs = seatsCells(b, pos[i]!)
      return cs.some((x) => x.r === m.r && x.c === m.c) && cs.some((x) => x.r === m.r && x.c === m.c + 1)
    })
  )
}

/** Every mat has its bench. */
export const seatsSolved = (mats: readonly SeatsMat[], benches: readonly SeatsBench[], pos: readonly SeatsPos[]): boolean => seatsCovered(mats, benches, pos).every(Boolean)

const keyOf = (pos: readonly SeatsPos[]): string => pos.map((p) => `${p.r},${p.c}`).join(';')

/** The fewest moves from the places `pos` until every mat has its bench, and the moves (a breadth-first search); null when it cannot be done (or the search is too big). */
export function seatsBest(rows: readonly string[], mats: readonly SeatsMat[], benches: readonly SeatsBench[], pos: readonly SeatsPos[]): { moves: number; path: SeatsMove[] } | null {
  if (seatsSolved(mats, benches, pos)) return { moves: 0, path: [] }
  const start = pos.map((p) => ({ ...p }))
  const prev = new Map<string, { from: string; move: SeatsMove } | null>()
  const states = new Map<string, SeatsPos[]>()
  const k0 = keyOf(start)
  prev.set(k0, null)
  states.set(k0, start)
  const queue = [k0]
  for (let qi = 0; qi < queue.length; qi++) {
    const key = queue[qi]!
    const cur = states.get(key)!
    for (let i = 0; i < benches.length; i++) {
      for (const dir of [0, 1, 2, 3] as Dir[]) {
        const reach = seatsReach(rows, benches, cur, i, dir)
        for (let k = 1; k <= reach; k++) {
          const next = seatsPush(rows, benches, cur, i, dir, k)
          const nk = keyOf(next)
          if (prev.has(nk)) continue
          prev.set(nk, { from: key, move: { i, dir, k } })
          if (seatsSolved(mats, benches, next)) {
            const path: SeatsMove[] = []
            let at: string = nk
            for (let step = prev.get(at); step; step = prev.get(at)) {
              path.unshift(step.move)
              at = step.from
            }
            return { moves: path.length, path }
          }
          if (prev.size > SEATS_MAX_STATES) return null
          states.set(nk, next)
          queue.push(nk)
        }
      }
    }
    states.delete(key)
  }
  return null
}

/** The move the button "Help me" shows: the first move of a shortest solution (null when it is solved or there is none). */
export function seatsHint(rows: readonly string[], mats: readonly SeatsMat[], benches: readonly SeatsBench[], pos: readonly SeatsPos[]): SeatsMove | null {
  return seatsBest(rows, mats, benches, pos)?.path[0] ?? null
}

/** The mistakes of a round: every three moves over the fewest moves are one mistake (a sliding puzzle wants some trying). */
export const seatsMistakes = (moves: number, par: number): number => Math.floor(Math.max(0, moves - par) / 3)

/** The long table of a room: its first cell and its length (it lies across). Null when the `T` cells are not one straight row. */
export function seatsTable(rows: readonly string[]): { r: number; c: number; len: number } | null {
  const cells: SeatsPos[] = []
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === 'T') cells.push({ r, c })
  })
  if (!cells.length) return null
  const r = cells[0]!.r
  const c = cells[0]!.c
  if (cells.some((x, k) => x.r !== r || x.c !== c + k)) return null
  return { r, c, len: cells.length }
}

/** The problems of the data of `sitzplaetze` (an empty list is good). */
export function seatsProblems(game: SeatsGame): string[] {
  const out: string[] = []
  for (const k of ['floor', 'table', 'bench2', 'bench3', 'jar', 'basket', 'mat'] as const) if (!game[k]) out.push(`no picture "${k}"`)
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((round, ri) => {
    const n = ri + 1
    const { rows, mats, benches } = round
    const { rows: h, cols: w } = seatsSize(rows)
    if (h < 3 || w < 3) out.push(`round ${n}: the room is too small`)
    if (rows.some((r) => r.length !== w)) out.push(`round ${n}: the rows are not all equally long`)
    if (w > 7) out.push(`round ${n}: more than 7 columns are too small to touch on a phone`)
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) if (!SEATS_SIGNS.has(row[c]!)) out.push(`round ${n}: unknown sign "${row[c]}" in row ${r + 1}`)
    })
    const table = seatsTable(rows)
    if (!table) out.push(`round ${n}: the table is not one straight row across`)
    else if (table.len !== 4) out.push(`round ${n}: the table must be 4 cells long (its picture), it is ${table.len}`)
    if (!mats.length) out.push(`round ${n}: no mats`)
    const ids = new Set<string>()
    const occ = new Map<string, string>()
    benches.forEach((b) => {
      if (ids.has(b.id)) out.push(`round ${n}: the bench "${b.id}" is there twice`)
      ids.add(b.id)
      if (b.len !== 2 && b.len !== 3) out.push(`round ${n}: the bench "${b.id}" must have 2 or 3 seats`)
      for (const x of seatsCells(b, b)) {
        if (seatsBlocked(rows, x)) out.push(`round ${n}: the bench "${b.id}" stands on a wall, the table or a jar (row ${x.r + 1}, column ${x.c + 1})`)
        const k = `${x.r},${x.c}`
        if (occ.has(k)) out.push(`round ${n}: the benches "${occ.get(k)}" and "${b.id}" overlap`)
        occ.set(k, b.id)
      }
    })
    const matCells = new Set<string>()
    mats.forEach((m, k) => {
      for (const x of [m, { r: m.r, c: m.c + 1 }]) {
        if (seatsBlocked(rows, x)) out.push(`round ${n}: mat ${k + 1} lies on a wall, the table or a jar`)
        if (matCells.has(`${x.r},${x.c}`)) out.push(`round ${n}: two mats overlap`)
        matCells.add(`${x.r},${x.c}`)
      }
      const atTable = [m, { r: m.r, c: m.c + 1 }].some((x) => [0, 1, 2, 3].some((d) => rows[x.r + STEP[d as Dir][0]]?.[x.c + STEP[d as Dir][1]] === 'T'))
      if (!atTable) out.push(`round ${n}: mat ${k + 1} does not lie at the table`)
    })
    if (benches.filter((b) => b.dir === 'h').length < mats.length) out.push(`round ${n}: fewer benches lying across than mats`)
    const pos = benches.map((b) => ({ r: b.r, c: b.c }))
    if (out.some((x) => x.startsWith(`round ${n}:`))) return
    if (seatsSolved(mats, benches, pos)) out.push(`round ${n}: every mat has its bench at the start`)
    else {
      const best = seatsBest(rows, mats, benches, pos)
      if (!best) out.push(`round ${n}: the start cannot be solved`)
      else if (best.moves !== round.par) out.push(`round ${n}: the fewest moves are ${best.moves}, not ${round.par} (par)`)
    }
  })
  return out
}

// ================================================================ 3. the Twelve (`zwoelf`)

/**
 * A disciple: the picture (standing, seen from the front, transparent; all in the same scale), the name (Mark 3,16-19) and his sign in words,
 * taken from the Bible where it has one (the fishermen, the tax collector), otherwise only something to tell him by (a head cloth, a gray beard), never a statement about him.
 */
export interface TwelveDisciple {
  id: string
  image: string
  name: string
  sign: string
}
/** A place on the mountain: the middle of the feet (`x`, `y`, percent of the picture) and the width of the figure (percent of the width). */
export interface TwelveSpot {
  x: number
  y: number
  w: number
}
/** One round: the hint, the places, who stands on each place (`stand[k]` = id of the disciple on `spots[k]`), and the names that light up one after the other (`call`). */
export interface TwelveRound {
  hint: string
  spots: TwelveSpot[]
  stand: string[]
  call: string[]
}
/**
 * The game "The Twelve" (`zwoelf`): the mountainside (`background`, width / height `ratio`), the width / height of a disciple picture (`figure`), Jesus sitting above them (a picture, optional),
 * the twelve and the rounds.
 */
export interface TwelveGame {
  background: string
  ratio: number
  figure: number
  jesus?: { image: string; label: string; x: number; y: number; w: number }
  disciples: TwelveDisciple[]
  rounds: TwelveRound[]
}

/** The smallest width of a figure on a phone (percent of a field of about 360 pixels: 40 pixels). */
export const TWELVE_MIN_W = 11

/** The box of a figure (left, top, width, height in percent of the field). */
export function twelveBox(game: TwelveGame, s: TwelveSpot): { x: number; y: number; w: number; h: number } {
  const h = (s.w / game.figure) * game.ratio
  return { x: s.x - s.w / 2, y: s.y - h, w: s.w, h }
}

/** The figure next to figure `i` in a direction (for the arrow keys; the nearest middle, null when there is none). */
export function twelveNeighbour(game: TwelveGame, spots: readonly TwelveSpot[], i: number, dir: Dir): number | null {
  const mid = (s: TwelveSpot) => {
    const b = twelveBox(game, s)
    return { x: b.x + b.w / 2, y: (b.y + b.h / 2) / game.ratio }
  }
  const s = spots[i]
  if (!s) return null
  const a = mid(s)
  let best: number | null = null
  let bestScore = Infinity
  spots.forEach((o, k) => {
    if (k === i) return
    const p = mid(o)
    const dx = p.x - a.x
    const dy = p.y - a.y
    const along = dir === 1 ? dx : dir === 3 ? -dx : dir === 2 ? dy : -dy
    const across = dir === 1 || dir === 3 ? Math.abs(dy) : Math.abs(dx)
    if (along <= 0.5 || across > along * 2) return
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = k
    }
  })
  return best
}

/** The problems of the data of `zwoelf` (an empty list is good). */
export function twelveProblems(game: TwelveGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the mountain')
  if (game.ratio <= 0 || game.figure <= 0) out.push('a ratio is not positive')
  const ids = new Set<string>()
  const signs = new Set<string>()
  game.disciples.forEach((d) => {
    if (ids.has(d.id)) out.push(`the disciple "${d.id}" is there twice`)
    ids.add(d.id)
    if (!d.image) out.push(`no picture of "${d.id}"`)
    if (!d.name.trim()) out.push(`no name for "${d.id}"`)
    if (!d.sign.trim()) out.push(`no sign for "${d.id}"`)
    if (signs.has(d.sign)) out.push(`the sign "${d.sign}" is there twice`)
    signs.add(d.sign)
  })
  if (game.rounds.length < 1) out.push('no rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (r.spots.length !== r.stand.length) out.push(`round ${n}: ${r.spots.length} places but ${r.stand.length} disciples`)
    if (new Set(r.stand).size !== r.stand.length) out.push(`round ${n}: a disciple stands twice`)
    for (const id of r.stand) if (!ids.has(id)) out.push(`round ${n}: unknown disciple "${id}"`)
    if (!r.call.length) out.push(`round ${n}: nobody is called`)
    if (new Set(r.call).size !== r.call.length) out.push(`round ${n}: a name is called twice`)
    for (const id of r.call) if (!r.stand.includes(id)) out.push(`round ${n}: "${id}" is called but does not stand on the mountain`)
    r.spots.forEach((s, k) => {
      const b = twelveBox(game, s)
      if (b.x < -1 || b.x + b.w > 101 || b.y < 0 || s.y > 100) out.push(`round ${n}: place ${k + 1} lies outside the picture`)
      if (s.w < TWELVE_MIN_W) out.push(`round ${n}: place ${k + 1} is narrower than ${TWELVE_MIN_W} percent (too small on a phone)`)
      r.spots.forEach((o, j) => {
        if (j <= k) return
        // two figures may overlap a little in height (one stands behind the other), but the middles must lie apart, so that each can be touched
        const near = Math.abs(o.x - s.x) < Math.min(o.w, s.w) * 0.8 && Math.abs(o.y - s.y) < ((Math.min(o.w, s.w) / game.figure) * game.ratio) * 0.6
        if (near) out.push(`round ${n}: places ${k + 1} and ${j + 1} lie on top of each other`)
      })
    })
  })
  return out
}
