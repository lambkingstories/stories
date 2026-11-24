/**
 * The logic of the three new games of "Johannes der Täufer" (`johannes`): `gebaerde` (field `gestures`), `abgeben` (field `giveAway`) and `zeigen` (field `pointing`). The arithmetic is pure
 * (no clock, no dice); the checks of the data (`gestureProblems`, `giveAwayProblems`, `pointProblems`) accept the samples and name what is wrong in damaged copies.
 */
import { describe, expect, it } from 'vitest'
import { johannesStars } from '@/utils/johannesGames'
import {
  gestureCheck,
  gestureHelp,
  gestureProblems,
  giveAwayProblems,
  giveCan,
  giveDone,
  giveGoal,
  giveHint,
  giveMove,
  giveNeedy,
  giveSlotAt,
  giveSlotX,
  giveSolve,
  pointAngle,
  pointHitBox,
  pointHitPx,
  pointLineLength,
  pointManCenter,
  pointOff,
  pointOnLine,
  pointProblems,
  pointTap
} from '@/utils/johannesNeu'
import type { GestureGame, GiveAwayGame, PointGame } from '@/utils/johannesNeu'
import { GESTURE, GIVE, POINT } from './johannesSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('johannesStars', () => {
  it('up to two mistakes three stars, up to four two stars, then one; a negative number counts as none', () => {
    expect([0, 1, 2].map(johannesStars)).toEqual([3, 3, 3])
    expect([3, 4].map(johannesStars)).toEqual([2, 2])
    expect([5, 9, 40].map(johannesStars)).toEqual([1, 1, 1])
    expect(johannesStars(-3)).toBe(3)
  })
})

// ================================================================ gebaerde
describe('gebaerde: show them', () => {
  const g = GESTURE
  it('the sample is playable', () => {
    expect(gestureProblems(g)).toEqual([])
  })

  it('round 1 wants "he saw something" (hand over the eyes), round 2 "he cannot speak" (hand on the mouth); the other two postures mean nothing', () => {
    expect(gestureCheck(g.rounds[0]!, 'sehen')).toBe(true)
    expect(gestureCheck(g.rounds[0]!, 'bauch')).toBe(false)
    expect(gestureCheck(g.rounds[0]!, 'mund')).toBe(false)
    expect(gestureCheck(g.rounds[1]!, 'mund')).toBe(true)
    expect(gestureCheck(g.rounds[1]!, 'sehen')).toBe(false)
    expect(gestureCheck(g.rounds[1]!, 'schlaf')).toBe(false)
    expect(g.rounds.map((r) => gestureHelp(r))).toEqual(['sehen', 'mund'])
  })

  it('the check names damaged data', () => {
    const four = copy(g)
    four.rounds[0]!.cards = ['bauch', 'sehen', 'schlaf', 'mund']
    expect(gestureProblems(four).join(' ')).toMatch(/round 1 needs exactly three cards/)
    const missing = copy(g)
    missing.rounds[1]!.cards = ['schlaf', 'bauch', 'sehen']
    expect(gestureProblems(missing).join(' ')).toMatch(/round 2: the right posture is not among the cards/)
    const twice = copy(g)
    twice.rounds[1]!.right = 'sehen'
    twice.rounds[1]!.cards = ['schlaf', 'bauch', 'sehen']
    expect(gestureProblems(twice).join(' ')).toMatch(/different right postures/)
    const second = copy(g)
    second.rounds[0]!.cards = ['mund', 'sehen', 'schlaf']
    expect(gestureProblems(second).join(' ')).toMatch(/second right answer/)
    const lost = copy(g)
    lost.rounds[0]!.cards = ['bauch', 'sehen', 'fisch']
    expect(gestureProblems(lost).join(' ')).toMatch(/fisch is no posture/)
    const near = copy(g) as GestureGame
    near.zacharias.x = 60
    expect(gestureProblems(near).join(' ')).toMatch(/on top of each other|Zacharias stands on the left/)
    const out = copy(g) as GestureGame
    out.crowd.x = 95
    expect(gestureProblems(out).join(' ')).toMatch(/the people lies outside the picture/)
  })
})

