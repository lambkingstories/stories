/**
 * The pure parts of the six new games of "Salomo" (Anton's plan of 5.11.2026; the components only show and listen):
 * 1. "The wish cards" (`wunschkarten`, 1 Kings 3,5-14): picture cards float past in the night of Gibeon (riches, a long life, victory over the enemies, a listening heart); the child catches only the heart.
 * 2. "The rafts" (`floesse`, 1 Kings 5,9): the child binds cedar trunks into a raft and steers it over the sea to the landing place on the coast (a tap on the sea sets the course; reefs and cliffs are to be avoided).
 * 3. "Carving" (`schnitzen`, 1 Kings 6,18.29): the child follows the golden line of flowers, knots and palms in the cedar wood with the finger (the line is a grid of cells read from the painted board).
 * 4. "Pomegranates" (`granatapfel`, 1 Kings 7,18-20): chains of pomegranates, lilies and chain links hang at the pillar; the child continues the pattern (a tap on a hook changes what hangs there, a button checks).
 * 5. "Up the steps" (`stufen`, 1 Kings 8,3-6): the priests carry the ark up the steps; the child taps left and right in step, neither too fast nor (in round 2) too slow.
 * 6. "The treasury" (`schatzkammer`, 1 Kings 10,2.10): spices, gold and gems are taken from the camels and put into the shelf compartments with the same shape (drag, or tap and tap).
 * Places are percent of the picture: x of the width, y of the height. Times are seconds unless the name says milliseconds. Nothing here has a clock or dice of its own.
 */

/** A picture laid on the field: the file, a short name (for the screen reader and the stand-in) and its width in percent of the field. */
export interface SalSprite {
  image: string
  label: string
  w: number
}

export interface SalPt {
  x: number
  y: number
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
/** The narrowest picture that can still be tapped on a phone (12 % of a field 360 pixels wide are 43 pixels). */
export const SAL_MIN_W = 12

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function salDist(a: SalPt, b: SalPt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

// ================================================================ 1. the wish cards (`wunschkarten`)

/** The four wishes of the night at Gibeon (1 Kings 3,11): a listening (obedient) heart is what Solomon asks for. */
export type WishKind = 'heart' | 'riches' | 'life' | 'victory'
export const WISH_KINDS: readonly WishKind[] = ['heart', 'riches', 'life', 'victory']
/** The pictures of the cards are upright, 3:4 (width : height). */
export const WISH_CARD_RATIO = 0.75

/** A card of a round: its wish, the lane (the middle of the card, percent of the height) and when it comes in at the right edge (seconds after the start of a cycle). */
export interface WishCard {
  kind: WishKind
  lane: number
  at: number
}
/** One round: the hint, the speed of the cards (percent of the width a second), the cycle (seconds; the cards come again and again), the cards of a cycle and how many hearts are to be caught. */
export interface WishRound {
  hint: string
  speed: number
  period: number
  cards: WishCard[]
  need: number
}
/** The game "The wish cards": the night at Gibeon (3:2), a picture for each wish, the width of a card (percent of the field) and the rounds. */
export interface WishGame {
  background: string
  ratio?: number
  cards: Record<WishKind, SalSprite>
  cardW: number
  rounds: WishRound[]
}
/** A card on the screen: which card of the cycle (`k`), which cycle (`n`), its key and the middle of the card. */
export interface WishShown {
  k: number
  n: number
  key: string
  kind: WishKind
  x: number
  y: number
}

/** The height of a card in percent of the field. */
export const wishCardH = (game: WishGame): number => (game.cardW / WISH_CARD_RATIO) * (game.ratio ?? 1.5)
/** How long a card takes to cross the field (seconds). */
export const wishCross = (game: WishGame, round: WishRound): number => (100 + game.cardW) / round.speed

/** The cards on the screen at the time `t` (seconds of the round), without the ones already caught. */
export function wishShown(game: WishGame, round: WishRound, t: number, caught: ReadonlySet<string> = new Set()): WishShown[] {
  const out: WishShown[] = []
  const cross = wishCross(game, round)
  round.cards.forEach((c, k) => {
    const nLo = Math.max(0, Math.ceil((t - cross - c.at) / round.period))
    const nHi = Math.floor((t - c.at) / round.period)
    for (let n = nLo; n <= nHi; n++) {
      const age = t - (c.at + n * round.period)
      if (age < 0 || age > cross) continue
      const key = `${k}:${n}`
      if (caught.has(key)) continue
      out.push({ k, n, key, kind: c.kind, x: 100 + game.cardW / 2 - round.speed * age, y: c.lane })
    }
  })
  return out
}

export type WishVerdict = 'catch' | 'wrong'
/** A tap on a card: the heart is caught; riches, a long life and victory are not what Solomon asked for. */
export const wishTap = (kind: WishKind): WishVerdict => (kind === 'heart' ? 'catch' : 'wrong')

/** The heart that the button "Help me" shows: the one on the screen that is nearest to the middle (or null). */
export function wishHint(shown: readonly WishShown[]): WishShown | null {
  let best: WishShown | null = null
  for (const s of shown) if (s.kind === 'heart' && s.x > 4 && s.x < 96 && (!best || Math.abs(s.x - 50) < Math.abs(best.x - 50))) best = s
  return best
}

/** The problems of the data of `wunschkarten` (an empty list is good). */
export function wishCardsProblems(game: WishGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the night')
  for (const k of WISH_KINDS) if (!game.cards?.[k]?.image) out.push(`no picture of the card "${k}"`)
  if (!(game.cardW >= 14 && game.cardW <= 24)) out.push(`the cards should be 14 to 24 percent wide (they are ${game.cardW})`)
  const h = wishCardH(game)
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!(r.speed > 0)) out.push(`round ${n}: no speed`)
    const cross = wishCross(game, r)
    if (cross < 6) out.push(`round ${n}: the cards cross the field in less than six seconds`)
    const hearts = r.cards.filter((c) => c.kind === 'heart').length
    if (hearts < 1) out.push(`round ${n}: no heart in a cycle`)
    if (new Set(r.cards.filter((c) => c.kind !== 'heart').map((c) => c.kind)).size < 3) out.push(`round ${n}: the other three wishes should all come`)
    if (!(r.need >= 2)) out.push(`round ${n}: fewer than two hearts to catch`)
    const first = Math.min(...r.cards.filter((c) => c.kind === 'heart').map((c) => c.at + (100 * 0.15) / r.speed))
    if (first > 7) out.push(`round ${n}: the first heart comes too late`)
    r.cards.forEach((c, i) => {
      if (c.at < 0 || c.at >= r.period) out.push(`round ${n}: card ${i + 1} comes outside the cycle`)
      if (c.lane - h / 2 < -0.01 || c.lane + h / 2 > 100.01) out.push(`round ${n}: card ${i + 1} sticks out of the field`)
      r.cards.forEach((o, j) => {
        if (j <= i) return
        if (Math.abs(o.lane - c.lane) >= h * 1.02) return
        // the same lane (or lanes that overlap): the gap in time, also over the end of the cycle, must keep the cards apart
        const dt = Math.abs(o.at - c.at) % r.period
        const gap = Math.min(dt, r.period - dt) * r.speed
        if (gap < game.cardW * 1.15) out.push(`round ${n}: cards ${i + 1} and ${j + 1} overlap`)
      })
    })
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [WishRound, WishRound]
    if (!(b.speed > a.speed)) out.push('round 2 should be faster than round 1')
    if (b.need < a.need) out.push('round 2 should not want fewer hearts')
  }
  return out
}

