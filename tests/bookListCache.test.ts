import { describe, expect, it } from 'vitest'
import type { ApiBook } from '@/types/apiBook'
import { slimBook } from '@/utils/bookListCache'

const story = (over: Partial<ApiBook> = {}): ApiBook =>
  ({
    bookId: 'tt-1',
    author: 'A',
    category: 'Gute Nacht',
    bookSeriesId: 's',
    releaseDate: '2026-01-01',
    updatedDate: '2026-01-01',
    badges: [],
    isPublished: true,
    localizations: {
      de: { title: 'Titel', shortDescription: 'k', description: 'l', content: [{ page: 1, title: 'S1', text: 'Langer Text' }, { page: 2, title: 'S2', text: 'Mehr Text' }] },
      en: { title: 'Title', shortDescription: 'k', description: 'l', content: [{ page: 1, title: 'P1', text: 'Long text' }] }
    },
    ...over
  }) as unknown as ApiBook

describe('slimBook (the list kept on the device)', () => {
  it('leaves the text of the pages out of a story and marks it lean', () => {
    const slim = slimBook(story())
    expect(slim.lean).toBe(true)
    expect(slim.localizations.de?.content).toEqual([{ page: 1, title: 'S1', text: '' }, { page: 2, title: 'S2', text: '' }])
    expect(slim.localizations.en?.content).toEqual([{ page: 1, title: 'P1', text: '' }])
    expect(slim.localizations.de?.title).toBe('Titel')
    expect(JSON.stringify(slim)).not.toContain('Langer Text')
  })

  it('does not change the book it is given', () => {
    const book = story()
    slimBook(book)
    expect(book.lean).toBeUndefined()
    expect(book.localizations.de?.content[0]?.text).toBe('Langer Text')
  })

  it('keeps a coloring book complete (its pages hold the pictures)', () => {
    const md = '![Ausmalbild: Arche](https://x.test/a.png)'
    const coloring = story({ category: 'Ausmalbücher', localizations: { de: { title: 'T', shortDescription: '', description: '', content: [{ page: 1, title: 'P', text: md }] } } } as Partial<ApiBook>)
    expect(slimBook(coloring)).toBe(coloring)
  })

  it('returns a book that is lean already as it is', () => {
    const lean = story({ lean: true })
    expect(slimBook(lean)).toBe(lean)
  })
})
