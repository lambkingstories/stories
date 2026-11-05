/**
 * The pure parts of the three new games of "Jesus ruft seine Freunde" (`utils/freundeNeu.ts`): the sounding lead (`lot`: the depth under the boat, the deep places, the places of the boat and the line,
 * the arrow keys), the seats (`sitzplaetze`: how far a bench slides, the covered mats, the fewest moves by a breadth-first search, the hint, the mistakes over par), the Twelve (`zwoelf`: the boxes of the figures
 * and the arrow keys between them) and the checks of the data, also those of the real data of the adventure (every `*Problems` of the three games is empty).
 */
import { describe, expect, it, vi } from 'vitest'
import {
  PLUMB_STEP,
  plumbBoatTop,
  plumbBoatX,
  plumbClamp,
  plumbDeepZones,
  plumbDepth,
  plumbFathoms,
  plumbHandX,
  plumbHandY,
  plumbIsDeep,
  plumbKeyStops,
  plumbLeadY,
  plumbProblems,
  plumbTarget,
  seatsBest,
  seatsBlocked,
  seatsCells,
  seatsCovered,
  seatsHint,
  seatsMistakes,
  seatsProblems,
  seatsPush,
  seatsReach,
  seatsSolved,
  seatsTable,
  twelveBox,
  twelveNeighbour,
  twelveProblems
} from '@/utils/freundeNeu'
import type { PlumbGame, SeatsBench, SeatsGame, SeatsMat, SeatsPos, TwelveGame } from '@/utils/freundeNeu'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

// ================================================================ the sounding lead
const PLUMB: PlumbGame = {
  boat: { image: 'boot', label: 'Boot', w: 40, ratio: 1.8, hand: { x: 70, y: 70 }, keel: 88 },
  lead: { image: 'lot', w: 8, ratio: 0.8 },
  line: 'leine',
  rounds: [
    {
      hint: 'Tief genug ist es ab 12.',
      background: 'see',
      ratio: 1.5,
      surface: 30,
      floor: 96,
      scale: 20,
      bottom: [{ x: 0, d: 4 }, { x: 50, d: 8 }, { x: 75, d: 16 }, { x: 100, d: 6 }],
      range: [20, 80],
      start: 24,
      deep: 12
    }
  ]
}
const pr = () => PLUMB.rounds[0]!

