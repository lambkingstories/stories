/**
 * The pure parts of the three new games of "Ester" (5.11.2026, Anton's plan "A"; the components only show and listen):
 * 1. "Listening at the gate" (`tor`, field `gateWatch`, Esther 2,21-23): Mordecai sits in the king's gate; the child taps the two doorkeepers exactly while they put their heads together.
 * 2. "The sceptre" (`zepter`, field `sceptre`, Esther 5,1-2): the child leads Esther's hand calmly to the top of the golden sceptre, which moves a little.
 * 3. "Messengers ride out" (`boten`, field `riders`, Esther 8,9-10): every letter is sealed with the king's ring, then its rider is sent off in the direction of its land on the map.
 * All places are percent of the picture: x a part of the width, y a part of the height. Distances are "units" (percent of the width): the vertical difference is divided by the ratio of the picture.
 * The arithmetic has no clock and no dice: the components count the time and give it in.
 */
import { osterStars } from '@/utils/osternGames'

export interface Pt {
  x: number
  y: number
}

/** Stars at the end of every game: the same as `osterStars` (up to two mistakes three stars, up to four two, then one). */
export const esterStars = (mistakes: number): number => osterStars(Math.max(0, mistakes))

/** The distance of two places in units (percent of the width); `ratio` is width / height of the picture. */
export const esterDist = (a: Pt, b: Pt, ratio: number): number => Math.hypot(a.x - b.x, (a.y - b.y) / ratio)

const inside = (p: Pt, pad = 0) => p.x >= pad && p.x <= 100 - pad && p.y >= pad && p.y <= 100 - pad

// ================================================================ 1. listening at the gate (`tor`)

/**
 * The two doorkeepers as one picture in two states (cut from one sheet, the same scale, standing at the bottom middle): `apart` (they stand upright at their post) and `whisper`
 * (their heads together). `x`, `y`: where their feet stand (percent), `w`: the width of the picture (percent of the field), `ratio`: width / height of the picture,
 * `split`: where in the picture (0 to 1 from the left) the first doorkeeper ends and the second begins (the two tapping areas), `names`: the two doorkeepers.
 */
export interface GateGuards {
  apart: string
  whisper: string
  x: number
  y: number
  w: number
  ratio: number
  split: number
  top: number
  names: [string, string]
}
/**
 * One round: the hint, how many times Mordecai must hear them (`need`), how long they stand apart before each whispering (`pattern`, milliseconds, used again from the start
 * when it runs out) and how long they whisper (`whisperMs`).
 */
export interface GateRound {
  hint: string
  need: number
  pattern: number[]
  whisperMs: number
}
/** The game "Listening at the gate": the gate with Mordecai on his bench (`background`, `ratio` = width / height), the doorkeepers and the rounds. */
export interface GateGame {
  background: string
  ratio: number
  guards: GateGuards
  rounds: GateRound[]
}

/** A child needs this long at least to see the heads go together and tap twice (milliseconds). */
export const GATE_MIN_WHISPER = 1200
/** And this long before the first whispering, to look at the picture. */
export const GATE_MIN_FIRST = 1500

/** Where the round is at time `t` (milliseconds since its start): whispering or not, the number of the whispering (`cycle`, from 0), and how long the state still lasts. */
export function gatePhase(round: GateRound, t: number): { whisper: boolean; cycle: number; left: number } {
  let at = 0
  for (let cycle = 0; cycle < 10000; cycle++) {
    const apart = round.pattern[cycle % round.pattern.length]!
    if (t < at + apart) return { whisper: false, cycle, left: at + apart - t }
    at += apart
    if (t < at + round.whisperMs) return { whisper: true, cycle, left: at + round.whisperMs - t }
    at += round.whisperMs
  }
  return { whisper: false, cycle: 10000, left: 0 }
}

/** What Mordecai has heard so far: how often (`heard`), and in which whispering which doorkeepers were tapped. */
export interface GateState {
  heard: number
  cycle: number
  tapped: number[]
}
export const gateStart = (): GateState => ({ heard: 0, cycle: -1, tapped: [] })

