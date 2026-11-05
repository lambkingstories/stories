/**
 * The pure parts of the five new games of "Josef" (5.11.2026, Anton's game plan; the components only show and listen):
 * 1. "The sheaves bow" (`garben`, field `sheavesBow`, Genesis 37,7): eleven sheaves stand crooked round Joseph's sheaf; every tap turns a sheaf a step until it bows to the middle.
 * 2. "The wine press" (`keltern`, field `winePress`, Genesis 40,11): press and hold the grapes over Pharaoh's cup until it is full, but let go before it runs over.
 * 3. "Cows by the Nile" (`kuehenil`, field `nileCows`, Genesis 41,2-3): the cows come up out of the river one after another; tap only the seven fat ones.
 * 4. "Embrace" (`umarmen`, field `embrace2`, Genesis 45,14-15): Joseph goes to Benjamin first, then to every brother; with every embrace a frightened face becomes glad.
 * 5. "Meeting" (`begegnung`, field `meeting`, Genesis 46,29): two fingers steer Joseph's chariot and Jacob's wagon at the same time past rocks and bushes until they meet in the middle.
 * All places are percent of the picture: x a part of the width, y a part of the height. Distances in "units" are percent of the width (the height is divided by the ratio of the picture).
 * The arithmetic has no clock and no dice: the components give the time.
 */
import { mistakeStars } from '@/utils/adventureScore'

export interface Pt {
  x: number
  y: number
}

/** Stars at the end of every game: up to two mistakes three stars, up to four two stars, then one (the same as `osterStars`). */
export const josefStars = (mistakes: number): number => mistakeStars(Math.max(0, mistakes), 2, 4)

/** The distance of two places in units (percent of the width); `ratio` is width / height of the picture. */
export const josefDist = (a: Pt, b: Pt, ratio: number): number => Math.hypot(a.x - b.x, (a.y - b.y) / ratio)

/** The smallest field a finger needs: 44 pixels of a field 360 pixels wide (percent of the width). */
export const FINGER = (44 / 360) * 100

// ================================================================ 1. the sheaves bow (`garben`)

/** A sheaf of a round: where it lies (its middle), the direction its ears point to at the start (degrees, 0 = up, 90 = right, clockwise) and its picture. */
export interface SheafSpot {
  x: number
  y: number
  start: number
  image: string
}
/** One round: the hint, the place of Joseph's sheaf, how far one tap turns a sheaf (degrees) and the sheaves. */
export interface SheavesRound {
  hint: string
  center: Pt
  step: number
  sheaves: SheafSpot[]
}
/**
 * The game "The sheaves bow": the field seen from above (square), Joseph's sheaf (standing, round) and its width, the width of the square picture of a sheaf
 * (its ears point up in the picture; it turns round its middle) and the rounds.
 */
export interface SheavesGame {
  field: string
  josef: string
  josefW: number
  sheafW: number
  rounds: SheavesRound[]
}

const norm = (a: number): number => ((a % 360) + 360) % 360
/** The direction from a sheaf to Joseph's sheaf (degrees, 0 = up, clockwise; the field is square). */
export const sheafTarget = (s: Pt, center: Pt): number => norm((Math.atan2(center.x - s.x, -(center.y - s.y)) * 180) / Math.PI)
/** How far two directions are apart (0 to 180 degrees). */
export const angleGap = (a: number, b: number): number => {
  const d = norm(a - b)
  return d > 180 ? 360 - d : d
}
/** A sheaf bows when its ears point to Joseph's sheaf (within half a step). */
export const sheafBows = (angle: number, target: number, step: number): boolean => angleGap(angle, target) <= step / 2 + 0.5
/** One tap: the sheaf turns a step clockwise. */
export const sheafTurn = (angle: number, step: number): number => norm(angle + step)
/** How many taps a sheaf needs from `angle` until it bows (-1: never, the step does not fit). */
export function sheafTaps(angle: number, target: number, step: number): number {
  let a = angle
  for (let k = 0; k <= Math.ceil(360 / step); k++) {
    if (sheafBows(a, target, step)) return k
    a = sheafTurn(a, step)
  }
  return -1
}
/** What a tap does: `turned` (the sheaf turns a step, and `bows` tells whether it bows now) or `already` (it bows already: it stays, that is a mistake). */
export function sheafTap(angle: number, target: number, step: number): { verdict: 'turned' | 'already'; angle: number; bows: boolean } {
  if (sheafBows(angle, target, step)) return { verdict: 'already', angle, bows: true }
  const next = sheafTurn(angle, step)
  return { verdict: 'turned', angle: next, bows: sheafBows(next, target, step) }
}

