/**
 * The pure parts of the three new games of "Nehemia" (Anton's plan of 5.11.2026; the components only show and listen):
 * 1. "The cup" (`becher`, Nehemiah 2,1): Nehemiah carries the full cup over the smooth floor of the palace to the king. The finger shows where he should go; he follows it.
 *    Every start, stop, turn and every bump against a pillar makes the wine slosh (a damped swing driven by his change of speed); when it sloshes too far a little spills (a mistake).
 * 2. "Give back the pledge" (`pfand`, Nehemiah 5,11-12): the child pulls the pledges out of the chest one by one and gives each family its field, vineyard, olive grove or house.
 * 3. "Booths" (`laubhuetten`, Nehemiah 8,15-16): a young man walks along the path, picks branches of olive, myrtle and palm, carries them in his basket up the stairs and the booth grows on the roof.
 * Places are percent of the picture: x of the width, y of the height. Distances are "units" (percent of the width): the vertical difference is shortened by the ratio (width / height).
 * Times are seconds unless the name says milliseconds. Nothing here has a clock or dice of its own.
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

/** The distance of two places in units (percent of the width). */
export function nehDist(a: Pt, b: Pt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}

/** The distance (units) of point `p` from the line piece `a`–`b`. */
export function nehSegDist(p: Pt, a: Pt, b: Pt, ratio = 1.5): number {
  const ax = a.x
  const ay = a.y / ratio
  const bx = b.x - ax
  const by = b.y / ratio - ay
  const px = p.x - ax
  const py = p.y / ratio - ay
  const len = bx * bx + by * by
  const t = len > 0 ? clamp((px * bx + py * by) / len, 0, 1) : 0
  return Math.hypot(px - t * bx, py - t * by)
}

/** The narrowest picture that can still be tapped on a phone (12 % of a field 360 pixels wide are 43 pixels). */
export const NEH_MIN_W = 12

// ================================================================ 1. the cup (`becher`)

/** Something standing on the floor of the hall: a pillar, a big jar, a plant. `x`, `y` is the middle of its foot; `r` the round space it takes on the floor (units). */
export interface CupThing {
  image: string
  label: string
  x: number
  y: number
  w: number
  r: number
}
/** One round: the hint, where Nehemiah starts, the things on the floor, how far the wine may slosh before a little spills, and the way the help walks (from the start to the king). */
export interface CupRound {
  hint: string
  start: Pt
  things: CupThing[]
  limit: number
  path: Pt[]
}
/**
 * The game "The cup" (`becher`): the throne hall seen from above at a slant (portrait, `ratio` = width / height, 2:3), the floor where Nehemiah may walk (a box in percent),
 * Nehemiah with the cup (`walker`, his feet are his place; `body` is the round space he takes, units), the cup that shows the sloshing (beside the field),
 * the king (Nehemiah has arrived when his feet are `r` units or nearer), how fast he walks (units a second) and the rounds.
 */
export interface CupGame {
  background: string
  ratio?: number
  floor: { left: number; right: number; top: number; bottom: number }
  walker: NeuSprite
  body: number
  cup: { image: string; label: string }
  king: Pt & { r: number }
  speed: number
  rounds: CupRound[]
}
export const CUP_RATIO = 2 / 3
/** How quickly Nehemiah takes on the speed the finger asks for (a second), and how the finger's distance turns into speed (a second). */
export const CUP_RESPONSE = 6
export const CUP_GAIN = 2.2
/** The swing of the wine: its stiffness (a second²), damping (a second) and how strongly a bump against a thing shakes it. */
export const CUP_STIFF = 55
export const CUP_DAMP = 3.2
export const CUP_BUMP = 1.6
/** Slower than this (units a second) touching a thing is no bump. */
export const CUP_BUMP_SPEED = 3
/** How long Nehemiah stands still after some wine spilled (seconds). */
export const CUP_PAUSE = 1.3
/** The help walks slower than the child may (part of the speed) and leads him past this many points of the way. */
export const CUP_HELP_SPEED = 0.55
export const CUP_HELP_POINTS = 2

