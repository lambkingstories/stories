import { describe, expect, it } from 'vitest'
import { wrapLines } from '../src/utils/thanksCard'

const w = (s: string) => s.length * 10

describe('thank-you sheet: lines of words', () => {
  it('breaks at spaces and keeps every word', () => {
    const out = wrapLines('Danke für den Kuchen und für die Zeit mit dir', 150, w)
    expect(out.every((l) => w(l) <= 150)).toBe(true)
    expect(out.join(' ')).toBe('Danke für den Kuchen und für die Zeit mit dir')
  })

  it('keeps a paragraph break as an empty line', () => {
    expect(wrapLines('Eins\n\nZwei', 200, w)).toEqual(['Eins', '', 'Zwei'])
  })

  it('cuts a word that is wider than a line', () => {
    const out = wrapLines('Donaudampfschifffahrt', 80, w)
    expect(out.length).toBeGreaterThan(2)
    expect(out.every((l) => w(l) <= 80)).toBe(true)
    expect(out.join('')).toBe('Donaudampfschifffahrt')
  })

  it('gives nothing for an empty text', () => {
    expect(wrapLines('   ', 100, w)).toEqual([''])
  })
})