// ================================================================ abgeben
describe('abgeben: whoever has two gives one away', () => {
  const g = GIVE
  it('the sample is playable', () => {
    expect(giveAwayProblems(g)).toEqual([])
  })

  it('only who has more than one may give, and only to a neighbour inside the row', () => {
    expect(giveCan([2, 1, 0, 1], 0)).toBe(true)
    expect(giveCan([2, 1, 0, 1], 1)).toBe(false)
    expect(giveCan([2, 1, 0, 1], 2)).toBe(false)
    expect(giveCan([2, 1, 0, 1], 9)).toBe(false)
    expect(giveMove([2, 1, 0, 1], 0, 1)).toEqual([1, 2, 0, 1])
    expect(giveMove([2, 1, 0, 1], 0, -1)).toBe(null) // no neighbour on the left
    expect(giveMove([2, 1, 0, 1], 1, 1)).toBe(null) // he has only one
    expect(giveMove([1, 2, 0, 1], 1, 1)).toEqual([1, 1, 1, 1])
    expect(giveMove([0, 0, 4, 0, 1], 4, -1)).toBe(null)
    expect(giveMove([1, 1, 1, 2], 3, 1)).toBe(null) // no neighbour on the right
  })

  it('done is: everybody has exactly one', () => {
    expect(giveDone([1, 1, 1, 1])).toBe(true)
    expect(giveDone([2, 1, 0, 1])).toBe(false)
    expect(giveDone([])).toBe(false)
  })

  it('the shortest way: round 1 two moves, round 2 four moves; every step is allowed and the end is all ones', () => {
    for (const [start, len] of [[g.rounds[0]!.start, 2], [g.rounds[1]!.start, 4]] as const) {
      const way = giveSolve(start)!
      expect(way).toHaveLength(len)
      let cur: number[] = [...start]
      for (const s of way) {
        expect(Math.abs(s.from - s.to)).toBe(1)
        cur = giveMove(cur, s.from, s.to > s.from ? 1 : -1)!
        expect(cur).not.toBe(null)
      }
      expect(giveDone(cur)).toBe(true)
    }
    expect(giveSolve([1, 1, 1])).toEqual([])
  })

  it('the hint is the first step of a shortest way from the CURRENT state, also after a move of the child', () => {
    expect(giveHint([2, 1, 0, 1])).toEqual({ from: 0, to: 1 })
    expect(giveHint([1, 2, 0, 1])).toEqual({ from: 1, to: 2 })
    expect(giveHint([1, 1, 1, 1])).toBe(null)
    // a roundabout move (to the left, where nobody needs it) still has a way on
    expect(giveSolve([1, 2, 0, 1])).not.toBe(null)
    expect(giveSolve([0, 3, 0, 0, 0, 0])).toBe(null) // sums that are not the number of people have no way (here: 3 pieces for 6 people)
  })

  it('who starts with nothing counts once; the goal is 1 + 3', () => {
    expect(giveNeedy([2, 1, 0, 1])).toEqual([2])
    expect(giveNeedy([0, 0, 4, 0, 1])).toEqual([0, 1, 3])
    expect(giveGoal(g)).toBe(4)
  })

  it('the slots: evenly spread, a place finds its slot (outside nothing)', () => {
    expect(giveSlotX(4, 0)).toBe(12.5)
    expect(giveSlotX(5, 4)).toBe(90)
    expect(giveSlotAt(5, 0)).toBe(0)
    expect(giveSlotAt(5, 39.9)).toBe(1)
    expect(giveSlotAt(5, 100)).toBe(4)
    expect(giveSlotAt(5, -1)).toBe(-1)
    expect(giveSlotAt(5, 101)).toBe(-1)
  })

  it('the check names damaged data', () => {
    const sum = copy(g)
    sum.rounds[0]!.start = [2, 1, 1, 1]
    expect(giveAwayProblems(sum).join(' ')).toMatch(/round 1: the number of pieces must be the number of people/)
    const solved = copy(g)
    solved.rounds[0]!.start = [1, 1, 1, 1]
    expect(giveAwayProblems(solved).join(' ')).toMatch(/round 1 is solved at the start|somebody must have nothing/)
    const short = copy(g)
    short.rounds[1]!.start = [0, 1, 2, 1, 1]
    expect(giveAwayProblems(short).join(' ')).toMatch(/round 2: the shortest way has 2 moves, 4 wanted/)
    const few = copy(g) as GiveAwayGame
    few.persons = few.persons.slice(0, 4)
    expect(giveAwayProblems(few).join(' ')).toMatch(/5 people are needed/)
    const narrow = copy(g) as GiveAwayGame
    narrow.layout.personW = 10
    expect(giveAwayProblems(narrow).join(' ')).toMatch(/narrower than 56 pixels/)
    const wide = copy(g) as GiveAwayGame
    wide.layout.personW = 22
    expect(giveAwayProblems(wide).join(' ')).toMatch(/stand on each other/)
    const low = copy(g) as GiveAwayGame
    low.layout.matY = 99
    expect(giveAwayProblems(low).join(' ')).toMatch(/mats lie outside the picture/)
  })
})

