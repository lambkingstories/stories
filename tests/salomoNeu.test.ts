/**
 * The arithmetic of the six new games of "Salomo" (`utils/salomoNeu.ts`, Anton's plan of 5.11.2026): the wish cards (cards in the cycle, the heart, the help), the rafts (steering, reefs, cliffs,
 * landing, the help reaches the coast), carving (the grid, the trace, the share, the parts), pomegranates (the pattern, cycling, the check), up the steps (the feet, too fast, too slow, strict) and the treasury
 * (shapes, full compartments, the compartment under a point); every checker finds broken data, and the real data of the adventure have no problems.
 */
import { describe, expect, it } from 'vitest'
import {
  carveCells,
  carveNear,
  carveNext,
  carveParts,
  carveShare,
  carveTrace,
  carvingProblems,
  pomCheck,
  pomCycle,
  pomKinds,
  pomOpen,
  pomPattern,
  pomegranatesProblems,
  raftSimulate,
  raftSlot,
  raftStart,
  raftStep,
  raftsProblems,
  stairsPlace,
  stairsProblems,
  stairsStart,
  stairsTap,
  treasureDrop,
  treasureHint,
  treasureSlotAt,
  treasuryProblems,
  wishCardsProblems,
  wishCross,
  wishHint,
  wishShown,
  wishTap
} from '@/utils/salomoNeu'
import type { CarveGame, CarvePattern, PomGame, RaftGame, StairsGame, TreasuryGame, WishGame } from '@/utils/salomoNeu'
import { salomo } from '@/data/adventures/salomo'

const S = (image: string, w = 15) => ({ image: `x/${image}.webp`, label: image, w })
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T
const task = (id: number) => salomo.stages.find((s) => s.id === id)!.task as unknown as Record<string, unknown>

// ---------------------------------------------------------------- 1. the wish cards
const WISH: WishGame = {
  background: 'x/nacht.webp',
  cards: { heart: S('Herz'), riches: S('Reichtum'), life: S('Leben'), victory: S('Sieg') },
  cardW: 15,
  rounds: [
    { hint: 'eins', speed: 8, period: 12, need: 3, cards: [{ kind: 'heart', lane: 50, at: 0 }, { kind: 'riches', lane: 17, at: 3 }, { kind: 'life', lane: 83, at: 6 }, { kind: 'victory', lane: 50, at: 9 }] },
    { hint: 'zwei', speed: 12, period: 10, need: 4, cards: [{ kind: 'riches', lane: 50, at: 0 }, { kind: 'heart', lane: 17, at: 1.5 }, { kind: 'victory', lane: 83, at: 2.5 }, { kind: 'life', lane: 50, at: 3.2 }] }
  ]
}

describe('the wish cards', () => {
  it('the cards come in at the right, cross to the left and come again every cycle', () => {
    const r = WISH.rounds[0]!
    expect(wishCross(WISH, r)).toBeCloseTo(115 / 8)
    const at0 = wishShown(WISH, r, 0)
    expect(at0).toHaveLength(1)
    expect(at0[0]!.x).toBeCloseTo(107.5)
    const at5 = wishShown(WISH, r, 5)
    expect(at5.map((s) => s.kind).sort()).toEqual(['heart', 'riches'])
    expect(at5.find((s) => s.kind === 'heart')!.x).toBeCloseTo(107.5 - 40)
    // in the second cycle the heart comes again with a new key
    const at13 = wishShown(WISH, r, 13).filter((s) => s.kind === 'heart')
    expect(at13.map((s) => s.key).sort()).toEqual(['0:0', '0:1'])
    expect(wishShown(WISH, r, 13, new Set(['0:0'])).filter((s) => s.kind === 'heart')).toHaveLength(1)
  })
  it('only the heart is caught; the help shows the heart nearest to the middle', () => {
    expect(wishTap('heart')).toBe('catch')
    expect(wishTap('riches')).toBe('wrong')
    expect(wishTap('life')).toBe('wrong')
    expect(wishTap('victory')).toBe('wrong')
    const shown = wishShown(WISH, WISH.rounds[0]!, 16)
    expect(wishHint(shown)!.kind).toBe('heart')
    expect(wishHint(shown.filter((s) => s.kind !== 'heart'))).toBeNull()
  })
  it('the checker finds overlapping cards, missing wishes, a slow round 2 and cards outside the field', () => {
    expect(wishCardsProblems(WISH)).toEqual([])
    const a = clone(WISH)
    a.rounds[0]!.cards.push({ kind: 'riches', lane: 50, at: 1 })
    expect(wishCardsProblems(a).join()).toContain('overlap')
    const b = clone(WISH)
    b.rounds[1]!.speed = 7
    expect(wishCardsProblems(b).join()).toContain('faster')
    const c = clone(WISH)
    c.rounds[0]!.cards = c.rounds[0]!.cards.filter((x) => x.kind !== 'victory')
    expect(wishCardsProblems(c).join()).toContain('other three wishes')
    const d = clone(WISH)
    d.rounds[0]!.cards[1]!.lane = 5
    expect(wishCardsProblems(d).join()).toContain('sticks out')
    const e = clone(WISH)
    e.rounds[0]!.cards = e.rounds[0]!.cards.filter((x) => x.kind !== 'heart')
    expect(wishCardsProblems(e).join()).toContain('no heart')
  })
})

