/**
 * "Nehemias Mauer": the rules (turning with kicks, locking in the template, walls under a lintel, undo, reserve, rubble, clay, the stuck test,
 * the tip, the stars).
 */
import { describe, expect, it } from 'vitest'
import {
  AIR,
  ORIENTS,
  SHAPE_IDS,
  SHAPE_SIZE,
  SLOT,
  UNIQUE_ORIENTS,
  WALL,
  analyze,
  checkMap,
  discard,
  fieldOf,
  fits,
  ghostY,
  hardDrop,
  holdPiece,
  landingY,
  move,
  newGame,
  restingPlaces,
  rotate,
  softDrop,
  solveGeometry,
  starsOf,
  tick,
  tip,
  undo,
  type Game,
  type GameDef,
  type QItem,
  type ShapeId
} from '../src/utils/nehemiaMauerGame'

const q = (...shapes: string[]): QItem[] => shapes.map((s) => (s.startsWith('!') ? { shape: s.slice(1) as ShapeId, decoy: true } : { shape: s as ShapeId, decoy: false }))

function game(map: string[], queue: QItem[], extra: Partial<GameDef> = {}): Game {
  return newGame({ map, queue, gravity: 0, undo: 1, clay: 0, hold: true, par: 60, ...extra })
}

describe('shapes', () => {
  it('has the right number of cells and the right number of different turns', () => {
    for (const s of SHAPE_IDS) {
      for (const o of ORIENTS[s]) expect(o.cells.length).toBe(SHAPE_SIZE[s])
      expect(UNIQUE_ORIENTS[s].length).toBeGreaterThan(0)
    }
    expect(UNIQUE_ORIENTS.O).toHaveLength(1)
    expect(UNIQUE_ORIENTS.I4).toHaveLength(2)
    expect(UNIQUE_ORIENTS.T).toHaveLength(4)
    expect(UNIQUE_ORIENTS.L).toHaveLength(4)
    expect(UNIQUE_ORIENTS.S).toHaveLength(2)
    expect(UNIQUE_ORIENTS.I5).toHaveLength(2)
  })

  it('turns back to the same place after a turn right and a turn left', () => {
    const g = game(['######', '######', '######', '######'], q('T', 'L', 'O'))
    for (let k = 0; k < 3; k++) {
      const c = g.cur!
      const before = JSON.stringify([c.rot, c.x, c.y])
      expect(rotate(g, 1)).toBe(true)
      expect(rotate(g, -1)).toBe(true)
      expect(JSON.stringify([g.cur!.rot, g.cur!.x, g.cur!.y])).toBe(before)
      hardDrop(g)
    }
  })
})

describe('the field', () => {
  it('has sky above, slots in the template and a wall under a lintel', () => {
    const map = ['######', '##..##', '##..##']
    const f = fieldOf(map, 4)
    expect(f.rows).toBe(7)
    expect(f.kind[0]).toBe(AIR)
    expect(f.kind[4 * 6 + 0]).toBe(SLOT)
    expect(f.kind[5 * 6 + 2]).toBe(WALL)
    expect(f.kind[4 * 6 + 2]).toBe(SLOT)
  })

  it('a lower column is open above its top', () => {
    const f = fieldOf(['.#.#', '####'], 3)
    expect(f.kind[3 * 4 + 0]).toBe(AIR)
    expect(f.kind[3 * 4 + 1]).toBe(SLOT)
    expect(f.kind[4 * 4 + 0]).toBe(SLOT)
  })

  it('a column without any cell is solid under the sky', () => {
    const f = fieldOf(['.#', '.#'], 3)
    expect(f.kind[0]).toBe(AIR)
    expect(f.kind[3 * 2 + 0]).toBe(WALL)
  })

  it('finds a column with two runs of cells', () => {
    expect(checkMap(['#.', '##', '##'])).toEqual([])
    expect(checkMap(['#', '.', '#']).length).toBe(1)
  })
})

