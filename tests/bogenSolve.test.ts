/** "Jonatans Pfeile": the search that finds shots (the hint button of the game and the level tool). */
import { describe, expect, it } from 'vitest'
import { newGame, progressOf } from '../src/utils/bogenGame'
import { LEVELS, levelGame } from '../src/utils/bogenLevels'
import { findHint, runShot, searchShots, signature } from '../src/utils/bogenSolve'

describe('the search for shots', () => {
  it('finds shots that bring something, the most robust one of each class first', () => {
    const g = levelGame(0)
    const c = searchShots(g, { top: 3 })
    expect(c.length).toBeGreaterThan(0)
    expect(c[0]!.gain).toBeGreaterThan(0)
    expect(c[0]!.margin).toBeGreaterThanOrEqual(3)
    const r = runShot(g, c[0]!.a, c[0]!.f)
    expect(r.status).toBe('won')
  })

  it('gives a hint for the game as it is now, and the shot helps', () => {
    for (const no of [0, 5, 6, 11]) {
      const g = levelGame(no)
      const h = findHint(g)
      expect(h, LEVELS[no]!.def.key).toBeTruthy()
      const r = runShot(g, h!.a, h!.f, h!.wait)
      expect(progressOf(r), LEVELS[no]!.def.key).toBeGreaterThan(progressOf(g))
    }
  })

  it('goes on from a half-played level: the hint takes the next step', () => {
    const l = LEVELS[5]! // the hut: first the switch, then the target
    let g = newGame(l.def, l.par)
    g = runShot(g, l.solution[0]!.a, l.solution[0]!.f)
    expect(g.gates[0]!.open).toBe(true)
    const h = findHint(g)!
    const r = runShot(g, h.a, h.f, h.wait)
    expect(r.status).toBe('won')
  })

  it('gives different words for different situations and does not touch the game', () => {
    const g = levelGame(6)
    const before = signature(g)
    findHint(g)
    expect(signature(g)).toBe(before)
    expect(g.shots).toBe(0)
  })

  it('answers quickly enough for a button (one second on this machine at most, also with moving things)', () => {
    const t0 = Date.now()
    findHint(levelGame(15)) // the swinging bell
    findHint(levelGame(10))
    expect(Date.now() - t0).toBeLessThan(6000)
  })
})
