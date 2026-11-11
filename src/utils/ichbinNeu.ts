/**
 * The pure parts of the two new games of "Jesus erzählt von sich" (id `ichbin`); the components only draw and listen:
 * 1. "Which way does the wind blow?" (`wehen`, field `breeze`, John 3,8: "The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh"):
 *    a courtyard at night in which a gust moves a few small things (the flame, a cloth, a twig, the grass, a leaf); the child never sees the wind, only what it moves, and taps the
 *    tablet that says where it blows (left, right) or that it is still. In round 2 the wind turns in the middle of the gust (the end counts) and one gust is quite still.
 * 2. "The call of the shepherd" (`hirtenruf`, field `herdCall`, John 10,3-5: "the sheep hear his voice … for they know his voice"): in round 1 the child taps the shepherd; the call
 *    reaches farther with every tap in quick succession and the sheep that hear it come to him; in round 2 two callers stand in the fog and the child finds the shepherd by the
 *    way the sheep run.
 * All places are percent of the picture (width and height, 3:2); distances are in "units" (percent of the width), the vertical difference is shortened by the ratio of the picture.
 * The arithmetic has no clock and no dice of its own: the component says how many milliseconds have passed.
 */

export interface Pt {
  x: number
  y: number
}

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function ichbinDist(a: Pt, b: Pt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** The width of the screen the sizes are checked against (pixels). */
export const ICHBIN_PHONE_W = 360

// ================================================================ 1. which way does the wind blow? (`wehen`)

/** The direction the wind blows to. */
export type BreezeDir = 'left' | 'right'
/** What a gust does: blows to the left, to the right, or nothing (calm). */
export type BreezeWind = BreezeDir | 'calm'
/** The tablets the child taps (the middle one is the calm). */
export type BreezeTablet = 'left' | 'still' | 'right'

/**
 * One gust: it starts blowing to `dir` and lasts `ms` milliseconds. With `turnTo` the wind turns in the middle of the gust (about halfway) and blows to `turnTo` at the end: the
 * answer is the direction at the END. `calm`: nothing moves (only the flame trembles a little) and the answer is the calm.
 */
export interface BreezeGust {
  dir: BreezeWind
  turnTo?: BreezeDir
  ms: number
}
/** The small things that the wind moves. `flame` and `cloth` have three pictures (still, leaning left, leaning right); `twig` and `grass` are leaned by the code; `leaf` drifts through the picture. */
export type BreezeKind = 'flame' | 'cloth' | 'twig' | 'grass' | 'leaf'
/**
 * A thing in the courtyard. `x`, `y` (percent of the picture) are its anchor: the middle of the bottom edge for `flame`, `grass` and `leaf` (the leaf: its middle), the bottom left for
 * the `twig` (the code leans it round this point), the middle of the top edge for the `cloth`. `w` is the width in percent of the picture, `ratio` width / height of the picture.
 * `images` are the pictures of the two leaning states of `flame` and `cloth`.
 */
export interface BreezeThing {
  id: string
  kind: BreezeKind
  /** For screen readers (the thing and what it does not say about the wind). */
  label: string
  x: number
  y: number
  w: number
  ratio: number
  image: string
  images?: { left: string; right: string }
}
/** The ask line of a round: after the gust "Which way did the wind blow?" (`blown`) or, when the wind turns, "Which way does it blow now?" (`now`). */
export type BreezeAsk = 'blown' | 'now'
export interface BreezeRound {
  hint: string
  ask: BreezeAsk
  gusts: BreezeGust[]
}
/** The game "Which way does the wind blow?" (`wehen`): the courtyard (3:2, empty), the things, the three tablets (200 x 200, round wooden signs, no writing), their width and two rounds. */
export interface BreezeGame {
  background: string
  ratio?: number
  things: BreezeThing[]
  tablets: Record<BreezeTablet, string>
  /** The width of a tablet in percent of the game (a finger target: at least 56 pixels on a phone). */
  tabletW: number
  rounds: BreezeRound[]
}

/** How long a gust takes to bring the things to their lean (milliseconds). */
export const BREEZE_EASE_MS = 350
/** How long the wind needs to turn (milliseconds, about halfway through the gust). */
export const BREEZE_TURN_MS = 300
/** What is added to a gust for the time between two gusts (the pose is held, the things settle, the next gust starts), for the length of a round (milliseconds). */
export const BREEZE_GAP_MS = 2800
/** A round may take at most this long (milliseconds, the gusts and the gaps without the time the child needs to think). */
export const BREEZE_ROUND_MAX_MS = 40000
/** How far the leaf drifts in a gust of 2.5 seconds (percent of the width). */
export const BREEZE_LEAF_TRAVEL = 34
/** The smallest finger target of a tablet (pixels). */
export const BREEZE_TABLET_MIN = 56

export const breezeSign = (w: BreezeWind | undefined): number => (w === 'left' ? -1 : w === 'right' ? 1 : 0)
/** Where the wind blows at the END of the gust: the answer. */
export const breezeEnd = (g: BreezeGust): BreezeWind => (g.dir === 'calm' ? 'calm' : (g.turnTo ?? g.dir))
/** The tablet that is right for a wind. */
export const breezeTabletOf = (w: BreezeWind): BreezeTablet => (w === 'calm' ? 'still' : w)
/** The tablet that is right for a gust (what "Help me" makes shine). */
export const breezeAnswer = (g: BreezeGust): BreezeTablet => breezeTabletOf(breezeEnd(g))
/** Does the wind turn in this gust? */
export const breezeTurns = (g: BreezeGust): boolean => g.dir !== 'calm' && g.turnTo !== undefined && g.turnTo !== g.dir

/** The direction of the wind `t` milliseconds after the start of the gust, from -1 (left) to 1 (right); the turn is a short, smooth change round the middle. */
export function breezeWindAt(g: BreezeGust, t: number): number {
  if (g.dir === 'calm') return 0
  const a = breezeSign(g.dir)
  if (!breezeTurns(g)) return a
  const b = breezeSign(g.turnTo)
  const mid = g.ms / 2
  const k = clamp((t - (mid - BREEZE_TURN_MS / 2)) / BREEZE_TURN_MS, 0, 1)
  return a + (b - a) * k
}
/** How far the things lean at `t`: the wind times the swing-in (-1 = fully to the left, 1 = fully to the right); when the gust is over the end lean stays. */
export function breezeLean(g: BreezeGust, t: number): number {
  if (t <= 0) return 0
  if (t >= g.ms) return breezeSign(breezeEnd(g))
  return breezeWindAt(g, t) * clamp(t / BREEZE_EASE_MS, 0, 1)
}
/** The picture a thing with three states shows at a lean. */
export const breezePose = (lean: number): 'still' | 'left' | 'right' => (lean < -0.3 ? 'left' : lean > 0.3 ? 'right' : 'still')
/** How far the leaf has drifted (percent of the width, negative to the left) `t` milliseconds after the start of the gust; the drift follows the wind, so a turned wind brings it back. */
export function breezeLeafOffset(g: BreezeGust, t: number): number {
  const end = clamp(t, 0, g.ms)
  const step = 50
  let sum = 0
  for (let s = 0; s < end; s += step) sum += breezeWindAt(g, s + Math.min(step, end - s) / 2) * Math.min(step, end - s)
  return (sum / 2500) * BREEZE_LEAF_TRAVEL
}
/** How long a round takes without the thinking of the child (milliseconds). */
export const breezeRoundMs = (r: Pick<BreezeRound, 'gusts'>): number => r.gusts.reduce((s, g) => s + g.ms + BREEZE_GAP_MS, 0)

/** The problems of the data of `wehen` (an empty list is good). */
export function breezeProblems(game: BreezeGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the courtyard')
  for (const k of ['left', 'still', 'right'] as const) if (!game.tablets?.[k]) out.push(`no picture of the tablet "${k}"`)
  if (game.tabletW * (ICHBIN_PHONE_W / 100) < BREEZE_TABLET_MIN) out.push(`the tablets are narrower than ${BREEZE_TABLET_MIN} pixels on a phone`)
  const kinds = new Set(game.things.map((t) => t.kind))
  for (const k of ['flame', 'cloth', 'twig', 'grass'] as const) if (!kinds.has(k)) out.push(`no "${k}" among the things (the wind needs several things to be read)`)
  const ids = game.things.map((t) => t.id)
  if (new Set(ids).size !== ids.length) out.push('two things have the same id')
  for (const t of game.things) {
    if (!t.image) out.push(`${t.id}: no picture`)
    if (!t.label) out.push(`${t.id}: no label`)
    if ((t.kind === 'flame' || t.kind === 'cloth') && (!t.images?.left || !t.images?.right)) out.push(`${t.id}: a ${t.kind} needs a picture for leaning left and one for leaning right`)
    const half = t.kind === 'twig' ? 0 : t.w / 2
    if (t.x - half < 0 || t.x + (t.kind === 'twig' ? t.w : half) > 100 || t.y < 0 || t.y > 100) out.push(`${t.id}: lies outside the picture`)
    if (t.w < 4) out.push(`${t.id}: too small to be seen`)
    if (!(t.ratio > 0.1 && t.ratio < 5)) out.push(`${t.id}: the ratio of the picture is not sensible`)
  }
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    const ends = r.gusts.map(breezeEnd)
    for (let k = 2; k < ends.length; k++) if (ends[k] === ends[k - 1] && ends[k] === ends[k - 2]) out.push(`round ${n}: three gusts in a row end the same way (${ends[k]})`)
    for (const g of r.gusts) {
      if (g.dir === 'calm' && g.turnTo) out.push(`round ${n}: a calm gust cannot turn`)
      if (g.turnTo && g.turnTo === g.dir) out.push(`round ${n}: a gust that turns must turn to the other side`)
      if (g.dir !== 'calm' && g.dir !== 'left' && g.dir !== 'right') out.push(`round ${n}: unknown direction`)
    }
    if (breezeRoundMs(r) > BREEZE_ROUND_MAX_MS) out.push(`round ${n}: lasts longer than ${BREEZE_ROUND_MAX_MS / 1000} seconds`)
    if (i === 0) {
      if (r.ask !== 'blown') out.push('round 1 asks "which way did it blow"')
      if (r.gusts.length < 4) out.push('round 1 needs at least four gusts')
      if (r.gusts.some((g) => g.dir === 'calm' || breezeTurns(g))) out.push('round 1 has only plain gusts to the left or to the right')
      for (const d of ['left', 'right'] as const) if (ends.filter((e) => e === d).length < 2) out.push(`round 1: at least two gusts end to the ${d}`)
      for (const g of r.gusts) if (g.ms < 2000 || g.ms > 3200) out.push('round 1: a gust should last 2 to 3.2 seconds')
    } else if (i === 1) {
      if (r.ask !== 'now') out.push('round 2 asks "which way does it blow now"')
      if (r.gusts.length < 5) out.push('round 2 needs at least five gusts')
      if (r.gusts.filter(breezeTurns).length !== 3) out.push('round 2 needs exactly three gusts in which the wind turns')
      if (r.gusts.filter((g) => g.dir === 'calm').length !== 1) out.push('round 2 needs exactly one calm gust')
      if (r.gusts[0]?.dir === 'calm') out.push('round 2 does not begin with the calm')
      for (const g of r.gusts) if (g.ms < 2000 || g.ms > 3600) out.push('round 2: a gust should last 2 to 3.6 seconds')
      for (const g of r.gusts.filter(breezeTurns)) if (g.ms < 2400) out.push('round 2: a gust in which the wind turns needs at least 2.4 seconds')
    }
    // every gust ends one way only, and the tablet that is right for it exists
    for (const g of r.gusts) if (!['left', 'still', 'right'].includes(breezeAnswer(g))) out.push(`round ${n}: a gust has no answer`)
  })
  return out
}

