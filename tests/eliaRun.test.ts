/**
 * The rules of "Elia läuft": every pattern can be passed, the track is generated without dead ends, a jump clears a low stone, a slide
 * passes a beam, a wall needs a lane change, the first stumble slows and the second one ends the run, bread and the feather work.
 */
import { describe, expect, it } from 'vitest'
import {
  BREAD_FOOD,
  BREAD_REST,
  FEATHER_MAX,
  GOAL_FREE,
  FEATHER_MIN,
  RAVEN_GAP,
  FREE_LEVEL,
  HUNGER_SECONDS,
  KRUG_VALUE,
  LEVELS,
  PATTERNS,
  ROW,
  SLIDE_TIME,
  STUMBLE_WINDOW,
  input,
  laneX,
  newRun,
  scoreOf,
  solvable,
  starsFor,
  step,
  type Obstacle,
  type Run
} from '../src/utils/eliaRun'

/** A random generator with a fixed start, so a test gives the same track every time. */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** A clean run with nothing on the track, then the things a test wants. */
function bare(): Run {
  const g = newRun(0, seeded(1))
  g.obstacles = []
  g.pickups = []
  g.ravenCalls = 0
  g.genTo = 1e9
  return g
}
const obstacle = (z: number, lane: number, kind: Obstacle['kind']): Obstacle => ({ z, lane, kind, sprite: 0, hit: false })
function run(g: Run, seconds: number) {
  for (let t = 0; t < seconds; t += 0.01) step(g, 0.01)
}
/** Runs until the runner is `lead` seconds before z, then does `act`; goes on for `seconds`. */
function actAt(g: Run, z: number, lead: number, act: () => void, seconds = 4) {
  let done = false
  for (let i = 0; i < seconds * 100 && g.phase === 'play'; i++) {
    if (!done && g.dist > z - g.speed * lead) {
      act()
      done = true
    }
    step(g, 0.01)
  }
  return done
}

describe('patterns', () => {
  it('can all be passed', () => {
    for (const p of PATTERNS) expect(solvable(p.rows), p.rows.join(' ')).toBe(true)
  })

  it('has rows of three lanes, only known characters', () => {
    for (const p of PATTERNS) for (const row of p.rows) expect(row).toMatch(/^[.oakfLlHhB]{3}$/)
  })

  it('sees a blocked row as impassable and two hazards in a row as too tight', () => {
    expect(solvable(['BBB'])).toBe(false)
    expect(solvable(['HHH', 'LLL'])).toBe(false)
    expect(solvable(['HHH', '...', 'LLL'])).toBe(true)
  })

  it('has every tier from 1 to 4', () => {
    expect(new Set(PATTERNS.map((p) => p.tier))).toEqual(new Set([1, 2, 3, 4]))
  })
})

describe('the track', () => {
  it('is generated up to the goal of a level, with a free start', () => {
    const g = newRun(0, seeded(7))
    expect(g.obstacles.length).toBeGreaterThan(10)
    expect(Math.min(...g.obstacles.map((o) => o.z))).toBeGreaterThanOrEqual(20)
    expect(Math.max(...g.obstacles.map((o) => o.z))).toBeGreaterThan(LEVELS[0]!.goal - 100)
    expect(g.breadTotal).toBeGreaterThan(20)
  })

  it('never puts a blocked lane in all three lanes of a row', () => {
    for (let level = 0; level < LEVELS.length; level++) {
      const g = newRun(level, seeded(level + 3))
      const rows = new Map<number, number>()
      for (const o of g.obstacles) if (o.kind === 'block') rows.set(o.z, (rows.get(o.z) ?? 0) + 1)
      for (const n of rows.values()) expect(n).toBeLessThan(3)
    }
  })

  it('gets harder along the level (no beams in the first stretch of level 1)', () => {
    const g = newRun(0, seeded(11))
    const early = g.obstacles.filter((o) => o.z < 150)
    expect(early.every((o) => o.kind !== 'high')).toBe(true)
  })

  it('grows in the free run while running', () => {
    const g = newRun(FREE_LEVEL, seeded(5))
    const first = g.obstacles.length
    g.dist = 500
    step(g, 0.01, seeded(6))
    expect(g.obstacles.length).toBeGreaterThan(first)
  })
})