// ================================================================ 2. the rafts (`floesse`)

/** A reef in the sea: the middle, its radius (units) and which of the pictures. */
export interface RaftReef {
  x: number
  y: number
  r: number
  kind: number
}
/**
 * One round: the hint, the loose trunks at the beach (middle of each), where the raft is bound and starts (its middle), the speed (units a second), how fast it turns (degrees a second),
 * the drift of the sea (units a second, x and y), the reefs, the landing place at the coast (from `top` to `bottom`, percent of the height) and the way the help steers (points to aim at).
 */
export interface RaftRound {
  hint: string
  loose: SalPt[]
  start: SalPt
  speed: number
  turn: number
  drift?: SalPt
  reefs: RaftReef[]
  landing: { top: number; bottom: number }
  route: SalPt[]
}
/**
 * The game "The rafts": the sea seen from above (3:2), a cedar trunk (lying across, `w` = its length, `thick` = its thickness, both percent of the width), a rope band, the pictures of the reefs,
 * where the coast begins (percent of the width; the raft arrives there) and the rounds. The raft sails to the right.
 */
export interface RaftGame {
  background: string
  ratio?: number
  trunk: SalSprite & { thick: number }
  rope: SalSprite
  reefs: SalSprite[]
  coast: number
  rounds: RaftRound[]
}
export interface RaftState {
  x: number
  y: number
  /** the direction of the raft (radians, 0 = to the right, positive = down) */
  heading: number
  /** where the child wants to go (or null: straight on) */
  target: SalPt | null
  /** seconds the raft still stands after a bump */
  pause: number
  arrived: boolean
}
export type RaftEvent = { type: 'reef'; index: number } | { type: 'cliff' } | { type: 'arrived' }