// ================================================================ 2. the call of the shepherd (`hirtenruf`)

/** A place on the field: the middle of the feet (percent) and the width of the figure (percent of the width of the picture). */
export interface HerdSpot extends Pt {
  w: number
}
/** A sheep of round 1: its two pictures (standing, and with the head raised), its place and the smallest ring that reaches it (0, 1 or 2). */
export interface HerdSheep extends HerdSpot {
  id: string
  image: string
  hearing: string
  near: number
}
export type HerdSide = 'left' | 'right'
/**
 * A pass of round 2: which side the shepherd stands on, whether the stranger steps nearer to the sheep than the shepherd stands (`strangerNear`), whether the sheep run hesitantly
 * (`hesitant`: a short way, a pause, then on) and when the sheep start to run (`delay`, milliseconds after the start of the pass: both have called by then).
 */
export interface HerdTrial {
  shepherdSide: HerdSide
  strangerNear?: boolean
  hesitant?: boolean
  delay: number
}
/** `radius`: round 1, the ring grows with every call; `who`: round 2, the sheep show who the shepherd is. */
export interface HerdRound {
  hint: string
  mode: 'radius' | 'who'
  trials?: HerdTrial[]
}
/**
 * The game "The call of the shepherd" (`hirtenruf`): the morning pasture (3:2, no people, no animals), two bands of haze (1500 x 500, transparent, the code moves them), the soft golden ring
 * (400 x 400, transparent; the code lays it flat on the ground round the caller), the shepherd (on the hill in round 1) and the stranger, six sheep for round 1 and `slots` where they gather,
 * four sheep (`flock`, the first four of `sheep`) for round 2, the places of the two callers (`sides`) and where the sheep gather round each of them (`gather`), the radii of the three rings
 * (percent of the width) and the two rounds. `fogTop` is the top edge of the haze bands (percent), `figureRatio` the width / height of the shepherd and the stranger (300 x 450).
 */