/** The problems of the data of `garben` (an empty list is good). */
export function sheavesProblems(game: SheavesGame): string[] {
  const out: string[] = []
  if (!game.field || !game.josef) out.push('no picture of the field or of Joseph\'s sheaf')
  if (!(game.sheafW >= FINGER)) out.push(`a sheaf is too small for a finger (${game.sheafW} %, at least ${FINGER.toFixed(1)} %)`)
  if (!(game.josefW > game.sheafW)) out.push('Joseph\'s sheaf must be bigger than the others')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  const taps: number[] = []
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (r.sheaves.length !== 11) out.push(`round ${n}: there must be eleven sheaves, there are ${r.sheaves.length}`)
    if (!(r.step > 0 && Number.isInteger(360 / r.step))) out.push(`round ${n}: the step ${r.step} does not divide the circle`)
    let sum = 0
    r.sheaves.forEach((s, i) => {
      if (!s.image) out.push(`round ${n}: sheaf ${i + 1} has no picture`)
      const half = game.sheafW / 2
      if (s.x - half < 0 || s.x + half > 100 || s.y - half < 0 || s.y + half > 100) out.push(`round ${n}: sheaf ${i + 1} sticks out of the field`)
      if (josefDist(s, r.center, 1) < (game.josefW + game.sheafW) / 2) out.push(`round ${n}: sheaf ${i + 1} lies on Joseph's sheaf`)
      const tgt = sheafTarget(s, r.center)
      const k = sheafTaps(s.start, tgt, r.step)
      if (k < 1) out.push(`round ${n}: sheaf ${i + 1} ${k === 0 ? 'bows already at the start' : 'can never bow'}`)
      if (k > (ri === 0 ? 3 : 5)) out.push(`round ${n}: sheaf ${i + 1} needs ${k} taps (too many)`)
      sum += Math.max(0, k)
      for (let j = 0; j < i; j++) if (josefDist(s, r.sheaves[j]!, 1) < game.sheafW * 0.95) out.push(`round ${n}: sheaves ${j + 1} and ${i + 1} lie on each other`)
    })
    taps.push(sum)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (!(b!.step < a!.step || taps[1]! > taps[0]!)) out.push('round 2 must be harder (a finer step or more taps)')
  }
  return out
}

// ================================================================ 2. the wine press (`keltern`)

/** One round: the hint, how fast the juice runs at the start of a press (share of the cup a second), how much faster it gets for every second the press is held, where "full" begins (share), and how many cups. */
export interface WinePressRound {
  hint: string
  flow: number
  push: number
  full: number
  cups: number
}
/**
 * The game "The wine press": the dream picture (`background`, `ratio` = width / height), the five pictures of the cup (empty, a little, half, full to the brim, running over; all the same size),
 * where the cup stands (middle of its foot `x`, `y`; width `w`; percent), the bunch of grapes above it (middle, width), the drop and the puddle, and the rounds.
 */
export interface WinePressGame {
  background: string
  ratio: number
  cups: [string, string, string, string, string]
  cupRatio: number
  cup: Pt & { w: number }
  grapes: Pt & { w: number; image: string; ratio: number }
  drop: string
  puddle: string
  rounds: WinePressRound[]
}

/** How full a cup is shown: 0 empty, 1 a little, 2 half, 3 full to the brim, 4 running over. */
export function wineStage(level: number, full: number): 0 | 1 | 2 | 3 | 4 {
  if (level > 1) return 4
  if (level >= full) return 3
  if (level >= 0.4) return 2
  if (level >= 0.08) return 1
  return 0
}
/** One moment of pressing: the level after `dt` seconds of a press that has been held `held` seconds. */
export const wineFlow = (round: WinePressRound, held: number): number => round.flow + round.push * held
export function winePress(round: WinePressRound, level: number, held: number, dt: number): { level: number; held: number; over: boolean } {
  const next = level + wineFlow(round, held) * dt
  return { level: next, held: held + dt, over: next > 1 }
}
/** Letting go: `full` (the cup is full and nothing ran over), `more` (not full yet: press again). */
export const wineRelease = (round: WinePressRound, level: number): 'full' | 'more' => (level >= round.full && level <= 1 ? 'full' : 'more')

