/**
 * The pure parts of the two games of "Ostern" (`utils/osternGames.ts`): stars, distances, the swimming and the catch of "The net on the right" (`fischzug`), the walking, the line of animals, the thorns,
 * the brook with its bridge, the pen and the end of "Lead the lambs" (`weiden`), and the checks of the data.
 */
import { describe, expect, it } from 'vitest'
import {
  GRAZE_GAP,
  GRAZE_JOIN,
  OSTER_RATIO,
  fischzugBestSpot,
  fischzugCatch,
  fischzugDir,
  fischzugNudge,
  fischzugPos,
  fischzugProblems,
  fischzugRadius,
  fischzugStart,
  fischzugStep,
  fischzugVerdict,
  grazeAround,
  grazeDone,
  grazeHelpTarget,
  grazeInPen,
  grazeMove,
  grazeNudge,
  grazePennedCount,
  grazePenSlot,
  grazeProblems,
  grazeRoute,
  grazeStart,
  grazeStarts,
  grazeStep,
  grazeThornRadius,
  grazeTrailPoint,
  grazeWet,
  osterClamp,
  osterDist,
  osterInBox,
  osterPointIn,
  osterStars
} from '@/utils/osternGames'
import type { GrazeEvent, GrazeState, Pt } from '@/utils/osternGames'
import { seeded } from '@/utils/jakobGames'
import { FISCH, GRAZE, sprite } from './osternSamples'

