/**
 * The pure part of the game "Who is coming?" (`ausschau`, field `lookout`) of "Der verlorene Sohn" (id `sohn`, Luke 15,20: "But when he was yet a great way off, his father saw him").
 * The child looks down a long road from the gate of the farm. Walkers grow out of the haze, first small, pale and blurred, then clear and coloured; the child taps the son as soon as
 * he knows him. There is no time limit and no penalty for waiting: the son stops short of the gate and waits until he is tapped; the others walk past the gate and leave.
 * All places are percent of the picture (width and height); distances are in "units" (percent of the width), the vertical difference is shortened by the ratio of the picture.
 * The arithmetic has no clock and no dice of its own: the component says how many milliseconds have passed.
 */

export interface Pt {
  x: number
  y: number
}

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function offDist(a: Pt, b: Pt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/** The id of the son in the data of every round of `ausschau`. */
export const LOOKOUT_SON = 'sohn'
/** How long a walker who reached the gate needs to go off to the side (milliseconds). */
export const LOOKOUT_LEAVE_MS = 900
/** How far a walker at the gate goes off to the side while he leaves (units). */
export const LOOKOUT_LEAVE_DX = 14
/** The width of the screen the sizes are checked against (pixels) and the smallest size of a finger target (pixels). */
export const LOOKOUT_PHONE_W = 360
export const LOOKOUT_TOUCH = 44
/** The time a round may take at most (milliseconds). */
export const LOOKOUT_MAX_MS = 70000

/** A place on a lane: the middle of the feet (percent) and the width of the figure (percent of the width of the picture). */
export interface LookoutSpot extends Pt {
  w: number
}
/** A lane of the road: the walker starts at `from` (far, small) and ends at `to` (near the gate, big). */
export interface LookoutLane {
  from: LookoutSpot
  to: LookoutSpot
}
/**
 * A walker: his picture (transparent, the whole body, 'ratio' = width / height of the picture), what he is called in the sentence "That is …" (`name`) and what he looks like
 * when he is near (`look`, for screen readers; it says nothing that the picture does not show).
 */
export interface Walker {
  id: string
  name: string
  look: string
  image: string
  ratio: number
}
/** When a walker starts (milliseconds after the start of the round), which lane he takes and how long he needs from `from` to `to`. */
export interface LookoutArrival {
  walker: string
  lane: number
  delay: number
  dur: number
}
export interface LookoutRound {
  hint: string
  /** The id of the son (always `sohn`), so that the data say it too. */
  son: string
  order: LookoutArrival[]
}
/**
 * The game "Who is coming?" (`ausschau`): the view from the gate down the road (3:2, empty), the soft golden pool of light that is laid round the feet of the son when he is found (or
 * when the child asks for help; 400 x 400, transparent), the walkers, the lanes and two rounds. `haloW` is the width of the pool (percent of the width of the picture) at the end of the lane.
 */
export interface LookoutGame {
  background: string
  halo: string
  ratio?: number
  haloW: number
  walkers: Walker[]
  lanes: LookoutLane[]
  rounds: LookoutRound[]
}

/** How far a walker has come (0 = at the start, 1 = at the gate) `t` milliseconds after the start of the round. */
export function lookoutProgress(a: Pick<LookoutArrival, 'delay' | 'dur'>, t: number): number {
  return clamp((t - a.delay) / a.dur, 0, 1)
}
/** The place on the lane at `p` (0 to 1): coming nearer is faster on the screen than going far away (depth), so the way is bent a little (power 1.4). */
export function lookoutSpot(lane: LookoutLane, p: number): LookoutSpot {
  const s = clamp(p, 0, 1) ** 1.4
  return {
    x: lane.from.x + (lane.to.x - lane.from.x) * s,
    y: lane.from.y + (lane.to.y - lane.from.y) * s,
    w: lane.from.w + (lane.to.w - lane.from.w) * s
  }
}
/** The look of a walker at `p`: far away he is pale (opacity), blurred a little and without colour (saturate); near, everything is clear. */
export function lookoutHaze(p: number): { opacity: number; blur: number; saturate: number } {
  const k = clamp(p / 0.7, 0, 1)
  return { opacity: 0.55 + 0.45 * clamp(p / 0.5, 0, 1), blur: (1 - k) * 2.2, saturate: 0.3 + 0.7 * k }
}
/**
 * Where a walker is in his story: `before` (not yet on the road), `walk`, `stand` (the son waits at the gate), `leave` (the others go off to the side), `gone`.
 */
export type LookoutPhase = 'before' | 'walk' | 'stand' | 'leave' | 'gone'
export function lookoutPhase(a: LookoutArrival, t: number, isSon: boolean): LookoutPhase {
  if (t <= a.delay) return 'before'
  const end = a.delay + a.dur
  if (t < end) return 'walk'
  if (isSon) return 'stand'
  return t < end + LOOKOUT_LEAVE_MS ? 'leave' : 'gone'
}
/** The share (0 to 1) of the leaving, for the side step and the fading of a walker who has reached the gate. */
export const lookoutLeaveShare = (a: LookoutArrival, t: number): number => clamp((t - a.delay - a.dur) / LOOKOUT_LEAVE_MS, 0, 1)

/** When the last walker has reached the gate (milliseconds). */
export const lookoutRoundEnd = (round: Pick<LookoutRound, 'order'>): number => Math.max(0, ...round.order.map((a) => a.delay + a.dur))
/** The arrival of the son in a round (or `undefined`). */
export const lookoutSonOf = (round: LookoutRound): LookoutArrival | undefined => round.order.find((a) => a.walker === round.son)
/** A tap on a walker: right when it is the son of the round. */
export const lookoutIsSon = (round: Pick<LookoutRound, 'son'>, walker: string): boolean => walker === round.son

/** The size (pixels) of the figure of a walker at a spot on a screen as wide as `phoneW`; the picture is `ratio` times as wide as high, the field `fieldRatio` times as wide as high. */
export function lookoutBoxPx(spot: LookoutSpot, ratio: number, phoneW = LOOKOUT_PHONE_W): { w: number; h: number } {
  const w = (spot.w / 100) * phoneW
  return { w, h: w / ratio }
}
/** The finger target of a walker: at least 44 x 44 pixels, centred on the figure. */
export function lookoutTouchBox(spot: LookoutSpot, ratio: number, fieldRatio = 1.5, phoneW = LOOKOUT_PHONE_W): { left: number; right: number; top: number; bottom: number } {
  const { w, h } = lookoutBoxPx(spot, ratio, phoneW)
  const bw = Math.max(w, LOOKOUT_TOUCH)
  const bh = Math.max(h, LOOKOUT_TOUCH)
  const cx = (spot.x / 100) * phoneW
  const fy = (spot.y / 100) * (phoneW / fieldRatio)
  return { left: cx - bw / 2, right: cx + bw / 2, top: fy - bh, bottom: fy }
}

/** The problems of the data of `ausschau` (an empty list is good). */
export function lookoutProblems(game: LookoutGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.background) out.push('no picture of the road')
  if (!game.halo) out.push('no picture of the pool of light')
  if (game.haloW < 10 || game.haloW > 40) out.push('the pool of light should be between 10 and 40 percent wide')
  const ids = game.walkers.map((w) => w.id)
  if (new Set(ids).size !== ids.length) out.push('two walkers have the same id')
  if (!ids.includes(LOOKOUT_SON)) out.push('the son (id "sohn") is not among the walkers')
  for (const w of game.walkers) {
    if (!w.image) out.push(`walker ${w.id} has no picture`)
    if (!w.name || !w.look) out.push(`walker ${w.id} needs a name and a look`)
    if (!(w.ratio > 0.2 && w.ratio < 3)) out.push(`walker ${w.id}: the ratio of the picture is not sensible`)
  }
  if (game.lanes.length < 3) out.push('there must be at least three lanes (so that walkers pass each other)')
  game.lanes.forEach((l, i) => {
    for (const [k, s] of [['from', l.from], ['to', l.to]] as const) {
      if (s.x - s.w / 2 < 0 || s.x + s.w / 2 > 100 || s.y < 0 || s.y > 100) out.push(`lane ${i + 1}: ${k} reaches out of the picture`)
    }
    if (l.to.w * (LOOKOUT_PHONE_W / 100) < 40) out.push(`lane ${i + 1}: the figure is smaller than 40 pixels at the gate on a phone`)
    if (l.from.w >= l.to.w) out.push(`lane ${i + 1}: the figure must grow on the way to the gate`)
    if (l.from.y >= l.to.y) out.push(`lane ${i + 1}: the lane must lead down the picture, towards the gate`)
  })
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (r.son !== LOOKOUT_SON) out.push(`round ${n}: the son must be "${LOOKOUT_SON}"`)
    const sons = r.order.filter((a) => a.walker === r.son)
    if (sons.length !== 1) out.push(`round ${n}: there must be exactly one son (found ${sons.length})`)
    const ones = r.order.map((a) => a.walker)
    if (new Set(ones).size !== ones.length) out.push(`round ${n}: a walker comes twice`)
    for (const a of r.order) {
      if (!ids.includes(a.walker)) out.push(`round ${n}: unknown walker ${a.walker}`)
      if (a.lane < 0 || a.lane >= game.lanes.length) out.push(`round ${n}: ${a.walker} takes a lane that does not exist`)
      if (a.delay < 0) out.push(`round ${n}: ${a.walker} starts before the round`)
      if (a.dur < 6000 || a.dur > 30000) out.push(`round ${n}: ${a.walker} should need 6 to 30 seconds for the road`)
    }
    const son = sons[0]
    if (son) {
      const earliest = Math.min(...r.order.map((a) => a.delay))
      if (son.delay <= earliest) out.push(`round ${n}: the son must not be the first to come`)
      if (!r.order.some((a) => a !== son && a.delay > son.delay)) out.push(`round ${n}: somebody should still come after the son (so that waiting for the end is no trick)`)
    }
    if (r.order.length < 3 + i * 2) out.push(`round ${n}: not enough walkers (round 1 at least three, round 2 at least five)`)
    if (lookoutRoundEnd(r) > LOOKOUT_MAX_MS) out.push(`round ${n}: lasts longer than ${LOOKOUT_MAX_MS / 1000} seconds`)
    // two walkers on one lane must not be on it at the same time
    for (const a of r.order) {
      for (const b of r.order) {
        if (a !== b && a.lane === b.lane && a.delay < b.delay + b.dur && b.delay < a.delay + a.dur && a.walker < b.walker) out.push(`round ${n}: ${a.walker} and ${b.walker} are on lane ${a.lane + 1} at the same time`)
      }
    }
    // the son is never hidden for long behind a walker who is nearer (the nearer one wins the tap)
    if (son && game.lanes[son.lane]) {
      let seen = 0
      let hidden = 0
      for (let t = son.delay; t <= son.delay + son.dur; t += 200) {
        const sp = lookoutSpot(game.lanes[son.lane]!, lookoutProgress(son, t))
        const sw = game.walkers.find((w) => w.id === son.walker)
        if (!sw) break
        const sb = lookoutTouchBox(sp, sw.ratio, ratio)
        const cx = (sb.left + sb.right) / 2
        const cy = (sb.top + sb.bottom) / 2
        seen++
        for (const o of r.order) {
          if (o === son || !game.lanes[o.lane]) continue
          if (lookoutPhase(o, t, false) !== 'walk' && lookoutPhase(o, t, false) !== 'leave') continue
          const ow = game.walkers.find((w) => w.id === o.walker)
          if (!ow) continue
          const os = lookoutSpot(game.lanes[o.lane]!, lookoutProgress(o, t))
          if (os.y <= sp.y) continue
          const ob = lookoutTouchBox(os, ow.ratio, ratio)
          if (cx >= ob.left && cx <= ob.right && cy >= ob.top && cy <= ob.bottom) {
            hidden++
            break
          }
        }
      }
      if (seen > 0 && hidden / seen > 0.3) out.push(`round ${n}: the son is covered by a nearer walker for more than a third of his way`)
      // at the gate the son stands where nobody else comes to
      const sEnd = game.lanes[son.lane]!.to
      const sw = game.walkers.find((w) => w.id === son.walker)
      if (sw) {
        const sb = lookoutTouchBox(sEnd, sw.ratio, ratio)
        for (const o of r.order) {
          if (o === son || !game.lanes[o.lane]) continue
          const ow = game.walkers.find((w) => w.id === o.walker)
          if (!ow) continue
          const ob = lookoutTouchBox(game.lanes[o.lane]!.to, ow.ratio, ratio)
          const overlap = Math.min(sb.right, ob.right) - Math.max(sb.left, ob.left) > 8 && Math.min(sb.bottom, ob.bottom) - Math.max(sb.top, ob.top) > 8
          if (overlap) out.push(`round ${n}: ${o.walker} ends where the son waits (the finger targets overlap)`)
        }
      }
    }
  })
  if (game.rounds.length === 2) {
    if (game.rounds[1]!.order.length <= game.rounds[0]!.order.length) out.push('round 2 should have more walkers than round 1')
    const dur = (r: LookoutRound) => r.order.reduce((s, a) => s + a.dur, 0) / Math.max(1, r.order.length)
    if (dur(game.rounds[1]!) >= dur(game.rounds[0]!)) out.push('in round 2 the walkers should be faster than in round 1')
  }
  return out
}