/** One long press from the empty cup: when it turns full and when it runs over (seconds), and the time between (the window to let go). */
export function wineWindow(round: WinePressRound, dt = 0.01): { full: number; over: number; window: number } {
  let level = 0
  let held = 0
  let full = -1
  for (let t = 0; t < 60; t += dt) {
    const r = winePress(round, level, held, dt)
    level = r.level
    held = r.held
    if (full < 0 && level >= round.full) full = t + dt
    if (r.over) return { full, over: t + dt, window: t + dt - full }
  }
  return { full, over: 60, window: 60 - full }
}

/** The problems of the data of `keltern` (an empty list is good). */
export function winePressProblems(game: WinePressGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no dream picture')
  if (game.cups.length !== 5 || game.cups.some((c) => !c)) out.push('the five pictures of the cup are not all there')
  if (!game.grapes?.image || !game.drop || !game.puddle) out.push('no picture of the grapes, the drop or the puddle')
  if (!(game.cup.w >= 28)) out.push('the cup is too small for a phone (at least 28 % of the width)')
  if (!(game.grapes.w >= FINGER * 2)) out.push('the grapes are too small to press with a finger')
  const inside = (p: Pt) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100
  if (!inside(game.cup) || !inside(game.grapes)) out.push('the cup or the grapes lie outside the picture')
  if (game.grapes.y >= game.cup.y) out.push('the grapes must hang above the cup')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  const win: number[] = []
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    if (!(r.full > 0.6 && r.full < 0.97)) out.push(`round ${n}: "full" begins at an odd level (${r.full})`)
    if (!(r.cups >= 1)) out.push(`round ${n}: no cup to fill`)
    const w = wineWindow(r)
    if (w.full > 10) out.push(`round ${n}: one cup takes too long (${w.full.toFixed(1)} s)`)
    if (w.full < 2) out.push(`round ${n}: the cup is full too quickly (${w.full.toFixed(1)} s)`)
    if (w.window < 0.4) out.push(`round ${n}: the moment to let go is too short (${w.window.toFixed(2)} s)`)
    win.push(w.window)
  })
  if (win.length >= 2 && !(win[1]! < win[0]!)) out.push('round 2 must be harder (a shorter moment to let go)')
  return out
}

// ================================================================ 3. cows by the Nile (`kuehenil`)

export type CowKind = 'fat' | 'lean'
/** A cow of a round: fat or lean, its picture (`faceLeft`: the picture looks to the left already and is not turned round), the way it walks (`lane`) and when it comes up out of the river (seconds after the start of the round). */
export interface NileCow {
  kind: CowKind
  image: string
  faceLeft?: boolean
  lane: number
  at: number
}
/** One round: the hint, how fast the cows walk (units a second along their way) and the cows in the order they come. */
export interface NileCowsRound {
  hint: string
  speed: number
  cows: NileCow[]
}
/**
 * The game "Cows by the Nile": the meadow by the river (`background`, `ratio`), where the cows come up out of the water (`shore`: the middle of the feet; there a cow is `shoreScale` of its size),
 * the ways (`lanes`: where a way leaves the picture on the left, the middle of the feet, and the size of a cow there), the width of a cow at size 1 (percent of the width; the pictures face right and
 * are turned round, they walk to the left), the ratio of a cow picture, and how long a cow takes to come up out of the water (seconds).
 */
export interface NileCowsGame {
  background: string
  ratio: number
  shore: Pt
  shoreScale: number
  lanes: (Pt & { scale: number })[]
  cowW: number
  cowRatio: number
  rise: number
  rounds: NileCowsRound[]
}

/** How long a cow walks on its way from the shore until it has left the picture (seconds). */
export const cowWalkTime = (game: NileCowsGame, round: NileCowsRound, lane: number): number => josefDist(game.shore, game.lanes[lane]!, game.ratio) / round.speed

/**
 * Where a cow is at time `t` of the round: `phase` (`wait` before it comes, `rise` while it comes up out of the water (`u` 0 to 1), `walk`, `gone` when it has left the picture),
 * the middle of its feet, its size and its width (percent).
 */