describe('Das Lot: the depth, the places, the deep zones', () => {
  it('the depth is a straight line between the points; outside them the first or last depth; the reading is rounded to whole fathoms', () => {
    const b = pr().bottom
    expect(plumbDepth(b, 0)).toBe(4)
    expect(plumbDepth(b, 25)).toBeCloseTo(6, 6)
    expect(plumbDepth(b, 62.5)).toBeCloseTo(12, 6)
    expect(plumbDepth(b, 100)).toBe(6)
    expect(plumbDepth(b, -5)).toBe(4)
    expect(plumbDepth(b, 130)).toBe(6)
    expect(plumbDepth([], 5)).toBe(0)
    expect(plumbFathoms(b, 32)).toBe(7)
  })

  it('the hand of Simon lies at the right of the middle of the boat; the two conversions are inverse; the boat stays in its range', () => {
    expect(plumbHandX(PLUMB.boat, 50)).toBeCloseTo(58, 6)
    expect(plumbBoatX(PLUMB.boat, plumbHandX(PLUMB.boat, 37))).toBeCloseTo(37, 6)
    expect(plumbClamp(pr(), 5)).toBe(20)
    expect(plumbClamp(pr(), 95)).toBe(80)
    expect(plumbClamp(pr(), 41)).toBe(41)
  })

  it('the boat floats on the surface: the height and the top of the boat, the hands above the water, the lead below the surface', () => {
    const top = plumbBoatTop(PLUMB.boat, pr())
    expect(top).toBeCloseTo(30 - 0.88 * (40 / 1.8) * 1.5, 6)
    expect(top).toBeGreaterThanOrEqual(0)
    expect(plumbHandY(PLUMB.boat, pr())).toBeLessThan(pr().surface)
    expect(plumbLeadY(pr(), 0)).toBe(30)
    expect(plumbLeadY(pr(), 20)).toBe(96)
    expect(plumbLeadY(pr(), 10)).toBeCloseTo(63, 6)
  })

  it('the deep stretch of the data: the boat middle from 53 to 78.25, nothing else; "deep" is read in whole fathoms (11.5 and more is 12)', () => {
    const zones = plumbDeepZones(PLUMB, pr())
    expect(zones).toHaveLength(1)
    expect(zones[0]![0]).toBeCloseTo(52.9, 0)
    expect(zones[0]![1]).toBeCloseTo(78.25, 0)
    expect(plumbIsDeep(PLUMB, pr(), 24)).toBe(false)
    expect(plumbIsDeep(PLUMB, pr(), 66)).toBe(true)
    expect(plumbIsDeep(PLUMB, pr(), 80)).toBe(false)
    expect(plumbIsDeep(PLUMB, pr(), 53)).toBe(true)
    expect(plumbIsDeep(PLUMB, pr(), 52)).toBe(false)
  })

  it('"Help me" drives to the middle of the nearest deep stretch; the arrow keys reach it from the start', () => {
    const x = plumbTarget(PLUMB, pr(), 24)!
    expect(plumbIsDeep(PLUMB, pr(), x)).toBe(true)
    expect(x).toBeCloseTo(65.75, 0)
    const stops = plumbKeyStops(pr())
    expect(stops[0]).toBe(20)
    expect(stops[stops.length - 1]).toBe(80)
    expect(stops).toContain(24 + PLUMB_STEP)
    expect(stops.some((s) => plumbIsDeep(PLUMB, pr(), s))).toBe(true)
  })

  it('the checks of the data find the faults: no deep place, one that is too narrow, a start over the deep, a boat outside the picture, a bottom that does not reach', () => {
    expect(plumbProblems(PLUMB)).toEqual([])
    const with1 = (patch: Partial<PlumbGame['rounds'][0]>): PlumbGame => ({ ...PLUMB, rounds: [{ ...pr(), ...patch }] })
    expect(plumbProblems(with1({ deep: 30 })).join(' ')).toMatch(/lies below the picture|no deep place/)
    expect(plumbProblems(with1({ deep: 17 })).join(' ')).toMatch(/no deep place/)
    expect(plumbProblems(with1({ deep: 16 })).join(' ')).toMatch(/narrower/)
    expect(plumbProblems(with1({ start: 66 })).join(' ')).toMatch(/starts over the deep/)
    expect(plumbProblems(with1({ range: [2, 80] })).join(' ')).toMatch(/leaves the picture/)
    expect(plumbProblems(with1({ bottom: [{ x: 30, d: 4 }, { x: 50, d: 8 }, { x: 60, d: 16 }] })).join(' ')).toMatch(/does not reach/)
    expect(plumbProblems(with1({ surface: 3 })).join(' ')).toMatch(/surface must lie/)
    expect(plumbProblems(with1({ bottom: [{ x: 0, d: 4 }, { x: 0, d: 5 }, { x: 100, d: 8 }] })).join(' ')).toMatch(/not from left to right/)
    expect(plumbProblems({ ...PLUMB, rounds: [] })).toContain('no rounds')
    expect(plumbProblems({ ...PLUMB, line: '' })).toContain('no picture of the line')
  })
})

// ================================================================ the seats
const ROWS1 = ['.....', '.....', '.TTTT', '.....', '.....']
const MATS1: SeatsMat[] = [{ r: 1, c: 1 }, { r: 3, c: 3 }]
const B1: SeatsBench[] = [
  { id: 'a', r: 1, c: 3, len: 2, dir: 'h' },
  { id: 'b', r: 3, c: 1, len: 2, dir: 'h' },
  { id: 'c', r: 0, c: 3, len: 2, dir: 'h' },
  { id: 'd', r: 0, c: 0, len: 3, dir: 'v' },
  { id: 'e', r: 4, c: 1, len: 2, dir: 'h' },
  { id: 'f', r: 0, c: 1, len: 2, dir: 'v' }
]
const P1 = (): SeatsPos[] => B1.map((b) => ({ r: b.r, c: b.c }))
const SEATS: SeatsGame = {
  floor: 'boden',
  table: 'tisch',
  bench2: 'bank-2',
  bench3: 'bank-3',
  jar: 'krug',
  basket: 'korb',
  mat: 'matte',
  matRatio: 2.7,
  rounds: [{ hint: 'Schiebe.', rows: ROWS1, mats: MATS1, benches: B1, par: 4 }]
}

