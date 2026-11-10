/**
 * The pure parts of the two new games of the stages 11 and 12 of "Geschichten von Jesus" (rebuild of 10.11.2026; the components only show and listen):
 * 1. "Where does the house stand safely?" (`baugrund`, Matthew 7,24-27): the child knocks on the ground of the building plots (rock rings hard, sand is soft), sets the house where the ground is firm,
 *    and then rain, water and wind come, in the order of the Bible. The house on the rock stands; on the sand it sinks in slowly (and returns to its tray: a mistake).
 * 2. "Come, all things are ready!" (`einladen`, Luke 14,17.21-23): guests wave from doors, gates and behind hedges; a tap on a waving guest invites him, he hops to his place at the long table, a lamp over
 *    the place lights up. Nothing can be lost: a guest that is not tapped goes away and comes back at another place after a while. Twelve places make the house full.
 * Places are percent of the picture: x of the width, y of the height. Times are milliseconds. Nothing here has a clock or dice of its own: the component feeds time in, the rest is arithmetic.
 */
import { neuDist } from './gleichnisseNeu'
import type { NeuSprite, Pt } from './gleichnisseNeu'
import { osterStars } from './osternGames'

export type { NeuSprite, Pt } from './gleichnisseNeu'

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

// ================================================================ 1. where does the house stand safely? (`baugrund`)

/** What lies under a building plot: rock (firm) or sand (soft). */
export type GroundKind = 'rock' | 'sand'
/**
 * A building plot: its name, the middle of its foot (percent of the picture), its width (percent of the width), what is under it and whether the rock is hidden under a thin layer of sand
 * (it then looks almost like a plot of sand: the picture `covered`).
 */
export interface GroundPlot {
  id: string
  x: number
  y: number
  w: number
  ground: GroundKind
  hidden?: boolean
}
/**
 * One round: the hint, the plots, how many knocks the child has (none given = as many as it likes) and whether the result of a knock stays at the plot as a sign
 * (round 1; in round 2 it is only a sound, a movement and a word).
 */
export interface GroundRound {
  hint: string
  plots: GroundPlot[]
  knocks?: number
  mark: boolean
}
/**
 * The game `baugrund`: the quiet valley (3:2) without houses, the tray of the house (the middle of its foot, and the width of the frame of the tray), the pictures (plot of rock, of sand, of rock under sand,
 * the house, the same house tilted into the sand, the mallet, the dust, the sparks, the rain over the whole picture, the water along the lower edge, the wind) and the rounds.
 */
export interface GroundGame {
  background: string
  ratio?: number
  tray: Pt & { w: number }
  sprites: {
    rock: NeuSprite
    sand: NeuSprite
    covered: NeuSprite
    house: NeuSprite
    tilted: NeuSprite
    mallet: NeuSprite
    puff: NeuSprite
    spark: NeuSprite
    rain: NeuSprite
    water: NeuSprite
    wind: NeuSprite
  }
  rounds: GroundRound[]
}

/** The proportions of the pictures (height / width) as they are painted: plots 360 x 200, house 320 x 300, rain 3:2, water 1500 x 304, wind 1500 x 600. */
export const GROUND_ASPECT = { plot: 200 / 360, house: 300 / 320, water: 304 / 1500, wind: 600 / 1500 } as const
/** How far above the foot of a plot (share of its height) the foot of the house stands: the house stands on the middle of the oval (measured on the painted plots 360 x 200: the oval lies in rows 78 to 190, its middle 33 percent above the lower edge). */
export const GROUND_HOUSE_LIFT = 0.32
/** The weather, in the order of the Bible (Matthew 7,25): rain, water, wind; each is shown this long (milliseconds). */
export const GROUND_WEATHER = ['rain', 'water', 'wind'] as const
export const GROUND_WEATHER_MS = 1700
/** How long the tilted house sinks before it goes back to the tray (milliseconds). */
export const GROUND_SINK_MS = 2200
/** The narrowest plot that can still be tapped on a phone (12 % of a field 360 pixels wide are 43 pixels; the button has at least 44 pixels). */
export const GROUND_MIN_W = 12
/** What a plot looks like: rock, sand, or rock under a thin layer of sand. */
export type GroundLook = 'rock' | 'sand' | 'covered'