export function cowAt(game: NileCowsGame, round: NileCowsRound, cow: NileCow, t: number): { phase: 'wait' | 'rise' | 'walk' | 'gone'; u: number; x: number; y: number; scale: number; w: number } {
  const lane = game.lanes[cow.lane]!
  const s = t - cow.at
  const base = { x: game.shore.x, y: game.shore.y, scale: game.shoreScale, w: game.cowW * game.shoreScale }
  if (s < 0) return { phase: 'wait', u: 0, ...base }
  if (s < game.rise) return { phase: 'rise', u: s / game.rise, ...base }
  const total = cowWalkTime(game, round, cow.lane)
  const u = (s - game.rise) / total
  if (u >= 1) return { phase: 'gone', u: 1, x: lane.x, y: lane.y, scale: lane.scale, w: game.cowW * lane.scale }
  const scale = game.shoreScale + (lane.scale - game.shoreScale) * u
  return { phase: 'walk', u, x: game.shore.x + (lane.x - game.shore.x) * u, y: game.shore.y + (lane.y - game.shore.y) * u, scale, w: game.cowW * scale }
}

/** A tap on a cow: `fat` (right: it goes to the meadow), `lean` (a mistake: the lean ones walk by), `none` (not there or taken already). */
export function cowTap(cow: NileCow, taken: boolean, phase: string): 'fat' | 'lean' | 'none' {
  if (taken || phase === 'wait' || phase === 'gone') return 'none'
  return cow.kind
}

/** The cows of a round with the fat cows that walked by appended once more: a fat cow that walked by comes again (`again` seconds after the last one). */
export function cowsAgain(cow: NileCow, after: number): NileCow {
  return { ...cow, at: after }
}

/** The problems of the data of `kuehenil` (an empty list is good). */
export function nileCowsProblems(game: NileCowsGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('no picture of the meadow')
  if (!(game.cowW * Math.min(game.shoreScale, ...game.lanes.map((l) => l.scale)) >= 11)) out.push('a cow is too small for a phone (at least 11 % of the width, 40 pixels)')
  if (!game.lanes.length) out.push('no way for the cows')
  for (const l of game.lanes) if (!(l.x < 0)) out.push('a way must leave the picture on the left')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const fat = r.cows.filter((c) => c.kind === 'fat').length
    const lean = r.cows.filter((c) => c.kind === 'lean').length
    if (fat !== 7 || lean !== 7) out.push(`round ${n}: there must be seven fat and seven lean cows (${fat} and ${lean})`)
    if (r.cows.some((c) => !c.image || !game.lanes[c.lane])) out.push(`round ${n}: a cow has no picture or no way`)
    for (let i = 1; i < r.cows.length; i++) if (r.cows[i]!.at <= r.cows[i - 1]!.at) out.push(`round ${n}: cow ${i + 1} does not come after cow ${i}`)
    // two cows are never on each other where a finger taps (at every moment, the middles of the pictures at least 0.8 of the smaller width apart)
    const end = Math.max(...r.cows.map((c) => c.at + game.rise + cowWalkTime(game, r, c.lane)))
    let crowd = false
    for (let t = 0; t <= end && !crowd; t += 0.1) {
      const on = r.cows.map((c) => cowAt(game, r, c, t)).filter((p) => p.phase === 'rise' || p.phase === 'walk')
      for (let i = 0; i < on.length && !crowd; i++)
        for (let j = i + 1; j < on.length && !crowd; j++) {
          const a = on[i]!
          const b = on[j]!
          const ha = (a.w / game.cowRatio) * game.ratio
          const hb = (b.w / game.cowRatio) * game.ratio
          const d = josefDist({ x: a.x, y: a.y - ha / 2 }, { x: b.x, y: b.y - hb / 2 }, game.ratio)
          if (d < 0.8 * Math.min(a.w, b.w)) {
            crowd = true
            out.push(`round ${n}: two cows walk on each other at ${t.toFixed(1)} s`)
          }
        }
    }
    // there is time to tap: every cow is in the picture at least 2.5 seconds
    for (const c of r.cows) if (cowWalkTime(game, r, c.lane) < 2.5) out.push(`round ${n}: a cow walks through too quickly`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    const gap = (r: NileCowsRound) => (r.cows[r.cows.length - 1]!.at - r.cows[0]!.at) / Math.max(1, r.cows.length - 1)
    if (!(b!.speed > a!.speed || gap(b!) < gap(a!))) out.push('round 2 must be harder (faster cows or less time between them)')
    const changes = (r: NileCowsRound) => r.cows.filter((c, i) => i > 0 && c.kind !== r.cows[i - 1]!.kind).length
    if (!(changes(b!) >= 4)) out.push('round 2 must mix the fat and the lean cows')
  }
  return out
}

