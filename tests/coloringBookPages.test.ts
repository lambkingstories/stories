import { describe, expect, it } from 'vitest'
import { coloringPagesOfBook, isColoringBook, isColoringCategory, pageCaptionOf, pageImageOf } from '@/utils/coloringBook'

const book = (content: { page: number; title?: string; text: string }[], en?: typeof content) => ({
  localizations: { de: { content }, en: en ? { content: en } : null }
})

describe('coloringPagesOfBook', () => {
  it('takes the pictures in book order and skips pages that are only text', () => {
    const pages = coloringPagesOfBook(
      book([
        { page: 1, title: 'Intro', text: 'Willkommen!' },
        { page: 2, title: 'Gott macht die Sonne · 1. Mose 1,14–19', text: '![Ausmalbild: Sonne](https://x.test/a.png)\n\nGott macht die Sonne.' },
        { page: 3, title: 'Mond', text: '![Ausmalbild: Mond](https://x.test/b.jpg)' }
      ]),
      'de'
    )
    expect(pages.map((p) => p.n)).toEqual([1, 2])
    expect(pages[0]).toMatchObject({
      url: 'https://x.test/a.png',
      title: 'Gott macht die Sonne',
      reference: '1. Mose 1,14–19',
      text: 'Gott macht die Sonne.'
    })
    expect(pages[1]).toMatchObject({ title: 'Mond', reference: '', text: '' })
  })

  it('falls back to the picture description when the page has no title, and to German without a translation', () => {
    const pages = coloringPagesOfBook(book([{ page: 1, text: '![Ausmalbild: Der Mond](https://x.test/m.png)' }]), 'en')
    expect(pages).toHaveLength(1)
    expect(pages[0]!.title).toBe('Der Mond')
  })

  it('returns nothing for a book without pictures', () => {
    expect(coloringPagesOfBook(book([{ page: 1, text: 'Nur Text' }]), 'de')).toEqual([])
    expect(coloringPagesOfBook({}, 'de')).toEqual([])
  })
})

describe('isColoringCategory', () => {
  it('knows both spellings of Ausmalbücher', () => {
    expect(isColoringCategory('Ausmalbücher')).toBe(true)
    expect(isColoringCategory('Ausmahlbücher')).toBe(true)
    expect(isColoringCategory('Tiergeschichten')).toBe(false)
  })
})

describe('the new form of a page (own fields instead of markdown)', () => {
  const de = [
    { page: 1, title: 'Licht', image: 'https://x.test/1.webp', reference: '1. Mose 1,1', text: 'Am Anfang.' },
    { page: 2, title: 'Land', image: 'https://x.test/2.webp', reference: '', text: '' }
  ]

  it('reads picture, title, Bible passage and text from the fields', () => {
    const pages = coloringPagesOfBook({ localizations: { de: { content: de } } }, 'de')
    expect(pages).toEqual([
      { n: 1, url: 'https://x.test/1.webp', title: 'Licht', reference: '1. Mose 1,1', text: 'Am Anfang.' },
      { n: 2, url: 'https://x.test/2.webp', title: 'Land', reference: '', text: '' }
    ])
  })

  it('shows the pictures of the German book with the words of the other language (matched by picture)', () => {
    const en = [{ page: 1, title: 'Light', image: 'https://x.test/1.webp', reference: 'Genesis 1:1', text: '' }]
    const pages = coloringPagesOfBook({ localizations: { de: { content: de }, en: { content: en } } }, 'en')
    expect(pages.map((p) => p.title)).toEqual(['Light', 'Land'])
    expect(pages[0]).toMatchObject({ reference: 'Genesis 1:1', text: 'Am Anfang.' })
    expect(pages[1]!.url).toBe('https://x.test/2.webp')
  })

  it('uses the own pictures of a language in the old form', () => {
    const en = [{ page: 1, text: '![Ausmalbild: Moon](https://x.test/en.png)' }]
    const pages = coloringPagesOfBook({ localizations: { de: { content: de }, en: { content: en } } }, 'en')
    expect(pages.map((p) => p.url)).toEqual(['https://x.test/en.png'])
  })

  it('finds the picture and the words of a reader page in either form', () => {
    expect(pageImageOf(de[0])).toBe('https://x.test/1.webp')
    expect(pageImageOf({ text: 'x ![Ausmalbild: a](https://x.test/old.png)' })).toBe('https://x.test/old.png')
    expect(pageImageOf({ text: 'nur Text' })).toBe('')
    expect(pageCaptionOf(de[0]!)).toEqual({ title: 'Licht', reference: '1. Mose 1,1', text: 'Am Anfang.' })
    expect(pageCaptionOf({ title: 'Titel · Joh 1', text: '![Ausmalbild: t](https://x.test/o.png)\n\nSatz.' })).toEqual({ title: 'Titel', reference: 'Joh 1', text: 'Satz.' })
  })

  it('knows a coloring book by its kind first and by its category for older books', () => {
    expect(isColoringBook({ kind: 'coloring', category: 'Früchte' })).toBe(true)
    expect(isColoringBook({ kind: 'story', category: 'Ausmalbücher' })).toBe(false)
    expect(isColoringBook({ category: 'Ausmahlbücher' })).toBe(true)
    expect(isColoringBook(null)).toBe(false)
  })
})
