/**
 * The pure parts of three new games of "Paulus" (no. 31 "Vom Verfolger zum Boten", id `paulus`; the components only show and listen):
 * "Through the streets" (`gerade`, field `straightStreet`, Acts 9,11.17: Ananias goes lane by lane across the busy streets of Damascus to the house of Judas),
 * "Find Saul again" (`wiederfinden`, field `refind`, Acts 11,25-26: remember Saul and tap him among people who look like him) and
 * "Set the sail" (`segel`, field `sailTrim`, Acts 13,4: turn the sail after the changing wind until the ship reaches Cyprus).
 * All places are percent of the field, angles are degrees (clockwise, 0 = up on the screen), times are milliseconds; the arithmetic has no clock of its own and no dice.
 */

// ================================================================ 1. through the streets (`gerade`)

/** Something that goes across a lane: a donkey with its driver, a camel, an ox cart, two carriers, a little flock; the picture faces right, `w` its width (percent of the field). */
export interface StreetThing {
  id: string
  image: string
  w: number
  /** The share of the picture width that is really painted (the rest is empty room round the figure); things touch Ananias only with this part. 1 when not given. */
  core?: number
}
/**
 * A lane (a cross street, or a lane of the Straight street): `y` the line the feet stand on (percent of the height), `dir` 1 to the right or -1 to the left,
 * `speed` percent of the width a second, the things one after the other and the free room `gap` behind every one (percent of the width), `offset` where the row begins.
 */
export interface StreetLane {
  y: number
  dir: 1 | -1
  speed: number
  items: string[]
  gap: number
  offset?: number
}
/** A round: the hint, the lanes and the quiet strips between them (house doors, the well, the colonnade; also the start below and the door of Judas at the top). */
export interface StreetRound {
  hint: string
  lanes: StreetLane[]
  safe: number[]
}
/**
 * The game "Through the streets" (`gerade`): Damascus from above at a slant (3:4), the things on the lanes, Ananias standing and walking (from behind),
 * the soft light spot for "Help me", the picture at the end (in the house of Judas Ananias lays his hands on Saul, who sees again),
 * how wide Ananias is and where he walks (percent of the width), how long one step takes (ms) and the rounds.
 */
export interface StreetGame {
  city: string
  things: StreetThing[]
  walker: { stand: string; walk: string }
  walkerW: number
  /** The share of the width of the picture of Ananias that is painted (1 when not given). */
  walkerCore?: number
  walkerX: number
  gapLight: string
  finale: string
  stepMs: number
  rounds: StreetRound[]
}

/** A place Ananias can stand on: a quiet strip or a lane (index into `lanes`). */
export type StreetRow = { kind: 'safe'; y: number } | { kind: 'lane'; y: number; lane: number }

/** The places from the bottom (the start) to the top (the door of Judas). */
export function streetRows(round: Pick<StreetRound, 'lanes' | 'safe'>): StreetRow[] {
  const rows: StreetRow[] = [...round.safe.map((y) => ({ kind: 'safe' as const, y })), ...round.lanes.map((l, lane) => ({ kind: 'lane' as const, y: l.y, lane }))]
  return rows.sort((a, b) => b.y - a.y)
}

const thingW = (game: Pick<StreetGame, 'things'>, id: string): number => game.things.find((t) => t.id === id)?.w ?? 10
const widest = (game: Pick<StreetGame, 'things'>): number => Math.max(10, ...game.things.map((t) => t.w))

/** How long one turn of a lane is (percent): every thing with the room behind it; never shorter than the field and the widest thing, so that every thing comes in from outside. */
export function streetLoop(game: Pick<StreetGame, 'things'>, lane: Pick<StreetLane, 'items' | 'gap'>): number {
  const sum = lane.items.reduce((s, id) => s + thingW(game, id) + lane.gap, 0)
  return Math.max(sum, 100 + widest(game) * 2)
}

