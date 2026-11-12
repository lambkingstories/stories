/**
 * The logic of the three new games of "Die Bergpredigt" (`bergpredigt`): `selig` (field `blessed`), `scheffel` (field `lightStand`) and `nahblick` (field `nearView`). The arithmetic is pure
 * (no clock, no dice); the checks of the data (`blessedProblems`, `lightStandProblems`, `nearViewProblems`) accept the samples and name what is wrong in damaged copies.
 */
import { describe, expect, it } from 'vitest'
import { bergStars } from '@/utils/bergpredigtGames'
import {
  BLESSED_ROUND_MAX_MS,
  bergDist,
  blessedGiftOf,
  blessedHeight,
  blessedHelp,
  blessedPersonAt,
  blessedPersonPx,
  blessedPlace,
  blessedProblems,
  blessedRoundMs,
  blessedSentenceOf,
  blessedStrangers,
  lightCentre,
  lightDark,
  lightHelp,
  lightReaches,
  lightSolvers,
  lightSpotAt,
  lightSpotOf,
  lightStandProblems,
  nearActive,
  nearCover,
  nearHelp,
  nearHitRadius,
  nearMostCovered,
  nearOverlap,
  nearTap,
  nearToClose,
  nearViewProblems,
  nearVisible
} from '@/utils/bergpredigtNeu'
import type { BlessedGame, LightStandGame, NearViewGame } from '@/utils/bergpredigtNeu'
import { BLESSED, LIGHT, NEAR } from './bergpredigtSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('bergStars', () => {
  it('up to two mistakes three stars, up to four two stars, then one; a negative number counts as none', () => {
    expect([0, 1, 2].map(bergStars)).toEqual([3, 3, 3])
    expect([3, 4].map(bergStars)).toEqual([2, 2])
    expect([5, 9, 40].map(bergStars)).toEqual([1, 1, 1])
    expect(bergStars(-3)).toBe(3)
  })
})

describe('bergDist', () => {
  it('shortens the vertical difference by the ratio of the picture', () => {
    expect(bergDist({ x: 0, y: 0 }, { x: 30, y: 0 }, 1.5)).toBeCloseTo(30)
    expect(bergDist({ x: 0, y: 0 }, { x: 0, y: 30 }, 1.5)).toBeCloseTo(20)
  })
})

