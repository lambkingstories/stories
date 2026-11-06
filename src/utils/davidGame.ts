/**
 * "Davids Schleuder": the rules and the physics of the big game, without any drawing (so they can be tested).
 *
 * David stands on the left with his sling, his sheep behind him. Wolves, bears and lions come from the right, from the fifth level on
 * also eagles, which glide down through the air toward the sheep and must be hit in flight. The child pulls the sling
 * back and lets go: the stone flies in an arc (gravity), bounces off the ground and the boulders, and scares the
 * animal it hits away (the bear needs three hits, the lion jumps). An animal that gets to the sheep scares one of them away. The last level
 * is Goliath: he walks slowly, holds his shield up from time to time, and only a stone on his forehead brings him down.
 * Nothing is hurt: the animals run away, and Goliath falls over.
 */

/** The size of the scene (16:9). */
export const W = 1600
export const H = 900
export const GROUND = 735
/** The sling: where the stone sits before the shot. */
export const SLING = { x: 262, y: 548 }
/** The sheep stand left of this line; an animal that gets here scares a sheep. */
export const SHEEP_LINE = 330
export const GRAVITY = 1500
/** How far the sling can be pulled, and how fast a full pull shoots. */
export const MAX_PULL = 170
export const MAX_SPEED = 1750
export const STONE_R = 14

/** The scale of the Goliath picture (so that he towers over David). */
export const GOLIATH_K = 0.78

export type Kind = 'wolf' | 'bear' | 'lion' | 'eagle' | 'goliath'

export interface KindInfo {
  hp: number
  /** Scene units per second. */
  speed: number
  /** The body, as a circle (centre above the feet by `h`). */
  r: number
  h: number
  points: number
}

export const KINDS: Record<Kind, KindInfo> = {
  wolf: { hp: 1, speed: 125, r: 52, h: 52, points: 10 },
  lion: { hp: 1, speed: 150, r: 62, h: 62, points: 20 },
  bear: { hp: 3, speed: 70, r: 82, h: 82, points: 30 },
  eagle: { hp: 1, speed: 135, r: 46, h: 85, points: 20 },
  goliath: { hp: 1, speed: 24, r: 112, h: 240, points: 100 }
}

export interface Boulder {
  x: number
  y: number
  r: number
}

