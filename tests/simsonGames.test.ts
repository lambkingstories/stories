/**
 * The logic of the three new games of "Simson" (`simson`): `meiden` (field `avoid`), `raetsel` (field `riddle`) and `torheben` (field `gateLift`). The arithmetic is pure (no clock, no dice);
 * the checks of the data (`avoidProblems`, `riddleProblems`, `gateLiftProblems`) accept the samples and name what is wrong in damaged copies.
 */
import { describe, expect, it } from 'vitest'
import { simsonStars } from '@/utils/simsonGames'
import {
  AVOID_BANNED_IDS,
  avoidAnswer,
  avoidHelp,
  avoidProblems,
  avoidRight,
  avoidTargetAt,
  avoidTargetOf,
  avoidItem,
  gateFree,
  gateHelp,
  gateHitPx,
  gateLiftProblems,
  gateLoadTop,
  gateSolve,
  gateTry,
  inBox,
  riddleCheck,
  riddleHelp,
  riddleProblems,
  riddleStepAt,
  riddleStepBox,
  riddleWanted
} from '@/utils/simsonNeu'
import type { AvoidGame, GateLiftGame, RiddleGame } from '@/utils/simsonNeu'
import { AVOID, GATE, RIDDLE } from './simsonSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

describe('simsonStars', () => {
  it('up to two mistakes three stars, up to four two stars, then one; a negative number counts as none', () => {
    expect([0, 1, 2].map(simsonStars)).toEqual([3, 3, 3])
    expect([3, 4].map(simsonStars)).toEqual([2, 2])
    expect([5, 9, 40].map(simsonStars)).toEqual([1, 1, 1])
    expect(simsonStars(-3)).toBe(3)
  })
})

describe('inBox', () => {
  it('a box is its middle and its size; the edge counts, a little more with `grow`', () => {
    const b = { x: 50, y: 50, w: 20, h: 10 }
    expect(inBox(b, { x: 60, y: 55 })).toBe(true)
    expect(inBox(b, { x: 61, y: 50 })).toBe(false)
    expect(inBox(b, { x: 61, y: 50 }, 2)).toBe(true)
  })
})

// ================================================================ meiden
describe('meiden: what the woman may eat and drink', () => {
  const g = AVOID
  it('the sample is playable', () => {
    expect(avoidProblems(g)).toEqual([])
  })

  it('the angel forbade wine and strong drink, and everything that comes from the vine (grapes, raisins, grape juice); bread, figs, olives, water and milk are allowed', () => {
    const banned = g.items.filter((i) => i.kind === 'nicht').map((i) => i.id)
    expect(banned.sort()).toEqual([...AVOID_BANNED_IDS].sort())
    expect(g.items.filter((i) => i.kind === 'darf').map((i) => i.id)).toEqual(['wasser', 'milch', 'brot', 'feigen', 'oliven'])
    expect(g.items.filter((i) => i.vine).map((i) => i.id)).toEqual(['rosinen', 'traubensaft'])
    expect(avoidTargetOf(avoidItem(g, 'wein')!)).toBe('tuch')
    expect(avoidTargetOf(avoidItem(g, 'milch')!)).toBe('korb')
  })

  it('the answers: allowed in the basket, forbidden aside, from the vine aside; a forbidden thing in the basket and an allowed one aside are wrong', () => {
    expect(avoidAnswer(g, 'wasser', 'korb')).toBe('ok')
    expect(avoidAnswer(g, 'wein', 'tuch')).toBe('banned')
    expect(avoidAnswer(g, 'rosinen', 'tuch')).toBe('vine')
    expect(avoidAnswer(g, 'traubensaft', 'tuch')).toBe('vine')
    expect(avoidAnswer(g, 'trauben', 'tuch')).toBe('banned')
    expect(avoidAnswer(g, 'wein', 'korb')).toBe('wrongBanned')
    expect(avoidAnswer(g, 'wasser', 'tuch')).toBe('wrongAllowed')
    expect(avoidAnswer(g, 'gibtsnicht', 'korb')).toBe('wrongAllowed')
    expect(['ok', 'banned', 'vine'].every((a) => avoidRight(a as never))).toBe(true)
    expect(['wrongBanned', 'wrongAllowed'].some((a) => avoidRight(a as never))).toBe(false)
  })

  it('a thing let go on the basket or the cloth (a little beside counts too); elsewhere nothing', () => {
    expect(avoidTargetAt(g, { x: 18, y: 72 })).toBe('korb')
    expect(avoidTargetAt(g, { x: 80, y: 74 })).toBe('tuch')
    expect(avoidTargetAt(g, { x: 3, y: 72 })).toBe('korb') // 2 beside the edge of the basket
    expect(avoidTargetAt(g, { x: 50, y: 10 })).toBe(null)
  })

  it('the help shows the next thing of the round and its place; it solves both rounds without a mistake', () => {
    expect(avoidHelp(g, 0, [])).toEqual({ itemId: 'wasser', target: 'korb' })
    expect(avoidHelp(g, 0, ['wasser'])).toEqual({ itemId: 'wein', target: 'tuch' })
    expect(avoidHelp(g, 0, ['wasser', 'wein', 'milch', 'starkes'])).toBe(null)
    expect(avoidHelp(g, 5, [])).toBe(null)
    for (let r = 0; r < 2; r++) {
      const done: string[] = []
      for (;;) {
        const h = avoidHelp(g, r, done)
        if (!h) break
        expect(avoidRight(avoidAnswer(g, h.itemId, h.target))).toBe(true)
        done.push(h.itemId)
      }
      expect(done).toHaveLength(g.rounds[r]!.itemIds.length)
    }
  })

  it('the check names damaged data', () => {
    const allowedWine = copy(g)
    allowedWine.items.find((i) => i.id === 'wein')!.kind = 'darf'
    expect(avoidProblems(allowedWine).join(' ')).toMatch(/wein: comes from the vine or is strong drink/)
    const forbiddenBread = copy(g)
    forbiddenBread.items.find((i) => i.id === 'brot')!.kind = 'nicht'
    expect(avoidProblems(forbiddenBread).join(' ')).toMatch(/brot: the angel did not forbid it/)
    const sorted = copy(g)
    sorted.rounds[0]!.itemIds = ['wasser', 'milch', 'wein', 'starkes']
    expect(avoidProblems(sorted).join(' ')).toMatch(/round 1: the things stand sorted/)
    const small = copy(g) as AvoidGame
    small.basket.box.w = 8
    expect(avoidProblems(small).join(' ')).toMatch(/basket is smaller than 44/)
    const near = copy(g)
    near.cloth.box.x = 40
    expect(avoidProblems(near).join(' ')).toMatch(/too close together/)
    const lost = copy(g)
    lost.rounds[1]!.itemIds = ['brot', 'trauben', 'feigen', 'rosinen', 'oliven', 'wein']
    expect(avoidProblems(lost).join(' ')).toMatch(/a thing comes twice|traubensaft is never used/)
    const covered = copy(g)
    covered.woman.x = 18
    covered.woman.y = 80
    expect(avoidProblems(covered).join(' ')).toMatch(/woman covers the basket/)
  })
})

