/**
 * The levels of "Moses Körbchen": 4 chapters of 10 (Am Ufer, Im Schilf, Auf dem Fluss, Im Garten des Pharao). The structure of a level (ropes, walls,
 * things) is written here; the ways to win (`moseKorbWays.ts`) and the lotus places that follow the natural path (`moseKorbStars.ts`) are found by the
 * search tool (`Bonusspiele-Paket/mose/tools/solve.ts`) and played again by the tests.
 */
import { makeGame, type CircleDef, type Game, type LevelDef, type MoverDef, type RotorDef, type SegDef, type BubbleDef, type FanDef } from './moseKorbGame'
import { WAYS } from './moseKorbWays'
import { STARS } from './moseKorbStars'

export const CHAPTER_COUNT = 4
export const LEVELS_PER_CHAPTER = 10

// ── small helpers to write the levels ───────────────────────────────────────────────────────────────────────────────────────

type Kind = NonNullable<SegDef['kind']>
const seg = (x1: number, y1: number, x2: number, y2: number, kind: Kind = 'reed', extra: Partial<SegDef> = {}): SegDef => ({ x1, y1, x2, y2, kind, ...extra })
/** The bank on the left (up to x), on the right (from x): clay, the top is at y 530. */
const bankL = (to: number): SegDef => seg(0, 540, to, 540, 'clay', { t: 10 })
const bankR = (from: number): SegDef => seg(from, 540, 360, 540, 'clay', { t: 10 })
/** A floating island of reed (the nest): the top is at y 533. */
const islet = (cx: number, hw = 48): SegDef => seg(cx - hw, 541, cx + hw, 541, 'reed', { t: 8 })
/** A standing wall of reed bundles from y1 down to the water. */
const wallV = (x: number, y1: number, y2 = 540): SegDef => seg(x, y1, x, y2, 'reed', { t: 7 })
const ramp = (x1: number, y1: number, x2: number, y2: number, kind: Kind = 'wood'): SegDef => seg(x1, y1, x2, y2, kind, { t: 6 })
const rock = (x: number, y: number, r: number): CircleDef => ({ x, y, r, kind: 'rock' })
const cushion = (x1: number, y1: number, x2: number, y2: number, kick = 430): SegDef => seg(x1, y1, x2, y2, 'feder', { t: 5, kick, e: 0.85 })
/** A seesaw about its middle (the ends at x ± half), at the angle a0 (positive: the right end is down). */
const seesaw = (x: number, y: number, half = 60, a0 = 0.32, off = 0): RotorDef => ({ x, y, segs: [{ x1: -half - off, y1: 0, x2: half - off, y2: 0, t: 5 }], a0, minA: -0.42, maxA: 0.42, kind: 'seesaw' })
/** A water wheel with paddles (it turns clockwise when `drive` is positive). */
const wheel = (x: number, y: number, r = 60, drive = 0.8, n = 6): RotorDef => ({
  x,
  y,
  segs: Array.from({ length: n }, (_, k) => ({ x1: Math.cos((k * 2 * Math.PI) / n) * 14, y1: Math.sin((k * 2 * Math.PI) / n) * 14, x2: Math.cos((k * 2 * Math.PI) / n) * r, y2: Math.sin((k * 2 * Math.PI) / n) * r, t: 5 })),
  hub: 14,
  a0: 0,
  drive,
  kind: 'wheel'
})
/** A duck (or a fish) that swims to and fro: the middle of its way, the half way, the time of one round, the start. */
const duck = (x: number, y: number, ax: number, period = 5, phase = 0, hw = 38, kind: 'duck' | 'fish' = 'duck'): MoverDef => ({ x, y, ax, ay: 0, period, phase, hw, kind })
const fish = (x: number, y: number, ay: number, period = 3.2, phase = 0, hw = 30, tilt = 0.32): MoverDef => ({ x, y, ax: 0, ay, period, phase, hw, tilt, kind: 'fish' })
const target = (x: number, figure: 'nest' | 'mirjam' | 'tochter' = 'nest', y = 505) => ({ x, y, r: 44, figure })

