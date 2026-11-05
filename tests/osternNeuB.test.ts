/**
 * The pure parts of three more games of "Ostern" (`utils/osternNeuB.ts`): the walking, the obstacles, the milestone, the help and the checks of "The road to Emmaus" (`wanderweg`);
 * the places, the kinds, the full places, the help and the checks of "Lay the table" (`tischdecken`); the lamps, the reach, the chain from the first lamp and the checks of "Pass on the light" (`lichtweg`).
 */
import { describe, expect, it } from 'vitest'
import { osterStars } from '@/utils/osternGames'
import {
  FLAME_GATE,
  WANDER_PASS,
  WANDER_RATIO,
  flameAllLit,
  flameDist,
  flameHelp,
  flameLamp,
  flameLampAt,
  flameLamps,
  flameLast,
  flameProblems,
  flameReachable,
  flameStart,
  flameTry,
  osterNeighbour,
  tableDone,
  tableFits,
  tableHelp,
  tableProblems,
  tableSlotAt,
  tableSlotTotal,
  tableSpot,
  wanderAlong,
  wanderAtGoal,
  wanderBendAhead,
  wanderDist,
  wanderHelpRoute,
  wanderHit,
  wanderNudge,
  wanderProblems,
  wanderRadius,
  wanderRoute,
  wanderStart,
  wanderStep
} from '@/utils/osternNeuB'
import type { FlameGame, Pt, TableGame, WanderGame, WanderState } from '@/utils/osternNeuB'

// ---------------------------------------------------------------- sample data (the same shapes as the data of the adventure)
const W = 'spiele/ostern/wanderweg/'
const obstacle = (image: string, x: number, y: number, r: number) => ({ image: `${W}${image}.webp`, x, y, r, name: image.startsWith('dorn') ? 'Dornbusch' : 'Stein' })
const WANDER: WanderGame = {
  walker: 'spiele/ostern/weg/wanderer.webp',
  walkerW: 12,
  rounds: [
    {
      background: `${W}strasse-1.webp`,
      hint: 'a',
      road: 18,
      path: [
        { x: 50, y: 92 },
        { x: 50, y: 60 },
        { x: 35, y: 35 },
        { x: 50, y: 10 }
      ],
      obstacles: [obstacle('stein-1', 50, 72, 4), obstacle('dorn-1', 20, 85, 4), obstacle('stein-2', 80, 60, 4), obstacle('dorn-2', 20, 45, 4), obstacle('stein-3', 70, 25, 4)],
      goal: { image: `${W}ziel.webp`, x: 50, y: 6, w: 12 }
    },
    {
      background: `${W}strasse-2.webp`,
      hint: 'b',
      road: 18,
      path: [
        { x: 30, y: 92 },
        { x: 65, y: 72 },
        { x: 35, y: 42 },
        { x: 60, y: 10 }
      ],
      obstacles: [
        obstacle('stein-1', 50, 84, 3.5),
        obstacle('dorn-1', 12, 75, 4),
        obstacle('stein-2', 85, 82, 4),
        obstacle('dorn-2', 62, 58, 3.5),
        obstacle('stein-3', 30, 62, 3.5),
        obstacle('dorn-1', 85, 50, 4),
        obstacle('stein-1', 15, 30, 4),
        obstacle('dorn-2', 52, 30, 3.5),
        obstacle('stein-2', 85, 18, 4)
      ],
      goal: { image: `${W}ziel.webp`, x: 60, y: 6, w: 12 }
    }
  ]
}

