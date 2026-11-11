/**
 * The logic of the two new games of "Jesus erzählt von sich" (`ichbin`): `wehen` (field `breeze`) and `hirtenruf` (field `herdCall`). The arithmetic is pure (no clock, no dice);
 * the checks of the data (`breezeProblems`, `herdCallProblems`) accept the samples and name what is wrong in damaged copies.
 */
import { describe, expect, it } from 'vitest'
import { ichbinStars } from '@/utils/ichbinGames'
import {
  BREEZE_GAP_MS,
  BREEZE_LEAF_TRAVEL,
  HERD_FLAT,
  breezeAnswer,
  breezeEnd,
  breezeLean,
  breezeLeafOffset,
  breezePose,
  breezeProblems,
  breezeRoundMs,
  breezeSign,
  breezeTabletOf,
  breezeTurns,
  breezeWindAt,
  herdAnswer,
  herdCallProblems,
  herdFigureSpots,
  herdFlockCentre,
  herdFromShepherd,
  herdHeard,
  herdNextRing,
  herdSmallestRing,
  herdTrialMs,
  ichbinDist
} from '@/utils/ichbinNeu'
import type { BreezeGame, BreezeGust, HerdCallGame } from '@/utils/ichbinNeu'
import { BREEZE, HERD } from './ichbinSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('ichbinStars', () => {
  it('up to two mistakes three stars, up to four two stars, then one; a negative number counts as none', () => {
    expect([0, 1, 2].map(ichbinStars)).toEqual([3, 3, 3])
    expect([3, 4].map(ichbinStars)).toEqual([2, 2])
    expect([5, 9, 40].map(ichbinStars)).toEqual([1, 1, 1])
    expect(ichbinStars(-3)).toBe(3)
  })
})

describe('ichbinDist', () => {
  it('shortens the vertical difference by the ratio of the picture', () => {
    expect(ichbinDist({ x: 0, y: 0 }, { x: 30, y: 0 }, 1.5)).toBeCloseTo(30)
    expect(ichbinDist({ x: 0, y: 0 }, { x: 0, y: 30 }, 1.5)).toBeCloseTo(20)
  })
})

describe('wehen: the gusts', () => {
  const plainLeft: BreezeGust = { dir: 'left', ms: 2500 }
  const turn: BreezeGust = { dir: 'left', turnTo: 'right', ms: 2600 }
  const calm: BreezeGust = { dir: 'calm', ms: 2500 }

  it('the samples are playable', () => {
    expect(breezeProblems(BREEZE)).toEqual([])
  })

  it('the answer is where the wind blows at the END of the gust; the calm is the middle tablet', () => {
    expect(breezeEnd(plainLeft)).toBe('left')
    expect(breezeEnd(turn)).toBe('right')
    expect(breezeEnd(calm)).toBe('calm')
    expect(breezeAnswer(plainLeft)).toBe('left')
    expect(breezeAnswer(turn)).toBe('right')
    expect(breezeAnswer(calm)).toBe('still')
    expect(breezeTabletOf('right')).toBe('right')
    expect(breezeSign('left')).toBe(-1)
    expect(breezeSign('right')).toBe(1)
    expect(breezeSign('calm')).toBe(0)
    expect(breezeSign(undefined)).toBe(0)
    expect(breezeTurns(turn)).toBe(true)
    expect(breezeTurns(plainLeft)).toBe(false)
    expect(breezeTurns(calm)).toBe(false)
    expect(breezeTurns({ dir: 'left', turnTo: 'left', ms: 2600 })).toBe(false)
  })

  it('the wind of a turning gust blows one way, then turns smoothly round the middle and blows the other way', () => {
    expect(breezeWindAt(turn, 0)).toBe(-1)
    expect(breezeWindAt(turn, 1000)).toBe(-1)
    expect(breezeWindAt(turn, 1300)).toBeCloseTo(0)
    expect(breezeWindAt(turn, 1700)).toBe(1)
    expect(breezeWindAt(turn, 2600)).toBe(1)
    expect(breezeWindAt(calm, 1000)).toBe(0)
    expect(breezeWindAt(plainLeft, 500)).toBe(-1)
  })

  it('the things swing in over a short time, lean the way the wind blows and keep the end lean when the gust is over', () => {
    expect(breezeLean(plainLeft, 0)).toBe(0)
    expect(breezeLean(plainLeft, 175)).toBeCloseTo(-0.5)
    expect(breezeLean(plainLeft, 400)).toBe(-1)
    expect(breezeLean(plainLeft, 2500)).toBe(-1)
    expect(breezeLean(plainLeft, 9000)).toBe(-1)
    expect(breezeLean(turn, 1300)).toBeCloseTo(0)
    expect(breezeLean(turn, 2000)).toBe(1)
    expect(breezeLean(turn, 5000)).toBe(1)
    expect(breezeLean(calm, 1000)).toBe(0)
    expect(breezeLean(calm, 5000)).toBe(0)
  })

  it('a thing with three pictures shows "still" while it hardly leans', () => {
    expect(breezePose(0)).toBe('still')
    expect(breezePose(0.29)).toBe('still')
    expect(breezePose(-0.29)).toBe('still')
    expect(breezePose(-0.31)).toBe('left')
    expect(breezePose(1)).toBe('right')
  })

  it('the leaf drifts with the wind: left to the left, right to the right, a turned wind brings it back, in the calm it stays', () => {
    expect(breezeLeafOffset(plainLeft, 0)).toBe(0)
    expect(breezeLeafOffset(plainLeft, 2500)).toBeCloseTo(-BREEZE_LEAF_TRAVEL, 0)
    expect(breezeLeafOffset({ dir: 'right', ms: 2500 }, 2500)).toBeCloseTo(BREEZE_LEAF_TRAVEL, 0)
    expect(Math.abs(breezeLeafOffset(turn, 2600))).toBeLessThan(2)
    expect(breezeLeafOffset(turn, 1300)).toBeLessThan(-10)
    expect(breezeLeafOffset(calm, 2500)).toBe(0)
    expect(breezeLeafOffset(plainLeft, 99999)).toBeCloseTo(breezeLeafOffset(plainLeft, 2500))
  })

  it('the length of a round: every gust and the gap after it', () => {
    expect(breezeRoundMs(BREEZE.rounds[0]!)).toBe(4 * (2500 + BREEZE_GAP_MS))
    expect(breezeRoundMs(BREEZE.rounds[1]!)).toBeLessThanOrEqual(40000)
  })

  it('"Help me" names the right tablet in every gust of the samples (so every gust can be solved without a mistake)', () => {
    for (const r of BREEZE.rounds) for (const g of r.gusts) expect(['left', 'still', 'right']).toContain(breezeAnswer(g))
  })
})

