/**
 * The arithmetic of the three new games of "Ester" (`utils/esterNeu.ts`): the whispering at the gate (phases, taps, mistakes), the sceptre (the swing, the knob, the speed of the hand,
 * a calm hand that reaches it), the messengers (directions, the land that is found, wrong lands) and the checks of the data (`*Problems`), for sample data and for the real data.
 */
import { describe, expect, it } from 'vitest'
import { ester } from '@/data/adventures/ester'
import {
  GATE_MIN_WHISPER,
  SCEPTRE_HELP_SPEED,
  angleGap,
  esterDist,
  esterStars,
  gateAreas,
  gateDone,
  gatePhase,
  gateProblems,
  gateStart,
  gateTap,
  ridersAim,
  ridersAngle,
  ridersProblems,
  ridersSend,
  sceptreAngle,
  sceptrePlay,
  sceptreProblems,
  sceptreSpeed,
  sceptreStepToward,
  sceptreTip,
  sceptreTipSpeed,
  sceptreTouch
} from '@/utils/esterNeu'
import type { GateGame, RidersGame, SceptreGame } from '@/utils/esterNeu'

const gate = (): GateGame => ({
  background: 'tor/hof.webp',
  ratio: 4 / 3,
  guards: { apart: 'a.webp', whisper: 'w.webp', x: 70, y: 90, w: 36, ratio: 0.9, split: 0.5, top: 0.05, names: ['Erster', 'Zweiter'] },
  rounds: [
    { hint: 'R1', need: 3, pattern: [3000, 3800, 2600], whisperMs: 2400 },
    { hint: 'R2', need: 4, pattern: [2200, 3400, 1600, 2800], whisperMs: 1600 }
  ]
})

const sceptre = (): SceptreGame => ({
  background: 'saal.webp',
  ratio: 4 / 3,
  arm: { image: 'arm.webp', w: 80, aspect: 3, pivot: { x: 1, y: 0.5 }, tip: { x: 0.03, y: 0.55 } },
  hand: { image: 'hand.webp', w: 18, aspect: 0.3, pivot: { x: 0.5, y: 0.02 }, tip: { x: 0.5, y: 0.02 } },
  rounds: [
    { hint: 'R1', pivot: { x: 112, y: 40 }, angle: 0, sway: 4, period: 4.2, start: { x: 30, y: 88 }, reach: 8, hold: 0.8, maxSpeed: 80 },
    { hint: 'R2', pivot: { x: 112, y: 40 }, angle: -4, sway: 7, period: 3.4, start: { x: 24, y: 90 }, reach: 6.5, hold: 1.2, maxSpeed: 55 }
  ]
})

const riders = (): RidersGame => ({
  map: 'karte.webp',
  ratio: 4 / 3,
  susa: { x: 50, y: 50, name: 'Susa' },
  lands: [
    { id: 'medien', name: 'Medien', x: 55, y: 10, angle: -79 },
    { id: 'indien', name: 'Indien', x: 90, y: 48, angle: -1 },
    { id: 'persien', name: 'Persien', x: 78, y: 86, angle: 44 },
    { id: 'kusch', name: 'Kusch', x: 15, y: 86, angle: 143 }
  ],
  letter: 'brief.webp',
  letterAspect: 2.4,
  ring: 'ring.webp',
  seal: 'siegel.webp',
  sealAt: { x: 0.5, y: 0.5 },
  sealW: 0.3,
  riderW: 16,
  rounds: [
    { hint: 'R1', tolerance: 40, letters: [{ land: 'indien', rider: 'r1.webp' }, { land: 'kusch', rider: 'r2.webp' }] },
    {
      hint: 'R2',
      tolerance: 20,
      letters: [
        { land: 'medien', rider: 'r3.webp' },
        { land: 'kusch', rider: 'r4.webp' },
        { land: 'persien', rider: 'r1.webp' },
        { land: 'indien', rider: 'r2.webp' }
      ]
    }
  ]
})

describe('esterNeu: common', () => {
  it('stars like Easter: up to two mistakes three, up to four two, then one', () => {
    expect([0, 2, 3, 4, 5, 9].map(esterStars)).toEqual([3, 3, 2, 2, 1, 1])
    expect(esterStars(-1)).toBe(3)
  })
  it('distances in units: the height counts by the ratio of the picture', () => {
    expect(esterDist({ x: 0, y: 0 }, { x: 0, y: 40 }, 4 / 3)).toBeCloseTo(30, 6)
    expect(angleGap(170, -170)).toBeCloseTo(20, 6)
    expect(angleGap(10, 350)).toBeCloseTo(20, 6)
  })
})

