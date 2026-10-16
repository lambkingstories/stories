import { describe, expect, it } from 'vitest'
import { BRUSH_LOOK, TIP_SHAPES, emptyBounds, grainField, growBounds, isLayeredTool, isTipShape, newOilState, shade, strokeReach, tipOf, widthFactor } from '@/utils/coloringBrushes'

describe('paper grain', () => {
  it('is a 256 x 256 field of percentiles between 0 and 1', () => {
    const f = grainField('fine')
    expect(f.length).toBe(256 * 256)
    let min = 1
    let max = 0
    for (const v of f) {
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
    expect(min).toBe(0)
    expect(max).toBe(1)
  })

  it('lets exactly the asked share of the paper through', () => {
    // coverage 0.3 = the 30 % highest peaks take colour
    const f = grainField('fine')
    const above = f.reduce((n, v) => n + (v > 1 - 0.3 ? 1 : 0), 0) / f.length
    expect(above).toBeGreaterThan(0.29)
    expect(above).toBeLessThan(0.31)
  })

  it('is always the same paper, so a picture looks the same after a restart', () => {
    expect(grainField('fine')).toBe(grainField('fine'))
    expect(grainField('coarse')[1234]).toBeCloseTo(grainField('coarse')[1234]!, 10)
  })

  it('has bigger grains for chalk than for pencil', () => {
    // neighbouring pixels of a coarse field are more alike than those of a fine one
    const diff = (f: Float32Array) => {
      let d = 0
      for (let y = 0; y < 256; y++) for (let x = 0; x < 255; x++) d += Math.abs(f[y * 256 + x]! - f[y * 256 + x + 1]!)
      return d
    }
    expect(diff(grainField('coarse'))).toBeLessThan(diff(grainField('fine')))
  })
})

describe('tool looks', () => {
  it('knows which tools paint into a stroke layer', () => {
    for (const t of ['pencil', 'graphite', 'felt', 'watercolor', 'chalk']) expect(isLayeredTool(t)).toBe(true)
    for (const t of ['oil', 'eraser', 'fill', 'pipette']) expect(isLayeredTool(t)).toBe(false)
  })

  it('lets transparent media darken what is under them, and covering media cover it', () => {
    expect(BRUSH_LOOK.felt.passes[0]!.blend).toBe('multiply')
    // coloured pencil is see-through wax: overlapping colours mix
    expect(BRUSH_LOOK.pencil.passes[0]!.blend).toBe('multiply')
    expect(BRUSH_LOOK.chalk.passes[0]!.blend).toBe('source-over')
    // watercolour is dry the moment it is on: the new colour covers the old one, and a thin second pass deepens it
    expect(BRUSH_LOOK.watercolor.passes[0]!.blend).toBe('source-over')
    expect(BRUSH_LOOK.watercolor.passes.length).toBeGreaterThan(1)
  })

  it('makes a stroke thicker the harder the pen is pressed, and exactly the brush size at a steady touch', () => {
    expect(widthFactor(0.7)).toBeCloseTo(1, 1)
    expect(widthFactor(0.1)).toBeLessThan(widthFactor(0.5))
    expect(widthFactor(0.5)).toBeLessThan(widthFactor(1))
    expect(widthFactor(1) / widthFactor(0.1)).toBeGreaterThan(3)
    // pressures outside 0–1 do not break the width
    expect(widthFactor(-1)).toBeGreaterThan(0)
    expect(widthFactor(7)).toBe(widthFactor(1))
  })

  it('knows how far each tool can leave paint from the line, at the firmest pressure', () => {
    for (const t of ['pencil', 'graphite', 'felt', 'watercolor', 'chalk'] as const) {
      expect(strokeReach(t, 20)).toBeGreaterThan(strokeReach(t, 10))
    }
    expect(strokeReach('watercolor', 20)).toBeGreaterThan(strokeReach('pencil', 20))
  })

  it('keeps the colour of an oil brush for the whole stroke', () => {
    const a = newOilState('#3366cc')
    expect(a.color).toEqual([0x33, 0x66, 0xcc])
  })
})

describe('helpers', () => {
  it('grows bounds around every point of a stroke', () => {
    const b = emptyBounds()
    growBounds(b, 10, 20, 5)
    growBounds(b, 40, 8, 5)
    expect(b).toEqual({ x0: 5, y0: 3, x1: 45, y1: 25 })
  })

  it('shades a colour lighter and darker, clamped to valid values', () => {
    expect(shade('#808080', 20)).toBe('rgb(148,148,148)')
    expect(shade('#808080', -20)).toBe('rgb(108,108,108)')
    expect(shade('#fff', 50)).toBe('rgb(255,255,255)')
    expect(shade('#000000', -50)).toBe('rgb(0,0,0)')
  })
})

describe('tip shapes', () => {
  it('offers round first and an oval to each side', () => {
    expect(TIP_SHAPES[0]).toBe('round')
    expect(tipOf('round').round).toBe(true)
    expect(tipOf('oval-left').angle).toBeCloseTo(-tipOf('oval-right').angle, 10)
  })

  it('has a distinct tip for every shape and knows its own names', () => {
    const keys = TIP_SHAPES.map((s) => JSON.stringify(tipOf(s)))
    expect(new Set(keys).size).toBe(TIP_SHAPES.length)
    for (const s of TIP_SHAPES) expect(isTipShape(s)).toBe(true)
    expect(isTipShape('triangle')).toBe(false)
    expect(isTipShape(3)).toBe(false)
  })

  it('has no stamps any more: every tip is pulled along the stroke', () => {
    for (const s of TIP_SHAPES) expect(['ellipse', 'rect']).toContain(tipOf(s).kind)
    expect(isTipShape('star')).toBe(false)
    expect(isTipShape('heart')).toBe(false)
    expect(isTipShape('square')).toBe(false)
  })

  it('makes flat tips thin across their length', () => {
    expect(tipOf('flat').ratio).toBeLessThan(0.5)
    expect(tipOf('tall').ratio).toBeLessThan(0.5)
  })
})