// ================================================================ selig
describe('selig: the gifts and the listeners', () => {
  const g = BLESSED
  it('the sample is playable', () => {
    expect(blessedProblems(g)).toEqual([])
  })

  it('every listener has exactly one gift; two gifts belong to nobody; every listener has his sentence', () => {
    expect(g.people.map((p) => blessedGiftOf(g, p.id)!.id)).toEqual(['gabe-himmelreich', 'gabe-trost', 'gabe-land', 'gabe-brot'])
    expect(blessedStrangers(g).map((x) => x.id)).toEqual(['ablenker-truhe', 'ablenker-mantel'])
    expect(g.people.map((p) => blessedSentenceOf(g, p.id)!.text.startsWith('Selig sind'))).toEqual([true, true, true, true])
  })

  it('a gift on a listener: right, a gift of nobody, a gift of another listener, a listener who has his gift already', () => {
    expect(blessedPlace(g, 'gabe-trost', 'frau-traenen', [])).toBe('ok')
    expect(blessedPlace(g, 'gabe-trost', 'hirte', [])).toBe('wrong')
    expect(blessedPlace(g, 'ablenker-truhe', 'hirte', [])).toBe('stranger')
    expect(blessedPlace(g, 'gabe-trost', 'frau-traenen', ['frau-traenen'])).toBe('taken')
    expect(blessedPlace(g, 'nichts', 'hirte', [])).toBe('wrong')
    expect(blessedPlace(g, 'gabe-trost', 'niemand', [])).toBe('wrong')
  })

  it('a gift let go on a listener is given to him; beside the listeners it is no gift; where two figures overlap the nearer middle counts', () => {
    expect(blessedPersonAt(g, { x: 36, y: 60 })).toBe('mann-leer')
    expect(blessedPersonAt(g, { x: 66, y: 55 })).toBe('frau-traenen')
    expect(blessedPersonAt(g, { x: 5, y: 5 })).toBeNull()
    expect(blessedPersonAt(g, { x: 90, y: 90 })).toBeNull()
    expect(blessedPersonAt(g, { x: 46, y: 50 })).toBe('junger-mann')
    expect(blessedHeight(g, g.people[0]!)).toBeCloseTo((22 * 1.5) / 0.889, 3)
  })

  it('"Help me": round 1 names the listener of the sentence that is on, round 2 the listener of the gift in the hand or the next one in the order', () => {
    expect(blessedHelp(g, 0, [])).toEqual({ personId: 'mann-leer', giftId: 'gabe-himmelreich' })
    expect(blessedHelp(g, 0, ['mann-leer'])).toEqual({ personId: 'frau-traenen', giftId: 'gabe-trost' })
    expect(blessedHelp(g, 1, [], 'gabe-land')).toEqual({ personId: 'hirte', giftId: 'gabe-land' })
    expect(blessedHelp(g, 1, [], 'ablenker-truhe')).toEqual({ personId: 'mann-leer', giftId: 'gabe-himmelreich' })
    expect(blessedHelp(g, 1, ['mann-leer', 'hirte'], 'gabe-land')).toEqual({ personId: 'frau-traenen', giftId: 'gabe-trost' })
    expect(blessedHelp(g, 1, ['mann-leer', 'frau-traenen', 'hirte', 'junger-mann'])).toBeNull()
    expect(blessedHelp(g, 5, [])).toBeNull()
  })

  it('a round takes a calm child at most seventy seconds; round 2 is longer (the sentences are read again)', () => {
    expect(blessedRoundMs(g, 0)).toBeLessThanOrEqual(BLESSED_ROUND_MAX_MS)
    expect(blessedRoundMs(g, 1)).toBeLessThanOrEqual(BLESSED_ROUND_MAX_MS)
    expect(blessedRoundMs(g, 1)).toBeGreaterThan(blessedRoundMs(g, 0))
  })

  it('the listeners are finger targets of at least 44 pixels on a phone', () => {
    for (const p of g.people) {
      const px = blessedPersonPx(g, p)
      expect(px.w, p.id).toBeGreaterThanOrEqual(44)
      expect(px.h, p.id).toBeGreaterThanOrEqual(44)
    }
  })
})

describe('selig: the check of the data names what is wrong', () => {
  const bad = (change: (g: BlessedGame) => void): string => {
    const g = copy(BLESSED)
    change(g)
    return blessedProblems(g).join('|')
  }
  it('four listeners, six gifts (four for one listener each, two for nobody), as many sentences as listeners', () => {
    expect(bad((g) => g.people.pop())).toMatch(/four listeners/)
    expect(bad((g) => (g.people[1]!.id = 'mann-leer'))).toMatch(/same id/)
    expect(bad((g) => g.gifts.pop())).toMatch(/six gifts/)
    expect(bad((g) => (g.gifts[4]!.forPerson = 'hirte'))).toMatch(/exactly one gift|two gifts must belong to nobody/)
    expect(bad((g) => (g.gifts[0]!.forPerson = 'hirte'))).toMatch(/needs exactly one gift/)
    expect(bad((g) => (g.gifts[1]!.forPerson = 'wer'))).toMatch(/not there/)
    expect(bad((g) => g.sentences.pop())).toMatch(/one sentence for each listener/)
    expect(bad((g) => (g.sentences[1]!.personId = 'mann-leer'))).toMatch(/same listener/)
    expect(bad((g) => (g.sentences[0]!.text = ''))).toMatch(/has no text/)
  })
  it('the listeners are big enough, lie in the picture and do not sit on top of each other', () => {
    expect(bad((g) => (g.people[3]!.w = 8))).toMatch(/smaller than 44/)
    expect(bad((g) => (g.people[0]!.x = 95))).toMatch(/lies outside the picture/)
    expect(bad((g) => ((g.people[1]!.x = g.people[0]!.x), (g.people[1]!.y = g.people[0]!.y)))).toMatch(/sit on top of each other/)
  })
  it('two rounds: the sentences, then the free choice; every listener once in the order; the help solves every state', () => {
    expect(bad((g) => g.rounds.pop())).toMatch(/two rounds/)
    expect(bad((g) => (g.rounds[0]!.mode = 'free'))).toMatch(/round 1 is the round of the sentences/)
    expect(bad((g) => (g.rounds[1]!.mode = 'sentence'))).toMatch(/round 2 is the round of the free choice/)
    expect(bad((g) => (g.rounds[0]!.order = ['hirte', 'mann-leer', 'frau-traenen', 'junger-mann']))).toMatch(/follows the order of the sentences/)
    expect(bad((g) => (g.rounds[1]!.order = ['hirte', 'hirte', 'frau-traenen', 'junger-mann']))).toMatch(/names every listener once/)
    expect(bad((g) => (g.rounds[0]!.hint = ''))).toMatch(/round 1 has no hint/)
  })
  it('the pictures are there', () => {
    expect(bad((g) => (g.background = ''))).toMatch(/no picture of the meadow/)
    expect(bad((g) => (g.glow = ''))).toMatch(/no picture of the glow/)
    expect(bad((g) => (g.gifts[0]!.caption = ''))).toMatch(/no label or caption/)
  })
})

