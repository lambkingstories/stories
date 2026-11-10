/**
 * The arithmetic of the two games of the stages 11 and 12 of "Geschichten von Jesus" (`utils/gleichnisseNeuC.ts`): `baugrund` (knocking, building, the weather, the stars, the help)
 * and `einladen` (the guests that come and go, the tap, the seats at the table, the help); every checker finds broken data, and the sample data have no problems.
 * The real data of the adventure are tested in `gleichnisseData.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import {
  GROUND_ASPECT,
  GROUND_WEATHER,
  groundBuild,
  groundHint,
  groundHouseAt,
  groundHouseH,
  groundKnock,
  groundKnocksLeft,
  groundLook,
  groundPlotH,
  groundProblems,
  groundStars,
  inviteDone,
  inviteFirstWaving,
  inviteFree,
  inviteHelp,
  inviteProblems,
  inviteSeatAt,
  inviteSeatList,
  inviteSeatsOf,
  inviteSimulate,
  inviteStars,
  inviteStart,
  inviteStep,
  inviteTap
} from '@/utils/gleichnisseNeuC'
import type { GroundGame, InviteGame } from '@/utils/gleichnisseNeuC'
import { GROUND, INVITE } from './gleichnisseNeuCSamples'

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

describe('baugrund: the sample data and the rules', () => {
  it('the sample data are in order', () => {
    expect(groundProblems(GROUND)).toEqual([])
  })

  it('the rock rings hard, the sand is soft; a house stands on the rock and sinks into the sand', () => {
    const r1 = GROUND.rounds[0]!
    expect(groundKnock(r1, 0)).toEqual({ kind: 'hard' })
    expect(groundKnock(r1, 1)).toEqual({ kind: 'soft' })
    expect(groundKnock(r1, 9)).toEqual({ kind: 'none' })
    expect(groundBuild(r1, 0)).toEqual({ kind: 'firm' })
    expect(groundBuild(r1, 3)).toEqual({ kind: 'sinks' })
    expect(groundBuild(r1, 9)).toEqual({ kind: 'none' })
    expect(GROUND_WEATHER).toEqual(['rain', 'water', 'wind'])
  })

  it('a hidden rock looks like sand-covered ground, sand looks like sand, a plain rock like rock', () => {
    const [a, b] = GROUND.rounds
    expect(groundLook(a!.plots[0]!)).toBe('rock')
    expect(groundLook(a!.plots[1]!)).toBe('sand')
    expect(groundLook(b!.plots[2]!)).toBe('covered')
    expect(groundLook(b!.plots[0]!)).toBe('sand')
  })

  it('the knocks that are left (none = as many as one likes) and the plot the help shows', () => {
    const [a, b] = GROUND.rounds
    expect(groundKnocksLeft(a!, 7)).toBeNull()
    expect(groundKnocksLeft(b!, 1)).toBe(3)
    expect(groundKnocksLeft(b!, 9)).toBe(0)
    expect(groundHint(a!, [])).toBe(0)
    expect(groundHint(b!, [])).toBe(2)
    expect(groundHint(b!, [2])).toBe(5)
    expect(groundHint(b!, [2, 5])).toBeNull()
  })

  it('stars: up to two mistakes three stars, up to four two, then one; with help never more than two', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map((m) => groundStars(m, false))).toEqual([3, 3, 3, 2, 2, 1, 1])
    expect([0, 2, 3, 6].map((m) => groundStars(m, true))).toEqual([2, 2, 2, 1])
  })

  it('geometry: the house stands on the middle of the plot, and the heights come from the proportions of the pictures', () => {
    const p = GROUND.rounds[0]!.plots[0]!
    expect(groundPlotH(p)).toBeCloseTo(14 * GROUND_ASPECT.plot * 1.5, 6)
    expect(groundHouseH(GROUND)).toBeCloseTo(18 * GROUND_ASPECT.house * 1.5, 6)
    const at = groundHouseAt(p)
    expect(at.x).toBe(p.x)
    expect(at.y).toBeLessThan(p.y)
    expect(at.y).toBeGreaterThan(p.y - groundPlotH(p))
  })

  it('every checker finds broken data', () => {
    const bad = (f: (g: GroundGame) => void): string[] => {
      const g = clone(GROUND)
      f(g)
      return groundProblems(g)
    }
    expect(bad((g) => (g.background = ''))).toContain('no picture of the valley')
    expect(bad((g) => (g.sprites.mallet.image = ''))).toContain('no picture of "mallet"')
    expect(bad((g) => (g.sprites.house.w = 5)).join()).toMatch(/house should be 12 to 30/)
    expect(bad((g) => (g.tray.x = 99)).join()).toMatch(/tray with the house lies outside/)
    expect(bad((g) => (g.tray.w = 10)).join()).toMatch(/frame of the tray is narrower/)
    expect(bad((g) => (g.rounds = [])).join()).toMatch(/no rounds/)
    // a round that cannot be won, or is too easy
    expect(bad((g) => g.rounds[0]!.plots.forEach((p) => (p.ground = 'sand'))).join()).toMatch(/no plot of rock/)
    expect(bad((g) => g.rounds[0]!.plots.forEach((p) => (p.ground = 'rock'))).join()).toMatch(/too many plots of rock/)
    expect(bad((g) => g.rounds[0]!.plots.splice(2)).join()).toMatch(/fewer than three plots/)
    expect(bad((g) => (g.rounds[0]!.plots[1]!.id = 'a')).join()).toMatch(/same name/)
    // knocks and signs
    expect(bad((g) => (g.rounds[1]!.knocks = 1)).join()).toMatch(/knocks should be 2 to 5/)
    expect(bad((g) => (g.rounds[1]!.knocks = 6)).join()).toMatch(/knocks should be 2 to 5/)
    expect(bad((g) => (g.rounds[1]!.mark = true)).join()).toMatch(/must not stay at the plot as a sign/)
    expect(bad((g) => (g.rounds[1]!.plots[2]!.hidden = false)).join()).toMatch(/must be hidden under sand/)
    expect(bad((g) => (g.rounds[0]!.plots[0]!.hidden = true)).join()).toMatch(/hidden but the round has unlimited knocks/)
    expect(bad((g) => (g.rounds[1]!.knocks = undefined)).join()).toMatch(/round 2 should limit the knocks/)
    expect(bad((g) => (g.rounds[0]!.mark = false)).join()).toMatch(/round 1 should leave a sign/)
    // places
    expect(bad((g) => (g.rounds[0]!.plots[1]!.w = 8)).join()).toMatch(/12 to 26 percent wide/)
    expect(bad((g) => (g.rounds[0]!.plots[1]!.x = 99)).join()).toMatch(/plot 2 lies outside the picture/)
    expect(bad((g) => (g.rounds[0]!.plots[1]!.y = 20)).join()).toMatch(/lies outside the picture|would lie outside/)
    expect(bad((g) => Object.assign(g.rounds[0]!.plots[1]!, { x: 48, y: 60 })).join()).toMatch(/lie on top of each other/)
    expect(bad((g) => Object.assign(g.rounds[0]!.plots[1]!, { x: 15, y: 90 })).join()).toMatch(/lies on the tray/)
    expect(bad((g) => (g.rounds[0]!.plots[0]!.x = Number.NaN)).join()).toMatch(/missing number/)
    // no learning by heart: a rock of round 2 where the rock of round 1 was
    expect(bad((g) => Object.assign(g.rounds[1]!.plots[2]!, { x: 45, y: 58 })).join()).toMatch(/lies where the rock of round 1 lay/)
  })
})

describe('einladen: the sample data and the guests', () => {
  const [r1, r2] = INVITE.rounds as [InviteGame['rounds'][0], InviteGame['rounds'][0]]

  it('the sample data are in order; twelve places in all (six in round 1, six in round 2: four guests and a pair)', () => {
    expect(inviteProblems(INVITE)).toEqual([])
    expect(inviteSeatsOf(INVITE, r1)).toBe(6)
    expect(inviteSeatsOf(INVITE, r2)).toBe(6)
    expect(INVITE.tableSeats).toHaveLength(12)
    expect(inviteFree(INVITE, 0)).toBe(12)
    expect(inviteFree(INVITE, 7)).toBe(5)
    expect(inviteFree(INVITE, 99)).toBe(0)
  })

  it('at the start nobody waves; the first guest comes after 400 ms, the next one a little later; never more than "at once" wave', () => {
    let st = inviteStart(r1)
    expect(st.guests.map((g) => g.phase)).toEqual(['away', 'away', 'away', 'away', 'away', 'away'])
    st = inviteStep(r1, st, 300)
    expect(inviteFirstWaving(st)).toBeNull()
    st = inviteStep(r1, st, 200)
    expect(st.guests.map((g) => g.phase).filter((p) => p === 'waving')).toHaveLength(1)
    expect(inviteFirstWaving(st)).toBe(0)
    st = inviteStep(r1, st, 2500)
    expect(st.guests.filter((g) => g.phase === 'waving').map((_, i) => i)).toHaveLength(2)
    for (let t = 0; t < 60000; t += 100) {
      st = inviteStep(r1, st, 100)
      expect(st.guests.filter((g) => g.phase === 'waving').length).toBeLessThanOrEqual(r1.atOnce)
    }
  })

  it('a guest that is not tapped goes away after "show" and comes back after "gap" at the next place; two guests never wave at the same place', () => {
    let st = inviteStart(r1)
    st = inviteStep(r1, st, 500)
    expect(st.guests[0]!.phase).toBe('waving')
    expect(st.guests[0]!.spot).toBe(0)
    st = inviteStep(r1, st, r1.show - 1)
    expect(st.guests[0]!.phase).toBe('waving')
    st = inviteStep(r1, st, 1)
    expect(st.guests[0]!.phase).toBe('away')
    expect(st.guests[0]!.spot).toBe(1)
    expect(st.guests[0]!.at).toBeGreaterThanOrEqual(st.time + r1.gap - 1)
    for (let t = 0; t < 120000; t += 100) {
      st = inviteStep(r1, st, 100)
      const spots = st.guests.filter((g) => g.phase === 'waving').map((g) => g.spot)
      expect(new Set(spots).size).toBe(spots.length)
    }
  })

  it('with less motion nobody goes away until he is tapped', () => {
    let st = inviteStart(r1)
    for (let t = 0; t < 30000; t += 100) st = inviteStep(r1, st, 100, true)
    expect(st.guests.filter((g) => g.phase === 'waving')).toHaveLength(r1.atOnce)
    expect(st.guests.filter((g) => g.phase === 'away')).toHaveLength(6 - r1.atOnce)
  })

  it('a tap invites a waving guest and gives him the next free place; a guest that is away or already sits cannot be invited', () => {
    let st = inviteStart(r1)
    expect(inviteTap(INVITE, r1, st, 0).invited).toBe(false)
    st = inviteStep(r1, st, 500)
    const r = inviteTap(INVITE, r1, st, 0)
    expect(r.invited).toBe(true)
    expect(r.seat).toBe(0)
    expect(r.state.guests[0]!.phase).toBe('seated')
    expect(r.state.nextSeat).toBe(1)
    expect(inviteSeatList(INVITE, r1, r.state, 0)).toEqual([0])
    expect(inviteSeatAt(INVITE, r1, r.state, 0)).toEqual(INVITE.tableSeats[0])
    expect(inviteTap(INVITE, r1, r.state, 0).invited).toBe(false)
    expect(inviteTap(INVITE, r1, r.state, 99).invited).toBe(false)
    // the old state was not changed
    expect(st.guests[0]!.phase).toBe('waving')
    expect(inviteSeatAt(INVITE, r1, st, 0)).toBeNull()
  })

  it('a pair takes two places and sits between them; round 2 goes on after the places of round 1', () => {
    let st = inviteStart(r2, 6)
    for (let t = 0; t < 20000 && st.guests[2]!.phase !== 'waving'; t += 100) st = inviteStep(r2, st, 100)
    expect(st.guests[2]!.phase).toBe('waving')
    const r = inviteTap(INVITE, r2, st, 2)
    expect(r.seat).toBe(6)
    expect(r.state.nextSeat).toBe(8)
    expect(inviteSeatList(INVITE, r2, r.state, 2)).toEqual([6, 7])
    const at = inviteSeatAt(INVITE, r2, r.state, 2)!
    expect(at.x).toBeCloseTo((INVITE.tableSeats[6]!.x + INVITE.tableSeats[7]!.x) / 2, 6)
  })

  it('a child that taps every guest at once finishes both rounds, and the twelve places are full', () => {
    let seat = 0
    for (const r of INVITE.rounds) {
      const sim = inviteSimulate(INVITE, r, seat)
      expect(sim.done).toBe(true)
      expect(sim.peak).toBeLessThanOrEqual(r.atOnce)
      seat += inviteSeatsOf(INVITE, r)
    }
    expect(seat).toBe(12)
    let st = inviteStart(r1)
    expect(inviteDone(st)).toBe(false)
  })

  it('the help keeps the guest who waves the longest until he is tapped, and calls the next one when nobody waves', () => {
    let st = inviteStart(r1)
    // nobody waves yet: the help calls the first guest at once
    const h0 = inviteHelp(r1, st)
    expect(h0.guest).toBe(0)
    expect(h0.state.guests[0]!.phase).toBe('waving')
    expect(h0.state.pinned).toBe(0)
    // he does not go away
    let s = h0.state
    for (let t = 0; t < 20000; t += 100) s = inviteStep(r1, s, 100)
    expect(s.guests[0]!.phase).toBe('waving')
    // tapping him lets the pin go
    const tap = inviteTap(INVITE, r1, s, 0)
    expect(tap.state.pinned).toBeNull()
    // with someone waving, he is the one
    st = inviteStep(r1, st, 3000)
    const h1 = inviteHelp(r1, st)
    expect(h1.guest).toBe(inviteFirstWaving(st))
    expect(h1.state.pinned).toBe(h1.guest)
    // nobody left: nothing to show
    let all = inviteStart(r1)
    for (let i = 0; i < 6; i++) {
      all = inviteHelp(r1, all).state
      const w = inviteFirstWaving(all)!
      all = inviteTap(INVITE, r1, all, w).state
    }
    expect(inviteDone(all)).toBe(true)
    expect(inviteHelp(r1, all).guest).toBeNull()
  })

  it('stars: three; with help two', () => {
    expect(inviteStars(false)).toBe(3)
    expect(inviteStars(true)).toBe(2)
  })

  it('every checker finds broken data', () => {
    const bad = (f: (g: InviteGame) => void): string[] => {
      const g = clone(INVITE)
      f(g)
      return inviteProblems(g)
    }
    expect(bad((g) => g.tableSeats.pop()).join()).toMatch(/twelve places/)
    expect(bad((g) => (g.tableSeats[3]!.x = 1)).join()).toMatch(/place 4 should lie to the right/)
    expect(bad((g) => (g.table.image = '')).join()).toMatch(/no picture of the table/)
    expect(bad((g) => (g.servant.image = '')).join()).toMatch(/no picture of the servant/)
    expect(bad((g) => (g.lamp.on.image = '')).join()).toMatch(/lamp needs two pictures/)
    expect(bad((g) => (g.hedge.image = '')).join()).toMatch(/no picture of the hedge/)
    expect(bad((g) => (g.fence.image = '')).join()).toMatch(/no picture of the fence/)
    expect(bad((g) => (g.sprites.g1!.sit.image = '')).join()).toMatch(/needs a picture waving and a picture sitting/)
    expect(bad((g) => (g.sprites.g1!.wait.w = 4)).join()).toMatch(/9 to 30 percent wide waving/)
    expect(bad((g) => (g.rounds = [])).join()).toMatch(/no rounds|take 0 places/)
    expect(bad((g) => (g.rounds[0]!.scene = '')).join()).toMatch(/no picture of the place/)
    expect(bad((g) => (g.rounds[0]!.show = 2000)).join()).toMatch(/at least 3000 milliseconds/)
    expect(bad((g) => (g.rounds[0]!.atOnce = 9)).join()).toMatch(/at once should be 1 to 5/)
    expect(bad((g) => (g.rounds[0]!.spots[1]!.x = 15)).join()).toMatch(/places 1 and 2 lie less than 14 percent apart/)
    expect(bad((g) => (g.rounds[0]!.guests[0]!.spot = 9)).join()).toMatch(/place that is not there/)
    expect(bad((g) => (g.rounds[0]!.guests[0]!.sprite = 'nobody')).join()).toMatch(/has no pictures/)
    expect(bad((g) => (g.rounds[0]!.guests[5]!.sprite = 'g1')).join()).toMatch(/comes 2 times/)
    expect(bad((g) => g.rounds[1]!.guests.pop()).join()).toMatch(/take 10 places|take 11 places|take 9 places/)
    expect(bad((g) => (g.rounds[1]!.spots[2]!.cover = undefined)).join()).toMatch(/not every place has one/)
    expect(bad((g) => g.rounds[1]!.guests.forEach((x) => (x.hidden = false))).join()).toMatch(/behind a hedge or a fence/)
    expect(bad((g) => (g.rounds[0]!.guests[0]!.hidden = true)).join()).toMatch(/round 1 should have no guests behind|not every place has one/)
    expect(bad((g) => (g.rounds[1]!.show = 6000)).join()).toMatch(/shorter time than round 1/)
    expect(bad((g) => (g.rounds[1]!.atOnce = 1)).join()).toMatch(/at least as many waving at once/)
    // a guest that would stand outside the picture
    expect(bad((g) => (g.rounds[0]!.spots[0]!.x = 2)).join()).toMatch(/outside the picture/)
    expect(bad((g) => (g.rounds[0]!.spots[0]!.y = 10)).join()).toMatch(/outside the picture/)
    // round 1 must leave room
    expect(bad((g) => {
      g.rounds[0]!.guests.push(...g.rounds[1]!.guests.splice(0, 5))
      g.rounds[1]!.guests.push({ sprite: 'g1', spot: 0 })
    }).length).toBeGreaterThan(0)
  })
})
