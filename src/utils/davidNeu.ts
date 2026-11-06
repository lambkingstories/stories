/**
 * The pure parts of the three new games of "David" (5.11.2026, Anton's plan; the components only show and listen):
 * 1. "Load the donkey" (`eselladen`, field `donkeyLoad`, 1 Samuel 25,18): Abigail's gifts (bread, wine jars, raisin cakes, fig cakes) go into the two baskets of the pack saddle so that the
 *    load hangs straight. The load leans to the heavier side; in round 2 it may never lean too far while loading (then the last good slides back), so the light goods must go first.
 * 2. "The gate of Hebron" (`hebrontor`, field `gateTime`, 2 Samuel 5,1-3): the tribes of Israel come along the road one after another; the child opens the gate exactly when a group stands
 *    in front of it (not while it is still far away, and not so late that it has to wait).
 * 3. "The festive procession" (`festzug`, field `festMarch`, 2 Samuel 6,5): the musicians play harp, drum, rattles and cymbals; the child taps the one who lights up (round 1),
 *    then plays short tunes after them (round 2).
 * All places are percent of the picture: x a part of the width, y a part of the height. The arithmetic has no clock and no dice: times are passed in.
 */
import { mistakeStars } from '@/utils/adventureScore'

export interface Pt {
  x: number
  y: number
}
/** A figure on the picture: `x` the middle, `y` the feet (bottom edge), `w` the width, all percent of the picture. */
export interface Spot {
  x: number
  y: number
  w: number
}

/** Stars at the end of every game: up to two mistakes three stars, up to four two stars, then one (the same as `osterStars`). */
export const davidNeuStars = (mistakes: number): number => mistakeStars(Math.max(0, mistakes), 2, 4)

const inside = (v: number, lo = 0, hi = 100) => Number.isFinite(v) && v >= lo && v <= hi

// ================================================================ 1. load the donkey (`eselladen`)

export type DonkeyWare = 'brot' | 'krug' | 'rosinen' | 'feigen'
export const DONKEY_WARES: DonkeyWare[] = ['brot', 'krug', 'rosinen', 'feigen']
export type DonkeySide = 0 | 1

/** A kind of good: its painted picture (cut from one sheet, transparent, square), its name (German in the data, English over it) and its weight (1 light, 2 middle, 3 heavy). */
export interface DonkeyGood {
  image: string
  name: string
  weight: 1 | 2 | 3
}
/**
 * One round: the goods to load (kinds, in the order of the strip), how many goods fit into one basket (`places`), and how far the load may lean while loading (`maxLean`, the
 * difference of the weights of the two sides; a good that would make it lean more slides back, a mistake). Round 1 has no limit (a big number), only the end must be straight.
 */
export interface DonkeyRound {
  hint: string
  goods: DonkeyWare[]
  places: number
  maxLean: number
}
/**
 * The game "Load the donkey": the yard (`background`, `ratio` = width / height), the donkey seen from the front (`donkeyPos`: the middle of its hooves and its width), the pack saddle with
 * the two baskets (`saddle`, `saddleRatio` = width / height of the picture; `saddlePos`: the middle of its top edge, where it lies on the donkey's back, and its width; it turns about that point),
 * the open tops of the two baskets (`baskets`, percent of the SADDLE picture, so that they turn with it), the goods and their size (`goodW`, percent of the saddle's width), Abigail beside
 * the donkey (optional) and the rounds.
 */
export interface DonkeyLoadGame {
  background: string
  ratio: number
  /** The donkey as a picture of its own; empty when it is painted into the yard (then `donkeyPos` and `donkeyRatio` describe the painted donkey). */
  donkey?: string
  donkeyRatio: number
  donkeyPos: Spot
  saddle: string
  saddleRatio: number
  saddlePos: Spot
  baskets: [Pt, Pt]
  goods: Record<DonkeyWare, DonkeyGood>
  goodW: number
  abigail?: string
  abigailRatio?: number
  abigailPos?: Spot
  rounds: DonkeyRound[]
}

/** What lies in the baskets: for each side the indexes of the round's goods, in the order they were put in. */
export type DonkeyLoad = [number[], number[]]