// ================================================================ scheffel
describe('scheffel: the light', () => {
  const g = LIGHT
  const r1 = g.rooms[0]!
  const r2 = g.rooms[1]!
  it('the sample is playable', () => {
    expect(lightStandProblems(g)).toEqual([])
  })

  it('the lamp on the floor and on the table leaves somebody in the dark; only the lampstand reaches everybody (in both rooms)', () => {
    expect(lightDark(g, r1, 'boden').map((p) => p.id)).toEqual(['mutter', 'kind'])
    expect(lightDark(g, r1, 'tisch').map((p) => p.id)).toEqual(['kind'])
    expect(lightDark(g, r1, 'leuchter')).toEqual([])
    expect(lightSolvers(g, r1)).toEqual(['leuchter'])
    expect(lightSolvers(g, r2)).toEqual(['leuchter'])
    expect(lightDark(g, r2, 'boden').length).toBeGreaterThanOrEqual(3)
    expect(lightDark(g, r2, 'tisch').length).toBeGreaterThanOrEqual(1)
  })

  it('the light is a circle round the place; a person is in it when his middle is', () => {
    const tisch = lightSpotOf(r1, 'tisch')!
    const mutter = r1.people[0]!
    expect(lightReaches(g, tisch, mutter)).toBe(true)
    expect(lightReaches(g, { ...tisch, radius: 5 }, mutter)).toBe(false)
    expect(lightCentre(g, mutter).x).toBe(74)
    expect(lightCentre(g, mutter).y).toBeLessThan(84)
    expect(lightSpotOf(r1, 'leuchter')!.radius).toBeGreaterThan(tisch.radius)
  })

  it('a lamp let go near a place stands there; far from every place it stays where it was', () => {
    expect(lightSpotAt(g, r2, { x: 40, y: 90 })).toBe('boden')
    expect(lightSpotAt(g, r2, { x: 50, y: 40 })).toBe('leuchter')
    expect(lightSpotAt(g, r2, { x: 48, y: 64 })).toBe('tisch')
    expect(lightSpotAt(g, r2, { x: 85, y: 5 })).toBeNull()
  })

  it('"Help me": the basket first, then the lampstand; in a room without a basket the lampstand', () => {
    expect(lightHelp(g, 0, false)).toBe('basket')
    expect(lightHelp(g, 0, true)).toBe('leuchter')
    expect(lightHelp(g, 1, false)).toBe('leuchter')
    expect(lightHelp(g, 9, false)).toBeNull()
  })
})