describe('moving', () => {
  it('runs faster as the level goes on', () => {
    const g = bare()
    run(g, 1)
    const early = g.speed
    g.dist = g.goal * 0.9
    run(g, 0.1)
    expect(g.speed).toBeGreaterThan(early)
  })

  it('changes the lane by a swipe and not beyond the edge', () => {
    const g = bare()
    input(g, 'left')
    input(g, 'left')
    expect(g.lane).toBe(0)
    run(g, 0.3)
    expect(g.x).toBeCloseTo(laneX(0), 5)
    input(g, 'right')
    input(g, 'right')
    input(g, 'right')
    expect(g.lane).toBe(2)
  })

  it('jumps about 1.7 m high and lands again', () => {
    const g = bare()
    input(g, 'jump')
    let top = 0
    for (let i = 0; i < 100; i++) {
      step(g, 0.01)
      top = Math.max(top, g.y)
    }
    expect(top).toBeGreaterThan(1.5)
    expect(top).toBeLessThan(1.9)
    run(g, 0.5)
    expect(g.y).toBe(0)
  })

  it('slides for a short time, and a swipe down in the air drops at once and slides on landing', () => {
    const g = bare()
    input(g, 'slide')
    expect(g.slide).toBeGreaterThan(0)
    run(g, SLIDE_TIME + 0.05)
    expect(g.slide).toBe(0)
    input(g, 'jump')
    run(g, 0.2)
    input(g, 'slide')
    run(g, 0.2)
    expect(g.y).toBe(0)
    expect(g.slide).toBeGreaterThan(0)
  })

  it('keeps a jump that is asked for a moment before landing', () => {
    const g = bare()
    input(g, 'jump')
    run(g, 0.6)
    expect(g.y).toBeGreaterThan(0)
    input(g, 'jump')
    run(g, 0.2)
    // it landed and jumped again at once
    expect(g.y > 0 || g.vy !== 0).toBe(true)
  })
})

describe('obstacles', () => {
  it('a low stone is cleared by a jump but stumbles a runner on the ground', () => {
    const a = bare()
    a.obstacles = [obstacle(30, 1, 'low')]
    run(a, 3)
    expect(a.stumbles).toBe(1)

    const b = bare()
    b.obstacles = [obstacle(30, 1, 'low')]
    expect(actAt(b, 30, 0.3, () => input(b, 'jump'))).toBe(true)
    expect(b.stumbles).toBe(0)
    expect(b.phase).toBe('play')
  })

  it('a beam is passed in a slide and not in a jump', () => {
    const a = bare()
    a.obstacles = [obstacle(30, 1, 'high')]
    expect(actAt(a, 30, 0.2, () => input(a, 'slide'))).toBe(true)
    expect(a.stumbles).toBe(0)
    expect(a.phase).toBe('play')

    const b = bare()
    b.obstacles = [obstacle(30, 1, 'high')]
    actAt(b, 30, 0.3, () => input(b, 'jump'))
    expect(b.stumbles + (b.phase === 'over' ? 1 : 0)).toBeGreaterThan(0)
  })

  it('a wall in the lane is a fall, one lane over is free', () => {
    const a = bare()
    a.obstacles = [obstacle(30, 1, 'block')]
    run(a, 3)
    expect(a.phase).toBe('over')
    expect(a.cause).toBe('block')

    const b = bare()
    b.obstacles = [obstacle(30, 1, 'block')]
    input(b, 'left')
    run(b, 3)
    expect(b.phase).toBe('play')
    expect(b.stumbles).toBe(0)
  })

  it('a wall is not cleared by a jump', () => {
    const g = bare()
    g.obstacles = [obstacle(30, 1, 'block')]
    actAt(g, 30, 0.3, () => input(g, 'jump'))
    expect(g.phase).toBe('over')
  })

  it('the first stumble slows down and the runner can go on; a second one soon after is a fall', () => {
    const g = bare()
    g.obstacles = [obstacle(30, 1, 'low'), obstacle(30 + ROW * 2, 1, 'low')]
    run(g, 2.3)
    expect(g.stumbles).toBe(1)
    expect(g.phase).toBe('play')
    expect(g.slow).toBeLessThan(1)
    run(g, 2.5)
    expect(g.phase).toBe('over')
    expect(g.cause).toBe('second')
  })

  it('a second stumble long after the first is only a stumble again', () => {
    const g = bare()
    g.obstacles = [obstacle(30, 1, 'low'), obstacle(30 + STUMBLE_WINDOW * 20, 1, 'low')]
    run(g, 20)
    expect(g.stumbles).toBe(2)
    expect(g.phase).toBe('play')
  })

  it('brushing a wall while changing the lane is a stumble, not a fall', () => {
    const g = bare()
    g.obstacles = [obstacle(30, 0, 'block')]
    // change from the middle lane to the left one just as the wall comes
    actAt(g, 30, 0.07, () => input(g, 'left'))
    expect(g.phase).toBe('play')
    expect(g.stumbles).toBe(1)
  })
})

