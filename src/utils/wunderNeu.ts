/**
 * The pure parts of the two new games of "Jesu Wunder am See" (Anton's plan of 5.11.2026; the components only show and listen):
 * 1. "The hem" (`saum`, Mark 5,25-34): Jesus walks along a lane in Capernaum in the crowd; a woman of the crowd stretches out her hand. The child taps the tassels of the hem of his mantle
 *    exactly while they pass her fingers. Too early, too late or beside the hem is a mistake; somebody of the crowd walking in front only hides the hem for a moment (no mistake).
 * 2. "Along the shore" (`ufer`, Mark 6,30-34): the boat sails to a quiet place; the child draws with the finger a way for the crowd along the shore, round the rocks and not into the water,
 *    from the village to the landing place. A line that runs into a rock or into the water stops there (a mistake); at the landing place the crowd walks the drawn way.
 * Places are percent of the picture: x of the width, y of the height. Distances are "units": percent of the width, the vertical difference shortened by the ratio of the picture (width / height).
 * Times are seconds. Nothing here has a clock or dice of its own.
 */

/** A picture laid on the field: the file, a short name (for the screen reader and the stand-in) and its width in percent of the field. */
export interface NeuSprite {
  image: string
  label: string
  w: number
}

export interface Pt {
  x: number
  y: number
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const inside = (p: Pt): boolean => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function wunderDist(a: Pt, b: Pt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

/** The smallest tap circle on a phone: a radius of 6.2 units is a circle 12.4 % wide, 44.6 pixels on a field 360 pixels wide. */
export const WUNDER_MIN_TAP_R = 6.2

// ================================================================ 1. the hem (`saum`)

/** Somebody of the crowd who walks across in front of Jesus: which picture, the line of the feet (percent of the height, in front of the lane), from where to where (percent of the width),
 * when in the passing of Jesus he starts (seconds after Jesus came in at the left) and how long he takes. */
export interface SaumWalker {
  person: number
  lane: number
  from: number
  to: number
  at: number
  dur: number
}
/** One round: the hint, how long Jesus takes to walk through the picture, how long it is until he comes again, how far the hem may be from the fingers of the woman (units, left and right),
 * the tap circle round the hem (units), how far the hem swings up and down while he walks (percent of the height), whether the place of the fingers is shown as a ring and the people walking in front. */
export interface SaumRound {
  hint: string
  duration: number
  pause: number
  reach: number
  hemR: number
  sway: number
  ring?: boolean
  walkers: SaumWalker[]
}
/**
 * The game "The hem" (`saum`): the lane seen from the side (3:2), the line of Jesus' feet (`road`), Jesus walking to the right (his picture: width and height / width), where the tassels of the hem
 * lie in his picture (percent from its left edge and its top), the woman (middle and foot line on the field), where her fingertips are (on the field), the people of the crowd and the rounds.
 */
export interface SaumGame {
  background: string
  ratio?: number
  road: number
  jesus: NeuSprite & { aspect?: number }
  hem: Pt
  woman: NeuSprite & Pt & { aspect?: number }
  touch: Pt
  people: (NeuSprite & { aspect?: number })[]
  rounds: SaumRound[]
}
/** The hem swings with his steps (steps a second). */
export const SAUM_STEP_HZ = 1.6
/** The body of a walker covers this share of the width of his picture (the picture has air at the sides). */
export const SAUM_BODY = 0.7
/** The shortest moment (seconds) in which the hem must be free and at the fingers, so that a child can tap it. */
export const SAUM_MIN_WINDOW = 0.45

const ratioOf = (game: { ratio?: number }): number => game.ratio ?? 1.5

/** One passing and the pause after it. */
export const saumCycle = (round: SaumRound): number => round.duration + round.pause

/** Where the middle of Jesus' picture is at the time `t` (seconds since the round began), or null while he is out of the picture (between two passings). */
export function saumJesusX(game: SaumGame, round: SaumRound, t: number): number | null {
  const c = saumCycle(round)
  const phase = ((t % c) + c) % c
  if (phase >= round.duration) return null
  const from = -game.jesus.w / 2 - 1
  const to = 100 + game.jesus.w / 2 + 1
  return from + ((to - from) * phase) / round.duration
}

/** The height of a picture in percent of the field. */
export const saumHeight = (game: SaumGame, s: { w: number; aspect?: number }): number => s.w * (s.aspect ?? 1) * ratioOf(game)

/** Where the tassels of the hem are at the time `t` (or null while Jesus is out of the picture). */
export function saumHem(game: SaumGame, round: SaumRound, t: number): Pt | null {
  const x = saumJesusX(game, round, t)
  if (x === null) return null
  const h = saumHeight(game, game.jesus)
  const swing = round.sway * Math.sin(2 * Math.PI * SAUM_STEP_HZ * t)
  return { x: x - game.jesus.w / 2 + (game.hem.x / 100) * game.jesus.w, y: game.road - h + (game.hem.y / 100) * h + swing }
}

/** Where a walker of the crowd is at the time `t` (the middle of his picture), or null when he is not walking now. */
export function saumWalkerX(round: SaumRound, wk: SaumWalker, t: number): number | null {
  const c = saumCycle(round)
  const phase = ((t % c) + c) % c
  if (phase < wk.at || phase > wk.at + wk.dur) return null
  return wk.from + ((wk.to - wk.from) * (phase - wk.at)) / wk.dur
}

/** The walker who hides the place `p` at the time `t` (index), or -1. */
export function saumCovered(game: SaumGame, round: SaumRound, t: number, p: Pt): number {
  return round.walkers.findIndex((wk) => {
    const x = saumWalkerX(round, wk, t)
    const s = game.people[wk.person]
    if (x === null || !s) return false
    const h = saumHeight(game, s)
    return Math.abs(p.x - x) <= (s.w * SAUM_BODY) / 2 && p.y <= wk.lane && p.y >= wk.lane - h
  })
}

/** The hem is at the fingers of the woman. */
export const saumAtHand = (game: SaumGame, round: SaumRound, hem: Pt): boolean => Math.abs(hem.x - game.touch.x) <= round.reach

export type SaumVerdict = 'touch' | 'early' | 'late' | 'miss' | 'covered' | 'wait'

/**
 * A tap at the time `t` on the place `p` (null: the key Enter, a tap right on the hem): on the free hem at the fingers of the woman she touches it; on the hem while it is still before or
 * already past her fingers it is too early or too late; beside the hem it is a miss; on somebody walking in front of the hem nothing happens; while Jesus is away there is nothing to tap.
 */
export function saumTap(game: SaumGame, round: SaumRound, t: number, p: Pt | null): SaumVerdict {
  const hem = saumHem(game, round, t)
  if (!hem) return 'wait'
  if (p && wunderDist(p, hem, ratioOf(game)) > round.hemR) return 'miss'
  if (saumCovered(game, round, t, hem) >= 0) return 'covered'
  if (saumAtHand(game, round, hem)) return 'touch'
  return hem.x < game.touch.x ? 'early' : 'late'
}

/** The moments of one passing (seconds from its start) in which the hem is free and at the fingers: [start, end] pairs. */
export function saumWindows(game: SaumGame, round: SaumRound, dt = 0.01): [number, number][] {
  const out: [number, number][] = []
  let open: number | null = null
  for (let t = 0; t <= round.duration + 1e-9; t += dt) {
    const hem = saumHem(game, round, t)
    const good = !!hem && saumAtHand(game, round, hem) && saumCovered(game, round, t, hem) < 0
    if (good && open === null) open = t
    if (!good && open !== null) {
      out.push([open, t - dt])
      open = null
    }
  }
  if (open !== null) out.push([open, round.duration])
  return out
}

/** How long (seconds of one passing) the hem is at the fingers but hidden by somebody walking in front. */
export function saumHiddenAtHand(game: SaumGame, round: SaumRound, dt = 0.01): number {
  let n = 0
  for (let t = 0; t <= round.duration; t += dt) {
    const hem = saumHem(game, round, t)
    if (hem && saumAtHand(game, round, hem) && saumCovered(game, round, t, hem) >= 0) n += dt
  }
  return n
}

/** The button "Help me": the next good moment at or after `t` (the middle of the longest free window of a passing that is still to come). */
export function saumHelpAt(game: SaumGame, round: SaumRound, t: number): number | null {
  const wins = saumWindows(game, round).filter(([a, b]) => b - a >= SAUM_MIN_WINDOW)
  if (!wins.length) return null
  const best = wins.reduce((m, w) => (w[1] - w[0] > m[1] - m[0] ? w : m))
  const mid = (best[0] + best[1]) / 2
  const c = saumCycle(round)
  const start = Math.floor(t / c) * c
  return start + mid >= t + 0.15 ? start + mid : start + c + mid
}

/** The problems of the data of `saum` (an empty list is good). */
export function saumProblems(game: SaumGame): string[] {
  const out: string[] = []
  const ratio = ratioOf(game)
  if (!game.background) out.push('no picture of the lane')
  if (!(game.road >= 55 && game.road <= 99)) out.push('the lane (the line of the feet) should lie between 55 and 99 percent of the height')
  if (!game.jesus?.image) out.push('no picture of Jesus')
  else if (!(game.jesus.w >= 14 && game.jesus.w <= 40)) out.push(`Jesus should be 14 to 40 percent wide (he is ${game.jesus.w})`)
  if (!(game.hem.x >= 0 && game.hem.x <= 100 && game.hem.y >= 50 && game.hem.y <= 100)) out.push('the hem should lie in the lower half of the picture of Jesus')
  if (!game.woman?.image) out.push('no picture of the woman')
  else if (!(game.woman.w >= 11 && game.woman.w <= 40)) out.push(`the woman should be 11 to 40 percent wide (she is ${game.woman.w})`)
  if (!inside(game.woman) || game.woman.x - game.woman.w / 2 < -2 || game.woman.x + game.woman.w / 2 > 102) out.push('the woman stands outside the picture')
  if (!(game.touch.x >= 25 && game.touch.x <= 80)) out.push('the fingers of the woman should be between 25 and 80 percent of the width (Jesus must be seen coming)')
  if (Math.abs(game.woman.y - game.road) > 9) out.push('the woman should stand on the lane, just behind the line of Jesus (her foot line near the lane)')
  const hemBase = game.road - saumHeight(game, game.jesus) * (1 - game.hem.y / 100)
  if (Math.abs(hemBase - game.touch.y) > 9) out.push(`the fingers of the woman (${game.touch.y.toFixed(1)}) are not at the height of the hem (${hemBase.toFixed(1)})`)
  if (game.people.length < 2) out.push('fewer than two people of the crowd')
  game.people.forEach((s, i) => {
    if (!s.image) out.push(`person ${i + 1} has no picture`)
    else if (!(s.w >= 11 && s.w <= 40)) out.push(`person ${i + 1} should be 11 to 40 percent wide (is ${s.w})`)
  })
  if (game.rounds.length < 1) out.push('no rounds')
  const windowOf = (r: SaumRound) => saumWindows(game, r).reduce((m, [a, b]) => Math.max(m, b - a), 0)
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (![r.duration, r.pause, r.reach, r.hemR, r.sway].every(finite)) {
      out.push(`round ${n}: a number is missing`)
      return
    }
    if (!(r.duration >= 3 && r.duration <= 20)) out.push(`round ${n}: Jesus should take 3 to 20 seconds to walk through the picture`)
    if (!(r.pause >= 0.5 && r.pause <= 5)) out.push(`round ${n}: the pause should be 0.5 to 5 seconds`)
    if (!(r.reach >= 3 && r.reach <= 20)) out.push(`round ${n}: the reach should be 3 to 20 units`)
    if (!(r.hemR >= WUNDER_MIN_TAP_R && r.hemR <= 11)) out.push(`round ${n}: the tap circle round the hem should be ${WUNDER_MIN_TAP_R} to 11 units (44 pixels on a phone)`)
    if (!(r.sway >= 0 && r.sway <= 6)) out.push(`round ${n}: the swing should be 0 to 6 percent`)
    r.walkers.forEach((wk, k) => {
      if (!game.people[wk.person]) out.push(`round ${n}: walker ${k + 1} has no picture`)
      if (!(wk.lane >= game.road && wk.lane <= 100)) out.push(`round ${n}: walker ${k + 1} must walk in front of the lane`)
      if (!(wk.dur > 0.5 && wk.at >= 0 && wk.at + wk.dur <= saumCycle(r) + 1e-9)) out.push(`round ${n}: walker ${k + 1} must walk within one passing`)
    })
    const wins = saumWindows(game, r)
    const longest = windowOf(r)
    if (longest < SAUM_MIN_WINDOW) out.push(`round ${n}: the hem is free at the fingers only ${longest.toFixed(2)} seconds (at least ${SAUM_MIN_WINDOW})`)
    if (wins.length && wins[0]![0] < 1) out.push(`round ${n}: the hem reaches the fingers too soon after Jesus comes in (less than a second to see him coming)`)
    if (saumHelpAt(game, r, 0) === null) out.push(`round ${n}: the help finds no moment`)
    else {
      const at = saumHelpAt(game, r, 0)!
      if (saumTap(game, r, at, null) !== 'touch') out.push(`round ${n}: the help does not touch the hem`)
    }
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (windowOf(b!) >= windowOf(a!)) out.push('round 2 should give a shorter moment than round 1')
    if (b!.walkers.length <= a!.walkers.length) out.push('round 2 should have more people walking in front')
    if (saumHiddenAtHand(game, b!) < 0.1) out.push('round 2: the people should hide the hem for a moment while it is at the fingers')
    if (b!.ring) out.push('round 2 should not show the ring')
  }
  return out
}

// ================================================================ 2. along the shore (`ufer`)

/** A rock on the shore: which picture, the middle of the picture (and of the circle the way may not enter), the width of the picture and the radius of that circle (units). */
export interface UferRock {
  rock: number
  x: number
  y: number
  w: number
  r: number
}
/** One round: the hint, the picture of the shore, the water (polygons, percent of the field, measured from the picture), the rocks, where the crowd starts (the village), where the boat lands,
 * and where the boat sails from and to (on the water). */
export interface UferRound {
  hint: string
  background: string
  water: Pt[][]
  rocks: UferRock[]
  start: Pt
  goal: Pt
  boatFrom: Pt
  boatTo: Pt
}
/** The game "Along the shore" (`ufer`): the ratio of the pictures, the rock pictures, the crowd (a group of three), the boat, how wide the way of the crowd is (half of it, units) and the rounds. */
export interface UferGame {
  ratio?: number
  rocks: NeuSprite[]
  crowd: NeuSprite
  boat: NeuSprite
  pad: number
  rounds: UferRound[]
}
/** The start of the way: a tap this near the crowd begins it (units). */
export const UFER_START_R = 8
/** The way is finished this near the landing place (units). */
export const UFER_GOAL_R = 6
/** A lifted finger may go on drawing this near the end of the line (units). */
export const UFER_CONT_R = 8
/** The line is laid in steps of this length (units). */
export const UFER_STEP = 0.7
/** The help draws this much of the way at a time (units). */
export const UFER_HELP_UNITS = 45
/** How much wider than needed the way of the help and the check of the data keep away from rocks and water (units). */
export const UFER_ROOM = 1

/** The point lies inside the polygon (percent of the field). */
export function uferInPoly(p: Pt, poly: readonly Pt[]): boolean {
  let inPoly = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!
    const b = poly[j]!
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inPoly = !inPoly
  }
  return inPoly
}

