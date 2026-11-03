import { describe, expect, it } from 'vitest'
import { KIT_ARTWORK } from '@/data/coloringKits'

describe('colour boxes', () => {
  it('every box has its colours, each with a picture and a valid paint colour', () => {
    for (const [id, kit] of Object.entries(KIT_ARTWORK)) {
      expect(kit.base.length, id).toBeGreaterThan(0)
      for (const it of [...kit.base, ...kit.extra]) {
        expect(it.src, id).toMatch(/\.webp$/)
        expect(it.color, id).toMatch(/^#[0-9A-F]{6}$/i)
      }
    }
  })

  it('offers no sprite whose paint colour could not be read (pure black from the slicer)', () => {
    for (const [id, kit] of Object.entries(KIT_ARTWORK)) {
      for (const it of [...kit.base, ...kit.extra]) expect(it.color.toUpperCase(), id).not.toBe('#000000')
    }
  })

  it('the coloured pencil box has 12 basic colours (free) and 24 more (Plus), 36 in all, and no graphite pencils in it', () => {
    expect(KIT_ARTWORK.pencil.base.length).toBe(12)
    expect(KIT_ARTWORK.pencil.base.length + KIT_ARTWORK.pencil.extra.length).toBe(36)
    expect([...KIT_ARTWORK.pencil.base, ...KIT_ARTWORK.pencil.extra].every((i) => !i.tool)).toBe(true)
  })

  it('the pencil tool is a box of its own: a light and a dark graphite pencil and a white pencil that blends', () => {
    const box = KIT_ARTWORK.graphite
    expect(box.base.map((i) => i.tool)).toEqual(['graphite', 'graphite', 'whitepencil'])
    expect(box.extra).toHaveLength(0)
    expect(box.rainbow).toBeNull()
    // light, dark, white: the lightness of the paint colours
    const [light, dark, white] = box.base.map((i) => parseInt(i.color.slice(1, 3), 16))
    expect(light!).toBeGreaterThan(dark!)
    expect(white!).toBeGreaterThan(light!)
    // no pencil of this box is a coloured one of the other box
    expect(box.base.some((i) => KIT_ARTWORK.pencil.base.some((p) => p.src === i.src))).toBe(false)
  })

  it('the glitter markers are a box of their own with 24 colours (all of them Plus) and look like markers, not like the coloured pencils', () => {
    expect(KIT_ARTWORK.glitter.base).toHaveLength(24)
    expect(KIT_ARTWORK.glitter.extra).toHaveLength(0)
    expect(KIT_ARTWORK.glitter.variant).toBe('marker')
    expect(KIT_ARTWORK.glitter.base.some((i) => KIT_ARTWORK.pencil.base.some((p) => p.src === i.src))).toBe(false)
  })

  it('has more felt-tip colours than the first box', () => {
    expect(KIT_ARTWORK.marker.extra.length).toBeGreaterThanOrEqual(12)
  })

  it('watercolours lie in round white pans (the tool bar shows the brush), oil is a box of brushes', () => {
    expect(KIT_ARTWORK.watercolor.variant).toBe('pans')
    expect(KIT_ARTWORK.watercolor.base).toHaveLength(12)
    expect(KIT_ARTWORK.watercolor.base[0]?.src).toContain('/pan/')
    expect(KIT_ARTWORK.watercolor.toolSprites?.[0]?.src).toContain('wasserpinsel')
    expect(KIT_ARTWORK.oil.variant).toBe('brushO')
    expect(KIT_ARTWORK.oil.base[0]?.src).toContain('brush-oil')
  })

  it('the pouring tool shows fresh dabs of paint in the colour box and the watering can only in the tool bar', () => {
    expect(KIT_ARTWORK.bucket.variant).toBe('dabs')
    expect(KIT_ARTWORK.bucket.base.length).toBeGreaterThanOrEqual(12)
    expect(KIT_ARTWORK.bucket.base[0]?.src).toContain('/farbfleck/')
    expect(KIT_ARTWORK.bucket.toolSprites?.[0]?.src).toContain('/bucket/')
    // every dab paints with the colour of its can
    expect(KIT_ARTWORK.bucket.base.map((d) => d.color)).toEqual(KIT_ARTWORK.bucket.toolSprites!.map((c) => c.color))
  })

  it('has a rainbow item for the free colour picker in the paint boxes', () => {
    for (const id of ['pencil', 'marker', 'watercolor', 'oil', 'chalk', 'bucket'] as const) expect(KIT_ARTWORK[id].rainbow, id).not.toBeNull()
  })
})
