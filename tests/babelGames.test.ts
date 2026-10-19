/**
 * The small functions of the new games of "Der Turm von Babel" (`utils/babelGames.ts` and `utils/wipe.ts`).
 */
import { describe, expect, it } from 'vitest'
import { advance, buildTask, chainDone, glideAt, land, lineLength, nearestOn, passAlong, pointAt, startChain, stepWidths } from '@/utils/babelGames'
import { ASPECT, COLS, ROWS, coverage, makeGrid, wipeAt, wipeLine } from '@/utils/wipe'

describe('who is missing: buildTask', () => {
  const people = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, image: `${id}.webp`, label: id }))

  it('the row after the cloud has a gap where somebody is gone; the choices are the people of the row in the order of the list, not of the row', () => {
    const v = buildTask(people, { row: ['d', 'b', 'a', 'c'], gone: ['b'] })
    expect(v.after).toEqual(['d', null, 'a', 'c'])
    expect(v.choices).toEqual(['a', 'b', 'c', 'd'])
    const two = buildTask(people, { row: ['f', 'e', 'd', 'c', 'b', 'a'], gone: ['e', 'a'] })
    expect(two.after).toEqual(['f', null, 'd', 'c', 'b', null])
    expect(two.choices).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    // the people who are gone are among the choices (and every person of the row is)
    for (const g of ['b']) expect(v.choices).toContain(g)
  })

  it('a task that makes no sense is refused: somebody twice, a stranger in the row, nobody gone, three gone, a gone person who was not there', () => {
    expect(() => buildTask(people, { row: ['a', 'a', 'b'], gone: ['b'] })).toThrow()
    expect(() => buildTask(people, { row: ['a', 'z'], gone: ['a'] })).toThrow()
    expect(() => buildTask(people, { row: ['a', 'b', 'c'], gone: [] })).toThrow()
    expect(() => buildTask(people, { row: ['a', 'b', 'c', 'd'], gone: ['a', 'b', 'c'] })).toThrow()
    expect(() => buildTask(people, { row: ['a', 'b'], gone: ['c'] })).toThrow()
  })
})

describe('the brick chain: passAlong', () => {
  it('the first thing comes out of the oven into the first pair of hands; the next one only when those hands are free', () => {
    const s = startChain(3, ['brick', 'pitch', 'brick'])
    expect(s.holders).toEqual(['brick', null, null])
    expect(s.waiting).toEqual(['pitch', 'brick'])
    const r = passAlong(s, 0)
    expect(r.result).toBe('moved')
    // the first person is free again: the next thing comes out at once
    expect(r.state.holders).toEqual(['pitch', 'brick', null])
  })

  it('a thing is passed on to the next person; the last one puts it on the stack; nothing is changed in the old state', () => {
    let s = startChain(2, ['brick'])
    const first = passAlong(s, 0)
    expect(first.state.holders).toEqual([null, 'brick'])
    expect(s.holders).toEqual(['brick', null])
    const last = passAlong(first.state, 1)
    expect(last.result).toBe('stacked')
    expect(last.state.stacked).toEqual(['brick'])
    expect(chainDone(last.state)).toBe(true)
    s = last.state
    expect(chainDone(startChain(2, ['brick']))).toBe(false)
  })

  it('a full pair of hands blocks (no fault: the state stays), and tapping somebody who holds nothing is empty', () => {
    const s = startChain(3, ['brick', 'brick', 'brick'])
    const a = passAlong(s, 0).state // [brick, brick, null]? the second comes out at once
    expect(a.holders).toEqual(['brick', 'brick', null])
    const blocked = passAlong(a, 0)
    expect(blocked.result).toBe('blocked')
    expect(blocked.state.holders).toEqual(a.holders)
    expect(passAlong(a, 2).result).toBe('empty')
    expect(passAlong(a, 7).result).toBe('empty')
  })

  it('a whole round: four bricks go through a chain of three people and all lie on the stack at the end, with the pitch pots mixed in a longer chain', () => {
    for (const [people, items] of [[3, ['brick', 'brick', 'brick', 'brick']], [4, ['brick', 'pitch', 'brick', 'brick', 'pitch', 'pitch', 'brick', 'pitch']]] as const) {
      let s = startChain(people, [...items])
      let taps = 0
      while (!chainDone(s) && taps < 200) {
        // tap the person nearest to the stack who holds something
        let i = s.holders.length - 1
        while (i > 0 && s.holders[i] === null) i--
        s = passAlong(s, i).state
        taps++
      }
      expect(chainDone(s)).toBe(true)
      expect(s.stacked.length).toBe(items.length)
      // every thing reached the stack: the same bricks and pots as were baked
      expect([...s.stacked].sort()).toEqual([...items].sort())
    }
  })
})

