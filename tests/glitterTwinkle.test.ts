/**
 * The real glitter of the glitter pencils: the places that flash (`glitterSites`, `twinkle`) and the layer that draws them over the picture
 * (`useGlitterTwinkle`): a place is only shown where its paint still lies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { glitterSites, twinkle, type GlitterSite } from '@/utils/coloringBrushes'
import useGlitterTwinkle, { MAX_SITES, sameColor, toneFor, STATIC_LEVEL } from '@/use/useGlitterTwinkle'

describe('glitterSites and twinkle', () => {
  it('a longer piece of stroke has more flash places, spread over the inner part of the stroke, never more than thirty', () => {
    let n = 0
    const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280) || 0.5
    const short = glitterSites(100, 100, 130, 100, 40, random)
    const long = glitterSites(100, 100, 700, 100, 40, random)
    expect(long.length).toBeGreaterThan(short.length)
    expect(long.length).toBeLessThanOrEqual(30)
    for (const s of long) {
      expect(s.x).toBeGreaterThanOrEqual(100)
      expect(s.x).toBeLessThanOrEqual(700)
      expect(Math.abs(s.y - 100)).toBeLessThanOrEqual(40 * 0.325 + 0.001)
      expect(s.r).toBeGreaterThanOrEqual(1)
      expect(s.speed).toBeGreaterThan(1.7)
    }
  })

  it('the density is that of the demo: about one flash place to every 40 pixels of a stroke 38 wide, and the places grow with the width', () => {
    let total = 0
    for (let i = 0; i < 400; i++) total += glitterSites(0, 0, 100, 0, 38).length
    // 100 px of path = about 26 stamps of 3.8 px, one place to every 3.85 stamps: about 6.8 places
    expect(total / 400).toBeGreaterThan(5)
    expect(total / 400).toBeLessThan(9)
    expect(Math.max(...Array.from({ length: 40 }, () => glitterSites(0, 0, 100, 0, 76)).flat().map((s) => s.r))).toBeGreaterThan(2.6)
  })

  it('a tap makes at most one place', () => {
    for (let i = 0; i < 20; i++) expect(glitterSites(50, 50, 50, 50, 30).length).toBeLessThanOrEqual(1)
  })

  it('a flash is dark most of the time and shines for a short while, between 0 and 1, and comes round about every three seconds', () => {
    const site: GlitterSite = { x: 0, y: 0, r: 5, phase: 0, speed: 2 }
    const levels = Array.from({ length: 400 }, (_, i) => twinkle(site, i * 0.025))
    expect(Math.min(...levels)).toBe(0)
    expect(Math.max(...levels)).toBeGreaterThan(0.95)
    expect(Math.max(...levels)).toBeLessThanOrEqual(1)
    expect(levels.filter((l) => l > 0.3).length).toBeLessThan(levels.length * 0.15)
    // the period of sin(2t) is pi seconds
    expect(twinkle(site, 0.7)).toBeCloseTo(twinkle(site, 0.7 + Math.PI), 6)
  })
})

describe('colours', () => {
  it('white light on dark and middle colours, gold on pale ones', () => {
    expect(toneFor([200, 30, 30])).toBe('#FFFFFF')
    expect(toneFor([255, 250, 240])).toBe('#FFC93C')
  })
  it('a colour counts as the same within a few steps', () => {
    expect(sameColor([100, 100, 100], [110, 95, 100])).toBe(true)
    expect(sameColor([100, 100, 100], [200, 100, 100])).toBe(false)
  })
})

describe('useGlitterTwinkle', () => {
  const frames: ((t: number) => void)[] = []
  /** The paint: a map from "x,y" to a colour; everywhere else is empty. */
  let paint = new Map<string, [number, number, number, number]>()
  const paintCtx = {
    canvas: { width: 200, height: 100 },
    getImageData: (x: number, y: number, w = 1, h = 1) => {
      // like the real one: the pixels of the box, row by row, four numbers each
      const data: number[] = []
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) data.push(...(paint.get(`${x + i},${y + j}`) ?? [0, 0, 0, 0]))
      reads++
      return { data }
    }
  } as unknown as CanvasRenderingContext2D
  let drawn = 0
  let reads = 0
  const overlayCtx = {
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(() => drawn++),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn()
  } as unknown as CanvasRenderingContext2D
  const overlay = { width: 0, height: 0, getContext: () => overlayCtx } as unknown as HTMLCanvasElement

  beforeEach(() => {
    frames.length = 0
    drawn = 0
    paint = new Map()
    vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  const site = (x: number, y: number): GlitterSite => ({ x, y, r: 4, phase: Math.PI / 2, speed: 0 })

  it('takes in only the places where paint lies, and the overlay has the size of the picture', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    g.sync()
    // the overlay is drawn at half the size of the picture (the flashes are small)
    expect(overlay.width).toBe(100)
    expect(overlay.height).toBe(50)
    paint.set('10,10', [200, 20, 20, 255])
    g.add([site(10, 10), site(50, 50)])
    g.settle()
    expect(g.count()).toBe(1)
  })

  it('starts drawing when there are places and stops when there are none', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    g.settle()
    expect(frames).toHaveLength(0)
    paint.set('10,10', [200, 20, 20, 255])
    g.add([site(10, 10)])
    g.settle()
    expect(frames).toHaveLength(1)
    // a frame draws the flash (phase pi/2 and speed 0: always at full brightness)
    frames[0]!(1000)
    expect(drawn).toBeGreaterThan(0)
    g.clear()
    expect(g.count()).toBe(0)
  })

  it('hides a place whose paint is gone (erased, undone) and shows it again when the paint comes back', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    paint.set('10,10', [200, 20, 20, 255])
    g.add([site(10, 10)])
    g.settle()
    expect(g.count()).toBe(1)
    paint.delete('10,10')
    g.settle()
    expect(g.count()).toBe(0)
    paint.set('10,10', [200, 20, 20, 255])
    g.settle()
    expect(g.count()).toBe(1)
  })

  it('hides a place that was painted over with another colour', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    paint.set('10,10', [200, 20, 20, 255])
    g.add([site(10, 10)])
    g.settle()
    paint.set('10,10', [20, 20, 220, 255])
    g.settle()
    expect(g.count()).toBe(0)
  })

  it('lays every second place as a still star on an exported picture, scaled to its size', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    const many: GlitterSite[] = []
    for (let i = 0; i < 4; i++) {
      paint.set(`${10 + i},10`, [200, 20, 20, 255])
      many.push(site(10 + i, 10))
    }
    g.add(many)
    g.settle()
    const moves: number[] = []
    const out = { ...(overlayCtx as unknown as Record<string, unknown>), moveTo: (x: number) => void moves.push(x) } as unknown as CanvasRenderingContext2D
    g.drawStatic(out, 2)
    // two of the four places, at twice the place
    expect(moves.length).toBe(2)
    expect(moves.every((x) => x >= 2 * 10 - 20)).toBe(true)
    expect(STATIC_LEVEL).toBeGreaterThan(0.2)
  })

  it('where nothing is to move the flashes stand still: no frame loop, a still picture', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    paint.set('10,10', [200, 20, 20, 255])
    g.add([site(10, 10), site(10, 10)])
    paint.set('10,11', [200, 20, 20, 255])
    g.settle()
    expect(frames).toHaveLength(0)
    expect(drawn).toBeGreaterThan(0)
  })

  it('keeps no more than the allowed number of places', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    const many: GlitterSite[] = []
    for (let i = 0; i < MAX_SITES + 100; i++) {
      paint.set(`${i % 200},${Math.floor(i / 200) % 100}`, [200, 20, 20, 255])
      many.push(site(i % 200, Math.floor(i / 200) % 100))
    }
    g.add(many)
    g.settle()
    expect(g.count()).toBeLessThanOrEqual(MAX_SITES)
  })
  it('reads the picture with one call however many places there are (one call for every place froze the app after every stroke)', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    const sites: GlitterSite[] = []
    for (let i = 0; i < 150; i++) {
      paint.set(`${i},${i % 90}`, [200, 20, 20, 255])
      sites.push(site(i, i % 90))
    }
    g.add(sites)
    reads = 0
    g.settle()
    expect(g.count()).toBe(150)
    expect(reads).toBe(1)
    reads = 0
    g.settle()
    expect(reads).toBe(1)
  })

  it('after a change only the places inside the changed area are looked at again', () => {
    const g = useGlitterTwinkle(() => paintCtx, () => overlay)
    paint.set('10,10', [200, 20, 20, 255])
    paint.set('150,60', [200, 20, 20, 255])
    g.add([site(10, 10), site(150, 60)])
    g.settle()
    expect(g.count()).toBe(2)
    // both lose their paint, but only the area around the first one is said to have changed
    paint.delete('10,10')
    paint.delete('150,60')
    g.settle({ x0: 0, y0: 0, x1: 40, y1: 40 })
    expect(g.count()).toBe(1)
    g.settle()
    expect(g.count()).toBe(0)
  })
})
