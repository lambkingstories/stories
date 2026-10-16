import { describe, it, expect } from 'vitest'
import { createBookSchema } from '../src/validators/book.schema.js'
import { Book } from '../src/models/Book.js'
import { sampleBook } from './helpers.js'
import { isColoringBook, isColoringCategory, leanBook, normalizeColoringPage } from '../src/utils/coloring.js'

describe('coloring helpers', () => {
  it('knows the old category names, in any Unicode form', () => {
    expect(isColoringCategory('Ausmalbücher')).toBe(true)
    expect(isColoringCategory('Ausmahlbücher')).toBe(true)
    expect(isColoringCategory('Ausmalbücher')).toBe(true)
    expect(isColoringCategory('Früchte')).toBe(false)
  })

  it('takes the kind first, the category name only for books without a kind', () => {
    expect(isColoringBook({ kind: 'coloring', category: 'Früchte' })).toBe(true)
    expect(isColoringBook({ kind: 'story', category: 'Ausmalbücher' })).toBe(false)
    expect(isColoringBook({ category: 'Ausmalbücher' })).toBe(true)
  })

  it('turns the markdown form of a page into fields', () => {
    const p = normalizeColoringPage({
      page: 1,
      title: 'Es werde Licht · 1. Mose 1,1–10',
      text: '![Ausmalbild: Licht](https://x.test/uploads/content-images/a.webp)\n\nAm Anfang ist alles dunkel.'
    })
    expect(p).toMatchObject({
      image: 'https://x.test/uploads/content-images/a.webp',
      title: 'Es werde Licht',
      reference: '1. Mose 1,1–10',
      text: 'Am Anfang ist alles dunkel.'
    })
  })

  it('leaves a page in the new form as it is, and a page without picture alone', () => {
    const page = { page: 2, title: 'T', image: 'https://x.test/a.webp', reference: 'R', text: '' }
    expect(normalizeColoringPage(page)).toEqual(page)
    const intro = { page: 3, title: 'Vorwort', text: 'Nur Text' }
    expect(normalizeColoringPage(intro)).toEqual(intro)
  })

  it('leaves the text out of story pages in the slim list, but not out of coloring pages', () => {
    const story = leanBook({ category: 'Früchte', localizations: { de: { content: [{ page: 1, title: 'A', text: 'lang' }] } } })
    expect(story).toMatchObject({ lean: true, localizations: { de: { content: [{ page: 1, title: 'A' }] } } })
    expect(JSON.stringify(story)).not.toContain('lang')
    const coloring = leanBook({ kind: 'coloring', category: 'x', localizations: { de: { content: [{ page: 1, title: 'A', image: 'i', text: 'kurz' }] } } })
    expect(JSON.stringify(coloring)).toContain('kurz')
    expect((coloring as { lean?: boolean }).lean).toBeUndefined()
  })
})

describe('coloring books: validator and model', () => {
  const coloring = () =>
    sampleBook({
      kind: 'coloring',
      freePages: 5,
      localizations: {
        de: {
          title: 'T',
          shortDescription: 's',
          description: 'd',
          content: [{ page: 1, title: 'Licht', image: 'https://x.test/uploads/content-images/1.webp', reference: '1. Mose 1,1' }]
        }
      }
    })

  it('accepts kind, free pages, and pages with a picture and no text', () => {
    const r = createBookSchema.safeParse({ body: coloring() })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.body.kind).toBe('coloring')
      expect(r.data.body.freePages).toBe(5)
      expect(r.data.body.localizations.de.content[0]).toMatchObject({ text: '', reference: '1. Mose 1,1' })
    }
  })

  it('makes a book without kind a story and rejects an unknown kind', () => {
    const r = createBookSchema.safeParse({ body: sampleBook() })
    expect(r.success && r.data.body.kind).toBe('story')
    expect(createBookSchema.safeParse({ body: sampleBook({ kind: 'comic' }) }).success).toBe(false)
  })

  it('has the new fields in the database model', () => {
    const doc = new Book({ ...coloring(), releaseDate: new Date('2026-01-15') })
    expect(doc.kind).toBe('coloring')
    expect(doc.freePages).toBe(5)
    expect(doc.localizations?.de?.content[0]).toMatchObject({ image: expect.stringContaining('1.webp'), reference: '1. Mose 1,1' })
    expect(doc.validateSync()).toBeUndefined()
    expect(new Book({}).kind).toBe('story')
  })
})
