import { describe, expect, it } from 'vitest'
import {
  arrowLanding,
  arrowMiss,
  arrowPull,
  arrowZoneHit,
  dist,
  guards,
  harpCalm,
  hemDone,
  hemStep,
  HEM_REACH,
  nearestOnPath,
  pathLength,
  pebbleOk,
  pluckKind,
  saulState,
  slingAimError,
  slingAngle,
  slingDirection,
  slingHit,
  slingLanding,
  slingPos,
  stringAt,
  stringRate,
  threatPos,
  threatProgress
} from '@/utils/davidGames'

describe('calm Saul', () => {
  it('a note after a long enough pause is calm, a quick one is a jangle, the first note is calm', () => {
    expect(pluckKind(null, 300)).toBe('calm')
    expect(pluckKind(900, 300)).toBe('calm')
    expect(pluckKind(300, 300)).toBe('calm')
    expect(pluckKind(150, 300)).toBe('jangle')
    expect(pluckKind(250, 400)).toBe('jangle')
    // never faster than the jangle limit, whatever the round says
    expect(pluckKind(150, 50)).toBe('jangle')
  })

  it('a calm note adds one, a jangle takes two away, never below zero and never above the need', () => {
    expect(harpCalm(0, 'calm', 8)).toBe(1)
    expect(harpCalm(8, 'calm', 8)).toBe(8)
    expect(harpCalm(5, 'jangle', 8)).toBe(3)
    expect(harpCalm(1, 'jangle', 8)).toBe(0)
  })

  it('Saul is restless, tired and calm by the thirds of the need, and calm when it is full', () => {
    expect(saulState(0, 9)).toBe(0)
    expect(saulState(2, 9)).toBe(0)
    expect(saulState(3, 9)).toBe(1)
    expect(saulState(5, 9)).toBe(1)
    expect(saulState(6, 9)).toBe(2)
    expect(saulState(9, 9)).toBe(2)
  })

  it('a finger hits the nearest of the evenly spaced strings, and nothing outside the harp', () => {
    expect(stringAt(0.2, 8, 0.2, 0.8)).toBe(0)
    expect(stringAt(0.8, 8, 0.2, 0.8)).toBe(7)
    expect(stringAt(0.5, 8, 0.2, 0.8)).toBe(3)
    expect(stringAt(0.1, 8, 0.2, 0.8)).toBe(-1)
    expect(stringAt(0.95, 8, 0.2, 0.8)).toBe(-1)
    expect(stringAt(0.5, 1, 0.2, 0.8)).toBe(-1)
  })

  it('the strings rise in pitch, one after the other', () => {
    const rates = Array.from({ length: 8 }, (_, i) => stringRate(i))
    expect(rates[0]).toBe(0.75)
    for (let i = 1; i < rates.length; i++) expect(rates[i]!).toBeGreaterThan(rates[i - 1]!)
    expect(stringRate(99)).toBe(stringRate(9))
  })
})

describe('protect the flock', () => {
  it('a beast walks from the edge to the lamb after its delay, in a straight line', () => {
    expect(threatProgress(500, 1000, 4000)).toBe(0)
    expect(threatProgress(3000, 1000, 4000)).toBe(0.5)
    expect(threatProgress(9000, 1000, 4000)).toBe(1)
    expect(threatPos({ x: 0, y: 80 }, { x: 40, y: 70 }, 0.5)).toEqual({ x: 20, y: 75 })
  })

  it('David guards a lamb when he stands within the radius (the height counts three quarters)', () => {
    expect(guards({ x: 40, y: 80 }, { x: 45, y: 80 }, 10)).toBe(true)
    expect(guards({ x: 40, y: 80 }, { x: 60, y: 80 }, 10)).toBe(false)
    expect(dist({ x: 0, y: 0 }, { x: 0, y: 40 })).toBeCloseTo(30)
  })
})

describe('smooth stones', () => {
  it('only a smooth stone is right', () => {
    expect(pebbleOk('smooth')).toBe(true)
    expect(pebbleOk('rough')).toBe(false)
  })
})