export const uferInWater = (round: UferRound, p: Pt): boolean => round.water.some((poly) => uferInPoly(p, poly))

export type UferBlock = { kind: 'rock'; index: number } | { kind: 'water' } | { kind: 'edge' }

/** What keeps the crowd from the place `p` (its way is `pad + extra` units wide on each side): a rock, the water, the edge of the picture; null when the place is free. */
export function uferBlock(game: UferGame, round: UferRound, p: Pt, extra = 0): UferBlock | null {
  const ratio = ratioOf(game)
  const pad = game.pad + extra
  if (p.x < 0.5 || p.x > 99.5 || p.y < 0.5 || p.y > 99.5) return { kind: 'edge' }
  const k = round.rocks.findIndex((r) => wunderDist(p, r, ratio) < r.r + pad)
  if (k >= 0) return { kind: 'rock', index: k }
  if (uferInWater(round, p)) return { kind: 'water' }
  for (let a = 0; a < 8; a++) {
    const q = { x: p.x + Math.cos((a * Math.PI) / 4) * pad, y: p.y + Math.sin((a * Math.PI) / 4) * pad * ratio }
    if (uferInWater(round, q)) return { kind: 'water' }
  }
  return null
}

/** The line drawn so far, whether the finger is held up by a rock or the water now (a mistake counts once until the line goes on), and whether it reached the landing place. */
export interface UferState {
  pts: Pt[]
  blocked: boolean
  reached: boolean
}
export const uferStart = (): UferState => ({ pts: [], blocked: false, reached: false })

