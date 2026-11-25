/**
 * The logic of the four new games of "Hiskia: Ein Brief vor Gott" (`src/utils/hiskiaNeu.ts`, stars in `hiskiaGames.ts`), tested with the sample data of `hiskiaSamples.ts`:
 * - `laufwege`: exactly one way to share the letters in each round (2 runners / 5 towns, 3 runners / 7 towns), the moves (a letter in every town once, no runner without letters), "one step back",
 *   dead ends, the help; the checks of the data (`runRoutesProblems`) find nothing in the sample and find broken data;
 * - `stadtmorgen`: the neighbours turn with a tap, exactly one shortest way (3 and 5 taps), the help;
 * - `sonnenuhr`: the target steps (4 -> 7 and 13 -> 3), the steps between, snapping to a step, the length of the shadow;
 * - `stollen`: the numbers of the plan (always straight on misses by 9.0 and 16.1; 612 and 924 ways meet exactly), the layers, the outcomes, the help.
 */
import { describe, expect, it } from 'vitest'
import {
  allEnds, bandShift, bestNext, cityMorningProblems, digPiece, hintTap, morningOpenAll, morningSolutions, morningTap, morningTouched, outcome, runCheck, runDone, runHint, runNeighbors, runRoutesProblems,
  runSolutions, runSolve, runStart, runStep, runStuck, runUndo, shadowLength, snapToTread, solveMorning, stepsMoved, sundialProblems, targetStep, tunnelGap, tunnelHeight, tunnelProblems, tunnelTip, tunnelWalk
} from '@/utils/hiskiaNeu'
import { hiskiaStars, meetStars, moveStars, stollenStars } from '@/utils/hiskiaGames'
import { MORNING, RUN, SUNDIAL, TUNNEL } from './hiskiaSamples'

describe('Hiskia: stars', () => {
  it('up to two mistakes three stars, up to four two stars, then one; taps beyond the shortest way 10 and 20; the meeting 3, 2, 1', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(hiskiaStars)).toEqual([3, 3, 3, 2, 2, 1, 1])
    expect(hiskiaStars(-3)).toBe(3)
    expect([0, 10, 11, 20, 21].map(moveStars)).toEqual([3, 3, 2, 2, 1])
    expect([0.5, 1.5, 1.6, 3, 3.1, 8, 8.1].map((g) => meetStars(g))).toEqual([3, 3, 2, 2, 1, 1, 0])
    expect(stollenStars(3, 3)).toBe(3)
    expect(stollenStars(3, 2)).toBe(2)
    expect(stollenStars(1, 1)).toBe(1)
    expect(stollenStars(1, 0)).toBe(1)
  })
})

