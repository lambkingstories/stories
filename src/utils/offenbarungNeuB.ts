/**
 * The pure parts of two games of "Alles wird neu" (no. 33, id `offenbarung`; the components only show and listen):
 * "Palm branches" (`palmen`, field `palms`, Rev 7,9: one calm stroke over the crowd lets the branches rise like a wave, and the speed of the stroke counts) and
 * "Twelve pearl gates" (`perlentore`, field `gates`, Rev 21,12-13.21: three gates of pearl go to each side of the wall that the verse names).
 * All places are percent of the picture. The arithmetic has no clock and no dice of its own (the clock is handed in).
 */
import { offDist } from '@/utils/offenbarungNeuA'
import type { Pt } from '@/utils/offenbarungNeuA'

export type { Pt }
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

// ================================================================ 4. palm branches (`palmen`)

/** A row of the crowd: the picture with the branches down and the picture with the branches up (both as wide as the picture, transparent, the same people in the same places), its top and height (percent of the picture height). */
export interface PalmsRow {
  down: string
  up: string
  y: number
  h: number
}
/** A wave: which row it runs through and the allowed speed (widths of the picture a second, from the slowest to the fastest). */
export interface PalmsWave {
  row: number
  speed: [number, number]
}
/** A round: the hint and the waves in the order they are asked for. */
export interface PalmsRound {
  hint: string
  waves: PalmsWave[]
}
/**
 * The game "Palm branches" (`palmen`): the empty place (3:1), the lamb (small, in the middle at the back), the two pictures of the speed meter (a palm and a needle, 160 x 160, transparent),
 * the rows from the front to the back, how many people (columns) every strip is cut into, how long the branches stay up (milliseconds) and the rounds.
 */
export interface PalmsGame {
  crowd: string
  lamb: string
  meterPalm: string
  meterNeedle: string
  ratio?: number
  lambAt: Pt & { w: number }
  cols: number
  hold: number
  rows: PalmsRow[]
  rounds: PalmsRound[]
}

/** The finger must go down in this left share of the picture to begin a stroke. */
export const PALMS_START_MAX = 0.3
/** The speed is measured over this many milliseconds. */
export const PALMS_WINDOW_MS = 500
/** A speed that is wrong for this many milliseconds in all breaks the wave. */
export const PALMS_BAD_MS = 600
/** The wave counts as arrived when the finger is this far over (share of the width). */
export const PALMS_END = 0.97

/** The allowed speeds; with less motion the window is twice as wide. */
export function palmsWindow(speed: readonly [number, number], wide = false): [number, number] {
  if (!wide) return [speed[0], speed[1]]
  const w = speed[1] - speed[0]
  return [Math.max(0.05, speed[0] - w / 2), speed[1] + w / 2]
}
/** Too slow, right, or too fast. */
export function palmsTempo(v: number, win: readonly [number, number]): 'slow' | 'ok' | 'fast' {
  if (v < win[0]) return 'slow'
  if (v > win[1]) return 'fast'
  return 'ok'
}
/** The middle of the allowed speeds (what the key and the helping dot go at). */
export const palmsIdeal = (win: readonly [number, number]): number => (win[0] + win[1]) / 2

/** The state of one stroke: how far the front has come (share of the width), the track of the last moments, how long the speed was wrong, the people who stand with their branches up (time they went up), those who were passed too quickly. */
export interface Stroke {
  front: number
  track: { t: number; f: number }[]
  bad: number
  last: number
  fail: null | 'slow' | 'fast'
  done: boolean
  tempo: 'slow' | 'ok' | 'fast' | null
  raised: (number | null)[]
  skipped: boolean[]
}
export function strokeStart(cols: number, x: number, now: number): Stroke {
  return { front: clamp(x, 0, 1), track: [{ t: now, f: clamp(x, 0, 1) }], bad: 0, last: now, fail: null, done: false, tempo: null, raised: new Array<number | null>(cols).fill(null), skipped: new Array<boolean>(cols).fill(false) }
}
/** The speed over the last moments (widths a second); in the first 200 milliseconds the distance is divided by 200, so that a lightning stroke is "fast" and a slow start is not judged "slow". */
export function strokeSpeed(s: Pick<Stroke, 'track'>, now: number): number | null {
  const first = s.track[0]
  const last = s.track[s.track.length - 1]
  if (!first || !last || now <= first.t) return null
  return (last.f - first.f) / (Math.max(200, now - first.t) / 1000)
}
/**
 * The finger is at `x` (share of the width) at time `now`. Raises the people the front has passed (when the speed is right), notes those it passed too fast, counts the time the speed is wrong
 * and ends the stroke: `done` at the right end, `fail` when the speed was wrong too long. The speed is only judged once the finger has moved on a little from where it went down
 * (`startX`); in the first 200 milliseconds only "too fast" is judged.
 */