// ================================================================ 4. embrace (`umarmen`)

/** A brother: id, name, his two pictures (frightened, glad; the same size, standing at the bottom middle), where his feet stand, his height (percent of the field height), and whether he is Benjamin. */
export interface EmbraceBrother {
  id: string
  name: string
  scared: string
  glad: string
  x: number
  y: number
  h: number
  benjamin?: boolean
  flip?: boolean
}
/** One round: the hint, where Joseph starts, whether Benjamin is shown by a ring (round 1), and the brothers. */
export interface EmbraceRound {
  hint: string
  start: Pt
  showBenjamin: boolean
  brothers: EmbraceBrother[]
}
/** The game "Embrace": the hall (`background`, `ratio`), Joseph (picture, height), the ratio width / height of all figure pictures, how fast Joseph walks (units a second) and the rounds. */
export interface EmbraceGame {
  background: string
  ratio: number
  josef: string
  josefH: number
  figureRatio: number
  speed: number
  rounds: EmbraceRound[]
}

/** A tap on a brother: `ok` (Joseph goes to him), `benjamin` (Benjamin comes first: a mistake), `glad` (he was embraced already: nothing happens). */
export function embraceTap(round: EmbraceRound, done: ReadonlySet<string>, id: string): 'ok' | 'benjamin' | 'glad' {
  if (done.has(id)) return 'glad'
  const ben = round.brothers.find((b) => b.benjamin)
  if (ben && !done.has(ben.id) && ben.id !== id) return 'benjamin'
  return 'ok'
}
/** The next brother for "Help me": Benjamin first, then the nearest one who is still frightened. */
export function embraceNext(round: EmbraceRound, done: ReadonlySet<string>, from: Pt, ratio: number): EmbraceBrother | null {
  const ben = round.brothers.find((b) => b.benjamin)
  if (ben && !done.has(ben.id)) return ben
  const left = round.brothers.filter((b) => !done.has(b.id))
  if (!left.length) return null
  return left.reduce((a, b) => (josefDist(b, from, ratio) < josefDist(a, from, ratio) ? b : a))
}
/** The width of a figure (percent of the field width) from its height. */
export const figureWidth = (game: EmbraceGame, h: number): number => (h / 100) * game.figureRatio * (100 / game.ratio)
/** Where Joseph stands to embrace a brother: beside him, on the side of the middle of the hall. */
export function embraceSpot(game: EmbraceGame, b: EmbraceBrother): Pt {
  const w = figureWidth(game, b.h)
  const side = b.x > 50 ? -1 : 1
  return { x: b.x + side * w * 0.55, y: b.y + 0.5 }
}

/** The problems of the data of `umarmen` (an empty list is good). */
export function embraceProblems(game: EmbraceGame): string[] {
  const out: string[] = []
  if (!game.background || !game.josef) out.push('no picture of the hall or of Joseph')
  if (!(game.speed > 0)) out.push('Joseph does not walk')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    const bens = r.brothers.filter((b) => b.benjamin)
    if (bens.length !== 1) out.push(`round ${n}: there must be exactly one Benjamin`)
    if (new Set(r.brothers.map((b) => b.id)).size !== r.brothers.length) out.push(`round ${n}: two brothers have the same id`)
    if (r.brothers.length < 4) out.push(`round ${n}: fewer than four brothers`)
    for (const b of r.brothers) {
      if (!b.scared || !b.glad || !b.name) out.push(`round ${n}: the brother "${b.id}" has no pictures or no name`)
      const w = figureWidth(game, b.h)
      if (w * 0.6 < FINGER * 0.9) out.push(`round ${n}: the brother "${b.id}" is too narrow for a finger`)
      if (b.x - w / 2 < -2 || b.x + w / 2 > 102 || b.y - b.h < 0 || b.y > 100) out.push(`round ${n}: the brother "${b.id}" sticks out of the hall`)
    }
    // the tapping areas (the middle 60 % of a figure) do not overlap within the same row (rows: feet within 6 %)
    for (let i = 0; i < r.brothers.length; i++)
      for (let j = i + 1; j < r.brothers.length; j++) {
        const a = r.brothers[i]!
        const b = r.brothers[j]!
        if (Math.abs(a.y - b.y) > 6) continue
        const half = (figureWidth(game, a.h) + figureWidth(game, b.h)) * 0.3
        if (Math.abs(a.x - b.x) < half) out.push(`round ${n}: the brothers "${a.id}" and "${b.id}" stand on each other`)
      }
    // a figure of the back row is not hidden: its head stands above the head of the brother in front of it
    for (const a of r.brothers)
      for (const b of r.brothers) {
        if (b.y <= a.y + 6) continue
        if (Math.abs(a.x - b.x) < (figureWidth(game, a.h) + figureWidth(game, b.h)) * 0.3 && a.y - a.h > b.y - b.h - 8) out.push(`round ${n}: the brother "${a.id}" hides behind "${b.id}"`)
      }
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (!(b!.brothers.length > a!.brothers.length)) out.push('round 2 must have more brothers')
    if (b!.showBenjamin) out.push('round 2: Benjamin must be found without a ring')
    if (!a!.showBenjamin) out.push('round 1: Benjamin is shown by a ring')
  }
  return out
}

