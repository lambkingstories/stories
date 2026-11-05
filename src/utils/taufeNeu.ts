/**
 * The pure parts of the three new games of "Der junge Jesus und die Taufe" (the components only show and listen; Anton's plan of games, 5.11.2026):
 * - "The scrolls" (`schriftrolle`, field `scroll`, Luke 2,46): in the temple a scroll is rolled up and down until the picture that is looked for stands in the window;
 * - "Sun and shade" (`schattenweg`, field `shadowWalk`, Matthew 4,1-2): the sun wanders over the wilderness, the child leads Jesus from shade to shade (rock, bush) to the big rock;
 * - "Light over Galilee" (`sonnenaufgang`, field `sunrise`, Matthew 4,16): the sun is pulled up along its arc until there is light over every village by the lake.
 * All places are percent of the picture; distances in "units" (percent of the width) through `osterDist`. The arithmetic has no clock and no dice: the components hand in the time.
 */
import { osterDist } from '@/utils/osternGames'
import type { Pt } from '@/utils/osternGames'

export type { Pt }

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
/** A rectangle in percent of a picture: left, top, width, height. */
export interface TaufeBox {
  x: number
  y: number
  w: number
  h: number
}
const boxInside = (b: TaufeBox): boolean => b.x >= 0 && b.y >= 0 && b.w > 0 && b.h > 0 && b.x + b.w <= 100.001 && b.y + b.h <= 100.001

// ================================================================ 1. the scrolls (`schriftrolle`)

/** A picture on the scroll (a square painted miniature) and its name (the hint, the screen reader). */
export interface ScrollTile {
  id: string
  image: string
  label: string
}
/**
 * One round: the pictures on the scroll from the top to the bottom (ids of `tiles`), the pictures to look for one after the other, the picture in the window at the start (index)
 * and how far a picture may stand from the middle of the window and still count (`tolerance`, a part of one step of the scroll).
 */
export interface ScrollRound {
  hint: string
  tiles: string[]
  find: string[]
  start: number
  tolerance: number
}
/**
 * The game "The scrolls" (`schriftrolle`): the temple behind it, the painted scroll (`frame`, its width divided by its height `frameRatio`), the window of blank parchment
 * on it (`window`, percent of the scroll picture) in which the pictures roll, the pictures and the rounds.
 */
export interface ScrollGame {
  background: string
  frame: string
  frameRatio: number
  window: TaufeBox
  tiles: ScrollTile[]
  rounds: ScrollRound[]
}

/** How wide a picture is in the window (part of the width of the window) and the step from one picture to the next (part of the side of a picture). */
export const SCROLL_TILE = 0.8
export const SCROLL_STEP = 1.14

/** The width of the window divided by its height. */
export const scrollWindowAspect = (game: ScrollGame): number => (game.window.w * game.frameRatio) / game.window.h

/** The side of a picture and one step of the scroll, as parts of the height of the window. */
export function scrollMetrics(game: ScrollGame): { side: number; step: number } {
  const side = SCROLL_TILE * scrollWindowAspect(game)
  return { side, step: side * SCROLL_STEP }
}

/** The place of the scroll kept on it: 0 is the first picture in the middle of the window, `count - 1` the last. */
export const scrollClamp = (pos: number, count: number): number => clamp(pos, 0, Math.max(0, count - 1))

/** The picture nearest to the middle of the window and how far it stands from it (in steps, + = below the middle). */
export function scrollNearest(pos: number, count: number): { index: number; off: number } {
  const p = scrollClamp(pos, count)
  const index = clamp(Math.round(p), 0, Math.max(0, count - 1))
  return { index, off: index - p }
}

/** Where a picture stands in the window (top edge, percent of the height of the window): the picture `index` is in the middle when `pos` = `index`. */
export function scrollTileTop(game: ScrollGame, index: number, pos: number): number {
  const { side, step } = scrollMetrics(game)
  return (0.5 + (index - pos) * step - side / 2) * 100
}

/**
 * The child says "That is it!" with the scroll at `pos` while it looks for `find[want]`: `off` = no picture stands in the middle (no mistake, roll on a little),
 * `right` = the picture looked for, `wrong` = another picture (a mistake).
 */