export type UferBegin = 'start' | 'continue' | 'far' | 'done'

/** The finger comes down at `p`: at the crowd the line begins (at the crowd), at the end of the line it goes on; elsewhere nothing happens. */
export function uferBegin(round: UferRound, st: UferState, p: Pt, ratio = 1.5): { state: UferState; verdict: UferBegin } {
  if (st.reached) return { state: st, verdict: 'done' }
  if (!st.pts.length) {
    if (wunderDist(p, round.start, ratio) <= UFER_START_R) return { state: { pts: [{ ...round.start }], blocked: false, reached: false }, verdict: 'start' }
    return { state: st, verdict: 'far' }
  }
  const last = st.pts[st.pts.length - 1]!
  if (wunderDist(p, last, ratio) <= UFER_CONT_R) return { state: { ...st, blocked: false }, verdict: 'continue' }
  return { state: st, verdict: 'far' }
}

export type UferEvent = { kind: 'rock'; index: number; at: Pt } | { kind: 'water'; at: Pt } | { kind: 'goal' } | null

/**
 * The finger moves to `p`: the line grows from its end toward `p` in small steps. A step into a rock or the water stops the line there (one mistake, until the line can go on again);
 * the edge of the picture only stops it. Near the landing place the line ends there and the way is finished.
 */
