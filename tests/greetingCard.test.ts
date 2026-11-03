import { describe, expect, it } from 'vitest'
import { cardLayout, cardLines, fitText } from '../src/utils/greetingCard'

const labels = { for: 'Für', paintedBy: 'Gemalt von {name}', paintedWith: 'Gemalt mit LambKing' }

describe('greeting card', () => {
  it('puts the picture inside a frame with room for the words underneath', () => {
    const L = cardLayout(1000, 700)
    expect(L.width).toBe(1000 + 2 * 60)
    expect(L.picX).toBe(60)
    expect(L.height).toBeGreaterThan(700 + 60 + 200)
    expect(L.titleY).toBeGreaterThan(L.picY + L.picH)
    expect(L.lineY).toBeGreaterThan(L.titleY)
    expect(L.signY).toBeGreaterThan(L.lineY)
    expect(L.signY).toBeLessThan(L.height)
  })

  it('keeps the same shape for any picture size', () => {
    const a = cardLayout(500, 700)
    const b = cardLayout(1000, 1400)
    expect(b.width / a.width).toBeCloseTo(2, 1)
    expect(b.titleSize / a.titleSize).toBeCloseTo(2, 0)
  })

  it('writes "Für Oma", the message and the painter', () => {
    expect(cardLines({ to: ' Oma ', line: 'Liebe Grüße', from: 'Mia' }, labels)).toEqual({
      title: 'Für Oma',
      line: 'Liebe Grüße',
      sign: 'Gemalt von Mia'
    })
  })

  it('invents nothing for empty fields', () => {
    expect(cardLines({ to: '', line: '', from: '' }, labels)).toEqual({ title: '', line: '', sign: 'Gemalt mit LambKing' })
  })

  it('shortens a line that is too wide', () => {
    const measure = (s: string) => s.length * 10
    expect(fitText('kurz', 100, measure)).toBe('kurz')
    const cut = fitText('ein sehr langer Gruss an die Oma', 120, measure)
    expect(cut.endsWith('…')).toBe(true)
    expect(measure(cut)).toBeLessThanOrEqual(130)
  })
})
