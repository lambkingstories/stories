/**
 * The pure parts of the three new games of "Der junge Jesus und die Taufe" (`utils/taufeNeu.ts`): the scroll (where a picture stands, the check of "That is it!", the help),
 * sun and shade (the sun on its arc, the shadows that wander with it, the heat, the walk, "Help me" that reaches the goal without a mistake) and light over Galilee
 * (the arc, the finger on the arc, the villages with light, the window of light over all). The real data of the adventure must have no problems.
 */
import { describe, expect, it } from 'vitest'
import { taufe } from '@/data/adventures/taufe'
import {
  scrollCheck,
  scrollClamp,
  scrollMetrics,
  scrollNearest,
  scrollProblems,
  scrollTarget,
  scrollTileTop,
  shadeGoal,
  shadeHelp,
  shadeIn,
  shadePick,
  shadeProblems,
  shadeShadow,
  shadeSimulate,
  shadeStart,
  shadeStep,
  shadeSun,
  shadeUnder,
  sunAllLit,
  sunAt,
  sunBeads,
  sunFromPoint,
  sunHelp,
  sunLit,
  sunriseProblems,
  sunWindow
} from '@/utils/taufeNeu'
import type { ScrollGame, ShadowWalkGame, ShadeRound, SunGame } from '@/utils/taufeNeu'

// ---------------------------------------------------------------- sample data
const TILES = ['tempel', 'lamm', 'esel', 'krug', 'brot', 'tor', 'palme', 'lampe']
export const SCROLL: ScrollGame = {
  background: 'tempel.webp',
  frame: 'rolle.webp',
  frameRatio: 2 / 3,
  window: { x: 14, y: 16, w: 72, h: 66 },
  tiles: TILES.map((id) => ({ id, image: `${id}.webp`, label: id })),
  rounds: [
    { hint: 'Roll die Rolle.', tiles: ['lamm', 'tempel', 'esel', 'krug', 'brot', 'tor'], find: ['tempel', 'brot', 'lamm'], start: 3, tolerance: 0.35 },
    { hint: 'Eine längere Rolle.', tiles: ['krug', 'palme', 'tempel', 'lampe', 'esel', 'tor', 'lamm', 'brot'], find: ['lampe', 'lamm', 'palme', 'brot'], start: 0, tolerance: 0.22 }
  ]
}

const THINGS = [
  { id: 'fels', image: 'fels.webp', label: 'Felsbrocken', w: 12, ratio: 1.2 },
  { id: 'strauch', image: 'strauch.webp', label: 'Dornstrauch', w: 11, ratio: 1.1 },
  { id: 'gross', image: 'gross.webp', label: 'großer Fels', w: 22, ratio: 1.6 }
]
export const SHADE: ShadowWalkGame = {
  background: 'wueste.webp',
  walker: 'jesus.webp',
  walkerW: 12,
  walkerRatio: 0.5,
  sun: 'sonne.webp',
  sunW: 10,
  shadow: 'schatten.webp',
  things: THINGS,
  rounds: [
    {
      hint: 'Führe Jesus von Schatten zu Schatten.',
      places: [
        { thing: 'fels', x: 12, y: 80, reach: 4, size: 6 },
        { thing: 'strauch', x: 34, y: 70, reach: 3, size: 5 },
        { thing: 'fels', x: 56, y: 82, reach: 4, size: 6 },
        { thing: 'gross', x: 82, y: 66, reach: 5, size: 9, goal: true }
      ],
      start: 0,
      seconds: 60,
      heat: 3,
      speed: 8
    },
    {
      hint: 'Ein langer Weg.',
      places: [
        { thing: 'fels', x: 10, y: 88, reach: 4, size: 6 },
        { thing: 'strauch', x: 28, y: 76, reach: 3, size: 5 },
        { thing: 'strauch', x: 44, y: 90, reach: 3, size: 5 },
        { thing: 'fels', x: 58, y: 72, reach: 4, size: 6 },
        { thing: 'strauch', x: 40, y: 58, reach: 3, size: 5 },
        { thing: 'gross', x: 84, y: 82, reach: 5, size: 9, goal: true }
      ],
      start: 0,
      seconds: 45,
      heat: 2.4,
      speed: 8
    }
  ]
}