describe('moving and turning', () => {
  it('starts in the middle at the top and moves to the edges and no further', () => {
    const g = game(['########', '########'], q('O', 'O', 'O', 'O'))
    expect(g.cur!.x).toBe(3)
    expect(g.cur!.y).toBe(0)
    for (let i = 0; i < 10; i++) move(g, -1)
    expect(g.cur!.x).toBe(0)
    for (let i = 0; i < 10; i++) move(g, 1)
    expect(g.cur!.x).toBe(6)
  })

  it('a bar turns up in the sky (a kick brings it down into the field)', () => {
    const g = game(['####', '####', '####', '####'], q('I4', 'I4'))
    expect(rotate(g, 1)).toBe(true)
    expect(g.cur!.rot).toBe(1)
    for (const [x, y] of ORIENTS.I4[1]!.cells) {
      expect(g.cur!.y + y).toBeGreaterThanOrEqual(0)
      expect(g.cur!.x + x).toBeGreaterThanOrEqual(0)
    }
  })

  it('is pushed aside by a kick when it turns next to the edge', () => {
    const g = game(['####', '####', '####', '####'], q('I4'))
    for (let i = 0; i < 6; i++) move(g, -1)
    expect(rotate(g, 1)).toBe(true)
    expect(g.cur!.x + ORIENTS.I4[1]!.cells[0]![0]).toBeGreaterThanOrEqual(0)
  })

  it('falls by gravity but rests and never locks by itself', () => {
    const g = game(['####', '####'], q('O', 'O'), { gravity: 4 })
    for (let i = 0; i < 100; i++) tick(g, 0.1)
    expect(g.cur!.y).toBe(g.rows - 2)
    expect(g.placed).toHaveLength(0)
  })

  it('locks by itself after a pause in the quick mode', () => {
    const g = game(['####', '####'], q('O', 'O'), { gravity: 4 })
    g.lockDelay = 1
    for (let i = 0; i < 100; i++) tick(g, 0.1)
    expect(g.placed).toHaveLength(1)
  })

  it('a soft drop at rest locks only when asked to', () => {
    const g = game(['####', '####'], q('O', 'O'))
    g.cur!.y = ghostY(g)
    expect(softDrop(g, false)).toBe('rest')
    expect(g.placed).toHaveLength(0)
    expect(softDrop(g, true)).toBe('locked')
    expect(g.placed).toHaveLength(1)
  })
})

describe('locking', () => {
  it('a hard drop lands on the floor and fills the slots', () => {
    const g = game(['####', '####'], q('O', 'O'))
    expect(hardDrop(g)).toBe(true)
    expect(g.placed).toHaveLength(1)
    expect(g.slotsLeft).toBe(4)
    expect(g.fill[(g.rows - 1) * 4 + 1]).toBe(1)
    expect(g.cur!.shape).toBe('O')
  })

  it('refuses to lock a stone that sticks out of the template', () => {
    const g = game(['##', '##'], q('I4', 'O'))
    const before = g.slotsLeft
    expect(hardDrop(g)).toBe(false)
    expect(g.slotsLeft).toBe(before)
    expect(g.events.some((e) => e.t === 'refuse')).toBe(true)
  })

  it('a stone rests on a wall cell under a lintel', () => {
    const g = game(['####', '#..#'], q('I4', 'I2', 'I2'))
    // the bar lies in the top row of the template (its cells are in row 1 of its box): the cells under the middle of it are the gate, a wall
    expect(landingY(g, 'I4', 0, 0)).toBe(g.sky - 1)
    expect(hardDrop(g)).toBe(true)
    expect(g.fill[g.sky * 4 + 1]).toBe(1)
  })

  it('wins when the last slot is filled, with three stars when quick and unhelped', () => {
    const g = game(['####'], q('I4'))
    hardDrop(g)
    expect(g.status).toBe('won')
    expect(starsOf(g)).toBe(3)
  })

  it('two stars when slow, one when helped', () => {
    const g = game(['####', '####'], q('I4', 'I4'), { par: 5 })
    softDrop(g)
    tick(g, 10)
    hardDrop(g)
    hardDrop(g)
    expect(g.status).toBe('won')
    expect(starsOf(g)).toBe(2)
    const h = game(['####', '####'], q('I4', 'I4'))
    hardDrop(h)
    expect(undo(h)).toBe(true)
    hardDrop(h)
    hardDrop(h)
    expect(h.status).toBe('won')
    expect(starsOf(h)).toBe(1)
  })
})

