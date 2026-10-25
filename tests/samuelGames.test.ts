/**
 * The pure parts of the new games of "Samuel und Saul": the fitting robe, the drifting cart, the middle between two landmarks, the order of the places, the piles that can hide a tall man and the men who walk away.
 */
import { describe, expect, it } from 'vitest'
import {
  atEdge,
  canHide,
  coatFits,
  coatMiss,
  daysPassed,
  driftStep,
  driftVelocity,
  DRIFT_PATTERN,
  DRIFT_SEGMENT_MS,
  dueLeaves,
  fittingCoat,
  hidingSpots,
  midpoint,
  nextPlace,
  NUDGE,
  nudge,
  onRoad,
  ROAD_HALF,
  stoneOk,
  stoneSide,
  untouchedMs,
  waitOver,
  walkProgress,
  walkX,
  WALK_MS,
  wayProgress
} from '@/utils/samuelGames'

describe('the little robe', () => {
  it('a robe fits when it is the ratio of the boy wide, with a little room', () => {
    expect(coatFits(16, 20, 0.8)).toBe(true)
    expect(coatFits(17, 20, 0.8)).toBe(true)
    expect(coatFits(13.5, 20, 0.8)).toBe(false)
    expect(coatFits(18.5, 20, 0.8)).toBe(false)
  })

  it('exactly one of a small, a fitting and a big robe is found; none or two give -1', () => {
    expect(fittingCoat([11.5, 16, 20.8], 20, 0.8)).toBe(1)
    expect(fittingCoat([20.8, 11.5, 16], 20, 0.8)).toBe(2)
    expect(fittingCoat([11, 12], 20, 0.8)).toBe(-1)
    expect(fittingCoat([16, 16.2], 20, 0.8)).toBe(-1)
  })

  it('says too small or too big for a wrong robe', () => {
    expect(coatMiss(11.5, 20, 0.8)).toBe('small')
    expect(coatMiss(20.8, 20, 0.8)).toBe('big')
    expect(coatMiss(16, 20, 0.8)).toBe('fits')
  })
})

describe('two cows pull home', () => {
  it('the cows are drawn to one side for a whole segment, then the pattern goes on', () => {
    const a = driftVelocity(0, 20)
    expect(a).toBe(20 * DRIFT_PATTERN[0]!)
    expect(driftVelocity(DRIFT_SEGMENT_MS - 1, 20)).toBe(a)
    expect(driftVelocity(DRIFT_SEGMENT_MS * 2, 20)).toBe(20 * DRIFT_PATTERN[2]!)
    expect(driftVelocity(DRIFT_SEGMENT_MS * DRIFT_PATTERN.length, 20)).toBe(a)
    expect(driftVelocity(-50, 20)).toBe(a)
  })

  it('a drift step moves the cart in the direction of the pull, as far as speed times time', () => {
    expect(driftStep(0, 1000, 0, 30)).toBeCloseTo(30 * DRIFT_PATTERN[0]!)
    expect(driftStep(10, 500, DRIFT_SEGMENT_MS * 2, 30)).toBeCloseTo(10 + 15 * DRIFT_PATTERN[2]!)
  })

  it('a tap nudges to the side that was tapped; the road ends at the edge', () => {
    expect(nudge(0, 'left')).toBe(-NUDGE)
    expect(nudge(10, 'right')).toBe(10 + NUDGE)
    expect(onRoad(0)).toBe(true)
    expect(onRoad(ROAD_HALF)).toBe(true)
    expect(onRoad(ROAD_HALF + 1)).toBe(false)
    expect(onRoad(-ROAD_HALF - 1)).toBe(false)
    expect(onRoad(95, 10)).toBe(false)
  })

  it('the way is a share of its length', () => {
    expect(wayProgress(0, 10000)).toBe(0)
    expect(wayProgress(5000, 10000)).toBe(0.5)
    expect(wayProgress(20000, 10000)).toBe(1)
    expect(wayProgress(5, 0)).toBe(1)
  })

  it('without a tap the cart reaches the grass after some time: a stronger pull sooner; none at all never', () => {
    expect(untouchedMs(24)).toBeGreaterThan(DRIFT_SEGMENT_MS)
    expect(untouchedMs(40)).toBeLessThan(untouchedMs(24))
    expect(untouchedMs(0)).toBe(Infinity)
  })
})