describe('stars and distances', () => {
  it('up to two mistakes three stars, up to four two stars, then one', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(osterStars)).toEqual([3, 3, 3, 2, 2, 1, 1])
    expect(osterStars(-3)).toBe(3)
  })

  it('a step down counts less than a step across, because the picture is 3:2', () => {
    expect(osterDist({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10)
    expect(osterDist({ x: 0, y: 0 }, { x: 0, y: 15 })).toBeCloseTo(10)
    expect(osterDist({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
    expect(OSTER_RATIO).toBe(1.5)
  })

  it('points and boxes; clamping to the picture', () => {
    const r = { left: 10, top: 10, right: 20, bottom: 20 }
    expect(osterPointIn(r, 15, 15)).toBe(true)
    expect(osterPointIn(r, 22, 15)).toBe(false)
    expect(osterPointIn(r, 22, 15, 3)).toBe(true)
    expect(osterInBox({ left: 1, top: 1, right: 5, bottom: 5 }, { x: 3, y: 3 })).toBe(true)
    expect(osterInBox({ left: 1, top: 1, right: 5, bottom: 5 }, { x: 6, y: 3 })).toBe(false)
    expect(osterClamp({ x: -4, y: 130 })).toEqual({ x: 0, y: 100 })
  })
})

// ---------------------------------------------------------------- the net on the right
describe('fischzug: the swarms', () => {
  const area = FISCH.area
  const inArea = (p: Pt) => p.x >= area.left && p.x <= area.right && p.y >= area.top && p.y <= area.bottom

  it('round 1: five fish in one swarm; round 2: eight fish in two swarms of four; the shapes go round', () => {
    const a = fischzugStart(FISCH.rounds[0]!, area, 3, 3.5, seeded(1))
    expect(a.fish).toHaveLength(5)
    expect(a.schools).toHaveLength(1)
    expect(a.fish.map((f) => f.kind)).toEqual([0, 1, 2, 0, 1])
    const b = fischzugStart(FISCH.rounds[1]!, area, 3, 3.5, seeded(1))
    expect(b.fish).toHaveLength(8)
    expect(b.schools).toHaveLength(2)
    expect(b.fish.filter((f) => f.school === 0)).toHaveLength(4)
    expect(b.fish.filter((f) => f.school === 1)).toHaveLength(4)
    // the swarms start apart from each other: the first in the left half, the second in the right half
    expect(b.schools[0]!.x).toBeLessThan(b.schools[1]!.x)
  })

  it('the same dice give the same swarm', () => {
    const a = fischzugStart(FISCH.rounds[1]!, area, 3, 3.5, seeded(7))
    const b = fischzugStart(FISCH.rounds[1]!, area, 3, 3.5, seeded(7))
    expect(a).toEqual(b)
    const c = fischzugStart(FISCH.rounds[1]!, area, 3, 3.5, seeded(8))
    expect(c).not.toEqual(a)
  })

  it('every fish is in the water at the start and stays there for four minutes of swimming; the swarms swim on and turn at the edges', () => {
    for (const round of FISCH.rounds) {
      const rand = seeded(3)
      let pond = fischzugStart(round, area, 3, 3.5, rand)
      for (let i = 0; i < pond.fish.length; i++) expect(inArea(fischzugPos(pond, i))).toBe(true)
      const x0 = pond.schools.map((s) => s.x)
      let turned = 0
      let lastSign = pond.schools.map((s) => Math.sign(s.vx))
      for (let step = 0; step < 4800; step++) {
        pond = fischzugStep(pond, 0.05, area, rand)
        pond.schools.forEach((s, k) => {
          if (Math.sign(s.vx) !== lastSign[k]) turned++
          lastSign[k] = Math.sign(s.vx)
        })
        for (let i = 0; i < pond.fish.length; i++) {
          const p = fischzugPos(pond, i)
          expect(p.x).toBeGreaterThanOrEqual(area.left - 0.5)
          expect(p.x).toBeLessThanOrEqual(area.right + 0.5)
          expect(p.y).toBeGreaterThanOrEqual(area.top - 0.8)
          expect(p.y).toBeLessThanOrEqual(area.bottom + 0.8)
        }
      }
      expect(pond.time).toBeCloseTo(240)
      expect(turned).toBeGreaterThan(2)
      expect(pond.schools.map((s) => s.x)).not.toEqual(x0)
    }
  })

  it('a swarm swims about 3.5 units a second and the fish look the way it swims', () => {
    const rand = seeded(5)
    const pond = fischzugStart(FISCH.rounds[0]!, area, 3, 3.5, rand)
    const speed = Math.hypot(pond.schools[0]!.vx, pond.schools[0]!.vy)
    expect(speed).toBeGreaterThan(2.5)
    expect(speed).toBeLessThan(4.5)
    expect(fischzugDir(pond, 0)).toBe(pond.schools[0]!.vx < 0 ? -1 : 1)
  })

  it('a fish that sways stays within a unit of its place', () => {
    const pond = fischzugStart(FISCH.rounds[0]!, area, 3, 3.5, seeded(2))
    const f = pond.fish[0]!
    const s = pond.schools[0]!
    const p = fischzugPos(pond, 0)
    expect(Math.abs(p.x - (s.x + f.ox))).toBeLessThanOrEqual(1.0001)
    expect(Math.abs(p.y - (s.y + f.oy))).toBeLessThanOrEqual(1.5001)
  })
})

describe('fischzug: the catch', () => {
  const pos: Pt[] = [
    { x: 40, y: 50 },
    { x: 52, y: 50 },
    { x: 40, y: 80 },
    { x: 70, y: 50 }
  ]

  it('the circle takes in the fish whose middle lies in it; the net is as wide as the circle', () => {
    expect(fischzugRadius(30)).toBe(15)
    expect(fischzugCatch(pos, [false, false, false, false], { x: 46, y: 50 }, 15)).toEqual([0, 1])
    // 12 units to the right of the first fish: just inside, 16: outside
    expect(fischzugCatch(pos, [], { x: 52, y: 50 }, 12)).toEqual([0, 1])
    expect(fischzugCatch(pos, [], { x: 56, y: 50 }, 4)).toEqual([1])
    expect(fischzugCatch(pos, [], { x: 10, y: 10 }, 15)).toEqual([])
  })

  it('the circle is round on the screen: 15 percent of the height are 10 units, 15 percent of the width are 15', () => {
    // a fish 10 percent of the width away is in a circle of 12, a fish 15 percent of the height away (10 units) too, one 20 percent of the height away (13.3) is not
    expect(fischzugCatch([{ x: 60, y: 50 }], [], { x: 50, y: 50 }, 12)).toEqual([0])
    expect(fischzugCatch([{ x: 50, y: 65 }], [], { x: 50, y: 50 }, 12)).toEqual([0])
    expect(fischzugCatch([{ x: 50, y: 70 }], [], { x: 50, y: 50 }, 12)).toEqual([])
  })

  it('a fish that is caught already is not caught twice', () => {
    expect(fischzugCatch(pos, [true, false, false, false], { x: 46, y: 50 }, 15)).toEqual([1])
  })

  it('the best place takes in the most fish (the first one on a tie); none when no fish is left', () => {
    const spot = fischzugBestSpot(pos, [false, false, false, false], 15)!
    expect(fischzugCatch(pos, [], spot, 15).length).toBe(2)
    expect(spot).toEqual({ x: 40, y: 50 })
    expect(fischzugBestSpot(pos, [true, true, true, true], 15)).toBeNull()
    expect(fischzugBestSpot([], [], 15)).toBeNull()
    expect(fischzugBestSpot(pos, [true, true, false, true], 15)).toEqual({ x: 40, y: 80 })
  })

  it('a cast at the middle of a start swarm takes in all of it', () => {
    const pond = fischzugStart(FISCH.rounds[0]!, FISCH.area, 3, 3.5, seeded(4))
    const ps = pond.fish.map((_, i) => fischzugPos(pond, i))
    const mid = { x: ps.reduce((n, p) => n + p.x, 0) / ps.length, y: ps.reduce((n, p) => n + p.y, 0) / ps.length }
    expect(fischzugCatch(ps, [], mid, fischzugRadius(FISCH.net.w))).toHaveLength(5)
  })
})

describe('fischzug: the round', () => {
  it('enough fish win, no cast left without enough fish lose, otherwise it goes on', () => {
    expect(fischzugVerdict(4, 4, 5, 2)).toBe('won')
    expect(fischzugVerdict(5, 4, 5, 0)).toBe('won')
    expect(fischzugVerdict(3, 4, 5, 2)).toBe('going')
    expect(fischzugVerdict(3, 4, 5, 0)).toBe('lost')
    expect(fischzugVerdict(0, 4, 5, 0)).toBe('lost')
    // a goal above the number of fish: all the fish are enough
    expect(fischzugVerdict(5, 9, 5, 2)).toBe('won')
  })

  it('the arrow keys move the circle: three units across, as much on the screen down; never out of the picture', () => {
    expect(fischzugNudge({ x: 50, y: 50 }, 1, 0)).toEqual({ x: 53, y: 50 })
    expect(fischzugNudge({ x: 50, y: 50 }, 0, 1)).toEqual({ x: 50, y: 54.5 })
    expect(fischzugNudge({ x: 1, y: 1 }, -1, -1)).toEqual({ x: 0, y: 0 })
    expect(fischzugNudge({ x: 99, y: 99 }, 1, 1)).toEqual({ x: 100, y: 100 })
  })
})

describe('fischzug: the data', () => {
  it('the sample data are in order', () => {
    expect(fischzugProblems(FISCH)).toEqual([])
  })

  it('wrong data are found', () => {
    expect(fischzugProblems({ ...FISCH, area: { left: 50, top: 30, right: 40, bottom: 78 } })).not.toEqual([])
    expect(fischzugProblems({ ...FISCH, net: sprite('netz', 8) }).join()).toContain('net')
    expect(fischzugProblems({ ...FISCH, fish: [] }).join()).toContain('fish pictures')
    expect(fischzugProblems({ ...FISCH, rounds: [] }).join()).toContain('no rounds')
    expect(fischzugProblems({ ...FISCH, rounds: [{ hint: 'x', fish: 5, throws: 3, goal: 6 }] }).join()).toContain('goal')
    expect(fischzugProblems({ ...FISCH, rounds: [{ hint: 'x', fish: 2, throws: 3, goal: 1, schools: 3 }] }).join()).toContain('swarms')
    expect(fischzugProblems({ ...FISCH, rounds: [{ hint: 'x', fish: 5, throws: 0, goal: 2 }] }).join()).toContain('no casts')
    expect(fischzugProblems({ ...FISCH, area: { left: 40, top: 30, right: 60, bottom: 78 } }).join()).toContain('too narrow')
    expect(fischzugProblems({ ...FISCH, area: { left: 6, top: 40, right: 94, bottom: 55 } }).join()).toContain('too low')
    expect(fischzugProblems({ ...FISCH, rounds: [FISCH.rounds[1]!, FISCH.rounds[0]!] }).join()).toContain('round 2 should have more fish')
  })
})

// ---------------------------------------------------------------- lead the lambs
const ri = 0
const dt = 0.05

/** Walk the shepherd along the places (each is walked to, then the next), the animals follow; returns the states and everything that happened. */
function walk(game = GRAZE, round = ri, st: GrazeState = grazeStart(GRAZE, round), places: Pt[], maxSeconds = 90) {
  const events: GrazeEvent[] = []
  const states: GrazeState[] = []
  let state = st
  let t = 0
  for (const p of places) {
    for (let guard = 0; guard < 4000 && t < maxSeconds; guard++) {
      const res = grazeStep(game, round, state, p, dt)
      state = res.state
      events.push(...res.events)
      states.push(state)
      t += dt
      if (osterDist(state.hirte, p) < 0.3) break
      if (!state.hirte.moving && guard > 60) break
    }
  }
  return { state, events, states, t }
}
/** Stand still for some seconds. */
function wait(game: typeof GRAZE, round: number, st: GrazeState, seconds: number, target: Pt | null = null) {
  const events: GrazeEvent[] = []
  let state = st
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    const res = grazeStep(game, round, state, target, dt)
    state = res.state
    events.push(...res.events)
  }
  return { state, events }
}
const kinds = (events: GrazeEvent[], type: GrazeEvent['type']) => events.filter((e) => e.type === type)

describe('weiden: places and the pen', () => {
  it('the start: the shepherd at his place, the animals wait at their places (or in an arc in front of him)', () => {
    const st = grazeStart(GRAZE, 0)
    expect(st.hirte).toMatchObject({ x: 8, y: 72, face: 1 })
    expect(st.animals).toHaveLength(4)
    expect(st.animals.every((a) => a.mode === 'idle' && !a.careful)).toBe(true)
    expect(st.animals[0]).toMatchObject({ x: 22, y: 66, kind: 'lamm-1' })
    const noStarts = { ...GRAZE, rounds: [{ ...GRAZE.rounds[0]!, starts: undefined }] }
    const arc = grazeStarts(noStarts, 0)
    expect(arc).toHaveLength(4)
    expect(arc.every((p) => osterDist(p, GRAZE.hirte) > GRAZE_JOIN)).toBe(true)
    expect(arc.every((p) => !grazeInPen(GRAZE, p))).toBe(true)
  })

  it('the pen has room for every animal, each in its own place inside', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const slots = Array.from({ length: n }, (_, i) => grazePenSlot(GRAZE, i, n))
      slots.forEach((p) => expect(grazeInPen(GRAZE, p)).toBe(true))
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) expect(osterDist(slots[a]!, slots[b]!)).toBeGreaterThan(3)
    }
  })

  it('the water: only inside the band and off the lane of the bridge, and only in a round with the brook', () => {
    expect(grazeWet(GRAZE, 1, { x: 50, y: 70 })).toBe(true)
    expect(grazeWet(GRAZE, 1, { x: 50, y: 48 })).toBe(false)
    expect(grazeWet(GRAZE, 1, { x: 40, y: 70 })).toBe(false)
    expect(grazeWet(GRAZE, 0, { x: 50, y: 70 })).toBe(false)
  })
})