// ---------------------------------------------------------------- 2. the rafts
const RAFT: RaftGame = {
  background: 'x/meer.webp',
  trunk: { ...S('Stamm', 16), thick: 2.7 },
  rope: S('Seil', 2),
  reefs: [S('Riff', 10), S('Riff', 10)],
  coast: 88,
  rounds: [
    { hint: 'eins', loose: [{ x: 20, y: 22 }, { x: 22, y: 50 }, { x: 19, y: 78 }], start: { x: 20, y: 50 }, speed: 7, turn: 75, landing: { top: 32, bottom: 58 }, reefs: [{ x: 50, y: 20, r: 4.5, kind: 0 }], route: [{ x: 50, y: 45 }] },
    { hint: 'zwei', loose: [{ x: 19, y: 14 }, { x: 22, y: 36 }, { x: 19, y: 58 }, { x: 22, y: 80 }], start: { x: 20, y: 50 }, speed: 8, turn: 70, drift: { x: 0, y: 2 }, landing: { top: 34, bottom: 56 }, reefs: [{ x: 50, y: 20, r: 4.5, kind: 0 }, { x: 55, y: 80, r: 4.5, kind: 1 }], route: [{ x: 50, y: 42 }, { x: 80, y: 40 }] }
  ]
}

describe('the rafts', () => {
  it('the bound trunks lie one under the other around the start', () => {
    const r = RAFT.rounds[0]!
    expect(raftSlot(RAFT, r, 1)).toEqual({ x: 20, y: 50 })
    expect(raftSlot(RAFT, r, 0).y).toBeCloseTo(50 - 2.7 * 1.5)
  })
  it('the raft sails to the right, turns to its target and no faster than `turn`', () => {
    const r = RAFT.rounds[0]!
    let st = raftStart(r)
    st = raftStep(RAFT, r, st, 1).state
    expect(st.x).toBeCloseTo(27)
    st = { ...st, target: { x: 40, y: 10 } }
    const s2 = raftStep(RAFT, r, st, 0.1).state
    expect(s2.heading).toBeCloseTo((-75 * Math.PI) / 180 / 10)
    expect(s2.y).toBeLessThan(st.y)
  })
  it('a reef pushes the raft back and is an event; a cliff too; the landing place ends the round', () => {
    const r = RAFT.rounds[0]!
    const hit = raftStep(RAFT, r, { x: 40, y: 20, heading: 0, target: null, pause: 0, arrived: false }, 0.05)
    expect(hit.events).toEqual([{ type: 'reef', index: 0 }])
    expect(hit.state.x).toBeLessThan(40)
    expect(hit.state.pause).toBeGreaterThan(0)
    expect(raftStep(RAFT, r, hit.state, 0.05).state.x).toBe(hit.state.x) // it waits
    const cliff = raftStep(RAFT, r, { x: 81.5, y: 15, heading: 0, target: null, pause: 0, arrived: false }, 0.1)
    expect(cliff.events).toEqual([{ type: 'cliff' }])
    const land = raftStep(RAFT, r, { x: 81.5, y: 45, heading: 0, target: null, pause: 0, arrived: false }, 0.1)
    expect(land.events).toEqual([{ type: 'arrived' }])
    expect(land.state.arrived).toBe(true)
  })
  it('the help sails both rounds to the landing place without a bump; the checker finds a reef in the way', () => {
    for (const r of RAFT.rounds) expect(raftSimulate(RAFT, r)).toMatchObject({ arrived: true, bumps: 0 })
    expect(raftsProblems(RAFT)).toEqual([])
    const a = clone(RAFT)
    a.rounds[0]!.reefs.push({ x: 50, y: 45, r: 5, kind: 0 })
    expect(raftsProblems(a).join()).toContain('help')
    const b = clone(RAFT)
    b.rounds[1]!.reefs = [b.rounds[1]!.reefs[0]!]
    expect(raftsProblems(b).join()).toContain('more reefs')
    const c = clone(RAFT)
    c.rounds[0]!.loose[1]!.y = 30
    expect(raftsProblems(c).join()).toContain('lie on each other')
  })
})