export function uferMove(game: UferGame, round: UferRound, st: UferState, p: Pt): { state: UferState; event: UferEvent } {
  if (st.reached || !st.pts.length) return { state: st, event: null }
  const ratio = ratioOf(game)
  const pts = st.pts.slice()
  const last = pts[pts.length - 1]!
  const d = wunderDist(last, p, ratio)
  const n = Math.max(1, Math.ceil(d / UFER_STEP))
  for (let i = 1; i <= n; i++) {
    const s = { x: last.x + ((p.x - last.x) * i) / n, y: last.y + ((p.y - last.y) * i) / n }
    const b = uferBlock(game, round, s)
    if (b) {
      if (b.kind === 'edge') return { state: { ...st, pts, blocked: st.blocked }, event: null }
      const event: UferEvent = st.blocked ? null : b.kind === 'rock' ? { kind: 'rock', index: b.index, at: s } : { kind: 'water', at: s }
      return { state: { pts, blocked: true, reached: false }, event }
    }
    pts.push(s)
    if (wunderDist(s, round.goal, ratio) <= UFER_GOAL_R) {
      pts.push({ ...round.goal })
      return { state: { pts, blocked: false, reached: true }, event: { kind: 'goal' } }
    }
  }
  return { state: { pts, blocked: false, reached: false }, event: null }
}