describe('the sling', () => {
  const c = { x: 30, y: 40 }
  const r = 8

  it('the stone circles clockwise on the screen: down at a quarter turn', () => {
    const p0 = slingPos(0, c, r)
    expect(p0.x).toBeCloseTo(38)
    expect(p0.y).toBeCloseTo(40)
    const p1 = slingPos(Math.PI / 2, c, r)
    expect(p1.x).toBeCloseTo(30)
    expect(p1.y).toBeCloseTo(48)
    expect(slingAngle(2000, 2000)).toBeCloseTo(2 * Math.PI)
    expect(slingAngle(500, 2000, 1)).toBeCloseTo(1 + Math.PI / 2)
  })

  it('the stone flies along the tangent: down at the right, left at the bottom, up at the left, right at the top', () => {
    const d0 = slingDirection(0)
    expect(d0.x).toBeCloseTo(0)
    expect(d0.y).toBeCloseTo(1)
    const d3 = slingDirection((3 * Math.PI) / 2)
    expect(d3.x).toBeCloseTo(1)
    expect(d3.y).toBeCloseTo(0)
  })

  it('the aim error is zero when the stone points at the target and grows as the stone turns away', () => {
    // at the top of the circle (angle 3/2 pi) the stone flies to the right
    const top = (3 * Math.PI) / 2
    const p = slingPos(top, c, r)
    const target = { x: p.x + 40, y: p.y }
    expect(slingAimError(top, c, r, target)).toBeCloseTo(0)
    expect(slingAimError(top + 0.3, c, r, target)).toBeGreaterThan(10)
    expect(slingAimError(top + Math.PI, c, r, target)).toBeGreaterThan(150)
    expect(slingHit(3, 5)).toBe(true)
    expect(slingHit(6, 5)).toBe(false)
  })

  it('a hit lands on the target, a miss on the line the stone flies along', () => {
    const top = (3 * Math.PI) / 2
    const t = { x: 80, y: 32 }
    expect(slingLanding(top, c, r, t, true)).toEqual(t)
    const miss = slingLanding(top, c, r, t, false, 100)
    const p = slingPos(top, c, r)
    expect(miss.x).toBeCloseTo(p.x + 100)
    expect(miss.y).toBeCloseTo(p.y)
  })
})

describe('the sign of the arrows', () => {
  it('the farther the string is pulled the farther the arrow flies, between the least and the greatest range', () => {
    expect(arrowLanding(0, 30, 90)).toBe(30)
    expect(arrowLanding(1, 30, 90)).toBe(90)
    expect(arrowLanding(0.5, 30, 90)).toBe(60)
    expect(arrowLanding(2, 30, 90)).toBe(90)
    expect(arrowLanding(-1, 30, 90)).toBe(30)
    expect(arrowPull(60, 120)).toBe(0.5)
    expect(arrowPull(300, 120)).toBe(1)
    expect(arrowPull(10, 0)).toBe(0)
  })

  it('the arrow must land inside the zone; too short and too far are told apart', () => {
    const zone = { from: 42, to: 56 }
    expect(arrowZoneHit(42, zone)).toBe(true)
    expect(arrowZoneHit(56, zone)).toBe(true)
    expect(arrowZoneHit(41.9, zone)).toBe(false)
    expect(arrowMiss(30, zone)).toBe('short')
    expect(arrowMiss(70, zone)).toBe('far')
    expect(arrowMiss(50, zone)).toBe('hit')
  })
})

describe('the hem', () => {
  const seam = [
    { x: 10, y: 50 },
    { x: 50, y: 50 },
    { x: 50, y: 90 }
  ]

  it('a seam has a length, and a point has a distance from it and a place along it', () => {
    expect(pathLength(seam)).toBeCloseTo(40 + 30)
    const n = nearestOnPath(seam, { x: 30, y: 54 })
    expect(n.off).toBeCloseTo(3)
    expect(n.along).toBeCloseTo(20 / 70)
    const far = nearestOnPath(seam, { x: 50, y: 90 })
    expect(far.along).toBeCloseTo(1)
  })

  it('following the seam moves the progress on; wandering off sends the stroke back; jumping ahead does not count', () => {
    let progress = 0
    let step = hemStep(seam, progress, { x: 12, y: 50 }, 4)
    expect(step.off).toBe(false)
    progress = step.progress
    expect(progress).toBeGreaterThan(0)
    step = hemStep(seam, progress, { x: 14, y: 60 }, 4)
    expect(step.off).toBe(true)
    expect(step.progress).toBe(progress)
    step = hemStep(seam, progress, { x: 50, y: 88 }, 4)
    expect(step.off).toBe(false)
    expect(step.progress).toBe(progress)
    expect(HEM_REACH).toBeGreaterThan(0)
  })

  it('walking the whole seam in small steps finishes it', () => {
    let progress = 0
    const pts: { x: number; y: number }[] = []
    for (let x = 10; x <= 50; x += 2) pts.push({ x, y: 50 })
    for (let y = 52; y <= 90; y += 2) pts.push({ x: 50, y })
    for (const p of pts) progress = hemStep(seam, progress, p, 4).progress
    expect(hemDone(progress)).toBe(true)
    expect(hemDone(0.5)).toBe(false)
  })
})
