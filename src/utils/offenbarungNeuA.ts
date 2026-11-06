/**
 * The pure parts of three games of "Alles wird neu" (no. 33, id `offenbarung`; the components only show and listen):
 * "Write it in a book" (`schreiben`, field `write`, Rev 1,11: the pen writes line by line and must be dipped in time),
 * "Seven letters" (`briefe`, field `letters`, Rev 1,11; 2-3: the messenger walks from city to city and the child gives him the right letter) and
 * "All join in" (`lob`, field `praise`, Rev 5,13: heaven, earth and sea are called to praise in the order of the verse, then all are kept singing).
 * All places are percent of the picture (width and height). Distances are measured in "units" (percent of the width), so that a circle is round
 * on the screen: `offDist` divides the vertical difference by the ratio of the picture. The arithmetic has no clock and no dice of its own.
 */

export interface Pt {
  x: number
  y: number
}
/** A rectangle of the picture (percent of the width and of the height). */
export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/** The distance of two places in units (percent of the width); the vertical difference is shortened by the ratio of the picture (width / height). */
export function offDist(a: Pt, b: Pt, ratio = 1.5): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) / ratio)
}
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

// ================================================================ 1. write it in a book (`schreiben`)

/** A round: the hint, how many lines are written and how long a line is in "inks" (1 = what one dip of the pen is worth divided by `inkPerDip`; see `writeStep`). */
export interface WriteRound {
  hint: string
  lines: number
  lineLength: number
}
/**
 * The game "Write it in a book" (`schreiben`): the desk seen from above (3:2, without pen and inkwell), the closed book for the end (same view), the inkwell, the pen, one strip of
 * writing (not readable, transparent) that is uncovered from left to right, the full and the empty drop. `inkwellAt` is the middle of the inkwell (percent) with the radius where the pen
 * is dipped (units) and `inkwellW` its width; `lineX` the start and end of every line (percent of the width), `lineYs` the heights of up to five lines (percent of the height),
 * `band` how far above or below a line the pen still writes (units), `scriptH` the height of the strip (percent of the height), `penW` the width of the pen (percent of the width) and
 * `penTip` the tip in the pen picture (share of its width and height), `penRest` where the pen lies at first, `dropAt`/`dropW` the middle and width of the drop that shows the ink (percent). One dip is worth `inkPerDip` of a line of length 1; at `warnAt` of the dip the drop blinks.
 */
export interface WriteGame {
  desk: string
  closed: string
  inkwell: string
  pen: string
  script: string
  dropFull: string
  dropEmpty: string
  ratio?: number
  inkwellAt: Pt & { r: number }
  inkwellW: number
  lineX: [number, number]
  lineYs: number[]
  band: number
  scriptH: number
  penW: number
  penTip: Pt
  penRest: Pt
  dropAt: Pt
  dropW: number
  inkPerDip: number
  warnAt: number
  rounds: WriteRound[]
}

/** How much of a line must be written to count it as done (the last bit is written with it). */
export const WRITE_DONE = 0.97
/** How far one press of the arrow key moves the pen along the line (share of a line). */
export const WRITE_KEY_STEP = 0.04

/** The heights of the lines of a round: `n` of the lines, in the middle of the sheet. */
export function writeLineYs(game: Pick<WriteGame, 'lineYs'>, n: number): number[] {
  const all = game.lineYs
  const start = Math.max(0, Math.floor((all.length - n) / 2))
  return all.slice(start, start + n)
}
/** The share of the line (0 to 1) that lies left of a place at `x` percent. */
export function writeFrac(game: Pick<WriteGame, 'lineX'>, x: number): number {
  const [a, b] = game.lineX
  return clamp((x - a) / (b - a), 0, 1)
}
/** The pen at `p` is close enough to the line at height `y` to write on it. */
export function writeOnLine(game: Pick<WriteGame, 'band' | 'lineX'>, p: Pt, y: number, ratio = 1.5): boolean {
  return Math.abs(p.y - y) / ratio <= game.band && p.x >= game.lineX[0] - game.band && p.x <= game.lineX[1] + game.band
}
/** The pen at `p` is over the inkwell. */
export const writeAtWell = (game: Pick<WriteGame, 'inkwellAt'>, p: Pt, ratio = 1.5): boolean => offDist(p, game.inkwellAt, ratio) <= game.inkwellAt.r