describe('wehen: the check of the data names what is wrong', () => {
  const bad = (change: (g: BreezeGame) => void): string[] => {
    const g = copy(BREEZE)
    change(g)
    return breezeProblems(g)
  }

  it('round 1 needs two gusts to each side and no three in a row', () => {
    expect(bad((g) => (g.rounds[0]!.gusts = g.rounds[0]!.gusts.map((x) => ({ ...x, dir: 'left' as const })))).join('|')).toMatch(/at least two gusts end to the right/)
    expect(bad((g) => (g.rounds[0]!.gusts = [{ dir: 'left', ms: 2500 }, { dir: 'left', ms: 2500 }, { dir: 'left', ms: 2500 }, { dir: 'right', ms: 2500 }, { dir: 'right', ms: 2500 }])).join('|')).toMatch(/three gusts in a row end the same way/)
    expect(bad((g) => (g.rounds[0]!.gusts = g.rounds[0]!.gusts.slice(0, 3))).join('|')).toMatch(/at least four gusts/)
    expect(bad((g) => (g.rounds[0]!.gusts[0] = { dir: 'calm', ms: 2500 })).join('|')).toMatch(/only plain gusts/)
  })

  it('round 2 needs exactly three turns and exactly one calm, and does not begin with the calm', () => {
    expect(bad((g) => (g.rounds[1]!.gusts[0] = { dir: 'left', ms: 2500 })).join('|')).toMatch(/exactly three gusts in which the wind turns/)
    expect(bad((g) => (g.rounds[1]!.gusts[3] = { dir: 'right', ms: 2500 })).join('|')).toMatch(/exactly one calm gust/)
    expect(bad((g) => g.rounds[1]!.gusts.unshift({ dir: 'calm', ms: 2500 })).join('|')).toMatch(/does not begin with the calm/)
    expect(bad((g) => (g.rounds[1]!.gusts[0] = { dir: 'left', turnTo: 'left', ms: 2600 })).join('|')).toMatch(/must turn to the other side/)
    expect(bad((g) => (g.rounds[1]!.gusts[3] = { dir: 'calm', turnTo: 'left', ms: 2500 })).join('|')).toMatch(/calm gust cannot turn/)
  })

  it('the ask lines, the lengths of the gusts and of the round', () => {
    expect(bad((g) => (g.rounds[0]!.ask = 'now')).join('|')).toMatch(/round 1 asks/)
    expect(bad((g) => (g.rounds[1]!.ask = 'blown')).join('|')).toMatch(/round 2 asks/)
    expect(bad((g) => (g.rounds[0]!.gusts[1]!.ms = 1000)).join('|')).toMatch(/2 to 3.2 seconds/)
    expect(bad((g) => g.rounds[1]!.gusts.push(...Array.from({ length: 4 }, (_, i) => ({ dir: i % 2 ? ('left' as const) : ('right' as const), ms: 3200 })))).join('|')).toMatch(/lasts longer than 40 seconds/)
    expect(bad((g) => (g.rounds[1]!.gusts[0]!.ms = 2000)).join('|')).toMatch(/at least 2.4 seconds/)
  })

  it('the tablets are a finger target of at least 56 pixels, all three pictures exist', () => {
    expect(bad((g) => (g.tabletW = 12)).join('|')).toMatch(/narrower than 56 pixels/)
    expect(bad((g) => (g.tablets.still = '')).join('|')).toMatch(/tablet "still"/)
    expect(bad((g) => (g.background = '')).join('|')).toMatch(/no picture of the courtyard/)
  })

  it('the wind is read from several things: flame, cloth, twig and grass; a flame needs both leaning pictures; nothing lies outside the picture', () => {
    expect(bad((g) => (g.things = g.things.filter((t) => t.kind !== 'grass'))).join('|')).toMatch(/no "grass"/)
    expect(bad((g) => delete g.things[0]!.images).join('|')).toMatch(/needs a picture for leaning left/)
    expect(bad((g) => (g.things[2]!.x = 95)).join('|')).toMatch(/lies outside the picture/)
    expect(bad((g) => (g.things[1]!.id = 'flamme')).join('|')).toMatch(/same id/)
    expect(bad((g) => g.rounds.pop()).join('|')).toMatch(/two rounds/)
  })
})