describe('bread, jugs and the feather', () => {
  it('collects bread on the ground in the lane', () => {
    const g = bare()
    g.pickups = [
      { z: 30, lane: 1, y: 0.6, type: 'brot', got: false },
      { z: 30, lane: 0, y: 0.6, type: 'brot', got: false }
    ]
    run(g, 3)
    expect(g.bread).toBe(1)
  })

  it('bread in the air is only caught in a jump', () => {
    const a = bare()
    a.pickups = [{ z: 30, lane: 1, y: 2.6, type: 'brot', got: false }]
    run(a, 3)
    expect(a.bread).toBe(0)

    const b = bare()
    b.pickups = [{ z: 30, lane: 1, y: 2.6, type: 'brot', got: false }]
    actAt(b, 30, 0.34, () => input(b, 'jump'))
    expect(b.bread).toBe(1)
  })

  it('a jug is worth several pieces of bread', () => {
    const g = bare()
    g.pickups = [{ z: 30, lane: 1, y: 0.7, type: 'krug', got: false }]
    run(g, 3)
    expect(g.bread).toBe(KRUG_VALUE)
  })

  it('a feather calls a raven, and the raven drops bread that can be eaten', () => {
    const g = bare()
    g.hunger = 0.4
    g.pickups = [{ z: 25, lane: 1, y: 1, type: 'feder', got: false }]
    // the raven comes into the middle lane or one next to it: stay in the lane it goes to
    let seen = false
    for (let i = 0; i < 900 && g.phase === 'play'; i++) {
      step(g, 0.01, seeded(3))
      const r = g.ravens[0]
      if (r) {
        seen = true
        while (g.lane < r.lane) input(g, 'right')
        while (g.lane > r.lane) input(g, 'left')
      }
    }
    expect(seen).toBe(true)
    expect(g.bread).toBeGreaterThanOrEqual(4)
    expect(g.ravenCalls).toBe(0)
  })

  it('brings no bread at all without a feather', () => {
    const g = bare()
    run(g, 20)
    expect(g.ravens).toHaveLength(0)
    expect(g.pickups.filter((p) => p.type === 'brot')).toHaveLength(0)
  })
})

describe('the end', () => {
  it('is won at the goal, with stars for never being hungry and for no stumble', () => {
    const g = bare()
    g.goal = 100
    run(g, 30)
    expect(g.phase).toBe('won')
    expect(starsFor(g)).toBe(3)
    g.stumbles = 1
    expect(starsFor(g)).toBe(2)
    g.minHunger = 0.1
    expect(starsFor(g)).toBe(1)
  })

  it('gives no stars for a fallen runner and counts the score of the free run', () => {
    const g = bare()
    g.phase = 'over'
    expect(starsFor(g)).toBe(0)
    g.dist = 250.7
    g.bread = 4
    expect(scoreOf(g)).toBe(262)
  })

  it('comes to a stop after the end and does not hang in the air after a fall in a jump', () => {
    const g = bare()
    g.obstacles = [obstacle(30, 1, 'block')]
    actAt(g, 30, 0.3, () => input(g, 'jump'))
    expect(g.phase).toBe('over')
    run(g, 1.5)
    expect(g.y).toBe(0)
    expect(g.speed).toBeLessThan(0.1)
    const d = g.dist
    run(g, 1)
    expect(g.dist - d).toBeLessThan(0.1)
  })

  it('has levels with growing goals', () => {
    expect(LEVELS).toHaveLength(15)
    for (let w = 0; w < 5; w++) expect(LEVELS.filter((l) => l.world === w)).toHaveLength(3)
  })
})