// ================================================================ 5. meeting (`begegnung`)

export type MeetSide = 'josef' | 'jakob'
/** Something on the road: on which side (Joseph's half on the left, Jacob's half on the right), in which lane, where (the middle, percent of the width), its picture and its width. */
export interface MeetObstacle {
  side: MeetSide
  lane: number
  x: number
  image: string
  w: number
}
/** One round: the hint, how fast both drive (percent of the width a second), the lanes where each starts, and what lies on the road. */
export interface MeetingRound {
  hint: string
  speed: number
  startLane: Record<MeetSide, number>
  obstacles: MeetObstacle[]
}
/**
 * The game "Meeting": the land of Goshen with the road (`background`, `ratio`), the lanes of the road (the line where the wheels stand, percent of the height), the two teams (pictures, width,
 * ratio of the picture; Joseph drives to the right from `from`, Jacob to the left from `100 - from`), the middle where they meet (`meet`; they stop `gap` apart), and the rounds.
 * A team that drives into something stops for `bump` seconds.
 */
export interface MeetingGame {
  background: string
  ratio: number
  lanes: number[]
  josef: { image: string; w: number; ratio: number }
  jakob: { image: string; w: number; ratio: number }
  from: number
  meet: number
  gap: number
  bump: number
  rounds: MeetingRound[]
}

/** Where the front of a team is when its middle is at `x`. */
export const meetFront = (game: MeetingGame, side: MeetSide, x: number): number => (side === 'josef' ? x + game.josef.w / 2 : x - game.jakob.w / 2)
/** Where a team stops in the middle (its middle). */
export const meetStop = (game: MeetingGame, side: MeetSide): number => (side === 'josef' ? game.meet - game.gap / 2 - game.josef.w / 2 : game.meet + game.gap / 2 + game.jakob.w / 2)
/** Where a team starts (its middle). */
export const meetStart = (game: MeetingGame, side: MeetSide): number => (side === 'josef' ? game.from : 100 - game.from)

export interface MeetTeam {
  x: number
  lane: number
  /** seconds it still stands after a bump */
  wait: number
  /** the obstacles it has passed or hit (indexes), so that each counts once */
  passed: number[]
}
export interface MeetState {
  josef: MeetTeam
  jakob: MeetTeam
}
export type MeetEvent = { type: 'bump'; side: MeetSide; obstacle: number } | { type: 'pass'; side: MeetSide; obstacle: number } | { type: 'arrived'; side: MeetSide } | { type: 'met' }

export function meetStartState(game: MeetingGame, ri: number): MeetState {
  const r = game.rounds[ri]!
  return {
    josef: { x: meetStart(game, 'josef'), lane: r.startLane.josef, wait: 0, passed: [] },
    jakob: { x: meetStart(game, 'jakob'), lane: r.startLane.jakob, wait: 0, passed: [] }
  }
}

/** The half-width of an obstacle that a front touches (a little less than its picture, the picture has air round it). */
const HIT = 0.35

