/**
 * The pure parts of the three new games of "Zachäus und Lazarus" (`utils/zachaeusGames.ts`): stars, climbing, halving, unwrapping and the checks of the data.
 */
import { describe, expect, it } from 'vitest'
import {
  UNWRAP_PULL,
  UNWRAP_TAPS,
  climbAtTop,
  climbBranchX,
  climbJudge,
  climbProblems,
  climbSpot,
  halveCoinX,
  halveDividerX,
  halveJudge,
  halveProblems,
  halveRoundProblems,
  halveSnap,
  halveStars,
  halveStep,
  unwrapDir,
  unwrapOff,
  unwrapOpen,
  unwrapProblems,
  unwrapPull,
  unwrapStars,
  zachaeusStars
} from '@/utils/zachaeusGames'
import type { ClimbGame, HalveGame, UnwrapGame } from '@/types/adventure'

const sprite = (image: string, w = 10) => ({ image, label: image, w })

const CLIMB: ClimbGame = {
  tree: 'baum',
  view: 'ausblick',
  climber: sprite('zachaeus', 15),
  strong: sprite('ast-stark', 36),
  weak: sprite('ast-schwach', 36),
  trunk: 50,
  branches: [29, 71],
  start: 94,
  rounds: [
    { hint: 'a', levels: [{ strong: 'r', y: 70 }, { strong: 'l', y: 46 }, { strong: 'r', y: 22 }] },
    { hint: 'b', levels: [{ strong: 'l', y: 74 }, { strong: 'l', y: 56 }, { strong: 'r', y: 38 }, { strong: 'l', y: 20 }] }
  ]
}

const HALVE: HalveGame = {
  table: 'tisch',
  coin: sprite('muenze', 5),
  divider: sprite('teiler', 5),
  bowlSelf: { ...sprite('schale-zachaeus', 20), x: 24, y: 90 },
  bowlPoor: { ...sprite('schale-arme', 20), x: 66, y: 90 },
  poor: { ...sprite('arme', 16), x: 90, y: 96 },
  row: { y: 50, from: 12, to: 88 },
  rounds: [
    { hint: 'a', coins: 10, start: 2 },
    { hint: 'b', coins: 14, start: 11, offsets: [0, 0, -3, 0, 2, 0, 0, -2, 0, 0, 3, 0, 0, -2] }
  ]
}

const strip = (id: number, needs?: number) => ({ id, image: `s${id}`, label: `Tuch ${id}`, x: 50, y: 50, w: 10, end: [60, 50] as [number, number], dir: [1, 0] as [number, number], ...(needs ? { needs } : {}) })
const UNWRAP: UnwrapGame = {
  scene: 'szene',
  lazarus: { ...sprite('lazarus', 18), x: 56, y: 94 },
  free: sprite('lazarus-frei', 18),
  maria: { ...sprite('maria', 17), x: 36, y: 94, from: -12 },
  hint: 'h',
  strips: [strip(1), strip(2), strip(3), strip(4), strip(5, 2)]
}

describe('stars', () => {
  it('climb and halve: up to two mistakes three stars, up to five two, then one (two rounds)', () => {
    expect([0, 1, 2, 3, 5, 6, 10].map((m) => zachaeusStars(m, 2))).toEqual([3, 3, 3, 2, 2, 1, 1])
    expect(zachaeusStars(0, 0)).toBe(3)
  })

  it('halve with help gives at most two stars; unwrap gives three, with help two', () => {
    expect(halveStars(0, 2, false)).toBe(3)
    expect(halveStars(0, 2, true)).toBe(2)
    expect(halveStars(9, 2, true)).toBe(1)
    expect(unwrapStars(false)).toBe(3)
    expect(unwrapStars(true)).toBe(2)
  })
})

describe('up the tree', () => {
  it('the strong branch lets him climb, the weak one creaks', () => {
    expect(climbJudge('l', 'l')).toBe('up')
    expect(climbJudge('l', 'r')).toBe('creak')
    expect(climbBranchX(CLIMB, 'l')).toBe(29)
    expect(climbBranchX(CLIMB, 'r')).toBe(71)
  })

  it('Zacchaeus stands at the foot of the trunk, then on the strong branch of each height (between the trunk and the branch)', () => {
    const r = CLIMB.rounds[0]!
    expect(climbSpot(CLIMB, r, 0)).toEqual({ x: 50, y: 94 })
    expect(climbSpot(CLIMB, r, 1)).toEqual({ x: 60.5, y: 70 })
    expect(climbSpot(CLIMB, r, 2)).toEqual({ x: 39.5, y: 46 })
    expect(climbSpot(CLIMB, r, 9)).toEqual({ x: 60.5, y: 22 })
    expect(climbAtTop(r, 2)).toBe(false)
    expect(climbAtTop(r, 3)).toBe(true)
  })

  it('the checks of the data find heights out of order, a strong branch that never changes sides and a round 2 that is not higher', () => {
    expect(climbProblems(CLIMB)).toEqual([])
    const bad: ClimbGame = { ...CLIMB, rounds: [{ hint: 'a', levels: [{ strong: 'l', y: 40 }, { strong: 'l', y: 60 }, { strong: 'l', y: 20 }] }, { hint: 'b', levels: [{ strong: 'l', y: 70 }, { strong: 'r', y: 50 }] }] }
    const p = climbProblems(bad)
    expect(p.some((x) => x.includes('not above'))).toBe(true)
    expect(p.some((x) => x.includes('never changes'))).toBe(true)
    expect(p.some((x) => x.includes('three to five'))).toBe(true)
    expect(p.some((x) => x.includes('higher'))).toBe(true)
    expect(climbProblems({ ...CLIMB, branches: [60, 70] })).toContain('the branches must lie left and right of the trunk')
  })
})