export interface CupState {
  /** where Nehemiah's feet are (percent) */
  p: Pt
  /** his speed (units a second) */
  v: Pt
  /** the slosh of the wine (units) and how fast it changes */
  s: Pt
  sv: Pt
  pause: number
  time: number
  arrived: boolean
}
export type CupEvent = { type: 'bump'; thing: number } | { type: 'spill' } | { type: 'arrived' }

export const cupRatio = (game: CupGame): number => game.ratio ?? CUP_RATIO
export const cupStart = (round: CupRound): CupState => ({ p: { ...round.start }, v: { x: 0, y: 0 }, s: { x: 0, y: 0 }, sv: { x: 0, y: 0 }, pause: 0, time: 0, arrived: false })
/** How far the wine sloshes (units). */
export const cupSlosh = (st: CupState): number => Math.hypot(st.s.x, st.s.y)

/**
 * One step (`dt` seconds). `target` is where the finger (or the help) wants Nehemiah to go (null: he stops). He takes on the speed slowly, he cannot walk through things
 * (bumping one stops him and shakes the cup), the wine swings with every change of his speed. When it sloshes over the round's limit some spills (a mistake): he stands still a moment.
 */
export function cupStep(game: CupGame, round: CupRound, st: CupState, target: Pt | null, dt: number, speedShare = 1): { state: CupState; events: CupEvent[] } {
  const events: CupEvent[] = []
  if (st.arrived) return { state: st, events }
  const ratio = cupRatio(game)
  const s: CupState = { p: { ...st.p }, v: { ...st.v }, s: { ...st.s }, sv: { ...st.sv }, pause: st.pause, time: st.time + dt, arrived: false }
  // the speed he wants (units a second; y in units too)
  let want = { x: 0, y: 0 }
  if (s.pause > 0) s.pause = Math.max(0, s.pause - dt)
  else if (target) {
    // the finger may leave the floor; he walks to the nearest place on it
    target = { x: clamp(target.x, game.floor.left, game.floor.right), y: clamp(target.y, game.floor.top, game.floor.bottom) }
    const dx = target.x - s.p.x
    const dy = (target.y - s.p.y) / ratio
    const d = Math.hypot(dx, dy)
    if (d > 0.4) {
      const sp = Math.min(game.speed * speedShare, d * CUP_GAIN)
      want = { x: (dx / d) * sp, y: (dy / d) * sp }
    }
  }
  const k = Math.min(1, dt * CUP_RESPONSE)
  const nv = s.pause > 0 ? { x: 0, y: 0 } : { x: s.v.x + (want.x - s.v.x) * k, y: s.v.y + (want.y - s.v.y) * k }
  let acc = { x: (nv.x - s.v.x) / dt, y: (nv.y - s.v.y) / dt }
  s.v = nv
  // walk; the floor is a box, the things are round
  let x = s.p.x + s.v.x * dt
  let yu = s.p.y / ratio + s.v.y * dt
  const f = game.floor
  if (x < f.left || x > f.right) {
    x = clamp(x, f.left, f.right)
    s.v.x = 0
  }
  if (yu < f.top / ratio || yu > f.bottom / ratio) {
    yu = clamp(yu, f.top / ratio, f.bottom / ratio)
    s.v.y = 0
  }
  round.things.forEach((t, i) => {
    const tx = t.x
    const ty = t.y / ratio
    const dx = x - tx
    const dy = yu - ty
    const d = Math.hypot(dx, dy)
    const min = t.r + game.body
    if (d < min) {
      const nx = d > 1e-6 ? dx / d : 0
      const ny = d > 1e-6 ? dy / d : 1
      x = tx + nx * min
      yu = ty + ny * min
      const into = s.v.x * nx + s.v.y * ny
      if (into < 0) {
        s.v = { x: s.v.x - nx * into, y: s.v.y - ny * into }
        // a real bump (not only leaning against it while walking round) shakes the cup
        if (-into > CUP_BUMP_SPEED) {
          s.sv = { x: s.sv.x - nx * into * CUP_BUMP, y: s.sv.y - ny * into * CUP_BUMP }
          events.push({ type: 'bump', thing: i })
        }
      }
    }
  })
  s.p = { x, y: yu * ratio }
  // the wine swings against the change of speed
  if (s.pause > 0) acc = { x: 0, y: 0 }
  const ax = -CUP_STIFF * s.s.x - CUP_DAMP * s.sv.x - acc.x
  const ay = -CUP_STIFF * s.s.y - CUP_DAMP * s.sv.y - acc.y
  s.sv = { x: s.sv.x + ax * dt, y: s.sv.y + ay * dt }
  s.s = { x: s.s.x + s.sv.x * dt, y: s.s.y + s.sv.y * dt }
  if (cupSlosh(s) > round.limit) {
    events.push({ type: 'spill' })
    s.s = { x: 0, y: 0 }
    s.sv = { x: 0, y: 0 }
    s.v = { x: 0, y: 0 }
    s.pause = CUP_PAUSE
  }
  if (nehDist(s.p, game.king, ratio) <= game.king.r) {
    s.arrived = true
    s.v = { x: 0, y: 0 }
    events.push({ type: 'arrived' })
  }
  return { state: s, events }
}

