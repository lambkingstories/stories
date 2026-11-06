/**
 * The pure parts of three more games of "Pfingsten" (no. 30, id `pfingsten`; the components only show and listen):
 * "Leap and praise" (`huepfen`, field `hop`, Acts 3,8: the right leap for the next step of the temple stairs, and on a landing the man praises God),
 * "Catch up with the chariot" (`wagen`, field `chariot`, Acts 8,29-30: Philip runs beside the moving chariot and keeps to the window) and
 * "Peek through the gate" (`spaehen`, field `peek`, Acts 12,13-16: Rhoda looks through the cracks of the gate and taps only when it is really Peter).
 * All places are percent of the field. Times are milliseconds; the arithmetic has no clock of its own and no dice.
 */

// ================================================================ 1. leap and praise (`huepfen`)

/** A step of the stairs: `n` a low step (one unit high), `h` a high step (two units), `L` a landing (flat, here the man praises God). */
export type HopStep = 'n' | 'h' | 'L'
/** The three buttons. */
export type HopChoice = 'small' | 'big' | 'praise'
export interface HopRound {
  hint: string
  steps: HopStep[]
}
/**
 * The game "Leap and praise" (`huepfen`): the temple wall (3:1, without stairs), the two step pictures, the man standing, leaping and praising (200 x 300, transparent),
 * the pictures of the three buttons, where the stairs begin and end (percent of the width of the temple picture), how high one unit is (percent of the height),
 * how tall the man is (percent of the height) and the rounds.
 */
export interface HopGame {
  temple: string
  low: string
  high: string
  man: { stand: string; jump: string; praise: string }
  buttons: { small: string; big: string; praise: string }
  from: number
  to: number
  unit: number
  manH: number
  rounds: HopRound[]
}

/** How many units a step lifts the man. */
export const hopRise = (s: HopStep): number => (s === 'h' ? 2 : s === 'n' ? 1 : 0)

/** The button that fits a step. */
export const hopNeed = (s: HopStep): HopChoice => (s === 'h' ? 'big' : s === 'n' ? 'small' : 'praise')

/** The height (units) of the top of every step, from the first to the last. */
export function hopLevels(steps: readonly HopStep[]): number[] {
  let h = 0
  return steps.map((s) => (h += hopRise(s)))
}

/**
 * A button pressed before step `s`: right, or what the man does instead: `low` he only hops on the spot before a high step, `high` he leaps up and lands on the same step
 * before a low one, `landing` he leaps although here he should praise, `praise` he praises before a step. Every one but `ok` is a mistake; he never falls.
 */
export function hopPress(s: HopStep, c: HopChoice): 'ok' | 'low' | 'high' | 'landing' | 'praise' {
  if (hopNeed(s) === c) return 'ok'
  if (s === 'L') return 'landing'
  if (c === 'praise') return 'praise'
  return c === 'small' ? 'low' : 'high'
}