/**
 * A tap on doorkeeper `guard` (0 or 1; -1 = both at once, the Enter key) at time `t`:
 * `apart` (they do not whisper now: a mistake), `one` (one of the two is tapped, the other is still missing), `again` (that one is tapped already), `heard` (both are tapped in this whispering).
 */
export function gateTap(round: GateRound, st: GateState, t: number, guard: number): { state: GateState; verdict: 'apart' | 'one' | 'again' | 'heard' } {
  const ph = gatePhase(round, t)
  if (!ph.whisper) return { state: st, verdict: 'apart' }
  // a whispering where Mordecai has heard already: nothing more to do
  const tapped = st.cycle === ph.cycle ? st.tapped : []
  if (st.cycle === ph.cycle && tapped.length >= 2) return { state: st, verdict: 'again' }
  const add = guard < 0 ? [0, 1] : [guard]
  const next = [...new Set([...tapped, ...add])].sort()
  if (next.length === tapped.length) return { state: st, verdict: 'again' }
  if (next.length >= 2) return { state: { heard: st.heard + 1, cycle: ph.cycle, tapped: next }, verdict: 'heard' }
  return { state: { heard: st.heard, cycle: ph.cycle, tapped: next }, verdict: 'one' }
}

/** The round is done when Mordecai has heard them often enough. */
export const gateDone = (round: GateRound, st: GateState): boolean => st.heard >= round.need

/** The two tapping areas (left, top, width, height in percent of the field): the first doorkeeper left of `split`, the second right of it. */
export function gateAreas(game: GateGame): { x: number; y: number; w: number; h: number }[] {
  const g = game.guards
  const h = (g.w / g.ratio) * game.ratio
  const left = g.x - g.w / 2
  const top = g.y - h + h * g.top
  const hh = h * (1 - g.top)
  return [
    { x: left, y: top, w: g.w * g.split, h: hh },
    { x: left + g.w * g.split, y: top, w: g.w * (1 - g.split), h: hh }
  ]
}

/** The problems of the data of `tor` (an empty list is good). */
export function gateProblems(game: GateGame): string[] {
  const out: string[] = []
  const g = game.guards
  if (!game.background) out.push('no picture of the gate')
  if (!(game.ratio > 0.5 && game.ratio < 3)) out.push('the ratio of the picture is odd')
  if (!g.apart || !g.whisper) out.push('a picture of the doorkeepers is missing')
  if (!g.names[0] || !g.names[1]) out.push('the doorkeepers have no names')
  if (!(g.split > 0.3 && g.split < 0.7)) out.push('the line between the two doorkeepers is odd')
  if (!(g.top >= 0 && g.top < 0.5)) out.push('the top of the tapping areas is odd')
  // every doorkeeper is a big target on a phone: at least 12 % of the width (about 44 pixels at 360)
  const areas = gateAreas(game)
  areas.forEach((a, i) => {
    if (a.w < 12) out.push(`the doorkeeper ${i + 1} is too narrow for a finger (${a.w.toFixed(1)} %)`)
    if (a.x < 0 || a.y < 0 || a.x + a.w > 100.01 || a.y + a.h > 100.01) out.push(`the doorkeeper ${i + 1} sticks out of the picture`)
  })
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (r.need < 2) out.push(`round ${n}: Mordecai must hear them at least twice`)
    if (!r.pattern.length) out.push(`round ${n}: no pattern`)
    if (r.whisperMs < GATE_MIN_WHISPER) out.push(`round ${n}: they whisper too short for a child (${r.whisperMs} ms)`)
    if ((r.pattern[0] ?? 0) < GATE_MIN_FIRST) out.push(`round ${n}: the first whispering comes too soon`)
    if (r.pattern.some((p) => p < 1000)) out.push(`round ${n}: a pause is shorter than a second (a child cannot tell the whisperings apart)`)
    if (r.pattern.length >= 2 && new Set(r.pattern).size < 2) out.push(`round ${n}: the pauses are all the same (too easy to count)`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = [game.rounds[0]!, game.rounds[1]!]
    if (!(b.whisperMs < a.whisperMs)) out.push('round 2 must have shorter whisperings')
    if (!(b.need >= a.need)) out.push('round 2 must need at least as many')
    const mean = (r: GateRound) => r.pattern.reduce((s, p) => s + p, 0) / r.pattern.length
    if (!(mean(b) <= mean(a))) out.push('round 2 must not have longer pauses')
  }
  return out
}