/** The share of the way that is done (0 … 1): how much nearer the king he is than at the start. */
export function cupShare(game: CupGame, round: CupRound, st: CupState): number {
  const ratio = cupRatio(game)
  const all = Math.max(1e-6, nehDist(round.start, game.king, ratio) - game.king.r)
  return clamp(1 - (nehDist(st.p, game.king, ratio) - game.king.r) / all, 0, 1)
}

/** True when the straight way from `a` to `b` keeps clear of every thing (with a margin, units). */
export function cupClear(game: CupGame, round: CupRound, a: Pt, b: Pt, margin = 0.5): boolean {
  const ratio = cupRatio(game)
  return round.things.every((t) => nehSegDist(t, a, b, ratio) >= t.r + game.body + margin)
}

/**
 * Where the help leads Nehemiah next: the point of the way after the nearest one that he can reach straight (without a thing in between); the last point is at the king.
 * `from` is the index he already passed (-1 at first).
 */
export function cupHelpPoint(game: CupGame, round: CupRound, p: Pt, from = -1): number {
  const ratio = cupRatio(game)
  const path = round.path
  let near = 0
  path.forEach((q, i) => {
    if (nehDist(p, q, ratio) < nehDist(p, path[near]!, ratio)) near = i
  })
  let i = Math.max(from + 1, near)
  // the furthest point ahead that is straight in reach (never more than two ahead of the nearest)
  for (let k = Math.min(path.length - 1, near + 2); k > i; k--) {
    if (cupClear(game, round, p, path[k]!, 0)) {
      i = k
      break
    }
  }
  return Math.min(i, path.length - 1)
}

/** Lets the help walk a round from the start (the check of the data: it must arrive without a spill). */
export function cupSimulate(game: CupGame, round: CupRound, dt = 0.05): { spills: number; arrived: boolean; seconds: number } {
  const ratio = cupRatio(game)
  let st = cupStart(round)
  let spills = 0
  let at = -1
  for (let t = 0; t < 120; t += dt) {
    const i = cupHelpPoint(game, round, st.p, at)
    const goal = round.path[i]!
    if (nehDist(st.p, goal, ratio) < 1.2 && i < round.path.length - 1) at = i
    const r = cupStep(game, round, st, goal, dt, CUP_HELP_SPEED)
    st = r.state
    spills += r.events.filter((e) => e.type === 'spill').length
    if (st.arrived) return { spills, arrived: true, seconds: t }
  }
  return { spills, arrived: false, seconds: 120 }
}

/** The biggest slosh of a sudden start at full speed from standing (the check: the first round forgives it, the second does not need to). */
export function cupJerk(game: CupGame, round: CupRound, turn = false, dt = 0.05): number {
  const ratio = cupRatio(game)
  const free: CupRound = { ...round, things: [], limit: 1e9 }
  const big: CupGame = { ...game, floor: { left: -1e4, right: 1e4, top: -1e4, bottom: 1e4 }, king: { x: 1e5, y: 1e5, r: 0 } }
  let st = cupStart(free)
  let most = 0
  for (let t = 0; t < 3; t += dt) {
    const back = turn && t > 1.5
    const target = { x: st.p.x, y: st.p.y + (back ? 1 : -1) * 500 * ratio }
    st = cupStep(big, free, st, target, dt).state
    if (!turn || t > 1.5) most = Math.max(most, cupSlosh(st))
  }
  return most
}