describe('scheffel: the check of the data names what is wrong', () => {
  const bad = (change: (g: LightStandGame) => void): string => {
    const g = copy(LIGHT)
    change(g)
    return lightStandProblems(g).join('|')
  }
  it('two rooms with two and five people; the three places; only the lampstand may reach everybody', () => {
    expect(bad((g) => g.rooms.pop())).toMatch(/two rooms/)
    expect(bad((g) => g.rooms[0]!.people.pop())).toMatch(/room 1 needs 2 people/)
    expect(bad((g) => g.rooms[1]!.people.pop())).toMatch(/room 2 needs 5 people/)
    expect(bad((g) => g.rooms[1]!.spots.pop())).toMatch(/the floor, the table and the lampstand/)
    expect(bad((g) => (g.rooms[1]!.spots[1]!.radius = 90))).toMatch(/only the lampstand must reach everybody/)
    expect(bad((g) => (g.rooms[1]!.spots[2]!.radius = 8))).toMatch(/only the lampstand must reach everybody \(now: nobody\)/)
    expect(bad((g) => (g.rooms[0]!.spots[2]!.radius = 8))).toMatch(/room 1: only the lampstand/)
  })
  it('the table leaves somebody in the dark; the floor leaves one (room 1) or three (room 2) in the dark', () => {
    expect(bad((g) => (g.rooms[1]!.spots[0]!.radius = 60))).toMatch(/the floor must leave at least 3 in the dark/)
    expect(bad((g) => (g.rooms[0]!.spots[0]!.radius = 60))).toMatch(/the floor must leave at least 1 in the dark/)
    expect(bad((g) => (g.rooms[1]!.spots[1]!.radius = 60))).toMatch(/the table must leave at least one person in the dark/)
  })
  it('the places are far enough from each other for a finger and not under a person; the basket lies over the lamp in room 1', () => {
    expect(bad((g) => ((g.rooms[0]!.spots[1]!.x = 47), (g.rooms[0]!.spots[1]!.y = 90)))).toMatch(/too close for a finger/)
    expect(bad((g) => ((g.rooms[0]!.spots[1]!.x = 74), (g.rooms[0]!.spots[1]!.y = 70)))).toMatch(/stands on the place/)
    expect(bad((g) => delete g.rooms[0]!.basket)).toMatch(/room 1 needs the basket/)
    expect(bad((g) => (g.rooms[0]!.basket!.w = 3))).toMatch(/basket is too small/)
  })
  it('the pictures and the hints are there', () => {
    expect(bad((g) => (g.lampOn = ''))).toMatch(/need pictures/)
    expect(bad((g) => (g.rooms[0]!.bright = ''))).toMatch(/no picture of the lit room/)
    expect(bad((g) => (g.rooms[1]!.hint = ''))).toMatch(/room 2 has no hint/)
    expect(bad((g) => (g.rooms[1]!.people[0]!.x = 99))).toMatch(/lies outside the picture/)
    expect(bad((g) => (g.rooms[1]!.people[1]!.id = g.rooms[1]!.people[0]!.id))).toMatch(/same id/)
  })
})

