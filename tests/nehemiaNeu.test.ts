/**
 * The arithmetic of the three new games of "Nehemia" (`utils/nehemiaNeu.ts`, Anton's plan of 5.11.2026): the cup (walking after the finger, the floor, the things, the sloshing,
 * spilling, the king, the help never spills), give back the pledge (right, wrong, already given, the help), booths (walking, picking, the thorn bush, enough, a full basket,
 * the roof, the help never makes a mistake); every checker finds broken data, and the real data of the adventure have no problems.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  CUP_PAUSE,
  boothGo,
  boothNext,
  boothProblems,
  boothSimulate,
  boothStart,
  boothStep,
  boothTotal,
  boothWanted,
  cupClear,
  cupHelpPoint,
  cupJerk,
  cupProblems,
  cupShare,
  cupSimulate,
  cupSlosh,
  cupStart,
  cupStep,
  nehDist,
  nehSegDist,
  pledgeBadge,
  pledgeGive,
  pledgeOwner,
  pledgeProblems
} from '@/utils/nehemiaNeu'
import type { BoothEvent, BoothGame, BoothState, CupEvent, CupGame, CupState, PledgeGame, Pt } from '@/utils/nehemiaNeu'
import { nehemia } from '@/data/adventures/nehemia'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const task = (n: number) => nehemia.stages[n - 1]!.task as any

describe('helpers', () => {
  it('distance in units (the height is shortened by the ratio) and the distance from a line piece', () => {
    expect(nehDist({ x: 0, y: 0 }, { x: 3, y: 6 }, 1.5)).toBeCloseTo(5, 6)
    expect(nehDist({ x: 0, y: 0 }, { x: 0, y: 10 }, 2 / 3)).toBeCloseTo(15, 6)
    expect(nehSegDist({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1)).toBeCloseTo(5, 6)
    expect(nehSegDist({ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 1)).toBeCloseTo(10, 6)
  })
})

// ---------------------------------------------------------------- 1. the cup
const CUP: CupGame = {
  background: 'x/saal.webp',
  ratio: 2 / 3,
  floor: { left: 6, right: 94, top: 40, bottom: 97 },
  walker: { image: 'x/n.webp', label: 'Nehemia', w: 17 },
  body: 3,
  cup: { image: 'x/c.webp', label: 'Becher' },
  king: { x: 50, y: 41, r: 8 },
  speed: 18,
  rounds: [
    { hint: 'eins', start: { x: 50, y: 96 }, limit: 3.2, things: [{ image: 'x/k.webp', label: 'Krug', x: 34, y: 80, w: 13, r: 4.5 }], path: [{ x: 50, y: 96 }, { x: 50, y: 42 }] },
    {
      hint: 'zwei',
      start: { x: 20, y: 96 },
      limit: 2.2,
      things: [
        { image: 'x/k.webp', label: 'Krug', x: 30, y: 80, w: 13, r: 4.5 },
        { image: 'x/s.webp', label: 'Säule', x: 70, y: 60, w: 15, r: 5.5 }
      ],
      path: [{ x: 20, y: 96 }, { x: 22, y: 70 }, { x: 49, y: 42 }]
    }
  ]
}
const run = (st: CupState, target: Pt | null, seconds: number, round = CUP.rounds[0]!, dt = 0.05) => {
  const events: CupEvent[] = []
  for (let t = 0; t < seconds; t += dt) {
    const r = cupStep(CUP, round, st, target, dt)
    st = r.state
    events.push(...r.events)
  }
  return { st, events }
}

describe('Der Becher (cup)', () => {
  it('he stands still without a finger and walks after the finger; he stops softly where it is', () => {
    const st0 = cupStart(CUP.rounds[0]!)
    expect(run(st0, null, 1).st.p).toEqual({ x: 50, y: 96 })
    const { st, events } = run(st0, { x: 50, y: 70 }, 5)
    expect(st.p.y).toBeCloseTo(70, 0)
    expect(Math.hypot(st.v.x, st.v.y)).toBeLessThan(0.5)
    expect(events.filter((e) => e.type === 'spill')).toHaveLength(0)
  })

  it('the floor is a box: a finger outside it leads him to its edge', () => {
    const { st } = run(cupStart(CUP.rounds[0]!), { x: 200, y: 96 }, 8)
    expect(st.p.x).toBeLessThanOrEqual(94 + 1e-9)
    expect(st.p.x).toBeGreaterThan(92)
  })

  it('he cannot walk through a thing; a bump at full speed shakes the cup and spills', () => {
    const round = { ...CUP.rounds[0]!, things: [{ image: 'x', label: 'Krug', x: 50, y: 75, w: 13, r: 4.5 }] }
    const { st, events } = run(cupStart(round), { x: 50, y: 42 }, 4, round)
    expect(nehDist(st.p, { x: 50, y: 75 }, 2 / 3)).toBeGreaterThanOrEqual(4.5 + 3 - 1e-6)
    expect(events.some((e) => e.type === 'bump')).toBe(true)
    expect(events.some((e) => e.type === 'spill')).toBe(true)
  })

  it('turning round at full speed spills in round 2; a spill stops him for a moment and calms the wine', () => {
    let st = cupStart(CUP.rounds[1]!)
    st = { ...st, p: { x: 50, y: 70 } }
    const r2 = { ...CUP.rounds[1]!, things: [] }
    let spilled: CupState | null = null
    for (let t = 0; t < 4 && !spilled; t += 0.05) {
      const target = t < 1.2 ? { x: 90, y: 70 } : { x: 7, y: 70 }
      const r = cupStep(CUP, r2, st, target, 0.05)
      st = r.state
      if (r.events.some((e) => e.type === 'spill')) spilled = st
    }
    expect(spilled).not.toBeNull()
    expect(spilled!.pause).toBeCloseTo(CUP_PAUSE, 6)
    expect(cupSlosh(spilled!)).toBe(0)
    const after = cupStep(CUP, r2, spilled!, { x: 7, y: 70 }, 0.05).state
    expect(after.p).toEqual(spilled!.p)
  })

  it('a careless start from standing is forgiven in round 1; turning round is too much in round 2', () => {
    expect(cupJerk(CUP, CUP.rounds[0]!)).toBeLessThan(CUP.rounds[0]!.limit)
    expect(cupJerk(CUP, CUP.rounds[1]!, true)).toBeGreaterThan(CUP.rounds[1]!.limit)
  })

  it('at the king the round is won; the share of the way grows', () => {
    const r = CUP.rounds[0]!
    const st0 = cupStart(r)
    expect(cupShare(CUP, r, st0)).toBe(0)
    const { st, events } = run(st0, { x: 50, y: 41 }, 10)
    expect(st.arrived).toBe(true)
    expect(events.filter((e) => e.type === 'arrived')).toHaveLength(1)
    expect(cupShare(CUP, r, st)).toBe(1)
    expect(cupStep(CUP, r, st, { x: 50, y: 96 }, 0.05).state).toBe(st)
  })

  it('the help goes to the next point of the safe way it can reach straight, and walks every round without a spill', () => {
    const r = CUP.rounds[1]!
    expect(cupClear(CUP, r, r.path[0]!, r.path[1]!)).toBe(true)
    expect(cupHelpPoint(CUP, r, r.start)).toBe(1)
    expect(cupHelpPoint(CUP, r, { x: 22, y: 71 })).toBe(2)
    for (const round of CUP.rounds) {
      const sim = cupSimulate(CUP, round)
      expect(sim.arrived).toBe(true)
      expect(sim.spills).toBe(0)
    }
  })

  it('the checker: the sample and the real data are in order; it finds broken data', () => {
    expect(cupProblems(CUP)).toEqual([])
    expect(cupProblems(task(2).cupCarry)).toEqual([])
    const small = clone(CUP)
    small.walker.w = 8
    expect(cupProblems(small).join()).toMatch(/Nehemiah should be/)
    const blocked = clone(CUP)
    blocked.rounds[0]!.things.push({ image: 'x', label: 'Krug', x: 50, y: 70, w: 13, r: 4.5 })
    expect(cupProblems(blocked).join()).toMatch(/runs into a thing/)
    const close = clone(CUP)
    close.rounds[1]!.things[1] = { ...close.rounds[1]!.things[0]!, x: 40, y: 80 }
    expect(cupProblems(close).join()).toMatch(/too close/)
    const easy = clone(CUP)
    easy.rounds[1]!.limit = 9
    expect(cupProblems(easy).join()).toMatch(/smaller limit|too easy/)
    const strict = clone(CUP)
    strict.rounds[0]!.limit = 1.1
    expect(cupProblems(strict).join()).toMatch(/too strict|should have a smaller limit/)
    const near = clone(CUP)
    near.rounds[0]!.start = { x: 50, y: 50 }
    near.rounds[0]!.path[0] = { x: 50, y: 50 }
    expect(cupProblems(near).join()).toMatch(/too near the king/)
    const one = clone(CUP)
    one.rounds.pop()
    expect(cupProblems(one).join()).toMatch(/fewer than two rounds/)
  })
})

// ---------------------------------------------------------------- 2. give back the pledge
const S = (image: string) => ({ image: `x/${image}.webp`, label: image })
const PLEDGE: PledgeGame = {
  background: 'x/platz.webp',
  ratio: 1.5,
  chest: { ...S('Truhe'), x: 50, y: 99, w: 24 },
  families: [S('Familie A'), S('Familie B'), S('Familie C'), S('Familie D')],
  slips: { acker: S('Der Acker'), weinberg: S('Der Weinberg'), oelgarten: S('Der Ölgarten'), haus: S('Das Haus') },
  slipW: 14,
  familyAspect: 1,
  rounds: [
    {
      hint: 'eins',
      spots: [
        { family: 0, kind: 'acker', x: 20, y: 66, w: 22 },
        { family: 1, kind: 'weinberg', x: 80, y: 66, w: 22 },
        { family: 2, kind: 'haus', x: 50, y: 60, w: 20 }
      ],
      draw: ['haus', 'acker', 'weinberg']
    },
    {
      hint: 'zwei',
      spots: [
        { family: 3, kind: 'oelgarten', x: 13, y: 66, w: 21 },
        { family: 2, kind: 'weinberg', x: 37, y: 60, w: 19 },
        { family: 1, kind: 'haus', x: 63, y: 60, w: 19 },
        { family: 0, kind: 'acker', x: 87, y: 66, w: 21 }
      ],
      draw: ['weinberg', 'acker', 'oelgarten', 'haus']
    }
  ]
}

describe('Pfand zurück (pledges)', () => {
  it('the right family takes the paper, another family is wrong, a family that has its paper says so', () => {
    const r = PLEDGE.rounds[0]!
    expect(pledgeGive(r, [], 'haus', 2)).toBe('right')
    expect(pledgeGive(r, [], 'haus', 0)).toBe('wrong')
    expect(pledgeGive(r, [2], 'acker', 2)).toBe('given')
    expect(pledgeOwner(r, [], 'weinberg')).toBe(1)
    expect(pledgeOwner(r, [1], 'weinberg')).toBe(-1)
  })

  it('the pale paper hangs above the family', () => {
    const s = PLEDGE.rounds[0]!.spots[0]!
    const b = pledgeBadge(PLEDGE, s)
    expect(b.x).toBe(s.x)
    expect(b.y).toBeLessThan(s.y - s.w * 1.5)
    expect(b.y).toBeGreaterThan(0)
  })

  it('the checker: the sample and the real data are in order; it finds broken data', () => {
    expect(pledgeProblems(PLEDGE)).toEqual([])
    expect(pledgeProblems(task(7).pledges)).toEqual([])
    const same = clone(PLEDGE)
    same.rounds[0]!.spots[1]!.kind = 'acker'
    expect(pledgeProblems(same).join()).toMatch(/same kind of paper/)
    const missing = clone(PLEDGE)
    missing.rounds[0]!.draw = ['haus', 'acker']
    expect(pledgeProblems(missing).join()).toMatch(/exactly one paper/)
    const ordered = clone(PLEDGE)
    ordered.rounds[0]!.draw = ['acker', 'weinberg', 'haus']
    expect(pledgeProblems(ordered).join()).toMatch(/too easy/)
    const overlap = clone(PLEDGE)
    overlap.rounds[0]!.spots[1]!.x = 30
    overlap.rounds[0]!.spots[1]!.y = 66
    expect(pledgeProblems(overlap).join()).toMatch(/overlap/)
    const tiny = clone(PLEDGE)
    tiny.slipW = 8
    expect(pledgeProblems(tiny).join()).toMatch(/pledge paper should be/)
    const flat = clone(PLEDGE)
    flat.rounds[1]!.spots.pop()
    flat.rounds[1]!.draw = ['weinberg', 'oelgarten', 'haus']
    expect(pledgeProblems(flat).join()).toMatch(/more families/)
    const high = clone(PLEDGE)
    high.rounds[0]!.spots[0]!.y = 30
    expect(pledgeProblems(high).join()).toMatch(/outside the picture/)
  })
})

// ---------------------------------------------------------------- 3. booths
const BOOTH: BoothGame = {
  background: 'x/hof.webp',
  ratio: 1.5,
  hill: 80,
  road: 91,
  walker: { image: 'x/traeger.webp', label: 'Mann', w: 13 },
  speed: 20,
  stairs: 68,
  house: { left: 64, right: 99, top: 20, bottom: 92 },
  trees: { oel: S('Ölbaum'), myrte: S('Myrte'), palme: S('Palme'), dorn: S('Dornbusch') },
  boughs: { oel: { ...S('Ölzweig'), plural: 'Ölzweige' }, myrte: { ...S('Myrtenzweig'), plural: 'Myrtenzweige' }, palme: { ...S('Palmzweig'), plural: 'Palmzweige' } },
  slots: Array.from({ length: 9 }, (_, i) => ({ x: 72 + i * 2, y: 25, w: 8, rot: 0 })),
  rounds: [
    { hint: 'eins', trees: [{ kind: 'oel', x: 12, w: 18 }, { kind: 'myrte', x: 33, w: 16 }, { kind: 'palme', x: 53, w: 16 }], need: { oel: 2, myrte: 2, palme: 2 }, carry: 3, start: 60 },
    {
      hint: 'zwei',
      trees: [{ kind: 'palme', x: 10, w: 16 }, { kind: 'dorn', x: 27, w: 14 }, { kind: 'oel', x: 41, w: 17 }, { kind: 'myrte', x: 57, w: 15 }],
      need: { oel: 3, myrte: 3, palme: 3 },
      carry: 3,
      start: 62
    }
  ]
}
const walk = (st: BoothState, seconds: number, round = BOOTH.rounds[0]!) => {
  const events: BoothEvent[] = []
  for (let t = 0; t < seconds; t += 0.05) {
    const r = boothStep(BOOTH, round, st, 0.05)
    st = r.state
    events.push(...r.events)
  }
  return { st, events }
}

describe('Laubhütten (booths)', () => {
  it('he walks to a tree at his speed and picks one branch there; at the house the basket goes onto the booth', () => {
    const r = BOOTH.rounds[0]!
    let st = boothGo(boothStart(r), { type: 'tree', tree: 2 })
    let res = walk(st, 0.3)
    expect(res.st.x).toBeLessThan(60)
    expect(res.st.left).toBe(true)
    res = walk(res.st, 2)
    expect(res.st.x).toBe(53)
    expect(res.st.basket).toEqual(['palme'])
    expect(res.events).toContainEqual({ type: 'picked', kind: 'palme' })
    st = boothGo(res.st, { type: 'stairs' })
    res = walk(st, 3)
    expect(res.st.basket).toEqual([])
    expect(res.st.built).toEqual(['palme'])
    expect(res.events).toContainEqual({ type: 'built', n: 1 })
    expect(boothWanted(r, res.st, 'palme')).toBe(1)
  })

  it('the thorn bush and a kind there is enough of are mistakes; a full basket and an empty one are no mistakes', () => {
    const r = BOOTH.rounds[1]!
    let res = walk(boothGo(boothStart(r), { type: 'tree', tree: 1 }), 4, r)
    expect(res.events).toContainEqual({ type: 'thorn' })
    expect(res.st.basket).toEqual([])
    let st: BoothState = { ...res.st, basket: ['palme', 'palme', 'palme'] }
    res = walk(boothGo(st, { type: 'tree', tree: 0 }), 4, r)
    expect(res.events).toContainEqual({ type: 'enough', kind: 'palme' })
    st = { ...res.st, basket: ['oel', 'oel', 'myrte'] }
    res = walk(boothGo(st, { type: 'tree', tree: 3 }), 4, r)
    expect(res.events).toContainEqual({ type: 'full' })
    res = walk(boothGo(boothStart(r), { type: 'stairs' }), 4, r)
    expect(res.events).toContainEqual({ type: 'empty' })
  })

  it('when all branches are on the roof the booth is done; the help never makes a mistake', () => {
    const r = BOOTH.rounds[0]!
    const st: BoothState = { ...boothStart(r), x: 68, built: ['oel', 'oel', 'myrte', 'myrte', 'palme'], basket: ['palme'] }
    const res = walk(boothGo(st, { type: 'stairs' }), 1)
    expect(res.st.done).toBe(true)
    expect(res.events).toContainEqual({ type: 'done' })
    expect(boothTotal(r)).toBe(6)
    expect(boothNext(BOOTH, r, boothStart(r))).toEqual({ type: 'tree', tree: 2 })
    expect(boothNext(BOOTH, r, { ...boothStart(r), basket: ['oel', 'oel', 'oel'] })).toEqual({ type: 'stairs' })
    for (const round of BOOTH.rounds) {
      const sim = boothSimulate(BOOTH, round)
      expect(sim.done).toBe(true)
      expect(sim.mistakes).toBe(0)
    }
  })

  it('the checker: the sample and the real data are in order; it finds broken data', () => {
    expect(boothProblems(BOOTH)).toEqual([])
    expect(boothProblems(task(9).booths)).toEqual([])
    const few = clone(BOOTH)
    few.slots = few.slots.slice(0, 5)
    expect(boothProblems(few).join()).toMatch(/only 5 places/)
    const noPalm = clone(BOOTH)
    noPalm.rounds[0]!.trees = noPalm.rounds[0]!.trees.filter((t) => t.kind !== 'palme')
    expect(boothProblems(noPalm).join()).toMatch(/no tree "palme"/)
    const overlap = clone(BOOTH)
    overlap.rounds[0]!.trees[1]!.x = 15
    expect(boothProblems(overlap).join()).toMatch(/overlap/)
    const roof = clone(BOOTH)
    roof.rounds[0]!.trees[2]!.x = 66
    expect(boothProblems(roof).join()).toMatch(/hillside/)
    const big = clone(BOOTH)
    big.rounds[0]!.carry = 6
    expect(boothProblems(big).join()).toMatch(/basket/)
    const noThorn = clone(BOOTH)
    noThorn.rounds[1]!.trees = noThorn.rounds[1]!.trees.filter((t) => t.kind !== 'dorn')
    expect(boothProblems(noThorn).join()).toMatch(/thorn bush/)
  })
})