describe('Hiskia: laufwege (send the runners)', () => {
  const r1 = RUN.rounds[0]!
  const r2 = RUN.rounds[1]!
  it('the samples pass their check', () => {
    expect(runRoutesProblems(RUN)).toEqual([])
  })

  it('exactly one way to share the letters in each round: 2 runners and 5 towns, 3 runners and 7 towns; nobody has more than 3 letters', () => {
    expect(runSolutions(r1)).toEqual([[['2', '1', '4'], ['5', '3']]])
    expect(runSolutions(r2)).toEqual([[['1', '2'], ['3', '5'], ['4', '7', '6']]])
    expect(r1.towns).toHaveLength(5)
    expect(r2.towns).toHaveLength(7)
    expect([r1.runners, r2.runners]).toEqual([2, 3])
  })

  it('a runner goes along a road to a town without a letter; the letter stays; he has one letter less', () => {
    const s0 = runStart(r1)
    expect(s0.pos).toEqual(['J', 'J'])
    expect(s0.left).toEqual([3, 3])
    expect(runNeighbors(r1, 'J').sort()).toEqual(['1', '2', '5'])
    expect(runCheck(r1, s0, 0, '5')).toBe('ok')
    expect(runCheck(r1, s0, 0, '4')).toBe('noroad')
    expect(runCheck(r1, s0, 0, 'J')).toBe('city')
    const s1 = runStep(r1, s0, 0, '5')!
    expect(s1.pos).toEqual(['5', 'J'])
    expect(s1.left).toEqual([2, 3])
    expect(s1.got).toEqual(['5'])
    // the town has its letter: nobody may come a second time
    expect(runCheck(r1, s1, 1, '5')).toBe('taken')
    expect(runStep(r1, s1, 1, '5')).toBeNull()
    // from 5 the runner goes on to 3 or 1 (the roads 5-3 and 5-1)
    expect(runCheck(r1, s1, 0, '3')).toBe('ok')
    expect(runCheck(r1, s1, 0, '2')).toBe('noroad')
  })

  it('a runner without letters cannot go on; every runner has three letters', () => {
    let s = runStart(r2)
    for (const to of ['1', '2']) s = runStep(r2, s, 0, to)!
    expect(s.left[0]).toBe(1)
    s = runStep(r2, s, 0, '4')!
    expect(s.left[0]).toBe(0)
    expect(runCheck(r2, s, 0, '7')).toBe('empty')
  })

  it('"one step back" takes back the last move of the last runner who moved and restores everything', () => {
    const s0 = runStart(r1)
    const s1 = runStep(r1, s0, 0, '5')!
    const s2 = runStep(r1, s1, 1, '2')!
    expect(runUndo(s2)).toEqual(s1)
    expect(runUndo(runUndo(s2))).toEqual(s0)
    expect(runUndo(s0)).toEqual(s0)
  })

  it('stuck means that no way leads to a letter in every town any more', () => {
    // runner a goes 1 and 3, runner b goes 5: towns 2 and 4 remain, but 4 lies behind the town 1 and 2 is reached from J only: nothing leads on
    let s = runStart(r1)
    s = runStep(r1, s, 0, '1')!
    s = runStep(r1, s, 0, '3')!
    s = runStep(r1, s, 1, '5')!
    expect(runDone(r1, s)).toBe(false)
    expect(runStuck(r1, s)).toBe(true)
    expect(runHint(r1, s)).toBeNull()
    // the start is never stuck
    expect(runStuck(r1, runStart(r1))).toBe(false)
  })

  it('the help always has a next move that leads on, in both rounds from the start to the end', () => {
    for (const rd of [r1, r2]) {
      let s = runStart(rd)
      for (let k = 0; k < 12 && !runDone(rd, s); k++) {
        const h = runHint(rd, s)
        expect(h, 'a move').not.toBeNull()
        s = runStep(rd, s, h!.runner, h!.to)!
      }
      expect(runDone(rd, s)).toBe(true)
      expect(runHint(rd, s)).toBeNull()
    }
    // after a first move that is not part of the way, the help still finds a way or says that there is none
    let s = runStart(r1)
    s = runStep(r1, s, 1, '2')!
    expect(runSolve(r1, s)).not.toBeNull()
  })

  it('broken data is found: a road that crosses, two ways to share, towns that all set out, a town that cannot be reached', () => {
    const cross = { ...RUN, rounds: [{ ...r1, roads: [...r1.roads, ['2', '3']] as [string, string][] }, r2] }
    expect(runRoutesProblems(cross).join(' ')).toMatch(/cross|passes|ways/)
    const extra = { ...RUN, rounds: [{ ...r1, roads: [...r1.roads, ['2', '4']] as [string, string][] }, r2] }
    expect(runRoutesProblems(extra).join(' ')).toMatch(/ways to share/)
    const comes = { ...RUN, rounds: [{ ...r1, towns: r1.towns.map((t) => ({ ...t, reacts: 'comes' as const })) }, r2] }
    expect(runRoutesProblems(comes).join(' ')).toMatch(/set out|laugh/)
    const lonely = { ...RUN, rounds: [{ ...r1, roads: r1.roads.filter(([a, b]) => a !== '4' && b !== '4') }, r2] }
    expect(runRoutesProblems(lonely).join(' ')).toMatch(/cannot be reached/)
    const close = { ...RUN, rounds: [{ ...r1, towns: r1.towns.map((t) => (t.id === '4' ? { ...t, x: 56, y: 53 } : t)) }, r2] }
    expect(runRoutesProblems(close).join(' ')).toMatch(/pixels apart|passes|lies on/)
  })

  it('the data fit a phone of 360 pixels: the runners are wide enough', () => {
    expect(RUN.runnerW * 3.6).toBeGreaterThanOrEqual(40)
    expect(RUN.rounds.every((r) => r.letters === 3)).toBe(true)
  })
})