describe('weiden: walking', () => {
  it('the way of the shepherd: a point is found behind him, along the way he walked', () => {
    const trail: Pt[] = [
      { x: 10, y: 50 },
      { x: 20, y: 50 },
      { x: 30, y: 50 }
    ]
    expect(grazeTrailPoint(trail, { x: 35, y: 50 }, 5)).toEqual({ x: 30, y: 50 })
    expect(grazeTrailPoint(trail, { x: 35, y: 50 }, 10).x).toBeCloseTo(25)
    expect(grazeTrailPoint(trail, { x: 35, y: 50 }, 25).x).toBeCloseTo(10)
    // the way is not that long: the places lie in a line behind the oldest one (the shepherd faces right)
    expect(grazeTrailPoint(trail, { x: 35, y: 50 }, 30)).toEqual({ x: 5, y: 50 })
    expect(grazeTrailPoint(trail, { x: 35, y: 50 }, 35)).toEqual({ x: 1, y: 50 })
    expect(grazeTrailPoint([{ x: 50, y: 50 }], { x: 50, y: 50 }, 10, 1)).toEqual({ x: 40, y: 50 })
    expect(grazeTrailPoint([{ x: 50, y: 50 }], { x: 50, y: 50 }, 10, -1)).toEqual({ x: 60, y: 50 })
  })

  it('a step goes toward the goal, never farther than the step, and a place in the water is not entered (the walker slides along the bank)', () => {
    const free = () => false
    expect(grazeMove({ x: 10, y: 50 }, { x: 40, y: 50 }, 5, free)).toMatchObject({ x: 15, y: 50, moved: true })
    expect(grazeMove({ x: 10, y: 50 }, { x: 12, y: 50 }, 5, free)).toMatchObject({ x: 12, moved: true })
    expect(grazeMove({ x: 10, y: 50 }, { x: 10, y: 50 }, 5, free).moved).toBe(false)
    // a step down is as long on the screen as a step across
    const down = grazeMove({ x: 10, y: 20 }, { x: 10, y: 80 }, 5, free)
    expect(down.y - 20).toBeCloseTo(5 * OSTER_RATIO)
    const water = (p: Pt) => p.x > 46 && p.x < 54 && (p.y < 40 || p.y > 56)
    const slide = grazeMove({ x: 45.5, y: 70 }, { x: 80, y: 62 }, 3, water)
    expect(slide.moved).toBe(true)
    expect(slide.x).toBeLessThanOrEqual(46)
    expect(slide.y).toBeLessThan(70)
    expect(grazeMove({ x: 45.5, y: 70 }, { x: 80, y: 70 }, 3, water)).toMatchObject({ moved: false, blocked: true })
  })

  it('the shepherd walks at 22 units a second and faces the way he walks', () => {
    let st = grazeStart(GRAZE, 0)
    for (let i = 0; i < 20; i++) st = grazeStep(GRAZE, 0, st, { x: 90, y: 72 }, dt).state
    expect(st.hirte.x).toBeCloseTo(8 + 22, 0)
    expect(st.hirte.face).toBe(1)
    expect(st.hirte.moving).toBe(true)
    const back = grazeStep(GRAZE, 0, st, { x: 2, y: 72 }, dt).state
    expect(back.hirte.face).toBe(-1)
    const stand = grazeStep(GRAZE, 0, back, null, dt).state
    expect(stand.hirte.moving).toBe(false)
    expect(stand.hirte.x).toBe(back.hirte.x)
  })
})

