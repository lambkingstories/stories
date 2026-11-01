/**
 * The rules of seven games of "The People in the Desert" (`utils/wuesteGames2.ts`) and the shape of their data (`data/adventures/wuesteGames2.ts`).
 */
import { describe, expect, it } from 'vitest'
import { KRUG, GENUG, WACHTELN, STAB, SCHLANGE, ESELIN, EINSETZEN } from '@/data/adventures/wuesteGames2'
import { allServed, dropOk, enoughVerdict, heapMarkY, heapSlots, holdShare, inRect, jugStep, poleAngle, poleStands, quailSpot, staffSlot } from '@/utils/wuesteGames2'

describe('inRect', () => {
  it('knows what is inside', () => {
    const r = { x1: 10, y1: 20, x2: 30, y2: 40 }
    expect(inRect(10, 20, r)).toBe(true)
    expect(inRect(30, 40, r)).toBe(true)
    expect(inRect(9.9, 30, r)).toBe(false)
    expect(inRect(20, 40.1, r)).toBe(false)
  })
})

describe('water jugs', () => {
  const thirsty = [0, 2, 4]
  it('fills at the spring and serves one person with a full jug', () => {
    let s = { jar: 'empty' as const, served: [] as number[] }
    const a = jugStep(s, { kind: 'spring' }, thirsty)
    expect(a.result).toBe('filled')
    expect(a.state.jar).toBe('full')
    const b = jugStep(a.state, { kind: 'person', index: 2 }, thirsty)
    expect(b.result).toBe('served')
    expect(b.state).toEqual({ jar: 'empty', served: [2] })
    s = b.state as never
    expect(allServed(s.served, thirsty)).toBe(false)
  })
  it('an empty jug at a thirsty person is a mistake, a full jug at the spring is only a hint', () => {
    expect(jugStep({ jar: 'empty', served: [] }, { kind: 'person', index: 0 }, thirsty).result).toBe('empty')
    expect(jugStep({ jar: 'full', served: [] }, { kind: 'spring' }, thirsty).result).toBe('full')
  })
  it('a person who is not thirsty or was served already does not count', () => {
    expect(jugStep({ jar: 'full', served: [] }, { kind: 'person', index: 1 }, thirsty).result).toBe('again')
    expect(jugStep({ jar: 'full', served: [0] }, { kind: 'person', index: 0 }, thirsty).result).toBe('again')
  })
  it('everybody served ends the round', () => {
    expect(allServed([0, 2, 4], thirsty)).toBe(true)
    expect(allServed([4, 0], thirsty)).toBe(false)
    expect(allServed([], [])).toBe(false)
  })
})

describe('enough', () => {
  it('too early, right, too late', () => {
    expect(enoughVerdict(7, 8, 3)).toBe('early')
    expect(enoughVerdict(8, 8, 3)).toBe('ok')
    expect(enoughVerdict(11, 8, 3)).toBe('ok')
    expect(enoughVerdict(12, 8, 3)).toBe('late')
  })
  it('the heap grows upward and the mark lies at the top of the needed gift', () => {
    const heap = { x: 66, y: 93, w: 36 }
    const s = heapSlots(12, heap, 7)
    expect(s).toHaveLength(12)
    expect(s[0]!.y).toBeGreaterThan(s[11]!.y)
    expect(heapSlots(0, heap, 7)).toEqual([])
    expect(heapMarkY(8, heap, 7)).toBeLessThan(s[7]!.y)
    for (const p of s) expect(p.x).toBeGreaterThan(heap.x - heap.w / 2 - 3)
  })
})

describe('quails', () => {
  const ground = { x1: 22, x2: 90, y1: 58, y2: 90 }
  it('repeatable places inside the ground, two in a row not next to each other', () => {
    for (let i = 0; i < 20; i++) {
      const a = quailSpot(i, ground, 0)
      expect(a).toEqual(quailSpot(i, ground, 0))
      expect(a.x).toBeGreaterThanOrEqual(ground.x1)
      expect(a.x).toBeLessThanOrEqual(ground.x2)
      expect(a.y).toBeGreaterThanOrEqual(ground.y1)
      expect(a.y).toBeLessThanOrEqual(ground.y2)
      const b = quailSpot(i + 1, ground, 0)
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(8)
    }
    expect(quailSpot(3, ground, 1)).not.toEqual(quailSpot(3, ground, 0))
  })
})

describe('staffs', () => {
  it('the row is even from the first to the last place', () => {
    const row = { y: 82, x1: 12, x2: 88 }
    expect(staffSlot(0, 12, row)).toEqual({ x: 12, y: 82 })
    expect(staffSlot(11, 12, row)).toEqual({ x: 88, y: 82 })
    expect(staffSlot(0, 1, row).x).toBe(50)
  })
})

