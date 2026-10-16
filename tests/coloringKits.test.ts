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

  it('has more felt-tip colours than the first box', () => {
    expect(KIT_ARTWORK.marker.extra.length).toBeGreaterThanOrEqual(12)
  })

  it('watercolour and oil are boxes of brushes, not paint pans or tubes', () => {
    expect(KIT_ARTWORK.watercolor.variant).toBe('brushW')
    expect(KIT_ARTWORK.oil.variant).toBe('brushO')
    expect(KIT_ARTWORK.watercolor.base[0]?.src).toContain('brush-water')
    expect(KIT_ARTWORK.oil.base[0]?.src).toContain('brush-oil')
  })

  it('the bucket has its own row of paint buckets in many colours', () => {
    expect(KIT_ARTWORK.bucket.variant).toBe('bucket')
    expect(KIT_ARTWORK.bucket.base.length).toBeGreaterThanOrEqual(12)
    expect(KIT_ARTWORK.bucket.base[0]?.src).toContain('/bucket/')
  })

  it('has a rainbow item for the free colour picker in the paint boxes', () => {
    for (const id of ['pencil', 'marker', 'watercolor', 'oil', 'chalk', 'bucket'] as const) expect(KIT_ARTWORK[id].rainbow, id).not.toBeNull()
  })
})