/** The problems of the data of `becher` (an empty list is good). */
export function cupProblems(game: CupGame): string[] {
  const out: string[] = []
  const ratio = cupRatio(game)
  const f = game.floor
  const inFloor = (p: Pt) => p.x >= f.left && p.x <= f.right && p.y >= f.top && p.y <= f.bottom
  if (!game.background) out.push('no picture of the hall')
  if (!(ratio > 0.4 && ratio < 2)) out.push('the ratio of the picture is odd')
  if (!(f.left >= 0 && f.right <= 100 && f.top >= 0 && f.bottom <= 100 && f.right - f.left >= 40 && f.bottom - f.top >= 40)) out.push('the floor box is too small or outside the picture')
  if (!game.walker?.image) out.push('no picture of Nehemiah')
  else if (!(game.walker.w >= NEH_MIN_W + 2 && game.walker.w <= 40)) out.push(`Nehemiah should be 14 to 40 percent wide (he is ${game.walker.w}), so that he is big enough on a phone`)
  if (!(game.body >= 2 && game.body <= game.walker.w / 2)) out.push('the space Nehemiah takes (body) should be 2 units up to half his picture')
  if (!game.cup?.image) out.push('no picture of the cup')
  if (!inFloor(game.king)) out.push('the king is not on the floor')
  if (!(game.king.r >= 3 && game.king.r <= 15)) out.push('the circle at the king should be 3 to 15 units')
  if (!(game.speed >= 8 && game.speed <= 40)) out.push('the speed should be 8 to 40 units a second')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (!inFloor(r.start)) out.push(`round ${n}: the start is not on the floor`)
    if (nehDist(r.start, game.king, ratio) < 40) out.push(`round ${n}: the start is too near the king (less than 40 units)`)
    if (!(r.limit > 1 && r.limit < 20)) out.push(`round ${n}: the limit of the sloshing is odd`)
    r.things.forEach((t, k) => {
      if (!t.image) out.push(`round ${n}: thing ${k + 1} has no picture`)
      if (!(t.w >= 10 && t.w <= 30)) out.push(`round ${n}: thing ${k + 1} should be 10 to 30 percent wide`)
      if (!(t.r >= 3 && t.r <= t.w)) out.push(`round ${n}: thing ${k + 1}: its space r should be 3 units up to its width`)
      if (!inFloor(t)) out.push(`round ${n}: thing ${k + 1} is not on the floor`)
      if (nehDist(t, r.start, ratio) < t.r + game.body + 4) out.push(`round ${n}: thing ${k + 1} stands at the start`)
      if (nehDist(t, game.king, ratio) < t.r + game.king.r + 2) out.push(`round ${n}: thing ${k + 1} stands at the king`)
      r.things.forEach((o, j) => {
        if (j > k && nehDist(t, o, ratio) < t.r + o.r + 2 * game.body + 2) out.push(`round ${n}: things ${k + 1} and ${j + 1} stand too close (Nehemiah cannot pass between them)`)
      })
    })
    if (r.path.length < 2) out.push(`round ${n}: the way of the help has fewer than two points`)
    else {
      if (nehDist(r.path[0]!, r.start, ratio) > 6) out.push(`round ${n}: the way of the help does not begin at the start`)
      if (nehDist(r.path[r.path.length - 1]!, game.king, ratio) > game.king.r - 0.5) out.push(`round ${n}: the way of the help does not end at the king`)
      for (let k = 1; k < r.path.length; k++) if (!cupClear(game, r, r.path[k - 1]!, r.path[k]!)) out.push(`round ${n}: the way of the help runs into a thing between points ${k} and ${k + 1}`)
      r.path.forEach((p, k) => {
        if (!inFloor(p)) out.push(`round ${n}: point ${k + 1} of the way is not on the floor`)
      })
    }
    const sim = cupSimulate(game, r)
    if (!sim.arrived) out.push(`round ${n}: the help does not bring Nehemiah to the king`)
    if (sim.spills > 0) out.push(`round ${n}: even the help spills ${sim.spills} times`)
    if (sim.seconds > 40) out.push(`round ${n}: the help needs more than 40 seconds`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (!(b!.limit < a!.limit)) out.push('round 2 should have a smaller limit of the sloshing than round 1')
    if (b!.things.length <= a!.things.length) out.push('round 2 should have more things on the floor than round 1')
    // a careless start is forgiven in round 1; turning round at full speed is too much in both rounds
    if (cupJerk(game, a!) >= a!.limit) out.push('round 1: a sudden start already spills (too strict for the first round)')
    if (cupJerk(game, b!, true) < b!.limit) out.push('round 2: even turning round at full speed does not spill (too easy)')
  }
  return out
}