/** Where the things of a lane are at time `t` of the lane (ms): the left edge and the width of every thing (percent of the field). */
export function streetThings(game: Pick<StreetGame, 'things'>, lane: StreetLane, t: number): { id: string; x: number; w: number; core: number }[] {
  const loop = streetLoop(game, lane)
  const wide = widest(game)
  let start = 0
  return lane.items.map((id) => {
    const w = thingW(game, id)
    const raw = start + (lane.offset ?? 0) + (lane.speed * t) / 1000
    start += w + lane.gap
    const u = ((raw % loop) + loop) % loop
    // to the right: it comes in at the left edge; to the left: the mirror of that
    const x = lane.dir === 1 ? u - wide : 100 + wide - u - w
    return { id, x, w, core: game.things.find((th) => th.id === id)?.core ?? 1 }
  })
}

/** Whether a thing of the lane touches Ananias (his middle at `x`, width `w`) at time `t`; `margin` keeps a little room (percent). */
export function streetHit(game: Pick<StreetGame, 'things'>, lane: StreetLane, t: number, x: number, w: number, margin = 1): boolean {
  const a = x - w / 2 - margin
  const b = x + w / 2 + margin
  // only the painted part of a thing touches (the middle `core` of its picture)
  return streetThings(game, lane, t).some((th) => th.x + (th.w * (1 - th.core)) / 2 < b && th.x + th.w - (th.w * (1 - th.core)) / 2 > a)
}

/** Whether the lane stays free where Ananias stands, from `t` for `lead` ms (looked at every 50 ms). */
export function streetFree(game: Pick<StreetGame, 'things'>, lane: StreetLane, t: number, x: number, w: number, lead: number): boolean {
  for (let s = 0; s <= lead; s += 50) if (streetHit(game, lane, t + s, x, w)) return false
  return true
}

/** How long (ms) until the lane is free for a step that needs `lead` ms; -1 when it does not happen within `within` ms. */
export function streetWait(game: Pick<StreetGame, 'things'>, lane: StreetLane, t: number, x: number, w: number, lead: number, within = 15000): number {
  for (let s = 0; s <= within; s += 50) if (streetFree(game, lane, t + s, x, w, lead)) return s
  return -1
}

/** The longest free time (ms) at Ananias' place in one turn of the lane (how long a gap stays open). */
export function streetLongestGap(game: Pick<StreetGame, 'things' | 'walkerX' | 'walkerW' | 'walkerCore'>, lane: StreetLane): number {
  const turn = (streetLoop(game, lane) / lane.speed) * 1000
  let best = 0
  let run = 0
  for (let s = 0; s <= turn * 2; s += 50) {
    if (streetHit(game, lane, s, game.walkerX, game.walkerW * (game.walkerCore ?? 1))) run = 0
    else best = Math.max(best, (run += 50))
  }
  return best
}

