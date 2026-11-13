/**
 * The rules of "Wasser für das Volk": the map, the finger, the water (falls, spreads, is kept), sand, mud, salt, the gate with its float and wheel, the plants,
 * the stars. The same start gives the same game.
 */
import { describe, expect, it } from 'vitest'
import {
  AIR,
  COLS,
  DIRT,
  H,
  K,
  MUD,
  ROCK,
  ROWS,
  SAND,
  SIM_HZ,
  W,
  WOOD,
  allPlantsWatered,
  checkMap,
  dig,
  digLine,
  digStroke,
  dump,
  efficiency,
  finished,
  newWorld,
  playSolution,
  start,
  starsOf,
  step,
  type LevelDef,
  type World
} from '../src/utils/wasserGame'

/** A map from a few lines at the top (the sign at column c, row r is the cells c * 4 ..; the rest is rock). */
function level(rows: string[], more: Partial<LevelDef> = {}): LevelDef {
  const map = [...rows.map((r) => r.padEnd(COLS, '#')), ...Array.from({ length: ROWS - rows.length }, () => '#'.repeat(COLS))]
  return { id: 't', world: 0, map, vessel: 'krug', supply: 4, eff: 0.4, tip: { pts: [[1, 1], [2, 2]] }, solutions: [], ...more }
}
/** The middle cell of a sign. */
const at = (c: number, r: number): [number, number] => [c * K + K / 2, r * K + K / 2]

function run(w: World, seconds: number) {
  for (let i = 0; i < seconds * SIM_HZ; i++) {
    step(w)
    w.events.length = 0
  }
}
const mass = (w: World) => w.m.reduce((a, b) => a + b, 0)
const count = (w: World, mat: number) => w.mat.reduce((n, m) => (m === mat ? n + 1 : n), 0)
/** Puts the same mass into all the cells of a rectangle of cells. */
function pour(w: World, x0: number, y0: number, x1: number, y1: number, m: number) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (w.mat[y * W + x] === AIR) w.m[y * W + x] = m
  w.total = mass(w)
}

describe('the map', () => {
  it('has 24 x 36 signs of 4 x 4 cells', () => {
    expect(COLS * K).toBe(W)
    expect(ROWS * K).toBe(H)
  })

  it('finds a wrong map', () => {
    expect(checkMap(['..', '..'])).not.toEqual([])
    const m = Array.from({ length: ROWS }, () => '.'.repeat(COLS))
    expect(checkMap(m)).toEqual([])
    m[3] = 'x'.repeat(COLS)
    expect(checkMap(m).join()).toContain('unknown sign')
  })

  it('makes rock and earth of the signs and rounds the corners a little', () => {
    const w = newWorld(level(['#####', '#ddd#', '#ddd#', '#####']))
    expect(w.mat[0]).toBe(ROCK)
    const dirt = count(w, DIRT)
    expect(dirt).toBeGreaterThan(3 * 2 * K * K - 16)
    expect(dirt).toBeLessThanOrEqual(3 * 2 * K * K)
    // the middle of a block of earth is earth, the air above the map is air
    expect(w.mat[(1 * K + 2) * W + 2 * K + 2]).toBe(DIRT)
    expect(newWorld(level(['....', '....'])).mat[2 * W + 2]).toBe(AIR)
  })

  it('finds springs, plants, the vessel and its mark', () => {
    const w = newWorld(level(['#########', '#Q..*...#', '#ddddddd#', '#dcVVVcd#', '#dcccccd#'], { fill: 0.5 }))
    expect(w.sources).toHaveLength(1)
    expect(w.plants).toHaveLength(1)
    expect(w.vcells.length).toBeGreaterThan(0)
    expect(w.goal).toBe(Math.round(w.vcells.length * 0.5))
    expect(w.markY).toBeGreaterThan(3 * K)
  })
})

describe('the finger', () => {
  it('digs earth and sand and mud, not rock; the first dig starts the water', () => {
    const w = newWorld(level(['#########', '#ddddddd#', '#sssssss#', '#mmmmmmm#', '#ddddddd#']))
    expect(w.started).toBe(false)
    expect(dig(w, ...at(3, 1))).toBeGreaterThan(0)
    expect(w.started).toBe(true)
    expect(w.phase).toBe('play')
    const sand = newWorld(level(['#########', '#sssssss#', '#########']))
    expect(dig(sand, ...at(3, 1))).toBeGreaterThan(0)
    expect(sand.sand).toBeLessThan(count(newWorld(level(['#########', '#sssssss#', '#########'])), SAND))
    const mud = newWorld(level(['#########', '#mmmmmmm#', '#########']))
    expect(dig(mud, ...at(3, 1))).toBeGreaterThan(0)
    const rock = newWorld(level(['#########', '#########', '#########']))
    expect(dig(rock, ...at(3, 1))).toBe(0)
    expect(rock.started).toBe(false)
  })

  it('digs along a line without gaps', () => {
    const w = newWorld(level(['##########', '#dddddddd#', '#dddddddd#', '##########']))
    const [x0, y] = at(2, 1)
    const [x1] = at(7, 1)
    digLine(w, x0, y, x1, y)
    for (let x = x0; x <= x1; x += 2) expect(w.mat[y * W + x]).toBe(AIR)
  })
})