// ================================================================ zeigen
describe('zeigen: where does John point?', () => {
  const g = POINT
  const r1 = g.rounds[0]!
  const r2 = g.rounds[1]!
  it('the sample is playable', () => {
    expect(pointProblems(g)).toEqual([])
  })

  it('the angle from the finger tip: 0 is to the right, positive is up (the picture is wider than high)', () => {
    expect(pointAngle({ x: 10, y: 50 }, { x: 40, y: 50 })).toBeCloseTo(0, 5)
    expect(pointAngle({ x: 10, y: 50 }, { x: 40, y: 20 }, 1.5)).toBeCloseTo((Math.atan2(30, 45) * 180) / Math.PI, 5)
    expect(pointAngle({ x: 10, y: 50 }, { x: 40, y: 80 }, 1.5)).toBeLessThan(0)
    expect(pointAngle({ x: 10, y: 50 }, { x: 40, y: 20 }, 1)).toBeCloseTo(45, 5)
  })

  it('only Jesus lies on the line of the arm (within 7 degrees), all the others at least 21 degrees beside it, in both rounds', () => {
    for (const r of g.rounds) {
      for (const m of r.men) {
        const off = pointOff(g, r, m)
        if (m.id === 'jesus') {
          expect(off, m.id).toBeLessThanOrEqual(7)
          expect(pointOnLine(g, r, m)).toBe(true)
        } else {
          expect(off, m.id).toBeGreaterThanOrEqual(21)
          expect(pointOnLine(g, r, m)).toBe(false)
        }
      }
    }
    expect(pointTap(r1, 'jesus')).toBe(true)
    expect(pointTap(r1, 'bauer')).toBe(false)
    expect(pointTap(r2, 'hirte')).toBe(false)
  })

  it('the centre of a man is half his height above his feet; the finger target is at least 44 pixels each way on a phone (width 360)', () => {
    const jesus = r1.men[0]!
    const c = pointManCenter(g, jesus)
    expect(c.x).toBe(jesus.x)
    expect(c.y).toBeLessThan(jesus.y)
    for (const r of g.rounds)
      for (const m of r.men) {
        const px = pointHitPx(g, m)
        expect(px.w).toBeGreaterThanOrEqual(44)
        expect(px.h).toBeGreaterThanOrEqual(44)
        const b = pointHitBox(g, m)
        expect((b.w / 100) * 360).toBeGreaterThanOrEqual(43.99)
        expect((b.h / 100) * 240).toBeGreaterThanOrEqual(43.99)
      }
  })

  it('the help line runs from the finger tip to the edge of the picture and meets Jesus', () => {
    for (const r of g.rounds) {
      const len = pointLineLength(g, r)
      expect(len).toBeGreaterThan(20)
      const a = (r.angle * Math.PI) / 180
      const endX = r.tip.x + len * Math.cos(a)
      const endY = r.tip.y - (len * Math.sin(a)) / 1.5
      expect(endX).toBeLessThanOrEqual(100.0001)
      expect(endY).toBeGreaterThanOrEqual(-0.0001)
      expect(endY).toBeLessThanOrEqual(100.0001)
      const c = pointManCenter(g, r.men.find((m) => m.id === r.right)!)
      expect(c.x).toBeLessThanOrEqual(endX)
    }
  })

  it('the check names damaged data', () => {
    const near = copy(g) as PointGame
    near.rounds[0]!.men[1]!.x = 45 // the fisher moves up to the line
    near.rounds[0]!.men[1]!.y = 64
    expect(pointProblems(near).join(' ')).toMatch(/round 1: fischer is only [\d.]+ degrees beside the line/)
    const off = copy(g) as PointGame
    off.rounds[1]!.angle = 25
    expect(pointProblems(off).join(' ')).toMatch(/round 2: the right man is [\d.]+ degrees beside the line/)
    const three = copy(g) as PointGame
    three.rounds[1]!.men.pop()
    expect(pointProblems(three).join(' ')).toMatch(/round 2 needs 4 men/)
    const lamb = copy(g) as PointGame
    lamb.rounds[0]!.men[2]!.label = 'ein Hirte mit Lamm'
    expect(pointProblems(lamb).join(' ')).toMatch(/carries an animal/)
    const nobody = copy(g) as PointGame
    nobody.rounds[0]!.right = 'petrus'
    expect(pointProblems(nobody).join(' ')).toMatch(/the man he points at is not there/)
    const touch = copy(g) as PointGame
    touch.rounds[1]!.men[3]!.x = 43
    touch.rounds[1]!.men[3]!.y = 85
    expect(pointProblems(touch).join(' ')).toMatch(/finger targets of .* touch/)
    const noDisciples = copy(g) as PointGame
    delete noDisciples.rounds[1]!.disciples
    expect(pointProblems(noDisciples).join(' ')).toMatch(/round 2 needs the two disciples/)
    const lost = copy(g) as PointGame
    lost.rounds[1]!.disciples!.follow = { x: 90, y: 0 }
    expect(pointProblems(lost).join(' ')).toMatch(/disciples leave the picture/)
    const thin = copy(g) as PointGame
    thin.rounds[0]!.men[2]!.w = 9
    expect(pointProblems(thin).join(' ')).toMatch(/bauer is narrower than 38 pixels/)
    const tip = copy(g) as PointGame
    tip.rounds[0]!.tip = { x: 120, y: 57 }
    expect(pointProblems(tip).join(' ')).toMatch(/finger tip lies outside the picture/)
  })
})