/** The problems of the data of `huepfen` (an empty list is good). */
export function hopProblems(game: HopGame): string[] {
  const out: string[] = []
  if (!game.temple) out.push('no picture of the temple')
  if (!game.low || !game.high) out.push('no pictures of the steps')
  if (!game.man.stand || !game.man.jump || !game.man.praise) out.push('no pictures of the man')
  if (!game.buttons.small || !game.buttons.big) out.push('no pictures of the buttons')
  if (game.from < 0 || game.to > 100 || game.to - game.from < 30) out.push('the stairs lie outside the picture or are too short')
  if (game.manH < 15 || game.manH > 45) out.push('the man should be between 15 and 45 percent of the height')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (r.steps.length < 4) out.push(`round ${n}: fewer than four steps`)
    if (r.steps.some((s) => s !== 'n' && s !== 'h' && s !== 'L')) out.push(`round ${n}: unknown step`)
    if (r.steps[0] === 'L') out.push(`round ${n}: the stairs begin with a landing`)
    r.steps.forEach((s, k) => {
      if (s === 'L' && r.steps[k - 1] === 'L') out.push(`round ${n}: two landings in a row`)
    })
    if (!r.steps.includes('n') || !r.steps.includes('h')) out.push(`round ${n}: low and high steps both belong in a round`)
    const lv = hopLevels(r.steps)
    const top = lv[lv.length - 1] ?? 0
    // the ground lies at 94 % of the height (GameHuepfen); the head of the man on the top step keeps at least 4 % from the upper edge
    if (top * game.unit + game.manH > 90) out.push(`round ${n}: the stairs are too high for the picture (${top} units)`)
    const cw = (game.to - game.from) / Math.max(1, r.steps.length)
    if (cw < 4) out.push(`round ${n}: the steps are too narrow`)
  })
  if (game.rounds.length === 2) {
    if (game.rounds[0]!.steps.includes('L')) out.push('round 1 has no landing (the praise button comes in round 2)')
    if (!game.rounds[1]!.steps.includes('L')) out.push('round 2 has landings where the man praises God')
    if (game.rounds[1]!.steps.length <= game.rounds[0]!.steps.length) out.push('round 2 should be longer than round 1')
    if (!game.buttons.praise) out.push('no picture of the praise button')
  }
  return out
}

// ================================================================ 2. catch up with the chariot (`wagen`)

/** A change of the speed of the chariot at time `t` (ms after the start of the round); `v` 1 is the usual speed. */
export interface ChariotSpeed {
  t: number
  v: number
}
/** A round: the hint, the speeds (the first at t 0) and how long Philip must stay at the window until the scroll is full (ms). */
export interface ChariotRound {
  hint: string
  speed: ChariotSpeed[]
  fill: number
}
/**
 * The game "Catch up with the chariot" (`wagen`): the far landscape (3:1, seamless), the near road side (seamless, transparent above), the chariot in two pictures (the wheels),
 * Philip running in two pictures, the light spot on the ground, the scroll shut and open, the picture at the end (the chariot stands, Philip gets up).
 * Sizes and places in percent of the field (3:2): the chariot (width, bottom edge), where its left edge goes at speed 1 and how far it moves forward per unit of speed above 1,
 * Philip (width, bottom edge), the window zone and the front of the horses as shares of the chariot width counted from its left edge (the chariot faces right).
 */
export interface ChariotGame {
  far: string
  near: string
  wagon: string[]
  runner: string[]
  zone: string
  scroll: string
  scrollOpen: string
  finale: string
  wagonW: number
  wagonY: number
  wagonX: number
  swing: number
  runnerW: number
  runnerY: number
  window: { from: number; to: number }
  horses: number
  rounds: ChariotRound[]
}

/** The speed at time `t` of a round (the last change before `t` counts). */
export function chariotSpeedAt(round: Pick<ChariotRound, 'speed'>, t: number): number {
  let v = round.speed[0]?.v ?? 1
  for (const s of round.speed) if (s.t <= t) v = s.v
  return v
}

/** Where the left edge of the chariot goes at speed `v` (percent of the field): faster pulls it forward, slower lets it fall back. */
export const chariotWagonX = (game: Pick<ChariotGame, 'wagonX' | 'swing'>, v: number): number => game.wagonX + (v - 1) * game.swing

/** The window zone (percent of the field) when the left edge of the chariot is at `wx`. */
export function chariotZone(game: Pick<ChariotGame, 'wagonW' | 'window'>, wx: number): { from: number; to: number } {
  return { from: wx + game.window.from * game.wagonW, to: wx + game.window.to * game.wagonW }
}

/** Where Philip (the middle of his feet at `x`) is: at the window, in front of the horses, or elsewhere. */
export function chariotWhere(game: Pick<ChariotGame, 'wagonW' | 'window' | 'horses'>, wx: number, x: number): 'zone' | 'horses' | 'off' {
  const z = chariotZone(game, wx)
  if (x >= z.from && x <= z.to) return 'zone'
  if (x >= wx + game.horses * game.wagonW) return 'horses'
  return 'off'
}

