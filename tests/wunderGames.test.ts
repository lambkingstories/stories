/**
 * The pure parts of the five new games of "Jesus' Miracles at the Lake" (`utils/wunderGames.ts`): bailing the boat, the crowd in the street, the bundle, the sharing of the bread and the rowing.
 */
import { describe, expect, it } from 'vitest'
import {
  BAIL_MAX,
  BAIL_SCOOPS,
  CROWD_COLS,
  CROWD_MID,
  CROWD_ROWS,
  ROW_MAX,
  ROW_STRAIGHT,
  ROW_TURN,
  bailDone,
  bailHelpTarget,
  bailRoundProblems,
  bailScale,
  bailStart,
  bailTap,
  bailTick,
  breadCanServe,
  breadNextHungry,
  breadStars,
  bundleDone,
  bundleHelpTarget,
  bundleProblems,
  bundleStep,
  crowdBuild,
  crowdCanAdvance,
  crowdFirstRow,
  crowdHelp,
  crowdMoveRow,
  crowdProblems,
  crowdSolveRow,
  crowdTarget,
  freeSpot,
  rowActive,
  rowArrived,
  rowBoatY,
  rowDrift,
  rowHelpSide,
  rowRoundProblems,
  rowStars,
  rowSway,
  rowTap,
  scatterSpots
} from '@/utils/wunderGames'
import type { BailState } from '@/utils/wunderGames'
import { seeded } from '@/utils/jakobGames'

describe('bail out the boat', () => {
  const rule = { total: 5, every: 5 }

  it('a round begins with two puddles on two different places', () => {
    const s = bailStart(rule, 7, seeded(1))
    expect(s.puddles).toHaveLength(2)
    expect(new Set(s.puddles.map((p) => p.spot)).size).toBe(2)
    expect(s.puddles.every((p) => p.size === BAIL_SCOOPS)).toBe(true)
    expect(s.spawned).toBe(2)
    expect(s.removed).toBe(0)
    expect(s.flooded).toBe(false)
    expect(bailStart({ total: 1, every: 5 }, 7, seeded(1)).puddles).toHaveLength(1)
  })

  it('a free place is never one that is taken; none is left when all are taken', () => {
    for (let seed = 1; seed < 20; seed++) expect([0, 2, 3]).not.toContain(freeSpot([0, 2, 3], 6, seeded(seed)))
    expect(freeSpot([0, 1, 2], 3, seeded(1))).toBe(-1)
    expect(freeSpot([], 1, seeded(1))).toBe(0)
  })

  it('three scoops take a puddle away; only the last one removes it', () => {
    let s = bailStart(rule, 7, seeded(2))
    const id = s.puddles[0]!.id
    let r = bailTap(s, id)
    expect(r.gone).toBe(false)
    expect(r.state.puddles.find((p) => p.id === id)!.size).toBe(2)
    r = bailTap(r.state, id)
    expect(r.state.puddles.find((p) => p.id === id)!.size).toBe(1)
    r = bailTap(r.state, id)
    expect(r.gone).toBe(true)
    expect(r.state.puddles.find((p) => p.id === id)).toBeUndefined()
    expect(r.state.removed).toBe(1)
    s = r.state
    expect(bailTap(s, 999)).toEqual({ state: s, gone: false, hit: false })
  })

  it('a wave throws a new puddle in after the seconds of the round; none after the last one; the clock does not run before', () => {
    const rand = seeded(3)
    let s = bailStart(rule, 7, rand)
    s = bailTick(s, 4.9, rule, 7, rand)
    expect(s.puddles).toHaveLength(2)
    s = bailTick(s, 0.2, rule, 7, rand)
    expect(s.puddles).toHaveLength(3)
    expect(s.spawned).toBe(3)
    expect(s.timer).toBe(0)
    // after the last puddle of the round no wave comes any more
    let end: BailState = { ...s, spawned: rule.total }
    end = bailTick(end, 50, rule, 7, rand)
    expect(end.puddles).toHaveLength(3)
  })

  it('with four puddles the boat is flooded once; the wave then waits: never more than four', () => {
    const rand = seeded(4)
    let s = bailStart({ total: 9, every: 2 }, 7, rand)
    for (let i = 0; i < 20; i++) s = bailTick(s, 1, { total: 9, every: 2 }, 7, rand)
    expect(s.puddles).toHaveLength(BAIL_MAX)
    expect(s.flooded).toBe(true)
    // one puddle scooped away: the clock begins again, the next wave comes only after the seconds
    const id = s.puddles[0]!.id
    for (let i = 0; i < 3; i++) s = bailTap(s, id).state
    expect(s.puddles).toHaveLength(BAIL_MAX - 1)
    s = bailTick(s, 1, { total: 9, every: 2 }, 7, rand)
    expect(s.puddles).toHaveLength(BAIL_MAX - 1)
  })

  it('a child who scoops at once never floods the boat', () => {
    const rand = seeded(5)
    let s = bailStart(rule, 7, rand)
    // one scoop every half second, always on the smallest puddle
    for (let step = 0; step < 400 && !bailDone(s, rule); step++) {
      const target = bailHelpTarget(s)
      if (target >= 0) s = bailTap(s, target).state
      s = bailTick(s, 0.5, rule, 7, rand)
    }
    expect(bailDone(s, rule)).toBe(true)
    expect(s.flooded).toBe(false)
    expect(s.removed).toBe(5)
  })

  it('the round is done only when every puddle is spooned away, also the ones still to come', () => {
    const s = bailStart(rule, 7, seeded(6))
    expect(bailDone(s, rule)).toBe(false)
    expect(bailDone({ ...s, puddles: [], removed: 5, spawned: 5 }, rule)).toBe(true)
    expect(bailDone({ ...s, puddles: [], removed: 2, spawned: 2 }, rule)).toBe(false)
  })

  it('a smaller puddle is drawn smaller, but never smaller than half; the help scoops the smallest', () => {
    expect(bailScale(3)).toBeCloseTo(1)
    expect(bailScale(1)).toBeGreaterThan(0.5)
    expect(bailScale(2)).toBeGreaterThan(bailScale(1))
    expect(bailScale(9)).toBeCloseTo(1)
    const s: BailState = { puddles: [{ id: 1, spot: 0, size: 3 }, { id: 2, spot: 1, size: 1 }, { id: 3, spot: 2, size: 2 }], spawned: 3, removed: 0, timer: 0, nextId: 4, flooded: false }
    expect(bailHelpTarget(s)).toBe(2)
    expect(bailHelpTarget({ ...s, puddles: [] })).toBe(-1)
  })

  it('the data of a round are checked', () => {
    expect(bailRoundProblems({ total: 5, every: 5 }, 7)).toEqual([])
    expect(bailRoundProblems({ total: 0, every: 5 }, 7).join()).toContain('no puddle')
    expect(bailRoundProblems({ total: 5, every: 1 }, 7).join()).toContain('too fast')
    expect(bailRoundProblems({ total: 5, every: 5 }, 4).join()).toContain('too few places')
  })
})