/** The height of a plot in percent of the height of the picture. */
export const groundPlotH = (p: GroundPlot, ratio = 1.5): number => p.w * GROUND_ASPECT.plot * ratio
/** The height of the house in percent of the height of the picture. */
export const groundHouseH = (game: GroundGame): number => game.sprites.house.w * GROUND_ASPECT.house * (game.ratio ?? 1.5)

/** How a plot looks: rock looks like rock, unless it is hidden under sand; sand looks like sand. */
export const groundLook = (p: GroundPlot): GroundLook => (p.ground === 'sand' ? 'sand' : p.hidden ? 'covered' : 'rock')

/** The place where the foot of the house stands on a plot. */
export const groundHouseAt = (p: GroundPlot, ratio = 1.5): Pt => ({ x: p.x, y: p.y - groundPlotH(p, ratio) * GROUND_HOUSE_LIFT })

export type GroundKnock = { kind: 'hard' } | { kind: 'soft' } | { kind: 'none' }
/** What a knock on plot `i` says: the rock rings hard, the sand is soft. */
export function groundKnock(round: GroundRound, i: number): GroundKnock {
  const p = round.plots[i]
  if (!p) return { kind: 'none' }
  return p.ground === 'rock' ? { kind: 'hard' } : { kind: 'soft' }
}

export type GroundVerdict = { kind: 'firm' } | { kind: 'sinks' } | { kind: 'none' }
/** What happens to the house on plot `i` after rain, water and wind: on the rock it stands, on the sand it sinks in. */
export function groundBuild(round: GroundRound, i: number): GroundVerdict {
  const p = round.plots[i]
  if (!p) return { kind: 'none' }
  return p.ground === 'rock' ? { kind: 'firm' } : { kind: 'sinks' }
}

/** The knocks that are left in a round (null = as many as it likes). */
export const groundKnocksLeft = (round: GroundRound, used: number): number | null => (round.knocks === undefined ? null : Math.max(0, round.knocks - used))

/** The plot the button "Help me" shows: a rock plot that has not been built on yet (the first one in the list). Null when none is left. */
export function groundHint(round: GroundRound, failed: readonly number[]): number | null {
  const i = round.plots.findIndex((p, k) => p.ground === 'rock' && !failed.includes(k))
  return i >= 0 ? i : null
}

/** The stars: mistakes (builds on sand) as in the other games; with help at most two. */
export const groundStars = (mistakes: number, helped: boolean): number => Math.min(helped ? 2 : 3, osterStars(mistakes))

/** The rectangle a plot takes (percent of the width; the height is also given in units of the width). */
function plotBox(p: GroundPlot, ratio: number) {
  const h = (p.w * GROUND_ASPECT.plot) // in units of the width
  return { l: p.x - p.w / 2, r: p.x + p.w / 2, t: p.y / ratio - h, b: p.y / ratio }
}
const overlap = (a: ReturnType<typeof plotBox>, b: ReturnType<typeof plotBox>, gap = 0): boolean => a.l < b.r + gap && b.l < a.r + gap && a.t < b.b + gap && b.t < a.b + gap