/** Philip moved by an arrow key (or held inside the field). */
export const chariotClamp = (game: Pick<ChariotGame, 'runnerW'>, x: number): number => Math.min(100 - game.runnerW / 2, Math.max(game.runnerW / 2, x))

/** The problems of the data of `wagen` (an empty list is good). */
export function chariotProblems(game: ChariotGame): string[] {
  const out: string[] = []
  if (!game.far || !game.near) out.push('no pictures of the landscape')
  if (game.wagon.length < 1) out.push('no picture of the chariot')
  if (game.runner.length < 1) out.push('no picture of Philip')
  if (!game.scroll || !game.scrollOpen) out.push('no pictures of the scroll')
  if (!game.finale) out.push('no picture of the end')
  const w = game.window
  if (!(w.from >= 0 && w.from < w.to && w.to <= game.horses && game.horses <= 1.2)) out.push('the window must lie on the chariot, behind the horses')
  if ((w.to - w.from) * game.wagonW < Math.max(8, game.runnerW * 0.8)) out.push('the window zone is too narrow to stay in')
  if (game.wagonW < 25 || game.wagonW > 60) out.push('the chariot should be between 25 and 60 percent wide')
  if (game.runnerW < 9) out.push('Philip is too small for a phone (at least 9 percent)')
  const speeds = game.rounds.flatMap((r) => r.speed.map((s) => s.v))
  const lo = Math.min(...speeds, 1)
  const hi = Math.max(...speeds, 1)
  if (chariotWagonX(game, lo) < 0) out.push('at the lowest speed the chariot leaves the field on the left')
  if (chariotWagonX(game, hi) + game.wagonW > 100) out.push('at the highest speed the chariot leaves the field on the right')
  if (chariotZone(game, chariotWagonX(game, lo)).from < game.runnerW / 2) out.push('the window zone can lie where Philip cannot go')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (r.fill < 3000) out.push(`round ${n}: the scroll fills too quickly`)
    if (!r.speed.length || r.speed[0]!.t !== 0) out.push(`round ${n}: the first speed is at time 0`)
    r.speed.forEach((s, k) => {
      if (k > 0 && s.t <= r.speed[k - 1]!.t) out.push(`round ${n}: the speeds are not in the order of time`)
      if (s.v <= 0 || s.v > 2.5) out.push(`round ${n}: a speed of ${s.v} is not possible`)
    })
  })
  if (game.rounds.length === 2) {
    if (game.rounds[1]!.fill <= game.rounds[0]!.fill) out.push('round 2 should last longer than round 1')
    if (game.rounds[1]!.speed.length <= game.rounds[0]!.speed.length) out.push('round 2 should change its speed more often')
  }
  return out
}

// ================================================================ 3. peek through the gate (`spaehen`)

/** A person in the lane: the picture (walking to the right, 360 x 700, transparent), a name for the screen reader, and whether it is Peter. */
export interface PeekPerson {
  id: string
  image: string
  name: string
  peter?: boolean
}
/** A person going past the gate; `stop` = stays in front of the gate and knocks. */
export interface PeekVisit {
  id: string
  stop?: boolean
}
/** A round: the hint, the gate seen from inside (the cracks transparent), where the cracks are (left edge and width, percent) and the people one after the other. */
export interface PeekRound {
  hint: string
  gate: string
  slits: { x: number; w: number }[]
  people: PeekVisit[]
}
/**
 * The game "Peek through the gate" (`spaehen`): the lane at night (3:2), the people, Rhoda listening and running in, the three marks of Peter (beard, tunic, cloak),
 * the picture with the open gate at the end, how long a person takes from one edge to the other (ms), how long someone waits at the gate (ms), how tall the people are
 * (percent of the height), where they stand at the gate (percent of the width) and the rounds.
 */