export interface HerdCallGame {
  background: string
  ratio?: number
  fog: [string, string]
  fogTop: [number, number]
  ring: string
  shepherd: HerdSpot & { image: string }
  stranger: { image: string }
  figureRatio: number
  sheepRatio: number
  sheep: HerdSheep[]
  slots: HerdSpot[]
  radii: number[]
  flock: HerdSpot[]
  sides: Record<HerdSide, HerdSpot>
  gather: Record<HerdSide, HerdSpot[]>
  /** How far the stranger steps towards the middle when he stands nearer (units). */
  nearShift: number
  rounds: HerdRound[]
}

/** Two calls follow each other within this time: the second reaches farther (milliseconds). */
export const HERD_WINDOW_MS = 2000
/** How long the sheep need to run to the shepherd (milliseconds). */
export const HERD_RUN_MS = 2200
/** When the two callers call in a pass of round 2 (milliseconds after the start of the pass). */
export const HERD_CALLS_AT: [number, number] = [700, 2000]
/** A pass of round 2 may take at most this long (milliseconds). */
export const HERD_TRIAL_MAX_MS = 25000
/** The smallest finger target of a caller in the fog (pixels). */
export const HERD_TOUCH = 56
/** The ring lies flat on the ground: the component draws it squashed to this height (share of its width); the reach of a call is measured on the same squashed ellipse. */
export const HERD_FLAT = 0.45
/** A hesitant pass takes this much longer (milliseconds): a short way, a pause, then on. */
export const HERD_HESITATE_MS = 1000