/** The problems of the data of `gerade` (an empty list is good). */
export function straightStreetProblems(game: StreetGame): string[] {
  const out: string[] = []
  if (!game.city) out.push('no picture of the city')
  if (!game.walker.stand || !game.walker.walk) out.push('no pictures of Ananias')
  if (!game.gapLight) out.push('no picture of the light spot for "Help me"')
  if (!game.finale) out.push('no picture of the end')
  if (game.walkerW < 8) out.push('Ananias is too small for a phone (at least 8 percent)')
  if (game.walkerX < 15 || game.walkerX > 85) out.push('Ananias should walk between 15 and 85 percent')
  if (game.stepMs < 250 || game.stepMs > 1200) out.push('a step should take between 250 and 1200 ms')
  if (new Set(game.things.map((t) => t.id)).size !== game.things.length) out.push('two things have the same id')
  for (const th of game.things) if (th.w < 8 || th.w > 40) out.push(`the thing "${th.id}" should be 8 to 40 percent wide`)
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const rows = streetRows(r)
    if (!rows.length || rows[0]!.kind !== 'safe') out.push(`round ${n}: the start (the lowest place) must be a quiet strip`)
    if (!rows.length || rows[rows.length - 1]!.kind !== 'safe') out.push(`round ${n}: the door of Judas (the highest place) must be a quiet strip`)
    const ys = rows.map((x) => x.y)
    if (new Set(ys).size !== ys.length) out.push(`round ${n}: two places lie on the same line`)
    rows.forEach((row, k) => {
      if (row.y < 5 || row.y > 98) out.push(`round ${n}: a place lies outside the picture (${row.y})`)
      if (k > 0 && rows[k - 1]!.y - row.y < 5) out.push(`round ${n}: the places ${k} and ${k + 1} lie too close together`)
    })
    if (r.lanes.length < 2) out.push(`round ${n}: fewer than two lanes`)
    r.lanes.forEach((l, k) => {
      for (const id of l.items) if (!game.things.some((t) => t.id === id)) out.push(`round ${n}, lane ${k + 1}: the thing "${id}" has no picture`)
      if (!l.items.length) out.push(`round ${n}, lane ${k + 1}: nothing goes across`)
      if (l.speed < 3 || l.speed > 30) out.push(`round ${n}, lane ${k + 1}: the speed should be 3 to 30 percent a second`)
      if (l.dir !== 1 && l.dir !== -1) out.push(`round ${n}, lane ${k + 1}: the direction is 1 or -1`)
      // a gap must stay open long enough for a step and a little thinking
      if (l.items.length && streetLongestGap(game, l) < game.stepMs + 700) out.push(`round ${n}, lane ${k + 1}: the gaps are too short to step across`)
    })
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [StreetRound, StreetRound]
    if (b.lanes.length <= a.lanes.length) out.push('round 2 should have more lanes than round 1')
    if (!b.lanes.some((l) => l.dir === 1) || !b.lanes.some((l) => l.dir === -1)) out.push('round 2 has lanes in both directions')
  }
  return out
}

// ================================================================ 2. find Saul again (`wiederfinden`)

/** A person in the lane of Tarsus (side view, facing right, all at one scale): a name for the screen reader that never gives Saul away, and whether it is Saul. */
export interface RefindPerson {
  id: string
  image: string
  name: string
  saul?: boolean
}
/** A row of walkers: the line of their feet (percent of the height) and where they walk (1 to the right, -1 to the left). */
export interface RefindLane {
  y: number
  dir: 1 | -1
}
/** A person walking through the lane: on which row, when he comes in (ms after the picture of Saul is gone) and how long he needs from one edge to the other (ms). */
export interface RefindWalker {
  id: string
  lane: number
  at: number
  dur: number
}
/** A round: the hint, how long the picture of Saul is shown first (ms), the walkers, and after how long the same people come by again when Saul was not tapped (ms). */
export interface RefindRound {
  hint: string
  show: number
  walkers: RefindWalker[]
  again: number
}
/**
 * The game "Find Saul again" (`wiederfinden`): the lane in Tarsus by the river (3:2, without people), Barnabas looking out (left), the painted wooden frame with the picture of Saul,
 * the picture at the end (Barnabas and Saul embrace), the people, the rows, how wide a walker and Barnabas are (percent of the width) and the rounds.
 */
export interface RefindGame {
  street: string
  barnabas: string
  frame: string
  portrait: string
  found: string
  people: RefindPerson[]
  lanes: RefindLane[]
  personW: number
  barnabasW: number
  rounds: RefindRound[]
}

/** Where a walker is at time `t` of the round (the middle of the person, percent of the width), or null when he is not in the lane now; the walkers come round again after `again` ms. */
export function refindX(round: Pick<RefindRound, 'again' | 'walkers'>, lane: Pick<RefindLane, 'dir'>, w: RefindWalker, t: number, personW: number): number | null {
  const cycle = refindCycle(round)
  const tt = cycle > 0 ? t % cycle : t
  const s = (tt - w.at) / w.dur
  if (s < 0 || s > 1) return null
  const from = -personW / 2
  const to = 100 + personW / 2
  const x = from + (to - from) * s
  return lane.dir === 1 ? x : 100 - x
}