/** The raft as a circle (units): about half the length of a trunk. */
export const raftRadius = (game: RaftGame, round: RaftRound): number => Math.max(game.trunk.w * 0.42, (round.loose.length * game.trunk.thick) / 2)
/** The place of trunk `i` in the bound raft (the trunks lie one under the other). */
export function raftSlot(game: RaftGame, round: RaftRound, i: number): SalPt {
  const ratio = game.ratio ?? 1.5
  const n = round.loose.length
  return { x: round.start.x, y: round.start.y + (i - (n - 1) / 2) * game.trunk.thick * ratio }
}
export const raftStart = (round: RaftRound): RaftState => ({ x: round.start.x, y: round.start.y, heading: 0, target: null, pause: 0, arrived: false })
const angleDiff = (a: number, b: number): number => Math.atan2(Math.sin(a - b), Math.cos(a - b))
export const RAFT_PAUSE = 0.9
export const RAFT_PUSH = 5

/** One step (`dt` seconds): the raft turns toward its target (no faster than `turn`), sails on, drifts, and bumps into reefs and cliffs or lands. */
export function raftStep(game: RaftGame, round: RaftRound, st: RaftState, dt: number): { state: RaftState; events: RaftEvent[] } {
  if (st.arrived) return { state: st, events: [] }
  const ratio = game.ratio ?? 1.5
  const events: RaftEvent[] = []
  let { x, y, heading, pause } = st
  if (pause > 0) return { state: { ...st, pause: Math.max(0, pause - dt) }, events }
  if (st.target) {
    const want = Math.atan2((st.target.y - y) / ratio, st.target.x - x)
    const d = angleDiff(want, heading)
    const max = ((round.turn * Math.PI) / 180) * dt
    heading += clamp(d, -max, max)
  }
  heading = clamp(angleDiff(heading, 0), -Math.PI * 0.45, Math.PI * 0.45) // the raft never turns back to the beach
  x += Math.cos(heading) * round.speed * dt + (round.drift?.x ?? 0) * dt
  y += (Math.sin(heading) * round.speed * dt + (round.drift?.y ?? 0) * dt) * ratio
  const r = raftRadius(game, round)
  // the edges of the sea: top and bottom and the beach of Tyre hold the raft back (no mistake)
  y = clamp(y, (r * ratio) * 0.8, 100 - r * ratio * 0.8)
  x = Math.max(x, round.start.x)
  for (let i = 0; i < round.reefs.length; i++) {
    const f = round.reefs[i]!
    const d = salDist({ x, y }, f, ratio)
    if (d < r + f.r * 0.85) {
      events.push({ type: 'reef', index: i })
      // pushed back away from the reef
      const ax = (x - f.x) / (d || 1)
      const ay = (y - f.y) / ratio / (d || 1)
      x += ax * RAFT_PUSH
      y += ay * RAFT_PUSH * ratio
      x = Math.max(x, round.start.x)
      return { state: { x, y, heading, target: st.target, pause: RAFT_PAUSE, arrived: false }, events }
    }
  }
  if (x + r >= game.coast) {
    if (y >= round.landing.top && y <= round.landing.bottom) {
      events.push({ type: 'arrived' })
      return { state: { x: game.coast - r, y, heading: 0, target: null, pause: 0, arrived: true }, events }
    }
    events.push({ type: 'cliff' })
    return { state: { x: game.coast - r - RAFT_PUSH, y, heading: 0, target: st.target, pause: RAFT_PAUSE, arrived: false }, events }
  }
  return { state: { x, y, heading, target: st.target, pause, arrived: false }, events }
}

/** The point the help aims at: the first point of the route that still lies ahead of the raft (more than three units to the right), or the middle of the landing place. */
export function raftAutoTarget(game: RaftGame, round: RaftRound, st: RaftState): SalPt {
  const p = round.route.find((q) => q.x > st.x + 3)
  return p ?? { x: game.coast, y: (round.landing.top + round.landing.bottom) / 2 }
}

/** Sails the round with the help from the start (for the check of the data): whether it lands, the bumps and the seconds. */
export function raftSimulate(game: RaftGame, round: RaftRound, dt = 0.05): { arrived: boolean; bumps: number; seconds: number } {
  let st = raftStart(round)
  let bumps = 0
  for (let t = 0; t < 120; t += dt) {
    st = { ...st, target: raftAutoTarget(game, round, st) }
    const r = raftStep(game, round, st, dt)
    st = r.state
    for (const e of r.events) if (e.type !== 'arrived') bumps++
    if (st.arrived) return { arrived: true, bumps, seconds: t }
  }
  return { arrived: false, bumps, seconds: 120 }
}