/** The problems of the data of `baugrund` (an empty list is good). */
export function groundProblems(game: GroundGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the valley')
  for (const [k, s] of Object.entries(game.sprites)) if (!s?.image) out.push(`no picture of "${k}"`)
  if (!(game.sprites.house.w >= 12 && game.sprites.house.w <= 30)) out.push('the house should be 12 to 30 percent wide')
  const tray = game.tray
  if (!tray || ![tray.x, tray.y, tray.w].every(finite)) out.push('the tray is missing')
  else {
    const hh = groundHouseH(game)
    if (tray.x - tray.w / 2 < 0 || tray.x + tray.w / 2 > 100 || tray.y > 100 || tray.y - hh < 0) out.push('the tray with the house lies outside the picture')
    if (tray.w < game.sprites.house.w) out.push('the frame of the tray is narrower than the house')
  }
  if (game.rounds.length < 1) out.push('no rounds')
  const trayBox = tray && finite(tray.x) ? { l: tray.x - tray.w / 2, r: tray.x + tray.w / 2, t: tray.y / ratio - (groundHouseH(game) / ratio), b: tray.y / ratio } : null
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (r.plots.length < 3) out.push(`round ${n}: fewer than three plots`)
    const rocks = r.plots.filter((p) => p.ground === 'rock').length
    if (rocks < 1) out.push(`round ${n}: no plot of rock (the round could not be won)`)
    if (rocks > r.plots.length - 2) out.push(`round ${n}: too many plots of rock (at most ${r.plots.length - 2})`)
    if (new Set(r.plots.map((p) => p.id)).size !== r.plots.length) out.push(`round ${n}: two plots have the same name`)
    if (r.knocks !== undefined) {
      if (!(Number.isInteger(r.knocks) && r.knocks >= 2 && r.knocks <= r.plots.length - 1)) out.push(`round ${n}: the knocks should be 2 to ${r.plots.length - 1} (they are ${r.knocks})`)
      if (r.mark) out.push(`round ${n}: with a few knocks the result must not stay at the plot as a sign`)
      for (const p of r.plots) if (p.ground === 'rock' && !p.hidden) out.push(`round ${n}: the rock of plot "${p.id}" must be hidden under sand (it would give the answer away)`)
    } else {
      for (const p of r.plots) if (p.hidden) out.push(`round ${n}: plot "${p.id}" is hidden but the round has unlimited knocks`)
    }
    r.plots.forEach((p, i) => {
      if (![p.x, p.y, p.w].every(finite)) {
        out.push(`round ${n}: plot ${i + 1} has a missing number`)
        return
      }
      if (p.w < GROUND_MIN_W || p.w > 26) out.push(`round ${n}: plot ${i + 1} should be ${GROUND_MIN_W} to 26 percent wide (it is ${p.w})`)
      const ph = groundPlotH(p, ratio)
      if (p.x - p.w / 2 < 0 || p.x + p.w / 2 > 100 || p.y > 100.01 || p.y - ph < 0) out.push(`round ${n}: plot ${i + 1} lies outside the picture`)
      const hAt = groundHouseAt(p, ratio)
      if (hAt.x - game.sprites.house.w / 2 < -0.01 || hAt.x + game.sprites.house.w / 2 > 100.01 || hAt.y - groundHouseH(game) < -0.01) out.push(`round ${n}: the house on plot ${i + 1} would lie outside the picture`)
      if (trayBox && overlap(plotBox(p, ratio), trayBox)) out.push(`round ${n}: plot ${i + 1} lies on the tray of the house`)
      r.plots.forEach((o, k) => {
        if (k <= i) return
        if (![o.x, o.y, o.w].every(finite)) return
        if (overlap(plotBox(p, ratio), plotBox(o, ratio), 0.4)) out.push(`round ${n}: plots ${i + 1} and ${k + 1} lie on top of each other`)
      })
    })
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.plots.length <= a!.plots.length) out.push('round 2 should have more plots than round 1')
    if (b!.knocks === undefined) out.push('round 2 should limit the knocks')
    if (a!.knocks !== undefined) out.push('round 1 should have as many knocks as the child likes')
    if (!a!.mark || b!.mark) out.push('round 1 should leave a sign at the plot, round 2 not')
    // no learning by heart: a rock of round 2 does not lie where the rock of round 1 lay
    for (const pb of b!.plots.filter((p) => p.ground === 'rock'))
      for (const pa of a!.plots.filter((p) => p.ground === 'rock'))
        if (neuDist(pa, pb, ratio) < Math.max(pa.w, pb.w) * 0.8) out.push(`round 2: the rock "${pb.id}" lies where the rock of round 1 lay`)
  }
  return out
}