/** The length of a line (units). */
export function uferLength(pts: readonly Pt[], ratio = 1.5): number {
  let n = 0
  for (let i = 1; i < pts.length; i++) n += wunderDist(pts[i - 1]!, pts[i]!, ratio)
  return n
}

/** The place `d` units along the line (and whether it goes to the left there). */
export function uferAlong(pts: readonly Pt[], d: number, ratio = 1.5): Pt & { left: boolean } {
  if (!pts.length) return { x: 0, y: 0, left: false }
  let rest = Math.max(0, d)
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    const s = wunderDist(a, b, ratio)
    if (rest <= s || i === pts.length - 1) {
      const f = s > 0 ? clamp(rest / s, 0, 1) : 1
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, left: b.x < a.x - 0.01 }
    }
    rest -= s
  }
  const p = pts[pts.length - 1]!
  return { ...p, left: false }
}

/** How far the line has come: the share of the straight distance from the crowd to the landing place that is behind it (0 … 1). */
export function uferShare(round: UferRound, st: UferState, ratio = 1.5): number {
  if (st.reached) return 1
  if (!st.pts.length) return 0
  const full = wunderDist(round.start, round.goal, ratio)
  return clamp(1 - wunderDist(st.pts[st.pts.length - 1]!, round.goal, ratio) / Math.max(1e-6, full), 0, 1)
}

/**
 * A way from `from` to the landing place that keeps `extra` units more room than needed (a grid of one unit, eight directions, the shortest way). Null when there is none.
 * The way begins at the grid cell next to `from` and ends at the landing place.
 */