/**
 * One tick: both teams drive toward the middle (unless they stand after a bump or have arrived). A front that reaches an obstacle in its own lane bumps (it stops `bump` seconds and the
 * obstacle counts as passed); a front that goes past an obstacle in another lane passes it. `arrived` once for each team, `met` when both are there.
 */
export function meetStep(game: MeetingGame, ri: number, st: MeetState, dt: number): { state: MeetState; events: MeetEvent[] } {
  const r = game.rounds[ri]!
  const events: MeetEvent[] = []
  const move = (side: MeetSide): MeetTeam => {
    const t = st[side]
    const stop = meetStop(game, side)
    const dir = side === 'josef' ? 1 : -1
    if ((stop - t.x) * dir <= 0) return t
    if (t.wait > 0) return { ...t, wait: Math.max(0, t.wait - dt) }
    let x = t.x + dir * r.speed * dt
    if ((stop - x) * dir <= 1e-6) {
      x = stop
      events.push({ type: 'arrived', side })
    }
    const passed = [...t.passed]
    let wait = 0
    r.obstacles.forEach((o, i) => {
      if (o.side !== side || passed.includes(i)) return
      const front = meetFront(game, side, x)
      const edge = o.x - dir * o.w * HIT
      if ((front - edge) * dir < 0) return
      passed.push(i)
      if (o.lane === t.lane) {
        // it stops in front of the obstacle
        x = edge - (meetFront(game, side, x) - x)
        wait = game.bump
        events.push({ type: 'bump', side, obstacle: i })
      } else events.push({ type: 'pass', side, obstacle: i })
    })
    return { x, lane: t.lane, wait, passed }
  }
  const state = { josef: move('josef'), jakob: move('jakob') }
  const there = (s: MeetSide) => Math.abs(state[s].x - meetStop(game, s)) < 1e-6
  if (there('josef') && there('jakob') && !events.some((e) => e.type === 'met') && !(Math.abs(st.josef.x - meetStop(game, 'josef')) < 1e-6 && Math.abs(st.jakob.x - meetStop(game, 'jakob')) < 1e-6)) events.push({ type: 'met' })
  return { state, events }
}

/** A change of lane: the lane nearest to the height `y` (percent) of a tap. */
export function meetLaneAt(game: MeetingGame, y: number): number {
  let best = 0
  game.lanes.forEach((l, i) => {
    if (Math.abs(l - y) < Math.abs(game.lanes[best]! - y)) best = i
  })
  return best
}

/** A safe lane for a team (for "Help me"): the lane of the next obstacle ahead is avoided, the lane that stays free longest is chosen. */
export function meetSafeLane(game: MeetingGame, ri: number, side: MeetSide, team: MeetTeam): number {
  const r = game.rounds[ri]!
  const dir = side === 'josef' ? 1 : -1
  const ahead = r.obstacles
    .map((o, i) => ({ o, i }))
    .filter(({ o, i }) => o.side === side && !team.passed.includes(i) && (o.x - meetFront(game, side, team.x)) * dir > -o.w)
    .sort((a, b) => (a.o.x - b.o.x) * dir)
  const freeFor = (lane: number) => {
    const hit = ahead.find(({ o }) => o.lane === lane)
    return hit ? Math.abs(hit.o.x - team.x) : 1000
  }
  let best = team.lane
  game.lanes.forEach((_, l) => {
    if (freeFor(l) > freeFor(best) + 0.01) best = l
  })
  return best
}

/** Drive a round: `steer` true lets both teams take the safe lane at every tick (the help), false keeps the start lanes. Whether they meet, how many bumps and how long it took. */
export function meetPlay(game: MeetingGame, ri: number, steer: boolean, dt = 0.05): { met: boolean; bumps: number; seconds: number } {
  let st = meetStartState(game, ri)
  let bumps = 0
  for (let t = 0; t < 120; t += dt) {
    if (steer) st = { josef: { ...st.josef, lane: meetSafeLane(game, ri, 'josef', st.josef) }, jakob: { ...st.jakob, lane: meetSafeLane(game, ri, 'jakob', st.jakob) } }
    const res = meetStep(game, ri, st, dt)
    st = res.state
    for (const e of res.events) {
      if (e.type === 'bump') bumps++
      if (e.type === 'met') return { met: true, bumps, seconds: t + dt }
    }
  }
  return { met: false, bumps, seconds: 120 }
}