describe('esterNeu: listening at the gate', () => {
  it('the phases: apart, then whispering, then the next pause from the pattern (and the pattern again from the start)', () => {
    const r = gate().rounds[0]!
    expect(gatePhase(r, 0)).toMatchObject({ whisper: false, cycle: 0 })
    expect(gatePhase(r, 2999).whisper).toBe(false)
    expect(gatePhase(r, 3000)).toMatchObject({ whisper: true, cycle: 0, left: 2400 })
    expect(gatePhase(r, 5400)).toMatchObject({ whisper: false, cycle: 1 })
    expect(gatePhase(r, 5400 + 3800)).toMatchObject({ whisper: true, cycle: 1 })
    // after three cycles the pattern begins again with 3000
    const full = 3000 + 3800 + 2600 + 3 * 2400
    expect(gatePhase(r, full + 2999).whisper).toBe(false)
    expect(gatePhase(r, full + 3000)).toMatchObject({ whisper: true, cycle: 3 })
  })

  it('a tap while they stand apart is a mistake; one, then the other in the same whispering is heard; a third tap does nothing', () => {
    const r = gate().rounds[0]!
    let st = gateStart()
    expect(gateTap(r, st, 1000, 0).verdict).toBe('apart')
    let res = gateTap(r, st, 3100, 0)
    expect(res.verdict).toBe('one')
    st = res.state
    expect(gateTap(r, st, 3200, 0).verdict).toBe('again')
    res = gateTap(r, st, 3300, 1)
    expect(res.verdict).toBe('heard')
    st = res.state
    expect(st.heard).toBe(1)
    expect(gateTap(r, st, 3400, 1).verdict).toBe('again')
    // one tapped in a whispering, the other only in the next: nothing heard from the first
    res = gateTap(r, st, 9300, 0)
    expect(res.verdict).toBe('one')
    st = res.state
    res = gateTap(r, st, 14300, 1)
    expect(res.verdict).toBe('one')
    expect(res.state.heard).toBe(1)
  })

  it('Enter taps both at once; the round is done when they were heard often enough', () => {
    const r = gate().rounds[0]!
    let st = gateStart()
    const starts = [3000, 3000 + 2400 + 3800, 3000 + 2400 + 3800 + 2400 + 2600]
    for (const s of starts) st = gateTap(r, st, s + 50, -1).state
    expect(st.heard).toBe(3)
    expect(gateDone(r, st)).toBe(true)
  })

  it('the tapping areas: two halves of the picture, wide enough for a finger', () => {
    const [a, b] = gateAreas(gate())
    expect(a!.x + a!.w).toBeCloseTo(b!.x, 6)
    expect(a!.w).toBeGreaterThanOrEqual(12)
    expect(a!.y + a!.h).toBeCloseTo(90, 6)
  })

  it('the checks find what is wrong', () => {
    expect(gateProblems(gate())).toEqual([])
    const g = gate()
    g.rounds[1]!.whisperMs = GATE_MIN_WHISPER - 100
    g.guards.w = 20
    g.rounds[0]!.pattern = [800, 800]
    const p = gateProblems(g).join(' | ')
    expect(p).toMatch(/too short/)
    expect(p).toMatch(/too narrow/)
    expect(p).toMatch(/first whispering comes too soon/)
    expect(p).toMatch(/all the same/)
    const h = gate()
    h.rounds[1]!.whisperMs = 2600
    expect(gateProblems(h).join(' ')).toMatch(/shorter whisperings/)
  })
})

