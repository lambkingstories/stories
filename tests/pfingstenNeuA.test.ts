/**
 * The pure logic of three games of "Pfingsten": "To the uttermost part of the earth" (`zeugen`), "Everyone hears it" (`sprachen`) and "Fill the baskets" (`koerbe`),
 * with their checks of the data (`witnessProblems`, `tonguesProblems`, `fillProblems`).
 */
import { describe, expect, it } from 'vitest'
import {
  fillFits,
  fillHelp,
  fillProblems,
  fillSolvable,
  pfDist,
  tonguesFits,
  tonguesLandAt,
  tonguesProblems,
  witnessDrop,
  witnessProblems,
  witnessRelease,
  witnessRingAt,
  witnessSpot
} from '@/utils/pfingstenNeuA'
import { FILL, TONGUES, WITNESS } from './pfingstenSamples'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('zeugen: to the uttermost part of the earth', () => {
  it('a point lies in a ring (the middle is ring 0), outside the last ring is -1', () => {
    expect(witnessRingAt(WITNESS, { x: 50, y: 50 })).toBe(0)
    expect(witnessRingAt(WITNESS, { x: 50 + 20, y: 50 })).toBe(1)
    expect(witnessRingAt(WITNESS, { x: 50, y: 50 - 30 })).toBe(2)
    expect(witnessRingAt(WITNESS, { x: 50 + 47, y: 50 })).toBe(3)
    expect(witnessRingAt(WITNESS, { x: 99, y: 99 })).toBe(-1)
    expect(pfDist({ x: 0, y: 0 }, { x: 3, y: 6 }, 1.5)).toBeCloseTo(5, 6)
  })

  it('round 1: only the next place of the verse into the next ring', () => {
    expect(witnessDrop(0, 0, 0)).toBe('ok')
    expect(witnessDrop(1, 1, 1)).toBe('ok')
    expect(witnessDrop(1, 2, 2)).toBe('wrong')
    expect(witnessDrop(1, 1, 2)).toBe('wrong')
    expect(witnessDrop(1, 2, 1)).toBe('wrong')
  })

  it('round 2: letting go before the band is short, in the band right, past it too far', () => {
    expect(witnessRelease(WITNESS, 1, 18)).toBe('short')
    expect(witnessRelease(WITNESS, 1, 21)).toBe('ok')
    expect(witnessRelease(WITNESS, 1, 25)).toBe('ok')
    expect(witnessRelease(WITNESS, 1, 29)).toBe('ok')
    expect(witnessRelease(WITNESS, 1, 30)).toBe('far')
    expect(witnessRelease(WITNESS, 3, 48)).toBe('ok')
  })

  it('every medallion sits in the middle of its own ring', () => {
    expect(witnessSpot(WITNESS, 0)).toEqual({ x: 50, y: 50 })
    for (let i = 1; i < 4; i++) expect(witnessRingAt(WITNESS, witnessSpot(WITNESS, i)), `place ${i}`).toBe(i)
  })

  it('the check finds nothing in good data and names every fault', () => {
    expect(witnessProblems(WITNESS)).toEqual([])
    const bad = clone(WITNESS)
    bad.rings = [12, 14, 37, 55]
    bad.places.pop()
    bad.band = 1
    bad.placeW = 8
    bad.rounds = [bad.rounds[1]!, bad.rounds[0]!]
    const p = witnessProblems(bad).join(' | ')
    expect(p).toMatch(/4 rings but 3 places/)
    expect(p).toMatch(/ring 2 is too near ring 1/)
    expect(p).toMatch(/does not fit into the picture/)
    expect(p).toMatch(/band is too narrow/)
    expect(p).toMatch(/medallions are too small/)
    expect(p).toMatch(/round 1 orders/)
  })
})

describe('sprachen: everyone hears it', () => {
  it('a point lies on a land (the circle is round on the screen), elsewhere -1; a guest fits only his own land', () => {
    expect(tonguesLandAt(TONGUES.lands, { x: 15, y: 30 })).toBe(0)
    expect(tonguesLandAt(TONGUES.lands, { x: 15, y: 30 + 11 })).toBe(0)
    expect(tonguesLandAt(TONGUES.lands, { x: 15, y: 30 + 13 })).toBe(-1)
    expect(tonguesLandAt(TONGUES.lands, { x: 60, y: 10 })).toBe(-1)
    expect(tonguesFits(TONGUES.guests[0]!, TONGUES.lands[0]!)).toBe(true)
    expect(tonguesFits(TONGUES.guests[0]!, TONGUES.lands[1]!)).toBe(false)
  })

  it('the check finds nothing in good data and names every fault', () => {
    expect(tonguesProblems(TONGUES)).toEqual([])
    const bad = clone(TONGUES)
    bad.lands[1]!.x = 18
    bad.lands[1]!.y = 32
    bad.lands[2]!.r = 4
    bad.guests[3]!.land = 'pontus'
    bad.rounds[1]!.guests = ['rom']
    bad.rounds[0]!.showHome = false
    const p = tonguesProblems(bad).join(' | ')
    expect(p).toMatch(/lands rom and kreta overlap/)
    expect(p).toMatch(/aegypten: the circle is too small/)
    expect(p).toMatch(/the land "pontus" is not on the map/)
    expect(p).toMatch(/round 2: fewer than two guests/)
    expect(p).toMatch(/round 2 should have more guests/)
    expect(p).toMatch(/round 1 shows the home pictures/)
  })
})

describe('koerbe: fill the baskets', () => {
  it('a gift fits as long as the family does not get more than it needs', () => {
    expect(fillFits(3, 0, 3)).toBe(true)
    expect(fillFits(3, 1, 2)).toBe(true)
    expect(fillFits(3, 2, 2)).toBe(false)
    expect(fillFits(1, 0, 2)).toBe(false)
  })

  it('both rounds can be shared out exactly; a wrong start cannot', () => {
    expect(fillSolvable([1, 2, 3], [1, 1, 2, 2])).toBe(true)
    expect(fillSolvable([2, 3, 4, 5], [1, 1, 2, 2, 3, 5])).toBe(true)
    expect(fillSolvable([3, 3], [2, 2, 2])).toBe(false)
    expect(fillSolvable([2, 2], [1, 1, 1])).toBe(false)
  })

  it('"Help me" gives a move that keeps everything possible, and nothing when a gift must be taken back', () => {
    const h = fillHelp([1, 2, 3], [0, 0, 0], [1, 1, 2, 2])!
    expect(h).not.toBeNull()
    const free = [1, 1, 2, 2]
    const rest = [1, 2, 3]
    rest[h.family] = rest[h.family]! - free[h.gift]!
    expect(fillSolvable(rest, free.filter((_, k) => k !== h.gift))).toBe(true)
    // a 1 into the family that needs 3: then the 3 fits nowhere
    expect(fillHelp([2, 3], [0, 1], [1, 3])).toBeNull()
  })

  it('the check finds nothing in good data and names every fault', () => {
    expect(fillProblems(FILL)).toEqual([])
    const bad = clone(FILL)
    bad.rounds[0]!.gifts = [1, 1, 2]
    bad.rounds[1]!.gifts = [4, 1, 2, 2, 3, 2]
    bad.rounds[1]!.families = bad.rounds[0]!.families
    const p = fillProblems(bad).join(' | ')
    expect(p).toMatch(/round 1: the gifts \(4\) do not add up to the needs \(6\)/)
    expect(p).toMatch(/round 2: no picture for a gift of 4/)
    expect(p).toMatch(/round 2 should have more families/)
  })
})