describe('Sitzplätze: the benches', () => {
  it('a bench has 2 or 3 cells along its direction; cells outside the room, the table, a jar and a basket are blocked', () => {
    expect(seatsCells({ len: 3, dir: 'v' }, { r: 0, c: 0 })).toEqual([{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }])
    expect(seatsCells({ len: 2, dir: 'h' }, { r: 4, c: 1 })).toEqual([{ r: 4, c: 1 }, { r: 4, c: 2 }])
    expect(seatsBlocked(ROWS1, { r: 2, c: 2 })).toBe(true)
    expect(seatsBlocked(ROWS1, { r: 2, c: 0 })).toBe(false)
    expect(seatsBlocked(ROWS1, { r: -1, c: 0 })).toBe(true)
    expect(seatsBlocked(ROWS1, { r: 0, c: 5 })).toBe(true)
    expect(seatsBlocked(['K.', '.O'], { r: 0, c: 0 })).toBe(true)
  })

  it('a bench slides as far as the room, the table and the other benches allow, in all four directions', () => {
    const p = P1()
    // bench b (row 3, columns 1-2) can go right 2 cells (to columns 3-4), left 1, up 0 (the table above columns 1-2), down 0 (bench e below)
    expect(seatsReach(ROWS1, B1, p, 1, 1)).toBe(2)
    expect(seatsReach(ROWS1, B1, p, 1, 3)).toBe(1)
    expect(seatsReach(ROWS1, B1, p, 1, 0)).toBe(0)
    expect(seatsReach(ROWS1, B1, p, 1, 2)).toBe(0)
    // bench d (rows 0-2 of column 0) can go down 2 (to rows 2-4), not up, not left, right 0 (bench f at column 1)
    expect(seatsReach(ROWS1, B1, p, 3, 2)).toBe(2)
    expect(seatsReach(ROWS1, B1, p, 3, 0)).toBe(0)
    expect(seatsReach(ROWS1, B1, p, 3, 3)).toBe(0)
    expect(seatsReach(ROWS1, B1, p, 3, 1)).toBe(0)
    expect(seatsReach(ROWS1, B1, p, 99, 1)).toBe(0)
  })

  it('pushing moves only that bench and only as far as it can go; too far is no move', () => {
    const p = P1()
    const q = seatsPush(ROWS1, B1, p, 1, 1, 2)
    expect(q[1]).toEqual({ r: 3, c: 3 })
    expect(q[0]).toEqual(p[0])
    expect(p[1]).toEqual({ r: 3, c: 1 })
    expect(seatsPush(ROWS1, B1, p, 1, 1, 3)).toEqual(p)
    expect(seatsPush(ROWS1, B1, p, 1, 1, 0)).toEqual(p)
  })

  it('a mat is covered only when ONE bench lying across lies on both its cells', () => {
    const p = P1()
    expect(seatsCovered(MATS1, B1, p)).toEqual([false, false])
    const q = seatsPush(ROWS1, B1, p, 1, 1, 2)
    expect(seatsCovered(MATS1, B1, q)).toEqual([false, true])
    // an up-and-down bench on one cell of a mat does not count
    const v = p.map((x) => ({ ...x }))
    v[5] = { r: 1, c: 1 }
    expect(seatsCovered(MATS1, B1, v)[0]).toBe(false)
    expect(seatsSolved(MATS1, B1, p)).toBe(false)
  })

  it('the fewest moves of round 1 is 4 (one bench goes any distance in one move); the path really leads to the goal; the hint is its first move', () => {
    const best = seatsBest(ROWS1, MATS1, B1, P1())!
    expect(best.moves).toBe(4)
    let pos = P1()
    for (const m of best.path) {
      const next = seatsPush(ROWS1, B1, pos, m.i, m.dir, m.k)
      expect(next, `move ${JSON.stringify(m)} must be possible`).not.toEqual(pos)
      pos = next
    }
    expect(seatsSolved(MATS1, B1, pos)).toBe(true)
    expect(seatsHint(ROWS1, MATS1, B1, P1())).toEqual(best.path[0])
    expect(seatsBest(ROWS1, MATS1, B1, pos)).toEqual({ moves: 0, path: [] })
    expect(seatsHint(ROWS1, MATS1, B1, pos)).toBeNull()
  })

  it('a puzzle that cannot be solved gives null (a bench that is walled in)', () => {
    const rows = ['.T..', '.TT.', '....']
    const best = seatsBest(rows, [{ r: 2, c: 1 }], [{ id: 'x', r: 0, c: 2, len: 2, dir: 'v' }], [{ r: 0, c: 2 }])
    expect(best === null || best.moves >= 1).toBe(true)
    // a mat that no bench lying across can reach (only an up-and-down bench exists)
    expect(seatsBest(['..', '..'], [{ r: 0, c: 0 }], [{ id: 'x', r: 0, c: 0, len: 2, dir: 'v' }], [{ r: 0, c: 0 }])).toBeNull()
  })

  it('every three moves over the fewest are one mistake', () => {
    expect([4, 5, 6, 7, 8, 9, 10].map((m) => seatsMistakes(m, 4))).toEqual([0, 0, 0, 1, 1, 1, 2])
    expect(seatsMistakes(1, 4)).toBe(0)
  })

  it('the long table is one straight row of cells', () => {
    expect(seatsTable(ROWS1)).toEqual({ r: 2, c: 1, len: 4 })
    expect(seatsTable(['.T.', 'T..'])).toBeNull()
    expect(seatsTable(['...'])).toBeNull()
  })

  it('the checks of the data find the faults', () => {
    expect(seatsProblems(SEATS)).toEqual([])
    const r0 = SEATS.rounds[0]!
    const with1 = (patch: Partial<typeof r0>): SeatsGame => ({ ...SEATS, rounds: [{ ...r0, ...patch }] })
    expect(seatsProblems(with1({ par: 3 })).join(' ')).toMatch(/fewest moves are 4, not 3/)
    expect(seatsProblems(with1({ rows: ['.....', '.....', '.TTT.', '.....', '.....'] })).join(' ')).toMatch(/table must be 4 cells/)
    expect(seatsProblems(with1({ mats: [{ r: 0, c: 0 }, { r: 3, c: 3 }] })).join(' ')).toMatch(/does not lie at the table/)
    expect(seatsProblems(with1({ benches: [...B1, { id: 'a', r: 4, c: 3, len: 2, dir: 'h' }] })).join(' ')).toMatch(/there twice/)
    expect(seatsProblems(with1({ benches: [{ id: 'a', r: 2, c: 1, len: 2, dir: 'h' }] })).join(' ')).toMatch(/stands on a wall/)
    expect(seatsProblems(with1({ benches: B1.map((b) => (b.id === 'e' ? { ...b, r: 3, c: 1 } : b)) })).join(' ')).toMatch(/overlap/)
    expect(seatsProblems(with1({ benches: B1.slice(0, 1) })).join(' ')).toMatch(/fewer benches lying across than mats/)
    expect(seatsProblems(with1({ rows: ['.....', '....', '.TTTT', '.....', '.....'] })).join(' ')).toMatch(/not all equally long/)
    expect(seatsProblems(with1({ rows: ['........', '........', '.TTTT...', '........', '........'] })).join(' ')).toMatch(/more than 7 columns/)
    expect(seatsProblems(with1({ rows: ['.....', '.....', '.TTTX', '.....', '.....'] })).join(' ')).toMatch(/unknown sign/)
    expect(seatsProblems({ ...SEATS, rounds: [] })).toContain('no rounds')
  })
})

