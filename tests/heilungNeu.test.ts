/**
 * The arithmetic of the three new games of "Jesus heilt" (`utils/heilungNeu.ts`): the synagogue (parts in the order of building), ten on the way (one finger leads ten men,
 * whoever is left far behind waits to be fetched) and to Jesus (the smallest child first). Sample data here; the real data is checked in `heilungData.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import {
  TEN_BODY,
  TEN_LOST_TIME,
  TEN_STRAY,
  childrenNext,
  childrenProblems,
  childrenSpot,
  childrenTap,
  childrenWidth,
  heilungStars,
  synagogueDone,
  synagogueDrop,
  synagogueFits,
  synagogueHelp,
  synagogueLeft,
  synagogueProblems,
  tenAtGoal,
  tenDist,
  tenHelpRoute,
  tenNudge,
  tenOffset,
  tenPlayRoute,
  tenProblems,
  tenRouteAhead,
  tenStart,
  tenStep,
  tenTouch
} from '@/utils/heilungNeu'
import type { ChildrenGame, SynagogueGame, SynagogueSlot, TenGame, TenState } from '@/utils/heilungNeu'

// ---------------------------------------------------------------- sample data
const col = (id: string, x: number): SynagogueSlot => ({ id, kind: 'column', x: x - 2.5, y: 30, w: 5, h: 40, needs: [], name: `Säule ${id}` })
const SYN: SynagogueGame = {
  background: 'bau.webp',
  ratio: 1.5,
  floor: 70,
  parts: { column: { image: 'saeule.webp', name: 'Eine Säule' }, beam: { image: 'balken.webp', name: 'Ein Balken' }, roof: { image: 'dach.webp', name: 'Das Dach' } },
  rounds: [
    {
      hint: 'Runde 1',
      outline: true,
      slots: [col('s1', 25), col('s2', 42), col('s3', 58), col('s4', 75), { id: 'b1', kind: 'beam', x: 20, y: 25, w: 60, h: 5, needs: ['s1', 's2', 's3', 's4'], name: 'Der Balken' }]
    },
    {
      hint: 'Runde 2',
      outline: false,
      slots: [
        col('s1', 15),
        col('s2', 29),
        col('s3', 43),
        col('s4', 57),
        col('s5', 71),
        col('s6', 85),
        { id: 'b1', kind: 'beam', x: 11, y: 25, w: 36, h: 5, needs: ['s1', 's2', 's3'], name: 'Der linke Balken' },
        { id: 'b2', kind: 'beam', x: 53, y: 25, w: 36, h: 5, needs: ['s4', 's5', 's6'], name: 'Der rechte Balken' },
        { id: 'r', kind: 'roof', x: 8, y: 8, w: 84, h: 17, needs: ['b1', 'b2'], name: 'Das Dach' }
      ]
    }
  ]
}

const MEN = Array.from({ length: 10 }, (_, i) => `mann-${i + 1}.webp`)
const TEN: TenGame = {
  men: MEN,
  manW: 10,
  house: { image: 'haus.webp', w: 22, name: 'Das Haus der Priester' },
  rounds: [
    {
      hint: 'Runde 1',
      background: 'land-1.webp',
      start: { x: 50, y: 86 },
      house: { x: 50, y: 10 },
      goal: { x: 50, y: 24, r: 14 },
      obstacles: [
        { image: 'baum.webp', x: 25, y: 60, w: 18, r: 7, kind: 'tree', name: 'Ein Ölbaum' },
        { image: 'fels.webp', x: 76, y: 46, w: 14, r: 5, kind: 'rock', name: 'Ein Fels' }
      ],
      route: [
        { x: 50, y: 70 },
        { x: 50, y: 45 }
      ]
    },
    {
      hint: 'Runde 2',
      background: 'land-2.webp',
      start: { x: 50, y: 86 },
      house: { x: 50, y: 10 },
      goal: { x: 50, y: 24, r: 14 },
      obstacles: [
        { image: 'mauer.webp', x: 30, y: 58, w: 50, r: 3, span: 22, kind: 'wall', name: 'Eine Mauer' },
        { image: 'mauer.webp', x: 82, y: 58, w: 30, r: 3, span: 12, kind: 'wall', name: 'Eine Mauer' },
        { image: 'dorn.webp', x: 20, y: 40, w: 12, r: 5, kind: 'thorn', name: 'Ein Dornbusch' }
      ],
      route: [
        { x: 62, y: 72 },
        { x: 62, y: 58 },
        { x: 60, y: 44 }
      ]
    }
  ]
}

const KIDS: ChildrenGame = {
  background: 'hof.webp',
  ratio: 1.5,
  figureRatio: 300 / 330,
  row: { y: 97, x0: 10, x1: 90 },
  seats: [
    { x: 50, y: 62, scale: 0.6 },
    { x: 58, y: 64, scale: 0.6 },
    { x: 66, y: 64, scale: 0.6 },
    { x: 74, y: 62, scale: 0.6 },
    { x: 44, y: 66, scale: 0.6 },
    { x: 80, y: 66, scale: 0.6 }
  ],
  rounds: [
    {
      hint: 'Runde 1',
      children: [
        { id: 'zopf', image: 'f1.webp', name: 'Das Mädchen mit dem Zopf', rank: 3, h: 34 },
        { id: 'mutter', image: 'f4.webp', name: 'Das Kleinkind auf dem Arm der Mutter', rank: 1, h: 46, carried: true },
        { id: 'gross', image: 'g.webp', name: 'Das große Mädchen', rank: 4, h: 42 },
        { id: 'klein', image: 'k.webp', name: 'Das kleine Mädchen', rank: 2, h: 27 }
      ]
    },
    {
      hint: 'Runde 2',
      children: [
        { id: 'lamm', image: 'f3.webp', name: 'Der Junge mit dem Lämmchen', rank: 5, h: 38 },
        { id: 'klein', image: 'k.webp', name: 'Das kleine Mädchen', rank: 3, h: 27 },
        { id: 'vater', image: 'v.webp', name: 'Das Baby auf dem Arm des Vaters', rank: 1, h: 47, carried: true },
        { id: 'gross', image: 'g.webp', name: 'Das große Mädchen', rank: 6, h: 42 },
        { id: 'mutter', image: 'f4.webp', name: 'Das Kleinkind auf dem Arm der Mutter', rank: 2, h: 46, carried: true },
        { id: 'zopf', image: 'f1.webp', name: 'Das Mädchen mit dem Zopf', rank: 4, h: 33 }
      ]
    }
  ]
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

describe('stars', () => {
  it('up to two mistakes three stars, up to four two, then one', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(heilungStars)).toEqual([3, 3, 3, 2, 2, 1, 1])
    expect(heilungStars(-3)).toBe(3)
  })
})

describe('the synagogue', () => {
  const r1 = SYN.rounds[0]!
  const r2 = SYN.rounds[1]!
  it('a column fits on a free column place; a beam only on its columns; the roof only on its beams', () => {
    const none = new Set<string>()
    expect(synagogueFits(r1, none, 'column', 's1')).toBe('ok')
    expect(synagogueFits(r1, none, 'beam', 'b1')).toBe('needs')
    expect(synagogueFits(r1, new Set(['s1', 's2', 's3']), 'beam', 'b1')).toBe('needs')
    expect(synagogueFits(r1, new Set(['s1', 's2', 's3', 's4']), 'beam', 'b1')).toBe('ok')
    expect(synagogueFits(r1, none, 'beam', 's1')).toBe('kind')
    expect(synagogueFits(r1, new Set(['s1']), 'column', 's1')).toBe('full')
    expect(synagogueFits(r1, none, 'column', 'nowhere')).toBe('kind')
    expect(synagogueFits(r2, new Set(['s1', 's2', 's3', 'b1']), 'roof', 'r')).toBe('needs')
    expect(synagogueFits(r2, new Set(['s1', 's2', 's3', 's4', 's5', 's6', 'b1', 'b2']), 'roof', 'r')).toBe('ok')
  })

  it('a part let go finds the nearest free place of its kind, else the place nearby, else nothing', () => {
    const none = new Set<string>()
    expect(synagogueDrop(r1, none, 'column', { x: 43, y: 50 }, SYN.ratio)).toBe('s2')
    // the place under the finger is taken: the next free column near it
    expect(synagogueDrop(r1, new Set(['s2']), 'column', { x: 44, y: 50 }, SYN.ratio)).toBe('s3')
    // a beam let go on the beam place: that place (the verdict will say it needs columns)
    expect(synagogueDrop(r1, none, 'beam', { x: 50, y: 27 }, SYN.ratio)).toBe('b1')
    // a beam let go on a column place: the column place (wrong kind)
    expect(synagogueDrop(r1, none, 'beam', { x: 75, y: 60 }, SYN.ratio)).toBe('s4')
    // far beside every place: nothing
    expect(synagogueDrop(r1, none, 'column', { x: 3, y: 95 }, SYN.ratio)).toBeNull()
  })

  it('counts the parts left, helps in the order of the list, and knows when all stand', () => {
    const f = new Set<string>()
    expect(synagogueLeft(r2, f, 'column')).toBe(6)
    expect(synagogueLeft(r2, f, 'roof')).toBe(1)
    const order: string[] = []
    for (let s = synagogueHelp(r2, f); s; s = synagogueHelp(r2, f)) {
      order.push(s.id)
      expect(synagogueFits(r2, f, s.kind, s.id)).toBe('ok')
      f.add(s.id)
    }
    expect(order).toEqual(['s1', 's2', 's3', 's4', 's5', 's6', 'b1', 'b2', 'r'])
    expect(synagogueDone(r2, f)).toBe(true)
    expect(synagogueDone(r2, new Set(['s1']))).toBe(false)
  })

  it('the sample data has no problems; broken data is found', () => {
    expect(synagogueProblems(SYN)).toEqual([])
    const a = clone(SYN)
    a.rounds[0]!.slots[4]!.y = 20 // the beam floats above the columns
    expect(synagogueProblems(a).join(' ')).toMatch(/does not rest on/)
    const b = clone(SYN)
    b.rounds[0]!.slots[0]!.h = 30 // a column ends above the platform
    expect(synagogueProblems(b).join(' ')).toMatch(/does not stand on the platform/)
    const c = clone(SYN)
    c.rounds[1]!.slots[6]!.needs = ['r'] // a circle: the beam needs the roof
    expect(synagogueProblems(c).join(' ')).toMatch(/must rest on columns|never be built/)
    const d = clone(SYN)
    d.rounds[0]!.slots[1]!.x = 25 // two columns on top of each other
    expect(synagogueProblems(d).join(' ')).toMatch(/too close/)
    const e = clone(SYN)
    e.rounds[1] = clone(e.rounds[0]!)
    expect(synagogueProblems(e).join(' ')).toMatch(/more parts/)
  })
})

describe('ten on the way', () => {
  it('the ten stand round the start, nobody inside another, each in his own place', () => {
    const st = tenStart(TEN, 0)
    expect(st.men).toHaveLength(10)
    for (let i = 0; i < 10; i++) {
      expect(tenDist(st.men[i]!, TEN.rounds[0]!.start)).toBeLessThanOrEqual(9)
      for (let j = i + 1; j < 10; j++) expect(tenDist(st.men[i]!, st.men[j]!)).toBeGreaterThan(1)
    }
    expect(tenOffset(0)).toEqual({ x: 0, y: 0 })
  })

  it('the ring goes toward the finger at its own pace and the men follow it', () => {
    let st: TenState = tenStart(TEN, 0)
    const target = { x: 50, y: 60 }
    const r = tenStep(TEN, 0, st, target, 0.1)
    expect(tenDist(r.state.lead, TEN.rounds[0]!.start)).toBeCloseTo(2, 5)
    st = r.state
    for (let k = 0; k < 60; k++) st = tenStep(TEN, 0, st, target, 0.05).state
    expect(tenDist(st.lead, target)).toBeLessThan(0.01)
    for (const m of st.men) {
      expect(tenDist(m, target)).toBeLessThan(12)
      expect(m.lost).toBe(false)
    }
  })

  it('nobody walks into an obstacle (they go round it)', () => {
    let st = tenStart(TEN, 0)
    const target = { x: 25, y: 40 } // straight through the olive tree
    for (let k = 0; k < 200; k++) {
      st = tenStep(TEN, 0, st, target, 0.05).state
      for (const m of st.men) expect(tenTouch(TEN.rounds[0]!.obstacles, m, TEN_BODY - 0.05)).toBe(-1)
    }
    expect(st.men.filter((m) => !m.lost).length).toBeGreaterThanOrEqual(9)
  })

  it('whoever is left far behind for a while waits (a mistake) and comes again when the ring fetches him', () => {
    const st = tenStart(TEN, 0)
    st.men[3] = { ...st.men[3]!, x: 10, y: 90 }
    st.lead = { x: 80, y: 20 }
    let s = st
    const events: string[] = []
    for (let t = 0; t < TEN_LOST_TIME + 0.3; t += 0.05) {
      const res = tenStep(TEN, 0, { ...s, men: s.men.map((m, i) => (i === 3 ? { ...m, x: 10, y: 90 } : m)) }, null, 0.05)
      s = res.state
      events.push(...res.events.map((e) => e.type))
      if (s.men[3]!.lost) break
    }
    expect(TEN_STRAY).toBeGreaterThan(20)
    expect(events).toContain('lost')
    expect(s.men[3]!.lost).toBe(true)
    // he waits where he is
    const still = tenStep(TEN, 0, s, { x: 80, y: 20 }, 0.05).state.men[3]!
    expect(still.x).toBeCloseTo(s.men[3]!.x, 5)
    // the ring comes near him: he comes along again
    const fetched = tenStep(TEN, 0, { ...s, lead: { x: 12, y: 88 } }, null, 0.05)
    expect(fetched.events.map((e) => e.type)).toContain('fetched')
    expect(fetched.state.men[3]!.lost).toBe(false)
  })

  it('a finger straight across a long wall leaves men behind; the safe route brings all ten without a mistake', () => {
    let st = tenStart(TEN, 1)
    let lost = 0
    for (let t = 0; t < 12; t += 0.05) {
      const res = tenStep(TEN, 1, st, { x: 30, y: 20 }, 0.05)
      st = res.state
      lost += res.events.filter((e) => e.type === 'lost').length
    }
    expect(lost).toBeGreaterThan(0)
    for (const ri of [0, 1]) {
      const play = tenPlayRoute(TEN, ri)
      expect(play.done, `round ${ri + 1}`).toBe(true)
      expect(play.lost, `round ${ri + 1}`).toBe(0)
    }
  })

  it('arrived once per man, done when all ten stand at the goal', () => {
    const r = TEN.rounds[0]!
    const st = tenStart(TEN, 0)
    const atGoal: TenState = { lead: { x: r.goal.x, y: r.goal.y }, men: st.men.map((m, i) => ({ ...m, x: r.goal.x + (i % 5) * 2 - 4, y: r.goal.y + Math.floor(i / 5) * 3 - 1.5 })) }
    const res = tenStep(TEN, 0, atGoal, null, 0.05)
    expect(res.events.filter((e) => e.type === 'arrived')).toHaveLength(10)
    expect(res.events.some((e) => e.type === 'done')).toBe(true)
    const again = tenStep(TEN, 0, res.state, null, 0.05, TEN.men.map(() => true))
    expect(again.events.filter((e) => e.type === 'arrived')).toHaveLength(0)
    expect(tenAtGoal(r, { x: 50, y: 90 })).toBe(false)
  })

  it('the keys move the ring a step; Enter and the help go along the safe route', () => {
    expect(tenNudge({ x: 50, y: 50 }, 1, 0)).toEqual({ x: 57, y: 50 })
    expect(tenNudge({ x: 50, y: 50 }, 0, -1).y).toBeCloseTo(50 - 7 * 0.75, 5)
    expect(tenNudge({ x: 1, y: 1 }, -1, -1)).toEqual({ x: 3, y: 4 })
    const r = TEN.rounds[1]!
    expect(tenRouteAhead(r, r.start)).toEqual(r.route[0])
    expect(tenRouteAhead(r, r.route[0]!)).toEqual(r.route[1])
    const help = tenHelpRoute(r, r.route[1]!)
    expect(help[0]).toEqual(r.route[2])
    expect(help[help.length - 1]).toEqual({ x: r.goal.x, y: r.goal.y })
  })

  it('the sample data has no problems; broken data is found', () => {
    expect(tenProblems(TEN)).toEqual([])
    const a = clone(TEN)
    a.rounds[0]!.obstacles.push({ image: 'f.webp', x: 50, y: 24, w: 10, r: 4, kind: 'rock', name: 'Fels' })
    expect(tenProblems(a).join(' ')).toMatch(/stands in the goal/)
    const b = clone(TEN)
    b.men = b.men.slice(0, 9)
    expect(tenProblems(b).join(' ')).toMatch(/ten men/)
    const c = clone(TEN)
    c.rounds[1]!.route = [{ x: 30, y: 30 }] // straight across the wall
    expect(tenProblems(c).join(' ')).toMatch(/left behind|not all ten/)
    const d = clone(TEN)
    d.rounds[0]!.goal.r = 6
    expect(tenProblems(d).join(' ')).toMatch(/too small/)
  })
})

describe('to Jesus', () => {
  const r1 = KIDS.rounds[0]!
  const r2 = KIDS.rounds[1]!
  it('the smallest who still waits comes next; a bigger one is a mistake', () => {
    expect(childrenNext(r1, new Set())?.id).toBe('mutter')
    expect(childrenTap(r1, new Set(), 'zopf')).toBe('bigger')
    expect(childrenTap(r1, new Set(), 'mutter')).toBe('ok')
    expect(childrenTap(r1, new Set(['mutter']), 'mutter')).toBe('already')
    expect(childrenNext(r1, new Set(['mutter']))?.id).toBe('klein')
    expect(childrenNext(r1, new Set(r1.children.map((c) => c.id)))).toBeNull()
    // round 2: the baby on the father's arm, then the toddler on the mother's arm, then the children who walk
    const order: string[] = []
    const come = new Set<string>()
    for (let c = childrenNext(r2, come); c; c = childrenNext(r2, come)) {
      order.push(c.id)
      come.add(c.id)
    }
    expect(order).toEqual(['vater', 'mutter', 'klein', 'zopf', 'lamm', 'gross'])
  })

  it('the row spreads the children from x0 to x1 on its line; the width follows the height', () => {
    expect(childrenSpot(KIDS, r1, 0)).toEqual({ x: 10, y: 97 })
    expect(childrenSpot(KIDS, r1, 3)).toEqual({ x: 90, y: 97 })
    // a picture 300 x 330 that is 33 % of a 3:2 field high is 33 * (300/330) / 1.5 = 20 % of its width wide
    expect(childrenWidth(KIDS, { id: 'x', image: '', name: '', rank: 1, h: 33 })).toBeCloseTo(20, 5)
    expect(childrenWidth(KIDS, { id: 'x', image: '', name: '', rank: 1, h: 33 }, 0.5)).toBeCloseTo(10, 5)
  })

  it('the sample data has no problems; broken data is found', () => {
    expect(childrenProblems(KIDS)).toEqual([])
    const a = clone(KIDS)
    a.rounds[0]!.children[0]!.h = 28 // the girl with the braid is hardly taller than the small girl
    expect(childrenProblems(a).join(' ')).toMatch(/not clearly taller/)
    const b = clone(KIDS)
    b.rounds[0]!.children.sort((x, y) => x.rank - y.rank)
    expect(childrenProblems(b).join(' ')).toMatch(/already wait in order/)
    const c = clone(KIDS)
    c.rounds[1]!.children[2]!.rank = 9 // the baby on the arm would come last
    expect(childrenProblems(c).join(' ')).toMatch(/on the arm must come before/)
    const d = clone(KIDS)
    d.row = { y: 97, x0: 30, x1: 70 }
    expect(childrenProblems(d).join(' ')).toMatch(/too close for a finger/)
    const e = clone(KIDS)
    e.seats = e.seats.slice(0, 4)
    expect(childrenProblems(e).join(' ')).toMatch(/only 4 places/)
  })
})