// ================================================================ 2. give back the pledge (`pfand`)

/** What was pledged (Nehemiah 5,3.11): fields, vineyards, olive groves and houses. */
export type PledgeKind = 'acker' | 'weinberg' | 'oelgarten' | 'haus'
export const PLEDGE_KINDS: readonly PledgeKind[] = ['acker', 'weinberg', 'oelgarten', 'haus']

/** A family of a round: which picture (index into `families`), what it pledged and where it stands (the middle of its feet, percent) and how wide it is. */
export interface PledgeSpot {
  family: number
  kind: PledgeKind
  x: number
  y: number
  w: number
}
/** One round: the hint, the families and the order in which the pledges come out of the chest. */
export interface PledgeRound {
  hint: string
  spots: PledgeSpot[]
  draw: PledgeKind[]
}
/**
 * The game "Give back the pledge" (`pfand`): the square in Jerusalem (3:2), the open chest (its middle and foot, width), the pictures of the families (each with a name for the
 * screen reader), the pledge papers (one picture for each kind; above every family the paper it waits for is shown pale), how wide a paper is, the rounds.
 */
export interface PledgeGame {
  background: string
  ratio?: number
  chest: NeuSprite & Pt
  families: Array<{ image: string; label: string }>
  slips: Record<PledgeKind, { image: string; label: string }>
  slipW: number
  /** how high a family picture is for its width (for the place of the pale paper above it) */
  familyAspect: number
  rounds: PledgeRound[]
}

export type PledgeResult = 'right' | 'wrong' | 'given'
/** Gives the paper `kind` to the family at `spot` of the round (`given` lists the spots that have their paper already). */
export function pledgeGive(round: PledgeRound, given: readonly number[], kind: PledgeKind, spot: number): PledgeResult {
  if (given.includes(spot)) return 'given'
  return round.spots[spot]?.kind === kind ? 'right' : 'wrong'
}
/** The spot that waits for the paper `kind` (for the help), or -1. */
export const pledgeOwner = (round: PledgeRound, given: readonly number[], kind: PledgeKind): number => round.spots.findIndex((s, i) => s.kind === kind && !given.includes(i))
/** The place of the pale paper above a family (its middle, percent). */
export function pledgeBadge(game: PledgeGame, s: PledgeSpot): Pt {
  const ratio = game.ratio ?? 1.5
  const h = s.w * game.familyAspect * ratio
  return { x: s.x, y: s.y - h - (game.slipW * ratio) / 2 + 2 }
}