// ================================================================ the Twelve
const TWELVE: TwelveGame = {
  background: 'berg',
  ratio: 0.75,
  figure: 200 / 330,
  disciples: [
    { id: 'a', image: 'a', name: 'Andreas', sign: 'der Fischer mit dem Fischkorb' },
    { id: 'b', image: 'b', name: 'Philippus', sign: 'der Mann mit dem Kopftuch' },
    { id: 'c', image: 'c', name: 'Thomas', sign: 'der junge Mann ohne Bart' }
  ],
  rounds: [
    {
      hint: 'Tippe den Freund an.',
      spots: [{ x: 20, y: 60, w: 24 }, { x: 50, y: 60, w: 24 }, { x: 80, y: 95, w: 24 }],
      stand: ['a', 'b', 'c'],
      call: ['b', 'c', 'a']
    }
  ]
}

describe('Die Zwölf: the figures', () => {
  it('the box of a figure stands with its feet on the place: the height follows the picture and the field', () => {
    const b = twelveBox(TWELVE, TWELVE.rounds[0]!.spots[0]!)
    expect(b.x).toBeCloseTo(8, 6)
    expect(b.w).toBe(24)
    expect(b.h).toBeCloseTo((24 / (200 / 330)) * 0.75, 6)
    expect(b.y + b.h).toBeCloseTo(60, 6)
  })

  it('the arrow keys go to the nearest figure in that direction', () => {
    const s = TWELVE.rounds[0]!.spots
    expect(twelveNeighbour(TWELVE, s, 0, 1)).toBe(1)
    expect(twelveNeighbour(TWELVE, s, 1, 1)).toBe(2)
    expect(twelveNeighbour(TWELVE, s, 1, 3)).toBe(0)
    expect(twelveNeighbour(TWELVE, s, 1, 2)).toBe(2)
    expect(twelveNeighbour(TWELVE, s, 2, 0)).toBe(1)
    expect(twelveNeighbour(TWELVE, s, 0, 3)).toBeNull()
    expect(twelveNeighbour(TWELVE, s, 99, 1)).toBeNull()
  })

  it('the checks of the data find the faults', () => {
    expect(twelveProblems(TWELVE)).toEqual([])
    const r0 = TWELVE.rounds[0]!
    const with1 = (patch: Partial<typeof r0>): TwelveGame => ({ ...TWELVE, rounds: [{ ...r0, ...patch }] })
    expect(twelveProblems(with1({ stand: ['a', 'b'] })).join(' ')).toMatch(/3 places but 2 disciples/)
    expect(twelveProblems(with1({ stand: ['a', 'a', 'c'] })).join(' ')).toMatch(/stands twice/)
    expect(twelveProblems(with1({ stand: ['a', 'b', 'z'] })).join(' ')).toMatch(/unknown disciple/)
    expect(twelveProblems(with1({ call: ['b', 'b'] })).join(' ')).toMatch(/called twice/)
    expect(twelveProblems(with1({ call: [] })).join(' ')).toMatch(/nobody is called/)
    expect(twelveProblems(with1({ stand: ['a', 'b', 'c'], call: ['q'] })).join(' ')).toMatch(/does not stand/)
    expect(twelveProblems(with1({ spots: [{ x: 5, y: 60, w: 24 }, { x: 50, y: 60, w: 24 }, { x: 80, y: 95, w: 24 }] })).join(' ')).toMatch(/outside the picture/)
    expect(twelveProblems(with1({ spots: [{ x: 20, y: 60, w: 8 }, { x: 50, y: 60, w: 24 }, { x: 80, y: 95, w: 24 }] })).join(' ')).toMatch(/too small/)
    expect(twelveProblems(with1({ spots: [{ x: 20, y: 60, w: 24 }, { x: 24, y: 62, w: 24 }, { x: 80, y: 95, w: 24 }] })).join(' ')).toMatch(/on top of each other/)
    expect(twelveProblems({ ...TWELVE, disciples: [...TWELVE.disciples, { id: 'd', image: 'd', name: 'Judas', sign: 'der Mann mit dem Kopftuch' }] }).join(' ')).toMatch(/sign .* twice/)
    expect(twelveProblems({ ...TWELVE, disciples: [...TWELVE.disciples, { id: 'a', image: 'x', name: 'X', sign: 'y' }] }).join(' ')).toMatch(/there twice/)
    expect(twelveProblems({ ...TWELVE, rounds: [] })).toContain('no rounds')
  })
})