describe('the stepped tower: land and glide', () => {
  it('a block that hangs over by less than a tenth of its width stays where it fell: good', () => {
    const l = land(25, 50, 26, 40)
    expect(l.good).toBe(true)
    expect(l.left).toBe(26)
    // exactly a tenth over still counts
    expect(land(25, 50, 25 - 4, 40).good).toBe(true)
    expect(land(25, 50, 25 - 4.01, 40).good).toBe(false)
  })

  it('a block that hangs over more slides gently to the middle of the step; it never falls: the result is always on the step', () => {
    for (const x of [0, 10, 18, 40, 60]) {
      const l = land(25, 50, x, 40)
      if (!l.good) expect(l.left).toBe(25 + (50 - 40) / 2)
      expect(l.left).toBeGreaterThanOrEqual(25 - 40 / 10)
      expect(l.left + 40).toBeLessThanOrEqual(25 + 50 + 40 / 10 + 0.0001)
    }
    expect(land(25, 50, 70, 40).good).toBe(false)
    expect(land(25, 50, 70, 40).over).toBeCloseTo(70 + 40 - 75, 5)
  })

  it('the block glides to and fro between the edges of the picture at the given speed', () => {
    const w = 40
    expect(glideAt(0, 0.2, w)).toBe(0)
    // 0.2 picture widths a second: 20 percent a second; the way is 60 long, so at 3 s it is at the right edge and then turns
    expect(glideAt(1, 0.2, w)).toBeCloseTo(20, 5)
    expect(glideAt(3, 0.2, w)).toBeCloseTo(60, 5)
    expect(glideAt(4, 0.2, w)).toBeCloseTo(40, 5)
    expect(glideAt(6, 0.2, w)).toBeCloseTo(0, 5)
    for (let t = 0; t < 30; t += 0.37) {
      const x = glideAt(t, 0.26, w)
      expect(x).toBeGreaterThanOrEqual(-0.0001)
      expect(x).toBeLessThanOrEqual(60.0001)
    }
  })

  it('every step is narrower than the one below', () => {
    const w = stepWidths(52, 0.08, 4)
    expect(w).toHaveLength(5)
    for (let i = 1; i < w.length; i++) expect(w[i]!).toBeLessThan(w[i - 1]!)
    expect(w[0]).toBe(52)
    expect(stepWidths(36, 0.1, 4)[4]!).toBeCloseTo(36 * 0.9 ** 4, 5)
  })
})