// ---------------------------------------------------------------- 3. carving
const ring = (): string[] => {
  const n = 20
  const rows: string[] = []
  for (let y = 0; y < n; y++) {
    let r = ''
    for (let x = 0; x < n; x++) r += Math.abs(Math.hypot(x + 0.5 - 10, y + 0.5 - 10) - 6) < 0.6 ? '#' : '.'
    rows.push(r)
  }
  return rows
}
const PAT: CarvePattern = { image: 'x/ring.webp', label: 'Ring', rows: ring() }
const CARVE: CarveGame = {
  patterns: [PAT, PAT],
  tool: S('Eisen', 14),
  dust: 'x/staub.webp',
  brush: 1.6,
  rounds: [
    { hint: 'eins', patterns: [0], need: 0.8, slip: 3 },
    { hint: 'zwei', patterns: [1], need: 0.85, slip: 2.4 }
  ]
}

describe('carving', () => {
  it('the grid, the distance to the line, a trace and the share', () => {
    const { size, cells } = carveCells(PAT)
    expect(size).toBe(20)
    expect(cells.length).toBeGreaterThan(30)
    expect(carveNear(PAT, 10, 4)).toBeLessThan(1)
    expect(carveNear(PAT, 10, 10)).toBeGreaterThan(5)
    const got = carveTrace(PAT, { x: 4, y: 10 }, { x: 10, y: 4 }, 1.6)
    expect(got.length).toBeGreaterThan(2)
    const share = carveShare(PAT, new Set(got))
    expect(share).toBeGreaterThan(0)
    expect(share).toBeLessThan(0.5)
    expect(carveShare(PAT, new Set(cells))).toBe(1)
    // a trace far from the line takes nothing
    expect(carveTrace(PAT, { x: 10, y: 10 }, { x: 10.5, y: 10.5 }, 1.6)).toEqual([])
  })
  it('the help finds the next cell that is not done; the ring is one piece', () => {
    const { cells } = carveCells(PAT)
    expect(carveNext(PAT, new Set(cells))).toBeNull()
    expect(carveNext(PAT, new Set())).not.toBeNull()
    expect(carveParts(PAT)).toHaveLength(1)
  })
  it('the checker finds a broken grid, a line at the edge, too many pieces and a round 2 that is not stricter', () => {
    expect(carvingProblems(CARVE)).toEqual([])
    const a = clone(CARVE)
    a.patterns[0]!.rows[0] = '#' + a.patterns[0]!.rows[0]!.slice(1)
    expect(carvingProblems(a).join()).toContain('edge')
    const b = clone(CARVE)
    b.patterns[1]!.rows = b.patterns[1]!.rows.map((r, y) => (y % 2 ? r : r.replace(/#/g, '.')))
    expect(carvingProblems(b).join()).toMatch(/pieces|too short/)
    const c = clone(CARVE)
    c.rounds[1]!.slip = 3
    c.rounds[1]!.need = 0.8
    expect(carvingProblems(c).join()).toContain('stricter')
    const d = clone(CARVE)
    d.patterns[0]!.rows = d.patterns[0]!.rows.slice(1)
    expect(carvingProblems(d).join()).toContain('square')
  })
})

// ---------------------------------------------------------------- 4. pomegranates
const POM: PomGame = {
  background: 'x/saeule.webp',
  items: { granat: S('Granatapfel', 13), lilie: S('Lilie', 13), kette: S('Kettenglied', 13) },
  hook: S('Haken', 5),
  x0: 11,
  x1: 89,
  slotW: 13,
  rounds: [
    { hint: 'eins', rows: [{ y: 42, motif: ['granat', 'lilie'], length: 6, given: [0, 1, 2] }] },
    {
      hint: 'zwei',
      rows: [
        { y: 20, motif: ['granat', 'granat', 'lilie'], length: 6, given: [0, 1, 2] },
        { y: 58, motif: ['lilie', 'kette', 'granat'], length: 6, given: [0, 1, 2] }
      ]
    }
  ]
}

describe('pomegranates', () => {
  it('the pattern repeats; the open hooks; a tap goes through the kinds of the round and back to empty', () => {
    expect(pomPattern(POM.rounds[0]!.rows[0]!)).toEqual(['granat', 'lilie', 'granat', 'lilie', 'granat', 'lilie'])
    expect(pomOpen(POM.rounds[0]!)).toEqual([[0, 3], [0, 4], [0, 5]])
    expect(pomKinds(POM.rounds[0]!)).toEqual(['granat', 'lilie'])
    const r = POM.rounds[0]!
    expect(pomCycle(r, null)).toBe('granat')
    expect(pomCycle(r, 'granat')).toBe('lilie')
    expect(pomCycle(r, 'lilie')).toBeNull()
    expect(pomCycle(POM.rounds[1]!, 'lilie')).toBe('kette')
  })
  it('the check: right, wrong and empty hooks', () => {
    const r = POM.rounds[0]!
    const res = pomCheck(r, [['granat', 'lilie', 'granat', 'lilie', 'lilie', null]])
    expect(res[0]).toEqual([true, true, true, true, false, false])
  })
  it('the checker finds a hidden pattern, hooks too close, rows on each other and an easier round 2', () => {
    expect(pomegranatesProblems(POM)).toEqual([])
    const a = clone(POM)
    a.rounds[1]!.rows[0]!.given = [0, 1, 3]
    expect(pomegranatesProblems(a).join()).toContain('cannot be seen')
    const b = clone(POM)
    b.rounds[0]!.rows[0]!.length = 9
    expect(pomegranatesProblems(b).join()).toContain('too close')
    const c = clone(POM)
    c.rounds[1]!.rows[1]!.y = 30
    expect(pomegranatesProblems(c).join()).toContain('on each other')
    const d = clone(POM)
    d.rounds[1] = clone(d.rounds[0]!)
    expect(pomegranatesProblems(d).join()).toContain('more hooks')
  })
})

// ---------------------------------------------------------------- 5. up the steps
const STAIRS: StairsGame = {
  background: 'x/treppe.webp',
  ratio: 0.75,
  group: S('Priester', 50),
  bottom: 99,
  top: 46,
  topScale: 0.45,
  rounds: [
    { hint: 'eins', steps: 10, min: 0.35, max: 2.5 },
    { hint: 'zwei', steps: 14, min: 0.4, max: 1.3, strict: true }
  ]
}

describe('up the steps', () => {
  it('the first tap is a step with either foot; then the other foot, not too quick', () => {
    const r = STAIRS.rounds[0]!
    let res = stairsTap(r, stairsStart(), 'right', 1000)
    expect(res.verdict).toBe('step')
    expect(res.state).toEqual({ done: 1, next: 'left', last: 1000 })
    expect(stairsTap(r, res.state, 'right', 1600).verdict).toBe('wrong-foot')
    expect(stairsTap(r, res.state, 'left', 1200).verdict).toBe('too-fast')
    res = stairsTap(r, res.state, 'left', 1600)
    expect(res.verdict).toBe('step')
    expect(res.state.done).toBe(2)
    // slow in round 1: they begin again (a step, no mistake); in round 2 a mistake
    const slow = stairsTap(r, res.state, 'right', 6000)
    expect(slow.verdict).toBe('restart')
    expect(slow.state.done).toBe(3)
    const strict = stairsTap(STAIRS.rounds[1]!, res.state, 'right', 6000)
    expect(strict.verdict).toBe('too-slow')
    expect(strict.state.done).toBe(2)
  })
  it('the priests go up and grow smaller', () => {
    expect(stairsPlace(STAIRS, 0, 10)).toEqual({ y: 99, scale: 1 })
    const top = stairsPlace(STAIRS, 10, 10)
    expect(top.y).toBeCloseTo(46)
    expect(top.scale).toBeCloseTo(0.45)
  })
  it('the checker finds a short round, a round 2 that is not strict and tiny priests', () => {
    expect(stairsProblems(STAIRS)).toEqual([])
    const a = clone(STAIRS)
    a.rounds[1]!.strict = false
    expect(stairsProblems(a).join()).toContain('strict')
    const b = clone(STAIRS)
    b.rounds[0]!.steps = 3
    expect(stairsProblems(b).join()).toContain('six steps')
    const c = clone(STAIRS)
    c.topScale = 0.2
    expect(stairsProblems(c).join()).toMatch(/too small|between 0.3/)
  })
})

// ---------------------------------------------------------------- 6. the treasury
const TREASURY: TreasuryGame = {
  background: 'x/kammer.webp',
  camel: { ...S('Kamel', 36), x: 80, y: 98 },
  board: [{ x: 79, y: 49 }, { x: 90.5, y: 49 }, { x: 84.7, y: 35 }],
  items: { sack: S('Gewürze', 12), barren: S('Gold', 12), stein: S('Edelstein', 12) },
  niches: { sack: S('Fach Gewürze', 15), barren: S('Fach Gold', 15), stein: S('Fach Edelsteine', 15) },
  rounds: [
    { hint: 'eins', slots: [{ shape: 'sack', x: 22, y: 32 }, { shape: 'barren', x: 38, y: 32 }, { shape: 'stein', x: 54, y: 32 }], camels: [['sack', 'barren', 'stein']] },
    {
      hint: 'zwei',
      slots: [
        { shape: 'barren', x: 22, y: 20 },
        { shape: 'stein', x: 38, y: 20 },
        { shape: 'sack', x: 54, y: 20 },
        { shape: 'sack', x: 22, y: 46 },
        { shape: 'barren', x: 38, y: 46 },
        { shape: 'stein', x: 54, y: 46 }
      ],
      camels: [['stein', 'sack', 'barren'], ['barren', 'stein', 'sack']]
    }
  ]
}

describe('the treasury', () => {
  it('a gift fits only into the empty compartment of its shape', () => {
    const r = TREASURY.rounds[0]!
    expect(treasureDrop(r, [false, false, false], 'sack', 0)).toBe('stored')
    expect(treasureDrop(r, [false, false, false], 'sack', 1)).toBe('wrong-shape')
    expect(treasureDrop(r, [true, false, false], 'sack', 0)).toBe('full')
    expect(treasureDrop(r, [false, false, false], 'sack', null)).toBe('none')
    expect(treasureHint(r, [false, false, false], 'stein')).toBe(2)
    expect(treasureHint(r, [false, false, true], 'stein')).toBeNull()
  })
  it('the compartment under a point', () => {
    const r = TREASURY.rounds[0]!
    expect(treasureSlotAt(TREASURY, r, { x: 38, y: 34 })).toBe(1)
    expect(treasureSlotAt(TREASURY, r, { x: 38, y: 60 })).toBeNull()
  })
  it('the checker finds too few compartments, compartments on each other and on the camel', () => {
    expect(treasuryProblems(TREASURY)).toEqual([])
    const a = clone(TREASURY)
    a.rounds[0]!.slots.pop()
    expect(treasuryProblems(a).join()).toContain('compartments')
    const b = clone(TREASURY)
    b.rounds[1]!.slots[1]!.x = 26
    expect(treasuryProblems(b).join()).toContain('overlap')
    const c = clone(TREASURY)
    c.rounds[0]!.slots[2] = { shape: 'stein', x: 75, y: 70 }
    expect(treasuryProblems(c).join()).toContain('camel')
  })
})

// ---------------------------------------------------------------- the real data
describe('the real data of the adventure', () => {
  it('every new game of the adventure has no problems', () => {
    expect(wishCardsProblems(task(2).wishCards as WishGame)).toEqual([])
    expect(raftsProblems(task(5).rafts as RaftGame)).toEqual([])
    expect(carvingProblems(task(7).carving as CarveGame)).toEqual([])
    expect(pomegranatesProblems(task(8).pomegranates as PomGame)).toEqual([])
    expect(stairsProblems(task(9).stairs as StairsGame)).toEqual([])
    expect(treasuryProblems(task(11).treasury as TreasuryGame)).toEqual([])
  })
})