describe('Hiskia: stadtmorgen (the city wakes up)', () => {
  it('the samples pass their check', () => {
    expect(cityMorningProblems(MORNING)).toEqual([])
  })

  it('a tap turns the house and its neighbours above, below, left and right (at the edge fewer); a second tap turns back', () => {
    expect(morningTouched(3, 3, 4)).toEqual([1, 3, 4, 5, 7])
    expect(morningTouched(3, 3, 0)).toEqual([0, 1, 3])
    expect(morningTouched(3, 4, 11)).toEqual([8, 10, 11])
    const start = MORNING.rounds[0]!.shut
    const once = morningTap(start, 3, 3, 4)
    expect(once).not.toEqual(start)
    expect(morningTap(once, 3, 3, 4)).toEqual(start)
    expect(start).toEqual(MORNING.rounds[0]!.shut) // the old list is not changed
  })

  it('round 1: 3 shut doors, the only shortest way is the diagonal (3 taps); round 2: 7 shut doors, 5 taps', () => {
    const a = MORNING.rounds[0]!
    const b = MORNING.rounds[1]!
    expect(a.shut.filter(Boolean)).toHaveLength(3)
    expect(b.shut.filter(Boolean)).toHaveLength(7)
    expect(morningSolutions(a.shut, 3, 3)).toEqual([[0, 4, 8]])
    expect(morningSolutions(b.shut, 3, 4)).toEqual([[1, 4, 5, 9, 11]])
    expect(solveMorning(a.shut, 3, 3)).toEqual([0, 4, 8])
  })

  it('the help solves both rounds from the start without an extra tap, and also after a wrong tap', () => {
    for (const rd of MORNING.rounds) {
      let cur = [...rd.shut]
      let n = 0
      while (!morningOpenAll(cur)) {
        const h = hintTap(cur, rd.cols, rd.rows)
        expect(h).not.toBeNull()
        cur = morningTap(cur, rd.cols, rd.rows, h!)
        n++
      }
      expect(n).toBe(solveMorning(rd.shut, rd.cols, rd.rows)!.length)
      expect(hintTap(cur, rd.cols, rd.rows)).toBeNull()
    }
    let cur = morningTap(MORNING.rounds[0]!.shut, 3, 3, 2)
    for (let k = 0; k < 12 && !morningOpenAll(cur); k++) cur = morningTap(cur, 3, 3, hintTap(cur, 3, 3)!)
    expect(morningOpenAll(cur)).toBe(true)
  })

  it('every start of 3 x 3 and of 3 x 4 houses (a sample of them) has a way, and the way of 3 x 4 is unique', () => {
    for (let mask = 1; mask < 1 << 9; mask += 7) {
      const shut = Array.from({ length: 9 }, (_, i) => !!(mask & (1 << i)))
      expect(solveMorning(shut, 3, 3), `mask ${mask}`).not.toBeNull()
    }
    for (let mask = 1; mask < 1 << 12; mask += 37) {
      const shut = Array.from({ length: 12 }, (_, i) => !!(mask & (1 << i)))
      expect(morningSolutions(shut, 3, 4).length, `mask ${mask}`).toBe(1)
    }
  })

  it('broken data is found: a round that is solved at the start, doors that do not fit the grid, a cell smaller than 44 pixels', () => {
    const solved = { ...MORNING, rounds: [{ ...MORNING.rounds[0]!, shut: Array.from({ length: 9 }, () => false) }, MORNING.rounds[1]!] }
    expect(cityMorningProblems(solved).join(' ')).toMatch(/solved at the start/)
    const wrong = { ...MORNING, rounds: [{ ...MORNING.rounds[0]!, shut: [true] }, MORNING.rounds[1]!] }
    expect(cityMorningProblems(wrong).join(' ')).toMatch(/do not fit/)
    const small = { ...MORNING, rounds: [{ ...MORNING.rounds[0]!, grid: { x: 40, y: 40, w: 30, h: 18 } }, MORNING.rounds[1]!] }
    expect(cityMorningProblems(small).join(' ')).toMatch(/smaller than 44/)
  })
})