/**
 * The pen is drawn along a line: `w` is the share already written, `ink` the ink in the pen (in dips: 1 is full), `target` the share the finger has reached, `perDip` what one dip is worth
 * and `length` the length of the line. Writing never goes back, and never farther than the ink reaches; `dry` says that the ink ran out before the finger arrived.
 */
export function writeStep(w: number, ink: number, target: number, perDip: number, length: number): { w: number; ink: number; dry: boolean } {
  let want = Math.max(w, Math.min(1, target))
  if (want >= WRITE_DONE) want = 1
  const reach = (ink * perDip) / length
  const nw = Math.min(want, w + reach)
  const used = ((nw - w) * length) / perDip
  const left = ink - used
  return { w: nw, ink: left < 1e-9 ? 0 : left, dry: nw < want - 1e-9 }
}
/** How many dips a round takes at least. */
export const writeDips = (game: Pick<WriteGame, 'inkPerDip'>, round: Pick<WriteRound, 'lines' | 'lineLength'>): number => Math.ceil((round.lines * round.lineLength) / game.inkPerDip - 1e-9)

/** The problems of the data of `schreiben` (an empty list is good). */
export function writeProblems(game: WriteGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  for (const k of ['desk', 'closed', 'inkwell', 'pen', 'script', 'dropFull', 'dropEmpty'] as const) if (!game[k]) out.push(`no picture "${k}"`)
  const [a, b] = game.lineX
  if (a < 2 || b > 98 || b - a < 40) out.push('the lines should be at least 40 percent wide and inside the picture')
  if (game.lineYs.length < 5) out.push('there must be heights for five lines')
  game.lineYs.forEach((y, i) => {
    if (y < 4 || y > 96) out.push(`line ${i + 1} lies outside the picture`)
    if (i > 0 && (y - game.lineYs[i - 1]!) / ratio < game.band * 1.6) out.push(`line ${i + 1} is too close to the line above (the bands overlap)`)
  })
  if (game.band < 3 || game.band > 9) out.push('the band around a line should be between 3 and 9 units (an easy target for a finger)')
  const w = game.inkwellAt
  if (w.r < 6) out.push('the inkwell is too small to hit with a finger (radius at least 6 units)')
  if (w.x - w.r < 0 || w.x + w.r > 100 || w.y < 0 || w.y > 100) out.push('the inkwell lies outside the picture')
  if (game.inkwellW < 8) out.push('the inkwell picture should be at least 8 percent wide')
  for (const y of game.lineYs) {
    const dx = Math.max(a - w.x, 0, w.x - b)
    if (Math.hypot(dx, (w.y - y) / ratio) < w.r + game.band) {
      out.push('the inkwell touches the band of a line (dipping and writing would mix)')
      break
    }
  }
  if (game.penW < 6 || game.penW > 20) out.push('the pen should be between 6 and 20 percent wide')
  if (game.scriptH < 3) out.push('the strip of writing is too thin')
  if (game.dropW < 5) out.push('the drop is too small to see')
  for (const [k, p] of [['pen', game.penRest], ['drop', game.dropAt]] as const) if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) out.push(`the ${k} lies outside the picture`)
  if (game.penTip.x < 0 || game.penTip.x > 1 || game.penTip.y < 0 || game.penTip.y > 1) out.push('the tip of the pen must lie inside the pen picture (0 to 1)')
  if (game.inkPerDip < 0.3 || game.inkPerDip > 1) out.push('one dip should be worth between 0.3 and 1 line of length 1')
  if (game.warnAt <= 0 || game.warnAt >= 0.5) out.push('the warning belongs between 0 and 50 percent of a dip')
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    if (r.lines < 1 || r.lines > game.lineYs.length) out.push(`round ${n}: ${r.lines} lines do not fit the sheet`)
    if (r.lineLength < 0.5 || r.lineLength > 2) out.push(`round ${n}: a line of length ${r.lineLength} is not sensible`)
    if (r.lineLength <= game.inkPerDip) out.push(`round ${n}: a line needs more than one dip, or there is nothing to keep house with`)
    if (writeDips(game, r) > 16) out.push(`round ${n}: more than sixteen dips are tiring`)
  })
  if (game.rounds.length === 2) {
    if (game.rounds[1]!.lines <= game.rounds[0]!.lines) out.push('round 2 should have more lines than round 1')
    if (game.rounds[1]!.lineLength <= game.rounds[0]!.lineLength) out.push('round 2 should have longer lines than round 1')
  }
  return out
}

