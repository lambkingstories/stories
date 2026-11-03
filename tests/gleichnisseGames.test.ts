/**
 * The pure parts of the three new games of "Geschichten von Jesus" (`utils/gleichnisseGames.ts`): "Dig for the treasure" (`graben`), "Sweep for the coin" (`muenze`) and "Meet the son" (`entgegen`).
 * Nothing here uses a clock or dice: the arithmetic of the places, the stars and the data checks.
 */
import { describe, expect, it } from 'vitest'
import {
  COIN_PARTS,
  COIN_REVEAL,
  COIN_SWEEP_PARTS,
  DIG_CELLS,
  DIG_PEARLS,
  MEET_GIFTS,
  coinProblems,
  coinRegion,
  coinRevealed,
  coinRoundProblems,
  coinStars,
  coinSweepParts,
  digArrow,
  digArrowTurn,
  digDirection,
  digIndex,
  digJudge,
  digProblems,
  digRoundProblems,
  gleichnisStars,
  meetArrived,
  meetEmbraceX,
  meetFatherX,
  meetGive,
  meetNext,
  meetOutfit,
  meetProblems,
  meetTap,
  pearlJudge,
  pearlOrder
} from '@/utils/gleichnisseGames'
import { COLS, ROWS, makeGrid, wipeAt } from '@/utils/wipe'
import { gleichnisse } from '@/data/adventures/gleichnisse'
import type { CoinGame, DigGame, DigRound, MeetGame } from '@/types/adventure'

const CELLS: [number, number][] = [
  [18, 28], [40, 28], [62, 28], [84, 28],
  [18, 55], [40, 55], [62, 55], [84, 55],
  [18, 82], [40, 82], [62, 82], [84, 82]
]

describe('stars of dig and coin', () => {
  it('two rounds: up to two mistakes three stars, up to five two stars, then one', () => {
    expect([0, 1, 2].map((m) => gleichnisStars(m, 2))).toEqual([3, 3, 3])
    expect([3, 4, 5].map((m) => gleichnisStars(m, 2))).toEqual([2, 2, 2])
    expect([6, 9].map((m) => gleichnisStars(m, 2))).toEqual([1, 1])
  })
  it('a game without rounds counts as one round', () => {
    expect(gleichnisStars(0, 0)).toBe(3)
  })
  it('the help glimmer of the coin game takes the third star, and nothing else', () => {
    expect(coinStars(0, 2, false)).toBe(3)
    expect(coinStars(0, 2, true)).toBe(2)
    expect(coinStars(4, 2, true)).toBe(2)
    expect(coinStars(7, 2, true)).toBe(1)
    expect(coinStars(7, 2, false)).toBe(1)
  })
})