/** The problems of the data of `begegnung` (an empty list is good). */
export function meetingProblems(game: MeetingGame): string[] {
  const out: string[] = []
  if (!game.background || !game.josef.image || !game.jakob.image) out.push('no picture of the land or of a team')
  if (game.lanes.length < 2) out.push('fewer than two lanes')
  for (let i = 1; i < game.lanes.length; i++) if (game.lanes[i]! <= game.lanes[i - 1]!) out.push('the lanes must go from the top down')
  // every lane can be tapped: the band nearest to a lane is at least 44 pixels high on a phone
  const fieldH = 360 / game.ratio
  game.lanes.forEach((l, i) => {
    const top = i === 0 ? 0 : (l + game.lanes[i - 1]!) / 2
    const bottom = i === game.lanes.length - 1 ? 100 : (l + game.lanes[i + 1]!) / 2
    if (((bottom - top) / 100) * fieldH < 44) out.push(`lane ${i + 1} is too narrow to tap`)
  })
  if (!(game.josef.w >= 14 && game.jakob.w >= 14)) out.push('a team is too small for a phone (at least 14 % of the width)')
  if (game.rounds.length < 2) out.push('fewer than two rounds')
  game.rounds.forEach((r, ri) => {
    const n = ri + 1
    for (const s of ['josef', 'jakob'] as MeetSide[]) if (!game.lanes[r.startLane[s]] && game.lanes[r.startLane[s]] !== 0) out.push(`round ${n}: the start lane of ${s} does not exist`)
    r.obstacles.forEach((o, i) => {
      if (!o.image || !(o.w >= 8)) out.push(`round ${n}: obstacle ${i + 1} has no picture or is too small`)
      if (game.lanes[o.lane] === undefined) out.push(`round ${n}: obstacle ${i + 1} lies in no lane`)
      const half = o.side === 'josef' ? [meetFront(game, 'josef', meetStart(game, 'josef')), meetFront(game, 'josef', meetStop(game, 'josef'))] : [meetFront(game, 'jakob', meetStop(game, 'jakob')), meetFront(game, 'jakob', meetStart(game, 'jakob'))]
      if (o.x - o.w * HIT < half[0]! + 4 || o.x + o.w * HIT > half[1]! - 1) out.push(`round ${n}: obstacle ${i + 1} does not lie on the way of ${o.side}`)
    })
    // every row of obstacles leaves a lane free, and two obstacles of the same side are far enough apart to change lane (at least one second of driving)
    for (const s of ['josef', 'jakob'] as MeetSide[]) {
      const os = r.obstacles.filter((o) => o.side === s).sort((a, b) => a.x - b.x)
      for (let i = 0; i < os.length; i++)
        for (let j = i + 1; j < os.length; j++) {
          const d = Math.abs(os[i]!.x - os[j]!.x)
          if (d < 1e-6 && os[i]!.lane === os[j]!.lane) out.push(`round ${n}: two obstacles of ${s} lie on each other`)
          if (d > 1e-6 && d < r.speed * 1.0) out.push(`round ${n}: two obstacles of ${s} are too close to change lane`)
        }
      const cols = new Map<number, Set<number>>()
      for (const o of os) cols.set(o.x, (cols.get(o.x) ?? new Set()).add(o.lane))
      for (const [x, lanes] of cols) if (lanes.size >= game.lanes.length) out.push(`round ${n}: at ${x} % all lanes of ${s} are blocked`)
      if (os.length < 2) out.push(`round ${n}: ${s} has fewer than two obstacles`)
      // the start lane is blocked somewhere (otherwise there is nothing to steer)
      if (!os.some((o) => o.lane === r.startLane[s])) out.push(`round ${n}: ${s} never has to steer`)
    }
    const help = meetPlay(game, ri, true)
    if (!help.met || help.bumps) out.push(`round ${n}: the help does not bring both together without a bump`)
    const none = meetPlay(game, ri, false)
    if (!none.met) out.push(`round ${n}: without steering they never meet`)
    if (help.seconds > 30) out.push(`round ${n}: the way takes too long (${help.seconds.toFixed(0)} s)`)
  })
  if (game.rounds.length >= 2) {
    const [a, b] = game.rounds
    if (!(b!.obstacles.length > a!.obstacles.length)) out.push('round 2 must have more obstacles')
    if (!(b!.speed >= a!.speed)) out.push('round 2 must not be slower')
  }
  return out
}