/** The ring a call reaches: the first call of a series reaches ring 0, every call within `HERD_WINDOW_MS` the next one; after the last ring it begins small again. */
export const herdNextRing = (prev: number, rings = 3): number => (prev < 0 ? 0 : (prev + 1) % rings)
/** The distance of a sheep from the shepherd (units) on the flat ellipse of the ring: a sheep is reached when this is no more than the radius of the ring. */
export function herdFromShepherd(game: HerdCallGame, s: Pt): number {
  return ichbinDist(game.shepherd, s, (game.ratio ?? 1.5) * HERD_FLAT)
}
/** The smallest ring that reaches a sheep, or -1 when no ring does. */
export function herdSmallestRing(game: HerdCallGame, s: Pt): number {
  const d = herdFromShepherd(game, s)
  return game.radii.findIndex((r) => d <= r)
}
/** The sheep that hear a call of ring `ring` and have not come yet, the nearest first. */
export function herdHeard(game: HerdCallGame, ring: number, fetched: readonly string[]): string[] {
  const r = game.radii[ring] ?? 0
  return game.sheep
    .filter((s) => !fetched.includes(s.id) && herdFromShepherd(game, s) <= r)
    .sort((a, b) => herdFromShepherd(game, a) - herdFromShepherd(game, b))
    .map((s) => s.id)
}
/** The places of the two callers in a pass: the stranger steps towards the middle when he is to stand nearer. */
export function herdFigureSpots(game: HerdCallGame, trial: HerdTrial): { shepherd: HerdSpot; stranger: HerdSpot; shepherdSide: HerdSide; strangerSide: HerdSide } {
  const strangerSide: HerdSide = trial.shepherdSide === 'left' ? 'right' : 'left'
  const base = game.sides[strangerSide]
  const shift = trial.strangerNear ? game.nearShift * (strangerSide === 'left' ? 1 : -1) : 0
  return { shepherd: game.sides[trial.shepherdSide], stranger: { ...base, x: base.x + shift }, shepherdSide: trial.shepherdSide, strangerSide }
}
/** The side the child has to tap: where the shepherd stands. */
export const herdAnswer = (t: HerdTrial): HerdSide => t.shepherdSide
/** How long a pass takes without the thinking of the child (milliseconds). */
export const herdTrialMs = (t: HerdTrial): number => t.delay + HERD_RUN_MS + (t.hesitant ? HERD_HESITATE_MS : 0)
/** The middle of the sheep of the flock (units, for the nearness of the callers). */
export function herdFlockCentre(game: HerdCallGame): Pt {
  const n = Math.max(1, game.flock.length)
  return { x: game.flock.reduce((s, p) => s + p.x, 0) / n, y: game.flock.reduce((s, p) => s + p.y, 0) / n }
}
/** The size of the finger target of a caller in pixels on a phone (the figure is `w` percent wide). */
export function herdFigurePx(game: HerdCallGame, w: number): { w: number; h: number } {
  const wp = (w / 100) * ICHBIN_PHONE_W
  return { w: wp, h: wp / game.figureRatio }
}