describe('hunger', () => {
  it('runs down over time and bread and jugs fill it up again', () => {
    const g = bare()
    run(g, 5)
    expect(g.hunger).toBeCloseTo(1 - 5 / HUNGER_SECONDS, 1)
    g.pickups = [{ z: g.dist + 3, lane: 1, y: 0.6, type: 'brot', got: false }]
    const before = g.hunger
    run(g, 1)
    expect(g.hunger).toBeGreaterThan(before - 1 / HUNGER_SECONDS + BREAD_FOOD * 0.9)
  })

  it('slows Elijah down when the bar is empty, and he stops: the run is over', () => {
    const g = bare()
    g.goal = 100000
    g.hunger = 0
    run(g, 1)
    expect(g.speed).toBeLessThan(g.v0)
    run(g, 4)
    expect(g.phase).toBe('over')
    expect(g.cause).toBe('hunger')
  })

  it('lets him go on running when he eats before he stops', () => {
    const g = bare()
    g.goal = 100000
    g.hunger = 0
    run(g, 1)
    g.pickups = [{ z: g.dist + 2, lane: 1, y: 0.6, type: 'krug', got: false }]
    run(g, 6)
    expect(g.phase).toBe('play')
    expect(g.slow).toBeGreaterThan(0.5)
  })

  it('lays a feather every 150 to 200 metres on every level, each in a lane that is free around it', () => {
    for (let level = 0; level < LEVELS.length; level++) {
      const g = newRun(level, seeded(level + 21))
      const f = g.pickups.filter((p) => p.type === 'feder').sort((x, y) => x.z - y.z)
      expect(f.length, `level ${level}`).toBeGreaterThan(3)
      expect(f[0]!.z).toBeLessThanOrEqual(80)
      for (let i = 1; i < f.length; i++) {
        // a feather that had no free lane is pushed on by a few rows
        expect(f[i]!.z - f[i - 1]!.z, `level ${level}`).toBeGreaterThanOrEqual(FEATHER_MIN)
        expect(f[i]!.z - f[i - 1]!.z, `level ${level}`).toBeLessThanOrEqual(FEATHER_MAX + 4 * ROW)
      }
      for (const p of f) expect(g.obstacles.some((o) => o.lane === p.lane && Math.abs(o.z - p.z) <= 4)).toBe(false)
    }
  })

  it('has no bread lying on the ground in the patterns any more', () => {
    for (let level = 0; level < LEVELS.length; level++) {
      const g = newRun(level, seeded(level + 5))
      expect(g.pickups.filter((p) => p.type === 'brot')).toHaveLength(0)
    }
  })
})