describe('the water', () => {
  it('waits for the first dig, then comes out of the spring', () => {
    const w = newWorld(level(['##########', '#Q.......#', '#ddddddd.#', '#ddddddd.#', '##########'], { supply: 50 }))
    run(w, 1)
    expect(mass(w)).toBe(0)
    expect(w.emitted).toBe(0)
    start(w)
    run(w, 1)
    expect(w.emitted).toBeGreaterThan(5)
  })

  it('is kept: what comes out is in the world and nothing else, and no cell goes below nothing', () => {
    const w = newWorld(level(['##########', '#Q.......#', '#dddddddd#', '#dddddddd#', '#dddddddd#', '#........#', '##########'], { supply: 3 }))
    digStroke(w, { pts: [[1.5, 1.5], [1.5, 5.5]] })
    run(w, 6)
    expect(Math.abs(mass(w) - w.total)).toBeLessThan(0.5)
    expect(w.emitted).toBeGreaterThan(0)
    expect(mass(w)).toBeGreaterThan(w.emitted * 0.9)
    for (let i = 0; i < W * H; i++) expect(w.m[i]).toBeGreaterThan(-0.01)
  })

  it('falls down a shaft and fills a basin evenly, and stays out of the rock', () => {
    const w = newWorld(level(['##########', '#........#', '#........#', '#........#', '##########']))
    pour(w, K, 4 * K - 8, 3 * K - 1, 4 * K - 1, 1)
    start(w)
    run(w, 5)
    const floor = 4 * K - 1
    const left = w.m[floor * W + 2 * K]!
    const right = w.m[floor * W + 7 * K]!
    expect(right).toBeGreaterThan(0.05)
    expect(Math.abs(left - right)).toBeLessThan(0.5)
    expect(w.m[0]).toBe(0)
  })

  it('is lost when too little is left: the round ends friendly (lost)', () => {
    const w = newWorld(level(['##########', '#Q.......#', '#dddddzzz#', '#dddddddd#', '#cVc######', '#ccc######'], { supply: 0.5 }))
    digStroke(w, { pts: [[6.5, 1.5], [6.5, 2.5]] })
    run(w, 30)
    expect(w.phase).toBe('lost')
    expect(finished(w)).toBe(true)
    expect(w.stars).toBe(0)
  })
})

describe('sand, mud, salt', () => {
  it('sand slides down into a hole under it and is not lost', () => {
    const w = newWorld(level(['##########', '#sssss...#', '#ddddd...#', '#........#', '##########']))
    const before = count(w, SAND)
    dig(w, ...at(2, 2), 2)
    dig(w, ...at(3, 2), 2)
    run(w, 3)
    expect(count(w, SAND)).toBe(before)
    expect(w.sand).toBe(before)
  })

  it('mud takes water from the cells next to it', () => {
    const w = newWorld(level(['##########', '#........#', '#.mmmm...#', '#dddddddd#', '##########']))
    start(w)
    pour(w, 2 * K, 2 * K - 2, 6 * K, 2 * K - 1, 1)
    const before = w.total
    run(w, 3)
    expect(w.total).toBeLessThan(before - 0.5)
    expect(w.wet.reduce((a, b) => a + b, 0)).toBeGreaterThan(0.5)
  })

  it('mud that is full is earth', () => {
    const w = newWorld(level(['##########', '#........#', '#.m......#', '#dddddddd#', '##########']))
    start(w)
    const before = count(w, MUD)
    // a deep pool on the small bit of mud
    for (let n = 0; n < 40; n++) {
      pour(w, K, K, 8 * K, 2 * K - 1, 1)
      run(w, 1)
    }
    expect(count(w, MUD)).toBeLessThan(before)
    expect(count(w, DIRT)).toBeGreaterThan(0)
  })

  it('salt swallows water', () => {
    const w = newWorld(level(['##########', '#........#', '#zzzzzzzz#', '##########']))
    start(w)
    pour(w, 2 * K, K + 2, 6 * K, 2 * K - 1, 1)
    const before = w.total
    run(w, 6)
    expect(w.total).toBeLessThan(before / 3)
  })
})

