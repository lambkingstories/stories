import { beforeEach, describe, it, expect } from 'vitest'
import { sizedImage, widthFor, SIZED_WIDTHS } from '@/utils/sizedImage'

const COVER = 'https://lbs-be.onrender.com/uploads/previews/abc-123.jpg'

describe('sizedImage', () => {
  beforeEach(() => {
    // a phone with the usual three pixels per CSS pixel
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true })
  })

  it('adds the smallest sharp width for a picture of the book server', () => {
    expect(sizedImage(COVER, 95)).toBe(`${COVER}?w=320`)
    expect(sizedImage(COVER, 40)).toBe(`${COVER}?w=160`)
  })

  it('counts the pixel density up to 3', () => {
    expect(widthFor(95, 1)).toBe(160)
    expect(widthFor(95, 2)).toBe(240)
    expect(widthFor(95, 3)).toBe(320)
    expect(widthFor(95, 5)).toBe(320)
  })

  it('never asks for more than the largest width the server makes', () => {
    expect(widthFor(2000, 3)).toBe(SIZED_WIDTHS[SIZED_WIDTHS.length - 1])
  })

  it('leaves everything else alone', () => {
    expect(sizedImage('', 95)).toBe('')
    expect(sizedImage(undefined, 95)).toBe('')
    expect(sizedImage('/images/placeholder.webp', 95)).toBe('/images/placeholder.webp')
    expect(sizedImage('blob:https://x/1', 95)).toBe('blob:https://x/1')
    expect(sizedImage('https://example.test/cover.webp', 95)).toBe('https://example.test/cover.webp')
    expect(sizedImage(`${COVER}?w=480`, 95)).toBe(`${COVER}?w=480`)
    expect(sizedImage('https://lbs-be.onrender.com/uploads/files/book.pdf', 95)).toBe('https://lbs-be.onrender.com/uploads/files/book.pdf')
  })
})
