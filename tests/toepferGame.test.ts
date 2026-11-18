import { describe, expect, it } from 'vitest'
import { DY, ROWS, THRESHOLDS, cloneProfile, dragAt, formLikeFinger, lumpProfile, newProfile, profileFromPoints, pullTo, radiusAt, seeded, similarity, smooth, starsOf } from '../src/utils/toepferGame'
import { LEVELS, LEVEL_COUNT, levelStart, levelTarget, levelThresholds, levelView } from '../src/utils/toepferLevels'

describe('toepfer: the profile', () => {
  it('a profile from control points passes through them and ends at the rim', () => {
    const p = profileFromPoints([[0, 0.4], [0.5, 0.8], [1, 0.3]])
    expect(p.h).toBe(1)
    expect(radiusAt(p, 0)).toBeCloseTo(0.4, 2)
    expect(radiusAt(p, 0.5)).toBeCloseTo(0.8, 1)
    expect(radiusAt(p, 1)).toBeCloseTo(0.3, 2)
    expect(radiusAt(p, 1.05)).toBe(0)
  })

  it('the finger drags the wall to its own distance, smoothly (no jump between neighbouring rows)', () => {
    const p = lumpProfile()
    const lim = { rMax: 1.2, hMax: 2 }
    dragAt(p, 0.35, 1.1, 0.1, lim, 1)
    expect(radiusAt(p, 0.35)).toBeCloseTo(1.1, 1)
    let worst = 0
    for (let i = 1; i <= Math.round(p.h / DY); i++) worst = Math.max(worst, Math.abs(p.r[i]! - p.r[i - 1]!))
    expect(worst).toBeLessThan(0.1)
    // the rows far from the finger hardly move
    expect(radiusAt(p, 0)).toBeLessThan(0.8)
  })

  it('never narrower than the minimum and never wider than the limit', () => {
    const p = lumpProfile()
    const lim = { rMax: 0.9, hMax: 2 }
    dragAt(p, 0.3, 0, 0.1, lim, 1)
    dragAt(p, 0.3, 5, 0.1, lim, 1)
    for (let i = 0; i <= ROWS; i++) {
      expect(p.r[i]!).toBeGreaterThanOrEqual(0.1 - 1e-6)
      expect(p.r[i]!).toBeLessThanOrEqual(0.9 + 1e-6)
    }
  })

  it('the finger at the rim pulls the clay up and presses it down again', () => {
    const p = lumpProfile()
    const lim = { rMax: 1.2, hMax: 2 }
    const rim = radiusAt(p, p.h)
    pullTo(p, 1.5, lim)
    expect(p.h).toBeCloseTo(1.5, 5)
    expect(radiusAt(p, 1.4)).toBeCloseTo(rim, 1)
    expect(radiusAt(p, 0.3)).toBeGreaterThan(0.6)
    pullTo(p, 0.5, lim)
    expect(p.h).toBeCloseTo(0.5, 5)
    pullTo(p, 9, lim)
    expect(p.h).toBe(2)
    pullTo(p, -3, lim)
    expect(p.h).toBeCloseTo(0.3, 5)
  })

  it('smoothing keeps the rim and the foot', () => {
    const p = lumpProfile()
    const f = p.r[0]!
    smooth(p, 3)
    expect(p.r[0]).toBe(f)
  })

  it('the score is 1 for the same vessel, and lower the less alike', () => {
    const a = levelTarget(2)
    expect(similarity(a, cloneProfile(a))).toBeCloseTo(1, 6)
    expect(similarity(a, levelTarget(8))).toBeLessThan(0.7)
    const lowRim = cloneProfile(a)
    pullTo(lowRim, a.h * 0.8, { rMax: 1.3, hMax: 2.8 })
    expect(similarity(a, lowRim)).toBeLessThan(0.9)
    expect(similarity(a, lowRim)).toBeGreaterThan(0.7)
  })

  it('the stars follow the thresholds', () => {
    expect(starsOf(0.5, THRESHOLDS)).toBe(0)
    expect(starsOf(0.78, THRESHOLDS)).toBe(1)
    expect(starsOf(0.9, THRESHOLDS)).toBe(2)
    expect(starsOf(0.95, THRESHOLDS)).toBe(3)
  })

  it('the rows above the rim repeat its radius', () => {
    const p = newProfile()
    expect(p.h).toBe(0)
    const q = lumpProfile()
    for (let i = Math.ceil(q.h / DY) + 1; i <= ROWS; i++) expect(q.r[i]).toBeCloseTo(q.r[Math.floor(q.h / DY)]!, 5)
  })
})

describe('toepfer: the 30 levels', () => {
  it('there are 30, in 5 chapters of 6, two spoiled in every chapter', () => {
    expect(LEVELS.length).toBe(30)
    expect(LEVEL_COUNT).toBe(30)
    for (let c = 0; c < 5; c++) {
      const of = LEVELS.filter((l) => l.chapter === c)
      expect(of.length).toBe(6)
      expect(of.filter((l) => l.spoiled).length).toBe(2)
    }
  })

  it('every template fits into the world, and no template is the same as another', () => {
    for (let i = 0; i < 30; i++) {
      const t = levelTarget(i)
      const v = levelView(i)
      expect(t.h).toBeLessThanOrEqual(v.hMax)
      for (let k = 0; k <= Math.round(t.h / DY); k++) expect(t.r[k]!).toBeLessThanOrEqual(v.rMax)
      for (let j = i + 1; j < 30; j++) expect(similarity(t, levelTarget(j)), `${i} vs ${j}`).toBeLessThan(0.97)
    }
  })

  it('no level is solved by its starting clay (neither the lump nor the spoiled vessel)', () => {
    for (let i = 0; i < 30; i++) {
      const s = levelStart(i)
      expect(starsOf(similarity(s, levelTarget(i)), levelThresholds(i)), `level ${i}`).toBe(0)
    }
  })

  it('a patient finger brings every template to three stars, from the lump and from the spoiled start', () => {
    for (let i = 0; i < 30; i++) {
      const p = levelStart(i)
      formLikeFinger(p, levelTarget(i), levelView(i))
      const score = similarity(p, levelTarget(i))
      expect(starsOf(score, levelThresholds(i)), `level ${i} score ${score.toFixed(3)}`).toBe(3)
    }
  })

  it('a trembling hand still gets at least one star on every level, and usually two', () => {
    let two = 0
    for (let i = 0; i < 30; i++) {
      for (const seed of [1, 2, 3]) {
        const p = levelStart(i)
        formLikeFinger(p, levelTarget(i), levelView(i), { shake: 0.05, rnd: seeded(seed * 100 + i), rounds: 2 })
        const stars = starsOf(similarity(p, levelTarget(i)), levelThresholds(i))
        expect(stars, `level ${i} seed ${seed}`).toBeGreaterThanOrEqual(1)
        if (stars >= 2) two++
      }
    }
    expect(two).toBeGreaterThan(40)
  })
})