/** How long one pass of all walkers of a round lasts before they come by again (ms). */
export function refindCycle(round: Pick<RefindRound, 'walkers' | 'again'>): number {
  const end = Math.max(0, ...round.walkers.map((w) => w.at + w.dur))
  return end + round.again
}

/** A tap on a person: Saul is found, anyone else is a mistake. */
export const refindTap = (game: Pick<RefindGame, 'people'>, id: string): 'saul' | 'wrong' => (game.people.find((p) => p.id === id)?.saul ? 'saul' : 'wrong')

/** The problems of the data of `wiederfinden` (an empty list is good). */
export function refindProblems(game: RefindGame): string[] {
  const out: string[] = []
  if (!game.street) out.push('no picture of the lane in Tarsus')
  if (!game.barnabas) out.push('no picture of Barnabas')
  if (!game.frame || !game.portrait) out.push('no picture of Saul in the frame')
  if (!game.found) out.push('no picture of the end')
  const sauls = game.people.filter((p) => p.saul)
  if (sauls.length !== 1) out.push(`there must be exactly one Saul, there are ${sauls.length}`)
  if (new Set(game.people.map((p) => p.id)).size !== game.people.length) out.push('two people have the same id')
  if (new Set(game.people.map((p) => p.name)).size !== game.people.length) out.push('two people have the same name (the screen reader could not tell them apart)')
  for (const p of game.people) if (/saul/i.test(p.name)) out.push(`the name of "${p.id}" gives Saul away`)
  if (game.personW < 9 || game.personW > 22) out.push('a walker should be 9 to 22 percent wide')
  if (!game.lanes.length) out.push('no rows')
  game.lanes.forEach((l, k) => {
    if (l.y < 50 || l.y > 98) out.push(`row ${k + 1}: the feet should stand between 50 and 98 percent`)
  })
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (r.show < 2000) out.push(`round ${n}: the picture of Saul shows too briefly`)
    if (r.again < 1000) out.push(`round ${n}: the people should come by again after a pause`)
    const saul = r.walkers.filter((w) => game.people.find((p) => p.id === w.id)?.saul)
    if (saul.length !== 1) out.push(`round ${n}: Saul must come exactly once`)
    const others = r.walkers.filter((w) => !game.people.find((p) => p.id === w.id)?.saul)
    if (others.length < 3) out.push(`round ${n}: fewer than three other people`)
    for (const w of r.walkers) {
      if (!game.people.some((p) => p.id === w.id)) out.push(`round ${n}: the person "${w.id}" has no picture`)
      if (!game.lanes[w.lane]) out.push(`round ${n}: the person "${w.id}" walks on a row that is not there`)
      if (w.dur < 4000) out.push(`round ${n}: "${w.id}" walks too fast`)
      if (w.at < 0) out.push(`round ${n}: "${w.id}" comes before the start`)
    }
    // two people on the same row must not walk over each other
    const byLane = new Map<number, RefindWalker[]>()
    for (const w of r.walkers) byLane.set(w.lane, [...(byLane.get(w.lane) ?? []), w])
    for (const [lane, ws] of byLane) {
      const sorted = [...ws].sort((a, b) => a.at - b.at)
      for (let k = 1; k < sorted.length; k++) {
        const a = sorted[k - 1]!
        const b = sorted[k]!
        // b comes in when a is at least a person and a half ahead, and a is never caught up (b is not faster)
        const ahead = ((b.at - a.at) / a.dur) * (100 + game.personW)
        if (ahead < game.personW * 1.5 || b.dur < a.dur) out.push(`round ${n}, row ${lane + 1}: "${a.id}" and "${b.id}" walk over each other`)
      }
    }
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [RefindRound, RefindRound]
    if (b.walkers.length <= a.walkers.length) out.push('round 2 should have more people than round 1')
    if (b.show >= a.show) out.push('in round 2 the picture of Saul should show more briefly')
    if (new Set(b.walkers.map((w) => w.lane)).size < 2) out.push('round 2 has two rows')
  }
  return out
}