// ================================================================ 2. the sceptre (`zepter`)

/**
 * A painted arm (transparent picture): `w` its width in percent of the field, `aspect` width / height of the picture, `pivot` and `tip` places in the picture (0 to 1):
 * the king's arm turns round `pivot` (the end at the edge of the picture) and `tip` is the knob of the sceptre; for Esther's hand `tip` is the tip of the finger.
 */
export interface SceptreArm {
  image: string
  w: number
  aspect: number
  pivot: Pt
  tip: Pt
}
/**
 * One round: the hint, where the king's arm turns (`pivot`, percent of the field, may lie outside), its angle as painted plus `angle` degrees, how far it moves to and fro (`sway`, degrees)
 * and how long a swing takes (`period`, seconds), where Esther's finger starts (`start`), how near the finger must come to the knob (`reach`, units), how long it must stay there (`hold`, seconds),
 * and how fast the hand may go before it is "too hasty" (`maxSpeed`, units a second).
 */
export interface SceptreRound {
  hint: string
  pivot: Pt
  angle: number
  sway: number
  period: number
  start: Pt
  reach: number
  hold: number
  maxSpeed: number
}
/** The game "The sceptre": the inner court (`background`, `ratio` = width / height), the king's arm with the sceptre, Esther's hand and the rounds. */
export interface SceptreGame {
  background: string
  ratio: number
  arm: SceptreArm
  hand: SceptreArm
  rounds: SceptreRound[]
}

/** How long the speed of the hand is measured (seconds): a hand is hasty when it goes faster than `maxSpeed` over this time. */
export const SCEPTRE_WINDOW = 0.15
/** The arrow keys move the hand this far (units). */
export const SCEPTRE_KEY_STEP = 3
/** The help leads the hand at this part of the allowed speed. */
export const SCEPTRE_HELP_SPEED = 0.5

/** The turn of the king's arm at time `t` (seconds), in degrees (0 = as painted). */
export const sceptreAngle = (round: SceptreRound, t: number): number => round.angle + round.sway * Math.sin((2 * Math.PI * t) / round.period)

/** A place of the picture of an arm (0 to 1) measured from its `pivot`, in units. */
function armVec(arm: SceptreArm, p: Pt): Pt {
  return { x: (p.x - arm.pivot.x) * arm.w, y: ((p.y - arm.pivot.y) * arm.w) / arm.aspect }
}

/** Where the knob of the sceptre is at time `t` (percent of the field). */
export function sceptreTip(game: SceptreGame, round: SceptreRound, t: number): Pt {
  const v = armVec(game.arm, game.arm.tip)
  const a = (sceptreAngle(round, t) * Math.PI) / 180
  const rx = v.x * Math.cos(a) - v.y * Math.sin(a)
  const ry = v.x * Math.sin(a) + v.y * Math.cos(a)
  return { x: round.pivot.x + rx, y: round.pivot.y + ry * game.ratio }
}

/** How fast the knob moves at most (units a second). */
export function sceptreTipSpeed(game: SceptreGame, round: SceptreRound): number {
  const v = armVec(game.arm, game.arm.tip)
  return Math.hypot(v.x, v.y) * ((round.sway * Math.PI) / 180) * ((2 * Math.PI) / round.period)
}

/** The finger touches the knob. */
export const sceptreTouch = (game: SceptreGame, round: SceptreRound, finger: Pt, t: number): boolean => esterDist(finger, sceptreTip(game, round, t), game.ratio) <= round.reach

/**
 * The highest place of the finger (percent of the height): Esther's arm comes from below the field, so the lower end of its picture must stay below the lower edge
 * (otherwise the cut sleeve would be seen). The finger may not go higher than this.
 */
export function sceptreHandMinY(game: SceptreGame): number {
  const h = (game.hand.w / game.hand.aspect) * game.ratio
  return Math.max(4, 100 - h * (1 - game.hand.tip.y))
}