describe('through the crowd', () => {
  it('a person steps aside to the side away from the middle; the other side if that one is taken; not at all when both are taken', () => {
    expect(crowdTarget([0, 0, 1, 0, 0], 2)).toBe(3)
    expect(crowdTarget([0, 1, 0, 0, 0], 1)).toBe(0)
    expect(crowdTarget([1, 1, 0, 0, 0], 1)).toBe(2)
    expect(crowdTarget([0, 0, 1, 1, 0], 3)).toBe(4)
    expect(crowdTarget([0, 0, 1, 1, 1], 3)).toBe(-1)
    expect(crowdTarget([0, 1, 1, 1, 0], 2)).toBe(-1)
    expect(crowdTarget([1, 1, 1, 1, 0], 3)).toBe(4)
    expect(crowdTarget([0, 0, 0, 0, 0], 2)).toBe(-1)
  })

  it('nobody steps into the place of the pair', () => {
    expect(crowdTarget([0, 1, 0, 0, 0], 1, 2)).toBe(0)
    expect(crowdTarget([1, 1, 0, 0, 0], 1, 2)).toBe(-1)
    expect(crowdTarget([0, 0, 0, 1, 0], 3, 2)).toBe(4)
  })

  it('moving a person changes only his place and leaves the others', () => {
    expect(crowdMoveRow([0, 0, 3, 0, 5], 2)).toEqual([0, 0, 0, 3, 5])
    expect(crowdMoveRow([0, 4, 3, 2, 5], 2)).toBeNull()
  })

  it('the middle place of a row is freed by the shortest list of taps', () => {
    expect(crowdSolveRow([0, 0, 0, 0, 0])).toEqual([])
    expect(crowdSolveRow([0, 0, 1, 0, 0])).toEqual([2])
    // two people beside: one of them steps away first
    const taps = crowdSolveRow([0, 1, 1, 1, 0])!
    expect(taps).toHaveLength(2)
    expect(taps[taps.length - 1]).toBe(2)
    // a row without a free place cannot be freed
    expect(crowdSolveRow([1, 1, 1, 1, 1])).toBeNull()
  })

  it('every row with a free place can be freed (all patterns of five places)', () => {
    for (let mask = 0; mask < 32; mask++) {
      const row = Array.from({ length: 5 }, (_, i) => ((mask >> i) & 1 ? i + 1 : 0))
      const taps = crowdSolveRow(row)
      if (mask === 31) expect(taps).toBeNull()
      else expect(taps, row.join()).not.toBeNull()
      // doing the taps really frees the middle
      if (taps) {
        let r: number[] | null = row
        for (const c of taps) r = crowdMoveRow(r!, c)
        expect(r![CROWD_MID]).toBe(0)
      }
    }
  })

  it('the grid has six rows of five places; the crowd rows lie right above the start row', () => {
    const rows = [[0, 1, 0, 2, 0], [3, 0, 4, 0, 5]]
    const g = crowdBuild(rows)
    expect(g).toHaveLength(CROWD_ROWS)
    expect(g.every((r) => r.length === CROWD_COLS)).toBe(true)
    expect(g[CROWD_ROWS - 1]).toEqual([0, 0, 0, 0, 0])
    expect(g[CROWD_ROWS - 2]).toEqual(rows[1])
    expect(g[CROWD_ROWS - 3]).toEqual(rows[0])
    expect(g[0]).toEqual([0, 0, 0, 0, 0])
    expect(crowdFirstRow(rows)).toBe(3)
    // five crowd rows fill the grid up to the top row
    expect(crowdBuild([[0, 1, 0, 0, 0], [0, 1, 0, 0, 0], [0, 1, 0, 0, 0], [0, 1, 0, 0, 0], [0, 1, 0, 0, 0]])[0]).toEqual([0, 1, 0, 0, 0])
  })

  it('the pair goes on only where the place in front of it is free', () => {
    const g = crowdBuild([[0, 0, 1, 0, 0], [0, 0, 0, 0, 0]])
    expect(crowdCanAdvance(g, 5)).toBe(true)
    expect(crowdCanAdvance(g, 4)).toBe(false)
    expect(crowdCanAdvance(g, 0)).toBe(false)
  })

  it('"Help me" taps the person who steps aside first; nothing when the way is free', () => {
    const g = crowdBuild([[0, 0, 1, 0, 0], [0, 0, 0, 0, 0]])
    expect(crowdHelp(g, 5)).toBeNull()
    expect(crowdHelp(g, 4)).toEqual({ row: 3, col: 2 })
    const tight = crowdBuild([[0, 2, 3, 4, 0]])
    const first = crowdHelp(tight, 5)!
    expect(first.row).toBe(4)
    expect([1, 3]).toContain(first.col)
    expect(crowdHelp(g, 0)).toBeNull()
  })

  it('a game that follows the helper to the end always reaches the top', () => {
    const rows = [[0, 2, 3, 4, 0], [3, 0, 5, 0, 6], [1, 2, 0, 3, 4]]
    let g = crowdBuild(rows)
    let pair = CROWD_ROWS - 1
    for (let step = 0; step < 50 && pair > 0; step++) {
      if (crowdCanAdvance(g, pair)) {
        pair--
        continue
      }
      const tap = crowdHelp(g, pair)!
      const moved = crowdMoveRow(g[tap.row]!, tap.col, tap.row === pair ? CROWD_MID : -1)!
      g = g.map((r, i) => (i === tap.row ? moved : r))
    }
    expect(pair).toBe(0)
  })

  it('the rows of a round are checked: five places, a free place in each, the middle can be freed', () => {
    expect(crowdProblems([[0, 1, 0, 2, 0], [3, 0, 4, 0, 5]])).toEqual([])
    expect(crowdProblems([])).toContain('no crowd row')
    expect(crowdProblems([[0, 1, 0]]).join()).toContain('places')
    expect(crowdProblems([[1, 2, 3, 4, 5]]).join()).toContain('no free place')
    expect(crowdProblems(Array.from({ length: 6 }, () => [0, 1, 0, 0, 0])).join()).toContain('too many')
  })
})