/** How much the load leans: the weight of the right basket less the weight of the left one (positive: it leans to the right). */
export function donkeyLean(game: Pick<DonkeyLoadGame, 'goods'>, round: DonkeyRound, load: DonkeyLoad): number {
  const w = (side: number[]) => side.reduce((s, i) => s + game.goods[round.goods[i]!].weight, 0)
  return w(load[1]) - w(load[0])
}
/** The turn of the saddle in degrees for a lean (clockwise = to the right), at most 16 degrees. */
export const DONKEY_DEG = 5
export const donkeyAngle = (lean: number): number => Math.max(-16, Math.min(16, lean * DONKEY_DEG))

export type DonkeyVerdict = 'ok' | 'full' | 'lean' | 'loaded'
/** May good `i` go into basket `side` now? `ok`, `full` (the basket has no place left), `lean` (the load would lean more than `maxLean`) or `loaded` (it is in a basket already). */
export function donkeyPut(game: Pick<DonkeyLoadGame, 'goods'>, round: DonkeyRound, load: DonkeyLoad, i: number, side: DonkeySide): DonkeyVerdict {
  if (load[0].includes(i) || load[1].includes(i)) return 'loaded'
  if (load[side].length >= round.places) return 'full'
  const next: DonkeyLoad = [load[0].slice(), load[1].slice()]
  next[side].push(i)
  if (Math.abs(donkeyLean(game, round, next)) > round.maxLean) return 'lean'
  return 'ok'
}
/** The load with good `i` put into basket `side`, or taken out (`side` null). */
export function donkeyMove(load: DonkeyLoad, i: number, side: DonkeySide | null): DonkeyLoad {
  const next: DonkeyLoad = [load[0].filter((x) => x !== i), load[1].filter((x) => x !== i)]
  if (side !== null) next[side].push(i)
  return next
}
/** The goods of the round that still lie in the strip (indexes). */
export const donkeyLeft = (round: DonkeyRound, load: DonkeyLoad): number[] => round.goods.map((_, i) => i).filter((i) => !load[0].includes(i) && !load[1].includes(i))
/** Everything is loaded and the load hangs straight. */
export const donkeyDone = (game: Pick<DonkeyLoadGame, 'goods'>, round: DonkeyRound, load: DonkeyLoad): boolean => donkeyLeft(round, load).length === 0 && donkeyLean(game, round, load) === 0

/**
 * A way to the end from `load` without a good that slides back: the moves `{ i, side }` one after another, or null when there is none (then something must come out first).
 * A small search (at most eight goods): it tries the goods in the order of the strip, the left basket first.
 */
export function donkeySolve(game: Pick<DonkeyLoadGame, 'goods'>, round: DonkeyRound, load: DonkeyLoad): { i: number; side: DonkeySide }[] | null {
  const seen = new Set<string>()
  const go = (l: DonkeyLoad): { i: number; side: DonkeySide }[] | null => {
    const left = donkeyLeft(round, l)
    if (!left.length) return donkeyLean(game, round, l) === 0 ? [] : null
    // the state: the weights per side and which kinds are left (goods of one kind are the same)
    const key = `${donkeyLean(game, round, l)}|${l[0].length}|${l[1].length}|${left.map((i) => round.goods[i]).sort().join(',')}`
    if (seen.has(key)) return null
    seen.add(key)
    const tried = new Set<string>()
    for (const i of left) {
      const kind = round.goods[i]!
      for (const side of [0, 1] as DonkeySide[]) {
        if (tried.has(`${kind}${side}`)) continue
        tried.add(`${kind}${side}`)
        if (donkeyPut(game, round, l, i, side) !== 'ok') continue
        const rest = go(donkeyMove(l, i, side))
        if (rest) return [{ i, side }, ...rest]
      }
    }
    return null
  }
  return go(load)
}
/**
 * The help: the next good and its basket on a way to the end; when there is no way from here, a good that must come out first (`side` null): the last one put in on the heavier side.
 */