describe('Hiskia: sonnenuhr (how many steps?)', () => {
  it('the samples pass their check', () => {
    expect(sundialProblems(SUNDIAL)).toEqual([])
  })

  it('round 1: from step 4 three steps forward to step 7; round 2: from step 13 ten steps back to step 3', () => {
    const a = SUNDIAL.rounds[0]!
    const b = SUNDIAL.rounds[1]!
    expect([targetStep(a), targetStep(b)]).toEqual([7, 3])
    expect([stepsMoved(a.start, 7), stepsMoved(b.start, 3)]).toEqual([3, 10])
    expect(stepsMoved(7, 4)).toBe(3)
    expect(SUNDIAL.treads).toHaveLength(14)
  })

  it('the handle snaps to the nearest step; the shadow reaches from the post to the middle of the step', () => {
    const t = SUNDIAL.treads
    expect(snapToTread(t[0]! - 20, t)).toBe(1)
    expect(snapToTread(t[13]! + 20, t)).toBe(14)
    for (let i = 0; i < 14; i++) expect(snapToTread(t[i]!, t)).toBe(i + 1)
    expect(snapToTread((t[4]! + t[5]!) / 2 - 0.1, t)).toBe(5)
    expect(shadowLength(t, SUNDIAL.post, 1)).toBeCloseTo(t[0]! - SUNDIAL.post.y, 5)
    expect(shadowLength(t, SUNDIAL.post, 14)).toBeGreaterThan(shadowLength(t, SUNDIAL.post, 7))
    expect(shadowLength(t, SUNDIAL.post, 99)).toBe(shadowLength(t, SUNDIAL.post, 14))
  })

  it('broken data is found: 13 steps, steps that lie too close, a target outside the stairs, a handle that is too small', () => {
    expect(sundialProblems({ ...SUNDIAL, treads: SUNDIAL.treads.slice(0, 13) }).join(' ')).toMatch(/14 steps/)
    expect(sundialProblems({ ...SUNDIAL, treads: SUNDIAL.treads.map((y) => 20 + (y - 20) * 0.5) }).join(' ')).toMatch(/less than 4|closer than 19/)
    expect(sundialProblems({ ...SUNDIAL, rounds: [{ ...SUNDIAL.rounds[0]!, steps: 12 }, SUNDIAL.rounds[1]!] }).join(' ')).toMatch(/outside the stairs|wanted/)
    expect(sundialProblems({ ...SUNDIAL, tipW: 10 }).join(' ')).toMatch(/handle is narrower/)
  })
})