describe('pack the bundle', () => {
  it('what Jesus allowed goes in, the rest stays', () => {
    expect(bundleStep(true)).toBe('ok')
    expect(bundleStep(false)).toBe('wrong')
  })

  it('the bundle is packed when every allowed thing lies in it, not before; the forbidden ones do not matter', () => {
    const items = [{ allowed: true }, { allowed: true }, { allowed: false }, { allowed: false }]
    expect(bundleDone([], items)).toBe(false)
    expect(bundleDone([0], items)).toBe(false)
    expect(bundleDone([0, 1], items)).toBe(true)
    expect(bundleDone([1, 0], items)).toBe(true)
    expect(bundleDone([], [{ allowed: false }])).toBe(false)
  })

  it('"Help me" packs the first allowed thing that is left', () => {
    const items = [{ allowed: false }, { allowed: true }, { allowed: true }]
    expect(bundleHelpTarget([], items)).toBe(1)
    expect(bundleHelpTarget([1], items)).toBe(2)
    expect(bundleHelpTarget([1, 2], items)).toBe(-1)
  })

  it('the things of a round are checked: some allowed, some forbidden, each once, on the cloth, not on top of each other', () => {
    const ok = [
      { thing: 'stab', allowed: true, x: 28, y: 36 },
      { thing: 'sandalen', allowed: true, x: 62, y: 36 },
      { thing: 'brot', allowed: false, x: 28, y: 64 },
      { thing: 'geld', allowed: false, x: 62, y: 64 }
    ]
    expect(bundleProblems(ok, 16)).toEqual([])
    expect(bundleProblems(ok.map((i) => ({ ...i, allowed: true })), 16).join()).toContain('no forbidden')
    expect(bundleProblems(ok.map((i) => ({ ...i, allowed: false })), 16).join()).toContain('no allowed')
    expect(bundleProblems([ok[0]!, { ...ok[1]!, thing: 'stab' }, ok[2]!], 16).join()).toContain('twice')
    expect(bundleProblems([ok[0]!, { ...ok[1]!, x: 30, y: 40 }, ok[2]!], 16).join()).toContain('on top of each other')
    expect(bundleProblems([{ ...ok[0]!, x: 3 }, ok[2]!], 16).join()).toContain('outside')
  })
})