// ================================================================ 3. set the sail (`segel`)

/** A change of the wind at time `t` of the round (ms): `dir` is where the pennant points (degrees, clockwise, 0 = up on the screen). */
export interface SailWind {
  t: number
  dir: number
}
/** A round: the hint, the winds (the first at t 0), the gusts (times when the pennant flutters; nothing has to be turned) and how long the voyage lasts with a full sail (ms). */
export interface SailRound {
  hint: string
  winds: SailWind[]
  gusts: number[]
  duration: number
}
/**
 * The game "Set the sail" (`segel`): the sea (3:1, seamless), the ship from above at a slant without a sail, the sail full, half and slack (the same size and turning point),
 * the pennant, a wave crest, a gull, the strip of the sea chart with the little ship, the picture at the end (the ship comes into the harbour of Salamis),
 * where the top of the mast is (percent of the ship picture), how wide the ship is (percent of the field), how wide the sail is and where its ring is, by how much the sail and the pennant pictures are turned when they point to 0 degrees (up),
 * the tolerances (degrees) for a full and a half sail, how long a slack sail is allowed (ms), the step of the arrow keys (degrees), how long the pennant turns before the wind changes (ms) and the rounds.
 */
export interface SailGame {
  sea: string
  ship: string
  sails: { full: string; half: string; slack: string }
  pennant: string
  wave: string
  gull: string
  strip: string
  shipMini: string
  finale: string
  mast: { x: number; y: number }
  shipW: number
  /** How wide the sail picture is (percent of the ship picture) and where the ring of its yard sits in it (percent): the ring is put on the top of the mast, and the sail turns about it. */
  sailW: number
  sailRing: { x: number; y: number }
  sailTurn: number
  pennantTurn: number
  full: number
  half: number
  slackMs: number
  keyStep: number
  warnMs: number
  rounds: SailRound[]
}

/** The angle between two directions (0 to 180 degrees). */
export function sailDiff(a: number, b: number): number {
  const d = (((a - b) % 360) + 360) % 360
  return d > 180 ? 360 - d : d
}

/** The shortest turn from `from` to `to` (degrees, -180 to 180; positive = clockwise). */
export function sailTurnTo(from: number, to: number): number {
  const d = (((to - from) % 360) + 360) % 360
  return d > 180 ? d - 360 : d
}

/** The index of the wind that blows at time `t` (the last change before `t`). */
export function sailWindIndex(round: Pick<SailRound, 'winds'>, t: number): number {
  let k = 0
  round.winds.forEach((w, i) => {
    if (w.t <= t) k = i
  })
  return k
}

/** Where the wind blows at time `t`. */
export const sailWindAt = (round: Pick<SailRound, 'winds'>, t: number): number => round.winds[sailWindIndex(round, t)]?.dir ?? 0

/** Where the pennant points at time `t`: it turns slowly during the `warn` ms before a change, so that one sees it coming. */
export function sailPennantAt(round: Pick<SailRound, 'winds'>, t: number, warn: number): number {
  const k = sailWindIndex(round, t)
  const now = round.winds[k]?.dir ?? 0
  const next = round.winds[k + 1]
  if (!next || warn <= 0 || t < next.t - warn) return now
  const s = Math.min(1, Math.max(0, (t - (next.t - warn)) / warn))
  return now + sailTurnTo(now, next.dir) * s
}

/** How the sail stands at `angle` in the wind `wind`: full (fast), half (slow) or slack (almost still). The sail is best when it stands at the angle of the wind. */
export function sailState(game: Pick<SailGame, 'full' | 'half'>, angle: number, wind: number): 'full' | 'half' | 'slack' {
  const d = sailDiff(angle, wind)
  return d <= game.full ? 'full' : d <= game.half ? 'half' : 'slack'
}