describe('Hiskia: stollen (meeting in the rock)', () => {
  const r1 = TUNNEL.rounds[0]!
  const r2 = TUNNEL.rounds[1]!
  const H = tunnelHeight(TUNNEL)
  it('the samples pass their check; the picture is 66.7 units high', () => {
    expect(tunnelProblems(TUNNEL)).toEqual([])
    expect(H).toBeCloseTo(66.667, 2)
  })

  it('always straight on misses: by 9.0 in round 1 and 16.1 in round 2 (the numbers of the plan)', () => {
    expect(tunnelGap(r1, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], H)).toBeCloseTo(9.02, 1)
    expect(tunnelGap(r2, [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], H)).toBeCloseTo(16.12, 1)
  })

  it('the layers push the middle of a piece: down for "ab" (+), up for "auf" (-), nothing outside', () => {
    expect(bandShift(r1, 25)).toBe(1.8)
    expect(bandShift(r1, 74)).toBe(-1.8)
    expect(bandShift(r1, 50)).toBe(0)
    const p = digPiece(r1, 'left', { x: 14.5, y: 22 }, 0, 0, H)
    expect(p.to.x).toBeCloseTo(23.5, 5)
    expect(p.to.y).toBeCloseTo(23.8, 5) // the middle (19) lies in the layer 18-34: +1.8
    expect(p.tilt).toBe(0)
    const up = digPiece(r1, 'left', { x: 6, y: 22 }, 0, 1, H)
    expect(up.tilt).toBe(20)
    expect(up.to.y).toBeLessThan(22)
    const right = digPiece(r1, 'right', { x: 94, y: 38 }, 0, 1, H)
    expect(right.to.x).toBeLessThan(94) // the right crew digs to the left
    expect(right.to.y).toBeLessThan(38) // and "up" is up for it, too
  })

  it('the tip of a crew follows its choices; a tip never leaves the picture, even when it digs up or down all the time', () => {
    expect(tunnelTip(r1, 'left', [], H)).toEqual(r1.left)
    expect(tunnelWalk(r1, 'left', [1, 1, 1, 1, 1], H)).toHaveLength(5)
    for (const c of [1, -1]) for (const crew of ['left', 'right'] as const) for (const p of tunnelWalk(r2, crew, Array.from({ length: 6 }, () => c), H)) expect(p.to.y >= 0 && p.to.y <= H).toBe(true)
  })

  it('the numbers of the plan: 612 ways in round 1 and 924 in round 2 meet within 1.5; the outcomes 3, 2, 1, 0', () => {
    for (const [rd, want] of [[r1, 612], [r2, 924]] as const) {
      const L = allEnds(rd, 'left', H)
      const R = allEnds(rd, 'right', H)
      expect(L).toHaveLength(3 ** rd.pieces)
      let n = 0
      for (const l of L) for (const r of R) if (Math.hypot(l.tip.x - r.tip.x, l.tip.y - r.tip.y) <= TUNNEL.tolerance.three) n++
      expect(n).toBe(want)
    }
    expect([1.5, 1.6, 3, 3.1, 8, 8.1].map((g) => outcome(g))).toEqual([3, 2, 2, 1, 1, 0])
  })

  it('the help leads in every round with at most `pieces` moves to a gap of at most 3.0, and asked in the middle it still answers', () => {
    for (const rd of [r1, r2]) {
      let left: number[] = []
      let right: number[] = []
      for (let k = 0; k < rd.pieces; k++) {
        const h = bestNext(rd, left, right, H)!
        left = [...left, h.left]
        right = [...right, h.right]
      }
      expect(tunnelGap(rd, left, right, H)).toBeLessThanOrEqual(TUNNEL.tolerance.two)
      expect(bestNext(rd, left, right, H)).toBeNull()
    }
    const mid = bestNext(r2, [0, 0], [1, -1], H)!
    expect([-1, 0, 1]).toContain(mid.left)
    expect(mid.gap).toBeLessThan(40)
  })

  it('broken data is found: a layer at the edge, a layer with the wrong picture, two layers on each other, no way meets', () => {
    expect(tunnelProblems({ ...TUNNEL, rounds: [{ ...r1, bands: [{ x0: 2, x1: 20, shift: 1.8, image: 'ab' }] }, r2] }).join(' ')).toMatch(/first or the last 8/)
    expect(tunnelProblems({ ...TUNNEL, rounds: [{ ...r1, bands: [{ x0: 18, x1: 34, shift: 1.8, image: 'auf' }] }, r2] }).join(' ')).toMatch(/picture of a layer/)
    expect(tunnelProblems({ ...TUNNEL, rounds: [{ ...r1, bands: [{ x0: 18, x1: 34, shift: 1.8, image: 'ab' }, { x0: 30, x1: 40, shift: 1.8, image: 'ab' }] }, r2] }).join(' ')).toMatch(/on top of each other/)
    expect(tunnelProblems({ ...TUNNEL, rounds: [{ ...r1, left: { x: 6, y: 5 }, right: { x: 94, y: 60 } }, r2] }).length).toBeGreaterThan(0)
  })
})
