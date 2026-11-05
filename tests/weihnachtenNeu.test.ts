/**
 * The four new games of "Weihnachten" (Antons Regel 5.11.2026), pure parts (`utils/weihnachtenNeu.ts`) and the real data of the adventure:
 * the census (`zaehlung`), the shepherds' fire (`hirtenfeuer`), spread the word (`weitersagen`), follow the star (`stern`).
 * The `*Problems` checkers of the real data must be empty; the games must be winnable (a perfect player is simulated) and not winnable by doing nothing.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { weihnachten } from '@/data/adventures/weihnachten'
import {
  FIRE_DARK,
  FIRE_EARLY,
  FIRE_EMBERS,
  STAR_LOST,
  TELL_NEAR,
  censusDist,
  censusHelp,
  censusProblems,
  censusSpot,
  censusTownAt,
  censusVerdict,
  fireBurn,
  fireFeed,
  fireMoon,
  fireNeediest,
  fireProblems,
  fireStage,
  fireStart,
  starArrival,
  starProblems,
  starStart,
  starStep,
  starUnder,
  starX,
  tellCrosses,
  tellHelp,
  tellOptions,
  tellPlaceAt,
  tellPoints,
  tellProblems,
  tellSolve,
  tellTraps,
  tellTry,
  wnNeighbour
} from '@/utils/weihnachtenNeu'
import type { CensusGame, FireGame, StarGame, TellGame } from '@/utils/weihnachtenNeu'

const stage = (n: number) => weihnachten.stages[n - 1]!
const census = () => (stage(4).task as unknown as { census: CensusGame }).census
const fire = () => (stage(6).task as unknown as { fire: FireGame }).fire
const tell = () => (stage(7).task as unknown as { tell: TellGame }).tell
const star = () => (stage(8).task as unknown as { star: StarGame }).star
const PUBLIC = 'public/'

describe('Weihnachten (neu): the order of the games and the rules of Anton', () => {
  it('stages 4, 6, 7, 8 have the new kinds and fields; 1 and 3 are the two known games, 5 stays; two quizzes; no game twice, the known games not next to each other', () => {
    expect(weihnachten.stages.map((s) => s.task.kind)).toEqual(['lueckenvers', 'quiz', 'reihenfolge', 'zaehlung', 'krippe', 'hirtenfeuer', 'weitersagen', 'stern', 'quiz'])
    expect(Object.keys(stage(4).task)).toContain('census')
    expect(Object.keys(stage(6).task)).toContain('fire')
    expect(Object.keys(stage(7).task)).toContain('tell')
    expect(Object.keys(stage(8).task)).toContain('star')
    const known = weihnachten.stages.map((s) => ['lueckenvers', 'reihenfolge'].includes(s.task.kind))
    expect(known.filter(Boolean)).toHaveLength(2)
    for (let i = 1; i < known.length; i++) expect(known[i] && known[i - 1], `known games in a row at ${i + 1}`).toBe(false)
  })

  it('the old games of the stages are gone from the data (no memory, no sign game, no puzzle, no hidden pictures)', () => {
    const text = JSON.stringify(weihnachten.stages.map((s) => s.task))
    for (const old of ['wimmel', 'memory', 'zeichen', 'puzzle']) expect(text, old).not.toContain(`spiele/weihnachten/${old}/`)
    expect(text).not.toContain('"sign"')
    expect(text).not.toContain('"find"')
  })

  it('the data of all four games are in order (the checkers of the games say nothing)', () => {
    expect(censusProblems(census())).toEqual([])
    expect(fireProblems(fire())).toEqual([])
    expect(tellProblems(tell())).toEqual([])
    expect(starProblems(star())).toEqual([])
  })

  it('every picture of the four games exists in public/ and is not too big', () => {
    const files = new Set<string>()
    const walk = (v: unknown) => {
      if (typeof v === 'string') {
        if (/^images\/abenteuer\/spiele\/weihnachten\/(zaehlung|hirtenfeuer|weitersagen|stern)\//.test(v)) files.add(v)
      } else if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object') Object.values(v).forEach(walk)
    }
    for (const n of [4, 6, 7, 8]) walk(stage(n).task)
    expect(files.size).toBeGreaterThan(20)
    for (const f of files) expect(existsSync(PUBLIC + f), f).toBe(true)
  })
})

// ---------------------------------------------------------------- 1. the census
describe('zaehlung: the census', () => {
  it('six towns on the map, far enough apart that a drop is never ambiguous; two rounds, round 2 has more travelers', () => {
    const g = census()
    expect(g.towns).toHaveLength(6)
    expect(g.towns.map((t) => t.name)).toEqual(['Kapernaum', 'Nazareth', 'Jerusalem', 'Jericho', 'Bethlehem', 'Hebron'])
    for (let i = 0; i < 6; i++) for (let k = i + 1; k < 6; k++) expect(censusDist(g.towns[i]!, g.towns[k]!), `${i}-${k}`).toBeGreaterThan(18)
    expect(g.rounds.map((r) => r.people.length)).toEqual([4, 7])
  })

  it('Joseph and Mary belong to Bethlehem in both rounds (Lk 2,4-5); every town of a clue is on the map', () => {
    const g = census()
    for (const r of g.rounds) {
      for (const who of ['Josef', 'Maria']) expect(r.people.find((p) => p.name === who)?.town, who).toBe('bethlehem')
      for (const p of r.people) expect(g.towns.some((t) => t.id === p.town)).toBe(true)
    }
    expect(weihnachten.stages[3]!.text.join(' ')).toContain('Bethlehem')
  })

  it('a tap on a town: the nearest town within the reach, otherwise nothing; the verdict follows the home town', () => {
    const g = census()
    const beth = g.towns.find((t) => t.id === 'bethlehem')!
    expect(g.towns[censusTownAt(g.towns, { x: beth.x + 3, y: beth.y + 2 })]!.id).toBe('bethlehem')
    expect(censusTownAt(g.towns, { x: 5, y: 95 })).toBe(-1)
    const josef = g.rounds[0]!.people[0]!
    expect(censusVerdict(josef, 'bethlehem')).toBe('ok')
    expect(censusVerdict(josef, 'jericho')).toBe('wrong')
  })

  it('the travelers who have arrived stand in a row under their town, inside the map; "Help me" names the first one who waits', () => {
    const g = census()
    const t = g.towns[4]!
    const a = censusSpot(t, 0, 2)
    const b = censusSpot(t, 1, 2)
    expect(b.x).toBeGreaterThan(a.x)
    expect(a.y).toBeGreaterThan(t.y)
    for (const p of [a, b, censusSpot(g.towns[5]!, 0, 1)]) {
      expect(p.x).toBeGreaterThan(6)
      expect(p.x).toBeLessThan(94)
      expect(p.y).toBeLessThanOrEqual(99)
    }
    const r = g.rounds[0]!
    expect(censusHelp(g, r, [true, false, false, false])).toEqual({ person: 1, town: g.towns.findIndex((x) => x.id === 'bethlehem') })
    expect(censusHelp(g, r, [true, true, true, true])).toBeNull()
  })

  it('the checker finds a clue to a town that does not exist, towns too near each other and a round 2 that is not harder', () => {
    const g = census()
    const bad: CensusGame = { ...g, towns: [...g.towns.slice(0, 2), { ...g.towns[2]!, x: g.towns[1]!.x + 3, y: g.towns[1]!.y }, ...g.towns.slice(3)], rounds: [g.rounds[1]!, { ...g.rounds[0]!, people: [{ ...g.rounds[0]!.people[0]!, town: 'rom' }, ...g.rounds[0]!.people.slice(1)] }] }
    const p = censusProblems(bad).join(' ')
    expect(p).toContain('nearer')
    expect(p).toContain('"rom"')
    expect(p).toContain('round 2 must have more travelers')
  })
})

// ---------------------------------------------------------------- 2. the fire
describe('hirtenfeuer: the shepherds’ fire', () => {
  it('the sizes of a fire, the burning down and the verdicts of laying on wood', () => {
    expect([1, 0.8, 0.6, 0.4, 0.15, 0].map(fireStage)).toEqual([3, 3, 2, 1, 0, -1])
    expect(fireBurn(1, 5, 10)).toBeCloseTo(0.5, 6)
    expect(fireBurn(0.05, 5, 10)).toBe(0)
    expect(fireFeed(0.9)).toBe('early')
    expect(fireFeed(FIRE_EARLY + 0.01)).toBe('early')
    expect(fireFeed(FIRE_EARLY)).toBe('ok')
    expect(fireFeed(0.3)).toBe('ok')
    expect(fireFeed(FIRE_EMBERS)).toBe('late')
    expect(fireNeediest([0.9, 0.3, 0.1])).toBe(2)
    expect(fireNeediest([0.9, 0.8])).toBe(-1)
  })

  it('the moon goes over the sky from the left to the right while the night passes', () => {
    const g = fire()
    expect(fireMoon(g, 0).x).toBeLessThan(fireMoon(g, 0.5).x)
    expect(fireMoon(g, 0.5).x).toBeLessThan(fireMoon(g, 1).x)
    for (const f of [0, 0.25, 0.5, 0.75, 1]) expect(fireMoon(g, f).y).toBeLessThan(25)
  })

  it('a perfect player wins both rounds with no mistake; the fire burns down in a time that leaves at least three seconds to lay on wood', () => {
    for (const r of fire().rounds) {
      expect(r.burn * FIRE_EARLY).toBeGreaterThanOrEqual(3)
      const levels = fireStart(r)
      let feeds = 0
      let mistakes = 0
      for (let step = 0; step < 100000 && feeds < r.feeds; step++) {
        levels.forEach((l, i) => (levels[i] = fireBurn(l, 0.1, r.burn)))
        const i = fireNeediest(levels)
        // the player taps a fire as soon as it is small (the fire that needs wood most)
        if (i >= 0) {
          const v = fireFeed(levels[i]!)
          if (v === 'early') mistakes++
          else {
            levels[i] = 1
            feeds++
          }
        }
        if (levels.some((l) => l <= 0)) mistakes++
      }
      expect(feeds).toBe(r.feeds)
      expect(mistakes).toBe(0)
    }
  })

  it('a player who does nothing loses the fire in round 1 within a minute; a fire that is lit again starts small', () => {
    const r = fire().rounds[0]!
    expect(r.burn).toBeLessThan(60)
    expect(fireStage(0.35)).toBe(1)
    expect(FIRE_DARK).toBeGreaterThan(0)
  })

  it('the checker finds fires that touch, a round 2 that is not harder and a moon that leaves the sky', () => {
    const g = fire()
    const bad: FireGame = { ...g, moonFrom: { x: 10, y: 60 }, rounds: [{ ...g.rounds[1]!, spots: [{ x: 40, y: 90, w: 26 }, { x: 50, y: 90, w: 26 }] }, { ...g.rounds[0]!, burn: 12 }] }
    const p = fireProblems(bad).join(' ')
    expect(p).toContain('too close')
    expect(p).toContain('upper 40')
    expect(p).toContain('must be harder')
  })
})

// ---------------------------------------------------------------- 3. spread the word
describe('weitersagen: spread the word', () => {
  const pts = (ri: number) => tellPoints(tell().rounds[ri]!)

  it('two ways cross or they do not; ways that only meet at one end do not cross', () => {
    const a = { x: 10, y: 10 }
    const b = { x: 90, y: 90 }
    expect(tellCrosses(a, b, { x: 10, y: 90 }, { x: 90, y: 10 })).toBe(true)
    expect(tellCrosses(a, b, { x: 10, y: 90 }, { x: 40, y: 80 })).toBe(false)
    expect(tellCrosses(a, b, b, { x: 90, y: 10 })).toBe(false)
    expect(tellCrosses(a, { x: 50, y: 50 }, { x: 40, y: 40 }, b)).toBe(true) // lie on each other
  })

  it('the verdicts: free, the same place, told already, crossing, through a door', () => {
    const p = [{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 50, y: 20 }, { x: 20, y: 80 }, { x: 80, y: 80 }]
    expect(tellTry(p, [0], 3).kind).toBe('ok')
    expect(tellTry(p, [0], 0).kind).toBe('same')
    expect(tellTry(p, [0], 1).kind).toBe('house') // the way 0-1 runs through the door of place 2
    expect(tellTry(p, [0, 3], 0).kind).toBe('told')
    expect(tellTry(p, [0, 4, 3], 1).kind).toBe('cross') // 3 to 1 crosses 0-4
  })

  it('both rounds can be solved, round 2 has dead ends (it is a puzzle), round 1 is easy', () => {
    for (const ri of [0, 1]) {
      const rest = tellSolve(pts(ri), [0])
      expect(rest, `round ${ri + 1}`).not.toBeNull()
      expect(rest).toHaveLength(pts(ri).length - 1)
    }
    expect(tellTraps(pts(1), 1)).toBeGreaterThanOrEqual(1)
    expect(pts(0).length).toBeLessThan(pts(1).length)
  })

  it('a solution found by the helper really is a valid route, step by step with no crossing', () => {
    for (const ri of [0, 1]) {
      const p = pts(ri)
      const route = [0]
      for (let guard = 0; guard < 20 && route.length < p.length; guard++) {
        const h = tellHelp(p, route)
        expect(h).not.toBeNull()
        if (!h || 'undo' in h) break
        expect(tellTry(p, route, h.next).kind).toBe('ok')
        route.push(h.next)
      }
      expect(route).toHaveLength(p.length)
    }
  })

  it('a stuck route: the helper takes the last way back, and the options are empty', () => {
    const p = pts(1)
    // find a dead end by walking the first option each time until it is stuck
    let route = [0]
    let stuck = false
    const walk = (r: number[]): number[] | null => {
      const opts = tellOptions(p, r)
      if (!opts.length) return r.length < p.length ? r : null
      for (const j of opts) {
        const f = walk([...r, j])
        if (f) return f
      }
      return null
    }
    const dead = walk(route)
    expect(dead).not.toBeNull()
    route = dead!
    stuck = tellOptions(p, route).length === 0
    expect(stuck).toBe(true)
    expect(tellHelp(p, route)).toEqual({ undo: true })
  })

  it('a tap finds the house under it by its picture; nothing on the empty ground', () => {
    const p = pts(0)
    const h = p[1]!
    expect(tellPlaceAt(p, { x: h.x, y: h.y - 5 })).toBe(1)
    expect(tellPlaceAt(p, { x: 2, y: 2 })).toBe(-1)
  })

  it('all places keep their distance, lie wholly in the picture and are big enough to tap (at least 40 pixels on a 360 pixel field)', () => {
    for (const ri of [0, 1]) for (const h of pts(ri)) expect((h.w / 100) * 340, h.name).toBeGreaterThanOrEqual(40)
    expect(TELL_NEAR).toBeGreaterThan(0)
  })

  it('the checker finds a round that cannot be solved and a round 2 without a dead end', () => {
    const g = tell()
    // two places on one line with a third between them: from the first the second cannot be reached except through the door
    const line: TellGame = {
      ...g,
      rounds: [g.rounds[0]!, { ...g.rounds[0]!, houses: g.rounds[0]!.houses.slice(0, 3) }]
    }
    const p = tellProblems(line).join(' ')
    expect(p).toContain('round 2 must have more houses')
  })
})

// ---------------------------------------------------------------- 4. follow the star
describe('stern: follow the star', () => {
  it('the star goes on towards the house, waits at each place, and its way is longer than the walk of the round', () => {
    for (const r of star().rounds) {
      expect([...r.stops].sort((a, b) => a - b)).toEqual(r.stops)
      expect(starX(r, 0)).toBe(r.stops[0])
      expect(starX(r, r.pause / 2)).toBe(r.stops[0])
      let prev = -1
      for (let t = 0; t < r.goal + 1; t += 0.25) {
        const x = starX(r, t)
        expect(x).toBeGreaterThanOrEqual(prev)
        prev = x
      }
      expect(starArrival(r)).toBeGreaterThan(r.goal)
      expect(r.end).toBe(r.stops[r.stops.length - 1])
    }
  })

  /** A player who always walks under the star (the target is the place of the star). */
  function play(g: StarGame, ri: number, follow: (st: ReturnType<typeof starStart>) => number | null) {
    const r = g.rounds[ri]!
    let st = starStart(r)
    let lost = 0
    let arrived = false
    for (let i = 0; i < 20000 && !arrived; i++) {
      const res = starStep(g, r, st, follow(st), 0.05)
      st = res.state
      for (const e of res.events) {
        if (e.type === 'lost') lost++
        if (e.type === 'arrived') arrived = true
      }
    }
    return { st, lost, arrived }
  }

  it('a player who follows the star wins both rounds without losing it; the wise men are faster than the star', () => {
    const g = star()
    for (const ri of [0, 1]) {
      expect(g.walkSpeed).toBeGreaterThanOrEqual(g.rounds[ri]!.starSpeed * 1.5)
      const r = play(g, ri, (st) => st.sx)
      expect(r.arrived, `round ${ri + 1}`).toBe(true)
      expect(r.lost).toBe(0)
      expect(r.st.final).toBe(true)
      expect(Math.abs(r.st.sx - g.rounds[ri]!.end)).toBeLessThan(1e-6)
    }
  })

  it('a player who stands still loses the star once (one mistake, not one every moment) and never arrives under it', () => {
    const g = star()
    const r = g.rounds[0]!
    let st = starStart(r, 5)
    let lost = 0
    for (let i = 0; i < 2000; i++) {
      const res = starStep(g, r, st, null, 0.05)
      st = res.state
      lost += res.events.filter((e) => e.type === 'lost').length
    }
    expect(lost).toBe(1)
    expect(st.arrived).toBe(false)
    expect(STAR_LOST).toBeGreaterThan(1)
  })

  it('a player with a little lag (half a second behind the star) still wins round 1', () => {
    const g = star()
    const r = play(g, 0, (st) => (st.final ? st.sx : st.sx - g.rounds[0]!.starSpeed * 0.5))
    expect(r.arrived).toBe(true)
    expect(r.lost).toBe(0)
  })

  it('found again after a loss: going back under the star counts as found and the next loss counts again', () => {
    const g = star()
    const r = g.rounds[0]!
    let st = starStart(r, 90)
    const events: string[] = []
    for (let i = 0; i < 400; i++) {
      const res = starStep(g, r, st, i < 60 ? null : st.sx, 0.05)
      st = res.state
      events.push(...res.events.map((e) => e.type))
    }
    expect(events[0]).toBe('lost')
    expect(events).toContain('found')
  })

  it('the wise men stay in the picture and look the way they go; under the star means within the room of the round', () => {
    const g = star()
    const r = g.rounds[0]!
    let st = starStart(r)
    st = starStep(g, r, st, 0, 5).state
    expect(st.x).toBeGreaterThanOrEqual(g.walkW / 2 - 1e-9)
    expect(st.face).toBe(-1)
    st = starStep(g, r, st, 100, 20).state
    expect(st.x).toBeLessThanOrEqual(100 - g.walkW / 2 + 1e-9)
    expect(st.face).toBe(1)
    expect(starUnder(r, { x: 50, sx: 50 + r.tolerance })).toBe(true)
    expect(starUnder(r, { x: 50, sx: 50 + r.tolerance + 0.1 })).toBe(false)
  })

  it('the checker finds a star that turns back, a way that is too long and wise men that are too slow', () => {
    const g = star()
    const bad: StarGame = { ...g, walkSpeed: 5, rounds: [{ ...g.rounds[0]!, stops: [60, 30, 70], end: 70 }, { ...g.rounds[1]!, goal: 39 }] }
    const p = starProblems(bad).join(' ')
    expect(p).toContain('places must grow')
    expect(p).toContain('longer than the star needs')
    expect(p).toContain('one and a half times')
  })
})