/** The problems of the data of `floesse` (an empty list is good). */
export function raftsProblems(game: RaftGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the sea')
  if (!game.trunk?.image) out.push('no picture of a trunk')
  else if (!(game.trunk.w >= SAL_MIN_W && game.trunk.thick >= 1.8)) out.push('the trunk is too small to see')
  if (!game.rope?.image) out.push('no picture of the rope')
  if (!game.reefs?.length || game.reefs.some((s) => !s.image)) out.push('no pictures of the reefs')
  if (!(game.coast > 60 && game.coast <= 100)) out.push('the coast lies wrong')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (r.loose.length < 3) out.push(`round ${n}: fewer than three trunks`)
    if (!(r.landing.bottom - r.landing.top >= 12)) out.push(`round ${n}: the landing place is too narrow`)
    if (!(r.speed > 0 && r.turn > 0)) out.push(`round ${n}: the raft does not sail`)
    r.loose.forEach((p, i) => {
      if (p.x - game.trunk.w / 2 < 0 || p.x + game.trunk.w / 2 > 100 || p.y < 3 || p.y > 97) out.push(`round ${n}: trunk ${i + 1} lies outside the picture`)
      r.loose.forEach((o, j) => {
        // a trunk is a button at least 44 pixels high: on a field 360 pixels wide that is 44 / (360 / ratio) of the height
        if (j > i && Math.abs(o.y - p.y) < (44 / (360 / ratio)) * 100 && Math.abs(o.x - p.x) < game.trunk.w * 1.05) out.push(`round ${n}: trunks ${i + 1} and ${j + 1} lie on each other`)
      })
    })
    const rad = raftRadius(game, r)
    r.reefs.forEach((f, i) => {
      if (!game.reefs[f.kind]) out.push(`round ${n}: reef ${i + 1} has no picture`)
      if (!(f.r >= 3)) out.push(`round ${n}: reef ${i + 1} is too small to see`)
      if (salDist(f, r.start, ratio) < rad + f.r + 6) out.push(`round ${n}: reef ${i + 1} lies at the start`)
      if (f.x + f.r > game.coast - 2) out.push(`round ${n}: reef ${i + 1} lies at the coast`)
    })
    const sim = raftSimulate(game, r)
    if (!sim.arrived) out.push(`round ${n}: the help does not reach the landing place`)
    else if (sim.bumps > 0) out.push(`round ${n}: the help bumps into a reef or a cliff`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [RaftRound, RaftRound]
    if (b.reefs.length <= a.reefs.length) out.push('round 2 should have more reefs')
    if (b.loose.length < a.loose.length) out.push('round 2 should not have fewer trunks')
  }
  return out
}

// ================================================================ 3. carving (`schnitzen`)

/** A board: the painted cedar board (square) with its golden line, the name of the ornament and the line as a grid of cells (`#` line, `.` wood), read from the picture by a tool. */
export interface CarvePattern {
  image: string
  label: string
  rows: string[]
}
/** One round: the hint, the boards (indices of `patterns`), how much of the line must be gone over (0..1) and how far (cells) the finger may leave the line before the iron slips. */
export interface CarveRound {
  hint: string
  patterns: number[]
  need: number
  slip: number
}
/** The game "Carving": the boards, the carving iron that follows the finger, the gold dust that shows what is done, the width of the trace (cells) and the rounds. */
export interface CarveGame {
  patterns: CarvePattern[]
  tool: SalSprite
  dust: string
  brush: number
  rounds: CarveRound[]
}

/** The cells of the line of a board (`y * size + x`) and the size of the grid. */
export function carveCells(p: CarvePattern): { size: number; cells: number[] } {
  const size = p.rows.length
  const cells: number[] = []
  p.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') cells.push(y * size + x)
  })
  return { size, cells }
}

/** The distance (cells, as the crow flies) of a point of the board (cells) to the nearest cell of the line. */
export function carveNear(p: CarvePattern, cx: number, cy: number): number {
  const { size, cells } = carveCells(p)
  let best = Infinity
  for (const c of cells) {
    const x = (c % size) + 0.5
    const y = Math.floor(c / size) + 0.5
    best = Math.min(best, Math.hypot(x - cx, y - cy))
  }
  return best
}

/** The cells of the line that a trace from `a` to `b` (cells) goes over with a brush of radius `brush` (cells). */
export function carveTrace(p: CarvePattern, a: SalPt, b: SalPt, brush: number): number[] {
  const { size, cells } = carveCells(p)
  const set = new Set(cells)
  const out = new Set<number>()
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  const steps = Math.max(1, Math.ceil(len / 0.4))
  for (let s = 0; s <= steps; s++) {
    const px = a.x + ((b.x - a.x) * s) / steps
    const py = a.y + ((b.y - a.y) * s) / steps
    const r = Math.ceil(brush)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const x = Math.floor(px) + dx
        const y = Math.floor(py) + dy
        if (x < 0 || y < 0 || x >= size || y >= size) continue
        if (Math.hypot(x + 0.5 - px, y + 0.5 - py) > brush) continue
        const c = y * size + x
        if (set.has(c)) out.add(c)
      }
  }
  return [...out]
}