// ================================================================ 2. seven letters (`briefe`)

/** A city: its name, where it lies on the road (0 to 1 along the path) and the picture of its letter (a roll with a seal that shows the landmark of the city; 220 x 120, transparent). */
export interface LettersCity {
  id: string
  name: string
  at: number
  letter: string
}
/** A round: the cities in the order of the visit, whether the name stands at the gate, and the order of the letters in the satchel. */
export interface LettersRound {
  hint: string
  cities: string[]
  names: boolean
  tray: string[]
}
/**
 * The game "Seven letters" (`briefe`): the painted map (3:2, without writing), the road as a line of places (percent), the two walking pictures of the messenger (160 x 260, transparent) and the
 * little golden lamp that lights in a gate (120 x 180). `speed` is how fast the messenger walks (units a second), `messengerW` his width (percent), `gateR` the radius of a gate (units).
 */
export interface LettersGame {
  map: string
  messenger: [string, string]
  lamp: string
  ratio?: number
  path: Pt[]
  speed: number
  messengerW: number
  gateR: number
  lampW: number
  cities: LettersCity[]
  rounds: LettersRound[]
}

/** The length of the road in units. */
export function lettersLength(path: readonly Pt[], ratio = 1.5): number {
  let s = 0
  for (let i = 1; i < path.length; i++) s += offDist(path[i - 1]!, path[i]!, ratio)
  return s
}
/** The place at `at` (0 to 1) along the road, measured in units of walking. */
export function lettersPointAt(path: readonly Pt[], at: number, ratio = 1.5): Pt {
  if (path.length === 0) return { x: 0, y: 0 }
  const total = lettersLength(path, ratio)
  let rest = clamp(at, 0, 1) * total
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    const d = offDist(a, b, ratio)
    if (rest <= d || i === path.length - 1) {
      const f = d > 0 ? Math.min(1, rest / d) : 0
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    }
    rest -= d
  }
  return { ...path[path.length - 1]! }
}
/** How many milliseconds the messenger walks from `from` to `to` (both 0 to 1 along the road). */
export function lettersWalkMs(game: Pick<LettersGame, 'path' | 'speed' | 'ratio'>, from: number, to: number): number {
  return (Math.abs(to - from) * lettersLength(game.path, game.ratio ?? 1.5) * 1000) / game.speed
}
/** A letter given at a gate: right when it is the letter of the city at that gate. */
export const lettersFits = (gate: string, letter: string): boolean => gate === letter
/** Where the gate of a city is (percent). */
export function lettersGate(game: Pick<LettersGame, 'path' | 'ratio'>, city: Pick<LettersCity, 'at'>): Pt {
  return lettersPointAt(game.path, city.at, game.ratio ?? 1.5)
}

