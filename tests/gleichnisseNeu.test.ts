/**
 * The arithmetic of the five new games of "Geschichten von Jesus" (`utils/gleichnisseNeu.ts`, Anton's plan of 5.11.2026): a hundredfold (the ears, the order of the Bible),
 * stop! (walking, stopping, judging the place, the help), to the inn (the stones, the tilt, sliding, the help never lets him slide), carry it home (jumping, stumbling, the help),
 * the way home (the beat, early and late, the foot, the print that comes); every checker finds broken data, and the real data of the adventure have no problems.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  CARRY_FEET,
  INN_SLIP,
  carryJump,
  carryLift,
  carryProblems,
  carrySimulate,
  carryStart,
  carryStep,
  haltCoast,
  haltJudge,
  haltProblems,
  haltSimulate,
  haltStart,
  haltStep,
  homeFoot,
  homeNearest,
  homePrintShow,
  homeProblems,
  homeScale,
  homeTap,
  innAuto,
  innProblems,
  innSimulate,
  innStart,
  innStep,
  neuDist,
  neuNeighbour,
  yieldDone,
  yieldExpected,
  yieldHint,
  yieldProblems,
  yieldTap,
  yieldTotal
} from '@/utils/gleichnisseNeu'
import type { CarryGame, HaltGame, HomeGame, InnGame, YieldGame, YieldRound } from '@/utils/gleichnisseNeu'

vi.mock('@/use/useSfx', () => ({
  default: () => ({ play: vi.fn(), preload: vi.fn(), stopAll: vi.fn(), lengthOf: () => 0, enabled: { value: true }, setEnabled: vi.fn(), toggle: vi.fn(), playedSince: () => true })
}))

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

describe('helpers', () => {
  it('distance and arrow keys', () => {
    expect(neuDist({ x: 0, y: 0 }, { x: 3, y: 6 }, 1.5)).toBeCloseTo(5, 6)
    const pts = [
      { x: 10, y: 50 },
      { x: 40, y: 50 },
      { x: 40, y: 90 },
      { x: 70, y: 52 }
    ]
    expect(neuNeighbour(pts, 0, 1)).toBe(1)
    expect(neuNeighbour(pts, 1, 1)).toBe(3)
    expect(neuNeighbour(pts, 1, 2)).toBe(2)
    expect(neuNeighbour(pts, 0, 3)).toBeNull()
    expect(neuNeighbour(pts, 1, 1, 1.5, (k) => k === 3)).toBeNull()
  })
})

// ---------------------------------------------------------------- 1. a hundredfold
const S = (image: string, w = 15) => ({ image, label: image, w })
const YIELD: YieldGame = {
  field: 'acker.webp',
  sprites: { y30: S('a30'), y60: S('a60'), y100: S('a100'), rock: S('fels'), thorn: S('dorn'), path: S('weg') },
  grain: S('korn', 9),
  sack: { ...S('sack', 14), x: 90, y: 99 },
  rounds: [
    {
      hint: 'r1',
      plants: [
        { kind: 'y30', x: 12, y: 55 },
        { kind: 'rock', x: 34, y: 55 },
        { kind: 'y60', x: 56, y: 55 },
        { kind: 'y100', x: 78, y: 55 },
        { kind: 'thorn', x: 46, y: 77 },
        { kind: 'path', x: 12, y: 99 }
      ]
    },
    {
      hint: 'r2',
      ordered: true,
      plants: [
        { kind: 'y60', x: 9, y: 54 },
        { kind: 'y30', x: 27, y: 54 },
        { kind: 'rock', x: 45, y: 54 },
        { kind: 'y100', x: 63, y: 54 },
        { kind: 'thorn', x: 36, y: 76 },
        { kind: 'y100', x: 18, y: 76 },
        { kind: 'path', x: 72, y: 76 }
      ]
    }
  ]
}

describe('a hundredfold', () => {
  it('an ear of the good land gives its grains, the rock, the thorns and the path give nothing', () => {
    const r = YIELD.rounds[0]!
    const h = r.plants.map(() => false)
    expect(yieldTap(r, h, 0)).toEqual({ kind: 'harvest', grains: 30 })
    expect(yieldTap(r, h, 3)).toEqual({ kind: 'harvest', grains: 100 })
    expect(yieldTap(r, h, 1)).toEqual({ kind: 'bad', why: 'rock' })
    expect(yieldTap(r, h, 4)).toEqual({ kind: 'bad', why: 'thorn' })
    expect(yieldTap(r, h, 5)).toEqual({ kind: 'bad', why: 'path' })
    expect(yieldTap(r, [true, false, false, false, false, false], 0)).toEqual({ kind: 'already' })
    expect(yieldTotal(r)).toBe(190)
    expect(yieldDone(r, [true, false, true, true, false, false])).toBe(true)
    expect(yieldDone(r, [true, false, true, false, false, false])).toBe(false)
    expect(yieldExpected(r, h)).toBeNull()
  })

  it('in the order of the Bible: first the hundredfold, then the sixtyfold, then the thirtyfold', () => {
    const r = YIELD.rounds[1]!
    const h = r.plants.map(() => false)
    expect(yieldExpected(r, h)).toBe('y100')
    expect(yieldTap(r, h, 0)).toEqual({ kind: 'order', want: 'y100' })
    expect(yieldHint(r, h)).toBe(3)
    h[3] = true
    expect(yieldHint(r, h)).toBe(5)
    h[5] = true
    expect(yieldExpected(r, h)).toBe('y60')
    expect(yieldTap(r, h, 1)).toEqual({ kind: 'order', want: 'y60' })
    expect(yieldTap(r, h, 0)).toEqual({ kind: 'harvest', grains: 60 })
    h[0] = true
    expect(yieldExpected(r, h)).toBe('y30')
    h[1] = true
    expect(yieldExpected(r, h)).toBeNull()
    expect(yieldHint(r, h)).toBeNull()
    expect(yieldDone(r, h)).toBe(true)
  })

  it('the checker finds broken data', () => {
    expect(yieldProblems(YIELD)).toEqual([])
    const g = clone(YIELD)
    g.sprites.y30.w = 8
    g.rounds[0]!.plants.push({ kind: 'y60', x: 13, y: 56 })
    g.rounds[0]!.plants.push({ kind: 'y60', x: 99, y: 30 })
    ;(g.rounds[1] as YieldRound).ordered = false
    const p = yieldProblems(g).join(' | ')
    expect(p).toMatch(/"y30" should be 12 to 30/)
    expect(p).toMatch(/too close/)
    expect(p).toMatch(/outside the picture/)
    expect(p).toMatch(/order of the Bible/)
    const g2 = clone(YIELD)
    g2.rounds[1]!.plants = g2.rounds[1]!.plants.filter((x) => x.kind !== 'y30')
    expect(yieldProblems(g2).join(' ')).toMatch(/needs an ear of "y30"/)
  })
})

// ---------------------------------------------------------------- 2. stop!
const HALT: HaltGame = {
  background: 'strasse.webp',
  road: 84,
  rider: S('reiter', 24),
  man: S('mann', 14),
  donkey: S('esel', 20),
  kneel: S('kniet', 14),
  rounds: [
    { hint: 'r1', start: 14, man: 80, spot: 63, tolerance: 5, speed: 14, accel: 30, brake: 22 },
    { hint: 'r2', start: 14, man: 66, spot: 50, tolerance: 3, speed: 20, accel: 36, brake: 16 }
  ]
}

describe('stop!', () => {
  it('holding lets the donkey walk faster up to its top speed, letting go lets it stand; the place is judged', () => {
    const r = HALT.rounds[0]!
    let st = haltStart(r)
    for (let i = 0; i < 40; i++) st = haltStep(HALT, r, st, true, 0.05).state
    expect(st.v).toBe(14)
    expect(st.x).toBeGreaterThan(30)
    let ev = null
    for (let i = 0; i < 40 && !ev; i++) {
      const res = haltStep(HALT, r, st, false, 0.05)
      st = res.state
      ev = res.event
    }
    expect(ev).toBe('stopped-early')
    expect(st.v).toBe(0)
    expect(haltCoast(14, 22)).toBeCloseTo(196 / 44, 6)
    expect(haltJudge(r, 63)).toBe('stopped-good')
    expect(haltJudge(r, 67.9)).toBe('stopped-good')
    expect(haltJudge(r, 57)).toBe('stopped-early')
    expect(haltJudge(r, 69)).toBe('stopped-late')
  })

  it('riding on too long is judged late; the right edge stops him; the help stops at the spot in both rounds', () => {
    const r = HALT.rounds[0]!
    let st = haltStart(r)
    let ev = null
    for (let i = 0; i < 400 && !ev; i++) {
      const res = haltStep(HALT, r, st, true, 0.05)
      st = res.state
      ev = res.event
    }
    expect(ev).toBe('stopped-late')
    expect(st.x).toBeCloseTo(100 - 12, 6)
    for (const round of HALT.rounds) {
      const sim = haltSimulate(HALT, round)
      expect(sim.event).toBe('stopped-good')
      expect(Math.abs(sim.x - round.spot)).toBeLessThanOrEqual(round.tolerance)
    }
  })

  it('the checker finds broken data', () => {
    expect(haltProblems(HALT)).toEqual([])
    const g = clone(HALT)
    g.rounds[0]!.spot = 79
    g.rounds[1]!.brake = 4
    g.rider.w = 10
    const p = haltProblems(g).join(' | ')
    expect(p).toMatch(/stand on the man/)
    expect(p).toMatch(/walks on too far/)
    expect(p).toMatch(/"rider" should be/)
  })
})

// ---------------------------------------------------------------- 3. to the inn
const INN: InnGame = {
  background: 'weg.webp',
  road: 86,
  start: 14,
  gate: 70,
  donkey: S('esel', 22),
  rider: S('mann', 13),
  seat: { x: 48, y: 62 },
  leader: S('samariter', 17),
  lead: 2,
  stones: [S('stein-1', 5), S('stein-2', 8)],
  rounds: [
    { hint: 'r1', speed: 5, drift: 1.2, bumps: [{ x: 34, push: 40, stone: 0 }, { x: 46, push: -35, stone: 1 }, { x: 58, push: 45, stone: 0 }, { x: 70, push: -40, stone: 1 }] },
    {
      hint: 'r2',
      speed: 6,
      drift: 2.4,
      bumps: [
        { x: 30, push: 45, stone: 0 },
        { x: 39, push: -50, stone: 1 },
        { x: 48, push: 40, stone: 0 },
        { x: 56, push: -45, stone: 0 },
        { x: 64, push: 55, stone: 1 },
        { x: 72, push: -40, stone: 0 }
      ]
    }
  ]
}

describe('to the inn', () => {
  it('the caravan walks, a stone under the front hoof pushes the man, without a finger he slides, the help keeps him on', () => {
    const r = INN.rounds[0]!
    let st = innStart(INN)
    const events: string[] = []
    for (let i = 0; i < 2000 && !st.arrived; i++) {
      const res = innStep(INN, r, st, 0, 0.05)
      st = res.state
      events.push(...res.events.map((e) => e.type))
    }
    expect(st.arrived).toBe(true)
    expect(events.filter((e) => e === 'bump')).toHaveLength(4)
    expect(events).toContain('slip')
    const sim = innSimulate(INN, r)
    expect(sim).toMatchObject({ slips: 0, arrived: true })
    expect(innSimulate(INN, INN.rounds[1]!)).toMatchObject({ slips: 0, arrived: true })
  })

  it('the finger turns him: pushing back against a forward tilt straightens him; holding one side too long throws him off', () => {
    const r = INN.rounds[0]!
    let st = { ...innStart(INN), tilt: 15, spin: 0 }
    st = innStep(INN, r, st, -1, 0.05).state
    expect(st.spin).toBeLessThan(0)
    let slid = false
    let s2 = innStart(INN)
    for (let i = 0; i < 60 && !slid; i++) {
      const res = innStep(INN, r, s2, 1, 0.05)
      s2 = res.state
      slid = res.events.some((e) => e.type === 'slip')
    }
    expect(slid).toBe(true)
    expect(s2.tilt).toBe(0)
    expect(s2.pause).toBeGreaterThan(0)
    expect(innAuto({ ...innStart(INN), tilt: 20 })).toBeLessThan(0)
    expect(INN_SLIP).toBe(30)
  })

  it('the checker finds broken data', () => {
    expect(innProblems(INN)).toEqual([])
    const g = clone(INN)
    g.rounds[0]!.bumps[1]!.x = 36
    g.rounds[0]!.bumps[2]!.push = 400
    g.rounds[1]!.bumps = g.rounds[1]!.bumps.slice(0, 2)
    g.gate = 30
    const p = innProblems(g).join(' | ')
    expect(p).toMatch(/closer than 8/)
    expect(p).toMatch(/throws the man off/)
    expect(p).toMatch(/more stones/)
    expect(p).toMatch(/gate must lie/)
  })
})

// ---------------------------------------------------------------- 4. carry it home
const CARRY: CarryGame = {
  background: 'weide.webp',
  road: 86,
  hero: S('hirte', 20),
  heroAt: 26,
  jump: 1.1,
  height: 26,
  sprites: { rock: 'fels', brook: 'bach', thorn: 'dorn' },
  labels: { rock: 'Fels', brook: 'Bach', thorn: 'Dorn' },
  home: S('zuhause', 30),
  rounds: [
    { hint: 'r1', speed: 18, home: 300, obstacles: [{ kind: 'rock', at: 95, w: 8 }, { kind: 'brook', at: 135, w: 9 }, { kind: 'rock', at: 175, w: 8 }, { kind: 'thorn', at: 212, w: 8 }, { kind: 'brook', at: 252, w: 9 }] },
    {
      hint: 'r2',
      speed: 22,
      home: 460,
      obstacles: [
        { kind: 'rock', at: 95, w: 8 },
        { kind: 'brook', at: 140, w: 12 },
        { kind: 'thorn', at: 186, w: 9 },
        { kind: 'rock', at: 230, w: 8 },
        { kind: 'brook', at: 276, w: 12 },
        { kind: 'thorn', at: 322, w: 9 },
        { kind: 'rock', at: 366, w: 8 },
        { kind: 'brook', at: 412, w: 12 }
      ]
    }
  ]
}

describe('carry it home', () => {
  it('without jumping he stumbles at the first obstacle, waits and climbs over it; a jump goes up and comes down', () => {
    const r = CARRY.rounds[0]!
    let st = carryStart()
    let hit = -1
    for (let i = 0; i < 200 && hit < 0; i++) {
      const res = carryStep(CARRY, r, st, 0.05)
      st = res.state
      for (const e of res.events) if (e.type === 'hit') hit = e.index
    }
    expect(hit).toBe(0)
    expect(st.d - (CARRY.hero.w * CARRY_FEET) / 2).toBeGreaterThan(95 + 4)
    expect(st.passed).toBe(1)
    expect(st.pause).toBeGreaterThan(0)
    let j = carryJump(carryStart())
    expect(j.air).toBe(0)
    expect(carryJump({ ...j, air: 0.3 }).air).toBe(0.3)
    j = carryStep(CARRY, r, j, 0.55).state
    expect(carryLift(j, CARRY.jump)).toBeCloseTo(1, 6)
    j = carryStep(CARRY, r, j, 0.6).state
    expect(j.air).toBeNull()
  })

  it('the help gets over everything in both rounds without a stumble', () => {
    for (const r of CARRY.rounds) expect(carrySimulate(CARRY, r)).toEqual({ hits: 0, arrived: true })
  })

  it('the checker finds broken data', () => {
    expect(carryProblems(CARRY)).toEqual([])
    const g = clone(CARRY)
    g.rounds[0]!.obstacles[1]!.w = 18
    g.rounds[0]!.obstacles[2]!.at = 150
    g.rounds[1]!.obstacles = g.rounds[1]!.obstacles.filter((o) => o.kind !== 'brook')
    const p = carryProblems(g).join(' | ')
    expect(p).toMatch(/too wide to be jumped/)
    expect(p).toMatch(/too close/)
    expect(p).toMatch(/should have a brook/)
  })
})

// ---------------------------------------------------------------- 5. the way home
const HOME: HomeGame = {
  background: 'strasse.webp',
  ratio: 0.75,
  house: { x: 50, y: 28 },
  zoom: 2.2,
  son: { ...S('sohn', 30), x: 50, y: 99 },
  print: S('fuss', 18),
  left: { x: 38, y: 72 },
  right: { x: 62, y: 72 },
  rounds: [
    { hint: 'r1', beat: 900, window: 260, steps: 10 },
    { hint: 'r2', beat: 720, window: 200, steps: 14, feet: true }
  ]
}

describe('the way home', () => {
  it('a tap in time is a step, too early or too late a stumble, a beat counts once, the other foot is a stumble in round 2', () => {
    const [r1, r2] = HOME.rounds as [HomeGame['rounds'][0], HomeGame['rounds'][0]]
    expect(homeNearest(r1, 1850)).toEqual({ beat: 2, off: 50 })
    expect(homeTap(r1, 900, null, 0, 0)).toEqual({ verdict: { kind: 'step' }, beat: 1 })
    expect(homeTap(r1, 1100, null, 0, 0).verdict.kind).toBe('step')
    expect(homeTap(r1, 1200, null, 0, 0).verdict.kind).toBe('late')
    expect(homeTap(r1, 1500, null, 1, 1).verdict.kind).toBe('early')
    expect(homeTap(r1, 950, null, 1, 1).verdict.kind).toBe('again')
    expect(homeTap(r1, 1800, 'left', 1, 1).verdict.kind).toBe('step')
    expect(homeTap(r2, 720, 'right', 0, 0).verdict.kind).toBe('foot')
    expect(homeTap(r2, 720, 'left', 0, 0).verdict.kind).toBe('step')
    expect(homeTap(r2, 1440, 'right', 1, 1).verdict.kind).toBe('step')
    expect(homeTap(r2, 1440, null, 1, 1).verdict.kind).toBe('step')
    expect([0, 1, 2, 3].map(homeFoot)).toEqual(['left', 'right', 'left', 'right'])
  })

  it('the print comes during the half beat before its moment; the picture grows toward the house', () => {
    const r = HOME.rounds[0]!
    expect(homePrintShow(r, 0)).toBe(0)
    expect(homePrintShow(r, 450)).toBeCloseTo(0, 6)
    expect(homePrintShow(r, 675)).toBeCloseTo(0.5, 6)
    expect(homePrintShow(r, 900)).toBe(1)
    expect(homePrintShow(r, 1100)).toBe(1)
    expect(homePrintShow(r, 1200)).toBe(0)
    expect(homeScale(HOME, 0, 10)).toBe(1)
    expect(homeScale(HOME, 5, 10)).toBeCloseTo(1.6, 6)
    expect(homeScale(HOME, 10, 10)).toBeCloseTo(2.2, 6)
  })

  it('the checker finds broken data', () => {
    expect(homeProblems(HOME)).toEqual([])
    const g = clone(HOME)
    g.rounds[1]!.feet = false
    g.rounds[1]!.window = 400
    g.print.w = 10
    g.right = { x: 45, y: 72 }
    const p = homeProblems(g).join(' | ')
    expect(p).toMatch(/right foot/)
    expect(p).toMatch(/window/)
    expect(p).toMatch(/footprint should be/)
    expect(p).toMatch(/overlap/)
  })
})

// ---------------------------------------------------------------- the real data
describe('the real data of "Geschichten von Jesus"', () => {
  it('every new game of the adventure can be played (all checkers say nothing)', async () => {
    const { gleichnisse } = await import('@/data/adventures/gleichnisse')
    const task = (n: number) => gleichnisse.stages[n - 1]!.task as unknown as Record<string, unknown>
    expect(yieldProblems(task(2).yieldGame as YieldGame)).toEqual([])
    expect(haltProblems(task(6).halt as HaltGame)).toEqual([])
    expect(innProblems(task(7).inn as InnGame)).toEqual([])
    expect(carryProblems(task(8).carryHome as CarryGame)).toEqual([])
    expect(homeProblems(task(10).homeward as HomeGame)).toEqual([])
  })
})