/** How much of the line is done (0..1). */
export const carveShare = (p: CarvePattern, done: ReadonlySet<number>): number => {
  const { cells } = carveCells(p)
  return cells.length ? cells.filter((c) => done.has(c)).length / cells.length : 1
}

/** The first cell of the line that is not done (for the help: the iron shows where to go on), or null. */
export function carveNext(p: CarvePattern, done: ReadonlySet<number>, from?: SalPt): SalPt | null {
  const { size, cells } = carveCells(p)
  let best: SalPt | null = null
  let bd = Infinity
  for (const c of cells) {
    if (done.has(c)) continue
    const q = { x: (c % size) + 0.5, y: Math.floor(c / size) + 0.5 }
    const d = from ? Math.hypot(q.x - from.x, q.y - from.y) : q.y * size + q.x
    if (d < bd) {
      bd = d
      best = q
    }
  }
  return best
}

/** The parts of the line that hang together (4-neighbours and diagonals), largest first: a good board has few. */
export function carveParts(p: CarvePattern): number[] {
  const { size, cells } = carveCells(p)
  const set = new Set(cells)
  const seen = new Set<number>()
  const parts: number[] = []
  for (const c of cells) {
    if (seen.has(c)) continue
    let n = 0
    const stack = [c]
    seen.add(c)
    while (stack.length) {
      const k = stack.pop()!
      n++
      const x = k % size
      const y = Math.floor(k / size)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
          const q = ny * size + nx
          if (set.has(q) && !seen.has(q)) {
            seen.add(q)
            stack.push(q)
          }
        }
    }
    parts.push(n)
  }
  return parts.sort((a, b) => b - a)
}