const T = 'spiele/ostern/tisch/'
const thing = (id: string, image: string, name: string, w: number, target: string) => ({ id, image: `${T}${image}.webp`, name, w, target })
const TABLE: TableGame = {
  background: `${T}tisch.webp`,
  slots: [
    { id: 'platz-1', x: 20, y: 30, r: 10 },
    { id: 'platz-2', x: 50, y: 22, r: 10, name: 'Platz des Gastes' },
    { id: 'platz-3', x: 80, y: 30, r: 10 },
    { id: 'mitte', x: 50, y: 55, r: 10, name: 'Mitte des Tisches' },
    { id: 'korb', x: 88, y: 82, r: 9, name: 'Korb' }
  ],
  basket: { image: `${T}korb.webp`, x: 88, y: 82, w: 16 },
  bread: { item: 'brot', whole: `${T}brot.webp`, halves: [`${T}brot-haelfte-1.webp`, `${T}brot-haelfte-2.webp`] },
  guestSlot: 'platz-2',
  rounds: [
    {
      hint: 'a',
      items: [
        thing('becher-1', 'becher', 'Becher', 8, 'platz-1'),
        thing('schale-1', 'schale', 'Schale', 10, 'platz-1'),
        thing('becher-2', 'becher', 'Becher', 8, 'platz-2'),
        thing('schale-2', 'schale', 'Schale', 10, 'platz-2'),
        thing('becher-3', 'becher', 'Becher', 8, 'platz-3'),
        thing('schale-3', 'schale', 'Schale', 10, 'platz-3')
      ]
    },
    {
      hint: 'b',
      items: [
        thing('lampe', 'lampe', 'Öllampe', 9, 'mitte'),
        thing('krug', 'krug', 'Krug', 9, 'mitte'),
        thing('brot', 'brot', 'Fladenbrot', 11, 'platz-2'),
        thing('netz', 'netz', 'Netz', 10, 'korb'),
        thing('stab', 'stab', 'Hirtenstab', 10, 'korb')
      ]
    }
  ]
}

const L = 'spiele/ostern/licht/'
const person = (n: number, x: number, y: number) => ({ image: `${L}mensch-${((n - 1) % 4) + 1}.webp`, x, y, w: 8, anchor: { x: 70, y: 45 } })
const FLAME: FlameGame = {
  flame: `${L}flamme.webp`,
  rounds: [
    {
      background: `${L}huegel.webp`,
      hint: 'a',
      start: 0,
      reach: 20,
      gate: { x: 90, y: 50 },
      people: [person(1, 10, 80), person(2, 24, 75), person(3, 38, 70), person(4, 52, 65), person(5, 66, 60), person(6, 80, 55)]
    },
    {
      background: `${L}huegel.webp`,
      hint: 'b',
      start: 0,
      reach: 18,
      gate: { x: 92, y: 40 },
      people: [person(1, 8, 86), person(2, 20, 82), person(3, 32, 76), person(4, 44, 64), person(5, 56, 56), person(6, 44, 88), person(7, 56, 92), person(8, 70, 50), person(9, 84, 44)]
    }
  ]
}

const clone = <G>(g: G): G => JSON.parse(JSON.stringify(g)) as G

// ---------------------------------------------------------------- shared
describe('osterNeighbour (arrow keys between places)', () => {
  const pts: Pt[] = [
    { x: 10, y: 50 },
    { x: 30, y: 50 },
    { x: 30, y: 20 },
    { x: 60, y: 52 }
  ]
  it('goes to the nearest place in the direction, straight ones first', () => {
    expect(osterNeighbour(pts, 0, 1, 0, 1.5)).toBe(1)
    expect(osterNeighbour(pts, 1, 1, 0, 1.5)).toBe(3)
    expect(osterNeighbour(pts, 1, 0, -1, 1.5)).toBe(2)
    expect(osterNeighbour(pts, 1, -1, 0, 1.5)).toBe(0)
  })
  it('stays when there is nothing in that direction; starts at the first place', () => {
    expect(osterNeighbour(pts, 0, -1, 0, 1.5)).toBe(0)
    expect(osterNeighbour(pts, -1, 1, 0, 1.5)).toBe(0)
    expect(osterNeighbour([], 0, 1, 0, 1.5)).toBe(-1)
  })
})