describe('share the bread', () => {
  const area = { x: 8, y: 30, w: 84, h: 52 }

  it('twelve baskets lie inside the area, each in its own place and not on top of each other', () => {
    const spots = scatterSpots(12, area, 11)
    expect(spots).toHaveLength(12)
    for (const s of spots) {
      expect(s.x).toBeGreaterThan(area.x)
      expect(s.x).toBeLessThan(area.x + area.w)
      expect(s.y).toBeGreaterThan(area.y)
      expect(s.y).toBeLessThan(area.y + area.h)
    }
    for (let i = 0; i < spots.length; i++) {
      for (let k = i + 1; k < spots.length; k++) {
        // far enough apart for a basket of eight percent of the width (in pixels the height of the picture counts 1.5 times)
        const dx = Math.abs(spots[i]!.x - spots[k]!.x)
        const dy = Math.abs(spots[i]!.y - spots[k]!.y) * 1.5
        expect(Math.max(dx, dy), `${i}/${k}`).toBeGreaterThan(8)
      }
    }
  })

  it('the same seed gives the same places, another seed other ones; nothing for none', () => {
    expect(scatterSpots(12, area, 11)).toEqual(scatterSpots(12, area, 11))
    expect(scatterSpots(12, area, 12)).not.toEqual(scatterSpots(12, area, 11))
    expect(scatterSpots(0, area, 1)).toEqual([])
    expect(scatterSpots(1, area, 1)).toHaveLength(1)
  })

  it('a group can be served once; the helper serves the first hungry one', () => {
    expect(breadCanServe(false, false)).toBe(true)
    expect(breadCanServe(true, false)).toBe(false)
    expect(breadCanServe(false, true)).toBe(false)
    expect(breadNextHungry([true, false, false], [false, true, false])).toBe(2)
    expect(breadNextHungry([true, true], [false, false])).toBe(-1)
  })

  it('the stars: three free taps on fed groups, then fewer', () => {
    expect(breadStars(0)).toBe(3)
    expect(breadStars(3)).toBe(3)
    expect(breadStars(4)).toBe(2)
    expect(breadStars(7)).toBe(2)
    expect(breadStars(8)).toBe(1)
  })
})