export const SUN: SunGame = {
  background: 'see.webp',
  sun: 'sonne.webp',
  sunW: 13,
  glow: 'glanz.webp',
  bead: 'perle.webp',
  arc: { cx: 50, cy: 48, rx: 40, ry: 32 },
  hold: 1,
  rounds: [
    {
      hint: 'Zieh die Sonne hoch.',
      villages: [
        { image: 'd1.webp', name: 'Kapernaum', x: 20, y: 80, w: 14, from: 0.15, to: 0.62 },
        { image: 'd2.webp', name: 'Dorf 2', x: 40, y: 86, w: 14, from: 0.3, to: 0.7 },
        { image: 'd3.webp', name: 'Dorf 3', x: 62, y: 80, w: 14, from: 0.35, to: 0.85 },
        { image: 'd4.webp', name: 'Dorf 4', x: 82, y: 88, w: 14, from: 0.25, to: 0.75 }
      ],
      start: 0.04
    },
    {
      hint: 'Mehr Dörfer.',
      villages: [
        { image: 'd1.webp', name: 'Kapernaum', x: 12, y: 80, w: 13, from: 0.1, to: 0.52 },
        { image: 'd2.webp', name: 'Dorf 2', x: 28, y: 90, w: 13, from: 0.3, to: 0.7 },
        { image: 'd3.webp', name: 'Dorf 3', x: 44, y: 78, w: 13, from: 0.4, to: 0.88 },
        { image: 'd4.webp', name: 'Dorf 4', x: 60, y: 92, w: 13, from: 0.22, to: 0.6 },
        { image: 'd5.webp', name: 'Dorf 5', x: 74, y: 80, w: 13, from: 0.43, to: 0.8 },
        { image: 'd6.webp', name: 'Dorf 6', x: 90, y: 90, w: 13, from: 0.35, to: 0.75 }
      ],
      start: 0.02
    }
  ]
}

// ---------------------------------------------------------------- the scroll
describe('Schriftrolle (scroll)', () => {
  it('the sample data have no problems; a picture fits into the window', () => {
    expect(scrollProblems(SCROLL)).toEqual([])
    const m = scrollMetrics(SCROLL)
    expect(m.side).toBeGreaterThan(0.3)
    expect(m.side).toBeLessThan(0.92)
    expect(m.step).toBeCloseTo(m.side * 1.14, 6)
  })

  it('the place is kept on the scroll; the nearest picture and its distance to the middle', () => {
    expect(scrollClamp(-1, 6)).toBe(0)
    expect(scrollClamp(9, 6)).toBe(5)
    expect(scrollNearest(2.3, 6)).toEqual({ index: 2, off: expect.closeTo(-0.3, 6) })
    expect(scrollNearest(2.6, 6).index).toBe(3)
  })

  it('the picture at `pos` stands in the middle of the window, the next one a step lower', () => {
    const m = scrollMetrics(SCROLL)
    expect(scrollTileTop(SCROLL, 2, 2) + (m.side * 100) / 2).toBeCloseTo(50, 6)
    expect(scrollTileTop(SCROLL, 3, 2) - scrollTileTop(SCROLL, 2, 2)).toBeCloseTo(m.step * 100, 6)
  })

  it('"That is it!": off between two pictures, right for the picture looked for, wrong for another', () => {
    const r = SCROLL.rounds[0]!
    expect(scrollCheck(r, 1.5, 0)).toBe('off')
    expect(scrollCheck(r, 1.2, 0)).toBe('right')
    expect(scrollCheck(r, 2, 0)).toBe('wrong')
    expect(scrollCheck(SCROLL.rounds[1]!, 3.3, 0)).toBe('off') // round 2 is more exact
    expect(scrollTarget(r, 1)).toBe(4)
    expect(scrollTarget(r, 9)).toBe(-1)
  })

  it('the checker finds mistakes in the data', () => {
    const bad: ScrollGame = { ...SCROLL, rounds: [{ ...SCROLL.rounds[0]!, find: ['tempel', 'esel'], start: 1 }, { ...SCROLL.rounds[1]!, tiles: ['krug', 'krug', 'x', 'lampe'], tolerance: 0.5 }] }
    const p = scrollProblems(bad).join('\n')
    expect(p).toMatch(/already in the window/)
    expect(p).toMatch(/twice on the scroll/)
    expect(p).toMatch(/does not exist/)
    expect(p).toMatch(/tolerance/)
    expect(p).toMatch(/longer scroll/)
    expect(p).toMatch(/right next to/)
  })
})