// ---------------------------------------------------------------- the road to Emmaus
describe('Wanderweg (logic)', () => {
  const run = (st: WanderState, target: Pt | null, seconds: number, ri = 0, game = WANDER) => {
    const events: string[] = []
    for (let i = 0; i < Math.round(seconds / 0.05); i++) {
      const r = wanderStep(game, ri, st, target, 0.05)
      st = r.state
      events.push(...r.events.map((e) => (e.type === 'hit' ? `hit${e.index}` : e.type)))
    }
    return { st, events }
  }

  it('the sample data are in order', () => {
    expect(wanderProblems(WANDER)).toEqual([])
  })

  it('distances on the upright picture: one percent of the height is 4/3 units', () => {
    expect(wanderDist({ x: 0, y: 0 }, { x: 0, y: 3 })).toBeCloseTo(4)
    expect(wanderRadius(WANDER)).toBeCloseTo(3.6)
    expect(wanderNudge({ x: 50, y: 50 }, 0, -1)).toEqual({ x: 50, y: 50 - 6 * WANDER_RATIO })
    expect(wanderNudge({ x: 98, y: 50 }, 1, 0).x).toBe(100)
  })

  it('the walkers start at the bottom of the road and follow the finger at most at their speed', () => {
    const s0 = wanderStart(WANDER, 0)
    expect({ x: s0.x, y: s0.y }).toEqual({ x: 50, y: 92 })
    const { st } = run(s0, { x: 80, y: 92 }, 1)
    expect(st.x).toBeCloseTo(50 + 18, 0)
    expect(st.face).toBe(1)
    expect(st.moving).toBe(true)
    const back = run(st, { x: 60, y: 92 }, 2).st
    expect(back.x).toBeCloseTo(60, 1)
    expect(back.face).toBe(-1)
    expect(back.moving).toBe(false)
  })

  it('touching a stone is one mistake: they step back and stand; pushing on against it does not count again; going away and coming back does', () => {
    const s0 = wanderStart(WANDER, 0)
    const first = run(s0, { x: 50, y: 50 }, 1.5)
    expect(first.events.filter((e) => e.startsWith('hit'))).toEqual(['hit0'])
    const stone = WANDER.rounds[0]!.obstacles[0]!
    expect(wanderDist(first.st, stone)).toBeGreaterThanOrEqual(stone.r + wanderRadius(WANDER))
    // it stood for a moment
    const hitAt = run(s0, { x: 50, y: 50 }, 1.2)
    expect(hitAt.events).toContain('hit0')
    expect(hitAt.st.pause).toBeGreaterThan(0)
    expect(hitAt.st.moving).toBe(false)
    const pushing = run(first.st, { x: 50, y: 50 }, 3)
    expect(pushing.events.filter((e) => e.startsWith('hit'))).toEqual([])
    const away = run(pushing.st, { x: 50, y: 95 }, 2)
    expect(away.st.touching).toBe(-1)
    const again = run(away.st, { x: 50, y: 50 }, 2)
    expect(again.events.filter((e) => e.startsWith('hit'))).toEqual(['hit0'])
  })

  it('wanderHit finds the obstacle under the walkers', () => {
    const obs = WANDER.rounds[0]!.obstacles
    expect(wanderHit(obs, { x: 50, y: 72 }, 3.6)).toBe(0)
    expect(wanderHit(obs, { x: 50, y: 50 }, 3.6)).toBe(-1)
    expect(wanderHit(obs, { x: 50, y: 72 }, 3.6, 0)).toBe(-1)
  })

  it('round the stone to the milestone: the event "arrived", the whole road is reached', () => {
    let st = wanderStart(WANDER, 0)
    const events: string[] = []
    for (const p of [
      { x: 66, y: 80 },
      { x: 66, y: 60 },
      { x: 50, y: 6 }
    ]) {
      const r = run(st, p, 5)
      st = r.st
      events.push(...r.events)
    }
    expect(events).toContain('arrived')
    expect(events.filter((e) => e.startsWith('hit'))).toEqual([])
    expect(st.arrived).toBe(true)
    expect(st.best).toBe(1)
    expect(wanderAtGoal(WANDER, WANDER.rounds[0]!, { x: 50, y: 6 })).toBe(true)
    expect(wanderAtGoal(WANDER, WANDER.rounds[0]!, { x: 50, y: 30 })).toBe(false)
    // after arriving they do not move any more
    expect(run(st, { x: 10, y: 90 }, 1).st.y).toBeCloseTo(st.y)
  })

  it('the share of the road: 0 at the bottom, 1 at the top, beside the road the nearest point counts', () => {
    const path = WANDER.rounds[0]!.path
    expect(wanderAlong(path, { x: 50, y: 92 })).toBeCloseTo(0)
    expect(wanderAlong(path, { x: 50, y: 10 })).toBeCloseTo(1)
    const mid = wanderAlong(path, { x: 60, y: 76 })
    expect(mid).toBeGreaterThan(0.05)
    expect(mid).toBeLessThan(0.3)
  })

  it('Enter goes to the next bend ahead, at the end to the milestone', () => {
    const r = WANDER.rounds[0]!
    expect(wanderBendAhead(r, { x: 50, y: 92 })).toEqual({ x: 50, y: 60 })
    expect(wanderBendAhead(r, { x: 50, y: 60 })).toEqual({ x: 35, y: 35 })
    expect(wanderBendAhead(r, { x: 50, y: 10 })).toEqual({ x: 50, y: 6 })
  })

  it('a safe way to the milestone keeps away from every obstacle; walked, it touches nothing and arrives (both rounds)', () => {
    for (const ri of [0, 1]) {
      const s0 = wanderStart(WANDER, ri)
      const route = wanderRoute(WANDER, ri, s0, wanderRadius(WANDER) + 0.8)!
      expect(route).not.toBeNull()
      expect(route.length).toBeGreaterThan(1)
      let st = s0
      const events: string[] = []
      for (const p of route.slice(1)) {
        const r = run(st, p, 8, ri)
        st = r.st
        events.push(...r.events)
        if (st.arrived) break
      }
      expect(events.filter((e) => e.startsWith('hit'))).toEqual([])
      expect(st.arrived).toBe(true)
    }
  })

  it('the help leads about thirty units of a safe way', () => {
    const s0 = wanderStart(WANDER, 0)
    const help = wanderHelpRoute(WANDER, 0, s0)!
    let len = wanderDist(s0, help[0]!)
    for (let i = 1; i < help.length; i++) len += wanderDist(help[i - 1]!, help[i]!)
    expect(len).toBeCloseTo(30, 0)
    const R = wanderRadius(WANDER)
    for (const p of help) expect(wanderHit(WANDER.rounds[0]!.obstacles, p, R)).toBe(-1)
  })

  it('the check finds a road that is closed (gap narrower than WANDER_PASS walker widths), a start on a stone and other faults', () => {
    const closed = clone(WANDER)
    // a wall of stones across the road
    for (let x = 4; x <= 96; x += 7) closed.rounds[0]!.obstacles.push({ image: 'stein', x, y: 50, r: 4, name: 'Stein' })
    expect(wanderProblems(closed).join('\n')).toContain(`no way to the milestone with gaps of ${WANDER_PASS} walker widths`)
    const narrow = clone(WANDER)
    // a gap of 8.9 units (from 45.55 to 54.45): the walkers (touch circle 0.6 widths = 7.2) would fit, the check wants three quarters of a width on each side of the middle (9)
    narrow.rounds[0]!.obstacles.push(
      { image: 'stein', x: 30, y: 50, r: 15.55, name: 'Stein' },
      { image: 'stein', x: 70, y: 50, r: 15.55, name: 'Stein' },
      { image: 'stein', x: 5, y: 50, r: 12, name: 'Stein' },
      { image: 'stein', x: 95, y: 50, r: 12, name: 'Stein' }
    )
    expect(wanderProblems(narrow).join('\n')).toContain('no way to the milestone')
    expect(wanderRoute(narrow, 0, wanderStart(narrow, 0), wanderRadius(narrow) + 0.5, false)).not.toBeNull()
    const onStone = clone(WANDER)
    onStone.rounds[0]!.obstacles.push({ image: 'stein', x: 50, y: 92, r: 3, name: 'Stein' })
    expect(wanderProblems(onStone)).toContain('round 1: the walkers start at an obstacle')
    const down = clone(WANDER)
    down.rounds[0]!.path.reverse()
    expect(wanderProblems(down)).toContain('round 1: the road must lead from the bottom up')
    const fewer = clone(WANDER)
    fewer.rounds[1]!.obstacles = fewer.rounds[1]!.obstacles.slice(0, 3)
    expect(wanderProblems(fewer)).toContain('round 2 should have more obstacles than round 1')
  })

  it('the stars: osterStars', () => {
    expect([0, 2, 3, 4, 5].map(osterStars)).toEqual([3, 3, 2, 2, 1])
  })
})