describe('arrow keys between places', () => {
  it('goes to the nearest place in the direction; stays when there is none', () => {
    const p = [{ x: 20, y: 50 }, { x: 80, y: 50 }, { x: 50, y: 20 }]
    expect(wnNeighbour(p, 0, 1, 0, 1.5)).toBe(1)
    expect(wnNeighbour(p, 1, -1, 0, 1.5)).toBe(0)
    expect(wnNeighbour(p, 0, 0, -1, 1.5)).toBe(2)
    expect(wnNeighbour(p, 0, -1, 0, 1.5)).toBe(0)
  })
})

describe('INTEGRATION.json for the leadership', () => {
  const file = 'D:/Claude/Spiele-Neu/weihnachten/INTEGRATION.json'
  it('names the four kinds and fields, and every key of the three languages is there with the verse of its game', () => {
    if (!existsSync(file)) return
    const i = JSON.parse(readFileSync(file, 'utf-8')) as { kinds: string[]; fields: Record<string, { type: string; from: string; component: string; mood: string }>; i18n: Record<'de' | 'en' | 'es', Record<string, string>> }
    expect(i.kinds).toEqual(['zaehlung', 'hirtenfeuer', 'weitersagen', 'stern'])
    expect(Object.keys(i.fields)).toEqual(['census', 'fire', 'tell', 'star'])
    expect(Object.values(i.fields).map((f) => f.component)).toEqual(['GameZaehlung', 'GameHirtenfeuer', 'GameWeitersagen', 'GameStern'])
    const de = Object.keys(i.i18n.de).sort()
    expect(Object.keys(i.i18n.en).sort()).toEqual(de)
    expect(Object.keys(i.i18n.es).sort()).toEqual(de)
    for (const f of ['census', 'fire', 'tell', 'star']) expect(de.some((k) => k.startsWith(f)), f).toBe(true)
    for (const lang of ['de', 'en', 'es'] as const) for (const k of de) expect(i.i18n[lang][k]!.length, `${lang}.${k}`).toBeGreaterThan(0)
    // the words of the Bible (Luther 1912, KJV)
    expect(i.i18n.de.censusDone).toContain('ein jeglicher in seine Stadt')
    expect(i.i18n.de.fireDone).toContain('hüteten des Nachts ihre Herde')
    expect(i.i18n.de.tellDone).toContain('breiteten sie das Wort aus')
    expect(i.i18n.de.starDone).toContain('stand oben über, da das Kindlein war')
    expect(i.i18n.en.censusDone).toBe('And all went to be taxed, every one into his own city.')
    expect(i.i18n.en.starDone).toContain('stood over where the young child was')
  })
})