export interface LevelDef {
  id: number
  /** The animals of the level, in the order they come: `kind` and the seconds after the one before. */
  waves: { kind: Kind; after: number }[]
  stones: number
  boulders: Boulder[]
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    waves: [
      { kind: 'wolf', after: 1.5 },
      { kind: 'wolf', after: 4 },
      { kind: 'wolf', after: 3.5 },
      { kind: 'wolf', after: 3 },
      { kind: 'wolf', after: 3 }
    ],
    stones: 11,
    boulders: []
  },
  {
    id: 2,
    waves: [
      { kind: 'wolf', after: 1.5 },
      { kind: 'bear', after: 4 },
      { kind: 'wolf', after: 5 },
      { kind: 'wolf', after: 2.5 },
      { kind: 'bear', after: 5 }
    ],
    stones: 14,
    boulders: [{ x: 780, y: GROUND - 55, r: 55 }]
  },
  {
    id: 3,
    waves: [
      { kind: 'lion', after: 1.5 },
      { kind: 'wolf', after: 3 },
      { kind: 'lion', after: 3.5 },
      { kind: 'wolf', after: 2 },
      { kind: 'lion', after: 3 },
      { kind: 'lion', after: 2.5 }
    ],
    stones: 14,
    boulders: [
      { x: 700, y: GROUND - 45, r: 45 },
      { x: 1050, y: GROUND - 70, r: 70 }
    ]
  },
  {
    id: 4,
    waves: [
      { kind: 'wolf', after: 1.5 },
      { kind: 'bear', after: 3 },
      { kind: 'lion', after: 3 },
      { kind: 'wolf', after: 2.5 },
      { kind: 'lion', after: 2.5 },
      { kind: 'bear', after: 4 },
      { kind: 'wolf', after: 2 }
    ],
    stones: 16,
    boulders: [
      { x: 640, y: GROUND - 50, r: 50 },
      { x: 960, y: GROUND - 85, r: 85 }
    ]
  },
  {
    id: 5,
    // the pack: many wolves, quick one after the other
    waves: [
      { kind: 'wolf', after: 1.2 },
      { kind: 'wolf', after: 2.5 },
      { kind: 'wolf', after: 2 },
      { kind: 'wolf', after: 2 },
      { kind: 'eagle', after: 2.5 },
      { kind: 'wolf', after: 1.8 },
      { kind: 'wolf', after: 2.2 },
      { kind: 'wolf', after: 1.5 },
      { kind: 'wolf', after: 1.8 },
      { kind: 'eagle', after: 2.5 },
      { kind: 'wolf', after: 2 },
      { kind: 'wolf', after: 1.5 }
    ],
    stones: 22,
    boulders: [{ x: 720, y: GROUND - 45, r: 45 }]
  },
  {
    id: 6,
    waves: [
      { kind: 'bear', after: 1.5 },
      { kind: 'wolf', after: 4 },
      { kind: 'bear', after: 4 },
      { kind: 'eagle', after: 3 },
      { kind: 'wolf', after: 3 },
      { kind: 'wolf', after: 2 },
      { kind: 'bear', after: 4 },
      { kind: 'eagle', after: 3 },
      { kind: 'bear', after: 5 }
    ],
    stones: 27,
    boulders: [
      { x: 760, y: GROUND - 60, r: 60 },
      { x: 1100, y: GROUND - 45, r: 45 }
    ]
  },
  {
    id: 7,
    waves: [
      { kind: 'lion', after: 1.5 },
      { kind: 'lion', after: 3.5 },
      { kind: 'eagle', after: 2.5 },
      { kind: 'wolf', after: 2.5 },
      { kind: 'lion', after: 3 },
      { kind: 'lion', after: 2.5 },
      { kind: 'eagle', after: 2.5 },
      { kind: 'wolf', after: 2 },
      { kind: 'lion', after: 3 },
      { kind: 'lion', after: 2.5 },
      { kind: 'eagle', after: 2 }
    ],
    stones: 26,
    boulders: [
      { x: 690, y: GROUND - 50, r: 50 },
      { x: 1000, y: GROUND - 75, r: 75 }
    ]
  },
  {
    id: 8,
    waves: [
      { kind: 'wolf', after: 1.5 },
      { kind: 'lion', after: 2.5 },
      { kind: 'bear', after: 3 },
      { kind: 'eagle', after: 2.5 },
      { kind: 'wolf', after: 2.5 },
      { kind: 'wolf', after: 1.5 },
      { kind: 'lion', after: 2.5 },
      { kind: 'eagle', after: 2.5 },
      { kind: 'bear', after: 3.5 },
      { kind: 'lion', after: 2.5 },
      { kind: 'wolf', after: 2 },
      { kind: 'eagle', after: 2 },
      { kind: 'bear', after: 3.5 }
    ],
    stones: 31,
    boulders: [
      { x: 620, y: GROUND - 45, r: 45 },
      { x: 880, y: GROUND - 80, r: 80 },
      { x: 1180, y: GROUND - 50, r: 50 }
    ]
  },
  {
    id: 9,
    waves: [
      { kind: 'lion', after: 1.5 },
      { kind: 'wolf', after: 2 },
      { kind: 'eagle', after: 2 },
      { kind: 'bear', after: 2.5 },
      { kind: 'lion', after: 2.5 },
      { kind: 'wolf', after: 1.5 },
      { kind: 'eagle', after: 2.5 },
      { kind: 'lion', after: 2 },
      { kind: 'bear', after: 3 },
      { kind: 'wolf', after: 1.5 },
      { kind: 'eagle', after: 2 },
      { kind: 'lion', after: 2.5 },
      { kind: 'bear', after: 3 },
      { kind: 'lion', after: 2 },
      { kind: 'eagle', after: 2 },
      { kind: 'wolf', after: 2 }
    ],
    stones: 35,
    boulders: [
      { x: 640, y: GROUND - 55, r: 55 },
      { x: 960, y: GROUND - 85, r: 85 }
    ]
  },
  {
    id: 10,
    waves: [{ kind: 'goliath', after: 2 }],
    // five stones only: every one counts
    stones: 5,
    boulders: [{ x: 850, y: GROUND - 40, r: 40 }]
  }
]