export function uferRoute(game: UferGame, round: UferRound, from: Pt, extra = UFER_ROOM): Pt[] | null {
  const ratio = ratioOf(game)
  const cols = 101
  const rows = Math.floor(100 / ratio) + 1
  const at = (c: number, r: number): Pt => ({ x: c, y: r * ratio })
  const free = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) free[r * cols + c] = uferBlock(game, round, at(c, r), extra) ? 0 : 1
  const cell = (p: Pt): number => {
    let best = -1
    let bd = Infinity
    const c0 = Math.round(p.x)
    const r0 = Math.round(p.y / ratio)
    for (let r = r0 - 3; r <= r0 + 3; r++)
      for (let c = c0 - 3; c <= c0 + 3; c++) {
        if (r < 0 || c < 0 || r >= rows || c >= cols || !free[r * cols + c]) continue
        const d = wunderDist(at(c, r), p, ratio)
        if (d < bd) {
          bd = d
          best = r * cols + c
        }
      }
    return best
  }
  const s = cell(from)
  const g = cell(round.goal)
  if (s < 0 || g < 0) return null
  const dist = new Float64Array(cols * rows).fill(Infinity)
  const prev = new Int32Array(cols * rows).fill(-1)
  // a small binary heap of [distance, cell]
  const heap: [number, number][] = []
  const push = (e: [number, number]) => {
    heap.push(e)
    let i = heap.length - 1
    while (i > 0) {
      const pi = (i - 1) >> 1
      if (heap[pi]![0] <= heap[i]![0]) break
      ;[heap[pi], heap[i]] = [heap[i]!, heap[pi]!]
      i = pi
    }
  }
  const pop = (): [number, number] => {
    const top = heap[0]!
    const end = heap.pop()!
    if (heap.length) {
      heap[0] = end
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const rr = l + 1
        let m = i
        if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l
        if (rr < heap.length && heap[rr]![0] < heap[m]![0]) m = rr
        if (m === i) break
        ;[heap[m], heap[i]] = [heap[i]!, heap[m]!]
        i = m
      }
    }
    return top
  }
  dist[s] = 0
  push([0, s])
  const steps: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]]
  while (heap.length) {
    const [d, u] = pop()
    if (d > dist[u]!) continue
    if (u === g) break
    const uc = u % cols
    const ur = (u - uc) / cols
    for (const [dc, dr, w] of steps) {
      const c = uc + dc
      const r = ur + dr
      if (r < 0 || c < 0 || r >= rows || c >= cols) continue
      const v = r * cols + c
      if (!free[v]) continue
      if (dc && dr && (!free[ur * cols + c] || !free[r * cols + uc])) continue // no cutting of corners
      const nd = d + w
      if (nd < dist[v]!) {
        dist[v] = nd
        prev[v] = u
        push([nd, v])
      }
    }
  }
  if (!Number.isFinite(dist[g]!)) return null
  const out: Pt[] = []
  for (let v = g; v >= 0; v = prev[v]!) {
    const c = v % cols
    out.push(at(c, (v - c) / cols))
    if (v === s) break
  }
  out.reverse()
  out.push({ ...round.goal })
  return out
}

/** The piece of the way the button "Help me" draws: from the end of the line (or the crowd) about `units` units along a safe way. Null when there is no way. */
export function uferHelpRoute(game: UferGame, round: UferRound, st: UferState, units = UFER_HELP_UNITS): Pt[] | null {
  const from = st.pts.length ? st.pts[st.pts.length - 1]! : round.start
  const route = uferRoute(game, round, from)
  if (!route) return null
  const ratio = ratioOf(game)
  const out: Pt[] = []
  let n = 0
  for (let i = 0; i < route.length; i++) {
    if (i > 0) n += wunderDist(route[i - 1]!, route[i]!, ratio)
    out.push(route[i]!)
    if (n >= units) break
  }
  return out
}

/** The straight line from the crowd to the landing place runs through a rock or the water (otherwise there is nothing to draw round). */
export function uferStraightBlocked(game: UferGame, round: UferRound): boolean {
  for (let i = 0; i <= 200; i++) {
    const p = { x: round.start.x + ((round.goal.x - round.start.x) * i) / 200, y: round.start.y + ((round.goal.y - round.start.y) * i) / 200 }
    if (uferBlock(game, round, p)) return true
  }
  return false
}