describe('row against the wind', () => {
  it('the left oar turns the bow to the right, the right oar to the left; both strokes move the boat on', () => {
    let s = rowTap({ heading: 0, progress: 0 }, 'left')
    expect(s.heading).toBe(ROW_TURN)
    expect(s.progress).toBe(1)
    s = rowTap(s, 'right')
    expect(s.heading).toBe(0)
    expect(s.progress).toBe(2)
  })

  it('whoever rows on one side only turns the boat; beyond the straight angle a stroke counts half, and it never turns more than the maximum', () => {
    let s = { heading: 0, progress: 0 }
    for (let i = 0; i < 4; i++) s = rowTap(s, 'left')
    expect(s.heading).toBe(4 * ROW_TURN)
    expect(Math.abs(s.heading)).toBeLessThanOrEqual(ROW_STRAIGHT)
    expect(s.progress).toBe(4)
    s = rowTap(s, 'left')
    expect(Math.abs(s.heading)).toBeGreaterThan(ROW_STRAIGHT)
    expect(s.progress).toBe(4.5)
    for (let i = 0; i < 30; i++) s = rowTap(s, 'left')
    expect(s.heading).toBe(ROW_MAX)
    for (let i = 0; i < 60; i++) s = rowTap(s, 'right')
    expect(s.heading).toBe(-ROW_MAX)
  })

  it('rowing in turn keeps the boat straight: the way is done in exactly the strokes of the distance', () => {
    let s = { heading: 0, progress: 0 }
    let n = 0
    while (!rowArrived(s, 30)) {
      s = rowTap(s, n % 2 === 0 ? 'left' : 'right')
      n++
    }
    expect(n).toBe(30)
    expect(Math.abs(s.heading)).toBeLessThanOrEqual(ROW_TURN)
  })

  it('the wind turns the bow on, in either direction, never beyond the maximum', () => {
    expect(rowDrift({ heading: 0, progress: 3 }, 2, 1)).toEqual({ heading: 2, progress: 3 })
    expect(rowDrift({ heading: 0, progress: 0 }, -3, 2).heading).toBe(-6)
    expect(rowDrift({ heading: 59, progress: 0 }, 5, 10).heading).toBe(ROW_MAX)
  })

  it('a child who rows in turn and corrects the wind with the other side reaches the end in about the distance', () => {
    // 3 strokes a second against a wind of 3 degrees a second, always against the turn when crooked
    let s = { heading: 0, progress: 0 }
    let last: 'left' | 'right' | null = null
    let seconds = 0
    while (!rowArrived(s, 45) && seconds < 120) {
      const side = rowHelpSide(s.heading, last)
      s = rowDrift(rowTap(s, side), -3, 1 / 3)
      last = side
      seconds += 1 / 3
    }
    expect(rowArrived(s, 45)).toBe(true)
    expect(seconds).toBeLessThan(25)
  })

  it('the boat swims sideways where the bow points and the current brings it back; it stays on the lake', () => {
    expect(rowSway(0, 0, 1)).toBeCloseTo(0)
    expect(rowSway(0, 30, 1)).toBeGreaterThan(0)
    expect(rowSway(0, -30, 1)).toBeLessThan(0)
    expect(rowSway(10, 0, 1)).toBeLessThan(10)
    expect(rowSway(36, 60, 5)).toBeLessThanOrEqual(36)
    expect(rowSway(-36, -60, 5)).toBeGreaterThanOrEqual(-36)
  })

  it('the boat goes up the picture with the strokes: from the start to the goal, not beyond', () => {
    expect(rowBoatY(0, 30, 84, 40)).toBe(84)
    expect(rowBoatY(15, 30, 84, 40)).toBe(62)
    expect(rowBoatY(30, 30, 84, 40)).toBe(40)
    expect(rowBoatY(99, 30, 84, 40)).toBe(40)
    expect(rowBoatY(5, 0, 84, 40)).toBe(84)
  })

  it('"Help me" rows against the turn; when the boat is straight it rows on the side other than the stroke before', () => {
    expect(rowHelpSide(20, 'left')).toBe('right')
    expect(rowHelpSide(-20, 'right')).toBe('left')
    expect(rowHelpSide(0, 'left')).toBe('right')
    expect(rowHelpSide(0, 'right')).toBe('left')
    expect(rowHelpSide(0, null)).toBe('left')
  })

  it('the time counts the gaps between strokes, a pause counts three seconds at most; the stars follow the seconds', () => {
    expect(rowActive(400)).toBeCloseTo(0.4)
    expect(rowActive(20000)).toBe(3)
    expect(rowActive(-5)).toBe(0)
    expect(rowStars(40)).toBe(3)
    expect(rowStars(70)).toBe(3)
    expect(rowStars(71)).toBe(2)
    expect(rowStars(110)).toBe(2)
    expect(rowStars(111)).toBe(1)
  })

  it('the data of a round are checked: a long enough way, a wind that a stroke can fight', () => {
    expect(rowRoundProblems({ distance: 30, wind: 1.5 })).toEqual([])
    expect(rowRoundProblems({ distance: 45, wind: -3 })).toEqual([])
    expect(rowRoundProblems({ distance: 3, wind: 1 }).join()).toContain('too short')
    expect(rowRoundProblems({ distance: 30, wind: 9 }).join()).toContain('too strong')
  })
})