export function donkeyHelp(game: Pick<DonkeyLoadGame, 'goods'>, round: DonkeyRound, load: DonkeyLoad): { i: number; side: DonkeySide | null } | null {
  if (donkeyDone(game, round, load)) return null
  const way = donkeySolve(game, round, load)
  if (way && way.length) return way[0]!
  const lean = donkeyLean(game, round, load)
  const side: DonkeySide = lean > 0 ? 1 : lean < 0 ? 0 : load[1].length >= load[0].length ? 1 : 0
  const from = load[side].length ? load[side] : load[side === 0 ? 1 : 0]
  return from.length ? { i: from[from.length - 1]!, side: null } : null
}
/** Where good number `k` of a basket lies, percent of the saddle picture: two side by side, the next two higher up. */
export function donkeySlot(game: Pick<DonkeyLoadGame, 'baskets' | 'goodW' | 'saddleRatio'>, side: DonkeySide, k: number): Pt {
  const b = game.baskets[side]
  const col = k % 2
  const row = Math.floor(k / 2)
  const dx = (col === 0 ? -0.5 : 0.5) * game.goodW * 0.9
  // the height of a good in percent of the saddle's height (the goods are square)
  const gh = game.goodW * game.saddleRatio
  return { x: b.x + dx, y: b.y - row * gh * 0.42 }
}
/** The weight word of a good: `light`, `middle` or `heavy` (for the label under it). */
export const donkeyWeightWord = (w: number): 'light' | 'middle' | 'heavy' => (w <= 1 ? 'light' : w === 2 ? 'middle' : 'heavy')

/** What is wrong with the data (empty: nothing). */
export function donkeyLoadProblems(game: DonkeyLoadGame): string[] {
  const out: string[] = []
  if (!game.background || !game.saddle) out.push('a picture is missing')
  if (!(game.ratio > 0.5 && game.ratio < 3)) out.push('the ratio of the yard is odd')
  for (const k of DONKEY_WARES) {
    const g = game.goods[k]
    if (!g || !g.image || !g.name) out.push(`the good ${k} is missing`)
    else if (![1, 2, 3].includes(g.weight)) out.push(`the weight of ${k} is not 1, 2 or 3`)
  }
  const s = game.saddlePos
  const d = game.donkeyPos
  if (!inside(s.x - s.w / 2) || !inside(s.x + s.w / 2) || !inside(s.y)) out.push('the saddle sticks out of the picture')
  if (!inside(d.x - d.w / 2) || !inside(d.x + d.w / 2) || !inside(d.y, 50, 100)) out.push('the donkey sticks out of the picture')
  if (Math.abs(s.x - d.x) > 3) out.push('the saddle does not lie on the middle of the donkey')
  // the saddle's top lies on the donkey's back: between the hooves and the top of the donkey's picture
  const donkeyTop = d.y - ((d.w / game.donkeyRatio) * game.ratio)
  if (!(s.y > donkeyTop && s.y < d.y)) out.push('the saddle does not lie on the donkey')
  // the bottom of the saddle at the biggest turn stays inside the picture
  const saddleH = (s.w / game.saddleRatio) * game.ratio
  if (s.y + saddleH > 100) out.push('the saddle hangs below the picture')
  if (game.baskets[0].x >= 50 || game.baskets[1].x <= 50) out.push('the left basket must be on the left, the right one on the right')
  for (const b of game.baskets) if (!inside(b.x) || !inside(b.y)) out.push('a basket lies outside the saddle')
  if (!(game.goodW >= 8 && game.goodW <= 40)) out.push('the goods are too small or too big')
  // a good on the screen (360 pixels wide) at least about 40 pixels: goodW percent of the saddle, the saddle s.w percent of the field
  if ((game.goodW / 100) * (s.w / 100) * 360 < 38) out.push('a good is smaller than 38 pixels on a phone')
  if (game.abigail && (!game.abigailPos || !game.abigailRatio)) out.push('Abigail has no place')
  if (game.rounds.length !== 2) out.push('the game needs two rounds')
  game.rounds.forEach((r, n) => {
    if (!r.hint) out.push(`round ${n + 1} has no hint`)
    if (r.goods.some((k) => !DONKEY_WARES.includes(k))) out.push(`round ${n + 1} has an unknown good`)
    if (r.goods.length > r.places * 2) out.push(`round ${n + 1}: the goods do not fit into the two baskets`)
    if (r.places < 2 || r.places > 4) out.push(`round ${n + 1}: two to four places per basket`)
    const total = r.goods.reduce((sum, k) => sum + (game.goods[k]?.weight ?? 0), 0)
    if (total % 2) out.push(`round ${n + 1}: the weights cannot be shared equally`)
    if (!donkeySolve(game, r, [[], []])) out.push(`round ${n + 1} cannot be loaded straight`)
  })
  const [a, b] = game.rounds
  if (a && b) {
    if (b.goods.length <= a.goods.length) out.push('round 2 must have more goods')
    if (b.maxLean >= a.maxLean) out.push('round 2 must allow less leaning')
    // round 2 really needs care: a heavy good put in first slides back
    const heavy = b.goods.findIndex((k) => game.goods[k]?.weight === 3)
    if (heavy < 0 || donkeyPut(game, b, [[], []], heavy, 0) !== 'lean') out.push('in round 2 a heavy good first must slide back')
  }
  return out
}