describe('gates and plants', () => {
  it('a float with water opens its gate (the gate is lifted row by row)', () => {
    const w = newWorld(level(['###########', '#Q........#', '#.........#', '#1........#', '#AAAAAAAAA#', '#.........#', '###########'], { sensors: ['float'] }))
    expect(w.gates).toHaveLength(1)
    expect(w.sensors).toHaveLength(1)
    expect(count(w, WOOD)).toBeGreaterThan(0)
    start(w)
    const s = w.sensors[0]!
    for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) w.m[y * W + x] = 1
    run(w, 3)
    expect(s.on).toBe(true)
    expect(count(w, WOOD)).toBe(0)
  })

  it('a wheel needs water for a while, and turns while it gets some', () => {
    const w = newWorld(level(['###########', '#.22......#', '#.22......#', '###########'], { sensors: ['float', 'wheel'] }))
    start(w)
    const s = w.sensors[0]!
    expect(s.kind).toBe('wheel')
    const wet = () => {
      for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) w.m[y * W + x] = 1
      step(w)
    }
    for (let i = 0; i < 40; i++) wet()
    expect(s.on).toBe(false)
    expect(s.angle).toBeGreaterThan(0)
    for (let i = 0; i < 200; i++) wet()
    expect(s.on).toBe(true)
  })

  it('a plant that gets water blooms; the star for the plants needs them all', () => {
    const w = newWorld(level(['##############', '#.*.......*..#', '#dddddddddddd#', '##############']))
    start(w)
    const [a, b] = w.plants
    for (let i = 0; i < 14; i++) {
      for (let y = a!.y0; y <= a!.y1; y++) for (let x = a!.x0; x <= a!.x1; x++) if (w.mat[y * W + x] === AIR) w.m[y * W + x] = 0.5
      step(w)
    }
    expect(a!.bloomed).toBe(true)
    expect(b!.bloomed).toBe(false)
    expect(allPlantsWatered(w)).toBe(false)
  })

  it('a thorn bush is only to be watered: a flood drowns it', () => {
    const w = newWorld(level(['#########', '#.^.....#', '#.......#', '#ddddddd#', '#########']))
    start(w)
    const p = w.plants[0]!
    expect(p.thorn).toBe(true)
    for (let i = 0; i < 160; i++) {
      for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) if (w.mat[y * W + x] === AIR) w.m[y * W + x] = 1
      step(w)
    }
    expect(p.drowned).toBe(true)
    expect(p.bloomed).toBe(false)
  })
})

describe('the stars', () => {
  it('counts one for the jar, two with all plants, three with little spilled', () => {
    const w = newWorld(level(['#########', '#.*.....#', '#cVVVVc##', '#cccccc##'], { eff: 0.5 }))
    w.vesselMass = w.goal
    expect(starsOf(w)).toBe(1)
    w.plants[0]!.bloomed = true
    expect(starsOf(w)).toBe(2)
    w.emitted = w.vesselMass / 0.8
    expect(efficiency(w)).toBeCloseTo(0.8)
    expect(starsOf(w)).toBe(3)
    w.emitted = w.vesselMass / 0.3
    expect(starsOf(w)).toBe(2)
    w.vesselMass = 0
    expect(starsOf(w)).toBe(0)
  })

  it('the same start gives the same game', () => {
    const def = level(['###########', '#Q.......##', '#dddddddd##', '#dddddddd##', '#cVVVVc###', '#cccccc###'], { seed: 7 })
    const strokes = [{ pts: [[1.5, 1.5], [1.5, 3.5], [3.5, 3.5]] as [number, number][] }]
    const a = playSolution(def, strokes, 15)
    const b = playSolution(def, strokes, 15)
    expect(a.out).toEqual(b.out)
    expect(dump(a.w)).toBe(dump(b.w))
  })

  it('a round that is won ends with its stars (the water settles first)', () => {
    const def = level(['###########', '#Q.......##', '#dd.dddd.##', '#dd.dddd.##', '#dcVVVc.d##', '#dccccc.d##'], { supply: 6 })
    const r = playSolution(def, [{ pts: [[1.5, 1.5], [1.5, 2.5], [3.5, 2.5], [3.5, 3.5], [3.5, 4.0]] }], 40)
    expect(r.out.phase).toBe('won')
    expect(r.out.stars).toBeGreaterThanOrEqual(1)
    expect(finished(r.w)).toBe(true)
  })
})