/** The problems of the data of `pfand` (an empty list is good). */
export function pledgeProblems(game: PledgeGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the square')
  if (!game.chest?.image) out.push('no picture of the chest')
  else if (!(game.chest.w >= 18 && game.chest.w <= 40)) out.push('the chest should be 18 to 40 percent wide')
  if (!(game.slipW >= NEH_MIN_W && game.slipW <= 22)) out.push(`a pledge paper should be ${NEH_MIN_W} to 22 percent wide (big enough on a phone)`)
  if (!(game.familyAspect > 0.5 && game.familyAspect < 2.5)) out.push('the aspect of the family pictures is odd')
  for (const k of PLEDGE_KINDS) if (!game.slips[k]?.image) out.push(`no picture of the paper "${k}"`)
  if (game.families.length < 3) out.push('fewer than three family pictures')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (r.spots.length < 3) out.push(`round ${n}: fewer than three families`)
    const kinds = r.spots.map((s) => s.kind)
    if (new Set(kinds).size !== kinds.length) out.push(`round ${n}: two families wait for the same kind of paper (the child could not tell them apart)`)
    if (new Set(r.spots.map((s) => s.family)).size !== r.spots.length) out.push(`round ${n}: the same family picture twice`)
    if ([...r.draw].sort().join() !== [...kinds].sort().join()) out.push(`round ${n}: the chest does not hold exactly one paper for every family`)
    if (r.draw.length > 1 && r.draw.every((k, j) => k === kinds[j])) out.push(`round ${n}: the papers come in the order of the families (too easy)`)
    r.spots.forEach((s, k) => {
      if (!game.families[s.family]) out.push(`round ${n}: family ${k + 1} has no picture`)
      if (!(s.w >= 16 && s.w <= 32)) out.push(`round ${n}: family ${k + 1} should be 16 to 32 percent wide`)
      if (s.x - s.w / 2 < -0.5 || s.x + s.w / 2 > 100.5) out.push(`round ${n}: family ${k + 1} stands outside the picture`)
      const b = pledgeBadge(game, s)
      if (b.y - (game.slipW * ratio) / 2 < 0) out.push(`round ${n}: the paper above family ${k + 1} is outside the picture`)
      r.spots.forEach((o, j) => {
        if (j > k && Math.abs(o.y - s.y) < s.w * game.familyAspect * ratio && Math.abs(o.x - s.x) < (o.w + s.w) / 2 - 1) out.push(`round ${n}: families ${k + 1} and ${j + 1} overlap`)
      })
      // the chest must not cover a family (the chest stands below them)
      if (Math.abs(s.x - game.chest.x) < (s.w + game.chest.w) / 2 - 1 && game.chest.y - game.chest.w * ratio * 0.8 < s.y - 2) out.push(`round ${n}: the chest covers family ${k + 1}`)
    })
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (b!.spots.length <= a!.spots.length) out.push('round 2 should have more families than round 1')
    if (a!.spots.length && b!.spots.length && a!.spots.every((s, j) => b!.spots[j]?.kind === s.kind)) out.push('round 2 should change the order of the families')
  }
  return out
}

// ================================================================ 3. booths (`laubhuetten`)

/** The branches for a booth (Nehemiah 8,15: olive, myrtle, palm). */
export type BoughKind = 'oel' | 'myrte' | 'palme'
export const BOUGH_KINDS: readonly BoughKind[] = ['oel', 'myrte', 'palme']
/** A tree at the path: its kind (or the dry thorn bush that has no leaves), the middle of its foot (percent of the width) and its width. */
export interface BoothTree {
  kind: BoughKind | 'dorn'
  x: number
  w: number
}
/** One round: the hint, the trees, how many branches of each kind the booth needs, how many fit into the basket, where the man starts. */
export interface BoothRound {
  hint: string
  trees: BoothTree[]
  need: Record<BoughKind, number>
  carry: number
  start: number
}
/** A place on the frame of the booth where a branch is tied (middle, percent; width; turn in degrees). */
export interface BoothSlot {
  x: number
  y: number
  w: number
  rot: number
}
/**
 * The game "Booths" (`laubhuetten`): the hillside and the house (3:2, seen from the side), the line where the trees stand (`hill`, percent of the height) and the path of the man (`road`),
 * the man with the basket (looks to the right), how fast he walks (percent a second), where the stairs to the roof begin (x), the pictures of the trees and branches,
 * the places on the frame (filled one after another) and the rounds.
 */
export interface BoothGame {
  background: string
  ratio?: number
  hill: number
  road: number
  walker: NeuSprite
  speed: number
  stairs: number
  /** the tap area of the house with the stairs (percent of the picture) */
  house: { left: number; right: number; top: number; bottom: number }
  trees: Record<BoughKind | 'dorn', { image: string; label: string }>
  /** a branch: its picture, its name (one) and the name of many */
  boughs: Record<BoughKind, { image: string; label: string; plural: string }>
  slots: BoothSlot[]
  rounds: BoothRound[]
}
/** How long picking a branch or emptying the basket takes (seconds). */
export const BOOTH_ACT = 0.5

export type BoothGoal = { type: 'tree'; tree: number } | { type: 'stairs' } | { type: 'walk'; x: number }
export interface BoothState {
  x: number
  goal: BoothGoal | null
  basket: BoughKind[]
  built: BoughKind[]
  pause: number
  done: boolean
  /** the man looks to the left */
  left: boolean
}
export type BoothEvent =
  | { type: 'picked'; kind: BoughKind }
  | { type: 'thorn' }
  | { type: 'enough'; kind: BoughKind }
  | { type: 'full' }
  | { type: 'built'; n: number }
  | { type: 'empty' }
  | { type: 'done' }