describe('weiden: the animals follow', () => {
  it('an animal that is near enough joins (14 units), one that is not stays; they join in the order they were met', () => {
    let st = grazeStart(GRAZE, 0)
    // nobody is near at the start: the first lamb is 14.6 units away
    const first = grazeStep(GRAZE, 0, st, null, dt)
    expect(first.events).toEqual([])
    expect(osterDist(st.hirte, st.animals[0]!)).toBeGreaterThan(GRAZE_JOIN)
    const r = walk(GRAZE, 0, st, [{ x: 24, y: 70 }])
    expect(kinds(r.events, 'join').length).toBeGreaterThanOrEqual(1)
    expect(r.state.order.length).toBe(kinds(r.events, 'join').length)
    expect(r.state.order[0]).toBe((kinds(r.events, 'join')[0] as { index: number }).index)
    for (const i of r.state.order) expect(r.state.animals[i]!.mode).toBe('follow')
    st = r.state
  })

  it('followers walk in a line behind him, each about five units behind the one before', () => {
    const r = walk(GRAZE, 0, grazeStart(GRAZE, 0), [{ x: 40, y: 70 }, { x: 40, y: 70 }])
    const s = wait(GRAZE, 0, r.state, 6)
    expect(s.state.order).toHaveLength(4)
    const gaps = s.state.order.map((i, k) => osterDist(s.state.animals[i]!, k === 0 ? s.state.hirte : s.state.animals[s.state.order[k - 1]!]!))
    gaps.forEach((g) => expect(g).toBeGreaterThan(GRAZE_GAP * 0.4))
    gaps.forEach((g) => expect(g).toBeLessThan(GRAZE_GAP * 2.5))
  })

  it('sheep walk slower than lambs', () => {
    const st = grazeStart(GRAZE, 1)
    const lamb = st.animals[0]!.kind
    expect(lamb).toBe('lamm-1')
    expect(GRAZE.kinds.find((k) => k.id === 'schaf')!.speed).toBeLessThan(26)
  })

  it('a shepherd who is too fast leaves the animals behind (no mistake, they stand), and they join again when he comes back', () => {
    const fast = { ...GRAZE, speed: 60, rounds: [{ ...GRAZE.rounds[0]!, thorns: [] }, GRAZE.rounds[1]!] }
    const r = walk(fast, 0, grazeStart(fast, 0), [{ x: 40, y: 70 }, { x: 95, y: 40 }])
    expect(kinds(r.events, 'lost').length).toBeGreaterThan(0)
    expect(kinds(r.events, 'stuck')).toHaveLength(0)
    const lost = r.state.animals.filter((a) => a.mode === 'idle')
    expect(lost.length).toBeGreaterThan(0)
    // back to them: they follow again
    const there = lost[0]!
    const back = walk(fast, 0, r.state, [{ x: there.x, y: there.y }])
    expect(kinds(back.events, 'join').length).toBeGreaterThan(0)
  })

  it('the shepherd standing in the pen: the followers walk to their places in it and stay there (a tick for each)', () => {
    const route: Pt[] = [{ x: 45, y: 60 }, { x: 65, y: 60 }, { x: 88, y: 72 }]
    const r = walk(GRAZE, 0, grazeStart(GRAZE, 0), route)
    expect(kinds(r.events, 'stuck')).toHaveLength(0)
    const s = wait(GRAZE, 0, r.state, 30, { x: 88, y: 72 })
    const all = [...r.events, ...s.events]
    expect(kinds(all, 'penned')).toHaveLength(4)
    expect(grazeDone(s.state)).toBe(true)
    expect(grazePennedCount(s.state)).toBe(4)
    s.state.animals.forEach((a, i) => expect(a).toMatchObject(grazePenSlot(GRAZE, i, 4)))
    expect(s.state.order).toEqual([])
  })

  it('an animal in the pen does not follow any more', () => {
    const route: Pt[] = [{ x: 45, y: 60 }, { x: 65, y: 60 }, { x: 88, y: 72 }]
    const r = walk(GRAZE, 0, grazeStart(GRAZE, 0), route)
    const s = wait(GRAZE, 0, r.state, 30, { x: 88, y: 72 })
    const out = walk(GRAZE, 0, s.state, [{ x: 20, y: 60 }])
    out.state.animals.forEach((a, i) => expect(a).toMatchObject(grazePenSlot(GRAZE, i, 4)))
  })
})