describe('hirtenruf: the rings', () => {
  const g = HERD

  it('the sample is playable', () => {
    expect(herdCallProblems(HERD)).toEqual([])
  })

  it('the first call reaches ring 0, every call within two seconds the next one, after the third it begins small again', () => {
    expect(herdNextRing(-1)).toBe(0)
    expect(herdNextRing(0)).toBe(1)
    expect(herdNextRing(1)).toBe(2)
    expect(herdNextRing(2)).toBe(0)
  })

  it('two sheep for each ring: two near, two in the middle distance, two far (measured on the flat ellipse of the ring)', () => {
    expect(g.sheep.map((s) => herdSmallestRing(g, s))).toEqual([0, 0, 1, 1, 2, 2])
    expect(g.sheep.map((s) => s.near)).toEqual([0, 0, 1, 1, 2, 2])
    expect(herdFromShepherd(g, { x: 14 + 20, y: 46 })).toBeCloseTo(20)
    // the flat ring: a step down counts more than a step to the side
    expect(herdFromShepherd(g, { x: 14, y: 46 + 6 })).toBeCloseTo(6 / (1.5 * HERD_FLAT))
  })

  it('the first call fetches the two nearest sheep, the second the next two, the third the far ones; nobody is fetched twice', () => {
    expect(herdHeard(g, 0, [])).toEqual(['s1', 's2'])
    expect(herdHeard(g, 1, ['s1', 's2'])).toEqual(['s3', 's4'])
    expect(herdHeard(g, 2, ['s1', 's2', 's3', 's4'])).toEqual(['s5', 's6'])
    // a call of the third ring after nothing fetches all six, the nearest first
    expect(herdHeard(g, 2, [])).toEqual(['s1', 's2', 's3', 's4', 's5', 's6'])
    // a call that reaches nobody new: "too quiet"
    expect(herdHeard(g, 0, ['s1', 's2'])).toEqual([])
    expect(herdHeard(g, 0, [])).not.toContain('s5')
  })
})