describe('dig: the arrow in the hole', () => {
  it('points in one of eight directions, rounded; the picture is wider than high', () => {
    const o = { x: 50, y: 50 }
    expect(digDirection(o, { x: 70, y: 50 })).toBe(0)
    expect(digDirection(o, { x: 70, y: 30 })).toBe(1)
    expect(digDirection(o, { x: 50, y: 20 })).toBe(2)
    expect(digDirection(o, { x: 30, y: 30 })).toBe(3)
    expect(digDirection(o, { x: 30, y: 50 })).toBe(4)
    expect(digDirection(o, { x: 30, y: 80 })).toBe(5)
    expect(digDirection(o, { x: 50, y: 80 })).toBe(6)
    expect(digDirection(o, { x: 70, y: 80 })).toBe(7)
    expect(digDirection(o, o)).toBe(0)
  })

  it('the arrow turns clockwise on the screen by minus 45 degrees for each step anticlockwise', () => {
    expect([0, 1, 2, 4, 6].map((d) => digArrowTurn(d as 0 | 1 | 2 | 4 | 6))).toEqual([-0, -45, -90, -180, -270])
  })

  it('the arrow of a hole points to the mound over the chest, whichever mound is dug', () => {
    const t = digIndex(2, 1)
    expect(t).toBe(6)
    // the mound left of the chest: east
    expect(digArrow(5, t, CELLS)).toBe(0)
    // the mound right of it: west
    expect(digArrow(7, t, CELLS)).toBe(4)
    // above it: south, below it: north
    expect(digArrow(2, t, CELLS)).toBe(6)
    expect(digArrow(10, t, CELLS)).toBe(2)
    // from the far corners: the picture is wide, so the arrow of a corner on the left lies flat (east), on the right it slants (south-west, north-west)
    expect(digArrow(0, t, CELLS)).toBe(0)
    expect(digArrow(8, t, CELLS)).toBe(0)
    expect(digArrow(3, t, CELLS)).toBe(5)
    expect(digArrow(11, t, CELLS)).toBe(3)
  })

  it('following the arrows always leads to the chest: from every hole one step in its direction gets closer', () => {
    const t = digIndex(1, 2)
    for (let i = 0; i < DIG_CELLS; i++) {
      if (i === t) continue
      const a = CELLS[i]!
      const b = CELLS[t]!
      const dir = digArrow(i, t, CELLS)
      const rad = (dir * 45 * Math.PI) / 180
      const step = { x: a[0] + Math.cos(rad) * 5, y: a[1] - Math.sin(rad) * 5 * 1.5 }
      expect(Math.hypot(step.x - b[0], (step.y - b[1]) * (2 / 3)), `from mound ${i}`).toBeLessThan(Math.hypot(a[0] - b[0], (a[1] - b[1]) * (2 / 3)))
    }
  })
})

describe('dig: a tap on a mound, a tap on a pearl', () => {
  it('the chest is found, an empty hole is a hole, and a mound that is dug already does nothing', () => {
    const dug = Array.from({ length: DIG_CELLS }, () => false)
    expect(digJudge(6, 6, dug)).toBe('found')
    expect(digJudge(2, 6, dug)).toBe('hole')
    dug[2] = true
    expect(digJudge(2, 6, dug)).toBe('again')
    expect(digIndex(0, 0)).toBe(0)
    expect(digIndex(3, 2)).toBe(11)
  })

  it('the best pearl lies at its place, the four others fill the other places in their order', () => {
    expect(pearlOrder(0)).toEqual([0, 1, 2, 3, 4])
    expect(pearlOrder(2)).toEqual([1, 2, 0, 3, 4])
    expect(pearlOrder(4)).toEqual([1, 2, 3, 4, 0])
    for (let b = 0; b < DIG_PEARLS; b++) {
      const o = pearlOrder(b)
      expect(o[b]).toBe(0)
      expect([...o].sort()).toEqual([0, 1, 2, 3, 4])
    }
    expect(pearlOrder(9)).toEqual(pearlOrder(4))
    expect(pearlOrder(-3)).toEqual(pearlOrder(0))
  })

  it('only the most precious pearl is right', () => {
    expect(pearlJudge(2, 2)).toBe('right')
    expect([0, 1, 3, 4].map((s) => pearlJudge(s, 2))).toEqual(['wrong', 'wrong', 'wrong', 'wrong'])
  })
})