describe('weiden: the thorns', () => {
  const straight: Pt[] = [{ x: 90, y: 72 }]

  it('an animal that walks into the thornbush stands (a mistake), bleats and waits at the edge of the bush', () => {
    const r = walk(GRAZE, 0, grazeStart(GRAZE, 0), straight, 40)
    const stuck = kinds(r.events, 'stuck') as { index: number; thorn: number }[]
    expect(stuck.length).toBeGreaterThanOrEqual(1)
    expect(stuck[0]!.thorn).toBe(0)
    const a = r.state.animals[stuck[0]!.index]!
    expect(a.mode === 'stuck' || a.mode === 'follow' || a.mode === 'penned').toBe(true)
    // nobody stands inside the bush
    const rad = grazeThornRadius(GRAZE)
    r.states.forEach((s) => s.animals.forEach((x) => expect(osterDist(x, GRAZE.rounds[0]!.thorns[0]!)).toBeGreaterThanOrEqual(rad - 1e-6)))
  })

  it('every animal is stopped by a bush at most once; an animal that was stopped walks round the thorns when it is called again, and everyone ends in the pen', () => {
    const first = walk(GRAZE, 0, grazeStart(GRAZE, 0), straight, 40)
    const stuckAnimals = (kinds(first.events, 'stuck') as { index: number }[]).map((e) => e.index)
    expect(stuckAnimals.length).toBeGreaterThanOrEqual(1)
    // the shepherd goes back to the bush, waits, and leads them round it into the pen
    const bush = GRAZE.rounds[0]!.thorns[0]!
    const back = walk(GRAZE, 0, first.state, [{ x: bush.x - 8, y: bush.y - 12 }, { x: bush.x + 12, y: bush.y - 12 }, { x: 88, y: 72 }], 90)
    const rest = wait(GRAZE, 0, back.state, 40, { x: 88, y: 72 })
    const all = [...first.events, ...back.events, ...rest.events]
    const stuckAll = (kinds(all, 'stuck') as { index: number }[]).map((e) => e.index)
    expect(new Set(stuckAll).size).toBe(stuckAll.length)
    expect(kinds(all, 'join').some((e) => (e as { recalled: boolean }).recalled)).toBe(true)
    expect(grazeDone(rest.state)).toBe(true)
  })

  it('a stuck animal cannot be called at once: it bleats for a second first', () => {
    const first = walk(GRAZE, 0, grazeStart(GRAZE, 0), straight, 40)
    const i = (kinds(first.events, 'stuck')[0] as { index: number }).index
    // build the moment: the animal has just been stopped, the shepherd is right beside it
    const st: GrazeState = {
      ...first.state,
      hirte: { ...first.state.hirte, x: 52, y: 72 },
      order: [],
      animals: first.state.animals.map((a, k) => (k === i ? { ...a, x: 51.5, y: 72, mode: 'stuck', careful: true, wait: 1 } : { ...a, mode: 'idle' }))
    }
    const early = grazeStep(GRAZE, 0, st, null, dt)
    expect(kinds(early.events, 'join').filter((e) => (e as { index: number }).index === i)).toHaveLength(0)
    const late = wait(GRAZE, 0, st, 1.2)
    expect(kinds(late.events, 'join').some((e) => (e as { index: number }).index === i)).toBe(true)
  })

  it('a bush lies in the way: a careful animal turns aside, with no bush on the way it goes straight', () => {
    const bush = [{ x: 50, y: 60 }]
    const r = grazeThornRadius(GRAZE)
    const around = grazeAround({ x: 40, y: 60 }, { x: 60, y: 60 }, bush, r)
    expect(around).not.toEqual({ x: 60, y: 60 })
    expect(osterDist(around, bush[0]!)).toBeCloseTo(r * 1.4, 1)
    expect(grazeAround({ x: 40, y: 80 }, { x: 60, y: 80 }, bush, r)).toEqual({ x: 60, y: 80 })
    expect(grazeAround({ x: 40, y: 60 }, { x: 60, y: 60 }, [], r)).toEqual({ x: 60, y: 60 })
    // the bush is behind the start: no turn
    expect(grazeAround({ x: 52, y: 60 }, { x: 70, y: 60 }, [{ x: 40, y: 60 }], r)).toEqual({ x: 70, y: 60 })
  })
})