// ================================================================ 2. the gate of Hebron (`hebrontor`)

/** A tribe that comes: its name (German in the data, English over it), which painted group walks (`sprite`, index of `HebronGateGame.groups`) and how fast (percent of the width per second). */
export interface HebronTribe {
  name: string
  sprite: number
  speed: number
}
/**
 * One round: the tribes one after another, how long before the stop in front of the gate the right moment begins (`zone`, percent of the width; the front of the group is between
 * `stop - zone` and `stop`), how long a group may stand at the closed gate before it is too late (`grace`, ms) and the pause before the next group (`gap`, ms).
 */
export interface HebronRound {
  hint: string
  tribes: HebronTribe[]
  zone: number
  grace: number
  gap: number
}
/**
 * The game "The gate of Hebron": the city wall seen from the front (`background`, `ratio`), the gate opening (`gate`: left and top edge, width and height in percent) with the closed doors
 * (`door`, a flat front view laid over the opening), the painted groups (`groups`, all walking to the right, `groupRatio` = width / height of their pictures, `groupW` their width),
 * the road (`road`: the feet `y`, where a group appears `from` (its front, may be left of the picture) and where its front stops before the gate `stop`) and the rounds.
 */
export interface HebronGateGame {
  background: string
  ratio: number
  door: string
  gate: { x: number; y: number; w: number; h: number }
  groups: string[]
  groupRatio: number
  groupW: number
  road: { y: number; from: number; stop: number }
  rounds: HebronRound[]
}

/** Where the front of a group is `ms` after it set off, and how long it has stood at the closed gate. */
export function hebronFront(game: Pick<HebronGateGame, 'road'>, tribe: HebronTribe, ms: number): { front: number; waited: number } {
  const t = Math.max(0, ms) / 1000
  const run = game.road.stop - game.road.from
  const reach = run / tribe.speed
  if (t <= reach) return { front: game.road.from + tribe.speed * t, waited: 0 }
  return { front: game.road.stop, waited: (t - reach) * 1000 }
}
export type HebronVerdict = 'early' | 'right' | 'late'
/** A tap on the gate `ms` after the group set off: too early (still far away), right (in front of the gate), or late (it has waited longer than `grace`). */
export function hebronTap(game: Pick<HebronGateGame, 'road'>, round: HebronRound, tribe: HebronTribe, ms: number): HebronVerdict {
  const { front, waited } = hebronFront(game, tribe, ms)
  if (front < game.road.stop - round.zone) return 'early'
  return waited > round.grace ? 'late' : 'right'
}
/** Has the group waited too long at the closed gate (then it is a mistake, once)? */
export const hebronTooLate = (game: Pick<HebronGateGame, 'road'>, round: HebronRound, tribe: HebronTribe, ms: number): boolean => hebronFront(game, tribe, ms).waited > round.grace
/** The time of the right moment for a group: from when the front enters the zone until the grace at the gate is over (ms after it set off). */
export function hebronWindow(game: Pick<HebronGateGame, 'road'>, round: HebronRound, tribe: HebronTribe): { from: number; to: number } {
  const from = ((game.road.stop - round.zone - game.road.from) / tribe.speed) * 1000
  const to = ((game.road.stop - game.road.from) / tribe.speed) * 1000 + round.grace
  return { from: Math.max(0, from), to }
}
/** The left edge of a group's picture when its front is at `front` (the group walks to the right: its front is its right edge). */
export const hebronLeft = (game: Pick<HebronGateGame, 'groupW'>, front: number): number => front - game.groupW