/** The problems of the data of `schnitzen` (an empty list is good). */
export function carvingProblems(game: CarveGame): string[] {
  const out: string[] = []
  if (!game.tool?.image) out.push('no picture of the carving iron')
  if (!game.dust) out.push('no picture of the gold dust')
  if (!(game.brush >= 1 && game.brush <= 3)) out.push('the trace should be 1 to 3 cells wide')
  game.patterns.forEach((p, i) => {
    const n = i + 1
    if (!p.image) out.push(`board ${n}: no picture`)
    const size = p.rows.length
    if (size < 20 || p.rows.some((r) => r.length !== size || /[^#.]/.test(r))) out.push(`board ${n}: the grid should be square, at least 20 cells, only "#" and "."`)
    const { cells } = carveCells(p)
    if (cells.length < size * 2) out.push(`board ${n}: the line is too short`)
    if (cells.length > size * size * 0.3) out.push(`board ${n}: the line covers too much of the board`)
    const parts = carveParts(p)
    if (parts.length > 6) out.push(`board ${n}: the line falls into too many pieces (${parts.length})`)
    // the margin: the line keeps away from the edge of the board
    if (p.rows.slice(0, 1).concat(p.rows.slice(-1)).some((r) => r.includes('#')) || p.rows.some((r) => r[0] === '#' || r[r.length - 1] === '#')) out.push(`board ${n}: the line touches the edge`)
  })
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.patterns.length || r.patterns.some((k) => !game.patterns[k])) out.push(`round ${n}: boards are missing`)
    if (!(r.need > 0.6 && r.need <= 0.95)) out.push(`round ${n}: the share to be done should be between 60 and 95 percent`)
    if (!(r.slip >= 1.5)) out.push(`round ${n}: the finger needs room around the line`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [CarveRound, CarveRound]
    if (!(b.slip < a.slip || b.need > a.need)) out.push('round 2 should be stricter than round 1')
  }
  return out
}

// ================================================================ 4. pomegranates (`granatapfel`)

/** What hangs at the pillar: pomegranates, lilies (the capital is lily work) and chain links (the network of chains), 1 Kings 7,17-20. */
export type PomKind = 'granat' | 'lilie' | 'kette'
export const POM_KINDS: readonly PomKind[] = ['granat', 'lilie', 'kette']
/** A chain: where its hooks hang (percent of the height), the pattern that repeats, how many hooks and which of them are already full at the start. */
export interface PomRow {
  y: number
  motif: PomKind[]
  length: number
  given: number[]
}
export interface PomRound {
  hint: string
  rows: PomRow[]
}
/** The game "Pomegranates": the capital of the pillar (3:2), the three things, the hook, the hooks from `x0` to `x1` (percent of the width), the width of a thing and the rounds. */
export interface PomGame {
  background: string
  ratio?: number
  items: Record<PomKind, SalSprite>
  hook: SalSprite
  x0: number
  x1: number
  slotW: number
  rounds: PomRound[]
}

/** The whole chain as it should be. */
export const pomPattern = (row: PomRow): PomKind[] => Array.from({ length: row.length }, (_, i) => row.motif[i % row.motif.length]!)
/** The x of hook `i` of a row. */
export const pomX = (game: PomGame, row: PomRow, i: number): number => (row.length <= 1 ? (game.x0 + game.x1) / 2 : game.x0 + ((game.x1 - game.x0) * i) / (row.length - 1))
/** The height of a hook with its thing (percent of the height): the button is 0.62 times as wide as high. */
export const POM_HOOK_RATIO = 0.62
export const pomHookH = (game: PomGame): number => (game.slotW / POM_HOOK_RATIO) * (game.ratio ?? 1.5)
/** The kinds a round uses (in the order of `POM_KINDS`). */
export const pomKinds = (round: PomRound): PomKind[] => POM_KINDS.filter((k) => round.rows.some((r) => r.motif.includes(k)))
/** A tap on an open hook: empty → the first kind → the next … → empty again. */
export function pomCycle(round: PomRound, cur: PomKind | null): PomKind | null {
  const ks = pomKinds(round)
  if (cur === null) return ks[0] ?? null
  const i = ks.indexOf(cur)
  return i < 0 || i + 1 >= ks.length ? null : ks[i + 1]!
}
/** The hooks the child must fill (row, hook). */
export const pomOpen = (round: PomRound): Array<[number, number]> => round.rows.flatMap((r, ri) => Array.from({ length: r.length }, (_, i) => i).filter((i) => !r.given.includes(i)).map((i) => [ri, i] as [number, number]))
/** Checks what hangs: for every open hook right (true) or wrong (false); an empty hook is wrong. */
export function pomCheck(round: PomRound, hung: ReadonlyArray<ReadonlyArray<PomKind | null>>): boolean[][] {
  return round.rows.map((r, ri) => {
    const want = pomPattern(r)
    return want.map((k, i) => r.given.includes(i) || hung[ri]?.[i] === k)
  })
}

/** The problems of the data of `granatapfel` (an empty list is good). */
export function pomegranatesProblems(game: PomGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the pillar')
  for (const k of POM_KINDS) if (!game.items?.[k]?.image) out.push(`no picture of "${k}"`)
  if (!game.hook?.image) out.push('no picture of the hook')
  if (!(game.slotW >= SAL_MIN_W)) out.push(`a thing should be at least ${SAL_MIN_W} percent wide`)
  if (!(game.x0 - game.slotW / 2 >= 0 && game.x1 + game.slotW / 2 <= 100)) out.push('the hooks reach outside the picture')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.rows.length) out.push(`round ${n}: no chain`)
    r.rows.forEach((row, k) => {
      const m = k + 1
      if (row.motif.length < 2) out.push(`round ${n}, chain ${m}: the pattern needs at least two things`)
      if (row.length < row.motif.length * 2) out.push(`round ${n}, chain ${m}: the pattern does not repeat`)
      const step = row.length > 1 ? (game.x1 - game.x0) / (row.length - 1) : 100
      if (step < game.slotW * 1.04) out.push(`round ${n}, chain ${m}: the hooks are too close together`)
      // the given things show the whole pattern: every place in the motif is seen at least once
      for (let p = 0; p < row.motif.length; p++) if (!row.given.some((g) => g % row.motif.length === p)) out.push(`round ${n}, chain ${m}: the pattern cannot be seen (place ${p + 1} of the motif is never shown)`)
      if (row.given.some((g) => g < 0 || g >= row.length)) out.push(`round ${n}, chain ${m}: a given hook does not exist`)
      if (row.given.length >= row.length) out.push(`round ${n}, chain ${m}: nothing left to hang`)
      const itemH = pomHookH(game)
      if (row.y < 2 || row.y + itemH > 100) out.push(`round ${n}, chain ${m}: the things hang outside the picture`)
      r.rows.forEach((o, j) => {
        if (j > k && Math.abs(o.y - row.y) < itemH) out.push(`round ${n}: chains ${m} and ${j + 1} hang on each other`)
      })
    })
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [PomRound, PomRound]
    if (pomOpen(b).length <= pomOpen(a).length) out.push('round 2 should have more hooks to fill')
    if (pomKinds(b).length < pomKinds(a).length) out.push('round 2 should not have fewer kinds')
  }
  return out
}

// ================================================================ 5. up the steps (`stufen`)