describe('weiden: the brook and the bridge', () => {
  const lane = (GRAZE.stream.top + GRAZE.stream.bottom) / 2
  // first past all the animals, then over the bridge, then to the pen
  const across: Pt[] = [{ x: 34, y: 70 }, { x: 38, y: lane }, { x: 62, y: lane }, { x: 88, y: 72 }]

  it('the route: on the same bank the goal itself; across, first the bridge, then over it; no brook, no route', () => {
    expect(grazeRoute(GRAZE, 1, { x: 20, y: 70 }, { x: 30, y: 60 })).toEqual({ x: 30, y: 60 })
    const toBridge = grazeRoute(GRAZE, 1, { x: 20, y: 70 }, { x: 80, y: 70 })
    expect(toBridge.x).toBeLessThan(GRAZE.stream.from)
    expect(toBridge.y).toBe(lane)
    const over = grazeRoute(GRAZE, 1, { x: GRAZE.stream.from - 0.8, y: lane }, { x: 80, y: 70 })
    expect(over.x).toBeGreaterThan(GRAZE.stream.to)
    const onBridge = grazeRoute(GRAZE, 1, { x: 50, y: lane }, { x: 80, y: 70 })
    expect(onBridge.x).toBeGreaterThan(GRAZE.stream.to)
    expect(grazeRoute(GRAZE, 0, { x: 20, y: 70 }, { x: 80, y: 70 })).toEqual({ x: 80, y: 70 })
    // coming back: the other way
    expect(grazeRoute(GRAZE, 1, { x: 70, y: 70 }, { x: 20, y: 70 }).x).toBeGreaterThan(GRAZE.stream.to)
  })

  it('the shepherd does not walk through the water: straight across he stops at the bank', () => {
    const r = walk(GRAZE, 1, grazeStart(GRAZE, 1), [{ x: 88, y: 72 }], 30)
    expect(r.state.hirte.x).toBeLessThanOrEqual(GRAZE.stream.from + 0.01)
    r.states.forEach((s) => expect(grazeWet(GRAZE, 1, s.hirte)).toBe(false))
  })

  it('over the bridge all four animals follow him into the pen, and none of them is ever in the water', () => {
    const r = walk(GRAZE, 1, grazeStart(GRAZE, 1), across, 90)
    const s = wait(GRAZE, 1, r.state, 40, { x: 88, y: 72 })
    const all = [...r.states]
    all.forEach((st) => {
      expect(grazeWet(GRAZE, 1, st.hirte)).toBe(false)
      st.animals.forEach((a) => expect(grazeWet(GRAZE, 1, a)).toBe(false))
    })
    expect(kinds([...r.events, ...s.events], 'penned')).toHaveLength(4)
    expect(grazeDone(s.state)).toBe(true)
  })

  it('an animal on the other bank finds the bridge by itself when the shepherd crossed it', () => {
    // the shepherd is on the far bank already, the animals wait on the near one and follow
    let st = grazeStart(GRAZE, 1)
    st = { ...st, hirte: { x: 70, y: 70, face: 1, moving: false }, trail: [{ x: 70, y: 70 }], order: [0, 1], animals: st.animals.map((a, i) => (i < 2 ? { ...a, mode: 'follow' as const, x: 40, y: 72 } : a)) }
    const s = wait(GRAZE, 1, st, 12)
    s.state.animals.slice(0, 2).forEach((a) => expect(a.x).toBeGreaterThan(GRAZE.stream.to))
  })
})

