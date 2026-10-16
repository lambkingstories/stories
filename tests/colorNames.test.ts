import { describe, expect, it } from 'vitest'
import { colorName, hslOf } from '@/utils/colorNames'

describe('colour names', () => {
  it('names the basic colours in German', () => {
    expect(colorName('#E53935', 'de')).toBe('Rot')
    expect(colorName('#43A047', 'de')).toBe('Grün')
    expect(colorName('#1E5FD0', 'de')).toBe('Blau')
    expect(colorName('#FDD835', 'de')).toBe('Gelb')
    expect(colorName('#FB8C00', 'de')).toBe('Orange')
    expect(colorName('#8E24AA', 'de')).toBe('Violett')
    expect(colorName('#000000', 'de')).toBe('Schwarz')
    expect(colorName('#FFFFFF', 'de')).toBe('Weiß')
  })

  it('names them in English too', () => {
    expect(colorName('#E53935', 'en')).toBe('red')
    expect(colorName('#43A047', 'en')).toBe('green')
    expect(colorName('#3A3A3A', 'en')).toBe('dark grey')
  })

  it('tells light and dark colours apart', () => {
    expect(colorName('#94D3FB', 'de')).toBe('Hellblau')
    expect(colorName('#08287B', 'de')).toBe('Dunkelblau')
    expect(colorName('#94D3FB', 'en')).toBe('light blue')
    expect(colorName('#7D101E', 'en')).toBe('dark red')
  })

  it('knows pink, brown, beige and grey', () => {
    expect(colorName('#F4A6B7', 'de')).toBe('Rosa')
    expect(colorName('#6B3A1E', 'de')).toBe('Braun')
    expect(colorName('#F1DDB5', 'de')).toBe('Beige')
    expect(colorName('#8A8A8A', 'de')).toBe('Grau')
  })

  it('reads hue, saturation and lightness', () => {
    const [h, s, l] = hslOf('#FF0000')
    expect(h).toBe(0)
    expect(s).toBeCloseTo(1, 5)
    expect(l).toBeCloseTo(0.5, 5)
    expect(hslOf('#808080')[1]).toBe(0)
  })

  it('gives every colour of every box a name', () => {
    for (const hex of ['#FA4429', '#FDA012', '#FEEF37', '#BAE53B', '#168E3A', '#46CFC3', '#19549E', '#9251B7', '#FDAEBD', '#C87129']) {
      expect(colorName(hex, 'de').length).toBeGreaterThan(2)
    }
  })
})
