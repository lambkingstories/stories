/**
 * The pure arithmetic of the new games of "Elisha and Naaman" (`utils/elisaGames.ts`): which jar the oil jug hangs over, how a jar fills and spills over (fill the jars).
 */
import { describe, expect, it } from 'vitest'
import { allFull, jarAt, pourStep, SPILL_MS } from '@/utils/elisaGames'

describe('Krüge füllen: the jar under the jug', () => {
  const jars = [{ x: 25, y: 85, w: 16 }, { x: 50, y: 85, w: 16 }, { x: 75, y: 85, w: 16 }]

  it('the jug hangs over the jar when its middle is within the width of the jar and above its foot; otherwise -1', () => {
    expect(jarAt({ x: 50, y: 40 }, jars)).toBe(1)
    expect(jarAt({ x: 54, y: 40 }, jars)).toBe(1)
    expect(jarAt({ x: 27, y: 60 }, jars)).toBe(0)
    expect(jarAt({ x: 62, y: 40 }, jars)).toBe(-1)
    expect(jarAt({ x: 50, y: 90 }, jars)).toBe(-1)
    expect(jarAt({ x: 50, y: 82 }, jars)).toBe(-1)
  })

  it('between two close jars the nearer one wins', () => {
    const close = [{ x: 40, y: 85, w: 20 }, { x: 52, y: 85, w: 20 }]
    expect(jarAt({ x: 44, y: 50 }, close)).toBe(0)
    expect(jarAt({ x: 49, y: 50 }, close)).toBe(1)
  })
})

describe('Krüge füllen: pouring', () => {
  it('a jar takes `ms` to fill, and fills in steps', () => {
    let s = { fill: 0, over: 0 }
    for (let i = 0; i < 15; i++) s = pourStep(s, 100, 1500)
    expect(s.fill).toBeCloseTo(1, 6)
    let h = { fill: 0, over: 0 }
    h = pourStep(h, 750, 1500)
    expect(h.fill).toBeCloseTo(0.5, 6)
    expect(h.over).toBe(0)
  })

  it('oil that goes on into a full jar spills over after SPILL_MS, and only once', () => {
    let s: { fill: number; over: number; spilled?: boolean } = { fill: 1, over: 0 }
    let spills = 0
    for (let i = 0; i < 40; i++) {
      s = pourStep(s, 50, 1500)
      if (s.spilled) spills++
    }
    expect(spills).toBe(1)
    expect(s.over).toBeGreaterThanOrEqual(SPILL_MS)
    // just filled and moved away at once: no spill
    const done = pourStep({ fill: 0.97, over: 0 }, 100, 1500)
    expect(done.fill).toBe(1)
    expect(done.spilled).toBe(false)
    expect(pourStep(done, 100, 1500).spilled).toBe(false)
  })

  it('the round is over when every jar is full', () => {
    expect(allFull([])).toBe(false)
    expect(allFull([1, 1, 0.9])).toBe(false)
    expect(allFull([1, 1, 1])).toBe(true)
  })
})