// ================================================================ raetsel
describe('raetsel: sweet and strong', () => {
  const g = RIDDLE
  const r1 = g.rounds[0]!
  const r2 = g.rounds[1]!
  it('the sample is playable', () => {
    expect(riddleProblems(g)).toEqual([])
  })

  it('the stair is filled from the top down: honey first, then grapes, then bread; the lion is the strongest', () => {
    expect(riddleWanted(r1, 0)).toBe(2)
    expect(riddleCheck(r1, 0, 'karte-honig')).toBe(true)
    expect(riddleCheck(r1, 0, 'karte-trauben')).toBe(false)
    expect(riddleCheck(r1, 1, 'karte-trauben')).toBe(true)
    expect(riddleCheck(r1, 2, 'karte-brot')).toBe(true)
    expect(riddleCheck(r1, 3, 'karte-brot')).toBe(false)
    expect(riddleCheck(r2, 0, 'karte-loewe')).toBe(true)
    expect(riddleCheck(r2, 1, 'karte-esel')).toBe(true)
    expect(riddleHelp(r2, 0)).toBe('karte-loewe')
    expect(riddleHelp(r2, 3)).toBe('karte-hase')
    expect(riddleHelp(r2, 4)).toBe(null)
  })

  it('the steps stand one over the other, every higher one a little narrower; a place finds its step', () => {
    const b0 = riddleStepBox(g, 0)
    const b3 = riddleStepBox(g, 3)
    expect(b3.y).toBeLessThan(b0.y)
    expect(b3.w).toBeLessThan(b0.w)
    expect(riddleStepAt(g, r2, { x: b0.x, y: b0.y })).toBe(0)
    expect(riddleStepAt(g, r2, { x: b3.x, y: b3.y })).toBe(3)
    expect(riddleStepAt(g, r1, { x: b3.x, y: b3.y })).toBe(null) // round 1 has three steps
    expect(riddleStepAt(g, r2, { x: 10, y: 10 })).toBe(null)
  })

  it('the check names damaged data', () => {
    const ordered = copy(g)
    ordered.rounds[0]!.mix = ['karte-brot', 'karte-trauben', 'karte-honig']
    expect(riddleProblems(ordered).join(' ')).toMatch(/round 1: the mix lies already in order/)
    const lost = copy(g)
    lost.rounds[1]!.mix = ['karte-esel', 'karte-hase', 'karte-loewe']
    expect(riddleProblems(lost).join(' ')).toMatch(/round 2: the mix must hold every card once/)
    const twice = copy(g)
    twice.rounds[0]!.cards[1]!.id = 'karte-brot'
    expect(riddleProblems(twice).join(' ')).toMatch(/two cards have the same id/)
    const small = copy(g) as RiddleGame
    small.ladder.w = 20
    expect(riddleProblems(small).join(' ')).toMatch(/smaller than 44 pixels/)
    const high = copy(g) as RiddleGame
    high.ladder.y = 60
    expect(riddleProblems(high).join(' ')).toMatch(/lies outside the picture/)
    const swapped = copy(g)
    swapped.rounds.reverse()
    expect(riddleProblems(swapped).join(' ')).toMatch(/round 1 asks for the sweetest/)
  })
})