export type StairSide = 'left' | 'right'
/** One round: the hint, the steps up to the door, the quickest step (seconds between two taps) and the slowest; `strict`: a step that is too slow is a mistake too. */
export interface StairsRound {
  hint: string
  steps: number
  min: number
  max: number
  strict?: boolean
}
/** The game "Up the steps": the stairs to the house of God (portrait 3:4), the priests with the ark seen from behind, where they stand at the bottom and at the top (percent of the height, their feet) and how small they are at the top. */
export interface StairsGame {
  background: string
  ratio?: number
  group: SalSprite
  bottom: number
  top: number
  topScale: number
  rounds: StairsRound[]
}
export interface StairsState {
  done: number
  next: StairSide | null
  /** the time of the last step (milliseconds), or null */
  last: number | null
}
export type StairsVerdict = 'step' | 'wrong-foot' | 'too-fast' | 'too-slow' | 'restart'

export const stairsStart = (): StairsState => ({ done: 0, next: null, last: null })
const other = (s: StairSide): StairSide => (s === 'left' ? 'right' : 'left')

/**
 * A tap on a side at the time `now` (milliseconds): the first tap is always a step; then the other foot must come, not quicker than `min`. Slower than `max` is a mistake in a strict round;
 * in the other round the priests only stood still and begin again (a step, no mistake).
 */
export function stairsTap(round: StairsRound, st: StairsState, side: StairSide, now: number): { state: StairsState; verdict: StairsVerdict } {
  if (st.done >= round.steps) return { state: st, verdict: 'step' }
  if (st.next === null || st.last === null) return { state: { done: st.done + 1, next: other(side), last: now }, verdict: 'step' }
  if (side !== st.next) return { state: st, verdict: 'wrong-foot' }
  const dt = (now - st.last) / 1000
  if (dt < round.min) return { state: { ...st, last: now }, verdict: 'too-fast' }
  if (dt > round.max) {
    if (round.strict) return { state: { ...st, last: now }, verdict: 'too-slow' }
    return { state: { done: st.done + 1, next: other(side), last: now }, verdict: 'restart' }
  }
  return { state: { done: st.done + 1, next: other(side), last: now }, verdict: 'step' }
}

/** The place of the priests after `done` of `steps` steps: the feet (percent of the height) and the size (1 at the bottom). */
export function stairsPlace(game: StairsGame, done: number, steps: number): { y: number; scale: number } {
  const f = steps > 0 ? clamp(done / steps, 0, 1) : 0
  return { y: game.bottom + (game.top - game.bottom) * f, scale: 1 + (game.topScale - 1) * f }
}
/** The beat the help keeps (seconds between two steps): the middle of the allowed time. */
export const stairsBeat = (round: StairsRound): number => (round.min + Math.min(round.max, round.min * 3)) / 2

/** The problems of the data of `stufen` (an empty list is good). */
export function stairsProblems(game: StairsGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 0.75
  if (!game.background) out.push('no picture of the stairs')
  if (!game.group?.image) out.push('no picture of the priests with the ark')
  else if (!(game.group.w * game.topScale >= 20)) out.push('the priests are too small at the top')
  if (!(game.bottom <= 100 && game.top > 20 && game.top < game.bottom - 20)) out.push('the way up the stairs is too short')
  if (game.group && game.top - game.group.w * game.topScale * ratio * 0.9 < 0) out.push('the priests stick out at the top')
  if (!(game.topScale > 0.3 && game.topScale <= 1)) out.push('the size at the top should be between 0.3 and 1')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!(r.steps >= 6)) out.push(`round ${n}: fewer than six steps`)
    if (!(r.min >= 0.2 && r.max >= r.min * 2)) out.push(`round ${n}: the time for a step is too short`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [StairsRound, StairsRound]
    if (!(b.steps > a.steps)) out.push('round 2 should have more steps')
    if (!(b.strict && !a.strict)) out.push('only round 2 should be strict')
    if (!(b.max - b.min < a.max - a.min)) out.push('round 2 should allow less time')
  }
  return out
}

// ================================================================ 6. the treasury (`schatzkammer`)

/** The three shapes: the spices in a sack, the gold as a bar, the gem (1 Kings 10,2.10). */
export type TreasureShape = 'sack' | 'barren' | 'stein'
export const TREASURE_SHAPES: readonly TreasureShape[] = ['sack', 'barren', 'stein']
/** A compartment of the shelf: its shape and its middle. */
export interface TreasureSlot {
  shape: TreasureShape
  x: number
  y: number
}
/** One round: the hint, the compartments, and the camels one after the other, each with what it carries (in the order of its places). */
export interface TreasureRound {
  hint: string
  slots: TreasureSlot[]
  camels: TreasureShape[][]
}
/**
 * The game "The treasury": the storeroom (3:2), the camel (looks to the left; `x` its middle, `y` its feet), the places on its carrying board (percent of the field, for the camel at its place),
 * a picture for each thing and for each compartment, the width of a compartment and of a thing, and the rounds.
 */