export interface Stone {
  x: number
  y: number
  vx: number
  vy: number
  /** Bounces left to the ground (it lies still after the third). */
  bounces: number
  /** Seconds in the air. */
  age: number
}

export interface Animal {
  id: number
  kind: Kind
  /** The feet. */
  x: number
  /** Height above the ground (a leaping lion). */
  lift: number
  vlift: number
  hp: number
  mode: 'come' | 'flee' | 'fall'
  /** Seconds since the last hit (for the flash and the knock back). */
  hit: number
  stun: number
  speed: number
  /** Goliath: the seconds the shield is up (0 = down), and the seconds to the next time. */
  shield: number
  shieldIn: number
  /** Goliath: the seconds until he lifts the shield against a stone that flies at his head (-1: no stone, 99: this stone is not answered). */
  react: number
  /** The fall of Goliath: 0 to 1. */
  fall: number
  /** A clock for the walk (steps). */
  t: number
  /** The leap clock of the lion. */
  leapIn: number
}

export type Phase = 'play' | 'won' | 'lost'

export interface Game {
  level: LevelDef
  phase: Phase
  time: number
  stonesLeft: number
  stones: Stone[]
  animals: Animal[]
  /** The next animal of the level, and the seconds until it comes. */
  next: number
  nextIn: number
  sheep: number
  lostSheep: number
  score: number
  hits: number
  nextId: number
  events: GameEvent[]
}

export type GameEvent =
  | { type: 'shot' }
  | { type: 'bounce'; x: number; y: number }
  | { type: 'hit'; x: number; y: number; kind: Kind }
  | { type: 'scare'; x: number; y: number; kind: Kind }
  | { type: 'block'; x: number; y: number }
  | { type: 'loss' }
  | { type: 'fall' }
  | { type: 'end'; phase: 'won' | 'lost' }

export type Rng = () => number

export function newGame(level: LevelDef): Game {
  return {
    level,
    phase: 'play',
    time: 0,
    stonesLeft: level.stones,
    stones: [],
    animals: [],
    next: 0,
    nextIn: level.waves[0]?.after ?? 0,
    sheep: 3,
    lostSheep: 0,
    score: 0,
    hits: 0,
    nextId: 1,
    events: []
  }
}

/** The speed of the stone for a pull: `pull` is the vector from the rest place of the sling to the stone (it points away from the target). */
export function shotVelocity(pullX: number, pullY: number): { vx: number; vy: number; power: number } {
  const len = Math.hypot(pullX, pullY)
  const k = Math.min(1, len / MAX_PULL)
  if (len < 1) return { vx: 0, vy: 0, power: 0 }
  const speed = MAX_SPEED * (0.25 + 0.75 * k)
  return { vx: (-pullX / len) * speed, vy: (-pullY / len) * speed, power: k }
}

/** The pull, kept inside its reach (and not so that the stone would be shot to the left). */
export function clampPull(px: number, py: number): { x: number; y: number } {
  const len = Math.hypot(px, py)
  if (len <= MAX_PULL) return { x: px, y: py }
  return { x: (px / len) * MAX_PULL, y: (py / len) * MAX_PULL }
}

/** Shoots a stone; false when there is none left or the pull is too short to count. */
export function shoot(g: Game, pullX: number, pullY: number): boolean {
  if (g.phase !== 'play' || g.stonesLeft <= 0) return false
  const v = shotVelocity(pullX, pullY)
  if (v.power < 0.12) return false
  g.stonesLeft--
  g.stones.push({ x: SLING.x, y: SLING.y, vx: v.vx, vy: v.vy, bounces: 3, age: 0 })
  g.events.push({ type: 'shot' })
  return true
}