describe('dig: the data of a round', () => {
  const field: DigRound = { kind: 'field', hint: 'x', treasure: [2, 1], cells: CELLS }
  const pearls: DigRound = { kind: 'pearls', hint: 'x', best: 2, slots: [[14, 62], [32, 62], [50, 62], [68, 62], [86, 62]] }

  it('a good field and a good table have no problems', () => {
    expect(digRoundProblems(field, { w: 14 })).toEqual([])
    expect(digRoundProblems(pearls, { w: 14 })).toEqual([])
  })

  it('finds mounds that overlap, leave the picture, are too few, and a chest outside the grid', () => {
    const near: [number, number][] = CELLS.map((c, i) => (i === 1 ? [CELLS[0]![0] + 5, CELLS[0]![1]] : c))
    expect(digRoundProblems({ ...field, cells: near }, { w: 14 }).join(' ')).toMatch(/overlap/)
    expect(digRoundProblems({ ...field, cells: CELLS.slice(0, 11) }, { w: 14 }).join(' ')).toMatch(/12 mounds/)
    expect(digRoundProblems({ ...field, cells: CELLS.map((c, i) => (i === 3 ? [99, c[1]] : c)) }, { w: 14 }).join(' ')).toMatch(/outside the picture/)
    expect(digRoundProblems({ ...field, treasure: [4, 0] }, { w: 14 }).join(' ')).toMatch(/outside the 4 x 3 grid/)
    expect(digRoundProblems({ ...field, treasure: undefined }, { w: 14 }).join(' ')).toMatch(/no treasure/)
  })

  it('finds a table with the wrong number of places and a best pearl without a place', () => {
    expect(digRoundProblems({ ...pearls, slots: [[1, 1]] }, { w: 14 }).join(' ')).toMatch(/5 places/)
    expect(digRoundProblems({ ...pearls, best: 5 }, { w: 14 }).join(' ')).toMatch(/place from 0 to 4/)
  })

  it('the whole game needs five pearls', () => {
    const g: DigGame = gleichnisse.stages[3]!.task.dig!
    expect(digProblems(g)).toEqual([])
    expect(digProblems({ ...g, pearls: g.pearls.slice(0, 4) }).join(' ')).toMatch(/5 pearls/)
  })
})

describe('coin: the dust, the broom and the glint', () => {
  it('the place of the coin is a little bigger than the coin and never smaller than about two cells', () => {
    const r = coinRegion([50, 50], 6)
    expect(r.w).toBeGreaterThanOrEqual((100 / COLS) * 2)
    expect(r.h).toBeGreaterThanOrEqual((100 / ROWS) * 2)
    expect(r.x + r.w / 2).toBeCloseTo(50, 5)
    // a big coin gets a bigger place; a coin at the edge keeps its place inside the picture
    expect(coinRegion([50, 50], 20).w).toBeGreaterThan(r.w)
    expect(coinRegion([1, 1], 6).x).toBe(0)
  })

  it('the coin glints when 60 % of its place is swept free, not before', () => {
    expect(COIN_REVEAL).toBe(0.6)
    const region = coinRegion([50, 50], 6)
    const grid = makeGrid()
    expect(coinRevealed(grid, region)).toBe(false)
    // a brush somewhere else
    wipeAt(grid, 10, 10, 7)
    expect(coinRevealed(grid, region)).toBe(false)
    // a brush on the coin
    wipeAt(grid, 50, 50, 7)
    expect(coinRevealed(grid, region)).toBe(true)
  })

  it('the sweeping brings 0 to 8 parts, by the share of the floor that is free; 40 % are all of them', () => {
    expect(coinSweepParts(0)).toBe(0)
    expect(coinSweepParts(0.1)).toBe(2)
    expect(coinSweepParts(0.2)).toBe(4)
    expect(coinSweepParts(0.4)).toBe(COIN_SWEEP_PARTS)
    expect(coinSweepParts(0.9)).toBe(COIN_SWEEP_PARTS)
    expect(coinSweepParts(-1)).toBe(0)
    expect(COIN_PARTS).toBe(10)
  })

  it('finds a coin outside the picture and a thing that lies on the coin', () => {
    const g: CoinGame = gleichnisse.stages[8]!.task.coin!
    const r = g.rounds[1]!
    expect(coinRoundProblems(r, g)).toEqual([])
    expect(coinRoundProblems({ ...r, coin: [120, 50] }, g).join(' ')).toMatch(/coin lies outside/)
    expect(coinRoundProblems({ ...r, decoys: [{ kind: 'lid', x: r.coin[0] + 2, y: r.coin[1] }] }, g).join(' ')).toMatch(/lid lies on the coin/)
    expect(coinRoundProblems({ ...r, decoys: [{ kind: 'pebble', x: -4, y: 20 }] }, g).join(' ')).toMatch(/pebble lies outside/)
    expect(coinProblems(g)).toEqual([])
  })
})