describe('hirtenruf: the callers in the fog', () => {
  const g = HERD
  const trials = g.rounds[1]!.trials!

  it('the shepherd stands left, right, left; the answer is his side', () => {
    expect(trials.map((t) => t.shepherdSide)).toEqual(['left', 'right', 'left'])
    expect(trials.map(herdAnswer)).toEqual(['left', 'right', 'left'])
  })

  it('in the first two passes the callers stand equally far from the sheep; in the third the stranger stands nearer than the shepherd', () => {
    const c = herdFlockCentre(g)
    const d = (i: number) => {
      const f = herdFigureSpots(g, trials[i]!)
      return { sh: ichbinDist(c, f.shepherd, 1.5), st: ichbinDist(c, f.stranger, 1.5), f }
    }
    expect(Math.abs(d(0).sh - d(0).st)).toBeLessThan(1)
    expect(Math.abs(d(1).sh - d(1).st)).toBeLessThan(1)
    expect(d(2).st).toBeLessThan(d(2).sh - 10)
    expect(d(2).f.strangerSide).toBe('right')
    expect(d(2).f.stranger.x).toBe(89 - 22)
    expect(d(0).f.shepherd.x).toBe(11)
    expect(d(1).f.shepherd.x).toBe(89)
  })

  it('a pass takes at most 25 seconds; a hesitant pass is a little longer', () => {
    expect(herdTrialMs(trials[0]!)).toBe(3600 + 2200)
    expect(herdTrialMs(trials[1]!)).toBe(3600 + 2200 + 1000)
    for (const t of trials) expect(herdTrialMs(t)).toBeLessThanOrEqual(25000)
  })
})

describe('hirtenruf: the check of the data names what is wrong', () => {
  const bad = (change: (g: HerdCallGame) => void): string => {
    const g = copy(HERD)
    change(g)
    return herdCallProblems(g).join('|')
  }

  it('round 1: six sheep that every ring can reach, two for each ring, as many places to gather as sheep, no places that overlap', () => {
    expect(bad((g) => g.sheep.pop())).toMatch(/six sheep/)
    expect(bad((g) => (g.sheep[5]!.x = 99)).replace(/ring 2/g, '')).toMatch(/no ring reaches it|lies outside/)
    expect(bad((g) => (g.sheep[0]!.x = 70, g.sheep[0]!.near = 2))).toMatch(/at least two sheep for each ring/)
    expect(bad((g) => (g.sheep[0]!.near = 1))).toMatch(/s1: says it is reached by ring 1 but ring 0/)
    expect(bad((g) => g.slots.pop())).toMatch(/as many places to gather/)
    expect(bad((g) => (g.slots[1] = { ...g.slots[0]! }))).toMatch(/places 1 and 2 to gather overlap/)
    expect(bad((g) => (g.sheep[4]!.w = 8))).toMatch(/smaller than 40 pixels/)
    expect(bad((g) => (g.radii = [30, 30, 85]))).toMatch(/each larger than the one before/)
    expect(bad((g) => (g.sheep[1]!.hearing = ''))).toMatch(/standing and a listening picture/)
  })

  it('round 2: three passes, the shepherd not always on one side and not three times in a row, the stranger nearer in the third', () => {
    expect(bad((g) => g.rounds[1]!.trials!.pop())).toMatch(/three passes/)
    expect(bad((g) => g.rounds[1]!.trials!.forEach((t) => (t.shepherdSide = 'left')))).toMatch(/same side in all three/)
    expect(bad((g) => (g.rounds[1]!.trials![2]!.strangerNear = false))).toMatch(/third pass the stranger/)
    expect(bad((g) => (g.nearShift = -5))).toMatch(/should stand nearer to the sheep/)
    expect(bad((g) => (g.sides.left.x = 20))).toMatch(/pass 1: the callers should stand equally far/)
    expect(bad((g) => (g.rounds[1]!.trials![0]!.delay = 1500))).toMatch(/start before both have called/)
    expect(bad((g) => (g.rounds[1]!.trials![0]!.delay = 24000))).toMatch(/lasts longer than 25 seconds/)
    expect(bad((g) => (g.sides.left.w = 10))).toMatch(/smaller than 56 x 56 pixels/)
    expect(bad((g) => (g.sides.right.x = 25))).toMatch(/the two callers overlap|outside/)
    expect(bad((g) => g.flock.pop())).toMatch(/flock of four/)
    expect(bad((g) => (g.gather.left[0] = { x: 70, y: 90, w: 14 }))).toMatch(/nearer to the caller/)
  })

  it('the rounds are the round of the growing ring and the round of the callers', () => {
    expect(bad((g) => (g.rounds[0]!.mode = 'who'))).toMatch(/round 1 is the round of the growing ring/)
    expect(bad((g) => (g.rounds[1]!.mode = 'radius'))).toMatch(/round 2 is the round of the callers/)
    expect(bad((g) => (g.fog = ['', '']))).toMatch(/two bands of haze/)
  })
})