/** The dotted path of a shot (for the aim): the first `seconds` of the flight, one point every `every` seconds. */
export function preview(g: Game, pullX: number, pullY: number, seconds = 0.7, every = 0.055): { x: number; y: number }[] {
  const v = shotVelocity(pullX, pullY)
  const out: { x: number; y: number }[] = []
  if (v.power < 0.12) return out
  let x = SLING.x
  let y = SLING.y
  let vx = v.vx
  let vy = v.vy
  const dt = 1 / 120
  let acc = 0
  for (let t = 0; t < seconds; t += dt) {
    vy += GRAVITY * dt
    x += vx * dt
    y += vy * dt
    acc += dt
    if (acc >= every) {
      acc = 0
      out.push({ x, y })
    }
    if (y > GROUND) break
  }
  return out
}

/** The eagle comes in this high above the ground and glides down to this height just above the sheep. */
export const EAGLE_HIGH = 430
export const EAGLE_LOW = 70

/** How high the eagle flies at a place: it comes high in from the right and glides down toward the sheep. */
export function eagleLift(x: number): number {
  const k = Math.max(0, Math.min(1, (x - SHEEP_LINE) / (W - SHEEP_LINE)))
  return EAGLE_LOW + (EAGLE_HIGH - EAGLE_LOW) * k
}

function spawn(g: Game, kind: Kind) {
  const info = KINDS[kind]
  g.animals.push({
    id: g.nextId++,
    kind,
    x: W + 120,
    lift: kind === 'eagle' ? EAGLE_HIGH : 0,
    vlift: 0,
    hp: info.hp,
    mode: 'come',
    hit: 9,
    stun: 0,
    speed: info.speed,
    shield: 0,
    shieldIn: 2.2,
    react: -1,
    fall: 0,
    t: 0,
    leapIn: 1 + Math.random() * 1.5
  })
}

/** The body of an animal as a circle (the centre). */
export function body(a: Animal): { x: number; y: number; r: number } {
  const info = KINDS[a.kind]
  return { x: a.x, y: GROUND - info.h - a.lift, r: info.r }
}

/** The index of the last level (Goliath). */
export const GOLIATH_LEVEL = LEVELS.length - 1

/** Goliath sways a little while he walks (the forehead moves with the picture), so that the aim has to follow him. */
export function sway(a: Animal): number {
  return a.kind === 'goliath' && a.mode === 'come' ? Math.sin(a.t * 2.6) * 11 : 0
}

/** Goliath: the forehead is a small circle high on the body. */
export function forehead(a: Animal): { x: number; y: number; r: number } {
  return { x: a.x - 13, y: GROUND - 391 + sway(a), r: 26 }
}

/** A stone in the air that would reach Goliath's head: he reacts to it. */
function threatened(g: Game, a: Animal): boolean {
  const f = forehead(a)
  for (const s of g.stones) {
    if (s.vx <= 40 || s.x >= f.x) continue
    const t = (f.x - s.x) / s.vx
    if (t > 1.2) continue
    const y = s.y + s.vy * t + 0.5 * GRAVITY * t * t
    if (Math.abs(y - f.y) < 190) return true
  }
  return false
}

function scareAway(g: Game, a: Animal) {
  a.mode = 'flee'
  g.score += KINDS[a.kind].points
  g.events.push({ type: 'scare', x: a.x, y: GROUND - a.lift, kind: a.kind })
}

