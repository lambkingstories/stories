/**
 * The arithmetic of the three new games of "David" (`utils/davidNeu.ts`, 5.11.2026): load the donkey (the load leans to the heavier side, in round 2 never too far),
 * the gate of Hebron (open exactly when the group stands in front of it) and the festive procession (tap who lights up, play the tunes after them).
 * Sample data here; the real data is checked in `davidData.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import {
  davidNeuStars,
  donkeyAngle,
  donkeyDone,
  donkeyHelp,
  donkeyLean,
  donkeyLeft,
  donkeyLoadProblems,
  donkeyMove,
  donkeyPut,
  donkeySlot,
  donkeySolve,
  donkeyWeightWord,
  festEchoRight,
  festGlowAt,
  festMarchProblems,
  festNeed,
  gateTimeProblems,
  hebronFront,
  hebronLeft,
  hebronTap,
  hebronTooLate,
  hebronWindow
} from '@/utils/davidNeu'
import type { DonkeyLoad, DonkeyLoadGame, FestMarchGame, HebronGateGame } from '@/utils/davidNeu'

// ---------------------------------------------------------------- sample data
const DONKEY: DonkeyLoadGame = {
  background: 'hof.webp',
  ratio: 4 / 3,
  donkey: 'esel.webp',
  donkeyRatio: 0.8,
  donkeyPos: { x: 50, y: 95, w: 36 },
  saddle: 'sattel.webp',
  saddleRatio: 1.34,
  saddlePos: { x: 50, y: 40, w: 56 },
  baskets: [
    { x: 20, y: 64 },
    { x: 80, y: 64 }
  ],
  goods: {
    brot: { image: 'brot.webp', name: 'Brote', weight: 2 },
    krug: { image: 'krug.webp', name: 'Weinkrug', weight: 3 },
    rosinen: { image: 'rosinen.webp', name: 'Rosinenkuchen', weight: 1 },
    feigen: { image: 'feigen.webp', name: 'Feigenkuchen', weight: 2 }
  },
  goodW: 21,
  rounds: [
    { hint: 'Runde 1', goods: ['krug', 'brot', 'feigen', 'rosinen'], places: 3, maxLean: 99 },
    { hint: 'Runde 2', goods: ['krug', 'brot', 'rosinen', 'feigen', 'krug', 'brot', 'rosinen', 'feigen'], places: 4, maxLean: 2 }
  ]
}
const [R1, R2] = DONKEY.rounds as [DonkeyLoadGame['rounds'][0], DonkeyLoadGame['rounds'][0]]

const GATE: HebronGateGame = {
  background: 'stadt.webp',
  ratio: 1.5,
  door: 'tor.webp',
  gate: { x: 70, y: 40, w: 17.5, h: 34 },
  groups: ['s1.webp', 's2.webp', 's3.webp', 's4.webp'],
  groupRatio: 1.2,
  groupW: 20,
  road: { y: 88, from: 0, stop: 83 },
  rounds: [
    {
      hint: 'Runde 1',
      zone: 14,
      grace: 1500,
      gap: 1200,
      tribes: [
        { name: 'Juda', sprite: 0, speed: 10 },
        { name: 'Simeon', sprite: 1, speed: 10 },
        { name: 'Levi', sprite: 2, speed: 10 }
      ]
    },
    {
      hint: 'Runde 2',
      zone: 9,
      grace: 800,
      gap: 1000,
      tribes: [
        { name: 'Issachar', sprite: 1, speed: 12 },
        { name: 'Sebulon', sprite: 2, speed: 17 },
        { name: 'Dan', sprite: 3, speed: 14 }
      ]
    }
  ]
}

const FEST: FestMarchGame = {
  background: 'weg.webp',
  ratio: 4 / 3,
  musicianRatio: 0.5357,
  musicians: [
    { instrument: 'harfe', name: 'Harfe', image: 'h.webp', x: 13, y: 96, w: 19 },
    { instrument: 'pauke', name: 'Pauke', image: 'p.webp', x: 37, y: 96, w: 19 },
    { instrument: 'schellen', name: 'Schellen', image: 's.webp', x: 63, y: 96, w: 19 },
    { instrument: 'zimbeln', name: 'Zimbeln', image: 'z.webp', x: 87, y: 96, w: 19 }
  ],
  rounds: [
    { hint: 'Runde 1', mode: 'glow', order: [0, 2, 1, 3, 2, 0], glowMs: 2600 },
    { hint: 'Runde 2', mode: 'echo', tunes: [[0, 2], [1, 3, 0], [2, 0, 3, 1]], stepMs: 800 }
  ]
}

describe('stars', () => {
  it('up to two mistakes three stars, up to four two, then one', () => {
    expect([0, 2, 3, 4, 5, 9, -1].map(davidNeuStars)).toEqual([3, 3, 2, 2, 1, 1, 3])
  })
})

// ---------------------------------------------------------------- 1. load the donkey
describe('load the donkey', () => {
  it('the lean is right minus left, the saddle turns five degrees per weight, at most sixteen', () => {
    const load: DonkeyLoad = [[0], [1, 3]] // krug 3 | brot 2 + rosinen 1
    expect(donkeyLean(DONKEY, R1, load)).toBe(0)
    expect(donkeyLean(DONKEY, R1, [[1], [0]])).toBe(1)
    expect(donkeyLean(DONKEY, R1, [[0], []])).toBe(-3)
    expect(donkeyAngle(0)).toBe(0)
    expect(donkeyAngle(2)).toBe(10)
    expect(donkeyAngle(-9)).toBe(-16)
    expect(donkeyWeightWord(1)).toBe('light')
    expect(donkeyWeightWord(2)).toBe('middle')
    expect(donkeyWeightWord(3)).toBe('heavy')
  })

  it('putting: ok, full, too much lean (round 2) and already loaded', () => {
    expect(donkeyPut(DONKEY, R1, [[], []], 0, 0)).toBe('ok')
    expect(donkeyPut(DONKEY, R1, [[1, 2, 3], []], 0, 0)).toBe('full')
    expect(donkeyPut(DONKEY, R1, [[0], []], 0, 1)).toBe('loaded')
    // round 2: the wine jar first leans three: it slides back; a raisin cake first is fine, then the jar on the other side leans two: fine
    expect(donkeyPut(DONKEY, R2, [[], []], 0, 0)).toBe('lean')
    expect(donkeyPut(DONKEY, R2, [[], []], 2, 0)).toBe('ok')
    expect(donkeyPut(DONKEY, R2, [[2], []], 0, 1)).toBe('ok')
    expect(donkeyPut(DONKEY, R2, [[2], []], 0, 0)).toBe('lean')
  })

  it('moving and taking out; what is left; done only when everything is in and straight', () => {
    let load: DonkeyLoad = [[], []]
    load = donkeyMove(load, 0, 0)
    load = donkeyMove(load, 1, 1)
    expect(load).toEqual([[0], [1]])
    expect(donkeyLeft(R1, load)).toEqual([2, 3])
    load = donkeyMove(load, 0, 1)
    expect(load).toEqual([[], [1, 0]])
    load = donkeyMove(load, 0, null)
    expect(load).toEqual([[], [1]])
    expect(donkeyDone(DONKEY, R1, [[0, 3], [1, 2]])).toBe(true)
    expect(donkeyDone(DONKEY, R1, [[0, 1], [2, 3]])).toBe(false)
    expect(donkeyDone(DONKEY, R1, [[0], [1, 3]])).toBe(false)
  })

  it('the search finds a way for both rounds that never leans too far, and none from a dead end', () => {
    for (const r of [R1, R2]) {
      const way = donkeySolve(DONKEY, r, [[], []])
      expect(way, r.hint).not.toBeNull()
      let load: DonkeyLoad = [[], []]
      for (const m of way!) {
        expect(donkeyPut(DONKEY, r, load, m.i, m.side)).toBe('ok')
        load = donkeyMove(load, m.i, m.side)
      }
      expect(donkeyDone(DONKEY, r, load)).toBe(true)
    }
    // round 1 with the jar and the bread on one side: the rest cannot make it straight
    expect(donkeySolve(DONKEY, R1, [[0, 1], []])).toBeNull()
  })

  it('the help gives the next move, or what must come out of the heavier side', () => {
    const h = donkeyHelp(DONKEY, R1, [[], []])
    expect(h).not.toBeNull()
    expect(h!.side).not.toBeNull()
    const out = donkeyHelp(DONKEY, R1, [[0, 1], []])
    expect(out).toEqual({ i: 1, side: null })
    expect(donkeyHelp(DONKEY, R1, [[0, 3], [1, 2]])).toBeNull()
    // the help played to the end always finishes (round 2, from a dead end)
    let load: DonkeyLoad = [[2, 6, 1], [3, 7]]
    for (let k = 0; k < 30 && !donkeyDone(DONKEY, R2, load); k++) {
      const m = donkeyHelp(DONKEY, R2, load)!
      if (m.side === null) load = donkeyMove(load, m.i, null)
      else {
        expect(donkeyPut(DONKEY, R2, load, m.i, m.side)).toBe('ok')
        load = donkeyMove(load, m.i, m.side)
      }
    }
    expect(donkeyDone(DONKEY, R2, load)).toBe(true)
  })

  it('the places in a basket: two side by side, then two higher', () => {
    const a = donkeySlot(DONKEY, 0, 0)
    const b = donkeySlot(DONKEY, 0, 1)
    const c = donkeySlot(DONKEY, 0, 2)
    expect(a.x).toBeLessThan(20)
    expect(b.x).toBeGreaterThan(20)
    expect(a.y).toBe(b.y)
    expect(c.y).toBeLessThan(a.y)
    expect(donkeySlot(DONKEY, 1, 0).x).toBeGreaterThan(70)
  })

  it('the checker: the sample has no problem; broken data is found', () => {
    expect(donkeyLoadProblems(DONKEY)).toEqual([])
    expect(donkeyLoadProblems({ ...DONKEY, rounds: [R1] })).toContain('the game needs two rounds')
    expect(donkeyLoadProblems({ ...DONKEY, rounds: [R1, { ...R2, maxLean: 99 }] })).toContain('round 2 must allow less leaning')
    expect(donkeyLoadProblems({ ...DONKEY, rounds: [{ ...R1, goods: ['krug', 'brot', 'feigen'] }, R2] }).join(' ')).toMatch(/cannot be shared equally/)
    expect(donkeyLoadProblems({ ...DONKEY, saddlePos: { x: 50, y: 99, w: 62 } }).join(' ')).toMatch(/saddle/)
    expect(donkeyLoadProblems({ ...DONKEY, goodW: 5 }).join(' ')).toMatch(/too small/)
    expect(donkeyLoadProblems({ ...DONKEY, baskets: [{ x: 80, y: 64 }, { x: 20, y: 64 }] }).join(' ')).toMatch(/left basket/)
    expect(donkeyLoadProblems({ ...DONKEY, rounds: [R1, { ...R2, places: 3 }] }).join(' ')).toMatch(/do not fit/)
  })
})

// ---------------------------------------------------------------- 2. the gate of Hebron
describe('the gate of Hebron', () => {
  const T = GATE.rounds[0]!.tribes[0]!
  const R = GATE.rounds[0]!
  it('the front walks from the left edge at its speed and stops at the gate; then it waits', () => {
    expect(hebronFront(GATE, T, 0)).toEqual({ front: 0, waited: 0 })
    expect(hebronFront(GATE, T, 5000).front).toBeCloseTo(50)
    const at = hebronFront(GATE, T, 9300)
    expect(at.front).toBe(83)
    expect(at.waited).toBeCloseTo(1000)
    expect(hebronLeft(GATE, 50)).toBe(30)
  })

  it('early, right and late; the window of the right moment', () => {
    expect(hebronTap(GATE, R, T, 3000)).toBe('early')
    expect(hebronTap(GATE, R, T, 6800)).toBe('early')
    expect(hebronTap(GATE, R, T, 7000)).toBe('right')
    expect(hebronTap(GATE, R, T, 8300)).toBe('right')
    expect(hebronTap(GATE, R, T, 9700)).toBe('right')
    expect(hebronTap(GATE, R, T, 9900)).toBe('late')
    expect(hebronTooLate(GATE, R, T, 9700)).toBe(false)
    expect(hebronTooLate(GATE, R, T, 9900)).toBe(true)
    const w = hebronWindow(GATE, R, T)
    expect(w.from).toBeCloseTo(6900)
    expect(w.to).toBeCloseTo(9800)
    expect(hebronTap(GATE, R, T, w.from + 1)).toBe('right')
    expect(hebronTap(GATE, R, T, w.to - 1)).toBe('right')
  })

  it('the checker: the sample has no problem; broken data is found', () => {
    expect(gateTimeProblems(GATE)).toEqual([])
    const [a, b] = GATE.rounds as [HebronGateGame['rounds'][0], HebronGateGame['rounds'][0]]
    expect(gateTimeProblems({ ...GATE, rounds: [a, { ...b, zone: 20 }] })).toContain('round 2 must have a narrower zone')
    expect(gateTimeProblems({ ...GATE, rounds: [a, { ...b, tribes: b.tribes.map((t) => ({ ...t, speed: 10 })) }] })).toContain('round 2 must have faster groups')
    expect(gateTimeProblems({ ...GATE, rounds: [a, { ...b, tribes: [...b.tribes, { name: 'Juda', sprite: 0, speed: 12 }] }] })).toContain('a tribe comes twice')
    expect(gateTimeProblems({ ...GATE, road: { ...GATE.road, from: 10 } }).join(' ')).toMatch(/left edge/)
    // a very fast group leaves no time for the right moment
    expect(gateTimeProblems({ ...GATE, rounds: [a, { ...b, grace: 300, tribes: [...b.tribes.slice(0, 2), { name: 'Asser', sprite: 0, speed: 20 }] }] }).join(' ')).toMatch(/shorter than 1.2 seconds/)
    expect(gateTimeProblems({ ...GATE, groups: ['x.webp'] }).join(' ')).toMatch(/two painted groups/)
  })
})

// ---------------------------------------------------------------- 3. the festive procession
describe('the festive procession', () => {
  it('how many taps a round takes', () => {
    expect(festNeed(FEST.rounds[0]!)).toBe(6)
    expect(festNeed(FEST.rounds[1]!)).toBe(9)
  })
  it('who lights up when', () => {
    const q = [0, 2, 1]
    expect(festGlowAt(q, 2000, 0)).toEqual({ musician: 0, step: 0, left: 2000 })
    expect(festGlowAt(q, 2000, 2500)).toEqual({ musician: 2, step: 1, left: 1500 })
    expect(festGlowAt(q, 2000, 6000)).toBeNull()
  })
  it('the echo: the right next note', () => {
    expect(festEchoRight([1, 3, 0], 0, 1)).toBe(true)
    expect(festEchoRight([1, 3, 0], 1, 1)).toBe(false)
    expect(festEchoRight([1, 3, 0], 2, 0)).toBe(true)
  })
  it('the checker: the sample has no problem; broken data is found', () => {
    expect(festMarchProblems(FEST)).toEqual([])
    const [a, b] = FEST.rounds as [FestMarchGame['rounds'][0], FestMarchGame['rounds'][0]]
    expect(festMarchProblems({ ...FEST, rounds: [{ ...a, order: [0, 0, 1, 2, 3, 1] }, b] }).join(' ')).toMatch(/twice in a row/)
    expect(festMarchProblems({ ...FEST, rounds: [{ ...a, order: [0, 1, 0, 1, 0, 1] }, b] }).join(' ')).toMatch(/never lights up/)
    expect(festMarchProblems({ ...FEST, rounds: [a, { ...b, tunes: [[0, 1, 2], [0, 1]] }] }).join(' ')).toMatch(/at least three tunes/)
    expect(festMarchProblems({ ...FEST, rounds: [a, { ...b, tunes: [[0, 1, 2], [0, 1], [2, 3]] }] }).join(' ')).toMatch(/shorter than the one before/)
    expect(festMarchProblems({ ...FEST, musicians: FEST.musicians.slice(0, 3) }).join(' ')).toMatch(/four musicians/)
    expect(festMarchProblems({ ...FEST, musicians: FEST.musicians.map((m, i) => ({ ...m, x: 40 + i * 5 })) }).join(' ')).toMatch(/too close/)
    expect(festMarchProblems({ ...FEST, musicians: FEST.musicians.map((m) => ({ ...m, w: 8 })) }).join(' ')).toMatch(/narrower than 40 pixels/)
  })
})