export function scrollCheck(round: ScrollRound, pos: number, want: number): 'off' | 'right' | 'wrong' {
  const { index, off } = scrollNearest(pos, round.tiles.length)
  if (Math.abs(off) > round.tolerance) return 'off'
  return round.tiles[index] === round.find[want] ? 'right' : 'wrong'
}

/** Where the picture `find[want]` lies on the scroll (its index; -1 when it is not there): the goal of "Help me". */
export const scrollTarget = (round: ScrollRound, want: number): number => round.tiles.indexOf(round.find[want] ?? '')

/** The picture of an id. */
export const scrollTile = (game: ScrollGame, id: string): ScrollTile | undefined => game.tiles.find((t) => t.id === id)

/** The problems of the data of `schriftrolle` (an empty list is good). */
export function scrollProblems(game: ScrollGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the temple')
  if (!game.frame) out.push('no picture of the scroll')
  if (!(game.frameRatio > 0.3 && game.frameRatio < 2)) out.push('the ratio of the scroll picture is strange')
  if (!boxInside(game.window)) out.push('the window lies outside the scroll picture')
  const ids = game.tiles.map((t) => t.id)
  if (new Set(ids).size !== ids.length) out.push('two pictures have the same id')
  for (const t of game.tiles) {
    if (!t.image) out.push(`the picture "${t.id}" has no file`)
    if (!t.label) out.push(`the picture "${t.id}" has no name`)
  }
  const { side, step } = scrollMetrics(game)
  if (side > 0.92) out.push('a picture is higher than the window (the window is too flat)')
  if (step * 2 < 1.02 && side < 0.3) out.push('the pictures are too small in the window')
  if (game.rounds.length < 2) out.push('the game needs two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (r.tiles.length < 4) out.push(`round ${n}: fewer than four pictures on the scroll`)
    if (new Set(r.tiles).size !== r.tiles.length) out.push(`round ${n}: a picture is twice on the scroll`)
    for (const id of r.tiles) if (!ids.includes(id)) out.push(`round ${n}: the picture "${id}" does not exist`)
    if (r.find.length < 2) out.push(`round ${n}: fewer than two pictures to look for`)
    if (new Set(r.find).size !== r.find.length) out.push(`round ${n}: a picture is looked for twice`)
    for (const id of r.find) if (!r.tiles.includes(id)) out.push(`round ${n}: "${id}" is looked for but not on the scroll`)
    if (!Number.isInteger(r.start) || r.start < 0 || r.start >= r.tiles.length) out.push(`round ${n}: the start picture does not exist`)
    else if (r.tiles[r.start] === r.find[0]) out.push(`round ${n}: the first picture looked for is already in the window`)
    if (!(r.tolerance >= 0.12 && r.tolerance <= 0.45)) out.push(`round ${n}: the tolerance must lie between 0.12 and 0.45`)
    // one after the other the pictures looked for must lie apart (the child rolls between them)
    for (let k = 1; k < r.find.length; k++) if (Math.abs(r.tiles.indexOf(r.find[k]!) - r.tiles.indexOf(r.find[k - 1]!)) < 2) out.push(`round ${n}: "${r.find[k]}" lies right next to "${r.find[k - 1]}"`)
  })
  const [a, b] = game.rounds
  if (a && b) {
    if (b.tiles.length <= a.tiles.length) out.push('round 2 must have a longer scroll than round 1')
    if (b.find.length < a.find.length) out.push('round 2 must look for at least as many pictures as round 1')
    if (b.tolerance >= a.tolerance) out.push('round 2 must be more exact than round 1 (smaller tolerance)')
  }
  return out
}

// ================================================================ 2. sun and shade (`schattenweg`)

/** The desert picture is 3:2 (width / height). */
export const SHADE_RATIO = 1.5
/** How much nearer than the edge of a shadow a tap may be (units). */
export const SHADE_PICK = 5
/** How much faster the heat falls in the shade than it grows in the sun (a short rest in a shadow cools Jesus down). */
export const SHADE_COOL = 4
/** Jesus is at the place he walks to when he is this near (units). */
export const SHADE_ARRIVE = 0.6