export function strokeTick(s: Stroke, win: readonly [number, number], x: number, now: number, startX = 0): Stroke {
  if (s.fail || s.done) return s
  const dt = Math.max(0, now - s.last)
  s.last = now
  const to = clamp(x, 0, 1)
  const cols = s.raised.length
  const reach = Math.max(s.front, to)
  const started = reach - startX > 0.04
  if (started) s.track.push({ t: now, f: reach })
  else s.track = [{ t: now, f: reach }]
  while (s.track.length > 2 && now - s.track[1]!.t >= PALMS_WINDOW_MS) s.track.shift()
  let tempo: 'slow' | 'ok' | 'fast' | null = null
  const v = started ? strokeSpeed(s, now) : null
  if (v !== null) {
    const young = now - s.track[0]!.t < 200
    tempo = palmsTempo(v, win)
    if (young && tempo === 'slow') tempo = null
  }
  s.tempo = tempo
  if (tempo === 'fast' || tempo === 'slow') s.bad += dt
  else s.bad = Math.max(0, s.bad - dt)
  if (to > s.front) {
    for (let c = 0; c < cols; c++) {
      const mid = (c + 0.5) / cols
      if (mid > s.front && mid <= to) {
        if (tempo === 'fast') s.skipped[c] = true
        else s.raised[c] = now
      }
    }
    s.front = to
  }
  if (s.bad >= PALMS_BAD_MS) {
    s.fail = tempo === 'fast' ? 'fast' : 'slow'
    return s
  }
  if (s.front >= PALMS_END) {
    if (s.skipped.some(Boolean)) {
      s.fail = 'fast'
      return s
    }
    for (let c = 0; c < cols; c++) if (s.raised[c] === null) s.raised[c] = now
    s.done = true
  }
  return s
}
/** A person stands with the branches up at time `now`. */
export const palmsUp = (hold: number, raisedAt: number | null, now: number): boolean => raisedAt !== null && now - raisedAt < hold

/** The problems of the data of `palmen` (an empty list is good). */
export function palmsProblems(game: PalmsGame): string[] {
  const out: string[] = []
  if (!game.crowd) out.push('no picture of the place')
  if (!game.lamb) out.push('no picture of the lamb')
  if (!game.meterPalm || !game.meterNeedle) out.push('no pictures of the speed meter')
  if (game.cols < 8 || game.cols > 14) out.push('a row should be cut into 8 to 14 people')
  if (game.hold < 600 || game.hold > 2000) out.push('the branches should stay up for 0.6 to 2 seconds')
  if (game.rows.length !== 3) out.push('there must be three rows')
  game.rows.forEach((r, i) => {
    if (!r.down || !r.up) out.push(`row ${i + 1} needs both pictures`)
    if (r.y < 0 || r.y + r.h > 100.5) out.push(`row ${i + 1} lies outside the picture`)
    if (r.h < 20) out.push(`row ${i + 1} is too low to see people`)
    if (i > 0 && r.y >= game.rows[i - 1]!.y) out.push(`row ${i + 1} should lie behind (above) row ${i}`)
  })
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((rd, i) => {
    const n = i + 1
    if (!rd.hint) out.push(`round ${n} has no hint`)
    if (rd.waves.length < 1) out.push(`round ${n}: no wave`)
    for (const w of rd.waves) {
      if (!game.rows[w.row]) out.push(`round ${n}: a wave runs through a row that is not there`)
      const [lo, hi] = w.speed
      if (lo < 0.1 || hi > 1.2 || hi - lo < 0.25) out.push(`round ${n}: the allowed speed ${lo}-${hi} is too narrow or too extreme (at least 0.25 wide, between 0.1 and 1.2)`)
      // with less motion the window is wider; the sweep must still take longer than the branches stay up (so that the wave is a hump and not the whole row at once)
      if (1 / hi >= game.hold / 1000 + 5) out.push(`round ${n}: the sweep is too slow`)
    }
  })
  if (game.rounds.length === 2) {
    const a = game.rounds[0]!
    const b = game.rounds[1]!
    if (a.waves.length !== 2 || new Set(a.waves.map((w) => w.row)).size !== 1) out.push('round 1: two waves through one row')
    if (b.waves.length !== 3 || b.waves.map((w) => w.row).join() !== '0,1,2') out.push('round 2: one wave each through the front, middle and back row')
    if (b.waves.length === 3 && !(b.waves[2]!.speed[1] <= b.waves[0]!.speed[1])) out.push('round 2: the back row is longer, so it should be slower than the front row')
  }
  return out
}

// ================================================================ 5. twelve pearl gates (`perlentore`)

/** A side of the wall: its id, the old word the verse uses, the piece of the verse that asks for it ("Vom Morgen drei Tore"), the word for the screen reader (with the direction), where the three openings are (percent) and the direction in which the tip of the compass rose points (-1 to 1). */
export interface GatesSide {
  id: string
  word: string
  part: string
  name: string
  openings: Pt[]
  dir: Pt
}
/** A round: the hint and the sides in the order of the verse. */
export interface GatesRound {
  hint: string
  order: string[]
}
/**
 * The game "Twelve pearl gates" (`perlentore`): the city from above (square, with twelve empty openings), the same view with all gates open and people going in (for the end), the compass rose
 * (360 x 360, transparent), one gate of pearl (180 x 180, transparent). `roseAt` is the middle of the rose (percent), `roseW` its width, `gateW` the width of a gate in an opening, `openR` the
 * reach of an opening for a dropped gate (units). The sides are the four sides of the wall with their three openings.
 */