interface Draft {
  intro?: string
  basket: [number, number]
  ropes: [number, number][]
  segs?: SegDef[]
  circles?: CircleDef[]
  rotors?: RotorDef[]
  movers?: MoverDef[]
  bubbles?: BubbleDef[]
  fans?: FanDef[]
  /** The place of the stars when they are written by hand (otherwise they follow the natural path). */
  stars?: [number, number][]
  target: ReturnType<typeof target>
  cheer?: LevelDef['cheer']
  waterY?: number
}

const NO_STARS: [number, number][] = [
  [20, 20],
  [340, 20],
  [180, 20]
]

function build(chapter: number, index: number, d: Draft): LevelDef {
  const n = chapter * LEVELS_PER_CHAPTER + index
  const st = d.stars ?? STARS[n] ?? NO_STARS
  return {
    chapter,
    index,
    intro: d.intro,
    basket: { x: d.basket[0], y: d.basket[1] },
    ropes: d.ropes.map(([ax, ay]) => ({ ax, ay })),
    segs: d.segs,
    circles: d.circles,
    rotors: d.rotors,
    movers: d.movers,
    bubbles: d.bubbles,
    fans: d.fans,
    stars: st.map(([x, y]) => ({ x, y })),
    target: d.target,
    cheer: d.cheer,
    waterY: d.waterY,
    solutions: WAYS[n] ?? []
  }
}

const MUTTER: LevelDef['cheer'] = [{ x: 36, y: 530, who: 'mutter' }]
const MIRJAM: LevelDef['cheer'] = [{ x: 36, y: 530, who: 'mirjam' }]
const BOTH: LevelDef['cheer'] = [
  { x: 28, y: 530, who: 'mutter' },
  { x: 66, y: 530, who: 'mirjam' }
]

// ── chapter 1: Am Ufer (the rope, the swing, two ropes, walls, ramps) ─────────────────────────────────────────────────────