// ---------------------------------------------------------------- lay the table
describe('Tisch decken (logic)', () => {
  const r1 = TABLE.rounds[0]!
  const r2 = TABLE.rounds[1]!
  const none = (n: number) => Array.from({ length: n }, () => null as string | null)

  it('the sample data are in order', () => {
    expect(tableProblems(TABLE)).toEqual([])
  })

  it('the place under the finger: the nearest place whose circle holds the point', () => {
    expect(tableSlotAt(TABLE.slots, { x: 20, y: 30 })).toBe(0)
    expect(tableSlotAt(TABLE.slots, { x: 27, y: 33 })).toBe(0)
    expect(tableSlotAt(TABLE.slots, { x: 50, y: 40 })).toBe(-1)
    expect(tableSlotAt(TABLE.slots, { x: 88, y: 84 })).toBe(4)
  })

  it('a cup fits at any cushion that still needs a cup; a second cup there is "full"; a cup in the middle is wrong', () => {
    const placed = none(6)
    expect(tableFits(r1, placed, 0, 'platz-3')).toBe('ok')
    placed[0] = 'platz-3'
    expect(tableFits(r1, placed, 2, 'platz-3')).toBe('full')
    expect(tableFits(r1, placed, 2, 'platz-1')).toBe('ok')
    expect(tableFits(r1, placed, 1, 'platz-3')).toBe('ok')
    expect(tableFits(r1, placed, 2, 'mitte')).toBe('wrong')
    expect(tableFits(r1, placed, 2, 'korb')).toBe('wrong')
  })

  it('round 2: lamp and jug in the middle, the bread at the place of the guest, net and staff in the basket', () => {
    const placed = none(5)
    expect(tableFits(r2, placed, 0, 'mitte')).toBe('ok')
    expect(tableFits(r2, placed, 2, 'platz-1')).toBe('wrong')
    expect(tableFits(r2, placed, 2, 'platz-2')).toBe('ok')
    expect(tableFits(r2, placed, 3, 'mitte')).toBe('wrong')
    expect(tableFits(r2, placed, 3, 'korb')).toBe('ok')
    expect(tableFits(r2, placed, 4, 'korb')).toBe('ok')
  })

  it('the round is done when every thing lies; the help puts the first thing in a right place', () => {
    const placed = none(6)
    expect(tableHelp(r1, placed)).toEqual({ item: 0, slot: 'platz-1' })
    placed[0] = 'platz-2'
    // cup 2 belongs to place 2, which has its cup: the help takes a free cushion
    placed[1] = 'platz-1'
    expect(tableHelp(r1, placed)).toEqual({ item: 2, slot: 'platz-1' })
    expect(tableDone(placed)).toBe(false)
    expect(tableDone(['a', 'b'])).toBe(true)
    expect(tableHelp(r1, ['platz-1', 'platz-1', 'platz-2', 'platz-2', 'platz-3', 'platz-3'])).toBeNull()
  })

  it('the things on a place lie side by side; the place of the guest holds three things at the end', () => {
    expect(tableSlotTotal(TABLE, 'platz-2')).toBe(3)
    expect(tableSlotTotal(TABLE, 'mitte')).toBe(2)
    const s = TABLE.slots[1]!
    const a = tableSpot(s, 0, 3)
    const c = tableSpot(s, 2, 3)
    expect(a.x).toBeLessThan(s.x)
    expect(c.x).toBeGreaterThan(s.x)
    expect(tableSpot(s, 1, 3)).toEqual({ x: s.x, y: s.y })
    expect(tableSpot(s, 0, 1)).toEqual({ x: s.x, y: s.y })
  })

  it('the check finds a thing without a place, a missing guest, places on each other and a bread in the wrong place', () => {
    const lost = clone(TABLE)
    lost.rounds[0]!.items[0]!.target = 'bank'
    expect(tableProblems(lost)).toContain('round 1: the thing "becher-1" belongs to a place that is not there ("bank")')
    const guest = clone(TABLE)
    guest.guestSlot = 'platz-9'
    expect(tableProblems(guest).join('\n')).toContain('the place of the guest "platz-9" is missing')
    const stacked = clone(TABLE)
    stacked.slots[3]!.y = 26
    expect(tableProblems(stacked).join('\n')).toContain('lie on each other')
    const bread = clone(TABLE)
    bread.rounds[1]!.items[2]!.target = 'mitte'
    expect(tableProblems(bread)).toContain('the bread belongs to the place of the guest')
    const small = clone(TABLE)
    small.slots[0]!.r = 3
    expect(tableProblems(small).join('\n')).toContain('too small')
  })
})

