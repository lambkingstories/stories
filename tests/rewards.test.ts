/**
 * "My game room": the gold cup of a journey unlocks its reward games (`REWARD_GAMES`); every listed stage exists, has a real game (no quiz,
 * no painting) and is not "soon"; bronze and silver unlock nothing; the games of a memory always lie in a full grid.
 */
import { describe, expect, it } from 'vitest'
import { abraham } from '@/data/adventures/abraham'
import { adamEva } from '@/data/adventures/adamEva'
import { babel } from '@/data/adventures/babel'
import { daniel } from '@/data/adventures/daniel'
import { david } from '@/data/adventures/david'
import { elia } from '@/data/adventures/elia'
import { gideon } from '@/data/adventures/gideon'
import { jakob } from '@/data/adventures/jakob'
import { jona } from '@/data/adventures/jona'
import { josef } from '@/data/adventures/josef'
import { josua } from '@/data/adventures/josua'
import { mose } from '@/data/adventures/mose'
import { noah } from '@/data/adventures/noah'
import { rut } from '@/data/adventures/rut'
import { salomo } from '@/data/adventures/salomo'
import { samuel } from '@/data/adventures/samuel'
import { REWARD_GAMES } from '@/data/adventures/rewardGames'
import { cupOf, rewardGameTotal, unlockedGames } from '@/utils/rewards'
import type { Journey, JourneyProgress } from '@/types/adventure'

const ALL: Journey[] = [adamEva, noah, babel, abraham, jakob, josef, mose, josua, gideon, rut, samuel, david, elia, jona, daniel, salomo]

/** A progress with the exam done and so many stars and right answers that the share of the possible points is about `share`. */
function progressFor(j: Journey, share: number): JourneyProgress {
  const stages: JourneyProgress['stages'] = {}
  for (const s of j.stages) if (!s.soon) stages[s.id] = { stars: Math.round(3 * share), done: true }
  return { stages, exam: { correct: Math.round(j.exam.length * share), total: j.exam.length } }
}

describe('reward games', () => {
  it('every journey with a list has real games on the listed stages', () => {
    for (const j of ALL) {
      const ids = REWARD_GAMES[j.id]
      expect(ids, j.id).toBeTruthy()
      expect(ids!.length, j.id).toBeGreaterThanOrEqual(1)
      for (const id of ids!) {
        const s = j.stages.find((x) => x.id === id)
        expect(s, `${j.id} ${id}`).toBeTruthy()
        expect(s!.soon, `${j.id} ${id}`).toBeFalsy()
        expect(s!.task.kind, `${j.id} ${id}`).not.toBe('quiz')
        expect(s!.task.kind, `${j.id} ${id}`).not.toBe('ausmalen')
      }
    }
    expect(Object.keys(REWARD_GAMES).sort()).toEqual(ALL.map((j) => j.id).sort())
  })

  it('without a cup nothing is unlocked; the gold cup unlocks the listed games of that journey only', () => {
    const none = () => undefined
    expect(unlockedGames(ALL, none)).toEqual([])
    const only = (id: string, share: number) => (jid: string) => (jid === id ? progressFor(ALL.find((j) => j.id === id)!, share) : undefined)
    const josuaGold = unlockedGames(ALL, only('josua', 1))
    expect(cupOf(josua, only('josua', 1)('josua'))).toBe('gold')
    expect(josuaGold.map((g) => [g.journeyId, g.stageId])).toEqual(REWARD_GAMES.josua!.map((id) => ['josua', id]))
    // silver and bronze give the coloring picture, but no game
    expect(unlockedGames(ALL, only('josua', 0.8))).toEqual([])
    expect(unlockedGames(ALL, only('josua', 0.55))).toEqual([])
  })

  it('the total counts every listed game', () => {
    expect(rewardGameTotal(ALL)).toBe(Object.values(REWARD_GAMES).reduce((n, l) => n + l.length, 0))
  })

  it('every memory has a full board: 6, 8, 12 or 16 cards in a rectangle', () => {
    for (const j of ALL) {
      for (const s of j.stages) {
        const m = s.task.memory
        if (!m) continue
        expect([4, 6, 8, 9, 12, 16], `${j.id} ${s.id}`).toContain(m.pairs.length * 2)
      }
    }
  })
})