// ================================================================ nahblick
describe('nahblick: the wreath', () => {
  const g = NEAR
  const r1 = g.rounds[0]!
  const r2 = g.rounds[1]!
  it('the sample is playable', () => {
    expect(nearViewProblems(g)).toEqual([])
  })

  it('how much of a blossom the wreath covers: all, none, a lens of two equal circles, a small wreath over a big blossom', () => {
    expect(nearOverlap(15, 5, 0)).toBe(1)
    expect(nearOverlap(15, 5, 30)).toBe(0)
    expect(nearOverlap(10, 10, 10)).toBeCloseTo(0.391, 2)
    expect(nearOverlap(5, 15, 0)).toBeCloseTo(25 / 225, 5)
    expect(nearOverlap(15, 5, 12)).toBeGreaterThan(0.7)
    expect(nearOverlap(15, 5, 12)).toBeLessThan(1)
    expect(nearOverlap(15, 5, 18)).toBeGreaterThan(0.1)
    expect(nearOverlap(15, 5, 18)).toBeLessThan(0.5)
    expect(nearOverlap(15, 0, 3)).toBe(0)
  })

  it('the wreath shows the blossom it covers most, if it covers at least half; hidden blossoms are never shown; round 2 shows all', () => {
    expect(nearActive(g, r1, { x: 12, y: 24 })?.id).toBe('b1')
    expect(nearActive(g, r1, { x: 37, y: 24 })?.id).toBe('b3')
    expect(nearActive(g, r1, { x: 50, y: 50 })).toBeNull()
    expect(nearActive(g, r1, { x: 56, y: 74 })).toBeNull()
    expect(nearActive(g, r2, { x: 56, y: 74 })?.id).toBe('b4')
    // between two blossoms the one that is covered more wins
    expect(nearActive(g, r2, { x: 22, y: 24 })?.id).toBe('b1')
    expect(nearActive(g, r2, { x: 28, y: 24 })?.id).toBe('b3')
    expect(nearCover(g, { x: 12, y: 24 }, g.blooms[0]!)).toBe(1)
    expect(nearVisible(r1)).toEqual(['b1', 'b2', 'b3'])
    expect(nearVisible(r2)).toHaveLength(7)
  })

  it('the wreath never shows more than two blossoms at once (a search over the whole picture)', () => {
    expect(nearMostCovered(g, r1)).toBeLessThanOrEqual(2)
    expect(nearMostCovered(g, r2)).toBeLessThanOrEqual(2)
    expect(nearMostCovered(g, r2)).toBeGreaterThanOrEqual(1)
  })

  it('a place of the picture in the close-up: the middle of the wreath is the middle of the close-up; outside the circle is outside', () => {
    const c = nearToClose(g, { x: 30, y: 40 }, { x: 30, y: 40 })
    expect(c).toEqual({ nx: 50, ny: 50, inside: true })
    const right = nearToClose(g, { x: 30, y: 40 }, { x: 30 + 34 * 0.4, y: 40 })
    expect(right.nx).toBeCloseTo(100, 5)
    expect(right.inside).toBe(true)
    expect(nearToClose(g, { x: 30, y: 40 }, { x: 30 + 20, y: 40 }).inside).toBe(false)
    // downwards the circle is 1.5 times as high in percent of the height
    expect(nearToClose(g, { x: 30, y: 40 }, { x: 30, y: 40 + 17 * 1.5 }).inside).toBe(true)
    expect(nearToClose(g, { x: 30, y: 40 }, { x: 30, y: 40 + 18 * 1.5 }).inside).toBe(false)
  })

  it('a tap in the wreath meets the guest, the blossom (beside the guest or without one), or nothing', () => {
    const at = (nx: number, ny: number, c = { x: 12, y: 24 }) => ({ x: c.x + ((nx - 50) / 100) * 27.2, y: c.y + ((ny - 50) / 100) * 27.2 * 1.5 })
    expect(nearTap(g, r1, { x: 12, y: 24 }, at(68, 70))).toBe('guest')
    expect(nearTap(g, r1, { x: 12, y: 24 }, at(68 + 22, 70))).toBe('guest') // a finger is bigger than the guest
    expect(nearTap(g, r1, { x: 12, y: 24 }, { x: 12, y: 24 })).toBe('bloom')
    expect(nearTap(g, r1, { x: 24, y: 74 }, { x: 24, y: 74 })).toBe('bloom') // a blossom without a guest
    expect(nearTap(g, r1, { x: 12, y: 24 }, { x: 40, y: 24 })).toBe('out')
    expect(nearTap(g, r1, { x: 50, y: 50 }, { x: 50, y: 50 })).toBe('none') // no blossom under the wreath
    expect(nearHitRadius(g, 40)).toBe(24)
    expect(nearHitRadius(g, 10)).toBeGreaterThanOrEqual(22)
  })

  it('"Help me" shows the blossom with a guest that has not been found, nearest to the wreath; nothing when all are found; hidden ones never', () => {
    expect(nearHelp(g, r1, [], { x: 12, y: 24 })?.id).toBe('b1')
    expect(nearHelp(g, r1, [], { x: 40, y: 24 })?.id).toBe('b3')
    expect(nearHelp(g, r1, ['b1'], { x: 12, y: 24 })?.id).toBe('b3')
    expect(nearHelp(g, r1, ['b1', 'b3'], { x: 12, y: 24 })).toBeNull()
    expect(nearHelp(g, r2, [], { x: 90, y: 24 })?.id).toBe('b7')
    const hid = copy(r1)
    hid.hidden = ['b1', 'b4', 'b5', 'b6', 'b7']
    expect(nearHelp(g, hid, [], { x: 12, y: 24 })?.id).toBe('b3')
  })
})