/** Lets the help draw a round from the start to the end (piece by piece, as the button does); returns the mistakes it made and whether it arrived. */
export function uferSimulate(game: UferGame, round: UferRound): { mistakes: number; arrived: boolean; length: number } {
  let st = uferBegin(round, uferStart(), round.start, ratioOf(game)).state
  let mistakes = 0
  for (let piece = 0; piece < 20 && !st.reached; piece++) {
    const route = uferHelpRoute(game, round, st)
    if (!route) break
    for (const p of route) {
      const r = uferMove(game, round, st, p)
      st = r.state
      if (r.event && r.event.kind !== 'goal') mistakes++
      if (st.reached) break
    }
  }
  return { mistakes, arrived: st.reached, length: uferLength(st.pts, ratioOf(game)) }
}

/** The problems of the data of `ufer` (an empty list is good). */
export function uferProblems(game: UferGame): string[] {
  const out: string[] = []
  const ratio = ratioOf(game)
  if (!game.rocks.length) out.push('no pictures of rocks')
  game.rocks.forEach((s, i) => {
    if (!s.image) out.push(`rock picture ${i + 1} is missing`)
  })
  if (!game.crowd?.image) out.push('no picture of the crowd')
  else if (!(game.crowd.w >= 12 && game.crowd.w <= 30)) out.push(`the crowd should be 12 to 30 percent wide (it is ${game.crowd.w}; about 44 pixels on a phone)`)
  if (!game.boat?.image) out.push('no picture of the boat')
  else if (!(game.boat.w >= 12 && game.boat.w <= 35)) out.push(`the boat should be 12 to 35 percent wide (it is ${game.boat.w})`)
  if (!(game.pad >= 1 && game.pad <= 5)) out.push('the way should be 1 to 5 units wide on each side')
  if (game.rounds.length < 1) out.push('no rounds')
  const lengths: number[] = []
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.background) out.push(`round ${n}: no picture of the shore`)
    if (!r.water.length || r.water.some((p) => p.length < 3)) out.push(`round ${n}: the water is missing`)
    if (!inside(r.start) || !inside(r.goal)) out.push(`round ${n}: the crowd or the landing place lies outside the picture`)
    if (!(r.start.x <= 30)) out.push(`round ${n}: the crowd should start at the left (x at most 30)`)
    if (!(r.goal.x >= 70)) out.push(`round ${n}: the landing place should be at the right (x at least 70)`)
    if (uferBlock(game, r, r.start, UFER_ROOM)) out.push(`round ${n}: the crowd stands on a rock or in the water`)
    if (uferBlock(game, r, r.goal)) out.push(`round ${n}: the landing place lies on a rock or in the water`)
    if (!uferInWater(r, r.boatFrom) || !uferInWater(r, r.boatTo)) out.push(`round ${n}: the boat must sail on the water`)
    r.rocks.forEach((k, j) => {
      if (!game.rocks[k.rock]) out.push(`round ${n}: rock ${j + 1} has no picture`)
      if (!(k.w >= 10 && k.w <= 30)) out.push(`round ${n}: rock ${j + 1} should be 10 to 30 percent wide (it is ${k.w})`)
      if (!(k.r >= k.w * 0.25 && k.r <= k.w * 0.6)) out.push(`round ${n}: the circle of rock ${j + 1} does not fit its picture`)
      if (!inside(k)) out.push(`round ${n}: rock ${j + 1} lies outside the picture`)
      if (wunderDist(k, r.start, ratio) < k.r + game.pad + UFER_START_R * 0.6) out.push(`round ${n}: rock ${j + 1} lies on the crowd`)
      if (wunderDist(k, r.goal, ratio) < k.r + game.pad + UFER_GOAL_R) out.push(`round ${n}: rock ${j + 1} lies on the landing place`)
    })
    if (!uferStraightBlocked(game, r)) out.push(`round ${n}: the straight way is free (nothing to draw round)`)
    const route = uferRoute(game, r, r.start, UFER_ROOM)
    if (!route) out.push(`round ${n}: there is no way wide enough from the crowd to the landing place`)
    else lengths.push(uferLength(route, ratio))
    const sim = uferSimulate(game, r)
    if (!sim.arrived) out.push(`round ${n}: the help does not reach the landing place`)
    if (sim.mistakes > 0) out.push(`round ${n}: even the help runs into rocks or water ${sim.mistakes} times`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.rocks.length <= a!.rocks.length) out.push('round 2 should have more rocks than round 1')
    if (lengths.length === 2 && lengths[1]! <= lengths[0]!) out.push('round 2 should need a longer way than round 1')
  }
  return out
}