export const boothStart = (round: BoothRound): BoothState => ({ x: round.start, goal: null, basket: [], built: [], pause: 0, done: false, left: false })
export const boothTotal = (round: BoothRound): number => BOUGH_KINDS.reduce((a, k) => a + round.need[k], 0)
/** How many branches of a kind are still wanted (not on the roof and not in the basket). */
export const boothWanted = (round: BoothRound, st: BoothState, kind: BoughKind): number =>
  round.need[kind] - st.built.filter((b) => b === kind).length - st.basket.filter((b) => b === kind).length
const goalX = (game: BoothGame, round: BoothRound, g: BoothGoal): number => (g.type === 'tree' ? round.trees[g.tree]!.x : g.type === 'stairs' ? game.stairs : g.x)

/** The man does what he went for: picks a branch at a tree, or empties his basket at the stairs (the branches are tied to the booth). */
function boothAct(round: BoothRound, s: BoothState, g: BoothGoal, events: BoothEvent[]) {
  if (g.type === 'tree') {
    const kind = round.trees[g.tree]!.kind
    if (kind === 'dorn') events.push({ type: 'thorn' })
    else if (boothWanted(round, s, kind) <= 0) events.push({ type: 'enough', kind })
    else if (s.basket.length >= round.carry) events.push({ type: 'full' })
    else {
      s.basket = [...s.basket, kind]
      events.push({ type: 'picked', kind })
    }
    s.pause = BOOTH_ACT
  } else if (g.type === 'stairs') {
    if (!s.basket.length) events.push({ type: 'empty' })
    else {
      events.push({ type: 'built', n: s.basket.length })
      s.built = [...s.built, ...s.basket]
      s.basket = []
      s.pause = BOOTH_ACT
      if (BOUGH_KINDS.every((k) => s.built.filter((b) => b === k).length >= round.need[k])) {
        s.done = true
        events.push({ type: 'done' })
      }
    }
  }
}

/** Sends the man to a tree, the stairs or a place; when he is already there he acts at once (the next step). */
export const boothGo = (st: BoothState, goal: BoothGoal): BoothState => ({ ...st, goal })

/** One step (`dt` seconds): the man walks to his goal at his speed and acts when he is there. */
export function boothStep(game: BoothGame, round: BoothRound, st: BoothState, dt: number): { state: BoothState; events: BoothEvent[] } {
  const events: BoothEvent[] = []
  if (st.done) return { state: st, events }
  const s: BoothState = { ...st }
  if (s.pause > 0) {
    s.pause = Math.max(0, s.pause - dt)
    return { state: s, events }
  }
  if (!s.goal) return { state: s, events }
  const gx = goalX(game, round, s.goal)
  const d = gx - s.x
  if (Math.abs(d) > 0.3) s.left = d < 0
  const stepLen = game.speed * dt
  if (Math.abs(d) <= stepLen) {
    s.x = gx
    const g = s.goal
    s.goal = null
    boothAct(round, s, g, events)
  } else s.x += Math.sign(d) * stepLen
  return { state: s, events }
}

/** What the help does next: empty the basket when it is full or holds all that is still wanted, else go to the nearest tree whose branches are wanted. */
export function boothNext(game: BoothGame, round: BoothRound, st: BoothState): BoothGoal | null {
  if (st.done) return null
  const stillWanted = BOUGH_KINDS.filter((k) => boothWanted(round, st, k) > 0)
  if (st.basket.length && (st.basket.length >= round.carry || !stillWanted.length)) return { type: 'stairs' }
  let best = -1
  round.trees.forEach((t, i) => {
    if (t.kind === 'dorn' || !stillWanted.includes(t.kind)) return
    if (best < 0 || Math.abs(t.x - st.x) < Math.abs(round.trees[best]!.x - st.x)) best = i
  })
  if (best >= 0) return { type: 'tree', tree: best }
  return st.basket.length ? { type: 'stairs' } : null
}