/** What is wrong with the data (empty: nothing). */
export function gateTimeProblems(game: HebronGateGame): string[] {
  const out: string[] = []
  if (!game.background || !game.door) out.push('a picture is missing')
  if (!(game.ratio > 0.5 && game.ratio < 3)) out.push('the ratio of the picture is odd')
  const g = game.gate
  if (!inside(g.x) || !inside(g.x + g.w) || !inside(g.y) || !inside(g.y + g.h)) out.push('the gate lies outside the picture')
  if (g.w < 8 || g.h < 10) out.push('the gate is too small to tap')
  if (game.groups.length < 2 || game.groups.some((x) => !x)) out.push('at least two painted groups are needed')
  if (!(game.groupW >= 10 && game.groupW <= 40)) out.push('the groups are too small or too big')
  // a group on a phone (360 pixels): at least about 40 pixels high
  const groupH = (game.groupW / game.groupRatio) * game.ratio
  if ((groupH / 100) * (360 / game.ratio) < 40) out.push('a group is lower than 40 pixels on a phone')
  const r = game.road
  if (!inside(r.y, 40, 100)) out.push('the road lies too high or below the picture')
  if (r.from > 0) out.push('a group must come from the left edge (from <= 0)')
  if (!(r.stop > 30 && r.stop <= g.x + g.w)) out.push('the stop must lie at the gate')
  if (Math.abs(r.stop - (g.x + g.w / 2)) > g.w) out.push('the stop is far from the gate')
  if (game.rounds.length !== 2) out.push('the game needs two rounds')
  game.rounds.forEach((rd, n) => {
    if (!rd.hint) out.push(`round ${n + 1} has no hint`)
    if (rd.tribes.length < 3) out.push(`round ${n + 1} needs at least three tribes`)
    for (const t of rd.tribes) {
      if (!t.name) out.push(`round ${n + 1}: a tribe has no name`)
      if (t.sprite < 0 || t.sprite >= game.groups.length) out.push(`round ${n + 1}: ${t.name} has no picture`)
      if (!(t.speed >= 3 && t.speed <= 20)) out.push(`round ${n + 1}: ${t.name} walks too slowly or too fast`)
      // the right moment lasts at least 1.2 seconds (round 2) and the walk to it at least 3 seconds
      const w = hebronWindow(game, rd, t)
      if (w.to - w.from < 1200) out.push(`round ${n + 1}: the right moment for ${t.name} is shorter than 1.2 seconds`)
      if (w.from < 3000) out.push(`round ${n + 1}: ${t.name} is at the gate too soon`)
    }
    if (!(rd.zone >= 4 && rd.zone <= 30)) out.push(`round ${n + 1}: the zone is odd`)
    if (!(rd.grace >= 300 && rd.grace <= 3000)) out.push(`round ${n + 1}: the grace is odd`)
    if (!(rd.gap >= 600)) out.push(`round ${n + 1}: the pause between the groups is too short`)
  })
  const [a, b] = game.rounds
  if (a && b) {
    if (b.zone >= a.zone) out.push('round 2 must have a narrower zone')
    if (b.grace > a.grace) out.push('round 2 must not wait longer')
    const fastest = (rd: HebronRound) => Math.max(...rd.tribes.map((t) => t.speed))
    if (fastest(b) <= fastest(a)) out.push('round 2 must have faster groups')
    const speeds = new Set(b.tribes.map((t) => t.speed))
    if (speeds.size < 2) out.push('round 2 must have groups of different speeds')
  }
  // twelve tribes in all, every name once
  const names = game.rounds.flatMap((rd) => rd.tribes.map((t) => t.name))
  if (new Set(names).size !== names.length) out.push('a tribe comes twice')
  return out
}

// ================================================================ 3. the festive procession (`festzug`)

export type FestInstrument = 'harfe' | 'pauke' | 'schellen' | 'zimbeln'
export const FEST_INSTRUMENTS: FestInstrument[] = ['harfe', 'pauke', 'schellen', 'zimbeln']

/** A musician in the procession: the instrument, its name (German in the data, English over it), the picture (cut from one sheet, transparent) and the place (`x` middle, `y` feet, `w` width). */
export interface FestMusician {
  instrument: FestInstrument
  name: string
  image: string
  x: number
  y: number
  w: number
}
/**
 * One round. `glow`: the musicians light up one after another in the order `order` (indexes), each for `glowMs`; the child taps the one who lights up (a missed one comes again at the end).
 * `echo`: the musicians play short tunes (`tunes`, indexes, each one `stepMs` long) and the child plays every tune after them.
 */
export interface FestRound {
  hint: string
  mode: 'glow' | 'echo'
  order?: number[]
  glowMs?: number
  tunes?: number[][]
  stepMs?: number
}
/** The game "The festive procession": the road to the City of David with the ark far behind (`background`, `ratio`), the musicians (`ratio` of their pictures: `musicianRatio`) and the rounds. */
export interface FestMarchGame {
  background: string
  ratio: number
  musicianRatio: number
  musicians: FestMusician[]
  rounds: FestRound[]
}