describe('meet: the run and the gifts', () => {
  it('the feet must alternate: the first tap is free, the same foot twice moves nothing', () => {
    let s = { steps: 0, last: null as 'left' | 'right' | null }
    const tap = (f: 'left' | 'right') => {
      const r = meetTap(s.steps, s.last, f, 12)
      s = { steps: r.steps, last: r.last }
      return r.moved
    }
    expect(tap('right')).toBe(true)
    expect(tap('right')).toBe(false)
    expect(tap('left')).toBe(true)
    expect(tap('left')).toBe(false)
    expect(tap('right')).toBe(true)
    expect(s.steps).toBe(3)
    expect(meetNext(null)).toBeNull()
    expect(meetNext('left')).toBe('right')
    expect(meetNext('right')).toBe('left')
  })

  it('twelve alternate taps bring the father to his son; nothing moves after that', () => {
    let steps = 0
    let last: 'left' | 'right' | null = null
    for (let i = 0; i < 12; i++) {
      const r = meetTap(steps, last, i % 2 ? 'right' : 'left', 12)
      expect(r.moved).toBe(true)
      steps = r.steps
      last = r.last
    }
    expect(steps).toBe(12)
    expect(meetArrived(steps, 12)).toBe(true)
    expect(meetTap(steps, last, last === 'left' ? 'right' : 'left', 12).moved).toBe(false)
  })

  it('the father runs evenly from the gate to the place of the meeting and no further', () => {
    expect(meetFatherX(0, 12, 80, 34)).toBe(80)
    expect(meetFatherX(6, 12, 80, 34)).toBe(57)
    expect(meetFatherX(12, 12, 80, 34)).toBe(34)
    expect(meetFatherX(20, 12, 80, 34)).toBe(34)
    expect(meetFatherX(-2, 12, 80, 34)).toBe(80)
    expect(meetEmbraceX(14, 34)).toBe(24)
  })

  it('the son wears rags, then the robe once the robe is on, and everything when all three gifts are given (in any order)', () => {
    expect(meetOutfit([])).toBe('ragged')
    expect(meetOutfit(['ring'])).toBe('ragged')
    expect(meetOutfit(['schuhe', 'ring'])).toBe('ragged')
    expect(meetOutfit(['kleid'])).toBe('robed')
    expect(meetOutfit(['ring', 'kleid'])).toBe('robed')
    expect(meetOutfit(['schuhe', 'ring', 'kleid'])).toBe('dressed')
    expect(meetOutfit(['kleid', 'ring', 'schuhe'])).toBe('dressed')
  })

  it('a gift is given once, and only the three gifts of the father count', () => {
    let r = meetGive([], 'ring')
    expect(r).toEqual({ given: ['ring'], fresh: true })
    r = meetGive(r.given, 'ring')
    expect(r).toEqual({ given: ['ring'], fresh: false })
    expect(meetGive(r.given, 'schwert')).toEqual({ given: ['ring'], fresh: false })
    expect([...MEET_GIFTS]).toEqual(['kleid', 'ring', 'schuhe'])
  })

  it('finds a father who stops beside the son or behind the gate, wrong gifts and wrong rounds', () => {
    const g: MeetGame = gleichnisse.stages[10]!.task.meet!
    expect(meetProblems(g)).toEqual([])
    expect(meetProblems({ ...g, meet: g.son.x }).join(' ')).toMatch(/stops left of the son/)
    expect(meetProblems({ ...g, meet: g.father.x + 1 }).join(' ')).toMatch(/right of the gate/)
    expect(meetProblems({ ...g, steps: 2 }).join(' ')).toMatch(/steps/)
    expect(meetProblems({ ...g, gifts: g.gifts.slice(0, 2) }).join(' ')).toMatch(/robe, ring and shoes/)
    expect(meetProblems({ ...g, rounds: [g.rounds[1]!, g.rounds[0]!] }).join(' ')).toMatch(/run and the gifts/)
  })
})