/** The hand is kept in the field (the finger never leaves it, and the arm is never seen to end). */
export const sceptreClamp = (game: SceptreGame, p: Pt): Pt => ({ x: Math.min(96, Math.max(4, p.x)), y: Math.min(96, Math.max(sceptreHandMinY(game), p.y)) })

/**
 * Is the hand calm? `samples` are the places of the finger with their time (seconds, the newest last); the speed is the way over the last `SCEPTRE_WINDOW` seconds
 * (at least two samples and a twentieth of a second, otherwise calm).
 */
export function sceptreSpeed(samples: readonly (Pt & { t: number })[], ratio: number): number {
  if (samples.length < 2) return 0
  const last = samples[samples.length - 1]!
  let k = samples.length - 1
  while (k > 0 && last.t - samples[k - 1]!.t <= SCEPTRE_WINDOW) k--
  if (k === samples.length - 1) k = samples.length - 2
  const first = samples[k]!
  const dt = last.t - first.t
  if (dt < 0.05) return 0
  let way = 0
  for (let i = k + 1; i < samples.length; i++) way += esterDist(samples[i - 1]!, samples[i]!, ratio)
  return way / dt
}

/** A step of the hand toward `goal` (for Enter and "Help me"): at most `speed * dt` units. */
export function sceptreStepToward(p: Pt, goal: Pt, ratio: number, step: number): Pt {
  const d = esterDist(p, goal, ratio)
  if (d <= step || d < 1e-6) return { ...goal }
  const f = step / d
  return { x: p.x + (goal.x - p.x) * f, y: p.y + (goal.y - p.y) * f }
}

/** Play a round with a calm hand that follows the knob (at `SCEPTRE_HELP_SPEED` of the allowed speed): whether it is done and how long it took (seconds). */
export function sceptrePlay(game: SceptreGame, ri: number, dt = 0.05, maxSeconds = 60): { done: boolean; seconds: number } {
  const r = game.rounds[ri]!
  let p = { ...r.start }
  let held = 0
  for (let t = 0; t < maxSeconds; t += dt) {
    p = sceptreClamp(game, sceptreStepToward(p, sceptreTip(game, r, t), game.ratio, r.maxSpeed * SCEPTRE_HELP_SPEED * dt))
    if (sceptreTouch(game, r, p, t)) {
      held += dt
      if (held >= r.hold) return { done: true, seconds: t }
    } else held = 0
  }
  return { done: false, seconds: maxSeconds }
}