/** The stone against the boulders: it bounces off. */
function stoneBoulder(s: Stone, b: Boulder, g: Game) {
  const dx = s.x - b.x
  const dy = s.y - b.y
  const d = Math.hypot(dx, dy)
  const min = b.r + STONE_R
  if (d >= min || d === 0) return
  const nx = dx / d
  const ny = dy / d
  s.x = b.x + nx * min
  s.y = b.y + ny * min
  const vn = s.vx * nx + s.vy * ny
  if (vn < 0) {
    s.vx -= 1.55 * vn * nx
    s.vy -= 1.55 * vn * ny
    s.vx *= 0.92
    s.vy *= 0.92
    g.events.push({ type: 'bounce', x: s.x, y: s.y })
  }
}

/** One step of the game, `dt` seconds. */
export function step(g: Game, dt: number) {
  g.events = []
  if (g.phase !== 'play') return
  g.time += dt
  const lv = g.level

  // the animals come
  if (g.next < lv.waves.length) {
    g.nextIn -= dt
    if (g.nextIn <= 0) {
      spawn(g, lv.waves[g.next]!.kind)
      g.next++
      g.nextIn = lv.waves[g.next]?.after ?? 0
    }
  }

  for (const a of g.animals) {
    a.hit += dt
    a.t += dt
    if (a.mode === 'fall') {
      a.fall = Math.min(1, a.fall + dt / 0.9)
      continue
    }
    if (a.mode === 'flee') {
      a.x += 420 * dt
      // the eagle flies away upward
      if (a.kind === 'eagle') a.lift += 300 * dt
      else a.lift = Math.max(0, a.lift + a.vlift * dt)
      continue
    }
    // knock back after a hit, then on again
    if (a.stun > 0) {
      a.stun -= dt
      a.x += 190 * a.stun * dt * 4
    } else {
      a.x -= a.speed * dt
    }
    if (a.kind === 'lion') {
      a.leapIn -= dt
      if (a.leapIn <= 0 && a.lift === 0) {
        a.vlift = 620
        a.leapIn = 1.6 + Math.random() * 1.2
      }
      if (a.lift > 0 || a.vlift > 0) {
        a.vlift -= 1500 * dt
        a.lift += a.vlift * dt
        if (a.lift <= 0) {
          a.lift = 0
          a.vlift = 0
        }
      }
    }
    if (a.kind === 'eagle') {
      // it glides down along its path, with a gentle up and down of the wing beats
      a.lift = eagleLift(a.x) + Math.sin(a.t * 3.2) * 14
    }
    if (a.kind === 'goliath') {
      a.shieldIn -= dt
      if (a.shield > 0) {
        a.shield -= dt
        if (a.shield <= 0) a.shieldIn = 0.5 + Math.random() * 0.4
      } else if (a.shieldIn <= 0) {
        a.shield = 1.4
      }
      // He watches the stones: one that flies at his head makes him lift the shield, not always and not at once, so that a quick or a
      // surprising shot can still get through (a stone aimed at the body is no threat to him)
      if (a.shield <= 0 && a.shieldIn < 50 && a.mode === 'come') {
        if (threatened(g, a)) {
          if (a.react === -1) a.react = Math.random() < 0.86 ? 0.08 + Math.random() * 0.14 : 99
          else if (a.react < 50) {
            a.react -= dt
            if (a.react <= 0) {
              a.shield = 1.3
              a.react = -1
            }
          }
        } else a.react = -1
      }
    }
    // it gets to the sheep
    if (a.x - KINDS[a.kind].r * 0.4 < SHEEP_LINE) {
      if (a.kind === 'goliath') {
        g.sheep = 0
        g.lostSheep = 3
      } else if (g.sheep > 0) {
        g.sheep--
        g.lostSheep++
      }
      g.events.push({ type: 'loss' })
      // the animal runs off with its fright (no points for it)
      if (a.kind !== 'goliath') a.mode = 'flee'
    }
  }
  g.animals = g.animals.filter((a) => a.x < W + 400)

  // the stones
  for (const s of g.stones) {
    s.age += dt
    const n = 3
    for (let i = 0; i < n; i++) {
      const h = dt / n
      s.vy += GRAVITY * h
      s.x += s.vx * h
      s.y += s.vy * h
      for (const b of lv.boulders) stoneBoulder(s, b, g)
      if (s.y + STONE_R >= GROUND) {
        s.y = GROUND - STONE_R
        if (s.bounces > 0 && Math.abs(s.vy) > 90) {
          s.vy *= -0.4
          s.vx *= 0.7
          s.bounces--
          g.events.push({ type: 'bounce', x: s.x, y: s.y })
        } else {
          s.vy = 0
          s.vx *= 0.85
          s.bounces = 0
        }
      }
      // the animals
      let gone = false
      for (const a of g.animals) {
        if (a.mode !== 'come') continue
        if (a.kind === 'goliath') {
          const f = forehead(a)
          const fdx = s.x - f.x
          const fdy = s.y - f.y
          const fd = Math.hypot(fdx, fdy)
          if (fd < f.r + STONE_R) {
            if (a.shield > 0) {
              // The shield stops the stone: it is put outside the circle and thrown back once (a stone that stayed inside bounced again and
              // again and stuck to his head, with a dull sound every step).
              const nx = fd > 0 ? fdx / fd : -1
              const ny = fd > 0 ? fdy / fd : 0
              s.x = f.x + nx * (f.r + STONE_R + 1)
              s.y = f.y + ny * (f.r + STONE_R + 1)
              const vn = s.vx * nx + s.vy * ny
              if (vn < 0) {
                s.vx = (s.vx - 1.4 * vn * nx) * 0.5
                s.vy = (s.vy - 1.4 * vn * ny) * 0.5
                if (s.vx > -40) s.vx = -40
                g.events.push({ type: 'block', x: s.x, y: s.y })
              }
            } else {
              a.mode = 'fall'
              g.score += KINDS.goliath.points
              g.hits++
              g.events.push({ type: 'hit', x: s.x, y: s.y, kind: 'goliath' })
              g.events.push({ type: 'fall' })
              gone = true
            }
            break
          }
          // the body: the stone bounces off the armour
          const b = body(a)
          if (Math.hypot(s.x - b.x, s.y - b.y) < b.r + STONE_R && s.vx > 0) {
            g.events.push({ type: 'block', x: s.x, y: s.y })
            s.vx = -s.vx * 0.35
            s.vy = -Math.abs(s.vy) * 0.25
          }
          continue
        }
        const b = body(a)
        if (Math.hypot(s.x - b.x, s.y - b.y) < b.r + STONE_R) {
          a.hp--
          a.hit = 0
          a.stun = 0.35
          g.hits++
          g.events.push({ type: 'hit', x: s.x, y: s.y, kind: a.kind })
          if (a.hp <= 0) scareAway(g, a)
          gone = true
          break
        }
      }
      if (gone) {
        s.age = 99
        break
      }
    }
  }
  g.stones = g.stones.filter((s) => s.age < 12 && s.x > -60 && s.x < W + 120 && !(s.bounces === 0 && s.y >= GROUND - STONE_R - 0.5 && Math.abs(s.vx) < 8 && s.age > 0.3))

  // the end
  const done = g.next >= lv.waves.length && g.animals.every((a) => a.mode !== 'come') && g.animals.every((a) => a.mode !== 'fall' || a.fall >= 1)
  if (g.sheep <= 0) {
    g.phase = 'lost'
    g.events.push({ type: 'end', phase: 'lost' })
  } else if (done) {
    g.phase = 'won'
    g.events.push({ type: 'end', phase: 'won' })
  } else if (g.stonesLeft <= 0 && g.stones.length === 0 && g.animals.some((a) => a.mode === 'come')) {
    // out of stones with animals still coming: they get through
    g.phase = 'lost'
    g.events.push({ type: 'end', phase: 'lost' })
  }
}

/** The stars of a won level: 1 for winning, 1 more when no sheep was lost, 1 more when at least a third of the stones are left. */
export function starsFor(g: Game): number {
  if (g.phase !== 'won') return 0
  let n = 1
  if (g.lostSheep === 0) n++
  if (g.stonesLeft >= Math.ceil(g.level.stones / 3)) n++
  return n
}