/** The problems of the data of `briefe` (an empty list is good). */
export function lettersProblems(game: LettersGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.map) out.push('no picture of the map')
  if (!game.messenger[0] || !game.messenger[1]) out.push('the messenger needs two walking pictures')
  if (!game.lamp) out.push('no picture of the lamp')
  if (game.path.length < 4) out.push('the road needs at least four places')
  game.path.forEach((p, i) => {
    if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) out.push(`place ${i + 1} of the road lies outside the picture`)
  })
  if (game.speed < 5 || game.speed > 40) out.push('the messenger should walk between 5 and 40 units a second')
  if (game.messengerW < 8 || game.messengerW > 18) out.push('the messenger should be between 8 and 18 percent wide (about 40 px on a phone)')
  if (game.gateR < 6) out.push('a gate is too small to see on a phone (radius at least 6 units)')
  if (game.lampW < 4) out.push('the lamp is too small')
  const ids = game.cities.map((c) => c.id)
  if (new Set(ids).size !== ids.length) out.push('two cities have the same id')
  game.cities.forEach((c, i) => {
    if (!c.letter) out.push(`city ${c.id} has no letter`)
    if (!c.name) out.push(`city ${c.id} has no name`)
    if (c.at <= 0 || c.at > 1) out.push(`city ${c.id}: its place on the road must be above 0 and at most 1`)
    if (i > 0 && c.at <= game.cities[i - 1]!.at) out.push(`city ${c.id} does not come after ${game.cities[i - 1]!.id} on the road`)
  })
  const total = lettersLength(game.path, ratio)
  game.cities.forEach((c, i) => {
    if (i > 0 && (c.at - game.cities[i - 1]!.at) * total < game.gateR * 1.5) out.push(`the gates of ${game.cities[i - 1]!.id} and ${c.id} lie too close together`)
    const g = lettersGate(game, c)
    if (g.x - game.gateR < 0 || g.x + game.gateR > 100 || g.y < 0 || g.y > 100) out.push(`the gate of ${c.id} reaches out of the picture`)
  })
  if (game.rounds.length !== 2) out.push('there must be two rounds')
  game.rounds.forEach((r, i) => {
    const n = i + 1
    const want = game.cities.slice(0, r.cities.length).map((c) => c.id)
    if (r.cities.join() !== want.join()) out.push(`round ${n}: the cities must be the first ${r.cities.length} of the road, in order`)
    if (r.tray.length !== r.cities.length || [...r.tray].sort().join() !== [...r.cities].sort().join()) out.push(`round ${n}: the satchel must hold exactly the letters of the round`)
    if (r.cities.length > 1 && r.tray.join() === r.cities.join()) out.push(`round ${n}: the satchel must not hold the letters in the order of the visit`)
  })
  if (game.rounds.length === 2) {
    if (game.rounds[1]!.cities.length <= game.rounds[0]!.cities.length) out.push('round 2 should visit more cities than round 1')
    if (!game.rounds[0]!.names) out.push('round 1 shows the names at the gates')
    if (game.rounds[1]!.names) out.push('round 2 is played without the names at the gates')
  }
  return out
}

// ================================================================ 3. all join in (`lob`)

/**
 * A group that can sing: heaven, earth or the sea (`name` "Der Himmel", `place` "im Himmel" as John hears it). `box` is the area of the picture that belongs to it (percent), `still` and `sing` are strips as wide as the picture and as high as the area
 * (transparent, laid over the world: the group still, the group singing), `fade` how long the song lasts without a new call (milliseconds, round 2) and `offset` how far into the fading
 * it starts (so that the groups do not fall silent at the same moment).
 */
export interface PraiseZone {
  id: string
  name: string
  place: string
  box: Box
  still: string
  sing: string
  fade: number
  offset: number
}
/** The game "All join in" (`lob`): the world (3:2), the lamb, the golden arc of sound (200 x 200, transparent), the groups in the order of the verse and the time the song must last in round 2. */
export interface PraiseGame {
  world: string
  lamb: string
  wave: string
  ratio?: number
  lambAt: Pt & { w: number }
  zones: PraiseZone[]
  order: string[]
  duration: number
  silent: number
  rounds: { hint: string }[]
}