export interface TreasuryGame {
  background: string
  ratio?: number
  camel: SalSprite & SalPt
  board: SalPt[]
  items: Record<TreasureShape, SalSprite>
  niches: Record<TreasureShape, SalSprite>
  rounds: TreasureRound[]
}
export type TreasureVerdict = 'stored' | 'wrong-shape' | 'full' | 'none'

/** A thing let go on the compartment `slot` (or on none): stored when the shape is the same and the compartment is empty. */
export function treasureDrop(round: TreasureRound, filled: ReadonlyArray<boolean>, shape: TreasureShape, slot: number | null): TreasureVerdict {
  if (slot === null || !round.slots[slot]) return 'none'
  if (filled[slot]) return 'full'
  return round.slots[slot]!.shape === shape ? 'stored' : 'wrong-shape'
}
/** The compartment under a point (its box from the picture of the niche), or null. */
export function treasureSlotAt(game: TreasuryGame, round: TreasureRound, p: SalPt): number | null {
  const ratio = game.ratio ?? 1.5
  let best: number | null = null
  let bd = Infinity
  round.slots.forEach((s, i) => {
    const w = game.niches[s.shape].w
    const h = w * ratio // the niches are square
    if (Math.abs(p.x - s.x) <= w * 0.6 && Math.abs(p.y - s.y) <= h * 0.6) {
      const d = salDist(p, s, ratio)
      if (d < bd) {
        bd = d
        best = i
      }
    }
  })
  return best
}
/** The empty compartment the help shows for a thing (or null). */
export const treasureHint = (round: TreasureRound, filled: ReadonlyArray<boolean>, shape: TreasureShape): number | null => {
  const i = round.slots.findIndex((s, k) => !filled[k] && s.shape === shape)
  return i >= 0 ? i : null
}
/** How many things a round has. */
export const treasureCount = (round: TreasureRound): number => round.camels.reduce((n, c) => n + c.length, 0)

/** The problems of the data of `schatzkammer` (an empty list is good). */
export function treasuryProblems(game: TreasuryGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the storeroom')
  if (!game.camel?.image) out.push('no picture of the camel')
  for (const s of TREASURE_SHAPES) {
    if (!game.items?.[s]?.image) out.push(`no picture of the thing "${s}"`)
    else if (!(game.items[s].w >= SAL_MIN_W)) out.push(`the thing "${s}" is too small to be dragged`)
    if (!game.niches?.[s]?.image) out.push(`no picture of the compartment "${s}"`)
    else if (!(game.niches[s].w >= 14)) out.push(`the compartment "${s}" is too small`)
    else if (game.items?.[s] && game.items[s].w > game.niches[s].w) out.push(`the thing "${s}" is wider than its compartment`)
  }
  if (game.camel && game.camel.y > 100.01) out.push('the camel stands outside the picture')
  if (!game.board?.length) out.push('the camel carries nothing')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const loads = r.camels.flat()
    if (r.camels.some((c) => c.length > (game.board?.length ?? 0))) out.push(`round ${n}: a camel carries more than its board holds`)
    for (const s of TREASURE_SHAPES) {
      const need = loads.filter((x) => x === s).length
      const have = r.slots.filter((x) => x.shape === s).length
      if (need !== have) out.push(`round ${n}: ${need} things "${s}", but ${have} compartments`)
    }
    if (new Set(loads).size < 3) out.push(`round ${n}: all three shapes should come`)
    r.slots.forEach((s, i) => {
      const w = game.niches[s.shape]?.w ?? 0
      const h = w * ratio
      if (s.x - w / 2 < 0 || s.x + w / 2 > 100 || s.y - h / 2 < 0 || s.y + h / 2 > 100) out.push(`round ${n}: compartment ${i + 1} lies outside the picture`)
      if (game.camel && s.y + h / 2 > game.camel.y - game.camel.w * ratio * 0.9 && Math.abs(s.x - game.camel.x) < (w + game.camel.w) / 2) out.push(`round ${n}: compartment ${i + 1} lies on the camel`)
      r.slots.forEach((o, j) => {
        if (j <= i) return
        const wo = game.niches[o.shape]?.w ?? 0
        if (Math.abs(o.x - s.x) < (w + wo) / 2 * 1.02 && Math.abs(o.y - s.y) < ((w + wo) / 2) * ratio * 1.02) out.push(`round ${n}: compartments ${i + 1} and ${j + 1} overlap`)
      })
    })
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds as [TreasureRound, TreasureRound]
    if (treasureCount(b) <= treasureCount(a)) out.push('round 2 should have more things')
  }
  return out
}

/** Every number of a list is finite (for the tools that read the data). */
export const salFinite = (xs: unknown[]): boolean => xs.every(finite)
