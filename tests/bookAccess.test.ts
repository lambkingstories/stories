import { describe, expect, it } from 'vitest'
import { freePageCount, previewTexts } from '@/use/useBookAccess'

describe('free part of a book', () => {
  it('gives a coloring book its first five pictures', () => {
    expect(freePageCount('coloring', 36)).toBe(5)
    expect(freePageCount('coloring', 20)).toBe(5)
    expect(freePageCount('coloring', 3)).toBe(3)
    // a book can have its own number
    expect(freePageCount('coloring', 36, 8)).toBe(8)
    expect(freePageCount('coloring', 36, 0)).toBe(0)
    expect(freePageCount('coloring', 4, 8)).toBe(4)
    expect(freePageCount('coloring', 36, null)).toBe(5)
  })

  it('gives every other book 15 % of its pages, rounded up, at least one page', () => {
    expect(freePageCount('story', 20)).toBe(3)
    expect(freePageCount('story', 100)).toBe(15)
    expect(freePageCount('story', 7)).toBe(2)
    expect(freePageCount('story', 3)).toBe(1)
    expect(freePageCount('story', 1)).toBe(1)
  })

  it('shows nothing of an empty book', () => {
    expect(freePageCount('story', 0)).toBe(0)
  })
})

describe('free start of a story', () => {
  const para = (n: number) => 'x'.repeat(n)

  it('shows about 15 % of a one-page story, ending with a whole paragraph', () => {
    // 10 paragraphs of 100 characters: 15 % = 150 characters, so two paragraphs
    const text = Array.from({ length: 10 }, () => para(100)).join('\n\n')
    const r = previewTexts([text])
    expect(r.cut).toBe(true)
    expect(r.texts).toHaveLength(1)
    expect(r.texts[0]!.split('\n\n')).toHaveLength(2)
  })

  it('shows at least the first paragraph', () => {
    const r = previewTexts([para(1000) + '\n\n' + para(10)])
    expect(r.texts[0]).toBe(para(1000))
    expect(r.cut).toBe(true)
  })

  it('drops the pages after the free part of a multi-page story', () => {
    const r = previewTexts([para(100), para(100), para(100), para(100), para(100), para(100), para(100), para(100), para(100), para(100)])
    expect(r.texts).toHaveLength(2)
    expect(r.cut).toBe(true)
  })

  it('cuts nothing when the first paragraph is everything', () => {
    expect(previewTexts([para(50)])).toEqual({ texts: [para(50)], cut: false })
    expect(previewTexts([''])).toEqual({ texts: [''], cut: false })
  })
})