// ================================================================ torheben
describe('torheben: lift out the gate', () => {
  const g = GATE
  const r1 = g.rounds[0]!
  const r2 = g.rounds[1]!
  it('the sample is playable', () => {
    expect(gateLiftProblems(g)).toEqual([])
  })

  it('first the bar, then a door, then its post; what still holds cannot be lifted', () => {
    expect(gateFree(r2, [], 'riegel')).toBe(true)
    expect(gateFree(r2, [], 'fluegel-links')).toBe(false)
    expect(gateTry(r2, [], 'fluegel-links')).toBe('held')
    expect(gateTry(r2, ['riegel'], 'fluegel-links')).toBe('ok')
    expect(gateTry(r2, ['riegel'], 'pfosten-links')).toBe('held')
    expect(gateTry(r2, ['riegel', 'fluegel-links'], 'pfosten-links')).toBe('ok')
    expect(gateTry(r2, ['riegel', 'fluegel-links'], 'pfosten-rechts')).toBe('held')
    expect(gateTry(r2, ['riegel'], 'riegel')).toBe('gone')
    expect(gateFree(r2, [], 'gibtsnicht')).toBe(false)
  })

  it('the help names the next free part; it lifts the whole gate without a mistake', () => {
    expect(gateHelp(r1, [])).toBe('riegel')
    expect(gateHelp(r1, ['riegel'])).toBe('fluegel-links')
    expect(gateSolve(r1)).toEqual(['riegel', 'fluegel-links', 'fluegel-rechts'])
    expect(gateSolve(r2)).toEqual(['riegel', 'fluegel-links', 'fluegel-rechts', 'pfosten-links', 'pfosten-rechts'])
    expect(gateHelp(r2, gateSolve(r2)!)).toBe(null)
  })

  it('the narrow bar has a finger target of at least 44 pixels; the load grows upwards and stays in the picture', () => {
    const bar = r2.parts[0]!
    const px = gateHitPx(g, bar)
    expect(px.h).toBeGreaterThanOrEqual(44)
    expect(px.w).toBeGreaterThanOrEqual(44)
    expect(gateLoadTop(g, 5)).toBeLessThan(gateLoadTop(g, 1))
    expect(gateLoadTop(g, 5)).toBeGreaterThan(0)
  })

  it('the check names damaged data: a circle, a part that holds itself, a part that is not there, nothing to think about', () => {
    const circle = copy(g)
    circle.rounds[0]!.parts[0]!.holds = ['fluegel-links']
    expect(gateLiftProblems(circle).join(' ')).toMatch(/round 1: no part is free at the start|cannot be lifted/)
    const self = copy(g)
    self.rounds[1]!.parts[3]!.holds = ['pfosten-links']
    expect(gateLiftProblems(self).join(' ')).toMatch(/pfosten-links holds itself/)
    const ghost = copy(g)
    ghost.rounds[1]!.parts[1]!.holds = ['kette']
    expect(gateLiftProblems(ghost).join(' ')).toMatch(/held by kette, which is not there/)
    const free = copy(g)
    for (const p of free.rounds[0]!.parts) p.holds = []
    expect(gateLiftProblems(free).join(' ')).toMatch(/every part is free at the start/)
    const onSamson = copy(g) as GateLiftGame
    onSamson.rounds[1]!.parts[3]!.x = 20
    expect(gateLiftProblems(onSamson).join(' ')).toMatch(/pfosten-links lies on Samson/)
    const tall = copy(g) as GateLiftGame
    tall.shoulder.step = 14
    expect(gateLiftProblems(tall).join(' ')).toMatch(/over the edge of the picture/)
  })
})