// ================================================================ 2. come, all things are ready! (`einladen`)

/** A guest: the picture of him waving, sitting at the table, and how many places he takes (a mother with her child take two). */
export interface InviteGuestSprite {
  wait: NeuSprite
  sit: NeuSprite
  seats: 1 | 2
}
/** A place where a guest can wave: the middle of his foot (percent of the picture) and what stands in front of him ('hedge' or 'fence', for guests that are `hidden`). */
export interface InviteSpot {
  x: number
  y: number
  cover?: 'hedge' | 'fence'
}
/** A guest of a round: his picture (a key of `sprites`), the place where he first waves and whether he stands behind a hedge or a fence. */
export interface InviteGuest {
  sprite: string
  spot: number
  hidden?: boolean
}
/**
 * One round: the hint, the picture of the place, the places, the guests, how long a guest waves (`show`) and how long he stays away before he comes back (`gap`), how many wave at once
 * (milliseconds).
 */
export interface InviteRound {
  hint: string
  scene: string
  spots: InviteSpot[]
  guests: InviteGuest[]
  show: number
  gap: number
  atOnce: number
}
/**
 * The game `einladen`: the twelve places at the table (the middle of the foot of a seated guest), the band of the long table (middle of its foot and width), the guests (by name), the servant at the gate
 * (middle of his foot), the lamp over every place (unlit / lit, and the height of its middle), hedge and fence for the guests behind them, and the rounds.
 */
export interface InviteGame {
  tableSeats: Pt[]
  table: NeuSprite & Pt
  sprites: Record<string, InviteGuestSprite>
  servant: NeuSprite & Pt
  lamp: { off: NeuSprite; on: NeuSprite; y: number }
  hedge: NeuSprite
  fence: NeuSprite
  ratio?: number
  rounds: InviteRound[]
}

/** The proportions of the pictures (height / width): guest standing 200 x 330, pair 260 x 330, lamp 80 x 120, hedge and fence 400 x 200. */
export const INVITE_ASPECT = { guest: 330 / 200, guestSit: 260 / 200, lamp: 120 / 80, cover: 0.5, servant: 1.5 } as const
/** The fewest milliseconds a guest must be seen (children need time to find him). */
export const INVITE_MIN_SHOW = 3000
/** The fewest percent two places of a round lie apart (so that two guests do not stand on each other). */
export const INVITE_MIN_SPOT_GAP = 14
/** The first guest comes after this long (milliseconds). */
export const INVITE_FIRST = 400

export type InvitePhase = 'away' | 'waving' | 'seated'
export interface InviteGuestState {
  phase: InvitePhase
  /** the place where he waves (or will wave) */
  spot: number
  /** away: from this time he may come back; waving: when he came */
  at: number
  /** seated: the first of his places at the table (0-based) */
  seat: number
}
export interface InviteState {
  time: number
  guests: InviteGuestState[]
  /** the guest that the help keeps waving until he is tapped */
  pinned: number | null
  /** the first free place at the table */
  nextSeat: number
}

/** The state at the start of a round; `firstSeat` is the first place that is still free (round 2 goes on after round 1). */
export function inviteStart(round: InviteRound, firstSeat = 0): InviteState {
  const stagger = Math.max(1, Math.round(round.show / Math.max(1, round.atOnce)))
  return {
    time: 0,
    guests: round.guests.map((g, k) => ({ phase: 'away', spot: g.spot, at: INVITE_FIRST + k * stagger, seat: -1 })),
    pinned: null,
    nextSeat: firstSeat
  }
}

/** How many places the guests of the round take together. */
export const inviteSeatsOf = (game: InviteGame, round: InviteRound): number => round.guests.reduce((n, g) => n + (game.sprites[g.sprite]?.seats ?? 1), 0)