// ---------------------------------------------------------------- pass on the light
describe('Licht weitergeben (logic)', () => {
  const r1 = FLAME.rounds[0]!
  const r2 = FLAME.rounds[1]!

  it('the sample data are in order', () => {
    expect(flameProblems(FLAME)).toEqual([])
  })

  it('the lamp sits at the anchor of the person picture (a person 8 wide is 18 high on the 3:2 picture)', () => {
    const l = flameLamp(r1.people[0]!)
    expect(l.x).toBeCloseTo(10 + 0.2 * 8)
    expect(l.y).toBeCloseTo(80 - 0.55 * 18)
  })

  it('only the first lamp burns at the start; the flame goes to a dark lamp in reach, not to one too far', () => {
    const lit = flameStart(r1)
    expect(lit).toEqual([true, false, false, false, false, false])
    expect(flameTry(FLAME, r1, lit, 0, 1)).toBe('ok')
    expect(flameTry(FLAME, r1, lit, 0, 2)).toBe('far')
    expect(flameTry(FLAME, r1, lit, 1, 2)).toBe('dark')
    expect(flameTry(FLAME, r1, lit, 0, 0)).toBe('same')
    expect(flameTry(FLAME, r1, [true, true, false, false, false, false], 0, 1)).toBe('lit')
    expect(flameAllLit(lit)).toBe(false)
    expect(flameAllLit(lit.map(() => true))).toBe(true)
  })

  it('every lamp can be reached in a chain; with a smaller reach the chain breaks', () => {
    expect(flameReachable(FLAME, r1).every(Boolean)).toBe(true)
    expect(flameReachable(FLAME, r2).every(Boolean)).toBe(true)
    expect(flameReachable(FLAME, { ...r1, reach: 10 })).toEqual([true, false, false, false, false, false])
  })

  it('the lamp under the finger, the help to the nearest dark lamp in reach, the last person at the gate', () => {
    const lamps = flameLamps(FLAME, r1)
    expect(flameLampAt(lamps, lamps[3]!)).toBe(3)
    expect(flameLampAt(lamps, { x: lamps[3]!.x + 3, y: lamps[3]!.y })).toBe(3)
    expect(flameLampAt(lamps, { x: 50, y: 10 })).toBe(-1)
    expect(flameLampAt(lamps, lamps[3]!, 7, 3)).toBe(-1)
    expect(flameHelp(FLAME, r1, flameStart(r1))).toEqual({ from: 0, to: 1 })
    expect(flameHelp(FLAME, r1, r1.people.map(() => true))).toBeNull()
    // the fork of round 2: from lamp 2 both branches go on
    const lit = [true, true, true, false, false, false, false, false, false]
    const h = flameHelp(FLAME, r2, lit)!
    expect([3, 5]).toContain(h.to)
    expect(flameLast(r1)).toBe(5)
    expect(flameDist(r1.people[5]!, r1.gate)).toBeLessThanOrEqual(FLAME_GATE)
    expect(flameLast(r2)).toBe(8)
  })

  it('the check finds a lamp that cannot be reached, nobody at the gate, lamps on each other and a bad start', () => {
    const cut = clone(FLAME)
    cut.rounds[0]!.people[5]!.x = 98
    cut.rounds[0]!.people[5]!.y = 20
    expect(flameProblems(cut).join('\n')).toContain('round 1: the lamp of person 6 cannot be reached')
    const gate = clone(FLAME)
    gate.rounds[0]!.gate = { x: 10, y: 10 }
    expect(flameProblems(gate)).toContain('round 1: nobody stands near the gate')
    const near = clone(FLAME)
    near.rounds[1]!.people[1]!.x = 9
    near.rounds[1]!.people[1]!.y = 86
    expect(flameProblems(near).join('\n')).toContain('too near together')
    const start = clone(FLAME)
    start.rounds[0]!.start = 9
    expect(flameProblems(start)).toContain('round 1: the first lamp is not one of the people')
    const fewer = clone(FLAME)
    fewer.rounds[1]!.people = fewer.rounds[1]!.people.slice(0, 5)
    expect(flameProblems(fewer)).toContain('round 2 should have more people than round 1')
  })
})
