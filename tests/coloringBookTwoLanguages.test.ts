/**
 * A coloring book of the 9-12 series is one book with a German and an English text that share the same pictures (the import
 * writes the same picture addresses into both). The app must show the English words in English and the German ones in German,
 * and the shape must be what the AdminUI import writes (old form: picture as markdown in the text, passage after " · " in the title).
 */
import { describe, expect, it } from 'vitest'
import { coloringPagesOfBook, isColoringBook } from '@/utils/coloringBook'

const page = (n: number, title: string, ref: string, text: string, url: string) => ({
  page: n,
  title: `${title} · ${ref}`,
  text: `![Ausmalbild: ${title}](${url})\n\n${text}`
})

const book = {
  bookId: 'ba-12-david-und-goliath-mutig-mit-gott',
  category: 'Ausmalbücher',
  bookSeriesId: 'bibelgeschichten-zum-ausmalen',
  localizations: {
    de: {
      content: [
        page(1, 'David hütet die Schafe seines Vaters.', '1. Samuel 16,11', 'David war der Jüngste.', 'https://x/1.webp'),
        page(2, 'David liebt Gott.', '1. Samuel 16,18', 'Er spielte Harfe.', 'https://x/2.webp')
      ]
    },
    en: {
      content: [
        page(1, 'David tends his father’s sheep.', '1 Samuel 16:11', 'David was the youngest.', 'https://x/1.webp'),
        page(2, 'David loves God.', '1 Samuel 16:18', 'He played the harp.', 'https://x/2.webp')
      ]
    }
  }
}

describe('a coloring book with two languages', () => {
  it('is a coloring book through its category', () => {
    expect(isColoringBook(book)).toBe(true)
  })

  it('shows German words in German and English words in English, with the same pictures', () => {
    const de = coloringPagesOfBook(book, 'de')
    const en = coloringPagesOfBook(book, 'en')
    expect(de.map((p) => p.url)).toEqual(en.map((p) => p.url))
    expect(de[0]).toMatchObject({ title: 'David hütet die Schafe seines Vaters.', reference: '1. Samuel 16,11', text: 'David war der Jüngste.' })
    expect(en[1]).toMatchObject({ title: 'David loves God.', reference: '1 Samuel 16:18', text: 'He played the harp.' })
  })

  it('shows the German words when the book has no English text', () => {
    const only = { ...book, localizations: { de: book.localizations.de } }
    expect(coloringPagesOfBook(only, 'en')[0]!.title).toBe('David hütet die Schafe seines Vaters.')
  })
})