describe('the pole', () => {
  it('upright and leaning', () => {
    expect(poleAngle(50, 90, 50, 30)).toBeCloseTo(0, 5)
    expect(poleAngle(50, 90, 70, 90)).toBeCloseTo(85, 5)
    expect(poleAngle(50, 90, 30, 60)).toBeLessThan(0)
    expect(poleAngle(50, 90, 0, 91)).toBe(-85)
  })
  it('stands within the tolerance', () => {
    expect(poleStands(0)).toBe(true)
    expect(poleStands(-9.9)).toBe(true)
    expect(poleStands(10.5)).toBe(false)
    expect(poleStands(-76)).toBe(false)
  })
})

describe('commission', () => {
  it('the place is a ring around the spot', () => {
    expect(dropOk(64, 97, { x: 64, y: 97 }, 9)).toBe(true)
    expect(dropOk(72, 97, { x: 64, y: 97 }, 9)).toBe(true)
    expect(dropOk(74, 97, { x: 64, y: 97 }, 9)).toBe(false)
    expect(dropOk(64, 80, { x: 64, y: 97 }, 9)).toBe(false)
  })
  it('the hold share runs from 0 to 1', () => {
    expect(holdShare(0, 2200)).toBe(0)
    expect(holdShare(1100, 2200)).toBe(0.5)
    expect(holdShare(5000, 2200)).toBe(1)
    expect(holdShare(-5, 2200)).toBe(0)
  })
})

describe('the data of the seven games', () => {
  it('jugs: every round names existing people, the zone is a real rectangle', () => {
    for (const r of KRUG.rounds) for (const i of r.people) expect(KRUG.people[i]).toBeDefined()
    expect(KRUG.spring.zone.x2).toBeGreaterThan(KRUG.spring.zone.x1)
    expect(KRUG.rounds[1]!.people.length).toBeGreaterThan(KRUG.rounds[0]!.people.length)
  })
  it('enough: the heap can hold the gifts the second round needs, and the people come faster', () => {
    const last = GENUG.rounds[1]!
    expect(heapSlots(last.need + last.over, GENUG.heap, GENUG.gifts[0]!.w).length).toBe(last.need + last.over)
    expect(last.every).toBeLessThan(GENUG.rounds[0]!.every)
    expect(GENUG.rounds.every((r) => r.over >= 2)).toBe(true)
  })
  it('quails: enough time on the ground, places inside the picture', () => {
    for (const r of WACHTELN.rounds) {
      expect(r.stay).toBeGreaterThanOrEqual(3000)
      expect(r.total).toBeGreaterThanOrEqual(8)
    }
    expect(WACHTELN.ground.y2).toBeLessThanOrEqual(100)
  })
  it('staffs: twelve places, Aaron among them, three stages of the bloom', () => {
    expect(STAB.aaron).toBeGreaterThanOrEqual(0)
    expect(STAB.aaron).toBeLessThan(12)
    expect(STAB.bloom).toHaveLength(3)
    expect(STAB.dry.length).toBeGreaterThanOrEqual(2)
  })
  it('serpent: six people, weak and well pictures differ, the pole stands in the picture', () => {
    expect(SCHLANGE.people).toHaveLength(6)
    for (const p of SCHLANGE.people) expect(p.weak).not.toBe(p.well)
    expect(SCHLANGE.pole.x).toBeGreaterThan(20)
    expect(SCHLANGE.pole.x).toBeLessThan(80)
  })
  it('donkey: three steps, each with its own place and a zone around its place', () => {
    expect(ESELIN.steps).toHaveLength(3)
    expect(new Set(ESELIN.steps.map((s) => s.background)).size).toBe(3)
    for (const s of ESELIN.steps) {
      expect(s.zone.x2).toBeGreaterThan(s.zone.x1)
      expect(s.zone.y2).toBeGreaterThan(s.zone.y1)
      expect(s.goTo.x).toBeGreaterThanOrEqual(0)
    }
    // the third step is a tap on the donkey herself
    const d = ESELIN.steps[2]!
    expect(inRect(d.donkey.x, d.donkey.y - 5, d.zone)).toBe(true)
  })
  it('commission: the spot is far enough from the start, two rounds', () => {
    expect(dropOk(EINSETZEN.joshua.start.x, EINSETZEN.joshua.start.y, EINSETZEN.joshua.spot, EINSETZEN.radius)).toBe(false)
    expect(EINSETZEN.rounds).toHaveLength(2)
    expect(EINSETZEN.holdMs).toBeGreaterThanOrEqual(1500)
  })
  it('no hint tells the child to do something frightening and every game has its words', () => {
    for (const g of [KRUG, GENUG, WACHTELN, STAB, SCHLANGE, EINSETZEN]) {
      for (const r of g.rounds) expect(r.hint.length).toBeGreaterThan(20)
      for (const v of Object.values(g.texts)) expect(typeof v === 'string' && v.length > 2).toBe(true)
    }
    for (const v of Object.values(ESELIN.texts)) expect(v.length).toBeGreaterThan(2)
  })
})