describe('weiden: help, keys and data', () => {
  it('"Help me" sends the shepherd to the nearest animal that is not with him, otherwise to the pen', () => {
    const st = grazeStart(GRAZE, 0)
    expect(grazeHelpTarget(GRAZE, st)).toEqual({ x: 22, y: 66 })
    const withAll: GrazeState = { ...st, animals: st.animals.map((a) => ({ ...a, mode: 'follow' as const })) }
    const toPen = grazeHelpTarget(GRAZE, withAll)
    expect(grazeInPen(GRAZE, toPen)).toBe(true)
    const oneStuck: GrazeState = { ...withAll, animals: withAll.animals.map((a, i) => (i === 2 ? { ...a, mode: 'stuck' as const } : a)) }
    expect(grazeHelpTarget(GRAZE, oneStuck)).toEqual({ x: 32, y: 64 })
  })

  it('the arrow keys: six units across, as much on the screen down', () => {
    expect(grazeNudge({ x: 50, y: 50 }, 1, 0)).toEqual({ x: 56, y: 50 })
    expect(grazeNudge({ x: 50, y: 50 }, 0, -1)).toEqual({ x: 50, y: 41 })
    expect(grazeNudge({ x: 98, y: 2 }, 1, -1)).toEqual({ x: 100, y: 0 })
  })

  it('the sample data are in order', () => {
    expect(grazeProblems(GRAZE)).toEqual([])
  })

  it('wrong data are found', () => {
    const base = GRAZE.rounds[0]!
    expect(grazeProblems({ ...GRAZE, pen: { ...GRAZE.pen, area: { left: 90, top: 58, right: 95, bottom: 86 } } }).join()).toContain('too narrow')
    expect(grazeProblems({ ...GRAZE, stream: { ...GRAZE.stream, top: 45, bottom: 50 } }).join()).toContain('lane of the bridge is too narrow')
    expect(grazeProblems({ ...GRAZE, stream: { ...GRAZE.stream, top: 20, bottom: 70 } }).join()).toContain('too wide')
    expect(grazeProblems({ ...GRAZE, rounds: [] }).join()).toContain('no rounds')
    expect(grazeProblems({ ...GRAZE, rounds: [{ ...base, animals: ['esel'] }] }).join()).toContain('"esel"')
    expect(grazeProblems({ ...GRAZE, rounds: [{ ...base, thorns: [{ x: 85, y: 70 }] }] }).join()).toContain('stands in the pen')
    expect(grazeProblems({ ...GRAZE, rounds: [{ ...base, starts: [{ x: 85, y: 70 }, ...base.starts!.slice(1)] }] }).join()).toContain('starts in the pen')
    expect(grazeProblems({ ...GRAZE, rounds: [GRAZE.rounds[0]!, { ...GRAZE.rounds[1]!, starts: [{ x: 50, y: 80 }, ...GRAZE.rounds[1]!.starts!.slice(1)] }] }).join()).toContain('in the water')
    expect(grazeProblems({ ...GRAZE, rounds: [GRAZE.rounds[0]!, { ...GRAZE.rounds[1]!, thorns: [{ x: 50, y: 60 }] }] }).join()).toContain('at the bridge')
    expect(grazeProblems({ ...GRAZE, rounds: [{ ...base, starts: [{ x: 22, y: 66 }] }] }).join()).toContain('start place')
    expect(grazeProblems({ ...GRAZE, rounds: [{ ...base, starts: [{ x: 55, y: 72 }, ...base.starts!.slice(1)] }] }).join()).toContain('thornbush')
  })
})