/** Round 1: the next group of the verse is `order[sung.length]`; a group called out of order is wrong, a group that already sings is only "again" (no mistake). */
export function praiseTap(order: readonly string[], sung: readonly string[], id: string): 'ok' | 'again' | 'wrong' {
  if (sung.includes(id)) return 'again'
  return order[sung.length] === id ? 'ok' : 'wrong'
}
/** Round 2: how loud a group sings (1 to 0), `since` milliseconds after the last call; the group starts `offset` into the fading. */
export function praiseVolume(zone: Pick<PraiseZone, 'fade' | 'offset'>, since: number): number {
  return clamp(1 - (since + zone.offset) / zone.fade, 0, 1)
}
/** The quietest of the groups (the first one when several are as quiet). */
export function praiseQuietest(volumes: readonly number[]): number {
  let at = 0
  volumes.forEach((v, i) => {
    if (v < volumes[at]!) at = i
  })
  return at
}
/** The group at a place of the picture (percent), or -1. */
export function praiseZoneAt(zones: readonly Pick<PraiseZone, 'box'>[], p: Pt): number {
  return zones.findIndex((z) => p.x >= z.box.left && p.x <= z.box.right && p.y >= z.box.top && p.y <= z.box.bottom)
}

/** The problems of the data of `lob` (an empty list is good). */
export function praiseProblems(game: PraiseGame): string[] {
  const out: string[] = []
  const ratio = game.ratio ?? 1.5
  if (!game.world) out.push('no picture of the world')
  if (!game.lamb) out.push('no picture of the lamb')
  if (!game.wave) out.push('no picture of the arc of sound')
  if (game.zones.length !== 3) out.push('there must be three groups (heaven, earth, sea)')
  if (game.order.length !== game.zones.length || [...game.order].sort().join() !== game.zones.map((z) => z.id).sort().join()) out.push('the order must name every group once')
  game.zones.forEach((z, i) => {
    const b = z.box
    if (!z.still || !z.sing) out.push(`group ${z.id} needs a still and a singing picture`)
    if (!z.name || !z.place) out.push(`group ${z.id} needs a name and a place`)
    if (b.left < 0 || b.right > 100 || b.top < 0 || b.bottom > 100 || b.right - b.left < 30) out.push(`group ${z.id}: the area is outside the picture or too narrow`)
    if (((b.bottom - b.top) / 100) * (100 / ratio) < 10) out.push(`group ${z.id}: the area is too low to tap (at least 10 units high)`)
    if (z.fade < 3000 || z.fade > 12000) out.push(`group ${z.id}: the song should fade within 3 to 12 seconds`)
    if (z.offset < 0 || z.offset >= z.fade * 0.6) out.push(`group ${z.id}: the offset should be below 60 percent of the fading time`)
    if (z.fade - z.offset >= game.duration) out.push(`group ${z.id}: round 2 would be won without one call (fading must be shorter than the time)`)
    game.zones.forEach((o, k) => {
      if (k > i && b.left < o.box.right && o.box.left < b.right && b.top < o.box.bottom && o.box.top < b.bottom) out.push(`the groups ${z.id} and ${o.id} overlap`)
    })
  })
  if (game.duration < 10000 || game.duration > 30000) out.push('round 2 should last 10 to 30 seconds')
  if (game.silent < 1000 || game.silent > 4000) out.push('a group that fell silent should sing again after 1 to 4 seconds')
  if (game.rounds.length !== 2 || game.rounds.some((r) => !r.hint)) out.push('there must be two rounds, each with a hint')
  if (game.lambAt.w < 6) out.push('the lamb is too small')
  const fades = game.zones.map((z) => z.fade - z.offset)
  if (fades.length === 3 && Math.max(...fades) - Math.min(...fades) < 500) out.push('the groups should not fall silent at the same moment (offsets or fading times should differ)')
  return out
}