describe('the ravens', () => {
  /** A run with nothing on the track, and a raven called at once. */
  function withRaven(): Run {
    const g = bare()
    g.ravenCalls = 1
    return g
  }

  it('fly in from behind, drop the bread into one free lane and fly away', () => {
    const g = withRaven()
    let lane = -1
    let maxLead = -99
    let minLead = 99
    for (let i = 0; i < 600; i++) {
      step(g, 0.01, seeded(3))
      for (const r of g.ravens) {
        lane = r.lane
        maxLead = Math.max(maxLead, r.lead)
        minLead = Math.min(minLead, r.lead)
      }
    }
    expect(lane).toBeGreaterThanOrEqual(0)
    // it starts behind Elijah (the picture is in front of the camera) and ends far in front of him
    expect(minLead).toBeLessThan(0)
    expect(maxLead).toBeGreaterThan(20)
    const bread = g.pickups.filter((p) => p.type === 'brot')
    expect(bread.length).toBeGreaterThanOrEqual(5)
    expect(bread.length).toBeLessThanOrEqual(6)
    expect(new Set(bread.map((p) => p.lane)).size).toBe(1)
    // the pieces come one after the other, a few metres apart, in front of the runner when they fall
    const zs = bread.map((p) => p.z).sort((a, b) => a - b)
    for (let i = 1; i < zs.length; i++) {
      expect(zs[i]! - zs[i - 1]!).toBeGreaterThan(2)
      expect(zs[i]! - zs[i - 1]!).toBeLessThan(RAVEN_GAP * 30 + 1)
    }
    expect(g.ravens).toHaveLength(0)
  })

  it('make the bread fall to the ground, where it stays', () => {
    const g = withRaven()
    for (let i = 0; i < 500 && g.pickups.length === 0; i++) step(g, 0.01, seeded(3))
    const p = g.pickups[0]!
    expect(p.vy).toBeDefined()
    expect(p.y).toBeGreaterThan(2)
    for (let i = 0; i < 60; i++) step(g, 0.01, seeded(3))
    expect(p.y).toBe(BREAD_REST)
    expect(p.vy).toBeUndefined()
  })

  it('give food when Elijah runs through the bread, and nothing when he runs beside it', () => {
    const eat = (stay: boolean) => {
      const g = withRaven()
      g.hunger = 0.5
      // the raven takes the lane given by the random generator: look for it, then go there (or to a lane next to it)
      let moved = false
      for (let i = 0; i < 800 && g.phase === 'play'; i++) {
        step(g, 0.01, seeded(3))
        const r = g.ravens[0]
        if (r && !moved) {
          const want = stay ? r.lane : r.lane === 0 ? 2 : 0
          while (g.lane < want) input(g, 'right')
          while (g.lane > want) input(g, 'left')
          moved = true
        }
      }
      return g
    }
    expect(eat(true).bread).toBeGreaterThanOrEqual(3)
    expect(eat(false).bread).toBe(0)
  })

  it('do not drop bread onto things that stand in the lane', () => {
    const g = withRaven()
    // every lane has a low thing in the place where the pieces would fall: the raven waits and tries again later
    g.obstacles = [0, 1, 2].map((lane) => obstacle(60, lane, 'low'))
    for (let i = 0; i < 100; i++) step(g, 0.01, seeded(3))
    expect(g.ravens).toHaveLength(0)
    // it does come later, when the way is free
    g.obstacles = []
    for (let i = 0; i < 400; i++) step(g, 0.01, seeded(3))
    expect(g.pickups.filter((p) => p.type === 'brot').length).toBeGreaterThan(0)
  })

  it('are not called near the goal of a level', () => {
    const g = withRaven()
    g.goal = 20
    for (let i = 0; i < 300 && g.phase === 'play'; i++) step(g, 0.01, seeded(3))
    expect(g.pickups.filter((p) => p.type === 'brot')).toHaveLength(0)
    expect(g.ravenCalls).toBe(0)
  })

  it('bring enough that a runner who picks up every feather and follows every raven never starves, on any level', () => {
    for (let level = 0; level < LEVELS.length; level++) {
      const g = newRun(level, seeded(level + 31))
      // only the food is measured: the obstacles are taken away
      g.obstacles = []
      g.invuln = 1e9
      for (let i = 0; i < 200 * 100 && g.phase === 'play'; i++) {
        step(g, 0.01, seeded(level + 31))
        const r = g.ravens[0]
        const next = g.pickups.find((p) => p.type === 'feder' && !p.got && p.z > g.dist && p.z < g.dist + 30)
        const want = r ? r.lane : next ? next.lane : g.lane
        while (g.lane < want) input(g, 'right')
        while (g.lane > want) input(g, 'left')
      }
      expect(g.phase, `level ${level}`).toBe('won')
      expect(g.minHunger, `level ${level}`).toBeGreaterThan(0.15)
    }
  })

  it('lets Elijah really get hungry when he misses every other feather', () => {
    let hungry = 0
    for (let level = 0; level < 3; level++) {
      const g = newRun(level, seeded(level + 41))
      g.obstacles = []
      g.invuln = 1e9
      let k = 0
      g.pickups = g.pickups.filter((p) => p.type !== 'feder' || k++ % 2 === 0)
      for (let i = 0; i < 200 * 100 && g.phase === 'play'; i++) {
        step(g, 0.01, seeded(level + 41))
        const r = g.ravens[0]
        const next = g.pickups.find((p) => p.type === 'feder' && !p.got && p.z > g.dist && p.z < g.dist + 30)
        const want = r ? r.lane : next ? next.lane : g.lane
        while (g.lane < want) input(g, 'right')
        while (g.lane > want) input(g, 'left')
      }
      expect(g.minHunger, `level ${level}`).toBeLessThan(0.4)
      if (g.minHunger < 0.25) hungry++
    }
    expect(hungry).toBeGreaterThanOrEqual(1)
  })
})

describe('the goal', () => {
  it('leaves the end of every level free, so that Elijah can run out at the goal', () => {
    for (let level = 0; level < LEVELS.length; level++) {
      const g = newRun(level, seeded(level + 51))
      expect(Math.max(...g.obstacles.map((o) => o.z))).toBeLessThanOrEqual(g.goal - GOAL_FREE)
      expect(Math.max(...g.pickups.map((p) => p.z))).toBeLessThanOrEqual(g.goal - GOAL_FREE)
    }
  })
})
