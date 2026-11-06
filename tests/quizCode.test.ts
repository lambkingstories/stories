import { describe, expect, it } from 'vitest'
import { KIND_COUNT, newKindCode, readKindCode } from '@/utils/quizCode'
import { mulberry32 } from '@/utils/familyCode'
import { isValidItem, toQuestion } from '@/data/bibleQuiz'

describe('round code with the kind of questions', () => {
  const size = (k: number) => 100 + k * 7

  it('reads back the kind and gives the same seed for the same code', () => {
    for (let kind = 0; kind < KIND_COUNT; kind++) {
      const code = newKindCode(kind, size(kind), mulberry32(kind + 1))
      const a = readKindCode(code, size)
      const b = readKindCode(code.toLowerCase().replace(/^(...)/, '$1-'), size)
      expect(a.ok && a.kind).toBe(kind)
      expect(b).toEqual(a)
    }
  })

  it('says "version" when this phone has another number of questions of that kind', () => {
    const code = newKindCode(2, size(2), mulberry32(5))
    const r = readKindCode(code, (k) => size(k) + 1)
    expect(r).toEqual({ ok: false, reason: 'version' })
  })

  it('says "format" for a text that is no code or names no kind', () => {
    expect(readKindCode('ABC', size)).toEqual({ ok: false, reason: 'format' })
    expect(readKindCode('0OI1XX', size)).toEqual({ ok: false, reason: 'format' })
    // the first character after the five kinds ("F") is no kind
    expect(readKindCode('FAAAAA', size)).toEqual({ ok: false, reason: 'format' })
  })
})

describe('Bible quiz data', () => {
  it('accepts a good item and turns it into a question', () => {
    const item = { id: 'l1-001', level: 1 as const, q: 'Q?', options: ['a', 'b', 'c', 'd'], answer: 2, ref: '1. Mose 7,12' }
    expect(isValidItem(item)).toBe(true)
    expect(toQuestion(item)).toMatchObject({ q: 'Q?', answer: 2, level: 1, ref: '1. Mose 7,12', journey: '' })
  })

  it('refuses items without a right answer, with doubled options or with a wrong level', () => {
    expect(isValidItem({ id: 'x', level: 1, q: 'Q', options: ['a', 'b'], answer: 5, ref: 'r' })).toBe(false)
    expect(isValidItem({ id: 'x', level: 1, q: 'Q', options: ['a', 'a', 'b'], answer: 0, ref: 'r' })).toBe(false)
    expect(isValidItem({ id: 'x', level: 4, q: 'Q', options: ['a', 'b'], answer: 0, ref: 'r' })).toBe(false)
  })
})