export interface PeekGame {
  lane: string
  people: PeekPerson[]
  rhode: { listen: string; run: string }
  marks: string[]
  open: string
  walkMs: number
  wait: number
  personH: number
  stopX: number
  rounds: PeekRound[]
}

/** A tap on the gate while `who` stands or walks before it: right when it is Peter, a mistake for anyone else, nothing when nobody is there. */
export function peekTap(game: Pick<PeekGame, 'people'>, who: string | null): 'peter' | 'wrong' | 'nobody' {
  if (!who) return 'nobody'
  return game.people.find((p) => p.id === who)?.peter ? 'peter' : 'wrong'
}

/** Whether a person is Peter. */
export const peekIsPeter = (game: Pick<PeekGame, 'people'>, id: string): boolean => !!game.people.find((p) => p.id === id)?.peter

/** The share of the slits in the width of the gate (how much of the lane one sees). */
export const peekOpenShare = (r: Pick<PeekRound, 'slits'>): number => r.slits.reduce((s, x) => s + x.w, 0) / 100

/** The problems of the data of `spaehen` (an empty list is good). */
export function peekProblems(game: PeekGame): string[] {
  const out: string[] = []
  if (!game.lane) out.push('no picture of the lane')
  if (!game.open) out.push('no picture of the open gate')
  if (!game.rhode.listen || !game.rhode.run) out.push('no pictures of Rhoda')
  if (game.marks.length < 2) out.push('fewer than two marks of Peter for "Help me"')
  const peters = game.people.filter((p) => p.peter)
  if (peters.length !== 1) out.push(`there must be exactly one Peter, there are ${peters.length}`)
  if (new Set(game.people.map((p) => p.id)).size !== game.people.length) out.push('two people have the same id')
  if (game.personH < 40 || game.personH > 95) out.push('the people should be 40 to 95 percent of the height')
  if (game.stopX < 20 || game.stopX > 80) out.push('the place at the gate should lie between 20 and 80 percent')
  if (game.walkMs < 2500) out.push('the people walk too fast')
  if (game.wait < 2000) out.push('the people wait too short a time at the gate')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.gate) out.push(`round ${n}: no picture of the gate`)
    for (const v of r.people) if (!game.people.some((p) => p.id === v.id)) out.push(`round ${n}: the person "${v.id}" has no picture`)
    const pk = r.people.filter((v) => peekIsPeter(game, v.id))
    if (pk.length !== 1) out.push(`round ${n}: Peter must come exactly once`)
    const last = r.people[r.people.length - 1]
    if (!last || !peekIsPeter(game, last.id) || !last.stop) out.push(`round ${n}: Peter comes last and stays at the gate`)
    if (!r.people.some((v) => v.stop && !peekIsPeter(game, v.id))) out.push(`round ${n}: someone else must also stop at the gate`)
    if (r.slits.length < 2) out.push(`round ${n}: fewer than two cracks`)
    r.slits.forEach((s, k) => {
      if (s.x < 0 || s.w <= 0 || s.x + s.w > 100) out.push(`round ${n}: crack ${k + 1} lies outside the picture`)
      if (k > 0 && s.x < r.slits[k - 1]!.x + r.slits[k - 1]!.w) out.push(`round ${n}: the cracks ${k} and ${k + 1} overlap or are not in order`)
    })
  })
  if (game.rounds.length === 2) {
    const [a, b] = game.rounds as [PeekRound, PeekRound]
    if (b.people.length <= a.people.length) out.push('round 2 should have more people than round 1')
    const wa = Math.max(...a.slits.map((s) => s.w))
    const wb = Math.max(...b.slits.map((s) => s.w))
    if (wb >= wa) out.push('round 2 should have narrower cracks than round 1')
  }
  return out
}