// ---------------------------------------------------------------- sun and shade
describe('Schattenweg (shadowWalk)', () => {
  const r1 = SHADE.rounds[0]!
  it('the sample data have no problems', () => {
    expect(shadeProblems(SHADE)).toEqual([])
  })

  it('the sun wanders from the left over the top to the right', () => {
    expect(shadeSun(0).x).toBeLessThan(10)
    expect(shadeSun(1).x).toBeGreaterThan(90)
    expect(shadeSun(0.5).y).toBeLessThan(shadeSun(0).y)
    expect(shadeSun(2)).toEqual(shadeSun(1))
  })

  it('the shadows fall away from the sun and are longest in the morning and in the evening', () => {
    const p = r1.places[0]!
    expect(shadeShadow(p, 0).x).toBeCloseTo(p.x + p.reach, 6)
    expect(shadeShadow(p, 1).x).toBeCloseTo(p.x - p.reach, 6)
    expect(shadeShadow(p, 0.5).x).toBeCloseTo(p.x, 6)
    expect(shadeShadow(p, 0).rx).toBeGreaterThan(shadeShadow(p, 0.5).rx)
    const s = shadeShadow(p, 0.5)
    expect(shadeIn(s, { x: s.x, y: s.y })).toBe(0)
    expect(shadeIn(s, { x: s.x + s.rx, y: s.y })).toBeCloseTo(1, 6)
  })

  it('Jesus starts in the shade; a tap on a shadow or on its thing picks the place, a tap on the sand nothing', () => {
    const s = shadeStart(r1)
    expect(shadeUnder(r1, s.at, 0)).toContain(0)
    const sh = shadeShadow(r1.places[1]!, 0)
    expect(shadePick(r1, THINGS, { x: sh.x, y: sh.y }, 0)).toBe(1)
    expect(shadePick(r1, THINGS, { x: 34, y: 64 }, 0)).toBe(1) // the bush itself
    expect(shadePick(r1, THINGS, { x: 50, y: 40 }, 0)).toBe(-1)
  })

  it('in the sun the heat grows; too long is a mistake and Jesus goes to the nearest shade by himself', () => {
    let s = { ...shadeStart(r1), at: { x: 45, y: 50 } }
    let hot = 0
    for (let i = 0; i < 80 && !hot; i++) {
      const res = shadeStep(r1, s, 0.05)
      s = res.state
      if (res.event === 'hot') hot = i
    }
    expect(hot).toBeGreaterThan(0)
    expect(s.mistakes).toBe(1)
    expect(s.to).toBeGreaterThanOrEqual(0)
    expect(s.heat).toBe(0)
  })

  it('a walk to a shadow arrives; in the shadow of the goal the round is done', () => {
    let s = { ...shadeStart(r1), to: 1 }
    let arrived = false
    for (let i = 0; i < 200 && !arrived; i++) {
      const res = shadeStep(r1, s, 0.05)
      s = res.state
      arrived = res.event === 'arrived'
    }
    expect(arrived).toBe(true)
    expect(s.reached).toEqual([0, 1])
    const g = shadeGoal(r1)
    const gs = shadeShadow(r1.places[g]!, s.t)
    const res = shadeStep(r1, { ...s, at: { x: gs.x, y: gs.y } }, 0.05)
    expect(res.event).toBe('goal')
    expect(res.state.done).toBe(true)
  })

  it('"Help me" leads to a nearer shadow and reaches the goal without a mistake; round 2 needs more stops', () => {
    const h = shadeHelp(r1, shadeStart(r1))
    expect(h).toBeGreaterThan(0)
    const a = shadeSimulate(r1)
    const b = shadeSimulate(SHADE.rounds[1]!)
    expect(a.done && b.done).toBe(true)
    expect(a.mistakes + b.mistakes).toBe(0)
    expect(b.hops).toBeGreaterThan(a.hops)
  })

  it('the checker finds mistakes in the data', () => {
    const one: ShadeRound = { ...r1, places: [r1.places[0]!, { ...r1.places[3]!, x: 24 }, r1.places[1]!, r1.places[2]!], heat: 1 }
    const p = shadeProblems({ ...SHADE, walkerW: 6, rounds: [one] }).join('\n')
    expect(p).toMatch(/Jesus is too small/)
    expect(p).toMatch(/two rounds/)
    expect(p).toMatch(/heat comes too soon/)
  })
})