/** The places of the table that a seated guest takes (one or two). */
export const inviteSeatList = (game: InviteGame, round: InviteRound, st: InviteState, i: number): number[] => {
  const g = st.guests[i]
  if (!g || g.phase !== 'seated') return []
  const n = game.sprites[round.guests[i]!.sprite]?.seats ?? 1
  return n === 2 ? [g.seat, g.seat + 1] : [g.seat]
}

/** The middle of the foot of a seated guest: the one place, or the middle between his two places. */
export function inviteSeatAt(game: InviteGame, round: InviteRound, st: InviteState, i: number): Pt | null {
  const seats = inviteSeatList(game, round, st, i)
  if (!seats.length) return null
  const pts = seats.map((s) => game.tableSeats[s]).filter((p): p is Pt => !!p)
  if (!pts.length) return null
  return { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length }
}

const wavingCount = (st: InviteState): number => st.guests.filter((g) => g.phase === 'waving').length
const spotFree = (st: InviteState, spot: number, except = -1): boolean => !st.guests.some((g, k) => k !== except && g.phase === 'waving' && g.spot === spot)

/** The next place for a guest that comes back: the one after the place where he waved. */
const nextSpot = (round: InviteRound, spot: number): number => (spot + 1) % round.spots.length

/**
 * `dt` milliseconds go by: a guest that has waved long enough goes away (unless the help keeps him), a guest that is away comes back at his place, or at the next free one, when there are fewer than
 * `atOnce` waving. With `stay` (less motion) nobody goes away until he is tapped. Returns a new state.
 */
export function inviteStep(round: InviteRound, st: InviteState, dt: number, stay = false): InviteState {
  const next: InviteState = { ...st, time: st.time + dt, guests: st.guests.map((g) => ({ ...g })) }
  const t = next.time
  if (!stay)
    next.guests.forEach((g, k) => {
      if (g.phase === 'waving' && t - g.at >= round.show && next.pinned !== k) {
        g.phase = 'away'
        g.spot = nextSpot(round, g.spot)
        g.at = t + round.gap
      }
    })
  next.guests.forEach((g, k) => {
    if (g.phase !== 'away' || g.at > t) return
    if (wavingCount(next) >= round.atOnce && next.pinned !== k) return
    for (let tries = 0; tries < round.spots.length; tries++) {
      const spot = (g.spot + tries) % round.spots.length
      if (spotFree(next, spot, k)) {
        g.phase = 'waving'
        g.spot = spot
        g.at = t
        return
      }
    }
  })
  return next
}

export type InviteTapResult = { state: InviteState; invited: boolean; seat: number }
/** A tap on guest `i`: when he waves, he is invited and takes the next place (two for a pair). */
export function inviteTap(game: InviteGame, round: InviteRound, st: InviteState, i: number): InviteTapResult {
  const g = st.guests[i]
  if (!g || g.phase !== 'waving') return { state: st, invited: false, seat: -1 }
  const seats = game.sprites[round.guests[i]!.sprite]?.seats ?? 1
  const next: InviteState = { ...st, guests: st.guests.map((x) => ({ ...x })), nextSeat: st.nextSeat + seats, pinned: st.pinned === i ? null : st.pinned }
  next.guests[i] = { ...g, phase: 'seated', seat: st.nextSeat }
  return { state: next, invited: true, seat: st.nextSeat }
}

/** The guest that has waved the longest (the next one the keys and the help go to); null when nobody waves. */
export function inviteFirstWaving(st: InviteState): number | null {
  let best: number | null = null
  st.guests.forEach((g, k) => {
    if (g.phase === 'waving' && (best === null || g.at < st.guests[best]!.at)) best = k
  })
  return best
}

/**
 * The button "Help me": the guest that waves the longest is kept waving until he is tapped; when nobody waves just now, the guest that comes next is called at once.
 * Returns the new state and the guest (null when everybody sits).
 */