/** A thing that gives shade (a rock, a bush): its picture (width / height of the sprite = `ratio`), its name and its width in percent of the picture. */
export interface ShadeThing {
  id: string
  image: string
  label: string
  w: number
  ratio: number
}
/**
 * A thing in the desert: the foot of the thing (percent), how far its shadow moves to the side when the sun is low (`reach`, units), the half width of its shadow at noon (`size`, units).
 * `goal`: the big rock at the end of the way.
 */
export interface ShadePlace {
  thing: string
  x: number
  y: number
  reach: number
  size: number
  goal?: boolean
}
/**
 * One round: the things, where Jesus starts (in the shade of `places[start]`), how long the sun takes from the morning to the evening (seconds), how many seconds Jesus may stand in the sun
 * before it is too hot (`heat`) and how fast he walks (units a second).
 */
export interface ShadeRound {
  hint: string
  places: ShadePlace[]
  start: number
  seconds: number
  heat: number
  speed: number
}
/**
 * The game "Sun and shade" (`schattenweg`): the desert (3:2), Jesus as a sprite (`walker`, standing, facing right; width `walkerW` percent, width / height `walkerRatio`),
 * the sun, the soft shadow (a picture that is stretched to the ellipse) and the things.
 */
export interface ShadowWalkGame {
  background: string
  walker: string
  walkerW: number
  walkerRatio: number
  sun: string
  sunW: number
  shadow: string
  things: ShadeThing[]
  rounds: ShadeRound[]
}
/** A shadow on the ground: the middle (percent) and the half width and half height (units). */
export interface ShadeShadow {
  x: number
  y: number
  rx: number
  ry: number
}

/** Where the sun stands at the time `t` (0 morning in the east = left, 1 evening in the west = right): on an arc over the sky (percent). */
export function shadeSun(t: number): Pt {
  const u = clamp(t, 0, 1)
  return { x: 8 + 84 * u, y: 21 - 15 * Math.sin(Math.PI * u) }
}

/** The shadow of a place at the time `t`: it falls away from the sun (to the right in the morning, to the left in the evening) and is longer when the sun is low. */
export function shadeShadow(p: ShadePlace, t: number): ShadeShadow {
  const u = clamp(t, 0, 1)
  const low = Math.abs(1 - 2 * u)
  const rx = p.size * (1 + 0.5 * low)
  return { x: p.x + p.reach * (1 - 2 * u), y: p.y + 0.6, rx, ry: Math.max(1.6, p.size * 0.42) }
}

/** How far a point lies inside a shadow: < 1 inside, 1 on the edge (the vertical difference counts in units). */
export function shadeIn(s: ShadeShadow, p: Pt, ratio = SHADE_RATIO): number {
  const dx = (p.x - s.x) / s.rx
  const dy = (p.y - s.y) / ratio / s.ry
  return Math.hypot(dx, dy)
}

/** The places in whose shadow a point stands at the time `t` (indices). */
export function shadeUnder(round: ShadeRound, p: Pt, t: number): number[] {
  return round.places.map((pl, i) => (shadeIn(shadeShadow(pl, t), p) <= 1 ? i : -1)).filter((i) => i >= 0)
}

