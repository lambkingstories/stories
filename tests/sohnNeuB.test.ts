/**
 * The logic of the game "Hand in hand" (`reigen`, field `dance`) of "Der verlorene Sohn" (`sohn`): which dancers may be joined, when the ring is complete, what "Help me" does,
 * the band between two hands and the turning of the ring. The check of the data (`danceProblems`) accepts the sample and names what is wrong in damaged copies.
 */
import { describe, expect, it } from 'vitest'
import {
  danceBandOf,
  danceChain,
  danceConnect,
  danceCross,
  danceDegree,
  danceDone,
  danceHas,
  danceHelp,
  danceKey,
  danceNeighbours,
  danceProblems,
  danceRingAt,
  danceRingOrder,
  danceRingPairs,
  danceSpinMs,
  danceTouchSize
} from '@/utils/sohnNeuB'
import type { DanceBand, DanceGame } from '@/utils/sohnNeuB'
import { DANCE } from './sohnSamples'

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const R1 = DANCE.rounds[0]!
const R2 = DANCE.rounds[1]!

describe('reigen: bands, chains and rings', () => {
  it('the sample is playable', () => {
    expect(danceProblems(DANCE)).toEqual([])
  })

  it('a band is the same in both directions; the degree counts the hands that are given', () => {
    const bands: DanceBand[] = [['vater', 'sohn'], ['sohn', 'g1']]
    expect(danceKey('b', 'a')).toBe(danceKey('a', 'b'))
    expect(danceHas(bands, 'sohn', 'vater')).toBe(true)
    expect(danceHas(bands, 'vater', 'g1')).toBe(false)
    expect(danceDegree(bands, 'sohn')).toBe(2)
    expect(danceDegree(bands, 'vater')).toBe(1)
    expect(danceDegree(bands, 'g4')).toBe(0)
  })

  it('the chain of a dancer is everybody joined to him, directly or through others', () => {
    const bands: DanceBand[] = [['a', 'b'], ['b', 'c'], ['d', 'e']]
    expect(danceChain(bands, 'a').sort()).toEqual(['a', 'b', 'c'])
    expect(danceChain(bands, 'e').sort()).toEqual(['d', 'e'])
    expect(danceChain(bands, 'z')).toEqual(['z'])
  })

  it('the pairs of the ring and the neighbours (the last with the first)', () => {
    expect(danceRingPairs(['a', 'b', 'c'])).toEqual([['a', 'b'], ['b', 'c'], ['c', 'a']])
    expect(danceNeighbours(R1, 'vater', 'sohn')).toBe(true)
    expect(danceNeighbours(R1, 'g4', 'vater')).toBe(true)
    expect(danceNeighbours(R1, 'vater', 'g2')).toBe(false)
  })

  it('crossing: lines that cross, lines that only touch at an end, lines that share an end, lines far apart', () => {
    expect(danceCross({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true)
    expect(danceCross({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 10 })).toBe(true)
    expect(danceCross({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 })).toBe(false)
    expect(danceCross({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(false)
    expect(danceCross({ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 8, y: 0 }, { x: 12, y: 4 })).toBe(false)
  })
})

describe('reigen: round 1 (only the neighbour may be joined)', () => {
  it('the neighbour is joined; a hand across the ring springs back and is a mistake', () => {
    expect(danceConnect(R1, [], 'vater', 'sohn')).toEqual({ ok: true, closes: false })
    expect(danceConnect(R1, [], 'vater', 'g2')).toEqual({ ok: false, why: 'far', mistake: true })
    expect(danceConnect(R1, [], 'vater', 'g1')).toEqual({ ok: false, why: 'far', mistake: true })
  })

  it('the same pair twice is nothing (no mistake)', () => {
    expect(danceConnect(R1, [['vater', 'sohn']], 'sohn', 'vater')).toEqual({ ok: false, why: 'same', mistake: false })
    expect(danceConnect(R1, [], 'g1', 'g1')).toEqual({ ok: false, why: 'same', mistake: false })
  })

  it('joining the six in any order closes the ring with the last band, and only then', () => {
    const ring = danceRingPairs(R1.order)
    const order = [2, 0, 4, 1, 5, 3]
    const bands: DanceBand[] = []
    order.forEach((k, i) => {
      const v = danceConnect(R1, bands, ring[k]![0], ring[k]![1])
      expect(v.ok, `band ${i + 1}`).toBe(true)
      if (v.ok) expect(v.closes, `band ${i + 1}`).toBe(i === order.length - 1)
      bands.push(ring[k]!)
      expect(danceDone(R1, bands)).toBe(i === order.length - 1)
    })
    expect(danceRingOrder(R1, bands)).toHaveLength(6)
    expect(new Set(danceRingOrder(R1, bands)).size).toBe(6)
  })
})

describe('reigen: round 2 (free, but no crossing, two hands at most, no early ring)', () => {
  const ids = R2.order
  const at = (k: number) => ids[k % ids.length]!

  it('any two dancers may be joined when nothing is in the way (also across the courtyard)', () => {
    expect(danceConnect(R2, [], at(0), at(5)).ok).toBe(true)
    expect(danceConnect(R2, [], at(0), at(1))).toEqual({ ok: true, closes: false })
  })

  it('a band across another band is a mistake; a band next to it is fine', () => {
    const bands: DanceBand[] = [[at(0), at(5)]]
    expect(danceConnect(R2, bands, at(2), at(7))).toEqual({ ok: false, why: 'cross', mistake: true })
    expect(danceConnect(R2, bands, at(1), at(2)).ok).toBe(true)
    // two bands that share a dancer never cross
    expect(danceConnect(R2, bands, at(0), at(3)).ok).toBe(true)
  })

  it('a third hand is refused softly (no mistake)', () => {
    const bands: DanceBand[] = [[at(0), at(1)], [at(0), at(9)]]
    expect(danceConnect(R2, bands, at(0), at(2))).toEqual({ ok: false, why: 'full', mistake: false })
    expect(danceConnect(R2, bands, at(2), at(0))).toEqual({ ok: false, why: 'full', mistake: false })
  })

  it('closing a ring before all are in is a mistake; closing it with all in is allowed and ends the round', () => {
    const bands: DanceBand[] = [[at(0), at(1)], [at(1), at(2)], [at(2), at(3)]]
    expect(danceConnect(R2, bands, at(3), at(0))).toEqual({ ok: false, why: 'early', mistake: true })
    const all: DanceBand[] = danceRingPairs(ids).slice(0, 9)
    expect(danceConnect(R2, all, at(9), at(0))).toEqual({ ok: true, closes: true })
    expect(danceDone(R2, all)).toBe(false)
    expect(danceDone(R2, danceRingPairs(ids))).toBe(true)
  })

  it('the round is done when every dancer holds two hands and all are one ring; one band less is not done', () => {
    const bands = danceRingPairs(ids)
    expect(danceDone(R2, bands)).toBe(true)
    expect(danceDone(R2, bands.slice(1))).toBe(false)
    // two small rings are not one ring
    const two: DanceBand[] = [...danceRingPairs(ids.slice(0, 5)), ...danceRingPairs(ids.slice(5))]
    expect(two).toHaveLength(10)
    expect(danceDone(R2, two)).toBe(false)
  })

  it('"Help me" lights the next pair of the ring, or takes away a band that is not part of it', () => {
    expect(danceHelp(R2, [])).toEqual({ join: [at(0), at(1)] })
    expect(danceHelp(R2, [[at(0), at(1)]])).toEqual({ join: [at(1), at(2)] })
    expect(danceHelp(R2, [[at(0), at(1)], [at(0), at(5)]])).toEqual({ remove: [at(0), at(5)] })
    expect(danceHelp(R2, danceRingPairs(ids))).toBeNull()
  })

  it('following "Help me" from nothing, or after a wrong but allowed band, always reaches the ring without a mistake', () => {
    for (const round of [R1, R2]) {
      for (const start of [[], [[round.order[0]!, round.order[round.order.length - 1]!]], [[round.order[1]!, round.order[4]!]]] as DanceBand[][]) {
        let bands = [...start]
        let mistakes = 0
        for (let k = 0; k < 40 && !danceDone(round, bands); k++) {
          const h = danceHelp(round, bands)!
          if ('remove' in h) bands = bands.filter((b) => danceKey(b[0], b[1]) !== danceKey(h.remove[0], h.remove[1]))
          else {
            const v = danceConnect(round, bands, h.join[0], h.join[1])
            if (!v.ok) mistakes++
            else bands.push(h.join)
          }
        }
        expect(mistakes, round.mode).toBe(0)
        expect(danceDone(round, bands), round.mode).toBe(true)
      }
    }
  })
})

describe('reigen: the band, the turning ring, the sizes', () => {
  it('the band starts at the hand of the first dancer, ends before the hand of the second, and lies at the angle between them', () => {
    const g = danceBandOf(DANCE, { x: 20, y: 50 }, { x: 60, y: 50 })
    expect(g.x).toBeCloseTo(25.5)
    expect(g.y).toBeCloseTo(50)
    expect(g.len).toBeCloseTo(29)
    expect(g.angle).toBeCloseTo(0)
    const d = danceBandOf(DANCE, { x: 50, y: 20 }, { x: 50, y: 20 + 30 })
    expect(d.angle).toBeCloseTo(90)
    expect(d.len).toBeCloseTo(20 - 11)
    const c = danceBandOf(DANCE, { x: 20, y: 50 }, { x: 20, y: 50 })
    expect(c.len).toBe(0)
  })

  it('while the ring turns a dancer walks from place to place along the ring and comes back after a whole round', () => {
    const pts = R1.order.map((id) => R1.places.find((p) => p.id === id)!)
    expect(danceRingAt(pts, 0)).toEqual({ x: pts[0]!.x, y: pts[0]!.y })
    expect(danceRingAt(pts, 1)).toEqual({ x: pts[1]!.x, y: pts[1]!.y })
    const half = danceRingAt(pts, 0.5)
    expect(half.x).toBeCloseTo((pts[0]!.x + pts[1]!.x) / 2)
    expect(danceRingAt(pts, 6)).toEqual({ x: pts[0]!.x, y: pts[0]!.y })
    const back = danceRingAt(pts, -1)
    expect(back.x).toBeCloseTo(pts[5]!.x)
    expect(danceRingAt([], 3)).toEqual({ x: 0, y: 0 })
    // two rounds of the ring
    expect(danceSpinMs(DANCE, 6)).toBe(6000)
    expect(danceSpinMs(DANCE, 10)).toBe(10000)
  })

  it('a finger target is at least 44 pixels', () => {
    const s = danceTouchSize(DANCE)
    expect(s.w).toBeGreaterThanOrEqual(44)
    expect(s.h).toBeGreaterThanOrEqual(44)
    expect(danceTouchSize({ dancerW: 5, dancerRatio: 1 })).toEqual({ w: 44, h: 44 })
  })

  it('the ring of the bands in order, from the first dancer round to the last (only for a complete ring)', () => {
    expect(danceRingOrder(R1, [])).toEqual([])
    const order = danceRingOrder(R1, danceRingPairs(R1.order))
    expect(order[0]).toBe('vater')
    expect(order).toHaveLength(6)
    for (let i = 0; i < 6; i++) expect(danceHas(danceRingPairs(R1.order), order[i]!, order[(i + 1) % 6]!)).toBe(true)
  })
})

describe('reigen: the check of the data finds what would make the game unplayable', () => {
  const bad = (mutate: (g: DanceGame) => void): string => {
    const g = copy(DANCE)
    mutate(g)
    return danceProblems(g).join(' | ')
  }

  it('the ring must name every dancer once and must not cross itself', () => {
    expect(bad((g) => (g.rounds[0]!.order[5] = 'g1'))).toContain('must name every dancer once')
    expect(bad((g) => g.rounds[0]!.order.reverse().splice(1, 0, ...g.rounds[0]!.order.splice(2, 1)))).toMatch(/crosses itself|must name/)
    // swap two places: the closed line crosses itself
    expect(
      bad((g) => {
        const p = g.rounds[0]!.places
        const t = { x: p[1]!.x, y: p[1]!.y }
        p[1]!.x = p[2]!.x
        p[1]!.y = p[2]!.y
        p[2]!.x = t.x
        p[2]!.y = t.y
      })
    ).toContain('crosses itself')
  })

  it('round 1 is played with neighbours, round 2 free; round 2 has more dancers; at most twelve', () => {
    expect(bad((g) => (g.rounds[0]!.mode = 'free'))).toContain('should be played with the rule "neighbours"')
    expect(bad((g) => (g.rounds[1]!.mode = 'neighbours'))).toContain('should be played with the rule "free"')
    expect(bad((g) => g.rounds.pop())).toContain('two rounds')
    expect(bad((g) => (g.rounds[1] = copy(g.rounds[0]!)))).toContain('more dancers than round 1')
  })

  it('in the free round the neighbours of a dancer are among his three nearest', () => {
    expect(
      bad((g) => {
        // swap two dancers of the ring far apart: his neighbours are no longer near him
        const o = g.rounds[1]!.order
        const t = o[1]!
        o[1] = o[6]!
        o[6] = t
      })
    ).toMatch(/three nearest|crosses itself|too close/)
  })

  it('the dancers are big enough for a finger, do not cover each other and stay in the picture', () => {
    expect(bad((g) => (g.dancerW = 8))).toContain('between 11 and 18 percent')
    expect(bad((g) => (g.rounds[0]!.places[0]!.x = 1))).toContain('reaches out of the picture')
    expect(
      bad((g) => {
        g.rounds[0]!.places[1]!.x = g.rounds[0]!.places[0]!.x + 3
        g.rounds[0]!.places[1]!.y = g.rounds[0]!.places[0]!.y + 2
      })
    ).toContain('overlap')
  })

  it('there is room for a band between the hands of two neighbours', () => {
    expect(bad((g) => (g.handR = 9.5))).toContain('too close for a band')
    expect(bad((g) => (g.handR = 1))).toContain('reach of the hands')
    expect(bad((g) => (g.bandH = 9))).toContain('thick')
  })

  it('pictures and names are there', () => {
    expect(bad((g) => (g.background = ''))).toContain('no picture of the courtyard')
    expect(bad((g) => (g.notes = []))).toContain('three pictures of notes')
    expect(bad((g) => (g.lyre = ''))).toContain('lyre player')
    expect(bad((g) => (g.dancers[3]!.image = ''))).toContain('needs a picture and a name')
    expect(bad((g) => (g.rounds[0]!.places[0]!.id = 'niemand'))).toContain('unknown dancer')
  })
})