export function inviteHelp(round: InviteRound, st: InviteState): { state: InviteState; guest: number | null } {
  const waving = inviteFirstWaving(st)
  if (waving !== null) return { state: { ...st, pinned: waving }, guest: waving }
  let k = -1
  st.guests.forEach((g, i) => {
    if (g.phase === 'away' && (k < 0 || g.at < st.guests[k]!.at)) k = i
  })
  if (k < 0) return { state: st, guest: null }
  const guests = st.guests.map((g) => ({ ...g }))
  guests[k]!.at = Math.min(guests[k]!.at, st.time)
  const out = inviteStep(round, { ...st, guests, pinned: k }, 0)
  return { state: out, guest: k }
}

/** Everybody of the round sits at the table. */
export const inviteDone = (st: InviteState): boolean => st.guests.length > 0 && st.guests.every((g) => g.phase === 'seated')

/** The places of the table that are free after the guests have taken the first `nextSeat`. */
export const inviteFree = (game: InviteGame, nextSeat: number): number => Math.max(0, game.tableSeats.length - nextSeat)

/** Simulates a child that taps every guest as soon as he waves (for the check of the data); returns the time at which everybody sits and the most that waved at once. */
export function inviteSimulate(game: InviteGame, round: InviteRound, firstSeat = 0): { ms: number; peak: number; done: boolean } {
  let st = inviteStart(round, firstSeat)
  let peak = 0
  for (let t = 0; t < 120000; t += 100) {
    st = inviteStep(round, st, 100)
    peak = Math.max(peak, wavingCount(st))
    const w = inviteFirstWaving(st)
    if (w !== null) st = inviteTap(game, round, st, w).state
    if (inviteDone(st)) return { ms: t, peak, done: true }
  }
  return { ms: 120000, peak, done: false }
}

/** The stars of `einladen`: nothing can go wrong; with help at most two. */
export const inviteStars = (helped: boolean): number => (helped ? 2 : 3)