/** How fast the ship goes with a sail in this state (1 = full). */
export const sailSpeed = (s: 'full' | 'half' | 'slack'): number => (s === 'full' ? 1 : s === 'half' ? 0.45 : 0.08)

/** A turn by the arrow keys: `steps` steps of `step` degrees, kept between 0 and 360. */
export const sailKey = (angle: number, steps: number, step: number): number => (((angle + steps * step) % 360) + 360) % 360

/** The angle of a finger at (`px`, `py`) seen from the mast at (`mx`, `my`) (any unit; clockwise, 0 = up). */
export function sailPointer(mx: number, my: number, px: number, py: number): number {
  const a = (Math.atan2(px - mx, my - py) * 180) / Math.PI
  return (a + 360) % 360
}

/** The problems of the data of `segel` (an empty list is good). */
export function sailTrimProblems(game: SailGame): string[] {
  const out: string[] = []
  if (!game.sea) out.push('no picture of the sea')
  if (!game.ship) out.push('no picture of the ship')
  if (!game.sails.full || !game.sails.half || !game.sails.slack) out.push('no pictures of the sail')
  if (!game.pennant) out.push('no picture of the pennant')
  if (!game.strip || !game.shipMini) out.push('no picture of the sea chart')
  if (!game.finale) out.push('no picture of the end')
  if (game.mast.x < 20 || game.mast.x > 80 || game.mast.y < 20 || game.mast.y > 80) out.push('the mast should stand in the middle part of the ship')
  if (game.shipW < 25 || game.shipW > 60) out.push('the ship should be 25 to 60 percent wide')
  if (!(game.full > 0 && game.full < game.half && game.half <= 90)) out.push('the tolerances must be 0 < full < half <= 90')
  if (game.slackMs < 2000) out.push('a slack sail should be allowed for at least two seconds')
  if (game.keyStep < 5 || game.keyStep > game.full) out.push('a step of the arrow keys must be smaller than the tolerance for a full sail')
  if (game.warnMs < 500) out.push('the pennant should turn for at least half a second before the wind changes')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (r.duration < 15000) out.push(`round ${n}: the voyage is too short`)
    if (!r.winds.length || r.winds[0]!.t !== 0) out.push(`round ${n}: the first wind blows at time 0`)
    r.winds.forEach((w, k) => {
      if (k === 0) return
      const prev = r.winds[k - 1]!
      if (w.t <= prev.t) out.push(`round ${n}: the winds are not in the order of time`)
      // time to see it, to turn and a little more, before the next change
      if (w.t - prev.t < game.warnMs + game.slackMs + 2000) out.push(`round ${n}: wind ${k + 1} comes too soon after the one before`)
      const d = sailDiff(w.dir, prev.dir)
      if (d <= game.full) out.push(`round ${n}: wind ${k + 1} hardly changes (nothing to turn)`)
      if (d > 135) out.push(`round ${n}: wind ${k + 1} turns too far at once`)
    })
    // the voyage must not end before the last change of the wind (with a full sail all the way)
    const last = r.winds[r.winds.length - 1]
    if (last && last.t + game.slackMs + 3000 > r.duration) out.push(`round ${n}: the last wind comes too late for the voyage`)
    for (const g of r.gusts) {
      if (r.winds.some((w) => w.t > 0 && Math.abs(w.t - g) < game.warnMs + 1500)) out.push(`round ${n}: a gust at ${g} is too close to a change of the wind`)
      if (g < 0 || g > r.duration) out.push(`round ${n}: a gust lies outside the voyage`)
    }
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [SailRound, SailRound]
    if (b.winds.length <= a.winds.length) out.push('round 2 should change the wind more often')
    if (a.gusts.length) out.push('round 1 has no gusts')
    if (!b.gusts.length) out.push('round 2 has gusts')
  }
  return out
}
