/**
 * "Nehemias Mauer": the rules of the stacking game (no Vue, no drawing). One stone hangs in the sky; the child moves and turns it and lets it fall
 * onto the foundation. The stones come without end, so nobody is ever stuck, and a stone that falls off only costs a stroke in the stars.
 * Golden flags hang in the air at the height of the wall; the wall is built when every flag touches a stone that lies still (one second long).
 * The weather of the chapters (wind on the falling stone, rain, a shaking earth) makes it harder but never makes it fail.
 * The physics is in `nehemiaMauerPhysics.ts`.
 */
import { World, inside, makeBody, mulberry32, type Body } from '@/utils/nehemiaMauerPhysics'

/** The sizes of the stones, in stone units (width, height). */
export const STONES: { w: number; h: number }[] = [
  { w: 1, h: 1 },
  { w: 2, h: 1 },
  { w: 3, h: 1 },
  { w: 4, h: 1 },
  { w: 2, h: 2 },
  { w: 3, h: 2 }
]

export interface Mark {
  x: number
  y: number
  hit: boolean
}

export interface GameDef {
  /** The width of the world (the foundation lies in the middle). */
  width: number
  /** The width of the foundation. */
  base: number
  marks: { x: number; y: number }[]
  /** How often each size of stone comes (index = `STONES`). */
  weights: number[]
  /** The strength of the gusts on a falling stone (0 = calm). */
  wind: number
  rain: boolean
  quake: boolean
  night: boolean
  /** The number of stones for the third star. */
  par: number
  seed: number
}

export type Status = 'play' | 'won'

export interface Hand {
  type: number
  /** 0 = as it is, 1 = turned a quarter. */
  rot: 0 | 1
  x: number
  y: number
}

export type GEvent =
  | { t: 'drop' }
  | { t: 'land'; speed: number; x: number; y: number }
  | { t: 'lost' }
  | { t: 'mark'; i: number }
  | { t: 'unmark'; i: number }
  | { t: 'win' }
  | { t: 'rotate' }
  | { t: 'hold' }
  | { t: 'quake' }

export interface Game {
  def: GameDef
  world: World
  ground: Body
  stones: Body[]
  hand: Hand | null
  hold: number | null
  holdUsed: boolean
  queue: number[]
  marks: Mark[]
  lost: number
  used: number
  status: Status
  winT: number
  time: number
  clock: number
  /** The wind right now (units per second squared, positive = to the right). */
  wind: number
  /** 0 = still, up to 1 = shaking. */
  shake: number
  events: GEvent[]
  rng: () => number
  acc: number
  settled: boolean
}

export const STEP = 1 / 60
const FRICTION = 0.9
const FRICTION_RAIN = 0.45
export const HELP_AFTER = 6

export function newGame(def: GameDef): Game {
  const world = new World()
  const ground = world.add(makeBody(world.newId(), def.width / 2, -0.5, def.base / 2, 0.5, 0, 1))
  const g: Game = {
    def,
    world,
    ground,
    stones: [],
    hand: null,
    hold: null,
    holdUsed: false,
    queue: [],
    marks: def.marks.map((m) => ({ x: m.x, y: m.y, hit: false })),
    lost: 0,
    used: 0,
    status: 'play',
    winT: 0,
    time: 0,
    clock: 0,
    wind: 0,
    shake: 0,
    events: [],
    rng: mulberry32(def.seed),
    acc: 0,
    settled: false
  }
  fillQueue(g)
  nextHand(g)
  return g
}

/** Picks the size of the next stone: by the weights of the level, with more long flat stones after many lost ones (the builders help). */
export function pickType(g: Game): number {
  const w = g.def.weights.map((v, i) => {
    let x = v
    if (g.lost >= HELP_AFTER && (i === 1 || i === 2 || i === 3)) x *= 2.2
    if (g.lost >= HELP_AFTER && (i === 5 || i === 0)) x *= 0.5
    return x
  })
  let total = 0
  for (const v of w) total += v
  let r = g.rng() * total
  for (let i = 0; i < w.length; i++) {
    r -= w[i]!
    if (r <= 0) return i
  }
  return 1
}

function fillQueue(g: Game) {
  while (g.queue.length < 3) g.queue.push(pickType(g))
}

export function towerTop(g: Game): number {
  let top = 0
  for (const b of g.stones) if (b.touched) top = Math.max(top, b.y + Math.max(b.hh, b.hw) * 0.9)
  return top
}

export function spawnY(g: Game): number {
  let mark = 0
  for (const m of g.marks) mark = Math.max(mark, m.y)
  return Math.max(5.5, towerTop(g) + 4.2, mark + 2.5)
}

function nextHand(g: Game) {
  fillQueue(g)
  const type = g.queue.shift()!
  fillQueue(g)
  g.hand = { type, rot: 0, x: g.def.width / 2, y: spawnY(g) }
  g.holdUsed = false
}

export function handSize(h: Hand): { w: number; h: number } {
  const s = STONES[h.type]!
  return h.rot === 0 ? { w: s.w, h: s.h } : { w: s.h, h: s.w }
}

export function moveHand(g: Game, x: number) {
  if (!g.hand || g.status !== 'play') return
  const s = handSize(g.hand)
  g.hand.x = Math.max(s.w / 2 - 1, Math.min(g.def.width - s.w / 2 + 1, x))
}

export function nudgeHand(g: Game, dx: number) {
  if (g.hand) moveHand(g, g.hand.x + dx)
}