describe('nahblick: the check of the data names what is wrong', () => {
  const bad = (change: (g: NearViewGame) => void): string => {
    const g = copy(NEAR)
    change(g)
    return nearViewProblems(g).join('|')
  }
  it('seven blossoms, each with a close-up, a free place for a guest that lies in the circle of the wreath and is big enough', () => {
    expect(bad((g) => g.blooms.pop())).toMatch(/seven blossoms/)
    expect(bad((g) => (g.blooms[1]!.id = 'b1'))).toMatch(/same id/)
    expect(bad((g) => (g.blooms[0]!.nearImage = ''))).toMatch(/no close-up/)
    expect(bad((g) => (g.blooms[0]!.x = 98))).toMatch(/lies outside the picture/)
    expect(bad((g) => (g.blooms[0]!.spot = { nx: 90, ny: 90, nw: 40 }))).toMatch(/outside the circle of the wreath/)
    expect(bad((g) => (g.blooms[0]!.spot = { nx: 50, ny: 50, nw: 10 }))).toMatch(/smaller than 36 pixels/)
  })
  it('the wreath: a sensible size; it must show a blossom at half; it may not cover three blossoms at once', () => {
    expect(bad((g) => (g.wreath.w = 12))).toMatch(/between 20 and 40/)
    expect(bad((g) => (g.wreath.minCover = 0.95))).toMatch(/minCover/)
    expect(bad((g) => (g.wreath.w = 40))).toMatch(/more than two blossoms at once/)
  })
  it('round 1: three blossoms to be seen, two guests; round 2: seven blossoms, four guests, three blossoms without one; no guest under the haze; one kind of guest once', () => {
    expect(bad((g) => g.rounds[0]!.sits.pop())).toMatch(/round 1 needs exactly 2 guests/)
    expect(bad((g) => g.rounds[1]!.sits.pop())).toMatch(/round 2 needs exactly 4 guests/)
    expect(bad((g) => (g.rounds[0]!.hidden = ['b4', 'b5', 'b6']))).toMatch(/round 1 shows three blossoms/)
    expect(bad((g) => (g.rounds[0]!.sits[0]!.bloomId = 'b5'))).toMatch(/cannot be reached/)
    expect(bad((g) => (g.rounds[1]!.sits[1]!.bloomId = 'b2'))).toMatch(/two guests sit on one blossom/)
    expect(bad((g) => (g.rounds[1]!.sits[1]!.guestId = 'schmetterling'))).toMatch(/one kind of guest twice/)
    expect(bad((g) => (g.rounds[1]!.sits[0]!.guestId = 'wespe'))).toMatch(/is no guest/)
    expect(bad((g) => (g.rounds[1]!.hidden = ['b7']))).toMatch(/round 2 shows all seven blossoms/)
    expect(bad((g) => g.rounds.pop())).toMatch(/two rounds/)
    expect(bad((g) => (g.rounds[0]!.hint = ''))).toMatch(/round 1 has no hint/)
  })
  it('the haze lies well to the right of the blossoms that can be seen', () => {
    expect(bad((g) => (g.blooms[3]!.x = 44))).toMatch(/hidden blossoms must lie well to the right/)
  })
  it('the pictures are there; at least four guests', () => {
    expect(bad((g) => (g.haze = ''))).toMatch(/no picture of the haze/)
    expect(bad((g) => (g.background = ''))).toMatch(/no picture of the meadow/)
    expect(bad((g) => g.guests.pop())).toMatch(/at least four guests/)
    expect(bad((g) => (g.guests[0]!.label = ''))).toMatch(/needs a picture and a label/)
  })
})