/** The place a tap means: the shadow (or the thing) nearest to the tap, within `SHADE_PICK` units of its edge; -1 none. */
export function shadePick(round: ShadeRound, things: readonly ShadeThing[], p: Pt, t: number): number {
  let best = -1
  let bestD = Infinity
  round.places.forEach((pl, i) => {
    const s = shadeShadow(pl, t)
    const edge = Math.max(0, shadeIn(s, p) - 1) * s.rx
    // the thing itself: a tap on the rock means its shadow, too
    const th = things.find((x) => x.id === pl.thing)
    const w = th?.w ?? 8
    const h = th ? (w / th.ratio) * SHADE_RATIO : 8
    const onThing = p.x >= pl.x - w / 2 && p.x <= pl.x + w / 2 && p.y >= pl.y - h && p.y <= pl.y + 1
    const d = onThing ? 0 : edge
    if (d <= SHADE_PICK && d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** The state of a round: the time of the sun, where Jesus stands, where he walks to (a place, -1 none), how hot it is (seconds in the sun), the mistakes, whether he is at the goal. */
export interface ShadeState {
  t: number
  at: Pt
  to: number
  heat: number
  mistakes: number
  done: boolean
  /** The last places Jesus reached (for "Go on"). */
  reached: number[]
}

/** The start of a round: Jesus stands in the middle of the shadow of the start place in the morning. */
export function shadeStart(round: ShadeRound): ShadeState {
  const s = shadeShadow(round.places[round.start]!, 0)
  return { t: 0, at: { x: s.x, y: s.y }, to: -1, heat: 0, mistakes: 0, done: false, reached: [round.start] }
}

/** The index of the goal (the first place with `goal`). */
export const shadeGoal = (round: ShadeRound): number => round.places.findIndex((p) => p.goal)

/** What happened in one step of time (for the words and the sounds of the component). */
export type ShadeEvent = 'arrived' | 'goal' | 'hot' | null

/**
 * One step of `dt` seconds: the sun wanders on, Jesus walks towards the shadow of the place he goes to (it moves with the sun), the heat grows in the sun and falls in the shade (`SHADE_COOL` times as fast).
 * When the heat reaches `round.heat`, that is a mistake: Jesus goes to the nearest shadow by himself (`hot`). Standing in the shadow of the goal ends the round (`goal`).
 */
export function shadeStep(round: ShadeRound, s: ShadeState, dt: number): { state: ShadeState; event: ShadeEvent } {
  if (s.done) return { state: s, event: null }
  const t = Math.min(1, s.t + dt / round.seconds)
  let at = s.at
  let to = s.to
  let event: ShadeEvent = null
  const reached = s.reached.slice()
  if (to >= 0) {
    const sh = shadeShadow(round.places[to]!, t)
    const goal = { x: sh.x, y: sh.y }
    const d = osterDist(at, goal, SHADE_RATIO)
    const stepLen = round.speed * dt
    if (d <= Math.max(stepLen, SHADE_ARRIVE)) {
      at = goal
      if (!reached.includes(to)) reached.push(to)
      to = -1
      event = 'arrived'
    } else {
      const f = stepLen / d
      at = { x: at.x + (goal.x - at.x) * f, y: at.y + (goal.y - at.y) * f }
    }
  }
  const shaded = shadeUnder(round, at, t)
  let heat = shaded.length ? Math.max(0, s.heat - SHADE_COOL * dt) : s.heat + dt
  let mistakes = s.mistakes
  const g = shadeGoal(round)
  if (g >= 0 && shaded.includes(g)) {
    if (!reached.includes(g)) reached.push(g)
    return { state: { t, at, to: -1, heat: 0, mistakes, done: true, reached }, event: 'goal' }
  }
  if (heat >= round.heat) {
    mistakes++
    heat = 0
    to = shadeNearest(round, at, t)
    event = 'hot'
  }
  return { state: { t, at, to, heat, mistakes, done: false, reached }, event }
}

/** The place whose shadow is nearest to a point (the middle of the shadow). */
export function shadeNearest(round: ShadeRound, p: Pt, t: number): number {
  let best = 0
  let bestD = Infinity
  round.places.forEach((pl, i) => {
    const s = shadeShadow(pl, t)
    const d = Math.max(0, shadeIn(s, p) - 1) * s.rx
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** How many seconds Jesus would walk in the sun on the straight way from `p` to the shadow of place `i` (sampled; the shadows move meanwhile). */
export function shadeSunOnWay(round: ShadeRound, p: Pt, t: number, i: number): number {
  let at = p
  let tt = t
  let sun = 0
  const dt = 0.05
  for (let k = 0; k < 4000; k++) {
    tt = Math.min(1, tt + dt / round.seconds)
    const sh = shadeShadow(round.places[i]!, tt)
    const d = osterDist(at, sh, SHADE_RATIO)
    if (d <= Math.max(round.speed * dt, SHADE_ARRIVE)) return sun
    const f = (round.speed * dt) / d
    at = { x: at.x + (sh.x - at.x) * f, y: at.y + (sh.y - at.y) * f }
    if (!shadeUnder(round, at, tt).length) sun += dt
  }
  return Infinity
}

/**
 * The place "Help me" leads to: the goal when the way there is short enough in the sun; otherwise, of the places whose way stays under the heat (with a margin),
 * the one whose shadow is nearest to the goal and nearer to it than Jesus. -1 when there is none.
 */
export function shadeHelp(round: ShadeRound, s: ShadeState): number {
  const g = shadeGoal(round)
  if (g < 0 || s.done) return -1
  const safe = round.heat * 0.8 - s.heat
  if (shadeSunOnWay(round, s.at, s.t, g) <= safe) return g
  const goalAt = shadeShadow(round.places[g]!, s.t)
  const here = osterDist(s.at, goalAt, SHADE_RATIO)
  const under = shadeUnder(round, s.at, s.t)
  let best = -1
  let bestD = Infinity
  round.places.forEach((pl, i) => {
    if (i === g || under.includes(i)) return
    const d = osterDist(shadeShadow(pl, s.t), goalAt, SHADE_RATIO)
    if (d >= here - 1) return
    if (shadeSunOnWay(round, s.at, s.t, i) > safe) return
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/** Plays a round with "Help me" only (steps of 50 ms): whether the goal is reached, the mistakes, how many places were walked to and the seconds it took. */
export function shadeSimulate(round: ShadeRound, limit = 600): { done: boolean; mistakes: number; hops: number; seconds: number } {
  let s = shadeStart(round)
  let hops = 0
  const dt = 0.05
  let time = 0
  while (!s.done && time < limit) {
    if (s.to < 0) {
      const h = shadeHelp(round, s)
      if (h >= 0) {
        s = { ...s, to: h }
        hops++
      }
    }
    s = shadeStep(round, s, dt).state
    time += dt
  }
  return { done: s.done, mistakes: s.mistakes, hops, seconds: time }
}

/** The problems of the data of `schattenweg` (an empty list is good). */
export function shadeProblems(game: ShadowWalkGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the desert')
  if (!game.walker) out.push('no picture of Jesus')
  if (!game.sun) out.push('no picture of the sun')
  if (!game.shadow) out.push('no picture of the shadow')
  // on a phone the field is about 360 x 240 pixels: Jesus at least 7 % wide (25 px) and 25 % high (60 px)
  if (game.walkerW < 7 || (game.walkerW / game.walkerRatio) * SHADE_RATIO < 25) out.push('Jesus is too small on a phone (at least 7 % wide and 25 % high)')
  if (game.sunW < 9) out.push('the sun is too small')
  const ids = game.things.map((t) => t.id)
  if (new Set(ids).size !== ids.length) out.push('two things have the same id')
  for (const t of game.things) {
    if (!t.image) out.push(`the thing "${t.id}" has no picture`)
    if (!t.label) out.push(`the thing "${t.id}" has no name`)
    if (!(t.ratio > 0.2 && t.ratio < 5)) out.push(`the thing "${t.id}" has a strange ratio`)
    if (t.w < 8) out.push(`the thing "${t.id}" is too small on a phone`)
  }
  if (game.rounds.length < 2) out.push('the game needs two rounds')
  const sims = game.rounds.map((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (r.places.length < 4) out.push(`round ${n}: fewer than four things`)
    if (r.places.filter((p) => p.goal).length !== 1) out.push(`round ${n}: there must be exactly one goal`)
    if (!r.places[r.start]) out.push(`round ${n}: the start place does not exist`)
    else if (r.places[r.start]!.goal) out.push(`round ${n}: Jesus starts at the goal`)
    if (!(r.seconds >= 20)) out.push(`round ${n}: the sun is too fast`)
    if (!(r.heat >= 1.2)) out.push(`round ${n}: the heat comes too soon`)
    if (!(r.speed >= 3 && r.speed <= 20)) out.push(`round ${n}: Jesus walks too slowly or too fast`)
    r.places.forEach((p, k) => {
      const th = game.things.find((x) => x.id === p.thing)
      if (!th) {
        out.push(`round ${n}: the thing "${p.thing}" does not exist`)
        return
      }
      const h = (th.w / th.ratio) * SHADE_RATIO
      if (p.x - th.w / 2 < 0 || p.x + th.w / 2 > 100 || p.y - h < 24 || p.y > 99) out.push(`round ${n}: thing ${k + 1} (${p.thing}) lies outside the ground`)
      for (const t of [0, 0.5, 1]) {
        const s = shadeShadow(p, t)
        if (s.x - s.rx * 0.5 < 0 || s.x + s.rx * 0.5 > 100) out.push(`round ${n}: the shadow of thing ${k + 1} leaves the picture at the time ${t}`)
      }
      if (p.size < 3.2) out.push(`round ${n}: the shadow of thing ${k + 1} is too small to stand in`)
      r.places.forEach((o, m) => {
        if (m <= k) return
        const tm = game.things.find((x) => x.id === o.thing)
        if (tm && Math.abs(p.x - o.x) < (th.w + tm.w) / 2 * 0.8 && Math.abs(p.y - o.y) < 6) out.push(`round ${n}: things ${k + 1} and ${m + 1} stand on each other`)
      })
    })
    const g = shadeGoal(r)
    if (g >= 0 && r.places[r.start] && !r.places[r.start]!.goal) {
      const st = shadeStart(r)
      if (shadeUnder(r, st.at, 0).includes(g)) out.push(`round ${n}: Jesus starts in the shadow of the goal`)
      const direct = shadeSunOnWay(r, st.at, 0, g)
      if (direct <= r.heat) out.push(`round ${n}: the goal can be reached in one walk (too easy)`)
      const sim = shadeSimulate(r)
      if (!sim.done) out.push(`round ${n}: "Help me" does not reach the goal`)
      else if (sim.mistakes > 0) out.push(`round ${n}: "Help me" makes ${sim.mistakes} mistakes on the way`)
      if (sim.hops < 2) out.push(`round ${n}: the way has fewer than two stops`)
      return sim
    }
    return null
  })
  const [a, b] = game.rounds
  if (a && b) {
    if (b.heat > a.heat) out.push('round 2 must not allow more time in the sun than round 1')
    if (b.places.length <= a.places.length) out.push('round 2 must have more things than round 1')
    if (sims[0] && sims[1] && sims[1].hops <= sims[0].hops) out.push('round 2 must need more stops than round 1')
  }
  return out
}

// ================================================================ 3. light over Galilee (`sonnenaufgang`)

/** The lake picture is 3:2 (width / height). */
export const SUNRISE_RATIO = 1.5

/** A village by the lake: its picture, its name, its foot (percent), its width (percent) and the part of the arc on which the sun gives it light (`from` to `to`, 0 = left horizon, 1 = right horizon). */
export interface SunVillage {
  image: string
  name: string
  x: number
  y: number
  w: number
  from: number
  to: number
}
/** One round: the villages and where the sun stands at the start (on the arc, 0 to 1). */
export interface SunRound {
  hint: string
  villages: SunVillage[]
  start: number
}
/**
 * The game "Light over Galilee" (`sonnenaufgang`): the lake at dawn, the sun (`sunW` percent wide), the soft glow over a village in the light, the bead that marks the arc,
 * the arc of the sun (middle `cx`, `cy` = the horizon, half width `rx`, height `ry`, all percent), how long the sun must stay with light over all villages while the finger holds it (`hold`, seconds), and the rounds.
 */
export interface SunGame {
  background: string
  sun: string
  sunW: number
  glow: string
  bead: string
  arc: { cx: number; cy: number; rx: number; ry: number }
  hold: number
  rounds: SunRound[]
}

/** Where the sun stands at the place `p` of the arc (0 left horizon, 0.5 top, 1 right horizon), percent of the picture. */
export function sunAt(game: SunGame, p: number): Pt {
  const a = Math.PI * (1 - clamp(p, 0, 1))
  return { x: game.arc.cx + game.arc.rx * Math.cos(a), y: game.arc.cy - game.arc.ry * Math.sin(a) }
}

/** The place on the arc nearest to a point of the picture (the finger): its angle around the middle of the arc; below the horizon it stays at the nearer end. */
export function sunFromPoint(game: SunGame, pt: Pt): number {
  const u = (pt.x - game.arc.cx) / game.arc.rx
  const v = (game.arc.cy - pt.y) / game.arc.ry
  if (v <= 0) return u < 0 ? 0 : 1
  const a = Math.atan2(v, u)
  return clamp(1 - a / Math.PI, 0, 1)
}

/** The villages that have light with the sun at `p`. */
export const sunLit = (round: SunRound, p: number): boolean[] => round.villages.map((v) => p >= v.from - 1e-9 && p <= v.to + 1e-9)

/** Light over every village. */
export const sunAllLit = (round: SunRound, p: number): boolean => sunLit(round, p).every(Boolean)

/** The part of the arc with light over every village: [from, to] (to < from when there is none). */
export function sunWindow(round: SunRound): [number, number] {
  return [Math.max(...round.villages.map((v) => v.from)), Math.min(...round.villages.map((v) => v.to))]
}

/** The place of "Help me": the middle of the window. */
export function sunHelp(round: SunRound): number {
  const [a, b] = sunWindow(round)
  return (a + b) / 2
}

/** The places of the beads along the arc (percent), `n` of them from horizon to horizon. */
export function sunBeads(game: SunGame, n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => sunAt(game, i / (n - 1)))
}

/** The problems of the data of `sonnenaufgang` (an empty list is good). */
export function sunriseProblems(game: SunGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the lake')
  if (!game.sun) out.push('no picture of the sun')
  if (!game.glow) out.push('no picture of the glow')
  if (!game.bead) out.push('no picture of the beads')
  if (game.sunW < 10) out.push('the sun is too small to take with a finger on a phone')
  const { cx, cy, rx, ry } = game.arc
  const half = game.sunW / 2
  if (cx - rx - half < 0 || cx + rx + half > 100) out.push('the arc leaves the picture at the side')
  if (cy - ry - half * SUNRISE_RATIO < 0) out.push('the sun leaves the picture at the top')
  if (cy > 60) out.push('the horizon of the arc is too low')
  if (!(game.hold >= 0.4 && game.hold <= 3)) out.push('the time to hold must lie between 0.4 and 3 seconds')
  if (game.rounds.length < 2) out.push('the game needs two rounds')
  const widths = game.rounds.map((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (r.villages.length < 3) out.push(`round ${n}: fewer than three villages`)
    r.villages.forEach((v, k) => {
      if (!v.image) out.push(`round ${n}: village ${k + 1} has no picture`)
      if (!v.name) out.push(`round ${n}: village ${k + 1} has no name`)
      if (!(v.from >= 0 && v.to <= 1 && v.from < v.to)) out.push(`round ${n}: the light of village ${k + 1} is not a part of the arc`)
      if (v.from <= 0 && v.to >= 1) out.push(`round ${n}: village ${k + 1} always has light`)
      if (v.w < 11) out.push(`round ${n}: village ${k + 1} is too small on a phone`)
      if (v.x - v.w / 2 < 0 || v.x + v.w / 2 > 100 || v.y > 100 || v.y < cy) out.push(`round ${n}: village ${k + 1} lies outside the shore`)
      r.villages.forEach((o, m) => {
        if (m > k && Math.abs(v.x - o.x) < (v.w + o.w) / 2 * 0.85 && Math.abs(v.y - o.y) < 9) out.push(`round ${n}: villages ${k + 1} and ${m + 1} lie on each other`)
      })
    })
    const [a, b] = sunWindow(r)
    const w = b - a
    if (w < 0.06) out.push(`round ${n}: the part of the arc with light over all villages is too small (${w.toFixed(3)})`)
    if (w > 0.4) out.push(`round ${n}: the part of the arc with light over all villages is too big (too easy)`)
    if (sunAllLit(r, r.start)) out.push(`round ${n}: at the start there is light over all villages`)
    if (!(r.start >= 0 && r.start < a)) out.push(`round ${n}: the sun must start low on the left, before the light`)
    return w
  })
  if (widths.length >= 2 && widths[1]! >= widths[0]!) out.push('round 2 must be harder: a smaller part of the arc with light over all villages')
  if (game.rounds.length >= 2 && game.rounds[1]!.villages.length <= game.rounds[0]!.villages.length) out.push('round 2 must have more villages')
  return out
}
