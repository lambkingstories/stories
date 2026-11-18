import { describe, expect, it } from 'vitest'
import { levelTarget } from '../src/utils/toepferLevels'
import { LOOK_FIRED, PAT_H, TEX, bellyOf, buildMaps, makePattern, makeSkin, maxRadius, paintVessel } from '../src/utils/toepferRender'

const flatClay = () => {
  const d = new Uint8ClampedArray(TEX * TEX * 4)
  for (let i = 0; i < TEX * TEX; i++) {
    d[i * 4] = 200
    d[i * 4 + 1] = 100
    d[i * 4 + 2] = 50
    d[i * 4 + 3] = 255
  }
  return d
}

describe('toepfer: the picture of a vessel', () => {
  const p = levelTarget(2)
  const S = 120
  const m = buildMaps(p, S, LOOK_FIRED, NaN)

  it('the buffer fits the vessel and the silhouette follows the profile', () => {
    expect(m.w).toBeGreaterThanOrEqual(Math.ceil(2 * maxRadius(p) * S))
    // the widest row of the picture is about the widest diameter
    let widest = 0
    for (let j = 0; j < m.h; j++) {
      let n = 0
      for (let i = 0; i < m.w; i++) if (m.cov[j * m.w + i]! > 128) n++
      widest = Math.max(widest, n)
    }
    expect(Math.abs(widest - 2 * maxRadius(p) * S)).toBeLessThan(4)
  })

  it('paints opaque clay inside and nothing outside; turning the wheel moves only the texture', () => {
    const skin = { colour: makeSkin(flatClay(), 'fired'), pattern: null, ink: [0, 0, 0] as const }
    const a = new Uint32Array(m.n)
    const b = new Uint32Array(m.n)
    paintVessel(m, a, skin, 0)
    paintVessel(m, b, skin, 77)
    const mid = Math.floor(m.rimRow + (m.baseRow - m.rimRow) / 2) * m.w + Math.floor(m.cx)
    expect((a[mid]! >>> 24) & 255).toBe(255)
    expect(a[0]).toBe(0)
    // the light is from the left: the left side is brighter than the right side at the same height
    const row = Math.floor(m.rimRow + (m.baseRow - m.rimRow) / 2) * m.w
    const left = a[row + Math.floor(m.cx - maxRadius(p) * S * 0.6)]! & 255
    const right = a[row + Math.floor(m.cx + maxRadius(p) * S * 0.6)]! & 255
    expect(left).toBeGreaterThan(right)
    // a flat colour has no texture: turning it changes nothing
    expect(b[mid]).toBe(a[mid])
  })

  it('an ornament appears only in the band round the belly, and a pattern has ink', () => {
    const tile = new Uint8ClampedArray(256 * 256 * 4).fill(255)
    for (let y = 100; y < 150; y++) for (let x = 100; x < 150; x++) tile.fill(20, (y * 256 + x) * 4, (y * 256 + x) * 4 + 3)
    const pat = makePattern(tile, 256, 256)
    expect(pat.length).toBe(TEX * PAT_H)
    expect(Math.max(...pat)).toBeGreaterThan(200)
    const withBand = buildMaps(p, S, LOOK_FIRED, bellyOf(p))
    const rows = new Set<number>()
    for (let j = 0; j < withBand.h; j++) for (let i = 0; i < withBand.w; i++) if (withBand.pv[j * withBand.w + i] !== 0xffff) rows.add(j)
    expect(rows.size).toBeGreaterThan(10)
    expect(rows.size).toBeLessThan(withBand.h * 0.8)
  })
})
