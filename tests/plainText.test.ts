import { describe, expect, it } from 'vitest'
import { plainText } from '../src/utils/plainText'

describe('plainText', () => {
  it('takes pictures, headings and emphasis away', () => {
    expect(plainText('# Titel\n\n![bild](x.webp)\n\nEs war **einmal** ein *Lamm*.')).toBe('Titel\n\nEs war einmal ein Lamm.')
  })

  it('keeps the words of a link and drops html', () => {
    expect(plainText('Lies [hier](https://a.b) <span>mehr</span>.')).toBe('Lies hier mehr.')
  })

  it('removes list marks and rules', () => {
    expect(plainText('- eins\n- zwei\n\n---\n\n1. drei')).toBe('eins\nzwei\n\ndrei')
  })

  it('copes with empty input', () => {
    expect(plainText('')).toBe('')
  })
})