/** The problems of the data of `hirtenruf` (an empty list is good). */
export function herdCallProblems(game: HerdCallGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the pasture')
  if (!game.fog?.[0] || !game.fog?.[1]) out.push('two bands of haze are needed')
  if (!game.ring) out.push('no picture of the ring')
  if (!game.shepherd?.image || !game.stranger?.image) out.push('the shepherd and the stranger need a picture')
  if (game.radii.length !== 3 || game.radii.some((r, i) => i > 0 && r <= game.radii[i - 1]!)) out.push('three rings, each larger than the one before')
  // ---- round 1
  if (game.sheep.length !== 6) out.push('round 1 needs six sheep')
  const ids = game.sheep.map((s) => s.id)
  if (new Set(ids).size !== ids.length) out.push('two sheep have the same id')
  const rings = [0, 0, 0]
  for (const s of game.sheep) {
    if (!s.image || !s.hearing) out.push(`${s.id}: needs a standing and a listening picture`)
    if (s.w * (ICHBIN_PHONE_W / 100) < 40) out.push(`${s.id}: smaller than 40 pixels on a phone`)
    if (s.x - s.w / 2 < 0 || s.x + s.w / 2 > 100 || s.y > 100 || s.y < 0) out.push(`${s.id}: lies outside the picture`)
    const k = herdSmallestRing(game, s)
    if (k < 0) out.push(`${s.id}: no ring reaches it`)
    else {
      rings[k] = (rings[k] ?? 0) + 1
      if (s.near !== k) out.push(`${s.id}: says it is reached by ring ${s.near} but ring ${k} is the first to reach it`)
    }
  }
  if (rings.some((c) => c < 2)) out.push('round 1 needs at least two sheep for each ring (otherwise the ring need not grow)')
  const d0 = game.sheep.filter((s) => herdFromShepherd(game, s) > (game.radii[0] ?? 0)).length
  const d1 = game.sheep.filter((s) => herdFromShepherd(game, s) > (game.radii[1] ?? 0)).length
  if (d0 < 2) out.push('at least two sheep must lie outside the first ring')
  if (d1 < 2) out.push('at least two sheep must lie outside the second ring')
  if (game.slots.length !== game.sheep.length) out.push('there must be as many places to gather as there are sheep')
  game.slots.forEach((a, i) => {
    if (a.x - a.w / 2 < 0 || a.x + a.w / 2 > 100 || a.y > 100 || a.y < 0) out.push(`place ${i + 1} to gather lies outside the picture`)
    game.slots.forEach((b, k) => {
      if (k > i && ichbinDist(a, b, ratio) < Math.max(a.w, b.w) * 0.8) out.push(`places ${i + 1} and ${k + 1} to gather overlap`)
    })
  })
  // ---- round 2
  if (game.flock.length !== 4) out.push('round 2 needs a flock of four')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const [r1, r2] = game.rounds
  if (r1 && (r1.mode !== 'radius' || !r1.hint)) out.push('round 1 is the round of the growing ring and needs a hint')
  if (r2 && (r2.mode !== 'who' || !r2.hint)) out.push('round 2 is the round of the callers and needs a hint')
  const trials = r2?.trials ?? []
  if (trials.length !== 3) out.push('round 2 has three passes')
  if (trials.length >= 3 && trials.every((t) => t.shepherdSide === trials[0]!.shepherdSide)) out.push('the shepherd must not stand on the same side in all three passes')
  for (let i = 2; i < trials.length; i++) if (trials[i]!.shepherdSide === trials[i - 1]!.shepherdSide && trials[i]!.shepherdSide === trials[i - 2]!.shepherdSide) out.push('the shepherd stands three times on one side in a row')
  const last = trials[2]
  if (last && !last.strangerNear) out.push('in the third pass the stranger stands nearer to the sheep than the shepherd')
  const cen = herdFlockCentre(game)
  trials.forEach((t, i) => {
    const n = i + 1
    if (herdTrialMs(t) > HERD_TRIAL_MAX_MS) out.push(`pass ${n}: lasts longer than ${HERD_TRIAL_MAX_MS / 1000} seconds`)
    if (t.delay < HERD_CALLS_AT[1] + 800) out.push(`pass ${n}: the sheep start before both have called`)
    const f = herdFigureSpots(game, t)
    const dSh = ichbinDist(cen, f.shepherd, ratio)
    const dSt = ichbinDist(cen, f.stranger, ratio)
    if (t.strangerNear && dSt >= dSh) out.push(`pass ${n}: the stranger should stand nearer to the sheep than the shepherd`)
    if (!t.strangerNear && Math.abs(dSt - dSh) > 3) out.push(`pass ${n}: the callers should stand equally far from the sheep`)
    for (const sp of [f.shepherd, f.stranger]) {
      const px = herdFigurePx(game, sp.w)
      if (px.w < HERD_TOUCH || px.h < HERD_TOUCH) out.push(`pass ${n}: a caller is smaller than ${HERD_TOUCH} x ${HERD_TOUCH} pixels on a phone`)
      if (sp.x - sp.w / 2 < 0 || sp.x + sp.w / 2 > 100) out.push(`pass ${n}: a caller stands outside the picture`)
    }
    // the two finger targets must not cover each other
    if (Math.abs(f.shepherd.x - f.stranger.x) < (f.shepherd.w + f.stranger.w) / 2) out.push(`pass ${n}: the two callers overlap`)
  })
  for (const side of ['left', 'right'] as const) {
    const g = game.gather[side]
    if (!g || g.length !== game.flock.length) out.push(`the sheep gather at ${side}: four places are needed`)
    // they gather round the caller of that side and nearer to him than the flock stood
    else if (g.some((p) => ichbinDist(p, game.sides[side], ratio) >= ichbinDist(cen, game.sides[side], ratio))) out.push(`the sheep gather at ${side}: the places must lie nearer to the caller than the flock`)
  }
  game.flock.forEach((s, i) => {
    if (s.w * (ICHBIN_PHONE_W / 100) < 40) out.push(`flock ${i + 1}: smaller than 40 pixels on a phone`)
  })
  // the help (the shepherd shines / the path of the sheep) names the shepherd's side in every pass: it solves every pass without a mistake
  for (const t of trials) if (herdAnswer(t) !== t.shepherdSide) out.push('the help does not name the shepherd')
  return out
}