export function rotateHand(g: Game) {
  if (!g.hand || g.status !== 'play') return
  g.hand.rot = g.hand.rot === 0 ? 1 : 0
  moveHand(g, g.hand.x)
  g.events.push({ t: 'rotate' })
}

export function dropHand(g: Game): Body | null {
  if (!g.hand || g.status !== 'play') return null
  const h = g.hand
  const s = handSize(h)
  const b = makeBody(g.world.newId(), h.x, h.y, s.w / 2, s.h / 2, 1, g.def.rain ? FRICTION_RAIN : FRICTION)
  b.tag = h.type
  b.vy = -3
  b.age = 0.0001
  g.world.add(b)
  g.stones.push(b)
  g.used++
  g.hand = null
  g.events.push({ t: 'drop' })
  nextHand(g)
  return b
}

export function holdSwap(g: Game): boolean {
  if (!g.hand || g.status !== 'play' || g.holdUsed) return false
  const cur = g.hand.type
  if (g.hold === null) {
    g.hold = cur
    nextHand(g)
  } else {
    const other = g.hold
    g.hold = cur
    g.hand = { type: other, rot: 0, x: g.hand.x, y: spawnY(g) }
  }
  g.holdUsed = true
  g.events.push({ t: 'hold' })
  return true
}

export const QUAKE_PERIOD = 11
export const QUAKE_START = 8.6
export const QUAKE_LEN = 1.6

/** The weather and the shaking earth at a time. */
function environment(g: Game) {
  const t = g.clock
  if (g.def.wind > 0) {
    const gust = Math.sin(t * 0.9) * (0.6 + 0.4 * Math.sin(t * 0.37 + 1))
    g.wind = g.def.wind * gust
  } else g.wind = 0
  if (g.def.quake) {
    const ph = t % QUAKE_PERIOD
    const was = g.shake > 0
    if (ph >= QUAKE_START && ph < QUAKE_START + QUAKE_LEN) {
      const k = (ph - QUAKE_START) / QUAKE_LEN
      const env = Math.sin(Math.PI * k)
      g.shake = env
      const amp = 0.14 * env
      const x = g.def.width / 2 + amp * Math.sin(t * 26)
      g.ground.vx = (x - g.ground.x) / STEP
      g.ground.x = x
      g.world.sleeping = false
      if (!was) {
        g.world.wakeAll()
        g.events.push({ t: 'quake' })
      }
    } else {
      if (was) {
        g.ground.x = g.def.width / 2
        g.ground.vx = 0
        g.world.sleeping = true
      }
      g.shake = 0
    }
  }
}

/** Marks the flags that a stone covers that lies still. */
function checkMarks(g: Game) {
  let all = true
  let settled = true
  g.marks.forEach((m, i) => {
    let hit = false
    for (const b of g.stones) {
      if (!inside(b, m.x, m.y)) continue
      if (b.asleep || b.vx * b.vx + b.vy * b.vy < 0.04) {
        hit = true
        break
      }
    }
    if (hit !== m.hit) {
      m.hit = hit
      g.events.push({ t: hit ? 'mark' : 'unmark', i })
    }
    if (!hit) all = false
  })
  for (const b of g.stones) if (!b.asleep && (b.vx * b.vx + b.vy * b.vy > 0.2 || b.w * b.w > 0.3)) settled = false
  g.settled = settled
  g.winT = all && g.marks.length > 0 ? g.winT + STEP : 0
}

function substep(g: Game) {
  g.clock += STEP
  g.time += STEP
  environment(g)
  for (const b of g.stones) {
    if (!b.touched && b.age < 2.5 && g.wind !== 0) b.vx += g.wind * STEP
  }
  g.world.step(STEP)
  for (const e of g.world.events) g.events.push({ t: 'land', speed: e.speed, x: e.body.x, y: e.body.y - Math.max(e.body.hh, 0.2) })
  g.world.events.length = 0
  // stones that fell off the foundation are replaced by the next one (a stroke in the stars, nothing more)
  for (let i = g.stones.length - 1; i >= 0; i--) {
    const b = g.stones[i]!
    if (b.y < -3 || Math.abs(b.x - g.def.width / 2) > g.def.width / 2 + 5) {
      g.world.remove(b)
      g.stones.splice(i, 1)
      g.lost++
      g.events.push({ t: 'lost' })
    }
  }
  checkMarks(g)
  if (g.winT >= 1.0 && g.status === 'play') {
    g.status = 'won'
    g.events.push({ t: 'win' })
  }
}

/** Advances the game by `dt` seconds (fixed steps of 1/60 s). */
export function tick(g: Game, dt: number) {
  g.acc += Math.min(dt, 0.1)
  let n = 0
  while (g.acc >= STEP && n < 6) {
    substep(g)
    g.acc -= STEP
    n++
  }
  if (g.acc > STEP * 6) g.acc = 0
  // the stone in the hand floats up when the wall grows
  if (g.hand) {
    const ty = spawnY(g)
    g.hand.y += (ty - g.hand.y) * Math.min(1, dt * 4)
  }
}

/** The number of marks that are touched. */
export function marksHit(g: Game): number {
  return g.marks.reduce((n, m) => n + (m.hit ? 1 : 0), 0)
}

/** The stars of a built wall: built, few stones lost, few stones lost and not too many stones. */
export function starsOf(g: Game): number {
  if (g.status !== 'won') return 0
  if (g.lost <= 1 && g.used <= g.def.par + g.lost) return 3
  if (g.lost <= 3) return 2
  return 1
}