/** How many right taps a round takes (the goal of "Go on"). */
export const festNeed = (round: FestRound): number => (round.mode === 'glow' ? round.order?.length ?? 0 : (round.tunes ?? []).reduce((s, t) => s + t.length, 0))
/** In a glow round: who lights up at `ms` after the round started, counting from position `at` of the order (a missed glow sends the musician to the end: the component keeps the queue). */
export function festGlowAt(queue: readonly number[], glowMs: number, ms: number): { musician: number; step: number; left: number } | null {
  const step = Math.floor(Math.max(0, ms) / glowMs)
  if (step >= queue.length) return null
  return { musician: queue[step]!, step, left: glowMs - (Math.max(0, ms) % glowMs) }
}
/** In an echo round: is tap `musician` the right next note of `tune` after `played` right notes? */
export const festEchoRight = (tune: readonly number[], played: number, musician: number): boolean => tune[played] === musician

/** What is wrong with the data (empty: nothing). */
export function festMarchProblems(game: FestMarchGame): string[] {
  const out: string[] = []
  if (!game.background) out.push('the picture of the road is missing')
  if (!(game.ratio > 0.5 && game.ratio < 3)) out.push('the ratio of the picture is odd')
  const kinds = game.musicians.map((m) => m.instrument)
  if (game.musicians.length !== 4 || new Set(kinds).size !== 4 || FEST_INSTRUMENTS.some((k) => !kinds.includes(k))) out.push('four musicians: harp, drum, rattles and cymbals, each once')
  for (const m of game.musicians) {
    if (!m.image || !m.name) out.push(`${m.instrument}: picture or name missing`)
    if (!inside(m.x - m.w / 2) || !inside(m.x + m.w / 2) || !inside(m.y, 50, 100)) out.push(`${m.instrument} stands outside the picture`)
    const h = (m.w / game.musicianRatio) * game.ratio
    if (m.y - h < 0) out.push(`${m.instrument} is cut at the top`)
    // at least about 40 pixels wide on a phone (360 pixels)
    if ((m.w / 100) * 360 < 40) out.push(`${m.instrument} is narrower than 40 pixels on a phone`)
  }
  // the musicians do not stand on each other: their middles at least a width apart (the tap areas do not overlap much)
  const ms = [...game.musicians].sort((a, b) => a.x - b.x)
  for (let i = 1; i < ms.length; i++) if (ms[i]!.x - ms[i - 1]!.x < Math.min(ms[i]!.w, ms[i - 1]!.w) * 0.8) out.push(`${ms[i - 1]!.instrument} and ${ms[i]!.instrument} stand too close`)
  if (game.rounds.length !== 2) out.push('the game needs two rounds')
  const [a, b] = game.rounds
  if (a) {
    if (a.mode !== 'glow') out.push('round 1 is the glow round')
    const order = a.order ?? []
    if (order.length < 6) out.push('round 1 needs at least six glows')
    if (order.some((i) => i < 0 || i >= game.musicians.length)) out.push('round 1 points at a musician who is not there')
    for (let i = 1; i < order.length; i++) if (order[i] === order[i - 1]) out.push('round 1: the same musician twice in a row')
    for (let k = 0; k < game.musicians.length; k++) if (!order.includes(k)) out.push(`round 1: musician ${k + 1} never lights up`)
    if (!(a.glowMs && a.glowMs >= 1800 && a.glowMs <= 5000)) out.push('round 1: a glow lasts 1.8 to 5 seconds')
  }
  if (b) {
    if (b.mode !== 'echo') out.push('round 2 is the echo round')
    const tunes = b.tunes ?? []
    if (tunes.length < 3) out.push('round 2 needs at least three tunes')
    tunes.forEach((t, k) => {
      if (t.some((i) => i < 0 || i >= game.musicians.length)) out.push(`tune ${k + 1} points at a musician who is not there`)
      if (k > 0 && t.length < tunes[k - 1]!.length) out.push(`tune ${k + 1} is shorter than the one before`)
      if (t.length < 2 || t.length > 5) out.push(`tune ${k + 1}: two to five notes`)
    })
    if (!(b.stepMs && b.stepMs >= 500 && b.stepMs <= 1500)) out.push('round 2: a note lasts 0.5 to 1.5 seconds')
  }
  return out
}