describe('the roads: advance', () => {
  const road: [number, number][] = [[50, 50], [60, 50], [70, 50], [80, 50], [90, 50]]

  it('the length of a line, and the point at a distance along it', () => {
    expect(lineLength(road)).toBeCloseTo(40, 5)
    expect(pointAt(road, 0)).toEqual({ x: 50, y: 50 })
    expect(pointAt(road, 15)).toEqual({ x: 65, y: 50 })
    expect(pointAt(road, 99)).toEqual({ x: 90, y: 50 })
    // a vertical distance counts longer (the picture is 3 : 4): 10 percent of the height are 13.3 widths
    expect(lineLength([[50, 10], [50, 20]])).toBeCloseTo(13.333, 2)
  })

  it('the nearest point of the line: how far along it, and how far away', () => {
    const n = nearestOn(road, { x: 65, y: 53 })
    expect(n.along).toBeCloseTo(15, 5)
    expect(n.distance).toBeCloseTo(4, 5)
  })

  it('the walker goes with the finger while it stays on the road, never back, and not far ahead of itself', () => {
    let a = advance(road, 0, { x: 52, y: 50 }, 3)
    expect(a.on).toBe(true)
    expect(a.progress).toBeCloseTo(2, 5)
    a = advance(road, a.progress, { x: 58, y: 51 }, 3)
    expect(a.on).toBe(true)
    expect(a.progress).toBeCloseTo(8, 5)
    // the finger goes back: the walker stays where it is
    const back = advance(road, a.progress, { x: 54, y: 50 }, 3)
    expect(back.progress).toBeCloseTo(8, 5)
    // the finger jumps far ahead (skipping bends): the walker does not follow
    const jump = advance(road, a.progress, { x: 88, y: 50 }, 3)
    expect(jump.on).toBe(false)
    expect(jump.progress).toBeCloseTo(8, 5)
    expect(jump.strayed).toBe(false)
  })

  it('far from the road the finger has strayed and the walker stops; near the road but a little beside it, nothing happens', () => {
    const far = advance(road, 10, { x: 60, y: 70 }, 3)
    expect(far.strayed).toBe(true)
    expect(far.progress).toBe(10)
    const beside = advance(road, 10, { x: 60, y: 54 }, 3)
    expect(beside.strayed).toBe(false)
  })

  it('a finger that follows the whole road brings the walker to the end', () => {
    let p = 0
    for (let x = 50; x <= 90; x += 2) p = advance(road, p, { x, y: 50 + Math.sin(x) }, 3).progress
    expect(p).toBeGreaterThan(lineLength(road) - 3)
  })
})

describe('the fog: wipe and coverage', () => {
  it('wiping puts the cells under the brush free and counts only new ones; a second wipe on the same spot frees nothing', () => {
    const g = makeGrid()
    expect(g).toHaveLength(ROWS)
    expect(g[0]).toHaveLength(COLS)
    const fresh = wipeAt(g, 50, 50, 8)
    expect(fresh).toBeGreaterThan(5)
    expect(wipeAt(g, 50, 50, 8)).toBe(0)
    // the brush is round in the picture, not in percents: it reaches further in percent of the height than of the width
    expect(ASPECT).toBeCloseTo(2 / 3, 5)
  })

  it('coverage is the share of the region that is free: nothing, half, everything', () => {
    const region = { x: 20, y: 20, w: 40, h: 40 }
    const g = makeGrid()
    expect(coverage(g, region)).toBe(0)
    // wipe a band over the whole width of the left half of the region
    wipeLine(g, { x: 20, y: 20 }, { x: 20, y: 60 }, 5)
    const half = coverage(g, region)
    expect(half).toBeGreaterThan(0.05)
    expect(half).toBeLessThan(0.6)
    // wipe the whole region with lines
    for (let y = 20; y <= 60; y += 4) wipeLine(g, { x: 20, y }, { x: 60, y }, 6)
    expect(coverage(g, region)).toBeGreaterThanOrEqual(0.95)
    // a region with no cell in it counts as nothing
    expect(coverage(g, { x: 1, y: 1, w: 0.1, h: 0.1 })).toBe(0)
  })

  it('what is wiped outside the region does not count for it', () => {
    const g = makeGrid()
    wipeLine(g, { x: 80, y: 80 }, { x: 95, y: 95 }, 6)
    expect(coverage(g, { x: 5, y: 5, w: 40, h: 40 })).toBe(0)
  })
})