/** The problems of the data of `einladen` (an empty list is good). */
export function inviteProblems(game: InviteGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (game.tableSeats.length !== 12) out.push(`the table needs twelve places (it has ${game.tableSeats.length})`)
  game.tableSeats.forEach((s, i) => {
    if (![s.x, s.y].every(finite) || s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100) out.push(`place ${i + 1} lies outside the picture`)
  })
  for (let i = 1; i < game.tableSeats.length; i++) if (!(game.tableSeats[i]!.x > game.tableSeats[i - 1]!.x)) out.push(`place ${i + 1} should lie to the right of place ${i}`)
  if (!game.table?.image) out.push('no picture of the table')
  if (!game.servant?.image) out.push('no picture of the servant')
  if (![game.servant?.x, game.servant?.y, game.servant?.w].every(finite)) out.push('the servant has no place')
  if (!game.lamp?.off?.image || !game.lamp?.on?.image) out.push('the lamp needs two pictures (unlit and lit)')
  else if (!finite(game.lamp.y) || game.lamp.y < 0 || game.lamp.y > 100) out.push('the lamp hangs outside the picture')
  if (!game.hedge?.image) out.push('no picture of the hedge')
  if (!game.fence?.image) out.push('no picture of the fence')
  const names = Object.keys(game.sprites)
  for (const k of names) {
    const s = game.sprites[k]!
    if (!s.wait?.image || !s.sit?.image) out.push(`guest "${k}" needs a picture waving and a picture sitting`)
    else {
      if (!(s.wait.w >= 9 && s.wait.w <= 30)) out.push(`guest "${k}" should be 9 to 30 percent wide waving (it is ${s.wait.w})`)
      if (!(s.sit.w >= 7 && s.sit.w <= 30)) out.push(`guest "${k}" should be 7 to 30 percent wide sitting (it is ${s.sit.w})`)
    }
    if (s.seats !== 1 && s.seats !== 2) out.push(`guest "${k}" takes ${s.seats} places (one or two)`)
  }
  if (game.rounds.length < 1) out.push('no rounds')
  const used = new Map<string, number>()
  let total = 0
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.scene) out.push(`round ${n}: no picture of the place`)
    if (r.guests.length < 1) out.push(`round ${n}: no guests`)
    if (!(r.show >= INVITE_MIN_SHOW)) out.push(`round ${n}: a guest must wave at least ${INVITE_MIN_SHOW} milliseconds (it is ${r.show})`)
    if (!(r.gap >= 500)) out.push(`round ${n}: the guests should stay away at least 500 milliseconds`)
    if (!(Number.isInteger(r.atOnce) && r.atOnce >= 1 && r.atOnce <= r.spots.length)) out.push(`round ${n}: at once should be 1 to ${r.spots.length}`)
    r.spots.forEach((s, i) => {
      if (![s.x, s.y].every(finite) || s.x < 0 || s.x > 100 || s.y < 0 || s.y > 100) out.push(`round ${n}: place ${i + 1} lies outside the picture`)
      r.spots.forEach((o, k) => {
        if (k <= i || ![o.x, o.y].every(finite)) return
        if (neuDist(s, o, ratio) < INVITE_MIN_SPOT_GAP) out.push(`round ${n}: places ${i + 1} and ${k + 1} lie less than ${INVITE_MIN_SPOT_GAP} percent apart`)
      })
    })
    r.guests.forEach((g, i) => {
      const sp = game.sprites[g.sprite]
      if (!sp) {
        out.push(`round ${n}: guest ${i + 1} ("${g.sprite}") has no pictures`)
        return
      }
      used.set(g.sprite, (used.get(g.sprite) ?? 0) + 1)
      total += sp.seats
      if (!(Number.isInteger(g.spot) && g.spot >= 0 && g.spot < r.spots.length)) out.push(`round ${n}: guest ${i + 1} waves at a place that is not there`)
      else {
        const s = r.spots[g.spot]!
        const h = sp.wait.w * INVITE_ASPECT.guest * ratio
        if (s.x - sp.wait.w / 2 < -0.01 || s.x + sp.wait.w / 2 > 100.01 || s.y > 100.01 || s.y - h < -0.01) out.push(`round ${n}: guest ${i + 1} would stand outside the picture`)
      }
      if (g.hidden && r.spots.some((s) => !s.cover)) out.push(`round ${n}: guest ${i + 1} stands behind a hedge or a fence but not every place has one`)
    })
    // the places of the table are taken by round 1, then round 2: the guests of the rounds take the places that follow
  })
  for (const [k, c] of used) if (c > 1) out.push(`guest "${k}" comes ${c} times (everybody sits only once)`)
  if (total !== game.tableSeats.length) out.push(`the guests of all rounds take ${total} places, the table has ${game.tableSeats.length}`)
  if (game.rounds.length >= 1 && inviteSeatsOf(game, game.rounds[0]!) >= game.tableSeats.length) out.push('round 1 should leave places free (the house is not full yet)')
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.show >= a!.show) out.push('round 2 should let the guests wave for a shorter time than round 1')
    if (b!.atOnce < a!.atOnce) out.push('round 2 should have at least as many waving at once as round 1')
    if (!b!.guests.some((g) => g.hidden)) out.push('round 2 should have guests behind a hedge or a fence')
    if (a!.guests.some((g) => g.hidden)) out.push('round 1 should have no guests behind a hedge or a fence')
  }
  // every round can be won by a child that taps in time
  let seat = 0
  for (const r of game.rounds) {
    if (!r.spots.length || !r.guests.length) break
    const sim = inviteSimulate(game, r, seat)
    if (!sim.done) out.push('a round cannot be finished (the guests do not come)')
    else if (sim.peak > r.atOnce) out.push(`a round lets ${sim.peak} guests wave at once (more than ${r.atOnce})`)
    seat += inviteSeatsOf(game, r)
  }
  return out
}