describe('the helpers', () => {
  it('undo gives the stone back and the stone in the hand goes to the front of the row', () => {
    const g = game(['####', '####'], q('O', 'I4', 'I4'))
    hardDrop(g)
    const handBefore = g.cur!.shape
    expect(undo(g)).toBe(true)
    expect(g.cur!.shape).toBe('O')
    expect(g.queue[0]!.shape).toBe(handBefore)
    expect(g.slotsLeft).toBe(8)
    expect(g.undoLeft).toBe(0)
    expect(undo(g)).toBe(false)
  })

  it('reserve swaps once per stone', () => {
    const g = game(['######', '######'], q('O', 'I4', 'T'))
    expect(holdPiece(g)).toBe(true)
    expect(g.hold!.shape).toBe('O')
    expect(g.cur!.shape).toBe('I4')
    expect(holdPiece(g)).toBe(false)
    hardDrop(g)
    expect(holdPiece(g)).toBe(true)
    expect(g.cur!.shape).toBe('O')
    expect(g.hold!.shape).toBe('T')
  })

  it('rubble crumbles when it is dropped or thrown away and never fills the wall', () => {
    const g = game(['####', '####'], q('!T', 'I4', 'I4'))
    expect(g.cur!.decoy).toBe(true)
    expect(hardDrop(g)).toBe(true)
    expect(g.slotsLeft).toBe(8)
    expect(g.placed).toHaveLength(0)
    expect(g.cur!.shape).toBe('I4')
    const h = game(['####', '####'], q('!T', 'I4', 'I4'))
    expect(discard(h)).toBe(true)
    expect(h.cur!.shape).toBe('I4')
    expect(discard(h)).toBe(false)
  })

  it('clay fills the last gaps when the stones are used up, and costs the star', () => {
    const g = game(['###', '###'], q('I3', 'I2'), { clay: 1 })
    hardDrop(g)
    expect(g.slotsLeft).toBe(3)
    hardDrop(g)
    expect(g.status).toBe('won')
    expect(g.patched).toBe(1)
    expect(starsOf(g)).toBe(1)
  })

  it('loses when the stones are used up and too many gaps are left', () => {
    const g = game(['######', '######'], q('O', 'O'))
    hardDrop(g)
    move(g, -2)
    hardDrop(g)
    expect(g.status).toBe('lost')
  })
})

describe('the stuck test', () => {
  it('knows when the rest can not fill the template', () => {
    const h = game(['####', '####'], q('O', 'O'))
    expect(h.cur!.x).toBe(1)
    // an O in the middle leaves two columns of width one: the second O can not fill them
    hardDrop(h)
    expect(h.stuck).toBe(true)
    expect(h.events.some((e) => e.t === 'stuck')).toBe(true)
  })

  it('is not stuck when a good place was taken', () => {
    const g = game(['###', '###'], q('O', 'I2'))
    move(g, -1)
    hardDrop(g)
    expect(g.stuck).toBe(false)
  })

  it('solveGeometry counts the holes that the clay may fill', () => {
    const g = game(['####', '####'], q('O', 'T'))
    expect(solveGeometry(g, ['O', 'O'], 0)).toBe(true)
    expect(solveGeometry(g, ['T', 'O'], 0)).toBe(false)
    expect(solveGeometry(g, ['I4', 'I4'], 0)).toBe(true)
    expect(solveGeometry(g, ['I4', 'O'], 0)).toBe(false)
    expect(solveGeometry(g, ['I4', 'V3'], 1)).toBe(false)
    expect(solveGeometry(g, ['O', 'V3'], 1)).toBe(true)
    expect(solveGeometry(g, ['I3', 'I4'], 0)).toBe(false)
  })

  it('becomes unstuck again after an undo', () => {
    const h = game(['####', '####'], q('O', 'O'))
    hardDrop(h)
    expect(h.stuck).toBe(true)
    undo(h)
    expect(h.stuck).toBe(false)
    analyze(h)
    expect(h.stuck).toBe(false)
  })
})

describe('the tip', () => {
  it('names a place that keeps the wall buildable and costs the star', () => {
    const g = game(['####', '####'], q('O', 'O'))
    expect(restingPlaces(g).length).toBeGreaterThan(0)
    const t = tip(g)!
    expect(t).toBeTruthy()
    expect(g.helped).toBe(true)
    expect(fits(g, 'O', t.rot, t.x, t.y)).toBe(true)
    expect(t.y).toBe(g.rows - 2)
  })
})

describe('the clock', () => {
  it('has no time while it waits for the first move', () => {
    const g = game(['####', '####'], q('I4'))
    tick(g, 5)
    expect(g.time).toBe(0)
    softDrop(g)
    tick(g, 2)
    expect(g.time).toBeCloseTo(2)
  })

  it('does nothing after the end', () => {
    const g = game(['####'], q('I4'))
    hardDrop(g)
    expect(move(g, 1)).toBe(false)
    expect(hardDrop(g)).toBe(false)
  })
})