describe('half to the poor', () => {
  const row = HALVE.row
  it('the coins lie evenly in the row, the divider between two of them', () => {
    expect(halveCoinX(0, 10, row)).toBeCloseTo(15.8, 6)
    expect(halveCoinX(9, 10, row)).toBeCloseTo(84.2, 6)
    expect(halveDividerX(5, 10, row)).toBeCloseTo(50, 6)
    expect(halveDividerX(1, 10, row)).toBeCloseTo(19.6, 6)
  })

  it('the divider snaps to the nearest gap and never leaves the row', () => {
    expect(halveSnap(50, 10, row)).toBe(5)
    expect(halveSnap(53, 10, row)).toBe(5)
    expect(halveSnap(56, 10, row)).toBe(6)
    expect(halveSnap(0, 10, row)).toBe(1)
    expect(halveSnap(100, 10, row)).toBe(9)
    expect(halveStep(1, -1, 10)).toBe(1)
    expect(halveStep(9, 1, 10)).toBe(9)
    expect(halveStep(4, 1, 10)).toBe(5)
  })

  it('only exactly the middle is right; otherwise the arrow says where to go', () => {
    expect(halveJudge(5, 10)).toBe('right')
    expect(halveJudge(7, 14)).toBe('right')
    expect(halveJudge(4, 10)).toBe('toRight')
    expect(halveJudge(8, 14)).toBe('toLeft')
  })

  it('the checks of the data: an even number of coins, not starting in the middle, one shift for every coin, no overlap', () => {
    expect(halveProblems(HALVE)).toEqual([])
    expect(halveRoundProblems({ hint: '', coins: 9, start: 2 })).toContain('an even number of coins, at least four')
    expect(halveRoundProblems({ hint: '', coins: 10, start: 5 })).toContain('the divider must not start in the middle')
    expect(halveRoundProblems({ hint: '', coins: 10, start: 2, offsets: [1] })).toContain('one shift for every coin')
    expect(halveRoundProblems({ hint: '', coins: 4, start: 1, offsets: [0, 9, 0, 0] })).toContain('a coin is shifted too far (the row must stay easy to count)')
    expect(halveProblems({ ...HALVE, coin: sprite('m', 8) }).some((x) => x.includes('overlap'))).toBe(true)
  })
})

describe('loose him', () => {
  it('the pull is the movement along the strip; pushing against it pulls nothing; the height counts less than the width (3:2)', () => {
    expect(unwrapDir([3, 4])).toEqual([0.6, 0.8])
    expect(unwrapDir([0, 0])).toEqual([1, 0])
    expect(unwrapPull(10, 0, [1, 0])).toBeCloseTo(10, 6)
    expect(unwrapPull(-10, 0, [1, 0])).toBe(0)
    expect(unwrapPull(0, 15, [0, 1])).toBeCloseTo(10, 6)
    expect(unwrapPull(10, 30, [1, 0])).toBeCloseTo(10, 6)
  })

  it('a strip is off when it is pulled far enough; three taps are enough', () => {
    expect(unwrapOff(UNWRAP_PULL - 1)).toBe(false)
    expect(unwrapOff(UNWRAP_PULL)).toBe(true)
    expect(unwrapOff((UNWRAP_PULL / UNWRAP_TAPS) * UNWRAP_TAPS)).toBe(true)
  })

  it('the cloth on the head opens only after two others', () => {
    const head = UNWRAP.strips[4]!
    expect(unwrapOpen(head, 0)).toBe(false)
    expect(unwrapOpen(head, 1)).toBe(false)
    expect(unwrapOpen(head, 2)).toBe(true)
    expect(unwrapOpen(UNWRAP.strips[0]!, 0)).toBe(true)
  })

  it('the checks of the data: five strips with their own numbers, reachable, ends inside the picture, Mary from the left', () => {
    expect(unwrapProblems(UNWRAP)).toEqual([])
    expect(unwrapProblems({ ...UNWRAP, strips: UNWRAP.strips.slice(0, 4) })).toContain('five strips are needed')
    expect(unwrapProblems({ ...UNWRAP, strips: [strip(1, 4), strip(2, 4), strip(3, 4), strip(4, 4), strip(5, 4)] })).toContain('some strips can never be loosed')
    expect(unwrapProblems({ ...UNWRAP, strips: [strip(1), strip(1), strip(3), strip(4), strip(5)] })).toContain('every strip needs its own number')
    expect(unwrapProblems({ ...UNWRAP, strips: [{ ...strip(1), end: [120, 50] }, strip(2), strip(3), strip(4), strip(5)] })).toContain('the loose end of strip 1 lies outside the picture')
    expect(unwrapProblems({ ...UNWRAP, maria: { ...UNWRAP.maria, from: 80 } })).toContain('Mary runs in from the left')
  })
})