const C1: Draft[] = [
  // 0: one rope, straight down onto the nest
  { intro: 'cut', basket: [180, 240], ropes: [[180, 90]], segs: [bankL(80), islet(180)], target: target(180), cheer: MUTTER },
  // 1: swing: the basket swings, cut at the right moment
  { intro: 'swing', basket: [50, 200], ropes: [[150, 70]], segs: [bankL(80), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 2: two ropes: cut the left one, then let the other go
  { intro: 'order', basket: [180, 250], ropes: [[90, 70], [270, 70]], segs: [bankL(80), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 3: a wall of reed in the middle
  { intro: 'wall', basket: [40, 190], ropes: [[120, 60]], segs: [bankL(80), wallV(190, 380), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 4: a ramp that leads to the nest
  { intro: 'slope', basket: [90, 200], ropes: [[90, 80]], segs: [bankL(80), ramp(40, 300, 220, 390), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 5: two ropes and a ramp
  { basket: [160, 230], ropes: [[60, 70], [250, 70]], segs: [bankL(80), ramp(90, 330, 240, 420), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 6: swing over a rock
  { basket: [40, 160], ropes: [[140, 60]], circles: [rock(180, 400, 38)], segs: [bankL(80), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 7: a wall and a ramp
  { basket: [60, 190], ropes: [[130, 70]], segs: [bankL(80), wallV(150, 330), ramp(180, 380, 270, 440), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 8: two ropes and a ramp
  { basket: [150, 250], ropes: [[80, 70], [230, 70]], segs: [bankL(80), ramp(60, 400, 230, 470), islet(300, 50)], target: target(300), cheer: MUTTER },
  // 9: the finale of the bank: swing over a wall onto a ramp
  { basket: [40, 180], ropes: [[120, 60], [200, 60]], segs: [bankL(80), wallV(180, 360), ramp(210, 420, 280, 460), islet(300, 50)], target: target(300), cheer: MUTTER }
]

// ── chapter 2: Im Schilf (bubbles, cushions, seesaws) ───────────────────────────────────────────────────────────────────────

const C2: Draft[] = [
  // 10: a bubble lifts the basket over a wall
  { intro: 'bubble', basket: [60, 210], ropes: [[60, 80]], bubbles: [{ x: 60, y: 340, drift: 55 }], segs: [bankL(80), wallV(200, 260), islet(300, 50)], target: target(300), cheer: MIRJAM },
  // 11: swing onto a cushion of feathers
  { intro: 'feder', basket: [50, 190], ropes: [[150, 70]], segs: [bankL(70), cushion(170, 420, 260, 445), islet(300, 50)], target: target(300), cheer: MIRJAM },
  // 12: a cushion throws the basket over a wall
  { basket: [60, 190], ropes: [[130, 70]], segs: [bankL(70), cushion(110, 400, 190, 430), wallV(225, 370), islet(300, 50)], target: target(300), cheer: MIRJAM },
  // 13: a seesaw sends the basket to the side where it lands
  { intro: 'seesaw', basket: [110, 210], ropes: [[190, 80]], segs: [bankL(70), islet(300, 50)], rotors: [seesaw(190, 400, 60, -0.3)], target: target(300), cheer: MIRJAM },
  // 14: swing into a bubble
  { basket: [40, 230], ropes: [[150, 80]], bubbles: [{ x: 235, y: 330, drift: 40 }], segs: [bankL(70), wallV(250, 300), islet(300, 50)], target: target(300), cheer: MIRJAM },
  // 15: two ropes and a cushion
  { basket: [180, 230], ropes: [[80, 70], [280, 70]], segs: [bankL(70), cushion(70, 400, 160, 440), islet(300, 50)], target: target(300), cheer: MIRJAM },
  // 16: the other way round: a swing onto a seesaw
  { basket: [320, 200], ropes: [[210, 70]], segs: [bankR(290), islet(68, 48)], rotors: [seesaw(190, 370, 62, 0.3)], target: target(68), cheer: [{ x: 322, y: 530, who: 'mirjam' }] },
  // 17: two bubbles one after the other
  { basket: [60, 200], ropes: [[60, 80]], bubbles: [{ x: 60, y: 300, drift: 60 }, { x: 250, y: 200, drift: -20 }], segs: [bankL(70), wallV(180, 280), islet(300, 50)], target: target(300), cheer: MIRJAM },
  // 18: two ropes, a cushion and a wall
  { basket: [170, 240], ropes: [[80, 70], [260, 70]], segs: [bankL(70), cushion(60, 420, 130, 450), wallV(240, 400), islet(300, 50)], target: target(300), cheer: MIRJAM },
  // 19: the finale of the reed: a bubble and a cushion
  { basket: [50, 190], ropes: [[50, 70]], bubbles: [{ x: 50, y: 300, drift: 50 }], segs: [bankL(70), cushion(200, 360, 270, 390), islet(300, 50)], target: target(300), cheer: MIRJAM }
]

// ── chapter 3: Auf dem Fluss (the wheel, ducks, fish) ───────────────────────────────────────────────────────────────────────

const RIVER = { cheer: BOTH }
const C3: Draft[] = [
  // 20: a water wheel
  { intro: 'wheel', basket: [150, 200], ropes: [[150, 80]], segs: [bankL(70), bankR(285)], rotors: [wheel(190, 390, 62, 0.9, 12)], target: target(318, 'tochter'), ...RIVER },
  // 21: swing onto the wheel
  { basket: [50, 190], ropes: [[130, 70]], segs: [bankL(70), bankR(285)], rotors: [wheel(200, 400, 62, 0.9)], target: target(318, 'tochter'), ...RIVER },
  // 22: a duck takes the basket across
  { intro: 'duck', basket: [140, 200], ropes: [[140, 80]], segs: [bankL(70), bankR(290)], movers: [duck(190, 531, 85, 6)], target: target(320, 'tochter'), ...RIVER },
  // 23: swing onto a duck
  { basket: [50, 190], ropes: [[150, 70]], segs: [bankL(70), bankR(290)], movers: [duck(200, 531, 70, 5)], target: target(320, 'tochter'), ...RIVER },
  // 24: a fish: the basket slides down its back
  { intro: 'fish', basket: [190, 200], ropes: [[190, 70]], segs: [bankL(70), ramp(240, 440, 290, 490), bankR(290)], movers: [fish(190, 440, 50, 3.4)], target: target(320, 'tochter'), ...RIVER },
  // 25: a wheel and a duck
  { basket: [120, 190], ropes: [[120, 70]], segs: [bankL(70), bankR(290)], rotors: [wheel(150, 360, 55, 0.9)], movers: [duck(230, 531, 55, 5)], target: target(320, 'tochter'), ...RIVER },
  // 26: a fish and a cushion
  { basket: [60, 200], ropes: [[130, 80]], segs: [bankL(70), cushion(150, 420, 220, 440), bankR(290)], movers: [fish(255, 450, 60, 3.4)], target: target(320, 'tochter'), ...RIVER },
  // 27: a wheel and a bubble
  { basket: [180, 190], ropes: [[180, 70]], bubbles: [{ x: 180, y: 300, drift: 60 }], segs: [bankL(70), bankR(290), wallV(250, 330)], rotors: [wheel(110, 420, 58, 0.8)], target: target(320, 'tochter'), ...RIVER },
  // 28: two ropes, a duck and a fish
  { basket: [180, 230], ropes: [[90, 70], [270, 70]], segs: [bankL(70), bankR(290)], movers: [duck(180, 531, 70, 5.5), fish(250, 440, 55, 3)], target: target(320, 'tochter'), ...RIVER },
  // 29: the finale of the river
  { basket: [140, 190], ropes: [[70, 70]], segs: [bankL(70), bankR(290)], rotors: [wheel(130, 400, 58, 0.9, 12)], movers: [duck(240, 531, 50, 5)], target: target(320, 'tochter'), ...RIVER }
]

// ── chapter 4: Im Garten des Pharao (fans, flumes with a current, everything together) ──────────────────────────────────────

const C4: Draft[] = [
  // 30: a fan
  { intro: 'fan', basket: [120, 150], ropes: [[120, 60]], fans: [{ x: 30, y: 240, angle: 0.1 }], segs: [bankL(70), bankR(270)], target: target(310, 'tochter'), ...RIVER },
  // 31: a fan and a wall
  { basket: [100, 150], ropes: [[100, 60]], fans: [{ x: 30, y: 230, angle: -0.1 }], segs: [bankL(70), wallV(215, 380), bankR(270)], target: target(310, 'tochter'), ...RIVER },
  // 32: a flume with a current carries the basket up
  { intro: 'flume', basket: [40, 200], ropes: [[140, 70]], segs: [bankL(70), seg(50, 450, 220, 380, 'wood', { t: 6, belt: 100 }), bankR(250)], target: target(300, 'tochter'), ...RIVER },
  // 33: a flume and a cushion
  { basket: [100, 190], ropes: [[100, 70]], segs: [bankL(70), seg(40, 450, 190, 390, 'wood', { t: 6, belt: 110 }), cushion(205, 430, 255, 455), bankR(290)], target: target(320, 'tochter'), ...RIVER },
  // 34: a fan and a bubble
  { basket: [60, 190], ropes: [[60, 70]], bubbles: [{ x: 60, y: 300, drift: 20 }], fans: [{ x: 40, y: 150, angle: 0.3 }], segs: [bankL(70), wallV(200, 300), bankR(270)], target: target(310, 'tochter'), ...RIVER },
  // 35: a swing onto a flume
  { basket: [40, 190], ropes: [[130, 70]], segs: [bankL(70), seg(110, 400, 250, 450, 'wood', { t: 6, belt: 90 }), bankR(280)], target: target(315, 'tochter'), ...RIVER },
  // 36: a wheel and a fan
  { basket: [140, 190], ropes: [[140, 70]], fans: [{ x: 40, y: 400, angle: -0.2 }], rotors: [wheel(160, 380, 56, 0.8)], segs: [bankL(70), bankR(270)], target: target(310, 'tochter'), ...RIVER },
  // 37: a duck, a fan and a flume
  { basket: [60, 190], ropes: [[60, 70]], fans: [{ x: 30, y: 300, angle: 0 }], movers: [duck(190, 531, 60, 5)], segs: [bankL(70), seg(130, 400, 250, 350, 'wood', { t: 6, belt: 100 }), bankR(280)], target: target(315, 'tochter'), ...RIVER },
  // 38: a swing, a flume and a fan
  { basket: [40, 190], ropes: [[130, 70]], fans: [{ x: 30, y: 380, angle: -0.3 }], segs: [bankL(70), seg(100, 450, 230, 400, 'wood', { t: 6, belt: 110 }), wallV(160, 380), bankR(280)], target: target(315, 'tochter'), ...RIVER },
  // 39: the finale: the garden of Pharaoh
  { intro: 'many', basket: [140, 210], ropes: [[70, 70], [210, 70]], fans: [{ x: 30, y: 180, angle: 0.15 }], segs: [bankL(70), seg(60, 470, 200, 430, 'wood', { t: 6, belt: 100 }), wallV(235, 420), bankR(280)], target: target(318, 'tochter'), ...RIVER }
]

const DRAFTS: Draft[][] = [C1, C2, C3, C4]

/** The levels whose lotus blossoms are placed by hand (the others follow the natural path of the first way). */
export const HANDMADE_STARS = new Set<number>(DRAFTS.flatMap((ch, c) => ch.flatMap((d, i) => (d.stars ? [c * LEVELS_PER_CHAPTER + i] : []))))

export const LEVELS: LevelDef[] = DRAFTS.flatMap((ch, c) => ch.map((d, i) => build(c, i, d)))

/**
 * The orders in which the search tool tries to cut (and tap): 'c0' cuts rope 0, 'p0' pops bubble 0, 'f0' blows fan 0. A level without an entry
 * cuts all its ropes in their order. Only the tool reads this.
 */
export const PLANS: Record<number, string[][]> = {
  2: [['c0', 'c1']],
  5: [['c0', 'c1'], ['c1', 'c0']],
  8: [['c0', 'c1'], ['c1', 'c0']],
  9: [['c0', 'c1'], ['c1', 'c0']],
  10: [['c0', 'p0']],
  14: [['c0', 'p0']],
  15: [['c0', 'c1'], ['c1', 'c0']],
  17: [['c0', 'p0', 'p1']],
  18: [['c0', 'c1'], ['c1', 'c0']],
  19: [['c0', 'p0']],
  27: [['c0', 'p0']],
  28: [['c0', 'c1'], ['c1', 'c0']],
  30: [['c0', 'f0']],
  31: [['c0', 'f0']],
  34: [['c0', 'p0', 'f0']],
  36: [['c0', 'f0']],
  37: [['c0', 'f0']],
  38: [['c0', 'f0']],
  39: [['c0', 'c1', 'f0']]
}

export function levelGame(i: number): Game {
  return makeGame(LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))]!)
}

/** The rope that the tip shows: the first cut of the first stored way. */
export function tipRope(i: number): number {
  return LEVELS[i]?.solutions[0]?.cuts[0]?.rope ?? 0
}