export interface GatesGame {
  city: string
  cityOpen: string
  rose: string
  gate: string
  roseAt: Pt
  roseW: number
  gateW: number
  openR: number
  sides: GatesSide[]
  rounds: GatesRound[]
}

export const gatesKey = (side: string, i: number): string => `${side}-${i}`
/** The side whose gates are asked for now: the first of the round that does not have its three gates yet. */
export function gatesWanted(round: Pick<GatesRound, 'order'>, placed: ReadonlySet<string>, per = 3): string | null {
  for (const id of round.order) {
    let n = 0
    for (let i = 0; i < per; i++) if (placed.has(gatesKey(id, i))) n++
    if (n < per) return id
  }
  return null
}
/** A gate dropped on an opening: it fits when it is the side that is asked for and the opening is free; a taken opening is no mistake. */
export function gatesDrop(wanted: string | null, placed: ReadonlySet<string>, side: string, i: number): 'ok' | 'taken' | 'wrong' {
  if (placed.has(gatesKey(side, i))) return 'taken'
  return wanted !== null && side === wanted ? 'ok' : 'wrong'
}
/** The opening nearest to a place (percent of a square picture) within its reach, or null. */
export function gatesOpeningAt(game: Pick<GatesGame, 'sides' | 'openR'>, p: Pt): { side: string; i: number } | null {
  let best: { side: string; i: number } | null = null
  let bestD = Infinity
  for (const s of game.sides) {
    s.openings.forEach((o, i) => {
      const d = offDist(p, o, 1)
      if (d <= game.openR && d < bestD) {
        best = { side: s.id, i }
        bestD = d
      }
    })
  }
  return best
}
/** The tip of the compass rose that points at a side (percent of the picture). */
export function gatesTip(game: Pick<GatesGame, 'roseAt' | 'roseW'>, side: Pick<GatesSide, 'dir'>): Pt {
  const r = game.roseW * 0.4
  return { x: game.roseAt.x + side.dir.x * r, y: game.roseAt.y + side.dir.y * r }
}

/** The problems of the data of `perlentore` (an empty list is good). */
export function gatesProblems(game: GatesGame): string[] {
  const out: string[] = []
  if (!game.city || !game.cityOpen) out.push('no pictures of the city')
  if (!game.rose) out.push('no picture of the compass rose')
  if (!game.gate) out.push('no picture of the gate')
  if (game.sides.length !== 4) out.push('there must be four sides')
  if (game.gateW < 6 || game.gateW > 16) out.push('a gate should be between 6 and 16 percent wide')
  if (game.openR < 5) out.push('the reach of an opening is too small for a finger (at least 5 units)')
  const all: { id: string; p: Pt }[] = []
  for (const s of game.sides) {
    if (s.openings.length !== 3) out.push(`side ${s.id}: three openings are needed`)
    if (!s.word || !s.name || !s.part) out.push(`side ${s.id} has no word`)
    s.openings.forEach((o, i) => {
      if (o.x - game.gateW / 2 < 0 || o.x + game.gateW / 2 > 100 || o.y - game.gateW / 2 < 0 || o.y + game.gateW / 2 > 100) out.push(`side ${s.id}: opening ${i + 1} reaches out of the picture`)
      all.push({ id: gatesKey(s.id, i), p: o })
    })
    if (Math.hypot(s.dir.x, s.dir.y) < 0.9) out.push(`side ${s.id}: the direction of the rose tip is missing`)
  }
  const w = game.roseW
  if (w < 12 || w > 40) out.push('the compass rose should be between 12 and 40 percent wide')
  if (game.roseAt.x - w / 2 < 0 || game.roseAt.x + w / 2 > 100 || game.roseAt.y - w / 2 < 0 || game.roseAt.y + w / 2 > 100) out.push('the compass rose reaches out of the picture')
  all.forEach((a, i) => {
    all.forEach((b, k) => {
      if (k > i && offDist(a.p, b.p, 1) < game.gateW * 1.1) out.push(`the openings ${a.id} and ${b.id} are too close together (the gates would overlap)`)
    })
    if (offDist(a.p, game.roseAt, 1) < w / 2 + game.gateW / 2) out.push(`the opening ${a.id} lies under the compass rose`)
  })
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  const ids = game.sides.map((s) => s.id)
  const seen: string[] = []
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (!r.hint) out.push(`round ${n} has no hint`)
    if (r.order.length !== 2) out.push(`round ${n}: two sides each`)
    for (const id of r.order) {
      if (!ids.includes(id)) out.push(`round ${n}: the side "${id}" is not there`)
      seen.push(id)
    }
  })
  if (game.rounds.length === 2 && [...seen].sort().join() !== [...ids].sort().join()) out.push('the two rounds must together name every side once')
  return out
}