describe('esterNeu: the sceptre', () => {
  it('the knob swings round the pivot: at t = 0 it lies where it is painted, a quarter swing later it is turned by the sway', () => {
    const g = sceptre()
    const r = g.rounds[0]!
    const p0 = sceptreTip(g, r, 0)
    // painted: 0.97 of 80 units to the left of the pivot, 0.05 * 80 / 3 units lower
    expect(p0.x).toBeCloseTo(112 - 0.97 * 80, 4)
    expect(p0.y).toBeCloseTo(40 + ((0.05 * 80) / 3) * (4 / 3), 4)
    expect(sceptreAngle(r, r.period / 4)).toBeCloseTo(4, 6)
    const p1 = sceptreTip(g, r, r.period / 4)
    // turned clockwise on the screen: an arm pointing to the left goes up
    expect(p1.y).toBeLessThan(p0.y)
    expect(esterDist(p0, p1, g.ratio)).toBeGreaterThan(3)
    expect(sceptreTipSpeed(g, r)).toBeLessThan(r.maxSpeed * SCEPTRE_HELP_SPEED)
  })

  it('the speed of the hand: over the last moment; a slow hand is calm, a quick one is hasty', () => {
    const slow = Array.from({ length: 10 }, (_, i) => ({ x: 30 + i * 0.5, y: 80, t: i * 0.03 }))
    expect(sceptreSpeed(slow, 4 / 3)).toBeCloseTo(0.5 / 0.03, 3)
    const quick = Array.from({ length: 10 }, (_, i) => ({ x: 30 + i * 4, y: 80, t: i * 0.03 }))
    expect(sceptreSpeed(quick, 4 / 3)).toBeGreaterThan(100)
    expect(sceptreSpeed([{ x: 0, y: 0, t: 0 }], 4 / 3)).toBe(0)
    expect(sceptreSpeed([{ x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 0.01 }], 4 / 3)).toBe(0)
  })

  it('a step toward the knob is never longer than asked; the touch counts within the reach', () => {
    const g = sceptre()
    const r = g.rounds[0]!
    const tip = sceptreTip(g, r, 0)
    const p = sceptreStepToward(r.start, tip, g.ratio, 5)
    expect(esterDist(r.start, p, g.ratio)).toBeCloseTo(5, 6)
    expect(sceptreTouch(g, r, tip, 0)).toBe(true)
    expect(sceptreTouch(g, r, { x: tip.x + r.reach + 1, y: tip.y }, 0)).toBe(false)
  })

  it('a calm hand that follows the knob reaches it in both rounds', () => {
    const g = sceptre()
    for (const ri of [0, 1]) {
      const play = sceptrePlay(g, ri)
      expect(play.done, `round ${ri + 1}`).toBe(true)
      expect(play.seconds).toBeLessThan(20)
    }
  })

  it('the checks find what is wrong', () => {
    expect(sceptreProblems(sceptre())).toEqual([])
    const g = sceptre()
    g.rounds[1]!.sway = 30
    g.rounds[1]!.period = 1.6
    g.rounds[0]!.reach = 4
    g.hand.w = 8
    const p = sceptreProblems(g).join(' | ')
    expect(p).toMatch(/too fast to follow/)
    expect(p).toMatch(/too small a target/)
    expect(p).toMatch(/hand is too small/)
    const h = sceptre()
    h.rounds[1]!.maxSpeed = 90
    expect(sceptreProblems(h).join(' ')).toMatch(/calmer hand/)
    const k = sceptre()
    k.rounds[0]!.pivot = { x: 112, y: 4 }
    expect(sceptreProblems(k).join(' ')).toMatch(/leaves the field/)
  })
})

describe('esterNeu: messengers', () => {
  it('directions on the screen from Susa: right 0, down 90, up -90, left 180 (the height counts by the ratio)', () => {
    const g = riders()
    expect(ridersAngle(g, { x: 90, y: 50 })).toBeCloseTo(0, 6)
    expect(ridersAngle(g, { x: 50, y: 90 })).toBeCloseTo(90, 6)
    expect(ridersAngle(g, { x: 50, y: 10 })).toBeCloseTo(-90, 6)
    expect(Math.abs(ridersAngle(g, { x: 10, y: 50 }))).toBeCloseTo(180, 6)
    expect(ridersAngle(g, { x: 80, y: 90 })).toBeCloseTo((Math.atan2(30, 30) * 180) / Math.PI, 6)
  })

  it('the land in a direction: the nearest within the tolerance; nothing between the lands', () => {
    const g = riders()
    const [r1, r2] = g.rounds
    expect(ridersAim(g, r1!, 10)?.id).toBe('indien')
    expect(ridersAim(g, r1!, 160)?.id).toBe('kusch')
    expect(ridersAim(g, r2!, 22)).toBeNull()
    expect(ridersAim(g, r2!, 180)).toBeNull()
    expect(ridersSend(g, r1!, r1!.letters[0]!, 5).verdict).toBe('right')
    expect(ridersSend(g, r1!, r1!.letters[0]!, 140)).toMatchObject({ verdict: 'wrong', land: { id: 'kusch' } })
    expect(ridersSend(g, r2!, r2!.letters[0]!, 100).verdict).toBe('none')
  })

  it('the checks find what is wrong', () => {
    expect(ridersProblems(riders())).toEqual([])
    const g = riders()
    g.lands[2]!.angle = 10
    g.riderW = 9
    g.rounds[1]!.letters.push({ land: 'babel', rider: 'r.webp' })
    const p = ridersProblems(g).join(' | ')
    expect(p).toMatch(/does not fit its place/)
    expect(p).toMatch(/too small for a phone/)
    expect(p).toMatch(/not on the map/)
    expect(p).toMatch(/too close in direction/)
    const h = riders()
    h.rounds[1]!.tolerance = 45
    expect(ridersProblems(h).join(' ')).toMatch(/more exact/)
  })
})

describe('esterNeu: the real data of "Ester"', () => {
  const task = (n: number) => ester.stages[n - 1]!.task as unknown as Record<string, unknown>
  it('stage 3 is the gate, 6 the sceptre, 9 the messengers, and their checks find nothing', () => {
    expect(task(3).kind).toBe('tor')
    expect(task(6).kind).toBe('zepter')
    expect(task(9).kind).toBe('boten')
    expect(gateProblems(task(3).gateWatch as GateGame)).toEqual([])
    expect(sceptreProblems(task(6).sceptre as SceptreGame)).toEqual([])
    expect(ridersProblems(task(9).riders as RidersGame)).toEqual([])
  })
})