/** The problems of the data of `zepter` (an empty list is good). */
export function sceptreProblems(game: SceptreGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the court')
  if (!(game.ratio > 0.5 && game.ratio < 3)) out.push('the ratio of the picture is odd')
  for (const [name, a] of [['arm', game.arm], ['hand', game.hand]] as const) {
    if (!a.image) out.push(`no picture of the ${name}`)
    if (!(a.aspect > 0.1 && a.aspect < 10)) out.push(`the ${name}: the aspect of the picture is odd`)
    if ([a.pivot, a.tip].some((p) => p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) out.push(`the ${name}: the pivot or the tip lies outside the picture`)
  }
  // Esther's hand must be seen well on a phone (at least 11 % of the width, about 40 pixels)
  if (!(game.hand.w >= 11)) out.push('the hand is too small for a phone')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (!inside(r.start, 4) || r.start.y < sceptreHandMinY(game)) out.push(`round ${n}: the hand starts outside the field`)
    // the knob is a target of at least 44 pixels on a phone (a circle of 12 units across at 360 pixels)
    if (r.reach < 6) out.push(`round ${n}: the knob is too small a target`)
    if (r.hold < 0.3 || r.hold > 3) out.push(`round ${n}: the time to hold is odd`)
    if (r.period < 1.5) out.push(`round ${n}: the sceptre swings too fast`)
    // the knob stays well in the field during a whole swing
    for (let k = 0; k <= 40; k++) {
      const p = sceptreTip(game, r, (r.period * k) / 40)
      if (!inside(p, 6)) {
        out.push(`round ${n}: the knob leaves the field (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`)
        break
      }
      // the hand can come up to the knob without its arm ending in the field
      if (p.y + r.reach * game.ratio * 0.5 < sceptreHandMinY(game)) {
        out.push(`round ${n}: the knob is too high for Esther's arm (${p.y.toFixed(1)} %, the finger reaches ${sceptreHandMinY(game).toFixed(1)} %)`)
        break
      }
    }
    if (esterDist(r.start, sceptreTip(game, r, 0), game.ratio) < 25) out.push(`round ${n}: the hand starts too near the knob`)
    // a calm hand can follow the knob: the knob is never faster than half the allowed speed
    const v = sceptreTipSpeed(game, r)
    if (v > r.maxSpeed * SCEPTRE_HELP_SPEED * 0.9) out.push(`round ${n}: the knob moves too fast to follow calmly (${v.toFixed(1)} units/s)`)
    if (r.maxSpeed < 15) out.push(`round ${n}: the allowed speed is too slow for a child's finger`)
    const play = sceptrePlay(game, ri)
    if (!play.done) out.push(`round ${n}: a calm hand never reaches the knob`)
    else if (play.seconds > 20) out.push(`round ${n}: a calm hand needs too long (${play.seconds.toFixed(1)} s)`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = [game.rounds[0]!, game.rounds[1]!]
    if (!(b.maxSpeed < a.maxSpeed)) out.push('round 2 must ask for a calmer hand')
    if (!(b.sway > a.sway)) out.push('round 2 must have a sceptre that moves more')
    if (!(b.hold >= a.hold) || !(b.reach <= a.reach)) out.push('round 2 must not be easier at the knob')
  }
  return out
}

// ================================================================ 3. messengers ride out (`boten`)

/** A land on the map: its id and name, where its name is shown and the rider arrives (`x`, `y`, percent), and its direction from Susa (`angle`, degrees on the screen: 0 right, 90 down). */
export interface RiderLand {
  id: string
  name: string
  x: number
  y: number
  angle: number
}
/** A letter: the land it goes to and the rider who carries it (picture, the rider faces right). */
export interface RiderLetter {
  land: string
  rider: string
}
/** One round: the hint, the letters (in this order) and how far (degrees) a rider may be sent off the way to his land and still find it. */
export interface RidersRound {
  hint: string
  letters: RiderLetter[]
  tolerance: number
}
/**
 * The game "Messengers ride out": the painted map (`map`, `ratio` = width / height), Susa in it, the lands, the rolled letter, the king's ring, the seal and where the seal goes on the letter
 * (`sealAt`, 0 to 1 of the picture of the letter), the width of a rider (percent of the map) and the rounds.
 */
export interface RidersGame {
  map: string
  ratio: number
  susa: Pt & { name: string }
  lands: RiderLand[]
  letter: string
  letterAspect: number
  ring: string
  seal: string
  sealAt: Pt
  sealW: number
  riderW: number
  rounds: RidersRound[]
}

/** The direction from Susa to a place of the map (degrees on the screen: 0 right, 90 down, -90 up, 180 left). */
export function ridersAngle(game: RidersGame, p: Pt): number {
  return (Math.atan2((p.y - game.susa.y) / game.ratio, p.x - game.susa.x) * 180) / Math.PI
}
/** The difference of two directions (0 to 180 degrees). */
export const angleGap = (a: number, b: number): number => {
  const d = Math.abs(((a - b) % 360) + 360) % 360
  return d > 180 ? 360 - d : d
}
/** A swipe or a tap shorter than this (units) from Susa does not send the rider. */
export const RIDERS_MIN_SWIPE = 6
/** Two lands lie at least this far apart in direction (degrees). */
export const RIDERS_MIN_GAP = 40

/** The land a rider finds when he is sent in direction `angle`: the nearest land within the tolerance of the round, or null. */
export function ridersAim(game: RidersGame, round: RidersRound, angle: number): RiderLand | null {
  let best: RiderLand | null = null
  for (const l of game.lands) if (angleGap(l.angle, angle) <= round.tolerance && (!best || angleGap(l.angle, angle) < angleGap(best.angle, angle))) best = l
  return best
}

/** A rider sent off: `right` (he rides to the land of his letter), `wrong` (to another land: a mistake), `none` (no land in that direction: he waits). */
export function ridersSend(game: RidersGame, round: RidersRound, letter: RiderLetter, angle: number): { verdict: 'right' | 'wrong' | 'none'; land: RiderLand | null } {
  const land = ridersAim(game, round, angle)
  if (!land) return { verdict: 'none', land: null }
  return { verdict: land.id === letter.land ? 'right' : 'wrong', land }
}

/** The problems of the data of `boten` (an empty list is good). */
export function ridersProblems(game: RidersGame): string[] {
  const out: string[] = []
  if (!game.map) out.push('no map')
  if (!(game.ratio > 0.5 && game.ratio < 3)) out.push('the ratio of the map is odd')
  if (!game.letter || !game.ring || !game.seal) out.push('a picture of the letter, the ring or the seal is missing')
  if (!(game.letterAspect > 0.3 && game.letterAspect < 6)) out.push('the aspect of the letter is odd')
  if (game.sealAt.x < 0 || game.sealAt.x > 1 || game.sealAt.y < 0 || game.sealAt.y > 1) out.push('the seal lies outside the letter')
  if (!(game.sealW > 0.1 && game.sealW < 0.6)) out.push('the seal is odd in size')
  if (!inside(game.susa, 20)) out.push('Susa must lie in the middle part of the map')
  // a rider is seen well on a phone (at least 12 % of the width, about 43 pixels)
  if (!(game.riderW >= 12)) out.push('the riders are too small for a phone')
  const ids = new Set(game.lands.map((l) => l.id))
  if (ids.size !== game.lands.length) out.push('two lands have the same id')
  if (game.lands.length < 3) out.push('fewer than three lands')
  for (const l of game.lands) {
    if (!l.name) out.push(`the land "${l.id}" has no name`)
    if (!inside(l, 4)) out.push(`the land "${l.id}" lies at the edge or outside the map`)
    // the direction in the data is the direction of the place on the map
    const a = ridersAngle(game, l)
    if (angleGap(a, l.angle) > 12) out.push(`the land "${l.id}": its direction ${l.angle} does not fit its place (${a.toFixed(0)})`)
    if (esterDist(l, game.susa, game.ratio) < 18) out.push(`the land "${l.id}" lies too near Susa`)
  }
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!r.hint) out.push(`round ${n}: no hint`)
    if (r.letters.length < 2) out.push(`round ${n}: fewer than two letters`)
    if (!(r.tolerance >= 15 && r.tolerance <= 45)) out.push(`round ${n}: the tolerance ${r.tolerance} is odd`)
    // the lands lie in clearly different directions (a child can tell them apart: at least RIDERS_MIN_GAP degrees), and the tolerance is not wider than the gap
    // (a direction finds the nearest land, so a wide tolerance only makes the round easier, never unclear)
    for (let i = 0; i < game.lands.length; i++)
      for (let j = i + 1; j < game.lands.length; j++) {
        const gap = angleGap(game.lands[i]!.angle, game.lands[j]!.angle)
        if (gap < RIDERS_MIN_GAP || gap < r.tolerance) out.push(`round ${n}: "${game.lands[i]!.id}" and "${game.lands[j]!.id}" lie too close in direction`)
      }
    for (const l of r.letters) {
      if (!ids.has(l.land)) out.push(`round ${n}: a letter goes to "${l.land}", which is not on the map`)
      if (!l.rider) out.push(`round ${n}: a letter has no rider`)
    }
    if (new Set(r.letters.map((l) => l.land)).size < 2) out.push(`round ${n}: all letters go to the same land`)
    // the land of every letter is found when the rider is sent straight toward it
    for (const l of r.letters) {
      const land = game.lands.find((x) => x.id === l.land)
      if (land && ridersSend(game, r, l, ridersAngle(game, land)).verdict !== 'right') out.push(`round ${n}: the way to "${l.land}" does not find it`)
    }
  })
  if (game.rounds.length >= 2) {
    const [a, b] = [game.rounds[0]!, game.rounds[1]!]
    if (!(b.letters.length > a.letters.length)) out.push('round 2 must have more letters')
    if (!(b.tolerance < a.tolerance)) out.push('round 2 must be more exact')
  }
  return out
}