// ---------------------------------------------------------------- light over Galilee
describe('Sonnenaufgang (sunrise)', () => {
  const r1 = SUN.rounds[0]!
  it('the sample data have no problems', () => {
    expect(sunriseProblems(SUN)).toEqual([])
  })

  it('the arc: left horizon, top, right horizon; the finger is put on the arc', () => {
    expect(sunAt(SUN, 0).x).toBeCloseTo(10, 6)
    expect(sunAt(SUN, 0).y).toBeCloseTo(48, 6)
    expect(sunAt(SUN, 0.5).x).toBeCloseTo(50, 6)
    expect(sunAt(SUN, 0.5).y).toBeCloseTo(16, 6)
    expect(sunAt(SUN, 1).x).toBeCloseTo(90, 6)
    expect(sunFromPoint(SUN, sunAt(SUN, 0.3))).toBeCloseTo(0.3, 6)
    expect(sunFromPoint(SUN, { x: 30, y: 70 })).toBe(0)
    expect(sunFromPoint(SUN, { x: 70, y: 70 })).toBe(1)
    expect(sunBeads(SUN, 5)).toHaveLength(5)
  })

  it('the villages with light, the window of light over all, the help in its middle', () => {
    expect(sunLit(r1, 0.2)).toEqual([true, false, false, false])
    expect(sunAllLit(r1, 0.5)).toBe(true)
    expect(sunAllLit(r1, 0.66)).toBe(false)
    expect(sunWindow(r1)).toEqual([0.35, 0.62])
    expect(sunHelp(r1)).toBeCloseTo(0.485, 6)
    expect(sunAllLit(SUN.rounds[1]!, sunHelp(SUN.rounds[1]!))).toBe(true)
  })

  it('the checker finds mistakes in the data', () => {
    const bad: SunGame = { ...SUN, sunW: 6, rounds: [{ ...r1, start: 0.5 }, { ...r1, villages: r1.villages.slice(0, 2).map((v) => ({ ...v, from: 0, to: 1 })) }] }
    const p = sunriseProblems(bad).join('\n')
    expect(p).toMatch(/sun is too small/)
    expect(p).toMatch(/at the start there is light/)
    expect(p).toMatch(/always has light/)
    expect(p).toMatch(/more villages/)
  })
})

// ---------------------------------------------------------------- the real data
describe('Taufe: the real data of the three new games', () => {
  const task = (n: number) => taufe.stages[n - 1]!.task as unknown as Record<string, unknown>
  it('stage 2 is the scroll, stage 5 sun and shade, stage 7 light over Galilee; every checker finds nothing', () => {
    expect(task(2).kind).toBe('schriftrolle')
    expect(task(5).kind).toBe('schattenweg')
    expect(task(7).kind).toBe('sonnenaufgang')
    expect(scrollProblems(task(2).scroll as ScrollGame)).toEqual([])
    expect(shadeProblems(task(5).shadowWalk as ShadowWalkGame)).toEqual([])
    expect(sunriseProblems(task(7).sunrise as SunGame)).toEqual([])
  })
})