describe('the stone of help', () => {
  it('the middle lies half way', () => {
    expect(midpoint(20, 80)).toBe(50)
    expect(midpoint(80, 20)).toBe(50)
  })

  it('eight percent of the distance too far to one side is still right, more is not', () => {
    expect(stoneOk(50, 20, 80)).toBe(true)
    expect(stoneOk(54.5, 20, 80)).toBe(true)
    expect(stoneOk(45.5, 20, 80)).toBe(true)
    expect(stoneOk(55.5, 20, 80)).toBe(false)
    expect(stoneOk(44, 20, 80)).toBe(false)
    expect(stoneOk(50, 80, 20)).toBe(true)
  })

  it('names the landmark the stone is too near to, or that it stands outside', () => {
    expect(stoneSide(50, 20, 80)).toBe('ok')
    expect(stoneSide(30, 20, 80)).toBe('a')
    expect(stoneSide(70, 20, 80)).toBe('b')
    expect(stoneSide(10, 20, 80)).toBe('outside')
    expect(stoneSide(90, 20, 80)).toBe('outside')
  })
})

describe('follow the donkeys', () => {
  it('the next place comes from the order; at the end there is none', () => {
    const order = [2, 0, 4, 1, 3]
    expect(nextPlace(order, 0)).toBe(2)
    expect(nextPlace(order, 3)).toBe(1)
    expect(nextPlace(order, 5)).toBe(-1)
    expect(nextPlace(order, -1)).toBe(-1)
  })
})

describe('where is Saul', () => {
  it('only a pile that is as tall as Saul can hide him', () => {
    expect(canHide(30, 28)).toBe(true)
    expect(canHide(28, 28)).toBe(true)
    expect(canHide(20, 28)).toBe(false)
    expect(hidingSpots([14, 30, 20, 34, 28], 28)).toEqual([1, 3, 4])
  })
})

describe('hold the people together', () => {
  it('counts the days', () => {
    expect(daysPassed(0, 4000)).toBe(0)
    expect(daysPassed(3999, 4000)).toBe(0)
    expect(daysPassed(12000, 4000)).toBe(3)
    expect(daysPassed(5, 0)).toBe(0)
  })

  it('a man who has not begun to leave stands at home; he reaches the edge after the walking time', () => {
    expect(walkProgress(5000, null)).toBe(0)
    expect(walkProgress(1000, 1000)).toBe(0)
    expect(walkProgress(1000 + WALK_MS / 2, 1000)).toBeCloseTo(0.5)
    expect(atEdge(walkProgress(1000 + WALK_MS, 1000))).toBe(true)
    expect(atEdge(0.99)).toBe(false)
  })

  it('walks from his place to the edge in the direction he runs', () => {
    expect(walkX(30, -1, 0)).toBe(30)
    expect(walkX(30, -1, 1)).toBe(-8)
    expect(walkX(30, 1, 1)).toBe(108)
    expect(walkX(30, 1, 0.5)).toBeCloseTo(69)
    expect(walkX(30, 1, 7)).toBe(108)
  })

  it('the waiting is over after all days; the leaves that are due are found once', () => {
    expect(waitOver(11999, 3, 4000)).toBe(false)
    expect(waitOver(12000, 3, 4000)).toBe(true)
    const leaves = [{ man: 0, at: 1000 }, { man: 2, at: 5000 }, { man: 1, at: 9000 }]
    expect(dueLeaves(leaves, 500, new Set())).toEqual([])
    expect(dueLeaves(leaves, 5200, new Set())).toEqual([0, 1])
    expect(dueLeaves(leaves, 5200, new Set([0]))).toEqual([1])
  })
})