/** Lets the help play a round (the check: it must finish without a mistake). */
export function boothSimulate(game: BoothGame, round: BoothRound, dt = 0.05): { mistakes: number; done: boolean; seconds: number } {
  let st = boothStart(round)
  let mistakes = 0
  for (let t = 0; t < 240; t += dt) {
    if (!st.goal && st.pause <= 0) {
      const g = boothNext(game, round, st)
      if (g) st = boothGo(st, g)
    }
    const r = boothStep(game, round, st, dt)
    st = r.state
    mistakes += r.events.filter((e) => e.type === 'thorn' || e.type === 'enough').length
    if (st.done) return { mistakes, done: true, seconds: t }
  }
  return { mistakes, done: false, seconds: 240 }
}

/** The problems of the data of `laubhuetten` (an empty list is good). */
export function boothProblems(game: BoothGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the hill and the house')
  if (!(game.hill > 40 && game.hill < game.road && game.road <= 99)) out.push('the trees should stand above the path (hill < road ≤ 99)')
  if (!game.walker?.image) out.push('no picture of the man')
  else if (!(game.walker.w >= NEH_MIN_W && game.walker.w <= 30)) out.push(`the man should be ${NEH_MIN_W} to 30 percent wide`)
  if (!(game.speed >= 8 && game.speed <= 40)) out.push('the speed should be 8 to 40 percent a second')
  if (!(game.stairs > 40 && game.stairs < 95)) out.push('the stairs should lie between 40 and 95 percent')
  const h = game.house
  if (!(h && h.left <= game.stairs && h.right >= game.stairs && h.left < h.right && h.top < h.bottom && h.left >= 0 && h.right <= 100 && h.top >= 0 && h.bottom <= 100)) out.push('the tap area of the house should hold the stairs and lie in the picture')
  else if (h.right - h.left < NEH_MIN_W) out.push(`the tap area of the house should be at least ${NEH_MIN_W} percent wide`)
  for (const k of [...BOUGH_KINDS, 'dorn'] as const) if (!game.trees[k]?.image) out.push(`no picture of the tree "${k}"`)
  for (const k of BOUGH_KINDS) if (!game.boughs[k]?.image || !game.boughs[k]?.plural) out.push(`no picture or name of the branch "${k}"`)
  game.slots.forEach((s, k) => {
    if (!(finite(s.x) && finite(s.y) && s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100)) out.push(`slot ${k + 1} lies outside the picture`)
    if (!(s.w >= 4 && s.w <= 20)) out.push(`slot ${k + 1} should be 4 to 20 percent wide`)
  })
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    const total = boothTotal(r)
    if (total > game.slots.length) out.push(`round ${n}: the booth needs ${total} branches but has only ${game.slots.length} places`)
    if (!(r.carry >= 2 && r.carry < total)) out.push(`round ${n}: the basket should hold at least 2 and fewer than all branches (more than one walk)`)
    if (!(r.start >= 0 && r.start <= 100)) out.push(`round ${n}: the start lies outside the picture`)
    for (const k of BOUGH_KINDS) {
      if (!(r.need[k] >= 1)) out.push(`round ${n}: the booth needs no "${k}"`)
      if (!r.trees.some((t) => t.kind === k)) out.push(`round ${n}: no tree "${k}"`)
    }
    r.trees.forEach((t, k) => {
      if (!(t.w >= NEH_MIN_W && t.w <= 30)) out.push(`round ${n}: tree ${k + 1} should be ${NEH_MIN_W} to 30 percent wide`)
      if (t.x - t.w / 2 < -3 || t.x > game.stairs - 3) out.push(`round ${n}: tree ${k + 1} does not stand on the hillside (left of the stairs)`)
      r.trees.forEach((o, j) => {
        // the pictures are wider than the trees in them: the pictures may overlap by 30 %
        if (j > k && Math.abs(o.x - t.x) < ((o.w + t.w) / 2) * 0.7) out.push(`round ${n}: trees ${k + 1} and ${j + 1} overlap`)
      })
    })
    const sim = boothSimulate(game, r)
    if (!sim.done) out.push(`round ${n}: the help does not finish the booth`)
    if (sim.mistakes) out.push(`round ${n}: even the help makes ${sim.mistakes} mistakes`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (boothTotal(b!) <= boothTotal(a!)) out.push('round 2 should need more branches than round 1')
    if (!b!.trees.some((t) => t.kind === 'dorn')) out.push('round 2 should have the dry thorn bush')
  }
  return out
}