// ================================================================ the real data of the adventure
describe('Freunde: the data of the three new games', () => {
  it('the stages 2, 7 and 8 have the new kinds with their fields; every *Problems of the real data is empty', async () => {
    const { freunde } = await import('@/data/adventures/freunde')
    const stage = (n: number) => freunde.stages[n - 1]!
    expect(stage(2).task.kind).toBe('lot')
    expect(stage(7).task.kind).toBe('sitzplaetze')
    expect(stage(8).task.kind).toBe('zwoelf')
    const t = (n: number) => stage(n).task as unknown as { plumb?: PlumbGame; seats?: SeatsGame; twelve?: TwelveGame }
    expect(plumbProblems(t(2).plumb!)).toEqual([])
    expect(seatsProblems(t(7).seats!)).toEqual([])
    expect(twelveProblems(t(8).twelve!)).toEqual([])
  })

  it('the lead: two rounds, the second deeper and narrower; the number in the hint is the real deep value; the boat has room above the water; the lead sinks only inside the picture', async () => {
    const { freunde } = await import('@/data/adventures/freunde')
    const g = (freunde.stages[1]!.task as unknown as { plumb: PlumbGame }).plumb
    expect(g.rounds).toHaveLength(2)
    const widths = g.rounds.map((r) => plumbDeepZones(g, r).reduce((n, [a, b]) => n + (b - a), 0))
    expect(widths[1]!).toBeLessThan(widths[0]!)
    expect(g.rounds[1]!.deep).toBeGreaterThan(g.rounds[0]!.deep)
    g.rounds.forEach((r, i) => {
      expect(r.hint, `round ${i + 1}`).toContain(`${r.deep} Klafter`)
      expect(plumbIsDeep(g, r, r.start), `start ${i + 1}`).toBe(false)
      expect(plumbKeyStops(r).some((x) => plumbIsDeep(g, r, x)), `keys ${i + 1}`).toBe(true)
      // a decoy: round 2 has a stretch just under the needed depth (12 and 13 fathoms)
    })
    const decoy = g.rounds[1]!.bottom.filter((p) => p.d === g.rounds[1]!.deep - 1 || p.d === g.rounds[1]!.deep - 2)
    expect(decoy.length).toBeGreaterThanOrEqual(2)
  })

  it('the seats: round 2 has more mats and more benches, a jar and a basket, a longer solution; no mat is covered at the start; the guests picture is there', async () => {
    const { freunde } = await import('@/data/adventures/freunde')
    const g = (freunde.stages[6]!.task as unknown as { seats: SeatsGame }).seats
    expect(g.rounds).toHaveLength(2)
    const [a, b] = g.rounds as [(typeof g.rounds)[0], (typeof g.rounds)[0]]
    expect(b.mats.length).toBeGreaterThan(a.mats.length)
    expect(b.benches.length).toBeGreaterThan(a.benches.length)
    expect(b.par).toBeGreaterThan(a.par)
    expect(b.rows.join('')).toMatch(/K/)
    expect(b.rows.join('')).toMatch(/O/)
    for (const r of g.rounds) expect(seatsCovered(r.mats, r.benches, r.benches.map((x) => ({ r: x.r, c: x.c }))).some(Boolean)).toBe(false)
    expect(g.guests).toMatch(/sitzplaetze\/gaeste\.webp$/)
    expect(g.matRatio).toBeGreaterThan(1)
  })

  it('the Twelve: the names of Mark 3,16-19 and Luke 6,14-16, the four fishermen with their Bible signs, the tax collector, every sign different; round 2 shows all twelve', async () => {
    const { freunde } = await import('@/data/adventures/freunde')
    const g = (freunde.stages[7]!.task as unknown as { twelve: TwelveGame }).twelve
    expect(g.disciples.map((d) => d.name)).toEqual([
      'Simon Petrus',
      'Andreas',
      'Jakobus, Sohn des Zebedäus',
      'Johannes',
      'Philippus',
      'Bartholomäus',
      'Matthäus',
      'Thomas',
      'Jakobus, Sohn des Alphäus',
      'Thaddäus',
      'Simon, der Zelot',
      'Judas Iskariot'
    ])
    expect(new Set(g.disciples.map((d) => d.sign)).size).toBe(12)
    expect(g.disciples.find((d) => d.id === 'matthaeus')!.sign).toMatch(/Zöllner/)
    for (const id of ['simon', 'andreas', 'jakobus-z', 'johannes']) expect(g.disciples.find((d) => d.id === id)!.sign).toMatch(/^der Fischer/)
    expect(g.rounds).toHaveLength(2)
    expect(g.rounds[0]!.stand.length).toBe(6)
    expect(g.rounds[1]!.stand.length).toBe(12)
    expect(new Set(g.rounds[1]!.stand).size).toBe(12)
    expect(g.rounds[1]!.call.length).toBeGreaterThan(g.rounds[0]!.call.length)
    // nothing about the disciples that the Bible does not say: no sign names a trait of character
    expect(g.disciples.map((d) => d.sign).join(' ')).not.toMatch(/mutig|stark|klug|böse|finster|Verräter|Dieb|Geld/i)
  })

  it('the data stay inside the neighbouring games: the first stage keeps its puzzle, the fourth its order game; no old game of these stages is left', async () => {
    const { freunde } = await import('@/data/adventures/freunde')
    expect(freunde.stages.map((s) => s.task.kind)).toEqual(['puzzle', 'lot', 'boote', 'reihenfolge', 'dach', 'quiz', 'sitzplaetze', 'zwoelf', 'quiz'])
    const known = freunde.stages.map((s) => s.task.kind).filter((k) => ['puzzle', 'reihenfolge', 'lueckenvers', 'memory', 'wimmelbild'].includes(k))
    expect(known).toEqual(['puzzle', 'reihenfolge'])
    expect(freunde.stages.map((s) => s.questions.length)).toEqual([2, 2, 2, 2, 2, 3, 2, 2, 3])
  })
})
