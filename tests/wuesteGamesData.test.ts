/**
 * The data of the four new games of "The People in the Desert" (`src/data/adventures/wuesteGames.ts`): every picture and sound exists, the places lie inside the picture, the rounds are consistent
 * (at most two, the cases and signals exist, the right seat exists for every kind of case), and the stages use the games.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARME, RICHTER, SIGNAL, TRAUBE } from '@/data/adventures/wuesteGames'
import { wueste } from '@/data/adventures/wueste'
import { notPaintedYet } from '@/utils/journeyFiles'

const PUBLIC = join(__dirname, '..', 'public')
const exists = (p: string) => existsSync(join(PUBLIC, p))
const inside = (v: number) => v >= 0 && v <= 100

function paths(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    if (/^(images|audio)\//.test(value)) out.push(value)
  } else if (Array.isArray(value)) value.forEach((v) => paths(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => paths(v, out))
  return out
}

describe('Die vier neuen Spiele der Wüste: Daten', () => {
  it('every picture and sound exists', () => {
    const missing = [ARME, RICHTER, SIGNAL, TRAUBE].flatMap((g) => paths(g)).filter((p) => !exists(p) && !notPaintedYet(p))
    expect(missing).toEqual([])
  })

  it('has at most two rounds in each game and a hint in every round', () => {
    for (const rounds of [ARME.rounds, RICHTER.rounds, SIGNAL.rounds, TRAUBE.rounds]) {
      expect(rounds.length).toBeGreaterThanOrEqual(1)
      expect(rounds.length).toBeLessThanOrEqual(2)
      for (const r of rounds) expect(r.hint.length).toBeGreaterThan(10)
    }
  })

  it('arms: two helpers, round 1 alone and round 2 with helpers, places inside the picture', () => {
    expect(ARME.poses).toHaveLength(3)
    expect(ARME.rounds[0]!.helpers).toBe(false)
    expect(ARME.rounds[1]!.helpers).toBe(true)
    expect(ARME.helpers.map((h) => h.id)).toEqual(['aaron', 'hur'])
    for (const p of [ARME.moses, ...ARME.helpers]) {
      expect(inside(p.x) && inside(p.y)).toBe(true)
      expect(p.x - p.w / 2).toBeGreaterThanOrEqual(0)
      expect(p.x + p.w / 2).toBeLessThanOrEqual(100)
    }
    // Aaron on the left, Hur on the right of Moses
    expect(ARME.helpers[0]!.x).toBeLessThan(ARME.moses.x)
    expect(ARME.helpers[1]!.x).toBeGreaterThan(ARME.moses.x)
    // the arms can stay up for the goal: round 2 needs at most 1.5 taps a second to beat the sinking
    for (const r of ARME.rounds) {
      expect(r.goal).toBeGreaterThanOrEqual(6)
      expect(r.goal).toBeLessThanOrEqual(20)
      expect(r.sink).toBeGreaterThan(0.1)
      expect(r.sink).toBeLessThan(0.4)
    }
  })

  it('judges: exactly one seat is Moses; small and great cases exist in both rounds; every case of a round exists once', () => {
    expect(RICHTER.seats.filter((s) => s.moses)).toHaveLength(1)
    expect(RICHTER.seats.length).toBeGreaterThanOrEqual(3)
    const ids = new Set(RICHTER.cases.map((c) => c.id))
    expect(ids.size).toBe(RICHTER.cases.length)
    for (const r of RICHTER.rounds) {
      expect(new Set(r.cases).size).toBe(r.cases.length)
      for (const id of r.cases) expect(ids.has(id)).toBe(true)
      const weights = r.cases.map((id) => RICHTER.cases.find((c) => c.id === id)!.weight)
      expect(weights).toContain('small')
      expect(weights).toContain('great')
    }
    expect(RICHTER.rounds[1]!.cases.length).toBeGreaterThan(RICHTER.rounds[0]!.cases.length - 1)
    for (const s of RICHTER.seats) {
      expect(inside(s.x) && inside(s.y)).toBe(true)
      expect(s.x - s.w / 2).toBeGreaterThanOrEqual(0)
      expect(s.x + s.w / 2).toBeLessThanOrEqual(100)
    }
  })

  it('signal: the three sounds exist and are short, every answer picture has its signal, round 2 has rows of three', () => {
    expect(Object.keys(SIGNAL.sounds).sort()).toEqual(['all', 'break', 'leaders'])
    for (const s of Object.values(SIGNAL.sounds)) {
      expect(s.seconds).toBeGreaterThan(0.5)
      expect(s.seconds).toBeLessThan(4)
    }
    expect(SIGNAL.choices.map((c) => c.id).sort()).toEqual(['all', 'break', 'leaders'])
    for (const r of SIGNAL.rounds) for (const q of r.questions) for (const id of q) expect(SIGNAL.sounds[id]).toBeDefined()
    expect(SIGNAL.rounds[0]!.questions.every((q) => q.length === 1)).toBe(true)
    expect(SIGNAL.rounds[1]!.questions.every((q) => q.length === 3)).toBe(true)
    // round 1 teaches every signal once
    expect(new Set(SIGNAL.rounds[0]!.questions.flat()).size).toBe(3)
  })

  it('grapes: two men carry the pole, the second round has hills and wobbles more, the cluster has berries', () => {
    expect(TRAUBE.men).toHaveLength(2)
    expect(TRAUBE.men[0]!.x).toBeLessThan(TRAUBE.men[1]!.x)
    expect(TRAUBE.berries).toBeGreaterThanOrEqual(4)
    expect(TRAUBE.rounds[0]!.hills).toBe(false)
    expect(TRAUBE.rounds[1]!.hills).toBe(true)
    expect(TRAUBE.rounds[1]!.wobble).toBeGreaterThan(TRAUBE.rounds[0]!.wobble)
    for (const r of TRAUBE.rounds) {
      expect(r.seconds).toBeGreaterThanOrEqual(15)
      expect(r.seconds).toBeLessThanOrEqual(30)
    }
    expect(TRAUBE.pole.x - TRAUBE.pole.w / 2).toBeGreaterThanOrEqual(0)
    expect(TRAUBE.pole.x + TRAUBE.pole.w / 2).toBeLessThanOrEqual(100)
  })

  it('the stages 2, 3, 5 and 7 use the four games', () => {
    const task = (n: number) => wueste.stages.find((s) => s.id === n)!.task
    expect(task(2)?.kind).toBe('arme')
    expect(task(2)?.arms).toBe(ARME)
    expect(task(3)?.kind).toBe('richter')
    expect(task(3)?.judges).toBe(RICHTER)
    expect(task(5)?.kind).toBe('signal')
    expect(task(5)?.signal).toBe(SIGNAL)
    expect(task(7)?.kind).toBe('traube')
    expect(task(7)?.grapes).toBe(TRAUBE)
  })
})
